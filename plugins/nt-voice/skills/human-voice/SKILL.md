---
name: human-voice
description: The prose voice pass - strip AI writing tells while keeping the author's voice. Trigger on any way of asking for one: "sounds like AI", "make this human", "humanize this", "slop", "anti-slop", "AI tell", "editorial pass", "de-slop this", "does this read like a bot", "review my writing", or a draft handed over for a voice read. Covers blog posts, essays, white papers, marketing copy, emails, docs, reports, PR bodies, and commit messages. Start here rather than at nt-vendor:anti-slop or nt-vendor:humanizer; this skill picks between them.
allowed-tools: Skill, Read, Edit, Grep
argument-hint: "[<file> | pasted text] [--surgical | --rewrite]"
---

# human-voice - one door, two methods

Two vendored skills do this work and they disagree on method. Naming either one directly
picks a method before reading the text, which is the wrong order. Triage first.

## Pick the method

Read the request and the text, then choose one. Do not load both - their instructions
contradict each other, and an agent holding both defaults to the more destructive one.

| Choose | When | Then invoke |
| --- | --- | --- |
| **Surgical** | The author wrote it and still owns it. Published or near-published prose. A review of someone else's draft. Anything where structure and argument are settled and only phrasing is in play. Also: you are unsure. | `nt-vendor:anti-slop` |
| **Rewrite** | The text is machine-drafted and reads like it. Structure is not sacred. The ask is "fix this," not "review this." Encyclopedic or reference prose needing a neutral-voice pass. | `nt-vendor:humanizer` |

Honor an explicit `--surgical` or `--rewrite`. Absent one, surgical is the default: it
edits phrasing only, so a wrong call costs a light touch instead of a lost draft.

Signals that override the default toward rewrite:

- The user says "rewrite", "redo", "this is AI slop", or pastes text they did not write.
- The draft has the shape tells, not just the word tells - a "Challenges and Future
  Prospects" section, three-item lists throughout, a summary sentence closing every
  paragraph. Phrasing edits cannot fix structure.

Signals that pin it to surgical even when the text looks bad:

- "light pass", "just the tells", "don't change my structure", "keep my voice".
- It is someone else's draft and you are reporting, not editing.
- It is a commit message, a PR body, or a doc where the facts carry the value.

## Then hand off

Invoke the chosen skill with the Skill tool and follow it. It owns the method; this file
only routes. Say which one you picked and why in one line, so a wrong call is visible and
cheap to reverse:

> Surgical pass (`nt-vendor:anti-slop`) - your draft, structure settled, phrasing only.

If the vendored skill is not installed, `nt-voice` is installed without `nt-vendor`. Say
so and name the fix: `claude plugin install nt-vendor`.

## What each one does, so the pick is informed

**`nt-vendor:anti-slop`** (upstream `elithrar/dotfiles`) - collect candidates, validate
each as slop-or-voice, apply only the survivors as minimal phrasing changes. Facts,
numbers, and structure are untouchable. Carries a tell catalog plus
`references/tells.md` for the extended lexicon. Its own guardrail: "One tell fixed
cleanly beats three fixed clumsily."

**`nt-vendor:humanizer`** (upstream `blader/humanizer`) - a draft, then a "what still
reads as AI" audit, then a final rewrite. Every claim survives but the shape does not:
it compresses dull stretches and merges or splits paragraphs. 33 numbered patterns from
Wikipedia's "Signs of AI writing". Three invocation modes - pasted text, file (rewrites
in place), and embedded (returns prose only, for a caller mid-task).

Reach for `humanizer`'s embedded mode when another skill needs de-slopped prose as one
step of a larger job. Route through this file anyway; the triage still applies.

## Both, in sequence

Legitimate when a machine draft has to ship as the author's own: run
`nt-vendor:humanizer` to fix the shape, then `nt-vendor:anti-slop` on its output to catch
the tells the rewrite introduced. Never load them at once - finish one, then start the
other on the result.

## House rules that outrank both

The user's own preferences win where they conflict with upstream prose:

- ASCII hyphens only. Neither vendored skill may leave a unicode dash behind; `/dash-fix`
  repairs what slips through, and a load-bearing one is marked `dash-ok`.
- One term per concept, reused verbatim. Upstream's "elegant variation" section says the
  same thing - it is not a license to vary a term that is doing work.
- Quote identifiers, commands, and paths exactly. A voice pass never touches them.
- Cut every word you can. Where upstream would add a clause for rhythm, prefer the cut.
