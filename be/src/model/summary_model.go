package model

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Summary struct {
	ID        uuid.UUID        `gorm:"type:uuid;default:gen_random_uuid();primaryKey;column:id" json:"id"`
	PDFID     uuid.UUID        `gorm:"type:uuid;not null;column:pdf_id" json:"pdf_id"`
	Content   string           `gorm:"type:text;column:content" json:"content"`
	Language  string           `gorm:"type:varchar(10);not null;column:language" json:"language"`
	Style     string           `gorm:"type:varchar(20);not null;column:style" json:"style"`
	Status    string           `gorm:"type:varchar(20);not null;default:'processing';column:status" json:"status"`
	IsEdited  bool             `gorm:"type:boolean;default:false;column:is_edited" json:"is_edited"`
	Metadata  *json.RawMessage `gorm:"type:jsonb;column:metadata" json:"metadata"`
	CreatedAt time.Time      `gorm:"type:timestamp;default:now();column:created_at" json:"created_at"`
	UpdatedAt time.Time      `gorm:"type:timestamp;default:now();column:updated_at" json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"type:timestamp;column:deleted_at" json:"deleted_at,omitempty"`
}

func (Summary) TableName() string {
	return "summaries"
}
