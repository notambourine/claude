---
name: recall
description: Recover prior Claude Code conversations for the current repository. Use when the user asks what was decided, refers to missing earlier context, or wants to continue a previous session.
allowed-tools:
  - Bash
  - Read
---

<!-- dprint-ignore-file -->

# Recall prior context

Claude Code stores repository sessions as JSONL under `~/.claude/projects/`. Find the matching project, extract only user and assistant text, then answer the current request from that context.

Use recall whenever the user refers to an earlier session you cannot see. Reading is cheaper than guessing.

## Find the project and session

```bash
PROJ_DIR=$(/bin/ls -dt "$HOME"/.claude/projects/*"-$(basename "$PWD")" 2>/dev/null | head -1)
/bin/ls -t "$PROJ_DIR"/*.jsonl 2>/dev/null
```

Claude Code's path slug varies by platform. Match the trailing repository directory, then verify a transcript's `cwd`; repositories with the same basename collide. The newest JSONL is normally the current session, so "last session" usually means the second newest.

## Extract the conversation

```bash
FILE=$(/bin/ls -t "$PROJ_DIR"/*.jsonl | sed -n '2p')
jq -r '
  select(.type == "user" or .type == "assistant") |
  (if .type == "user" then
     (if (.message.content | type) == "string" then .message.content else "" end)
   else
     (.message.content // [] | map(select(.type == "text") | .text) | join("\n"))
   end) as $text |
  select($text != "") |
  select($text | startswith("<system-reminder>") | not) |
  select($text | contains("<user-prompt-submit-hook>") | not) |
  "── " + .type + " @ " + .timestamp + " ──\n" + $text + "\n"
' "$FILE"
```

Filter for `user` and `assistant`; do not maintain a denylist of metadata types. Typed user prompts have string content. Tool results use arrays and are not conversation text. Large tool output may live under `"$PROJ_DIR"/<session-uuid>/tool-results/`; search those files when the transcript contains `<persisted-output>` or a keyword search is unexpectedly empty.

## Disambiguate or search

List up to eight sessions when the user needs to choose:

```bash
for f in $(/bin/ls -t "$PROJ_DIR"/*.jsonl | head -8); do
  first=$(jq -r 'select(.type=="user" and (.message.content|type)=="string") | select(.message.content | startswith("<") | not) | .message.content' "$f" | head -1 | cut -c1-80)
  started=$(jq -r 'select(.timestamp) | .timestamp' "$f" | head -1 | cut -c1-16)
  echo "$started  $(basename "$f" .jsonl)  $first"
done
```

Search all sessions in this project:

```bash
TERM="what to find"
for f in "$PROJ_DIR"/*.jsonl; do
  hits=$(jq -c --arg t "$TERM" '
    select(.type == "user" or .type == "assistant") |
    (if .type == "user" then
       (if (.message.content|type)=="string" then .message.content else "" end)
     else
       (.message.content // [] | map(select(.type=="text")|.text) | join(" "))
     end) as $text |
    select($text | test($t; "i")) |
    {t: .timestamp, role: .type, preview: ($text[0:200])}
  ' "$f")
  [[ -n "$hits" ]] && { echo "=== $(basename "$f") ==="; echo "$hits"; }
done
```

For a cross-repository reference, broaden the search:

```bash
grep -l "keyword" "$HOME/.claude/projects/"*/*.jsonl | head -5
```

## Return to the task

Summarize the prior work, decisions, and unfinished thread in two to four bullets. Cite a timestamp or session UUID when precision matters. Summarize transcripts over 30,000 characters instead of reproducing them. Then answer the user's actual request.

Use `/bin/ls`; aliases such as `eza` can reinterpret `-t`. Read timestamps from JSONL, not filesystem metadata. Never write transcripts into the repository; they may contain secrets.
