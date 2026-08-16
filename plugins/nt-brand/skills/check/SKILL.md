---
name: check
description: Audit a file, directory, or git diff for wordmark violations: lowercase `notambourine` appearing in human-facing copy where it should be the `NoTambourine` wordmark. Also flags overuse of `NoTambourine LLC` outside contract signature blocks.
---

# /nt-brand:check

## Rules

- `NoTambourine` = wordmark. All human-facing copy.
- `notambourine` = slug. Only in paths, URLs, domains, GH org, npm package names, CSS classes.
- `NoTambourine LLC` = legal form. **Only** in contract signature blocks and one Definitions anchor (e.g. `"Consultant" means NoTambourine LLC...`). Not in H1, party table, body paragraphs, cover email signoff, or metadata.

## Audit a single file

```bash
# Lowercase notambourine outside of code/paths/URLs
grep -nE '(^|[^/.\-_a-z`])notambourine([^/.\-_a-z`]|$)' <file>

# NoTambourine LLC usage, 2x max (sig block + Definitions)
grep -nc 'NoTambourine LLC' <file>
```

## Audit a directory (human-facing files only)

```bash
grep -rnE '(^|[^/.\-_a-z`])notambourine([^/.\-_a-z`]|$)' \
  <dir>/ --include='*.md'
```

## Audit a git diff (pre-commit)

```bash
git diff --cached | grep -nE '^\+.*[^/.\-_a-z`]notambourine[^/.\-_a-z`]'
```

## False positives to ignore

- Slug in frontmatter (`slug: notambourine`, `kind: notambourine/kb`)
- Paths (`kb/notambourine/`, `playbook/notambourine.css`)
- URLs (`https://notambourine.com`)
- CSS classes, npm package names, GH remotes
- Code fences and inline `backticks` (the pattern above excludes them)

## Review heuristic

For any hit, ask: "if a client read this, would they expect the wordmark or the slug?" If wordmark → flag. If slug (it's a path, URL, identifier) → ignore.

## Scope

This skill checks the wordmark only. The grep recipes above are the wordmark-specific layer. For voice, density, structure, and the AI-tell read, use `/nt-brand:system` - it holds those rules and the tokens the copy sits on.
