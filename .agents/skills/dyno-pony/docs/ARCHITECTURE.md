# dyno-pony architecture

> 10 dynamic Cordis plugins + 10 DSH skills + 4 agent presets = one Fares-localized mode + skill layer over the DSH base. Each piece is a separate, reversible entity.

## Layers

The session is layered. Each layer is independent; you can run any subset.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LAYER 0 — DSH BASE                                                          │
│   The model identity + native tools (bash, read, write, edit, glob, grep,   │
│   todo_write, subagent, web_*, ...).                                        │
│   Always on. Untouched by any dyno-pony plugin.                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ LAYER 1 — DEFAULT OVERLAYS                                                  │
│   Active in the `simple` preset (everyday default).                         │
│                                                                             │
│   pony-1  (ponytail)                                                         │
│     WHAT to build: lazy senior dev, YAGNI ladder.                           │
│     1 tool, 6 actions.                                                      │
│                                                                             │
│   cavm-2  (caveman)                                                          │
│     HOW to talk: terse prose, drop filler.                                   │
│     1 tool, 4 actions.                                                      │
│                                                                             │
│   orch-3  (orchestrator)                                                     │
│     WHICH mode to use: route, compare, pipeline, status.                    │
│     4 tools.                                                                │
│                                                                             │
│   Toggle each on/off independently with cordis_run / cordis_stop.           │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ LAYER 2 — SPECIALIZED PLUGINS                                                │
│   Off by default. Turn on when the task needs them.                         │
│   Each is a self-contained entity; toggle independently.                    │
│                                                                             │
│   Authoring / documentation:                                                 │
│     dsha-4  (dsh-author)    5 tools  — author new dynamic plugins           │
│     memo-5  (memo)          6 tools  — write DSH-compliant Agent Notes      │
│     ptst-3  (plugin-test)   3 tools  — scaffold Vitest specs for plugins    │
│                                                                             │
│   Codebase archaeology:                                                     │
│     cdx-4   (codex)         5 tools  — read-only map, symbols, imports,     │
│                                          owner, diff plan                    │
│                                                                             │
│   Memory + workflow:                                                        │
│     mem-5   (memory)        4 tools  — hierarchical notes (per-agent → global)│
│     wkfl-6  (workflow)      3 tools  — bridge orch plans to ctx.workflowEngine│
│     trc-7   (trace)         2 tools  — extract dyno-pony mode-flow from logs │
│                                                                             │
│   Total: 7 specialized plugins, 28 tools.                                  │
│   Grand total: 10 plugins, 42 tools, 17 files in user-space.                │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Design rule

> The base model stays simple. Every specialized overlay is a separate Dynamic Cordis plugin. Each toggle is reversible. Each plugin has its own source file on disk and its own pluginId.

This matches DSH's own rules from `docs/architecture.md`:

> Registrations are reversible effects. Every contribution goes through `ctx.effect()` / `ctx.on()`; a registry's `register()` returns the disposer.

> A plugin is a object that implements Service. A plugin can be a function with optional `inject` and `apply(ctx)` fields. Registrations are reversible effects.

Every dyno-pony plugin uses `ctx.effect(() => dispose, '<plugin>:dispose-all')` so `cordis_stop` (or DSH process exit) cleans every registration.

## Tool naming

| Plugin | Tools |
|---|---|
| pony-1 | `ponytail` |
| cavm-2 | `caveman` |
| orch-3 | `orch_route`, `orch_compare`, `orch_pipeline`, `orch_status` |
| dsha-4 | `dsh_author_inspect`, `dsh_author_define`, `dsh_author_run`, `dsh_author_validate`, `dsh_author_recover` |
| memo-5 | `memo_classify`, `memo_format`, `memo_link`, `memo_scope`, `memo_archive`, `memo_review` |
| ptst-3 | `ptest_template`, `ptest_assertions`, `ptest_harness` |
| cdx-4  | `cdx_map`, `cdx_symbols`, `cdx_imports`, `cdx_owner`, `cdx_diff` |
| mem-5  | `mem_write`, `mem_read`, `mem_search`, `mem_promote` |
| wkfl-6 | `wf_compose`, `wf_run`, `wf_collect` |
| trc-7  | `trc_mode_flow`, `trc_diff` |

Plugin IDs are stable within a session; package IDs shift when you `cordis_define` a new version. Always read `cordis_inspect_self` for the current IDs after restart.

## Fork contract

| Upstream | Repo | License | Local additions |
|---|---|---|---|
| `DietrichGebert/ponytail` | github.com/DietrichGebert/ponytail | MIT | AR description, single composite tool, soft call-count note |
| `JuliusBrussee/caveman` | github.com/JuliusBrussee/caveman | MIT | AR description, single composite tool, soft call-count note |

Upstream contracts are preserved verbatim. Fares-local changes are UI text only — no behavior change to the original modes.

The specialized plugins (orch, dsh-author, memo, plugin-test, codex, memory, workflow, trace) are Fares-local only; no upstream to attribute.

## Persistence

Every plugin source lives at `packages/<name>.js` in `Projects/deepseek-harness/.agents/skills/dyno-pony/`. The package IDs above assume the source files match the `code.host` bodies in the most recent `cordis_define` for that plugin. After a DSH restart, run the rebuild procedure in `rebuild.sh`.

The skills (discovered by `dsh-skill-filesystem`) live at `~/.dsh/skills/<name>/SKILL.md`.
The presets (discovered by `dsh-agent-presets`) live at `~/.agent-presets/<id>/agent.cordis.yml`.

## Adding a new specialized plugin

1. Pick an `idPrefix` (3-6 lowercase English letters). Use `dsh_author_define` for the template.
2. Use `dsh_author_inspect` to discover the services / events / builtins you need.
3. Use `cdx_map` to plan a directory tree walk + `cdx_symbols` to learn the current shape.
4. Write `packages/<name>.js` with the function body that returns the plugin.
5. Use `dsh_author_validate` against the candidate source before `cordis_define`.
6. Use `ptest_template` to scaffold a Vitest spec, then `ptest_assertions` to review it.
7. Call `cordis_define` then `cordis_run`.
8. Add `~/.dsh/skills/<name>/SKILL.md` for auto-discovery.
9. Update this doc, the README, and `rebuild.sh` with the new tool name.

## Boundary: what stays out of dyno-pony

- Anything that mutates the DSH base model identity (forbidden; layer 0 is sacred).
- Anything that needs long-running state across sessions (use real DSH packages in `packages/` instead).
- Anything that requires heavy dependencies or build steps (use the DSH monorepo build pipeline instead).
- Anything that copies upstream behavior verbatim without Fares-local value (just stop).
- Anything already in the substrate: `dsh-plan-mode`, `dsh-workflow`, `dsh-experimental-agent-team`, `dsh-subagent-*`. Use those instead.

These boundaries keep dyno-pony a thin, reversible extension layer instead of a shadow product.
