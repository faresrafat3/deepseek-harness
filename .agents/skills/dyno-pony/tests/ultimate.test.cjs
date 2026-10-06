// ultimate test — 4 standard + 3 optional + 1 bonus + 3 live execute = 11 tests

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
test('ultimate: mounts without throwing', () => {
  assert.doesNotThrow(() => mount('ultimate.js'));
});
test('ultimate: registers the ultimate tool', () => {
  const { registered } = mount('ultimate.js');
  assert.ok(registered.has('ultimate'));
});
test('ultimate: tool has valid parameter schema', () => {
  const { registered } = mount('ultimate.js');
  const t = registered.get('ultimate');
  assert.equal(t.parameters.type, 'object');
  assert.ok(t.parameters.properties.action);
  assert.deepEqual(t.parameters.properties.action.enum, ['on', 'off', 'status']);
});
test('ultimate: tool has output block with schema + render', () => {
  const { registered } = mount('ultimate.js');
  const t = registered.get('ultimate');
  assert.ok(t.output);
  assert.ok(t.output.schema);
  assert.equal(typeof t.output.render, 'function');
});

// 3 optional
test('ultimate: every effect returns a disposer', () => {
  const { effects } = mount('ultimate.js');
  assert.ok(effects.length > 0);
  for (const d of effects) assert.equal(typeof d, 'function');
});
test('ultimate: uses harness.defineTool before registerTool', () => {
  const body = fs.readFileSync(path.join(PACKAGES_DIR, 'ultimate.js'), 'utf8');
  const dc = (body.match(/harness\.defineTool\s*\(/g) || []).length;
  const rc = (body.match(/harness\.registerTool\s*\(/g) || []).length;
  assert.ok(dc >= 1);
  assert.ok(rc >= 1);
});
test('ultimate: body ends with "};" not "});"', () => {
  const body = fs.readFileSync(path.join(PACKAGES_DIR, 'ultimate.js'), 'utf8');
  const trimmed = body.replace(/\s+$/g, '');
  assert.equal(trimmed.slice(-2), '};');
});

// 1 bonus
test('ultimate: tool render returns a text block', () => {
  const { registered } = mount('ultimate.js');
  const t = registered.get('ultimate');
  const rendered = t.output.render({}, 'sample');
  assert.ok(Array.isArray(rendered));
  assert.equal(rendered[0].type, 'text');
});

// 3 live execute
test('ultimate: on action returns the persona overlay and confirms 37 tools', async () => {
  const { registered } = mount('ultimate.js');
  const blocks = await call(registered, 'ultimate', { action: 'on' });
  assert.ok(blocks[0].text.includes('ULTIMATE MODE'));
  assert.ok(blocks[0].text.includes('ARMED'));
  assert.ok(blocks[0].text.includes('37 tools'));
  assert.ok(blocks[0].text.includes('Persona overlay'));
});
test('ultimate: off action returns the disarm message', async () => {
  const { registered } = mount('ultimate.js');
  const blocks = await call(registered, 'ultimate', { action: 'off' });
  assert.ok(blocks[0].text.includes('DISARMED'));
  assert.ok(blocks[0].text.includes('baseline'));
});
test('ultimate: status action returns the arsenal list', async () => {
  const { registered } = mount('ultimate.js');
  const blocks = await call(registered, 'ultimate', { action: 'status' });
  assert.ok(blocks[0].text.includes('STATUS'));
  assert.ok(blocks[0].text.includes('Arsenal'));
  // Spot-check that the arsenal includes sentinels + the merged plugins
  assert.ok(blocks[0].text.includes('sphinx'));
  assert.ok(blocks[0].text.includes('drift'));
  assert.ok(blocks[0].text.includes('second_order'));
  assert.ok(blocks[0].text.includes('ponytail'));
  assert.ok(blocks[0].text.includes('caveman'));
  assert.ok(blocks[0].text.includes('orch_route'));
});
