"use client";

import React, { useState, useEffect } from "react";
import { pdfService } from "@/services/pdfService";
import { PDF, SummaryType } from "@/types/SummaryType";
import { SummarySection } from "./SummarySection";

interface SummaryHistoryProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  activePDF: PDF | null;
  summaries: SummaryType[];
  activeSummaryId: string | null;
  onSelectSummary: (summary: SummaryType) => void;
  onEditSummary: (id: string, content: string) => void;
  onDeleteSummary: (id: string) => void;
  onReloadSummaries: () => void;
}

export const SummaryHistory: React.FC<SummaryHistoryProps> = ({
  isOpen,
  onToggle,
  activePDF,
  summaries,
  activeSummaryId,
  onSelectSummary,
  onEditSummary,
  onDeleteSummary,
  onReloadSummaries,
}) => {
  {
    /* Filter States */
  }
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [styleFilter, setStyleFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filteredSummaries, setFilteredSummaries] = useState<SummaryType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  {
    /* Check if any filter is active */
  }
  const hasActiveFilters = !!(
    searchQuery ||
    statusFilter ||
    languageFilter ||
    styleFilter ||
    dateFrom ||
    dateTo ||
    sortBy !== "newest"
  );

  {
    /* Reset filters when PDF changes */
  }
  useEffect(() => {
    setSearchQuery("");
    setSortBy("newest");
    setStatusFilter("");
    setLanguageFilter("");
    setStyleFilter("");
    setDateFrom("");
    setDateTo("");
    setFilteredSummaries([]);
  }, [activePDF?.id]);

  {
    /* Load filtered summaries when filters change */
  }
  useEffect(() => {
    if (!activePDF) {
      setFilteredSummaries([]);
      return;
    }

    if (!hasActiveFilters) {
      setFilteredSummaries(summaries);
      return;
    }

    {
      /* Load filtered summaries from API */
    }
    const fetchFiltered = async () => {
      setIsLoading(true);
      try {
        const response = await pdfService.getSummariesWithFilter(activePDF.id, {
          search: searchQuery,
          sort: sortBy,
          status: statusFilter,
          language: languageFilter,
          style: styleFilter,
          date_from: dateFrom,
          date_to: dateTo,
        });

        console.log("Filtered Response:", response);

        if (response.isSuccess) {
          setFilteredSummaries(response.data || []);
        } else {
          console.error("Filter failed:", response.message);
          setFilteredSummaries([]);
        }
      } catch (error) {
        console.error("Failed to load summaries", error);
        setFilteredSummaries([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiltered();
  }, [
    activePDF?.id,
    searchQuery,
    sortBy,
    statusFilter,
    languageFilter,
    styleFilter,
    dateFrom,
    dateTo,
    hasActiveFilters,
  ]);

  {
    /* Update filtered summaries when parent summaries change (no filters) */
  }
  useEffect(() => {
    if (!hasActiveFilters && activePDF) {
      setFilteredSummaries(summaries);
    }
  }, [summaries, hasActiveFilters, activePDF]);

  {
    /* Export Handler */
  }
  const handleExport = async (format: "csv" | "json") => {
    if (!activePDF) return;

    try {
      await pdfService.exportSummaries(activePDF.id, format, {
        search: searchQuery,
        sort: sortBy,
        status: statusFilter,
        language: languageFilter,
        style: styleFilter,
        date_from: dateFrom,
        date_to: dateTo,
      });
      if (typeof window !== "undefined" && (window as any).showToast) {
        (window as any).showToast(
          `Summaries exported as ${format.toUpperCase()}`,
          "success"
        );
      }
    } catch (error) {
      console.error("Failed to export summaries", error);
    }
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`
          fixed top-16 right-0 z-40
          ${isOpen ? "w-full md:w-[420px] lg:w-[520px]" : "w-0"}
          bg-white/20 backdrop-blur-md border-l border-white/30
          transition-all duration-300 overflow-hidden
          h-[calc(100vh-4rem)]
        `}
      >
        <div className="p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-200">
              Summary History
            </h2>
            <button
              onClick={() => onToggle(false)}
              className="text-gray-200 hover:text-gray-400 p-1"
            >
              ▶
            </button>
          </div>

          {activePDF ? (
            <>
              {/* Search */}
              <input
                type="text"
                placeholder="Search summaries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full mb-3 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full mb-3 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest" className="bg-gray-800">
                  Newest First
                </option>
                <option value="oldest" className="bg-gray-800">
                  Oldest First
                </option>
              </select>

              {/* Filters */}
              <div className="mb-3 space-y-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" className="bg-gray-800">
                    All Status
                  </option>
                  <option value="processing" className="bg-gray-800">
                    Processing
                  </option>
                  <option value="completed" className="bg-gray-800">
                    Completed
                  </option>
                  <option value="failed" className="bg-gray-800">
                    Failed
                  </option>
                  <option value="timeout" className="bg-gray-800">
                    Timeout
                  </option>
                </select>

                <select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" className="bg-gray-800">
                    All Languages
                  </option>
                  <option value="EN" className="bg-gray-800">
                    English
                  </option>
                  <option value="ID" className="bg-gray-800">
                    Indonesia
                  </option>
                  <option value="CN" className="bg-gray-800">
                    中文
                  </option>
                  <option value="JP" className="bg-gray-800">
                    日本語
                  </option>
                  <option value="KR" className="bg-gray-800">
                    한국어
                  </option>
                </select>

                <select
                  value={styleFilter}
                  onChange={(e) => setStyleFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" className="bg-gray-800">
                    All Styles
                  </option>
                  <option value="professional" className="bg-gray-800">
                    Professional
                  </option>
                  <option value="simple" className="bg-gray-800">
                    Simple
                  </option>
                </select>
              </div>

              {/* Date Range */}
              <div className="mb-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* From */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-white text-xs">From</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* To */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-white text-xs">To</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSortBy("newest");
                    setStatusFilter("");
                    setLanguageFilter("");
                    setStyleFilter("");
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="w-full mb-3 px-3 py-2 bg-red-500/80 hover:bg-red-600/80 text-white text-xs rounded-lg transition"
                >
                  Clear All Filters
                </button>
              )}

              {/* Export Buttons */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => handleExport("csv")}
                  className="flex-1 px-3 py-2 bg-green-500/80 hover:bg-green-600/80 text-white text-xs rounded-lg transition"
                >
                  CSV
                </button>
                <button
                  onClick={() => handleExport("json")}
                  className="flex-1 px-3 py-2 bg-blue-500/80 hover:bg-blue-600/80 text-white text-xs rounded-lg transition"
                >
                  JSON
                </button>
              </div>

              {/* Summary List */}
              <div className="overflow-y-auto flex-1">
                {isLoading ? (
                  <p className="text-sm text-gray-400 text-center">
                    Loading...
                  </p>
                ) : filteredSummaries.length > 0 ? (
                  <SummarySection
                    summaries={filteredSummaries}
                    onEdit={onEditSummary}
                    onDelete={onDeleteSummary}
                    onSelect={onSelectSummary}
                    activeSummaryId={activeSummaryId}
                  />
                ) : (
                  <p className="text-sm text-gray-400 text-center">
                    {hasActiveFilters
                      ? "No summaries match your filters"
                      : "No summaries yet"}
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-300 text-center">
              Select a PDF to view summaries
            </p>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => onToggle(true)}
          className="fixed right-0 top-12 translate-y-1/2 bg-white/30 backdrop-blur-md border border-white/50 p-2 rounded-l-lg hover:bg-white/50 z-50"
        >
          ◀
        </button>
      )}
    </>
  );
};
