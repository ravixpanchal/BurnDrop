'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { config } from '@/lib/config';

export function Header() {
  const pathname = usePathname();
  const isRetrieve = pathname === '/retrieve';

  const handleLogoClick = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault();
      window.location.href = '/';
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 xs:gap-3 px-3 xs:px-4 sm:px-6 py-2.5 sm:py-3.5">
        <Link href="/" onClick={handleLogoClick} title="Return to Homepage" className="group flex items-center gap-2 sm:gap-3 min-w-0 cursor-pointer">
          <div className="flex h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-blue-500/25 group-hover:scale-105 group-hover:rotate-3 transition-all duration-200">
            <svg className="h-5 w-5 sm:h-6 sm:w-6" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-base xs:text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 truncate">
              Burn<span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">Drop</span>
            </h1>
            <p className="hidden xs:flex text-[11px] sm:text-xs font-medium text-slate-500 truncate items-center gap-1">
              <span>⚡ Share once</span>
              <span className="text-slate-300">•</span>
              <span>Keep it temporary</span>
            </p>
          </div>
        </Link>
        <nav className="shrink-0 flex items-center gap-1.5 xs:gap-2 sm:gap-3">
          {isRetrieve && (
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-xl px-2.5 py-2 xs:px-3 xs:py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors min-h-[38px] sm:min-h-[42px]"
            >
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Upload</span>
            </Link>
          )}
          <Link
            href="/retrieve"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-2.5 py-2 xs:px-3.5 xs:py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ring-2 ring-blue-500/20 min-h-[38px] sm:min-h-[42px]"
          >
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 animate-bounce-short" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>
              <span className="hidden sm:inline">Download / </span>Receive File
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
