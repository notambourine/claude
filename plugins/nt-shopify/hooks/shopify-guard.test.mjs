/* Decision table for the shopify-guard PreToolUse hook.

   Run: npm test

   Every case lives here rather than on a command line, so the raw verbs a guard refuses
   never appear in text some other hook inspects.
*/
import { match, ok, strictEqual } from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const HOOK = join(HERE, 'shopify-guard.mjs');

/* A directory with no shopify.theme.toml, so the environment belt stays out of every case
   that is not about it. */
const BARE = mkdtempSync(join(tmpdir(), 'nt-shopify-'));
after(() => rmSync(BARE, { force: true, recursive: true }));

function run(name, tool_input, { env = {}, root = BARE } = {}) {
  const result = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({ cwd: root, tool_name: name, tool_input }),
    encoding: 'utf8',
    env: { ...process.env, NT_SHOPIFY_GUARD: '', CLAUDE_PROJECT_DIR: root, ...env },
  });
  strictEqual(result.status, 0, `hook exited ${result.status}: ${result.stderr}`);
  const out = result.stdout.trim();
  return out ? JSON.parse(out) : null;
}

const bash = (command, opts) => run('Bash', { command }, opts);
const mcp = (op) => run(`mcp__claude_ai_Shopify__${op}`, {});
const denial = (r) => r?.hookSpecificOutput?.permissionDecision === 'deny'
  && r.hookSpecificOutput.permissionDecisionReason;
const allowed = (r) => strictEqual(r, null);

describe('theme verbs it refuses', () => {
  for (const command of [
    'shopify theme push',
    'shopify theme push --development --theme 123',
    'shopify theme push --development --publish',
    'shopify theme:push --live',
    'shopify theme push -d', // short -d does not satisfy the long-flag requirement
    'npx shopify theme push --development-context pr-9', // context without --development
    'shopify theme dev -t 123',
    'shopify theme dev -nt 123', // short flag inside a cluster
    'shopify theme dev --allow-live',
    'shopify theme publish',
    'shopify theme duplicate',
    'shopify theme delete -f',
    'shopify theme share',
    'shopify theme rename --name x',
    'shopify theme frobnicate', // unknown verb fails closed
    'shopify theme metafields push', // future subcommand fails closed
    './node_modules/.bin/shopify theme publish',
    '@shopify/cli@4.4.0 theme publish',
  ]) {
    it(command, () => ok(denial(bash(command)), `expected a deny for: ${command}`));
  }
});

describe('theme verbs it allows', () => {
  for (const command of [
    'shopify theme dev',
    'shopify theme dev --live-reload full-page',
    'shopify theme dev --theme-editor-sync', // --theme-editor-sync is not --theme
    'shopify theme push --development --development-context pr-9 --json',
    'shopify theme push --development --ignore "node_modules/*"',
    'shopify theme pull --live', // pulling production down is how the work starts
    'shopify theme pull -t 123',
    'shopify theme check --fail-level=error',
    'shopify theme list',
    'shopify theme metafields pull',
    'shopify theme:metafields:pull',
    'ls -la && shopify theme push --development', // judged per segment
    'echo done',
    'git push origin sandbox',
  ]) {
    it(command, () => allowed(bash(command)));
  }
});

describe('flags smuggled through the environment', () => {
  for (const command of [
    'SHOPIFY_FLAG_LIVE=1 shopify theme push --development',
    'export SHOPIFY_FLAG_THEME=123',
    'SHOPIFY_FLAG_ALLOW_LIVE=1 npm run safe-push',
  ]) {
    it(command, () => ok(denial(bash(command)), `expected a deny for: ${command}`));
  }

  for (const command of [
    'grep -rn SHOPIFY_FLAG_STORE .github/workflows', // a name without an assignment
    'SHOPIFY_FLAG_STORE=example.myshopify.com shopify theme dev',
    'SHOPIFY_FLAG_THEME_EDITOR_SYNC=1 shopify theme dev',
  ]) {
    it(command, () => allowed(bash(command)));
  }
});

describe('app verbs', () => {
  for (const command of [
    'shopify app deploy',
    'shopify app deploy --no-release', // still creates an app version
    'shopify app release --version 3',
    'shopify app config push',
    'shopify app webhook trigger',
    'shopify app frobnicate',
    'shopify app env set FOO=1',
  ]) {
    it(`refuses ${command}`, () => ok(denial(bash(command)), `expected a deny for: ${command}`));
  }

  for (const command of [
    'shopify app dev',
    'shopify app dev clean',
    'shopify app build',
    'shopify app info --json',
    'shopify app logs',
    'shopify app versions list',
    'shopify app generate extension',
    'shopify app function build',
    'shopify app env show',
    'shopify app env pull',
    'shopify app config link',
    'shopify app config use staging',
  ]) {
    it(`allows ${command}`, () => allowed(bash(command)));
  }
});

describe('store verbs', () => {
  for (const command of [
    'shopify store execute --allow-mutations --file mutation.graphql',
    'shopify store bulk execute --allow-mutations',
    'shopify store delete --store x.myshopify.com',
    'shopify store copy --from a --to b',
    'shopify store import --file products.jsonl',
    'shopify store frobnicate',
  ]) {
    it(`refuses ${command}`, () => ok(denial(bash(command)), `expected a deny for: ${command}`));
  }

  for (const command of [
    'shopify store execute --file query.graphql', // read-only, no --allow-mutations
    'shopify store bulk execute --file query.graphql',
    'shopify store list',
    'shopify store schema',
    'shopify store export --file out.jsonl',
  ]) {
    it(`allows ${command}`, () => allowed(bash(command)));
  }
});

describe('hydrogen verbs', () => {
  for (const command of [
    'shopify hydrogen deploy',
    'shopify hydrogen deploy --preview', // a preview environment still lives on Oxygen
    'npx shopify hydrogen deploy --force',
    'shopify hydrogen:deploy',
    'shopify hydrogen env push',
    'shopify hydrogen customer-account-push',
    'shopify hydrogen frobnicate',
  ]) {
    it(`refuses ${command}`, () => ok(denial(bash(command)), `expected a deny for: ${command}`));
  }

  for (const command of [
    'shopify hydrogen dev',
    'shopify hydrogen build',
    'shopify hydrogen preview',
    'shopify hydrogen check routes',
    'shopify hydrogen codegen',
    'shopify hydrogen setup',
    'shopify hydrogen link',
    'shopify hydrogen env list',
    'shopify hydrogen env pull',
    'shopify hydrogen list',
    'shopify hydrogen upgrade',
  ]) {
    it(`allows ${command}`, () => allowed(bash(command)));
  }
});

describe('topics it has no opinion about', () => {
  for (const command of [
    'shopify version',
    'shopify auth logout',
  ]) {
    it(command, () => allowed(bash(command)));
  }
});

describe('the Shopify MCP tools', () => {
  for (const op of [
    'graphql_mutation',
    'update-product',
    'create-product',
    'bulk-update-product-status',
    'create-collection',
    'update-collection',
    'add-to-collection',
    'create-discount',
    'set-inventory',
    'apply-future-write-tool', // unknown fails closed, same as the CLI verbs
  ]) {
    it(`refuses ${op}`, () => ok(denial(mcp(op)), `expected a deny for: ${op}`));
  }

  for (const op of [
    'get-product',
    'get-order',
    'get-shop-info',
    'get-inventory-levels',
    'list-orders',
    'list-customers',
    'search_products',
    'search_collections',
    'search_docs_chunks',
    'find-sample-product',
    'graphql_query',
    'graphql_schema',
    'validate_graphql_codeblocks',
    'run-analytics-query',
    'switch-shop',
  ]) {
    it(`allows ${op}`, () => allowed(mcp(op)));
  }

  /* The docs server holds no store credential, so every tool it ships is a read. */
  for (const op of [
    'learn_shopify_api',
    'search_docs_chunks',
    'fetch_full_docs',
    'introspect_graphql_schema',
    'validate_graphql_codeblocks',
    'validate_theme',
    'validate_theme_codeblocks',
    'validate_component_codeblocks',
  ]) {
    it(`allows the docs server's ${op}`, () => allowed(run(`mcp__shopify-dev-mcp__${op}`, {})));
  }

  it('leaves another vendor\'s MCP tools alone', () => {
    allowed(run('mcp__claude_ai_Asana__create_tasks', {}));
  });
});

describe('the environment belt', () => {
  const root = mkdtempSync(join(tmpdir(), 'nt-shopify-toml-'));
  after(() => rmSync(root, { force: true, recursive: true }));
  const toml = (body) => writeFileSync(join(root, 'shopify.theme.toml'), body);

  it('allows -e when the toml names only a store', () => {
    toml('[environments.dev]\nstore = "x.myshopify.com"\n');
    allowed(bash('shopify theme dev --environment=dev', { root }));
  });

  it('refuses -e when the toml pins a theme', () => {
    toml('[environments.dev]\nstore = "x.myshopify.com"\ntheme = "123"\n');
    ok(denial(bash('shopify theme dev --environment=dev', { root })));
    ok(denial(bash('shopify theme push --development -e dev', { root })));
  });

  it('does not consult the toml without -e', () => {
    toml('[environments.dev]\nstore = "x.myshopify.com"\ntheme = "123"\n');
    allowed(bash('shopify theme push --development', { root }));
  });
});

describe('the off switch', () => {
  it('NT_SHOPIFY_GUARD=off', () => {
    allowed(bash('shopify theme publish', { env: { NT_SHOPIFY_GUARD: 'off' } }));
  });

  it('a payload it does not understand', () => {
    allowed(run('Bash', {}));
  });
});
