'use strict';

// Showing one part of a photograph, enlarged.
//
// The Year 4 History deck of 7 September 2026 asked children to compare Edward
// VI's rattle with a modern one. The rattle is a few millimetres of a full
// portrait; at the back of the room it is not there. The review said so three
// times and no repair was possible, because an inset needed a second photograph
// and no library has a photograph of just that rattle.
const test = require('node:test');
const assert = require('node:assert');

const { detailRect } = require('../src/content/image');

// A 2000x1500 photograph, and a 2-inch by 1.5-inch inset frame on the slide.
const DIMS = { w: 2000, h: 1500 };
const FRAME = { x: 5, y: 3, w: 2, h: 1.5 };

test('the named region is enlarged to fill the inset frame', () => {
  // A tenth of the picture's width shown across the whole frame is a ten-times
  // enlargement, and that is the whole point of the feature.
  const drawn = detailRect(FRAME, DIMS, { x: 0.4, y: 0.5, w: 0.1, h: 0.1 });

  assert.ok(
    drawn.w >= FRAME.w * 9.9,
    `the picture was scaled to ${drawn.w.toFixed(2)}in wide; a tenth of it has ` +
      'to reach the frame'
  );
  assert.equal(drawn.sizing.type, 'crop');
  assert.equal(drawn.sizing.w, FRAME.w, 'the visible window is the frame');
  assert.equal(drawn.sizing.h, FRAME.h);
});

test('the crop is centred on the region the caller named', () => {
  const drawn = detailRect(FRAME, DIMS, { x: 0.4, y: 0.5, w: 0.1, h: 0.1 });

  // Where the centre of the named region ended up inside the visible window.
  const centreX = 0.45 * drawn.w - drawn.sizing.x;
  const centreY = 0.55 * drawn.h - drawn.sizing.y;

  assert.ok(
    Math.abs(centreX - FRAME.w / 2) < 0.01,
    `the region's centre landed ${centreX.toFixed(3)}in across a ${FRAME.w}in frame`
  );
  assert.ok(
    Math.abs(centreY - FRAME.h / 2) < 0.01,
    `the region's centre landed ${centreY.toFixed(3)}in down a ${FRAME.h}in frame`
  );
});

test('a region against the edge of the picture is not cropped off the picture', () => {
  // Nothing outside the file exists to show, so the window stays inside it. A
  // negative offset is PowerPoint drawing white where a child expects evidence.
  for (const detail of [
    { x: 0, y: 0, w: 0.1, h: 0.1 },
    { x: 0.9, y: 0.9, w: 0.1, h: 0.1 },
  ]) {
    const drawn = detailRect(FRAME, DIMS, detail);
    assert.ok(drawn.sizing.x >= 0, `x offset ${drawn.sizing.x} is off the picture`);
    assert.ok(drawn.sizing.y >= 0, `y offset ${drawn.sizing.y} is off the picture`);
    assert.ok(drawn.sizing.x + drawn.sizing.w <= drawn.w + 1e-9);
    assert.ok(drawn.sizing.y + drawn.sizing.h <= drawn.h + 1e-9);
  }
});

test('the detail keeps the picture\'s own proportions, never stretched', () => {
  // Evidence is not stretched. A region shaped unlike the frame is filled from
  // the picture AROUND it, which still shows the object in its true shape.
  const drawn = detailRect(FRAME, DIMS, { x: 0.3, y: 0.3, w: 0.4, h: 0.05 });

  assert.ok(
    Math.abs(drawn.w / drawn.h - DIMS.w / DIMS.h) < 1e-9,
    'the scaled picture no longer has the aspect ratio of the file'
  );
});

test('a nonsense rectangle is brought back inside the picture', () => {
  const drawn = detailRect(FRAME, DIMS, { x: 5, y: -2, w: 0, h: 99 });
  assert.ok(Number.isFinite(drawn.w) && drawn.w > 0);
  assert.ok(drawn.sizing.x >= 0 && drawn.sizing.y >= 0);
});
