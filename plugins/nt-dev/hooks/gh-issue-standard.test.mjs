/* Decision table for the gh-issue-standard PreToolUse hook.

   Run: npm test

   Two things here need a real directory rather than a stub. The repo-forms branch turns on
   whether `.github/ISSUE_TEMPLATE/` exists next to the command's cwd, and the nudge-once
   branch writes a marker keyed by session id. Both get a throwaway git repo per case, so
   nothing reads the tree this suite runs in.
*/
import { match, ok, strictEqual } from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const HOOK = join(HERE, 'gh-issue-standard.mjs');

/* Everything the standard asks for that a hook can see, so a case can drop one at a time. */
const COMPLETE = 'gh issue create --title "Serve every sitemap from the app" --milestone M1 --label bug --body "**Goal:** one sentence. **Done when:** it renders."';

const dirs = [];
const markers = new Set();
let sessions = 0;

/* The hook remembers a nudged session by writing a marker into the OS temp dir, which
   outlives this process. Ids carry the pid so a second `npm test` does not inherit the
   first one's memory and watch every deny turn into an advisory. */
const sessionId = () => `test-${process.pid}-${(sessions += 1)}`;

after(() => {
  dirs.forEach((d) => rmSync(d, { recursive: true, force: true }));
  markers.forEach((m) => rmSync(join(tmpdir(), `nt-dev-issue-nudge-${m}`), { force: true }));
});

/* A git repo, because the hook asks git for the root before looking for issue forms. */
function repo({ forms = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'nt-dev-issue-'));
  dirs.push(dir);
  spawnSync('git', ['init', '-q'], { cwd: dir });
  if (forms) {
    mkdirSync(join(dir, '.github', 'ISSUE_TEMPLATE'), { recursive: true });
    writeFileSync(join(dir, '.github', 'ISSUE_TEMPLATE', 'bug.yml'), 'name: Bug\n');
  }
  return dir;
}

/* Each call gets its own session id by default, so the nudge-once marker starts cold.
   Pass one explicitly to put two calls in the same session. */
function run(command, { env = {}, cwd = repo(), session } = {}) {
  const id = session ? `${session}-${process.pid}` : sessionId();
  markers.add(id);
  const result = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({ cwd, session_id: id, tool_name: 'Bash', tool_input: { command } }),
    encoding: 'utf8',
    env: { ...process.env, NT_DEV_ISSUE_STANDARD: '', ...env },
  });
  strictEqual(result.status, 0, `hook exited ${result.status}: ${result.stderr}`);
  const out = result.stdout.trim();
  return out ? JSON.parse(out) : null;
}

const denial = (r) => r?.hookSpecificOutput?.permissionDecision === 'deny'
  && r.hookSpecificOutput.permissionDecisionReason;

describe('gaps it names', () => {
  it('a missing milestone', () => {
    match(denial(run(COMPLETE.replace('--milestone M1 ', ''))), /No `--milestone`/);
  });

  it('a missing label', () => {
    match(denial(run(COMPLETE.replace('--label bug ', ''))), /No `--label`/);
  });

  it('a body with none of the standard\'s section leads', () => {
    const r = denial(run('gh issue create --title x --milestone M1 --label bug --body "the tests are flaky"'));
    match(r, /none of the standard's section leads/);
  });

  it('the repo\'s own issue forms, which outrank the skill\'s body shapes', () => {
    const r = denial(run(COMPLETE, { cwd: repo({ forms: true }) }));
    match(r, /ISSUE_TEMPLATE/);
  });

  it('several at once, and points at the skill', () => {
    const r = denial(run('gh issue create --title "flaky test"'));
    match(r, /No `--milestone`/);
    match(r, /No `--label`/);
    match(r, /\/nt-dev:issue/);
  });

  it('reads the body out of a --body-file too', () => {
    const dir = repo();
    writeFileSync(join(dir, 'body.md'), 'just a sentence\n');
    match(denial(run('gh issue create --title x --milestone M1 --label bug --body-file body.md', { cwd: dir })), /section leads/);
  });
});

describe('commands it lets by', () => {
  it('one that already meets the standard', () => {
    strictEqual(run(COMPLETE), null);
  });

  it('a body under repo forms it was told to follow', () => {
    strictEqual(run(`${COMPLETE} --template bug.yml`, { cwd: repo({ forms: true }) }), null);
  });

  it('an engineering body, which leads with headings rather than bold leads', () => {
    strictEqual(run('gh issue create --title x -m M1 -l chore --body "## Today\n\nmeasured 2026-08-04"'), null);
  });

  it('--web, where GitHub shows the forms and a human fills them', () => {
    strictEqual(run('gh issue create --web'), null);
  });

  for (const [name, command] of [
    ['gh issue edit', 'gh issue edit 7 --add-label bug'],
    ['gh issue list', 'gh issue list --limit 5'],
    ['gh pr create', 'gh pr create --draft --title x --body-file body.md'],
    ['a tool that is not gh', 'some-other-cli issue create --title x'],
  ]) {
    it(name, () => strictEqual(run(command), null));
  }

  it('short flags count: -m and -l are --milestone and --label', () => {
    strictEqual(run('gh issue create --title x -m M1 -l bug --body "**Goal:** ship it. **Done when:** shipped."'), null);
  });
});

describe('how often it speaks', () => {
  it('denies the first time in a session, then advises without blocking', () => {
    const session = 'same-session-abc';
    const first = run('gh issue create --title x', { session });
    match(denial(first), /No `--milestone`/);

    const second = run('gh issue create --title y', { session });
    ok(!denial(second), 'second call in the same session must not block');
    match(second.hookSpecificOutput.additionalContext, /No `--milestone`/);
    match(second.systemMessage, /nudged once already/);
  });

  it('leaves the permission flow alone once it stops denying', () => {
    const session = 'same-session-def';
    run('gh issue create --title x', { session });
    const second = run('gh issue create --title y', { session });
    /* Never "allow": that would short-circuit the user's own permission rules for a
       command this hook only wanted to comment on. */
    strictEqual(second.hookSpecificOutput.permissionDecision, undefined);
  });

  it('denies every time under strict', () => {
    const session = 'same-session-ghi';
    const env = { NT_DEV_ISSUE_STANDARD: 'strict' };
    match(denial(run('gh issue create --title x', { env, session })), /No `--milestone`/);
    match(denial(run('gh issue create --title y', { env, session })), /No `--milestone`/);
  });

  it('says nothing at all when switched off', () => {
    strictEqual(run('gh issue create --title x', { env: { NT_DEV_ISSUE_STANDARD: 'off' } }), null);
  });
});

describe('a payload it cannot use', () => {
  for (const [name, input] of [['not JSON', 'nope'], ['no command', '{"tool_input":{}}'], ['empty', '']]) {
    it(`passes on a payload that is ${name}`, () => {
      const r = spawnSync(process.execPath, [HOOK], { input, encoding: 'utf8' });
      strictEqual(r.status, 0);
      strictEqual(r.stdout.trim(), '');
    });
  }
});
