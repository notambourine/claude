---
name: shipped
description: >-
  Produce a plain-English "Deploy Updates" summary for Slack of what shipped or
  is about to ship on the current repo, grouped by category for a non-technical
  audience. TWO MODES, auto-detected from phrasing. PRE-DEPLOY (the default):
  diff the promotion branch (dev/staging) — or the current branch — against the
  default branch: "what will ship when I promote or merge this." Trigger on
  "what am I about to ship", "what's about to deploy", "deploy preview", or any
  request for release notes BEFORE promoting. RETROSPECTIVE: diff the last push
  to the default branch via its reflog — "what shipped in the last deploy."
  Trigger on "what shipped", "what just shipped to prod", "deploy notes for the
  last release". This skill NEVER posts anywhere and NEVER deploys — it only
  writes the summary for the user to copy into Slack themselves.
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

# shipped — plain-English deploy notes

Write a **Deploy Updates** summary — plain-English release visibility for the team, PMs, and
execs — of what shipped or is about to ship on the current repo. The output is Slack-ready text
grouped by category. **This skill never posts anywhere and never runs the deploy** — it only
writes the summary; the user copies it into Slack and runs the promotion themselves.

The skill needs `git` and, for readable bullets, the `gh` CLI. It works with any promotion style:
a repo that promotes by moving the default branch onto a long-lived branch (`dev`, `staging`), and
a repo that deploys on every merge or push to the default branch. Both modes reduce to one commit
range; everything after that is the same.

## Context (pre-computed at skill load)

These run at load time so every ref below is fresh — the fetch runs FIRST. If the fetch line
reports a failure, stop (see Step 1).

- Repo: !`git remote get-url origin 2>/dev/null | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##' || echo "no origin"`
- Today: !`date +%m/%d/%y | sed 's#^0##; s#/0#/#'`
- Fetch (runs FIRST so every ref below is fresh): !`git fetch origin --quiet 2>/dev/null && echo "ok" || echo "FETCH FAILED — do not proceed on stale refs"`
- Default branch: !`git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null || (git rev-parse -q --verify origin/main >/dev/null && echo origin/main || echo origin/master)`
- Promotion branch: !`found=""; for b in dev staging develop release; do git rev-parse -q --verify "origin/$b" >/dev/null && { found="origin/$b"; break; }; done; echo "${found:-none — pre-deploy compares the current branch}"`
- Retrospective range (default-branch reflog, newest first; empty = no observed moves yet): !`D=$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null || echo origin/main); git reflog show "$D" --date=iso 2>/dev/null | head -6`

Below, `<default>` means the **Default branch** value and `<promote>` the **Promotion branch**
value from this block.

## Step 0 — Pick the mode from the user's phrasing

Two modes, same output format, different commit range. Choose before doing anything else:

- **Pre-deploy (default)** — the user is *about* to deploy and wants to see what the next
  promotion or merge will carry: "what am I about to ship", "deploy preview", release notes before
  promoting. Range: `<default>..<promote>` when a promotion branch exists, otherwise
  `<default>..HEAD` (the current branch is what's about to merge). If the user names a branch,
  theirs wins over the detected one.
- **Retrospective** — the user wants what *already* shipped in the most recent push to the default
  branch: "what shipped", "what just went to prod", "notes for the last release". Range: the last
  move of `<default>`, from its reflog (`<default>@{1}..<default>@{0}`).

If the phrasing is genuinely ambiguous, default to **pre-deploy** (it's the more common ask right
before a promotion) but say which mode you picked in your one-line boundary confirmation so the
user can redirect. Don't stall on the choice.

## Step 1 — Fetch first, always

**Non-negotiable: `git fetch` before reading any ref.** Remote-tracking refs and the reflog only
reflect positions this clone has already observed — a stale local ref is exactly what produces
notes that describe the wrong range (work from an earlier deploy, or work that's already shipped).

The Context block above already ran `git fetch origin` at load time, so its branch values and
reflog are fresh — use them. If that Fetch line reported `FETCH FAILED` (no network/auth), say so
and stop; do not fall back to a stale ref. Only re-run the fetch manually if a lot of time has
passed since the skill loaded and you suspect the branches moved.

## Step 2 — Establish and CONFIRM the boundary before writing

Resolve `prev` and `cur` for the chosen mode, then show the user a one-line boundary and the commit
count and get a thumbs-up. This confirmation is the safeguard against a stale or wrong-range summary
— it costs one line and catches the mistake that's most expensive to discover after the fact.

**Pre-deploy:**
```bash
git rev-parse --short <default> <promote-or-HEAD>
git rev-list --count <default>..<promote-or-HEAD>
```
`prev` = `<default>` tip, `cur` = the promotion (or current) branch tip.

**Retrospective:**
```bash
git reflog show <default> --date=iso | head -5
git rev-list --count '<default>@{1}..<default>@{0}'
```
`prev` = `<default>@{1}`, `cur` = `<default>@{0}`. The reflog records the moves **this clone
observed** — if it fetched rarely, one reflog step may span several pushes; say so if the dates
look far apart. If the user wants to span **multiple** pushes ("since Friday"), let them pick an
earlier reflog entry (`@{2}`, `@{3}`, …) or paste a SHA/date; resolve a date with
`git rev-list -1 --before="<date> 23:59" <default>`.

Show it like this and wait for confirmation (don't proceed to Step 3 until the range is set):

```
mode: <pre-deploy | retrospective>
prev: <short SHA> (<date>)   →   target: <short SHA> (<date>)
<N> commits in range — write the deploy update? [y / pick a different point]
```

**Zero commits in range:** tell the user nothing is pending (or nothing shipped) — don't fabricate
bullets.

## Step 3 — Map commits to PRs and issues (silently)

List the commits and pull human-readable context. Do this quietly — none of these identifiers
appear in the final output; they're only how you learn what each change actually was.

```bash
git log --no-merges --format="%H%x09%ad%x09%s" --date=short <prev>..<cur>
```

For each commit, get the plain-language story:

- **Subject carries `#<number>`** (squash and merge commits both do): that's usually the PR. Read it
  for a real title + description:
  `gh pr view <number> --json number,title,body,labels`
- **The `#<number>` in the subject is a tracking *issue*, not the PR** (or the commit has no number
  at all): find the PR by commit SHA —
  `gh pr list --state merged --search "<sha>" --json number,title`
  (Learned the hard way: a commit cited its tracking issue inline while the actual PR was a
  different number entirely. Trust the SHA search over the inline `#`.)
- **PR body is empty** (it happens): don't guess from the terse subject. Recover the real scope two
  ways — read the linked issue(s) named in the PR/subject (`gh issue view <n> --json title,body`),
  and look at what the commit actually touched (`git show --stat --format="%s" <sha>`). A commit
  titled like a one-line typo fix has turned out to ship a whole internal admin tool. The diff
  doesn't lie; the subject sometimes does.
- **No PR and no issue:** use the commit subject directly, translated to plain language.

**Guard against already-shipped work:** if you're unsure whether something is genuinely new in the
range, verify with `git merge-base --is-ancestor <sha> <prev>` — exit 0 means it was already on
the default branch before this range, so exclude it. This is the check that catches a headline
feature that actually landed in an earlier deploy.

## Step 4 — Categorize and translate to plain language

- **Categories follow the content, not a fixed list.** Group bullets under whichever headers fit
  what actually shipped. Common ones, in this rough order: `Features`, `Fixes`,
  `Admin / internal`, `Behind the scenes`. Omit any category with nothing in it; add a header if
  the content calls for one (`SEO / marketing`, `Performance`, …).
- **A single PR can split across categories.** One PR has shipped both a user-facing fix and an
  internal admin tool — put each half where it belongs rather than forcing one bullet.
- **Collapse chores.** Dependency bumps, lockfile refreshes, CI/test-infra changes, and similar
  housekeeping become one bullet ("Routine dependency and CI housekeeping") — or are omitted if the
  audience is purely feature-facing. Never list them individually. Collapse related commits/PRs into
  one bullet too.
- **Each bullet:** a short plain-language name, an em-dash, then a one-line explanation of what it
  means for a user or the team. Non-technical throughout.

## Step 5 — Output

Emit inside a fenced code block so it pastes straight into Slack, then stop. No preamble, no "does
this look right?" — the boundary was already confirmed in Step 2.

```
<M/D/YY> Deploy Updates

Features
- <Name> — <plain-language explanation of what changed and why it matters>

Fixes
- <Name> — <plain-language explanation>

Admin / internal
- <Name> — <plain-language explanation>
```

**Formatting rules:**

- **Non-technical, plain English.** No PR numbers, commit hashes, branch names, file names,
  function names, or table/column names in the output — those were for your mapping only.
- No markdown headers or bold, no emojis. Category labels are plain text lines; bullets use `- `.
- Date is `M/D/YY` with no leading zeros (e.g. `7/23/26`), followed by ` Deploy Updates`. Use the
  **Today** value from the Context block above (already formatted); if the user names a specific
  deploy date, use theirs instead.
- One line per bullet: Name — explanation.
- Omit empty categories entirely.
- No individual attribution, no "Customers can now…", no "The site now…" — name the thing and say
  what it does.

If the user asks for a change (scope, wording, a softened security line), apply it and re-show.
**Do not post it anywhere and do not run the deploy — the user handles both.**

## Example output (pre-deploy mode)

```
7/23/26 Deploy Updates

Features
- Desktop search — the homepage gets a proper desktop search dropdown (desktop previously reused the mobile popup), with removable filter badges and a location choice that carries across page loads

Fixes
- Fixed a misspelled page address and added a redirect so existing links and bookmarks to the old address still land on the right page
- Navigation menu now matches the live catalog — added one new entry, removed one that's no longer offered

Admin / internal
- New admin tool to rename page addresses and manage redirects
- Project board now updates itself — shipped tickets move to "Shipped" automatically on each production deploy
- Added an automated test suite that checks data-changing endpoints in CI before every deploy
```

## Edge cases

- **Fetch failed** (no network / auth): say so and stop — never fall back to a stale local ref.
- **Reflog empty in retrospective mode** (fresh clone, or this clone never saw the default branch
  move): the reflog can't supply the boundary. Ask the user for one — a date ("what shipped since
  Friday"), a tag, or a SHA — and resolve it with `git rev-list -1 --before=…` as in Step 2.
- **`gh` not configured:** fall back to raw commit subjects for the bullets; warn that the
  plain-language translation is coarser without PR/issue context.
- **Not run from inside a repo:** the git/`gh` commands need the repo as the working directory.
  If they can't find `origin`, ask the user to run from the repo they're deploying.
- **User asks to tweak the output:** edit and re-show — never post, never deploy.
