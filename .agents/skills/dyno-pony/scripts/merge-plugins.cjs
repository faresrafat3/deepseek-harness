#!/usr/bin/env node
// merge-plugins.js — combine all 10 packages/*.js into a single
// packages/dyno-pony.js that registers all tools under one plugin.
//
// Strategy:
//   - For each source file, evaluate it with a fake harness + ctx to capture
//     the apply function's source via Function.prototype.toString.
//   - Strip the "function (ctx) { ... }" wrapper, get the body.
//   - Concatenate all 10 bodies, each wrapped in an IIFE so local `note`,
//     `stringOutput`, and other names don't collide.

'use strict';

const fs = require('fs');
const path = require('path');

const PKG_DIR = path.join(__dirname, '..', 'packages');
const OUT = path.join(PKG_DIR, 'dyno-pony.js');

const ORDER = [
  'pony.js',
  'caveman.js',
  'orch.js',
  'dsh-author.js',
  'memo.js',
  'plugin-test.js',
  'codex.js',
  'memory.js',
  'workflow.js',
  'trace.js',
  // dyno-pony v1.1: session sentinels (sprint 2)
  'sphinx.js',        // context budget governor
  'drift.js',         // live loop/contradiction detector
  'second_order.js',  // think one step past the change
  // dyno-pony v1.2: ultimate mode (sprint 3)
  'ultimate.js',      // one-shot "arm everything" persona overlay
];

const HEADER =
  "// Source-of-truth for the dyno-pony dynamic plugin (v1, merged).\n" +
  "//\n" +
  "// Combines all 10 historical plugins (pony, caveman, orch, dsh-author, memo,\n" +
  "// plugin-test, codex, memory, workflow, trace) into ONE plugin. Re-apply with:\n" +
  "//   cordis_define plugin kind=existing pluginId=dp-1 ...\n" +
  "//\n" +
  "// Tool count: 37 (orig+sentinels) + 1 (ultimate) = 38 tools.\n" +
  "//\n" +
  "// Each section is wrapped in an IIFE so locals like `note`, `stringOutput`,\n" +
  "// `session`, `POOL_KEY` do not collide. The merged plugin keeps the exact\n" +
  "// behavior of each original.\n" +
  "//\n" +
  "// Toggle the whole bundle with one cordis_stop / cordis_run.\n" +
  "\n" +
  "return {\n" +
  "  apply(ctx) {\n" +
  "    const disposers = [];\n" +
  "\n";

const FOOTER =
  "\n" +
  "    ctx.effect(function () { return function dispose() {\n" +
  "      for (let i = 0; i < disposers.length; i++) { try { disposers[i](); } catch (_e) {} }\n" +
  "    }; }, 'dyno-pony:dispose-all');\n" +
  "  },\n" +
  "};\n";

function extractInner(filePath) {
  const body = fs.readFileSync(filePath, 'utf8');
  const lines = body.split('\n');
  let startIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('//')) { startIdx = i; break; }
  }
  const bodyNoComments = lines.slice(startIdx).join('\n');
  let applySource = null;
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('ctx', 'harness', 'console', bodyNoComments);
    const fakeHarness = {
      defineTool: function (def) { return def; },
      registerTool: function () { return function () {}; },
      handle: function () { return function () {}; },
    };
    const fakeCtx = {
      get: function () { return undefined; },
      on: function () { return function () {}; },
      effect: function () { return function () {}; },
      provide: function () { return function () {}; },
    };
    const plugin = fn(fakeCtx, fakeHarness, console);
    if (plugin && typeof plugin.apply === 'function') {
      applySource = plugin.apply.toString();
    }
  } catch (e) {
    throw new Error('failed to evaluate ' + filePath + ': ' + e.message);
  }
  if (!applySource) throw new Error('no apply in ' + filePath);
  // applySource may be:
  //   "function (ctx) { ... }"
  //   "apply(ctx) { ... }"
  //   "(ctx) => { ... }"
  //   "async function (ctx) { ... }"
  // Try the most common forms.
  const patterns = [
    /^function\s*\(ctx\)\s*\{([\s\S]*)\}\s*$/,
    /^async\s+function\s*\(ctx\)\s*\{([\s\S]*)\}\s*$/,
    /^apply\(ctx\)\s*\{([\s\S]*)\}\s*$/,
    /^\(ctx\)\s*=>\s*\{([\s\S]*)\}\s*$/,
    /^async\s*\(ctx\)\s*=>\s*\{([\s\S]*)\}\s*$/,
  ];
  for (const p of patterns) {
    const m = applySource.match(p);
    if (m) return m[1];
  }
  throw new Error('cannot strip apply wrapper in ' + filePath + '\nsource:\n' + applySource.slice(0, 200));
}

const allNames = new Set();
const out = [];

for (const f of ORDER) {
  const full = path.join(PKG_DIR, f);
  if (!fs.existsSync(full)) {
    console.error('skip missing: ' + f);
    continue;
  }
  const ns = f.replace(/\.js$/, '');
  const inner = extractInner(full);
  const namesInSection = [];
  const re = /name:\s*['"]([a-zA-Z_][\w]*)['"]/g;
  let m;
  while ((m = re.exec(inner)) !== null) {
    const n = m[1];
    if (allNames.has(n)) throw new Error('duplicate tool name "' + n + '" in ' + f);
    allNames.add(n);
    namesInSection.push(n);
  }
  console.log(f + ': ' + namesInSection.length + ' tools [' + namesInSection.join(', ') + ']');

  // Each section may have multiple `harness.registerTool(ctx, X)` calls.
  // Replace them with `disposers.push(harness.registerTool(ctx, X));` so we
  // can dispose all of them in one effect.
  let section = inner.replace(
    /harness\.registerTool\(([^,]+),\s*([^)]+)\)\s*;/g,
    'disposers.push(harness.registerTool($1, $2));'
  );
  // Some sections also do `ctx.effect(() => d, '<label>')` where d is the
  // disposer from registerTool. Those still work because the IIFE scope has
  // the d. We just want the disposers array to be visible to the parent.
  // (It is — it's in the parent apply() scope.)

  out.push('    // ============================================================================\n');
  out.push('    // ' + ns + ' (' + namesInSection.length + ' tools)\n');
  out.push('    // ============================================================================\n');
  out.push('    (function () {\n');
  out.push(section);
  out.push('    })();\n');
}

const final = HEADER + out.join('') + FOOTER;
fs.writeFileSync(OUT, final);
console.log('');
console.log('merged → ' + OUT);
console.log('total tools: ' + allNames.size);
console.log('total size: ' + (final.length / 1024).toFixed(1) + ' KB');
