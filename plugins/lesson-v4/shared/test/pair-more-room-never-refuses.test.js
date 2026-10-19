'use strict';

// More room never turns a counters pair into a refusal.
//
// A before-and-after counters pair takes the biggest digits its space holds,
// and its counters were then measured at that size. The counters do not grow
// with the digits all the way: past a point the gap between the two charts,
// which widens with the digits, takes width from the columns and the counters
// shrink again. So a 6in-wide space drew Tuesday's pair at 2.8in to 3.4in
// tall, refused it at 3.5in to 3.7in, and drew it whole from 3.8in (18 October
// 2026). A designer who grew the space to clear one refusal met another, and
// could only find the sizes that work by trying them. Now the pair steps its
// digits down, never under their own floor, until its counters read.
//
// What this file pins:
//   - across the 6in x 2.8in to 4.0in sweep the pair always draws, and once
//     drawn whole it stays whole;
//   - the counters' readable floor is not lowered to get there;
//   - a refusal names the counters' size to the same precision as the floor,
//     so it never reads "0.15in across, below the 0.147in".

const test = require('node:test');
const assert = require('node:assert/strict');

const chart = require('../visuals/place-value-chart-svg');
const { profileFor } = require('../visuals/surface-profiles');

const slide = (wIn, hIn) => profileFor('slides', { widthPt: wIn * 72, heightPt: hIn * 72, overrides: { pairExchangeMarks: true } });
const hasCue = (L) => L.bars.some((b) => b.role === 'exchange-box');

// 52 as 5 tens and 2 ones, then 4 tens and 12 ones.
const tuesday = () => ({
  columns: ['T', 'O'],
  pair: {
    from: ['5', '2'], to: ['4', '12'], operation: '=', title: '',
    counters: { from: { T: 5, O: 2 }, to: { T: 4, O: 12 } },
    exchanges: [{ from: 'T', to: 'O', label: '1 ten = 10 ones' }],
  },
});

// Close-together counters must reach 9pt / (1.25 x the fill share); the chart
// works it out, and this is the same number to the hundredth of a point.
const CLOSE_FLOOR_IN = 0.147;
const heights = Array.from({ length: 13 }, (_, k) => Number((2.8 + 0.1 * k).toFixed(1)));

test('a taller space never refuses a pair a shorter one drew', () => {
  let wasWhole = false;
  heights.forEach((h) => {
    let L;
    assert.doesNotThrow(() => { L = chart.describeLayout(tuesday(), slide(6, h)); }, `6in x ${h}in`);
    const whole = hasCue(L);
    assert.ok(!wasWhole || whole, `drawn whole lower down, but without its cue box at ${h}in`);
    wasWhole = wasWhole || whole;
  });
  assert.ok(wasWhole, 'drawn whole somewhere in the sweep');
});

test('the counters still reach their close-together floor', () => {
  heights.forEach((h) => {
    const L = chart.describeLayout(tuesday(), slide(6, h));
    const counters = L.circles.filter((c) => c.role === 'counter');
    const across = Math.min(...counters.map((c) => c.r * 2)) / 72;
    assert.ok(across >= CLOSE_FLOOR_IN - 0.0005, `6in x ${h}in: smallest counter drawn ${across.toFixed(4)}in`);
  });
});

test('a refusal names the counters to the precision of the floor it misses', () => {
  let message = '';
  try {
    chart.describeLayout(tuesday(), profileFor('slides', { widthPt: 6 * 72, heightPt: 7 * 72, overrides: { pairMaxHeightPt: 2.4 * 72 } }));
  } catch (error) {
    message = error.message;
  }
  const said = /come out (\d+\.\d+)in across, below the (\d+\.\d+)in/.exec(message);
  assert.ok(said, message || 'refused');
  assert.equal(said[2], CLOSE_FLOOR_IN.toFixed(3));
  assert.equal(said[1].split('.')[1].length, 3, 'the size has three places like the floor');
  assert.ok(Number(said[1]) < Number(said[2]), message);
});
