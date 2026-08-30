# Deepening

Classify dependencies:

| Category | Strategy |
| --- | --- |
| In-process | Merge; test new interface directly; no adapter. |
| Local-substitutable | Use local stand-in; keep seam internal. |
| Remote owned | Inject port; production transport adapter plus in-memory test adapter. |
| External | Inject port; production adapter plus mock. |

- One adapter: hypothetical seam. Two: real seam.
- Keep test-only internal seams out of external interface.
- Replace shallow-module tests with interface tests.
- Assert observable outcomes, not internals.
- Tests survive internal refactors.
