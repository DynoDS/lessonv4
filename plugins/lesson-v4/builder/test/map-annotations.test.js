'use strict';

// The map is the one helper whose correctness is a fact about the world rather
// than a fact about the lesson's data. A bar chart drawn from the wrong numbers
// looks wrong; a coastline drawn from the wrong numbers looks completely
// convincing and teaches a child a world that is not there. These tests hold
// the two halves of the rule that follows from that: the land always comes from
// the real shipped image, and everything a lesson adds is a mark placed on top
// of it, refused by name when it is not placeable.

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

const shared = require('../../shared/visual-parity');
const maps = require('../../shared/visuals/map-annotations');
const realMap = require('../../shared/visuals/real-map-svg');

// ── The base is real ────────────────────────────────────────────────────────

test('every registered map names a file that exists, at the size recorded for it', () => {
  for (const [key, entry] of Object.entries(maps.MAPS)) {
    const file = path.join(maps.ASSET_DIR, entry.file);
    assert.ok(fs.existsSync(file), `${key} names ${entry.file}, which is not in builder/assets/maps`);

    // The dimensions are recorded here rather than read at render time, so they
    // can drift from the file. Everything positioned in fractions of the map
    // depends on them, so a drift moves every mark on every surface.
    const bytes = fs.readFileSync(file);
    let width;
    let height;
    if (entry.file.toLowerCase().endsWith('.png')) {
      width = bytes.readUInt32BE(16);
      height = bytes.readUInt32BE(20);
    } else {
      let i = 2;
      while (i < bytes.length) {
        if (bytes[i] !== 0xff) { i += 1; continue; }
        const marker = bytes[i + 1];
        const length = bytes.readUInt16BE(i + 2);
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          height = bytes.readUInt16BE(i + 5);
          width = bytes.readUInt16BE(i + 7);
          break;
        }
        i += 2 + length;
      }
    }
    assert.equal(width, entry.w, `${key} width recorded as ${entry.w}, file is ${width}`);
    assert.equal(height, entry.h, `${key} height recorded as ${entry.h}, file is ${height}`);
  }
});

test('every shipped map file is reachable by name', () => {
  // An asset nobody can ask for is invisible in exactly the way an unregistered
  // helper is, and the designer's fallback is to ask for a generated picture of
  // something the package already holds correctly.
  const shipped = fs.readdirSync(maps.ASSET_DIR).filter((f) => /\.(png|jpe?g)$/i.test(f));
  const registered = new Set(Object.values(maps.MAPS).map((m) => m.file));
  for (const file of shipped) {
    assert.ok(registered.has(file), `${file} ships but no map name reaches it`);
  }
});

test('the map primitive declares that it draws from the real asset folder', () => {
  const entry = shared.PRIMITIVES.find((p) => p.id === 'map');
  assert.equal(entry.depicts, 'asset:maps');
});

test('a made-up projection name does not pass as a real source', () => {
  // Tested for real: while this change was being made, another run met the new
  // guard and satisfied it with depicts: 'projection:amazon-location-teaching-schematic'
  // on a hand-drawn map. An escape hatch that accepts any string after the colon
  // is not a control, so the projection has to be one the package actually draws
  // from.
  const source = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'check-parity.js'), 'utf8');
  assert.match(source, /REAL_PROJECTIONS/);
  assert.match(source, /equirectangular-lonlat/);
  assert.doesNotMatch(
    source,
    /depicts\.startsWith\('projection:'\) && depicts\.length/,
    'the projection prefix must be checked against a known set, not merely be non-empty'
  );
});

test('every primitive says where its picture is drawn from', () => {
  for (const p of shared.PRIMITIVES) {
    assert.ok(
      p.depicts === 'data' || /^asset:.+/.test(p.depicts) || /^projection:.+/.test(p.depicts),
      `${p.id} has depicts ${JSON.stringify(p.depicts)}`
    );
  }
});

// ── Marks on top of it ──────────────────────────────────────────────────────

test('a mark is placed in fractions of the real map', () => {
  const [mark] = maps.resolveAnnotations({
    map: 'south-america',
    annotations: [{ kind: 'point', at: [0.62, 0.34], label: 'Manaus', colour: 'blue' }]
  });
  assert.deepEqual(mark.at, [0.62, 0.34]);
  assert.equal(mark.colour, maps.COLOURS.blue);
});

test('a kind the engine cannot draw is refused by name', () => {
  assert.throws(
    () => maps.resolveAnnotations({ map: 'world', annotations: [{ kind: 'shading', at: [0.5, 0.5] }] }),
    /MAP_ANNOTATION_UNSUPPORTED/
  );
});

test('a mark outside the map is refused rather than clamped onto the edge', () => {
  // Clamping would put the mark somewhere real and wrong, which is the failure
  // mode this whole helper exists to avoid.
  assert.throws(
    () => maps.resolveAnnotations({ map: 'world', annotations: [{ kind: 'point', at: [1.4, 0.5] }] }),
    /MAP_ANNOTATION_INVALID/
  );
});

test('an area needs enough points to be an area', () => {
  assert.throws(
    () => maps.resolveAnnotations({ map: 'world', annotations: [{ kind: 'area', points: [[0.1, 0.1], [0.2, 0.2]] }] }),
    /MAP_ANNOTATION_INVALID/
  );
});

test('a colour outside the house scheme is refused', () => {
  assert.throws(
    () => maps.resolveAnnotations({ map: 'world', annotations: [{ kind: 'point', at: [0.5, 0.5], colour: 'hotpink' }] }),
    /MAP_ANNOTATION_INVALID/
  );
});

test('more marks than a map can carry is refused, not shrunk', () => {
  const many = Array.from({ length: maps.MAX_ANNOTATIONS + 1 }, (_, i) => ({
    kind: 'point', at: [0.1 + i * 0.05, 0.5], label: 'P' + i
  }));
  assert.throws(
    () => maps.resolveAnnotations({ map: 'world', annotations: many }),
    /MAP_ANNOTATION_INVALID/
  );
});

test('marks cannot be asked for on a map that does not exist', () => {
  assert.throws(
    () => maps.resolveAnnotations({ map: 'atlantis', annotations: [{ kind: 'point', at: [0.5, 0.5] }] }),
    /MAP_ANNOTATION_INVALID/
  );
});

// ── Labels are laid out, not stacked ────────────────────────────────────────

test('labels near the same place do not print on top of each other', () => {
  // Three marks within a few percent of one another. Placed where each asked to
  // go, the pills would overlap and the only readable one would be the last
  // drawn - which is what a real Amazon lesson produced.
  const size = () => ({ w: 0.30, h: 0.06 });
  const placed = maps.layoutLabels(
    [
      { text: 'Amazon basin', anchor: [0.45, 0.25], preferred: [0.45, 0.25], colour: '000000' },
      { text: 'Amazon River', anchor: [0.47, 0.26], preferred: [0.47, 0.26], colour: '000000' },
      { text: 'Manaus', anchor: [0.46, 0.27], preferred: [0.46, 0.27], colour: '000000' }
    ],
    size
  );
  assert.equal(placed.length, 3);
  for (let i = 0; i < placed.length; i += 1) {
    for (let j = i + 1; j < placed.length; j += 1) {
      const a = placed[i].box;
      const b = placed[j].box;
      const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      assert.ok(!overlap, `${placed[i].text} overlaps ${placed[j].text}`);
    }
  }
});

test('a label pushed away from its mark comes back with a leader line', () => {
  const size = () => ({ w: 0.30, h: 0.06 });
  const placed = maps.layoutLabels(
    [
      { text: 'First', anchor: [0.45, 0.25], preferred: [0.45, 0.25], colour: '000000' },
      { text: 'Second', anchor: [0.45, 0.25], preferred: [0.45, 0.25], colour: '000000' }
    ],
    size
  );
  assert.equal(placed[0].leader, null);
  assert.ok(placed[1].leader, 'the displaced label should point back at its mark');
  assert.deepEqual(placed[1].leader[0], [0.45, 0.25]);
});

test('every label stays inside the picture', () => {
  const size = () => ({ w: 0.40, h: 0.10 });
  const placed = maps.layoutLabels(
    [
      { text: 'Top left', anchor: [0.01, 0.01], preferred: [0.01, 0.01], colour: '000000' },
      { text: 'Bottom right', anchor: [0.99, 0.99], preferred: [0.99, 0.99], colour: '000000' }
    ],
    size
  );
  for (const item of placed) {
    assert.ok(item.box.x >= 0 && item.box.x + item.box.w <= 1.0001, `${item.text} runs off the side`);
    assert.ok(item.box.y >= 0 && item.box.y + item.box.h <= 1.0001, `${item.text} runs off the top or bottom`);
  }
});

test('a region label sits clear of the region it names', () => {
  const [area] = maps.resolveAnnotations({
    map: 'world',
    annotations: [{ kind: 'area', points: [[0.30, 0.40], [0.40, 0.40], [0.40, 0.55], [0.30, 0.55]], label: 'Amazon rainforest' }]
  });
  // A pill dropped on the centroid covers the very shape a child is looking for.
  assert.ok(area.labelAt[1] < 0.40, 'the label should sit above the region, not across it');
  assert.deepEqual(area.anchor.map((n) => Number(n.toFixed(3))), [0.35, 0.475]);
});

// ── The printed sheet draws the same real map ───────────────────────────────

test('the printed map embeds the real image and keeps its real proportions', () => {
  const built = realMap.tightSvg({ map: 'south-america' });
  assert.match(built.svg, /data:image\/png;base64,/);
  assert.equal(built.w, maps.MAPS['south-america'].w);
  assert.equal(built.h, maps.MAPS['south-america'].h);
  assert.equal(built.aspect, maps.MAPS['south-america'].w / maps.MAPS['south-america'].h);
});

test('the printed map draws the marks it was given', () => {
  const built = realMap.tightSvg({
    map: 'south-america',
    basin: 'Amazon basin',
    labels: { basin: 'Amazon basin' },
    annotations: [
      { kind: 'point', at: [0.62, 0.34], label: 'Manaus', colour: 'blue' },
      { kind: 'line', points: [[0.30, 0.29], [0.80, 0.325]], label: 'Amazon River', colour: 'blue' }
    ]
  });
  assert.match(built.svg, /<circle /);
  assert.ok((built.svg.match(/<polyline /g) || []).length >= 4, 'basin outline and river, each with its halo');
  assert.match(built.svg, />Manaus</);
  assert.match(built.svg, />Amazon River</);
  assert.match(built.svg, />Amazon basin</);
});

test('country shading is refused on paper with the route that does work', () => {
  assert.throws(
    () => realMap.tightSvg({ map: 'south-america', selectedCountry: 'Brazil' }),
    /MAP_OVERLAY_UNSUPPORTED.*point annotation/s
  );
});

test('an unknown map on paper names the maps that do exist', () => {
  assert.throws(() => realMap.tightSvg({ map: 'narnia' }), /MAP_UNKNOWN/);
});
