# Contributing

## Naming

A person's command list mixes plugins from several marketplaces, and the plugin
name is the only prefix a command carries. Typing `/nt-` should list this
practice's commands and nothing else.

The prefix follows the audience, not the repo. Ask who can turn the plugin on. If
anyone can, it gets the name of the job, the way `wormhook` and `qrspi` do, because
that is what a stranger searches for. If only we can, it gets `nt-`, wherever it
lives. `nt-share` ships from its own repo and keeps the prefix, because it reads a
NoTambourine-issued token and writes to our domain.

Rename only when a plugin becomes something a stranger would install, and do it
before you share it outside the team. A rename breaks anyone already on the old
name.

The name that namespaces the commands lives in the plugin's own
`.claude-plugin/plugin.json`. The marketplace row here sets the id you install by,
and nothing more. Change one and not the other and you get `nt-share@notambourine`
answering to `/share:share`.

Do not repeat the plugin name in a skill name. The command is two segments, so
`nt-brand` plus a `brand-system` skill reads `/nt-brand:brand-system`. Name the
skill for the noun or verb alone: `system`.

## Where a plugin lives

A plugin lives in the repo that owns its domain. With no domain, it lives here.

`wormhook`, `qrspi`, and `nt-share` own domains, so they stay in their own repos
and this catalog lists them by URL. They version and release with the code they
wrap. Practice-wide content with no home lives in `plugins/`, because a repo for
four markdown files costs more in CI and release overhead than it returns.

Promote a local plugin to its own repo when it grows a build step, tests, or a
hook. One line changes:

```json
"source": "./plugins/nt-dev"
"source": { "source": "url", "url": "https://github.com/notambourine/dev.git" }
```

## Grouping

Group skills by audience, and give any plugin that ships a hook its own plugin.
Nobody installing a set of skills should inherit a `SessionStart` hook along with
them.

Merge two skills when one has to load the other before it can do its job. That is
not a skill, it is a section of one, and it leaves two descriptions resident to
describe a single thing.

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
ships stylesheets and fonts that way. Only the description stays resident, so the
weight costs nothing until the skill fires.

Then add the row to `plugins` in `.claude-plugin/marketplace.json` with
`"source": "./plugins/nt-<name>"`. CI checks that the two `description` fields
match, so write it once and copy it.

External, for a plugin that ships from its own repo: add the row with an https
`url` source and copy the description from that repo's `plugin.json`. Nothing here
can detect it drifting later.

### Use an https `url`, not `github`

Write `{"source": "url", "url": "https://github.com/OWNER/REPO.git"}`. The
`{"source": "github", "repo": "OWNER/REPO"}` form clones over SSH, which fails for
anyone without a working GitHub SSH key:

```
git@github.com: Permission denied (publickey).
```

Every repo this catalog points at is public, so https needs no credential and works
on a fresh machine or a client's laptop. The `github:owner/repo` string shorthand is
a third form, and it does not validate at all.

## The brand system is a submodule

`plugins/nt-brand/skills/system/` is
[notambourine/brand-kit](https://github.com/notambourine/brand-kit): the
stylesheets, the deck theme, the logo set, the self-hosted woff2 faces, and a
`hello-world.html` that renders on brand from `file://`.

```bash
git submodule update --init   # after a fresh clone, or the skill reads empty
```

A marketplace install runs that for you, so the skill ships whole.

The kit is its own repo because three surfaces read it and Dependabot tracks a
repo, not a subtree. Pinned here, in `notambourine/share`, and in the site, each
bump PR is about the brand and nothing else.

Correct a value in `brand-kit` and never sync one in. Anything that disagrees is
downstream and stale, however it renders. Build against the semantic layer
(`--bg`, `--fg1`, `--accent`, `--sp-*`, `--r-*`) rather than the `--nt-*` palette
beneath it.

## Vendored skills

Every plugin here is ours except `nt-vendor`. Each skill under
`plugins/nt-vendor/skills/` is copied whole from an upstream repo under its own
license, and `vendor/NOTICE.md` names the copyright holder. The prefix is the
point: when a first-party skill says `nt-vendor:codebase-design`, the reader knows
the vocabulary it borrows did not come from this practice.

```bash
node scripts/vendor-skills.mjs check   # network. upstream moved? weekly in CI
node scripts/vendor-skills.mjs verify  # offline. merge base still matches the pins
node scripts/vendor-skills.mjs pull    # network. three-way merge, keeps local edits
node scripts/vendor-skills.mjs refs    # offline. who calls each vendored skill
```

A source can be a repo directory or a gist. A gist holding a bare prompt becomes a
skill through the manifest's `entry` field, which names the upstream file that maps
to `SKILL.md`, plus frontmatter written in locally. `verify` reports that skill as
edited rather than as a clean mirror, which is the honest reading.

`check` and `pull` print the `refs` index for every skill they report as moved, so
an update PR names its own audit surface. A vendored skill is prose an agent later
executes, which makes upstream untrusted input: read the prose diff and re-read
every referrer before merging. The script only ever writes fetched bytes to disk,
and it never opens the PR.

See [.claude/rules/vendored-skills.md](./.claude/rules/vendored-skills.md) for the
full rules, and [.claude/rules/portable-shell.md](./.claude/rules/portable-shell.md)
for what a skill may assume about a teammate's shell.
