# Test Cases: Employee Internal Transfer Digital Journey

## Registration Note
Originally mapped from `03-tests/Spec-Derived-Test-Cases.md` (removed 2026-09-13) — all 46
test cases below are automated and GREEN (18 suites / 128 tests, 96% coverage; evidence
originally in `10-gate2/Gate2-Evidence.md`, also removed 2026-09-13). Original `TC-xxx` IDs
preserved rather than remapped to `<slug>.TCnn`, since they are referenced throughout the
(now-removed) traceability matrix and the test file names below, which now live at
`tests/backend/` (ported 2026-09-13 from the original, now-also-removed `implementation/tests/`,
after verification that all 128 tests still pass identically).

## Derived From Spec
.ai-context/specs/employee-internal-transfer.spec.md

## Acceptance Test Scenarios (38 AC-derived + 4 boundary/combination + 4 cross-cutting = 46)

| Test ID | Maps to AC/NFR | Type | Scenario | Expected | Automated Test File |
|---|---|---|---|---|---|
| TC-001 | AC-001 | P | Valid submission | `201`, `SUBMITTED`, manager notified | tests/backend (create) |
| TC-002 | AC-002 | N | Missing required field | `400 VALIDATION_ERROR`, no record | tests/backend (validation) |
| TC-003 / TC-003B | AC-003 | N / E | Below / exactly at 14-day lead time | `400` / `201` (boundary inclusive) | tests/backend (validation) |
| TC-004 | AC-004 | N | Past effective date | `400 VALIDATION_ERROR` | tests/backend (validation) |
| TC-005 | AC-005 | N | Unknown master-data id | `400 VALIDATION_ERROR` | tests/backend (validation) |
| TC-006 | AC-006 | N | No-op transfer | `400 VALIDATION_ERROR` | tests/backend (validation) |
| TC-007 / TC-007B | AC-007 | N / E | Duplicate active request / new after terminal | `409` / `201` | tests/backend (create) |
| TC-008 | AC-008 | P | Reason optional | `201`, reason null | tests/backend (create) |
| TC-009 | AC-009 | N | Reason > 1000 chars | `400 VALIDATION_ERROR` | tests/backend (validation) |
| TC-010 | AC-010 | P | Owner views full detail | `200`, status + timeline | tests/backend (getById) |
| TC-011 | AC-011 | N | Non-owner forbidden | `403 FORBIDDEN` | tests/backend (getById) |
| TC-012 | AC-012 | P | List own-only, newest first | own requests only, ordered | tests/backend (list) |
| TC-013 / TC-013B | AC-013 | P / E | Pending-with per status / empty on terminal | correct owner set / `[]` | tests/backend (getById) |
| TC-014 | AC-014 | P | Manager approves | `200`, `PENDING_HR_VALIDATION`, HR notified | tests/backend (managerDecision) |
| TC-015 | AC-015 | P | Manager rejects with comment | `200`, `MANAGER_REJECTED` | tests/backend (managerDecision) |
| TC-016 | AC-016 | N | Manager rejects without comment | `400`, unchanged | tests/backend (managerDecision) |
| TC-017 | AC-017 | N | Wrong manager forbidden | `403`, unchanged | tests/backend (managerDecision) |
| TC-018 | AC-018 | N | Double decision blocked | `409`, unchanged | tests/backend (managerDecision) |
| TC-019 | AC-019 | P | HR approves triggers fan-out | `200`, `IN_PROGRESS`, tasks created | tests/backend (hrDecision) |
| TC-020 | AC-020 | P | HR rejects with comment | `200`, `HR_REJECTED` | tests/backend (hrDecision) |
| TC-021 | AC-021 | N | HR rejects without comment | `400` | tests/backend (hrDecision) |
| TC-022 | AC-022 | N | Non-HR forbidden | `403` | tests/backend (hrDecision) |
| TC-023 | AC-023 | P | Org update always synchronous | `ORG_UPDATE=COMPLETED` same response | tests/backend (hrDecision) |
| TC-024 | AC-024 | P | Payroll required on role change | `PAYROLL=PENDING` | tests/backend (hrDecision) |
| TC-025 | AC-025 | P | IT required on dept change | `IT=PENDING` | tests/backend (hrDecision) |
| TC-026 | AC-026 | P | Facilities required on location change | `FACILITIES=PENDING` | tests/backend (hrDecision) |
| TC-027 / TC-027B | AC-027 | P / E | Non-triggering → NOT_REQUIRED / combined dimensions | correct per-team status | tests/backend (hrDecision) |
| TC-028 | AC-028 | P | Assigned team completes task | `200`, `COMPLETED` | tests/backend (downstreamTask) |
| TC-029 | AC-029 | P | Assigned team marks not-required | `200`, `NOT_REQUIRED` | tests/backend (downstreamTask) |
| TC-030 | AC-030 | N | Act before fan-out | `404` | tests/backend (downstreamTask) |
| TC-031 | AC-031 | N | Wrong-team forbidden | `403`, unchanged | tests/backend (downstreamTask) |
| TC-032 | AC-032 | P | Last required task completes request | `200`, auto-`COMPLETED` | tests/backend (downstreamTask) |
| TC-033 | AC-033 | N | Not complete while one task pending | remains `IN_PROGRESS` | tests/backend (downstreamTask) |
| TC-034 | AC-034 | P | Employee cancels pre-approval | `200`, `CANCELLED` | tests/backend (cancel) |
| TC-035 | AC-035 | N | Cancel blocked post-HR-approval | `409`, unchanged | tests/backend (cancel) |
| TC-036 | AC-036 | N | Non-owner cannot cancel | `403`, unchanged | tests/backend (cancel) |
| TC-037 | AC-037 | P | Exactly one notification per transition | 1 event, correct next-owner | tests/backend (notifications) |
| TC-038 | AC-038 | P | Idempotent replay | `200`, original record, no duplicate | tests/backend (create) |
| TC-039 | NFR-01 | P | Immutable audit trail | append-only `StageAction` timeline | tests/backend (e2e) |
| TC-040 | NFR-02 | N | Unauthenticated request rejected | `401` | tests/backend (authGuard) |
| TC-041 | Security SEC-03 | N | Cross-tenant IDOR on task action | `404`/`403`, no cross-request resolution | tests/backend (security) |
| TC-042 | Security SEC-05 | N | Malformed payload | `400`, no `500`, no stack leak | tests/backend (security) |

Full Given/When/Then text for every row was originally in `03-tests/Spec-Derived-Test-Cases.md`
(removed 2026-09-13); the executable test files at `tests/backend/` (column above) are the
surviving concrete record.

**Summary:** 46/46 automated, 46/46 GREEN, 100% AC coverage (38/38). Originally executed
test-first (RED confirmed before implementation) per `10-gate2/Gate2-Evidence.md` §1 and the
raw run logs in `10-gate2/evidence-raw/` (both removed 2026-09-13). Re-verified GREEN at
`tests/backend/` after the 2026-09-13 port.
