import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/providers';
import './globals.css';

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
      className="dark"
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
