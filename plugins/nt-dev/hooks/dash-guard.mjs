#!/usr/bin/env node
/* Names a unicode dash the moment it is written, while the sentence is still in hand.

   The gate at https://github.com/notambourine/dash-ratchet fails a pull request on any
   unicode dash the diff adds. By the time it reports, the sentence is a commit old and the
   fix costs another push and another CI round. This hook makes the same assertion against
   the text a `Write` or an `Edit` is carrying.

   KEY-DECISION 2026-08-22: compare the counts, do not scan the payload. A file that
   already holds a dash, an `Edit` whose old_string quotes one back, a paragraph moved
   verbatim - a flat scan flags all three over a character it did not introduce, and a hook
   that does that gets switched off. The gate's rule is that the total may not rise, so that
   is the rule here.

   KEY-DECISION 2026-08-22: one script on two events, because the answer differs. Refusing
   the write is a PreToolUse `deny`. Letting it land and still reaching the model is a
   PostToolUse `block`, whose reason the model reads before it moves on - the documented way
   to speak about a call that already happened. PreToolUse `additionalContext` is not that
   way: the docs do not say whether it arrives when the call proceeds, so the default mode
   must not be built on it.

   The character set and the marker are the gate's: U+2010 through U+2015, U+2212, and the
   mdash, ndash, and minus HTML entities, with any line carrying the marker exempt. Excludes
   and a non-default marker are read from the repo's own dash-ratchet workflow, so the hook
   and CI cannot disagree about scope. A repo with no gate still gets the check, because the
   prose rule is ours whatever CI a given repo runs.

   Config, via `env` in a repo's .claude/settings.json or the user's:
     NT_DEV_DASH_GUARD=strict   refuse the write
     NT_DEV_DASH_GUARD=off      do nothing
   Unset is the default: the write lands, and the model gets the lines to rewrite. A dash is
   a sentence to fix, not a tool call to stop.
*/
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { basename, dirname, join, relative, sep } from 'node:path';
import { deny, feedback, pass, rawPayload, repoRoot, resolvePath } from './lib/hook.mjs';

/* Escapes, never the characters: the hook that matches a dash must not be the file that
   adds one. Read only through String.match, which ignores lastIndex on a global pattern
   and so carries no state from one line to the next. */
const DASH = /[\u2010-\u2015\u2212]|&(?:mdash|ndash|minus);/g;

const MODE = (process.env.NT_DEV_DASH_GUARD ?? '').trim().toLowerCase();

if (MODE === 'off') pass();

const payload = rawPayload();
if (!payload) pass();

/* Which half of the call this run is. The event name carries it; a tool_response only
   exists after the fact, so it answers for a harness that sends no name. */
const strict = MODE === 'strict';
const post = payload.hook_event_name
  ? payload.hook_event_name === 'PostToolUse'
  : payload.tool_response !== undefined;
if (strict === post) pass();

const input = payload.tool_input ?? {};
const cwd = payload.cwd && existsSync(payload.cwd) ? payload.cwd : process.cwd();

const target = typeof input.file_path === 'string' && input.file_path
  ? resolvePath(input.file_path, cwd)
  : null;
if (!target) pass();

const whole = typeof input.content === 'string';
const after = whole ? input.content : typeof input.new_string === 'string' ? input.new_string : null;
if (after === null) pass();

const { marker, excluded, root, rel } = gateScope(target, cwd);
if (excluded) pass();

/* Edit carries its own before: old_string is exactly what the hunk replaces. Write carries
   the whole file, so the before is the file - on disk while the write is still pending, and
   the committed blob once it has landed and the disk holds the new text. Untracked, or no
   repo: every dash in it is new. */
const before = !whole ? (input.old_string ?? '')
  : post ? committed(root, rel)
    : onDisk(target);

const sites = dashLines(after, marker);
if (!sites.length) pass();
if (count(after, marker) <= count(before, marker)) pass();

const headline = `${strict ? '🔴' : '🟡'} [dash-guard] Unicode dash in ${basename(target)}`;
const listed = sites.slice(0, 5).map((s) => `  ${whole ? `line ${s.line}: ` : ''}${s.text}`);
if (sites.length > listed.length) listed.push(`  and ${sites.length - listed.length} more`);

const message = `${headline}

${listed.join('\n')}

Rewrite the punctuation in this same turn, before it reaches a commit. The dash gate fails
the pull request on any unicode dash a diff adds, and it only reports once the commit exists.
Type what the sentence wants: a colon to introduce, a comma pair or parens for an aside, a
semicolon or two sentences for two clauses, an ASCII hyphen for a range or a compound. Keep
the character only where it is load-bearing, such as a real minus sign, a quoted source, or a
pattern that matches it, and append \`${marker}\` to that same line. Under \`env\` in
.claude/settings.json, NT_DEV_DASH_GUARD=strict refuses the write instead of naming it, and
=off says nothing at all.`;

if (strict) deny(message);
feedback(message, headline);

/* --- counting -------------------------------------------------------------- */

function count(text, marker) {
  let n = 0;
  for (const line of String(text).split('\n')) {
    if (line.includes(marker)) continue;
    n += (line.match(DASH) ?? []).length;
  }
  return n;
}

function dashLines(text, marker) {
  const out = [];
  String(text).split('\n').forEach((line, i) => {
    if (line.includes(marker) || !line.match(DASH)) return;
    out.push({ line: i + 1, text: line.trim().slice(0, 120) });
  });
  return out;
}

function onDisk(path) {
  try {
    return statSync(path).isFile() ? readFileSync(path, 'utf8') : '';
  } catch {
    return '';
  }
}

/* The file as HEAD holds it. Forward slashes: git takes no other separator, whatever
   node:path returned on the way in. */
function committed(root, rel) {
  if (!root || !rel) return '';
  const run = spawnSync('git', ['show', `HEAD:${rel}`], { cwd: root, encoding: 'utf8', timeout: 5_000 });
  return run.status === 0 ? run.stdout : '';
}

/* --- the gate's own scope -------------------------------------------------- */

/* Read off the workflow that calls the gate rather than restated here: `marker:` and the
   `exclude:` block of .github/workflows/dash-ratchet.yml. */
function gateScope(path, cwd) {
  const root = repoRoot(cwd);
  const yml = root ? join(root, '.github', 'workflows', 'dash-ratchet.yml') : null;
  const text = yml && existsSync(yml) ? readFileSync(yml, 'utf8') : '';
  const marker = value(/^[ \t]*marker:[ \t]*(\S+)[ \t]*$/m.exec(text)?.[1]) || 'dash-ok';
  const inside = root ? relative(real(root), real(path)).split(sep).join('/') : '';
  const rel = inside && !inside.startsWith('../') ? inside : '';
  const excluded = !!rel && excludes(text).some((one) => rel === one || rel.startsWith(`${one}/`));
  return { marker, excluded, root, rel };
}

/* The paths under `exclude:` as the gate reads them: relative to the repo root, one per
   line, ending where the block scalar dedents back to the mapping. */
function excludes(text) {
  const plain = /^[ \t]*exclude:[ \t]*(?![|>])(\S.*?)[ \t]*$/m.exec(text);
  if (plain) return [dir(plain[1])].filter(Boolean);
  const block = /^([ \t]*)exclude:[ \t]*[|>][-+]?[ \t]*\n/m.exec(text);
  if (!block) return [];
  const out = [];
  for (const line of text.slice(block.index + block[0].length).split('\n')) {
    if (!line.trim()) continue;
    if (line.length - line.trimStart().length <= block[1].length) break;
    const one = dir(line);
    if (one) out.push(one);
  }
  return out;
}

function dir(raw) {
  return value(raw).replace(/\/+$/, '');
}

function value(raw) {
  return String(raw ?? '').trim().replace(/^["']|["']$/g, '');
}

/* Both sides through the same resolver before they are compared. A temp directory is a
   symlink on macOS, so `git rev-parse` answers with the real path while the tool call
   carries the link, and the two then share no prefix at all. */
function real(path) {
  try {
    return realpathSync(path);
  } catch {
    /* A Write target that does not exist yet; its parent does. */
  }
  try {
    return join(realpathSync(dirname(path)), basename(path));
  } catch {
    return path;
  }
}
