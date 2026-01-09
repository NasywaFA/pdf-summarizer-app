package validation

import "github.com/google/uuid"

type GenerateSummary struct {
	Language string `json:"language" validate:"required,oneof=EN ID CN JP KR"`
	Style    string `json:"style" validate:"required,oneof=professional simple"`
}

type UpdateSummary struct {
	Content string `json:"content" validate:"required"`
}

type PDFIDParam struct {
	ID uuid.UUID `params:"id" validate:"required,uuid"`
}

type SummaryIDParam struct {
	ID uuid.UUID `params:"id" validate:"required,uuid"`
}