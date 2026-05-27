import type { Config } from 'tailwindcss';
import adminPreset from '../../packages/ui/tailwind.preset';

export default {
  presets: [adminPreset],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
} satisfies Config;
