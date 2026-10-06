---
name: domain
description: Build and sharpen a project's domain model. Use when discussing codebase terminology, writing or editing a CONTEXT.md, recording an ADR, designing a module's interface, choosing where a seam goes, or making code more testable. Also reaches for the deep-module vocabulary (module, interface, depth, seam, adapter, leverage, locality) when designing or restructuring.
whenToUse: "Two related disciplines, one skill. (1) Domain modeling: actively challenge fuzzy terms, sharpen with scenarios, update CONTEXT.md and ADRs inline. (2) Codebase design: shared vocabulary for deep modules — a small interface, a lot of behaviour, behind a clean seam, testable through that interface."
metadata:
  category: engineering
  scope: design
  author: dyno-pony/sprint-4
  upstream: derived from mattpocock/skills (MIT, domain-modeling + codebase-design)
---

# Domain + Codebase Design

Two related disciplines, one skill.

**Domain modeling** is the active discipline of sharpening the project's *language* — the words and the relationships between them. Most projects have a single `CONTEXT.md` glossary; larger ones have a `CONTEXT-MAP.md` pointing to per-context `CONTEXT.md` files. ADRs (Architecture Decision Records) hold the load-bearing decisions.

**Codebase design** is the shared vocabulary for *modules* — a lot of behaviour behind a small interface, at a clean seam, testable through that interface. Reach for it whenever code is being designed or restructured.

## Part 1: Domain modeling

### When to reach for it

- The user is using a term that conflicts with `CONTEXT.md`.
- The user uses a fuzzy or overloaded word ("account" doing three jobs).
- A domain relationship is being discussed; stress-test it with edge cases.
- A term has been resolved; capture it now, don't batch it up.

### File structure

Most repos have a single context:

```
/
├── CONTEXT.md
├── docs/
│   └── adr/
│       ├── 0001-event-sourced-orders.md
│       └── 0002-postgres-for-write-model.md
```

If a `CONTEXT-MAP.md` exists at the root, the repo has multiple contexts. Follow the map to the right `CONTEXT.md`.

Create files **lazily** — only when you have something to write. If no `CONTEXT.md` exists, create one when the first term is resolved. If no `docs/adr/` exists, create it when the first ADR is needed.

### During a session

1. **Challenge against the glossary.** When the user uses a term that conflicts, call it out: "Your glossary defines X as Y, but you seem to mean Z. Which is it?"
2. **Sharpen fuzzy language.** "You're saying 'account': do you mean the Customer or the User?"
3. **Discuss concrete scenarios.** Stress-test the relationship with a specific edge case that forces a boundary decision.
4. **Cross-reference with code.** When the user says how something works, check the code. If they disagree, surface it.
5. **Update CONTEXT.md inline.** Right there, not later.
6. **Offer ADRs sparingly** — only when all three are true:
   - **Hard to reverse** — changing your mind later is meaningful.
   - **Surprising without context** — a future reader will wonder "why?".
   - **Real trade-off** — there were genuine alternatives.

## Part 2: Codebase design vocabulary

Use these terms exactly. Don't substitute "component," "service," "API," or "boundary."

| Term | Meaning |
|---|---|
| **Module** | Anything with an interface and an implementation. Scale-agnostic: function, class, package, tier. |
| **Interface** | Everything a caller must know: types, invariants, ordering, error modes, performance. |
| **Implementation** | What's inside a module. |
| **Depth** | Leverage at the interface: behaviour per unit of interface a caller learns. |
| **Seam** | A place you can alter behaviour without editing in that place (Feathers). The location of the interface. |
| **Adapter** | A concrete thing that satisfies an interface at a seam. |
| **Leverage** | What callers get from depth. More capability per unit of interface. |
| **Locality** | What maintainers get from depth. Change, bugs, knowledge, verification concentrate in one place. |

### Deep vs shallow

- **Deep** = small interface + lots of implementation (good).
- **Shallow** = large interface + little implementation (avoid).

When designing, ask: can I reduce methods? simplify params? hide more inside?

### Principles

- **Depth is a property of the interface**, not the implementation.
- **The deletion test.** Imagine deleting the module. If complexity vanishes, it was a pass-through. If it reappears across N callers, it was earning its keep.
- **The interface is the test surface.** Callers and tests cross the same seam.
- **One adapter = hypothetical seam. Two = real.** Don't introduce a seam unless something actually varies across it.

### Designing for testability

1. **Accept dependencies, don't create them.** Inject the gateway.
2. **Return results, don't produce side effects.** Compute, don't mutate.
3. **Small surface area.** Fewer methods = fewer tests. Fewer params = simpler setup.

### Relationships

- A **Module** has one **Interface**.
- **Depth** is measured against the **Interface**.
- A **Seam** is where the **Interface** lives.
- An **Adapter** sits at a **Seam** and satisfies the **Interface**.
- **Depth** produces **Leverage** for callers and **Locality** for maintainers.

## Rejected framings (do not use these terms)

- **Depth as lines-of-implementation / lines-of-interface** (Ousterhout): rewards padding. We use depth-as-leverage.
- **"Interface" as the TypeScript `interface` keyword**: too narrow.
- **"Boundary"**: overloaded with DDD's bounded context. Say **seam** or **interface**.

## How the two parts combine

- The domain language (CONTEXT.md) gives *names* to good seams.
- The codebase-design vocabulary gives the *shape* of a module.
- `tdd` writes tests at pre-agreed seams.
- `improve-codebase-architecture` finds deepening opportunities.
- `grill-with-docs` calls this skill inline to keep both in sync.
