---
name: install-anti-slop
description: Install and configure the anti-slop Oxlint plugin in a local TypeScript or JavaScript repository. Use whenever a user asks to add anti-slop lint rules, copy the anti-slop plugin, configure opinionated Oxlint rules, or migrate an existing local anti-slop setup.
disable-model-invocation: true
---
<!-- vendored: dmmulroy/anti-slop@446268e skills/install-anti-slop (MIT). -->

# Install anti-slop

Read instructions; preserve dirty work; detect package manager, Oxlint config, existing
copy. Install:

```bash
node <skill-directory>/scripts/install.mjs [relative-destination]
```

Default: `tools/oxlint/anti-slop/`. Existing destination: compare first; `--force` only
after backup/review.

Query current `oxlint` and `@oxlint/plugins`; install matching dev versions with existing
package manager. Merge, never replace:

```ts
ignorePatterns: [
  ".agent/**", ".agents/**", ".claude/**", ".codex/**", ".continue/**",
  ".cursor/**", ".gemini/**", ".opencode/**", ".pi/**", ".roo/**",
  ".windsurf/**", "tools/oxlint/anti-slop/**",
],
jsPlugins: [{ name: "anti-slop", specifier: "./tools/oxlint/anti-slop/index.ts" }],
```

Add other agent-tool directories; never ignore all dot-directories. Vite+: merge into
`lint.ignorePatterns`, `lint.jsPlugins`, and `fmt.ignorePatterns`.

Enable every bundled `anti-slop/*` rule at `error`.

Run repo lint and typecheck; Vite+: full `vp check`. Report owned-source findings unless
migration/cleanup was requested. Never weaken rules, suppress errors, add unsafe casts, or
launder types. Report destination, versions, config, checks, remaining findings.

Migration: compare old rules/diagnostics. Keep project rules separate. Prefer inference,
`as const`, `satisfies`, named contracts, boundary parsing.
