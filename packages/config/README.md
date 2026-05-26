# @admin-platform/config

Shared configuration for the ADMIN platform monorepo.

## What's included

### TypeScript configs (`tsconfig/`)

| File | Extends | Used by |
|------|---------|---------|
| `base.json` | — | All others extend this |
| `nextjs.json` | `base.json` | `apps/web`, `apps/admin` |
| `nestjs.json` | `base.json` | `apps/api-gateway`, all `services/*` |
| `library.json` | `base.json` | `packages/types`, `packages/events`, `packages/ui` |

### ESLint configs (`eslint/`)

| File | Extends | Used by |
|------|---------|---------|
| `base.mjs` | — | All others extend this |
| `nest.mjs` | `base.mjs` | `apps/api-gateway`, all `services/*` |
| `library.mjs` | `base.mjs` | `packages/types`, `packages/events`, `packages/ui` |

### Prettier

Prettier config is at the **monorepo root** (`.prettierrc`). All workspaces inherit it automatically
— no config file needed in individual workspaces.

## Usage

### 1. Add as workspace devDependency

In your workspace's `package.json`:

```json
{
  "devDependencies": {
    "@admin-platform/config": "workspace:*"
  }
}
```

### 2. Extend the right tsconfig

**Next.js apps** (`tsconfig.json`):
```json
{
  "extends": "@admin-platform/config/tsconfig/nextjs.json",
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**NestJS apps/services** (`tsconfig.json`):
```json
{
  "extends": "@admin-platform/config/tsconfig/nestjs.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Library packages** (`tsconfig.json`):
```json
{
  "extends": "@admin-platform/config/tsconfig/library.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 3. Import the right ESLint config

**NestJS** (`eslint.config.mjs`):
```mjs
import { nest } from '@admin-platform/config/eslint/nest.mjs';
export default [...nest];
```

**Library packages** (`eslint.config.mjs`):
```mjs
import { library } from '@admin-platform/config/eslint/library.mjs';
export default [...library];
```

**Next.js apps** (`eslint.config.mjs`):
```mjs
import { base } from '@admin-platform/config/eslint/base.mjs';
// Next.js apps also use eslint-config-next
export default [...base, /* next-specific config */];
```

## Key Rules

| Rule | Setting | Reason |
|------|---------|--------|
| `@typescript-eslint/no-explicit-any` | `error` | Required — `any` is forbidden |
| `no-console` | `warn` (base), `error` (nest) | Use Logger in services |
| `no-throw-literal` | `error` | Always throw `Error` instances |
| `prefer-const` | `error` | Immutability by default |
| `consistent-type-imports` | `error` | `import type` for type-only imports |
