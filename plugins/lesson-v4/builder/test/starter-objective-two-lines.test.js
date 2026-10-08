'use strict';

// A learning objective too long for one line takes two, at 28pt.
//
// The objective had one line across the starter and was shrunk until it fitted
// it. "To subtract two 4-digit numbers using column subtraction with more than
// one exchange" printed at 20pt under a 33pt "Date", the smallest words on the
// slide (Year 4 column subtraction, stress test of 7 October 2026). Shown that
// slide with the objective on two lines at 28pt, the teacher chose it and
// accepted the sums underneath coming out slightly smaller (8 October 2026).
//
// What this file pins:
//   - a long objective makes the starter's header taller, and a short one
//     leaves the slide laid out exactly as it was;
//   - the lesson's objective reaches a starter slide that did not repeat it, so
//     the header is measured with the words it prints;
//   - a slide that names its own objective keeps it.

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  bodyZone, starterHeaderHeight, starterLoNeedsTwoLines, carryObjectiveToStarters,
  HEADER_STARTER_H, STARTER_PROMPT_H, STARTER_LO_TWO_LINE,
} = require('../src/layout');

const LONG = 'To subtract two 4-digit numbers using column subtraction with more than one exchange';
const SHORT = 'To round to the nearest 10';

test('a long objective takes two lines and a short one does not', () => {
  assert.equal(starterLoNeedsTwoLines({ headerStyle: 'starter', lo: LONG }), true);
  assert.equal(starterLoNeedsTwoLines({ headerStyle: 'starter', lo: SHORT }), false);
  assert.equal(starterLoNeedsTwoLines({ headerStyle: 'starter' }), false);
});

test('a starter with a short objective is laid out exactly as before', () => {
  assert.equal(starterHeaderHeight({ lo: SHORT }), HEADER_STARTER_H);
  assert.equal(starterHeaderHeight({ lo: SHORT, heading: 'What is 3 x 4?' }), HEADER_STARTER_H + STARTER_PROMPT_H);
  assert.deepEqual(bodyZone('starter', { lo: SHORT }), bodyZone('starter', {}));
});

test('a long objective moves the body down by the room its second line takes, and no more', () => {
  const before = bodyZone('starter', { lo: SHORT });
  const after = bodyZone('starter', { lo: LONG });
  assert.ok(Math.abs((after.y - before.y) - STARTER_LO_TWO_LINE.shift) < 1e-9);
  assert.ok(Math.abs((after.y + after.h) - (before.y + before.h)) < 1e-9, 'the body no longer ends where it did');
  assert.ok(STARTER_LO_TWO_LINE.shift <= 0.25, 'the second line costs the starter more than a quarter of an inch');
});

test('the lesson objective reaches a starter that did not repeat it, and a slide that names its own keeps it', () => {
  const lesson = {
    lo: LONG,
    slides: [
      { headerStyle: 'starter', title: 'Starter' },
      { headerStyle: 'starter', title: 'Starter', lo: SHORT },
      { headerStyle: 'title', title: 'My Turn' },
    ],
  };
  carryObjectiveToStarters(lesson);
  assert.equal(lesson.slides[0].lo, LONG);
  assert.equal(lesson.slides[1].lo, SHORT);
  assert.equal('lo' in lesson.slides[2], false, 'a slide that prints no objective was handed one');
});

test('a lesson with no objective is left alone', () => {
  const lesson = { slides: [{ headerStyle: 'starter', title: 'Starter' }] };
  carryObjectiveToStarters(lesson);
  assert.equal('lo' in lesson.slides[0], false);
});
