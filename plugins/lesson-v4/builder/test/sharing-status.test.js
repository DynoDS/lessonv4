'use strict';

// One drawing per picture, on every surface (13 September 2026). The guard in
// check-parity.js reads each surface's code; this pins that it can tell a shared
// picture from one a surface draws itself, so a backlog that only shrinks is a
// real measurement and not a list anyone could edit to pass.

const assert = require('node:assert/strict');
const test = require('node:test');

const { sharingStatus, backlogFrom } = require('../scripts/sharing-status');
const { SHARING_BACKLOG } = require('../../shared/visual-parity');

test('the number line is drawn from its one shared drawing on all four surfaces', () => {
  assert.deepEqual(sharingStatus().numberline, { slides: 'shared', worksheets: 'shared', wall: 'shared', stickin: 'shared' });
});

test('a surface that still draws a picture itself is seen as its own drawing', () => {
  // The clock is drawn by the board, the sheet and the wall separately, and the
  // pack cannot draw one; until it is moved, that is exactly what is reported.
  const clock = sharingStatus().clock;
  if (!SHARING_BACKLOG.clock) return; // moved onto a shared drawing: nothing left to pin
  assert.deepEqual(clock, SHARING_BACKLOG.clock);
});

test('the recorded backlog is what the code says, in both directions', () => {
  assert.deepEqual(backlogFrom(sharingStatus()), SHARING_BACKLOG);
});
