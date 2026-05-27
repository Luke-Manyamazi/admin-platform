import { OrderStatus } from '@admin-platform/types';
import { cn } from '@admin-platform/ui';

// ─── Timeline steps ───────────────────────────────────────────────────────────

const TIMELINE_STEPS: Array<{ status: string; label: string }> = [
  { status: OrderStatus.PLACED,        label: 'Order Placed'     },
  { status: OrderStatus.ALLOCATING,    label: 'Finding Factories' },
  { status: OrderStatus.ALLOCATED,     label: 'Factories Assigned' },
  { status: OrderStatus.IN_PRODUCTION, label: 'In Production'    },
  { status: OrderStatus.QUALITY_CHECK, label: 'Quality Check'    },
  { status: OrderStatus.DISPATCHED,    label: 'Dispatched'       },
  { status: OrderStatus.DELIVERED,     label: 'Delivered'        },
];

const STATUS_ORDER = TIMELINE_STEPS.map((s) => s.status);

function getStepState(
  stepStatus: string,
  currentStatus: string,
): 'done' | 'active' | 'pending' {
  const stepIdx    = STATUS_ORDER.indexOf(stepStatus);
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);

  if (currentStatus === OrderStatus.CANCELLED) return 'pending';
  if (currentStatus === OrderStatus.DISPUTED && stepIdx <= currentIdx) return 'active';
  if (stepIdx < currentIdx)  return 'done';
  if (stepIdx === currentIdx) return 'active';
  return 'pending';
}

// ─── Component ────────────────────────────────────────────────────────────────

interface OrderTimelineProps {
  currentStatus: string;
}

export function OrderTimeline({ currentStatus }: OrderTimelineProps) {
  const isCancelled = currentStatus === OrderStatus.CANCELLED;
  const isDisputed  = currentStatus === OrderStatus.DISPUTED;

  if (isCancelled || isDisputed) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg border font-body text-sm',
          isCancelled
            ? 'bg-danger/10 border-danger/30 text-danger'
            : 'bg-warning/10 border-warning/30 text-warning',
        )}
      >
        <span className="text-lg">{isCancelled ? '✕' : '⚠'}</span>
        {isCancelled
          ? 'This order has been cancelled.'
          : 'This order has a dispute open. Our team will be in touch.'}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Connecting line */}
      <div
        aria-hidden="true"
        className="absolute left-4 top-4 bottom-4 w-px bg-border"
      />

      <ol className="space-y-0">
        {TIMELINE_STEPS.map((step, idx) => {
          const state = getStepState(step.status, currentStatus);
          return (
            <li key={step.status} className="flex items-center gap-4 py-3 relative">
              {/* Dot */}
              <div
                className={cn(
                  'relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors',
                  state === 'done'
                    ? 'bg-success border-success'
                    : state === 'active'
                    ? 'bg-brand border-brand'
                    : 'bg-surface border-border',
                )}
              >
                {state === 'done' ? (
                  <svg className="w-4 h-4 text-success-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : state === 'active' ? (
                  <div className="w-2 h-2 rounded-full bg-brand-foreground" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-foreground-subtle" />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'font-body text-sm',
                  state === 'done'
                    ? 'text-foreground-muted'
                    : state === 'active'
                    ? 'text-foreground font-semibold'
                    : 'text-foreground-subtle',
                )}
              >
                {step.label}
                {state === 'active' && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand/15 border border-brand/25 text-brand text-xs font-medium">
                    Current
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
