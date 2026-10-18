'use strict';

// A process chain's answers are green where they are written, as a cycle's
// are. A Year 4 science check slide (17 October 2026) had no way to mark them:
// its answers sat black in the boxes and a green line under the chain wrote the
// whole order out again, and its slide designer spent minutes in this drawing's
// code looking for the mark that did not exist.

const test = require('node:test');
const assert = require('node:assert/strict');

const chain = require('../visuals/process-chain-svg');
const { profileFor } = require('../visuals/surface-profiles');

const GREEN = '#00B050';
const BOARD = profileFor('slides', { widthPt: 855, heightPt: 300 });
const ANSWERS = { boxes: ['school bell', { text: 'air', answer: true }, { text: 'outer ear', answer: true }, { text: 'eardrum', answer: true }] };
const QUESTION = { boxes: ['school bell', null, null, null] };

test('the boxes that are the answer are green on the board and the wall, and the given ones are not', () => {
  for (const profile of [BOARD, profileFor('wall', { widthMm: 360 })]) {
    const { svg } = chain.tightSvg(ANSWERS, profile);
    assert.match(svg, new RegExp(`fill="${GREEN}"[^>]*>air<`));
    assert.match(svg, new RegExp(`fill="${GREEN}"[^>]*>eardrum<`));
    assert.doesNotMatch(svg, new RegExp(`fill="${GREEN}"[^>]*>school bell<`));
  }
});

test('a pupil sheet and the stick-in pack print the question: empty boxes where the answers were', () => {
  for (const profile of [profileFor('worksheets', { widthMm: 174 }), profileFor('stickin', { widthMm: 160 })]) {
    const L = chain.describeLayout(ANSWERS, profile);
    assert.deepEqual(L.boxes.map((b) => b.text), ['school bell', null, null, null]);
    assert.doesNotMatch(chain.tightSvg(ANSWERS, profile).svg, /eardrum/);
    assert.equal(chain.cacheKey(ANSWERS, profile), chain.cacheKey(QUESTION, profile));
  }
});

test("the teacher's answer sheet prints the answers in green", () => {
  const key = profileFor('worksheets', { widthMm: 174, overrides: { answers: 'show' } });
  assert.match(chain.tightSvg(ANSWERS, key).svg, new RegExp(`fill="${GREEN}"[^>]*>air<`));
  assert.notEqual(chain.cacheKey(ANSWERS, key), chain.cacheKey(ANSWERS, profileFor('worksheets', { widthMm: 174 })));
});

test('a pictured answer keeps its picture on paper and loses only its name', () => {
  const pictured = { boxes: ['grass', { text: 'rabbit', answer: true, imageHref: 'data:image/png;base64,AAAA', imageWidth: 400, imageHeight: 300 }] };
  const L = chain.describeLayout(pictured, profileFor('worksheets', { widthMm: 174 }));
  assert.equal(L.boxes[1].text, null);
  assert.ok(L.boxes[1].pic, 'the picture stays');
  assert.match(chain.tightSvg(pictured, BOARD).svg, new RegExp(`fill="${GREEN}"[^>]*>rabbit<`));
});
