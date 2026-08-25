#!/usr/bin/env node
/* Refuses a Shopify call that can write to a live storefront.

   The writable surface a theme engineer needs is a development theme, and every Theme
   Access token that reaches a laptop is a token for the production store. So this hook is
   default-deny: `shopify theme dev`, `shopify theme push --development`, and the read-only
   verbs pass; a verb it does not recognize is refused. Same shape for `app`, `store`, and
   `hydrogen`, where `deploy` is the store-facing write.

   KEY-DECISION 2026-08-25: allowlist the verbs, never denylist them. A denylist of
   push/publish/delete is correct only until the CLI ships a verb nobody here has read
   about, and the cost of the two failures is not symmetric: a refused call is one `!`
   away, an unpublished theme going live is a store outage.

   KEY-DECISION 2026-08-25: judge each command segment on its own. `ls -la && shopify theme
   push --development` is one Bash payload, and matching over the whole string lets a flag
   in one segment answer for a verb in another.

   KEY-DECISION 2026-08-25: the MCP tools are the same store. `graphql_mutation`,
   `set-inventory`, and `update-product` write to production with no CLI in the path, so a
   guard that matches only `Bash` guards half the door. Same allowlist shape: the read verbs
   pass by name, everything else is refused.

   Matching is loose over the raw command text, so a commit message quoting a blocked verb
   trips it too. That is the intended trade: a miss is expensive, a false positive is one
   `!` away.

   Config, via `env` in a repo's .claude/settings.json or the user's:
     NT_SHOPIFY_GUARD=off   do nothing
*/
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

if ((process.env.NT_SHOPIFY_GUARD ?? '').trim().toLowerCase() === 'off') pass();

const payload = rawPayload();
if (!payload) pass();

/* --- what passes ---------------------------------------------------------- */

/* Reads pass by name. Anything else is a write until someone reads it and says otherwise,
   which is what keeps a tool added upstream next month from arriving pre-approved. */
const MCP_READ = /^(?:get|list|search|find|read|fetch)[-_]/;
const MCP_READS = new Set([
  'graphql_query',
  'graphql_schema',
  'validate_graphql_codeblocks',
  'run-analytics-query',
  'switch-shop',
]);

/* Flags smuggled in as environment, where argv never carries them. The assignment shape is
   the match, so grepping the workflows for one of these names does not trip. */
const SMUGGLED = /SHOPIFY_FLAG_(?:THEME(?:_ID)?|LIVE|ALLOW_LIVE|UNPUBLISHED|PUBLISH)=/;

/* Read-only, or local-only. `pull` is here on purpose: pulling the live theme down is how
   the work starts. */
const THEME_READ = new Set([
  'check', 'list', 'info', 'open', 'package', 'init', 'console', 'language-server', 'profile', 'pull',
]);

/* Local build, scaffolding, and inspection. `deploy`, `release`, `import-extensions`, and
   `webhook trigger` are absent deliberately: each one reaches the partner org or the store.
   A cart-transform or pricing function runs in live checkouts, so shipping an app version
   is a production change even when no theme file moves. */
const APP_LOCAL = new Set([
  'info', 'build', 'init', 'generate', 'logs', 'versions', 'function', 'dev', 'demo',
]);

/* Reads, and writes to the local disk. `copy`, `import`, `create`, and `delete` are absent:
   each one moves or removes store data. */
const STORE_READ = new Set(['list', 'schema', 'export']);

/* Local build, scaffolding, and auth. `deploy` is absent deliberately: it ships a build to
   Oxygen, and without `--preview` that build is the live storefront. `env push` writes the
   Oxygen variables and `customer-account-push` writes the admin's callback URLs, so both
   fall through with it. */
const HYDROGEN_LOCAL = new Set([
  'init', 'dev', 'build', 'preview', 'check', 'codegen', 'setup', 'shortcut', 'debug', 'list',
  'login', 'logout', 'generate', 'upgrade', 'link', 'unlink',
]);

/* --- the call in hand ----------------------------------------------------- */

const tool = payload.tool_name ?? '';
const input = payload.tool_input ?? {};

if (tool.startsWith('mcp__') && /shopify/i.test(tool)) mcpCall(tool);

const command = typeof input.command === 'string' ? input.command : '';
if (!command) pass();
for (const segment of command.split(/[;&|\n]+/)) inspect(segment);
pass();

/* --- the MCP tools -------------------------------------------------------- */

function mcpCall(name) {
  const op = name.split('__').pop() ?? '';
  if (MCP_READ.test(op) || MCP_READS.has(op)) pass();
  deny(`\`${op}\` writes to the connected Shopify store, which is production.

Read the data with a read tool (\`get-*\`, \`list-*\`, \`search_*\`, \`graphql_query\`) and
report what the change would be. A human applies it in the admin, or runs the tool
themselves in the prompt with a leading \`!\`.`);
}

/* --- the CLI -------------------------------------------------------------- */

function inspect(segment) {
  if (!segment.trim()) return;

  if (SMUGGLED.test(segment)) {
    deny(`A \`SHOPIFY_FLAG_*\` assignment is targeting a live, specific, or published theme.

Theme targeting has to be visible in the command. Drop the assignment, or run it yourself
in the prompt with a leading \`!\`.`);
  }

  const call = parse(segment);
  if (!call) return;
  if (call.topic === 'theme') themeCall(call, segment);
  if (call.topic === 'app') appCall(call);
  if (call.topic === 'store') storeCall(call, segment);
  if (call.topic === 'hydrogen') hydrogenCall(call);
}

/* The CLI invocation in one segment: direct, through npx, out of node_modules/.bin, pinned
   to a version, and with the colon form of the subcommand folded into the space form. Flags
   drop out before the positionals are read, so `theme --verbose push` still reads as push. */
function parse(segment) {
  /* Quotes, `$(`, and backticks count as a boundary: `sh -c "shopify theme publish"` is the
     same call as the bare one. */
  const at = /(?:^|[\s/"'`(=])(?:shopify|@shopify\/cli)(?:@\S+)?[\s:]+(.*)$/.exec(segment);
  if (!at) return null;
  const words = at[1].split(/[\s:]+/).filter((word) => word && !word.startsWith('-'));
  return words.length ? { topic: words[0], verb: words[1] ?? '', sub: words[2] ?? '' } : null;
}

function themeCall({ verb, sub }, segment) {
  if (THEME_READ.has(verb)) return;

  /* Exactly `metafields pull`. A future `metafields push` has to fail closed. */
  if (verb === 'metafields') {
    if (sub === 'pull') return;
    deny(`\`shopify theme metafields ${sub || '<none>'}\` is not \`metafields pull\`, the only form allowed.`);
  }

  if (verb === 'dev') {
    if (/(?:--theme|--allow-live)(?:[=\s]|$)/.test(segment) || /(?:^|\s)-[A-Za-z]*[ta]/.test(segment)) {
      deny(`\`shopify theme dev\` is targeting a specific or live theme (\`--theme\`/\`-t\`, \`--allow-live\`/\`-a\`).

Run it bare and let the CLI allocate a development theme.`);
    }
    environmentBelt(segment);
    return;
  }

  if (verb === 'push') {
    if (!/--development(?:[=\s]|$)/.test(segment)) {
      deny(`\`shopify theme push\` is missing \`--development\`, in the long form.

A development theme is the only surface this repo may push to. \`shopify theme push
--development [--development-context <ctx>]\`.`);
    }
    if (/(?:--theme|--live|--allow-live|--unpublished|--publish)(?:[=\s]|$)/.test(segment)
      || /(?:^|\s)-[A-Za-z]*[tlaup]/.test(segment)) {
      deny(`\`shopify theme push --development\` is carrying a live, specific, or published theme flag
(\`--theme\`/\`-t\`, \`--live\`/\`-l\`, \`--allow-live\`/\`-a\`, \`--unpublished\`/\`-u\`, \`--publish\`/\`-p\`).`);
    }
    environmentBelt(segment);
    return;
  }

  deny(`\`shopify theme ${verb || '<none>'}\` is not on the allowlist.

Development themes are the only writable surface: \`shopify theme dev\`, or \`shopify theme
push --development [--development-context <ctx>]\`. Read verbs (\`list\`, \`info\`, \`pull\`,
\`check\`, \`package\`, \`console\`) pass. \`publish\`, \`delete\`, \`share\`, \`rename\`,
\`duplicate\`, \`preview\`, and any verb this hook has not read about are refused.

If you truly intend this, run it yourself in the prompt with a leading \`!\`.`);
}

function appCall({ verb, sub }) {
  if (APP_LOCAL.has(verb)) return;

  /* `config link` and `config use` pick which app the local files describe. `config push`
     writes that description to the partner org. */
  if (verb === 'config') {
    if (sub === 'link' || sub === 'use') return;
    deny(`\`shopify app config ${sub || '<none>'}\` writes the app configuration to the partner org.

\`config link\` and \`config use\` are the local halves and pass.`);
  }

  /* `env pull` writes a local .env; `env show` prints. Neither reaches the org. */
  if (verb === 'env') {
    if (sub === 'show' || sub === 'pull') return;
    deny(`\`shopify app env ${sub || '<none>'}\` is not \`env show\` or \`env pull\`.`);
  }

  deny(`\`shopify app ${verb || '<none>'}\` is not on the allowlist.

\`deploy\` and \`release\` create and promote an app version, \`webhook trigger\` sends a real
webhook, and an unknown verb fails closed. Local work passes: \`dev\`, \`build\`, \`info\`,
\`generate\`, \`logs\`, \`versions\`, \`function\`, \`env show\`/\`env pull\`, \`config link\`/\`config use\`.

If a release is what you mean, run it yourself in the prompt with a leading \`!\`.`);
}

function storeCall({ verb, sub }, segment) {
  if (STORE_READ.has(verb)) return;

  /* `store execute` and `store bulk execute` reach products and inventory through the Admin
     API, past every theme rail above. The flag decides, not the target: without `--store`
     the CLI uses stored auth, so which shop it lands on is unknowable from the command. */
  if (verb === 'execute' || (verb === 'bulk' && sub === 'execute')) {
    if (/(?:^|\s)--allow-mutations(?:[=\s]|$)/.test(segment)) {
      deny(`\`--allow-mutations\` runs an Admin API mutation against a live store.

Read-only \`shopify store execute\` passes. Drop the flag and report what the mutation
would change, or run it yourself in the prompt with a leading \`!\`.`);
    }
    return;
  }

  deny(`\`shopify store ${verb || '<none>'}\` is not on the allowlist.

\`delete\` removes a store, \`copy\` and \`import\` move data into one, and an unknown verb
fails closed. \`list\`, \`schema\`, \`export\`, and a read-only \`execute\` pass.`);
}

function hydrogenCall({ verb, sub }) {
  if (HYDROGEN_LOCAL.has(verb)) return;

  /* `env list` and `env pull` read Oxygen; `env push` writes it. */
  if (verb === 'env') {
    if (sub === 'list' || sub === 'pull') return;
    deny(`\`shopify hydrogen env ${sub || '<none>'}\` is not \`env list\` or \`env pull\`.`);
  }

  deny(`\`shopify hydrogen ${verb || '<none>'}\` is not on the allowlist.

\`deploy\` ships a build to Oxygen, which is the live storefront unless \`--preview\` is set
and a preview is still a production environment. \`env push\`, \`customer-account-push\`, and an
unknown verb fail closed. Local work passes: \`dev\`, \`build\`, \`preview\`, \`check\`, \`codegen\`,
\`setup\`, \`generate\`, \`link\`/\`unlink\`, \`env list\`/\`env pull\`.

If a deploy is what you mean, run it yourself in the prompt with a leading \`!\`.`);
}

/* An environment named with -e/--environment carries its flags in shopify.theme.toml, where
   argv cannot show them, so a theme-targeting key there is the same escalation by another
   route. Only consulted when a command actually selects an environment. */
function environmentBelt(segment) {
  if (!/--environment(?:[=\s]|$)/.test(segment) && !/(?:^|\s)-[A-Za-z]*e/.test(segment)) return;
  const root = process.env.CLAUDE_PROJECT_DIR || payload.cwd || process.cwd();
  let toml = '';
  try {
    toml = readFileSync(join(root, 'shopify.theme.toml'), 'utf8');
  } catch {
    return;
  }
  if (/^[ \t]*(?:theme|live|allow-live|unpublished)[ \t]*=/m.test(toml)) {
    deny(`shopify.theme.toml holds a theme-targeting key (\`theme\`, \`live\`, \`allow-live\`,
\`unpublished\`), and \`-e\`/\`--environment\` would apply it as a flag argv never shows.

Remove the key, or name the store and the development theme on the command line.`);
  }
}

/* --- the harness ---------------------------------------------------------- */

/* Node rather than bash, and self-contained rather than shared with nt-dev: a plugin is
   installed on its own, so it can only read files under its own root. See
   .claude/rules/portable-shell.md for why bash is out. */

function pass() {
  process.exit(0);
}

function deny(reason) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: `[nt-shopify] ${reason}`,
    },
    systemMessage: '\u{1F534} [nt-shopify] refused a call that can write to the live store',
  }));
  process.exit(0);
}

/* fd 0, not '/dev/stdin': the device node does not exist on Windows. A non-blocking pipe
   answers EAGAIN before the writer has filled it, which is not end-of-input, so that one
   errno retries and every other error gives up. */
function readStdin() {
  if (process.stdin.isTTY) return '';
  for (let attempt = 0; attempt < 200; attempt += 1) {
    try {
      return readFileSync(0, 'utf8');
    } catch (err) {
      if (err.code !== 'EAGAIN') return '';
      /* No synchronous sleep in node, and the read has to stay synchronous: an async one
         would let the script fall off the end and exit before the payload arrived. */
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
    }
  }
  return '';
}

function rawPayload() {
  try {
    return JSON.parse(readStdin());
  } catch {
    return null;
  }
}
