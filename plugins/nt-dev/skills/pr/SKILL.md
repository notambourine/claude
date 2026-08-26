---
name: pr
description: Draft or revise a pull request from the actual diff, follow the repository's template, and create a draft PR by default. Use for PR bodies, `gh pr create`, and `gh pr edit`.
allowed-tools: Bash, Read, Write, Glob
argument-hint: "[pr-number-to-edit]"
---

<!-- dprint-ignore-file -->

# Pull request

Read the diff, fill the applicable template, and open a draft PR.

## Resolve the template

The repository's committed template wins:

```bash
TOP=$(git rev-parse --show-toplevel)
ls "$TOP"/.github/pull_request_template.md "$TOP"/.github/PULL_REQUEST_TEMPLATE.md "$TOP"/.github/PULL_REQUEST_TEMPLATE/*.md "$TOP"/docs/pull_request_template.md 2>/dev/null
```

If none exists, use `${CLAUDE_PLUGIN_ROOT}/skills/pr/.github/pull_request_template.md`. Follow the selected headings and order exactly; do not combine templates.

## Read before writing

Use `git diff main...HEAD`, adjusted only when the repository's base branch differs. Do not infer the change from branch names or commit subjects.

The body explains what the diff cannot: the problem, the result, and the choices that shaped it. Do not narrate files or reprint implementation details.

Keep the complete body within 150 words unless the repository template sets a tighter budget. Scale it to the change. Preserve screenshots and required `_none_` markers before prose.

- Open on the outcome.
- Write at the reviewer's altitude. Use implementation detail only when it changes what they should inspect.
- Use short sentences and one idea per bullet.
- Include at most one Mermaid diagram, only for a flow, lifecycle, or call order that prose cannot hold. Put before and after in one fence, use distinct node IDs, quote punctuation-bearing labels, and keep each state near six nodes. Run `maid "$BODY"` when available.

## Keep physical lines intact

GitHub renders a single newline as a visible break. Write one physical line per paragraph, bullet, checkbox, table row, heading, or fence. Never wrap prose to a source-code column. Never indent a bullet continuation four spaces; GitHub renders it as code.

Read the body file before submission and fix accidental wrapping.

## Screenshots

Upload captures as GitHub user attachments. Do not commit them or use a third-party host.

```bash
FILE=shot.png
REPO=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
URL=$(curl -s -X POST \
  "https://uploads.github.com/user-attachments/assets?name=$(basename "$FILE")&content_type=image/png&repository_id=$(gh api "repos/$REPO" --jq .id)" \
  -H "Authorization: Bearer $(gh auth token)" \
  -H "Accept: application/json" \
  --data-binary "@$FILE" | jq -r .url)
```

Embed `![before]($URL)` in the body. The endpoint is undocumented. If it returns 404 or 422, create a prerelease with the capture, embed its asset URL, and remove the release after merge:

```bash
gh release create pr-<n>-shots --prerelease "$FILE"
```

## Open or update

Use a body file so newlines survive:

```bash
BODY="$(mktemp -d)/pr-body.md"
# Write the filled template to the full path with the Write tool.
gh pr create --draft --title "<subject>" --body-file "$BODY"
```

Shell state does not survive between tool calls; recreate `BODY` or use the full path. Make the title specific enough to carry scope. Use `--ready` only when requested. Never use `--fill` or `--fill-verbose`.

Push an unpushed branch first. On macOS use `gtimeout 60 git push`; on Linux use `timeout 60 git push`; use bare `git push` only where neither exists. Stop and report exit 124 rather than retrying a hardware-key or passphrase timeout.

Revise an existing PR with:

```bash
gh pr edit <number> --body-file "$BODY"
```

The plugin's `hooks/gh-skill-nudge.mjs` routes an unscoped body write or `gh pr create` here. `NT_DEV_SKILL_NUDGE` accepts `strict`, `off`, or the default advisory behavior.
