<!-- Strip these comments as you fill the sections. The reviewer has the diff, so write only what it cannot show.

Budget: 150 words. Goal 40, Summary 60, Key Decisions 30, Test Plan 20. Screenshots spend none. Cut prose first, never a screenshot and never a `_none_`.

Visual pays at a steep rate: a mermaid block is worth ten paragraphs, a browser screenshot a hundred, a before/after pair or a recording a thousand.

One physical line per paragraph, bullet, and checkbox, however long it runs. GitHub renders a lone newline as a break, so wrapping at 80 columns ships a ragged strip, and indenting a continuation four spaces ships a code block.

An empty section keeps its heading over `_none_`. Screenshots is the exception: a PR with no visual surface deletes it. -->

## Goal

<!-- Who could not do what, what they can now, and why now. 1-3 sentences. Link the issue inline: `Closes #123`, or plain `#123` to only advance it. Counts, file names, and what a pass turned up are in the diff, not here.

Golden: "Support could not tell whether a refund had posted, so every dispute meant a manual gateway lookup. The webhook now writes the gateway's final state onto the order. Closes #388."

A chore owes no benefit sentence and stops at the ask: "A slash-doctor pass cleanup of the repo's resident context." -->

## Summary

<!-- One bold-lead bullet per area the change reaches: `**Denial email** - the expiry line now offers a post-deadline contact.` Never a file listing. One mermaid block at most, both states as subgraphs in a single fence, and only when the shape is a flow or a call order no sentence holds. -->

## Key Decisions

<!-- Three bullets maximum. Each is a call where the reviewer disagreeing changes the diff: a road rejected, a constraint from outside the codebase, a gap left open on purpose and its owner. A fourth means you are explaining, not deciding. Not decisions: reasoning the diff carries, a move the tooling forced, a bug you fixed, scope you declined that nobody asked for. A trap that takes three sentences goes at the code site as `// KEY-DECISION <date>:`; name the file here. `_none_` is an honest answer. -->

## Screenshots

<!-- UI only. A before/after pair per surface the change reaches, or a recording when motion or a multi-step flow is the point. Name each capture. In a browser, drag the files in at the marker below. From a terminal, POST each to `uploads.github.com/user-attachments/assets` with a `gh auth token` bearer and embed the URL it returns; that is the endpoint drag-and-drop calls, so a private repo's access control comes with it. Never commit a capture and never push a branch of them. -->

<!-- drag screenshots here -->

## Test Plan

<!-- Manual evidence CI cannot produce: the command, the URL, the environment you ran it against, the device or breakpoint, the path a user clicks through. Never restate what a workflow already runs. `- [x]` for a check you ran, `- [ ]` plus the reason for one you did not. With no manual evidence to give, replace the box with `_none_`. -->

- [ ]
