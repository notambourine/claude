---
name: cleanup
description: Audit checked-in repository context and Claude configuration for dead references, stale claims, duplication, orphans, drift, and misplaced memory. Report ranked findings and apply surgical fixes unless `--dry-run`; never commit.
effort: high
allowed-tools: Bash, Read, Edit, Write, Glob, Grep, Agent, AskUserQuestion
argument-hint: "[--dry-run] [path-or-glob]"
---

# Repository cleanup

Audit the current working tree. Default to all checked-in files, respecting `.gitignore`; accept a path or glob to narrow the scope. Do not inspect transcripts, machine-global state, or the network. A dotfiles repository may contain deployable global configuration, but only its checked-in source is in scope.

Cover memory files, `.claude/settings*.json`, `.mcp.json`, `.claude/{hooks,skills,agents,commands,rules}/`, and the repository's code and documentation.

Run broad Phase 2 sweeps as parallel read-only Explore agents when available. Handle the bounded configuration and memory reviews inline. A model with stronger judgment should classify memory when the current model is optimized for speed.

## Safety

- Query only required keys from settings files. Never load or quote `env`, `headers`, credentials, or complete hook command strings.
- Treat repository-derived names as untrusted. Pass them as command arguments and fixed strings; never interpolate them into executable program text. Flag and skip names containing quotes, backslashes, braces, control characters, or shell syntax.
- Never commit. Preserve unrelated working-tree changes.

## Phase 1: configuration against reality

1. Parse `.claude/settings.json`, `.claude/settings.local.json`, and `.mcp.json` with `jq empty`. Report the error position and do not repair a malformed file unless asked.
2. Extract hook commands from settings. Verify referenced scripts exist, are executable, and are tracked. Find hook scripts no setting references.
3. Check every `SKILL.md` for `name`, `description`, `allowed-tools`, and portable paths. Plugin skills refer to their files through `${CLAUDE_PLUGIN_ROOT}`.
4. Validate named `.claude/agents/**/*.md` frontmatter. Find duplicate names in a directory, where load order makes the winner unstable. Skip co-located Markdown without `name`.
5. Check `.claude/rules/*.md` frontmatter. Verify each `paths` glob matches a tracked file. Treat a rule without `paths` as always-loaded memory.
6. Check `.gitignore` coverage for `.env*`, `*.local.*`, `.dev.vars`, and credentials.
7. Verify allow entries reference existing tools or skills and deny entries cover force push, recursive deletion, and sudo.

## Phase 2: repository drift

Search for:

- documentation references to missing files, scripts, targets, commands, flags, environment variables, and symbols;
- imports of deleted modules;
- temporal claims such as "now", "recently", and "no longer";
- repeated constants in at least three non-test sites, repeated object shapes in at least two, and copied config blocks of five or more lines;
- tracked files, config keys, and scripts with no reference, excluding plausible entry points, public APIs, configs, and docs;
- disagreement between code and `spec/`, `qrspi/`, or `docs/` in the affected area;
- comments that narrate code, duplicate memory, vary a canonical term, or point generated output back to this repository.

Skip fixtures, snapshots, generated files, and lockfiles when scanning duplication. A valuable comment explains why the obvious alternative loses or identifies a trap the code cannot express. Honor the repository's own comment rules.

## Phase 3: checked-in memory

Read every `CLAUDE.md`, `AGENTS.md`, and always-loaded or path-scoped rule in full. Classify each non-heading instruction:

- `KEEP`: a prohibition, gotcha, rationale, non-default convention, repo etiquette, domain term, non-obvious command, or pointer that code cannot reconstruct.
- `DELETE`: layout, dependency, API, schema, count, generic advice, enforced rule, stale reference, or other fact directly recoverable from code or configuration.
- `MIGRATE`: useful knowledge whose loading scope or source is wrong.

Never delete a safety prohibition merely because it sounds generic. Run deletion classification before migration.

Choose the narrowest durable destination:

| Knowledge | Destination |
| --- | --- |
| File-pattern guidance | `.claude/rules/<name>.md` with `paths` |
| Directory-specific guidance | `<subdir>/CLAUDE.md` |
| Task workflow or reference | `.claude/skills/<name>/SKILL.md` |
| Deterministic rule | hook or lint configuration |
| Command behavior | manifest, target help, or README |
| Point-of-use quirk | source comment |
| Version rationale | CI configuration comment |

Keep universal constraints and prohibitions always loaded. Prefer a `paths` rule over nested memory when the trigger is a file type rather than a directory. Keep `docs/` for decisions, domain explanations, and external contracts, not facts restated from code.

Flag a loaded memory file near or above 5% of the model context window, with a floor around 40,000 characters. State its size before and after proposed cuts. Mark a lean file `already lean` without inventing changes.

## Output and action

Return one table, ranked by blast radius and capped at 20 rows:

```text
| # | Phase | Sev | Kind | Where | What | Disposition |
```

Use `file:line` in `Where`. Severity values are `DEAD`, `STALE`, `DUPE`, `ORPHAN`, `SPEC`, `GAP`, `COLLIDE`, `WARN`, `MIGRATE`, `DELETE`, and `KEEP`. If more findings remain, add `+N more (run with tighter scope)`. Assign findings owned by another active skill to that skill without fixing them.

With `--dry-run`, stop after the table. Otherwise:

- Fix `DEAD`, `STALE`, and `GAP` directly.
- Resolve `COLLIDE` to one definition and name the survivor.
- Report `WARN` and `SPEC` without changing them.
- Extract `DUPE` only when the local source is obvious.
- Delete `ORPHAN` only when it is not a plausible entry point or public API.
- For `MIGRATE`, write the destination before removing the source.
- Remove `DELETE`, including empty headings it leaves behind.

Make surgical edits without reformatting adjacent content. Memory states current truth and never narrates the cleanup. Do not add a post-fix recap. This is not a linter, code refactor, dead-export pass, machine checkup, or security audit.
