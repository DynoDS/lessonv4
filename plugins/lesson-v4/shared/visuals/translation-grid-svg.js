'use strict';

// THE translation grid: one marker moved from a start position to an end
// position on a numbered squared grid, with a dashed arrow between them, for
// "how far has it moved?" work. One drawing, placed by the board, the
// worksheet, the working wall and the stick-in pack.
//
// The start marker is orange (the given position the child reads from) and the
// end marker blue; the arrow makes the slide-and-no-turn of a translation
// visible. Numbered across and up so the move is read in squares.
//
// Until 13 September 2026 only the board could draw it, from PowerPoint shapes
// with 11pt axis numbers. The newer translation-shape picture
// (translation-shape-svg.js) moves a whole shape rather than one marker; this
// one stays so every deck written with it still draws.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//
// ─── the spec ────────────────────────────────────────────────────────────
//
//   max        the grid runs 0..max on both axes (default 10)
//   xMax, yMax override either range
//   from, to   { x, y } the start and end positions, in squares (x across, y up)
//   fromLabel  the letter on the start marker (default "A")
//   toLabel    the letter on the end marker (default "B")
//   showArrow  false leaves the arrow off, so children work out the direction
//              of the move themselves; nothing else moves when it is off

const { profileFor } = require('./surface-profiles');
const { textWidthEm } = require('../text/comic-glyph-width');

// ─── CONSTANTS ─────────────────────────────────────────────────────────────
const CELL_EM = 2.2; // natural square side, in ems of the profile font
const NUM_SHARE = 0.72; // the axis numbers may take this much of a square
const GUTTER_GAP = 0.3; // ems between an axis and its numbers
const MARKER = 0.78; // marker side as a share of a square
const MARKER_MAX = 1; // a marker may grow to a whole square to keep its letter readable
const GRID_W = 0.03; const GRID_W_MIN = 0.5; // share of a square, pt
const AXIS_W = 0.07; const AXIS_W_MIN = 1.4;
const MARKER_W = 0.08; const MARKER_W_MIN = 1.4;
const ARROW_W = 0.075; const ARROW_W_MIN = 1.5;
const HEAD = 0.32; // arrowhead length, in squares
const PAD = 0.45; // squares of margin at the top and right: room for half a marker
const GRID_COLOUR = '#8C8C8C';
const AXIS_COLOUR = '#333333';
const ARROW_COLOUR = '#555555';
const FROM_FILL = '#FBE2C7'; // pale orange body
const TO_FILL = '#CCE2F5'; // pale blue body
// ────────────────────────────────────────────────────────────────────────────

function f2(n) {
  return Math.round(n * 100) / 100;
}

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function asProfile(profileOrSurface, box) {
  return typeof profileOrSurface === 'string' ? profileFor(profileOrSurface, box || { widthPt: 500 }) : profileOrSurface;
}

function normalise(spec = {}) {
  const max = Number.isFinite(spec.max) && spec.max > 0 ? spec.max : 10;
  const xMax = Number.isFinite(spec.xMax) && spec.xMax > 0 ? spec.xMax : max;
  const yMax = Number.isFinite(spec.yMax) && spec.yMax > 0 ? spec.yMax : max;
  const point = (p, d) => ({ x: p && Number.isFinite(Number(p.x)) ? Number(p.x) : d.x, y: p && Number.isFinite(Number(p.y)) ? Number(p.y) : d.y });
  const from = point(spec.from, { x: 0, y: 0 });
  const to = point(spec.to, { x: xMax, y: yMax });
  // A marker off the grid would be drawn outside the picture, and the move a
  // child reads would be a move nobody can count.
  [['from', from], ['to', to]].forEach(([name, p]) => {
    if (p.x < 0 || p.y < 0 || p.x > xMax || p.y > yMax) {
      throw new Error(`TRANSLATION_GRID_POINT_OFF_GRID: ${name} (${p.x}, ${p.y}) is not on a grid running 0 to ${xMax} across and 0 to ${yMax} up.`);
    }
  });
  return {
    xMax,
    yMax,
    from,
    to,
    fromLabel: spec.fromLabel == null ? 'A' : String(spec.fromLabel),
    toLabel: spec.toLabel == null ? 'B' : String(spec.toLabel),
    showArrow: spec.showArrow !== false,
  };
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = asProfile(profileOrSurface, box);
  const g = normalise(spec);
  const bold = true;
  const T = Math.max(profile.fontPt, profile.minFontPt);
  const widest = Math.max(textWidthEm(String(g.xMax), bold), textWidthEm(String(g.yMax), bold));
  // Solve the square size with the gutters the numbers need at that size.
  const layoutFor = (cell) => {
    const numPt = Math.min(T, cell * NUM_SHARE, (cell * 0.95) / Math.max(widest, 0.6));
    const left = widest * numPt + GUTTER_GAP * numPt + cell * 0.15;
    const bottom = numPt * 1.2 + GUTTER_GAP * numPt;
    return { numPt, left, bottom, w: left + (g.xMax + PAD) * cell, h: (g.yMax + PAD) * cell + bottom };
  };
  let cell = CELL_EM * profile.fontPt * (profile.grow || 1);
  for (let pass = 0; pass < 4; pass++) {
    const l = layoutFor(cell);
    const byW = (profile.widthPt - l.left) / (g.xMax + PAD);
    const byH = profile.heightPt ? (profile.heightPt - l.bottom) / (g.yMax + PAD) : Infinity;
    cell = Math.min(CELL_EM * profile.fontPt * (profile.grow || 1), byW, byH);
  }
  const l = layoutFor(cell);
  const letterPt = Math.min(T, cell * MARKER_MAX * 0.72);
  const markerSide = Math.min(cell * MARKER_MAX, Math.max(cell * MARKER, letterPt / 0.72));
  if (!(cell > 0) || l.numPt < profile.minFontPt * 0.999 || letterPt < profile.minFontPt * 0.999) {
    throw new Error(
      `TRANSLATION_GRID_TOO_SMALL: the axis numbers and marker letters cannot print at the ${profile.minFontPt}pt readable minimum on squares this small. ` +
        'Give the grid more room, or use a smaller grid (max).'
    );
  }
  return { ...l, cell, letterPt, markerSide, grid: g, profile, ox: l.left, top: PAD * cell };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const { cell, profile, grid: g } = L;
  const c = profile.colours;
  const ink = profile.palette === 'ink';
  const font = profile.font;
  const gridW = g.xMax * cell;
  const gridH = g.yMax * cell;
  const px = (x) => L.ox + x * cell;
  const py = (y) => L.top + gridH - y * cell;
  const parts = [];
  const gw = f2(Math.max(GRID_W * cell, GRID_W_MIN));
  for (let i = 0; i <= g.xMax; i++) parts.push(`<line x1="${f2(px(i))}" y1="${f2(L.top)}" x2="${f2(px(i))}" y2="${f2(L.top + gridH)}" stroke="${GRID_COLOUR}" stroke-width="${gw}"/>`);
  for (let j = 0; j <= g.yMax; j++) parts.push(`<line x1="${f2(L.ox)}" y1="${f2(py(j))}" x2="${f2(L.ox + gridW)}" y2="${f2(py(j))}" stroke="${GRID_COLOUR}" stroke-width="${gw}"/>`);
  const aw = f2(Math.max(AXIS_W * cell * 0.5, AXIS_W_MIN));
  const axis = ink ? c.ink : AXIS_COLOUR;
  parts.push(`<line x1="${f2(L.ox)}" y1="${f2(py(0))}" x2="${f2(L.ox + gridW)}" y2="${f2(py(0))}" stroke="${axis}" stroke-width="${aw}"/>`);
  parts.push(`<line x1="${f2(L.ox)}" y1="${f2(L.top)}" x2="${f2(L.ox)}" y2="${f2(py(0))}" stroke="${axis}" stroke-width="${aw}"/>`);
  const num = (s, x, y, anchor) =>
    `<text x="${f2(x)}" y="${f2(y)}" text-anchor="${anchor}" font-family="${font}" font-size="${f2(L.numPt)}" font-weight="bold" fill="${c.ink}">${s}</text>`;
  for (let i = 0; i <= g.xMax; i++) parts.push(num(i, px(i), py(0) + GUTTER_GAP * L.numPt + L.numPt * 0.95, 'middle'));
  for (let j = 0; j <= g.yMax; j++) parts.push(num(j, L.ox - GUTTER_GAP * L.numPt, py(j) + L.numPt * 0.35, 'end'));

  if (g.showArrow) {
    const x1 = px(g.from.x); const y1 = py(g.from.y);
    const x2 = px(g.to.x); const y2 = py(g.to.y);
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len > 0) {
      const ux = (x2 - x1) / len;
      const uy = (y2 - y1) / len;
      // The arrow runs centre to centre under the markers, its head stopping at
      // the end marker's edge so the point is not hidden beneath it.
      const stop = L.markerSide / 2 / Math.max(Math.abs(ux), Math.abs(uy));
      const tipX = x2 - ux * stop;
      const tipY = y2 - uy * stop;
      const head = HEAD * cell;
      const colour = ink ? c.ink : ARROW_COLOUR;
      parts.push(`<line x1="${f2(x1)}" y1="${f2(y1)}" x2="${f2(tipX - ux * head * 0.8)}" y2="${f2(tipY - uy * head * 0.8)}" stroke="${colour}" stroke-width="${f2(Math.max(ARROW_W * cell * 0.4, ARROW_W_MIN))}" stroke-dasharray="${f2(cell * 0.18)} ${f2(cell * 0.12)}"/>`);
      const bx = tipX - ux * head; const by = tipY - uy * head;
      parts.push(`<polygon points="${f2(tipX)},${f2(tipY)} ${f2(bx - uy * head * 0.45)},${f2(by + ux * head * 0.45)} ${f2(bx + uy * head * 0.45)},${f2(by - ux * head * 0.45)}" fill="${colour}"/>`);
    }
  }

  const marker = (p, fill, line, label) => {
    const side = L.markerSide;
    const cx = px(p.x); const cy = py(p.y);
    parts.push(`<rect x="${f2(cx - side / 2)}" y="${f2(cy - side / 2)}" width="${f2(side)}" height="${f2(side)}" fill="${ink ? c.paper : fill}" stroke="${line}" stroke-width="${f2(Math.max(MARKER_W * cell * 0.4, MARKER_W_MIN))}"/>`);
    if (label) parts.push(`<text x="${f2(cx)}" y="${f2(cy + L.letterPt * 0.35)}" text-anchor="middle" font-family="${font}" font-size="${f2(L.letterPt)}" font-weight="bold" fill="${line}">${esc(label)}</text>`);
  };
  marker(g.from, FROM_FILL, c.highlight === '#8C8C8C' ? c.ink : c.highlight, g.fromLabel);
  marker(g.to, TO_FILL, c.label, g.toLabel);

  // Markers at the grid's edge overhang it by half a marker.
  const over = L.markerSide / 2;
  const w = f2(Math.max(L.w, px(g.xMax) + over + 1));
  const h = f2(L.h);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join('')}</svg>`;
  return { svg, w: Number(w), h: L.h, aspect: Number(w) / L.h, layout: L };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = asProfile(profileOrSurface, box);
  return `translation-grid:${p.surface}:${f2(p.widthPt)}x${p.heightPt ? f2(p.heightPt) : '-'}:${JSON.stringify(normalise(spec))}`;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout };
