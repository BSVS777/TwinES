# Exploration: TwinES MVP (first milestone scope)

## Current State

- Workspace has no source code: only the business brief and the validation report (`docs/`).
- Not a git repository yet. Local toolchain available: Node.js, Java 21, Go, Python, Docker.
- Business validation (run `2026-11-19-twines-2000`) returned NO-GO as a business for now but recommended building a narrow MVP as the first milestone: vehicle registration → rule-based part health → next-maintenance calculation.

## Constraints

- First milestone is due **2026-12-05** (16 days from 2026-11-19); team of at most 2.
- The milestone centers on a full QA cycle: test plan, test report, unit tests and automated tests, plus functional, regression, security and usability results.
- The code may remain in development (documented, not finished), so future modules can stay out of scope.

## Decisions Taken With the User

| Decision | Choice | Reason |
|----------|--------|--------|
| Functional scope | Core + login with roles | Covers all five required test types (security needs auth) without over-scoping |
| Stack | TypeScript full-stack: Next.js + Prisma + SQLite, Vitest, Playwright, three.js | One language, fast scaffolding, first-class E2E tooling |
| SDD pace / store / PRs | Interactive / hybrid (openspec + Engram) / auto-chain | Collected in session preflight |

## Approaches Considered for Part Health

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| Rule-based intervals (km and months per part) | Deterministic, highly unit-testable, honest about data limits | Not "AI"; uses generic intervals | Low |
| LLM-estimated health | Matches the original vision | Non-deterministic, hard to test, needs data the MVP lacks, API cost | High |
| Telemetry/OBD-based | Real precision | Hardware, out of budget and timeline | Very high |

**Recommendation:** rule-based intervals now; keep an interface (`HealthEstimator`) so an AI estimator can be added later without touching callers.

## Approaches Considered for the 3D View

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| Generic body-type models built from primitives in three.js | No licensed assets, enough for clickable colored zones | Not the exact vehicle model | Medium |
| Licensed exact-model assets | Matches the vision | Cost, per-part segmentation work | High |
| 2D SVG diagram | Simplest, very testable | Less impressive | Low |

**Recommendation:** generic 3D by body type with an SVG 2D fallback (also used in tests and for accessibility).

## Risks

- Timeline: 16 days including test documentation; implementation must be sliced and scope frozen.
- 3D rendering is hard to assert in E2E tests; status must also be exposed as accessible text/list.
- Generic maintenance intervals are not manufacturer data and must be labeled as such.

## Ready for Proposal

Yes. Change name: `twines-mvp`.
