'use strict';

// Pointing at part of the cycle (figure-highlight.js).
//
// A teacher points at one stage of a life cycle, or at the arrow that names what happens ("evaporation"), so each is named by its own words or its place.
// These pin the shared treatment: the named part draws at full strength with
// the house ring, everything else steps back, a name the drawing does not have
// is refused with the parts it does have, and a cycle with no highlight draws
// exactly as it always did.

const test = require('node:test');
const assert = require('node:assert/strict');
const { profileFor } = require('../visuals/surface-profiles');
const { RING, RING_INK, DIMMED } = require('../visuals/figure-highlight');
const fig = require('../visuals/cycle-svg');

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

const SPEC = { boxes: ['egg', 'caterpillar', 'chrysalis', 'butterfly'], arrows: ['hatches', 'grows', 'emerges', 'lays eggs'], title: 'Life cycle' };
const BOARD = () => profileFor('slides', { widthPt: 12 * 72, heightPt: 5 * 72 });
const PACK = () => profileFor('stickin', { widthMm: 180 });

test('a named part draws at full strength with the house ring, and the rest steps back', () => {
  const { svg } = fig.tightSvg({ ...SPEC, highlight: 'chrysalis' }, BOARD());
  assert.equal(fadedOf(svg, "chrysalis"), false);
  assert.equal(fadedOf(svg, "egg"), true, "egg steps back");
  assert.equal(fadedOf(svg, "caterpillar"), true, "caterpillar steps back");
  assert.equal(fadedOf(svg, "butterfly"), true, "butterfly steps back");
  assert.equal(fadedOf(svg, "grows"), true, "grows steps back");
  assert.equal(fadedOf(svg, "emerges"), true, "emerges steps back");
  assert.equal(ringCount(svg, RING), 1);
  assert.ok(svg.includes(`opacity="${DIMMED}"`));
});

test('the photocopied stick-in pack rings in dark ink', () => {
  const { svg } = fig.tightSvg({ ...SPEC, highlight: 'chrysalis' }, PACK());
  assert.equal(ringCount(svg, RING_INK), 1);
  assert.equal(ringCount(svg, RING), 0);
});

test('a name the cycle does not have is refused, listing the parts it does have', () => {
  assert.throws(() => fig.tightSvg({ ...SPEC, highlight: 'nothing like this' }, BOARD()), (err) => {
    assert.match(err.message, /FIGURE_HIGHLIGHT_UNKNOWN/);
    assert.match(err.message, /Its parts are: .*chrysalis/);
    return true;
  });
  assert.throws(() => fig.cacheKey({ ...SPEC, highlight: 'nothing like this' }, BOARD()), /FIGURE_HIGHLIGHT_UNKNOWN/);
});

test('with no highlight the cycle draws exactly as before, and the cache tells the two apart', () => {
  const plain = fig.tightSvg(SPEC, BOARD());
  assert.ok(!/ opacity="/.test(plain.svg), 'nothing fades');
  assert.equal(ringCount(plain.svg, RING) + ringCount(plain.svg, RING_INK), 0, 'nothing is ringed');
  const empty = fig.tightSvg({ ...SPEC, highlight: [] }, BOARD());
  assert.deepEqual([empty.svg, empty.w, empty.h], [plain.svg, plain.w, plain.h]);
  assert.equal(fig.cacheKey({ ...SPEC, highlight: [] }, BOARD()), fig.cacheKey(SPEC, BOARD()));
  assert.notEqual(fig.cacheKey({ ...SPEC, highlight: 'chrysalis' }, BOARD()), fig.cacheKey(SPEC, BOARD()));
});

test('an arrow is a part too, named by its words or its place, and the title never fades', () => {
  const { svg } = fig.tightSvg({ ...SPEC, highlight: 'grows' }, BOARD());
  assert.equal(fadedOf(svg, 'grows'), false);
  assert.equal(fadedOf(svg, 'caterpillar'), true);
  assert.equal(fadedOf(svg, 'Life'), false, 'the title is not a part');
  assert.equal(fig.tightSvg({ ...SPEC, highlight: 'arrow 2' }, BOARD()).svg, svg);
  const both = fig.tightSvg({ ...SPEC, highlight: ['caterpillar', 'chrysalis'] }, BOARD()).svg;
  assert.equal(fadedOf(both, 'grows'), false, 'the arrow between two highlighted stages stays');
  assert.equal(fadedOf(both, 'hatches'), true);
});

test('a loop through a shared stage counts its stages by their place in boxes', () => {
  const spec = { boxes: ['heart', 'lungs', 'heart', 'body'] };
  const parts = fig.highlightParts(spec).stages;
  const heart = parts.find((p) => p.key === 'heart');
  assert.ok(heart.aliases.includes('1') && heart.aliases.includes('3'), 'the shared stage is both its places');
  assert.ok(parts.find((p) => p.key === 'body').aliases.includes('4'));
  assert.ok(parts.find((p) => p.key === 'lungs').aliases.includes('2'));
});
