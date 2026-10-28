'use strict';

// Pointing at part of the continuum line (figure-highlight.js).
//
// A teacher points at one end of the line ("strongly agree") while the class decides where they stand, so an end is named by its label or by "left" and "right".
// These pin the shared treatment: the named part draws at full strength with
// the house ring, everything else steps back, a name the drawing does not have
// is refused with the parts it does have, and a continuum line with no highlight draws
// exactly as it always did.

const test = require('node:test');
const assert = require('node:assert/strict');
const { profileFor } = require('../visuals/surface-profiles');
const { RING, RING_INK, DIMMED } = require('../visuals/figure-highlight');
const fig = require('../visuals/continuum-line-svg');

// Each piece of writing in the drawing, and whether a group round it fades it.
function writing(svg) {
  const out = [];
  const stack = [];
  const re = /<(\/?)(g|text)\b([^>]*)>([^<]*)/g;
  let m;
  while ((m = re.exec(svg))) {
    const [, close, tag, attrs, after] = m;
    if (tag === 'g') {
      if (close) stack.pop();
      else if (!attrs.endsWith('/')) stack.push(/opacity="([0-9.]+)"/.test(attrs) && Number(RegExp.$1) < 1);
    } else if (!close) {
      out.push({ text: after.replace(/&amp;/g, '&'), faded: stack.some(Boolean) });
    }
  }
  return out;
}

function fadedOf(svg, words) {
  const hit = writing(svg).filter((w) => w.text === words);
  assert.ok(hit.length, `"${words}" is drawn`);
  return hit.every((w) => w.faded);
}

// The ring is the one outline drawn with nothing inside it.
const ringCount = (svg, colour) => (svg.match(new RegExp(`fill="none" stroke="#${colour}"`, 'g')) || []).length;

const SPEC = { left: 'Strongly disagree', right: 'Strongly agree', middle: 'Not sure', marks: 3, question: 'Zoos are good for animals.' };
const BOARD = () => profileFor('slides', { widthPt: 12 * 72, heightPt: 3 * 72 });
const PACK = () => profileFor('stickin', { widthMm: 180 });

test('a named part draws at full strength with the house ring, and the rest steps back', () => {
  const { svg } = fig.tightSvg({ ...SPEC, highlight: 'Strongly agree' }, BOARD());
  assert.equal(fadedOf(svg, "Strongly agree"), false);
  assert.equal(fadedOf(svg, "Strongly disagree"), true, "Strongly disagree steps back");
  assert.equal(fadedOf(svg, "Not sure"), true, "Not sure steps back");
  assert.equal(ringCount(svg, RING), 1);
  assert.ok(svg.includes(`opacity="${DIMMED}"`));
});

test('the photocopied stick-in pack rings in dark ink', () => {
  const { svg } = fig.tightSvg({ ...SPEC, highlight: 'Strongly agree' }, PACK());
  assert.equal(ringCount(svg, RING_INK), 1);
  assert.equal(ringCount(svg, RING), 0);
});

test('a name the continuum line does not have is refused, listing the parts it does have', () => {
  assert.throws(() => fig.tightSvg({ ...SPEC, highlight: 'nothing like this' }, BOARD()), (err) => {
    assert.match(err.message, /FIGURE_HIGHLIGHT_UNKNOWN/);
    assert.match(err.message, /Its parts are: .*Strongly agree/);
    return true;
  });
  assert.throws(() => fig.cacheKey({ ...SPEC, highlight: 'nothing like this' }, BOARD()), /FIGURE_HIGHLIGHT_UNKNOWN/);
});

test('with no highlight the continuum line draws exactly as before, and the cache tells the two apart', () => {
  const plain = fig.tightSvg(SPEC, BOARD());
  assert.ok(!/ opacity="/.test(plain.svg), 'nothing fades');
  assert.equal(ringCount(plain.svg, RING) + ringCount(plain.svg, RING_INK), 0, 'nothing is ringed');
  const empty = fig.tightSvg({ ...SPEC, highlight: [] }, BOARD());
  assert.deepEqual([empty.svg, empty.w, empty.h], [plain.svg, plain.w, plain.h]);
  assert.equal(fig.cacheKey({ ...SPEC, highlight: [] }, BOARD()), fig.cacheKey(SPEC, BOARD()));
  assert.notEqual(fig.cacheKey({ ...SPEC, highlight: 'Strongly agree' }, BOARD()), fig.cacheKey(SPEC, BOARD()));
});

test('an end answers to "left" and "right" as well as its label, and the question stays', () => {
  const byName = fig.tightSvg({ ...SPEC, highlight: 'Strongly agree' }, BOARD()).svg;
  assert.equal(fig.tightSvg({ ...SPEC, highlight: 'right' }, BOARD()).svg, byName);
  assert.equal(fadedOf(byName, 'Zoos are good for animals.'), false, 'the question is not a part, so it never fades');
});
