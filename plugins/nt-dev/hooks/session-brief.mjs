#!/usr/bin/env node
/* Keep low-use nt-dev skills discoverable without repeating routing prose in every
   description. Emit only in repos, where every named skill can act. */
import { brief, pass, rawPayload, repoRoot } from './lib/hook.mjs';

if ((process.env.NT_DEV_BRIEF ?? '').trim().toLowerCase() === 'off') pass();

const payload = rawPayload();
if (!payload) pass();

const cwd = typeof payload.cwd === 'string' && payload.cwd ? payload.cwd : process.cwd();
if (!repoRoot(cwd)) pass();

/* Descriptions already state outcomes. This brief carries only shared conventions and
   publication limits. */
brief(
  'Use nt-dev skills by name in this repo. /nt-dev:commit writes `scope: description` ' +
    'subjects instead of Conventional Commits. /nt-dev:pr and /nt-dev:issue use the repo ' +
    'template, default to drafts, and never publish without a request. /nt-dev:recall ' +
    'recovers prior-session context. /nt-dev:cleanup audits checked-in context and Claude ' +
    'config. /nt-dev:eod-update drafts the Slack end-of-day note.',
);
