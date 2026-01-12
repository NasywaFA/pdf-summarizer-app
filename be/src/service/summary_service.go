package service

import (
	"app/src/config"
	"app/src/model"
	"app/src/utils"
	"app/src/validation"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type SummaryService interface {
	GetByID(ctx context.Context, id uuid.UUID) (*model.Summary, error)
	GetAll(ctx context.Context, pdfID uuid.UUID, params validation.QueryParams) ([]model.Summary, *model.PaginationMeta, error)
	Create(ctx context.Context, pdfID uuid.UUID, language, style string) (*model.Summary, error)
	Update(ctx context.Context, id uuid.UUID, content string) error
	Delete(ctx context.Context, id uuid.UUID) error
	UpdateStatus(ctx context.Context, id uuid.UUID, status string, content string) error
}

type summaryService struct {
	Log      *logrus.Logger
	DB       *gorm.DB
	Validate *validator.Validate
}

func NewSummaryService(db *gorm.DB, validate *validator.Validate) SummaryService {
	return &summaryService{
		Log:      utils.Log,
		DB:       db,
		Validate: validate,
	}
}

func (s *summaryService) GetByID(ctx context.Context, id uuid.UUID) (*model.Summary, error) {
	var summary model.Summary
	if err := s.DB.WithContext(ctx).First(&summary, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &summary, nil
}

func (s *summaryService) GetAll(ctx context.Context, pdfID uuid.UUID, params validation.QueryParams) ([]model.Summary, *model.PaginationMeta, error) {
	var summaries []model.Summary
	var total int64

	// defaults
	if params.Page < 1 {
		params.Page = 1
	}
	if params.Limit < 1 {
		params.Limit = 10
	}
	if params.SortBy == "" {
		params.SortBy = "created_at"
	}
	if params.SortOrder == "" {
		params.SortOrder = "desc"
	}

	allowedSort := map[string]string{
		"created_at": "created_at",
		"updated_at": "updated_at",
	}

	sortField, ok := allowedSort[params.SortBy]
	if !ok {
		sortField = "created_at"
	}

	sortOrder := "DESC"
	if params.SortOrder == "asc" {
		sortOrder = "ASC"
	}

	query := s.DB.WithContext(ctx).Model(&model.Summary{}).
		Where("pdf_id = ?", pdfID)

	if params.Search != "" {
		query = query.Where("content ILIKE ?", "%"+params.Search+"%")
	}
	if params.Status != "" {
		query = query.Where("status = ?", params.Status)
	}
	if params.Language != "" {
		query = query.Where("language = ?", params.Language)
	}
	if params.Style != "" {
		query = query.Where("style = ?", params.Style)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, nil, err
	}

	query = query.Order(fmt.Sprintf("%s %s", sortField, sortOrder)).
		Limit(params.Limit).
		Offset(params.GetOffset())

	if err := query.Find(&summaries).Error; err != nil {
		return nil, nil, err
	}

	meta := model.NewPaginationMeta(params.Page, params.Limit, total)
	return summaries, &meta, nil
}

func (s *summaryService) Create(ctx context.Context, pdfID uuid.UUID, language, style string) (*model.Summary, error) {
	summaryID := uuid.New()

	s.createProcessingLog(ctx, "summary", summaryID, "generate", "started", "Starting summary generation", map[string]interface{}{
		"pdf_id":   pdfID.String(),
		"language": language,
		"style":    style,
	})

	summary := &model.Summary{
		ID:       summaryID,
		PDFID:    pdfID,
		Language: language,
		Style:    style,
		Status:   "processing",
		IsEdited: false,
	}

	if err := s.DB.WithContext(ctx).Create(summary).Error; err != nil {
		s.failSummary(ctx, summaryID, "Failed to create summary record", err)
		return nil, err
	}

	go s.callAIService(context.Background(), summary)

	return summary, nil
}

func (s *summaryService) Update(ctx context.Context, id uuid.UUID, content string) error {
	return s.DB.WithContext(ctx).Model(&model.Summary{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"content":    content,
			"is_edited":  true,
			"updated_at": time.Now(),
		}).Error
}

func (s *summaryService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.DB.WithContext(ctx).Delete(&model.Summary{}, id).Error
}

func (s *summaryService) UpdateStatus(ctx context.Context, id uuid.UUID, status string, content string) error {
	updates := map[string]interface{}{
		"status":     status,
		"updated_at": time.Now(),
	}
	if content != "" {
		updates["content"] = content
	}

	return s.DB.WithContext(ctx).Model(&model.Summary{}).
		Where("id = ?", id).
		Updates(updates).Error
}

func (s *summaryService) callAIService(ctx context.Context, summary *model.Summary) {
	start := time.Now()

	pdf := &model.PDF{}
	if err := s.DB.WithContext(ctx).First(pdf, "id = ?", summary.PDFID).Error; err != nil {
		s.failSummary(ctx, summary.ID, "PDF not found", err)
		return
	}

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	_ = writer.WriteField("language", summary.Language)
	_ = writer.WriteField("style", summary.Style)

	file, err := os.Open(pdf.FilePath)
	if err != nil {
		s.failSummary(ctx, summary.ID, "Failed to open PDF", err)
		return
	}
	defer file.Close()

	fw, err := writer.CreateFormFile("file", pdf.OriginalName)
	if err != nil {
		s.failSummary(ctx, summary.ID, "Failed to create form file", err)
		return
	}
	if _, err := io.Copy(fw, file); err != nil {
		s.failSummary(ctx, summary.ID, "Failed to copy PDF", err)
		return
	}
	writer.Close()

	req, err := http.NewRequest("POST", config.MLServiceURL+"/summarize", body)
	if err != nil {
		s.failSummary(ctx, summary.ID, "Failed to create request", err)
		return
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{
		Timeout: 2 * time.Minute,
	}
	resp, err := client.Do(req)

	if err != nil {
		s.failSummary(ctx, summary.ID, "AI request failed", err)
		return
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		s.failSummary(ctx, summary.ID, "Failed to read AI response", err)
		return
	}

	if resp.StatusCode != 200 {
		errMsg := strings.TrimSpace(string(respBody))
		if errMsg == "" {
			errMsg = fmt.Sprintf("AI returned status %d", resp.StatusCode)
		}
		s.failSummary(ctx, summary.ID, "AI service error", fmt.Errorf(errMsg))
		return
	}

	var parsed map[string]interface{}
	if err := json.Unmarshal(respBody, &parsed); err != nil {
		s.failSummary(ctx, summary.ID, "Invalid AI JSON response", err)
		return
	}

	var content string

	if v, ok := parsed["content"]; ok {
		content = fmt.Sprintf("%v", v)
	} else if v, ok := parsed["summary"]; ok {
		content = fmt.Sprintf("%v", v)
	} else if v, ok := parsed["result"]; ok {
		content = fmt.Sprintf("%v", v)
	} else if data, ok := parsed["data"].(map[string]interface{}); ok {
		if v, ok := data["content"]; ok {
			content = fmt.Sprintf("%v", v)
		} else if v, ok := data["summary"]; ok {
			content = fmt.Sprintf("%v", v)
		}
	}

	content = strings.TrimSpace(content)
	if content == "" {
		s.failSummary(ctx, summary.ID, "AI response missing or empty content", nil)
		return
	}

	processingTime := time.Since(start).Milliseconds()

	metadata := map[string]interface{}{
		"processing_time_ms": processingTime,
		"ai_model":           parsed["model"],
	}

	metadataJSON, _ := json.Marshal(metadata)

	if err := s.DB.WithContext(ctx).Model(&model.Summary{}).
		Where("id = ?", summary.ID).
		Updates(map[string]interface{}{
			"content":  content,
			"metadata": string(metadataJSON),
			"status":   "completed",
		}).Error; err != nil {

		s.createProcessingLog(ctx, "summary", summary.ID, "generate", "failed", "Failed to update summary", map[string]interface{}{
			"error": err.Error(),
		})
		return
	}

	s.createProcessingLog(ctx, "summary", summary.ID, "generate", "completed", "Summary generated successfully", map[string]interface{}{
		"content_length":     len(content),
		"processing_time_ms": processingTime,
	})
}

func (s *summaryService) failSummary(ctx context.Context, id uuid.UUID, msg string, err error) {
	meta := map[string]interface{}{}
	if err != nil {
		meta["error"] = err.Error()
	}

	metaJSON, _ := json.Marshal(meta)

	_ = s.DB.WithContext(ctx).Model(&model.Summary{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":   "failed",
			"metadata": string(metaJSON),
		}).Error

	s.createProcessingLog(ctx, "summary", id, "generate", "failed", msg, meta)
}

func encodeJSONNoEscape(v interface{}) (string, error) {
	var buf bytes.Buffer
	enc := json.NewEncoder(&buf)
	enc.SetEscapeHTML(false)
	return buf.String(), enc.Encode(v)
}

func (s *summaryService) createProcessingLog(ctx context.Context, entityType string, entityID uuid.UUID, action, status, message string, metadata map[string]interface{}) {
	var metaJSON *json.RawMessage
	if metadata != nil {
		b, _ := json.Marshal(metadata)
		raw := json.RawMessage(b)
		metaJSON = &raw
	}

	log := &model.ProcessingLog{
		EntityType: entityType,
		EntityID:   entityID,
		Action:     action,
		Status:     status,
		Message:    message,
		Metadata:   metaJSON,
		CreatedAt:  time.Now(),
	}

	if err := s.DB.WithContext(ctx).Create(log).Error; err != nil {
		s.Log.WithError(err).Error("Failed to create processing log")
	}
}
