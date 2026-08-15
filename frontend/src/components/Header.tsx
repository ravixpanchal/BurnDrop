'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { config } from '@/lib/config';

export function Header() {
  const pathname = usePathname();
  const isRetrieve = pathname === '/retrieve';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-3.5">
        <Link href="/" className="group min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
            {config.appName}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 truncate">Share once. Keep it temporary.</p>
        </Link>
        <nav className="shrink-0 flex items-center gap-2 sm:gap-3">
          {isRetrieve && (
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload
            </Link>
          )}
          <Link
            href="/retrieve"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ring-2 ring-blue-500/20"
          >
            <svg className="h-4 w-4 shrink-0 animate-bounce-short" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download / Receive File</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
