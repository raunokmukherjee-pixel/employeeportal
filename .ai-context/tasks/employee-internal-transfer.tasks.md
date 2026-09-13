# Tasks: Employee Internal Transfer Digital Journey

## Registration Note
Originally mapped from `05-tasks/Task-Decomposition.md` (removed 2026-09-13) — all 20 tasks
below were implemented and merged in the original `implementation/src`, `implementation/tests`
(ported to `src/backend/`, `tests/backend/` on 2026-09-13, after which `implementation/` was
removed once the port was verified equivalent). Original `TASK-NN` IDs preserved (referenced
throughout the former `10-gate2/Gate2-Evidence.md` and `traceability/Traceability-Matrix.md`,
both also removed 2026-09-13) rather than remapped to `<slug>.Tnn`.

## Derived From
.ai-context/plans/employee-internal-transfer.plan.md

## Sequence (all states: Merged)
- [x] TASK-01 — Project scaffold (Node + Express + Jest + Supertest) — Acceptance: enabling
- [x] TASK-02 — Domain types & status enums — Acceptance: FR data model
- [x] TASK-03 — State-machine module (`transition(status, event)`) — Acceptance: AC-018, AC-030, AC-035
- [x] TASK-04 — Fake HRIS adapter (master data + placement update) — Acceptance: AC-005, AC-006, AC-023
- [x] TASK-05 — In-memory repository (one-active-request constraint) — Acceptance: AC-007, AC-012
- [x] TASK-06 — Request-creation validation — Acceptance: AC-002, AC-003, AC-003B, AC-004, AC-005, AC-006, AC-008, AC-009
- [x] TASK-07 — `POST /transfer-requests` (create + idempotency) — Acceptance: FR-01, FR-15, AC-001, AC-007, AC-007B, AC-038
- [x] TASK-08 — `GET /transfer-requests/{id}` (detail + pendingWith) — Acceptance: FR-02, FR-03, AC-010, AC-011, AC-013, AC-013B
- [x] TASK-09 — `GET /transfer-requests?scope=mine` (list) — Acceptance: FR-04, AC-012
- [x] TASK-10 — `POST .../manager-decision` — Acceptance: FR-05, AC-014–018
- [x] TASK-11 — `POST .../hr-decision` (org update + A-06 fan-out) — Acceptance: FR-06, FR-07, FR-08, AC-019–027, AC-027B
- [x] TASK-12 — `POST .../tasks/{type}/complete` and `.../not-required` (incl. auto-completion) — Acceptance: FR-09, FR-10, AC-028–033
- [x] TASK-13 — `POST .../cancel` — Acceptance: FR-11, AC-034–036
- [x] TASK-14 — Notification recorder ("exactly one per transition") — Acceptance: FR-14, AC-037
- [x] TASK-15 — AuthN/AuthZ middleware — Acceptance: NFR-02, AC-011, AC-017, AC-022, AC-031, AC-036, TC-040
- [x] TASK-16 — Error-handling middleware (consistent envelope) — Acceptance: TC-042
- [x] TASK-17 — End-to-end happy-path integration test — Acceptance: full journey
- [x] TASK-18 — Security-focused tests (IDOR, malformed payload) — Acceptance: TC-041, TC-042
- [x] TASK-19 — Traceability matrix compiled — Acceptance: all
- [x] TASK-20 — Activity tracker + package readme — Acceptance: governance (non-code)

Full dependency graph, estimates, and Definition-of-Done per task were originally in
`05-tasks/Task-Decomposition.md` (removed 2026-09-13).
