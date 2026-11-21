# Proposal: TwinES MVP — vehicle health core with authentication

## Intent

Build the first working slice of TwinES, delivered with a full QA cycle by the first milestone (2026-12-05). The slice must let a vehicle owner register a vehicle, see the status of its main parts as green/yellow/orange/red, and know the next recommended maintenance, with role-based access so that functional, regression, security and usability testing are all meaningful. The code is intentionally partial: AI features, the parts catalog and dealer workflows remain future work.

## Scope

### In Scope
- Account sign-up and sign-in with email and password, two roles: `owner` and `technician`, sign-out, protected routes.
- Vehicle registration and management by owners: plate, make, model, year, body type (`sedan`, `hatchback`, `suv`, `pickup`), current mileage, purchase date, estimated monthly mileage; list, view, edit and delete own vehicles.
- Per-part service baseline: for each tracked part, the mileage and date of its last service (defaulting to the purchase date and the mileage at purchase when unknown).
- Generic maintenance catalog of 8 combustion-engine parts with default intervals in km and months: engine oil, oil filter, air filter, brake pads, tires, battery, coolant, spark plugs.
- Rule-based part health: usage ratio = max(km used / km interval, months elapsed / month interval), mapped to green (< 0.50), yellow (0.50–0.74), orange (0.75–0.99) and red (≥ 1.00).
- Next recommended maintenance: for each part, the due date and due mileage (projected with the estimated monthly mileage); the vehicle's next maintenance is the earliest one.
- Vehicle health view: a rotating generic 3D model by body type with clickable, colored part zones, plus an accessible list/2D fallback that shows the same statuses.
- Technician access: search a vehicle by plate, view its health, and record that a part was serviced (resets that part's baseline).
- Test foundation: Vitest unit tests for domain rules, Playwright end-to-end tests for the main flows, seed data for demos and tests.

### Out of Scope
- AI-powered predictions and AI step-by-step guided repairs (future: `HealthEstimator` and `RepairGuide` extension points).
- Vehicle and spare-parts catalog with OEM-first and alternative parts.
- Exact per-model 3D assets, EV/hybrid components, telematics/OBD data.
- Dealer white-label configuration, multi-tenant dealers, workshop booking, notifications (email/WhatsApp).
- Full service history beyond the last service per part; payments; mobile apps; production deployment.

## Capabilities

### New Capabilities
- `user-auth`: sign-up, sign-in, sign-out, password hashing, sessions, role-based authorization (`owner`, `technician`).
- `vehicle-registry`: create, read, update, delete vehicles owned by the signed-in owner, input validation, per-part service baselines, technician lookup by plate and "part serviced" updates.
- `part-health`: generic maintenance catalog and the deterministic rule that computes each part's usage ratio and color status.
- `maintenance-schedule`: per-part due date and due mileage and the vehicle's next recommended maintenance.
- `vehicle-health-view`: 3D generic model by body type with clickable colored parts and an accessible equivalent list/2D view.

### Modified Capabilities
- None (greenfield project; `openspec/specs/` is empty).

## Approach

- Next.js (App Router, TypeScript) app in a dedicated `twines/` directory at the project root, Prisma ORM with SQLite for zero-setup local data.
- Domain rules (`part-health`, `maintenance-schedule`) as pure TypeScript modules with no framework imports and an injectable clock, so they can be driven by Strict TDD with Vitest and reach high coverage.
- Server-side authorization checks on every vehicle read/write (ownership for owners, role for technicians); passwords hashed; httpOnly session cookies.
- 3D view built with three.js (@react-three/fiber) from simple primitives per body type; each part zone carries an accessible label and the same data drives the 2D/list fallback, which E2E tests assert.
- Delivery as chained PRs (auto-chain): scaffolding and domain rules → auth → vehicle registry → health view → E2E suite.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `twines/` | New | Next.js application root (package.json, config) |
| `twines/prisma/schema.prisma` | New | User, Vehicle, PartServiceBaseline models |
| `twines/src/domain/part-health/` | New | Maintenance catalog and health rule |
| `twines/src/domain/maintenance/` | New | Next-maintenance calculation |
| `twines/src/app/(auth)/` | New | Sign-up, sign-in, sign-out |
| `twines/src/app/vehicles/` | New | Vehicle CRUD and health page |
| `twines/src/components/vehicle-3d/` | New | 3D model and 2D/list fallback |
| `twines/tests/unit/`, `twines/tests/e2e/` | New | Vitest and Playwright suites |
| `openspec/` | New | SDD artifacts for this change |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Scope does not fit before 2026-12-05 together with test documentation | High | Freeze scope here; slice into chained PRs; drop 3D to the 2D fallback if behind by the end of week 1 |
| 3D view is hard to test automatically | Med | Same data rendered as an accessible list; E2E tests assert the list and part labels, 3D gets smoke and manual usability tests |
| Generic intervals mislead users | Med | Label intervals as generic defaults in the UI; keep catalog data in one module |
| Security defects in a hand-built auth flow | Med | Use proven libraries for hashing and sessions; authorization checks centralized and unit tested |
| Strict TDD slows the first days (setup cost) | Med | Scaffold test runners first; TDD the domain rules where it pays most |

## Rollback Plan

Greenfield change: every slice lands as its own commit/PR, so any slice can be reverted with `git revert` without affecting earlier slices. If the 3D view is unstable, ship the 2D/list view only (it uses the same data and is required anyway). If the whole MVP must be abandoned, removing the `twines/` directory restores the previous state; documents in `docs/` and `openspec/` are unaffected.

## Dependencies

- Node.js LTS and npm on the development machine (already installed).
- Git repository initialized at the project root before the first commit (not a repo yet).
- npm packages: next, react, prisma, a password-hashing library, three/@react-three/fiber, vitest, @playwright/test.

## Success Criteria

- [ ] An owner can sign up, sign in, register a vehicle and see each of the 8 parts with the correct color and the next recommended maintenance (date and km).
- [ ] An owner cannot read or modify another owner's vehicle (verified by automated tests).
- [ ] A technician can find a vehicle by plate and mark a part as serviced, and the part returns to green.
- [ ] Domain rules (`part-health`, `maintenance-schedule`) have unit tests covering every color threshold and edge case, with ≥ 80% line coverage in `src/domain`.
- [ ] At least 5 automated end-to-end flows run green with Playwright (sign-up/sign-in, vehicle CRUD, health view, technician service update, access denial).
- [ ] Every spec scenario maps to a test case ID usable in the test plan.
