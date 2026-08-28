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
    slide.texts.find((entry) => entry.content === '\u2713 Success Criteria')
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
