import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { createServerApi } from '@/lib/api';
import { Card, Badge } from '@admin-platform/ui';
import { formatZar, formatDate, formatRelativeTime } from '@/lib/format';
import type { OrderResponse } from '@admin-platform/types';
import { OrderStatus } from '@admin-platform/types';

export const metadata: Metadata = { title: 'All Orders' };

const FILTER_TABS = [
  { label: 'All',        value: '' },
  { label: 'Placed',     value: OrderStatus.PLACED },
  { label: 'Allocating', value: OrderStatus.ALLOCATING },
  { label: 'Production', value: OrderStatus.IN_PRODUCTION },
  { label: 'QC',         value: OrderStatus.QUALITY_CHECK },
  { label: 'Disputed',   value: OrderStatus.DISPUTED },
  { label: 'Delivered',  value: OrderStatus.DELIVERED },
  { label: 'Cancelled',  value: OrderStatus.CANCELLED },
] as const;

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = {
  [OrderStatus.DRAFT]:         { label: 'Draft',        variant: 'default' },
  [OrderStatus.PLACED]:        { label: 'Placed',       variant: 'info' },
  [OrderStatus.ALLOCATING]:    { label: 'Allocating',   variant: 'warning' },
  [OrderStatus.ALLOCATED]:     { label: 'Allocated',    variant: 'warning' },
  [OrderStatus.IN_PRODUCTION]: { label: 'Production',   variant: 'info' },
  [OrderStatus.QUALITY_CHECK]: { label: 'Quality Check',variant: 'warning' },
  [OrderStatus.DISPATCHED]:    { label: 'Dispatched',   variant: 'success' },
  [OrderStatus.DELIVERED]:     { label: 'Delivered',    variant: 'success' },
  [OrderStatus.CANCELLED]:     { label: 'Cancelled',    variant: 'danger' },
  [OrderStatus.DISPUTED]:      { label: 'Disputed',     variant: 'danger' },
};

export default async function OpsOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string };
}) {
  const session = await auth();
  if (!session) redirect('/login');

  const api = createServerApi(session.accessToken);

  const params: Record<string, string> = {
    limit: '50',
    page: searchParams.page ?? '1',
  };
  if (searchParams.status) params.status = searchParams.status;

  let orders: OrderResponse[] = [];
  try {
    const res = await api.get<unknown>('/orders/all', params);
    orders = (Array.isArray(res) ? res : (res as { data: OrderResponse[] }).data ?? []) as OrderResponse[];
  } catch { /* empty */ }

  const currentFilter = searchParams.status ?? '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl text-foreground mb-1">ALL ORDERS</h1>
        <p className="font-body text-sm text-foreground-muted">
          {orders.length} order{orders.length !== 1 ? 's' : ''} · Platform-wide view
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => {
          const isActive = currentFilter === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value ? `/ops/orders?status=${tab.value}` : '/ops/orders'}
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
      {orders.length === 0 ? (
        <Card variant="elevated" padding="lg">
          <div className="text-center py-10">
            <div className="text-4xl mb-4">📋</div>
            <p className="font-display text-xl text-foreground mb-2">NO ORDERS FOUND</p>
            <p className="font-body text-sm text-foreground-muted">
              {currentFilter ? 'No orders match this filter.' : 'No orders in the platform yet.'}
            </p>
          </div>
        </Card>
      ) : (
        <Card variant="elevated" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Order #', 'Product', 'Buyer', 'Value', 'Deadline', 'Status', 'Created', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3 font-body text-xs text-foreground-subtle uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => {
                  const badge = STATUS_BADGE[order.status] ?? { label: order.status, variant: 'default' as const };
                  return (
                    <tr key={order.id} className="hover:bg-surface-elevated transition-colors duration-100">
                      <td className="px-5 py-4 font-mono text-xs text-foreground-muted whitespace-nowrap">{order.orderNumber}</td>
                      <td className="px-5 py-4">
                        <p className="font-body text-sm text-foreground">{order.productName}</p>
                        <p className="font-body text-xs text-foreground-subtle">{order.productCategory}</p>
                      </td>
                      <td className="px-5 py-4 font-body text-xs text-foreground-muted">{order.buyerId ?? '—'}</td>
                      <td className="px-5 py-4 font-mono text-sm text-foreground whitespace-nowrap">{formatZar(order.totalValue)}</td>
                      <td className="px-5 py-4 font-body text-xs text-foreground-muted whitespace-nowrap">{formatDate(order.deadline)}</td>
                      <td className="px-5 py-4"><Badge variant={badge.variant} size="sm">{badge.label}</Badge></td>
                      <td className="px-5 py-4 font-body text-xs text-foreground-subtle whitespace-nowrap">{formatRelativeTime(order.createdAt)}</td>
                      <td className="px-5 py-4">
                        <Link href={`/ops/orders/${order.id}`} className="font-body text-xs text-brand hover:underline whitespace-nowrap">View →</Link>
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
