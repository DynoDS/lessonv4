'use strict';

// The measuring scales and the thinking diagrams every surface places
// (13 September 2026). These hold what each drawing must guarantee wherever it
// is drawn; each surface's own tests hold how it places it.

const test = require('node:test');
const assert = require('node:assert/strict');
const { profileFor, PROFILES, MM_TO_PT } = require('../visuals/surface-profiles');
const ruler = require('../visuals/ruler-svg');
const dial = require('../visuals/dial-scale-svg');
const jug = require('../visuals/measuring-jug-svg');
const network = require('../visuals/number-network-svg');
const continuum = require('../visuals/continuum-line-svg');
const chain = require('../visuals/process-chain-svg');
const key = require('../visuals/classification-key-svg');
const concept = require('../visuals/concept-map-svg');
const fishbone = require('../visuals/fishbone-svg');
const pathway = require('../visuals/source-pathway-svg');

const BOARD = () => profileFor('slides', { widthPt: 12.4 * 72, heightPt: 5.3 * 72 });
const SHEET = () => profileFor('worksheets', { widthMm: 170 });
const texts = (svg) => [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);

function inside(out) {
  for (const r of out.svg.matchAll(/<rect[^>]* x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)) {
    const [x, y, w, h] = r.slice(1).map(Number);
    assert.ok(x >= -0.5 && y >= -0.5 && x + w <= out.w + 0.5 && y + h <= out.h + 0.5, `a box at ${x},${y} leaves the drawing`);
  }
}

test('every drawing lays out on every surface, inside itself, at or above that surface floor', () => {
  const specs = [
    [ruler, { end: 10, unit: 'cm', object: { from: 0, to: 6, label: 'pencil' } }, 140],
    [dial, { max: 1000, value: 200, unit: 'g' }, 90],
    [jug, { max: 400, majorEvery: 100, minorEvery: 50, value: 250, unit: 'ml' }, 90],
    [network, { target: 60, nodes: [{ x: 1, y: 0, value: 25 }, { x: 1, y: 1, value: 35 }, { x: 0, y: 2 }, { x: 2, y: 2 }], edges: [[0, 1], [1, 2], [1, 3]] }, 120],
    [continuum, { left: 'Strongly disagree', right: 'Strongly agree', marks: 4 }, 200],
    [chain, { boxes: ['egg', null, 'butterfly'] }, 200],
    [key, { tree: { q: 'Wings?', no: { leaf: 'ANT' }, yes: { leaf: 'BEE' } } }, 200],
    [concept, { centre: 'Cacao', spokes: [{ label: 'Money', relationship: 'used as' }, { label: 'Power' }, { label: 'Religion' }] }, 260],
    [fishbone, { effect: 'Flooding', causes: ['Heavy rain', 'Steep slopes', 'Cleared trees'] }, 260],
    [pathway, { sources: ['Mains', 'Battery', 'Solar'], middle: 'Electricity', outcome: 'Lamp' }, 260],
  ];
  for (const [mod, spec, widthMm] of specs) {
    for (const surface of Object.keys(PROFILES)) {
      const profile = profileFor(surface, { widthMm });
      const out = mod.tightSvg(spec, profile);
      inside(out);
      for (const m of out.svg.matchAll(/font-size="([\d.]+)"/g)) {
        assert.ok(Number(m[1]) >= profile.minFontPt - 0.01, `${surface}: words at ${m[1]}pt, under the ${profile.minFontPt}pt floor`);
      }
      assert.ok(mod.cacheKey(spec, profile).includes(surface));
    }
  }
});

test('a ruler on paper is true size and refuses a space too narrow; on the board it grows', () => {
  const out = ruler.tightSvg({ end: 10, unit: 'cm' }, SHEET());
  const ticks = [...out.svg.matchAll(/<line x1="([\d.]+)" y1="[\d.]+" x2="\1"/g)].map((m) => Number(m[1]));
  assert.ok(Math.abs((Math.max(...ticks) - Math.min(...ticks)) / MM_TO_PT - 100) < 0.05, 'ten centimetres is 100mm of paper');
  assert.equal(ruler.trueWidthMm({ end: 20 }) - ruler.trueWidthMm({ end: 10 }), 100);
  assert.throws(() => ruler.tightSvg({ end: 30 }, profileFor('stickin', { widthMm: 150 })), /^Error: RULER_TOO_WIDE_FOR_SPACE|RULER_TOO_WIDE_FOR_SPACE/);
  assert.throws(() => ruler.tightSvg({ end: 10, unit: 'inches' }, SHEET()), /RULER_UNIT/);
  const board = ruler.tightSvg({ end: 10 }, BOARD());
  assert.ok(board.w > out.w * 1.5, 'the board ruler fills its zone');
});

test('a dial points its needle at its value, and prints numbers as they are', () => {
  const out = dial.tightSvg({ max: 5, majorEvery: 0.5, value: 1.25, unit: 'kg' }, BOARD());
  const L = out.layout;
  const needle = /<line class="dial-needle" x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"/.exec(out.svg).slice(1).map(Number);
  const angle = (Math.atan2(needle[3] - needle[1], needle[2] - needle[0]) * 180) / Math.PI;
  assert.ok(Math.abs(angle - ((1.25 / 5) * 360 - 90)) < 0.5, `the needle points at ${angle} degrees`);
  assert.ok(texts(out.svg).includes('0.5') && texts(out.svg).includes('4.5'), 'half kilograms are not rounded to whole ones');
  assert.ok(L.pt >= 18);
  assert.throws(() => dial.tightSvg({ max: 1000, value: 1200 }, BOARD()), /DIAL_SCALE_VALUE_OFF_SCALE/);
});

test('a jug shows a liquid and a level only when it is given one', () => {
  const empty = jug.tightSvg({ max: 400, unit: 'ml' }, SHEET());
  assert.ok(!/jug-liquid|jug-level/.test(empty.svg), 'the question form is an empty jug');
  const full = jug.tightSvg({ max: 400, value: 250, unit: 'ml', levelColor: '00B050' }, SHEET());
  assert.ok(/jug-liquid/.test(full.svg) && /stroke="#00B050"/.test(full.svg));
  assert.ok(texts(full.svg).includes('250ml'));
  const L = full.layout;
  assert.ok(Math.abs(L.yFor(0) - L.yFor(400) - L.scaleH) < 1e-6);
});

test('two joined circles one step apart keep a visible run of line between them', () => {
  const out = network.tightSvg({ nodes: [{ x: 0, y: 0, value: 25 }, { x: 0, y: 1, value: null }], edges: [[0, 1]] }, BOARD());
  const L = out.layout;
  assert.ok(L.s - 2 * L.R > 0.2 * L.s, 'the circles do not touch');
  assert.ok(texts(out.svg).includes('?'), 'a blank circle shows a question mark');
  const labelled = network.tightSvg({ target: 60, label: 'Each line adds to 60', nodes: [{ x: 0, y: 0, value: 1 }], edges: [] }, BOARD());
  assert.ok(!texts(labelled.svg).some((t) => /adds up to/.test(t)), 'a label replaces the drawn target sentence');
  assert.throws(() => network.tightSvg({ nodes: [{ x: 0, y: 0 }], edges: [[0, 3]] }, BOARD()), /NUMBER_NETWORK_INVALID/);
});

test('a continuum keeps its end labels at its ends and draws the ticks it is asked for', () => {
  const out = continuum.tightSvg({ left: 'Never fair', right: 'Always fair', middle: 'Sometimes', marks: 4 }, BOARD());
  assert.equal((out.svg.match(/<rect /g) || []).length, 1 + 2 + 4);
  assert.ok(/text-anchor="start"[^>]*>Never</.test(out.svg) || /text-anchor="start"[^>]*>Never fair</.test(out.svg));
  assert.ok(/text-anchor="end"[^>]*>Always fair</.test(out.svg));
  assert.throws(
    () => continuum.tightSvg({ left: 'Supercalifragilisticexpialidocious', right: 'b' }, profileFor('slides', { widthPt: 300, heightPt: 200 })),
    /CONTINUUM_LABEL_TOO_WIDE|CONTINUUM_TOO_NARROW/
  );
});

test('a source pathway keeps each source distinct before the middle and the outcome', () => {
  // Ported from the board's source-pathway test: four separate source nodes at
  // one shared size, a typed line break kept, two arrows, middle then outcome.
  const out = pathway.tightSvg({ sources: ['Mains socket', 'Battery / cell', 'Solar cell', 'Turn handle\nDynamo'], middle: 'Electricity', outcome: 'Appliance' }, BOARD());
  const L = out.layout;
  assert.equal(L.sources.length, 4);
  assert.deepEqual(L.sources[3].lines, ['Turn handle', 'Dynamo']);
  assert.equal((out.svg.match(/class="pathway-arrow"/g) || []).length, 2);
  assert.ok(L.middleBox.y > L.sources[0].box.y && L.outcomeBox.y > L.middleBox.y);
  const sourceSizes = new Set([...out.svg.matchAll(/font-size="([\d.]+)"/g)].map((m) => m[1]));
  assert.equal(sourceSizes.size, 2, 'the sources share one size, and the middle and outcome one slightly larger');
  assert.throws(() => pathway.tightSvg({ sources: ['one'], middle: 'm', outcome: 'o' }, BOARD()), /SOURCE_PATHWAY_CAPACITY/);
});

test('a concept map and a fishbone refuse what they cannot carry by name, rather than dropping it', () => {
  const seven = Array.from({ length: 7 }, (_, i) => ({ label: `Idea ${i}` }));
  assert.throws(() => concept.tightSvg({ centre: 'C', spokes: seven }, BOARD()), /CONCEPT_MAP_TOO_MANY_SPOKES/);
  assert.throws(() => fishbone.tightSvg({ effect: 'E', causes: Array.from({ length: 7 }, (_, i) => `Cause ${i}`) }, BOARD()), /FISHBONE_TOO_MANY_CAUSES/);
  const map = concept.tightSvg({ centre: 'Cacao', spokes: [{ label: 'Money', relationship: 'used as' }, { label: 'Power', relationship: 'controlled by rulers' }, { label: 'Religion' }, { label: 'Afterlife' }] }, BOARD());
  const boxes = [map.layout.cBox, ...map.layout.spokes.map((s) => s.box)];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      assert.ok(!(a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h), 'no two concept-map boxes overlap');
    }
  }
  const bone = fishbone.tightSvg({ effect: 'The Romans invaded Britain', causes: ['Britain had tin and gold', 'Caesar wanted military glory', 'Britain was helping the Gauls', 'Rome wanted to expand'] }, BOARD());
  const above = bone.layout.causes.filter((c) => c.above);
  assert.equal(above.length, 2, 'the causes alternate above and below the spine, starting above');
  for (let i = 1; i < above.length; i++) assert.ok(above[i - 1].box.x + above[i - 1].box.w <= above[i].box.x, 'causes on one side stay apart');
  assert.ok(texts(bone.svg).join(' ').includes('Caesar wanted military glory'.split(' ')[0]));
});
