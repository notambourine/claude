/* The dash rule, in one place, for the hooks that assert it at different moments.

   The gate at https://github.com/notambourine/dash-ratchet fails a pull request on any
   unicode dash the diff adds. What the character set is, what counts as an addition, and
   which paths a repo has taken out of scope are the same three answers wherever the check
   runs, so they live here and the hooks bring only their own sense of "before" and "after".
*/
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/* Escapes, never the characters: the module that matches a dash must not be the file that
   adds one. Read only through String.match, which ignores lastIndex on a global pattern
   and so carries no state from one line to the next. */
const DASH = /[\u2010-\u2015\u2212]|&(?:mdash|ndash|minus);/g;

/* --- counting -------------------------------------------------------------- */

/* One entry per line, trimmed: neither the marker nor a dash count changes with the
   indentation, and the trimmed text is what a moved line is matched by. */
export function lines(text) {
  return String(text).split('\n').map((line, i) => ({ line: i + 1, text: line.trim() }));
}

export function withDash(list, marker) {
  return list.filter((s) => !s.text.includes(marker) && s.text.match(DASH));
}

export function total(list, marker) {
  return withDash(list, marker).reduce((n, s) => n + s.text.match(DASH).length, 0);
}

/* The dash lines the new text holds that the old one did not, matched off as a multiset so
   a line carried through verbatim - or moved - is nobody's to rewrite. */
export function raised(now, was) {
  const held = new Map();
  for (const s of was) held.set(s.text, (held.get(s.text) ?? 0) + 1);
  return now.filter((s) => {
    const left = held.get(s.text) ?? 0;
    if (!left) return true;
    held.set(s.text, left - 1);
    return false;
  });
}

/* The one instruction both hooks end on. The alternatives are listed because naming them
   is what turns a block into an edit; the marker is the repo's own. */
export function advice(marker) {
  return `Rewrite each line above: colon, comma pair, parens, semicolon, split sentence, or
ASCII hyphen for ranges and compounds. Load-bearing dash: append \`${marker}\` to its line.`;
}

/* --- the gate's own scope -------------------------------------------------- */

/* The marker and the excludes a repo declared, read off its own call to the gate rather
   than restated here, so the hook and CI cannot disagree about scope. A repo with no gate
   gets the defaults and is still checked, because the prose rule is ours whatever CI a
   given repo runs. */
export function gateRules(root) {
  const text = root ? gateConfig(root) : '';
  const marker = value(uncomment(/^[ \t]*marker:[ \t]*(.+)$/m.exec(text)?.[1] ?? '')) || 'dash-ok';
  const out = excludes(text);
  return { marker, excluded: (rel) => out.some((one) => rel === one || rel.startsWith(`${one}/`)) };
}

/* The gate's call, out of whichever workflow holds it. A dedicated dash-ratchet.yml is the
   common shape, but the composite action goes in a job the repo writes itself, under any
   filename, so the `uses:` line is what identifies it. */
function gateConfig(root) {
  const dir = join(root, '.github', 'workflows');
  const all = list(dir);
  const own = all.filter((name) => /^dash-ratchet\.ya?ml$/.test(name));
  for (const name of [...own, ...all.filter((name) => !own.includes(name))]) {
    const text = read(join(dir, name));
    const block = gateBlock(text);
    if (block) return block;
    /* A dedicated workflow reaching the gate some other way still holds its scope. */
    if (own.includes(name)) return text;
  }
  return '';
}

/* From the `uses:` line naming the gate to where its block dedents, so a `marker:` or an
   `exclude:` belonging to another step in the same workflow is not read as the gate's. */
function gateBlock(text) {
  const rows = String(text).split('\n');
  const at = rows.findIndex((row) => row.includes('notambourine/dash-ratchet'));
  if (at < 0) return '';
  /* A step's body is indented past its own `- `, while a job's `with:` is a sibling of the
     `uses:` beside it, so where the block ends depends on which form the call took. */
  const ends = /^[ \t]*-/.test(rows[at]) ? indent(rows[at]) : indent(rows[at]) - 1;
  const out = [rows[at]];
  for (const row of rows.slice(at + 1)) {
    if (row.trim() && indent(row) <= ends) break;
    out.push(row);
  }
  return out.join('\n');
}

function list(dir) {
  try {
    return readdirSync(dir).filter((name) => /\.ya?ml$/.test(name)).sort();
  } catch {
    return [];
  }
}

function read(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return '';
  }
}

/* The paths under `exclude:` as the gate reads them, relative to the repo root, in the
   three shapes YAML writes a list of them: one on the line, a block scalar, or a
   sequence. */
function excludes(text) {
  const rows = String(text).split('\n');
  const at = rows.findIndex((row) => /^[ \t]*exclude:/.test(row));
  if (at < 0) return [];
  const own = indent(rows[at]);
  const rest = rows[at].replace(/^[ \t]*exclude:[ \t]*/, '');
  if (rest && !rest.startsWith('#') && !/^[|>]/.test(rest)) return [dir(uncomment(rest))].filter(Boolean);
  const block = /^[|>]/.test(rest);
  const out = [];
  for (const row of rows.slice(at + 1)) {
    if (!row.trim()) continue;
    if (block) {
      /* A block scalar ends where it dedents back to the mapping, and every line inside it
         is literal text - a `#` there is part of the path, as the gate's own reader has
         it. */
      if (indent(row) <= own) break;
      const one = dir(row);
      if (one) out.push(one);
      continue;
    }
    /* A sequence may sit at its key's own indentation, so only a line that is not an item
       ends it. */
    const item = /^[ \t]*-[ \t]*(.*)$/.exec(row);
    if (!item || indent(row) < own) break;
    const one = dir(uncomment(item[1]));
    if (one) out.push(one);
  }
  return out;
}

function indent(row) {
  return row.length - row.trimStart().length;
}

function dir(raw) {
  return value(raw).replace(/\/+$/, '');
}

/* A `#` ends a scalar everywhere YAML reads one, so what follows is not part of the value.
   Block scalars are the exception, and that caller does not come through here. */
function uncomment(raw) {
  return String(raw).replace(/^[ \t]*#.*$/, '').replace(/[ \t]+#.*$/, '');
}

function value(raw) {
  return String(raw ?? '').trim().replace(/^["']|["']$/g, '');
}
