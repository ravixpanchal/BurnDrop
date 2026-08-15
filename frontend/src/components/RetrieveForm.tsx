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
    setDownloadingAll(true);
    try {
      const zipName = data.filename.endsWith('.zip') ? data.filename : `${data.filename.replace(/\.[^/.]+$/, '')}.zip`;
      await downloadFile(data.access_token, zipName, undefined, true);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Download failed');
    } finally {
      setDownloadingAll(false);
    }
  };

  const handleDownloadSingle = async (fileId: string, filename: string) => {
    setDownloadingId(fileId);
    try {
      await downloadFile(data.access_token, filename, fileId);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleViewSingle = async (fileId: string) => {
    setDownloadingId(fileId);
    try {
      await openPreview(data.access_token, fileId);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Preview failed');
    } finally {
      setDownloadingId(null);
    }
  };

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
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-8 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors py-1"
        >
          &larr; Back
        </button>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-[11px] sm:text-xs font-medium text-slate-500">Expires in: {countdown}</span>
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
            Valid OTP
          </span>
        </div>
      </div>

      <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Files Available</h2>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            {fileList.length} {fileList.length === 1 ? 'file' : 'files'} shared &middot; {formatBytes(totalSize)} total
          </p>
        </div>
        <button
          onClick={handleDownloadAll}
          disabled={downloadingAll || downloadingId !== null}
          className="btn-download w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs sm:text-sm py-2.5 px-5 shadow-md hover:shadow-lg transition-all"
        >
          <svg className={`h-4 w-4 ${downloadingAll ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {downloadingAll ? 'Packaging ZIP...' : 'Download All Files (.zip)'}
        </button>
      </div>

      <div className="mt-5 sm:mt-6 rounded-lg border border-slate-200 bg-slate-50/50 overflow-hidden">
        <div className="hidden sm:flex px-4 py-3 bg-slate-100/70 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600 justify-between">
          <span>File Name & Information</span>
          <span>Actions</span>
        </div>

        <div className="divide-y divide-slate-200/60 max-h-96 overflow-y-auto">
          {fileList.map((file) => (
            <div key={file.id} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white hover:bg-slate-50/80 transition-colors">
              <div className="min-w-0 flex-1 flex items-start sm:items-center gap-2.5 sm:gap-3">
                <span
                  className={`shrink-0 rounded px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${getBadgeColor(
                    file.filename,
                  )}`}
                >
                  {getFileExtension(file.filename) || 'FILE'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-xs sm:text-sm text-slate-900 truncate" title={file.filename}>
                    {file.filename}
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    {formatBytes(file.size_bytes)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto justify-end">
                {file.can_preview && (
                  <button
                    onClick={() => handleViewSingle(file.id)}
                    disabled={downloadingAll || downloadingId !== null}
                    className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 transition-colors disabled:opacity-50 text-center justify-center"
                  >
                    {downloadingId === file.id ? 'Opening...' : 'View'}
                  </button>
                )}
                <button
                  onClick={() => handleDownloadSingle(file.id, file.filename)}
                  disabled={downloadingAll || downloadingId !== null}
                  className="flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <svg className={`h-3.5 w-3.5 ${downloadingId === file.id ? 'animate-bounce' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {downloadingId === file.id ? 'Downloading...' : 'Download'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-[11px] sm:text-xs text-slate-500 text-center">
        You can view or download individual files or the ZIP multiple times until the 3-hour expiration period ends.
      </p>
    </div>
  );
}

export function RetrieveForm() {
  const [code, setCode] = useState('');
  const [state, setState] = useState<RetrieveState>({ step: 'input' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

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
      <div className="space-y-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center" role="alert">
          <h2 className="text-lg font-semibold text-red-800">{titles[state.type]}</h2>
          <p className="mt-2 text-sm text-red-700">{state.message}</p>
        </div>
        <button onClick={() => setState({ step: 'input' })} className="btn-secondary w-full">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="code" className="mb-2 block text-sm font-medium text-slate-700">
          Enter your one-time code
        </label>
        <input
          id="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="K7X9-P2LM"
          className="input-field font-mono text-center text-lg tracking-widest uppercase"
          maxLength={12}
          disabled={state.step === 'loading'}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <button type="submit" disabled={state.step === 'loading' || !code.trim()} className="btn-download w-full py-3 text-base shadow-lg shadow-blue-500/20">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {state.step === 'loading' ? 'Verifying Code...' : 'Unlock & Download Files'}
      </button>
    </form>
  );
}
