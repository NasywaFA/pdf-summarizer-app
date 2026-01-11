"use client";

import React, { useState, useEffect } from "react";
import { pdfService } from "@/services/pdfService";
import { PDF, SummaryType } from "@/types/SummaryType";
import LanguageSwitch, { Language } from "./LanguageSwitch";
import { SummarySection } from "./SummarySection";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";

interface PendingPDF {
  file: File;
  previewUrl: string;
}

interface GeneratingState {
  pdfId: string;
  summaryId: string;
  startTime: number;
}

export const PDFSummarizer: React.FC = () => {
  {
    /* State Management */
  }
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [activePDF, setActivePDF] = useState<PDF | null>(null);
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
  const [pendingPDF, setPendingPDF] = useState<PendingPDF | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
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
      if (pendingPDF) {
        URL.revokeObjectURL(pendingPDF.previewUrl);
      }

      loadSummaries(activePDF.id);
      setCompletedSummary(null);
      setPendingPDF(null);
      setRegeneratingPdfId(null);
      setStyle("");
    } else {
      setSummaries([]);
      setCompletedSummary(null);

      if (pendingPDF) {
        URL.revokeObjectURL(pendingPDF.previewUrl);
      }
      setPendingPDF(null);
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
    /* File Upload: Validate and Set Pending PDF */
  }
  const handleFileSelect = (file: File) => {
    setUploadError(null);
    setShowPreview(false);
    setStyle("");

    if (file.type !== "application/pdf") {
      setUploadError("Please upload a PDF file");
      return;
    }

    const url = URL.createObjectURL(file);

    setPendingPDF({
      file,
      previewUrl: url,
    });
  };

  {
    /* File Upload: Clear Pending PDF */
  }
  const handleClearPending = () => {
    if (pendingPDF) {
      URL.revokeObjectURL(pendingPDF.previewUrl);
    }
    setPendingPDF(null);
    setStyle("");
    setUploadError(null);
    setShowPreview(false);
  };

  {
    /* Summary Generation: Upload and Generate */
  }
  const handleGenerate = async () => {
    if (!pendingPDF || !style) return;

    setGenerateError(null);
    setUploadError(null);

    try {
      const uploadResponse = await pdfService.uploadPDF(
        pendingPDF.file,
        language,
        style
      );
      const uploadedPDF = uploadResponse.data;

      await loadPDFs();
      setActivePDF(uploadedPDF);
      setIsLocked(true);

      const generateResponse = await pdfService.generateSummary(
        uploadedPDF.id,
        language,
        style
      );
      const summary = generateResponse.data;

      setGeneratingState({
        pdfId: uploadedPDF.id,
        summaryId: summary.id,
        startTime: Date.now(),
      });

      handleClearPending();

      const checkInterval = setInterval(async () => {
        try {
          const summariesResponse = await pdfService.getSummariesByPDF(
            uploadedPDF.id
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

    try {
      await pdfService.deletePDF(id);
      if (typeof window !== "undefined" && (window as any).showToast) {
        (window as any).showToast("PDF deleted", "success");
      }
      await loadPDFs();
      if (activePDF?.id === id) {
        setActivePDF(null);
        setSummaries([]);
        setCompletedSummary(null);
        setIsLocked(false);
      }
    } catch (error) {
      console.error("Failed to delete PDF", error);
    }
  };

  {
    /* UI: Reset to Upload New PDF */
  }
  const handleCreateNew = () => {
    setActivePDF(null);
    setPendingPDF(null);
    setCompletedSummary(null);
    setShowPreview(false);
    setIsLocked(false);
    setStyle("");
    setGeneratingState(null);
    setSummaries([]);
    setRegeneratingPdfId(null);
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
  const isGenerating = generatingState !== null;
  const canGenerate = pendingPDF && style && !isGenerating;

  return (
    <div className="flex h-screen">
      {/* Left Sidebar: PDF History */}
      <div
        className={`${
          leftSidebarOpen ? "w-64" : "w-0"
        } bg-white/20 backdrop-blur-md border-r border-white/30 transition-all duration-300 overflow-hidden`}
      >
        <div className="p-4 h-full flex flex-col">
          {/* Sidebar Header with Create New Button */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-200">PDF History</h2>
            <button
              onClick={() => setLeftSidebarOpen(false)}
              className="text-gray-200 hover:text-gray-400 p-1"
            >
              ◀
            </button>
          </div>

          {/* Add New PDF Button */}
          <Button
            variant="primary"
            onClick={handleCreateNew}
            className="w-full mb-4 text-sm"
          >
            + Upload New PDF
          </Button>

          {/* PDF List */}
          <div className="space-y-2 overflow-y-auto flex-1">
            {pdfs.map((pdf) => (
              <div
                key={pdf.id}
                className={`relative overflow-visible p-3 rounded-lg cursor-pointer transition-all ${
                  activePDF?.id === pdf.id
                    ? "bg-yellow-200/55 text-gray-800 backdrop-blur-sm"
                    : "bg-white/50 hover:bg-white/30 backdrop-blur-sm border border-white/50 text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActivePDF(pdf)}
              >
                <p className="text-sm font-medium truncate">
                  {pdf.original_name}
                </p>
                <p className="text-xs opacity-80 mt-1">
                  {new Date(pdf.uploaded_at).toLocaleDateString()}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePDF(pdf.id);
                  }}
                  className="text-xs mt-2 text-gray-200 hover:text-red-500 bg-red-500/80 hover:bg-gray-200 rounded-full px-2"
                >
                  Delete
                </button>
              </div>
            ))}
            {pdfs.length === 0 && (
              <p className="text-sm text-gray-500 text-center">
                No PDFs uploaded yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Left Sidebar Collapse Toggle Button */}
      {!leftSidebarOpen && (
        <button
          onClick={() => setLeftSidebarOpen(true)}
          className="fixed left-0 top-14.5 translate-y-1/2 bg-white/30 backdrop-blur-md border border-white/50 p-2 rounded-r-lg hover:bg-white/50 z-50"
        >
          ▶
        </button>
      )}

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

          {/* Page Title with Create New Button */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              {pendingPDF
                ? pendingPDF.file.name
                : activePDF
                ? activePDF.original_name
                : "Upload Your PDF"}
            </h2>
            {completedSummary && regeneratingPdfId !== activePDF?.id && (
              <Button variant="secondary" onClick={handleGenerateNewForPDF}>
                Generate New Summary
              </Button>
            )}
          </div>

          {/* Upload Section: Show when no PDF is Selected or Pending */}
          {!pendingPDF && !activePDF && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">
                Upload PDF
              </h3>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragActive
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-gray-300 bg-white/20"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
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
                  <p className="text-sm text-gray-800">PDF files only</p>
                </div>
              </div>
              {/* Upload Error Alert */}
              {uploadError && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/80 text-white text-sm">
                  {uploadError}
                </div>
              )}
            </Card>
          )}

          {/* Pending PDF: Preview and Generate Section */}
          {pendingPDF && (
            <>
              {/* Pending PDF Card */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-100">
                    Selected PDF
                  </h3>
                  <button
                    onClick={handleClearPending}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Cancel
                  </button>
                </div>

                <div
                  onClick={() => {
                    //editing this section for preview pdf after upload
                    const fileUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/${pendingPDF.file}`;
                    setPreviewUrl(fileUrl);
                    setShowPreview(true);
                  }}
                  className="bg-white/40 rounded-lg p-4 border border-white/50 mb-4 cursor-pointer hover:bg-white/50 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {pendingPDF.file.name}
                    </span>
                    <span className="text-xs text-blue-600">
                      Click to preview
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 mt-1">
                    {(pendingPDF.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
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
                          className={`px-6 py-2 rounded-xl transition-all ${
                            style === s
                              ? "bg-yellow-200/70 backdrop-blur-sm text-gray-600"
                              : "bg-white/25 text-white backdrop-blur-sm border border-white/50 hover:bg-white/50"
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

          {/* Active PDF: Preview and Summary Display */}
          {activePDF && !pendingPDF && (
            <>
              {/* Regenerate Mode - Generate New Summary for Same PDF */}
              {activePDF && regeneratingPdfId === activePDF.id && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-100">
                      Generate New Summary
                    </h3>
                  </div>

                  <div
                    onClick={() => {
                      setPreviewUrl(activePDF.file_path);
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
                    <div className="whitespace-pre-wrap">
                      {completedSummary.content}
                    </div>
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

      {/* Right Sidebar: Summary History */}
      <div
        className={`${
          rightSidebarOpen ? "w-full md:w-[420px] lg:w-[520px]" : "w-0"
        } bg-white/20 backdrop-blur-md border-l border-white/30 transition-all duration-300 overflow-hidden`}
      >
        <div className="p-4 h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-200">
              Summary History
            </h2>
            <button
              onClick={() => setRightSidebarOpen(false)}
              className="text-gray-200 hover:text-gray-400 p-1"
            >
              ▶
            </button>
          </div>

          {/* Summary List or Empty State */}
          <div className="overflow-y-auto flex-1">
            {activePDF ? (
              <SummarySection
                summaries={summaries}
                onEdit={handleEditSummary}
                onDelete={handleDeleteSummary}
                activeSummaryId={completedSummary?.id || null}
              />
            ) : (
              <p className="text-sm text-gray-300 text-center">
                Select a PDF to view summaries
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar Collapse Toggle Button */}
      {!rightSidebarOpen && (
        <button
          onClick={() => setRightSidebarOpen(true)}
          className="fixed right-0 top-14.5 translate-y-1/2 bg-white/30 backdrop-blur-md border border-white/50 p-2 rounded-l-lg hover:bg-white/50 z-50"
        >
          ◀
        </button>
      )}
    </div>
  );
};
