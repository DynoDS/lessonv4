'use strict';

// Six or more counters in a column go close together; fewer stay spread.
//
// Counters used to be spread whatever their number, and thirteen tens in a wide
// shallow cell stood small with most of the cell empty. The teacher (6 October
// 2026): "the counters are so spread out". Every column was then drawn close
// together at one size, and of that he said: "they look better spaced out,
// maybe only if its a certain amount they start going together". Shown five
// ways on his wall sheet and his slide, he chose this one ("E I think").
//
// What this file pins, on every surface that draws the chart:
//   - the arrangement is what it was (2, 3 or 5 to a row; ten is two fives);
//   - five in a column are spread as they always were, six are close together;
//   - a close column is one block mid-cell, as large as its cell allows;
//   - each column is sized by its own cell: a few counters are not shrunk to
//     match a busy column;
//   - the chart's own width and height do not depend on its counters;
//   - a column with the same count in both charts of a pair is the same picture;
//   - an exchange ring goes round exactly its counters and through no other.

const test = require('node:test');
const assert = require('node:assert/strict');

const chart = require('../visuals/place-value-chart-svg');
const { profileFor } = require('../visuals/surface-profiles');

const COLUMNS = ['Hundreds', 'Tens', 'Ones'];
const counters = (pops) => ({ columns: COLUMNS, rows: [{ cells: ['', '', ''], counters: pops, digits: false }] });
const pairOf = (from, to) => ({ columns: COLUMNS, pair: { from: ['', '', ''], to: ['', '', ''], title: '', operation: '', counters: { from, to } } });

const SURFACES = [
  ['slides', { widthPt: 12.2 * 72, heightPt: 3 * 72 }],
  ['worksheets', { widthMm: 170 }],
  ['wall', { widthMm: 360 }],
  ['stickin', { widthMm: 120 }],
];
// The busiest tens column each surface is asked to draw here. A sheet's column
// stops widening at about an inch, and five to a row in it were always refused
// as too small to count, so paper is asked for eight.
const BUSY = { slides: 13, wall: 13, worksheets: 8, stickin: 8 };
const layout = (spec, surface, box) => chart.describeLayout(spec, profileFor(surface, box));
const inColumn = (laid, column) => laid.circles.filter((c) => c.role === 'counter' && c.column === column);
const bandOf = (laid, column) => laid.cells.find((c) => c.role === 'band' && c.column === column);
const rowsOf = (discs) => {
  const rows = new Map();
  discs.forEach((c) => {
    const key = c.cy.toFixed(2);
    rows.set(key, (rows.get(key) || []).concat(c));
  });
  return [...rows.values()].map((row) => row.sort((a, b) => a.cx - b.cx));
};

// Where counters stood before any of this: the middle of equal shares of the
// cell, 0.68 of the smaller share across, never wider than a digit is tall.
function spreadAsBefore(laid, column, count, perRow) {
  const cell = bandOf(laid, column);
  const pad = Math.min(0.08 * 72, cell.w * 0.08, cell.h * 0.08);
  const stepW = (cell.w - 2 * pad) / perRow;
  const stepH = (cell.h - 2 * pad) / Math.ceil(count / perRow);
  return { stepW, stepH, d: Math.min(Math.min(stepW, stepH) * 0.68, laid.D) };
}

test('the arrangement is the house one: two, three or five to a row, ten as two fives', () => {
  for (const [surface, box] of SURFACES) {
    const laid = layout(counters({ H: 4, T: BUSY[surface], O: 9 }), surface, box);
    assert.deepEqual(rowsOf(inColumn(laid, 'H')).map((r) => r.length), [2, 2], surface);
    assert.deepEqual(rowsOf(inColumn(laid, 'T')).map((r) => r.length), BUSY[surface] === 13 ? [5, 5, 3] : [3, 3, 2], surface);
    assert.deepEqual(rowsOf(inColumn(laid, 'O')).map((r) => r.length), [3, 3, 3], surface);
    if (BUSY[surface] === 13) assert.deepEqual(rowsOf(inColumn(layout(counters({ T: 10 }), surface, box), 'T')).map((r) => r.length), [5, 5], surface);
  }
});

test('five in a column are spread as they always were; six go close together', () => {
  for (const [surface, box] of SURFACES) {
    const five = layout(counters({ H: 5, T: 5, O: 5 }), surface, box);
    const rowsFive = rowsOf(inColumn(five, 'T'));
    const was = spreadAsBefore(five, 'T', 5, 3);
    assert.ok(Math.abs(rowsFive[0][0].r * 2 - was.d) < 0.01, `${surface}: five are the size they had`);
    assert.ok(Math.abs(rowsFive[0][1].cx - rowsFive[0][0].cx - was.stepW) < 0.01, `${surface}: five stand a share of the cell apart`);
    assert.ok(Math.abs(rowsFive[1][0].cy - rowsFive[0][0].cy - was.stepH) < 0.01, `${surface}: and a share of it down`);

    const six = layout(counters({ H: 6, T: 6, O: 6 }), surface, box);
    const rowsSix = rowsOf(inColumn(six, 'T'));
    const d = rowsSix[0][0].r * 2;
    assert.ok(Math.abs(rowsSix[0][1].cx - rowsSix[0][0].cx - 1.25 * d) < 0.01, `${surface}: six are a counter and a quarter apart across`);
    assert.ok(Math.abs(rowsSix[1][0].cy - rowsSix[0][0].cy - 1.25 * d) < 0.01, `${surface}: and down`);
  }
});

test('a close column is one block in the middle of its cell, as large as the cell allows', () => {
  for (const [surface, box] of SURFACES) {
    const laid = layout(counters({ H: 3, T: BUSY[surface], O: 6 }), surface, box);
    for (const column of ['T', 'O']) {
      const cell = bandOf(laid, column);
      const discs = inColumn(laid, column);
      const first = rowsOf(discs)[0];
      assert.ok(Math.abs((first[0].cx + first[first.length - 1].cx) / 2 - (cell.x + cell.w / 2)) < 0.01, `${surface} ${column}: centred across`);
      const top = Math.min(...discs.map((c) => c.cy - c.r));
      const bottom = Math.max(...discs.map((c) => c.cy + c.r));
      assert.ok(Math.abs((top + bottom) / 2 - (cell.y + cell.h / 2)) < 0.01, `${surface} ${column}: centred down`);
      const wide = Math.max(...discs.map((c) => c.cx + c.r)) - Math.min(...discs.map((c) => c.cx - c.r));
      assert.ok(wide / cell.w > 0.7 || (bottom - top) / cell.h > 0.7, `${surface} ${column}: it fills its cell one way or the other`);
    }
  }
});

test('each column is sized by its own cell: a few counters are not shrunk to match a busy column', () => {
  for (const [surface, box] of SURFACES) {
    const laid = layout(counters({ H: 3, T: BUSY[surface], O: 6 }), surface, box);
    const was = spreadAsBefore(laid, 'H', 3, 2);
    assert.ok(Math.abs(inColumn(laid, 'H')[0].r * 2 - was.d) < 0.01, `${surface}: three hundreds are the size they always were`);
    const alone = layout(counters({ H: 3 }), surface, box);
    assert.equal(inColumn(alone, 'H')[0].r, inColumn(laid, 'H')[0].r, `${surface}: whatever stands in the other columns`);
  }
});

test('on a full-width slide chart thirteen tens are over 8mm across, where they were 7.1mm', () => {
  const laid = layout({ columns: COLUMNS, rows: [{ cells: ['3', '13', '6'], counters: { H: 3, T: 13, O: 6 } }] }, 'slides', { widthPt: 12.2 * 72, heightPt: 2.5 * 72 });
  const mm = inColumn(laid, 'T')[0].r * 2 / 72 * 25.4;
  assert.ok(mm > 8 && mm < 8.6, `they are ${mm.toFixed(1)}mm`);
});

test('a column with the same count in both charts of a pair is the same picture in each', () => {
  for (const [surface, box] of SURFACES) {
    let laid;
    try {
      laid = layout(pairOf({ H: 3, T: 13, O: 6 }, { H: 4, T: 3, O: 6 }), surface, surface === 'slides' ? { widthPt: 12.2 * 72, heightPt: 5.9 * 72 } : box);
    } catch {
      continue; // a surface too small for this pair refuses it, as before
    }
    const cells = laid.cells.filter((c) => c.role === 'band' && c.column === 'O').sort((a, b) => a.x - b.x);
    const ones = inColumn(laid, 'O');
    const within = (cell) => ones.filter((c) => c.cx > cell.x && c.cx < cell.x + cell.w).map((c) => [(c.cx - cell.x).toFixed(2), (c.cy - cell.y).toFixed(2), c.r.toFixed(2)].join(' ')).sort();
    assert.equal(cells.length, 2);
    assert.deepEqual(within(cells[0]), within(cells[1]), `${surface}: six ones before are six ones after`);
  }
});

test('a chart is the size it was whatever its counters are', () => {
  for (const [surface, box] of SURFACES) {
    const few = layout(counters({ H: 1, T: 1, O: 1 }), surface, box);
    const many = layout(counters({ H: 9, T: BUSY[surface], O: 8 }), surface, box);
    assert.equal(few.w, many.w, `${surface}: width`);
    assert.equal(few.h, many.h, `${surface}: height`);
    assert.equal(few.D, many.D, `${surface}: digit size`);
  }
});

// ─── a close column has its own floor ───────────────────────────
//
// Closing counters up makes them bigger in the same cell, so the 3.2mm floor,
// measured on spread counters, let through the slide it was written to stop:
// two four-column charts side by side, six counters 3.4mm across. Shown it
// (6 October 2026) he said: "you're right, they're too cramped".

const TWO_ON_A_SLIDE = { columns: ['Thousands', 'Hundreds', 'Tens', 'Ones'], rows: [{ label: 'A', cells: ['', '', '', ''], counters: { Thousands: 6, Hundreds: 2, Tens: 4, Ones: 1 } }] };
const halfOfASplit = (widthIn) => ({ widthPt: (widthIn - 0.2) * 72, heightPt: 4.36 * 72 });

test('two four-column counter charts on one slide are refused, and told what to do', () => {
  assert.throws(
    () => layout(TWO_ON_A_SLIDE, 'slides', halfOfASplit(3.52)),
    (error) => {
      assert.match(error.message, /^PLACE_VALUE_COUNTERS_TOO_SMALL/);
      assert.match(error.message, /below the 0\.147in a child can count from the carpet when they stand close together/);
      assert.match(error.message, /give the chart more WIDTH/);
      assert.match(error.message, /one chart on this slide instead of two/);
      return true;
    }
  );
});

test('the same chart with a slide to itself draws', () => {
  const laid = layout(TWO_ON_A_SLIDE, 'slides', halfOfASplit(7.2));
  assert.ok(inColumn(laid, 'Th')[0].r * 2 / 72 * 25.4 > 7);
});

test('a close column is refused exactly where the same counters spread were refused', () => {
  // Spread, six counters were 0.68 of a third of the cell and refused under
  // 9pt. Close together they are 0.8 of it, so the line is the same cell width.
  let narrowestDrawn = null; let widestRefused = null;
  for (let width = 2.6; width <= 5; width += 0.01) {
    let laid = null;
    try {
      laid = layout(TWO_ON_A_SLIDE, 'slides', halfOfASplit(width));
    } catch (error) {
      assert.match(error.message, /PLACE_VALUE_COUNTERS_TOO_SMALL/);
      widestRefused = width;
      continue;
    }
    if (narrowestDrawn === null) {
      narrowestDrawn = width;
      const cell = bandOf(laid, 'Th');
      const pad = Math.min(0.08 * 72, cell.w * 0.08, cell.h * 0.08);
      const spread = Math.min((cell.w - 2 * pad) / 3, (cell.h - 2 * pad) / 2) * 0.68;
      assert.ok(spread >= 9 && spread < 9.1, `the first chart to draw is the first whose spread counters would reach 9pt (${spread.toFixed(2)}pt)`);
      assert.ok(inColumn(laid, 'Th')[0].r * 2 / 72 * 25.4 >= 3.73, 'and its close counters are 3.7mm or more');
    }
  }
  assert.ok(widestRefused < narrowestDrawn, 'refused below one width and drawn above it');
});

test('a spread column keeps the 3.2mm floor', () => {
  // Five in a column are spread. Narrow the chart until they are refused.
  const five = { columns: ['Thousands', 'Hundreds', 'Tens', 'Ones'], rows: [{ label: 'A', cells: ['', '', '', ''], counters: { Thousands: 5, Hundreds: 2, Tens: 4, Ones: 1 } }] };
  let last = null;
  for (let width = 5; width >= 2.2; width -= 0.01) {
    try {
      last = layout(five, 'slides', halfOfASplit(width));
    } catch (error) {
      assert.match(error.message, /below the 0\.125in a child can count from the carpet,/);
      break;
    }
  }
  const mm = inColumn(last, 'Th')[0].r * 2 / 72 * 25.4;
  assert.ok(mm >= 3.17 && mm < 3.3, `the last one drawn has counters ${mm.toFixed(2)}mm across`);
});

// ─── the exchange rings ────────────────────────────────────────────

const MARKED = { widthMm: 360, overrides: { pairArrow: 'narrow', pairExchangeMarks: true, pairMaxHeightPt: (165 * 72) / 25.4 } };
const BOARD = { widthPt: 12.2 * 72, heightPt: 5.9 * 72, overrides: { pairExchangeMarks: true } };

function ringAndCounters(laid, role) {
  const ring = laid.rings.find((r) => r.role === role);
  const discs = laid.circles.filter((c) => c.role === 'counter');
  const inside = discs.filter((c) => c.cx > ring.x && c.cx < ring.x + ring.w && c.cy > ring.y && c.cy < ring.y + ring.h);
  // A counter the ring's own line runs through: it straddles an edge of the box.
  const half = ring.sw / 2;
  const cut = discs.filter((c) => {
    const outsideLeft = c.cx + c.r < ring.x - half; const outsideRight = c.cx - c.r > ring.x + ring.w + half;
    const outsideTop = c.cy + c.r < ring.y - half; const outsideBottom = c.cy - c.r > ring.y + ring.h + half;
    const clearOutside = outsideLeft || outsideRight || outsideTop || outsideBottom;
    const clearInside = c.cx - c.r >= ring.x + half && c.cx + c.r <= ring.x + ring.w - half && c.cy - c.r >= ring.y + half && c.cy + c.r <= ring.y + ring.h - half;
    return !clearOutside && !clearInside;
  });
  return { ring, inside, cut };
}

// Ten tens for a hundred; ten ones for a ten, where the new ten joins two,
// five, seven and nine others (spread and close columns both); and the same
// exchanges run backwards for subtraction.
const EXCHANGES = [
  [{ H: 3, T: 13, O: 6 }, { H: 4, T: 3, O: 6 }],
  [{ H: 3, T: 2, O: 12 }, { H: 3, T: 3, O: 2 }],
  [{ H: 3, T: 5, O: 12 }, { H: 3, T: 6, O: 2 }],
  [{ H: 3, T: 7, O: 12 }, { H: 3, T: 8, O: 2 }],
  [{ H: 3, T: 9, O: 15 }, { H: 3, T: 10, O: 5 }],
  [{ H: 9, T: 12, O: 0 }, { H: 10, T: 2, O: 0 }],
  [{ H: 3, T: 5, O: 2 }, { H: 3, T: 4, O: 12 }],
  [{ H: 4, T: 1, O: 6 }, { H: 3, T: 11, O: 6 }],
  [{ H: 3, T: 8, O: 0 }, { H: 3, T: 7, O: 10 }],
];

test('each ring holds exactly its counters and its line touches no other', () => {
  for (const [surface, box] of [['wall', MARKED], ['slides', BOARD]]) {
    for (const [from, to] of EXCHANGES) {
      const what = `${surface} ${JSON.stringify(from)} to ${JSON.stringify(to)}`;
      const laid = layout(pairOf(from, to), surface, box);
      const group = ringAndCounters(laid, 'exchange-group');
      assert.equal(group.inside.length, 10, `${what}: ten in the ring`);
      assert.equal(group.cut.length, 0, `${what}: the ring's line runs through ${group.cut.length} counter(s)`);
      const one = ringAndCounters(laid, 'exchange-one');
      assert.equal(one.inside.length, 1, `${what}: one in the other ring`);
      assert.equal(one.cut.length, 0, `${what}: that ring's line runs through ${one.cut.length} counter(s)`);
    }
  }
});

test('the ten that are ringed are always a close column', () => {
  for (const [from, to] of EXCHANGES) {
    const laid = layout(pairOf(from, to), 'wall', MARKED);
    const ring = laid.rings.find((r) => r.role === 'exchange-group');
    const ten = laid.circles.filter((c) => c.role === 'counter' && c.cx > ring.x && c.cx < ring.x + ring.w && c.cy > ring.y && c.cy < ring.y + ring.h);
    const rows = rowsOf(ten);
    assert.deepEqual(rows.map((r) => r.length), [5, 5], 'two rows of five');
    assert.ok(Math.abs(rows[0][1].cx - rows[0][0].cx - 1.25 * 2 * rows[0][0].r) < 0.01, 'a counter and a quarter apart');
  }
});

test('counters that carry their value are sized by their words, as they were', () => {
  const spec = { columns: ['O', '.', 't', 'h'], rows: [{ cells: ['2', '.', '3', '4'], counters: { O: 2, t: 3, h: 4 }, counterLabels: true }] };
  const laid = chart.describeLayout(spec, profileFor('worksheets', { widthMm: 170 }));
  const discs = laid.circles.filter((c) => c.role === 'counter');
  assert.ok(discs.every((c) => c.face !== ''), 'each counter carries its value');
  const hundredths = discs.filter((c) => c.column === 'h').sort((a, b) => a.cy - b.cy || a.cx - b.cx);
  assert.ok(hundredths[1].cx - hundredths[0].cx > 1.3 * 2 * hundredths[0].r, 'and stands in its own share of the cell, not packed');
});
