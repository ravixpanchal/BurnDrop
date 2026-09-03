import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RetrieveForm } from '@/components/RetrieveForm';
import { config } from '@/lib/config';

export const metadata: Metadata = {
  title: `Receive a File — ${config.appName}`,
  description: 'Enter your one-time code to access a shared file.',
};

export default function RetrievePage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50/80 text-slate-900 overflow-x-hidden">
      {/* Decorative ambient background glows */}
      <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-40 h-72 w-72 rounded-full bg-violet-400/10 blur-3xl" />

      <Header />
      <main className="mx-auto w-full max-w-xl flex-1 px-3 xs:px-4 sm:px-6 lg:px-8 py-5 sm:py-12 relative z-10">
        <section className="mb-6 sm:mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 px-3.5 py-1 text-[11px] xs:text-xs font-semibold text-blue-700 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            <span>🔒 Encrypted One-Time Transfer</span>
          </div>
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            Receive a{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              File
            </span>
          </h2>
          <p className="mt-2 text-xs xs:text-sm font-medium text-slate-600 max-w-md mx-auto">
            Enter your secure one-time PIN code below to unlock your download
          </p>
        </section>
        <RetrieveForm />
      </main>
      <Footer />
    </div>
  );
}
