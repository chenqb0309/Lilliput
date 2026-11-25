# Changelog

All notable changes to Lilliput are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

## [1.1.1] - 2026-11-25

- **Necessity triage (Phase 4)**: every `this-round` finding is triaged as `fix` / `defer` / `accept`.
  Only `fix` (runtime behaviour, correctness, security, data integrity, false-green gates) opens the next round;
  `defer` (docs, version claims, evidence, test-coverage niceties) and `accept` (process, naming, cosmetic)
  are recorded and close with the family. An audit finding is a proposal, not a mandate.
- **Convergence redefined**: closure = zero `fix`-class findings, not zero findings. Without this, an audit's
  unbounded findings would always burn the round cap.
- **Audit output contract**: findings now carry `origin`, `runtime_impact`, and a suggested disposition.

## [1.1.0] - 2026-11-25

- **Closure loop (Phase 4)**: audit findings carry `origin: this-round | pre-existing`.
  `this-round` findings automatically open the next round (same `team_id`, new task family) until that
  round's audit reports zero of them; `pre-existing` findings are recorded and left for the human.
  Capped at 2 consecutive self-fix rounds, each of which must strictly reduce the `this-round` count.
- **Provenance is mandatory**: a finding without an `origin` is treated as `this-round`.
- **No rollback unchanged**: sub-files remain immutable; closure uses new task families, and each round
  keeps its own derived hop limit.

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
