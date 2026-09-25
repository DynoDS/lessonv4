'use strict';

// The practice templates' success-criteria panel widens itself, only as far as
// 18pt needs, and never past half the slide.
//
// The teacher's decision of 23 September 2026. Lists written the way he now
// likes them, six to eight clear steps, did not fit the 4.60in panel at all,
// and a refused practice slide is delivered as a page telling him to check it.
// So the panel takes the narrowest of 4.60, 5.50 and 6.35in that holds the
// whole list at 18pt or more. He chose 18pt rather than 20pt as the trigger so
// no lesson that draws today changes: a list that fits 4.60in keeps it. The
// question and working side give up what the panel takes, and on
// `maths-turn-sc` a picture too narrow to sit beside the working space goes
// above it instead. The designer has nothing to choose.

const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawSlide } = require('../src/templates');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { getWarnings, clearWarnings } = require('../src/warnings');
const { pictureFloorFindings, clearPictureFloor, missingPictureFindings, clearMissingPictures } = require('../src/content/image');
const { zoneFillWarnings, clearZoneFill } = require('../src/content/_zone-fill');
const { SLIDE_W, SLIDE_H } = require('../src/layout');
const { BLOCKING_CAPACITY_SIGNALS, runSlideDesignCheck } = require('../scripts/check-slide-design');
const { capacityWarnings } = require('../src/content/capacity');

// His style, six to eight steps: the long-list investigation's stress lists.
const LONG = {
  compare: [
    'Write both numbers in a place value chart, one under the other.',
    'Compare the thousands digits first.',
    'If they are the same, compare the hundreds.',
    'Keep moving right until two digits are different.',
    'The number with the greater digit is the greater number.',
    'Put < or > between the numbers, with the open side facing the greater number.',
  ],
  addition: [
    'Write the numbers in columns, with the ones lined up.',
    'Add the ones first.',
    'If you have ten ones or more, exchange ten ones for one ten.',
    'Write the exchanged ten under the line in the tens column.',
    'Add the tens, including any ten you exchanged.',
    'Do the same for the hundreds and the thousands.',
    'Check your answer by doing the inverse calculation.',
  ],
  numberLine: [
    'Find the two numbers marked at each end of the line.',
    'Larger number - smaller number.',
    'Count the jumps between them.',
    'Divide the difference by the number of jumps to find each jump.',
    'Count on from the first number, adding that amount for each jump.',
    'Check the numbers follow the same pattern all the way along.',
  ],
  circuit: [
    'Draw the cell with the long line on the positive side.',
    'Use a ruler to draw straight wires with square corners.',
    'Draw each bulb as a circle with a cross inside it.',
    'Draw the switch as a gap with a line lifted up from one side.',
    'Join every part into one loop with no gaps.',
    'Check the loop goes through every component once.',
    'Label each component with its name.',
  ],
  setting: [
    'Start with a fronted adverbial to say when or where.',
    'Use an expanded noun phrase to describe the setting.',
    'Choose a powerful verb to show how the character moves.',
    'Add a feeling the character has and show it with an action.',
    'Use a comma after your fronted adverbial.',
    'Check every sentence starts with a capital letter and ends with a full stop.',
    'Read it back to check it makes sense.',
  ],
  multiplication: [
    'Write the 3-digit number on top and the 1-digit number under the ones.',
    'Multiply the ones first.',
    'If the answer is 10 or more, write the ones and carry the tens under the next column.',
    'Multiply the tens.',
    'Add any tens you carried, then write the answer in the tens column.',
    'If that is 10 or more, carry the hundreds the same way.',
    'Multiply the hundreds and add anything you carried.',
    'Check your answer with an estimate.',
  ],
};
// The width the investigation measured for each, at the 18pt trigger.
const EXPECTED_W = { compare: 5.5, addition: 5.5, numberLine: 5.5, circuit: 5.5, setting: 6.35, multiplication: 6.35 };
const ROUNDING = ['Change the ones digit to 0.', 'Add 10.', 'Mark halfway and your number.', 'Round to the nearer ten. If it is halfway, round up.'];

const NUMBER_LINE = { type: 'numberline', start: 200, end: 300, interval: 20, labels: [200, 300], lineLabels: false };

const TEMPLATES = {
  'maths-turn-sc': (steps) => ({ template: 'maths-turn-sc', title: 'My Turn', questions: ['Round 346 to the nearest ten.'],
    questionVisual: { type: 'text', value: '346' }, workingSpace: true, criteria: { type: 'steps', steps } }),
  'maths-turn-ref-sc': (steps) => ({ template: 'maths-turn-ref-sc', title: 'My Turn', questions: ['Which town is bigger?'],
    reference: { type: 'text', value: 'Ashby 4,352 and Brook 4,381' }, hideWorkingSpace: false, criteria: { type: 'steps', steps } }),
  'maths-your-turn-sc': (steps) => ({ template: 'maths-your-turn-sc', title: 'Your Turn',
    questions: ['Work out 2,457 + 1,386.', 'Work out 3,508 + 2,794.'], criteria: { type: 'steps', steps } }),
  'writing-turn-ref-sc': (steps) => ({ template: 'writing-turn-ref-sc', title: 'My Turn', questions: ['Write the opening of a story.'],
    reference: { type: 'text', value: 'As the sun rose, the tall trees cast long shadows.' }, criteria: { type: 'steps', steps } }),
};

function draw(slideData) {
  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();
  drawSlide(pptx, slide, slideData, { slideIndex: 0, cardLook: true, lesson: { subject: 'maths' }, imageDims: {} });
  const objects = slide._slideObjects;
  const box = (o) => o.options || {};
  const panel = box(objects.find((o) => box(o).fill && box(o).fill.color === 'D5F5E3'));
  return {
    objects,
    panel,
    stepFonts: objects.filter((o) => /step-text-\d+$/.test(String(box(o).objectName || ''))).map((o) => box(o).fontSize),
    // Everything on the body left of the panel: the question, picture, reference, cards and working space.
    left: objects.map(box).filter((o) => o.y >= 0.74 && o.x < panel.x),
    work: objects.map(box).find((o) => o.fill && o.fill.color === 'F2F2F2'),
  };
}

test('each long list in his style draws in every practice template, at 18pt or more, at the width it needs', () => {
  for (const [name, steps] of Object.entries(LONG)) {
    for (const [template, make] of Object.entries(TEMPLATES)) {
      const drawn = draw(make(steps));
      const where = `${name} on ${template}`;
      assert.equal(drawn.stepFonts.length, steps.length, `${where}: every step drawn`);
      assert.ok(drawn.stepFonts.every((pt) => pt >= 18), `${where}: drawn at ${drawn.stepFonts}`);
      assert.equal(drawn.panel.w, EXPECTED_W[name], `${where}: panel ${drawn.panel.w}in`);
      assert.ok(drawn.panel.w * drawn.panel.h <= 0.5 * SLIDE_W * SLIDE_H, `${where}: past half the slide`);
      // The panel keeps its right edge; the side beside it gives up the room.
      assert.ok(Math.abs(drawn.panel.x + drawn.panel.w - 13.11) < 1e-9, `${where}: right edge moved`);
      const rightmost = Math.max(...drawn.left.map((o) => o.x + o.w));
      assert.ok(rightmost <= drawn.panel.x - 0.3 + 1e-9, `${where}: the work runs into the panel (${rightmost.toFixed(3)})`);
    }
  }
});

test('a short list keeps the 4.60in panel where it has always been', () => {
  // criteria-lists-keep-their-size.test.js holds every real list to this; the
  // saved slides were redrawn object by object and none moved.
  for (const [template, make] of Object.entries(TEMPLATES)) {
    const drawn = draw(make(ROUNDING));
    assert.equal(drawn.panel.w, 4.6, template);
    assert.equal(drawn.panel.x, 8.51, template);
    const rightmost = Math.max(...drawn.left.map((o) => o.x + o.w));
    assert.ok(rightmost <= 8.21 + 1e-9, `${template}: the work side reaches ${rightmost}`);
  }
});

test('a number-line slide still draws when the panel widens: the line goes above the working space', () => {
  const drawn = draw({ template: 'maths-turn-sc', title: 'My Turn', questions: ['What number is the arrow pointing to?'],
    questionVisual: NUMBER_LINE, workingSpace: true, criteria: { type: 'steps', steps: LONG.numberLine } });
  assert.equal(drawn.panel.w, 5.5);
  assert.ok(drawn.stepFonts.every((pt) => pt >= 18));
  const picture = drawn.left.find((o) => o.fill && o.fill.color === 'FFFFFF' && o.y > 1.5);
  assert.ok(picture && drawn.work, 'the picture and the working space are both drawn');
  assert.ok(picture.y + picture.h <= drawn.work.y, 'the working space sits below the picture');
  assert.ok(Math.abs(picture.w - drawn.work.w) < 1e-9 && Math.abs(drawn.work.w - 7.09) < 1e-9, 'both take the whole side');
  // The picture takes at most half of the height below the question; the
  // working space keeps the rest.
  assert.ok(picture.h <= 0.5 * (7.25 - picture.y) + 1e-9, `the picture took ${picture.h.toFixed(2)}in`);
  assert.ok(drawn.work.h >= picture.h - 0.2, 'the working space kept the other half');
});

test('at 4.60in a number line keeps its place beside the working space', () => {
  const drawn = draw({ template: 'maths-turn-sc', title: 'My Turn', questions: ['Round 346 to the nearest ten.'],
    questionVisual: { type: 'numberline', start: 340, end: 350, interval: 5, labels: [340, 350], lineLabels: false },
    workingSpace: true, criteria: { type: 'steps', steps: ROUNDING } });
  assert.equal(drawn.panel.w, 4.6);
  assert.ok(drawn.work.x > 4, 'the working space is beside the picture, not below it');
});

test('a list no width holds is refused at the widest, before anything is drawn', () => {
  const long = 'Write each digit in its own column, lined up under the digit above it, and say its value.';
  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();
  let message = '';
  try {
    drawSlide(pptx, slide, TEMPLATES['maths-turn-sc'](Array.from({ length: 9 }, () => long)),
      { slideIndex: 0, cardLook: true, imageDims: {} });
  } catch (err) {
    message = err.message;
  }
  assert.match(message, /^STEP_TEXT_OVERLOAD: criterion \d+ does not fit its card at the 18pt readable minimum/);
  // The numbers are the widest card's: about 39 characters a line, not 26.
  const perLine = Number(/lines? of about (\d+)\)/.exec(message)[1]);
  assert.ok(perLine >= 36, `the refusal describes a ${perLine}-character line`);
  assert.equal(slide._slideObjects.length, 0, 'the slide was refused before anything was drawn');
  // It names the one shape that can hold more, never a wider one that is not
  // there, and never fewer criteria.
  assert.match(message, /The practice panel is already as wide as it goes\./);
  assert.match(message, /the half-width split \(`split-h-50-50`\) with the criteria in an `sc-panel` down one whole side is a little taller/);
  assert.doesNotMatch(message, /a wider or taller/);
  assert.match(message, /never fewer criteria/);
  // Whether the design marks the list too long is the build's to say, from
  // the design itself, not this refusal's (marked-criteria.test.js).
  assert.doesNotMatch(message, /flags? this list|marked too long/);
});

test('only the list not fitting widens the panel: a fraction wall too shallow in the criteria stack is refused at 4.60in', () => {
  // The plugin's own test lesson carries the steps and a fraction wall in one
  // criteria stack. On slides 5 and 9 to 12 it is the wall that is refused in
  // the 4.60in panel; the panel must not widen to make room for it, because
  // the teacher agreed a box that widens when a list needs it.
  const lesson = require(path.join(__dirname, '..', 'test-lessons', 'eq-fractions', 'lesson.json'));
  for (const number of [5, 9, 10, 11, 12]) {
    const pptx = new PptxGenJS();
    const slide = pptx.addSlide();
    let message = '';
    try {
      drawSlide(pptx, slide, lesson.slides[number - 1], { slideIndex: number - 1, cardLook: true, imageDims: {} });
    } catch (err) {
      message = err.message;
    }
    assert.match(message, /^FRACTION_WALL_ZONE_TOO_SHALLOW/, `slide ${number}: ${message.slice(0, 120)}`);
    assert.equal(slide._slideObjects.length, 0, `slide ${number} drew a panel`);
  }
  // On slides 7 and 8 it is the five steps in the same stack that do not fit,
  // so the panel tries the wider widths, as for any list, and is refused at
  // 6.35in by the widest card's numbers.
  for (const number of [7, 8]) {
    let message = '';
    try {
      drawSlide(new PptxGenJS(), new PptxGenJS().addSlide(), lesson.slides[number - 1], { slideIndex: number - 1, cardLook: true, imageDims: {} });
    } catch (err) {
      message = err.message;
    }
    assert.match(message, /^STEP_TEXT_OVERLOAD/, `slide ${number}: ${message.slice(0, 120)}`);
    const perLine = Number(/lines? of about (\d+)\)/.exec(message)[1]);
    assert.ok(perLine >= 36, `slide ${number} was refused by a ${perLine}-character card, not the widest`);
  }
});

test('at 4.60in nothing moves: a picture that cannot sit beside the working space is refused as before, and goes above only once the panel widens', () => {
  const chart = { type: 'place-value-chart', columns: ['Thousands', 'Hundreds', 'Tens', 'Ones'],
    rows: [{ label: '7,482', cells: ['7', '4', '8', '2'] }, { label: 'Value', cells: ['', '', '', ''] }] };
  const slideWith = (steps) => ({ template: 'maths-turn-sc', title: 'Our Turn', questions: ['Write the number in expanded form.'],
    questionVisual: chart, workingSpace: true, criteria: { type: 'steps', steps } });
  let message = '';
  try {
    drawSlide(new PptxGenJS(), new PptxGenJS().addSlide(), slideWith(ROUNDING), { slideIndex: 0, cardLook: true, imageDims: {} });
  } catch (err) {
    message = err.message;
  }
  assert.match(message, /^PLACE_VALUE_WRITE_IN_TOO_NARROW/, 'at 4.60in the chart stays beside the working space and is refused, as before');
  const drawn = draw(slideWith(LONG.addition));
  assert.equal(drawn.panel.w, 5.5);
  assert.ok(drawn.work.x < 1 && drawn.work.w > 7, 'once the panel widens the chart goes above the working space');
});

test('a photo beside the working space stays beside it, and its findings are reported once', () => {
  // A photograph always draws, so it does not move above the working space;
  // below its readable floor it is reported, once, from the real drawing, not
  // again from the tries that chose the panel's width or the picture's place.
  const slideData = { template: 'maths-turn-sc', title: 'My Turn', questions: ['What is happening in the photograph?'],
    questionVisual: { type: 'image', imagePath: 'unsplash/not-yet-delivered.jpg' }, workingSpace: true,
    criteria: { type: 'steps', steps: LONG.setting } };
  clearPictureFloor();
  clearZoneFill();
  clearMissingPictures();
  clearWarnings();
  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();
  drawSlide(pptx, slide, slideData, { slideIndex: 0, cardLook: true, imageDims: {}, lesson: { slides: [slideData] } });
  const panel = slide._slideObjects.find((o) => o.options && o.options.fill && o.options.fill.color === 'D5F5E3').options;
  const work = slide._slideObjects.find((o) => o.options && o.options.fill && o.options.fill.color === 'F2F2F2').options;
  assert.equal(panel.w, 6.35);
  assert.ok(work.x > 3, 'the working space is still beside the photo');
  const floor = pictureFloorFindings().filter((f) => f.slide === 1);
  assert.equal(floor.length, 1, `the floor finding was reported ${floor.length} times`);
  assert.equal(missingPictureFindings().length, 1);
  assert.equal(zoneFillWarnings().length, new Set(zoneFillWarnings().map((f) => f.message)).size, 'a zone finding was repeated');
  const floorWarnings = getWarnings().filter((w) => /on its short side/.test(w));
  assert.equal(floorWarnings.length, 1, floorWarnings.join('\n'));
  clearPictureFloor();
  clearZoneFill();
  clearMissingPictures();
  clearWarnings();
});

test('the retired maths-mtotyt-sc keeps its fixed 4.60in panel', () => {
  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();
  drawSlide(pptx, slide, { template: 'maths-mtotyt-sc', title: 'Round', myTurn: ['Round 346.'], ourTurn: ['Round 581.'],
    yourTurn: ['Round 725.'], criteria: { type: 'steps', steps: ROUNDING } }, { slideIndex: 0, cardLook: true, imageDims: {} });
  const panel = slide._slideObjects.find((o) => o.options && o.options.fill && o.options.fill.color === 'D5F5E3').options;
  assert.equal(panel.w, 4.6);
  assert.equal(panel.x, 8.51);
});

test('no finding store keeps what a try raises: each is recorded once, from the real drawing', () => {
  // The panel's widths and the picture's place are chosen by drawing onto a
  // slide nobody sees. The zone-fill and missing-picture stores, like the
  // picture floor (the photo test above), must keep nothing a try raises.
  const { withoutRecording } = require('../src/warnings');
  const { checkZoneFill } = require('../src/content/_zone-fill');
  const { drawImage } = require('../src/content/image');
  const ctx = { slideIndex: 0, cardLook: true, imageDims: {} };
  const underfilled = () => checkZoneFill(ctx, { w: 13.0, h: 3.5 }, { w: 7.0, h: 3.5 }, 'the world map');
  const missing = () => drawImage(new PptxGenJS(), new PptxGenJS().addSlide(), { x: 0.2, y: 0.8, w: 4, h: 3 },
    { type: 'image', imagePath: 'unsplash/not-yet-delivered.jpg' }, ctx);
  clearZoneFill();
  clearMissingPictures();
  clearWarnings();
  try {
    withoutRecording(() => { underfilled(); missing(); });
    assert.equal(zoneFillWarnings().length, 0, 'a try recorded a zone finding');
    assert.equal(missingPictureFindings().length, 0, 'a try recorded a missing picture');
    assert.equal(getWarnings().length, 0, 'a try raised a warning');
    underfilled();
    missing();
    assert.equal(zoneFillWarnings().length, 1);
    assert.equal(missingPictureFindings().length, 1);
  } finally {
    clearZoneFill();
    clearMissingPictures();
    clearWarnings();
  }
});

// Lists the lesson designer could not tighten, in his style: the practice panel
// at its widest holds SMALLER at 17pt; only the half-width side holds
// HALF_SIDE_ONLY, at 16pt; no panel holds BEYOND even at 16pt.
const SMALLER = [
  'Round each number to the nearest hundred before you add, and write them down.',
  'Add the rounded numbers in your head and write the estimate beside the question.',
  'Work out the exact answer with the column method, lining up every column.',
  'Compare the exact answer with your estimate and say whether they are close.',
  'If they are not close, check each column again, starting with the ones.',
  'Write a sentence that says how your estimate helped you check the answer.',
  'Circle the answer you trust most and explain to a partner why you trust it.',
];
const HALF_SIDE_ONLY = [
  'Write the 3-digit number on top and the 1-digit number under the ones column.',
  'Multiply the ones first, and say the multiplication out loud as you do it.',
  'If the answer is 10 or more, carry the tens under the next column to the left.',
  'Multiply the tens, then add any tens you carried before you write anything.',
  'If that is 10 or more, carry the hundreds under the hundreds column the same way.',
  'Multiply the hundreds and add anything you carried, then write the answer.',
  'Read the whole answer back, from the hundreds to the ones, saying each value.',
  'Check your answer with an estimate, rounding to the nearest hundred first.',
];
const BEYOND = Array.from({ length: 9 }, () =>
  'Write each digit in its own column, lined up under the digit above it, and say its value.');

function markedDesign(root, lists) {
  fs.writeFileSync(path.join(root, 'lesson-design.json'), JSON.stringify({
    successCriteria: lists.map(([steps, marked], i) => Object.assign(
      { id: `sc-00${i + 1}`, type: 'steps', drawLive: false, content: { steps } },
      marked ? { tooLongForPanels: true } : {})),
  }));
}

test('a list marked too long is drawn smaller on a finished slide; only one no panel holds even at 16pt is a page to check, and never the deck', async () => {
  // The teacher's decision 11: an error never costs the deck. His ruling of
  // 24 September 2026: a list the lesson designer marked too long rather than
  // tightened is drawn at the largest size that fits, down to 16pt, on a
  // finished slide flagged for him, not left as a blank page ("it should still
  // try to fix it try to repair it"). The build reads the mark from the design
  // beside the lesson. So in one delivered deck: the marked list is drawn
  // smaller and flagged as the design's; a list nobody marked keeps the 18pt
  // floor and is a page to check, its roomier shape named; a marked list only
  // the half-width split holds is the slide designer's to move there; and a
  // marked list no panel holds even at 16pt, the rarest case, is a page to
  // check that the slide designer leaves.
  const other = 'Say the value of every digit out loud to your partner, from the thousands to the ones.';
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'marked-smaller-'));
  const lessonPath = path.join(root, 'lesson.json');
  const say = { speakerNotes: 'Say to children: go.' };
  fs.writeFileSync(lessonPath, JSON.stringify({
    lessonName: 'Marked Smaller', subject: 'Maths', lo: 'Deliver a deck with lists too long for the panels',
    slides: [
      { template: 'split-v-60-40', title: 'A clean slide', primary: { type: 'text', value: 'Round 342 to the nearest 100.' },
        secondary: { type: 'text', value: 'Show it on a number line.' } },
      Object.assign(TEMPLATES['maths-turn-sc'](SMALLER), say),
      Object.assign(TEMPLATES['maths-your-turn-sc'](Array.from({ length: 9 }, () => other)), say),
      Object.assign(TEMPLATES['maths-turn-sc'](HALF_SIDE_ONLY), say),
      Object.assign(TEMPLATES['maths-turn-sc'](BEYOND), say),
    ],
  }));
  markedDesign(root, [[SMALLER, true], [Array.from({ length: 9 }, () => other), false], [HALF_SIDE_ONLY, true], [BEYOND, true]]);
  try {
    const run = spawnSync(process.execPath, [path.join(__dirname, '..', 'build.js'), lessonPath, path.join(root, 'out'), '--deliver-flagged'],
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    const output = `${run.stdout || ''}${run.stderr || ''}`;
    if (/AUTOFIT_(DEPENDENCY_MISSING|NOT_PERMITTED)/.test(output)) return;
    assert.equal(run.status, 0, output.slice(-1500));
    const deck = path.join(root, 'out', 'Marked Smaller.pptx');
    assert.ok(fs.existsSync(deck), 'the deck was not written');
    const line = output.split(/\r?\n/).find((l) => l.startsWith('SLIDES_FLAGGED: '));
    const flags = JSON.parse(line.slice('SLIDES_FLAGGED: '.length));
    assert.deepEqual(flags.slides, [2, 3, 4, 5], 'every slide with a list too long for the panels is named, and only those');
    assert.match(output, /3 of 5 slides could not be laid out: 3, 4, 5\./, 'the marked list the panel holds at 17pt is drawn');
    const diagnostics = output.split(/\r?\n/).filter((l) => l.startsWith('BUILD_DIAGNOSTIC: '))
      .map((l) => JSON.parse(l.slice('BUILD_DIAGNOSTIC: '.length)));
    const on = (slide, signal) => diagnostics.find((d) => d.location.slide === slide && d.signal === signal);
    // Drawn smaller: finished, flagged, the design's.
    const smaller = on(2, 'CRITERIA_BELOW_READABLE_FLOOR');
    assert.equal(smaller.faultClass, 'content');
    assert.match(smaller.message, /are laid out at 17pt, under the 18pt floor/);
    assert.ok(!on(2, 'STEP_TEXT_OVERLOAD') && !on(2, 'TEXT_OVERLOAD'), 'nothing refused slide 2');
    // Nobody marked it: the 18pt floor, and the roomier shape named.
    assert.equal(on(3, 'STEP_TEXT_OVERLOAD').faultClass, 'composition');
    assert.match(on(3, 'STEP_TEXT_OVERLOAD').message, /at the 18pt readable minimum\. .*The practice panel is already as wide as it goes\./);
    // Marked, and the half-width split holds it at 16pt: the slide designer's move.
    assert.equal(on(4, 'STEP_TEXT_OVERLOAD').faultClass, 'composition');
    assert.match(on(4, 'STEP_TEXT_OVERLOAD').message, /at the 16pt a list marked too long may be drawn at\. .*the half-width split \(`split-h-50-50`\)/);
    // Marked, and no panel holds it even at 16pt: the design's, left alone.
    assert.equal(on(5, 'STEP_TEXT_OVERLOAD').faultClass, 'content');
    assert.match(on(5, 'STEP_TEXT_OVERLOAD').message, /^This success-criteria list is marked too long in the design \(`tooLongForPanels`\), and no criteria panel holds it as this slide carries it, even at 16pt/);
    // The final text fit let the marked lines stay under 18pt, and no lower
    // than 16pt, in the deck itself.
    const JSZip = requireGlobal('jszip');
    const xml = await (await JSZip.loadAsync(fs.readFileSync(deck))).file('ppt/slides/slide2.xml').async('string');
    const lines = xml.split('<p:sp>').filter((shape) => /marked-step-text-\d+"/.test(shape));
    assert.equal(lines.length, SMALLER.length);
    for (const shape of lines) {
      const size = Number(/ sz="(\d+)"/.exec(shape)[1]);
      assert.ok(size >= 1600 && size < 1800, `a marked line at ${size / 100}pt`);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('the slide check\'s scratch build passes a marked list drawn smaller, and its finding is not one the check refuses over', () => {
  // The flag is for the teacher: the design's, not a composition fault, and
  // not one of the findings the slide check refuses a candidate over. The
  // check builds each candidate in design-preview mode, in a private scratch
  // folder, with the design beside the candidate.
  assert.ok(!BLOCKING_CAPACITY_SIGNALS.has('CRITERIA_BELOW_READABLE_FLOOR'));
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'marked-check-'));
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'lesson-resources-slide-design-check-'));
  const lessonPath = path.join(root, 'lesson.json.tmp.attempt-1');
  fs.writeFileSync(lessonPath, JSON.stringify({
    lessonName: 'Marked Check', subject: 'Maths', lo: 'Check a marked list',
    slides: [Object.assign(TEMPLATES['maths-turn-sc'](SMALLER), { speakerNotes: 'Say to children: go.' })],
  }));
  const preview = () => spawnSync(process.execPath, [path.join(__dirname, '..', 'build.js'), lessonPath, scratch, '--design-preview'],
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  try {
    markedDesign(root, [[SMALLER, true]]);
    const run = preview();
    const output = `${run.stdout || ''}${run.stderr || ''}`;
    if (/AUTOFIT_(DEPENDENCY_MISSING|NOT_PERMITTED)/.test(output)) return;
    assert.equal(run.status, 0, output.slice(-1500));
    assert.equal((run.stdout || '').split(/\r?\n/).filter((l) => l.startsWith('Wrote: ')).length, 1);
    assert.match(run.stdout, /"signal":"CRITERIA_BELOW_READABLE_FLOOR","artifact":"slides","faultClass":"content"/);
    // Unmarked, the same slide is refused, as every list too long at 18pt is.
    markedDesign(root, [[SMALLER, false]]);
    assert.notEqual(preview().status, 0);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(scratch, { recursive: true, force: true });
  }
});

test('a long list that fits costs the slide designer no repair pass: the criteria cue is a note in its own check', () => {
  // The teacher's decisions of 10 and 23 September 2026: six steps, or 320
  // characters, is a cue to look, never a fault ("never fewer criteria"; "I
  // don't think the slide designer reports back. There should be a way to make
  // it fit"). The slide check used to refuse every such list at its spec-only
  // stage, so every long list in his style cost its repair passes.
  assert.ok(!BLOCKING_CAPACITY_SIGNALS.has('SUCCESS_CRITERIA_CAPACITY'));
  const slide = Object.assign(TEMPLATES['maths-turn-sc'](LONG.compare), { speakerNotes: 'Say to children: go.' });
  const cues = capacityWarnings({ slides: [slide] });
  assert.deepEqual(cues.map((w) => [w.signal, w.cue]), [['SUCCESS_CRITERIA_CAPACITY', true]]);
  // Five steps over 320 characters draw the same cue, by their total.
  const byTotal = capacityWarnings({ slides: [TEMPLATES['maths-turn-sc'](HALF_SIDE_ONLY.slice(0, 5))] });
  assert.deepEqual(byTotal.map((w) => [w.signal, w.cue, /characters/.test(w.message)]), [['SUCCESS_CRITERIA_CAPACITY', true, true]]);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'criteria-cue-'));
  const lessonPath = path.join(root, 'lesson.json.tmp.attempt-1');
  fs.writeFileSync(lessonPath, JSON.stringify({ lessonName: 'Criteria Cue', subject: 'Maths', lo: 'Compare', slides: [slide] }));
  try {
    const result = runSlideDesignCheck(lessonPath);
    const output = `${result.stdout}${result.stderr}`;
    if (/AUTOFIT_(DEPENDENCY_MISSING|NOT_PERMITTED)/.test(output)) return;
    assert.equal(result.ok, true, output.slice(-2000));
    assert.match(result.stderr, /1 slide-design note\(s\), a cue to look and never a fault:\n  note: slide 1 successCriteria: SUCCESS_CRITERIA_CAPACITY: 6 criteria on one panel/);
    // The build reports the cue as a note too, never as a composition fault
    // for the slide designer to repair.
    const cueLines = result.stdout.split(/\r?\n/).filter((l) => l.startsWith('BUILD_DIAGNOSTIC: ') && /SUCCESS_CRITERIA_CAPACITY/.test(l));
    assert.ok(cueLines.length >= 1);
    assert.ok(cueLines.every((l) => JSON.parse(l.slice('BUILD_DIAGNOSTIC: '.length)).faultClass === 'note'), cueLines.join('\n'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('trying the widths raises no warnings of their own', () => {
  clearWarnings();
  draw(TEMPLATES['maths-turn-sc'](LONG.setting));
  const settled = getWarnings().filter((w) => /success criteria set at/.test(w));
  assert.equal(settled.length, 1, settled.join('\n'));
  clearWarnings();
});
