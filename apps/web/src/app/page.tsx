import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@admin-platform/ui';

export const metadata: Metadata = {
  title: 'ADMIN Connect — African Manufacturing Network',
};

// ─── Feature data ─────────────────────────────────────────────────────────────

const features = [
  {
    icon: '🤖',
    title: 'AI-Powered Matching',
    description:
      'Cassava AI engine automatically matches your order to the best-fit verified factories across Africa, optimising for capacity, trust score, and delivery timeline.',
  },
  {
    icon: '🔒',
    title: 'Escrow Payments',
    description:
      'Funds are held in escrow until you confirm delivery. Factories get paid only on successful fulfilment — zero payment risk for buyers.',
  },
  {
    icon: '🏭',
    title: 'Verified Factories',
    description:
      'Every factory on ADMIN is vetted by our ops team and carries a Cassava trust score. Browse ISO-certified manufacturers across 54 African nations.',
  },
  {
    icon: '📦',
    title: 'Real-Time Tracking',
    description:
      'Track production progress, sub-order status, and dispatch in a single dashboard. Full visibility from order placement to delivery confirmation.',
  },
] as const;

const stats = [
  { value: '300+', label: 'Verified Factories' },
  { value: '28',   label: 'African Countries' },
  { value: '98%',  label: 'On-Time Delivery' },
  { value: '0%',   label: 'Buyer Payment Loss' },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Navbar ── */}
      <nav className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <span className="font-display text-2xl text-brand tracking-wider">
            ADMIN
          </span>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Ambient glow */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(232,160,32,0.15) 0%, transparent 70%)',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand/30 bg-brand/10 text-brand text-sm font-body font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            African Distributed Manufacturing &amp; Industrial Network
          </div>

          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl text-foreground leading-none mb-6">
            SOURCE FROM{' '}
            <span className="text-brand">AFRICA.</span>
            <br />
            AT SCALE.
          </h1>

          <p className="max-w-2xl mx-auto font-body text-lg text-foreground-muted mb-10">
            Connect directly with 300+ verified African manufacturers. Place
            orders, track production in real time, and pay securely via escrow
            — all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button variant="primary" size="lg">
                Start Sourcing Free
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Sign In to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-4xl text-brand mb-1">
                  {stat.value}
                </div>
                <div className="font-body text-sm text-foreground-muted">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl text-foreground mb-4">
            EVERYTHING YOU NEED TO SOURCE SMARTER
          </h2>
          <p className="font-body text-foreground-muted max-w-xl mx-auto">
            ADMIN handles the complexity of cross-border manufacturing so you
            can focus on growing your business.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-surface border border-border rounded-xl p-6 hover:border-brand/40 transition-colors duration-150"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="font-display text-xl text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="font-body text-sm text-foreground-muted leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="font-display text-4xl text-foreground mb-4">
            READY TO PLACE YOUR FIRST ORDER?
          </h2>
          <p className="font-body text-foreground-muted mb-8 max-w-md mx-auto">
            Registration is free. Start browsing verified factories today.
          </p>
          <Link href="/register">
            <Button variant="primary" size="lg">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display text-xl text-brand tracking-wider">
            ADMIN
          </span>
          <p className="font-body text-xs text-foreground-subtle text-center">
            © {new Date().getFullYear()} Camluk Technologies. African
            Distributed Manufacturing &amp; Industrial Network.
          </p>
          <div className="flex items-center gap-4 font-body text-xs text-foreground-muted">
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-foreground transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
