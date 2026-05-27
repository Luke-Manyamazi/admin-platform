import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { createServerApi } from '@/lib/api';
import { Card, Button } from '@admin-platform/ui';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { formatZar, formatDate, formatDeadlineCountdown } from '@/lib/format';
import type { OrderResponse, ApiPaginatedResponse } from '@admin-platform/types';
import { OrderStatus } from '@admin-platform/types';

export const metadata: Metadata = { title: 'My Orders' };

// ─── Status filter tabs ───────────────────────────────────────────────────────

const FILTER_TABS = [
  { label: 'All',        value: '' },
  { label: 'Active',     value: 'active' },
  { label: 'Production', value: OrderStatus.IN_PRODUCTION },
  { label: 'Delivered',  value: OrderStatus.DELIVERED },
  { label: 'Cancelled',  value: OrderStatus.CANCELLED },
] as const;

const ACTIVE_STATUSES = new Set([
  OrderStatus.PLACED,
  OrderStatus.ALLOCATING,
  OrderStatus.ALLOCATED,
  OrderStatus.QUALITY_CHECK,
  OrderStatus.DISPATCHED,
]);

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string };
}) {
  const session = await auth();
  if (!session) redirect('/login');

  const api = createServerApi(session.accessToken);

  const params: Record<string, string> = {
    limit: '20',
    page:  searchParams.page ?? '1',
  };

  // Map "active" filter to multiple statuses — we post-filter client side
  if (searchParams.status && searchParams.status !== 'active') {
    params.status = searchParams.status;
  }

  let orders: OrderResponse[] = [];

  try {
    const res = await api.get<unknown>('/orders', params);
    // Handle both raw array and paginated envelope
    if (Array.isArray(res)) {
      orders = res as OrderResponse[];
    } else {
      orders = [...((res as { data: OrderResponse[] }).data ?? [])] as OrderResponse[];
    }
  } catch {
    // Show empty state
  }

  // Client-side filter for "active" pseudo-status
  const displayOrders =
    searchParams.status === 'active'
      ? orders.filter((o) => (ACTIVE_STATUSES as Set<string>).has(o.status))
      : orders;

  const currentFilter = searchParams.status ?? '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-4xl text-foreground mb-1">
            MY ORDERS
          </h1>
          <p className="font-body text-sm text-foreground-muted">
            Track all your orders from placement to delivery.
          </p>
        </div>
        <Link href="/orders/new">
          <Button variant="primary">+ New Order</Button>
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => {
          const isActive = currentFilter === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value ? `/orders?status=${tab.value}` : '/orders'}
              className={`shrink-0 px-4 py-1.5 rounded-lg font-body text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-brand text-brand-foreground'
                  : 'text-foreground-muted hover:text-foreground hover:bg-surface-elevated'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Orders list */}
      {displayOrders.length === 0 ? (
        <Card variant="elevated" padding="lg">
          <div className="text-center py-10">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="font-display text-xl text-foreground mb-2">
              NO ORDERS FOUND
            </h3>
            <p className="font-body text-sm text-foreground-muted mb-6">
              {currentFilter
                ? 'No orders match this filter.'
                : 'You haven\'t placed any orders yet.'}
            </p>
            <Link href="/orders/new">
              <Button variant="primary">Place Your First Order</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayOrders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="block group">
              <Card
                variant="elevated"
                padding="md"
                hoverable
                className="transition-all duration-150"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-foreground-muted">
                        {order.orderNumber}
                      </span>
                      <OrderStatusBadge status={order.status} size="sm" />
                    </div>
                    <h3 className="font-body font-semibold text-foreground group-hover:text-brand transition-colors">
                      {order.productName}
                    </h3>
                    <p className="font-body text-xs text-foreground-muted mt-0.5">
                      {order.productCategory} · {order.quantityUnits.toLocaleString()}{' '}
                      {order.unitOfMeasure}
                    </p>
                  </div>

                  {/* Value */}
                  <div className="shrink-0 text-right sm:text-left sm:w-32">
                    <p className="font-mono text-sm text-foreground">
                      {formatZar(order.totalValue)}
                    </p>
                    <p className="font-body text-xs text-foreground-muted">
                      Total value
                    </p>
                  </div>

                  {/* Deadline */}
                  <div className="shrink-0 text-right sm:text-left sm:w-32">
                    <p className="font-body text-sm text-foreground">
                      {formatDate(order.deadline)}
                    </p>
                    <p className="font-body text-xs text-foreground-muted">
                      {formatDeadlineCountdown(order.deadline)}
                    </p>
                  </div>

                  {/* Arrow */}
                  <svg
                    className="w-4 h-4 text-foreground-subtle group-hover:text-brand transition-colors shrink-0 hidden sm:block"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
