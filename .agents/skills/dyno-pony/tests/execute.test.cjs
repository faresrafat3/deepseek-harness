// Live execution tests — actually call the tool's execute function with
// realistic inputs and verify the returned text block contains what we
// expect. Run with: node --test tests/execute.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PACKAGES_DIR = path.join(__dirname, '..', 'packages');

async function mount(file) {
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
  return registered;
}

async function call(registered, name, params = {}) {
  const tool = registered.get(name);
  if (!tool) throw new Error('tool not found: ' + name);
  // The DSH harness passes the call params as the SECOND argument to execute.
  // Some dyno-pony plugins (caveman, ponytail, dsh-author, memo, orch) read
  // them from the FIRST argument; others (codex, memory, workflow, trace,
  // plugin-test) read from the SECOND. Pass the same params in both slots
  // so every plugin works.
  const value = await tool.execute(params, params);
  return tool.output.render({}, value);
}

// ----- caveman -----

test('caveman: terse action returns the terse-mode text', async () => {
  const r = await mount('caveman.js');
  const blocks = await call(r, 'caveman', { action: 'terse' });
  assert.equal(blocks[0].type, 'text');
  assert.ok(blocks[0].text.includes('terse'), 'output should mention terse');
});

test('caveman: prose action returns the prose-mode text', async () => {
  const r = await mount('caveman.js');
  const blocks = await call(r, 'caveman', { action: 'prose' });
  assert.equal(blocks[0].type, 'text');
  assert.ok(blocks[0].text.length > 50, 'prose output should be non-trivial');
});

test('caveman: reset action returns the reset-mode text', async () => {
  const r = await mount('caveman.js');
  const blocks = await call(r, 'caveman', { action: 'reset' });
  assert.equal(blocks[0].type, 'text');
});

// ----- ponytail -----

test('ponytail: mode action full returns the lazy mindset', async () => {
  const r = await mount('pony.js');
  const blocks = await call(r, 'ponytail', { action: 'mode', level: 'full' });
  assert.equal(blocks[0].type, 'text');
  assert.ok(blocks[0].text.toLowerCase().includes('yagni') || blocks[0].text.toLowerCase().includes('stop'),
    'output should mention yagni or stop');
});

test('ponytail: help action returns the help card', async () => {
  const r = await mount('pony.js');
  const blocks = await call(r, 'ponytail', { action: 'help' });
  assert.equal(blocks[0].type, 'text');
  assert.ok(blocks[0].text.length > 100, 'help card should be substantial');
});

test('ponytail: gain action returns benchmark medians', async () => {
  const r = await mount('pony.js');
  const blocks = await call(r, 'ponytail', { action: 'gain' });
  assert.equal(blocks[0].type, 'text');
});

// ----- orch -----

test('orch: status returns the active plugin list', async () => {
  const r = await mount('orch.js');
  const blocks = await call(r, 'orch_status', {});
  assert.equal(blocks[0].type, 'text');
});

test('orch: route picks a mode for a build task', async () => {
  const r = await mount('orch.js');
  const blocks = await call(r, 'orch_route', { task: 'build a date picker' });
  assert.equal(blocks[0].type, 'text');
  // Should mention one of the modes
  const text = blocks[0].text.toLowerCase();
  assert.ok(text.includes('pony') || text.includes('baseline') || text.includes('caveman'),
    'output should pick a mode; got: ' + text.slice(0, 100));
});

// ----- dsh-author -----

test('dsh_author_inspect returns the 4-step recipe', async () => {
  const r = await mount('dsh-author.js');
  const blocks = await call(r, 'dsh_author_inspect', {});
  assert.equal(blocks[0].type, 'text');
  assert.ok(blocks[0].text.includes('listService') || blocks[0].text.includes('inspect'),
    'output should describe the inspect recipe');
});

test('dsh_author_validate catches the idPrefix bug', async () => {
  const r = await mount('dsh-author.js');
  const buggyCode = "return { idPrefix: 'too-long-prefix', apply: function() {} };";
  const blocks = await call(r, 'dsh_author_validate', { codeHost: buggyCode });
  assert.equal(blocks[0].type, 'text');
  // Should mention the idPrefix issue
  const text = blocks[0].text.toLowerCase();
  assert.ok(text.includes('idprefix') || text.includes('prefix') || text.includes('letter'),
    'output should flag the idPrefix issue; got: ' + text.slice(0, 200));
});

// ----- memo -----

test('memo_classify picks the implemented tier for a known kind', async () => {
  const r = await mount('memo.js');
  const blocks = await call(r, 'memo_classify', { kind: 'implemented' });
  assert.equal(blocks[0].type, 'text');
  assert.ok(blocks[0].text.toLowerCase().includes('implemented') ||
            blocks[0].text.toLowerCase().includes('decision'),
    'output should describe the implemented tier');
});

test('memo_format returns a template for implemented', async () => {
  const r = await mount('memo.js');
  const blocks = await call(r, 'memo_format', { kind: 'implemented', title: 'test decision' });
  assert.equal(blocks[0].type, 'text');
  // Should contain template sections
  const text = blocks[0].text;
  assert.ok(text.includes('## Problem') || text.includes('## Decision') || text.includes('## Context'),
    'output should contain template sections');
});

// ----- codex -----

test('cdx_symbols extracts TypeScript exports', async () => {
  const r = await mount('codex.js');
  const sampleTs = "export const foo = 1;\nexport function bar() {}\nexport class Baz {}";
  const blocks = await call(r, 'cdx_symbols', { filePath: '/tmp/test.ts', body: sampleTs, language: 'typescript' });
  assert.equal(blocks[0].type, 'text');
  const text = blocks[0].text;
  assert.ok(text.includes('foo') && text.includes('bar') && text.includes('Baz'),
    'should extract all 3 symbols; got: ' + text);
});

test('cdx_imports extracts TypeScript imports', async () => {
  const r = await mount('codex.js');
  const sampleTs = "import { a } from 'mod-a';\nimport b from 'mod-b';\nconst c = require('mod-c');";
  const blocks = await call(r, 'cdx_imports', { filePath: '/tmp/test.ts', body: sampleTs, language: 'typescript' });
  assert.equal(blocks[0].type, 'text');
  const text = blocks[0].text;
  assert.ok(text.includes('mod-a') && text.includes('mod-b') && text.includes('mod-c'),
    'should extract all 3 imports; got: ' + text);
});

test('cdx_imports extracts Python imports', async () => {
  const r = await mount('codex.js');
  const samplePy = "import os\nfrom pathlib import Path\nimport json as j";
  const blocks = await call(r, 'cdx_imports', { filePath: '/tmp/test.py', body: samplePy, language: 'python' });
  assert.equal(blocks[0].type, 'text');
  const text = blocks[0].text;
  assert.ok(text.includes('os') && text.includes('pathlib') && text.includes('json'),
    'should extract all 3 Python imports; got: ' + text);
});

// ----- memory -----

test('mem_write plans a write under the right scope', async () => {
  const r = await mount('memory.js');
  const blocks = await call(r, 'mem_write', { scope: 'per-agent', title: 'Test Note', body: 'Body content.' });
  assert.equal(blocks[0].type, 'text');
  const text = blocks[0].text;
  assert.ok(text.includes('Test Note'), 'output should contain the title');
  assert.ok(text.includes('per-agent') || text.includes('memory/per-agent'),
    'output should reference the scope path');
});

test('mem_promote refuses demotion', async () => {
  const r = await mount('memory.js');
  const blocks = await call(r, 'mem_promote', {
    notePath: '/home/fares/.dsh/memory/global/2026-09-02-test.md',
    toScope: 'per-agent',
  });
  assert.equal(blocks[0].type, 'text');
  assert.ok(blocks[0].text.toLowerCase().includes('refus') || blocks[0].text.toLowerCase().includes('not higher'),
    'output should refuse demotion; got: ' + blocks[0].text);
});

test('mem_promote accepts a valid promotion', async () => {
  const r = await mount('memory.js');
  const blocks = await call(r, 'mem_promote', {
    notePath: '/home/fares/.dsh/memory/per-agent/2026-09-02-test.md',
    toScope: 'global',
  });
  assert.equal(blocks[0].type, 'text');
  const text = blocks[0].text;
  assert.ok(text.includes('mv ') || text.includes('move'), 'output should give a move command; got: ' + text);
});

// ----- workflow -----

test('wf_compose generates a workflow script from a 2-step plan', async () => {
  const r = await mount('workflow.js');
  const steps = JSON.stringify([
    { mode: 'caveman', task: 'draft the README' },
    { mode: 'pony', task: 'simplify the draft' },
  ]);
  const blocks = await call(r, 'wf_compose', { stepsJson: steps });
  assert.equal(blocks[0].type, 'text');
  const text = blocks[0].text;
  assert.ok(text.includes('agent(') && text.includes('CAVEMAN') && text.includes('PONYT'),
    'output should include agent() calls with mode overlays');
  assert.ok(text.includes('return '), 'output should end with a return statement');
});

test('wf_compose rejects invalid JSON', async () => {
  const r = await mount('workflow.js');
  const blocks = await call(r, 'wf_compose', { stepsJson: 'not-json' });
  assert.equal(blocks[0].type, 'text');
  assert.ok(blocks[0].text.includes('valid JSON') || blocks[0].text.includes('JSON'),
    'output should mention JSON parse error');
});

// ----- trace -----

test('trc_mode_flow returns a plan referencing the session log', async () => {
  const r = await mount('trace.js');
  const blocks = await call(r, 'trc_mode_flow', { sessionId: 'fake-session-id' });
  assert.equal(blocks[0].type, 'text');
  const text = blocks[0].text;
  assert.ok(text.includes('zstdcat') || text.includes('session.jsonl'),
    'output should reference the session log location');
});

// ----- plugin-test -----

test('ptest_assertions returns 4 required + 3 optional by default', async () => {
  const r = await mount('plugin-test.js');
  const blocks = await call(r, 'ptest_assertions', { includeOptional: 'yes' });
  assert.equal(blocks[0].type, 'text');
  const text = blocks[0].text;
  // Count "1.", "2.", "3.", "4.", "5.", "6.", "7." — expect 7 numbered items
  const numbered = text.match(/^\d+\./gm) || [];
  assert.ok(numbered.length >= 7, 'should list 7 numbered assertions; got ' + numbered.length);
});

test('ptest_template returns a vitest spec body', async () => {
  const r = await mount('plugin-test.js');
  const blocks = await call(r, 'ptest_template', {
    toolName: 'testTool',
    pluginId: 'test-1',
    packageId: 'pkg-1',
  });
  assert.equal(blocks[0].type, 'text');
  const text = blocks[0].text;
  assert.ok(text.includes('describe('), 'should contain describe()');
  assert.ok(text.includes('testTool'), 'should reference the tool name');
  assert.ok(text.includes('test-1'), 'should reference the pluginId');
});
