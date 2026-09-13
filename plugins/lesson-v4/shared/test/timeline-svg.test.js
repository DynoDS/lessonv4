'use strict';

// The one timeline every surface places (shared/visuals/timeline-svg.js).
//
// Ported from the board's own timeline tests (builder/test/timeline.test.js),
// which were written after a history deck (4 September 2026) rendered its
// "not-to-scale Victorian-to-today timeline" three times as a three-column
// table, because the board had no timeline. They pin the layout the drawing
// promises rather than the words it prints: every mark lands where the
// designer's fraction puts it, every label sits inside the drawing and clear of
// its neighbours, an edge label tucks inward from its tick, a word is never
// split, and a space that cannot hold the figure is refused by name.

const test = require('node:test');
const assert = require('node:assert/strict');
const timeline = require('../visuals/timeline-svg');
const { profileFor, PROFILES } = require('../visuals/surface-profiles');
const { textWidthEm } = require('../text/comic-glyph-width');

// The board's full body zone, and a wide strip, less the placer's padding.
const BODY = () => profileFor('slides', { widthPt: (12.67 - 0.2) * 72, heightPt: (5.6 - 0.2) * 72 });
const STRIP = () => profileFor('slides', { widthPt: (12.67 - 0.2) * 72, heightPt: (2.0 - 0.2) * 72 });

const VICTORIAN = {
  eras: [{ label: 'Victorian period 1837 to 1901', from: 0.05, to: 0.62 }],
  marks: [
    { label: '1837', at: 0.05 },
    { label: 'Hampton timetable 1862', at: 0.27 },
    { label: 'Port Sunlight classroom April 1897', at: 0.55 },
    { label: 'today 2026', at: 0.97 },
  ],
};

const texts = (svg) =>
  [...svg.matchAll(/<text x="([-\d.]+)" y="([-\d.]+)" text-anchor="(\w+)"[^>]*font-size="([\d.]+)"[^>]*>([^<]*)<\/text>/g)].map((m) => ({
    x: Number(m[1]),
    y: Number(m[2]),
    anchor: m[3],
    size: Number(m[4]),
    text: m[5],
  }));

test('every mark sits at its own fraction of the line, and everything stays inside the drawing', () => {
  const out = timeline.tightSvg(VICTORIAN, STRIP());
  const L = out.layout;
  L.n.marks.forEach((mark, i) => {
    assert.ok(Math.abs(L.boxes[i].tickX - (L.lineX0 + mark.at * L.lineW)) < 1e-9, `mark ${i} tick at its fraction`);
  });
  for (const r of out.svg.matchAll(/<rect x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)) {
    const [x, y, w, h] = r.slice(1).map(Number);
    assert.ok(x >= -0.01 && y >= -0.01 && x + w <= out.w + 0.01 && y + h <= out.h + 0.01, 'a shape inside the drawing');
  }
  // One era band, one line, two end caps, four ticks.
  assert.equal((out.svg.match(/<rect /g) || []).length, 1 + 1 + 2 + 4);
  assert.ok(out.h <= STRIP().heightPt + 0.5, 'it fits the strip it was given');
});

test('neighbouring date labels never overlap, and the edge labels tuck inward from their ticks', () => {
  const L = timeline.describeLayout(VICTORIAN, STRIP());
  const byRow = new Map();
  L.boxes.forEach((b) => byRow.set(b.row, [...(byRow.get(b.row) || []), b]));
  for (const row of byRow.values()) {
    for (let i = 1; i < row.length; i += 1) assert.ok(row[i - 1].x + row[i - 1].w <= row[i].x + 1e-6, 'labels on one row stay apart');
  }
  assert.equal(L.boxes[0].align, 'left');
  assert.equal(L.boxes[L.boxes.length - 1].align, 'right');
  assert.equal(L.boxes[1].align, 'center');
  assert.ok(Math.abs(L.boxes[1].x + L.boxes[1].w / 2 - L.boxes[1].tickX) < 1e-6);
});

test('labels share one size, never split a word, and take at most two lines', () => {
  const out = timeline.tightSvg(VICTORIAN, STRIP());
  const L = out.layout;
  const sizes = new Set(texts(out.svg).map((t) => t.size));
  assert.equal(sizes.size, 1, 'every word on the figure shares one size');
  assert.ok(L.pt >= 18, 'the board keeps its 18pt readable floor');
  L.markLines.forEach((lines, i) => {
    assert.ok(lines.length <= 2);
    const drawnWords = lines.join(' ').split(' ');
    assert.deepEqual(drawnWords, L.n.marks[i].label.split(/\s+/), 'every word is drawn whole, in order');
    for (const line of lines) assert.ok(textWidthEm(line, true) * L.pt <= L.boxes[i].w + 1e-6, `"${line}" fits its box`);
  });
  // No timeline carries a "not to scale" note: the teacher wants none, and a
  // spec that still says so is refused by name rather than drawn.
  assert.equal(texts(out.svg).some((t) => /not to scale/i.test(t.text)), false);
  assert.throws(
    () => timeline.tightSvg({ ...VICTORIAN, note: 'not to scale' }, STRIP()),
    (error) => /^TIMELINE_NOTE_NOT_DRAWN/.test(error.message) && /in proportion to its real dates/.test(error.message)
  );
});

test('a space too narrow for a date label or an era is refused by name, and the refusal says why', () => {
  const narrow = profileFor('slides', { widthPt: 2.8 * 72, heightPt: 1.8 * 72 });
  assert.throws(
    () => timeline.tightSvg({ ...VICTORIAN, eras: [] }, narrow),
    (error) => /^TIMELINE_ZONE_TOO_NARROW: the date label "[^"]+" has [\d.]+in between its neighbours/.test(error.message) && /space the marks further apart/.test(error.message)
  );
  assert.throws(
    () => timeline.tightSvg(VICTORIAN, narrow),
    (error) => /^TIMELINE_ZONE_TOO_NARROW: the era "Victorian period 1837 to 1901"/.test(error.message) && /widen that era's from\/to span/.test(error.message)
  );
  const jammed = { marks: [{ label: '', at: 0.5 }, { label: 'Portsmouth', at: 0.52 }] };
  assert.throws(() => timeline.tightSvg(jammed, BODY()), (error) => /needs [\d.]+in for the word "Portsmouth"/.test(error.message));
});

test('a space too short for the figure is refused by name, in inches', () => {
  const shallow = profileFor('slides', { widthPt: 12.47 * 72, heightPt: 0.7 * 72 });
  assert.throws(
    () => timeline.tightSvg(VICTORIAN, shallow),
    (error) => /^TIMELINE_ZONE_TOO_SHORT: this timeline needs [\d.]+in of height/.test(error.message) && /the space is 0\.70in tall/.test(error.message)
  );
});

test('a bare line still draws when there are neither eras nor marks', () => {
  const out = timeline.tightSvg({}, STRIP());
  assert.equal((out.svg.match(/<rect /g) || []).length, 3, 'the line and its two end caps');
  assert.equal(texts(out.svg).length, 0);
});

test('the same spec draws the same marks on every surface, sized for where it is read', () => {
  const counts = Object.keys(PROFILES).map((s) => {
    const out = timeline.tightSvg(VICTORIAN, profileFor(s, { widthMm: 260 }));
    return (out.svg.match(/<rect /g) || []).length;
  });
  assert.equal(new Set(counts).size, 1, counts.join(', '));
  const piece = timeline.tightSvg(VICTORIAN, profileFor('stickin', { widthMm: 260 }));
  assert.ok(!/#D6EEFF/.test(piece.svg), 'the photocopied pack draws its bands in grey, not colour');
});
