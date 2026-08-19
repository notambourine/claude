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
| `nt-dev` | `/nt-dev:pr` `/nt-dev:cleanup` `/nt-dev:md-format` `/nt-dev:recall` `/nt-dev:issue` `/nt-dev:eod-update` | Fills a PR body from the diff and opens it, audits a repo for dead refs and stale docs, wraps and tidies markdown at a width you pick, reads a prior session in this repo back into context, writes a GitHub issue to the house standard, writes a copy-paste end-of-day standup update from today's GitHub activity (never posts). Also ships the `Attentive` output style, below. |
| `nt-pm` | `/nt-pm:shipped` `/nt-pm:weekly-recap` | Plain-English status updates for a non-technical audience. `shipped` writes a "Deploy Updates" summary — what's about to ship (promotion or current branch vs the default branch) or what just shipped (the last push to the default branch, from the reflog), grouped by category. `weekly-recap` writes a week-level summary of merged, in-review, and in-progress work across the whole team. Never posts, never deploys. |
| `nt-vendor` | `/nt-vendor:humanizer` `/nt-vendor:anti-slop` `/nt-vendor:codebase-design` and three more | Skills mirrored whole from other people's repos, kept under a prefix that says so. |
| `nt-share` | `/nt-share:share` | Turns a file, folder, or screenshot into one branded unguessable link. Browsers get a rendered page, `curl` and Slack unfurls get raw bytes from the same URL. Needs a NoTambourine-issued token. |
| `wormhook` | runs as a hook | Blocks npm and PyPI supply-chain malware, and the rogue hooks and MCP entries that malware writes to persist, before any of it executes. Local and zero-network. |
| `qrspi` | `/qrspi:query` through `/qrspi:implement` | Feature work as five tracked stages on a GitHub Project board: query, research, spec, plan, implement. |

Commands are namespaced by plugin, always two segments: `/nt-brand:system`.

## The Attentive output style

`nt-dev` ships one output style. Installing the plugin only puts it in the
picker; pick it under `/config` → Output style, or name it in settings:

```json
{ "outputStyle": "Attentive" }
```

It merges two halves that usually ship apart. From the built-in `Proactive`
style it takes the license to act: start the work, assume rather than interrupt,
and stop only at a step that destroys data or sends your information outward.
On top of that it puts a reporting contract, because a Claude that works ahead
of you is *reporting*, not answering. It leads with what changed, never lets
"done" outrun the evidence, and says what it skipped and why.

Pick it when you want Claude working unattended. `Proactive` alone acts fast but
hands back whatever shape it likes; `Attentive` acts just as fast and makes the
handback readable.

Credit where it is due: the attention-protection half is our own clean-room
write-up of ideas from Alex Greenshtein's
[attention-span](https://github.com/alexgreensh/attention-span). No text was
copied, so this stays MIT while the original is AGPL-3.0. If you want the
original rather than our merge, install it from that repo.

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
add a plugin, and how the mirrored content is kept honest.

## License

MIT. See [LICENSE](./LICENSE). Vendored skills keep their own licenses, listed in
[vendor/NOTICE.md](./vendor/NOTICE.md).
