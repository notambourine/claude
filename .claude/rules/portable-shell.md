---
paths:
  - "plugins/**/*.md"
  - "scripts/*.mjs"
---

# Portable shell

A skill ships to teammates on macOS, Linux, and Windows. Windows runs the Bash tool
through Git Bash, so POSIX syntax and the MSYS coreutils are there; BSD flag spellings,
Homebrew binaries, and macOS-only tools are not. `node scripts/check-portable.mjs`
enforces the list below and runs in CI on both Linux and Windows.

- Write the invocation that runs on all three, or name the platform on the same line.
  The check reads a line naming macOS, BSD, Homebrew, Git Bash, Linux, or GNU coreutils
  as documentation and lets it through.
- Never `pbcopy`, `pbpaste`, `osascript`, `brew`, or `gtimeout`. Git Bash ships no
  `timeout` under any name.
- Never `stat` for a file time. Read the timestamp out of the file where one exists;
  BSD spells the flags `-f '%Sm'` and GNU spells them `-c '%y'`.
- Bare `mktemp`, never `mktemp -t <prefix>`. GNU rejects a template with no `XXXXXX`.
- Never `sed -i ''` or `readlink -f`. Both are BSD-only spellings.
- Never a machine's absolute path (`/Users/...`, `C:\Users\...`). Resolve from `$PWD`,
  `$HOME`, `git rev-parse --show-toplevel`, or `${CLAUDE_PLUGIN_ROOT}`.
- Derive a `~/.claude/projects/` directory name by matching the trailing folder name,
  never by transforming `$PWD`. Claude Code builds that slug from the host path, so the
  Windows form starts `C--` and no single transform produces both.
- Key a path in JavaScript by forward slash. `node:path` returns backslashes on Windows,
  and a digest map or manifest keyed that way reads as one file added and one removed.
- Say which tools a skill needs beyond the shell. `jq` ships on no platform by default.
