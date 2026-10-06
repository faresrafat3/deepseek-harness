// Source-of-truth for the memo specialized plugin (v1).
// Re-apply with: cordis_define plugin kind=existing pluginId=memo-5 ...
//
// Specialized plugin for writing Agent Notes that follow DSH AGENTS.md rules.
// Toggle on when authoring notes, off when done.
//
// Six tools:
//   - memo_classify : pick the right note tier (implemented / proposed / archived / rejected).
//   - memo_format   : returns the file format template.
//   - memo_link     : lint dead links and fragment anchors.
//   - memo_scope    : cross-check supersession against existing notes.
//   - memo_archive  : archive triplet (en + zh + i18n) for a frozen note.
//   - memo_review   : one-pass review of a draft note.

return {
  apply(ctx) {
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
  },
};
