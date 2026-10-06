// Source-of-truth for the codex specialized plugin (v1).
// Re-apply with: cordis_define plugin kind=existing pluginId=cdx-7 ...
//
// Read-only codebase archaeology. Toggle on when the model needs a map of
// the repo before reviewing / simplifying / navigating. Off when done.
//
// Five tools:
//   - cdx_map      : directory tree with file counts + language markers
//   - cdx_symbols  : top-level exported symbols for a file
//   - cdx_imports  : import graph edges for a file
//   - cdx_owner    : owning package + closest subsystem page + Agent Note
//   - cdx_diff     : file-level diff against a git ref (read-only)
//
// Depends on ctx.fs (read-only); does not depend on pony/caveman/orch.

return {
  apply(ctx) {
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
    const d1 = harness.registerTool(ctx, mapTool);
    const d2 = harness.registerTool(ctx, symbolsTool);
    const d3 = harness.registerTool(ctx, importsTool);
    const d4 = harness.registerTool(ctx, ownerTool);
    const d5 = harness.registerTool(ctx, diffTool);

    ctx.effect(function () { return function dispose() {
      d1(); d2(); d3(); d4(); d5();
    }; }, 'cdx:dispose-all');
  },
};
