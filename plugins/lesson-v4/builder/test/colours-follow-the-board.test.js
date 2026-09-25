'use strict';

// The board's colours, by the teacher's rule of 24 September 2026 (decision 11
// of the rest-of-preferences ledger, and the topic 7 change plan's question 1):
// blue is a question or the child's short task ("Explain your answer.", "Write
// one reason."), marked by the designer with `task-blue`, and advice on how to go
// about the task stays black; green is a taught word or an answer; a worked
// example is purple, the same colour as a sticky fact, marked `worked-purple`.
// These pin what the builder draws; the check's side is in
// slide-design-check.test.js.

const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawTitleHeader, drawStarterHeader } = require('../src/headers');
const { drawCallout } = require('../src/content/callout');
const { drawChipBank } = require('../src/content/chip-bank');
const { drawMethodFrame } = require('../src/content/method-frame');
const { drawText } = require('../src/content/text');
const { drawSteps } = require('../src/content/steps');
const { expandTeachLayouts } = require('../src/teach-layouts');
const { validateLesson } = require('../src/validate');
const { baseColourForRole, COLOR_ROLES } = require('../src/presentation-text');
const { COLOURS } = require('../src/styles');

const ZONE = { x: 0, y: 0, w: 10, h: 5, class: 'A' };

function capture(drawer, data) {
  const shapes = [];
  const texts = [];
  const slide = {
    addShape: (kind, options) => shapes.push({ kind, ...options }),
    addText: (content, options) => texts.push({ content, ...options }),
    addImage: () => {}
  };
  if (drawer === drawTitleHeader || drawer === drawStarterHeader) {
    drawer(slide, data, { cardLook: true });
  } else {
    drawer(new PptxGenJS(), slide, ZONE, data, { slideIndex: 0, imageDims: {} });
  }
  return { shapes, texts };
}

// ─── the two roles ────────────────────────────────────────────────────────────

test('a short task marked task-blue is drawn in house blue, and a worked line marked worked-purple in the sticky purple', () => {
  assert.ok(COLOR_ROLES.has('task-blue'));
  assert.ok(COLOR_ROLES.has('worked-purple'));
  assert.equal(baseColourForRole(COLOURS.body, 'task-blue'), COLOURS.title);
  assert.equal(baseColourForRole(COLOURS.body, 'worked-purple'), COLOURS.worked);
  assert.equal(COLOURS.worked, COLOURS.sticky, 'a worked example is the same purple as a sticky fact');
});

test('a text line carries its role onto the slide', () => {
  const colourOf = (result) => {
    const runs = result.texts.flatMap((entry) => (Array.isArray(entry.content) ? entry.content : [entry]));
    return runs.map((run) => (run.options && run.options.color) || run.color).filter(Boolean);
  };
  const task = capture(drawText, { type: 'text', colorRole: 'task-blue', value: 'Round 346 to the nearest 10.' });
  assert.ok(colourOf(task).includes(COLOURS.title), JSON.stringify(colourOf(task)));
  const worked = capture(drawText, { type: 'text', colorRole: 'worked-purple', value: '346 rounds to 350.' });
  assert.ok(colourOf(worked).includes(COLOURS.worked), JSON.stringify(colourOf(worked)));
  const plain = capture(drawText, { type: 'text', value: 'Use the shaded map.' });
  assert.ok(!colourOf(plain).includes(COLOURS.title), 'advice stays black');
});

// ─── the header's small cue stays black ─────────────────────────────────────

test('the header cue is advice on how to go about the task, and stays black', () => {
  for (const instruction of ['Use the word bank', 'Use the table', 'Look at both photographs', 'Explain.']) {
    const result = capture(drawTitleHeader, { title: 'Compare', instruction });
    assert.equal(result.texts.find((entry) => entry.content === instruction).color, COLOURS.body, instruction);
  }
  const starter = capture(drawStarterHeader, {
    headerStyle: 'starter',
    lo: 'To explain how switches work',
    heading: 'Starter',
    instruction: 'Use the word bank'
  });
  assert.equal(starter.texts.find((entry) => entry.content === 'Use the word bank').color, COLOURS.body);
});

// ─── a callout's colours are the board's ────────────────────────────────────

test('a callout with no variant is a black-edged statement, and green is not a callout colour', () => {
  const plain = capture(drawCallout, { text: 'The tens column changes.', points: 'none' });
  const box = plain.shapes.find((shape) => shape.line && shape.fill);
  assert.equal(box.line.color, COLOURS.body);
  // A spec that still names green gets the statement's black edge, never a
  // green frame round black words.
  const green = capture(drawCallout, { text: 'The tens column changes.', points: 'none', variant: 'green' });
  const greenBox = green.shapes.find((shape) => shape.line && shape.fill);
  assert.equal(greenBox.line.color, COLOURS.body);
  assert.notEqual(greenBox.line.color, COLOURS.green);
  // The board's other meanings stay.
  const blue = capture(drawCallout, { text: '[[Which digit changes?]]', points: 'none', variant: 'blue' });
  assert.equal(blue.shapes.find((shape) => shape.line && shape.fill).line.color, COLOURS.title);
  const orange = capture(drawCallout, { text: 'It holds 358.', points: 'none', variant: 'orange' });
  assert.equal(orange.shapes.find((shape) => shape.line && shape.fill).line.color, COLOURS.orange);
});

// ─── a taught word in a word bank is green ──────────────────────────────────

test('a chip written {{word}} prints green without its braces, and the others keep the variant', () => {
  const result = capture(drawChipBank, {
    title: 'Word bank',
    variant: 'yellow',
    chips: ['{{enamel}}', '{{dentine}}', 'because']
  });
  const chip = (label) => result.texts.find((entry) => entry.content === label);
  assert.equal(chip('enamel').color, COLOURS.green);
  assert.equal(chip('dentine').color, COLOURS.green);
  assert.equal(chip('because').color, COLOURS.body);
  assert.ok(!result.texts.some((entry) => String(entry.content).includes('{{')));
});

// ─── a worked example is purple ─────────────────────────────────────────────

test('the method frame draws its panel and title in the worked-example purple', () => {
  const result = capture(drawMethodFrame, {
    title: 'Adjusting strategy',
    lines: [
      { label: 'First, add:', content: '63 + 30 = 93' },
      { label: 'Then, adjust:', content: '93 - 1 = 92' }
    ]
  });
  // The pale ground is named as a value, not found by the same constant the
  // code uses, so a pale green under the purple edge fails here.
  assert.equal(COLOURS.workedBg, 'EDE3F5');
  const panel = result.shapes.find((shape) => shape.fill && shape.fill.color === 'EDE3F5');
  assert.ok(panel, 'no pale purple panel');
  assert.equal(panel.line.color, COLOURS.worked);
  assert.equal(result.texts.find((entry) => entry.content === 'Adjusting strategy').color, COLOURS.worked);
  assert.ok(!result.shapes.some((shape) => shape.line && shape.line.color === COLOURS.green));
});

test('a worked place-value row prints purple, a mistaken one included, its ringed digit and ring too', () => {
  // His answer, told he had greened a mistaken chain himself on 19 September:
  // "purple is fine". A worked row is `worked: true`, never `answer`, and the
  // digit the lesson is about, ringed, is purple with the rest: green in the
  // ring would call a wrong digit right.
  const { describeLayout } = require('../../shared/visuals/place-value-chart-svg');
  const { profileFor } = require('../../shared/visuals/surface-profiles');
  const board = profileFor('slides', { widthPt: 7.8 * 72, heightPt: 2.8 * 72 });
  const spec = {
    columns: ['Th', 'H', 'T', 'O'],
    rows: [
      { label: '3,462', cells: ['3', '4', '6', '2'] },
      { label: '10 more', cells: ['3', '5', '6', '2'], highlight: ['H'], worked: true }
    ]
  };
  const layout = describeLayout(spec, board);
  const digits = layout.texts.filter((t) => t.role === 'digit');
  const worked = digits.slice(4);
  assert.deepEqual(worked.map((t) => t.fill), ['#7030A0', '#7030A0', '#7030A0', '#7030A0']);
  assert.ok(worked[1].picked, 'the changed digit is still the ringed one');
  assert.equal(layout.rings.length, 1, 'the ring is still drawn round it');
  // His answer of 25 September 2026, shown the ring still green: "yes" to
  // purple. Nothing on a worked row is green.
  assert.equal(layout.rings[0].stroke, '#7030A0');
  const { tightSvg } = require('../../shared/visuals/place-value-chart-svg');
  const drawn = tightSvg(spec, board).svg;
  assert.ok(/fill="none" stroke="#7030A0"/.test(drawn), 'the drawn ring is purple');
  assert.ok(!/fill="none" stroke="#00B050"/.test(drawn), 'no ring on the chart is green');
  assert.ok(digits.slice(0, 4).every((t) => t.fill === '#000000'), 'the row it started from stays black');
  // A ringed digit on a row that is not worked keeps the ring's green.
  const plainLayout = describeLayout({ columns: ['T', 'O'], rows: [{ cells: ['4', '5'], highlight: ['T'] }] }, board);
  const plain = plainLayout.texts.filter((t) => t.role === 'digit');
  assert.equal(plain[0].fill, '#00B050');
  assert.equal(plainLayout.rings[0].stroke, '#00B050');
  // The stick-in pack is photocopied: a worked row prints in its ink.
  const pack = profileFor('stickin', { widthPt: 7.8 * 72, heightPt: 2.8 * 72 });
  const inked = describeLayout(spec, pack).texts.filter((t) => t.role === 'digit').slice(4);
  assert.ok(inked.every((t) => t.fill === '#1A1A1A'), JSON.stringify(inked.map((t) => t.fill)));
  const both = describeLayout(
    { columns: ['T', 'O'], rows: [{ cells: ['4', '0'], worked: true, answer: true }] },
    board
  ).texts.filter((t) => t.role === 'digit');
  assert.ok(both.every((t) => t.fill === '#00B050'), 'a row marked both reads as the answer it says it is');
});

// ─── purple reaches a Teach slide's model and a step list ───────────────────
// Sixteen of the seventeen saved models the class sees finished sit on Teach
// units, whose slide is a teach layout (the colours release's second check).

test('a teach-layout line takes worked-purple, and no other role', () => {
  const slide = (lines, extra) => Object.assign({
    template: 'teach-layout', layout: 'four-cards', headerStyle: 'title', title: 'Rounding to 10',
    speakerNotes: 'Say to children: look.', lines
  }, extra || {});
  const [expanded] = expandTeachLayouts({ slides: [slide([
    { value: '346 is between 340 and 350.', colorRole: 'worked-purple' },
    { value: 'It is nearer 350.', colorRole: 'worked-purple' },
    { value: 'So 346 rounds to 350.', colorRole: 'worked-purple' },
    'Halfway is 345.'
  ])] }).slides;
  const lines = [];
  const visit = (node) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== 'object') return;
    if (node.type === 'text') lines.push(node);
    Object.values(node).forEach(visit);
  };
  visit(expanded);
  const role = (words) => lines.find((line) => line.value === words).colorRole;
  assert.equal(role('346 is between 340 and 350.'), 'worked-purple');
  assert.equal(role('It is nearer 350.'), 'worked-purple');
  assert.equal(role('Halfway is 345.'), undefined);
  const refuses = (spec, pattern) => assert.throws(() => expandTeachLayouts({ slides: [spec] }), pattern);
  refuses(slide([{ value: 'A.', colorRole: 'task-blue' }, 'B.']), /colorRole cannot be set on a teach-layout line/);
  refuses(slide([{ value: 'A.', colorRole: 'focus-blue' }, 'B.']), /"worked-purple" on the lines of a worked example/);
  refuses(slide(['A.', 'B.'], { question: { value: 'Why?', colorRole: 'worked-purple' } }), /question stays blue/);
  refuses(slide(['A.', 'B.'], { sticky: { value: 'Keep this.', colorRole: 'worked-purple' } }), /line to remember is purple already/);
  refuses(slide([{ value: 'A.', colorRole: 'worked-purple', orange: true }, 'B.']), /cannot be orange as well/);
});

test('a Teach slide sets out a worked example as steps in purple; an extract refuses the role', () => {
  // The third check: the steps and picture-steps teach layouts took plain
  // strings only, and a source's extract took worked-purple and printed black.
  const worked = [
    { text: 'Look at the ones digit: 6.', colorRole: 'worked-purple' },
    { text: '6 is 5 or more, so round up.', colorRole: 'worked-purple' },
    'Check with the number line.'
  ];
  const [steps] = expandTeachLayouts({ slides: [{ template: 'teach-layout', layout: 'steps', headerStyle: 'title',
    title: 'How Sam rounded 346', speakerNotes: 'Say to children: look.', steps: worked }] }).slides;
  assert.deepEqual(steps.steps, worked);
  const drawn = capture(drawSteps, { type: 'steps', steps: steps.steps });
  const words = (text) => drawn.texts.find((entry) => JSON.stringify(entry.content).includes(text));
  assert.equal(words('Look at the ones digit').color, COLOURS.worked);
  assert.equal(words('Check with the number line').color, COLOURS.body);
  const refuses = (spec, pattern) => assert.throws(() => expandTeachLayouts({ slides: [spec] }), pattern);
  refuses({ template: 'teach-layout', layout: 'steps', headerStyle: 'title', title: 'Steps', speakerNotes: 'Say.',
    steps: [{ text: 'A.', colorRole: 'task-blue' }, 'B.', 'C.'] }, /\{ "text": "\.\.\.", "colorRole": "worked-purple" \}/);
  refuses({ template: 'teach-layout', layout: 'source-text', headerStyle: 'title', title: 'A source', speakerNotes: 'Say.',
    extract: { value: 'We are called at five in the morning.', colorRole: 'worked-purple' } },
    /an extract is the source's own words, drawn as they are written/);
});

test('a worked step that carries a mark stays purple, on a Teach slide and a free-zone list alike', () => {
  // The fourth check: a worked step with a taught word or a bold word printed
  // black apart from the marked word, because its runs started from body black.
  const worked = [
    { text: 'Sugar sits on the {{enamel}}.', colorRole: 'worked-purple' },
    { text: 'Acid makes a **hole**.', colorRole: 'worked-purple' },
    'Brush it away.'
  ];
  const teach = (layout, extra) => expandTeachLayouts({ slides: [Object.assign({ template: 'teach-layout', layout,
    headerStyle: 'title', title: 'How a tooth decays', speakerNotes: 'Say to children: look.', steps: worked }, extra)] }).slides[0];
  const lists = {
    'free-zone list': worked,
    'Teach steps': teach('steps').steps,
    'Teach picture-steps': teach('picture-steps', { pictures: [{ type: 'image', imagePath: 'tooth.png', essential: false }] }).secondary.steps
  };
  for (const [where, steps] of Object.entries(lists)) {
    const drawn = capture(drawSteps, { type: 'steps', steps });
    const runs = drawn.texts.flatMap((entry) => (Array.isArray(entry.content) ? entry.content : []));
    const colourOf = (text) => runs.find((run) => run.text === text).options.color;
    assert.equal(colourOf('Sugar sits on the '), COLOURS.worked, where);
    assert.equal(colourOf('enamel'), COLOURS.green, where);
    assert.equal(colourOf('Acid makes a '), COLOURS.worked, where);
    assert.equal(colourOf('hole'), COLOURS.worked, `${where}: a bold word in a worked step is purple too`);
  }
});

test('a Teach step object takes only its words and the worked role', () => {
  assert.throws(() => expandTeachLayouts({ slides: [{ template: 'teach-layout', layout: 'steps', headerStyle: 'title',
    title: 'Steps', speakerNotes: 'Say.', steps: [{ text: 'A.', colorRole: 'worked-purple', helper: 'arrow' }, 'B.', 'C.'] }] }),
  /no other field or role is taken/);
});

test('a step marked worked-purple prints purple, its number too, and any other role on a step is refused', () => {
  const result = capture(drawSteps, {
    type: 'steps',
    steps: [
      { text: 'Look at the ones digit: 6.', colorRole: 'worked-purple' },
      { text: '6 is 5 or more, so round up.', colorRole: 'worked-purple' },
      'Check with the number line.'
    ]
  });
  const words = (text) => result.texts.find((entry) => JSON.stringify(entry.content).includes(text));
  assert.equal(words('Look at the ones digit').color, COLOURS.worked);
  assert.equal(words('so round up').color, COLOURS.worked);
  assert.equal(words('Check with the number line').color, COLOURS.body);
  const badges = result.shapes.filter((shape) => shape.kind === 'ellipse' || (shape.fill && shape.line && shape.line.width === 1));
  assert.deepEqual(badges.map((shape) => shape.fill.color), [COLOURS.worked, COLOURS.worked, COLOURS.green]);
  const { errors } = validateLesson({
    lessonName: 'Steps',
    slides: [{ template: 'body-full', title: 'Round it', body: { type: 'steps', steps: [
      { text: 'Look at the ones digit.', colorRole: 'worked-purple' },
      { text: 'Round up.', colorRole: 'focus-blue' }
    ] } }]
  }, __dirname);
  assert.ok(errors.some((error) => /step 2 carries colorRole "focus-blue", which a step list does not draw/.test(error)), errors.join('\n'));
  assert.ok(!errors.some((error) => /step 1 carries colorRole/.test(error)), errors.join('\n'));
});

// ─── a taught word's braces never print from a figure ───────────────────────
// The third check: a figure's words are drawn into its picture by a shared
// drawing, which printed `{{enamel}}` as written. The board takes the braces off
// every figure before it pre-renders or draws; a caption it sets as text through
// answer-text keeps its mark and prints the word green, as it always did.

test('on the board a taught word prints plain inside a figure, and a caption set as text keeps its green', () => {
  const { withoutFigureMarks } = require('../src/figure-marks');
  const { splitAnswerRuns } = require('../src/answer-text');
  const vennShared = require('../../shared/visuals/venn-svg');
  const labelShared = require('../../shared/visuals/label-diagram-svg');
  const lesson = withoutFigureMarks({ slides: [{ template: 'body-full', title: 'Sort the shapes', body: { type: 'row', items: [
    { type: 'venn', label1: 'has a {{right angle}}', label2: '{{parallel}} sides',
      shapes: [{ region: 'overlap', label: '{{Square}}' }, { region: 'leftOnly', label: '{{Kite}} or {{Rhombus}}' }],
      label: 'A {{Venn}} of shapes' },
    { type: 'label-diagram', imagePath: 'tooth.png', layout: 'sides',
      callouts: [{ anchor: [30, 30], label: '{{enamel}}', given: true }, { anchor: [60, 70], label: 'the {{root}}', given: true }] },
    { type: 'text', value: 'The {{enamel}} protects the tooth.' }
  ] } }] });
  const [venn, diagram, text] = lesson.slides[0].body.items;
  // Every mark in a string comes off, not only the first.
  const { withoutTaughtMarks } = require('../../shared/text/criteria-marks');
  assert.equal(withoutTaughtMarks('{{enamel}} and {{dentine}}'), 'enamel and dentine');
  // The pictures the board pre-renders, from the same shared drawings.
  const drawnVenn = vennShared.tightSvg(venn).svg;
  assert.ok(!/\{\{|\}\}/.test(drawnVenn), 'braces in the drawn Venn');
  assert.ok(drawnVenn.includes('Square') && drawnVenn.includes('parallel'));
  const drawnDiagram = labelShared.tightSvg({ ...diagram, imageHref: 'data:image/png;base64,iVBORw0KGgo=',
    imageWidth: 400, imageHeight: 300 }).svg;
  assert.ok(!/\{\{|\}\}/.test(drawnDiagram), 'braces in the drawn diagram');
  assert.ok(drawnDiagram.includes('enamel') && drawnDiagram.includes('root'));
  // The Venn's caption is board text through answer-text: its word stays green.
  assert.equal(venn.label, 'A {{Venn}} of shapes');
  const green = splitAnswerRuns(venn.label, false).find((run) => run.text === 'Venn');
  assert.equal(green.options.color, COLOURS.green);
  // Words outside a figure keep their marks for the helper that draws them.
  assert.equal(text.value, 'The {{enamel}} protects the tooth.');
  // The build applies it once, to the lesson it both pre-renders and draws.
  const buildSource = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'build.js'), 'utf8');
  assert.ok(buildSource.includes('const coreLesson = withoutFigureMarks(withoutDecorations(lesson));'));
});
