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
//   normalise(spec)         -> { fractions }
//
// ─── the spec ────────────────────────────────────────────────────────────
//
//   fractions   the rows, top to bottom, as the denominator of each row's
//               pieces (default [1, 2, 3, 4]); 1 is the whole

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
  return { fractions };
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = typeof profileOrSurface === 'string' ? profileFor(profileOrSurface, box || { widthPt: 500 }) : profileOrSurface;
  const { fractions } = normalise(spec);
  const W = profile.widthPt;
  const H = profile.heightPt;
  const bold = true; // names on a wall are read against colour, so they are always bold
  const edge = Math.max(MIN_STROKE_PT, BORDER * profile.fontPt);
  const inner = W - edge;
  const rows = fractions.length;

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
    const room = (H - edge) / rows;
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

  const layout = [];
  fractions.forEach((d, i) => {
    const y = edge / 2 + i * rowH;
    const pieceW = inner / d;
    const pieces = [];
    for (let k = 0; k < d; k++) pieces.push({ x: edge / 2 + k * pieceW, y, w: pieceW, h: rowH });
    layout.push({ denominator: d, y, h: rowH, pieces });
  });
  return { w: W, h: rows * rowH + edge, rows: layout, labelPt, stacked, edge, profile };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const { profile, labelPt: pt } = L;
  const ink = profile.palette === 'ink';
  const edgeColour = ink ? EDGE.ink : EDGE.colour;
  const text = profile.colours.ink;
  const font = profile.font;
  const parts = [];
  const label = (s, x, baseline) =>
    `<text x="${f2(x)}" y="${f2(baseline)}" text-anchor="middle" font-family="${font}" font-size="${f2(pt)}" font-weight="bold" fill="${text}">${s}</text>`;

  L.rows.forEach((row, i) => {
    const fill = ink ? INK_ROWS[i % INK_ROWS.length] : ROW_COLOURS[i % ROW_COLOURS.length];
    row.pieces.forEach((p) => {
      parts.push(`<rect x="${f2(p.x)}" y="${f2(p.y)}" width="${f2(p.w)}" height="${f2(p.h)}" fill="${fill}" stroke="${edgeColour}" stroke-width="${f2(L.edge)}"/>`);
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h / 2;
      if (row.denominator === 1) {
        parts.push(label('1', cx, cy + pt * 0.35));
      } else if (L.stacked) {
        // Numerator sitting on a bar with the denominator beneath: the notation
        // the child is taught to read, not "1/8" on one line.
        const barW = Math.min(p.w * 0.6, textWidthEm(String(row.denominator), true) * pt * 1.3);
        const bar = Math.max(MIN_STROKE_PT, BAR_W * pt);
        parts.push(label('1', cx, cy - pt * 0.2));
        parts.push(`<rect x="${f2(cx - barW / 2)}" y="${f2(cy - bar / 2)}" width="${f2(barW)}" height="${f2(bar)}" fill="${text}"/>`);
        parts.push(label(String(row.denominator), cx, cy + pt * 0.95));
      } else {
        // A plain slash, because that is the character the name was measured
        // with; the fitting above cannot vouch for a glyph it has no width for.
        parts.push(label(`1/${row.denominator}`, cx, cy + pt * 0.35));
      }
    });
  });

  const w = f2(L.w);
  const h = f2(L.h);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join('')}</svg>`;
  return { svg, w: L.w, h: L.h, aspect: L.w / L.h, layout: L };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = typeof profileOrSurface === 'string' ? profileFor(profileOrSurface, box || { widthPt: 500 }) : profileOrSurface;
  return `fraction-wall:${p.surface}:${f2(p.widthPt)}x${p.heightPt ? f2(p.heightPt) : '-'}:${JSON.stringify(normalise(spec))}`;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, MAX_ROWS };
