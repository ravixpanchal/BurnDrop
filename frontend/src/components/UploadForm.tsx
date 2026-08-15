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
    <form onSubmit={handleSubmit} className="space-y-6">
      {state === 'uploading' ? (
        <UploadProgress percent={progress.percent} loaded={progress.loaded} total={progress.total} />
      ) : (
        <UploadZone files={files} onFilesSelect={setFiles} disabled={false} />
      )}

      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="input-field"
          disabled={state === 'uploading'}
          required
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={files.length === 0 || !isValidEmail || state === 'uploading'}
        className="btn-download w-full py-3 text-base shadow-lg shadow-blue-500/20"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        {state === 'uploading'
          ? 'Uploading Files...'
          : files.length > 1
          ? `Generate Code for ${files.length} Items`
          : 'Generate One-Time Code'}
      </button>

      <p className="text-center text-xs text-slate-400">
        Files expire after {config.fileExpirationHours} hours.
      </p>
    </form>
  );
}
