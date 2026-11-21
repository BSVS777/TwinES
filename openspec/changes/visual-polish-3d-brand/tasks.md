# Tasks: Visual polish — brand identity, dark mode and polished 3D vehicles with system drill-down

Change: `visual-polish-3d-brand` | Store: hybrid (this file + Engram `sdd/visual-polish-3d-brand/tasks`, `.../tasks-part-2`) | Strict TDD: on (runner `npm test` = `vitest run`; e2e `npm run test:e2e` = Playwright; both from `twines/`; coverage threshold 80%) | Inputs: `proposal.md` (rev 2), `specs/{brand-theme,vehicle-3d-assets,vehicle-health-view}/spec.md` (THEME-01..37, ASSET-01..41, VIEW-03..07 and VIEW-10..44), `design.md` (Decisions 1-20 and the Slice Plan).

Schedule: 2026-11-21 → 2026-12-04, weekends are working days, everything is merged and QA-checked before the 2026-12-05 milestone; 12-04 is QA and buffer. Path convention: every path is relative to the repository root (`C:/Users/uyv31/Downloads/Proyecto PS`); the app lives in `twines/`; commands run from `twines/`.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | about 5,100–5,400 authored additions plus deletions across 16 PRs (tests included), plus binaries (GLB, woff2) that are excluded from the count but reported per PR |
| 400-line budget risk | High (total); per PR: Low/Medium except the five PRs flagged below |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 S0a → PR 2 S1a.1 → PR 3 S1a.2 → PR 4 S0b → PR 5 S1a.3 → PR 6 S1b → PR 7 S2.1 → PR 8 S2.2a → PR 9 S2.2b → PR 10 S2.3 → PR 11 S2.4 → PR 12 S3.1 → PR 13 S3.2 → PR 14 S3.3 → PR 15 S4 → PR 16 S5 |
| Delivery strategy | auto-chain (fixed review budget: 400 changed lines per PR) |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

PRs that may exceed or sit on the 400-line budget (each has a pre-planned cut point; apply measures `git diff --stat` after each commit and uses the cut point instead of shrinking code):

| PR | Forecast | Why | Pre-planned cut point if over 400 |
|----|----------|-----|-----------------------------------|
| PR 1 S0a | 420–480 | Python generator core plus parametric shell plus README (Python counts as authored) | Cut after the commit "core + preset + guard + export" (about 230) from the commit "shell + README" (about 220): S0a-1 and S0a-2. If both stay cohesive, keep one PR and recommend `size:exception` per the chained-pr skill (design accepted slight overage) |
| PR 5 S1a.3 | about 400 | Theme logic, toggle, wiring and `theme.spec.ts` | Move `twines/tests/e2e/theme.spec.ts` to its own PR 5b (about 120) after PR 5 |
| PR 8 S2.2a | about 400 | Contract checker, loader and fixture-based tests | Cut "node, budget and extension rules" from "names, provenance and gitignore rules" |
| PR 11 S2.4 | about 420 | Camera rig, hotspots, container, test rewrite and e2e rewrite | Move the e2e rewrite (`health-view.spec.ts`) to PR 11b (about 150) |
| PR 13 S3.2 | about 420–460 (likely over) | Drill-down UI, component tests, manifest systems and the unavoidable `health-view.spec.ts` retarget | Move task 13.5 (fade, raycast rule, Outlines and emissive highlight) and its tests to PR 13b (about 150); PR 13 then holds hotspots, back control, Escape, camera focus, manifest systems and the e2e retarget |
| PR 15 S4 | 300–350 | Generator additions plus six shells plus tests (Medium) | Per-body-type split only if measured over 400 |

If an over-budget PR is cut, every later `Base` shifts to the new previous branch (the chain is linear); no task content changes.

### Chain strategy (feature-branch-chain)

- Tracker branch: `feat/visual-polish-3d-brand` (created from `main`; draft, no-merge tracker PR; only the tracker merges to `main`, after the user's decision).
- PR 1 targets the tracker branch. Every later PR N targets the branch of PR N-1. If a child PR diff shows a previous PR's changes, the base is wrong: retarget or rebase (`git rebase --onto`) until only the current work unit appears.
- The chain is ordered by planned completion date, not by track. Track A PRs (PR 1, 4, 15) touch only `twines/tools/blender/**`, `twines/public/models/**`, `openspec/**` and the manifest, so rebasing the Track B branches around them is conflict-free in practice.
- Each PR body carries the dependency diagram with the current PR marked `📍`, its start, end, prior dependencies, follow-up and out-of-scope items (chained-pr skill).

| PR | Slice | Branch | Base branch | Track | Dates (target) | Est. authored lines | Binaries |
|----|-------|--------|-------------|-------|----------------|---------------------|----------|
| 1 | S0a | `feat/vpb-01-generator-core` | `feat/visual-polish-3d-brand` | A | 11-21 → 11-22 | 420–480 | none |
| 2 | S1a.1 | `feat/vpb-02-tokens` | `feat/vpb-01-generator-core` | B | 11-21 → 11-22 | ~330 | none |
| 3 | S1a.2 | `feat/vpb-03-literal-replacement` | `feat/vpb-02-tokens` | B | 11-22 | ~250 | none |
| 4 | S0b | `feat/vpb-04-assemblies-findings` | `feat/vpb-03-literal-replacement` | A | 11-22 → 11-23 | ~250–300 | none |
| 5 | S1a.3 | `feat/vpb-05-theme-toggle` | `feat/vpb-04-assemblies-findings` | B | 11-23 | ~400 | none |
| 6 | S1b | `feat/vpb-06-logo-font-icon` | `feat/vpb-05-theme-toggle` | B | 11-24 → 11-25 | ~260 | woff2 (about 50–100 KB) |
| 7 | S2.1 | `feat/vpb-07-manifest-resolver` | `feat/vpb-06-logo-font-icon` | B | 11-25 | ~380 | none |
| 8 | S2.2a | `feat/vpb-08-contract-check` | `feat/vpb-07-manifest-resolver` | B | 11-25 → 11-26 | ~400 | none |
| 9 | S2.2b | `feat/vpb-09-optimizer-first-glbs` | `feat/vpb-08-contract-check` | A → B | 11-26 | ~150 | 3 GLBs (Corolla, engine-bay, wheel-brake) |
| 10 | S2.3 | `feat/vpb-10-glb-loading` | `feat/vpb-09-optimizer-first-glbs` | B | 11-26 → 11-27 | ~330 | none |
| 11 | S2.4 | `feat/vpb-11-viewer-container` | `feat/vpb-10-glb-loading` | B | 11-27 | ~420 | none |
| 12 | S3.1 | `feat/vpb-12-focus-logic` | `feat/vpb-11-viewer-container` | B | 11-28 | ~340 | none |
| 13 | S3.2 | `feat/vpb-13-drill-down-ui` | `feat/vpb-12-focus-logic` | B | 11-28 → 11-29 | ~420–460 | none |
| 14 | S3.3 | `feat/vpb-14-drill-down-e2e` | `feat/vpb-13-drill-down-ui` | B (+A for `sedan-generic`) | 11-30 | ~270 (200 e2e and docs, about 70 asset entries) | 1 GLB (`sedan-generic`) |
| 15 | S4 | `feat/vpb-15-remaining-shells` | `feat/vpb-14-drill-down-e2e` | A → B | production 11-24 → 11-30; PR 12-01 | 300–350 | 6 GLBs |
| 16 | S5 | `feat/vpb-16-polish-a11y-docs` | `feat/vpb-15-remaining-shells` | B | 12-01 → 12-03 | ~200–300 | none |
| — | QA and buffer | on the last PR branch (results documents only) | — | — | 12-04 | — | — |

Interpretation notes where the design and the repository differ (the implementer should treat these as decided):
1. The repository has 13 `*.module.css` files under `twines/src/` (the design said 12): the extra one is `twines/src/components/vehicle-health/VehicleHealthView.module.css`. PR 3 covers all 13.
2. `sedan-generic` is pulled forward into PR 14 (its preset is only a parameter file for the sedan topology that already exists), so the S3 e2e can assert the attention indicator on TWN-OVR (Nissan Sentra, generic sedan) as the design recommends. PR 15 therefore adds 6 shells (3 generic plus 3 specific other than Corolla), not 7.
3. Systems are added to the production manifest only in PR 13, together with the system hotspots (PR 12 holds pure modules tested on fixtures). Until then every part is a loose part (VIEW-10) with a direct hotspot, so the rotation e2e in PR 11 can still measure rotation on a part hotspot (Tires). PR 13 retargets the rotation assertions to a system hotspot and makes the part-click cases enter the system first (those e2e edits are unavoidable there: they would fail otherwise), as the design states for the rewrite.
4. `.gitignore` edits go to the repository root `.gitignore` (the only one that exists; the proposal named `twines/.gitignore`), and the contract check (PR 8) reads that file.
5. `docs/testing/traceability.md` and `docs/testing/manual-tests.md` live at the repository root `docs/testing/`, not under `twines/`.
6. Preset JSON files are imported by `manifest.ts` through a relative path; PR 7 verifies `resolveJsonModule` in `twines/tsconfig.json` and the Vitest resolution before relying on it.

### Suggested Work Units (evidence per unit)

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Generator core, parametric sedan shell, Corolla preset, export | PR 1 | `npx vitest run tests/unit/vehicle-assets/presets.test.ts` | Blender MCP: build `sedan-corolla`, in-Blender `assert_contract` passes, GLB exported; CLI `blender --background --factory-startup --python tools/blender/generate.py -- --target sedan-corolla --out tools/blender/out` if the executable is available | Delete `twines/tools/blender/**` (except assemblies from PR 4), the preset test and the `.gitignore` lines |
| 2 | Design tokens, 3D mirror and token tests | PR 2 | `npx vitest run tests/unit/brand/design-tokens.test.ts tests/unit/components/status-colors-3d.test.ts` | `npm run dev`: both themes via `color-scheme` devtools override render, status colors unchanged | Revert PR 2 (tokens additive; revert PR 3 first if it is merged) |
| 3 | Replace about 95 color literals, status swatch ring | PR 3 | `npx vitest run tests/unit/brand/no-color-literals.test.ts` | `npm run dev`: pages readable in both OS schemes | Revert PR 3 (restores literals) |
| 4 | Engine-bay and wheel/brake assemblies, S0 findings and go/no-go | PR 4 | `npx vitest run tests/unit/vehicle-assets/presets.test.ts` | Blender MCP build, export, local unmerged R3F load check with `GLTFLoader` plus `MeshoptDecoder` | Delete `twines/tools/blender/twines_gen/assemblies.py` and `s0-findings.md` |
| 5 | Theme preference, no-flash script, toggle, wiring | PR 5 | `npx vitest run tests/unit/brand tests/component/brand` and `npx playwright test tests/e2e/theme.spec.ts` | Playwright with `emulateMedia`; manual toggle in `npm run dev` | Revert PR 5; stale `twines.theme` is ignored |
| 6 | Logo, icon, self-hosted font | PR 6 | `npx vitest run tests/component/brand/logo.test.tsx` and `npx playwright test tests/e2e/brand.spec.ts` | `npm run build && npm start` offline: fonts same-origin | Revert PR 6 (favicon.ico restored by git) |
| 7 | Manifest types, resolver, scene layout, coverage scope | PR 7 | `npx vitest run tests/unit/vehicle-assets` | N/A: pure modules, no runtime boundary | Revert PR 7 (nothing consumes it yet) |
| 8 | Asset contract checker and CLI | PR 8 | `npx vitest run tests/unit/vehicle-assets/asset-contract.test.ts` | `npm run assets:check` against the repository | Revert PR 8 (nothing consumes it yet) |
| 9 | Optimizer, first three GLBs, provenance, Corolla manifest entry | PR 9 | `npx vitest run tests/unit/vehicle-assets` | `npm run assets:optimize -- sedan-corolla engine-bay wheel-brake && npm run assets:check` | Delete `twines/public/models/` and the Corolla manifest entry (resolver falls back to primitives) |
| 10 | Loader, hook, static GLB rendering, lighting, error boundary | PR 10 | `npx vitest run tests/component/vehicle-health/use-vehicle-assets.test.tsx tests/component/vehicle-health/glb-vehicle.test.tsx tests/component/vehicle-health/model-error-boundary.test.tsx` | N/A until PR 11 wires it (component-level only) | Revert PR 10 (unused by the container yet) |
| 11 | Viewer container with CameraControls auto-rotate, flat hotspots, fallbacks | PR 11 | `npx vitest run tests/component/vehicle-health/vehicle-3d.test.tsx` and `npx playwright test tests/e2e/health-view.spec.ts` | `npm run test:e2e` on the production build, Corolla shell visible on TWN-GRN | Revert PR 11 or empty `manifest.shells` (primitive viewer) |
| 12 | Focus machine, system status, fade logic (pure modules) | PR 12 | `npx vitest run tests/unit/drill-down` | N/A: pure modules, not yet imported by components | Revert PR 12 (nothing consumes it yet) |
| 13 | Systems in the manifest, drill-down UI: hotspots, back control, Escape, camera, fade, raycast, highlight | PR 13 | `npx vitest run tests/component/vehicle-health/vehicle-3d-drill-down.test.tsx tests/component/vehicle-health/vehicle-health-view.test.tsx tests/unit/vehicle-assets/manifest-integrity.test.ts` | Manual drill-down in `npm run dev` (engine bay and wheels); `npx playwright test tests/e2e/health-view.spec.ts` | Revert PR 13 or remove `systems` from the manifest (all parts become loose again) |
| 14 | Drill-down e2e, `sedan-generic`, manual tests | PR 14 | `npx playwright test tests/e2e/drill-down.spec.ts tests/e2e/health-view.spec.ts` | Full e2e on the production build | Revert PR 14 (test, docs and `sedan-generic` entries only) |
| 15 | Remaining six shells and generator features | PR 15 | `npx vitest run tests/unit/vehicle-assets` and `npx playwright test tests/e2e/vehicle-shells.spec.ts` | Regenerate all shells (`--target all`), optimize, `npm run assets:check` | Remove the six shell entries and `public/models/*` for them |
| 16 | Loading state, keyboard and screen-reader pass, e2e hardening, docs | PR 16 | `npm test` and `npx playwright test` | Three consecutive full e2e runs without flakes | Revert PR 16 (polish and docs only) |

## Legend and conventions

- Tags: `[A]` Track A (Blender asset work run by the orchestrator against the user's local Blender through the MCP); `[B]` Track B (app code); `[USER]` needs the user (sign-off or authorization); `[RED]` write the failing test and record the observed failure; `[GREEN]` the smallest code that passes; `[REFACTOR]` clean up with tests green; `[DOC]` documentation.
- Every task names its covering scenario IDs. A scenario ID is also the test case title prefix (`it("THEME-21 ...")`), so the traceability matrix can be generated by grepping.
- Work-unit commit rule: a commit holds one behavior with its tests and docs (never "tests" and "code" separately). Conventional Commits; no AI attribution. Each phase lists its planned commits. Record the commit identity next to the finished tasks.
- Per-commit proof: record the focused test command result and the runtime harness result (or `N/A` with the reason) in the PR body.
- TDD adaptation for the Python generator (Track A): it runs inside Blender, outside Vitest (proposal, Testing). The RED evidence is (a) a Node-side Vitest check on the preset JSON, (b) an in-Blender `assert_contract` guard written first and observed failing on an empty `twines-gen` scene, and (c) from PR 8 on, the committed-GLB contract check (ASSET-19..34). Python code has no coverage measurement; this is an accepted limitation (see Risks).
- `(read-only)` after a backticked path marks a path the task only reads; every other backticked path on a checkbox line is an edit target.
- Never delete comments, blank lines, docs or tests to fit the 400-line budget; slice by the cut points above or report the overage.

### Schedule and checkpoints

| Date | Track B (app) | Track A (Blender) | User action |
|------|---------------|-------------------|-------------|
| 11-21 Sat | PR 2 | PR 1 | Authorize pushing branches and opening the draft tracker PR (0.2) |
| 11-22 Sun | PR 2 done, PR 3 | PR 1 done, PR 4 start | — |
| 11-23 Mon | PR 5 (S1a merged checkpoint) | PR 4 done; S0 findings | **Sign-off 11-23**: Corolla shell and assembly screenshots; go / partial-go / no-go; also approve the Manrope choice, the logo concept and authorize the font download |
| 11-24 Tue | PR 6 | Generator features for hatch, SUV, bed start | Logo approval |
| 11-25 Wed | PR 6 done, PR 7, PR 8 start | Remaining shell production | — |
| 11-26 Thu | PR 8, PR 9, PR 10 | Final Corolla, engine-bay, wheel-brake exports (needs the S0 go) | — |
| 11-27 Fri | PR 10 done, PR 11 (S2 merged checkpoint) | Shell production continues | **Sign-off 11-27**: Corolla in the app |
| 11-28 Sat | PR 12, PR 13 start | Shell production; `sedan-generic` export | — |
| 11-29 Sun | PR 13 done | Shell production | — |
| 11-30 Mon | PR 14 (S3 merged checkpoint) | At least 4 of the remaining 7 shells exported (generic sedan included) | **Sign-off 11-30**: drill-down in the app, at least 4 shells |
| 12-01 Tue | PR 15, PR 16 start | All shells exported and optimized | — |
| 12-02 Wed | PR 16 | — | — |
| 12-03 Thu | PR 16 done (feature freeze) | — | **Sign-off 12-03**: all 8 shells, themes, final polish |
| 12-04 Fri | QA and buffer (Phase 17) | — | Final review; the decision to merge the tracker to `main` is the user's |

Missing a checkpoint triggers the next cut-line item (proposal), never a scope deferral. Cut-line order: 1 AI comparison experiment, 2 HDRI and texture supplements, 3 fine surface detail, 4 fade and camera easing tuning, 5 loading-state animation finesse, 6 logo refinement iterations. Never cut: 8 shells, both systems, attention indicator, highlight-only selection, light and dark themes with the toggle, WCAG AA, all fallbacks, Strict TDD with at least 80% coverage, the e2e suite.

Parallelism: Track A and Track B run in parallel on separate files. Within Track B the work is sequential by chain order. Safe parallel pairs: PR 1 with PR 2; PR 4 with PR 3 and PR 5; Track A shell production (generator features and presets for PR 14 and PR 15) with PR 6 to PR 13.

## Phase 0: Chain setup (once, before PR 1)

- [x] 0.1 [B] Create the tracker branch `feat/visual-polish-3d-brand` from `main` and commit the change artifacts as a docs commit: `openspec/changes/visual-polish-3d-brand/proposal.md`, `openspec/changes/visual-polish-3d-brand/design.md`, `openspec/changes/visual-polish-3d-brand/tasks.md`, `openspec/changes/visual-polish-3d-brand/specs/brand-theme/spec.md`, `openspec/changes/visual-polish-3d-brand/specs/vehicle-3d-assets/spec.md`, `openspec/changes/visual-polish-3d-brand/specs/vehicle-health-view/spec.md`. Do not include the unrelated staged archive renames or `twines/.vitest/`. Commit: `docs(sdd): add visual-polish-3d-brand proposal, specs, design and tasks`.
- [x] 0.2 [USER] Authorize remote operations explicitly: pushing the tracker and PR branches and opening the draft tracker PR (target `main`, draft, no-merge) with the Chain Context section. Until authorized, all work stays on local branches. No remote operation is performed without this answer.
- [x] 0.3 [B] Record the baseline: run `npm test`, `npm run test:e2e` and `npm run build` in `twines/` on the tracker branch and note the exact counts in the tracker PR body (regression reference for VIEW-01, 02, 08, 09).

> **Phase 0 evidence (2026-11-21):** tracker `feat/visual-polish-3d-brand` created from `main` at `adce8ae`; artifacts committed as `089f131` and pushed to `origin`. Remote operations authorized by the user on 2026-11-21. The draft tracker PR is NOT opened yet: `gh` is not installed; open it from `https://github.com/BSVS777/TwinES/pull/new/feat/visual-polish-3d-brand` (draft, target `main`). Baseline on the tracker: `npm test` 62 files / 820 tests passed; `npm run build` succeeded; `npm run test:e2e` 33 failed / 1 passed because the local environment sets `APP_ORIGIN` to an origin other than the e2e port (403 from `src/infrastructure/http/origin-check.ts:29`); with `APP_ORIGIN=http://localhost:3200` the suite passes 34/34.

## Phase 1: PR 1 / S0a — Generator core, parametric shell, Corolla preset (Track A)

Branch `feat/vpb-01-generator-core` ← base `feat/visual-polish-3d-brand` | 11-21 → 11-22 | est. 420–480 (may exceed 400; see cut point) | Covers: ASSET-35 (preset half), ASSET-37 (gitignore line), groundwork for ASSET-19..23 | Parallel with Phase 2
Commits: (1) `feat(blender): add generator core, naming guard, export and the Corolla preset`; (2) `feat(blender): add the parametric shell and the generator README`.

- [ ] 1.1 [A][RED] Create `twines/tests/unit/vehicle-assets/presets.test.ts`: every `twines/tools/blender/presets/*.json` (read-only) parses; `id` equals the file name; `bodyType` is one of sedan, hatchback, suv, pickup; `source.kind` is `parametric` or `kenney`; dimensions and profile are finite numbers; `placements` has `engine-bay` with 1 transform and `wheel-brake` with 4, each `{position, rotation, scale}` as 3-vectors. Run `npx vitest run tests/unit/vehicle-assets/presets.test.ts`; record the failure (no preset yet). Covers: ASSET-35 prerequisite.
- [ ] 1.2 [A][GREEN] Create `twines/tools/blender/presets/sedan-corolla.json` from public compact-sedan proportion data (length, width, height, wheelbase, track, overhangs, roofline, hood and cabin parameters, `cargo: "trunk"`, provisional placements). Test 1.1 passes.
- [ ] 1.3 [A][RED] Create `twines/tools/blender/twines_gen/naming.py` with the node-name constants, the regex for the allowed forms (`shell`, `shell-<piece>`, `anchor-<assembly>-<n>`, `asm-<assembly>`, `part-<partId>`, `detail-<name>`) and `assert_contract(collection, preset)` (unique names, no `.NNN` suffix, exactly one `shell` root, anchors equal the preset placements, no manufacturer or model names). Via the Blender MCP run it on an empty `twines-gen` scene and record the failure message as the RED evidence. Covers: ASSET-21, ASSET-23 (generator side).
- [ ] 1.4 [A][GREEN] Create `twines/tools/blender/twines_gen/__init__.py` (`GENERATOR_VERSION = "1.0.0"`), `scene.py` (dedicated `twines-gen` scene and collection; never touches other scenes), `materials.py` (brand PBR by role: `paint`, `glass`, `trim-dark`, `rubber`, `metal-cast`, `plastic-black`, `lens`, no brand names) and `presets.py` (JSON loader and dataclass validation).
- [ ] 1.5 [A][GREEN] Create `twines/tools/blender/twines_gen/shell.py`: lofted rounded cross-sections at stations along X, boolean wheel arches, inset glass greenhouse, bevel and weighted-normal modifiers, children named `shell-<piece>` under one `shell` root, `anchor-*` empties created from the preset placements; the `cargo` feature supports `trunk` now (`hatch` and `bed` arrive in PR 15). Target at most 100k triangles after export.
- [ ] 1.6 [A][GREEN] Create `twines/tools/blender/twines_gen/export.py` (GLB, `export_apply=True`, `export_yup=True`, active collection only, no cameras, lights, animations, skins or morphs, Draco off; every keyword validated against `bpy.ops.export_scene.gltf.get_rna_type().properties`, failing loudly on a missing one), `twines/tools/blender/twines_gen/run.py` (`main(argv)`, `reload_all()`, `--target`, `--out`) and `twines/tools/blender/generate.py` (adds its folder to `sys.path`, parses args after `--`).
- [ ] 1.7 [A] Run through the Blender MCP: build `sedan-corolla`, `assert_contract` passes (GREEN evidence), export to `twines/tools/blender/out/sedan-corolla.glb`; record raw triangle count, bytes and node list. Capture viewport screenshots (front three-quarter, side, top, rear) for the 11-23 sign-off. Never delete content outside the `twines-gen` scene.
- [ ] 1.8 [A] CLI parity: if a `blender` executable is available, run `blender --background --factory-startup --python tools/blender/generate.py -- --target sedan-corolla --out tools/blender/out` and compare the node list with 1.7; otherwise record `N/A: no CLI executable` in the PR body.
- [ ] 1.9 [A][REFACTOR] Remove duplication between `shell.py` and `naming.py`, keep modules small, confirm no manufacturer or model text appears in any name or material.
- [ ] 1.10 [DOC] Create `twines/tools/blender/README.md`: Blender 5.2.x pin, MCP snippet (`sys.path.insert`, `run.reload_all()`, `run.main([...])` with a placeholder path), CLI command, Text Editor steps, how to add a preset, the sign-off and screenshot checklist.
- [ ] 1.11 [DOC] Edit the repository root `.gitignore`: add `twines/tools/blender/out/`, `__pycache__/` and `*.blend1` (ASSET-37 groundwork; the existing `out/` rule already matches, the explicit rule documents intent).
- [ ] 1.12 [B] Run `npm test` in `twines/`; the new preset test passes and nothing else changes. Commit per the two planned commits; measure `git diff --stat` against the base and apply the cut point if over 400.

## Phase 2: PR 2 / S1a.1 — Design tokens, 3D mirror, token tests (Track B)

Branch `feat/vpb-02-tokens` ← `feat/vpb-01-generator-core` | 11-21 → 11-22 | est. ~330 | Covers: THEME-02, THEME-03, THEME-04, THEME-24, THEME-26, THEME-27, THEME-28, THEME-29, THEME-30 (token half), THEME-31 | Parallel with Phase 1
Commit: `feat(theme): add two-layer design tokens, light and dark palettes and the 3D token mirror`.

- [ ] 2.1 [B][RED] Create `twines/tests/support/css-tokens.ts`, a small CSS token resolver (parses `globals.css`, resolves `var()` chains and `light-dark(a, b)` for a chosen theme, returns hex) with its own assertions in the token test, and `twines/tests/unit/brand/design-tokens.test.ts` covering: THEME-02 (light and dark define exactly the same semantic token names, none empty), THEME-24 (status tokens are plain hex declarations outside `light-dark()`, identical in both themes), THEME-04 (accent hue differs from each status hue by at least 30 degrees; design target 100), THEME-26 and THEME-27 (text, muted text, accent text and link text pairs at least 4.5:1, large text 3:1), THEME-28 (input border, button boundary and focus tokens at least 3:1 on their surface in both themes), THEME-29 (on-status text pairs at least 4.5:1), THEME-30 (`--status-swatch-ring` at least 3:1 against the dark surface) and THEME-31 (a helper `findCompliantRing(surface, candidates)` returns null for a fixture surface where no candidate reaches 3:1, and the test asserts that this situation is reported as a failure that must not alter status colors). Run it and record the failure.
- [ ] 2.2 [B][GREEN] Edit `twines/src/app/globals.css`: primitive tokens (`--ink-0` to `--ink-950`, `--cobalt-300` to `--cobalt-700`), semantic tokens each written once with `light-dark()` per the design table (bg, surface, text, text-muted, accent, on-accent, border, border-strong, focus, status-swatch-ring, danger and on-danger chosen by the contrast test), `:root { color-scheme: light dark }` plus `:root[data-theme="light"]` and `:root[data-theme="dark"]`, status tokens kept as plain hex, base typography reading `var(--font-sans, <system stack>)` with tabular numerics for numeric columns. Keep the regexes in `twines/tests/unit/components/status-colors-3d.test.ts` and `twines/tests/component/vehicle-health/status-colors.test.tsx` passing.
- [ ] 2.3 [B][RED] Extend `twines/tests/unit/components/status-colors-3d.test.ts` for THEME-03: every `SCENE_TOKENS` entry (both themes) equals the resolved CSS token it names; a mirror entry without a CSS token and a CSS token marked as mirrored without a mirror entry both fail. Record the failure.
- [ ] 2.4 [B][GREEN] Create `twines/src/components/brand/theme/scene-tokens.ts` (`SCENE_TOKENS: Record<ResolvedTheme, { ground, shadow, ghostTint, outline, hotspotRing }>` plus the CSS token each mirrors; types `ThemePreference` and `ResolvedTheme` declared here for later reuse). Edit `twines/src/components/vehicle-health/VehicleScene.tsx` to read its colors from `SCENE_TOKENS` through a `theme` prop defaulting to `light` (the literals at lines 15-18 move); the active theme is wired in PR 5.
- [ ] 2.5 [B][REFACTOR] Run `npm test`; confirm existing `vehicle-3d.test.tsx` still passes unchanged.
- [ ] 2.6 [DOC] Add THEME-02, 03, 04, 24, 26, 27, 28, 29, 30 (token half), 31 rows to `docs/testing/traceability.md` (coverage matrix and a new "Brand and theme (THEME)" section) following the existing table format.

## Phase 3: PR 3 / S1a.2 — Replace color literals, status swatch ring (Track B)

Branch `feat/vpb-03-literal-replacement` ← `feat/vpb-02-tokens` | 11-22 | est. ~250 | Covers: THEME-01, THEME-30 (ring rendered), THEME-05/06 groundwork
Commit: `refactor(theme): replace hard-coded colors with design tokens and add the status swatch ring`.

- [ ] 3.1 [B][RED] Create `twines/tests/unit/brand/no-color-literals.test.ts` (THEME-01): scan `twines/src/**/*.{css,ts,tsx}` for hex, `rgb()`, `hsl()` and named colors; the allow-list is `twines/src/app/globals.css`, `twines/src/components/brand/theme/scene-tokens.ts`, `twines/src/components/vehicle-health/status-colors.ts` and `twines/src/app/icon.svg` (the last arrives in PR 6). Record the failure with the offending file list (about 95 literals).
- [ ] 3.2 [B][RED] Create `twines/tests/unit/brand/status-swatch-ring.test.ts` (THEME-30, rendered half): every swatch selector in `StatusBadge.module.css`, `PartList.module.css`, `HealthSummary.module.css` and `VehicleDiagram2D.module.css` declares a ring built from `var(--status-swatch-ring)` in both themes, and the status text node is still rendered next to it (render `StatusBadge` and `PartList` rows with the component test harness). Record the failure.
- [ ] 3.3 [B][GREEN] Replace literals with `var(--…)` in `twines/src/app/(auth)/layout.module.css`, `twines/src/components/auth/app-shell.module.css` and `twines/src/components/forms/auth-form.module.css`.
- [ ] 3.4 [B][GREEN] Replace literals in `twines/src/app/vehicles/vehicles-page.module.css`, `twines/src/components/vehicles/vehicle-list.module.css` and `twines/src/components/vehicles/delete-vehicle-button.module.css`.
- [ ] 3.5 [B][GREEN] Replace literals and add the swatch ring in `twines/src/components/vehicle-health/HealthSummary.module.css`, `PartDetailPanel.module.css`, `PartList.module.css`, `StatusBadge.module.css`, `VehicleDiagram2D.module.css`, `VehicleHealthView.module.css` and `Vehicle3D.module.css` (all under `twines/src/components/vehicle-health/`). Any inline color in `.tsx` files found by 3.1 moves to tokens or `scene-tokens.ts`.
- [ ] 3.6 [B][REFACTOR] Visual check in `npm run dev` with the OS scheme light and dark (devtools emulation): no unreadable text, status colors unchanged. Run `npm test` and `npm run test:e2e` (regression).
- [ ] 3.7 [DOC] Add THEME-01 and THEME-30 (ring) rows to `docs/testing/traceability.md`.

## Phase 4: PR 4 / S0b — Assemblies, S0 findings, go/no-go (Track A)

Branch `feat/vpb-04-assemblies-findings` ← `feat/vpb-03-literal-replacement` | 11-22 → 11-23 | est. ~250–300 | Covers: ASSET-19, ASSET-20 (generator side), S0 criteria | Parallel with Phase 3 and Phase 5
Commit: `feat(blender): add the engine-bay and wheel-brake assemblies and the S0 findings`.

- [ ] 4.1 [A][RED] Extend `twines/tests/unit/vehicle-assets/presets.test.ts` to require, for `sedan-corolla.json`, finite `placements["engine-bay"][0]` and four `placements["wheel-brake"]` transforms and per-assembly dimension parameters; and extend `assert_contract` in `twines/tools/blender/twines_gen/naming.py` so an assembly collection must contain exactly one `asm-<assembly>` root with direct `part-<partId>` children, one mesh and one primitive each. Run both against the current state and record the failures.
- [ ] 4.2 [A][GREEN] Create `twines/tools/blender/twines_gen/assemblies.py`: `engine_bay()` with `asm-engine-bay` and 6 `part-*` nodes (`part-engine-oil`, `part-oil-filter`, `part-air-filter`, `part-spark-plugs`, `part-coolant`, `part-battery`) plus `detail-*` nodes (block, hoses, bracket) and `wheel_brake()` with `asm-wheel-brake`, `part-tires`, `part-brake-pads`, rim and disc details; one material per part mesh; no brand names. Update `twines/tools/blender/twines_gen/run.py` for `--target engine-bay|wheel-brake|all`.
- [ ] 4.3 [A] Via the Blender MCP: build and export both assemblies to `twines/tools/blender/out/`; `assert_contract` passes; every part separable and individually highlightable; record triangles, bytes, node names, assembly-local bounds and part anchors (these numbers feed PR 7's manifest). Capture screenshots of the engine bay (6 parts distinguishable) and the wheel with brake.
- [ ] 4.4 [A] Local unmerged runtime check (nothing committed): in a scratch directory outside the repository install the exact-pinned `@gltf-transform/core`, `@gltf-transform/extensions`, `@gltf-transform/functions` and `meshoptimizer` (the project's normal npm channel), optimize the three raw GLBs with `dedup`, `prune({ keepLeaves: true })`, `weld`, `meshopt`, then load them in a local R3F harness using `GLTFLoader` and `MeshoptDecoder` from `three/examples/jsm`. Record: shell at most 100k triangles and 2.5 MB, each assembly at most 1 MB, node names exact, loads, existing `npm test` still passes (S0 runtime criterion).
- [ ] 4.5 [A][DOC] Create `openspec/changes/visual-polish-3d-brand/s0-findings.md`: measured triangles, bytes, node names, anchors and bounds, screenshot references, result per S0 criterion (Look, Shell budget, Assemblies, Node contract, Runtime) and the go / partial-go / no-go proposal per asset class.
- [ ] 4.6 [USER] **Sign-off 11-23.** The user reviews the screenshots and the findings and decides go, partial-go or no-go for each asset class. Batch in the same request: approve the Manrope font choice and the logo concept (PR 6), and authorize the Manrope download (see 6.1).
- [ ] 4.7 [A] If the decision is partial-go or no-go, record the fallback in `s0-findings.md`: parametric look fails → Kenney Car Kit CC0 shells restyled (adds tasks 4.8 and a `twines_gen/kenney.py` module, Decision 16); procedural assemblies fail → code-built assemblies (`AssemblySource` kind `code`; the spec ASSET-19/20 needs an amendment, which returns to the user before PR 7).
- [ ] 4.8 [USER] Only if the Kenney fallback is chosen: authorize the Kenney Car Kit download (remote fetch); then add `twines/tools/blender/twines_gen/kenney.py`, `twines/tools/blender/vendor/kenney-car-kit/**` and the preset `source` switch in the same PR as an extra commit `feat(blender): add the Kenney CC0 fallback path`. Skipped when the decision is go.
- [ ] 4.9 [B] Run `npm test`; commit and measure `git diff --stat` (budget 400).

## Phase 5: PR 5 / S1a.3 — Theme preference, no-flash script, toggle and wiring (Track B)

Branch `feat/vpb-05-theme-toggle` ← `feat/vpb-04-assemblies-findings` | 11-23 (S1a merged checkpoint) | est. ~400 (at the limit; cut point: `theme.spec.ts` to PR 5b) | Covers: THEME-05..23, THEME-25, THEME-08 (hook and prop), THEME-07 (e2e)
Commits: (1) `feat(theme): add theme preference resolution, boot script and store`; (2) `feat(theme): add the system, light and dark toggle and wire the shell`; (3) `test(theme): add the theme e2e specs`.

- [ ] 5.1 [B][RED] Create `twines/tests/unit/brand/theme-preference.test.ts`: table-driven `parseStoredPreference` (invalid, null, other strings → `system`; `light`, `dark` kept) and `resolveTheme` (stored choice wins; OS dark/light; `null` OS → light). Covers THEME-09, THEME-10, THEME-12, THEME-17. Record the failure.
- [ ] 5.2 [B][RED] Create `twines/tests/unit/brand/theme-boot-script.test.ts`: execute the exported `THEME_BOOT_SCRIPT` string with `new Function` against fake `document`, `localStorage` and `matchMedia`: stored dark over OS light (THEME-21), OS dark without storage (THEME-22), invalid stored value (THEME-17), throwing storage (THEME-18), no `matchMedia` (THEME-12). Assert `data-theme`, `data-theme-preference` and `style.colorScheme`.
- [ ] 5.3 [B][RED] Create `twines/tests/component/brand/theme-toggle.test.tsx` (three native radios in a fieldset with a visually hidden legend, checked state, accessible names, arrow-key change keeps focus, writes and removes `twines.theme`, applies attributes, survives throwing storage: THEME-13, 14, 16, 18, 20), `twines/tests/component/brand/theme-sync.test.tsx` (reacts to a `matchMedia` change only while the preference is `system`: THEME-11; reacts to a `storage` event from another tab: THEME-15) using `twines/tests/component/vehicle-health/match-media.ts` (read-only), and `twines/tests/component/brand/use-resolved-theme.test.tsx` (hook follows `data-theme` through a `MutationObserver`; `VehicleScene` receives the resolved theme: THEME-08 logic half).
- [ ] 5.4 [B][GREEN] Create `twines/src/components/brand/theme/theme-preference.ts` (pure `parseStoredPreference`, `resolveTheme`, `THEME_STORAGE_KEY = "twines.theme"`) and `twines/src/components/brand/theme/theme-boot-script.ts` (static ES5 string, no interpolation, applies the same semantics, all storage access in `try/catch`).
- [ ] 5.5 [B][GREEN] Create `twines/src/components/brand/theme/theme-store.ts` (browser-only subscribe, read, write, apply, same-tab custom event, all storage access in `try/catch`), `twines/src/components/brand/theme/useThemePreference.ts` and `twines/src/components/brand/theme/useResolvedTheme.ts` (`useSyncExternalStore`, server snapshot `system`, same pattern as `usePrefersReducedMotion.ts` (read-only)).
- [ ] 5.6 [B][GREEN] Create `twines/src/components/brand/ThemeSync.tsx` and `twines/src/components/brand/ThemeToggle.tsx` with `twines/src/components/brand/ThemeToggle.module.css` (segmented control, tokens only, visible focus ring).
- [ ] 5.7 [B][GREEN] Wire: edit `twines/src/app/layout.tsx` (`<html lang="en" suppressHydrationWarning>`, `<head>` with the boot script through `dangerouslySetInnerHTML`, `ThemeSync` in `<body>`), `twines/src/components/auth/app-shell.tsx` and `twines/src/components/auth/app-shell.module.css` (toggle in the header), `twines/src/app/(auth)/layout.tsx` and `twines/src/app/(auth)/layout.module.css` (toggle on sign-in and sign-up), and pass `useResolvedTheme()` into the scene colors in `twines/src/components/vehicle-health/Vehicle3D.tsx` and `twines/src/components/vehicle-health/VehicleScene.tsx`. Run the new unit and component tests until green.
- [ ] 5.8 [B][RED] Create `twines/tests/e2e/theme.spec.ts` with `page.emulateMedia({ colorScheme })`: THEME-05, 06 (root attribute and token values), THEME-07 (2D diagram follows the theme; reuse the no-WebGL approach from `twines/tests/e2e/health-view.spec.ts` (read-only)), THEME-09, 10, 11 (emulated change while open), 14, 15 (reload and new tab), 16, 19 (no `/api/*` request carries the choice, observed through a request listener), 21, 22 (attribute at the first `requestAnimationFrame` captured by an init script), 23 (no hydration or console errors), 25 (a vehicle with parts in all four statuses shows status text in light and dark). Record the failures, then make them pass with 5.4 to 5.7.
- [ ] 5.9 [B][REFACTOR] Run `npm test`, `npm run test:e2e -- theme.spec.ts`, `npm run test:e2e` (full regression) and `npm run build`. Manual: toggle in `npm run dev`, confirm the stage background follows the theme.
- [ ] 5.10 [B] Measure `git diff --stat`; if over 400, move commit (3) to PR 5b per the cut point.
- [ ] 5.11 [DOC] Traceability rows for THEME-05..23 and 25 are consolidated in PR 16 (no headroom here); record the planned test IDs in the PR body.

## Phase 6: PR 6 / S1b — Logo, icon, self-hosted font (Track B)

Branch `feat/vpb-06-logo-font-icon` ← `feat/vpb-05-theme-toggle` | 11-24 → 11-25 | est. ~260 | Covers: THEME-32..37 | Needs the user (authorization and logo approval, batched on 11-23)
Commits: (1) `feat(brand): add the TwinES logo, site icon and shell integration`; (2) `feat(brand): self-host the Manrope variable font with next/font`.

- [ ] 6.1 [USER] Before 6.5: authorize one download of the Manrope Variable latin woff2 plus `OFL.txt`, from the `@fontsource-variable/manrope` npm package or from the Google Fonts GitHub repository (the user picks), and approve Manrope itself. Fetch into a new, empty scratch directory (untrusted data), copy only the woff2 and the licence text, and do not add the package as a dependency. Requested together with the 11-23 sign-off so it does not block.
- [ ] 6.2 [B][RED] Create `twines/tests/component/brand/logo.test.tsx`: with a `title` prop it renders `role="img"` and accessible name "TwinES"; without one it renders `aria-hidden="true"` (THEME-34); paths use `fill="currentColor"` and no color literal (THEME-33). Create `twines/tests/component/brand/logo-placement.test.tsx`: `AppShell` and the `(auth)` layout render the logo, hidden from assistive technology when adjacent text already names the product (THEME-32, THEME-34). Record the failure.
- [ ] 6.3 [B][RED] Create `twines/tests/e2e/brand.spec.ts`: logo present in the shell header and on sign-in and sign-up (THEME-32); `/icon.svg` served with 200, `<link rel="icon">` points to it and no `/favicon.ico` request is needed (THEME-35); all font requests go to the app origin and none to a third-party host (THEME-36); with the font file blocked by `page.route`, text stays visible in a fallback font and the layout holds (THEME-37). Record the failure.
- [ ] 6.4 [B][GREEN] Create `twines/src/components/brand/Logo.tsx` (`Logo` mark plus wordmark converted to paths, and `LogoMark`; `currentColor`; optional `title`; concept: two mirrored rounded halves around a wheel or gauge arc) and `twines/src/app/icon.svg` (accent color with an embedded `prefers-color-scheme` style); delete `twines/src/app/favicon.ico`. Update the allow-list consumer: `icon.svg` is already allowed in `twines/tests/unit/brand/no-color-literals.test.ts`.
- [ ] 6.5 [B][GREEN] Create `twines/src/app/fonts.ts` (`next/font/local`, `variable: "--font-sans"`, `display: "swap"`, system fallback stack, automatic fallback metrics), `twines/src/app/fonts/Manrope-Variable.woff2` and `twines/src/app/fonts/OFL.txt` (binary and licence text are not authored lines; bytes reported in the PR body); edit `twines/src/app/layout.tsx` to add the font variable class.
- [ ] 6.6 [B][GREEN] Integrate the logo: edit `twines/src/components/auth/app-shell.tsx`, `twines/src/components/auth/app-shell.module.css`, `twines/src/app/(auth)/layout.tsx` and `twines/src/app/(auth)/layout.module.css`.
- [ ] 6.7 [B][REFACTOR] Run `npm test`, `npm run build` (must succeed with no network access to font hosts) and `npm run test:e2e -- brand.spec.ts theme.spec.ts`.
- [ ] 6.8 [USER] Logo approval: show the rendered logo (light and dark) and the icon; the first approved version ships (cut-line 6 limits refinement rounds).
- [ ] 6.9 [DOC] Add THEME-32..37 rows to `docs/testing/traceability.md`.

## Phase 7: PR 7 / S2.1 — Manifest types, budgets, resolver, scene layout, coverage scope (Track B)

Branch `feat/vpb-07-manifest-resolver` ← `feat/vpb-06-logo-font-icon` | 11-25 | est. ~380 | Covers: ASSET-02, 03, 05, 08..14, 18, 35 (checks vacuous until shells land), VIEW-10 (data half), ASSET-07 (data half) | Depends on: Phase 4 numbers (assembly anchors and bounds)
Commit: `feat(assets): add the vehicle asset manifest types, the shell resolver and the scene layout`.

- [ ] 7.1 [B][RED] Create `twines/tests/unit/vehicle-assets/resolve-shell.test.ts` with fixture manifests: `normalizeName` (trim, collapse whitespace, lower-case); ASSET-08 (Toyota Corolla sedan → Corolla shell), ASSET-09 (`" toyota "`, `"COROLLA  "`), ASSET-10 (seeded specific vehicles; read `twines/prisma/seed-data.ts` (read-only) for the data), ASSET-11 (Sentra and Rio → generic), ASSET-12 (Camry sedan → generic), ASSET-13 (Honda Fit as suv → generic suv), ASSET-14 (unknown pickup → generic pickup), ASSET-18 (empty manifest → `null`). Record the failure.
- [ ] 7.2 [B][RED] Create `twines/tests/unit/vehicle-assets/manifest-integrity.test.ts`: ASSET-02 (each of the 8 catalog part IDs mapped by exactly one assembly node, no node maps outside the catalog), ASSET-03 (system members are catalog parts, in one system only, each system has assembly, label and focus anchor), ASSET-05 (each shell has a placement for every assembly that maps a part), `focusInstance` below the placement count, ASSET-35 (each shell has exactly one preset file in `twines/tools/blender/presets` (read-only) and no orphan preset). Fixture manifests cover the failing cases; the real manifest check is added as shells land.
- [ ] 7.3 [B][RED] Create `twines/tests/unit/vehicle-assets/scene-layout.test.ts`: world positions of part hotspots from placement plus local anchor, loose parts (in no system) get a direct zone on instance 0 (VIEW-10 data half), each system's hotspot anchor and focus box (placement applied to the local bounds plus a margin), `assetUrls`, and a fixture third system `fixture-system` with two catalog parts (ASSET-07 data half).
- [ ] 7.4 [B][GREEN] Create `twines/src/components/vehicle-health/assets/types.ts` (manifest types from the design), `twines/src/components/vehicle-health/assets/budgets.ts` (budget constants 100,000 triangles, 2,500,000 and 1,000,000 bytes, extension allow-list `EXT_meshopt_compression`, `KHR_mesh_quantization`, `KHR_materials_emissive_strength`, `KHR_texture_transform`, `EXT_texture_webp`), `twines/src/components/vehicle-health/assets/resolve-shell.ts` and `twines/src/components/vehicle-health/assets/scene-layout.ts`.
- [ ] 7.5 [B][GREEN] Create `twines/src/components/vehicle-health/assets/manifest.ts` as a skeleton: assemblies `engine-bay` and `wheel-brake` with the part nodes, local anchors and bounds measured in `s0-findings.md` (read-only), empty `shells` and empty `systems`; verify `resolveJsonModule` in `twines/tsconfig.json` and that Vitest resolves the relative JSON import path used from here on.
- [ ] 7.6 [B][GREEN] Edit `twines/vitest.config.ts`: add `src/components/vehicle-health/assets/**/*.ts`, `src/components/vehicle-health/drill-down/**/*.ts`, `src/components/brand/theme/theme-preference.ts` and `scripts/assets/**/*.ts` to `coverage.include`; confirm the 80% thresholds still pass (`npm test`).
- [ ] 7.7 [B][REFACTOR] Run `npm test`; the existing component tests are untouched.
- [ ] 7.8 [DOC] Add ASSET-02, 03, 05, 08..14, 18, 35 and VIEW-10 rows to `docs/testing/traceability.md` (new "Vehicle 3D assets (ASSET)" section).

## Phase 8: PR 8 / S2.2a — Asset contract checker and CLI (Track B)

Branch `feat/vpb-08-contract-check` ← `feat/vpb-07-manifest-resolver` | 11-25 → 11-26 | est. ~400 (cut point: node/budget rules vs names/provenance/gitignore rules) | Covers: ASSET-06, 19..34, 37, 39, 40, 41
Commit: `feat(assets): add the GLB asset contract check and the assets:check command`.

- [ ] 8.1 [B] Install exact-pinned devDependencies in `twines/package.json` (and lockfile): `@gltf-transform/core`, `@gltf-transform/extensions`, `@gltf-transform/functions`, `meshoptimizer` and `tsx` if absent; add the script `assets:check` (`tsx scripts/assets/check.ts`). Packages come from the project's normal npm registry channel.
- [ ] 8.2 [B][RED] Create `twines/tests/unit/vehicle-assets/asset-contract.test.ts` building in-memory fixture GLBs with `@gltf-transform/core` `Document` (no binary fixtures committed): ASSET-19 (engine-bay has exactly the 6 part nodes), ASSET-20 (wheel-brake has `part-tires` and `part-brake-pads`), ASSET-21 (one `shell` root plus manifest anchors), ASSET-22 (missing node named in the violation), ASSET-23 (unexpected, duplicated or `.001` node named), ASSET-24 (80,000 triangles and 2.0 MB pass), ASSET-25 (100,001 triangles reported with the limit), ASSET-26 (over 2.5 MB), ASSET-27 (assembly over 1 MB), ASSET-28 (unsupported extension named, Draco rejected), ASSET-29 (brand names in node, mesh, material or texture names), ASSET-30 (unlisted image), ASSET-31 (missing no-logos declaration), ASSET-32 (complete provenance), ASSET-33 (orphan record or missing record), ASSET-34 (licence allow-list and `paidService: false`), ASSET-37 (`.gitignore` covers `twines/tools/blender/out/`; tracked-file check reads the text, no `git` command), ASSET-40 (an oversized GLB and a GLB with a missing node are both reported with file and rule in one run). Record the failure.
- [ ] 8.3 [B][RED] In the same file add the real-repository cases: ASSET-06 (every file the manifest names exists in `twines/public/models`; vacuous until PR 9), ASSET-39 (clean repository passes and reports the files it checked), ASSET-41 (the test is part of the `unit` project of `npm test`; assert it runs without Blender or WebGL).
- [ ] 8.4 [B][GREEN] Create `twines/scripts/assets/contract.ts`: pure `checkAssetContract(input): Violation[]` implementing every rule with the design tolerances (anchors 1e-3, bounds 1e-2, triangles by index count divided by 3), and `Violation { file, rule, detail }`, `ContractInput`, `ProvenanceEntry` types.
- [ ] 8.5 [B][GREEN] Add `loadContractInput(twinesRoot)` in `twines/scripts/assets/contract.ts` (reads the manifest, `public/models/*.glb` through `NodeIO` with the meshopt decoder registered, `public/models/provenance.json`, preset ids and the repository root `.gitignore`) and create `twines/scripts/assets/check.ts` (prints a report, exits non-zero on violations).
- [ ] 8.6 [B][REFACTOR] Run `npm test` and `npm run assets:check`; confirm coverage of `scripts/assets/**` is at least 80%.
- [ ] 8.7 [DOC] Add ASSET-06, 19..34, 37, 39, 40, 41 rows to `docs/testing/traceability.md`.

## Phase 9: PR 9 / S2.2b — Optimizer, first three GLBs, provenance, Corolla entry (Track A then B)

Branch `feat/vpb-09-optimizer-first-glbs` ← `feat/vpb-08-contract-check` | 11-26 | est. ~150 plus binaries | Covers: ASSET-01 (partial), ASSET-06, ASSET-24, ASSET-32, ASSET-39 on the real repository | Depends on: S0 decision go (Phase 4)
Commit: `feat(assets): add the GLB optimizer and the first optimized models with provenance`.

- [ ] 9.1 [A] Via the Blender MCP produce the final raw exports `twines/tools/blender/out/sedan-corolla.glb`, `twines/tools/blender/out/engine-bay.glb` and `twines/tools/blender/out/wheel-brake.glb` with the `assert_contract` guard passing (apply the S0 go/no-go outcome and any feedback from the 11-23 sign-off). Record Blender version and generator version for provenance.
- [ ] 9.2 [B][RED] Create `twines/tests/unit/vehicle-assets/optimize.test.ts`: optimizing an in-memory `Document` with `dedup`, `prune({ keepLeaves: true })`, `weld` and `meshopt({ encoder, level: "medium" })` keeps every named part node and empty anchor node, and enables `EXT_meshopt_compression` only (this verifies the option names against the installed library versions, Decision 10). Add the Corolla `ShellAsset` entry (id `sedan-corolla`, `/models/sedan-corolla.glb`, specific match Toyota Corolla sedan, placements imported from the preset JSON (read-only)) to `twines/src/components/vehicle-health/assets/manifest.ts`; the real-repository contract test (ASSET-06, ASSET-39) now fails because the GLBs and the provenance entries are missing. Record both failures.
- [ ] 9.3 [B][GREEN] Create `twines/scripts/assets/optimize.ts` (reads `tools/blender/out/<id>.glb`, writes `public/models/<id>.glb`, prints bytes and triangles per file, optional ids as arguments) and add the script `assets:optimize` to `twines/package.json`. Texture compression stays out until a committed asset carries an image (cut-line 2).
- [ ] 9.4 [B][GREEN] Run `npm run assets:optimize -- sedan-corolla engine-bay wheel-brake` to create `twines/public/models/sedan-corolla.glb`, `twines/public/models/engine-bay.glb` and `twines/public/models/wheel-brake.glb`, and create `twines/public/models/provenance.json` with 3 complete entries (generator, preset, versions, Blender version, `licence: "project-original"`, `paidService: false`, `noLogosBadgesOrBrandNames: true`, `images: []`). Update the manifest assembly bounds and anchors if the contract check prints different measured values. `npm run assets:check` passes.
- [ ] 9.5 [B][REFACTOR] Run `npm test`; report the added bytes per GLB in the PR body (running total toward the 25 MB LFS decision threshold).

## Phase 10: PR 10 / S2.3 — Loader, hook, static GLB rendering, lighting, error boundary (Track B)

Branch `feat/vpb-10-glb-loading` ← `feat/vpb-09-optimizer-first-glbs` | 11-26 → 11-27 | est. ~330 | Covers: ASSET-15, ASSET-16 (logic), VIEW-13, VIEW-14 (logic), Decision 12, 13 and 14 groundwork
Commit: `feat(viewer): load shell and assembly GLBs with errors as data and render them statically`.

- [ ] 10.1 [B][RED] Create `twines/tests/unit/vehicle-assets/load-vehicle-assets.test.ts` (mock `GLTFLoader`): the module cache returns the same promise per URL, deletes the entry when the promise rejects so a later mount retries, and never configures Draco or a remote decoder path.
- [ ] 10.2 [B][RED] Create `twines/tests/component/vehicle-health/use-vehicle-assets.test.tsx`: `{ status: "loading" }` then `"ready"` with the gltfs; a rejected shell → `"error"`; a resolved shell with a rejected assembly → `"error"` (partial model never used: ASSET-16, VIEW-14); no thrown error reaches an error boundary.
- [ ] 10.3 [B][RED] Create `twines/tests/component/vehicle-health/glb-vehicle.test.tsx` (mocked `@react-three/fiber` and drei): the cached scene is cloned and its materials cloned once per mount; one assembly instance is rendered per placement transform (1 engine bay, 4 wheel-brake); the cache is not mutated. Create `twines/tests/component/vehicle-health/model-error-boundary.test.tsx`: a throwing child renders the fallback and the boundary logs through the test's console spy only.
- [ ] 10.4 [B][GREEN] Create `twines/src/components/vehicle-health/three/load-vehicle-assets.ts` (`GLTFLoader` from `three/examples/jsm/loaders/GLTFLoader.js`, `MeshoptDecoder` from `three/examples/jsm/libs/meshopt_decoder.module.js`, module-level `Map<url, Promise<GLTF>>`), `twines/src/components/vehicle-health/three/useVehicleAssets.ts` (parallel `Promise.all`, `loading | ready | error`) and `twines/src/components/vehicle-health/three/ModelErrorBoundary.tsx`.
- [ ] 10.5 [B][GREEN] Create `twines/src/components/vehicle-health/three/GlbVehicle.tsx` (static rendering: clone shell, clone materials once, assembly instances per placement) and `twines/src/components/vehicle-health/three/SceneLighting.tsx` (drei `Environment` with `Lightformer` children, never a `preset`; one directional key light; `ContactShadows frames={1}` re-keyed when the model becomes ready; colors from `SCENE_TOKENS`).
- [ ] 10.6 [B][REFACTOR] Run `npm test`; confirm no new file imports a remote URL (grep for `gstatic`, `cdn`, `https://`).

## Phase 11: PR 11 / S2.4 — Viewer container, CameraControls auto-rotate, flat hotspots, fallbacks (Track B)

Branch `feat/vpb-11-viewer-container` ← `feat/vpb-10-glb-loading` | 11-27 (S2 merged checkpoint) | est. ~420 (cut point: e2e rewrite to PR 11b) | Covers: VIEW-03, 04 (rotation pause half), 06, 07, 10, 13, 14, 15, 16, 44 (minimal), ASSET-15, 16, 17, 18, 38, THEME-08
Commits: (1) `feat(viewer): resolve the shell and render it with CameraControls and flat hotspots`; (2) `test(e2e): cover the GLB fallbacks, the asset origin and auto-rotation`.

- [ ] 11.1 [B][RED] Rewrite `twines/tests/component/vehicle-health/vehicle-3d.test.tsx`: mock `@react-three/fiber` (`Canvas`, `useFrame`, `createPortal`), `@react-three/drei` (`Html` keeping the portal attribute from the current lines 16-20, `CameraControls` as a recorder of props and imperative calls, `Outlines`, `Environment`, `Lightformer`, `ContactShadows`), `three/load-vehicle-assets` (resolve or reject) and `GlbVehicle`/`VehicleScene` as attribute doubles. Assert: resolved shell id (VIEW-03), accessible loading status and its removal (VIEW-44), shell or assembly error → primitive scene with 8 flat part buttons and no system hotspot (VIEW-13, 14, 15, ASSET-15, 16), emptied manifest → primitive (ASSET-18), loose parts get direct hotspots (VIEW-10), auto-rotate flag on the rig double (VIEW-04, 07; the cases at lines 108-136 migrate from `OrbitControls` attributes to the rig double), token-driven scene colors follow the theme (THEME-08). Record the failure.
- [ ] 11.2 [B][RED] Extend `twines/tests/component/vehicle-health/vehicle-health-view.test.tsx`: `make` and `model` are passed through to the visual; part list selection still works with the new container. Record the failure.
- [ ] 11.3 [B][RED] Rewrite the orbit and rotation assertions in `twines/tests/e2e/health-view.spec.ts` (current lines 119-138 and 173-187) for `CameraControls` auto-rotate; add VIEW-13 (`page.route("**/models/*.glb", r => r.abort())`, `pageerror` none, console errors other than the induced resource failure none, parts list shows 8 parts), ASSET-15 and ASSET-16 (abort only `**/models/engine-bay.glb`), ASSET-38 (every request goes to the app origin), ASSET-17 (no `.glb` request without WebGL; extends the VIEW-06 case at lines 140-171), VIEW-16 (2D diagram has no system hotspot, fade or focus control). Rotation is measured on the Tires part hotspot until PR 13 retargets it to a system hotspot (all parts are loose until systems enter the manifest in PR 13). Target TWN-GRN (Corolla) for the GLB cases; other vehicles use the primitive path until PR 15. Record the failures.
- [ ] 11.4 [B][GREEN] Create `twines/src/components/vehicle-health/three/CameraRig.tsx` (drei `CameraControls` `makeDefault`, initial `setLookAt(5, 2.8, 5, 0, 0.9, 0, false)`, `minDistance` 4, `maxDistance` 12, `maxPolarAngle` π/2 − 0.05, `smoothTime` 0.35, pan disabled, per-frame azimuth rotation `AUTO_ROTATE_RAD_PER_SEC = 2π / 75` guarded by `enabled` and not dragging) and `twines/src/components/vehicle-health/three/Hotspots.tsx` (drei `Html` DOM buttons for loose parts only in this PR).
- [ ] 11.5 [B][GREEN] Edit `twines/src/components/vehicle-health/vehicle-visual.ts` (add `make` and `model` to `VehicleVisualProps`), `twines/src/components/vehicle-health/VehicleHealthView.tsx` (pass them; selection ownership unchanged) and rewrite `twines/src/components/vehicle-health/Vehicle3D.tsx` as the container: `resolveShell`, `buildSceneLayout`, `useVehicleAssets`, `GlbVehicle` or the primitive `VehicleScene` (design Decision 19), `ModelErrorBoundary`, `SceneLighting`, optional `manifest` prop defaulting to the production manifest (for fixtures), stage data attributes `data-model-source`, `data-shell`, `data-model-ready`, minimal loading overlay in `twines/src/components/vehicle-health/Vehicle3D.module.css`. Auto-rotate uses `autoRotateEnabled` semantics (idle, no selection, no reduced motion) without the focus machine yet. `twines/src/components/vehicle-health/models/**` stays untouched (read-only).
- [ ] 11.6 [B][REFACTOR] Run `npm test`, `npm run test:e2e`, `npm run build`; `twines/tests/unit/components/vehicle-health-models.test.ts` (read-only) must pass unchanged. Measure `git diff --stat`.
- [ ] 11.7 [USER] **Sign-off 11-27.** The user checks the Corolla shell in the running app (screenshots or `npm run dev`).
- [ ] 11.8 [DOC] Add VIEW-03, 06, 07, 10, 13..16, 44, ASSET-15..18, 38 and THEME-08 rows to `docs/testing/traceability.md` only if headroom remains; otherwise PR 16 consolidates.

## Phase 12: PR 12 / S3.1 — Focus machine, system status, fade logic (Track B)

Branch `feat/vpb-12-focus-logic` ← `feat/vpb-11-viewer-container` | 11-28 | est. ~340 | Covers: VIEW-17/18 (logic), 22 (logic), 28, 29, 31..42 (logic), VIEW-05/11 (logic: selection never dispatches focus). Pure modules only, tested on fixtures; the production manifest `systems` entries and ASSET-04 move to PR 13 so the PR 11 flat hotspots keep working until the system hotspots exist.
Commit: `feat(drill-down): add the focus state machine, system status derivations and fade stepping`.

- [ ] 12.1 [B][RED] Create `twines/tests/unit/drill-down/focus-machine.test.ts`: the full transition table (idle → focusing → focused → exiting → idle, close during focusing, reset), out-of-phase `transition-end` returns the same object, an `open` during exiting is ignored, repeated `open` is idempotent (VIEW-29), selectors `activeSystemId`, `showsSystemHotspots`, `shellOpacityTarget`, `autoRotateEnabled` (idle, no selection, no reduced motion: VIEW-28, VIEW-04, VIEW-07). Record the failure.
- [ ] 12.2 [B][RED] Create `twines/tests/unit/drill-down/system-status.test.ts`: `systemAttention` returns the worst child status via the domain `worstStatus` (VIEW-31), yellow is enough (VIEW-32), null when all green (VIEW-33), updates after a service-state change (VIEW-34 logic), overall status unaffected (VIEW-36); `systemContainingPart` (VIEW-37..41); `systemHotspotLabel` includes label, attention text and the selected-part text, never color only (VIEW-35, VIEW-42).
- [ ] 12.3 [B][RED] Create `twines/tests/unit/drill-down/fade.test.ts`: `stepOpacity` damps toward the target and snaps under reduced motion or within 0.01 (VIEW-17, VIEW-18), `materialModeFor` flips `transparent` and `depthWrite` only at the opacity threshold, `shellIsInteractive` is true only in `idle` (VIEW-22 logic).
- [ ] 12.4 [B][GREEN] Create `twines/src/components/vehicle-health/drill-down/focus-machine.ts`, `twines/src/components/vehicle-health/drill-down/system-status.ts` and `twines/src/components/vehicle-health/drill-down/fade.ts` per the design interfaces (reducer under 60 lines, framework-free).
- [ ] 12.5 [B][REFACTOR] Run `npm test`; confirm the coverage of `src/components/vehicle-health/drill-down/**` is at least 80% and that no production component imports the new modules yet (the PR 11 behavior is unchanged).
- [ ] 12.6 [DOC] Add VIEW-17, 18, 22, 28, 29, 31..42 (unit layer) rows to `docs/testing/traceability.md`.

## Phase 13: PR 13 / S3.2 — Drill-down UI (Track B)

Branch `feat/vpb-13-drill-down-ui` ← `feat/vpb-12-focus-logic` | 11-28 → 11-29 | est. ~420–460 (likely over; cut point: task 13.5 to PR 13b) | Covers: ASSET-04, VIEW-05, 11, 12, 17, 18, 19, 20, 21, 23, 24, 25, 26, 27, 28, 29, 30, 35, 37..43, ASSET-07 (end to end with the fixture)
Commits: (1) `feat(drill-down): add the engine-bay and wheels systems, system hotspots, back control, Escape exit and camera focus`; (2) `feat(drill-down): fade the shell, block its raycasts and highlight the selected part`.

- [ ] 13.0 [B][RED] Extend `twines/tests/unit/vehicle-assets/manifest-integrity.test.ts` for ASSET-04 (`engine-bay` contains the 6 parts, `wheels` contains `tires` and `brake-pads`) and ASSET-03 on the real manifest; record the failure. Then add the `systems` entries to `twines/src/components/vehicle-health/assets/manifest.ts` (GREEN): `engine-bay` (label "Engine bay", `focusInstance` 0, `focusAnchor` from the S0 numbers) and `wheels` (label "Wheels and brakes", `focusInstance` 0, `focusAnchor`). Add this in the same commit as the system hotspots (13.3), because from this entry on system members no longer get flat hotspots.

- [ ] 13.1 [B][RED] Create `twines/tests/component/vehicle-health/vehicle-3d-drill-down.test.tsx`: VIEW-19 (one hotspot per system with an accessible name including the label), VIEW-20 (click enters; phase `focusing`), VIEW-21 (Enter and Space on the button), VIEW-23 (only the focused system's part hotspots, no other system hotspot), VIEW-24, 25, 26 (Escape exits; back control exits; Escape ignored in an input and in the overview), VIEW-27 (selection survives entering and leaving), VIEW-28 (rig double: auto-rotate disabled while focused, resumes after exit only with no selection and no reduced motion), VIEW-29 (repeated activation is idempotent), VIEW-30 (focus moves to the back control on open and returns to the system hotspot on close), VIEW-17 and VIEW-18 (camera double receives `fitToBox(…, false)` under reduced motion and a re-issue when the preference flips mid-transition), VIEW-35 and VIEW-37..42 (attention badge text, selected-part marker with text, `aria-expanded`, hotspots are named buttons) and ASSET-07 (a fixture manifest with `fixture-system` and two parts: hotspot, focus, two part hotspots, attention and marker, using no production code change). Record the failure.
- [ ] 13.2 [B][RED] Extend `twines/tests/component/vehicle-health/vehicle-health-view.test.tsx`: VIEW-05 (list selection never changes the focus phase, never opens a system, the system hotspot shows the marker), VIEW-11 (list selection highlights the part in the focused system without changing focus), VIEW-12 (clicking a part in a focused system updates the list), VIEW-43 (the list shows all 8 parts and stays in sync in every state).
- [ ] 13.3 [B][GREEN] Create `twines/src/components/vehicle-health/drill-down/useEscapeToExit.ts` (document `keydown` listener only while focusing or focused; ignores editable targets and the overview) and extend `twines/src/components/vehicle-health/three/Hotspots.tsx` (system hotspots with label, attention badge and "Selected part inside" marker, `aria-expanded`, accessible name from `systemHotspotLabel`; part hotspots of the focused system and loose parts only).
- [ ] 13.4 [B][GREEN] Extend `twines/src/components/vehicle-health/three/CameraRig.tsx` (`fitToBox` on enter with `!reducedMotion`, `setLookAt` to the overview on exit, phase-tagged `transition-end` dispatch from the resolved promises, re-issue with transitions disabled when reduced motion turns on mid-transition) and edit `twines/src/components/vehicle-health/Vehicle3D.tsx` (`useReducer(focusReducer)`, back control that receives focus on open, focus return to the system hotspot, stage data attribute `data-focus-phase`, `autoRotateEnabled`, `reset` on shell change or fallback) and `twines/src/components/vehicle-health/Vehicle3D.module.css` (system pill, back control).
- [ ] 13.5 [B][GREEN] Extend `twines/src/components/vehicle-health/three/GlbVehicle.tsx`: shell opacity fade through `stepOpacity` and `materialModeFor` (`GHOST_OPACITY = 0.12`), raycast rule (shell `onClick`/`onPointerDown` handlers only in `idle` to occlude loose parts; no-op `raycast` on faded shell meshes), assembly instance handler mapping `event.object.name` (`part-*`) to a `PartId` through the manifest, drei `<Outlines>` through `createPortal` plus a low emissive status tint on interactive parts, parts inside a closed system never highlighted in 3D.
- [ ] 13.6 [B][REFACTOR] Run `npm test` and `npm run test:e2e`. Edit `twines/tests/e2e/health-view.spec.ts`: rotation assertions now measure a system hotspot instead of the Tires part hotspot (current lines 119-138 and 173-187), and the cases that click a part zone first activate that system's hotspot. Manual drill-down check in `npm run dev` (engine bay and wheels, Esc, back control, transparency artifacts). Measure `git diff --stat` and apply the cut point if over 400.
- [ ] 13.7 [DOC] Add VIEW-05, 11, 12, 19..21, 23..27, 30, 43 (component layer) rows to `docs/testing/traceability.md` only if headroom remains; PR 16 consolidates.

## Phase 14: PR 14 / S3.3 — Drill-down e2e and `sedan-generic` (Track B, plus one Track A asset)

Branch `feat/vpb-14-drill-down-e2e` ← `feat/vpb-13-drill-down-ui` | 11-30 (S3 merged checkpoint) | est. ~270 (about 200 e2e and docs, about 70 asset entries) plus 1 GLB | Covers: VIEW-05, 17, 19, 20, 21, 24, 25, 28, 30, 31, 33, 34, 36, 37, 39 (end to end), ASSET-11 (Sentra, end to end), VIEW-22 (manual)
Commits: (1) `feat(assets): add the generic sedan shell`; (2) `test(e2e): cover the system drill-down, the attention indicator and the selected-part marker`; (3) `docs(testing): add the drill-down manual checks`.

- [ ] 14.1 [A] Track A (scheduled for 11-28 or 11-29 so it is ready): create `twines/tools/blender/presets/sedan-generic.json` (same sedan topology, proportion parameters distinct from the Corolla preset, `source.kind` parametric, placements) and export `twines/tools/blender/out/sedan-generic.glb` through the Blender MCP with `assert_contract` passing; capture screenshots for the 11-30 sign-off.
- [ ] 14.2 [B][RED] Create `twines/tests/e2e/drill-down.spec.ts`: VIEW-19 (hotspot per system with accessible names), VIEW-20 (click), VIEW-21 (`press("Enter")` and `press("Space")` on the system button), VIEW-24 and VIEW-25 (Escape and back control exit; stage `data-focus-phase` returns to `idle`), VIEW-30 (focus on the back control, then on the system hotspot), VIEW-05 (selecting engine oil in the list leaves the system closed: no back control, `aria-expanded="false"`, hotspot marker visible: VIEW-37), VIEW-39 (marker follows the selection), VIEW-17 (reduced motion: `data-focus-phase` reaches `focused` with no intermediate `focusing` sample, no auto-rotation), VIEW-28 (rotation pauses while focused and resumes after exit with no selection), VIEW-31 and VIEW-33 (attention indicator absent on TWN-GRN; present with text on TWN-OVR, the Nissan Sentra on the generic sedan shell, ASSET-11), VIEW-34 (indicator updates after the technician records a service; reuse the helpers of `twines/tests/e2e/technician.spec.ts` (read-only)), VIEW-36 (overall status unchanged by the indicator). Record the failures (they fail on TWN-OVR until the shell entry exists).
- [ ] 14.3 [B][GREEN] Run `npm run assets:optimize -- sedan-generic` to create `twines/public/models/sedan-generic.glb`; add the generic sedan `ShellAsset` (generic match `sedan`, placements imported from the preset JSON (read-only)) to `twines/src/components/vehicle-health/assets/manifest.ts`; append the entry to `twines/public/models/provenance.json`; `npm run assets:check` passes and the e2e specs pass.
- [ ] 14.4 [DOC] Add to `docs/testing/manual-tests.md`: VIEW-22 (a faded shell does not intercept clicks: pixel-accurate canvas clicks are unreliable headless, so the unit-level handler rule plus this manual check), the visual fade and transparency sorting check, and the shell sign-off screenshot procedure.
- [ ] 14.5 [B][REFACTOR] Run `npm test`, `npm run test:e2e` and `npm run build`.
- [ ] 14.6 [USER] **Sign-off 11-30.** The user checks the drill-down in the running app (fade, camera, transparency, keyboard) and the screenshots of at least 4 of the 7 remaining shells.
- [ ] 14.7 [DOC] Add VIEW-19..21, 24, 25, 28, 30..39 (end-to-end layer) and ASSET-11 rows to `docs/testing/traceability.md`.

## Phase 15: PR 15 / S4 — Remaining six shells (Track A production 11-24 → 11-30, PR 12-01)

Branch `feat/vpb-15-remaining-shells` ← `feat/vpb-14-drill-down-e2e` | PR 12-01 | est. 300–350 plus 6 GLBs (Medium risk) | Covers: ASSET-01, 06, 10, 11, 35, 36, 39, VIEW-03 (all seeded vehicles), VIEW-31 and VIEW-34 on seeded non-green vehicles
Commits: (1) `feat(blender): add the hatch, SUV and pickup bed shell features and six presets`; (2) `feat(assets): add the remaining six optimized shells with manifest entries and provenance`; (3) `test(e2e): verify the shell of every seeded vehicle`.

Track A production tasks (run on a local working branch from 11-24; the PR opens after PR 14, on the generator, preset and manifest files only):

- [ ] 15.1 [A][RED] Extend `twines/tests/unit/vehicle-assets/presets.test.ts` to require the six presets (`hatchback-fit`, `hatchback-generic`, `suv-tucson`, `suv-generic`, `pickup-hilux`, `pickup-generic`), the `cargo` values `hatch` and `bed`, and four `wheel-brake` placements each; record the failure.
- [ ] 15.2 [A][GREEN] Extend `twines/tools/blender/twines_gen/shell.py` with the `hatch`, SUV-height and pickup `bed` features (cabin, bed and hood parameters, no new brand names), update `twines/tools/blender/twines_gen/naming.py` if new `shell-<piece>` names are needed, and create the six presets `twines/tools/blender/presets/hatchback-fit.json`, `hatchback-generic.json`, `suv-tucson.json`, `suv-generic.json`, `pickup-hilux.json` and `pickup-generic.json` (public proportion data for the specific ones; stylized, no logos, badges or names).
- [ ] 15.3 [A] Export the six raw GLBs through the Blender MCP with `assert_contract` passing; capture screenshots per shell. Track A targets: at least 4 of the 7 remaining shells (generic sedan included) exported by 11-30; all by 12-01 morning. The user's 11-30 and 12-03 sign-offs cover the screenshots; feedback on a shell is applied as a preset edit and a re-export.
- [ ] 15.4 [A] ASSET-36 regeneration check: run `blender --background --factory-startup --python tools/blender/generate.py -- --target all --out tools/blender/out` (or the MCP equivalent when no CLI executable exists), then `npm run assets:optimize` and `npm run assets:check`; record the result in the PR body.

Track B tasks (12-01, after PR 14 is merged into the chain):

- [ ] 15.5 [B][RED] Extend `twines/tests/unit/vehicle-assets/manifest-integrity.test.ts`: ASSET-01 (8 shells; each body type has exactly one specific and one generic shell; the specific shells are Corolla, Fit, Tucson, Hilux), ASSET-10 and ASSET-11 using the seeded vehicles from `twines/prisma/seed-data.ts` (read-only), ASSET-35 (each of the 8 shells has exactly one preset and there is no orphan preset), ASSET-06 and ASSET-39 on the real repository. Record the failure.
- [ ] 15.6 [B][RED] Create `twines/tests/e2e/vehicle-shells.spec.ts`: for each seeded plate the stage `data-shell` equals the expected shell id (TWN-GRN Corolla, TWN-YLW Fit, TWN-ORG Tucson, TWN-RED Hilux, TWN-OVR generic sedan, TWN-OTH generic hatchback; ASSET-10, ASSET-11, VIEW-03), and the attention indicator shows the worst child status on the seeded non-green vehicles (VIEW-31, VIEW-34). Record the failure.
- [ ] 15.7 [B][GREEN] Run `npm run assets:optimize` for the six shells to create `twines/public/models/hatchback-fit.glb`, `hatchback-generic.glb`, `suv-tucson.glb`, `suv-generic.glb`, `pickup-hilux.glb` and `pickup-generic.glb`; add the six `ShellAsset` entries to `twines/src/components/vehicle-health/assets/manifest.ts` (placements from the preset JSON (read-only)) and six entries to `twines/public/models/provenance.json`. Every shell at most 100,000 triangles and 2.5 MB; `npm run assets:check` passes.
- [ ] 15.8 [B][REFACTOR] Run `npm test`, `npm run test:e2e`, `npm run build`. Report the bytes added per GLB and the running binary total in the PR body; if the total exceeds about 25 MB, stop and return the Git LFS decision to the user instead of committing more.
- [ ] 15.9 [DOC] Add ASSET-01, 10, 36 (manual) and VIEW-03 end-to-end rows to `docs/testing/traceability.md`.

## Phase 16: PR 16 / S5 — Polish, performance, accessibility, e2e hardening, docs (Track B)

Branch `feat/vpb-16-polish-a11y-docs` ← `feat/vpb-15-remaining-shells` | 12-01 → 12-03 (feature freeze 12-03) | est. ~200–300 | Covers: VIEW-44 (finish), VIEW-42, VIEW-30, THEME-20 (a11y pass), traceability for every scenario
Commits: (1) `feat(viewer): finish the accessible loading state and the keyboard and screen-reader fixes`; (2) `test(e2e): harden the GLB specs against headless flakiness`; (3) `docs: document the asset workflow, the theme and the test traceability`.

- [ ] 16.1 [B][RED] Extend `twines/tests/component/vehicle-health/vehicle-3d.test.tsx`: VIEW-44 (the loading overlay is a status region announced to assistive technology while the GLBs load and removed when ready or on error, with `aria-busy` on the stage); VIEW-42 (every hotspot is a real `<button>` with a name that includes the part or system and its status); focus order and visible focus ring in both themes (THEME-20, THEME-28). Record the failures found by a keyboard and screen-reader pass (tab order, names, `aria-expanded`, back control reachable) before fixing them.
- [ ] 16.2 [B][GREEN] Fix the findings in `twines/src/components/vehicle-health/Vehicle3D.tsx`, `twines/src/components/vehicle-health/Vehicle3D.module.css` and `twines/src/components/vehicle-health/three/Hotspots.tsx` (plain accessible loading state; loading-state animation finesse is cut-line 5).
- [ ] 16.3 [B] Performance and budget tuning: record the final bytes and triangle counts from `npm run assets:check`; tune only if a budget is close to its limit (preset or optimizer level); confirm no request to a third-party origin on the production build (ASSET-38).
- [ ] 16.4 [B][RED] E2E hardening in `twines/tests/e2e/health-view.spec.ts`, `twines/tests/e2e/drill-down.spec.ts` and `twines/tests/e2e/vehicle-shells.spec.ts`: replace fixed waits with waits on stage state (`data-model-ready`, `data-focus-phase`); generous GLB load timeouts. Run `npm run test:e2e` three consecutive times; any flake is recorded and fixed before the next run.
- [ ] 16.5 [DOC] Update `twines/README.md`: asset workflow (generator, presets, optimize, check), theme selection, how to run the Blender generator with and without the MCP (point to `twines/tools/blender/README.md`), and the new scripts.
- [ ] 16.6 [DOC] Consolidate `docs/testing/traceability.md`: every new or modified scenario (THEME-01..37, ASSET-01..41, VIEW-03..07 and VIEW-10..44) maps to at least one test case ID and its layer; add the rows not yet added (THEME-05..23 and 25 from PR 5, ASSET-15..18 and 38 and VIEW rows from PR 11 and PR 13 if skipped); update the Notes that name VIEW-03 as proven below the browser. Update `docs/testing/manual-tests.md` with the theme visual check and the shell sign-off.
- [ ] 16.7 [B][REFACTOR] Run `npm test` (coverage at least 80%), `npm run test:e2e` and `npm run build` in `twines/`; record exact counts.
- [ ] 16.8 [USER] **Sign-off 12-03 (feature freeze).** The user reviews all 8 shells, both themes, the logo and the drill-down in the running app. Anything after this date is a cut-line decision, not new scope.

## Phase 17: QA and buffer (12-04, no new feature code)

- [ ] 17.1 [B] Full regression on the last branch: `npm test` with coverage, `npm run test:e2e`, `npm run build`, in `twines/`; existing VIEW-01, 02, 08, 09 and all previously passing suites unchanged.
- [ ] 17.2 [B] Functional pass: both themes on every page (sign-in, sign-up, vehicle list, forms, technician page, health view, 2D diagram); every seeded vehicle; drill-down with mouse and keyboard; GLB-abort fallback; no-WebGL fallback; reduced motion.
- [ ] 17.3 [B] Security and privacy pass: the theme choice never appears in an API request or the database (THEME-19); no third-party requests for fonts, models or decoders (THEME-36, ASSET-38); the boot script is a static constant; no secrets in committed files.
- [ ] 17.4 [B] Usability pass: contrast of focus indicators and status swatches in both themes, readable status text, hotspot names; record results in `docs/testing/manual-tests.md` (or a QA results section there) and in the verify report produced by the verify phase.
- [ ] 17.5 [B] Cut-line decisions if anything is late: apply the cut-line order (1 to 6) and record each decision; never cut the "never cut" list.
- [ ] 17.6 [USER] Final review and the decision to merge the tracker branch `feat/visual-polish-3d-brand` into `main` (the tracker is the only branch that merges; delivery follows ordinary repository policy).

## Scenario coverage index (every new or modified scenario has a RED test in the PR shown)

| IDs | PR (layer) |
|-----|-----------|
| THEME-01 | 3 (unit scan) |
| THEME-02, 03, 04, 24, 26, 27, 28, 29, 31 | 2 (unit) |
| THEME-30 | 2 (ring contrast) and 3 (rendered ring) |
| THEME-05, 06, 07, 09, 10, 11, 14, 15, 16, 19, 21, 22, 23, 25 | 5 (e2e) |
| THEME-08 | 5 (hook and prop) and 11 (scene follows the theme) |
| THEME-09, 10, 12, 17, 18, 20, 13, 14, 16 | 5 (unit and component) |
| THEME-32..37 | 6 (component and e2e) |
| ASSET-02, 03, 05, 08..14, 18, 35 | 7 (unit) |
| ASSET-04 | 13 |
| ASSET-06, 19..34, 37, 39, 40, 41 | 8 (unit, in-memory fixtures) |
| ASSET-15, 16 | 10 (logic), 11 (component and e2e) |
| ASSET-17, 38 | 11 (e2e) |
| ASSET-07 | 7 (data half), 13 (end to end with the fixture) |
| ASSET-01, 10, 11, 36 | 15 (unit, e2e and manual; ASSET-11 for Sentra also in 14) |
| VIEW-03, 06, 07, 10, 13..16, 44 | 11 (VIEW-03 also in 15) |
| VIEW-17, 18, 22 (logic), 28, 29, 31..42 | 12 (unit) |
| VIEW-05, 11, 12, 17, 18, 19..21, 23..30, 35, 37..43 | 13 (component) |
| VIEW-05, 17, 19..21, 24, 25, 28, 30, 31, 33, 34, 36, 37, 39 | 14 (e2e); VIEW-22 manual in 14 |
| VIEW-04 | 11 (rotation pause half) and 13/14 (part click in a focused system) |
| VIEW-42, 44 finish, THEME-20 | 16 |

## Tests rewritten, extended, kept and created

- Rewrite: `twines/tests/component/vehicle-health/vehicle-3d.test.tsx` (PR 11; mocks move from `OrbitControls` to `CameraControls`, `useGLTF` is replaced by the mocked loader module, assertions on systems, fade, fallback, auto-rotate); `twines/tests/e2e/health-view.spec.ts` (orbit and rotation assertions at the current lines 119-138 and 173-187: PR 11 for `CameraControls` auto-rotate, PR 13 retarget to a system hotspot; the VIEW-06 case at lines 140-171 extended with ASSET-17 in PR 11).
- Extend: `twines/tests/unit/components/status-colors-3d.test.ts` (PR 2, THEME-03); `twines/tests/component/vehicle-health/vehicle-health-view.test.tsx` (PR 11 and PR 13).
- Keep unchanged: `twines/tests/unit/components/vehicle-health-models.test.ts` and `twines/tests/unit/components/part-rows.test.ts` (primitive fallback); `twines/src/components/vehicle-health/models/**`.
- New: `tests/unit/brand/{design-tokens,no-color-literals,status-swatch-ring,theme-preference,theme-boot-script}.test.ts`, `tests/support/css-tokens.ts`, `tests/component/brand/{theme-toggle,theme-sync,use-resolved-theme,logo,logo-placement}.test.tsx`, `tests/e2e/{theme,brand,drill-down,vehicle-shells}.spec.ts`, `tests/unit/vehicle-assets/{presets,resolve-shell,manifest-integrity,scene-layout,asset-contract,optimize,load-vehicle-assets}.test.ts`, `tests/unit/drill-down/{focus-machine,system-status,fade}.test.ts`, `tests/component/vehicle-health/{use-vehicle-assets,glb-vehicle,model-error-boundary,vehicle-3d-drill-down}.test.tsx` (all under `twines/`).

## Traceability plan

`docs/testing/traceability.md` (repository root) gets a "Brand and theme (THEME)" section, a "Vehicle 3D assets (ASSET)" section, new rows in the "Vehicle health view (VIEW)" section for VIEW-10..44, updated rows for VIEW-03, 04, 05, 06, 07 and the coverage matrix. Rows are added incrementally in PR 2, 3, 6, 7, 8, 12, 14 and 15 (where there is headroom) and consolidated in PR 16, which owns the completeness check. `docs/testing/manual-tests.md` gets VIEW-22, the fade check, the shell sign-off procedure and the theme visual check (PR 14 and PR 16).

## User action register

| When | Action |
|------|--------|
| Before PR push (task 0.2) | Authorize pushing branches and opening the draft tracker PR |
| 11-23 (4.6) | Sign-off S0 screenshots; go / partial-go / no-go per asset class; approve Manrope and the logo concept; authorize the Manrope woff2 download |
| 11-23, only if the Kenney fallback is chosen (4.8) | Authorize the Kenney Car Kit download |
| 11-25 (6.8) | Approve the rendered logo |
| 11-27 (11.7) | Sign-off Corolla in the app |
| 11-30 (14.6) | Sign-off drill-down and at least 4 shells |
| 12-03 (16.8) | Sign-off feature freeze |
| If triggered | THEME-31 (ring cannot reach 3:1: product-owner decision on status colors); Git LFS decision above about 25 MB of binaries (15.8); spec amendment if procedural assemblies fail (4.7); `size:exception` if an over-budget PR cannot be cut |
| 12-04 (17.6) | Decide the merge of the tracker into `main` |

## Risks

- Schedule: 16 PRs in 14 days with 5 PRs at or over the 400-line budget; the cut points above keep each PR reviewable but add chain re-bases. Weekends are working days (confirmed by the user); no slack exists besides 12-04.
- Chain order is by completion date, so a late Track A PR (PR 4 waits on the 11-23 sign-off) blocks the reviewable chain from PR 5 on; mitigation: its files are disjoint, so PR 5 onward can proceed and be rebased onto PR 4 once.
- Python generator code runs outside Vitest and has no coverage measurement; the guard in `naming.py`, the preset test and the committed-GLB contract check are the gates.
- Track A needs the user's local Blender and the MCP connection to stay up; the generator and presets are committed so the app and the contract check never need Blender.
- PR 9 depends on the S0 go decision; a no-go switches to the Kenney path (4.7, 4.8) or code-built assemblies (spec amendment needed) and can add a PR or a commit; the chain stays linear.
- Dark-mode status colors may fail the 3:1 swatch ring rule (THEME-30, THEME-31); the answer is a product-owner decision, never an edit of the status colors by the implementer.
- Headless GLB rendering can be slow or flaky; e2e asserts DOM state, not pixels, and PR 16 repeats the full run three times.
- Binary growth: report bytes per PR; the Git LFS threshold of about 25 MB returns as a decision.
- New devDependencies (`@gltf-transform/*`, `meshoptimizer`, `tsx`) are installed from the normal npm channel in PR 8; the S0 spike (4.4) uses the same packages in a scratch directory, uncommitted.
