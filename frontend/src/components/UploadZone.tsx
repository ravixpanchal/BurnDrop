'use client';

import { useCallback, useRef, useState } from 'react';
import clsx from 'clsx';
import { config, formatBytes, getFileExtension, maxFileSizeBytes } from '@/lib/config';

interface UploadZoneProps {
  files: File[];
  onFilesSelect: (files: File[]) => void;
  disabled?: boolean;
}

export function UploadZone({ files, onFilesSelect, disabled }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndAddFiles = useCallback(
    (newFiles: File[]) => {
      const combined = [...files];

      for (const file of newFiles) {
        // Prevent duplicate file entries with same name and size
        if (!combined.some((f) => f.name === file.name && f.size === file.size)) {
          combined.push(file);
        }
      }

      const totalSize = combined.reduce((acc, f) => acc + f.size, 0);
      if (totalSize > maxFileSizeBytes) {
        alert('Combined size exceeds maximum supported limit of 1 GB.');
        return;
      }

      onFilesSelect(combined);
    },
    [files, onFilesSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      const dropped = Array.from(e.dataTransfer.files);
      if (dropped.length > 0) {
        validateAndAddFiles(dropped);
      }
    },
    [disabled, validateAndAddFiles],
  );

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onFilesSelect(updated);
  };

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  const getBadgeColor = (filename: string) => {
    const ext = getFileExtension(filename).toUpperCase();
    if (['JPG', 'JPEG', 'PNG', 'GIF', 'WEBP', 'SVG'].includes(ext)) {
      return 'bg-blue-100 text-blue-800';
    }
    if (['PDF'].includes(ext)) {
      return 'bg-red-100 text-red-800';
    }
    if (['TXT', 'JSON', 'CSV', 'XML', 'MD', 'JS', 'TS', 'PY'].includes(ext)) {
      return 'bg-emerald-100 text-emerald-800';
    }
    if (['ZIP', 'RAR', '7Z', 'TAR', 'GZ'].includes(ext)) {
      return 'bg-purple-100 text-purple-800';
    }
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            validateAndAddFiles(Array.from(e.target.files));
            e.target.value = '';
          }
        }}
      />

      {files.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="mb-3 sm:mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <p className="font-semibold text-slate-900 text-sm sm:text-base">
                {files.length} {files.length === 1 ? 'item' : 'items'} selected
              </p>
              <p className="text-xs text-slate-500">{formatBytes(totalSize)} total</p>
            </div>
            {!disabled && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                >
                  + Add More Files
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => onFilesSelect([])}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 py-1"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1">
            {files.map((file, idx) => (
              <div key={`${file.name}-${idx}`} className="flex items-center justify-between py-2.5 gap-2 sm:gap-3">
                <div className="min-w-0 flex-1 flex items-center gap-2 sm:gap-3">
                  <span
                    className={clsx(
                      'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                      getBadgeColor(file.name),
                    )}
                  >
                    {getFileExtension(file.name) || 'FILE'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs sm:text-sm font-medium text-slate-800" title={file.name}>{file.name}</p>
                    <p className="text-[11px] sm:text-xs text-slate-400">{formatBytes(file.size)}</p>
                  </div>
                </div>

                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="shrink-0 text-slate-400 hover:text-red-600 p-1.5 transition-colors rounded hover:bg-slate-100"
                    aria-label={`Remove ${file.name}`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={clsx(
            'rounded-xl border-2 border-dashed p-6 text-center transition-colors sm:p-12',
            dragOver ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-white',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        >
          <div className="mx-auto mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-slate-100">
            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <p className="hidden sm:block text-sm font-medium text-slate-700">
            Drag images, files, or data here
          </p>
          <p className="sm:hidden text-sm font-medium text-slate-700">Choose multiple files</p>
          <p className="mt-1 text-xs text-slate-500 px-2">Select multiple items together (images, PDFs, documents, data)</p>
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="btn-download mt-4 inline-flex items-center gap-2 py-2.5 px-5 text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 transition-all duration-200"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span>Choose Files</span>
          </button>
          <p className="mt-3 sm:mt-4 text-[11px] sm:text-xs text-slate-400">
            Maximum total limit: {config.maxFileSizeMb >= 1024 ? '1 GB' : `${config.maxFileSizeMb} MB`}
          </p>
        </div>
      )}
    </div>
  );
}
