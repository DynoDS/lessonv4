'use strict';

// THE multiplication grid. One drawing, placed by the board, the worksheet, the
// working wall and the stick-in pack.
//
// The SATs "write the missing numbers in this multiplication grid" shape: an
// operator corner, column headers along the top, row headers down the left and
// products in the body. It was two: the board drew PowerPoint squares with
// grey headers and green `||` answers, the sheet (`times-table-grid`) drew a CSS
// grid of wider-than-tall cells with orange given numbers. A child who met the
// grid on the board and turned to the sheet met a different grid of the same
// facts (13 September 2026); this is now the one grid, in the board's look.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//
// The spec (the board's spelling):
//
//   corner      the operator in the corner box, "×" by default
//   colHeaders  values across the top; "" leaves an empty header, which is the
//               harder, inverse variant (the child divides a product to find it)
//   rowHeaders  values down the left
//   cells       products row-major, cells[r][c]; "" is a gap to find
//
// Any value written "||21" is an answer revealed in green inside the grid, so a
// completed grid is its own answer slide with no separate list. The sheet's
// `operator` spelling is read as `corner`.
//
// Cells are square and large, so the numbers read from the back of the room; on
// paper a cell never drops below the 12mm a child's two-digit product needs.

const { textWidthEm } = require('../text/comic-glyph-width');
const { profileFor } = require('./surface-profiles');
const { fitUnit, insetProfile } = require('./fit-unit');

// ─── CONSTANTS (in points unless named otherwise) ───────────────────────────
const FONT_OF_CELL = 0.46;        // a number's height as a share of its cell
const NATURAL_FONT = 1.25;        // of the profile's font: 30pt on the board, 13pt on paper
const BOARD_MAX_FONT = 40;        // past this a cell is a slab, not a grid square
const BOARD_FLOOR_SHARE = 14 / 18;// the board grid's long-standing 14pt smallest number
const TEXT_WIDTH_SHARE = 0.84;    // how much of a cell a number may use across
const PAPER_CELL_MIN_PT = (12 * 72) / 25.4; // a two-digit product in a child's hand
const PAPER_CELL_MAX_PT = (16 * 72) / 25.4; // a facts grid does not read better bigger
const LINE_W = 1.5;
const COLOURS = { header: '#D9D9D9', body: '#FFFFFF', line: '#000000', text: '#000000', answer: '#00B050' };
const INK = { header: '#E6E6E6', body: '#FFFFFF', line: '#1A1A1A', text: '#1A1A1A', answer: '#1A1A1A' };
// ─── END CONSTANTS ──────────────────────────────────────────────────────────

function str(v) {
  return v == null ? '' : String(v);
}

function esc(s) {
  return str(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function f2(n) {
  return Math.round(n * 100) / 100;
}

// "||21" is an answer; the marker never prints.
function answerRun(value) {
  const s = str(value);
  const at = s.indexOf('||');
  if (at === -1) return { text: s, answer: false };
  return { text: (s.slice(0, at) + s.slice(at + 2)).trim(), answer: true };
}

function normalise(spec = {}) {
  const colHeaders = Array.isArray(spec.colHeaders) ? spec.colHeaders.map(str) : [];
  const rowHeaders = Array.isArray(spec.rowHeaders) ? spec.rowHeaders.map(str) : [];
  if (!colHeaders.length || !rowHeaders.length) {
    throw new Error('MULT_GRID_INVALID: a multiplication grid needs `colHeaders` and `rowHeaders`, at least one of each.');
  }
  const corner = spec.corner != null ? str(spec.corner) : spec.operator != null ? str(spec.operator) : '×';
  const cells = Array.isArray(spec.cells) ? spec.cells : [];
  const grid = [];
  for (let r = 0; r <= rowHeaders.length; r += 1) {
    const row = [];
    for (let c = 0; c <= colHeaders.length; c += 1) {
      let v;
      if (r === 0 && c === 0) v = corner;
      else if (r === 0) v = colHeaders[c - 1];
      else if (c === 0) v = rowHeaders[r - 1];
      else v = Array.isArray(cells[r - 1]) ? str(cells[r - 1][c - 1]) : '';
      row.push({ ...answerRun(v), header: r === 0 || c === 0 });
    }
    grid.push(row);
  }
  return { grid, rows: grid.length, cols: grid[0].length };
}

function resolveProfile(p, box) {
  return typeof p === 'string' ? profileFor(p, box || { widthPt: 500 }) : p;
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  // Laid out inside the box less the stroke that bleeds past the drawing's edge.
  const profile = insetProfile(resolveProfile(profileOrSurface, box), 2);
  const g = normalise(spec);
  const widest = Math.max(...g.grid.flat().map((c) => textWidthEm(c.text, true)), 0.6);
  const board = Boolean(profile.heightPt);
  // Only paper holds a cell to a child's handwriting; the wall's grid is read
  // from across the room and takes the size its numbers need.
  const paper = profile.surface === 'worksheets' || profile.surface === 'stickin';
  const floor = board ? profile.minFontPt * BOARD_FLOOR_SHARE : profile.minFontPt;
  // The cell a number of this size needs: tall enough for the number, and wide
  // enough for the widest value in the grid ("144").
  const cellFor = (font) => {
    let cell = Math.max(font / FONT_OF_CELL, (widest * font) / TEXT_WIDTH_SHARE);
    if (paper) cell = Math.min(Math.max(cell, PAPER_CELL_MIN_PT), Math.max(PAPER_CELL_MAX_PT, (widest * font) / TEXT_WIDTH_SHARE));
    return cell;
  };
  const layoutAt = (font) => {
    const cell = cellFor(font);
    return { w: cell * g.cols, h: cell * g.rows, cell, font };
  };
  const natural = board ? BOARD_MAX_FONT / (profile.grow || 1) : profile.fontPt * NATURAL_FONT;
  const fit = fitUnit(layoutAt, profile, natural, floor);
  if (!fit.fits) {
    const need = layoutAt(floor);
    throw new Error(
      `MULT_GRID_DOES_NOT_FIT: a ${g.cols - 1} x ${g.rows - 1} grid needs ${(need.w / 72).toFixed(2)}in x ${(need.h / 72).toFixed(2)}in to print its numbers at ` +
        `${floor.toFixed(0)}pt, and was given ${(profile.widthPt / 72).toFixed(2)}in${profile.heightPt ? ` x ${(profile.heightPt / 72).toFixed(2)}in` : ''}. ` +
        'Give it a wider zone with workingSpace: false, or keep the grid the size of the paper question rather than shrinking the numbers.'
    );
  }
  // On the board a zone with room lets the cells grow to fill it, as the board's
  // squares always did, up to the size past which a cell is a slab.
  let { cell, font } = fit.layout;
  // Paper takes the widest cell a written product is easier in, where the width
  // allows, as the sheet's grid always did.
  if (paper) cell = Math.max(cell, Math.min(PAPER_CELL_MAX_PT, profile.widthPt / g.cols));
  if (board) {
    cell = Math.max(cell, Math.min(profile.widthPt / g.cols, profile.heightPt / g.rows));
    font = Math.max(floor, Math.min(BOARD_MAX_FONT, cell * FONT_OF_CELL, (cell * TEXT_WIDTH_SHARE) / widest));
  }
  return { ...g, cell, font, w: cell * g.cols, h: cell * g.rows, floor };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = resolveProfile(profileOrSurface, box);
  const L = describeLayout(spec, profile);
  const pal = profile.palette === 'ink' ? INK : COLOURS;
  const bleed = LINE_W;
  const parts = [];
  L.grid.forEach((row, r) =>
    row.forEach((c, k) => {
      const x = k * L.cell;
      const y = r * L.cell;
      parts.push(`<rect x="${f2(x)}" y="${f2(y)}" width="${f2(L.cell)}" height="${f2(L.cell)}" fill="${c.header ? pal.header : pal.body}" stroke="${pal.line}" stroke-width="${LINE_W}"/>`);
      if (c.text) {
        parts.push(`<text x="${f2(x + L.cell / 2)}" y="${f2(y + L.cell / 2 + L.font * 0.35)}" text-anchor="middle" font-family="${profile.font}" font-size="${f2(L.font)}" font-weight="bold" fill="${c.answer ? pal.answer : pal.text}">${esc(c.text)}</text>`);
      }
    })
  );
  const w = L.w + 2 * bleed;
  const h = L.h + 2 * bleed;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${f2(w)}" height="${f2(h)}" viewBox="${f2(-bleed)} ${f2(-bleed)} ${f2(w)} ${f2(h)}">${parts.join('')}</svg>`;
  return { svg, w, h, aspect: w / h, layout: L };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = resolveProfile(profileOrSurface, box);
  return `mult-grid:${p.surface}:${f2(p.widthPt)}x${p.heightPt ? f2(p.heightPt) : '-'}:${JSON.stringify(normalise(spec))}`;
}

// The narrowest box the grid can be drawn in on paper: every cell at the size a
// child writes a product in.
function minWidthPt(spec = {}) {
  const g = normalise(spec);
  return g.cols * PAPER_CELL_MIN_PT + 2 * 2 + 1;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, minWidthPt };
