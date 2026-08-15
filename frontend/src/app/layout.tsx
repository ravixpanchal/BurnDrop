import type { Metadata, Viewport } from 'next';
import { config } from '@/lib/config';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: `${config.appName} — Share Files Once, Keep Them Temporary`,
  description:
    'Share files up to 1 GB without creating an account. Generate a temporary one-time code and share your data anywhere.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>{children}</body>
    </html>
  );
}
