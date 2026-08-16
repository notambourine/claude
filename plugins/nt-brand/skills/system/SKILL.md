---
name: system
description: NoTambourine brand system - colors, type, spacing, component recipes, and voice. Use when building or styling anything NoTambourine-branded (site, landing page, mock, prototype, deck, email, README banner, slide), when asked for "the brand colors"/"brand tokens"/"our pink", or when a design needs to match notambourine.com. Ships tokens.css + components.css to drop straight in.
---

# NoTambourine brand

A boutique skunkworks engineering agency, working as a hands-on operating partner inside
the client's org. The client's growth is capped by their tech: a legacy commerce stack, a
revenue-share SaaS, a roadmap nobody can staff for. **Value creation is the deliverable,
and trust is earned by shipping.** A CEO who wants the culture to change gets that from
work landing in prod, not from a workshop. Scope holds, so the estimate is worth
something. AI at the keyboard is why a small team can price this way; it is not what the
client buys.

The name carries the style, not the positioning. A tambourine is what you add when there
is nothing left to add, so **NoTambourine = no padding**. That is why the design is
confident type, one decisive pink, lots of air, no decoration.

Fuller doctrine is published, so fetch it rather than reconstructing it. Every path below
returns `text/plain` over plain HTTP with no auth, no signup, and no redirect - `curl` or
`wget` one directly. This file stands alone when the machine is offline.

| Fetch | For |
|---|---|
| `notambourine.com/llms.txt` | The index. Start here when you do not know which file you want. |
| `notambourine.com/AGENTS.md` | What the firm does, who it serves, and the citation rules. |
| `notambourine.com/SOUL.md` | What NoTambourine believes. The beliefs this design serves. |
| `notambourine.com/CULTURE.md` | How the team works. Async-first, one operator per workstream. |
| `notambourine.com/experiment-velocity.md` | The Experiment Velocity Planner: inputs, model, scenario-URL format. |

`SOUL.md` and `CULTURE.md` are public cuts of longer internal documents, so absence from
them is not evidence of anything. Client material is unpublished and stays that way -
`robots.txt` disallows `/reports/` and `/pog/` for every agent.

## Use the files

Two files cover ~80% of any build. Copy them next to your output, or inline them.

| File | What it does |
|---|---|
| `tokens.css` | Every token as a CSS var, plus base element styles. Load first and `h1`, `p`, `a`, `code`, `.eyebrow`, `.display`, `.lede` all come styled. |
| `components.css` | `.nt-btn`, `.nt-badge`, `.nt-chip`, `.nt-input`, `.nt-card`, `.nt-nav`, `.nt-switch`/`.nt-check`/`.nt-radio`. All `var()`-based. |
| `fonts/` | Six woff2: Nunito, Hanken Grotesk, JetBrains Mono, roman and italic each. Latin subset, variable, SIL OFL 1.1 (`fonts/OFL.txt`). |
| `hello-world.html` | Working page using both stylesheets. Start here for a mock; open it to eyeball the brand. |

```html
<link rel="stylesheet" href="tokens.css">
<link rel="stylesheet" href="components.css">
```

**Copy the whole skill directory, not the two stylesheets.** `tokens.css` declares
its own `@font-face` blocks against `./fonts/`, so type is wired up with no network
and no third party - a mock renders on brand from `file://` on a plane. Those paths
resolve against the CSS file, so inlining `tokens.css` into a `<style>` block instead
means `fonts/` has to sit beside the HTML.

Never swap that for a Google Fonts `@import`. It sends the visited URL to Google as a
`Referer` and blocks a self-only CSP, which is why the site deleted its own. A mock is
the artifact most likely to graduate into a real page, so it carries the same rule.

## Non-negotiables

These are the rules that get broken. Check your output against them.

- **Dark by default.** Page is `var(--bg)` (#0B0B0C), cards `var(--bg-card)` (#141416).
  Pure white is never a surface. `class="theme-light"` is opt-in and rare - print, a press
  page, a one-off email.
- **One pink.** `#E75A7C` is the only accent. One pink CTA per screen. Mint (`#58C9B9`) is
  structural - borders, status dots, supporting icons - **never** a CTA.
- **No gradients.** Not on sections, not on buttons, not on heroes. One radial halo behind
  a hero wordmark is the sole exception, and it must read as lighting.
- **No stock photography, no AI imagery, no hand-drawn textures.** Imagery is flat,
  geometric, two-color. Ask for real assets before papering over.
- **Pill buttons** (`--r-pill`), 14px cards (`--r-md`). Never mix a sharp and a round
  corner in one component.
- **No colored-left-border cards.** Full borders, not stripes.
- **Press scales to 0.97, hover does not move.** Hover darkens fill or lifts shadow. No
  translate, no scale on hover, no parallax, no looping animation.
- **No emoji in UI chrome, no icon fonts.** Icons are Lucide SVG, 1.75px stroke, rounded
  caps - 20px in nav/buttons, 24px in features, 16px in inputs.
- **The wordmark is `notambourine` set in Nunito 800**, as SVG `<text>` - live text, not
  a traced path. `--font-wordmark` exists for the lockup and nothing else; a heading that
  reaches for it is a bug. A distributable `logo.svg` inlines a ten-glyph Nunito subset as
  a data URI, because SVG-as-image is a sandbox that fetches no font at all - so that file
  works as an `<img>`, in email, and in Figma.
- **One pink word per headline**, via `<em>` - pink *and* italic. Hanken Grotesk ships a
  drawn italic, so emphasis carries both and never a browser-faked skew.
- **Every interactive element keeps a visible focus ring.** `tokens.css` ships it
  (2px accent, 4px offset). Don't `outline: none` without replacing it.

## Voice

Concise, warm, playful - in that order.

- **Register follows the artifact.** Site and marketing copy says **you** to the reader.
  A client deliverable (deck, plan, README) says **we**, meaning the client's org with us
  inside it. A proposal or SOW names the parties. Never "I".
- **A client deliverable does not sell.** No logo wall, no team slide, no methodology.
  Explain the client's own system back to them and let the restraint be the credential.
- **Proof is a count, not an adjective.** Use the client's own numbers, before and after.
  Reach for an adjective only where no number exists.
- **Name the mess without blaming anyone for it.** The client lived every decision that
  built it. Copy that indicts them loses the room.
- **Sentence case everywhere** - headlines, buttons, nav, labels. "Get started", not
  "Get Started". The wordmark is lowercase `notambourine`.
- **ALL CAPS has one job:** the pink eyebrow above a heading, tracked `+0.08em`. Never a
  button, never body.
- Five to twelve word sentences. No throat-clearing, no superlatives, no exclamation
  marks in body.
- **ASCII punctuation, with one unicode exception.** Hyphen, straight quote, straight
  apostrophe. No em dash, no en dash, no curly quote, no single-character ellipsis. The
  site source ships zero of each, and an em dash is the most reported AI tell in
  marketing copy. The interpunct stays, because the brand uses it as a separator:
  `Tom Fuertes · Principal · NoTambourine`.
- **Yes:** "Senior engineers. No tambourine." · "Two engineers, six weeks, one shipped
  feature." · "Tell us what you're building. We'll write back the same day."
- **No:** "Unlock your team's full potential with our proven 7-phase framework!" ·
  "results-driven, agile-first, AI-powered engineering studio"

### Public copy carries no AI tells

Read anything a stranger sees for these tells: hero, section body, email, deck,
proposal, README. NoTambourine sells the absence of padding, so padded copy argues
against the pitch. Four tells land hardest in consultancy copy:

- Puffery adjectives. "Boutique" is specific and true; "proven", "world-class",
  "results-driven", "battle-tested" are not. Cut the adjective and keep the number.
- Importance-flagging. "This matters." "Speed is not a footnote." Show the consequence
  instead.
- The participle tail. "We ship in six weeks, ensuring your roadmap stays on track." Cut
  at the comma.
- Grandiose scope. "changes how you build", "the future of engineering". Scope it to a
  claim a client could hold you to.

Three brand fixtures read as tells and must survive the read:

- **"Senior engineers. No tambourine."** A tailing negation plus a two-beat fragment,
  both tells on their own. The line carries the name and the positioning, so it stays.
- **A three-item line whose items are facts.** "Two engineers, six weeks, one shipped
  feature" spends all three slots on numbers. A three-item line spending them on
  adjectives is the tell.
- **The single pink `<em>` in a headline.** Typographic emphasis, not the boldface tic.

## Type and layout

- **Headings** Hanken Grotesk 700, negative tracking - a serif holds a headline at 400
  and a sans goes limp, so the weight is what reads as deliberate. 800 is the hero's, so
  `.display` stays distinct from an ordinary `h1`. **Wordmark** Nunito 800, untracked,
  the lockup only. **Accent** JetBrains Mono 600 for eyebrows, buttons, badges, nav.
  **Body and mono** JetBrains Mono 400. Monospace body is the practitioner signal; it is
  the point, not an accident. Every face is variable across its full axis, so no weight
  here is ever synthesized.
- **The rounded wordmark carries the play; the headings stay sober.** The reader is a PE
  operating partner, so only the lockup gets to be warm.
- Body runs `1.7` leading and `+0.01em` tracking. Monospace at a sans's 1.55 reads cramped.
- Tracking tightens as size grows: `--ls-display` (-0.02em) is the floor, and hero type
  above ~56px wants -0.03em. Zero on body, +0.08em on ALL-CAPS eyebrows.
- `text-wrap: balance` on headings, `pretty` on paragraphs. Always.
- Body copy is a single column, max ~640px. Never full-viewport.
- Card grids are 2 or 3 columns, single on mobile. Never 4.
- 4pt grid. `--sp-16` between big blocks, `--sp-6` inside a card, `--sp-2` label-to-field.
  When unsure, add room.
- The nav is the only sticky element. No sticky CTAs, chat bubbles, or cookie banners.

## Where truth lives

**This skill is the golden set.** `tokens.css` and `components.css` here are the brand's
only corrected copy. Read a value from this file, correct a value in this file, and never
sync one in. Anything that disagrees with it is downstream and stale, however it renders.

This skill is the complete system, so nothing has to be looked up elsewhere. It carries
both themes: dark surfaces by default, and the light primitives behind `.theme-light`
(`--nt-ink`, `--nt-white`, `--nt-line`, the pink and mint tints, `--nt-paper-warm`).
A shipping surface may render dark only. That is a choice it made, not a shorter system.

Both stylesheets are native CSS with no build step, so they load into a plain HTML file,
a Worker, an email template, or a React app unchanged. Write against the semantic layer -
`--bg`, `--bg-card`, `--fg1`/`2`/`3`, `--accent`, `--accent-fg`, `--support`, `--line`,
`--sp-*`, `--r-*`, `--shadow-*`, `--ring-accent`, `--font-*`. It is the stable API and it
survives a theme swap. The `--nt-*` primitives beneath it are the raw palette; reach past
the alias to one only when no alias covers what you need, and never inline a literal
color - `.theme-light` only works because no component hardcodes one.

Decks have their own grammar: numbered eyebrow → lowercase display headline with one
pink `<em>` word → short body → ALL-CAPS sublabel → typographic concept diagram → running
footer. Every "image" is a diagram built from the same tokens. No photography, no icons
standing in for a chart.
