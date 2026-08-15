---
name: pr
description: Draft a pull-request body and open the PR. Trigger on "open a PR", "make a PR", "ship this as a PR", "write the PR description", "update the PR body", or any request that ends in `gh pr create`/`gh pr edit`. Resolves the PR template, fills it from the diff, and opens the PR with a body file.
allowed-tools: Bash, Read, Write, Glob
argument-hint: "[--ready] [pr-number-to-edit]"
---

# pr - write the body, then open the PR

## 1. Resolve the template

The template carries the section contract, so find it before writing anything.
Take the first that exists:

**A. The repo's own committed template.** It is what the web UI already shows a
contributor, so it wins outright.

```bash
TOP=$(git rev-parse --show-toplevel)
ls "$TOP"/.github/pull_request_template.md "$TOP"/.github/PULL_REQUEST_TEMPLATE.md \
   "$TOP"/.github/PULL_REQUEST_TEMPLATE/*.md "$TOP"/docs/pull_request_template.md 2>/dev/null
```

**B. The org template**, `notambourine/.github`. Prefer a local checkout so an
offline session still works, and fall back to the published copy:

```bash
LOCAL=~/sandbox/git-repos/notambourine/dot-github/.github/pull_request_template.md
if [ -f "$LOCAL" ]; then
  TEMPLATE="$LOCAL"
else
  TEMPLATE=$(mktemp -t prtemplate)
  curl -fsSL -o "$TEMPLATE" \
    https://raw.githubusercontent.com/notambourine/.github/main/.github/pull_request_template.md
fi
```

That repo is public and PR-able. A section that reads wrong for the work you
keep doing is a pull request against it, not a local override.

**C. Neither reachable.** Write `Goal`, `Summary`, `Key Decisions`, `Test Plan`,
and say in your reply that the template was unavailable.

Whichever you land on, follow its headings verbatim. Do not reorder them, and do
not graft a heading from one template onto another.

## 2. Fill it

**Read the diff first** - `git diff main...HEAD`, not the branch name and not the
commit subjects. A body assembled from those describes the change instead of
explaining it.

Then write none of the diff back. The reviewer already has it, so the body
carries what the diff cannot show: the problem, the shape of the change, and the
calls that shaped it.

The template's own comments say what each section wants; read them rather than
guessing, then strip them as you fill. Two rules the template does not carry:

**Never hard-wrap the body.** GitHub renders a single newline as `<br>`, so
prose wrapped at 80 columns comes out as an 80-column ragged strip in a box
twice that wide. One physical line per paragraph, per bullet, and per checkbox,
however long it runs. The only newline you type is one the reader should see.

**A diagram is optional, and one is the maximum.** Reach for mermaid only when
the change is a shape a sentence cannot hold - a flow, a lifecycle, an order of
calls across actors. If Before and After would hold the same boxes and only a
label differs, write the sentence instead. When you do draw one, put both states
in a single fenced block as two subgraphs so they render at the same scale, keep
each under about six nodes, quote any label holding punctuation (`L["len(str)"]`),
and give the two sides distinct node ids. Validate it with `maid "$BODY"` if that
tool is on PATH; a block that fails to parse renders as a red error box, which is
worse than no diagram at all.

## 3. Open it

Write the body to a file. A multi-section body passed as a `--body` string loses
its newlines, and `\n` escapes reach GitHub literally.

```bash
BODY=$(mktemp -t prbody)
# ...write the filled template to "$BODY"...
gh pr create --draft --title "<subject>" --body-file "$BODY"
```

- The title carries the scope and the count - `chore(edge): performance tuning
  for Railway and the CDN, 6 URL classes`. Goal elaborates that line rather than
  expanding it into its parts.
- `--draft` by default. Pass `--ready` to the skill to drop it.
- Push first if the branch is unpushed. If your setup gates pushes behind a
  hardware key or a passphrase prompt, that command can hang - wrap it
  (`gtimeout 60 git push`), and on a timeout say so and stop rather than retry.
- Never `--fill` or `--fill-verbose`. They replace the body with commit text and
  drop every section above.

Revise an open PR the same way: `gh pr edit <n> --body-file "$BODY"`.
