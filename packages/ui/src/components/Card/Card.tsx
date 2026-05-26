import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';

// ─── Variants ─────────────────────────────────────────────────────────────────

const cardVariants = cva('rounded-xl border transition-colors duration-150', {
  variants: {
    variant: {
      default:  'bg-surface border-border',
      elevated: 'bg-surface-elevated border-border shadow-md',
      outlined: 'bg-transparent border-border',
      ghost:    'bg-transparent border-transparent',
    },
    padding: {
      none: '',
      sm:   'p-4',
      md:   'p-6',
      lg:   'p-8',
    },
    hoverable: {
      true:  'hover:border-brand/40 hover:shadow-lg cursor-pointer',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'md',
    hoverable: false,
  },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

// ─── Sub-components ───────────────────────────────────────────────────────────

export function CardHeader({ className, ...props }: CardHeaderProps): React.JSX.Element {
  return <div className={cn('flex flex-col gap-1.5', className)} {...props} />;
}
CardHeader.displayName = 'CardHeader';

export function CardBody({ className, ...props }: CardBodyProps): React.JSX.Element {
  return <div className={cn('', className)} {...props} />;
}
CardBody.displayName = 'CardBody';

export function CardFooter({ className, ...props }: CardFooterProps): React.JSX.Element {
  return (
    <div
      className={cn('flex items-center pt-4 border-t border-border', className)}
      {...props}
    />
  );
}
CardFooter.displayName = 'CardFooter';

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({
  variant,
  padding,
  hoverable,
  className,
  ...props
}: CardProps): React.JSX.Element {
  return (
    <div
      className={cn(cardVariants({ variant, padding, hoverable }), className)}
      {...props}
    />
  );
}
Card.displayName = 'Card';
