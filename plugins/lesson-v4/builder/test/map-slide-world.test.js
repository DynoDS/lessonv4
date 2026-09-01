'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const world = require('../../shared/visuals/seven-continent-world-map-svg');
const maps = require('../../shared/visuals/map-annotations');

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

test('the Tropics are drawn where those latitudes really are on the real asset', () => {
  // The rainforest-distribution teaching that used to live on a schematic map
  // drawn from typed coordinates. The asset is a full equirectangular world, so
  // the Equator is exactly half way down it and each Tropic exactly 23.5/90 of
  // the way from there to a pole - arithmetic on the real image rather than a
  // line put where it looks about right.
  const spec = { map: 'world-with-antarctica', presentation: 'seven-continent-world', showTropics: true };
  const svg = world.tightSvg(spec).svg;
  assert.match(svg, />Tropic of Cancer</);
  assert.match(svg, />Tropic of Capricorn</);
  assert.match(svg, />Equator</, 'the Tropics only teach anything with the Equator between them');

  const ys = [...svg.matchAll(/<line x1="0" y1="([\d.]+)"/g)].map((m) => Number(m[1])).sort((a, b) => a - b);
  assert.deepEqual(ys, [332.5, 450, 567.5], 'Cancer, Equator and Capricorn on a 900-unit tall world');
});

test('the Equator can still be shown on its own', () => {
  const svg = world.tightSvg({ map: 'world-with-antarctica', presentation: 'seven-continent-world', showEquator: true }).svg;
  assert.match(svg, />Equator</);
  assert.doesNotMatch(svg, />Tropic of/);
});

// ── Marks on the real world map ─────────────────────────────────────────────

const RAINFOREST = {
  map: 'world-with-antarctica',
  presentation: 'seven-continent-world',
  showTropics: true,
  key: [{ text: 'Tropical rainforest', colour: 'green' }],
  annotations: [
    { kind: 'area', shaded: true, colour: 'green', label: 'Amazon',
      points: [{ lon: -74, lat: 2 }, { lon: -60, lat: 4 }, { lon: -50, lat: -1 }, { lon: -63, lat: -12 }] },
    { kind: 'area', shaded: true, colour: 'green', label: 'Congo',
      points: [{ lon: 9, lat: 3 }, { lon: 20, lat: 4 }, { lon: 28, lat: 1 }, { lon: 15, lat: -6 }] }
  ]
};

test('the world map draws the marks it is given instead of dropping them', () => {
  // It used to ignore `annotations` outright and say nothing, so a rainforest
  // lesson handed this map its rainforests and got a bare world back. That
  // silence is why the lesson had nowhere left to put them.
  const resolved = world.resolve(RAINFOREST);
  assert.equal(resolved.annotations.length, 2);
  const svg = world.tightSvg(RAINFOREST).svg;
  assert.match(svg, />Amazon</);
  assert.match(svg, />Congo</);
});

test('a shaded region is hatched over the real map, not filled solid over it', () => {
  const svg = world.tightSvg(RAINFOREST).svg;
  assert.match(svg, /<pattern id="hatch-0"/, 'each shaded region gets its own hatch');
  assert.match(svg, /fill="url\(#hatch-0\)"/);
  // Hatched rather than solid so the coastline and borders underneath survive.
  assert.match(svg, /fill-opacity="0\.16"/);
});

test('the key names what the shading means, in the same hatch', () => {
  const svg = world.tightSvg(RAINFOREST).svg;
  assert.match(svg, />Tropical rainforest</);
  assert.match(svg, /<pattern id="keyhatch-0"/);
  assert.match(svg, /fill="url\(#keyhatch-0\)"/);
  // The key needs its own band, so the picture grows rather than the map shrinking.
  assert.ok(world.tightSvg(RAINFOREST).h > world.tightSvg({ ...RAINFOREST, key: [] }).h);
});

test('degrees land where those degrees really are', () => {
  // The whole reason to accept degrees. A fraction is a guess about a picture
  // that only a render can check; a degree is a fact about the world, and the
  // conversion against a full equirectangular asset is exact.
  const svg = world.tightSvg({
    map: 'world-with-antarctica', presentation: 'seven-continent-world',
    annotations: [
      { kind: 'point', at: { lon: 0, lat: 0 }, label: 'Origin' },
      { kind: 'point', at: { lon: -180, lat: 90 }, label: 'Top left' }
    ]
  }).svg;
  // 1800 x 900: 0E 0N is the exact centre, 180W 90N the exact top-left corner.
  assert.match(svg, /<circle cx="900\.0" cy="450\.0"/);
  assert.match(svg, /<circle cx="0\.0" cy="0\.0"/);
});

test('degrees are refused on a map whose edges nobody recorded', () => {
  // Every other shipped map is a crop with unknown bounds, so a degree there
  // would be converted against numbers this package does not have. That is worse
  // than a fraction, because it looks precise.
  assert.throws(
    () => maps.resolveAnnotations({
      map: 'south-america',
      annotations: [{ kind: 'point', at: { lon: -60, lat: -3 }, label: 'Manaus' }]
    }),
    /MAP_ANNOTATION_UNSUPPORTED.*world-with-antarctica/s
  );
});

test('half a coordinate is refused rather than read as a fraction', () => {
  assert.throws(
    () => maps.resolveAnnotations({
      map: 'world-with-antarctica',
      annotations: [{ kind: 'point', at: { lon: -60 } }]
    }),
    /MAP_ANNOTATION_INVALID.*both lon and lat/s
  );
});

test('only an area can be shaded', () => {
  assert.throws(
    () => maps.resolveAnnotations({
      map: 'world-with-antarctica',
      annotations: [{ kind: 'line', shaded: true, points: [[0.1, 0.1], [0.2, 0.2]] }]
    }),
    /MAP_ANNOTATION_INVALID.*encloses nothing/s
  );
});

test('a route that cannot fill refuses the shading rather than drawing an outline', () => {
  // The plain slide map draws PowerPoint shapes, which take no hatch. Quietly
  // returning an outline would say "somewhere in here" where the lesson asked
  // for "this whole area is the thing".
  const { drawMap } = require('../src/content/map');
  const pptx = { ShapeType: { roundRect: 'roundRect', ellipse: 'ellipse', line: 'line', custGeom: 'custGeom' } };
  const slide = { addImage() {}, addShape() {}, addText() {} };
  assert.throws(
    () => drawMap(pptx, slide, { x: 0.2, y: 0.6, w: 12, h: 6 }, {
      type: 'map', map: 'world-with-antarctica',
      annotations: [{ kind: 'area', shaded: true, label: 'Amazon', points: [[0.2, 0.5], [0.3, 0.5], [0.3, 0.6]] }]
    }, { slideIndex: 1, mapImages: {} }),
    /MAP_SHADING_UNSUPPORTED.*seven-continent-world/s
  );
});

test('a line can say which way it went', () => {
  // Movement is half of what a primary map is asked to show - where a people
  // came from, which way a river flows, a trade route - and a line without a
  // head draws the path while leaving out the thing being taught.
  const svg = world.tightSvg({
    map: 'world-with-antarctica', presentation: 'seven-continent-world',
    annotations: [
      { kind: 'line', arrow: true, label: 'To Britain', points: [{ lon: 8, lat: 58 }, { lon: -2, lat: 54 }] },
      { kind: 'line', arrow: 'both', colour: 'blue', label: 'Trade', points: [{ lon: -9, lat: 39 }, { lon: -60, lat: 10 }] }
    ]
  }).svg;
  assert.match(svg, /<marker id="head-0"/);
  assert.match(svg, /marker-end="url\(#head-0\)"/);
  assert.match(svg, /<marker id="tail-1"/, 'a two-way link gets a head at each end');
  assert.match(svg, /marker-start="url\(#tail-1\)"/);
});

test('only a line can carry an arrow', () => {
  assert.throws(
    () => maps.resolveAnnotations({
      map: 'world-with-antarctica',
      annotations: [{ kind: 'area', arrow: true, points: [[0.2, 0.5], [0.3, 0.5], [0.3, 0.6]] }]
    }),
    /MAP_ANNOTATION_INVALID.*only a line can carry/s
  );
});

test('a direction that is not a direction is refused by name', () => {
  assert.throws(
    () => maps.resolveAnnotations({
      map: 'world-with-antarctica',
      annotations: [{ kind: 'line', arrow: 'sideways', points: [[0.2, 0.5], [0.3, 0.5]] }]
    }),
    /MAP_ANNOTATION_INVALID.*not a direction/s
  );
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
