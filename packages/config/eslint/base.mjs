// @ts-check
/**
 * ADMIN Platform — Base ESLint Configuration (ESLint v9 flat config)
 *
 * Applies to all TypeScript workspaces in the monorepo.
 * Framework-specific configs (next.mjs, nest.mjs) extend this.
 *
 * Usage in a workspace eslint.config.mjs:
 *   import { base } from '@admin-platform/config/eslint/base.mjs';
 *   export default [...base, { rules: { ... } }];
 */

import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export const base = tseslint.config(
  // ─── Global ignores ─────────────────────────────────────────────────────────
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/*.gen.ts',
      '**/src/generated/**',
      '**/prisma/generated/**',
    ],
  },

  // ─── JavaScript recommended ──────────────────────────────────────────────────
  js.configs.recommended,

  // ─── TypeScript recommended ──────────────────────────────────────────────────
  // Uses tseslint.configs.recommended (no type-info required — fast and compatible)
  ...tseslint.configs.recommended,

  // ─── ADMIN platform rules ────────────────────────────────────────────────────
  {
    rules: {
      // ── TypeScript strictness ─────────────────────────────────────────────
      // 'any' is forbidden. Use 'unknown' and narrow with type guards.
      '@typescript-eslint/no-explicit-any': 'error',

      // Unused variables/imports must be prefixed with _ to suppress
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],

      // Prefer ?? over ||, and ?. over && chains
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',

      // Type imports must use 'import type' syntax
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',

      // Array types: use T[] not Array<T> for simple types
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],

      // No non-null assertions — use proper null checks or optional chaining
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // Require return types on module boundaries (functions exported from a module)
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // ── Code quality ──────────────────────────────────────────────────────
      // Use the service logger — never console.log in production code
      'no-console': 'warn',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',

      // Throwing non-Error objects breaks stack traces
      'no-throw-literal': 'error',

      // ── TypeScript native rules ───────────────────────────────────────────
      'no-undef': 'off', // TypeScript handles this natively
    },
  },
);
