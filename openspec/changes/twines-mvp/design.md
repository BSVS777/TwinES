# Design: TwinES MVP — vehicle health core with authentication

## Technical Approach

A single Next.js application in `twines/`, organized as a small hexagonal architecture so the parts that carry the business rules are framework-free and testable first:

- **Domain** (`src/domain`): pure TypeScript — maintenance catalog, health estimator, maintenance schedule, calendar-date math. No I/O, no framework imports, clock passed in. Implements `part-health` and `maintenance-schedule` specs.
- **Application** (`src/application`): use cases (sign-up, sign-in, register vehicle, mark serviced, ...) that enforce validation and authorization and talk to ports (repositories, password hasher, clock, session store). Implements the rules of `user-auth` and `vehicle-registry`.
- **Infrastructure** (`src/infrastructure`): Prisma repositories, bcrypt hasher, session cookie handling.
- **Delivery** (`src/app`, `src/components`): Next.js pages (server components read through use cases), REST route handlers under `/api` for every mutation, and client components for forms and the health view (`vehicle-health-view` spec).

Every scenario ID in the specs (AUTH, VEH, HLT, MNT, VIEW) maps to at least one automated test or, for visual-only behavior, a documented manual/usability test.

## Architecture Decisions

### Decision: Pin stable versions at scaffold time

**Choice**: Node 24 (installed), Next.js 16.x, React (version bundled with Next), TypeScript strict, Prisma ORM **7.10.x** with SQLite, Vitest 5.x, @playwright/test 1.65.x, three 0.187.x + @react-three/fiber 9.x + @react-three/drei 10.x, zod 4.x, bcryptjs 3.x. Exact versions pinned in `package.json` (no `^`).
**Alternatives considered**: Prisma `latest` dist-tag (currently an 8.0 release candidate); Drizzle ORM.
**Rationale**: The `latest` Prisma tag points to a release candidate on 2026-11-19, so the previous stable line (7.10.x) is pinned. Prisma was chosen in the proposal; its 7.x SQLite setup (driver adapter and config file) is verified against the official docs during scaffolding, not assumed here. Pinning avoids drift during the testing cycle, which matters for reproducible regression runs.

### Decision: Hexagonal layering with ports

**Choice**: `domain` ← `application` ← `infrastructure`/`app`. Application depends only on port interfaces (`VehicleRepository`, `UserRepository`, `SessionStore`, `LoginThrottleStore`, `PasswordHasher`, `Clock`).
**Alternatives considered**: Logic inside route handlers and server actions; a service layer calling Prisma directly.
**Rationale**: Unit tests (Strict TDD) run against in-memory fakes in milliseconds and cover authorization rules without a database or HTTP. It also leaves the `HealthEstimator` port ready for a future AI estimator (HLT-10).

### Decision: Custom database sessions instead of an auth framework

**Choice**: Email/password with bcryptjs (cost 12); sessions are random 32-byte tokens, stored in the cookie and saved in the database only as a SHA-256 hash; cookie `twines_session`, httpOnly, SameSite=Lax, Secure in production, 7-day expiry. Sign-out deletes the session row.
**Alternatives considered**: Auth.js credentials provider (JWT sessions cannot be revoked server-side, conflicts with AUTH-12, and its credentials flow is discouraged); Better Auth (capable, but adds a large surface to learn and test in 16 days).
**Rationale**: The specs need server-side revocation (AUTH-12), per-email lockout (AUTH-10/11) and a fixed role model; a ~150-line, fully unit-tested implementation is easier to explain and to security-test than a framework's internals. bcryptjs is pure JavaScript, which avoids native build problems on Windows.

### Decision: Login throttling keyed by email, independent of account existence

**Choice**: `LoginThrottle` table keyed by normalized email (`failedCount`, `lockedUntil`), updated on every failed attempt, even for unknown emails.
**Alternatives considered**: Counters on the `User` row.
**Rationale**: If only existing users could be locked, the lockout message would reveal which emails have accounts (user enumeration). Keying by email keeps AUTH-08's generic message honest.

### Decision: REST route handlers for all mutations; server components for reads

**Choice**: All writes go through `/api/...` route handlers that call use cases and return JSON with explicit status codes (400/401/403/404/409). Pages are server components that call the same use cases for reads. Client forms submit with `fetch`.
**Alternatives considered**: Server Actions for forms.
**Rationale**: Explicit HTTP endpoints and status codes are what the security and functional tests need (AUTH-14, VEH-12/13/17): they can be exercised with Playwright's `request` API, curl or a proxy scanner. Server Actions hide the transport and make 401/403/404 assertions awkward.

### Decision: CSRF defense by Origin check

**Choice**: Mutating route handlers reject requests whose `Origin` header is missing or different from the app origin (403), in addition to SameSite=Lax cookies.
**Alternatives considered**: Synchronizer tokens.
**Rationale**: Cheap, effective for a same-origin JSON API, and gives the security tests a concrete control to verify.

### Decision: Ownership violations return 404

**Choice**: Use cases load vehicles with `findByIdForOwner(id, ownerId)`; a miss returns `NotFound` whether the vehicle does not exist or belongs to someone else. Technician-only use cases check the role first and return `Forbidden` (403).
**Rationale**: Implements VEH-12/13 without disclosing vehicle existence; one code path to test.

### Decision: Calendar dates as `YYYY-MM-DD` strings, clock in Costa Rica time

**Choice**: Purchase and baseline dates are stored and handled as ISO calendar dates (no time). `Clock.today()` returns the current date in `America/Costa_Rica`. Date math (`addDays`, `daysBetween`) is done in pure domain utilities using UTC midnight.
**Alternatives considered**: JavaScript `Date` objects with times.
**Rationale**: Removes timezone and daylight-saving bugs from the core rules (Costa Rica has no DST, but the test machine and CI might be UTC) and makes MNT-01-style examples exact.

### Decision: Validation with zod schemas shared by client and server

**Choice**: One zod schema per input (`signUpSchema`, `vehicleSchema`, `baselineSchema`, `serviceRecordSchema`) in `src/application/validation`; the server always re-validates.
**Rationale**: Same rules and messages in the form and the API; schemas are unit-testable for VEH-03 boundary values.

### Decision: 3D model from primitives with HTML hotspots

**Choice**: `@react-three/fiber` scene per body type built from boxes/cylinders (body, cabin, wheels). Each of the 8 parts is a colored hotspot mesh at a fixed position (engine bay for fluids, filters, plugs and battery; wheels for tires and brake pads) with a drei `<Html>` label rendered as a real `<button aria-label="Brake pads: Orange">`. Loaded with `next/dynamic` (`ssr: false`). Auto-rotation uses `OrbitControls` `autoRotate`, disabled when `prefers-reduced-motion` matches or a part is selected.
**Alternatives considered**: Licensed glTF car models; clicking raw canvas coordinates.
**Rationale**: No asset licensing or segmentation work. The HTML buttons make 3D zones clickable for keyboard users, screen readers and Playwright (VIEW-04/05), avoiding flaky canvas-coordinate clicks.

### Decision: WebGL detection and 2D fallback

**Choice**: A `useWebGLSupport()` hook tries to create a WebGL context; if it fails, `VehicleDiagram2D` (inline SVG, 8 clickable zones) renders instead. The parts list and detail panel are shared by both views.
**Rationale**: Satisfies VIEW-06 and gives a lightweight path for tests and low-end devices; also the rollback path if 3D slips.

### Decision: Seeded, deterministic test data

**Choice**: `prisma/seed.ts` creates one technician (`tech@twines.test`, password from `SEED_TECH_PASSWORD`), two owners and vehicles covering every status color and an overdue case. E2E runs use a separate SQLite file (`DATABASE_URL=file:./e2e.db`) reset before each run, and a fixed clock injected through `TWINES_FIXED_TODAY` (honored only when `NODE_ENV !== "production"`).
**Rationale**: Color statuses depend on "today"; a fixed date keeps regression runs reproducible.

## Data Flow

Vehicle page (owner):

    Browser ──GET /vehicles/[id]──→ Page (server component)
                                       │ getSession(cookie) → SessionStore (Prisma)
                                       │ GetVehicleHealth use case
                                       │   ├─ VehicleRepository.findByIdForOwner
                                       │   ├─ HealthEstimator.estimate(vehicle, baselines, today)
                                       │   └─ MaintenanceSchedule.next(...)
                                       ▼
                               VehicleHealthView (client)
                               ├─ PartList (source of truth)
                               ├─ Vehicle3D | VehicleDiagram2D
                               └─ PartDetailPanel

Technician marks a part serviced:

    PartDetailPanel ──POST /api/technician/vehicles/[id]/service──→ Route handler
         (Origin check, session, role=technician)                    │
                                                                     ▼
                                     RecordService use case → validate (zod)
                                     → update mileage (never lower) → upsert baseline(km, today)
                                     → return recomputed health ──→ panel refreshes

Sign-in:

    POST /api/auth/sign-in → SignIn use case
       → LoginThrottle.check(email) ── locked? → 429 "Too many attempts"
       → UserRepository.findByEmail → PasswordHasher.verify
       → fail: throttle.registerFailure(email) → 401 "Invalid email or password"
       → ok:   throttle.reset(email) → SessionStore.create → Set-Cookie

## File Changes

All paths are new (greenfield) under `twines/` unless noted.

| File | Action | Description |
|------|--------|-------------|
| `twines/package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs` | Create | App and tooling configuration with pinned versions |
| `twines/vitest.config.ts`, `twines/playwright.config.ts` | Create | Unit/component (jsdom) and E2E runners, coverage thresholds |
| `twines/prisma/schema.prisma`, `twines/prisma.config.ts` | Create | Data model and Prisma config |
| `twines/prisma/seed.ts` | Create | Deterministic seed (technician, owners, vehicles in every status) |
| `twines/.env.example` | Create | `DATABASE_URL`, `SEED_TECH_PASSWORD`, `TWINES_FIXED_TODAY` |
| `twines/src/domain/shared/calendar-date.ts` | Create | `CalendarDate` type, `addDays`, `daysBetween`, parsing |
| `twines/src/domain/part-health/catalog.ts` | Create | The 8 parts and intervals (HLT-01) |
| `twines/src/domain/part-health/status.ts` | Create | Ratio → color mapping, worst status (HLT-06, HLT-09) |
| `twines/src/domain/part-health/health-estimator.ts` | Create | `HealthEstimator` port and types (HLT-10) |
| `twines/src/domain/part-health/rule-based-estimator.ts` | Create | Usage ratio and remaining life (HLT-02..08) |
| `twines/src/domain/maintenance/schedule.ts` | Create | Due dates, overdue, next maintenance grouping (MNT-01..08) |
| `twines/src/application/ports.ts` | Create | Repository, hasher, clock, session and throttle ports |
| `twines/src/application/errors.ts` | Create | `ValidationError`, `Unauthorized`, `Forbidden`, `NotFound`, `Conflict`, `TooManyAttempts` |
| `twines/src/application/validation/*.ts` | Create | zod schemas |
| `twines/src/application/auth/*.ts` | Create | `signUp`, `signIn`, `signOut`, `getCurrentUser` use cases |
| `twines/src/application/vehicles/*.ts` | Create | Register, list, get health, update, delete, set baseline |
| `twines/src/application/technician/*.ts` | Create | Find by plate, record service |
| `twines/src/infrastructure/db.ts` | Create | Prisma client singleton |
| `twines/src/infrastructure/repositories/*.ts` | Create | Prisma implementations of the ports |
| `twines/src/infrastructure/auth/{bcrypt-hasher,session-cookie,clock}.ts` | Create | Adapters |
| `twines/src/infrastructure/http/{handle,origin-check}.ts` | Create | Maps application errors to HTTP status codes; CSRF Origin check |
| `twines/src/app/(auth)/sign-in/page.tsx`, `sign-up/page.tsx` | Create | Auth pages |
| `twines/src/app/vehicles/page.tsx`, `new/page.tsx`, `[id]/page.tsx`, `[id]/edit/page.tsx` | Create | Owner pages |
| `twines/src/app/technician/page.tsx` | Create | Plate search |
| `twines/src/app/api/auth/{sign-up,sign-in,sign-out}/route.ts` | Create | Auth endpoints |
| `twines/src/app/api/vehicles/route.ts`, `[id]/route.ts`, `[id]/baselines/route.ts` | Create | Vehicle endpoints |
| `twines/src/app/api/technician/vehicles/route.ts`, `[id]/service/route.ts` | Create | Technician endpoints |
| `twines/src/proxy.ts` | Create | Next.js 16 name for middleware. Redirects anonymous page requests to sign-in (fast path; real checks stay in use cases) |
| `twines/src/components/forms/*.tsx` | Create | Sign-up, sign-in, vehicle, baseline forms |
| `twines/src/components/vehicle-health/{VehicleHealthView,PartList,PartDetailPanel,HealthSummary}.tsx` | Create | Health view |
| `twines/src/components/vehicle-health/{Vehicle3D,VehicleDiagram2D,useWebGLSupport}.tsx` | Create | 3D and 2D renderings |
| `twines/src/components/vehicle-health/models/{sedan,hatchback,suv,pickup}.ts` | Create | Body geometry and hotspot positions per body type |
| `twines/tests/unit/**`, `twines/tests/component/**`, `twines/tests/integration/**`, `twines/tests/e2e/**` | Create | Test suites (see Testing Strategy) |
| `.gitattributes` (repo root) | Create | Normalize line endings (LF) |
| `README.md` (repo root) | Modify | Setup, scripts, test commands |

## Interfaces / Contracts

```ts
// src/domain/shared/calendar-date.ts
export type CalendarDate = string & { readonly __brand: "CalendarDate" }; // "YYYY-MM-DD"

// src/domain/part-health/catalog.ts
export type PartId =
  | "engine-oil" | "oil-filter" | "air-filter" | "brake-pads"
  | "tires" | "battery" | "coolant" | "spark-plugs";
export interface CatalogPart { id: PartId; name: string; kmInterval: number | null; monthInterval: number }
export const MAINTENANCE_CATALOG: readonly CatalogPart[];

// src/domain/part-health/health-estimator.ts
export type HealthStatus = "green" | "yellow" | "orange" | "red";
export interface PartBaseline { partId: PartId; mileageKm: number; date: CalendarDate }
export interface VehicleSnapshot { currentMileageKm: number; monthlyMileageKm: number; baselines: PartBaseline[] }
export interface PartHealth {
  partId: PartId;
  usageRatio: number;            // unrounded
  status: HealthStatus;
  remainingKm: number | null;    // negative = overdue km; null for time-only parts
  remainingDays: number;         // negative = overdue days
}
export interface HealthEstimator {
  estimate(vehicle: VehicleSnapshot, today: CalendarDate): PartHealth[];
}

// src/domain/maintenance/schedule.ts
export interface PartDue {
  partId: PartId;
  dueMileageKm: number | null;
  effectiveDueDate: CalendarDate;
  overdue: boolean;
}
export interface NextMaintenance {
  date: CalendarDate;
  overdue: boolean;
  parts: PartId[];
  estimatedMileageKm: number;
}
export function computePartDues(vehicle: VehicleSnapshot, today: CalendarDate): PartDue[];
export function computeNextMaintenance(dues: PartDue[], vehicle: VehicleSnapshot, today: CalendarDate): NextMaintenance;

// src/application/ports.ts
export type Role = "owner" | "technician";
export interface Clock { today(): CalendarDate; now(): Date }
export interface PasswordHasher { hash(plain: string): Promise<string>; verify(plain: string, hash: string): Promise<boolean> }
export interface VehicleRepository {
  create(input: NewVehicle): Promise<Vehicle>;          // throws Conflict on duplicate plate
  findByIdForOwner(id: string, ownerId: string): Promise<Vehicle | null>;
  findById(id: string): Promise<Vehicle | null>;
  findByPlate(plate: string): Promise<Vehicle | null>;
  listByOwner(ownerId: string): Promise<Vehicle[]>;
  update(id: string, changes: VehicleChanges): Promise<Vehicle>;
  delete(id: string): Promise<void>;
  upsertBaseline(vehicleId: string, baseline: PartBaseline): Promise<void>;
}
// UserRepository, SessionStore, LoginThrottleStore follow the same style.
```

Prisma models (summary): `User(id, email unique, passwordHash, role, createdAt)`, `Session(id = sha256(token), userId, expiresAt)`, `LoginThrottle(email PK, failedCount, lockedUntil?)`, `Vehicle(id, ownerId, plate unique, make, model, year, bodyType, currentMileageKm, purchaseDate, monthlyMileageKm, createdAt, updatedAt)`, `PartBaseline(vehicleId, partId, mileageKm, date; PK (vehicleId, partId); onDelete cascade)`.

HTTP contract (JSON): `400` validation errors `{ errors: { field: message } }`, `401` unauthenticated, `403` forbidden role or bad Origin, `404` not found or not owned, `409` duplicate email/plate, `429` locked sign-in.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (domain) | Catalog, ratios, thresholds and boundaries, remaining life, due dates, overdue, grouping, calendar math (HLT-01..10, MNT-01..08) | Vitest, Strict TDD (RED → GREEN → REFACTOR), table-driven boundary tests, fixed dates; coverage ≥ 80% (target ≥ 95%) |
| Unit (application) | Use-case rules: sign-up role forcing, generic sign-in errors, lockout and reset, ownership 404, technician 403, mileage never decreases, baseline rules (AUTH-01..13 logic, VEH-01..17 logic) | Vitest with in-memory fake repositories, fake hasher and fixed clock |
| Unit (validation) | zod schemas at boundary values (VEH-03, AUTH-03/04) | Vitest table-driven tests |
| Integration | Prisma repositories: unique plate/email, cascade delete, session lookup by token hash | Vitest against a temporary SQLite file migrated per run |
| Component | PartList text statuses, PartDetailPanel, VehicleDiagram2D, technician-only action (VIEW-02, VIEW-05, VIEW-06, VIEW-08/09) | Vitest + React Testing Library in jsdom |
| E2E | Sign-up/sign-in/sign-out, vehicle CRUD, health page, technician search and service, access denial; API 401/403/404/CSRF checks (AUTH-07..15, VEH-01..17, VIEW-01..05) | Playwright (Chromium) against `next start` with seeded `e2e.db` and `TWINES_FIXED_TODAY`; `request` fixture for API security tests |
| Manual / usability | 3D rotation and appearance, reduced motion (VIEW-03, VIEW-07), task-based usability sessions | Documented checklist and timed task scenarios |

Scripts (in `twines/package.json`): `test` (Vitest run), `test:coverage`, `test:e2e` (Playwright), `db:migrate`, `db:seed`.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. Web application security controls are covered by the decisions above (hashed passwords, revocable sessions, lockout keyed by email, Origin check, ownership 404, role 403, server-side validation) and verified by AUTH and VEH scenarios.

## Migration / Rollout

No migration required (greenfield). Delivery as chained PRs in this order: (1) scaffold + domain rules, (2) persistence + auth, (3) vehicle registry, (4) health view, (5) technician flow, seed and E2E suite. If the 3D view slips, slice (4) ships the 2D diagram only and the 3D component follows later.

## Open Questions

- [ ] None blocking. Prisma 7.x SQLite setup details (driver adapter, `prisma.config.ts`) are checked against the official documentation in the first scaffolding task.
