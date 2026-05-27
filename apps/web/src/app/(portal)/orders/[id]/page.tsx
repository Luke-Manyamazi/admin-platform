import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { createServerApi, ApiError } from '@/lib/api';
import { Card, Badge, Button } from '@admin-platform/ui';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { OrderTimeline } from '@/components/orders/OrderTimeline';
import { formatZar, formatDate, formatDateTime, formatDeadlineCountdown } from '@/lib/format';
import type { OrderResponse } from '@admin-platform/types';
import { OrderStatus, SubOrderStatus } from '@admin-platform/types';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  return { title: `Order ${params.id.slice(0, 8)}` };
}

// ─── Sub-order status badge ───────────────────────────────────────────────────

const SUB_STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }
> = {
  [SubOrderStatus.PENDING_ACCEPTANCE]: { label: 'Awaiting Acceptance', variant: 'warning' },
  [SubOrderStatus.ACCEPTED]:           { label: 'Accepted',            variant: 'info'    },
  [SubOrderStatus.DECLINED]:           { label: 'Declined',            variant: 'danger'  },
  [SubOrderStatus.IN_PRODUCTION]:      { label: 'In Production',       variant: 'info'    },
  [SubOrderStatus.QUALITY_CHECK]:      { label: 'Quality Check',       variant: 'warning' },
  [SubOrderStatus.COMPLETED]:          { label: 'Completed',           variant: 'success' },
  [SubOrderStatus.FAILED]:             { label: 'Failed',              variant: 'danger'  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) redirect('/login');

  const api = createServerApi(session.accessToken);

  let order: OrderResponse;
  try {
    // Request sub-orders to be included (if the service supports ?include=subOrders)
    order = await api.get<OrderResponse>(`/orders/${params.id}`);
  } catch (err) {
    if (
      err instanceof ApiError &&
      (err.status === 404 || err.code === 'ORDER_NOT_FOUND')
    ) {
      notFound();
    }
    throw err;
  }

  const canCancel =
    order.status === OrderStatus.DRAFT ||
    order.status === OrderStatus.PLACED;

  const isDraft = order.status === OrderStatus.DRAFT;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 font-body text-sm text-foreground-muted">
        <Link href="/orders" className="hover:text-foreground transition-colors">
          Orders
        </Link>
        <span>/</span>
        <span className="font-mono text-foreground">{order.orderNumber}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display text-3xl text-foreground">
              {order.productName.toUpperCase()}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="font-mono text-sm text-foreground-muted">
            {order.orderNumber}
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          {isDraft && (
            <Link href={`/orders/${order.id}/edit`}>
              <Button variant="outline" size="sm">Edit Draft</Button>
            </Link>
          )}
          {canCancel && !isDraft && (
            <form action={`/api/orders/${order.id}/cancel`} method="POST">
              <Button variant="danger" size="sm" type="submit">
                Cancel
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Summary + Timeline — two columns on wide screens */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — order details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Key metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Value',   value: formatZar(order.totalValue),         mono: true  },
              { label: 'Quantity',      value: `${order.quantityUnits.toLocaleString()} ${order.unitOfMeasure}`, mono: false },
              { label: 'Price / Unit',  value: formatZar(order.targetUnitPrice),    mono: true  },
              { label: 'Deadline',      value: formatDate(order.deadline),          mono: false },
              { label: 'Deadline',      value: formatDeadlineCountdown(order.deadline), mono: false, sub: true },
              { label: 'Placed',        value: formatDate(order.createdAt),         mono: false },
            ]
              .filter((_, i) => i !== 4) // skip sub-row
              .map((stat) => (
                <Card key={stat.label} variant="default" padding="sm">
                  <p className="font-body text-2xs text-foreground-subtle uppercase tracking-wide mb-1">
                    {stat.label}
                  </p>
                  <p className={`${stat.mono ? 'font-mono' : 'font-body'} text-sm text-foreground`}>
                    {stat.value}
                  </p>
                  {stat.label === 'Deadline' && (
                    <p className="font-body text-xs text-foreground-subtle mt-0.5">
                      {formatDeadlineCountdown(order.deadline)}
                    </p>
                  )}
                </Card>
              ))}
          </div>

          {/* Product details */}
          <Card variant="elevated" padding="md">
            <h2 className="font-display text-xl text-foreground mb-4">
              PRODUCT DETAILS
            </h2>
            <div className="space-y-3 font-body text-sm">
              <div className="flex justify-between">
                <span className="text-foreground-muted">Category</span>
                <span className="text-foreground">
                  {order.productCategory.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-muted">Product</span>
                <span className="text-foreground">{order.productName}</span>
              </div>
              {order.notes !== null && (
                <div>
                  <span className="text-foreground-muted block mb-1">Notes</span>
                  <p className="text-foreground text-sm leading-relaxed">
                    {order.notes}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Delivery */}
          <Card variant="elevated" padding="md">
            <h2 className="font-display text-xl text-foreground mb-4">
              DELIVERY
            </h2>
            <div className="space-y-2 font-body text-sm">
              <div className="flex justify-between">
                <span className="text-foreground-muted">Country</span>
                <span className="text-foreground">{order.deliveryCountry}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-muted">Address</span>
                <span className="text-foreground text-right max-w-xs">
                  {order.deliveryAddress}
                </span>
              </div>
            </div>
          </Card>

          {/* Sub-orders */}
          {order.subOrders !== undefined && order.subOrders.length > 0 && (
            <Card variant="elevated" padding="md">
              <h2 className="font-display text-xl text-foreground mb-4">
                FACTORY ASSIGNMENTS
              </h2>
              <div className="space-y-3">
                {order.subOrders.map((sub) => {
                  const cfg = SUB_STATUS_CONFIG[sub.status] ?? {
                    label:   sub.status,
                    variant: 'default' as const,
                  };
                  return (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between py-3 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="font-mono text-xs text-foreground-muted mb-0.5">
                          {sub.id.slice(0, 8)}
                        </p>
                        <p className="font-body text-sm text-foreground">
                          {sub.units.toLocaleString()} units
                        </p>
                        <p className="font-body text-xs text-foreground-subtle">
                          Trust score at allocation: {sub.trustScoreAtAllocation}%
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={cfg.variant} size="sm">
                          {cfg.label}
                        </Badge>
                        {sub.progressPercent > 0 && (
                          <p className="font-mono text-xs text-foreground-muted mt-1.5">
                            {sub.progressPercent}% complete
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Right — timeline */}
        <div className="lg:col-span-1">
          <Card variant="elevated" padding="md" className="sticky top-20">
            <h2 className="font-display text-xl text-foreground mb-5">
              ORDER STATUS
            </h2>
            <OrderTimeline currentStatus={order.status} />
          </Card>
        </div>
      </div>

      {/* Trace ID */}
      <p className="font-mono text-2xs text-foreground-subtle">
        Trace ID: {order.traceOrderId}
      </p>
    </div>
  );
}
