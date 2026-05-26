// @ts-check
/**
 * ADMIN Platform — Library Package ESLint Configuration
 *
 * Extends base.mjs for shared packages (types, events, ui, etc.).
 * Library code is consumed by multiple workspaces — it must be
 * maximally strict since errors here propagate everywhere.
 *
 * Usage in a library workspace eslint.config.mjs:
 *   import { library } from '@admin-platform/config/eslint/library.mjs';
 *   export default [...library];
 */

import { base } from './base.mjs';

export const library = [
  ...base,
  {
    rules: {
      // ── Exported types must have explicit types ────────────────────────────
      // Library boundaries require explicit typing for consumers.
      '@typescript-eslint/explicit-module-boundary-types': 'error',

      // ── No unused exports ─────────────────────────────────────────────────
      // Every export in a library should be intentional.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // ── Strict typing ─────────────────────────────────────────────────────
      // Libraries should never use non-null assertions — consumers don't know
      // the internal invariants.
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
];
