---
hop: 2
task_id: 20261118_login-refactor
soul_id: sub_test
at: 2026-11-18T10:25+08:00
---
# Summary

Tests written first, pinning the acceptance criteria before any refactor.

## What was added

- `auth.spec.ts` — valid credentials create a session; invalid ones are rejected.
- `session.spec.ts` — a session is created exactly once per successful login.
- `audit.spec.ts` — every login attempt (success and failure) writes one audit entry.

## Current state

- All new tests **fail** against the current monolithic `login()` — expected (red).

## Artifacts

- `/work/myapp/src/auth/auth.spec.ts`
- `/work/myapp/src/auth/session.spec.ts`
- `/work/myapp/src/auth/audit.spec.ts`

## Verification

```
cd /work/myapp && npm test -- auth
# 3 failing (auth, session, audit) — the contract to satisfy next
```
