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
📅 **Weekly Dev Recap: Mon D - Mon D, YYYY**

🚀 **Shipped**

* **Label:** Outcome in one short sentence.

🔨 **In Progress**

* **Label:** Outcome in one short sentence.

👀 **In Review**

* **Label:** Outcome in one short sentence.
```

Omit empty sections. Exactly these four emoji, blank line under each header.

Collapse to one bullet per theme, not per PR. Label is a bolded one-or-two-word noun for
the surface that changed. Body is one declarative sentence naming the effect. Whole block
under 200 words.

Widely read shorthand is fine (9s, 404, RSS, zip). No PRs, hashes, branches, files,
functions, deeper jargon, stock openings, or people. Missing `gh`: use git and warn.
Missing repo: ask for it. Unclear default branch: ask.
