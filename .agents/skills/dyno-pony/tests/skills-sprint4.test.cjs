#!/usr/bin/env node
// verify-skills.js — sanity-check the 17 sprint-4 skills.

'use strict';
const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '..', 'skills');
const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
const skills = entries.filter(e => e.isDirectory()).map(e => e.name).sort();

let pass = 0, fail = 0;
const names = new Set();
const issues = [];

for (const dir of skills) {
  const p = path.join(SKILLS_DIR, dir, 'SKILL.md');
  if (!fs.existsSync(p)) {
    issues.push({ dir, kind: 'missing' });
    fail++;
    continue;
  }
  const body = fs.readFileSync(p, 'utf8');
  const lines = body.split('\n');

  if (lines[0] !== '---') {
    issues.push({ dir, kind: 'no-frontmatter' });
    fail++;
    continue;
  }
  let end = lines.indexOf('---', 1);
  if (end === -1) {
    issues.push({ dir, kind: 'unterminated-frontmatter' });
    fail++;
    continue;
  }

  // Parse frontmatter with multi-line support.
  // metadata: is a block; collect until we hit a non-indented top-level key.
  const fm = {};
  let i = 1;
  while (i < end) {
    const line = lines[i];
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) {
      fm[m[1]] = m[2].trim();
      i++;
    } else {
      // indented continuation: append to last key
      const last = Object.keys(fm).pop();
      if (last && line.startsWith(' ') && line.trim()) {
        fm[last] += ' ' + line.trim();
      }
      i++;
    }
  }

  const required = ['name', 'description', 'whenToUse'];
  const missing = required.filter(k => !fm[k]);
  if (missing.length) {
    issues.push({ dir, kind: 'missing-fm-key', keys: missing });
    fail++;
    continue;
  }

  if (!fm.metadata) {
    issues.push({ dir, kind: 'missing-metadata' });
    fail++;
    continue;
  }

  if (fm.name !== dir) {
    issues.push({ dir, kind: 'name-mismatch', name: fm.name, dir });
    fail++;
    continue;
  }

  if (names.has(fm.name)) {
    issues.push({ dir, kind: 'duplicate-name', name: fm.name });
    fail++;
    continue;
  }
  names.add(fm.name);

  if (lines.length < 30 || lines.length > 280) {
    issues.push({ dir, kind: 'body-length', lines: lines.length });
    fail++;
    continue;
  }

  pass++;
  console.log('  ✓ ' + fm.name + ' (' + lines.length + ' lines)');
}

console.log('');
console.log('pass: ' + pass + ' / ' + skills.length);
console.log('fail: ' + fail);
if (issues.length) {
  console.log('--- issues ---');
  for (const i of issues) console.log('  ' + i.kind + ' in ' + i.dir + (i.keys ? ' [' + i.keys.join(',') + ']' : ''));
  process.exit(1);
}
