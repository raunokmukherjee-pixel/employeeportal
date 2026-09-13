# Tasks: Employee Internal Transfer Web App (Full Stack Rebuild)

## Derived From
`.ai-context/plans/employee-transfer-webapp.plan.md`

## Sequence

### Backend port (`src/backend/`, `tests/backend/`)
- [x] employee-transfer-webapp.T01 — Port domain layer (`stateMachine`, `constants`,
      `validateCreateRequest`, `fanOut`, `completion`, `transferRequestService`) and its unit
      tests — Acceptance: BE01 (domain slice)
- [x] employee-transfer-webapp.T02 — Port adapters (`hrisAdapter`, `notifier`, `repository`)
      and their unit tests — Acceptance: BE01 (adapters slice)
- [x] employee-transfer-webapp.T03 — Port HTTP layer (`authMiddleware`, `errorMiddleware`,
      `errors`, `routes/transferRequests`, `app.js`, `index.js`) and its unit tests —
      Acceptance: BE01 (HTTP slice)
- [x] employee-transfer-webapp.T04 — Port integration test suite (all 10 integration spec
      files) against `src/backend/` and confirm full backend suite GREEN — Acceptance: BE01
      (full). **Done:** 18/18 suites, 128/128 tests GREEN at `tests/backend/` against
      `src/backend/`, identical to `implementation/`'s baseline (confirmed equivalent, then
      `implementation/` was removed 2026-09-13). Root `package.json` +
      `jest.config.backend.js` created to run it.

### Frontend scaffold & shared infrastructure
- [x] employee-transfer-webapp.T05 — Vite + React project scaffold at `src/frontend/`
      (package.json, vite.config, index.html, entry point, API proxy to backend) —
      Acceptance: enables all frontend ACs
- [x] employee-transfer-webapp.T06 — Shared API client (`services/transferRequestsApi.js`) +
      identity/session context (`hooks/useAuth.js`) + demo `IdentitySwitcher` component, test
      first — Acceptance: AC-F15

### Frontend screens (test-first, one task = one screen)
- [x] employee-transfer-webapp.T07 — New Request form — Acceptance: AC-F01, AC-F02, AC-F03
- [x] employee-transfer-webapp.T08 — My Requests list — Acceptance: AC-F04
- [x] employee-transfer-webapp.T09 — Request detail/timeline view — Acceptance: AC-F05
- [x] employee-transfer-webapp.T10 — Manager decision panel — Acceptance: AC-F06, AC-F07
- [x] employee-transfer-webapp.T11 — HR decision panel — Acceptance: AC-F08, AC-F09
- [x] employee-transfer-webapp.T12 — Downstream task queue (Payroll/IT/Facilities) —
      Acceptance: AC-F10, AC-F11
- [x] employee-transfer-webapp.T13 — Cancel action on detail view — Acceptance: AC-F12, AC-F13
- [x] employee-transfer-webapp.T14 — RBAC-gated rendering pass across all screens —
      Acceptance: AC-F14

**T05–T14 done:** `src/frontend/` built test-first, 8 suites / 25 tests GREEN
(`tests/frontend/modules/transfer-requests/*.test.jsx`), production build verified via
`npm run build`.

### Verification
- [x] employee-transfer-webapp.T15 — Full-stack test run (`tests/backend/` + `tests/frontend/`)
      confirmed GREEN; present for Gate 2 — Acceptance: all ACs. **Done:** 18/18 + 8/8 suites,
      128/128 + 25/25 tests GREEN, independently re-run (not just trusting the implementing
      agents' reports). An ad-hoc `/code-review` pass on the diff then found and fixed 4
      issues (HR-decision atomicity, idempotency/validation ordering, a frontend
      swallowed-error-message bug, a duplicated constant) — full suites re-run and confirmed
      still GREEN after the fixes. See `.ai-context/specs/employee-transfer-webapp.spec.md`
      for the Gate 2 review request.
