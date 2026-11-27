---
name: lilliput
description: "Use when solving a problem: first consider whether a specialist role already exists. Stateless multi-role orchestration over a Soul Tree, with disposable subagents, task families and declarative team workflows, so the Main agent directs instead of searching by hand."
license: MIT
---

# Lilliput — Stateless Multi-Agent Orchestration Protocol

## When to load

Load this skill **before** doing the work yourself, whenever the task is not a single known-scope lookup — in particular investigation, evidence gathering (logs, DB, cross-service correlation), anything spanning several steps, or anything where you would otherwise start searching paths, files or systems by trial and error.

Once loaded, check `souls/index.md` first:

- If a role already owns that domain, open a task family and dispatch it. **Do not re-derive by hand what a role's reference docs already state.**
- If no role fits, use the Assembly / Recruitment path (human approval required).
- Doing the work yourself is the fallback, not the default — and when you take it, be able to say why no specialist applied.

This is a preference, not an absolute rule: a one-step, known-scope lookup may be cheaper to do directly than to dispatch. The test is whether the work needs **domain evidence or multi-step trial**, not whether certain words appeared in the request.

## Path Contract (read first)

This skill separates **spec (this file)** from **data (organization & tasks)**. Locations come from `config.json`, independent of the working directory.

- **Skill package**: this file's directory, provided by the harness at load time. This file hardcodes no paths.
- **Organization home `home`**: from `config.json`'s `home`; default `%USERPROFILE%\.lilliput` on Windows, `$HOME/.lilliput` on POSIX. `config.json` is local and must not be committed; only `config.example.json` is tracked.
- **Platform**: the protocol is OS-neutral. Every path is an **OS-native absolute path**; examples use `/` for brevity — substitute your platform's separator. Nothing assumes a drive letter or a particular shell.

```text
<home>/
├─ souls/
│   ├─ index.md
│   ├─ docs/        _branch.md   sub_doc.md
│   ├─ engineering/ _branch.md   sub_code.md   sub_test.md
│   └─ audit/       _branch.md   sub_audit.md
├─ teams/           index.md   <team_id>.md            (workflow templates)
├─ workspaces/
│   ├─ _teams/<team_id>/   active/   archive/          (team task family home)
│   └─ <soul_id>/          active/   archive/  scratch/
└─ _legacy/          (retired assets, out of scope)
```

### Task Family Home

A task family (main file + sub-files + artifacts) lives in exactly one place, routed by `team_id`:

| `team_id` | Task family home |
|---|---|
| not `-` (team task) | `<home>/workspaces/_teams/<team_id>/` |
| `-` (personal task) | `<home>/workspaces/<soul_id>/` |

- Both contain `active/` and `archive/`.
- **Team tasks never write into any member's personal folder**; `origin_soul` records who opened the task, not where files land.
- Personal scratch (one-off scripts, intermediates) goes to `<home>/workspaces/<soul_id>/scratch/`; it is not archived. Evidence to keep never goes here — it is saved as an **independent artifact** in the task family home, named `<main_filename>.<NNN>.<name>.<ext>`.

### Config

```jsonc
// Windows
{ "home": "%USERPROFILE%\\.lilliput" }
// POSIX
{ "home": "$HOME/.lilliput" }
```

- **Hop limit is derived, not configured.** A team task's chain length is exactly its team's `members.Count`; a personal task is a single hop. The circuit breaker (Phase 4) uses that derived value — so adding or removing team members never requires editing config.
- `home` accepts env syntax (`%USERPROFILE%` / `$HOME`) and must be resolved to an absolute path before use.

### Hard Rules

1. All dispatch, reads, and archiving use absolute paths.
2. Never use `@<path>` mention syntax (not guaranteed headless); write absolute paths explicitly and require the subagent to `read` them.
3. If `config.json`'s `home` does not exist on disk (new machine / user / drive), stop and report to the human; do not guess or rewrite paths.
4. Task family location is always determined by `team_id` (see Task Family Home).

---

## Phase 0: Bootstrap

On first load, or if `<home>/souls/index.md`, `<home>/workspaces/`, or `<home>/teams/` is missing, do not ask the human — run this one-time setup:

1. **Create `config.json`** by state:
   - **A — file missing**: first setup. Create with `home` resolved to an absolute path (`%USERPROFILE%\.lilliput` or `$HOME/.lilliput`). Continue with steps 2–5.
   - **B — file exists but `home` is missing on disk**: machine / user / drive change. Apply Hard Rule 3: stop and report; do not guess or rewrite; do not treat as A.
   - **C — file exists and `home` exists**: reuse as-is.

   Check "file exists" first; only then check "`home` exists".
2. **Create the standard tree** under `<home>`, per the diagram above: `souls/{docs,engineering,audit}/`, `workspaces/<soul_id>/{active,archive,scratch}/` for each of the four standard positions, `workspaces/_teams/`, and `teams/`.
3. **Soul Tree index**: `souls/index.md` (top-level departments only) and one `_branch.md` per department.
4. **Four standard souls**: `sub_doc`, `sub_code`, `sub_test`, `sub_audit`. Front matter uses resolved absolute paths (`<home>` shown as a placeholder):

   ```yaml
   ---
   soul_id: sub_code
   department: engineering
   workspace_dir: <home>/workspaces/sub_code/active
   archive_dir:   <home>/workspaces/sub_code/archive
   scratch_dir:   <home>/workspaces/sub_code/scratch
   reference_docs:
     - <home>/souls/index.md
     - <home>/souls/engineering/_branch.md
   ---
   ```

   The body must contain **Scope & Boundaries** and **SOP**. The SOP must state that sub-files go to the **task family home** (see Task Family Home) — same directory as the main file — regardless of `scratch_dir`.
5. **Two standard teams**: `teams/index.md` plus `dev-flow.md` and `doc-only.md`.

---

## Phase 0-2: Resume

On every load (after Bootstrap), scan for unarchived tasks so a new Main can continue after an interruption. **Authoritative task state lives in files, not conversation context.**

1. Enumerate main files (`<YYYYMMDD>_<slug>.md`; exclude `.NNN.md` and artifacts) in both `workspaces/*/active/` and `workspaces/_teams/*/active/`.
2. Read each main file's front matter (`task_id` / `team_id` / `status` / `hop_count` / `assigned_soul` / `updated_at`) and the latest sub-file.
3. Determine the interruption point via the expected next sub-file `<main_filename>.<hop_count+1, 3 digits>.md`:
   - **exists** → the last hop finished but was not verified: go to Phase 4.
   - **missing** → the last hop was interrupted: re-dispatch to `assigned_soul` (team task: `members[hop_count]`) via Phase 3.
   - `status: done/failed` still in `active/` → missed archive: notify the human, then archive.
4. Report a task board to the human: `task_id` / `status` / `hop_count` / `assigned_soul` / `updated_at` / one-line summary.
5. Wait for the human: resume / abandon (`status: failed` then archive) / archive.

---

## Phase 0-3: Team Selection & Assembly

A team is an **ordered `soul_id` list** plus a "when to use" line — no back-edges, no state machine (unidirectional relay).

### Team file (`teams/<team_id>.md`)

```yaml
---
team_id: dev-flow
name: Feature Development Flow
when_to_use: Tasks that add or change code (feature work or bug fixes)
members:                 # ordered = workflow; all run
  - sub_doc
  - sub_test
  - sub_code
  - sub_audit
---

# Workflow

1. sub_doc: open the task board
2. sub_test: write tests first
3. sub_code: implement
4. sub_audit: audit

> If sub_audit finds issues, it must not roll back: report to Main; the human opens a new round (new task family).
```

`teams/index.md` lists `team_id` / `name` / `when_to_use`.

### Selection (Main, before each task)

1. Read `teams/index.md`; match the request against `when_to_use`.
2. Report and confirm: "Using `<team_id>` (sequence: `a → b → c`)"; the user may override.
3. **Simple-task check** (only before the human confirms the team): if the task is single-step, low-complexity, and doable by one soul, suggest simplifying to a personal task (`team_id: -`). Once the human keeps the team, do not question it again.
4. No matching team → Assembly procedure; do not fabricate a workflow.
5. Write `team_id` into the main file; the dispatch sequence equals `members`.

### Assembly

When no team fits, propose a Team Proposal: suggested `team_id` and name, `when_to_use`, and `members` (ordered, with a one-line description per hop). Pause for **human approval**; only then create the team file and update the index. If any member does not exist in the Soul Tree, run the Recruitment procedure (Phase 1) first.

---

## Section 1: Task Family & Sub-Files

Task-chain context is a **task family** (a group of files), not one bloated file:

```text
<task family home>/active/
├─ 20261113_fibonacci.md                  main: identity & state (single source of truth)
├─ 20261113_fibonacci.001.md              hop 1 output
├─ 20261113_fibonacci.002.md              hop 2 output
├─ 20261113_fibonacci.003.audit-log.txt   independent artifact (kept; archived with the family)
└─ …
```

- Main file: `<YYYYMMDD>_<slug>.md`
- Sub-file: `<YYYYMMDD>_<slug>.<NNN>.md` (`NNN` = 3 digits; lexicographic = chronological)
- Artifact: `<YYYYMMDD>_<slug>.<NNN>.<name>.<ext>`, same directory, archived with the family
- `slug`: lowercase letters, digits, hyphens (e.g. `rfid-mapping-fix`)

Sub-files are written to the **task family home** (same directory as the main file), never to a soul's own `workspaces/<soul_id>/` or `scratch/`.

**Main file front matter (only Main writes):**

```yaml
---
task_id: 20261113_fibonacci
team_id: dev-flow        # "-" = personal task (also determines the task family home)
origin_soul: sub_code    # who opened the task (not the landing location for team tasks)
assigned_soul: sub_code
status: pending          # pending | running | handoff | done | failed
hop_count: 0
updated_at: 2026-11-13T10:00+08:00
target_dir: <absolute output dir, or ->
segments: []
---
```

**Sub-file format (written by that hop's subagent; immutable afterward):**

````markdown
---
hop: 2
task_id: 20261113_fibonacci
soul_id: sub_test
at: 2026-11-13T10:20+08:00
---
# Summary

(Conclusion, absolute paths to artifacts, reproducible verification commands)

- Max 100 lines; details go to artifact files.
- Must be self-contained: the next hop can continue without asking anyone.
````

---

## Phase 1: Soul Tree Traversal & Recruitment

The Main Agent is a project manager and **must not do specialized detail work itself**.

> If a team is selected, the dispatch sequence equals its `members` (all run). Traversal still runs, to verify every member exists.

1. Read `<home>/souls/index.md` to find the department, then its `_branch.md` for the best-matching role.
2. If no role is competent for the domain, do not create one and dispatch. Propose a **New Role Recruitment Proposal** (suggested position / department, scope & boundaries, `reference_docs`) and pause for **human approval**; only then create the soul file, update the branch and index, and create `workspaces/<soul_id>/{active,archive,scratch}`.

---

## Phase 2: Task Family Provisioning

1. Create the main file in the task family home's `active/` (see Task Family Home; create `workspaces/_teams/<team_id>/{active,archive}` first if needed).
2. Body:

   ```markdown
   # Task Goal

   <precise requirements, no chit-chat>

   # Additional Context

   <task-specific absolute paths only>
   ```

3. `target_dir`: the actual output location, or `-`.
4. Initialize: team task → `origin_soul` and `assigned_soul` = `members[0]`; personal task → `assigned_soul` = `origin_soul`. `hop_count = 0`, `segments = []`.

---

## Phase 3: Disposable Subagent

1. **Write intent first**: before dispatching, update the main file (`assigned_soul`, `status: running`, `updated_at`).
2. Use the native Subagent / Task tool, always `background: true`:
   - **No polling** — completion arrives via the harness notification.
   - **One chain, one fly** — only one in-flight subagent per task family; fan-out requires a separate task family.
3. Launch command (absolute-path injection; substitute `<>`):

   ```text
   Execute in order. Do not ask questions. Do not wait for confirmation:
   1. Read and follow your role file: <soul.md absolute path>
   2. Read the main file: <main file absolute path> — task_id, target_dir, segments
   3. Read all existing sub-files in ascending order: <sub-file absolute paths>
   4. Follow your SOP; write output to target_dir (if "-", to your own scratch_dir — scratch is one-off only; no evidence here)
   5. Write exactly ONE new sub-file: <task family home>/<main filename>.<hop_count+1, 3 digits>.md
      (same directory as the main file; never into your own workspaces/<soul_id>/ or scratch/)
      Save any evidence as <task family home>/<main filename>.<hop>.<name>.<ext>
   6. Never modify or overwrite the main file or any existing sub-file
   7. Report ONLY a receipt:
      task_id / main_file / sub_file / hop / soul_id / status (done|failed|blocked) / summary (<=3 lines) / next_hint
   ```

4. **Use and discard**: the instance ends after reporting.
5. **Notification = claim**: map the notification to the task via `task_id` / `main_file` (required — several tasks may finish concurrently) and go to Phase 4.

---

## Phase 4: Verification, Handoff & Archiving

1. **Claim & verify**: map the notification via `task_id` / `main_file`, read the new sub-file. If it fails, record `status: failed` and report.
2. **Unidirectional handoff**: update the main file — `hop_count + 1`, `assigned_soul` = next, append the sub-file number to `segments`, `status: handoff`, `updated_at` now. **Team-driven**: next hop = `members[hop_count]`, no skipping; after the last member the task is complete. Then repeat Phases 1–4.
3. **No rollback**: if a hop reports `failed` / `blocked`, do not roll back or rewrite sub-files; record `status: failed` and report.
4. **Provenance classification (after an audit hop)**: classify every audit finding as `origin: this-round` (traceable to the current change set) or `origin: pre-existing` (existed before this task family). A finding without a stated origin is treated as `this-round`.
5. **Necessity triage (gate)**: for every `this-round` finding, Main assigns a disposition and records one line of rationale:
   - `fix` — changes runtime behaviour, correctness, security, data integrity, or prevents a false-green deploy/health gate.
   - `defer` — documentation wording, version claims, evidence recording, or test-coverage niceties with no runtime impact; recorded for natural pickup.
   - `accept` — process, whitelist, naming, or cosmetic; the risk is understood and accepted.
   Low/info findings default to `defer`/`accept`; they must not become `fix` without a runtime-impact reason. **An audit finding is a proposal, not a mandate.**
6. **Closure loop**: only `fix` dispositions open the next round — a new task family with the same `team_id`, whose Task Goal is exactly those findings — without waiting for human approval. `defer`/`accept` items are recorded in the report and close with the family.
7. **Convergence**: closure means **zero `fix`-class findings**, not zero findings. An audit must not block closure on `defer`/`accept` items; if it does, Main re-triages and reports the disagreement.
8. **Closure cap**: at most 2 consecutive self-fix rounds per original task family, and each round must strictly reduce the `fix`-class count. If the cap is reached or the count does not drop, stop and report to the human. The cap is a safety net, not the convergence mechanism.
9. **Atomic main file update**: Main only; write a temp file, then rename over the original.
10. **Circuit breaker (derived)**: the limit is the task's expected hop count — `members.Count` for a team task, `1` for a personal task. The chain completes exactly at that count; if `hop_count` would exceed it, the chain is malformed — stop and report. Nothing to configure. The closure loop does not violate this: each self-fix round is its own task family with its own hop count.
11. **Archive**: on pass, Move the whole family (main + sub-files + artifacts) from the home's `active/` to its `archive/`.
12. **Report** the result and archive path.
