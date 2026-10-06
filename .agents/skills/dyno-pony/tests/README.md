# dyno-pony test suite

Live test suite for all 10 dyno-pony plugins. Uses **Node.js native test runner** — no external dependencies.

## Run

```sh
cd Projects/deepseek-harness/.agents/skills/dyno-pony
node --test tests/
```

Output: `tests N, pass N, fail 0` (after a green run).

## What it tests

### `all-plugins.test.cjs` — 80 tests, 8 per plugin

The 4 required assertions (per `ptest_assertions`):

1. `mounts without throwing` — `apply()` runs without exception.
2. `registers expected tools` — every named tool in the source map is in the registry.
3. `tools have valid parameter schemas` — `parameters.type === "object"` + `properties` is an object.
4. `tools have output block with schema + render` — `output.schema` defined, `output.render` is a function.

Plus the 3 optional assertions:

5. `every effect returns a disposer` — `ctx.effect()` callbacks return `() => void`.
6. `uses harness.defineTool before registerTool` — source contains at least N of each.
7. `body ends with "};" not "});"` — common bug check.

Plus the bonus assertion:

8. `tool render returns a text block` — `output.render({}, 'sample')` returns `[{ type: 'text', text: string }]`.

### `execute.test.cjs` — 23 tests, live execute calls

Each test mounts the plugin, calls the tool's `execute()` with realistic inputs, awaits the value, and renders it. Then asserts on the rendered text:

- `caveman`: terse / prose / reset
- `ponytail`: mode / help / gain
- `orch`: status / route
- `dsh-author`: inspect / validate (catches idPrefix bug)
- `memo`: classify / format
- `codex`: symbols on real TypeScript, imports on TS + Python
- `memory`: write / promote (refuses demotion, accepts valid promotion)
- `workflow`: compose (valid 2-step plan + invalid JSON)
- `trace`: mode_flow
- `plugin-test`: assertions (7 numbered) / template

## What it does NOT test

- Real `ctx.fs`, `ctx.workflowEngine`, `ctx.sessions` access (those services require the actual DSH host; here we use a fake `ctx`).
- Real DSH tool registry behavior (we use a `Map` as the fake registry).
- The real `cordis_define` / `cordis_run` flow (we load the plugin body in isolation).

## Why this is enough

The dyno-pony plugins follow a strict pattern: pure function body, `harness.defineTool` + `harness.registerTool`, `ctx.effect` for disposal. By mounting each plugin in a fake host and asserting on the standard 4 + 3 + 1 properties plus live execute behavior, we cover:

- Contract: every tool has the right shape.
- Disposal: every effect has a disposer.
- Convention: the body ends with `};` not `});`.
- Live behavior: each tool returns a renderable string when called with realistic input.

What we miss: integration with the DSH host services. That's covered by the host's own test suite (`pnpm run test` from the harness checkout) and by the manual smoke test of the running session.

## Files

```
dyno-pony/tests/
├── all-plugins.test.cjs    80 tests — 8 assertions × 10 plugins
└── execute.test.cjs        23 tests — live tool execution
```

Total: **103 tests, 100% green** as of the last run.

## CI

These tests run with `node --test` from the harness checkout. They have no external dependencies, so they can run anywhere Node 22.19+ is available.
