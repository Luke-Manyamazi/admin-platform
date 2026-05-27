/**
 * ADMIN Connect — formatting utilities.
 *
 * Shared across the buyer portal for consistent display of money, dates,
 * order references, and trust scores.
 */

// ─── Currency ─────────────────────────────────────────────────────────────────

const zarFormatter = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format an integer ZAR-cent value to a human-readable currency string.
 * @example formatZar(150000) → "R 1,500.00"
 */
export function formatZar(cents: number): string {
  return zarFormatter.format(cents / 100);
}

/**
 * Parse a ZAR display string (e.g. "1500.00") to integer cents.
 * Strips non-numeric characters except the decimal separator.
 */
export function parseZarToCents(display: string): number {
  const numeric = display.replace(/[^0-9.]/g, '');
  return Math.round(parseFloat(numeric || '0') * 100);
}

// ─── Dates ────────────────────────────────────────────────────────────────────

const shortDateFormatter = new Intl.DateTimeFormat('en-ZA', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const fullDateFormatter = new Intl.DateTimeFormat('en-ZA', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Format an ISO date string to a short human-readable date.
 * @example formatDate("2024-03-15T10:30:00Z") → "15 Mar 2024"
 */
export function formatDate(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return shortDateFormatter.format(d);
}

/**
 * Format an ISO date string to a full date + time string.
 * @example formatDateTime("2024-03-15T10:30:00Z") → "15 March 2024, 12:30"
 */
export function formatDateTime(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return fullDateFormatter.format(d);
}

/**
 * Format a date relative to now.
 * Falls back to formatDate for dates older than 30 days.
 */
export function formatRelativeTime(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1)   return 'Just now';
  if (diffMins < 60)  return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)   return `${diffDays} days ago`;
  if (diffDays < 30)  return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(d);
}

/**
 * Format a deadline as "X days remaining" or "Overdue".
 */
export function formatDeadlineCountdown(deadlineStr: string): string {
  const diff = Math.ceil(
    (new Date(deadlineStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (diff < 0)  return 'Overdue';
  if (diff === 0) return 'Due today';
  if (diff === 1) return '1 day left';
  return `${diff} days left`;
}

// ─── Numbers ──────────────────────────────────────────────────────────────────

const numberFormatter = new Intl.NumberFormat('en-ZA');

/** Format a plain number with thousands separators */
export function formatNumber(n: number): string {
  return numberFormatter.format(n);
}

/** Format a trust score (0–100) to a percentage string */
export function formatTrustScore(score: number): string {
  return `${score}%`;
}

/** Return a Tailwind text-color class for a trust score */
export function trustScoreColorClass(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-danger';
}

// ─── Strings ──────────────────────────────────────────────────────────────────

/** Truncate a string to maxLength characters with an ellipsis */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}

/**
 * Convert a SCREAMING_SNAKE_CASE string to Title Case With Spaces.
 * @example humanise('IN_PRODUCTION') → 'In Production'
 */
export function humanise(str: string): string {
  return str
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Return initials from a full name — up to 2 characters */
export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join('');
}
