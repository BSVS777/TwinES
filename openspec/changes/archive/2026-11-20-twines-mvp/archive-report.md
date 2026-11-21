# Archive Report: twines-mvp

**Archived**: 2026-11-20
**Artifact store**: hybrid (openspec files canonical; Engram project `proyecto ps`)
**Archive folder**: `openspec/changes/archive/2026-11-20-twines-mvp/`
**Delivery strategy**: auto-chain (already delivered; nothing to split)
**Repository state at close**: `main` at `edb2899`, pushed to `origin/main`

## Final State at Close

Final-state facts come from the orchestrator launch prompt, which outranks intermediate snapshots. They were corroborated against the persisted tasks file and the re-verification section of `verify-report.md` (Engram #41 and the archived file).

- **Tasks**: 60 of 60 checked in `tasks.md` (observed: 60 `[x]`, 0 `[ ]`). No unfinished tasks.
- **Scenarios**: 59 of 59 COMPLIANT in the final verify (re-verification 2026-11-20). Scenario IDs are intact in the main specs.
- **Automated tests**: `npm test` 820/820 (62 files). Coverage 100% on domain and application (coverage gate covers domain and application only, see W3).
- **E2E**: 34/34 (Playwright).
- **Static checks**: `tsc` and lint clean.
- **Verdict (final verify)**: 0 CRITICAL, 4 WARNING, 4 SUGGESTION.

### Resolved Findings

- **C1 (original CRITICAL, missing TDD Cycle Evidence table)**: RESOLVED. The table was reconstructed after the fact from the original `sdd-apply` sub-agent reports and is present in `apply-progress.md` and Engram #37. Its residual gaps are recorded below as W4. Per `verify-report.md` (re-verification section), C1 is no longer a CRITICAL.

### Open WARNINGs (carried as recorded diagnostics; none gates archive)

- **W1**: `twines/.env.example` still lacks `SEED_TECH_PASSWORD`, `SEED_OWNER_PASSWORD` and `APP_ORIGIN`. Agent reads of that file are denied by permissions, so the maintainer must add them. The README documents them.
- **W2**: No automated real-scene 3D check per body type. Covered only by mock-based component tests and manual test M-1.
- **W3**: Coverage gate covers domain and application only.
- **W4** (honest limitation, not a PASS): TDD evidence is reconstructed after the fact. RED and test-first order are not independently provable from git. Safety Net is "Not reported" for most rows. REFACTOR is often unreported. Task 6.10 is partial (S1, S3, S4 are characterization tests with no RED). Tasks 6.5 to 6.9 (E2E) have no RED by construction.

### Open SUGGESTIONs

- **S1**: `design.md` still describes the older `TWINES_FIXED_TODAY` and E2E date strategy. The implementation differs.
- **S2**: `tasks.md` task 3.3 references a stale test path.
- **S4**: Usability follow-ups from `docs/testing/manual-tests.md`: engine-bay hotspots cluster in 3D; vehicles with no baseline render all red; the blank body type message; the 403 page lacks the app shell and sign-out.
- **S5**: One automated 3D check per body type (overlaps W2).
- **S3**: Done (per launch prompt and `verify-report.md`).

### Manual Tests

M-1 to M-6 are documented in `docs/testing/manual-tests.md`. They were NOT executed during verify.

## Specs Synced

Main specs were created under `openspec/specs/` (none existed before). Each delta spec already uses `## Requirements` as its header and is a complete requirement set, so no ADDED-header normalization was needed. The files were copied mechanically with `cp`, and `diff -r` returned empty for each.

| Domain | Main spec path | Action | Requirements | Scenarios |
|--------|----------------|--------|--------------|-----------|
| user-auth | `openspec/specs/user-auth/spec.md` | Created | 6 | 15 (AUTH-01..15) |
| vehicle-registry | `openspec/specs/vehicle-registry/spec.md` | Created | 5 | 17 (VEH-xx) |
| part-health | `openspec/specs/part-health/spec.md` | Created | 6 | 10 (HLT-xx) |
| maintenance-schedule | `openspec/specs/maintenance-schedule/spec.md` | Created | 3 | 8 (MNT-01..08) |
| vehicle-health-view | `openspec/specs/vehicle-health-view/spec.md` | Created | 5 | 9 (VIEW-xx) |

Total: 59 scenarios. The `gentle-ai sdd-archive-compose` command is not on PATH in this environment, so composition was not run. Creating the mains from a full-spec delta with no pre-existing canonical is the case the protocol covers with a mechanical copy.

## Archive Contents (observed)

Archive folder: `openspec/changes/archive/2026-11-20-twines-mvp/`

- `proposal.md`: present
- `exploration.md`: present (optional artifact)
- `design.md`: present
- `specs/` (5 domain delta specs): present
- `tasks.md`: present, 60/60 complete, 0 unfinished
- `apply-progress.md`: present (was untracked; carried by the directory-level `git mv` rename, see git note)
- `verify-report.md`: present (was untracked; same note)
- `archive-report.md`: this file

Active changes directory: `openspec/changes/twines-mvp/` no longer exists.

## Engram Observation IDs (traceability)

Observations located for this change in project `proyecto ps`:

| Artifact | Topic key | Observation ID | Use in this archive |
|----------|-----------|----------------|---------------------|
| proposal | `sdd/twines-mvp/proposal` | #31 | located; canonical file read on disk (hybrid) |
| spec | `sdd/twines-mvp/spec` | #34 | located; canonical delta files read on disk (Engram copy is a condensed digest) |
| design | `sdd/twines-mvp/design` | #35 | located; canonical file read on disk (condensed digest in Engram) |
| tasks | `sdd/twines-mvp/tasks` | #36 | located; canonical file read on disk (condensed digest in Engram) |
| apply-progress | `sdd/twines-mvp/apply-progress` | #37 | upserted with the current `apply-progress.md` (revision 15) |
| verify-report | `sdd/twines-mvp/verify-report` | #41 | located; canonical file read on disk (re-verification section) |
| archive-report | `sdd/twines-mvp/archive-report` | (created on save) | this document |

Note: #31, #34, #35 and #36 were located by search; in hybrid mode their locators are repository paths, so the files were used as the source. Engram copies of those artifacts are condensed digests and were not used as source material.

## Traceability Verification (mechanical)

Each copy or move was verified with `diff -r`. Verbatim output:

- Main spec copies (5 `diff -r` runs, source = delta spec, destination = `openspec/specs/<domain>/spec.md`): no output, exit 0 for each.
- Change folder move: snapshot taken with `cp -R` before the move, then `git mv openspec/changes/twines-mvp openspec/changes/archive/2026-11-20-twines-mvp`. `diff -r <snapshot> openspec/changes/archive/2026-11-20-twines-mvp`: no output, exit 0.
- Source directory confirmed absent after the move.

## Git State and Notes

- `git mv` staged the renames of the 9 tracked files (`R` entries) in the index. Nothing was committed or pushed.
- Untracked: `openspec/specs/` (new main specs) and the two moved untracked reports (`apply-progress.md`, `verify-report.md`) in the archive folder.
- Untouched unrelated untracked directory: `twines/.vitest/`.
- No source code or test file was modified.

## Engram Sync Notes

- `sdd/twines-mvp/apply-progress` (#37) was upserted with the full current `apply-progress.md` content. Engram reports revision 15 and an absolute-path warning. The content was passed through the tool call (no file-based Engram save exists). Readback confirmed the header, work-unit sections, and TDD evidence table. A byte-level hash comparison is not possible through the Engram tool, so this check is by visible content.
- The save raised a conflict candidate, #41 (`sdd/twines-mvp/verify-report`). It is a different artifact of the same change, so it is not a supersession. The `mem_judge` tool was not available in this session, so the judgment is still pending in Engram. No candidate was resolved silently.

## Contradictions and Superseded Claims

- The original verify verdict (1 process CRITICAL, 3 WARNING, 5 SUGGESTION) is superseded by the re-verification verdict (0 CRITICAL, 4 WARNING, 4 SUGGESTION). This is recorded as history, not as a contradiction.
- Engram #41 and the archived `verify-report.md` describe the same final verdict.
- No unranked contradictions were found.

## SDD Cycle Status

The SDD cycle for `twines-mvp` is complete and archived. Implementation: all 60 tasks in `tasks.md` are checked, and `main` at `edb2899` holds the implementation (pushed). Verification: final verify reports 59/59 scenarios compliant, `npm test` 820/820, E2E 34/34, 0 CRITICAL, 4 WARNING, 4 SUGGESTION. Unfinished tasks: none. Unresolved findings: W1 to W4 and S1, S2, S4, S5 as listed above. Manual tests M-1 to M-6 documented, not executed during verify.
