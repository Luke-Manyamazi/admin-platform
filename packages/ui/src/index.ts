/**
 * @admin-platform/ui — Public API
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *
 *   import { Button, Card, Input, Badge } from '@admin-platform/ui';
 *   import { Colors, FontFamilies }       from '@admin-platform/ui';
 *
 * ─── Tailwind Preset ─────────────────────────────────────────────────────────
 *
 *   Import the Tailwind preset in your app's tailwind.config.ts:
 *
 *     import adminPreset from '../../packages/ui/tailwind.preset';
 *
 *     export default {
 *       presets: [adminPreset],
 *       content: [
 *         './src/**\/*.{ts,tsx}',
 *         '../../packages/ui/src/**\/*.{ts,tsx}',
 *       ],
 *     } satisfies Config;
 *
 * ─── Font Loading ─────────────────────────────────────────────────────────────
 *
 *   Load fonts in your Next.js root layout — see FontVariables/FontFamilies in
 *   the tokens module for the expected CSS variable names.
 */

// ─── Design Tokens ────────────────────────────────────────────────────────────

export { Colors, FontVariables, FontFamilies } from './tokens';
export type { ColorToken } from './tokens';

// ─── Utility ──────────────────────────────────────────────────────────────────

export { cn } from './lib/cn';

// ─── Components ───────────────────────────────────────────────────────────────

export { Button, buttonVariants } from './components/Button';
export type { ButtonProps } from './components/Button';

export { Card, CardHeader, CardBody, CardFooter } from './components/Card';
export type { CardProps, CardHeaderProps, CardBodyProps, CardFooterProps } from './components/Card';

export { Input } from './components/Input';
export type { InputProps } from './components/Input';

export { Badge } from './components/Badge';
export type { BadgeProps, BadgeVariant } from './components/Badge';

export { LoadingSpinner } from './components/LoadingSpinner';
export type { LoadingSpinnerProps } from './components/LoadingSpinner';

export { PageLayout, Sidebar, HeaderBar } from './components/PageLayout';
export type { PageLayoutProps, SidebarProps, HeaderBarProps } from './components/PageLayout';
