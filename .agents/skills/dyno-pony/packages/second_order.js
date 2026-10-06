// Source-of-truth for the second_order dynamic plugin (v1).
//
// Think one step past the change. Self-activates on hard-to-undo actions.
// Pairs with pony (anti-default: pony says "don't build", second_order
// says "build, but see what happens").
//
// Re-apply with: cordis_define plugin kind=existing pluginId=so-1 ...

return {
  apply(ctx) {
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
  },
};
