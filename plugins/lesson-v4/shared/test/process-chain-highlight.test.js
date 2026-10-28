'use strict';

// Pointing at part of the process chain (figure-highlight.js).
//
// A teacher points at one stage of a food chain ("the rabbit"), so a stage is named by its own words, or by its place for a box the child fills.
// These pin the shared treatment: the named part draws at full strength with
// the house ring, everything else steps back, a name the drawing does not have
// is refused with the parts it does have, and a process chain with no highlight draws
// exactly as it always did.

const test = require('node:test');
const assert = require('node:assert/strict');
const { profileFor } = require('../visuals/surface-profiles');
const { RING, RING_INK, DIMMED } = require('../visuals/figure-highlight');
const fig = require('../visuals/process-chain-svg');

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

const SPEC = { boxes: ['grass', 'rabbit', 'fox', 'eagle'] };
const BOARD = () => profileFor('slides', { widthPt: 12 * 72, heightPt: 2 * 72 });
const PACK = () => profileFor('stickin', { widthMm: 180 });

test('a named part draws at full strength with the house ring, and the rest steps back', () => {
  const { svg } = fig.tightSvg({ ...SPEC, highlight: 'rabbit' }, BOARD());
  assert.equal(fadedOf(svg, "rabbit"), false);
  assert.equal(fadedOf(svg, "grass"), true, "grass steps back");
  assert.equal(fadedOf(svg, "fox"), true, "fox steps back");
  assert.equal(fadedOf(svg, "eagle"), true, "eagle steps back");
  assert.equal(ringCount(svg, RING), 1);
  assert.ok(svg.includes(`opacity="${DIMMED}"`));
});

test('the photocopied stick-in pack rings in dark ink', () => {
  const { svg } = fig.tightSvg({ ...SPEC, highlight: 'rabbit' }, PACK());
  assert.equal(ringCount(svg, RING_INK), 1);
  assert.equal(ringCount(svg, RING), 0);
});

test('a name the process chain does not have is refused, listing the parts it does have', () => {
  assert.throws(() => fig.tightSvg({ ...SPEC, highlight: 'nothing like this' }, BOARD()), (err) => {
    assert.match(err.message, /FIGURE_HIGHLIGHT_UNKNOWN/);
    assert.match(err.message, /Its parts are: .*rabbit/);
    return true;
  });
  assert.throws(() => fig.cacheKey({ ...SPEC, highlight: 'nothing like this' }, BOARD()), /FIGURE_HIGHLIGHT_UNKNOWN/);
});

test('with no highlight the process chain draws exactly as before, and the cache tells the two apart', () => {
  const plain = fig.tightSvg(SPEC, BOARD());
  assert.ok(!/ opacity="/.test(plain.svg), 'nothing fades');
  assert.equal(ringCount(plain.svg, RING) + ringCount(plain.svg, RING_INK), 0, 'nothing is ringed');
  const empty = fig.tightSvg({ ...SPEC, highlight: [] }, BOARD());
  assert.deepEqual([empty.svg, empty.w, empty.h], [plain.svg, plain.w, plain.h]);
  assert.equal(fig.cacheKey({ ...SPEC, highlight: [] }, BOARD()), fig.cacheKey(SPEC, BOARD()));
  assert.notEqual(fig.cacheKey({ ...SPEC, highlight: 'rabbit' }, BOARD()), fig.cacheKey(SPEC, BOARD()));
});

test('a stage answers to its place, an empty box can be pointed at, and an arrow is full only between two highlighted stages', () => {
  const byName = fig.tightSvg({ ...SPEC, highlight: 'rabbit' }, BOARD()).svg;
  assert.equal(fig.tightSvg({ ...SPEC, highlight: 'stage 2' }, BOARD()).svg, byName);
  assert.equal((byName.match(/<g opacity="[0-9.]+"><g class="chain-arrow"/g) || []).length, 3, 'every arrow touches a faded stage');
  const pair = fig.tightSvg({ ...SPEC, highlight: ['grass', 'rabbit'] }, BOARD()).svg;
  assert.equal((pair.match(/<g opacity="[0-9.]+"><g class="chain-arrow"/g) || []).length, 2, 'grass to rabbit stays full strength');
  const empty = fig.tightSvg({ boxes: ['grass', null, 'fox'], highlight: '2' }, BOARD()).svg;
  assert.equal(ringCount(empty, RING), 1);
});

test('an answer stage is found by its words on a pupil sheet that does not print them', () => {
  const spec = { boxes: ['bell', { text: 'eardrum', answer: true }, 'brain'], highlight: 'eardrum' };
  const sheet = fig.tightSvg(spec, profileFor('worksheets', { widthMm: 170 })).svg;
  assert.ok(!sheet.includes('eardrum'), 'the answer is not printed on the pupil sheet');
  assert.equal(ringCount(sheet, RING_INK) + ringCount(sheet, RING), 1);
});
