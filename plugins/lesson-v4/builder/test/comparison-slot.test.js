'use strict';

// The ring a child writes <, > or = into. Before it existed each deck typed a
// ○ into a text item at a hand-picked point size, which took a text card and
// stopped matching its neighbours the moment anything beside it changed size.

const assert = require('node:assert/strict');
const test = require('node:test');

// Since 13 September 2026 the ring is the one comparison picture
// (shared/visuals/comparison-svg.js) the sheet and the wall draw too, placed on
// the board by the shared placer.
const comparison = require('../../shared/visuals/comparison-svg');
const { profileFor } = require('../../shared/visuals/surface-profiles');
const { drawerFor, measurerFor, createSharedFigureStore } = require('../src/content/shared-figure');

const measureComparisonSlot = measurerFor('comparison-slot');
const onBoard = (zone, data) => comparison.tightSvg(data || {}, profileFor('slides', { widthPt: (zone.w - 0.2) * 72, heightPt: (zone.h - 0.2) * 72 }));

// The box the placer reserves for the picture in the preflight.
function placed(zone, data) {
  const shapes = [];
  const slide = { addShape: (kind, opts) => shapes.push(opts), addText() {}, addImage: (opts) => shapes.push(opts) };
  drawerFor('comparison-slot')({ shapes: { RECTANGLE: 'rect' } }, slide, zone, data || {}, { slideIndex: 0, sharedFigures: createSharedFigureStore() });
  return shapes[0];
}

test('the slot is round, not stretched to the shape of its gap', () => {
  // The typed-circle version inherited a text item's full-height card, so in a
  // tall narrow gap it read as a pill with a dot in it.
  const out = onBoard({ x: 0, y: 0, w: 0.9, h: 2.2 });
  assert.equal((out.svg.match(/<circle/g) || []).length, 1);
  assert.ok(Math.abs(out.w - out.h) < 1, `the ring is ${out.w} by ${out.h}`);
});

test('the slot grows with the room it is given', () => {
  const small = measureComparisonSlot({ x: 0, y: 0, w: 0.6, h: 2.2 }, {});
  const big   = measureComparisonSlot({ x: 0, y: 0, w: 1.4, h: 2.2 }, {});
  assert.ok(big.w > small.w, 'a wider gap drew the same ring as a narrow one');
});

test('the slot is centred in its gap so it lines up with what it sits between', () => {
  const zone = { x: 2, y: 1, w: 1.5, h: 2.4 };
  const box = placed(zone);
  assert.equal((box.x + box.w / 2).toFixed(3), (zone.x + zone.w / 2).toFixed(3), 'the ring was not horizontally centred');
  assert.equal((box.y + box.h / 2).toFixed(3), (zone.y + zone.h / 2).toFixed(3), 'the ring was not vertically centred');
});

test('a revealed answer prints inside the same ring, not instead of it', () => {
  const out = onBoard({ x: 0, y: 0, w: 1.2, h: 1.2 }, { answer: '<' });
  assert.equal((out.svg.match(/<circle/g) || []).length, 1, 'the ring disappeared when the answer was shown');
  const text = /<text x="([\d.]+)"[^>]*fill="#00B050"[^>]*>&lt;<\/text>/.exec(out.svg);
  assert.ok(text, 'the answer is not printed in answer green');
  const ring = /<circle cx="([\d.]+)"/.exec(out.svg);
  assert.equal(Number(text[1]).toFixed(1), Number(ring[1]).toFixed(1), 'the answer is not centred in the ring');
});

// ─── A row shares its width by appetite, not by counting ──────────────
//
// The ring between two place-value charts took a third of the row and drew at
// well under half of it, holding the charts either side to two thirds of the
// width they could have had. A slide's digits came out smaller to leave a gap
// around a ring that never wanted it.

const { drawRow } = require('../src/content/row');
const { maxUsefulWidth } = require('../src/content');

test('a slot declares the widest it can use; a chart declares nothing', () => {
  assert.ok(maxUsefulWidth({ type: 'comparison-slot' }) > 0);
  assert.equal(maxUsefulWidth({ type: 'place-value-chart' }), null,
    'a chart must keep taking whatever width it is given');
});

test('the width a slot cannot use goes to the items beside it', () => {
  const zones = [];
  const pptx = { shapes: { OVAL: 'oval', ROUNDED_RECTANGLE: 'rr', RECTANGLE: 'rect' } };
  const slide = { addShape() {}, addText() {}, addImage() {} };

  // Capture the sub-zone each item is handed.
  const content = require('../src/content');
  const realDraw = content.drawContent;
  content.drawContent = function (p, s, zone, item, ctx) {
    zones.push({ type: item && item.type, w: zone.w });
  };
  try {
    drawRow(pptx, slide, { x: 0, y: 0, w: 9.2, h: 2.5, class: 'C' }, {
      items: [
        { type: 'place-value-chart', columns: ['Th', 'H', 'T', 'O'], rows: [{ label: '3,406', cells: ['3','4','0','6'] }] },
        { type: 'comparison-slot' },
        { type: 'place-value-chart', columns: ['Th', 'H', 'T', 'O'], rows: [{ label: '2,406', cells: ['2','4','0','6'] }] }
      ]
    }, { slideIndex: 0, cardLook: true });
  } finally {
    content.drawContent = realDraw;
  }

  assert.equal(zones.length, 3);
  const equalShare = (9.2 - 0.2) / 3;
  assert.ok(zones[1].w < equalShare, 'the slot kept width it cannot use');
  assert.ok(zones[0].w > equalShare, 'the chart did not gain the released width');
  assert.equal(zones[0].w.toFixed(3), zones[2].w.toFixed(3), 'the two charts drew at different widths');

  const total = zones.reduce((t, z) => t + z.w, 0) + 0.2;
  assert.ok(Math.abs(total - 9.2) < 0.01, `the row did not fill its zone (${total.toFixed(2)} of 9.2)`);
});

test('a row of items that all want width is untouched', () => {
  const zones = [];
  const content = require('../src/content');
  const realDraw = content.drawContent;
  content.drawContent = function (p, s, zone, item) { zones.push(zone.w); };
  try {
    drawRow({ shapes: {} }, { addShape() {}, addText() {} },
      { x: 0, y: 0, w: 9.2, h: 2.5, class: 'C' },
      { items: [{ type: 'text', value: 'a' }, { type: 'text', value: 'b' }] },
      { slideIndex: 0, cardLook: true });
  } finally {
    content.drawContent = realDraw;
  }
  assert.equal(zones[0].toFixed(3), zones[1].toFixed(3));
});
