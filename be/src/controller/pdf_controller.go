package controller

import (
	"app/src/service"
	"app/src/validation"

	"github.com/gofiber/fiber/v2"
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
		return fiber.NewError(fiber.StatusBadRequest, "File is required")
	}

	pdf, err := c.PDFService.Create(ctx.Context(), file)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return ctx.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "PDF uploaded successfully",
		"data":    pdf,
	})
}

func (c *PDFController) GetAllPDFs(ctx *fiber.Ctx) error {
	pdfs, err := c.PDFService.GetAll(ctx.Context())
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return ctx.JSON(fiber.Map{
		"data": pdfs,
	})
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

	if err := ctx.ParamsParser(&params); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid PDF ID")
	}
	if err := validation.Validator().Struct(params); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	summaries, err := c.SummaryService.GetAll(ctx.Context(), params.ID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return ctx.JSON(fiber.Map{
		"data": summaries,
	})
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
