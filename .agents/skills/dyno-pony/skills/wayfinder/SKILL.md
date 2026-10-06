---
name: wayfinder
description: Plan a huge chunk of work (more than one agent session can hold) as a shared map of decision tickets on the issue tracker, and resolve them one at a time until the way to the destination is clear. Use when the user has a foggy, multi-session effort — a greenfield project, a huge feature build, a migration — and the way from here to the destination isn't visible yet.
whenToUse: "Wayfinder charts a **shared map** of **decision tickets** (questions whose resolution is a decision, not slices of a build) on the issue tracker, then works the tickets one at a time. When the way clears, hand off (don't build): merge onto the main flow at `to-spec`, which collapses the map's linked decisions into a buildable plan, then `to-tickets` and `implement` as usual."
metadata:
  category: engineering
  scope: planning
  author: dyno-pony/sprint-4
  upstream: derived from mattpocock/skills (MIT, wayfinder)
---

# Wayfinder

A loose idea has arrived, too big for one agent session, wrapped in fog: the way from here to the **destination** isn't visible yet. Wayfinding is about finding that way, not charging at the destination. This skill charts the way as a **shared map** on the repo's issue tracker, then works its **decision tickets** (questions whose resolution is a decision, not slices of a build to execute) one at a time until the route is clear.

The destination varies per effort, and naming it is the first act of charting: it shapes every ticket. It might be a spec to hand off and iterate on, a decision to lock before planning starts, or a change made in place like a data-structure migration. The map is domain-agnostic.

The issue tracker is configured by the `tracker` skill (local markdown by default at `~/.dsh/tracker/`).

## Plan, don't do

Wayfinder is **planning** by default: each ticket resolves a decision, and the map is done when the way is clear, with nothing left to decide before someone goes and does the thing. The pull to just do the work is usually the signal you've reached the edge of the map and it's time to hand off. An effort can override this in its **Notes**, carrying execution into the map itself, but absent that, produce decisions, not deliverables.

## Refer by name

Every map and ticket is an issue, so it has a **name**: its title. In everything the human reads, refer to it by that name, never by a bare id, number, or slug. A wall of `#42, #43, #44` is illegible; names read at a glance. The id and URL don't vanish; a name wraps its link, but they ride *inside* the name, never stand in for it.

## The map

The map is a single issue on this repo's issue tracker, labelled `wayfinder:map`, the canonical artifact. Its tickets are child issues of the map.

The map is an **index**, not a store. It lists the decisions made and points at the tickets that hold their detail; a decision lives in exactly one place, its ticket, so the map never restates it, only gists it and links.

For the local markdown tracker: write the map as `~/.dsh/tracker/issues/01-wayfinder-<slug>.md` with `state: needs-triage` overridden by a `kind: wayfinder-map` front-matter key. Tickets live alongside as `<NN>-<slug>.md` with a `kind: wayfinder-ticket` key and a `parent: 01` reference.

### The map body

```markdown
---
kind: wayfinder-map
state: needs-triage
created: 2026-09-05
---

# <Map title>

## Destination

<what reaching the end of this map looks like: the spec, decision, or change this effort is finding its way to. One or two lines; every session orients to it before choosing a ticket.>

## Notes

<domain; skills every session should consult; standing preferences for this effort>

## Decisions so far

<!-- the index: one line per closed ticket, enough to judge relevance, then zoom the link for the detail the ticket holds -->

- [<closed ticket title>](issues/<NN>-<slug>.md): <one-line gist of the answer>

## Not yet specified

<!-- see "Fog of war": in-scope fog you can't ticket yet; graduates as the frontier advances -->

## Out of scope

<!-- see "Out of scope": work ruled beyond the destination; closed, never graduates -->
```

### Tickets

Each ticket is a **child issue** of the map; the tracker's issue id is its identity. Its body is the question, sized to one ~150k token agent session:

```markdown
---
kind: wayfinder-ticket
parent: 01
type: research | prototype | grilling | task
state: needs-triage
created: 2026-09-05
---

# <Ticket title>

**Blocked by:** the numbers/titles of the tickets that gate this one, or "None (can start immediately)".

## Question

<the decision or investigation this ticket resolves>
```

A session **claims** a ticket by assigning it to the dev driving the map, **first**, before any work, so concurrent sessions skip it. For the local tracker, this means editing the ticket's front-matter to set `assignee: <user>`. That assignee _is_ the claim: an open, unassigned ticket is unclaimed.

Blocking uses the tracker's **native** dependency relationship: essential because it renders the frontier *visually* in the tracker's own UI, so the human sees what's takeable without opening the map. Only a tracker that lacks native blocking falls back to a body convention. A ticket is **unblocked** when every ticket blocking it is closed; the **frontier** is the open, unblocked, unclaimed children, the edge of the known.

The answer isn't part of the body; it's recorded on resolution (see "Work through the map"). Assets created while resolving a ticket are linked from the issue, not pasted in.

## Ticket types

Every ticket is either **HITL** (human in the loop, worked *with* a human who speaks for themselves) or **AFK**, driven by the agent alone. A HITL ticket only resolves through that live exchange; the agent never stands in for the human's side of it (a grilling agent that answers its own questions has broken this).

- **Research** (AFK) — Reading documentation, third-party APIs, or local resources like knowledge bases to surface a fact a decision waits on. Use the `research` skill.
- **Prototype** (HITL) — Raise the fidelity of the discussion by making a cheap, rough, concrete artifact to react to. Use the `prototype` skill.
- **Grilling** (HITL) — Conversation. The default case. Use the `grill` skill (grill-with-docs variant) and the `domain` skill.
- **Task** (HITL or AFK) — Manual work that must happen before a *decision* can be made. The agent drives it alone where it can (AFK); otherwise it hands the human a precise checklist (HITL). Resolved when the work is done; the answer records what was done and any resulting facts (credentials location, new URLs, row counts) later tickets depend on.

## Fog of war

The map is _deliberately_ incomplete: don't chart what you can't yet see. Beyond the live tickets lies the **fog of war**: the dim view of decisions and investigations you can tell are coming but can't yet pin down, because they hang on questions still open. Resolving a ticket clears the fog ahead of it, graduating whatever's now specifiable into fresh tickets, one at a time, until the way to the destination is clear and no tickets remain.

The map's **Not yet specified** section is where that dim view is written down: the suspected question, the area to revisit later.

**Fog or ticket?** The test is whether you can state the question precisely now, _not_ whether you can answer it now.

- **Ticket when** the question is already sharp, even if it's blocked and you can't act on it yet.
- **Not yet specified when** you can't yet phrase it that sharply. Don't pre-slice the fog into ticket-sized pieces: it's coarser than a ticket, and one patch may graduate into several tickets, or none, once the frontier reaches it.

**Not yet specified** excludes what's already decided (Decisions so far), what's already a live ticket, and what's out of scope (the next section).

## Out of scope

Fog only ever gathers _toward_ the destination. The destination fixes the scope, so work beyond it is **out of scope**: it isn't fog, and it doesn't belong in **Not yet specified**. It gets its own **Out of scope** section on the map: work you've consciously ruled out of _this_ effort. Scope, not sharpness, lands it here.

Out-of-scope work never graduates (the frontier stops at the destination), so it returns only if the destination is redrawn, and then as a fresh effort, not a resumption.

## Invocation

Two modes. Either way, **never resolve more than one ticket per session**, with the exception of research tickets.

### Chart the map

User invokes with a loose idea.

1. **Name the destination.** Call the `grill` skill (grill-with-docs variant) and the `domain` skill to pin down what this map is finding its way to: the spec, decision, or change.
2. **Map the frontier.** Grill again, **breadth-first**: fan out across the whole space rather than deep on any one thread, surfacing the open decisions and the first steps takeable now. **If this surfaces no fog** (the way to the destination is already clear, the whole journey small enough for one session), you don't need a map.
3. **Create the map** (label `wayfinder:map`): Destination and Notes filled in, Decisions-so-far empty, the fog sketched into **Not yet specified**.
4. **Create the tickets you can specify now** as child issues of the map, then wire blocking edges in a **second pass**. Wiring sorts them into the frontier and the blocked; everything you can't yet specify stays in the fog.
5. **Fire the research sub-agents** (use the `research` skill). For each `research` ticket you just created, spin up a subagent to resolve it in parallel.
6. Stop: charting is one session's work; it hand-resolves nothing.

### Work through the map

User invokes with a map (path or number). A ticket is **optional**: without one, you pick the next decision, not the user.

1. Load the **map**: the low-res view, not every ticket body.
2. Choose the ticket. If the user named one, use it. Otherwise take the first frontier ticket in order. **Claim it**: assign it to yourself before any work.
3. Resolve it. **Zoom as needed**: fetch the full body of any related or closed ticket on demand; call the skills the `## Notes` block names.
4. Record the resolution: post the answer as a **resolution comment**, **close** the issue, and **append a context pointer** to the map's Decisions-so-far.
5. Add newly-surfaced tickets (create-then-wire); graduate any fog the answer has made specifiable, clearing each graduated patch from **Not yet specified**.

The user may run unblocked tickets in parallel, so expect other sessions to be editing the tracker concurrently.
