# Ledgerly Accounting SaaS

Production-grade accounting and expense tracking SaaS for freelancers, consultants, agencies, and small businesses.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS
- Prisma ORM with PostgreSQL
- JWT session cookie auth with RBAC: `ADMIN`, `ACCOUNTANT`, `VIEWER`
- Recharts dashboard analytics
- PDF and Excel report exports
- Nodemailer report emailing
- Docker Compose PostgreSQL

## Quick Start

```bash
cp .env.example .env
docker compose up -d
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

Seed login:

```text
admin@ledgerly.test
AdminPass123
```

## Architecture

- `app` contains pages and API routes.
- `modules` contains feature-level UI and validation.
- `services` contains domain logic for accounting, reports, exports, email, dashboard analytics, and audit.
- `lib` contains auth, Prisma, env validation, API wrappers, and formatting.
- `prisma` contains the schema and seed data.
- `docs/openapi.yaml` documents the REST API.

## Accounting Model

Receipts and expenses post immutable `JournalEntry` records with balanced `LedgerEntry` rows. Money uses `Decimal(18,2)` and exchange rates use `Decimal(18,6)`. Reports are generated from ledger entries, not ad hoc transaction totals.

## Security

- Passwords are hashed with bcrypt.
- JWTs are signed with `JWT_SECRET` and stored in `httpOnly`, `sameSite=lax` cookies.
- RBAC guards protect API routes.
- Zod validates request bodies.
- Prisma parameterization prevents SQL injection.
- Basic in-memory rate limiting protects API routes.
- Soft deletes and audit logs preserve history.
- Uploads validate MIME type, size, and unique file names.

## Deployment

Set the variables from `.env.example` in Vercel, Render, or AWS. For Vercel, use a managed PostgreSQL database and run:

```bash
npm run prisma:generate
npm run build
```

Run migrations during release:

```bash
npx prisma migrate deploy
```

For Render or AWS, build the Docker image and attach a PostgreSQL instance. Configure SMTP variables for report emailing.
