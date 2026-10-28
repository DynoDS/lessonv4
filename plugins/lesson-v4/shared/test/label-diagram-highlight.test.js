'use strict';

// Pointing at one callout of a labelled diagram ("this part of the plant")
// with the shared highlight: the named callout keeps its dot, line and words
// at full strength with a ring round its label, the other callouts fade, the
// photograph never fades, an unknown name is refused with the callouts listed,
// and no highlight draws exactly as before.

const test = require('node:test');
const assert = require('node:assert/strict');

const L = require('../visuals/label-diagram-svg');
const { RING, RING_INK, DIMMED } = require('../visuals/figure-highlight');

const HREF = 'data:image/png;base64,AAAA';
const CALLOUTS = [
  { anchor: [50, 20], label: 'flower', given: true },
  { anchor: [30, 50], label: 'leaf', given: true },
  { anchor: [52, 60], label: 'stem', given: true },
  { anchor: [55, 90], label: 'roots', given: true },
];
const SPEC = { imageHref: HREF, imageWidth: 800, imageHeight: 1000, imagePath: 'plant.png', layout: 'sides', callouts: CALLOUTS };
const ringCount = (svg, colour = RING) => (svg.match(new RegExp(`<rect[^>]*fill="none" stroke="#${colour}"`, "g")) || []).length;
const faded = (svg) => svg.match(new RegExp(`<g opacity="${DIMMED}">.*?</g>`, 'g')) || [];

test('the named callout keeps full strength with its label ringed; the others fade; the picture does not', () => {
  const { svg } = L.tightSvg({ ...SPEC, highlight: 'stem' });
  assert.equal(ringCount(svg), 1);
  const groups = faded(svg);
  assert.equal(groups.length, 3);
  assert.ok(groups.some((g) => g.includes('>roots<')));
  assert.ok(!groups.some((g) => g.includes('>stem<')));
  assert.ok(!groups.some((g) => g.includes('<image')), 'the photograph is not a part and never fades');
});

test('a numbered diagram answers to the number and to the name after it', () => {
  const numbered = CALLOUTS.map((c, i) => ({ ...c, label: `${i + 1} ${c.label}` }));
  const byNumber = L.tightSvg({ ...SPEC, callouts: numbered, highlight: '3' }).svg;
  assert.equal(byNumber, L.tightSvg({ ...SPEC, callouts: numbered, highlight: 'stem' }).svg);
  assert.equal(byNumber, L.tightSvg({ ...SPEC, callouts: numbered, highlight: '3 stem' }).svg);
  assert.ok(!faded(byNumber).some((g) => g.includes('stem<')));
});

test('a write-on diagram is pointed at by place, its line ringed in dark ink on the pack', () => {
  const blanks = CALLOUTS.map((c) => ({ ...c, given: false }));
  const args = { href: HREF, width: 800, height: 1000, callouts: blanks, layout: 'sides', ink: true };
  const built = L.buildLabelDiagramSvg({ ...args, highlight: '2' });
  assert.equal(ringCount(built.svg, RING_INK), 1);
  assert.equal(ringCount(built.svg), 0);
  assert.equal(faded(built.svg).length, 3);
  // The word the child is to write still names the line.
  assert.equal(L.buildLabelDiagramSvg({ ...args, highlight: 'leaf' }).svg, built.svg);
});

test('a part the diagram does not have is refused, listing the callouts it does', () => {
  assert.throws(() => L.tightSvg({ ...SPEC, highlight: 'petal' }), /FIGURE_HIGHLIGHT_UNKNOWN.*flower, leaf, stem, roots/s);
  assert.throws(() => L.cacheKey({ ...SPEC, highlight: 'petal' }), /FIGURE_HIGHLIGHT_UNKNOWN/);
});

test('no highlight draws exactly as before, and the highlight is part of the cache key', () => {
  const plain = L.tightSvg(SPEC).svg;
  assert.ok(!plain.includes(RING) && !plain.includes('opacity'));
  assert.equal(L.tightSvg({ ...SPEC, highlight: [] }).svg, plain);
  assert.equal(L.tightSvg({ ...SPEC, highlight: null }).svg, plain);
  assert.ok(!L.cacheKey(SPEC).includes('highlight'));
  assert.notEqual(L.cacheKey(SPEC), L.cacheKey({ ...SPEC, highlight: 'stem' }));
});
