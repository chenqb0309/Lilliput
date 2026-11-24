# Changelog

All notable changes to Lilliput are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-11-24

First public release.

- **Protocol** (`SKILL.md`): Path Contract, Bootstrap, Resume, Team Selection & Assembly,
  Task Family & Sub-Files, and the four execution phases.
- **State model**: a task family = one main file (single source of truth) + ordered, immutable sub-files
  + independent artifact files.
- **Teams** as declarative, unidirectional workflows; recruitment and assembly gated by human approval.
- **Recovery**: write-ahead intent + atomic main-file updates + a resume scan on every load.
- **Circuit breaker**: the hop limit is derived from the task's expected hop count (a team's `members`
  count, or 1 for a personal task) — no global setting.
- Distribution: `config.example.json`, `README.md`, `LICENSE` (MIT), `REQUIREMENTS.md`,
  `docs/CONFORMANCE.md`, `docs/TROUBLESHOOTING.md`, `examples/`, and a validator
  (`scripts/validate-task-family.mjs`) with CI.
