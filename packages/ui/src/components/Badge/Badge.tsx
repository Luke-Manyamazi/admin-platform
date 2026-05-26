import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';

// ─── Variants ─────────────────────────────────────────────────────────────────
//
// Variant names map directly to ADMIN status enums so the badge can reflect
// FactoryStatus and OrderStatus values with a single prop lookup:
//
//   const FACTORY_STATUS_VARIANT: Record<FactoryStatus, BadgeVariant> = {
//     PENDING:   'pending',
//     VERIFIED:  'success',
//     SUSPENDED: 'warning',
//     REJECTED:  'danger',
//   };

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-body font-semibold uppercase tracking-wide border',
  {
    variants: {
      variant: {
        default:  'bg-surface border-border text-foreground-muted',
        pending:  'bg-brand-muted border-brand/30 text-brand',
        success:  'bg-success-muted border-success/30 text-success',
        warning:  'bg-warning-muted border-warning/30 text-warning',
        danger:   'bg-danger-muted border-danger/30 text-danger',
        info:     'bg-info-muted border-info/30 text-info',
        accent:   'bg-accent-muted border-accent/30 text-accent',
      },
      size: {
        sm: 'h-5 px-1.5 text-2xs rounded',
        md: 'h-6 px-2 text-xs rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Optional dot indicator rendered before the label */
  dot?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Badge({
  variant,
  size,
  dot = false,
  className,
  children,
  ...props
}: BadgeProps): React.JSX.Element {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-current shrink-0"
        />
      )}
      {children}
    </span>
  );
}

Badge.displayName = 'Badge';
