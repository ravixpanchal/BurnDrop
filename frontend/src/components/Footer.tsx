import { config } from '@/lib/config';

export function Footer() {
  const links = [
    ['GitHub', config.githubUrl],
    ['Contact', config.contactEmail ? `mailto:${config.contactEmail}` : ''],
  ].filter(([, url]) => url);

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-5 py-7 text-center sm:flex-row sm:justify-between sm:px-6 sm:py-6 sm:text-left">
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-slate-800">
            © {new Date().getFullYear()} {config.appName}
          </p>
          <p className="text-xs leading-relaxed text-slate-600">
            Built by <span className="font-medium text-slate-700">Ravi Panchal</span>
          </p>
        </div>
        {links.length > 0 && (
          <nav
            aria-label="About BurnDrop"
            className="flex w-full max-w-xs items-center justify-center gap-3 sm:w-auto sm:max-w-none sm:gap-5"
          >
            {links.map(([label, url]) => (
              <a
                key={label}
                href={url}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 sm:flex-none sm:border-transparent sm:bg-transparent sm:px-1"
              >
                <svg aria-hidden="true" className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  {label === 'Contact' ? (
                    <>
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3 7 9 6 9-6" />
                    </>
                  ) : (
                    <>
                      <path d="M9 19c-4.3 1.3-4.3-2-6-2m12 5v-3.9a3.4 3.4 0 0 0-.9-2.6c3-.3 6.2-1.5 6.2-6.8a5.3 5.3 0 0 0-1.4-3.7 4.9 4.9 0 0 0-.1-3.7S17.7 1 15 2.7a12.8 12.8 0 0 0-7 0C5.3 1 4.2 1.3 4.2 1.3A4.9 4.9 0 0 0 4.1 5a5.3 5.3 0 0 0-1.4 3.7c0 5.3 3.2 6.5 6.2 6.8a3.4 3.4 0 0 0-.9 2.6V22" />
                    </>
                  )}
                </svg>
                {label}
              </a>
            ))}
          </nav>
        )}
      </div>
    </footer>
  );
}
