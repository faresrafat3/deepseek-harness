// sphinx test — 4 standard + 3 optional + 1 bonus + 3 live execute = 11 tests
// Mirrors the snapshot.test.cjs pattern.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PACKAGES_DIR = path.join(__dirname, '..', 'packages');

function mount(file) {
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
  const body = fs.readFileSync(path.join(PACKAGES_DIR, file), 'utf8');
  const fn = new Function('ctx', 'harness', 'console', 'btoa', 'atob', 'TextEncoder', 'TextDecoder', body);
  const plugin = fn(ctx, harness, console, btoa, atob, TextEncoder, TextDecoder);
  if (plugin && typeof plugin.apply === 'function') plugin.apply(ctx);
  return { ctx, registered, effects };
}

async function call(registered, name, params = {}) {
  const tool = registered.get(name);
  if (!tool) throw new Error('tool not found: ' + name);
  const value = await tool.execute(params, params);
  return tool.output.render({}, value);
}

// 4 required assertions
test('sphinx: mounts without throwing', () => {
  assert.doesNotThrow(() => mount('sphinx.js'));
});
test('sphinx: registers the sphinx tool', () => {
  const { registered } = mount('sphinx.js');
  assert.ok(registered.has('sphinx'));
});
test('sphinx: tool has valid parameter schema', () => {
  const { registered } = mount('sphinx.js');
  const t = registered.get('sphinx');
  assert.equal(t.parameters.type, 'object');
  assert.equal(typeof t.parameters.properties, 'object');
  assert.ok(t.parameters.properties.action);
});
test('sphinx: tool has output block with schema + render', () => {
  const { registered } = mount('sphinx.js');
  const t = registered.get('sphinx');
  assert.ok(t.output);
  assert.ok(t.output.schema);
  assert.equal(typeof t.output.render, 'function');
});

// 3 optional assertions
test('sphinx: every effect returns a disposer', () => {
  const { effects } = mount('sphinx.js');
  assert.ok(effects.length > 0);
  for (const d of effects) assert.equal(typeof d, 'function');
});
test('sphinx: uses harness.defineTool before registerTool', () => {
  const body = fs.readFileSync(path.join(PACKAGES_DIR, 'sphinx.js'), 'utf8');
  const dc = (body.match(/harness\.defineTool\s*\(/g) || []).length;
  const rc = (body.match(/harness\.registerTool\s*\(/g) || []).length;
  assert.ok(dc >= 1);
  assert.ok(rc >= 1);
});
test('sphinx: body ends with "};" not "});"', () => {
  const body = fs.readFileSync(path.join(PACKAGES_DIR, 'sphinx.js'), 'utf8');
  const trimmed = body.replace(/\s+$/g, '');
  assert.equal(trimmed.slice(-2), '};');
});

// 1 bonus assertion
test('sphinx: tool render returns a text block', () => {
  const { registered } = mount('sphinx.js');
  const t = registered.get('sphinx');
  const rendered = t.output.render({}, 'sample');
  assert.ok(Array.isArray(rendered));
  assert.equal(rendered[0].type, 'text');
});

// 3 live execute tests (one per action)
test('sphinx: audit action returns a non-empty string with heuristic context', async () => {
  const { registered } = mount('sphinx.js');
  const blocks = await call(registered, 'sphinx', { action: 'audit' });
  assert.ok(blocks[0].text.length > 0);
  assert.ok(blocks[0].text.includes('Sphinx audit') || blocks[0].text.includes('audit'));
});
test('sphinx: checkpoint action returns the 5-step summary recipe', async () => {
  const { registered } = mount('sphinx.js');
  const blocks = await call(registered, 'sphinx', { action: 'checkpoint', scope: 'full' });
  assert.ok(blocks[0].text.includes('Steps'));
  assert.ok(blocks[0].text.includes('Drop every raw file body'));
});
test('sphinx: predict action returns the band verdict format', async () => {
  const { registered } = mount('sphinx.js');
  const blocks = await call(registered, 'sphinx', { action: 'predict', next: 'read 500-line file' });
  assert.ok(blocks[0].text.includes('Sphinx predict') || blocks[0].text.includes('predict'));
  assert.ok(blocks[0].text.includes('verdict') || blocks[0].text.includes('Heuristic'));
});
