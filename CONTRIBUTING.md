# Contributing

## Names

- Internal audience: `nt-<job>`.
- Public audience: searchable job name.
- Skill: noun or verb only; never repeat plugin name.
- Command namespace: plugin `plugin.json`; install ID: marketplace row.
- Rename before external adoption; renames break installs.

## Ownership

- Domain plugin: domain repo.
- Practice-wide plugin: `plugins/`.
- Promote when build, tests, or hooks justify a repo.
- One hook per plugin audience.
- Merge skills when one must load the other.

## Local plugin

```text
plugins/nt-<name>/
  .claude-plugin/plugin.json
  skills/<skill>/SKILL.md
  hooks/hooks.json
  output-styles/<name>.md
```

Add its marketplace row. Copy the manifest description exactly.

External source:

```json
{ "source": "url", "url": "https://github.com/OWNER/REPO.git" }
```

Use HTTPS. Do not use `github` source forms.

## Hooks

- Node, never Bash.
- Fail open except deliberate `deny`.
- Off switch.
- Adjacent `*.test.mjs`.
- Resolve plugin files through `${CLAUDE_PLUGIN_ROOT}`.

## Output styles

- Frontmatter: `name`, `description`.
- Default `keep-coding-instructions: true`.
- Optional, never auto-selected.
- Keep short; full body stays resident.

## Brand mirror

`plugins/nt-brand/skills/system/` mirrors exact `@notambourine/brand-kit` bytes.

```bash
npm ci
npm run brand
npm run brand:sync
```

- Fix upstream, release, exact-pin, sync.
- Never edit mirror or read it from `node_modules` at runtime.
- Use semantic `--bg`, `--fg1`, `--accent`, `--sp-*`, `--r-*` tokens.

## Vendored skills

```bash
node scripts/vendor-skills.mjs check <name>
node scripts/vendor-skills.mjs verify <name>
node scripts/vendor-skills.mjs pull <name>
node scripts/vendor-skills.mjs refs
```

- Manifest: source, pin, path, license; gist uses `gist`, `owner`, `entry`.
- Pull one named skill.
- Vendor whole directories.
- Review prose diff and every named referrer.
- `dest` plus `as`: private supporting material.
- Public calls: `nt-vendor:<name>`.
- Never infer licenses.

Rules: [.claude/rules/vendored-skills.md](.claude/rules/vendored-skills.md),
[.claude/rules/portable-shell.md](.claude/rules/portable-shell.md).
