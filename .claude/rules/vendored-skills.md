---
paths:
  - "plugins/nt-vendor/**"
  - "vendor/**"
  - "scripts/vendor-skills.mjs"
---

# Vendored skills

- Never hand-edit `vendor/pristine/`, `vendor/NOTICE.md`, or a manifest `sha`/`files`.
  They are the merge base that keeps a local edit from being overwritten on the next pull.
- Add a skill by appending name/repo/ref/path/license to `vendor/skills.json`, then run
  `node scripts/vendor-skills.mjs pull`.
- Vendor a gist with `gist`/`owner`/`entry` in place of `repo`/`ref`/`path`. `entry` names
  the upstream file that becomes `SKILL.md`.
- Write frontmatter into a vendored source that has none, such as a gist holding a bare
  prompt. It is a local edit, so `verify` reports the skill as edited rather than clean.
- Set `license` to `unstated` when a source publishes no license file. Never infer one.
- Vendor the whole upstream directory, never a lone `SKILL.md`. These skills link to
  siblings, so an entry point alone ships dead links.
- Audit every referrer that `check` or `pull` names before you merge the update PR.
  Upstream owns that prose and can move the ground under a caller.
- Name a vendored skill as `nt-vendor:<name>` wherever a first-party skill calls it.
  The bare name is invisible to `node scripts/vendor-skills.mjs refs`.
- Upstream text calls its siblings by bare name, which does not resolve under the
  `nt-vendor:` prefix. Leave it alone in the mirror; wrap the call in a first-party
  skill when it has to work.
