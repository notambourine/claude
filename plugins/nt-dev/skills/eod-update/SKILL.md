---
name: eod-update
description: Draft a Slack-ready end-of-day developer update from today's repository activity and the user's missing work, tomorrow plan, and blockers. Use for EOD, daily standup, and day-wrap requests; never post it.
allowed-tools:
  - Bash(gh pr list:*)
  - Bash(gh pr view:*)
  - Bash(gh api:*)
  - Bash(git log:*)
  - Bash(git config:*)
  - Bash(git remote:*)
  - Bash(date:*)
  - Bash(sed:*)
  - Bash(echo:*)
---

# End-of-day update

Build a paste-ready Slack update from today's GitHub activity and the user's answers. Never post it.

Run from the repository where the work happened. Use `git` for local commits and authenticated `gh` for pull requests.

## Gather activity

Collect today's local commits and candidate PRs the user authored, reviewed, commented on, or merged. Use the repository derived from `origin` and the current GitHub login.

```bash
DAY=$(date +%Y-%m-%d)
REPO=$(git remote get-url origin 2>/dev/null | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##')
ME=$(gh api user --jq .login 2>/dev/null)
git log --all --since=midnight --author="$(git config user.email)" --oneline --no-merges
gh pr list --repo "$REPO" --state all --search "author:@me updated:>=$DAY" --json number,title,state --limit 20
gh pr list --repo "$REPO" --state all --search "reviewed-by:@me -author:@me updated:>=$DAY" --json number,title,state,author --limit 20
gh pr list --repo "$REPO" --state all --search "commenter:@me -author:@me updated:>=$DAY" --json number,title,state,author --limit 20
gh pr list --repo "$REPO" --state merged --search "merged:>=$DAY -author:@me" --json number,title,author,mergedBy --limit 30 --jq "map(select(.mergedBy.login == \"$ME\"))"
```

Search qualifiers such as `reviewed-by`, `commenter`, and `author` do not prove the action happened today; another update can pull an old interaction into the result. Verify every authored, reviewed, and commented candidate with its event timestamps:

```bash
gh pr view <number> --repo "$REPO" --json reviews,comments,mergedAt
```

Keep only activity by `$ME` dated today, or an authored PR actually opened or pushed today. The merge query is already date-specific.

Dedupe by PR number. Prefer merged, then reviewed or approved, then commented, then authored. Collapse related commits. Phrase teammate PRs by the user's action. Frame authored PRs by state: opened or updated and ready for review, or merged. Use PR number and title without URLs. Never invent activity when commands fail or return nothing.

## Ask what GitHub cannot know

Before producing the update, use one `AskUserQuestion` call with all three questions:

1. Anything else you wrapped up today?
2. What are you working on tomorrow?
3. Any blockers or open questions?

Offer `Nothing else` or `None` first where applicable, then context-derived choices and free text. Do not ask the user to confirm activity already verified. If the user supplied an answer in the request, do not ask it again.

## Output

Return only this plain-text template inside a fenced code block:

```text
🌇 EOD Update DD-MM-YYYY
[optional user-provided intro]

✅ Done:
• [item]

🔨 Doing:
• [item]

🚩 Blockers:
• [item or None]

📝 Notes:
[notes]
```

Use exactly those five emoji, only in the title and section headings. Use `•` bullets, short lines, ASCII punctuation, and `DD-MM-YYYY`. Always include Blockers. Remove Notes when empty. Include no Markdown syntax inside the fence, no URLs, filler, sign-off, or follow-up question.

If GitHub or repository context is unavailable, build from the user's answers. Mention the missing repository context only when it changes what they should do, such as rerunning from the correct repository. For later wording changes, revise and return the complete block. Never post it.
