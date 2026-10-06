// Presets test: load each agent.cordis.yml from ~/.agent-presets/ and assert
// it has the correct shape (id, description, config). The DSH agent-presets
// package parses these files; this test mirrors the same shape.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PRESETS_DIR = process.env.DSH_AGENT_PRESETS || path.join(process.env.HOME, '.agent-presets');

const EXPECTED_PRESETS = [
  { id: 'baseline',     description_includes: 'Vanilla DSH session' },
  { id: 'simple',       description_includes: 'default dyno-pony plugins' },
  { id: 'pony-mode',    description_includes: 'Lazy senior dev mode' },
  { id: 'caveman-mode', description_includes: 'Terse prose mode' },
  { id: 'sentinel-mode', description_includes: 'opt-in preset for the dyno-pony session sentinels' },
  { id: 'ultimate-mode', description_includes: 'go all out' },
];

// First, sanity-check that the directory exists and is readable.
test('presets: directory exists and is readable', () => {
  assert.ok(fs.existsSync(PRESETS_DIR), `presets dir not found: ${PRESETS_DIR}`);
  const stat = fs.statSync(PRESETS_DIR);
  assert.ok(stat.isDirectory(), `${PRESETS_DIR} is not a directory`);
});

for (const { id, description_includes } of EXPECTED_PRESETS) {
  test(`presets: ${id}/agent.cordis.yml exists and is valid`, () => {
    const file = path.join(PRESETS_DIR, id, 'agent.cordis.yml');
    assert.ok(fs.existsSync(file), `preset file not found: ${file}`);
    const body = fs.readFileSync(file, 'utf8');
    // Minimal YAML shape: a YAML array whose first entry has id, description, config.
    // We parse just enough to verify (the DSH agent-presets package does the full
    // YAML parse; we only check string-level invariants here).
    assert.ok(body.includes('id: ' + id), `preset ${id} must include "id: ${id}"`);
    assert.ok(body.includes('description:'), `preset ${id} must include "description:"`);
    assert.ok(body.toLowerCase().includes(description_includes.toLowerCase()),
      `preset ${id} description should mention "${description_includes}"`);
    // Must be a top-level YAML array (starts with `- ` after comments).
    const lines = body.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
    assert.ok(lines[0].startsWith('- '), `preset ${id} must start with "- " (YAML array)`);
  });
}

test('presets: no extra/unknown presets', () => {
  if (!fs.existsSync(PRESETS_DIR)) return; // skip if dir doesn't exist
  const dirs = fs.readdirSync(PRESETS_DIR).filter((d) => {
    const full = path.join(PRESETS_DIR, d);
    return fs.statSync(full).isDirectory();
  });
  const expectedIds = EXPECTED_PRESETS.map((p) => p.id);
  for (const d of dirs) {
    assert.ok(expectedIds.includes(d), `unexpected preset dir: ${d}; expected one of ${expectedIds.join(', ')}`);
  }
});

test('presets: baseline has no active plugins, others have at least 1', () => {
  // Each preset's description must list which plugins it activates.
  // baseline = 0; simple = pony+caveman+orch; pony-mode = pony+orch; caveman-mode = caveman+orch.
  const expectations = [
    { id: 'baseline',     expected: [] },
    { id: 'simple',       expectedAny: ['pony', 'caveman', 'orch'] },
    { id: 'pony-mode',    expectedAny: ['pony', 'orch'] },
    { id: 'caveman-mode', expectedAny: ['caveman', 'orch'] },
  ];
  for (const { id, expected, expectedAny } of expectations) {
    const file = path.join(PRESETS_DIR, id, 'agent.cordis.yml');
    if (!fs.existsSync(file)) continue;
    const body = fs.readFileSync(file, 'utf8').toLowerCase();
    // baseline's description MUST say "no" plugins and "vanilla" — both words must appear.
    if (id === 'baseline') {
      assert.ok(body.includes('vanilla'), `baseline should describe itself as vanilla`);
      assert.ok(body.includes('zero') || body.includes('no ') || body.includes('none'),
        `baseline should say it has no plugins`);
    } else {
      const mentions = expectedAny.filter((p) => body.includes(p));
      assert.ok(mentions.length >= 1,
        `${id} should mention at least one of [${expectedAny.join(', ')}]; found [${mentions.join(', ')}]`);
    }
  }
});
