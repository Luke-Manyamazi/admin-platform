import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  robots: { index: false },
};

/**
 * Shared layout for /login and /register.
 * Provides the centered card container, ambient glow, and brand header.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="h-16 flex items-center px-6 border-b border-border bg-surface/60 backdrop-blur-sm">
        <Link
          href="/"
          className="font-display text-2xl text-brand tracking-wider hover:opacity-80 transition-opacity"
        >
          ADMIN
        </Link>
      </div>

      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 10%, rgba(232,160,32,0.10) 0%, transparent 70%)',
        }}
      />

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>

      {/* Footer */}
      <div className="h-12 flex items-center justify-center px-6">
        <p className="font-body text-xs text-foreground-subtle">
          © {new Date().getFullYear()} Camluk Technologies
        </p>
      </div>
    </div>
  );
}
