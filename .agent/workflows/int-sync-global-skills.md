---


---
name: int-sync-global-skills
description: Synchronize and upgrade local project repository skills, workflows, and rules directly from the master global INT configuration.
---------------------------------------------------------------------------------------------------------------------------------------------

# INT Global Skill & Control Plane Synchronization Workflow

Use this workflow whenever major updates or improvements are made to your global INT skills (`C:\Users\Supratim_Jetty\.gemini\config\skills\`) or global workflows (`C:\Users\Supratim_Jetty\.gemini\config\global_workflows\`) and you want to synchronize those updates into the current project repository's `.agent/` directory.

## Execution Protocol:

1. **Non-Destructive Guarantee**:

   - Do NOT modify or delete `.ai-context/` project business artifacts (`BRD.md`, `project_context.md`, `specs/`, `plans/`, `tasks/`, `status.md`).
   - Do NOT touch application source code (`src/`, `tests/`).
2. **Sync Control Plane Rules & Workflows to `.agent/`**:

   - Copy rules from `C:\Users\Supratim_Jetty\.gemini\config\skills\int-project-setup\resources\INT-Control-Plane\.agent\rules\` to `.agent/rules/`.
   - Copy workflows from `C:\Users\Supratim_Jetty\.gemini\config\global_workflows\` to `.agent/workflows/`.
   - Do NOT create `.agents/` (plural) or root `workflows/` in project root.
3. **Sync Skills (Clean Copy - Exclude Resources)**:

   - For every skill folder present in `C:\Users\Supratim_Jetty\.gemini\config\skills\`:
     - Copy **ONLY `SKILL.md`** (and explicit scripts) into `.agent/skills/<skill-name>/SKILL.md`.
     - **STRICTLY EXCLUDE** any nested `resources/` directory (e.g., `skills/int-project-setup/resources/`).
4. **Clean Legacy Extra Directories**:

   - Remove `.agents` directory if present in project root: `Remove-Item -Recurse -Force ".agents"`
   - Remove root `workflows` directory if present in project root: `Remove-Item -Recurse -Force "workflows"`
   - Remove any pre-existing nested `resources/` directory in local skill folders: `Remove-Item -Recurse -Force ".agent/skills/int-project-setup/resources"`
5. **Log Sync Activity**:

   - Append a sync record entry to `.ai-context/prompt_history.md`.
   - Report summary of synced skills and workflows to the Tech Lead.

---

---
