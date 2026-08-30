---
name: pr
description: Create or revise a draft pull request.
allowed-tools: Bash, Read, Write, Glob
argument-hint: "[pr-number-to-edit]"
---

# Pull request

Use the repo template; fallback: `.github/pull_request_template.md`. Preserve headings and
markers.

Derive problem, outcome, scope, decisions from issue, source, diff, and commits. Never rely
on branch or subjects alone. Open on outcome. Explain behavior and decisions, not files.
Keep proportional. Specific title. Draft unless ready requested.

Visible changes: add useful named before/after captures; recording for motion or flows.
Upload as GitHub user attachments. Read
[references/github-attachments.md](references/github-attachments.md).

Submit with `gh pr create` or `gh pr edit`, preserving formatting.
