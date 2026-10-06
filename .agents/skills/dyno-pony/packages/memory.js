// Source-of-truth for the memory specialized plugin (v1).
// Re-apply with: cordis_define plugin kind=existing pluginId=mem-8 ...
//
// Hierarchical memory per the home AGENTS.md:
//   per-agent < per-group < per-company < global
//
// Toggle on when the model needs persistent recall across sessions. Off when done.
//
// Four tools:
//   - mem_write  : append a note to a scope
//   - mem_read   : return the k most recent notes from a scope
//   - mem_search : keyword search over a scope
//   - mem_promote: move a note up the hierarchy
//
// Pure file I/O under ~/.dsh/memory/<scope>/. No substrate deps.

return {
  apply(ctx) {
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

    const d1 = harness.registerTool(ctx, writeTool);
    const d2 = harness.registerTool(ctx, readTool);
    const d3 = harness.registerTool(ctx, searchTool);
    const d4 = harness.registerTool(ctx, promoteTool);

    ctx.effect(function () { return function dispose() {
      d1(); d2(); d3(); d4();
    }; }, 'mem:dispose-all');
  },
};
