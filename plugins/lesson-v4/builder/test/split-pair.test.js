'use strict';

// A side-by-side split pair is settled before it is drawn: a `fill` text card
// spans the pair (never towering over a shorter partner), its type grows
// through the fit pass, and a shorter measured member centres on the pair.
// These are the faults the teacher kept repairing by hand on the series-circuit
// deck: full-height answer and vocabulary cards beside half-height photos, and
// photos pinned to the top of a void.

const test = require('node:test');
const assert = require('node:assert/strict');

const { drawSplitH7030 } = require('../src/templates/split-h-70-30');
const { drawSplitH6040 } = require('../src/templates/split-h-60-40');
const { drawTeachCompare } = require('../src/templates/teach-compare');
const { alignSplitHPair } = require('../src/split-pair');
const { CARD } = require('../src/styles');

function fakePptx() {
  return {
    shapes: { ROUNDED_RECTANGLE: 'roundRect', RECTANGLE: 'rect', LINE: 'line', OVAL: 'oval' },
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

function cards(slide) {
  return slide.shapes
    .filter((s) => s.type === 'roundRect' && s.options.fill && s.options.fill.color === CARD.fill);
}

const PROSE =
  'An electrical appliance uses electricity to do its main job.\n\n' +
  'Appliances can use mains electricity or batteries.\n\n' +
  'A torch can use electricity from cells instead of mains electricity.';

test('a fill text beside a shorter image spans the pair, not the whole zone', () => {
  const slide = fakeSlide();
  drawSplitH7030(fakePptx(), slide, {
    title: 'Starter answers',
    primarySide: 'left',
    primary: { type: 'text', value: PROSE, heightMode: 'fill' },
    // No file on disk: an essential image draws the square pending placeholder,
    // whose measured card is far shorter than the body zone.
    secondary: { type: 'image', imagePath: 'not-on-disk.png' }
  }, ctx());

  const drawn = cards(slide);
  assert.equal(drawn.length, 2);
  const [textCard, imageCard] = drawn;
  const bodyH = 6.65;

  // The image's square placeholder binds on its zone's width, so its card is
  // well under the body height; the fill card matches the taller member of the
  // pair (here its own hugged prose), never the empty remainder of the zone.
  assert.ok(imageCard.options.h < bodyH - 1, `image card ${imageCard.options.h} should be short`);
  assert.ok(textCard.options.h < bodyH - 0.5, `fill card ${textCard.options.h} should not span the zone`);

  // The shorter member is centred on the pair rather than pinned to the top.
  assert.ok(imageCard.options.y > textCard.options.y + 0.3,
    `image card y ${imageCard.options.y} should sit below the pair top ${textCard.options.y}`);
  const pairBottom = textCard.options.y + textCard.options.h;
  const imageBottom = imageCard.options.y + imageCard.options.h;
  assert.ok(pairBottom - imageBottom > 0.3, 'image card should also clear the pair bottom');
});

test('a fill text beside an unmeasured panel keeps the whole zone and grows as prose', () => {
  const slide = fakeSlide();
  drawSplitH6040(fakePptx(), slide, {
    title: 'My Turn',
    primarySide: 'left',
    primary: {
      type: 'text',
      value: 'Using one cell, one lamp in a holder, one switch and connecting wires, build a working series circuit.',
      heightMode: 'fill'
    },
    secondary: { type: 'stack', items: [{ type: 'text', value: 'Partner content that spans its zone.' }] }
  }, ctx());

  const drawn = cards(slide);
  const textCard = drawn[0];
  assert.ok(textCard.options.h > 6.5, `fill card beside a spanning partner keeps the zone (${textCard.options.h})`);

  const fillText = slide.texts.find((t) => t.options.objectName && t.options.objectName.includes('fill-text'));
  assert.ok(fillText, 'fill text should carry a GROWFIT object name');
  // 18 words of running prose grow to the prose ceiling, not the display ceiling.
  assert.match(fillText.options.objectName, /^GROWFIT__fill-text-[\d-]+__44__fill-text$/);
});

test('a short display line under fill takes the display ceiling', () => {
  const slide = fakeSlide();
  drawSplitH7030(fakePptx(), slide, {
    title: 'Key Vocabulary',
    primarySide: 'left',
    primary: {
      type: 'text',
      value: 'series circuit\n\na circuit with one complete loop for all the components',
      heightMode: 'fill'
    },
    secondary: { type: 'image', imagePath: 'not-on-disk.png' }
  }, ctx());

  const fillText = slide.texts.find((t) => t.options.objectName && t.options.objectName.includes('fill-text'));
  assert.ok(fillText, 'fill text should carry a GROWFIT object name');
  assert.match(fillText.options.objectName, /__60__fill-text$/);
});

test('an explicit fontSize replaces the fill growth ceiling', () => {
  const slide = fakeSlide();
  drawSplitH7030(fakePptx(), slide, {
    title: 'Sized by hand',
    primarySide: 'left',
    primary: { type: 'text', value: 'A deliberate forty-point line.', heightMode: 'fill', fontSize: 40 },
    secondary: { type: 'image', imagePath: 'not-on-disk.png' }
  }, ctx());

  const fillText = slide.texts.find((t) => t.options.objectName && t.options.objectName.includes('fill-text'));
  assert.match(fillText.options.objectName, /__40__fill-text$/);
});

test('a hugged text pair is untouched: no growth name, cards still hug', () => {
  const slide = fakeSlide();
  drawSplitH7030(fakePptx(), slide, {
    title: 'Control',
    primarySide: 'left',
    primary: { type: 'text', value: 'A short hugged statement.' },
    secondary: { type: 'image', imagePath: 'not-on-disk.png' }
  }, ctx());

  const withName = slide.texts.filter((t) => t.options.objectName && t.options.objectName.includes('fill-text'));
  assert.equal(withName.length, 0);
  const drawn = cards(slide);
  assert.equal(drawn.length, 2);
  assert.ok(drawn[0].options.h < 2, `hugged text card stays tight (${drawn[0].options.h})`);
});

test('alignSplitHPair leaves a pair alone when either side is absent', () => {
  const zoneA = { x: 0.22, y: 0.6, w: 8, h: 6.65, class: 'E-wide' };
  const zoneB = { x: 8.5, y: 0.6, w: 4, h: 6.65, class: 'E-narrow' };
  alignSplitHPair(zoneA, { type: 'text', value: 'Alone', heightMode: 'fill' }, zoneB, null, ctx());
  assert.equal(zoneA.h, 6.65);
  assert.equal(zoneB.y, 0.6);
});

test('teach-compare headingRole vocabulary turns both headings green, borders stay', () => {
  const slide = fakeSlide();
  drawTeachCompare(fakePptx(), slide, {
    title: 'Key Vocabulary',
    headingRole: 'vocabulary',
    leftHeading: 'complete',
    rightHeading: 'incomplete',
    leftContent: { type: 'text', value: 'A complete circuit has no gap.' },
    rightContent: { type: 'text', value: 'An incomplete circuit has a gap.' }
  }, ctx());

  const headings = slide.texts.filter((t) => t.value === 'complete' || t.value === 'incomplete');
  assert.equal(headings.length, 2);
  headings.forEach((h) => assert.equal(h.options.color, '00B050'));

  const borders = slide.shapes
    .filter((s) => s.type === 'roundRect' && s.options.line && s.options.line.color)
    .map((s) => s.options.line.color);
  assert.ok(borders.includes('0070C0') && borders.includes('E46C0A'),
    'the card borders keep the template pairing');
});

test('without headingRole the headings keep their category colours', () => {
  const slide = fakeSlide();
  drawTeachCompare(fakePptx(), slide, {
    title: 'Compare',
    leftHeading: 'National',
    rightHeading: 'Local',
    leftContent: { type: 'text', value: 'Runs the country.' },
    rightContent: { type: 'text', value: 'Runs local services.' }
  }, ctx());

  const left = slide.texts.find((t) => t.value === 'National');
  const right = slide.texts.find((t) => t.value === 'Local');
  assert.equal(left.options.color, '0070C0');
  assert.equal(right.options.color, 'E46C0A');
});
