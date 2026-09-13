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

// ── TRUTH SOURCE: every primitive says where its picture's correctness comes
// from, and there are exactly two honest answers.
//
//   depicts: 'data'          the drawing is right when it matches the lesson's
//                            own numbers, labels or an agreed convention - a bar
//                            chart, a Venn, a circuit symbol.
//   depicts: 'asset:<folder under builder/assets>'
//                            the drawing is right because the shape comes out of
//                            a real file this package ships, with everything the
//                            lesson adds drawn ON TOP of it.
//
// This exists because a helper that DEPICTS a real thing - a coastline, a
// border, a real object - cannot be right by construction the way a bar chart
// can. A drawn-by-eye continent renders cleanly, passes every other check, and
// teaches a child the wrong world.
//
// `projection:<name>` used to be a third answer and has been withdrawn, because
// it never answered the question. A projection says how coordinates are
// TRANSFORMED; it says nothing about where they came from. So a schematic world
// map whose continent outlines were typed out to look about right declared
// `projection:equirectangular-lonlat` - a genuinely real projection, over
// invented coordinates - and passed this guard for as long as it existed. It
// then drew the opening eight slides of a Year 4 lesson about where the Amazon
// actually is. Narrowing the accepted projection names could not have caught it:
// the name was already correct. Only the source can be checked, and a file on
// disk is the only source that can be.
//
// Real coordinates still reach the page - the globe-to-flat presentation
// reprojects the shipped equirectangular world into an orthographic globe - but
// what it projects is the ASSET, so it declares asset:maps like everything else.

{
  const ASSET_ROOT = path.join(ROOT, 'builder', 'assets');
  for (const p of PRIMITIVES) {
    const depicts = p.depicts;
    if (typeof depicts !== 'string' || !depicts) {
      problems.push(
        `manifest "${p.id}" does not say what its picture is drawn from.
` +
        `      → add depicts: 'data' when the drawing is right by matching the lesson's own data or an agreed convention, ` +
        `or depicts: 'asset:<folder>' when it depicts a real place or object.`
      );
      continue;
    }
    if (depicts === 'data') continue;
    if (depicts.startsWith('asset:')) {
      const folder = depicts.slice('asset:'.length);
      if (!folder || !fs.existsSync(path.join(ASSET_ROOT, folder))) {
        problems.push(
          `manifest "${p.id}" says it is drawn from asset folder "${folder}", but builder/assets/${folder} does not exist.`
        );
      }
      continue;
    }
    if (depicts.startsWith('projection:')) {
      problems.push(
        `manifest "${p.id}" claims ${JSON.stringify(depicts)}, and a projection is no longer a source here.
` +
        `      → a projection describes a transform, not where the coordinates came from, so a real projection over ` +
        `made-up coordinates passed this guard and drew a hand-typed world map. Build the figure on a shipped asset ` +
        `and declare depicts: 'asset:<folder under builder/assets>', or declare depicts: 'data' and stop presenting ` +
        `it as a real place.`
      );
      continue;
    }
    problems.push(
      `manifest "${p.id}" has depicts: ${JSON.stringify(depicts)}, which names no real source.
` +
      `      → use 'data' or 'asset:<folder under builder/assets>'.`
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

// ── ONE DRAWING PER PICTURE, ON EVERY SURFACE ───────────────────────────────
// The checks above ask whether a surface CAN draw a picture. This one asks
// whether it draws the SAME picture: the number line was drawn four ways, and a
// wall card printed a line that looked nothing like the board's (13 September
// 2026). The backlog in shared/visual-parity.js is the list of what is not
// shared yet; the code must match it exactly, so it can only shrink.
{
  const { sharingStatus, backlogFrom } = require('./sharing-status');
  const { SHARING_BACKLOG, WORKSHEET_LAYOUT_EXEMPT, PICTURES } = require(path.join(ROOT, 'shared', 'visual-parity'));
  const actual = backlogFrom(sharingStatus());
  const recorded = SHARING_BACKLOG || {};
  const ids = new Set([...Object.keys(actual), ...Object.keys(recorded)]);
  for (const id of ids) {
    const a = actual[id] || {};
    const r = recorded[id] || {};
    for (const surface of new Set([...Object.keys(a), ...Object.keys(r)])) {
      if (a[surface] === r[surface]) continue;
      if (!a[surface]) {
        problems.push(
          `"${id}" is now drawn from its shared drawing on ${surface}, but the backlog still lists it as '${r[surface]}'.
` +
          `      → take ${surface} off "${id}" in SHARING_BACKLOG (shared/visual-parity.js). The list only shrinks.`
        );
      } else if (!r[surface]) {
        problems.push(
          `"${id}" on ${surface} is '${a[surface]}', and the backlog does not allow that.
` +
          `      → a picture is drawn once, in its shared/visuals module (geometrySource), and every surface draws it from there. ` +
          `Draw ${surface} from the shared module rather than adding code of its own, or wire the surface up if it is missing. ` +
          `Nothing new goes on the backlog.`
        );
      } else {
        problems.push(
          `"${id}" on ${surface} is '${a[surface]}' but the backlog says '${r[surface]}'.
` +
          `      → change the backlog only when the surface moved closer to shared (own → missing is not progress).`
        );
      }
    }
  }

  // Every drawing a sheet can print is a picture with a place on every surface,
  // or the sheet's own typed layout. A new worksheet drawing cannot slip in
  // beside the shared set.
  const pictureWorksheetKeys = new Set(PICTURES.flatMap((p) => declaredKeys(p.worksheets) || []));
  const typed = new Set(WORKSHEET_LAYOUT_EXEMPT);
  for (const key of LIVE.worksheets) {
    if (pictureWorksheetKeys.has(key) || typed.has(key)) continue;
    problems.push(
      `the worksheet engine draws "${key}", but it is neither a picture in shared/visual-parity.js nor in WORKSHEET_LAYOUT_EXEMPT.
` +
      `      → if it draws a picture, give it one shared drawing and a place on every surface; if it is typed layout (words, writing space, a table), list it as exempt.`
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
