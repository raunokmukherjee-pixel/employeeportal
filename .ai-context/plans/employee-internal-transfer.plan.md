# Plan: Employee Internal Transfer Digital Journey

## Registration Note
Mapped from [`04-plan/Technical-Plan.md`](../../04-plan/Technical-Plan.md), already built and
implemented. Not re-authored — that file remains the controlled copy of record for full
sequence diagrams, ADR text, and failure-handling detail.

## Derived From
.ai-context/specs/employee-internal-transfer.spec.md

## Architecture Approach
Single **Transfer Orchestration Service** (backend only — the Portal frontend and SSO/gateway
are existing and out of scope for this build). Central orchestrator owning the
`TransferRequest` aggregate and its state machine (ADR-01); Payroll/IT/Facilities act as
portal users against an internal task queue rather than external system integrations in V1
(ADR-02); ports & adapters boundary — `HrisPort`, `RepositoryPort`, `NotifierPort` — with
in-memory adapters for this build (ADR-03); state machine as a single first-class module
(ADR-04); target production store is relational/Postgres, in-memory for now (ADR-05);
idempotency scoped to the creation endpoint only (ADR-06). Component diagram and HR-approval
sequence diagram: `04-plan/Technical-Plan.md` §2–3.

## Data Model
`TransferRequest` / `StageAction` (insert-only) / `DownstreamTask`, per
`02-spec/Feature-Spec.md` §5 and `04-plan/Technical-Plan.md` §4. No schema migrations — this
build is in-memory; a future relational adapter must introduce migrations per
`constitution.md`.

## Constitution Check
- [x] No new datastore introduced without ADR — in-memory now, Postgres target named via ADR-05.
- [x] Testing discipline matches constitution.md — Jest test-first, RED→GREEN evidence in `10-gate2/evidence-raw/`.
- [x] Security posture matches constitution.md — default-deny RBAC, ownership checks, immutable audit trail, no client-trusted identity fields; see `08-security/Security-Assessment.md`.

## Explicitly Deferred
- Real HRIS/Payroll/ITSM/Facilities network adapters (stubs/fakes only) — reason: no
  integration contract exists yet; ADR-02/03 isolate the seam.
- Persistence beyond in-memory — reason: out of this build's effort budget; ADR-05 names the
  target.
- Frontend UI module — reason: explicitly out of scope for this exercise (`04-plan/Technical-Plan.md` §1).
- SLA/escalation engine — reason: BRD assumption A-07, out of scope for V1.
- Platform-level rate limiting (DoS mitigation) — reason: deferred to the API gateway, not this service (`08-security/Security-Assessment.md` §1).

## Sequencing
1. Foundation: domain types, state machine, fake HRIS adapter, in-memory repository, request
   validation (no HTTP surface yet).
2. API surface: one task per endpoint (create, get, list, manager-decision, hr-decision,
   downstream task actions, cancel), each independently testable via Supertest.
3. Cross-cutting: notification counting, auth guard, error-envelope middleware.
4. System-level proof: end-to-end happy-path test, security-focused tests (IDOR, malformed
   payload).
5. Closeout: traceability matrix, activity tracker.

Full task-by-task breakdown: `.ai-context/tasks/employee-internal-transfer.tasks.md`.
