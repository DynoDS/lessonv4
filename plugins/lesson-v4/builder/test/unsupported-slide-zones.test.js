'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const PptxGenJS = require('../src/require-global')('pptxgenjs');
const JSZip = require('../src/require-global')('jszip');
const { validateLesson } = require('../src/validate');
const { drawSlide } = require('../src/templates');

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

// Immutable minimal copies of the two S3 controls: the original wrapper fault
// and its valid top-level-slot counterpart.
const BASELINE = deepFreeze({
  lessonName: 'Multiplication fact',
  yearGroup: 'Year 4',
  subject: 'Maths',
  slides: [
    {
      template: 'body-full',
      headerStyle: 'title',
      title: 'Multiplication fact',
      designUnitId: 'trial/maths/unit-001',
      zones: {
        body: {
          type: 'text',
          value: 'What is 6 × 7?',
          color: '0070C0',
          fontSize: 60,
          align: 'center',
          widthMode: 'content',
          placement: 'center'
        }
      },
      speakerNotes: 'Say to children: Work it out on your own and show your answer.\n\nAnswer to question(s) on this slide: 42'
    },
    {
      template: 'body-full',
      headerStyle: 'title',
      title: 'Answers',
      designUnitId: 'trial/maths/unit-001',
      zones: {
        body: {
          type: 'text',
          value: '||42',
          fontSize: 72,
          align: 'center',
          widthMode: 'content',
          placement: 'center'
        }
      },
      speakerNotes: ''
    }
  ]
});

const COUNTERPART = deepFreeze({
  lessonName: 'Multiplication fact',
  yearGroup: 'Year 4',
  subject: 'Maths',
  lo: '',
  slides: [
    {
      template: 'body-full',
      headerStyle: 'title',
      title: 'Multiplication fact',
      designUnitId: 'trial/maths/unit-001',
      body: { type: 'text', value: '[[What is 6 × 7?]]', align: 'center' },
      speakerNotes: 'Say to children: Work it out on your own and show your answer.\n\nAnswer to question(s) on this slide: 42'
    },
    {
      template: 'body-full',
      headerStyle: 'title',
      title: 'Answers',
      designUnitId: 'trial/maths/unit-001',
      body: { type: 'text', value: '[[What is 6 × 7?]]  ||42', align: 'center' },
      speakerNotes: ''
    }
  ]
});

test('the failing baseline is refused at its unsupported zones.body location', () => {
  const { errors } = validateLesson(BASELINE, '.');
  const wrapperErrors = errors.filter((error) => /"zones" is not a supported lesson-slide content wrapper/.test(error));

  assert.equal(wrapperErrors.length, 2, 'both blank slides carry a zones wrapper');
  assert.ok(wrapperErrors.every((error) => /zones\.body/.test(error)));
  assert.ok(wrapperErrors.every((error) => /move that content to "body"/.test(error)));
});

test('the valid top-level-body counterpart passes and the normal template renderer draws it', async () => {
  const lesson = COUNTERPART;
  assert.deepEqual(validateLesson(lesson, '.').errors, []);

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  lesson.slides.forEach((source, slideIndex) => {
    drawSlide(pptx, pptx.addSlide(), source, {
      lesson,
      slideIndex,
      cardLook: true,
      imageDims: {}
    });
  });
  const zip = await JSZip.loadAsync(await pptx.write({ outputType: 'nodebuffer' }));
  const xmls = await Promise.all(lesson.slides.map(async (_source, index) =>
    zip.file(`ppt/slides/slide${index + 1}.xml`).async('string')
  ));

  assert.match(xmls[0], /What is 6/);
  assert.match(xmls[0], /7\?/);
  assert.match(xmls[1], /42/);
});

test('a nested content helper remains valid when it is in the supported body slot', () => {
  const lesson = {
    lessonName: 'Slide content slots',
    yearGroup: 'Year 4',
    subject: 'Maths',
    slides: [{
      template: 'body-full',
      headerStyle: 'title',
      title: 'Multiplication fact',
      body: {
        type: 'stack',
        items: [
          { type: 'text', value: 'First clue.' },
          { type: 'text', value: 'Second clue.' }
        ]
      }
    }]
  };
  const { errors } = validateLesson(lesson, '.');

  assert.deepEqual(errors, []);
});
