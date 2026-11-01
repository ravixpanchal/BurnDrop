'use client';

import { useEffect, useRef, useState } from 'react';
import { formatBytes } from '@/lib/config';

interface UploadProgressProps {
  percent: number;
  loaded: number;
  total: number;
}

export function UploadProgress({ percent, loaded, total }: UploadProgressProps) {
  const started = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (loaded > 0 && started.current === null) started.current = Date.now();
    const tick = () => setElapsed(started.current === null ? 0 : (Date.now() - started.current) / 1000);
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [loaded]);
  const speed = elapsed > 0 ? loaded / elapsed : 0;
  const seconds = speed > 0 ? Math.ceil(Math.max(0, total - loaded) / speed) : 0;
  const finishing = percent >= 100;
  const timeLeft = seconds < 60 ? `${seconds}s` : `${Math.ceil(seconds / 60)} min`;

  return (
    <section className="rounded-xl border border-brand-200 bg-white p-5 sm:p-6" aria-label="Upload status">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800" role="status">
          {finishing ? 'Upload sent · finishing your share…' : loaded === 0 ? 'Connecting and preparing upload…' : 'Uploading your files…'}
        </p>
        <span className="text-2xl font-bold tabular-nums text-brand-700">{percent}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-brand-100" role="progressbar" aria-label="Files uploaded" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-brand-600 transition-[width] duration-200" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm tabular-nums text-slate-600">
        <span>{formatBytes(loaded)} / {formatBytes(total)}</span>
        {!finishing && speed > 0 && <span>{formatBytes(speed)}/s · about {timeLeft} left</span>}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-600">
        {finishing ? 'The server is confirming storage and creating your code. Keep this page open.' : 'Keep this page open until your sharing code appears. Speed depends on your connection and storage provider.'}
      </p>
    </section>
  );
}
