'use client';

import React, { useState } from 'react';

export interface DocumentUploaderProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  existingDocumentName?: string;
  onRemoveExisting?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUploader({
  file,
  onFileChange,
  existingDocumentName,
  onRemoveExisting,
}: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onFileChange(dropped);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    onFileChange(selected);
    e.target.value = '';
  };

  return (
    <div>
      <span className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide block mb-2">
        Upload Document
      </span>

      {existingDocumentName && !file && (
        <div className="flex items-center justify-between gap-3 mb-2 px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-low">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px] shrink-0">description</span>
            <span className="text-body-md text-on-surface truncate font-medium" title={existingDocumentName}>
              {existingDocumentName}
            </span>
          </div>
          {onRemoveExisting && (
            <button
              type="button"
              onClick={onRemoveExisting}
              className="text-on-surface-variant hover:text-error p-1 rounded-full hover:bg-error-container/20 transition-colors cursor-pointer shrink-0"
              title="Remove document"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
      )}

      {file && (
        <div className="flex items-center justify-between gap-3 mb-2 px-4 py-3 rounded-lg border border-primary/30 bg-primary-fixed/10">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-primary text-[18px] shrink-0">upload_file</span>
            <div className="min-w-0">
              <span className="text-body-md text-on-surface truncate font-medium block" title={file.name}>
                {file.name}
              </span>
              <span className="text-[10px] text-on-surface-variant font-medium">{formatFileSize(file.size)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onFileChange(null)}
            className="text-on-surface-variant hover:text-error p-1 rounded-full hover:bg-error-container/20 transition-colors cursor-pointer shrink-0"
            title="Remove file"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {!file && !existingDocumentName && (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-1.5 px-4 py-6 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-200 select-none ${
            isDragging
              ? 'border-primary bg-primary-fixed/10'
              : 'border-outline-variant bg-surface-container-low hover:border-primary/50 hover:bg-surface-container'
          }`}
        >
          <input
            type="file"
            onChange={handleFileInput}
            className="sr-only"
          />
          <span className={`material-symbols-outlined text-[28px] ${isDragging ? 'text-primary' : 'text-on-surface-variant'}`}>
            cloud_upload
          </span>
          <span className="font-body-md text-body-md text-on-surface font-medium">
            Drag & drop or <span className="text-primary font-semibold">browse</span>
          </span>
          <span className="font-label-md text-label-md text-on-surface-variant">
            PDF, JPG, PNG, WEBP (Max 10 MB) · AI scan: JPG/PNG/WEBP
          </span>
        </label>
      )}
    </div>
  );
}
