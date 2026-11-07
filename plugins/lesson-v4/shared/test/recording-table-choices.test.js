'use strict';

// The stick-in piece copies the board's table field for field, so a circle-one
// cell (`{ choices, circled }`) prints its choices for the child to circle,
// keeps the ring only on the row done with the class, and drops the ring of a
// revealed `||` answer as any other answer cell is blanked (5 November 2026).

const assert = require('node:assert/strict');
const test = require('node:test');

const { tightSvg } = require('../visuals/recording-table-svg');

const CHOICES = ['same', 'different'];

test('every row prints its choices and only the together row keeps its ring', () => {
  const { svg } = tightSvg({
    headers: ['What they need', 'The Tikuna', 'Same or different?'],
    rows: [
      ['water', 'From the river.', { choices: CHOICES, circled: 'different' }],
      ['food', 'Lots of fish.', { choices: CHOICES, circled: null }],
      ['medicine', 'Forest plants.', { choices: CHOICES, circled: '||same' }],
    ],
  });
  assert.equal((svg.match(/>same</g) || []).length, 3);
  assert.equal((svg.match(/>different</g) || []).length, 3);
  assert.equal((svg.match(/<ellipse /g) || []).length, 1, 'one ring, the row done together');
  assert.ok(!svg.includes('[object Object]'));
});
