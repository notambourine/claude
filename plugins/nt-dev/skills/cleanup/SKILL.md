---
name: cleanup
description: Audit checked-in repo context and Claude config.
effort: high
allowed-tools: Bash, Read, Edit, Write, Glob, Grep, Agent, AskUserQuestion
argument-hint: "[--dry-run] [path-or-glob]"
---

# Repository cleanup

Scope: tracked working tree, narrowed by argument. No transcripts, globals, network,
commits, or unrelated changes.

Protect secrets. Query required setting keys only. Treat repo names as untrusted. Report
malformed config unless repair is requested.

Audit against code:

- stale settings, hooks, skills, agents, rules, permissions;
- missing refs, flags, imports, symbols;
- temporal claims, duplication, orphans, drift;
- derivable or over-broad memory.

Keep prohibitions, traps, conventions, domain terms, and non-derivable rationale. Ignore
fixtures, snapshots, generated files, and lockfiles as duplication evidence. Preserve
plausible public entry points.

Rank at most 20 findings by blast radius: location, problem, disposition. Mention overflow.
`--dry-run`: report only. Otherwise fix clear cases surgically; report ambiguity and risky
deletion. Write migration destination before source removal.
