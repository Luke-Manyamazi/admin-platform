import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { createServerApi } from '@/lib/api';
import { Card } from '@admin-platform/ui';
import { formatZar } from '@/lib/format';
import type { OrderResponse, PaymentResponse } from '@admin-platform/types';
import { OrderStatus, PaymentStatus } from '@admin-platform/types';

export const metadata: Metadata = { title: 'Reports' };

/** Group orders by calendar month — returns array sorted newest first */
function groupByMonth(orders: OrderResponse[]) {
  const map = new Map<string, { revenue: number; count: number }>();
  for (const o of orders) {
    if (o.status === OrderStatus.CANCELLED) continue;
    const key = o.createdAt.slice(0, 7); // "YYYY-MM"
    const cur = map.get(key) ?? { revenue: 0, count: 0 };
    map.set(key, { revenue: cur.revenue + o.totalValue, count: cur.count + 1 });
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 12);
}

export default async function OpsReportsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const api = createServerApi(session.accessToken);

  let orders:   OrderResponse[]   = [];
  let payments: PaymentResponse[] = [];

  try {
    const res = await api.get<unknown>('/orders/all', { limit: '500' });
    orders = (Array.isArray(res) ? res : (res as { data: OrderResponse[] }).data ?? []) as OrderResponse[];
  } catch { /* empty */ }

  try {
    const res = await api.get<unknown>('/payments', { limit: '500' });
    payments = (Array.isArray(res) ? res : (res as { data: PaymentResponse[] }).data ?? []) as PaymentResponse[];
  } catch { /* empty */ }

  // ─── Compute summary ────────────────────────────────────────────────────────
  const totalOrders    = orders.length;
  const totalRevenue   = orders.filter(o => o.status !== OrderStatus.CANCELLED).reduce((s, o) => s + o.totalValue, 0);
  const totalReleased  = payments.filter(p => p.status === PaymentStatus.RELEASED).reduce((s, p) => s + p.amount, 0);
  // Commission is platform revenue minus factory payouts (simplified: 10% of order value)
  const estCommission  = Math.round(totalRevenue * 0.1);

  // Status distribution
  const statusDist = Object.values(OrderStatus).map((s) => ({
    status: s,
    count:  orders.filter((o) => o.status === s).length,
  })).filter(d => d.count > 0).sort((a, b) => b.count - a.count);

  // Monthly breakdown
  const monthly = groupByMonth(orders);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl text-foreground mb-1">REPORTS</h1>
        <p className="font-body text-sm text-foreground-muted">Platform revenue, commission, and order analytics.</p>
      </div>

      {/* Top-line KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders',       value: totalOrders,             accent: 'text-brand' },
          { label: 'Gross Revenue',      value: formatZar(totalRevenue), accent: 'text-foreground' },
          { label: 'Released to Factories', value: formatZar(totalReleased), accent: 'text-success' },
          { label: 'Est. Commission (10%)', value: formatZar(estCommission), accent: 'text-warning' },
        ].map(({ label, value, accent }) => (
          <Card key={label} variant="elevated" padding="md">
            <p className="font-body text-xs text-foreground-subtle uppercase tracking-wider mb-2">{label}</p>
            <p className={`font-display text-3xl ${accent}`}>{value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly breakdown */}
        <Card variant="elevated" padding="md">
          <h2 className="font-display text-xl text-foreground mb-4">MONTHLY REVENUE</h2>
          {monthly.length === 0 ? (
            <p className="font-body text-sm text-foreground-muted text-center py-8">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {monthly.map(([month, { revenue, count }]) => {
                const pct = Math.round((revenue / totalRevenue) * 100) || 0;
                const [year, mo] = month.split('-');
                const label = new Date(Number(year), Number(mo) - 1).toLocaleString('en-ZA', { month: 'short', year: 'numeric' });
                return (
                  <div key={month}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-body text-sm text-foreground">{label}</span>
                      <div className="text-right">
                        <span className="font-mono text-sm text-foreground">{formatZar(revenue)}</span>
                        <span className="font-body text-xs text-foreground-subtle ml-2">({count} orders)</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                      <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Order status distribution */}
        <Card variant="elevated" padding="md">
          <h2 className="font-display text-xl text-foreground mb-4">ORDER STATUS BREAKDOWN</h2>
          {statusDist.length === 0 ? (
            <p className="font-body text-sm text-foreground-muted text-center py-8">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {statusDist.map(({ status, count }) => {
                const pct = Math.round((count / totalOrders) * 100) || 0;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-body text-sm text-foreground">
                        {status.replace(/_/g, ' ')}
                      </span>
                      <div className="text-right">
                        <span className="font-mono text-sm text-foreground">{count}</span>
                        <span className="font-body text-xs text-foreground-subtle ml-2">({pct}%)</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                      <div className="h-full bg-brand/60 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Note */}
      <Card variant="outlined" padding="md">
        <p className="font-body text-sm text-foreground-muted">
          <span className="text-warning font-medium">Note:</span> Commission figures are estimated at 10% of gross order value.
          Full commission breakdown and per-factory payout reports will be available once the payments service is connected.
        </p>
      </Card>
    </div>
  );
}
