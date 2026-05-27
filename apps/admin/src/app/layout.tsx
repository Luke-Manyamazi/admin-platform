import type { Metadata } from 'next';
import { Bebas_Neue, Syne, JetBrains_Mono } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const bebasNeue   = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-display', display: 'swap' });
const syne        = Syne({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title:       { default: 'ADMIN Ops', template: '%s — ADMIN Ops' },
  description: 'Internal operations dashboard · Camluk Technologies',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${bebasNeue.variable} ${syne.variable} ${jetBrainsMono.variable}`}>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
