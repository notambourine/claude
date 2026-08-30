---
name: eod-update
description: Draft a Slack end-of-day update.
allowed-tools:
  - Bash(gh pr list:*)
  - Bash(gh pr view:*)
  - Bash(gh api:*)
  - Bash(git log:*)
  - Bash(git config:*)
  - Bash(git remote:*)
  - Bash(date:*)
---

# End-of-day update

Draft only. Never post.

Use today's local commits and authenticated GitHub events: authored, reviewed, commented,
merged. Verify event timestamps; deduplicate PRs; collapse commits into outcomes. For
teammate PRs, name the user's action. For authored PRs, name current state. Ask only for
unrecoverable work, tomorrow, blockers.

Return only:

```text
🌇 EOD Update DD-MM-YYYY

✅ Done:
• [item]

🔨 Doing:
• [item]

🚩 Blockers:
• [item or None]

📝 Notes:
[optional]
```

Short items. PR numbers, no URLs. Always Blockers. Omit empty Notes. Missing repo context:
use answers only.
