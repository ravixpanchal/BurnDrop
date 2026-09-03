import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { UploadForm } from '@/components/UploadForm';
import { config } from '@/lib/config';

export const metadata: Metadata = {
  title: `${config.appName} — Share Files Once, Keep Them Temporary`,
  description:
    'Share files up to 1 GB without creating an account. Generate a temporary one-time code and share your data anywhere.',
  openGraph: {
    title: `${config.appName} — Share Files Once, Keep Them Temporary`,
    description:
      'Share files up to 1 GB without creating an account. Generate a temporary one-time code and share your data anywhere.',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-3 xs:px-4 sm:px-6 lg:px-8 py-4 xs:py-6 sm:py-10">
        <section className="mb-5 sm:mb-8 text-center">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Temporary{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              File Sharing
            </span>
          </h2>
          <p className="mt-2 sm:mt-3 text-xs xs:text-sm sm:text-base md:text-lg font-medium text-slate-600 max-w-lg mx-auto px-2">
            Upload any file. Get a secure one-time code. Share it anywhere.
          </p>
          <p className="mt-2.5 sm:mt-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/90 border border-amber-300/80 px-3 xs:px-3.5 py-1 text-[11px] xs:text-xs sm:text-sm font-bold text-amber-900 shadow-xs">
              ✨ No account required.
            </span>
          </p>

          <div className="mt-4 xs:mt-5 inline-flex flex-col xs:flex-row items-center justify-center gap-2 sm:gap-3 rounded-2xl border border-blue-200/80 bg-blue-50/60 p-2 sm:p-2.5 backdrop-blur-sm shadow-sm max-w-full w-full xs:w-auto">
            <span className="px-1 text-xs sm:text-sm font-medium text-slate-700">Have a code from someone?</span>
            <Link
              href="/retrieve"
              className="w-full xs:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-3.5 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 min-h-[38px] sm:min-h-[40px]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Files Here &rarr;
            </Link>
          </div>
        </section>
        <UploadForm />
      </main>
      <Footer />
    </div>
  );
}
