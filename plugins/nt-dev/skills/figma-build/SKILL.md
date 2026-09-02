---
name: figma-build
description: Build a multi-section page from Figma frames, from intake to shipped PR.
effort: high
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Agent, AskUserQuestion
argument-hint: "[epic-issue-number]"
---

# Figma page build

Epic scale: many sections, built once, shipped together. A repo's own per-frame guide
(`design/WORKFLOW.md` or similar, look first) owns frame mechanics. This sits above it and
defers to it on overlap.

## Intake

Collect before planning: the epic and its sub-issues, one per section; frame node IDs per
breakpoint per section, plus the ramp actually in use; launch-stage caveats and the repo's
existing flag pattern; which frames are dark, which light, and whether light exists at
every breakpoint.

Never assume the framework's default breakpoints. Projects skip steps and redefine the top
one. Ask for anything missing now.

## Spec extraction

One subagent per section. Each returns, across every frame:

- typography per text node, nearest existing type token, weight, tracking, exact copy;
- layout, outer padding, gaps, element sizes, grid or flex shape, per breakpoint;
- surface colors, radii, shadows, each mapped to a semantic token;
- assets to export, by node ID;
- dark and light conflicts, flagged;
- a reuse audit.

A reconcile row may never end in an inline hex.

### Reuse audit

Search the codebase before proposing code. Classify every element: **REUSE** unchanged;
**PROMOTE** to the shared layer, naming the source surface and what varies; **NEW**
primitive or shared local component; **⚠ NEEDS RULING** with options and their costs.

Never guess, and never silently take the cheaper path. Promoting couples surfaces that
should stay apart; duplicating wastes exactly what this phase exists to save.

### One rulings round

One message, two lists: design conflicts, and reuse decisions needing a ruling. Each with
a recommendation. Then stop. A section built against a guess gets rebuilt.

## Prerequisites

Land before any section imports them: tokens, in every theme, following the naming already
there; then primitives, every NEW and PROMOTE, with the promoted component's original
surface probed unchanged before and after; then assets, exported and committed at roughly
2× display size in the project's format. Record node IDs, never links. Figma asset URLs
expire.

## Build

First section fully serial. It surfaces the gaps the audit missed. Then parallel
subagents, one per section, each scoped to its own component file and copy block. A
subagent needing a new token or primitive stops and reports; it does not add one.

Follow the project's server and client split. Isolate interactive state in small leaves.

Copy is verbatim from the frames. A design placeholder stays a placeholder and gets
flagged to its owner. Never invent a number, name, date, or tenure.

## QA

Assert invariants, not screenshots. A screenshot proves it rendered; an assertion proves
it is right. Drive the running app at every breakpoint and diff computed values against
the spec. Write the assertion that catches the bug you most fear: on one build, `caption
slug === image filename` across every card caught real people's photographs under other
people's names, drawn from two independent index cycles.

Verify the probe before believing a failure. Lazy images have no `currentSrc` until they
enter view; pausing animations freezes entrance transitions at `opacity: 0`.

Typecheck and lint gate every commit. Where a type guard is the point, break it once to
prove it fires.

Expect several rounds of the owner's visual QA. Feed every structural change back through
the reuse audit. "We already have that component" is a spec-extraction miss surfacing
late.

## DRY refactor

Parallel builds duplicate. Sweep the sections as a set before shipping: identical shells
across sections into one component; repeated class strings into a constant, or a token if
it is really a design decision; near-identical components differing on one axis into one
component with a variant; a pattern now on two surfaces promoted and both re-pointed;
duplicated data shapes into one type.

Consolidate only what is actually the same. Forcing alike-looking things together builds a
variant zoo. The refactor is behavior-neutral: re-run the QA assertions after, unchanged.

Then strip scaffolding comments.

## Ship

Commits are atomic, dependencies first: tokens, primitives, assets, sections
(`/nt-dev:commit`). Get explicit approval before any git command. Check for an open PR
from this branch first, since pushing grows it rather than opening a new one, and ask
which the owner wants. Then push and open the PR (`/nt-dev:pr`). If the remote moved,
merge. Never rebase or force-push a shared branch.

Link the PR on every sub-issue with what shipped for that ticket, and assign the
unassigned.

## Carry the unresolved forward

A missing number, a mislabelled frame, filler imagery, a copy conflict between surfaces:
each goes in the PR's decisions and on the sub-issue, naming its owner. Never only in
chat. If someone later asks who decided this, the answer must be in the repo or the
tracker.
