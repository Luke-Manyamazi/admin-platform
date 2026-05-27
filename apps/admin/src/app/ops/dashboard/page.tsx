import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { createServerApi } from '@/lib/api';
import { Card, Badge, Button } from '@admin-platform/ui';
import { formatZar, formatRelativeTime } from '@/lib/format';
import type { OrderResponse, FactoryResponse } from '@admin-platform/types';
import { OrderStatus, FactoryStatus } from '@admin-platform/types';

export const metadata: Metadata = { title: 'Dashboard' };

function StatCard({
  label, value, sub, accent, href,
}: {
  label: string; value: string | number; sub?: string;
  accent?: 'brand' | 'success' | 'warning' | 'danger' | 'info'; href?: string;
}) {
  const colours = { brand: 'text-brand', success: 'text-success', warning: 'text-warning', danger: 'text-danger', info: 'text-info' };
  const inner = (
    <Card variant="elevated" padding="md" hoverable={!!href}>
      <p className="font-body text-xs text-foreground-subtle uppercase tracking-wider mb-2">{label}</p>
      <p className={`font-display text-4xl mb-1 ${accent ? colours[accent] : 'text-foreground'}`}>{value}</p>
      {sub && <p className="font-body text-xs text-foreground-subtle">{sub}</p>}
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function OpsDashboardPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const api = createServerApi(session.accessToken);

  let allOrders: OrderResponse[]     = [];
  let pendingFactories: FactoryResponse[] = [];

  try {
    const res = await api.get<unknown>('/orders/all', { limit: '200' });
    allOrders = (Array.isArray(res) ? res : (res as { data: OrderResponse[] }).data ?? []) as OrderResponse[];
  } catch { /* empty */ }

  try {
    const res = await api.get<unknown>('/factories', { status: FactoryStatus.PENDING, limit: '50' });
    pendingFactories = (Array.isArray(res) ? res : (res as { data: FactoryResponse[] }).data ?? []) as FactoryResponse[];
  } catch { /* empty */ }

  // Stats
  const totalRevenue     = allOrders.filter(o => o.status !== OrderStatus.CANCELLED).reduce((s, o) => s + o.totalValue, 0);
  const activeOrders     = allOrders.filter(o => ![OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(o.status as never)).length;
  const needsAttention   = allOrders.filter(o => [OrderStatus.DISPUTED, OrderStatus.QUALITY_CHECK, OrderStatus.ALLOCATING].includes(o.status as never));
  const recentOrders     = [...allOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);

  const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = {
    [OrderStatus.PLACED]:        { label: 'Placed',        variant: 'info' },
    [OrderStatus.ALLOCATING]:    { label: 'Allocating',    variant: 'warning' },
    [OrderStatus.ALLOCATED]:     { label: 'Allocated',     variant: 'warning' },
    [OrderStatus.IN_PRODUCTION]: { label: 'In Production', variant: 'info' },
    [OrderStatus.QUALITY_CHECK]: { label: 'QC',            variant: 'warning' },
    [OrderStatus.DISPATCHED]:    { label: 'Dispatched',    variant: 'success' },
    [OrderStatus.DELIVERED]:     { label: 'Delivered',     variant: 'success' },
    [OrderStatus.CANCELLED]:     { label: 'Cancelled',     variant: 'danger' },
    [OrderStatus.DISPUTED]:      { label: 'Disputed',      variant: 'danger' },
    [OrderStatus.DRAFT]:         { label: 'Draft',         variant: 'default' },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl text-foreground mb-1">OPS DASHBOARD</h1>
        <p className="font-body text-sm text-foreground-muted">Platform overview — Camluk Technologies internal.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Orders"          value={allOrders.length}        sub="All time"              accent="brand"   href="/ops/orders" />
        <StatCard label="Active Orders"         value={activeOrders}            sub="In progress"           accent="info"    href="/ops/orders" />
        <StatCard label="Platform Revenue"      value={formatZar(totalRevenue)} sub="Excl. cancelled"       />
        <StatCard label="Pending Approvals"     value={pendingFactories.length} sub="Factories awaiting review" accent={pendingFactories.length > 0 ? 'warning' : 'success'} href="/ops/factories" />
      </div>

      {/* Needs attention */}
      {needsAttention.length > 0 && (
        <div>
          <h2 className="font-display text-2xl text-foreground mb-3">⚠ NEEDS ATTENTION</h2>
          <div className="space-y-2">
            {needsAttention.slice(0, 5).map((order) => {
              const badge = STATUS_BADGE[order.status] ?? { label: order.status, variant: 'default' as const };
              return (
                <Link key={order.id} href={`/ops/orders/${order.id}`} className="block group">
                  <Card variant="elevated" padding="sm" hoverable>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-xs text-foreground-muted w-28 shrink-0">{order.orderNumber}</span>
                      <span className="font-body text-sm text-foreground flex-1 truncate group-hover:text-brand transition-colors">{order.productName}</span>
                      <Badge variant={badge.variant} size="sm">{badge.label}</Badge>
                      <span className="font-mono text-sm text-foreground shrink-0">{formatZar(order.totalValue)}</span>
                      <span className="font-body text-xs text-foreground-subtle shrink-0 hidden sm:block">{formatRelativeTime(order.createdAt)}</span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending factory approvals */}
      {pendingFactories.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-2xl text-foreground">PENDING FACTORY APPROVALS</h2>
            <Link href="/ops/factories?status=PENDING"><Button variant="ghost" size="sm">View All →</Button></Link>
          </div>
          <div className="space-y-2">
            {pendingFactories.slice(0, 4).map((f) => (
              <Link key={f.id} href={`/ops/factories/${f.id}`} className="block group">
                <Card variant="elevated" padding="sm" hoverable>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-foreground group-hover:text-brand transition-colors truncate">{f.name}</p>
                      <p className="font-body text-xs text-foreground-subtle">{f.country} · {f.region}</p>
                    </div>
                    <Badge variant="warning" size="sm">Pending</Badge>
                    <span className="font-body text-xs text-foreground-subtle shrink-0 hidden sm:block">{formatRelativeTime(f.createdAt)}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-2xl text-foreground">RECENT ORDERS</h2>
          <Link href="/ops/orders"><Button variant="ghost" size="sm">View All →</Button></Link>
        </div>

        {recentOrders.length === 0 ? (
          <Card variant="elevated" padding="lg">
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📋</div>
              <p className="font-display text-xl text-foreground mb-1">NO ORDERS YET</p>
              <p className="font-body text-sm text-foreground-muted">Orders will appear here once buyers start placing them.</p>
            </div>
          </Card>
        ) : (
          <Card variant="elevated" padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Order #', 'Product', 'Buyer', 'Value', 'Status', 'Created'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 font-body text-xs text-foreground-subtle uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentOrders.map((order) => {
                    const badge = STATUS_BADGE[order.status] ?? { label: order.status, variant: 'default' as const };
                    return (
                      <tr key={order.id} className="hover:bg-surface-elevated transition-colors">
                        <td className="px-5 py-4 font-mono text-xs text-foreground-muted">
                          <Link href={`/ops/orders/${order.id}`} className="hover:text-brand transition-colors">{order.orderNumber}</Link>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-body text-sm text-foreground">{order.productName}</p>
                          <p className="font-body text-xs text-foreground-subtle">{order.productCategory}</p>
                        </td>
                        <td className="px-5 py-4 font-body text-xs text-foreground-muted">{order.buyerId ?? '—'}</td>
                        <td className="px-5 py-4 font-mono text-sm text-foreground">{formatZar(order.totalValue)}</td>
                        <td className="px-5 py-4"><Badge variant={badge.variant} size="sm">{badge.label}</Badge></td>
                        <td className="px-5 py-4 font-body text-xs text-foreground-subtle">{formatRelativeTime(order.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
