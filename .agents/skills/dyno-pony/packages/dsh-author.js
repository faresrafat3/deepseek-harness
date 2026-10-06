// Source-of-truth for the dsh-author specialized plugin (v1).
// Re-apply with: cordis_define plugin kind=existing pluginId=dsha-4 ...
//
// Specialized plugin for authoring Dynamic Cordis plugins.
// Toggle on when writing a new dynamic plugin, off when done.
// Composes with pony (lazy mindset) and orch (workflow), does not depend on them.
//
// Five tools:
//   - dsh_author_inspect : progressive discovery (services/events/tools/builtins)
//   - dsh_author_define  : returns a code.host template for the user to fill
//   - dsh_author_run     : returns the cordis_run invocation pattern
//   - dsh_author_validate: catches the 4 most common mistakes
//   - dsh_author_recover : given pluginId, returns the rebuild commands

return {
  apply(ctx) {
    const POOL_KEY = 'dsh_author.callCount';
    const session = ctx.get('sessions');
    if (session && typeof session.current === 'function' && session.current()) {
      const s = session.current();
      if (s && !s[POOL_KEY]) s[POOL_KEY] = 0;
    }

    const note = function (text) {
      const s = session && session.current && session.current();
      if (s) s[POOL_KEY] = (s[POOL_KEY] || 0) + 1;
      if (s && s[POOL_KEY] > 10) {
        return text + '\n\n[dsh-author] Note: ' + s[POOL_KEY] + ' calls. Consider stopping the plugin when done authoring.';
      }
      return text;
    };

    const stringOutput = {
      schema: { type: 'string' },
      render: function (_args, value) { return [{ type: 'text', text: String(value) }]; },
    };

    // -------------------------------------------------------------------------
    // Tool 1: dsh_author_inspect — progressive discovery helper.
    // Returns a copy-paste recipe, NOT a real call (we cannot make tool calls
    // from inside execute). The model uses this as a guide.
    // -------------------------------------------------------------------------
    const inspectTool = {
      name: 'dsh_author_inspect',
      description: 'Returns the standard 4-step inspect recipe for authoring a Dynamic Cordis plugin: list providers, query service, query event, list builtins. Use as a guide before writing code.host or code.client. Specialized plugin — toggle off when done.',
      parameters: {
        type: 'object',
        properties: {
          target: { type: 'string', enum: ['host', 'client'], description: 'Which platform to inspect. Default: host.' },
        },
      },
      output: stringOutput,
      execute: async function (_args, params) {
        const target = (_args && params.target) || 'host';
        return note([
          '# dsh_author_inspect — ' + target + ' recipe',
          '',
          '1. List providers:',
          '   cordis_inspect_list  → returns provider + method catalog',
          '',
          '2. Pick the service / event / tool you want:',
          '   cordis_inspect_query platform=' + target + ' provider=Service method=listService',
          '',
          '3. If you need a builtin (harness, console, ctx):',
          '   cordis_inspect_query platform=' + target + ' provider=Builtin method=listBuiltins',
          '',
          '4. After defining, run cordis_inspect_self to confirm source:',
          '   cordis_inspect_self pluginId=<id> packageId=<pkg>',
          '',
          'Hard rules for Dynamic Cordis:',
          '- plugin.idPrefix: 3-6 lowercase English letters (caveman = too long, use cavm)',
          '- Each value of code is a plain JS function body that RETURNS a Cordis plugin.',
          '- No TypeScript, no JSX, no imports.',
          '- Code runs as the body of an async function. Closing `});` is wrong.',
          '- harness.registerTool requires the tool to come from harness.defineTool(...).',
          '- harness.defineTool output must include { schema, render } (and optional presentationMeta).',
          '- parameters may be additionalProperties: false (object node) or implicit open root.',
          '- ctx.effect() and ctx.on() are reversible; always keep the disposer.',
          '',
          'Use this recipe before every define. Do not guess names.',
        ].join('\n'));
      },
    };

    // -------------------------------------------------------------------------
    // Tool 2: dsh_author_define — returns the JSON-template you fill.
    // -------------------------------------------------------------------------
    const defineTool = {
      name: 'dsh_author_define',
      description: 'Returns the cordis_define parameter template for a new plugin. Fill the slots, then call cordis_define with the result. Specialized plugin.',
      parameters: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: ['new', 'existing'], description: 'new (first version) or existing (next package of an existing plugin). Default: new.' },
          idPrefix: { type: 'string', description: '3-6 lowercase letters for new plugins. Examples: pony, cavm, orch, dsha, memo.' },
          existingPluginId: { type: 'string', description: 'Required when kind=existing. Example: pony-1, cavm-2, orch-3.' },
          toolName: { type: 'string', description: 'If the plugin registers a model-facing tool, name it here. Use camelCase or single word.' },
        },
        required: ['kind'],
      },
      output: stringOutput,
      execute: async function (_args, params) {
        const kind = (_args && params.kind) || 'new';
        const idPrefix = _args && params.idPrefix;
        const existingPluginId = _args && params.existingPluginId;
        const toolName = _args && params.toolName;
        let pluginBlock;
        if (kind === 'existing') {
          pluginBlock = '{ kind: "existing", pluginId: "' + (existingPluginId || '<existingPluginId>') + '" }';
        } else {
          if (!idPrefix || idPrefix.length < 3 || idPrefix.length > 6) {
            return 'idPrefix must be 3-6 lowercase English letters. Got: ' + JSON.stringify(idPrefix);
          }
          pluginBlock = '{ kind: "new", idPrefix: "' + idPrefix + '" }';
        }
        const toolBlock = toolName
          ? '\nYour plugin should register a tool named: `' + toolName + '`.\n\nPattern:\nconst tool = {\n  name: "' + toolName + '",\n  description: "...",\n  parameters: { ... },  // parameter DSL\n  output: { schema: { type: "string" }, render: (_args, value) => [{ type: "text", text: String(value) }] },\n  execute: async (_args) => { ... },\n};\nconst dispose = harness.registerTool(ctx, harness.defineTool(tool));\nctx.effect(() => dispose, "<plugin>:<tool>:dispose-on-fork");'
          : '\nNo toolName given. Your plugin may register commands, skills, services, listeners, or run side effects.';
        return note([
          '# dsh_author_define — template',
          '',
          'Fill this template, then call:',
          '',
          'cordis_define(',
          '  plugin: ' + pluginBlock + ',',
          '  name: "<short-name-with-version>",  // e.g. "memo-tool-v1"',
          '  purpose: "<one-sentence user-facing description>",',
          '  code: {',
          '    host: "<plain JS function body that RETURNS a Cordis plugin>"',
          '  }',
          ')',
          '',
          toolBlock,
          '',
          'Constraints (from prior runs):',
          '- code values are plain JS function bodies — no TypeScript, no JSX, no import.',
          '- The host body runs as the body of an async function. End with `};`, not `});`.',
          '- plugin.idPrefix must be 3-6 lowercase letters. (caveman is 7, use cavm.)',
          '- harness.defineTool requires output: { schema, render }. Schema is required.',
          '- parameters.minItems / parameters.items must match the unified DSL or define fails.',
          '- Plugins are session-scoped. Persist source files on disk for restart recovery.',
          '',
          'Use dsha_validate(...) before calling cordis_define to catch the most common mistakes.',
        ].join('\n'));
      },
    };

    // -------------------------------------------------------------------------
    // Tool 3: dsh_author_run — returns the cordis_run invocation pattern.
    // -------------------------------------------------------------------------
    const runTool = {
      name: 'dsh_author_run',
      description: 'Returns the cordis_run pattern for activating a defined package. Use after cordis_define returns a (pluginId, packageId). Specialized plugin.',
      parameters: {
        type: 'object',
        properties: {
          mode: { type: 'string', enum: ['run', 'update'], description: 'run = first activation, restart, rollback. update = switch to a different package. Default: run.' },
        },
      },
      output: stringOutput,
      execute: async function (_args, params) {
        const mode = (_args && params.mode) || 'run';
        return note([
          '# dsh_author_run — ' + mode + ' pattern',
          '',
          'cordis_run(',
          '  pluginId: "<the pluginId returned by cordis_define>",',
          '  packageId: "<the packageId returned by cordis_define>",',
          '  mode: "' + mode + '"',
          ')',
          '',
          'Possible outcomes:',
          '- "<pluginId>/<packageId> is running (run-N)." → success. The tool is registered.',
          '- "awaiting-approval" → user must approve in UI. Do not retry.',
          '- Syntax/Schema/Validation error → fix code.host and cordis_define again.',
          '- "harness.defineTool output must declare { schema, render }" → add the output block.',
          '- "dynamic tool registration must use a tool returned by harness.defineTool(...)" → wrap with harness.defineTool(...).',
          '',
          'After running, confirm via cordis_inspect_query Tool listTools.',
        ].join('\n'));
      },
    };

    // -------------------------------------------------------------------------
    // Tool 4: dsh_author_validate — catches the 4 most common mistakes.
    // -------------------------------------------------------------------------
    const validateTool = {
      name: 'dsh_author_validate',
      description: 'Validates a candidate code.host body against the 4 most common authoring mistakes. Pure string check, no execution. Use before cordis_define. Specialized plugin.',
      parameters: {
        type: 'object',
        properties: {
          codeHost: { type: 'string', description: 'The code.host string you are about to submit.' },
        },
        required: ['codeHost'],
      },
      output: stringOutput,
      execute: async function (_args, params) {
        const code = (_args && params.codeHost) || '';
        const findings = [];

        // 1. idPrefix length must be 3-6.
        const idMatch = code.match(/idPrefix\s*:\s*["']([^"']+)["']/);
        if (idMatch) {
          const id = idMatch[1];
          if (!/^[a-z]{3,6}$/.test(id)) {
            findings.push('[FAIL] idPrefix "' + id + '" violates rule (3-6 lowercase letters).');
          } else {
            findings.push('[OK] idPrefix "' + id + '" matches the rule.');
          }
        } else {
          findings.push('[WARN] idPrefix not found in code.host. Only valid for kind=existing.');
        }

        // 2. Body must NOT end with `});` (would close the wrapper call).
        const trimmed = code.replace(/\s+$/, '');
        if (trimmed.endsWith('});')) {
          findings.push('[FAIL] code.host ends with `});` — that closes a call that was never opened. End with `};`.');
        } else if (trimmed.endsWith('}')) {
          findings.push('[OK] code.host ends with `}`.');
        } else {
          findings.push('[WARN] code.host does not end with `}`. Last char: ' + JSON.stringify(trimmed.slice(-1)));
        }

        // 3. registerTool must wrap with defineTool.
        if (/harness\.registerTool\s*\(/.test(code)) {
          if (!/harness\.defineTool\s*\(/.test(code)) {
            findings.push('[FAIL] harness.registerTool used without harness.defineTool wrap. Wrap each tool object.');
          } else {
            findings.push('[OK] harness.registerTool calls are wrapped with harness.defineTool.');
          }
        }

        // 4. defineTool body must include output: { schema, render }.
        if (/harness\.defineTool\s*\(/.test(code)) {
          if (!/output\s*:\s*\{/.test(code)) {
            findings.push('[FAIL] harness.defineTool used but no `output:` block found. Required: { schema, render }.');
          } else if (!/schema\s*:/.test(code) || !/render\s*:/.test(code)) {
            findings.push('[FAIL] output block present but missing schema or render.');
          } else {
            findings.push('[OK] defineTool output includes schema and render.');
          }
        }

        // 5. parameters DSL: minItems is not supported in the unified DSL.
        if (/parameters[\s\S]*minItems/.test(code)) {
          findings.push('[FAIL] parameters.minItems is not supported by the unified schema DSL.');
        }

        // 6. Look for TypeScript or JSX leakage.
        if (/:\s*string\s*\|\s*number/.test(code)) {
          findings.push('[FAIL] TypeScript union types detected. code.host must be plain JS.');
        }
        if (/<\w+\s*\/?>/.test(code)) {
          findings.push('[WARN] Possible JSX detected. code.host must be plain JS without JSX.');
        }

        const okCount = findings.filter(function (f) { return f.indexOf('[OK]') === 0; }).length;
        const failCount = findings.filter(function (f) { return f.indexOf('[FAIL]') === 0; }).length;
        const warnCount = findings.filter(function (f) { return f.indexOf('[WARN]') === 0; }).length;

        return note([
          '# dsh_author_validate — ' + okCount + ' ok / ' + failCount + ' fail / ' + warnCount + ' warn',
          '',
          findings.join('\n'),
          '',
          failCount === 0
            ? 'NEXT: call cordis_define with this code.host. Use dsh_author_run for the activation pattern.'
            : 'FIX the [FAIL] items before calling cordis_define.',
        ].join('\n'));
      },
    };

    // -------------------------------------------------------------------------
    // Tool 5: dsh_author_recover — given a pluginId, returns rebuild commands.
    // -------------------------------------------------------------------------
    const recoverTool = {
      name: 'dsh_author_recover',
      description: 'Returns the cordis_inspect_self call for an existing plugin so you can recover its IDs and source after a DSH restart. Specialized plugin.',
      parameters: {
        type: 'object',
        properties: {
          pluginId: { type: 'string', description: 'The pluginId to introspect (e.g. pony-1, cavm-2, orch-3, dsha-4).' },
        },
        required: ['pluginId'],
      },
      output: stringOutput,
      execute: async function (_args, params) {
        const id = _args && params.pluginId;
        if (!id) return 'pluginId required.';
        return note([
          '# dsh_author_recover — ' + id,
          '',
          'Step 1. List packages + currentPackageId:',
          'cordis_inspect_self pluginId=' + id,
          '',
          'Step 2. Get the exact source of a package:',
          'cordis_inspect_self pluginId=' + id + ' packageId=<pkg>',
          '',
          'Step 3. If state == "defined" (not running):',
          'cordis_run pluginId=' + id + ' packageId=<pkg> mode=run',
          '',
          'Step 4. If state == "running":',
          '- leave it alone (it is active), or',
          '- cordis_stop pluginId=' + id + '   (toggle off without losing the package), or',
          '- cordis_undefine pluginId=' + id + '   (permanent removal)',
          '',
          'If IDs are unknown: cordis_inspect_list for the inspect catalog,',
          'then listTools to see which tools are visible (caveman, ponytail, orch_*).',
        ].join('\n'));
      },
    };

    const d1 = harness.registerTool(ctx, harness.defineTool(inspectTool));
    const d2 = harness.registerTool(ctx, harness.defineTool(defineTool));
    const d3 = harness.registerTool(ctx, harness.defineTool(runTool));
    const d4 = harness.registerTool(ctx, harness.defineTool(validateTool));
    const d5 = harness.registerTool(ctx, harness.defineTool(recoverTool));
    ctx.effect(function () { return d1; }, 'dsh-author:dispose-inspect');
    ctx.effect(function () { return d2; }, 'dsh-author:dispose-define');
    ctx.effect(function () { return d3; }, 'dsh-author:dispose-run');
    ctx.effect(function () { return d4; }, 'dsh-author:dispose-validate');
    ctx.effect(function () { return d5; }, 'dsh-author:dispose-recover');
    console.log('[dsh-author] registered 5 tools: dsh_author_inspect, dsh_author_define, dsh_author_run, dsh_author_validate, dsh_author_recover.');
  },
};
