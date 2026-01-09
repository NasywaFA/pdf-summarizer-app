package service

import (
	"app/src/config"
	"app/src/model"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type SummaryService interface {
	GetByID(ctx context.Context, id uuid.UUID) (*model.Summary, error)
	GetAll(ctx context.Context, pdfID uuid.UUID) ([]model.Summary, error)
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
		Log:      logrus.New(),
		DB:       db,
		Validate: validate,
	}
}

func (s *summaryService) GetByID(ctx context.Context, id uuid.UUID) (*model.Summary, error) {
	var summary model.Summary
	if err := s.DB.WithContext(ctx).Where("id = ?", id).First(&summary).Error; err != nil {
		return nil, err
	}
	return &summary, nil
}

func (s *summaryService) GetAll(ctx context.Context, pdfID uuid.UUID) ([]model.Summary, error) {
	var summaries []model.Summary
	if err := s.DB.WithContext(ctx).Where("pdf_id = ?", pdfID).Order("created_at DESC").Find(&summaries).Error; err != nil {
		return nil, err
	}
	return summaries, nil
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
		s.createProcessingLog(ctx, "summary", summaryID, "generate", "failed", "Failed to create summary record", map[string]interface{}{"error": err.Error()})
		return nil, fmt.Errorf("failed to create summary: %w", err)
	}

	s.createProcessingLog(ctx, "summary", summaryID, "generate", "processing", "Summary record created, calling AI service", nil)

	go s.callAIService(context.Background(), summary)

	return summary, nil
}

func (s *summaryService) Update(ctx context.Context, id uuid.UUID, content string) error {
	updates := map[string]interface{}{
		"content":   content,
		"is_edited": true,
	}

	return s.DB.WithContext(ctx).Model(&model.Summary{}).Where("id = ?", id).Updates(updates).Error
}

func (s *summaryService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.DB.WithContext(ctx).Delete(&model.Summary{}, id).Error
}

func (s *summaryService) UpdateStatus(ctx context.Context, id uuid.UUID, status string, content string) error {
	updates := map[string]interface{}{"status": status}
	if content != "" {
		updates["content"] = content
	}
	return s.DB.WithContext(ctx).Model(&model.Summary{}).Where("id = ?", id).Updates(updates).Error
}

func (s *summaryService) getPDF(ctx context.Context, pdfID uuid.UUID) (*model.PDF, error) {
	var pdf model.PDF
	if err := s.DB.WithContext(ctx).First(&pdf, "id = ? AND deleted_at IS NULL", pdfID).Error; err != nil {
		return nil, fmt.Errorf("pdf not found: %w", err)
	}
	return &pdf, nil
}

func (s *summaryService) callAIService(ctx context.Context, summary *model.Summary) {
    pdf := &model.PDF{}
	if err := s.DB.First(pdf, "id = ?", summary.PDFID).Error; err != nil {
		s.Log.Error("Failed to get PDF info:", err)
		s.UpdateStatus(ctx, summary.ID, "failed", "")
		return
	}

    body := &bytes.Buffer{}
    writer := multipart.NewWriter(body)

    writer.WriteField("language", summary.Language)
    writer.WriteField("style", summary.Style)

    pdfFile, err := os.Open(pdf.FilePath)
    if err != nil {
        s.Log.Error("Failed to open PDF file:", err)
        s.UpdateStatus(ctx, summary.ID, "failed", "")
        return
    }
    defer pdfFile.Close()

    fw, err := writer.CreateFormFile("file", pdf.OriginalName)
    if err != nil {
        s.Log.Error("Failed to create form file:", err)
        s.UpdateStatus(ctx, summary.ID, "failed", "")
        return
    }

    if _, err := io.Copy(fw, pdfFile); err != nil {
        s.Log.Error("Failed to copy PDF content:", err)
        s.UpdateStatus(ctx, summary.ID, "failed", "")
        return
    }

    writer.Close()

    req, _ := http.NewRequest("POST", config.MLServiceURL+"/summarize", body)
    req.Header.Set("Content-Type", writer.FormDataContentType())

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        s.Log.Error("AI service request failed:", err)
        s.UpdateStatus(ctx, summary.ID, "failed", "")
        return
    }
    defer resp.Body.Close()

    respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		s.Log.Error("Failed to read AI response:", err)
		s.UpdateStatus(ctx, summary.ID, "failed", "")
		return
	}

	var parsed interface{}
	if err := json.Unmarshal(respBody, &parsed); err != nil {
		s.Log.Error("Failed to parse AI response JSON:", err)
		s.UpdateStatus(ctx, summary.ID, "failed", "")
		return
	}

	cleanJSON, err := encodeJSONNoEscape(parsed)
	if err != nil {
		s.Log.Error("Failed to encode AI response:", err)
		s.UpdateStatus(ctx, summary.ID, "failed", "")
		return
	}

	s.UpdateStatus(ctx, summary.ID, "completed", cleanJSON)
}

func (s *summaryService) failSummary(ctx context.Context, id uuid.UUID, msg string, err error) {
	meta := map[string]interface{}{}
	if err != nil {
		meta["error"] = err.Error()
	}

	_ = s.UpdateStatus(ctx, id, "failed", "")
	s.createProcessingLog(ctx, "summary", id, "generate", "failed", msg, meta)
}

func encodeJSONNoEscape(v interface{}) (string, error) {
	var buf bytes.Buffer
	enc := json.NewEncoder(&buf)
	enc.SetEscapeHTML(false)
	err := enc.Encode(v)
	return buf.String(), err
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
