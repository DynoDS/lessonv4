'use strict';

// The ten frame on a slide (13 October 2026). The drawing itself is held in
// shared/test/ten-frame-svg.test.js; this holds what the board adds: the frame
// an answers slide shows is the frame its question showed, in the same place,
// whether the answer arrives as counters, as a green caption or as both.

const test = require('node:test');
const assert = require('node:assert/strict');
const { build, FIGURES } = require('../src/content/shared-figure');
const { ZONE_COMPAT } = require('../src/content/index');

const ZONES = [
  { x: 0.4, y: 1.2, w: 6.5, h: 3.4 }, // a wide teaching zone
  { x: 0.4, y: 1.2, w: 2.1, h: 2.4 }, // a third of a row
  { x: 7.2, y: 1.2, w: 2.6, h: 4.0 }, // a tall side column
];
const placed = (zone, data) => {
  const { box, built } = build('ten-frame', zone, data);
  const w = built.w / 72;
  const h = built.h / 72;
  return [box.x + (box.w - w) / 2, box.y + (box.h - h) / 2, w, h].map((v) => Math.round(v * 1000) / 1000);
};

test('the board can place a ten frame wherever it places a shaded fraction', () => {
  assert.ok(FIGURES['ten-frame']);
  assert.deepEqual(ZONE_COMPAT['ten-frame'], ZONE_COMPAT['shaded-fraction']);
});

test('an answers slide that adds counters leaves the frame where the question had it', () => {
  for (const zone of ZONES) {
    assert.deepEqual(placed(zone, { count: 6, second: 4 }), placed(zone, { count: 6 }));
    assert.deepEqual(placed(zone, { count: 8, second: 5, frames: 2 }), placed(zone, { count: 8, frames: 2 }));
  }
});

test('an answers slide that adds a green caption leaves the frame where the question had it', () => {
  for (const zone of ZONES) {
    const question = placed(zone, { count: 8, label: '(a)' });
    assert.deepEqual(placed(zone, { count: 8, second: 2, label: '(a) ||8 and 2 make 10.' }), question);
    // A question that keeps the caption's place with an empty label.
    assert.deepEqual(placed(zone, { count: 8, label: '' }), question);
  }
});

test('the caption sits directly under the frame, not at the foot of a tall card', () => {
  const zone = ZONES[2];
  const laid = build('ten-frame', zone, { count: 4, label: '(b)' });
  const frameBottom = laid.box.y + laid.box.h;
  assert.ok(Math.abs(laid.box.h - laid.built.h / 72) < 0.01, 'the picture box hugs the frame');
  assert.ok(frameBottom < zone.y + zone.h - 1, 'the frame and its caption are centred as one block');
});
