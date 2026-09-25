'use strict';

// The colours release: every saved deck through the slide check, signals only,
// so the check's decisions before and after the change can be compared deck by
// deck. Run once on the untouched tree and once on the changed one:
//
//   node k11_deck_census.js <label>
//
// The check is loaded from the copy this file sits in; the saved decks are read
// (never written) from the development checkout's working folders, found beside
// the repository git names. Writes census-<label>.json beside this file.

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const HERE = __dirname;
const REPO = path.resolve(HERE, '..', '..', '..');
const PLUGIN = path.join(REPO, 'plugins', 'lesson-v4');
const { runSlideDesignCheck } = require(path.join(PLUGIN, 'builder', 'scripts', 'check-slide-design.js'));

const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], {
  cwd: REPO, encoding: 'utf8'
}).trim();
const SAVED = path.dirname(common);
const ROOTS = ['working', 'lesson-resources-output/working', 'output/working'];

function find(dir, out) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) find(p, out);
    else if (entry.name === 'lesson.json') out.push(p);
  }
  return out;
}

const label = process.argv[2];
if (!label) throw new Error('usage: node k11_deck_census.js <label>');
const out = path.join(HERE, `census-${label}.json`);
console.log(`reading decks from ${SAVED}; checking with ${PLUGIN}; writing ${out}`);

const decks = [];
for (const root of ROOTS) find(path.join(SAVED, root), decks);
decks.sort();

const results = {};
for (const deck of decks) {
  const rel = path.relative(SAVED, deck).split(path.sep).join('/');
  let signals = [];
  let reason = null;
  try {
    const result = runSlideDesignCheck(deck, {});
    reason = result.reason || (result.ok ? 'OK' : 'FAILED');
    signals = [...String(result.stdout || '').matchAll(/"signal":"([A-Z_]+)"[^\n]*?"slide":(\d+)/g)]
      .map((m) => `${m[1]} slide ${m[2]}`);
  } catch (error) {
    reason = `THREW ${String(error.message).slice(0, 120)}`;
  }
  results[rel] = { reason, signals: signals.sort() };
  process.stdout.write('.');
}
fs.writeFileSync(out, JSON.stringify(results, null, 1) + '\n');
console.log(`\n${decks.length} decks`);
