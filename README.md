# notambourine/claude-plugin

The `notambourine-internal` marketplace: a thin catalog of the practice's Claude
Code plugins, plus the one plugin that lives here.

**Install**

```bash
claude plugin marketplace add notambourine/claude-plugin
claude plugin install nt@notambourine-internal --scope user
```

Slash commands become `/nt:<name>`.

## Catalog

Every plugin in the marketplace, and where its code lives:

| Plugin | Source | What it does |
| --- | --- | --- |
| `nt` | this repo | Brand wordmark audit for the NoTambourine brand system. |
| `share` | [notambourine/share](https://github.com/notambourine/share) | Share artifacts as branded unguessable links on share.notambourine.com. |
| `wormhook` | [notambourine/wormhook](https://github.com/notambourine/wormhook) | Blocks npm/PyPI supply-chain malware and agent-hijack persistence at the hook. |
| `qrspi` | [notambourine/qrspi](https://github.com/notambourine/qrspi) | GitHub-native Query, Research, Spec, Plan, Implement workflow. |

Install any of them from this marketplace:

```bash
claude plugin install wormhook@notambourine-internal --scope user
```

## Where a plugin lives

A plugin belongs in the repo that owns its domain, and this catalog lists it by
GitHub reference. The `wormhook` scanner ships from `notambourine/wormhook`;
the `share` commands ship from the repo that runs share.notambourine.com. That
keeps each plugin versioned and released with the code it wraps, so a change and
its plugin move in one commit.

Only practice-wide content with no natural home lives here; today that is the
`nt` plugin. Before adding a directory to this repo, name the repo that owns the
domain; if one exists, the plugin goes there and gets a row in the catalog above.

**Add a catalog entry** by appending to `plugins` in
`.claude-plugin/marketplace.json`:

```json
{
  "name": "example",
  "source": { "source": "github", "repo": "notambourine/example" },
  "description": "One line, copied from that repo's own marketplace.json."
}
```

The `github:owner/repo` shorthand does not validate; use the object form.

## What ships from this repo

- **`/nt:brand-check`** — audit a file, directory, or git diff for wordmark
  violations: lowercase `notambourine` in human-facing copy where the
  `NoTambourine` wordmark belongs, plus overuse of `NoTambourine LLC` outside
  contract signature blocks.

## Brand rules

- **`NoTambourine`** = wordmark. All human-facing copy.
- **`notambourine`** = slug. Only where tooling demands lowercase — paths, URLs,
  domains, the GitHub org, npm package names, CSS classes.
- **`NoTambourine LLC`** = legal form. Only in contract signature blocks and one
  Definitions anchor (e.g. `"Consultant" means NoTambourine LLC…`).

## Extending the `nt` plugin

For practice-wide content only. Anything tied to a product or a service goes in
the repo that owns it. Add a skill under `skills/<name>/SKILL.md`, a single markdown
file with YAML frontmatter and a body. To add hooks, create `hooks/hooks.json`
referencing bundled scripts in `scripts/` via `${CLAUDE_PLUGIN_ROOT}`; see
[wormhook](https://github.com/notambourine/wormhook) for a worked example. The
`agents/` directory is scaffolded (keeps a `.gitkeep`) but currently empty.

## License

MIT. See [LICENSE](./LICENSE).
