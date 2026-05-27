import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { createServerApi } from '@/lib/api';
import { Card, Badge } from '@admin-platform/ui';
import { formatZar, formatRelativeTime, trustScoreColorClass } from '@/lib/format';
import type { FactoryResponse } from '@admin-platform/types';
import { FactoryStatus } from '@admin-platform/types';

export const metadata: Metadata = { title: 'Factories' };

const FILTER_TABS = [
  { label: 'All',      value: '' },
  { label: 'Pending',  value: FactoryStatus.PENDING },
  { label: 'Verified', value: FactoryStatus.VERIFIED },
  { label: 'Suspended',value: FactoryStatus.SUSPENDED },
  { label: 'Rejected', value: FactoryStatus.REJECTED },
] as const;

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = {
  [FactoryStatus.PENDING]:   { label: 'Pending',   variant: 'warning' },
  [FactoryStatus.VERIFIED]:  { label: 'Verified',  variant: 'success' },
  [FactoryStatus.SUSPENDED]: { label: 'Suspended', variant: 'danger' },
  [FactoryStatus.REJECTED]:  { label: 'Rejected',  variant: 'danger' },
};

export default async function OpsFactoriesPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string };
}) {
  const session = await auth();
  if (!session) redirect('/login');

  const api = createServerApi(session.accessToken);

  const params: Record<string, string> = { limit: '50', page: searchParams.page ?? '1' };
  if (searchParams.status) params.status = searchParams.status;

  let factories: FactoryResponse[] = [];
  try {
    const res = await api.get<unknown>('/factories', params);
    factories = (Array.isArray(res) ? res : (res as { data: FactoryResponse[] }).data ?? []) as FactoryResponse[];
  } catch { /* empty */ }

  const currentFilter = searchParams.status ?? '';
  const pendingCount  = factories.filter(f => f.status === FactoryStatus.PENDING).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-4xl text-foreground mb-1">FACTORIES</h1>
          <p className="font-body text-sm text-foreground-muted">
            {factories.length} factory record{factories.length !== 1 ? 's' : ''}
            {pendingCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-warning/15 text-warning font-body text-xs font-medium">
                {pendingCount} pending review
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => {
          const isActive = currentFilter === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value ? `/ops/factories?status=${tab.value}` : '/ops/factories'}
              className={`shrink-0 px-4 py-1.5 rounded-lg font-body text-sm font-medium transition-colors duration-150 ${
                isActive ? 'bg-brand text-brand-foreground' : 'text-foreground-muted hover:text-foreground hover:bg-surface-elevated'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      {factories.length === 0 ? (
        <Card variant="elevated" padding="lg">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🏭</div>
            <p className="font-display text-xl text-foreground mb-2">NO FACTORIES FOUND</p>
            <p className="font-body text-sm text-foreground-muted">Try a different filter.</p>
          </div>
        </Card>
      ) : (
        <Card variant="elevated" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Factory', 'Location', 'Trust Score', 'Min Order', 'Capacity', 'Status', 'Registered', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3 font-body text-xs text-foreground-subtle uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {factories.map((f) => {
                  const badge = STATUS_BADGE[f.status] ?? { label: f.status, variant: 'default' as const };
                  return (
                    <tr key={f.id} className="hover:bg-surface-elevated transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-body text-sm text-foreground">{f.name}</p>
                        <p className="font-body text-xs text-foreground-subtle font-mono">{f.registrationNumber}</p>
                      </td>
                      <td className="px-5 py-4 font-body text-sm text-foreground-muted">
                        {f.country}{f.region ? `, ${f.region}` : ''}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`font-mono text-sm font-semibold ${trustScoreColorClass(f.trustScore)}`}>
                          {f.trustScore}
                        </span>
                        <span className="font-body text-xs text-foreground-subtle">/100</span>
                      </td>
                      <td className="px-5 py-4 font-mono text-sm text-foreground whitespace-nowrap">{formatZar(f.minimumOrderValue)}</td>
                      <td className="px-5 py-4 font-body text-sm text-foreground-muted whitespace-nowrap">
                        {f.capacityUnitsPerMonth.toLocaleString()} u/mo
                      </td>
                      <td className="px-5 py-4"><Badge variant={badge.variant} size="sm">{badge.label}</Badge></td>
                      <td className="px-5 py-4 font-body text-xs text-foreground-subtle whitespace-nowrap">{formatRelativeTime(f.createdAt)}</td>
                      <td className="px-5 py-4">
                        <Link href={`/ops/factories/${f.id}`} className="font-body text-xs text-brand hover:underline whitespace-nowrap">
                          {f.status === FactoryStatus.PENDING ? 'Review →' : 'View →'}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
