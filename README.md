# lilliput

A stateless multi-role agent orchestration protocol built on a **Soul Tree** and **disposable subagents**.
It lets an AI coding agent split one large task across specialized roles working as a relay, while moving
context **out of the conversation and into files** — so tasks are reproducible, auditable, and resumable
across sessions.

## Core concepts

| Concept | Description |
|---|---|
| **Soul** | A role definition (scope & boundaries + SOP) stored under `souls\`. |
| **Soul Tree** | Two-level lookup: department (`_branch.md`) → role (`<soul>.md`); root is `souls\index.md`. |
| **Team** | A reusable **workflow template** = an ordered `soul_id` list, stored under `teams\`. |
| **Task family** | One task's context: a **main file** (single source of truth) + ordered **sub-files** + independent artifacts. |
| **Main Agent** | Project manager: traverse the tree, pick a team, provision the task family, dispatch, verify, archive — never doing specialized detail work itself. |

## Layout

```text
<home>\
├─ souls\                       roles (index.md / per-department _branch.md / <soul>.md)
├─ teams\                       workflow templates (index.md / <team_id>.md)
├─ workspaces\
│   ├─ _teams\<team_id>\        active\  archive\   (team task family home)
│   └─ <soul_id>\               active\  archive\  scratch\
└─ _legacy\                     retired assets
```

The **task family home** is routed by `team_id`: team tasks → `workspaces\_teams\<team_id>\`;
personal tasks → `workspaces\<soul_id>\`. `scratch\` holds one-off intermediates and is **not archived**;
evidence to keep is written as an **independent artifact** in the task family home.

## Install

1. Place this directory in your agent's skills path (e.g. `my-skills/lilliput/`).
2. Copy the config template:
   - Windows: `copy config.example.json config.json`
   - POSIX: `cp config.example.json config.json`
3. Edit `config.json`'s `home` if needed (env syntax `%USERPROFILE%` / `$HOME` is resolved at load time).
4. On first load the skill runs **Bootstrap**: it creates the `home` tree, the standard roles, and the standard teams.

> `config.json` is a local machine setting and is **not version-controlled** (see `.gitignore`);
> only `config.example.json` is tracked.

## Standard roster (created by Bootstrap)

- Roles: `sub_doc` (docs), `sub_code` (implementation), `sub_test` (tests), `sub_audit` (audit)
- Teams: `dev-flow`, `doc-only`

**Domain roles** (e.g. database query, equipment experts, project management) are *not* standard —
they are created through the **Recruitment** proposal, approved by a human. **Domain teams** follow the
same rule via the **Team Proposal**.

## Operating flow (Main Agent)

```
Resume scan (unarchived tasks in active\)
 → Team selection (match teams\index.md against when_to_use; confirm; optionally suggest a single-soul task)
 → Soul Tree traversal (verify members exist; recruit if missing)
 → Provision the task family (write the main file; write intent first)
 → Dispatch (background: true; wait for the notification)
 → Claim by receipt → verify → unidirectional handoff → archive
```

## Security

- This spec contains **no credentials or host information**; domain details (connections, paths) live in the
  **local data directory** and are never version-controlled with the skill.
- Keep the `home` directory out of any public version control.

## Design notes

- **No back-edges.** A team is a one-way relay. If audit finds issues, it reports to Main and the human opens a
  new round (a new task family) — the `hop_count` never decreases.
- **Recovery over memory.** Authoritative task state lives in the main file's front matter, not in the
  conversation, so a new Main can resume after an interruption.
- **Evidence is durable, scratch is not.** Anything worth keeping is an artifact in the task family home and
  is archived with the family.

## License

MIT — see [LICENSE](./LICENSE).
