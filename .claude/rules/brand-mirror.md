---
paths:
  - "plugins/nt-brand/**"
  - "scripts/brand-kit.mjs"
  - "package.json"
---

# The brand-kit mirror

- Never hand-edit `plugins/nt-brand/skills/system/`. It is `@notambourine/brand-kit`
  unpacked, and `npm run brand` fails on any byte that differs from the pinned package.
- Fix a token, a face, or the skill prose in `notambourine/brand-kit`, release it, then
  bump the pin here and run `npm run brand:sync`. Never sync a correction the other way.
- Pin the dependency to one exact version, never a range. A caret moves the brand with
  no diff to review, and the gate rejects it.
- A Dependabot bump moves the pin only. Commit `npm run brand:sync` on top of it or the
  mirror and the pin disagree and CI fails.
- Never read the brand files from `node_modules/`. A plugin install runs no npm, so a
  path into it reads empty on every machine that installs `nt-brand`.
- Add a file to the mirror by publishing it in `brand-kit`. `files` in that package
  decides what ships; anything unpublished is a stray file the gate deletes.
