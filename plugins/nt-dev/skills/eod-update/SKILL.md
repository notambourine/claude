---
name: eod-update
description: >-
  Generate a structured end-of-day (EOD) developer update for the user to
  copy-paste into Slack, from today's GitHub activity in the current repo
  plus the user's own answers. Trigger on a bare "EOD", "end of day update",
  "EOD update", "daily standup update", "wrap up my day", or any request to
  summarize the day's dev work. This skill never posts anywhere - the user
  copies the output themselves.
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

# EOD Update

Build a clean end-of-day developer update from today's GitHub activity plus what the user tells
you, then print it for them to paste into Slack. **This skill never posts anywhere.**

The skill needs `git` and, for PR activity, the `gh` CLI. Run it from inside the repo the day's
work happened in. Every command below uses portable flag spellings and runs the same on macOS,
Linux, and Windows Git Bash.

## Context (pre-computed at skill load)

- Today: !`date +%d-%m-%Y`
- Today's commits (current repo): !`git log --all --since=midnight --author="$(git config user.email)" --oneline --no-merges 2>/dev/null || echo "no git repo / no commits today"`
- Today's authored PRs (current repo): !`repo=$(git remote get-url origin 2>/dev/null | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##'); gh pr list --repo "$repo" --state all --search "author:@me updated:>=$(date +%Y-%m-%d)" --json number,title,state --limit 20 2>/dev/null || echo "gh CLI not configured or no PRs today"`
- Today's PRs reviewed/approved by you, authored by others (current repo): !`repo=$(git remote get-url origin 2>/dev/null | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##'); gh pr list --repo "$repo" --state all --search "reviewed-by:@me -author:@me updated:>=$(date +%Y-%m-%d)" --json number,title,state,author --limit 20 2>/dev/null || echo "gh CLI not configured or no reviewed PRs today"`
- Today's PRs you commented on, authored by others (current repo): !`repo=$(git remote get-url origin 2>/dev/null | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##'); gh pr list --repo "$repo" --state all --search "commenter:@me -author:@me updated:>=$(date +%Y-%m-%d)" --json number,title,state --limit 20 2>/dev/null || echo "gh CLI not configured or no commented PRs today"`
- Today's PRs you merged, authored by others (current repo): !`repo=$(git remote get-url origin 2>/dev/null | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##'); me=$(gh api user --jq .login 2>/dev/null); gh pr list --repo "$repo" --state merged --search "merged:>=$(date +%Y-%m-%d) -author:@me" --json number,title,author,mergedBy --limit 30 --jq "map(select(.mergedBy.login == \"$me\"))" 2>/dev/null || echo "gh CLI not configured or no merged PRs today"`

## Workflow

### Step 1 - Build the "Done" bullets from GitHub activity (silently)

The Context block already pulled today's commits and PRs from the current repo across five
signals: your commits, PRs **you authored**, PRs **you reviewed or approved**, PRs **you
commented on**, and PRs **you merged** (the last three for PRs authored by others). They are
separate queries because the acts are independent. You can comment without a formal review, or
merge a teammate's PR without reviewing it at all, so each query catches work the others miss.

Draft the "Done" bullets from this **internally. Do not show the summary to the user as its own
message, and do not ask them to confirm the auto-derived bullets** (Step 2 asks separately
whether anything is *missing*). The user edits the final text by hand when they paste it into
Slack, so a round-trip on what GitHub already shows is noise. Hold the bullets until Step 3.

- **Verify the reviewed, commented, and authored signals before trusting them. They produce
  false positives.** Those three queries filter on `updated:>=today`, which means the PR was
  touched *by anyone, for any reason* (someone else's comment, a bot, CI, a label change), not
  that you reviewed, commented, or pushed today. `reviewed-by:@me`, `commenter:@me`, and
  `author:@me` only check whether you ever did that on the PR, at any point in its history.
  GitHub search has no "this action happened on this date" qualifier for reviews or comments, so
  the only reliable check is the event timestamps. For every candidate from those three signals,
  run `gh pr view <number> --repo <repo> --json reviews,comments,mergedAt` and keep it only if a
  review or comment by your GitHub login (`gh api user --jq .login`) is stamped today, or
  `mergedAt` is today. Drop anything that fails. It showed up in the Context block, but it is not
  today's work. The "you merged" signal is already exact. It filters on `merged:>=today`, the real
  merge timestamp, plus a `jq` match on `mergedBy.login`, so it needs no recheck.
- **Dedupe by PR number across all signals. One PR is one bullet.** A PR can land in several
  signals at once, say when you commented on, reviewed, and merged it. Keep one bullet using the
  **strongest** signal, in this order: merged, then reviewed or approved, then commented, then
  authored.
- Turn real activity into "Done" bullets. Collapse related commits into one bullet. Reference PRs
  by number and title ("PR #214: fix auth middleware"). Never include PR URLs.
- **PRs by others that you reviewed, commented on, or merged count as your work.** Give them their
  own "Done" bullets, phrased by what you did rather than who wrote it: "Reviewed and approved PR
  #209 (session timeout patch)", "Reviewed and merged PR #214 (auth middleware fix)", "Commented
  on PR #221 (cart drawer refactor)".
- **Your own authored PRs are Done work too. Use `state` to frame them.** An **open** PR you
  opened or pushed to today becomes "Opened PR #71 (product carousel with tabs) - ready for
  review", or "Updated PR #X ..." if it was already open. A **merged** one becomes "Merged PR #X
  (title)".
- If every command errored or came back empty (no git repo, `gh` not configured, nothing today),
  leave "Done" to whatever the user supplies. Never invent bullets. The output can carry
  `• None` or the user's own items.

### Step 2 - Ask the two things GitHub cannot answer (up front, in one prompt)

GitHub activity covers most of **what got done today**, but it misses work that never became a
commit or PR in this repo: finished-but-unpushed work, something ready for review that is not a
PR yet, or design, research, and coordination. It also cannot know tomorrow's plan or the
blockers. Ask for these **before producing any output**, in a **single `AskUserQuestion` call
carrying all three questions**, so there is no back-and-forth:

1. **Anything else you wrapped up today?** Catches Done work the GitHub queries missed. Offer a
   `Nothing else` option first, plus options derived from context (open authored PRs, today's
   local commits or current-branch work that is not a PR yet), plus free-text "Other". Merge the
   picks into Done alongside the auto-derived bullets.
2. **What are you working on tomorrow?** Offer a few options derived from context (in-progress
   PRs, unfinished threads from today's commits, obvious next steps), plus free-text "Other".
3. **Any blockers or open questions?** Offer `None` first, plus any blockers you can infer from
   context, plus free-text "Other".

All three are **always required**. Never skip one, never answer one yourself. The user picks an
option or types their own. Once they answer, go straight to Step 3 and emit the update. Ask
nothing else first.

### Step 3 - Output the full update

Use this template, inside a fenced code block, so the user can paste it straight into Slack:

```
🌇 EOD Update [DD-MM-YYYY]
[optional intro sentence if the user provided one]

✅ Done:
• [item]

🔨 Doing:
• [item]

🚩 Blockers:
• [item, or "None"]

📝 Notes:
[notes if any, otherwise drop this section]
```

**Formatting rules:**

- Plain text only. No markdown anywhere in the output: no asterisks, no backticks, no
  underscores.
- **Emoji sits on the title and the four section headers, and nowhere else.** Never in a bullet,
  never in the intro sentence, never a second emoji on a header. Use exactly the five above:
  🌇 title, ✅ Done, 🔨 Doing, 🚩 Blockers, 📝 Notes.
- Bullets use `•`, not `-` or `*`.
- Date is DD-MM-YYYY, say 29-05-2026.
- Blockers is always present. Write `• None` when there are none.
- Drop the Notes section when the user has nothing to add.
- One short line per bullet, plain words. Reference PRs by number and title only. No PR or commit
  URLs.
- ASCII punctuation. Hyphens, straight quotes, straight apostrophes. No em dash, no en dash, no
  curly quotes.
- Structured and plain. No filler, no sign-off.

Emit the code block and stop. No preamble, no "does this look right?", no offer to edit. The user
pastes it into Slack and tweaks it there. If they ask for a change, apply it and re-show.
**Never post it anywhere. The user copies it into Slack themselves.**

## Example output

```
🌇 EOD Update 29-05-2026
Wrapped up the auth work and got a head start on rate limiting.

✅ Done:
• Opened PR #221 (rate-limit middleware) - ready for review
• Merged PR #214: fix null pointer in auth middleware
• Reviewed and approved PR #209 (session timeout patch)
• Traced slow query on /api/orders to a missing index

🔨 Doing:
• Add DB index migration for the orders table
• Start rate limiting for the public API (DEV-88)

🚩 Blockers:
• Need sign-off on rate-limit thresholds before DEV-88 lands

📝 Notes:
Deploy window is Thursday morning. Aiming to have the migration ready by then.
```

## Edge cases

- No GitHub activity, or `gh` not configured: do not announce it. Go straight to the Step 2
  questions and build the update from the answers (Done can be `• None` or the user's own items).
  GitHub returning nothing does not mean nothing got done. The "anything else?" question is how a
  real day still fills the Done section.
- Not run from inside a repo: the git and `gh` commands need the repo as the working directory.
  Build the update from the Step 2 answers alone, and tell the user they can re-run from the repo
  for the auto-derived bullets.
- User supplies everything up front: use what they give you and skip the questions they answered.
- User runs the skill with no context: jump straight to the Step 2 questions.
- Always ask the three Step 2 questions (anything-else, tomorrow, blockers) in one
  `AskUserQuestion` prompt before emitting output. GitHub cannot supply them, and they are
  required every time.
- User asks to tweak the output: edit and re-show. Never post.
