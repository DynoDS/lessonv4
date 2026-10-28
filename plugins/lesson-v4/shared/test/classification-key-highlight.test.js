'use strict';

// Pointing at part of the classification key (figure-highlight.js).
//
// A teacher walks the class down a key one question at a time ("this question"), so a question or a named answer is named by its own words or its place.
// These pin the shared treatment: the named part draws at full strength with
// the house ring, everything else steps back, a name the drawing does not have
// is refused with the parts it does have, and a classification key with no highlight draws
// exactly as it always did.

const test = require('node:test');
const assert = require('node:assert/strict');
const { profileFor } = require('../visuals/surface-profiles');
const { RING, RING_INK, DIMMED } = require('../visuals/figure-highlight');
const fig = require('../visuals/classification-key-svg');

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

const SPEC = { tree: { q: 'Does it have legs?', no: { q: 'Does it have a shell?', no: { leaf: 'worm' }, yes: { leaf: 'snail' } }, yes: { q: 'Does it have 6 legs?', no: { leaf: 'spider' }, yes: { leaf: 'ant' } } } };
const BOARD = () => profileFor('slides', { widthPt: 12 * 72, heightPt: 5 * 72 });
const PACK = () => profileFor('stickin', { widthMm: 180 });

test('a named part draws at full strength with the house ring, and the rest steps back', () => {
  const { svg } = fig.tightSvg({ ...SPEC, highlight: 'Does it have a shell?' }, BOARD());
  assert.equal(fadedOf(svg, "shell?"), false);
  assert.equal(fadedOf(svg, "worm"), true, "worm steps back");
  assert.equal(fadedOf(svg, "snail"), true, "snail steps back");
  assert.equal(fadedOf(svg, "spider"), true, "spider steps back");
  assert.equal(ringCount(svg, RING), 1);
  assert.ok(svg.includes(`opacity="${DIMMED}"`));
});

test('the photocopied stick-in pack rings in dark ink', () => {
  const { svg } = fig.tightSvg({ ...SPEC, highlight: 'Does it have a shell?' }, PACK());
  assert.equal(ringCount(svg, RING_INK), 1);
  assert.equal(ringCount(svg, RING), 0);
});

test('a name the classification key does not have is refused, listing the parts it does have', () => {
  assert.throws(() => fig.tightSvg({ ...SPEC, highlight: 'nothing like this' }, BOARD()), (err) => {
    assert.match(err.message, /FIGURE_HIGHLIGHT_UNKNOWN/);
    assert.match(err.message, /Its parts are: .*shell\\?/);
    return true;
  });
  assert.throws(() => fig.cacheKey({ ...SPEC, highlight: 'nothing like this' }, BOARD()), /FIGURE_HIGHLIGHT_UNKNOWN/);
});

test('with no highlight the classification key draws exactly as before, and the cache tells the two apart', () => {
  const plain = fig.tightSvg(SPEC, BOARD());
  assert.ok(!/ opacity="/.test(plain.svg), 'nothing fades');
  assert.equal(ringCount(plain.svg, RING) + ringCount(plain.svg, RING_INK), 0, 'nothing is ringed');
  const empty = fig.tightSvg({ ...SPEC, highlight: [] }, BOARD());
  assert.deepEqual([empty.svg, empty.w, empty.h], [plain.svg, plain.w, plain.h]);
  assert.equal(fig.cacheKey({ ...SPEC, highlight: [] }, BOARD()), fig.cacheKey(SPEC, BOARD()));
  assert.notEqual(fig.cacheKey({ ...SPEC, highlight: 'Does it have a shell?' }, BOARD()), fig.cacheKey(SPEC, BOARD()));
});

test("a question keeps its own Yes and No, and answers to its place", () => {
  const { svg } = fig.tightSvg({ ...SPEC, highlight: 'question 2' }, BOARD());
  const words = writing(svg).filter((w) => w.text === 'No' || w.text === 'Yes');
  assert.equal(words.filter((w) => !w.faded).length, 2, "only the highlighted question's Yes and No stay");
  assert.equal(fig.tightSvg({ ...SPEC, highlight: 'Does it have a shell?' }, BOARD()).svg, svg);
  assert.equal(fadedOf(fig.tightSvg({ ...SPEC, highlight: 'answer 2' }, BOARD()).svg, 'snail'), false);
});
