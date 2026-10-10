'use strict';

// A fraction in a drawing's label is written top and bottom (the teacher, 10
// October 2026: a fraction "should not be a slash ... in a label inside
// drawings"). The "1/5" under a shaded bar and the "(1) 1/2 = ?/10" caption on
// a printed activity kept their slashes after sentences had lost theirs.

const test = require('node:test');
const assert = require('node:assert/strict');
const { stackFractionsInSvg, installOnSharedDrawings, FRACTION_SIZE } = require('../visuals/stacked-fraction-labels');

const label = (attrs, words) => `<svg xmlns="http://www.w3.org/2000/svg"><text ${attrs}>${words}</text></svg>`;
const texts = (svg) => [...svg.matchAll(/<text\b([^>]*)>([^<]*)<\/text>/g)].map((m) => ({ attrs: m[1], words: m[2] }));
const num = (attrs, name) => Number(new RegExp(`${name}="([-\\d.]+)"`).exec(attrs)[1]);

test('a label that is a fraction becomes a numerator, a bar and a denominator about its own middle', () => {
  const out = stackFractionsInSvg(label('x="100" y="50" font-size="20" text-anchor="middle" dy="0.36em" fill="#1F4E79"', '3/15'));
  const [top, bottom] = texts(out);
  assert.equal(top.words, '3');
  assert.equal(bottom.words, '15');
  assert.equal(num(top.attrs, 'x'), 100, 'centred where the label was centred');
  assert.equal(num(top.attrs, 'font-size'), 20 * FRACTION_SIZE);
  assert.ok(num(top.attrs, 'y') < 50 && num(bottom.attrs, 'y') > 50, 'one above the middle of the line, one below');
  assert.match(out, /<line [^>]*stroke="#1F4E79"/, 'the bar takes the label colour');
  assert.ok(!out.includes('3/15'));
});

test('the words round a fraction keep their size and sit where the label put them', () => {
  const out = stackFractionsInSvg(label('x="10" y="50" font-size="20" font-weight="bold"', '(1) 1/2 = ?/10'));
  const drawn = texts(out);
  assert.deepEqual(drawn.map((t) => t.words), ['(1)', '1', '2', '=', '?', '10']);
  assert.equal(num(drawn[0].attrs, 'x'), 10, 'a label anchored at its start still starts there');
  assert.equal(num(drawn[0].attrs, 'font-size'), 20);
  const xs = [drawn[0], drawn[1], drawn[3], drawn[4]].map((t) => num(t.attrs, 'x'));
  assert.deepEqual([...xs].sort((a, b) => a - b), xs, 'left to right in the order written');
});

test('a turned label stays turned, and a date, a long number and a marked-up label are left alone', () => {
  const turned = stackFractionsInSvg(label('x="10" y="50" font-size="20" transform="rotate(-90, 10, 50)"', '1/2 full'));
  assert.match(turned, /<g class="stacked-fraction-label" transform="rotate\(-90, 10, 50\)">/);
  for (const plain of ['9/10/2026', '1,250/3,000', 'A/B']) {
    const svg = label('x="10" y="50" font-size="20"', plain);
    assert.equal(stackFractionsInSvg(svg), svg, plain);
  }
  const marked = '<svg><text x="1" y="2" font-size="10"><tspan>1/2</tspan></text></svg>';
  assert.equal(stackFractionsInSvg(marked), marked);
  const unplaced = '<svg><text font-size="10">1/2</text></svg>';
  assert.equal(stackFractionsInSvg(unplaced), unplaced, 'a label with no place of its own is not guessed at');
});

test('once installed, every shared drawing hands back its fraction labels stacked', () => {
  installOnSharedDrawings();
  installOnSharedDrawings(); // twice is once
  const shaded = require('../visuals/shaded-fraction-svg');
  const { profileFor } = require('../visuals/surface-profiles');
  const out = shaded.tightSvg({ bars: [{ parts: 5, shaded: 1, label: '1/5' }, { parts: 10, shaded: 2, label: '2/10' }] }, profileFor('worksheets', { widthMm: 120 }));
  assert.ok(!/>\s*1\/5\s*</.test(out.svg) && !/>\s*2\/10\s*</.test(out.svg), 'no label is left with a slash');
  assert.equal((out.svg.match(/class="stacked-fraction-label"/g) || []).length, 2);
});
