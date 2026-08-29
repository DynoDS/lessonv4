'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  GROUPS, SLOTS, MAX_EXAMPLES, tightSvg, describeLayout
} = require('../../shared/visuals/balanced-pattern-plate-svg');

// Every space the drawing claims must sit inside the picture, inside the sector
// it belongs to, and clear of every other space. Hand-placed labels passed the
// old build and still came out clipped by the rim and floating over the wrong
// sector, so the check is on the geometry rather than on the presence of words.
function assertSpacesAreHonest(spec, label) {
  const layout = describeLayout(spec);
  const { cx, cy, r } = layout.plate;
  const placed = layout.spaces.filter((space) => space.box);

  for (const space of placed) {
    const { x, y, w, h } = space.box;
    assert.ok(
      x >= 0 && y >= 0 && x + w <= layout.width && y + h <= layout.height,
      `${label}: ${space.key} leaves the picture`
    );

    if (space.placement !== 'plate') continue;

    const u1 = { x: Math.cos((space.wedge.a1 * Math.PI) / 180), y: Math.sin((space.wedge.a1 * Math.PI) / 180) };
    const u2 = { x: Math.cos((space.wedge.a2 * Math.PI) / 180), y: Math.sin((space.wedge.a2 * Math.PI) / 180) };
    for (const [px, py] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) {
      const dx = px - cx;
      const dy = py - cy;
      assert.ok(Math.hypot(dx, dy) <= r, `${label}: ${space.key} crosses the plate rim`);
      assert.ok(
        u1.x * dy - u1.y * dx >= 0 && u2.x * dy - u2.y * dx <= 0,
        `${label}: ${space.key} sits over a neighbouring sector`
      );
    }
  }

  for (let i = 0; i < placed.length; i += 1) {
    for (let j = i + 1; j < placed.length; j += 1) {
      const a = placed[i].box;
      const b = placed[j].box;
      const apart = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
      assert.ok(apart, `${label}: ${placed[i].key} overlaps ${placed[j].key}`);
    }
  }
}

test('the plate keeps the intended broad proportions', () => {
  const shares = Object.fromEntries(GROUPS.map(group => [group.key, group.share]));
  const total = GROUPS.reduce((sum, group) => sum + group.share, 0);
  assert.ok(Math.abs(total - 1) < 1e-9);
  assert.ok(shares['fruit-vegetables'] > shares.protein);
  assert.ok(shares['starchy-carbohydrates'] > shares['dairy-alternatives']);
  assert.ok(shares['oils-spreads'] < shares['dairy-alternatives']);
});

test('teaching mode includes neutral labels, varied examples, water and the over-time caption', () => {
  const { svg } = tightSvg({ mode: 'teaching' });
  for (const text of [
    'Fruit and vegetables', 'Protein foods', 'Oils and spreads', 'Water',
    'across a day or over time', 'apple', 'rice', 'beans', 'milk'
  ]) assert.match(svg, new RegExp(text));
  assert.match(svg, /Starchy[\s\S]*carbohydrates/);
  assert.match(svg, /Dairy or[\s\S]*alternatives/);
  assert.match(svg, /Foods high in fat,[\s\S]*salt or sugar/);
  assert.doesNotMatch(svg, /calorie|weight[- ]?loss|bad food/i);
});

test('every group is drawn somewhere it fits, in teaching and in practice', () => {
  assertSpacesAreHonest({ mode: 'teaching' }, 'teaching');
  assertSpacesAreHonest(
    { mode: 'practice', givenGroups: ['fruit-vegetables', 'starchy-carbohydrates'] },
    'practice'
  );
});

test('longer labels and examples rearrange the drawing instead of overflowing it', () => {
  // The reported fault: wording the helper was not hand-tuned for came out
  // clipped by the rim and sitting over the wrong sector. Any lesson may write
  // its own labels, so any wording has to land somewhere legible.
  const spec = {
    mode: 'teaching',
    groupLabels: {
      protein: 'Protein foods and pulses',
      'dairy-alternatives': 'Dairy and fortified alternatives',
      'starchy-carbohydrates': 'Starchy carbohydrates and cereals'
    },
    examples: {
      protein: ['chickpeas', 'red lentils', 'salmon', 'tofu'],
      'starchy-carbohydrates': ['wholemeal bread', 'brown rice', 'couscous', 'oats']
    }
  };
  assertSpacesAreHonest(spec, 'long labels');
  const { svg } = tightSvg(spec);
  for (const text of [
    'pulses', 'fortified', 'cereals', 'chickpeas', 'red lentils', 'wholemeal', 'couscous'
  ]) assert.match(svg, new RegExp(text), `${text} was dropped`);
});

test('a group too small for its own words moves beside the plate rather than being squeezed', () => {
  const spaces = describeLayout({ mode: 'teaching' }).spaces;
  const at = key => spaces.find(space => space.key === key).placement;
  assert.equal(at('fruit-vegetables'), 'plate');
  assert.equal(at('starchy-carbohydrates'), 'plate');
  assert.equal(at('oils-spreads'), 'gutter');
  assert.ok(spaces.every(space => space.box), 'every group is drawn somewhere');
});

test('practice mode preserves all five sectors and blanks only the groups the lesson names', () => {
  const sectorCount = svg => (svg.match(/<path d="M [\d.]+ [\d.]+ L [\d.]+ [\d.]+ A /g) || []).length;
  const teaching = tightSvg({ mode: 'teaching' }).svg;
  const practice = tightSvg({
    mode: 'practice',
    givenGroups: ['fruit-vegetables', 'starchy-carbohydrates']
  }).svg;
  assert.equal(sectorCount(teaching), 5);
  assert.equal(sectorCount(practice), 5);
  assert.match(practice, /stroke-dasharray="14 10"/);
  assert.match(practice, /Fruit and vegetables/);
  assert.doesNotMatch(practice, />Protein foods</);
});

test('any group may be the blank one, including a large one', () => {
  // A helper that only ever blanks the two big areas would decide the lesson's
  // pedagogy for it. Naming the blanks has to work either way round.
  const spec = { mode: 'practice', blankGroups: ['fruit-vegetables', 'oils-spreads'] };
  assertSpacesAreHonest(spec, 'blank fruit');
  const { svg } = tightSvg(spec);
  assert.doesNotMatch(svg, />Fruit and vegetables</);
  assert.match(svg, /Starchy[\s\S]*carbohydrates/);
  assert.match(svg, /Protein foods/);
  const spaces = describeLayout(spec).spaces;
  assert.equal(spaces.find(s => s.key === 'fruit-vegetables').given, false);
  assert.equal(spaces.find(s => s.key === 'protein').given, true);
});

test('a practice plate that names no groups is blank throughout', () => {
  // The helper never picks which groups a lesson leaves out.
  const { svg } = tightSvg({ mode: 'practice' });
  for (const group of GROUPS) assert.doesNotMatch(svg, new RegExp('>' + group.label + '<'));
  assertSpacesAreHonest({ mode: 'practice' }, 'all blank');
});

test('the slots a designer can fill are declared, not guessed at', () => {
  assert.equal(SLOTS.length, GROUPS.length);
  for (const slot of SLOTS) {
    assert.equal(typeof slot.defaultLabel, 'string');
    assert.equal(slot.maxExamples, MAX_EXAMPLES);
    assert.ok(slot.share > 0);
  }
});
