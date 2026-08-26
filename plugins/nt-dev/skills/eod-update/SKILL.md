---
name: eod-update
description: Draft a concise Slack-ready end-of-day update from today's repository activity and the user's missing work, tomorrow plan, and blockers. Use for EOD, daily standup, and day-wrap requests; never post it.
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

Produce a paste-ready Slack update. Never post it.

## Know what happened

Use the current repository's local commits and authenticated GitHub activity from today. Include PRs the user authored, reviewed, commented on, or merged.

GitHub search results updated today can contain older user activity. Verify the relevant event timestamps before including a PR. Deduplicate by PR and collapse related commits into outcomes. Describe teammate PRs by the user's action and authored PRs by their current state. Never invent activity when repository data is missing.

Ask only for what the repository cannot reveal: other completed work, tomorrow's focus, and blockers or open questions. Do not repeat questions the user already answered.

## Write the update

Return only a plain-text block in this shape:

```text
🌇 EOD Update DD-MM-YYYY

✅ Done:
• [item]

🔨 Doing:
• [item]

🚩 Blockers:
• [item or None]

📝 Notes:
[optional notes]
```

Keep items short. Include PR numbers without URLs. Always include Blockers and omit Notes when empty. If repository context is unavailable, build the update from the user's answers.
