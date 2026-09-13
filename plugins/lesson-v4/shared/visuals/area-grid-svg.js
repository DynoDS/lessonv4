'use strict';

// THE area grid. One drawing, placed by the board, the worksheet, the working
// wall and the stick-in pack.
//
// A squared grid with one or more labelled rectangular patches on it: the
// "each square = 1m², find the area of each patch" layout. Children count
// squares, or multiply side lengths, for each named region. Cells are always
// square, so a counted square genuinely equals a unit of area.
//
// Until 13 September 2026 only the board could draw it, from PowerPoint shapes,
// so a lesson that counted patches on the board had no copy of the grid for the
// sheet, the wall or a child's book. Each surface now passes only the box it
// has and its profile (shared/visuals/surface-profiles.js). The tiny array cue
// beside a success-criteria step stays its own drawing (area-grid-cue-svg.js).
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//
// ─── the spec ────────────────────────────────────────────────────────────
//
//   cols, rows   the grid in unit squares (default 10 by 6)
//   unitLabel    the key under the grid, e.g. "Each square = 1m²"
//   rects        [{ x, y, w, h, label, color }]
//                  x, y   the patch's top-left corner in squares from the
//                         TOP-LEFT of the grid (x across, y down), which is how
//                         a child reads a printed grid
//                  w, h   its width and height in squares
//                  label  the name printed in the patch ("A")
//                  color  a hex fill; otherwise a pale palette cycles

const { profileFor } = require('./surface-profiles');
const { textWidthEm } = require('../text/comic-glyph-width');

// ─── CONSTANTS ─────────────────────────────────────────────────────────────
const CELL_EM = 2.4; // natural square side, in ems of the profile font (about 9mm on a sheet)
const GRID_W = 0.03; const GRID_W_MIN = 0.5; // share of a cell, pt
const FRAME_W = 0.07; const FRAME_W_MIN = 1.2;
const PATCH_W = 0.08; const PATCH_W_MIN = 1.5;
const LABEL_FILL = 0.7; // a patch name may take this much of the patch's shorter side
const KEY_GAP = 0.4; // ems between the grid and its key
const PAD = 0.1; // share of a cell
const GRID_COLOUR = '#8C8C8C'; // a mid grey that stays visible on the warm slide background
const FRAME_COLOUR = '#333333';
// Pale fills, so every unit square's gridline stays countable through a patch.
const PATCH_FILLS = ['#FBE2C7', '#CCE2F5', '#D5F5E3', '#EAD5F5', '#FFF2CC', '#FAD4D4'];
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

function positive(v, d) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
}

function normalise(spec = {}) {
  const cols = Math.round(positive(spec.cols, 10));
  const rows = Math.round(positive(spec.rows, 6));
  const rects = (Array.isArray(spec.rects) ? spec.rects : []).map((r, i) => {
    const out = { x: Number(r.x) || 0, y: Number(r.y) || 0, w: positive(r.w, 1), h: positive(r.h, 1), label: r.label == null ? '' : String(r.label), color: r.color || null };
    // A patch hanging off the grid would print squares a child cannot count,
    // and an area that disagrees with the question.
    if (out.x < 0 || out.y < 0 || out.x + out.w > cols + 1e-9 || out.y + out.h > rows + 1e-9) {
      throw new Error(`AREA_GRID_PATCH_OFF_GRID: patch ${out.label || i + 1} (${out.x}, ${out.y}, ${out.w} by ${out.h}) does not fit on a ${cols} by ${rows} grid.`);
    }
    return out;
  });
  return { cols, rows, rects, unitLabel: spec.unitLabel ? String(spec.unitLabel) : '' };
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = asProfile(profileOrSurface, box);
  const g = normalise(spec);
  const T = Math.max(profile.fontPt, profile.minFontPt);
  const keyH = g.unitLabel ? T * (1.3 + KEY_GAP) : 0;
  let cell = CELL_EM * profile.fontPt * (profile.grow || 1);
  cell = Math.min(cell, profile.widthPt / (g.cols + 2 * PAD));
  if (profile.heightPt) cell = Math.min(cell, (profile.heightPt - keyH) / (g.rows + 2 * PAD));
  const shortest = g.rects.length ? Math.min(...g.rects.map((r) => Math.min(r.w, r.h))) : Infinity;
  const labelPt = Math.min(T * 1.2, shortest * cell * LABEL_FILL);
  if (g.rects.some((r) => r.label) && labelPt < profile.minFontPt * 0.999) {
    throw new Error(
      `AREA_GRID_TOO_SMALL: the patch names cannot print at the ${profile.minFontPt}pt readable minimum on squares this small. ` +
        'Give the grid more room, or use fewer squares.'
    );
  }
  const keyPt = g.unitLabel ? Math.min(T, (profile.widthPt / Math.max(1, textWidthEm(g.unitLabel, profile.bold))) * 0.98) : 0;
  if (g.unitLabel && keyPt < profile.minFontPt * 0.999) {
    throw new Error('AREA_GRID_TOO_SMALL: the key under the grid does not fit across this space at a readable size. Shorten it or give the grid more width.');
  }
  const pad = PAD * cell;
  const gridW = g.cols * cell;
  const gridH = g.rows * cell;
  const w = Math.max(gridW + 2 * pad, g.unitLabel ? textWidthEm(g.unitLabel, profile.bold) * keyPt + 2 * pad : 0);
  const h = gridH + 2 * pad + keyH;
  return { w, h, cell, pad, gridW, gridH, ox: (w - gridW) / 2, oy: pad, labelPt, keyPt, T, grid: g, profile };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const { cell, ox, oy, profile, grid: g } = L;
  const c = profile.colours;
  const ink = profile.palette === 'ink';
  const weight = profile.bold ? ' font-weight="bold"' : '';
  const px = (x) => ox + x * cell;
  const py = (y) => oy + y * cell;
  const parts = [];
  // Fills first, under the gridlines, so every unit square stays countable.
  g.rects.forEach((r, i) => {
    const fill = ink ? c.highlight : r.color ? `#${String(r.color).replace('#', '')}` : PATCH_FILLS[i % PATCH_FILLS.length];
    const opacity = ink ? ' fill-opacity="0.22"' : '';
    parts.push(`<rect x="${f2(px(r.x))}" y="${f2(py(r.y))}" width="${f2(r.w * cell)}" height="${f2(r.h * cell)}" fill="${fill}"${opacity}/>`);
  });
  const gw = f2(Math.max(GRID_W * cell, GRID_W_MIN));
  const gridColour = ink ? '#8C8C8C' : GRID_COLOUR;
  for (let i = 0; i <= g.cols; i++) parts.push(`<line x1="${f2(px(i))}" y1="${f2(oy)}" x2="${f2(px(i))}" y2="${f2(oy + L.gridH)}" stroke="${gridColour}" stroke-width="${gw}"/>`);
  for (let j = 0; j <= g.rows; j++) parts.push(`<line x1="${f2(ox)}" y1="${f2(py(j))}" x2="${f2(ox + L.gridW)}" y2="${f2(py(j))}" stroke="${gridColour}" stroke-width="${gw}"/>`);
  parts.push(`<rect x="${f2(ox)}" y="${f2(oy)}" width="${f2(L.gridW)}" height="${f2(L.gridH)}" fill="none" stroke="${ink ? c.ink : FRAME_COLOUR}" stroke-width="${f2(Math.max(FRAME_W * cell * 0.5, FRAME_W_MIN))}"/>`);
  // Outlines and names on top, so each patch reads as one region.
  g.rects.forEach((r) => {
    parts.push(`<rect x="${f2(px(r.x))}" y="${f2(py(r.y))}" width="${f2(r.w * cell)}" height="${f2(r.h * cell)}" fill="none" stroke="${c.arrow}" stroke-width="${f2(Math.max(PATCH_W * cell * 0.4, PATCH_W_MIN))}"/>`);
    if (r.label) {
      parts.push(
        `<text x="${f2(px(r.x + r.w / 2))}" y="${f2(py(r.y + r.h / 2) + L.labelPt * 0.35)}" text-anchor="middle" font-family="${profile.font}" font-size="${f2(L.labelPt)}" font-weight="bold" fill="${c.ink}">${esc(r.label)}</text>`
      );
    }
  });
  if (g.unitLabel) {
    parts.push(
      `<text x="${f2(L.w / 2)}" y="${f2(oy + L.gridH + L.pad + L.T * KEY_GAP + L.keyPt * 0.95)}" text-anchor="middle" font-family="${profile.font}" font-size="${f2(L.keyPt)}"${weight} fill="${c.ink}">${esc(g.unitLabel)}</text>`
    );
  }
  const w = f2(L.w);
  const h = f2(L.h);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join('')}</svg>`;
  return { svg, w: L.w, h: L.h, aspect: L.w / L.h, layout: L };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = asProfile(profileOrSurface, box);
  return `area-grid:${p.surface}:${f2(p.widthPt)}x${p.heightPt ? f2(p.heightPt) : '-'}:${JSON.stringify(normalise(spec))}`;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout };
