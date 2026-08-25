# notambourine/claude

The Claude Code plugins the NoTambourine practice works out of: the brand system,
everyday PR and cleanup workflow, supply-chain scanning, and one-link file sharing.

Add the marketplace once, then turn plugins on per machine or per repo.

## Install

```bash
claude plugin marketplace add notambourine/claude
claude plugin list --available --json |
  jq -r '.available[] | select(.marketplaceName == "notambourine") | .pluginId' |
  while read -r plugin; do claude plugin install "$plugin" --scope user; done

# --available skips anything you already have, so rerun this to pick up a plugin added since.
# For one plugin instead of the whole set: claude plugin install nt-brand@notambourine --scope user

# Third-party marketplaces ship with auto-update off, so this stays pinned to today's commit.
claude plugin marketplace update notambourine                # pull updates by hand
# ...or once per machine: /plugin -> Marketplaces -> notambourine -> Enable auto-update

# nt-dev's two hooks read an env var, set under `env` in .claude/settings.json:
#   NT_DEV_SKILL_NUDGE=strict   nudge every time until the skill is read (default: once, then advise)
#   NT_DEV_SKILL_NUDGE=off      silence the skill-nudge hook
#   NT_DEV_DASH_GUARD=strict    refuse a write that raises the dash count (default: land it, name the lines)
#   NT_DEV_DASH_GUARD=off       silence the dash-guard hook
#   NT_SHOPIFY_GUARD=off        silence nt-shopify's store guard
```

## What you get

Ten plugins. Commands use two-part plugin namespaces:
`/nt-brand:system`.

### `nt-brand`

- `/nt-brand:system` - Provides colors, type, spacing, component CSS, a Marpit deck theme, voice rules, and an audit against them.

Native CSS works in a page, Worker, or React app without a build step.

### `nt-dev`

- `/nt-dev:pr` - Builds a PR body from the diff and repo template, then opens a draft PR.
- `/nt-dev:issue` - Writes a standard GitHub issue with a title, structured body, milestone, labels, project fields, and epic parent.
- `/nt-dev:cleanup` - Audits the repo for dead refs, stale docs, duplication, orphans, and broken `.claude/` config without committing.
- `/nt-dev:recall` - Restores a prior session in this repo to context.
- `/nt-dev:eod-update` - Drafts a copy-paste end-of-day standup update from today's GitHub activity without posting.
- `/nt-dev:commit` - Writes a `scope: description` commit message, no Conventional Commits type.

Also includes the two hooks below.

### `nt-pm`

Writes plain-English status for non-technical readers without posting or deploying.

- `/nt-pm:shipped` - Summarizes what is about to ship or just shipped as "Deploy Updates" grouped by category.
- `/nt-pm:weekly-recap` - Summarizes the team's merged, in-review, and in-progress work for the week.

### `nt-seo-spider`

Ships no commands. It points Claude at the Screaming Frog SEO Spider MCP server on `http://127.0.0.1:11435/mcp`, for crawl control, reports, bulk exports, and URL inspection.

Two switches, and both have to be on. In the app: Settings, MCP Server, Start (or tick auto-start; the CLI equivalent is `--mcp-streamable-http-server`). In the repo:

```bash
claude plugin enable nt-seo-spider@notambourine -s local
```

`-s local` writes `.claude/settings.local.json`, which is gitignored, so a client's team never inherits it. Leave the plugin off at user scope: it ships 29 tools, and the SEO work is three repos out of the fleet. Needs SEO Spider 24+, and a licence for anything past 500 URLs.

### `nt-shopify`

Ships no commands, one hook. It refuses a Shopify CLI or Shopify MCP call that can write
to a live storefront. See [the store guard](#the-store-guard) below.

Turn it on in the theme repos, not at user scope:

```bash
claude plugin enable nt-shopify@notambourine -s local
```

### `nt-voice`

- `/nt-voice:human-voice` - Assesses the prose, chooses and states surgical edits or a full rewrite, then hands off.

Requires `nt-vendor` for the two prose skills.

### `nt-vendor`

Mirrors complete skills from other repositories under a clear vendor prefix, with both prose skills available through `/nt-voice:human-voice`.

- `/nt-vendor:anti-slop` - Removes AI writing tells with minimal edits while preserving facts, numbers, and structure.
- `/nt-vendor:humanizer` - Freely rewrites machine-written prose while preserving every claim.
- `/nt-vendor:codebase-design` - Provides a vocabulary for deep modules, seam placement, and deepening opportunities.
- `/nt-vendor:audit-codebase` - Audits the full codebase for simplifications without editing, committing, or pushing.
- `/nt-vendor:improve-codebase-architecture` - Finds deepening opportunities, reports them in HTML, then implements your choice.
- `/nt-vendor:install-anti-slop` - Installs and configures the anti-slop Oxlint plugin in a TypeScript or JavaScript repo.
- `/nt-vendor:eli5` - Explains a topic with a simple picture.

### `nt-share`

- `/nt-share:share` - Publishes a file, folder, or screenshot at one branded, unguessable URL that renders in browsers and serves raw bytes to `curl` and Slack unfurls.

Requires a NoTambourine-issued token.

### `wormhook`

This local, zero-network hook blocks npm and PyPI supply-chain malware, including rogue hooks and MCP entries used for persistence, before execution.

### `qrspi`

- `/qrspi:query` through `/qrspi:implement` - Tracks feature work on a GitHub Project board through five stages: query, research, spec, plan, implement.

## The two hooks

A skill fires only when something in the prompt trips its description. Plenty of
PRs and issues get opened by a sentence that trips nothing, and what lands is
whatever the model invented. `nt-dev` ships two hooks for that gap. Each takes
an off switch and stays silent when there is nothing to say.

**The skill-nudge hook.** "File this as a ticket" trips `/nt-dev:issue`; "also
open an issue for the flaky test" often does not, and the issue that lands has no
milestone, no label, and a one-line body. So this hook names the skill instead of
grading the command. It refuses a `gh pr create` or `gh issue create`, and a
`Write` to a body file the model is about to fill (`pr-body.md`, `prbody.md`,
`pr.md`), saying to read `/nt-dev:pr` or `/nt-dev:issue` first. The `Write` case is
the cheap one, landing before a line of body exists. Invoking the skill is the
all-clear: the hook sees the `Skill` call and goes quiet for the session, so the
skill's own `gh pr create` never hears from it. `--web` is left alone because
GitHub shows the repo's forms itself.

It checks nothing about the PR or the issue. An earlier version graded flags -
milestone, label, section headings - which put the standard in two places and let
it drift, and ended up advising `--template`, a flag `gh` refuses alongside
`--body-file`. The skill is the standard, and a model that has read it can judge
its own body.

| `NT_DEV_SKILL_NUDGE` | What the hook does |
| --- | --- |
| unset | Names the skill once per kind per session, then advises without blocking. |
| `strict` | Names it every time until the skill is actually read. |
| `off` | Nothing. |

**The dash guard.** The gate at
[dash-ratchet](https://github.com/notambourine/dash-ratchet) fails a pull request
on any unicode dash the diff adds. It reports after the commit, so the cheap fix
arrives one push too late. This hook makes the same assertion at the write: it
counts the dashes in the text a `Write` or an `Edit` is carrying against what that
text held before, and when the number rises it names the lines the write added.
The write lands and the model gets those lines while the sentence is still in hand.
`strict` refuses the write instead.

Counting the delta rather than scanning the payload is the whole trick. A file that
already holds a dash, an `Edit` whose `old_string` quotes one back, a paragraph
moved verbatim: a flat scan flags all three over a character it did not introduce,
and a hook that does that gets switched off. The before it measures against is
whatever is nearest the write - the patch the harness reports, an `Edit`'s own
`old_string`, the file on disk, or the blob at the merge base with the default
branch, which is where the gate starts its own diff. A line carrying `dash-ok` is
exempt, the same as under the gate. The excluded directories and a renamed marker
are read off the gate's call in whichever workflow of that file's repo holds it, so
the hook and CI cannot disagree about scope. A repo with no gate still gets the
check.

Each mode answers a different event, because the harness reaches the model two
different ways: naming the lines is a `PostToolUse` block, whose reason the model
reads before it moves on, and refusing the write is a `PreToolUse` deny.

| `NT_DEV_DASH_GUARD` | What the hook does |
| --- | --- |
| unset | Lets the write land, then names the lines that raised the count. |
| `strict` | Refuses the write. |
| `off` | Nothing. |

## The store guard

`nt-shopify` ships one hook and no commands, because a hook runs whether or not anybody
asked and a theme engineer holds a Theme Access token for the production store. The
writable surface that work actually needs is a development theme, so that is the only one
the hook lets through: `shopify theme dev`, `shopify theme push --development
[--development-context <ctx>]`, and the read verbs. Everything else is refused.

The rule is an allowlist, not a blocklist of `publish`/`delete`/`push`. A blocklist is
correct only until the CLI ships a verb nobody here has read about, and the two failures
do not cost the same: a refused call is one `!` away, an unpublished theme going live is a
store outage. So `shopify theme frobnicate` is refused, and so is a Shopify MCP tool added
upstream next month whose name is not on the read list.

Five things it watches, because each one reaches the store by a different route:

| Route | What passes |
| --- | --- |
| `shopify theme <verb>` | `dev` and `push --development` without a live or theme-targeting flag, in long *and* short cluster form (`-nt 123` is caught); the read verbs; `metafields pull` exactly. |
| `shopify store <verb>` | `list`, `schema`, `export`, and a read-only `execute`. `--allow-mutations` reaches products and inventory through the Admin API, past every theme rail, so it is refused; so are `delete`, `copy`, and `import`. |
| `shopify app <verb>` | Local work: `dev`, `build`, `info`, `generate`, `logs`, `versions`, `function`, `env show`/`env pull`, `config link`/`config use`. `deploy` and `release` ship an app version whose cart-transform and pricing functions run in live checkouts, so CI owns those; `config push` and `webhook trigger` are refused too. |
| `SHOPIFY_FLAG_*=` | Nothing. Theme targeting has to be visible in the command, so an assignment naming `THEME`, `LIVE`, `ALLOW_LIVE`, `UNPUBLISHED`, or `PUBLISH` is refused wherever it appears. |
| Shopify MCP tools | The read tools by name (`get-*`, `list-*`, `search_*`, `graphql_query`, `run-analytics-query`). `graphql_mutation`, `set-inventory`, and `update-product` write to production with no CLI in the path, so a guard matching only `Bash` would guard half the door. |

A `-e`/`--environment` flag is the sixth route and gets a belt: the environment's flags live
in `shopify.theme.toml`, where argv cannot show them, so a `theme`, `live`, `allow-live`, or
`unpublished` key there is refused when a command actually selects an environment.

Each command segment is judged on its own, split on `;`, `&`, `|`, and newline, so
`ls -la && shopify theme push --development` cannot borrow a flag across the `&&`.
Matching is loose over the raw text, so a commit message quoting a refused verb trips it
too: that is the intended trade, and the escape hatch is running the command yourself in
the prompt with a leading `!`.

Two things it does not do. It has no opinion on `git push`, which belongs to whichever
repo knows its own remotes. And it guards the `theme`, `store`, and `app` topics only, so
`shopify hydrogen deploy` reaches Oxygen unchallenged.

| `NT_SHOPIFY_GUARD` | What the hook does |
| --- | --- |
| unset | Refuses any call that can write to a live storefront. |
| `off` | Nothing. |

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

A skill costs one line of context until something triggers it, so a plugin you
leave on is close to free. A hook is the thing to weigh: it runs whether or not
you asked, which is why `wormhook` ships alone and why each of `nt-dev`'s two
hooks reads one narrow payload and takes an `off` switch.

## Working on these plugins

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the layout, the naming rule, how to
add a plugin, and how the mirrored content is kept honest.

## License

MIT. See [LICENSE](./LICENSE). Vendored skills keep their own licenses, listed in
[vendor/NOTICE.md](./vendor/NOTICE.md).
