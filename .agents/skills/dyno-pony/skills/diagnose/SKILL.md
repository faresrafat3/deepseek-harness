---
name: diagnose
description: Disciplined diagnosis loop for hard bugs and performance regressions. Use when the user says "diagnose", "debug this", "what's wrong with", reports something broken / throwing / failing / slow / flaky / regressed, or hands you a stack trace with no obvious cause.
whenToUse: "Run a 6-phase diagnosis loop: (1) build a tight feedback loop, (2) reproduce and minimise, (3) hypothesise with 3-5 ranked candidates, (4) instrument, (5) fix + regression test, (6) cleanup. Each phase has a completion criterion; do not skip. The skill is designed to prevent the most common debugging failure: jumping to a hypothesis before you have a loop that goes red on this bug."
metadata:
  category: engineering
  scope: debugging
  author: dyno-pony/sprint-4
  upstream: derived from mattpocock/skills (MIT, diagnosing-bugs)
---

# Diagnose

A discipline for hard bugs. Skip phases only when explicitly justified.

## Redact first

Before showing commands, outputs, or captured artifacts: **redact every secret** (`<REDACTED>` in place). Build loops against env vars, so credentials stay in the environment. If the redacted output is not enough, ask the user.

## Phase 1: Build a feedback loop

**This is the skill.** Everything else is mechanical. With a **tight** pass/fail signal that goes red on *this* bug, the cause is found. Without one, no amount of staring saves you.

### Ways to construct one, in roughly this order

1. **Failing test** at whatever seam reaches the bug (unit, integration, e2e).
2. **Curl / HTTP script** against a running dev server.
3. **CLI invocation** with a fixture, diffing stdout against a known-good snapshot.
4. **Headless browser** (Playwright / Puppeteer) that drives the UI and asserts on DOM/console/network.
5. **Replay a captured trace** (HAR file, log dump, event log) through the code path.
6. **Throwaway harness** — minimal subset of the system that exercises the bug code path.
7. **Property / fuzz loop** — 1000 random inputs, look for the failure mode.
8. **Bisection harness** — automate "boot at state X, check, repeat" so you can `git bisect run`.
9. **Differential loop** — same input through old-version vs new-version, diff outputs.
10. **HITL bash script** — last resort, if a human must click.

### Tighten the loop

Treat it as a product. Once you have *a* loop, ask:

- Can I make it faster? (Skip unrelated init, narrow scope.)
- Can I make the signal sharper? (Assert the specific symptom, not "didn't crash".)
- Can I make it more deterministic? (Pin time, seed RNG, isolate FS, freeze network.)

A 30-second flaky loop is barely better than none. A 2-second deterministic one is a debugging superpower.

### Non-deterministic bugs

Goal: a **higher reproduction rate**. Loop the trigger 100×, parallelise, narrow timing windows. A 50%-flake bug is debuggable; 1% is not.

### When you genuinely cannot build a loop

Stop and say so. List what you tried. Ask the user for: (a) access to the environment, (b) a redacted artifact (HAR, log, core dump, screen recording), (c) permission for temporary production instrumentation. Do not hypothesise without a loop.

### Completion criterion

Phase 1 is done when you can name **one command** (script path, test, curl) you have **already run at least once** (show invocation and redacted output) that is:

- [ ] **Red-capable**: drives the actual bug code path, asserts the user's exact symptom.
- [ ] **Deterministic**: same verdict every run (or a pinned, high reproduction rate).
- [ ] **Fast**: seconds, not minutes.
- [ ] **Agent-runnable**: no human in the loop.

If you catch yourself reading code to build a theory before this command exists, **stop**. Jumping to a hypothesis is the exact failure this skill prevents.

## Phase 2: Reproduce + minimise

Run the loop. Watch it go red as the bug appears.

- [ ] Failure matches the **user's** symptom, not a nearby one. Wrong bug = wrong fix.
- [ ] Reproducible across runs (or at a high rate for non-deterministic).
- [ ] Exact symptom captured for later phases.

**Minimise.** Cut inputs, callers, config, data, steps **one at a time**, re-running the loop after each cut. Keep only what's load-bearing for the failure.

Done when every remaining element is load-bearing: removing any one makes the loop go green.

## Phase 3: Hypothesise

Generate **3–5 ranked hypotheses** before testing any.

Each must be **falsifiable**: "If X is the cause, then changing Y will make the bug disappear / changing Z will make it worse." If you can't state the prediction, it's a vibe: discard or sharpen.

**Show the ranked list to the user** before testing. Domain knowledge re-ranks instantly. Don't block; proceed with your ranking if the user is AFK.

## Phase 4: Instrument

Each probe must map to a specific prediction from Phase 3. **Change one variable at a time.**

Tool preference:

1. **Debugger / REPL inspection** — one breakpoint beats ten logs.
2. **Targeted logs** at the boundaries that distinguish hypotheses.
3. Never "log everything and grep".

**Tag every debug log** with a unique prefix (`[DEBUG-a4f2]`). Cleanup becomes a single grep. Untagged logs survive; tagged logs die.

**Perf branch.** For performance regressions, logs are wrong. Establish a baseline (`performance.now()`, profiler, query plan), then bisect. Measure first, fix second.

## Phase 5: Fix + regression test

Write the regression test **before** the fix, but only if there is a **correct seam** for it.

A correct seam exercises the **real bug pattern** at the call site. If the only seam is too shallow (single-caller when the bug needs multiple callers), a regression test there gives false confidence. **If no correct seam exists, that itself is the finding** — the architecture is preventing lockdown. Flag it.

If a correct seam exists:

1. Turn the minimised repro into a failing test at that seam.
2. Watch it fail.
3. Apply the fix.
4. Watch it pass.
5. Re-run the Phase 1 loop against the original (un-minimised) scenario.

## Phase 6: Cleanup

Required before declaring done:

- [ ] Original repro no longer reproduces (re-run Phase 1 loop).
- [ ] Regression test passes (or absence of seam is documented).
- [ ] All `[DEBUG-...]` instrumentation removed (grep the prefix).
- [ ] Throwaway prototypes deleted or moved to a clearly-marked debug location.
- [ ] The correct hypothesis is stated in the commit / PR message, so the next debugger learns.

## When the diagnosis points to architecture

If the real finding is "there's no good seam to lock the bug down", hand off to `improve-codebase-architecture` with the gap as a deepening opportunity. Architecture-level bugs need architecture-level fixes.
