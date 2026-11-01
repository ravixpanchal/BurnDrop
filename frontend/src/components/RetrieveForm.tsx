'use client';

import { useEffect, useState } from 'react';
import { ApiError, downloadFile, openPreview, verifyCode, VerifyCodeResponse } from '@/lib/api';
import { formatBytes, formatExpiryCountdown, getFileExtension } from '@/lib/config';

type RetrieveState =
  | { step: 'input' }
  | { step: 'loading' }
  | { step: 'ready'; data: VerifyCodeResponse }
  | { step: 'error'; message: string; type: 'invalid' | 'expired' | 'consumed' | 'storage' | 'generic' };

function FileReadyView({
  data,
  onError,
  onBack,
}: {
  data: VerifyCodeResponse;
  onError: (message: string) => void;
  onBack: () => void;
}) {
  const [countdown, setCountdown] = useState(formatExpiryCountdown(data.expires_at));
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [notice, setNotice] = useState('');
  const expired = countdown === 'Expired';

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(formatExpiryCountdown(data.expires_at));
    }, 1000);
    return () => clearInterval(interval);
  }, [data.expires_at]);

  const fileList = data.files && data.files.length > 0
    ? data.files
    : [
        {
          id: 'main',
          filename: data.filename,
          size_bytes: data.size_bytes,
          mime_type: data.mime_type,
          can_preview: data.can_preview,
        },
      ];

  const totalSize = fileList.reduce((acc, f) => acc + f.size_bytes, 0);

  const handleDownloadAll = async () => {
    if (fileList.length === 1) {
      await handleDownloadSingle(fileList[0].id, fileList[0].filename);
      return;
    }
    setDownloadingAll(true);
    try {
      const zipName = data.filename.endsWith('.zip') ? data.filename : `${data.filename.replace(/\.[^/.]+$/, '')}.zip`;
      await downloadFile(data.access_token, zipName, undefined, true);
      setNotice("Download requested. Check your browser’s downloads for progress or any errors.");
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Download failed');
    } finally {
      setDownloadingAll(false);
    }
  };

  const handleDownloadSingle = async (fileId: string, filename: string) => {
    setDownloadingId(fileId);
    try {
      const targetId = fileId === 'main' ? undefined : fileId;
      await downloadFile(data.access_token, filename, targetId);
      setNotice("Download requested. Check your browser’s downloads for progress or any errors.");
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleViewSingle = async (fileId: string) => {
    setDownloadingId(fileId);
    try {
      const targetId = fileId === 'main' ? undefined : fileId;
      await openPreview(data.access_token, targetId);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Preview failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const getBadgeColor = (filename: string) => {
    const ext = getFileExtension(filename).toUpperCase();
    if (['JPG', 'JPEG', 'PNG', 'GIF', 'WEBP', 'SVG'].includes(ext)) {
      return 'bg-brand-100 text-brand-800 border-brand-200';
    }
    if (['PDF'].includes(ext)) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    if (['TEX', 'TXT', 'JSON', 'CSV', 'XML', 'MD', 'JS', 'TS', 'PY', 'HTML', 'CSS'].includes(ext)) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (['ZIP', 'RAR', '7Z', 'TAR', 'GZ'].includes(ext)) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-4 xs:p-6 sm:p-8 shadow-sm  backdrop-blur-md">
      {/* Decorative ambient background glow */}

      {/* Top Bar Navigation & Status Indicators */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 xs:gap-3 border-b border-slate-200/80 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="group inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-brand-600 hover:border-brand-200 transition-all  "
        >
          <svg className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200/80 bg-brand-50/90 px-3 py-1.5 text-xs font-bold text-brand-700 shadow-sm">
            <svg className="h-3.5 w-3.5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Expires: <span className="font-mono">{countdown}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300/80 bg-emerald-100/90 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-800 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 "></span>
            Access granted
          </span>
        </div>
      </div>

      {/* Title & Download All Header */}
      <div className="relative z-10 mt-5 sm:mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg xs:text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Files Available</span>
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-500">
            {fileList.length} {fileList.length === 1 ? 'file' : 'files'} shared &middot;{' '}
            <span className="font-semibold text-slate-700">{formatBytes(totalSize)} total</span>
          </p>
        </div>

        <button
          onClick={handleDownloadAll}
          disabled={expired || downloadingAll || downloadingId !== null}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 xs:py-3 text-xs sm:text-sm font-bold text-white shadow-sm transition-all duration-200 ring-2 ring-brand-500/20 disabled:opacity-50 disabled:"
        >
          <svg className={`h-4 w-4 ${downloadingAll ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>{downloadingAll ? 'Packaging ZIP...' : fileList.length === 1 ? 'Download file' : 'Download all (.zip)'}</span>
        </button>
      </div>

      <p role="status" className="mt-4 text-sm text-slate-700">{expired ? "This share has expired. Ask the sender for a new code." : notice}</p>

      {/* File List Container */}
      <div className="relative z-10 mt-5 sm:mt-6 rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        <div className="hidden sm:flex px-4 py-3 bg-white border-b border-slate-200/80 text-xs font-bold uppercase tracking-wider text-slate-600 justify-between">
          <span>File Name & Information</span>
          <span>Actions</span>
        </div>

        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto custom-scrollbar">
          {fileList.map((file) => (
            <div
              key={file.id}
              className="p-3 xs:p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white hover:bg-brand-50/30 transition-colors"
            >
              <div className="min-w-0 flex-1 flex items-center gap-2.5 xs:gap-3">
                <span
                  className={`shrink-0 rounded-lg border px-2 py-1 text-xs sm:text-xs font-extrabold uppercase tracking-wider shadow-xs ${getBadgeColor(
                    file.filename,
                  )}`}
                >
                  {getFileExtension(file.filename) || 'FILE'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-xs sm:text-sm text-slate-900 truncate" title={file.filename}>
                    {file.filename}
                  </p>
                  <p className="text-xs xs:text-xs sm:text-xs font-medium text-slate-600">
                    {formatBytes(file.size_bytes)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t border-slate-100 sm:border-t-0">
                {file.can_preview && (
                  <button
                    onClick={() => handleViewSingle(file.id)}
                    disabled={expired || downloadingAll || downloadingId !== null}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-700 shadow-xs hover:bg-slate-100 hover:border-slate-400 hover:text-slate-900 transition-all disabled:opacity-50 min-h-[40px] sm:min-h-[36px]"
                  >
                    <svg className="h-3.5 w-3.5 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{downloadingId === file.id ? 'Opening...' : 'View'}</span>
                  </button>
                )}
                <button
                  onClick={() => handleDownloadSingle(file.id, file.filename)}
                  disabled={expired || downloadingAll || downloadingId !== null}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 text-white shadow-sm transition-all disabled:opacity-50 min-h-[40px] sm:min-h-[36px]"
                >
                  <svg className={`h-3.5 w-3.5 shrink-0 ${downloadingId === file.id ? 'animate-bounce' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>{downloadingId === file.id ? 'Downloading...' : 'Download'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Expiration Note Banner */}
      <div className="relative z-10 mt-5 rounded-2xl bg-brand-50/80 border border-brand-200/80 p-3.5 text-center text-xs text-slate-600 font-medium flex flex-col xs:flex-row items-center justify-center gap-2 shadow-xs">
        <svg className="h-4 w-4 text-brand-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>
          Keep this page open while accessing your files. Access is temporary and ends when your session or share expires.
        </span>
      </div>
    </div>
  );
}

export function RetrieveForm() {
  const [code, setCode] = useState('');
  const [state, setState] = useState<RetrieveState>({ step: 'input' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.replace(/[^A-Z0-9]/g, '').length !== 8) return;

    setState({ step: 'loading' });
    try {
      const data = await verifyCode(code.trim());
      setState({ step: 'ready', data });
    } catch (err) {
      if (err instanceof ApiError) {
        const detail = err.message.toLowerCase();
        if (detail.includes('expired')) {
          setState({ step: 'error', message: err.message, type: 'expired' });
        } else if (detail.includes('already been used') || detail.includes('consumed')) {
          setState({ step: 'error', message: err.message, type: 'consumed' });
        } else if (detail.includes('access this file')) {
          setState({ step: 'error', message: err.message, type: 'storage' });
        } else if (err.status === 404 || detail.includes('invalid')) {
          setState({
            step: 'error',
            message: 'Invalid code. Please check the code and try again.',
            type: 'invalid',
          });
        } else {
          setState({ step: 'error', message: err.message, type: 'generic' });
        }
      } else {
        setState({ step: 'error', message: 'An unexpected error occurred.', type: 'generic' });
      }
    }
  };

  if (state.step === 'ready') {
    return (
      <FileReadyView
        data={state.data}
        onError={(message) => setState({ step: 'error', message, type: 'storage' })}
        onBack={() => setState({ step: 'input' })}
      />
    );
  }

  if (state.step === 'error') {
    const titles: Record<string, string> = {
      invalid: 'Invalid code',
      expired: 'This share has expired.',
      consumed: 'This code has already been used.',
      storage: 'File unavailable',
      generic: 'Error',
    };

    return (
      <div className="relative overflow-hidden rounded-3xl border border-red-200/90 bg-white p-5 xs:p-7 sm:p-9 shadow-sm shadow-red-950/5 text-center" role="alert">
        <div className="mb-4 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 ring-4 ring-red-500/10">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        <h2 className="text-base xs:text-lg sm:text-xl font-extrabold text-red-900">{titles[state.type]}</h2>
        <p className="mt-2 text-sm text-red-700 max-w-md mx-auto">{state.message}</p>
        {(state.type === "expired" || state.type === "consumed") && <p className="mt-3 text-sm text-slate-600">Ask the sender to create a new share and send you a fresh code.</p>}
        <button
          onClick={() => setState({ step: 'input' })}
          className="mt-6 inline-flex w-full xs:w-auto items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 xs:py-3 text-xs xs:text-sm font-bold text-white shadow-sm hover:bg-slate-800 transition-colors min-h-[44px]"
        >
          {state.type === 'expired' || state.type === 'consumed' ? 'Enter another code' : 'Try again'}
        </button>
      </div>
    );
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase();
    const clean = raw.replace(/[^A-Z0-9]/g, '');
    if (clean.length > 4) {
      setCode(`${clean.slice(0, 4)}-${clean.slice(4, 8)}`);
    } else {
      setCode(clean);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-4 xs:p-7 sm:p-9 shadow-sm  backdrop-blur-md">
      {/* Ambient background glows */}

      <form onSubmit={handleSubmit} className="relative z-10 space-y-4 xs:space-y-6">
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
            <label htmlFor="code" className="text-xs xs:text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <svg className="h-4 w-4 text-brand-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 0121 9z" />
              </svg>
              <span>Enter your one-time code</span>
            </label>
            <span id="code-help" className="text-xs font-medium text-slate-600">8 characters (XXXX-XXXX)</span>
          </div>

          <div className="relative">
            <input
              id="code"
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="XXXX-XXXX"
              className="w-full rounded-2xl border-2 border-slate-200/90 bg-white/90 px-3 xs:px-4 py-3 xs:py-3.5 sm:py-4 text-center font-mono text-base xs:text-xl sm:text-2xl font-black tracking-wider xs:tracking-widest text-slate-900 placeholder:text-slate-300 placeholder:font-normal shadow-xs focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/20 transition-all duration-200 uppercase disabled:opacity-50 min-h-[48px]"
              maxLength={9}
              disabled={state.step === 'loading'}
              autoComplete="one-time-code"
              autoCapitalize="characters"
              aria-describedby="code-help"
              required
              spellCheck={false}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={state.step === 'loading' || code.replace(/[^A-Z0-9]/g, '').length !== 8}
          className="group relative w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-brand-600 px-6 py-3.5 xs:py-4 text-xs xs:text-sm sm:text-base font-bold text-white shadow-sm transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none ring-2 ring-brand-500/20 min-h-[48px]"
        >
          {state.step === 'loading' ? (
            <>
              <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Verifying PIN Code...</span>
            </>
          ) : (
            <>
              <svg className="h-5 w-5  transition-transform " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Access files</span>
            </>
          )}
        </button>
      </form>

      {/* Feature trust highlights */}
      <div className="relative z-10 mt-6 pt-5 border-t border-slate-200/60 grid grid-cols-1 xs:grid-cols-3 gap-2.5 text-xs font-semibold text-slate-500 text-center">
        <div className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-100/80 px-2 py-1.5">
          <span>One-time code</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-100/80 px-2 py-1.5">
          <span>Temporary access</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-100/80 px-2 py-1.5">
          <span>No account needed</span>
        </div>
      </div>
    </div>
  );
}
