'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const PptxGenJS = require('../src/require-global')('pptxgenjs');
const { validateLesson } = require('../src/validate');
const { drawChipBank } = require('../src/content/chip-bank');

function lessonWithBody(body) {
  return {
    lessonName: 'Chip bank validation',
    yearGroup: 'Year 4',
    subject: 'Maths',
    lo: 'Explain a comparison',
    slides: [{ template: 'body-full', title: 'Explain', body }]
  };
}

function collect() {
  const shapes = [];
  const texts = [];
  return {
    shapes,
    texts,
    slide: {
      addShape: (kind, options) => shapes.push({ kind, ...options }),
      addText: (content, options) => texts.push({ content, ...options })
    }
  };
}

test('a missing chips field is rejected with the supported field named', () => {
  const result = validateLesson(lessonWithBody({ type: 'chip-bank', items: ['because'] }), '.');
  assert.ok(result.errors.some((error) => /non-empty "chips" array/.test(error)));
  assert.ok(result.errors.some((error) => /"items" field is not read/.test(error)));

  assert.throws(
    () => drawChipBank({}, collect().slide, { x: 0, y: 0, w: 6, h: 2 }, {
      type: 'chip-bank', items: ['because']
    }),
    /CHIP_BANK_CONTENT.*"chips" array.*"items" is not read/
  );
});

test('empty and malformed banks are rejected, including inside a stack', () => {
  const nested = lessonWithBody({
    type: 'stack',
    items: [{ type: 'chip-bank', chips: [] }]
  });
  assert.ok(validateLesson(nested, '.').errors.some((error) => /non-empty "chips" array/.test(error)));

  const invalidLabels = lessonWithBody({
    type: 'chip-bank', chips: ['because', '  ', 4, '{{ }}', '{{because', '{{because}} trailing']
  });
  const errors = validateLesson(invalidLabels, '.').errors;
  assert.ok(errors.some((error) => /chip 2 .*not a readable text label/.test(error)));
  assert.ok(errors.some((error) => /chip 3 .*not a readable text label/.test(error)));
  assert.ok(errors.some((error) => /chip 4 .*not a readable text label/.test(error)));
  assert.ok(errors.some((error) => /chip 5 .*not a readable text label/.test(error)));
  assert.ok(errors.some((error) => /chip 6 .*not a readable text label/.test(error)));

  assert.throws(
    () => drawChipBank({}, collect().slide, { x: 0, y: 0, w: 6, h: 2 }, {
      type: 'chip-bank', chips: []
    }),
    /CHIP_BANK_CONTENT.*non-empty "chips" array/
  );
  assert.throws(
    () => drawChipBank({}, collect().slide, { x: 0, y: 0, w: 6, h: 2 }, {
      type: 'chip-bank', chips: ['{{because']
    }),
    /CHIP_BANK_CONTENT.*Taught-word labels.*\{\{word\}\}/
  );
});

test('valid top-level and nested chip banks pass validation and draw their labels', () => {
  const valid = lessonWithBody({
    type: 'stack',
    items: [{ type: 'chip-bank', title: 'Use these words', chips: ['because', '{{evidence}}'] }]
  });
  assert.deepEqual(validateLesson(valid, '.').errors, []);

  const { shapes, texts, slide } = collect();
  drawChipBank(new PptxGenJS(), slide, { x: 0, y: 0, w: 8, h: 2.4 }, {
    type: 'chip-bank', chips: ['because', '{{evidence}}']
  });
  assert.equal(shapes.filter((shape) => shape.rectRadius !== undefined).length, 2);
  assert.deepEqual(texts.map((entry) => entry.content), ['because', 'evidence']);
});
