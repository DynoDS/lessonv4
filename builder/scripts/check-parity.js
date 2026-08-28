#!/usr/bin/env node
'use strict';

// Cross-engine visual-parity guard.
//
// A visual primitive (an angle, a Venn, a bar model, a labelled diagram) can be
// drawn by up to four code renderers — the slide builder, the worksheet builder,
// the working wall, and the stick-in pack.
// The recurring failure (see MEMORY: "helper-builder skips the working wall") is
// that a new figure gets wired into the board and the worksheet but quietly skips
// the wall: nothing errors, the lesson just ships words where the picture should
// be, and the gap only shows weeks later when a teacher looks at the display.
//
// Parity has been enforced by agent discipline alone, so it keeps slipping. This
// guard makes it structural. The single source of truth is the manifest at
// shared/visual-parity.js: it names every shared visual primitive and, per engine,
// the exact key that renderer dispatches on — or `false` with a reason when the
// primitive genuinely does not belong in that engine. The guard then reads the
// four LIVE code registries (never a re-typed copy) and checks two directions:
//
//   FORWARD  — every key the manifest says is wired is actually in that engine's
//              live registry. This catches the silent skip: the manifest declares
//              "bar-model reaches the wall", the wiring was forgotten, the guard
//              fails here instead of the lesson failing in a classroom.
//
//   COVERAGE — every visual key that IS live in the wall and stick-in registries
//              (and every non-layout slide key) appears in the manifest. This stops
//              the manifest silently falling behind: a new figure cannot exist in a
//              renderer without being declared, and declaring it forces the scoping
//              decision (which OTHER engines must it reach?) that prevents the skip.
//
// The stick-in-sheets-designer's supported-visuals list (references/
// stick-in-sheets-pedagogy.md) has no code registry, so the guard cannot prove a
// stick-in key is also listed there; wiring the two together is helper-authoring's
// checklist. The four code engines are where the teeth are.
//
// Run:  node builder/scripts/check-parity.js          (exit 1 lists any gaps)
//       node builder/scripts/check-parity.js --dump    (print each engine's live keys)

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..'); // lesson-resources/

// ── Live registries — read straight from the code each engine runs ──────────

function slideKeys() {
  const { ZONE_COMPAT } = require('../src/content/index');
  return Object.keys(ZONE_COMPAT);
}

function wallKeys() {
  const { VISUAL_KEY_FNS } = require(path.join(ROOT, 'working-wall-html', 'src', 'visuals'));
  return Object.keys(VISUAL_KEY_FNS);
}

function stickinKeys() {
  const registryPath = path.join(ROOT, 'stick-in-sheets-html', 'src', 'visual-registry');
  const { VISUALS, ROW_VISUALS } = require(registryPath);
  const keys = new Set([...Object.keys(VISUALS), ...Object.keys(ROW_VISUALS)]);
  // Some stick-in visuals (label-diagram, draw-box-row) dispatch through
  // explicit `item.visual === "<key>"` branches in renderPieceHtml rather than the
  // VISUALS/ROW_VISUALS maps, so read those branches from source too — otherwise
  // a genuinely-wired key would read as absent and a manifest claim for it would
  // be wrongly flagged.
  const rendererPath = path.join(ROOT, 'stick-in-sheets-html', 'src', 'render-piece-html.js');
  const src = fs.readFileSync(rendererPath, 'utf8');
  const re = /item\.visual\s*===\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(src))) keys.add(m[1]);
  return [...keys];
}

// The worksheet helper registry is a plain exported map.
function worksheetKeys() {
  const { helperNames } = require(path.join(ROOT, 'worksheet-html', 'src', 'helpers', 'index'));
  return helperNames();
}

const LIVE = {
  slides: slideKeys(),
  worksheets: worksheetKeys(),
  wall: wallKeys(),
  stickin: stickinKeys(),
};

if (process.argv.includes('--dump')) {
  for (const engine of ['slides', 'worksheets', 'wall', 'stickin']) {
    console.log(`\n=== ${engine} (${LIVE[engine].length}) ===`);
    console.log(LIVE[engine].slice().sort().join('\n'));
  }
  process.exit(0);
}

const { PRIMITIVES, SLIDE_LAYOUT_EXEMPT } = require(path.join(ROOT, 'shared', 'visual-parity'));

// Engines the guard can mechanically check.
const CODE_ENGINES = ['slides', 'worksheets', 'wall', 'stickin'];
// Engines whose registry is PURELY visual, so every live key must be declared.
// (slides and worksheets mix layout/text/question primitives in with the figures,
// so coverage there would be noise; they get forward-checked only, plus the slide
// figure coverage below which uses the explicit layout-exempt set.)
const COVERAGE_ENGINES = ['wall', 'stickin'];

const liveSet = Object.fromEntries(
  CODE_ENGINES.map((e) => [e, new Set(LIVE[e])])
);
const problems = [];

// A manifest engine value is `false` (intentionally absent), one key string, or
// an array of keys (a figure with -question/-row variants, or a slide base plus a
// flag-variant like triangle-nonexample). Normalise to a list of declared keys.
function declaredKeys(value) {
  if (value === false || value == null) return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value) && value.every((v) => typeof v === 'string')) return value;
  return null; // malformed
}

// ── FORWARD: every declared key is actually wired ───────────────────────────
for (const p of PRIMITIVES) {
  for (const engine of CODE_ENGINES) {
    const keys = declaredKeys(p[engine]);
    if (keys === null) {
      problems.push(`manifest "${p.id}": ${engine} must be a key string, an array of key strings, or false (got ${JSON.stringify(p[engine])}).`);
      continue;
    }
    for (const key of keys) {
      if (!liveSet[engine].has(key)) {
        problems.push(
          `"${p.id}" claims ${engine} key "${key}", but no such key is wired into the ${engine} renderer.\n` +
          `      → wire it in (see helper-authoring.md "${engine}" checklist), or set ${engine}: false in the manifest with a reason if it truly does not belong there.`
        );
      }
    }
  }
}

// ── DECLARATION: every primitive must state its worksheet reach explicitly -
// a live worksheet-html key, or false with the reasoning. An entry that never
// mentions it is the silent skip this guard exists to catch.
for (const p of PRIMITIVES) {
  if (p.worksheets === undefined) {
    problems.push(
      `manifest "${p.id}" makes no worksheets decision.\n` +
      `      → declare the live worksheet-html key it prints through, or worksheets: false with the reason.`
    );
  }
}

// ── COVERAGE: every live visual key is declared (purely-visual registries) ──
for (const engine of COVERAGE_ENGINES) {
  const declaredForEngine = new Set(PRIMITIVES.flatMap((p) => declaredKeys(p[engine]) || []));
  for (const key of LIVE[engine]) {
    if (!declaredForEngine.has(key)) {
      problems.push(
        `the ${engine} renderer draws "${key}", but no manifest entry claims it.\n` +
        `      → add "${key}" to its primitive in shared/visual-parity.js (and decide which OTHER engines it should reach).`
      );
    }
  }
}

// ── COVERAGE (slides): every slide FIGURE key is declared. Layout/text keys are
// listed in SLIDE_LAYOUT_EXEMPT, so anything new that isn't a container is forced
// into the manifest, where the cross-engine scoping decision gets made.
{
  const declaredSlides = new Set(PRIMITIVES.flatMap((p) => declaredKeys(p.slides) || []));
  const exempt = new Set(SLIDE_LAYOUT_EXEMPT);
  for (const key of LIVE.slides) {
    if (exempt.has(key) || declaredSlides.has(key)) continue;
    problems.push(
      `the slide renderer draws "${key}", but it is neither in the parity manifest nor in SLIDE_LAYOUT_EXEMPT.\n` +
      `      → if it is a visual figure, add it to shared/visual-parity.js and decide its reach; if it is a pure text/layout primitive, add it to SLIDE_LAYOUT_EXEMPT with the others.`
    );
  }
}

// ── Report ──────────────────────────────────────────────────────────────────
if (problems.length) {
  console.error('Visual-parity gaps — a shared visual is wired into some renderers but not all it should reach:\n');
  problems.forEach((p) => console.error('  - ' + p + '\n'));
  console.error(`${problems.length} gap(s). The manifest is shared/visual-parity.js; the per-engine wiring checklists are in references/helper-authoring.md.`);
  process.exit(1);
}

const declaredCount = PRIMITIVES.length;
console.log(
  `Visual parity OK: ${declaredCount} shared visual primitives declared; ` +
  `every declared key is wired (live worksheet engine included) and every live wall/stick-in/slide figure is declared.`
);
