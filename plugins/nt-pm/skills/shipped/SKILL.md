---
name: shipped
description: Draft plain-English Slack deploy notes for work about to ship or the last observed production push. Use for deploy previews and retrospective release summaries; never deploy or post the result.
disable-model-invocation: true
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

# Deploy updates

Write Slack-ready, non-technical release notes for work that is about to ship or just shipped. Never deploy and never post the result.

## Choose the mode

- `Pre-deploy` is the default for phrases such as "about to ship", "deploy preview", and release notes before promotion. Compare the default branch with a named promotion branch, the first existing branch among `dev`, `staging`, `develop`, and `release`, or `HEAD` when none exists.
- `Retrospective` handles "what shipped", "just shipped", and last-release requests. Compare the previous and current observed tips of the remote default branch: `<default>@{1}..<default>@{0}`.

If the wording remains ambiguous, choose pre-deploy and say so in the boundary confirmation.

## Refresh and resolve

Fetch before reading any remote-tracking ref:

```bash
git fetch origin --quiet
DEFAULT=$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null || \
  { git rev-parse -q --verify origin/main >/dev/null && echo origin/main; } || echo origin/master)
PROMOTE=""
for b in dev staging develop release; do
  git rev-parse -q --verify "origin/$b" >/dev/null && { PROMOTE="origin/$b"; break; }
done
```

Stop if fetch fails. Stale refs cannot support release notes.

For pre-deploy, use `<default>..<promotion-or-HEAD>`. A user-named branch wins. For retrospective, inspect the reflog:

```bash
git reflog show "$DEFAULT" --date=iso | head -5
```

The reflog records moves observed by this clone. A quiet clone may combine multiple pushes into one step. If the user asks for a wider span, accept a reflog entry, SHA, tag, or date. Resolve a date with:

```bash
git rev-list -1 --before="<date> 23:59" "$DEFAULT"
```

## Confirm the boundary

Resolve both endpoints, short SHAs, dates, and commit count. Show this and wait:

```text
mode: <pre-deploy | retrospective>
prev: <short SHA> (<date>) -> target: <short SHA> (<date>)
<N> commits in range - write the deploy update? [y / pick a different point]
```

Do not continue without confirmation. For zero commits, say that nothing is pending or nothing shipped.

## Recover the story

After confirmation, inspect the range without exposing its identifiers in the final output:

```bash
git log --no-merges --format="%H%x09%ad%x09%s" --date=short <prev>..<cur>
```

For each commit:

1. Read a referenced PR with `gh pr view <number> --json number,title,body,labels`.
2. If the inline number is an issue or absent, find the PR by SHA with `gh pr list --state merged --search "<sha>" --json number,title`.
3. When the PR body is empty, read linked issues and `git show --stat --format="%s" <sha>`. Do not trust a terse subject to define scope.
4. Without PR or issue context, translate the commit subject directly.
5. Exclude uncertain work already present at the starting point. `git merge-base --is-ancestor <sha> <prev>` exits zero when it was already shipped.

Group content under headings that fit, commonly `Features`, `Fixes`, `Admin / internal`, `Behind the scenes`, `SEO / marketing`, or `Performance`. Omit empty groups. Split a PR across categories when it delivered distinct outcomes. Collapse related work and routine dependency or CI housekeeping.

## Output

Return only a fenced plain-text block:

```text
M/D/YY Deploy Updates

Features
- Name - plain-language explanation of what changed and why it matters

Fixes
- Name - plain-language explanation
```

Use the requested deploy date or today's `M/D/YY` without leading zeros. Category labels are plain lines and bullets begin `- `. Use ASCII punctuation, one line per bullet, and no emoji or Markdown inside the fence. Omit PR numbers, hashes, branches, files, functions, database terms, attribution, and openings such as "Customers can now" or "The site now".

If `gh` is unavailable, translate commit subjects and warn that the wording may be coarser. If the retrospective reflog is empty, request a date, tag, or SHA. If no origin exists, ask the user to run from the deployment repository. Apply later wording changes to the complete block. Never post or deploy.
