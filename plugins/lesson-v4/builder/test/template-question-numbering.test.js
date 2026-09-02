'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const PptxGenJS = require('pptxgenjs');
const JSZip = require('jszip');

const { drawMathsTurnSc } = require('../src/templates/maths-turn-sc');
const { drawMathsTurnRefSc } = require('../src/templates/maths-turn-ref-sc');
const { drawWritingTurnRefSc } = require('../src/templates/writing-turn-ref-sc');

// These tests exercise the TEMPLATES, not drawQuestions() directly: a template
// that drops `data.questionNumbering` on its way to drawQuestions renders an
// identical unlettered deck either way, so the label assertions below can only
// pass if the field survives the trip from the lesson-design data down to the
// question rows.

const FOUR = [
  'What is 7 + 5?',
  'What is 12 - 4?',
  'What is 3 × 4?',
  'What is 20 - 8?'
];
const LABELS = ['(a)', '(b)', '(c)', '(d)'];

async function renderSlideXml(draw, data) {
  const pptx = new PptxGenJS();
  draw(pptx, pptx.addSlide(), data, {});
  const buffer = await pptx.write({ outputType: 'nodebuffer' });
  const zip = await JSZip.loadAsync(buffer);
  return zip.file('ppt/slides/slide1.xml').async('string');
}

function labelsIn(xml) {
  return LABELS.filter((label) => xml.includes(label));
}

test('maths-turn-sc letters a four-question teacher-led set (a) to (d)', async () => {
  const xml = await renderSlideXml(drawMathsTurnSc, {
    title: 'Our Turn',
    questions: FOUR,
    questionNumbering: 'teacher-led',
    criteria: {
      type: 'steps',
      heading: '\u2713 Success Criteria',
      steps: ['Add on the tens first', 'Then add the ones']
    }
  });
  assert.deepEqual(
    labelsIn(xml),
    LABELS,
    'maths-turn-sc must forward questionNumbering so a teacher-led set is lettered'
  );
  for (const question of FOUR) {
    assert.ok(xml.replace(/\u00a0/g, ' ').includes(question), 'every question still renders: ' + question);
  }
  assert.ok(xml.includes('Add on the tens first'), 'the criteria card renders with the lettered set');
});

test('maths-turn-sc stays unlettered without questionNumbering', async () => {
  const xml = await renderSlideXml(drawMathsTurnSc, {
    title: 'Our Turn',
    questions: FOUR,
    criteria: {
      type: 'steps',
      heading: '\u2713 Success Criteria',
      steps: ['Add on the tens first', 'Then add the ones']
    }
  });
  assert.deepEqual(
    labelsIn(xml),
    [],
    'no letters without an explicit teacher-led request'
  );
});

test('writing-turn-ref-sc letters a four-question teacher-led set (a) to (d)', async () => {
  const xml = await renderSlideXml(drawWritingTurnRefSc, {
    title: 'My Turn',
    questions: FOUR,
    questionNumbering: 'teacher-led',
    criteria: {
      type: 'steps',
      heading: '\u2713 Success Criteria',
      steps: ['Start with a capital letter', 'End with a full stop']
    }
  });
  assert.deepEqual(
    labelsIn(xml),
    LABELS,
    'writing-turn-ref-sc is a general off-slide template and must forward questionNumbering too'
  );
  for (const question of FOUR) {
    assert.ok(xml.replace(/\u00a0/g, ' ').includes(question), 'every question still renders: ' + question);
  }
  assert.ok(xml.includes('Start with a capital letter'), 'the criteria card renders with the lettered set');
});

test('writing-turn-ref-sc stays unlettered without questionNumbering', async () => {
  const xml = await renderSlideXml(drawWritingTurnRefSc, {
    title: 'My Turn',
    questions: FOUR,
    criteria: {
      type: 'steps',
      heading: '\u2713 Success Criteria',
      steps: ['Start with a capital letter', 'End with a full stop']
    }
  });
  assert.deepEqual(
    labelsIn(xml),
    [],
    'no letters without an explicit teacher-led request'
  );
});

test('maths-turn-ref-sc letters a four-question teacher-led set (a) to (d)', async () => {
  const xml = await renderSlideXml(drawMathsTurnRefSc, {
    title: 'Our Turn',
    questions: FOUR,
    questionNumbering: 'teacher-led',
    reference: { type: 'text', text: 'Train A leaves at 9:15' },
    referenceLabel: 'Timetable',
    criteria: {
      type: 'steps',
      heading: '\u2713 Success Criteria',
      steps: ['Read the table first', 'Then work out the gap']
    },
    hideWorkingSpace: true
  });
  assert.deepEqual(
    labelsIn(xml),
    LABELS,
    'maths-turn-ref-sc must forward questionNumbering so a teacher-led set is lettered'
  );
  for (const question of FOUR) {
    assert.ok(xml.replace(/\u00a0/g, ' ').includes(question), 'every question still renders: ' + question);
  }
  assert.ok(
    xml.includes('Train A leaves at 9:15'),
    'the reference renders beside the lettered set'
  );
  assert.ok(
    xml.includes('Read the table first'),
    'the success-criteria step renders with the lettered set'
  );
});

test('maths-turn-ref-sc stays unlettered without questionNumbering', async () => {
  const xml = await renderSlideXml(drawMathsTurnRefSc, {
    title: 'Our Turn',
    questions: FOUR,
    reference: { type: 'text', text: 'Train A leaves at 9:15' },
    referenceLabel: 'Timetable',
    criteria: {
      type: 'steps',
      heading: '\u2713 Success Criteria',
      steps: ['Read the table first', 'Then work out the gap']
    },
    hideWorkingSpace: true
  });
  assert.deepEqual(
    labelsIn(xml),
    [],
    'no letters without an explicit teacher-led request'
  );
});
