'use strict';

// A fraction wall on a question slide and on its answers slide is one wall to
// the class. The answers slide rules the line that finds the family, and the
// line runs a little past the wall at both ends, so without its room kept the
// wall with the line would draw smaller than the wall the question showed.

const test = require('node:test');
const assert = require('node:assert/strict');
const { keepWallsStill } = require('../src/content/walls-stand-still');
const wall = require('../../shared/visuals/fraction-wall-svg');

const ROWS = [1, 2, 3, 4, 6, 8, 12];
const slide = (marks = {}, extra = {}) => ({
  template: 'your-turn',
  body: { type: 'stack', items: [{ type: 'text', value: 'Find the fraction family of 1/2.' }, { type: 'fraction-wall', fractions: ROWS, ...marks }] },
  ...extra,
});
const wallOf = (s) => s.body.items[1];
const drawn = (spec) => {
  const out = wall.describeLayout(spec, 'slides', { widthPt: 800, heightPt: 400 });
  return { rows: out.rows.map((r) => [r.y, r.h]), size: [out.w, out.h], names: out.labelPt };
};

test('a wall keeps its size and place when its answers slide rules the line and shades the family', () => {
  const question = slide();
  const answer = slide({ line: '1/2', shade: 'family' });
  assert.notDeepEqual(drawn(wallOf(question)), drawn(wallOf(answer)), 'the test must start from a wall that moves');

  keepWallsStill({ slides: [question, answer] });
  assert.deepEqual(drawn(wallOf(question)), drawn(wallOf(answer)));
  // The question slide still shows no line and nothing shaded.
  const svg = wall.tightSvg(wallOf(question), 'slides', { widthPt: 800, heightPt: 400 }).svg;
  assert.doesNotMatch(svg, /<line /);
  assert.doesNotMatch(svg, /#A9DFBF/);
});

test('three slides of one model (plain, ruled, shaded) all show the wall in one place', () => {
  const told = [slide(), slide({ line: '3/4' }), slide({ line: '3/4', shade: 'family' })];
  keepWallsStill({ slides: told });
  assert.deepEqual(drawn(wallOf(told[0])), drawn(wallOf(told[1])));
  assert.deepEqual(drawn(wallOf(told[1])), drawn(wallOf(told[2])));
});

test('a wall alone, a wall with other rows, a wall in another slot and walls that never rule a line are left as they were', () => {
  const alone = slide();
  const otherRows = { template: 'your-turn', body: { type: 'stack', items: [{ type: 'text', value: 'x' }, { type: 'fraction-wall', fractions: [2, 4, 8], line: '1/2' }] } };
  const elsewhere = { template: 'your-turn', body: { type: 'fraction-wall', fractions: ROWS, line: '1/2' } };
  keepWallsStill({ slides: [alone, otherRows, elsewhere] });
  assert.equal(wallOf(alone).roomFor, undefined);

  const shadedOnly = [slide(), slide({ shade: ['1/2', '2/4'] })];
  keepWallsStill({ slides: shadedOnly });
  assert.equal(wallOf(shadedOnly[0]).roomFor, undefined);
  assert.deepEqual(drawn(wallOf(shadedOnly[0])), drawn(wallOf(shadedOnly[1])), 'shading takes no room of its own');
});
