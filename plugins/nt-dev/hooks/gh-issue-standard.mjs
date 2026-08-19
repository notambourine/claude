#!/usr/bin/env node
/* Nudges `gh issue create` toward the house standard in skills/issue/SKILL.md, for the
   agent that never loaded the skill.

   A skill only fires when something in the prompt trips its description. "File this as a
   ticket" trips /nt-dev:issue; "also open an issue for the flaky test" often does not, and
   the issue that lands has no milestone, no label, and a one-line body. The board carries
   that forever. So this reads the command about to run, checks it against the few parts of
   the standard a hook can actually see, and says what is missing.

   It is a nudge, not a validator. It names gaps; it does not check whether the body is any
   good, and once it has spoken in a session it gets out of the way.

   KEY-DECISION 2026-08-19: the first nudge of a session is a `deny`. A deny is the only
   documented way a PreToolUse hook reaches the model on a call it did not want to block -
   additionalContext is listed for this event but the docs do not say whether it arrives
   when the call proceeds, so it is the quiet half here and nothing depends on it. The cost
   is one refused command; the model reads the reason, fixes the gaps, and reruns.

   Config, via `env` in a repo's .claude/settings.json or the user's:
     NT_DEV_ISSUE_STANDARD=off      do nothing
     NT_DEV_ISSUE_STANDARD=strict   deny every time there is a gap, not just the first
   Unset is the default: deny once per session, then advise and step aside.
*/
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bashPayload, bodyFiles, context, deny, isGh, pass, repoRoot } from './lib/hook.mjs';

const MODE = (process.env.NT_DEV_ISSUE_STANDARD ?? '').trim().toLowerCase();

if (MODE === 'off') pass();

const event = bashPayload();
if (!event) pass();

const { command, cwd, sessionId } = event;

if (!isGh(command) || !/\bgh\s+issue\s+create\b/.test(command)) pass();

/* --web hands the whole thing to the browser, where GitHub shows the repo's own forms and
   a human fills them in. Nothing here to improve. */
if (/(^|\s)(--web|-w)([=\s]|$)/.test(command)) pass();

/* --- what the standard asks for, and what this command brings -------------- */

const has = (long, short) => new RegExp(`(^|\\s)(${long}${short ? `|${short}` : ''})([=\\s]|$)`).test(command);
const gaps = [];

/* The repo's own issue forms outrank the skill's body shapes, so they are the first thing
   to check and the only one that can make the rest of this moot. */
const root = repoRoot(cwd);
const forms = root && existsSync(join(root, '.github', 'ISSUE_TEMPLATE'));
if (forms && !has('--template', '-T')) {
  gaps.push('`.github/ISSUE_TEMPLATE/` exists in this repo. Those forms are the section contract - follow their headings verbatim, or pass `--template <name>`.');
}

if (!has('--milestone', '-m')) {
  gaps.push('No `--milestone`. The standard makes it required; read the repo\'s own list with `gh api "repos/$REPO/milestones" --jq \'.[].title\'`.');
}

if (!has('--label', '-l')) {
  gaps.push('No `--label`. One surface, one type (`bug`, `enhancement`, `documentation`), then domain as needed; read the repo\'s list with `gh label list`.');
}

/* Body shape, only where the repo has not already answered the question with its own
   forms. The four bolded leads are the design/section shape; engineering work leads with
   measured reality under its own headings. Either is a body that was written; neither is a
   sentence typed into --body. */
if (!forms) {
  const body = bodyText();
  if (body !== null && !/(\*\*(Goal|Done when):\*\*|^#{2,3}\s)/m.test(body)) {
    gaps.push('The body carries none of the standard\'s section leads. Design and section work wants `**Goal:**`, `**Context:**`, `**Dev Notes:**`, `**Done when:**`; engineering work leads with measured reality, `file.ts:155` behind each claim, and open questions under their own heading.');
  }
}

if (!gaps.length) pass();

/* --- say it once ----------------------------------------------------------- */

const message = `🟡 [gh-issue] This issue is about to miss the house standard in /nt-dev:issue:

${gaps.map((g) => `  - ${g}`).join('\n')}

Read /nt-dev:issue for the full contract - title, body shape, milestone, labels, project fields, epic parent - then rerun. Silence this repo with NT_DEV_ISSUE_STANDARD=off under \`env\` in .claude/settings.json.`;

if (MODE === 'strict' || !alreadyNudged()) deny(message);
context(message, '🟡 [gh-issue] issue is missing part of the house standard; nudged once already this session');

/* --- helpers --------------------------------------------------------------- */

/* The body as text, from a --body-file this hook can read or an inline --body, or null
   when the command names neither and there is nothing to judge. */
function bodyText() {
  const { readable } = bodyFiles(command, cwd);
  if (readable.length) {
    try {
      return readFileSync(readable[0], 'utf8');
    } catch {
      return null;
    }
  }
  const inline = command.match(/(^|\s)(--body|-b)[=\s]+("([^"]*)"|'([^']*)')/);
  return inline ? (inline[4] ?? inline[5] ?? '') : null;
}

/* One nudge per session. The marker is a file in the OS temp dir keyed by the session id,
   because a hook is a fresh process every time and has nowhere else to remember. A session
   id this hook never got means no marker and no memory, which errs toward nudging. */
function alreadyNudged() {
  if (!sessionId) return false;
  const marker = join(tmpdir(), `nt-dev-issue-nudge-${sessionId.replace(/[^\w-]/g, '')}`);
  if (existsSync(marker)) return true;
  try {
    writeFileSync(marker, '');
  } catch {
    /* No temp dir to write is not a reason to refuse a command; it just means the nudge
       repeats. */
  }
  return false;
}
