# =============================================================================
# @admin-platform/admin — Next.js 14 Internal Operations Dashboard (port 3002)
# Build context: repo root
#   docker build -f apps/admin/Dockerfile -t admin .
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
# the monorepo tree at /workspace/apps/admin/.next.
FROM deps AS builder

# NEXT_PUBLIC_* vars are embedded by `next build` at compile time.
# Pass via: docker build --build-arg NEXT_PUBLIC_API_URL=https://api.example.com
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_TELEMETRY_DISABLED=1

# Build only this app (Turborepo resolves the ^build dependencies first,
# e.g. @admin-platform/ui and @admin-platform/types).
RUN pnpm run build --filter=@admin-platform/admin

# ── Stage 4: runner ───────────────────────────────────────────────────────────
# Re-use the builder image as the runner — node_modules are required at runtime
# when not using standalone output mode.
FROM builder AS runner

ENV NODE_ENV=production \
    PORT=3002 \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /workspace/apps/admin

EXPOSE 3002

# `pnpm start` in apps/admin resolves to `next start --port 3002` (see package.json).
CMD ["node_modules/.bin/next", "start", "--port", "3002"]
