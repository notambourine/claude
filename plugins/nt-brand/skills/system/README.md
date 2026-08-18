# brand-kit

The NoTambourine brand's golden set: `tokens.css`, `components.css`, `deck.css`, the
font binaries, the logo in `logo/`, and `SKILL.md`, which is the written system behind
them - color, type, spacing, component recipes, and voice.

Correct a brand value here. Every other copy is downstream.

| Link this | To get |
|---|---|
| `tokens.css` | The whole system: the faces, every value, and styled bare HTML. |
| `vars.css` | The values alone, for a surface with its own faces and base layer. |
| `components.css` | `.nt-btn`, `.nt-card`, `.nt-nav`, and the rest, all `var()`-based. |
| `deck.css` | The Marpit slide theme, 1280x720. Load `vars.css` on the page too. |
| `logo/` | The mark, the lockup, the icons, and the rasters cut from them. |

## Logo

`scripts/build-logo.py` holds the mark's path data and the wordmark's type
parameters, and writes every file under `logo/`. It traces the wordmark out of
`fonts/nunito-latin-var.woff2`, so the outlines cannot drift from the face the
stylesheets load. Change the logo by editing that script and re-running it:

```bash
./scripts/build-logo.py    # needs rsvg-convert on PATH
```

The raster half shells out to `rsvg-convert`, which ships in librsvg: `brew
install librsvg` on macOS or Linux, the GTK runtime on Windows. The vector half
runs without it.

### Vector

| File | Use |
|---|---|
| `logo/lockup.svg` | Default. Mark plus wordmark, outlined, so it needs no font. |
| `logo/lockup-white.svg` | On dark, on pink, on a photo. |
| `logo/lockup-ink.svg` | One-color print, fax-grade output, a light background that fights pink. |
| `logo/lockup-text.svg` | The wordmark as live `<text>` over an inlined ten-glyph Nunito subset. Open this one to edit the type; ship `lockup.svg`. |
| `logo/monogram.svg` | Mark with `no` nested in the crescent, transparent, square. The short form: avatar, app icon, stamp. |
| `logo/monogram-white.svg`, `logo/monogram-ink.svg` | The same two reversals. |
| `logo/mark.svg` | Mark alone, no letters. Watermarks, a bullet, anywhere `no` would be read as a word. |
| `logo/mark-white.svg`, `logo/mark-ink.svg` | The same two reversals. |
| `logo/favicon.svg` | Browser tab: monogram on the dark tile, cut tight so 16px survives. |
| `logo/icon.svg` | App tile, rounded corners, opaque. |
| `logo/icon-square.svg` | App tile, square edges, for iOS and anything else that masks the icon itself. |
| `logo/icon-maskable.svg` | Android maskable: full bleed, monogram inside the 80% safe circle. |

The monogram is the lockup truncated to its first two letters, not a second
drawing: same face, same size, same origin, so the `n` nests into the crescent's
mouth exactly as it does in the full lockup. At 16px the letters go soft, which
is the price of the monogram over a bare crescent; every browser that matters
reads `favicon.svg` and scales it instead.

`lockup-text.svg` overruns its viewBox in librsvg and resvg, which apply
`letter-spacing` differently than a browser does. That is why the outlined
`lockup.svg` is the default and the source of every raster.

### Raster

Everything in `logo/export/` is cut from the SVGs above, so treat it as output:
regenerate it, never retouch it.

| File | Cut from |
|---|---|
| `favicon.ico` (16, 32, 48) | `favicon.svg` |
| `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png` | `favicon.svg` |
| `apple-touch-icon.png` (180) | `icon-square.svg` |
| `icon-192.png`, `icon-512.png` | `icon.svg` |
| `icon-maskable-512.png` | `icon-maskable.svg` |
| `monogram-256.png`, `monogram-512.png`, `monogram-1024.png`, `monogram-white-512.png` | `monogram.svg`, `monogram-white.svg` |
| `mark-256.png`, `mark-512.png`, `mark-1024.png`, `mark-white-512.png` | `mark.svg`, `mark-white.svg` |
| `lockup-1024.png`, `lockup-2048.png`, `lockup-white-1024.png`, `lockup-ink-1024.png` | the three lockups |

### Wire it up

`logo/site.webmanifest` names its icons relative to itself, so it works wherever
`logo/` is served as a unit.

```html
<link rel="icon" href="/logo/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/logo/export/favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="/logo/export/apple-touch-icon.png">
<link rel="manifest" href="/logo/site.webmanifest">
```

## Consume it

Install it and read the bytes out of `node_modules`. Do not copy a stylesheet into a
consumer; a copy drifts and nothing fails when it does.

```bash
npm install @notambourine/brand-kit
```

There is no `exports` map, so import or copy any shipped path directly:

```js
import "@notambourine/brand-kit/tokens.css";
```

```bash
cp -R node_modules/@notambourine/brand-kit/{fonts,logo} public/
```

`tokens.css` declares the `@font-face` rules and every `var()` the other two read, so
load it first and serve `fonts/` beside it. The paths inside it are relative to the CSS
file, so inlining it into a `<style>` block breaks the faces.

The package ships the stylesheets, `fonts/`, `logo/`, and `SKILL.md`. The logo build
script and `hello-world.html` stay in the repo. Pin an exact version and bump it on
purpose; a caret range moves the brand under a consumer with no diff to review.

Consumers today:

| | |
|---|---|
| `notambourine/claude` | Ships it as the `/nt-brand:system` skill. |
| `notambourine/share` | Serves `tokens.css` and `deck.css` from its own origin; a self-only CSP forbids a CDN. |
| `notambourine/notambourine.com` | The site's stylesheet. |

## Gate a consumer

A `var(--x)` that reads a token this repo stopped declaring falls through to its
fallback and the page still renders, so a bump can go wrong quietly. Check three things
in the consumer's CI: the font bytes hash against `fonts/`, every color is one this kit
defines, and every `var()` reads a property it still declares. `notambourine/share`'s
`npm run brand` is the reference implementation.

## Release

Bump `version` in `package.json`, land it, then tag the merge commit:

```bash
git tag v1.0.1 && git push origin v1.0.1
```

`.github/workflows/npm-publish.yml` publishes the tag through npm trusted publishing.
No token lives in this repo, and npm attaches a provenance attestation tying the
published tarball to that workflow run. The workflow fails if the tag and the manifest
disagree.

## License

MIT for the stylesheets and `SKILL.md`. The faces in `fonts/` are SIL Open Font License;
see `fonts/OFL.txt`.
