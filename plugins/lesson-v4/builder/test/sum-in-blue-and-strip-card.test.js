'use strict';

// Two things the teacher said of a Year 4 column addition deck on 6 October
// 2026, shown the delivered slides beside the slide designer's first drafts.
//
//   1. "I'd prefer 'Use column...' black though and question blue." A block
//      that names the method and then sets the sum prints the sum in question
//      blue and leaves the method line black.
//   2. "Card makes it look better though." A question line set in a strip too
//      thin for its written size was fitted smaller and lost its white card.

const test = require('node:test');
const assert = require('node:assert/strict');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');

const { presentationRuns, isSumToWorkOut } = require('../src/presentation-text');
const { drawContent } = require('../src/content');
const { COLOURS } = require('../src/styles');

function colours(runs) {
  // A calculation's spaces are no-break spaces by the time it is printed.
  return runs.filter((run) => run.text !== '\n')
    .map((run) => [run.text.replace(/ /g, ' '), run.options.color]);
}

test('the sum is blue and the line naming the method stays black', () => {
  const runs = presentationRuns('Use column addition with one exchange.\n236 + 148 =', true, COLOURS.body, {});
  assert.deepEqual(colours(runs), [
    ['Use column addition with one exchange.', COLOURS.body],
    ['236 + 148 =', COLOURS.title]
  ]);
});

test('on the answer slide the sum stays blue and its answer stays green', () => {
  const runs = presentationRuns('Use column addition.\n\n236 + 148 = ||384', true, COLOURS.body, {});
  const seen = colours(runs);
  assert.equal(seen[0][1], COLOURS.body);
  assert.deepEqual(seen[1], ['236 + 148 = ', COLOURS.title]);
  assert.deepEqual(seen[2], ['384', COLOURS.green]);
});

test('a line counts as the sum only when it is left for the child to finish', () => {
  ['247 + 135 =', '3,426 + 237 = ___', '4 × ? = 12', '£2.50 + £1.25 =', '236 + 148 = ||384']
    .forEach((line) => assert.equal(isSumToWorkOut(line), true, line));
  ['6 + 7 = 13', 'Use column addition.', '= 5', 'Add 236 and 148.']
    .forEach((line) => assert.equal(isSumToWorkOut(line), false, line));
});

test('what the board already printed in one colour is left as it was', () => {
  // A list of sums with no instruction among them, a sum standing alone, a
  // finished number sentence in a line of teaching, and a block the designer
  // gave a role or a colour of its own.
  // One plain string back means one colour: the block's own.
  const same = (text, base, owner) =>
    assert.equal(typeof presentationRuns(text, true, base, owner || {}), 'string', text);
  same('236 + 148 =\n3 + 4 =', COLOURS.body);
  same('236 + 148 =', COLOURS.body);
  same('Look at this.\n6 + 7 = 13', COLOURS.body);
  same('Use column addition.\n236 + 148 =', COLOURS.body, { colorRole: 'task-blue' });
  same('Use column addition.\n236 + 148 =', COLOURS.orange);
});

// 3. Asked what colour the sum above a worked answer should be: "whatever
//    colour it was on the previous slide". An answers slide follows its task.
const {
  setSumsFollowed, sumsTheTaskPrintedBlue
} = require('../src/presentation-text');

const TASK = { title: 'My Turn', designUnitId: 'u1', primary: { type: 'stack', items: [
  { type: 'text', value: 'Use column addition with one exchange.\n\n247 + 135 =' }] } };
const ANSWERS = { title: 'Answers', designUnitId: 'u1', primary: { type: 'stack', items: [
  { type: 'text', value: '247 + 135 = ||382' }] } };
const LIST = { title: 'Your Turn', designUnitId: 'u2', questions: ['328 + 154 =', '2,314 + 152 ='] };
const LIST_ANSWERS = { title: 'Answers', designUnitId: 'u2', body: { type: 'text', value: '328 + 154 = ||482' } };

test('a sum alone on its card is black on a task slide', () => {
  setSumsFollowed([]);
  assert.equal(typeof presentationRuns('3,428 + 135 =', true, COLOURS.body, {}), 'string');
});

test('an answers slide prints its sum the colour the task slide printed it', (t) => {
  t.after(() => setSumsFollowed([]));
  const slides = [TASK, ANSWERS, LIST, LIST_ANSWERS];
  assert.deepEqual(sumsTheTaskPrintedBlue(slides, 0), [], 'a task slide follows nothing');
  assert.deepEqual(sumsTheTaskPrintedBlue(slides, 1), ['247+135=']);
  assert.deepEqual(sumsTheTaskPrintedBlue(slides, 3), [], 'a list of sums was black, so its answers are');

  setSumsFollowed(sumsTheTaskPrintedBlue(slides, 1));
  assert.deepEqual(colours(presentationRuns('247 + 135 = ||382', true, COLOURS.body, {})), [
    ['247 + 135 = ', COLOURS.title],
    ['382', COLOURS.green]
  ]);
  // Another sum on the same answers slide, one no task slide printed blue.
  assert.equal(typeof presentationRuns('300 + 135 =', true, COLOURS.body, {}), 'string');

  setSumsFollowed(sumsTheTaskPrintedBlue(slides, 3));
  const black = presentationRuns('328 + 154 = ||482', true, COLOURS.body, {});
  assert.equal(colours(black)[0][1], COLOURS.body);
});

test('the task is the nearest slide before the answers, and a later answers slide of the same task still follows it', () => {
  const second = { title: 'Answers', designUnitId: 'u1', body: { type: 'text', value: '247 + 135 =' } };
  assert.deepEqual(sumsTheTaskPrintedBlue([TASK, ANSWERS, second], 2), ['247+135=']);
  // The same sum set black by a nearer task: the nearer task decides.
  const nearer = { title: 'Our Turn', designUnitId: 'u3', body: { type: 'text', value: '247 + 135 =' } };
  assert.deepEqual(sumsTheTaskPrintedBlue([TASK, ANSWERS, nearer, second], 3), []);
  // A sum the designer coloured blue by hand is followed too.
  const marked = { title: 'Our Turn', body: { type: 'text', value: '[[5 + 6 =]]' } };
  assert.deepEqual(sumsTheTaskPrintedBlue([marked, second], 1), ['5+6=']);
});

function cardsFor(data, zone) {
  const shapes = [];
  const pptx = new PptxGenJS();
  const slide = {
    addShape: (kind, options) => shapes.push({ kind, ...options }),
    addText() {},
    addImage() {}
  };
  drawContent(pptx, slide, zone, data, { slideIndex: 0, imageDims: {}, cardLook: true });
  return shapes;
}

test('a question line fitted smaller in a thin strip keeps its card, across the strip', () => {
  // One line at the written 28pt needs about 0.71in, so in 0.6in the fit pass
  // sets it smaller. The card spans the strip the words now fill.
  const zone = { x: 0.4, y: 1.2, w: 5.2, h: 0.6, class: 'C' };
  const shapes = cardsFor({ type: 'text', value: '247 + 135 = ||382' }, zone);
  assert.equal(shapes.length, 1);
  assert.equal(shapes[0].h, zone.h);
  assert.equal(shapes[0].w, zone.w);
});

test('a one-line instruction bar and a narrow sliver still take no card', () => {
  assert.equal(cardsFor({ type: 'text', value: 'Use the table.' },
    { x: 0.4, y: 1.2, w: 5.2, h: 0.4, class: 'F' }).length, 0);
  assert.equal(cardsFor({ type: 'text', value: 'A' },
    { x: 0.4, y: 1.2, w: 0.8, h: 0.6, class: 'C' }).length, 0);
});
