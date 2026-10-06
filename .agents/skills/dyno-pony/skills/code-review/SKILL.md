---
name: code-review
description: Two-axis review of the diff since a fixed point. Standards (does the code follow the repo's documented standards + a Fowler smell baseline) and Spec (does the code match what the originating issue/spec asked for). Both axes run as parallel sub-agents so they don't pollute each other's context. Use when the user wants to review a branch, a PR, work-in-progress changes, or says "review since X", "review the diff", "is this ready to merge".
whenToUse: "Run a two-axis review. (1) Pin the fixed point (commit SHA, branch, tag, merge-base). (2) Find the spec source. (3) Find the standards sources. (4) Spawn two parallel sub-agents, Standards + Spec. (5) Aggregate under separate headings, never merge. End with one line per axis: total findings, worst issue. Don't pick a winner across axes — the separation is the point."
metadata:
  category: engineering
  scope: review
  author: dyno-pony/sprint-4
  upstream: derived from mattpocock/skills (MIT, code-review)
---

# Code Review

Two-axis review of the diff between `HEAD` and a fixed point the user supplies:

- **Standards** — does the code conform to this repo's documented coding standards?
- **Spec** — does the code faithfully implement the originating issue / spec?

Both axes run as **parallel sub-agents** so they don't pollute each other's context, then this skill aggregates their findings.

## Why two axes

A change can pass one axis and fail the other:

- Code that follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**

Reporting them separately stops one axis from masking the other.

## Process

### 1. Pin the fixed point

Whatever the user said (commit SHA, branch name, tag, `main`, `HEAD~5`, etc.). If they didn't specify one, ask.

Capture the diff command once: `git diff <fixed-point>...HEAD` (three-dot, so it's against the merge-base). Also note the commit list: `git log <fixed-point>..HEAD --oneline`.

Before going further, confirm the fixed point resolves (`git rev-parse`) and the diff is non-empty. A bad ref or empty diff fails here, not inside two parallel sub-agents.

### 2. Identify the spec source

Look for the originating spec, in this order:

1. Issue references in the commit messages (`#123`, `Closes #45`, GitLab `!67`), fetched via the tracker.
2. A path the user passed as an argument.
3. A spec file under `docs/`, `specs/`, or `.scratch/` matching the branch or feature.
4. If nothing found, ask the user where the spec is. If they say there isn't one, the **Spec** sub-agent will skip and report "no spec available".

### 3. Identify the standards sources

Anything in the repo that documents how code should be written: `CODING_STANDARDS.md`, `CONTRIBUTING.md`, or the DSH workspace `AGENTS.md` if applicable.

On top of whatever the repo documents, the Standards axis carries a **Fowler smell baseline** (a fixed set of code smells from _Refactoring_, ch.3) that applies even when a repo documents nothing. Two rules bind it:

- **The repo overrides.** A documented repo standard always wins.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature Envy"), never a hard violation. Skip anything tooling already enforces.

Smells to look for:

- **Mysterious Name** — function or type whose name doesn't reveal what it does.
- **Duplicated Code** — same logic shape in more than one place.
- **Feature Envy** — method that reaches into another object's data more than its own.
- **Data Clumps** — same few fields travel together (a type wanting to be born).
- **Primitive Obsession** — primitive standing in for a domain concept.
- **Repeated Switches** — same `switch` on the same type recurs.
- **Shotgun Surgery** — one logical change forces scattered edits.
- **Divergent Change** — one file edited for several unrelated reasons.
- **Speculative Generality** — abstraction added for needs the spec doesn't have.
- **Message Chains** — long `a.b().c().d()` navigation.
- **Middle Man** — class or function that mostly just delegates.
- **Refused Bequest** — subclass that ignores most of what it inherits.

### 4. Spawn both sub-agents in parallel

**Standards sub-agent** gets: the diff command + commit list, the standards-source files found in step 3, **plus the smell baseline pasted in full**, and a brief under 400 words.

**Spec sub-agent** gets: the diff command + commit list, the path or fetched contents of the spec, and a brief under 400 words.

If the spec is missing, skip the Spec sub-agent and note this in the final report.

### 5. Aggregate

Present the two reports under `## Standards` and `## Spec` headings, verbatim or lightly cleaned. Do **not** merge or rerank findings, because the two axes are deliberately separate.

End with a one-line summary: total findings per axis, and the worst issue *within each axis* (if any). Don't pick a single winner across axes.
