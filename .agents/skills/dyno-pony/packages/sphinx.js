// Source-of-truth for the sphinx dynamic plugin (v1).
// Re-apply with: cordis_define plugin kind=existing pluginId=sphx-1 ...
//
// Context budget governor. Single composite tool: audit, checkpoint, predict.
// Auto-activates on a narrow heuristic — never always-on, never on a fixed
// keyword. Composes with ponytail (lazy rebuild) and caveman (terse mode).

return {
  apply(ctx) {
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
  },
};
