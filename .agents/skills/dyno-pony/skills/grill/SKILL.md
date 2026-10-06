---
name: grill
description: Relentless interview of the user on a plan, decision, or design until every branch of the design tree is resolved. Use when the user wants to stress-test their thinking, sharpen a plan, or says "grill me", "interview me", "I want to think this through", "challenge this design", or hands over a feature spec and wants it checked.
whenToUse: "Stress-test a plan, design, or feature spec. The skill drives a design-tree interview: a round of questions on the current frontier, recommended answers, wait for the user's answers, then the next round. Use /grill-me for stateless, /grill-with-docs for stateful (in a working directory with CONTEXT.md and ADRs), /grilling for the raw primitive."
metadata:
  category: productivity
  scope: conversational
  author: dyno-pony/sprint-4
  upstream: derived from mattpocock/skills (MIT, grilling + grill-me + grill-with-docs)
---

# Grill

Interview the user relentlessly until every branch of the design tree is resolved. The skill is the **frontier discipline**: ask the whole frontier in one round, wait, recompute, ask the next round.

## Three variants

- **grill-me** (stateless): use when **not** in a working directory. Builds no CONTEXT.md, asks no follow-up commitments.
- **grill-with-docs** (stateful): use **in** a working directory. Also invokes `domain-modeling` to sharpen terminology, write/update `CONTEXT.md`, and create ADRs inline.
- **grilling** (primitive): the raw interview loop. The other two are named ways in; reach for this when you want the discipline with no wrapper.

## The loop (all variants)

1. **Map the design tree.** What decisions hang off the user's stated goal? Each decision branches into the ones that hang off it.
2. **Find the frontier.** Decisions whose prerequisites are settled. Ask the **whole** frontier in one round.
3. **Format a round**:

   ```
   ❓ Q1 — <title>: <body, can be multiple paragraphs>

   ➡️ <your recommended answer>

   ---

   ❓ Q2 — <title>: <body>

   ➡️ <your recommended answer>
   ```

   Each question is **numbered**, has a **recommended answer** (`➡️`), and a **clear stub** the user can answer with one line.
4. **Wait.** Do not compute the next round until the user has answered the current one. A question whose answer depends on another still open in this round belongs to a later round.
5. **Recompute the frontier.** Settled decisions push it outward and unblock questions that depended on them. Continue.
6. **Stop when the frontier is empty.** The session is done when every branch is visited; tell the user, then **wait for explicit confirmation** before acting on the shared understanding. Do not act on assumed consensus.

## Finding facts (your job, never the user's)

When a frontier question needs a fact from the environment (a file, a doc, an API), dispatch a subagent to find it; do not ask the user for anything you could look up yourself. Do not block: a running exploration is an unsettled prerequisite, so the questions downstream of it wait for the sub-agent to report; ask the rest of the frontier now.

The **decisions** are the user's; the **facts** are yours.

## Anti-patterns

- **Asking the user things you could look up** ("do you have a CI provider?" when `ls .github/workflows` answers it).
- **Asking one question at a time** — the user can't see the frontier. Round, not drip.
- **Acting on the design before confirmation** — the design is the user's; you help them reach it, you don't take it from them.
- **Skipping the recommended answer** — without it, the user has no anchor to react against.

## With docs (grill-with-docs)

In a working directory, also invoke the `domain-modeling` skill **in parallel**:

- **Naming a concept not in CONTEXT.md?** Add it (the file lazily — only if missing).
- **Sharpening a fuzzy term mid-conversation?** Update CONTEXT.md right there.
- **A hard-to-reverse decision?** Offer an ADR (framed as: "Want me to record this as an ADR?").

CONTEXT.md stays a glossary; ADRs hold the load-bearing decisions. See `domain-modeling` skill.

## Termination

The session is done when:
- The frontier is empty (every branch visited).
- The user has confirmed the shared understanding.
- A summary one-liner lands in the chat: "Done: the design is X, Y, Z. Confirm before I act."

If the user wants to act on the resolved design, the next move is `to-spec` (turn the resolved design into a buildable spec) or `to-tickets` (break the spec into agent-grabbable vertical slices).
