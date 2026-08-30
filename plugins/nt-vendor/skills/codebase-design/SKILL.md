---
name: codebase-design
description: Shared vocabulary for designing deep modules. Use when the user wants to design or improve a module's interface, find deepening opportunities, decide where a seam goes, make code more testable or AI-navigable, or when another skill needs the deep-module vocabulary.
disable-model-invocation: true
---
<!-- vendored: mattpocock/skills@c0d6901 skills/engineering/codebase-design (MIT). -->

# Codebase design

Design deep modules: much behavior behind a small interface at a clean seam, tested through
that interface.

## Terms

- **Module**: interface plus implementation. Avoid component, service, unit.
- **Interface**: everything callers must know: types, invariants, order, errors, config,
  performance. Avoid API/signature.
- **Implementation**: hidden code.
- **Depth**: behavior per interface concept. Deep: small surface, much behavior. Shallow:
  surface nearly matches implementation.
- **Seam**: location where behavior can change without editing callers. Avoid boundary.
- **Adapter**: concrete interface implementation at a seam.
- **Leverage**: capability gained per interface concept.
- **Locality**: change, bugs, knowledge, tests concentrated.

## Rules

- Reduce methods and parameters; hide complexity.
- Depth belongs to interface, not implementation.
- Internal seams stay private.
- Deletion test: valuable module deletion redistributes complexity to callers.
- Interface is caller and test surface.
- One adapter: hypothetical seam. Two: real seam.
- Inject dependencies.
- Return results over hidden side effects.
- Tests observe interface outcomes, never internals.

Relationships: module owns one interface; depth measures module/interface; seam locates the
interface; adapter satisfies it; depth yields leverage and locality.

Dependencies/testing: [DEEPENING.md](DEEPENING.md). Alternative interfaces:
[DESIGN-IT-TWICE.md](DESIGN-IT-TWICE.md).
