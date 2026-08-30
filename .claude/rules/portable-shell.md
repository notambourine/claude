---
paths:
  - "plugins/**/*.md"
  - "scripts/*.mjs"
---

# Portable shell

Target macOS, Linux, Git Bash. Check: `node scripts/check-portable.mjs`.

- POSIX/MSYS only; annotate platform-specific lines.
- No `pbcopy`, `pbpaste`, `osascript`, `brew`, `gtimeout`, `stat`, `sed -i ''`, `readlink -f`.
- Bare `mktemp`.
- No machine-absolute paths; derive from `$PWD`, `$HOME`, repo root, or `${CLAUDE_PLUGIN_ROOT}`.
- Match Claude project dirs by trailing repo name; verify recorded `cwd`.
- JavaScript manifest keys use `/`, never platform separators.
- Name every non-shell dependency; `jq` is not universal.
