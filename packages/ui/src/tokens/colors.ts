/**
 * ADMIN Brand Color Tokens
 *
 * TypeScript constants that mirror the Tailwind preset — use these in places
 * where you cannot use Tailwind classes (e.g. inline SVG fills, chart colours,
 * canvas APIs, third-party component theming).
 *
 * For everything else, use the Tailwind utility classes from tailwind.preset.ts.
 */

export const Colors = {
  // ─── Backgrounds ───────────────────────────────────────────────────────────
  background: '#060809',
  surface: '#0D1117',
  surfaceElevated: '#161B22',

  // ─── Borders ───────────────────────────────────────────────────────────────
  border: '#21262D',

  // ─── Text ──────────────────────────────────────────────────────────────────
  foreground: '#E6EDF3',
  foregroundMuted: '#8B949E',
  foregroundSubtle: '#484F58',

  // ─── Primary / Brand Amber ─────────────────────────────────────────────────
  brand: '#E8A020',
  brandHover: '#D4911C',
  brandForeground: '#060809',

  // ─── Semantic Status ───────────────────────────────────────────────────────
  success: '#28C76F',
  successForeground: '#060809',

  info: '#3A8EE8',
  infoForeground: '#ffffff',

  accent: '#9B6EF0',
  accentForeground: '#ffffff',

  danger: '#F05454',
  dangerForeground: '#ffffff',

  warning: '#F0A354',
  warningForeground: '#060809',
} as const;

export type ColorToken = (typeof Colors)[keyof typeof Colors];
