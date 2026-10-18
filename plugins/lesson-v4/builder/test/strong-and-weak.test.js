'use strict';

// The launch's good instance beside the weak one.
//
// Before this template existed the pair was one prose string in the lesson
// design, and three Year 4 decks each assembled it by hand as two plain white
// boxes with `Strong:` and `Weak:` typed inside the sentences - on a different
// side each time, nothing to tell one card from the other, and on the science
// deck of 18 September 2026 four tenths of the slide spent on prose explaining a
// contrast the two boxes were already showing.

const test = require('node:test');
const assert = require('node:assert/strict');

const { COLOURS, CARD } = require('../src/styles');
const { drawStrongAndWeak } = require('../src/templates/strong-and-weak');

function fakePptx() {
  return {
    shapes: { ROUNDED_RECTANGLE: 'roundRect', RECTANGLE: 'rect', LINE: 'line' },
    ShapeType: { ellipse: 'ellipse' }
  };
}

function fakeSlide() {
  return {
    shapes: [],
    texts: [],
    images: [],
    addShape(type, options) { this.shapes.push({ type, options }); },
    addText(value, options) { this.texts.push({ value, options }); },
    addImage(options) { this.images.push(options); }
  };
}

function ctx() {
  return { cardLook: true, slideIndex: 0 };
}

function slideWith(extra) {
  return Object.assign({
    template: 'strong-and-weak',
    headerStyle: 'title',
    title: 'What a good explanation does',
    strongHeading: 'An explanation',
    weakHeading: 'Not an explanation',
    strong: { type: 'text', value: 'Sugar is left on his teeth, so the germs feed on it and make acid.' },
    weak: { type: 'text', value: 'Jack eats toffees. Germs make acid.' },
    difference: 'Every sentence picks up the thing before it.'
  }, extra || {});
}

function cards(slide) {
  return slide.shapes.filter((s) => s.type === 'roundRect');
}

function marks(slide) {
  return slide.shapes.filter((s) => s.type === 'line');
}

test('the two cards are marked: the good one black, the weak one red', () => {
  const slide = fakeSlide();
  drawStrongAndWeak(fakePptx(), slide, slideWith(), ctx());

  const drawn = cards(slide);
  assert.equal(drawn.length, 2, 'one card each side');
  assert.equal(drawn[0].options.line.color, COLOURS.green);
  assert.equal(drawn[1].options.line.color, COLOURS.problem);
  assert.equal(drawn[0].options.line.width, CARD.categoryLineW);

  // Two strokes per mark: a tick on the left card, a cross on the right.
  const strokes = marks(slide);
  assert.equal(strokes.length, 4);
  assert.deepEqual(
    strokes.map((s) => s.options.line.color),
    [COLOURS.green, COLOURS.green, COLOURS.problem, COLOURS.problem]
  );
});

test('the marks are drawn, never typed: no font can substitute or recolour them', () => {
  const slide = fakeSlide();
  drawStrongAndWeak(fakePptx(), slide, slideWith(), ctx());
  const printed = slide.texts.map((t) => String(t.value)).join(' ');
  assert.ok(!/[✓✔✗✘❌✅]/.test(printed),
    'a tick or cross glyph reached the slide as text');
  assert.equal(slide.images.length, 0, 'the drawn signal set is left alone');
});

test('the two headings are the design\'s own words, coloured by side', () => {
  const slide = fakeSlide();
  drawStrongAndWeak(fakePptx(), slide, slideWith(), ctx());
  const strong = slide.texts.find((t) => t.value === 'An explanation');
  const weak = slide.texts.find((t) => t.value === 'Not an explanation');
  assert.ok(strong && weak, 'both headings printed');
  assert.equal(strong.options.color, COLOURS.body);
  assert.equal(weak.options.color, COLOURS.problem);
});

test('the weak instance prints red throughout and loses its emphasis marks', () => {
  const slide = fakeSlide();
  drawStrongAndWeak(fakePptx(), slide, slideWith({
    weak: {
      type: 'text',
      value: 'Germs make acid.',
      emphasis: [{ text: 'acid', role: 'vocabulary' }]
    }
  }), ctx());
  const weak = slide.texts.find((t) => {
    const runs = Array.isArray(t.value) ? t.value : [{ text: t.value }];
    return runs.some((r) => String(r.text).includes('Germs make acid'));
  });
  assert.ok(weak, 'the weak instance reached the slide');
  assert.equal(weak.options.color, COLOURS.problem);
  const runs = Array.isArray(weak.value) ? weak.value : [];
  runs.forEach((run) => {
    assert.notEqual(run.options && run.options.color, COLOURS.green,
      'vocabulary green survived inside the red card');
  });
});

test('the strong instance keeps its taught words green inside a black card', () => {
  const slide = fakeSlide();
  drawStrongAndWeak(fakePptx(), slide, slideWith({
    strong: {
      type: 'text',
      value: 'The acid eats the enamel away.',
      emphasis: [{ text: 'enamel', role: 'vocabulary' }]
    }
  }), ctx());
  const green = slide.texts.some((t) => {
    const runs = Array.isArray(t.value) ? t.value : [];
    return runs.some((r) => r.options && r.options.color === COLOURS.textGreen);
  });
  assert.ok(green, 'the taught word lost its vocabulary green');
});

test('a pair with nothing above or below it is the two cards alone', () => {
  const slide = fakeSlide();
  drawStrongAndWeak(fakePptx(), slide, slideWith({
    difference: null,
    established: null
  }), ctx());
  assert.equal(cards(slide).length, 2);
  const printed = slide.texts.map((t) => String(t.value));
  assert.ok(!printed.includes('Every sentence picks up the thing before it.'));
});

test('the gathering line prints above the pair only when the design carries one', () => {
  const withLine = fakeSlide();
  drawStrongAndWeak(fakePptx(), withLine, slideWith({
    established: 'We have built the whole chain.'
  }), ctx());
  const line = withLine.texts.find((t) => t.value === 'We have built the whole chain.');
  assert.ok(line, 'the gathering line printed');

  const cardTop = Math.min(...cards(withLine).map((c) => c.options.y));
  assert.ok(line.options.y < cardTop, 'the gathering line sits above the cards');
});

test('short instances hug their cards instead of stretching down the body', () => {
  const short = fakeSlide();
  drawStrongAndWeak(fakePptx(), short, slideWith({
    strong: { type: 'text', value: 'One line.' },
    weak: { type: 'text', value: 'One line.' }
  }), ctx());

  const long = fakeSlide();
  drawStrongAndWeak(fakePptx(), long, slideWith({
    strong: { type: 'text', value: ('A much longer instance. ').repeat(20) },
    weak: { type: 'text', value: ('A much longer instance. ').repeat(20) }
  }), ctx());

  const shortH = cards(short)[0].options.h;
  const longH = cards(long)[0].options.h;
  assert.ok(shortH < longH, 'a one-line pair took the same height as a long one');
  assert.equal(cards(short)[0].options.h, cards(short)[1].options.h,
    'the pair stays a matched pair');
  assert.equal(cards(short)[0].options.y, cards(short)[1].options.y);
});

test('both cards are the same width and sit either side of one gap', () => {
  const slide = fakeSlide();
  drawStrongAndWeak(fakePptx(), slide, slideWith(), ctx());
  const [left, right] = cards(slide).map((c) => c.options);
  assert.equal(left.w, right.w);
  assert.ok(right.x > left.x + left.w, 'the cards overlap');
});

// The model is the first look at the task, so the unit's criteria may stand
// beside it. Every sound deck of 17 October 2026 drew them only on the writing
// slide, because this board had nowhere to put them.
test('criteria stand down the right and the pair keeps to the room left of them', () => {
  const PptxGenJS = require('pptxgenjs');
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  const plain = pptx.addSlide();
  const withCriteria = pptx.addSlide();
  const steps = { type: 'steps', steps: ['Say what you do.', 'Say which part vibrates.', 'Say why it stops.'] };
  drawStrongAndWeak(pptx, plain, slideWith(), ctx());
  drawStrongAndWeak(pptx, withCriteria, slideWith({ criteria: steps }), ctx());

  const shapesOf = (slide) => slide._slideObjects.filter((o) => o._type === 'text' || o._type === 'shape');
  const roundCards = (slide) => slide._slideObjects
    .filter((o) => o.options && o.options.line && [COLOURS.green, COLOURS.problem].includes(o.options.line.color) &&
      o.options.rectRadius !== undefined);
  const inches = (v) => (typeof v === 'number' && v > 100 ? v / 914400 : v);
  // The good card is the leftmost green edge (the criteria panel is green too),
  // the weak card the red one.
  const pair = (slide) => {
    const found = roundCards(slide).map((o) => o.options);
    const greens = found.filter((o) => o.line.color === COLOURS.green)
      .sort((a, b) => inches(a.x) - inches(b.x));
    return [greens[0], found.find((o) => o.line.color === COLOURS.problem)];
  };
  const [plainStrong, plainWeak] = pair(plain);
  const [strong, weak] = pair(withCriteria);

  assert.ok(inches(strong.w) < inches(plainStrong.w), 'the pair narrows to make room for the criteria');
  assert.equal(inches(strong.w), inches(weak.w), 'the pair stays a matched pair');
  const words = shapesOf(withCriteria).map((o) => o.text).flat().map((t) => (t && t.text) || t).join(' ');
  assert.match(String(words), /Say which part vibrates/);
  assert.ok(shapesOf(withCriteria).length > shapesOf(plain).length);
  assert.ok(inches(weak.x) + inches(weak.w) < inches(plainWeak.x) + inches(plainWeak.w),
    'the weak card ends left of where the panel stands');
});

test('criteria that are not success criteria are refused by name', () => {
  assert.throws(
    () => drawStrongAndWeak(fakePptx(), fakeSlide(), slideWith({ criteria: { type: 'text', value: 'x' } }), ctx()),
    /"criteria" takes an "sc-panel"/
  );
});
