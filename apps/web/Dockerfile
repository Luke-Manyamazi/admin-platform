# =============================================================================
# @admin-platform/web — Next.js 14 Buyer Portal (port 3000)
# Build context: repo root
#   docker build -f apps/web/Dockerfile -t web .
#
# NOTE: next.config.mjs does NOT set output: "standalone".
# The runner stage therefore inherits the full builder (with node_modules)
# so that `next start` can resolve its dependencies at runtime.
# =============================================================================

# ── Stage 1: base ─────────────────────────────────────────────────────────────
# Shared foundation: Node 20 Alpine + pnpm 11.3.0
FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

WORKDIR /workspace

# ── Stage 2: deps ─────────────────────────────────────────────────────────────
# Install ALL workspace dependencies (frozen for reproducibility).
FROM base AS deps

# Copy the entire monorepo so pnpm can resolve workspace: references,
# including @admin-platform/ui and @admin-platform/types.
COPY . .

RUN pnpm install --frozen-lockfile

# ── Stage 3: builder ──────────────────────────────────────────────────────────
# Compile the Next.js app.  The built .next directory is written inside
# the monorepo tree at /workspace/apps/web/.next.
FROM deps AS builder

# Disable Next.js telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

# Build only this app (Turborepo resolves the ^build dependencies first,
# e.g. @admin-platform/ui and @admin-platform/types).
RUN pnpm run build --filter=@admin-platform/web

# ── Stage 4: runner ───────────────────────────────────────────────────────────
# Re-use the builder image as the runner — node_modules are required at runtime
# when not using standalone output mode.
FROM builder AS runner

ENV NODE_ENV=production \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /workspace/apps/web

EXPOSE 3000

# `pnpm start` in apps/web resolves to `next start --port 3000` (see package.json).
CMD ["node_modules/.bin/next", "start", "--port", "3000"]
