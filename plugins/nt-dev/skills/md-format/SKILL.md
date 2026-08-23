---
name: md-format
description: Format markdown - wrap prose to a width, align tables, normalize headings and list markers. Trigger on "format the markdown", "md format", "reflow this doc", "wrap these docs at 80/100/200", "the markdown is a mess", or any request to tidy or re-wrap .md files. Defaults to the markdown this branch changed; also takes `all`, a file, or a folder.
allowed-tools: Bash, Read, Glob
argument-hint: "[all | <file.md> | <dir>] [--width 80|100|200|never|keep] [--nowrap] [--check]"
---

# md-format - wrap and tidy markdown

One command does the whole job. Run it, read what it reports, and stop.

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/md-format/mdfmt.mjs" $ARGUMENTS
```

Pass the user's words through as flags; do not edit markdown by hand to get the same
result. The formatter is deterministic, so a hand edit is churn the next run undoes.

## What the arguments mean

| The user said                                 | Pass                  |
| --------------------------------------------- | --------------------- |
| nothing, or "this PR", "my changes"           | nothing - the default |
| "all", "the whole repo", "every doc"          | `all`                 |
| a filename                                    | that path             |
| a folder, "the docs"                          | that folder           |
| "just what's staged"                          | `--staged`            |
| "at 80", "wrap at 120", "200 columns"         | `--width 80`          |
| "don't wrap", "one line per paragraph"        | `--nowrap`            |
| "leave my line breaks alone"                  | `--width keep`        |
| "show me first", "dry run", "would it change" | `--check`             |

The default is the markdown this branch changed against its base, plus anything
uncommitted or newly added - the files a reviewer will see. `--check` writes nothing,
prints the diff, and exits 1 when a file would change, so it is also the CI form.

A path outside the repository works too, so a scratch file - a PR body waiting in a temp
directory - can be formatted before it is posted.

Run `mdfmt.mjs --help` for the rest (`--base`, `--exclude`, `--list`, `--config`).

## Picking a width

Width is the only setting worth arguing about, so it is the one flag that always wins over
the config.

- **90** is the default: long enough for a real sentence, short enough to read in a split
  pane and to diff a line at a time.
- **80** for files people read in a terminal - `README.md`, `CONTRIBUTING.md`,
  man-page-ish docs.
- **120** or more when tables and links dominate and 90 shreds them.
- **`never`**, spelled `--nowrap`, for prose a browser renders, where one paragraph must
  be one physical line - a PR body above all, since GitHub turns every newline into a
  `<br>`.
- **`keep`** when a repo's line breaks are deliberate - one sentence per line, say. It
  still aligns tables and fixes markers; it just never moves a break.

Rewrapping a long-lived doc touches every line in it. On a shared file, format it in its
own commit so the next reviewer can read the diff that follows.

## What it normalizes

Prose and list items wrap to the width. Tables get padded to their widest cell and
aligned. Setext headings become `#`, ordered lists get real ascending numbers, unordered
lists get `-`, emphasis gets `_`, bold gets `**`. Blank runs collapse to one.

Left alone: YAML frontmatter, fenced and indented code blocks, raw HTML blocks, link
reference definitions, and anything inside an ignore directive.

## Opting out

- A whole file: `<!-- dprint-ignore-file -->` above the content, and in a file with YAML
  frontmatter that means the first line _after_ the closing `---`, never above it. Write
  the directive bare - trailing words in the same comment stop it matching, so a reason
  goes on its own comment line below.
- A passage: wrap it in `<!-- dprint-ignore-start -->` and `<!-- dprint-ignore-end -->`.
- A whole tree, or a file you must not edit because it mirrors someone else's bytes: add
  the glob to `excludes` in the repo's own `dprint.json`, or pass `--exclude <glob>`.

A repo-root `dprint.json` with a `markdown` block is the repo's house style and the script
uses it instead of the skill's default. That is where a repo pins its own width once.

## Never

- Never commit. Report what changed and let the user stage it.
- Never format a file the user did not ask about to "be consistent". The default scope is
  the point.
- Never hand-edit a mirrored tree to add an ignore directive. Exclude it instead.

## Under it

[dprint](https://dprint.dev) plus its markdown plugin - a Rust CLI and one wasm module,
both version-pinned, the plugin also checksum-pinned in `dprint.json`. No project install
and no dependency added to the repo: `npx` fetches the CLI, or the script uses a `dprint`
already on `PATH`. First run downloads both and caches them, so it takes a few seconds;
every run after is instant.

Needs `node` on `PATH`, a git repo, and network access the first time only. Say so if the
first run has to download, and say nothing about it afterward.
