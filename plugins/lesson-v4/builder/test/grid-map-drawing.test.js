'use strict';

// The grid map as the teacher saw it on 28 September 2026: the ring sat on a
// corner and read as a circle that missed the bridge, the top number was cut in
// half by the frame, and a bridge stood beside the river instead of on it.

const test = require('node:test');
const assert = require('node:assert');
const { tightSvg } = require('../../shared/visuals/grid-map-svg');

const MAP = {
  eastings: [41, 42, 43, 44, 45, 46],
  northings: [41, 42, 43, 44, 45],
  river: [[41.0, 44.75], [42.5, 44.64], [43.6, 44.3], [44.35, 43.4], [44.5, 42.64], [45.3, 42.35], [45.6, 41.5], [46.0, 41.2]],
  features: [
    { name: 'bridge', square: [42, 44], type: 'human' },
    { name: 'church', square: [42, 42], type: 'human' }
  ],
  highlightSquare: [42, 44]
};

function circles(svg) {
  return [...svg.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"([^>]*)>/g)]
    .map((m) => ({ x: +m[1], y: +m[2], r: +m[3], rest: m[4] }));
}

test('the highlight rings the whole square and dots its reading corner', () => {
  const { svg } = tightSvg(MAP);
  const orange = circles(svg).filter((c) => /E8821E/i.test(c.rest));
  const ring = orange.find((c) => /fill="none"/.test(c.rest));
  const dot = orange.find((c) => !/fill="none"/.test(c.rest));
  assert.ok(ring && dot, 'a ring and a corner dot are both drawn');
  assert.ok(ring.r > 40, 'the ring is big enough to surround a square (CELL is 100)');
  assert.ok(Math.abs(ring.x - dot.x) > 30 && Math.abs(ring.y - dot.y) > 30,
    'the ring is centred on the square, not on its corner');
});

test('grid numbers do not rely on dominant-baseline, which the renderer ignores', () => {
  const { svg } = tightSvg(MAP);
  assert.doesNotMatch(svg, /dominant-baseline/);
});

test('a bridge is drawn on the river, a church is not moved', () => {
  const { svg } = tightSvg(MAP);
  const dots = circles(svg).filter((c) => /#333333/.test(c.rest));
  // CELL 100, MARGIN_LEFT 62, MARGIN_TOP 17: square [42, 44] spans x 162..262,
  // y 17..117, centre (212, 67). The river crosses its upper part.
  const bridge = dots.find((c) => c.x > 162 && c.x < 262 && c.y > 17 && c.y < 117);
  assert.ok(bridge, 'the bridge marker is inside its own square');
  assert.ok(Math.abs(bridge.y - 67) > 5, 'the bridge moved off the square centre onto the water');
  const church = dots.find((c) => c.x > 162 && c.x < 262 && c.y > 217 && c.y < 317);
  assert.ok(church, 'the church stays in its square');
});
