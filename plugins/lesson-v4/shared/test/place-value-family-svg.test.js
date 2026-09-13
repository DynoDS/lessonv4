'use strict';

// The place value family, drawn once in shared/visuals/ and placed by every
// surface (13 September 2026). What this pins is the part no single surface's
// tests can see: that each drawing reads every surface's older spelling, lays
// itself out inside the box it is given on every profile, keeps its words at
// or above the surface's floor, and prints in ink for the photocopied pack.

const assert = require('node:assert/strict');
const test = require('node:test');

const { profileFor } = require('../visuals/surface-profiles');

const FAMILY = {
  'place-value-chart': { columns: ['Th', 'H', 'T', 'O'], rows: [{ label: '3,462', cells: ['3', '4', '6', '2'] }, { label: '10 more', cells: ['3', '4', '7', '2'], highlight: ['T'] }] },
  'place-value-mini': { mode: 'placeholder', number: '4050' },
  'base-ten-blocks': { counts: { Th: 2, H: 4, T: 3, O: 6 } },
  'counter-group': { statement: '5,009 = 5,000 + 9', joiner: '+', groups: [{ value: '1000', count: 5 }, { value: '1', count: 9 }] },
  'part-whole-model': { whole: '45', parts: ['27', '18'] },
  pyramid: { rows: [{ cells: 1, items: ['||42'] }, { cells: 2, items: ['20', '22'] }, { cells: 3, items: ['8', '12', '10'] }] },
  'mult-grid': { corner: '×', colHeaders: ['9', '6', '7'], rowHeaders: ['3', '8'], cells: [['27', '18', '21'], ['72', '', '56']] },
};

const BOXES = {
  slides: { widthPt: 9 * 72, heightPt: 4.2 * 72 },
  worksheets: { widthMm: 170 },
  wall: { widthMm: 180 },
  stickin: { widthMm: 150 },
};

const mod = (name) => require(`../visuals/${name}-svg`);

test('every drawing fits the box it is given, on every surface', () => {
  for (const [name, spec] of Object.entries(FAMILY)) {
    for (const [surface, box] of Object.entries(BOXES)) {
      const profile = profileFor(surface, box);
      const built = mod(name).tightSvg(spec, profile);
      assert.ok(built.w <= profile.widthPt + 0.5, `${name} on ${surface} is ${built.w.toFixed(1)}pt wide in a ${profile.widthPt.toFixed(1)}pt box`);
      if (profile.heightPt) assert.ok(built.h <= profile.heightPt + 0.5, `${name} on ${surface} is taller than its zone`);
      assert.ok(built.aspect > 0 && Number.isFinite(built.aspect));
      assert.match(built.svg, /^<svg /);
    }
  }
});

test('no word prints below the surface floor on paper and the wall', () => {
  for (const [name, spec] of Object.entries(FAMILY)) {
    for (const surface of ['worksheets', 'wall', 'stickin']) {
      const profile = profileFor(surface, BOXES[surface]);
      const sizes = [...mod(name).tightSvg(spec, profile).svg.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1]));
      for (const pt of sizes) assert.ok(pt >= Math.min(9, profile.minFontPt) - 0.01, `${name} on ${surface} printed a word at ${pt}pt`);
    }
  }
});

test('the stick-in pack is photocopied, so its drawings keep off the colour palette', () => {
  const COLOUR = /#(?:8AB8E8|8AC88A|E8D84A|E89090|00B050|0070C0)/i;
  for (const [name, spec] of Object.entries(FAMILY)) {
    const svg = mod(name).tightSvg(spec, profileFor('stickin', BOXES.stickin)).svg;
    assert.doesNotMatch(svg, COLOUR, `${name} printed house colours on the photocopied pack`);
  }
});

test('the key changes with the box and with the picture', () => {
  for (const [name, spec] of Object.entries(FAMILY)) {
    const m = mod(name);
    const a = m.cacheKey(spec, profileFor('wall', { widthMm: 180 }));
    const b = m.cacheKey(spec, profileFor('wall', { widthMm: 150 }));
    assert.notEqual(a, b, `${name} keys two widths as one picture`);
  }
  const chart = mod('place-value-chart');
  const wall = profileFor('wall', { widthMm: 180 });
  const ten = { columns: ['Th', 'H', 'T', 'O'], pair: { from: ['3', '4', '6', '2'], to: ['3', '4', '7', '2'], operation: '10 more' } };
  const hundred = { columns: ['Th', 'H', 'T', 'O'], pair: { from: ['3', '4', '6', '2'], to: ['3', '5', '6', '2'], operation: '100 more' } };
  assert.notEqual(chart.cacheKey(ten, wall), chart.cacheKey(hundred, wall));
});

test('every surface spelling still draws', () => {
  const sheet = profileFor('worksheets', { widthMm: 170 });
  // The sheet's spellings.
  assert.equal(mod('mult-grid').describeLayout({ operator: '÷', colHeaders: ['2'], rowHeaders: ['3'] }, sheet).grid[0][0].text, '÷');
  assert.equal(mod('pyramid').normalise({ rows: [[''], ['14', '20']] }).rows[1].bricks[1].text, '20');
  assert.equal(mod('base-ten-blocks').normalise({ counts: { thousands: 2, ones: 3 } }).counts.Th, 2);
  const counterChart = mod('place-value-chart').normalise({ columns: ['tens', 'ones'], counts: { tens: 2 } });
  assert.equal(counterChart.rows[0].digits, false);
  assert.equal(counterChart.rows[0].counterLabels, true);
  const pw = mod('part-whole-model').normalise({ whole: { value: '6,731' }, parts: [{ blank: true, caption: 'Thousands' }] });
  assert.equal(pw.orientation, 'vertical');
  assert.equal(pw.parts[0].blankChars, 4);
});

test('the pair derives what changed and never rings an unknown', () => {
  const chart = mod('place-value-chart');
  const exchange = chart.normalise({ columns: ['Th', 'H', 'T', 'O'], pair: { from: ['3', '4', '9', '7'], to: ['3', '5', '0', '7'], operation: '10 more' } });
  assert.deepEqual([...exchange.pair.changed], [1, 2], 'an exchange rings both columns it moved');
  assert.equal(exchange.pair.title, '10 more: 3,507');
  const unknown = chart.normalise({ columns: ['Th', 'H', 'T', 'O'], pair: { from: ['0', '8', '9', '0'], to: ['', '', '', ''], title: '' } });
  assert.equal(unknown.pair.changed.size, 0);
  assert.equal(unknown.pair.unknown, true);
  const placeholder = chart.normalise({ columns: ['Th', 'H', 'T', 'O'], pair: { from: ['0', '8', '9', '0'], to: ['0', '9', '0', '0'], operation: '+ 10' } });
  assert.equal(placeholder.pair.title, '+ 10: 900', 'a thousands placeholder is written 900, not 0,900');
});
