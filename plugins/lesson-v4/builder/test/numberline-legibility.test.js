'use strict';

// The numbers a child reads off a number line came out half the size of the
// words beside them, and a Year 4 deck on estimating to 10,000 shipped that
// way: "0" at one end of an axis at full size, "10,000" at the other end at
// well under half, on the same line, doing the same job.
//
// Two independent causes, pinned here separately because fixing either alone
// leaves the deck looking the same:
//
//   1. every axis label was drawn in the same fixed 0.55in box, so a numeral's
//      size tracked its DIGIT COUNT - the fit pass shrank whatever overflowed.
//      On a four-digit deck that is every number on the line. A previous repair
//      raised the font ceiling 14pt -> 24pt and changed almost nothing, because
//      the ceiling was never what was binding.
//
//   2. a stacked line claimed a flat 2.00in of height whether or not it carried
//      an arrow or an answer, so a pair of bare endpoint lines "needed" 4in and
//      got scaled to 81%, and three arrowed lines got 54% - shrinking the
//      arrowheads, dots and ticks along with the numerals.
//
// The floor is pinned too: the numerals are the one thing on a number line the
// maths cannot be done without, so when a deep stack really is out of room the
// arrows and ticks give up their size first.

const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');

const { drawNumberline } = require('../src/content/numberline');
const { textWidthIn } = require('../src/glyph-width');

// A generous board zone, close to the one the Year 4 deck actually used.
const ZONE = { x: 0.23, y: 0.77, w: 7.98, h: 3.55 };
// Three arrowed lines want about 4in at the 18pt floor: below that the visual
// refuses rather than choosing between a readable scale and an arrow that
// points. Tests about arrows use this; tests about a tight zone use ZONE.
const ARROW_ZONE = { x: 0.23, y: 0.77, w: 7.98, h: 4.2 };

function draw(zone, data) {
  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();
  drawNumberline(pptx, slide, zone, data);
  const labels = slide._slideObjects
    .filter((o) => Array.isArray(o.text) && o.text.length)
    .map((o) => ({ text: String(o.text[0].text), opts: o.options }));
  const shapes = slide._slideObjects.filter((o) => !Array.isArray(o.text));
  return { labels, shapes };
}

function labelled(labels, text) {
  const found = labels.find((l) => l.text === text);
  assert.ok(found, `expected a "${text}" label to be drawn`);
  return found;
}

// The size a label ASKS for proves nothing on its own: the old renderer asked
// for 24pt every time and let the fit pass shrink whatever overflowed, which is
// how a deck of squashed numerals passed as a deck of 24pt numerals. The
// property that matters is that the box is big enough for the words in it, so
// the fit pass has nothing left to take.
function assertFits(label, why) {
  const needW = textWidthIn(label.text, label.opts.fontSize, true);
  const needH = label.opts.fontSize / 72;
  assert.ok(
    label.opts.w >= needW,
    `${why}: "${label.text}" asks for ${label.opts.fontSize}pt, which needs ` +
      `${needW.toFixed(2)}in, and was given a box ${label.opts.w.toFixed(2)}in wide`
  );
  assert.ok(
    label.opts.h >= needH - 1e-6,
    `${why}: "${label.text}" asks for ${label.opts.fontSize}pt, which needs ` +
      `${needH.toFixed(2)}in, and was given a box ${label.opts.h.toFixed(2)}in tall`
  );
}

test('a long axis number is given a box its own digits fit in', () => {
  const { labels } = draw(ZONE, { start: 0, end: 10000, interval: 10000, labels: 'ends' });

  const wide = labelled(labels, '10,000');
  const needed = textWidthIn('10,000', wide.opts.fontSize, true);
  assert.ok(
    wide.opts.w >= needed,
    `a five-digit label needs ${needed.toFixed(2)}in and was given ${wide.opts.w.toFixed(2)}in, ` +
      'so the fit pass would shrink it for being long rather than for being crowded'
  );
});

test('both ends of one axis print at the same size, however many digits they have', () => {
  const { labels } = draw(ZONE, { start: 0, end: 10000, interval: 10000, labels: 'ends' });
  const short = labelled(labels, '0');
  const long = labelled(labels, '10,000');
  assert.equal(short.opts.fontSize, long.opts.fontSize, 'both ends must ask for one size');
  assertFits(short, 'a one-digit endpoint');
  assertFits(long, 'a five-digit endpoint');
});

test('an axis label never overhangs the zone it was given', () => {
  // The old renderer centred a fixed box on the endpoint, so a long end label
  // spilled past the card and was shrunk until it stopped.
  for (const data of [
    { start: 0, end: 10000, interval: 10000, labels: 'ends' },
    { start: 2000, end: 4000, interval: 500, labels: 'ends', arrow: { at: 3500, label: 'A' } },
    { start: 0, end: 10000, interval: 2500, labels: 'all', answer: { at: 6800, text: '6,800' } },
  ]) {
    const { labels } = draw(ZONE, data);
    for (const l of labels) {
      assert.ok(
        l.opts.x >= ZONE.x - 1e-6 && l.opts.x + l.opts.w <= ZONE.x + ZONE.w + 1e-6,
        `"${l.text}" runs from ${l.opts.x.toFixed(2)} to ${(l.opts.x + l.opts.w).toFixed(2)}, ` +
          `outside a zone of ${ZONE.x} to ${(ZONE.x + ZONE.w).toFixed(2)}`
      );
    }
  }
});

test('a pair of bare endpoint lines is not charged for arrows it does not have', () => {
  const alone = draw(ZONE, { start: 0, end: 10000, interval: 10000, labels: 'ends' });
  const pair = draw(ZONE, {
    lines: [
      { start: 0, end: 10000, interval: 10000, labels: 'ends' },
      { start: 4000, end: 8000, interval: 4000, labels: 'ends' },
    ],
  });
  assert.equal(
    labelled(pair.labels, '10,000').opts.fontSize,
    labelled(alone.labels, '10,000').opts.fontSize,
    'two lines with nothing above them fit at full size; only what a line carries costs it height'
  );
  assertFits(labelled(pair.labels, '10,000'), 'an endpoint on a stacked pair');
  assertFits(labelled(pair.labels, '4,000'), 'an endpoint on a stacked pair');
});

test('stacking three arrowed lines no longer halves the arrows', () => {
  // Measured absolutely, not against a single-line arrow: a lone line may now
  // grow into a roomy card, so a ratio between the two would move for reasons
  // that have nothing to do with the stack.
  const stem = (r) => {
    const red = r.shapes.filter((s) => s.options.fill && s.options.fill.color === 'CC0000');
    assert.ok(red.length >= 2, 'an arrowed line draws a stem and a head');
    return Math.max(...red.map((s) => s.options.h));
  };
  const three = draw(ARROW_ZONE, {
    lines: [
      { start: 1000, end: 3500, interval: 500, labels: 'ends', arrow: { at: 2500, label: 'P' } },
      { start: 7000, end: 8000, interval: 200, labels: 'ends', arrow: { at: 7400, label: 'Q' } },
      { start: 0, end: 10000, interval: 2000, labels: 'ends', arrow: { at: 8000, label: 'R' } },
    ],
  });
  assert.ok(
    stem(three) > 0.165,
    `a stacked arrow stem came out at ${stem(three).toFixed(3)}in; the deck that prompted ` +
      'this shipped 0.141in, because a flat per-line height charge scaled it to 54%'
  );
});

test('a lone line grows into a card with room to spare', () => {
  // The reported deck put one number line in a 3.7in card. Capping the drawing
  // at its natural size banked all of that as white and left the numerals
  // smaller than the card could afford.
  const roomy = draw({ x: 0.23, y: 0.77, w: 7.98, h: 3.7 },
    { start: 0, end: 10000, interval: 2500, labels: 'ends' });
  const tight = draw({ x: 0.23, y: 0.77, w: 7.98, h: 1.0 },
    { start: 0, end: 10000, interval: 2500, labels: 'ends' });
  assert.ok(
    labelled(roomy.labels, '10,000').opts.fontSize > labelled(tight.labels, '10,000').opts.fontSize,
    'a generous card should buy bigger numerals, not more white space'
  );
  for (const l of roomy.labels) assertFits(l, 'a grown numeral');
});

test('stacked lines are named down their left edge without being asked', () => {
  // A question saying "Line B: what number does Q show?" over three unnamed
  // lines makes a child work out which line is B before starting the maths.
  const three = draw(ZONE, {
    lines: [
      { start: 1000, end: 3500, interval: 500, labels: 'ends' },
      { start: 7000, end: 8000, interval: 200, labels: 'ends' },
      { start: 0, end: 10000, interval: 2000, labels: 'ends' },
    ],
  });
  const texts = three.labels.map((l) => l.text);
  for (const name of ['A', 'B', 'C']) {
    assert.ok(texts.includes(name), `expected the lines to be named; got ${texts.join(' ')}`);
  }
});

test('a single line is not named, and naming can be turned off', () => {
  const one = draw(ZONE, { start: 0, end: 10000, interval: 2500, labels: 'ends' });
  assert.ok(!one.labels.some((l) => l.text === 'A'), 'one line has nothing to be told apart from');

  const off = draw(ZONE, {
    lineLabels: false,
    lines: [
      { start: 0, end: 10000, interval: 2500, labels: 'ends' },
      { start: 4000, end: 8000, interval: 1000, labels: 'ends' },
    ],
  });
  assert.ok(!off.labels.some((l) => l.text === 'A'), 'a designer may turn the names off');
});

test('a stack in a shallow zone takes its room out of the arrows, not the numerals', () => {
  // Three arrowed lines in a 2.2in band: genuinely out of room, so something
  // has to give. It must not be the numbers.
  assert.throws(
    () => draw({ x: 0.23, y: 0.77, w: 7.98, h: 2.2 }, {
      lines: [1, 2, 3].map(() => ({
        start: 0, end: 10000, interval: 2000, labels: 'ends', arrow: { at: 4000, label: 'A' },
      })),
    }),
    /NUMBERLINE_ZONE_TOO_SHALLOW/,
    'a scale that cannot be read must fail by name while the spec is repairable'
  );
});

test('the same stack keeps its numerals once it has the room it asked for', () => {
  const deep = draw(ARROW_ZONE, {
    lines: [1, 2, 3].map(() => ({
      start: 0, end: 10000, interval: 2000, labels: 'ends', arrow: { at: 4000, label: 'A' },
    })),
  });
  for (const l of deep.labels) {
    assert.ok(
      l.opts.fontSize >= 18,
      `"${l.text}" was drawn at ${l.opts.fontSize}pt, below the readable floor for a scale`
    );
    assertFits(l, 'a numeral held at the floor');
  }
});

test('a fourth stacked line is refused, not quietly shrunk', () => {
  // Five lines on one visual made every numeral on all five too small to read
  // from the back of the room. The guidance said three was clearest and a run
  // built five anyway, so the limit is enforced where it cannot be read past.
  assert.throws(
    () => draw(ZONE, {
      lines: [1, 2, 3, 4].map(() => ({
        start: 0, end: 10000, interval: 2000, labels: 'ends',
      })),
    }),
    /NUMBERLINE_TOO_MANY_LINES: 4 stacked lines were asked for and 3 is the most/,
    'too many lines must fail by name while the spec is still repairable'
  );
});

test('three stacked lines are still fine', () => {
  const { labels } = draw(ARROW_ZONE, {
    lines: [1, 2, 3].map(() => ({
      start: 0, end: 10000, interval: 2000, labels: 'ends', arrow: { at: 4000, label: 'A' },
    })),
  });
  assert.ok(labels.length > 0, 'three lines is a comparison a child can hold, and must still draw');
});

test('the axis writes its numbers the way the question beside it does', () => {
  // The deck that prompted this asked children to "Mark 3,000 on the line" over
  // an axis labelled 3000. Year 4 is where the comma is being taught, so the
  // board was showing both conventions at once on the slide teaching it.
  const { labels } = draw(ZONE, { start: 0, end: 10000, interval: 2500, labels: 'all' });
  const texts = labels.map((l) => l.text);
  assert.ok(texts.includes('2,500'), `expected a comma'd 2,500, got ${texts.join(' ')}`);
  assert.ok(texts.includes('10,000'), `expected a comma'd 10,000, got ${texts.join(' ')}`);
  assert.ok(texts.includes('0'), 'values under a thousand keep their plain form');
});

test('decimals and small values are left alone', () => {
  const { labels } = draw(ZONE, { start: 0, end: 1, interval: 0.25, labels: 'all' });
  for (const l of labels) {
    assert.ok(!l.text.includes(','), `"${l.text}" should not have gained a separator`);
  }
});

test('a genuinely crowded axis may still shrink a numeral', () => {
  // Twenty-one labels across seven inches: this is real crowding, and capping
  // the box to the clear air between neighbours is the right answer. The rule
  // being pinned is that crowding is now the ONLY thing that shrinks a numeral.
  const { labels } = draw(ZONE, { start: 0, end: 10000, interval: 500, labels: 'all' });
  const xs = labels.map((l) => l.opts.x).sort((a, b) => a - b);
  for (let i = 1; i < xs.length; i++) {
    const prev = labels.find((l) => l.opts.x === xs[i - 1]);
    assert.ok(
      xs[i] >= xs[i - 1] + prev.opts.w - 1e-6,
      'labels on a crowded axis must not be drawn overlapping each other'
    );
  }
});
