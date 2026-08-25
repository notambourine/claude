---
name: commit
description: Write git commit messages as `scope: description`. Use the changed subsystem as the scope and state what the change does. Apply when committing, amending, or rewording instead of using Conventional Commits types.
allowed-tools:
  - Bash(git status:*)
  - Bash(git diff:*)
  - Bash(git log:*)
  - Bash(git add:*)
  - Bash(git commit:*)
---

# Commit message

Write:

`scope: description`

Treat the scope as the sentence subject.

## Scope

Name the changed part using the project's vocabulary: package path, plugin, service,
directory, or subsystem. Read `git log --oneline -30` and reuse established prefixes.

- One area: `nt-dev: ...`
- Nested where the project nests: `nt-dev/pr: ...`, `net/http/cookiejar: ...`
- Two areas: `a,b: ...`. Split commits spanning three or more areas.

## Description

State what the change does. Use lowercase imperative language and keep the entire line
under 72 characters.

Omit Conventional Commits types. `fix`, `feat`, `chore`, and `refactor` duplicate
information carried by the description and often overlap.

```text
nt-dev: stop the dash guard from firing on vendored skills
scripts: read the timestamp out of the file instead of stat
brand-kit: 1.1.0 -> 1.2.0
```

Do not write `fix(nt-dev): ...`, `chore: bump`, or `Update files`.

## Body

Add a body only when the diff cannot explain why. Wrap at 72 characters. Explain why the
approach wins or what trap it avoids. Do not narrate files. Close issues with
`Fixes #123`.

## Before committing

Stage only touched paths. Never use `git add -A`. Confirm the staged diff has one scope.
Otherwise, commit it in pieces.
