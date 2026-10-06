# dyno-pony — Fares-localized mode + skill set

Dynamic Cordis plugins for the DSH session, plus the DSH-native skills, agent presets, and tooling that activate them. Each piece is a separate, reversible entity that toggles on/off without rebuilding DSH.

## Presets — what runs at session start

A preset is a named composition under `~/.agent-presets/<id>/agent.cordis.yml`. Pick one when you start a session (or set it as the deployment default in `cordis.yml`).

| Preset | Active plugins | Use it when |
|---|---|---|
| **`baseline`** | none | Vanilla DSH, zero overlays. Want a clean session. |
| **`simple`** | pony + caveman + orch | Everyday default. YAGNI + terse prose + smart mode picker. |
| **`pony-mode`** | pony + orch | Coding-only. Lazy mindset + smart routing, no terse prose. |
| **`caveman-mode`** | caveman + orch | Prose-only. Terse replies + smart routing, no lazy mindset. |

**Specialized plugins** (NOT in any preset — toggle on manually when needed): `dsh-author`, `memo`, `plugin-test`, `codex`, `memory`, `workflow`, `trace`.

## Skills — what the model sees in the catalog (10 skills, 42 tools)

Each plugin has a corresponding skill under `~/.dsh/skills/<name>/SKILL.md`. The DSH skill-filesystem provider auto-discovers them; the model loads them on demand.

### Layer 1 — Default overlays (run by default in `simple`)

| Skill | Plugin | Tools | What it does |
|---|---|---|---|
| `ponytail` | `pony-1` / pkg-9 | 1 tool, 6 actions | WHAT to build — lazy senior dev, YAGNI ladder, over-engineering review |
| `caveman` | `cavm-2` / pkg-6 | 1 tool, 4 actions | HOW to talk — terse prose, drop filler |
| `orch` | `orch-3` / pkg-8 | 4 tools | WHICH mode to use — smart dispatch, side-by-side compare, sequential pipeline |

### Layer 2 — Specialized (toggle on per-task)

| Skill | Plugin | Tools | What it does |
|---|---|---|---|
| `dsh-author` | `dsha-4` / pkg-10 | 5 tools | HOW to author a new Dynamic Cordis plugin |
| `memo` | `memo-5` / pkg-11 | 6 tools | HOW to write an Agent Note per DSH AGENTS.md |
| `plugin-test` | `ptst-3` / pkg-9 | 3 tools | HOW to scaffold Vitest specs for dyno-pony plugins |
| `codex` | `cdx-4` / pkg-10 | 5 tools | HOW to map a codebase (read-only archaeology) |
| `memory` | `mem-5` / pkg-11 | 4 tools | HOW to record/recall hierarchical notes (per-agent → global) |
| `workflow` | `wkfl-6` / pkg-12 | 3 tools | HOW to compose orch plans into a real `ctx.workflowEngine` run |
| `trace` | `trc-7` / pkg-13 | 2 tools | HOW to extract dyno-pony mode-flow from session logs |

**Total: 10 plugins, 42 tools, 17 files in user-space.**

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the layered diagram, the design rule, and the boundary conditions. See [docs/ANALYSIS.md](docs/ANALYSIS.md) for the DSH landscape analysis and the rationale for the 5 new specialized plugins.

## Quick start

1. **Pick a preset** at session start (DSH CLI: `--preset simple`).
2. **Or toggle plugins manually**:
   ```
   cordis_run pluginId=pony-1  packageId=pkg-9   mode=run
   cordis_run pluginId=cavm-2  packageId=pkg-6   mode=run
   cordis_run pluginId=orch-3  packageId=pkg-8   mode=run
   cordis_run pluginId=dsha-4  packageId=pkg-10  mode=run  (specialized)
   cordis_run pluginId=memo-5  packageId=pkg-11  mode=run  (specialized)
   cordis_run pluginId=ptst-3  packageId=pkg-9   mode=run  (specialized)
   cordis_run pluginId=cdx-4   packageId=pkg-10  mode=run  (specialized)
   cordis_run pluginId=mem-5   packageId=pkg-11  mode=run  (specialized)
   cordis_run pluginId=wkfl-6  packageId=pkg-12  mode=run  (specialized)
   cordis_run pluginId=trc-7   packageId=pkg-13  mode=run  (specialized)
   ```
3. **Tell me (the model) which tool to invoke**:
   - `caveman(action="prose")` — apply terse prose
   - `ponytail(action="mode", level="full")` — apply lazy mindset
   - `orch_route(task="...")` — let orch pick
   - `orch_compare(task="...")` — 4-arm side-by-side plan
   - `orch_pipeline(stepsJson='[{"mode":"caveman","task":"draft"},{"mode":"pony","task":"simplify"}]')`
   - `cdx_map(root=..., depth=2)` — plan a directory tree walk
   - `mem_write(scope="per-agent", title="...", body="...")` — record a note
   - `wf_compose(stepsJson='...')` — compose an orch plan into a workflow script
   - `trc_mode_flow(sessionId="...")` — extract mode-flow from a session
4. **After DSH restart**: ask the assistant: "rebuild all dyno-pony plugins" — I'll re-run cordis_run for each.

## Forks

| Upstream | Repo | License | Local additions |
|---|---|---|---|
| `DietrichGebert/ponytail` | github.com/DietrichGebert/ponytail | MIT | AR description, single composite tool, soft call-count note |
| `JuliusBrussee/caveman` | github.com/JuliusBrussee/caveman | MIT | AR description, single composite tool, soft call-count note |

Both forks preserve the upstream contracts verbatim and add Fares-local UI text only. No upstream behavior change.

The specialized plugins (`orch`, `dsh-author`, `memo`, `plugin-test`, `codex`, `memory`, `workflow`, `trace`) are Fares-local only; no upstream to attribute.

## Toggle reference

```
cordis_stop   pluginId=pony-1
cordis_stop   pluginId=cavm-2
cordis_stop   pluginId=orch-3
cordis_stop   pluginId=dsha-4
cordis_stop   pluginId=memo-5
cordis_stop   pluginId=ptst-3
cordis_stop   pluginId=cdx-4
cordis_stop   pluginId=mem-5
cordis_stop   pluginId=wkfl-6
cordis_stop   pluginId=trc-7

cordis_run    pluginId=<id> packageId=<pkg> mode=run   # turn back on
```

After a DSH restart, run `rebuild.sh` to rediscover the latest package IDs, then re-run.

## Files

```
dyno-pony/
├── README.md              this file
├── docs/
│   ├── ARCHITECTURE.md    layered architecture + design rule
│   └── ANALYSIS.md        DSH landscape analysis + 5 new plugin candidates
├── rebuild.sh             restart recovery procedure
└── packages/                  (10 source files for cordis_define)
    ├── pony.js            ponytail host function body
    ├── caveman.js         caveman host function body
    ├── orch.js            orchestrator host function body
    ├── dsh-author.js      plugin-author host function body
    ├── memo.js            memo host function body
    ├── plugin-test.js     plugin-test host function body
    ├── codex.js           codex host function body
    ├── memory.js          memory host function body
    ├── workflow.js        workflow host function body
    └── trace.js           trace host function body
```

Companion DSH-native artifacts (auto-discovered at session start):

```
~/.agent-presets/                           DSH agent-presets home (4 presets)
  ├── baseline/agent.cordis.yml             vanilla DSH
  ├── simple/agent.cordis.yml               pony + caveman + orch
  ├── pony-mode/agent.cordis.yml            pony + orch
  └── caveman-mode/agent.cordis.yml         caveman + orch

~/.dsh/skills/                                DSH skill-filesystem home (10 skills)
  ├── ponytail/SKILL.md
  ├── caveman/SKILL.md
  ├── orch/SKILL.md
  ├── dsh-author/SKILL.md
  ├── memo/SKILL.md
  ├── plugin-test/SKILL.md
  ├── codex/SKILL.md
  ├── memory/SKILL.md
  ├── workflow/SKILL.md
  └── trace/SKILL.md
```
