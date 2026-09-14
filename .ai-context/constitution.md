# Project Constitution — Employee Internal Transfer Digital Journey

**Adopted:** 2026-09-13 · **Version:** v1.0

Governs every feature this repository will build for the Transfer Orchestration Service.
Each spec operates inside this document and never restates it.

Standard in force: **INT Engineering Guidelines — Specification-Driven Delivery (SDD) v1.0**

> **Provisional & Open Values Note:** This project has no standalone client BRD document —
> the requirement baseline was derived from existing deliverables (see
> [`.ai-context/BRD.md`](BRD.md); the original provenance note, `docs/BRD-SOURCE-NOTE.md`, was
> removed 2026-09-13 once its content was absorbed into `BRD.md`). This constitution is built
> the same way: only from constraints those deliverables actually committed to. Lines marked
> `[Open]` have no source and require a decision before specs depending on them can proceed.
> No governance roster, technology, or constraint below has been invented beyond what the
> (now-removed) `01-discovery/`, `02-spec/`, `04-plan/`, and `08-security/` deliverables
> already established for this build.

---

## Governance & Roles

| Role | Person | Email | Responsibility |
|---|---|---|---|
| Technical Lead / Architect | **Supratim Jetty** | `supratim.jetty@intglobal.com` | Owns this constitution; default Gate 2 code reviewer; technical concurrence at Gate 1. |
| Senior Software Engineer / Spec Author | **Raunok Mukherjee** | `raunok.mukherjee@intglobal.com` | Default Spec Author for feature and retro-specs. |
| Project Manager | **Supratim Jetty** | `supratim.jetty@intglobal.com` | Owns BRD entries and product-side sign-off; default Gate 1 reviewer. |
| Gate 1 Reviewer | **Supratim Jetty** | `supratim.jetty@intglobal.com` | Primary Gate 1 Spec Reviewer for feature specs. |
| Gate 2 Reviewer | **Supratim Jetty** | `supratim.jetty@intglobal.com` | Primary Gate 2 Code Reviewer for pull requests and releases. |

### Core Governance Rules (process rules already followed in this repo's own SDD chain):
- **Author ≠ Reviewer**: Gate 1 review (originally documented in `09-gate1/Gate1_Review_RaunokMukherjee.docx`)
  was performed as a distinct step from spec authorship, per the chain originally in
  `README.md` (since rewritten): BRD → Spec → Gate 1 → Plan → Tasks → Test First →
  Implementation → Gate 2 → Release.
- **Reviewer Split**: Gate 1 = intent/scope/BRD-traceability review; Gate 2 = technical
  evidence & code review (originally documented in `10-gate2/Gate2-Evidence.md`, removed 2026-09-13).
- **Gate 1 SLA**: **[Open]** — no SLA is defined in the source deliverables.

### INT Amendments to SDD v1.0 (already in force in this repo's structure):
1. **Granular Chain**: BRD/Discovery → Spec → Gate 1 → Plan → Tasks → Test-First →
   Implementation → Gate 2 → Release, originally evidenced by the numbered `01-`…`10-`
   deliverable folders (removed 2026-09-13, content absorbed into `.ai-context/`).
2. **First Quality Gate**: Spec Review (Gate 1) is mandatory before planning/coding — the
   former `02-spec/Feature-Spec.md` header recorded "Status: Approved at Gate 1" before the
   former `04-plan/Technical-Plan.md` existed.
3. **Traceable Artifacts**: the former `traceability/Traceability-Matrix.md` (removed
   2026-09-13) maintained the full `BR → FR → AC → TC → Task → Test` chain, zero orphans.
4. **Status Board**: [`.ai-context/status.md`](status.md) tracks the registered spec's
   status; day-by-day effort/activity detail was intended to live in `tracker/`, which was
   never actually present in this working copy.

---

## Testing Discipline

- **Test-first (RED → GREEN) is mandatory**, evidenced by the original `10-gate2/Gate2-Evidence.md`
  §1 and its raw captured runs in `10-gate2/evidence-raw/` (both removed 2026-09-13): 3
  increments, each with a captured failing run before the passing run. The current build
  (`src/backend/`, `src/frontend/`) continued this discipline — see
  `.ai-context/specs/employee-transfer-webapp.spec.md` Post-Approval Update.
- **Framework & location**: Jest + Supertest for the backend (`tests/backend/unit/`,
  `tests/backend/integration/`, mirroring `src/backend/`); Jest + React Testing Library for
  the frontend (`tests/frontend/`, mirroring `src/frontend/`).
- **Coverage floor**: no tiered floor (Critical/Business/Utility) is defined in the source
  deliverables — **[Open]**. The one concrete achieved baseline on record is the original
  backend's run (originally `10-gate2/evidence-raw/07-coverage.txt`, removed 2026-09-13):
  96.04% statements / 88.88% branches / 97.67% functions / 97.37% lines overall, with every
  domain module (`stateMachine.js`, `fanOut.js`, `completion.js`, `constants.js`) at 100%.
  Treat this as the achieved bar to not regress below, not as an assigned floor for new,
  unrelated modules.
- **Verification commands**: `npm test` (all suites), `npm run test:unit`,
  `npm run test:integration` (per the root `package.json`) must pass before any backend task
  is complete; `cd src/frontend && npm test` for frontend work. No `lint`/`typecheck` scripts
  exist yet — **[Open]** if those gates are to be added.

## Security Posture

(Source: the original `08-security/Security-Assessment.md`, removed 2026-09-13)

- **Default-deny AuthZ**: every route explicitly allow-lists which role(s) may call it;
  no wildcard role.
- **No client-trusted identity fields**: `employeeId`, `managerId`, and role are always
  derived server-side (token claims / HRIS lookup), never accepted from the request body.
- **Ownership + role checks together**: every mutating and reading endpoint checks
  ownership/assignment, not role alone (closes cross-tenant IDOR, e.g. an `IT` token
  resolving another request's task by id-guessing).
- **Immutable audit trail**: every stage transition is written as an actor-stamped
  `StageAction`; the repository interface exposes no update/delete path for it.
- **Error handling**: no stack traces, internal file paths, or repository internals are ever
  returned to the client; unexpected errors map to a generic `500` with full detail logged
  server-side only.
- **Input validation before domain logic**: all request bodies are schema-validated (type,
  required, length, enum) before touching the state machine; malformed/garbage input is
  rejected `400`, never `500`.
- **PII handling**: manager/HR rejection comments are visible to the employee; downstream
  (Payroll/IT/Facilities) comments are internal-only (`NFR-06`, flagged as a
  judgement-call default pending real HR/Legal sign-off, not a settled rule).
- **Secrets**: not yet applicable — this build's adapters (HRIS, notifier) are in-memory
  fakes. When real adapters are introduced, credentials must come from the platform's
  existing secrets manager, never hard-coded — this constraint travels with the
  `RepositoryPort`/adapter boundary (ADR-03), not bolted on separately.
- **Rate limiting / DoS**: explicitly out of scope for this service — deferred to the
  platform-level API gateway, not duplicated here. **[Open]** until that gateway control is
  actually confirmed to exist and be configured.

## Architectural Constraints

(Source: the original `04-plan/Technical-Plan.md` ADRs, removed 2026-09-13; ADR text
preserved in `.ai-context/architecture.md`)

- **Central orchestrator, not choreography** (ADR-01): one service owns the
  `TransferRequest` aggregate and its state machine; downstream teams act *through* it.
- **Downstream teams as portal users, not external integrations, in V1** (ADR-02):
  Payroll/IT/Facilities act via `DownstreamTask` rows through the same API, behind a
  `NotifierPort`; no external Payroll/ITSM/Facilities network integration is built or
  assumed in V1.
- **Ports & adapters (hexagonal) boundary** (ADR-03): domain logic depends only on
  interfaces (`HrisPort`, `RepositoryPort`, `NotifierPort`); adapters are injected
  (in-memory for this build).
- **Explicit finite-state-machine module** (ADR-04): all legal transitions live in one
  transition table (`domain/stateMachine.js`); route handlers never inline
  `if (status === '...')` transition logic.
- **Target production store: relational (e.g. PostgreSQL)**; in-memory adapter for this
  build only (ADR-05). Schema changes in a future relational adapter must go through
  migrations, not ad hoc writes.
- **Idempotency scoped to creation only** (ADR-06): `Idempotency-Key` de-duplication
  applies only to request creation; every other write is already guarded by a status
  precondition.
- **Layering**: business rules and state transitions live in the domain layer; HTTP
  concerns in the route/API layer; persistence behind `RepositoryPort`. Route handlers must
  not set `status`/task `status` directly.

## Non-Functional Baselines

(Source: the original `02-spec/Feature-Spec.md` §7, removed 2026-09-13)

- **Performance**: status/pending-view reads P95 < 500 ms; submission P95 < 1 s, excluding
  async downstream fan-out.
- **Availability of downstream integrations**: a temporary HRIS/Payroll/ITSM/Facilities
  outage must not corrupt request state — an HR-approval HRIS write failure keeps the
  request in `PENDING_HR_VALIDATION` rather than partially advancing it.
- **Availability target / RPO / RTO**: **[Open]** — not defined in the source deliverables
  for this exercise-scoped build.

## Versioning Rules

- **API path versioning**: mounted under `/api/v1` (per the original `06-api-contract/API-Contract.md`,
  removed 2026-09-13; contract preserved in `src/backend/http/routes/transferRequests.js` and
  summarized in `.ai-context/specs/employee-transfer-webapp.spec.md`). A breaking change
  requires a new path version and an ADR, consistent with this project's existing ADR-driven
  decision record (§Architectural Constraints).
- **Error envelope**: standard `{ error: { code, message, details? } }` shape; status codes
  `400/401/403/404/409/500` used consistently — any new endpoint must reuse this envelope,
  not invent a new error shape.

## Repository & Branching

**[Open]** — this is a git repository (branch `main`), but no branch-naming, merge-strategy,
or commit-message convention is stated in any source deliverable, and no feature branches
have been used so far (all work has been committed/left uncommitted directly). Do not invent
a convention; confirm with the Technical Lead once assigned (see Governance & Roles, above)
before treating any convention as binding.
