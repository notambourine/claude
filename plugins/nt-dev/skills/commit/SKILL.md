---
name: commit
description: Write and create focused git commits.
allowed-tools:
  - Bash(git status:*)
  - Bash(git diff:*)
  - Bash(git log:*)
  - Bash(git add:*)
  - Bash(git commit:*)
---

# Commit

Subject: `scope: lowercase imperative description`; repository vocabulary; under 72
characters; no Conventional Commit type. Nested scope when useful; `a,b` for two scopes;
split broader work.

Body only for hidden rationale, traps, or issue closure. Stage touched paths only, never
`git add -A`. Commit one coherent scope.
