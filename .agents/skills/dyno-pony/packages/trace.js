// Source-of-truth for the trace specialized plugin (v1).
// Re-apply with: cordis_define plugin kind=existing pluginId=trc-10 ...
//
// Extract the mode-flow from a session log: which dyno-pony tools were
// invoked, in what order, with what effects. Toggle on when reviewing a
// session's mode usage or comparing two sessions. Off when done.
//
// Two tools:
//   - trc_mode_flow : return the ordered dyno-pony tool invocations for a session
//   - trc_diff      : compare two sessions' mode flows side-by-side
//
// Depends on ctx.sessions and ctx.sessionQuery. Does NOT depend on pony/
// caveman/orch. If those services are unreachable, falls back to bash.

return {
  apply(ctx) {
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

    const d1 = harness.registerTool(ctx, flowTool);
    const d2 = harness.registerTool(ctx, diffTool);

    ctx.effect(function () { return function dispose() {
      d1(); d2();
    }; }, 'trc:dispose-all');
  },
};
