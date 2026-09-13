# Test Cases: Employee Internal Transfer Web App (Full Stack Rebuild)

## Derived From Spec
`.ai-context/specs/employee-transfer-webapp.spec.md`

## Backend (`tests/backend/`) — ported unchanged from `implementation/tests/` (now removed)
Same 46 test cases (`TC-001`–`TC-042` + boundary suffixes), same 18 suites, re-pointed at
`src/backend/` instead of the original `implementation/src/` (both `implementation/src/` and
`implementation/tests/` were removed 2026-09-13 once this port was verified equivalent). Full
table already exists at `.ai-context/test_cases/employee-internal-transfer.test_cases.md` —
not duplicated here. Files were ported 1:1 by name:

| former `implementation/tests/...` | `tests/backend/...` |
|---|---|
| `unit/stateMachine.test.js` | `unit/stateMachine.test.js` |
| `unit/validateCreateRequest.test.js` | `unit/validateCreateRequest.test.js` |
| `unit/fanOut.test.js` | `unit/fanOut.test.js` |
| `unit/completion.test.js` | `unit/completion.test.js` |
| `unit/hrisAdapter.test.js` | `unit/hrisAdapter.test.js` |
| `unit/repository.test.js` | `unit/repository.test.js` |
| `unit/authMiddleware.test.js` | `unit/authMiddleware.test.js` |
| `unit/errorMiddleware.test.js` | `unit/errorMiddleware.test.js` |
| `integration/create.spec.test.js` | `integration/create.spec.test.js` |
| `integration/getById.spec.test.js` | `integration/getById.spec.test.js` |
| `integration/list.spec.test.js` | `integration/list.spec.test.js` |
| `integration/managerDecision.spec.test.js` | `integration/managerDecision.spec.test.js` |
| `integration/hrDecision.spec.test.js` | `integration/hrDecision.spec.test.js` |
| `integration/downstreamTask.spec.test.js` | `integration/downstreamTask.spec.test.js` |
| `integration/cancel.spec.test.js` | `integration/cancel.spec.test.js` |
| `integration/notifications.spec.test.js` | `integration/notifications.spec.test.js` |
| `integration/security.spec.test.js` | `integration/security.spec.test.js` |
| `integration/e2e.happyPath.spec.test.js` | `integration/e2e.happyPath.spec.test.js` |
| `helpers/*.js` | `helpers/*.js` |

## Frontend (`tests/frontend/`) — new, React Testing Library + Jest

| Test ID | Maps to AC | Scenario | Expected | Automated Test File |
|---|---|---|---|---|
| employee-transfer-webapp.TC-F01 | AC-F15 | Select a seeded identity in the switcher | Auth context updates; subsequent API calls carry that identity's token | tests/frontend/modules/transfer-requests/IdentitySwitcher.test.jsx |
| employee-transfer-webapp.TC-F02 | AC-F01 | Employee fills and submits a valid New Request form | POST fires once with an Idempotency-Key header; navigates to detail view showing SUBMITTED | tests/frontend/modules/transfer-requests/NewRequestForm.test.jsx |
| employee-transfer-webapp.TC-F03 | AC-F02 | Submit fails with 400 VALIDATION_ERROR | Field-level error(s) rendered inline; form retains entered values | tests/frontend/modules/transfer-requests/NewRequestForm.test.jsx |
| employee-transfer-webapp.TC-F04 | AC-F03 | Double-click Submit before first response returns | Only one distinct Idempotency-Key value used across both fired requests | tests/frontend/modules/transfer-requests/NewRequestForm.test.jsx |
| employee-transfer-webapp.TC-F05 | AC-F04 | Employee opens My Requests | List renders all returned items, newest first, with status + pending-with | tests/frontend/modules/transfer-requests/MyRequestsList.test.jsx |
| employee-transfer-webapp.TC-F06 | AC-F05 | Any entitled viewer opens a request's detail view | Status, fields, pending-with, tasks, and timeline all rendered from the GET response | tests/frontend/modules/transfer-requests/RequestDetail.test.jsx |
| employee-transfer-webapp.TC-F07 | AC-F06 | Manager approves an assigned SUBMITTED request | POST manager-decision APPROVED fires; UI reflects PENDING_HR_VALIDATION | tests/frontend/modules/transfer-requests/ManagerDecisionPanel.test.jsx |
| employee-transfer-webapp.TC-F08 | AC-F07 | Manager attempts Reject with no comment, then with a comment | Reject disabled until comment entered; POST fires with comment once enabled | tests/frontend/modules/transfer-requests/ManagerDecisionPanel.test.jsx |
| employee-transfer-webapp.TC-F09 | AC-F08 | HR approves a PENDING_HR_VALIDATION request | UI shows org-update completed + fanned-out task list from response | tests/frontend/modules/transfer-requests/HrDecisionPanel.test.jsx |
| employee-transfer-webapp.TC-F10 | AC-F09 | HR rejects with required comment | Same required-comment gating as manager panel | tests/frontend/modules/transfer-requests/HrDecisionPanel.test.jsx |
| employee-transfer-webapp.TC-F11 | AC-F10 | Downstream user completes their assigned task (last outstanding) | Task shows COMPLETED; overall status shown as COMPLETED | tests/frontend/modules/transfer-requests/TaskQueue.test.jsx |
| employee-transfer-webapp.TC-F12 | AC-F11 | Downstream user marks task Not Required with comment | Task shows NOT_REQUIRED; excluded from employee's pending view | tests/frontend/modules/transfer-requests/TaskQueue.test.jsx |
| employee-transfer-webapp.TC-F13 | AC-F12 | Employee cancels an eligible (pre-HR-approval) request | POST cancel fires; detail view shows CANCELLED, no further actions offered | tests/frontend/modules/transfer-requests/RequestDetail.test.jsx |
| employee-transfer-webapp.TC-F14 | AC-F13 | Employee views a request already PENDING_HR_VALIDATION or later | Cancel action is not rendered | tests/frontend/modules/transfer-requests/RequestDetail.test.jsx |
| employee-transfer-webapp.TC-F15 | AC-F14 | Identity without permission for an action views a screen offering it | Action not rendered; direct-invocation path shows a "not permitted" state, not a crash | tests/frontend/modules/transfer-requests/RbacGating.test.jsx |

## Test-First Rule
Every file above is written and run to a confirmed RED (missing component/module) before its
corresponding `src/frontend/` component is implemented. Backend test files were ported as-is —
their RED state was transient (only until the corresponding `src/backend/` file was ported)
since the behavior they assert was already proven correct in `implementation/` (removed
2026-09-13 after this port was verified equivalent).

## Post-Verification Fixes (2026-09-13)
An ad-hoc `/code-review` pass on the full diff (after T15) found and fixed 4 issues, all
re-verified GREEN against the suites above afterward: an HR-decision persistence-failure
atomicity gap, an idempotency-key-vs-validation ordering bug, a frontend bug that silently
dropped the "identical to current placement" validation message, and a duplicated
`DOWNSTREAM_TASK_TYPES` constant in the route file. None of these had a dedicated failing test
written first — they were found by review, not by a test-first cycle — so, per the constitution's
test-first discipline, note this as debt: dedicated regression tests for these 4 fixes should
still be added before Gate 2 sign-off is considered complete in spirit, not just in test count.
