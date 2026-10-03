'use strict';

// A method frame's working runs straight on from its own label, and only the
// answers line up. On 2 October 2026 a Year 6 frame read `Add the digits:` with
// `3 + 1 + 2 = ___` beside it, under `Is the total in the 3 times table?`: the
// sum was given a column of its own past the longest label, the frame was sized
// to both, and its text fell to 17pt. The teacher's version put the sum right
// after `Add the digits:` and lined the boxes up, which fits at a larger size.

const assert = require('node:assert/strict');
const test = require('node:test');

const { drawMethodFrame } = require('../src/content/method-frame');

const ZONE = { x: 0, y: 0, w: 5.2, h: 3, class: 'A' };

function capture(data, zone) {
  const shapes = [];
  const texts = [];
  const slide = {
    addShape: (kind, options) => shapes.push({ kind, ...options }),
    addText: (content, options) => texts.push({ content, ...options }),
    addImage: () => {}
  };
  drawMethodFrame({ shapes: { RECTANGLE: 'rect', ROUNDED_RECTANGLE: 'rrect', OVAL: 'oval' } }, slide, zone || ZONE, data);
  // A wrapped label is one text box with a line break; read it as its words.
  texts.forEach((t) => { t.words = String(t.content).replace(/\n/g, ' '); });
  return { shapes, texts };
}

const BLANK = {
  title: '312',
  numbered: true,
  lines: [
    { label: 'Add the digits:', content: '3 + 1 + 2 = ___' },
    { label: 'Is the total in the 3 times table?', content: '___' },
    { label: 'Is the total in the 9 times table?', content: '___' }
  ]
};

test('the working sits beside its own label, inside the longest label\'s width', () => {
  const { texts } = capture(BLANK);
  const longest = texts.find((t) => t.words === 'Is the total in the 3 times table?');
  const sum = texts.find((t) => String(t.content).startsWith('3 + 1 + 2'));
  assert.ok(sum.x < longest.x + longest.w, 'the sum was pushed past the longest label');
});

test('every write-in box starts at the same x', () => {
  const { shapes } = capture(BLANK);
  const boxes = shapes.filter((s) => s.kind === 'rect');
  assert.equal(boxes.length, 3);
  boxes.forEach((b) => assert.ok(Math.abs(b.x - boxes[0].x) < 1e-9, 'the boxes do not line up'));
});

test('the frame fits at a larger size than when the working took a column of its own', () => {
  const now = capture(BLANK).texts.find((t) => t.words === 'Add the digits:').fontSize;
  const separate = capture({
    ...BLANK,
    lines: BLANK.lines.map((l, i) => (i === 0 ? { label: 'Add the digits: 3 + 1 + 2 =   ', content: '___' } : l))
  }).texts.find((t) => t.words.startsWith('Add the digits')).fontSize;
  assert.ok(now >= separate);
  const wide = capture({ ...BLANK, lines: [
    { label: 'Is the total in the 3 times table?', content: '3 + 1 + 2 = ___' },
    ...BLANK.lines.slice(1)
  ] }).texts.find((t) => t.words === 'Is the total in the 3 times table?').fontSize;
  assert.ok(now > wide, `working beside a short label (${now}pt) should beat working beside the longest one (${wide}pt)`);
});

test('a filled frame keeps its answers in the column the boxes used', () => {
  const { texts } = capture({
    title: '312',
    lines: [
      { label: 'Add the digits:', content: '3 + 1 + 2 = 6' },
      { label: 'Is the total in the 3 times table?', content: 'yes' }
    ]
  });
  const six = texts.find((t) => t.content === '6');
  const yes = texts.find((t) => t.content === 'yes');
  assert.ok(six && yes, 'the answer was not drawn on its own');
  assert.ok(Math.abs(six.x - yes.x) < 1e-9, 'the answers do not line up');
  assert.ok(texts.some((t) => t.content === '3 + 1 + 2 ='));
});

// The same frame beside a criteria panel on the Noah slide had a column about 4in
// wide and printed at 15pt to keep `Is the total in the 3 times table?` on one
// line. Below 20pt a long label may take a second line when that reads at
// least 3pt bigger; never a third, and a frame already big enough keeps one.
const NARROW = { x: 0, y: 0, w: 4.2, h: 3.6, class: 'A' };
const SIX = {
  title: '51',
  lines: [
    { label: 'Is 51 even?', content: '___' },
    { label: 'Add the digits:', content: '___' },
    { label: 'Is the total in the 3 times table?', content: '___' },
    { label: 'Is 51 divisible by 6?', content: '___' }
  ]
};

test('a cramped frame wraps its longest label onto two lines and prints bigger', () => {
  const { texts } = capture(SIX, NARROW);
  const long = texts.find((t) => t.words === 'Is the total in the 3 times table?');
  assert.equal(String(long.content).split('\n').length, 2, 'the long label was not wrapped');
  assert.ok(long.fontSize >= 18, `the frame prints at ${long.fontSize}pt`);
  texts.filter((t) => t.color === '0070C0').forEach((t) =>
    assert.ok(String(t.content).split('\n').length <= 2, `"${t.words}" took more than two lines`));
});

test('a frame with room keeps every label on one line', () => {
  const { texts } = capture(SIX, { x: 0, y: 0, w: 7.5, h: 4, class: 'A' });
  texts.filter((t) => t.color === '0070C0').forEach((t) =>
    assert.ok(!String(t.content).includes('\n'), `"${t.words}" wrapped with room to spare`));
});

test('the boxes still line up when a label wraps', () => {
  const { shapes } = capture(SIX, NARROW);
  const boxes = shapes.filter((s) => s.kind === 'rect');
  assert.equal(boxes.length, 4);
  boxes.forEach((b) => assert.ok(Math.abs(b.x - boxes[0].x) < 1e-9));
});

// Answers are green on the board (the teacher's rule of 24 September 2026), so
// a frame's answer carries the deck's reveal marker and prints green, while
// its working stays black (2 October 2026: "remember answers are green").
test('a marked answer prints green and its working stays black', () => {
  const { texts } = capture({
    title: '114',
    lines: [
      { label: 'Add the digits:', content: '1 + 1 + 4 = ||6' },
      { label: 'Is 114 even?', content: '||yes' }
    ]
  });
  const { COLOURS } = require('../src/styles');
  assert.equal(texts.find((t) => t.content === '6').color, COLOURS.green);
  assert.equal(texts.find((t) => t.content === 'yes').color, COLOURS.green);
  assert.equal(texts.find((t) => t.content === '1 + 1 + 4 =').color, COLOURS.body);
  assert.ok(!texts.some((t) => String(t.content).includes('||')), 'the marker printed');
});

// Two answer frames side by side print at one size, the smaller one's.
test('frames side by side in a row share one size', () => {
  const requireGlobal = require('../src/require-global');
  const PptxGenJS = requireGlobal('pptxgenjs');
  const { drawContent } = require('../src/content');
  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();
  const frame = (n, sum) => ({ type: 'method-frame', title: n, lines: [
    { label: 'Add the digits:', content: `${sum} = ||9` },
    { label: 'Is the total in the 3 times table?', content: '||yes' },
    { label: 'Is the total in the 9 times table?', content: '||yes' }
  ] });
  drawContent(pptx, slide, { x: 0.3, y: 1.5, w: 9.4, h: 3.0, class: 'B' },
    { type: 'row', items: [frame('312', '3 + 1 + 2'), frame('5,463', '5 + 4 + 6 + 3')] }, {});
  const sizes = new Set(slide._slideObjects
    .filter((o) => o._type === 'text' && o.options && o.options.color === '0070C0')
    .map((o) => o.options.fontSize));
  assert.equal(sizes.size, 1, `the two frames print at ${[...sizes].join(' and ')}pt`);
});
