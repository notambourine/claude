---
name: issue
description: Create or revise a GitHub issue.
allowed-tools: Bash, Read, Grep, Glob
argument-hint: "[issue-number-to-edit]"
---

# GitHub issue

Use authenticated `gh` in target repo. Discover recent conventions, milestones, labels,
projects, hierarchy. Never borrow metadata across projects.

Use an applicable committed form or template from the target repo's `.github/ISSUE_TEMPLATE/`
or `.github/issue_template.md`, and follow its headings exactly. Without one, use this skill's
[.github/issue_template.md](.github/issue_template.md).

Title: outcome, not activity or mechanism. Body: problem, scope, constraints, context,
observable acceptance. User behavior and business rules first. Implementation only when
decided or costly to rediscover. Link decisions; do not repeat them.

Design work replaces the default headings with four bold leads: `**Goal:**` the result in one
sentence, `**Context:**` the design reference plus `Replaces:` and `Figma:` URLs when they
exist, `**Dev Notes:**` the verified component or token to reuse cited as `path/to/File.tsx`
and never empty, `**Done when:**` the observable route, theme, and design result.

Engineering work keeps the headings and leads with dated measurements, then the constraint,
then the target state. Cite `file.ts:155` only behind claims the implementer would otherwise
rediscover. At most one table or diagram. Name prerequisites and open questions.

No delivery plan, tutorial, speculative solution, recap, or fake hierarchy. Use child issues
and real parent links.

Set only used milestone, labels, fields, status, parent. Align duplicated metadata. Revisions
integrate facts in place; comments only for dated decisions or results.
