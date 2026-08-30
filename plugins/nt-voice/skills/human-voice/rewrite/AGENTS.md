# Agent rules

- `METHOD.md`: runtime source.
- `README.md`: install and pattern index.
- Preserve portable frontmatter.
- Keep 33 pattern names and version `2.9.1` synchronized across method, README, manifest.
- Harness-neutral language.
- Validate with `uv run scripts/validate-package.py`, `npx skills add . --list`, and
  `claude plugin validate .`.
- Behavior fix: add terse version note.
