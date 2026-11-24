# Troubleshooting

Failure modes seen in practice, and what to do.

## A hop never reports back

The subagent finished, errored, or was interrupted. On the next load, the **Resume** scan handles it:

- The expected next sub-file `<main>.<hop_count+1>.md` **exists** → the hop actually completed; verify it (Phase 4).
- It **does not exist** → the hop was interrupted; re-dispatch to `assigned_soul` (Phase 3).

Never hand-edit a sub-file to "fix" a hop; write a new one in a new round.

## The main file is half-written / unreadable

Main-file writes must be **atomic** (write a temp file, then rename over the original). If you find a
truncated main file, recover from the last good copy and re-derive `hop_count` from the sub-files present.

## The model ignores the protocol

Most often the launch prompt was not followed. Keep the dispatch prompt minimal and explicit
(absolute paths, no `@`-mention syntax, "do not ask questions"), and confirm the role file exists.

## Paths break after moving machines

`config.json`'s `home` must exist on disk. If it does not, **stop and report** — do not guess or rewrite
paths. Move the data directory and update `home`, or re-run Bootstrap on a fresh machine.

## The hop limit is hit before the task is done

The limit is **derived**: a team task's expected hop count is its team's `members` count (a personal task
is 1 hop). Hitting it means the task does not fit the chosen team. Do not raise a number —
open a new round (a new task family) or choose a longer team.

## Audit finds a problem mid-flow

Lilliput has **no back-edges**. The audit hop reports `failed`/`blocked`; the human decides, and Main opens
a **new round** (a new task family). The old family is never rewritten.

## Background dispatch is unavailable

Run hops in the foreground, one at a time. The "one chain, one fly" rule still holds; you only lose the
async notification.

## Two runs write to the same hop

"One chain, one fly" was violated: only one in-flight subagent may target a task family at a time.
To parallelize, open a **separate task family**.
