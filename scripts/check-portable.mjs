#!/usr/bin/env node
/* Fails on shell a teammate on Windows or Linux cannot run.

   A SKILL.md is prose an agent executes verbatim, so a macOS-only invocation in a fenced
   block is a broken skill on every other machine - and nothing else in this repo catches
   it, because CI runs the skills' text through no shell.

   Scope is what this practice writes. plugins/nt-vendor/skills/ is a mirror of someone
   else's repo, so its prose is theirs to fix; see .claude/rules/vendored-skills.md.

   The Bash tool on Windows runs Git Bash, so POSIX syntax and the MSYS coreutils are
   there. What is missing is BSD flag spellings, the Homebrew binaries, and anything
   that only ships with macOS.
*/
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const SCANNED = /^(plugins\/.+\.md|scripts\/.+\.mjs)$/;
const SKIPPED = /^plugins\/nt-vendor\/skills\//;
const SELF = 'scripts/check-portable.mjs';

/* A line that names the platform it belongs to is documentation, not an instruction to run
   blind. That is the fix this check asks for, so it must not also fail it. */
const NAMES_PLATFORM = /\b(macOS|BSD|Homebrew|Windows|Git Bash|Linux|GNU coreutils)\b/;

const RULES = [
  { re: /\b(pbcopy|pbpaste|osascript)\b/, why: 'macOS only; no Windows or Linux equivalent' },
  { re: /\bstat\s+-f\b|\/usr\/bin\/stat\b/, why: 'BSD stat flags; GNU stat (Git Bash, Linux) spells it -c' },
  { re: /\bgtimeout\b/, why: 'Homebrew coreutils name; Git Bash ships no timeout at all' },
  { re: /\bmktemp\s+-t\s+(?!\S*XXXXXX)\S/, why: 'GNU mktemp -t needs a template holding XXXXXX; bare `mktemp` works everywhere' },
  { re: /\bsed\s+-i\s+''/, why: "BSD sed in-place form; GNU sed reads '' as the next script" },
  { re: /\breadlink\s+-f\b/, why: 'BSD readlink has no -f; use `cd ... && pwd -P` or node' },
  { re: /\bbrew\s+(install|--prefix)\b/, why: 'Homebrew is macOS and Linux only' },
  { re: /\/Users\/[a-z]/i, why: 'absolute path from one machine' },
  { re: /\bC:\\\\?[Uu]sers\\/, why: 'absolute path from one machine' },
];

const files = spawnSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
  .stdout.split('\n')
  .filter((p) => SCANNED.test(p) && !SKIPPED.test(p) && p !== SELF);

let hits = 0;
for (const path of files) {
  const lines = (await readFile(join(root, path), 'utf8')).split('\n');
  lines.forEach((line, i) => {
    if (NAMES_PLATFORM.test(line)) return;
    for (const rule of RULES) {
      if (!rule.re.test(line)) continue;
      hits += 1;
      console.log(`${path}:${i + 1}: ${rule.why}`);
      console.log(`  ${line.trim()}`);
    }
  });
}

console.log(`\nscanned ${files.length} first-party file(s): ${hits || 'no'} portability hit(s)`);
if (hits) {
  console.log('Name the platform in prose, or write the form that runs on all three.');
  process.exitCode = 1;
}
