package service

import (
	"app/src/model"
	"app/src/utils"

	"context"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type PDFService interface {
	Create(ctx context.Context, file *multipart.FileHeader) (*model.PDF, error)
	GetByID(ctx context.Context, id uuid.UUID) (*model.PDF, error)
	GetAll(ctx context.Context) ([]model.PDF, error)
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

func (s *pdfService) Create(ctx context.Context, file *multipart.FileHeader) (*model.PDF, error) {
	pdfID := uuid.New()

	s.createProcessingLog(ctx, "pdf", pdfID, "upload", "started", "Starting PDF upload", nil)

	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		s.createProcessingLog(ctx, "pdf", pdfID, "upload", "failed", "Failed to create upload directory", map[string]interface{}{"error": err.Error()})
		return nil, fmt.Errorf("failed to create upload directory: %w", err)
	}

	filename := fmt.Sprintf("%s_%s", pdfID.String(), filepath.Base(file.Filename))
	filePath := filepath.Join(uploadDir, filename)
	fileURL := fmt.Sprintf("/uploads/%s", filename) 

	src, err := file.Open()
	if err != nil {
		s.createProcessingLog(ctx, "pdf", pdfID, "upload", "failed", "Failed to open uploaded file", map[string]interface{}{"error": err.Error()})
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer src.Close()

	dst, err := os.Create(filePath)
	if err != nil {
		s.createProcessingLog(ctx, "pdf", pdfID, "upload", "failed", "Failed to create file on disk", map[string]interface{}{"error": err.Error()})
		return nil, fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()

	if _, err := dst.ReadFrom(src); err != nil {
		s.createProcessingLog(ctx, "pdf", pdfID, "upload", "failed", "Failed to save file", map[string]interface{}{"error": err.Error()})
		return nil, fmt.Errorf("failed to save file: %w", err)
	}

	pdf := &model.PDF{
		ID:           pdfID,
		Filename:     filename,
		OriginalName: file.Filename,
		FilePath:     filePath,
		FileSize:     file.Size,
		MimeType:     file.Header.Get("Content-Type"),
		Status:       "pending",
		UploadedAt:   time.Now(),
		UpdatedAt:    time.Now(),
		URL:          fileURL,
	}

	if err := s.DB.WithContext(ctx).Create(pdf).Error; err != nil {
		os.Remove(filePath)
		s.createProcessingLog(ctx, "pdf", pdfID, "upload", "failed", "Failed to create PDF record in database", map[string]interface{}{"error": err.Error()})
		return nil, fmt.Errorf("failed to create PDF record: %w", err)
	}

	s.createProcessingLog(ctx, "pdf", pdfID, "upload", "success", "PDF uploaded successfully", map[string]interface{}{
		"filename": file.Filename,
		"size":     file.Size,
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

func (s *pdfService) GetAll(ctx context.Context) ([]model.PDF, error) {
	var pdfs []model.PDF
	if err := s.DB.WithContext(ctx).Order("uploaded_at DESC").Find(&pdfs).Error; err != nil {
		return nil, err
	}
	return pdfs, nil
}

func (s *pdfService) Delete(ctx context.Context, id uuid.UUID) error {
	pdf, err := s.GetByID(ctx, id)
	if err != nil {
		return err
	}

	s.createProcessingLog(ctx, "pdf", id, "delete", "started", "Starting PDF deletion", nil)

	if err := s.DB.WithContext(ctx).Delete(&model.PDF{}, id).Error; err != nil {
		s.createProcessingLog(ctx, "pdf", id, "delete", "failed", "Failed to delete PDF from database", map[string]interface{}{"error": err.Error()})
		return err
	}

	if err := os.Remove(pdf.FilePath); err != nil {
		s.Log.WithError(err).Warn("Failed to delete file from disk")
	}

	s.createProcessingLog(ctx, "pdf", id, "delete", "success", "PDF deleted successfully", nil)

	return nil
}

func (s *pdfService) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	if err := s.DB.WithContext(ctx).Model(&model.PDF{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":     status,
		"updated_at": time.Now(),
	}).Error; err != nil {
		return err
	}
	return nil
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
