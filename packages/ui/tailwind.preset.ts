/**
 * ADMIN Platform — Tailwind CSS Preset
 *
 * Usage in consuming app's tailwind.config.ts:
 *
 *   import type { Config } from 'tailwindcss';
 *   import adminPreset from '../../packages/ui/tailwind.preset';
 *
 *   export default {
 *     presets: [adminPreset],
 *     content: [
 *       './src/**\/*.{ts,tsx}',
 *       '../../packages/ui/src/**\/*.{ts,tsx}',
 *     ],
 *   } satisfies Config;
 *
 * Fonts are loaded via next/font in the root layout and exposed as CSS
 * variables: --font-display, --font-body, --font-mono.
 */

import type { Config } from 'tailwindcss';

const adminPreset: Omit<Config, 'content'> = {
  darkMode: 'class',
  theme: {
    extend: {
      // ─── Color Palette ─────────────────────────────────────────────────────
      colors: {
        // Backgrounds
        background: '#060809',
        surface: '#0D1117',
        'surface-elevated': '#161B22',

        // Borders
        border: '#21262D',

        // Text
        foreground: '#E6EDF3',
        'foreground-muted': '#8B949E',
        'foreground-subtle': '#484F58',

        // Primary / Brand amber — main CTA colour
        brand: {
          DEFAULT: '#E8A020',
          hover: '#D4911C',
          muted: 'rgba(232, 160, 32, 0.12)',
          foreground: '#060809',
        },

        // Semantic status colours
        success: {
          DEFAULT: '#28C76F',
          muted: 'rgba(40, 199, 111, 0.12)',
          foreground: '#060809',
        },
        info: {
          DEFAULT: '#3A8EE8',
          muted: 'rgba(58, 142, 232, 0.12)',
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: '#9B6EF0',
          muted: 'rgba(155, 110, 240, 0.12)',
          foreground: '#ffffff',
        },
        danger: {
          DEFAULT: '#F05454',
          muted: 'rgba(240, 84, 84, 0.12)',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: '#F0A354',
          muted: 'rgba(240, 163, 84, 0.12)',
          foreground: '#060809',
        },
      },

      // ─── Typography ────────────────────────────────────────────────────────
      // Actual font loading happens in the Next.js app via next/font/google.
      // The app sets these CSS variables on the <html> element.
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'sans-serif'],
        body: ['var(--font-body)', 'ui-sans-serif', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },

      // ─── Type Scale ────────────────────────────────────────────────────────
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },

      // ─── Spacing ───────────────────────────────────────────────────────────
      borderRadius: {
        none: '0',
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        full: '9999px',
      },

      // ─── Shadows ───────────────────────────────────────────────────────────
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.5), 0 1px 2px -1px rgba(0, 0, 0, 0.5)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
        brand: '0 0 0 3px rgba(232, 160, 32, 0.25)',
        none: 'none',
      },

      // ─── Transitions ───────────────────────────────────────────────────────
      transitionDuration: {
        DEFAULT: '150ms',
        fast: '100ms',
        slow: '250ms',
      },

      // ─── Ring ──────────────────────────────────────────────────────────────
      ringColor: {
        DEFAULT: '#E8A020',
        brand: '#E8A020',
        danger: '#F05454',
      },
      ringOffsetColor: {
        background: '#060809',
      },
    },
  },
  plugins: [],
};

export default adminPreset;
