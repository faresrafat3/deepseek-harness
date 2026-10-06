---
name: handoff
description: Compact the current conversation into a portable handoff document so a fresh agent (or session) can continue the work. Also: re-pitch a message that didn't land in plain English. Use when the user says "handoff", "summarize this session", "I need to come back to this later", "the agent in a new tab won't have this context", or says "wait what" / "I don't get it" / "what did you just say".
whenToUse: "Two related skills. (1) Handoff: write a portable markdown handoff (save to OS temp, never the workspace) summarising the current conversation; redact secrets; reference existing artifacts (specs, ADRs, commits) by path, don't duplicate them. (2) Wait-what: re-pitch a message that didn't land in plain English, with the context the user was missing, using the project's CONTEXT.md vocabulary."
metadata:
  category: productivity
  scope: context
  author: dyno-pony/sprint-4
  upstream: derived from mattpocock/skills (MIT, handoff + wait-what)
---

# Handoff + Wait-what

Two related skills, one entry point. Both fix a **context** problem, but from opposite directions.

## 1. Handoff

Compact the current conversation so a fresh agent (or a future you) can pick up the work without reading the whole log.

### Where to save

The **OS temp directory** — never the workspace. Resolve from `$TMPDIR`, fall back to `/tmp`. Path: `~/.dsh/handoffs/<YYYY-MM-DD>-<slug>.md` (the harness handoffs dir is persistent across sessions).

**Never** write to the workspace: the handoff is a meta-artifact, and committing it pollutes the repo.

### What to include

1. **Goal** — the one or two lines that explain what the work was.
2. **Decisions made** — load-bearing choices and *why* (rationale, not just the verdict).
3. **State at handoff** — what is done, what is in flight, what is blocked.
4. **Next step** — the single most useful thing for the next session to do.
5. **Suggested skills** — which skills the next agent should call (`/grill-with-docs`, `/tdd`, `/code-review`, …).
6. **Artifact pointers** — paths or URLs to specs, plans, ADRs, commits, diffs. Reference, don't duplicate.

### What to redact

API keys, passwords, PII. **`<REDACTED>`** in place. The handoff becomes the next agent's prompt; any leak is permanent.

### What not to do

- Don't duplicate content already in artifacts — reference by path.
- Don't restate the entire conversation. The point is a tight handoff, not a transcript.
- Don't put secrets in even if you "redact them later" — redact on write.
- Don't save to the workspace.

## 2. Wait-what

Fire this the moment a message didn't land. The user said "I don't get it" or sent a clear confusion signal. Re-pitch what you just said with the context they were missing.

### Recipe

1. **Plain English.** ASD-STE100-style: short sentences, one idea each, the technical terms the project actually uses.
2. **Use the project's vocabulary.** Read `CONTEXT.md` (or follow `CONTEXT-MAP.md`) and use the canonical terms. Jargon that wasn't grounded in the conversation is a *signal* the message didn't land.
3. **Re-pitch with the missing context.** What did the user *not* have when they read your message that, if they had it, would have made it land? Provide that.
4. **A one-liner, then a paragraph.** A blunt one-line re-statement, then a paragraph with the reasoning.

### When to reach for it

- The user sends a confusion signal ("wait what", "?", "I don't get it", "what do you mean").
- The user repeats the same question you thought you answered.
- The user goes silent for more than a few turns after a long reply.
- A message was very dense or used shorthand the user wasn't on board with.

### What not to do

- Don't re-deliver the same message. The user already rejected it once.
- Don't ask "did you mean X or Y?" — re-pitch with the context they were missing.
- Don't dump more detail. They had detail. The detail was the problem.

## How the two combine

- **Handoff** is the *upfront* cure for context loss (preserve it before the next session starts).
- **Wait-what** is the *corrective* for a message that didn't land (re-pitch in the moment).
- Both are cheaper than `drift` firing (the loop detector) and cheaper than `sphinx` checkpointing (the context budget governor) — they fix the message, not the loop.
