---
name: int-release-management
description: Manage software releases, verify spec release readiness in status.md, transition specs to Released (vX.Y.Z), generate spec-driven release notes, and sync releases via CI/CD.
---

# INT Release Management

## Purpose
This skill governs software release validation, version tagging, status board transitions, release notes generation, and client repository synchronization according to the INT SDD Blueprint V1.0.

---

# Release Readiness Criteria

A release is cut ONLY when all constituent feature Specs, hotfix Specs, and bug fixes to be included in the release satisfy the following:

1. **Status Board State**: Marked as `Ready for Release` in `.ai-context/status.md`.
2. **Gate 2 Completion**: Gate 2 code review checklist passed and signed off.
3. **Automated Test Suite**: All tests under `tests/frontend/` and `tests/backend/` pass cleanly (GREEN).
4. **No Blockers**: No open Sev-1/Sev-2 incidents blocking the release.

---

# Release Execution Process

```text
Verify Ready for Release Specs in status.md
       ↓
Validate Gate 2 & Test Suite Success
       ↓
Determine Release Version Tag (vX.Y.Z)
       ↓
Create Release Record (.ai-context/releases/RELEASE-vX.Y.Z.md)
       ↓
Transition Spec Statuses → Released (vX.Y.Z)
       ↓
Update .ai-context/status.md Daily Execution Log
       ↓
Trigger Scripted CI/CD Client Repository Sync
```

---

# Release Versioning & Tagging Conventions

- Format: `vX.Y.Z` (Semantic Versioning e.g. `v1.3.0`)
  - `X` (Major): Breaking structural/architectural changes or major business capability additions.
  - `Y` (Minor): Backward-compatible feature additions.
  - `Z` (Patch): Hotfixes and bug fixes.

---

# Spec-Driven Release Artifact Generation

Every software release MUST generate a release artifact under:
`.ai-context/releases/RELEASE-vX.Y.Z.md`

This file MUST be instantiated directly from `.ai-context/templates/release.template.md`, and its content drafted from **Spec Intent** (`.ai-context/specs/<feature-slug>.spec.md`), NOT raw git commits.

## Release Artifact Structure (`.ai-context/releases/RELEASE-vX.Y.Z.md`)
```markdown
# Release vX.Y.Z

_Release Date: YYYY-MM-DD_

## Features Included
- **<feature-slug>**: <Summary of Intent from Spec> (Spec: `.ai-context/specs/<feature-slug>.spec.md`)

## Bug Fixes & Hotfixes
- **<incident-slug>**: <Summary of fix and issue resolved> (Hotfix: `HOTFIX-<incident-slug>`)

## Migration & Deployment Steps
- <Database migrations or environment variable updates, if any>
```

---

# Status Board Transition

Upon release execution, update `.ai-context/status.md`:
1. Update each included Spec status to: `Released (vX.Y.Z)`.
2. Add a same-day entry under `Daily Execution Log` summarizing the release tag, date, and included specs/hotfixes.
