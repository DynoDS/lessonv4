'use strict';

// The one ten frame every surface places (shared/visuals/ten-frame-svg.js).
// These hold what the drawing must guarantee on every surface; each surface's
// own tests hold how it places it.

const test = require('node:test');
const assert = require('node:assert/strict');
const tenFrame = require('../visuals/ten-frame-svg');
const { profileFor, PROFILES } = require('../visuals/surface-profiles');

const BOARD = profileFor('slides', { widthPt: 6 * 72, heightPt: 3 * 72 });
const SHEET = profileFor('worksheets', { widthMm: 170 });
const PIECE = profileFor('stickin', { widthMm: 80 });
const BOXES = {
  slides: { widthPt: 6 * 72, heightPt: 3 * 72 },
  worksheets: { widthMm: 170 },
  wall: { widthMm: 180 },
  stickin: { widthMm: 80 },
};
const states = (layout) => layout.frameList.flatMap((f) => f.cells.map((c) => c.state));
const frameBoxes = (layout) => layout.frameList.map((f) => [f.x, f.y, f.w, f.h].map((v) => Math.round(v * 100) / 100));
const colours = (svg) => [...svg.matchAll(/(?:fill|stroke)="(#[0-9A-Fa-f]{6})"/g)].map((m) => m[1].toUpperCase());

test('a frame is two rows of five square boxes, filled along the top row first from the left', () => {
  const { layout } = tenFrame.tightSvg({ count: 7 }, SHEET);
  const cells = layout.frameList[0].cells;
  assert.equal(cells.length, 10);
  cells.forEach((c) => assert.ok(Math.abs(c.w - c.h) < 1e-9 && Math.abs(c.w - cells[0].w) < 1e-9, 'every box is the same square'));
  assert.deepEqual(cells.slice(0, 5).map((c) => c.y), Array(5).fill(cells[0].y), 'the first five boxes are one row');
  assert.ok(cells[5].y > cells[0].y && cells[5].x === cells[0].x, 'the sixth box starts the bottom row at the left');
  assert.deepEqual(states(layout), [...Array(7).fill('counters'), ...Array(3).fill('empty')]);
});

test('a number bond is two colours, the second carrying on from where the first stopped', () => {
  const out = tenFrame.tightSvg({ count: 6, second: 4 }, SHEET);
  assert.deepEqual(states(out.layout), [...Array(6).fill('counters'), ...Array(4).fill('second')]);
  const counters = [...out.svg.matchAll(/<circle[^>]*fill="(#[0-9A-F]{6})"/g)].map((m) => m[1]);
  assert.equal(counters.length, 10);
  assert.equal(new Set(counters.slice(0, 6)).size, 1);
  assert.equal(new Set(counters.slice(6)).size, 1);
  assert.notEqual(counters[0], counters[9], 'the two parts of the bond are two colours');
});

test('the frame is the same size in the same place whatever it holds, so an answers slide moves nothing', () => {
  for (const profile of [BOARD, SHEET, PIECE]) {
    const question = tenFrame.tightSvg({ count: 6 }, profile);
    for (const answer of [{ count: 6, second: 4 }, {}, { count: 10 }, { count: 6, second: 4, look: 'boxes' }, { count: 9, crossedOut: 3 }, { count: 6, highlight: 'empty' }]) {
      const out = tenFrame.tightSvg(answer, profile);
      assert.deepEqual([out.w, out.h], [question.w, question.h], JSON.stringify(answer));
      assert.deepEqual(frameBoxes(out.layout), frameBoxes(question.layout), JSON.stringify(answer));
    }
  }
  // A pair stated on the question keeps its place when the answer fills the second frame.
  const before = tenFrame.tightSvg({ count: 8, frames: 2 }, BOARD);
  const after = tenFrame.tightSvg({ count: 8, second: 5, frames: 2 }, BOARD);
  assert.deepEqual(frameBoxes(after.layout), frameBoxes(before.layout));
});

test('a number past ten fills the first frame and carries on in the second', () => {
  const { layout } = tenFrame.tightSvg({ count: 13 }, BOARD);
  assert.equal(layout.frameList.length, 2);
  assert.equal(layout.frameList[0].cells.filter((c) => c.state === 'counters').length, 10);
  assert.equal(layout.frameList[1].cells.filter((c) => c.state === 'counters').length, 3);
  // Adding by making ten: 8 and 5, two of the five finishing the first frame.
  const made = tenFrame.tightSvg({ count: 8, second: 5 }, BOARD).layout;
  assert.deepEqual(made.frameList[0].cells.map((c) => c.state), [...Array(8).fill('counters'), 'second', 'second']);
  assert.equal(made.frameList[1].cells.filter((c) => c.state === 'second').length, 3);
});

test('a pair sits side by side where there is room and one above the other where there is not', () => {
  const wide = tenFrame.tightSvg({ count: 14 }, profileFor('worksheets', { widthMm: 170 })).layout;
  const narrow = tenFrame.tightSvg({ count: 14 }, profileFor('worksheets', { widthMm: 80 })).layout;
  assert.equal(wide.arrangement, 'side by side');
  assert.equal(narrow.arrangement, 'stacked');
  assert.ok(narrow.cell >= wide.cell - 1e-6, 'stacking never makes the boxes smaller');
  for (const layout of [wide, narrow]) {
    const [a, b] = layout.frameList;
    const apart = layout.arrangement === 'stacked' ? b.y - (a.y + a.h) : b.x - (a.x + a.w);
    assert.ok(apart > 0.3 * layout.cell, 'the two frames stand apart, so they read as two tens and not one twenty');
  }
});

test('every drawing fits the box it is given on every surface, and nothing is drawn outside it', () => {
  const specs = [{}, { count: 7 }, { count: 6, second: 4 }, { count: 13 }, { count: 20, look: 'boxes' }, { count: 8, second: 5, crossedOut: 5, highlight: 'second' }];
  for (const spec of specs) {
    for (const [surface, box] of Object.entries(BOXES)) {
      const profile = profileFor(surface, box);
      const out = tenFrame.tightSvg(spec, profile);
      assert.ok(out.w <= profile.widthPt + 0.5, `${JSON.stringify(spec)} on ${surface} is wider than its box`);
      if (profile.heightPt) assert.ok(out.h <= profile.heightPt + 0.5, `${JSON.stringify(spec)} on ${surface} is taller than its zone`);
      out.layout.frameList.forEach((f) => {
        const half = out.layout.strokes.outline / 2;
        assert.ok(f.x - half >= -0.01 && f.y - half >= -0.01 && f.x + f.w + half <= out.w + 0.01 && f.y + f.h + half <= out.h + 0.01, 'the outline is inside the picture');
      });
      const reach = [...out.svg.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"[^>]*stroke-width="([\d.]+)"/g)].map((m) => m.slice(1).map(Number));
      reach.forEach(([cx, cy, r, sw]) => {
        assert.ok(cx - r - sw / 2 >= 0 && cy - r - sw / 2 >= 0 && cx + r + sw / 2 <= out.w && cy + r + sw / 2 <= out.h, 'a counter or its ring runs off the picture');
      });
    }
  }
});

test('the same spec draws the same marks on every surface, only sized for where it is read', () => {
  for (const spec of [{ count: 6, second: 4 }, { count: 13 }, { count: 9, crossedOut: 3, look: 'boxes' }]) {
    const marks = Object.keys(PROFILES).map((s) => (tenFrame.tightSvg(spec, profileFor(s, BOXES[s])).svg.match(/<(rect|line|circle)\b/g) || []).length);
    assert.equal(new Set(marks).size, 1, `${JSON.stringify(spec)}: ${marks.join(', ')}`);
  }
});

test('the board, the sheet and the wall give a bond the same two colours', () => {
  const spec = { count: 6, second: 4 };
  const used = ['slides', 'worksheets', 'wall'].map((s) => [...new Set(colours(tenFrame.tightSvg(spec, profileFor(s, BOXES[s])).svg))].sort().join(' '));
  assert.equal(new Set(used).size, 1, used.join(' | '));
  const chosen = colours(tenFrame.tightSvg({ count: 6, second: 4, colour: '3D85C6', secondColour: '#00B050' }, SHEET).svg);
  assert.ok(chosen.includes('#3D85C6') && chosen.includes('#00B050'), 'a lesson may choose both colours');
});

test('the photocopied pack prints the two colours as a dark and a light grey', () => {
  for (const spec of [{ count: 6, second: 4 }, { count: 6, second: 4, look: 'boxes', colour: '3D85C6' }, { count: 7, highlight: 'empty' }, { count: 6, second: 4, highlight: 'second' }]) {
    const svg = tenFrame.tightSvg(spec, PIECE).svg;
    colours(svg).forEach((c) => assert.ok(c.slice(1, 3) === c.slice(3, 5) && c.slice(3, 5) === c.slice(5, 7), `${c} is a colour on a photocopied piece`));
  }
  const bond = [...tenFrame.tightSvg({ count: 6, second: 4 }, PIECE).svg.matchAll(/<circle[^>]*fill="(#[0-9A-F]{6})"/g)].map((m) => m[1]);
  assert.notEqual(bond[0], bond[9], 'the two parts still tell apart in grey');
});

test('the old coloured-in look is still there to ask for, and fills the box rather than drawing a counter', () => {
  const out = tenFrame.tightSvg({ count: 6, look: 'boxes', colour: '3D85C6' }, SHEET);
  assert.doesNotMatch(out.svg, /<circle/);
  assert.equal((out.svg.match(/fill="#3D85C6"/g) || []).length, 6);
});

test('crossing out marks the last counters, for taking away', () => {
  const { layout, svg } = tenFrame.tightSvg({ count: 9, crossedOut: 3 }, SHEET);
  assert.deepEqual(layout.frameList[0].cells.map((c) => c.crossed), [false, false, false, false, false, false, true, true, true, false]);
  assert.equal((svg.match(/stroke-linecap="round"/g) || []).length, 6, 'two strokes a cross');
});

test('pointing at the empty boxes tints them and fades the counters; pointing at a colour rings it', () => {
  const empty = tenFrame.tightSvg({ count: 7, highlight: 'empty boxes' }, BOARD).svg;
  assert.equal((empty.match(/fill="#FBE0CC"/g) || []).length, 3);
  assert.equal((empty.match(/<circle[^>]*opacity="0\.28"/g) || []).length, 7);
  const second = tenFrame.tightSvg({ count: 6, second: 4, highlight: 'second' }, BOARD).svg;
  assert.equal((second.match(/stroke="#C65911"/g) || []).length, 4);
  // A part the frame does not have is refused by name, never dropped.
  assert.throws(() => tenFrame.tightSvg({ count: 10, highlight: 'empty' }, BOARD), /FIGURE_HIGHLIGHT_UNKNOWN/);
  assert.notEqual(tenFrame.cacheKey({ count: 7 }, BOARD), tenFrame.cacheKey({ count: 7, highlight: 'empty' }, BOARD));
});

test('a frame asked for the way the fraction grid was asked for still draws', () => {
  assert.equal(tenFrame.normalise({ shaded: 6 }).count, 6);
  assert.equal(tenFrame.normalise({ count: '6', second: '4' }).second, 4);
});

test('what cannot be a ten frame is refused by name', () => {
  assert.throws(() => tenFrame.normalise({ count: 21 }), /TEN_FRAME_INVALID.*pair holds 20/);
  assert.throws(() => tenFrame.normalise({ count: 12, frames: 1 }), /TEN_FRAME_INVALID.*`frames` to 2/);
  assert.throws(() => tenFrame.normalise({ count: 4, crossedOut: 5 }), /TEN_FRAME_INVALID/);
  assert.throws(() => tenFrame.normalise({ count: 2.5 }), /TEN_FRAME_INVALID/);
  assert.throws(() => tenFrame.normalise({ count: 3, look: 'dots' }), /TEN_FRAME_INVALID/);
  assert.throws(() => tenFrame.tightSvg({ count: 3 }, profileFor('worksheets', { widthMm: 15 })), /TEN_FRAME_TOO_SMALL/);
});
