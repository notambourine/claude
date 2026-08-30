---
name: audit-codebase
description: Read-only whole-codebase audit for simplifications in data structures, state representation, control flow, algorithms, and ownership. Inventories every subsystem as a coverage contract, reviews each one in a bounded subagent, verifies each finding against the repo, then audits its own coverage. Never edits, runs tests, commits, or pushes. Use for "audit this codebase", "find simplifications", or a pre-refactor survey.
disable-model-invocation: true
---
<!-- vendored: aarondfrancis/8735edb@959a2a9 audit-your-codebase.md (unstated). -->

# Codebase audit

Read-only. No edits, tests, commits, pushes.

Inventory every subsystem: stable ID, exact boundary, implementation, public interfaces,
callers, tests, status (`queued`, `review`, `recommend`, `skip`). Include product,
infrastructure, bridges, generated-contract ownership, tests, tooling. Keep one canonical
scratchpad for coverage, findings, skips, patterns, duplicates, priorities, dependencies,
log.

Assign fresh read-only agents non-overlapping subsystems. At most two material
simplifications each. Inspect implementation, interface, callers, tests. Seek invalid state,
repeated shape assumptions, duplicated branching, unclear ownership, repeated scans, and
contradictory lifecycle/async state. Prefer clear local code. Reject style-only,
hypothetical, tiny, or complexity-moving abstractions.

Each result:

1. recommend/skip;
2. exact file/line evidence;
3. current complexity or invalid states;
4. simpler representation;
5. smallest scope and interfaces;
6. regression/migration risk;
7. validation;
8. confidence.

Coordinator verifies every result. Narrow, demote, deduplicate, or reject weak findings.
Record skips. Continue until every row closes.

Final independent audits: coverage, overlap, materiality, schema, priority/dependencies.
Rank by impact, confidence, effort, blast radius, prerequisites. Name first slices. Finish
only with full coverage, complete evidence, explicit skips, coherent priorities, unchanged
repo.
