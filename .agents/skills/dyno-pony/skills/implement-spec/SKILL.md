---
name: implement-spec
description: Implement a specification in code, in parallel. Use when the user has a spec with tickets, wants the entire spec on a single branch as a PR, and is happy to run multiple implementer sub-agents concurrently. Builds the spec end-to-end, then closes out with a code review.
whenToUse: "Spec → PR. Tickets form a task graph with blocking edges. (1) Read the spec and tickets. (2) (Optional) Spin up an exploration sub-agent to gather codebase context. (3) Create a branch and a draft PR marked as closing the spec and tickets. (4) Spin up one implementer sub-agent per frontier ticket, each in its own worktree, on its own branch. (5) Merge each as it lands. (6) Repeat until all tickets done. (7) Run `code-review` on the PR; fix everything raised in a single implementer sub-agent. (8) Mark the PR ready, clean up worktrees."
metadata:
  category: engineering
  scope: parallel-build
  author: dyno-pony/sprint-4
  upstream: derived from mattpocock/skills (MIT, implement-spec)
---

# Implement Spec

Implement a specification in code, end-to-end, as a single PR with multiple implementer sub-agents working concurrently. The tickets form a **task graph** with blocking relationships; the **frontier** is the set of tickets whose blockers are done.

## Steps

1. **Read the spec and tickets.** Read enough to understand the task graph — the blockers, the front dependencies, the size of each ticket. Tickets are not a list of steps; they are a graph.

2. **(Optional) Exploration sub-agent.** If the tickets need codebase or external context, spin up an exploration sub-agent first. It should save its notes **outside the repo** (a scratch dir the implementers can read). This keeps implementer sub-agents focused on implementation, not exploration.

3. **Create a branch and a draft PR.** The PR is marked as **closing** the spec and its tickets. The PR is the integration surface.

4. **Implementer sub-agents per ticket.** Each runs in **its own worktree, on its own branch**, off the PR's branch. Communication is sparse — through context pointers (to the spec, tickets, research notes, previous commits), not duplicated prose. **Maximise concurrency**: kick off as many frontier tickets as the model budget allows.

5. **Merger sub-agent per finished implementer.** When an implementer sub-agent completes, merge its work into the PR branch with a merger sub-agent. A separate role keeps the implementer focused on building, not rebasing.

6. **Re-evaluate the frontier.** As tickets land, the frontier grows. Kick off more implementer sub-agents to fill it. Loop until all tickets are done.

7. **Code review on the PR.** When the work is done, call the `code-review` skill on the diff. Fix everything raised in a single implementer sub-agent (one pass, then re-review).

8. **Mark the PR ready.** Remove the draft flag. Tell the user.

9. **Clean up.** Remove all implementer-sub-agent worktrees. The PR branch and the merged commits are the durable record.

## Sub-agent discipline

- **Implementer sub-agents** work in their own worktree and branch. They commit to their branch. They never push, never merge.
- **Merger sub-agents** resolve conflicts, run the project's checks, and merge into the PR branch.
- **Exploration sub-agents** (step 2) read-only; they leave notes for the implementers.
- Communication is through **context pointers** to artifacts, not duplicated prose.

## When not to use this skill

- The spec has one ticket. Use `implement` instead.
- The spec is small enough for one context. Use `implement` instead.
- The user is mid-conversation and wants the work done now, not as a PR. Use `implement` instead.
- The work is exploratory (no spec). Use `prototype` or `grill-with-docs` first.

## Anti-patterns

- **One implementer per ticket, sequential.** The point of this skill is concurrency.
- **Implementers merging their own work.** Implementer focuses on building, merger on rebasing.
- **Implementer reading the entire repo.** The exploration sub-agent's notes are the context.
- **Skipping the code review.** The PR is the integration surface; review is part of the discipline.
- **Reusing the main branch.** The PR branch is the integration; worktrees branch off it.
