'use client';

import { formatBytes } from '@/lib/config';

interface UploadProgressProps {
  percent: number;
  loaded: number;
  total: number;
}

export function UploadProgress({ percent, loaded, total }: UploadProgressProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6" role="status" aria-live="polite">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">Uploading...</span>
        <span className="text-slate-500">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-400">
        {formatBytes(loaded)} / {formatBytes(total)}
      </p>
    </div>
  );
}
