'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { preflightLayouts, compatibilityProblems } = require('../src/layout-preflight');
const { capacityWarnings } = require('../src/content/capacity');
const { getWarnings, clearWarnings, note } = require('../src/warnings');

const ctxFor = (i) => ({ slideIndex: i, lessonDir: '.', lesson: {}, date: '', cardLook: true });

test('a layout that draws cleanly produces no errors', () => {
  const lesson = { slides: [{ template: 'title', title: 'A lesson' }] };

  const result = preflightLayouts({
    PptxGenJS,
    lesson,
    contextForSlide: ctxFor,
    drawSlide: () => {},
  });

  assert.deepEqual(result.errors, []);
});

test('a slide that throws while drawing is caught before anything is published', () => {
  const lesson = { slides: [{ template: 'title' }, { template: 'teach' }] };

  const result = preflightLayouts({
    PptxGenJS,
    lesson,
    contextForSlide: ctxFor,
    drawSlide: (pptx, slide, data, ctx) => {
      if (ctx.slideIndex === 1) throw new Error('something went wrong');
    },
  });

  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].slide, 2);
  assert.equal(result.errors[0].signal, 'LAYOUT_PREFLIGHT_FAILED');
});

test('a helper that refuses by name keeps its own signal', () => {
  // STEP_TEXT_OVERLOAD is a content fault and goes to a different owner from a
  // broken spec, so flattening every throw into one signal would lose that.
  const lesson = { slides: [{ template: 'teach' }] };

  const result = preflightLayouts({
    PptxGenJS,
    lesson,
    contextForSlide: ctxFor,
    drawSlide: () => {
      throw new Error('STEP_TEXT_OVERLOAD: step 1 does not fit its card.');
    },
  });

  assert.equal(result.errors[0].signal, 'STEP_TEXT_OVERLOAD');
  assert.match(result.errors[0].message, /does not fit/);
});

test('a content type the registry does not know is named, not deleted', () => {
  const lesson = {
    slides: [{ template: 'teach', content: { type: 'not-a-real-helper' } }],
  };

  const problems = compatibilityProblems(lesson);
  assert.equal(problems.length, 1);
  assert.equal(problems[0].signal, 'CONTENT_ZONE_INCOMPATIBLE');
  assert.match(problems[0].message, /Nothing was removed/);
});

test('a registered helper in a registry-incompatible zone is refused, not degraded', () => {
  const { drawContent } = require('../src/content');
  const lesson = {
    slides: [{ template: 'teach', content: { type: 'table' } }],
  };

  const result = preflightLayouts({
    PptxGenJS,
    lesson,
    contextForSlide: ctxFor,
    drawSlide: (pptx, slide, data, ctx) =>
      drawContent(
        pptx,
        slide,
        { x: 0, y: 0, w: 2, h: 2, class: 'G' },
        data.content,
        ctx
      ),
  });

  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].signal, 'CONTENT_ZONE_INCOMPATIBLE');
  assert.match(result.errors[0].message, /Nothing was removed or replaced/);
});

test('valid content is never reported merely because the table is consulted', () => {
  const lesson = {
    slides: [{ template: 'teach', content: { type: 'text', text: 'Hello' } }],
  };

  assert.deepEqual(compatibilityProblems(lesson), []);
});

test('the dry run does not leak its warnings into the real build summary', () => {
  // The preflight draws every slide once, raising the same warnings the real
  // render will. Counted twice, every warning reads as two faults.
  clearWarnings();
  note('a real warning from before the preflight');

  preflightLayouts({
    PptxGenJS,
    lesson: { slides: [{ template: 'teach' }] },
    contextForSlide: ctxFor,
    drawSlide: () => note('a warning raised during the dry run'),
  });

  const after = getWarnings();
  assert.equal(after.length, 1);
  assert.match(after[0], /before the preflight/);
  clearWarnings();
});

test('a long fixed caption warns and changes nothing', () => {
  const caption = 'w'.repeat(200);
  const lesson = {
    slides: [{ template: 'teach', content: { type: 'image', caption } }],
  };

  const warnings = capacityWarnings(lesson);
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].signal, 'FIXED_CAPTION_CAPACITY');
  assert.match(warnings[0].message, /Nothing was shortened/);
  // The content itself is untouched: what to cut is a teaching decision.
  assert.equal(lesson.slides[0].content.caption, caption);
});

test('a heavy success-criteria panel warns and keeps every criterion', () => {
  const criteria = ['One', 'Two', 'Three', 'Four', 'Five', 'Six'];
  const lesson = { slides: [{ template: 'teach', successCriteria: criteria }] };

  const warnings = capacityWarnings(lesson);
  assert.equal(warnings[0].signal, 'SUCCESS_CRITERIA_CAPACITY');
  assert.match(warnings[0].message, /Nothing was removed/);
  assert.equal(lesson.slides[0].successCriteria.length, 6);
});

test('an ordinary slide raises no capacity warnings', () => {
  const lesson = {
    slides: [
      {
        template: 'teach',
        successCriteria: ['Read it', 'Say it'],
        content: { type: 'image', caption: 'A short caption' },
      },
    ],
  };

  assert.deepEqual(capacityWarnings(lesson), []);
});

// A refusal has to be findable. "registry does not allow content type table in
// zone class E-narrow" names neither the object the designer has to go and look
// at nor a move that would fix it. A Year 4 PSHE deck put a two-column criteria
// table inside a success-criteria panel in a sidebar, on both of its task
// slides, spent three repair passes on other faults and shipped both slides
// blank (21 September 2026).

test('a refused nested type names the container it sits in', () => {
  const { drawContent } = require('../src/content');
  const lesson = {
    slides: [
      {
        template: 'teach',
        content: {
          type: 'sc-panel',
          content: { type: 'table', headers: ['The change', 'The reason'], rows: [['a', 'b']] },
        },
      },
    ],
  };

  const result = preflightLayouts({
    PptxGenJS,
    lesson,
    contextForSlide: ctxFor,
    drawSlide: (pptx, slide, data, ctx) =>
      drawContent(
        pptx,
        slide,
        { x: 0, y: 0, w: 2, h: 2, class: 'E-narrow' },
        data.content,
        ctx
      ),
  });

  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].signal, 'CONTENT_ZONE_INCOMPATIBLE');
  assert.match(result.errors[0].message, /content of a "sc-panel"/);
  assert.match(result.errors[0].message, /cannot widen the zone/);
});

test('a refusal says which zones the type does fit', () => {
  const { drawContent } = require('../src/content');
  const lesson = {
    slides: [{ template: 'teach', content: { type: 'table', headers: ['a'], rows: [['b']] } }],
  };

  const result = preflightLayouts({
    PptxGenJS,
    lesson,
    contextForSlide: ctxFor,
    drawSlide: (pptx, slide, data, ctx) =>
      drawContent(
        pptx,
        slide,
        { x: 0, y: 0, w: 2, h: 2, class: 'E-narrow' },
        data.content,
        ctx
      ),
  });

  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0].message, /fits zone class A, B, C, E-wide/);
  // The discrimination case: with no container, no container sentence.
  assert.doesNotMatch(result.errors[0].message, /content of a/);
});
