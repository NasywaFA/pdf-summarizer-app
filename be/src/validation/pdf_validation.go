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

type QueryParams struct {
	Page      int    `query:"page" validate:"omitempty,min=1"`
	Limit     int    `query:"limit" validate:"omitempty,min=1,max=100"`
	Search    string `query:"search" validate:"omitempty,max=255"`
	Status    string `query:"status" validate:"omitempty,oneof=processing completed failed timeout pending"`
	Language  string `query:"language" validate:"omitempty,oneof=EN ID CN JP KR"`
	Style     string `query:"style" validate:"omitempty,oneof=professional simple"`
	DateFrom  string `query:"date_from" validate:"omitempty"`
	DateTo    string `query:"date_to" validate:"omitempty"`
	SortBy    string `query:"sort_by" validate:"omitempty,oneof=created_at updated_at uploaded_at original_name"`
	SortOrder string `query:"sort_order" validate:"omitempty,oneof=asc desc"`
	Export    string `query:"export" validate:"omitempty,oneof=csv json"`
}

type SummaryQueryParams struct {
	Page      int    `query:"page" validate:"omitempty,min=1"`
	Limit     int    `query:"limit" validate:"omitempty,min=1,max=100"`
	Search    string `query:"search" validate:"omitempty,max=255"`
	Status    string `query:"status" validate:"omitempty"`
	Language  string `query:"language" validate:"omitempty"`
	Style     string `query:"style" validate:"omitempty"`
	SortBy    string `query:"sort_by" validate:"omitempty,oneof=created_at updated_at"`
	SortOrder string `query:"sort_order" validate:"omitempty,oneof=asc desc"`
	Export    string `query:"export" validate:"omitempty,oneof=csv json"`
}