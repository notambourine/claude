---
paths:
  - "plugins/nt-vendor/**"
  - "plugins/nt-voice/skills/human-voice/**"
  - "vendor/**"
  - "scripts/vendor-skills.mjs"
---

# Vendored skills

- Never hand-edit `vendor/pristine/`, `vendor/NOTICE.md`, manifest `sha`, or `files`.
- Add manifest source, pin, path, license; then `node scripts/vendor-skills.mjs pull <name>`.
- Pull one named skill.
- Gist: `gist`, `owner`, `entry`.
- Missing license: `unstated`.
- Vendor whole directories.
- Audit every referrer named by `check` or `pull`.
- Single-reader source: `dest` plus `as`.
- Public reference: `nt-vendor:<name>`.
- Supporting material: relative path.
- Leave upstream bare sibling calls unchanged; wrap locally when needed.
