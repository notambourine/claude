---
name: recall
description: Recover relevant context from prior Claude Code conversations for the current repository. Use when the user refers to missing earlier work, decisions, or an unfinished session.
allowed-tools:
  - Bash
  - Read
---

# Recall prior context

Recover enough prior conversation to answer the user's current request. Reading the transcript is better than guessing.

Claude Code stores repository sessions as JSONL under `~/.claude/projects/`. Match the current repository by its trailing directory name, then verify each candidate's recorded `cwd`; repositories with the same basename can collide. "Last session" usually means the second-newest file because the newest is often current.

Extract only user and assistant text with `jq`. User text may be a string; assistant text is held in text content blocks. Ignore tool results and system reminders. Search a session's `tool-results/` directory only when the transcript points to persisted output or an expected keyword is missing.

When the intended session is unclear, show a short list with start time, session ID, and first user prompt. Search across this repository's sessions for a topic; broaden to other repositories only when the user refers to cross-repository work.

Summarize the relevant decisions, work, and unfinished thread, then continue the actual task. Include a timestamp or session ID only when it helps disambiguate. Do not reproduce long transcripts or write them into the repository; they may contain secrets.

Use `/bin/ls` when ordering sessions so shell aliases cannot reinterpret flags. Read timestamps from JSONL rather than filesystem metadata.
