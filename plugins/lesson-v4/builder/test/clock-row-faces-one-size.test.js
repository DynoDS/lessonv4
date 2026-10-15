'use strict';

// Clocks in a slide row are one size, whatever each one carries.
//
// A row draws each clock in its own cell. A face with a digital time under it,
// or a minute ring round it, needs more of the cell than a plain face, so in a
// shallow row it came out smaller than its neighbours. The clock can now show
// one hand alone and coloured hands without the digital time (13 October
// 2026), so a row mixes them: the long hand, the short hand, both, then both
// with the time. The row tells each clock what its neighbours carry.

const test = require('node:test');
const assert = require('node:assert/strict');
const { build } = require('../src/content/shared-figure');
const clock = require('../../shared/visuals/clock-svg');

const ROW = [
  { type: 'clock', time: '4:45', hands: 'minute', colourCoded: true },
  { type: 'clock', time: '4:45', hands: 'hour', colourCoded: true },
  { type: 'clock', time: '4:45', colourCoded: true, readout: false },
  { type: 'clock', time: '4:45', colourCoded: true },
];
// A cell wider than it is tall, so the height decides the face.
const cell = (extra) => ({ x: 0, y: 0, w: 3.2, h: 2.6, ...extra });

test('each clock in a row leaves the room its neighbours take, so the faces match', () => {
  const alone = ROW.map((item) => build('clock', cell(), item).built.layout.r);
  assert.ok(new Set(alone.map((r) => r.toFixed(1))).size > 1, 'drawn with no word from the row, these faces differ, or this proves nothing');

  const clockRowReserve = clock.rowReserve(ROW);
  const together = ROW.map((item) => build('clock', cell({ clockRowReserve }), item));
  assert.equal(new Set(together.map((laid) => laid.built.layout.r.toFixed(2))).size, 1, 'one face size');
  assert.equal(new Set(together.map((laid) => laid.built.h.toFixed(2))).size, 1, 'one picture height, so the faces sit level');
  assert.equal(new Set(together.map((laid) => laid.key)).size, 4, 'four different pictures');
});

test('a row of like clocks is told nothing, and draws as it always did', () => {
  const like = [{ type: 'clock', time: '2:15' }, { type: 'clock', time: '7:40' }, { type: 'clock', hands: false }];
  assert.equal(clock.rowReserve(like), null);
  const before = build('clock', cell(), like[0]);
  assert.equal(before.key, clock.cacheKey(like[0], require('../../shared/visuals/surface-profiles').profileFor('slides', { widthPt: before.box.w * 72, heightPt: before.box.h * 72 })));
});
