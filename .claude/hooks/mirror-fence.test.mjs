/* Decision table for the mirror-fence PreToolUse hook.

   Run: npm test
*/
import { match, strictEqual } from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const HOOK = join(HERE, 'mirror-fence.mjs');
const ROOT = resolve(HERE, '..', '..');

function run(tool_name, tool_input, env = {}) {
  const result = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({ cwd: ROOT, tool_name, tool_input }),
    encoding: 'utf8',
    env: { ...process.env, NT_MIRROR_FENCE: '', ...env },
  });
  strictEqual(result.status, 0, `hook exited ${result.status}: ${result.stderr}`);
  const out = result.stdout.trim();
  return out ? JSON.parse(out) : null;
}

const edit = (file_path) => run('Edit', { file_path });
const denial = (r) => r?.hookSpecificOutput?.permissionDecision === 'deny'
  && r.hookSpecificOutput.permissionDecisionReason;

describe('mirrors it refuses', () => {
  for (const path of [
    'vendor/pristine/anti-slop/SKILL.md',
    'vendor/pristine/audit-codebase/references/tells.md',
    'vendor/NOTICE.md',
    'plugins/nt-brand/skills/system/SKILL.md',
    'plugins/nt-brand/skills/system/assets/tokens.css',
  ]) {
    it(path, () => match(String(denial(edit(path))), /mirror-fence/));
  }

  it('an absolute path into a mirror', () => {
    match(String(denial(edit(join(ROOT, 'vendor/pristine/eli5/SKILL.md')))), /merge base/);
  });

  it('a path that walks back into a mirror', () => {
    match(String(denial(edit('plugins/../vendor/NOTICE.md'))), /generated/);
  });

  it('Write, not just Edit', () => {
    match(String(denial(run('Write', { file_path: 'vendor/NOTICE.md' }))), /mirror-fence/);
  });

  it('names the command that owns the bytes', () => {
    match(String(denial(edit('plugins/nt-brand/skills/system/SKILL.md'))), /npm run brand:sync/);
    match(String(denial(edit('vendor/pristine/eli5/SKILL.md'))), /vendor-skills\.mjs pull/);
  });
});

describe('edits it allows', () => {
  for (const path of [
    'plugins/nt-vendor/skills/anti-slop/SKILL.md', // the live copy, which is meant to drift
    'plugins/nt-voice/skills/human-voice/SKILL.md',
    'vendor/manifest.json', // adding a source is a hand-edit by design
    'vendor/README.md',
    'plugins/nt-brand/skills/audit/SKILL.md', // a sibling of the mirror, not in it
    'plugins/nt-brand/README.md',
    '.claude/rules/vendored-skills.md',
    'scripts/vendor-skills.mjs',
  ]) {
    it(path, () => strictEqual(edit(path), null));
  }

  it('a same-named path outside this repo', () => {
    strictEqual(edit(join(ROOT, '..', 'elsewhere', 'vendor', 'NOTICE.md')), null);
  });

  it('a Bash write, which the sanctioned scripts use', () => {
    strictEqual(run('Bash', { command: 'npm run brand:sync' }), null);
  });

  it('the off switch', () => {
    strictEqual(run('Edit', { file_path: 'vendor/NOTICE.md' }, { NT_MIRROR_FENCE: 'off' }), null);
  });
});
