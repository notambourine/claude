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

Draft only. Whole team. Output obeys [../../recap-format.md](../../recap-format.md). Use
named window; otherwise ask 1-4 weeks. Compute inclusive dates with available BSD/GNU
`date` syntax.

Collect merged PRs since start, all open PRs, recent non-merge commits, recently touched
branches. Merged PRs define Shipped. Open merge-ready core PRs define In Review. Active
unmerged branches define In Progress. Represent each merged contributor's work, then remove
names. Skip empty PRs.

Return only:

```text
📅 **Weekly Dev Recap: Mon D - Mon D, YYYY**

🚀 **Shipped**

* **Label:** Outcome in one short sentence.

🔨 **In Progress**

* **Label:** Outcome in one short sentence.

👀 **In Review**

* **Label:** Outcome in one short sentence.
```

Exactly these four emoji, in this order.

Missing repo: ask for it. Unclear default branch: ask.
