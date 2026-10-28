'use strict';

// Pointing at part of the fishbone (figure-highlight.js).
//
// A teacher points at one cause ("strong wind") or at the effect, so each is named by its own words.
// These pin the shared treatment: the named part draws at full strength with
// the house ring, everything else steps back, a name the drawing does not have
// is refused with the parts it does have, and a fishbone with no highlight draws
// exactly as it always did.

const test = require('node:test');
const assert = require('node:assert/strict');
const { profileFor } = require('../visuals/surface-profiles');
const { RING, RING_INK, DIMMED } = require('../visuals/figure-highlight');
const fig = require('../visuals/fishbone-svg');

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

const SPEC = { effect: 'The Great Fire spread', causes: ['Wooden houses', 'Strong wind', 'Narrow streets', 'Dry summer'] };
const BOARD = () => profileFor('slides', { widthPt: 12 * 72, heightPt: 4.5 * 72 });
const PACK = () => profileFor('stickin', { widthMm: 180 });

test('a named part draws at full strength with the house ring, and the rest steps back', () => {
  const { svg } = fig.tightSvg({ ...SPEC, highlight: 'Strong wind' }, BOARD());
  assert.equal(fadedOf(svg, "Strong wind"), false);
  assert.equal(fadedOf(svg, "Dry summer"), true, "Dry summer steps back");
  assert.equal(fadedOf(svg, "spread"), true, "spread steps back");
  assert.equal(ringCount(svg, RING), 1);
  assert.ok(svg.includes(`opacity="${DIMMED}"`));
});

test('the photocopied stick-in pack rings in dark ink', () => {
  const { svg } = fig.tightSvg({ ...SPEC, highlight: 'Strong wind' }, PACK());
  assert.equal(ringCount(svg, RING_INK), 1);
  assert.equal(ringCount(svg, RING), 0);
});

test('a name the fishbone does not have is refused, listing the parts it does have', () => {
  assert.throws(() => fig.tightSvg({ ...SPEC, highlight: 'nothing like this' }, BOARD()), (err) => {
    assert.match(err.message, /FIGURE_HIGHLIGHT_UNKNOWN/);
    assert.match(err.message, /Its parts are: .*Strong wind/);
    return true;
  });
  assert.throws(() => fig.cacheKey({ ...SPEC, highlight: 'nothing like this' }, BOARD()), /FIGURE_HIGHLIGHT_UNKNOWN/);
});

test('with no highlight the fishbone draws exactly as before, and the cache tells the two apart', () => {
  const plain = fig.tightSvg(SPEC, BOARD());
  assert.ok(!/ opacity="/.test(plain.svg), 'nothing fades');
  assert.equal(ringCount(plain.svg, RING) + ringCount(plain.svg, RING_INK), 0, 'nothing is ringed');
  const empty = fig.tightSvg({ ...SPEC, highlight: [] }, BOARD());
  assert.deepEqual([empty.svg, empty.w, empty.h], [plain.svg, plain.w, plain.h]);
  assert.equal(fig.cacheKey({ ...SPEC, highlight: [] }, BOARD()), fig.cacheKey(SPEC, BOARD()));
  assert.notEqual(fig.cacheKey({ ...SPEC, highlight: 'Strong wind' }, BOARD()), fig.cacheKey(SPEC, BOARD()));
});

test("a cause's rib steps back with it, and the effect answers to \"effect\"", () => {
  const { svg } = fig.tightSvg({ ...SPEC, highlight: 'Strong wind' }, BOARD());
  const ribs = svg.match(/<g opacity="[0-9.]+"><line class="fishbone-rib"/g) || [];
  assert.equal(ribs.length, 3, 'the three other ribs fade; the highlighted one does not');
  const effect = fig.tightSvg({ ...SPEC, highlight: 'effect' }, BOARD()).svg;
  assert.equal(fadedOf(effect, 'spread'), false);
  assert.equal(fadedOf(effect, 'Strong wind'), true);
});
