package controller

import (
	"app/src/model"
	"app/src/service"
	"app/src/validation"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type PDFController struct {
	PDFService     service.PDFService
	SummaryService service.SummaryService
}

func NewPDFController(pdfService service.PDFService, summaryService service.SummaryService) *PDFController {
	return &PDFController{
		PDFService:     pdfService,
		SummaryService: summaryService,
	}
}

func (c *PDFController) Upload(ctx *fiber.Ctx) error {
	file, err := ctx.FormFile("file")
	if err != nil {
		return ctx.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "File is required",
		})
	}

	pdf, err := c.PDFService.Create(ctx.Context(), file)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "PDF uploaded successfully",
		"data":    pdf,
	})
}

func (c *PDFController) GetAllPDFs(ctx *fiber.Ctx) error {
	var params validation.QueryParams

	if err := ctx.QueryParser(&params); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid query parameters")
	}

	params.SetDefaults()

	if err := validation.Validator().Struct(params); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	if params.Export != "" {
		return c.exportPDFs(ctx, params)
	}

	pdfs, meta, err := c.PDFService.GetAll(ctx.Context(), params)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return ctx.JSON(model.PaginatedResponse{
		Data: pdfs,
		Meta: *meta,
	})
}

func (c *PDFController) exportPDFs(ctx *fiber.Ctx, params validation.QueryParams) error {
	params.Limit = 10000 // Set high limit for export
	params.Page = 1

	pdfs, _, err := c.PDFService.GetAll(ctx.Context(), params)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	if params.Export == "csv" {
		return c.exportPDFsCSV(ctx, pdfs)
	}

	return c.exportPDFsJSON(ctx, pdfs)
}

func (c *PDFController) exportPDFsCSV(ctx *fiber.Ctx, pdfs []model.PDF) error {
	ctx.Set("Content-Type", "text/csv")
	ctx.Set("Content-Disposition", fmt.Sprintf("attachment; filename=pdfs_%s.csv", time.Now().Format("20060102_150405")))

	writer := csv.NewWriter(ctx)
	defer writer.Flush()

	headers := []string{"ID", "Original Name", "File Size (MB)", "Status", "Uploaded At"}
	if err := writer.Write(headers); err != nil {
		return err
	}

	for _, pdf := range pdfs {
		row := []string{
			pdf.ID.String(),
			pdf.OriginalName,
			fmt.Sprintf("%.2f", float64(pdf.FileSize)/1024/1024),
			pdf.Status,
			pdf.UploadedAt.Format(time.RFC3339),
		}
		if err := writer.Write(row); err != nil {
			return err
		}
	}

	return nil
}

func (c *PDFController) exportPDFsJSON(ctx *fiber.Ctx, pdfs []model.PDF) error {
	ctx.Set("Content-Type", "application/json")
	ctx.Set("Content-Disposition", fmt.Sprintf("attachment; filename=pdfs_%s.json", time.Now().Format("20060102_150405")))

	data, err := json.MarshalIndent(pdfs, "", "  ")
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to generate JSON")
	}

	return ctx.Send(data)
}

func (c *PDFController) GetPDF(ctx *fiber.Ctx) error {
	var params validation.PDFIDParam

	if err := ctx.ParamsParser(&params); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid PDF ID")
	}
	if err := validation.Validator().Struct(params); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	pdf, err := c.PDFService.GetByID(ctx.Context(), params.ID)
	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, "PDF not found")
	}

	return ctx.JSON(fiber.Map{
		"data": pdf,
	})
}

func (c *PDFController) DeletePDF(ctx *fiber.Ctx) error {
	var params validation.PDFIDParam

	if err := ctx.ParamsParser(&params); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid PDF ID")
	}
	if err := validation.Validator().Struct(params); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	if err := c.PDFService.Delete(ctx.Context(), params.ID); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return ctx.JSON(fiber.Map{
		"message": "PDF deleted successfully",
	})
}

func (c *PDFController) GenerateSummary(ctx *fiber.Ctx) error {
	var params validation.PDFIDParam
	var payload validation.GenerateSummary

	if err := ctx.ParamsParser(&params); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid PDF ID")
	}
	if err := ctx.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request payload")
	}

	if err := validation.Validator().Struct(params); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	if err := validation.Validator().Struct(payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	summary, err := c.SummaryService.Create(ctx.Context(), params.ID, payload.Language, payload.Style)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return ctx.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Summary generation started",
		"data":    summary,
	})
}

func (c *PDFController) GetSummaries(ctx *fiber.Ctx) error {
	var params validation.PDFIDParam
	var queryParams validation.QueryParams

	if err := ctx.ParamsParser(&params); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid PDF ID")
	}
	if err := validation.Validator().Struct(params); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	if err := ctx.QueryParser(&queryParams); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid query parameters")
	}

	queryParams.SetDefaults()

	if err := validation.Validator().Struct(queryParams); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	if queryParams.Export != "" {
		return c.exportSummaries(ctx, params.ID, queryParams)
	}

	summaries, meta, err := c.SummaryService.GetAll(ctx.Context(), params.ID, queryParams)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return ctx.JSON(model.PaginatedResponse{
		Data: summaries,
		Meta: *meta,
	})
}

func (c *PDFController) exportSummaries(ctx *fiber.Ctx, pdfID uuid.UUID, params validation.QueryParams) error {
	params.Limit = 10000
	params.Page = 1

	summaries, _, err := c.SummaryService.GetAll(ctx.Context(), pdfID, params)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	if params.Export == "csv" {
		return c.exportSummariesCSV(ctx, summaries)
	}

	return c.exportSummariesJSON(ctx, summaries)
}

func (c *PDFController) exportSummariesCSV(ctx *fiber.Ctx, summaries []model.Summary) error {
	ctx.Set("Content-Type", "text/csv")
	ctx.Set("Content-Disposition", fmt.Sprintf("attachment; filename=summaries_%s.csv", time.Now().Format("20060102_150405")))

	writer := csv.NewWriter(ctx)
	defer writer.Flush()

	headers := []string{"ID", "PDF ID", "Language", "Style", "Status", "Content Preview", "Created At"}
	if err := writer.Write(headers); err != nil {
		return err
	}

	for _, summary := range summaries {
		contentPreview := summary.Content
		if len(contentPreview) > 100 {
			contentPreview = contentPreview[:100] + "..."
		}

		row := []string{
			summary.ID.String(),
			summary.PDFID.String(),
			summary.Language,
			summary.Style,
			summary.Status,
			contentPreview,
			summary.CreatedAt.Format(time.RFC3339),
		}
		if err := writer.Write(row); err != nil {
			return err
		}
	}

	return nil
}

func (c *PDFController) exportSummariesJSON(ctx *fiber.Ctx, summaries []model.Summary) error {
	ctx.Set("Content-Type", "application/json")
	ctx.Set("Content-Disposition", fmt.Sprintf("attachment; filename=summaries_%s.json", time.Now().Format("20060102_150405")))

	data, err := json.MarshalIndent(summaries, "", "  ")
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to generate JSON")
	}

	return ctx.Send(data)
}

func (c *PDFController) GetSummaryByID(ctx *fiber.Ctx) error {
	var params validation.SummaryIDParam

	if err := ctx.ParamsParser(&params); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid summary ID")
	}
	if err := validation.Validator().Struct(params); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	summary, err := c.SummaryService.GetByID(ctx.Context(), params.ID)
	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Summary not found")
	}

	return ctx.JSON(fiber.Map{
		"data": summary,
	})
}

func (c *PDFController) UpdateSummary(ctx *fiber.Ctx) error {
	var params validation.SummaryIDParam
	var payload validation.UpdateSummary

	if err := ctx.ParamsParser(&params); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid summary ID")
	}
	if err := ctx.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request payload")
	}

	if err := validation.Validator().Struct(params); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	if err := validation.Validator().Struct(payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	if err := c.SummaryService.Update(ctx.Context(), params.ID, payload.Content); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return ctx.JSON(fiber.Map{
		"message": "Summary updated successfully",
	})
}

func (c *PDFController) DeleteSummary(ctx *fiber.Ctx) error {
	var params validation.SummaryIDParam

	if err := ctx.ParamsParser(&params); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid summary ID")
	}
	if err := validation.Validator().Struct(params); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	if err := c.SummaryService.Delete(ctx.Context(), params.ID); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return ctx.JSON(fiber.Map{
		"message": "Summary deleted successfully",
	})
}