'use strict';

// A Year 4 slide teaching four-digit numbers printed "3,000" inside a part-whole
// circle as "3,00" over "0" - a four-digit number broken across two lines.
//
// The circle was sized from the ZONE alone, the label size was then guessed from
// the diameter and tapered by 3/charCount, and the result was clamped up to a
// 10pt "minimum" that was never checked against the circle it had to fit in. So
// the minimum did not mean "small but legible", it meant "overflow quietly":
// at 10pt "3,000" is wider than the 0.39in circle it was put in.
//
// The zone was the underlying fault - 7.75in wide and 1.27in tall, so nearly
// eight inches of width sat unused while the circles were cut from the height -
// and nothing caught it because nothing measured the label.
//
// Pinned here: the label is measured rather than guessed, it always fits inside
// its own circle, and a zone that cannot seat a readable label is refused by
// name with the size it needs. The model is the shared drawing since 13
// September 2026 (shared/visuals/part-whole-model-svg.js), laid out here in the
// box the board's placer gives it.

const assert = require('node:assert/strict');
const test = require('node:test');

const { tightSvg } = require('../../shared/visuals/part-whole-model-svg');
const { profileFor } = require('../../shared/visuals/surface-profiles');
const { textWidthIn } = require('../src/glyph-width');

const MODEL = { orientation: 'vertical', whole: '3,500', parts: ['3,000', '500'] };

function draw(zone, data) {
  const built = tightSvg(data, profileFor('slides', { widthPt: (zone.w - 0.2) * 72, heightPt: (zone.h - 0.2) * 72 }));
  const circles = built.layout.circles;
  return { labels: circles.filter((c) => c.text).map((c) => ({ text: c.text, pt: c.pt, w: (c.d * 0.72) / 72 })), circles, layout: built.layout };
}

test('the zone that shipped a wrapped number is refused, by name and with a size', () => {
  assert.throws(
    () => draw({ x: 0.23, y: 0.77, w: 7.75, h: 1.27 }, MODEL),
    /PART_WHOLE_MODEL_DOES_NOT_FIT.*needs a zone of at least .*was given 7\.75in x 1\.27in/s,
    'a starved zone must fail while the spec is repairable, not print an unreadable circle'
  );
});

test('every label fits inside its own circle', () => {
  const { labels } = draw({ x: 0.23, y: 0.77, w: 7.75, h: 3.0 }, MODEL);
  assert.ok(labels.length >= 3, 'a whole and two parts should be labelled');
  for (const l of labels) {
    const needed = textWidthIn(l.text, l.pt, true);
    assert.ok(l.w >= needed - 1e-6, `"${l.text}" at ${l.pt}pt needs ${needed.toFixed(2)}in and has ${l.w.toFixed(2)}in across its circle`);
  }
});

test('no label is ever drawn below the readable floor', () => {
  for (const h of [2.6, 3.0, 3.6, 4.4]) {
    const { labels } = draw({ x: 0.23, y: 0.77, w: 7.75, h }, MODEL);
    for (const l of labels) assert.ok(l.pt >= 14, `"${l.text}" drawn at ${l.pt}pt in a ${h}in zone`);
  }
});

test('a longer number earns a bigger circle, not a smaller font', () => {
  const zone = { x: 0.23, y: 0.77, w: 7.75, h: 3.0 };
  const short = draw(zone, { orientation: 'vertical', whole: '9', parts: ['4', '5'] });
  const long = draw(zone, MODEL);
  const px = (r) => Math.max(...r.circles.map((c) => c.d));
  // Same zone, so the circles are the same; what must not happen is the long
  // labels being crushed to fit a circle sized for short ones.
  assert.equal(px(short).toFixed(2), px(long).toFixed(2), 'the zone sets the circle size');
  for (const l of long.labels) assert.ok(l.w >= textWidthIn(l.text, l.pt, true) - 1e-6, `"${l.text}" was crushed rather than sized`);
});

test('the guessed taper is gone: a comma is not priced as a digit', () => {
  const zone = { x: 0.23, y: 0.77, w: 7.75, h: 3.0 };
  const withComma = draw(zone, { orientation: 'vertical', whole: '3,500', parts: ['3,000', '500'] });
  const digitsOnly = draw(zone, { orientation: 'vertical', whole: '35000', parts: ['30000', '500'] });
  const sizeOf = (r, t) => r.labels.find((l) => l.text === t).pt;
  assert.ok(sizeOf(withComma, '3,000') > sizeOf(digitsOnly, '30000'), 'a narrow comma should buy back size that five digits cannot');
});

test('the sheet spelling keeps its contract: every node states its intent', () => {
  const zone = { x: 0, y: 0, w: 7.75, h: 3.5 };
  assert.throws(() => draw(zone, { requireIntent: true, whole: { value: '6,731' }, parts: [{}, { blank: true }] }), /PART_WHOLE_INTENT_UNSTATED/);
  assert.throws(() => draw(zone, { whole: { value: '1', label: 'x' }, parts: [{ blank: true }] }), /value.*or `label`/);
  const { layout } = draw(zone, { whole: { value: '6,731' }, joiner: '+', parts: [{ blank: true, caption: 'Thousands' }, { blank: true, caption: 'Ones' }] });
  assert.equal(layout.orientation, 'vertical', 'a model written in objects stands upright');
  assert.equal(layout.joiners.length, 1, 'the operator sits between the two parts');
});
