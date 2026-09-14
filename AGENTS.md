# INT AI-First Engineering Policy & AGENTS Governance

## Authority

Follow the INT SDD Blueprint V1.0.

The project repository is the primary source of project context.

Do not rely on chat history as the project's permanent source of truth.

---

## Artifact Authority

Use the following hierarchy:

1. constitution.md
2. BRD.md
3. Approved Spec
4. Approved Plan
5. Approved Tasks
6. Test Cases
7. Existing Implementation

Code is generated output.

Do not use implementation code to silently redefine requirements.

---

## Mandatory Lifecycle

BRD
↓
Gate 0 (BRD PR Review)
↓
Spec
↓
Gate 1 (Spec PR Review)
↓
Plan
↓
Architecture Check
↓
Tasks
↓
Test-first RED
↓
Implementation GREEN
↓
Gate 2 (Code PR Review)
↓
Merge
↓
Release

---

## Core Rules

- **Workflow, Skill & Governance Resolution Hierarchy**: `AGENTS.md` in the repository root is the authoritative single source of project governance rules. When executing tasks, running slash commands, or reading project governance (e.g., `/int-project-resume`, `/int-brd-ingestion`, `/int-project-setup`), the AI agent MUST inspect the local project repository root FIRST for `AGENTS.md`, `.agent/workflows/<workflow_name>.md`, `.agent/skills/<skill_name>/SKILL.md`, `.agents/workflows/<workflow_name>.md`, and `.agents/skills/<skill_name>/SKILL.md`. If present in the local repository, the agent MUST load and follow local project workflows, rules, and skills first. Fall back to global workflows (`<global-config-root>/workflows/`) or global skills ONLY if not present in the local project repository.
- **No Spec Generation Without Approved BRD**: No feature spec (`.spec.md`) drafting or generation is permitted until `.ai-context/BRD.md` is explicitly approved via **Gate 0 BRD PR Review**.
- **Gate 0 HALT**: When presenting `.ai-context/BRD.md` for Gate 0 BRD PR Review approval, the agent MUST immediately stop calling tools and end turn. No feature spec generation, planning, task creation, or coding is permitted before human Gate 0 BRD approval.
- **Strict Reviewer Identity & Email-Only Matching**: Authenticated Git email (`git config user.email`) MUST match the assigned reviewer email roster in `.ai-context/project_context.md` / `constitution.md`. User name matching is **NOT required or evaluated** for authorization. If the logged-in Git email does NOT match the assigned reviewer email for Gate 0, Gate 1, or Gate 2, Option 1 (Review Pending Specs) is **STRICTLY BLOCKED AND RESTRICTED**, and any attempt to approve or reject a PR gate MUST be **REJECTED AND BLOCKED IMMEDIATELY**. The agent MUST ALWAYS output a visible markdown notification in the chat response detailing the email mismatch (`Logged-in Git Email` vs `Assigned Reviewer Email`) before presenting developer selection prompts.
- No implementation without an approved Spec.
- Change Request Keyword Classification: The formal Change Request workflow (Spec revision & Gate 1 re-approval) is triggered ONLY when the user prompt explicitly contains the keyword phrase "Change Request" (or "CR"). If the prompt does NOT contain "Change Request", the system processes it as a Development-Related Fix / UI Bug Fix under the current active approved spec without forcing a Spec update or Gate 1 re-approval.
- No implementation before tests exist and are confirmed RED.
- One task per agent execution.
- Prompt by stable artifact ID.
- Preserve existing implementation.
- Do not invent requirements.
- Do not bypass Gate 1.
- Gate 1 HALT: When presenting a Spec for Gate 1 approval, the agent MUST immediately stop calling tools and end turn. No plan, task, or code generation is permitted before human Gate 1 approval.
- Complete all development tasks and confirm tests pass GREEN before requesting Gate 2 approval.
- Gate 2 HALT: When requesting Gate 2 approval, the agent MUST present the code review request and immediately stop calling tools and end turn. No release notes, status board release sync, or next spec transition is permitted before human Gate 2 approval.
- Do not bypass Gate 2.
- Keep architecture.md current.
- Keep status.md current.
- Append-Only Prompt History: .ai-context/prompt_history.md is a mandatory, append-only chronological log. The agent MUST NEVER overwrite existing prompt entries when logging change requests or new prompt executions.
- Do not expose secrets or PII in project artifacts.
- Human owns all merged code.
