/* Decision table for the dash-commit hook, which refuses a `git commit` over its content.

   Run: npm test

   Every dash here is written as an escape, so this file adds none of the characters it
   asserts on and the repo's own count stays where it is.
*/
import { match, ok, strictEqual } from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const HOOK = join(HERE, 'dash-commit.mjs');

const EM = '\u2014';

const temps = [];
after(() => temps.forEach((path) => rmSync(path, { force: true, recursive: true })));

function run(command, { cwd, env = {} } = {}) {
  const payload = {
    cwd,
    session_id: 'dash-commit-test',
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    tool_input: { command },
  };
  const result = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    env: { ...process.env, NT_DEV_DASH_GUARD: '', ...env },
  });
  strictEqual(result.status, 0, `hook exited ${result.status}: ${result.stderr}`);
  const out = result.stdout.trim();
  return out ? JSON.parse(out) : null;
}

const flagged = (r) => r?.hookSpecificOutput?.permissionDecision === 'deny'
  && r.hookSpecificOutput.permissionDecisionReason;

const git = (root, ...args) => spawnSync(
  'git',
  ['-c', 'commit.gpgsign=false', '-c', 'user.email=test@example.com', '-c', 'user.name=test', ...args],
  { cwd: root, encoding: 'utf8' },
);

/* A repo with one commit behind it, which is what a commit hook always has. */
function repo({ workflow, committed = 'plain\n' } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'nt-commit-')));
  temps.push(root);
  git(root, 'init', '--quiet');
  if (workflow) {
    mkdirSync(join(root, '.github', 'workflows'), { recursive: true });
    writeFileSync(join(root, '.github', 'workflows', 'dash-ratchet.yml'), workflow);
  }
  write(root, 'notes.md', committed);
  git(root, 'add', '--all');
  git(root, 'commit', '--quiet', '-m', 'seed');
  return root;
}

function write(root, rel, text) {
  const path = join(root, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
  return path;
}

function stage(root, rel, text) {
  write(root, rel, text);
  git(root, 'add', '--', rel);
}

const WORKFLOW = `jobs:
  dashes:
    uses: notambourine/dash-ratchet/.github/workflows/ratchet.yml@abc # v1
    with:
      marker: keep-dash
      exclude: |
        test/fixtures
`;

describe('what it refuses', () => {
  it('a staged line that adds a dash', () => {
    const root = repo();
    stage(root, 'notes.md', `plain\nThe gate is the diff${EM}not the file.\n`);
    match(flagged(run('git commit -m "notes"', { cwd: root })), /dash-guard/);
  });

  it('naming the file, the line it will have, and the text', () => {
    const root = repo();
    stage(root, 'docs/readme.md', `intro\nThe gate is the diff${EM}not the file.\n`);
    match(flagged(run('git commit -m x', { cwd: root })), /docs\/readme\.md:2 {2}The gate is the diff/);
  });

  it('a tracked change `-a` will sweep in, staged or not', () => {
    const root = repo();
    write(root, 'notes.md', `plain\nOne${EM}here.\n`);
    strictEqual(run('git commit -m x', { cwd: root }), null);
    ok(flagged(run('git commit -am x', { cwd: root })));
  });

  it('a commit at the end of a compound command', () => {
    const root = repo();
    stage(root, 'notes.md', `plain\nOne${EM}here.\n`);
    ok(flagged(run('git add -A && git commit -m x', { cwd: root })));
  });

  it('a commit reached through git\'s own options', () => {
    const root = repo();
    stage(root, 'notes.md', `plain\nOne${EM}here.\n`);
    ok(flagged(run(`git -C ${root} commit -m x`, { cwd: root })));
  });

  it('listing eight sites and counting the rest', () => {
    const root = repo();
    stage(root, 'notes.md', `plain\n${Array.from({ length: 10 }, (_, i) => `line ${i}${EM}here`).join('\n')}\n`);
    match(flagged(run('git commit -m x', { cwd: root })), /and 2 more/);
  });
});

describe('what it lets through', () => {
  it('an index with nothing in it', () => {
    strictEqual(run('git commit -m x', { cwd: repo() }), null);
  });

  it('a staged line with ASCII punctuation', () => {
    const root = repo();
    stage(root, 'notes.md', 'plain\nThe gate is the diff, not the file. Runs 2020-2024.\n');
    strictEqual(run('git commit -m x', { cwd: root }), null);
  });

  it('a staged line carrying the marker', () => {
    const root = repo();
    stage(root, 'notes.md', `plain\nconst DASH = '${EM}'; // dash-ok\n`);
    strictEqual(run('git commit -m x', { cwd: root }), null);
  });

  it('a line the commit only moves', () => {
    const root = repo({ committed: `first\nOne${EM}here.\nlast\n` });
    stage(root, 'notes.md', `One${EM}here.\nfirst\nlast\n`);
    strictEqual(run('git commit -m x', { cwd: root }), null);
  });

  it('a path the repo\'s own gate excludes', () => {
    const root = repo({ workflow: WORKFLOW });
    stage(root, 'test/fixtures/wire.md', `a${EM}b\n`);
    strictEqual(run('git commit -m x', { cwd: root }), null);
  });

  it('the marker the repo declared, in place of the default', () => {
    const root = repo({ workflow: WORKFLOW });
    stage(root, 'docs/x.md', `a${EM}b # keep-dash\n`);
    strictEqual(run('git commit -m x', { cwd: root }), null);
    stage(root, 'docs/x.md', `a${EM}b # dash-ok\n`);
    ok(flagged(run('git commit -m x', { cwd: root })));
  });

  it('an unstaged change, which a plain commit does not carry', () => {
    const root = repo();
    write(root, 'notes.md', `plain\nOne${EM}here.\n`);
    strictEqual(run('git commit -m x', { cwd: root }), null);
  });

  for (const command of ['git status', 'git log --oneline', 'gh pr create --title "commit"']) {
    it(`\`${command}\`, which commits nothing`, () => {
      const root = repo();
      stage(root, 'notes.md', `plain\nOne${EM}here.\n`);
      strictEqual(run(command, { cwd: root }), null);
    });
  }

  it('a commit outside any repo', () => {
    const path = realpathSync(mkdtempSync(join(tmpdir(), 'nt-commit-')));
    temps.push(path);
    strictEqual(run('git commit -m x', { cwd: path }), null);
  });

  it('NT_DEV_DASH_GUARD=off', () => {
    const root = repo();
    stage(root, 'notes.md', `plain\nOne${EM}here.\n`);
    strictEqual(run('git commit -m x', { cwd: root, env: { NT_DEV_DASH_GUARD: 'off' } }), null);
  });
});
