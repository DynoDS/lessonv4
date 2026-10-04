'use strict';

// A stack shares its height by what each item needs when a weight has left
// something short of the 18pt floor. It used to measure only the text cards and
// criteria panels it held directly, so a row of cards, a row of columns of
// cards, and the sort children do each kept the share its weight guessed, and
// their words were refused at the fit while the stack had the room (the
// "small cards" refusals of 4 October 2026: 35 across ten slide runs).

const test = require('node:test');
const assert = require('node:assert/strict');
const { stackLayout, textNeed } = require('../src/content/stack');

const ZONE = { x: 0.3, y: 1.4, w: 12.7, h: 5.4, class: 'A' };
const CTX = { slideIndex: 0, lessonDir: __dirname, imageDims: {} };

const LONG = 'Read the words with your partner and find out what working in the mine was like for her, ' +
  'then finish the sentence with a word that says what it was like.';
const SOURCE = 'I go down the pit at five in the morning and come up at five at night. '.repeat(3).trim();

const text = (value, extra) => Object.assign({ type: 'text', value }, extra || {});
const heights = (data) => stackLayout(ZONE, data, CTX).map((entry) => entry.zone.h);
const half = Object.assign({}, ZONE, { w: (ZONE.w - 0.10) / 2 });

test('a row of two cards takes the height its words need', () => {
  const row = { type: 'row', weight: 1, items: [text(LONG), text(LONG)] };
  const [, rowH] = heights({ type: 'stack', items: [text(SOURCE, { weight: 9 }), row] });
  const need = textNeed(text(LONG), half, 18, CTX);
  assert.ok(5.3 / 10 < need, 'the weights alone leave the row short, or this proves nothing');
  assert.ok(rowH >= need - 1e-6, `the row is ${rowH.toFixed(2)}in and its words need ${need.toFixed(2)}in`);
});

test('a row of two columns of cards takes the height the taller column needs', () => {
  const column = { type: 'stack', items: [text(LONG, { sizeGroup: 'how' }), text(LONG, { sizeGroup: 'job' })] };
  const row = { type: 'row', weight: 1, items: [column, column] };
  const [topH, rowH] = heights({ type: 'stack', items: [text(SOURCE, { weight: 9 }), row] });
  const need = 2 * textNeed(text(LONG), half, 18, CTX) + 0.10;
  assert.ok(rowH >= need - 1e-6, `the row is ${rowH.toFixed(2)}in and its columns need ${need.toFixed(2)}in`);
  assert.ok(topH >= textNeed(text(SOURCE), ZONE, 18, CTX) - 1e-6, 'the card above still holds its own words');
});

test('a stack whose items all fit their shares lays out by its weights as before', () => {
  const row = { type: 'row', weight: 1, items: [text('A short card.'), text('Another short card.')] };
  const [topH, rowH] = heights({ type: 'stack', items: [text('One line.', { weight: 2 }), row] });
  assert.ok(Math.abs(topH - 2 * rowH) < 1e-6, 'two to one, as written');
});

test('a row holding something that is not words keeps the share its weight gives', () => {
  const row = { type: 'row', weight: 1, items: [text(LONG), { type: 'chip-bank', chips: ['one', 'two'] }] };
  const [, rowH] = heights({ type: 'stack', items: [text(SOURCE, { weight: 9 }), row] });
  assert.ok(Math.abs(rowH - 5.3 / 10) < 1e-6, 'the row cannot be measured, so nothing moves it');
});

test('a row of bordered columns keeps the share its weight gives', () => {
  // A coloured border draws its cards inside a frame this measure does not
  // know, so the row is left alone rather than measured as if it were plain.
  const column = (colour) => ({ type: 'stack', categoryColor: colour, items: [text(LONG)] });
  const row = { type: 'row', weight: 1, items: [column('blue'), column('orange')] };
  const [, rowH] = heights({ type: 'stack', items: [text(SOURCE, { weight: 9 }), row] });
  assert.ok(Math.abs(rowH - 5.3 / 10) < 1e-6, 'a bordered row is not measured, so nothing moves it');
});

test('a row that fits is left alone when the words beside it settle among themselves', () => {
  // Two lines short of their shares with a third to take from: the row of
  // short cards under them keeps the height its weight gave it.
  const row = { type: 'row', weight: 3, items: [text('79'), text('99'), text('100')] };
  const data = { type: 'stack', items: [text(LONG, { weight: 0.4 }), text('One line.', { weight: 3 }), row] };
  const [, , rowH] = heights(data);
  assert.ok(Math.abs(rowH - 5.2 * 3 / 6.4) < 1e-6, `the row has ${rowH.toFixed(2)}in`);
});

test('a card that opens with a sign is measured in the width the sign leaves it', () => {
  // The pencil stands before the words, so the words wrap sooner. Uncounted,
  // a task above a table was measured a line short and refused at the fit.
  const words = 'On your own, copy the table and fill every box.';
  const zone = Object.assign({}, ZONE, { w: 6.35 });
  const plain = textNeed(text(words), zone, 18, CTX, true);
  const signed = textNeed(text(words, { signal: 'pencil' }), zone, 18, CTX, true);
  assert.ok(signed > plain + 0.2, `one line more with the pencil: ${plain.toFixed(2)}in without, ${signed.toFixed(2)}in with`);
});

test('words above a table take the height the table is not using', () => {
  const table = { type: 'table', weight: 6, headers: ['Number', '3', '4'], rows: [['96', '', ''], ['105', '', '']] };
  const task = text(LONG, { weight: 1 });
  const [taskH, tableH] = heights({ type: 'stack', items: [task, table] });
  const need = textNeed(task, ZONE, 18, CTX);
  assert.ok(5.3 / 7 < need, 'the weights alone leave the task short, or this proves nothing');
  assert.ok(taskH >= need - 1e-6, `the task has ${taskH.toFixed(2)}in and needs ${need.toFixed(2)}in`);
  assert.ok(tableH >= 0.24 + 0.5 + 2 * 0.38, 'and the table keeps a readable line in every row');
});

test('words above a word bank take the height the bank is not using', () => {
  const bank = { type: 'chip-bank', weight: 6, chips: ['mouth', 'stomach', 'small intestine'] };
  const task = text(LONG, { weight: 1 });
  const [taskH] = heights({ type: 'stack', items: [task, bank] });
  const need = textNeed(task, ZONE, 18, CTX);
  assert.ok(taskH >= need - 1e-6, `the task has ${taskH.toFixed(2)}in and needs ${need.toFixed(2)}in`);
});

test('the sort children do takes the height its cards need from a row of short cards under it', () => {
  const board = {
    type: 'sort-board',
    weight: 3.4,
    instruction: 'Four of these cards tell the story in order. One is not true. Put the four in order and find the odd one.',
    bank: [
      'A Young children worked all day underground in the mines.',
      'B Lord Shaftesbury told the mine owners to stop, and they did.',
      'C People went down the mines and wrote down what the children said.',
      'D Lord Shaftesbury took the words of the children to Parliament.',
      'E Parliament made a new law, the Mines Act of 1842.'
    ],
    groups: [{ label: '1st' }, { label: '2nd' }, { label: '3rd' }, { label: '4th' }]
  };
  const under = { type: 'row', weight: 1, items: [text('Which card is the odd one out?'), text('Tell your partner why.')] };
  const zone = { x: 0.22, y: 0.6, w: 12.893, h: 6.65, class: 'A' };
  const layout = stackLayout(zone, { type: 'stack', items: [board, under] }, CTX);
  const share = (zone.h - 0.10) * 3.4 / 4.4;
  assert.ok(layout[0].zone.h > share + 0.2, `the board has ${layout[0].zone.h.toFixed(2)}in; its weight gave ${share.toFixed(2)}in`);
  const need = textNeed(text('Which card is the odd one out?'), Object.assign({}, zone, { w: (zone.w - 0.10) / 2 }), 18, CTX);
  assert.ok(layout[1].zone.h >= need - 1e-6, 'and the row under it still holds its words');
});
