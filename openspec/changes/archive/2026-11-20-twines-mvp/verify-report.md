# Verify Report: twines-mvp (final, full change)

- Change: `twines-mvp` (artifact store: hybrid; openspec files canonical)
- Repo state: branch `main`, HEAD `edb2899`, working tree clean before and after the checks (all generated outputs are git-ignored)
- Mode: Strict TDD (runner `npm test` = `vitest run`, in `twines/`)
- Scope: 5 delta specs (59 scenarios); tasks.md (all phases); design.md conformance; previously fixed defects
- Rule: read-only. No source, test or task file was modified. Only this report was written.

## Verdict

**CURRENT (after re-verification 2026-11-20): 0 CRITICAL, 4 WARNING, 4 SUGGESTION.** See section "Re-verification 2026-11-20: TDD evidence" at the end. C1 is resolved as a CRITICAL and its remaining gaps are carried as WARNING W4; S3 is done.

~~Original (superseded): 0 functional CRITICAL, 1 process CRITICAL (missing TDD evidence table), 3 WARNING, 5 SUGGESTION.~~

All 59 scenarios are COMPLIANT (59 COMPLIANT, 0 PARTIAL, 0 MISSING). All 60 tasks are checked. Every executed check passed. The original CRITICAL (C1) was a documentation/process gap that the Strict TDD module requires to be flagged as CRITICAL; it was not a product defect and did not gate archive. The table has since been reconstructed (see re-verification).

## Executed checks (observed output)

All commands run from `twines/`.

| Check | Command | Result |
|-------|---------|--------|
| Unit + integration + component tests | `npm test` | exit 0. Test Files 62 passed (62); Tests 820 passed (820); duration 11.18s |
| By project (separate runs) | `npx vitest run --project unit / integration / component` | unit 625 passed (38 files); integration 52 passed (3 files); component 143 passed (21 files); sum 820 |
| Coverage | `npm run test:coverage` | exit 0. 62 files / 820 tests passed. Statements 100% (257/257), Branches 100% (116/116), Functions 100% (73/73), Lines 100% (226/226). 25 files fully covered, 2 empty files skipped. 80% thresholds pass |
| Type check | `npx tsc --noEmit` | exit 0, no output |
| Lint | `npm run lint` | exit 0, no output |
| End-to-end | `npm run test:e2e` | exit 0. **34 passed (51.9s)**, 0 failed, 0 skipped. Playwright runs `prepare-database.mjs` (fresh `e2e.db`: migrate + seed), `npm run build`, then `next start -p 3200`; self-contained, no external services needed |
| Build | exercised inside the E2E web server command (`npm run build`) | OK (not run as a separate command) |

Coverage scope note: `vitest.config.ts` measures only `src/domain/**` and `src/application/**` (by design). UI components, HTTP handlers and Prisma repositories are not in the coverage denominator; they are proven by component, integration and E2E tests.

## Task completion (tasks.md, observed, not rewritten)

Checked: 1.1-1.6, 2.1-2.11, 3.1-3.15, 4.1-4.8, 5.1-5.8, 6.1-6.10, 7.1-7.2 = 60 of 60. Unchecked: none. Unfinished tasks: 0.

Minor wording drift in tasks.md (not a behavior finding): 3.3 names `tests/integration/repositories.test.ts`; the file was split into `tests/integration/identity-repositories.test.ts` and `tests/integration/vehicle-repository.test.ts` (both exist and pass). All other test files named in tasks.md exist on disk.

## Design conformance

| Check | Result | Evidence |
|-------|--------|----------|
| Domain has no infrastructure/framework imports | PASS | Every import in `src/domain/**` is relative (`../shared/calendar-date`, `./catalog`, `./health-estimator`, `./status`, `../part-health/*`). Zero imports of `next`, `react`, `@prisma`, `@/infrastructure`, `@/application` |
| Application depends only on domain + ports | PASS | External imports in `src/application/**` are only `@/application/*`, `@/domain/*` and `zod`. Zero imports of `@/infrastructure`, `next`, `@prisma`, `react`, `bcryptjs` (the 3 grep hits for bcrypt are comments at `auth/sign-in.ts:20,45` and `validation/auth.ts:3`) |
| Ports as designed (`VehicleRepository`, `UserRepository`, `SessionStore`, `LoginThrottleStore`, `PasswordHasher`, `Clock`, `HealthEstimator`) | PASS | `src/application/ports.ts`, `src/domain/part-health/health-estimator.ts:30` |
| Ownership violations return 404; technician-only paths return 403 first | PASS | `application/vehicles/owned-vehicle.ts:15-16`, `technician/find-vehicle-by-plate.ts:20`, `technician/record-service.ts:22` |
| Custom DB sessions, token stored hashed, cookie httpOnly + SameSite=Lax, Secure in production | PASS | `application/auth/start-session.ts:3,27-28`, `infrastructure/auth/session-cookie.ts:14`, `infrastructure/http/auth-handlers.ts:16` |
| Throttle keyed by email, also for unknown emails; atomic increment | PASS | `application/auth/sign-in.ts:55-68`; `tests/integration/identity-repositories.test.ts:178` |
| REST handlers for mutations, Origin check, status mapping 400/401/403/404/409/429 | PASS | `infrastructure/http/handle.ts:20-27`, `origin-check.ts:26`, `guard.ts:21` |
| Calendar dates as YYYY-MM-DD, clock in America/Costa_Rica | PASS | `domain/shared/calendar-date.ts:2-52`; `tests/unit/infrastructure/auth/clock.test.ts:13` |
| 3D as r3f primitives with real button hotspots (aria-label), next/dynamic ssr:false, 2D SVG fallback | PASS | `components/vehicle-health/Vehicle3D.tsx:27,36,43`, `VehicleDiagram2D.tsx:38-40,80`, `useWebGLSupport.ts:7` |
| Seed deterministic and idempotent | PASS | `prisma/seed-data.ts`, `prisma/seed-database.ts`; `tests/integration/seed.test.ts` |
| Drift between design.md wording and the final implementation | see SUGGESTION S1 | TWINES_FIXED_TODAY rule and E2E date strategy differ from design.md text |

## Spec compliance matrix (59 scenarios)

Notation. Impl paths are relative to `twines/src/`. Test paths are relative to `twines/tests/` and written `U:` (unit), `I:` (integration), `C:` (component), `E:` (e2e); `file:line` points at the `it`/`describe` that carries the scenario ID in its title. A scenario is COMPLIANT when the behavior exists in the implementation and at least one test that I saw pass in the runs above exercises it with real assertions. Every `file:line` below was found by grepping the scenario ID in test titles.

### user-auth (15)

| ID | Implementation | Proving tests | Verdict |
|----|----------------|---------------|---------|
| AUTH-01 | `application/auth/sign-up.ts:22-26`, `sign-up-with-session.ts:15`, `start-session.ts:22` | U:application/auth/sign-up.test.ts:24; U:application/auth/sign-up-with-session.test.ts:36,46; U:infrastructure/http/auth-handlers.test.ts:61,71; C:forms/sign-up-form.test.tsx:41; E:auth.spec.ts:24 | COMPLIANT |
| AUTH-02 | `sign-up.ts:22,30` | U:application/auth/sign-up.test.ts:41,53; U:infrastructure/http/auth-handlers.test.ts:103; C:forms/sign-up-form.test.tsx:55 | COMPLIANT |
| AUTH-03 | `application/validation/auth.ts:20` | U:application/auth/sign-up.test.ts:73,93; U:infrastructure/http/auth-handlers.test.ts:113; C:forms/sign-up-form.test.tsx:67 | COMPLIANT |
| AUTH-04 | `validation/auth.ts:11-15` | U:application/auth/sign-up.test.ts:103; U:infrastructure/http/auth-handlers.test.ts:113; C:forms/sign-up-form.test.tsx:79 | COMPLIANT |
| AUTH-05 | `sign-up.ts:26`, `infrastructure/auth/bcrypt-hasher.ts` | U:application/auth/sign-up.test.ts:121; U:infrastructure/auth/bcrypt-hasher.test.ts:8; U:infrastructure/auth/real-adapters.test.ts:17 | COMPLIANT |
| AUTH-06 | `sign-up.ts:26` (role fixed to owner) | U:application/auth/sign-up.test.ts:130; U:infrastructure/http/auth-handlers.test.ts:94 | COMPLIANT |
| AUTH-07 | `application/auth/sign-in.ts:49-68` | U:application/auth/sign-in.test.ts:50; U:infrastructure/http/auth-handlers.test.ts:151; C:forms/sign-in-form.test.tsx:39; E:auth.spec.ts:40 | COMPLIANT |
| AUTH-08 | `sign-in.ts:26,61-65` (single INVALID_CREDENTIALS, dummy-hash verify for unknown email) | U:application/auth/sign-in.test.ts:86; U:infrastructure/http/auth-handlers.test.ts:178; C:forms/sign-in-form.test.tsx:53; E:auth.spec.ts:46 | COMPLIANT |
| AUTH-09 | `infrastructure/auth/session-cookie.ts:14` | U:infrastructure/auth/session-cookie.test.ts:69; U:infrastructure/http/auth-handlers.test.ts:86,159; E:api-security.spec.ts:125 | COMPLIANT |
| AUTH-10 | `sign-in.ts:15,55-56` (MAX_FAILED_ATTEMPTS = 5, TooManyAttempts) | U:application/auth/sign-in.test.ts:124; U:infrastructure/http/auth-handlers.test.ts:189; C:forms/sign-in-form.test.tsx:64; E:auth.spec.ts:63 | COMPLIANT |
| AUTH-11 | `sign-in.ts:16,55,68` (LOCK_DURATION_MS, counter reset) | U:application/auth/sign-in.test.ts:246-288 (lock end, 1 ms before, reset, re-lock). No E2E by design (15 min of wall clock) | COMPLIANT |
| AUTH-12 | `application/auth/sign-out.ts:11`, `get-current-user.ts:16` | U:application/auth/sign-in.test.ts:290; U:infrastructure/http/auth-handlers.test.ts:226; C:auth/sign-out-button.test.tsx:19; E:auth.spec.ts:78 | COMPLIANT |
| AUTH-13 | `proxy.ts:9-11` | U:proxy.test.ts:11; E:auth.spec.ts:97 (3 protected paths redirect to /sign-in) | COMPLIANT |
| AUTH-14 | `infrastructure/http/guard.ts:21`, `handle.ts:24` | U:infrastructure/http/vehicle-handlers.test.ts:73; U:infrastructure/http/technician-handlers.test.ts:76; E:api-security.spec.ts:8 | COMPLIANT |
| AUTH-15 | `technician/find-vehicle-by-plate.ts:20`, `technician/record-service.ts:22`, `app/technician/page.tsx:12`, `app/forbidden.tsx`, `next.config.ts` (authInterrupts) | U:application/technician/find-vehicle-by-plate.test.ts:49; U:application/technician/record-service.test.ts:190; U:infrastructure/http/technician-handlers.test.ts:97; U:next-config.test.ts:5; C:forbidden.test.tsx:8; C:pages/role-pages.test.tsx:36; E:api-security.spec.ts:26 (real 403 for API and page) | COMPLIANT |

### vehicle-registry (17)

| ID | Implementation | Proving tests | Verdict |
|----|----------------|---------------|---------|
| VEH-01 | `application/vehicles/register-vehicle.ts:26-37`, `validation/vehicle.ts:92` | U:application/validation/vehicle.test.ts:40; U:application/vehicles/register-vehicle.test.ts:16,32; U:infrastructure/http/vehicle-handlers.test.ts:142; C:forms/vehicle-form.test.tsx:84; E:vehicles.spec.ts:42 | COMPLIANT |
| VEH-02 | `register-vehicle.ts:14,34,40` | U:application/vehicles/register-vehicle.test.ts:57,67; U:application/vehicles/update-vehicle.test.ts:105; U:infrastructure/http/vehicle-handlers.test.ts:170; C:forms/vehicle-form.test.tsx:156; E:vehicles.spec.ts:60 | COMPLIANT |
| VEH-03 | `validation/vehicle.ts:92-103` (one message per field) | U:application/validation/vehicle.test.ts:65,93,102,140,168,178,199,353; U:application/vehicles/register-vehicle.test.ts:84,94; U:application/vehicles/update-vehicle.test.ts:142; U:infrastructure/http/vehicle-handlers.test.ts:180; C:forms/vehicle-form.test.tsx:127; E:vehicles.spec.ts:73 | COMPLIANT |
| VEH-04 | `validation/vehicle.ts` (default 1000) | U:application/validation/vehicle.test.ts:222; U:application/vehicles/register-vehicle.test.ts:49; U:infrastructure/http/vehicle-handlers.test.ts:153; C:forms/vehicle-form.test.tsx:76; E:vehicles.spec.ts:51 | COMPLIANT |
| VEH-05 | `register-vehicle.ts:37` (defaultBaselines(purchaseDate)) | U:application/vehicles/register-vehicle.test.ts:39 (8 baselines, 0 km, purchase date) | COMPLIANT |
| VEH-06 | `application/vehicles/set-baseline.ts:24-30` | U:application/validation/vehicle.test.ts:297; U:application/vehicles/set-baseline.test.ts:25; U:infrastructure/http/vehicle-handlers.test.ts:367; C:forms/baseline-form.test.tsx:42 | COMPLIANT |
| VEH-07 | `validation/vehicle.ts:112` (baselineSchema) | U:application/validation/vehicle.test.ts:313,326; U:application/vehicles/set-baseline.test.ts:39; U:infrastructure/http/vehicle-handlers.test.ts:377; C:forms/baseline-form.test.tsx:60,72 | COMPLIANT |
| VEH-08 | `application/vehicles/list-vehicles.ts:9` (listByOwner) | U:application/vehicles/list-vehicles.test.ts:17; U:infrastructure/http/vehicle-handlers.test.ts:216; C:vehicles/vehicle-list.test.tsx:13; E:vehicles.spec.ts:104 | COMPLIANT |
| VEH-09 | `application/vehicles/update-vehicle.ts:28-29`, `validation/vehicle.ts:85`, `infrastructure/repositories/vehicle-repository.ts:111-119` (conditional write) | U:application/vehicles/update-vehicle.test.ts:41,70; U:application/technician/record-service.test.ts:94,135; U:infrastructure/http/vehicle-handlers.test.ts:287; U:infrastructure/http/technician-handlers.test.ts:206; I:vehicle-repository.test.ts:144,163,257,281; C:forms/vehicle-form.test.tsx:230; C:vehicle-health/part-detail-panel.test.tsx:127; E:vehicles.spec.ts:118 | COMPLIANT |
| VEH-10 | `application/vehicles/delete-vehicle.ts:13-14`, Prisma cascade, `components/vehicles/delete-vehicle-button.tsx` | U:application/vehicles/delete-vehicle.test.ts:20; U:infrastructure/http/vehicle-handlers.test.ts:335; C:vehicles/delete-vehicle-button.test.tsx:28,51; E:vehicles.spec.ts:134 | COMPLIANT |
| VEH-11 | `components/vehicles/vehicle-list.tsx:25` | U:application/vehicles/list-vehicles.test.ts:24; C:vehicles/vehicle-list.test.tsx:33; E:vehicles.spec.ts:155 | COMPLIANT |
| VEH-12 | `application/vehicles/owned-vehicle.ts:16`, `get-vehicle-health.ts:37-40`, `vehicle-repository.ts:83` | U:application/vehicles/get-vehicle-health.test.ts:89; U:infrastructure/http/vehicle-handlers.test.ts:261; E:api-security.spec.ts:48 | COMPLIANT |
| VEH-13 | `owned-vehicle.ts:15-16` (shared by update, delete, set-baseline) | U:application/vehicles/delete-vehicle.test.ts:39; U:application/vehicles/set-baseline.test.ts:71; U:application/vehicles/update-vehicle.test.ts:152,158; U:infrastructure/http/vehicle-handlers.test.ts:312,345,389; E:api-security.spec.ts:48 | COMPLIANT |
| VEH-14 | `technician/find-vehicle-by-plate.ts:20-22`, `validation/vehicle.ts:142` | U:application/technician/find-vehicle-by-plate.test.ts:19,26,30; U:application/vehicles/get-vehicle-health.test.ts:101; U:infrastructure/http/technician-handlers.test.ts:132; C:technician/plate-search-form.test.tsx:36; E:technician.spec.ts:18 | COMPLIANT |
| VEH-15 | `find-vehicle-by-plate.ts:22` | U:application/technician/find-vehicle-by-plate.test.ts:42; U:infrastructure/http/technician-handlers.test.ts:146; C:technician/plate-search-form.test.tsx:56; E:technician.spec.ts:30 | COMPLIANT |
| VEH-16 | `technician/record-service.ts:16-27`, `vehicle-repository.ts:145` (interactive transaction) | U:application/technician/record-service.test.ts:29 (engine oil red, mileage 45200, baseline 45200 on today, status green); U:infrastructure/http/technician-handlers.test.ts:174; C:vehicle-health/use-service-recorder.test.tsx:23; C:vehicle-health/part-detail-panel.test.tsx:63; C:vehicle-health/vehicle-health-with-model.test.tsx:108; E:technician.spec.ts:60 | COMPLIANT |
| VEH-17 | `owned-vehicle.ts:15`, `register-vehicle.ts:31`, `app/vehicles/new/page.tsx:11`, `app/vehicles/[id]/edit/page.tsx` | U:application/vehicles/delete-vehicle.test.ts:50; U:application/vehicles/register-vehicle.test.ts:103; U:application/vehicles/update-vehicle.test.ts:162; U:infrastructure/http/vehicle-handlers.test.ts:207,321,354,397; U:infrastructure/http/technician-handlers.test.ts:275; C:pages/role-pages.test.tsx:54,70; E:api-security.spec.ts:74 | COMPLIANT |

### part-health (10)

| ID | Implementation | Proving tests | Verdict |
|----|----------------|---------------|---------|
| HLT-01 | `domain/part-health/catalog.ts:20-28` | U:domain/part-health/catalog.test.ts:5,18,23 | COMPLIANT |
| HLT-02 | `rule-based-estimator.ts:29-39` | U:domain/part-health/rule-based-estimator.test.ts:44 | COMPLIANT |
| HLT-03 | `rule-based-estimator.ts:29-39` | U:domain/part-health/rule-based-estimator.test.ts:54 | COMPLIANT |
| HLT-04 | `rule-based-estimator.ts:31-36` (no km ratio when interval is null) | U:domain/part-health/rule-based-estimator.test.ts:64 | COMPLIANT |
| HLT-05 | `rule-based-estimator.ts:39` | U:domain/part-health/rule-based-estimator.test.ts:75 | COMPLIANT |
| HLT-06 | `domain/part-health/status.ts:8-12` | U:domain/part-health/status.test.ts:6-15 (table-driven: 0.4999, 0.50, 0.7499, 0.75, 0.9999, 1.00, 2.5) | COMPLIANT |
| HLT-07 | `rule-based-estimator.ts:32-36` | U:domain/part-health/rule-based-estimator.test.ts:84 | COMPLIANT |
| HLT-08 | `rule-based-estimator.ts:36` (negative = overdue) | U:domain/part-health/rule-based-estimator.test.ts:93,103 | COMPLIANT |
| HLT-09 | `status.ts:15-19` (worstStatus), `application/vehicles/get-vehicle-health.ts:6` | U:domain/part-health/status.test.ts:21,28,35; U:application/vehicles/get-vehicle-health.test.ts:64 | COMPLIANT |
| HLT-10 | `rule-based-estimator.ts:50,61` (createHealthEstimator), port `health-estimator.ts:30` | U:domain/part-health/rule-based-estimator.test.ts:126,130; U:application/vehicles/get-vehicle-health.test.ts:108 | COMPLIANT |

### maintenance-schedule (8)

| ID | Implementation | Proving tests | Verdict |
|----|----------------|---------------|---------|
| MNT-01 | `domain/maintenance/schedule.ts:28-35` (ceil km projection, earlier of two dates) | U:domain/maintenance/schedule.test.ts:43,53 | COMPLIANT |
| MNT-02 | `schedule.ts` (km date only with a positive monthly mileage) | U:domain/maintenance/schedule.test.ts:71 | COMPLIANT |
| MNT-03 | `schedule.ts` (time-only part, no due mileage) | U:domain/maintenance/schedule.test.ts:78 | COMPLIANT |
| MNT-04 | `schedule.ts:38` | U:domain/maintenance/schedule.test.ts:89,94,101 | COMPLIANT |
| MNT-05 | `schedule.ts:37` | U:domain/maintenance/schedule.test.ts:113,120 | COMPLIANT |
| MNT-06 | `schedule.ts:64,70-82` (30-day grouping, earliest date, estimated km) | U:domain/maintenance/schedule.test.ts:143 | COMPLIANT |
| MNT-07 | `schedule.ts:77-82` | U:domain/maintenance/schedule.test.ts:163,173 | COMPLIANT |
| MNT-08 | `technician/record-service.ts` then getVehicleHealth recompute | U:domain/maintenance/schedule.test.ts:200; U:application/technician/record-service.test.ts:81,208; U:application/vehicles/get-vehicle-health.test.ts:78 | COMPLIANT |

### vehicle-health-view (9)

| ID | Implementation | Proving tests | Verdict |
|----|----------------|---------------|---------|
| VIEW-01 | `components/vehicle-health/HealthSummary.tsx:52,71` | C:vehicle-health/health-summary.test.tsx:10,30; C:vehicle-health/vehicle-health-view.test.tsx:33; E:health-view.spec.ts:30,59 | COMPLIANT |
| VIEW-02 | `PartList.tsx:22-36`, `part-rows.ts`, `StatusBadge.tsx` | C:vehicle-health/part-list.test.tsx:16,37,48,59; C:vehicle-health/status-colors.test.tsx:27 (WCAG AA contrast); C:vehicle-health/vehicle-health-view.test.tsx:42; U:components/part-rows.test.ts:22,52,59; E:health-view.spec.ts:68 | COMPLIANT |
| VIEW-03 | `components/vehicle-health/models/index.ts:16` (getBodyModel), `Vehicle3D.tsx`, `VehicleScene.tsx` | U:components/vehicle-health-models.test.ts:24,28,37; C:vehicle-health/vehicle-3d.test.tsx:63; C:vehicle-health/vehicle-health-with-model.test.tsx:47; manual M-1 (`docs/testing/manual-tests.md`). See WARNING W2 | COMPLIANT |
| VIEW-04 | `Vehicle3D.tsx:27,43` (autoRotate only while no part is selected and motion is allowed), `PartDetailPanel.tsx` | C:vehicle-health/part-detail-panel.test.tsx:13,26; C:vehicle-health/vehicle-3d.test.tsx:69,91,108; C:vehicle-health/vehicle-health-with-model.test.tsx:63; E:health-view.spec.ts:86,107,119 (real Chromium with WebGL) | COMPLIANT |
| VIEW-05 | `VehicleHealthView.tsx:46-48` (single selectedPartId), `PartList.tsx:27`, `status-colors.ts` | C:vehicle-health/vehicle-health-view.test.tsx:104,120; C:vehicle-health/diagram-2d.test.tsx:49,57,70; C:vehicle-health/part-list.test.tsx:68,76; C:vehicle-health/vehicle-3d.test.tsx:99; C:vehicle-health/vehicle-health-with-model.test.tsx:80; U:components/status-colors-3d.test.ts:26; E:health-view.spec.ts:86 | COMPLIANT |
| VIEW-06 | `VehicleHealthView.tsx:47`, `useWebGLSupport.ts:7`, `VehicleDiagram2D.tsx:38-40,80` | C:vehicle-health/diagram-2d.test.tsx:16,34,43; C:vehicle-health/vehicle-health-view.test.tsx:48,57; C:vehicle-health/vehicle-health-with-model.test.tsx:55; C:vehicle-health/web-gl-support.test.tsx:16,23,30,50,57; E:health-view.spec.ts:140 (WebGL disabled, 8 colored zones, no page errors) | COMPLIANT |
| VIEW-07 | `usePrefersReducedMotion.ts:3`, `Vehicle3D.tsx:27` | C:vehicle-health/prefers-reduced-motion.test.tsx:12; C:vehicle-health/vehicle-3d.test.tsx:118,128; C:vehicle-health/vehicle-health-with-model.test.tsx:157; E:health-view.spec.ts:173 | COMPLIANT |
| VIEW-08 | `PartDetailPanel.tsx:11-15`, `MarkServicedAction.tsx:56` | C:vehicle-health/part-detail-panel.test.tsx:42; C:vehicle-health/vehicle-health-view.test.tsx:131; E:technician.spec.ts:39 | COMPLIANT |
| VIEW-09 | `PartDetailPanel.tsx` (canMarkServiced false for owners) | C:vehicle-health/part-detail-panel.test.tsx:186; C:vehicle-health/vehicle-health-view.test.tsx:143; C:vehicle-health/vehicle-health-with-model.test.tsx:147; E:technician.spec.ts:50 | COMPLIANT |

**Summary**: 59 of 59 COMPLIANT, 0 PARTIAL, 0 MISSING. This agrees with `docs/testing/traceability.md` (59 of 59 automated, 31 also E2E). Caveat: the manual checks M-1..M-6 are documented procedures that I did not re-execute (they need a human and a GPU browser); VIEW-03..07 are COMPLIANT on their automated behavioral coverage alone.

The traceability document lives at `docs/testing/traceability.md` (repo root, not under `twines/`); the README links it.

## Previously fixed defects: regression tests

The request mentions 7 previously fixed defects without listing them. apply-progress records these fixes from independent verifications. The PR 5 and PR 6 follow-ups (tasks 3.14 and 3.15) are 5 + 2 = 7; the body-consumption fix and the PR 11 follow-ups (task 6.10) are additional. All have a regression test that passes.

| Defect (task) | Fix | Regression test (file:line) | Result |
|---------------|-----|-----------------------------|--------|
| 3.14 W1 non-atomic lockout | atomic LoginThrottleStore.recordFailure | I:identity-repositories.test.ts:178 (10 concurrent failures); U:application/auth/sign-in.test.ts:192 | covered |
| 3.14 W2 passwordHash leaving the application layer | PublicUser | U:application/auth/sign-in.test.ts:70,297 (no passwordHash property); U:application/auth/sign-up.test.ts:37 | covered |
| 3.14 S1 passwords over 72 bytes | generic Unauthorized, counted, no bcrypt call | U:application/auth/sign-in.test.ts:212-240 | covered |
| 3.14 S2 TWINES_FIXED_TODAY only in dev/test | `infrastructure/auth/clock.ts` | U:infrastructure/auth/clock.test.ts:18,24 (production, staging, Development, empty, undefined ignored) | covered |
| 3.14 S5 dummy hash cost | DUMMY_PASSWORD_HASH | U:infrastructure/auth/real-adapters.test.ts:17 (getRounds equals 12) | covered |
| 3.15 W-1 sign-up refused (429) after pre-lock | signUpWithSession | U:application/auth/sign-up-with-session.test.ts:46; U:infrastructure/http/auth-handlers.test.ts:71 | covered |
| 3.15 W-2 Origin check behind a TLS proxy | optional APP_ORIGIN | U:infrastructure/http/origin-check.test.ts:50-67 | covered |
| afcce67 session cookie read consumed the request body | readSessionToken | U:infrastructure/auth/session-cookie.test.ts:38-43 | covered |
| 6.10 B1 wrong-role pages answered 200 instead of 403 | forbidden() + authInterrupts | U:next-config.test.ts:5; C:pages/role-pages.test.tsx:36,54,70; C:forbidden.test.tsx:8; E:api-security.spec.ts:26,74 | covered |
| 6.10 W1 mileage rollback race | conditional write in update and in the recordService transaction | I:vehicle-repository.test.ts:144,163,257,281; U:application/vehicles/update-vehicle.test.ts:70; U:application/technician/record-service.test.ts:124,135 | covered |
| 6.10 S1 extra keys, negative and infinite mileage | serviceSchema | U:infrastructure/http/technician-handlers.test.ts:222,238,253 | covered |
| 6.10 S2 plate search shares registration rules | plateField() | U:application/validation/vehicle.test.ts:340-371 | covered |
| 6.10 S3 unknown vehicle between read and write is 404 | repository NotFound | I:vehicle-repository.test.ts:158,250 | covered |
| 6.10 S4 technician PUT/POST baselines is 403 | guard | U:infrastructure/http/vehicle-handlers.test.ts:397; E:api-security.spec.ts:74 | covered |

No fixed defect lacks a regression test.

## TDD compliance (Strict TDD, strict-tdd-verify.md)

| Check | Result | Details |
|-------|--------|---------|
| TDD Cycle Evidence table in apply-progress | FAIL (SUPERSEDED 2026-11-20: table now present, see re-verification) | `sdd/twines-mvp/apply-progress` (Engram #37, 13 revisions) is prose per work unit. It reports test counts, coverage and verification commands, but has **no per-task TDD Cycle Evidence table** (RED / GREEN / TRIANGULATE / SAFETY NET / REFACTOR columns). Only unit 12b has a short TDD evidence paragraph. tasks.md says RED/GREEN evidence lives in PR descriptions; those are not in the artifact store and the later branches were never pushed, so they could not be checked |
| All tasks have tests | PASS | Every implementation task maps to existing test files (existence verified for every test path named in tasks.md, except the renamed integration file noted above) |
| RED confirmed (tests exist) | PASS (existence only) | Test files exist. Test-first order cannot be verified: git history combines tests and implementation in the same feat commits (4 of 68 commits are test-typed) and no failing-run log is recorded. Nothing was fabricated |
| GREEN confirmed | PASS | 820/820 unit, integration, component and 34/34 E2E pass now |
| Triangulation | PASS | Table-driven and multi-case tests (HLT-06, VEH-03 boundaries; several distinct expected values per behavior) |
| Safety net for modified files | NOT REPORTED | apply-progress records no pre-modification baselines; the full suite staying green is the only evidence |

**TDD compliance**: GREEN and tests-exist fully verified; RED (existence) and triangulation verified partially; evidence table and safety net not reported.

### Test layer distribution

| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit | 625 | 38 | Vitest (node) |
| Integration | 52 | 3 | Vitest + Prisma/SQLite |
| Component | 143 | 21 | Vitest + React Testing Library (jsdom) |
| E2E | 34 | 5 | Playwright (Chromium) |
| **Total** | **854** | **67** | |

### Changed-file coverage

Measured scope (domain + application): 25 files fully covered, 100% statements, branches, functions and lines (rating Excellent for every measured file). UI, infrastructure and routes are outside the configured coverage scope; they are exercised by component, integration and E2E layers.

### Assertion quality audit

Scanned all 62 vitest files and the 5 Playwright specs.

- Tautologies (expect(true).toBe(true) and similar): none.
- Ghost loops: every assertion loop I inspected iterates a collection whose size is asserted first or is a fixed literal (for example `vehicle-3d.test.tsx:74` after an exact label list, `:82` after a length-8 check; `rule-based-estimator.test.ts:78` after a length-8 check; `diagram-2d.test.tsx:31` after an exact label list). Mild cases: `part-list.test.tsx:65` (items.slice(1) over a fixed fixture) and `health-view.spec.ts:50` (nextMaintenance.parts, non-empty for the seeded vehicle but not asserted non-empty).
- Type-only assertions: not.toBeNull / toBeDefined appear in 13 files; those inspected are paired with value assertions in the same test (for example `sign-in.test.ts:250`).
- Empty-collection assertions: each inspected one has a companion positive test (for example `list-vehicles.test.ts:17` versus `:24`).
- Implementation-detail coupling (CSS classes): none found.
- Mock-heavy tests: highest are `vehicle-3d.test.tsx` (3 mocks, 19 expects) and `vehicle-health-with-model.test.tsx` (5 mocks, 23 expects); none exceeds 2x assertions. The mocks replace WebGL/r3f, which jsdom cannot run.

**Assertion quality**: 0 CRITICAL, 0 WARNING (the mock-based 3D coverage is tracked as W2).

### Quality metrics

- Linter: no errors, no warnings (exit 0).
- Type checker: no errors (exit 0).

## Findings

### CRITICAL

- ~~**C1 (SUPERSEDED 2026-11-20: resolved as CRITICAL; remaining gaps carried as WARNING W4)**~~ **C1 (process, not functional): no TDD Cycle Evidence table in `sdd/twines-mvp/apply-progress`.** The Strict TDD verify module requires this to be flagged CRITICAL when absent. Impact: test-first ordering is not independently demonstrable from the artifact or from git history. Every behavior is covered by passing, non-trivial tests, so there is no evidence of a product defect. This is diagnostic and does not gate archive; archive should record it as an honest limitation, not a synthetic PASS.

### WARNING

- **W1: `twines/.env.example` could not be inspected (read denied by permissions in this session), and apply-progress says it was not updated.** Task 1.5 lists DATABASE_URL, SEED_TECH_PASSWORD, TWINES_FIXED_TODAY; units 7 and 12a added APP_ORIGIN and SEED_OWNER_PASSWORD, which apply-progress states were left to the maintainer. The README documents them (`README.md:36,37,40`) and the seed fails fast with a clear message when a password is missing, so setup is recoverable. Status: unverified by me, reported as open per apply-progress.
- **W2: 3D rendering by body type has no automated assertion against the real r3f scene.** VIEW-03 is proven at the data level (getBodyModel, distinct geometry per body type) and at the wiring level (a mocked VehicleScene receives the body type); the E2E 3D tests run real WebGL but click hotspots and do not assert the model shape. The visual proof is manual check M-1 (not re-run here). Residual risk: a body-type model rendering wrongly while all automated tests stay green.
- **W3: coverage thresholds gate only `src/domain` and `src/application`.** HTTP handlers, repositories, cookie helpers and UI are outside the coverage denominator. They are well tested (integration 52, component 143, E2E 34), but a regression there would not trip a coverage gate.

### SUGGESTION

- **S1: update `design.md` to match the implemented decisions.** It says TWINES_FIXED_TODAY is honored when NODE_ENV is not production (implemented: only development or test, task 3.14 S2) and that E2E injects a fixed clock (implemented: seed statuses are relative to today and E2E runs against `next start`, task 6.5). It does not mention PublicUser or the forbidden() / authInterrupts 403 pages.
- **S2: fix the stale path in tasks.md 3.3** (`tests/integration/repositories.test.ts` is now `identity-repositories.test.ts` and `vehicle-repository.test.ts`).
- ~~**S3: add a TDD Cycle Evidence table to the apply-progress artifact (or record the PR-description evidence) before archive**, so the archived record is complete. Do not backfill RED runs that were not observed.~~ DONE 2026-11-20 (table reconstructed from the sdd-apply reports without inferring unobserved RED runs).
- **S4: usability observations in `docs/testing/manual-tests.md` are open product follow-ups, not spec failures**: the 403 page drops the app shell (no sign-out button), vehicles without baselines show every part red by design, engine-bay hotspots cluster in the 3D view.
- **S5: consider one automated check per body type against the real scene** (E2E or screenshot) to close W2.

## Limitations

- Manual checks M-1..M-6 and the task-based usability sessions were not executed here.
- `.env.example` content was not readable (permission denied), so W1 relies on apply-progress.
- No separate `npm run build`; the build ran inside the E2E web server command and succeeded (server came up, 34 tests passed).
- The 7 previously fixed defects were not enumerated in the request; all defects recorded in apply-progress are listed above.

## Next recommended

`sdd-archive`. Implementation is complete (60 of 60 tasks checked, 59 of 59 scenarios compliant, all executed checks green). The warnings are recorded diagnostics and do not gate archive; optionally address S1-S2 documentation items first. (Updated 2026-11-20: C1 resolved, S3 done; the archive record should carry W4 as an honest limitation.)

## Re-verification 2026-11-20: TDD evidence

Scope: strict-tdd-verify.md Step 5a (TDD compliance) and Step 5f (assertion quality) against the reconstructed `### TDD Cycle Evidence` table in `openspec/changes/twines-mvp/apply-progress.md` (Engram `sdd/twines-mvp/apply-progress`, id 37 holds the identical table). The 59-scenario matrix was not re-run. Source code, tests and tasks were not modified. Working tree: `apply-progress.md` and `verify-report.md` are untracked (not committed).

### Table structure check

- Table found: 55 rows covering all 60 tasks (combined rows such as 2.1/2.2). The summary counts reconcile: 45 complete (1.2; 2.1-2.10; 3.2-3.15; 4.1-4.8; 5.1-5.8; 6.1-6.4) + 1 partial (6.10) + 12 N/A (1.1, 1.3-1.6, 2.11, 3.1, 6.5-6.9) + 2 no evidence (7.1, 7.2) = 60.
- Provenance: reconstructed on 2026-11-20 from the `sdd-apply` sub-agent reports, not written contemporaneously; unknown columns are marked "No evidence recorded" and nothing was inferred. The table's own notes state this.

### Test-file existence (RED column: "tests exist")

Every test file named in the table exists on disk. Rows that name only a directory or a glob (3.3/3.4 `tests/integration/*`, 3.9-3.11 `tests/unit/infrastructure/http/*`, 3.12/3.13, 3.14, 3.15, 4.8, 5.x, 6.x) resolve to existing files (62 vitest files plus 5 Playwright specs found under `twines/tests`). One path is imprecise: row 5.7/5.8 body models names `tests/component/vehicle-health/` models tests, but the real file is `tests/unit/components/vehicle-health-models.test.ts` (unit layer, consistent with the row's Layer = Unit). Existence: 0 missing, 1 imprecise path.

### GREEN cross-check (executed now)

Command: `npx vitest run` on sanity, `tests/unit/domain`, errors, validation/vehicle, `tests/unit/infrastructure/auth`, `tests/unit/application/{auth,technician,vehicles}` and `tests/unit/seed`: 21 files, 414 passed, 0 failed. The full run in the original report (820 vitest + 34 E2E, all green) still stands and covers every other row.

Sampled claims against current per-file test counts (JSON reporter run):

| Row | Claimed | Observed now | Verdict |
|-----|---------|--------------|---------|
| 1.2 sanity | 3 cases: `APP_NAME`, `getAppTitle("Vehicles")`, `getAppTitle()` | 3 tests, exactly those three assertions | Match |
| 2.1/2.2 calendar-date | 22/22 | 22 | Match |
| 2.3/2.4 catalog | 3/3 | 3 | Match |
| 2.5/2.6 status | 11/11 | 11 | Match |
| 2.7/2.8 estimator | 12/12 | 12 | Match |
| 2.9/2.10 schedule | 14, then 23/23 total | 23 | Match |
| 3.2 errors | 8/8 | 8 | Match |
| 3.5/3.6 sign-up + hasher | 19/19 | sign-up 17 + bcrypt-hasher 4 | Plausible, not exact (later growth) |
| 4.1/4.2 vehicle validation | 79/79 first run | 99 (plate rules added later by 6.10 S2, which reported 11 RED tests) | Consistent |
| 6.1 find-vehicle-by-plate | 7 | 8 (S2 added one) | Consistent |
| 6.1 record-service | "pass", count not stated | 20 | Consistent |
| 6.1 Prisma recordService atomicity | trigger-forced baseline failure; fails if `$transaction` becomes `Promise.all` | trigger test present (`vehicle-repository.test.ts` near L300) and passing; the mutation run itself was not repeated | Test exists and passes |
| 6.10 S3 | integration NotFound tests | `vehicle-repository.test.ts:158,250` present and green | Match |
| 5.7/5.8 Vehicle3D drei bug | late regression test | `vehicle-3d.test.tsx:15-17,82` asserts the stable portal | Match |

No claim was contradicted. Count differences are explained by later work units adding tests to the same files.

### RED verifiability

RED claims are not independently reproducible. Git history combines tests and implementation in the same commits (4 of 68 commits are test-typed), and for 1.2 `src/lib/app-info.ts` was committed in the scaffold commit (1279f9b) before `sanity.test.ts` (fe174ad), so git does not corroborate test-first order there. The RED cells are specific, per-row observed failure messages (for example "Cannot find package ...", "9 tests failed with `computeNextMaintenance is not a function`", "17 failing tests"), and are accepted as reported evidence, not as independently confirmed. For the verifier, RED is "tests exist"; ordering cannot be proven after the fact.

### N/A legitimacy

| Rows | Reason given | Judgment |
|------|--------------|----------|
| 1.1, 1.3, 1.4, 1.5, 1.6 | Scaffolding/config, no behavior | Legitimate. No testable behavior; 1.2 supplies the sanity test that proves the runner works |
| 2.11 | Verification task (coverage and import check) | Legitimate. It is a check; coverage is enforced by `npm run test:coverage` (100% observed) |
| 3.1 | Prisma schema/config/migration | Legitimate for config; schema behavior is exercised by the 3.3/3.4 integration tests (52 integration tests green) |
| 6.5-6.9 | E2E written against already-implemented behavior | Acceptable as characterization, not true RED; cannot be RED by construction. Assurance rests on 34/34 passing in two apply runs plus one run in the original verify, and on the report's statement that assertions were not weakened. Recorded as a limitation under W4, not CRITICAL |
| 7.1, 7.2 | Docs, "No evidence recorded" | No code behavior, so TDD does not apply. The cells should read N/A instead of "No evidence recorded"; cosmetic only |
| 6.10 S1/S3/S4 (partial) | Characterization tests, green on first run | Honest and limited to three sub-items of one task; their behavior is proven by the handler and integration tests in the original regression table |

### Weaknesses in the table (not failures of existence or GREEN)

- Safety Net: 37 of 55 rows say "Not reported" (5 are "N/A (new)", of which the 2.x rows were checked against git add history; 11 are N/A; 2 are "No evidence recorded"). Many "Not reported" rows describe modifications of existing files (3.14, 3.15, 4.5, 6.3, 6.10). Per the module this is a WARNING; the full suite staying green is the only evidence.
- TRIANGULATE: concrete case lists for nearly all rows; "No evidence recorded" only for the 3.15 W-1/W-2 rows. Spot-checked rows have genuinely distinct expected values.
- REFACTOR: "No evidence recorded" in 32 of 55 rows. The module says REFACTOR is not strictly verifiable, so no finding.
- Several GREEN cells state "Pass" without a count (6.1 record-service, 6.1 Prisma, 6.3).
- The 5.7/5.8 body-models row has the wrong path (above).

### Assertion quality audit (Step 5f)

Already in the original report (no tautologies, no ghost loops, no CSS-class coupling, no mock-heavy tests). Re-checked with a targeted grep over `tests/`: no `expect(true).toBe(true)` or `expect(1).toBe(1)`. Nine `toEqual([])` hits, all with a companion positive case or a post-mutation expectation: `list-vehicles.test.ts:25,29` (companion at :17), `delete-vehicle.test.ts:23,25` (asserted after a delete of data created in the same test), `register-vehicle.test.ts:36`, `sign-up-with-session.test.ts:43`, `vehicle-repository.test.ts:61,108`, and `health-view.spec.ts:170` (collects page and console errors from listeners attached in the test). **Assertion quality: 0 CRITICAL, 0 WARNING (unchanged).**

### TDD compliance, updated (supersedes the first TDD compliance table)

| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | PASS | Table present in apply-progress.md and Engram #37, 55 rows covering 60/60 tasks; reconstructed and labelled as such |
| All tasks have tests | PASS | 45 complete + 1 partial + 12 N/A with legitimate reasons + 2 documentation tasks; no behavior task without a test file |
| RED confirmed (tests exist) | PASS (existence only) | 0 missing test files, 1 imprecise path (5.7/5.8). Order not independently verifiable |
| GREEN confirmed | PASS | 414 sampled now; 820/820 vitest and 34/34 E2E in the original run; no claim contradicted |
| Triangulation adequate | PASS | Concrete case lists, distinct expected values on sampled rows |
| Safety Net for modified files | WARNING | 37 of 55 rows "Not reported" |

### Re-classification of C1

**C1 is RESOLVED as a CRITICAL.** The condition that triggered it (strict-tdd-verify.md: no TDD Cycle Evidence table means CRITICAL) no longer holds: the table exists in both the openspec file and Engram, every test file it names exists, and the sampled GREEN claims match the current suite. Nothing in the table is contradicted by the codebase.

The residual gaps are carried as one WARNING:

- **W4 (process, not functional): the TDD evidence is reconstructed and incomplete.** (a) It was rebuilt after the fact from sub-agent reports, so RED and ordering are accepted as reported, not independently verified; (b) Safety Net is "Not reported" for 37 rows and REFACTOR has no evidence for 32; (c) 6.10 is partial (S1/S3/S4 characterization tests, no RED) and 6.5-6.9 E2E tests have no RED by construction; (d) minor table defects: wrong path for 5.7/5.8, "No evidence recorded" instead of N/A for 7.1/7.2, several GREEN cells without counts. None indicates a product defect; every behavior has passing, non-trivial tests. Archive should record W4 as an honest limitation, not a synthetic PASS.

### Updated totals

**0 CRITICAL, 4 WARNING (W1-W4), 4 SUGGESTION (S1, S2, S4, S5; S3 done).** Scenarios 59/59 COMPLIANT, tasks 60/60 complete, executed checks unchanged. Next recommended: `sdd-archive`.

Optional cleanups before archive (not required): fix the 5.7/5.8 path and the 7.1/7.2 cells in the table; commit `apply-progress.md` and `verify-report.md` (currently untracked).
