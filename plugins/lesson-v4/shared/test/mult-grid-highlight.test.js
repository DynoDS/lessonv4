'use strict';

// Pointing at part of a multiplication grid (shared/visuals/figure-highlight.js):
// "the 3 times row", "the 4 column", "3 times 4". Rows and columns are named by
// their headers, a product by its two headers. The lit squares stay at full
// strength with the headers that name them, one ring goes round the part, and
// the rest of the grid steps back.

const test = require('node:test');
const assert = require('node:assert/strict');
const grid = require('../visuals/mult-grid-svg');
const { RING, RING_INK, DIMMED } = require('../visuals/figure-highlight');
const { profileFor } = require('../visuals/surface-profiles');

const BOARD = profileFor('slides', { widthPt: 500, heightPt: 360 });
const SHEET = profileFor('worksheets', { widthMm: 170 });
const SPEC = { colHeaders: ['2', '3', '4'], rowHeaders: ['3', '5'], cells: [['6', '9', '12'], ['10', '', '20']] };

const ring = new RegExp(`fill="none" stroke="#${RING}"`, 'g');
// The numbers drawn in the faded group, and those drawn at full strength.
function split(svg) {
  const group = svg.match(new RegExp(`<g opacity="${DIMMED}">(.*?)</g>`));
  const inFade = group ? [...group[1].matchAll(/>([^<]+)<\/text>/g)].map((m) => m[1]) : [];
  const rest = svg.replace(group ? group[0] : '', '');
  return { faded: inFade, full: [...rest.matchAll(/>([^<]+)<\/text>/g)].map((m) => m[1]) };
}

test('a named row draws at full strength with one ring, its column headers stay, and the other rows fade', () => {
  const { svg } = grid.tightSvg({ ...SPEC, highlight: '3 times row' }, BOARD);
  assert.equal((svg.match(ring) || []).length, 1);
  const { faded, full } = split(svg);
  assert.deepEqual(full.sort(), ['12', '2', '3', '3', '4', '6', '9', '×'].sort());
  assert.deepEqual(faded.sort(), ['10', '20', '5'].sort());
});

test('a product is named by its two headers, row first, and lights only its headers', () => {
  const { svg } = grid.tightSvg({ ...SPEC, highlight: '5 x 4' }, BOARD);
  const { full } = split(svg);
  assert.deepEqual(full.sort(), ['20', '4', '5', '×'].sort());
  assert.equal(grid.tightSvg({ ...SPEC, highlight: '5 times 4' }, BOARD).svg, svg);
  assert.equal(grid.tightSvg({ ...SPEC, highlight: ['column 3'] }, BOARD).svg, grid.tightSvg({ ...SPEC, highlight: 'col 3' }, BOARD).svg);
});

test('an unknown part is refused, and the refusal lists the parts', () => {
  assert.throws(() => grid.tightSvg({ ...SPEC, highlight: 'row 7' }, BOARD), /FIGURE_HIGHLIGHT_UNKNOWN.*row 3, row 5, column 2, column 3, column 4, 3 x 2/s);
});

test('a header left blank is named by its place', () => {
  const blank = { colHeaders: ['', '7'], rowHeaders: ['6', ''], cells: [['24', '42'], ['32', '']] };
  assert.equal((grid.tightSvg({ ...blank, highlight: 'column 1 across' }, SHEET).svg.match(ring) || []).length, 1);
  assert.throws(() => grid.tightSvg({ ...blank, highlight: 'nope' }, SHEET), /row 6, row 2 down, column 1 across, column 7/);
});

test('no highlight draws exactly as the grid with the field absent, under the same key', () => {
  for (const profile of [BOARD, SHEET]) {
    for (const none of [null, [], false]) {
      assert.equal(grid.tightSvg({ ...SPEC, highlight: none }, profile).svg, grid.tightSvg(SPEC, profile).svg);
      assert.equal(grid.cacheKey({ ...SPEC, highlight: none }, profile), grid.cacheKey(SPEC, profile));
    }
    assert.equal(grid.minWidthPt({ ...SPEC, highlight: null }), grid.minWidthPt(SPEC));
  }
  assert.notEqual(grid.cacheKey({ ...SPEC, highlight: 'row 5' }, SHEET), grid.cacheKey(SPEC, SHEET));
});

test('a highlighted grid still fits the box it was given, ring and all', () => {
  const { w, h } = grid.tightSvg({ ...SPEC, highlight: 'column 4' }, BOARD);
  assert.ok(w <= 500 + 0.5 && h <= 360 + 0.5, `${w} x ${h}`);
});

test('on the photocopied pack the ring is dark ink', () => {
  const { svg } = grid.tightSvg({ ...SPEC, highlight: 'row 3' }, profileFor('stickin', { widthMm: 90 }));
  assert.ok(svg.includes(`fill="none" stroke="#${RING_INK}"`));
});
