# Project Context — Employee Internal Transfer Digital Journey

## Registration Note
This repo was **not empty** when `/int-project-setup` was run — it already contained a
complete, working submission (`01-discovery/` … `10-gate2/`, `implementation/`,
`traceability/`, `tracker/`). Per the skill's "Existing Project Protection" rule, no existing
code or files were moved, restructured, or overwritten at that time. This file recorded the
technology and architecture facts as they existed in this repository, rather than inventing a
greenfield configuration. **Update 2026-09-13:** the numbered assessment-deliverable folders
(`01-discovery/` through `08-security/`, `10-gate2/`, `traceability/`, `docs/`) were later
removed from this repo at explicit user request, once their content was fully absorbed into
`.ai-context/`. `implementation/` itself (the original Backend-Only build) was removed
separately on the same date, once `src/backend/` was verified as an equivalent port
(128/128 tests GREEN in both, byte-for-byte behavior parity). `tracker/` referenced above was
never actually present in this working copy.

## 1. Project Name & Type
- **Name:** Employee Internal Transfer Digital Journey (package name:
  `employee-transfer-webapp-backend`, per root `package.json`; originally
  `employee-internal-transfer-service` per the now-removed `implementation/package.json`)
- **Type:** **Full Stack** (changed 2026-09-13, per explicit user direction — see
  `.ai-context/specs/employee-transfer-webapp.spec.md`). Originally Backend Only: the former
  `04-plan/Technical-Plan.md` §1 (removed 2026-09-13) scoped the original build to the Transfer
  Orchestration Service API only, with the Portal frontend UI module out of scope. That
  original build (`implementation/`) has since been removed (2026-09-13) — `src/backend/` +
  `src/frontend/` is now the sole build.

## 2. Frontend Technology & Styling
**React + Vite + plain CSS** (user decision, 2026-09-13 — no CSS framework). New as of the Full
Stack rebuild; no frontend existed before. Lives at `src/frontend/`, tested with
**Jest + React Testing Library**, under `tests/frontend/`.

## 3. Backend Technology & Framework
**Node.js + Express** (`^4.19.2`), tested with **Jest** (`^29.7.0`) + **Supertest** (`^7.0.0`).
Source: root `package.json` (ported unchanged from the now-removed `implementation/package.json`
— see `employee-transfer-webapp.plan.md`) — no framework change.

## 4. Database & Data Access / ORM Layer
- **Current build:** in-memory repository (`RepositoryPort` adapter), no real database or ORM.
- **Named future target:** relational, e.g. PostgreSQL (`04-plan/Technical-Plan.md` ADR-05) —
  no ORM has been chosen for that target. **[Open]** — do not assume Prisma/Sequelize/Knex/
  TypeORM until a TL decision is made; the `RepositoryPort` interface is the seam a real
  adapter would implement without touching domain logic (ADR-03).

## 5. Architecture Style
**Modular Monolith (single service), ports & adapters (hexagonal), microservice-ready
seams already defined but not exercised.** Not the generic `src/backend/modules/<name>/`
scaffold this skill would otherwise generate for a brand-new project — see §7 below for why.
Full ADRs: `04-plan/Technical-Plan.md` §7 (ADR-01 through ADR-06).

## 6. Authentication & Security Strategy
**Existing Portal SSO, bearer token.** This service trusts the token's signature/issuer per
the platform's existing session model and reads `{ userId, roles[] }` claims from it — it
does **not** implement its own login/JWT-issuance flow. Role claims: `EMPLOYEE`, `MANAGER`,
`HR`, `PAYROLL`, `IT`, `FACILITIES`. Source: `08-security/Security-Assessment.md` §2.

## 7. Execution Layer Decision
**Superseded 2026-09-13.** `src/backend/` + `tests/backend/` and `src/frontend/` +
`tests/frontend/` were created per `employee-transfer-webapp.plan.md`, at explicit user
direction, as a like-for-like backend port plus new frontend build — verified equivalent to
the original (`implementation/src/` + `implementation/tests/`, 128/128 tests, 96% coverage).
Once verified, `implementation/` was removed from this repo (2026-09-13, explicit user
request) — `src/backend/` + `src/frontend/` is now the only build in this repository.

`docs/` was created at one point (held `BRD-SOURCE-NOTE.md`, the BRD-ingestion provenance
note) and was itself later removed along with the other assessment-deliverable folders.

## 8. Deployment Target
**[Open]** — not stated anywhere in the source deliverables. `04-plan/Technical-Plan.md` §9
lists real infra adapters as explicitly deferred/out of scope for this exercise. Do not assume
Docker/AWS/Vercel/Kubernetes until confirmed.

## 9. Related Documents
- Requirement baseline: `.ai-context/BRD.md`
- Engineering constraints: `.ai-context/constitution.md`
- Registered feature spec: `.ai-context/specs/employee-internal-transfer.spec.md`
- Status board: `.ai-context/status.md`
