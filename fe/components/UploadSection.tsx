'use client';

import React, { useState, useRef } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface UploadSectionProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onUpload,
  isUploading,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type === 'application/pdf') {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      alert('Please upload a PDF file');
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Upload PDF</h3>

      {!selectedFile ? (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-white-300 bg-white/20'
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
            <p className="text-sm text-gray-500">PDF files only</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white/40 rounded-lg p-4 border border-white/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {selectedFile.name}
              </span>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          {previewUrl && (
            <div className="bg-white/40 rounded-lg p-2 border border-white/50">
              <iframe
                src={previewUrl}
                className="w-full h-64 rounded"
                title="PDF Preview"
              />
            </div>
          )}

          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? 'Uploading...' : 'Upload PDF'}
          </Button>
        </div>
      )}
    </Card>
  );
};