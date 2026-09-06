'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { splitAnswerRuns } = require('../src/answer-text');
const { COLOURS } = require('../src/styles');

test('question labels stay purple while question and answer retain their roles', () => {
  for (const label of ['(a)', '(2)', '(12b)']) {
    const runs = splitAnswerRuns(`${label} What is 2 + 3? ||5`, true, COLOURS.title);
    assert.equal(runs[0].options.color, COLOURS.questionLabel);
    assert.equal(runs[1].options.color, COLOURS.title);
    assert.equal(runs.at(-1).options.color, COLOURS.green);
    assert.equal(runs.map(r => r.text).join(''), `${label} What is 2 + 3? 5`);
  }
});

test('parenthesised calculations and ordinary prose do not become question labels', () => {
  assert.equal(splitAnswerRuns('(2 + 3) times 4', true), '(2 + 3) times 4');
  assert.equal(splitAnswerRuns('Compare (a) and (b).', true), 'Compare (a) and (b).');
});
