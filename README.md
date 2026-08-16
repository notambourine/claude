# notambourine/claude

The Claude Code plugins the NoTambourine practice works out of: the brand system,
everyday PR and cleanup workflow, supply-chain scanning, and one-link file sharing.

Add the marketplace once, then turn plugins on per machine or per repo.

## Install

```bash
claude plugin marketplace add notambourine/claude
claude plugin install nt-brand@notambourine --scope user
```

For the whole set, read the names off the marketplace instead of typing them out:

```bash
claude plugin list --available --json |
  jq -r '.available[] | select(.marketplaceName == "notambourine") | .pluginId' |
  while read -r plugin; do claude plugin install "$plugin" --scope user; done
```

`--available` skips anything you already have, so the same command picks up a
plugin added since your last run.

## What you get

| Plugin | Commands | What it does |
| --- | --- | --- |
| `nt-brand` | `/nt-brand:system` | Colors, type, spacing, component CSS, a Marpit deck theme, and the voice rules, plus the audit that checks work against them. Native CSS with no build step, so it drops into a page, a Worker, or a React app. |
| `nt-dev` | `/nt-dev:pr` `/nt-dev:cleanup` `/nt-dev:recall` | Fills a PR body from the diff and opens it, audits a repo for dead refs and stale docs, reads a prior session in this repo back into context. |
| `nt-vendor` | `/nt-vendor:humanizer` `/nt-vendor:anti-slop` `/nt-vendor:codebase-design` and three more | Skills mirrored whole from other people's repos, kept under a prefix that says so. |
| `nt-share` | `/nt-share:share` | Turns a file, folder, or screenshot into one branded unguessable link. Browsers get a rendered page, `curl` and Slack unfurls get raw bytes from the same URL. Needs a NoTambourine-issued token. |
| `wormhook` | runs as a hook | Blocks npm and PyPI supply-chain malware, and the rogue hooks and MCP entries that malware writes to persist, before any of it executes. Local and zero-network. |
| `qrspi` | `/qrspi:query` through `/qrspi:implement` | Feature work as five tracked stages on a GitHub Project board: query, research, spec, plan, implement. |

Commands are namespaced by plugin, always two segments: `/nt-brand:system`.

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
leave on is close to free. A hook runs every session, which is why `wormhook`
ships alone.

## Working on these plugins

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the layout, the naming rule, how to
add a plugin, and how the vendored and submoduled content is kept honest.

## License

MIT. See [LICENSE](./LICENSE). Vendored skills keep their own licenses, listed in
[vendor/NOTICE.md](./vendor/NOTICE.md).
