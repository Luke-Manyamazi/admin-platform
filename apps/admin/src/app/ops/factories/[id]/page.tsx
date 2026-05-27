'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Badge, Button } from '@admin-platform/ui';
import { formatZar, formatDate, formatDateTime, trustScoreColorClass } from '@/lib/format';
import { FactoryStatus } from '@admin-platform/types';
import type { FactoryResponse } from '@admin-platform/types';

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = {
  [FactoryStatus.PENDING]:   { label: 'Pending Review', variant: 'warning' },
  [FactoryStatus.VERIFIED]:  { label: 'Verified',       variant: 'success' },
  [FactoryStatus.SUSPENDED]: { label: 'Suspended',      variant: 'danger' },
  [FactoryStatus.REJECTED]:  { label: 'Rejected',       variant: 'danger' },
};

export default function OpsFactoryDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [factory,   setFactory]   = useState<FactoryResponse | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [saving,    setSaving]    = useState(false);

  useEffect(() => { void fetchFactory(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchFactory() {
    try {
      const res  = await fetch(`/api/proxy/factories/${id}`);
      const json = (await res.json()) as { success: boolean; data: FactoryResponse };
      if (json.success) setFactory(json.data);
    } catch { /* empty */ } finally {
      setLoading(false);
    }
  }

  async function handleVerify(approved: boolean, rejectionReason?: string) {
    setSaving(true); setActionMsg('');
    try {
      const res  = await fetch(`/api/proxy/admin/factories/${id}/verify`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ approved, ...(rejectionReason ? { rejectionReason } : {}) }),
      });
      const json = (await res.json()) as { success: boolean };
      if (!json.success) throw new Error('API returned failure');
      setActionMsg(approved ? 'Factory approved successfully.' : 'Factory rejected.');
      void fetchFactory();
    } catch {
      setActionMsg('Action failed — is the API gateway running?');
    } finally {
      setSaving(false);
    }
  }

  async function handleSuspend() {
    setSaving(true); setActionMsg('');
    try {
      const res  = await fetch(`/api/proxy/admin/factories/${id}/suspend`, { method: 'POST' });
      const json = (await res.json()) as { success: boolean };
      if (!json.success) throw new Error();
      setActionMsg('Factory suspended.');
      void fetchFactory();
    } catch {
      setActionMsg('Action failed — is the API gateway running?');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!factory) {
    return (
      <div className="space-y-4">
        <Link href="/ops/factories"><Button variant="ghost" size="sm">← Back to Factories</Button></Link>
        <Card variant="elevated" padding="lg">
          <div className="text-center py-10">
            <p className="font-display text-2xl text-foreground mb-2">FACTORY NOT FOUND</p>
            <p className="font-body text-sm text-foreground-muted">This factory may not exist or the API is offline.</p>
          </div>
        </Card>
      </div>
    );
  }

  const badge     = STATUS_BADGE[factory.status] ?? { label: factory.status, variant: 'default' as const };
  const isPending  = factory.status === FactoryStatus.PENDING;
  const isVerified = factory.status === FactoryStatus.VERIFIED;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back + header */}
      <div>
        <Link href="/ops/factories" className="inline-flex items-center gap-1 font-body text-sm text-foreground-muted hover:text-foreground mb-3 transition-colors">
          ← All Factories
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Badge variant={badge.variant}>{badge.label}</Badge>
              <span className="font-mono text-xs text-foreground-subtle">{factory.registrationNumber}</span>
            </div>
            <h1 className="font-display text-3xl text-foreground">{factory.name.toUpperCase()}</h1>
            <p className="font-body text-sm text-foreground-muted mt-0.5">{factory.country}{factory.region ? `, ${factory.region}` : ''}</p>
          </div>
          <div className="text-right shrink-0">
            <p className={`font-display text-4xl ${trustScoreColorClass(factory.trustScore)}`}>{factory.trustScore}</p>
            <p className="font-body text-xs text-foreground-subtle">Trust score / 100</p>
          </div>
        </div>
      </div>

      {/* Action bar — Pending */}
      {isPending && (
        <Card variant="elevated" padding="md" className="border-warning/30 bg-warning/5">
          <h2 className="font-display text-lg text-foreground mb-3">⚡ REVIEW REQUIRED</h2>
          <p className="font-body text-sm text-foreground-muted mb-4">
            This factory is awaiting verification. Review the details below then approve or reject.
          </p>
          {actionMsg && (
            <p className="font-body text-sm text-foreground bg-surface-elevated border border-border rounded-lg px-3 py-2 mb-4">{actionMsg}</p>
          )}
          <div className="flex gap-3">
            <Button variant="primary" disabled={saving} onClick={() => void handleVerify(true)}>
              ✓ Approve Factory
            </Button>
            <Button variant="danger" disabled={saving} onClick={() => void handleVerify(false, 'Failed verification review')}>
              ✗ Reject Factory
            </Button>
          </div>
        </Card>
      )}

      {/* Action bar — Verified (can suspend) */}
      {isVerified && (
        <Card variant="elevated" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg text-foreground">FACTORY ACTIVE</h2>
              <p className="font-body text-sm text-foreground-muted">This factory can receive sub-orders.</p>
            </div>
            <Button variant="danger" size="sm" disabled={saving} onClick={() => void handleSuspend()}>
              Suspend
            </Button>
          </div>
          {actionMsg && <p className="font-body text-sm text-foreground-muted mt-3">{actionMsg}</p>}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Factory details */}
        <Card variant="elevated" padding="md">
          <h2 className="font-display text-lg text-foreground mb-4">DETAILS</h2>
          <dl className="space-y-3">
            {[
              ['Email',        factory.email],
              ['Phone',        factory.phone],
              ['Address',      factory.address],
              ['Website',      factory.website ?? '—'],
              ['Min Order',    formatZar(factory.minimumOrderValue)],
              ['Capacity',     `${factory.capacityUnitsPerMonth.toLocaleString()} units/month`],
              ['Registered',   formatDateTime(factory.createdAt)],
              ['Last Updated', formatDateTime(factory.updatedAt)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <dt className="font-body text-xs text-foreground-subtle shrink-0">{label}</dt>
                <dd className="font-body text-sm text-foreground text-right break-all">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* Capabilities & certifications */}
        <div className="space-y-6">
          <Card variant="elevated" padding="md">
            <h2 className="font-display text-lg text-foreground mb-3">CAPABILITIES</h2>
            {factory.capabilities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {factory.capabilities.map((c) => (
                  <span key={c} className="font-body text-xs bg-surface-elevated border border-border rounded px-2 py-0.5 text-foreground-muted">{c}</span>
                ))}
              </div>
            ) : <p className="font-body text-sm text-foreground-subtle">None listed</p>}
          </Card>

          <Card variant="elevated" padding="md">
            <h2 className="font-display text-lg text-foreground mb-3">CERTIFICATIONS</h2>
            {factory.certifications.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {factory.certifications.map((c) => (
                  <span key={c} className="font-body text-xs bg-success/10 border border-success/20 text-success rounded px-2 py-0.5">{c}</span>
                ))}
              </div>
            ) : <p className="font-body text-sm text-foreground-subtle">None listed</p>}
          </Card>

          {factory.description && (
            <Card variant="elevated" padding="md">
              <h2 className="font-display text-lg text-foreground mb-2">DESCRIPTION</h2>
              <p className="font-body text-sm text-foreground-muted leading-relaxed">{factory.description}</p>
            </Card>
          )}
        </div>
      </div>

      {/* Documents */}
      {factory.documents && factory.documents.length > 0 && (
        <Card variant="elevated" padding="md">
          <h2 className="font-display text-lg text-foreground mb-4">DOCUMENTS</h2>
          <div className="space-y-2">
            {factory.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-4 p-3 bg-surface-elevated rounded-lg border border-border">
                <div>
                  <p className="font-body text-sm text-foreground">{doc.fileName}</p>
                  <p className="font-body text-xs text-foreground-subtle">
                    {doc.type.replace('_', ' ')} · {(doc.fileSize / 1024).toFixed(1)} KB
                    {doc.expiresAt && ` · Expires ${formatDate(doc.expiresAt)}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={doc.verified ? 'success' : 'warning'} size="sm">
                    {doc.verified ? 'Verified' : 'Unverified'}
                  </Badge>
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="font-body text-xs text-brand hover:underline">
                    Open ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
