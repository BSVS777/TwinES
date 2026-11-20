# TwinES

TwinES gives each vehicle a "digital twin": an owner registers a vehicle, sees the status of its eight main parts (green, yellow, orange, red) on a rotating 3D model or a 2D diagram, and gets the next recommended maintenance. Technicians look a vehicle up by plate and record serviced parts.

This repository holds the TwinES MVP. It is intentionally partial: AI predictions, guided repairs and the parts catalog are future work. Maintenance intervals are generic estimates, not manufacturer data.

## Stack

- TypeScript, Next.js 16 (App Router) and React 19
- Prisma 7 with SQLite (better-sqlite3 adapter)
- three.js with react-three-fiber for the 3D view, and an accessible 2D fallback
- Vitest and React Testing Library for unit, integration and component tests
- Playwright (Chromium) for end-to-end tests

## Prerequisites

- Node.js 20.9 or later (the project is developed on Node 24) and npm
- For the end-to-end tests, a Chromium build for Playwright: `npx playwright install chromium` (once)

## Setup

All commands run from the `twines/` folder.

```bash
cd twines
npm ci
```

Create `twines/.env` (it is git-ignored) with:

```bash
# SQLite file for development
DATABASE_URL="file:./dev.db"
# Passwords of the demo accounts created by the seed: 8 characters or more, at most 72 bytes.
# Choose your own; no password is stored in the repository.
SEED_TECH_PASSWORD="<technician password>"
SEED_OWNER_PASSWORD="<owner password>"
# Optional: the public origin of the app when it runs behind a TLS-terminating proxy.
# Mutating requests must come from this origin (CSRF defense). Defaults to the request origin.
APP_ORIGIN="http://localhost:3000"
```

Create the database, load the demo data and start the app:

```bash
npm run db:migrate   # creates dev.db and applies the migrations
npm run db:seed      # demo accounts and vehicles; safe to run again
npm run dev          # http://localhost:3000
```

The seed measures every service baseline back from today, so each status (green, yellow, orange, red and an overdue next maintenance) is on show whatever day you run it. Running it again rebuilds the demo vehicles and keeps the accounts.

## Demo accounts

Passwords are the ones you set in `.env`.

| Email | Role | Notes |
|-------|------|-------|
| `owner.one@twines.test` | owner | Five vehicles: `TWN-GRN` (sedan, all green), `TWN-YLW` (hatchback, yellow), `TWN-ORG` (SUV, orange), `TWN-RED` (pickup, red) and `TWN-OVR` (sedan, battery overdue) |
| `owner.two@twines.test` | owner | One vehicle, `TWN-OTH`, to try the ownership isolation |
| `tech@twines.test` | technician | Searches any vehicle by plate and marks parts as serviced; lands on `/technician` |

New owners can also sign up from the sign-in page. Technician accounts are never self-service.

## Scripts and tests

| Command | What it does |
|---------|--------------|
| `npm test` | Vitest: unit, integration (SQLite) and component tests |
| `npm run test:coverage` | The same with coverage; `src/domain` and `src/application` must stay above the 80% thresholds |
| `npm run test:e2e` | Playwright end-to-end suite (see below) |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check |
| `npm run build` | Production build |

The end-to-end suite builds the app, starts it with `next start` on port 3200 (set `E2E_PORT` to use another) and a dedicated `e2e.db` that is deleted, migrated and seeded on every run with random passwords that exist only for that run. It never touches `dev.db`. If a server is already listening on the port the run stops instead of reusing it.

Every scenario of the specifications is mapped to its tests in [docs/testing/traceability.md](docs/testing/traceability.md). The checks that need a human (3D appearance, motion, WebGL off) are in [docs/testing/manual-tests.md](docs/testing/manual-tests.md).

## Repository layout

| Path | Content |
|------|---------|
| `docs/business-briefs/` | Business brief for the idea |
| `docs/reports/` | Business validation report (market, competitors, financials, risks) |
| `docs/testing/` | Test traceability matrix and the manual test checklist |
| `openspec/` | Spec-driven development artifacts (proposal, specs, design, tasks) |
| `twines/src/domain/` | Pure rules: calendar math, part catalog, health status, maintenance schedule |
| `twines/src/application/` | Use cases, validation and ports (no framework imports) |
| `twines/src/infrastructure/` | Prisma repositories, sessions, password hashing, HTTP handlers |
| `twines/src/app/` and `twines/src/components/` | Next.js pages, API routes and React components |
| `twines/prisma/` | Schema, migrations and the seed |
| `twines/tests/` | `unit/`, `integration/`, `component/` (Vitest) and `e2e/` (Playwright) |

## Status

The MVP scope in `openspec/changes/twines-mvp/proposal.md` is implemented: authentication with owner and technician roles, vehicle registry with per-part baselines, health and next-maintenance estimates, the 3D and 2D health views, and the technician flow.
