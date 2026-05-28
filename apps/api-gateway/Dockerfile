# =============================================================================
# @admin-platform/api-gateway — NestJS API Gateway (port 3001)
# Build context: repo root
#   docker build -f apps/api-gateway/Dockerfile -t api-gateway .
# =============================================================================

# ── Stage 1: base ─────────────────────────────────────────────────────────────
# Shared foundation: Node 20 Alpine + pnpm 11.3.0
FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

WORKDIR /workspace

# ── Stage 2: deps ─────────────────────────────────────────────────────────────
# Install ALL workspace dependencies (frozen for reproducibility).
FROM base AS deps

# Copy the entire monorepo so pnpm can resolve workspace: references.
COPY . .

RUN pnpm install --frozen-lockfile

# ── Stage 3: builder ──────────────────────────────────────────────────────────
# Compile the service and create a pruned production deployment folder.
FROM deps AS builder

# Build only this service (Turborepo handles dependency order automatically).
RUN pnpm run build --filter=@admin-platform/api-gateway

# Produce a self-contained production bundle at /deploy/api-gateway.
# pnpm deploy copies the package + its prod deps (no devDeps, no other apps).
RUN pnpm deploy --filter=@admin-platform/api-gateway --prod /deploy/api-gateway --legacy

# ── Stage 4: runner ───────────────────────────────────────────────────────────
# Minimal production image — only the pruned bundle, no build toolchain.
FROM node:22-alpine AS runner

# Re-enable corepack so pnpm is available for potential runtime scripts.
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

# Copy the pruned production bundle produced by `pnpm deploy`.
COPY --from=builder /deploy/api-gateway /app

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3001

EXPOSE 3001

CMD ["node", "dist/main"]
