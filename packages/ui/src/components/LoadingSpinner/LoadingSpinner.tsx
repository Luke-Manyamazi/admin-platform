import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';

// ─── Variants ─────────────────────────────────────────────────────────────────

const spinnerVariants = cva(
  'animate-spin rounded-full border-2 border-current border-t-transparent shrink-0',
  {
    variants: {
      size: {
        sm: 'h-3.5 w-3.5',
        md: 'h-5 w-5',
        lg: 'h-7 w-7',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoadingSpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string;
  /** Accessible label announced to screen readers */
  label?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function LoadingSpinner({
  size,
  className,
  label = 'Loading…',
}: LoadingSpinnerProps): React.JSX.Element {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(spinnerVariants({ size }), className)}
    />
  );
}

LoadingSpinner.displayName = 'LoadingSpinner';
