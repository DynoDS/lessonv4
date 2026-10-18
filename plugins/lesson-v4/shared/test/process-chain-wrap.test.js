'use strict';

// A chain too long for one row turns onto a second, joined by one arrow from
// the end of the top row to the start of the next. A Year 4 bell-to-brain chain
// of seven links needed 328mm at the 18pt floor and the widest slide zone gives
// 322mm, so the drawing refused it and slide designers split it by hand into
// two chains in two cards with nothing joining the fourth link to the fifth
// (stress test, 17 and 18 October 2026).

const test = require('node:test');
const assert = require('node:assert/strict');

const chain = require('../visuals/process-chain-svg');
const { profileFor } = require('../visuals/surface-profiles');

const GREEN = '#00B050';
const WIDEST_SLIDE = profileFor('slides', { widthPt: (322 / 25.4) * 72, heightPt: 330 });
const BELL = ['school bell', 'air', 'outer ear', 'eardrum', 'ear bones', 'cochlea', 'brain'];
const ANSWERS = { boxes: BELL.map((t, i) => (i === 0 || i === 6 ? t : { text: t, answer: true })) };
const QUESTION = { boxes: BELL.map((t, i) => (i === 0 || i === 6 ? t : null)) };
const SURFACES = {
  board: WIDEST_SLIDE,
  sheet: profileFor('worksheets', { widthMm: 174 }),
  'answer sheet': profileFor('worksheets', { widthMm: 174, overrides: { answers: 'show' } }),
  wall: profileFor('wall', { widthMm: 360 }),
  'stick-in': profileFor('stickin', { widthMm: 160 }),
};

// The turning arrow's route, read back off the drawing: its corners in order.
function turnRoute(svg) {
  const turns = [...svg.matchAll(/<g class="chain-(?:arrow|join) chain-turn"><path d="([^"]+)"/g)];
  assert.equal(turns.length, 1, 'exactly one arrow carries the reader from the top row to the next');
  const nums = turns[0][1].match(/-?\d+(\.\d+)?/g).map(Number);
  // M x y H xR V yMid H xL V y2 H xEnd
  const [x0, y0, xR, yMid, xL, y2, xEnd] = nums;
  return { x0, y0, xR, yMid, xL, y2, xEnd };
}

test('the seven-link bell chain draws on the widest slide, on two rows, instead of being refused', () => {
  const L = chain.describeLayout(ANSWERS, WIDEST_SLIDE);
  assert.equal(L.rows, 2);
  assert.deepEqual(L.boxes.map((b) => b.row), [0, 0, 0, 0, 1, 1, 1]);
  // The second row starts under the first link and reads left to right.
  assert.equal(L.boxes[4].x, L.boxes[0].x);
  assert.ok(L.boxes[5].x > L.boxes[4].x && L.boxes[6].x > L.boxes[5].x);
  assert.ok(L.boxes[4].y > L.boxes[3].y + L.boxes[3].h, 'the second row is below the first');
  assert.ok(L.h >= L.boxes[6].y + L.boxes[6].h, 'the drawing is tall enough for both rows');
});

test('one arrow leaves the end of the top row and comes into the start of the second', () => {
  const { svg, layout: L } = chain.tightSvg(ANSWERS, WIDEST_SLIDE);
  const last = L.boxes[3];
  const first = L.boxes[4];
  const r = turnRoute(svg);
  assert.ok(r.x0 >= last.x + last.w && r.y0 === Math.round(last.arrowY * 100) / 100, 'it leaves the right of the fourth link, on its arrow line');
  assert.ok(r.xR > last.x + last.w, 'it turns down beside the top row, not through it');
  assert.ok(r.yMid > last.y + last.h && r.yMid < first.y, 'it runs back between the rows');
  assert.ok(r.xL < first.x, 'it comes down beside the second row');
  assert.ok(Math.abs(r.y2 - first.arrowY) < 0.02 && r.xEnd < first.x, 'it comes into the fifth link from the left');
  assert.match(svg, /chain-turn"><path[^>]*\/><polygon/, 'with a head on it');
  // Six joins in all: three on the top row, the turn, two on the second row.
  assert.equal((svg.match(/class="chain-arrow/g) || []).length, 6);
});

test('every surface draws the long chain on two rows with the turning arrow', () => {
  for (const [name, profile] of Object.entries(SURFACES)) {
    const { svg, layout } = chain.tightSvg(ANSWERS, profile);
    assert.equal(layout.rows, 2, name);
    turnRoute(svg);
  }
});

test('a pupil sheet has the same two rows as its answer sheet, though its empty boxes are narrower words', () => {
  const pupil = chain.describeLayout(ANSWERS, SURFACES.sheet);
  const key = chain.describeLayout(ANSWERS, SURFACES['answer sheet']);
  assert.equal(pupil.rows, key.rows);
  assert.deepEqual(pupil.boxes.map((b) => b.text), QUESTION.boxes.map((b) => b || null));
});

test('a chain that fits one row is drawn on one row, with no turn', () => {
  const five = { boxes: ['egg', 'caterpillar', null, 'chrysalis', 'butterfly'] };
  for (const [name, profile] of Object.entries(SURFACES)) {
    const { svg, layout } = chain.tightSvg(five, profile);
    assert.equal(layout.rows, 1, name);
    assert.doesNotMatch(svg, /chain-turn/, name);
    assert.equal(new Set(layout.boxes.map((b) => b.y)).size, 1, name);
  }
});

test('the answers stay green on both rows, and the given links stay ink', () => {
  const { svg } = chain.tightSvg(ANSWERS, WIDEST_SLIDE);
  for (const word of ['air', 'eardrum', 'ear bones', 'cochlea']) assert.match(svg, new RegExp(`fill="${GREEN}"[^>]*>${word}<`), word);
  assert.doesNotMatch(svg, new RegExp(`fill="${GREEN}"[^>]*>brain<`));
  assert.doesNotMatch(chain.tightSvg(ANSWERS, SURFACES.sheet).svg, /cochlea/);
});

test('plain joins for the child to finish stay plain round the turn, and every link keeps its writing line', () => {
  const { svg, layout } = chain.tightSvg({ ...QUESTION, arrowHeads: false, labelLine: true }, WIDEST_SLIDE);
  assert.equal(layout.rows, 2);
  assert.match(svg, /<g class="chain-join chain-turn"><path[^>]*\/><\/g>/, 'the turn has no head');
  assert.doesNotMatch(svg, /<polygon/);
  const lines = [...svg.matchAll(/class="chain-label-line" x="[^"]+" y="([^"]+)"/g)].map((m) => Number(m[1]));
  assert.equal(lines.length, 7);
  assert.ok(lines[4] > lines[3], 'the second row has its own lines, under its own links');
});

test('the bank stays one row above a wrapped chain, and pictures sit in their own row', () => {
  const pic = (text) => ({ text, imageHref: 'data:image/png;base64,AAAA', imageWidth: 400, imageHeight: 300 });
  const spec = { boxes: [null, null, null, null, null, null, null], arrowHeads: false, bank: BELL.map(pic) };
  const L = chain.describeLayout(spec, SURFACES.wall);
  assert.equal(L.rows, 2);
  const bankBottom = Math.max(...L.bankCells.map((c) => c.y + c.h));
  assert.ok(L.boxes[0].y >= bankBottom, 'the bank is above the chain');
  assert.equal(new Set(L.bankCells.map((c) => c.y)).size, 1, 'the bank is one row');

  const pictured = { boxes: BELL.map(pic) };
  const P = chain.describeLayout(pictured, SURFACES.wall);
  assert.equal(P.rows, 2);
  for (const b of P.boxes) {
    assert.ok(b.pic.y >= b.rowTop && b.pic.y + b.pic.h <= b.rowTop + P.mainH + 0.01, 'each picture sits inside its own row');
  }
});
