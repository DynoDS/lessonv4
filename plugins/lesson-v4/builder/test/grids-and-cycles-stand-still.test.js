'use strict';

// A coordinate grid or a cycle on a question slide and on its answers slide is
// one picture to the class. The answers slide writes coordinates beside the
// points, or fills in the stages and arrow words, and without the room kept
// the grid or the loop drew at a different size from the one the question
// showed (14 October 2026).

const test = require('node:test');
const assert = require('node:assert/strict');
const { keepGridsStill } = require('../src/content/grids-stand-still');
const { keepCyclesStill } = require('../src/content/cycles-stand-still');
const grid = require('../../shared/visuals/coordinate-grid-svg');
const cycle = require('../../shared/visuals/cycle-svg');
const { profileFor } = require('../../shared/visuals/surface-profiles');

const BOARD = profileFor('slides', { widthPt: 432, heightPt: 331 });
const AT = [[4, 4], [4, 3], [3, 4]];
const gridSlide = (coords) => ({
  template: 'body-full',
  body: { type: 'coordinate-grid', max: 4, points: AT.map(([x, y], i) => ({ x, y, label: 'TUV'[i], ...(coords ? { coords: true, answer: 'coordinates' } : {}) })) },
});
const gridSize = (spec) => { const L = grid.describeLayout(spec, BOARD); return [L.w, L.h, L.origin.x, L.origin.y].map((v) => v.toFixed(2)); };

test('a grid keeps its size and place when its answers slide writes the coordinates in', () => {
  const question = gridSlide(false);
  const answers = gridSlide(true);
  assert.notDeepEqual(gridSize(question.body), gridSize(answers.body), 'the test must start from a grid that moves');
  keepGridsStill({ slides: [question, answers] });
  assert.deepEqual(gridSize(question.body), gridSize(answers.body));
});

test('a grid alone, a grid of another size and a grid in another slot are left as they were', () => {
  const alone = gridSlide(false);
  const other = { template: 'body-full', body: { type: 'coordinate-grid', max: 6, points: [{ x: 1, y: 1, label: 'A' }] } };
  const elsewhere = { template: 'split-h-50-50', primary: gridSlide(true).body };
  keepGridsStill({ slides: [alone, other, elsewhere] });
  assert.equal(alone.body.roomFor, undefined);
  assert.equal(other.body.roomFor, undefined);
  assert.equal(elsewhere.primary.roomFor, undefined);
});

const LOOP = { widthPt: 855, heightPt: 447 };
const cycleSlide = (body) => ({ template: 'body-full', body: { type: 'cycle', ...body } });
const QUESTION = { boxes: ['egg', null, 'chrysalis', null], arrows: [null, 'makes a hard case', null, 'lays eggs'], arrowLine: true };
const ANSWERS = {
  boxes: ['egg', { text: 'caterpillar', answer: true }, 'chrysalis', { text: 'butterfly', answer: true }],
  arrows: [{ text: 'hatches', answer: true }, 'makes a hard case', { text: 'comes out with wings', answer: true }, 'lays eggs'],
};
const loop = (spec) => {
  const L = cycle.describeLayout(spec, 'slides', LOOP);
  return { size: [L.W, L.h, L.pt].map((v) => v.toFixed(2)), boxes: L.boxes.map((b) => [b.x, b.y, b.w, b.h].map((v) => v.toFixed(2))) };
};

test('a cycle keeps its size and place when its answers slide fills in the stages and arrow words', () => {
  const question = cycleSlide(QUESTION);
  const answers = cycleSlide(ANSWERS);
  assert.notDeepEqual(loop(question.body), loop(answers.body), 'the test must start from a loop that moves');
  keepCyclesStill({ slides: [question, answers] });
  assert.deepEqual(loop(question.body), loop(answers.body));
});

test('two different cycles shown in the same place share nothing', () => {
  const water = cycleSlide({ boxes: ['sea, rivers and lakes', 'water vapour in the air', 'clouds', 'rain, hail or snow'] });
  const butterfly = cycleSlide(ANSWERS);
  keepCyclesStill({ slides: [water, butterfly] });
  assert.equal(water.body.roomFor, undefined);
  assert.equal(butterfly.body.roomFor, undefined);
});
