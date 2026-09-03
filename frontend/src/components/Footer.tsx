'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { config } from '@/lib/config';

interface SocialLink {
  key: string;
  url: string;
  label: string;
  username?: string;
  icon: (props: { className?: string }) => JSX.Element;
  brandStyles: string;
}

const socialLinks: SocialLink[] = [
  {
    key: 'instagram',
    url: config.instagramUrl,
    label: 'Instagram',
    username: '@ravixpanchal',
    icon: InstagramIcon,
    brandStyles:
      'border-slate-200/90 bg-white text-slate-700 hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 hover:text-white hover:shadow-lg hover:shadow-rose-500/20 hover:border-transparent',
  },
  {
    key: 'x',
    url: config.xUrl,
    label: 'X (Twitter)',
    username: '@ravixpanchal',
    icon: XIcon,
    brandStyles:
      'border-slate-200/90 bg-white text-slate-700 hover:bg-slate-950 hover:text-white hover:shadow-lg hover:shadow-slate-950/20 hover:border-transparent',
  },
  {
    key: 'linkedin',
    url: config.linkedinUrl,
    label: 'LinkedIn',
    username: 'Ravi Panchal',
    icon: LinkedInIcon,
    brandStyles:
      'border-slate-200/90 bg-white text-slate-700 hover:bg-[#0A66C2] hover:text-white hover:shadow-lg hover:shadow-blue-600/20 hover:border-transparent',
  },
  {
    key: 'github',
    url: config.githubUrl,
    label: 'GitHub',
    username: 'ravixpanchal',
    icon: GitHubIcon,
    brandStyles:
      'border-slate-200/90 bg-white text-slate-700 hover:bg-slate-900 hover:text-white hover:shadow-lg hover:shadow-slate-900/20 hover:border-transparent',
  },
  {
    key: 'email',
    url: config.contactEmail ? `mailto:${config.contactEmail}` : '',
    label: 'Email',
    username: 'Contact',
    icon: MailIcon,
    brandStyles:
      'border-slate-200/90 bg-white text-slate-700 hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 hover:text-white hover:shadow-lg hover:shadow-blue-600/20 hover:border-transparent',
  },
];

export function Footer() {
  const pathname = usePathname();
  const visibleLinks = socialLinks.filter((l) => l.url);

  const handleLogoClick = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault();
      window.location.href = '/';
    }
  };

  return (
    <footer className="relative border-t border-slate-200/80 bg-gradient-to-b from-white via-slate-50/70 to-slate-100/80 mt-auto pt-6 xs:pt-8 pb-5 xs:pb-6 overflow-hidden">
      {/* Decorative ambient background glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-24 w-96 rounded-full bg-blue-400/10 blur-2xl" />

      <div className="relative mx-auto max-w-4xl px-3.5 xs:px-4 sm:px-6">
        {/* Social Links Highlight Section */}
        {visibleLinks.length > 0 && (
          <div className="mb-6 xs:mb-8 text-center">
            <div className="inline-flex items-center gap-1.5 xs:gap-2 rounded-full border border-blue-200/60 bg-blue-50/80 px-2.5 xs:px-3 py-0.5 xs:py-1 text-[11px] xs:text-xs font-semibold text-blue-700 shadow-xs mb-3 xs:mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              Connect & Follow
            </div>

            <h3 className="text-xs xs:text-sm font-semibold tracking-wide text-slate-800 uppercase mb-3 xs:mb-4">
              Let's Stay Connected
            </h3>

            {/* Highlighted Social Cards Grid */}
            <div className="grid grid-cols-2 xs:flex xs:flex-wrap items-center justify-center gap-2 xs:gap-2.5 sm:gap-3.5">
              {visibleLinks.map(({ key, url, label, icon: Icon, brandStyles }) => (
                <a
                  key={key}
                  href={url}
                  target={key === 'email' ? undefined : '_blank'}
                  rel={key === 'email' ? undefined : 'noopener noreferrer'}
                  aria-label={label}
                  className={`group flex items-center justify-center xs:justify-start gap-2 xs:gap-2.5 rounded-xl border px-3 py-2.5 xs:px-3.5 xs:py-2.5 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 min-h-[42px] ${brandStyles}`}
                >
                  <Icon className="h-4 w-4 xs:h-5 xs:w-5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                  <span className="truncate">{label}</span>
                  <svg
                    className="h-3 w-3 xs:h-3.5 xs:w-3.5 opacity-60 transition-transform duration-300 group-hover:translate-x-1 group-hover:opacity-100 hidden xs:inline-block shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Feature Badges & Status */}
        <div className="my-5 sm:my-6 flex flex-wrap items-center justify-center gap-1.5 xs:gap-2.5 border-y border-slate-200/60 py-3.5 xs:py-4 text-[10px] xs:text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-200/60 px-2 xs:px-2.5 py-1 font-medium text-slate-700">
            🔒 100% Encrypted & Temporary
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-200/60 px-2 xs:px-2.5 py-1 font-medium text-slate-700">
            ⚡ Up to 1 GB Files
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-200/60 px-2 xs:px-2.5 py-1 font-medium text-slate-700">
            ✨ No Account Needed
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-100/80 border border-emerald-300/60 px-2 xs:px-2.5 py-1 font-medium text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Systems Operational
          </span>
        </div>

        {/* Copyright & Author */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center text-xs text-slate-500">
          <p className="flex items-center gap-1">
            Made with <span className="text-red-500 animate-pulse">❤️</span> by{' '}
            <span className="font-semibold text-slate-800 hover:text-blue-600 transition-colors">
              Ravi Panchal
            </span>
          </p>
          <p className="text-slate-400">
            <Link href="/" onClick={handleLogoClick} title="Return to Homepage" className="font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer">
              {config.appName}
            </Link>{' '}
            © {new Date().getFullYear()}. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
