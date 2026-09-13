'use strict';

// THE shaded fraction. A shape cut into equal parts with some of them shaded:
// one drawing, placed by the board, the worksheet, the working wall and the
// stick-in pack.
//
// It was three. The board drew PowerPoint shapes (a bar, a grid or a circle,
// shaded soft green), the sheet drew its own SVG bars (shaded question blue at
// a third opacity, stacked with a word under each), and the wall drew a red
// circle and a red bar on a square canvas, each its own module with its own
// field names. A child who shaded a quarter on the board looked up at a wall
// card that shaded it in a different colour on a different shape, and a repair
// to one reached none of the others (13 September 2026). The honest set is one
// picture, the part-whole idea of a fraction, in the shape the lesson asks for;
// the fraction wall, rows of unit fractions to compare, is its own picture
// (fraction-wall-svg.js).
//
// Laid out in points at the size it prints, like the number line: every size
// below is in ems of the surface's font size, so a part and its label are real
// sizes on every surface, and a space too small to show the parts refuses by
// name rather than drawing them as a smudge.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//   normalise(spec)         -> { shape, bars | parts, ... } in one vocabulary
//
// ─── the spec (the board's spelling) ────────────────────────────────────────
//
//   parts     total equal parts (required)
//   shaded    how many are shaded (default 0: a blank shape the child shades)
//   shape     "bar" (default) | "grid" | "circle"
//   rows      grid only: how many rows; otherwise the split keeps cells square
//   bars      a stack of bars to compare, each { parts, shaded, label }; the
//             label names that bar and is drawn under it
//   colour    the shading colour (a 6-character hex); the stick-in pack ignores
//             it, because it is photocopied
//   label     a caption under the whole shape. Not drawn here: the board sets it
//             as typed text the teacher can edit, and a wall card prints it as
//             the card's caption, so drawing it too would print it twice.
//
// The sheet's older spelling ({ bars: [{ numerator, denominator, shaded: true,
// label }] }) and the wall's ({ type: "fractionBar" | "fractionCircle",
// numerator, denominator, colour }) are read here too, so every spec already
// written still draws.

const { textWidthEm } = require('../text/comic-glyph-width');
const { profileFor } = require('./surface-profiles');

// ─── CONSTANTS (in ems of the profile's font size unless named) ──────────────
const OUTLINE = 0.1; // the shape's outline, heavier than the cuts so it reads as one shape
const DIVIDER = 0.07; // the cut between two parts
const MIN_STROKE_PT = 0.75; // points: thinner than this and a cut vanishes on paper
const BAR_SHARE = 0.2; // a bar's depth as a share of its width, before the limits below
const BAR_H_MIN = 2.5;
const BAR_H_MAX = 5;
const BAR_GAP = 1; // between two bars in a stack
const LABEL_GAP = 0.3; // between a bar and the word under it
const BAND = 1.3; // one line of text, with its leading
const CIRCLE_D = 12; // a circle's natural diameter
const CIRCLE_D_MIN = 4; // in ems of the readable floor: smaller and the sectors blur
const GRID_CELL = 4; // a grid cell's natural side
// The narrowest a part may print. A part carries no words, so this is about
// counting and shading it, not reading it: tied to the text floor at 1.5 ems it
// asked 27pt a part on the board, and a Year 4 vocabulary card's 20-part strip,
// clearly countable at about 0.3in a part, was refused (13 September 2026).
const MIN_PART = 0.9; // in ems of the readable floor
const MIN_PART_PT = 11; // and never under this, so a paper part still takes a pencil
const MAX_PARTS = 60;
const DEFAULT_SHADE = '#A9DFBF'; // the board's soft green, the deck's answer-green family
const INK_SHADE = '#BFBFBF'; // photocopied: a mid grey that still shows as shaded
const LINE = { colour: '#333333', ink: '#1A1A1A' };
// ────────────────────────────────────────────────────────────────────────────

function f2(n) {
  return Math.round(n * 100) / 100;
}

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function wholeNumber(v) {
  if (typeof v === 'number') return Number.isInteger(v) ? v : NaN;
  if (typeof v === 'string' && /^\s*\d+\s*$/.test(v)) return Number(v);
  return NaN;
}

// One bar, circle or grid's parts and shading, from any surface's spelling.
function readParts(raw, where) {
  const fromWallOrSheet = raw.denominator != null && raw.parts == null;
  const parts = wholeNumber(fromWallOrSheet ? raw.denominator : raw.parts);
  if (!(parts >= 1) || parts > MAX_PARTS) {
    throw new Error(
      `SHADED_FRACTION_INVALID: ${where} needs \`parts\`, a whole number from 1 to ${MAX_PARTS} (got ${JSON.stringify(fromWallOrSheet ? raw.denominator : raw.parts)}).`
    );
  }
  let shaded;
  if (fromWallOrSheet) {
    // The sheet's bars said `shaded: false` to draw a bar with its numerator
    // left blank, so `shaded` there is a switch, not a count.
    shaded = raw.shaded === false ? 0 : wholeNumber(raw.numerator == null ? 0 : raw.numerator);
  } else {
    shaded = raw.shaded == null || raw.shaded === false ? 0 : wholeNumber(raw.shaded);
  }
  if (!(shaded >= 0)) {
    throw new Error(`SHADED_FRACTION_INVALID: ${where} has a shaded count that is not a whole number.`);
  }
  // The board used to clamp this quietly and the sheet drew the extra parts off
  // the end of the bar. Neither is a picture of the fraction asked for: one
  // shape cannot show more parts shaded than it has.
  if (shaded > parts) {
    throw new Error(
      `SHADED_FRACTION_INVALID: ${where} shades ${shaded} of ${parts} parts. One shape cannot show more than its whole; ` +
        'draw a second shape for the extra parts.'
    );
  }
  return { parts, shaded };
}

function normalise(spec = {}) {
  let shape = String(spec.shape || '').toLowerCase();
  if (!shape) shape = spec.type === 'fractionCircle' ? 'circle' : 'bar';
  if (!['bar', 'grid', 'circle'].includes(shape)) {
    throw new Error(`SHADED_FRACTION_INVALID: shape ${JSON.stringify(spec.shape)} is not a shape this draws; use "bar", "grid" or "circle".`);
  }
  const colour = spec.colour ? `#${String(spec.colour).replace(/^#/, '')}` : null;
  if (Array.isArray(spec.bars)) {
    if (shape !== 'bar') {
      throw new Error('SHADED_FRACTION_INVALID: `bars` stacks bars to compare; a stack of circles or grids is two pictures side by side.');
    }
    if (!spec.bars.length) throw new Error('SHADED_FRACTION_INVALID: `bars` is empty; give at least one bar.');
    return {
      shape,
      colour,
      bars: spec.bars.map((b, i) => ({ ...readParts(b || {}, `bar ${i + 1}`), label: b && b.label != null ? String(b.label) : '' })),
    };
  }
  const { parts, shaded } = readParts(spec, 'this shaded fraction');
  const out = { shape, colour, parts, shaded };
  if (shape === 'bar') out.bars = [{ parts, shaded, label: '' }];
  if (shape === 'grid') {
    const rows = wholeNumber(spec.rows);
    out.rows = rows >= 1 && parts % rows === 0 ? rows : null;
  }
  return out;
}

function widthPt(text, pt, bold) {
  return textWidthEm(String(text), bold) * pt;
}

function strokes(T, profile) {
  return {
    outline: Math.max(MIN_STROKE_PT * 1.5, OUTLINE * T),
    divider: Math.max(MIN_STROKE_PT, DIVIDER * T),
  };
}

function tooSmall(what, profile) {
  return new Error(
    `SHADED_FRACTION_TOO_SMALL: ${what} at the ${profile.minFontPt}pt readable size this surface needs. ` +
      'Give the picture more room, or use fewer parts; the parts were not squeezed until they could not be counted.'
  );
}

// The grid's rows and columns: the stated rows, else the split closest to a
// 4 by 3 landscape, the same on every surface. The board used to pick the split
// from its zone's shape, so twelve parts came out 2 by 6 on a slide and 3 by 4
// on paper, and a child comparing the two saw two different pictures.
const GRID_SHAPE = [4, 3];

function gridSplit(parts, rowsHint, boxW = GRID_SHAPE[0], boxH = GRID_SHAPE[1]) {
  if (rowsHint) return { rows: rowsHint, cols: parts / rowsHint };
  let best = null;
  for (let r = 1; r <= parts; r++) {
    if (parts % r !== 0) continue;
    const cols = parts / r;
    const cell = Math.min(boxW / cols, boxH / r);
    const score = Math.abs(Math.log(boxW / cols / (boxH / r)));
    if (!best || score < best.score - 1e-9 || (Math.abs(score - best.score) < 1e-9 && cell > best.cell)) best = { rows: r, cols, score, cell };
  }
  return { rows: best.rows, cols: best.cols };
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = typeof profileOrSurface === 'string' ? profileFor(profileOrSurface, box || { widthPt: 500 }) : profileOrSurface;
  const n = normalise(spec);
  const W = profile.widthPt;
  const H = profile.heightPt; // only the board has one
  const T = profile.fontPt;
  const floor = profile.minFontPt;
  const st = strokes(T, profile);
  const half = st.outline / 2;
  const grow = profile.grow || 1;

  if (n.shape === 'bar') {
    const bars = n.bars;
    const minPart = Math.max(...bars.map((b) => b.parts));
    if ((W - st.outline) / minPart < Math.max(MIN_PART_PT, MIN_PART * floor)) throw tooSmall(`a bar of ${minPart} parts cannot fit its parts across this width`, profile);
    // One word size for every bar's label, so the stack reads as one picture.
    let labelPt = T;
    bars.forEach((b) => {
      if (b.label && widthPt(b.label, labelPt, profile.bold) > W) labelPt = (labelPt * W) / widthPt(b.label, labelPt, profile.bold);
    });
    if (labelPt < floor) throw tooSmall('a bar label is too long to fit under its bar', profile);
    const labelled = bars.filter((b) => b.label).length;
    const textH = labelled * (half + LABEL_GAP * labelPt + BAND * labelPt);
    const gaps = (bars.length - 1) * BAR_GAP * T;
    let barH = Math.min(BAR_H_MAX * T, Math.max(BAR_H_MIN * T, BAR_SHARE * W));
    if (H) {
      const room = (H - textH - gaps - st.outline) / bars.length;
      barH = Math.min(barH * grow, room);
      // The bar itself carries no words, so it may go as shallow as a part may be
      // narrow; only its labels are held to the text floor.
      if (barH < Math.max(MIN_PART_PT, MIN_PART * floor)) {
        throw new Error(
          `SHADED_FRACTION_ZONE_TOO_SHALLOW: ${bars.length} bar${bars.length === 1 ? '' : 's'} cannot show their parts and labels in a space this shallow. ` +
            'Give the picture more height, or show fewer bars on it.'
        );
      }
    }
    const rows = [];
    let y = half;
    bars.forEach((b, i) => {
      const cellW = (W - st.outline) / b.parts;
      const cells = [];
      for (let k = 0; k < b.parts; k++) cells.push({ x: half + k * cellW, y, w: cellW, h: barH, shaded: k < b.shaded });
      const row = { x: half, y, w: W - st.outline, h: barH, cells, label: null };
      y += barH;
      if (b.label) {
        const top = y + half + LABEL_GAP * labelPt;
        const lw = widthPt(b.label, labelPt, profile.bold);
        row.label = { text: b.label, x: W / 2 - lw / 2, y: top, w: lw, h: BAND * labelPt };
        y = top + BAND * labelPt;
      }
      rows.push(row);
      if (i < bars.length - 1) y += BAR_GAP * T;
    });
    return { shape: 'bar', w: W, h: y + half, rows, labelPt, strokes: st, profile, colour: n.colour };
  }

  if (n.shape === 'circle') {
    // Paper and the wall draw the circle at its natural size; the board grows it
    // into its zone, because a circle read from the back of the room was always
    // drawn as big as the zone allowed.
    let D = H ? Math.min(W, H, CIRCLE_D * T * grow) : Math.min(W, CIRCLE_D * T);
    D -= st.outline;
    if (D < CIRCLE_D_MIN * floor) throw tooSmall(`a circle cut into ${n.parts} parts cannot show them`, profile);
    const r = D / 2;
    const c = half + r;
    return { shape: 'circle', w: D + st.outline, h: D + st.outline, cx: c, cy: c, r, parts: n.parts, shaded: n.shaded, strokes: st, profile, colour: n.colour };
  }

  // grid
  const { rows, cols } = gridSplit(n.parts, n.rows);
  let side = Math.min(GRID_CELL * T, (W - st.outline) / cols);
  if (H) side = Math.min(GRID_CELL * T * grow, (W - st.outline) / cols, (H - st.outline) / rows);
  if (side < Math.max(MIN_PART_PT, MIN_PART * floor)) throw tooSmall(`a grid of ${rows} by ${cols} cannot fit its parts`, profile);
  const cells = [];
  for (let k = 0; k < n.parts; k++) {
    cells.push({ x: half + (k % cols) * side, y: half + Math.floor(k / cols) * side, w: side, h: side, shaded: k < n.shaded });
  }
  return { shape: 'grid', w: cols * side + st.outline, h: rows * side + st.outline, rows, cols, side, cells, strokes: st, profile, colour: n.colour };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const { profile, strokes: st } = L;
  const ink = profile.palette === 'ink';
  const shade = ink ? INK_SHADE : L.colour || DEFAULT_SHADE;
  const line = ink ? LINE.ink : LINE.colour;
  const paper = profile.colours.paper;
  const parts = [];

  const rectCells = (cells) => {
    cells.forEach((c) => {
      if (c.shaded) parts.push(`<rect x="${f2(c.x)}" y="${f2(c.y)}" width="${f2(c.w)}" height="${f2(c.h)}" fill="${shade}"/>`);
      else parts.push(`<rect x="${f2(c.x)}" y="${f2(c.y)}" width="${f2(c.w)}" height="${f2(c.h)}" fill="${paper}"/>`);
    });
  };

  if (L.shape === 'bar') {
    L.rows.forEach((row) => {
      rectCells(row.cells);
      row.cells.slice(1).forEach((c) => {
        parts.push(`<line x1="${f2(c.x)}" y1="${f2(row.y)}" x2="${f2(c.x)}" y2="${f2(row.y + row.h)}" stroke="${line}" stroke-width="${f2(st.divider)}"/>`);
      });
      parts.push(`<rect x="${f2(row.x)}" y="${f2(row.y)}" width="${f2(row.w)}" height="${f2(row.h)}" fill="none" stroke="${line}" stroke-width="${f2(st.outline)}"/>`);
      if (row.label) {
        const weight = profile.bold ? ' font-weight="bold"' : '';
        parts.push(
          `<text x="${f2(row.label.x + row.label.w / 2)}" y="${f2(row.label.y + L.labelPt * 0.95)}" text-anchor="middle" font-family="${profile.font}" font-size="${f2(L.labelPt)}"${weight} fill="${profile.colours.ink}">${esc(row.label.text)}</text>`
        );
      }
    });
  } else if (L.shape === 'grid') {
    rectCells(L.cells);
    for (let c = 1; c < L.cols; c++) {
      const x = st.outline / 2 + c * L.side;
      parts.push(`<line x1="${f2(x)}" y1="${f2(st.outline / 2)}" x2="${f2(x)}" y2="${f2(L.h - st.outline / 2)}" stroke="${line}" stroke-width="${f2(st.divider)}"/>`);
    }
    for (let r = 1; r < L.rows; r++) {
      const y = st.outline / 2 + r * L.side;
      parts.push(`<line x1="${f2(st.outline / 2)}" y1="${f2(y)}" x2="${f2(L.w - st.outline / 2)}" y2="${f2(y)}" stroke="${line}" stroke-width="${f2(st.divider)}"/>`);
    }
    parts.push(`<rect x="${f2(st.outline / 2)}" y="${f2(st.outline / 2)}" width="${f2(L.w - st.outline)}" height="${f2(L.h - st.outline)}" fill="none" stroke="${line}" stroke-width="${f2(st.outline)}"/>`);
  } else {
    const { cx, cy, r } = L;
    if (L.parts === 1) {
      parts.push(`<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(r)}" fill="${L.shaded ? shade : paper}"/>`);
    } else {
      // Sectors from twelve o'clock, clockwise, so a quarter sits where a child
      // expects it; every cut runs from the centre to the rim.
      const sweep = (2 * Math.PI) / L.parts;
      const at = (k) => [cx + r * Math.cos(-Math.PI / 2 + k * sweep), cy + r * Math.sin(-Math.PI / 2 + k * sweep)];
      for (let k = 0; k < L.parts; k++) {
        const [x1, y1] = at(k);
        const [x2, y2] = at(k + 1);
        const large = sweep > Math.PI ? 1 : 0;
        parts.push(
          `<path d="M${f2(cx)} ${f2(cy)} L${f2(x1)} ${f2(y1)} A${f2(r)} ${f2(r)} 0 ${large} 1 ${f2(x2)} ${f2(y2)} Z" fill="${k < L.shaded ? shade : paper}"/>`
        );
      }
      for (let k = 0; k < L.parts; k++) {
        const [x, y] = at(k);
        parts.push(`<line x1="${f2(cx)}" y1="${f2(cy)}" x2="${f2(x)}" y2="${f2(y)}" stroke="${line}" stroke-width="${f2(st.divider)}"/>`);
      }
    }
    parts.push(`<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(r)}" fill="none" stroke="${line}" stroke-width="${f2(st.outline)}"/>`);
  }

  const w = f2(L.w);
  const h = f2(L.h);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join('')}</svg>`;
  return { svg, w: L.w, h: L.h, aspect: L.w / L.h, layout: L };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = typeof profileOrSurface === 'string' ? profileFor(profileOrSurface, box || { widthPt: 500 }) : profileOrSurface;
  return `shaded-fraction:${p.surface}:${f2(p.widthPt)}x${p.heightPt ? f2(p.heightPt) : '-'}:${JSON.stringify(normalise(spec))}`;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, MAX_PARTS };
