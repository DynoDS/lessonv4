'use strict';

// A table gets the height its share gives it, whatever it is wrapped in.
//
// In the stress test of 7 October 2026 a table was refused for height in six
// lessons of twenty, and one Slide Designer (Year 3 RE, Rama and Sita) spent
// every repair pass on it. Its row of weight 1.2 was handed 1.21in and the
// table inside it was drawn in 0.97in, under its 1.12in floor. Nothing had
// taken the height for another item. It went on frames:
//
//   - a table on a white card was padded twice, by the card and by itself;
//   - a table inside a criteria panel, or beside a text card in a row, was
//     never asked what it needed, so the stack could not move spare height to
//     it the way it does for a table standing on its own;
//   - the refusal's height counted one line per cell, so a table of sentences
//     that took the advice exactly was refused again for its words;
//   - nested stacks each added their own weight, three numbers for one table.
//
// What this file pins is each of those, at the place it is decided.

const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawContent } = require('../src/content');
const { drawTable, requiredZoneHeight } = require('../src/content/table');
const { drawStack } = require('../src/content/stack');

const CHECK = path.join(__dirname, '..', 'scripts', 'check-slide-design.js');

const ORDER_TABLE = {
  type: 'table',
  headers: ['1st', '2nd', '3rd', '4th', '5th'],
  rows: [['', '', '', '', '']],
  columnWidths: 'equal',
};

const SENTENCE_TABLE = {
  type: 'table',
  headers: ['Source', 'Tributary', 'Confluence'],
  rows: [[
    'the place where a river begins',
    'a smaller river that flows into a bigger river',
    'the place where two rivers join',
  ]],
};

function page() {
  const pptx = new PptxGenJS();
  return { pptx, slide: pptx.addSlide() };
}

function runCheck(lesson) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'table-frame-'));
  const lessonPath = path.join(root, 'lesson.json.tmp.table-frame');
  fs.writeFileSync(lessonPath, JSON.stringify(lesson));
  const result = spawnSync(process.execPath, [CHECK, lessonPath], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  fs.rmSync(root, { recursive: true, force: true });
  return `${result.stdout || ''}${result.stderr || ''}`;
}

function lessonWithBody(body) {
  return {
    lessonName: 'Table In A Frame',
    subject: 'RE',
    lo: 'Check a framed table',
    slides: [{ template: 'body-full', headerStyle: 'title', title: 'Put them in order', body }],
  };
}

test('a table on a card is drawn in the height its own refusal asks for', () => {
  // The card's padding used to come off the table's zone before the table
  // took its own, so a zone of exactly the height the refusal names was
  // refused. The table's margin is the card's margin, as a text card's is.
  const { pptx, slide } = page();
  const zone = { x: 0.3, y: 5.5, w: 6.4, h: requiredZoneHeight(1), class: 'A' };
  assert.doesNotThrow(() =>
    drawContent(pptx, slide, zone, ORDER_TABLE, { slideIndex: 0, cardLook: true }));
});

test('a table inside a criteria panel is given spare height from the line above it', () => {
  // The line holds a share it does not use; the panel is one weight short.
  const output = runCheck(lessonWithBody({
    type: 'stack',
    items: [
      { type: 'text', value: 'Put the pictures in order.', weight: 4.6 },
      { type: 'sc-panel', weight: 1.7, content: ORDER_TABLE },
    ],
  }));
  if (/AUTOFIT_(DEPENDENCY_MISSING|NOT_PERMITTED)/.test(output)) return;
  assert.doesNotMatch(output, /TABLE_ZONE_TOO_SHORT/, output.slice(-900));
  assert.match(output, /SLIDE_DESIGN_CHECK_OK/, output.slice(-900));
});

test('a table beside a text card in a row is given spare height from the line above it', () => {
  const output = runCheck(lessonWithBody({
    type: 'stack',
    items: [
      { type: 'text', value: 'Put the pictures in order.', weight: 5.5 },
      {
        type: 'row',
        weight: 0.9,
        items: [ORDER_TABLE, { type: 'text', value: 'Then tell the story.' }],
      },
    ],
  }));
  if (/AUTOFIT_(DEPENDENCY_MISSING|NOT_PERMITTED)/.test(output)) return;
  assert.doesNotMatch(output, /TABLE_ZONE_TOO_SHORT/, output.slice(-900));
  assert.match(output, /SLIDE_DESIGN_CHECK_OK/, output.slice(-900));
});

test('the height a refusal asks for holds the words in the cells', () => {
  // A Year 4 geography table of three definitions took the advised height
  // exactly and was refused again, once for every cell, because the height
  // counted one line a cell and the definitions ran to two.
  const zone = { x: 0.4, y: 5, w: 12.5, h: 0.9, class: 'A' };
  let asked = null;
  assert.throws(
    () => { const p = page(); drawTable(p.pptx, p.slide, zone, SENTENCE_TABLE, { slideIndex: 0 }); },
    (err) => {
      assert.match(err.message, /^TABLE_ZONE_TOO_SHORT:/);
      asked = err.neededZoneHeight;
      return true;
    }
  );
  assert.ok(asked > requiredZoneHeight(1), 'the height asked for counted one line a cell');
  const taken = Object.assign({}, zone, { h: asked, measureFloorPt: 18 });
  assert.doesNotThrow(() => {
    const p = page();
    drawTable(p.pptx, p.slide, taken, SENTENCE_TABLE, { slideIndex: 0 });
  });
});

test('a table of short cells is still asked for one line a row', () => {
  // The control: nothing about a table whose cells fit one line has moved.
  const zone = { x: 0.4, y: 5, w: 8, h: 0.9, class: 'A' };
  assert.throws(
    () => { const p = page(); drawTable(p.pptx, p.slide, zone, ORDER_TABLE, { slideIndex: 0 }); },
    (err) => {
      assert.equal(err.neededZoneHeight.toFixed(2), requiredZoneHeight(1).toFixed(2));
      return true;
    }
  );
});

test('a table inside nested stacks is told one weight, by the stack that holds it', () => {
  // A Year 6 English plan was told 2.40, 3.33 and 4.65 in one sentence, each
  // "on this item", by the three stacks the table sat inside.
  const nested = {
    type: 'stack',
    items: [
      { type: 'text', value: 'Plan three points.', weight: 1, heightMode: 'fill' },
      {
        type: 'stack',
        weight: 1,
        items: [
          { type: 'text', value: 'For a ban', weight: 1, heightMode: 'fill' },
          Object.assign({ weight: 1 }, ORDER_TABLE),
        ],
      },
    ],
  };
  const { pptx, slide } = page();
  assert.throws(
    () => drawStack(pptx, slide, { x: 0.3, y: 0.6, w: 7, h: 3, class: 'A' }, nested, { slideIndex: 0 }),
    (err) => {
      assert.match(err.message, /^TABLE_ZONE_TOO_SHORT:/);
      const said = err.message.match(/In this stack that is a weight of/g) || [];
      assert.equal(said.length, 1, err.message);
      return true;
    }
  );
});
