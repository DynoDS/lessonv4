'use strict';

// The teacher's review of five decks built on 4.2.301 (29 September 2026).
//
//   1. Starter question sets filled a strip, not the body.
//   2. A text picture on a vocabulary card printed small in a tall panel.
//   3. The method frame's labels wrapped over four lines.
//   4. Class children sat on white picture cards.
//   5. Signs (pencil, talk, magnifier, tick) could not be put on the board.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');

const { drawContent } = require('../src/content');
const { drawKeyVocabulary } = require('../src/templates/key-vocabulary');
const { expandTeachLayouts } = require('../src/teach-layouts');
const { validateLesson } = require('../src/validate');
const { textBoxWidthIn } = require('../src/glyph-width');

function slideFor() {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'W', width: 13.333, height: 7.5 });
  pptx.layout = 'W';
  return { pptx, slide: pptx.addSlide() };
}
const CTX = { slideIndex: 0, cardLook: true };
const texts = (slide) => slide._slideObjects.filter((o) => o._type === 'text' && o.text != null &&
  !(o.options && o.options.fill));
const textOf = (o) => (Array.isArray(o.text) ? o.text.map((r) => r.text).join('') : String(o.text))
  .replace(/ /g, ' ');

// The body of a starter slide: below the Date, LO and Starter rows.
const STARTER_BODY = { x: 0.22, y: 2.52, w: 12.893, h: 4.73, class: 'A' };
const SUMS = ['6 + 4 =', '3 + ___ = 10', '10 - 2 =', '10 + 8 =', '10 + ___ = 15'];

// ─── 1. starter question sets fill the body ───────────────────────────────

test('five short starter sums on question cards print large, not in a strip', () => {
  const { pptx, slide } = slideFor();
  drawContent(pptx, slide, STARTER_BODY, { type: 'question-cards', questions: SUMS }, CTX);
  const sizes = texts(slide).filter((o) => SUMS.some((q) => textOf(o).includes(q.slice(0, 4))))
    .map((o) => o.options.fontSize);
  assert.ok(sizes.length >= 5);
  assert.ok(Math.min(...sizes) >= 36, `the sums print at ${Math.min(...sizes)}pt`);
});

test('five starter questions with answer boxes use the width, not one narrow column', () => {
  const { pptx, slide } = slideFor();
  drawContent(pptx, slide, STARTER_BODY, { type: 'numbered-questions', answerBoxes: true,
    questions: ['34 + 20 =', '34 + 50 =', '134 + 30 =', '58 + ___ = 60', '73 + ___ = 80'] }, CTX);
  const questions = texts(slide).filter((o) => /\d+ \+/.test(textOf(o)));
  const lefts = new Set(questions.map((o) => o.options.x.toFixed(1)));
  assert.ok(lefts.size > 1, 'the questions stayed in one column');
  assert.ok(questions[0].options.fontSize >= 32, `the questions print at ${questions[0].options.fontSize}pt`);
});

// ─── 2. a text picture on a vocabulary card fills its panel ───────────────

test('a number sentence on a vocabulary card prints large', () => {
  const { pptx, slide } = slideFor();
  drawKeyVocabulary(pptx, slide, { words: [{ word: 'number bond',
    definition: 'Two numbers that add together to make a total are a number bond. 7 and 3 are a number bond to 10.',
    visual: { type: 'text', value: '7 + 3 = 10', fontSize: 26 } }] }, CTX);
  const sentence = texts(slide).find((o) => textOf(o) === '7 + 3 = 10');
  assert.ok(sentence, 'the number sentence was not drawn');
  assert.ok(sentence.options.fontSize >= 44, `it prints at ${sentence.options.fontSize}pt`);
});

test('a family of number bonds lays out in columns', () => {
  const { pptx, slide } = slideFor();
  const family = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((a) => `${a} + ${10 - a} = {{10}}`).join('\n');
  drawKeyVocabulary(pptx, slide, { words: [{ word: 'number bond', definition: 'Two numbers that make a total.',
    visual: { type: 'text', value: family } }] }, CTX);
  const lines = texts(slide).filter((o) => /= 10$/.test(textOf(o)));
  assert.equal(lines.length, 11, 'every bond gets its own line');
  const columns = new Set(lines.map((o) => o.options.x.toFixed(1)));
  assert.ok(columns.size >= 2, 'the family was not laid out in columns');
  assert.ok(lines[0].options.fontSize >= 20, `the bonds print at ${lines[0].options.fontSize}pt`);
});

// ─── 3. the method frame keeps each step on one line ──────────────────────

test('method frame labels take at most two lines, broken by the builder, and the panel hugs its steps', () => {
  const { pptx, slide } = slideFor();
  const zone = { x: 0.22, y: 2.05, w: 7.99, h: 5.2, class: 'B' };
  drawContent(pptx, slide, zone, { type: 'method-frame', numbered: true, lines: [
    { label: 'Two numbers that make 10:', content: '___ + ___ = 10' },
    { label: 'Add the last number:', content: '10 + ___ = ___' }
  ] }, CTX);
  const panel = slide._slideObjects.find((o) => o.options && o.options.fill && o.options.fill.color === 'EDE7F6'
    || (o.options && o.options.line && o.options.line.color === '7030A0' && o.options.h > 0.5));
  assert.ok(panel, 'no purple panel drawn');
  assert.ok(panel.options.h < zone.h * 0.6, `the panel is ${panel.options.h.toFixed(2)}in tall in a ${zone.h}in zone`);
  // Since 2 October 2026 a label may take a second line when that prints the
  // frame at least 3pt bigger (the teacher chose it after seeing both); what
  // this pins is that the break is the builder's, written in, never a third
  // line, and never a line PowerPoint would wrap again.
  const labels = texts(slide).filter((o) => /make 10:|last number:/.test(textOf(o).replace(/\n/g, ' ')));
  assert.equal(labels.length, 2, 'a label is missing');
  labels.forEach((o) => {
    const lines = textOf(o).split('\n');
    assert.ok(lines.length <= 2, `"${textOf(o)}" took ${lines.length} lines`);
    lines.forEach((line) => assert.ok(textBoxWidthIn(line, o.options.fontSize, true) <= o.options.w + 1e-6,
      `"${line}" is wider than its box and would wrap`));
  });
  const circles = slide._slideObjects.filter((o) => o.options && o.options.fill && o.options.fill.color === '00B050');
  assert.equal(circles.length, 2, 'the steps are not numbered');
});

// ─── 4. class children stand on the slide, never on a card ─────────────────

test('a class child is drawn with no card behind it', () => {
  const { pptx, slide } = slideFor();
  const child = path.join(__dirname, '..', 'assets', 'children', 'boy-2.png');
  drawContent(pptx, slide, { x: 1, y: 1, w: 3, h: 4, class: 'C' },
    { type: 'image', imagePath: child, fit: 'contain', essential: false },
    Object.assign({}, CTX, { imageDims: { [child]: { w: 757, h: 975 } } }));
  const cards = slide._slideObjects.filter((o) => o.options && o.options.fill &&
    o.options.fill.color === 'FFFFFF');
  assert.equal(cards.length, 0, 'the class child was put on a white card');
});

// ─── 5. signs ─────────────────────────────────────────────────────────────

test('a text card with a pencil sign draws it at the start of the card', () => {
  const { pptx, slide } = slideFor();
  drawContent(pptx, slide, { x: 1, y: 1, w: 8, h: 1.2, class: 'C' },
    { type: 'text', value: 'Finish the sentence: Harry could ___ because ___.', signal: 'pencil' }, CTX);
  const icon = slide._slideObjects.find((o) => o._type === 'image' && /pencil\.png$/.test(String(o.image || o.path || '')));
  assert.ok(icon, 'no pencil drawn');
  const words = texts(slide).find((o) => textOf(o).includes('Finish'));
  assert.ok(words.options.x >= icon.options.x + icon.options.w, 'the words sit on top of the sign');
});

test('a sign must be one of the four, and a line to remember takes none', () => {
  const lesson = (body, extra) => ({ lessonName: 'x', slides: [Object.assign({ template: 'body-full',
    headerStyle: 'title', title: 'x', speakerNotes: 'Say to children: x', body }, extra || {})] });
  const bad = validateLesson(lesson({ type: 'text', value: 'Write it.', signal: 'rocket' }), __dirname);
  assert.ok(bad.errors.some((e) => /not a sign/.test(e)), bad.errors.join('\n'));
  const twice = validateLesson(lesson({ type: 'text', value: '✨ Keep this.', signal: 'pencil' }), __dirname);
  assert.ok(twice.errors.some((e) => /one sign/.test(e)), twice.errors.join('\n'));
  const header = validateLesson(lesson({ type: 'text', value: 'Write it.' }, { signal: 'talk' }), __dirname);
  assert.ok(header.warnings.some((w) => /no `instruction`/.test(w)), header.warnings.join('\n'));
});

test('a teach-layout slide carries its header sign through', () => {
  const [slide] = expandTeachLayouts({ slides: [{ template: 'teach-layout', layout: 'statement-support-sticky',
    headerStyle: 'title', title: 'x', instruction: 'Talk to your partner.', signal: 'talk',
    lead: 'A symbol stands for something.', lines: ['It sends a message.'], sticky: 'People know it.' }] }).slides;
  assert.equal(slide.signal, 'talk');
});
