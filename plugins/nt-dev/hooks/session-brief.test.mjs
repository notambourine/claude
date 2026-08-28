/* Decision table for the session-brief SessionStart hook.

   Run: npm test

   The gate is the whole point, so the table is mostly about when nothing is emitted. A
   brief that leaks into a non-repo session costs every turn of it and names six skills
   that have nothing to act on.
*/
import { match, strictEqual } from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const HOOK = join(HERE, 'session-brief.mjs');

/* Bare mktemp, per .claude/rules/portable-shell.md. Outside any repo, which is the
   condition being tested. */
const outside = mkdtempSync(join(tmpdir(), 'nt-dev-brief-'));
after(() => rmSync(outside, { recursive: true, force: true }));

function run({ cwd = HERE, env = {}, raw } = {}) {
  const result = spawnSync(process.execPath, [HOOK], {
    input: raw ?? JSON.stringify({ cwd, session_id: 'test', source: 'startup' }),
    encoding: 'utf8',
    env: { ...process.env, NT_DEV_BRIEF: '', ...env },
  });
  strictEqual(result.status, 0, `hook exited ${result.status}: ${result.stderr}`);
  const out = result.stdout.trim();
  return out ? JSON.parse(out) : null;
}

const briefOf = (r) => r?.hookSpecificOutput?.additionalContext;

describe('session-brief', () => {
  it('names every skill in the set inside a repo', () => {
    const text = briefOf(run());
    match(text, /^nt-dev house standards/);
    for (const name of ['commit', 'pr', 'issue', 'recall', 'cleanup', 'eod-update']) {
      match(text, new RegExp(`/nt-dev:${name}\\b`));
    }
  });

  it('reports the SessionStart event, not the PreToolUse the siblings emit', () => {
    strictEqual(run().hookSpecificOutput.hookEventName, 'SessionStart');
  });

  /* The convention is the reason the descriptions could shrink; losing it here would move
     the standard nowhere. */
  it('carries the commit convention the description no longer states', () => {
    match(briefOf(run()), /`scope: description`/);
    match(briefOf(run()), /not Conventional Commits/);
  });

  it('emits nothing outside a repo', () => {
    strictEqual(run({ cwd: outside }), null);
  });

  it('emits nothing when switched off', () => {
    strictEqual(run({ env: { NT_DEV_BRIEF: 'off' } }), null);
    strictEqual(run({ env: { NT_DEV_BRIEF: 'OFF' } }), null);
  });

  it('falls back to the process cwd when the payload carries no usable one', () => {
    match(briefOf(run({ cwd: '' })), /nt-dev/);
  });

  it('emits nothing on a payload it cannot parse', () => {
    strictEqual(run({ raw: 'not json' }), null);
  });
});
