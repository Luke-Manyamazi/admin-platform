// @ts-check
/**
 * ESLint config for @admin-platform/web (Next.js 14 buyer portal)
 *
 * NOTE: This uses the base config. When Next.js is scaffolded in a later
 * step, eslint-config-next will be added and this config will be extended
 * with Next.js specific rules (image optimisation, link components, etc.)
 */
import { base } from '@admin-platform/config/eslint/base.mjs';

export default [
  ...base,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Next.js allows console in server components for logging
      'no-console': 'warn',
    },
  },
];
