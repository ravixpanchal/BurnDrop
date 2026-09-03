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
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (['PDF'].includes(ext)) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    if (['TXT', 'JSON', 'CSV', 'XML', 'MD', 'JS', 'TS', 'PY'].includes(ext)) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (['ZIP', 'RAR', '7Z', 'TAR', 'GZ'].includes(ext)) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
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
        <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 xs:p-4 sm:p-6 shadow-md backdrop-blur-sm transition-all">
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 sm:gap-3 border-b border-slate-100 pb-3">
            <div>
              <p className="font-bold text-slate-900 text-xs xs:text-sm sm:text-base flex items-center gap-2">
                <span>📁 {files.length} {files.length === 1 ? 'file' : 'files'} selected</span>
              </p>
              <p className="text-[11px] xs:text-xs text-slate-500 mt-0.5">{formatBytes(totalSize)} total size</p>
            </div>
            {!disabled && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-xl bg-blue-50 border border-blue-200/80 px-2.5 py-1.5 xs:px-3 xs:py-2 text-xs font-bold text-blue-600 hover:bg-blue-600 hover:text-white hover:border-transparent transition-all duration-200 shadow-xs min-h-[36px] xs:min-h-[40px]"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Add More
                </button>
                <span className="text-slate-200">|</span>
                <button
                  type="button"
                  onClick={() => onFilesSelect([])}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 py-1 hover:underline min-h-[36px] xs:min-h-[40px] px-1 inline-flex items-center"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between p-2 xs:p-2.5 sm:p-3 rounded-xl border border-slate-100 bg-slate-50/80 hover:bg-white hover:border-slate-200 hover:shadow-xs transition-all gap-2 sm:gap-3 min-w-0"
              >
                <div className="min-w-0 flex-1 flex items-center gap-2 xs:gap-3">
                  <span
                    className={clsx(
                      'shrink-0 rounded-lg border px-1.5 xs:px-2 py-0.5 xs:py-1 text-[10px] xs:text-[11px] font-extrabold uppercase tracking-wider shadow-2xs',
                      getBadgeColor(file.name),
                    )}
                  >
                    {getFileExtension(file.name) || 'FILE'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs sm:text-sm font-semibold text-slate-800 break-word-all" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[10px] xs:text-[11px] text-slate-400">{formatBytes(file.size)}</p>
                  </div>
                </div>

                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="shrink-0 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
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
            'group relative overflow-hidden rounded-2xl border-2 border-dashed p-4 xs:p-6 sm:p-10 text-center transition-all duration-300',
            dragOver
              ? 'border-blue-500 bg-blue-50/90 shadow-xl shadow-blue-500/10 ring-4 ring-blue-500/20 scale-[1.01]'
              : 'border-slate-300/90 bg-gradient-to-b from-white via-slate-50/40 to-slate-100/50 hover:border-blue-400 hover:bg-blue-50/20 hover:shadow-md',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        >
          {/* Ambient background decoration */}
          <div className="pointer-events-none absolute inset-0 bg-radial-gradient from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Animated Upload Icon */}
          <div className="relative mx-auto mb-3 xs:mb-4 flex h-12 w-12 xs:h-14 xs:w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-1 transition-all duration-300">
            <svg className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          {/* Title & Instructions */}
          <h3 className="text-sm xs:text-base sm:text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
            Drop files here or click to browse
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm mx-auto px-2">
            Select multiple images, PDFs, archives, or code files to generate a secure code.
          </p>

          {/* Primary Action Button */}
          <div className="mt-4 xs:mt-5 flex justify-center">
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="w-full xs:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-5 xs:px-6 py-3 xs:py-3.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-105 active:scale-95 transition-all duration-200 ring-2 ring-blue-500/20 min-h-[44px]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span>Choose Files</span>
            </button>
          </div>

          {/* Supported Format Pills */}
          <div className="mt-5 xs:mt-6 flex flex-wrap items-center justify-center gap-1.5 xs:gap-2 text-[10px] xs:text-[11px] text-slate-500">
            <span className="rounded-full bg-slate-100 px-2 xs:px-2.5 py-0.5 font-medium text-slate-600 border border-slate-200/60">
              📄 Documents
            </span>
            <span className="rounded-full bg-slate-100 px-2 xs:px-2.5 py-0.5 font-medium text-slate-600 border border-slate-200/60">
              🖼️ Images
            </span>
            <span className="rounded-full bg-slate-100 px-2 xs:px-2.5 py-0.5 font-medium text-slate-600 border border-slate-200/60">
              📦 Archives
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200/80 px-2 xs:px-2.5 py-0.5 font-semibold text-blue-700">
              ⚡ Max Total: {config.maxFileSizeMb >= 1024 ? '1 GB' : `${config.maxFileSizeMb} MB`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
