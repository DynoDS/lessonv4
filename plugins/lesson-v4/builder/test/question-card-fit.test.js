'use strict';

// A Year 4 place-value Your Turn asked children to draw charts for 6,032, 6,302
// and 6,320. The cards were laid out at 16pt and shipped at 12pt, in a narrow
// column with two thirds of the zone's width empty beside them, while the "(4)"
// on the same line stayed 16pt (flagged by Daniel, 2 Sept 2026: "your turn
// question 4,5,6 font size is too small ... when theres instructions about being
// read from back of classroom").
//
// Two faults, and both are geometry rather than taste:
//
//   the box was narrower than its words   the card was sized from an average
//     character width deliberately set UNDER the real one, so the text box came
//     out too small for the question and the fit pass shrank the question to fit
//     the box the layout had given it. A grow pass changes a font size inside a
//     box; it cannot widen the box, so an under-estimate is paid in font size.
//
//   the room was only ever the height   the font was chosen by dividing the
//     zone's height between the cards, so a short set in a wide, shallow zone
//     came out small however much width sat unused.

const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawNumberedQuestions } = require('../src/content/numbered-questions');
const { textWidthIn } = require('../src/glyph-width');

// Draw a question block into a zone and report every box that was placed.
function draw(zone, data) {
  const texts = [];
  const shapes = [];
  const pptx = new PptxGenJS();
  const slide = {
    addShape: (_kind, opts) => shapes.push(opts),
    addText: (content, opts) => texts.push({ content, ...opts }),
    addImage: () => {},
  };
  drawNumberedQuestions(pptx, slide, zone, data, { slideIndex: 0, lesson: {} });
  return { texts, shapes };
}

const questionBoxes = (texts) =>
  texts.filter((t) => /__question-text-/.test(t.objectName || ''));

// A question reaches addText either as a plain string or as coloured runs,
// depending on whether it carries presentation markers.
const words = (content) =>
  typeof content === 'string'
    ? content
    : (content || []).map((run) => run.text || '').join('');

// A wide, shallow zone: the body of a Your Turn under its task instruction.
const WIDE_SHALLOW = { x: 0.22, y: 1.7, w: 8.89, h: 2.58 };

test('a question box is never narrower than the question inside it', () => {
  const { texts } = draw(WIDE_SHALLOW, {
    questions: ['6,032', '6,302', '6,320'],
    startAt: 4,
  });
  const boxes = questionBoxes(texts);
  assert.equal(boxes.length, 3);
  boxes.forEach((box) => {
    const text = words(box.content);
    assert.ok(text, 'the question reached the slide');
    const needed = textWidthIn(text, box.fontSize, true);
    assert.ok(
      box.w >= needed,
      `"${text}" needs ${needed.toFixed(2)}in at ${box.fontSize}pt ` +
        `and its box is ${box.w.toFixed(2)}in. A box narrower than its own words is ` +
        `shrunk to fit by the fit pass, and the child reads the smaller size.`
    );
  });
});

test('the number beside a question is never wider than its own column', () => {
  const { texts } = draw(WIDE_SHALLOW, {
    questions: ['6,032', '6,302', '6,320'],
    startAt: 8,
  });
  // Numbering that runs past (9) prints a two-digit label; the column is priced
  // from the widest label the set actually prints, not from its length.
  const labels = texts.filter((t) => /^\(\d+\)$/.test(t.content));
  assert.deepEqual(labels.map((l) => l.content), ['(8)', '(9)', '(10)']);
  labels.forEach((label) => {
    assert.ok(
      label.w >= textWidthIn(label.content, label.fontSize, true),
      `${label.content} does not fit the column it was given`
    );
  });
});

test('a short set uses the width of a wide, shallow zone, not just its height', () => {
  const wide = draw(WIDE_SHALLOW, {
    questions: ['6,032', '6,302', '6,320'],
    startAt: 4,
  });
  const boxes = questionBoxes(wide.texts);

  // One row of three, so the type is bounded by the room the zone really has.
  const tops = new Set(boxes.map((b) => Math.round(b.y * 100)));
  assert.equal(tops.size, 1, 'three short questions belong on one row here');
  assert.ok(
    boxes[0].fontSize >= 30,
    `a three-number set on an 8.9 x 2.6in zone must read from the back row; ` +
      `it came out at ${boxes[0].fontSize}pt`
  );

  // The same set in a tall, narrow zone still stacks: there is no width to take.
  const tall = draw({ x: 0.22, y: 1.7, w: 2.4, h: 5.0 }, {
    questions: ['6,032', '6,302', '6,320'],
    startAt: 4,
  });
  const stacked = questionBoxes(tall.texts);
  assert.equal(
    new Set(stacked.map((b) => Math.round(b.y * 100))).size,
    3,
    'a narrow zone has no spare width, so the cards stay in one column'
  );
});

test('going wide never forces a question to wrap', () => {
  // Full sentences in the same wide, shallow zone. Split three ways each column
  // would be about 2.8in, which these cannot hold on one line, so the set keeps
  // the single column where each question has the whole width.
  const { texts } = draw(WIDE_SHALLOW, {
    questions: [
      'Explain why the zero has to stay in the hundreds column.',
      'Write the number that is ten times as big as this one.',
      'Draw a chart for a number with no tens and explain your choice.',
    ],
    startAt: 4,
  });
  const boxes = questionBoxes(texts);
  assert.equal(
    new Set(boxes.map((b) => Math.round(b.y * 100))).size,
    3,
    'questions that would wrap in a column are left in the single stack'
  );
});

test('a grid leaves no ragged last row', () => {
  // Five short questions: 5 does not divide by 2, 3 or 4, so the only full-row
  // arrangement is one row of five. A 3 + 2 grid reads as a stack that ran out.
  const { texts } = draw({ x: 0.22, y: 1.7, w: 11.0, h: 2.58 }, {
    questions: ['4,102', '4,120', '4,201', '4,210', '4,012'],
    startAt: 1,
  });
  const rows = new Set(questionBoxes(texts).map((b) => Math.round(b.y * 100)));
  assert.ok(rows.size === 1 || rows.size === 5, `unexpected ${rows.size} rows`);
});

// A place-value heading is one word, so it cannot wrap: when the column is
// narrower than the word PowerPoint splits it mid-word and the one-line header
// band clips the bottom half. Three four-column charts sharing a row on the
// same Year 4 Your Turn shipped "Tho/usan Hun/dred Tens One" as its headings,
// and every check passed, because the scale that narrows type for a narrow
// column is priced on the digits, which are one character wide.
//
// Shrinking the type was only half the repair, and the other half took a second
// deck to find. The shrink stops at a readable minimum, so a column too narrow
// for "Thousands" even there got the minimum anyway and clipped exactly as
// before: a Year 4 deck (3 September 2026) shipped "Thousan/ds Hundred/s" on
// three slides, and the same lesson's working-wall card failed its build on the
// same overlap. So the chart now falls back to the canonical short name - Th,
// H, T, O - rather than to half a long one, and these tests are written on the
// invariant rather than on either spelling: whatever the chart prints, it fits.
//
// The spelling carried a second, quieter fault. The column palette is keyed on
// the short names, so a chart headed with the full words missed every lookup
// and drew entirely in the default grey - and the column colour coding is the
// half of this picture that says a counter's value comes from where it sits.
const {
  drawPlaceValueChart
} = require('../src/content/place-value-chart');

function chartHeadings(zone, columns, counters = true) {
  const tables = [];
  const pptx = new PptxGenJS();
  const slide = {
    addShape: () => {},
    addText: () => {},
    addImage: () => {},
    addTable: (rows, opts) => tables.push({ rows, opts }),
  };
  drawPlaceValueChart(pptx, slide, zone, {
    type: 'place-value-chart',
    columns: columns || ['Thousands', 'Hundreds', 'Tens', 'Ones'],
    rows: [counters
      ? { cells: ['', '', '', ''], counters: { Thousands: 4, Hundreds: 2, Tens: 6, Ones: 1 } }
      : { cells: ['4', '2', '6', '1'] }],
  }, { slideIndex: 0, lesson: {} });
  const header = tables
    .map((t) => t.rows[0])
    .find((row) => row && row.some((cell) => /^(Thousands|Th)$/.test(cell.text)));
  const colW = tables.find((t) => Array.isArray(t.opts.colW)).opts.colW;
  return { header, colW };
}

// The heading of the thousands column, whichever spelling the chart chose.
function thousandsHeading(drawn) {
  return drawn.header.find((cell) => /^(Thousands|Th)$/.test(cell.text));
}

test('a column heading is never wider than the column it sits in', () => {
  // The exact shape that clipped: a four-column chart in a third of a body zone.
  const drawn = chartHeadings({ x: 0.2, y: 1.8, w: 2.87, h: 3.6 });
  const heading = thousandsHeading(drawn);
  assert.ok(heading, 'the chart drew its headings');
  assert.ok(
    textWidthIn(heading.text, heading.options.fontSize, true) <= drawn.colW[0],
    `"${heading.text}" at ${heading.options.fontSize}pt needs ` +
      `${textWidthIn(heading.text, heading.options.fontSize, true).toFixed(2)}in ` +
      `and its column is ${drawn.colW[0].toFixed(2)}in, so it breaks mid-word and is clipped.`
  );
});

test('a chart too narrow for the word prints the short name, not half the word', () => {
  // The narrowest real case: two four-column charts sharing a speech-bubble
  // slide's side band. At this width no readable size holds "Thousands", so
  // shrinking alone can only clip. Digits only, because a chart this narrow
  // carrying counters is refused outright by the counter floor below - heading
  // fit and counter size are separate faults and this one is the heading.
  const drawn = chartHeadings({ x: 0.2, y: 1.8, w: 1.9, h: 2.2 }, null, false);
  const heading = thousandsHeading(drawn);
  assert.equal(heading.text, 'Th');
  assert.ok(
    textWidthIn(heading.text, heading.options.fontSize, true) <= drawn.colW[0],
    `even "Th" does not fit at ${heading.options.fontSize}pt`
  );
});

test('a chart with room keeps the full word at full size', () => {
  // The discrimination: a chart given the width its headings need must not be
  // shrunk, nor abbreviated, by the same rule. A full-width My Turn chart reads
  // "Thousands" at full size.
  const wide = chartHeadings({ x: 0.2, y: 1.8, w: 7.9, h: 3.6 });
  const heading = thousandsHeading(wide);
  assert.equal(heading.text, 'Thousands');
  assert.ok(heading.options.fontSize >= 13, `full-width headings came out at ${heading.options.fontSize}pt`);
});

test('the column palette survives a chart headed with the full words', () => {
  // Written short and written long must colour the same, or spelling the names
  // out silently costs the chart its column coding.
  const long = chartHeadings({ x: 0.2, y: 1.8, w: 7.9, h: 3.6 });
  const short = chartHeadings({ x: 0.2, y: 1.8, w: 7.9, h: 3.6 }, ['Th', 'H', 'T', 'O']);
  const fills = (drawn) => drawn.header.map((cell) => cell.options.fill.color);
  assert.deepEqual(fills(long), fills(short));
  assert.ok(
    new Set(fills(long)).size > 1,
    'every column drew in one colour, so the palette never resolved'
  );
});

// A chart has always had a height floor and never a width one, and the two are
// not interchangeable. The counter band grows with the scale while a column
// keeps whatever width the layout gave it, so a narrow column makes a tall thin
// cell that spends its height on gaps: two four-column charts sharing the 60%
// side of a split gave each column 0.6in and six counters 0.10in across, in a
// band 1.6in tall. Every check passed and the deck shipped twice (flagged by
// Daniel, 3 September 2026: "2 in one slide is still too small to do anything
// with. The columns are too narrow").

function drawCounterChart(zone) {
  const pptx = new PptxGenJS();
  const slide = {
    addShape: () => {},
    addText: () => {},
    addImage: () => {},
    addTable: () => {},
  };
  drawPlaceValueChart(pptx, slide, zone, {
    type: 'place-value-chart',
    columns: ['Thousands', 'Hundreds', 'Tens', 'Ones'],
    rows: [{ label: 'A', cells: ['', '', '', ''], counters: { Thousands: 6, Hundreds: 2, Tens: 4, Ones: 1 } }],
  }, { slideIndex: 0, lesson: {} });
}

test('a column too narrow for its counters is refused, not shipped small', () => {
  // Half of a 60-40 split's primary: the exact zone each of two charts got.
  assert.throws(
    () => drawCounterChart({ x: 0.2, y: 1.8, w: 3.52, h: 4.56 }),
    /PLACE_VALUE_COUNTERS_TOO_SMALL/
  );
});

test('the refusal names width, because height is not the lever', () => {
  // The height refusal beside it already offers a taller zone and fewer rows,
  // and a designer sent to the wrong lever spends a repair pass measuring the
  // same number again.
  try {
    drawCounterChart({ x: 0.2, y: 1.8, w: 3.52, h: 4.56 });
    assert.fail('the chart drew counters it should have refused');
  } catch (error) {
    assert.match(error.message, /more WIDTH/);
    assert.match(error.message, /one chart on this slide instead of two/);
    assert.match(error.message, /a taller zone will not move it/);
  }
});

test('one chart in the same zone draws counters at full size', () => {
  // The discrimination, and the repair the message names: the whole primary
  // instead of half of it doubles the column and the counters come out at the
  // size they were designed for.
  assert.doesNotThrow(() => drawCounterChart({ x: 0.2, y: 1.8, w: 7.2, h: 4.56 }));
});

test('a chart with no counters is judged on height alone', () => {
  // A digits-only chart has no counters to be too small, and must not acquire a
  // width floor it never needed.
  const pptx = new PptxGenJS();
  const slide = { addShape: () => {}, addText: () => {}, addImage: () => {}, addTable: () => {} };
  assert.doesNotThrow(() =>
    drawPlaceValueChart(pptx, slide, { x: 0.2, y: 1.8, w: 2.4, h: 3.0 }, {
      type: 'place-value-chart',
      columns: ['Th', 'H', 'T', 'O'],
      rows: [{ label: '3,462', cells: ['3', '4', '6', '2'] }],
    }, { slideIndex: 0, lesson: {} }));
});
