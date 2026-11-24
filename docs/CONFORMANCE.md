# Conformance

A **task family** is *conforming* when the rules below hold. `scripts/validate-task-family.mjs`
checks all of them automatically; CI runs it against `examples/`.

Run it locally:

```bash
node scripts/validate-task-family.mjs examples/dev-flow-login-refactor
```

Exit code `0` means conforming; non-zero prints every violation.

## A conforming task family

**Location** — lives in exactly one directory (the *task family home*):

- team task (`team_id` ≠ `-`) → `workspaces/_teams/<team_id>/active/`
- personal task (`team_id: -`) → `workspaces/<soul_id>/active/`

**Main file** — exactly one, named `<YYYYMMDD>_<slug>.md`, with front matter:

| Field | Rule |
|---|---|
| `task_id` | equals the main filename without `.md` |
| `team_id` | a known team id, or `-` |
| `origin_soul` | non-empty |
| `assigned_soul` | non-empty |
| `status` | one of `pending`, `running`, `handoff`, `done`, `failed` |
| `hop_count` | integer ≥ 0 |
| `updated_at` | ISO-8601 timestamp |
| `target_dir` | an absolute path, or `-` |
| `segments` | list whose length equals `hop_count` |

**Sub-files** — one per executed hop, named `<YYYYMMDD>_<slug>.<NNN>.md` with `NNN` zero-padded to 3 digits.
For every `i` in `1..hop_count`, `<main>.<NNN>.md` must exist, and its front matter must carry
`hop: i`, the same `task_id`, a `soul_id`, and an `at` timestamp. Sub-files are **immutable** once written.

**Artifacts** — anything to preserve is `<main>.<NNN>.<name>.<ext>` in the same directory,
archived with the family. One-off scratch lives in the soul's `scratch/` and is never archived.

## What the validator does *not* check

- Whether the work is any good (that is what `sub_audit` is for).
- Whether hop `i`'s `soul_id` matches a team's `members[i]` — pass `--teams <dir>` to enable that check.
