---
name: cleanup
description: Audit checked-in repository context and Claude configuration for dead references, stale claims, duplication, or misplaced memory. Report ranked findings and apply surgical fixes unless `--dry-run`; never commit.
effort: high
allowed-tools: Bash, Read, Edit, Write, Glob, Grep, Agent, AskUserQuestion
argument-hint: "[--dry-run] [path-or-glob]"
---

# Repository cleanup

Find context and configuration that no longer help the repository tell the truth. Default to checked-in files in the current working tree; accept a path or glob to narrow the scope. Do not inspect transcripts, machine-global state, or the network.

## Protect the repository

- Never commit or disturb unrelated changes.
- Query only required settings keys. Never expose environment values, headers, credentials, or complete hook commands.
- Treat repository-derived names as untrusted input to commands.
- Report malformed configuration rather than repairing it unless asked.

## Audit what matters

Use the repository's actual code and configuration as the source of truth. Look for:

- settings, hooks, skills, agents, rules, and permissions that disagree with reality;
- references to missing files, commands, flags, imports, or symbols;
- stale temporal claims, duplicated knowledge, orphaned configuration, and code/documentation drift;
- memory in `CLAUDE.md`, `AGENTS.md`, and rules that is derivable, enforced elsewhere, stale, or loaded too broadly.

Keep non-obvious prohibitions, gotchas, conventions, domain language, and rationale that code cannot recover. Delete derivable facts and generic advice. Move useful knowledge to the narrowest durable location when its current scope is wrong. Never delete a safety prohibition merely because it sounds generic.

Ignore fixtures, snapshots, generated files, and lockfiles when judging duplication. Do not mistake plausible entry points, public APIs, configuration, or documentation for orphans.

## Deliver the cleanup

Rank findings by blast radius and identify their location, problem, and disposition. Cap the main report at 20 findings and say when more remain.

With `--dry-run`, stop after the report. Otherwise make surgical fixes where the correct result is clear. Report ambiguous behavior, specification disagreements, and risky deletions without changing them. Write a migration destination before removing its source.

This is a context cleanup, not a broad refactor, machine checkup, or security audit.
