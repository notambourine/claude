# notambourine/claude

The `notambourine` marketplace. Add it once, then turn individual plugins on and
off.

```bash
claude plugin marketplace add notambourine/claude
claude plugin install nt-brand@notambourine --scope user
```

Slash commands are namespaced by plugin: `/nt-brand:check`. Namespacing is
exactly two segments, so a subdirectory under `skills/` adds nothing to the name.

## Naming: plugins in this repo start with `nt-`

A person's command list mixes plugins from several marketplaces, and the plugin
name is the only prefix a command carries. `nt-` is what makes ours findable:
type `/nt-` and the list is this practice's, with nothing from
`claude-plugins-official` in it.

The prefix applies to plugins that live here. `wormhook` and `qrspi` ship from
their own public repos and are named for what they do, which is what an outside
user searching for a supply-chain hook needs to find. A plugin that leaves this
repo drops the prefix with the move.

## Catalog

| Plugin | Lives in | For |
| --- | --- | --- |
| `nt-brand` | this repo | Brand source of truth: the token, component, font, and voice system, plus the audit that checks copy against the wordmark rules. |
| `wormhook` | [notambourine/wormhook](https://github.com/notambourine/wormhook) | Blocks npm/PyPI supply-chain malware at the hook. Ships hooks, so it stands alone. |
| `qrspi` | [notambourine/qrspi](https://github.com/notambourine/qrspi) | GitHub-native Query, Research, Spec, Plan, Implement workflow. |

## The brand system is the golden set

`plugins/nt-brand/skills/system/` holds the brand's only corrected copy:
`tokens.css`, `components.css`, the six self-hosted woff2 faces, and a
`hello-world.html` that renders on brand from `file://`.

Correct a value there and never sync one in. Anything that disagrees is
downstream and stale, however it renders. Both stylesheets are native CSS with
no build step, so they drop into a plain HTML file, a Worker, or a React app
unchanged. Build against the semantic layer (`--bg`, `--fg1`, `--accent`,
`--sp-*`, `--r-*`) rather than the `--nt-*` palette beneath it.

## Turning plugins on and off

Per machine:

```bash
claude plugin install qrspi@notambourine --scope user
claude plugin disable qrspi@notambourine
```

Per repo, committed so the whole team gets the same set, in
`.claude/settings.json`:

```json
{ "enabledPlugins": { "nt-brand@notambourine": true } }
```

## Where a plugin lives

**A plugin lives in the repo that owns its domain. With no domain, it lives
here.**

`wormhook` and `qrspi` own domains, so they stay in their own repos and this
catalog lists them by URL. They version and release with the code they wrap.
Practice-wide content with no home lives in `plugins/` here, because a repo for
four markdown files costs more in CI and release overhead than it returns.

Promote a local plugin to its own repo when it grows a build step, tests, or a
hook. One line changes, and the plugin drops its `nt-` prefix on the way out:

```json
"source": "./plugins/nt-dev"
"source": { "source": "url", "url": "https://github.com/notambourine/dev.git" }
```

The rename breaks anyone who installed the old name, so promote before you share
a plugin outside the team, not after.

## Why remote rows use an https `url`, not `github`

Use `{"source": "url", "url": "https://github.com/OWNER/REPO.git"}` for a plugin
in another repo. The `{"source": "github", "repo": "OWNER/REPO"}` form clones
over SSH, which fails for anyone without a working GitHub SSH key:

```
git@github.com: Permission denied (publickey).
```

Every repo this catalog points at is public, so https needs no credential at all
and works on a fresh machine and on a client's laptop. The `github:owner/repo`
string shorthand is a third form, and it does not validate at all.

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
plugins/nt-<name>/
  .claude-plugin/plugin.json     name, description, author, license
  skills/<skill>/SKILL.md        YAML frontmatter plus a body
  skills/<skill>/<assets>        anything the skill hands over, read on demand
```

A skill directory can carry files, not just prose. `nt-brand`'s `system` skill
ships stylesheets and fonts that way. Only the description stays resident, so
the weight costs nothing until the skill fires.

Then add the row to `plugins` in `.claude-plugin/marketplace.json` with
`"source": "./plugins/nt-<name>"`. CI checks that the two `description` fields
match, so write it once and copy it.

Do not repeat the plugin name in the skill name. The command is two segments, so
`nt-brand` plus a `brand-check` skill reads `/nt-brand:brand-check`. Name the
skill for the verb alone: `check`.

External, for a plugin that ships from its own repo: add the row with an https
`url` source and copy the description from that repo's `plugin.json`. Nothing
here can detect it drifting later.

## License

MIT. See [LICENSE](./LICENSE).
