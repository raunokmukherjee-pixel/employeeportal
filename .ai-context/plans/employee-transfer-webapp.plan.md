# Plan: Employee Internal Transfer Web App (Full Stack Rebuild)

## Derived From
`.ai-context/specs/employee-transfer-webapp.spec.md`

## Architecture Approach

*(Note: `implementation/` — referenced throughout this plan as the port source — was removed
from the repo on 2026-09-13, after the port below was executed and verified equivalent. This
plan is kept as-written, describing the porting approach as it was carried out.)*

**Backend (`src/backend/`) — port, not redesign.**
Mirrored `implementation/src/` layering exactly (ports & adapters, ADR-03 in
`.ai-context/architecture.md`):
- `src/backend/domain/` — `stateMachine.js`, `transferRequestService.js`,
  `validateCreateRequest.js`, `fanOut.js`, `completion.js`, `constants.js`
- `src/backend/http/` — `app.js`, `authMiddleware.js`, `errorMiddleware.js`, `errors.js`,
  `routes/transferRequests.js`
- `src/backend/adapters/` — `hrisAdapter.js` (fake), `notifier.js` (in-memory recorder),
  `repository.js` (in-memory)
- `src/backend/index.js` — entry point
- No behavior changes. Only reason to touch a file's contents: adjusting relative
  `require(...)` paths for the new location.

**Frontend (`src/frontend/`) — new, React + Vite + plain CSS.**
- `src/frontend/app/` — routing (`react-router-dom`), root `App.jsx`, providers
  (identity/session context)
- `src/frontend/modules/transfer-requests/` — one module, since (per
  `.ai-context/architecture.md`) this is one cohesive business domain, not several:
  - `components/` — `RequestForm`, `RequestList`, `RequestDetail`, `DecisionPanel`
    (manager/HR), `TaskQueue` (Payroll/IT/Facilities), `IdentitySwitcher`
  - `pages/` — `NewRequestPage`, `MyRequestsPage`, `RequestDetailPage`, `TaskQueuePage`
  - `services/` — `transferRequestsApi.js` (fetch wrapper over `/api/v1/transfer-requests*`)
  - `hooks/` — `useAuth` (reads/writes the demo identity), `useTransferRequest(s)`
- `src/frontend/shared/` — generic fetch client, error display, layout

**Integration point:** frontend calls the backend's existing REST contract
(`06-api-contract/API-Contract.md`) unchanged — `Authorization: Bearer <token>` header, where
the token is produced client-side by the demo identity switcher using the same
base64url(`{userId, roles}`) shape `src/backend/http/authMiddleware.js` already decodes (ported
from `implementation/src/http/authMiddleware.js`'s `encodeToken`). No new auth protocol.

**Dev topology:** two dev servers locally (Express on one port, Vite dev server on another),
Vite configured to proxy `/api` to the backend port — standard for this stack, not a
microservice split. Modular Monolith default preserved (`architecture.md`).

## Data Model
No changes. Same `TransferRequest` / `StageAction` (insert-only) / `DownstreamTask` shapes as
`implementation/src/domain/`. No migration — still in-memory (spec's Explicitly Out of Scope).

## Constitution Check
- [x] No new datastore introduced without ADR — in-memory repository carried forward unchanged.
- [x] Testing discipline matches `constitution.md` — test-first (RED → GREEN) for every backend
      endpoint (ported) and every frontend state-changing action (new).
- [x] Security posture matches `constitution.md` — bearer-token auth carried forward unchanged;
      no PII logging introduced (frontend must not `console.log` request payloads containing
      `reason` free text beyond what's needed for debugging, and never token contents).

## Explicitly Deferred
- ~~Removing/archiving `implementation/` — left in place until the user confirms it's safe to
  retire.~~ **Resolved 2026-09-13:** user confirmed once `src/backend/` was verified an
  equivalent port; `implementation/` was removed.
- Postgres/ORM adoption (ADR-05) — still `[Open]`, not part of this rebuild.
- Any visual design system beyond plain CSS — spec says "plain CSS," so no component library.

## Sequencing
1. **Backend port, test-first**: for each existing test file in `implementation/tests/`, create
   its `tests/backend/` counterpart pointing at `src/backend/...` (RED — module doesn't exist
   yet), then port the corresponding `implementation/src/...` file to `src/backend/...`
   (GREEN). Domain layer first (no dependencies), then adapters, then HTTP layer, then
   `index.js`. Confirm full backend suite GREEN before starting frontend.
2. **Frontend scaffold**: Vite + React project skeleton at `src/frontend/`, no business logic
   yet — confirm it builds and renders an empty shell.
3. **Frontend, test-first, screen by screen** (each screen: RTL/Jest test written against the
   not-yet-built component — RED — then the component — GREEN):
   a. Identity switcher (needed by every other screen's tests to set an identity in context)
   b. New Request form (`AC-F01`–`AC-F03`)
   c. My Requests list (`AC-F04`)
   d. Request detail/timeline (`AC-F05`)
   e. Manager decision panel (`AC-F06`–`AC-F07`)
   f. HR decision panel (`AC-F08`–`AC-F09`)
   g. Task queue (Payroll/IT/Facilities) (`AC-F10`–`AC-F11`)
   h. Cancel action (`AC-F12`–`AC-F13`)
   i. RBAC-gated rendering across all of the above (`AC-F14`–`AC-F15`)
4. **Full-stack verification**: run backend + frontend suites together, confirm all GREEN, then
   present for Gate 2.
