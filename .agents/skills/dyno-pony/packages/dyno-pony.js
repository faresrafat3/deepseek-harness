// Source-of-truth for the dyno-pony dynamic plugin (v1, merged).
//
// Combines all 10 historical plugins (pony, caveman, orch, dsh-author, memo,
// plugin-test, codex, memory, workflow, trace) into ONE plugin. Re-apply with:
//   cordis_define plugin kind=existing pluginId=dp-1 ...
//
// Tool count: 37 (orig+sentinels) + 1 (ultimate) = 38 tools.
//
// Each section is wrapped in an IIFE so locals like `note`, `stringOutput`,
// `session`, `POOL_KEY` do not collide. The merged plugin keeps the exact
// behavior of each original.
//
// Toggle the whole bundle with one cordis_stop / cordis_run.

return {
  apply(ctx) {
    const disposers = [];

    // ============================================================================
    // pony (1 tools)
    // ============================================================================
    (function () {

    const POOL_KEY = 'ponytail.callCount';
    const session = ctx.get('sessions');
    if (session && typeof session.current === 'function' && session.current()) {
      const s = session.current();
      if (s && !s[POOL_KEY]) s[POOL_KEY] = 0;
    }

    const note = function (text) {
      const s = session && session.current && session.current();
      if (s) s[POOL_KEY] = (s[POOL_KEY] || 0) + 1;
      if (s && s[POOL_KEY] > 20) {
        return text + '\n\n[ponytail] Note: ' + s[POOL_KEY] + ' calls this session.';
      }
      return text;
    };

    const ACTIONS = {
      mode: function (level) {
        const lvl = (level || 'full').toLowerCase();
        if (lvl === 'lite') {
          return note([
            '# Ponytail — lite mode',
            '',
            'Build what was asked, but in one short line name the lazier alternative and let the user pick.',
            '',
            'Stop with: "stop ponytail" / "normal mode".',
          ].join('\n'));
        }
        if (lvl === 'ultra') {
          return note([
            '# Ponytail — ultra mode (YAGNI extremist)',
            '',
            'Before writing anything, ask: does it need to exist at all?',
            '- Challenge the requirement itself in the same response.',
            '- Default to deletion before addition.',
            '- Ship the one-liner, flag the rest as "if you actually need X, say so".',
            '',
            'Never simplify away: input validation at trust boundaries, error handling that prevents data loss, security, accessibility, anything the user explicitly asked for.',
            '',
            'Stop with: "stop ponytail" / "normal mode".',
          ].join('\n'));
        }
        return note([
          '# Ponytail — full mode (default)',
          '',
          'You are a lazy senior developer. Lazy means efficient, not careless. The best code is the code never written.',
          '',
          '## The ladder',
          '',
          'Stop at the first rung that holds:',
          '1. Does this need to exist at all? Speculative need → skip it, say so in one line. (YAGNI)',
          '2. Already in this codebase? Reuse it. Look before you write.',
          '3. Stdlib does it? Use it.',
          '4. Native platform feature covers it? Use it.',
          '5. Already-installed dependency solves it? Use it.',
          '6. Can it be one line? One line.',
          '7. Only then: the minimum code that works.',
          '',
          '## Rules',
          '- No unrequested abstractions, no factory for one product.',
          '- Deletion over addition. Boring over clever.',
          '- Fewest files possible. Shortest working diff wins.',
          '- Mark deliberate simplifications with a `ponytail:` comment naming the ceiling and upgrade path.',
          '',
          '## Output',
          'Code first. Then at most three short lines: what was skipped, when to add it.',
          '',
          '## Never be lazy about',
          '- Understanding the problem (read fully first).',
          '- Input validation, error handling, security, accessibility.',
          '- Anything explicitly requested by the user.',
          '',
          '## Tests',
          'Non-trivial logic leaves ONE runnable check behind.',
          '',
          'Stop with: "stop ponytail" / "normal mode".',
        ].join('\n'));
      },

      review: function (target) {
        const where = target ? ' on `' + target + '`' : '';
        return note([
          '# Ponytail review' + where,
          '',
          'Review changes for over-engineering only. NOT correctness, NOT security, NOT performance.',
          '',
          '## Format',
          'One line per finding: `L<line>: <tag> <what to cut>. <replacement>.`',
          'Tags: delete / stdlib / native / yagni / shrink.',
          '',
          'End with `net: -<N> lines possible.` Nothing to cut? `Lean already. Ship.`',
        ].join('\n'));
      },

      audit: function (target) {
        const where = target ? ' on `' + target + '`' : ' (whole repo)';
        return note([
          '# Ponytail audit' + where,
          '',
          'Audit the entire tree for over-engineering. NOT correctness, NOT security, NOT performance.',
          '',
          'One line per finding, ranked biggest cut first: `<tag> <what to cut>. <replacement>. [path]`',
          'Tags: delete / stdlib / native / yagni / shrink.',
          '',
          'End with `net: -<N> lines, -<M> deps possible.` Nothing to cut? `Lean already. Ship.`',
        ].join('\n'));
      },

      debt: function (target) {
        const where = target ? ' on `' + target + '`' : ' (whole repo)';
        return note([
          '# Ponytail debt' + where,
          '',
          'Harvest every `ponytail:` comment in the tree into a tracked ledger.',
          '',
          '`grep -rnE "(#|//) ?ponytail:" .`',
          '',
          'Output: `<file>:<line>, <what was simplified>. ceiling: <...>. upgrade: <...>.`',
          'Flag `no-trigger` on markers missing upgrade paths.',
          '',
          'End with `<N> markers, <M> with no trigger.`',
        ].join('\n'));
      },

      gain: function () {
        return note([
          '# Ponytail gain (scoreboard)',
          '',
          'Published benchmark medians (5 everyday tasks × 3 models: Haiku, Sonnet, Opus):',
          '',
          '  Lines of code  no-skill 100%   vs   ponytail 6-20%   (down 80-94%)',
          '  Cost           no-skill 100%   vs   ponytail 23-53%  (down 47-77%)',
          '  Speed          ponytail 3-6x faster',
          '',
          'These are benchmark medians, NOT this repo.',
          'NEVER print a per-repo savings number.',
        ].join('\n'));
      },

      help: function () {
        return note([
          '# Ponytail — quick reference',
          '',
          '## Modes (toggle)',
          '- mode("full")  → default. Ladder enforced.',
          '- mode("lite")  → build, name the lazier alternative.',
          '- mode("ultra") → YAGNI extremist.',
          '',
          '## One-shot reviews',
          '- review([target]) → over-engineering review.',
          '- audit([target])  → whole-repo audit.',
          '- debt([target])   → harvest `ponytail:` comments.',
          '- gain()           → published scoreboard.',
          '- help()           → this card.',
          '',
          '## Deactivate',
          '`stop ponytail` or `normal mode`. Default: full.',
          '',
          'Upstream: github.com/DietrichGebert/ponytail (MIT).',
        ].join('\n'));
      },
    };

    const tool = {
      name: 'ponytail',
      description: 'Lazy senior dev mode (وضع المطور الكسلان الذكي). Use before writing code, when reviewing changes, or when user says "ponytail", "lazy mode", "simplest solution", "minimal", "yagni", "do less", "shortest path", or about over-engineering. NOT for non-coding requests. Fares-localized fork of github.com/DietrichGebert/ponytail (MIT).',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['mode', 'review', 'audit', 'debt', 'gain', 'help'], description: 'Which ponytail action to invoke.' },
          level: { type: 'string', enum: ['lite', 'full', 'ultra'], description: 'Intensity for mode. Default: full.' },
          target: { type: 'string', description: 'Optional path / scope for review, audit, debt.' },
        },
        required: ['action'],
      },
      output: {
        schema: { type: 'string' },
        render: function (_args, value) { return [{ type: 'text', text: String(value) }]; },
      },
      execute: async function (_args, params) {
        const a = (params && params.action) || (_args && _args.action);
        if (!a || typeof ACTIONS[a] !== 'function') {
          return 'Unknown action. Valid: mode, review, audit, debt, gain, help.';
        }
        return ACTIONS[a](params.level || (_args && _args.level), params.target || (_args && _args.target));
      },
    };

    const dispose = harness.registerTool(ctx, harness.defineTool(tool));
    ctx.effect(function () { return dispose; }, 'ponytail:dispose-on-fork');
    console.log('[ponytail] registered tool "ponytail" (actions: mode, review, audit, debt, gain, help).');
      })();
    // ============================================================================
    // caveman (1 tools)
    // ============================================================================
    (function () {

    const POOL_KEY = 'caveman.callCount';
    const session = ctx.get('sessions');
    if (session && typeof session.current === 'function' && session.current()) {
      const s = session.current();
      if (s && !s[POOL_KEY]) s[POOL_KEY] = 0;
    }

    const note = function (text) {
      const s = session && session.current && session.current();
      if (s) s[POOL_KEY] = (s[POOL_KEY] || 0) + 1;
      if (s && s[POOL_KEY] > 20) {
        return text + '\n\n[caveman] Note: ' + s[POOL_KEY] + ' calls this session.';
      }
      return text;
    };

    const ACTIONS = {
      terse: function (n) {
        const count = (typeof n === 'number' && n > 0 && n < 100) ? n : 3;
        return note([
          '# Caveman — terse mode (' + count + ' words max)',
          '',
          'Respond in at most ' + count + ' words. No preamble, no postamble, no bullet explanations.',
          '',
          'Rules:',
          '- Single sentence preferred.',
          '- If a code block, no commentary around it.',
          '- If a list, three items max, each one word.',
          '- Never apologise. Never restate the question.',
          '- "Yes" / "No" alone when honest.',
          '',
          'Deactivate with: "stop caveman" / "normal mode".',
        ].join('\n'));
      },

      prose: function () {
        return note([
          '# Caveman — terse prose mode (default)',
          '',
          'Speak like a tired senior dev who has typed enough today. Short sentences. No fluff. No emoji. No "I would be happy to". No "let me".',
          '',
          'Rules:',
          '- Drop filler: "just", "really", "actually", "basically", "simply", "of course".',
          '- Drop throat-clearing: "Sure!", "Great question!", "Absolutely!".',
          '- Drop sign-offs: "Let me know if...", "Hope this helps!", "Feel free to ask".',
          '- Drop obvious context. Assume the reader is competent.',
          '- Short paragraphs. One thought per line.',
          '- Use code instead of explaining code.',
          '',
          'Deactivate with: "stop caveman" / "normal mode".',
        ].join('\n'));
      },

      mode: function (level) {
        const lvl = (level || 'prose').toLowerCase();
        if (lvl === 'terse-1' || lvl === 'one') return ACTIONS.terse(1);
        if (lvl === 'terse-3' || lvl === 'terse') return ACTIONS.terse(3);
        return ACTIONS.prose();
      },

      reset: function () {
        return note([
          '# Caveman — off',
          '',
          'Reverted to normal prose. Resume with `caveman(action="mode")` or `caveman(action="terse")` anytime.',
        ].join('\n'));
      },
    };

    const tool = {
      name: 'caveman',
      description: 'Terse prose mode (وضع الكلام المختصر). Governs HOW the model TALKS. Pair with pony for terse-prose + lazy-mindset. Use when user says "caveman", "terse", "short", "concise", "stop the fluff". Fares-localized fork of github.com/JuliusBrussee/caveman (MIT).',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['terse', 'prose', 'mode', 'reset'], description: 'Which caveman action to invoke.' },
          level: { type: 'string', enum: ['prose', 'terse', 'terse-1', 'one', 'terse-3'], description: 'Intensity for mode. Default: prose.' },
          n: { type: 'number', description: 'Optional word cap (1-99) for terse. Default: 3.' },
        },
        required: ['action'],
      },
      output: {
        schema: { type: 'string' },
        render: function (_args, value) { return [{ type: 'text', text: String(value) }]; },
      },
      execute: async function (_args, params) {
        const a = _args && params.action;
        if (!a || typeof ACTIONS[a] !== 'function') {
          return 'Unknown action. Valid: terse, prose, mode, reset.';
        }
        return ACTIONS[a](params.level, params.n);
      },
    };

    const dispose = harness.registerTool(ctx, harness.defineTool(tool));
    ctx.effect(function () { return dispose; }, 'caveman:dispose-on-fork');
    console.log('[caveman] registered tool "caveman" (actions: terse, prose, mode, reset).');
      })();
    // ============================================================================
    // orch (4 tools)
    // ============================================================================
    (function () {

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
      })();
    // ============================================================================
    // dsh-author (5 tools)
    // ============================================================================
    (function () {

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
      })();
    // ============================================================================
    // memo (6 tools)
    // ============================================================================
    (function () {

    const POOL_KEY = 'memo.callCount';
    const session = ctx.get('sessions');
    if (session && typeof session.current === 'function' && session.current()) {
      const s = session.current();
      if (s && !s[POOL_KEY]) s[POOL_KEY] = 0;
    }

    const note = function (text) {
      const s = session && session.current && session.current();
      if (s) s[POOL_KEY] = (s[POOL_KEY] || 0) + 1;
      if (s && s[POOL_KEY] > 8) {
        return text + '\n\n[memo] Note: ' + s[POOL_KEY] + ' calls. Consider stopping the plugin.';
      }
      return text;
    };

    const stringOutput = {
      schema: { type: 'string' },
      render: function (_args, value) { return [{ type: 'text', text: String(value) }]; },
    };

    const classifyTool = {
      name: 'memo_classify',
      description: 'Pick the right Agent Note tier for a new decision record. Returns the directory and the lifecycle rules for the chosen tier. Specialized plugin.',
      parameters: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: ['implemented', 'proposed', 'archived', 'rejected'], description: 'Lifecycle status of the decision.' },
          category: { type: 'string', enum: ['architecture', 'feature', 'process', 'simplification', 'subsystem'], description: 'Topic category. Determines subdirectory.' },
        },
        required: ['kind'],
      },
      output: stringOutput,
      execute: async function (_args, params) {
        const kind = (params && params.kind) || (_args && _args.kind);
        const cat = ((_args && _args.category) || (params && params.category)) || 'process';
        const paths = {
          implemented: '.agents/notes/implemented/' + cat + '/',
          proposed:    '.agents/notes/proposed/' + cat + '/',
          archived:    '.agents/notes/archived/' + cat + '/',
          rejected:    '.agents/notes/rejected/' + cat + '/',
        };
        const lifecycle = {
          implemented: 'Active decision record. Keep current with what actually shipped. Rewrite stale facts in place; do NOT append change history. Archive the triplet when the decision reverses or its rationale no longer guides future work.',
          proposed:    'Pending decision. Lighter weight. Move to implemented/ once the change ships.',
          archived:    'Frozen historical snapshot. Never edit. Never treat as current authority. Cross-link from any superseding note.',
          rejected:    'Decision considered and not taken. Keep so future work does not re-litigate without evidence.',
        };
        return note([
          '# memo_classify — ' + kind + ' / ' + cat,
          '',
          'Path: ' + paths[kind],
          'Filename: YYYY-MM-DD-<kebab-case-subject>.md',
          'Companion files (same basename): .zh.md, .i18n.yaml',
          '',
          'Lifecycle:',
          lifecycle[kind],
          '',
          'Hard rules:',
          '- Every new note triggers a SUPERSESSION check. Search active tree, classify full or partial supersession, archive every qualifying implemented triplet in the same PR.',
          '- archived/* files are FROZEN: never edit them.',
          '- A reversal of a decision requires a NEW note and cross-link. Old note may be deleted only through consolidation.',
          '- Only the original drafter or project owner can archive their own notes.',
        ].join('\n'));
      },
    };

    const formatTool = {
      name: 'memo_format',
      description: 'Returns the Agent Note file template (English source). Specialized plugin.',
      parameters: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: ['implemented', 'proposed', 'archived', 'rejected'], description: 'Note tier. Default: implemented.' },
          title: { type: 'string', description: 'Short, searchable subject. e.g. "agent teams over continuable children".' },
          date: { type: 'string', description: 'ISO date YYYY-MM-DD. Default: today.' },
        },
        required: ['title'],
      },
      output: stringOutput,
      execute: async function (_args, params) {
        const kind = ((_args && _args.kind) || (params && params.kind)) || 'implemented';
        const title = (params && params.title) || (_args && _args.title) || '<subject>';
        const date = ((_args && _args.date) || (params && params.date)) || new Date().toISOString().slice(0, 10);
        const statusHeader = (kind === 'implemented')
          ? '# Agent Note: ' + title + '\n\nStatus: implemented\n\nEnglish | [中文](<filename>.zh.md)'
          : '# Agent Note: ' + title + '\n\nStatus: ' + kind + '\n\nEnglish | [中文](<filename>.zh.md)';
        const statusBlock = (kind === 'implemented')
          ? '## Keep current\n\nKeep paths, symbols, defaults, and mechanisms current in the same change that alters them. Rewrite stale facts in place; do not append change history.\n\nWhen a shipped note is unlikely to guide future work, archive its complete triplet through `dsh-archive-agent-notes` instead of continuing to maintain it.'
          : (kind === 'archived'
            ? '## Frozen history\n\nArchived on ' + date + '. Never edit this file. Cross-link from any superseding note.'
            : '## Status\n\nThis note is ' + kind + '. See the lifecycle section in `.agents/notes/README.md` for handling rules.');
        const body = [
          '## Problem',
          '',
          '<One paragraph naming the gap, the symptom, or the question the decision resolves.>',
          '',
          '## Decision',
          '',
          '<One paragraph stating the decision. Name actors and facts directly.>',
          '',
          '## Consequences',
          '',
          '<What becomes easier, what becomes harder, what follow-up work is created.>',
          '',
          '## Required verification',
          '',
          '<List of acceptance commands, evidence, or downstream checks.>',
        ].join('\n');
        return note([
          '# memo_format — template',
          '',
          'File path: .agents/notes/' + kind + '/<category>/' + date + '-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.md',
          '',
          '```',
          statusHeader,
          '',
          body,
          '',
          statusBlock,
          '',
          '```',
          '',
          'Companion files (same basename):',
          '- <filename>.zh.md (Chinese counterpart, paired workflow)',
          '- <filename>.i18n.yaml (translation manifest)',
          '',
          'Use memo_link after writing to lint cross-references. Use memo_scope to check supersession against active notes.',
        ].join('\n'));
      },
    };

    const linkTool = {
      name: 'memo_link',
      description: 'Lint cross-references in a draft Agent Note. Returns a checklist of relative-Markdown path links and fragment anchors. Specialized plugin.',
      parameters: {
        type: 'object',
        properties: {
          notePath: { type: 'string', description: 'Path to the draft note, relative to repo root.' },
          noteBody: { type: 'string', description: 'The note body content (for offline link extraction).' },
        },
        required: ['notePath'],
      },
      output: stringOutput,
      execute: async function (_args, params) {
        const p = ((_args && _args.notePath) || (params && params.notePath)) || '<path>';
        const body = ((_args && _args.noteBody) || (params && params.noteBody)) || '';
        const mdLinks = body.match(/\[[^\]]+\]\(([^)]+)\)/g) || [];
        const unique = Array.from(new Set(mdLinks.map(function (l) {
          const m = l.match(/\(([^)]+)\)/);
          return m ? m[1] : '';
        }).filter(Boolean)));
        const internal = unique.filter(function (l) { return l.indexOf('http') !== 0; });
        const checklist = internal.map(function (l, i) {
          const frag = l.split('#');
          const pathPart = frag[0];
          const fragPart = frag[1];
          const okPath = pathPart.match(/^[./]/);
          const okFrag = !fragPart || /^[a-z0-9-]+$/i.test(fragPart);
          const status = (okPath && okFrag) ? '[OK]' : '[FAIL]';
          return status + ' ' + l + (okPath && okFrag ? '' : '  → use relative path; fragment must be kebab-case');
        });
        return note([
          '# memo_link — ' + p,
          '',
          'Rules:',
          '- Link repository references with relative Markdown paths, never bare filenames or Agent Note numbers.',
          '- verify-md-links rejects missing targets and dead #fragment anchors.',
          '- Fragment must be lowercase kebab-case ([a-z0-9-]+).',
          '',
          'Checklist (' + internal.length + ' internal links found):',
          '',
          checklist.length ? checklist.join('\n') : 'No internal links extracted. Either the note has no links, or noteBody was not provided.',
          '',
          'External links (' + (unique.length - internal.length) + '):',
          (unique.filter(function (l) { return l.indexOf('http') === 0; }).map(function (l) { return '- ' + l; }).join('\n') || '(none)'),
          '',
          'NEXT: run memo_scope to verify no active note already covers this decision.',
        ].join('\n'));
      },
    };

    const scopeTool = {
      name: 'memo_scope',
      description: 'Cross-check a draft note against the active tree for supersession. Returns the search commands and the classification rubric. Specialized plugin.',
      parameters: {
        type: 'object',
        properties: {
          draftTitle: { type: 'string', description: 'Short searchable subject of the draft note.' },
          draftKeywords: { type: 'string', description: 'Comma-separated keywords to grep for.' },
        },
        required: ['draftTitle'],
      },
      output: stringOutput,
      execute: async function (_args, params) {
        const title = ((_args && _args.draftTitle) || (params && params.draftTitle)) || '<subject>';
        const keywords = ((_args && _args.draftKeywords) || (params && params.draftKeywords)) || title;
        const kwList = keywords.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        const greps = kwList.map(function (kw) {
          return 'grep -rInE "' + kw + '" .agents/notes/implemented/ .agents/notes/proposed/ 2>/dev/null';
        }).join('\n');
        return note([
          '# memo_scope — supersession check for "' + title + '"',
          '',
          'Search commands:',
          '```',
          greps || 'grep -rInE "' + title + '" .agents/notes/',
          '```',
          '',
          'Classification rubric:',
          '',
          '- FULL supersession: existing note covers the same decision or mechanism. Draft should reference it, not duplicate. Archive the older triplet in the same PR.',
          '- PARTIAL supersession: existing note covers part of the decision. Keep partial active; cross-link.',
          '- NO supersession: nothing in the active tree covers this. Draft is novel.',
          '',
          'Procedure:',
          '1. Run the greps above.',
          '2. For each match, open the note and read its Problem + Decision sections.',
          '3. Apply the rubric.',
          '4. If full supersession: archive the older note\'s triplet (.md + .zh.md + .i18n.yaml) via dsh-archive-agent-notes.',
          '5. If partial: keep both, add a cross-link from the new note.',
          '',
          'NEXT: write the note using memo_format, lint with memo_link, then commit.',
        ].join('\n'));
      },
    };

    const archiveTool = {
      name: 'memo_archive',
      description: 'Returns the archive procedure for an Agent Note triplet (.md + .zh.md + .i18n.yaml). Specialized plugin.',
      parameters: {
        type: 'object',
        properties: {
          noteBasename: { type: 'string', description: 'Basename of the note (no extension), e.g. "2026-08-10-agent-teams".' },
          category: { type: 'string', description: 'Category subdir, e.g. "feature" or "architecture".' },
          reason: { type: 'string', enum: ['superseded', 'no-longer-guides', 'frozen-snapshot'], description: 'Why we are archiving.' },
        },
        required: ['noteBasename', 'category'],
      },
      output: stringOutput,
      execute: async function (_args, params) {
        const base = ((_args && _args.noteBasename) || (params && params.noteBasename)) || '<basename>';
        const cat = ((_args && _args.category) || (params && params.category)) || '<category>';
        const reason = ((_args && _args.reason) || (params && params.reason)) || 'superseded';
        return note([
          '# memo_archive — ' + base,
          '',
          'Procedure (per dsh-archive-agent-notes skill):',
          '',
          '1. Move the triplet from implemented/ to archived/, same category:',
          '   mv .agents/notes/implemented/' + cat + '/' + base + '.md       .agents/notes/archived/' + cat + '/' + base + '.md',
          '   mv .agents/notes/implemented/' + cat + '/' + base + '.zh.md    .agents/notes/archived/' + cat + '/' + base + '.zh.md',
          '   mv .agents/notes/implemented/' + cat + '/' + base + '.i18n.yaml .agents/notes/archived/' + cat + '/' + base + '.i18n.yaml',
          '',
          '2. Open the moved .md and rewrite the Status header to "archived".',
          '   Add a one-line cross-link to any superseding note.',
          '',
          '3. Do NOT edit archived files after step 2. They are FROZEN.',
          '',
          '4. Reason for this archive: ' + reason + '.',
          '',
          '5. Verify the audit + freshness gates pass before committing.',
          '',
          'See .agents/skills/dsh-archive-agent-notes/SKILL.md for the full ritual.',
        ].join('\n'));
      },
    };

    const reviewTool = {
      name: 'memo_review',
      description: 'One-pass review of a draft Agent Note. Returns the prose-standard checklist (concrete actors, no metaphors, one home per fact, no implementation status annotations). Specialized plugin.',
      parameters: {
        type: 'object',
        properties: {
          noteBody: { type: 'string', description: 'Full note body content.' },
        },
        required: ['noteBody'],
      },
      output: stringOutput,
      execute: async function (_args, params) {
        const body = ((_args && _args.noteBody) || (params && params.noteBody)) || '';
        const findings = [];

        const wordCount = body.split(/\s+/).length;
        findings.push('[INFO] Word count: ' + wordCount + ' (target ≤ 800 for short notes, ≤ 2000 for long ones; flag if > 1500).');

        const slopPatterns = {
          'previously / now / no longer / used to / renamed / was moved': /\b(previously|now|no longer|used to|renamed|was moved)\b/,
          'implementation status in prose': /!implemented|future:|TBD|TODO|XXX/,
          '"should" spec-speak in implemented notes': /\bshould\b/,
          'emphasis inflation (CAPS)': /\b[A-Z]{4,}\b/,
          'metaphor (gate/vocabulary/surface)': /\b(gate|vocabulary|surface)\b/,
          'narrated history or war stories': /\bwar stor(y|ies)\b|\bnarrative\b/,
        };
        Object.keys(slopPatterns).forEach(function (label) {
          if (slopPatterns[label].test(body)) findings.push('[FAIL] ' + label + ' detected. dsh-prose-standard requires the named pattern.');
        });

        const ok = body.indexOf('## Decision') >= 0 && body.indexOf('## Problem') >= 0;
        findings.push(ok ? '[OK] Problem + Decision sections present.' : '[FAIL] Missing ## Problem or ## Decision sections.');

        const hasFacts = /`[A-Za-z0-9_-]+`/.test(body);
        findings.push(hasFacts ? '[OK] Code identifiers (symbols, paths) cited concretely.' : '[WARN] No code identifiers cited; consider naming concrete actors.');

        const links = (body.match(/\]\(([^)]+)\)/g) || []).length;
        findings.push('[INFO] Cross-references: ' + links + ' (relative Markdown paths required, no bare filenames).');

        const failCount = findings.filter(function (f) { return f.indexOf('[FAIL]') === 0; }).length;
        return note([
          '# memo_review — ' + failCount + ' failures',
          '',
          findings.join('\n'),
          '',
          failCount === 0
            ? 'OK to commit. Run memo_link + memo_scope one last time before opening the PR.'
            : 'FIX the [FAIL] items. dsh-prose-standard rules: name actors directly, no metaphors, one home per fact, no "should", no narrated history.',
        ].join('\n'));
      },
    };

    const d1 = harness.registerTool(ctx, harness.defineTool(classifyTool));
    const d2 = harness.registerTool(ctx, harness.defineTool(formatTool));
    const d3 = harness.registerTool(ctx, harness.defineTool(linkTool));
    const d4 = harness.registerTool(ctx, harness.defineTool(scopeTool));
    const d5 = harness.registerTool(ctx, harness.defineTool(archiveTool));
    const d6 = harness.registerTool(ctx, harness.defineTool(reviewTool));
    ctx.effect(function () { return d1; }, 'memo:dispose-classify');
    ctx.effect(function () { return d2; }, 'memo:dispose-format');
    ctx.effect(function () { return d3; }, 'memo:dispose-link');
    ctx.effect(function () { return d4; }, 'memo:dispose-scope');
    ctx.effect(function () { return d5; }, 'memo:dispose-archive');
    ctx.effect(function () { return d6; }, 'memo:dispose-review');
    console.log('[memo] registered 6 tools: memo_classify, memo_format, memo_link, memo_scope, memo_archive, memo_review.');
      })();
    // ============================================================================
    // plugin-test (3 tools)
    // ============================================================================
    (function () {

    const POOL_KEY = 'ptest.callCount';
    const sessions = ctx.get('sessions');
    let callCount = 0;

    const note = function (text) {
      callCount += 1;
      if (callCount > 8) {
        return text + '\n\n[plugin-test] Note: ' + callCount + ' calls. Consider stopping the plugin when done authoring tests.';
      }
      return text;
    };

    const stringOutput = {
      schema: { type: 'string' },
      render: function (_args, value) { return [{ type: 'text', text: String(value) }]; },
    };

    // -------------------------------------------------------------------------
    // Tool 1: ptest_template — emit a Vitest spec body for a given tool name.
    // -------------------------------------------------------------------------
    const templateTool = harness.defineTool({
      name: 'ptest_template',
      description: 'Emit a Vitest spec body for a given dynamic plugin tool name. The spec mounts the plugin in a fake ctx, calls the tool, and asserts the standard 4 properties. The model writes the emitted string to a `.test.ts` file in the host project.',
      parameters: {
        type: 'object',
        properties: {
          toolName: { type: 'string', description: 'The model-facing tool name (e.g. "ponytail", "caveman").' },
          pluginId: { type: 'string', description: 'The cordis pluginId that owns the tool (e.g. "pony-1").' },
          packageId: { type: 'string', description: 'The cordis packageId for the current build (e.g. "pkg-9").' },
        },
        required: ['toolName', 'pluginId', 'packageId'],
      },
      output: stringOutput,
      execute: function (_args, params) {
        const t = params.toolName;
        const p = params.pluginId;
        const pkg = params.packageId;
        const out = [
          '// Generated by plugin-test. Verify against the actual tool, then add real cases.',
          '// Mounts the plugin in a fake ctx, asserts the 4 standard properties, and runs a smoke execute.',
          "import { describe, it, expect, beforeEach, afterEach } from 'vitest';",
          "import { definePlugin } from './fake-ctx';",
          "import { apply as pluginApply } from './fake-plugin-source';",
          '',
          "const TOOL_NAME = '" + t + "';",
          "const PLUGIN_ID = '" + p + "';",
          "const PACKAGE_ID = '" + pkg + "';",
          '',
          'describe(\'plugin: ' + p + ' / ' + pkg + ' / tool: ' + t + '\', () => {',
          '  let fake: ReturnType<typeof definePlugin>;',
          '  let registered: { name: string; definition: unknown } | undefined;',
          '  let disposers: Array<() => void>;',
          '',
          '  beforeEach(() => {',
          '    fake = definePlugin({ id: PLUGIN_ID, packageId: PACKAGE_ID });',
          '    disposers = [];',
          '    fake.tools.registerImpl = (def) => { registered = def; return () => { registered = undefined; }; };',
          '  });',
          '',
          '  afterEach(() => {',
          '    for (const d of disposers.splice(0)) { try { d(); } catch {} }',
          '  });',
          '',
          '  it(\'mounts without throwing\', () => {',
          '    expect(() => pluginApply(fake.ctx)).not.toThrow();',
          '  });',
          '',
          '  it(\'registers the named tool\', () => {',
          '    pluginApply(fake.ctx);',
          '    expect(registered).toBeDefined();',
          '    expect(registered!.name).toBe(TOOL_NAME);',
          '  });',
          '',
          '  it(\'exposes a valid parameter schema\', () => {',
          '    pluginApply(fake.ctx);',
          '    const def = registered!.definition as { parameters?: { type?: string; properties?: Record<string, unknown> } };',
          '    expect(def.parameters).toBeDefined();',
          '    expect(def.parameters!.type).toBe(\'object\');',
          '    expect(typeof def.parameters!.properties).toBe(\'object\');',
          '  });',
          '',
          '  it(\'exposes an output block with schema + render\', () => {',
          '    pluginApply(fake.ctx);',
          '    const def = registered!.definition as { output?: { schema?: unknown; render?: unknown } };',
          '    expect(def.output).toBeDefined();',
          '    expect(def.output!.schema).toBeDefined();',
          '    expect(typeof def.output!.render).toBe(\'function\');',
          '  });',
          '',
          '  it(\'every effect returns a disposer (no leaked registrations)\', () => {',
          '    const effectDisposers: Array<() => void> = [];',
          '    fake.ctx.effectImpl = (cb, _label) => { const d = cb(); effectDisposers.push(d); return d; };',
          '    pluginApply(fake.ctx);',
          '    expect(effectDisposers.length).toBeGreaterThan(0);',
          '    for (const d of effectDisposers) { expect(typeof d).toBe(\'function\'); d(); }',
          '  });',
          '});',
          '',
        ].join('\n');
        return note(out);
      },
    });

    // -------------------------------------------------------------------------
    // Tool 2: ptest_assertions — list the standard 4 assertions.
    // -------------------------------------------------------------------------
    const assertionsTool = harness.defineTool({
      name: 'ptest_assertions',
      description: 'Return the 4 standard assertions every dyno-pony plugin spec must contain, plus the rationale for each. Use this as a checklist when reviewing a generated spec.',
      parameters: {
        type: 'object',
        properties: {
          includeOptional: { type: 'string', description: '"yes" to also include the 3 optional assertions (effect disposer, defineTool wrap, output block). Default "yes".' },
        },
      },
      output: stringOutput,
      execute: function (_args, params) {
        const includeOptional = (params.includeOptional || 'yes') === 'yes';
        const lines = [
          '# 4 standard assertions for any dyno-pony plugin spec',
          '',
          '## Required (4)',
          '1. **mounts without throwing** — `expect(() => pluginApply(fake.ctx)).not.toThrow()`.',
          '2. **registers the named tool** — calls the apply, then asserts the tool registry received the entry with the expected `name`.',
          '3. **exposes a valid parameter schema** — `parameters.type === "object"` and `properties` is a non-empty object.',
          '4. **exposes an output block with schema + render** — `output.schema` defined, `output.render` is a function.',
          '',
        ];
        if (includeOptional) {
          lines.push('## Optional (3 — recommend including)');
          lines.push('5. **every effect returns a disposer** — call every effect\'s callback, expect each to return a `() => void`. Catches leaks.');
          lines.push('6. **uses `harness.defineTool` then `harness.registerTool`** — search the plugin source for `registerTool` and assert the argument is wrapped by `defineTool`.');
          lines.push('7. **code body ends with `};` (object literal), not `});` (call)** — a `});` at the end is the #1 dynamic plugin bug per the dsh-author skill.');
          lines.push('');
        }
        return note(lines.join('\n'));
      },
    });

    // -------------------------------------------------------------------------
    // Tool 3: ptest_harness — fake-ctx.ts builder source.
    // -------------------------------------------------------------------------
    const harnessTool = harness.defineTool({
      name: 'ptest_harness',
      description: 'Return the source for `fake-ctx.ts`, a small builder that simulates enough of the host context to mount a dyno-pony plugin in a Vitest process. Writes the file content; the model pastes it into the host project.',
      parameters: {
        type: 'object',
        properties: {},
      },
      output: stringOutput,
      execute: function (_args) {
        const out = [
          '// Generated by plugin-test. Tiny Cordis-shaped fake for dyno-pony plugin specs.',
          '//',
          '// Implements just enough of `ctx` + `harness.defineTool` + `harness.registerTool`',
          '// for a plugin body to mount in isolation under Vitest. Not a Cordis replacement.',
          '',
          'export interface FakePlugin {',
          '  ctx: FakeContext;',
          '  tools: { registerImpl: (def: unknown) => () => void };',
          '  registered: { name: string; definition: unknown }[];',
          '}',
          '',
          'export interface FakeContext {',
          '  get(name: string): unknown;',
          '  on(_name: string, _listener: (...args: unknown[]) => unknown): () => void;',
          '  effect(cb: () => () => void, _label?: string): () => void;',
          '  effectImpl: (cb: () => () => void, label?: string) => () => void;',
          '  provide(_name: string, _value: unknown): () => void;',
          '}',
          '',
          'export function definePlugin(opts: { id: string; packageId: string }): FakePlugin {',
          '  const registered: { name: string; definition: unknown }[] = [];',
          '  const services = new Map<string, unknown>();',
          '  const effects: Array<() => () => void> = [];',
          '  const defaultEffect = (cb: () => () => void, _label?: string) => {',
          '    const d = cb();',
          '    effects.push(() => d);',
          '    return d;',
          '  };',
          '  const ctx: FakeContext = {',
          '    get: (name) => services.get(name),',
          '    on: (_name, _listener) => () => {},',
          '    effect: defaultEffect,',
          '    effectImpl: defaultEffect,',
          '    provide: (name, value) => { services.set(name, value); return () => services.delete(name); },',
          '  };',
          '  return {',
          '    ctx,',
          '    registered,',
          '    tools: {',
          '      registerImpl: (def: unknown) => {',
          '        const d = def as { name: string };',
          '        registered.push({ name: d.name, definition: def });',
          '        return () => { const i = registered.findIndex((r) => r.name === d.name); if (i >= 0) registered.splice(i, 1); };',
          '      },',
          '    },',
          '  };',
          '}',
          '',
          '// Global harness shim — the plugin body expects these to exist at the',
          '// top of its function. Vitest loads fake-harness.js before the plugin.',
          '// See `vitest.config.ts` `setupFiles`.',
          'export const harness = {',
          '  defineTool: (def: unknown) => def,',
          '  registerTool: (_ctx: unknown, tool: unknown) => {',
          '    return (_ctx as FakePlugin).tools.registerImpl(tool);',
          '  },',
          '  handle: (_method: string, _handler: (...args: unknown[]) => unknown) => () => {},',
          '};',
          'globalThis.harness = harness as unknown as typeof globalThis.harness;',
          '',
        ].join('\n');
        return note(out);
      },
    });

    // -------------------------------------------------------------------------
    // Register all three.
    // -------------------------------------------------------------------------
    const d1 = disposers.push(harness.registerTool(ctx, templateTool));
    const d2 = disposers.push(harness.registerTool(ctx, assertionsTool));
    const d3 = disposers.push(harness.registerTool(ctx, harnessTool));

    ctx.effect(function () { return function dispose() {
      d1(); d2(); d3();
    }; }, 'ptst:dispose-all');
      })();
    // ============================================================================
    // codex (5 tools)
    // ============================================================================
    (function () {

    const POOL_KEY = 'cdx.callCount';
    let callCount = 0;
    const note = function (text) {
      callCount += 1;
      if (callCount > 12) {
        return text + '\n\n[codex] Note: ' + callCount + ' calls. Consider stopping codex; you have enough map for the current task.';
      }
      return text;
    };

    const stringOutput = {
      schema: { type: 'string' },
      render: function (_args, value) { return [{ type: 'text', text: String(value) }]; },
    };

    const fs = ctx.get('fs');
    const fsReady = !!(fs && typeof fs.readText === 'function' && typeof fs.listDir === 'function');

    const LANG_EXT = {
      ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
      mjs: 'javascript', cjs: 'javascript',
      py: 'python', md: 'markdown', json: 'json', yml: 'yaml', yaml: 'yaml',
      sh: 'shell', bash: 'shell', css: 'css', html: 'html', vue: 'vue', svelte: 'svelte',
    };

    // -------------------------------------------------------------------------
    // Tool 1: cdx_map — directory tree with file counts.
    // -------------------------------------------------------------------------
    const mapTool = harness.defineTool({
      name: 'cdx_map',
      description: 'Return a directory tree (root + depth) with file counts and a language breakdown. Read-only; does not recurse into hidden directories or `node_modules`.',
      parameters: {
        type: 'object',
        properties: {
          root: { type: 'string', description: 'Absolute path; defaults to DSH project root if empty.' },
          depth: { type: 'string', description: 'Max depth (0 = root only, 1 = root + direct children, etc). Default 2.' },
        },
      },
      output: stringOutput,
      execute: function (_args, params) {
        if (!fsReady) {
          return note('cdx_map unavailable: ctx.fs is not reachable from this dynamic plugin. The substrate must mount the filesystem capability. As a fallback, the model should use the native `bash` tool: `ls -la <root>` / `find <root> -maxdepth N -type f`.');
        }
        return note('cdx_map will read from `' + (params.root || '(DSH project root)') + '` at depth ' + (params.depth || '2') + '.\n\nThe model should now call: bash command `ls -la <root>` and `find <root> -maxdepth ' + (params.depth || '2') + ' -type f -not -path "*/node_modules/*" -not -path "*/.git/*"`, then summarize the language breakdown and key directories. Codex is a planner, not a walker — bash does the walking.');
      },
    });

    // -------------------------------------------------------------------------
    // Tool 2: cdx_symbols — top-level exported symbols.
    // -------------------------------------------------------------------------
    const symbolsTool = harness.defineTool({
      name: 'cdx_symbols',
      description: 'Return the top-level exported symbols for a TypeScript / JavaScript / Python file. For TS/JS: looks for `export function`, `export const`, `export class`, `export type`, `export interface`. For Python: looks for `def`, `class`. The model reads the file and runs this on the body.',
      parameters: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Absolute path to the file.' },
          body: { type: 'string', description: 'Optional: the file body (avoids a second read). If empty, the model will read it next.' },
          language: { type: 'string', description: '"typescript" | "javascript" | "python". Default auto-detect from extension.' },
        },
        required: ['filePath'],
      },
      output: stringOutput,
      execute: function (_args, params) {
        const ext = (params.filePath.split('.').pop() || '').toLowerCase();
        const lang = params.language || (ext === 'py' ? 'python' : (LANG_EXT[ext] || 'unknown'));
        const body = params.body || '';
        const lines = [
          '# Symbols for ' + params.filePath,
          '# language: ' + lang,
          '',
        ];
        if (!body) {
          lines.push('No body provided. The model should call the native `read` tool on this file, then call cdx_symbols again with the body filled in.');
        } else if (lang === 'typescript' || lang === 'javascript') {
          const re = /export\s+(?:async\s+)?(?:function|const|let|class|interface|type|enum|default)\s+([A-Za-z_$][\w$]*)/g;
          const seen = new Set();
          let m;
          while ((m = re.exec(body)) !== null) {
            if (!seen.has(m[1])) { seen.add(m[1]); lines.push('- ' + m[1]); }
          }
          if (seen.size === 0) lines.push('(no top-level exports found)');
        } else if (lang === 'python') {
          const re = /^(?:def|class|async\s+def)\s+([A-Za-z_][\w]*)/gm;
          const seen = new Set();
          let m;
          while ((m = re.exec(body)) !== null) {
            if (!seen.has(m[1])) { seen.add(m[1]); lines.push('- ' + m[1]); }
          }
          if (seen.size === 0) lines.push('(no module-level defs/classes found)');
        } else {
          lines.push('No symbol extractor for language: ' + lang);
        }
        return note(lines.join('\n'));
      },
    });

    // -------------------------------------------------------------------------
    // Tool 3: cdx_imports — import graph edges for a file.
    // -------------------------------------------------------------------------
    const importsTool = harness.defineTool({
      name: 'cdx_imports',
      description: 'Return the import edges for a file. For TS/JS: `import ... from \'X\'` and `require(\'X\')`. For Python: `import X` and `from X import ...`. The model reads the file and feeds the body.',
      parameters: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Absolute path to the file.' },
          body: { type: 'string', description: 'Optional: the file body (avoids a second read).' },
          language: { type: 'string', description: 'Auto-detect from extension if empty.' },
        },
        required: ['filePath'],
      },
      output: stringOutput,
      execute: function (_args, params) {
        const ext = (params.filePath.split('.').pop() || '').toLowerCase();
        const lang = params.language || (ext === 'py' ? 'python' : (LANG_EXT[ext] || 'unknown'));
        const body = params.body || '';
        const lines = [
          '# Imports for ' + params.filePath,
          '# language: ' + lang,
          '',
        ];
        if (!body) {
          lines.push('No body provided. The model should call the native `read` tool on this file, then call cdx_imports again with the body filled in.');
        } else if (lang === 'typescript' || lang === 'javascript') {
          const fromRe = /import\s+(?:[^'"`]+from\s+)?["']([^'"`]+)["']/g;
          const requireRe = /require\(\s*["']([^'"`]+)["']\s*\)/g;
          const seen = new Set();
          let m;
          while ((m = fromRe.exec(body)) !== null) { if (!seen.has(m[1])) { seen.add(m[1]); lines.push('- ' + m[1]); } }
          while ((m = requireRe.exec(body)) !== null) { if (!seen.has(m[1])) { seen.add(m[1]); lines.push('- ' + m[1] + '  (require)'); } }
          if (seen.size === 0) lines.push('(no imports found)');
        } else if (lang === 'python') {
          const importRe = /^\s*(?:import\s+([\w.]+)|from\s+([\w.]+)\s+import\s+[^#\n]+)/gm;
          const seen = new Set();
          let m;
          while ((m = importRe.exec(body)) !== null) { const mod = m[1] || m[2]; if (mod && !seen.has(mod)) { seen.add(mod); lines.push('- ' + mod); } }
          if (seen.size === 0) lines.push('(no imports found)');
        } else {
          lines.push('No import extractor for language: ' + lang);
        }
        return note(lines.join('\n'));
      },
    });

    // -------------------------------------------------------------------------
    // Tool 4: cdx_owner — owning package + subsystem page + Agent Note.
    // -------------------------------------------------------------------------
    const ownerTool = harness.defineTool({
      name: 'cdx_owner',
      description: 'Given a file path, identify its owning package, its closest subsystems page, and the most relevant Agent Note. The model infers from path conventions; this tool returns the convention and the search recipe.',
      parameters: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Absolute path to the file.' },
        },
        required: ['filePath'],
      },
      output: stringOutput,
      execute: function (_args, params) {
        const p = params.filePath;
        const lines = [
          '# Owner lookup for ' + p,
          '',
          '## Path conventions (DSH substrate)',
          '- `packages/<group>/<pkg>/src/...` → owning package is `dsh-<pkg>`, README at `packages/<group>/<pkg>/README.md`, subsystem page indexed at `docs/subsystems/`.',
          '- `packages/preset/agent-presets/presets/<id>/...` → owning preset is `<id>`, composition at `presets/<id>/agent.cordis.yml`.',
          '- `docs/subsystems/...` → owning subsystem (its index in `docs/subsystems/README.md` lists which package owns it).',
          '- `.agents/notes/<tier>/<category>/<date>-<name>.md` → tier is `implemented` | `proposed` | `archived` | `rejected`. `implemented/` is the current authority.',
          '- `docs/cookbook/...` → owning extension cookbook entry.',
          '',
          '## Lookup recipe',
          '1. Strip the file path to its package-relative form.',
          '2. Match against the conventions above.',
          '3. If `packages/<group>/<pkg>/...`: read `packages/<group>/<pkg>/package.json` for `description`; the owning subsystem page is the entry that links to this package in `docs/subsystems/README.md`.',
          '4. If `.agents/notes/...`: read the file\'s own Status header; the owning capability is usually named in the first paragraph.',
          '5. If still ambiguous: read the `description:` frontmatter / JSDoc header — every shipped package has one.',
          '',
          'This tool does not perform the lookup; it returns the recipe. The model runs the recipe via native `read` and `grep`.',
        ];
        return note(lines.join('\n'));
      },
    });

    // -------------------------------------------------------------------------
    // Tool 5: cdx_diff — file-level diff against a git ref.
    // -------------------------------------------------------------------------
    const diffTool = harness.defineTool({
      name: 'cdx_diff',
      description: 'Return the file-level diff (`git diff --name-status <baseline>`) for a git ref. Read-only; the model feeds the output to itself. Useful for review scoping.',
      parameters: {
        type: 'object',
        properties: {
          baseline: { type: 'string', description: 'Git ref to diff against (branch, tag, sha, "HEAD~1"). Default "HEAD~1".' },
          root: { type: 'string', description: 'Repo root; defaults to DSH project root if empty.' },
          pathspec: { type: 'string', description: 'Optional pathspec to limit the diff (e.g. "packages/skill/").' },
        },
      },
      output: stringOutput,
      execute: function (_args, params) {
        const base = params.baseline || 'HEAD~1';
        const root = params.root || '(DSH project root)';
        const pathspec = params.pathspec ? ' -- ' + params.pathspec : '';
        const lines = [
          '# cdx_diff — file-level diff against ' + base,
          '',
          'The model should run:',
          '',
          '  git -C ' + root + ' diff --name-status ' + base + pathspec,
          '',
          'Then summarize:',
          '- M = modified files',
          '- A = added files (newly tracked)',
          '- D = deleted files',
          '- R = renamed files (followed by score)',
          '',
          'For per-hunk review, the model should follow with:',
          '',
          '  git -C ' + root + ' diff ' + base + pathspec,
          '',
          'Codex does not run git; it returns the recipe. Bash does the walking.',
        ];
        return note(lines.join('\n'));
      },
    });

    // -------------------------------------------------------------------------
    // Register all five.
    // -------------------------------------------------------------------------
    const d1 = disposers.push(harness.registerTool(ctx, mapTool));
    const d2 = disposers.push(harness.registerTool(ctx, symbolsTool));
    const d3 = disposers.push(harness.registerTool(ctx, importsTool));
    const d4 = disposers.push(harness.registerTool(ctx, ownerTool));
    const d5 = disposers.push(harness.registerTool(ctx, diffTool));

    ctx.effect(function () { return function dispose() {
      d1(); d2(); d3(); d4(); d5();
    }; }, 'cdx:dispose-all');
      })();
    // ============================================================================
    // memory (4 tools)
    // ============================================================================
    (function () {

    const POOL_KEY = 'mem.callCount';
    let callCount = 0;
    const note = function (text) {
      callCount += 1;
      if (callCount > 12) {
        return text + '\n\n[memory] Note: ' + callCount + ' calls. Consider stopping the memory plugin; you have enough recall for the current task.';
      }
      return text;
    };

    const stringOutput = {
      schema: { type: 'string' },
      render: function (_args, value) { return [{ type: 'text', text: String(value) }]; },
    };

    const SCOPES = ['per-agent', 'per-group', 'per-company', 'global'];
    const RANK = { 'per-agent': 0, 'per-group': 1, 'per-company': 2, 'global': 3 };
    const HOME = (typeof process !== 'undefined' && process.env && process.env.DSH_HOME) || '/home/fares/.dsh';
    const MEMORY_ROOT = HOME + '/memory';

    const fs = ctx.get('fs');
    const fsReady = !!(fs && typeof fs.readText === 'function' && typeof fs.writeText === 'function' && typeof fs.listDir === 'function');

    function slugify(s) {
      return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'untitled';
    }
    function today() {
      return new Date().toISOString().slice(0, 10);
    }
    function notePath(scope, name) {
      return MEMORY_ROOT + '/' + scope + '/' + today() + '-' + slugify(name) + '.md';
    }

    // -------------------------------------------------------------------------
    // Tool 1: mem_write — append a note to a scope.
    // -------------------------------------------------------------------------
    const writeTool = harness.defineTool({
      name: 'mem_write',
      description: 'Write a note into the memory store at the given scope. The note is stored as a Markdown file under ~/.dsh/memory/<scope>/<date>-<slug>.md. The body is the user-facing note text; the file includes a small frontmatter (id, date, tags, scope).',
      parameters: {
        type: 'object',
        properties: {
          scope: { type: 'string', description: 'One of: per-agent, per-group, per-company, global. (per-agent is the default.)' },
          title: { type: 'string', description: 'Short title. Used for the filename and the H1 heading.' },
          body: { type: 'string', description: 'The note body, in Markdown.' },
          tagsCsv: { type: 'string', description: 'Comma-separated tags for later search. Optional.' },
        },
        required: ['title', 'body'],
      },
      output: stringOutput,
      execute: function (_args, params) {
        const scope = SCOPES.indexOf(params.scope) >= 0 ? params.scope : 'per-agent';
        if (!fsReady) {
          return note('mem_write unavailable: ctx.fs is not reachable from this dynamic plugin. As a fallback, the model should use the native `write` tool to create the file directly at `' + notePath(scope, params.title) + '`. The expected body is:\n\n---\n\n' + '# ' + params.title + '\n\n' + params.body + '\n\n---\n\n[memory] would also add a frontmatter: `<!-- memory: scope=' + scope + ' tags=' + (params.tagsCsv || '') + ' date=' + today() + ' -->`');
        }
        return note('mem_write will create: ' + notePath(scope, params.title) + '\n\nfrontmatter: `<!-- memory: scope=' + scope + ' tags=' + (params.tagsCsv || '') + ' date=' + today() + ' -->`\n\nbody:\n\n# ' + params.title + '\n\n' + params.body + '\n\nThe model should call the native `write` tool with this content.');
      },
    });

    // -------------------------------------------------------------------------
    // Tool 2: mem_read — return the k most recent notes from a scope.
    // -------------------------------------------------------------------------
    const readTool = harness.defineTool({
      name: 'mem_read',
      description: 'Return the k most recent notes from a scope (default k=5, default scope=per-agent). The list is reverse-chronological by date prefix in the filename.',
      parameters: {
        type: 'object',
        properties: {
          scope: { type: 'string', description: 'per-agent | per-group | per-company | global. Default per-agent.' },
          k: { type: 'string', description: 'Max notes to return. Default 5.' },
          tagsCsv: { type: 'string', description: 'Optional: only return notes whose tags include ALL of these (comma-separated).' },
        },
      },
      output: stringOutput,
      execute: function (_args, params) {
        const scope = SCOPES.indexOf(params.scope) >= 0 ? params.scope : 'per-agent';
        const k = Math.max(1, Math.min(50, parseInt(params.k || '5', 10) || 5));
        if (!fsReady) {
          return note('mem_read unavailable: ctx.fs is not reachable from this dynamic plugin. As a fallback, the model should run `ls -t ~/.dsh/memory/' + scope + '/ | head -' + k + '` via bash, then call `read` on the top entries.');
        }
        return note('mem_read will list ~/.dsh/memory/' + scope + '/ sorted by mtime desc, take top ' + k + ', then read each body.\n\nThe model should run:\n  bash: ls -1t ~/.dsh/memory/' + scope + '/ | head -' + k + '\n  then: read each file in the list');
      },
    });

    // -------------------------------------------------------------------------
    // Tool 3: mem_search — keyword search over a scope.
    // -------------------------------------------------------------------------
    const searchTool = harness.defineTool({
      name: 'mem_search',
      description: 'Keyword search over a scope. Returns the matching notes (frontmatter + first matching line + file path).',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query; substring match against title, body, and tags.' },
          scope: { type: 'string', description: 'per-agent | per-group | per-company | global | all. Default per-agent.' },
          k: { type: 'string', description: 'Max matches. Default 10.' },
        },
        required: ['query'],
      },
      output: stringOutput,
      execute: function (_args, params) {
        const scope = params.scope || 'per-agent';
        const k = Math.max(1, Math.min(50, parseInt(params.k || '10', 10) || 10));
        if (!fsReady) {
          return note('mem_search unavailable: ctx.fs is not reachable from this dynamic plugin. As a fallback:\n\n  bash: grep -ril "' + params.query + '" ~/.dsh/memory/' + scope + '/ | head -' + k + '\n  then: read each match');
        }
        return note('mem_search will grep for "' + params.query + '" under ~/.dsh/memory/' + scope + '/ (or all scopes), sort by mtime, take top ' + k + '.\n\nThe model should run:\n  bash: grep -rli "' + params.query + '" ~/.dsh/memory/' + scope + '/ 2>/dev/null | head -' + k);
      },
    });

    // -------------------------------------------------------------------------
    // Tool 4: mem_promote — move a note up the hierarchy.
    // -------------------------------------------------------------------------
    const promoteTool = harness.defineTool({
      name: 'mem_promote',
      description: 'Promote a note from a lower scope to a higher one. The note file is moved (with a `--promoted` suffix) and the frontmatter `scope` is rewritten. Demotion is not supported; archive the old note instead.',
      parameters: {
        type: 'object',
        properties: {
          notePath: { type: 'string', description: 'Absolute path to the note to promote. Must live under ~/.dsh/memory/.' },
          toScope: { type: 'string', description: 'Target scope (must be higher than the current one): per-group, per-company, or global.' },
        },
        required: ['notePath', 'toScope'],
      },
      output: stringOutput,
      execute: function (_args, params) {
        const from = params.notePath;
        const to = params.toScope;
        // Determine current scope from path.
        const m = from.match(/\/memory\/(per-[a-z]+|global)\//);
        const fromScope = m ? m[1] : 'per-agent';
        if (RANK[to] === undefined) return note('mem_promote: unknown target scope "' + to + '". Use per-group, per-company, or global.');
        if (RANK[to] <= (RANK[fromScope] || 0)) {
          return note('mem_promote refused: target scope "' + to + '" is not higher than current scope "' + fromScope + '". Demotion is not supported; archive instead.');
        }
        if (!fsReady) {
          return note('mem_promote unavailable: ctx.fs is not reachable. As a fallback, the model should use the native `bash` tool:\n\n  mv "' + from + '" "' + MEMORY_ROOT + '/' + to + '/"\n  then: rewrite the frontmatter line `<!-- memory: scope=...` to `<!-- memory: scope=' + to + ' ...`\n  via the native `edit` tool.');
        }
        return note('mem_promote will move the file `' + from + '` into `' + MEMORY_ROOT + '/' + to + '/` and rewrite its `scope=` frontmatter to `' + to + '`.\n\nThe model should:\n  1. bash: mkdir -p ' + MEMORY_ROOT + '/' + to + '\n  2. bash: mv "' + from + '" ' + MEMORY_ROOT + '/' + to + '/\n  3. edit: rewrite `scope=' + fromScope + '` to `scope=' + to + '` in the new location');
      },
    });

    const d1 = disposers.push(harness.registerTool(ctx, writeTool));
    const d2 = disposers.push(harness.registerTool(ctx, readTool));
    const d3 = disposers.push(harness.registerTool(ctx, searchTool));
    const d4 = disposers.push(harness.registerTool(ctx, promoteTool));

    ctx.effect(function () { return function dispose() {
      d1(); d2(); d3(); d4();
    }; }, 'mem:dispose-all');
      })();
    // ============================================================================
    // workflow (3 tools)
    // ============================================================================
    (function () {

    const POOL_KEY = 'wf.callCount';
    let callCount = 0;
    const note = function (text) {
      callCount += 1;
      if (callCount > 6) {
        return text + '\n\n[workflow] Note: ' + callCount + ' calls. Workflow runs are long; consider stopping the workflow plugin when the run is done.';
      }
      return text;
    };

    const stringOutput = {
      schema: { type: 'string' },
      render: function (_args, value) { return [{ type: 'text', text: String(value) }]; },
    };

    const wf = ctx.get('workflowEngine');
    const wfReady = !!(wf && typeof wf.start === 'function');

    // -------------------------------------------------------------------------
    // Tool 1: wf_compose — orch plan → workflow script body.
    // -------------------------------------------------------------------------
    const composeTool = harness.defineTool({
      name: 'wf_compose',
      description: 'Convert an `orch_pipeline` plan (a JSON array of {mode, task} steps) into a workflow script body. The script fans out each step to a subagent with the chosen mode as a prompt overlay, collects results, and returns the joined final value.',
      parameters: {
        type: 'object',
        properties: {
          stepsJson: { type: 'string', description: 'JSON array of {mode, task} steps, e.g. `[{"mode":"caveman","task":"draft"},{"mode":"pony","task":"simplify"}]`.' },
          name: { type: 'string', description: 'Workflow name; appears in meta.name. Default "dyno-pony-pipeline".' },
        },
        required: ['stepsJson'],
      },
      output: stringOutput,
      execute: function (_args, params) {
        let steps = [];
        try { steps = JSON.parse(params.stepsJson || '[]'); } catch (e) { return note('wf_compose: stepsJson is not valid JSON: ' + e.message); }
        if (!Array.isArray(steps) || steps.length === 0) return note('wf_compose: stepsJson must be a non-empty array.');

        const name = params.name || 'dyno-pony-pipeline';
        const overlay = function (mode) {
          if (mode === 'pony') return 'You are running in PONYT MODE. Apply the YAGNI ladder. Stop at the first rung that holds. Reply with the working result, not the process.';
          if (mode === 'caveman') return 'You are running in CAVEMAN MODE. Terse prose. Drop filler. Fragments OK. Reply with the working result, not the process.';
          return 'You are running in BASELINE MODE. Normal prose, normal reasoning. Reply with the working result, not the process.';
        };

        const stepCalls = steps.map(function (s, i) {
          return "  // step " + (i + 1) + ": " + s.mode + "\n" +
                 "  phase('" + s.mode + " step " + (i + 1) + "');\n" +
                 "  results.push(await agent(\n" +
                 "    '" + (s.task || '').replace(/'/g, "\\'") + "\\n\\nMODE OVERLAY:\\n" + overlay(s.mode) + "',\n" +
                 "    { label: 'step-" + (i + 1) + "-" + s.mode + "' }\n" +
                 "  ));\n";
        }).join('\n');

        const body = [
          "// Generated by wf_compose. Submit via wf_run, or via the substrate's `workflow` tool.",
          "const meta = { name: '" + name + "', description: 'composed from orch plan' };",
          "",
          "phase('" + name + " start');",
          "log('running " + steps.length + " step(s)');",
          "",
          "const results = [];",
          stepCalls,
          "",
          "return {",
          "  name: meta.name,",
          "  stepCount: " + steps.length + ",",
          "  results: results,",
          "};",
          "",
        ].join('\n');

        return note(body);
      },
    });

    // -------------------------------------------------------------------------
    // Tool 2: wf_run — submit to ctx.workflowEngine.start.
    // -------------------------------------------------------------------------
    const runTool = harness.defineTool({
      name: 'wf_run',
      description: 'Submit a workflow script body to ctx.workflowEngine.start. Returns the runId on success; the model later calls wf_collect with that runId. If ctx.workflowEngine is unreachable from this dynamic plugin, the tool returns a downgrade recipe (the model should submit the same script via the native `workflow` tool).',
      parameters: {
        type: 'object',
        properties: {
          script: { type: 'string', description: 'The script body (output of wf_compose, or a hand-written one).' },
          name: { type: 'string', description: 'Workflow name; appears in meta.name. Default "dyno-pony-workflow".' },
          argsJson: { type: 'string', description: 'Optional JSON value to pass as `args` to the script.' },
        },
        required: ['script'],
      },
      output: stringOutput,
      execute: function (_args, params) {
        const name = params.name || 'dyno-pony-workflow';
        if (!wfReady) {
          return note('wf_run unavailable: ctx.workflowEngine is not reachable from this dynamic plugin. The model should submit the script via the native `workflow` tool (or the `run` / `headless` profile), passing this same `script` body and `meta: { name: "' + name + '" }`.');
        }
        return note('wf_run will call:\n  ctx.workflowEngine.start({\n    meta: { name: "' + name + '", description: "composed by dyno-pony workflow plugin" },\n    script: <body>,\n    args: ' + (params.argsJson || 'undefined') + '\n  })\n\nCapture the returned `run.id` and pass it to wf_collect.\n\nThe model should now invoke the native `workflow` tool with the same script, since dynamic plugins in this harness do not directly call ctx.workflowEngine.start.');
      },
    });

    // -------------------------------------------------------------------------
    // Tool 3: wf_collect — wait for the run and return the final value.
    // -------------------------------------------------------------------------
    const collectTool = harness.defineTool({
      name: 'wf_collect',
      description: 'Wait for a workflow run to settle and return its final JSON value. The model polls ctx.jobs for the runId, then returns the result. Useful after wf_run.',
      parameters: {
        type: 'object',
        properties: {
          runId: { type: 'string', description: 'The runId returned by wf_run (or the native `workflow` tool).' },
          timeoutMs: { type: 'string', description: 'Wait budget in ms. Default 600000 (10 min).' },
        },
        required: ['runId'],
      },
      output: stringOutput,
      execute: function (_args, params) {
        const timeout = parseInt(params.timeoutMs || '600000', 10) || 600000;
        return note('wf_collect will wait up to ' + timeout + 'ms for run "' + params.runId + '" to settle.\n\nThe model should:\n  1. bash: poll `~/.dsh/sessions/<id>/runs/' + params.runId + '.json` (or use the substrate\'s `workflow status` command) every 5s until `stopReason` is set.\n  2. Return the run\'s `result` value verbatim.');
      },
    });

    const d1 = disposers.push(harness.registerTool(ctx, composeTool));
    const d2 = disposers.push(harness.registerTool(ctx, runTool));
    const d3 = disposers.push(harness.registerTool(ctx, collectTool));

    ctx.effect(function () { return function dispose() {
      d1(); d2(); d3();
    }; }, 'wf:dispose-all');
      })();
    // ============================================================================
    // trace (2 tools)
    // ============================================================================
    (function () {

    const POOL_KEY = 'trc.callCount';
    let callCount = 0;
    const note = function (text) {
      callCount += 1;
      if (callCount > 6) {
        return text + '\n\n[trace] Note: ' + callCount + ' calls. Consider stopping the trace plugin; you have enough mode-flow data for the current task.';
      }
      return text;
    };

    const stringOutput = {
      schema: { type: 'string' },
      render: function (_args, value) { return [{ type: 'text', text: String(value) }]; },
    };

    const sessions = ctx.get('sessions');
    const sessionQuery = ctx.get('sessionQuery');
    const ready = !!(sessionQuery && typeof sessionQuery.filterEvents === 'function');

    const DYNOPONY_TOOLS = [
      'ponytail', 'caveman',
      'orch_route', 'orch_compare', 'orch_pipeline', 'orch_status',
      'dsh_author_inspect', 'dsh_author_define', 'dsh_author_run', 'dsh_author_validate', 'dsh_author_recover',
      'memo_classify', 'memo_format', 'memo_link', 'memo_scope', 'memo_archive', 'memo_review',
      'ptest_template', 'ptest_assertions', 'ptest_harness',
      'cdx_map', 'cdx_symbols', 'cdx_imports', 'cdx_owner', 'cdx_diff',
      'mem_write', 'mem_read', 'mem_search', 'mem_promote',
      'wf_compose', 'wf_run', 'wf_collect',
      'trc_mode_flow', 'trc_diff',
    ];

    // -------------------------------------------------------------------------
    // Tool 1: trc_mode_flow — return the ordered dyno-pony tool invocations.
    // -------------------------------------------------------------------------
    const flowTool = harness.defineTool({
      name: 'trc_mode_flow',
      description: 'Return the ordered list of dyno-pony tool invocations in a session, with timestamps and arguments. Default scope: the current session.',
      parameters: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Target session id; defaults to the current session if empty.' },
        },
      },
      output: stringOutput,
      execute: function (_args, params) {
        if (!ready) {
          return note('trc_mode_flow unavailable: ctx.sessionQuery is not reachable from this dynamic plugin. As a fallback, the model should use the native `bash` tool to read the session log directly:\n\n  zstdcat ~/.dsh/sessions/<sessionId>/session.jsonl.zstd | grep -E "tool/(call|result)" | grep -E "' + DYNOPONY_TOOLS.join('|') + '"\n\nReplace `<sessionId>` with `' + (params.sessionId || '<current>') + '`.');
        }
        return note('trc_mode_flow will:\n  1. Resolve session: ' + (params.sessionId || '(current)') + '\n  2. sessionQuery.filterEvents for tool/call events\n  3. Filter to dyno-pony tool names: ' + DYNOPONY_TOOLS.join(', ') + '\n  4. Return the ordered list with seq, timestamp, tool name, and parsed arguments.\n\nThe model should now call sessionQuery.filterEvents via the native bash path on the session log, since direct ctx access is not stable in dynamic plugins.');
      },
    });

    // -------------------------------------------------------------------------
    // Tool 2: trc_diff — compare two sessions' mode flows.
    // -------------------------------------------------------------------------
    const diffTool = harness.defineTool({
      name: 'trc_diff',
      description: 'Compare two sessions\' dyno-pony mode flows side-by-side. Returns the per-tool call counts, the order, and the union/intersection.',
      parameters: {
        type: 'object',
        properties: {
          sessionA: { type: 'string', description: 'First session id.' },
          sessionB: { type: 'string', description: 'Second session id.' },
        },
        required: ['sessionA', 'sessionB'],
      },
      output: stringOutput,
      execute: function (_args, params) {
        if (!ready) {
          return note('trc_diff unavailable: ctx.sessionQuery is not reachable. As a fallback, the model should run trc_mode_flow for each session and compare by hand:\n\n  for each in ' + params.sessionA + ' ' + params.sessionB + ':\n    zstdcat ~/.dsh/sessions/<id>/session.jsonl.zstd | grep "tool/call" | grep -E "' + DYNOPONY_TOOLS.join('|') + '"\n\nThen build the diff table: per-tool call counts, ordering, and union/intersection.');
        }
        return note('trc_diff will:\n  1. Run trc_mode_flow on ' + params.sessionA + '\n  2. Run trc_mode_flow on ' + params.sessionB + '\n  3. Return the diff: per-tool call counts (A vs B), per-tool first-call timestamp delta, and tools called in only one of the two.\n\nThe model should run both flows via the bash fallback and assemble the diff table by hand.');
      },
    });

    const d1 = disposers.push(harness.registerTool(ctx, flowTool));
    const d2 = disposers.push(harness.registerTool(ctx, diffTool));

    ctx.effect(function () { return function dispose() {
      d1(); d2();
    }; }, 'trc:dispose-all');
      })();
    // ============================================================================
    // sphinx (1 tools)
    // ============================================================================
    (function () {

    const SESSION_KEY = 'sphinx.callCount';
    const QUIET_KEY   = 'sphinx.quietSinceCheckpoint';
    const SAMPLE_KEY  = 'sphinx.lastSample';
    const THRESHOLD_TOOL_CALLS = 5;
    const THRESHOLD_LARGE_READS = 3;
    const THRESHOLD_IDLE_TURNS  = 20;
    const QUIET_TURNS_TO_SLEEP  = 5;

    const session = ctx.get('sessions');
    const s = session && typeof session.current === 'function' && session.current();

    const note = function (text) {
      if (s) {
        s[SESSION_KEY] = (s[SESSION_KEY] || 0) + 1;
        if (s[SESSION_KEY] > 20) {
          return text + '\n\n[sphinx] Note: ' + s[SESSION_KEY] + ' calls this session.';
        }
      }
      return text;
    };

    const shouldAudIt = function () {
      if (!s) return { fire: false, reason: 'no-session' };
      const calls      = (s.toolCallCount  || 0);
      const largeReads = (s.largeReadCount || 0);
      const idleTurns  = (s.idleTurnCount  || 0);
      if (largeReads >= THRESHOLD_LARGE_READS) {
        return { fire: true, reason: 'large-reads', metric: largeReads };
      }
      if (calls >= THRESHOLD_TOOL_CALLS && idleTurns >= THRESHOLD_IDLE_TURNS) {
        return { fire: true, reason: 'tool-calls-and-idle', metric: calls };
      }
      if (idleTurns >= THRESHOLD_IDLE_TURNS) {
        return { fire: true, reason: 'idle', metric: idleTurns };
      }
      return { fire: false, reason: 'below-threshold' };
    };

    const ACTIONS = {
      audit: function (focus) {
        const verdict = shouldAudIt();
        const where = focus ? ' on `' + focus + '`' : '';
        return note([
          '# Sphinx audit' + where,
          '',
          'Why this fired: **' + verdict.reason + '**' +
            (verdict.metric ? ' (metric=' + verdict.metric + ')' : '') + '.',
          '',
          'Check the live session counters:',
          '- `s.toolCallCount`  — total tool calls since session start',
          '- `s.largeReadCount` — reads of files > 200 lines',
          '- `s.idleTurnCount`  — turns with no new user message',
          '',
          'What to do:',
          '- If `largeReadCount >= 3`: drop file contents from the working summary; keep paths + 1-line takeaways.',
          '- If `idleTurnCount >= 20`: ask the user one terse "still here?" or close the loop.',
          '- If `toolCallCount >= 5` AND we are > 60% through the context band: call `checkpoint()`.',
          '',
          'Self-deactivate: after a `checkpoint()`, stay silent for ' + QUIET_TURNS_TO_SLEEP +
            ' quiet turns, then resume normal flow.',
        ].join('\n'));
      },

      checkpoint: function (scope) {
        if (s) {
          s[QUIET_KEY] = 0;
          s[SAMPLE_KEY] = { at: Date.now(), scope: scope || 'full' };
        }
        const target = scope || 'full';
        return note([
          '# Sphinx checkpoint (' + target + ')',
          '',
          'Capture a clean summary NOW before the next batch of reads. ' +
            'This is the same as what `compact` would do, but you do it yourself.',
          '',
          '## Steps',
          '1. List the files you have read this session and one line on each.',
          '2. List the decisions you have made (with the `ponytail` / `memo` tier).',
          '3. List the open questions for the user.',
          '4. Drop every raw file body. Keep paths + takeaways.',
          '5. Continue from the summary. Do NOT re-read files unless asked.',
          '',
          'Quiet-turn budget: ' + QUIET_TURNS_TO_SLEEP + '. After that, resume normal tool calls.',
          'Deactivate with: `stop sphinx` / `normal mode`.',
        ].join('\n'));
      },

      predict: function (next) {
        const verdict = shouldAudIt();
        const hint = next ? ' for: `' + next + '`' : '';
        return note([
          '# Sphinx predict' + hint,
          '',
          'Heuristic verdict now: **' + verdict.reason + '**' +
            (verdict.metric ? ' (metric=' + verdict.metric + ')' : '') + '.',
          '',
          'Predict whether the next request will fit:',
          '- current band: ~60% (assuming the 3 thresholds above)',
          '- next request cost: <tool_calls> x <avg_read_size> + <assistant_overhead>',
          '- if predicted > 100% → call `checkpoint()` first, THEN answer.',
          '- if predicted 80-100% → answer tersely (caveman terse mode).',
          '- if predicted < 80% → answer normally.',
          '',
          'Pair with: `ponytail(mode=ultra)` for the laziest rebuild, or ' +
            '`caveman(action=terse)` for the shortest reply.',
        ].join('\n'));
      },
    };

    const tool = {
      name: 'sphinx',
      description: 'Context budget governor (حاكم ميزانية السياق). Use when the model has burned through 5+ tool calls since the last sphinx call, 3+ large file reads, 20+ idle turns, or the user says "checkpoint". Auto-activates on a narrow heuristic — never always-on. Composes with ponytail (lazy rebuild) and caveman (terse mode).',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['audit', 'checkpoint', 'predict'],
            description: 'Which sphinx action to invoke. audit: peek at session counters and recommend a course. checkpoint: capture a clean summary now and start a quiet window. predict: estimate whether the next request will fit.',
          },
          focus:   { type: 'string', description: 'Optional path / scope for audit (e.g. `src/foo.ts`).' },
          scope:   { type: 'string', enum: ['full', 'files', 'decisions', 'questions'], description: 'What the checkpoint captures. Default: full.' },
          next:    { type: 'string', description: 'Optional description of the next user request, for predict().' },
        },
        required: ['action'],
      },
      output: {
        schema: { type: 'string' },
        render: function (_args, value) { return [{ type: 'text', text: String(value) }]; },
      },
      execute: async function (_args, params) {
        const a = (params && params.action) || (_args && _args.action);
        if (!a || typeof ACTIONS[a] !== 'function') {
          return 'Unknown action. Valid: audit, checkpoint, predict.';
        }
        return ACTIONS[a](
          params.focus || (_args && _args.focus),
          params.scope || (_args && _args.scope),
          params.next  || (_args && _args.next)
        );
      },
    };

    const dispose = harness.registerTool(ctx, harness.defineTool(tool));
    ctx.effect(function () { return dispose; }, 'sphinx:dispose-on-fork');
    console.log('[sphinx] registered tool "sphinx" (actions: audit, checkpoint, predict).');
      })();
    // ============================================================================
    // drift (1 tools)
    // ============================================================================
    (function () {

    const POOL_KEY = 'drift.callCount';
    const session = ctx.get('sessions');
    if (session && typeof session.current === 'function' && session.current()) {
      const s = session.current();
      if (s && !s[POOL_KEY]) s[POOL_KEY] = 0;
    }

    const note = function (text) {
      const s = session && session.current && session.current();
      if (s) s[POOL_KEY] = (s[POOL_KEY] || 0) + 1;
      if (s && s[POOL_KEY] > 8) {
        return text + '\n\n[drift] Note: ' + s[POOL_KEY] +
          ' calls. drift should be quiet once a session is healthy; consider stopping it.';
      }
      return text;
    };

    const FOSSILS = [
      /\bas i (?:already )?(?:mentioned|said|noted|stated)\b/i,
      /\bas (?:we|i) (?:discussed|covered|established|noted)\b/i,
      /\bearlier (?:we|i|you) (?:discussed|covered|established|noted)\b/i,
      /\bas (?:before|mentioned|discussed)(?:[,.])/i,
      /\blike i (?:just )?said\b/i,
      /\bremember (?:that )?when we\b/i,
    ];

    const stringOutput = {
      schema: { type: 'string' },
      render: function (_args, value) { return [{ type: 'text', text: String(value) }]; },
    };

    const ACTIONS = {
      loop: function () {
        return note([
          '# Drift — loop check',
          '',
          'You tripped one of the linguistic fossils (or it has been ~5 turns',
          'past turn 8). Run this loop check ON the last 3-5 of your own turns,',
          'then continue.',
          '',
          '## Procedure',
          '1. Re-read your last 3 statements verbatim.',
          '2. For each pair (i, j), check: did you restate claim i as if it were new in claim j?',
          '3. If yes: name the loop explicitly. Cite the earlier claim and the new one.',
          '4. If you are mid-explanation of the SAME fact (not a loop): that is legitimate recap — continue.',
          '5. If you contradicted yourself: switch to `drift(action="contradict")`.',
          '',
          '## Output format (terse)',
          '- Loop found: `<old turn N>: <claim>. <new turn M>: <same claim as fresh>. Cut one.>`',
          '- No loop: `clean. continue.`',
          '',
          'Do not narrate this check to the user. It is a private self-loop.',
        ].join('\n'));
      },

      contradict: function () {
        return note([
          '# Drift — contradiction check',
          '',
          'You suspect (or a fossil suggests) you made two claims that disagree.',
          'Run this contradiction check against your last 3-5 turns.',
          '',
          '## Procedure',
          '1. List each factual claim from your last 3-5 turns as one line.',
          '2. For each pair, check: do they disagree on a fact (not a value judgment)?',
          '3. If yes: name the contradiction. Cite both turns and which claim you stand by now.',
          '4. If no factual disagreement: `clean. continue.`',
          '5. If the new turn refines the old one (not contradicts it): that is refinement, not contradiction.',
          '',
          '## Output format (terse)',
          '- Contradiction: `<turn A> said X. <turn B> said Y. Both kept: impossible. Keeping Y because <reason>.>`',
          '- Refinement (not contradiction): `<turn A> said X. <turn B> narrows to X\'. Consistent.>`',
          '- Clean: `clean. continue.`',
          '',
          'Do not narrate this check to the user. It is a private self-loop.',
        ].join('\n'));
      },

      silent: function () {
        return note([
          '# Drift — silent (no-op)',
          '',
          'Acknowledged. The fossil was a legitimate recap or the cadence was a false alarm.',
          'No loop, no contradiction. Continue.',
          '',
          'If you keep tripping fossils for 10 consecutive turns without finding',
          'a real loop/contradiction, drift auto-deactivates. You can also say',
          '`stop drift` to turn it off now.',
        ].join('\n'));
      },
    };

    const tool = {
      name: 'drift',
      description: 'Live transcript loop / contradiction detector. Use when you catch yourself saying "as I mentioned", "earlier we…", "as before" (linguistic fossils of context loss), or every ~5 turns after turn 8 of a long session. Three actions: loop (re-read last 3 turns for circular restatement), contradict (check last 3 turns for disagreeing claims), silent (no-op when the fossil was a legitimate recap). Pairs with trace (POST-HOC logs) and codex (repo-archaeology). Off with "stop drift".',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['loop', 'contradict', 'silent'],
            description: 'Which drift action to invoke. loop = re-read last 3-5 turns for circular restatement. contradict = check last 3-5 turns for disagreeing factual claims. silent = acknowledge the fossil was a false alarm and continue.',
          },
        },
        required: ['action'],
      },
      output: stringOutput,
      execute: async function (_args, params) {
        const a = (params && params.action) || (_args && _args.action);
        if (!a || typeof ACTIONS[a] !== 'function') {
          return 'Unknown action. Valid: loop, contradict, silent.';
        }
        return ACTIONS[a]();
      },
    };

    const dispose = harness.registerTool(ctx, harness.defineTool(tool));
    ctx.effect(function () { return dispose; }, 'drift:dispose-on-fork');
    console.log('[drift] registered tool "drift" (actions: loop, contradict, silent).');
      })();
    // ============================================================================
    // second_order (1 tools)
    // ============================================================================
    (function () {

    const POOL_KEY = 'second_order.callCount';
    const QUIET_KEY = 'second_order.lastCheckTurn';
    const QUIET_TURNS = 15;

    const session = ctx.get('sessions');
    if (session && typeof session.current === 'function' && session.current()) {
      const s = session.current();
      if (s && !s[POOL_KEY]) s[POOL_KEY] = 0;
      if (s && s[QUIET_KEY] === undefined) s[QUIET_KEY] = -QUIET_TURNS;
    }

    const note = function (text) {
      const s = session && session.current && session.current();
      if (s) s[POOL_KEY] = (s[POOL_KEY] || 0) + 1;
      if (s && s[POOL_KEY] > 20) {
        return text + '\n\n[second_order] Note: ' + s[POOL_KEY] + ' checks this session.';
      }
      return text;
    };

    const markChecked = function () {
      const s = session && session.current && session.current();
      if (s) s[QUIET_KEY] = s.turn || 0;
    };

    const HARD_TO_UNDO = [
      { tag: 'delete',          re: /\brm\b|unlink|deleteFile|file_remove|\btrash\b/i,
        why: 'removal of a tracked file is hard to recover if it was the only copy' },
      { tag: 'schema',          re: /migrate|alter\s+table|drop\s+column|addColumn|prisma\.schema/i,
        why: 'schema changes cascade to every reader and writer in the system' },
      { tag: 'dependency',      re: /pnpm\s+(add|install)|npm\s+install.*--save|yarn\s+add/i,
        why: 'a new dependency is forever in the lockfile; cheap to add, costly to remove' },
      { tag: 'preset-edit',     re: /cordis_define|cordis_undefine|cordis_stop|agent\.cordis\.yml/i,
        why: 'a preset edit changes what tools the next session inherits' },
      { tag: 'shared-merge',    re: /git\s+push\s+origin\s+(main|master|develop)|gh\s+pr\s+merge/i,
        why: 'a merge to a shared branch is visible to everyone' },
      { tag: 'public-doc',      re: /README\.md|CHANGELOG|docs\/|AGENTS\.md/i,
        why: 'public-facing docs are read by people outside this session' },
      { tag: 'public-facing',   re: /\bship\b|\bpublish\b|\brelease\b|\bdeploy\b/i,
        why: 'an outbound action is hard to retract' },
    ];

    const classifyImminence = function (hint) {
      const hits = [];
      for (const r of HARD_TO_UNDO) {
        if (r.re.test(hint || '')) hits.push(r);
      }
      return hits;
    };

    const ACTIONS = {

      trace: function (change) {
        markChecked();
        const c = (change || '').trim();
        if (!c) {
          return note([
            '# Second-order trace',
            '',
            'Describe the change in one line, then call again.',
            '',
            'Example: second_order(action="trace", change="add a `delete` tool to the cordis preset")',
          ].join('\n'));
        }
        return note([
          '# Second-order trace — ' + c,
          '',
          '## Hop 1 — direct effect',
          '- What does the change touch immediately? (one file, one preset, one package)',
          '- Who calls it? Who imports it? Who reads it?',
          '',
          '## Hop 2 — second-order effect',
          '- What depends on the immediate effect?',
          '- What docs / tests / other sessions / future-Fares reference it?',
          '- What becomes impossible or unsaid if this lands?',
          '',
          '## Reverse check',
          '- Can you still undo this in 5 minutes? In 1 day? In 1 month?',
          '- If not, name what locks it in.',
          '',
          'Output: 3 lines max. Direct effect / Second-order / Undo cost.',
        ].join('\n'));
      },

      blast: function (change, scope) {
        markChecked();
        const c = (change || '').trim();
        const sc = (scope || 'workspace').trim();
        if (!c) {
          return note([
            '# Second-order blast',
            '',
            'Describe the change, then call again.',
            '',
            'Example: second_order(action="blast", change="rm /home/fares/Projects/deepseek-harness/.agents/skills/dyno-pony", scope="workspace")',
          ].join('\n'));
        }
        return note([
          '# Second-order blast — ' + c,
          '',
          'Scope: ' + sc,
          '',
          '## Callers (active code that imports / invokes)',
          '- grep -rn "from .<symbol>" .   → list every importer',
          '- if 0: state "no callers" and stop. Do not invent.',
          '',
          '## Tests',
          '- grep -rn "<symbol>" tests/   → list affected specs',
          '- if 0: state "no tests". Honest.',
          '',
          '## Docs / Agent Notes',
          '- grep -rn "<symbol>" docs/ .agents/notes/   → list cross-references',
          '- if 0: state "no docs".',
          '',
          '## Other sessions / future-Fares',
          '- does any preset / profile / memory note reference this path or symbol?',
          '- if 0: state "no external references".',
          '',
          '## Inverse: who would notice if it disappeared?',
          '- if the list above is empty AND nobody would notice, the change is safe.',
          '- if the list is non-empty, the change has a blast radius — name it.',
          '',
          'Rule: enumerate from real greps, not from imagination. Empty is a valid answer.',
        ].join('\n'));
      },

      gate: function (change, reason) {
        markChecked();
        const c = (change || '').trim();
        const r = (reason || '').trim();
        if (!c) {
          return note([
            '# Second-order gate',
            '',
            'Describe the change + the one deciding reason, then call again.',
            '',
            'Example: second_order(action="gate", change="delete dyno-pony preset", reason="0 callers, 0 tests, 0 docs")',
          ].join('\n'));
        }
        return note([
          '# Second-order gate — ' + c,
          '',
          'Reason given: ' + (r || '<none — state the one deciding reason first>'),
          '',
          '## Pick ONE verdict',
          '',
          '- GO        — change is safe. State why in one line.',
          '- HOLD      — change may be right but timing / blast radius is wrong. State the one thing that has to land first.',
          '- REDESIGN  — change solves the wrong layer. State the cheaper or more local alternative.',
          '',
          'Format:',
          '',
          'verdict: <GO|HOLD|REDESIGN>',
          'reason: <one line, the deciding fact>',
          '',
          'Never hedge. Two reasons = pick the strongest one and drop the other.',
        ].join('\n'));
      },

      heuristic: function () {
        const s = session && session.current && session.current();
        const lastTurn = s ? (s[QUIET_KEY] || 0) : 0;
        const nowTurn  = s ? (s.turn || 0) : 0;
        const sinceLast = nowTurn - lastTurn;
        const armed = sinceLast >= QUIET_TURNS;
        return note([
          '# Second-order — self-activation heuristic',
          '',
          '## Trigger (any of)',
          'File deletion:        rm / unlink / file_remove',
          'Schema change:        migrate / alter / drop column / add column',
          'Dependency addition:  pnpm add / npm install --save / yarn add',
          'Preset edit:          cordis_define / cordis_undefine / cordis_stop / agent.cordis.yml',
          'Merge to shared:      git push origin main|master|develop / gh pr merge',
          'Public doc:           README / CHANGELOG / docs/ / AGENTS.md',
          'Public-facing action: ship / publish / release / deploy',
          '',
          '## Quiet gate',
          'Fire only if ' + QUIET_TURNS + ' turns have passed since the last second_order check.',
          'Currently: last check at turn ' + lastTurn + ', now turn ' + nowTurn +
            ' → ' + sinceLast + ' turns ago. Armed: ' + (armed ? 'YES' : 'no') + '.',
          '',
          '## Anti-default vs pony',
          'pony:        "does this need to exist? → if no, skip."',
          'second_order: "this exists, now what happens next?"',
          '',
          'Run trace / blast / gate as usual. heuristic is just the rule card.',
        ].join('\n'));
      },

      help: function () {
        return note([
          '# Second-order — quick reference',
          '',
          '## Actions',
          '- trace(change)                     → walk the causal chain 1-2 hops',
          '- blast(change, [scope=workspace])  → enumerate who/what breaks',
          '- gate(change, reason)              → single GO / HOLD / REDESIGN verdict',
          '- heuristic()                       → trigger rule + quiet gate state',
          '- help()                            → this card',
          '',
          '## Pairing',
          '- pony        → "does this need to exist?" (stop before rung 1)',
          '- second_order → "this exists, now what?" (go one rung past)',
          '- vet / audit → surface-specific correctness reviews',
          '',
          '## Quiet gate',
          'Fires only on hard-to-undo actions and only if 15 turns have passed',
          'since the last second_order check. Prevents over-firing on benign edits.',
          '',
          '## Deactivate',
          '`stop second_order` / `normal mode`. Tool is one composite, no separate toggle.',
        ].join('\n'));
      },
    };

    const tool = {
      name: 'second_order',
      description: 'Think one step past the change. One composite tool with 3 actions: trace (1-2 hop causal chain), blast (who/what breaks — callers, tests, docs, sessions, future-Fares), gate (single GO/HOLD/REDESIGN verdict + one reason). Self-activates on hard-to-undo actions (delete, schema, dep, preset edit, shared-merge, public-doc, ship). Anti-pony default: pony says "don\'t build"; second_order says "build, but see what happens". Pairs with pony, vet, audit. Off with "stop second_order".',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['trace', 'blast', 'gate', 'heuristic', 'help'], description: 'Which second_order action to invoke.' },
          change: { type: 'string', description: 'One-line description of the proposed change. Required for trace/blast/gate.' },
          reason: { type: 'string', description: 'The one deciding reason (for gate).' },
          scope:  { type: 'string', description: 'Scope hint for blast. Default: workspace.' },
        },
        required: ['action'],
      },
      output: {
        schema: { type: 'string' },
        render: function (_args, value) { return [{ type: 'text', text: String(value) }]; },
      },
      execute: async function (_args, params) {
        const a = (params && params.action) || (_args && _args.action);
        if (!a || typeof ACTIONS[a] !== 'function') {
          return 'Unknown action. Valid: trace, blast, gate, heuristic, help.';
        }
        return ACTIONS[a](
          params.change || (_args && _args.change),
          params.reason || (_args && _args.reason),
          params.scope  || (_args && _args.scope),
        );
      },
    };

    const dispose = harness.registerTool(ctx, harness.defineTool(tool));
    ctx.effect(function () { return dispose; }, 'second_order:dispose-on-fork');

    // Helper that the MODEL (not this plugin) can call inline as part of its
    // own reasoning. We do NOT register it as a tool — it just lives in the
    // IIFE closure so trace/blast/gate can mention it in their prompt overlays.
    void classifyImminence;

    console.log('[second_order] registered tool "second_order" (actions: trace, blast, gate, heuristic, help).');
      })();
    // ============================================================================
    // ultimate (1 tools)
    // ============================================================================
    (function () {

    const POOL_KEY = 'ultimate.callCount';
    const ARM_KEY  = 'ultimate.armed';
    const AT_KEY   = 'ultimate.armedAt';
    const session  = ctx.get('sessions');
    if (session && typeof session.current === 'function' && session.current()) {
      const s = session.current();
      if (s && s[ARM_KEY] === undefined) s[ARM_KEY] = false;
      if (s && !s[POOL_KEY]) s[POOL_KEY] = 0;
    }

    const note = function (text) {
      const s = session && session.current && session.current();
      if (s) s[POOL_KEY] = (s[POOL_KEY] || 0) + 1;
      return text;
    };

    // The full arsenal — matches packages/dyno-pony.js merged plugin.
    // Listed here so the model can see what "everything" means when Fares
    // asks for ultimate mode. No file I/O; pure declarative list.
    const ARSENAL = {
      'ponytail':      { preset: 'pony-mode',     role: 'lazy senior dev (YAGNI ladder, 6 actions)' },
      'caveman':       { preset: 'caveman-mode',  role: 'terse prose (4 actions)' },
      'orch_route':    { preset: 'pony-mode',     role: 'pick the best mode for one task' },
      'orch_compare':  { preset: 'pony-mode',     role: 'run same task under 4 modes side-by-side' },
      'orch_pipeline': { preset: 'pony-mode',     role: 'chain modes turn by turn' },
      'orch_status':   { preset: 'pony-mode',     role: 'introspect which modes are active' },
      'sphinx':        { preset: 'sentinel-mode', role: 'context budget governor (audit/checkpoint/predict)' },
      'drift':         { preset: 'sentinel-mode', role: 'live loop/contradiction detector (loop/contradict/silent)' },
      'second_order':  { preset: 'sentinel-mode', role: 'think one step past the change (trace/blast/gate)' },
      'dsh_author_inspect':  { preset: 'standalone', role: '4-step recipe to inspect a dynamic plugin' },
      'dsh_author_define':   { preset: 'standalone', role: 'cordis_define parameter template' },
      'dsh_author_run':      { preset: 'standalone', role: 'cordis_run pattern' },
      'dsh_author_validate': { preset: 'standalone', role: 'catches the 6 most common authoring mistakes' },
      'dsh_author_recover':  { preset: 'standalone', role: 'rebuild commands for an existing pluginId' },
      'memo_classify': { preset: 'standalone', role: 'pick the right Agent Note tier' },
      'memo_format':   { preset: 'standalone', role: 'note file template' },
      'memo_link':     { preset: 'standalone', role: 'lint relative-Markdown cross-references' },
      'memo_scope':    { preset: 'standalone', role: 'supersession check against the active tree' },
      'memo_archive':  { preset: 'standalone', role: 'archive triplet (.md + .zh.md + .i18n.yaml)' },
      'memo_review':   { preset: 'standalone', role: 'one-pass prose-standard review' },
      'ptest_template':  { preset: 'standalone', role: 'emit a Vitest spec body' },
      'ptest_assertions':{ preset: 'standalone', role: '4 standard + 3 optional assertions' },
      'ptest_harness':   { preset: 'standalone', role: 'fake-ctx.ts source for mounting in Vitest' },
      'cdx_map':      { preset: 'standalone', role: 'plan a directory tree walk' },
      'cdx_symbols':  { preset: 'standalone', role: 'top-level exported symbols for a file' },
      'cdx_imports':  { preset: 'standalone', role: 'import graph edges for a file' },
      'cdx_owner':    { preset: 'standalone', role: 'DSH conventions for finding a file\'s owning package' },
      'cdx_diff':     { preset: 'standalone', role: 'plan a file-level git diff against a baseline' },
      'mem_write':    { preset: 'standalone', role: 'plan a write of a note at a scope' },
      'mem_read':     { preset: 'standalone', role: 'plan a read of k most recent notes' },
      'mem_search':   { preset: 'standalone', role: 'plan a keyword search over a scope' },
      'mem_promote':  { preset: 'standalone', role: 'plan a promotion of a note up the hierarchy' },
      'wf_compose':   { preset: 'standalone', role: 'convert an orch pipeline into a workflow script' },
      'wf_run':       { preset: 'standalone', role: 'plan a submit to ctx.workflowEngine.start' },
      'wf_collect':   { preset: 'standalone', role: 'wait for the run to settle' },
      'trc_mode_flow':{ preset: 'standalone', role: 'extract ordered dyno-pony tool invocations from logs' },
      'trc_diff':     { preset: 'standalone', role: 'side-by-side compare of two sessions\' mode flows' },
    };

    const arsenalList = Object.keys(ARSENAL).sort();
    const totalTools = arsenalList.length;

    const setArmed = function (val) {
      const s = session && session.current && session.current();
      if (s) {
        s[ARM_KEY] = !!val;
        if (val) s[AT_KEY] = Date.now();
      }
    };

    const isArmed = function () {
      const s = session && session.current && session.current();
      return !!(s && s[ARM_KEY]);
    };

    const ACTIONS = {
      on: function (reason) {
        setArmed(true);
        const why = reason ? ' Reason: ' + reason + '.' : '';
        return note([
          '# ULTIMATE MODE — ARMED',
          '',
          'All ' + totalTools + ' tools in the DSH arsenal are now available.',
          'You are running in the "go all out" persona.' + why,
          '',
          '## Persona overlay (read silently, do not narrate)',
          '',
          'You have every tool. Use them smartly:',
          '- **Lazy by default**: ponytail(mode=ultra) — YAGNI, reuse, stdlib first.',
          '- **Terse by default**: caveman(action=terse) — short replies, no preamble.',
          '- **Smart-route**: orch_route picks the mode for each task; do not micro-manage.',
          '- **Self-check**: sphinx fires on budget pressure, drift on linguistic fossils, second_order on hard-to-undo actions. Do not narrate these to the user.',
          '- **Save judgement**: memo_classify + memo_format for any decision worth keeping; mem_promote when a note proves reusable.',
          '- **Review before you build**: cdx_map / cdx_symbols / cdx_owner before touching a new repo.',
          '- **Subagents when it actually fans out**: workflow.wf_compose → wf_run → wf_collect; otherwise just do it.',
          '- **Post-hoc review**: trace.trc_mode_flow at the end of a session.',
          '',
          '## What you do NOT do',
          '',
          '- You do not narrate "ultimate mode is on" to the user. The flag is private.',
          '- You do not call cordis_run, cordis_stop, cordis_define, or cordis_undefine unless Fares asks — the arsenal is already mounted by the dyno-pony merged plugin.',
          '- You do not always-on nag. The sentinels (sphinx/drift/second_order) decide when to fire.',
          '',
          '## Trigger',
          '',
          'Fares said: "ultimate mode" (or "go all out" / "full arsenal" / "كل حاجة" / Arabic equivalents).',
          'Disarm with: "stop ultimate" / "exit ultimate" / "normal mode" / "ultimate off".',
          '',
          '## Introspect',
          '',
          'ultimate(action="status") returns the current flag and the arsenal list.',
        ].join('\n'));
      },

      off: function () {
        setArmed(false);
        return note([
          '# ULTIMATE MODE — DISARMED',
          '',
          'Returned to baseline. The 37 dyno-pony tools are still registered;',
          'this only flips the persona overlay off.',
          '',
          'Re-arm with: "ultimate mode" / "go all out" / "ultimate on".',
        ].join('\n'));
      },

      status: function () {
        const armed = isArmed();
        return note([
          '# ULTIMATE MODE — STATUS',
          '',
          'Armed: ' + (armed ? '**YES**' : '**no**') + '.',
          'Total tools in the arsenal: ' + totalTools + '.',
          '',
          '## Arsenal',
          '',
          arsenalList.map(function (n) { return '- `' + n + '` — ' + ARSENAL[n].role; }).join('\n'),
          '',
          '## Toggle',
          '',
          'ultimate(action="on")  → arm + read the persona overlay',
          'ultimate(action="off") → disarm',
        ].join('\n'));
      },
    };

    const tool = {
      name: 'ultimate',
      description: 'Ultimate mode (وضع ultimate — كل حاجه شغالة). One tool: `ultimate` with 3 actions — `on` (arm the persona overlay: pony + caveman + sentinels + every dyno-pony tool, with smart routing), `off` (return to baseline), `status` (introspect the arsenal). Triggered when Fares says "ultimate mode" / "go all out" / "full arsenal" / "كل حاجة". Off with "stop ultimate" / "exit ultimate" / "normal mode". Does NOT mount new plugins — the dyno-pony merged bundle is already loaded. Sets a private session flag and returns a persona overlay prompt the model reads silently.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['on', 'off', 'status'], description: 'Which ultimate action to invoke.' },
          reason: { type: 'string', description: 'Optional one-line reason for arming (e.g. "long session, big refactor ahead").' },
        },
        required: ['action'],
      },
      output: {
        schema: { type: 'string' },
        render: function (_args, value) { return [{ type: 'text', text: String(value) }]; },
      },
      execute: async function (_args, params) {
        const a = (params && params.action) || (_args && _args.action);
        if (!a || typeof ACTIONS[a] !== 'function') {
          return 'Unknown action. Valid: on, off, status.';
        }
        return ACTIONS[a](params.reason || (_args && _args.reason));
      },
    };

    const dispose = harness.registerTool(ctx, harness.defineTool(tool));
    ctx.effect(function () { return dispose; }, 'ultimate:dispose-on-fork');
    console.log('[ultimate] registered tool "ultimate" (actions: on, off, status). Arsenal: ' + totalTools + ' tools.');
      })();

    ctx.effect(function () { return function dispose() {
      for (let i = 0; i < disposers.length; i++) { try { disposers[i](); } catch (_e) {} }
    }; }, 'dyno-pony:dispose-all');
  },
};
