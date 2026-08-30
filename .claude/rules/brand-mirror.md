---
paths:
  - "plugins/nt-brand/**"
  - "scripts/brand-kit.mjs"
  - "package.json"
---

# Brand mirror

- Golden source: `notambourine/brand-kit`.
- Never hand-edit `plugins/nt-brand/skills/system/`.
- Fix upstream; release; exact-pin; `npm run brand:sync`.
- Dependabot bump: sync mirror.
- Verify: `npm run brand`.
- Runtime: committed mirror, never `node_modules`.
- New files: publish upstream first.
