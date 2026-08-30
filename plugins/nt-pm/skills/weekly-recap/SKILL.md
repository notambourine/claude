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

# Weekly recap

Draft only. Whole team; no attribution. Use named window; otherwise ask 1-4 weeks. Compute
inclusive dates with available BSD/GNU `date` syntax.

Collect merged PRs since start, all open PRs, recent non-merge commits, recently touched
branches. Merged PRs define Shipped. Open merge-ready core PRs define In Review. Active
unmerged branches define In Progress. Represent each merged contributor's work, then remove
names. Collapse related work. Skip bots, imports, dependency bumps, empty PRs, and immaterial
docs.

Return only:

```text
📅 Weekly Dev Recap for Mon D - Mon D, YYYY

🚀 Shipped
- Short feature name

🔨 In Progress
- Short feature area

👀 In Review
- Completed work awaiting merge
```

Omit empty sections. Exactly these four emoji. Bullets: 3-8-word noun phrases; brief
qualifier only when needed. ASCII. No PRs, hashes, branches, files, functions, jargon,
stock openings, or people. Missing `gh`: use git and warn. Missing repo: ask for it.
Unclear default branch: ask.
