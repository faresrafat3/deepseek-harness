// drift test — 4 standard + 3 optional + 1 bonus + 3 live execute = 11 tests

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

// 4 required
test('drift: mounts without throwing', () => {
  assert.doesNotThrow(() => mount('drift.js'));
});
test('drift: registers the drift tool', () => {
  const { registered } = mount('drift.js');
  assert.ok(registered.has('drift'));
});
test('drift: tool has valid parameter schema', () => {
  const { registered } = mount('drift.js');
  const t = registered.get('drift');
  assert.equal(t.parameters.type, 'object');
  assert.ok(t.parameters.properties.action);
  assert.deepEqual(t.parameters.properties.action.enum, ['loop', 'contradict', 'silent']);
});
test('drift: tool has output block with schema + render', () => {
  const { registered } = mount('drift.js');
  const t = registered.get('drift');
  assert.ok(t.output);
  assert.ok(t.output.schema);
  assert.equal(typeof t.output.render, 'function');
});

// 3 optional
test('drift: every effect returns a disposer', () => {
  const { effects } = mount('drift.js');
  assert.ok(effects.length > 0);
  for (const d of effects) assert.equal(typeof d, 'function');
});
test('drift: uses harness.defineTool before registerTool', () => {
  const body = fs.readFileSync(path.join(PACKAGES_DIR, 'drift.js'), 'utf8');
  const dc = (body.match(/harness\.defineTool\s*\(/g) || []).length;
  const rc = (body.match(/harness\.registerTool\s*\(/g) || []).length;
  assert.ok(dc >= 1);
  assert.ok(rc >= 1);
});
test('drift: body ends with "};" not "});"', () => {
  const body = fs.readFileSync(path.join(PACKAGES_DIR, 'drift.js'), 'utf8');
  const trimmed = body.replace(/\s+$/g, '');
  assert.equal(trimmed.slice(-2), '};');
});

// 1 bonus
test('drift: tool render returns a text block', () => {
  const { registered } = mount('drift.js');
  const t = registered.get('drift');
  const rendered = t.output.render({}, 'sample');
  assert.ok(Array.isArray(rendered));
  assert.equal(rendered[0].type, 'text');
});

// 3 live execute
test('drift: loop action returns the loop-check procedure', async () => {
  const { registered } = mount('drift.js');
  const blocks = await call(registered, 'drift', { action: 'loop' });
  assert.ok(blocks[0].text.includes('loop check') || blocks[0].text.includes('Procedure'));
  assert.ok(blocks[0].text.includes('Re-read') || blocks[0].text.includes('re-read'));
});
test('drift: contradict action returns the contradiction-check procedure', async () => {
  const { registered } = mount('drift.js');
  const blocks = await call(registered, 'drift', { action: 'contradict' });
  assert.ok(blocks[0].text.includes('contradiction') || blocks[0].text.includes('Contradiction'));
  assert.ok(blocks[0].text.includes('Refinement') || blocks[0].text.includes('refinement'));
});
test('drift: silent action returns the no-op ack', async () => {
  const { registered } = mount('drift.js');
  const blocks = await call(registered, 'drift', { action: 'silent' });
  assert.ok(blocks[0].text.includes('silent') || blocks[0].text.includes('no-op') || blocks[0].text.includes('No loop'));
  assert.ok(blocks[0].text.includes('Continue') || blocks[0].text.includes('continue'));
});
