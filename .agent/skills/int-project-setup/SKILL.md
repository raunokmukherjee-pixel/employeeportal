---
name: int-project-setup
description: Initialize a new software project using the exact INT AI-First standard Control Plane, project-specific AI context, technology-aware execution structure, and foundational repository baseline.
---
# INT AI-First Project Setup

## Purpose

Initialize a new software project according to the INT AI-First development architecture.

This skill is responsible for project initialization and baseline setup only. Do not implement business functionality or create business modules during initial setup unless explicitly requested.

The INT Control Plane is an organizational standard and MUST remain unchanged.

---

# MANDATORY STEP 1 — Technology & Architecture Discovery Gate

Before generating execution layer folders (`src/`, `tests/`) or starting implementation, the agent MUST confirm all foundational technology and architecture parameters.

If any of the following items are ambiguous or not explicitly specified in the prompt or provided BRD, **the agent MUST ask and clarify with the user before proceeding**:

1. **Project Name & Type**: Full Stack, Frontend Only, Backend Only, or Mobile.
2. **Architecture Style (MANDATORY FOR ALL PROJECT TYPES)**: Must explicitly ask user to select architecture pattern:
   - **Backend Only / Full Stack Options**: Monolithic vs Modular Monolith (Microservice Ready) vs Microservices vs Clean Architecture / Layered Architecture.
   - **Frontend Only Options**: Modular Component Architecture vs Feature-Sliced Architecture (FSD) vs Micro-Frontends vs Monolithic SPA.
3. **Frontend Technology & Styling** (if Frontend or Full Stack): (e.g., React / Next.js / Vite + Vanilla CSS or Tailwind).
4. **Backend Technology & Framework** (if Backend or Full Stack): (e.g., Node.js Express / Fastify / NestJS / Python FastAPI / Go).
5. **Database & Data Access / ORM Layer** (if Backend or Full Stack): (e.g., PostgreSQL + Sequelize / MySQL / MongoDB + Prisma / TypeORM / Drizzle / Mongoose).
6. **Authentication & Security Strategy**: (e.g., JWT / OAuth2 / NextAuth / Session / None).
7. **Deployment Target**: (e.g., Docker / AWS / Vercel / Kubernetes / Unknown).
8. **Gate 1 Reviewer(s)**: Assigned Project Manager(s) / Tech Lead(s) responsible for Spec Peer Reviews (can be single or multiple individuals, specified by Name/Email/User ID).
9. **Gate 2 Reviewer(s)**: Assigned Technical Lead(s) / Senior Developer(s) responsible for Code Reviews (can be single or multiple individuals, specified by Name/Email/User ID).

### Mandatory Rules for Discovery:

- **Do NOT skip this discovery gate** or jump directly into project directory structure generation or feature coding.
- **Do NOT omit the Architecture Style question for Backend-Only or Frontend-Only projects**. Architecture style selection is mandatory for every project type without exception.
- **Do NOT invent technology choices or reviewer assignments** without user confirmation or BRD backing.
- Immediately populate **`.ai-context/project_context.md`** and **`.ai-context/architecture.md`** with these confirmed choices and reviewer assignments (`Gate 1 Reviewers` and `Gate 2 Reviewers` list) before creating code structures.

---

# CRITICAL RULE — INT CONTROL PLANE (.agent/ CONTROL DIRECTORY)

The following directory is the authoritative source for the INT Control Plane:
`skills/int-project-setup/resources/INT-Control-Plane/.agent/`

You MUST dynamically copy the contents of this directory into the project root control directory:
`.agent/`

## Dynamic Copying Protocol:

- **Do NOT rely on hardcoded file lists.** The agent MUST dynamically discover and copy ALL files and subdirectories present in `skills/int-project-setup/resources/INT-Control-Plane/.agent/` directly to `.agent/` in the project workspace root.
- **Dynamic Rule Synchronization**: Every rule file (e.g., `.md`, `.agentignore`) present inside `skills/int-project-setup/resources/INT-Control-Plane/.agent/rules/` MUST be dynamically discovered and copied to `.agent/rules/`.
- **Dynamic Workflow Synchronization**: Every workflow file (`.md`) present inside `skills/int-project-setup/resources/INT-Control-Plane/.agent/workflows/` MUST be dynamically discovered and copied to `.agent/workflows/`. Do NOT create a top-level `workflows/` directory or `.agents/` directory in the project workspace root.
- If new rule or workflow files are added to `skills/int-project-setup/resources/INT-Control-Plane/.agent/`, the setup/continuation process MUST dynamically include them automatically under `.agent/rules/` and `.agent/workflows/`.

## Rules for Copying:

- DO NOT recreate these files from memory.
- DO NOT summarize these files.
- DO NOT rewrite these files.
- DO NOT modify these files.
- DO NOT rename these files.
- DO NOT add additional files inside the INT Control Plane unless explicitly requested.

Do NOT create `.agent/README.md` unless explicitly requested.
The copied INT Control Plane files are authoritative and must remain content-equivalent to the approved source files.

---

# MANDATORY PROJECT VENDOR-AGNOSTIC GOVERNANCE & LOCAL SKILLS (`AGENTS.md` & `.agent/skills/`)

To ensure the project repository is completely self-contained and vendor-agnostic (independent of any specific AI tool or provider such as Gemini, Claude, Cursor, Windsurf, or Copilot):

1. **Auto-Generate `AGENTS.md` in Workspace Root**:
   During initial project setup, the agent MUST write **`AGENTS.md`** into the project workspace root. `AGENTS.md` contains the INT AI-First Engineering Policy, authority hierarchy, lifecycle definition, and core governance rules.

2. **Auto-Copy Project-Level Skills into `.agent/skills/`**:
   During project setup, the agent MUST create **`.agent/skills/`** in the project workspace root and dynamically copy all project SDD sub-skills into it.
   
   **CRITICAL EXCLUSION RULE**: The agent MUST copy ONLY the skill folder and its `SKILL.md` (and explicit execution scripts), **STRICTLY EXCLUDING** any nested `resources/` directory (e.g. `skills/int-project-setup/resources/`). This ensures that control plane template directories are NEVER copied into `.agent/skills/`, preventing duplicate workflow and rule indexing in project repositories!

   - `.agent/skills/int-project-setup/SKILL.md`
   - `.agent/skills/int-sdd-lifecycle/SKILL.md`
   - `.agent/skills/int-brd-ingestion/SKILL.md`
   - `.agent/skills/int-incident-management/SKILL.md`
   - `.agent/skills/int-hotfix-management/SKILL.md`
   - `.agent/skills/int-release-management/SKILL.md`
   - `.agent/skills/int-session-continuation/SKILL.md`
   - `.agent/skills/int-sync-global-skills/SKILL.md`

3. **Mandatory Workflow, Skill & Governance Resolution Hierarchy**:
   After project setup is complete, whenever any workflow, skill, slash command, or governance rule is executed in the workspace (e.g., `/int-project-resume`, `/int-brd-ingestion`, `/int-project-setup`, `/int-sync-global-skills`), the AI chat agent MUST enforce the following resolution priority:
   - **Priority 1 (Local Repository First)**: First check if local project workflows (`.agent/workflows/<workflow_name>.md`), `AGENTS.md`, or local project skills (`.agent/skills/<skill_name>/SKILL.md`) exist inside `.agent/` in the project repository root. If present, load and execute the **local project workflows, rules, and skills** first.
   - **Priority 2 (Global Fallback Second)**: If and ONLY if a requested workflow, skill, or rule file is not present locally in `.agent/`, fall back to checking global workflows (`<global-config-root>/global_workflows/`) or global skills (`<global-skills-root>/<skill_name>/SKILL.md`).

This ensures that every team member or AI assistant (Gemini, Claude, Cursor, Windsurf, Copilot, etc.) working on the project prioritizes repository-local workflows and skills directly inside `.agent/` without relying on external or cloud AI configurations.

---

# EXISTING PROJECT RE-INITIALIZATION & NON-DESTRUCTIVE SYNC PROTOCOL

When the user runs `/int-project-setup` on a project that is **already set up**:

1. **Non-Destructive Guarantee**:
   - The system **NEVER** deletes, overwrites, or resets existing project-specific data (`BRD.md`, `project_context.md`, `constitution.md`, `architecture.md`, `status.md`, `prompt_history.md`, specs, plans, tasks, test cases, or PR review records).
   - All source code (`src/`, `tests/`) and legacy project structures remain 100% untouched.

2. **Control Plane & Local Skill Sync from Global Standards**:
   - The system compares the local `.agent/rules/`, `.agent/workflows/`, and `.agents/skills/` with the latest global Control Plane resources and global skills (`<global-skills-root>/`).
   - If global skills or control plane standards contain updated workflows (e.g. `pr-gate-workflow.md`, `int-standards.md`, `int-sdd-lifecycle`), the system **automatically updates and syncs `.agents/skills/` and `.agent/`** so the project repository is upgraded with the latest engineering standards and security fixes!

3. **Missing Template & Directory Restoration**:
   - If any new mandatory templates (e.g. `gate-1-review.template.md`, `gate-2-review.template.md`, `gate-review-dashboard-design.html`) or `.ai-context/` subdirectories are missing, the system non-destructively generates them.

4. **Governance Aspect & Reviewer Roster Validation & Auto-Correction**:
   - The system inspects `.ai-context/project_context.md` and `.ai-context/constitution.md`.
   - If any assigned reviewer email fields (Technical Lead / Architect, Project Manager / Product Owner, Gate 1 Reviewers, Gate 2 Reviewers) are missing, empty, or contain default placeholders (`<email@domain.com>`, `<Name>`), the system prompts the user to input real names and emails and updates `.ai-context/project_context.md` and `.ai-context/constitution.md` automatically!

---

# MANDATORY AUTOMATED `.gitignore` CREATION

During initial project setup, the agent MUST automatically create **`.gitignore`** in the project workspace root with standard exclusion boundaries:

```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment & Secrets
.env
.env.local
.env.*.local
*.pem

# Build & Production Outputs
dist/
build/
coverage/

# OS Files
.DS_Store
Thumbs.db

# Logs & Temporary Files
scratch/
*.log

# CRITICAL: DO NOT IGNORE INT CONTROL PLANE OR KNOWLEDGE BASE
!.agent/
!.ai-context/
!.agents/
!AGENTS.md
```

---

# Project Knowledge Base

Create the project-specific AI context directory structure:

```text
.ai-context/
├── constitution.md
├── project_context.md
├── architecture.md
├── BRD.md
├── brd-change-log.md
├── status.md
├── prompt_history.md
├── specs/
├── plans/
├── tasks/
├── test_cases/
├── pr_reviews/
├── decisions/
├── incidents/
├── hotfixes/
├── releases/
├── change_requests/
└── templates/
    ├── spec.template.md
    ├── plan.template.md
    ├── tasks.template.md
    ├── test_cases.template.md
    ├── gate-1-review.template.md
    ├── gate-2-review.template.md
    ├── adr.template.md
    ├── incident.template.md
    ├── hotfix-spec.template.md
    ├── release.template.md
    ├── change-request.template.md
    └── gate-review-dashboard-design.html
```

All listed files/directories are mandatory.

## MANDATORY AUTOMATED RUNTIME INSTANTIATION PROTOCOL

During initial project setup, the agent MUST automatically generate the `.ai-context/` knowledge base on disk:

1. **Auto-Generate Mandatory Artifact Subdirectories with Seed Files**:
   To ensure empty subdirectories are physically created on disk and tracked by Git, the agent MUST execute file creation for a `.gitkeep` file in each of the 10 mandatory subdirectories during setup:

   - `.ai-context/specs/.gitkeep`
   - `.ai-context/plans/.gitkeep`
   - `.ai-context/tasks/.gitkeep`
   - `.ai-context/test_cases/.gitkeep`
   - `.ai-context/pr_reviews/.gitkeep`
   - `.ai-context/decisions/.gitkeep`
   - `.ai-context/incidents/.gitkeep`
   - `.ai-context/hotfixes/.gitkeep`
   - `.ai-context/releases/.gitkeep`
   - `.ai-context/change_requests/.gitkeep`
2. **Auto-Generate All 12 Template Files (`.ai-context/templates/`)**:
   The agent MUST execute file creation to write all 12 template files into `.ai-context/templates/` using the exact source template contents defined in this skill document:

   - `.ai-context/templates/spec.template.md`
   - `.ai-context/templates/plan.template.md`
   - `.ai-context/templates/tasks.template.md`
   - `.ai-context/templates/test_cases.template.md`
   - `.ai-context/templates/gate-1-review.template.md`
   - `.ai-context/templates/gate-2-review.template.md`
   - `.ai-context/templates/adr.template.md`
   - `.ai-context/templates/incident.template.md`
   - `.ai-context/templates/hotfix-spec.template.md`
   - `.ai-context/templates/release.template.md`
   - `.ai-context/templates/change-request.template.md`
   - `.ai-context/templates/gate-review-dashboard-design.html`
3. **Auto-Generate Base Context Files**:
   Initialize `.ai-context/constitution.md`, `.ai-context/project_context.md`, `.ai-context/architecture.md`, `.ai-context/BRD.md`, `.ai-context/brd-change-log.md`, `.ai-context/status.md`, and `.ai-context/prompt_history.md`.

## Purpose of AI Context

The `.ai-context` directory contains project-specific knowledge, development artifacts, and standard engineering templates.
It MUST NOT contain generic INT standards that belong to the `.agent` Control Plane.

## CRITICAL RULE — FLAT FILE STRUCTURE (NO SUBDIRECTORIES)

All artifacts created inside `.ai-context/` subdirectories MUST be created directly as **flat files** using standard naming conventions:

- Specs: `.ai-context/specs/<feature-slug>.spec.md` (e.g. `dynamic-request-management.spec.md`)
- Plans: `.ai-context/plans/<feature-slug>.plan.md` (e.g. `dynamic-request-management.plan.md`)
- Tasks: `.ai-context/tasks/<feature-slug>.tasks.md` (e.g. `dynamic-request-management.tasks.md`)
- Test Cases: `.ai-context/test_cases/<feature-slug>.test_cases.md` (e.g. `dynamic-request-management.test_cases.md`)
- Decisions: `.ai-context/decisions/ADR-NNN.md` (e.g. `ADR-001.md`)
- Incidents: `.ai-context/incidents/INC-YYYY-NNN.md` (e.g. `INC-2026-001.md`)
- Hotfixes: `.ai-context/hotfixes/HOTFIX-<slug>.md` (e.g. `HOTFIX-memory-leak.md`)
- Releases: `.ai-context/releases/RELEASE-vX.Y.Z.md` (e.g. `RELEASE-v1.2.0.md`)
- Change Requests: `.ai-context/change_requests/CR-<YYYYMMDD>-<slug>.md` (e.g. `CR-20260830-employee-portal-redesign.md`) instantiated from `change-request.template.md` (plus optional archived attachments like `CR-<YYYYMMDD>-<slug>-screenshot.png`)

**PROHIBITED**: DO NOT create subdirectories named after feature slugs inside `specs/`, `plans/`, `tasks/`, or `test_cases/` (e.g. NEVER create `.ai-context/specs/dynamic-request-management/spec.md` or `.ai-context/plans/dynamic-request-management/plan.md`). All artifact files MUST sit directly at the root of their respective category folder.

## CRITICAL RULE — PORTABLE REPOSITORY-RELATIVE PATHS (NO ABSOLUTE PATHS)

All file references, cross-links, document paths, and code references recorded inside repository artifacts (`.ai-context/`, `status.md`, specs, plans, tasks, ADRs, releases, test cases) MUST be **relative to the repository root**:

- **CORRECT**: `.ai-context/specs/dynamic-request-management.spec.md`
- **CORRECT**: `src/backend/controllers/requestController.ts`
- **CORRECT**: `tests/backend/requestController.test.ts`
- **PROHIBITED**: Never write absolute local file system paths containing local user directories (e.g. `C:\Users\Username\...`, `c:/Users/...`, `file:///C:/Users/...`, `/home/user/...`).

**Git Portability Mandatory**: Absolute local OS paths break when committed to Git because other collaborators and CI/CD pipelines operate under different root directories. All written path references MUST be relative to the project workspace root.

---

# Mandatory Automated Template Creation (`.ai-context/templates/`)

During initial project setup, all template files under `.ai-context/templates/` MUST be automatically created. Every generated project artifact in `.ai-context/` is derived directly from its corresponding template:

## Template-to-Artifact Mapping Table

| Template File (`.ai-context/templates/`) | Target Artifact Location                                    | Workflow / Skill                           |
| ------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------ |
| `spec.template.md`                       | `.ai-context/specs/<feature-slug>.spec.md`                | `int-sdd-lifecycle`                      |
| `plan.template.md`                       | `.ai-context/plans/<feature-slug>.plan.md`                | `int-sdd-lifecycle`                      |
| `tasks.template.md`                      | `.ai-context/tasks/<feature-slug>.tasks.md`               | `int-sdd-lifecycle`                      |
| `test_cases.template.md`                 | `.ai-context/test_cases/<feature-slug>.test_cases.md`     | `int-sdd-lifecycle`                      |
| `gate-1-review.template.md`              | PR Gate 1 Review Record in Dashboard & Spec                | `int-sdd-lifecycle`                      |
| `gate-2-review.template.md`              | PR Gate 2 Review Record in Dashboard & Spec                | `int-sdd-lifecycle`                      |
| `adr.template.md`                        | `.ai-context/decisions/ADR-NNN.md`                        | `int-incident-management` / Architecture |
| `incident.template.md`                   | `.ai-context/incidents/INC-YYYY-NNN.md`                   | `int-incident-management`                |
| `hotfix-spec.template.md`                | `.ai-context/specs/hotfix-<slug>.spec.md`                 | `int-hotfix-management`                  |
| `release.template.md`                    | `.ai-context/releases/RELEASE-vX.Y.Z.md`                  | `int-release-management`                 |
| `change-request.template.md`             | `.ai-context/change_requests/CR-<YYYYMMDD>-<slug>.md`     | `int-sdd-lifecycle`                      |
| `gate-review-dashboard-design.html`      | `.ai-context/templates/gate-review-dashboard-design.html` | Gate Review Visualizer                     |

---

### 1. `spec.template.md`

```markdown
# Spec: <Feature Name>

## Spec ID
<feature-slug>

## Status
Draft | In Peer Review | Changes Requested | Approved | Plan Drafted | Plan Reviewed | Tasks Generated | Under Development | In QA | Ready for Release | Released (vX.Y.Z)

## Roles & Assignments
- **Developer:** <Developer Name / Email>
- **Gate 1 Reviewer(s):** <Assigned Reviewer Name(s) / Email(s) / User ID(s)> (Single or Multiple)
- **Gate 2 Reviewer(s):** <Assigned Reviewer Name(s) / Email(s) / User ID(s)> (Single or Multiple)

## Linked BRD
.ai-context/BRD.md#BRD-NNN

## Gate Approvals & History
| Gate | Approver Name | Approver Email/ID | Date/Time | Outcome | Approval Comment / Summary |
|---|---|---|---|---|---|
| Gate 1 (Spec Review) | <Approver Name> | <Email/ID> | YYYY-MM-DD HH:MM:SS | Approved | "<Gate 1 review summary / link to dashboard>" |
| Gate 2 (Code Review) | <Approver Name> | <Email/ID> | YYYY-MM-DD HH:MM:SS | Approved | "<Gate 2 review summary / link to dashboard>" |

## Intent
<One paragraph: what changes, for whom, under what condition>

## Context
- Builds on: .ai-context/architecture.md (<section>)
- Related: .ai-context/specs/<related-spec>.spec.md
- API contract: <link if external>

## API Contract (Mandatory if API surface exists)
### <slug>.API01 — <METHOD> <path>
**Request payload:**
```json
{ "field": "type" }
```

**Success response (`<code>`):**

```json
{ "field": "type" }
```

**Exceptions:**

| Code | Condition       | Response body |
| ---- | --------------- | ------------- |
| 4xx  | `<condition>` | `<shape>`   |

## Acceptance Criteria

1. `<slug>`.AC1 — Given `<state>`, when `<action>`, then `<outcome>`.
2. `<slug>`.AC2 — Given `<state>`, when `<action>`, then `<outcome>`.

## Unit Test Cases (spec-derived)

| Test ID         | Maps to AC | Scenario       | Expected       |
| --------------- | ---------- | -------------- | -------------- |
| `<slug>`.UT01 | AC1        | `<scenario>` | `<expected>` |

## Explicitly Out of Scope

- <item>

## Non-Functional Constraints (from constitution.md)

- <latency / throughput / compliance constraint>

```

### 2. `plan.template.md`
```markdown
# Plan: <Feature Name>

## Derived From
.ai-context/specs/<feature-slug>.spec.md

## Architecture Approach
<components touched, new vs existing, integration points>

## Data Model
<schema changes, migrations, if any>

## Constitution Check
- [ ] No new datastore introduced without ADR
- [ ] Testing discipline matches constitution.md
- [ ] Security posture matches constitution.md

## Explicitly Deferred
- <item with reason>

## Sequencing
1. <high-level build order>
```

### 3. `tasks.template.md`

```markdown
# Tasks: <Feature Name>

## Derived From
.ai-context/plans/<feature-slug>.plan.md

## Sequence
- [ ] <slug>.T01 — <independently verifiable work> — Acceptance: <AC ID(s)>
- [ ] <slug>.T02 — <independently verifiable work> — Acceptance: <AC ID(s)>
```

### 4. `test_cases.template.md`

```markdown
# Test Cases: <Feature Name>

## Derived From Spec
.ai-context/specs/<feature-slug>.spec.md

## Acceptance Test Scenarios
### <slug>.TC01 — <Title>
- **Maps to AC:** <slug>.AC1
- **Given:** <initial state>
- **When:** <action / trigger>
- **Then:** <expected outcome>
- **Automated Test File:** tests/frontend/<path> or tests/backend/<path>

### <slug>.TC02 — <Title>
- **Maps to AC:** <slug>.AC2
- **Given:** <initial state>
- **When:** <action / trigger>
- **Then:** <expected outcome>
- **Automated Test File:** tests/frontend/<path> or tests/backend/<path>
```

### 5. `gate-1-review.template.md`

```markdown
# Gate 1 PR Review: <Spec ID> — <Spec Name>

## Review Metadata
- **Project Name:** <Project Name>
- **Spec ID:** <feature-slug>
- **Spec Name:** <Spec Name>
- **Developer:** <Developer Name / Email>
- **Assigned Reviewer:** <Assigned Reviewer Name>
- **Reviewer Name:** <Reviewer Name>
- **Reviewer Email/User ID:** <Reviewer Email or User ID>
- **Review Status:** Approved | Rejected | Changes Requested
- **Review Date/Time:** YYYY-MM-DD HH:MM:SS

## Review Criteria Evaluation
1. **Requirement Completeness:** Passed | Needs Improvement | Failed
2. **Requirement Understanding:** Passed | Needs Improvement | Failed
3. **Functional Scope:** Passed | Needs Improvement | Failed
4. **Technical Approach/Design:** Passed | Needs Improvement | Failed
5. **Business Rules:** Passed | Needs Improvement | Failed
6. **Validations:** Passed | Needs Improvement | Failed
7. **Dependencies:** Passed | Needs Improvement | Failed
8. **Assumptions:** Passed | Needs Improvement | Failed
9. **Edge Cases:** Passed | Needs Improvement | Failed
10. **Acceptance Criteria:** Passed | Needs Improvement | Failed
11. **Development Readiness:** Ready | Not Ready

## Review Summary & Feedback
- **Review Description:** <High-level summary of review findings and scope assessment>
- **Review Comments:** <Detailed line-item feedback, requested changes, or approval notes>
```

### 6. `gate-2-review.template.md`

```markdown
# Gate 2 PR Review: <Spec ID> — <Spec Name>

## Review Metadata
- **Project Name:** <Project Name>
- **Spec ID:** <feature-slug>
- **Spec Name:** <Spec Name>
- **Developer:** <Developer Name / Email>
- **Assigned Reviewer:** <Assigned Reviewer Name>
- **Reviewer Name:** <Reviewer Name>
- **Reviewer Email/User ID:** <Reviewer Email or User ID>
- **Review Status:** Approved | Rejected | Changes Requested
- **Review Date/Time:** YYYY-MM-DD HH:MM:SS

## Review Criteria Evaluation
1. **Implementation Against Approved Spec:** Passed | Needs Improvement | Failed
2. **Functional Correctness:** Passed | Needs Improvement | Failed
3. **Code Quality:** Passed | Needs Improvement | Failed
4. **Coding Standards:** Passed | Needs Improvement | Failed
5. **Error Handling:** Passed | Needs Improvement | Failed
6. **Validation:** Passed | Needs Improvement | Failed
7. **Security Considerations:** Passed | Needs Improvement | Failed
8. **Test Coverage:** Passed | Needs Improvement | Failed
9. **Edge Cases:** Passed | Needs Improvement | Failed
10. **Acceptance Criteria Compliance:** Passed | Needs Improvement | Failed
11. **Regression Impact:** None | Low | High

## Review Summary & Feedback
- **Review Description:** <High-level summary of code review findings, test suite verification, and quality sign-off>
- **Review Comments:** <Detailed code comments, refactoring notes, or approval sign-off notes>
```

### 7. `adr.template.md`

```markdown
# ADR-<NNN>: <Title>

## Status
Proposed | Approved | Deprecated | Superseded

## Date
YYYY-MM-DD

## Context
<Context, drivers, incident trigger, or architectural problem statement>

## Decision
<Clear statement of the architectural decision made>

## Consequences
- **Positive:** <benefits>
- **Negative / Risks:** <trade-offs / risks>

## Compliance & Constitution Impact
- Updates `architecture.md` section: <section>
- Updates `constitution.md` constraint: <constraint, if applicable>
```

### 6. `incident.template.md`

```markdown
# Incident: INC-YYYY-NNN — <Title>

## Incident Metadata
- **Incident ID:** INC-YYYY-NNN
- **Reporter / Source:** <Source>
- **Environment:** <Production | Staging | etc.>
- **Impact / Severity:** <Sev-1 | Sev-2 | Sev-3>
- **Reported Date:** YYYY-MM-DD
- **Status:** Open | Triaged | Fix In Progress | Verifying | Closed

## Description & Evidence
<Description of the failure>
### Log Evidence / Stack Trace:
```text
<logs / trace>
```

## Classification & Routing

- [ ] **Spec Gap** → Route to: `.ai-context/specs/<feature-slug>.spec.md` (Update Spec & Plan)
- [ ] **Implementation Defect** → Route to: `.ai-context/specs/hotfix-<incident-slug>.spec.md`
- [ ] **New Requirement** → Route to: `.ai-context/BRD.md` (BRD ingestion workflow)

## Root Cause Analysis

<Detailed root cause>

## Resolution & Post-Mortem Sign-Off

- **Hotfix / Spec Link:** `.ai-context/specs/hotfix-<incident-slug>.spec.md`
- **Resolution Date:** YYYY-MM-DD
- **ADR Triggered:** Yes / No (Link: `.ai-context/decisions/ADR-NNN.md`)

```

### 7. `hotfix-spec.template.md`
```markdown
# Hotfix Spec: <Incident Name>

## Incident ID
INC-YYYY-NNN

## Hotfix ID
HOTFIX-<incident-slug>

## Status
Draft | Approved | Implemented | Verified (Gate 2 Post-Hoc)

## Incident Summary
<Brief description of the production failure>

## Root Cause
<Diagnostic root cause>

## Correct Behaviour
<Desired operational outcome>

## Acceptance Criteria
1. <slug>.AC1 — Given <state>, when <action>, then <outcome>.

## Related Original Spec
.ai-context/specs/<feature-slug>.spec.md

## Fix Summary
<Technical fix approach>

## Gate Approvals & Post-Hoc History
| Gate | Approver | Date | Outcome | Approval Comment |
|---|---|---|---|---|
| Post-Hoc Gate 2 Review | <Approver Name> | YYYY-MM-DD | Approved | "<Post-hoc review approval comment>" |
```

### 6. `release.template.md`

```markdown
# Release vX.Y.Z

## Release Date
YYYY-MM-DD

## Target Version
vX.Y.Z

## Included Features & Specs
| Spec ID | Feature Title | Spec Link | Status |
|---|---|---|---|
| <feature-slug> | <Title> | .ai-context/specs/<feature-slug>.spec.md | Released (vX.Y.Z) |

## High-Level Summary
<Summary of major capabilities and changes in this release, derived from Spec Intents>

## Change Log (Spec-Derived)
### Features
- **<feature-slug>**: <Intent summary from Spec>

### Bug Fixes / Hotfixes
- **HOTFIX-<slug>**: <Hotfix summary>

## Gate 2 & Verification Sign-Off
- [ ] All feature unit and integration tests GREEN
- [ ] Gate 2 code reviews passed for all included specs
- [ ] No open Sev-1/Sev-2 blocking incidents
```

### 7. `change-request.template.md`

```markdown
# Change Request: CR-<YYYYMMDD>-<slug>

## Change Request ID
CR-<YYYYMMDD>-<slug>

## Date
YYYY-MM-DD

## Source
<Client Prompt / User Feedback / Screen Screenshot>

## Status
Draft | In Peer Review (Gate 1) | Approved | Implemented

## Description
<Detailed explanation of the requested change, UI updates, layout changes, or workflow modifications>

## Linked Assets
- **Archived Asset**: .ai-context/change_requests/CR-<YYYYMMDD>-<slug>-<filename>
- **Prompt History**: .ai-context/prompt_history.md

## Affected Spec IDs & Impact Analysis
| Spec ID | Impact Scope | Affected Files / Components | Description of Required Change |
|---|---|---|---|
| <feature-slug> | <Frontend / Backend / Full Stack> | <src/...> | <Description of change> |

## Multi-Spec Impact Matrix
- **<feature-slug-1>**: <Summary of AC revisions / new criteria>
- **<feature-slug-2>**: <Summary of AC revisions / new criteria>

## Proposed Spec Modifications
### Revised Acceptance Criteria:
1. <feature-slug>.AC_REV1 — Given <state>, when <action>, then <outcome>.

## Gate Approvals & History
| Gate | Approver | Date | Outcome | Approval Comment |
|---|---|---|---|---|
| Gate 1 (Spec Review) | <Approver Name> | YYYY-MM-DD | Approved | "<User/Reviewer approval comment provided during review>" |
| Gate 2 (Code Review) | <Approver Name> | YYYY-MM-DD | Approved | "<User/Reviewer approval comment provided during code review>" |
```

### 8. `gate-review-dashboard-design.html`

HTML/CSS design dashboard template for visualizing Gate 1 and Gate 2 status, active specs, approval comments, and compliance checks.

---

## `constitution.md` Generation Rules & Structure

When generating `.ai-context/constitution.md`, the file MUST adhere to the following mandatory structure:

```markdown
# Project Constitution

## Testing Discipline
<BRD content>

## Security Posture
<BRD content>

## Architectural Constraints
<BRD content>

## Non-Functional Baselines
<BRD content>

## Versioning Rules
<BRD content>
```

### Constitution Generation Guidelines

If the supplied BRD contains a Constitution, Engineering Constitution, Technical Constitution, or equivalent project-specific governance section:

1. Treat the BRD-provided Constitution as the authoritative project-specific Constitution.
2. Preserve all project-specific constraints.
3. Do not replace BRD Constitution rules with generic INT rules.
4. Do not remove, simplify, summarize, or reinterpret measurable constraints.
5. Preserve:
   - Testing requirements
   - Security requirements
   - Architectural constraints
   - Technology constraints
   - Data constraints
   - Non-functional requirements
   - Availability requirements
   - Performance requirements
   - Recovery requirements
   - Versioning requirements
   - Compliance requirements
6. Generate `.ai-context/constitution.md` from the Constitution contained in the BRD.
7. Organization-wide INT SDD rules may be referenced as governing engineering-process rules, but MUST NOT overwrite project-specific Constitution requirements.
8. If a BRD Constitution conflicts with an organization-level rule, do not silently resolve the conflict. Flag the conflict for human review.
9. Do not invent technologies, infrastructure, authentication mechanisms, databases, frameworks, or architectural constraints that are not supported by the BRD or explicitly provided project configuration.
10. Preserve the terminology and intent of the BRD Constitution.

## `test_cases/` Directory Rule

`.ai-context/test_cases/` contains test-case specifications, scenarios, acceptance-oriented test definitions, and related test planning artifacts. It is NOT the location for executable automated test code.

Executable automated tests belong under:

- `tests/frontend/`
- `tests/backend/` (for Full Stack projects)

---

## `prompt_history.md` Generation & Append-Only Protocol

`.ai-context/prompt_history.md` stores a complete chronological audit log of all user prompts, change requests, and AI execution turns.

### CRITICAL RULE — STRICT APPEND-ONLY MUTATION

- `.ai-context/prompt_history.md` is a **mandatory, append-only chronological log**.
- The agent MUST NEVER use full-file overwrite to erase or replace existing content in `prompt_history.md`.
- Whenever logging a new user prompt, change request, feature execution, or session restart, the agent MUST read existing content first, and **APPEND** the new entry to the bottom of the file below all previous entries.

---

# Execution Layer Setup

The execution layer MUST be created according to the selected project type and technology stack.

## Full Stack Project

If the project type is Full Stack, the following directories are mandatory:

```text
src/
├── frontend/
│   ├── app/
│   ├── modules/
│   └── shared/
└── backend/
    ├── app/
    ├── config/
    ├── modules/
    └── shared/
tests/
├── frontend/
│   ├── modules/
│   └── shared/
└── backend/
    ├── config/
    ├── modules/
    └── shared/
docs/
```

Both frontend and backend directories MUST exist for a Full Stack project, and `tests/` subdirectories MUST mirror the `modules/`, `config/`, and `shared/` hierarchy of `src/`.

## Frontend Only Project

If the project type is Frontend Only:

```text
src/
└── frontend/
tests/
└── frontend/
docs/
```

## Backend Only Project

If the project type is Backend Only:

```text
src/
└── backend/
tests/
└── backend/
docs/
```

## Mobile Project

If the project type is Mobile:

```text
src/
└── mobile/
tests/
└── mobile/
docs/
```

---

# Application Architecture Baseline

## Default Architecture

For Full Stack applications, the default architecture is:
**Modular Monolith + Microservice Ready**

This means:

- Local development should normally run as a modular monolith.
- Business modules must have clear boundaries.
- Modules should minimize direct coupling with other modules.
- Shared functionality must be isolated in shared/infrastructure areas.
- Business modules should be structured so that an individual module can be extracted into an independent service in the future.
- Do not introduce microservice deployment complexity unless the project explicitly requires it.

## Generic Backend Structure (Template Baseline)

After architecture approval, a Full Stack Node.js backend may use:

```text
src/backend/
├── app/
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   └── server.js
├── modules/
└── shared/
    ├── database/
    ├── logger/
    ├── errors/
    └── utils/
```

## Generic Frontend Structure (Template Baseline)

After architecture approval, a React frontend may use:

```text
src/frontend/
├── app/
│   ├── routes/
│   ├── providers/
│   └── store/
├── modules/
└── shared/
    ├── components/
    ├── hooks/
    ├── services/
    └── utils/
```

---

# Required Project Information Collection & Governance Validation Protocol

Before creating or syncing the project structure, collect and validate all required project technology and governance information. When running `/int-project-setup` on a new OR existing project, the system MUST inspect `.ai-context/project_context.md` and `.ai-context/constitution.md` to verify that all necessary aspects and assigned reviewer rosters are populated with real names and emails.

Do NOT infer, invent, or leave default placeholders (`<Name>`, `<email@domain.com>`, `<Technical Lead Name>`, `<Project Manager Name>`). If any information is missing or contains placeholders, prompt the developer to provide it:

1. Project name
2. Project type (Full Stack, Frontend Only, Backend Only, Mobile)
3. Frontend technology
4. Backend technology
5. Database
6. ORM / Data Access Technology
7. Authentication mechanism
8. Deployment target, if known
9. Architecture style (Default: Modular Monolith + Microservice Ready)
10. **Governance Aspect & Reviewer Roster Validation (MANDATORY)**:
    - **Technical Lead / Architect (Gate 2 Reviewer)**: Name & Email
    - **Project Manager / Product Owner (Gate 1 Reviewer)**: Name & Email
    - **Senior Software Engineer / Spec Author**: Name & Email
    - **Git Developer Email Alignment (`git config user.email`)**: Confirm developer's authenticated email matches their designated role or assigned reviewer/author roster.

Populate and update `.ai-context/project_context.md`, `.ai-context/constitution.md`, and `.ai-context/architecture.md` immediately with these validated parameters.

---

# Existing Project Protection

Before creating files:

1. Inspect the workspace.
2. Determine whether it is empty or already contains application code.
3. Never overwrite existing files without explicit approval.
4. If an existing `.agent` directory is present, compare it before modifying it.
5. Preserve existing project code and configurations.
6. Report conflicts before modifying existing files.

---

# Related INT Workflow Skills

Once initial project setup is complete, use the dedicated INT workflow skills for ongoing lifecycle tasks:

- **BRD Ingestion & Module Structure**: See `int-brd-ingestion`
- **Feature Development & SDD Lifecycle**: See `int-sdd-lifecycle`
- **Production Incident Management**: See `int-incident-management`
- **Hotfix Management**: See `int-hotfix-management`
- **Release Management**: See `int-release-management`
- **Session Continuation**: See `int-session-continuation`

---

# Final Response Checklist

After successful initialization, report:

1. Project information collected.
2. Architecture style selected.
3. INT Control Plane status (`.agent`).
4. AI context status (`.ai-context`).
5. Execution layer status (`src`, `tests`, `docs`).
6. Whether a BRD was provided.
7. Complete project directory structure created.
