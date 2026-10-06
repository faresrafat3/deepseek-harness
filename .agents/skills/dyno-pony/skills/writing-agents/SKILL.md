---
name: writing-agents
description: Reference for writing any document an agent consumes — a skill, an AGENTS.md/CLAUDE.md, a doc reached by a pointer. Also: conduct a retrospective on a coding session to propose improvements to the agent's environment (navigation, checks, standards, AGENTS.md, tool economy). Use when the user wants to write or edit a skill, modify an AGENTS.md, or run a session retro.
whenToUse: "Two related skills. (1) writing-for-agents: context pointer discipline, information hierarchy, completion criteria, leading words, pruning. (2) retro: read a session's primary sources, find candidates for improvement in 6 categories, present in severity order."
metadata:
  category: meta
  scope: authoring
  author: dyno-pony/sprint-4
  upstream: derived from mattpocock/skills (MIT, writing-for-agents + retro)
---

# Writing-for-Agents + Retro

Two related skills, one entry. Both improve the **environment** the next agent works in.

## 1. Writing-for-Agents

Reference for writing any document an agent consumes: a skill, an `AGENTS.md` / `CLAUDE.md`, a doc reached by a pointer. The packaging differs; the writing does not.

### Context pointers

A **context pointer** is a reference held in the agent's context that names out-of-context material and encodes the condition for reaching it. A skill's description is one; a line in `AGENTS.md` naming a doc is the same object.

A pointer does two jobs: state what the material is, and list the **branches** that should trigger reaching it. Every word of an always-loaded pointer costs on every turn:

- **Front-load the leading word**: the pointer is where it does its triggering work.
- **One trigger per branch.** Synonyms that rename one branch are one branch written twice.
- **Cut identity the body already carries.**

### The two loads

Every document spends one of two budgets:

- **Context load** — always-loaded material on the agent's window (an `AGENTS.md` line, a skill description). Costs tokens and attention whether or not it fires.
- **Cognitive load** — on the human: which documents exist and when to reach for each. The price of human agency; spend it where judgement matters.

Material reached only through a pointer escapes context load at the price of the pointer's own line; material with no pointer at all rides entirely on cognitive load.

### Information hierarchy

A document is built from two content types: **steps** (ordered actions) and **reference** (definitions, rules, facts consulted on demand). The decision is where each piece sits on the **information hierarchy**:

1. **In-file step** — primary: what the agent does, in order.
2. **In-file reference** — consulted on demand.
3. **Disclosed reference** — pushed out to a separate file, reached by a context pointer, loaded only when the pointer fires.

**Progressive disclosure** is moving down the ladder. **Co-location** is keeping a concept's definition, rules, and caveats under one heading. **Sprawl** is the failure mode: a document too long for attention to track.

### Steps and completion criteria

Every step ends on a **completion criterion**: the condition that tells the agent the work is done. Two properties make it a lever:

- **Clarity** — can the agent tell done from not-done? Sharpen the bound first.
- **Demand** — how much it requires. "Every rule applied" forces thorough work.

### When to split

Split only when the cut earns it:

- **By sequence** — split a run of steps where the post-completion steps tempt the agent to rush the one in front of it.
- **By invocation** — skill-specific; see the skill mechanics.

### Leading words

A **leading word** is a compact concept already in the model's pretraining that the agent thinks with while running the document. Repeated as a token, it accumulates a distributed definition and anchors behaviour in fewest tokens. Coined words recruit no priors: reach for an existing word first.

Hunt opportunities to refactor with leading words:

- "fast, deterministic, low-overhead" → _tight_ (a _tight_ loop).
- "a loop you believe in" → _red_ (the loop goes _red_ on the bug, or it doesn't).

**Negation** is the failure mode: "don't think of an elephant" drags the elephant into context. Prompt the **positive** state.

### Pruning

- **Single source of truth** — one authoritative place per meaning.
- **The environment is a source of truth** too (`package.json` scripts, config, `--help`). A document that restates it is a **cache**.
- **Relevance** — does each line still bear on what the document does?
- **No-ops** — instruction the model already obeys by default. Delete.

## 2. Retro (retrospective on a coding session)

The user has asked for a retrospective. You suggest improvements to the **environment** to improve future runs.

### Steps

1. Read the primary sources for the session the user specifies (session logs, transcripts). If the user doesn't specify, default to the current one.
2. Look for candidates in these six categories:
   - **Navigation** — was it hard to find files? Hidden dependencies? Worth a navigation pointer? _Use when_ the session took a long time to find something.
   - **Automated checks** — checks that could have caught the agent's mistakes? Linting, typing, tests, FS linters? _Use when_ the agent made a mistake a check could catch.
   - **Coding standards** — a new rule the reviewer should enforce, or an old rule to clarify? _Use when_ the reviewer missed something.
   - **Global AGENTS.md** — instructions that should move to coding standards or checks? _Use when_ the AGENTS.md is large.
   - **Tool economy** — expensive calls that could be streamlined? Token-inefficient tooling? _Use when_ the agent made an expensive call.
   - **No-ops** — instructions in steering files that don't modify behaviour? _Use when_ the steering files are large.
   - **Information access** — opportunities to increase access? Teeing dev server logs, readonly access to third-party services? _Use when_ a crucial piece was missing.
3. Present candidates in order of severity.

### Reference

**Implementation vs Review.** All work goes through two stages: implementation and review. The implementation agent has the most context pressure (exploration + writing + debugging). The review agent has the least (receives a diff, no exploration). Impose coding standards on the review agent, not the implementation agent.

**Files to consider:**

- `CLAUDE.md` / `AGENTS.md` — pushed to context every turn. Use sparingly, only for navigation pointers.
- `CODING_STANDARDS.md` — read during review, not implementation. Add navigation pointers if it grows past 1000 lines.
- Docs — reference files, pointed to by other files. Look for existing docs before writing new ones.
- Skills — for docs (description goes into context) or for user-invoked commands.
