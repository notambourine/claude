---
name: recall
description: Recover context from prior sessions in this repo.
allowed-tools:
  - Bash
  - Read
---

# Recall

Read `~/.claude/projects/` JSONL. Match trailing repo name; verify recorded `cwd`. Usually
second-newest is prior session. Order with `/bin/ls`; read JSONL timestamps, not file times.

Extract user strings and assistant text blocks with `jq`. Ignore tools and system reminders.
Use `tool-results/` only when transcript references persisted output or misses an expected
keyword.

Ambiguous session: show start, ID, first prompt. Search same repo by topic before other
repos. Summarize decisions, work, unfinished thread; continue task. Never copy long
transcripts into repo; they may contain secrets.
