'use strict';

// A counters pair drawn smaller says so, with the room it needed whole.
//
// On a slide, a ringed exchange pair that does not fit its space is drawn
// without its exchange cue box, then without the columns the exchange does not
// touch (pair-beside-a-sum.test.js). It did that in silence, so a designer who
// wanted the box back could only find the room by trying sizes: the Year 4
// Lesson 29 designer drew the pair at fourteen sizes in a scratch script, and
// four of five subtraction designers read the chart's code for the same answer
// (17 October 2026). Now the build keeps a note, and the measure tool shows it.
//
// What this file pins:
//   - a pair drawn smaller leaves one note for its slide, naming what it lost;
//   - the width the note names really does hold the whole pair, cue box too;
//   - a pair drawn whole leaves no note, and a later whole draw of the same
//     pair on the same slide takes back an earlier note (the layout draws a
//     slide more than once);
//   - the measure tool prints the note under the slide, as a note.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const chart = require('../../shared/visuals/place-value-chart-svg');
const { profileFor } = require('../../shared/visuals/surface-profiles');
const { setHairUnderSlide } = require('../../shared/visuals/hair-under');

const slide = (wIn, hIn) => profileFor('slides', { widthPt: wIn * 72, heightPt: hIn * 72, overrides: { pairExchangeMarks: true } });
const hasCue = (L) => L.bars.some((b) => b.role === 'exchange-box');

// 52 as 5 tens and 2 ones, then 4 tens and 12 ones.
const tuesday = () => ({
  columns: ['T', 'O'],
  pair: {
    from: ['5', '2'], to: ['4', '12'], operation: '=', title: '',
    counters: { from: { T: 5, O: 2 }, to: { T: 4, O: 12 } },
    exchanges: [{ from: 'T', to: 'O', label: '1 ten = 10 ones' }],
  },
});

function drawOn(slideNumber, draws) {
  chart.clearPairDrawnSmaller();
  setHairUnderSlide(slideNumber);
  try {
    draws.forEach(([w, h]) => chart.describeLayout(tuesday(), slide(w, h)));
    return chart.pairDrawnSmallerFindings();
  } finally {
    setHairUnderSlide(null);
    chart.clearPairDrawnSmaller();
  }
}

test('a pair drawn without its cue box leaves a note naming the room it needed', () => {
  const found = drawOn(4, [[6, 2.8]]);
  assert.equal(found.length, 1);
  assert.equal(found[0].signal, 'PLACE_VALUE_PAIR_DRAWN_SMALLER');
  assert.equal(found[0].slide, 4);
  assert.match(found[0].message, /drawn without its exchange cue box/);
  assert.match(found[0].message, /6\.00in x 2\.80in space/);
  assert.match(found[0].message, /Drawn whole it needs /);
  assert.match(found[0].message, /a note and not a refusal/);
});

test('the room the note names holds the whole pair, cue box and all', () => {
  const [note] = drawOn(4, [[6, 2.8]]);
  const taller = /(\d+\.\d\d)in tall at the 6\.00in width/.exec(note.message);
  assert.ok(taller, note.message);
  const L = chart.describeLayout(tuesday(), slide(6, Number(taller[1])));
  assert.ok(hasCue(L), 'drawn at the named height, the cue box is back');
  // and a step shorter it is not: the note names the least room, not any room
  let under = null;
  try {
    under = chart.describeLayout(tuesday(), slide(6, Number(taller[1]) - 0.06));
  } catch (error) {
    assert.match(error.message, /^PLACE_VALUE_/);
  }
  assert.ok(!under || !hasCue(under));
});

test('a pair drawn whole leaves no note, and a later whole draw takes an earlier note back', () => {
  assert.deepEqual(drawOn(2, [[9.5, 4.8]]), []);
  assert.deepEqual(drawOn(2, [[6, 2.8], [9.5, 4.8]]), []);
  assert.equal(drawOn(2, [[9.5, 4.8], [6, 2.8]]).length, 1);
});

test('outside a slide build nothing is kept', () => {
  chart.clearPairDrawnSmaller();
  chart.describeLayout(tuesday(), slide(6, 2.8));
  assert.deepEqual(chart.pairDrawnSmallerFindings(), []);
});

test('the measure tool prints the note under its slide, and the slide still fits', () => {
  const lesson = {
    lessonName: 'Column subtraction', subject: 'Maths', yearGroup: 'Year 4', lo: 'Column subtraction with one exchange',
    slides: [{
      template: 'split-h-50-50', primarySide: 'left', title: 'My Turn',
      // the pair stacked above the sum it explains, half the slide wide
      primary: { type: 'stack', items: [
        { type: 'place-value-chart', weight: 1, ...tuesday() },
        { type: 'place-value-chart', weight: 1, columns: ['T', 'O'], calculation: { operator: '-', numbers: ['52', '17'] } },
      ] },
      secondary: { type: 'text', value: 'Take 1 ten and make it 10 ones.' },
    }],
  };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pair-drawn-smaller-test-'));
  try {
    const file = path.join(dir, 'part.json');
    fs.writeFileSync(file, JSON.stringify(lesson));
    const done = spawnSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'measure-slides.js'), file], { encoding: 'utf8' });
    const out = `${done.stdout || ''}\n${done.stderr || ''}`;
    assert.equal(done.status, 0, out);
    assert.doesNotMatch(out, /DOES NOT FIT/, out);
    assert.match(out, /NOTE \(not a refusal\): PLACE_VALUE_PAIR_DRAWN_SMALLER: the before-and-after pair of counters was drawn without its exchange cue box/, out);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
