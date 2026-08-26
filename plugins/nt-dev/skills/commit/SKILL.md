---
name: commit
description: "Write and create focused git commits using the repository's `scope: description` convention. Use when committing, amending, or rewording instead of Conventional Commits types."
allowed-tools:
  - Bash(git status:*)
  - Bash(git diff:*)
  - Bash(git log:*)
  - Bash(git add:*)
  - Bash(git commit:*)
---

# Commit

Create a focused commit with this subject:

`scope: description`

Use the changed subsystem as the scope and the repository's vocabulary. Follow established nested scopes where useful, such as `nt-dev/pr`. For two areas, use `a,b`; split work spanning more areas.

State what the change does in lowercase imperative language. Keep the subject under 72 characters. Do not add a Conventional Commits type.

Add a body only when the change itself cannot explain why the approach wins or what trap it avoids. Close issues there when applicable.

Stage only the paths that belong to this commit. Never use `git add -A`. Check that the staged change has one coherent scope before committing.
