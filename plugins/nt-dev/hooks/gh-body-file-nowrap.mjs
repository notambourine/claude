#!/usr/bin/env node
/* Unwraps the markdown a `gh --body-file` command is about to post, in the moment
   between the model writing the file and gh reading it.

   GitHub renders a single newline as <br>, so a PR body wrapped at 80 columns lands as an
   80-column ragged strip inside a box twice that wide. Every model carries the 80-column
   habit in from source, and the instruction in skills/pr/SKILL.md has not held it - which
   is why this hook does not ask. It runs the md-format skill's formatter (--nowrap: one
   physical line per paragraph, bullet, and checkbox) over the file in place.

   KEY-DECISION 2026-08-19: fix the FILE, not the command. PreToolUse has no updatedInput
   field (allow/deny/ask only), so a hook cannot rewrite tool_input - but gh reads the path
   after the hook returns, so rewriting the bytes at that path is the same fix with none of
   the parsing.

   Node, not bash: this plugin ships to Windows and Linux, where `jq` is absent and the
   coreutils `timeout` the stdin read wants is spelled differently or missing. See
   .claude/rules/portable-shell.md.

   Config, via `env` in a repo's .claude/settings.json or the user's:
     NT_DEV_PR_FORMAT=off      do nothing
     NT_DEV_PR_FORMAT=strict   also deny an inline --body or --fill on `gh pr create`
                               and `gh pr edit`, so a PR body cannot skip /nt-dev:pr
   Unset is the default: unwrap body files, deny only one this hook cannot reach.
*/
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MDFMT = join(HERE, '..', 'skills', 'md-format', 'mdfmt.mjs');
const MODE = (process.env.NT_DEV_PR_FORMAT ?? '').trim().toLowerCase();

/* Every exit is a clean one. A hook that throws on an unreadable payload blocks a Bash
   call it never understood, so nothing below rejects except through deny(). */
function pass() {
  process.exit(0);
}

function say(message) {
  console.log(JSON.stringify({ systemMessage: message }));
  process.exit(0);
}

function deny(reason) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }));
  process.exit(0);
}

/* --- the payload ---------------------------------------------------------- */

/* fd 0, not '/dev/stdin': the device node does not exist on Windows. A non-blocking pipe
   answers EAGAIN before the writer has filled it, which is not end-of-input, so that one
   errno retries and every other error gives up. */
function readStdin() {
  if (process.stdin.isTTY) return '';
  for (let attempt = 0; attempt < 200; attempt += 1) {
    try {
      return readFileSync(0, 'utf8');
    } catch (err) {
      if (err.code !== 'EAGAIN') return '';
      sleep(10);
    }
  }
  return '';
}

/* Blocks the thread for `ms`. There is no synchronous sleep in node, and the read above
   has to stay synchronous: an async one would let the script fall off the end and exit
   before the payload arrived. */
function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

if (MODE === 'off') pass();

let payload;
try {
  payload = JSON.parse(readStdin());
} catch {
  pass();
}

const cmd = payload?.tool_input?.command;
if (typeof cmd !== 'string' || !cmd) pass();

/* Only gh posts markdown a browser renders; another tool's --body-file is not ours. */
if (!/(^|[\s;&|(])gh\s/.test(cmd)) pass();

const cwd = payload.cwd && existsSync(payload.cwd) ? payload.cwd : process.cwd();

/* --- strict mode ---------------------------------------------------------- */

/* A body that never becomes a file never reaches the formatter, and --fill replaces the
   body with commit subjects and drops every template section above. Both are the paths by
   which a PR skips the skill, so strict mode closes them and names the way back. */
if (MODE === 'strict' && /\bgh\s+pr\s+(create|edit)\b/.test(cmd)) {
  const inline = /(^|\s)(--body|-b)([=\s]|$)/.test(cmd);
  const fill = /(^|\s)--fill(-verbose)?\b/.test(cmd);
  if (inline || fill) {
    deny(`🔴 [gh-body-file] NT_DEV_PR_FORMAT=strict: this PR body has to go through /nt-dev:pr.
${fill ? '`--fill` replaces the body with commit subjects and drops every template section.' : '`--body` passes the body as a shell string, so it never reaches the formatter and its newlines render as <br>.'}
Fix: run /nt-dev:pr, or write the filled template to a .md file and rerun with --body-file <path>.`);
  }
}

/* --- the body files ------------------------------------------------------- */

/* The command formatting itself is the same guarantee by another route (skills/pr/SKILL.md
   step 5 does exactly this), so let it through untouched rather than running twice. */
const selfFormats = /mdfmt|md-format/.test(cmd);

const FLAG = /--(body|notes)-file[=\s]+("[^"]*"|'[^']*'|[^\s]+)/g;
const unreachable = [];
const changed = [];

for (const match of cmd.matchAll(FLAG)) {
  let path = match[2].replace(/^["']|["']$/g, '');
  if (!path || path === '-') continue;
  /* A path the shell resolves, or a heredoc the same command is about to write, has no
     bytes for this hook to read. Those are the one shape it cannot reach. */
  if (/[$`]/.test(path)) {
    unreachable.push(path);
    continue;
  }
  if (path.startsWith('~/')) path = join(process.env.HOME ?? process.env.USERPROFILE ?? '', path.slice(2));
  if (!isAbsolute(path)) path = resolve(cwd, path);
  path = fromGitBash(path);
  if (!existsSync(path) || !statSync(path).isFile()) {
    unreachable.push(path);
    continue;
  }
  if (selfFormats) continue;
  const before = readFileSync(path, 'utf8');
  if (format(path) && readFileSync(path, 'utf8') !== before) changed.push(path.split(/[/\\]/).pop());
}

if (unreachable.length && !selfFormats) {
  deny(`🔴 [gh-body-file] Cannot unwrap the body file before gh posts it: ${unreachable.join(' ')}
That path is a shell variable, or the file does not exist yet, so the hook cannot read it. GitHub renders every newline as <br>, and a hard-wrapped body lands as a ragged strip.
Fix, either one:
  1. Write the body to a literal path with the Write tool, then rerun this command with that path (the hook formats it).
  2. Run this first, in the same command: node "${MDFMT}" --nowrap <body-file>`);
}

if (changed.length) say(`📝 [gh-body-file] unwrapped for GitHub (one line per paragraph): ${changed.join(' ')}`);
pass();

/* --- paths ---------------------------------------------------------------- */

/* Windows only. The Bash tool runs Git Bash there, so `$(mktemp -d)/pr-body.md` in the
   command this hook is reading comes back as an MSYS path - `/tmp/x/pr-body.md`. node on
   win32 reads a leading slash as the current drive root and looks in `C:\tmp`, where the
   file is not, and the hook would deny a body file that exists. cygpath ships with Git
   Bash and is the only thing that knows where that root is mounted. */
function fromGitBash(path) {
  if (process.platform !== 'win32' || !path.startsWith('/') || existsSync(path)) return path;
  const run = spawnSync('cygpath', ['-w', path], { encoding: 'utf8', timeout: 5_000 });
  const win = run.status === 0 && run.stdout.trim();
  return win || path;
}

/* --- the formatter -------------------------------------------------------- */

/* Rewrites `path` in place, unwrapped. Returns false on any failure, because a formatter
   that cannot run (offline, no dprint cache) must not cost the user their gh call.
   dprint only picks up a .md name, so a body file named anything else rides through a temp
   copy and is written back into the original. */
function format(path) {
  if (!existsSync(MDFMT)) return false;
  const isMd = /\.(md|markdown)$/i.test(path);
  const tmp = isMd ? null : mkdtempSync(join(tmpdir(), 'nt-dev-'));
  const work = isMd ? path : join(tmp, 'pr-body.md');
  try {
    if (tmp) copyFileSync(path, work);
    const run = spawnSync(process.execPath, [MDFMT, '--nowrap', work], {
      cwd,
      encoding: 'utf8',
      timeout: 45_000,
    });
    if (run.status !== 0) return false;
    /* writeFileSync truncates in place, so the original file keeps its inode and its mode,
       whoever made it. */
    if (tmp) writeFileSync(path, readFileSync(work, 'utf8'));
    return true;
  } catch {
    return false;
  } finally {
    if (tmp) rmSync(tmp, { recursive: true, force: true });
  }
}
