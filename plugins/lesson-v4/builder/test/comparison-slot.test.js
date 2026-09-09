'use strict';

// The ring a child writes <, > or = into. Before it existed each deck typed a
// ○ into a text item at a hand-picked point size, which took a text card and
// stopped matching its neighbours the moment anything beside it changed size.

const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawComparisonSlot, measureComparisonSlot } =
  require('../src/content/comparison-slot');

function drawn(zone, data) {
  const shapes = [];
  const texts = [];
  const pptx = new PptxGenJS();
  const slide = {
    addShape: (kind, opts) => shapes.push({ kind, ...opts }),
    addText: (content, opts) => texts.push({ content, ...opts }),
  };
  drawComparisonSlot(pptx, slide, zone, data || {}, { slideIndex: 0 });
  return { shapes, texts };
}

test('the slot is round, not stretched to the shape of its gap', () => {
  // The typed-circle version inherited a text item's full-height card, so in a
  // tall narrow gap it read as a pill with a dot in it.
  const { shapes } = drawn({ x: 0, y: 0, w: 0.9, h: 2.2 });
  assert.equal(shapes.length, 1);
  assert.equal(shapes[0].w.toFixed(3), shapes[0].h.toFixed(3));
});

test('the slot grows with the room it is given', () => {
  const small = measureComparisonSlot({ x: 0, y: 0, w: 0.6, h: 2.2 });
  const big   = measureComparisonSlot({ x: 0, y: 0, w: 1.4, h: 2.2 });
  assert.ok(big.w > small.w, 'a wider gap drew the same ring as a narrow one');
});

test('the slot is centred in its gap so it lines up with what it sits between', () => {
  const zone = { x: 2, y: 1, w: 1.5, h: 2.4 };
  const box = measureComparisonSlot(zone);
  assert.equal(
    (box.x + box.w / 2).toFixed(3),
    (zone.x + zone.w / 2).toFixed(3),
    'the ring was not horizontally centred'
  );
  assert.equal(
    (box.y + box.h / 2).toFixed(3),
    (zone.y + zone.h / 2).toFixed(3),
    'the ring was not vertically centred'
  );
});

test('a revealed answer prints inside the same ring, not instead of it', () => {
  const { shapes, texts } = drawn({ x: 0, y: 0, w: 1.2, h: 1.2 }, { answer: '<' });
  assert.equal(shapes.length, 1, 'the ring disappeared when the answer was shown');
  assert.equal(texts.length, 1);
  assert.equal(texts[0].content, '<');
  assert.equal(texts[0].x.toFixed(3), shapes[0].x.toFixed(3));
});
