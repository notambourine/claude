#!/usr/bin/env node
/* Refuses a `git commit` whose content adds a unicode dash.

   The gate at https://github.com/notambourine/dash-ratchet fails a pull request on any
   unicode dash the diff adds. This hook asserts the same rule against the diff about to
   become a commit, so the answer arrives before the push rather than after the CI round.
   The rule itself, and the scope the repo declared for it, are in lib/dashes.mjs.

   KEY-DECISION 2026-08-30: the commit, not the write and not the push. A check at the write
   fires once per tool call and raises the same paragraph through every edit of a draft. A
   check at the push is correct but late: the text is committed by then, so the fix costs an
   amend or a fixup instead of an `Edit`. The commit is the first moment the author has
   declared a passage finished and the last one at which fixing it is still just editing a
   file. It is also the only one of the three that can be shipped with the plugin: a git
   pre-push hook lives in .git/hooks, where nothing a plugin installs can reach.

   The staged diff is the whole domain, so a dash an earlier commit on this branch left
   behind is not named here. That commit was asked about it at the time, and CI is the
   backstop for a branch that got its dash some other way.
*/
import { existsSync } from 'node:fs';
import { advice, gateRules, raised, withDash } from './lib/dashes.mjs';
import { deny, git, pass, rawPayload, repoRoot } from './lib/hook.mjs';

if ((process.env.NT_DEV_DASH_GUARD ?? '').trim().toLowerCase() === 'off') pass();

const payload = rawPayload();
if (!payload) pass();

/* `git` as the program, with its own options before the subcommand, anywhere a shell would
   start a new command. A compound line stages and commits in one call more often than not.
   Anything this misses simply goes unchecked, which is the safe direction for a hook that
   answers by refusing. */
const command = payload.tool_input?.command;
if (typeof command !== 'string' || !/(^|[\s;&|(])git(\s+-[Cc]\s+\S+|\s+-\S+)*\s+commit(\s|$)/.test(command)) pass();

const cwd = payload.cwd && existsSync(payload.cwd) ? payload.cwd : process.cwd();
const root = repoRoot(cwd);
if (!root) pass();

/* What this commit will carry: the index, or every tracked change when `-a` will sweep them
   in on the way. `--amend` needs no special case, because whatever HEAD already holds was
   asked about when it was committed. */
const staged = /(^|\s)(--all|-[A-Za-z]*a[A-Za-z]*)(\s|$)/.test(command) ? 'HEAD' : '--cached';
const diff = git(root, ['-c', 'core.quotePath=false', 'diff', '-U0', '--no-color', staged]);
if (diff.status !== 0) pass();

const { marker, excluded } = gateRules(root);

/* A diff is already a delta, so the count test the write-time hook needs has no place here:
   every `+` line is an addition by construction. `raised` is still the filter, because a
   line moved between files or hunks arrives as a `+` and a `-` and belongs to nobody. */
const sites = [];
for (const file of parse(diff.stdout)) {
  if (excluded(file.rel)) continue;
  for (const s of raised(withDash(file.plus, marker), withDash(file.minus, marker))) {
    sites.push(`  ${file.rel}:${s.line}  ${s.text.slice(0, 120)}`);
  }
}
if (!sites.length) pass();

const listed = sites.slice(0, 8);
if (sites.length > listed.length) listed.push(`  and ${sites.length - listed.length} more`);

deny(`🔴 [dash-guard] Unicode dash in what this commit would carry

${listed.join('\n')}

${advice(marker)}
Then run the commit again. NT_DEV_DASH_GUARD=off under \`env\` in .claude/settings.json
silences this hook.`);

/* --- the diff -------------------------------------------------------------- */

/* Added and removed lines per file, with the numbers the file will have.

   `+++`, `---` and a content line are told apart by position rather than by shape: a
   removed line reading `-- x` arrives as `--- x` and an added one reading `++ x` as
   `+++ x`, so only a header seen before the first `@@` of a file is a header. */
function parse(text) {
  const files = new Map();
  let file = null;
  let hunk = false;
  let at = 1;
  for (const row of String(text).split('\n')) {
    /* The one row that cannot be content, and so the only reliable file boundary: with no
       context lines, a hunk holds nothing that does not begin with `+`, `-` or `\`. */
    if (row.startsWith('diff --git ')) {
      file = null;
      hunk = false;
      continue;
    }
    if (row.startsWith('@@')) {
      hunk = true;
      at = Number(/^@@ -\S+ \+(\d+)/.exec(row)?.[1] ?? 1);
      continue;
    }
    if (!hunk && row.startsWith('+++ ')) {
      const path = unquote(row.slice(4).trim());
      file = path === '/dev/null' ? null : entry(files, path.replace(/^b\//, ''));
      continue;
    }
    if (!hunk || !file) continue;
    if (row.startsWith('+')) {
      file.plus.push({ line: at, text: row.slice(1).trim() });
      at += 1;
    } else if (row.startsWith('-')) {
      file.minus.push({ line: 0, text: row.slice(1).trim() });
    }
  }
  return [...files.values()];
}

function entry(files, rel) {
  if (!files.has(rel)) files.set(rel, { rel, plus: [], minus: [] });
  return files.get(rel);
}

function unquote(raw) {
  return raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1) : raw;
}
