// Conformance test: assert the DSH convention that tool.execute reads from
// the SECOND argument (params), not the first.
//
// Background: the DSH harness passes the call params as `args` in the second
// slot. Reading from the first slot is non-conformant. We assert that the
// body source uses `params.<field>` (not `_args.<field>`) in the execute body.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PACKAGES_DIR = path.join(__dirname, '..', 'packages');

const PLUGINS = [
  // All plugins should now read from 2nd arg (params). This is the DSH convention.
  { file: 'pony.js',        tool: 'ponytail',    firstArgName: '_args',  readFromFirst: false, compliance: 'compliant' },
  { file: 'caveman.js',     tool: 'caveman',     firstArgName: '_args',  readFromFirst: false, compliance: 'compliant' },
  { file: 'orch.js',        tool: 'orch_status', firstArgName: '_args',  readFromFirst: false, compliance: 'compliant' },
  { file: 'dsh-author.js',  tool: 'dsh_author_inspect', firstArgName: '_args', readFromFirst: false, compliance: 'compliant' },
  { file: 'memo.js',        tool: 'memo_classify', firstArgName: '_args', readFromFirst: false, compliance: 'compliant' },
  { file: 'plugin-test.js', tool: 'ptest_assertions', firstArgName: '_args', readFromFirst: false, compliance: 'compliant' },
  { file: 'codex.js',       tool: 'cdx_owner',   firstArgName: '_args',  readFromFirst: false, compliance: 'compliant' },
  { file: 'memory.js',      tool: 'mem_promote', firstArgName: '_args',  readFromFirst: false, compliance: 'compliant' },
  { file: 'workflow.js',    tool: 'wf_compose',  firstArgName: '_args',  readFromFirst: false, compliance: 'compliant' },
  { file: 'trace.js',       tool: 'trc_mode_flow', firstArgName: '_args', readFromFirst: false, compliance: 'compliant' },
  // v1.1 sentinels
  { file: 'sphinx.js',      tool: 'sphinx',      firstArgName: '_args',  readFromFirst: false, compliance: 'compliant' },
  { file: 'drift.js',       tool: 'drift',       firstArgName: '_args',  readFromFirst: false, compliance: 'compliant' },
  { file: 'second_order.js', tool: 'second_order', firstArgName: '_args', readFromFirst: false, compliance: 'compliant' },
  { file: 'ultimate.js', tool: 'ultimate', firstArgName: '_args', readFromFirst: false, compliance: 'compliant' },
];

for (const { file, tool, firstArgName, readFromFirst, compliance } of PLUGINS) {
  test(`convention: ${file} tool ${tool} reads from ${readFromFirst ? '1st' : '2nd'} arg (${compliance})`, () => {
    const body = fs.readFileSync(path.join(PACKAGES_DIR, file), 'utf8');
    // Find the execute function for the named tool and look at its signature.
    const toolStart = body.indexOf("name: '" + tool + "'");
    assert.ok(toolStart > 0, `tool ${tool} not found in ${file}`);
    const after = body.slice(toolStart, toolStart + 4000);
    const execMatch = after.match(/execute:\s*(?:async\s+)?function\s*\(([^)]*)\)/);
    assert.ok(execMatch, `execute signature not found for ${tool} in ${file}`);
    const args = execMatch[1].split(',').map((s) => s.trim()).filter((s) => s);
    // For zero-arg tools, just assert the signature is `()` or `(_args)` or
    // `(_args, params)`. The convention requirement is on tools that DO read
    // from params.
    if (args.length === 0) {
      // zero-arg execute: convention is trivially satisfied.
      return;
    }
    assert.equal(args[0], firstArgName, `expected first arg "${firstArgName}", got "${args[0]}"`);

    // For compliant plugins, assert the body reads from `params.X` not `_args.X`.
    if (!readFromFirst) {
      // Extract execute body (until next `,` at column 6 or until `};` at column 6).
      // Simple heuristic: the line containing the tool name onwards, 30 lines.
      const bodyStart = body.indexOf('execute:', toolStart);
      const bodySlice = body.slice(bodyStart, bodyStart + 4000);
      // Look for a usage of `params.<something>`.
      assert.ok(/params\.\w+/.test(bodySlice), `compliant plugin ${file} tool ${tool} must read from params.<field>`);
    } else {
      // For old plugins, assert the body reads from `_args.X`.
      const bodyStart = body.indexOf('execute:', toolStart);
      const bodySlice = body.slice(bodyStart, bodyStart + 4000);
      assert.ok(/_args\.\w+/.test(bodySlice), `old plugin ${file} tool ${tool} must read from _args.<field>`);
    }
  });
}

test('convention summary: all 14 plugins are now 2nd-arg compliant', () => {
  const oldPlugins = PLUGINS.filter((p) => p.compliance === 'old');
  assert.equal(oldPlugins.length, 0,
    `expected zero "old" plugins; found: ${oldPlugins.map((p) => p.file).join(', ')}`);
});

// ----- merged plugin: every tool's execute reads from 2nd arg (params) -----
// The merged file (packages/dyno-pony.js) bundles all 34 tools in one file.
// We extract each tool's execute signature and assert it reads from `params.X`.
test('convention: merged dyno-pony.js has all tools 2nd-arg compliant', () => {
  const body = fs.readFileSync(path.join(PACKAGES_DIR, 'dyno-pony.js'), 'utf8');
  // Find every "name: 'X'" and within 4000 bytes, look for "execute:".
  const re = /name:\s*'([a-zA-Z_][\w]*)'/g;
  let m;
  const toolCount = 38;
  const checked = [];
  while ((m = re.exec(body)) !== null) {
    const name = m[1];
    const start = m.index;
    const after = body.slice(start, start + 4000);
    const execMatch = after.match(/execute:\s*(?:async\s+)?function\s*\(([^)]*)\)/);
    if (!execMatch) continue; // some tools may not have execute in the slice
    const args = execMatch[1].split(',').map((s) => s.trim()).filter((s) => s);
    if (args.length === 0) { checked.push(name + ' (zero-arg)'); continue; }
    // 1-arg execute: reads from `_args` only (no params needed). Compliant.
    if (args.length === 1) { assert.equal(args[0], '_args', `merged: tool "${name}" first arg should be "_args", got "${args[0]}"`); checked.push(name + ' (1-arg)'); continue; }
    // 2-arg execute: must be `(_args, params)`.
    assert.equal(args[0], '_args', `merged: tool "${name}" first arg should be "_args", got "${args[0]}"`);
    assert.equal(args[1], 'params', `merged: tool "${name}" second arg should be "params", got "${args[1]}"`);
    checked.push(name);
  }
  assert.ok(checked.length >= toolCount, `expected to check at least ${toolCount} tools in merged file, checked ${checked.length}: [${checked.join(', ')}]`);
});
