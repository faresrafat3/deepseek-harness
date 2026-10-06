---
name: codebase-arch
description: Scan a codebase for deepening opportunities — refactors that turn shallow modules into deep ones — present them as a visual HTML report, then grill through whichever one you pick. Use when the user wants to improve a codebase's architecture, find deepening opportunities, or says "this code is hard to change", "the modules are too shallow", "let's improve the architecture".
whenToUse: "(1) Scope: pick where to look from the recent commit history and the project's domain glossary. (2) Explore organically with a sub-agent, looking for shallow modules, hard-to-find concepts, tight coupling across seams, untested parts. (3) Write a self-contained HTML report to the OS temp dir (Tailwind + Mermaid via CDN; one card per candidate with before/after diagram). (4) Open the report, then grill through the chosen candidate."
metadata:
  category: engineering
  scope: architecture
  author: dyno-pony/sprint-4
  upstream: derived from mattpocock/skills (MIT, improve-codebase-architecture)
---

# Codebase Architecture

Surface architectural friction and propose **deepening opportunities** — refactors that turn shallow modules into deep ones. The aim is testability and AI-navigability.

This skill is informed by the project's domain model and built on a shared design vocabulary (see the `domain` skill: **module**, **interface**, **depth**, **seam**, **adapter**, **leverage**, **locality**). Use these terms exactly. Don't drift into "component," "service," "API," or "boundary."

## Process

### 1. Scope (YAGNI)

Deepening a module pays off by making future changes to it easier. **Scope before you scan:** put extra weight on the parts of the codebase that have recently changed.

- If the user named a direction (a module, subsystem, pain point), take it; skip the inference below.
- Otherwise, walk back the commit history (`git log --oneline`) to find the hot spots — files and areas that keep coming up. Let those paths pull attention first. If changes are scattered, widen the net.

Read the project's `CONTEXT.md` (or follow `CONTEXT-MAP.md`) and any ADRs in the area before scanning.

### 2. Explore (sub-agent)

Spawn a sub-agent to walk the codebase. Don't follow rigid heuristics; explore organically and note where friction appears:

- Where does understanding one concept require bouncing between many small modules?
- Where are modules **shallow**, with an interface nearly as complex as the implementation?
- Where have pure functions been extracted just for testability, but the real bugs hide in how they're called (no **locality**)?
- Where do tightly-coupled modules leak across their seams?
- Which parts are untested, or hard to test through their current interface?

Apply the **deletion test**: would deleting this module concentrate complexity, or just move it? A "yes, concentrates" is the signal you want.

### 3. Present candidates as an HTML report

Write a self-contained HTML file to the OS temp directory. Resolve from `$TMPDIR`, fall back to `/tmp` (or `%TEMP%` on Windows). Path: `<tmpdir>/architecture-review-<timestamp>.html` so each run gets a fresh file. **Do not** write to the repo.

The report uses **Tailwind via CDN** for layout and styling, and **Mermaid via CDN** for diagrams. Mix Mermaid (graph-shaped relationships) with hand-crafted CSS/SVG (editorial visuals, mass diagrams). Each candidate gets a **before/after visualisation**. Be visual.

For each candidate, render a card with:

- **Files** — which files/modules are involved.
- **Problem** — why the current architecture causes friction.
- **Solution** — plain English description of what would change.
- **Benefits** — locality + leverage + how tests would improve.
- **Before / After diagram** — side-by-side, custom-drawn.
- **Recommendation strength** — `Strong` / `Worth exploring` / `Speculative`, as a badge.

End with a **Top recommendation** section: which candidate to tackle first and why.

**Use CONTEXT.md vocabulary** for the domain (e.g. "the Order intake module", not "the FooBarHandler", not "the Order service") and the `domain` skill vocabulary for the architecture.

**ADR conflicts:** if a candidate contradicts an existing ADR, only surface it when the friction is real enough to warrant revisiting. Mark it clearly ("contradicts ADR-0007, but worth reopening because…"). Don't list every theoretical refactor an ADR forbids.

Do NOT propose interfaces yet. After the file is written, open it (`xdg-open` / `open` / `start`) and ask: "Which of these would you like to explore?"

### 4. Grilling loop

Once the user picks a candidate, call the `grill` skill (grill-with-docs variant) to walk the decision tree: constraints, dependencies, the shape of the deepened module, what sits behind the seam, what tests survive.

Side effects happen inline as decisions crystallize. Call the `domain` skill to keep the domain model current:

- **Naming a deepened module after a concept not in CONTEXT.md?** Add the term to CONTEXT.md.
- **Sharpening a fuzzy term during the conversation?** Update CONTEXT.md right there.
- **User rejects the candidate with a load-bearing reason?** Offer an ADR ("Want me to record this as an ADR so future architecture reviews don't re-suggest it?"). Skip ephemeral or self-evident reasons.
- **Want to explore alternative interfaces?** Call the `domain` skill's `codebase-design` part and use its design-it-twice parallel sub-agent pattern.
