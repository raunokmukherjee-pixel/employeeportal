# BRD — Employee Internal Transfer Digital Journey (One-Point Employee Portal)

**Status:** Authoritative baseline
**Source:** Originally derived from the assessment deliverables `01-discovery/Discovery-Analysis.md`
and `02-spec/Feature-Spec.md`. Those deliverable folders (and `docs/BRD-SOURCE-NOTE.md`, the
provenance note) were removed from this repository on 2026-09-13 at user request, once their
content had already been fully absorbed into this file — this file is now the sole
authoritative copy. No external client BRD document exists in this repository.
**ID convention:** IDs are inherited unchanged from the (now-removed) source deliverables
(`BR-xx`, `FR-xx`, `NFR-xx`, `AC-xxx`, `OQ-xx`, `A-xx`) to keep existing traceability into the
`tests/backend/` test suite valid (its predecessor, `implementation/tests/`, was removed
2026-09-13 once `tests/backend/` was verified as an equivalent 128/128-passing port).

---

## 1. Objective

Replace a fragmented, manual, multi-team internal-transfer process (employee → manager →
HR → payroll → IT → facilities, coordinated over email/verbal conversations) with a single
digital journey inside the One-Point Employee Portal that:

- Lets an employee **initiate** and **track** an internal transfer request end-to-end.
- Gives the employee a **single view of progress** and of **which stakeholder currently
  owns the next action**, instead of chasing multiple teams.
- **Orchestrates** the downstream stakeholder activities (manager confirmation, HR
  eligibility validation, org-data update, payroll, IT, facilities) so each team acts on
  its own queue rather than being emailed individually.

Business value: reduce transfer cycle time, remove status-chasing overhead from
HR/IT/Payroll/Facilities, create an auditable system-of-record for transfers instead of
email threads.

## 2. Scope

**In scope (V1):**
- Employee-initiated department / location / role transfer requests, submitted through the
  existing One-Point Employee Portal.
- Portal-owned orchestration of: manager confirmation → HR eligibility validation → org-data
  update → conditional Payroll / IT / Facilities tasks → completion notification.
- Single status + "pending-with" view for the requesting employee.
- Role- and ownership-based access control for every read/write.
- Immutable audit trail of every stage transition.

**Out of scope (V1):** see §7.

## 3. Actors

| Actor | Role in the journey |
|---|---|
| **Employee (Requester)** | Initiates the request, supplies transfer details, views status, may cancel/withdraw pre-approval. |
| **Current Manager** | Confirms/approves (or rejects) the release of the employee for transfer. |
| **HR (Transfer Administrator)** | Validates eligibility, approves/rejects the request, is the system-of-record owner for the org-data update. |
| **Payroll Team** | Actions payroll-impacting changes when the transfer affects cost centre/comp. |
| **IT Team** | Provisions/de-provisions system access based on the new department/location/role. |
| **Facilities Team** | Arranges the employee's new physical workspace when location changes. |
| **Portal Platform (system actor)** | Orchestrates the workflow, holds the single status view, notifies stakeholders, integrates with downstream systems (HRIS, Payroll, ITSM, Facilities/space management). |

*A "receiving/new manager" is a plausible additional actor (see OQ-01) but is not confirmed
for V1 and is not treated as a primary actor.*

RBAC roles used in enforcement: `EMPLOYEE`, `MANAGER`, `HR`, `PAYROLL`, `IT`, `FACILITIES`
(claims on the authenticated Portal session; role assignment itself is out of scope of this
journey).

## 4. Functional Requirements

| ID | Requirement | Traces from |
|---|---|---|
| FR-01 | Employee can create a Transfer Request specifying proposed department, location, role, effective date, and optional reason. | BR-01 |
| FR-02 | Employee can view the current status of any of their own requests. | BR-05 |
| FR-03 | Employee can view which stakeholder(s) currently own the next action ("pending with"). | BR-05 |
| FR-04 | Employee can list all their own requests, active and historical. | BR-05 (implied) |
| FR-05 | Assigned manager can approve or reject a request in `SUBMITTED`; rejection requires a comment. | BR-02, BR-08 |
| FR-06 | HR can approve or reject a request in `PENDING_HR_VALIDATION`; rejection requires a comment. | BR-03, BR-08 |
| FR-07 | On HR approval, the system synchronously performs the org-data update and records it as a completed downstream task. | BR-03 |
| FR-08 | On HR approval, the system determines which of Payroll/IT/Facilities are required (per rule A-06) and creates their tasks. | BR-04, A-06 |
| FR-09 | An assigned Payroll/IT/Facilities user can mark their own task `COMPLETED` or `NOT_REQUIRED`. | BR-04 |
| FR-10 | When all required downstream tasks reach a terminal sub-status, the request auto-transitions to `COMPLETED` and the employee is notified. | Journey step 8 |
| FR-11 | Employee can cancel their own request while it has not yet been HR-approved. | BR-10, A-04 |
| FR-12 | All request input is validated: required fields present, effective date ≥ submission + 14 days, proposed org values exist in HRIS master data, proposed placement differs from current placement, one active request per employee. | BR-07, BR-09, A-03, A-10 |
| FR-13 | Every read/write endpoint enforces role- and ownership-based access control. | BR-06 |
| FR-14 | Every state transition emits exactly one notification to the new next-owner. | A-11 |
| FR-15 | Request submission is idempotent under a client-supplied idempotency key. | NFR (duplicate double-click protection) |

Full state machine and data model were defined in the former `02-spec/Feature-Spec.md`
(removed 2026-09-13); the concrete, currently-authoritative record of that design is the
implemented state machine at `src/backend/domain/stateMachine.js` (originally ported unchanged
from the now-also-removed `implementation/src/domain/stateMachine.js`) and its test suite.

## 5. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-01 | **Auditability** — every transition is recorded as an immutable `StageAction` with actor, decision, comment, timestamp. Audit trail is never deleted or edited. |
| NFR-02 | **Authorization** — every endpoint requires an authenticated session; access is denied by default and explicitly granted per role. |
| NFR-03 | **Idempotency** — request creation is idempotent per `Idempotency-Key` header (FR-15). |
| NFR-04 | **Availability of downstream integrations** — a temporary outage in HRIS/Payroll/ITSM/Facilities must not corrupt request state. |
| NFR-05 | **Performance** — status/pending-view reads return P95 < 500 ms; submission P95 < 1 s excluding downstream fan-out (fan-out is async, not on the request path). |
| NFR-06 | **Data privacy** — manager/HR rejection comments are visible to the employee; downstream-team comments are internal only. *(Engineering default pending HR/Legal sign-off — see OQ carried as Residual Risk R-2 at Gate 1.)* |

## 6. Business Rules

Rules explicitly stated or directly implied are marked **[Stated]**; rules needed to make
the journey executable but not stated in the source material are marked **[Inferred]** (see
§8 Assumptions for the resolving default).

| ID | Rule |
|---|---|
| BR-01 | An employee may initiate a transfer request specifying new department, new location, new role, effective date, and an optional reason. **[Stated]** |
| BR-02 | The request must be confirmed by the manager before HR validates eligibility. **[Stated, sequencing]** |
| BR-03 | HR must validate eligibility before org data is updated. **[Stated, sequencing]** |
| BR-04 | Payroll, IT and Facilities involvement is conditional — not every transfer touches every downstream team. **[Stated]** |
| BR-05 | The employee must be able to see current status and which stakeholder(s) currently owe an action, at any time. **[Stated]** |
| BR-06 | Only the requesting employee can submit/view/act on their own request (data ownership). **[Inferred]** |
| BR-07 | An employee may hold only one active (non-terminal) transfer request at a time. **[Inferred]** |
| BR-08 | A rejection (by manager or HR) ends the request in a terminal rejected state; it does not auto-resubmit. **[Inferred]** |
| BR-09 | The effective date must be a real, future date beyond a minimum lead time. **[Inferred — lead time value is Open Question OQ-03]** |
| BR-10 | An employee may cancel/withdraw their own request while it is not yet in a terminal state and no downstream execution has started. **[Inferred]** |

## 7. Out of Scope (V1)

- Cross-country/international transfers and visa/immigration handling (A-09).
- A separate compensation-negotiation / comp-committee approval workflow (A-08).
- Receiving/new-manager acceptance step (A-01).
- Automated HR eligibility rules engine (A-02) — manual decision only.
- SLA-based automatic escalation/reminders (A-07).
- Bulk/mass transfer initiation (e.g., HR-initiated reorg transfers for many employees).
- Native mobile app (responsive web via the existing portal is assumed sufficient).
- Editing a submitted request (A-04) — cancel-and-resubmit only.
- Saving an incomplete request as a draft (client-side only until submission).

## 8. Assumptions

Each assumption is a default adopted so the journey is buildable, standing in for the
matching Open Question in §9. **Each must be reconfirmed with the real business owner
before production build-out.**

| ID | Assumption | Resolves |
|---|---|---|
| A-01 | "Manager" = employee's **current direct manager** at submission time. Receiving-manager acceptance is out of scope for V1. | OQ-01 |
| A-02 | HR eligibility validation is a **manual HR decision** (approve/reject + comment) in V1; no automated eligibility rules engine. | OQ-02 |
| A-03 | Minimum notice/lead time = **effective date ≥ submission date + 14 calendar days**. | OQ-03 |
| A-04 | A request **cannot be edited** once submitted; the employee may only cancel (pre-approval) or wait for the outcome. | OQ-04 |
| A-05 | A **rejection is terminal**; the employee must submit a new request to try again. | OQ-05 |
| A-06 | Conditional downstream fan-out: **Payroll task** if department, role, or location changes; **IT task** if department or location changes; **Facilities task** if location changes. Each downstream team can additionally mark its own task "Not Required." | OQ-06 |
| A-07 | **No SLA/auto-escalation** in V1; stakeholders see an aging "pending since" timestamp only. | OQ-07 |
| A-08 | Compensation-banding changes are flagged to Payroll as part of the Payroll task; a separate formal comp-approval process is out of scope. | OQ-08 |
| A-09 | **Cross-country/visa-impacting transfers are out of scope for V1**; department/location choices are constrained to the employee's current country. | OQ-09 |
| A-10 | Department, location and role master data is **owned by the HRIS** and consumed read-only by the portal. | OQ-10 |
| A-11 | Notifications are sent through the **existing Portal notification service** (in-portal and email). | OQ-11 |

## 9. Open Questions

| ID | Question | Why it matters |
|---|---|---|
| OQ-01 | Is "manager" the employee's current manager only, or does the new/receiving department manager also need to accept the employee? | Changes the approval state machine and who can reject. |
| OQ-02 | What are HR's eligibility criteria (minimum tenure, no active disciplinary action/PIP, etc.)? | Needed to know if eligibility is a manual judgement call or a system-checkable rule. |
| OQ-03 | What is the minimum notice/lead time between submission and effective date? | Drives a hard validation rule (BR-09). |
| OQ-04 | Can an employee edit a submitted request, or only cancel and resubmit? | Affects state machine and UI. |
| OQ-05 | After a rejection, can the employee resubmit the same request, or must they create a new one? | Affects whether "reject" is terminal or reopenable. |
| OQ-06 | What determines whether Payroll/IT/Facilities involvement is required for a given request? | Needed to implement the conditional fan-out (BR-04). |
| OQ-07 | Is there an SLA/escalation if a stakeholder does not act within N days? | Affects scope and notifications. |
| OQ-08 | Does a transfer that changes role/grade require a separate compensation-approval workflow outside this journey? | Could be a hard scope boundary. |
| OQ-09 | Are cross-country transfers (visa/work-authorization implications) in scope? | High complexity if yes. |
| OQ-10 | What is the system of record for department/location/role master data — the HRIS, or does the portal own its own copy? | Integration design question. |
| OQ-11 | Notification channel(s) — in-portal only, or also email? | UX and NFR scope. |

## 10. Acceptance Criteria

38 acceptance criteria (`AC-001`–`AC-038`) across FR-01–FR-15, each mapping to exactly one
Functional Requirement above, were originally defined in `02-spec/Feature-Spec.md` §9 and the
full FR ↔ AC ↔ TC ↔ Task mapping in `traceability/Traceability-Matrix.md` (both removed
2026-09-13). Their concrete, currently-authoritative record is the `tests/backend/` test suite
(18 suites / 128 tests, one test per AC-level scenario — its predecessor `implementation/tests/`
was removed 2026-09-13 once this suite was verified an equivalent, passing port) plus the AC
summary retained in
`.ai-context/specs/employee-internal-transfer.spec.md`. This BRD remains the controlled copy
of record for the requirements (FR/NFR/BR) those tests trace to.

---

## Dependencies (context, not requirements)

- **HRIS** — source of truth for employee profile, org placement, and department/location/
  role master data; target of the org-data update.
- **Payroll system**, **ITSM / access-provisioning system**, **Facilities / space-management
  system** — downstream task owners (represented as portal users in the V1 build; see
  ADR-02 in `.ai-context/architecture.md`).
- **Portal identity/SSO and RBAC** — determines actor identity and role claims.
- **Portal notification service** — existing capability this journey plugs into.
