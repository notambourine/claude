<!-- Strip these comments as you fill the sections. The reviewer has the diff, so write only what it cannot show. Read it before writing: a body built from the branch name or the commit subjects describes the change instead of explaining it. Visual pays at a steep rate: a mermaid block is worth ten paragraphs, a browser screenshot a hundred, a before/after pair or a recording a thousand. Spend the effort there and let the prose shrink to match.

Budget the whole body at 150 words. Past that you are writing the diff back. Cut prose first, never a screenshot or a `_none_`.

One physical line per paragraph, bullet, and checkbox, however long it runs. GitHub renders a lone newline as a break, so wrapping at 80 columns ships a ragged strip; indenting a continuation four spaces ships a code block.

An empty section keeps its heading over `_none_`, except Screenshots, which a PR with no visual surface deletes. -->

## Goal

<!-- Who could not do what, what they can now, and why now, in 1-3 sentences. Name the ask or the pass that started the work, then stop. The counts, the file names, and what a pass turned up are already in the diff, so they go nowhere in this body; Summary carries the shape of the change and nothing finer. Link the issue inline: `Closes #123`, or plain `#123` to only advance it.

Golden: "Support could not tell whether a refund had posted, so every dispute meant a manual lookup in the gateway. The webhook now writes the gateway's final state onto the order, which is what the self-serve refund flow in #412 has been waiting on. Closes #388."

A chore owes no benefit sentence and stops at the ask: "A slash-doctor pass cleanup of the repo's resident context." -->

## Summary

<!-- The shape of the change, one bold-lead bullet per area it reaches: `**Denial email** - the expiry line now offers a post-deadline contact.` Never a file listing. One mermaid block at most, and only when the shape is a flow or a call order no sentence holds; both states as subgraphs in a single fence. -->

## Key Decisions

<!-- Only what a human decided in conversation and the code cannot state: a road named and rejected, a constraint from outside the codebase, a gap left open on purpose and who owns it, a warning the reviewer needs. Reasoning the diff already carries is not a bullet, nor is a move the tooling forced or a bug simply fixed. Three sentences means a trap: write it at the code site as `// KEY-DECISION <date>:` and name the file here. `_none_` is an honest answer. -->

## Screenshots

<!-- UI only. A before/after pair per surface the change reaches, or a recording when motion or a multi-step flow is the point. Name each capture. In a browser, drag the files in at the marker below. From a terminal, POST each to `uploads.github.com/user-attachments/assets` with a `gh auth token` bearer and embed the URL it returns - that is the endpoint drag-and-drop calls, so a private repo's access control comes with it. Never commit a capture or push a branch of them. -->

<!-- drag screenshots here -->

## Test Plan

<!-- Manual evidence CI cannot produce: the command, the URL, the environment you ran it against, the device or breakpoint, the path a user clicks through. Never restate what a workflow already runs. `- [x]` for a check you ran, `- [ ]` plus the reason for one you did not. A PR with no manual evidence to give replaces the box with `_none_`. -->

- [ ]
