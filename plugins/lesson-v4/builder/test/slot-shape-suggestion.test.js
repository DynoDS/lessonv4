'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { nearestSlot, slotShapes } = require('../src/content/_zone-fill');

// A picture is drawn contained, so the short side of its slot decides how big it
// gets. A square photograph in the widest slot on the deck is therefore not just
// untidy: it is a smaller picture than the slide had room for, and that is how a
// photograph ends up under the readable floor with nothing obviously wrong.
//
// The engine measures the mismatch at draw time, so it can also say where the
// picture would sit better. Without that, "give it a slot shaped more like it"
// asks the reader to hold fifty template entries in mind.

const away = (a, b) => Math.max(a / b, b / a);

test('a square picture is pointed at a near-square slot', () => {
  const best = nearestSlot(1.0, 2.41);

  assert.ok(best, 'a square picture in a 2.41:1 slot has somewhere better to go');
  assert.match(best.name, /split-h-50-50/);
  assert.ok(away(best.ratio, 1.0) < 1.15, `0.95:1 is near square; got ${best.ratio}`);
});

test('a wide panorama is pointed at a wide band, not a column', () => {
  const best = nearestSlot(4.0, 1.0);

  assert.ok(best);
  assert.ok(best.ratio > 2.5, `a 4:1 picture wants a wide slot; got ${best.ratio.toFixed(2)}`);
});

test('a tall portrait is pointed at a narrow column', () => {
  const best = nearestSlot(0.5, 1.94);

  assert.ok(best);
  assert.ok(best.ratio < 1, `a 0.5:1 picture wants a tall slot; got ${best.ratio.toFixed(2)}`);
});

test('a suggestion is only made when it is actually an improvement', () => {
  // The picture already sits in the best-shaped slot the deck has, so there is
  // nothing useful to say and the finding should not invent a move.
  const settled = nearestSlot(1.94, 1.94);

  assert.equal(settled, null);
});

test('every suggestion is closer to the picture than the slot it replaces', () => {
  for (const picture of [0.4, 0.6, 1.0, 1.5, 2.4, 4.0, 6.0]) {
    for (const current of [0.2, 1.0, 1.94, 3.0, 6.2]) {
      const best = nearestSlot(picture, current);
      if (!best) continue;
      assert.ok(
        away(best.ratio, picture) < away(current, picture),
        `suggested ${best.ratio.toFixed(2)}:1 for a ${picture}:1 picture already in ${current}:1`
      );
    }
  }
});

test('the shapes come from the real layout, so a moved split cannot go stale', () => {
  const shapes = slotShapes();
  const full = shapes.find((s) => s.name === 'body-full');
  const { CONTENT_W, SLIDE_H, MARGIN_BOTTOM } = require('../src/layout');

  assert.ok(full);
  assert.ok(Math.abs(full.ratio - CONTENT_W / (SLIDE_H - MARGIN_BOTTOM - 0.6)) < 0.001);
  assert.ok(shapes.length > 15, 'the deck offers a real spread of shapes to choose from');
});
