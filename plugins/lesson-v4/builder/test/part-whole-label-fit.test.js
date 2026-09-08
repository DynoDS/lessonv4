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
// name with the size it needs, the way place-value-chart and table already do.

const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');

const { drawPartWholeModel } = require('../src/content/part-whole-model');
const { textWidthIn } = require('../src/glyph-width');

const MODEL = { orientation: 'vertical', whole: '3,500', parts: ['3,000', '500'] };

function draw(zone, data) {
  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();
  drawPartWholeModel(pptx, slide, zone, data);
  const labels = slide._slideObjects
    .filter((o) => Array.isArray(o.text) && o.text.length)
    .map((o) => ({ text: String(o.text[0].text), opts: o.options }));
  const circles = slide._slideObjects.filter((o) => String(o.shape) === 'ellipse');
  return { labels, circles };
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
    const needed = textWidthIn(l.text, l.opts.fontSize, true);
    assert.ok(
      l.opts.w >= needed,
      `"${l.text}" at ${l.opts.fontSize}pt needs ${needed.toFixed(2)}in and was given a ` +
        `${l.opts.w.toFixed(2)}in box, so PowerPoint would wrap it inside the circle`
    );
  }
});

test('no label is ever drawn below the readable floor', () => {
  // Every zone that draws at all must draw legibly; anything else is refused.
  for (const h of [2.6, 3.0, 3.6, 4.4]) {
    const { labels } = draw({ x: 0.23, y: 0.77, w: 7.75, h }, MODEL);
    for (const l of labels) {
      assert.ok(l.opts.fontSize >= 14, `"${l.text}" drawn at ${l.opts.fontSize}pt in a ${h}in zone`);
    }
  }
});

test('a longer number earns a bigger circle, not a smaller font', () => {
  const zone = { x: 0.23, y: 0.77, w: 7.75, h: 3.0 };
  const short = draw(zone, { orientation: 'vertical', whole: '9', parts: ['4', '5'] });
  const long = draw(zone, MODEL);
  const px = (r) => Math.max(...r.circles.map((c) => c.options.w));
  // Same zone, so the circles are the same; what must not happen is the long
  // labels being crushed to fit a circle sized for short ones.
  assert.equal(px(short).toFixed(2), px(long).toFixed(2), 'the zone sets the circle size');
  for (const l of long.labels) {
    assert.ok(
      l.opts.w >= textWidthIn(l.text, l.opts.fontSize, true),
      `"${l.text}" was crushed rather than sized`
    );
  }
});

test('the guessed taper is gone: a comma is not priced as a digit', () => {
  // "3,000" and "30000" are both five characters. The old 3/charCount taper gave
  // them the same size; they are not the same width.
  const zone = { x: 0.23, y: 0.77, w: 7.75, h: 3.0 };
  const withComma = draw(zone, { orientation: 'vertical', whole: '3,500', parts: ['3,000', '500'] });
  const digitsOnly = draw(zone, { orientation: 'vertical', whole: '35000', parts: ['30000', '500'] });
  const sizeOf = (r, t) => r.labels.find((l) => l.text === t).opts.fontSize;
  assert.ok(
    sizeOf(withComma, '3,000') > sizeOf(digitsOnly, '30000'),
    'a narrow comma should buy back size that five digits cannot'
  );
});
