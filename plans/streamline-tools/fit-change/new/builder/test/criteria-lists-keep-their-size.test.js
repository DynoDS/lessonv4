'use strict';

// Every criteria list that fitted before the fit release keeps its size.
//
// The release (4.2.289) mended three places where the step fitter refused a
// list it had room for, and let the practice templates' panel widen itself for
// a list that needs the room. The teacher agreed both on the promise that no
// list drawn today would change: the mends only let a refused list draw, and
// the panel widens only as far as 18pt needs, so a list that fits today's
// 4.60in panel keeps it.
//
// The fixture holds every real list of the long-list investigation (saved
// designs, saved slide specs and his approved rewrites) and its six long lists
// in his style, each with the size the 4.2.288 builder drew it at, or its
// refusal, in fourteen shapes. Each list is drawn again here in the same shape.

const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawSlide } = require('../src/templates');
const { withoutRecording } = require('../src/warnings');

const FIXTURE = require(path.join(__dirname, 'fixtures', 'criteria-lists-4.2.288.json'));

// The slides the fixture's sizes were measured on, exactly as they were built.
const Q = 'Round 346 to the nearest ten.';
const workQ = () => ({ type: 'text', value: Q });
const SHAPES = {
  'sc-template (maths-turn-sc)': (criteria) => ({
    template: 'maths-turn-sc', title: 'My Turn', questions: [Q],
    questionVisual: { type: 'text', value: '346' }, workingSpace: true, criteria,
  }),
  'maths-your-turn-sc': (criteria) => ({
    template: 'maths-your-turn-sc', title: 'Your Turn', questions: [Q, 'Round 581 to the nearest ten.', 'Round 725 to the nearest ten.'], criteria,
  }),
  'split-h-70-30 secondary': (criteria) => ({
    template: 'split-h-70-30', primarySide: 'left', title: 'Your Turn',
    primary: workQ(), secondary: { type: 'sc-panel', content: criteria },
  }),
  'split-h-60-40 secondary': (criteria) => ({
    template: 'split-h-60-40', primarySide: 'left', title: 'Your Turn',
    primary: workQ(), secondary: { type: 'sc-panel', content: criteria },
  }),
  'split-h-50-50 secondary': (criteria) => ({
    template: 'split-h-50-50', primarySide: 'left', title: 'Your Turn',
    primary: workQ(), secondary: { type: 'sc-panel', content: criteria },
  }),
  'body-sidebar sidebar': (criteria) => ({
    template: 'body-sidebar', title: 'Your Turn',
    banner: workQ(), body: { type: 'text', value: 'work' }, sidebar: { type: 'sc-panel', content: criteria },
  }),
  'thirds-h right': (criteria) => ({
    template: 'thirds-h', title: 'Your Turn',
    left: workQ(), middle: { type: 'text', value: 'x' }, right: { type: 'sc-panel', content: criteria },
  }),
  'split-v-50-50 secondary (bottom band)': (criteria) => ({
    template: 'split-v-50-50', primarySide: 'top', title: 'Your Turn',
    primary: workQ(), secondary: { type: 'sc-panel', content: criteria },
  }),
  'split-v-60-40 secondary (bottom band)': (criteria) => ({
    template: 'split-v-60-40', primarySide: 'top', title: 'Your Turn',
    primary: workQ(), secondary: { type: 'sc-panel', content: criteria },
  }),
  'split-v-70-30 secondary (bottom band)': (criteria) => ({
    template: 'split-v-70-30', primarySide: 'top', title: 'Your Turn',
    primary: workQ(), secondary: { type: 'sc-panel', content: criteria },
  }),
  'quad-v bottom': (criteria) => ({
    template: 'quad-v', title: 'My Turn',
    top: workQ(), centre: { type: 'text', value: 'x' }, lower: { type: 'text', value: 'y' }, bottom: { type: 'sc-panel', content: criteria },
  }),
  'centre-big-v bottom': (criteria) => ({
    template: 'centre-big-v', title: 'My Turn',
    top: workQ(), centre: { type: 'text', value: 'x' }, bottom: { type: 'sc-panel', content: criteria },
  }),
  'maths-turn-ref-sc': (criteria) => ({
    template: 'maths-turn-ref-sc', title: 'My Turn', questions: [Q],
    reference: { type: 'text', value: '346' }, hideWorkingSpace: false, criteria,
  }),
  'writing-turn-ref-sc': (criteria) => ({
    template: 'writing-turn-ref-sc', title: 'My Turn', questions: [Q],
    reference: { type: 'text', value: '346' }, criteria,
  }),
};
const PRACTICE = new Set(['sc-template (maths-turn-sc)', 'maths-your-turn-sc', 'maths-turn-ref-sc', 'writing-turn-ref-sc']);

// The step size a slide's criteria were drawn at, and its panel's width; or the
// refusal's name.
function drawn(slideData) {
  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();
  try {
    withoutRecording(() => drawSlide(pptx, slide, slideData, {
      slideIndex: 0, cardLook: true, lesson: { subject: 'maths' }, imageDims: {},
    }));
  } catch (err) {
    return { refused: String(err.message).split(':')[0] };
  }
  const objects = slide._slideObjects;
  const fonts = objects
    .filter((o) => o._type === 'text' && /step-text/.test(String((o.options || {}).objectName || '')))
    .map((o) => o.options.fontSize);
  const panel = objects.find((o) => o.options && o.options.fill && o.options.fill.color === 'D5F5E3');
  return { font: Math.min(...fonts), w: panel ? +panel.options.w.toFixed(3) : null };
}

test('the fixture covers the lists and shapes it says it does', () => {
  assert.deepEqual(FIXTURE.shapes, Object.keys(SHAPES));
  assert.equal(FIXTURE.lists.filter((l) => l.kind === 'real').length, 114);
});

test('every list that fitted before keeps its size, and a practice panel keeps 4.60in', () => {
  const moved = [];
  let kept = 0;
  for (const list of FIXTURE.lists) {
    FIXTURE.shapes.forEach((shape, i) => {
      const before = list.before[i];
      if (typeof before !== 'number') return;
      const now = drawn(SHAPES[shape]({ type: 'steps', steps: list.steps }));
      if (now.refused) moved.push(`${shape}: ${list.source} was ${before}pt, now refused (${now.refused})`);
      else if (now.font !== before) moved.push(`${shape}: ${list.source} was ${before}pt, now ${now.font}pt`);
      else if (PRACTICE.has(shape) && now.w !== 4.6) moved.push(`${shape}: ${list.source} panel widened to ${now.w}in`);
      else kept += 1;
    });
  }
  assert.deepEqual(moved, [], `${moved.length} fitting list(s) changed`);
  assert.ok(kept > 700, `only ${kept} fitting results were checked`);
});
