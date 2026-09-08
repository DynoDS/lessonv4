'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawScPanel } = require('../src/templates/maths-turn-sc');
const { drawScPanelContent } = require('../src/content/sc-panel');

const PANEL = { x: 0, y: 0, w: 4.6, h: 6.5 };

function fakeSlide() {
  const shapes = [];
  const texts = [];
  return {
    shapes,
    texts,
    addShape: (kind, options) => shapes.push({ kind, ...options }),
    addText: (content, options) => texts.push({ content, ...options }),
    addImage: (options) => {}
  };
}

function drawBothRoutes() {
  const pptx = new PptxGenJS();
  const data = {
    criteria: {
      type: 'steps',
      heading: '\u2713 Success Criteria',
      steps: [
        'The lamp lights when the switch is closed',
        'The cell is the power source',
        'The wire joins the parts in a loop'
      ]
    }
  };
  const ctx = { slideIndex: 0, imageDims: {}, cardLook: true };

  // Route 1: the fixed right-hand panel of the *-sc templates.
  const template = fakeSlide();
  drawScPanel(pptx, template, data, ctx);

  // Route 2: the sc-panel content object, in the same zone.
  const content = fakeSlide();
  drawScPanelContent(pptx, content, PANEL, data, ctx);

  return [template, content];
}

test('both routes draw one green panel with three white criterion cards', () => {
  drawBothRoutes().forEach((slide, route) => {
    const panels = slide.shapes.filter(
      (shape) => shape.kind === 'roundRect' && shape.fill.color === 'D5F5E3'
    );
    assert.equal(panels.length, 1, `route ${route + 1}: one green panel`);

    const cards = slide.shapes.filter(
      (shape) => shape.kind === 'roundRect' && shape.fill.color === 'FFFFFF'
    );
    assert.equal(
      cards.length,
      3,
      `route ${route + 1}: one compact white card per criterion`
    );
  });
});

test('both routes carry the same panel label, colour and size', () => {
  const labels = drawBothRoutes().map((slide) =>
    // The heading is joined with no-break spaces so it never wraps.
    slide.texts.find((entry) => entry.content === '\u2713\u00a0Success\u00a0Criteria')
  );
  labels.forEach((label, route) => {
    assert.ok(label, `route ${route + 1}: panel label renders once`);
    assert.equal(label.fontSize, 28);
    assert.equal(label.color, '00B050');
    assert.equal(label.bold, true);
  });
  assert.equal(labels[0].fontSize, labels[1].fontSize);
  assert.equal(labels[0].color, labels[1].color);
});

test('the panel heading is one unbreakable line', () => {
  // A 30%-wide sidebar once wrapped "✓ Success Criteria" onto two large lines.
  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();
  drawScPanelContent(pptx, slide, { x: 6.5, y: 1, w: 3, h: 4 }, {
    content: { type: 'steps', steps: ['One.', 'Two.'] }
  }, {});
  const heading = slide._slideObjects.find((o) => {
    const text = typeof o.text === 'string' ? o.text : Array.isArray(o.text) ? o.text.map((t) => t.text).join('') : '';
    return text.includes('Success');
  });
  assert.ok(heading, 'the heading is drawn');
  const text = typeof heading.text === 'string' ? heading.text : heading.text.map((t) => t.text).join('');
  assert.equal(text.includes(' '), false, 'no breakable space in the heading: ' + JSON.stringify(text));
  assert.ok(text.includes('\u00a0'));
});

const SIX_STEPS = [
  'Find the endpoints.', 'Find the difference.', 'Count the spaces.',
  'Divide by the spaces.', 'Count on in steps.', 'Write the missing number.'
];

test('six short steps retain all actions and the final fitting floor in both routes', () => {
  const pptx = new PptxGenJS();
  const data = { criteriaRef: 'sc-001', flipchart: true,
    criteria: { type: 'steps', steps: SIX_STEPS } };
  for (const route of ['fixed', 'free']) {
    const slide = fakeSlide();
    const ctx = { slideIndex: 0, imageDims: {}, cardLook: true };
    if (route === 'fixed') drawScPanel(pptx, slide, data, ctx);
    else drawScPanelContent(pptx, slide, { x: 6.8, y: 0.7, w: 6.2, h: 6.5 }, data, ctx);
    const steps = slide.texts.filter(row => (row.objectName || '').includes('step-text-'));
    assert.equal(steps.length, SIX_STEPS.length, route + ': no omitted steps');
    steps.forEach((row, i) => {
      assert.ok(row.fontSize >= 18, route + ': initial readable floor');
      assert.match(row.objectName, /__MIN18__/, route + ': floor survives final fitting');
      const text = Array.isArray(row.content) ? row.content.map(r => r.text).join('') : row.content;
      assert.equal(text, SIX_STEPS[i], route + ': wording and order preserved');
    });
  }
});

test('seven short actions are supported without making six a replacement ceiling', () => {
  const slide = fakeSlide();
  drawScPanelContent(new PptxGenJS(), slide, { x: 6.8, y: 0.7, w: 6.2, h: 6.5 }, {
    criteria: { type: 'steps', steps: [...SIX_STEPS, 'Check your answer.'] }
  }, { slideIndex: 0, imageDims: {}, cardLook: true });
  assert.equal(slide.texts.filter(row => (row.objectName || '').includes('step-text-')).length, 7);
});

test('an undersized criteria panel still refuses unreadable steps instead of dropping them', () => {
  assert.throws(() => drawScPanelContent(new PptxGenJS(), fakeSlide(),
    { x: 0, y: 0, w: 2.2, h: 1.5 },
    { criteria: { type: 'steps', steps: SIX_STEPS } },
    { slideIndex: 0, imageDims: {}, cardLook: true }), /STEP_TEXT_OVERLOAD/);
});
