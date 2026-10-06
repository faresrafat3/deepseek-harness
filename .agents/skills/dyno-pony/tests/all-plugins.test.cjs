// Node.js native test runner for the dyno-pony merged plugin.
// Run with: node --test tests/all-plugins.test.cjs
//
// After the merge, all 34 tools are registered by ONE plugin file
// (packages/dyno-pony.js). This test mounts that file and asserts the
// standard 4 + 3 + 1 properties across all 34 tools, then also verifies
// each original source file (pony.js, caveman.js, ..., trace.js) still
// works in isolation (so we have not lost anything in the merge).

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PACKAGES_DIR = path.join(__dirname, '..', 'packages');

const MERGED_FILE = 'dyno-pony.js';

// Expected tool names, grouped by original source. After the merge, the
// groups are flattened into one tool list.
const TOOLS = [
  // pony (1)
  'ponytail',
  // caveman (1)
  'caveman',
  // orch (4)
  'orch_route', 'orch_compare', 'orch_pipeline', 'orch_status',
  // dsh-author (5)
  'dsh_author_inspect', 'dsh_author_define', 'dsh_author_run', 'dsh_author_validate', 'dsh_author_recover',
  // memo (6)
  'memo_classify', 'memo_format', 'memo_link', 'memo_scope', 'memo_archive', 'memo_review',
  // plugin-test (3)
  'ptest_template', 'ptest_assertions', 'ptest_harness',
  // codex (5)
  'cdx_map', 'cdx_symbols', 'cdx_imports', 'cdx_owner', 'cdx_diff',
  // memory (4)
  'mem_write', 'mem_read', 'mem_search', 'mem_promote',
  // workflow (3)
  'wf_compose', 'wf_run', 'wf_collect',
  // trace (2)
  'trc_mode_flow', 'trc_diff',
  // v1.1 sentinels (3)
  'sphinx', 'drift', 'second_order',
  // v1.2 ultimate (1)
  'ultimate',
];

// Per-tool parameter sanity. Some tools need a `required` field, others don't.
// We just check that properties is a non-null object.
const TOOLS_WITH_REQUIRED = ['memo_classify', 'memo_format', 'dsh_author_define', 'memo_link', 'memo_archive', 'memo_scope', 'ptest_template', 'memo_review', 'dsh_author_run', 'dsh_author_inspect', 'cdx_symbols', 'cdx_imports', 'cdx_owner', 'mem_promote', 'mem_search', 'mem_write', 'mem_read', 'wf_compose', 'wf_run', 'wf_collect', 'trc_diff', 'ponytail', 'caveman'];

function makeFakeHost() {
  const registered = new Map();
  const effects = [];
  const services = new Map();
  const harness = {
    defineTool: (def) => def,
    registerTool: (_ctx, tool) => {
      registered.set(tool.name, tool);
      return () => registered.delete(tool.name);
    },
    handle: () => () => {},
  };
  const ctx = {
    get: (n) => services.get(n),
    on: () => () => {},
    effect: (cb) => { const d = cb(); effects.push(d); return d; },
    provide: (n, v) => { services.set(n, v); return () => services.delete(n); },
  };
  return { ctx, harness, registered, effects, services };
}

function loadPluginBody(file) {
  const body = fs.readFileSync(path.join(PACKAGES_DIR, file), 'utf8');
  return new Function('ctx', 'harness', 'console', 'btoa', 'atob', 'TextEncoder', 'TextDecoder', body);
}

function mount(file) {
  const host = makeFakeHost();
  const fn = loadPluginBody(file);
  const plugin = fn(host.ctx, host.harness, console, btoa, atob, TextEncoder, TextDecoder);
  if (plugin && typeof plugin.apply === 'function') plugin.apply(host.ctx);
  return host;
}

// ----- tests for the MERGED plugin -----

test('merged: dyno-pony.js mounts without throwing', () => {
  assert.doesNotThrow(() => mount(MERGED_FILE));
});

test('merged: registers all 34 tools', () => {
  const host = mount(MERGED_FILE);
  for (const name of TOOLS) {
    assert.ok(host.registered.has(name), `expected tool "${name}" to be registered; got [${[...host.registered.keys()].sort().join(', ')}]`);
  }
  assert.equal(host.registered.size, TOOLS.length, `expected exactly ${TOOLS.length} tools; got ${host.registered.size}`);
});

test('merged: every tool has a valid parameter schema', () => {
  const host = mount(MERGED_FILE);
  for (const name of TOOLS) {
    const tool = host.registered.get(name);
    assert.ok(tool.parameters, `tool "${name}" has no parameters`);
    assert.equal(tool.parameters.type, 'object', `tool "${name}" parameters.type must be "object"`);
    assert.equal(typeof tool.parameters.properties, 'object', `tool "${name}" parameters.properties must be an object`);
  }
});

test('merged: every tool has output block with schema + render', () => {
  const host = mount(MERGED_FILE);
  for (const name of TOOLS) {
    const tool = host.registered.get(name);
    assert.ok(tool.output, `tool "${name}" missing output block`);
    assert.ok(tool.output.schema, `tool "${name}" missing output.schema`);
    assert.equal(typeof tool.output.render, 'function', `tool "${name}" output.render must be a function`);
  }
});

test('merged: every effect returns a disposer', () => {
  const host = mount(MERGED_FILE);
  assert.ok(host.effects.length > 0, 'expected at least one effect; got 0');
  for (const d of host.effects) {
    assert.equal(typeof d, 'function', `disposer must be a function, got ${typeof d}`);
  }
});

test('merged: uses harness.defineTool before registerTool (counts match)', () => {
  const body = fs.readFileSync(path.join(PACKAGES_DIR, MERGED_FILE), 'utf8');
  const defineCount = (body.match(/harness\.defineTool\s*\(/g) || []).length;
  const registerCount = (body.match(/harness\.registerTool\s*\(/g) || []).length;
  // The merged file registers TOOLS.length tools. We expect at least that many defineTool calls
  // (one per tool) and at least that many registerTool calls (one per tool).
  assert.ok(defineCount >= TOOLS.length, `expected at least ${TOOLS.length} defineTool calls, got ${defineCount}`);
  assert.ok(registerCount >= TOOLS.length, `expected at least ${TOOLS.length} registerTool calls, got ${registerCount}`);
});

test('merged: body ends with "};" not "});"', () => {
  const body = fs.readFileSync(path.join(PACKAGES_DIR, MERGED_FILE), 'utf8');
  const trimmed = body.replace(/\s+$/g, '');
  const last2 = trimmed.slice(-2);
  assert.equal(last2, '};', `merged body must end with "};" not "${last2}"`);
});

test('merged: tool render returns a text block (sample: ponytail)', () => {
  const host = mount(MERGED_FILE);
  const tool = host.registered.get('ponytail');
  const rendered = tool.output.render({}, 'sample output');
  assert.ok(Array.isArray(rendered));
  assert.equal(rendered[0].type, 'text');
  assert.equal(typeof rendered[0].text, 'string');
});

// ----- per-tool render sample (one assertion per tool) -----
// 34 separate tests, one per tool. Each mounts the merged plugin and renders
// a sample value. This catches regressions in the output block of any
// individual tool after a re-merge.

for (const name of TOOLS) {
  test(`merged: tool ${name} render returns a text block`, () => {
    const host = mount(MERGED_FILE);
    const tool = host.registered.get(name);
    if (!tool) {
      assert.fail(`tool ${name} not registered`);
      return;
    }
    const rendered = tool.output.render({}, 'sample output');
    assert.ok(Array.isArray(rendered), `${name}: render must return an array`);
    assert.ok(rendered[0], `${name}: render[0] must exist`);
    assert.equal(rendered[0].type, 'text', `${name}: rendered block must be type=text`);
    assert.equal(typeof rendered[0].text, 'string', `${name}: rendered text must be a string`);
  });
}

// ----- regression: each ORIGINAL source file still works in isolation -----
// This guards against the merge losing any per-plugin behavior. We just
// assert it still mounts; the execute.test.cjs file already tests
// behavior.

const ORIGINAL_FILES = [
  'pony.js', 'caveman.js', 'orch.js', 'dsh-author.js', 'memo.js',
  'plugin-test.js', 'codex.js', 'memory.js', 'workflow.js', 'trace.js',
  'sphinx.js', 'drift.js', 'second_order.js',
  'ultimate.js',
];
for (const f of ORIGINAL_FILES) {
  test(`original: ${f} still mounts (regression guard)`, () => {
    assert.doesNotThrow(() => mount(f));
  });
}
