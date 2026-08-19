---
name: weekly-recap
description: >-
  Generate a non-technical weekly development recap of the current repo for
  project managers and executives. Pulls merged PRs, open PRs, and commits
  from the chosen window (default: the past 7 days) and synthesizes a
  plain-English summary of what shipped, what is in review, and what is in
  progress. No per-person stats, no code-level detail. Trigger on "weekly dev
  recap", "weekly recap", "what did the team ship this week", or any request
  for a week-level development summary for a non-technical audience. This
  skill never posts anywhere - the user copies the output themselves.
allowed-tools:
  - Bash(gh pr list:*)
  - Bash(git log:*)
  - Bash(git for-each-ref:*)
  - Bash(git symbolic-ref:*)
  - Bash(date:*)
  - Bash(echo:*)
---

# Weekly Dev Recap

Write a plain-English weekly development summary for a non-technical audience: project managers
and executives. The goal is visibility into what shipped, what the team is building, and what
problems got solved. No attribution, no jargon, no code-level detail.

The skill needs `git` and, for PR context, the `gh` CLI. Run it from inside the repo being
summarized. The date commands below carry both spellings, macOS BSD `date -v` first and GNU
`date -d` (Linux, Windows Git Bash) as the fallback.

## Step 0 - Choose the reporting window

Settle the window before writing anything:

- If the user already named one ("last two weeks"), use it.
- Otherwise ask with AskUserQuestion, offering 1, 2, 3, or 4 weeks.

The Context block below is pre-fetched for the default 1-week window. For a longer window, re-run
the same `gh` and `git` queries with the day count (weeks x 7) wherever `7d` or `"7 days ago"`
appears, and use those results instead. Label the heading with the full chosen span.

## Context (pre-computed at skill load, 1-week window)

- Date range: !`echo "$(date -v-7d +%Y-%m-%d 2>/dev/null || date -d "7 days ago" +%Y-%m-%d) to $(date +%Y-%m-%d)"`
- Default branch: !`git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null || echo "origin/main (assumed - origin/HEAD unset)"`
- Merged PRs: !`gh pr list --state merged --search "merged:>$(date -v-7d +%Y-%m-%d 2>/dev/null || date -d "7 days ago" +%Y-%m-%d)" --json number,title,mergedAt,labels,body,author --limit 50 2>/dev/null || echo "gh CLI not configured or no merged PRs found"`
- Open PRs (all contributors): !`gh pr list --state open --json number,title,updatedAt,labels,body,isDraft,author,reviewDecision --limit 50 2>/dev/null || echo "gh CLI not configured or no open PRs found"`
- Recent commits (all branches): !`git log --all --since="7 days ago" --no-merges --format="%an: %s [%D]" 2>/dev/null | head -80`
- Active branches not yet on the default branch: !`D=$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null || echo origin/main); B=${D#origin/}; git for-each-ref --sort=-committerdate refs/heads refs/remotes --format="%(refname:short) - last commit %(committerdate:relative) by %(authorname)" 2>/dev/null | grep -vE "HEAD|^origin |^${B} |^origin/${B} " | head -20`
- Contributors this window: !`gh pr list --state merged --search "merged:>$(date -v-7d +%Y-%m-%d 2>/dev/null || date -d "7 days ago" +%Y-%m-%d)" --json author --jq '[.[].author.login] | unique | join(", ")' 2>/dev/null`

Below, "the default branch" means the **Default branch** value from this block.

## Instructions

### Step 1 - Filter the raw data

- **Shipped**: commits that landed on the default branch this window, plus merged PRs. Collapse
  related commits into one bullet.
- **In Progress**: active branches with commits this window that have not merged yet. One bullet
  per feature area. Sub-bullet a branch that is a sub-task of another.
- **In Review**: branches or PRs from the core team that are done and waiting to merge. Only
  include work touched in the last two weeks or so. Ignore stale community PRs from outside
  contributors who do not commit to this repo regularly.
- **Whole-team coverage**: the recap has to represent every contributor's output. Treat the
  merged-PR list as authoritative for Shipped. The raw commit log over-weights contributors with
  many small local commits and under-weights squash-merged work, so never infer coverage from
  commit counts. Before finalizing, confirm every contributor from the window appears somewhere.
- Skip: commits from bots and automated integrations (Dependabot, sync and import bots, `[bot]`
  authors), empty-body PRs, dependency bumps, and doc-only changes, unless one of them is a real
  milestone.

### Step 2 - Write the recap

**Format:**

```
📅 Weekly Dev Recap for [Mon D] - [Mon D, YYYY]

🚀 Shipped
- [short noun phrase or feature name]

🔨 In Progress
- [short noun phrase]
  - [sub-item if it belongs to the above]

👀 In Review
- [short noun phrase, what is done and waiting to merge]
```

Drop any section with no items.

**Style rules:**

- **Emoji sits on the title and the three section headers, and nowhere else.** Never in a bullet
  or a sub-bullet, never a second emoji on a header. Use exactly these four: 📅 title, 🚀 Shipped,
  🔨 In Progress, 👀 In Review.
- **Bullets are short noun phrases, not sentences.** Three to eight words. "Custom footer", not
  "A custom footer section was built with column layout and accordion navigation."
- Add a qualifier only when the noun phrase alone is ambiguous. "Custom footer" is fine. "Custom
  footer - mobile-first with accordion nav" is fine when the extra context earns its place.
- No "Customers can now...", no "The site now...", no "The team is working on...". Name the thing.
- No PR numbers, commit hashes, branch names, file names, or function names.
- No individual attribution.
- Collapse related work into one bullet, with sub-bullets when it helps.
- ASCII punctuation. Hyphens, straight quotes, straight apostrophes. No em dash, no en dash, no
  curly quotes.

## Edge cases

- **`gh` not configured:** fall back to the commit log and the branch list, and warn that
  squash-merged work is under-represented without the merged-PR list.
- **Not run from inside a repo:** the git and `gh` commands need the repo as the working
  directory. Ask the user to run it from the repo they want summarized.
- **`origin/HEAD` unset** (fresh or minimal clone): the Context block assumes `origin/main`. If
  the repo's default branch differs, ask the user rather than guessing.
