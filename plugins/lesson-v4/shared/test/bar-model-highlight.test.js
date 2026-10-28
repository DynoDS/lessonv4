'use strict';

// Pointing at part of a bar model (shared/visuals/figure-highlight.js): "the
// whole", "this part", "the difference". The named box draws at full strength
// with a ring round it and everything else steps back; a name the model does not
// have is refused with its parts listed; no highlight draws exactly as before.

const test = require('node:test');
const assert = require('node:assert/strict');
const barModel = require('../visuals/bar-model-svg');
const { RING, RING_INK, DIMMED } = require('../visuals/figure-highlight');
const { profileFor } = require('../visuals/surface-profiles');

const PART_WHOLE = {
  shape: 'part-whole',
  whole: { label: '£5' },
  parts: [{ label: 'biscuit 30p' }, { label: 'drink 50p' }, { label: 'change ?' }],
};
const COMPARISON = {
  shape: 'comparison',
  bars: [{ name: 'Tom', label: '£27.40', value: 27.4 }, { name: 'Sam', label: '£12.75', value: 12.75 }],
  difference: { label: '?' },
};
const WHOLE_PARTS = { shape: 'whole-parts', whole: { label: '45', value: 45 }, parts: [{ label: '27', value: 27 }, { label: '?' }], names: true };

const ring = new RegExp(`fill="none" stroke="#${RING}"`, 'g');
// A word drawn inside a faded group, as opposed to at full strength.
const faded = (svg, word) => new RegExp(`<g opacity="${DIMMED}">(?:(?!</g>).)*>${word}<`).test(svg);

test('a named part draws at full strength with one ring, and the other parts fade', () => {
  const { svg } = barModel.tightSvg({ ...PART_WHOLE, highlight: 'part 2' });
  assert.equal((svg.match(ring) || []).length, 1);
  assert.ok(!faded(svg, 'drink 50p'), 'the lit part is not faded');
  assert.ok(faded(svg, 'biscuit 30p') && faded(svg, 'change \\?'), 'the other parts fade');
  assert.ok(faded(svg, '£5'), 'the whole, its bracket and its label fade');
});

test('a part answers to its own label, and pointing at the whole keeps its parts lit', () => {
  assert.equal(barModel.tightSvg({ ...PART_WHOLE, highlight: 'drink 50p' }).svg, barModel.tightSvg({ ...PART_WHOLE, highlight: 'part 2' }).svg);
  const { svg } = barModel.tightSvg({ ...PART_WHOLE, highlight: 'whole' });
  assert.equal((svg.match(ring) || []).length, 1);
  assert.ok(!faded(svg, '£5') && !faded(svg, 'drink 50p'), 'the parts ARE the whole, so they stay lit');
});

test('the difference of a comparison, and the whole of a whole-parts model, can be pointed at', () => {
  const cmp = barModel.tightSvg({ ...COMPARISON, highlight: 'gap' }).svg;
  assert.equal((cmp.match(ring) || []).length, 1);
  assert.ok(faded(cmp, 'Tom') && faded(cmp, '£27.40'), 'a bar steps back with its name');
  const wp = barModel.tightSvg({ ...WHOLE_PARTS, highlight: 'whole' }).svg;
  assert.ok(!faded(wp, 'whole') && faded(wp, 'parts') && faded(wp, '27'));
});

test('an unknown part is refused, and the refusal lists the parts', () => {
  assert.throws(() => barModel.tightSvg({ ...PART_WHOLE, highlight: 'the lemonade' }), /FIGURE_HIGHLIGHT_UNKNOWN.*whole, part 1, part 2, part 3/s);
  assert.throws(() => barModel.cacheKey({ ...COMPARISON, highlight: 'part 1' }), /bar 1, bar 2, difference/);
});

test('no highlight draws exactly as the model with the field absent, under the same key', () => {
  for (const spec of [PART_WHOLE, COMPARISON, WHOLE_PARTS]) {
    for (const none of [null, [], false]) {
      assert.equal(barModel.tightSvg({ ...spec, highlight: none }).svg, barModel.tightSvg(spec).svg);
      assert.equal(barModel.cacheKey({ ...spec, highlight: none }), barModel.cacheKey(spec));
    }
    assert.ok(!barModel.tightSvg(spec).svg.includes('opacity='));
  }
  assert.notEqual(barModel.cacheKey({ ...PART_WHOLE, highlight: 'whole' }), barModel.cacheKey(PART_WHOLE));
});

test('on the photocopied pack the ring is dark ink', () => {
  const { svg } = barModel.tightSvg({ ...PART_WHOLE, highlight: 'part 1' }, profileFor('stickin', { widthMm: 110 }));
  assert.ok(svg.includes(`fill="none" stroke="#${RING_INK}"`));
  assert.ok(!svg.includes(`#${RING}`));
});
