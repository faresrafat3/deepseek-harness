// Source-of-truth for the drift dynamic plugin (v1).
// Re-apply with: cordis_define plugin kind=existing pluginId=dft-1 ...
//
// Live transcript loop / contradiction detector. Watch for the linguistic
// fossils of context loss ("as I mentioned", "earlier we…", "as before")
// and for the turn-count cadence (every ~5 turns after turn 8). When the
// heuristic trips, the model may call `drift` to self-check.
// Pairs with: trace (POST-HOC, logs), codex (repo-archaeology).
// Drift is LIVE: it sees the current turn's transcript, not saved logs.

return {
  apply(ctx) {
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
  },
};
