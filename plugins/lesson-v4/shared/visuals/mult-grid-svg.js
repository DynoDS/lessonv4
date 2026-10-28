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
const { profileFor, answerColour } = require('./surface-profiles');
const { fitUnit, insetProfile } = require('./fit-unit');
const highlight = require('./figure-highlight');

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

// ─── Pointing at part of the grid (shared/visuals/figure-highlight.js) ──────
//
// The teacher says "the 3 times row", "the 4 column", "3 times 4". So a row is
// named by its header, "row 3" (or "3 row", "3 times row"), a column the same,
// "column 4" (or "col 4", "4 column"), and one product by its two headers,
// "3 x 4" (or "3 times 4"), row first. A header left empty for the child to
// find has no number to be named by, so its row is "row 2 down" and its column
// "column 3 across", counted from the top and the left.

function plain(v) {
  return String(v == null ? '' : v).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

// An alias that two parts would answer to is dropped rather than quietly
// pointing at both ("12 x 3" and "1 x 23" both flatten to "123").
function withAliases(list) {
  const claimed = new Map();
  list.forEach((p) => {
    [p.key, ...p.aliases].forEach((name) => {
      const n = plain(name);
      if (!n) return;
      claimed.set(n, claimed.has(n) && claimed.get(n) !== p.key ? null : p.key);
    });
  });
  return list.map((p) => ({
    key: p.key,
    aliases: p.aliases.filter((a) => plain(a) && claimed.get(plain(a)) === p.key && plain(a) !== plain(p.key)),
  }));
}

// The names of the grid's rows, columns and cells, and which grid squares each
// covers: { key, aliases, cells: [[r, c]] } in grid coordinates (headers at 0).
function gridParts(g) {
  const headerNames = (texts) => texts.map((t) => {
    const s = String(t).trim();
    return s && texts.filter((u) => String(u).trim() === s).length === 1 ? s : null;
  });
  const rowNames = headerNames(g.grid.slice(1).map((row) => row[0].text));
  const colNames = headerNames(g.grid[0].slice(1).map((c) => c.text));
  const list = [];
  rowNames.forEach((h, i) => {
    const r = i + 1;
    const cells = [];
    for (let c = 0; c < g.cols; c += 1) cells.push([r, c]);
    list.push(h ? { key: `row ${h}`, aliases: [`${h} row`, `${h} times row`], cells } : { key: `row ${r} down`, aliases: [], cells });
  });
  colNames.forEach((h, i) => {
    const c = i + 1;
    const cells = [];
    for (let r = 0; r < g.rows; r += 1) cells.push([r, c]);
    list.push(h ? { key: `column ${h}`, aliases: [`col ${h}`, `${h} column`], cells } : { key: `column ${c} across`, aliases: [], cells });
  });
  rowNames.forEach((rh, i) => colNames.forEach((ch, j) => {
    const cells = [[i + 1, j + 1]];
    list.push(rh && ch
      ? { key: `${rh} x ${ch}`, aliases: [`${rh} times ${ch}`, `${rh} \u00d7 ${ch}`], cells }
      : { key: `cell ${i + 1} down ${j + 1} across`, aliases: [], cells });
  }));
  const named = withAliases(list);
  return named.map((p, i) => ({ ...p, cells: list[i].cells }));
}

function markedParts(spec, g) {
  return highlight.resolveHighlight(spec, gridParts(g), 'multiplication grid');
}

// How far a ring reaches outside the box it is drawn round, read from the
// shared ring itself.
function ringReach(longSide) {
  const probe = highlight.ringSvg(new Set(['r']), 'r', { x: 0, y: 0, w: 0, h: 0 }, longSide);
  const pad = -Number(/ x="([-\d.]+)"/.exec(probe)[1]);
  const stroke = Number(/stroke-width="([\d.]+)"/.exec(probe)[1]);
  return pad + stroke / 2;
}

function resolveProfile(p, box) {
  return typeof p === 'string' ? profileFor(p, box || { widthPt: 500 }) : p;
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  // Laid out inside the box less the stroke that bleeds past the drawing's
  // edge, and less the room a ring needs when a row, column or cell at the
  // edge is pointed at.
  const given = resolveProfile(profileOrSurface, box);
  const g = normalise(spec);
  const ringRoom = markedParts(spec, g).size ? ringReach(Math.max(given.widthPt, given.heightPt || 0)) : 0;
  const profile = insetProfile(given, 2 + ringRoom);
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
  return { ...g, cell, font, w: cell * g.cols, h: cell * g.rows, floor, ringRoom };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = resolveProfile(profileOrSurface, box);
  const L = describeLayout(spec, profile);
  const pal = profile.palette === 'ink' ? INK : COLOURS;
  const bleed = LINE_W + L.ringRoom;
  const parts = [];
  // Pointing at a row, a column or a product: its squares stay lit with the
  // headers that name them, and the rest of the grid steps back. The corner
  // sign always stays.
  const named = gridParts(L);
  const marked = markedParts(spec, L);
  const lit = new Set();
  named.filter((p) => marked.has(p.key)).forEach((p) => p.cells.forEach(([r, c]) => lit.add(`${r},${c}`)));
  if (marked.size) {
    for (let r = 1; r < L.rows; r += 1) for (let c = 1; c < L.cols; c += 1) {
      if (lit.has(`${r},${c}`)) { lit.add(`${r},0`); lit.add(`0,${c}`); }
    }
    lit.add('0,0');
  }
  const square = (c, r, k) => {
    const x = k * L.cell;
    const y = r * L.cell;
    let svg = `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(L.cell)}" height="${f2(L.cell)}" fill="${c.header ? pal.header : pal.body}" stroke="${pal.line}" stroke-width="${LINE_W}"/>`;
    if (c.text) {
      svg += `<text x="${f2(x + L.cell / 2)}" y="${f2(y + L.cell / 2 + L.font * 0.35)}" text-anchor="middle" font-family="${profile.font}" font-size="${f2(L.font)}" font-weight="bold" fill="${c.answer ? answerColour(profile, pal.answer, pal.text) : pal.text}">${esc(c.text)}</text>`;
    }
    return svg;
  };
  if (!marked.size) {
    L.grid.forEach((row, r) => row.forEach((c, k) => parts.push(square(c, r, k))));
  } else {
    // The faded squares first, so a lit square's edges are drawn over theirs.
    const faded = [];
    const full = [];
    L.grid.forEach((row, r) => row.forEach((c, k) => (lit.has(`${r},${k}`) ? full : faded).push(square(c, r, k))));
    parts.push(`<g opacity="${highlight.DIMMED}">${faded.join('')}</g>`, ...full);
    const long = Math.max(L.w, L.h);
    named.filter((p) => marked.has(p.key)).forEach((p) => {
      const rs = p.cells.map(([r]) => r);
      const cs = p.cells.map(([, c]) => c);
      const r0 = Math.min(...rs);
      const c0 = Math.min(...cs);
      const box = { x: c0 * L.cell, y: r0 * L.cell, w: (Math.max(...cs) - c0 + 1) * L.cell, h: (Math.max(...rs) - r0 + 1) * L.cell };
      parts.push(highlight.ringSvg(marked, p.key, box, long, profile.palette === 'ink'));
    });
  }
  const w = L.w + 2 * bleed;
  const h = L.h + 2 * bleed;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${f2(w)}" height="${f2(h)}" viewBox="${f2(-bleed)} ${f2(-bleed)} ${f2(w)} ${f2(h)}">${parts.join('')}</svg>`;
  return { svg, w, h, aspect: w / h, layout: L };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = resolveProfile(profileOrSurface, box);
  // The highlight is part of the picture; a grid with none keeps its old key.
  const hi = [...markedParts(spec, normalise(spec))].sort().join(',');
  return `mult-grid:${p.surface}:${f2(p.widthPt)}x${p.heightPt ? f2(p.heightPt) : '-'}:${JSON.stringify(normalise(spec))}` + (hi ? `:hi=${hi}` : '');
}

// The narrowest box the grid can be drawn in on paper: every cell at the size a
// child writes a product in.
function minWidthPt(spec = {}) {
  const g = normalise(spec);
  const base = g.cols * PAPER_CELL_MIN_PT + 2 * 2 + 1;
  // A pointed-at row or column at the edge needs its ring's room too.
  if (!markedParts(spec, g).size) return base;
  let w = base;
  for (let k = 0; k < 3; k += 1) w = base + 2 * ringReach(w);
  return w;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, minWidthPt };
