'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Badge, Button } from '@admin-platform/ui';
import { formatZar, formatDate, formatDateTime, humanise } from '@/lib/format';
import { OrderStatus } from '@admin-platform/types';
import type { OrderResponse } from '@admin-platform/types';

const STATUS_OPTIONS = Object.values(OrderStatus).filter(s => s !== OrderStatus.DRAFT);

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = {
  [OrderStatus.DRAFT]:         { label: 'Draft',         variant: 'default' },
  [OrderStatus.PLACED]:        { label: 'Placed',        variant: 'info' },
  [OrderStatus.ALLOCATING]:    { label: 'Allocating',    variant: 'warning' },
  [OrderStatus.ALLOCATED]:     { label: 'Allocated',     variant: 'warning' },
  [OrderStatus.IN_PRODUCTION]: { label: 'In Production', variant: 'info' },
  [OrderStatus.QUALITY_CHECK]: { label: 'Quality Check', variant: 'warning' },
  [OrderStatus.DISPATCHED]:    { label: 'Dispatched',    variant: 'success' },
  [OrderStatus.DELIVERED]:     { label: 'Delivered',     variant: 'success' },
  [OrderStatus.CANCELLED]:     { label: 'Cancelled',     variant: 'danger' },
  [OrderStatus.DISPUTED]:      { label: 'Disputed',      variant: 'danger' },
};

export default function OpsOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [order,    setOrder]    = useState<OrderResponse | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [overrideNote, setOverrideNote] = useState('');
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    void fetchOrder();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchOrder() {
    try {
      const res = await fetch(`/api/proxy/orders/${id}`);
      const json = (await res.json()) as { success: boolean; data: OrderResponse };
      if (json.success) {
        setOrder(json.data);
        setNewStatus(json.data.status);
      }
    } catch { /* empty */ } finally {
      setLoading(false);
    }
  }

  async function handleStatusOverride(e: React.FormEvent) {
    e.preventDefault();
    if (!order || newStatus === order.status) return;
    setSaving(true); setError('');

    try {
      const res = await fetch(`/api/proxy/orders/${id}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: newStatus, note: overrideNote }),
      });
      const json = (await res.json()) as { success: boolean };
      if (!json.success) throw new Error('API returned failure');
      setSaved(true);
      setTimeout(() => { setSaved(false); void fetchOrder(); }, 2000);
    } catch {
      setError('Failed to update status. Make sure the API gateway is running.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Link href="/ops/orders"><Button variant="ghost" size="sm">← Back to Orders</Button></Link>
        <Card variant="elevated" padding="lg">
          <div className="text-center py-10">
            <p className="font-display text-2xl text-foreground mb-2">ORDER NOT FOUND</p>
            <p className="font-body text-sm text-foreground-muted">This order may not exist or the API is offline.</p>
          </div>
        </Card>
      </div>
    );
  }

  const badge = STATUS_BADGE[order.status] ?? { label: order.status, variant: 'default' as const };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back + header */}
      <div>
        <Link href="/ops/orders" className="inline-flex items-center gap-1 font-body text-sm text-foreground-muted hover:text-foreground mb-3 transition-colors">
          ← All Orders
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-sm text-foreground-muted">{order.orderNumber}</span>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>
            <h1 className="font-display text-3xl text-foreground">{order.productName.toUpperCase()}</h1>
            <p className="font-body text-sm text-foreground-muted mt-0.5">{order.productCategory}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-mono text-2xl text-foreground">{formatZar(order.totalValue)}</p>
            <p className="font-body text-xs text-foreground-subtle">Total value</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order details */}
        <Card variant="elevated" padding="md">
          <h2 className="font-display text-lg text-foreground mb-4">ORDER DETAILS</h2>
          <dl className="space-y-3">
            {[
              ['Buyer ID',       order.buyerId ?? '—'],
              ['Quantity',       `${order.quantityUnits.toLocaleString()} ${order.unitOfMeasure}`],
              ['Unit Price',     formatZar(order.targetUnitPrice ?? 0)],
              ['Deadline',       formatDate(order.deadline)],
              ['Placed at',      formatDateTime(order.createdAt)],
              ['Last updated',   formatDateTime(order.updatedAt)],
              ['Delivery country', order.deliveryCountry ?? '—'],
              ['Delivery address', order.deliveryAddress ?? '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <dt className="font-body text-xs text-foreground-subtle shrink-0">{label}</dt>
                <dd className="font-body text-sm text-foreground text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* Status override */}
        <Card variant="elevated" padding="md">
          <h2 className="font-display text-lg text-foreground mb-4">STATUS OVERRIDE</h2>
          <form onSubmit={(e) => void handleStatusOverride(e)} className="space-y-4">
            <div>
              <label className="block font-body text-sm text-foreground-muted mb-1.5">New Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 font-body text-sm text-foreground focus:outline-none focus:border-brand transition-colors"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{humanise(s)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-body text-sm text-foreground-muted mb-1.5">
                Override Note <span className="text-foreground-subtle">(optional)</span>
              </label>
              <textarea
                value={overrideNote}
                onChange={(e) => setOverrideNote(e.target.value)}
                rows={3}
                placeholder="Reason for manual status change…"
                className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 font-body text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-brand transition-colors resize-none"
              />
            </div>

            {error  && <p className="font-body text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{error}</p>}
            {saved  && <p className="font-body text-sm text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2">Status updated successfully.</p>}

            <Button
              type="submit"
              variant="primary"
              disabled={saving || newStatus === order.status}
              className="w-full"
            >
              {saving ? 'Saving…' : 'Override Status'}
            </Button>
          </form>
        </Card>
      </div>

      {/* Specifications */}
      {order.specifications && Object.keys(order.specifications).length > 0 && (
        <Card variant="elevated" padding="md">
          <h2 className="font-display text-lg text-foreground mb-4">SPECIFICATIONS</h2>
          <pre className="font-mono text-xs text-foreground-muted overflow-x-auto">
            {JSON.stringify(order.specifications, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}
