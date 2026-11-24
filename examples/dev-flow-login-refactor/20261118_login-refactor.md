---
task_id: 20261118_login-refactor
team_id: dev-flow
origin_soul: sub_doc
assigned_soul: sub_doc
status: done
hop_count: 4
updated_at: 2026-11-18T11:30+08:00
target_dir: C:\work\myapp
segments: [1, 2, 3, 4]
---

# Task Goal

Refactor the login module: split the monolithic `login()` into three concerns —
**authentication**, **session creation**, and **audit logging** — without changing the public API.

# Additional Context

- Public entry point today: `login(user, pass)` in `C:\work\myapp\src\auth\login.ts`.
- No other task-specific context; each soul reads its own `reference_docs`.
