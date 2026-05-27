import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { createServerApi } from '@/lib/api';
import { Card, Badge, Button } from '@admin-platform/ui';
import { formatZar, formatDate, formatRelativeTime } from '@/lib/format';
import type { OrderResponse, ApiPaginatedResponse } from '@admin-platform/types';
import { OrderStatus } from '@admin-platform/types';

export const metadata: Metadata = { title: 'Dashboard' };

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'brand' | 'success' | 'warning' | 'info';
}) {
  const colourMap = {
    brand:   'text-brand',
    success: 'text-success',
    warning: 'text-warning',
    info:    'text-info',
  };
  return (
    <Card variant="elevated" padding="md">
      <p className="font-body text-xs text-foreground-muted uppercase tracking-wider mb-2">
        {label}
      </p>
      <p
        className={`font-display text-4xl mb-1 ${
          accent !== undefined ? colourMap[accent] : 'text-foreground'
        }`}
      >
        {value}
      </p>
      {sub !== undefined && (
        <p className="font-body text-xs text-foreground-subtle">{sub}</p>
      )}
    </Card>
  );
}

// ─── Order status badge ───────────────────────────────────────────────────────

const STATUS_BADGE_MAP: Record<
  string,
  { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }
> = {
  [OrderStatus.DRAFT]:         { label: 'Draft',          variant: 'default' },
  [OrderStatus.PLACED]:        { label: 'Placed',         variant: 'info'    },
  [OrderStatus.ALLOCATING]:    { label: 'Allocating',     variant: 'warning' },
  [OrderStatus.ALLOCATED]:     { label: 'Allocated',      variant: 'warning' },
  [OrderStatus.IN_PRODUCTION]: { label: 'In Production',  variant: 'info'    },
  [OrderStatus.QUALITY_CHECK]: { label: 'Quality Check',  variant: 'warning' },
  [OrderStatus.DISPATCHED]:    { label: 'Dispatched',     variant: 'success' },
  [OrderStatus.DELIVERED]:     { label: 'Delivered',      variant: 'success' },
  [OrderStatus.CANCELLED]:     { label: 'Cancelled',      variant: 'danger'  },
  [OrderStatus.DISPUTED]:      { label: 'Disputed',       variant: 'danger'  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const api = createServerApi(session.accessToken);
  const firstName = session.user.name?.split(' ')[0] ?? 'there';

  // Fetch buyer's orders
  let orders: OrderResponse[] = [];
  try {
    const res = await api.get<ApiPaginatedResponse<OrderResponse>['data']>(
      '/orders',
      { limit: '20' },
    );
    orders = [...res] as OrderResponse[];
  } catch {
    // Non-fatal — show empty state
  }

  // Compute stats
  const activeOrders = orders.filter(
    (o) =>
      o.status !== OrderStatus.DELIVERED &&
      o.status !== OrderStatus.CANCELLED,
  ).length;

  const inProduction = orders.filter(
    (o) => o.status === OrderStatus.IN_PRODUCTION,
  ).length;

  const delivered = orders.filter(
    (o) => o.status === OrderStatus.DELIVERED,
  ).length;

  const totalSpend = orders
    .filter((o) => o.status !== OrderStatus.CANCELLED)
    .reduce((sum, o) => sum + o.totalValue, 0);

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="font-display text-4xl text-foreground mb-1">
          WELCOME BACK, {firstName.toUpperCase()}
        </h1>
        <p className="font-body text-sm text-foreground-muted">
          Here&apos;s what&apos;s happening with your orders.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Orders"
          value={activeOrders}
          sub="In progress"
          accent="brand"
        />
        <StatCard
          label="In Production"
          value={inProduction}
          sub="Being manufactured"
          accent="info"
        />
        <StatCard
          label="Delivered"
          value={delivered}
          sub="All time"
          accent="success"
        />
        <StatCard
          label="Total Spend"
          value={formatZar(totalSpend)}
          sub="All orders (excl. cancelled)"
        />
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl text-foreground">
            RECENT ORDERS
          </h2>
          <Link href="/orders">
            <Button variant="ghost" size="sm">
              View All →
            </Button>
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <Card variant="elevated" padding="lg">
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="font-display text-xl text-foreground mb-2">
                NO ORDERS YET
              </h3>
              <p className="font-body text-sm text-foreground-muted mb-6">
                Place your first order to start sourcing from African
                manufacturers.
              </p>
              <Link href="/orders/new">
                <Button variant="primary">Place First Order</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <Card variant="elevated" padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 font-body text-xs text-foreground-subtle uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="text-left px-5 py-3 font-body text-xs text-foreground-subtle uppercase tracking-wider">
                      Product
                    </th>
                    <th className="text-left px-5 py-3 font-body text-xs text-foreground-subtle uppercase tracking-wider hidden sm:table-cell">
                      Value
                    </th>
                    <th className="text-left px-5 py-3 font-body text-xs text-foreground-subtle uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-5 py-3 font-body text-xs text-foreground-subtle uppercase tracking-wider hidden md:table-cell">
                      Created
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentOrders.map((order) => {
                    const badge =
                      STATUS_BADGE_MAP[order.status] ?? {
                        label:   order.status,
                        variant: 'default' as const,
                      };
                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-surface-elevated transition-colors duration-100"
                      >
                        <td className="px-5 py-4 font-mono text-xs text-foreground-muted">
                          {order.orderNumber}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-body text-sm text-foreground">
                            {order.productName}
                          </p>
                          <p className="font-body text-xs text-foreground-subtle">
                            {order.productCategory}
                          </p>
                        </td>
                        <td className="px-5 py-4 font-mono text-sm text-foreground hidden sm:table-cell">
                          {formatZar(order.totalValue)}
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={badge.variant} size="sm">
                            {badge.label}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 font-body text-xs text-foreground-muted hidden md:table-cell">
                          {formatRelativeTime(order.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <Link href={`/orders/${order.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
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

      {/* Quick actions */}
      <div>
        <h2 className="font-display text-2xl text-foreground mb-4">
          QUICK ACTIONS
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/orders/new">
            <Card variant="outlined" padding="md" hoverable className="text-center">
              <div className="text-2xl mb-3">📦</div>
              <p className="font-body text-sm font-semibold text-foreground mb-1">
                Place New Order
              </p>
              <p className="font-body text-xs text-foreground-muted">
                Submit an RFQ to verified factories
              </p>
            </Card>
          </Link>
          <Link href="/factories">
            <Card variant="outlined" padding="md" hoverable className="text-center">
              <div className="text-2xl mb-3">🏭</div>
              <p className="font-body text-sm font-semibold text-foreground mb-1">
                Browse Factories
              </p>
              <p className="font-body text-xs text-foreground-muted">
                Explore 300+ verified manufacturers
              </p>
            </Card>
          </Link>
          <Link href="/orders">
            <Card variant="outlined" padding="md" hoverable className="text-center">
              <div className="text-2xl mb-3">📊</div>
              <p className="font-body text-sm font-semibold text-foreground mb-1">
                Track Orders
              </p>
              <p className="font-body text-xs text-foreground-muted">
                Real-time production updates
              </p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
