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
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header />
      <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <section className="mb-8 text-center">
          <p className="mb-3 text-sm font-semibold text-brand-700">Have a code?</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your files are one code away.</h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600">Enter the 8-character code shared with you to access your files.</p>
        </section>
        <RetrieveForm />
      </main>
      <Footer />
    </div>
  );
}
