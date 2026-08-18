---
name: eod-update
description: >-
  Generate a structured end-of-day (EOD) developer update for the user to
  copy-paste into Slack, from today's GitHub activity in the current repo
  plus the user's own answers. Trigger on a bare "EOD", "end of day update",
  "EOD update", "daily standup update", "wrap up my day", or any request to
  summarize the day's dev work. This skill never posts anywhere — the user
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

Generate a clean end-of-day developer update from today's GitHub activity plus user-provided
context, then output it for the user to copy-paste into Slack. **This skill never posts anywhere.**

The skill needs `git` and, for PR activity, the `gh` CLI. Run it from inside the repo the day's
work happened in. All commands below use portable flag spellings and run the same on macOS,
Linux, and Windows Git Bash.

## Context (pre-computed at skill load)

- Today: !`date +%d-%m-%Y`
- Today's commits (current repo): !`git log --all --since=midnight --author="$(git config user.email)" --oneline --no-merges 2>/dev/null || echo "no git repo / no commits today"`
- Today's authored PRs (current repo): !`repo=$(git remote get-url origin 2>/dev/null | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##'); gh pr list --repo "$repo" --state all --search "author:@me updated:>=$(date +%Y-%m-%d)" --json number,title,state --limit 20 2>/dev/null || echo "gh CLI not configured or no PRs today"`
- Today's PRs reviewed/approved by you, authored by others (current repo): !`repo=$(git remote get-url origin 2>/dev/null | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##'); gh pr list --repo "$repo" --state all --search "reviewed-by:@me -author:@me updated:>=$(date +%Y-%m-%d)" --json number,title,state,author --limit 20 2>/dev/null || echo "gh CLI not configured or no reviewed PRs today"`
- Today's PRs you commented on, authored by others (current repo): !`repo=$(git remote get-url origin 2>/dev/null | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##'); gh pr list --repo "$repo" --state all --search "commenter:@me -author:@me updated:>=$(date +%Y-%m-%d)" --json number,title,state --limit 20 2>/dev/null || echo "gh CLI not configured or no commented PRs today"`
- Today's PRs you merged, authored by others (current repo): !`repo=$(git remote get-url origin 2>/dev/null | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##'); me=$(gh api user --jq .login 2>/dev/null); gh pr list --repo "$repo" --state merged --search "merged:>=$(date +%Y-%m-%d) -author:@me" --json number,title,author,mergedBy --limit 30 --jq "map(select(.mergedBy.login == \"$me\"))" 2>/dev/null || echo "gh CLI not configured or no merged PRs today"`

## Workflow

### Step 1 — Build the "Done" summary from GitHub activity (silently)

The Context block above has already pulled today's commits and PRs from the current repo, across
five signals: your commits, PRs **you authored**, PRs **you reviewed/approved**, PRs **you
commented on**, and PRs **you merged** (the last three for PRs authored by others). These are
separate queries because the acts are independent — you can comment without a formal review, or
merge a teammate's PR without leaving any review at all, so each surfaces work the others miss.
Build the draft "Done" bullets from this **internally — do NOT show this summary to the user as its
own message, and do not ask them to confirm the auto-derived bullets** (Step 2 separately asks
whether anything's *missing*). The user edits the final output by hand when they paste it into
Slack, so a confirmation round-trip on what GitHub already shows is just noise. Hold the bullets
until Step 3.

- **Verify the reviewed/commented/authored signals before trusting them — they produce false
  positives.** Those three queries filter on `updated:>=today`, which means the PR was updated
  *by anyone, for any reason* (someone else's comment, a bot, CI, a label change) — not that you
  reviewed, commented, or pushed today. `reviewed-by:@me` / `commenter:@me` / `author:@me` only
  check whether you've ever done that on the PR, at any point in its history. GitHub's search
  syntax has no "this action happened on this date" qualifier for reviews or comments, so the only
  reliable check is to look at the actual event timestamps. For every candidate from those three
  signals, run `gh pr view <number> --repo <repo> --json reviews,comments,mergedAt` and keep it
  only if a review or comment by your GitHub login (`gh api user --jq .login`) is timestamped
  today, or `mergedAt` is today. Drop anything that fails this check — even though it appeared in
  the Context block, it is not today's work. (The "you merged" signal is already exact — it
  filters on `merged:>=today`, the real merge timestamp, plus a `jq` match on `mergedBy.login` —
  so it does not need this recheck.)
- **Dedupe by PR number across ALL signals — one PR is one bullet.** A PR can appear in several
  signals at once (e.g. you commented on, reviewed, and merged the same PR). Keep a single bullet
  using the **strongest** signal, in this order: merged > reviewed/approved > commented > authored.
- If there's real activity, turn it into "Done" bullets. Collapse related commits into one bullet.
  Reference PRs by number and title (e.g. "PR #214: fix auth middleware") — never include PR URLs.
- **PRs by others that you reviewed, commented on, or merged count as your work.** Surface them as
  their own "Done" bullets, phrased by your activity rather than authorship: "Reviewed and approved
  PR #209 (session timeout patch)", "Reviewed and merged PR #214 (auth middleware fix)", or
  "Commented on PR #221 (cart drawer refactor)".
- **Your own authored PRs are Done work too — use `state` to frame them.** An **open** PR you
  opened or pushed to today → "Opened PR #71 (product carousel with tabs) — ready for review" (or
  "Updated PR #X …" if it was already open). A **merged** one → "Merged PR #X (title)".
- If all commands returned an error/empty (no git repo, `gh` not configured, or nothing today),
  leave the "Done" section to whatever the user supplies — don't fabricate bullets. The final output
  can carry a `• None` or the user's own items.

### Step 2 — Ask the two questions GitHub can't answer (up front, in one prompt)

GitHub activity covers most of **what got done today**, but it misses work that never became a
commit or PR in this repo — finished-but-unpushed work, something "ready for review" that isn't a
PR yet, or design/research/coordination. It also can't know tomorrow's plan or blockers. Ask for
these **immediately**, before producing any output, using a **single `AskUserQuestion` call with all
three questions** so there's no back-and-forth:

1. **Anything else you wrapped up today?** — catch Done work the GitHub queries didn't surface.
   Offer a `Nothing else` option first, plus selectable options derived from context (open authored
   PRs, today's local commits / current-branch work that isn't yet a PR), plus free-text "Other".
   Merge any picks into the Done section alongside the auto-derived bullets.
2. **What are you working on tomorrow?** — offer a few selectable options derived from context
   (in-progress PRs, unfinished threads from today's commits, obvious next steps), plus the
   always-present free-text "Other".
3. **Any blockers or open questions?** — offer `None` as the first option, plus any plausible
   blockers you can infer from context, plus free-text "Other".

All three questions are **always required** — never skip them, never fill them in yourself. The user
either picks an option or types their own answer. Once they're answered, go straight to Step 3 and
emit the full update. Do not ask anything else first.

### Step 3 — Output the full update

Format using this template and present it inside a fenced code block so the user can copy-paste it
straight into Slack:

```
EOD Update [DD-MM-YYYY]
[optional intro sentence if the user provided one]

Done:
• [item]

Doing:
• [item]

Blockers:
• [item, or "None"]

Notes:
[notes if any — otherwise omit this section entirely]
```

**Formatting rules:**
- Plain text only — no markdown of any kind (no asterisks, no backticks, no underscores) and
  no emojis, anywhere in the output.
- Bullets use `•`, not `-` or `*`.
- Date is DD-MM-YYYY (e.g. 29-05-2026).
- Blockers section is always present — write `• None` if there are none.
- Omit the Notes section entirely if the user has nothing to add.
- One concise line per bullet, plain language. Reference PRs by number and title only — never
  include PR or commit URLs.
- Clean and structured tone, no conversational filler.

Emit the code block and stop — no preamble, no "does this look right?", no offer to edit. The user
copies it into Slack and tweaks it there. If they explicitly ask for a change, apply it and re-show.
**Do not post it anywhere — the user copies it into Slack themselves.**

## Example output

```
EOD Update 29-05-2026
Wrapped up the auth work and got a head start on rate limiting.

Done:
• Opened PR #221 (rate-limit middleware) — ready for review
• Merged PR #214: fix null pointer in auth middleware
• Reviewed and approved PR #209 (session timeout patch)
• Traced slow query on /api/orders to a missing index

Doing:
• Add DB index migration for the orders table
• Start rate limiting for the public API (DEV-88)

Blockers:
• Need sign-off on rate-limit thresholds before finalising DEV-88

Notes:
Deploy window is Thursday morning — aiming to have the migration ready by then.
```

## Edge cases

- No GitHub activity / `gh` not configured: don't announce it — just go straight to the Step 2
  questions and build the update from the user's answers (Done can be `• None` or their own items).
  Note that GitHub returning nothing doesn't mean nothing got done — the "anything else?" question
  is exactly how a real day still produces a populated Done section.
- Not run from inside a repo: the git/`gh` commands need the repo as the working directory. Build
  the update from the Step 2 answers alone, and mention the user can re-run from the repo for the
  auto-derived bullets.
- User provides everything manually up front: use what they give you; skip the questions they've
  already answered.
- User runs the skill with no context: jump straight to the Step 2 questions.
- Always ask the three Step 2 questions (anything-else + tomorrow + blockers) in one
  `AskUserQuestion` prompt before emitting output — GitHub can't fully supply them, and they're
  required every time.
- User asks to tweak the output: edit and re-show — never post.
