# Requirements

Lilliput is a **protocol**, not a runtime. It is executed by an agent harness, so it only works if the
host agent provides the capabilities below. If a capability is missing, Lilliput cannot run correctly.

## Required

| Capability | Why it is required |
|---|---|
| Read and write files at **absolute paths** | The entire model is file-based; state never lives in the chat. |
| Spawn a **fresh, isolated subagent** (a "subagent" / "task" tool) | Every hop runs in a clean context. |
| Hand the subagent a prompt that tells it which files to read | There is no shared memory; state travels only through files. |
| A **persistent filesystem** across sessions | Resume depends on files outliving the conversation. |
| Ask the human a question and wait for an answer | Recruitment and team assembly require explicit human approval. |

## Recommended

| Capability | Without it |
|---|---|
| Run the subagent in the **background** and deliver a **completion notification** | Run hops one at a time in the foreground. The "one chain, one fly" rule still applies; you just do not get async dispatch. |
| **Shell / command execution** | Sub-files cannot embed reproducible verification commands. |

## Explicit non-requirements

- No network, database, cloud service, or scheduler.
- No specific operating system: **the protocol is OS-neutral** (see `SKILL.md` → Path Contract).
- No specific model or vendor.

## Platform support

Lilliput is designed to be **agent- and OS-agnostic**. Any agent that can dispatch subagents and read/write
files can host it (OpenCode, Claude Code, Codex, Cursor, and others). Paths are always **OS-native absolute
paths**; the documentation uses `/` in examples for brevity — substitute your platform's separator.
