# Architecture — Employee Internal Transfer Digital Journey

## Registration Note
This originally described the **already-approved, already-implemented** architecture (from the
assessment deliverable `04-plan/Technical-Plan.md`, removed from this repo 2026-09-13) for the
Backend-Only build at `implementation/`. **Superseded 2026-09-13** (see
`.ai-context/specs/employee-transfer-webapp.spec.md` and `.ai-context/project_context.md`
§1/§7): the project is now Full Stack, and this same architecture (domain/http/adapters
layering, ADR-01–06 below) has been ported unchanged to `src/backend/`, with a new
`src/frontend/` added per the "Module Boundaries" update below. This file (not the now-removed
`Technical-Plan.md`) is the sole authoritative architecture record going forward.
`implementation/` was kept in place while `src/backend/` was being verified equivalent, then
removed from this repo (2026-09-13, explicit user request) once that verification passed
(128/128 tests GREEN in both).

## Component Architecture

```text
One-Point Employee Portal (existing, outside this repo)
  ├─ Web UI (not built in this repo)
  ├─ SSO / Identity (existing — provides role claims)
  └─ Notification Service (existing)

Transfer Orchestration Service (this repo — src/backend/, originally ported from the
now-removed implementation/)
  ├─ REST API layer      (routes, auth guard, validation)     — src/backend/http/
  ├─ Domain layer         (state machine, business rules)     — src/backend/domain/
  ├─ Repository port      (in-memory adapter this build)
  ├─ HRIS adapter port     (fake adapter this build)
  └─ Notifier port         (in-memory recorder this build)

Employee Transfer Web App frontend (this repo, src/frontend/) — new 2026-09-13

HRIS (master data + org update) — external, faked in this build
Data store (TransferRequest / StageAction / DownstreamTask) — in-memory this build
```

Full component and HR-approval sequence diagrams originally lived in `04-plan/Technical-Plan.md`
§2–3 (removed 2026-09-13); the concrete, currently-authoritative record is the implemented
orchestration in `src/backend/domain/transferRequestService.js`.

## Module Boundaries

Single business module in this build: the **Transfer Orchestration Service** itself —
the BRD's scope (employee request → manager → HR → org update → Payroll/IT/Facilities
fan-out → completion) is one cohesive workflow, not multiple independent business domains,
so it was not split into separate business modules. Internally it is layered (ports &
adapters, ADR-03), not modularized by business sub-domain, because there is only one.

If a genuinely separate business domain is added later (e.g. a standalone Payroll or ITSM
integration module with its own lifecycle), it should get its own
`src/backend/modules/<name>/` directory per this skill's standard business-module structure
— but no such second domain exists yet, so none is scaffolded speculatively.

**Frontend module (added 2026-09-13):** one business module, `src/frontend/modules/transfer-requests/`,
mirroring the single-module backend decision above for the same reason — one cohesive workflow,
not several independent domains. It consumes the backend's existing `/api/v1` contract as a
plain REST client; it does not introduce a BFF or GraphQL layer. See
`.ai-context/plans/employee-transfer-webapp.plan.md` for the module's internal structure.

## Architecture Decision Records (already made; originally recorded in the removed `04-plan/Technical-Plan.md` §7)
- **ADR-01** — Central orchestrator, not choreography.
- **ADR-02** — Downstream teams (Payroll/IT/Facilities) act as portal users via an internal
  task queue in V1, not external system integration.
- **ADR-03** — Ports & adapters (hexagonal) boundary: `HrisPort`, `RepositoryPort`, `NotifierPort`.
- **ADR-04** — Explicit finite-state-machine module; transition legality lives in one place.
- **ADR-05** — Target production store: relational (e.g. PostgreSQL); in-memory for this build.
- **ADR-06** — Idempotency scoped to the creation endpoint only.

## Database Boundaries
Single logical store today (in-memory): `TransferRequest`, `StageAction` (insert-only),
`DownstreamTask`. No cross-module database access exists because there is only one module.
A future relational adapter (ADR-05) must go through migrations, not ad hoc writes
(`.ai-context/constitution.md` Architectural Constraints).

## API Boundaries
Single `/api/v1` REST surface, 8 endpoints, bearer-token auth, standard error envelope. Full
contract originally documented in `06-api-contract/API-Contract.md` (removed 2026-09-13); the
summary table in `.ai-context/specs/employee-transfer-webapp.spec.md` plus the implemented
routes at `src/backend/http/routes/transferRequests.js` are the surviving record.

## Candidate Future Service Boundaries (microservice readiness)
Per ADR-02/03, the seams already drawn (if real external integrations replace the current
fakes) are:
- A real HRIS adapter (replacing the fake master-data/placement adapter).
- A real Payroll/ITSM/Facilities ticketing integration (replacing the internal task-queue
  representation), behind a future `TicketingAdapter` port.
- A real relational repository adapter (replacing the in-memory one), per ADR-05.

None of these are separate modules today — they are adapter implementations behind existing
port interfaces, extractable later without changing domain logic (this is the point of
ADR-03).
