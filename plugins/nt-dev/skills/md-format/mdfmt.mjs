#!/usr/bin/env node
/* Wraps and tidies markdown with dprint's markdown plugin.

   Two jobs, and neither is formatting - dprint does that. First, resolve which files to
   touch, because the useful default is "the markdown this branch changed" and git is the
   only thing that knows. Second, carry a width: dprint has no --line-width flag, so any
   width other than the config's has to become a config file on disk.

   The formatter is a version-pinned wasm plugin fetched over the network once and cached
   by dprint, checksum-pinned in dprint.json. The CLI comes from npx unless a dprint is
   already on PATH.

   Only git-tracked and untracked-but-not-ignored files are candidates, so .gitignore is
   honored for free. A file opts out with `<!-- dprint-ignore-file -->` on its first line;
   a passage opts out between `<!-- dprint-ignore-start -->` and `<!-- dprint-ignore-end -->`.
   A whole tree opts out through `excludes` in the repo's own dprint.json.
*/
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DPRINT_VERSION = '0.55.2';
const MD = /\.(md|markdown)$/i;
const NPX = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const USAGE = `Usage: node mdfmt.mjs [target ...] [options]

Targets, in place of the default:
  all                  every markdown file in the repo
  <path.md>            one file
  <dir>                every markdown file under it
  --staged             only what is staged
Default with no target: the markdown this branch changed against its base, plus
anything uncommitted or newly added.

Options:
  --width <n>          wrap column, e.g. 80 or 120 or 200
  --width never        no wrapping - one physical line per paragraph
  --width keep         leave existing line breaks alone, fix structure only
  --base <ref>         branch to diff against (default: the remote's HEAD)
  --exclude <glob>     skip matching paths, repeatable
  --check              print the diff of what would change, write nothing, exit 1 if any
  --list               print the resolved target list and stop
  --config <path>      use this dprint config instead of the resolved one`;

function die(message) {
  console.error(message);
  process.exit(2);
}

function git(args, cwd) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return r.status === 0 ? r.stdout : null;
}

function lines(text) {
  return (text ?? '').split('\n').filter(Boolean);
}

/* --- arguments ------------------------------------------------------------ */

const argv = process.argv.slice(2);
const opts = { targets: [], excludes: [], width: null, mode: 'fmt' };
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  const next = () => argv[++i] ?? die(`${a} needs a value`);
  if (a === '-h' || a === '--help') {
    console.log(USAGE);
    process.exit(0);
  } else if (a === '--width' || a === '--wrap') opts.width = next();
  else if (a === '--base') opts.base = next();
  else if (a === '--exclude') opts.excludes.push(next());
  else if (a === '--config') opts.config = next();
  else if (a === '--check') opts.mode = 'check';
  else if (a === '--list') opts.mode = 'list';
  else if (a === '--staged') opts.staged = true;
  else if (a.startsWith('-')) die(`unknown option ${a}\n\n${USAGE}`);
  else opts.targets.push(a);
}

const root = git(['rev-parse', '--show-toplevel'], process.cwd())?.trim();
if (!root) die('not inside a git repository');

/* --- which files ---------------------------------------------------------- */

/* Untracked-but-not-ignored counts: a markdown file a branch adds is part of the branch
   whether or not it has been staged yet. */
const untracked = () => lines(git(['ls-files', '--others', '--exclude-standard'], root));

function baseRef() {
  if (opts.base) return opts.base;
  const head = git(['symbolic-ref', '--quiet', '--short', 'refs/remotes/origin/HEAD'], root);
  if (head) return head.trim();
  for (const ref of ['origin/main', 'origin/master', 'main', 'master']) {
    if (git(['rev-parse', '--verify', '--quiet', ref], root)) return ref;
  }
  return null;
}

function branchChanges() {
  const found = new Set(lines(git(['diff', '--name-only', '--diff-filter=ACMR', 'HEAD'], root)));
  untracked().forEach((p) => found.add(p));
  const ref = baseRef();
  const merged = ref && git(['merge-base', ref, 'HEAD'], root)?.trim();
  if (merged) {
    const spanned = git(['diff', '--name-only', '--diff-filter=ACMR', `${merged}..HEAD`], root);
    lines(spanned).forEach((p) => found.add(p));
  }
  return { paths: [...found], ref: merged ? ref : null };
}

function underDir(rel) {
  const prefix = rel === '.' ? '' : `${rel.replace(/\/*$/, '')}/`;
  const tracked = lines(git(['ls-files', '--', rel], root));
  const fresh = untracked().filter((p) => !prefix || p.startsWith(prefix));
  return [...new Set([...tracked, ...fresh])];
}

let source;
let paths;
if (opts.staged) {
  source = 'staged';
  paths = lines(git(['diff', '--name-only', '--cached', '--diff-filter=ACMR'], root));
} else if (opts.targets.length === 0) {
  const changed = branchChanges();
  source = changed.ref ? `changed against ${changed.ref}` : 'uncommitted and untracked';
  paths = changed.paths;
} else if (opts.targets.length === 1 && opts.targets[0] === 'all') {
  source = 'whole repo';
  paths = underDir('.');
} else {
  source = 'given paths';
  paths = opts.targets.flatMap((t) => {
    const abs = isAbsolute(t) ? t : resolve(process.cwd(), t);
    if (!existsSync(abs)) die(`no such path: ${t}`);
    if (!statSync(abs).isDirectory()) return [abs];
    const rel = relative(root, abs).split('\\').join('/');
    if (rel.startsWith('..')) die(`outside the repository: ${t}`);
    return underDir(rel === '' ? '.' : rel);
  });
}

const files = [...new Set(paths)]
  .filter((p) => MD.test(p))
  .map((p) => (isAbsolute(p) ? p : join(root, p)))
  .filter((p) => existsSync(p));

if (opts.mode === 'list') {
  files.forEach((f) => console.log(f));
  process.exit(0);
}
if (files.length === 0) {
  console.log(`md-format: no markdown files in scope (${source})`);
  process.exit(0);
}

/* --- which config --------------------------------------------------------- */

/* A repo that already configures dprint wins: its excludes and its width are the house
   style there, and this skill's defaults are only for repos that have said nothing. */
function repoConfig() {
  for (const name of ['dprint.json', '.dprint.json']) {
    const path = join(root, name);
    if (!existsSync(path)) continue;
    try {
      if (JSON.parse(readFileSync(path, 'utf8')).markdown) return path;
    } catch {
      console.error(`md-format: ignoring unreadable ${name}`);
    }
  }
  return null;
}

const basePath = opts.config
  ? resolve(process.cwd(), opts.config)
  : (repoConfig() ?? join(HERE, 'dprint.json'));
const base = JSON.parse(readFileSync(basePath, 'utf8'));

let configPath = basePath;
const cliExcludes = [];

if (opts.width !== null) {
  const markdown = { ...(base.markdown ?? {}) };
  if (opts.width === 'never') markdown.textWrap = 'never';
  else if (opts.width === 'keep' || opts.width === 'maintain') markdown.textWrap = 'maintain';
  else if (/^\d+$/.test(opts.width)) {
    markdown.textWrap = 'always';
    markdown.lineWidth = Number(opts.width);
  } else die(`--width takes a number, "never", or "keep" - got "${opts.width}"`);

  /* The override has to live in a temp file, and dprint reads a config's own patterns
     relative to that file's directory. So the patterns leave the config and go on the
     command line as absolute globs, where there is nothing to resolve them against. */
  const merged = { ...base, markdown };
  delete merged.includes;
  delete merged.excludes;
  for (const pattern of base.excludes ?? []) cliExcludes.push(pattern);
  configPath = join(mkdtempSync(join(tmpdir(), 'md-format-')), 'dprint.json');
  writeFileSync(configPath, JSON.stringify(merged, null, 2));
}
cliExcludes.push(...opts.excludes);

const posixRoot = root.split('\\').join('/').replace(/\/$/, '');
const absolute = (pattern) =>
  pattern.startsWith('!')
    ? `!${absolute(pattern.slice(1))}`
    : pattern.startsWith('/') || /^[A-Za-z]:/.test(pattern)
      ? pattern
      : `${posixRoot}/${pattern.replace(/^\.\//, '')}`;

/* --- run ------------------------------------------------------------------ */

/* A dprint already on PATH saves the npx round trip, but only a build new enough to know
   --excludes-override, which this script relies on whenever a width is overridden. */
function cli() {
  const found = spawnSync('dprint', ['--version'], { encoding: 'utf8' });
  const version = found.status === 0 ? /(\d+)\.(\d+)\./.exec(found.stdout) : null;
  if (version && (Number(version[1]) > 0 || Number(version[2]) >= 50)) return ['dprint', []];
  return [NPX, ['--yes', `dprint@${DPRINT_VERSION}`]];
}

const [bin, prefix] = cli();
const args = [
  ...prefix,
  opts.mode === 'fmt' ? 'fmt' : 'check',
  '--config',
  configPath,
  '--config-discovery=false',
  '--allow-no-files',
];
if (cliExcludes.length) args.push('--excludes-override', ...cliExcludes.map(absolute));
args.push('--', ...files);

const width =
  opts.width ?? `${base.markdown?.lineWidth ?? 80} (${base.markdown?.textWrap ?? 'maintain'})`;
console.log(
  `md-format: ${files.length} file(s), ${source}, width ${width}, config ${configPath}`,
);

const run = spawnSync(bin, args, { cwd: root, stdio: 'inherit' });
if (run.error) die(`could not run ${bin}: ${run.error.message}`);
/* dprint exits 20 from `check` when a file would change. That is this script's one, not
   a crash. */
process.exit(run.status === 20 ? 1 : (run.status ?? 2));
