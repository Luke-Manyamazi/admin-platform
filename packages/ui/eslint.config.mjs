// @ts-check
/**
 * ESLint config for @admin-platform/ui (React component library)
 * Extends the library config with React-specific settings.
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
    rules: {
      // React components use display names for debugging
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
    },
  },
];
