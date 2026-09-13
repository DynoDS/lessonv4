'use strict';

// The numbers a child reads off a number line on the board.
//
// A Year 4 deck on estimating to 10,000 once shipped "0" at full size at one end
// of an axis and "10,000" at well under half at the other, and a stack of three
// arrowed lines shipped its arrows at half length. Both were repaired in the
// board's own drawing (4.2.113). Since 13 September 2026 the board places the
// one shared number line (shared/visuals/number-line-svg.js), so the same
// properties are held here against that drawing, laid out in a slide zone with
// the board's profile: numerals are a real size in points, one size per axis,
// never under the 18pt floor, and a zone too shallow to honour that is refused
// by name.

const assert = require('node:assert/strict');
const test = require('node:test');

const numberLine = require('../../shared/visuals/number-line-svg');
const { profileFor } = require('../../shared/visuals/surface-profiles');
const { textWidthEm } = require('../../shared/text/comic-glyph-width');

// Slide zones in inches, as the board hands them over (less its 0.1in pad).
const ZONE = { w: 7.98, h: 3.55 };
const ARROW_ZONE = { w: 7.98, h: 4.2 };

function lay(zone, data) {
  const profile = profileFor('slides', { widthPt: (zone.w - 0.2) * 72, heightPt: (zone.h - 0.2) * 72 });
  const built = numberLine.tightSvg(data, profile);
  const texts = [...built.svg.matchAll(/<text x="([-\d.]+)" y="([-\d.]+)" text-anchor="(\w+)"[^>]*font-size="([\d.]+)"[^>]*>([^<]*)<\/text>/g)].map(
    (m) => ({ x: Number(m[1]), y: Number(m[2]), anchor: m[3], pt: Number(m[4]), text: m[5] })
  );
  return { built, texts, layout: built.layout };
}

function labelled(texts, text) {
  const found = texts.find((t) => t.text === text);
  assert.ok(found, `expected "${text}" to be drawn; got ${texts.map((t) => t.text).join(' ')}`);
  return found;
}

test('both ends of one axis print at the same size, however many digits they have', () => {
  const { texts } = lay(ZONE, { start: 0, end: 10000, interval: 10000, labels: 'ends' });
  assert.equal(labelled(texts, '0').pt, labelled(texts, '10,000').pt);
});

test('an axis label never runs off the drawing', () => {
  for (const data of [
    { start: 0, end: 10000, interval: 10000, labels: 'ends' },
    { start: 2000, end: 4000, interval: 500, labels: 'ends', arrow: { at: 3500, label: 'A' } },
    { start: 0, end: 10000, interval: 2500, labels: 'all', answer: { at: 6800, text: '6,800' } },
  ]) {
    const { texts, built } = lay(ZONE, data);
    for (const t of texts.filter((t) => t.anchor === 'middle')) {
      const half = (textWidthEm(t.text, true) * t.pt) / 2;
      assert.ok(t.x - half >= -0.01 && t.x + half <= built.w + 0.01, `"${t.text}" runs outside the drawing`);
    }
  }
});

test('a pair of bare endpoint lines is not charged for arrows it does not have', () => {
  const alone = lay(ZONE, { start: 0, end: 10000, interval: 10000, labels: 'ends' });
  const pair = lay(ZONE, {
    lines: [
      { start: 0, end: 10000, interval: 10000, labels: 'ends' },
      { start: 4000, end: 8000, interval: 4000, labels: 'ends' },
    ],
  });
  assert.ok(labelled(pair.texts, '10,000').pt >= 18, 'two bare lines keep readable numerals');
  assert.ok(labelled(alone.texts, '10,000').pt >= labelled(pair.texts, '10,000').pt);
});

test('stacking three arrowed lines keeps an arrow that points', () => {
  const { built } = lay(ARROW_ZONE, {
    lines: [
      { start: 1000, end: 3500, interval: 500, labels: 'ends', arrow: { at: 2500, label: 'P' } },
      { start: 7000, end: 8000, interval: 200, labels: 'ends', arrow: { at: 7400, label: 'Q' } },
      { start: 0, end: 10000, interval: 2000, labels: 'ends', arrow: { at: 8000, label: 'R' } },
    ],
  });
  const stems = [...built.svg.matchAll(/<rect x="[\d.]+" y="[\d.]+" width="[\d.]+" height="([\d.]+)" fill="#CC0000"\/>/g)].map((m) => Number(m[1]));
  assert.equal(stems.length, 3);
  stems.forEach((h) => assert.ok(h / 72 > 0.165, `a stacked arrow stem came out at ${(h / 72).toFixed(3)}in`));
});

test('a lone line grows into a card with room to spare', () => {
  const roomy = lay({ w: 7.98, h: 3.7 }, { start: 0, end: 10000, interval: 2500, labels: 'ends' });
  const tight = lay({ w: 7.98, h: 1.2 }, { start: 0, end: 10000, interval: 2500, labels: 'ends' });
  assert.ok(labelled(roomy.texts, '10,000').pt > labelled(tight.texts, '10,000').pt);
});

test('stacked lines are named down their left edge without being asked', () => {
  const { texts } = lay(ZONE, {
    lines: [
      { start: 1000, end: 3500, interval: 500, labels: 'ends' },
      { start: 7000, end: 8000, interval: 200, labels: 'ends' },
      { start: 0, end: 10000, interval: 2000, labels: 'ends' },
    ],
  });
  for (const name of ['A', 'B', 'C']) assert.ok(texts.some((t) => t.text === name), `expected line ${name} to be named`);
});

test('a single line is not named, and naming can be turned off', () => {
  const one = lay(ZONE, { start: 0, end: 10000, interval: 2500, labels: 'ends' });
  assert.ok(!one.texts.some((t) => t.text === 'A'));
  const off = lay(ZONE, {
    lineLabels: false,
    lines: [
      { start: 0, end: 10000, interval: 2500, labels: 'ends' },
      { start: 4000, end: 8000, interval: 1000, labels: 'ends' },
    ],
  });
  assert.ok(!off.texts.some((t) => t.text === 'A'));
});

test('a stack in a shallow zone is refused rather than drawn with numerals nobody can read', () => {
  assert.throws(
    () => lay({ w: 7.98, h: 2.2 }, {
      lines: [1, 2, 3].map(() => ({ start: 0, end: 10000, interval: 2000, labels: 'ends', arrow: { at: 4000, label: 'A' } })),
    }),
    /NUMBERLINE_ZONE_TOO_SHALLOW/
  );
});

test('the same stack keeps its numerals at the floor once it has the room it asked for', () => {
  const { texts } = lay(ARROW_ZONE, {
    lines: [1, 2, 3].map(() => ({ start: 0, end: 10000, interval: 2000, labels: 'ends', arrow: { at: 4000, label: 'A' } })),
  });
  texts.forEach((t) => assert.ok(t.pt >= 18, `"${t.text}" was drawn at ${t.pt}pt`));
});

test('a fourth stacked line is refused, not quietly shrunk', () => {
  assert.throws(
    () => lay(ZONE, { lines: [1, 2, 3, 4].map(() => ({ start: 0, end: 10000, interval: 2000, labels: 'ends' })) }),
    /NUMBERLINE_TOO_MANY_LINES: 4 stacked lines were asked for and 3 is the most/
  );
});

test('the axis writes its numbers the way the question beside it does', () => {
  const { texts } = lay(ZONE, { start: 0, end: 10000, interval: 2500, labels: 'all' });
  const words = texts.map((t) => t.text);
  assert.ok(words.includes('2,500') && words.includes('10,000') && words.includes('0'));
  const small = lay(ZONE, { start: 0, end: 1, interval: 0.25, labels: 'all' });
  small.texts.forEach((t) => assert.ok(!t.text.includes(','), `"${t.text}" gained a separator`));
});

test('a genuinely crowded axis shrinks its numerals whole, and they never overlap', () => {
  const { texts } = lay(ZONE, { start: 0, end: 10000, interval: 500, labels: 'all' });
  const axis = texts.filter((t) => /\d/.test(t.text)).sort((a, b) => a.x - b.x);
  assert.equal(new Set(axis.map((t) => t.pt)).size, 1, 'one size for every numeral on the axis');
  for (let i = 1; i < axis.length; i++) {
    const prevRight = axis[i - 1].x + (textWidthEm(axis[i - 1].text, true) * axis[i - 1].pt) / 2;
    const left = axis[i].x - (textWidthEm(axis[i].text, true) * axis[i].pt) / 2;
    assert.ok(left >= prevRight - 0.01, `"${axis[i - 1].text}" and "${axis[i].text}" overlap`);
  }
});
