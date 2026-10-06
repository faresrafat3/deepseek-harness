// second_order test — 4 standard + 3 optional + 1 bonus + 3 live execute = 11 tests

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
test('second_order: mounts without throwing', () => {
  assert.doesNotThrow(() => mount('second_order.js'));
});
test('second_order: registers the second_order tool', () => {
  const { registered } = mount('second_order.js');
  assert.ok(registered.has('second_order'));
});
test('second_order: tool has valid parameter schema', () => {
  const { registered } = mount('second_order.js');
  const t = registered.get('second_order');
  assert.equal(t.parameters.type, 'object');
  assert.ok(t.parameters.properties.action);
  assert.ok(t.parameters.properties.change);
});
test('second_order: tool has output block with schema + render', () => {
  const { registered } = mount('second_order.js');
  const t = registered.get('second_order');
  assert.ok(t.output);
  assert.ok(t.output.schema);
  assert.equal(typeof t.output.render, 'function');
});

// 3 optional
test('second_order: every effect returns a disposer', () => {
  const { effects } = mount('second_order.js');
  assert.ok(effects.length > 0);
  for (const d of effects) assert.equal(typeof d, 'function');
});
test('second_order: uses harness.defineTool before registerTool', () => {
  const body = fs.readFileSync(path.join(PACKAGES_DIR, 'second_order.js'), 'utf8');
  const dc = (body.match(/harness\.defineTool\s*\(/g) || []).length;
  const rc = (body.match(/harness\.registerTool\s*\(/g) || []).length;
  assert.ok(dc >= 1);
  assert.ok(rc >= 1);
});
test('second_order: body ends with "};" not "});"', () => {
  const body = fs.readFileSync(path.join(PACKAGES_DIR, 'second_order.js'), 'utf8');
  const trimmed = body.replace(/\s+$/g, '');
  assert.equal(trimmed.slice(-2), '};');
});

// 1 bonus
test('second_order: tool render returns a text block', () => {
  const { registered } = mount('second_order.js');
  const t = registered.get('second_order');
  const rendered = t.output.render({}, 'sample');
  assert.ok(Array.isArray(rendered));
  assert.equal(rendered[0].type, 'text');
});

// 3 live execute
test('second_order: trace action returns the 2-hop causal chain', async () => {
  const { registered } = mount('second_order.js');
  const blocks = await call(registered, 'second_order', { action: 'trace', change: 'rm foo.txt' });
  assert.ok(blocks[0].text.includes('Second-order trace'));
  assert.ok(blocks[0].text.includes('Hop 1') || blocks[0].text.includes('direct effect'));
  assert.ok(blocks[0].text.includes('Hop 2') || blocks[0].text.includes('second-order effect'));
});
test('second_order: blast action returns the blast-radius enumeration', async () => {
  const { registered } = mount('second_order.js');
  const blocks = await call(registered, 'second_order', { action: 'blast', change: 'delete preset' });
  assert.ok(blocks[0].text.includes('Second-order blast'));
  assert.ok(blocks[0].text.includes('Callers') || blocks[0].text.includes('callers'));
  assert.ok(blocks[0].text.includes('Tests') || blocks[0].text.includes('tests'));
});
test('second_order: gate action returns GO/HOLD/REDESIGN verdict format', async () => {
  const { registered } = mount('second_order.js');
  const blocks = await call(registered, 'second_order', { action: 'gate', change: 'add a tool', reason: 'no callers' });
  assert.ok(blocks[0].text.includes('verdict'));
  assert.ok(blocks[0].text.includes('GO'));
  assert.ok(blocks[0].text.includes('HOLD'));
  assert.ok(blocks[0].text.includes('REDESIGN'));
});
