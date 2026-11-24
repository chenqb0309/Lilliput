# Examples

A **task family** as produced by a `dev-flow` run (`sub_doc → sub_test → sub_code → sub_audit`).
It is an illustrative recording of one end-to-end relay — open the files top to bottom to see how state
and hand-off are carried in plain files.

```text
dev-flow-login-refactor/
├─ 20261118_login-refactor.md        main file: identity & state (single source of truth)
├─ 20261118_login-refactor.001.md    hop 1 · sub_doc  : task board
├─ 20261118_login-refactor.002.md    hop 2 · sub_test : tests first
├─ 20261118_login-refactor.003.md    hop 3 · sub_code : implementation
└─ 20261118_login-refactor.004.md    hop 4 · sub_audit: audit report
```

In a real run this folder would sit under
`<home>/workspaces/_teams/dev-flow/archive/` once the task passed verification, and the paths inside
would be the real absolute paths on that machine. Here they use an illustrative project root
(`/work/myapp`) and are not meant to be executed.
