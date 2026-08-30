# Humanizer

Portable Markdown skill. Version `2.9.1`. Thirty-three AI-writing flags; fact and voice
preservation; pasted, file, embedded modes.

## Install

```bash
npx skills add blader/humanizer --global
npx skills update humanizer --global
npx skills add blader/humanizer --global --agent '*'
```

Project install: omit `--global`. Claude Code:

```text
/plugin marketplace add blader/humanizer
/plugin install humanizer@humanizer
```

## Use

```text
/humanizer
[text]
```

Provide a writing sample to match voice. Point to a file for in-place prose editing.

Patterns: significance, notability, `-ing` tails, promotion, vague attribution, formulaic
sections, AI vocabulary, copula avoidance, negative parallelism, forced threes, synonym
cycling, false ranges, passive fragments, dashes, bold, inline headers, title case, emoji,
curly quotes, chatbot artifacts, cutoff/speculation, sycophancy, filler, hedging, generic
conclusions, excess hyphens, authority tropes, signposting, fragmented headers, diff
narration, punchlines, aphorisms, rhetorical openers.

Source basis: [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing).
License: MIT.
