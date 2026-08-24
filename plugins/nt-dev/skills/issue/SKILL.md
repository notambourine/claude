---
name: issue
description: Create or revise a GitHub issue with the repository's title, body, milestone, labels, project fields, and parent relationship. Use for filing tickets or editing issue scope and acceptance.
allowed-tools: Bash, Read, Grep, Glob
argument-hint: "[issue-number-to-edit]"
---

# GitHub issue

Use an authenticated `gh` CLI from the target repository. Discover its conventions before writing; never import names from another project.

```bash
REPO=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
OWNER=${REPO%%/*}
gh api "repos/$REPO/milestones" --jq '.[].title'
gh label list --repo "$REPO" --limit 100
gh project list --owner "$OWNER" --format json
gh issue list --repo "$REPO" --limit 10 --json number,title,labels,milestone
```

If `.github/ISSUE_TEMPLATE/` contains an applicable form or template, follow its headings exactly. Otherwise use the shapes below.

## Title and hierarchy

Name the outcome, not the activity: `Serve every sitemap from the app and retire the standalone EC2 box`, not `Sitemap work`. Improve a vague title whenever editing its issue.

Preserve the repository's numbering convention for epics and children. A title prefix does not establish hierarchy; link the child:

```bash
gh issue edit <child> --repo "$REPO" --parent <epic>
```

## Body

Keep the body within 120 words and comments within 80. State the desired outcome, scope boundary, and observable acceptance. Use one bullet level. Link decisions that live elsewhere instead of restating them.

Default shape:

```markdown
Parent: #849

## Outcome

Give merchants a searchable, read-only view of each product's effective customizer configuration.

## Scope

- Search products across the selected store.
- Show the source and scope of each effective value.
- Exclude store mutations.

## Acceptance

- A merchant can find a product and understand what shoppers see.
- Every displayed value names its source.
```

Write at the issue reader's altitude. Prefer user-visible behavior and business rules. Include implementation detail only when it changes the work or a decision. Do not add a delivery plan, implementation checklist, tutorial, or closing recap.

### Design work

Use four bold leads:

- `**Goal:**` the result in one sentence.
- `**Context:**` the design reference; include `Replaces: <live URL>` and `Figma: <node URL>` when applicable.
- `**Dev Notes:**` the verified component, token, or pattern to reuse, cited as `path/to/File.tsx`. Never leave this empty.
- `**Done when:**` the observable route, theme, and design result.

### Engineering work

Lead with measured reality, the constraint, then the target state. Date measurements. Cite `file.ts:155` only behind claims the implementer would otherwise have to rediscover. Use at most one table or ASCII diagram. Name prerequisites and open questions explicitly.

Do not include a slice plan, work checklist, or traps section. Use child issues for planned slices and a concise code comment for a point-of-use trap.

## Metadata

Populate the fields the repository actually uses. Check project-field adoption before choosing them:

```bash
gh project item-list <number> --owner "$OWNER" --format json \
  | jq '[.items[].fieldValues // {} | keys[]] | group_by(.) | map({field: .[0], filled: length})'
```

- Set a milestone from the repository's list.
- Add one surface label, one type label, and only necessary domain or process labels.
- Set the project single-select fields the board consistently uses. Keep duplicated labels and fields aligned.
- Set a new item's status to `Backlog`. Promote it only after the milestone and acceptance are settled.

```bash
gh project field-list <number> --owner "$OWNER" --format json
gh project item-list <number> --owner "$OWNER" --format json
gh project item-edit --project-id <project-id> --id <item-id> \
  --field-id <field-id> --single-select-option-id <option-id>
```

## Revisions

Edit new information into the relevant section instead of appending a running log. Use a dated comment only for a decision or result. Represent remaining work by editing Scope or creating children. Fix the title and missing metadata in the same pass.

The plugin's `hooks/gh-skill-nudge.mjs` directs unscoped issue creation here. `NT_DEV_SKILL_NUDGE` accepts `strict`, `off`, or the default advisory behavior. The hook routes; it does not validate the issue.
