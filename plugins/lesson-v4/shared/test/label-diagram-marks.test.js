'use strict';

// Marks drawn on a labelled picture: a line round an area, a line along an
// edge, a ring, an arrow. A task that sends children to one part of a photo
// ("Why does the forest stop at this line?") needs that part marked, or they
// hunt a dark space picture for a line nobody drew (Geography 4, 6 November
// 2026).

const test = require('node:test');
const assert = require('node:assert/strict');
const { tightSvg, cacheKey, markProblems } = require('../visuals/label-diagram-svg');

const base = { href: 'data:image/png;base64,AAAA', width: 1000, height: 800, layout: 'sides' };
const callouts = [{ anchor: [40, 50], label: 'Inside the line', given: true }];
const outline = { kind: 'outline', of: 'the park edge', points: [[30, 10], [60, 10], [60, 80], [30, 80]] };

test('each kind of mark is drawn on the picture in bright yellow over a dark casing', () => {
  const marks = [
    outline,
    { kind: 'line', of: 'a road', points: [[10, 90], [50, 60]] },
    { kind: 'ring', of: 'one field', at: [70, 40], size: 10 },
    { kind: 'arrow', of: 'a field edge', from: [90, 90], to: [72, 45] },
  ];
  const { svg } = tightSvg({ ...base, callouts, marks });
  assert.match(svg, /<polygon points="[^"]+" fill="none" stroke="#1A1A1A"/);
  assert.match(svg, /<polyline points="[^"]+" fill="none" stroke="#FFD21F"/);
  assert.match(svg, /<circle cx="[^"]+" cy="[^"]+" r="50.00" fill="none" stroke="#FFD21F"/);
  assert.match(svg, /<polygon points="[^"]+" fill="#FFD21F"\/>/);
  // The marks sit on the picture, under the callouts' lines and names.
  assert.ok(svg.indexOf('#FFD21F') < svg.indexOf('Inside the line'));
});

test('a diagram with no marks draws exactly as it did', () => {
  assert.equal(tightSvg({ ...base, callouts }).svg, tightSvg({ ...base, callouts, marks: [] }).svg);
  assert.equal(cacheKey({ imagePath: 'a.jpg', callouts }), cacheKey({ imagePath: 'a.jpg', callouts, marks: [] }));
  assert.notEqual(cacheKey({ imagePath: 'a.jpg', callouts }), cacheKey({ imagePath: 'a.jpg', callouts, marks: [outline] }));
});

test('a picture carrying only marks takes its whole slot', () => {
  const built = tightSvg({ ...base, marks: [outline] });
  assert.equal(built.w, 1000);
  assert.equal(built.h, 800);
});

test('a mark with no place on the picture is refused by name', () => {
  for (const [bad, why] of [
    [{ kind: 'outline', points: [[1, 1], [2, 2]] }, 'an outline needs three points'],
    [{ kind: 'line', points: [[1, 1], [120, 2]] }, 'points are percentages'],
    [{ kind: 'ring' }, 'a ring needs its centre'],
    [{ kind: 'arrow', from: [1, 1] }, 'an arrow needs both ends'],
    [{ kind: 'star', at: [1, 1] }, 'an unknown kind'],
  ]) {
    assert.ok(markProblems([bad]).length, why);
    assert.throws(() => tightSvg({ ...base, callouts, marks: [bad] }), /PHOTO_MARK_INVALID/, why);
  }
  assert.deepEqual(markProblems([outline]), []);
});
