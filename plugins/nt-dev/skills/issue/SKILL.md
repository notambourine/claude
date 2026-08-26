---
name: issue
description: Create or revise a concise GitHub issue using the repository's template, conventions, hierarchy, and metadata. Use for filing tickets or editing issue scope and acceptance.
allowed-tools: Bash, Read, Grep, Glob
argument-hint: "[issue-number-to-edit]"
---

# GitHub issue

Create or revise an issue that gives the assignee a clear outcome without prescribing work that is still theirs to solve.

## Follow the repository

Use the authenticated `gh` CLI in the target repository. Discover its issue templates, recent issue conventions, milestones, labels, projects, and hierarchy. Never import names or metadata from another project.

Use an applicable committed issue template and preserve its structure. Otherwise organize the body around the outcome, scope boundary, and observable acceptance.

## Write the issue

Name the outcome in the title, not the activity or implementation mechanism. Improve a vague title when revising an issue.

Write at the issue reader's altitude. State the problem, constraints, relevant context, and what success looks like. Prefer user-visible behavior and business rules. Include implementation detail only when it is already decided or prevents material rediscovery. Link durable decisions rather than repeating them.

Keep the body concise and easy to scan. Do not add a delivery plan, implementation checklist, tutorial, speculative solution, or closing recap. Use child issues for planned slices and actual parent relationships for hierarchy; a title prefix alone is not hierarchy.

## Complete the record

Populate the milestone, labels, project fields, status, and parent relationship that the repository actually uses. Keep duplicated labels and project fields aligned. Do not invent metadata to fill unused fields.

When revising, integrate new information into the relevant section instead of appending a running log. Use a dated comment only for a decision or result.
