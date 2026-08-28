---
name: human-voice
description: Humanize prose by choosing a surgical voice edit or a structural rewrite. Use for AI-sounding drafts, anti-slop passes, editorial reviews, and requests to preserve an author's voice.
allowed-tools: Read, Edit, Grep
argument-hint: "[<file> | pasted text] [--surgical | --rewrite]"
---

# Human voice

Both methods ship in this directory. Read exactly one. They make incompatible assumptions about how much may change, and a pass carrying both applies neither.

| Method | Use when | Read |
| --- | --- | --- |
| Surgical | The author owns the draft, its structure is settled, the request is a review, or the right touch is uncertain. | [surgical/METHOD.md](surgical/METHOD.md) |
| Rewrite | The draft is machine-written, its structure is disposable, or structural repetition is the problem. | [rewrite/METHOD.md](rewrite/METHOD.md) |

Honor `--surgical` and `--rewrite`. Without a flag, choose surgical.

Choose rewrite when the user asks to redo the text, calls it AI slop, did not write it, or the draft relies on formulaic section shapes, repeated three-part lists, and summary endings that phrasing edits cannot repair.

Choose surgical when the user asks for a light pass, wants the structure or voice preserved, hands over someone else's draft for review, or gives you a fact-dense artifact such as a PR body, commit message, or technical document.

State the choice in one line, then read that file. For example:

> Surgical pass - your structure is settled, so only the phrasing should move.

## Boundaries

`surgical/METHOD.md` identifies candidate tells, separates genuine slop from the author's voice, and applies minimal phrasing changes. It must preserve facts, numbers, and structure.

`rewrite/METHOD.md` may reshape machine-written prose while preserving every claim. Use its embedded mode when humanizing text inside a larger workflow.

For a machine draft that must sound like its author, finish the rewrite first, then run the surgical pass on the result. Never read both files in one pass.

The user's requirements outrank either method:

- Use ASCII hyphens unless the user requires another mark.
- Use one stable term for each concept.
- Preserve identifiers, commands, and paths exactly.
- Prefer deletion over added rhythm or filler.

## Provenance

Both method files are third-party prose vendored into this skill, with their licenses and notices in `vendor/` at the repository root. Fix a defect upstream rather than here; a local edit survives the next pull but never reaches the people who wrote it.
