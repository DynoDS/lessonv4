'use strict';

// Pointing at one circle of a part-whole model (shared/visuals/figure-highlight.js):
// "the whole", "this part". The circle stays at full strength with a ring round
// it; the other circles step back with their numbers, captions and the lines
// that join them, and the model still fits the box it was given.

const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('../visuals/part-whole-model-svg');
const { RING, RING_INK, DIMMED } = require('../visuals/figure-highlight');
const { profileFor } = require('../visuals/surface-profiles');

const BOARD = profileFor('slides', { widthPt: 500, heightPt: 360 });
const SHEET = profileFor('worksheets', { widthMm: 170 });
const SPEC = { whole: '45', parts: ['27', '?'] };
const UPRIGHT = { whole: { value: '6,731', caption: 'Number' }, parts: [{ value: '6,000', caption: 'Thousands' }, { value: '700' }, { value: '30' }, { value: '1' }], joiner: '+' };

const ring = new RegExp(`<circle[^>]*fill="none" stroke="#${RING}"`, 'g');
const faded = (svg, word) => new RegExp(`<g opacity="${DIMMED}">(?:(?!</g>).)*>${word}<`).test(svg);

test('a named circle draws at full strength with one ring, and the others fade with their lines', () => {
  const { svg } = model.tightSvg({ ...SPEC, highlight: 'part 1' }, BOARD);
  assert.equal((svg.match(ring) || []).length, 1);
  assert.ok(!faded(svg, '27'));
  assert.ok(faded(svg, '45') && faded(svg, '\\?'));
  assert.equal((svg.match(new RegExp(`<g opacity="${DIMMED}"><line`, 'g')) || []).length, 1, 'the line to the other part steps back');
});

test('a circle answers to its number and its caption, and a joiner stays lit beside a lit part', () => {
  assert.equal(model.tightSvg({ ...SPEC, highlight: '27' }, BOARD).svg, model.tightSvg({ ...SPEC, highlight: 'part 1' }, BOARD).svg);
  const upright = model.tightSvg({ ...UPRIGHT, highlight: 'thousands' }, SHEET).svg;
  assert.ok(!faded(upright, '6,000') && !faded(upright, 'Thousands') && faded(upright, 'Number'));
  const pluses = upright.match(/(<g opacity="[\d.]+">)?<text[^>]*>\+<\/text>/g);
  assert.equal(pluses.length, 3);
  assert.deepEqual(pluses.map((p) => p.startsWith('<g')), [false, true, true], 'only the + after the lit part stays');
});

test('an unknown circle is refused, and the refusal lists the circles', () => {
  assert.throws(() => model.tightSvg({ ...SPEC, highlight: 'part 3' }, BOARD), /FIGURE_HIGHLIGHT_UNKNOWN.*whole, part 1, part 2/s);
});

test('no highlight draws exactly as the model with the field absent, under the same key', () => {
  for (const spec of [SPEC, UPRIGHT]) {
    for (const profile of [BOARD, SHEET]) {
      for (const none of [null, [], false]) {
        assert.equal(model.tightSvg({ ...spec, highlight: none }, profile).svg, model.tightSvg(spec, profile).svg);
        assert.equal(model.cacheKey({ ...spec, highlight: none }, profile), model.cacheKey(spec, profile));
      }
    }
    assert.equal(model.minWidthPt({ ...spec, highlight: null }), model.minWidthPt(spec));
  }
  assert.notEqual(model.cacheKey({ ...SPEC, highlight: 'whole' }, BOARD), model.cacheKey(SPEC, BOARD));
});

test('a highlighted model still fits the box it was given, ring and all', () => {
  for (const key of ['whole', 'part 1', 'part 2']) {
    const { svg, w, h } = model.tightSvg({ ...SPEC, highlight: key }, BOARD);
    assert.ok(w <= 500 + 0.5 && h <= 360 + 0.5, `${key}: ${w} x ${h}`);
    // The ring lies inside the picture's frame.
    const vb = svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/).slice(1).map(Number);
    const c = svg.match(new RegExp(`<circle cx="([\\d.]+)" cy="([\\d.]+)" r="([\\d.]+)" fill="none" stroke="#${RING}" stroke-width="([\\d.]+)"`)).slice(1).map(Number);
    const reach = c[2] + c[3] / 2;
    assert.ok(c[0] - reach >= vb[0] - 0.01 && c[0] + reach <= vb[0] + vb[2] + 0.01, `${key} ring inside across`);
    assert.ok(c[1] - reach >= vb[1] - 0.01 && c[1] + reach <= vb[1] + vb[3] + 0.01, `${key} ring inside down`);
  }
});

test('on the photocopied pack the ring is dark ink', () => {
  const { svg } = model.tightSvg({ ...SPEC, highlight: 'whole' }, profileFor('stickin', { widthMm: 110 }));
  assert.ok(svg.includes(`fill="none" stroke="#${RING_INK}"`));
});
