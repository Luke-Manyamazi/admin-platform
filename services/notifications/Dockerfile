# =============================================================================
# @admin-platform/notifications-service — NestJS Notifications Service (port 3012)
# Build context: repo root
#   docker build -f services/notifications/Dockerfile -t notifications-service .
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

# Build only this service (Turborepo handles dependency order automatically,
# including prisma generate in the @admin-platform/database build step).
RUN pnpm run build --filter=@admin-platform/notifications-service

# Produce a self-contained production bundle at /deploy/notifications.
# pnpm deploy copies the package + its prod deps (no devDeps, no other apps).
RUN pnpm deploy --filter=@admin-platform/notifications-service --prod /deploy/notifications --legacy

# Re-run prisma generate inside the deployed bundle so the Prisma query engine
# binary is present and targeted at the correct platform (linux-musl for Alpine).
RUN cd /deploy/notifications && npx prisma generate

# ── Stage 4: runner ───────────────────────────────────────────────────────────
# Minimal production image — only the pruned bundle, no build toolchain.
FROM node:22-alpine AS runner

# Re-enable corepack so pnpm is available for potential runtime scripts.
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

# Copy the pruned production bundle produced by `pnpm deploy`.
COPY --from=builder /deploy/notifications /app

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3012

EXPOSE 3012

CMD ["node", "dist/main"]
