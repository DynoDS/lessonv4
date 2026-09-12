'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { validateLesson } = require('../src/validate');

// The starter header prints the word "Date" as a blank for the class to write
// beside. A deck is built days before it is taught and again the year after, so
// a designer who fills that blank in the spec puts the wrong day on the board.
// A Year 4 rounding deck built on a Saturday opened with "Saturday 12 September
// 2026" in the instruction box, directly under the header's own empty Date
// label, and five earlier decks carried the same thing (Daniel, 12 Sept 2026).
//
// Only the day the build runs is refused, so a date that is the lesson's own
// content can never be caught by this: a historical date does not match today.

function deck(extra, slide) {
  return Object.assign({
    lessonName: 'Round to the nearest 10 and 100',
    slides: [Object.assign({
      template: 'body-full',
      headerStyle: 'starter',
      title: 'Order four-digit numbers',
      lo: 'To round to the nearest 10 and 100',
      body: { type: 'text', value: 'Put these numbers in ascending order.' },
    }, slide)],
  }, extra);
}

function dateProblems(lesson) {
  return validateLesson(lesson, '.').errors.filter((e) => /today's date/.test(e));
}

function ukDate(d) {
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

test('the build date in the starter instruction is refused', () => {
  const found = dateProblems(deck({}, { instruction: ukDate(new Date()) }));
  assert.equal(found.length, 1);
  assert.match(found[0], /starter header already prints/);
});

test('the build date as a top-level field is refused, though the builder never reads it', () => {
  assert.equal(dateProblems(deck({ date: ukDate(new Date()) })).length, 1);
});

test('the build date is refused wherever it sits, not only on the starter', () => {
  const today = new Date();
  const numeric = `${String(today.getDate()).padStart(2, '0')}/` +
    `${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  assert.equal(dateProblems(deck({}, { body: { type: 'text', value: numeric } })).length, 1);
});

test('a deck with no date passes', () => {
  assert.equal(dateProblems(deck({})).length, 0);
});

test("a date that is the lesson's own content passes", () => {
  const lesson = deck({}, {
    title: 'The Great Fire started on Sunday 2 September 1666',
    body: { type: 'text', value: 'The photograph was taken on 12 September 1940.' },
  });
  assert.equal(dateProblems(lesson).length, 0);
});

test('the same day in another year passes', () => {
  const lastYear = new Date();
  lastYear.setFullYear(lastYear.getFullYear() - 1);
  assert.equal(dateProblems(deck({}, { instruction: ukDate(lastYear) })).length, 0);
});
