'use strict';

// A figure that keeps its true shape in a slot shaped unlike it.
//
// The builder contains a map or a photograph rather than stretching it, which is
// right. The consequence nobody measured: when the slot's proportions are a long
// way from the picture's, the picture ends up a fraction of the size the slide
// had room for and the rest of the card is white. A Year 4 world map went out at
// 46% of its card on the opening slide of a lesson about reading a map, and the
// optional-picture pass then decorated the space it left.

const assert = require('node:assert/strict');
const test = require('node:test');

const { checkZoneFill, zoneFillWarnings, clearZoneFill } = require('../src/content/_zone-fill');

const CTX = { slideIndex: 0 };

function findingsFor(zone, drawn) {
  clearZoneFill();
  checkZoneFill(CTX, zone, drawn, 'the world map');
  return zoneFillWarnings();
}

test('a wide picture in a much wider slot is reported', () => {
  // The real starter: a 2:1 map in a 3.7:1 card.
  const found = findingsFor({ w: 13.0, h: 3.5 }, { w: 7.0, h: 3.5 });
  assert.equal(found.length, 1);
  assert.equal(found[0].signal, 'FIGURE_ZONE_UNDERFILLED');
  assert.match(found[0].message, /either side of it/, 'names the axis being given away');
});

test('a wide picture in a tall slot is reported, and names the other axis', () => {
  // The real world-to-continent zoom: a 2:1 picture in a 0.75:1 card.
  const found = findingsFor({ w: 4.0, h: 5.3 }, { w: 4.0, h: 2.0 });
  assert.equal(found.length, 1);
  assert.match(found[0].message, /above and below it/);
});

test('a slot shaped roughly like its picture is not reported', () => {
  // The discrimination case, and the one the check must not nag about: the
  // rainforest slide, whose map sits in a card close to its own proportions.
  assert.deepEqual(findingsFor({ w: 12.5, h: 5.1 }, { w: 12.5, h: 4.4 }), []);
});

test('a small picture leaving a small margin is not reported', () => {
  // "The picture is small" is not the fault. A thumbnail honestly filling a
  // thumbnail slot has nothing wrong with it, so the waste has to be worth a
  // sentence before the finding is raised.
  assert.deepEqual(findingsFor({ w: 1.6, h: 1.2 }, { w: 0.8, h: 0.6 }), []);
});

test('the finding says what to do and what not to do', () => {
  const [found] = findingsFor({ w: 13.0, h: 3.5 }, { w: 7.0, h: 3.5 });
  assert.match(found.message, /Give this figure a slot shaped more like it/);
  assert.match(found.message, /Do not stretch it/, 'the wrong repair must be named as wrong');
  assert.match(found.message, /2\.00:1.*3\.71:1/, 'both shapes are stated so the fix is obvious');
});

test('nothing is recorded without a slide to attach it to', () => {
  clearZoneFill();
  checkZoneFill(null, { w: 10, h: 2 }, { w: 2, h: 2 }, 'x');
  checkZoneFill({}, { w: 10, h: 2 }, { w: 2, h: 2 }, 'x');
  assert.deepEqual(zoneFillWarnings(), []);
});

test('a zero-sized slot or figure is ignored rather than divided by', () => {
  clearZoneFill();
  checkZoneFill(CTX, { w: 0, h: 0 }, { w: 2, h: 2 }, 'x');
  checkZoneFill(CTX, { w: 10, h: 2 }, { w: 0, h: 0 }, 'x');
  assert.deepEqual(zoneFillWarnings(), []);
});
