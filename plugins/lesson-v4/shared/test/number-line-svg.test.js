'use strict';

// The one number line every surface places (shared/visuals/number-line-svg.js).
// These hold what the drawing must guarantee on every surface; each surface's
// own tests hold how it places it.

const test = require('node:test');
const assert = require('node:assert/strict');
const numberLine = require('../visuals/number-line-svg');
const { profileFor, PROFILES } = require('../visuals/surface-profiles');

const SHEET = profileFor('worksheets', { widthMm: 170 });
const PIECE = profileFor('stickin', { widthMm: 130 });
const texts = (svg) => [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);

test('every mark is equally spaced, and an arrow points exactly at its mark', () => {
  const out = numberLine.tightSvg({ start: 0, end: 1000, interval: 100, arrow: { at: 300, label: 'A' } }, SHEET);
  const row = out.layout.rows[0];
  const gap = row.x(100) - row.x(0);
  for (let k = 0; k <= 10; k++) assert.ok(Math.abs(row.x(k * 100) - (row.x(0) + gap * k)) < 1e-9);
  const tip = /<polygon points="([\d.]+),/.exec(out.svg);
  assert.ok(Math.abs(Number(tip[1]) - row.x(300)) < 0.02);
  assert.ok(!texts(out.svg).includes('300'), 'no value the child has to find is printed');
});

test('the same spec draws the same picture on every surface, only sized for where it is read', () => {
  const spec = { start: 40, end: 90, interval: 10, labels: [40, 90], jumps: [{ from: 40, to: 50, label: '+10' }] };
  const surfaces = Object.keys(PROFILES).map((s) => numberLine.tightSvg(spec, profileFor(s, { widthMm: 150 })));
  const shapes = surfaces.map((o) => (o.svg.match(/<(rect|polyline|polygon|circle)\b/g) || []).length);
  assert.equal(new Set(shapes).size, 1, `every surface draws the same marks: ${shapes.join(', ')}`);
  surfaces.forEach((o) => assert.deepEqual(texts(o.svg), ['40', '90', '+10']));
});

test('the stick-in piece stays in ink, and every coloured surface uses the board colours', () => {
  const spec = { start: 0, end: 20, interval: 10, highlight: { from: 0, to: 10 } };
  const arrowed = { start: 0, end: 20, interval: 10, arrow: { at: 20, label: 'A' } };
  const piece = numberLine.tightSvg(spec, PIECE).svg + numberLine.tightSvg(arrowed, PIECE).svg;
  assert.ok(!/#CC0000|#0070C0|#C65911|#00B050/.test(piece));
  for (const s of ['slides', 'worksheets', 'wall']) {
    const box = s === 'slides' ? { widthMm: 150, heightMm: 60 } : { widthMm: 150 };
    const svg = numberLine.tightSvg(spec, profileFor(s, box)).svg + numberLine.tightSvg(arrowed, profileFor(s, box)).svg;
    assert.ok(svg.includes('#CC0000') && svg.includes('#C65911'), `${s} uses the board's arrow and highlight colours`);
  }
});

test('stacked lines share one span, so positions can be compared across them', () => {
  const out = numberLine.describeLayout({ lines: [{ start: 0, end: 1000, interval: 100 }, { start: -20000, end: 30000, interval: 10000 }] }, SHEET);
  assert.equal(out.rows[0].x(0), out.rows[1].x(-20000));
  assert.equal(out.rows[0].x(1000), out.rows[1].x(30000));
  assert.ok(out.rows[0].bottom < out.rows[1].top);
});

test('arrow letters that would meet are lifted onto their own row', () => {
  const out = numberLine.tightSvg({ start: 0, end: 100, interval: 1, labels: 'ends', arrows: [{ at: 50, label: 'W' }, { at: 51, label: 'M' }] }, SHEET);
  const ys = [...out.svg.matchAll(/<text x="[\d.]+" y="([\d.]+)"[^>]*fill="#CC0000">(W|M)</g)].map((m) => Number(m[1]));
  assert.equal(ys.length, 2);
  assert.notEqual(ys[0], ys[1]);
});

test('bad scales and ambiguous points fail clearly', () => {
  for (const intervals of [0, -1, 2.5, NaN, 101]) {
    assert.throws(() => numberLine.tightSvg({ start: '0', end: '1000', intervals }, PIECE), /NUMBERLINE_INVALID/);
  }
  assert.throws(() => numberLine.tightSvg({ start: 0, end: 10, arrows: [{ at: 11, label: 'A' }] }, SHEET), /NUMBERLINE_POINT_OFF_LINE/);
  assert.throws(() => numberLine.tightSvg({ start: 0, end: 10, arrows: [{ at: 3, label: 'A' }, { at: 3, label: 'B' }] }, SHEET), /NUMBERLINE_ARROWS_AMBIGUOUS/);
  assert.throws(() => numberLine.tightSvg({ start: '', end: '1000', intervals: 10 }, PIECE), /NUMBERLINE_INVALID/);
  assert.throws(() => numberLine.tightSvg({ lines: [{}, {}, {}, {}] }, SHEET), /NUMBERLINE_TOO_MANY_LINES/);
});

test("the stick-in pack's index spelling: a given label, a blank end and a caption reach the child's copy; an unmarked label does not", () => {
  // A Year 4 line gave 9,500 and 9,800 and left 10,000 for the child. The piece
  // once printed only its endpoints, giving the answer and dropping the given.
  const out = numberLine.tightSvg({
    start: '9,500', end: '10,000', endBlank: true, intervals: 5, questionState: true,
    tickLabels: [{ index: 3, text: '9,800', given: true }, { index: 4, text: '9,900' }],
    caption: 'Each interval is worth 100.',
  }, PIECE);
  const words = texts(out.svg);
  assert.ok(words.includes('9,500') && words.includes('9,800'));
  assert.ok(!words.includes('10,000') && !words.includes('9,900'));
  assert.ok(words.includes('Each interval is worth 100.'));
  assert.ok(out.layout.rows[0].bottom <= out.h);
});

test('an estimation line can show only its end ticks', () => {
  const out = numberLine.tightSvg({ start: '0', end: '1000', intervals: 10, showTicks: false }, PIECE);
  // The axis and the two end ticks.
  assert.equal((out.svg.match(/<rect /g) || []).length, 3);
  assert.notEqual(
    numberLine.cacheKey({ start: '0', end: '1000', intervals: 10 }, PIECE),
    numberLine.cacheKey({ start: '0', end: '1000', intervals: 10, showTicks: false }, PIECE)
  );
});
