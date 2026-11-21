# Design: Visual polish — brand identity, dark mode and polished 3D vehicles with system drill-down

> Based on `proposal.md` (revision 2, approved 2026-11-21) and aligned with the delta specs written in parallel (`specs/brand-theme`, `specs/vehicle-3d-assets`, `specs/vehicle-health-view`). File and line references point to the code on `main` at `edb2899`.

## Technical Approach

The change keeps the existing architecture: framework-free pure modules hold every rule that can be decided without a browser, and thin React/R3F components render their results (container-presentational). Nothing in `src/domain` or `src/application` changes, and no Prisma or API change is made.

Four parts, delivered as chained PRs on two tracks:

1. **Brand and theme (S1a, S1b).** A two-layer token system in `globals.css` (primitive palette, then semantic tokens resolved with the CSS `light-dark()` function), a `data-theme` attribute on `<html>` set by a tiny static blocking script before first paint, a client theme store over `localStorage`, a three-option toggle, a TypeScript mirror of the tokens the 3D scene needs, a `currentColor` SVG logo, `app/icon.svg`, and a self-hosted variable font through `next/font/local`.
2. **Asset pipeline (S0, S4, Track A).** A parametric `bpy` generator under `twines/tools/blender/` driven by one JSON preset per shell, two procedural assemblies with named part nodes, a Node optimizer built on the `@gltf-transform` libraries, and a Node asset-contract check that runs inside `npm test`.
3. **Manifest and viewer (S2).** A typed manifest (`assets/manifest.ts`) that imports per-shell placements from the same JSON presets the generator uses, a pure resolver, a pure scene-layout builder, an imperative GLB loader with errors as data (no Suspense error path), drei `CameraControls` with per-frame auto-rotate, and the existing primitive scene as the technical fallback.
4. **Generic system drill-down (S3).** A pure focus reducer (`idle → focusing → focused → exiting`), pure system-status derivations (attention indicator, contains-selected-part marker, accessible labels), a pure fade stepper, and presentational R3F pieces that read those results.

The 2D SVG diagram keeps its structure and only receives theme tokens.

## Architecture Decisions

### Decision 1: Two-layer CSS tokens resolved with `light-dark()`

**Choice**: `globals.css` defines (a) primitive tokens (`--ink-0` … `--ink-950` cool neutrals, `--cobalt-300` … `--cobalt-700` accent) and (b) semantic tokens defined once each as `light-dark(<light primitive>, <dark primitive>)`. Status tokens (`--status-*`, `--status-*-text`) stay plain hex declarations outside `light-dark()`, so they are identical in both themes by construction and the regexes in `tests/unit/components/status-colors-3d.test.ts:10` and `tests/component/vehicle-health/status-colors.test.tsx:8` keep working. Theme selection is only `color-scheme`:

```css
:root { color-scheme: light dark; }            /* no attribute (JS off): follows the OS */
:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="dark"]  { color-scheme: dark; }
```

**Alternatives considered**: Two full blocks (`[data-theme="light"] {…}` and `[data-theme="dark"] {…}`) plus a duplicated `@media (prefers-color-scheme: dark)` block; Tailwind or a CSS-in-JS theme object.
**Rationale**: Each semantic token is written once, so the light and dark sets cannot drift (THEME-02 holds by construction and the test only has to parse one declaration per token). The OS default works even without JavaScript, because `color-scheme: light dark` makes `light-dark()` follow `prefers-color-scheme`, and it falls back to light when no preference exists (THEME-12). `light-dark()` is Baseline 2024 (Chromium 123, Firefox 120, Safari 17.5), and the e2e project runs Desktop Chrome (`playwright.config.ts:32`). The app has no Tailwind (`globals.css` is plain CSS), so adding one would be a much larger change.

Initial palette (contrast computed with the WCAG formula already used in `status-colors.test.tsx:13-24`; the automated test is the gate, not these numbers):

| Semantic token | Light | Dark | Checked pair |
|---|---|---|---|
| `--color-bg` | `--ink-50` #f5f7fa | `--ink-950` #0a0f19 | — |
| `--color-surface` | `--ink-0` #ffffff | `--ink-900` #121926 | — |
| `--color-text` | `--ink-900` | `--ink-50` | 17.6:1 / 16.4:1 on surface |
| `--color-text-muted` | `--ink-600` #445064 | `--ink-300` #aeb8c7 | 8.1:1 / 8.8:1 |
| `--color-accent` (links, actions) | `--cobalt-600` #2a56d1 | `--cobalt-300` #8fb0ff | 6.3:1 / 8.2:1 |
| `--color-on-accent` | `--ink-0` | `--ink-950` | 6.3:1 / 9.0:1 |
| `--color-border` (decorative) | `--ink-200` | `--ink-700` | not a 3:1 boundary |
| `--color-border-strong` (inputs, buttons) | `--ink-500` #5a677b | `--ink-400` #7d8a9e | 5.7:1 / 5.0:1 |
| `--color-focus` | `--cobalt-600` | `--cobalt-300` | ≥ 3:1 on bg and surface |
| `--status-swatch-ring` | `--ink-600` | `--ink-200` #d3dae4 | 8.1:1 / 12.5:1 |
| `--color-danger`, `--color-on-danger` | chosen in S1a by the contrast test | | ≥ 4.5:1 |

The accent hue is about 224°, at least 100° away from every status hue (green ≈ 123°, yellow ≈ 48°, orange ≈ 25°, red ≈ 0°), which satisfies THEME-04 and avoids the purple look. The swatch ring is applied in both themes, because status yellow `#facc15` is also below 3:1 on white. Status colors never change (THEME-24, THEME-31).

### Decision 2: Theme preference in `localStorage`, applied before paint by a static inline script

**Choice**:
- Storage key `twines.theme`, values `light` | `dark`; "system" removes the key. Every read and write sits in `try/catch` (THEME-17, THEME-18).
- `src/app/layout.tsx` renders `<html lang="en" suppressHydrationWarning className={font.variable}>` with `<head><script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} /></head>`. The script is a constant string with no interpolated data. It sets `data-theme` (`light`/`dark`, the resolved theme, which THEME-05/06 need), `data-theme-preference` (`system`/`light`/`dark`) and `style.colorScheme` before the body is parsed.
- A `ThemeSync` client component mounted once in the root `<body>` keeps the attributes current after hydration. It reacts to the OS `prefers-color-scheme` change while the preference is "system" (THEME-11), to the `storage` event from other tabs (THEME-15), and to a same-tab custom event that the toggle dispatches.
- The toggle reads the preference through `useSyncExternalStore` with a server snapshot of `"system"`, so React reconciles to the client value after hydration without a mismatch error (the same pattern as `usePrefersReducedMotion.ts:21-23`).

**Alternatives considered**:
- (a) A cookie read by the server in the root layout. Rejected: a `Path=/` cookie is sent on every `/api/*` request, which contradicts THEME-19 ("no application API request carries the theme choice"). Reading `cookies()` in the root layout would also make every route dynamic.
- (b) `next-themes`. Rejected: it adds a dependency and a client provider that renders the script from a client component (the source of React 19's "script tag inside a component" warning). Its features beyond about 30 lines of in-house code are not needed.
- (c) `next/script` with `beforeInteractive`. Rejected: in the App Router it is not guaranteed to run before first paint.

**Rationale**: This is the only option that meets THEME-19, THEME-21/22 (correct attribute at first paint) and THEME-23 (no hydration error) together. Root-layout server components may render inline `<script>` (the documented JSON-LD pattern). Because the script is static, it has no injection surface. There is no CSP today (`src/proxy.ts` sets none), so no nonce is needed. If a CSP is added later, the script needs a nonce or a hash.

### Decision 3: Theme logic split into a pure module, a boot string and a client store

**Choice**: `theme-preference.ts` (pure: `parseStoredPreference`, `resolveTheme`), `theme-boot-script.ts` (the inline string, which applies the same semantics in ES5 with no imports), `theme-store.ts` (browser-only subscribe/read/write/apply) and `useThemePreference.ts` / `useResolvedTheme.ts` hooks. The boot script is tested by running the exported string with `new Function` against fake `document`, `localStorage` and `matchMedia` objects. That way, the shipped bytes are what the test checks.
**Alternatives considered**: Building the script with `resolveTheme.toString()`.
**Rationale**: The output of `toString()` depends on the bundler and minifier. Testing the exact string removes that risk while keeping the semantics in one tested pure module plus one tested string.

### Decision 4: Three-option toggle as native radio inputs

**Choice**: `ThemeToggle` is a `<fieldset>` with a visually hidden `<legend>Theme</legend>` and three native `<input type="radio" name="theme">` controls labelled System, Light and Dark, styled as a segmented control. It is placed in `AppShell` (`src/components/auth/app-shell.tsx:15-23`) and in the `(auth)` layout (`src/app/(auth)/layout.tsx:6`), so sign-in and sign-up have it too.
**Alternatives considered**: A menu button with a popover; a single button that cycles through the options.
**Rationale**: Native radios provide the accessible name, the checked state, arrow-key operation and stable focus for free (THEME-13, THEME-20) and need no test-only key simulation. A cycling button hides the "system" state, which THEME-13 requires to be visible.

### Decision 5: Self-hosted font through `next/font/local` with a committed file

**Choice**: Manrope Variable (SIL OFL 1.1), latin subset, as one committed `woff2` in `src/app/fonts/` with `OFL.txt` beside it. It is loaded in `src/app/fonts.ts` with `next/font/local` (`variable: "--font-sans"`, `display: "swap"`, a system fallback stack and automatic fallback metrics). Numeric columns use `font-variant-numeric: tabular-nums`.
**Alternatives considered**: `next/font/google` (self-hosted at runtime but downloaded at build time); Geist (the create-next-app default, so less distinctive); Inter.
**Rationale**: `next/font/google` makes every `next build` (including the e2e web server, `playwright.config.ts:37`) depend on network access to Google. A committed file keeps builds offline and deterministic and satisfies THEME-36/37. Manrope's geometric, slightly technical shapes fit the "stylized-premium" direction without the generic look of the default. Getting the file needs one download (see Open Questions).

### Decision 6: Logo as an SVG component plus `app/icon.svg`

**Choice**: `src/components/brand/Logo.tsx` exports `Logo` (mark plus wordmark) and `LogoMark`, both drawn with `fill="currentColor"`. The wordmark is converted to paths, so it does not depend on the font. Props: `title?: string`. With a title it renders `role="img"` and `aria-label`; without one it renders `aria-hidden="true"` (THEME-34). `src/app/icon.svg` uses the accent with an embedded `@media (prefers-color-scheme: dark)` style for browser chrome. `src/app/favicon.ico` is deleted (THEME-35). Concept: a mark made of two mirrored rounded halves (the "twin") enclosing a wheel or gauge arc. The first version the user approves ships (cut-line 6).
**Alternatives considered**: PNG or ICO icons; a logo `<img>` file.
**Rationale**: `currentColor` makes the logo follow the text token in both themes with no per-theme assets (THEME-33). The Next file convention serves `icon.svg` and adds the `<link>` automatically.

### Decision 7: TypeScript token mirror for the 3D scene, with a sync test

**Choice**: `src/components/brand/theme/scene-tokens.ts` exports `SCENE_TOKENS: Record<ResolvedTheme, { ground; shadow; ghostTint; outline; hotspotRing }>` and names, for each entry, the CSS token it mirrors. `status-colors.ts:7-12` stays the status mirror. The current hard-coded scene colors (`VehicleScene.tsx:15-18`) move into `SCENE_TOKENS`. A test parses `globals.css`, resolves `light-dark(var(--a), var(--b))` and `var()` chains, and compares both themes entry by entry (THEME-03).
**Alternatives considered**: `getComputedStyle` at runtime inside the canvas.
**Rationale**: This follows the existing pattern (`status-colors.ts:3-6`). Reading computed styles per frame or per theme change from R3F is fragile, cannot be tested in Node, and couples rendering to DOM timing.

### Decision 8: Generator layout and execution modes

**Choice**:

```
twines/tools/blender/
  README.md                 # Blender 5.2.x pin, MCP snippet, CLI command, Text Editor steps, sign-off checklist
  generate.py               # entry: adds its folder to sys.path, parses args after "--", calls twines_gen.run.main
  twines_gen/
    __init__.py             # GENERATOR_VERSION = "1.0.0"
    run.py                  # main(argv), reload_all() for live MCP iteration, target selection
    scene.py                # dedicated "twines-gen" scene + collection; never touches other scenes
    naming.py               # node-name constants, regex, uniqueness and ".NNN" guard before export
    materials.py            # brand PBR materials by role (paint, glass, trim, rubber, metal, plastic, lens)
    presets.py              # JSON preset loader + validation (dataclasses)
    shell.py                # parametric shell from a preset
    assemblies.py           # engine_bay(), wheel_brake()
    kenney.py               # fallback path only (created only if S0 decides it, see Decision 16)
    export.py               # glTF export with fixed, RNA-validated settings
  presets/
    sedan-corolla.json  sedan-generic.json  hatchback-fit.json  hatchback-generic.json
    suv-tucson.json     suv-generic.json    pickup-hilux.json   pickup-generic.json
  out/                      # raw exports, git-ignored
```

Execution, with identical code in both modes:
- **Blender MCP / Text Editor (live Blender)**: `import sys; sys.path.insert(0, r"<abs>/twines/tools/blender"); import twines_gen.run as run; run.reload_all(); run.main(["--target", "sedan-corolla", "--out", r"<abs>/twines/tools/blender/out"])`. The README shows this snippet with a placeholder path. It builds only inside the dedicated `twines-gen` scene, so the user's open work is never deleted.
- **CLI**: from `twines/`: `blender --background --factory-startup --python tools/blender/generate.py -- --target all --out tools/blender/out`. `--factory-startup` removes user add-ons and preferences for determinism.

**Alternatives considered**: One monolithic script; presets as Python modules; building in the default scene.
**Rationale**: Small modules keep each piece reviewable within the line budget, and `reload_all()` makes live iteration through the MCP practical. Presets are JSON, so the Node side (manifest, contract check) reads the same files (Decision 11). A dedicated scene makes MCP runs safe in someone else's live Blender.

### Decision 9: Node naming convention and export settings

**Choice**:
- Coordinates: 1 unit = 1 m. The front of the vehicle is at +X (the convention in `models/types.ts:4`). Blender builds Z-up and the exporter writes Y-up.
- Names: ASCII lowercase kebab case, unique per file, no `.NNN` suffix, and no manufacturer or model names inside any GLB (ASSET-29). Allowed forms:

| Node | Pattern | Rules |
|---|---|---|
| Shell root | `shell` | Exactly one; the only fadeable root; geometry children `shell-<piece>` (body, glass, trim, lights …) |
| Shell anchors | `anchor-<assembly>-<n>` | Empties at scene root; one per manifest placement (for example `anchor-engine-bay-0`, `anchor-wheel-brake-0..3`) |
| Assembly root | `asm-<assembly>` | Exactly one per assembly file |
| Part | `part-<partId>` | Direct child of `asm-*`; exactly one mesh with exactly one primitive (one material), so it can be highlighted and selected alone |
| Detail | `detail-<name>` | Non-selectable geometry |

- Materials are named by role (`paint`, `glass`, `trim-dark`, `rubber`, `metal-cast`, `plastic-black`, `lens`), never after a brand.
- Export: GLB, `export_apply=True` (applies bevel and weighted-normal modifiers), `export_yup=True`, active collection only, no cameras, lights, animations, skins, morphs or extras, Draco off, normals on, texture coordinates only when a material has an image (none by default). `export.py` checks each keyword against `bpy.ops.export_scene.gltf.get_rna_type().properties` and fails loudly when a required keyword is missing, instead of passing unknown keywords (per the MCP guidance not to hardcode identifiers).

**Alternatives considered**: Blender's default names; colon-namespaced names such as `part:engine-oil`.
**Rationale**: three.js `PropertyBinding.sanitizeNodeName` replaces `.`, `:`, `/`, `[`, `]` and whitespace, so those characters would not round-trip. Prefixes make the contract machine-checkable. The single-primitive rule is what makes `<Outlines>` and individual highlighting possible (Decision 14).

### Decision 10: Optimization with the `@gltf-transform` libraries, not the CLI `optimize` command

**Choice**: `twines/scripts/assets/optimize.ts` (run with `npm run assets:optimize -- [ids…]` through `tsx`) reads `tools/blender/out/<id>.glb` and writes `public/models/<id>.glb`. It uses `NodeIO` with the registered extensions and the `meshoptimizer` encoder and decoder, and applies `dedup()`, `prune({ keepLeaves: true })`, `weld()`, then `meshopt({ encoder, level: "medium" })`. `textureCompress` to WebP (which needs `sharp`) is added only if a committed asset ever carries an image (cut-line item 2), with a 1024 px maximum. The script prints bytes and triangles per file. New devDependencies, pinned exactly per the project convention: `@gltf-transform/core`, `@gltf-transform/extensions`, `@gltf-transform/functions` and `meshoptimizer`. Exact option names are verified against the installed versions in the first RED test of S2.
**Alternatives considered**: `@gltf-transform/cli optimize` (named in the proposal); `gltfjsx --transform`.
**Rationale**: The CLI `optimize` command enables `join`, `flatten`, `instance`, `simplify` and leaf pruning by default. Those steps merge or remove the named part nodes and the empty anchor nodes the contract depends on. The library calls make every step explicit and reviewable. `gltfjsx` uses Draco by default with a CDN decoder. The CLI may still be run ad hoc for inspection; it is not a dependency.

### Decision 11: Per-shell placements single-sourced in the JSON presets

**Choice**: Each preset JSON holds `id`, `bodyType`, `source` (`{ "kind": "parametric" }` or `{ "kind": "kenney", … }`), dimensions, profile and feature parameters, and `placements: { "<assemblyId>": Transform[] }`. The generator turns `placements` into `anchor-*` empties. `assets/manifest.ts` imports the same JSON files (`import corolla from "../../../../tools/blender/presets/sedan-corolla.json"`) and uses their `placements` and `bodyType`. Assembly-local data (part anchors, local bounds, focus anchors) is entered in the manifest and checked against the GLBs by the contract check, which prints the measured values when they differ.
**Alternatives considered**: The same numbers typed twice (preset and TS manifest); a generated TS file.
**Rationale**: There is one source of truth, ASSET-35 (one preset per shell) holds structurally, and the contract check still detects drift between the GLB anchors and the manifest. The JSON files are about 1 KB each, so bundling them is negligible.

### Decision 12: Locally served meshopt decoder from `three`, Draco never configured

**Choice**: The loader uses `GLTFLoader` from `three/examples/jsm/loaders/GLTFLoader.js` and `MeshoptDecoder` from `three/examples/jsm/libs/meshopt_decoder.module.js`. Both are already in the pinned `three@0.187.0`, and the decoder embeds its WASM as base64 (`meshopt_decoder.module.js:6-8`, `:26`), so it makes no network request. Both are bundled into the lazily loaded Vehicle3D chunk served from the app's origin. Draco is never configured. The contract check rejects `KHR_draco_mesh_compression` and any extension outside an allow-list (`EXT_meshopt_compression`, `KHR_mesh_quantization`, `KHR_materials_emissive_strength`, `KHR_texture_transform`, `EXT_texture_webp`). No `public/decoders/` folder is needed.
**Alternatives considered**: drei `useGLTF`, whose Draco option defaults to on with a `gstatic.com` decoder path (`drei/core/Gltf.js:8-19`); copying a decoder file into `public/`.
**Rationale**: This meets ASSET-38 and THEME-36-style "own origin" rules with zero extra files. The proposal listed `public/decoders/`; that entry is dropped because it is unnecessary.

### Decision 13: Imperative GLB loading with errors as data, plus an error boundary as a safety net

**Choice**: `three/load-vehicle-assets.ts` keeps a module-level `Map<url, Promise<GLTF>>` and deletes an entry when its promise rejects, so a later mount can retry. `three/useVehicleAssets.ts` loads the shell and its assemblies in parallel (`Promise.all`) as soon as `Vehicle3D` mounts and returns `{ status: "loading" | "ready" | "error", gltfs }`. `Vehicle3D` renders the primitive `VehicleScene` on `"error"` (VIEW-13/14, ASSET-15/16), and the whole model falls back when any file fails. `ModelErrorBoundary` (a class component) wraps the GLB subtree only to catch unexpected render exceptions, with the same fallback.
**Alternatives considered**: drei `useGLTF` plus `<Suspense>`, `useGLTF.preload` and an error boundary (the path in the proposal).
**Rationale**: React 19 reports errors caught by an error boundary through `onCaughtError`, which logs to the console by default. That conflicts with "the page has no errors" in VIEW-13. Treating a failed download as data avoids a thrown error altogether. Component tests then mock one module returning a resolved or rejected promise instead of simulating Suspense. Parallel loading replaces `preload` without the hook waterfall. The e2e test must still ignore Chromium's own `Failed to load resource` console line for the URL it aborted on purpose.

### Decision 14: Rendering, fade, raycast and highlight

**Choice**:
- `three/GlbVehicle.tsx` clones the cached shell scene and clones its materials once per mount, because the fade mutates materials and the cache is shared across navigations. It renders one cloned instance of each assembly per placement transform.
- **Fade**: the target opacity is `GHOST_OPACITY = 0.12` while the focus phase is `focusing` or `focused`, otherwise `1`. A pure `stepOpacity(current, target, dt, reducedMotion)` damps toward the target (`THREE.MathUtils.damp`-style, and it snaps under reduced motion or when within 0.01). A pure `materialModeFor(opacity)` returns `{ transparent: opacity < 1, depthWrite: opacity >= 1 }`, and the material is flagged for update only when the mode flips.
- **Raycast**: R3F hit-tests only objects with handlers. While the phase is `idle`, the shell root carries `onClick`/`onPointerDown` handlers that only `stopPropagation`, so it hides loose parts behind it. In every other phase the shell has no handlers and every shell mesh gets a no-op `raycast`, restored on return (VIEW-22). Assembly instances get one `onClick` handler on the instance root, which maps `event.object.name` (`part-*`) to a `PartId` through the manifest. It is attached only when the part is interactive (its system is focused, or the part is loose).
- **Highlight**: the selected interactive part gets drei `<Outlines>` (accent color from `SCENE_TOKENS`, screen-space thickness), rendered into the existing part mesh with R3F `createPortal`. Interactive part meshes also get a low emissive tint of their status color. Parts inside a closed system are not highlighted in 3D; the system hotspot shows the marker instead (VIEW-37/41).
- **Lighting without remote fetches**: drei `<Environment resolution={256}>` with `<Lightformer>` children (procedural, no HDRI download; drei's `preset` prop fetches from a CDN and is never used), one directional key light, and `<ContactShadows frames={1}>`, re-keyed when the model becomes ready. The canvas is transparent and the stage background comes from CSS tokens (THEME-08). A committed CC0 HDRI is optional (cut-line 2) and would need a provenance entry.

**Alternatives considered**: Emissive-only highlight; postprocessing `Outline` (excluded by the proposal); layer-based raycast exclusion; declarative re-rendering of every GLB node in JSX.
**Rationale**: Outlines gives a crisp selection cue that does not cover the status color, and with `createPortal` the cloned GLB hierarchy stays intact. Layers would also hide the shell from the camera. Handler-based occlusion matches how R3F decides hit tests.

### Decision 15: `CameraControls` with per-frame auto-rotate

**Choice**: Replace `OrbitControls` (`Vehicle3D.tsx:54-62`) with drei `CameraControls`. drei 10.7.9 exports it (`drei/core/index.d.ts:38`) on top of `camera-controls@3.1.2` (installed; drei requires `^3.1.0`), and the API offers `fitToBox`, `setLookAt`, `rotate` and `smoothTime` (`camera-controls/dist/index.d.ts:584,746,765,294`). `three/CameraRig.tsx`:
- `makeDefault`, initial `setLookAt(5, 2.8, 5, 0, 0.9, 0, false)` (the current `CAMERA`/`TARGET`, `Vehicle3D.tsx:13-14`), `minDistance` 4 in the overview and 0.5 while focused, `maxDistance` 12, `maxPolarAngle = π/2 − 0.05`, `smoothTime = 0.35`, truck/pan disabled through `mouseButtons`/`touches` (equivalent to `enablePan={false}`).
- **Auto-rotate**: `useFrame((_, dt) => enabled && !dragging && controls.rotate(AUTO_ROTATE_RAD_PER_SEC * Math.min(dt, 0.1), 0, false))` with `AUTO_ROTATE_RAD_PER_SEC = 2π / 75`, the same speed as `autoRotateSpeed = 0.8` (`Vehicle3D.tsx:15-16`). `dragging` follows `onControlStart`/`onControlEnd`. `enabled` comes from the pure selector `autoRotateEnabled` (Decision 17).
- **Focus**: `fitToBox(box, !reducedMotion, { padding… })` on enter and `setLookAt(<overview>, !reducedMotion)` on exit. Each resolved promise dispatches a phase-tagged `transition-end`. If reduced motion turns on mid-transition, the rig re-issues the same target with `enableTransition = false` (VIEW-18). The box comes from the pure scene layout (Decision 18), not from the GPU scene.

**Alternatives considered**: Keep `OrbitControls` and tween the camera by hand; drei `<Bounds>`.
**Rationale**: `fitToBox`/`setLookAt` return promises, which give the state machine a clean "done" signal. `<Bounds>` cannot express an exit to a fixed overview pose with a completion event. `camera-controls` has no built-in auto-rotate (confirmed in the type definitions), hence the `rotate` call per frame.

### Decision 16: S0 fallback pipelines are data switches, not design changes

**Choice**:
- **Parametric look fails** → Kenney Car Kit (CC0). The source models actually used are committed under `twines/tools/blender/vendor/kenney-car-kit/` with the kit's licence file (CC0 permits redistribution and the files are small). Each preset switches to `"source": { "kind": "kenney", "file": "…", "scale": [x, y, z], "adjust": {…} }`. `twines_gen/kenney.py` imports the source, removes its wheels (replaced by the wheel-brake assembly), remaps source materials to brand materials by role, applies the proportion adjustments, bevel and weighted normals, renames the result to the `shell`/`shell-*` contract and creates the anchors. Export, optimization, manifest, contract check and runtime stay unchanged. Provenance records the Kenney URL, kit version and CC0. Downloading the kit needs explicit user authorization (it is a remote fetch).
- **Procedural assemblies fail** → assemblies built in code. `AssemblyAsset.source` becomes `{ kind: "code", builder: "engine-bay" | "wheel-brake" }`, and a `three/code-assemblies/` component builds named meshes (`part-*` names identical) from R3F primitives. Manifest, layout, interaction and highlight code do not change. The GLB node checks (ASSET-19/20) then apply to the generated object tree in a component test instead of a file, so the spec must be amended if this path is taken (see Risks).
- Partial go is valid per asset class, because the shell source and the assembly source are independent fields.

**Rationale**: The S0 go/no-go result changes only data and one generator module, which matches the proposal's requirement that S0 cannot reopen design.

### Decision 17: Pure focus state machine

**Choice**: `drill-down/focus-machine.ts`, a reducer with phase-tagged events. Unknown or out-of-phase events return the same object, so React skips the re-render. Selectors derive everything the UI needs. Detail in Interfaces.
**Alternatives considered**: Booleans (`isOpen`, `isAnimating`); XState.
**Rationale**: The transitions are few and closed. A reducer under 60 lines is exhaustively unit-testable (VIEW-29 idempotence, VIEW-18 races) and needs no dependency. Phase tags make a late `transition-end` from an interrupted camera promise harmless.

### Decision 18: Renderer-independent scene layout

**Choice**: `assets/scene-layout.ts` builds, from `(manifest, shell)`, the world positions of every part hotspot, each system's hotspot anchor and focus box, and which parts are loose (in no system; VIEW-10). Part position = placement of the assembly instance (the system's `focusInstance` for system members, instance 0 for loose parts) applied to the assembly's local part anchor. The focus box is the placement applied to the assembly's local bounds, plus a margin.
**Alternatives considered**: Read positions and boxes from the loaded three.js scene (`Box3.setFromObject`).
**Rationale**: The layout can be unit-tested in Node and is available before the GLBs load. Camera targets are therefore deterministic, and the contract check guarantees that the local anchors and bounds match the GLB geometry.

### Decision 19: Primitive fallback keeps today's flat behavior

**Choice**: When no shell resolves (empty or partial manifest) or a GLB fails, `Vehicle3D` renders the existing `VehicleScene` (`VehicleScene.tsx:26-73`) and the 8 flat part hotspots from `BodyModel.hotspots` (`models/types.ts:26`), with no systems and no drill-down. The primitive models and their test (`tests/unit/components/vehicle-health-models.test.ts`) are kept unchanged.
**Alternatives considered**: Drill-down on primitives with system anchors computed from part centroids.
**Rationale**: VIEW-15 requires "all 8 part zones directly selectable … no system hotspot or drill-down" in the fallback. It is also the least code and keeps the fallback a pure technical safety net. During S2–S3, vehicles whose shell has not landed yet use this path, so existing e2e tests on those vehicles keep passing until they are migrated.

### Decision 20: Coverage scope extended to the new pure modules

**Choice**: Add `src/components/vehicle-health/assets/**/*.ts`, `src/components/vehicle-health/drill-down/**/*.ts`, `src/components/brand/theme/theme-preference.ts` and `scripts/assets/**/*.ts` to `coverage.include` in `vitest.config.ts:46`, under the same 80% thresholds.
**Rationale**: Today only `src/domain` and `src/application` are measured (`vitest.config.ts:44-46`). Without this change, the new rule-bearing modules would sit outside the "≥ 80% coverage, never cut" guarantee. React components stay measured by component and e2e tests, as before.

## Data Flow

### Page to viewer

```
vehicles/[id]/page.tsx (server)
   │ vehicle {make, model, bodyType}, parts (PartRow[])
   ▼
VehicleHealthWithModel ──► VehicleHealthView (owns selectedPartId)
                              │ VehicleVisualProps + make/model
                              ▼
                 webgl? ──no──► VehicleDiagram2D (tokens only)
                   │yes
                   ▼
                Vehicle3D (container)
                   │ resolveShell(manifest, vehicle) ──► ShellAsset | null
                   │ buildSceneLayout(manifest, shell) ──► SceneLayout
                   │ useVehicleAssets(urls) ──► loading | ready | error
                   │ useReducer(focusReducer) ──► FocusState
                   │ systemHotspotState(...) per system (attention, marker, label)
                   ▼
   ┌───────────────┴───────────────────────────────┐
   │ <Canvas>                                       │ DOM overlay (stage)
   │  SceneLighting(theme)                          │  loading status (VIEW-44)
   │  ready ? GlbVehicle(phase, selected, …)        │  Back to overview (focused)
   │        : error|no shell ? VehicleScene (flat)  │
   │  CameraRig(phase, focusBox, autoRotate, rm)    │
   │  Hotspots (drei Html → <button>s)              │
   └────────────────────────────────────────────────┘
        onSelect(partId) ──► VehicleHealthView.setSelectedPartId
        openSystem / close ──► dispatch(focus event)   (never from the list)
```

### Drill-down sequence

```
User        Hotspot(button)   Vehicle3D(reducer)   CameraRig        GlbVehicle
 │ click/Enter ─►│                 │                  │                 │
 │               │─ open(engine) ─►│ idle→focusing    │                 │
 │               │                 │─ focusBox,phase ►│ fitToBox(rm?)   │
 │               │                 │─ phase ─────────────────────────► │ fade→0.12, shell handlers off
 │               │  (focus moves to Back control)     │                 │
 │               │                 │◄ transition-end(focusing) ─ promise resolved
 │               │                 │ focusing→focused │                 │ part handlers on
 │ Esc / Back ──────────────────► │ focused→exiting  │                 │
 │               │                 │─ overview pose ─►│ setLookAt(rm?)  │ fade→1
 │               │  (focus returns to system hotspot) │                 │
 │               │                 │◄ transition-end(exiting) ─ promise resolved
 │               │                 │ exiting→idle (auto-rotate may resume)
```

`rm` = reduced motion: the camera call uses `enableTransition = false`, the promise resolves at once, and the fade snaps.

### Theme

```
first byte ─► <head> THEME_BOOT_SCRIPT: localStorage → resolveTheme → html[data-theme, data-theme-preference, color-scheme]
            ─► CSS light-dark() tokens resolve before first paint
hydrate    ─► ThemeSync subscribes: matchMedia(change) | storage(event) | toggle(custom event) → re-apply attributes
toggle     ─► writePreference (try/catch) → apply → dispatch custom event
3D         ─► useResolvedTheme (MutationObserver on data-theme) → SCENE_TOKENS[theme]
```

### Assets (Track A)

```
presets/<id>.json ─► Blender (MCP | CLI) generate.py ─► tools/blender/out/<id>.glb (git-ignored)
                                                            │ npm run assets:optimize
                                                            ▼
                                          public/models/<id>.glb + provenance.json (committed)
                                                            │ npm test → asset-contract.test.ts
manifest.ts ◄── imports presets/*.json (placements) ────────┘ checks nodes, budgets, extensions, names, provenance, anchors
```

## File Changes

Paths are relative to `twines/` unless noted. "Slice" maps to the proposal schedule; sub-slices are separate chained PRs (see Slice Plan).

| File | Action | Slice | Description |
|---|---|---|---|
| `tools/blender/README.md` | Create | S0a | Blender 5.2.x pin, MCP snippet, CLI command, Text Editor steps, sign-off and screenshot checklist |
| `tools/blender/generate.py` | Create | S0a | Entry point for CLI and Text Editor |
| `tools/blender/twines_gen/{__init__,run,scene,naming,materials,presets,export}.py` | Create | S0a | Generator core (Decision 8, 9) |
| `tools/blender/twines_gen/shell.py` | Create | S0a | Parametric shell: lofted rounded cross-sections at stations along X, boolean wheel arches, inset glass greenhouse, bevel and weighted normals; features `cargo: trunk | hatch | bed` |
| `tools/blender/presets/sedan-corolla.json` | Create | S0a | First preset (public proportion data) |
| `tools/blender/twines_gen/assemblies.py` | Create | S0b | `engine_bay()` (6 `part-*` and `detail-*` nodes), `wheel_brake()` (`part-tires`, `part-brake-pads`, rim, disc) |
| `openspec/changes/visual-polish-3d-brand/s0-findings.md` (repo root) | Create | S0b | Measured triangles, bytes, node names, screenshots, go/no-go per asset class |
| `/.gitignore` (repo root) | Modify | S0a | Add `twines/tools/blender/out/`, `__pycache__/`, `*.blend1` (the root `out/` rule at line 6 already matches; the explicit rule documents intent) |
| `src/app/globals.css` | Modify | S1a.1 | Primitive and semantic tokens, `color-scheme` rules, base typography; status tokens kept as plain hex |
| `src/components/brand/theme/scene-tokens.ts` | Create | S1a.1 | 3D token mirror (Decision 7) |
| `src/components/vehicle-health/VehicleScene.tsx` | Modify | S1a.1 | Colors from `SCENE_TOKENS` instead of `:15-18` literals |
| 12 `*.module.css` under `src/` (auth layout, vehicles page, app-shell, auth-form, HealthSummary, PartDetailPanel, PartList, Vehicle3D, VehicleDiagram2D, StatusBadge, delete-vehicle-button, vehicle-list) | Modify | S1a.2 | Replace the remaining literals (about 95, per grep over `src/`) with `var(--…)`; add the status swatch ring |
| `src/components/brand/theme/theme-preference.ts` | Create | S1a.3 | Pure parse/resolve |
| `src/components/brand/theme/theme-boot-script.ts` | Create | S1a.3 | Static inline script string |
| `src/components/brand/theme/theme-store.ts` | Create | S1a.3 | Browser storage, events, attribute application |
| `src/components/brand/theme/useThemePreference.ts`, `useResolvedTheme.ts` | Create | S1a.3 | `useSyncExternalStore` hooks |
| `src/components/brand/ThemeSync.tsx` | Create | S1a.3 | Root-level subscription (THEME-11, THEME-15) |
| `src/components/brand/ThemeToggle.tsx` + `.module.css` | Create | S1a.3 | Radio segmented control |
| `src/app/layout.tsx` | Modify | S1a.3, S1b | Boot script, `suppressHydrationWarning`, `ThemeSync`; font variable in S1b |
| `src/components/auth/app-shell.tsx` + `.module.css` | Modify | S1a.3, S1b | Toggle (S1a.3), logo (S1b) |
| `src/app/(auth)/layout.tsx` + `.module.css` | Modify | S1a.3, S1b | Toggle and logo on sign-in and sign-up |
| `src/components/brand/Logo.tsx` | Create | S1b | SVG logo and mark with `currentColor` |
| `src/app/icon.svg` | Create | S1b | Site icon |
| `src/app/favicon.ico` | Delete | S1b | Replaced by `icon.svg` |
| `src/app/fonts.ts`, `src/app/fonts/Manrope-Variable.woff2`, `src/app/fonts/OFL.txt` | Create | S1b | Self-hosted font (binary and licence text are not authored lines) |
| `src/components/vehicle-health/assets/types.ts` | Create | S2.1 | Manifest types |
| `src/components/vehicle-health/assets/budgets.ts` | Create | S2.1 | Budgets and the extension allow-list (shared with the contract check) |
| `src/components/vehicle-health/assets/resolve-shell.ts` | Create | S2.1 | Pure resolver |
| `src/components/vehicle-health/assets/scene-layout.ts` | Create | S2.1 | Pure layout (Decision 18) |
| `src/components/vehicle-health/assets/manifest.ts` | Create | S2.1 → S4 | Data: assemblies, systems (S3), shells added as GLBs land (S2.2b Corolla; S4 the other 7) |
| `scripts/assets/contract.ts` | Create | S2.2a | Pure `checkAssetContract(input): Violation[]` and `loadContractInput(root)` |
| `scripts/assets/check.ts` | Create | S2.2a | CLI `npm run assets:check` (non-zero exit on violations) |
| `scripts/assets/optimize.ts` | Create | S2.2b | Optimizer (Decision 10) |
| `public/models/{sedan-corolla,engine-bay,wheel-brake}.glb` | Create | S2.2b | First optimized binaries (bytes reported in the PR) |
| `public/models/provenance.json` | Create | S2.2b → S4 | Provenance records |
| `package.json` | Modify | S2.2a/b | Exact-pinned devDependencies (Decision 10); scripts `assets:optimize`, `assets:check` |
| `vitest.config.ts` | Modify | S2.1 | Coverage include (Decision 20) |
| `src/components/vehicle-health/three/load-vehicle-assets.ts`, `useVehicleAssets.ts` | Create | S2.3 | Loader and state hook (Decision 13) |
| `src/components/vehicle-health/three/GlbVehicle.tsx` | Create | S2.3 → S3 | Shell and assembly rendering; fade, raycast and highlight added in S3 |
| `src/components/vehicle-health/three/SceneLighting.tsx` | Create | S2.3 | Lightformers, key light, contact shadows |
| `src/components/vehicle-health/three/ModelErrorBoundary.tsx` | Create | S2.3 | Safety net |
| `src/components/vehicle-health/three/CameraRig.tsx` | Create | S2.4 → S3 | CameraControls and auto-rotate; focus transitions in S3 |
| `src/components/vehicle-health/three/Hotspots.tsx` | Create | S2.4 → S3 | Html buttons for loose parts (S2), systems and focused parts (S3) |
| `src/components/vehicle-health/Vehicle3D.tsx` | Modify | S2.4, S3.2 | Becomes the container (Data Flow) |
| `src/components/vehicle-health/Vehicle3D.module.css` | Modify | S2.4, S3.2 | Stage data attributes, system pill, back control, loading overlay |
| `src/components/vehicle-health/vehicle-visual.ts` | Modify | S2.4 | Add `make` and `model` to `VehicleVisualProps` (`:10-15`) |
| `src/components/vehicle-health/VehicleHealthView.tsx` | Modify | S2.4 | Pass `make`/`model` (`:58`); selection ownership unchanged |
| `src/components/vehicle-health/drill-down/focus-machine.ts` | Create | S3.1 | Reducer and selectors |
| `src/components/vehicle-health/drill-down/system-status.ts` | Create | S3.1 | Attention, marker, labels |
| `src/components/vehicle-health/drill-down/fade.ts` | Create | S3.1 | `stepOpacity`, `materialModeFor`, `shellIsInteractive` |
| `src/components/vehicle-health/drill-down/useEscapeToExit.ts` | Create | S3.2 | Document `keydown` listener only while focusing or focused; ignores editable targets |
| `src/components/vehicle-health/models/**` | Keep | — | Primitive fallback |
| `tools/blender/presets/*.json` (7 more), generator feature additions (hatch, SUV, bed) | Create/Modify | S4 | Remaining shells |
| `public/models/*.glb` (7 more) | Create | S4 | Remaining shells |
| `tools/blender/twines_gen/kenney.py`, `tools/blender/vendor/kenney-car-kit/**` | Create | Only if the S0 look criterion fails | Fallback (Decision 16) |
| `README.md` (twines), test-plan traceability docs | Modify | S5 | Asset workflow, theme, IDs THEME/ASSET/VIEW |

## Interfaces / Contracts

### Manifest (`assets/types.ts`)

```ts
import type { BodyType } from "@/application/ports";
import type { PartId } from "@/domain/part-health/catalog";
import type { Vec3 } from "../models/types";

export type AssemblyId = string;   // "engine-bay" | "wheel-brake" today; open for data-only additions
export type SystemId = string;     // "engine-bay" | "wheels" today

export interface Transform { position: Vec3; rotation: Vec3 /* Euler XYZ, radians */; scale: Vec3 }
export interface Bounds { min: Vec3; max: Vec3 }

export type ShellMatch =
  | { kind: "specific"; make: string; model: string; bodyType: BodyType }
  | { kind: "generic"; bodyType: BodyType };

export interface ShellAsset {
  id: string;                                   // "sedan-corolla"; equals the preset file name
  file: `/models/${string}.glb`;
  match: ShellMatch;
  /** One transform per assembly instance; from the preset JSON. Index 0 of wheel-brake = front wheel on +Z. */
  placements: Readonly<Record<AssemblyId, readonly Transform[]>>;
}

export type AssemblySource =
  | { kind: "glb"; file: `/models/${string}.glb` }
  | { kind: "code"; builder: string };          // S0 fallback only (Decision 16)

export interface AssemblyAsset {
  id: AssemblyId;
  source: AssemblySource;
  root: `asm-${string}`;
  /** Every member part: its node and its hotspot anchor in assembly-local space. */
  parts: Readonly<Partial<Record<PartId, { node: `part-${string}`; anchor: Vec3 }>>>;
  /** Assembly-local bounds, verified against the GLB by the contract check. */
  bounds: Bounds;
}

export interface SystemDefinition {
  id: SystemId;
  label: string;                                // "Engine bay", "Wheels and brakes"
  partIds: readonly PartId[];
  assembly: AssemblyId;
  focusInstance: number;                        // which placement of the assembly the camera focuses
  focusAnchor: Vec3;                            // hotspot position, assembly-local
}

export interface VehicleAssetManifest {
  shells: readonly ShellAsset[];
  assemblies: readonly AssemblyAsset[];
  systems: readonly SystemDefinition[];
}
```

Invariants (manifest-integrity tests): each catalog `PartId` is mapped by exactly one assembly (ASSET-02); every system member is mapped by that system's assembly and belongs to no other system (ASSET-03); every shell has placements for every assembly that maps a part (ASSET-05); `focusInstance` is less than the placement count; the shell `id` equals a preset file name (ASSET-35).

### Resolver and layout

```ts
/** trim, collapse internal whitespace, lower-case (en-US). */
export function normalizeName(value: string): string;

/** Specific (make+model+bodyType) → generic (bodyType) → null (primitive). ASSET-08..14, ASSET-18. */
export function resolveShell(
  manifest: VehicleAssetManifest,
  vehicle: { make: string; model: string; bodyType: BodyType },
): ShellAsset | null;

export interface SceneLayout {
  systems: readonly { id: SystemId; label: string; anchor: Vec3; partIds: readonly PartId[]; focusBox: Bounds }[];
  parts: Readonly<Record<PartId, { position: Vec3; systemId: SystemId | null }>>;
  assetUrls: readonly string[];                 // shell + GLB assemblies, for the loader
}
export function buildSceneLayout(manifest: VehicleAssetManifest, shell: ShellAsset): SceneLayout;
```

### Focus machine (`drill-down/focus-machine.ts`)

```ts
export type FocusState =
  | { phase: "idle" }
  | { phase: "focusing" | "focused" | "exiting"; systemId: SystemId };

export type FocusEvent =
  | { type: "open"; systemId: SystemId }
  | { type: "close" }
  | { type: "transition-end"; phase: "focusing" | "exiting"; systemId: SystemId }
  | { type: "reset" };

export function focusReducer(state: FocusState, event: FocusEvent): FocusState;
```

| From | Event | To |
|---|---|---|
| idle | `open(s)` | focusing(s) |
| focusing(s) | `transition-end(focusing, s)` | focused(s) |
| focusing(s) / focused(s) | `close` | exiting(s) |
| exiting(s) | `transition-end(exiting, s)` | idle |
| any | `reset` (shell change, fallback) | idle |
| any other pair | — | same object (no-op; VIEW-29) |

Selectors: `activeSystemId(state)` (focusing or focused), `showsSystemHotspots(state)` (idle or exiting), `shellOpacityTarget(state)`, and `autoRotateEnabled({ state, selectedPartId, reducedMotion }) = state.phase === "idle" && selectedPartId === null && !reducedMotion` (VIEW-04/07/28). List selection never dispatches a focus event (VIEW-05/11).

Focus management (VIEW-30): on `open`, the back control mounts and receives focus. On `close`, system hotspots are shown again immediately (phase `exiting`) and focus returns to the hotspot of `state.systemId`. An `open` during `exiting` is ignored by the reducer.

### System status (`drill-down/system-status.ts`)

```ts
/** Worst child status via domain worstStatus (status.ts:18); null when all green. VIEW-31..33. */
export function systemAttention(partIds: readonly PartId[], parts: readonly PartRow[]): HealthStatus | null;
/** The system containing the selection, or null (closed systems only show the marker). VIEW-37..41. */
export function systemContainingPart(systems: SceneLayout["systems"], partId: PartId | null): SystemId | null;
/** "Engine bay, attention: Orange, contains the selected part: Engine oil". VIEW-35, VIEW-42. */
export function systemHotspotLabel(input: { label: string; attention: HealthStatus | null; selectedPartName: string | null }): string;
```

The system hotspot shows visible text, not only color: the label, an attention badge (status color plus "Orange" text) and a "Selected part inside" marker with an icon and text. It uses `aria-expanded={activeSystemId === id}`.

### Fade (`drill-down/fade.ts`)

```ts
export const GHOST_OPACITY = 0.12;
export function stepOpacity(current: number, target: number, dtSeconds: number, reducedMotion: boolean): number;
export function materialModeFor(opacity: number): { transparent: boolean; depthWrite: boolean };
export function shellIsInteractive(state: FocusState): boolean; // phase === "idle"
```

### Theme

```ts
export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";
export const THEME_STORAGE_KEY = "twines.theme";
export function parseStoredPreference(raw: unknown): ThemePreference;              // invalid → "system"
export function resolveTheme(pref: ThemePreference, prefersDark: boolean | null): ResolvedTheme; // null → light
export const THEME_BOOT_SCRIPT: string;
```

DOM contract: `html[data-theme="light|dark"]`, `html[data-theme-preference="system|light|dark"]`, `html.style.colorScheme`.

### Asset contract check (`scripts/assets/contract.ts`)

```ts
export interface Violation { file: string; rule: string; detail: string }   // e.g. rule "ASSET-25 triangles", detail "100001 > 100000"
export interface ContractInput {
  manifest: VehicleAssetManifest;
  provenance: readonly ProvenanceEntry[];
  presetIds: readonly string[];
  glbs: ReadonlyMap<string, { bytes: number; document: Document }>;   // @gltf-transform/core Document
  gitignore: string;
}
export function checkAssetContract(input: ContractInput): Violation[];   // all violations in one run (ASSET-40)
export async function loadContractInput(twinesRoot: string): Promise<ContractInput>;
```

Rules: node patterns and exact expected nodes per file (ASSET-19..23); part nodes are direct children of `asm-*` with one mesh and one primitive; shell anchors match the manifest placements (tolerance 1e-3); assembly bounds and part anchors match the manifest (tolerance 1e-2; the report prints measured values); triangles via index count / 3 (triangle mode only); bytes against the budgets (decimal: 2,500,000 for shells and 1,000,000 for assemblies); extensions in the allow-list (ASSET-28); node, mesh, material and texture names free of manifest makes and models and a common manufacturer list (ASSET-29); images only when listed in provenance (ASSET-30); provenance complete, with no orphans in either direction, a licence on the allow-list (`project-original`, `CC0-1.0`) and `paidService: false` (ASSET-31..34); `.gitignore` covers the raw output folder (ASSET-37).

### Provenance (`public/models/provenance.json`)

```ts
interface ProvenanceEntry {
  file: string;                    // "sedan-corolla.glb"
  origin: { kind: "generator"; generator: "tools/blender/generate.py"; generatorVersion: string; preset: string }
        | { kind: "third-party"; author: string; url: string; title: string };
  licence: "project-original" | "CC0-1.0";
  tool: { blender: string; optimizer: string };   // "5.2.3", "@gltf-transform x.y.z"
  producedOn: string;              // YYYY-MM-DD
  paidService: false;
  noLogosBadgesOrBrandNames: true;
  images: readonly { name: string; source: string; licence: string }[];  // usually empty
}
```

## Testing Strategy

Strict TDD (RED → GREEN → REFACTOR). Runner `npm test` (`vitest run`, projects `unit`/`integration`/`component`, `vitest.config.ts:9-40`) and `npm run test:e2e` (Playwright, production build). Scenario IDs from the delta specs are the test names.

| Layer | What to test | Approach | Slice |
|---|---|---|---|
| Unit | Token parsing: same names in both themes, non-empty (THEME-02); contrast pairs light and dark, swatch ring, status text (THEME-26..31); accent hue distance (THEME-04); status invariance and mirrors (THEME-03, THEME-24) | `tests/unit/brand/design-tokens.test.ts` with a small CSS token resolver in `tests/support/css-tokens.ts` (handles `light-dark()` and `var()`); extend `status-colors-3d.test.ts` | S1a.1 |
| Unit | No color literals outside the token files and mirrors (THEME-01) | `tests/unit/brand/no-color-literals.test.ts` scanning `src/**/*.{css,ts,tsx}` (allow-list: `globals.css`, `scene-tokens.ts`, `status-colors.ts`, `icon.svg`) | S1a.2 |
| Unit | `parseStoredPreference`, `resolveTheme` (THEME-09, 10, 12, 17) | Table-driven | S1a.3 |
| Unit | Boot script: stored, invalid, throwing storage, OS dark and light, no `matchMedia` (THEME-17, 18, 21, 22) | Execute `THEME_BOOT_SCRIPT` with `new Function` and fake globals | S1a.3 |
| Component | Toggle: three radios, checked state, keyboard change keeps focus, writes and removes storage, applies attributes, survives throwing storage (THEME-13, 14, 16, 18, 20); `ThemeSync` reacts to the OS and `storage` events (THEME-11, 15) | jsdom with `stubMatchMedia` (`tests/component/vehicle-health/match-media.ts`) | S1a.3 |
| E2E | Persist across reload and new tab (THEME-15); return to system (16); no API request carries the choice (19); first-paint attribute captured by an init script on the first `requestAnimationFrame` (21, 22); no hydration or console errors (23); 2D diagram tokens (THEME-07) | `tests/e2e/theme.spec.ts` with `page.emulateMedia({ colorScheme })` | S1a.3 |
| Component / E2E | Logo name and `aria-hidden` (THEME-34), shell and auth pages (THEME-32); icon served (THEME-35); fonts same-origin and fallback (THEME-36, 37) | `tests/component/brand/logo.test.tsx`; e2e network listener | S1b |
| Unit | Resolver order and normalization (ASSET-08..14, 18) | `tests/unit/vehicle-assets/resolve-shell.test.ts`, fixture manifests | S2.1 |
| Unit | Manifest integrity (ASSET-02, 03, 05, 35); later ASSET-04 (S3) and ASSET-01, ASSET-10/11 using `prisma/seed-data.ts` (S4) | `manifest-integrity.test.ts` | S2.1 → S4 |
| Unit | Scene layout: positions, loose parts, focus boxes, fixture third system (ASSET-07 data half, VIEW-10) | `scene-layout.test.ts` | S2.1 |
| Unit | Asset contract on the real repository (ASSET-06, 39, 41) and on in-memory fixture GLBs built with `@gltf-transform/core` `Document` (ASSET-19..34, 37, 40); no binary fixtures committed | `tests/unit/vehicle-assets/asset-contract.test.ts` | S2.2a |
| Component | `vehicle-3d.test.tsx` **rewritten**: mocks `@react-three/fiber` (`Canvas`, `useFrame`, `createPortal`), `@react-three/drei` (`Html` with the portal attribute kept from `:16-20`, `CameraControls` as a recorder of props and imperative calls, `Outlines`, `Environment`, `Lightformer`, `ContactShadows`), `three/load-vehicle-assets` (resolve or reject), and `GlbVehicle`/`VehicleScene` as attribute doubles. Asserts: resolved shell id (VIEW-03), loading status and its removal (VIEW-44), error → primitive with 8 flat buttons and no system hotspot (VIEW-13, 14, 15), auto-rotate flag on the rig (VIEW-04, 07; the `:108-136` cases migrate from `OrbitControls` attributes to the rig double) | S2.4 |
| Component | `vehicle-health-view.test.tsx`: `make`/`model` passed through; list selection never changes the focus phase (VIEW-05) | Extend | S2.4, S3.2 |
| E2E | `health-view.spec.ts` **rewritten**: rotation measured on a system hotspot instead of the Tires part hotspot (`:119-138`, `:173-187`); VIEW-13 via `page.route("**/models/*.glb", r => r.abort())` with `pageerror` = none and console errors other than the induced resource failure = none; ASSET-38 no third-party request; ASSET-17 no `.glb` request without WebGL (extends VIEW-06 `:140-171`) | Drill-down flows target TWN-GRN (Corolla) until S4 | S2.4 |
| Unit | `focusReducer` full transition table, out-of-phase `transition-end`, idempotence (VIEW-29); selectors (VIEW-28); `systemAttention`, `systemContainingPart`, `systemHotspotLabel` (VIEW-31..33, 35..42); `stepOpacity` snaps under reduced motion (VIEW-17, 18); `shellIsInteractive` (VIEW-22 logic) | `tests/unit/drill-down/*.test.ts` | S3.1 |
| Component | Drill-down in `Vehicle3D`: open by click, back control focus, Escape exit and Escape ignored in inputs and in the overview (VIEW-24..26, 30), only the focused system's parts (VIEW-23), selection survives (VIEW-27), camera double receives `fitToBox(…, false)` under reduced motion and a re-issue when the preference flips (VIEW-17, 18), fixture third system end to end (ASSET-07) | `tests/component/vehicle-health/vehicle-3d-drill-down.test.tsx` | S3.2 |
| E2E | VIEW-19..21 (Enter and Space with `press`), 24, 25, 30, 05 (system stays closed: no back control, `aria-expanded="false"`), 37, 39, 17 (reduced motion: the stage `data-focus-phase` reaches `focused` with no intermediate `focusing` sample) | `tests/e2e/drill-down.spec.ts` | S3.3 |
| E2E | Per-vehicle shell smoke (stage `data-shell` for each seeded plate; ASSET-10/11 end to end); attention indicator on seeded non-green vehicles (VIEW-31, 34) | | S4 |
| E2E / Manual | VIEW-22 is covered at unit level (handler and raycast rule) plus a documented manual test (pixel-accurate canvas clicks are unreliable headless); visual fade and sorting check; shell sign-off screenshots | Manual test plan entries | S3, S5 |
| Unit (kept) | `vehicle-health-models.test.ts` unchanged (primitive fallback); `part-rows.test.ts` unchanged | — | — |

The stage exposes test-only data attributes (`data-model-source="glb|primitive"`, `data-shell`, `data-model-ready`, `data-focus-phase`) so e2e can wait on state instead of pixels. The attributes carry no user data.

## Slice Plan (auto-chain, about 400 authored lines per PR)

Forecasts count authored additions plus deletions (tests included). GLB, woff2 and licence texts are excluded but their bytes are reported. The proposal's per-slice forecasts were optimistic: measured against this file map, most schedule slices need 2–4 chained PRs. **Dates and checkpoints do not change.**

| PR | Content | Track | Forecast |
|---|---|---|---|
| S0a | Generator core, shell, sedan-corolla preset, export, README, `.gitignore` | A | ~420–480 (Python and README; slightly over, acceptable as one coherent unit) |
| S0b | Assemblies, `s0-findings.md` | A | ~250–300 |
| S1a.1 | Token layers in `globals.css`, `scene-tokens.ts`, `VehicleScene` colors, token and contrast tests | B | ~330 |
| S1a.2 | Literal replacement in 12 module CSS files, swatch ring, no-literal scan test | B | ~250 |
| S1a.3 | Preference, boot script, store, hooks, `ThemeSync`, toggle, layout and shell wiring, tests, `theme.spec.ts` | B | ~400 |
| S1b | Logo, icon, font, shell and auth integration, tests | B | ~260 |
| S2.1 | Types, budgets, resolver, layout, manifest skeleton, coverage config, tests | B | ~380 |
| S2.2a | Contract checker, CLI, devDependencies, fixture-based tests | B | ~400 |
| S2.2b | Optimizer, first three GLBs, provenance, manifest Corolla entry | B | ~150 + binaries |
| S2.3 | Loader, hook, `GlbVehicle` (static), lighting, error boundary, tests | B | ~330 |
| S2.4 | `CameraRig` (auto-rotate), `Hotspots` (flat), `Vehicle3D` container, prop wiring, `vehicle-3d.test.tsx` rewrite, e2e rewrite | B | ~420 |
| S3.1 | Focus machine, system status, fade, systems in the manifest, unit tests | B | ~380 |
| S3.2 | Drill-down UI: system hotspots, back control, Escape, focus management, fade, raycast, Outlines, camera transitions, component tests | B | ~420 |
| S3.3 | Drill-down e2e | B | ~200 |
| S4 | Generator features (hatch, SUV, bed), 7 presets, 7 GLBs, manifest, provenance, S4 tests | A → B | ~300–350 + binaries |
| S5 | Loading-state finish, keyboard and screen-reader fixes, e2e hardening, README, traceability | B | ~200–300 |

Track A production of the 7 remaining shells runs from 11-24 in parallel. Exporting `sedan-generic` early (before S3.3) would let the S3 e2e cover the attention indicator on TWN-OVR (Nissan Sentra); otherwise that e2e lands in S4.

## Threat Matrix

N/A for every row. No routing changes, no runtime shell commands or subprocesses, no VCS or PR automation, and no executable-file classification:

| Boundary | Applicability |
|---|---|
| Documentation-like paths | N/A: `tools/blender/README.md` is documentation; the `.py` generator runs only inside the user's local Blender by explicit invocation, never from the app, `npm test` or CI |
| Git repository selection | N/A: no git commands are composed; ASSET-37 is checked by reading `.gitignore`, not by running `git` |
| Commit state | N/A: no commit automation |
| Push state | N/A: no push automation |
| PR commands | N/A: no PR automation |

Related security notes (not matrix rows): the inline theme script is a static constant with no interpolated input; the stored value is allow-listed before use; GLBs are static same-origin files; no remote fetch occurs at runtime or at build time.

## Migration / Rollout

No data migration and no schema or API change.

- **Per PR**: each chained PR is revertible on its own. Within S1a, revert S1a.2 (literal replacement) before S1a.1 (token definitions).
- **3D kill switch**: removing shell entries from `manifest.ts` makes `resolveShell` return `null`, so the primitive flat viewer is restored. Removing `systems` turns every part into a loose part with a direct hotspot (VIEW-10), which disables the drill-down without code changes.
- **Theme**: a stale `twines.theme` value is ignored by `parseStoredPreference` if the toggle is removed or the value is invalid.
- **Assets**: `public/models/` plus the manifest entries can be deleted independently. History keeps the binaries; LFS or history rewriting comes back as a decision only if committed binaries exceed about 25 MB.

## Open Questions

- [ ] **Font file source (needs user authorization, one download).** Manrope Variable woff2 from the `@fontsource-variable/manrope` npm package (the project's existing dependency channel) or from the Google Fonts GitHub repository; the user also approves Manrope itself in S1b. Non-blocking for S1a.
- [ ] **Kenney Car Kit download** only if the S0 look criterion fails (already listed in the proposal Dependencies; needs explicit authorization).
- [ ] **Spec alignment for the code-built assembly fallback**: ASSET-19/20 assume GLB files. If S0 rejects procedural assemblies, the spec needs an amendment so the node contract applies to the code-built tree (Decision 16).
- [ ] **Proposal deltas to acknowledge**: `@gltf-transform/cli` is replaced by the `@gltf-transform` libraries (Decision 10); `public/decoders/` is not created (Decision 12); `useGLTF`/Suspense is replaced by an imperative loader (Decision 13); the S1a and S2 schedule slices become chained sub-PRs (Slice Plan) with unchanged dates.
- [ ] **Weekend availability** (proposal Open Question 1) still affects the checkpoint dates.
