---
name: weekly-recap
description: Summarize a repo's shipped, in-review, and in-progress work for PMs and executives. Use for non-technical weekly recaps; never post it.
allowed-tools:
  - Bash(gh pr list:*)
  - Bash(git log:*)
  - Bash(git for-each-ref:*)
  - Bash(git symbolic-ref:*)
  - Bash(date:*)
  - Bash(echo:*)
---

# Weekly development recap

Write a non-technical summary of what shipped, what is waiting for review, and what remains in progress. Cover the whole team without naming individuals. Never post the result.

## Choose the window

Use the period the user names. Otherwise ask them to choose one, two, three, or four weeks. Compute the inclusive date range with BSD `date -v` on macOS or GNU `date -d` elsewhere.

```bash
START=$(date -v-7d +%Y-%m-%d 2>/dev/null || date -d "7 days ago" +%Y-%m-%d)
END=$(date +%Y-%m-%d)
```

Replace seven days with the selected window in every query.

## Gather the record

Run from the repository being summarized:

```bash
DEFAULT=$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null || echo "origin/main")
gh pr list --state merged --search "merged:>$START" --json number,title,mergedAt,labels,body,author --limit 50
gh pr list --state open --json number,title,updatedAt,labels,body,isDraft,author,reviewDecision --limit 50
git log --all --since="7 days ago" --no-merges --format="%an: %s [%D]" | head -80
B=${DEFAULT#origin/}
git for-each-ref --sort=-committerdate refs/heads refs/remotes --format="%(refname:short) - last commit %(committerdate:relative) by %(authorname)" \
  | grep -vE "HEAD|^origin |^${B} |^origin/${B} " | head -20
```

Treat merged PRs as authoritative for shipped work; commit counts distort contribution and miss squash merges. Confirm that every contributor with a merged PR in the window has work represented, but remove attribution from the output.

Classify:

- `Shipped`: merged PRs and commits that reached the default branch during the window. Collapse related work.
- `In Review`: recent, merge-ready core-team PRs. Exclude stale community work.
- `In Progress`: active unmerged branches touched during the window, grouped by feature area.

Skip bots, automated imports, dependency bumps, empty-body PRs, and documentation-only changes unless they represent a meaningful milestone.

## Output

Return only the recap:

```text
📅 Weekly Dev Recap for Mon D - Mon D, YYYY

🚀 Shipped
- Short feature name

🔨 In Progress
- Short feature area
  - Related sub-item

👀 In Review
- Completed work awaiting merge
```

Remove empty sections. Use exactly those four emoji and only on the title and section headings. Bullets are three-to-eight-word noun phrases, with a short qualifier only when needed. Use ASCII punctuation. Do not include PR numbers, hashes, branches, files, functions, jargon, sentences beginning with "Customers can now" or "The team is working on", or individual attribution.

If `gh` is unavailable, use commits and branches and warn that squash-merged work may be missing. If the repository cannot be found, ask the user to run from it. If `origin/HEAD` is unset and `origin/main` is not clearly correct, ask for the default branch.
