'use strict';

// Pointing at part of the timeline (figure-highlight.js).
//
// A teacher at the board says "this era" or "this date" while the class looks at the whole line, so the era or date is named, never placed.
// These pin the shared treatment: the named part draws at full strength with
// the house ring, everything else steps back, a name the drawing does not have
// is refused with the parts it does have, and a timeline with no highlight draws
// exactly as it always did.

const test = require('node:test');
const assert = require('node:assert/strict');
const { profileFor } = require('../visuals/surface-profiles');
const { RING, RING_INK, DIMMED } = require('../visuals/figure-highlight');
const fig = require('../visuals/timeline-svg');

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

const SPEC = {
  eras: [{ label: 'Anglo-Saxons', from: 0, to: 0.45 }, { label: 'Vikings', from: 0.45, to: 0.75 }, { label: 'Normans', from: 0.75, to: 1 }],
  marks: [{ label: '410', at: 0.02 }, { label: '793', at: 0.4 }, { label: '1066', at: 0.78 }, { label: '1100', at: 0.98 }],
};
const BOARD = () => profileFor('slides', { widthPt: 12 * 72, heightPt: 4 * 72 });
const PACK = () => profileFor('stickin', { widthMm: 180 });

test('a named part draws at full strength with the house ring, and the rest steps back', () => {
  const { svg } = fig.tightSvg({ ...SPEC, highlight: '1066' }, BOARD());
  assert.equal(fadedOf(svg, "1066"), false);
  assert.equal(fadedOf(svg, "410"), true, "410 steps back");
  assert.equal(fadedOf(svg, "Vikings"), true, "Vikings steps back");
  assert.equal(fadedOf(svg, "Normans"), true, "Normans steps back");
  assert.equal(ringCount(svg, RING), 1);
  assert.ok(svg.includes(`opacity="${DIMMED}"`));
});

test('the photocopied stick-in pack rings in dark ink', () => {
  const { svg } = fig.tightSvg({ ...SPEC, highlight: '1066' }, PACK());
  assert.equal(ringCount(svg, RING_INK), 1);
  assert.equal(ringCount(svg, RING), 0);
});

test('a name the timeline does not have is refused, listing the parts it does have', () => {
  assert.throws(() => fig.tightSvg({ ...SPEC, highlight: 'nothing like this' }, BOARD()), (err) => {
    assert.match(err.message, /FIGURE_HIGHLIGHT_UNKNOWN/);
    assert.match(err.message, /Its parts are: .*1066/);
    return true;
  });
  assert.throws(() => fig.cacheKey({ ...SPEC, highlight: 'nothing like this' }, BOARD()), /FIGURE_HIGHLIGHT_UNKNOWN/);
});

test('with no highlight the timeline draws exactly as before, and the cache tells the two apart', () => {
  const plain = fig.tightSvg(SPEC, BOARD());
  assert.ok(!/ opacity="/.test(plain.svg), 'nothing fades');
  assert.equal(ringCount(plain.svg, RING) + ringCount(plain.svg, RING_INK), 0, 'nothing is ringed');
  const empty = fig.tightSvg({ ...SPEC, highlight: [] }, BOARD());
  assert.deepEqual([empty.svg, empty.w, empty.h], [plain.svg, plain.w, plain.h]);
  assert.equal(fig.cacheKey({ ...SPEC, highlight: [] }, BOARD()), fig.cacheKey(SPEC, BOARD()));
  assert.notEqual(fig.cacheKey({ ...SPEC, highlight: '1066' }, BOARD()), fig.cacheKey(SPEC, BOARD()));
});

test('an era is pointed at by its own name, whatever the spelling', () => {
  const { svg } = fig.tightSvg({ ...SPEC, highlight: 'vikings' }, BOARD());
  assert.equal(fadedOf(svg, 'Vikings'), false);
  assert.equal(fadedOf(svg, 'Anglo-Saxons'), true);
  assert.equal(fadedOf(svg, '1066'), true);
  assert.equal(ringCount(svg, RING), 1);
});
