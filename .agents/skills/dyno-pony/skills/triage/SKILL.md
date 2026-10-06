---
name: triage
description: Move issues on the project issue tracker through a small state machine of triage roles, categorise, verify, grill if needed, and write agent-ready briefs. Use when the user wants to triage the backlog, says "triage issues", "categorise the bug reports", "what's in the queue", or runs /triage.
whenToUse: "Two category roles (bug, enhancement) and five state roles (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). Every triaged issue carries exactly one category and one state. For a PR: same states, against the attached code. (1) Show what needs attention. (2) Triage a specific issue: gather context, recommend, verify the claim, grill if needed, apply outcome. (3) Quick state override for 'move #N to X' requests."
metadata:
  category: engineering
  scope: triage
  author: dyno-pony/sprint-4
  upstream: derived from mattpocock/skills (MIT, triage)
---

# Triage

Move issues on the project issue tracker through a small state machine of triage roles. PRs are treated as issues with attached code; resolve a bare `#42` to an issue or PR per the tracker config.

The issue tracker is configured by the `tracker` skill (local markdown by default at `~/.dsh/tracker/`).

## Reference docs

- The `tracker` skill — how to read/write the local tracker.
- The `grill` skill — when a request needs fleshing out.

## Roles

**Two category roles:**

- `bug` — something is broken.
- `enhancement` — new feature or improvement.

**Five state roles:**

- `needs-triage` — maintainer needs to evaluate.
- `needs-info` — waiting on reporter for more information.
- `ready-for-agent` — fully specified, ready for an AFK agent.
- `ready-for-human` — needs human implementation.
- `wontfix` — will not be actioned.

For a PR, the same states read against the attached code: `ready-for-agent` means a brief is attached and an agent should take the next step on the diff; `ready-for-human` means it's ready for a human to merge.

Every triaged issue should carry **exactly one** category role and one state role. If state roles conflict, flag it and ask before doing anything else.

These are canonical role names. The actual label strings may differ per tracker; the `tracker` skill config maps canonical to local. If the config is missing, tell the user to run `setup-matt-pocock-skills` (or to set the labels in `~/.dsh/tracker/config.yaml`).

State transitions: an unlabeled issue normally goes to `needs-triage` first; from there it moves to `needs-info`, `ready-for-agent`, `ready-for-human`, or `wontfix`. `needs-info` returns to `needs-triage` once the reporter replies. The maintainer can override at any time; flag transitions that look unusual and ask before proceeding.

## Invocation

The maintainer invokes `/triage` and describes what they want in natural language. Interpret the request and act. Examples:

- "Show me anything that needs my attention."
- "Let's look at #42" (issue or PR).
- "Move #42 to ready-for-agent."
- "What's ready for agents to pick up?"

## Show what needs attention

Query the tracker and present three buckets, oldest first:

1. **Unlabeled** — never triaged.
2. **`needs-triage`** — evaluation in progress.
3. **`needs-info` with reporter activity since the last triage notes** — needs re-evaluation.

Show counts and a one-line summary per item. Let the maintainer pick.

For local markdown tracker: `ls ~/.dsh/tracker/issues/` + parse the front-matter of each file. Filter by `state:` value.

## Triage a specific issue or PR

1. **Gather context.** Read the full issue or PR (body, comments, labels, author, dates; for a PR, the diff too). Parse any prior triage notes so you don't re-ask resolved questions. Explore the codebase using the project's domain glossary, respecting ADRs in the area. Run two checks against the codebase:
   - **(a) Redundancy** — search for an existing implementation of the requested behavior by domain concept (not just the request's wording), and report where you looked. If found, it's an already-implemented `wontfix` (step 5).
   - **(b) Prior rejection** — read `.out-of-scope/*.md` (or the local tracker's out-of-scope dir) and surface any that resemble this request.

2. **Recommend.** Tell the maintainer your category and state recommendation with reasoning, plus a brief codebase summary relevant to the request (including whether it's already implemented). Wait for direction.

3. **Verify the claim.** Before any grilling, check that the claim holds up. For a bug, reproduce it from the reporter's steps. For a PR, confirm the diff does what it claims: check it out, run the relevant tests or commands. Report what happened: confirmed (with code path), failed, or insufficient detail (a strong `needs-info` signal).

4. **Grill (if needed).** If the request needs fleshing out, call the `grill` skill (grill-with-docs variant) and `domain` skill inline, and grill it into shape a round of questions at a time, sharpening domain terms and updating `CONTEXT.md`/ADRs inline as decisions land.

5. **Apply the outcome:**
   - `ready-for-agent` — edit the issue's front-matter to `state: ready-for-agent` and add an **agent brief** to the body.
   - `ready-for-human` — same structure as an agent brief, but note why it can't be delegated (judgment calls, external access, design decisions, manual testing).
   - `needs-info` — append triage notes with two sections: "What we've established so far" and "What we still need from you".
   - For `wontfix`, move the file to `~/.dsh/tracker/wontfix/` (or apply `state: wontfix`), with a comment depending on *why*:
     - **Already implemented** — the change already exists. Point to where it lives.
     - **Rejected (bug)** — give a polite explanation.
     - **Rejected (enhancement)** — write to `.out-of-scope/`, link to it from a comment.
   - `needs-triage` — apply the role. Optional comment if there's partial progress.

## Quick state override

If the maintainer says "move #42 to ready-for-agent", trust them and apply the role directly. Confirm what you're about to do (role changes, comment, close), then act. Skip grilling. If moving to `ready-for-agent` without a grilling session, ask whether they want to write an agent brief.

## Needs-info template

```markdown
## Triage Notes

**What we've established so far:**

- point 1
- point 2

**What we still need from you (@reporter):**

- question 1
- question 2
```

Capture everything resolved during grilling under "established so far" so the work isn't lost. Questions must be specific and actionable, not "please provide more info".

## Resuming a previous session

If prior triage notes exist on the issue or PR, read them, check whether the reporter has answered any outstanding questions, and present an updated picture before continuing. Don't re-ask resolved questions.
