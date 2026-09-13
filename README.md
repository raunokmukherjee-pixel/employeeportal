# Employee Internal Transfer Web App

Full Stack web application for the Employee Internal Transfer Digital Journey — an employee
requests a department/location/role transfer, and the app orchestrates manager confirmation,
HR eligibility validation, org-data update, and conditional Payroll/IT/Facilities follow-up,
replacing a fragmented, email-driven manual process.

Built following the INT Specification-Driven Delivery (SDD) methodology. The authoritative
project knowledge base — requirements, architecture, specs, plans, tasks, and status — lives
under [`.ai-context/`](.ai-context), not in this README:

| Document | Purpose |
|---|---|
| [`.ai-context/BRD.md`](.ai-context/BRD.md) | Business requirements baseline (FR/NFR/BR, actors, scope) |
| [`.ai-context/constitution.md`](.ai-context/constitution.md) | Engineering constraints (testing, security, architecture, versioning) |
| [`.ai-context/architecture.md`](.ai-context/architecture.md) | Component architecture, ADRs, module/API/database boundaries |
| [`.ai-context/specs/`](.ai-context/specs) | Feature specs with Gate 1/Gate 2 approval history |
| [`.ai-context/plans/`](.ai-context/plans) | Implementation plans derived from approved specs |
| [`.ai-context/tasks/`](.ai-context/tasks) | Task breakdowns |
| [`.ai-context/test_cases/`](.ai-context/test_cases) | Spec-derived test case specifications |
| [`.ai-context/status.md`](.ai-context/status.md) | Live project status board |

## Project layout

```text
src/backend/    Node.js + Express API (see .ai-context/architecture.md)
tests/backend/  Jest + Supertest, mirrors src/backend/
src/frontend/   React + Vite + plain CSS web UI
tests/frontend/ Jest + React Testing Library, mirrors src/frontend/
```

## Running the backend

```bash
npm install
npm test      # 18 suites, 128 tests
npm start     # http://localhost:3000
```

## Running the frontend

```bash
cd src/frontend
npm install
npm test      # 8 suites, 25 tests
npm run dev   # http://localhost:5173, proxies /api to the backend
```

## History note

This repository originally held a separate technical assessment submission (numbered
`NN-name/` deliverable folders, a standalone `implementation/` build, a `tracker/` spreadsheet,
etc.) authored under that assessment's own format. All of that content was superseded and
removed on 2026-09-13 once it had been fully absorbed into `.ai-context/` and the current
`src/backend/` + `src/frontend/` build, at explicit user request — see
`.ai-context/prompt_history.md` for the full record of that transition.
