'use strict';

// What the slide says about a labelled diagram's own labels.
//
// The labels are drawn into the picture the slide places, so no text measure
// and no page reader sees them. A Year 4 digestion deck went out on 6 October
// 2026 with eight paragraph-long callouts piled on each other on four slides
// and every check passed.
//
// The shared drawing now stacks the poster layout's labels by their height, so
// that pile cannot be drawn. What is pinned here is the slide's half:
//   - labels that still collide or run off the drawing (only a label placed
//     where it is told can) are refused by the slide-design check, with the
//     one field that repairs them, and flag their slide in a delivered deck;
//   - labels taller than their picture are laid out and reported as a cue,
//     which refuses nothing and flags nothing.

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const requireGlobal = require('../src/require-global');
const { runSlideDesignCheck } = require('../scripts/check-slide-design');
const { labelFaultsFor } = require('../src/content/label-diagram');
const { tightSvg } = require('../../shared/visuals/label-diagram-svg');

const BUILD = path.join(__dirname, '..', 'build.js');

// The callouts of the delivered deck, as its slide spec held them.
const DIGESTION = [
  { anchor: [7, 45], label: 'mouth\nTeeth break food into smaller pieces. Saliva wets food and starts breaking some of it down.', given: true },
  { anchor: [21, 43], label: 'oesophagus\nMuscles push food to the stomach.', given: true },
  { anchor: [38, 46], label: 'stomach\nThe stomach churns food with digestive juices, which help break it down.', given: true },
  { anchor: [55, 49], label: 'small intestine\nDigestion continues here. Tiny nutrients pass into the blood.', given: true },
  { anchor: [72, 43], label: 'large intestine\nThe large intestine takes in water from what is left.', given: true },
  { anchor: [87, 46], label: 'rectum\nThe rectum holds faeces.', given: true },
  { anchor: [97, 48], label: 'anus\nWaste leaves through the anus.', given: true },
  { anchor: [54, 73], label: 'blood', given: true },
];

// Two parts close together at the left edge of the picture.
const CLOSE = [
  { anchor: [10, 50], label: 'small intestine', given: true },
  { anchor: [12, 52], label: 'large intestine', given: true },
];

const measure = (diagram) => tightSvg({ ...diagram, imageHref: 'route.png', imageWidth: 1536, imageHeight: 1024 });

async function lessonWith(diagram) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'label-diagram-labels-test-'));
  const sharp = requireGlobal('sharp');
  await sharp({ create: { width: 1536, height: 1024, channels: 3, background: '#DDEEDD' } })
    .png().toFile(path.join(root, 'route.png'));
  const file = path.join(root, 'lesson.json.tmp.test-attempt');
  fs.writeFileSync(file, JSON.stringify({
    lessonName: 'Label check',
    subject: 'Science',
    lo: 'Explain how the digestive system works',
    slides: [
      {
        template: 'teach-layout',
        layout: 'labelled-picture-lines',
        headerStyle: 'title',
        title: 'Say what happens to the food',
        pictures: [{ type: 'label-diagram', imagePath: 'route.png', essential: true, ...diagram }],
        lines: [
          'In the stomach, food mixes with digestive juices.',
          { value: 'The juices help break food down further.', orange: true },
        ],
        speakerNotes: 'Say to children: follow the food to the stomach.',
      },
    ],
  }, null, 2));
  return { root, file };
}

test('the fault names the two labels and the one field that repairs them', () => {
  const diagram = { imagePath: 'route.png', callouts: CLOSE };
  const found = labelFaultsFor(diagram, measure(diagram));
  assert.equal(found.length, 1);
  assert.equal(found[0].signal, 'LABEL_DIAGRAM_LABELS_COLLIDE');
  assert.ok(!found[0].cue);
  assert.match(found[0].message, /"small intestine" on "large intestine"/);
  assert.match(found[0].message, /"layout": "sides"/);
  assert.match(found[0].message, /label_at/);
});

test('names in the poster layout raise nothing', () => {
  const diagram = { imagePath: 'route.png', layout: 'sides', callouts: CLOSE };
  assert.deepEqual(labelFaultsFor(diagram, measure(diagram)), []);
  assert.deepEqual(labelFaultsFor(diagram, undefined), [], 'a picture not on disk yet has nothing to measure');
});

test('sentence-long labels in the poster layout are a cue, never a fault', () => {
  const diagram = { imagePath: 'route.png', layout: 'sides', callouts: DIGESTION };
  const found = labelFaultsFor(diagram, measure(diagram));
  assert.equal(found.length, 1);
  assert.equal(found[0].signal, 'LABEL_DIAGRAM_LABELS_OUTGROW_PICTURE');
  assert.equal(found[0].cue, true);
  assert.match(found[0].message, /times as tall as the picture/);
  assert.match(found[0].message, /a cue to look, not a fault/);
  assert.match(found[0].message, /lines beside the picture/);
});

test('the slide-design check refuses labels drawn on each other, and passes the same diagram as a poster', async () => {
  const piled = await lessonWith({ callouts: CLOSE });
  const poster = await lessonWith({ callouts: CLOSE, layout: 'sides' });
  try {
    const refused = runSlideDesignCheck(piled.file);
    assert.equal(refused.ok, false, refused.stdout + refused.stderr);
    assert.equal(refused.reason, 'SLIDE_DESIGN_CAPACITY');
    assert.match(refused.stdout, /"signal":"LABEL_DIAGRAM_LABELS_COLLIDE"/);
    assert.match(refused.stdout, /"slide":1/);

    const passed = runSlideDesignCheck(poster.file);
    assert.equal(passed.ok, true, passed.stdout + passed.stderr);
    assert.doesNotMatch(passed.stdout, /LABEL_DIAGRAM_LABELS/);
  } finally {
    fs.rmSync(piled.root, { recursive: true, force: true });
    fs.rmSync(poster.root, { recursive: true, force: true });
  }
});

test('the delivered callouts pass the check laid out, with the cue beside them', async () => {
  const delivered = await lessonWith({ callouts: DIGESTION, layout: 'sides' });
  try {
    const result = runSlideDesignCheck(delivered.file);
    assert.equal(result.ok, true, result.stdout + result.stderr);
    assert.match(result.stdout, /"signal":"LABEL_DIAGRAM_LABELS_OUTGROW_PICTURE","artifact":"slides","faultClass":"note"/);
    assert.doesNotMatch(result.stdout, /LABEL_DIAGRAM_LABELS_COLLIDE/);
  } finally {
    fs.rmSync(delivered.root, { recursive: true, force: true });
  }
});

test('a delivered deck flags the slide whose labels collide, and not one whose labels are only tall', async () => {
  const piled = await lessonWith({ callouts: CLOSE });
  const tall = await lessonWith({ callouts: DIGESTION, layout: 'sides' });
  try {
    const build = (lesson) => {
      const out = path.join(lesson.root, 'out');
      fs.mkdirSync(out);
      const target = path.join(lesson.root, 'lesson.json');
      fs.copyFileSync(lesson.file, target);
      return spawnSync(process.execPath, [BUILD, target, out, '--deliver-flagged'], { encoding: 'utf8' });
    };

    const flagged = build(piled);
    assert.equal(flagged.status, 0, flagged.stdout + flagged.stderr);
    assert.match(flagged.stdout, /^Wrote: /m, 'one bad slide does not withhold the deck');
    const line = /^SLIDES_FLAGGED: (.*)$/m.exec(flagged.stdout);
    assert.ok(line, flagged.stdout);
    const named = JSON.parse(line[1]);
    assert.deepEqual(named.slides, [1]);
    assert.equal(named.faults[0].signal, 'LABEL_DIAGRAM_LABELS_COLLIDE');

    const clean = build(tall);
    assert.equal(clean.status, 0, clean.stdout + clean.stderr);
    assert.match(clean.stdout, /^Wrote: /m);
    assert.doesNotMatch(clean.stdout, /^SLIDES_FLAGGED: /m);
  } finally {
    fs.rmSync(piled.root, { recursive: true, force: true });
    fs.rmSync(tall.root, { recursive: true, force: true });
  }
});

// ── The size of the words ────────────────────────────────────────────────────
//
// A label on the board is board text. Until 8 October 2026 its size was a
// twentieth of the picture, so a picture sharing a slide took its labels down
// with it: on the 7 October stress test three photographs across a slide left
// the letters A to D at 11pt, and the Earth beside the Sun was named at 14pt.
// The teacher's rulings on the real pages: 20pt on every slide, 18pt only where
// 20pt would leave the picture too small, never less; the picture takes the
// room the words leave; and a picture that is left too small is a fault.

const { layoutAt, pictureFaultFor, preparedLabelDiagrams, preRenderLabelDiagrams, labelDiagramKey } =
  require('../src/content/label-diagram');

function laidOut(diagram, w, h, size = { width: 1536, height: 1024 }) {
  const images = preparedLabelDiagrams({ [labelDiagramKey(diagram)]: { href: 'x', ...size } });
  return layoutAt(diagram, images[labelDiagramKey(diagram)], { labelDiagramImages: images, slideIndex: 0 }, w, h);
}

const NAMES = { imagePath: 'river.jpg', layout: 'sides', callouts: [
  { anchor: [30, 60], label: 'confluence', given: true }, { anchor: [70, 60], label: 'tributary', given: true },
] };

test('a label is 20pt on the board however small its picture is drawn', () => {
  const letters = { imagePath: 'river.jpg', layout: 'sides', callouts: [
    { anchor: [30, 60], label: 'B', given: true }, { anchor: [70, 60], label: 'C', given: true },
  ] };
  // A third of a slide, half a slide, most of a slide.
  for (const [w, h] of [[3.9, 2.6], [6.2, 3.5], [12, 5.5]]) {
    const laid = laidOut(letters, w, h);
    assert.ok(Math.abs(laid.pt - 20) < 0.01, `${w}" by ${h}": ${laid.pt}pt`);
    assert.ok(laid.w <= w + 1e-6 && laid.h <= h + 1e-6, 'and the drawing stays in its room');
    assert.equal(pictureFaultFor(letters, laid), null);
  }
});

test('the words drop to 18pt only where 20pt would leave the picture too small', () => {
  const roomy = laidOut(NAMES, 7, 4);
  assert.ok(Math.abs(roomy.pt - 20) < 0.01, `${roomy.pt}pt`);

  let tight = null;
  for (let w = 7; w > 4 && !tight; w -= 0.02) {
    const laid = laidOut(NAMES, w, 4);
    if (Math.abs(laid.pt - 18) < 0.01 && !laid.squeezed) tight = laid;
  }
  assert.ok(tight, 'some width is tight enough for 18pt');
  assert.ok(tight.pictureShort >= 1.6, 'and there 18pt keeps the picture over its floor');
  assert.equal(pictureFaultFor(NAMES, tight), null);
});

test('words that leave the picture too small are a fault that names the ways out, and never shrink below 18pt', () => {
  const laid = laidOut(NAMES, 4.4, 2.6);
  assert.ok(laid.pt >= 18 - 0.01, `${laid.pt}pt`);
  const fault = pictureFaultFor(NAMES, laid);
  assert.ok(fault);
  assert.equal(fault.signal, 'LABEL_DIAGRAM_PICTURE_TOO_SMALL');
  assert.match(fault.message, /fewer pictures on this slide/);
  assert.match(fault.message, /letters \(A, B, C\)/);
  // A picture that is only context is meant to be small.
  assert.equal(pictureFaultFor({ ...NAMES, essential: false }, laid), null);
});

test('the same picture in the same slot of two slides stands still when a label gets longer', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'label-diagram-still-test-'));
  try {
    const sharp = requireGlobal('sharp');
    await sharp({ create: { width: 1500, height: 1000, channels: 3, background: '#112233' } })
      .png().toFile(path.join(root, 'earth.png'));
    const diagram = (label) => ({
      type: 'label-diagram', imagePath: 'earth.png', layout: 'sides',
      callouts: [{ anchor: [40, 70], label, given: true }, { anchor: [70, 50], label: 'day', given: true }],
    });
    const slide = (label, template) => ({ template, layout: 'two-pictures', pictures: [diagram(label)] });
    const lesson = { slides: [
      slide('here', 'teach-layout'),
      slide('We are here, half a turn later', 'teach-layout'),
      slide('here', 'split-h-60-40'),
    ] };
    const images = await preRenderLabelDiagrams(lesson, root);
    const at = (i) => {
      const data = lesson.slides[i].pictures[0];
      return layoutAt(data, images[labelDiagramKey(data)], { labelDiagramImages: images, slideIndex: i }, 6.2, 3.5);
    };
    const [first, second, elsewhere] = [at(0), at(1), at(2)];
    assert.deepEqual(first.picture, second.picture, 'one place and one size on both slides');
    assert.deepEqual([first.w, first.h], [second.w, second.h]);
    // A slide that arranges its pictures differently shares nothing.
    assert.ok(elsewhere.picture.w > first.picture.w, 'and a different template keeps no room for words it does not carry');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
