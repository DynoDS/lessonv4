'use strict';

// The teacher's visual feedback on the decks of 28 September 2026.
//
//   1. Cards fit their words, then line up with the biggest thing beside them.
//   2. A vocabulary card's word and definition sit in the middle of the card.
//   3. A sort children do shows the cards and the places they go as different
//      things, with a gap between them and the instruction apart from both.
//   4. A calculation in a speech bubble stays on one line.

const test = require('node:test');
const assert = require('node:assert/strict');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');

const { expandTeachLayouts } = require('../src/teach-layouts');
const { stackLayout } = require('../src/content/stack');
const { drawSortBoard } = require('../src/content/sort-board');
const { drawKeyVocabulary } = require('../src/templates/key-vocabulary');
const { drawSpeechBubbles2 } = require('../src/templates/speech-bubbles');
const { textBoxWidthIn } = require('../src/glyph-width');

function slideFor() {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'W', width: 13.333, height: 7.5 });
  pptx.layout = 'W';
  return { pptx, slide: pptx.addSlide() };
}

const CTX = { slideIndex: 0, cardLook: true };
const textObjects = (slide) => slide._slideObjects.filter((o) => o._type === 'text' && !(o.options && o.options.fill) && o.text != null && textOf(o) !== '');
const textOf = (o) => (Array.isArray(o.text) ? o.text.map((r) => r.text).join('') : String(o.text));

// ─── 1. cards fit their words, then line up ───────────────────────────────

test('a Teach column sizes each card to its words at one shared size', () => {
  // Cholera slide 9: one short line and one long one beside a portrait.
  const [slide] = expandTeachLayouts({ slides: [{
    template: 'teach-layout', layout: 'lead-picture-lines', headerStyle: 'title', title: 'Who was John Snow?',
    lead: 'A doctor called John Snow thought cholera came from dirty water, not bad air.',
    pictures: [{ type: 'image', imagePath: 'portrait.jpg', essential: false }],
    lines: ['John Snow lived and worked in London.',
      'He noticed that cholera made people ill in their stomachs, not their chests. When you breathe something bad in, it\'s your chest that suffers. So he thought people must be swallowing something, not breathing it in.']
  }] }).slides;
  const columnStack = slide.primary.items[1];
  assert.equal(columnStack.fitCards, true);
  const zone = { x: 6.8, y: 1.6, w: 6.3, h: 5.4, class: 'A' };
  const laid = stackLayout(zone, columnStack, CTX);
  const [short, long] = laid;
  assert.ok(short.zone.h < long.zone.h / 2,
    `the one-line card is ${short.zone.h.toFixed(2)}in beside ${long.zone.h.toFixed(2)}in; it should fit its words`);
  assert.equal(short.item.fontSize, long.item.fontSize, 'the cards do not share one size');
  assert.ok(short.item.fontSize >= 20, `the cards print at ${short.item.fontSize}pt`);
});

test('cards far shorter than their space are centred in it, not stretched', () => {
  const zone = { x: 7, y: 0.6, w: 6, h: 6.4, class: 'C' };
  const laid = stackLayout(zone, { type: 'stack', verticalAlign: 'center', items: [
    { type: 'text', value: 'Ava used to need a rest halfway through her dance.' },
    { type: 'text', value: 'Ava often feels nervous before a test. After dance club she feels calmer.' }
  ] }, CTX);
  const top = laid[0].zone.y - zone.y;
  const last = laid[laid.length - 1].zone;
  const bottom = zone.y + zone.h - (last.y + last.h);
  assert.ok(top > 1, `the cards sit ${top.toFixed(2)}in from the top; they were pinned there`);
  assert.ok(Math.abs(top - bottom) < 0.05, `not centred: ${top.toFixed(2)}in above, ${bottom.toFixed(2)}in below`);
});

// The teacher's answer, 29 September 2026: never stretch, always fit and
// centre. Cholera slide 18: a question and an instruction beside a criteria
// panel that runs the full height used to stretch to it; they are centred on
// it with a small, even gap above and below.
test('cards nearly as tall as their neighbour are centred on it, never stretched', () => {
  const zone = { x: 0.2, y: 0.6, w: 6.3, h: 6.65, class: 'C' };
  const laid = stackLayout(zone, { type: 'stack', verticalAlign: 'center', items: [
    { type: 'text', value: 'Why did taking the handle off the pump stop {{cholera}}, when burning tar in the streets didn\'t?',
      colorRole: 'focus-blue', align: 'center', weight: 1.2, fontSize: 40 },
    { type: 'text', value: 'Tell your partner first, then write your answer.', align: 'center', weight: 0.7, fontSize: 32 }
  ] }, CTX);
  const top = laid[0].zone.y - zone.y;
  const last = laid[laid.length - 1].zone;
  const bottom = zone.y + zone.h - (last.y + last.h);
  assert.ok(top > 0.05, `the cards were stretched to the top (${top.toFixed(2)}in gap)`);
  assert.ok(Math.abs(top - bottom) < 0.05, `not centred: ${top.toFixed(2)}in above, ${bottom.toFixed(2)}in below`);
  laid.forEach((entry) => assert.ok(!entry.zone.matchCardHeight, 'a card was stretched past its words'));
});

test('a Teach column never stretches its cards to fill the column', () => {
  const zone = { x: 0.2, y: 0.6, w: 6.3, h: 3.2, class: 'C' };
  const laid = stackLayout(zone, { type: 'stack', verticalAlign: 'center', fitCards: true, items: [
    { type: 'text', value: 'A long enough line that takes a good share of the space it has been given here.', heightMode: 'fill' },
    { type: 'text', value: 'And a second line of about the same length to go with it, filling the rest.', heightMode: 'fill' }
  ] }, CTX);
  const used = laid.reduce((sum, entry) => sum + entry.zone.h, 0) + 0.1;
  const top = laid[0].zone.y - zone.y;
  const bottom = zone.y + zone.h - (laid[1].zone.y + laid[1].zone.h);
  assert.ok(used <= zone.h + 1e-6);
  assert.ok(Math.abs(top - bottom) < 0.02, `not centred: ${top.toFixed(2)}in above, ${bottom.toFixed(2)}in below`);
});

// ─── 2. the vocabulary card centres its words ─────────────────────────────

test('a vocabulary card with a tall picture holds its word and definition in the middle', () => {
  const { pptx, slide } = slideFor();
  drawKeyVocabulary(pptx, slide, { words: [{ word: 'condensation',
    definition: 'Condensation is when water vapour cools down and turns back into tiny drops of liquid water.',
    visual: { type: 'image', imagePath: 'not-yet.jpg', essential: true } }] }, CTX);
  const word = textObjects(slide).find((o) => textOf(o) === 'condensation');
  const card = slide._slideObjects.find((o) => o.options && o.options.fill && o.options.fill.color === 'D5F5E3');
  const gapAbove = word.options.y - card.options.y;
  assert.ok(gapAbove > 1, `the word sits ${gapAbove.toFixed(2)}in from the top of a ${card.options.h.toFixed(2)}in card`);
});

// ─── 3. a sort shows cards and places apart ───────────────────────────────

test('a sort children do draws cards, a gap, then tinted dashed places to put them', () => {
  const { pptx, slide } = slideFor();
  drawSortBoard(pptx, slide, { x: 0.22, y: 1.5, w: 12.9, h: 5.7 }, {
    instruction: 'Sort the cards into the two groups.',
    bank: ['Burn tar in the street to clean the air.', 'Stop drinking water from the street pump.',
      'Hold a cloth soaked in vinegar over your nose.', 'Boil the water before you drink it.',
      'Sweep the rotting rubbish away.', 'Wash the toilet waste out of the streets and into the river.'],
    groups: [{ label: 'Things you\'d try if you blamed the bad air' }, { label: 'Things you wouldn\'t even think of' }]
  });
  const shapes = slide._slideObjects.filter((o) => o.options && o.options.fill);
  const cards = shapes.filter((o) => o.options.fill.color === 'FFFFFF');
  const places = shapes.filter((o) => o.options.fill.color !== 'FFFFFF');
  assert.equal(cards.length, 6);
  assert.equal(places.length, 2);
  places.forEach((p) => assert.equal(p.options.line.dashType, 'dash', 'a place to put cards is not dashed'));
  const lowestCard = Math.max(...cards.map((c) => c.options.y + c.options.h));
  const firstPlace = Math.min(...places.map((p) => p.options.y));
  assert.ok(firstPlace - lowestCard >= 0.3, `only ${(firstPlace - lowestCard).toFixed(2)}in between the cards and the groups`);
  const instruction = textObjects(slide).find((o) => textOf(o).startsWith('Sort the cards'));
  const firstCard = Math.min(...cards.map((c) => c.options.y));
  assert.ok(instruction && firstCard - (instruction.options.y + instruction.options.h) >= 0.15,
    'the instruction is not set apart from the cards');
});

test('a sort with a bank refuses groups that already hold answers', () => {
  const { pptx, slide } = slideFor();
  assert.throws(() => drawSortBoard(pptx, slide, { x: 0.2, y: 1, w: 12, h: 5 }, {
    bank: ['a', 'b'], groups: [{ label: 'x', items: ['a'] }, { label: 'y' }]
  }), /SORT_BOARD_BANK_WITH_ANSWERS/);
});

// ─── 4. a calculation stays whole in a speech bubble ──────────────────────

test('a calculation in a speech bubble stays on one line', () => {
  const { pptx, slide } = slideFor();
  drawSpeechBubbles2(pptx, slide, { headerStyle: 'title', title: 'Apply', statementSide: 'right', statementRatio: 0.6,
    statement: { type: 'image', imagePath: 'x.jpg', essential: false },
    speakers: [{ child: 'girl-1', name: 'Grace', speech: '5,372 − 2,146\n= 3,234.' },
      { child: 'boy-1', name: 'Freya', speech: '5,372 − 2,146\n= 3,226.' }] }, CTX);
  const speech = textObjects(slide).find((o) => textOf(o).includes('3,234'));
  const words = textOf(speech);
  const calc = words.split('\n')[0];
  assert.doesNotMatch(calc, / /, 'the calculation can still break at an ordinary space');
  // Within the few per cent the width table keeps in hand; the fit pass
  // measures the real font and holds it on one line.
  assert.ok(textBoxWidthIn(calc.replace(/\u00a0/g, ' ').replace(/\u2212/g, '-'), speech.options.fontSize, true) <= speech.options.w * 1.06,
    `"${calc}" at ${speech.options.fontSize}pt is wider than its ${speech.options.w.toFixed(2)}in box`);
  assert.ok(speech.options.fontSize >= 18);
});

// When the statement beside the speakers can give up width, the speakers take
// it, so a calculation prints near the bubble's full size rather than at the
// floor (the teacher's go-ahead, 29 September 2026).
test('speakers saying a calculation are given the width it needs', () => {
  const speakers = [{ child: 'girl-1', name: 'Grace', speech: '5,372 − 2,146\n= 3,234.' },
    { child: 'boy-1', name: 'Freya', speech: '5,372 − 2,146\n= 3,226.' }];
  const sizeFor = (statementRatio) => {
    const { pptx, slide } = slideFor();
    drawSpeechBubbles2(pptx, slide, { headerStyle: 'title', title: 'Apply', statementSide: 'right', statementRatio,
      statement: { type: 'stack', items: [{ type: 'text', value: 'Who is correct? Explain your answer.' }] },
      speakers }, CTX);
    return textObjects(slide).find((o) => textOf(o).includes('3,234')).options.fontSize;
  };
  const size = sizeFor(0.6);
  assert.ok(size >= 28, `the calculation prints at ${size}pt beside a statement that could give up width`);
});

test('speech with no calculation keeps the width the design asked for', () => {
  const draw = (speech) => {
    const { pptx, slide } = slideFor();
    drawSpeechBubbles2(pptx, slide, { headerStyle: 'title', title: 'Apply', statementSide: 'right', statementRatio: 0.6,
      statement: { type: 'stack', items: [{ type: 'text', value: 'Who is correct?' }] },
      speakers: [{ child: 'girl-1', speech }, { child: 'boy-1', speech }] }, CTX);
    return textObjects(slide).find((o) => textOf(o) === speech).options.x;
  };
  // The speakers stand on the left, and each bubble's text starts just inside it.
  assert.ok(Math.abs(draw('It is bigger.') - 0.44) < 0.02, 'a plain claim moved');
});
