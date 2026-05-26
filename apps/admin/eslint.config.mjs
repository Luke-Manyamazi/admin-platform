// @ts-check
/**
 * ESLint config for @admin-platform/admin (Next.js 14 ops dashboard)
 *
 * NOTE: When Next.js is scaffolded, eslint-config-next will be added.
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
      'no-console': 'warn',
    },
  },
];
