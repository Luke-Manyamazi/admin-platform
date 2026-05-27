import { Badge } from '@admin-platform/ui';
import { OrderStatus } from '@admin-platform/types';
import type { BadgeVariant } from '@admin-platform/ui';

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: BadgeVariant }
> = {
  [OrderStatus.DRAFT]:         { label: 'Draft',         variant: 'default' },
  [OrderStatus.PLACED]:        { label: 'Placed',        variant: 'info'    },
  [OrderStatus.ALLOCATING]:    { label: 'Allocating',    variant: 'warning' },
  [OrderStatus.ALLOCATED]:     { label: 'Allocated',     variant: 'warning' },
  [OrderStatus.IN_PRODUCTION]: { label: 'In Production', variant: 'info'    },
  [OrderStatus.QUALITY_CHECK]: { label: 'Quality Check', variant: 'warning' },
  [OrderStatus.DISPATCHED]:    { label: 'Dispatched',    variant: 'success' },
  [OrderStatus.DELIVERED]:     { label: 'Delivered',     variant: 'success' },
  [OrderStatus.CANCELLED]:     { label: 'Cancelled',     variant: 'danger'  },
  [OrderStatus.DISPUTED]:      { label: 'Disputed',      variant: 'danger'  },
};

interface OrderStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function OrderStatusBadge({ status, size = 'md' }: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: 'default' as BadgeVariant };
  return (
    <Badge variant={config.variant} size={size}>
      {config.label}
    </Badge>
  );
}
