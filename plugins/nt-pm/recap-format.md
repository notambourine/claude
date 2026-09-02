# Recap output contract

Shared by `shipped` and `weekly-recap`. Each skill supplies its own header line, section
names, and section emoji; everything below is fixed.

Draft only. Never post.

## Bullets

```text
* **Label:** Outcome in one short sentence.
```

Label is a bolded one-or-two-word noun for the surface that changed. The sentence names the
effect on the reader, not the mechanism.

## Sections

Bold every header. Blank line under each one. Omit empty sections. Use exactly the emoji the
skill names, in the order it names them.

## Compression

One bullet per theme, never per commit or PR. Merge until every bullet earns its line. Whole
block under 200 words. Skip bots, imports, dependency bumps, and immaterial docs.

## Vocabulary

Widely read shorthand is fine (9s, 404, RSS, zip). No PRs, hashes, branches, files,
functions, database internals, implementation jargon, attribution, names, or stock openings.

## Degradation

Missing `gh`: fall back to git and warn. Apply later wording edits to the full block.
