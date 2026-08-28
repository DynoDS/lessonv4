'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { COLOURS } = require('../src/styles');
const {
  baseColourForRole,
  presentationRuns,
  validatePresentationSpec
} = require('../src/presentation-text');
const { validateLesson } = require('../src/validate');
const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawContent } = require('../src/content');
const { drawQuestionCards } = require('../src/content/question-cards');

const ZONE = { x: 0, y: 0, w: 10, h: 5, class: 'A' };

function capture(drawer, zone, data, ctx) {
  const shapes = [];
  const texts = [];
  const images = [];
  const pptx = new PptxGenJS();
  const slide = {
    addShape: (kind, options) => shapes.push({ kind, ...options }),
    addText: (content, options) => texts.push({ content, ...options }),
    addImage: (options) => images.push(options)
  };
  drawer(pptx, slide, zone, data, ctx || { slideIndex: 0, imageDims: {} });
  return { shapes, texts, images };
}

test('baseColourForRole maps the peer roles onto the deck palette', () => {
  assert.equal(baseColourForRole(COLOURS.body, undefined), COLOURS.body);
  assert.equal(baseColourForRole(COLOURS.body, ''), COLOURS.body);
  assert.equal(baseColourForRole(null, 'default'), COLOURS.body);
  assert.equal(baseColourForRole(COLOURS.body, 'peer-blue'), COLOURS.title);
  assert.equal(baseColourForRole(COLOURS.body, 'peer-purple'), COLOURS.lo);
  assert.throws(
    () => baseColourForRole(COLOURS.body, 'peer-red'),
    /PRESENTATION_TEXT_INVALID/
  );
});

test('a plain string comes back unchanged for the block colour', () => {
  // Unmarked text stays a plain string (the addText-compatible form); the
  // peer colour is applied to the block it lands in, not to invented runs.
  assert.equal(
    presentationRuns('Build the circuit', true, COLOURS.body, {}),
    'Build the circuit'
  );
  assert.equal(
    presentationRuns('Build the circuit', true, COLOURS.body, {
      colorRole: 'peer-blue'
    }),
    'Build the circuit'
  );
});

test('focus-blue is the single-question house-blue role', () => {
  assert.equal(
    baseColourForRole(COLOURS.body, 'focus-blue'),
    COLOURS.title
  );
});

test('task-action exposes action verbs without changing the source string', () => {
  const text = 'Build the circuit. Test the switch. Record the result.';
  const runs = presentationRuns(text, true, COLOURS.body, {
    emphasis: [
      { text: 'Build', role: 'task-action' },
      { text: 'Test', role: 'task-action' },
      { text: 'Record', role: 'task-action' }
    ]
  });

  assert.equal(
    runs.map((run) => run.text).join(''),
    text
  );

  for (const verb of ['Build', 'Test', 'Record']) {
    const run = runs.find((entry) => entry.text === verb);
    assert.ok(run);
    assert.equal(run.options.color, COLOURS.title);
    assert.equal(run.options.bold, true);
  }
});

test('safety-warning uses problem red without becoming problem-state', () => {
  const text = 'Use only the supplied low-voltage equipment.';
  const runs = presentationRuns(text, true, COLOURS.body, {
    emphasis: [
      { text, role: 'safety-warning' }
    ]
  });

  assert.equal(runs[0].text, text);
  assert.equal(runs[0].options.color, COLOURS.problem);
  assert.equal(runs[0].options.bold, true);
});

test('peer colour roles recolour every run of the string', () => {
  const blue = presentationRuns(
    'Join the lamp. Then read the meter.',
    true,
    COLOURS.body,
    {
      colorRole: 'peer-blue',
      emphasis: [{ text: 'read the meter', role: 'response-demand' }]
    }
  );
  assert.ok(
    blue.every((run) => run.options.color === COLOURS.title),
    'a peer-blue line keeps its blue on every unemphasised run'
  );

  const purple = presentationRuns(
    'The switch opens.',
    true,
    COLOURS.body,
    {
      colorRole: 'peer-purple',
      emphasis: [{ text: 'The switch', role: 'vocabulary' }]
    }
  );
  assert.equal(purple.map((run) => run.text).join(''), 'The switch opens.');
  assert.deepEqual(
    purple.map((run) => run.options.color),
    [COLOURS.green, COLOURS.lo]
  );
});

test('emphasis roles render their own styling on their own words', () => {
  const runs = presentationRuns(
    'The lamp lights. Join the wires. Watch the switch.',
    true,
    COLOURS.body,
    {
      emphasis: [
        { text: 'The lamp lights.', role: 'core-action' },
        { text: 'Watch the switch.', role: 'problem-state' }
      ]
    }
  );
  assert.equal(runs.map((run) => run.text).join(''),
    'The lamp lights. Join the wires. Watch the switch.');

  const byText = Object.fromEntries(runs.map((run) => [run.text, run.options]));
  assert.equal(byText['The lamp lights.'].color, COLOURS.title);
  assert.equal(byText['The lamp lights.'].bold, true);
  assert.equal(byText['Watch the switch.'].color, COLOURS.problem);
  assert.equal(byText['Watch the switch.'].bold, true);

  const underlined = presentationRuns(
    'Take the wire. Say the reason.',
    true,
    COLOURS.body,
    {
      emphasis: [
        { text: 'Take the wire', role: 'required-material' },
        { text: 'Say the reason', role: 'reasoning-demand' }
      ]
    }
  );
  const underlinedTexts = underlined
    .filter((run) => run.options.underline)
    .map((run) => run.text);
  assert.deepEqual(underlinedTexts, ['Take the wire', 'Say the reason']);
  underlined.forEach((run) => {
    if (run.options.underline) {
      assert.deepEqual(run.options.underline, { style: 'sng' });
      assert.equal(run.options.bold, true);
    }
  });
});

test('validatePresentationSpec reports every contract break', () => {
  assert.match(
    validatePresentationSpec('Join the wires', {
      emphasis: [{ text: 'missing words', role: 'core-action' }]
    }),
    /must occur exactly once/
  );
  assert.match(
    validatePresentationSpec('cell cell', {
      emphasis: [{ text: 'cell', role: 'vocabulary' }]
    }),
    /must occur exactly once/
  );
  assert.match(
    validatePresentationSpec('The lamp lights up.', {
      emphasis: [
        { text: 'The lamp lights', role: 'core-action' },
        { text: 'lamp lights up', role: 'problem-state' }
      ]
    }),
    /overlap/
  );
  assert.match(
    validatePresentationSpec('Join the wires', {
      emphasis: [{ text: 'Join', role: 'loud' }]
    }),
    /must be one of/
  );
  assert.match(
    validatePresentationSpec('Join the wires', {
      emphasis: [{ text: 'Join', role: 'core-action', extra: true }]
    }),
    /must contain exactly text and role/
  );
  assert.match(
    validatePresentationSpec('Join the wires', { emphasis: [] }),
    /at least one/
  );
  assert.match(
    validatePresentationSpec('6 × 7 = ||42', {
      emphasis: [{ text: '6 × 7', role: 'core-action' }]
    }),
    /legacy inline markers/
  );
  assert.match(
    validatePresentationSpec('Join the wires', { colorRole: 'peer-red' }),
    /colorRole must be one of/
  );
  assert.equal(
    validatePresentationSpec('Join the wires', {
      colorRole: 'peer-blue',
      emphasis: [{ text: 'Join', role: 'core-action' }]
    }),
    null
  );
});

test('presentationRuns throws a typed error for an invalid spec', () => {
  assert.throws(
    () => presentationRuns('Join the wires', true, COLOURS.body, {
      emphasis: [{ text: 'missing', role: 'core-action' }]
    }),
    /PRESENTATION_TEXT_INVALID: .*must occur exactly once/
  );
  assert.throws(
    () => presentationRuns('Join the wires', true, COLOURS.body, {
      emphasis: 'core-action'
    }),
    /PRESENTATION_TEXT_INVALID: emphasis must be an array/
  );
});

test('lesson validation reports emphasis that never appears in the text', () => {
  const result = validateLesson({
    lessonName: 'Presentation validation',
    slides: [{
      template: 'body-full',
      title: 'Task',
      body: {
        type: 'text',
        value: 'Build a circuit',
        emphasis: [{ text: 'missing words', role: 'core-action' }]
      }
    }]
  }, process.cwd());
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /must occur exactly once/);
});

test('text content honours peer colour roles and emphasis runs', () => {
  const peer = capture(drawContent, ZONE, {
    type: 'text',
    value: 'The lamp is the load',
    colorRole: 'peer-purple'
  });
  assert.equal(peer.texts[0].color, COLOURS.lo);

  const emphasised = capture(drawContent, ZONE, {
    type: 'text',
    value: 'Join the circuit. Now switch it on.',
    emphasis: [{ text: 'Now switch it on', role: 'core-action' }]
  });
  const runs = emphasised.texts[0].content;
  assert.ok(Array.isArray(runs));
  assert.equal(runs.map((run) => run.text).join(''),
    'Join the circuit. Now switch it on.');
  const action = runs.find((run) => run.text === 'Now switch it on');
  assert.equal(action.options.color, COLOURS.title);
  assert.equal(action.options.bold, true);
});

test('question cards keep the peer colour on the whole question', () => {
  const { texts } = capture(drawQuestionCards, ZONE, {
    questions: [
      { text: 'What is 6 × 7?', colorRole: 'peer-blue' },
      'What is 9 × 4?'
    ]
  });
  const peer = texts.find((entry) => entry.content === 'What is 6 × 7?');
  const plain = texts.find((entry) => entry.content === 'What is 9 × 4?');
  assert.ok(peer, 'peer question should render');
  assert.ok(plain, 'plain question should render');
  assert.equal(peer.color, COLOURS.title);
  assert.equal(plain.color, COLOURS.body);
});
