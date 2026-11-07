'use strict';

// The draw-lines-to-match piece (5 November 2026). A lesson design can hold a
// `match` task, and the board drew it, but the stick-in pack could not print
// one, so a teacher who printed got no sheet for it. The piece copies the
// design's `left`, `right` and `togetherPair`: a dot on each facing edge, the
// pair done with the class joined in the worked-example purple (ink on the
// pack), and never an answer line.

const assert = require('node:assert/strict');
const test = require('node:test');

const { tightSvg, normalise } = require('../visuals/match-svg');
const { profileFor } = require('../visuals/surface-profiles');

const left = (n) => Array.from({ length: n }, (_, i) => ({ id: `left-00${i + 1}`, label: `Thing ${i + 1}` }));
const right = (n) => Array.from({ length: n }, (_, i) => ({ id: `right-00${i + 1}`, label: `Kind ${i + 1}` }));
const circles = (svg) => [...svg.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)"/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]) }));

test('every box carries one dot on its facing edge, and the columns may differ in count', () => {
  const { svg } = tightSvg({ left: left(5), right: right(2), togetherPair: null });
  const dots = circles(svg);
  assert.equal(dots.length, 7);
  const xs = [...new Set(dots.map((d) => d.x))];
  assert.equal(xs.length, 2, 'one dot line for each column');
  assert.ok(Math.max(...xs) - Math.min(...xs) >= 300, 'a corridor wide enough to draw across');
  assert.ok(svg.includes('>Thing 5<') && svg.includes('>Kind 2<'));
});

test('the shorter column is spread down the whole piece, not bunched at the top', () => {
  const { svg, h } = tightSvg({ left: left(6), right: right(2) });
  const rightDots = circles(svg).filter((d, _, all) => d.x === Math.max(...all.map((a) => a.x)));
  assert.equal(rightDots.length, 2);
  assert.ok(rightDots[1].y > h * 0.6, 'the second right box sits in the lower half');
});

test('only the together pair is joined, in purple on the board and ink on the pack', () => {
  const spec = {
    left: left(3), right: right(2),
    togetherPair: { leftRef: 'left-002', rightRef: 'right-001' },
    pairs: [{ leftRef: 'left-001', rightRef: 'right-002' }],
    connections: [[0, 1]],
  };
  const board = tightSvg(spec).svg;
  assert.equal((board.match(/<line /g) || []).length, 1, 'answer pairs never print');
  assert.ok(/<line class="match-together"[^>]*stroke="#7030A0"/.test(board));
  const pack = tightSvg(spec, profileFor('stickin', { widthMm: 150 })).svg;
  assert.ok(/<line class="match-together"[^>]*stroke="#1A1A1A"/.test(pack));
  assert.equal((tightSvg({ left: left(3), right: right(2) }).svg.match(/<line /g) || []).length, 0);
});

test('a box is a target a child can aim at, even with eight a side', () => {
  const { svg, w } = tightSvg({ left: left(8), right: right(8) });
  const mmPerUnit = 150 / w;
  const ys = circles(svg).filter((d, _, all) => d.x === Math.min(...all.map((a) => a.x))).map((d) => d.y);
  const gapMm = (ys[1] - ys[0]) * mmPerUnit;
  assert.ok(gapMm >= 16, `dots ${gapMm.toFixed(1)}mm apart at 150mm`);
});

test('a match that is not a question is refused by name', () => {
  assert.throws(() => normalise({ left: left(1), right: right(2) }), /2 to 8 left/);
  assert.throws(() => normalise({ left: left(2), right: right(9) }), /2 to 8 right/);
  assert.throws(() => normalise({ left: [{ id: 'left-001', label: ' ' }, ...left(1)], right: right(2) }), /no label/);
  assert.throws(() => normalise({ left: left(2), right: right(2), togetherPair: { leftRef: 'left-009', rightRef: 'right-001' } }), /togetherPair/);
  assert.ok(normalise({ left: ['Sun', 'Rain'], right: ['Hot', 'Wet'] }).left[1].id === 'left-002', 'a bare label is taken as given');
});
