export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="h-14 border-b border-border flex items-center px-6">
        <span className="font-display text-xl text-brand tracking-wider">ADMIN OPS</span>
        <span className="ml-2 font-body text-xs text-foreground-subtle bg-surface-elevated border border-border px-2 py-0.5 rounded">
          Internal Only
        </span>
      </header>

      {/* Centred card */}
      <main className="flex-1 flex items-center justify-center px-4">
        {children}
      </main>

      <footer className="h-12 flex items-center justify-center">
        <p className="font-body text-xs text-foreground-subtle">
          © {new Date().getFullYear()} Camluk Technologies · Restricted Access
        </p>
      </footer>
    </div>
  );
}
