# Tasks: TwinES MVP — vehicle health core with authentication

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~4,500-5,000 authored lines including tests (lockfile, Prisma migrations SQL and other generated files excluded) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → … → PR 12 (one work unit each, see table) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
PR 5c merged with maintainer-approved size:exception (533 lines, 77% tests).
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

Conventions for every work unit:

- Branch `feat/twines-mvp-NN-<slug>` from the latest `main`; PR targets `main`; merge in order (stacked-to-main).
- Strict TDD: write the failing test first (RED), make it pass (GREEN), then refactor; record RED/GREEN evidence in the PR description.
- Commands run from `twines/`. Conventional Commit messages. No course or university references in code, commits or PRs.
- Each scenario ID covered by a unit is listed in the PR description.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Scaffold app and test tooling | PR 1 | `npm test` (sample test) and `npm run build` | `npm run dev` serves the placeholder home page | `twines/` config files only |
| 2 | Calendar math, catalog, part health (HLT-01..10) | PR 2 | `npx vitest run tests/unit/domain/part-health tests/unit/domain/shared` | N/A — pure domain library, exercised by unit tests | `src/domain/shared`, `src/domain/part-health` |
| 3 | Maintenance schedule (MNT-01..08) | PR 3 | `npx vitest run tests/unit/domain/maintenance` | N/A — pure domain library | `src/domain/maintenance` |
| 4 | Persistence: Prisma schema, repositories | PR 4 | `npx vitest run tests/integration` | `npx prisma migrate dev` creates `dev.db` | `prisma/`, `src/infrastructure/repositories`, `src/infrastructure/db.ts` |
| 5 | Auth use cases, hashing, sessions, throttling | PR 5 | `npx vitest run tests/unit/application/auth` | N/A — exercised through fakes; HTTP comes in PR 6 | `src/application/auth`, ports, errors, auth adapters |
| 6 | Auth HTTP, pages, middleware | PR 6 | `npx vitest run tests/unit/infrastructure/http` + manual sign-up/sign-in | `npm run dev`: sign up, sign in, sign out in the browser | `src/app/(auth)`, `src/app/api/auth`, `src/middleware.ts`, `src/infrastructure/http` |
| 7 | Vehicle use cases and validation | PR 7 | `npx vitest run tests/unit/application/vehicles tests/unit/application/validation` | N/A — exercised through fakes | `src/application/vehicles`, `src/application/validation/vehicle*` |
| 8 | Vehicle API and owner pages | PR 8 | `npx vitest run tests/component/forms` + manual CRUD | `npm run dev`: register, edit, delete a vehicle | `src/app/vehicles` (except `[id]` health), `src/app/api/vehicles`, `src/components/forms/vehicle*` |
| 9 | Health view: summary, list, panel, 2D diagram | PR 9 | `npx vitest run tests/component/vehicle-health` | `npm run dev`: open a vehicle page | `src/components/vehicle-health` (non-3D), `src/app/vehicles/[id]/page.tsx` |
| 10 | 3D model with hotspots | PR 10 | `npx vitest run tests/component/vehicle-health/vehicle-3d` | `npm run dev`: 3D model rotates, hotspots clickable | `Vehicle3D.tsx`, `models/`, `useWebGLSupport.ts` |
| 11 | Technician flow | PR 11 | `npx vitest run tests/unit/application/technician` | `npm run dev` as technician: search plate, mark serviced | `src/application/technician`, `src/app/technician`, `src/app/api/technician` |
| 12 | Seed data and E2E suite | PR 12 | `npm run test:e2e` | Playwright against `next start` with `e2e.db` and fixed date | `prisma/seed.ts`, `tests/e2e`, `playwright.config.ts` |

## Phase 1: Foundation (PR 1)

- [x] 1.1 Create `twines/` with Next.js 16 (App Router, TypeScript strict, ESLint, `src/` dir); pin exact dependency versions in `twines/package.json`
- [x] 1.2 Add `twines/vitest.config.ts` (node + jsdom projects, v8 coverage, thresholds 80% for `src/domain` and `src/application`) and a sample test proving the runner works
- [x] 1.3 Add `twines/playwright.config.ts` (Chromium, `webServer` running `next start`) without tests yet
- [x] 1.4 Add scripts `test`, `test:coverage`, `test:e2e`, `db:migrate`, `db:seed`, `lint`, `build` to `twines/package.json`
- [x] 1.5 Create `.gitattributes` (LF normalization) and `twines/.env.example` (`DATABASE_URL`, `SEED_TECH_PASSWORD`, `TWINES_FIXED_TODAY`)
- [x] 1.6 Update `openspec/config.yaml` `apply.test_command` and `verify.test_command`/`build_command` with the real commands

## Phase 2: Domain rules (PR 2, PR 3)

- [x] 2.1 RED: `twines/tests/unit/domain/shared/calendar-date.test.ts` — parse/validate `YYYY-MM-DD`, `addDays` across month/year ends, `daysBetween`
- [x] 2.2 GREEN: `twines/src/domain/shared/calendar-date.ts`
- [x] 2.3 RED: `twines/tests/unit/domain/part-health/catalog.test.ts` — exactly 8 parts with spec intervals (HLT-01)
- [x] 2.4 GREEN: `twines/src/domain/part-health/catalog.ts`
- [x] 2.5 RED: `twines/tests/unit/domain/part-health/status.test.ts` — boundary table 0.4999/0.50/0.7499/0.75/0.9999/1.00/2.5 (HLT-06) and worst status (HLT-09)
- [x] 2.6 GREEN: `twines/src/domain/part-health/status.ts`
- [x] 2.7 RED: `twines/tests/unit/domain/part-health/rule-based-estimator.test.ts` — km dominates, time dominates, time-only battery, just serviced, remaining and overdue values (HLT-02..05, HLT-07, HLT-08)
- [x] 2.8 GREEN: `twines/src/domain/part-health/health-estimator.ts` (port + types) and `twines/src/domain/part-health/rule-based-estimator.ts`; export a default estimator factory (HLT-10)
- [x] 2.9 RED: `twines/tests/unit/domain/maintenance/schedule.test.ts` — due mileage/dates (MNT-01), zero monthly mileage (MNT-02), time-only (MNT-03), overdue by km and date (MNT-04/05), next maintenance grouping and estimated km (MNT-06), overdue visit (MNT-07), recompute after new baseline (MNT-08)
- [x] 2.10 GREEN: `twines/src/domain/maintenance/schedule.ts` (`computePartDues`, `computeNextMaintenance`)
- [x] 2.11 REFACTOR: confirm `src/domain` has no framework imports; coverage for `src/domain` ≥ 95%

## Phase 3: Persistence and authentication (PR 4, PR 5, PR 6)

- [x] 3.1 Verify Prisma 7.10.x SQLite setup in the official docs; create `twines/prisma/schema.prisma` (User, Session, LoginThrottle, Vehicle, PartBaseline) and `twines/prisma.config.ts`; run the first migration
- [x] 3.2 Create `twines/src/application/ports.ts` and `twines/src/application/errors.ts`
- [x] 3.3 RED: `twines/tests/integration/repositories.test.ts` — unique email/plate raise `Conflict`, `findByIdForOwner` misses other owners, cascade delete of baselines, session lookup by token hash
- [x] 3.4 GREEN: `twines/src/infrastructure/db.ts` and `twines/src/infrastructure/repositories/{user,session,login-throttle,vehicle}-repository.ts`
- [x] 3.5 RED: `twines/tests/unit/application/auth/sign-up.test.ts` — lowercase email, duplicate (AUTH-02), weak password (AUTH-03), invalid email (AUTH-04), hashed password (AUTH-05), role forced to owner (AUTH-06)
- [x] 3.6 GREEN: `twines/src/application/validation/auth.ts`, `twines/src/application/auth/sign-up.ts`, `twines/src/infrastructure/auth/bcrypt-hasher.ts`
- [x] 3.7 RED: `twines/tests/unit/application/auth/sign-in.test.ts` — success (AUTH-07), identical message for wrong password and unknown email (AUTH-08), lockout after 5 failures including unknown emails (AUTH-10), expiry and counter reset (AUTH-11), sign-out deletes session (AUTH-12)
- [x] 3.8 GREEN: `twines/src/application/auth/{sign-in,sign-out,get-current-user}.ts`, `twines/src/infrastructure/auth/{session-token,clock}.ts` (cookie helpers are added with the HTTP routes; Clock honors `TWINES_FIXED_TODAY` only outside production)
- [x] 3.9 RED: `twines/tests/unit/infrastructure/http/handle.test.ts` — error → status mapping (400/401/403/404/409/429) and Origin check rejects missing or foreign origins
- [x] 3.10 GREEN: `twines/src/infrastructure/http/{handle,origin-check}.ts`
- [x] 3.11 Create `twines/src/app/api/auth/{sign-up,sign-in,sign-out}/route.ts` with httpOnly SameSite=Lax cookie (AUTH-09); the request handlers live in `twines/src/infrastructure/http/auth-handlers.ts` (a route module may only export HTTP methods), the cookie helpers in `twines/src/infrastructure/auth/session-cookie.ts` and the composition root in `twines/src/infrastructure/container.ts`
- [ ] 3.12 Create `twines/src/app/(auth)/sign-up/page.tsx`, `twines/src/app/(auth)/sign-in/page.tsx`, `twines/src/components/forms/{sign-up-form,sign-in-form}.tsx`
- [ ] 3.13 Create `twines/src/middleware.ts` redirecting anonymous page requests to sign-in (AUTH-13) and an authenticated layout with sign-out
- [x] 3.14 Security hardening of the authentication use cases (from the independent verification of PR 5):
  - W1 atomic lockout: `LoginThrottleStore.recordFailure(email, now)` increments and locks in one atomic operation; sign-in uses it; integration test with 10 concurrent failures ends at `failedCount` 10
  - W2 `PublicUser { id, email, role }` is what `signUp`, `signIn` and `getCurrentUser` return; no `passwordHash` leaves the application layer
  - S1 sign-in passwords over 72 UTF-8 bytes fail as the generic `Unauthorized` and are counted by the throttle without calling bcrypt
  - S2 `TWINES_FIXED_TODAY` is honored only when `NODE_ENV` is exactly `development` or `test`
  - S5 `real-adapters.test.ts` asserts `getRounds(DUMMY_PASSWORD_HASH) === 12`

## Phase 4: Vehicle registry (PR 7, PR 8)

- [ ] 4.1 RED: `twines/tests/unit/application/validation/vehicle.test.ts` — every field boundary of VEH-03, plate normalization, default monthly mileage (VEH-04), baseline rules (VEH-07)
- [ ] 4.2 GREEN: `twines/src/application/validation/vehicle.ts`
- [ ] 4.3 RED: `twines/tests/unit/application/vehicles/*.test.ts` — register with default baselines (VEH-01, VEH-05), duplicate plate (VEH-02), set baseline (VEH-06), list own only (VEH-08), mileage never decreases (VEH-09), delete removes baselines (VEH-10), cross-owner read/edit/delete → NotFound (VEH-12/13), get health composes estimator + schedule
- [ ] 4.4 GREEN: `twines/src/application/vehicles/{register-vehicle,list-vehicles,get-vehicle-health,update-vehicle,delete-vehicle,set-baseline}.ts`
- [ ] 4.5 Create `twines/src/app/api/vehicles/route.ts`, `twines/src/app/api/vehicles/[id]/route.ts`, `twines/src/app/api/vehicles/[id]/baselines/route.ts` (401 when anonymous: AUTH-14)
- [ ] 4.6 RED: `twines/tests/component/forms/vehicle-form.test.tsx` — field errors render per field, submit payload shape
- [ ] 4.7 GREEN: `twines/src/components/forms/{vehicle-form,baseline-form}.tsx`
- [ ] 4.8 Create `twines/src/app/vehicles/page.tsx` (list + empty state VEH-11), `twines/src/app/vehicles/new/page.tsx`, `twines/src/app/vehicles/[id]/edit/page.tsx` with delete confirmation

## Phase 5: Health view (PR 9, PR 10)

- [ ] 5.1 RED: `twines/tests/component/vehicle-health/part-list.test.tsx` — 8 items with name, text status, usage % (VIEW-02)
- [ ] 5.2 GREEN: `twines/src/components/vehicle-health/PartList.tsx` and `HealthSummary.tsx` (details, overall status, next maintenance, generic-intervals notice: VIEW-01)
- [ ] 5.3 RED: `twines/tests/component/vehicle-health/part-detail-panel.test.tsx` — shows status, %, remaining km/days, due date; "Mark as serviced" only for technicians (VIEW-08/09)
- [ ] 5.4 GREEN: `twines/src/components/vehicle-health/PartDetailPanel.tsx`
- [ ] 5.5 RED: `twines/tests/component/vehicle-health/diagram-2d.test.tsx` — 8 zones colored by status, click selects part, list/selection sync (VIEW-05, VIEW-06)
- [ ] 5.6 GREEN: `twines/src/components/vehicle-health/{VehicleDiagram2D,VehicleHealthView,useWebGLSupport}.tsx`; wire `twines/src/app/vehicles/[id]/page.tsx`
- [ ] 5.7 RED: `twines/tests/component/vehicle-health/vehicle-3d.test.tsx` — model chosen by body type (VIEW-03), hotspot buttons have accessible labels, auto-rotate off under reduced motion and when a part is selected (VIEW-07)
- [ ] 5.8 GREEN: `twines/src/components/vehicle-health/Vehicle3D.tsx` and `twines/src/components/vehicle-health/models/{sedan,hatchback,suv,pickup}.ts`, loaded via `next/dynamic` with `ssr: false`

## Phase 6: Technician flow, seed and end-to-end (PR 11, PR 12)

- [ ] 6.1 RED: `twines/tests/unit/application/technician/*.test.ts` — find by plate case-insensitive (VEH-14), not found (VEH-15), record service updates mileage and baseline and returns green (VEH-16, MNT-08), mileage cannot decrease, owner → Forbidden (AUTH-15), technician edit/delete → Forbidden (VEH-17)
- [ ] 6.2 GREEN: `twines/src/application/technician/{find-vehicle-by-plate,record-service}.ts`
- [ ] 6.3 Create `twines/src/app/api/technician/vehicles/route.ts`, `twines/src/app/api/technician/vehicles/[id]/service/route.ts`, `twines/src/app/technician/page.tsx`; connect the panel action
- [ ] 6.4 Create `twines/prisma/seed.ts` (technician, two owners, vehicles covering green/yellow/orange/red and overdue)
- [ ] 6.5 Create `twines/tests/e2e/auth.spec.ts` — sign-up, sign-in, generic error, lockout, sign-out invalidation, anonymous redirect (AUTH-01, 07, 08, 10, 12, 13)
- [ ] 6.6 Create `twines/tests/e2e/vehicles.spec.ts` — register, validation errors, edit, mileage rollback, delete, empty state (VEH-01..04, 08..11)
- [ ] 6.7 Create `twines/tests/e2e/health-view.spec.ts` — summary, list, hotspot click and panel, 2D fallback with WebGL disabled (VIEW-01..06)
- [ ] 6.8 Create `twines/tests/e2e/technician.spec.ts` — plate search, not found, mark serviced turns part green, owner sees no action (VEH-14..16, VIEW-08/09)
- [ ] 6.9 Create `twines/tests/e2e/api-security.spec.ts` — 401 anonymous (AUTH-14), 403 owner on technician endpoints (AUTH-15), 404 cross-owner (VEH-12/13), 403 technician edit/delete (VEH-17), 403 foreign Origin, cookie flags (AUTH-09)

## Phase 7: Documentation and traceability (PR 12)

- [ ] 7.1 Update root `README.md` with setup (`npm ci`, migrate, seed), scripts and test commands
- [ ] 7.2 Create `docs/testing/traceability.md` mapping every scenario ID to its test file and test name (manual tests for VIEW-03 visual check and VIEW-07 listed explicitly)
