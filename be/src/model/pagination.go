package model

type PaginationMeta struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
}

type PaginatedResponse struct {
	Data interface{}     `json:"data"`
	Meta PaginationMeta  `json:"meta"`
}

func NewPaginationMeta(page, limit int, total int64) PaginationMeta {
	totalPages := int(total) / limit
	if int(total)%limit > 0 {
		totalPages++
	}

	return PaginationMeta{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
	}
}