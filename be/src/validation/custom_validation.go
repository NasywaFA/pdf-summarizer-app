package validation

import (
	"regexp"

	"github.com/go-playground/validator/v10"
)

func Password(field validator.FieldLevel) bool {
	value, ok := field.Field().Interface().(string)
	if ok {
		hasDigit := regexp.MustCompile(`[0-9]`).MatchString(value)
		hasLetter := regexp.MustCompile(`[a-zA-Z]`).MatchString(value)

		if !hasDigit || !hasLetter {
			return false
		}
	}

	return true
}

func (q *QueryParams) SetDefaults() {
	if q.Page < 1 {
		q.Page = 1
	}
	if q.Limit < 1 {
		q.Limit = 10
	}
	if q.SortBy == "" {
		q.SortBy = "uploaded_at"
	}
	if q.SortOrder == "" {
		q.SortOrder = "desc"
	}
}

func (q *QueryParams) GetOffset() int {
	return (q.Page - 1) * q.Limit
}