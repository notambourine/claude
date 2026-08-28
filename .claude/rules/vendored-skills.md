---
paths:
  - "plugins/nt-vendor/**"
  - "plugins/nt-voice/skills/human-voice/**"
  - "vendor/**"
  - "scripts/vendor-skills.mjs"
---

# Vendored skills

- Never hand-edit `vendor/pristine/`, `vendor/NOTICE.md`, or a manifest `sha`/`files`.
  They are the merge base that keeps a local edit from being overwritten on the next pull.
- Add a skill by appending name/repo/ref/path/license to `vendor/skills.json`, then run
  `node scripts/vendor-skills.mjs pull <name>`. Name the skill: a bare `pull` also
  updates every other pin, putting unread prose diffs in the same PR.
- Vendor a gist with `gist`/`owner`/`entry` in place of `repo`/`ref`/`path`. `entry` names
  the upstream file that becomes `SKILL.md`.
- Write frontmatter into a vendored source that has none, such as a gist holding a bare
  prompt. It is a local edit, so `verify` reports the skill as edited rather than clean.
- Set `license` to `unstated` when a source publishes no license file. Never infer one.
- Vendor the whole upstream directory, never a lone `SKILL.md`. These skills link to
  siblings, so an entry point alone ships dead links.
- Audit every referrer that `check` or `pull` names before you merge the update PR.
  Upstream owns that prose and can move the ground under a caller.
- When only one first-party skill reads a source, vendor it as supporting material. Set
  `dest` to the skill directory and `as` to the local entry-point name. It stays out of
  skill listings while `pull` and `verify` manage the copy.
- Name a vendored skill as `nt-vendor:<name>` wherever a first-party skill calls it.
  The bare name is invisible to `node scripts/vendor-skills.mjs refs`. Supporting material
  has no skill name, so its reader must refer to the entry point by path.
- Upstream text calls its siblings by bare name, which does not resolve under the
  `nt-vendor:` prefix. Leave it alone in the mirror; wrap the call in a first-party
  skill when it has to work.
