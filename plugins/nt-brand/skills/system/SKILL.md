---
name: system
description: NoTambourine brand system - colors, type, spacing, component recipes, voice, and the audit that checks work against them. Use when building or styling anything NoTambourine-branded (site, landing page, mock, prototype, deck, email, README banner, slide), when asked for "the brand colors"/"brand tokens"/"our pink", when a design needs to match notambourine.com, or when checking copy before it ships to a client - wordmark forms, ASCII punctuation, sentence case, and AI tells. Ships tokens.css, components.css, and a Marpit deck theme to drop straight in.
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

`SOUL.md` and `CULTURE.md` are public cuts of longer internal documents, so absence from
them is not evidence of anything. Client material is unpublished and stays that way -
`robots.txt` disallows `/reports/` and `/pog/` for every agent.

## Use the files

Two stylesheets cover ~80% of any build, and a third renders a deck. Copy them next to
your output, or inline them.

| File | What it does |
|---|---|
| `tokens.css` | The whole system in one link: `fonts.css`, `vars.css`, `elements.css`. Load first and `h1`, `p`, `a`, `code`, `.eyebrow`, `.display`, `.lede` all come styled. |
| `vars.css` | Every value as a CSS var, and nothing else. What a surface with its own faces and its own base layer imports. |
| `fonts.css` | The six `@font-face` blocks, pointed at `./fonts/`. |
| `elements.css` | The base element styles: bare `h1`, `p`, `a`, `code` on brand with no classes. |
| `components.css` | `.nt-btn`, `.nt-badge`, `.nt-chip`, `.nt-input`, `.nt-card`, `.nt-nav`, `.nt-switch`/`.nt-check`/`.nt-radio`. All `var()`-based. |
| `deck.css` | Marpit slide theme, 1280x720. Every value a `var()` off `tokens.css`. See "Decks" below for how to feed it markdown. |
| `fonts/` | Six woff2: Nunito, Hanken Grotesk, JetBrains Mono, roman and italic each. Latin subset, variable, SIL OFL 1.1 (`fonts/OFL.txt`). Plus `nunito-wordmark-800.woff2`, a ten-glyph static subset for the lockup alone - 1.5 KB against Nunito's 39 KB, so a PDF or an offline snapshot inlines it as a data URI. |
| `logo/` | The mark, the monogram, the three lockup colorways, the favicon and app tiles, and `export/` rasters cut from them. `scripts/build-logo.py` writes all of it. |
| `hello-world.html` | Working page using both stylesheets. Start here for a mock; open it to eyeball the brand. |

```html
<link rel="stylesheet" href="tokens.css">
<link rel="stylesheet" href="components.css">
```

**Copy the whole skill directory, not the stylesheets alone.** `tokens.css` pulls in
`fonts.css`, which declares `@font-face` against `./fonts/`, so type is wired up with
no network and no third party - a mock renders on brand from `file://` on a plane.
Those paths resolve against the CSS file, so inlining the CSS into a `<style>` block
instead means `fonts/` has to sit beside the HTML.

A surface that already ships its own faces and its own base layer imports `vars.css`
alone. It gets every value and none of the opinions, and there is still one copy of
each number.

Never swap that for a Google Fonts `@import`. It sends the visited URL to Google as a
`Referer` and blocks a self-only CSP, which is why the site deleted its own. A mock is
the artifact most likely to graduate into a real page, so it carries the same rule.

### Fonts on a locked-down surface

Some surfaces cannot load `./fonts/` at all: a claude.ai artifact, an email client, a
README banner. There the faces fall back silently and the brand degrades without a
decision. Make it a decision:

- Inline the face as a data URI in the `@font-face` `src`: `base64 -i fonts/<file>.woff2`
  emits the payload. The wordmark subset is 1.5 KB, so inline it always; a full face runs
  30-40 KB, so inline one only when the surface is worth the bytes.
- Where inlining is not worth it, the fallback stacks in `vars.css` are the brand's
  degraded form: `system-ui` for display, `ui-monospace` for body. Ship them knowingly.
  The Google Fonts rule above holds here too.

## Non-negotiables

These are the rules that get broken. Check your output against them.

- **Dark by default.** Page is `var(--bg)` (#0B0B0C), cards `var(--bg-card)` (#141416).
  Pure white is never a surface. `class="theme-light"` is opt-in and rare - print, a press
  page, a one-off email.
- **One pink.** `#E75A7C` is the only accent. One pink CTA per screen. Mint (`#58C9B9`) is
  structural - borders, status dots, supporting icons - **never** a CTA.
- **No gradients.** Not on sections, not on buttons, not on heroes. One radial halo behind
  a hero lockup is the sole exception, and it must read as lighting.
- **No stock photography, no AI imagery, no hand-drawn textures.** Imagery is flat,
  geometric, two-color. Ask for real assets before papering over.
- **Pill buttons** (`--r-pill`), 14px cards (`--r-md`). Never mix a sharp and a round
  corner in one component.
- **No colored-left-border cards.** Full borders, not stripes.
- **Press scales to 0.97, hover does not move.** Hover darkens fill or lifts shadow. No
  translate, no scale on hover, no parallax, no looping animation.
- **No emoji in UI chrome, no icon fonts.** Icons are Lucide SVG, 1.75px stroke, rounded
  caps - 20px in nav/buttons, 24px in features, 16px in inputs.
- **Never redraw the logo; link a file out of `logo/`.** The lockup is `notambourine` set
  in Nunito 800 beside the tambourine mark. Ship `logo/lockup.svg`, or its `-white` and
  `-ink` reversals. Where the lockup will not fit - an avatar, an app icon, a stamp - use
  `logo/monogram.svg`, the mark with `no` nested in the crescent; `logo/mark.svg` drops
  the letters for a watermark or a bullet. `logo/lockup-text.svg` keeps the wordmark as
  live `<text>` over an inlined ten-glyph Nunito subset - open that one to edit the type,
  and re-run `scripts/build-logo.py` rather than hand-patching an outline.
  `--font-wordmark` exists for the lockup and nothing else; a heading that reaches for it
  is a bug.
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
- **Four wordmark forms, and only four.** `NoTambourine` in every human-facing sentence.
  `notambourine` is the technical slug, correct only in a path, URL, domain, GitHub org,
  npm name, or CSS class. `NoTambourine LLC` is the legal entity and appears twice at most
  in a contract - the signature block and one Definitions anchor - and nowhere else.
  `Notambourine` is not a valid form. The same rules are published for outside agents at
  `notambourine.com/AGENTS.md`, so a disputed flag has a public citation.
- **Sentence case everywhere** - headlines, buttons, nav, labels. "Get started", not
  "Get Started". The lockup renders lowercase.
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
- **The rounded lockup carries the play; the headings stay sober.** The reader is a PE
  operating partner, so only the lockup gets to be warm.
- Body runs `1.7` leading and `+0.01em` tracking. Monospace at a sans's 1.55 reads cramped.
- Tracking tightens as size grows: `--ls-tight` (-0.02em) is the floor, and `--ls-display`
  (-0.03em) is what hero type above ~56px wants. Zero on body, +0.08em on ALL-CAPS eyebrows.
- `text-wrap: balance` on headings, `pretty` on paragraphs. Always.
- Body copy is a single column, max ~640px. Never full-viewport.
- Card grids are 2 or 3 columns, single on mobile. Never 4.
- 4pt grid. `--sp-16` between big blocks, `--sp-6` inside a card, `--sp-2` label-to-field.
  When unsure, add room.
- The nav is the only sticky element. No sticky CTAs, chat bubbles, or cookie banners.

## Audit copy against all of the above

Run this over anything a client or a stranger sees before it ships: deck, proposal, SOW,
cover email, README, landing page, release note. The greps are a first pass that finds
candidates. Every hit needs the rules above to judge it, which is why they live in one
file with them.

```bash
# Wordmark: lowercase in prose, outside code, paths, and URLs
grep -nE '(^|[^/.\-_a-z`])notambourine([^/.\-_a-z`]|$)' <file>

# Sentence case: never a valid form
grep -n 'Notambourine' <file>

# Legal entity, 2x max (signature block + Definitions anchor)
grep -nc 'NoTambourine LLC' <file>

# Em dash, en dash, curly quotes, single-char ellipsis. Interpunct deliberately absent.
perl -CSD -ne 'print "$.:$_" if /[\x{2014}\x{2013}\x{2018}\x{2019}\x{201C}\x{201D}\x{2026}]/' <file>

# Puffery adjectives
grep -niE '\b(proven|world-class|battle-tested|results-driven|cutting-edge|best-in-class|seamless|robust|leverage|synergy|holistic|bespoke)\b' <file>

# Participle tails: cut the sentence at the comma
grep -niE ',\s+(ensuring|enabling|allowing|helping|driving|empowering|delivering|providing)\b' <file>

# Importance-flagging and throat-clearing
grep -niE "\b(this matters|it's worth noting|it is worth noting|needless to say|at the end of the day|in today's)\b" <file>

# Exclamation marks in body, and first person
grep -nE '!(\s|$)' <file>
grep -nE '\bI\b' <file>
```

Perl rather than `grep -P` for the punctuation pass. Stock macOS `grep` is BSD and
rejects `-P`, so that flag only works where someone installed GNU grep. Escapes rather
than literal characters, so this file stays ASCII and never trips its own check.

Across a directory, or a staged diff so a flag lands on work in progress:

```bash
grep -rnE '(^|[^/.\-_a-z`])notambourine([^/.\-_a-z`]|$)' <dir>/ --include='*.md'

git diff --cached | grep -nE '^\+.*[^/.\-_a-z`]notambourine[^/.\-_a-z`]'
git diff --cached | perl -CSD -ne 'print if /^\+.*[\x{2014}\x{2013}\x{2018}\x{2019}\x{201C}\x{201D}\x{2026}]/'
```

Then read for the two tells no grep finds: **grandiose scope**, and a **three-item line
spending its slots on adjectives** rather than numbers. Leave the three fixtures above
alone - they read as tells and stay.

**Ignore:** the slug in frontmatter, paths, URLs, CSS classes, npm names, GH remotes, and
anything inside a code fence or backticks (the wordmark pattern already excludes them). A
puffery word used literally about a thing rather than as a boast - "a robust error path".
`I` inside a quotation, a code identifier, or a name.

**Judge a hit two ways.** For the wordmark: would a client reading this expect the
wordmark or the slug? A path, URL, or identifier is the slug, so ignore it. For
everything else: would cutting this weaken the claim? If the sentence survives the cut,
the words were padding.

## Where truth lives

**`notambourine/brand-kit` is the golden set.** `tokens.css`, `components.css`, and
`deck.css` here are the brand's only corrected copy. Read a value from this file, correct
a value in this file, and never sync one in. Anything that disagrees with it is downstream
and stale, however it renders.

A surface that cannot fetch at runtime pins this repo and reads the bytes out of the
checkout - `share.notambourine.com` serves `tokens.css` and `deck.css` from its own origin,
because a self-only CSP forbids a CDN. A pinned checkout is not a fork: the pin names one
commit, and the consumer's CI fails when a `var()` reads a token this repo stopped
declaring. Correct the value here and bump the pin.

This skill is the complete system, so nothing has to be looked up elsewhere. It carries
both themes: dark surfaces by default, and the light primitives behind `.theme-light`
(`--nt-ink`, `--nt-white`, `--nt-line`, the pink and mint tints, `--nt-paper-warm`).
A shipping surface may render dark only. That is a choice it made, not a shorter system.

Every stylesheet here is native CSS with no build step, so they load into a plain HTML file,
a Worker, an email template, or a React app unchanged. Write against the semantic layer -
`--bg`, `--bg-card`, `--fg1`/`2`/`3`, `--fg-mute`, `--accent`, `--accent-fg`,
`--accent-text`, `--support`, `--line`, `--sp-*`, `--r-*`, `--shadow-*`, `--ring-accent`,
`--font-*`. It is the stable API and it
survives a theme swap. The `--nt-*` primitives beneath it are the raw palette; reach past
the alias to one only when no alias covers what you need, and never inline a literal
color - `.theme-light` only works because no component hardcodes one. A `var()` fallback
is the one place a literal is correct, and `deck.css` uses them: a renderer can receive
that theme without `tokens.css` beside it, and the deck still comes out on brand.

## Decks

Grammar first: numbered eyebrow → lowercase display headline with one pink `<em>` word →
short body → ALL-CAPS sublabel → typographic concept diagram → running footer. Every
"image" is a diagram built from the same tokens. No photography, no icons standing in for
a chart.

`deck.css` is the theme that renders it. Markdown in, slides out, through Marpit: `---`
splits a slide, `<!-- _class: lead -->` centers a title slide, `<!-- paginate: true -->`
turns on slide numbers. Load `tokens.css` on the page too - `deck.css` declares no
`:root`, so it reads its colors and faces from whatever the document root defines, and a
brand correction reaches a deck with no second edit.

`share.notambourine.com` runs this theme in its browser renderer and its PDF export, so a
deck shared from there and a deck built by hand come out the same. It serves these bytes
from a pinned checkout of this repo; correct a value here.
