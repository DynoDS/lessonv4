#!/usr/bin/env node
'use strict';

// Guard against "built but invisible" helpers.
//
// A designer only emits a primitive it can read about in the catalogue it reads, so
// a primitive wired into a builder but missing from that catalogue is silently never
// used — exactly how the finished bar-chart helper sat unreachable while statistics
// lessons fell back to a plain photo. The code registry and the catalogue are two
// hand-kept lists that always drift; this check guards the duplication so the gap
// surfaces here, at a one-line cost, instead of in a lesson.
//
// Two engines are checked, each against the catalogue its designer actually reads:
//   slides — builder ZONE_COMPAT  vs  references/templates.md (the §4 catalogue)
//   wall   — builder VISUAL_KEY_FNS  vs  references/working-wall-card-contracts.md
//            (the one owner of the wall's primitive specs, which working-wall-packet.py
//            cuts into the designer's reference packet). This is the systematic version of the by-hand reconciliation
//            done when the wall lists last drifted from the builder.
//
// Run: node builder/scripts/check-catalogue.js   (exit 1 lists any gaps)

const fs = require('fs');
const path = require('path');
const { ZONE_COMPAT } = require('../src/content/index');
const { VISUAL_KEY_FNS } = require('../../working-wall-html/src/visuals');

const ref = (...p) => path.join(__dirname, '..', '..', ...p);
const documentedIn = (md, key) => md.includes('`' + key + '`');
const problems = [];

// ── Slides: every content type is in templates.md ───────────────────────────
{
  const md = fs.readFileSync(ref('references', 'templates.md'), 'utf8');
  // Helpers a designer never names directly, so they need no catalogue entry. Keep
  // this list short and each entry justified, so it stays a real exemption and not a
  // way to hide a genuine gap.
  const EXEMPT = new Set([
    'triangle-nonexample', // a flag-selected variant of `triangle`, not named on its own
  ]);
  const keys = Object.keys(ZONE_COMPAT);
  const missing = keys.filter((k) => !EXEMPT.has(k) && !documentedIn(md, k));
  if (missing.length) {
    problems.push(
      'Slide catalogue gap — these built helpers are not in references/templates.md, so the slide-designer cannot reach for them:\n' +
      missing.map((k) => '    - ' + k).join('\n') +
      '\n  Fix: add each to templates.md (the §1.2 index line and a §4 entry), or add to the slide EXEMPT with a one-line reason.'
    );
  } else {
    console.log(`Slide catalogue OK: every built helper (${keys.length - EXEMPT.size} of ${keys.length}, ${EXEMPT.size} exempt) is documented in templates.md.`);
  }
}

// ── Wall: every VISUAL_KEY_FNS primitive is in the wall-designer's catalogue ─
{
  const md = fs.readFileSync(ref('references', 'working-wall-card-contracts.md'), 'utf8');
  const keys = Object.keys(VISUAL_KEY_FNS);
  const missing = keys.filter((k) => !documentedIn(md, k));
  if (missing.length) {
    problems.push(
      'Wall catalogue gap — these built wall primitives are not in references/working-wall-card-contracts.md, so the wall-designer believes it cannot draw them and ships words instead:\n' +
      missing.map((k) => '    - ' + k).join('\n') +
      '\n  Fix: add a `### <primitive>` section for each under "Visual primitives" in references/working-wall-card-contracts.md.'
    );
  } else {
    console.log(`Wall catalogue OK: every built wall primitive (${keys.length}) is documented in working-wall-card-contracts.md.`);
  }
}

if (problems.length) {
  problems.forEach((p) => console.error('\n' + p));
  process.exit(1);
}
