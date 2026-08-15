# notambourine/claude

The `notambourine` marketplace. Add it once, then turn individual plugins on and
off.

```bash
claude plugin marketplace add notambourine/claude
claude plugin install brand@notambourine --scope user
```

Slash commands are namespaced by plugin: `/brand:check`. Namespacing is exactly
two segments, so a subdirectory under `skills/` adds nothing to the name.

## Catalog

| Plugin | Lives in | For |
| --- | --- | --- |
| `brand` | this repo | Brand source of truth: wordmark rules and the audit that checks copy against them. |
| `wormhook` | [notambourine/wormhook](https://github.com/notambourine/wormhook) | Blocks npm/PyPI supply-chain malware at the hook. Ships hooks, so it stands alone. |
| `qrspi` | [notambourine/qrspi](https://github.com/notambourine/qrspi) | GitHub-native Query, Research, Spec, Plan, Implement workflow. |

## Turning plugins on and off

Per machine:

```bash
claude plugin install qrspi@notambourine --scope user
claude plugin disable qrspi@notambourine
```

Per repo, committed so the whole team gets the same set, in
`.claude/settings.json`:

```json
{ "enabledPlugins": { "brand@notambourine": true } }
```

## Where a plugin lives

**A plugin lives in the repo that owns its domain. With no domain, it lives
here.**

`wormhook` and `qrspi` own domains, so they stay in their own repos and this
catalog lists them by `github:` reference. They version and release with the code
they wrap. Practice-wide content with no home lives in `plugins/` here, because a
repo for four markdown files costs more in CI and release overhead than it
returns.

Promote a local plugin to its own repo when it grows a build step, tests, or a
hook. One line changes:

```json
"source": "./plugins/dev"
"source": { "source": "github", "repo": "notambourine/dev" }
```

Note the object form. The `github:owner/repo` shorthand does not validate.

## One rule for grouping: hooks force a split

A skill is lazy. It costs one description line of context and activates only when
its trigger matches, so grouping several in one plugin is close to free. A hook
runs every session whether the person wanted it or not.

So group skills by audience, and give any plugin that ships a hook its own
plugin. Nobody installing a set of skills should inherit a `SessionStart` hook
along with them. `wormhook` is hooks-only for exactly this reason.

Name a plugin after who turns it on. If you cannot name that audience, the plugin
is a junk drawer.

## Adding a plugin

Local, for practice-wide content:

```
plugins/<name>/
  .claude-plugin/plugin.json     name, description, author, license
  skills/<skill>/SKILL.md        YAML frontmatter plus a body
```

Then add the row to `plugins` in `.claude-plugin/marketplace.json` with
`"source": "./plugins/<name>"`. CI checks that the two `description` fields
match, so write it once and copy it.

External, for a plugin that ships from its own repo: add the row with a `github:`
source and copy the description from that repo's `plugin.json`. Nothing here can
detect it drifting later.

## License

MIT. See [LICENSE](./LICENSE).
