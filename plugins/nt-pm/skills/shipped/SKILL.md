---
name: shipped
description: Draft plain-English Slack deploy notes for work about to ship or the last observed production push. Use for deploy previews and retrospective release summaries; never deploy or post the result.
disable-model-invocation: true
allowed-tools:
  - Bash(git fetch:*)
  - Bash(git reflog:*)
  - Bash(git rev-parse:*)
  - Bash(git rev-list:*)
  - Bash(git symbolic-ref:*)
  - Bash(git log:*)
  - Bash(git show:*)
  - Bash(git merge-base:*)
  - Bash(git remote:*)
  - Bash(gh pr list:*)
  - Bash(gh pr view:*)
  - Bash(gh issue view:*)
  - Bash(gh api:*)
  - Bash(date:*)
  - Bash(echo:*)
  - Bash(sed:*)
  - Bash(tr:*)
  - Bash(head:*)
---

# Deploy updates

Draft only. Never deploy or post.

Mode:

- Pre-deploy default: remote default branch to user branch, first of `dev`, `staging`,
  `develop`, `release`, else `HEAD`.
- Retrospective: previous to current observed remote-default reflog tip.

Fetch `origin`; stop on failure. Resolve endpoints, short SHAs, dates, count. Confirm before
writing:

```text
mode: <pre-deploy | retrospective>
prev: <sha> (<date>) -> target: <sha> (<date>)
<N> commits in range - write the deploy update? [y / pick a different point]
```

Zero: nothing pending/shipped. Wider range accepts reflog entry, SHA, tag, date. Empty
retrospective reflog: request one. No origin: request deployment repo.

After confirmation, inspect non-merge commits. Resolve PR by referenced number or SHA; read
PR body, then linked issues and diff stat as needed. Exclude work ancestral to start.
Translate unsupported commits cautiously. Collapse related work and routine dependency/CI
noise. Categories: only those needed from Features, Fixes, Admin / internal, Behind the
scenes, SEO / marketing, Performance.

Return only:

```text
M/D/YY Deploy Updates

Features
- Name - plain-language effect and value
```

ASCII. One line per bullet. No emoji, Markdown, PRs, hashes, branches, files, functions,
database terms, attribution, or stock openings. Missing `gh`: use commits and warn. Apply
later wording edits to full block.
