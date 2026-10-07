'use strict';

// Where the labels of a labelled diagram land.
//
// The poster layout (`sides`) stacks each label in the margin beside the
// picture. It used to space them by how many there were and never by how tall
// each one was, so a label taller than a name was drawn through its
// neighbours. A Year 4 digestion deck went to the board on 6 October 2026 with
// a sentence under each organ name, eight blocks of up to seven rows piled on
// each other on four slides, and every check passed, because the words were
// inside a picture.
//
// Three things are pinned here: the poster layout cannot draw one label on
// another whatever the labels say; a poster of names is drawn exactly as it
// always was; and a layout that puts a label where it is told (`auto`,
// `label_at`) reports the collisions it cannot prevent, for the surface to
// refuse.

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');

const { buildLabelDiagramSvg, tightSvg } = require('../visuals/label-diagram-svg');

// The callouts of the delivered deck, as its slide spec held them.
const DIGESTION = [
  { anchor: [7, 45], label: 'mouth\nTeeth break food into smaller pieces. Saliva wets food and starts breaking some of it down.', given: true },
  { anchor: [21, 43], label: 'oesophagus\nMuscles push food to the stomach.', given: true },
  { anchor: [38, 46], label: 'stomach\nThe stomach churns food with digestive juices, which help break it down.', given: true },
  { anchor: [55, 49], label: 'small intestine\nDigestion continues here. Tiny nutrients pass into the blood.', given: true },
  { anchor: [72, 43], label: 'large intestine\nThe large intestine takes in water from what is left.', given: true },
  { anchor: [87, 46], label: 'rectum\nThe rectum holds faeces.', given: true },
  { anchor: [97, 48], label: 'anus\nWaste leaves through the anus.', given: true },
  { anchor: [54, 73], label: 'blood', given: true },
];

const poster = (callouts, extra = {}) => tightSvg({
  imagePath: 'route.jpg', imageHref: 'route.jpg', imageWidth: 1536, imageHeight: 1024,
  layout: 'sides', callouts, ...extra,
});

// The label blocks, read back out of the drawing itself so the test does not
// lean on the drawing's own report: each block's centre line and the rows it
// covers, top to bottom.
function drawnBlocks(svg) {
  const blocks = [];
  const texts = svg.match(/<text[^>]*>[\s\S]*?<\/text>/g) || [];
  for (const text of texts) {
    const size = Number(/font-size="([\d.]+)"/.exec(text)[1]);
    const rows = [...text.matchAll(/<tspan x="([-\d.]+)" y="([-\d.]+)"/g)]
      .map((m) => ({ x: Number(m[1]), y: Number(m[2]) }));
    if (!rows.length) {
      const own = /<text x="([-\d.]+)" y="([-\d.]+)"/.exec(text);
      rows.push({ x: Number(own[1]), y: Number(own[2]) });
    }
    blocks.push({
      x: rows[0].x,
      top: Math.min(...rows.map((r) => r.y)) - size * 0.85,
      bottom: Math.max(...rows.map((r) => r.y)) + size * 0.25,
    });
  }
  return blocks;
}

function pairsOnTopOfEachOther(svg) {
  const blocks = drawnBlocks(svg);
  let pairs = 0;
  for (let i = 0; i < blocks.length; i += 1) {
    for (let j = i + 1; j < blocks.length; j += 1) {
      const a = blocks[i], b = blocks[j];
      if (a.x === b.x && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) pairs += 1;
    }
  }
  return pairs;
}

test('sentence-long labels in the poster layout are stacked, never drawn through each other', () => {
  const out = poster(DIGESTION);
  assert.equal(drawnBlocks(out.svg).length, 8, 'every label is still drawn');
  assert.equal(pairsOnTopOfEachOther(out.svg), 0, 'no two labels on one side share any height');
  assert.deepEqual(out.labelFaults, { overlaps: [], clipped: [] });
  assert.deepEqual(out.restacked, ['left', 'right']);
  // The words are all there: nothing is shortened to make them fit.
  for (const word of ['Saliva', 'digestive', 'nutrients', 'faeces.', 'anus.']) {
    assert.ok(out.svg.includes(word), `"${word}" is still printed`);
  }
  // Tall enough to hold both stacks: no label is cut off at the top or bottom.
  for (const block of drawnBlocks(out.svg)) {
    assert.ok(block.top >= 0 && block.bottom <= out.h, 'each label sits inside the drawing');
  }
});

test('a poster of names is drawn exactly as it was before labels were measured', () => {
  // The templates.md church poster with one blank added. Pinned from the
  // drawing as it stood at 4.2.315, so the measure cannot move a healthy one.
  const out = tightSvg({
    imagePath: 'church-interior.jpg', imageHref: 'church-interior.jpg', imageWidth: 1200, imageHeight: 800,
    layout: 'sides',
    callouts: [
      { anchor: [50, 20], label: 'cross', given: true },
      { anchor: [82, 28], label: 'stained glass windows', given: true },
      { anchor: [26, 42], label: 'pulpit', given: true },
      { anchor: [50, 50], label: 'altar', given: true },
      { anchor: [20, 70], label: 'font' },
    ],
  });
  assert.equal(
    crypto.createHash('sha256').update(out.svg).digest('hex'),
    'd1de01b8ceebda666154170ee8357d199647b99f894d7be5e967170bfbe42fde'
  );
  assert.deepEqual(out.restacked, []);
  assert.deepEqual(out.outgrown, []);
  assert.deepEqual(out.labelFaults, { overlaps: [], clipped: [] });
});

test('labels that fit the picture once stacked stay within its height', () => {
  // Two three-row phrases above three names: spaced evenly the two phrases
  // touch, stacked by height all five fit the same stretch of the picture.
  const callouts = [
    { anchor: [80, 10], label: 'layers of rock from old eruptions', given: true },
    { anchor: [80, 30], label: 'a crack in the crust under the sea', given: true },
    { anchor: [80, 50], label: 'vent', given: true },
    { anchor: [80, 70], label: 'crater', given: true },
    { anchor: [80, 90], label: 'magma', given: true },
  ];
  const spec = { imagePath: 'p.jpg', imageHref: 'p.jpg', imageWidth: 1600, imageHeight: 1100, layout: 'sides', callouts };
  const out = tightSvg(spec);
  assert.deepEqual(out.restacked, ['right']);
  assert.deepEqual(out.outgrown, [], 'the stack is no taller than the picture');
  assert.equal(pairsOnTopOfEachOther(out.svg), 0);
  // Names alone on the same picture were never touching, so nothing moves.
  const names = tightSvg({ ...spec, callouts: callouts.slice(2) });
  assert.deepEqual(names.restacked, []);
});

test('labels taller than their picture are reported, with what they need and what there is', () => {
  const out = poster(DIGESTION);
  assert.deepEqual(out.outgrown.map((side) => side.side), ['left', 'right']);
  for (const side of out.outgrown) {
    assert.equal(side.room, 1024);
    assert.ok(side.need > side.room);
    assert.ok(side.rows >= 5, 'the longest label there runs to several rows');
  }
});

test('a line break written into a label is kept as a break', () => {
  const out = poster([{ anchor: [20, 50], label: 'rectum\nThe rectum holds faeces.', given: true }]);
  assert.match(out.svg, />rectum<\/tspan>/, 'the name has a row to itself');
  assert.doesNotMatch(out.svg, /rectum The/);
});

test('a layout that puts labels where it is told reports the ones that collide', () => {
  // Two parts close together at the left edge: `auto` sends both names to the
  // same spot in the left margin.
  const callouts = [
    { anchor: [10, 50], label: 'small intestine', given: true },
    { anchor: [12, 52], label: 'large intestine', given: true },
  ];
  const auto = buildLabelDiagramSvg({ href: 'p.jpg', width: 1200, height: 800, callouts });
  assert.deepEqual(auto.labelFaults.overlaps, [['small intestine', 'large intestine']]);

  // The same two parts in the poster layout, and placed apart by hand.
  const sides = buildLabelDiagramSvg({ href: 'p.jpg', width: 1200, height: 800, callouts, layout: 'sides' });
  assert.deepEqual(sides.labelFaults.overlaps, []);
  const placed = buildLabelDiagramSvg({
    href: 'p.jpg', width: 1200, height: 800,
    callouts: [{ ...callouts[0], label_at: [30, 20] }, { ...callouts[1], label_at: [30, 80] }],
  });
  assert.deepEqual(placed.labelFaults.overlaps, []);
});

test('a label that runs off the edge of the drawing is reported', () => {
  // `auto` does not wrap, so a sentence centred in the left margin runs out
  // past the edge of the canvas and is cut off there.
  const out = buildLabelDiagramSvg({
    href: 'p.jpg', width: 1200, height: 800,
    callouts: [{ anchor: [5, 50], label: 'The stomach churns food with digestive juices, which help break it down.', given: true }],
  });
  assert.equal(out.labelFaults.clipped.length, 1);
  assert.match(out.labelFaults.clipped[0], /^The stomach churns food/);

  const name = buildLabelDiagramSvg({
    href: 'p.jpg', width: 1200, height: 800,
    callouts: [{ anchor: [5, 50], label: 'stomach', given: true }],
  });
  assert.deepEqual(name.labelFaults.clipped, []);

  // Only printed words are measured: a blank write-on rule is not a label
  // that cannot be read, and reports nothing here.
  const blank = buildLabelDiagramSvg({
    href: 'p.jpg', width: 1024, height: 1536, layout: 'sides',
    callouts: [{ anchor: [40, 50], label: 'small intestine' }],
  });
  assert.deepEqual(blank.labelFaults, { overlaps: [], clipped: [] });
});
