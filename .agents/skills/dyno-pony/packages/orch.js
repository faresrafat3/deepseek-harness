// Source-of-truth for the orch dynamic plugin (v4).
// Re-apply with: cordis_define plugin kind=existing pluginId=orch-3 ...
//
// Fares-localized orchestrator. Four tools:
//   - orch_route   : smart dispatch — pick the best mode for the task.
//   - orch_compare : run the same task under N modes, save side-by-side.
//   - orch_pipeline: chain modes (e.g. caveman-prose THEN pony-lazy).
//   - orch_status  : introspect current state.
//
// Composes pony + caveman without touching them. Extensible to any future
// mode framework (factory, crew, etc.).

return {
  apply(ctx) {
    const POOL_KEY = 'orch.callCount';
    const session = ctx.get('sessions');
    if (session && typeof session.current === 'function' && session.current()) {
      const s = session.current();
      if (s && !s[POOL_KEY]) s[POOL_KEY] = 0;
    }

    const note = function (text) {
      const s = session && session.current && session.current();
      if (s) s[POOL_KEY] = (s[POOL_KEY] || 0) + 1;
      if (s && s[POOL_KEY] > 20) {
        return text + '\n\n[orch] Note: ' + s[POOL_KEY] + ' calls this session.';
      }
      return text;
    };

    const routePick = function (task) {
      const t = (task || '').toLowerCase();
      const signals = {
        build:  /(\badd\b|\bbuild\b|\bcreate\b|\bimplement\b|\brefactor\b|\bmigrate\b|\bwire\b|\bexpose\b|\bintroduce\b|\btest\b|\bfix\b)/,
        review: /(\breview\b|\baudit\b|\bsimplify\b|\bover-engineer\b|\bbloat\b|\bcut\b|\bdelete\b|\byagni\b|\bwhat can i\b)/,
        terse:  /(\bshort\b|\btldr\b|\bbrief\b|\btwo line\b|\bone line\b|\bin 3 words\b|\bin 5 words\b|\bmax \d+\b|\bno fluff\b|\bno preamble\b)/,
        debug:  /(\bwhy\b|\bdoesn'?t work\b|\bbroken\b|\bfailing\b|\bstack trace\b|\bcrash\b|\bexception\b)/,
      };
      const score = { baseline: 1, pony: 0, caveman: 0 };
      if (signals.build.test(t))  score.pony += 3;
      if (signals.review.test(t)) score.pony += 4;
      if (signals.terse.test(t))  score.caveman += 3;
      if (signals.debug.test(t))  score.pony += 1;
      if (/\bcode\b|\bfile\b|\brefactor\b/.test(t)) score.pony += 1;
      if (t.length < 80) score.caveman += 1;
      const ranked = Object.keys(score).sort(function (a, b) { return score[b] - score[a]; });
      return ranked[0];
    };

    const stringOutput = {
      schema: { type: 'string' },
      render: function (_args, value) { return [{ type: 'text', text: String(value) }]; },
    };

    const routeTool = {
      name: 'orch_route',
      description: 'Smart dispatcher. Takes one task and returns the best mode overlay for the next turn. Modes: baseline, pony, caveman.',
      parameters: {
        type: 'object',
        properties: {
          task: { type: 'string', description: 'The user task that needs mode selection.' },
          force: { type: 'string', enum: ['baseline', 'pony', 'caveman', 'auto'], description: 'Override the heuristic. Default: auto.' },
        },
        required: ['task'],
      },
      output: stringOutput,
      execute: async function (_args, params) {
        const task = _args && params.task || '';
        const pick = (_args && params.force && params.force !== 'auto') ? params.force : routePick(task);
        if (pick === 'pony') {
          return [
            '# Mode: pony (lazy senior dev + terse prose)',
            '',
            'Apply these overlays for this turn:',
            '1. Call `ponytail(action="mode", level="full")` once at the start.',
            '2. Call `caveman(action="prose")` once to apply terse prose.',
            '3. Then do the task with that combined framing.',
            '',
            'Stop with: "stop pony" / "stop caveman" / "normal mode".',
          ].join('\n');
        }
        if (pick === 'caveman') {
          return [
            '# Mode: caveman (terse prose only)',
            '',
            'Call `caveman(action="prose")` once, then do the task.',
            '',
            'Stop with: "stop caveman" / "normal mode".',
          ].join('\n');
        }
        return [
          '# Mode: baseline (no overlay)',
          '',
          'No skill overlay. Just do the task normally.',
        ].join('\n');
      },
    };

    const compareTool = {
      name: 'orch_compare',
      description: 'Side-by-side mode comparison. Returns a 4-arm plan (baseline vs pony vs caveman vs pony-caveman) for the same task.',
      parameters: {
        type: 'object',
        properties: {
          task: { type: 'string', description: 'The task to run under each mode.' },
          armsCsv: { type: 'string', description: 'Comma-separated arms. Default: baseline,pony,caveman,pony-caveman.' },
          outputDir: { type: 'string', description: 'Optional output directory.' },
        },
        required: ['task'],
      },
      output: stringOutput,
      execute: async function (_args, params) {
        const task = _args && params.task || '';
        let arms;
        if (_args && params.armsCsv) {
          arms = params.armsCsv.split(',').map(function (s) { return s.trim(); }).filter(function (s) { return ['baseline', 'pony', 'caveman', 'pony-caveman'].indexOf(s) >= 0; });
        }
        if (!arms || !arms.length) arms = ['baseline', 'pony', 'caveman', 'pony-caveman'];
        const outDir = (_args && params.outputDir) || ('~/.dsh/orch-comparisons/' + new Date().toISOString().replace(/[:.]/g, '-'));
        const plan = '# orch_compare — ' + arms.length + ' arms plan\n\nTask: ' + task + '\n\nSave each arm to: ' + outDir + '/<arm>.md\n\nPer-arm instructions:\n\n';
        const armBlocks = arms.map(function (arm) {
          if (arm === 'baseline') return '## baseline\n- No skill overlay.\n- Default prose, default reasoning.\n- Save to: ' + outDir + '/baseline.md';
          if (arm === 'pony') return '## pony\n- Load `ponytail(action="mode", level="full")` first.\n- Apply the lazy mindset, do the task, save to ' + outDir + '/pony.md';
          if (arm === 'caveman') return '## caveman\n- Load `caveman(action="prose")` first.\n- Apply terse prose, do the task, save to ' + outDir + '/caveman.md';
          return '## pony-caveman (combined)\n- Load `ponytail(action="mode", level="full")` first.\n- Load `caveman(action="prose")` second.\n- Apply both, do the task, save to ' + outDir + '/pony-caveman.md';
        });
        const footer = '\n\n## Aggregation\nAfter all arms finish, write ' + outDir + '/SUMMARY.md with:\n- which arm produced the smallest output (lines / tokens),\n- which arm took the least reasoning turns,\n- which arm is the Fares pick for this task class.\n\nUse the `bash` tool to mkdir and write files. Use `write` tool for content.';
        return note(plan + armBlocks.join('\n\n') + footer);
      },
    };

    const pipelineTool = {
      name: 'orch_pipeline',
      description: 'Sequential mode chain. Takes a JSON array of {mode, task} steps and returns the prompt overlay the model applies turn by turn.',
      parameters: {
        type: 'object',
        properties: {
          stepsJson: { type: 'string', description: 'JSON-encoded array of {mode, task} steps.' },
        },
        required: ['stepsJson'],
      },
      output: stringOutput,
      execute: async function (_args, params) {
        let steps;
        try { steps = JSON.parse(params.stepsJson || '[]'); } catch (e) { return 'Invalid stepsJson: ' + e.message; }
        if (!Array.isArray(steps) || !steps.length) return 'At least one step required.';
        const header = '# orch_pipeline — ' + steps.length + ' steps\n\nRun each step in order. At each step boundary, load the named mode, do the step task, write the output, then move on.\n\n';
        const blocks = steps.map(function (s, i) {
          let modeOverlay = 'No mode overlay.';
          if (s.mode === 'pony') modeOverlay = 'Load: `ponytail(action="mode", level="full")`.';
          else if (s.mode === 'caveman') modeOverlay = 'Load: `caveman(action="prose")`.';
          else if (s.mode === 'pony-caveman') modeOverlay = 'Load: `ponytail(action="mode", level="full")` then `caveman(action="prose")`.';
          return '## Step ' + (i + 1) + ' — ' + (s.mode || 'baseline') + '\nTask: ' + (s.task || '') + '\n' + modeOverlay;
        });
        const footer = '\n\n## Boundaries\n- Each step keeps its own mode for that step\'s turn only.\n- The next step may use a different mode.\n- No persistent mode state is set across steps unless the model explicitly calls the skill.';
        return note(header + blocks.join('\n\n') + footer);
      },
    };

    const statusTool = {
      name: 'orch_status',
      description: 'Returns the current orchestrator status: which mode plugins are defined in this session and which are running.',
      parameters: { type: 'object', properties: {} },
      output: stringOutput,
      execute: async function () {
        const text = [
          '# orch status',
          '',
          'Active modes in this session:',
          '- pony   — ponytail tool (6 actions: mode, review, audit, debt, gain, help)',
          '- caveman — caveman tool (4 actions: terse, prose, mode, reset)',
          '- orch    — this toolset (4 tools: route, compare, pipeline, status)',
          '- baseline — always on (current session default)',
          '',
          'Toggle each independently: cordis_run / cordis_stop with its pluginId.',
        ].join('\n');
        return note(text);
      },
    };

    const dispose1 = harness.registerTool(ctx, harness.defineTool(routeTool));
    const dispose2 = harness.registerTool(ctx, harness.defineTool(compareTool));
    const dispose3 = harness.registerTool(ctx, harness.defineTool(pipelineTool));
    const dispose4 = harness.registerTool(ctx, harness.defineTool(statusTool));
    ctx.effect(function () { return dispose1; }, 'orch:dispose-route');
    ctx.effect(function () { return dispose2; }, 'orch:dispose-compare');
    ctx.effect(function () { return dispose3; }, 'orch:dispose-pipeline');
    ctx.effect(function () { return dispose4; }, 'orch:dispose-status');
    console.log('[orch] registered 4 tools: orch_route, orch_compare, orch_pipeline, orch_status.');
  },
};
