'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';

// ─── Variants ─────────────────────────────────────────────────────────────────

const inputVariants = cva(
  [
    'flex w-full font-body bg-surface border border-border rounded-lg',
    'text-foreground placeholder:text-foreground-subtle',
    'transition-colors duration-150',
    'focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-background focus:border-brand',
    'disabled:cursor-not-allowed disabled:opacity-40',
    'file:border-0 file:bg-transparent file:font-semibold file:text-foreground-muted',
  ],
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
      },
      state: {
        default: '',
        error:   'border-danger focus:ring-danger focus:border-danger',
        success: 'border-success focus:ring-success focus:border-success',
      },
    },
    defaultVariants: {
      size: 'md',
      state: 'default',
    },
  },
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /** Field label rendered above the input */
  label?: string;
  /** Error message rendered below the input — also sets error state */
  error?: string;
  /** Helper text rendered below the input (hidden when error is present) */
  hint?: string;
  /** Icon or element rendered inside the left edge */
  leftAdornment?: React.ReactNode;
  /** Icon or element rendered inside the right edge */
  rightAdornment?: React.ReactNode;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size,
      state: stateProp,
      label,
      error,
      hint,
      leftAdornment,
      rightAdornment,
      id: idProp,
      ...props
    },
    ref,
  ) => {
    // Auto-generate an id for label association if none provided
    const generatedId = React.useId();
    const id = idProp ?? generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    const state = error !== undefined ? 'error' : stateProp;
    const hasLeftAdornment = leftAdornment !== undefined;
    const hasRightAdornment = rightAdornment !== undefined;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {/* Label */}
        {label !== undefined && (
          <label
            htmlFor={id}
            className="text-sm font-semibold font-body text-foreground-muted"
          >
            {label}
          </label>
        )}

        {/* Input + adornments */}
        <div className="relative flex items-center">
          {hasLeftAdornment && (
            <span className="absolute left-3 flex items-center text-foreground-muted pointer-events-none">
              {leftAdornment}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              inputVariants({ size, state }),
              hasLeftAdornment && 'pl-9',
              hasRightAdornment && 'pr-9',
              className,
            )}
            aria-invalid={error !== undefined}
            aria-describedby={
              error !== undefined
                ? errorId
                : hint !== undefined
                  ? hintId
                  : undefined
            }
            {...props}
          />
          {hasRightAdornment && (
            <span className="absolute right-3 flex items-center text-foreground-muted pointer-events-none">
              {rightAdornment}
            </span>
          )}
        </div>

        {/* Error / hint */}
        {error !== undefined ? (
          <p id={errorId} role="alert" className="text-xs font-body text-danger">
            {error}
          </p>
        ) : hint !== undefined ? (
          <p id={hintId} className="text-xs font-body text-foreground-subtle">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
