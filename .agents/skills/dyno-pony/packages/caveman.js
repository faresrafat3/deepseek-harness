// Source-of-truth for the caveman dynamic plugin (v3).
// Re-apply with: cordis_define plugin kind=existing pluginId=cavm-2 ...

return {
  apply(ctx) {
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
  },
};
