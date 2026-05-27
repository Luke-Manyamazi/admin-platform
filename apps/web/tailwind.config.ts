import type { Config } from 'tailwindcss';
import adminPreset from '../../packages/ui/tailwind.preset';

/**
 * Tailwind CSS configuration for apps/web.
 *
 * Extends the ADMIN brand preset from @admin-platform/ui, which defines
 * all custom colors, typography, shadows, and spacing tokens.
 */
export default {
  presets: [adminPreset],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  // darkMode is configured in the preset (class-based)
} satisfies Config;
