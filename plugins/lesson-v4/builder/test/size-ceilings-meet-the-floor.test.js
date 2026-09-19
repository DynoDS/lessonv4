'use strict';
// No ceiling may sit below the floor, with one recorded exception.
//
// A ceiling under MIN_FONT_PT is incoherent: it caps its text below the smallest
// size the deck says may reach a classroom, so that text can only ever be
// illegible. Eight ceilings were under the floor on 19 September 2026. Seven were
// unread and were raised, so none can be wired up later and reintroduce the fault
// quietly. This test holds them there.
//
// `instruction` is the exception and is expected to fail this rule until the
// upstream fault is fixed. It is the one the builder reads, and raising it was
// tried and backed out the same day: the band holds about 37 characters at 18pt,
// and 681 of 2,250 header instructions across 19 built lessons are longer than
// that, so a third of decks would carry a TEXT_OVERLOAD about header furniture.
// The repair is what gets written into the field, not the number here. When a
// header instruction is reliably a short cue, delete this exception and the test
// will hold the whole table.
const test = require('node:test');
const assert = require('node:assert/strict');
const { SIZE_CEILINGS, MIN_FONT_PT } = require('../src/styles');

const KNOWN_BELOW_FLOOR = ['instruction'];

test('every size ceiling is at or above the readable floor', () => {
  const under = Object.entries(SIZE_CEILINGS)
    .filter(([name, pt]) => pt < MIN_FONT_PT && !KNOWN_BELOW_FLOOR.includes(name));
  assert.deepEqual(
    under.map(([name]) => name),
    [],
    `these ceilings cap their text below the ${MIN_FONT_PT}pt floor: ` +
      under.map(([name, pt]) => `${name} ${pt}pt`).join(', ')
  );
});

test('the exception is still a real one, not a stale entry', () => {
  // If someone fixes the upstream fault and raises the ceiling, this fails and
  // tells them to delete the exception rather than leave it excusing nothing.
  KNOWN_BELOW_FLOOR.forEach((name) => {
    assert.ok(
      SIZE_CEILINGS[name] < MIN_FONT_PT,
      `${name} now meets the floor: remove it from KNOWN_BELOW_FLOOR`
    );
  });
});
