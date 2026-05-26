'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { LoadingSpinner } from '../LoadingSpinner/LoadingSpinner';

// ─── Variants ─────────────────────────────────────────────────────────────────

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-body font-semibold',
    'transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-40',
    'cursor-pointer select-none',
    'whitespace-nowrap',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-brand text-brand-foreground hover:bg-brand-hover active:scale-[0.98]',
        secondary:
          'border border-brand text-brand bg-transparent hover:bg-brand-muted active:scale-[0.98]',
        ghost:
          'text-foreground-muted bg-transparent hover:text-foreground hover:bg-surface-elevated active:scale-[0.98]',
        danger:
          'bg-danger text-danger-foreground hover:bg-danger/90 active:scale-[0.98]',
        outline:
          'border border-border text-foreground bg-transparent hover:bg-surface-elevated active:scale-[0.98]',
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-md',
        md: 'h-10 px-4 text-sm rounded-lg',
        lg: 'h-12 px-6 text-base rounded-lg',
        icon: 'h-10 w-10 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Replaces children with a spinner and disables interaction */
  loading?: boolean;
  /** Icon rendered to the left of the label */
  leftIcon?: React.ReactNode;
  /** Icon rendered to the right of the label */
  rightIcon?: React.ReactNode;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled ?? loading;
    const spinnerSize = size === 'lg' ? 'md' : 'sm';

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <LoadingSpinner size={spinnerSize} />
        ) : (
          leftIcon !== undefined && (
            <span aria-hidden="true" className="shrink-0">
              {leftIcon}
            </span>
          )
        )}
        {size !== 'icon' && children}
        {!loading && rightIcon !== undefined && (
          <span aria-hidden="true" className="shrink-0">
            {rightIcon}
          </span>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

// Export variants helper for extending button styles in other components
export { buttonVariants };
