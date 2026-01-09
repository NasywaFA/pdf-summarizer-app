'use client';

import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { SummaryType } from '@/types/SummaryType';

interface SummarySectionProps {
  summaries: SummaryType[];
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

export const SummarySection: React.FC<SummarySectionProps> = ({
  summaries,
  onEdit,
  onDelete,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleEdit = (summary: SummaryType) => {
    setEditingId(summary.id);
    setEditContent(summary.content);
  };

  const handleSave = () => {
    if (editingId) {
      onEdit(editingId, editContent);
      setEditingId(null);
      setEditContent('');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditContent('');
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      processing: 'bg-yellow-500/80',
      completed: 'bg-green-500/80',
      failed: 'bg-red-500/80',
      timeout: 'bg-orange-500/80',
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs text-white ${
          colors[status as keyof typeof colors] || 'bg-white-500/80'
        }`}
      >
        {status}
      </span>
    );
  };

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
    return content?.startsWith('AI-generated summary for PDF');
  };

  return (
    <div className="space-y-3">
      {summaries.map((summary) => (
        <Card key={summary.id} className="p-4">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() =>
              setExpandedId(expandedId === summary.id ? null : summary.id)
            }
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-800">
                  {summary.language} - {summary.style}
                </span>
                {getStatusBadge(summary.status)}
                {summary.is_edited && (
                  <span className="text-xs text-gray-500 italic">(edited)</span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {new Date(summary.created_at).toLocaleString()}
              </p>
            </div>
            <span className="text-gray-500">
              {expandedId === summary.id ? '▼' : '▶'}
            </span>
          </div>

          {expandedId === summary.id && (
            <div className="mt-4 pt-4 border-t border-white/50">
              {editingId === summary.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-40 p-3 rounded-lg bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <div className="bg-white/50 rounded-lg p-4 border border-white/50">
                    {summary.status === 'processing' && (
                      <p className="text-sm italic text-gray-500">
                        AI is generating this summary...
                      </p>
                    )}

                    {summary.status === 'failed' || summary.status === 'timeout' ? (
                      <p className="text-sm text-red-500">
                        Failed to generate summary. Please try again.
                      </p>
                    ) : summary.status === 'completed' ? (
                      isPlaceholder(summary.content) ? (
                        <p className="text-sm italic text-gray-400">
                          Summary still contains placeholder content.
                        </p>
                      ) : (
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {summary.content}
                        </p>
                      )
                    ) : null}

                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      disabled={summary.status !== 'completed' || isPlaceholder(summary.content)}
                      onClick={() => handleEdit(summary)}
                    >
                      Edit
                    </Button>

                    <Button
                      variant="danger"
                      disabled={summary.status === 'processing'}
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