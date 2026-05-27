import type { Metadata, Viewport } from 'next';
import { Bebas_Neue, Syne, JetBrains_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

// ─── Fonts ────────────────────────────────────────────────────────────────────

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: 'ADMIN Connect — African Manufacturing Network',
    template: '%s | ADMIN Connect',
  },
  description:
    'Connect with verified African manufacturers. Place orders, track production, and pay securely via ADMIN Connect.',
  keywords: [
    'African manufacturing',
    'factories',
    'B2B marketplace',
    'sourcing',
    'production',
  ],
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#060809',
  colorScheme: 'dark',
};

// ─── Root Layout ─────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${bebasNeue.variable} ${syne.variable} ${jetBrainsMono.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
