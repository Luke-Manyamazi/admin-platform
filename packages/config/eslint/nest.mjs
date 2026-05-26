// @ts-check
/**
 * ADMIN Platform — NestJS ESLint Configuration
 *
 * Extends base.mjs with NestJS-specific overrides.
 * NestJS makes heavy use of decorators and dependency injection patterns
 * that require relaxing a few base rules.
 *
 * Usage in a NestJS workspace eslint.config.mjs:
 *   import { nest } from '@admin-platform/config/eslint/nest.mjs';
 *   export default [...nest];
 */

import { base } from './base.mjs';

export const nest = [
  ...base,
  {
    rules: {
      // ── NestJS decorator patterns ─────────────────────────────────────────
      // Decorators like @Controller(), @Get(), @Body() don't need explicit
      // return types on their methods — NestJS infers them from metadata.
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // NestJS modules often have parameters that look unused to ESLint
      // (e.g., injected services used only in DI, constructor-injected deps)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          // Allow unused constructor parameters (common in NestJS DI)
          destructuredArrayIgnorePattern: '^_',
        },
      ],

      // ── Logging ───────────────────────────────────────────────────────────
      // NestJS services MUST use the Logger class, not console.
      // Upgrade from 'warn' to 'error' for services.
      'no-console': 'error',

      // ── NestJS class patterns ────────────────────────────────────────────
      // Empty constructors are normal in NestJS (DI fills them)
      '@typescript-eslint/no-useless-constructor': 'off',
    },
  },
];
