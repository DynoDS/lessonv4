'use strict';

// A card that fits its words lines up with the middle of what stands beside it
// in a row. "Use column subtraction." beside three answer charts printed hard
// against the top of the row while the charts sat centred below it (a Year 4
// answers slide, 19 October 2026: "it doesn't look very aligned"), because the
// line-up only looked for a stack of cards.

const test = require('node:test');
const assert = require('node:assert/strict');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawContent } = require('../src/content');

const chart = (top, bottom, answer) => ({
  type: 'place-value-chart', columns: ['Th', 'H', 'T', 'O'],
  calculation: { operator: '-', numbers: [top, bottom], answer }
});

function drawn(rowData) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'W', width: 13.333, height: 7.5 });
  pptx.layout = 'W';
  const slide = pptx.addSlide();
  const zone = { x: 0.22, y: 0.6, w: 12.9, h: 6.6, class: 'E-wide' };
  drawContent(pptx, slide, zone, rowData, { slideIndex: 0, cardLook: true, lesson: {} });
  return { slide, zone };
}

const textOf = (o) => (Array.isArray(o.text) ? o.text.map((r) => r.text).join('') : String(o.text || ''));

test('an instruction card beside a row of charts is centred on them, not stuck at the top', () => {
  const { slide, zone } = drawn({ type: 'row', items: [
    { type: 'text', value: 'Use column subtraction.', align: 'center', weight: 0.8 },
    { type: 'row', weight: 2, items: [chart('6004', '8', '5996')] },
    { type: 'row', weight: 2, items: [chart('9003', '5', '8998')] },
    { type: 'row', weight: 2, items: [chart('2000', '3', '1997')] }
  ] });
  const card = slide._slideObjects.find((o) => o._type === 'text' && /Use column/.test(textOf(o)));
  assert.ok(card, 'the instruction was drawn');
  const y = card.options.y;
  const h = card.options.h;
  const middle = y + h / 2;
  const zoneMiddle = zone.y + zone.h / 2;
  assert.ok(Math.abs(middle - zoneMiddle) < 0.35,
    `the card's middle is at ${middle.toFixed(2)}in, the row's at ${zoneMiddle.toFixed(2)}in`);
  assert.ok(y - zone.y > 0.5, `the card starts ${(y - zone.y).toFixed(2)}in below the top of the row`);
});
