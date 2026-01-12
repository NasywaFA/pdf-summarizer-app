package config

const (
	// File size limits
	MaxFileSize = 3 * 1024 * 1024
	MinFileSize = 1024

	// Allowed MIME type
	AllowedMimeType = "application/pdf"

	// Allowed extensions
	AllowedExtension = ".pdf"
)

// PDF Magic Numbers
var PDFMagicNumbers = [][]byte{
	{0x25, 0x50, 0x44, 0x46}, // %PDF
}

// GetMaxFileSizeMB returns max file size in MB
func GetMaxFileSizeMB() int {
	return MaxFileSize / (1024 * 1024)
}

// GetMinFileSizeKB returns min file size in KB
func GetMinFileSizeKB() int {
	return MinFileSize / 1024
}
