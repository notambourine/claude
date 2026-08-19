#!/usr/bin/env node
/* Unwraps the markdown a `gh --body-file` command is about to post, in the moment between
   the model writing the file and gh reading it.

   GitHub renders a single newline as <br>, so a PR body wrapped at 80 columns lands as an
   80-column ragged strip inside a box twice that wide. Every model carries the 80-column
   habit in from source, and the instruction in skills/pr/SKILL.md has not held it - which
   is why this hook does not ask. It runs the md-format skill's formatter (--nowrap: one
   physical line per paragraph, bullet, and checkbox) over the file in place.

   KEY-DECISION 2026-08-19: fix the FILE, not the command. PreToolUse has no updatedInput
   field (allow/deny/ask only), so a hook cannot rewrite tool_input - but gh reads the path
   after the hook returns, so rewriting the bytes at that path is the same fix with none of
   the parsing.

   Config, via `env` in a repo's .claude/settings.json or the user's:
     NT_DEV_PR_FORMAT=off      do nothing
     NT_DEV_PR_FORMAT=strict   also deny an inline --body or --fill on `gh pr create`
                               and `gh pr edit`, so a PR body cannot skip /nt-dev:pr
   Unset is the default: unwrap body files, deny only one this hook cannot reach.
*/
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bashPayload, bodyFiles, deny, isGh, pass, say } from './lib/hook.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const MDFMT = join(HERE, '..', 'skills', 'md-format', 'mdfmt.mjs');
const MODE = (process.env.NT_DEV_PR_FORMAT ?? '').trim().toLowerCase();

if (MODE === 'off') pass();

const event = bashPayload();
if (!event) pass();

const { command, cwd } = event;

/* Only gh posts markdown a browser renders; another tool's --body-file is not ours. */
if (!isGh(command)) pass();

/* --- strict mode ---------------------------------------------------------- */

/* A body that never becomes a file never reaches the formatter, and --fill replaces the
   body with commit subjects and drops every template section above. Both are the paths by
   which a PR skips the skill, so strict mode closes them and names the way back. */
if (MODE === 'strict' && /\bgh\s+pr\s+(create|edit)\b/.test(command)) {
  const inline = /(^|\s)(--body|-b)([=\s]|$)/.test(command);
  const fill = /(^|\s)--fill(-verbose)?\b/.test(command);
  if (inline || fill) {
    deny(`🔴 [gh-body-file] NT_DEV_PR_FORMAT=strict: this PR body has to go through /nt-dev:pr.
${fill ? '`--fill` replaces the body with commit subjects and drops every template section.' : '`--body` passes the body as a shell string, so it never reaches the formatter and its newlines render as <br>.'}
Fix: run /nt-dev:pr, or write the filled template to a .md file and rerun with --body-file <path>.`);
  }
}

/* --- the body files ------------------------------------------------------- */

/* The command formatting itself is the same guarantee by another route (skills/pr/SKILL.md
   step 5 does exactly this), so let it through untouched rather than running twice. */
if (/mdfmt|md-format/.test(command)) pass();

const { readable, unreachable } = bodyFiles(command, cwd);

if (unreachable.length) {
  deny(`🔴 [gh-body-file] Cannot unwrap the body file before gh posts it: ${unreachable.join(' ')}
That path is a shell variable, or the file does not exist yet, so the hook cannot read it. GitHub renders every newline as <br>, and a hard-wrapped body lands as a ragged strip.
Fix, either one:
  1. Write the body to a literal path with the Write tool, then rerun this command with that path (the hook formats it).
  2. Run this first, in the same command: node "${MDFMT}" --nowrap <body-file>`);
}

const changed = readable.filter((path) => {
  const before = readFileSync(path, 'utf8');
  return format(path) && readFileSync(path, 'utf8') !== before;
});

if (changed.length) {
  say(`📝 [gh-body-file] unwrapped for GitHub (one line per paragraph): ${changed.map((p) => basename(p)).join(' ')}`);
}
pass();

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
