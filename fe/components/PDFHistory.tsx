"use client";

import React, { useState, useEffect } from "react";
import { pdfService } from "@/services/pdfService";
import { PDF } from "@/types/SummaryType";
import { Button } from "./ui/Button";

interface PDFHistoryProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  activePDF: PDF | null;
  onSelectPDF: (pdf: PDF) => void;
  onDeletePDF: (id: string) => void;
  onCreateNew: () => void;
}

export const PDFHistory: React.FC<PDFHistoryProps> = ({
  isOpen,
  onToggle,
  activePDF,
  onSelectPDF,
  onDeletePDF,
  onCreateNew,
}) => {
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  {
    /* Load PDFs */
  }
  const loadPDFs = async () => {
    setIsLoading(true);
    try {
      const response = await pdfService.getPDFsWithFilter({
        search: searchQuery,
        sort: sortBy,
        date_from: dateFrom,
        date_to: dateTo,
        page: currentPage,
        limit: 10,
      });

      setPdfs(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      console.error("Failed to load PDFs", error);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  // Reload when filters change
  useEffect(() => {
    loadPDFs();
  }, [currentPage, searchQuery, sortBy, dateFrom, dateTo]);

  // Export Handler
  const handleExport = async (format: "csv" | "json") => {
    try {
      await pdfService.exportPDFs(format, {
        search: searchQuery,
        sort: sortBy,
        date_from: dateFrom,
        date_to: dateTo,
      });
      if (typeof window !== "undefined" && (window as any).showToast) {
        (window as any).showToast(
          `Exported as ${format.toUpperCase()}`,
          "success"
        );
      }
    } catch (error) {
      console.error("Failed to export", error);
      if (typeof window !== "undefined" && (window as any).showToast) {
        (window as any).showToast("Export failed", "error");
      }
    }
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`
            fixed top-16 left-0 z-40
            ${isOpen ? "w-80" : "w-0"}
            bg-white/20 backdrop-blur-md border-r border-white/30
            transition-all duration-300 overflow-hidden
            h-[calc(100vh-4rem)]
        `}
      >
        <div className="p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-200">PDF History</h2>
            <button
              onClick={() => onToggle(false)}
              className="text-gray-200 hover:text-gray-400 p-1 transition-colors"
              type="button"
            >
              ◀
            </button>
          </div>

          {/* Create New Button */}
          <Button
            variant="primary"
            onClick={onCreateNew}
            className="w-full mb-4 text-sm"
            type="button"
          >
            + Upload New PDF
          </Button>

          {/* Search */}
          <input
            type="text"
            placeholder="Search PDFs..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full mb-3 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full mb-3 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="newest" className="bg-gray-800 text-white">
              Newest First
            </option>
            <option value="oldest" className="bg-gray-800 text-white">
              Oldest First
            </option>
            <option value="name_asc" className="bg-gray-800 text-white">
              Name A-Z
            </option>
            <option value="name_desc" className="bg-gray-800 text-white">
              Name Z-A
            </option>
          </select>

          {/* Date Range */}
          <div className="mb-3 space-y-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="From date"
              className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="To date"
              className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => handleExport("csv")}
              type="button"
              className="flex-1 px-3 py-2 bg-green-500/80 hover:bg-green-600/80 text-white text-xs rounded-lg transition-colors cursor-pointer"
            >
              Export CSV
            </button>
            <button
              onClick={() => handleExport("json")}
              type="button"
              className="flex-1 px-3 py-2 bg-blue-500/80 hover:bg-blue-600/80 text-white text-xs rounded-lg transition-colors cursor-pointer"
            >
              Export JSON
            </button>
          </div>

          {/* PDF List */}
          <div className="space-y-2 overflow-y-auto flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : pdfs.length > 0 ? (
              pdfs.map((pdf) => (
                <div
                  key={pdf.id}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    activePDF?.id === pdf.id
                      ? "bg-yellow-200/55 text-gray-800 backdrop-blur-sm"
                      : "bg-white/50 hover:bg-white/30 backdrop-blur-sm border border-white/50 text-gray-700 hover:text-gray-900"
                  }`}
                  onClick={() => onSelectPDF(pdf)}
                >
                  <p className="text-sm font-medium truncate">
                    {pdf.original_name}
                  </p>
                  <p className="text-sm font-medium truncate text-gray-500">
                    {(pdf.file_size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePDF(pdf.id);
                      }}
                      type="button"
                      className="text-xs text-white hover:text-red-200 bg-red-500/80 hover:bg-red-600/80 rounded-full px-2 py-1 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                    <p className="text-xs opacity-8">
                      {new Date(pdf.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">
                No PDFs found
              </p>
            )}
          </div>

          {/* Pagination */}

          <div className="text-gray-900 text-sm">
            DEBUG — totalPages: {totalPages}, currentPage: {currentPage}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 relative z-50 bg-gray-900">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded disabled:opacity-50"
              >
                Prev
              </button>

              <span className="text-sm text-white/70">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => onToggle(true)}
          type="button"
          className="fixed left-0 top-12 translate-y-1/2 bg-white/30 backdrop-blur-md border border-white/50 p-2 rounded-r-lg hover:bg-white/50 z-50 transition-all cursor-pointer"
        >
          ▶
        </button>
      )}
    </>
  );
};
