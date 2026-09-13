'use strict';

// The one map every surface places (shared/visuals/map-svg.js). These hold what
// the drawing must guarantee on every surface: the land is the shipped image,
// every mode draws what it was asked for, words print at the surface's readable
// floor, and what cannot fit is refused by name. Each surface's own tests hold
// how it places the drawing.
//
// Ported on 13 September 2026 from the board's map tests (map.test.js,
// map-slide-world.test.js), the sheet's real-map tests and the write-on world
// tests, when those three drawings became this one.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const map = require('../visuals/map-svg');
const maps = require('../visuals/map-annotations');
const pixels = require('../visuals/map-pixels');
const { profileFor, PROFILES } = require('../visuals/surface-profiles');

const BOARD = profileFor('slides', { widthPt: 12 * 72, heightPt: 6.4 * 72 });
const SHEET = profileFor('worksheets', { widthMm: 260 });
const WALL = profileFor('wall', { widthMm: 180 });
const PIECE = profileFor('stickin', { widthMm: 150 });
const texts = (svg) => [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);

const WRITE_ON = {
  map: 'world-with-antarctica',
  worksheetMode: 'continents-and-oceans',
  continentMarkers: [
    { marker: '1', at: [0.208, 0.25] }, { marker: '2', at: [0.333, 0.583] },
    { marker: '3', at: [0.556, 0.222] }, { marker: '4', at: [0.556, 0.472] },
    { marker: '5', at: [0.75, 0.278] }, { marker: '6', at: [0.875, 0.639] },
    { marker: '7', at: [0.50, 0.933] },
  ],
  oceanMarkers: [
    { marker: 'A', at: [0.417, 0.444] },
    { marker: 'B', at: [0.722, 0.611] },
    { marker: 'C', at: [0.069, 0.50], repeatAt: [0.944, 0.50] },
    { marker: 'D', at: [0.50, 0.833] },
    { marker: 'E', at: [0.50, 0.083] },
  ],
  seaInitialSpaces: [[0.55, 0.305], [0.292, 0.41], [0.508, 0.19]],
  showEquator: true,
  showCompass: true,
  joinedEdges: true,
};

const LABELLED = {
  map: 'world-with-antarctica',
  presentation: 'seven-continent-world',
  continentLabels: [
    { text: 'North America', at: [0.208, 0.25] }, { text: 'South America', at: [0.333, 0.583] },
    { text: 'Europe', at: [0.556, 0.222] }, { text: 'Africa', at: [0.556, 0.472] },
    { text: 'Asia', at: [0.75, 0.278] }, { text: 'Australia', at: [0.875, 0.639] },
    { text: 'Antarctica', at: [0.50, 0.933] },
  ],
  oceanLabels: [
    { text: 'Atlantic Ocean', at: [0.417, 0.444] },
    { text: 'Indian Ocean', at: [0.722, 0.611] },
    { text: 'Pacific Ocean', at: [0.069, 0.50], repeatAt: [0.944, 0.50] },
    { text: 'Southern Ocean', at: [0.50, 0.833] },
    { text: 'Arctic Ocean', at: [0.50, 0.083] },
  ],
  seaLabels: [
    { text: 'Mediterranean Sea', at: [0.55, 0.305], labelAt: [0.58, 0.35] },
    { text: 'Caribbean Sea', at: [0.292, 0.41], labelAt: [0.25, 0.45] },
    { text: 'North Sea', at: [0.508, 0.19], labelAt: [0.48, 0.14] },
  ],
  showEquator: true,
  showCompass: true,
  joinedEdges: true,
};

const RAINFOREST = {
  map: 'world-with-antarctica',
  presentation: 'seven-continent-world',
  showTropics: true,
  key: [{ text: 'Tropical rainforest', colour: 'green' }],
  annotations: [
    { kind: 'area', shaded: true, colour: 'green', label: 'Amazon',
      points: [{ lon: -74, lat: 2 }, { lon: -60, lat: 4 }, { lon: -50, lat: -1 }, { lon: -63, lat: -12 }] },
    { kind: 'area', shaded: true, colour: 'green', label: 'Congo',
      points: [{ lon: 9, lat: 3 }, { lon: 20, lat: 4 }, { lon: 28, lat: 1 }, { lon: 15, lat: -6 }] },
  ],
};

// ── One drawing, every surface ──────────────────────────────────────────────

test('every mode draws on every surface from the shipped image', () => {
  const specs = [
    { map: 'south-america', annotations: [{ kind: 'point', at: [0.62, 0.34], label: 'Manaus' }] },
    RAINFOREST,
    WRITE_ON,
    { map: 'world', presentation: 'globe-to-flat' },
  ];
  for (const spec of specs) {
    for (const surface of Object.keys(PROFILES)) {
      // The write-on form's example spaces sit close to marker 3, which the
      // board's 18pt markers cover; the board is tested refusing it below.
      if (spec === WRITE_ON && surface === 'slides') continue;
      const box = surface === 'slides' ? { widthPt: 12.69 * 72, heightPt: 6.65 * 72 } : { widthMm: surface === 'wall' ? 360 : 200 };
      const out = map.tightSvg(spec, profileFor(surface, box));
      assert.match(out.svg, /data:image\/png;base64,/, `${surface} draws the land from the asset`);
      assert.ok(out.w > 0 && out.h > 0 && Math.abs(out.aspect - out.w / out.h) < 1e-9);
      assert.ok(out.w <= box.widthPt + 0.01 || box.widthMm, 'the drawing stays inside its width');
    }
  }
});

test('words over the map print at each surface\'s readable floor, and never under it', () => {
  for (const [name, profile] of [['board', BOARD], ['sheet', SHEET], ['wall', profileFor('wall', { widthMm: 300 })]]) {
    const out = map.tightSvg({ map: 'south-america', annotations: [{ kind: 'point', at: [0.62, 0.34], label: 'Manaus' }] }, profile);
    const sizes = [...out.svg.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1]));
    assert.ok(sizes.length, name);
    assert.ok(sizes.every((s) => s >= profile.minFontPt - 1e-9), `${name}: ${sizes.join(', ')}`);
  }
});

test('the stick-in piece stays in ink, and a key that needs colour is refused there', () => {
  const piece = map.tightSvg(WRITE_ON, PIECE).svg;
  assert.ok(!/#C65911|#0070C0|#2E7D45/.test(piece), 'the photocopied piece has no house colour marks');
  assert.throws(
    () => map.tightSvg({ ...RAINFOREST, key: [{ text: 'Rainforest', colour: 'green' }, { text: 'Desert', colour: 'orange' }] }, PIECE),
    /MAP_KEY_NEEDS_COLOUR/
  );
});

test('a requested height is honoured, and the map gives up width rather than words', () => {
  const tall = map.tightSvg({ map: 'world', heightMm: 60 }, SHEET);
  assert.ok(Math.abs(tall.h - 60 * 72 / 25.4) < 0.5, `printed ${tall.h}pt tall`);
  assert.ok(tall.w < SHEET.widthPt);
  assert.ok(Math.abs(tall.w / tall.h - maps.MAPS.world.w / maps.MAPS.world.h) < 0.01, 'the map keeps its true proportions');
});

// ── The marked map ──────────────────────────────────────────────────────────

test('the marked map draws the marks it was given, and the basin, on every surface', () => {
  const spec = {
    map: 'south-america',
    basin: 'Amazon basin',
    labels: { basin: 'Amazon basin' },
    annotations: [
      { kind: 'point', at: [0.62, 0.34], label: 'Manaus', colour: 'blue' },
      { kind: 'line', points: [[0.30, 0.29], [0.80, 0.325]], label: 'Amazon River', colour: 'blue' },
    ],
  };
  for (const profile of [BOARD, SHEET, PIECE]) {
    const svg = map.tightSvg(spec, profile).svg;
    assert.match(svg, /<circle /);
    assert.ok((svg.match(/<polyline /g) || []).length >= 2, 'basin outline with its halo');
    assert.deepEqual(texts(svg).sort(), ['Amazon River', 'Amazon basin', 'Manaus']);
  }
});

test('Brazil is filled inside its own printed border, now on paper too', () => {
  // It was refused on paper because the fill ran through the board's image
  // library. The fill is made from the shipped pixels here, for every surface.
  const svg = map.tightSvg({ map: 'south-america', selectedCountry: 'Brazil' }, SHEET).svg;
  const original = fs.readFileSync(maps.assetPathFor('south-america')).toString('base64');
  assert.ok(!svg.includes(original), 'the filled picture replaces the plain one');
  const png = pixels.filledRegionPng(maps.assetPathFor('south-america'), maps.BRAZIL_SEED_SOUTH_AMERICA, { r: 189, g: 220, b: 235 });
  const decoded = pixels.decodePng(png);
  const at = (maps.BRAZIL_SEED_SOUTH_AMERICA.y * decoded.width + maps.BRAZIL_SEED_SOUTH_AMERICA.x) * 4;
  assert.deepEqual([...decoded.data.subarray(at, at + 3)], [189, 220, 235]);
  assert.ok(!texts(svg).includes('Brazil'), 'shading a country does not print its name');
});

test('an overlay the map has no shape for is refused rather than silently dropped', () => {
  assert.throws(() => map.resolve({ map: 'south america', selectedCountry: 'Peru' }), /MAP_OVERLAY_UNSUPPORTED/);
  assert.throws(() => map.resolve({ map: 'south america', basin: 'Congo basin' }), /MAP_OVERLAY_UNSUPPORTED/);
  assert.throws(() => map.resolve({ map: 'africa', selectedCountry: 'Brazil' }), /MAP_OVERLAY_UNSUPPORTED.*south-america/s);
});

test('harmless spellings of one map name resolve identically', () => {
  for (const spelling of ['south america', 'south_america', 'South-America']) {
    assert.equal(map.resolve({ map: spelling }).key, 'south-america');
  }
});

test('an unknown map names the maps that do exist', () => {
  assert.throws(() => map.tightSvg({ map: 'narnia' }, SHEET), /MAP_UNKNOWN.*south-america/s);
});

test('a shaded region is a soft translucent wash over the real map, not a hatch or a solid', () => {
  const svg = map.tightSvg(RAINFOREST, BOARD).svg;
  assert.match(svg, /fill-opacity="0\.30"/);
  assert.doesNotMatch(svg, /stroke-opacity="0\.85"/);
  // Shading now works on the plain map too: it used to be refused there because
  // PowerPoint shapes cannot fill.
  const plain = map.tightSvg({ map: 'world-with-antarctica', annotations: RAINFOREST.annotations }, BOARD).svg;
  assert.match(plain, /fill-opacity="0\.30"/);
});

test('a line can say which way it went', () => {
  const svg = map.tightSvg({
    map: 'world-with-antarctica', presentation: 'seven-continent-world',
    annotations: [
      { kind: 'line', arrow: true, label: 'To Britain', points: [{ lon: 8, lat: 58 }, { lon: -2, lat: 54 }] },
      { kind: 'line', arrow: 'both', colour: 'blue', label: 'Trade', points: [{ lon: -9, lat: 39 }, { lon: -60, lat: 10 }] },
    ],
  }, BOARD).svg;
  assert.match(svg, /<marker id="map\w+-head-0"/);
  assert.match(svg, /marker-end="url\(#map\w+-head-0\)"/);
  assert.match(svg, /marker-start="url\(#map\w+-tail-1\)"/, 'a two-way link gets a head at each end');
});

test('two maps on one page do not share their fills and arrowheads', () => {
  // A sheet inlines every drawing into one document, so an id used twice would
  // colour the second map's river with the first map's arrowhead.
  const a = map.tightSvg({ map: 'world', annotations: [{ kind: 'line', arrow: true, points: [[0.1, 0.1], [0.2, 0.2]] }] }, SHEET).svg;
  const b = map.tightSvg({ map: 'world', annotations: [{ kind: 'line', arrow: true, colour: 'blue', points: [[0.1, 0.1], [0.2, 0.2]] }] }, SHEET).svg;
  const ids = (svg) => [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(ids(a).length && ids(a).every((id) => !ids(b).includes(id)));
});

test('degrees land where those degrees really are', () => {
  const out = map.tightSvg({
    map: 'world-with-antarctica', presentation: 'seven-continent-world', showCompass: false,
    annotations: [{ kind: 'point', at: { lon: 0, lat: 0 } }, { kind: 'point', at: { lon: -90, lat: 45 } }],
  }, SHEET);
  const m = out.layout.map;
  const dots = [...out.svg.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)"/g)].map((d) => [Number(d[1]), Number(d[2])]);
  assert.ok(Math.abs(dots[0][0] - (m.x + m.w / 2)) < 0.02 && Math.abs(dots[0][1] - (m.y + m.h / 2)) < 0.02);
  assert.ok(Math.abs(dots[1][0] - (m.x + m.w / 4)) < 0.02 && Math.abs(dots[1][1] - (m.y + m.h / 4)) < 0.02);
});

// ── Labels are laid out, and refused when they cannot fit ────────────────────

const AMAZON_COUNTRIES_SPEC = {
  map: 'south-america',
  selectedCountry: 'Brazil',
  basin: 'Amazon basin',
  labels: { country: 'Brazil', basin: 'Amazon rainforest' },
  annotations: [
    { kind: 'point', at: [0.29, 0.42], label: 'Peru', colour: 'black' },
    { kind: 'point', at: [0.31, 0.20], label: 'Colombia', colour: 'black' },
    { kind: 'point', at: [0.40, 0.55], label: 'Bolivia', colour: 'black' },
    { kind: 'point', at: [0.47, 0.12], label: 'Venezuela', colour: 'black' },
    { kind: 'point', at: [0.59, 0.15], label: 'Guyana', colour: 'black' },
    { kind: 'point', at: [0.63, 0.17], label: 'Suriname', colour: 'black' },
    { kind: 'point', at: [0.25, 0.28], label: 'Ecuador', colour: 'black' },
    { kind: 'point', at: [0.68, 0.18], label: 'French Guiana', colour: 'black' },
  ],
};

test('ten labels in the slot this map actually had are refused by name, not piled up', () => {
  // Half of a body-sidebar body row, the slot a Year 4 Amazon deck gave this map.
  const slot = profileFor('slides', { widthPt: 4.14 * 72, heightPt: 3.28 * 72 });
  assert.throws(() => map.tightSvg(AMAZON_COUNTRIES_SPEC, slot), (error) => {
    assert.match(error.message, /MAP_LABELS_DO_NOT_FIT/);
    assert.match(error.message, /French Guiana|Suriname|Guyana|Venezuela|Colombia/);
    assert.match(error.message, /wider zone|two maps|Reduce/);
    return true;
  });
});

test('the identical map given the whole body still draws', () => {
  const body = profileFor('slides', { widthPt: 12.69 * 72, heightPt: 6.45 * 72 });
  const out = map.tightSvg(AMAZON_COUNTRIES_SPEC, body);
  assert.equal(out.layout.labels.length, 10);
});

test('every label sits inside the map and clear of every other label and marker', () => {
  const out = map.tightSvg({ ...LABELLED, clueMarkers: [{ marker: 'Z', kind: 'sea', at: [0.3, 0.8] }] }, BOARD);
  const L = out.layout;
  const boxes = L.labels.map((l) => l.box);
  boxes.forEach((b, i) => {
    assert.ok(b.x >= -1e-9 && b.y >= -1e-9 && b.x + b.w <= 1 + 1e-9 && b.y + b.h <= 1 + 1e-9, L.labels[i].text);
    boxes.slice(i + 1).forEach((o, j) => {
      const hit = b.x < o.x + o.w && o.x < b.x + b.w && b.y < o.y + o.h && o.y < b.y + b.h;
      assert.ok(!hit, `${L.labels[i].text} overlaps ${L.labels[i + j + 1].text}`);
    });
  });
});

// ── The labelled world ──────────────────────────────────────────────────────

test('the labelled world keeps Antarctica, the Southern Ocean, Equator, compass and joined edges', () => {
  const svg = map.tightSvg(LABELLED, BOARD).svg;
  const words = texts(svg);
  for (const w of ['Antarctica', 'Southern Ocean', 'Equator', 'N']) assert.ok(words.includes(w), w);
  assert.equal(words.filter((w) => w === 'Pacific Ocean').length, 2);
  assert.ok(words.join(' ').includes('one Pacific'));
});

test('a name label on a clue marker\'s spot replaces the letter instead of covering it', () => {
  const words = texts(map.tightSvg({
    map: 'world-with-antarctica', presentation: 'seven-continent-world',
    clueMarkers: [
      { marker: 'A', kind: 'continent', at: [0.333, 0.583] },
      { marker: 'B', kind: 'continent', at: [0.556, 0.472] },
    ],
    continentLabels: [{ text: 'South America', at: [0.333, 0.583] }],
  }, BOARD).svg);
  assert.ok(!words.includes('A'));
  assert.ok(words.includes('B'));
  assert.ok(words.includes('South America'));
});

test('the Tropics are drawn where those latitudes really are on the real asset', () => {
  const out = map.tightSvg({ map: 'world-with-antarctica', presentation: 'seven-continent-world', showTropics: true }, SHEET);
  const m = out.layout.map;
  const ys = [...out.svg.matchAll(/<line x1="[\d.]+" y1="([\d.]+)" x2="[\d.]+" y2="\1" stroke="#C65911"/g)].map((l) => Number(l[1])).sort((a, b) => a - b);
  const expect = [23.5, 0, -23.5].map((lat) => m.y + ((90 - lat) / 180) * m.h);
  assert.equal(ys.length, 3);
  ys.forEach((y, i) => assert.ok(Math.abs(y - expect[i]) < 0.02, `${y} against ${expect[i]}`));
  const words = texts(out.svg);
  assert.ok(words.includes('Tropic of Cancer') && words.includes('Tropic of Capricorn') && words.includes('Equator'));
});

test('the world map draws the marks it is given, with a key in its own band', () => {
  const resolved = map.resolve(RAINFOREST);
  assert.equal(resolved.annotations.length, 2);
  const keyed = map.tightSvg(RAINFOREST, SHEET);
  const bare = map.tightSvg({ ...RAINFOREST, key: [] }, SHEET);
  assert.ok(texts(keyed.svg).includes('Tropical rainforest'));
  assert.ok(texts(keyed.svg).includes('Amazon') && texts(keyed.svg).includes('Congo'));
  assert.ok(keyed.h > bare.h, 'the key adds a band rather than shrinking the map');
  assert.equal(keyed.layout.map.w, bare.layout.map.w);
});

test('a sea focus is a crop of the same embedded real map', () => {
  const svg = map.tightSvg({
    map: 'world-with-antarctica', presentation: 'seven-continent-world',
    focus: { centre: [0.508, 0.19], span: [0.12, 0.12], title: 'Where is the North Sea?' },
    seaLabels: [{ text: 'North Sea', at: [0.508, 0.19], labelAt: [0.48, 0.14] }],
  }, BOARD).svg;
  assert.match(texts(svg).join(' '), /Where is the\s+North Sea\?|Where is the North\s+Sea\?/);
  assert.match(svg, /<svg x="[\d.]+" y="[\d.]+" width="[\d.]+" height="[\d.]+" viewBox="[\d.]+ [\d.]+ [\d.]+ [\d.]+"/);
  const uris = svg.match(/data:image\/png;base64,[A-Za-z0-9+/=]{40}/g);
  assert.equal(uris.length, 2, 'overview and zoom embed the same asset');
  assert.equal(uris[0], uris[1]);
});

test('oversized label and clue sets are refused instead of shrinking unreadably', () => {
  assert.throws(
    () => map.resolve({ ...LABELLED, continentLabels: LABELLED.continentLabels.concat({ text: 'Extra', at: [0.5, 0.5] }) }),
    /at most 7/
  );
  assert.throws(
    () => map.resolve({ map: 'world-with-antarctica', presentation: 'seven-continent-world', clueMarkers: Array.from({ length: 13 }, (_, i) => ({ marker: String(i), at: [0.5, 0.5] })) }),
    /at most 12/
  );
  assert.throws(() => map.resolve({ map: 'world', presentation: 'seven-continent-world' }), /SEVEN_CONTINENT_MAP_INVALID.*world-with-antarctica/s);
});

// ── The write-on world ──────────────────────────────────────────────────────

test('the write-on form accepts 7 continents and 5 oceans, and names no place', () => {
  const resolved = map.resolve(WRITE_ON);
  assert.equal(resolved.writeOnMarkers.length, 12);
  const out = map.tightSvg({ ...WRITE_ON, presentation: 'seven-continent-world', continentLabels: LABELLED.continentLabels }, PIECE);
  const words = texts(out.svg);
  assert.ok(!words.includes('Africa'), 'a labelled map copied in still prints as the child\'s task');
  assert.equal(words.filter((w) => w === 'C').length, 2, 'the Pacific marker at both edges');
  assert.ok(words.includes('Equator') && words.includes('N'));
  assert.equal(out.layout.seaBoxes.length, 3);
});

test('every marker and write-on box stays inside the real map, big enough to write beside', () => {
  const out = map.tightSvg(WRITE_ON, SHEET);
  const m = out.layout.map;
  for (const mk of out.layout.markers) {
    assert.ok(mk.cx - mk.r >= m.x - 1e-6 && mk.cx + mk.r <= m.x + m.w + 1e-6);
    assert.ok(mk.r * 2 >= 5 * 72 / 25.4, 'a marker at least 5mm across');
  }
  for (const b of out.layout.seaBoxes) {
    assert.ok(b.x >= m.x && b.x + b.w <= m.x + m.w && b.y >= m.y && b.y + b.h <= m.y + m.h);
  }
});

test('more than the commissioned markers is refused, and the Pacific repeat is required once', () => {
  assert.throws(
    () => map.resolve({ ...WRITE_ON, continentMarkers: WRITE_ON.continentMarkers.concat({ marker: '8', at: [0.5, 0.5] }) }),
    /at most 7/
  );
  assert.throws(
    () => map.resolve({ ...WRITE_ON, oceanMarkers: WRITE_ON.oceanMarkers.map((item) => ({ marker: item.marker, at: item.at })) }),
    /exactly one ocean marker/
  );
});

test('markers printed on top of each other are refused by name, never nudged', () => {
  const clash = { ...WRITE_ON, seaInitialSpaces: [[0.556, 0.222], [0.292, 0.41], [0.508, 0.19]] };
  assert.throws(() => map.tightSvg(clash, SHEET), /MAP_MARKERS_OVERLAP.*marker 3 and sea space 1/s);});

// ── Globe to flat ───────────────────────────────────────────────────────────

test('globe-to-flat defaults to the complete sequence and one Pacific note', () => {
  const s = map.resolve({ map: 'world', presentation: 'globe to flat' });
  assert.equal(s.revealStage, 3);
  assert.equal(s.suppressSecondPacific, true);
  assert.match(s.notes.cut, /Pacific/);
  const words = texts(map.tightSvg({ map: 'world', presentation: 'globe-to-flat' }, BOARD).svg).join(' ');
  for (const title of ['1. Begin with', '2. Cut through', '3. Open and']) assert.ok(words.includes(title), title);
  assert.ok(words.includes('one Pacific'));
});

test('each stage draws only what it has revealed, from the shipped pixels', () => {
  const stage = (n) => map.tightSvg({ map: 'world', presentation: 'globe-to-flat', revealStage: n }, BOARD).svg;
  assert.equal((stage(1).match(/data:image\/png;base64/g) || []).length, 1);
  assert.equal((stage(2).match(/data:image\/png;base64/g) || []).length, 2);
  assert.equal((stage(3).match(/data:image\/png;base64/g) || []).length, 3);
  assert.notEqual(map.cacheKey({ map: 'world', presentation: 'globe-to-flat', revealStage: 1 }, BOARD), map.cacheKey({ map: 'world', presentation: 'globe-to-flat', revealStage: 2 }, BOARD));
});

test('the explicit two-edge-label option prints the Pacific at both edges instead of the join note', () => {
  const words = texts(map.tightSvg({ map: 'world', presentation: 'globe-to-flat', suppressSecondPacific: false }, BOARD).svg);
  assert.ok(!words.join(' ').includes('one Pacific'));
  assert.equal(words.filter((w) => w === 'Pacific Ocean').length, 2);
});

test('the transformation refuses a non-world asset, mixed overlays and a note that cannot fit', () => {
  assert.throws(() => map.resolve({ map: 'europe', presentation: 'globe-to-flat' }), /MAP_TRANSFORMATION_UNSUPPORTED/);
  assert.throws(() => map.resolve({ map: 'world', presentation: 'globe-to-flat', annotations: [{ kind: 'point' }] }), /MAP_TRANSFORMATION_UNSUPPORTED/);
  assert.throws(() => map.resolve({ map: 'world', presentation: 'globe-to-flat', notes: { cut: 'x'.repeat(111) } }), /110 characters/);
  const long = 'Choose one careful and very deliberate cut straight down through the widest part of the Pacific Ocean today.';
  assert.throws(
    () => map.tightSvg({ map: 'world', presentation: 'globe-to-flat', notes: { cut: long } }, profileFor('worksheets', { widthMm: 80 })),
    /MAP_TRANSFORMATION_INVALID/
  );
});

test('an unknown presentation is refused by name', () => {
  assert.throws(() => map.resolve({ map: 'world', presentation: 'spinning' }), /MAP_PRESENTATION_UNSUPPORTED/);
});

test('orthographic projection samples the supplied equirectangular pixels', () => {
  const raw = Buffer.from([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255]);
  const projected = pixels.projectEquirectangularToOrthographic(raw, { width: 2, height: 2, channels: 4 }, 0, 20);
  assert.equal(projected.info.width, 20);
  assert.ok(projected.data.some((value, index) => index % 4 === 3 && value === 255));
});

test('the PNG reader reads every shipped map the way the image library does', () => {
  for (const key of ['world', 'south-america', 'world-with-antarctica']) {
    const entry = maps.MAPS[key];
    const decoded = pixels.decodePng(fs.readFileSync(path.join(maps.ASSET_DIR, entry.file)));
    assert.equal(decoded.width, entry.w);
    assert.equal(decoded.height, entry.h);
    const round = pixels.decodePng(pixels.encodePng(decoded));
    assert.ok(round.data.equals(decoded.data), `${key} survives a write and a read`);
  }
});
