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

test('a projection is not a source, however real the projection is', () => {
  // The guard used to accept `projection:<name>` from a known set, and a
  // schematic world map passed it by declaring `equirectangular-lonlat` - a
  // genuinely real projection, applied to continent outlines somebody had typed
  // out to look about right. It then drew the opening eight slides of a lesson
  // about where the Amazon is. Narrowing the allowed names could not have caught
  // that, because the name was already correct: a projection says how
  // coordinates are transformed and nothing at all about where they came from.
  // So the prefix is refused outright and the only source is a file on disk.
  const source = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'check-parity.js'), 'utf8');
  assert.doesNotMatch(source, /REAL_PROJECTIONS/, 'an allowlist of projections is not a control');
  assert.match(
    source,
    /startsWith\('projection:'\)\)\s*\{\s*problems\.push/,
    'any projection: depicts must go straight to a problem'
  );
});

test('every primitive is drawn from the lesson data or from a shipped file, and nothing else', () => {
  for (const p of shared.PRIMITIVES) {
    assert.ok(
      p.depicts === 'data' || /^asset:.+/.test(p.depicts),
      `${p.id} has depicts ${JSON.stringify(p.depicts)}; the only sources are 'data' and 'asset:<folder>'`
    );
  }
});

test('no renderer can draw a world map that is not built on a shipped asset', () => {
  // The concrete outcome of the rule above. `map` is the one primitive that
  // depicts real geography, and every surface that shows the world reaches it.
  // A second world map wired in beside it is the failure to catch, whatever it
  // is called: two pictures of the world in one package means a child can be
  // taught from one and tested on the other.
  const geographic = shared.PRIMITIVES.filter((p) => p.depicts === 'asset:maps');
  assert.deepEqual(geographic.map((p) => p.id), ['map']);

  // And it reaches the board, the sheet and the child's book, so no surface has
  // to go looking for a second one.
  const [entry] = geographic;
  assert.equal(entry.slides, 'map');
  assert.equal(entry.worksheets, 'map');
  assert.equal(entry.stickin, 'map');
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

// ── Labels that cannot fit are refused, not stacked ─────────────────────────

// The map from slide 15 of a Year 4 Amazon deck, exactly as the run wrote it:
// the two built-in South America overlays plus the eight countries the basin
// crosses. Ten label pills in all.
const AMAZON_COUNTRIES_SPEC = {
  type: 'map',
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
    { kind: 'point', at: [0.68, 0.18], label: 'French Guiana', colour: 'black' }
  ]
};

function stubSlide() {
  const pptx = { ShapeType: { roundRect: 'roundRect', ellipse: 'ellipse', line: 'line', custGeom: 'custGeom' } };
  const slide = { addImage() {}, addShape() {}, addText() {} };
  return { pptx, slide };
}

function drawAt(zone) {
  const { drawMap } = require('../src/content/map');
  const { pptx, slide } = stubSlide();
  drawMap(pptx, slide, zone, AMAZON_COUNTRIES_SPEC, { slideIndex: 15, mapImages: {} });
}

// Half of a body-sidebar body row - the slot the failing slide actually gave
// this map. South America's tall proportions then fit it about 2.4in wide, and a
// label pill is 0.82 to 1.62in, so ten of them were never going to fit.
const THE_SLOT_IT_HAD = { x: 0.22, y: 1.45, w: 4.34, h: 3.48 };

test('ten labels on the slot this map actually had are refused, not printed on top of each other', () => {
  // What shipped: the same ten pills, each sized to be read from the back of the
  // room, drawn into half a body row where they could not all be placed clear.
  // Nothing errored; the slide simply arrived with the country names piled over
  // the map they were naming, and the map was the point of the slide.
  assert.throws(() => drawAt(THE_SLOT_IT_HAD), /MAP_LABELS_DO_NOT_FIT/);
});

test('the refusal names the labels it could not place and what to do', () => {
  try {
    drawAt(THE_SLOT_IT_HAD);
    assert.fail('expected the crowded map to be refused');
  } catch (error) {
    assert.match(error.message, /French Guiana|Suriname|Guyana/);
    assert.match(error.message, /wider zone|two maps|fewer|Reduce/);
  }
});

test('the identical map given the whole body still draws', () => {
  // The discrimination case, and the reason this is a fit check rather than a
  // lower ceiling on how many marks a map may carry. Nothing is wrong with the
  // ten marks themselves: a ceiling would have failed this slide too, and the
  // lesson would have lost country labels it was right to want. The fault was
  // always the room, so given the room it passes.
  assert.doesNotThrow(() => drawAt({ x: 0.22, y: 0.6, w: 12.89, h: 6.65 }));
});

test('the layout says which labels it could not place, rather than piling them up', () => {
  // The mechanism the two renderers share. Pills this large cannot all sit clear
  // of one another anywhere on the map, so the layout marks the ones it gave up
  // on and the caller refuses instead of drawing them.
  const size = () => ({ w: 0.62, h: 0.30 });
  const items = ['One', 'Two', 'Three', 'Four', 'Five'].map((text) => ({
    text, anchor: [0.5, 0.5], preferred: [0.5, 0.5], colour: '333333'
  }));
  const placed = maps.layoutLabels(items, size);
  assert.ok(placed.some((item) => item.crowded), 'some label had nowhere clear to go');
  assert.throws(() => maps.refuseCrowdedLabels(placed, 'a test map'), /MAP_LABELS_DO_NOT_FIT/);
});

test('a layout that did fit is handed straight back', () => {
  const size = () => ({ w: 0.20, h: 0.06 });
  const placed = maps.layoutLabels(
    [
      { text: 'Manaus', anchor: [0.30, 0.30], preferred: [0.30, 0.30], colour: '333333' },
      { text: 'Belem', anchor: [0.70, 0.60], preferred: [0.70, 0.60], colour: '333333' }
    ],
    size
  );
  assert.equal(maps.refuseCrowdedLabels(placed, 'a test map'), placed);
});

test('the printed sheet draws the same ten marks, because its labels scale with the map', () => {
  // Deliberately not a failure. On paper the label is sized as a fraction of the
  // map image, so the sheet does not inherit the board's problem, and the guard
  // must not invent one: the same spec that is refused in a sidebar prints.
  const built = realMap.tightSvg(
    Object.assign({}, AMAZON_COUNTRIES_SPEC, { selectedCountry: undefined })
  );
  assert.match(built.svg, />French Guiana</);
  assert.match(built.svg, />Amazon rainforest</);
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
