import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';

import AuthProvider from '../components/AuthProvider';
import { SiteNameProvider } from '../components/SiteNameContext';
import { ThemeProvider } from '../components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export function generateMetadata(): Metadata {
  return {
    title: process.env.NEXT_PUBLIC_SITE_NAME || 'MoonTV',
    description: '影视聚合',
    manifest: '/manifest.json',
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'MoonTV';

  return (
    <html lang='zh-CN' suppressHydrationWarning>
      <body
        className={`${inter.className} min-h-screen bg-white text-gray-900 dark:bg-black dark:text-gray-200`}
        data-site-name={siteName}
      >
        <SiteNameProvider value={siteName}>
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </SiteNameProvider>
      </body>
    </html>
  );
}
