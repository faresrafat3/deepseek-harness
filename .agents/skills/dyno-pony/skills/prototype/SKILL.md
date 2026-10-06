---
name: prototype
description: Build a throwaway prototype to answer a design question — a state model, business logic, or a UI. Use when the user wants to sanity-check whether a state model feels right, see what a UI should look like, or says "let me try this", "can you mock it up", "I want to feel the shape of it".
whenToUse: "Throwaway code that answers one question. The question decides the shape. (1) Logic / state model → single shareable HTML file with free-play buttons and tabbed guided walkthroughs. (2) UI look → several radically different variations on a single route, switchable via URL search param and a floating bottom bar. Throwaway from day one, no persistence by default, no polish beyond runnable, surface the state."
metadata:
  category: engineering
  scope: prototype
  author: dyno-pony/sprint-4
  upstream: derived from mattpocock/skills (MIT, prototype)
---

# Prototype

A prototype is **throwaway code that answers a question**. The question decides the shape.

## Pick a branch

Identify which question is being answered, using the user's prompt, surrounding code, or by asking:

- **"Does this logic / state model feel right?"** → single shareable HTML file with free-play buttons + tabbed guided walkthroughs. Pushes the state machine through cases hard to reason about on paper; a non-developer can drive it.
- **"What should this look like?"** → several radically different UI variations on a single route, switchable via a URL search param and a floating bottom bar.

The two branches produce very different artifacts. If the question is ambiguous and the user isn't reachable, default to whichever branch matches the surrounding code (a backend module → logic; a page/component → UI) and state the assumption at the top of the prototype.

## Rules that apply to both

1. **Throwaway from day one, and clearly marked.** Locate the prototype close to where it will be used (next to the module or page it's prototyping for) so context is obvious; name it so a casual reader sees it's a prototype, not production. For throwaway UI routes, obey whatever routing convention the project uses; don't invent new top-level structure.
2. **Trivial to run.** A UI prototype starts from one command in the project's task runner. A logic demo is a single HTML file the user double-clicks. No thinking required to start it.
3. **No persistence by default.** State lives in memory. Persistence is the thing the prototype is *checking*, not something it should depend on. If the question explicitly involves a database, hit a scratch DB or a local file with a clear "PROTOTYPE, wipe me" name.
4. **Skip the polish.** No tests, no error handling beyond what makes the prototype *runnable*, no abstractions. The point is to learn something fast.
5. **Surface the state.** After every action (logic) or variant switch (UI), print or render the full relevant state so the user can see what changed.
6. **Capture it when done.** Fold any validated decision into the real code, then capture the prototype itself as a **primary source**: commit it to a throwaway branch, out of main, and leave a context pointer to that branch on the implementation issue. Capture the answer (the verdict and the question it settled) in the issue or a commit. The main branch keeps only the validated decision.

## What a prototype is NOT

- A spike that ships. Throwaway means throwaway; the validated decision is what lands.
- A spec. No prose, no acceptance criteria; the prototype *is* the spec for the question.
- A demo for stakeholders. It's a learning tool, not a presentation.
- Permanent. Capture the answer in a commit and the prototype in a throwaway branch; the real code is what survives.
