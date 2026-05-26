// @ts-check
/**
 * ESLint config for payments-service (NestJS)
 * Extends the shared nest config from @admin-platform/config
 */
import { nest } from '@admin-platform/config/eslint/nest.mjs';

export default [
  ...nest,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
