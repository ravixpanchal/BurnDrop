import type { Metadata } from 'next';
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
      <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <section className="mb-8 text-center">
          <p className="mb-3 text-sm font-semibold text-brand-700">Simple sharing. Temporary access.</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Send files, then move on.</h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-slate-600">Upload your files and send a one-time access code. No account needed.</p>
        </section>
        <UploadForm />
      </main>
      <Footer />
    </div>
  );
}
