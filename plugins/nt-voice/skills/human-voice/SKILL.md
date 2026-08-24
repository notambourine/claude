---
name: human-voice
description: Humanize prose by choosing a surgical voice edit or a structural rewrite. Use for AI-sounding drafts, anti-slop passes, editorial reviews, and requests to preserve an author's voice.
allowed-tools: Skill, Read, Edit, Grep
argument-hint: "[<file> | pasted text] [--surgical | --rewrite]"
---

# Human voice

Choose the method after reading the request and text. Do not load both methods at once; they make incompatible assumptions about how much may change.

| Method | Use when | Invoke |
| --- | --- | --- |
| Surgical | The author owns the draft, its structure is settled, the request is a review, or the right touch is uncertain. | `nt-vendor:anti-slop` |
| Rewrite | The draft is machine-written, its structure is disposable, or structural repetition is the problem. | `nt-vendor:humanizer` |

Honor `--surgical` and `--rewrite`. Without a flag, choose surgical.

Choose rewrite when the user asks to redo the text, calls it AI slop, did not write it, or the draft relies on formulaic section shapes, repeated three-part lists, and summary endings that phrasing edits cannot repair.

Choose surgical when the user asks for a light pass, wants the structure or voice preserved, hands over someone else's draft for review, or gives you a fact-dense artifact such as a PR body, commit message, or technical document.

State the choice in one line, then invoke the selected skill. For example:

> Surgical pass (`nt-vendor:anti-slop`) - your structure is settled, so only the phrasing should move.

If `nt-vendor` is unavailable, say that it must be installed with `claude plugin install nt-vendor`.

## Boundaries

`nt-vendor:anti-slop` identifies candidate tells, separates genuine slop from the author's voice, and applies minimal phrasing changes. It must preserve facts, numbers, and structure.

`nt-vendor:humanizer` may reshape machine-written prose while preserving every claim. Use its embedded mode when humanizing text inside a larger workflow.

For a machine draft that must sound like its author, finish the rewrite first, then run the surgical pass on the result. Never load the two skills together.

The user's requirements outrank either vendored method:

- Use ASCII hyphens unless the user requires another mark.
- Use one stable term for each concept.
- Preserve identifiers, commands, and paths exactly.
- Prefer deletion over added rhythm or filler.
