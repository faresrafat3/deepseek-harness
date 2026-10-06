---
name: to-spec
description: Turn the current conversation into a spec and publish it to the project issue tracker. No interview — just synthesis of what you've already discussed. Use when the user wants a spec for what's been decided, or says "write a spec", "turn this into a spec", "document the design", "publish to the tracker".
whenToUse: "(1) Use the project's domain glossary and respect ADRs. (2) Sketch the test seams first — existing preferred, highest possible, one is ideal. Confirm with the user. (3) Write the spec using the template below. (4) Publish to the configured tracker (local by default, via the `tracker` skill). Apply the `ready-for-agent` label."
metadata:
  category: engineering
  scope: spec
  author: dyno-pony/sprint-4
  upstream: derived from mattpocock/skills (MIT, to-spec)
---

# To Spec

Take the current conversation context and codebase understanding and produce a spec. **Do NOT interview the user; just synthesize what you already know.**

The issue tracker is configured by the `tracker` skill (local markdown by default at `~/.dsh/tracker/`). If no tracker is configured, ask the user which one to use.

## Process

1. **Explore the repo** to understand the current state of the codebase, if you haven't already. Use the project's domain glossary vocabulary throughout the spec, and respect any ADRs in the area you're touching.

2. **Sketch the seams** at which you're going to test the feature. Existing seams should be preferred to new ones. Use the highest seam possible. If new seams are needed, propose them at the highest point you can. The fewer seams across the codebase, the better — the ideal number is one. **Check with the user that these seams match their expectations.**

3. **Write the spec** using the template below, then publish it to the project issue tracker. Apply the `ready-for-agent` triage label — no need for additional triage.

## Spec template

```markdown
# <Title>

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A LONG, numbered list of user stories. Each user story should be in the format of:

1. As an <actor>, I want a <feature>, so that <benefit>

This list should be **extensive** and cover all aspects of the feature.

## Implementation Decisions

A list of implementation decisions that were made. This can include:

- The modules that will be built/modified
- The interfaces of those modules that will be modified
- Technical clarifications from the developer
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets. They may end up being outdated very quickly.

Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it within the relevant decision and note briefly that it came from a prototype. Trim to the decision-rich parts, not a working demo, just the important bits.

## Testing Decisions

A list of testing decisions that were made. Include:

- A description of what makes a good test (only test external behavior, not implementation details)
- Which modules will be tested
- Prior art for the tests (i.e. similar types of tests in the codebase)

## Out of Scope

A description of the things that are out of scope for this spec.

## Further Notes

Any further notes about the feature.
```

## Publishing

For the local tracker (default):

1. Compute the next number under `specs/`: `ls ~/.dsh/tracker/specs | wc -l` then `printf '%02d' "$next"`.
2. Pick a slug from the spec title (`kebab-case`).
3. Write `~/.dsh/tracker/specs/<NN>-<slug>.md` with the body above, prefixed by YAML front-matter (kind: spec, status: ready-for-agent, created: YYYY-MM-DD).
4. Report the path to the user.

For a real tracker (GitHub, Linear, etc.), use the appropriate CLI (`gh issue create`, `glab issue create`, etc.) and apply the `ready-for-agent` label.
