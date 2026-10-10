'use strict';

// A size missed by a hair is drawn on a second look, and only then.
//
// The teacher's decision of 8 October 2026, after seeing three refused slides
// drawn as they stood (write-in columns 0.824in against 0.83in, counters 0.14in
// against 0.147in, table rows 0.36in against 0.38in): fine to teach from, and
// not worth a repair pass. A clear miss is still refused, paper keeps its
// floors to the line, and a slide that fits is never touched, because the
// allowance is off except while the build redraws a slide it has just refused.

const test = require('node:test');
const assert = require('node:assert/strict');
const { clearlyUnder, allowHairUnder, setHairUnderSlide, clearHairUnder, hairUnderFindings } = require('../visuals/hair-under');
const { describeLayout } = require('../visuals/place-value-chart-svg');
const { profileFor } = require('../visuals/surface-profiles');

function reset() {
  allowHairUnder(false);
  setHairUnderSlide(null);
  clearHairUnder();
}

test('with the second look off, any miss is refused, however small', () => {
  reset();
  assert.equal(clearlyUnder(0.824 * 72, 0.83 * 72, { surface: 'slides', what: 'x' }), true);
  assert.equal(clearlyUnder(0.83 * 72, 0.83 * 72, { surface: 'slides', what: 'x' }), false);
  assert.deepEqual(hairUnderFindings(), []);
});

test('on the second look the three sizes the teacher saw are drawn, each with a note', () => {
  reset();
  allowHairUnder(true);
  setHairUnderSlide(7);
  assert.equal(clearlyUnder(0.824 * 72, 0.83 * 72, { surface: 'slides', what: 'columns' }), false);
  assert.equal(clearlyUnder(0.14 * 72, 0.147 * 72, { surface: 'slides', what: 'counters' }), false);
  assert.equal(clearlyUnder(0.36, 0.38, { surface: 'slides', what: 'rows', perUnit: 1 }), false);
  const notes = hairUnderFindings();
  assert.equal(notes.length, 3);
  assert.ok(notes.every((n) => n.cue === true && n.slide === 7 && n.signal === 'DRAWN_A_HAIR_UNDER_SIZE'));
  reset();
});

test('a clear miss is refused on the second look too, and leaves no note', () => {
  reset();
  allowHairUnder(true);
  setHairUnderSlide(7);
  assert.equal(clearlyUnder(0.72 * 72, 0.83 * 72, { surface: 'slides', what: 'columns' }), true);
  assert.equal(clearlyUnder(0.6 * 72, 0.83 * 72, { surface: 'slides', what: 'columns' }), true);
  assert.deepEqual(hairUnderFindings(), []);
  reset();
});

test('paper keeps its floors to the line', () => {
  reset();
  allowHairUnder(true);
  setHairUnderSlide(7);
  for (const surface of ['worksheets', 'stickin', 'wall']) {
    assert.equal(clearlyUnder(0.824 * 72, 0.83 * 72, { surface, what: 'columns' }), true);
  }
  assert.deepEqual(hairUnderFindings(), []);
  reset();
});

test('a column calculation a hair too narrow to write in is refused first and drawn on the second look', () => {
  reset();
  const chart = { columns: ['Th', 'H', 'T', 'O'], calculation: { operator: '+', numbers: [null, null] } };
  // Find a width the strict floor refuses by a hair: step down from one that draws.
  let width = 400;
  const draws = (w) => {
    try { describeLayout(chart, profileFor('slides', { widthPt: w, heightPt: 320 })); return true; } catch (e) {
      if (/PLACE_VALUE_WRITE_IN_TOO_NARROW/.test(e.message)) return false;
      throw e;
    }
  };
  assert.equal(draws(width), true);
  while (draws(width)) width -= 1;
  setHairUnderSlide(3);
  allowHairUnder(true);
  assert.equal(draws(width), true);
  assert.equal(hairUnderFindings().length, 1);
  assert.equal(draws(width * 0.8), false);
  reset();
  assert.equal(draws(width), false);
});
