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
```

## What you get

| Plugin | Commands | What it does |
| --- | --- | --- |
| `nt-brand` | `/nt-brand:system` | Colors, type, spacing, component CSS, a Marpit deck theme, and the voice rules, plus the audit that checks work against them. Native CSS with no build step, so it drops into a page, a Worker, or a React app. |
| `nt-dev` | `/nt-dev:pr` `/nt-dev:cleanup` `/nt-dev:recall` `/nt-dev:issue` `/nt-dev:eod-update` | Fills a PR body from the diff and opens it, audits a repo for dead refs and stale docs, reads a prior session in this repo back into context, writes a GitHub issue to the house standard, writes a copy-paste end-of-day standup update from today's GitHub activity (never posts). Also ships the `Brief` and `Attentive` output styles and the two hooks, all below. |
| `nt-pm` | `/nt-pm:shipped` `/nt-pm:weekly-recap` | Plain-English status updates for a non-technical audience. `shipped` writes a "Deploy Updates" summary of what is about to ship (promotion or current branch vs the default branch) or what just shipped (the last push to the default branch, from the reflog), grouped by category. `weekly-recap` writes a week-level summary of merged, in-review, and in-progress work across the whole team. Never posts, never deploys. |
| `nt-voice` | `/nt-voice:human-voice` | The prose voice pass, behind one command. Two vendored skills do the work and disagree on method - surgical phrasing edits versus a full rewrite - so this triages the ask, picks one, says which, and hands off. Ask for it any way you like. Needs `nt-vendor`. |
| `nt-vendor` | `/nt-vendor:humanizer` `/nt-vendor:anti-slop` `/nt-vendor:codebase-design` `/nt-vendor:eli5` and three more | Skills mirrored whole from other people's repos, kept under a prefix that says so. The two prose skills are reached through `/nt-voice:human-voice`. |
| `nt-share` | `/nt-share:share` | Turns a file, folder, or screenshot into one branded unguessable link. Browsers get a rendered page, `curl` and Slack unfurls get raw bytes from the same URL. Needs a NoTambourine-issued token. |
| `wormhook` | runs as a hook | Blocks npm and PyPI supply-chain malware, and the rogue hooks and MCP entries that malware writes to persist, before any of it executes. Local and zero-network. |
| `qrspi` | `/qrspi:query` through `/qrspi:implement` | Feature work as five tracked stages on a GitHub Project board: query, research, spec, plan, implement. |

Commands are namespaced by plugin, always two segments: `/nt-brand:system`.

## The two output styles

`nt-dev` ships two. Installing the plugin only puts them in the picker. Pick one
under `/config` → Output style, or name it in settings:

```json
{ "outputStyle": "Brief" }
```

### Brief

Outcome first, then stop. Short declarative sentences at the reader's altitude,
no preamble and no closing recap.

It exists because the built-in `Concise` governs the chat reply and nothing else.
A session set to `Concise` still writes an eight-hundred-word issue comment, because
the skill writing that comment asked for detail and no cap contradicted it. `Brief`
claims every output - issue body, PR description, commit message, doc, Slack update -
and carries hard word caps plus one altitude rule: user-facing behavior by default,
file names and API specifics only for a reader already in the code. It also names the
five things that keep their full length, so the cap never eats a failing test's output
or a warning.

### Attentive

Works autonomously, reports like a colleague. It merges two halves that usually
ship apart. From the built-in `Proactive` style it takes the license to act: start
the work, assume rather than interrupt, and stop only at a step that destroys data
or sends your information outward. On top of that it puts a reporting contract,
because a Claude that works ahead of you is *reporting*. It leads with what changed,
never lets "done" outrun the evidence, and says what it skipped and why.

Pick `Attentive` when you want Claude working unattended, and `Brief` when the
problem is length rather than autonomy.

Credit where it is due: the attention-protection half is our own clean-room
write-up of ideas from Alex Greenshtein's
[attention-span](https://github.com/alexgreensh/attention-span). No text was
copied, so this stays MIT while the original is AGPL-3.0. If you want the
original rather than our merge, install it from that repo.

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
you asked, which is why `wormhook` ships alone and why each of `nt-dev`'s three
hooks reads one narrow payload and takes an `off` switch.

## Working on these plugins

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the layout, the naming rule, how to
add a plugin, and how the mirrored content is kept honest.

## License

MIT. See [LICENSE](./LICENSE). Vendored skills keep their own licenses, listed in
[vendor/NOTICE.md](./vendor/NOTICE.md).
