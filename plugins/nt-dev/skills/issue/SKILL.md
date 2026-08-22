---
name: issue
description: Write or update a GitHub issue to the house standard - title, body shape, milestone, labels, project fields, epic parent. Trigger on "open an issue", "file an issue", "write this up as a ticket", "flesh out issue #N", "add detail to this issue", or any request that ends in `gh issue create` / `gh issue edit`.
allowed-tools: Bash, Read, Grep, Glob
argument-hint: "[issue-number-to-edit]"
---

# Issue standard

Needs the `gh` CLI, authenticated, run from inside the repo. `jq` for the project-field lookups.

## Read the repo before you write

Every name below is per-repo. Never guess one and never carry one in from another project:

```bash
REPO=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
OWNER=${REPO%%/*}
gh api "repos/$REPO/milestones" --jq '.[].title'
gh label list --repo "$REPO" --limit 100
gh project list --owner "$OWNER" --format json          # number + id of each board
gh issue list --repo "$REPO" --limit 10 --json number,title,labels,milestone
```

Match the titles and the label pattern already on the board. Where the repo ships issue forms under
`.github/ISSUE_TEMPLATE/`, follow their headings verbatim and skip this file's body shapes.

## Title

State the outcome, not the chore: `Serve every sitemap from the app and retire the standalone EC2
box`, never `Sitemap work`. Rewrite a vague title whenever you touch the issue.

A numbered tree uses the repo's own codes: an epic reads `E3 · Routing, /start cutover, redirect
map`, its child `E3.2 /start edge cutover`. A code in the title is a label. Link the child for
real:

```bash
gh issue edit <child> --repo "$REPO" --parent <epic>
```

## Length and altitude

An issue says what outcome someone wants, how far it reaches, and how a human confirms it landed.

- **Hard budget: 200 words for a body, 150 for a comment.** Past that, write a second issue.
- **Write at the reader's altitude.** Default to user-facing behavior and business logic. Reach for
  the weeds (implementation steps, API specifics, file names) only where this issue's reader is
  already working in them, and only where they change a decision.
- **Open on the outcome and stop when it is delivered.** Short declarative bullets. No preamble, no
  restating the parent, no closing recap, no next steps nobody asked for.
- **One bullet level.** A nested list is a child issue trying to be born.
- **Link a decision that lives in another issue or PR.** Never restate it. Writing "recorded in
  #852 and not re-litigated here" and then re-litigating it is the failure this line exists for.
- **Cut every sentence that teaches.** A trap belongs at the code site as `// KEY-DECISION <date>:`
  or in the skill it traps.

## Body - the default shape

Three headings, one screen. `Parent: #N` on the first line where the issue has one.

- `## Outcome` - one sentence, the capability someone gains.
- `## Scope` - the boundary as short declarative bullets: what this covers, and where it matters,
  what it does not.
- `## Acceptance` - how a human confirms it landed, in observable terms. "A merchant can find a
  product and understand what shoppers see", never "tests pass".

Golden:

```markdown
Parent: #849

## Outcome

Give merchants a searchable, read-only view of each product's effective customizer configuration.

## Scope

- Search products across the selected store.
- Show the source and scope of each effective value.
- Show health problems and affected-product counts.

## Acceptance

- A merchant can find a product and understand what shoppers see.
- Every displayed value names its source.
- No store mutation is available in this issue.
```

The two shapes below are variants of that one. The budget holds for both.

## Body - design and section work

Four bolded leads instead of the three headings. `**Dev Notes:**` may not be empty.

- `**Goal:**` one sentence, what gets built.
- `**Context:**` the design screenshot, plus `Replaces: <live URL>` and `Figma: <node-id link>`
  when the page already exists.
- `**Dev Notes:**` the component or token to reuse, cited as `path/to/File.tsx`. Grep before you
  write it.
- `**Done when:**` the observable end state, say renders on its route in both themes and matches
  the design.

## Body - engineering work

A migration or a debt paydown is read by the person who will do it, already in the code. Scope may
carry the weeds there. The budget does not move.

Lead with measured reality, then the constraint, then the target state:

- facts with a date attached, not adjectives ("all measurements taken 2026-08-04")
- a `file.ts:155` behind the one or two claims the reader would otherwise go find, never a citation
  behind every sentence
- at most one table or ASCII diagram, today against target
- the prerequisite named as a prerequisite, with why it is not just cleanup
- open questions under their own heading, so nobody guesses

Three things stay out at any length: a slice-by-slice plan, a checklist of the work, a traps
section. The plan is the PR's, the checklist is the child issues, the trap is a code comment.

## Metadata

Fill these every time, and only the fields the board uses. Check the fill rate first - a field
nobody populates is dead:

```bash
gh project item-list <number> --owner "$OWNER" --format json \
  | jq '[.items[].fieldValues // {} | keys[]] | group_by(.) | map({field: .[0], filled: length})'
```

- **Milestone** - required. Pick from the repo's own list, above.
- **Project fields** - set the single-selects the board leans on (workstream, status). Where a
  field duplicates a label, set both and keep them in agreement.
- **Labels** - one surface, one type (`bug`, `enhancement`, `documentation`), then domain as
  needed. Get the process labels right, because each routes the issue differently:
  unblocked-but-needs-info, blocked-on-a-human-decision, time-boxed research.
- **Status** - `Backlog` on create. Move it to prioritized once the milestone and the Done-when are
  both settled.

```bash
gh project item-edit --project-id <project-id> --id <item-id> \
  --field-id <field-id> --single-select-option-id <option-id>
# ids:     gh project field-list <number> --owner "$OWNER" --format json
# item-id: gh project item-list  <number> --owner "$OWNER" --format json
```

## Updating an issue

Edit into the shape, never append a log. A new finding goes under the heading it belongs to. A
comment carries a decision or a result, dated. Remaining work is the Scope bullets edited or a set
of child issues, never a comment enumerating it. Fix the title and backfill the missing metadata in
the same pass.

## The hook behind this file

This skill fires only when the prompt trips its description. "File this as a ticket" does; "also
open an issue for the flaky test" often does not, and the issue that lands has no milestone, no
label, and a one-line body.

So the plugin ships `hooks/gh-skill-nudge.mjs`, a `PreToolUse` hook that names this file instead of
second-guessing your command. It refuses a `gh issue create` or a `Write` to an issue body file and
says to read this skill first, which is how the message reaches you. Invoking the skill is the
all-clear: the hook sees the `Skill` call and goes quiet for the session. `--web` is left alone
because GitHub shows the repo's forms itself.

The hook checks nothing about the issue. An earlier version graded flags, which put this standard
in two places and let it drift. You have read the standard; you judge the issue against it. Config,
under `env` in a repo's `.claude/settings.json` or your own:

| `NT_DEV_SKILL_NUDGE` | What the hook does |
| --- | --- |
| unset | Names this skill once per session, then advises without blocking. |
| `strict` | Names it on every issue until the skill is actually read. |
| `off` | Nothing. |
