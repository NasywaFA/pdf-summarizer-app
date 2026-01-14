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
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

var pdfMagicNumbers = [][]byte{
	{0x25, 0x50, 0x44, 0x46},
}

const (
	MaxFileSize     = 3 * 1024 * 1024 
	MinFileSize     = 1024  
	AllowedMimeType = "application/pdf"
)

type PDFService interface {
	Create(ctx context.Context, file *multipart.FileHeader) (*model.PDF, error)
	GetByID(ctx context.Context, id uuid.UUID) (*model.PDF, error)
	GetAll(ctx context.Context, params validation.QueryParams) ([]model.PDF, *model.PaginationMeta, error)
	Delete(ctx context.Context, id uuid.UUID) error
	UpdateStatus(ctx context.Context, id uuid.UUID, status string) error
}

type pdfService struct {
	Log      *logrus.Logger
	DB       *gorm.DB
	Validate *validator.Validate
}

func NewPDFService(db *gorm.DB, validate *validator.Validate) PDFService {
	return &pdfService{
		Log:      utils.Log,
		DB:       db,
		Validate: validate,
	}
}

func (s *pdfService) normalizePathForURL(path string) string {
	return strings.ReplaceAll(path, "\\", "/")
}

func (s *pdfService) validatePDFFile(file multipart.File) error {
	header := make([]byte, 4)
	_, err := file.Read(header)
	if err != nil {
		return fmt.Errorf("failed to read file header: %w", err)
	}

	_, err = file.Seek(0, 0)
	if err != nil {
		return fmt.Errorf("failed to reset file pointer: %w", err)
	}

	isValidPDF := false
	for _, magic := range config.PDFMagicNumbers {
		if bytes.Equal(header, magic) {
			isValidPDF = true
			break
		}
	}

	if !isValidPDF {
		return fmt.Errorf("file is not a valid PDF (invalid magic number)")
	}

	return nil
}

func (s *pdfService) validateFileSize(size int64) error {
	if size < config.MinFileSize {
		return fmt.Errorf("file is too small (minimum %d KB)", config.GetMinFileSizeKB())
	}

	if size > config.MaxFileSize {
		return fmt.Errorf("file is too large (maximum %d MB)", config.GetMaxFileSizeMB())
	}

	return nil
}

func (s *pdfService) validateFileExtension(filename string) error {
	ext := filepath.Ext(filename)
	if ext != ".pdf" && ext != ".PDF" {
		return fmt.Errorf("invalid file extension: %s (must be .pdf)", ext)
	}
	return nil
}

func (s *pdfService) sanitizeFilename(filename string) string {
	filename = filepath.Base(filename)
	
	safe := ""
	for _, char := range filename {
		if (char >= 'a' && char <= 'z') || 
			(char >= 'A' && char <= 'Z') || 
			(char >= '0' && char <= '9') || 
			char == '.' || char == '-' || char == '_' {
			safe += string(char)
		} else {
			safe += "_"
		}
	}
	
	return safe
}

func (s *pdfService) Create(ctx context.Context, file *multipart.FileHeader) (*model.PDF, error) {
	pdfID := uuid.New()

	s.createProcessingLog(ctx, "pdf", pdfID, "upload", "started", "Starting PDF upload", nil)

	if err := s.validateFileSize(file.Size); err != nil {
		s.createProcessingLog(ctx, "pdf", pdfID, "upload", "failed", "File size validation failed", map[string]interface{}{
			"error": err.Error(),
			"size":  file.Size,
		})
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	if err := s.validateFileExtension(file.Filename); err != nil {
		s.createProcessingLog(ctx, "pdf", pdfID, "upload", "failed", "File extension validation failed", map[string]interface{}{
			"error":    err.Error(),
			"filename": file.Filename,
		})
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	src, err := file.Open()
	if err != nil {
		s.createProcessingLog(ctx, "pdf", pdfID, "upload", "failed", "Failed to open file", map[string]interface{}{
			"error": err.Error(),
		})
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer src.Close()

	if err := s.validatePDFFile(src); err != nil {
		s.createProcessingLog(ctx, "pdf", pdfID, "upload", "failed", "PDF magic number validation failed", map[string]interface{}{
			"error":    err.Error(),
			"filename": file.Filename,
		})
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		s.createProcessingLog(ctx, "pdf", pdfID, "upload", "failed", "Failed to create upload directory", map[string]interface{}{
			"error": err.Error(),
		})
		return nil, fmt.Errorf("failed to create upload directory: %w", err)
	}

	sanitizedName := s.sanitizeFilename(file.Filename)
	filename := fmt.Sprintf("%s_%s", pdfID.String(), sanitizedName)
	filePath := filepath.Join(uploadDir, filename)
	
	normalizedPath := s.normalizePathForURL(filePath)
	fileURL := fmt.Sprintf("/uploads/%s", filename)

	_, err = src.Seek(0, 0)
	if err != nil {
		s.createProcessingLog(ctx, "pdf", pdfID, "upload", "failed", "Failed to reset file pointer", map[string]interface{}{
			"error": err.Error(),
		})
		return nil, fmt.Errorf("failed to reset file pointer: %w", err)
	}

	dst, err := os.Create(filePath)
	if err != nil {
		s.createProcessingLog(ctx, "pdf", pdfID, "upload", "failed", "Failed to create destination file", map[string]interface{}{
			"error": err.Error(),
		})
		return nil, fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()

	written, err := io.Copy(dst, src)
	if err != nil {
		os.Remove(filePath)
		s.createProcessingLog(ctx, "pdf", pdfID, "upload", "failed", "Failed to save file content", map[string]interface{}{
			"error": err.Error(),
		})
		return nil, fmt.Errorf("failed to save file: %w", err)
	}

	if written != file.Size {
		os.Remove(filePath)
		s.createProcessingLog(ctx, "pdf", pdfID, "upload", "failed", "File size mismatch", map[string]interface{}{
			"expected": file.Size,
			"actual":   written,
		})
		return nil, fmt.Errorf("file size mismatch: expected %d, got %d", file.Size, written)
	}

	pdf := &model.PDF{
		ID:           pdfID,
		Filename:     filename,
		OriginalName: file.Filename,
		FilePath:     normalizedPath,
		FileSize:     file.Size,
		MimeType:     AllowedMimeType,
		Status:       "pending",
		UploadedAt:   time.Now(),
		UpdatedAt:    time.Now(),
		URL:          fileURL,
	}

	if err := s.DB.WithContext(ctx).Create(pdf).Error; err != nil {
		os.Remove(filePath)
		s.createProcessingLog(ctx, "pdf", pdfID, "upload", "failed", "Failed to create PDF record in database", map[string]interface{}{
			"error": err.Error(),
		})
		return nil, fmt.Errorf("failed to create PDF record: %w", err)
	}

	s.createProcessingLog(ctx, "pdf", pdfID, "upload", "success", "PDF uploaded successfully", map[string]interface{}{
		"filename":       file.Filename,
		"size":           file.Size,
		"sanitized_name": sanitizedName,
		"file_path":      normalizedPath,
	})

	return pdf, nil
}

func (s *pdfService) GetByID(ctx context.Context, id uuid.UUID) (*model.PDF, error) {
	var pdf model.PDF
	if err := s.DB.WithContext(ctx).Where("id = ?", id).First(&pdf).Error; err != nil {
		return nil, err
	}
	return &pdf, nil
}

func (s *pdfService) GetAll(ctx context.Context, params validation.QueryParams) ([]model.PDF, *model.PaginationMeta, error) {
	var pdfs []model.PDF
	var total int64

	query := s.DB.WithContext(ctx).Model(&model.PDF{})

	if params.Search != "" {
		query = query.Where("original_name ILIKE ?", "%"+params.Search+"%")
	}

	if params.Status != "" {
		query = query.Where("status = ?", params.Status)
	}

	if params.DateFrom != "" {
		query = query.Where("uploaded_at >= ?", params.DateFrom+" 00:00:00")
	}

	if params.DateTo != "" {
		query = query.Where("uploaded_at <= ?", params.DateTo+" 23:59:59")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, nil, err
	}

	validSortFields := map[string]string{
		"uploaded_at":   "uploaded_at",
		"updated_at":    "updated_at",
		"original_name": "original_name",
		"status":        "status",
	}

	sortField := validSortFields[params.SortBy]
	if sortField == "" {
		sortField = "uploaded_at"
	}

	sortOrder := "DESC"
	if params.SortOrder == "asc" {
		sortOrder = "ASC"
	}

	query = query.Order(sortField + " " + sortOrder)
	query = query.Limit(params.Limit).Offset(params.GetOffset())

	if err := query.Find(&pdfs).Error; err != nil {
		return nil, nil, err
	}

	meta := model.NewPaginationMeta(params.Page, params.Limit, total)

	return pdfs, &meta, nil
}

func (s *pdfService) Delete(ctx context.Context, id uuid.UUID) error {
	pdf, err := s.GetByID(ctx, id)
	if err != nil {
		return err
	}

	s.createProcessingLog(ctx, "pdf", id, "delete", "started", "Starting PDF deletion", nil)

	if err := s.DB.WithContext(ctx).Delete(&model.PDF{}, id).Error; err != nil {
		s.createProcessingLog(ctx, "pdf", id, "delete", "failed", "Failed to delete PDF from database", map[string]interface{}{
			"error": err.Error(),
		})
		return err
	}

	osFilePath := strings.ReplaceAll(pdf.FilePath, "/", string(filepath.Separator))
	if err := os.Remove(osFilePath); err != nil {
		s.Log.WithError(err).Warn("Failed to delete file from disk")
	}

	s.createProcessingLog(ctx, "pdf", id, "delete", "success", "PDF deleted successfully", nil)

	return nil
}

func (s *pdfService) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	return s.DB.WithContext(ctx).Model(&model.PDF{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":     status,
			"updated_at": time.Now(),
		}).Error
}

func (s *pdfService) createProcessingLog(ctx context.Context, entityType string, entityID uuid.UUID, action, status, message string, metadata map[string]interface{}) {
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