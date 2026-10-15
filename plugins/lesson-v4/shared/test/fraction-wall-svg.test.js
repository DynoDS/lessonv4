'use strict';

// The one fraction wall every surface places (shared/visuals/fraction-wall-svg.js).

const test = require('node:test');
const assert = require('node:assert/strict');
const wall = require('../visuals/fraction-wall-svg');
const { profileFor, PROFILES } = require('../visuals/surface-profiles');
const { textWidthEm } = require('../text/comic-glyph-width');

const SHEET = profileFor('worksheets', { widthMm: 170 });

test('every row spans the same whole, cut into equal pieces', () => {
  const out = wall.describeLayout({ fractions: [1, 2, 3, 4, 6, 8, 12] }, SHEET);
  const span = (row) => row.pieces[row.pieces.length - 1].x + row.pieces[row.pieces.length - 1].w - row.pieces[0].x;
  out.rows.forEach((row) => {
    assert.equal(row.pieces.length, row.denominator);
    assert.ok(Math.abs(span(row) - span(out.rows[0])) < 1e-6, `the 1/${row.denominator} row is the length of the whole`);
    row.pieces.forEach((p) => assert.ok(Math.abs(p.w - row.pieces[0].w) < 1e-9));
  });
  // Two quarters end where one half ends.
  const half = out.rows[1].pieces[0];
  const quarters = out.rows[3].pieces[1];
  assert.ok(Math.abs(half.x + half.w - (quarters.x + quarters.w)) < 1e-6);
});

test('every name fits inside its piece, at one size for the whole wall, never under the readable floor', () => {
  for (const s of Object.keys(PROFILES)) {
    const profile = profileFor(s, s === 'slides' ? { widthPt: 648, heightPt: 400 } : { widthMm: 170 });
    const out = wall.describeLayout({ fractions: [1, 2, 3, 4, 6, 8, 12] }, profile);
    assert.ok(out.labelPt >= profile.minFontPt, `${s}: names at ${out.labelPt}pt`);
    out.rows.forEach((row) => {
      const text = row.denominator === 1 ? '1' : out.stacked ? String(row.denominator) : `1/${row.denominator}`;
      assert.ok(textWidthEm(text, true) * out.labelPt <= row.pieces[0].w, `${s}: the 1/${row.denominator} name overflows its piece`);
    });
  }
});

test('the same spec draws the same pieces on every surface', () => {
  const spec = { fractions: [2, 4, 8] };
  const marks = Object.keys(PROFILES).map((s) => {
    const svg = wall.tightSvg(spec, profileFor(s, s === 'slides' ? { widthPt: 648, heightPt: 300 } : { widthMm: 170 })).svg;
    return (svg.match(/<rect\b[^>]*stroke=/g) || []).length;
  });
  assert.equal(new Set(marks).size, 1, marks.join(', '));
});

test('a wall too narrow or too shallow to name its pieces refuses by name', () => {
  assert.throws(() => wall.tightSvg({ fractions: [24] }, profileFor('worksheets', { widthMm: 40 })), /FRACTION_WALL_TOO_NARROW/);
  assert.throws(() => wall.tightSvg({ fractions: [1, 2, 3, 4, 5, 6, 8, 10, 12] }, profileFor('slides', { widthPt: 648, heightPt: 120 })), /FRACTION_WALL_ZONE_TOO_SHALLOW/);
});

test('the stick-in piece stays in ink', () => {
  const svg = wall.tightSvg({ fractions: [1, 2, 3] }, profileFor('stickin', { widthMm: 130 })).svg;
  assert.ok(!/#FFE4CC|#FFF8CC|#D6EEFF/.test(svg));
});

test('bad rows fail clearly', () => {
  assert.throws(() => wall.normalise({ fractions: [] }), /FRACTION_WALL_INVALID/);
  assert.throws(() => wall.normalise({ fractions: [2, 0] }), /FRACTION_WALL_INVALID/);
  assert.throws(() => wall.normalise({ fractions: [2.5] }), /FRACTION_WALL_INVALID/);
  assert.throws(() => wall.normalise({ fractions: Array.from({ length: 13 }, () => 2) }), /FRACTION_WALL_INVALID/);
  assert.deepEqual(wall.normalise({}).fractions, [1, 2, 3, 4]);
});

// ─── the ruled line and the shaded family (13 October 2026) ─────────────────
// A Year 4 lesson on families of equivalent fractions could only say in words
// what the wall should have shown: a line ruled down it at one half, and the
// pieces up to the line shaded in every row with a join there.

const L03 = [1, 2, 3, 4, 6, 8, 12];
const everySurface = (fn) =>
  Object.keys(PROFILES).forEach((s) => fn(s, profileFor(s, s === 'slides' ? { widthPt: 800, heightPt: 400 } : { widthMm: 170 })));
const nameBox = (row, p) => [p.nameX - row.nameW / 2, p.nameX + row.nameW / 2];

test('a ruled line lies on a join in every row of its family, and cuts through a piece in the rows outside it', () => {
  const out = wall.describeLayout({ fractions: L03, line: '1/2' }, SHEET);
  const [line] = out.lines;
  const joinsOf = (row) => row.pieces.slice(1).map((p) => p.x);
  const onJoin = (row) => joinsOf(row).some((x) => Math.abs(x - line.x) < 1e-6);
  assert.deepEqual(out.rows.filter(onJoin).map((r) => r.denominator), [2, 4, 6, 8, 12]);
  assert.deepEqual(out.rows.map((r) => r.joins[0] || null), [null, '1/2', null, '2/4', '3/6', '4/8', '6/12']);
  // It runs past the wall at both ends, and the picture is big enough to hold it.
  const last = out.rows[out.rows.length - 1];
  assert.ok(line.y1 < out.rows[0].y && line.y2 > last.y + last.h);
  assert.ok(line.y1 - line.w / 2 >= 0 && line.y2 + line.w / 2 <= out.h + 1e-6);
});

test('no name is crossed by a ruled line where its piece has clear room for it, on any surface', () => {
  const cases = [{ line: '1/2' }, { line: '2/3' }, { line: '3/4' }, { line: ['1/4', '5/6'] }, { line: '1/3' }, { line: ['1/3', '1/2', '3/4'] }];
  everySurface((s, profile) => {
    cases.forEach((marks) => {
      const out = wall.describeLayout({ fractions: L03, ...marks }, profile);
      out.rows.forEach((row) =>
        row.pieces.forEach((p) => {
          const [a, b] = nameBox(row, p);
          assert.ok(a >= p.x - 1e-6 && b <= p.x + p.w + 1e-6, `${s} ${JSON.stringify(marks)}: a 1/${row.denominator} name leaves its piece`);
          if (p.overLine) return;
          out.lines.forEach((l) =>
            assert.ok(l.x + l.w / 2 <= a || l.x - l.w / 2 >= b, `${s} ${JSON.stringify(marks)}: the line crosses a 1/${row.denominator} name`)
          );
        })
      );
    });
  });
  // One half cuts the whole and the middle third exactly where their names
  // were, so both step aside; nothing else on the wall moves.
  const out = wall.describeLayout({ fractions: L03, line: '1/2' }, SHEET);
  const moved = out.rows.flatMap((row) => row.pieces.filter((p) => Math.abs(p.nameX - (p.x + p.w / 2)) > 1e-6).map(() => row.denominator));
  assert.deepEqual(moved, [1, 3]);
  assert.ok(!out.rows.some((row) => row.pieces.some((p) => p.overLine)));
});

test('a name with no clear room in its piece stays in the middle and is drawn over the line on a halo', () => {
  // Three eighths cuts a twelfth exactly in half, and half a twelfth cannot hold a name.
  const built = wall.tightSvg({ fractions: L03, line: '3/8' }, profileFor('slides', { widthPt: 800, heightPt: 400 }));
  const stuck = built.layout.rows[6].pieces.filter((p) => p.overLine);
  assert.equal(stuck.length, 1);
  assert.ok(Math.abs(stuck[0].nameX - (stuck[0].x + stuck[0].w / 2)) < 1e-6);
  assert.match(built.svg, /paint-order="stroke"/);
  // The names are written after the line, so the line never lies on top of one.
  assert.ok(built.svg.lastIndexOf('<line ') < built.svg.indexOf('<text '));
});

test('shading the family shades the pieces up to the line in the rows with a join there, and leaves the others alone', () => {
  const half = wall.describeLayout({ fractions: L03, line: '1/2', shade: 'family' }, SHEET);
  assert.deepEqual(half.rows.map((r) => r.shaded), [0, 1, 0, 2, 3, 4, 6]);
  half.rows.forEach((row) => {
    row.pieces.forEach((p, k) => assert.equal(p.shaded, k < row.shaded));
    // Every shaded run ends on the line.
    if (row.shaded) assert.ok(Math.abs(row.pieces[row.shaded].x - half.lines[0].x) < 1e-6);
  });
  const twoThirds = wall.describeLayout({ fractions: L03, line: '2/3', shade: 'family' }, SHEET);
  assert.deepEqual(twoThirds.rows.map((r) => r.shaded), [0, 0, 2, 0, 4, 0, 8]);
  const threeQuarters = wall.describeLayout({ fractions: L03, line: '3/4', shade: 'family' }, SHEET);
  assert.deepEqual(threeQuarters.rows.map((r) => r.shaded), [0, 0, 0, 3, 0, 6, 9]);
  // A fraction with no family on this wall shades its own row and nothing else.
  const alone = wall.describeLayout({ fractions: L03, line: '3/8', shade: 'family' }, SHEET);
  assert.deepEqual(alone.rows.map((r) => r.shaded), [0, 0, 0, 0, 0, 3, 0]);
});

test('named fractions shade their own rows, with or without a line', () => {
  const out = wall.describeLayout({ fractions: [1, 2, 4, 8], shade: ['1/2', '2/4', { numerator: 4, denominator: 8 }] }, SHEET);
  assert.deepEqual(out.rows.map((r) => r.shaded), [0, 1, 2, 4]);
  assert.equal(out.lines.length, 0);
  // Shading alone changes nothing about the wall's size.
  const plain = wall.describeLayout({ fractions: [1, 2, 4, 8] }, SHEET);
  assert.deepEqual([out.w, out.h, out.labelPt], [plain.w, plain.h, plain.labelPt]);
});

test('a shaded run still reads once the colour is copied away', () => {
  const svg = wall.tightSvg({ fractions: [1, 2, 4], line: '1/2', shade: 'family' }, profileFor('stickin', { widthMm: 130 })).svg;
  assert.ok(!/#A9DFBF|#1E8449|#CC0000/i.test(svg), 'no colour on the photocopied pack');
  // Its grey is neither of the two the rows alternate, and it carries an outline.
  assert.match(svg, /fill="#BFBFBF"/);
  assert.equal((svg.match(/fill="none"/g) || []).length, 2);
});

test('a wall told a line is coming is the size and in the place of the wall that has it', () => {
  everySurface((s, profile) => {
    const kept = wall.describeLayout({ fractions: L03, roomFor: 'line' }, profile);
    const ruled = wall.describeLayout({ fractions: L03, line: '1/2', shade: 'family' }, profile);
    assert.deepEqual([kept.w, kept.h, kept.labelPt], [ruled.w, ruled.h, ruled.labelPt], s);
    assert.deepEqual(kept.rows.map((r) => [r.y, r.h]), ruled.rows.map((r) => [r.y, r.h]), s);
    assert.equal(kept.lines.length, 0);
  });
});

test('two different marked walls never share one cached picture, and a plain wall keeps the key it had', () => {
  const keys = [{}, { line: '1/2' }, { line: '1/2', shade: 'family' }, { line: '3/4' }, { shade: ['1/2'] }, { roomFor: 'line' }].map((marks) =>
    wall.cacheKey({ fractions: [1, 2, 4], ...marks }, SHEET)
  );
  assert.equal(new Set(keys).size, keys.length);
  assert.match(keys[0], /^fraction-wall:worksheets:[\d.]+x-:\{"fractions":\[1,2,4\]\}$/);
});

test('a line or a shading that cannot be drawn is refused in words a designer can act on', () => {
  const bad = (marks, pattern) => assert.throws(() => wall.normalise({ fractions: L03, ...marks }), pattern);
  bad({ line: 'half' }, /FRACTION_WALL_INVALID: the ruled line "half" is not a fraction/);
  bad({ line: '4/4' }, /end of the wall/);
  bad({ line: ['1/5', '2/5', '3/5', '4/5'] }, /3 is the most/);
  bad({ shade: 'family' }, /has no `line`/);
  bad({ shade: ['2/5'] }, /no fifths row/);
  bad({ shade: ['1/4', '3/4'] }, /shades the quarters row twice/);
  bad({ line: ['1/4', '5/6'], shade: 'family' }, /shades the twelfths row twice/);
  // The same line written two ways is one line.
  assert.equal(wall.normalise({ fractions: L03, line: ['1/2', '2/4', [3, 6]] }).lines.length, 1);
  assert.equal(wall.normalise({ fractions: L03, lines: ['1/4', '5/6'] }).lines.length, 2);
});
