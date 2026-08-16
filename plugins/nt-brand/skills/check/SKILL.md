---
name: check
description: Audit copy against the NoTambourine brand - wordmark forms, ASCII punctuation, sentence case, and the AI tells that read as padding. Use on a file, a directory, or a git diff before anything ships to a client or goes public: deck, proposal, SOW, cover email, README, landing page, release note.
---

# /nt-brand:check

## Load the rules first

**Read `/nt-brand:system` before judging anything.** It holds the voice, the register
rules, and the AI-tell list. This skill holds the mechanics: what to grep, what the hits
mean, and what to ignore. Restating a rule here would let the two drift, and `system` is
the golden set.

The one exception is the wordmark, below. It is pure pattern matching, so it lives with
the greps that find it.

## Wordmark

- `NoTambourine` = wordmark. All human-facing copy.
- `notambourine` = slug. Only in paths, URLs, domains, GH org, npm package names, CSS classes.
- `NoTambourine LLC` = legal form. **Only** in contract signature blocks and one Definitions anchor (e.g. `"Consultant" means NoTambourine LLC...`). Not in H1, party table, body paragraphs, cover email signoff, or metadata.
- `Notambourine` = not a valid form. Sentence case does not exist in the brand system.

The same four rules are published for outside agents at `notambourine.com/AGENTS.md`,
under "How to cite this site". Fetch it when a client or vendor disputes a flag.

```bash
# Lowercase notambourine outside of code/paths/URLs
grep -nE '(^|[^/.\-_a-z`])notambourine([^/.\-_a-z`]|$)' <file>

# Sentence case: never valid
grep -n 'Notambourine' <file>

# NoTambourine LLC usage, 2x max (sig block + Definitions)
grep -nc 'NoTambourine LLC' <file>
```

## Punctuation

ASCII only, with the interpunct as the sole exception - it separates a signoff
(`Tom Fuertes · Principal · NoTambourine`). An em dash is the most reported AI tell in
marketing copy, so it costs the most here.

```bash
# Em dash, en dash, curly quotes, single-char ellipsis. Interpunct deliberately absent.
perl -CSD -ne 'print "$.:$_" if /[\x{2014}\x{2013}\x{2018}\x{2019}\x{201C}\x{201D}\x{2026}]/' <file>
```

Perl rather than `grep -P`, on purpose. Stock macOS `grep` is BSD and rejects `-P`, so
that flag only works where someone installed GNU grep. Escapes rather than literal
characters, so this file stays ASCII and never trips its own check.

Every hit wants different punctuation, not a blind swap to `-`. Where `/dash-fix` is
installed, run it: it picks the colon, comma pair, or sentence split the sentence
actually wanted. Otherwise decide per site.

## AI tells

Mechanical first pass. A hit is a prompt to read the sentence, not a verdict.

```bash
# Puffery adjectives
grep -niE '\b(proven|world-class|battle-tested|results-driven|cutting-edge|best-in-class|seamless|robust|leverage|synergy|holistic|bespoke)\b' <file>

# Participle tails: cut the sentence at the comma
grep -niE ',\s+(ensuring|enabling|allowing|helping|driving|empowering|delivering|providing)\b' <file>

# Importance-flagging and throat-clearing
grep -niE "\b(this matters|it's worth noting|it is worth noting|needless to say|at the end of the day|in today's)\b" <file>

# Exclamation marks in body, and first person
grep -nE '!(\s|$)' <file>
grep -nE '\bI\b' <file>
```

Then read for the two tells no grep finds: **grandiose scope** ("changes how you build",
"the future of engineering") and a **three-item line spending its slots on adjectives**
rather than numbers. Scope every claim to something a client could hold you to.

## Three fixtures that read as tells and stay

Do not flag these. `system` explains why each earns its keep.

- **"Senior engineers. No tambourine."** - a tailing negation plus a two-beat fragment.
- **A three-item line whose items are facts** - "Two engineers, six weeks, one shipped feature."
- **A single pink `<em>` in a headline** - typographic emphasis, not the boldface tic.

## Audit a directory

```bash
grep -rnE '(^|[^/.\-_a-z`])notambourine([^/.\-_a-z`]|$)' <dir>/ --include='*.md'
```

## Audit a git diff (pre-commit)

Added lines only, so a flag lands on work in progress rather than on history.

```bash
git diff --cached | grep -nE '^\+.*[^/.\-_a-z`]notambourine[^/.\-_a-z`]'
git diff --cached | perl -CSD -ne 'print if /^\+.*[\x{2014}\x{2013}\x{2018}\x{2019}\x{201C}\x{201D}\x{2026}]/'
```

## False positives to ignore

- Slug in frontmatter (`slug: notambourine`, `kind: notambourine/kb`)
- Paths (`plugins/notambourine/`, `styles/notambourine.css`)
- URLs (`https://notambourine.com`)
- CSS classes, npm package names, GH remotes
- Code fences and inline `backticks` (the wordmark pattern excludes them)
- A puffery word used literally about a thing, not as a boast - "a robust error path"
- `I` inside a quotation, a code identifier, or a name

## Review heuristic

For a wordmark hit: "if a client read this, would they expect the wordmark or the slug?"
Wordmark → flag. Slug, because it is a path, URL, or identifier → ignore.

For everything else: **would cutting this weaken the claim?** If the sentence survives the
cut, the words were padding. NoTambourine sells the absence of padding, so padded copy
argues against the pitch.

## Scope

Copy only. For colors, type, spacing, and component recipes, use `/nt-brand:system` - it
ships the stylesheets and the non-negotiables a design gets checked against.
