'use strict';

// A shape on a question slide and on its answers slide is one shape to the
// class. It used to shrink and move when the answers added side lengths (Year
// 5 rectilinear shapes, 7 October 2026: 290px then 218px, and moved 58px),
// because the lengths take their room from the shape.

const test = require('node:test');
const assert = require('node:assert/strict');
const { keepShapesStill } = require('../src/content/shapes-stand-still');
const polygon = require('../../shared/visuals/polygon-svg');

const L = [[0, 0], [9, 0], [9, 8], [5, 8], [5, 2], [0, 2]];
const slide = (sideLabels, extra = {}) => ({
  template: 'your-turn',
  body: { type: 'stack', items: [{ type: 'polygon', shapes: [{ vertices: L, sideLabels }] }] },
  ...extra,
});
const shapeOf = (s) => s.body.items[0];
const drawn = (spec) => {
  const out = polygon.describeLayout(spec, 'slides', { widthPt: 400, heightPt: 300 });
  return { w: out.geos[0].box.w, x: out.origins[0].x, y: out.origins[0].y, total: [out.w, out.h] };
};

test('a shape keeps its size and place when its answers slide writes more lengths', () => {
  const question = slide(['9 cm', '8 cm', '', '6 cm', '5 cm', '']);
  const answer = slide(['9 cm', '8 cm', '4 cm', '6 cm', '5 cm', '2 cm']);
  const apart = [drawn(shapeOf(question)), drawn(shapeOf(answer))];
  assert.notDeepEqual(apart[0], apart[1], 'the test must start from a shape that moves');

  keepShapesStill({ slides: [question, answer] });
  assert.deepEqual(drawn(shapeOf(question)), drawn(shapeOf(answer)));
  // The question still writes only its own lengths.
  const words = [...polygon.tightSvg(shapeOf(question), 'slides', { widthPt: 400, heightPt: 300 }).svg.matchAll(/>([^<]+)<\/text>/g)].map((m) => m[1]);
  assert.deepEqual(words.sort(), ['5 cm', '6 cm', '8 cm', '9 cm']);
});

test('a letter that becomes a length keeps the room of the longer one', () => {
  const question = slide(['9 cm', '8 cm', 'C', '6 cm', '5 cm', 'D']);
  const answer = slide(['9 cm', '8 cm', 'C = 4 cm', '6 cm', '5 cm', 'D = 2 cm']);
  keepShapesStill({ slides: [question, answer] });
  assert.deepEqual(drawn(shapeOf(question)), drawn(shapeOf(answer)));
});

test('a shape alone, a different outline, or a different slot is left exactly as it was', () => {
  const alone = slide(['9 cm', '8 cm', '', '6 cm', '5 cm', '']);
  const other = { template: 'your-turn', body: { type: 'stack', items: [{ type: 'polygon', shapes: [{ name: 'rectangle', sideLabels: ['7 cm', '5 cm'] }] }] } };
  const elsewhere = { template: 'your-turn', body: { type: 'row', items: [{ type: 'text', value: 'x' }, { type: 'polygon', shapes: [{ vertices: L, sideLabels: ['1 cm', '2 cm', '3 cm', '4 cm', '5 cm', '6 cm'] }] }] } };
  keepShapesStill({ slides: [alone, other, elsewhere] });
  for (const s of [alone, other]) assert.equal(shapeOf(s).shapes[0].roomFor, undefined);
  assert.equal(elsewhere.body.items[1].shapes[0].roomFor, undefined);
});
