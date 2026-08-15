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
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-10 sm:px-6">
        <section className="mb-6 sm:mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Temporary File Sharing
          </h2>
          <p className="mt-2 sm:mt-3 text-base sm:text-lg text-slate-600">
            Upload a file. Get a secure one-time code. Share it anywhere.
          </p>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">No account required.</p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-blue-200/80 bg-blue-50/60 p-1.5 sm:p-2 backdrop-blur-sm shadow-sm">
            <span className="pl-3 text-xs sm:text-sm font-medium text-slate-700">Have a code from someone?</span>
            <Link
              href="/retrieve"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-blue-700 hover:shadow transition-all duration-200"
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
