/**
 * Shared formatting utilities for the ADMIN Ops dashboard.
 */

/** Format ZAR cents as a currency string: 150000 → "R 1,500.00" */
export function formatZar(cents: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style:                 'currency',
    currency:              'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** Format ISO date string as "15 Jan 2025" */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-ZA', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  }).format(new Date(dateStr));
}

/** Format ISO date as "15 Jan 2025, 14:30" */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-ZA', {
    day:    'numeric',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

/** Format ISO date as "3 days ago" / "just now" */
export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)    return 'just now';
  if (mins < 60)   return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days < 30)   return `${days}d ago`;
  return formatDate(dateStr);
}

/** Truncate a UUID to the last 8 chars for display: "…a3f9b201" */
export function shortId(id: string): string {
  return id.length > 8 ? `…${id.slice(-8)}` : id;
}

/** Convert SCREAMING_SNAKE_CASE to "Title Case" */
export function humanise(str: string): string {
  return str
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Return 2-char initials from a full name */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/** Tailwind text colour class for a 0-100 trust score */
export function trustScoreColorClass(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-danger';
}
