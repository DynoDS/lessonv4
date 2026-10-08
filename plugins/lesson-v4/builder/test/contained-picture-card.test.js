'use strict';

// Where the card round a contained picture sits.
//
// A labelled diagram, a circuit diagram and the parachute forces picture are
// each fitted whole into their zone, and their card hugs the fitted picture
// plus its margin. The rect that says where used to start at the picture's
// own corner while being a margin bigger all round, so the card sat 0.10"
// right of and below its cell. A picture held by its width therefore reached
// across the whole 0.10" gap of a row, and its card touched the card beside
// it: the teacher saw it on a Year 4 digestion slide on 6 October 2026 ("the
// cards are touching").

const assert = require('node:assert/strict');
const test = require('node:test');

const { measureContainedAspect } = require('../src/content/contained-extent');
const { drawContent } = require('../src/content');
const { labelDiagramKey, preparedLabelDiagrams } = require('../src/content/label-diagram');

// The pictures a build has read, with every drawing it will ask for already
// made, as they stand in the build's second pass.
function madeDiagrams(entries) {
  const images = preparedLabelDiagrams(entries);
  images._store.made = { get: () => Buffer.from('x') };
  return images;
}

const ZONE = { x: 1, y: 2, w: 6, h: 4 };
const inside = (rect, zone) =>
  rect.x >= zone.x - 1e-9 && rect.y >= zone.y - 1e-9 &&
  rect.x + rect.w <= zone.x + zone.w + 1e-9 && rect.y + rect.h <= zone.y + zone.h + 1e-9;

test('a picture held by its width fills the cell and stays inside it', () => {
  const rect = measureContainedAspect(ZONE, 3);
  assert.ok(inside(rect, ZONE), JSON.stringify(rect));
  assert.ok(Math.abs(rect.x - ZONE.x) < 1e-9, 'the card starts at the left edge of the cell');
  assert.ok(Math.abs(rect.w - ZONE.w) < 1e-9, 'and ends at its right edge');
  // Centred in the height it does not use.
  assert.ok(Math.abs((rect.y + rect.h / 2) - (ZONE.y + ZONE.h / 2)) < 1e-9);
});

test('a picture held by its height fills the cell and stays inside it', () => {
  const rect = measureContainedAspect(ZONE, 0.5);
  assert.ok(inside(rect, ZONE), JSON.stringify(rect));
  assert.ok(Math.abs(rect.y - ZONE.y) < 1e-9);
  assert.ok(Math.abs(rect.h - ZONE.h) < 1e-9);
  assert.ok(Math.abs((rect.x + rect.w / 2) - (ZONE.x + ZONE.w / 2)) < 1e-9);
});

test('in a row, a labelled diagram and the card beside it keep the gap between them', () => {
  const diagram = {
    type: 'label-diagram', imagePath: 'route.png', layout: 'sides',
    callouts: [{ anchor: [20, 50], label: 'mouth', given: true }],
  };
  const row = { type: 'row', items: [diagram, { type: 'text', value: 'Teeth break food into smaller pieces.' }] };
  const cards = [];
  const pictures = [];
  const slide = {
    addShape: (kind, o) => cards.push(o),
    addImage: (o) => pictures.push(o),
    addText: () => {},
  };
  const pptx = { shapes: { ROUNDED_RECTANGLE: 'roundRect', RECTANGLE: 'rect', LINE: 'line' } };
  const zone = { x: 0.22, y: 2.56, w: 12.893, h: 4.218, class: 'A' };
  const ctx = {
    slideIndex: 0,
    cardLook: true,
    lesson: { slides: [{}] },
    // A wide drawing (2.4:1), so its width is what holds it in the cell.
    labelDiagramImages: madeDiagrams({ [labelDiagramKey(diagram)]: { href: 'x', width: 2400, height: 1000 } }),
  };
  drawContent(pptx, slide, zone, row, ctx);

  assert.equal(pictures.length, 1);
  const half = (zone.w - 0.10) / 2;
  const cell = { x: zone.x, y: zone.y, w: half, h: zone.h };
  const card = cards.find((c) => Math.abs(c.x - cell.x) < 0.5 && c.w > 1);
  assert.ok(card, 'the diagram has a card: ' + JSON.stringify(cards));
  assert.ok(inside(card, cell), `the diagram's card stays in its cell: ${JSON.stringify(card)}`);
  const neighbour = cards.find((c) => c.x > cell.x + cell.w - 0.01 && c.w > 1);
  assert.ok(neighbour, 'the text has a card');
  const gap = neighbour.x - (card.x + card.w);
  assert.ok(Math.abs(gap - 0.10) < 1e-6, `the row's 0.10" gap is kept, found ${gap.toFixed(3)}"`);
  // And the picture sits in the middle of its card, a margin in on each side.
  const p = pictures[0];
  assert.ok(Math.abs((p.x - card.x) - (card.x + card.w - p.x - p.w)) < 1e-6);
});
