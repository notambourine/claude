# Architecture report

Single HTML file. Tailwind CDN. Mermaid 11 ESM CDN. Static otherwise.

Header: repo, date, legend only. Candidate card:

- short deepening title;
- strength badge plus dependency category;
- monospaced files;
- side-by-side before/after visual;
- one-sentence problem and solution;
- wins of at most six words;
- one-line ADR warning when needed.

Choose visuals by relation: Mermaid graph/sequence; positioned boxes/arrows; stacked
cross-section; interface/implementation mass; collapsed call graph. About 320px high.

Style: stone/slate, generous whitespace, one emerald/indigo accent, red leakage, amber
warning. Editorial, not dashboard. End with candidate name, one-sentence top rationale,
anchor.

Use only: module, interface, implementation, depth, deep, shallow, seam, adapter, leverage,
locality. Avoid component, service, unit, API, signature, boundary, layer, wrapper. Diagrams
carry meaning. No intro, hedging, generic maintenance claims, or explanatory paragraphs.
