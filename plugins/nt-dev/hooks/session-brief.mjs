#!/usr/bin/env node
/* Names the nt-dev set once per session so its skills do not each have to buy the
   naming with description bytes.

   A skill description is charged on every turn of every session, and plugin descriptions
   are dropped when the listing exceeds its budget, ranked by recency-weighted usage. That
   ranking drops `recall` and `cleanup` first - the two a reader is least likely to know
   exist. This brief carries the routing prose instead, so each description shrinks to its
   outcome and the low-use members stay findable.

   KEY-DECISION 2026-08-28: gate on a git repo, and emit nothing outside one. A description
   is unconditional; a hook is code, and that is the only structural advantage it has here.
   Every skill in the set acts on a repository, so a session with no repo is a session where
   the whole brief is dead weight. The token case rests on this gate: in-repo the brief and
   the trimmed descriptions together run about 200 chars under the old descriptions, which
   alone would not pay for a hook.

   Deliberately NOT paired with `disable-model-invocation`. That flag removes the skill from
   the listing entirely, and a brief naming a skill the model cannot call is worse than no
   brief - it reads as an available action and fails at the Skill call. The skills stay
   model-invocable with terse descriptions; this only replaces their trigger prose.

   Config, via `env` in a repo's .claude/settings.json or the user's:
     NT_DEV_BRIEF=off   emit nothing
*/
import { brief, pass, rawPayload, repoRoot } from './lib/hook.mjs';

if ((process.env.NT_DEV_BRIEF ?? '').trim().toLowerCase() === 'off') pass();

const payload = rawPayload();
if (!payload) pass();

const cwd = typeof payload.cwd === 'string' && payload.cwd ? payload.cwd : process.cwd();
if (!repoRoot(cwd)) pass();

/* One line per skill, outcome omitted: the description already carries that, and repeating
   it here would spend the bytes this brief exists to save. What a description cannot say is
   which convention the skill enforces and that two of them never publish unasked. */
brief(
  'nt-dev house standards for this repo - invoke by name, do not improvise: ' +
    '/nt-dev:commit writes `scope: description` subjects, not Conventional Commits. ' +
    '/nt-dev:pr and /nt-dev:issue fill the repo template, draft by default, never post ' +
    'unasked. /nt-dev:recall recovers prior-session context. /nt-dev:cleanup audits ' +
    'checked-in context and Claude config. /nt-dev:eod-update drafts the Slack ' +
    'end-of-day note.',
);
