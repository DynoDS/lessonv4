'use strict';

// The green success criteria box ends where its last step does. It used to run
// the full height of its zone, so a list of two or three steps sat at the top
// with empty green under it (the teacher, 4 October 2026: "there's only two
// cards in there. Then there's a lot of empty dead green space"). The step
// text is not enlarged to fill the room instead: that was the overfilled panel
// of 17 September.

const assert = require('node:assert/strict');
const test = require('node:test');
const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawSuccessCriteriaPanel } = require('../src/success-criteria-panel');

const ZONE = { x: 6.77, y: 0.6, w: 6.35, h: 6.65, class: 'C' };
const GREEN = 'D5F5E3';

function draw(criteria) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  const page = pptx.addSlide();
  const shapes = [];
  const slide = new Proxy(page, {
    get(target, prop) {
      if (prop === 'addShape') return (kind, o) => { shapes.push(o); return target.addShape(kind, o); };
      const value = target[prop];
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
  drawSuccessCriteriaPanel(pptx, slide, ZONE, { criteria }, { slideIndex: 0, lesson: { slides: [{}] }, cardLook: true });
  const panel = shapes.find((s) => s.fill && s.fill.color === GREEN);
  const cards = shapes.filter((s) => s.fill && s.fill.color === 'FFFFFF');
  return { panel, cards };
}

const steps = (n) => ({ type: 'steps', steps: Array.from({ length: n }, (_, i) => `Take away part ${i + 1} of the number.`) });

test('a list of two steps leaves no empty green under it', () => {
  const { panel, cards } = draw(steps(2));
  const lastCard = Math.max(...cards.map((c) => c.y + c.h));
  assert.ok(panel.h < ZONE.h - 1, `the box is ${panel.h.toFixed(2)}in tall in a ${ZONE.h}in zone`);
  assert.ok(panel.y + panel.h >= lastCard, 'the box still holds its last card');
  assert.ok(panel.y + panel.h - lastCard < 0.3, 'and ends just under it');
  assert.equal(panel.y, ZONE.y, 'it stays at the top of its zone, beside the work');
});

test('the step cards are the size they were: hugging does not blow the text up', () => {
  const two = draw(steps(2)).cards[0];
  const three = draw(steps(3)).cards[0];
  assert.ok(Math.abs(two.h - three.h) < 0.02, 'a two-step and a three-step list share one card height');
});

test('a list that needs the whole height keeps it', () => {
  const { panel } = draw(steps(6));
  assert.ok(panel.h > ZONE.h - 0.3, `six steps fill the zone (${panel.h.toFixed(2)}in)`);
});

test('criteria that are not a list of steps keep the zone they were given', () => {
  const { panel } = draw({ type: 'table', headers: ['It looks like', 'It is'], rows: [['a flat line', 'level']] });
  assert.equal(panel.h, ZONE.h);
});
