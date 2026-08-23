/* Decision table for the gh-skill-nudge PreToolUse hook.

   Run: npm test

   The nudge-once branch writes a marker keyed by session id into the OS temp dir, which
   outlives this process, so every id here carries the pid: a second `npm test` must not
   inherit the first one's memory and watch every deny turn into an advisory.
*/
import { match, ok, strictEqual } from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const HOOK = join(HERE, 'gh-skill-nudge.mjs');

let sessions = 0;
const sessionId = () => `test-${process.pid}-${(sessions += 1)}`;

/* Every id here carries the pid, `test-<pid>-<n>` from sessionId() or `<name>-<pid>` from a
   shared session, so the sweep matches the pid anywhere rather than either shape. */
after(() => {
  for (const name of readdirSync(tmpdir())) {
    if (name.startsWith('nt-dev-skill-') && name.includes(String(process.pid))) {
      rmSync(join(tmpdir(), name), { force: true });
    }
  }
});

/* Each call gets its own session by default, so the marker starts cold. Pass one explicitly
   to put several calls in the same session. */
function run(tool_input, { env = {}, session } = {}) {
  const result = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({
      cwd: HERE,
      session_id: session ? `${session}-${process.pid}` : sessionId(),
      tool_name: 'Bash',
      tool_input,
    }),
    encoding: 'utf8',
    env: { ...process.env, NT_DEV_SKILL_NUDGE: '', ...env },
  });
  strictEqual(result.status, 0, `hook exited ${result.status}: ${result.stderr}`);
  const out = result.stdout.trim();
  return out ? JSON.parse(out) : null;
}

const bash = (command, opts) => run({ command }, opts);
const write = (file_path, opts) => run({ file_path, content: '# body' }, opts);
const denial = (r) => r?.hookSpecificOutput?.permissionDecision === 'deny'
  && r.hookSpecificOutput.permissionDecisionReason;

describe('what it nudges', () => {
  it('gh pr create, at the skill that holds the PR standard', () => {
    match(denial(bash('gh pr create --draft --base dev --title x --body-file pr-body.md')), /\/nt-dev:pr/);
  });

  it('gh issue create, at the issue skill', () => {
    match(denial(bash('gh issue create --title x')), /\/nt-dev:issue/);
  });

  it('a PR body file being written, before a line of it exists', () => {
    match(denial(write('/tmp/scratch/pr-body.md')), /\/nt-dev:pr/);
  });

  for (const name of ['pr-body.md', 'prbody.md', 'pr.md', 'pr_body.md', 'pr-body-deps.md', 'PR-Body.md']) {
    it(`the name a body actually gets: ${name}`, () => {
      match(denial(write(`/tmp/scratch/${name}`)), /\/nt-dev:pr/);
    });
  }

  it('an issue body file', () => {
    match(denial(write('/tmp/scratch/issue-body.md')), /\/nt-dev:issue/);
  });
});

describe('what it leaves alone', () => {
  it('the skill it just asked for, which is the all-clear', () => {
    strictEqual(run({ skill: 'nt-dev:pr' }), null);
  });

  it('a PR body written after the skill was read, in the same session', () => {
    const session = 'read-the-skill';
    strictEqual(run({ skill: 'nt-dev:pr' }, { session }), null);
    strictEqual(write('/tmp/scratch/pr-body.md', { session }), null);
    strictEqual(bash('gh pr create --title x --body-file /tmp/scratch/pr-body.md', { session }), null);
  });

  it('an issue is still nudged when only the PR skill was read', () => {
    const session = 'read-pr-only';
    strictEqual(run({ skill: 'nt-dev:pr' }, { session }), null);
    match(denial(bash('gh issue create --title x', { session })), /\/nt-dev:issue/);
  });

  it('--web, where GitHub shows the forms and a human fills them', () => {
    strictEqual(bash('gh issue create --web'), null);
  });

  it('the repo\'s own template, which is edited rather than filled', () => {
    strictEqual(write('/repo/.github/pull_request_template.md'), null);
  });

  for (const [name, input] of [
    ['gh pr edit', { command: 'gh pr edit 7 --body-file pr-body.md' }],
    ['gh issue list', { command: 'gh issue list --limit 5' }],
    ['a tool that is not gh', { command: 'some-other-cli pr create --title x' }],
    ['another skill', { skill: 'nt-dev:recall' }],
    ['an unrelated markdown file', { file_path: '/repo/docs/prisma.md' }],
    ['a source file', { file_path: '/repo/src/pr.ts' }],
  ]) {
    it(name, () => strictEqual(run(input), null));
  }

  it('NT_DEV_SKILL_NUDGE=off', () => {
    strictEqual(bash('gh issue create --title x', { env: { NT_DEV_SKILL_NUDGE: 'off' } }), null);
  });
});

describe('how often it speaks', () => {
  it('denies the first time in a session, then advises without blocking', () => {
    const session = 'same-session';
    match(denial(bash('gh issue create --title x', { session })), /\/nt-dev:issue/);

    const second = bash('gh issue create --title y', { session });
    ok(!denial(second), 'second call in the same session must not block');
    match(second.hookSpecificOutput.additionalContext, /\/nt-dev:issue/);
  });

  it('strict denies every time until the skill is read', () => {
    const session = 'strict-session';
    const env = { NT_DEV_SKILL_NUDGE: 'strict' };
    match(denial(bash('gh issue create --title x', { session, env })), /\/nt-dev:issue/);
    match(denial(bash('gh issue create --title y', { session, env })), /\/nt-dev:issue/);

    strictEqual(run({ skill: 'nt-dev:issue' }, { session, env }), null);
    strictEqual(bash('gh issue create --title z', { session, env }), null);
  });

  it('one kind\'s nudge does not spend the other\'s', () => {
    const session = 'two-kinds';
    match(denial(bash('gh pr create --title x', { session })), /\/nt-dev:pr/);
    match(denial(bash('gh issue create --title x', { session })), /\/nt-dev:issue/);
  });
});
