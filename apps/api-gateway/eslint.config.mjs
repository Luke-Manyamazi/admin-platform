// @ts-check
/**
 * ESLint config for api-gateway (NestJS)
 * Extends the shared nest config from @admin-platform/config
 */
import { nest } from '@admin-platform/config/eslint/nest.mjs';

export default [
  ...nest,
  {
    // api-gateway specific overrides
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
