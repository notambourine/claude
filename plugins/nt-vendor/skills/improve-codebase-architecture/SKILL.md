---
name: improve-codebase-architecture
description: Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick.
disable-model-invocation: true
---
<!-- vendored: mattpocock/skills@fcf0071 skills/engineering/improve-codebase-architecture (MIT). -->

# Improve architecture

Load `nt-vendor:codebase-design`; use its terms exactly. Read `CONTEXT.md` and relevant
ADRs. Scope to user direction or git hot spots. Spawn one explorer. Seek shallow modules,
scattered concepts, leaked seams, missing locality, and poor interface tests. Apply deletion
test.

Write unique `architecture-review-<timestamp>.html` in OS temp. Tailwind and Mermaid CDN.
Open using platform command; report path. Follow [HTML-REPORT.md](HTML-REPORT.md).

Each candidate: files, problem, solution, locality/leverage/test wins, before/after visual,
strength (`Strong`, `Worth exploring`, `Speculative`). Mark real ADR conflict. Finish with
one top recommendation. Do not propose interfaces. Ask which candidate to explore.

After selection, use grilling for constraints, dependencies, seam, tests. Update
`CONTEXT.md` immediately for new or sharpened durable terms. Offer ADR only for a rejected
candidate's load-bearing durable reason. For interface alternatives, use codebase-design's
parallel design-it-twice pattern.
