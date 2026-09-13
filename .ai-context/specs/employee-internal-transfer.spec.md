# Spec: Employee Internal Transfer Digital Journey

## Spec ID
employee-internal-transfer

## Status
Ready for Release

*(Registered from already-completed work — see note below. Not "Released (vX.Y.Z)": no
`.ai-context/releases/RELEASE-vX.Y.Z.md` has been cut yet.)*

## Registration Note

This spec was **not authored fresh under this skill** — it is a lifecycle-format mapping of
work already completed under this repository's own deliverable structure, at the user's
explicit direction (2026-09-13, see `.ai-context/prompt_history.md`). At the time this spec was
written, the controlled copy of record for full detail was:
- **Spec (Deliverable 2):** `02-spec/Feature-Spec.md` v1.1
- **Discovery (Deliverable 1):** `01-discovery/Discovery-Analysis.md`
- **API Contract (Deliverable 6):** `06-api-contract/API-Contract.md`

**Update 2026-09-13:** all three of those deliverable files (and the numbered folders around
them) were removed from this repo at explicit user request, once their content had been fully
absorbed into `.ai-context/`. This file — previously a summary/cross-link layer over that
fuller detail, to avoid two copies drifting apart — is now the most detailed surviving
requirements-level record of the original 38 ACs (in summary-by-FR-group form; full
Given/When/Then text was not independently preserved elsewhere). The concrete, executable
record of the actual behavior is the ported test suite at `tests/backend/` (128 tests, one per
AC-level scenario). **Original requirement IDs are preserved unchanged** (`FR-01`–`FR-15`,
`NFR-01`–`NFR-06`, `AC-001`–`AC-038`) rather than remapped to this skill's default `<slug>.ACn`
convention — remapping would break the cross-references baked into the test file names at
`tests/backend/` (originally `implementation/`'s test names, ported unchanged).

## Linked BRD
`.ai-context/BRD.md` §4 (FR-01–FR-15), §5 (NFR-01–NFR-06), §6 (BR-01–BR-10)

## Gate Approvals & History

| Gate | Approver | Date | Outcome | Approval Comment |
|---|---|---|---|---|
| Gate 1 (Spec Review) | Soumyadeep, INT Delivery Leadership | 2026-09-08 | Approved With Conditions | "Gate 1 is APPROVED WITH CONDITIONS... The discovery, spec, and test cases form a coherent, well-structured Milestone 1 package... The primary condition is Finding #1 — the effective date / org-update timing must be explicitly stated as a business decision before the Milestone 3 plan is written." — full text was in `09-gate1/Gate1_Review_RaunokMukherjee.docx` (that file was never actually present in this working copy, despite being referenced by the original deliverables — see `.ai-context/constitution.md`). All 6 action items (effective-date timing decision, API contract submission, COMPLETED-state AC, HRIS-failure scenario, notification content, traceability matrix) were resolved in Feature-Spec v1.1 and its downstream deliverables (since removed 2026-09-13). |
| Gate 2 (Code Review) | **Not recorded** — see gap note below | 2026-09-09 | Approved For Release (self-assessed) | "✅ APPROVED FOR RELEASE (within this exercise's stated scope)" — originally `10-gate2/Gate2-Evidence.md` §6 (removed 2026-09-13). Evidence was real (RED→GREEN test runs, 96% coverage, one genuine defect found and fixed — see that file's §1) but was not signed off by a reviewer distinct from the author. |

**Gap, not silently resolved:** this skill's Gate 2 requires the Technical Lead role,
distinct from the implementing developer, to review and approve (`Author ≠ Reviewer`). No
such distinct reviewer identity ever appeared anywhere in `10-gate2/Gate2-Evidence.md` or
elsewhere in this repository — the Gate 2 evidence was rigorous (documented RED/GREEN runs, a
real defect found and fixed, coverage numbers) but self-assessed. Treat "Ready for Release"
here as **evidence-complete, peer-review-pending** until a TL is assigned (see
`.ai-context/constitution.md` Governance & Roles) and performs that review.

## Intent

Give an employee a single digital journey in the One-Point Employee Portal to request,
track, and complete an internal transfer (department / location / role change), with the
portal orchestrating manager confirmation, HR eligibility validation, org-data update, and
conditional Payroll / IT / Facilities actions — replacing a fragmented, email-driven, manual
process with an auditable system-of-record. Full detail was originally in
`02-spec/Feature-Spec.md` §1 (removed 2026-09-13).

## Context
- Builds on: `.ai-context/architecture.md` now exists (added when this project moved to Full
  Stack, 2026-09-13); architecture was originally documented instead in the former
  `04-plan/Technical-Plan.md` §2–7 (ADR-01–06, removed 2026-09-13, ADR text preserved in
  `architecture.md`).
- Related specs: `.ai-context/specs/employee-transfer-webapp.spec.md` (2026-09-13 Full Stack
  rebuild — reuses these ACs unchanged for its backend, adds a new frontend).
- API contract: originally `06-api-contract/API-Contract.md` (removed 2026-09-13) — 8 endpoints
  under `/api/v1`, bearer-token auth, standard error envelope; summarized in
  `employee-transfer-webapp.spec.md` and implemented at `src/backend/http/routes/transferRequests.js`.

## Actors & RBAC
`EMPLOYEE`, `MANAGER`, `HR`, `PAYROLL`, `IT`, `FACILITIES` — full role capability table was
originally in `02-spec/Feature-Spec.md` §3 (removed 2026-09-13).

## State Machine & Data Model
`SUBMITTED → PENDING_HR_VALIDATION → IN_PROGRESS → COMPLETED`, with `MANAGER_REJECTED`,
`HR_REJECTED`, `CANCELLED` as additional terminal states, plus per-downstream-task sub-status
(`NOT_REQUIRED | PENDING | COMPLETED`) for `ORG_UPDATE`/`PAYROLL`/`IT`/`FACILITIES`. Full Mermaid
state diagram and entity-relationship data model were originally in `02-spec/Feature-Spec.md`
§4–5 (removed 2026-09-13); the concrete, currently-authoritative record is the implemented
state machine at `src/backend/domain/stateMachine.js`.

## API Contract (Mandatory — API surface exists)
8 endpoints (`POST /transfer-requests`, `GET /transfer-requests/{id}`, `GET /transfer-requests?scope=mine`,
`.../manager-decision`, `.../hr-decision`, `.../tasks/{type}/complete`, `.../tasks/{type}/not-required`,
`.../cancel`), each with request payload, success response, and exception table, were fully
specified in `06-api-contract/API-Contract.md` (removed 2026-09-13, not re-transcribed here);
implemented unchanged at `src/backend/http/routes/transferRequests.js`.

## Functional Requirements
FR-01–FR-15 — see `.ai-context/BRD.md` §4 for the full table (create request, view status,
view pending-with, list requests, manager decision, HR decision + org update, conditional
fan-out, downstream task completion, auto-completion, cancellation, validation, RBAC,
notifications, idempotency).

## Acceptance Criteria
38 acceptance criteria (`AC-001`–`AC-038`), each Given/When/Then and individually IDed,
mapping 1:1 to an FR — full text was originally in `02-spec/Feature-Spec.md` §9 (removed
2026-09-13; not independently preserved elsewhere — this FR-group summary and the
`tests/backend/` test suite are the surviving record). Summary by FR group:
- FR-01 (create): AC-001–009, AC-038
- FR-02/03/04 (view/list/pending-with): AC-010–013
- FR-05 (manager decision): AC-014–018
- FR-06 (HR decision): AC-019–022
- FR-07/08 (org update + fan-out): AC-023–027
- FR-09 (downstream action): AC-028–031
- FR-10 (completion): AC-032–033
- FR-11 (cancellation): AC-034–036
- FR-14 (notifications): AC-037

## Unit Test Cases (spec-derived)
46 test cases (`TC-001`–`TC-042` plus boundary suffixes `TC-003B/007B/013B/027B`), each
mapping 1:1 to an AC, fully automated (Jest + Supertest, 18 suites / 128 tests GREEN, 96%
coverage). Full table: `.ai-context/test_cases/employee-internal-transfer.test_cases.md`
(mapped from `03-tests/Spec-Derived-Test-Cases.md`).

## Explicitly Out of Scope
Cross-country/visa-impacting transfers, a separate compensation-approval workflow,
receiving/new-manager acceptance, automated HR eligibility rules, SLA/auto-escalation,
bulk/mass transfer initiation, native mobile app, editing a submitted request, saving a draft
request. Full list with rationale: `.ai-context/BRD.md` §7 and `02-spec/Feature-Spec.md` §8.
Also out of scope for *this build specifically* (per `04-plan/Technical-Plan.md` §1/§9): the
Portal frontend UI module, real HRIS/Payroll/ITSM/Facilities network adapters, and
persistence beyond in-memory (Postgres is the named future target, ADR-05).

## Non-Functional Constraints (from constitution.md)
- Performance: status/pending-view reads P95 < 500 ms; submission P95 < 1 s (NFR-05).
- Auditability: immutable, actor-stamped `StageAction` trail, no update/delete path (NFR-01).
- Authorization: default-deny, every endpoint role- and ownership-checked (NFR-02).
- Idempotency: `Idempotency-Key` on request creation only (NFR-03, ADR-06).
- Security posture and architectural constraints as recorded in `.ai-context/constitution.md`.
