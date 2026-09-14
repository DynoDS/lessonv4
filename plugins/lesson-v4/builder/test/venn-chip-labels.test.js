'use strict';

// A placed Venn chip holds a few words, not only a shape's name. Chips were a
// fixed 188-unit box with one line of 30-unit text, which suits `Square` and
// spilled out of the box for `Children sat in rows` (14 September 2026, when
// the Venn was offered for history and geography comparisons). A chip now
// wraps its words inside the box and grows taller, the way the circle labels
// already fit themselves.

const assert = require('node:assert/strict');
const test = require('node:test');

const venn = require('../../shared/visuals/venn-svg');

const GLYPH_W = 0.56; // the chip estimate in venn-svg.js

function chips(svg) {
  const rects = [...svg.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" rx="14"/g)]
    .map((m) => ({ x: +m[1], y: +m[2], w: +m[3], h: +m[4] }))
    .filter((r) => r.w < 500); // the universe box shares the corner radius
  const texts = [...svg.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*font-size="([\d.]+)"[^>]*>([^<]*)<\/text>/g)]
    .map((m) => ({ x: +m[1], y: +m[2], font: +m[3], text: m[4] }));
  return rects.map((r) => ({
    ...r,
    lines: texts.filter((t) => t.x > r.x && t.x < r.x + r.w && t.y > r.y && t.y < r.y + r.h),
  }));
}

const HISTORY = {
  label1: 'Victorian classroom',
  label2: 'Classroom today',
  shapes: [
    { region: 'leftOnly', label: 'Slates' },
    { region: 'leftOnly', label: 'Children sat in rows' },
    { region: 'overlap', label: 'A teacher' },
    { region: 'overlap', label: 'Learning to read' },
    { region: 'rightOnly', label: 'Computers' },
    { region: 'rightOnly', label: 'Group tables' },
  ],
};

test('every chip line fits inside its chip', () => {
  const placed = chips(venn.tightSvg(HISTORY).svg);
  assert.equal(placed.length, 6);
  for (const chip of placed) {
    assert.ok(chip.lines.length >= 1, 'each chip carries its words');
    for (const line of chip.lines) {
      const width = line.text.length * GLYPH_W * line.font;
      assert.ok(width <= chip.w, `"${line.text}" is ${width.toFixed(0)} wide in a ${chip.w} chip`);
    }
  }
});

test('a long label wraps and keeps the chip font rather than shrinking it', () => {
  const placed = chips(venn.tightSvg(HISTORY).svg);
  const rows = placed.find((c) => c.lines.map((l) => l.text).join(' ') === 'Children sat in rows');
  assert.ok(rows, 'the whole label survives across its lines');
  assert.ok(rows.lines.length >= 2);
  assert.ok(rows.lines.every((l) => l.font === 30));
});

test('chips sharing a region do not overlap', () => {
  const placed = chips(venn.tightSvg(HISTORY).svg).sort((a, b) => a.x - b.x || a.y - b.y);
  for (let i = 1; i < placed.length; i++) {
    const a = placed[i - 1];
    const b = placed[i];
    if (a.x !== b.x) continue;
    assert.ok(a.y + a.h <= b.y, 'a taller chip pushes the next one down');
  }
});

test('every chip in a diagram shares one font, so one long word does not shrink only its own chip', () => {
  const spec = {
    label1: 'Manaus, Brazil',
    label2: 'London, UK',
    shapes: [
      { region: 'leftOnly', label: 'Hot all year' },
      { region: 'rightOnly', label: 'Photosynthesising' },
      { region: 'overlap', label: 'Built by a river' },
    ],
  };
  const fonts = new Set(chips(venn.tightSvg(spec).svg).flatMap((c) => c.lines.map((l) => l.font)));
  assert.equal(fonts.size, 1);
});

test('a shape name keeps its one-line chip', () => {
  const placed = chips(venn.tightSvg({ label1: 'a', label2: 'b', shapes: [{ region: 'overlap', label: 'Square' }] }).svg);
  assert.equal(placed[0].lines.length, 1);
  assert.equal(placed[0].h, 70);
});
