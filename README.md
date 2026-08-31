# notambourine/claude

NoTambourine Claude Code plugins.

## Install

```bash
claude plugin marketplace add notambourine/claude
claude plugin list --available --json |
  jq -r '.available[] | select(.marketplaceName == "notambourine") | .pluginId' |
  while read -r plugin; do claude plugin install "$plugin" --scope user; done
```

Update: `claude plugin marketplace update notambourine`

Auto-update: `/plugin` > Marketplaces > notambourine > Enable auto-update.

## Plugins

| Plugin | Commands / purpose |
| --- | --- |
| `nt-brand` | `/nt-brand:system`: brand tokens, CSS, decks, voice, audit |
| `nt-dev` | `/nt-dev:pr`, `issue`, `cleanup`, `recall`, `eod-update`, `commit` |
| `nt-pm` | `/nt-pm:shipped`, `/nt-pm:weekly-recap` |
| `nt-seo-spider` | Screaming Frog MCP, 29 tools, SEO Spider 24+ |
| `nt-shopify` | Blocks live-store writes |
| `nt-voice` | `/nt-voice:human-voice`: surgical edit or rewrite |
| `nt-vendor` | `codebase-design`, `audit-codebase`, `improve-codebase-architecture`, `install-anti-slop`, `eli5` |
| `nt-share` | `/nt-share:share`: branded unguessable URL; token required |
| `wormhook` | Blocks npm/PyPI supply-chain malware |
| `qrspi` | `/qrspi:query` through `/qrspi:implement` |

Enable repo-local plugins:

```bash
claude plugin enable nt-seo-spider@notambourine -s local
claude plugin enable nt-shopify@notambourine -s local
```

Config switches in `.claude/settings.json` `env`:

| Variable | Values |
| --- | --- |
| `NT_DEV_SKILL_NUDGE` | unset: block once; `strict`: block until skill read; `off` |
| `NT_DEV_DASH_GUARD` | unset: block a commit adding Unicode dashes; `strict`: block the write too; `off` |
| `NT_SHOPIFY_GUARD` | unset: block live writes; `off` |

`nt-shopify` allows reads, local app work, theme development, and
`theme push --development`. It blocks live targeting, mutations, deploys, releases,
environment writes, and unknown verbs. Run intentionally blocked commands yourself.

Per-machine control:

```bash
claude plugin install qrspi@notambourine --scope user
claude plugin disable qrspi@notambourine
```

Committed repo control:

```json
{ "enabledPlugins": { "nt-brand@notambourine": true } }
```

Contribute: [CONTRIBUTING.md](CONTRIBUTING.md). License: [MIT](LICENSE). Third-party
notices: [vendor/NOTICE.md](vendor/NOTICE.md).
