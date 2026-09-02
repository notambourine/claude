---
name: trim-comments
description: Sweep comments in the dirty working tree against the house comment standard. Delete narration, cap every comment at two lines, and move durable cross-cutting rules into the repo memory file. Use before committing, or when a diff reads as over-commented.
effort: high
allowed-tools: Bash, Read, Edit, Glob, Grep, Agent, AskUserQuestion
argument-hint: "[path-or-glob | --repo]"
disable-model-invocation: true
---

# Trim comments

Models over-comment. They narrate the code beside them, and they explain how the old code became the new code, a fact that belongs in the commit body rather than the file. This sweep removes both.

## The standard

- Comment only why a choice wins or a trap exists.
- Two lines is the hard ceiling, and never more lines than the code explained.
- Leave routine props, flags, and options uncommented regardless of surrounding comment density.
- Never narrate, tag, or date a change; git blame holds history.
- Read code for derivable facts; never cache or comment them.

A repo memory file (`AGENTS.md` or `CLAUDE.md`) that states a stricter rule wins over this list.

## Scope

Union these; a narrow source never removes a wider one:

1. The argument, as a path or glob.
2. Comments flagged or deferred this session, and files edited this session.
3. Every dirty file in the working tree: staged, unstaged, and untracked source.

```bash
git status --porcelain
```

`--repo` widens to every tracked source file. State the resolved file list before editing. Past 25 candidates, delegate read-only scans by directory and apply all edits yourself.

## Route each comment

| Comment | Action |
| --- | --- |
| describes code or a routine prop, flag, or option | delete |
| narrates the change (what the code used to do, what moved, what was renamed) | delete; the commit body carries it |
| runs over two lines | cut to the one earned fact, or delete |
| wraps one non-derivable fact | condense to one line |
| holds rationale worth keeping | keep a short point-of-use fact; move the decision to the commit body or convert a cross-cutting lesson into an imperative memory-file rule |
| duplicates the memory file | keep only the point-of-use trap or the global rule |
| repeats one fact at many sites | use one canonical one-line form |
| carries a tag or date | remove the tag and date; keep only an earned fact |
| names a removed symbol | confirm with Grep, then delete |
| explains why the obvious alternative fails | keep, within two lines |

Keep ambiguous comments. A weak line is cheaper than deleting a footgun.

## Never touch

- Hook headers and `FIX RUNBOOK` blocks.
- Self-contained comments in scaffolded output.
- Shebangs, lint and type suppressions, license headers, YAML directives, and generated documentation comments.
- Comment-like text inside strings, heredocs, regexes, or embedded `jq`, `sed`, and `awk` programs.
- Issue-linked TODO and FIXME comments.
- Generated, vendored, dependency, and lock files.
- Markdown, skills, commands, and other prose documents.

## Apply

1. Read each candidate in context and assign a route.
2. Apply deletions and condensations directly.
3. Ask once before moving rationale into a commit body or memory file, deduplicating across files, or collapsing repeated comments.
4. Leave the result uncommitted so moved rationale can become the commit body.

## Inspect

Read every diff hunk and confirm it changes comments only:

```bash
git diff -U0 | grep -E '^[+-]' | grep -vE '^(\+\+\+|---)' | grep -vE '^[+-][[:space:]]*(#|//|/\*|\*|--|$)'
```

Output is acceptable only for a trailing comment on a code line. Do not run syntax, lint, or test commands that CI covers.

## Report

One line per changed file with the route and the resulting fact. Give the keep count and name skipped categories, not every skipped file.
