'use strict';

// On a slide a place value chart never prints its digits under 18pt.
//
// The teacher was shown the same written sum at full slide width, getting
// shorter (6 October 2026). He chose the 18pt one as the last that looks right
// ("I'd say E probably"), and of the 14pt sum on Year 4 Maths Lesson 24 slide
// 11, drawn 12.4in wide and 1.8in tall, he said it "looks awful". Number lines,
// fraction walls and tables already held 18pt on a slide; the chart had been
// allowed down to 11.7pt digits and 9pt headings.
//
// What this file pins:
//   - the ordinary chart, the counters chart and the written sum stop at 18pt
//     on a slide, and a zone too short for that is refused with its height;
//   - headings keep their share of the digit (13pt at the smallest size);
//   - the wall, the worksheet and the stick-in pack are drawn as they were;
//   - a chart refused in the share its weight gave it still takes the spare
//     height the words beside it hand back, so a column with room builds.

const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const { describeLayout } = require('../../shared/visuals/place-value-chart-svg');
const { profileFor } = require('../../shared/visuals/surface-profiles');
const { runSlideDesignCheck, parseBuildDiagnostics } = require('../scripts/check-slide-design.js');

const COLUMNS = ['Hundreds', 'Tens', 'Ones'];
const SUM = { columns: COLUMNS, calculation: { operator: '+', numbers: ['264', '172'], answer: '436', carry: { H: '1' } } };
const CHART = { columns: COLUMNS, rows: [{ cells: ['2', '6', '4'] }, { cells: ['1', '7', '2'] }] };
const COUNTERS = { columns: COLUMNS, rows: [{ cells: ['3', '13', '6'], counters: { H: 3, T: 13, O: 6 } }] };

const onSlide = (spec, widthIn, heightIn) =>
  describeLayout(spec, profileFor('slides', { widthPt: widthIn * 72, heightPt: heightIn * 72 }));

test('the sum on Lesson 24 slide 11 is refused, with the height it needs', () => {
  assert.throws(
    () => onSlide(SUM, 12.4, 1.8),
    /PLACE_VALUE_CHART_DOES_NOT_FIT: this column calculation needs at least 2\.3\din of height at its smallest readable size/
  );
});

test('at its smallest on a slide a sum has 18pt digits and 13pt headings', () => {
  const smallest = onSlide(SUM, 12.4, 2.42);
  assert.ok(smallest.D >= 17.95 && smallest.D < 18.6, `digits are ${smallest.D.toFixed(1)}pt`);
  assert.ok(Math.abs(smallest.headings.font - 0.72 * smallest.D) < 0.01, 'headings keep their share of the digit');
  assert.ok(smallest.headings.font >= 12.9, `headings are ${smallest.headings.font.toFixed(1)}pt`);
});

test('no chart form goes under 18pt on a slide, however short its zone', () => {
  for (const [name, spec] of [['sum', SUM], ['chart', CHART], ['counters', COUNTERS]]) {
    for (let height = 0.6; height <= 5; height += 0.1) {
      let drawn = null;
      try {
        drawn = onSlide(spec, 12.4, height);
      } catch (error) {
        assert.match(error.message, /PLACE_VALUE_CHART_DOES_NOT_FIT/, `${name} at ${height.toFixed(1)}in`);
        continue;
      }
      assert.ok(drawn.D >= 17.95, `${name} in a ${height.toFixed(1)}in zone drew ${drawn.D.toFixed(1)}pt digits`);
    }
  }
});

test('counters at the smallest chart are still well above their own floor', () => {
  let smallest = null;
  for (let height = 1.5; height <= 4 && !smallest; height += 0.02) {
    try {
      smallest = onSlide(COUNTERS, 12.4, height);
    } catch {
      smallest = null;
    }
  }
  const counter = Math.min(...smallest.circles.filter((c) => c.role === 'counter').map((c) => c.r * 2));
  assert.ok(counter / 72 * 25.4 >= 5.5, `counters are ${(counter / 72 * 25.4).toFixed(1)}mm across`);
});

test('the wall, the worksheet and the stick-in pack keep the sizes they had', () => {
  // A height on these surfaces still lets the chart down to 0.65 of its
  // natural digit, as it always did: the slide's floor is the slide's alone.
  for (const [surface, widthMm] of [['wall', 200], ['worksheets', 60], ['stickin', 60]]) {
    const natural = profileFor(surface, { widthMm }).fontPt * 0.75;
    let smallest = Infinity;
    for (let heightMm = 10; heightMm <= 250; heightMm += 2) {
      try {
        smallest = Math.min(smallest, describeLayout(CHART, profileFor(surface, { widthMm, heightMm })).D);
      } catch {
        // too short for this surface: not what is being asked here
      }
    }
    assert.ok(smallest < natural * 0.8, `${surface} no longer draws below its natural digit (${smallest.toFixed(1)}pt against ${natural.toFixed(1)}pt)`);
  }
});

// ─── a column with the room still builds ───────────────────────────

function yourTurn(chartWeight) {
  return {
    lessonName: 'Chart Floor',
    subject: 'Maths',
    lo: 'Check a chart in a column',
    slides: [{
      template: 'body-full',
      title: 'Your Turn',
      body: {
        type: 'stack',
        items: [
          { type: 'text', value: 'Use column addition.' },
          { type: 'text', value: '231 + 426 =' },
          { type: 'place-value-chart', columns: COLUMNS, calculation: { operator: '+', numbers: ['', ''], carry: false }, weight: chartWeight },
        ],
      },
    }],
  };
}

function check(lesson) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'chart-floor-'));
  const file = path.join(dir, 'lesson.json');
  fs.writeFileSync(file, JSON.stringify(lesson));
  try {
    const result = runSlideDesignCheck(file, { helperVerdictPath: false });
    return { result, refusals: parseBuildDiagnostics(result.stdout).filter((item) => item.faultClass !== 'note') };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('a chart refused in its share takes the spare the words beside it hand back', () => {
  // A third of the column is under the 2.3in this sum needs at 18pt. The two
  // lines above it use a fraction of their thirds, and that spare is the room.
  const { result, refusals } = check(yourTurn(1));
  assert.deepEqual(refusals, []);
  assert.equal(result.ok, true, result.stderr);
});

test('a column that is too full is still refused, and told what it needs', () => {
  const lesson = yourTurn(1);
  lesson.slides[0].body.items.splice(2, 0,
    { type: 'place-value-chart', columns: COLUMNS, calculation: { operator: '+', numbers: ['264', '172'], answer: '436', carry: { H: '1' } } },
    { type: 'place-value-chart', columns: COLUMNS, calculation: { operator: '+', numbers: ['372', '154'], answer: '526', carry: { H: '1' } } });
  const { result, refusals } = check(lesson);
  assert.equal(result.ok, false);
  assert.ok(refusals.some((item) => item.signal === 'PLACE_VALUE_CHART_DOES_NOT_FIT'));
  const column = refusals.find((item) => item.signal === 'COLUMN_NEEDS');
  assert.ok(column, 'the column says what it needs');
  assert.match(column.message, /No weights fit this column/);
});

// ─── the before-and-after pair takes the same floor ────────────────
//
// "Yes same 18pt floor" (the teacher, 6 October 2026). A pair used to go down
// to 12.6pt digits on a slide, and to 7.6pt when it carried counters.

const DIGIT_PAIR = { columns: COLUMNS, pair: { from: ['2', '6', '4'], to: ['2', '7', '4'], operation: '10 more' } };
const COUNTER_PAIR = {
  columns: COLUMNS,
  pair: {
    from: ['', '', ''], to: ['', '', ''], title: '', operation: '10 tens = 1 hundred',
    counters: { from: { H: 3, T: 4, O: 6 }, to: { H: 4, T: 3, O: 6 } },
  },
};

test('a pair on a slide never prints digits under 18pt, with counters or without', () => {
  for (const [name, spec] of [['digit pair', DIGIT_PAIR], ['counter pair', COUNTER_PAIR]]) {
    let drew = 0;
    for (let width = 2; width <= 12.4; width += 0.8) {
      for (let height = 0.8; height <= 5; height += 0.3) {
        let drawn = null;
        try {
          drawn = onSlide(spec, width, height);
        } catch (error) {
          assert.match(error.message, /PLACE_VALUE_(CHART_DOES_NOT_FIT|COUNTERS_TOO_SMALL)/, `${name} at ${width.toFixed(1)}in by ${height.toFixed(1)}in`);
          continue;
        }
        drew += 1;
        assert.ok(drawn.D >= 17.95, `${name} at ${width.toFixed(1)}in by ${height.toFixed(1)}in drew ${drawn.D.toFixed(1)}pt digits`);
      }
    }
    assert.ok(drew > 0, `${name} was never drawn, so nothing was checked`);
  }
});

test('a pair in a zone too small for 18pt is refused with the size it needs', () => {
  assert.throws(
    () => onSlide(DIGIT_PAIR, 5, 1.4),
    /PLACE_VALUE_CHART_DOES_NOT_FIT: this before-and-after pair needs at least 3\.9\din x 1\.7\din to print its digits readably/
  );
});

test('a pair on the wall, given a height, still goes below its natural digit', () => {
  const natural = profileFor('wall', { widthMm: 300 }).fontPt * 0.75;
  let smallest = Infinity;
  for (let heightMm = 20; heightMm <= 200; heightMm += 2) {
    try {
      smallest = Math.min(smallest, describeLayout(DIGIT_PAIR, profileFor('wall', { widthMm: 300, heightMm })).D);
    } catch {
      // too short for the wall: not what is being asked here
    }
  }
  assert.ok(smallest < natural * 0.8, `the wall pair stopped at ${smallest.toFixed(1)}pt against ${natural.toFixed(1)}pt`);
});
