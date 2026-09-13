'use strict';

// A five-row place value chart was put in a zone a third of its height. The
// chart's scale stops at 0.65 so digits stay readable, the centring then
// pushed its tables above the zone to a negative y, and the PPTX writer
// serialised that as an astronomically invalid coordinate: PowerPoint offered
// to "repair" the deck, and the run had already reported the build a success.
//
// Two defences, tested here at their own layers (the chart itself is the shared
// drawing since 13 September 2026, placed on the slide as one picture):
//
//   1. the chart REFUSES a zone it cannot fit, by name, with the height it
//      needs - so the slide-design check fails while the spec is repairable;
//   2. verify-geometry reads the WRITTEN package and refuses any coordinate
//      that can only be corrupt arithmetic - the backstop for every other
//      helper, present and future.

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');

const { describeLayout } = require('../../shared/visuals/place-value-chart-svg');
const { profileFor } = require('../../shared/visuals/surface-profiles');
const { placedRectFor } = require('../src/content/shared-figure');
const { verifyGeometry, LIMIT_EMU } = require('../src/verify-geometry');

const measurePlaceValueChart = placedRectFor('place-value-chart');
const boardLayout = (zone, data) =>
  describeLayout(data, profileFor('slides', { widthPt: (zone.w - 0.2) * 72, heightPt: (zone.h - 0.2) * 72 }));

const FIVE_ROWS_WITH_COUNTERS = {
  columns: ['Th', 'H', 'T', 'O'],
  rows: [
    { label: '643', cells: ['0', '6', '4', '3'], counters: { Th: 0, H: 6, T: 4, O: 3 } },
    { label: '10 more', cells: ['', '', '', ''] },
    { label: '10 less', cells: ['', '', '', ''] },
    { label: '100 more', cells: ['', '', '', ''] },
    { label: '100 less', cells: ['', '', '', ''] },
  ],
};

test('a chart refuses a zone shorter than its smallest readable height', () => {
  assert.throws(
    () => boardLayout({ x: 0.5, y: 0.9, w: 6.0, h: 2.3 }, FIVE_ROWS_WITH_COUNTERS),
    /PLACE_VALUE_CHART_DOES_NOT_FIT:.*needs at least .*in of height/,
    'a chart that cannot fit must refuse by name, not overflow to a negative position'
  );
});

test('the same chart draws without complaint in a zone tall enough for it', () => {
  boardLayout({ x: 0.5, y: 0.6, w: 6.0, h: 6.5 }, FIVE_ROWS_WITH_COUNTERS);
});

test('a chart that fits is placed inside its zone, never above it', () => {
  // The old table could be centred to a negative y; a placed picture is never
  // taller than its box, so it starts at or below the zone's top.
  const data = { ...FIVE_ROWS_WITH_COUNTERS, rows: FIVE_ROWS_WITH_COUNTERS.rows.map((r) => ({ label: r.label, cells: r.cells })) };
  const rect = measurePlaceValueChart({ x: 0.5, y: 0.9, w: 6.0, h: 2.4 }, data);
  assert.ok(rect.y >= 0.9 - 1e-9, `the chart starts above its zone (y=${rect.y})`);
  assert.ok(rect.y + rect.h <= 0.9 + 2.4 + 1e-6, 'the chart runs below its zone');
});

test('verify-geometry refuses a written package carrying a corrupt coordinate', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-geometry-test-'));
  const file = path.join(dir, 'corrupt.pptx');

  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();
  // The exact shape of the real fault: pptxgenjs re-converts a negative table
  // position on every pass, so -0.42in leaves the writer thousands of times
  // beyond any slide. If a future pptxgenjs fixes this, the table lands at a
  // small negative y instead, the file is valid, and this check rightly stays
  // quiet - so the corrupt value is asserted before the refusal is.
  slide.addTable([[{ text: 'x' }, { text: 'y' }]], {
    x: 1, y: -0.42, colW: [1, 1], rowH: [0.5], autoPage: false,
  });
  await pptx.writeFile({ fileName: file });

  const result = await verifyGeometry(file);
  assert.equal(result.faults.length, 1, 'the corrupt slide must be reported');
  assert.equal(result.faults[0].slide, 1);
  assert.match(result.faults[0].message, /invalid shape coordinates/);
  const worst = result.faults[0].values.map((v) => Number(v.replace(/^[a-z]+="|"$/g, '')));
  assert.ok(worst.some((n) => Math.abs(n) > LIMIT_EMU), 'the reported value is genuinely outside the envelope');
});

test('verify-geometry stays quiet over an ordinary deck', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-geometry-test-'));
  const file = path.join(dir, 'clean.pptx');

  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();
  slide.addTable([[{ text: 'x' }, { text: 'y' }]], {
    x: 1, y: 0.42, colW: [1, 1], rowH: [0.5], autoPage: false,
  });
  // A slightly negative TEXT position is written faithfully and is valid; the
  // envelope must not mistake a small deliberate bleed for corruption.
  slide.addText('bleed', { x: 1, y: -0.05, w: 2, h: 0.5 });
  await pptx.writeFile({ fileName: file });

  const result = await verifyGeometry(file);
  assert.deepEqual(result.faults, []);
  assert.ok(result.coordinates > 0, 'the check must actually have read coordinates');
});

// ─── A chart grows into the height its template gave it ───────────────
//
// The Compare 4-digit numbers deck drew every chart at exactly 1.07in whether
// its zone offered 1.41in, 2.17in or 2.66in: the scale was bounded by a fixed
// 0.45in reference column rather than by what the digits actually needed, so a
// four-column chart in a roomy zone printed 18pt digits inside 0.44in columns
// that could carry three times that, and used under half its height.

const ONE_ROW = {
  columns: ['Th', 'H', 'T', 'O'],
  rows: [{ label: '3,406', cells: ['3', '4', '0', '6'] }],
};

test('a chart takes the height it is given rather than a fixed size', () => {
  const short = measurePlaceValueChart({ x: 0, y: 0, w: 2.6, h: 1.41 }, ONE_ROW);
  const tall = measurePlaceValueChart({ x: 0, y: 0, w: 2.6, h: 2.17 }, ONE_ROW);
  assert.ok(tall.h > short.h, 'the taller zone drew the same size as the short one');
  assert.ok(tall.h / 2.17 > 0.7, `a chart in a 2.17in zone used only ${(tall.h / 2.17 * 100).toFixed(0)}% of it`);
});

test('a long row label no longer decides how big the digits are', () => {
  const zone = { x: 0, y: 0, w: 2.6, h: 2.17 };
  const shortLabel = boardLayout(zone, { columns: ['Th', 'H', 'T', 'O'], rows: [{ label: '1', cells: ['3', '4', '0', '6'] }] });
  const longLabel = boardLayout(zone, ONE_ROW);
  assert.equal(longLabel.D.toFixed(3), shortLabel.D.toFixed(3), 'the row label still changed the size of the digits');
});

test('a narrow chart is still held back by its own columns', () => {
  const narrow = measurePlaceValueChart({ x: 0, y: 0, w: 1.6, h: 3.0 }, ONE_ROW);
  assert.ok(narrow.h < 3.0 * 0.75, 'a narrow chart inflated to fill a tall zone');
});
