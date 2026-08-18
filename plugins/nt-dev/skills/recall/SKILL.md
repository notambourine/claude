---
name: recall
description: Recall a prior Claude Code session for the current repo by walking ~/.claude/projects/<cwd>/*.jsonl and pulling user+assistant text into context. Trigger on phrases like "based on the last convo", "what did we decide last time", "in the previous session", "earlier today we", "yesterday we talked about", "remember when we", "pick up where we left off", "continue from last time", "what were we working on", or any request to recall, search, or resume prior conversations in this repo. Also trigger when the user references something that isn't in current context but sounds like they expect you to remember it.
allowed-tools:
  - Bash
  - Read
---

<!-- dprint-ignore-file -->
<!-- Unwrapped on purpose: one paragraph is one physical line, and the agent mirrors it. -->

# recall - desire-path into prior session context

The user is referencing a past session you don't remember. Past sessions for the current repo live as JSONL files under `~/.claude/projects/<cwd-with-slashes-as-dashes>/`. Walk them, pull text into context, then respond.

## When to fire

Natural-language triggers (non-exhaustive):
- "based on the last convo / chat / session"
- "what did we decide / talk about last time"
- "continue from where we left off"
- "earlier today / yesterday we were…"
- "remember when we…" / "we already discussed…"
- User implies prior context you don't have.

If you're unsure whether the user wants recall vs. a new task, fire this skill - reading a transcript is cheap; guessing wrong is expensive.

## JSONL schema (so you can adapt jq on the fly)

Each line in a session file is one of:

- `{"type":"user", "timestamp":"...", "message":{"role":"user","content": <string|array>}, "sessionId","cwd","gitBranch","uuid","parentUuid"}`
- `{"type":"assistant", "message":{"content":[{"type":"text","text":"..."}|{"type":"thinking",...}|{"type":"tool_use","name":"...","input":{...}}]}}`
- Everything else (`attachment`, `system`, `mode`, `permission-mode`, `last-prompt`, `queue-operation`, `file-history-snapshot`, …) - skip. The type list grows across CC versions; always filter **for** user/assistant, never filter **out** known noise.

`.message.content` is a **string** for typed prompts, an **array of blocks** for tool results. User lines whose string content starts with `<system-reminder>` or contains `<user-prompt-submit-hook>` are harness injections - filter them.

Large tool outputs are NOT inline: the JSONL keeps a `<persisted-output>` stub and the full text lives in `<PROJ_DIR>/<session-uuid>/tool-results/*.txt` (the dir exists only for sessions that produced big outputs). Keyword search over `*.jsonl` misses that content - grep `"$PROJ_DIR"/*/tool-results/` as a second pass when a search comes up dry.

## Execution

**1. Locate the project directory:**

```bash
PROJ_DIR=$(/bin/ls -dt "$HOME"/.claude/projects/*"-$(basename "$PWD")" 2>/dev/null | head -1)
/bin/ls -t "$PROJ_DIR"/*.jsonl 2>/dev/null
```

Match on the trailing folder name rather than building the whole slug. Claude Code derives
the directory name from the host path, so the slug is `-Users-me-repo` on macOS and
`C--Users-me-repo` on Windows, and the same `tr` never produces both. Two repos sharing a
folder name both match: the newest wins, so check the `cwd` field of a line before you
trust a transcript.

The newest file is *this* session. The second-newest is usually what "the last convo" means.

**2. Pull a transcript** (user + assistant text, in order, noise filtered):

```bash
FILE=$(/bin/ls -t "$PROJ_DIR"/*.jsonl | sed -n '2p')  # second-newest
jq -r '
  select(.type == "user" or .type == "assistant") |
  (
    if .type == "user" then
      (if (.message.content | type) == "string" then .message.content else "" end)
    else
      (.message.content // [] | map(select(.type == "text") | .text) | join("\n"))
    end
  ) as $text |
  select($text != "") |
  select($text | startswith("<system-reminder>") | not) |
  select($text | contains("<user-prompt-submit-hook>") | not) |
  "── " + .type + " @ " + .timestamp + " ──\n" + $text + "\n"
' "$FILE"
```

Tested working - this output lands in your context as the Bash tool result.

**3. List recent sessions** (when the user says "which convo?" or you need to disambiguate):

```bash
for f in $(/bin/ls -t "$PROJ_DIR"/*.jsonl | head -8); do
  first=$(jq -r 'select(.type=="user" and (.message.content|type)=="string") | select(.message.content | startswith("<") | not) | .message.content' "$f" | head -1 | cut -c1-80)
  started=$(jq -r 'select(.timestamp) | .timestamp' "$f" | head -1 | cut -c1-16)
  echo "$started  $(basename "$f" .jsonl)  $first"
done
```

**4. Keyword search across all sessions for this repo:**

```bash
TERM="what to find"
for f in "$PROJ_DIR"/*.jsonl; do
  hits=$(jq -c --arg t "$TERM" '
    select(.type == "user" or .type == "assistant") |
    (
      if .type == "user" then
        (if (.message.content|type)=="string" then .message.content else "" end)
      else
        (.message.content // [] | map(select(.type=="text")|.text) | join(" "))
      end
    ) as $text |
    select($text | test($t; "i")) |
    {t: .timestamp, role: .type, preview: ($text[0:200])}
  ' "$f")
  [[ -n "$hits" ]] && { echo "=== $(basename "$f") ==="; echo "$hits"; }
done
```

**5. Broaden to all repos** when the user's reference sounds cross-repo (e.g., "we figured this out in the other repo last week"):

```bash
grep -l "keyword" "$HOME/.claude/projects/"*/*.jsonl | head -5
```

## After reading

- Summarize in 2-4 bullets: what the user was working on, what was decided, what's unfinished.
- Quote timestamps or session UUIDs when citing specifics.
- Then answer the user's actual question using that context.
- If the transcript is >30k chars, summarize - don't quote wall-to-wall.
- **Do not write transcripts to files in the repo.** They may contain secrets (env vars, tokens visible in tool output).

## Gotchas

- **Use `/bin/ls`, not bare `ls`.** A shell that aliases `ls` to `eza` reads `-t` as `--time <FIELD>`, so bare `ls -t` inside `$( )` errors or silently returns nothing.
- **Read the session's own first `timestamp`, never `stat`.** The flags split by platform - BSD and macOS take `-f '%Sm'`, GNU coreutils takes `-c '%y'` - and the JSONL carries the time already.
- Filenames are session UUIDs, not timestamps - always sort by `/bin/ls -t` (mtime).
- **Windows runs this through Git Bash**, so the shell here works as written. `jq` is the one thing it does not ship: install it (`winget install jqlang.jq`) before the transcript pull.
- `$PROJ_DIR` also contains bare per-session UUID *directories* (`tool-results/` persistence) - the `*.jsonl` glob skips them, but a plain dir listing shows both.
- Current session's JSONL is being written right now; reading it just echoes this conversation back.
- If `cwd` differs (worktree, symlinked repo), fall back to `grep -l` across `~/.claude/projects/*/` or ask the user which repo.
- Metadata lines (`mode`, `permission-mode`, `last-prompt`, …) interleave throughout the file, not just the head - the user/assistant filter drops them all.
