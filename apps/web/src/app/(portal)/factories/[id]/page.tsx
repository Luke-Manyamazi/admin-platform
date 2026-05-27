import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { createServerApi, ApiError } from '@/lib/api';
import { Card, Badge, Button } from '@admin-platform/ui';
import {
  formatZar,
  formatDate,
  formatTrustScore,
  trustScoreColorClass,
} from '@/lib/format';
import type { FactoryResponse } from '@admin-platform/types';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  return { title: `Factory — ${params.id}` };
}

// ─── Certification badge colours ──────────────────────────────────────────────

function CertBadge({ cert }: { cert: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-success/30 bg-success/10 text-success font-body text-xs font-medium">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {cert}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FactoryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) redirect('/login');

  const api = createServerApi(session.accessToken);

  let factory: FactoryResponse;
  try {
    factory = await api.get<FactoryResponse>(`/factories/${params.id}`);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.code === 'FACTORY_NOT_FOUND')) {
      notFound();
    }
    throw err;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 font-body text-sm text-foreground-muted">
        <Link href="/factories" className="hover:text-foreground transition-colors">
          Factories
        </Link>
        <span>/</span>
        <span className="text-foreground">{factory.name}</span>
      </nav>

      {/* Hero card */}
      <Card variant="elevated" padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="font-display text-3xl text-foreground mb-1">
              {factory.name}
            </h1>
            <p className="font-body text-sm text-foreground-muted">
              {factory.address}, {factory.region}, {factory.country}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="success">Verified</Badge>
              {factory.certifications.map((cert) => (
                <CertBadge key={cert} cert={cert} />
              ))}
            </div>
          </div>

          {/* Trust score */}
          <div className="shrink-0 text-center px-6 py-4 rounded-xl border border-border bg-surface">
            <div
              className={`font-display text-5xl ${trustScoreColorClass(factory.trustScore)}`}
            >
              {formatTrustScore(factory.trustScore)}
            </div>
            <p className="font-body text-xs text-foreground-muted mt-1">
              Cassava Trust Score
            </p>
          </div>
        </div>

        {factory.description !== null && (
          <p className="font-body text-sm text-foreground-muted mt-4 leading-relaxed">
            {factory.description}
          </p>
        )}
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Min Order Value',  value: formatZar(factory.minimumOrderValue) },
          { label: 'Monthly Capacity', value: `${factory.capacityUnitsPerMonth.toLocaleString()} units` },
          { label: 'Country',          value: factory.country },
          { label: 'Member Since',     value: formatDate(factory.createdAt) },
        ].map((stat) => (
          <Card key={stat.label} variant="default" padding="sm">
            <p className="font-body text-2xs text-foreground-subtle uppercase tracking-wider mb-1">
              {stat.label}
            </p>
            <p className="font-mono text-sm text-foreground">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Capabilities */}
      {factory.capabilities.length > 0 && (
        <Card variant="elevated" padding="md">
          <h2 className="font-display text-xl text-foreground mb-4">
            CAPABILITIES
          </h2>
          <div className="flex flex-wrap gap-2">
            {factory.capabilities.map((cap) => (
              <Badge key={cap} variant="default">
                {cap}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Contact */}
      <Card variant="elevated" padding="md">
        <h2 className="font-display text-xl text-foreground mb-4">CONTACT</h2>
        <div className="grid sm:grid-cols-2 gap-4 font-body text-sm">
          <div>
            <p className="text-foreground-subtle text-xs uppercase tracking-wide mb-1">Email</p>
            <a
              href={`mailto:${factory.email}`}
              className="text-brand hover:text-brand-hover transition-colors"
            >
              {factory.email}
            </a>
          </div>
          <div>
            <p className="text-foreground-subtle text-xs uppercase tracking-wide mb-1">Phone</p>
            <p className="text-foreground">{factory.phone}</p>
          </div>
          {factory.website !== null && (
            <div>
              <p className="text-foreground-subtle text-xs uppercase tracking-wide mb-1">Website</p>
              <a
                href={factory.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:text-brand-hover transition-colors"
              >
                {factory.website}
              </a>
            </div>
          )}
        </div>
      </Card>

      {/* CTA */}
      <div className="flex gap-3">
        <Link href={`/orders/new?factoryHint=${factory.id}`}>
          <Button variant="primary" size="lg">
            Place Order with This Factory
          </Button>
        </Link>
        <Link href="/factories">
          <Button variant="outline" size="lg">
            ← Back to Factories
          </Button>
        </Link>
      </div>
    </div>
  );
}
