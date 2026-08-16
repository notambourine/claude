# notambourine/claude

The `notambourine` marketplace. Add it once, then turn individual plugins on and
off.

```bash
claude plugin marketplace add notambourine/claude
claude plugin install nt-brand@notambourine --scope user
```

Slash commands are namespaced by plugin: `/nt-brand:system`. Namespacing is
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
| `nt-brand` | this repo | Brand source of truth: the token, component, font, and voice system, plus the audit that checks work against it. |
| `nt-dev` | this repo | Everyday development workflow: PR bodies, repo cleanup, prior-session recall. |
| `nt-vendor` | this repo | Third-party skills mirrored whole from their upstream repos. |
| `wormhook` | [notambourine/wormhook](https://github.com/notambourine/wormhook) | Blocks npm/PyPI supply-chain malware at the hook. Ships hooks, so it stands alone. |
| `qrspi` | [notambourine/qrspi](https://github.com/notambourine/qrspi) | GitHub-native Query, Research, Spec, Plan, Implement workflow. |
| `share` | [notambourine/share](https://github.com/notambourine/share) | One branded unguessable link for a file, folder, or screenshot. Ships a Worker, so it stands alone. |

## `nt-vendor` is somebody else's work

Every other plugin here is ours. `nt-vendor` is a mirror: each skill under
`plugins/nt-vendor/skills/` is copied whole from an upstream repo under its own
license, and `vendor/NOTICE.md` names the copyright holder for each. The prefix is
the point. When a first-party skill says `nt-vendor:codebase-design`, the reader
knows the vocabulary it is borrowing did not come from this practice.

```bash
node scripts/vendor-skills.mjs check   # network. upstream moved? weekly in CI
node scripts/vendor-skills.mjs verify  # offline. merge base still matches the pins
node scripts/vendor-skills.mjs pull    # network. three-way merge, keeps local edits
node scripts/vendor-skills.mjs refs    # offline. who calls each vendored skill
```

A source can be a repo directory or a gist. A gist holding a bare prompt becomes a skill
through the manifest's `entry` field, which names the upstream file that maps to
`SKILL.md`, plus frontmatter written in locally. `verify` reports that skill as edited,
not as a clean mirror, which is the honest reading.

`check` and `pull` print the `refs` index for every skill they report as moved, so an
update PR names its own audit surface. A vendored skill is prose an agent later
executes, which makes upstream untrusted input: read the prose diff and re-read every
referrer before merging. The script only ever writes fetched bytes to disk, and it
never opens the PR.

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

## Grouping: hooks force a split, shared rules force a merge

A skill is lazy. It costs one description line of context and activates only when
its trigger matches, so grouping several in one plugin is close to free. A hook
runs every session whether the person wanted it or not.

The opposite mistake is a split that should never have happened. A skill that has
to load another skill before it can do its job is not a skill, it is a section of
one. `nt-brand` shipped `check` alongside `system` until `check` opened with
"read `system` first" and duplicated three of its paragraphs. Two descriptions
stayed resident to describe one thing. Merge on that signal.

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
`nt-brand` plus a `brand-system` skill reads `/nt-brand:brand-system`. Name the
skill for the noun or verb alone: `system`.

External, for a plugin that ships from its own repo: add the row with an https
`url` source and copy the description from that repo's `plugin.json`. Nothing
here can detect it drifting later.

## License

MIT. See [LICENSE](./LICENSE).
