---
name: pr
description: Create or revise a draft pull request.
allowed-tools: Bash, Read, Write, Glob
argument-hint: "[pr-number-to-edit]"
---

# Pull request

Create or revise a draft PR that helps a reviewer understand the change.

## Use the template

Use the repository's committed pull request template. If it has none, use `.github/pull_request_template.md` from this skill. Preserve the selected template's headings and required markers.

## Understand the change

Know the problem, outcome, scope, and important decisions before writing. If you did the work, use that context. Otherwise inspect the relevant issue, source, commits, or diff as needed. Do not infer the change from the branch name or commit subjects alone.

## Write for the reviewer

Open on the outcome. Explain behavior and decisions rather than narrating files or restating the implementation. Keep the body concise and proportional to the change; use the template's limit when it sets one.

Make the title specific enough to carry the scope. Create a draft unless the user requests a ready PR.

## Screenshots

For visible changes, capture the affected surface when screenshots would add review evidence. Prefer a named before-and-after pair; use a recording for motion or a multi-step flow. Upload captures as GitHub user attachments rather than committing them or using a third-party host.

When screenshots are needed, read [references/github-attachments.md](references/github-attachments.md).

## Submit

Use `gh pr create` or `gh pr edit`. Choose any reliable way to preserve the filled template's formatting.
