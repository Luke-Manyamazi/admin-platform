import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { createServerApi } from '@/lib/api';
import { Card, Badge } from '@admin-platform/ui';
import { formatZar, formatDateTime } from '@/lib/format';
import type { PaymentResponse } from '@admin-platform/types';
import { PaymentStatus } from '@admin-platform/types';

export const metadata: Metadata = { title: 'Payouts' };

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = {
  [PaymentStatus.PENDING]:  { label: 'Pending',  variant: 'default' },
  [PaymentStatus.HELD]:     { label: 'Held',     variant: 'warning' },
  [PaymentStatus.RELEASED]: { label: 'Released', variant: 'success' },
  [PaymentStatus.REFUNDED]: { label: 'Refunded', variant: 'info' },
  [PaymentStatus.FAILED]:   { label: 'Failed',   variant: 'danger' },
};

export default async function OpsPayoutsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await auth();
  if (!session) redirect('/login');

  const api = createServerApi(session.accessToken);

  const params: Record<string, string> = { limit: '50' };
  if (searchParams.status) params.status = searchParams.status;

  let payments: PaymentResponse[] = [];
  try {
    const res = await api.get<unknown>('/payments', params);
    payments = (Array.isArray(res) ? res : (res as { data: PaymentResponse[] }).data ?? []) as PaymentResponse[];
  } catch { /* empty */ }

  const heldPayments     = payments.filter(p => p.status === PaymentStatus.HELD);
  const releasedPayments = payments.filter(p => p.status === PaymentStatus.RELEASED);
  const totalHeld        = heldPayments.reduce((s, p) => s + p.amount, 0);
  const totalReleased    = releasedPayments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl text-foreground mb-1">PAYOUTS</h1>
        <p className="font-body text-sm text-foreground-muted">Escrow balances and factory payment releases.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="elevated" padding="md">
          <p className="font-body text-xs text-foreground-subtle uppercase tracking-wider mb-2">In Escrow (Held)</p>
          <p className="font-display text-3xl text-warning mb-1">{formatZar(totalHeld)}</p>
          <p className="font-body text-xs text-foreground-subtle">{heldPayments.length} payment{heldPayments.length !== 1 ? 's' : ''} pending release</p>
        </Card>
        <Card variant="elevated" padding="md">
          <p className="font-body text-xs text-foreground-subtle uppercase tracking-wider mb-2">Released (All Time)</p>
          <p className="font-display text-3xl text-success mb-1">{formatZar(totalReleased)}</p>
          <p className="font-body text-xs text-foreground-subtle">{releasedPayments.length} payment{releasedPayments.length !== 1 ? 's' : ''} disbursed</p>
        </Card>
        <Card variant="elevated" padding="md">
          <p className="font-body text-xs text-foreground-subtle uppercase tracking-wider mb-2">Total Processed</p>
          <p className="font-display text-3xl text-foreground mb-1">{formatZar(totalHeld + totalReleased)}</p>
          <p className="font-body text-xs text-foreground-subtle">{payments.length} total payments</p>
        </Card>
      </div>

      {/* Payments table */}
      {payments.length === 0 ? (
        <Card variant="elevated" padding="lg">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">💰</div>
            <p className="font-display text-xl text-foreground mb-2">NO PAYMENTS FOUND</p>
            <p className="font-body text-sm text-foreground-muted">Payments will appear here once orders are placed.</p>
          </div>
        </Card>
      ) : (
        <Card variant="elevated" padding="none">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="font-display text-lg text-foreground">ALL PAYMENTS</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Payment ID', 'Order', 'Factory Payout', 'Total Amount', 'Provider', 'Status', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 font-body text-xs text-foreground-subtle uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p) => {
                  const badge = STATUS_BADGE[p.status] ?? { label: p.status, variant: 'default' as const };
                  return (
                    <tr key={p.id} className="hover:bg-surface-elevated transition-colors">
                      <td className="px-5 py-4 font-mono text-xs text-foreground-muted">…{p.id.slice(-8)}</td>
                      <td className="px-5 py-4 font-mono text-xs text-foreground-muted">{p.orderId ? `…${p.orderId.slice(-8)}` : '—'}</td>
                      <td className="px-5 py-4 font-body text-xs text-foreground-muted">{formatZar(p.factoryPayout)}</td>
                      <td className="px-5 py-4 font-mono text-sm text-foreground whitespace-nowrap">{formatZar(p.amount)}</td>
                      <td className="px-5 py-4 font-body text-xs text-foreground-muted">{p.gatewayProvider ?? '—'}</td>
                      <td className="px-5 py-4"><Badge variant={badge.variant} size="sm">{badge.label}</Badge></td>
                      <td className="px-5 py-4 font-body text-xs text-foreground-subtle whitespace-nowrap">{formatDateTime(p.createdAt)}</td>
                      <td className="px-5 py-4">
                        {p.status === PaymentStatus.HELD && (
                          <button className="font-body text-xs text-brand hover:underline whitespace-nowrap">
                            Release →
                          </button>
                        )}
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
