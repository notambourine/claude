#!/usr/bin/env node
/* Points PR and issue work at the skill that holds the house standard, for the agent that
   never loaded it.

   A skill only fires when something in the prompt trips its description. "File this as a
   ticket" trips /nt-dev:issue; "also open an issue for the flaky test" often does not, and
   the issue that lands has no milestone, no label, and a one-line body. The board carries
   that forever.

   KEY-DECISION 2026-08-19: name the skill, do not audit the command. An earlier version
   read the command for a missing --milestone, --label, and section heading, which put the
   standard in two places and let it drift - it ended up advising `--template`, a flag gh
   refuses alongside --body-file. The skill is the standard, and the agent can judge its own
   body against it.

   Three signals, cheapest first:
     Write(pr-body.md)     the moment before a body gets written, where a nudge costs
                           nothing. 84 of the PR bodies in this user's transcripts were
                           written to `pr-body.md`, 36 to `prbody.md`, 15 to `pr.md`.
     gh pr|issue create    the backstop for a body that never became a file - an inline
                           --body, a --fill, a heredoc.
     Skill(nt-dev:pr)      the all-clear. The skill was read, so neither nudge fires again
                           this session - including for the `gh pr create` the skill itself
                           ends on.

   The nudge is a `deny`, which is the only documented way a PreToolUse hook reaches the
   model on a call it did not want to block - additionalContext is listed for this event but
   the docs do not say whether it arrives when the call proceeds, so it is the quiet half
   here and nothing depends on it.

   Config, via `env` in a repo's .claude/settings.json or the user's:
     NT_DEV_SKILL_NUDGE=off      do nothing
     NT_DEV_SKILL_NUDGE=strict   nudge until the skill is actually read, not once
   Unset is the default: nudge once per kind per session, then step aside.
*/
import { existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { context, deny, isGh, pass, rawPayload } from './lib/hook.mjs';

const MODE = (process.env.NT_DEV_SKILL_NUDGE ?? '').trim().toLowerCase();

if (MODE === 'off') pass();

const payload = rawPayload();
if (!payload) pass();

const sessionId = typeof payload.session_id === 'string' ? payload.session_id : '';
const input = payload.tool_input ?? {};

const KINDS = {
  pr: { skill: '/nt-dev:pr', what: 'PR' },
  issue: { skill: '/nt-dev:issue', what: 'issue' },
};

/* --- the all-clear: the skill was read ------------------------------------- */

/* Skills arrive as `nt-dev:pr` from the Skill tool and `/nt-dev:pr` when a human types it,
   so match the tail. */
const read = String(input.skill ?? '').match(/nt-dev:(pr|issue)$/);
if (read) {
  mark(`read-${read[1]}`);
  pass();
}

/* --- what this call is about ----------------------------------------------- */

const kind = whatFor();
if (!kind) pass();

if (marked(`read-${kind}`)) pass();

const { skill, what } = KINDS[kind];
const message = `🟡 [gh-skill-nudge] Read ${skill} before writing this ${what}, then carry on.

It holds the house standard a hook cannot check for you - which template to fill, the body shape, and for an issue the milestone, labels, and project fields. Invoke the skill and this stops asking for the rest of the session. Silence this repo with NT_DEV_SKILL_NUDGE=off under \`env\` in .claude/settings.json.`;

if (MODE === 'strict' || !marked(`nudged-${kind}`, { set: true })) deny(message);
context(message, `🟡 [gh-skill-nudge] ${skill} already named once this session`);

/* --- helpers --------------------------------------------------------------- */

/* Which skill this tool call wants, or null for the calls that are none of this hook's
   business. */
function whatFor() {
  if (typeof input.command === 'string') {
    /* --web hands the whole thing to the browser, where GitHub shows the repo's own forms
       and a human fills them in. Nothing here for a skill to improve. */
    if (!isGh(input.command) || /(^|\s)(--web|-w)([=\s]|$)/.test(input.command)) return null;
    if (/\bgh\s+pr\s+create\b/.test(input.command)) return 'pr';
    if (/\bgh\s+issue\s+create\b/.test(input.command)) return 'issue';
    return null;
  }
  /* A body file being written, by the names these bodies actually get. A path under
     .github/ is the repo's own template, which is edited, not filled. */
  if (typeof input.file_path === 'string' && !/[\\/]\.github[\\/]/.test(input.file_path)) {
    const name = basename(input.file_path).toLowerCase();
    if (/^(pr[-_]?body|pr)([-_.].*)?\.(md|markdown)$/.test(name)) return 'pr';
    if (/^issue([-_.].*)?\.(md|markdown)$/.test(name)) return 'issue';
  }
  return null;
}

/* Session memory, since a hook is a fresh process every time and has nowhere else to keep
   it: a file in the OS temp dir keyed by the session id. A session id this hook never got
   means no memory at all, which errs toward nudging. */
function markerPath(key) {
  return sessionId ? join(tmpdir(), `nt-dev-skill-${key}-${sessionId.replace(/[^\w-]/g, '')}`) : null;
}

function marked(key, { set = false } = {}) {
  const path = markerPath(key);
  if (!path) return false;
  if (existsSync(path)) return true;
  if (set) mark(key);
  return false;
}

function mark(key) {
  const path = markerPath(key);
  if (!path) return;
  try {
    writeFileSync(path, '');
  } catch {
    /* Nowhere to write is not a reason to refuse a tool call; it just means the nudge
       repeats. */
  }
}
