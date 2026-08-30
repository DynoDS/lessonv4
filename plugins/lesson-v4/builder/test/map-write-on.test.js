'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const writeOn = require('../../shared/visuals/world-write-on-map-svg');

const FULL_SPEC = {
  map: 'world-with-antarctica',
  worksheetMode: 'continents-and-oceans',
  continentMarkers: [
    { marker: '1', at: [0.208, 0.25] }, { marker: '2', at: [0.333, 0.583] },
    { marker: '3', at: [0.556, 0.222] }, { marker: '4', at: [0.556, 0.472] },
    { marker: '5', at: [0.75, 0.278] }, { marker: '6', at: [0.875, 0.639] },
    { marker: '7', at: [0.50, 0.933] }
  ],
  oceanMarkers: [
    { marker: 'A', at: [0.417, 0.444] },
    { marker: 'B', at: [0.722, 0.611] },
    { marker: 'C', at: [0.069, 0.50], repeatAt: [0.944, 0.50] },
    { marker: 'D', at: [0.50, 0.833] },
    { marker: 'E', at: [0.50, 0.083] }
  ],
  seaInitialSpaces: [[0.55, 0.305], [0.292, 0.41], [0.508, 0.19]],
  showEquator: true,
  showCompass: true,
  joinedEdges: true
};

test('the complete worksheet mode accepts 7 continents and 5 oceans together', () => {
  const resolved = writeOn.resolve(FULL_SPEC);
  assert.equal(resolved.continentMarkers.length, 7);
  assert.equal(resolved.oceanMarkers.length, 5);
  assert.equal(resolved.oceanMarkers.filter((item) => item.repeatAt).length, 1);
});

test('the world asset is a real shipped image with Antarctica ink in its bottom band', async () => {
  const file = path.join(__dirname, '..', 'assets', 'maps', 'world-with-antarctica.png');
  assert.ok(fs.existsSync(file));
  const bytes = fs.readFileSync(file);
  assert.equal(bytes.readUInt32BE(16), 1800);
  assert.equal(bytes.readUInt32BE(20), 900);
  const svg = writeOn.tightSvg(FULL_SPEC).svg;
  assert.match(svg, /data:image\/png;base64,/);
  const requireGlobal = require('../src/require-global');
  const sharp = requireGlobal('sharp');
  const decoded = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true });
  let dark = 0;
  for (let y = 760; y < decoded.info.height; y += 1) {
    for (let x = 0; x < decoded.info.width; x += 1) {
      if (decoded.data[y * decoded.info.width + x] < 220) dark += 1;
    }
  }
  assert.ok(dark > 2500, 'Antarctica coastline/land must be visible in the bottom band');
});

test('all marker and pupil-writing boxes stay inside the real map', () => {
  const layout = writeOn.describeLayout(FULL_SPEC);
  for (const box of layout.markerBoxes.concat(layout.seaBoxes)) {
    assert.ok(box.x >= 0 && box.x + box.w <= layout.w);
    assert.ok(box.y >= 0 && box.y + box.h <= layout.mapH);
  }
});

test('the rendered map carries Equator, compass, repeated Pacific and joined edges', () => {
  const built = writeOn.tightSvg(FULL_SPEC);
  assert.match(built.svg, />Equator</);
  assert.match(built.svg, />N</);
  assert.match(built.svg, /one Pacific Ocean/);
  assert.equal((built.svg.match(/>C<\/text>/g) || []).length, 2);
  assert.equal((built.svg.match(/stroke-dasharray="8 5"/g) || []).length, 3);
});

test('the landscape-A4 drawing has a usable write-on aspect and marker scale', () => {
  const built = writeOn.tightSvg(FULL_SPEC);
  const heightAtLandscapeWidthMm = 261 / built.aspect;
  const markerDiameterMm = (38 / built.w) * 261;
  assert.ok(heightAtLandscapeWidthMm <= 150, 'map plus joined-edge cue must fit the landscape printable height');
  assert.ok(markerDiameterMm >= 5, 'marker circles must remain large enough to read and write around');
});

test('more than the commissioned marker counts is refused instead of shrunk', () => {
  assert.throws(
    () => writeOn.resolve({ ...FULL_SPEC, continentMarkers: FULL_SPEC.continentMarkers.concat({ marker: '8', at: [0.5, 0.5] }) }),
    /at most 7/
  );
});

test('the Pacific repeat is required exactly once', () => {
  assert.throws(
    () => writeOn.resolve({ ...FULL_SPEC, oceanMarkers: FULL_SPEC.oceanMarkers.map((item) => ({ marker: item.marker, at: item.at })) }),
    /exactly one ocean marker/
  );
});
