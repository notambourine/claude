#!/usr/bin/env node
/* Refuses a `Write` or an `Edit` that adds a unicode dash. Opt-in, off by default.

   The rule and its scope are in lib/dashes.mjs. What this hook adds is the earliest
   possible moment to assert it: the sentence is still in hand, and nothing has been written
   yet.

   KEY-DECISION 2026-08-30: opt-in, because dash-commit.mjs is the default layer. A check at
   the write is one block per write, and a document arrives over five or six of them, so the
   same paragraph gets raised again and again while it is still being drafted. The commit
   boundary asks once, about text the author has declared finished. This hook is for a repo
   that would rather never carry a dash for even one tool call, and `NT_DEV_DASH_GUARD` in
   .claude/settings.json `env` is where it says so.

   The baseline is the file on disk for a `Write` and the replaced hunk for an `Edit`, which
   is as far back as a pending write can see. Anything older is the commit gate's to answer:
   a dash the branch already committed is in no write this hook will ever be shown.
*/
import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, relative, sep } from 'node:path';
import { advice, gateRules, lines, raised, total, withDash } from './lib/dashes.mjs';
import { deny, git, pass, rawPayload, repoRoot, resolvePath } from './lib/hook.mjs';

if ((process.env.NT_DEV_DASH_GUARD ?? '').trim().toLowerCase() !== 'strict') pass();

const payload = rawPayload();
if (!payload || payload.hook_event_name === 'PostToolUse') pass();

const input = payload.tool_input ?? {};
const cwd = payload.cwd && existsSync(payload.cwd) ? payload.cwd : process.cwd();

const target = typeof input.file_path === 'string' && input.file_path
  ? resolvePath(input.file_path, cwd)
  : null;
if (!target) pass();

const whole = typeof input.content === 'string';
const after = whole ? input.content : typeof input.new_string === 'string' ? input.new_string : null;
if (after === null) pass();

/* The target file's repo, not the session's: a write reaches outside the repo the session
   started in, and the scope that governs a file is its own repo's. */
const from = nearest(dirname(target));
const root = repoRoot(from);
const rel = root ? inside(from, target) : '';
if (!rel || ignored(root, target)) pass();

const { marker, excluded } = gateRules(root);
if (excluded(rel)) pass();

const now = lines(after);
const was = whole ? lines(onDisk(target)) : lines(input.old_string ?? '');
if (total(now, marker) <= total(was, marker)) pass();

/* Only the lines this write is answerable for. Every dash line in the new text is a flat
   scan, which names lines the write never touched and lets the truncation below push the
   one that raised the count off the end of the list. */
const sites = raised(withDash(now, marker), withDash(was, marker));
if (!sites.length) pass();

const headline = `🔴 [dash-guard] Unicode dash in ${basename(target)}`;
const listed = sites.slice(0, 5).map((s) => `  ${whole ? `line ${s.line}: ` : ''}${s.text.slice(0, 120)}`);
if (sites.length > listed.length) listed.push(`  and ${sites.length - listed.length} more`);

deny(`${headline}

${listed.join('\n')}

${advice(marker)}`);

/* --- where the file sits --------------------------------------------------- */

/* Nothing git will ever diff is nothing the gate can fail: a scratchpad note, a file under
   a temp directory, a build artifact. Ignored-but-tracked is still in the diff, so being
   named in .gitignore is not on its own an answer. */
function ignored(root, path) {
  if (git(root, ['check-ignore', '--quiet', '--', path]).status !== 0) return false;
  return git(root, ['ls-files', '--error-unmatch', '--', path]).status !== 0;
}

/* The path as git spells it, relative to the repo root: `--show-prefix` from the nearest
   directory that exists, plus whatever of the path lies below it.

   KEY-DECISION 2026-08-22: ask git for the prefix, never diff two paths this hook resolved
   separately. A temp directory reaches node under its 8.3 short name and git under the long
   one on Windows, and one side holds the symlink while the other holds its target on macOS.
   The two then share no prefix, and every file in the repo reads as outside it. */
function inside(from, path) {
  const run = git(from, ['rev-parse', '--show-prefix']);
  if (run.status !== 0) return '';
  const under = relative(from, path).split(sep).join('/');
  return under && !under.startsWith('../') ? `${run.stdout.trim()}${under}` : '';
}

/* Somewhere git can stand: a `Write` names a path whose parent may not exist yet. */
function nearest(dir) {
  let at = dir;
  while (!existsSync(at) && dirname(at) !== at) at = dirname(at);
  return at;
}

function onDisk(path) {
  try {
    return statSync(path).isFile() ? readFileSync(path, 'utf8') : '';
  } catch {
    return '';
  }
}
