# TwinES

TwinES gives each vehicle a "digital twin": an owner registers a vehicle, sees the status of its main parts (green, yellow, orange, red) and gets the next recommended maintenance. Technicians can look up a vehicle and record serviced parts.

This repository holds the TwinES MVP. The MVP is intentionally partial: AI predictions, guided repairs and the parts catalog are future work.

## Repository layout

| Path | Content |
|------|---------|
| `docs/business-briefs/` | Business brief for the idea |
| `docs/reports/` | Business validation report (market, competitors, financials, risks) |
| `openspec/` | Spec-driven development artifacts (proposal, specs, design, tasks) |
| `twines/` | Application source code (added during development) |

## Planned stack

TypeScript, Next.js, Prisma + SQLite, Vitest (unit tests), Playwright (end-to-end tests), three.js (3D view).

## Status

Scope defined in `openspec/changes/twines-mvp/proposal.md`. Development has not started yet.
