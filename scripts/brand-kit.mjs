#!/usr/bin/env node
/* Mirrors the @notambourine/brand-kit package into plugins/nt-brand/skills/system/.

   The dependency cannot be read where it lives. Claude Code finds a skill by walking
   plugins/<plugin>/skills/<name>/SKILL.md in the checked-out tree, and a plugin install
   runs no npm, so node_modules is absent on every machine that installs nt-brand. The
   bytes have to be committed at that literal path or the skill reads empty.

   So the committed tree is a mirror, and the pinned package is the truth it answers to.
   No digest manifest: package-lock.json already pins the tarball by integrity hash, and
   a second copy of those digests would be one more thing to drift.

   Modes:
     sync    write node_modules/@notambourine/brand-kit/ over the skill directory
     verify  byte-compare the two, and check the pin is exact. Runs in CI as `npm run brand`.
*/
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PKG = '@notambourine/brand-kit';
const src = join(root, 'node_modules', ...PKG.split('/'));
const dest = join(root, 'plugins/nt-brand/skills/system');

/* npm packaging metadata, not brand content. Nothing downstream of the skill reads it,
   and leaving it in would put a `type: module` beside prose an agent copies. */
const EXCLUDE = new Set(['package.json']);

const digest = (buf) => `sha256-${createHash('sha256').update(buf).digest('base64')}`;

/* Keyed by forward slash whatever node:path reports: a Windows backslash key reads as
   one file added and one removed, which is the whole failure this gate exists to catch. */
async function readTree(dir) {
  const out = new Map();
  const walk = async (current) => {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }
      const key = relative(dir, full).split(sep).join('/');
      if (EXCLUDE.has(key)) continue;
      out.set(key, await readFile(full));
    }
  };
  await walk(dir);
  return out;
}

function diffTrees(published, mirrored) {
  const added = [...published.keys()].filter((p) => !mirrored.has(p));
  const removed = [...mirrored.keys()].filter((p) => !published.has(p));
  const changed = [...published.keys()].filter(
    (p) => mirrored.has(p) && digest(published.get(p)) !== digest(mirrored.get(p)),
  );
  return { added, removed, changed, count: added.length + removed.length + changed.length };
}

/* A caret or tilde moves the brand under this repo with no diff to review, and the
   mirror would still verify clean against whatever npm happened to resolve. */
async function pin() {
  const { dependencies = {} } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const spec = dependencies[PKG];
  if (!spec) throw new Error(`${PKG} is not a dependency: run npm install --save-exact`);
  if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(spec)) {
    throw new Error(`${PKG} is pinned as "${spec}"; it must be one exact version`);
  }
  const installed = JSON.parse(await readFile(join(src, 'package.json'), 'utf8')).version;
  if (installed !== spec) {
    throw new Error(`package.json pins ${spec} but node_modules holds ${installed}: run npm ci`);
  }
  return spec;
}

async function published() {
  const tree = await readTree(src);
  if (!tree.size) throw new Error(`${PKG} is not installed: run npm ci`);
  if (!tree.has('SKILL.md')) throw new Error(`${PKG} ships no SKILL.md; nt-brand has no skill`);
  return tree;
}

async function sync() {
  const version = await pin();
  const tree = await published();
  const before = await readTree(dest);

  await rm(dest, { recursive: true, force: true });
  for (const [path, body] of tree) {
    const file = join(dest, path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, body);
  }

  const diff = diffTrees(tree, before);
  if (!diff.count) {
    console.log(`= ${PKG}@${version}  mirror already current (${tree.size} files)`);
    return;
  }
  console.log(`> ${PKG}@${version}  synced ${tree.size} files`);
  for (const path of diff.changed) console.log(`    changed ${path}`);
  for (const path of diff.added) console.log(`    added   ${path}`);
  for (const path of diff.removed) console.log(`    removed ${path}`);
}

async function verify() {
  const version = await pin();
  const diff = diffTrees(await published(), await readTree(dest));
  if (!diff.count) {
    console.log(`= ${PKG}@${version}  mirror matches the published package`);
    return;
  }
  console.log(`! ${PKG}@${version}  mirror drifted from the published package`);
  for (const path of diff.changed) console.log(`    changed  ${path}`);
  for (const path of diff.added) console.log(`    missing  ${path}`);
  for (const path of diff.removed) console.log(`    stray    ${path}`);
  console.log('\nRun `npm run brand:sync` and commit the result.');
  process.exitCode = 1;
}

const MODES = { sync, verify };
const mode = process.argv[2];
if (!MODES[mode]) {
  console.error(`usage: brand-kit <${Object.keys(MODES).join('|')}>`);
  process.exit(2);
}
await MODES[mode]();
