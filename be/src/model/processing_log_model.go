package model

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type ProcessingLog struct {
	ID         uuid.UUID        `gorm:"type:uuid;default:gen_random_uuid();primaryKey;column:id" json:"id"`
	EntityType string           `gorm:"type:varchar(50);not null;column:entity_type" json:"entity_type"`
	EntityID   uuid.UUID        `gorm:"type:uuid;not null;column:entity_id" json:"entity_id"`
	Action     string           `gorm:"type:varchar(100);not null;column:action" json:"action"`
	Status     string           `gorm:"type:varchar(20);not null;column:status" json:"status"`
	Message    string           `gorm:"type:text;column:message" json:"message"`
	Metadata   *json.RawMessage `gorm:"type:jsonb;column:metadata" json:"metadata"`
	CreatedAt  time.Time        `gorm:"type:timestamp;default:now();column:created_at" json:"created_at"`
}

func (ProcessingLog) TableName() string {
	return "processing_logs"
}