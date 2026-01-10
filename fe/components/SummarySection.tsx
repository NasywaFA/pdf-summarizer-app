"use client";

import React, { useEffect, useState } from "react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { SummaryType } from "@/types/SummaryType";
import ReactMarkdown from "react-markdown";

interface SummarySectionProps {
  summaries: SummaryType[];
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onSelect?: (summary: SummaryType) => void;
  activeSummaryId?: string | null;
}

export const SummarySection: React.FC<SummarySectionProps> = ({
  summaries,
  onEdit,
  onDelete,
  onSelect,
  activeSummaryId,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleEdit = (summary: SummaryType) => {
    setEditingId(summary.id);
    setEditContent(summary.content);
  };

  const handleSave = () => {
    if (editingId) {
      onEdit(editingId, editContent);
      setEditingId(null);
      setEditContent("");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditContent("");
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      processing: "bg-yellow-500/80",
      completed: "bg-green-500/80",
      failed: "bg-red-500/80",
      timeout: "bg-orange-500/80",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs text-white ${
          colors[status as keyof typeof colors] || "bg-white-500/80"
        }`}
      >
        {status}
      </span>
    );
  };

  useEffect(() => {
    setExpandedId(null);
    setEditingId(null);
    setEditContent("");
  }, [summaries]);

  if (summaries.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-gray-500 text-center">
          No summaries yet. Generate one to get started.
        </p>
      </Card>
    );
  }

  const isPlaceholder = (content: string) => {
    return content?.startsWith("AI-generated summary for PDF");
  };

  return (
    <div className="space-y-3">
      {summaries.map((summary) => (
        <Card
          key={summary.id}
          className={`p-4 cursor-pointer transition ${
            activeSummaryId === summary.id ? "" : ""
          }`}
        >
          <div
            className="flex items-center justify-between"
            onClick={() => {
              setExpandedId(expandedId === summary.id ? null : summary.id);

              if (onSelect && summary.status === "completed") {
                onSelect(summary);
              }
            }}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-200">
                  {summary.language} - {summary.style}
                </span>
                {getStatusBadge(summary.status)}
                {summary.is_edited && (
                  <span className="text-xs text-gray-300 italic">(edited)</span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                {new Date(summary.created_at).toLocaleString()}
              </p>
            </div>
            <span className="text-gray-300">
              {expandedId === summary.id ? "▼" : "▶"}
            </span>
          </div>

          {expandedId === summary.id && (
            <div className="mt-4 pt-4 border-t border-white/20">
              {editingId === summary.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-40 p-3 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <Button variant="primary" onClick={handleSave}>
                      Save
                    </Button>
                    <Button variant="secondary" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {summary.status === "processing" && (
                    <p className="text-sm italic text-gray-400">
                      AI is generating this summary...
                    </p>
                  )}

                  {summary.status === "failed" ||
                  summary.status === "timeout" ? (
                    <p className="text-sm text-red-400">
                      Failed to generate summary. Please try again.
                    </p>
                  ) : summary.status === "completed" ? (
                    isPlaceholder(summary.content) ? (
                      <p className="text-sm italic text-gray-400">
                        Summary still contains placeholder content.
                      </p>
                    ) : (
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
                        {summary.content}
                      </ReactMarkdown>
                    )
                  ) : null}

                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      disabled={
                        summary.status !== "completed" ||
                        isPlaceholder(summary.content)
                      }
                      onClick={() => handleEdit(summary)}
                    >
                      Edit
                    </Button>

                    <Button
                      variant="danger"
                      disabled={summary.status === "processing"}
                      onClick={() => onDelete(summary.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
