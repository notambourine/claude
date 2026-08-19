---
name: issue
description: Write or update a GitHub issue to the house standard - title, body shape, milestone, labels, project fields, epic parent. Trigger on "open an issue", "file an issue", "write this up as a ticket", "flesh out issue #N", "add detail to this issue", or any request that ends in `gh issue create` / `gh issue edit`.
allowed-tools: Bash, Read, Grep, Glob
argument-hint: "[issue-number-to-edit]"
---

# Issue standard

Needs the `gh` CLI, authenticated, run from inside the repo. `jq` for the project-field lookups.

## Read the repo before you write

Every name below is per-repo. Never carry one over from another project, and never guess one.
Read them:

```bash
REPO=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
OWNER=${REPO%%/*}
gh api "repos/$REPO/milestones" --jq '.[].title'
gh label list --repo "$REPO" --limit 100
gh project list --owner "$OWNER" --format json          # number + id of each board
gh issue list --repo "$REPO" --limit 10 --json number,title,labels,milestone
```

The last one is the fastest read on house style: match the titles and the label pattern already on
the board. Where the repo ships issue forms under `.github/ISSUE_TEMPLATE/`, they are the section
contract. Follow their headings verbatim and skip this file's body shapes.

## Title

State the outcome, not the chore: `Serve every sitemap from the app and retire the standalone EC2
box`, never `Sitemap work`. Rewrite a vague title whenever you touch the issue.

Work in a numbered tree carries its code, and the codes are the repo's, not this file's: an epic
reads `E3 · Routing, /start cutover, redirect map`, its child `E3.2 /start edge cutover`. A code in
the title is a label, not a link. Link the child for real:

```bash
gh issue edit <child> --repo "$REPO" --parent <epic>
```

## Body - design and section work

Four bolded leads, in this order. An empty `**Dev Notes:**` is a smell, not a pass.

- `**Goal:**` one sentence, what gets built.
- `**Context:**` the design screenshot, plus `Replaces: <live URL>` and `Figma: <node-id link>`
  when the page already exists.
- `**Dev Notes:**` the component or token to reuse, cited as `path/to/File.tsx`. Grep before you
  write this. It is where the implementer saves an hour.
- `**Done when:**` the observable end state, say renders on its route in both themes and matches
  the design.

## Body - engineering work

Lead with measured reality, then the constraint, then the target state:

- facts with a date attached, not adjectives ("all measurements taken 2026-08-04")
- `file.ts:155` behind every claim about the code, quoting the comment that already anticipates
  the change
- a table or ASCII diagram of today against target
- the prerequisite named as a prerequisite, with why it is not just cleanup
- open questions under their own heading, so nobody guesses

## Metadata

Fill these every time, and fill only the fields the board actually uses. Check the fill rate before
adding a field to your habit. A field nobody populates is dead, and writing to it costs a pass and
buys nothing:

```bash
gh project item-list <number> --owner "$OWNER" --format json \
  | jq '[.items[].fieldValues // {} | keys[]] | group_by(.) | map({field: .[0], filled: length})'
```

- **Milestone** - required. Pick from the repo's own list, above.
- **Project fields** - set the single-selects the board leans on (workstream, status). Where a
  field duplicates a label, set both and keep them in agreement.
- **Labels** - one surface, one type (`bug`, `enhancement`, `documentation`), then domain as
  needed. Some labels carry process meaning rather than topic, and those are the ones to get
  right: unblocked-but-needs-info, blocked-on-a-human-decision, and time-boxed research each route
  the issue differently.
- **Status** - `Backlog` on create. Move it to prioritized only once the milestone and the
  Done-when are both settled.

```bash
gh project item-edit --project-id <project-id> --id <item-id> \
  --field-id <field-id> --single-select-option-id <option-id>
# ids:     gh project field-list <number> --owner "$OWNER" --format json
# item-id: gh project item-list  <number> --owner "$OWNER" --format json
```

## Updating an issue

Edit into the shape, never append a log. A new finding goes under the heading it belongs to. A
comment is for a decision or a result, dated. Fix the title and backfill the missing metadata in
the same pass.

## The hook behind this file

This skill only fires when something in the prompt trips its description. "File this as a ticket"
does; "also open an issue for the flaky test" often does not, and the issue that lands has no
milestone, no label, and a one-line body.

So the plugin ships `hooks/gh-issue-standard.mjs`, a `PreToolUse` hook that reads a `gh issue
create` before it runs and names what is missing against the parts of this file a hook can see: a
milestone, a label, the repo's own `.github/ISSUE_TEMPLATE/` forms, and whether the body carries
any section leads at all. It refuses the first such command in a session, which is how the message
reaches you; after that it advises and steps aside. A command that already meets the standard never
hears from it, and `--web` is left alone because GitHub shows the forms itself.

It is a nudge, not a validator - it cannot tell whether a `**Dev Notes:**` is any good, only that
one is there. Config, under `env` in a repo's `.claude/settings.json` or your own:

| `NT_DEV_ISSUE_STANDARD` | What the hook does |
| --- | --- |
| unset | Denies the first `gh issue create` in a session that has a gap, then advises without blocking. |
| `strict` | Denies every time there is a gap. |
| `off` | Nothing. |
