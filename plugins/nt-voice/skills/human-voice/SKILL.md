---
name: human-voice
description: Humanize prose by choosing a surgical voice edit or a structural rewrite. Use for AI-sounding drafts, anti-slop passes, editorial reviews, and requests to preserve an author's voice.
allowed-tools: Read, Edit, Grep
argument-hint: "[<file> | pasted text] [--surgical | --rewrite]"
---

# Human voice

Read exactly one method from this directory. Each allows a different amount of change, so loading both weakens the pass.

| Method | Use when | Read |
| --- | --- | --- |
| Surgical | The author owns the draft, its structure is settled, the request is a review, or the right touch is uncertain. | [surgical/METHOD.md](surgical/METHOD.md) |
| Rewrite | The draft is machine-written, its structure is disposable, or structural repetition is the problem. | [rewrite/METHOD.md](rewrite/METHOD.md) |

Honor `--surgical` and `--rewrite`. Without a flag, choose surgical.

Choose rewrite when the user asks to redo the text, calls it AI slop, did not write it, or the draft relies on formulaic section shapes, repeated three-part lists, and summary endings that phrasing edits cannot repair.

Choose surgical when the user asks for a light pass, wants the structure or voice preserved, hands over someone else's draft for review, or gives you a fact-dense artifact such as a PR body, commit message, or technical document.

State the choice in one line, then read the method. For example:

> Surgical pass - your structure is settled, so only the phrasing should move.

## Boundaries

`surgical/METHOD.md` finds AI writing tells and removes them with minimal phrasing changes. It preserves facts, numbers, structure, and the author's real voice.

`rewrite/METHOD.md` can reshape machine-written prose but must preserve every claim. Use its embedded mode inside a larger workflow.

When a machine draft must sound like its author, rewrite it first and run a separate surgical pass on the result. Never read both methods in one pass.

The user's requirements outrank either method:

- Use ASCII hyphens unless the user requires another mark.
- Use one stable term for each concept.
- Preserve identifiers, commands, and paths exactly.
- Prefer deletion over added rhythm or filler.

## Provenance

Both methods are vendored third-party prose. Their licenses and notices live in the repository's `vendor/` directory. Fix defects upstream so the original authors receive the change.
