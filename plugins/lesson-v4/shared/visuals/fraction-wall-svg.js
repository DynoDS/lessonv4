'use strict';

// THE fraction wall: rows of unit fractions under one whole, each row cut into
// equal pieces and each piece named, so a child reads across to see that two
// quarters end where one half ends. One drawing, placed by the board, the
// worksheet, the working wall and the stick-in pack.
//
// Until 13 September 2026 only the board could draw it, as PowerPoint shapes
// with a label size guessed from a count of characters, and a sheet or wall
// card that needed the wall a child had just used on the board had nothing to
// print. The shaded single shape is its own picture (shaded-fraction-svg.js).
//
// Laid out in points at the size it prints, like the number line: the names in
// the pieces are real sizes on every surface, one size for the whole wall so it
// reads as one set, and a wall too narrow or too shallow to name its smallest
// pieces at the surface's readable size refuses by name. It used to go down to
// 7pt on a slide, which nobody at the back of the room could read.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//   normalise(spec)         -> { fractions, lines?, shade?, roomFor? }
//
// ─── the spec ────────────────────────────────────────────────────────────
//
//   fractions   the rows, top to bottom, as the denominator of each row's
//               pieces (default [1, 2, 3, 4]); 1 is the whole
//   line        a ruled line straight down the wall at a fraction of the
//               whole, "1/2", or up to three of them, ["1/4", "5/6"]. It is
//               the line a teacher rules to find a family: every row with a
//               join on it has a fraction equal to it, and a row it cuts
//               through a piece of (thirds, at one half) has none. A name the
//               line would cross steps aside into the clear part of its piece.
//   shade       the pieces picked out. "family" shades, in every row with a
//               join on the line, the pieces up to the line. A list names the
//               fractions instead, ["1/2", "2/4", "4/8"]: each shades that
//               many pieces from the left of its own row. Shaded pieces keep
//               their joins and their names, and carry a heavy outline, so
//               they still read in the photocopied pack.
//   roomFor     "line" keeps the room a ruled line needs above and below the
//               wall without drawing one, so a question slide's wall is the
//               size and in the place of the answers slide's wall that gains
//               the line. The board sets it itself (walls-stand-still.js).
//
// A wall with none of these draws exactly as it did before 13 October 2026.
// Until then the wall could not be ruled or shaded at all, so a Year 4 lesson
// on families of equivalent fractions said in the teacher's notes what its
// finished-model slide and its wall sheet should have shown, and arrows a
// designer laid over the half line crossed the names (stress test, 7 October).

const { textWidthEm } = require('../text/comic-glyph-width');
const { profileFor } = require('./surface-profiles');

// ─── CONSTANTS (in ems of the label size unless named) ──────────────────────
const ROW_H = 2.9; // a row that holds a stacked name: numerator, bar, denominator
const STACK_NEED = 2.5; // the least depth a stacked name fits in
const INLINE_NEED = 1.35; // the least depth a "1/8" on one line fits in
const BAR_W = 0.07; // the fraction bar under the numerator
const BORDER = 0.07; // the edge of each piece
const MIN_STROKE_PT = 0.75;
const PIECE_FILL = 0.8; // a name may use this share of its piece's width
const MAX_ROWS = 12;
const MAX_DENOMINATOR = 24;
const MAX_LINES = 3;
const LINE_W = 0.13; // the ruled line: about twice a piece's edge, so it reads as laid over the wall
const MIN_LINE_PT = 2.2;
const LINE_OVER = 0.4; // how far the ruled line runs past the top and the foot of the wall
const LINE_GAP = 0.16; // clear paper between the ruled line and a name beside it
const NAME_PAD = 0.12; // the least a name stands off the edge of its piece
const SHADE_EDGE = 2; // the outline round a shaded run, in piece edges
const SHADE = { colour: '#A9DFBF', ink: '#BFBFBF' }; // the shaded fraction's own soft green, and its photocopied grey
const SHADE_OUTLINE = { colour: '#1E8449', ink: '#1A1A1A' };
const DEFAULT_FRACTIONS = [1, 2, 3, 4];
// A different pale colour per row, so a child can follow one row across; the
// photocopied pack alternates white and a pale grey instead.
const ROW_COLOURS = ['#FFE4CC', '#FFF8CC', '#D6EEFF', '#D5F5E3', '#EAD5F5', '#FFD6D6', '#D5F5F5', '#F5F5D5', '#FFE4E4'];
const INK_ROWS = ['#FFFFFF', '#E8E8E8'];
const EDGE = { colour: '#666666', ink: '#1A1A1A' };
// ────────────────────────────────────────────────────────────────────────────

function f2(n) {
  return Math.round(n * 100) / 100;
}

function normalise(spec = {}) {
  const given = spec.fractions == null ? DEFAULT_FRACTIONS : spec.fractions;
  if (!Array.isArray(given) || !given.length) {
    throw new Error('FRACTION_WALL_INVALID: `fractions` lists the rows as denominators, for example [1, 2, 4, 8].');
  }
  if (given.length > MAX_ROWS) {
    throw new Error(`FRACTION_WALL_INVALID: ${given.length} rows were asked for and ${MAX_ROWS} is the most a wall can name readably. Leave out the rows this lesson does not compare.`);
  }
  const fractions = given.map((d) => {
    const n = typeof d === 'string' && /^\s*\d+\s*$/.test(d) ? Number(d) : d;
    if (!Number.isInteger(n) || n < 1 || n > MAX_DENOMINATOR) {
      throw new Error(`FRACTION_WALL_INVALID: row ${JSON.stringify(d)} is not a whole-number denominator from 1 to ${MAX_DENOMINATOR}.`);
    }
    return n;
  });
  const out = { fractions };
  const lines = readLines(spec.line != null ? spec.line : spec.lines);
  if (lines.length) out.lines = lines;
  const shade = readShade(spec.shade, fractions, lines);
  if (shade.length) out.shade = shade;
  if (!lines.length && (spec.roomFor === 'line' || spec.roomFor === true)) out.roomFor = 'line';
  return out;
}

const ROW_NAMES = { 2: 'halves', 3: 'thirds', 4: 'quarters', 5: 'fifths', 6: 'sixths', 7: 'sevenths', 8: 'eighths', 9: 'ninths', 10: 'tenths', 12: 'twelfths' };
const rowName = (d) => (d === 1 ? 'whole' : ROW_NAMES[d] || `1/${d}`);
const isOneFraction = (v) => Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === 'number');

// "3/4", { numerator: 3, denominator: 4 } or [3, 4].
function readFraction(raw, what) {
  let n;
  let d;
  if (typeof raw === 'string') {
    const m = /^\s*(\d+)\s*\/\s*(\d+)\s*$/.exec(raw);
    if (m) [n, d] = [Number(m[1]), Number(m[2])];
  } else if (isOneFraction(raw)) {
    [n, d] = raw;
  } else if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    n = Number(raw.numerator != null ? raw.numerator : raw.n);
    d = Number(raw.denominator != null ? raw.denominator : raw.d);
  }
  if (!Number.isInteger(n) || !Number.isInteger(d) || d < 1 || d > MAX_DENOMINATOR || n < 1 || n > d) {
    throw new Error(`FRACTION_WALL_INVALID: ${what} ${JSON.stringify(raw)} is not a fraction such as "1/2" or "3/4", with a denominator up to ${MAX_DENOMINATOR}.`);
  }
  return { n, d };
}

function readLines(given) {
  if (given == null || given === false || given === '') return [];
  // [1, 2] is one fraction; ["1/4", "5/6"] is two lines.
  const list = Array.isArray(given) && !isOneFraction(given) ? given : [given];
  const lines = [];
  list.forEach((raw) => {
    const { n, d } = readFraction(raw, 'the ruled line');
    if (n === d) {
      throw new Error(`FRACTION_WALL_INVALID: a ruled line at ${n}/${d} would lie on the end of the wall, where every row ends. Rule it at a fraction less than one whole.`);
    }
    if (!lines.some((l) => l.n * d === n * l.d)) lines.push({ n, d });
  });
  if (lines.length > MAX_LINES) {
    throw new Error(`FRACTION_WALL_INVALID: ${lines.length} ruled lines were asked for and ${MAX_LINES} is the most a child can follow down one wall. Show the other families on a second wall.`);
  }
  return lines.sort((a, b) => a.n * b.d - b.n * a.d);
}

// The shaded pieces as [denominator, how many from the left], one per row.
function readShade(given, fractions, lines) {
  if (given == null || given === false || given === '' || (Array.isArray(given) && !given.length)) return [];
  const byRow = new Map();
  const add = (d, count, source) => {
    if (byRow.has(d) && byRow.get(d) !== count) {
      throw new Error(
        `FRACTION_WALL_INVALID: ${source} shades the ${rowName(d)} row twice, to ${byRow.get(d)}/${d} and to ${count}/${d}, and a row can show one shaded amount. ` +
          'Shade one family on this wall and show the other on a second wall.'
      );
    }
    byRow.set(d, count);
  };
  if (given === 'family' || given === true) {
    if (!lines.length) {
      throw new Error('FRACTION_WALL_INVALID: `shade: "family"` shades the pieces up to the ruled line, and this wall has no `line`. Add the line, or name the fractions to shade, for example ["1/2", "2/4"].');
    }
    lines.forEach((l) =>
      fractions.forEach((d) => {
        if ((l.n * d) % l.d === 0) add(d, (l.n * d) / l.d, 'the families of the ruled lines together');
      })
    );
  } else {
    const list = Array.isArray(given) && !isOneFraction(given) ? given : [given];
    list.forEach((raw) => {
      const { n, d } = readFraction(raw, 'the shaded fraction');
      if (!fractions.includes(d)) {
        throw new Error(`FRACTION_WALL_INVALID: ${n}/${d} cannot be shaded because this wall has no ${rowName(d)} row. Its rows are ${fractions.join(', ')}.`);
      }
      add(d, n, '`shade`');
    });
  }
  return [...byRow.entries()].sort((a, b) => a[0] - b[0]);
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = typeof profileOrSurface === 'string' ? profileFor(profileOrSurface, box || { widthPt: 500 }) : profileOrSurface;
  const { fractions, lines = [], shade = [], roomFor } = normalise(spec);
  const W = profile.widthPt;
  const H = profile.heightPt;
  const bold = true; // names on a wall are read against colour, so they are always bold
  const edge = Math.max(MIN_STROKE_PT, BORDER * profile.fontPt);
  const inner = W - edge;
  const rows = fractions.length;
  // A ruled line runs a little past the wall at both ends, as a ruler line
  // does, and that room is kept on a wall told a line is coming.
  const lineW = Math.max(MIN_LINE_PT, LINE_W * profile.fontPt);
  const over = lines.length || roomFor ? LINE_OVER * profile.fontPt + lineW / 2 : 0;

  // The largest one size every name fits its piece at, stacked (only the
  // denominator's width matters) and on one line.
  const fit = (textFor) =>
    Math.min(profile.fontPt, ...fractions.map((d) => ((inner / d) * PIECE_FILL) / textWidthEm(textFor(d), bold)));
  const stackedPt = fit((d) => (d === 1 ? '1' : String(d)));
  const inlinePt = fit((d) => (d === 1 ? '1' : `1/${d}`));

  let rowH;
  let labelPt;
  let stacked;
  if (H) {
    // The board fills its zone's depth, up to how far it may grow.
    const room = (H - edge - 2 * over) / rows;
    const natural = ROW_H * profile.fontPt * (profile.grow || 1);
    rowH = Math.min(room, natural);
    stacked = stackedPt >= profile.minFontPt && rowH >= STACK_NEED * profile.minFontPt;
    labelPt = stacked ? Math.min(stackedPt, rowH / STACK_NEED) : Math.min(inlinePt, rowH / INLINE_NEED);
    if (!stacked && labelPt < profile.minFontPt) {
      throw new Error(
        `FRACTION_WALL_ZONE_TOO_SHALLOW: ${rows} rows cannot name their pieces at the ${profile.minFontPt}pt readable size in a space this ` +
          'shallow or narrow. Give the wall more room, or leave out the rows this lesson does not compare.'
      );
    }
  } else {
    stacked = stackedPt >= profile.minFontPt;
    labelPt = stacked ? stackedPt : inlinePt;
    rowH = (stacked ? ROW_H : INLINE_NEED + 0.6) * labelPt;
  }
  if (labelPt < profile.minFontPt) {
    const smallest = Math.max(...fractions);
    throw new Error(
      `FRACTION_WALL_TOO_NARROW: the 1/${smallest} pieces are too narrow to be named at the ${profile.minFontPt}pt readable size. ` +
        'Give the wall more width, or leave out its smallest row.'
    );
  }
  labelPt = Math.floor(labelPt * 10) / 10;

  const top = over + edge / 2;
  const ruled = lines.map((l) => ({ ...l, x: edge / 2 + (inner * l.n) / l.d, y1: lineW / 2, y2: 2 * over + rows * rowH + edge - lineW / 2, w: lineW }));
  const shadedTo = new Map(shade);
  const gap = LINE_GAP * labelPt + lineW / 2;
  const pad = NAME_PAD * labelPt + edge / 2;
  const layout = [];
  fractions.forEach((d, i) => {
    const y = top + i * rowH;
    const pieceW = inner / d;
    const nameW = nameWidth(d, stacked, labelPt, pieceW);
    const pieces = [];
    for (let k = 0; k < d; k++) {
      const piece = { x: edge / 2 + k * pieceW, y, w: pieceW, h: rowH, shaded: k < (shadedTo.get(d) || 0) };
      Object.assign(piece, placeName(piece, nameW, ruled, gap, pad));
      pieces.push(piece);
    }
    layout.push({
      denominator: d, y, h: rowH, pieces, nameW,
      shaded: shadedTo.get(d) || 0,
      // The fractions a line finds: one in each row with a join lying on it.
      joins: ruled.filter((l) => (l.n * d) % l.d === 0).map((l) => `${(l.n * d) / l.d}/${d}`),
    });
  });
  return { w: W, h: rows * rowH + edge + 2 * over, rows: layout, lines: ruled, labelPt, stacked, edge, over, profile };
}

// How wide a piece's name prints: the stacked name is as wide as its bar.
function nameWidth(d, stacked, pt, pieceW) {
  if (d === 1) return textWidthEm('1', true) * pt;
  if (!stacked) return textWidthEm(`1/${d}`, true) * pt;
  return Math.max(textWidthEm('1', true) * pt, textWidthEm(String(d), true) * pt, stackedBarWidth(d, pt, pieceW));
}

function stackedBarWidth(d, pt, pieceW) {
  return Math.min(pieceW * 0.6, textWidthEm(String(d), true) * pt * 1.3);
}

// Where a piece's name sits. In the middle, unless a ruled line cuts through
// the piece there (one half cuts the middle third exactly where its name is):
// then the name is centred in the widest clear part of the piece, so the line
// stays whole and the name stays readable. A piece too narrow to give the name
// a clear part keeps it in the middle, drawn over the line on a halo of the
// piece's own colour.
function placeName(piece, nameW, ruled, gap, pad) {
  const centre = piece.x + piece.w / 2;
  const inside = ruled.map((l) => l.x).filter((x) => x > piece.x + 0.01 && x < piece.x + piece.w - 0.01);
  const crossed = inside.length > 0;
  if (!inside.some((x) => Math.abs(x - centre) < nameW / 2 + gap)) return { nameX: centre, crossed, overLine: false };
  const stops = [piece.x, ...inside, piece.x + piece.w];
  let best = null;
  for (let i = 0; i + 1 < stops.length; i++) {
    const a = stops[i] + (i === 0 ? pad : gap);
    const b = stops[i + 1] - (i + 2 === stops.length ? pad : gap);
    if (b - a < nameW) continue;
    const mid = (a + b) / 2;
    const better = !best || b - a > best.room + 0.01 || (Math.abs(b - a - best.room) <= 0.01 && Math.abs(mid - centre) < Math.abs(best.x - centre) - 0.01);
    if (better) best = { x: mid, room: b - a };
  }
  return best ? { nameX: best.x, crossed, overLine: false } : { nameX: centre, crossed, overLine: true };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const { profile, labelPt: pt } = L;
  const ink = profile.palette === 'ink';
  const edgeColour = ink ? EDGE.ink : EDGE.colour;
  const text = profile.colours.ink;
  const font = profile.font;
  const parts = [];
  // A name the ruled line has to pass behind is drawn on a halo of its piece's
  // colour, so the line cannot join its strokes into something else.
  const label = (s, x, baseline, halo) =>
    `<text x="${f2(x)}" y="${f2(baseline)}" text-anchor="middle" font-family="${font}" font-size="${f2(pt)}" font-weight="bold" fill="${text}"${
      halo ? ` stroke="${halo}" stroke-width="${f2(pt * 0.22)}" stroke-linejoin="round" paint-order="stroke"` : ''
    }>${s}</text>`;
  // Names go on last when there is a line to lie under them; a wall with no
  // line is written out piece by piece, exactly as it always was.
  const names = L.lines.length ? [] : parts;
  const outlines = [];

  L.rows.forEach((row, i) => {
    const rowFill = ink ? INK_ROWS[i % INK_ROWS.length] : ROW_COLOURS[i % ROW_COLOURS.length];
    row.pieces.forEach((p) => {
      const fill = p.shaded ? (ink ? SHADE.ink : SHADE.colour) : rowFill;
      parts.push(`<rect x="${f2(p.x)}" y="${f2(p.y)}" width="${f2(p.w)}" height="${f2(p.h)}" fill="${fill}" stroke="${edgeColour}" stroke-width="${f2(L.edge)}"/>`);
      const cx = p.nameX;
      const cy = p.y + p.h / 2;
      const halo = p.overLine ? fill : null;
      if (row.denominator === 1) {
        names.push(label('1', cx, cy + pt * 0.35, halo));
      } else if (L.stacked) {
        // Numerator sitting on a bar with the denominator beneath: the notation
        // the child is taught to read, not "1/8" on one line.
        const barW = stackedBarWidth(row.denominator, pt, p.w);
        const bar = Math.max(MIN_STROKE_PT, BAR_W * pt);
        names.push(label('1', cx, cy - pt * 0.2, halo));
        names.push(`<rect x="${f2(cx - barW / 2)}" y="${f2(cy - bar / 2)}" width="${f2(barW)}" height="${f2(bar)}" fill="${text}"/>`);
        names.push(label(String(row.denominator), cx, cy + pt * 0.95, halo));
      } else {
        // A plain slash, because that is the character the name was measured
        // with; the fitting above cannot vouch for a glyph it has no width for.
        names.push(label(`1/${row.denominator}`, cx, cy + pt * 0.35, halo));
      }
    });
    if (row.shaded) {
      // One heavy outline round the whole shaded run, drawn inside it so the
      // run is no bigger than the pieces it is made of. It is what tells a
      // shaded run from an unshaded one once the colour has been copied away.
      const sw = SHADE_EDGE * L.edge;
      const first = row.pieces[0];
      const last = row.pieces[row.shaded - 1];
      outlines.push(
        `<rect x="${f2(first.x + sw / 2 - L.edge / 2)}" y="${f2(first.y + sw / 2 - L.edge / 2)}" width="${f2(last.x + last.w - first.x - sw + L.edge)}" height="${f2(first.h - sw + L.edge)}" fill="none" stroke-linejoin="miter" stroke="${ink ? SHADE_OUTLINE.ink : SHADE_OUTLINE.colour}" stroke-width="${f2(sw)}"/>`
      );
    }
  });
  parts.push(...outlines);
  // The ruled line lies over the wall and under the names.
  L.lines.forEach((l) => {
    parts.push(`<line x1="${f2(l.x)}" y1="${f2(l.y1)}" x2="${f2(l.x)}" y2="${f2(l.y2)}" stroke="${profile.colours.arrow}" stroke-width="${f2(l.w)}" stroke-linecap="round"/>`);
  });
  if (names !== parts) parts.push(...names);

  const w = f2(L.w);
  const h = f2(L.h);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join('')}</svg>`;
  return { svg, w: L.w, h: L.h, aspect: L.w / L.h, layout: L };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = typeof profileOrSurface === 'string' ? profileFor(profileOrSurface, box || { widthPt: 500 }) : profileOrSurface;
  return `fraction-wall:${p.surface}:${f2(p.widthPt)}x${p.heightPt ? f2(p.heightPt) : '-'}:${JSON.stringify(normalise(spec))}`;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, MAX_ROWS, MAX_LINES };
