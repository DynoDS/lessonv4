'use strict';

// Jumps along the spaces of a number line, and one space highlighted.
//
// A Year 4 lesson on reading number lines asked its vocabulary slide for "the
// space between 0 and 10 highlighted" and "a +10 jump over one interval". No
// engine could draw a space, so the slide came out as a shaded strip floating
// above the line and an arrow pointing down at the 10 tick: a mark, where the
// lesson was teaching that an interval is the space BETWEEN marks. The deck was
// withheld over it (12 September 2026).
//
// What is held here is the meaning, not the look: a jump starts and lands on
// the marks it names, a highlight covers exactly the space between its two
// marks, and anything that would be drawn somewhere near where it was meant to
// go is refused by name instead.

const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');

const { drawNumberline } = require('../src/content/numberline');
const jumpsGeo = require('../../shared/visuals/number-line-jumps');
const stickIn = require('../../shared/visuals/number-line-svg');

const ZONE = { x: 0.5, y: 0.5, w: 9, h: 3 };

function draw(data, zone = ZONE) {
  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();
  drawNumberline(pptx, slide, zone, data);
  return slide._slideObjects;
}

// The centre x of each tick mark, left to right: the tall thin black bars.
function tickXs(objects) {
  return objects
    .filter((o) => o.options && o.options.fill && o.options.fill.color === '000000' &&
      o.options.h > o.options.w && o.options.w < 0.2)
    .map((o) => o.options.x + o.options.w / 2)
    .sort((a, b) => a - b);
}

function custom(objects, closed) {
  return objects.filter((o) => o.options && Array.isArray(o.options.points) &&
    o.options.points.some((p) => p.close) === closed);
}

test('a jump starts on the mark it names and lands on the mark it names', () => {
  const objects = draw({ start: 0, end: 20, interval: 10, labels: 'all', jumps: [{ from: 0, to: 10, label: '+10' }] });
  const xs = tickXs(objects);
  const arcs = custom(objects, false);
  assert.equal(arcs.length, 1, 'one jump draws one arc');
  const arc = arcs[0].options;
  const first = arc.x + arc.points[0].x;
  assert.ok(Math.abs(first - xs[0]) < 0.01, `arc starts at ${first}, the 0 mark is at ${xs[0]}`);
  const head = custom(objects, true)[0].options;
  const tipX = head.x + Math.max(...head.points.filter((p) => p.x != null).map((p) => p.x));
  assert.ok(Math.abs(tipX - xs[1]) < 0.02, `arrowhead lands at ${tipX}, the 10 mark is at ${xs[1]}`);
  assert.ok(objects.find((o) => Array.isArray(o.text) && o.text[0].text === '+10'), 'the jump carries its size');
});

test('a highlight covers exactly the space between its two marks', () => {
  const objects = draw({ start: 0, end: 20, interval: 10, labels: 'all', highlight: { from: 0, to: 10 } });
  const xs = tickXs(objects);
  const orange = objects.filter((o) => o.options && o.options.fill && o.options.fill.color === 'C65911');
  assert.equal(orange.length, 2, 'a wash and a bar');
  orange.forEach((o) => {
    assert.ok(Math.abs(o.options.x - xs[0]) < 1e-6);
    assert.ok(Math.abs(o.options.x + o.options.w - xs[1]) < 1e-6);
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
  // On separate lines of one visual they are fine.
  draw({ lines: [
    { start: 0, end: 20, interval: 10, arrow: { at: 10, label: '?' } },
    { start: 0, end: 20, interval: 10, jumps: [{ from: 0, to: 10, label: '+10' }] }
  ] }, { x: 0.5, y: 0.5, w: 9, h: 4.5 });
});

test('counting back is a jump too, and overlapping jumps climb a tier', () => {
  const line = jumpsGeo.valueLine({ start: 0, end: 100, interval: 10 });
  const jumps = jumpsGeo.resolveJumps({ jumps: [
    { from: 0, to: 30 }, { from: 30, to: 60 }, { from: 20, to: 50 }, { from: 90, to: 70, label: '-20' }
  ] }, line);
  assert.deepEqual(jumps.map((j) => j.tier), [0, 0, 1, 0], 'touching jumps share a tier; an overlapping one rises');
  assert.equal(jumps[3].fromIndex, 9);
  assert.equal(jumps[3].toIndex, 7);
});

test('a run of narrow hops whose labels cannot be read is refused rather than shrunk to nothing', () => {
  const jumps = [];
  for (let v = 0; v < 40; v += 1) jumps.push({ from: v, to: v + 1, label: '+1000' });
  assert.throws(
    () => draw({ start: 0, end: 40, interval: 1, jumps }, { x: 0.5, y: 0.5, w: 6, h: 3 }),
    /NUMBERLINE_JUMP_LABELS_CROWDED/
  );
});

test('the stick-in piece takes jumps by tick index and keeps them in its cache key', () => {
  const plain = stickIn.cacheKey({ start: '0', end: '20', intervals: 2 });
  const jumped = stickIn.cacheKey({ start: '0', end: '20', intervals: 2, jumps: [{ from: 0, to: 1, label: '+10' }] });
  assert.notEqual(plain, jumped);
  const layout = stickIn.describeLayout({ start: '0', end: '20', intervals: 2, jumps: [{ from: 0, to: 1, box: true }] });
  assert.ok(layout.rows[0].jumpShapes[0].labelBox.y >= 0, 'the blank for the jump size sits inside the piece');
  assert.throws(
    () => stickIn.normalise({ start: '0', end: '20', intervals: 2, arrows: [{ index: 1, label: 'A' }], jumps: [{ from: 0, to: 1 }] }),
    /NUMBERLINE_JUMPS_CROWDED/
  );
});

test('a label can print its own words at a mark, for a line children judge', () => {
  // "Has this number line been completed correctly?" needs the wrong number on
  // the line. The mark is still found by value, so only the words are wrong.
  const objects = draw({ start: 2400, end: 2900, interval: 100,
    labels: [2400, 2500, { at: 2600, text: '2,700' }, 2700, 2800, 2900] });
  const texts = objects.filter((o) => Array.isArray(o.text)).map((o) => o.text[0].text);
  assert.deepEqual(texts, ['2,400', '2,500', '2,700', '2,700', '2,800', '2,900']);
  assert.throws(() => draw({ start: 0, end: 10, interval: 1, labels: [{ at: 2.5, text: '3' }] }), /NUMBERLINE_LABEL_OFF_TICK/);
});

test('a vocabulary card takes a number line, in a panel wide enough to read it', () => {
  // The card used to refuse a number line, so a Year 4 vocabulary slide about
  // intervals was hand-built from free stacks and did not look like the house
  // vocabulary slide (12 September 2026).
  const { drawKeyVocabulary } = require('../src/templates/key-vocabulary');
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'W', width: 13.333, height: 7.5 });
  pptx.layout = 'W';
  const slide = pptx.addSlide();
  const ctx = { slideIndex: 0, warnings: [] };
  drawKeyVocabulary(pptx, slide, { words: [
    { word: 'Interval', definition: 'The space between two neighbouring marks.',
      visual: { type: 'numberline', start: 0, end: 20, interval: 10, labels: 'all', highlight: { from: 0, to: 10 } } },
    { word: 'Scale', definition: 'How much each equal interval is worth.',
      visual: { type: 'numberline', start: 0, end: 20, interval: 10, labels: 'all', jumps: [{ from: 0, to: 10, label: '+10' }] } }
  ] }, ctx);
  const texts = slide._slideObjects.filter((o) => Array.isArray(o.text)).map((o) => o.text[0].text);
  assert.ok(texts.includes('+10'), 'the jump reached the card');
  const panels = slide._slideObjects.filter((o) => o.options && o.options.fill && o.options.fill.color === 'F2F2F2');
  assert.equal(panels.length, 2);
  panels.forEach((p) => assert.ok(p.options.w > 4, `panel ${p.options.w.toFixed(2)}in wide is too narrow for a number line`));
});
