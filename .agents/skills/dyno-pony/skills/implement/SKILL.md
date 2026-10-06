---
name: implement
description: Implement the work described in a spec or a set of tickets. Use when the user says "implement this", "build it", "go ahead", "start coding", or hands over a spec/issue and wants it built.
whenToUse: "Thin wrapper. Drive the `tdd` skill at pre-agreed seams (one red-green slice at a time). Run typecheck regularly; single test files regularly; the full test suite once at the end. When done, run the `code-review` skill before committing. Commit work to the current branch. Stops when each ticket's acceptance criteria are green and the review is clean."
metadata:
  category: engineering
  scope: execution
  author: dyno-pony/sprint-4
  upstream: derived from mattpocock/skills (MIT, implement)
---

# Implement

Implement the work described by the user in the spec or tickets.

## Process

1. **Read the spec and tickets.** Read enough to understand the task graph.
2. **Confirm the seams.** The `tdd` skill writes tests at pre-agreed seams. Confirm them with the user (or the spec) before writing any test. No test at an unconfirmed seam.
3. **Drive `tdd` per ticket.** For each ticket:
   - Write a failing test for one vertical slice.
   - Watch it fail.
   - Implement the minimum to pass.
   - Watch it pass.
   - Refactor only if a smell is named (call the `code-review` Fowler baseline from the `code-review` skill).
4. **Typecheck and test regularly.** Typecheck on every meaningful change; run the single test file after every cycle; run the full suite once at the end of the work, not after every cycle.
5. **Code review before commit.** When the work is done, call the `code-review` skill on the diff since the fixed point. Fix anything raised. Repeat until clean.
6. **Commit.** Conventional commit message that names the spec or ticket id. Reference the originating spec or issue.

## Context hygiene

A long implementation depletes the context window. Stay sharp by:

- Treating each ticket as a fresh sub-context where possible. The smaller the ticket, the smaller the context cost.
- Stopping at the end of each ticket, not mid-ticket. Mid-ticket stopping is recoverable; mid-ticket drift is not.
- Calling `drift` (the loop detector) when the same question comes up twice. Stop and re-scope if it fires.
- Calling `sphinx` (context budget governor) when the context is getting dense. A checkpoint now is cheaper than recovery later.

## When not to use this skill

- The user wants to **plan**, not implement. That's `grill-with-docs` → `to-spec` → `to-tickets`.
- The user wants a **prototype** to test a design question. That's the `prototype` skill.
- The user wants a **bug fixed**. That's the `diagnose` skill.
- The work is small enough to be a one-shot edit. Skip this skill; just edit.

## Out of scope

- Spec writing. The spec is the input, not the output.
- Architecture review. That's `codebase-arch`.
- Refactoring without a spec. The user owns the design; you implement it.
