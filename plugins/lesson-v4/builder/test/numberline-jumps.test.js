'use strict';

// Jumps along the spaces of a number line, and one space highlighted.
//
// A Year 4 lesson on reading number lines asked its vocabulary slide for "the
// space between 0 and 10 highlighted" and "a +10 jump over one interval". No
// engine could draw a space, so the slide came out as a shaded strip floating
// above the line and an arrow pointing down at the 10 tick (12 September 2026).
//
// What is held here is the meaning, not the look, against the one shared number
// line every surface now places: a jump starts and lands on the marks it names,
// a highlight covers exactly the space between its two marks, and anything that
// would be drawn somewhere near where it was meant to go is refused by name.

const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');

const jumpsGeo = require('../../shared/visuals/number-line-jumps');
const numberLine = require('../../shared/visuals/number-line-svg');
const { profileFor } = require('../../shared/visuals/surface-profiles');
const { createSharedFigureStore } = require('../src/content/shared-figure');

const BOARD = profileFor('slides', { widthPt: 8.8 * 72, heightPt: 2.8 * 72 });

function draw(data, profile = BOARD) {
  return numberLine.tightSvg(data, profile);
}

function tickXs(built) {
  const row = built.layout.rows[0];
  const l = row.line;
  return Array.from({ length: l.count + 1 }, (_, k) => row.x(l.start + k * l.interval));
}

test('a jump starts on the mark it names and lands on the mark it names', () => {
  const built = draw({ start: 0, end: 20, interval: 10, labels: 'all', jumps: [{ from: 0, to: 10, label: '+10' }] });
  const xs = tickXs(built);
  const arc = /<polyline points="([^"]+)"/.exec(built.svg)[1].split(' ').map((p) => p.split(',').map(Number));
  assert.ok(Math.abs(arc[0][0] - xs[0]) < 0.05, `arc starts at ${arc[0][0]}, the 0 mark is at ${xs[0]}`);
  const head = /<polygon points="([^"]+)" fill="#0070C0"/.exec(built.svg)[1].split(' ').map((p) => p.split(',').map(Number));
  assert.ok(Math.abs(head[0][0] - xs[1]) < 0.05, `arrowhead lands at ${head[0][0]}, the 10 mark is at ${xs[1]}`);
  assert.ok(built.svg.includes('>+10</text>'), 'the jump carries its size');
});

test('a highlight covers exactly the space between its two marks', () => {
  const built = draw({ start: 0, end: 20, interval: 10, labels: 'all', highlight: { from: 0, to: 10 } });
  const xs = tickXs(built);
  const orange = [...built.svg.matchAll(/<rect x="([\d.]+)" y="[\d.]+" width="([\d.]+)" height="[\d.]+" fill="#C65911"/g)];
  assert.equal(orange.length, 2, 'a wash and a bar');
  orange.forEach((m) => {
    assert.ok(Math.abs(Number(m[1]) - xs[0]) < 0.02);
    assert.ok(Math.abs(Number(m[1]) + Number(m[2]) - xs[1]) < 0.02);
  });
});

test('a jump or highlight off a mark is refused by name, never drawn nearby', () => {
  assert.throws(() => draw({ start: 0, end: 20, interval: 10, jumps: [{ from: 0, to: 15 }] }), /NUMBERLINE_JUMP_OFF_TICK/);
  assert.throws(() => draw({ start: 0, end: 20, interval: 10, highlight: { from: 5, to: 10 } }), /NUMBERLINE_HIGHLIGHT_OFF_TICK/);
  assert.throws(() => draw({ start: 0, end: 20, interval: 10, highlight: { from: 0, to: 20 } }), /points at nothing/);
});

test('jumps and an arrow do not share a line, because they draw in the same space', () => {
  assert.throws(
    () => draw({ start: 0, end: 20, interval: 10, arrow: { at: 10, label: '?' }, jumps: [{ from: 0, to: 10 }] }),
    /NUMBERLINE_JUMPS_CROWDED/
  );
  draw({ lines: [
    { start: 0, end: 20, interval: 10, arrow: { at: 10, label: '?' } },
    { start: 0, end: 20, interval: 10, jumps: [{ from: 0, to: 10, label: '+10' }] },
  ] }, profileFor('slides', { widthPt: 9 * 72, heightPt: 4.5 * 72 }));
});

test('counting back is a jump too, and overlapping jumps climb a tier', () => {
  const line = jumpsGeo.valueLine({ start: 0, end: 100, interval: 10 });
  const jumps = jumpsGeo.resolveJumps({ jumps: [
    { from: 0, to: 30 }, { from: 30, to: 60 }, { from: 20, to: 50 }, { from: 90, to: 70, label: '-20' },
  ] }, line);
  assert.deepEqual(jumps.map((j) => j.tier), [0, 0, 1, 0]);
  assert.equal(jumps[3].fromIndex, 9);
  assert.equal(jumps[3].toIndex, 7);
});

test('a run of narrow hops whose labels cannot be read is refused rather than shrunk to nothing', () => {
  const jumps = [];
  for (let v = 0; v < 40; v += 1) jumps.push({ from: v, to: v + 1, label: '+1000' });
  assert.throws(
    () => draw({ start: 0, end: 40, interval: 1, jumps }, profileFor('slides', { widthPt: 6 * 72, heightPt: 3 * 72 })),
    /NUMBERLINE_JUMP_LABELS_CROWDED/
  );
});

test("the stick-in pack's index spelling still draws, jumps included, and keeps them in its cache key", () => {
  const plain = numberLine.cacheKey({ start: '0', end: '20', intervals: 2 }, 'stickin', { widthMm: 130 });
  const jumped = numberLine.cacheKey({ start: '0', end: '20', intervals: 2, jumps: [{ from: 0, to: 1, label: '+10' }] }, 'stickin', { widthMm: 130 });
  assert.notEqual(plain, jumped);
  const built = numberLine.tightSvg({ start: '0', end: '20', intervals: 2, jumps: [{ from: 0, to: 1, box: true }] }, 'stickin', { widthMm: 130 });
  assert.ok(built.svg.includes('>20</text>'), 'the piece prints its own end labels');
  assert.throws(
    () => numberLine.normalise({ start: '0', end: '20', intervals: 2, arrows: [{ index: 1, label: 'A' }], jumps: [{ from: 0, to: 1 }] }),
    /NUMBERLINE_JUMPS_CROWDED/
  );
});

test('a label can print its own words at a mark, for a line children judge', () => {
  const built = draw({ start: 2400, end: 2900, interval: 100, labels: [2400, 2500, { at: 2600, text: '2,700' }, 2700, 2800, 2900] });
  const texts = [...built.svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
  assert.deepEqual(texts, ['2,400', '2,500', '2,700', '2,700', '2,800', '2,900']);
  assert.throws(() => draw({ start: 0, end: 10, interval: 1, labels: [{ at: 2.5, text: '3' }] }), /NUMBERLINE_LABEL_OFF_TICK/);
});

test('a vocabulary card takes a number line, in a panel wide enough to read it', () => {
  const { drawKeyVocabulary } = require('../src/templates/key-vocabulary');
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'W', width: 13.333, height: 7.5 });
  pptx.layout = 'W';
  const slide = pptx.addSlide();
  const sharedFigures = createSharedFigureStore();
  const ctx = { slideIndex: 0, warnings: [], sharedFigures };
  drawKeyVocabulary(pptx, slide, { words: [
    { word: 'Interval', definition: 'The space between two neighbouring marks.',
      visual: { type: 'numberline', start: 0, end: 20, interval: 10, labels: 'all', highlight: { from: 0, to: 10 } } },
    { word: 'Scale', definition: 'How much each equal interval is worth.',
      visual: { type: 'numberline', start: 0, end: 20, interval: 10, labels: 'all', jumps: [{ from: 0, to: 10, label: '+10' }] } },
  ] }, ctx);
  assert.ok(sharedFigures.pending >= 2, 'both cards asked for the shared number line');
  const panels = slide._slideObjects.filter((o) => o.options && o.options.fill && o.options.fill.color === 'F2F2F2');
  assert.equal(panels.length, 2);
  panels.forEach((p) => assert.ok(p.options.w > 4, `panel ${p.options.w.toFixed(2)}in wide is too narrow for a number line`));
});
