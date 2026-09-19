'use strict';

// A success-criteria card and the build's final text check must agree.
//
// A Year 4 "round to the nearest 100" deck was withheld whole on 16 September
// 2026. Its fourth criterion, "Choose the nearer hundred; at halfway, choose the
// greater hundred.", was sized by the card layout from a count of letters, which
// said three lines. The final check measures the real words in the real font,
// which wrap to four, and the card was about a millimetre short. The layout
// passed it on every My Turn and Your Turn slide, so the designer never saw a
// fault it could repair, and the final check then refused eleven slides at once
// after every repair pass had been spent elsewhere.
//
// The contract this file holds: a card the layout passes is a card the final
// check passes. Either the layout refuses a criterion early, by name, while the
// designer can still move it, or the finished card holds it.

const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');

const CHECK = path.join(__dirname, '..', 'scripts', 'check-slide-design.js');

// Real criteria sets, the kind a lesson designer writes, including the one that
// cost the deck. Each goes on its own fixed Your Turn slide, where the panel's
// size is the template's and nothing the designer does can change it.
const CRITERIA_SETS = [
  [
    "If it's already a {{multiple of 100}}, <<keep it unchanged>>.",
    'Write the 100s either side of your number at the ends of a number line.',
    'Mark {{halfway}} and place your number.',
    'Choose the <<nearer hundred>>; at halfway, choose the <<greater hundred>>.',
  ],
  [
    'Find the two multiples of 10 your number sits between.',
    'Look at the ones digit to decide which ten is nearer.',
    'When the ones digit is 5, round up to the greater ten.',
  ],
  [
    'Read the scale and work out what each interval is worth.',
    'Count on from the last labelled mark in those steps.',
    'Check your reading against the marks either side.',
    'Write the value with its unit.',
    'Explain how you know the interval is right.',
  ],
];

test('a criteria card the layout passes is never refused by the final text check', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'criteria-card-fit-'));
  const lessonPath = path.join(root, 'lesson.json.tmp.criteria-card-fit');
  const lesson = {
    lessonName: 'Criteria Card Fit',
    subject: 'Maths',
    lo: 'Check criteria cards',
    slides: CRITERIA_SETS.map((steps) => ({
      template: 'maths-your-turn-sc',
      title: 'Your Turn',
      questions: ['Round 34 to the nearest 100.'],
      criteria: { type: 'steps', steps },
    })),
  };
  fs.writeFileSync(lessonPath, JSON.stringify(lesson, null, 2));

  const result = spawnSync(process.execPath, [CHECK, lessonPath], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  fs.rmSync(root, { recursive: true, force: true });
  const output = `${result.stdout || ''}${result.stderr || ''}`;

  // A machine that cannot measure says nothing about the cards either way.
  if (/AUTOFIT_(DEPENDENCY_MISSING|NOT_PERMITTED)/.test(output)) {
    return;
  }

  // Passing because the check stopped at some unrelated rule would prove
  // nothing, so the check has to have reached the cards.
  assert.match(
    output,
    /SLIDE_DESIGN_CHECK_OK|STEP_TEXT_OVERLOAD|TEXT_OVERLOAD/,
    `the check never reached the criteria cards:
${output.slice(-1200)}`
  );

  const lateRefusals = output
    .split(/\r?\n/)
    .filter((line) => line.startsWith('BUILD_DIAGNOSTIC: '))
    .map((line) => JSON.parse(line.slice('BUILD_DIAGNOSTIC: '.length)))
    .filter((d) => d.signal === 'TEXT_OVERLOAD' && /step-(text|reference)-/.test(d.location.box || ''));

  assert.deepEqual(
    lateRefusals.map((d) => `slide ${d.location.slide}: ${d.message}`),
    [],
    'the layout passed a criteria card that the final text check then refused'
  );
});

test('a criteria panel that settles below the readable target says which step did it', () => {
  // 19 September 2026: a Codex run recorded four panels at 18pt as an accepted
  // minor issue, with nothing naming the step that was too long.
  const { drawScPanelContent } = require('../src/content/sc-panel');
  const { getWarnings, clearWarnings } = require('../src/warnings');
  const requireGlobal = require('../src/require-global');
  const PptxGenJS = requireGlobal('pptxgenjs');

  const slide = {
    shapes: [], texts: [],
    addShape(kind, options) { this.shapes.push({ kind, ...options }); },
    addText(content, options) { this.texts.push({ content, ...options }); },
    addImage() {}
  };
  const long = {
    criteria: {
      type: 'steps',
      steps: [
        'Change the hundreds, tens and ones digits to zero.',
        'Add 1,000 to find the next thousand.',
        'Mark halfway and your number on the line.',
        'Choose the nearer thousand; at halfway, choose the greater thousand.'
      ]
    }
  };

  clearWarnings();
  drawScPanelContent(new PptxGenJS(), slide, { x: 0, y: 0, w: 4.6, h: 6.5 }, long,
    { slideIndex: 0, imageDims: {}, cardLook: true });
  const warned = getWarnings().join(' ');
  assert.match(warned, /success criteria set at \d+pt/);
  assert.match(warned, /Choose the nearer thousand/);
  clearWarnings();
});
