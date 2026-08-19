---
name: pr
description: Draft a pull-request body and open the PR. Trigger on "open a PR", "make a PR", "ship this as a PR", "write the PR description", "update the PR body", or any request that ends in `gh pr create`/`gh pr edit`. Resolves the PR template, fills it from the diff, and opens the PR with a body file.
allowed-tools: Bash, Read, Write, Glob
argument-hint: "[--ready] [pr-number-to-edit]"
---

<!-- dprint-ignore-file -->

# pr - write the body, then open the PR

This file is written unwrapped on purpose. Every paragraph and bullet below is one physical line, however long it runs, because a PR body must be written the same way and you will mirror whatever shape you read here.

## 1. Resolve the template

The template carries the section contract, so find it before writing anything. Take the first that exists:

**A. The repo's own committed template.** It is what the web UI already shows a contributor, so it wins outright.

```bash
TOP=$(git rev-parse --show-toplevel)
ls "$TOP"/.github/pull_request_template.md "$TOP"/.github/PULL_REQUEST_TEMPLATE.md \
   "$TOP"/.github/PULL_REQUEST_TEMPLATE/*.md "$TOP"/docs/pull_request_template.md 2>/dev/null
```

**B. The org template**, `notambourine/.github`. Prefer a local checkout so an offline session still works, and fall back to the published copy:

```bash
LOCAL=~/sandbox/git-repos/notambourine/dot-github/.github/pull_request_template.md
if [ -f "$LOCAL" ]; then
  TEMPLATE="$LOCAL"
else
  TEMPLATE=$(mktemp)
  curl -fsSL -o "$TEMPLATE" \
    https://raw.githubusercontent.com/notambourine/.github/main/.github/pull_request_template.md
fi
```

That repo is public and PR-able. A section that reads wrong for the work you keep doing is a pull request against it, not a local override.

**C. Neither reachable.** Write `Goal`, `Summary`, `Key Decisions`, `Test Plan`, and say in your reply that the template was unavailable.

Whichever you land on, follow its headings verbatim. Do not reorder them, and do not graft a heading from one template onto another.

## 2. Never hard-wrap the body

GitHub renders a single newline as `<br>`, so prose wrapped at 80 columns comes out as an 80-column ragged strip in a box twice that wide. Write one physical line per paragraph, per bullet, and per checkbox, however long it runs. The only newline you type is one the reader should see.

- This outranks every other formatting habit you carry into the file, including the 80-column norm for source and the one-instruction-per-sentence rule for prose. Those govern a file a diff reads; this governs a page a browser renders.
- A continuation line indented under a bullet or a checkbox is worse than ragged. Four spaces of indent makes GitHub render it as a code block, so `- [x] zizmor clean` with an indented parenthetical under it comes out as a grey box.

Then stop trusting yourself about it and run the formatter over the finished file, before `gh` ever sees it. It joins every wrapped paragraph and pulls every indented continuation back onto its bullet, and it leaves fenced code, tables, and frontmatter alone:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/md-format/mdfmt.mjs" --nowrap "$BODY"
```

The body file has to end in `.md` for the formatter to pick it up, which step 5 handles. Read it back afterward: every line is a heading, a fence, a table row, a blank line, or one whole paragraph, bullet, or box - nothing else.

This plugin also ships a `PreToolUse` hook, `hooks/gh-body-file-nowrap.mjs`, that runs the same formatter over any `--body-file` or `--notes-file` a `gh` command names, in the moment between the file being written and `gh` reading it. It is a backstop, not a substitute: it cannot reach a path only the shell knows, such as `--body-file "$BODY"`, so it denies that command instead - which is why step 5 runs the formatter in the same command as `gh`. Config, in a repo's `.claude/settings.json` or your own, under `env`:

| `NT_DEV_PR_FORMAT` | What the hook does |
| --- | --- |
| unset | Unwraps every body file it can read. Denies one it cannot, and says how to fix it. |
| `strict` | The above, plus: `gh pr create` and `gh pr edit` may not pass `--body` inline or `--fill`, so a PR body cannot skip this skill even when nothing triggered it. |
| `off` | Nothing. |

## 3. Fill it

**Read the diff first** - `git diff main...HEAD`, not the branch name and not the commit subjects. A body assembled from those describes the change instead of explaining it.

Then write none of the diff back. The reviewer already has it, so the body carries what the diff cannot show: the problem, the shape of the change, and the calls that shaped it.

The template's own comments say what each section wants; read them rather than guessing, then strip them as you fill.

**A diagram is optional, and one is the maximum.** Reach for mermaid only when the change is a shape a sentence cannot hold - a flow, a lifecycle, an order of calls across actors. If Before and After would hold the same boxes and only a label differs, write the sentence instead. When you do draw one, put both states in a single fenced block as two subgraphs so they render at the same scale, keep each under about six nodes, quote any label holding punctuation (`L["len(str)"]`), and give the two sides distinct node ids. Validate it with `maid "$BODY"` if that tool is on PATH; a block that fails to parse renders as a red error box, which is worse than no diagram at all.

## 4. Screenshots

Upload the file, embed the URL it returns. Never commit a screenshot, never open a branch of PNGs, and never reach for a third-party image host - the first two pollute history and render broken on a private repo, the third leaks the shot. Needs `jq`.

```bash
FILE=shot.png; REPO=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
URL=$(curl -s -X POST \
  "https://uploads.github.com/user-attachments/assets?name=$(basename "$FILE")&content_type=image/png&repository_id=$(gh api "repos/$REPO" --jq .id)" \
  -H "Authorization: Bearer $(gh auth token)" \
  -H "Accept: application/json" \
  --data-binary "@$FILE" | jq -r .url)
```

That is the same URL the web UI's drag-and-drop produces, so a private repo's access control comes with it. Put `![before]($URL)` in the body file, or `gh pr comment <n> --body "![before]($URL)"` after the fact.

The endpoint is undocumented and carries no deprecation contract. On a 422 or a 404 the token is not the problem, the endpoint moved: fall back to `gh release create pr-<n>-shots --prerelease "$FILE"`, embed the asset's `browser_download_url`, and delete the release when the PR merges.

## 5. Open it

Write the body to a file. A multi-section body passed as a `--body` string loses its newlines, and `\n` escapes reach GitHub literally.

```bash
BODY="$(mktemp -d)/pr-body.md"
# ...write the filled template to "$BODY" with the Write tool...
node "${CLAUDE_PLUGIN_ROOT}/skills/md-format/mdfmt.mjs" --nowrap "$BODY" &&
  gh pr create --draft --title "<subject>" --body-file "$BODY"
```

- Format and post in **one** command, chained as above. A `$BODY` set by an earlier Bash call is gone by the next one, and the hook in step 2 denies a `--body-file` it cannot read unless the same command formats it.

- The title carries the scope and the count - `chore(edge): performance tuning for Railway and the CDN, 6 URL classes`. Goal elaborates that line rather than expanding it into its parts.
- `--draft` by default. Pass `--ready` to the skill to drop it.
- Push first if the branch is unpushed. If your setup gates pushes behind a hardware key or a passphrase prompt, that command can hang. Wrap it in whichever timeout the machine has - `timeout 60 git push` on Linux, `gtimeout 60 git push` on macOS with Homebrew coreutils - and where there is none, such as Git Bash on Windows, run it bare and stop on a hang. On a timeout say so and stop rather than retry.
- Never `--fill` or `--fill-verbose`. They replace the body with commit text and drop every section above.

Revise an open PR the same way, formatter and `gh` in one chain: `node "${CLAUDE_PLUGIN_ROOT}/skills/md-format/mdfmt.mjs" --nowrap "$BODY" && gh pr edit <n> --body-file "$BODY"`.
