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
    <div className="relative overflow-hidden rounded-3xl border border-emerald-200/90 bg-gradient-to-b from-white via-emerald-50/30 to-slate-50 p-4 xs:p-6 sm:p-10 text-center shadow-xl shadow-emerald-950/5">
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-blue-400/10 blur-3xl" />

      {/* Success Badge & Header */}
      <div className="mb-3 xs:mb-4 flex justify-center">
        <div className="flex h-12 w-12 xs:h-14 xs:w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/15">
          <svg className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <h2 className="text-lg xs:text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
        {isMulti ? 'Your files are ready!' : 'Your file is ready!'}
      </h2>
      <p className="mt-1.5 text-xs sm:text-sm font-medium text-slate-600 truncate max-w-md mx-auto px-2" title={filename}>
        📄 {filename} &middot; <span className="font-semibold text-slate-800">{(sizeBytes / (1024 * 1024)).toFixed(1)} MB</span> {isMulti ? '(ZIP Bundle)' : ''}
      </p>

      {/* HIGHLIGHTED ONE-TIME CODE BOX */}
      <div className="my-4 xs:my-6 relative mx-auto max-w-md rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-b from-white to-emerald-50/80 p-3.5 xs:p-5 sm:p-6 shadow-xl shadow-emerald-500/10 backdrop-blur-sm group hover:border-emerald-500 transition-all">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/90 border border-emerald-300 px-3 py-0.5 xs:px-3.5 xs:py-1 text-[10px] xs:text-[11px] font-bold uppercase tracking-wider text-emerald-800 shadow-2xs mb-2 xs:mb-3">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          One-Time Code
        </div>

        <div className="font-mono text-xl xs:text-2xl sm:text-4xl md:text-5xl font-black tracking-wider xs:tracking-widest text-slate-900 break-all select-all my-1 drop-shadow-xs">
          {code}
        </div>

        <p className="text-[10px] xs:text-[11px] text-slate-500 mt-2">
          Click below to copy or enter this code on the receive page.
        </p>
      </div>

      {/* Code generated & Email status indicators */}
      <div className="mb-4 xs:mb-5 flex flex-col xs:flex-row flex-wrap items-center justify-center gap-2 xs:gap-4 text-xs sm:text-sm font-medium text-slate-600">
        <span className="inline-flex items-center gap-1.5 text-emerald-700">
          <CheckIcon /> Code generated successfully
        </span>
        <span className="inline-flex items-center gap-1.5 text-slate-700">
          {emailSent ? <CheckIcon /> : <WarnIcon />}
          {emailSent ? 'Email sent to recipient' : 'Email delivery failed — share code manually'}
        </span>
      </div>

      {/* SPAM FOLDER ALERT BOX */}
      <div className="my-4 xs:my-5 rounded-2xl bg-amber-50/90 border-2 border-amber-400/80 p-3.5 xs:p-4 sm:p-5 text-xs sm:text-sm text-amber-950 text-center shadow-sm">
        <div className="flex items-center justify-center gap-2 font-bold text-amber-900 text-xs xs:text-sm sm:text-base">
          <svg className="h-4.5 w-4.5 xs:h-5 xs:w-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>Check Your Spam Folder</span>
        </div>
        <p className="mt-1.5 text-amber-900 font-medium max-w-lg mx-auto text-xs sm:text-sm">
          If you didn&apos;t receive the email, <strong className="underline decoration-amber-600 font-bold">please check your Spam or Junk folder</strong> for the code.
        </p>
      </div>

      {/* Expiry Details */}
      <div className="my-4 text-xs sm:text-sm text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700">
          Valid for 3 hours &middot; Expires in: <span className="font-mono font-bold text-blue-600">{countdown}</span>
        </p>
        <p className="text-slate-400 text-[11px] xs:text-xs">One successful use only</p>
      </div>

      {/* Primary Action: Copy Code */}
      <div className="mt-5 xs:mt-6 flex justify-center">
        <button
          onClick={copyCode}
          className="w-full xs:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 xs:px-8 py-3 xs:py-3.5 text-xs xs:text-sm sm:text-base font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-105 active:scale-95 transition-all duration-200 ring-2 ring-blue-500/20 min-w-full xs:min-w-[180px] min-h-[48px]"
        >
          {copied ? (
            <>
              <svg className="h-5 w-5 text-emerald-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* Security Disclaimer Note */}
      <div className="mt-5 xs:mt-6 inline-flex flex-col xs:flex-row items-center gap-2 rounded-xl bg-amber-50/80 border border-amber-200/80 px-3.5 xs:px-4 py-2 xs:py-2.5 text-[11px] xs:text-xs text-amber-800 font-medium text-center">
        <svg className="h-4 w-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>Anyone with this code can access your file. Do not share it publicly.</span>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg className="h-4 w-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
