'use strict';

// A five-row place value chart was put in a zone a third of its height. The
// chart's scale stops at 0.65 so digits stay readable, the centring then
// pushed its tables above the zone to a negative y, and the PPTX writer
// serialised that as an astronomically invalid coordinate: PowerPoint offered
// to "repair" the deck, and the run had already reported the build a success.
//
// Two defences, tested here at their own layers:
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

const { drawPlaceValueChart } = require('../src/content/place-value-chart');
const { verifyGeometry, LIMIT_EMU } = require('../src/verify-geometry');

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

function slideFor() {
  const pptx = new PptxGenJS();
  return { pptx, slide: pptx.addSlide() };
}

test('a chart refuses a zone shorter than its smallest readable height', () => {
  const { pptx, slide } = slideFor();
  assert.throws(
    () =>
      drawPlaceValueChart(pptx, slide, { x: 0.5, y: 0.9, w: 6.0, h: 2.3 }, FIVE_ROWS_WITH_COUNTERS),
    /PLACE_VALUE_CHART_DOES_NOT_FIT:.*needs at least .*in of height/,
    'a chart that cannot fit must refuse by name, not overflow to a negative position'
  );
});

test('the same chart draws without complaint in a zone tall enough for it', () => {
  const { pptx, slide } = slideFor();
  // Plenty of height: the floor the refusal names for this chart is ~5.9in.
  drawPlaceValueChart(pptx, slide, { x: 0.5, y: 0.6, w: 6.0, h: 6.5 }, FIVE_ROWS_WITH_COUNTERS);
});

test('a small overflow that fits in the pads is kept, pinned inside the zone', () => {
  const { pptx, slide } = slideFor();
  // Without counters the floor is header + 5 rows at 0.65 scale (~2.03in);
  // give the zone a hair less than floor + both pads, so the old centring
  // would have started above the zone and the clamp must hold it at zone.y.
  const data = { ...FIVE_ROWS_WITH_COUNTERS, rows: FIVE_ROWS_WITH_COUNTERS.rows.map((r) => ({ label: r.label, cells: r.cells })) };
  drawPlaceValueChart(pptx, slide, { x: 0.5, y: 0.9, w: 6.0, h: 2.1 }, data);
  const tables = slide._slideObjects.filter((o) => String(o._type) === 'table');
  assert.ok(tables.length > 0, 'the chart should still draw its grid');
  for (const t of tables) {
    assert.ok(t.options.y >= 0.9 - 1e-9, `a table must never start above its zone (got y=${t.options.y})`);
  }
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
