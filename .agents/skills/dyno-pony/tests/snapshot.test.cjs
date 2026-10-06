// Snapshot tests: lock the output of select tools for fixed inputs.
// If a tool's output changes, this test fails — protecting against
// accidental regressions in the prompt-overlay text the tools return.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PACKAGES_DIR = path.join(__dirname, '..', 'packages');

function mount(file) {
  const registered = new Map();
  const harness = {
    defineTool: (def) => def,
    registerTool: (_c, t) => { registered.set(t.name, t); return () => registered.delete(t.name); },
    handle: () => () => {},
  };
  const ctx = { get: () => undefined, on: () => () => {}, effect: () => () => {}, provide: () => () => {} };
  const body = fs.readFileSync(path.join(PACKAGES_DIR, file), 'utf8');
  const fn = new Function('ctx', 'harness', 'console', 'btoa', 'atob', 'TextEncoder', 'TextDecoder', body);
  const p = fn(ctx, harness, console, btoa, atob, TextEncoder, TextDecoder);
  p.apply(ctx);
  return registered;
}

async function call(registered, name, params = {}) {
  const tool = registered.get(name);
  const value = await tool.execute(params, params);
  return tool.output.render({}, value);
}

// ---- caveman ----

test('snapshot: caveman(action="terse") starts with "# Caveman — terse"', async () => {
  const r = mount('caveman.js');
  const blocks = await call(r, 'caveman', { action: 'terse', n: 3 });
  const text = blocks[0].text;
  assert.ok(text.startsWith('# Caveman'), 'should start with "# Caveman"; got: ' + text.slice(0, 50));
  assert.ok(text.includes('3'), 'should include the n=3 number');
});

test('snapshot: caveman(action="prose") mentions "prose mode"', async () => {
  const r = mount('caveman.js');
  const blocks = await call(r, 'caveman', { action: 'prose' });
  const text = blocks[0].text;
  assert.ok(text.toLowerCase().includes('prose'), 'should mention prose mode');
  assert.ok(text.toLowerCase().includes('terse'), 'should mention terse as a related mode');
});

// ---- ponytail ----

test('snapshot: ponytail(action="mode", level="full") mentions yagni', async () => {
  const r = mount('pony.js');
  const blocks = await call(r, 'ponytail', { action: 'mode', level: 'full' });
  const text = blocks[0].text;
  assert.ok(text.toLowerCase().includes('yagni'),
    'full mode should mention yagni; got: ' + text.slice(0, 100));
});

test('snapshot: ponytail(action="help") lists the 6 actions', async () => {
  const r = mount('pony.js');
  const blocks = await call(r, 'ponytail', { action: 'help' });
  const text = blocks[0].text;
  for (const action of ['mode', 'review', 'audit', 'debt', 'gain', 'help']) {
    assert.ok(text.includes(action), `help card should mention "${action}"`);
  }
});

// ---- memo ----

test('snapshot: memo_classify(kind="implemented") returns the implemented tier rules', async () => {
  const r = mount('memo.js');
  const blocks = await call(r, 'memo_classify', { kind: 'implemented' });
  const text = blocks[0].text;
  assert.ok(text.toLowerCase().includes('implemented'),
    'should mention the implemented tier; got: ' + text.slice(0, 100));
});

test('snapshot: memo_format(kind="implemented", title="X") contains Problem/Decision/Consequences', async () => {
  const r = mount('memo.js');
  const blocks = await call(r, 'memo_format', { kind: 'implemented', title: 'snapshot test' });
  const text = blocks[0].text;
  for (const header of ['## Problem', '## Decision', '## Consequences']) {
    assert.ok(text.includes(header), `template should contain "${header}"`);
  }
});

// ---- codex ----

test('snapshot: cdx_symbols on a known TS sample returns 3 symbols in fixed order', async () => {
  const r = mount('codex.js');
  const sample = "export const alpha = 1;\nexport function beta() {}\nexport class Gamma {}";
  const blocks = await call(r, 'cdx_symbols', { filePath: '/x.ts', body: sample, language: 'typescript' });
  const text = blocks[0].text;
  // Symbols appear in the order they are found in the body.
  const alphaPos = text.indexOf('alpha');
  const betaPos = text.indexOf('beta');
  const gammaPos = text.indexOf('Gamma');
  assert.ok(alphaPos > 0 && betaPos > 0 && gammaPos > 0, 'all 3 symbols must be present');
  assert.ok(alphaPos < betaPos && betaPos < gammaPos, 'symbols must be in body order');
});

test('snapshot: cdx_imports on a Python sample returns imports in body order', async () => {
  const r = mount('codex.js');
  const sample = "import os\nfrom pathlib import Path\nimport json";
  const blocks = await call(r, 'cdx_imports', { filePath: '/x.py', body: sample, language: 'python' });
  const text = blocks[0].text;
  const osPos = text.indexOf('os');
  const pathPos = text.indexOf('pathlib');
  const jsonPos = text.indexOf('json');
  assert.ok(osPos < pathPos && pathPos < jsonPos, 'imports must be in body order');
});

// ---- memory ----

test('snapshot: mem_promote refuses demotion (snapshot of error text)', async () => {
  const r = mount('memory.js');
  const blocks = await call(r, 'mem_promote', {
    notePath: '/home/fares/.dsh/memory/global/x.md',
    toScope: 'per-agent',
  });
  const text = blocks[0].text;
  assert.ok(text.toLowerCase().includes('refus'),
    'demotion refusal should say "refused" or "refus"');
  assert.ok(text.toLowerCase().includes('not higher'),
    'demotion refusal should explain "not higher"');
});

// ---- plugin-test ----

test('snapshot: ptest_assertions returns exactly 7 numbered items by default', async () => {
  const r = mount('plugin-test.js');
  const blocks = await call(r, 'ptest_assertions', { includeOptional: 'yes' });
  const text = blocks[0].text;
  const numbered = text.match(/^\d+\./gm) || [];
  assert.equal(numbered.length, 7, 'should have exactly 7 numbered assertions');
});

test('snapshot: ptest_assertions without optional returns 4 items', async () => {
  const r = mount('plugin-test.js');
  const blocks = await call(r, 'ptest_assertions', { includeOptional: 'no' });
  const text = blocks[0].text;
  const numbered = text.match(/^\d+\./gm) || [];
  assert.equal(numbered.length, 4, 'should have exactly 4 numbered assertions');
});
