'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const world = require('../../shared/visuals/seven-continent-world-map-svg');

const LABELLED = {
  map: 'world-with-antarctica',
  presentation: 'seven-continent-world',
  continentLabels: [
    { text: 'North America', at: [0.208, 0.25] }, { text: 'South America', at: [0.333, 0.583] },
    { text: 'Europe', at: [0.556, 0.222] }, { text: 'Africa', at: [0.556, 0.472] },
    { text: 'Asia', at: [0.75, 0.278] }, { text: 'Australia', at: [0.875, 0.639] },
    { text: 'Antarctica', at: [0.50, 0.933] }
  ],
  oceanLabels: [
    { text: 'Atlantic Ocean', at: [0.417, 0.444] },
    { text: 'Indian Ocean', at: [0.722, 0.611] },
    { text: 'Pacific Ocean', at: [0.069, 0.50], repeatAt: [0.944, 0.50] },
    { text: 'Southern Ocean', at: [0.50, 0.833] },
    { text: 'Arctic Ocean', at: [0.50, 0.083] }
  ],
  seaLabels: [
    { text: 'Mediterranean Sea', at: [0.55, 0.305], labelAt: [0.58, 0.35] },
    { text: 'Caribbean Sea', at: [0.292, 0.41], labelAt: [0.25, 0.45] },
    { text: 'North Sea', at: [0.508, 0.19], labelAt: [0.48, 0.14] }
  ],
  showEquator: true,
  showCompass: true,
  joinedEdges: true
};

test('a complete slide map accepts seven continents and five oceans including repeated Pacific', () => {
  const resolved = world.resolve(LABELLED);
  assert.equal(resolved.continentLabels.length, 7);
  assert.equal(resolved.oceanLabels.length, 5);
  assert.equal(resolved.oceanLabels.filter((item) => item.repeatAt).length, 1);
  assert.equal(resolved.seaLabels.length, 3);
});

test('the labelled slide keeps Antarctica, Southern Ocean, Equator, compass and joined edges visible', () => {
  const svg = world.tightSvg(LABELLED).svg;
  assert.match(svg, />Antarctica</);
  assert.match(svg, />Southern Ocean</);
  assert.match(svg, />Equator</);
  assert.match(svg, />N</);
  assert.match(svg, /one Pacific Ocean/);
  assert.equal((svg.match(/>Pacific Ocean<\/text>/g) || []).length, 2);
});

test('numbered and lettered clue markers can share one real map', () => {
  const spec = {
    map: 'world-with-antarctica', presentation: 'seven-continent-world',
    clueMarkers: [
      { marker: '1', kind: 'continent', at: [0.208, 0.25] },
      { marker: '2', kind: 'continent', at: [0.50, 0.933] },
      { marker: 'A', kind: 'ocean', at: [0.417, 0.444] },
      { marker: 'B', kind: 'ocean', at: [0.069, 0.50], repeatAt: [0.944, 0.50] }
    ]
  };
  const svg = world.tightSvg(spec).svg;
  assert.equal((svg.match(/>B<\/text>/g) || []).length, 2);
  assert.match(svg, />1<\/text>/);
  assert.match(svg, />A<\/text>/);
});

test('a sea focus is a crop of the same embedded real map', () => {
  const spec = {
    map: 'world-with-antarctica', presentation: 'seven-continent-world',
    focus: { centre: [0.508, 0.19], span: [0.12, 0.12], title: 'Where is the North Sea?' },
    seaLabels: [{ text: 'North Sea', at: [0.508, 0.19], labelAt: [0.48, 0.14] }]
  };
  const svg = world.tightSvg(spec).svg;
  assert.match(svg, /Where is the North Sea\?/);
  assert.match(svg, /viewBox="[\d.]+ [\d.]+ [\d.]+ [\d.]+"/);
  assert.equal((svg.match(/data:image\/png;base64/g) || []).length, 2, 'overview and zoom must embed the same asset');
});

test('oversized label and clue sets are refused instead of shrinking unreadably', () => {
  assert.throws(
    () => world.resolve({ ...LABELLED, continentLabels: LABELLED.continentLabels.concat({ text: 'Extra', at: [0.5, 0.5] }) }),
    /at most 7/
  );
  assert.throws(
    () => world.resolve({ map: 'world-with-antarctica', clueMarkers: Array.from({ length: 13 }, (_, i) => ({ marker: String(i), at: [0.5, 0.5] })) }),
    /at most 12/
  );
});
