# dyno-pony — DSH Landscape Analysis

> Discovery pass against the DSH substrate to inform what `dyno-pony` should and should not add.
> Written after a 4-pass read of `AGENTS.md` files, the architecture map, the extension cookbook,
> the subsystem pages for `core` / `skill` / `workflow` / `experimental/agent-team` / `plan-mode`,
> and the skill catalog of the harness source.

## 1. What dyno-pony is, in DSH terms

| Concept | DSH location | dyno-pony location |
|---|---|---|
| Plugins | `packages/<group>/<pkg>/` (built, persistent) | `~/.dsh/profiles/<session>/` (session-scoped, dynamic) |
| Tools | `ctx.tools.register()` from a `defineTool` body | `harness.registerTool(ctx, harness.defineTool(tool))` from a `cordis_define` body |
| Skills | `~/.dsh/skills/<name>/SKILL.md` (auto-discovered) | `~/.dsh/skills/ponytail/...` etc. (same path, same auto-discovery) |
| Agent presets | `~/.agent-presets/<id>/agent.cordis.yml` | `~/.agent-presets/{baseline,simple,pony-mode,caveman-mode}/...` (same path) |
| Mode/policy injection | `ctx.systemPrompt.section()` from a host plugin | Dynamic plugin that returns a prompt overlay (the model applies it) |

**Conclusion:** dyno-pony is a **session-scoped, user-authored extension layer** that lives in the
exact same user-space locations the harness allocates for end-user customizations. It does not
modify the substrate. Every dyno-pony piece is reversible through `cordis_stop` or by deleting
its directory.

## 2. What the substrate already gives us, and what it does not

| Capability | Substrate | dyno-pony adds |
|---|---|---|
| Smart mode dispatch | ✗ (no built-in concept) | ✓ `orch` plugin |
| Lazy mindset / YAGNI discipline | ✗ (Fares-local fork of upstream) | ✓ `pony-1` plugin |
| Terse prose | ✗ (Fares-local fork of upstream) | ✓ `cavm-2` plugin |
| Plugin authoring aid | partial — `cordis-plugin-development` skill exists, but no model-facing tools | ✓ `dsha-4` plugin (5 tools) |
| Agent Note writing | partial — `dsh-archive-agent-notes` skill exists for archivals | ✓ `memo-5` plugin (6 tools) |
| Plan mode | ✓ `dsh-plan-mode` package | nothing to add (use it) |
| Agent Teams | ✓ `dsh-experimental-agent-team` + `tool-agent-team` | nothing to add (opt-in experimental) |
| Workflow engine | ✓ `dsh-workflow` + `tool-workflow` | nothing to add (use it) |
| Subagents | ✓ `dsh-subagent-*` providers | nothing to add |
| Codebase map | ✗ (no shipped tool) | candidate below (`codex` plugin) |
| Hierarchical memory | ✗ (the substrate has `ctx.sessions`, no built-in note store) | candidate below |
| Session mode-flow recording | ✗ (cookbook lists `SessionTelemetryBackend` for full traces; no mode-trace) | candidate below |
| Plugin testing aid | partial — `verify-application-entrypoints` etc. are gates, not model tools | candidate below |

**Conclusion:** the substrate covers orchestration primitives; dyno-pony fills the mode-discipline
and authoring-aid gaps that are explicitly **Fares-local** (or forks of external projects), and
stays out of the orchestration primitives that the substrate already provides.

## 3. The 5 candidate specialized plugins (from the discovery pass)

Each is **toggle on per-task**, **session-scoped**, and **reversible**. Each is small (one
function body in `packages/<name>.js` plus a `SKILL.md`).

### 3.1 `codex` — codebase map (read-only archaeology)

**Why:** DSH has a `dsh-find-simplifications` skill that is a *workflow* skill; it tells the
model how to *find* simplifications. There is no **tool** the model can call to ask
"what's in this repo at a glance". Before the model can review or simplify, it needs a map.

**Tools (5):**
- `codex_map(root?, depth?)` — returns directory tree with file counts and language markers.
- `codex_symbols(path?)` — returns top-level exported symbols (TypeScript / Python) for a path.
- `codex_imports(path?)` — returns import graph edges for a file.
- `codex_owner(file)` — returns the owning package + subsystem page + closest Agent Note.
- `codex_diff(baseline)` — returns the file-level diff against a git ref (read-only; no apply).

**Boundary:** read-only. No edits, no writes. The model gets a map; the model still uses `read`
to open anything it wants to act on.

**Status:** proposal. Not yet built.

---

### 3.2 `workflow` — composable pipelines (compose pony + caveman + workflowEngine)

**Why:** the substrate ships `dsh-workflow` for **subagent orchestration scripts**. dyno-pony's
`orch` plugin handles **mode dispatch** (which mode to use). The bridge — "use a real workflow
*and* apply modes inside it" — is missing. The model can write a workflow script, but there is
no tool that says "here is a pony-mode + caveman-mode pipeline, run it as a workflow".

**Tools (3):**
- `wf_compose(planJson)` — converts an `orch_pipeline` plan into a workflow script body.
- `wf_run(script, argsJson?)` — submits the composed script to `ctx.workflowEngine.start()`.
- `wf_collect(runId, timeoutMs?)` — waits for the run and returns the final JSON value.

**Boundary:** thin layer. Does not duplicate `dsh-workflow`; calls into it. Stays in user-space.

**Risk:** `ctx.workflowEngine` access from a dynamic plugin depends on the dynamic plugin
running inside a Fiber where that service is available. **Verify with `cordis_inspect_list`**
before building; the dynamic plugin mechanism in this harness exposes `ctx` to the host body,
but `ctx.workflowEngine` may be on a Fiber this plugin does not reach. If it does not reach,
either expose via `harness.handle()` or downgrade to **client-only** (plan a script, let the
model submit it via the substrate's `workflow` tool).

**Status:** proposal, gated on the injectability check.

---

### 3.3 `memory` — hierarchical recall (per-agent / per-group / per-company / global)

**Why:** the home `AGENTS.md` declares a memory hierarchy. The substrate has `ctx.sessions`
(durable session log) but no built-in note store keyed by hierarchy level. Pony's `gain()`
returns published medians; what is missing is **Fares-local recall** — "what did I learn about
this topic in past sessions, scoped to this group".

**Tools (4):**
- `mem_write(scope, title, body, tagsCsv?)` — append a note at the chosen scope.
- `mem_read(scope?, tagsCsv?, k?)` — return the k most recent matching notes.
- `mem_search(query, scope?)` — keyword search over scope.
- `mem_promote(noteId, toScope)` — move a note up the hierarchy (per-agent → per-group → ...).

**Boundary:** on-disk notes under `~/.dsh/memory/<scope>/<date>-<slug>.md`. Read/write only in
the memory path; never touches source code or the DSH substrate.

**Status:** proposal, but a small spike (read/write one note) is cheap to validate first.

---

### 3.4 `trace` — session mode-flow recording

**Why:** the substrate has `SessionTelemetryBackend` for full session traces. dyno-pony has
`orch_compare` which produces **arm outputs** (4-arm plan, file outputs). There is no
**mode-flow trace** — "in this session, the model called `caveman(2)` then `ponytail(1)` then
`orch_route(1)`, in this order, producing these effects". That data is in the session log; no
tool extracts just the mode-flow.

**Tools (2):**
- `trace_mode_flow(sessionId?)` — return the ordered mode invocations for the session.
- `trace_diff(sessionA, sessionB)` — compare two sessions' mode flows.

**Boundary:** reads from `ctx.sessions` projection. The dynamic plugin only needs the session
log, not the full LLM trace.

**Status:** proposal, gated on the same injectability check as `workflow`.

---

### 3.5 `plugin-test` — authoring test templates for dyno-pony plugins

**Why:** the `dsh-author` plugin helps the model **write** plugins. The substrate has gates
(`pnpm run test:coverage`, `verify-application-entrypoints`) for **shipped** packages, but
these gates do not cover dynamic plugins (which live in `~/.dsh/`, outside the build graph).
A new plugin author has no scaffolding for "write a test for this `defineTool` body".

**Tools (3):**
- `ptest_template(toolName, sourcePath)` — emit a Vitest spec template that mounts the plugin
  into a stub `ctx` and asserts the tool's `name` and parameter schema.
- `ptest_assertions(toolName)` — emit the standard 4 assertions (defined, schema valid,
  `ctx.effect()` disposer present, `defineTool` wrapped).
- `ptest_harness(toolName)` — emit a fake-`ctx.ts` builder that simulates `harness.defineTool`
  + `harness.registerTool` enough to construct the plugin in isolation.

**Boundary:** generator, not runner. The model still runs `pnpm vitest` from the harness
checkout. The plugin just **emits** the file contents.

**Status:** proposal, smallest of the five (no runtime dependency on substrate state).

---

## 4. Order to build (recommendation)

| Order | Plugin | Why this order |
|---|---|---|
| 1 | `plugin-test` (3.5) | Self-contained; smallest surface; can test dyno-pony itself. |
| 2 | `codex` (3.1) | Read-only; unblocks any other code-archaeology work. |
| 3 | `memory` (3.3) | Small disk layer; cheap spike first. |
| 4 | `workflow` (3.2) | Gated on injectability; needs `codex` for context. |
| 5 | `trace` (3.4) | Builds on `workflow` + `memory` patterns. |

This order keeps each plugin **independent** and **toggle-able** per the dyno-pony contract.
None of them modify the DSH substrate; all live in the user-space.

## 5. What dyno-pony explicitly does NOT do

- **No modification of `packages/`.** The substrate is read-only territory for dyno-pony.
- **No `cordis.yml` row in any profile.** Dyno-pony plugins are dynamic, not persistent.
- **No new user-facing commands.** Skills register as model-facing tools, not slash commands;
  the substrate already provides `/plan`, `/goal`, `/loop` for human-facing entry points.
- **No attempt to compete with the substrate.** `dsh-plan-mode` is the plan tool;
  `dsh-workflow` is the workflow tool; `dsh-experimental-agent-team` is the team tool.
  dyno-pony is the Fares-local **modes** layer that composes on top.
- **No ship of pre-release features.** If a candidate plugin needs an experimental substrate
  feature (e.g. `ctx.agentTeams`), the plugin is **gated** until the user explicitly opts in.

## 6. References used in this analysis

- `/home/fares/Projects/deepseek-harness/AGENTS.md` — workspace standing orders.
- `/home/fares/Projects/deepseek-harness/docs/architecture.md` — extension-point map.
- `/home/fares/Projects/deepseek-harness/docs/AGENTS.md` — doc tier taxonomy.
- `/home/fares/Projects/deepseek-harness/docs/cookbook/extension-cookbook.md` — feature→mechanism table.
- `/home/fares/Projects/deepseek-harness/docs/subsystems/core.md` — agent / agent-loop / scope.
- `/home/fares/Projects/deepseek-harness/packages/skill/skill/README.md` — `ctx.skills` registry.
- `/home/fares/Projects/deepseek-harness/packages/skill/skill-filesystem/README.md` — user-skill discovery.
- `/home/fares/Projects/deepseek-harness/packages/workflow/workflow/README.md` — `ctx.workflowEngine`.
- `/home/fares/Projects/deepseek-harness/packages/experimental/agent-team/README.md` — team domain.
- `/home/fares/Projects/deepseek-harness/packages/experimental/tool-agent-team/README.md` — team tools.
- `/home/fares/Projects/deepseek-harness/packages/plan/plan-mode/README.md` — plan mode contract.
- `/home/fares/Projects/deepseek-harness/packages/preset/agent-presets/README.md` — preset roster rules.
- `/home/fares/Projects/deepseek-harness/packages/preset/agent-presets/presets/standard/agent.cordis.yml` — example composition row.
- `/home/fares/Projects/deepseek-harness/.agents/skills/dsh-code-review/SKILL.md` — review-grade standing rules.
- `/home/fares/Projects/deepseek-harness/.agents/skills/dsh-find-simplifications/SKILL.md` — what counts as a strong simplification candidate (applied here as the standard for "what counts as a strong *addition* candidate").

## 7. Open questions (do not block, but ask before any candidate is built)

1. **`ctx.workflowEngine` injectability:** can a dynamic Cordis plugin reach it? (verify with
   `cordis_inspect_list` and a probe body.) If not, the `workflow` candidate is downgraded to
   **plan-only** (emit a script, let the model submit it).
2. **`ctx.sessions` projection access:** same question for `trace`. Dynamic plugins may not
   get the projection seam.
3. **Memory persistence scope:** are the `~/.dsh/memory/<scope>/` notes **per-user** or
   **per-machine**? The home AGENTS.md says hierarchical but does not say where notes live.
4. **`codex` performance:** walking the directory tree on every call is fine for a single
   repo, but for monorepos (DSH is one) the model may want a cached map. The candidate keeps
   the map in-process; cache invalidation on edit is the model's job (it just calls again).
