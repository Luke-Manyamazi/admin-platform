// @ts-check
/**
 * ESLint config for @admin-platform/types (library)
 * Uses the stricter library config — all exports must be explicitly typed.
 */
import { library } from '@admin-platform/config/eslint/library.mjs';

export default [
  ...library,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
