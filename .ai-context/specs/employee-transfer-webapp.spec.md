# Spec: Employee Internal Transfer Web App (Full Stack Rebuild)

## Spec ID
employee-transfer-webapp

## Status
Ready for Release

## Linked BRD
`.ai-context/BRD.md` §4 (FR-01–FR-15), §5 (NFR-01–NFR-06), §6 (BR-01–BR-10)

## Gate Approvals & History
| Gate | Approver | Date | Outcome | Approval Comment |
|---|---|---|---|---|
| Gate 1 (Spec Review) | Raunok Mukherjee (repository owner) | 2026-09-13 | Approved | "continue" — instruction to proceed with plan → tasks → test-first implementation. |
| Gate 2 (Code Review) | Supratim Jetty (`supratim.jetty@intglobal.com`) | 2026-09-15 | Approved | Approved at Gate 2 PR Review — 26/26 test suites GREEN (153/153 tests passing). Record: [GATE2-employee-transfer-webapp-20260915-004400.md](../pr_reviews/GATE2-employee-transfer-webapp-20260915-004400.md) |


**Gate 1 authority gap, not silently resolved:** `.ai-context/constitution.md` records both
Technical Lead and Project Manager as **[Open]** — no one is named in this repository who
satisfies this skill's "Gate 1 approved by PM/TL, pushed under PM/TL Git identity" rule. This
mirrors the same unresolved gap already logged against `employee-internal-transfer.spec.md`.
Proceeding on user (repository owner) approval, consistent with how that prior gap was
handled, rather than fabricating a PM/TL identity.

## Registration Note — Relationship to the Existing Backend Spec

This is a **new spec**, not a revision of `.ai-context/specs/employee-internal-transfer.spec.md`
(Status: Ready for Release, Gate 1 Approved With Conditions 2026-09-08). That spec is not
modified, deprecated, or deleted by this one — it remains the historical record of what
`implementation/` was and did (128/128 tests, 96% coverage) even though `implementation/`
itself was later removed (2026-09-13, after the port below was verified equivalent — see
Post-Approval Update below).

This spec covers a **project-scope change from Backend Only to Full Stack**, per explicit user
direction (2026-09-13):
1. **Backend rebuild** — the same approved business behavior (FR-01–FR-15, all 38 existing
   `AC-001`–`AC-038`) re-implemented at this skill's standard location, `src/backend/`, instead
   of `implementation/src/`. This is a **like-for-like technical port, not a business change** —
   no new backend business behavior is introduced.
2. **New frontend** — a web UI at `src/frontend/` (React + Vite + plain CSS, per user decision)
   that did not exist before and was explicitly out of scope in the original BRD/spec ("Portal
   frontend UI module... not built as part of this exercise"). This is genuinely new scope.

## Post-Approval Update (2026-09-13)

Backend port and frontend build both completed and verified GREEN (18/18 + 8/8 suites,
128/128 + 25/25 tests). Once `src/backend/` was confirmed an equivalent, passing port,
the user confirmed `implementation/` could be removed, and it was — resolving the deferred
question in `employee-transfer-webapp.plan.md`'s "Explicitly Deferred" section. An ad-hoc
`/code-review` pass then found and fixed 4 issues (see
`.ai-context/test_cases/employee-transfer-webapp.test_cases.md` "Post-Verification Fixes");
all suites re-confirmed GREEN afterward. Presented for Gate 2 below.

## Intent
Give an employee a single web application to request, track, and complete an internal transfer
(department / location / role change), with the app's backend orchestrating manager
confirmation, HR eligibility validation, org-data update, and conditional Payroll / IT /
Facilities actions, and its frontend giving every actor (Employee, Manager, HR, Payroll, IT,
Facilities) a UI to see their own pending work and act on it — replacing the fragmented,
email-driven, manual process end-to-end, including in the browser (not just via API).

## Context
- Builds on: `.ai-context/architecture.md`, updated to record the Full Stack decision — new
  `src/backend/` and `src/frontend/` trees; `implementation/` was subsequently removed
  (2026-09-13) once `src/backend/` was verified an equivalent port.
- Related: `.ai-context/specs/employee-internal-transfer.spec.md` (original backend-only spec —
  business behavior source of truth for FR-01–FR-15, reused unchanged here).
- API contract: originally `06-api-contract/API-Contract.md` (removed 2026-09-13); same 8
  endpoints, same request/response shapes, same error envelope — re-implemented at
  `src/backend/`, not redesigned; summary table under "API Contract" below.
- Auth: no real Portal SSO exists to integrate with (BRD A-11 / the former
  `implementation/src/http/authMiddleware.js`, ported to `src/backend/http/authMiddleware.js`,
  already documented this service only ever *reads* `{ userId, roles[] }` claims from a bearer
  token, never issues one). This build carries the same approach forward at `src/backend/`,
  plus a **demo identity switcher** in the frontend (pick a seeded identity, e.g. `emp-4471`
  Employee, `mgr-2210` Manager, `hr-001` HR, ...) so the full journey is walkable in a browser.
  This switcher is explicitly **not** a login/authentication feature and is not itself a
  Business Requirement — it stands in for the Portal's existing SSO exactly as the backend's
  `encodeToken` helper already does for its own tests.

## Actors & RBAC
Unchanged from the BRD: `EMPLOYEE`, `MANAGER`, `HR`, `PAYROLL`, `IT`, `FACILITIES`.

## API Contract (Mandatory — API surface exists)
Unchanged from `06-api-contract/API-Contract.md` — re-implemented identically at `src/backend/`:

| Endpoint | Role | FRs |
|---|---|---|
| `POST /api/v1/transfer-requests` | EMPLOYEE | FR-01, FR-12, FR-15 |
| `GET /api/v1/transfer-requests/{id}` | owner/assigned actor | FR-02, FR-03, FR-13 |
| `GET /api/v1/transfer-requests?scope=mine` | EMPLOYEE | FR-04 |
| `POST /api/v1/transfer-requests/{id}/manager-decision` | MANAGER | FR-05 |
| `POST /api/v1/transfer-requests/{id}/hr-decision` | HR | FR-06, FR-07, FR-08 |
| `POST /api/v1/transfer-requests/{id}/tasks/{type}/complete` | PAYROLL/IT/FACILITIES | FR-09, FR-10 |
| `POST /api/v1/transfer-requests/{id}/tasks/{type}/not-required` | PAYROLL/IT/FACILITIES | FR-09 |
| `POST /api/v1/transfer-requests/{id}/cancel` | EMPLOYEE (owner) | FR-11 |

Full request/response bodies and error tables were originally in `06-api-contract/API-Contract.md`
(removed 2026-09-13, not retranscribed here — this port made no contract changes); the
implemented routes at `src/backend/http/routes/transferRequests.js` are the surviving record.

## Acceptance Criteria

### Backend (`src/backend/`) — reused unchanged from the existing approved spec
`employee-transfer-webapp.BE01` — Given `src/backend/` implements the same domain/http/adapters
layering as the former `implementation/src/` (state machine, validation, fan-out, completion,
RBAC, idempotency), when the full existing test suite (ported to `tests/backend/`) is run, then
all 38 existing acceptance criteria `AC-001`–`AC-038` (originally full-text in
`02-spec/Feature-Spec.md` §9, removed 2026-09-13; summarized in
`employee-internal-transfer.spec.md`) pass identically to the original `implementation/`
build (removed 2026-09-13 after this was verified) — no behavior change, only a new file
location and (if applicable)
updated module boundaries per `architecture.md`.

### Frontend (`src/frontend/`) — new
1. `employee-transfer-webapp.AC-F01` — Given an authenticated Employee on the "New Request"
   screen, when they submit department, location, role, an effective date ≥ 14 days out, and an
   optional reason, then the request is created (idempotency key generated client-side per
   submission) and the app navigates to its detail view showing status `SUBMITTED`.
2. `employee-transfer-webapp.AC-F02` — Given the "New Request" form, when submission fails
   `400 VALIDATION_ERROR` (e.g. effective date too soon, missing field, an existing active
   request), then the specific field-level error(s) from the response are shown inline and the
   form is not cleared.
3. `employee-transfer-webapp.AC-F03` — Given a slow network causing a double-click on Submit,
   when the second click fires before the first response returns, then the same idempotency key
   is reused for both attempts (no duplicate request is visibly created).
4. `employee-transfer-webapp.AC-F04` — Given an authenticated Employee on "My Requests", when
   the screen loads, then all of their own requests (active and historical) are listed newest
   first, each showing status and current "pending with".
5. `employee-transfer-webapp.AC-F05` — Given any request the current user is entitled to view
   (owner, assigned manager/HR, or an assigned downstream actor), when its detail view is
   opened, then status, all proposed fields, "pending with", the downstream task list, and the
   full decision timeline are displayed.
6. `employee-transfer-webapp.AC-F06` — Given a Manager viewing a request in `SUBMITTED` that
   is assigned to them, when they choose Approve, then the request moves to
   `PENDING_HR_VALIDATION` and the UI reflects the new "pending with: HR".
7. `employee-transfer-webapp.AC-F07` — Given the same Manager screen, when they choose Reject,
   then a comment is required before the action is enabled, and after submission the request
   shows a terminal rejected state with that comment visible to the employee.
8. `employee-transfer-webapp.AC-F08` — Given HR viewing a request in `PENDING_HR_VALIDATION`,
   when they choose Approve, then the UI shows the org-data update as completed and lists
   whichever of Payroll/IT/Facilities tasks were fanned out (per BRD rule A-06), each `PENDING`.
9. `employee-transfer-webapp.AC-F09` — Given the same HR screen, when they choose Reject, a
   comment is required, and after submission the request shows a terminal rejected state.
10. `employee-transfer-webapp.AC-F10` — Given a Payroll/IT/Facilities user on their task queue
    view, when they mark an assigned task Complete, then that task shows `COMPLETED` and, if it
    was the last outstanding required task, the whole request shows `COMPLETED`.
11. `employee-transfer-webapp.AC-F11` — Given the same queue view, when they mark a task
    "Not Required" (with comment), then the task shows `NOT_REQUIRED` and is excluded from what
    the employee sees as still pending.
12. `employee-transfer-webapp.AC-F12` — Given an Employee viewing their own request that is not
    yet HR-approved, when they choose Cancel, then the request moves to `CANCELLED` and no
    further actions are offered on it.
13. `employee-transfer-webapp.AC-F13` — Given the same detail view once the request is
    `PENDING_HR_VALIDATION` or later, the Cancel action is not offered (matches BRD A-04/BR-10).
14. `employee-transfer-webapp.AC-F14` — Given any screen, the UI only ever renders actions the
    current identity's role and ownership actually permit (per FR-13); a direct navigation to
    an action the current identity may not perform renders a "not permitted" state (mirroring
    the backend's `403 FORBIDDEN`), never a crash or a silently-succeeding action.
15. `employee-transfer-webapp.AC-F15` — Given the demo identity switcher, when a different
    seeded identity is selected, then all subsequent screens and actions reflect that identity's
    role/ownership (no page reload required beyond the switch itself).

## Unit Test Cases (spec-derived)
To be created in `.ai-context/test_cases/employee-transfer-webapp.test_cases.md` after Gate 1
approval, per the mandatory Test-First protocol — one test case per AC above (backend: ported
from the existing 46 test cases in `employee-internal-transfer.test_cases.md`; frontend: new,
`tests/frontend/`, one suite per screen).

## Explicitly Out of Scope
- Everything already out of scope at the BRD level (§7): cross-country/visa transfers, separate
  comp-approval workflow, receiving/new-manager acceptance, automated HR eligibility rules,
  SLA/auto-escalation, bulk/mass transfer initiation, editing a submitted request, saving a
  draft.
- **Real authentication/SSO** — the demo identity switcher is explicitly not a login feature;
  no password, session, or token-issuance flow is built.
- **Real HRIS/Payroll/ITSM/Facilities integrations** — adapters stay faked (ADR-02), same as
  the existing build.
- **Persistence beyond in-memory** — `src/backend/` keeps the in-memory `RepositoryPort`
  adapter used today; Postgres remains the named future target (ADR-05, still `[Open]` on
  ORM choice) and is **not** decided or introduced by this spec.
- **Real-time push notifications** — the frontend reflects state on load/refresh/action
  response only; no WebSockets/SSE/polling loop is introduced.
- **Native mobile app.**
- ~~Deleting or modifying `implementation/`~~ — was deferred here as "a separate, explicit
  decision for after this build is verified"; **resolved 2026-09-13** per the Post-Approval
  Update above — the user made that decision once verification passed, and `implementation/`
  was removed.

## Non-Functional Constraints (from constitution.md)
- Performance: status/pending-view reads P95 < 500 ms; submission P95 < 1 s (NFR-05) — applies
  to `src/backend/`, unchanged from the existing build's target.
- Auditability: immutable, actor-stamped `StageAction` trail, no update/delete path (NFR-01).
- Authorization: default-deny, every endpoint role- and ownership-checked (NFR-02); frontend
  must not rely on hiding a button as its only enforcement — the backend check is authoritative.
- Idempotency: `Idempotency-Key` on request creation only (NFR-03, ADR-06).
- Testing discipline: test-first (RED → GREEN) mandatory for every endpoint and state-changing
  UI action, per `.ai-context/constitution.md` Testing Discipline; tests mirror `src/` under
  `tests/backend/` and `tests/frontend/`.
