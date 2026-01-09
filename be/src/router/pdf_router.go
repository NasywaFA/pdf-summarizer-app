package router

import (
	"app/src/controller"
	"app/src/service"

	"github.com/gofiber/fiber/v2"
)

func PDFRoutes(v1 fiber.Router, pdfService service.PDFService, summaryService service.SummaryService) {
	pdfController := controller.NewPDFController(pdfService, summaryService)

	pdfs := v1.Group("/pdfs")

	pdfs.Post("/upload", pdfController.Upload)
	pdfs.Get("/", pdfController.GetAllPDFs)
	pdfs.Get("/:id", pdfController.GetPDF)
	pdfs.Delete("/:id", pdfController.DeletePDF)
	pdfs.Post("/:id/generate", pdfController.GenerateSummary)
	pdfs.Get("/:id/summaries", pdfController.GetSummaries)	
	
	summary := v1.Group("/summary")

	summary.Get("/:id", pdfController.GetSummaryByID)
	summary.Put("/:id", pdfController.UpdateSummary)
	summary.Delete("/:id", pdfController.DeleteSummary)
}
