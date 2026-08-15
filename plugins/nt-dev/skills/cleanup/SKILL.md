---
name: cleanup
description: Audit THIS repo for dead refs, stale docs, DRY violations, orphans, broken .claude/ config (hooks, skills, agents, rules), and checked-in memory-file content the codebase already says. One pass, ranked output, surgical in-place fixes. Never commits.
effort: high
allowed-tools: Bash, Read, Edit, Write, Glob, Grep, Agent, AskUserQuestion
argument-hint: "[--dry-run] [path-or-glob]"
---

# cleanup - audit this repo

**Scope: this working tree, checked-in files only.** Everything here is verifiable from the
repo - no transcripts, no machine-global state, no network. Default scope is the whole repo
(respecting .gitignore); pass a path or glob to narrow.

In scope: every checked-in memory file (`CLAUDE.md`, `AGENTS.md`, `.claude/CLAUDE.md`, nested
`<subdir>/CLAUDE.md`, `.claude/rules/*.md`), `.claude/settings.json`, `.mcp.json`,
`.claude/{hooks,skills,agents,commands}/`, and repo code and docs.

A dotfiles repo that *ships* user-global config has those files checked in here, so they are in
scope. Their deployed copies under `$HOME` are not - this skill never edits outside the repo.

## Fan out the wide scans

Phase 2's sweeps read across the whole tree and return mostly negatives. Run them in parallel as
read-only `Explore` agents so you keep the verdicts instead of the file dumps. Phase 1 and Phase 3
read a bounded, known set of files: do those inline.

Phase 3's KEEP/MIGRATE/DELETE call is judgment, and getting it wrong deletes something a person
wrote. On a fast-tier session, give that phase a stronger model than the mechanical sweeps.

## Handling rules (all three phases)

- **Key-scoped reads only.** `settings.json`, `settings.local.json`, and `.mcp.json` carry
  secrets in `env`, `headers`, and hook command strings. Read the keys a check needs
  (`jq '.hooks'`, `jq '.mcpServers | keys'`) - never a whole settings file into the
  conversation, never an `env` or `headers` value quoted into a row or a proposal.
- **Repo-harvested names are untrusted input.** A skill directory, MCP server, agent `name`, or
  hook command read out of this repo can contain `$(...)` or `;`. Pass them as arguments
  (`jq --arg name "$n"`, `grep -F -- "$n"`), never interpolated into program text. A name holding
  quotes, backslashes, braces, or control characters gets flagged suspicious and skipped - no
  legitimate name needs those.
- **Never commit.** Every fix is an ordinary working-tree edit the user reviews in `git diff`.

## Pre-loaded Context

Tracked files: !`git ls-files | wc -l`
Memory file sizes (chars): !`git ls-files -z '*CLAUDE.md' '*AGENTS.md' '.claude/rules/*.md' 2>/dev/null | xargs -0 wc -c 2>/dev/null | tail -25`
README files: !`git ls-files '*README*' 2>/dev/null | head -20`
Skills: !`find .claude -name "SKILL.md" 2>/dev/null`
Agents: !`find .claude/agents -name '*.md' 2>/dev/null || echo "(none)"`
Settings keys: !`jq -r 'keys[]' .claude/settings.json 2>/dev/null || echo "(no .claude/settings.json)"`
Local settings keys: !`jq -r 'keys[]' .claude/settings.local.json 2>/dev/null || echo "(none)"`
Workflows: !`find . -path "*/.github/workflows/*.yml" -not -path "*/node_modules/*" 2>/dev/null`
Gitignore: !`cat .gitignore 2>/dev/null | head -30`
Recent churn (last 30d, top 20): !`git log --since=30.days --name-only --pretty=format: 2>/dev/null | sort | uniq -c | sort -rn | head -20`

---

# Phase 1: `.claude/` config vs repo reality

### 1. Parse integrity
`jq empty` each of `.claude/settings.json`, `.claude/settings.local.json`, `.mcp.json`. A file
that fails to parse is ignored wholesale - that is how "my settings stopped working" happens.
Report the parser's error position. Repair only if asked, since repairing means reading the file.

### 2. Hook integrity
Extract hook commands from `settings.json`. Verify each referenced script exists on disk, is
executable, and is **tracked by git** - an untracked hook works on one disk only. Flag orphans
both ways: settings referencing a missing file, and hook scripts nothing references.

### 3. Skill health
For each `SKILL.md`: frontmatter has `name` and `description`; `allowed-tools` present (absent
means unrestricted); no hardcoded absolute paths. A skill shipped inside a plugin uses
`${CLAUDE_PLUGIN_ROOT}` for its own files, never `~/.claude/skills/...`.

### 4. Agent and rule definitions
- `.claude/agents/*.md` (subdirectories included): frontmatter with a `name` but failing
  validation (e.g. no `description`) never loads - flag and repair the frontmatter, quoting only
  the offending lines, never the body. A file with no `name` is a co-located doc; skip it.
- **Name collisions inside one directory:** the loser is discarded silently and the winner
  follows unsorted readdir order, so which definition is live differs between machines. Flag the
  group; rename or remove all but one.
- `.claude/rules/*.md` loads by frontmatter. A `paths` glob list makes the rule lazy: the body
  enters context only when a matching file is read or edited. Omit `paths` and the rule is
  always-loaded, so it pays the same rent as `CLAUDE.md` and gets the Phase 3 treatment.
- A lazy rule does not cover always-loaded guidance - do not treat it as a dedup target for one.
- Flag a `paths` glob matching nothing in the repo. The rule can never fire, so it is dead weight
  that reads as live coverage. Fix the glob or delete the file.

### 5. Gitignore coverage
Patterns exist for `.env*`, `*.local.*`, `.dev.vars`, credentials. Flag misses.

### 6. Settings permissions
Allow entries reference tools and skills that exist. Deny patterns cover the basics (force push,
`rm -rf`, sudo).

---

# Phase 2: Repo-wide drift

### 1. Dead refs (highest signal)
Grep docs (`*.md`, `CLAUDE.md`, `README*`) for file paths, script names, make targets, npm
scripts, and function names; verify each target exists. Grep code for imports of deleted modules,
compared against `git ls-files`.

### 2. Stale doc claims
For each memory or README bullet naming a file, command, flag, or env var: verify it exists and
still does what the doc says, with a quick read of the referenced site. Flag temporal leaks
("now", "recently", "no longer") - those age badly regardless of accuracy.

### 3. DRY violations
Duplicated constants (same literal in 3 or more non-test places), duplicated type shapes (same
object literal in 2 or more non-test files), copy-pasted config blocks (same 5+ lines in 2 or
more files). Skip fixtures, snapshots, generated files, lockfiles.

### 4. Orphans
Tracked files never imported or referenced, excluding entry points, configs, and docs. Config
keys and `package.json` scripts nothing invokes.

### 5. Spec drift
If `spec/`, `qrspi/`, or `docs/` exists, diff spec against code in the touched area. Flag drift
from stated invariants.

### 6. Comment quality
A comment that describes the code is dead weight; the ones worth keeping say what the code
cannot - the reason a choice beats the obvious alternative, or the trap that makes the obvious
edit wrong. If the repo states its own comment convention in a memory file, that wins over this
default. Flag:

- A comment restating the code it sits on - condense to the fact the code cannot say, or delete.
- Rationale duplicated in both a comment and a memory file - keep one. Point-of-use footgun in
  the comment, cross-cutting design rationale in the memory file.
- A recurring fact re-worded per site - collapse to one canonical tag, verbatim.
- Comments in scaffolded output (a skill template writing files into *other* repos) must stay
  self-contained, with no pointer back to this repo's docs.

---

# Phase 3: Checked-in memory files

Read each file from Pre-loaded Context in full. Classify every non-heading line **KEEP**,
**MIGRATE**, or **DELETE**. Always-loaded files (root `CLAUDE.md`, `.claude/CLAUDE.md`) matter
most; nested and `paths`-scoped files still get scanned.

Flag any single loaded memory file over the large-file warning threshold - roughly 5% of the
model's context window in characters, floor around 40,000 - and state which files trip it before
and after the proposed cuts. A lean file gets one line ("already lean") and no proposal.

### The test: could a session working in this repo reconstruct this line by reading the code?

**DELETE - derivable.** Directory and file layouts (`ls` shows them). Tech-stack and dependency
lists (the manifest says them). Build, test, and lint commands that are the tool's standard
invocation or already in the manifest's scripts. API signatures, types, and schemas copied from
source. Architecture overviews and repo tours that read like a README. Generic best practices the
model already follows ("write clean code", "add tests"). Rules a pre-commit hook, lint config, or
CI check already enforces - cross-check those configs first. Any count or number knowable by
running a command (`wc -l`, `grep -c`, `ls`). Auto-generated-looking entries ("User prefers…",
"This project uses…") that restate `settings.json` or the code. Stale references to files and
commands that no longer exist.

**KEEP - not derivable.** Gotchas and failure contracts ("X looks safe but does Y"). Design
rationale the code cannot explain. Conventions that DIFFER from language or tool defaults, where
the code alone would teach the wrong pattern. Agent directives and safety-critical prohibitions.
Repo etiquette (branch naming, PR and commit style). Domain glossaries. Build and test commands
that are NOT guessable - non-standard scripts, required flags, environment setup. Pointers to
context living elsewhere (`@path` imports, skill references).

**Cut derivable content without hesitation. Otherwise keep it - a person wrote these files.**
Never cut a "never do X" rule for looking generic; safety-critical prohibitions are keep-always.

### MIGRATE - real knowledge in the wrong place

| Pattern | Destination |
|---------|-------------|
| Guidance keyed to a file pattern (`wrangler.*`, `*.test.ts`, `Dockerfile`) | `.claude/rules/<name>.md` with a `paths` glob - loads only when such a file is touched |
| Guidance for one package or module, whole directory | `<subdir>/CLAUDE.md` - loads only under that directory |
| Task-specific workflow (deploy, release checklist, API reference) | `.claude/skills/<name>/SKILL.md`; only the description stays resident |
| Deterministic rule a hook or lint could enforce | the hook or lint config |
| `make <target>` description | `## help text` comment on the target |
| `npm run <script>` description | the `package.json` scripts value or README |
| Import quirk or workaround | a comment at the import site |
| Version pin with rationale | comment in the CI yaml |
| Per-file behavior note | comment in that file |
| One-off env var | comment in the script that reads it |
| A `docs/` page restating code, config, or layout | a `paths` rule, a skill, or a comment at the site; delete the page |

**Reach for a `paths` rule before a nested `CLAUDE.md` or a `docs/` edit.** Take each surviving
line and ask which file a reader must touch for it to apply. One clean glob answers that for most
guidance about a tool, a framework, or a filetype, and a rule fires on the pattern wherever the
matching file sits. A nested `CLAUDE.md` only wins when the trigger is genuinely the directory. A
`docs/` page only wins for what no code holds - a decision record, a domain explainer, an
external contract - because a page restating code drifts with nothing to catch it.

Never migrate a universal constraint, repo-wide code style, or a prohibition into a lazy skill or
a `paths` rule; it might not be loaded when it matters. Run the DELETE pass first so migration
only handles content that survives it.

---

# Output

One ranked table covering all three phases:

```
| # | Phase | Sev | Kind | Where | What | Disposition |
```

- **Sev**: DEAD (broken ref), STALE (doc lies), DUPE (DRY), ORPHAN (unused), SPEC (code ≠ spec),
  GAP (missing protection), COLLIDE (two definitions, nondeterministic winner), WARN (could
  drift), MIGRATE, DELETE, KEEP.
- **Cap at 20 rows.** More found means a footer `+N more (run with tighter scope)`.
- One line per row, `file:line` in `Where`. Rank by blast radius.
- Anything that belongs to a sibling skill in this session gets one row naming the owner and no
  fix. Dead code exports belong to a dead-code pass; refactoring working code belongs to a
  simplification pass; machine and account health belongs to a machine-wide checkup.

If `--dry-run`, stop here.

# Action

Fix in place. No confirm-per-row gate and no post-fix summary - the diff and the tool calls show
the work.

- **DEAD / STALE / GAP**: fix directly.
- **COLLIDE**: rename or remove all but one; report which one you kept.
- **WARN**: report only.
- **DUPE**: extract to one source if extraction is local and obvious; otherwise report only.
- **ORPHAN**: skip if it looks like a public API or an entry point; otherwise delete.
- **SPEC**: report only - spec drift needs judgment beyond this skill.
- **MIGRATE**: write the destination, then remove the source line. An emptied section loses its
  header too.
- **DELETE**: remove. `git diff` is the record; do not re-quote the block.

Surgical edits only - do NOT reformat surrounding content. The user can course-correct
mid-execution.

Memory-file prose stays **declarative**: state current truth, never narrate the change. No "now",
"is now", "was changed to", "no longer". Write as if it always said this.

Cleanup is not a linter and not a security audit.
