---
name: human-voice
description: Humanize prose by choosing a surgical voice edit or a structural rewrite. Use for AI-sounding drafts, anti-slop passes, editorial reviews, and requests to preserve an author's voice.
allowed-tools: Read, Edit, Grep
argument-hint: "[<file> | pasted text] [--surgical | --rewrite]"
---

# Human voice

Read one method only.

| Method | Choose | Read |
| --- | --- | --- |
| Surgical | Authored draft, settled structure, review, uncertain touch, PR/commit/technical artifact | [surgical/METHOD.md](surgical/METHOD.md) |
| Rewrite | Machine draft, disposable structure, formulaic architecture, explicit redo/slop request | [rewrite/METHOD.md](rewrite/METHOD.md) |

Flags win; default surgical. State choice in one line, then read method. For authored voice
after machine rewrite: separate rewrite, then separate surgical pass. Never load both in one
pass.

REMOVE ALL MANNERED PROSE.

User requirements win. Preserve claims, identifiers, commands, paths. Stable terms. ASCII
hyphens unless required otherwise. Prefer deletion.
