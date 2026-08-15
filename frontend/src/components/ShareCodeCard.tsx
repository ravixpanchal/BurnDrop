'use client';

import { useEffect, useState } from 'react';
import { formatExpiryCountdown } from '@/lib/config';

interface ShareCodeCardProps {
  code: string;
  expiresAt: string;
  emailSent: boolean;
  filename: string;
  sizeBytes: number;
  fileCount?: number;
}

export function ShareCodeCard({ code, expiresAt, emailSent, filename, sizeBytes, fileCount }: ShareCodeCardProps) {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(formatExpiryCountdown(expiresAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(formatExpiryCountdown(expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isMulti = (fileCount && fileCount > 1) || filename.endsWith('.zip');

  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-5 sm:p-8 text-center shadow-sm">
      <div className="mb-2 flex justify-center">
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <h2 className="text-lg sm:text-xl font-bold text-slate-900">
        {isMulti ? 'Your files are ready!' : 'Your file is ready!'}
      </h2>
      <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-600 truncate px-2" title={filename}>
        {filename} &middot; {(sizeBytes / (1024 * 1024)).toFixed(1)} MB {isMulti ? '(ZIP Bundle)' : ''}
      </p>

      <p className="mt-5 sm:mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">One-Time Code</p>
      <p className="mt-2 font-mono text-2xl sm:text-3xl md:text-4xl font-bold tracking-wider sm:tracking-widest text-slate-900 break-all select-all">
        {code}
      </p>

      <div className="mt-4 space-y-1 text-xs sm:text-sm text-slate-600">
        <p className="flex items-center justify-center gap-2">
          <CheckIcon /> Code generated
        </p>
        <p className="flex items-center justify-center gap-2">
          {emailSent ? <CheckIcon /> : <WarnIcon />}
          {emailSent ? 'Email sent' : 'Email delivery failed — share the code manually'}
        </p>
      </div>

      <p className="mt-4 text-xs sm:text-sm text-slate-500">
        Valid for 3 hours &middot; Expires in: {countdown}
      </p>
      <p className="text-xs sm:text-sm text-slate-500">One successful use only</p>

      <button onClick={copyCode} className="btn-primary mt-5 sm:mt-6 min-w-[140px] text-xs sm:text-sm py-2.5">
        {copied ? 'Copied!' : 'Copy Code'}
      </button>

      <p className="mt-5 sm:mt-6 text-[11px] sm:text-xs text-amber-700 bg-amber-50 rounded-lg px-3.5 py-2.5 sm:px-4 sm:py-3 border border-amber-200/60">
        Anyone with this code may be able to access your file. Do not share it publicly.
      </p>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
