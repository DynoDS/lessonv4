'use strict';

// Pointing at part of a figure.
//
// A teacher at the board talks about one part of the picture, and before this
// existed only six of the package's figures could be pointed at, each having
// invented its own word for it. These tests hold the one idea: a mark NAMES a
// part rather than sitting at a position, an unknown name is refused instead of
// silently drawing nothing, and every figure that takes a highlight treats it
// the same way.

const assert = require('node:assert/strict');
const test = require('node:test');

const highlight = require('../../shared/visuals/figure-highlight');
const venn = require('../../shared/visuals/venn-svg');
const carroll = require('../../shared/visuals/carroll-svg');
const tally = require('../../shared/visuals/tally-chart-svg');
const pictogram = require('../../shared/visuals/pictogram-svg');

const VENN = { label1: 'has a right angle', label2: 'has 4 equal sides' };
const CARROLL = {
  rowLabel: 'is a quadrilateral', rowNotLabel: 'is NOT a quadrilateral',
  colLabel: 'has a right angle', colNotLabel: 'has NO right angle',
  shapes: [{ cell: 'topLeft', label: 'Square' }, { cell: 'bottomRight', label: 'Circle' }]
};
const TALLY = {
  headers: ['Pet', 'Tally', 'Total'],
  rows: [{ label: 'Dogs', tally: 7 }, { label: 'Cats', tally: 4 }, { label: 'Fish', tally: 9 }]
};
const PICTOGRAM = {
  title: 'Pets', categories: ['Dogs', 'Cats', 'Fish'], values: [6, 4, 8],
  key: { per: 2, label: 'children' }
};

// ── The shared rule ─────────────────────────────────────────────────────────

test('a part the figure does not have is refused, and the refusal says what it does have', () => {
  // The failure this replaces: a highlight quietly ignored. The slide renders,
  // looks deliberate, and points at nothing, which nobody notices until a class
  // is looking at the wrong half of a diagram.
  assert.throws(
    () => highlight.resolveHighlight({ highlight: 'sideways' }, ['left', 'right'], 'test figure'),
    /FIGURE_HIGHLIGHT_UNKNOWN.*left, right/s
  );
});

test('highlighting every part is refused, because it points at nothing', () => {
  assert.throws(
    () => highlight.resolveHighlight({ highlight: ['left', 'right'] }, ['left', 'right'], 'test figure'),
    /FIGURE_HIGHLIGHT_INVALID/
  );
});

test('no highlight is the ordinary case and costs nothing', () => {
  assert.equal(highlight.resolveHighlight({}, ['left', 'right'], 'test figure').size, 0);
  assert.equal(highlight.opacityFor(new Set(), 'left'), 1);
  assert.equal(highlight.ringSvg(new Set(), 'left', { x: 0, y: 0, w: 10, h: 10 }, 100), '');
});

test('a part is found by the words a teacher would actually use', () => {
  const parts = [{ key: 'topLeft', aliases: ['both', 'is-is'] }];
  assert.deepEqual([...highlight.resolveHighlight({ highlight: 'both' }, parts, 'f')], ['topLeft']);
  assert.deepEqual([...highlight.resolveHighlight({ highlight: 'Top Left' }, parts, 'f')], ['topLeft']);
});

test('everything not highlighted fades, so the lit part carries the room', () => {
  const marked = highlight.resolveHighlight({ highlight: 'left' }, ['left', 'right'], 'f');
  assert.equal(highlight.opacityFor(marked, 'left'), 1);
  assert.ok(highlight.opacityFor(marked, 'right') < 1);
});

// ── The figures that carry it ───────────────────────────────────────────────

const CASES = [
  { name: 'venn', mod: venn, spec: VENN, part: 'overlap', absent: 'top' },
  { name: 'carroll', mod: carroll, spec: CARROLL, part: 'both', absent: 'middle' },
  { name: 'tally-chart', mod: tally, spec: TALLY, part: 'Cats', absent: 'Hamsters' },
  { name: 'pictogram', mod: pictogram, spec: PICTOGRAM, part: 'Cats', absent: 'Hamsters' }
];

for (const c of CASES) {
  test(`${c.name} draws nothing extra when no part is named`, () => {
    const svg = c.mod.tightSvg(c.spec).svg;
    assert.ok(svg.length > 0);
    assert.doesNotMatch(svg, new RegExp(highlight.RING), 'an unmarked figure carries no highlight ink');
  });

  test(`${c.name} lights the part it is given`, () => {
    const svg = c.mod.tightSvg(Object.assign({}, c.spec, { highlight: c.part })).svg;
    assert.match(svg, new RegExp(highlight.RING), 'the highlight colour must appear');
  });

  test(`${c.name} refuses a part it does not have`, () => {
    assert.throws(
      () => c.mod.tightSvg(Object.assign({}, c.spec, { highlight: c.absent })),
      /FIGURE_HIGHLIGHT_UNKNOWN/
    );
  });

  test(`${c.name} caches a highlighted figure separately from a plain one`, () => {
    // Two different pictures sharing one cache key is how a marked figure ends
    // up drawn without its mark, or an unmarked one drawn with somebody else's.
    assert.notEqual(
      c.mod.cacheKey(c.spec),
      c.mod.cacheKey(Object.assign({}, c.spec, { highlight: c.part }))
    );
  });
}

// ── The Venn's regions are regions, not boxes ───────────────────────────────

test('a Venn region is filled to its real shape rather than ringed with a rectangle', () => {
  // A rectangle round the overlap encloses most of both circles and names the
  // wrong set, so each region is cut out with a mask instead.
  for (const region of ['leftOnly', 'rightOnly', 'overlap', 'outside']) {
    const svg = venn.tightSvg(Object.assign({}, VENN, { highlight: region })).svg;
    assert.match(svg, /<mask id="venn-region-0">/, `${region} needs its own mask`);
    assert.match(svg, /mask="url\(#venn-region-0\)"/, `${region} must be trimmed by that mask`);
  }
});
