# Proposal: Visual polish — brand identity, dark mode and polished 3D vehicles with system drill-down

> Revision 2 (2026-11-21). Applies the user decisions recorded in Engram under `sdd/visual-polish-3d-brand/decisions`, `decisions-theme`, `decisions-assets-budget`, `decisions-deadline` and `decisions-list-selection`.

## Intent

TwinES works, but it looks like a prototype: there is no logo, the palette is limited to status colors plus about 95 hard-coded hex values, and the 3D view is built from boxes, cylinders and spheres. Eight hotspots on one small model are crowded, especially the six engine-bay parts.

This change gives TwinES a coherent **stylized-premium** identity (logo, palette, typography, light and dark themes with a manual toggle) and replaces the primitive models with polished GLB vehicle shells. It also adds a generic **system drill-down**: the user activates a crowded cluster (the engine bay or the wheels), the shell fades out, the camera focuses on that cluster and its parts become selectable. The 2D fallback, the accessible parts list and the domain rules stay as they are.

**Why now:** the MVP is archived and its behavior is covered by specs and tests. Polishing now, while the viewer is small and well tested, costs less than doing it after more features land on the primitive viewer. The full scope is due before the `2026-12-05` milestone.

**Success looks like:** every seeded vehicle shows a polished shell for its make, model or body type. A user can open the engine bay or the wheels, see which system needs attention without opening it, and select any part. Both themes pass WCAG AA. Every existing health-view guarantee (list as source of truth, 2D fallback, reduced motion, technician action) still holds. All of it, including the 8 shells and polish, is merged and QA-checked before 2026-12-05.

## Scope

### In Scope
- **Brand and theme (first slice):** logo (SVG component with `currentColor` and `app/icon.svg`), a single-accent palette that does not overlap the status hues, self-hosted typography via `next/font`, CSS custom-property design tokens that replace the hard-coded hex values, and light and dark themes from day one. Status colors are identical in both themes, and both themes pass WCAG AA.
- **Theme selection:** the theme follows the OS preference (`prefers-color-scheme`) by default. A manual toggle (system / light / dark) overrides it, is remembered client-side only (no DB change), and can return to "follow system". The correct theme is applied before first paint, so there is no flash of the wrong theme on load.
- **Vehicle asset contract:** a TypeScript manifest that maps shells to make/model/body type, GLB node names to `PartId`, and systems to their member parts, assembly asset and per-shell transform.
- **Model resolution:** match (make, model, bodyType) to the specific shell, otherwise bodyType to the generic shell. On a GLB load error, the current primitive model renders. Without WebGL, the 2D SVG diagram renders (unchanged).
- **Parametric shell generator (primary asset pipeline):** a `bpy` script, committed to the repository and run in the user's local Blender, that produces all 8 shells as proportion and feature variants (length, height, roofline, hood, cabin, pickup bed, wheelbase) from versioned presets. Exports are reproducible from the script plus presets.
- **8 polished shells:** one specific and one generic shell per body type. Specific shells: Toyota Corolla (sedan), Honda Fit (hatchback), Hyundai Tucson (suv), Toyota Hilux (pickup), taken from `twines/prisma/seed-data.ts`. Shells are stylized interpretations with **no logos, badges or brand names**.
- **Shared system assemblies:** procedurally modeled once in the same tooling. An engine-bay assembly with 6 named part nodes (engine-oil, oil-filter, air-filter, spark-plugs, coolant, battery) and a wheel/brake assembly with named nodes (tires, brake-pads). Placed per shell through manifest transforms.
- **Generic system drill-down:** a clickable system focus node, a shell opacity fade, camera focus through drei `CameraControls`, exit with Esc or a back control, and an instant transition under reduced motion. Drill-down is entered **only** through the system hotspot. New systems are added through the manifest, without new interaction code.
- **Highlight-only list selection:** selecting a part in the list highlights it and opens its detail panel. If the part belongs to a system, the system is **not** opened (no fade, no camera move).
- **Derived attention indicator:** a system has no stored status. Its indicator shows the worst child status (text plus color) whenever any child is yellow or worse. It is computed in the UI and needs no DB change.
- **Asset pipeline and budgets:** an optimization script (`@gltf-transform/cli`, meshopt), a locally served decoder (no CDN), per-asset size and triangle budgets plus expected node names enforced by a check, and a provenance/licence record for every asset.
- **Test updates** for the new viewer and theme behavior, under Strict TDD.

### Out of Scope
- Any Prisma schema or domain change. The part catalog stays flat; systems are a UI-only grouping. The theme preference is not stored server-side.
- Exact per-model assets beyond the 4 named specific shells; per-trim, per-year or per-color variants.
- Photorealism, real brand logos or badges, and interior or cabin modeling.
- Paid services of any kind: paid Higgsfield plans or credits, Blender Studio GPU rental, paid asset stores.
- AI-generated shells on the critical path. AI generation is limited to an optional comparison experiment (see Approach), and its outputs are not shipped in this change.
- A `postprocessing` / EffectComposer dependency. Highlighting uses drei `<Outlines>` or emissive materials.
- Redesigning the 2D SVG fallback beyond applying the theme tokens.
- EV/hybrid systems and new tracked parts.
- Git LFS or a CDN for assets, unless the measured binaries exceed the repo-size threshold in Risks. In that case it comes back as a decision.

Nothing in the In Scope list is deferred past 2026-12-05. Any idea accepted during the change carries the same deadline and enters only through an explicit scope update.

## Capabilities

### New Capabilities
- `brand-theme`: brand identity and theming: logo usage, design tokens, light and dark themes, theme selection (OS default, manual override with system/light/dark, client-side persistence, return to "follow system", no flash of the wrong theme), status colors that do not change across themes, and WCAG AA contrast on both themes.
- `vehicle-3d-assets`: the vehicle asset contract: the manifest schema (shells, node name to `PartId`, systems), the model resolution order (specific → generic → primitive → 2D), per-asset budgets and expected node names, reproducibility from the committed generator and presets, the no-logo/no-badge rule and the provenance/licence record.

### Modified Capabilities
- `vehicle-health-view`:
  - **"3D model by body type"** (VIEW-03..05) is MODIFIED. The model is resolved through `vehicle-3d-assets`, rotation is driven by `CameraControls`, and parts inside a system become selectable in 3D after that system is focused. **VIEW-05 is MODIFIED for highlight-only selection:** selecting a list part shows its panel and highlights it; when the part belongs to an unfocused system, the system stays closed and its hotspot indicates that it contains the selected part.
  - **ADDED "System drill-down"**: the system hotspot is the only entry point (mouse or keyboard); fade, camera focus, exit with Esc or back control.
  - **ADDED "System attention indicator"**: worst child status, shown when any child is yellow or worse.
  - **"Fallbacks and motion preferences"** (VIEW-06..07) is MODIFIED. A GLB load error falls back to the primitive model, and reduced motion makes focus transitions instant.
  - VIEW-01, VIEW-02, VIEW-08 and VIEW-09 keep their behavior.
- `part-health`, `maintenance-schedule`, `vehicle-registry`, `user-auth`: no requirement changes.

## Approach

### Asset pipeline (local, free, reproducible)

| Asset | Source | Why |
|-------|--------|-----|
| Shells (8) | **Primary:** parametric `bpy` car-shell generator in `twines/tools/blender/`, run in the user's local Blender 5.2.3 LTS through the Blender MCP. One shared topology, 8 presets varying length, height, roofline, hood, cabin, pickup bed and wheelbase; bevelled surfaces and brand PBR materials | Free, reproducible, consistent style across all 8, no licence or credit dependency; the drill-down only needs each shell to be one fadeable object |
| Engine-bay and wheel/brake assemblies | Procedural `bpy` in the same tooling, modeled once with named nodes | Exact, separable, named nodes that map 1:1 to `PartId`s |
| Optional supplements | Kenney Car Kit (CC0) as reference or fallback; Poly Haven (CC0) HDRI/textures for look development | Free and licence-clean; not required by the primary path |
| Optional AI experiment | At most 2 Tripo text-to-3D generations on the Higgsfield free plan (10 credits, 5 per generation), as a visual comparison only | Never on the critical path; outputs are not shipped |
| Optimization | `@gltf-transform/cli optimize` with meshopt and texture resize | Small GLBs; decoder served locally |

Proposed tooling layout (final names settled in design):
- `twines/tools/blender/` — generator entry script, shell module, assemblies module, export helper, `presets/` (one preset file per shell) and a README with the Blender version and how to run it with or without the MCP (Text Editor or `blender --background --python`).
- `twines/tools/blender/out/` — raw exports, git-ignored (reproducible).
- `twines/public/models/` — optimized, committed GLBs plus the provenance record.

The generator is authored code but runs inside Blender, outside Vitest. Its correctness is asserted through the output contract: a Node-side check (part of `npm test`) verifies every committed GLB for expected node names, triangle count and size. Visual quality is signed off by the user from Blender viewport screenshots.

### Runtime
- A manifest in TypeScript (for example `twines/src/components/vehicle-health/assets/manifest.ts`) is the single source for resolution, node-to-`PartId` mapping and systems.
- A pure resolver function, unit tested, picks the shell. Make/model matching normalizes case and whitespace, because `make` and `model` are free text.
- `useGLTF` loads the shell and the assemblies. An error boundary renders the existing primitive `BodyModel`, so `models/*.ts` stay as the technical fallback.
- A focus state machine (`idle → focusing → focused → exiting`) drives the shell fade (`transparent`, `depthWrite=false`, raycast disabled while faded) and `CameraControls.fitToBox`. Only a system hotspot activation transitions out of `idle`; list selection changes `selectedPartId` and never the focus state. Auto-rotate moves from `OrbitControls.autoRotate` to a per-frame azimuth rotation and pauses while a part is selected or a system is focused.
- The DOM `<button>` hotspots stay as the accessible path for both systems and parts (via drei `Html`). The parts list remains the source of truth.
- The attention indicator is a pure, framework-free function: (system part IDs, part healths) → worst status or none. A second pure function reports whether a system contains the selected part, for the highlight-only marker.

### Brand and theme
- Tokens are CSS custom properties in `globals.css`, keyed by `[data-theme]` with a `prefers-color-scheme` default. Their hex values are mirrored in TypeScript for three.js, with a sync test (extends the existing `status-colors` pattern).
- Theme selection: a three-state toggle in the app shell. The choice is stored client-side (for example `localStorage`); a small blocking script in the document head applies the stored or OS theme before first paint, and `<html>` tolerates the attribute set before hydration. Whether to use a tiny in-house script or a library such as `next-themes` is a design decision.
- Visual direction: cool neutral base with one restrained accent that must not collide with the status hues. Avoid the default AI purple-glow look. Exact palette, font and logo are settled in design.

### S0 gate
S0 is a gating spike for the asset pipeline. Design must document both the primary (parametric) and fallback (Kenney) pipelines, so the go/no-go result does not reopen design.

## Delivery (auto-chain, 400 authored lines per PR, due before 2026-12-05)

Calendar days from Saturday 2026-11-21 to Friday 2026-12-04; 2026-12-05 is the milestone. Two tracks run in parallel: **Track A** (Blender assets) and **Track B** (app code).

| Slice | Content | Track | Dates (timebox) | Depends on | Authored-line forecast |
|-------|---------|-------|-----------------|------------|------------------------|
| **S0 Parametric spike (gate)** | Generator core + sedan preset (Corolla) + engine-bay and wheel/brake assemblies + export; screenshots for sign-off; local unmerged R3F load check; findings in the change folder. Merges only `twines/tools/blender/` and findings, no app code. Split into S0a (shell + export) and S0b (assemblies) if over budget | A | 11-21 → 11-23 (3 days); **go/no-go end of 11-23** | — | ~350–450 Python |
| **S1a Tokens + themes + toggle** | Tokens, replacement of the ~95 hex literals, light/dark themes, OS default, toggle, persistence, no-flash script, contrast and token-sync tests | B | 11-21 → 11-23 (3 days) | — (parallel with S0) | ~350–400 |
| **S1b Logo + font + icon** | Logo component, `icon.svg`, `next/font`, app-shell integration | B | 11-24 → 11-25 (2 days) | S1a | ~200–300 |
| **S2 GLB viewer + manifest + first shell** | Manifest, resolver, `useGLTF` with error boundary, primitive fallback, `CameraControls` with auto-rotate, Corolla shell, local decoder, optimize script, asset contract check, rewritten viewer tests | B | 11-25 → 11-27 (3 days) | S0 decision | ~350–400 |
| **S3 Generic system drill-down** | Focus state machine, fade, camera focus, Esc/back, system hotspots, attention indicator, highlight-only selection marker, assemblies with per-shell transforms | B | 11-28 → 11-30 (3 days) | S2 | ~350–400 |
| **S4 Remaining 7 shells** | Generator feature additions (hatch, SUV, pickup bed), 7 presets, exports, manifest entries, transforms, provenance records. Asset production runs on Track A from 11-24; the PR lands after S3 | A → B | production 11-24 → 11-30; PR 12-01 (1 day) | S0 go, S3 | ~200–350 + binaries |
| **S5 Polish, performance, a11y** | Loading states, budget tuning, keyboard and screen-reader pass, e2e hardening, README and test-plan traceability | B | 12-01 → 12-03 (3 days) | S4 | ~200–300 |
| **QA and buffer** | Full regression, functional, security and usability results for the milestone; cut-line decisions if needed | — | 12-04 (1 day) | S5 | — |

Binary GLB/texture files do not count as authored lines. Each PR still reports their added bytes, because they grow the repository permanently.

**Checkpoints.** 11-23 (S0 decision, S1a merged), 11-27 (S2 merged), 11-30 (S3 merged and at least 4 of the 7 remaining shells exported), 12-03 (feature freeze). Missing a checkpoint triggers the next cut-line item, never a scope deferral.

**Cut-line order** (trimmed first if late; only fine polish, never core scope):
1. The optional AI comparison experiment.
2. HDRI and texture look-development supplements; shells keep flat brand PBR materials.
3. Fine surface detail on shells beyond silhouette variants (panel lines, extra bevels, light and mirror detail).
4. Fade and camera easing fine-tuning; the functional transition stays.
5. Loading-state animation finesse; a plain accessible loading state stays.
6. Additional logo refinement iterations; the first approved logo ships.

**Never cut:** the 8 shells, both drill-down systems, the attention indicator, highlight-only selection, light and dark themes with the toggle, WCAG AA, all fallbacks, Strict TDD with ≥ 80% coverage, and the e2e suite.

### S0 go/no-go criteria

| Criterion | Go threshold |
|-----------|--------------|
| Look | The parametric generator produces a stylized-premium sedan shell, recognizably a compact sedan with Corolla-like proportions, clean PBR, no logos, badges or text. The user signs it off from Blender viewport screenshots |
| Shell budget | ≤ 100k triangles and ≤ 2.5 MB GLB after meshopt optimization |
| Assemblies | Engine-bay ≤ 1 MB with 6 named nodes mapping 1:1 to the six engine-bay `PartId`s; wheel/brake ≤ 1 MB with `tires` and `brake-pads` nodes; every part separable and individually highlightable |
| Node contract | Exported GLBs contain exactly the expected node names (shell root, system anchors, part nodes), verified by the asset contract check |
| Runtime | Loads in R3F via `useGLTF` with the locally served meshopt decoder (local unmerged harness), and the existing test suite still passes |

**Fallback** (decided the same day; each asset class independently, so a partial go is valid; the full scope is still delivered):
- **Parametric look fails:** Kenney Car Kit (CC0) shells restyled with brand materials, with specific shells differentiated by proportion adjustments. Assemblies stay procedural.
- **Procedural assemblies fail:** assemblies built in code from named R3F primitives. The manifest contract stays the same.

## Testing

Strict TDD (RED → GREEN → REFACTOR). Runner: `npm test` (`vitest run`) and `npm run test:e2e` (Playwright) inside `twines/`. Coverage threshold: 80%.

| Test | Action |
|------|--------|
| `twines/tests/component/vehicle-health/vehicle-3d.test.tsx` | **Rewrite:** mock `useGLTF`/`CameraControls` instead of `OrbitControls`; assert system hotspots, the fade and focus state, auto-rotate pause, the error-boundary fallback, and that list selection never changes focus state |
| `twines/tests/e2e/health-view.spec.ts` | **Rewrite** the orbit/rotation assertions for `CameraControls` auto-rotate. Add drill-down via system hotspot, Esc exit, reduced-motion instant focus, GLB-abort fallback (route abort), and highlight-only list selection (system stays closed) |
| `twines/tests/unit/components/vehicle-health-models.test.ts` | **Keep:** primitive `BodyModel`s remain the fallback. Adjust only if hotspot anchors move into the manifest |
| `twines/tests/unit/components/status-colors-3d.test.ts` | **Extend** to cover the brand-token sync between CSS and TypeScript |
| New unit tests | Resolver order and normalization; manifest integrity (every `PartId` covered exactly once, systems reference only catalog parts); asset contract check (node names, triangles, size per GLB); attention-indicator derivation; contains-selected-part derivation; token contrast pairs in both themes; theme preference resolution (stored choice, OS default, return to system) |
| New e2e tests | Theme toggle persists across reload, "follow system" follows an emulated `prefers-color-scheme`, and no wrong-theme flash on first paint |

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `twines/src/app/globals.css` and the `*.module.css` files under `twines/src/` | Modified | Tokens and themes; hex literals replaced |
| `twines/src/app/layout.tsx`, `twines/src/components/auth/app-shell.tsx` | Modified | Font, theme root and no-flash script, logo and theme toggle in the shell |
| `twines/src/app/favicon.ico` → `twines/src/app/icon.svg` | Modified | Brand icon |
| `twines/src/components/brand/` | New | Logo and theme toggle components, theme preference logic |
| `twines/src/components/vehicle-health/Vehicle3D.tsx`, `VehicleScene.tsx` | Modified | GLB loading, `CameraControls`, systems, fade |
| `twines/src/components/vehicle-health/assets/` | New | Manifest, resolver, system definitions, attention and contains-selection derivations |
| `twines/src/components/vehicle-health/models/` | Kept | Primitive fallback |
| `twines/src/components/vehicle-health/VehicleHealthView.tsx` | Modified | Focused-system state next to `selectedPartId` |
| `twines/src/components/vehicle-health/status-colors.ts` | Modified | Brand-token mirror |
| `twines/src/components/vehicle-health/VehicleDiagram2D.tsx` | Modified | Theme tokens only |
| `twines/tools/blender/` | New | Parametric shell generator, assemblies, export helper, presets, README |
| `twines/public/models/`, `twines/public/decoders/` | New | Optimized GLBs, provenance record, local meshopt decoder |
| `twines/scripts/` | New | Asset optimize and contract/budget-check scripts |
| `twines/.gitignore` | Modified | Ignore `tools/blender/out/` |
| `twines/package.json` | Modified | `@gltf-transform/cli` (dev); scripts |
| `twines/tests/**` | Modified/New | See Testing |
| `openspec/specs/vehicle-health-view/spec.md` | Delta | At archive |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Schedule: 14 calendar days for 8 PRs, 8 shells and polish | High | Parallel tracks, timeboxes, dated checkpoints, explicit cut-line limited to fine polish; 12-04 reserved for QA and buffer |
| Parametric shells look toy-like or too similar; specific shells are not recognizable | Med | S0 visual sign-off on day 3; presets driven by public proportion data; bevels and brand PBR; Kenney CC0 fallback decided the same day |
| Single-machine dependency on the user's local Blender and MCP connection | Med | Commit the generator, presets and optimized GLBs; the app needs no Blender; the script runs without the MCP (Text Editor or `blender --background`); README pins Blender 5.2.x |
| User sign-off latency on screenshots blocks Track A | Med | Sign-off requests batched per checkpoint; screenshots attached to the findings doc |
| Generator code runs outside Vitest, so regressions are not caught by unit tests | Med | Output contract check in `npm test` against every committed GLB (node names, triangles, size) |
| glTF exporter renames duplicated nodes (for example `.001` suffixes) | Low | Unique node names from the generator; contract check fails on mismatch |
| Identical status colors fail AA against the dark surface (for example red `#b91c1c` on near-black is below 3:1 non-text contrast) | Med | Status always shown as text; themed ring/border token around swatches in dark mode; if still failing, return to the user, because the decision fixes the status colors |
| Wrong-theme flash or hydration mismatch from client-side preference | Med | Blocking head script before paint; attribute mismatch tolerated on `<html>`; e2e checks first paint |
| Repo size grows from committed GLBs | Low | Procedural materials keep files small; per-asset budgets enforced; bytes reported per PR; Git LFS returns as a decision if total binaries exceed ~25 MB |
| Transparency artifacts (sorting, `depthWrite`) during the fade | Med | Single fadeable shell object; `depthWrite=false` while fading; visual check in S3 |
| GLB rendering in headless Chromium is slow or flaky in e2e | Med | e2e asserts DOM hotspots, list and state, not pixels; route-abort test covers the fallback; generous load waits |
| A highlighted part inside a closed system is occluded by the shell | Low | Detail panel always opens; the system hotspot shows a "contains selected part" marker |
| Trade-dress likeness of specific shells | Low | Stylized parametric interpretation; no logos, badges or names; recorded in provenance |
| `CameraControls` has no built-in auto-rotate | Low | Per-frame azimuth rotation; covered by component and e2e tests |

## Rollback Plan

- **Per slice:** each slice is its own PR, so `git revert` of that PR undoes it without affecting earlier slices. No DB or schema changes means no data migration to reverse.
- **3D kill switch without a revert:** removing shell entries from the manifest makes the resolver fall back to the primitive models. Removing system entries disables the drill-down while part hotspots and the list keep working.
- **Brand:** reverting S1a/S1b restores the hard-coded hex values and removes the toggle. Tokens are additive until the replacement commit, so revert that commit first. A stale client-side theme value is ignored once the toggle is gone.
- **Assets:** deleting `twines/public/models/` together with the manifest entries leaves the primitive viewer intact. The generator in `twines/tools/blender/` is inert for the app and can be reverted independently. Repository history keeps the binaries; history rewriting or LFS migration would be a separate, explicitly authorized operation.

## Dependencies

- The user's local Blender 5.2.3 LTS with the MCP addon (local; `execute_code` and viewport screenshots). No hosted Blender service.
- `@gltf-transform/cli` (devDependency); the meshopt decoder from `three`, served locally. drei `CameraControls` through `@react-three/drei` 10.7.9 (to be confirmed in design).
- A `next/font` self-hosted font family (chosen in design).
- Optional, each requiring explicit user authorization because they download from or call remote services: Kenney Car Kit (CC0) and Poly Haven (CC0); the addon libraries are currently off. Higgsfield free plan for at most 2 Tripo generations (experiment only).

## Success Criteria

- [ ] S0 records a go, partial-go or no-go decision by end of 2026-11-23 against every S0 criterion, with measured triangle count, file size, node names and the screenshots used for sign-off.
- [ ] Running the committed generator with the committed presets reproduces all 8 shells and both assemblies; every committed GLB passes the asset contract check.
- [ ] Seeded Toyota Corolla, Honda Fit, Hyundai Tucson and Toyota Hilux show their specific shells. The seeded Nissan Sentra and Kia Rio show the generic sedan and hatchback shells.
- [ ] When a shell GLB request fails, the primitive model renders and the page has no errors. Without WebGL, the 2D diagram with 8 zones renders (VIEW-06 still passes).
- [ ] Activating the engine-bay or wheels system hotspot (mouse or keyboard) fades the shell, focuses the camera and exposes that system's part hotspots. Esc or the back control returns to the overview. Under reduced motion, the transition is instant and nothing auto-rotates.
- [ ] Selecting a list part that belongs to a closed system highlights it and opens its panel without opening the system; the system hotspot indicates it contains the selected part.
- [ ] A system's attention indicator shows the worst child status as text and color when any child is yellow or worse, and is absent when all children are green.
- [ ] Adding a third system needs only manifest data, with no new interaction code (shown by a unit test with a fixture system).
- [ ] The parts list still shows all 8 parts, stays in sync with the 3D selection, and the technician action rules (VIEW-08/09) are unchanged.
- [ ] The theme follows the OS by default; the toggle overrides it, persists across reloads, can return to "follow system", and no wrong-theme flash occurs on load.
- [ ] Light and dark themes pass WCAG AA for text and UI tokens (automated contrast tests). Status colors are identical in both themes.
- [ ] Every shell is ≤ 2.5 MB and ≤ 100k triangles, and every shared assembly is ≤ 1 MB. Every asset has a provenance/licence record, and none carries a logo, badge or brand name. No paid service was used.
- [ ] `npm test` (coverage ≥ 80%), `npm run test:e2e` and `npm run build` pass in `twines/`. Every new or modified spec scenario maps to a test case ID.
- [ ] All slices S0–S5 are merged and the milestone QA results are recorded before 2026-12-05.

## Open Questions (new only; none block the spec phase)

1. **Working days:** the schedule uses calendar days, including weekends (11-22, 11-28, 11-29). If weekends are not working days, the checkpoints compress by four days and the cut-line triggers earlier. Please confirm whether weekends are available.
