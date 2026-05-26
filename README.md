# ADMIN — African Distributed Manufacturing & Industrial Network

> Built by **Camluk Technologies** (South Africa)

ADMIN is a three-sided marketplace connecting global buyers to verified African factories
through an AI-powered order distribution engine. It handles order placement, intelligent
factory matching and order splitting, production monitoring, logistics coordination,
escrow payments, and trust scoring.

---

## Workspace Structure

```
admin-platform/
  apps/
    web/              → Next.js 14 — ADMIN Connect (Buyer portal)
    admin/            → Next.js 14 — Internal ops dashboard (Camluk team)
    api-gateway/      → NestJS  — Single API entry point, routes to services
  services/
    factory/          → NestJS  — Factory registry microservice
    orders/           → NestJS  — Order management microservice
    notifications/    → NestJS  — Notification microservice (AWS SES)
    payments/         → NestJS  — Payment and escrow microservice
  packages/
    database/         → Prisma schema, migrations, generated client
    types/            → Shared TypeScript interfaces and enums
    events/           → Typed AWS EventBridge event definitions
    ui/               → Shared React component library (ADMIN brand)
    config/           → Shared ESLint, TypeScript, Prettier config
  infrastructure/
    terraform/        → AWS infrastructure as code (ECS Fargate)
```

## Tech Stack

| Layer           | Technology                                         |
|-----------------|----------------------------------------------------|
| Frontend        | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend         | NestJS, TypeScript                                 |
| Database        | PostgreSQL (AWS RDS) via Prisma ORM                |
| Cache           | Redis (AWS ElastiCache)                            |
| Events          | AWS EventBridge + SQS                              |
| Auth            | Auth.js + JWT (email/password)                     |
| Payments        | Peach Payments + Flutterwave (escrow pattern)      |
| Storage         | AWS S3                                             |
| Email           | AWS SES                                            |
| AI Engine       | Cassava Technologies API                           |
| Infrastructure  | AWS ECS Fargate + Terraform                        |
| Monorepo        | Turborepo + pnpm workspaces                        |

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Docker (for local PostgreSQL + Redis)
- AWS CLI (for production deploys)

### Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Copy and configure environment variables
cp .env.example .env
# Edit .env — see comments in the file for each variable

# 3. Start local PostgreSQL + Redis (Docker)
docker-compose up -d

# 4. Generate Prisma client
pnpm db:generate

# 5. Run database migrations
pnpm db:migrate

# 6. Start all services in watch mode
pnpm dev
```

### Port Map (local development)

| Service              | Port |
|----------------------|------|
| web (buyer portal)   | 3000 |
| api-gateway (NestJS) | 3001 |
| admin (ops dashboard)| 3002 |
| factory-service      | 3010 |
| orders-service       | 3011 |
| notifications-service| 3012 |
| payments-service     | 3013 |

## Architecture Rules

These are enforced across every file in the codebase:

1. **No cross-service DB access** — services never query another service's database
2. **Event-driven only** — services communicate via EventBridge, never direct HTTP between services
3. **Single entry point** — all external requests go through `api-gateway`
4. **Trace ID on every event** — all events carry `traceOrderId` for end-to-end distributed tracing
5. **Versioned API routes** — all routes are under `/api/v1/`
6. **Repository pattern** — no Prisma calls in controllers, always through repository classes
7. **Integer money** — all monetary values stored as integers in ZAR cents, never floats
8. **Config-driven commission** — 8% commission rate comes from `COMMISSION_RATE_PERCENT` env var
9. **Structured logging** — every service writes JSON to stdout (CloudWatch picks this up)
10. **Standard response shape**:
    - Success: `{ success: true, data: {}, meta: {} }`
    - Error: `{ success: false, error: { code, message, traceId } }`

## Business Model

- Platform takes an **8%** commission on every order
- Escrow: buyer payment is held until sub-orders are confirmed delivered
- Trust Score: factories accumulate a score (0–100) based on delivery performance

---

*Proprietary — Camluk Technologies (Pty) Ltd. All rights reserved.*
