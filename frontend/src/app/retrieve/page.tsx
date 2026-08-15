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
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:py-10 sm:px-6">
        <section className="mb-6 sm:mb-8 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Receive a File</h2>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-600">Enter your one-time code</p>
        </section>
        <RetrieveForm />
      </main>
      <Footer />
    </div>
  );
}
