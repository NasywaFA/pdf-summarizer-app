"use client";

import React, { useState, useEffect } from "react";
import { pdfService } from "@/services/pdfService";
import { PDF, SummaryType } from "@/types/SummaryType";
import LanguageSwitch, { Language } from "./LanguageSwitch";
import { PDFHistory } from "./PDFHistory";
import { SummaryHistory } from "./SummaryHistory";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import ReactMarkdown from "react-markdown";
import {
  validatePDFFile,
  formatFileSize,
  getMaxFileSizeFormatted,
} from "@/utils/pdfValidation";

interface GeneratingState {
  pdfId: string;
  summaryId: string;
  startTime: number;
}

interface UploadProgress {
  stage: "validating" | "uploading" | "saving" | "complete";
  message: string;
}

export const PDFSummarizer: React.FC = () => {
  {
    /* State Management */
  }
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [activePDF, setActivePDF] = useState<PDF | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const [summaries, setSummaries] = useState<SummaryType[]>([]);
  const [language, setLanguage] = useState<Language>("EN");
  const [style, setStyle] = useState<string>("");
  const [generatingState, setGeneratingState] =
    useState<GeneratingState | null>(null);
  const [regeneratingPdfId, setRegeneratingPdfId] = useState<string | null>(
    null
  );
  const [elapsedTime, setElapsedTime] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [completedSummary, setCompletedSummary] = useState<SummaryType | null>(
    null
  );

  {
    /* Sidebar Collapse States */
  }
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  {
    /* Load PDFs on Mount */
  }
  useEffect(() => {
    loadPDFs();
  }, []);

  {
    /* Load Summaries when PDF is Selected */
  }
  useEffect(() => {
    if (activePDF) {
      loadSummaries(activePDF.id);
      setCompletedSummary(null);
      setRegeneratingPdfId(null);
      setStyle("");
    } else {
      setSummaries([]);
      setCompletedSummary(null);
    }
  }, [activePDF]);

  {
    /* Timer for Generation Progress */
  }
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (generatingState) {
      interval = setInterval(() => {
        setElapsedTime(
          Math.floor((Date.now() - generatingState.startTime) / 1000)
        );
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [generatingState]);

  {
    /* API: Load All PDFs */
  }
  const loadPDFs = async () => {
    try {
      const response = await pdfService.getAllPDFs();
      setPdfs(response.data || []);
    } catch (error) {
      console.error("Failed to load PDFs", error);
    }
  };

  {
    /* API: Load Summaries for Selected PDF */
  }
  const loadSummaries = async (pdfId: string) => {
    try {
      const response = await pdfService.getSummariesByPDF(pdfId);
      setSummaries(response.data || []);

      const latestCompleted = (response.data || [])
        .filter((s: SummaryType) => s.status === "completed")
        .sort(
          (a: SummaryType, b: SummaryType) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

      setCompletedSummary(latestCompleted || null);

      const processingSummary = (response.data || []).find(
        (s: SummaryType) => s.status === "processing"
      );
      if (processingSummary && !generatingState) {
        setGeneratingState({
          pdfId,
          summaryId: processingSummary.id,
          startTime: Date.now() - 5000,
        });
      }
    } catch (error) {
      console.error("Failed to load summaries", error);
    }
  };

  {
    /* File Upload: Drag Handlers */
  }
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  {
    /* File Upload: Drop Handler */
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  {
    /* File Upload: Input Change Handler */
  }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
    setShowPreview(false);
  };

  {
    /* Utility: Get File URL for Preview */
  }
  const getFileURL = (pdf: PDF) => {
    if (pdf.URL && pdf.URL.startsWith("http")) {
      return pdf.URL;
    }

    const BACKEND_URL =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
    return `${BACKEND_URL}/uploads/${pdf.filename}`;
  };

  {
    /* File Upload: Validate, Upload to Storage, and Save to DB */
  }
  const handleFileSelect = async (file: File) => {
    setUploadError(null);
    setGenerateError(null);
    setShowPreview(false);
    setStyle("");

    try {
      setUploadProgress({
        stage: "validating",
        message: "Validating PDF file...",
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const validationResult = await validatePDFFile(file);

      if (!validationResult.isValid) {
        setUploadError(validationResult.error || "Invalid PDF file");
        setUploadProgress(null);
        return;
      }

      setUploadProgress({
        stage: "uploading",
        message: "Uploading to storage...",
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      setUploadProgress({
        stage: "saving",
        message: "Saving to database...",
      });

      const uploadResponse = await pdfService.uploadPDF(file);
      const uploadedPDF = uploadResponse.data || uploadResponse;

      if (!uploadedPDF || !uploadedPDF.id) {
        throw new Error("Upload failed: Invalid response from server");
      }

      setUploadProgress({
        stage: "complete",
        message: "Upload complete!",
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      setPdfs((prev) => [uploadedPDF, ...prev]);
      setActivePDF(uploadedPDF);
      setUploadProgress(null);

      if (typeof window !== "undefined" && (window as any).showToast) {
        (window as any).showToast("PDF uploaded successfully", "success");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(
        error instanceof Error
          ? error.message
          : "Failed to upload PDF. Please try again."
      );
      setUploadProgress(null);
    }
  };

  {
    /* File Upload: Clear Uploaded PDF */
  }
  const handleClearUploaded = () => {
    setActivePDF(null);
    setStyle("");
    setUploadError(null);
    setGenerateError(null);
    setShowPreview(false);
    setCompletedSummary(null);
    setSummaries([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  {
    /* Summary Generation: Generate for Uploaded PDF */
  }
  const handleGenerate = async () => {
    if (!activePDF || !style) return;

    setGenerateError(null);
    setUploadError(null);

    try {
      const generateResponse = await pdfService.generateSummary(
        activePDF.id,
        language,
        style
      );

      const summary = generateResponse.data || generateResponse;

      if (!summary || !summary.id) {
        throw new Error("Generate failed: Invalid response from server");
      }

      setGeneratingState({
        pdfId: activePDF.id,
        summaryId: summary.id,
        startTime: Date.now(),
      });

      const checkInterval = setInterval(async () => {
        try {
          const summariesResponse = await pdfService.getSummariesByPDF(
            activePDF.id
          );
          const updatedSummaries = summariesResponse.data || [];
          setSummaries(updatedSummaries);

          const currentSummary = updatedSummaries.find(
            (s: SummaryType) => s.id === summary.id
          );
          if (currentSummary && currentSummary.status !== "processing") {
            setGeneratingState(null);
            if (currentSummary.status === "completed") {
              setCompletedSummary(currentSummary);
              if (typeof window !== "undefined" && (window as any).showToast) {
                (window as any).showToast(
                  "Summary generated successfully",
                  "success"
                );
              }
            } else if (currentSummary.status === "failed") {
              const errorMessage =
                currentSummary.error_message || "Summary generation failed";

              if (
                errorMessage.toLowerCase().includes("no text") ||
                errorMessage.toLowerCase().includes("no extractable text")
              ) {
                setGenerateError(
                  "This PDF contains no readable text. Please upload a PDF with text content, not just images or scans."
                );
              } else {
                setGenerateError(errorMessage);
              }
            }
            clearInterval(checkInterval);
          }
        } catch (error) {
          console.error("Failed to check summary status", error);
        }
      }, 2000);

      setTimeout(() => clearInterval(checkInterval), 60000);
    } catch (error) {
      console.error("Generate error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate summary";

      if (
        errorMessage.toLowerCase().includes("no text") ||
        errorMessage.toLowerCase().includes("no extractable text")
      ) {
        setGenerateError(
          "This PDF contains no readable text. Please upload a PDF with text content, not just images or scans."
        );
      } else {
        setGenerateError(errorMessage);
      }
    }
  };

  {
    /* Summary Generation: Regenerate for Existing PDF */
  }
  const handleRegenerateSummary = async () => {
    if (!activePDF || !style) return;

    setGenerateError(null);

    try {
      const generateResponse = await pdfService.generateSummary(
        activePDF.id,
        language,
        style
      );
      const summary = generateResponse.data;

      setGeneratingState({
        pdfId: activePDF.id,
        summaryId: summary.id,
        startTime: Date.now(),
      });

      setRegeneratingPdfId(null);

      const checkInterval = setInterval(async () => {
        try {
          const summariesResponse = await pdfService.getSummariesByPDF(
            activePDF.id
          );
          const updatedSummaries = summariesResponse.data || [];
          setSummaries(updatedSummaries);

          const currentSummary = updatedSummaries.find(
            (s: SummaryType) => s.id === summary.id
          );
          if (currentSummary && currentSummary.status !== "processing") {
            setGeneratingState(null);
            if (currentSummary.status === "completed") {
              setCompletedSummary(currentSummary);
            }
            clearInterval(checkInterval);
          }
        } catch (error) {
          console.error("Failed to check summary status", error);
        }
      }, 2000);

      setTimeout(() => clearInterval(checkInterval), 60000);
    } catch (error) {
      setGenerateError("Failed to generate summary");
      console.error(error);
    }
  };

  {
    /* Summary Actions: Edit */
  }
  const handleEditSummary = async (id: string, content: string) => {
    try {
      await pdfService.updateSummary(id, content);
      if (typeof window !== "undefined" && (window as any).showToast) {
        (window as any).showToast("Summary saved", "success");
      }
      if (activePDF) {
        loadSummaries(activePDF.id);
      }
    } catch (error) {
      console.error("Failed to update summary", error);
    }
  };

  {
    /* Summary Actions: Delete */
  }
  const handleDeleteSummary = async (id: string) => {
    if (!confirm("Are you sure you want to delete this summary?")) return;

    try {
      await pdfService.deleteSummary(id);
      if (typeof window !== "undefined" && (window as any).showToast) {
        (window as any).showToast("Summary deleted", "success");
      }
      if (activePDF) {
        loadSummaries(activePDF.id);
      }
      if (completedSummary?.id === id) {
        setCompletedSummary(null);
      }
    } catch (error) {
      console.error("Failed to delete summary", error);
    }
  };

  {
    /* Summary Actions: Select from Sidebar */
  }
  const handleSelectSummary = (summary: SummaryType) => {
    setCompletedSummary(summary);
  };

  {
    /* PDF Actions: Delete */
  }
  const handleDeletePDF = async (id: string) => {
    if (!confirm("Are you sure you want to delete this PDF?")) return;

    const previousPdfs = pdfs;
    const wasActive = activePDF?.id === id;

    setPdfs((prev) => prev.filter((p) => p.id !== id));

    if (wasActive) {
      setActivePDF(null);
      setSummaries([]);
      setCompletedSummary(null);
    }

    try {
      await pdfService.deletePDF(id);
      if (typeof window !== "undefined" && (window as any).showToast) {
        (window as any).showToast("PDF deleted", "success");
      }
    } catch (error) {
      console.error("Failed to delete PDF", error);

      setPdfs(previousPdfs);

      if (wasActive && previousPdfs.find((p) => p.id === id)) {
        const pdfToRestore = previousPdfs.find((p) => p.id === id);
        setActivePDF(pdfToRestore || null);
        if (pdfToRestore) {
          loadSummaries(id);
        }
      }

      if (typeof window !== "undefined" && (window as any).showToast) {
        (window as any).showToast("Failed to delete PDF", "error");
      }
    }
  };

  {
    /* UI: Reset to Upload New PDF */
  }
  const handleCreateNew = () => {
    setActivePDF(null);
    setCompletedSummary(null);
    setShowPreview(false);
    setStyle("");
    setGeneratingState(null);
    setSummaries([]);
    setRegeneratingPdfId(null);
    setUploadError(null);
    setGenerateError(null);
  };

  {
    /* UI: Generate New Summary for Same PDF */
  }
  const handleGenerateNewForPDF = () => {
    if (!activePDF) return;

    setCompletedSummary(null);
    setStyle("");
    setRegeneratingPdfId(activePDF.id);
    setShowPreview(false);
  };

  {
    /* Summary Actions: Copy to Clipboard */
  }
  const handleCopySummary = () => {
    if (completedSummary) {
      navigator.clipboard.writeText(completedSummary.content);
      if (typeof window !== "undefined" && (window as any).showToast) {
        (window as any).showToast("Summary copied to clipboard", "success");
      }
    }
  };

  {
    /* Summary Actions: Download as Text File */
  }
  const handleDownloadSummary = () => {
    if (completedSummary && activePDF) {
      const blob = new Blob([completedSummary.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activePDF.original_name.replace(".pdf", "")}_summary.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  {
    /* Utility: Format Elapsed Time */
  }
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  {
    /* Computed States */
  }
  const isUploading = uploadProgress !== null;
  const isGenerating = generatingState !== null;
  const canGenerate = !!(
    activePDF &&
    style &&
    !isGenerating &&
    !isUploading &&
    !completedSummary &&
    regeneratingPdfId !== activePDF?.id
  );
  const canRegenerate = !!(
    activePDF &&
    regeneratingPdfId &&
    style &&
    !isGenerating
  );
  const showUploadedPDF =
    activePDF && !regeneratingPdfId && !completedSummary && !isGenerating;

  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <PDFHistory
        pdfs={pdfs}
        isOpen={leftSidebarOpen}
        onToggle={setLeftSidebarOpen}
        activePDF={activePDF}
        onSelectPDF={setActivePDF}
        onDeletePDF={handleDeletePDF}
        onCreateNew={handleCreateNew}
      />

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Language Selector */}
          <div className="flex justify-center mb-8 sticky top-2 z-50">
            <LanguageSwitch
              language={language}
              onLanguageChange={setLanguage}
            />
          </div>

          {/* Page Title */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              {activePDF ? activePDF.original_name : "Upload Your PDF"}
            </h2>
            {completedSummary && regeneratingPdfId !== activePDF?.id && (
              <Button variant="secondary" onClick={handleGenerateNewForPDF}>
                Generate New Summary
              </Button>
            )}
          </div>

          {/* Upload Section */}
          {!activePDF && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">
                Upload PDF
              </h3>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragActive
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-gray-300 bg-white/20"
                } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {isUploading ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      {uploadProgress?.stage === "validating" && (
                        <div className="text-4xl animate-bounce">🔍</div>
                      )}
                      {uploadProgress?.stage === "uploading" && (
                        <div className="text-4xl animate-pulse">📤</div>
                      )}
                      {uploadProgress?.stage === "saving" && (
                        <div className="text-4xl animate-spin">💾</div>
                      )}
                      {uploadProgress?.stage === "complete" && (
                        <div className="text-4xl">✅</div>
                      )}
                    </div>
                    <p className="text-gray-700 font-medium text-lg">
                      {uploadProgress?.message}
                    </p>

                    {/* Progress Steps */}
                    <div className="flex justify-center items-center gap-2 mt-6">
                      <div
                        className={`w-3 h-3 rounded-full transition-all ${
                          uploadProgress?.stage === "validating"
                            ? "bg-blue-500 animate-pulse"
                            : uploadProgress &&
                              ["uploading", "saving", "complete"].includes(
                                uploadProgress.stage
                              )
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      ></div>
                      <div
                        className={`w-8 h-0.5 ${
                          uploadProgress &&
                          ["uploading", "saving", "complete"].includes(
                            uploadProgress.stage
                          )
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      ></div>
                      <div
                        className={`w-3 h-3 rounded-full transition-all ${
                          uploadProgress?.stage === "uploading"
                            ? "bg-blue-500 animate-pulse"
                            : uploadProgress &&
                              ["saving", "complete"].includes(
                                uploadProgress.stage
                              )
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      ></div>
                      <div
                        className={`w-8 h-0.5 ${
                          uploadProgress &&
                          ["saving", "complete"].includes(uploadProgress.stage)
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      ></div>
                      <div
                        className={`w-3 h-3 rounded-full transition-all ${
                          uploadProgress?.stage === "saving"
                            ? "bg-blue-500 animate-pulse"
                            : uploadProgress?.stage === "complete"
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      ></div>
                    </div>

                    <div className="text-xs text-gray-500 mt-2 flex justify-center gap-8">
                      <span
                        className={
                          uploadProgress &&
                          [
                            "validating",
                            "uploading",
                            "saving",
                            "complete",
                          ].includes(uploadProgress.stage)
                            ? "text-green-600 font-semibold"
                            : ""
                        }
                      >
                        Validate
                      </span>
                      <span
                        className={
                          uploadProgress &&
                          ["uploading", "saving", "complete"].includes(
                            uploadProgress.stage
                          )
                            ? "text-green-600 font-semibold"
                            : ""
                        }
                      >
                        Upload
                      </span>
                      <span
                        className={
                          uploadProgress &&
                          ["saving", "complete"].includes(uploadProgress.stage)
                            ? "text-green-600 font-semibold"
                            : ""
                        }
                      >
                        Save
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleChange}
                      className="hidden"
                    />
                    <div className="space-y-4">
                      <div className="text-4xl">📄</div>
                      <div>
                        <p className="text-gray-700 mb-2">
                          Drag and drop your PDF here, or
                        </p>
                        <Button
                          variant="secondary"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Browse Files
                        </Button>
                      </div>
                      <p className="text-sm text-gray-700">
                        PDF files only (Max: {getMaxFileSizeFormatted()})
                      </p>
                    </div>
                  </>
                )}
              </div>
              {/* Upload Error Alert */}
              {uploadError && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/80 text-white text-sm">
                  {uploadError}
                </div>
              )}
            </Card>
          )}

          {/* Uploaded PDF: Show Preview and Generate Options */}
          {showUploadedPDF && (
            <>
              {/* Uploaded PDF Card */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-100">
                    Uploaded PDF
                  </h3>
                  <button
                    onClick={handleClearUploaded}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>

                <div
                  onClick={() => {
                    setPreviewUrl(getFileURL(activePDF));
                    setShowPreview(true);
                  }}
                  className="bg-white/40 rounded-lg p-4 border border-white/50 mb-4 cursor-pointer hover:bg-white/50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        {activePDF.original_name}
                      </span>
                      <p className="text-xs text-gray-700 mt-1">
                        {(activePDF.file_size / 1024 / 1024).toFixed(2)} MB •
                        <span
                          className={`ml-2 font-semibold ${
                            activePDF.status === "pending"
                              ? "text-yellow-600"
                              : activePDF.status === "success"
                              ? "text-green-600"
                              : "text-gray-600"
                          }`}
                        >
                          Status: {activePDF.status}
                        </span>
                      </p>
                    </div>
                    <span className="text-xs text-blue-600 font-medium">
                      Click to preview
                    </span>
                  </div>
                </div>
              </Card>

              {/* Generate Summary Card */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-100">
                  Generate Summary
                </h3>
                <div className="space-y-4">
                  {/* Style Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Writing Style <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      {["professional", "simple"].map((s) => (
                        <button
                          key={s}
                          onClick={() => setStyle(s)}
                          disabled={isGenerating}
                          className={`px-6 py-2 rounded-xl transition-all ${
                            style === s
                              ? "bg-yellow-200/70 backdrop-blur-sm text-gray-600"
                              : "bg-white/25 text-white backdrop-blur-sm border border-white/50 hover:bg-white/50"
                          } ${
                            isGenerating ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generate Button */}
                  <Button
                    variant="primary"
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className="w-full"
                  >
                    {isGenerating
                      ? `Generating... ${formatTime(elapsedTime)}`
                      : "Generate Summary"}
                  </Button>

                  {/* Generation Error Alert */}
                  {generateError && (
                    <div className="p-3 rounded-lg bg-red-500/80 text-white text-sm">
                      {generateError}
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}

          {/* PDF Preview Modal */}
          {showPreview && previewUrl && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
              onClick={() => setShowPreview(false)}
            >
              <div
                className="relative w-[90vw] h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowPreview(false)}
                  className="absolute top-3 right-3 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full w-8 h-8 flex items-center justify-center"
                >
                  ✕
                </button>

                <iframe
                  src={previewUrl}
                  className="w-full h-full border-none"
                  title="PDF Preview"
                />
              </div>
            </div>
          )}

          {/* Active PDF: Regenerate and Summary Display */}
          {activePDF && (
            <>
              {/* Regenerate Mode */}
              {activePDF && regeneratingPdfId === activePDF.id && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-100">
                      Generate New Summary
                    </h3>
                  </div>

                  <div
                    onClick={() => {
                      setPreviewUrl(getFileURL(activePDF));
                      setShowPreview(true);
                    }}
                    className="bg-white/40 rounded-lg p-4 border border-white/50 mb-4 cursor-pointer hover:bg-white/50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {activePDF.original_name}
                      </span>
                      <span className="text-xs text-blue-600">
                        Click to preview
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 mt-1">
                      {(activePDF.file_size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Style Selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-100 mb-2">
                        Writing Style <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        {["professional", "simple"].map((s) => (
                          <button
                            key={s}
                            onClick={() => setStyle(s)}
                            className={`px-6 py-2 rounded-xl transition-all ${
                              style === s
                                ? "bg-yellow-200/70 backdrop-blur-sm text-gray-600"
                                : "bg-white/30 text-white backdrop-blur-sm border border-white/50 hover:bg-white/50"
                            }`}
                          >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Generate Button */}
                    <Button
                      variant="primary"
                      onClick={handleRegenerateSummary}
                      disabled={!style || isGenerating}
                      className="w-full"
                    >
                      {isGenerating
                        ? `Generating... ${formatTime(elapsedTime)}`
                        : "Generate Summary"}
                    </Button>

                    {/* Generation Error Alert */}
                    {generateError && (
                      <div className="p-3 rounded-lg bg-red-500/80 text-white text-sm">
                        {generateError}
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Generation Progress Card */}
              {isGenerating && generatingState?.pdfId === activePDF?.id && (
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Generating Summary
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        AI is processing your document...
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-mono text-blue-600">
                        {formatTime(elapsedTime)}
                      </div>
                      <div className="text-xs text-gray-500">elapsed</div>
                    </div>
                  </div>
                  <div className="mt-4 bg-blue-100/50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-700">
                        Status: Processing
                      </span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Completed Summary Display */}
              {completedSummary && regeneratingPdfId !== activePDF?.id && (
                <Card className="p-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white text-2xl font-bold">Summary</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopySummary}
                        className="bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2 rounded-full border border-white/20 transition-all duration-300"
                      >
                        Copy
                      </button>
                      <button
                        onClick={handleDownloadSummary}
                        className="bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2 rounded-full border border-white/20 transition-all duration-300"
                      >
                        Download
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/5 border-2 border-white/10 rounded-2xl p-6 mb-4 text-white/90 prose prose-invert prose-lg max-w-none">
                    <ReactMarkdown
                      components={{
                        h1: (props) => (
                          <h1
                            className="text-3xl font-bold text-white mb-4 mt-6"
                            {...props}
                          />
                        ),
                        h2: (props) => (
                          <h2
                            className="text-2xl font-bold text-white mb-3 mt-5"
                            {...props}
                          />
                        ),
                        h3: (props) => (
                          <h3
                            className="text-xl font-bold text-white mb-2 mt-4"
                            {...props}
                          />
                        ),
                        p: (props) => (
                          <p
                            className="mb-3 leading-relaxed text-white/90"
                            {...props}
                          />
                        ),
                        strong: (props) => (
                          <strong
                            className="text-yellow-300 font-bold"
                            {...props}
                          />
                        ),
                        em: (props) => (
                          <em className="text-blue-300" {...props} />
                        ),
                        ul: (props) => (
                          <ul
                            className="list-disc ml-6 mb-4 space-y-1"
                            {...props}
                          />
                        ),
                        ol: (props) => (
                          <ol
                            className="list-decimal ml-6 mb-4 space-y-1"
                            {...props}
                          />
                        ),
                        li: (props) => (
                          <li className="text-white/90" {...props} />
                        ),
                        code: (props) => (
                          <code
                            className="bg-white/10 px-2 py-1 rounded text-yellow-300"
                            {...props}
                          />
                        ),
                      }}
                    >
                      {completedSummary.content}
                    </ReactMarkdown>
                  </div>

                  <div className="mt-2 text-xs text-white/50">
                    Generated on{" "}
                    {new Date(completedSummary.created_at).toLocaleString()} •{" "}
                    {completedSummary.language} • {completedSummary.style}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <SummaryHistory
        isOpen={rightSidebarOpen}
        onToggle={setRightSidebarOpen}
        activePDF={activePDF}
        summaries={summaries}
        activeSummaryId={completedSummary?.id || null}
        onSelectSummary={handleSelectSummary}
        onEditSummary={handleEditSummary}
        onDeleteSummary={handleDeleteSummary}
        onReloadSummaries={() => activePDF && loadSummaries(activePDF.id)}
      />
    </div>
  );
};
