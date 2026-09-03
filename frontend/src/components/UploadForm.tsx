'use client';

import { useState } from 'react';
import { UploadZone } from '@/components/UploadZone';
import { UploadProgress } from '@/components/UploadProgress';
import { ShareCodeCard } from '@/components/ShareCodeCard';
import { ApiError, ShareCreateResponse, uploadFiles } from '@/lib/api';
import { config } from '@/lib/config';

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export function UploadForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [email, setEmail] = useState('');
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState({ percent: 0, loaded: 0, total: 0 });
  const [result, setResult] = useState<ShareCreateResponse | null>(null);
  const [error, setError] = useState('');

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 || !isValidEmail) return;

    const totalPayloadSize = files.reduce((acc, f) => acc + f.size, 0);

    setState('uploading');
    setError('');
    setProgress({ percent: 0, loaded: 0, total: totalPayloadSize });

    try {
      const response = await uploadFiles(files, email, (percent, loaded, total) => {
        setProgress({ percent, loaded, total });
      });
      setResult(response);
      setState('success');
    } catch (err) {
      setState('error');
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Upload failed. Please try again.');
      }
    }
  };

  if (state === 'success' && result) {
    return (
      <ShareCodeCard
        code={result.code}
        expiresAt={result.expires_at}
        emailSent={result.email_sent}
        filename={result.filename}
        sizeBytes={result.size_bytes}
        fileCount={files.length}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 xs:space-y-6">
      {state === 'uploading' ? (
        <UploadProgress percent={progress.percent} loaded={progress.loaded} total={progress.total} />
      ) : (
        <UploadZone files={files} onFilesSelect={setFiles} disabled={false} />
      )}

      <div className="relative overflow-hidden rounded-2xl xs:rounded-3xl border border-slate-200/90 bg-gradient-to-b from-white via-slate-50/60 to-slate-100/50 p-4 xs:p-5 sm:p-6 shadow-md shadow-slate-950/5 backdrop-blur-md transition-all">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5">
          <label htmlFor="email" className="text-xs xs:text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <svg className="h-4 w-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Recipient Email Address</span>
          </label>
          {isValidEmail && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>Valid Email</span>
            </span>
          )}
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 xs:pl-4 text-slate-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="friend@example.com"
            className="w-full rounded-xl xs:rounded-2xl border border-slate-300/90 bg-white/90 pl-10 xs:pl-11 pr-4 py-2.5 xs:py-3 text-xs xs:text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 shadow-xs min-h-[44px]"
            disabled={state === 'uploading'}
            required
          />
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] xs:text-xs text-slate-500 font-medium">
          <svg className="h-3.5 w-3.5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>The download PIN code will be sent to this email address instantly.</span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 xs:px-4 py-2.5 xs:py-3 text-xs xs:text-sm font-medium text-rose-700 shadow-xs" role="alert">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={files.length === 0 || !isValidEmail || state === 'uploading'}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-4 xs:px-6 py-3 xs:py-3.5 text-xs xs:text-sm sm:text-base font-bold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none min-h-[48px]"
      >
        <svg className="h-4 w-4 xs:h-5 xs:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span>
          {state === 'uploading'
            ? 'Uploading Files...'
            : files.length > 1
            ? `Generate Code for ${files.length} Files`
            : 'Generate One-Time Code'}
        </span>
      </button>

      <p className="text-center text-[11px] xs:text-xs text-slate-400">
        🔒 Files expire automatically after {config.fileExpirationHours} hours.
      </p>
    </form>
  );
}
