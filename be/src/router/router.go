package router

import (
	"app/src/config"
	"app/src/service"
	"app/src/validation"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func Routes(app *fiber.App, db *gorm.DB) {
	validate := validation.Validator()

	pdfService := service.NewPDFService(db, validate)
	summaryService := service.NewSummaryService(db, validate, )

	v1 := app.Group("/v1")

	PDFRoutes(v1, pdfService, summaryService)

	// TODO: add another routes here...

	if !config.IsProd {
		DocsRoutes(v1)
	}
}
