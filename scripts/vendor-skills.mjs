#!/usr/bin/env node
/* Vendors third-party skill directories into plugins/nt-vendor/skills/. That plugin
   ships from this marketplace, so unlike our own plugins its content is a mirror of
   someone else's repo and the nt-vendor name is what tells a reader so.

   Whole trees, not lone SKILL.md files: every one of these skills points at siblings
   (references/tells.md, DEEPENING.md, HTML-REPORT.md), and vendoring the entry point
   alone ships dead links.

   A skill is prose an agent later executes, so upstream is untrusted input. This script
   only writes fetched bytes to disk. It never sources, evals, or runs them, and it never
   opens a PR: every prose diff reaches main through human review.

   Modes:
     check      network. Upstream moved? Exit 1 on drift. Runs weekly in CI.
     verify     offline. Manifest digests still match vendor/pristine/? Runs in CI.
     pull       network. Per-file three-way merge into the live tree, keeping local edits.
     refs       offline. Which first-party files name each vendored skill.
     attribute  offline. Regenerate vendor/NOTICE.md from the manifest.

   check, verify, and pull take skill names to work on a subset. Vendoring one skill
   while four others have drifted upstream otherwise means one PR carrying five prose
   diffs, and the audit that reads each one is the thing that would get skipped.

   check and pull print the refs index for every skill they report as moved, so the
   update PR names its own audit surface instead of leaving it to be discovered.
*/
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = join(root, 'vendor/skills.json');
const NOTICE = join(root, 'vendor/NOTICE.md');
const VENDOR_PLUGIN = 'nt-vendor';
const pristineDir = (name) => join(root, 'vendor/pristine', name);
const liveDir = (name) => join(root, 'plugins', VENDOR_PLUGIN, 'skills', name);
const licensePath = (repo) => join(root, 'vendor/licenses', `${repo.replace('/', '-')}.txt`);

/* A gist is a repo with a different API and no tree, path, or license file. These three
   keep the mode functions from branching on `s.gist` more than once each. */
const sourceLabel = (s) => s.repo ?? `${s.owner}/${s.gist.slice(0, 7)}`;
const sourceUrl = (s) =>
  s.gist ? `https://gist.github.com/${s.owner}/${s.gist}` : `https://github.com/${s.repo}`;
const historyUrl = (s, sha) =>
  s.gist ? `${sourceUrl(s)}/revisions` : `${sourceUrl(s)}/compare/${s.sha}...${sha}`;

const digestOf = (text) => `sha256-${createHash('sha256').update(text).digest('base64')}`;

/* Marks only the entry point. vendor/pristine/ never carries it, so the merge base
   stays byte-identical to upstream: pull strips it, merges, re-adds it. */
const ENTRY = 'SKILL.md';
const MARKER = /^<!-- vendored:[^\n]*-->\n/m;
const stripMarker = (text) => text.replace(MARKER, '');
const markerFor = (s, sha) =>
  `<!-- vendored: ${sourceLabel(s)}@${sha.slice(0, 7)} ${s.path || s.entry || '.'} (${s.license}). ` +
  'Edit freely: `node scripts/vendor-skills.mjs pull` merges upstream around local changes. -->\n';

function withMarker(text, s, sha) {
  const frontmatter = text.match(/^---\n[\s\S]*?\n---\n/);
  const at = frontmatter ? frontmatter[0].length : 0;
  return text.slice(0, at) + markerFor(s, sha) + text.slice(at);
}

/* Minimal glob: `**` spans separators, `*` stops at one. Enough for the exclude
   lists in vendor/skills.json, and a full matcher would be a dependency. */
const globToRe = (glob) =>
  new RegExp(
    `^${glob
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, '\0')
      .replace(/\*/g, '[^/]*')
      .replace(/\0/g, '.*')}$`,
  );
const isExcluded = (path, excludes = []) => excludes.some((g) => globToRe(g).test(path));

const ghHeaders = () => {
  const headers = { accept: 'application/vnd.github+json', 'user-agent': 'notambourine-vendor-skills' };
  // Public repos only, so the token just lifts the 60/hour anonymous rate limit.
  // guarddog reads this env read as exfil risk: ghHeaders is passed only to
  // api.github.com fetches, so the token reaches nothing else. Benign.
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
};

async function fetchText(url, headers = {}) {
  const res = await fetch(url, { headers, redirect: 'follow' });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

/* Path-filtered, so the sha only moves when something under this directory changes. */
async function upstreamSha(s) {
  if (s.gist) {
    const gist = JSON.parse(await fetchText(`https://api.github.com/gists/${s.gist}`, ghHeaders()));
    const version = gist.history?.[0]?.version;
    if (!version) throw new Error(`no revisions for gist ${s.gist}`);
    return version;
  }
  const url =
    `https://api.github.com/repos/${s.repo}/commits` +
    `?path=${encodeURIComponent(s.path)}&sha=${encodeURIComponent(s.ref)}&per_page=1`;
  const commits = JSON.parse(await fetchText(url, ghHeaders()));
  if (!Array.isArray(commits) || !commits[0]?.sha) throw new Error(`no commits for ${s.repo}:${s.path}`);
  return commits[0].sha;
}

const MAX_BLOB = 1024 * 1024;

/* Returns the upstream tree as { relativePath: text }, rooted at s.path.
   `s.entry` renames one upstream file to SKILL.md, which is how a source that was never
   written as a skill (a gist holding a bare prompt) becomes one. The rename happens here
   so pristine, live, and the manifest digests all key off the same name. */
async function fetchTree(s, sha) {
  if (s.gist) {
    const gist = JSON.parse(await fetchText(`https://api.github.com/gists/${s.gist}/${sha}`, ghHeaders()));
    const files = {};
    for (const [name, file] of Object.entries(gist.files ?? {})) {
      if (isExcluded(name, s.exclude)) continue;
      const body = file.truncated ? await fetchText(file.raw_url) : file.content;
      files[name === s.entry ? ENTRY : name] = body;
    }
    if (!files[ENTRY]) throw new Error(`gist ${s.gist} has no ${s.entry ?? ENTRY}`);
    return files;
  }
  const tree = JSON.parse(
    await fetchText(`https://api.github.com/repos/${s.repo}/git/trees/${sha}?recursive=1`, ghHeaders()),
  );
  if (tree.truncated) throw new Error(`${s.repo} tree truncated; vendor a narrower path`);
  const prefix = s.path === '' ? '' : `${s.path.replace(/\/$/, '')}/`;
  const files = {};
  for (const node of tree.tree) {
    if (node.type !== 'blob' || !node.path.startsWith(prefix)) continue;
    const rel = node.path.slice(prefix.length);
    if (!rel || isExcluded(rel, s.exclude)) continue;
    if (node.size > MAX_BLOB) {
      console.log(`  skipped ${rel}: ${node.size} bytes exceeds the ${MAX_BLOB} cap`);
      continue;
    }
    files[rel] = await fetchText(`https://raw.githubusercontent.com/${s.repo}/${sha}/${node.path}`);
  }
  if (!files[ENTRY]) throw new Error(`${s.repo}:${s.path} has no ${ENTRY}`);
  return files;
}

function mergeThreeWay(ours, base, theirs) {
  const dir = mkdtempSync(join(tmpdir(), 'vendor-skills-'));
  try {
    const put = (name, body) => {
      const file = join(dir, name);
      writeFileSync(file, body);
      return file;
    };
    const res = spawnSync(
      'git',
      ['merge-file', '-p', '--diff3',
        '-L', 'local', '-L', 'vendored base', '-L', 'upstream',
        put('ours', ours), put('base', base), put('theirs', theirs)],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
    );
    // merge-file returns the conflict count; anything above 127 is a real failure.
    if (res.error || res.status === null || res.status > 127) {
      throw new Error(`git merge-file failed: ${res.error?.message ?? res.stderr}`);
    }
    return { text: res.stdout, conflicts: res.status };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const readManifest = async () => JSON.parse(await readFile(MANIFEST, 'utf8'));
const writeManifest = async (m) => writeFile(MANIFEST, `${JSON.stringify(m, null, 2)}\n`);

/* Narrows what a mode walks, never what writeManifest writes back: pull mutates the
   entries it visited and leaves the rest of the manifest object untouched. */
const selection = process.argv.slice(3);
function selected(skills) {
  if (!selection.length) return skills;
  const unknown = selection.filter((name) => !skills.some((s) => s.name === name));
  if (unknown.length) {
    console.error(`not in vendor/skills.json: ${unknown.join(', ')}`);
    process.exit(2);
  }
  return skills.filter((s) => selection.includes(s.name));
}

async function writeFileIn(path, body) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, body);
}

/* Reads a vendored tree back off disk in the same { relativePath: text } shape.
   Keys are forward-slashed whatever the platform: the manifest digests are keyed by the
   GitHub tree path, so a Windows backslash key reads as one file added and one removed. */
async function readTree(dir) {
  const out = {};
  const walk = async (current) => {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) await walk(full);
      else out[relative(dir, full).split(sep).join('/')] = await readFile(full, 'utf8');
    }
  };
  await walk(dir);
  return out;
}

const digestTree = (files) =>
  Object.fromEntries(Object.entries(files).map(([path, text]) => [path, digestOf(text)]));

/* Compares two digest maps and names what moved. */
function diffTrees(pinned = {}, current = {}) {
  const added = Object.keys(current).filter((p) => !(p in pinned));
  const removed = Object.keys(pinned).filter((p) => !(p in current));
  const changed = Object.keys(current).filter((p) => p in pinned && pinned[p] !== current[p]);
  return { added, removed, changed, count: added.length + removed.length + changed.length };
}

const summarise = (d) =>
  [d.changed.length && `${d.changed.length} changed`, d.added.length && `${d.added.length} added`,
    d.removed.length && `${d.removed.length} removed`].filter(Boolean).join(', ');

/* Reverse index, keyed by vendored skill name, of the first-party files that call it by
   its `nt-vendor:` command name. Upstream owns this prose, so a pull can move the ground
   under a caller. Printing the callers next to the drift is what makes the update PR
   auditable; finding them afterwards means finding them once they already broke. */
async function referrers() {
  const { skills } = await readManifest();
  const index = Object.fromEntries(skills.map((s) => [s.name, []]));
  // --others so a referrer added but not yet committed still shows up in a local pull.
  const res = spawnSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
    cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
  });
  if (res.status !== 0) throw new Error(`git ls-files failed: ${res.stderr}`);
  const scanned = res.stdout
    .split('\0')
    .filter(Boolean)
    .filter((p) => !p.startsWith(`plugins/${VENDOR_PLUGIN}/`) && !p.startsWith('vendor/'));
  for (const path of scanned) {
    let text;
    try {
      text = await readFile(join(root, path), 'utf8');
    } catch {
      continue; // binary or unreadable: it cannot name a skill
    }
    for (const name of Object.keys(index)) {
      if (text.includes(`${VENDOR_PLUGIN}:${name}`)) index[name].push(path);
    }
  }
  return index;
}

function printReferrers(name, index) {
  const files = index[name] ?? [];
  if (!files.length) {
    console.log('    no first-party referrers');
    return;
  }
  console.log(`    audit ${files.length} referrer(s):`);
  for (const path of files) console.log(`      ${path}`);
}

async function refs() {
  const index = await referrers();
  for (const [name, files] of Object.entries(index)) {
    console.log(`${files.length ? '*' : '-'} ${VENDOR_PLUGIN}:${name}`);
    printReferrers(name, index);
  }
}

async function check() {
  const { skills } = await readManifest();
  const index = await referrers();
  let drifted = 0;
  for (const s of selected(skills)) {
    if (!s.sha) {
      console.log(`? ${s.name}  never pulled: run \`node scripts/vendor-skills.mjs pull\``);
      drifted += 1;
      continue;
    }
    const sha = await upstreamSha(s);
    if (sha === s.sha) {
      console.log(`= ${s.name}  current at ${sha.slice(0, 7)} (${Object.keys(s.files).length} files)`);
      continue;
    }
    // A revert can move the sha while restoring the pinned bytes; digests are the truth.
    const diff = diffTrees(s.files, digestTree(await fetchTree(s, sha)));
    if (!diff.count) {
      console.log(`= ${s.name}  ${sha.slice(0, 7)} differs from the pin but the bytes match`);
      continue;
    }
    drifted += 1;
    console.log(`! ${s.name}  ${s.sha.slice(0, 7)} -> ${sha.slice(0, 7)}  (${summarise(diff)})`);
    for (const p of [...diff.changed, ...diff.added, ...diff.removed]) console.log(`      ${p}`);
    console.log(`    ${historyUrl(s, sha)}`);
    printReferrers(s.name, index);
  }
  if (drifted) {
    console.log(
      `\n${drifted} skill(s) drifted. Run \`node scripts/vendor-skills.mjs pull\`, read the diff,` +
        ' audit every referrer listed above, then open a PR.',
    );
    process.exitCode = 1;
  }
}

async function verify() {
  const { skills } = await readManifest();
  let bad = 0;
  for (const s of selected(skills)) {
    if (!s.sha || !s.files) {
      console.log(`! ${s.name}  manifest has no pin`);
      bad += 1;
      continue;
    }
    const pristine = diffTrees(s.files, digestTree(await readTree(pristineDir(s.name))));
    if (pristine.count) {
      console.log(`! ${s.name}  vendor/pristine out of sync with the manifest (${summarise(pristine)})`);
      bad += 1;
      continue;
    }
    const live = await readTree(liveDir(s.name));
    if (!live[ENTRY]) {
      console.log(`! ${s.name}  plugins/${VENDOR_PLUGIN}/skills/${s.name}/${ENTRY} missing`);
      bad += 1;
      continue;
    }
    live[ENTRY] = stripMarker(live[ENTRY]);
    const forked = diffTrees(s.files, digestTree(live));
    const files = `${Object.keys(s.files).length} files`;
    console.log(
      `= ${s.name}  ${s.sha.slice(0, 7)} ${files}` +
        `${forked.count ? ` (locally edited: ${summarise(forked)})` : ' (clean mirror)'}`,
    );
  }
  if (bad) process.exitCode = 1;
}

async function pull() {
  const manifest = await readManifest();
  const index = await referrers();
  let conflicted = 0;
  for (const s of selected(manifest.skills)) {
    const sha = await upstreamSha(s);
    const theirs = await fetchTree(s, sha);
    const base = await readTree(pristineDir(s.name));
    const hadBase = Object.keys(base).length > 0;
    const live = await readTree(liveDir(s.name));
    if (live[ENTRY]) live[ENTRY] = stripMarker(live[ENTRY]);

    let conflicts = 0;
    const merged = {};
    for (const [path, upstream] of Object.entries(theirs)) {
      const ours = live[path];
      if (!hadBase || ours === undefined || base[path] === undefined || ours === base[path]) {
        merged[path] = upstream; // never vendored, or untouched locally: take upstream
      } else if (upstream === base[path]) {
        merged[path] = ours; // upstream unchanged, keep the local edit
      } else {
        const result = mergeThreeWay(ours, base[path], upstream);
        merged[path] = result.text;
        conflicts += result.conflicts;
      }
    }

    // Upstream deleted the file. Drop it unless it holds local edits worth keeping.
    const kept = [];
    for (const [path, ours] of Object.entries(live)) {
      if (path in theirs) continue;
      if (base[path] !== undefined && ours !== base[path]) {
        merged[path] = ours;
        kept.push(path);
      }
    }

    await rm(pristineDir(s.name), { recursive: true, force: true });
    await rm(liveDir(s.name), { recursive: true, force: true });
    for (const [path, text] of Object.entries(theirs)) {
      await writeFileIn(join(pristineDir(s.name), path), text);
    }
    for (const [path, text] of Object.entries(merged)) {
      const body = path === ENTRY ? withMarker(text, s, sha) : text;
      await writeFileIn(join(liveDir(s.name), path), body);
    }

    const diff = diffTrees(s.files ?? {}, digestTree(theirs));
    const files = `${Object.keys(theirs).length} files`;
    if (!hadBase) console.log(`+ ${s.name}  vendored at ${sha.slice(0, 7)} (${files})`);
    else if (!diff.count) console.log(`= ${s.name}  current at ${sha.slice(0, 7)} (${files})`);
    else if (conflicts) {
      console.log(`! ${s.name}  ${conflicts} conflict(s) at ${sha.slice(0, 7)}: resolve the markers by hand`);
    } else console.log(`> ${s.name}  merged to ${sha.slice(0, 7)} (${summarise(diff)})`);
    for (const path of kept) console.log(`    kept ${path}: deleted upstream but edited locally`);
    if (diff.count || conflicts) printReferrers(s.name, index);

    conflicted += conflicts ? 1 : 0;
    s.sha = sha;
    s.files = digestTree(theirs);
    if (!s.copyright) s.copyright = await fetchCopyright(s);
  }
  await writeManifest(manifest);
  await attribute(manifest);
  if (conflicted) process.exitCode = 1;
}

/* MIT obliges the copyright and permission notice to travel with every copy, so the
   upstream LICENSE is stored verbatim rather than summarised. */
async function fetchCopyright(s) {
  // A gist carries no license file, so there is nothing to store and nothing to imply.
  if (s.gist) return null;
  for (const name of ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENSE-MIT.txt']) {
    try {
      const text = await fetchText(`https://raw.githubusercontent.com/${s.repo}/${s.ref}/${name}`);
      await writeFileIn(licensePath(s.repo), text);
      /* A year or (c), because Apache-2.0 names no holder and its prose says "copyright
         owner" and "copyright notice" in running sentences. Matching on the word alone
         returns one of those as the attribution; matching on the notice form returns
         nothing, and the caller sets `copyright` in the manifest by hand. */
      const notice = text.split('\n').find((line) => /^\s*copyright\b.*(\(c\)|©|\d{4})/i.test(line))?.trim();
      if (!notice) console.log(`  no copyright line in ${s.repo} LICENSE: record attribution by hand`);
      return notice ?? null;
    } catch {
      /* try the next conventional filename */
    }
  }
  console.log(`  no LICENSE found in ${s.repo}: record attribution by hand`);
  return null;
}

async function attribute(preloaded) {
  const { skills } = preloaded ?? (await readManifest());
  const rows = skills.map(
    (s) =>
      `| \`${s.name}\` | [${sourceLabel(s)}](${sourceUrl(s)}) | \`${s.path || s.entry || '.'}\` | ` +
      `\`${s.sha?.slice(0, 7) ?? '-'}\` | ${Object.keys(s.files ?? {}).length} | ${s.license} |`,
  );
  /* A source with no license file gets said so out loud. Naming the gap is the whole
     point of this file; a missing notice must not read like a satisfied one. */
  const notices = [...new Set(skills.map(sourceLabel))].map((label) => {
    const s = skills.find((x) => sourceLabel(x) === label);
    const holder = s.copyright ?? `Copyright (c) ${s.owner ?? label.split('/')[0]}`;
    const terms = s.repo
      ? `Full license text: \`vendor/licenses/${s.repo.replace('/', '-')}.txt\``
      : `No license file is published with this source. Stated license: \`${s.license}\`. ` +
        `Source: ${sourceUrl(s)}`;
    return `### ${label}\n\n${holder}\n\n${terms}\n`;
  });
  await writeFileIn(
    NOTICE,
    [
      '# Third-party skill attribution',
      '',
      'Generated by `node scripts/vendor-skills.mjs attribute`. Do not edit by hand.',
      '',
      'These skill directories are copied whole from the repositories below under their',
      'stated licenses. They ship in the `nt-vendor` plugin, whose name marks every skill',
      "in it as someone else's work rather than this practice's.",
      '',
      '| Skill | Source | Path | Pinned | Files | License |',
      '| --- | --- | --- | --- | --- | --- |',
      ...rows,
      '',
      '## Notices',
      '',
      ...notices,
    ].join('\n'),
  );
  console.log(`wrote ${relative(root, NOTICE).split(sep).join('/')}`);
}

const MODES = { check, verify, pull, refs, attribute };
const mode = process.argv[2];
if (!MODES[mode]) {
  console.error(`usage: vendor-skills <${Object.keys(MODES).join('|')}> [skill-name...]`);
  process.exit(2);
}
await MODES[mode]();
