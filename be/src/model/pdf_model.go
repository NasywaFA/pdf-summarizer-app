package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PDF struct {
	ID           uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey;column:id" json:"id"`
	Filename     string         `gorm:"type:varchar(255);not null;column:filename" json:"filename"`
	OriginalName string         `gorm:"type:varchar(255);not null;column:original_name" json:"original_name"`
	FilePath     string         `gorm:"type:varchar(500);not null;column:file_path" json:"file_path"`
	FileSize     int64          `gorm:"type:bigint;not null;column:file_size" json:"file_size"`
	MimeType     string         `gorm:"type:varchar(100);column:mime_type" json:"mime_type"`
	Status       string         `gorm:"type:varchar(20);not null;default:'pending';column:status" json:"status"`
	UploadedAt   time.Time      `gorm:"type:timestamp;default:now();column:uploaded_at" json:"uploaded_at"`
	UpdatedAt    time.Time      `gorm:"type:timestamp;default:now();column:updated_at" json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"type:timestamp;column:deleted_at" json:"deleted_at,omitempty"`

	URL          string    `gorm:"-"`
}

func (PDF) TableName() string {
	return "pdf_documents"
}
