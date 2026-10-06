// Source-of-truth for the ponytail dynamic plugin (v2).
// Re-apply with: cordis_define plugin kind=existing pluginId=pony-1 ...

return {
  apply(ctx) {
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
  },
};
