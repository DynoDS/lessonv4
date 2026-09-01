'use strict';

// SHARED Carroll-diagram geometry — the single source of truth for a 2×2 sorting
// grid. One property runs DOWN THE SIDE as a pair (is / is NOT), another runs
// ACROSS THE TOP as a pair (is / is NOT), so every shape lands in exactly one of
// four cells. Each cell means its ROW label AND its COLUMN label together — the
// whole teaching point — so the grid labels are drawn clearly and the placed-shape
// chips read as the set in each cell. Imported by every engine that draws it
// (currently the slide deck); it produces ONLY the SVG and its true aspect, so
// each engine places it tight (NO DEADSPACE). The geometry is written once here.
//
//   tightSvg(spec) → { svg, aspect, w, h }   cropped tight to the labelled grid
//   cacheKey(spec) → string                  stable pre-render cache key
//
// This is the grid companion to `venn`: the top-left "is / is" cell holds the same
// shapes as a Venn overlap. It draws the FRAME and positions labelled shape tokens
// (small green chips carrying a name) in the right cell — it does not redraw shape
// geometry, because the PLACEMENT is the learning. A blank Carroll (no `shapes`) is
// the labelled grid children/teacher place into live.
//
// Spec:
//   rowLabel     side criterion, TOP row    (e.g. "is a quadrilateral")
//   rowNotLabel  side criterion, BOTTOM row (e.g. "is NOT a quadrilateral")
//   colLabel     top criterion, LEFT column  (e.g. "has a right angle")
//   colNotLabel  top criterion, RIGHT column (e.g. "has NO right angle")
//   shapes       array of placed tokens (omit or [] for a BLANK grid). Each is
//                  { cell, label }  where
//                    cell   one of "topLeft" | "topRight" | "bottomLeft" | "bottomRight"
//                           (topLeft = row-is AND col-is; bottomRight = row-isNOT AND col-isNOT)
//                    label  the shape's name shown in the chip (e.g. "Square")

const highlight = require('./figure-highlight');

// ─── CONSTANTS (geometry units; the whole drawing scales on placement) ────
const CELL_W      = 440;         // each cell's width
const CELL_H      = 320;         // each cell's height
const GRID_STROKE = 5;           // grid line width
const GRID_COLOUR = '#000000';   // grid lines (black)

const TOP_BAND_H  = 92;          // height of the column-label band above the grid
const SIDE_BAND_W = 92;          // width of the row-label band left of the grid
const PAD         = 8;           // hair of margin so strokes aren't clipped

const COL_LABEL_FONT = 34;       // column-label font size (across the top), shrunk to fit the cell width
const ROW_LABEL_FONT = 34;       // row-label font size (rotated up the side), shrunk to fit the cell height
const LABEL_MIN_FONT = 22;       // floor a long criterion label shrinks to (kept legible from the back)
const LABEL_FIT_PAD  = 36;       // margin kept clear at each end of a label band
const COL_LABEL_C    = '#0070C0';// column labels in house blue
const ROW_LABEL_C    = '#E46C0A';// row labels in house orange

const CELL_FILL   = '#FFFFFF';   // cell background

const CHIP_W      = 300;         // placed-shape chip width
const CHIP_H      = 66;          // placed-shape chip height
const CHIP_RX     = 14;          // chip corner radius
const CHIP_FONT   = 28;          // chip label font size
const CHIP_STROKE = 3;           // chip outline width
const CHIP_VGAP   = 12;          // vertical gap when several chips stack in one cell
const CHIP_FILL     = '#FFFFFF'; // placed-chip background
const CHIP_STROKE_C = '#00B050'; // placed-chip outline (house green)
const CHIP_TEXT_C   = '#000000'; // placed-chip text
// ─── END CONSTANTS ────────────────────────────────────────────────────────

const CELLS = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];

// Rough text width estimate for Comic Sans (avg glyph ≈ 0.62 × font size). Used
// only to SHRINK a label that would otherwise overrun its band — a column label
// wider than its cell, or a rotated row label longer than the cell height — so the
// drawing stays tight to the grid with nothing clipped past the viewBox edge.
const GLYPH_W = 0.62;
function estTextW(text, fontSize) {
  return String(text == null ? '' : text).length * fontSize * GLYPH_W;
}
// The font size to use so `text` fits within `avail`, never above `maxFont` and
// never below `minFont` (a very long label is allowed to ride the floor rather
// than vanish; it stays readable and within a glyph or two of the edge).
function fitFont(text, avail, maxFont, minFont) {
  const len = String(text == null ? '' : text).length;
  if (!len) return maxFont;
  const ideal = avail / (len * GLYPH_W);
  return Math.max(minFont, Math.min(maxFont, ideal));
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Normalise the spec's placed shapes into [{ cell, label }], dropping anything
// without a valid cell. A blank grid resolves to [].
function resolveShapes(data) {
  const raw = Array.isArray(data.shapes) ? data.shapes : [];
  const out = [];
  raw.forEach(function (s) {
    if (!s || typeof s !== 'object') return;
    const cell = CELLS.indexOf(s.cell) >= 0 ? s.cell : null;
    if (!cell) return;
    out.push({ cell: cell, label: String(s.label == null ? '' : s.label) });
  });
  return out;
}

// The parts a lesson can point at, and the plain-English names it may use for
// them. A teacher says "the ones that are both" rather than "topLeft", and the
// grid means its row label AND its column label together, so those readings are
// the aliases.
const HIGHLIGHT_PARTS = [
  { key: 'topLeft', aliases: ['both', 'is-is', 'top-left'] },
  { key: 'topRight', aliases: ['row-only', 'is-is-not', 'top-right'] },
  { key: 'bottomLeft', aliases: ['column-only', 'is-not-is', 'bottom-left'] },
  { key: 'bottomRight', aliases: ['neither', 'is-not-is-not', 'bottom-right'] }
];

function cacheKey(data) {
  const shapes = resolveShapes(data);
  const sk = shapes.map(function (s) { return s.cell + ':' + s.label; }).join(';');
  const hi = [...highlight.resolveHighlight(data, HIGHLIGHT_PARTS, 'Carroll diagram')].sort().join(',');
  return 'carroll:' + (data.rowLabel || '') + '|' + (data.rowNotLabel || '') + '|' +
    (data.colLabel || '') + '|' + (data.colNotLabel || '') + '|' + sk + '|' + hi;
}

// Top-left corner of each cell in grid space (grid origin = (SIDE_BAND_W, TOP_BAND_H)).
function cellOrigin(cell) {
  const gx = SIDE_BAND_W;
  const gy = TOP_BAND_H;
  switch (cell) {
    case 'topLeft':     return { x: gx,          y: gy };
    case 'topRight':    return { x: gx + CELL_W, y: gy };
    case 'bottomLeft':  return { x: gx,          y: gy + CELL_H };
    case 'bottomRight': return { x: gx + CELL_W, y: gy + CELL_H };
    default:            return { x: gx,          y: gy };
  }
}

function tightSvg(data) {
  const shapes = resolveShapes(data);
  const marked = highlight.resolveHighlight(data, HIGHLIGHT_PARTS, 'Carroll diagram');
  const f = function (n) { return Number(n).toFixed(2); };

  // The whole picture is the labelled grid plus a hair of margin — tight by
  // construction, no padded square, no centring-in-deadspace.
  const gridW = 2 * CELL_W;
  const gridH = 2 * CELL_H;
  const w = SIDE_BAND_W + gridW + 2 * PAD;
  const h = TOP_BAND_H + gridH + 2 * PAD;
  const ox = PAD;
  const oy = PAD;
  const X = function (x) { return ox + x; };
  const Y = function (y) { return oy + y; };

  const gx = SIDE_BAND_W;   // grid origin within the drawing (before PAD)
  const gy = TOP_BAND_H;

  const parts = [];

  // Cell backgrounds.
  CELLS.forEach(function (cell) {
    const o = cellOrigin(cell);
    parts.push(`<rect x="${f(X(o.x))}" y="${f(Y(o.y))}" width="${CELL_W}" height="${CELL_H}" fill="${CELL_FILL}"/>`);
  });

  // Grid lines: outer border + the two interior dividers.
  parts.push(`<rect x="${f(X(gx))}" y="${f(Y(gy))}" width="${gridW}" height="${gridH}" fill="none" stroke="${GRID_COLOUR}" stroke-width="${GRID_STROKE}"/>`);
  parts.push(`<line x1="${f(X(gx + CELL_W))}" y1="${f(Y(gy))}" x2="${f(X(gx + CELL_W))}" y2="${f(Y(gy + gridH))}" stroke="${GRID_COLOUR}" stroke-width="${GRID_STROKE}"/>`);
  parts.push(`<line x1="${f(X(gx))}" y1="${f(Y(gy + CELL_H))}" x2="${f(X(gx + gridW))}" y2="${f(Y(gy + CELL_H))}" stroke="${GRID_COLOUR}" stroke-width="${GRID_STROKE}"/>`);

  // Column labels across the top — centred over each column, in house blue. Each
  // is shrunk (down to the floor) so it fits within its cell width, never spilling
  // past the grid edge.
  const colMidL = gx + CELL_W / 2;
  const colMidR = gx + CELL_W + CELL_W / 2;
  const colY = TOP_BAND_H / 2;
  const colAvail = CELL_W - LABEL_FIT_PAD;
  const colFontL = fitFont(data.colLabel, colAvail, COL_LABEL_FONT, LABEL_MIN_FONT);
  const colFontR = fitFont(data.colNotLabel, colAvail, COL_LABEL_FONT, LABEL_MIN_FONT);
  parts.push(`<text x="${f(X(colMidL))}" y="${f(Y(colY))}" font-family="Comic Sans MS, sans-serif" font-size="${f(colFontL)}" font-weight="bold" fill="${COL_LABEL_C}" text-anchor="middle" dominant-baseline="middle">${esc(data.colLabel || '')}</text>`);
  parts.push(`<text x="${f(X(colMidR))}" y="${f(Y(colY))}" font-family="Comic Sans MS, sans-serif" font-size="${f(colFontR)}" font-weight="bold" fill="${COL_LABEL_C}" text-anchor="middle" dominant-baseline="middle">${esc(data.colNotLabel || '')}</text>`);

  // Row labels down the side — centred beside each row and ROTATED to run up the
  // side, in house orange, so the two criteria read distinctly (blue across, orange
  // down). The rotated label's LENGTH runs along the cell HEIGHT, so it is shrunk
  // to fit CELL_H — this is what stopped a long criterion ("is NOT a quadrilateral")
  // overrunning the row and being clipped past the canvas top and bottom.
  const rowMidT = gy + CELL_H / 2;
  const rowMidB = gy + CELL_H + CELL_H / 2;
  const rowX = SIDE_BAND_W / 2;
  const rowAvail = CELL_H - LABEL_FIT_PAD;
  const rowFontT = fitFont(data.rowLabel, rowAvail, ROW_LABEL_FONT, LABEL_MIN_FONT);
  const rowFontB = fitFont(data.rowNotLabel, rowAvail, ROW_LABEL_FONT, LABEL_MIN_FONT);
  parts.push(`<text x="${f(X(rowX))}" y="${f(Y(rowMidT))}" font-family="Comic Sans MS, sans-serif" font-size="${f(rowFontT)}" font-weight="bold" fill="${ROW_LABEL_C}" text-anchor="middle" dominant-baseline="middle" transform="rotate(-90 ${f(X(rowX))} ${f(Y(rowMidT))})">${esc(data.rowLabel || '')}</text>`);
  parts.push(`<text x="${f(X(rowX))}" y="${f(Y(rowMidB))}" font-family="Comic Sans MS, sans-serif" font-size="${f(rowFontB)}" font-weight="bold" fill="${ROW_LABEL_C}" text-anchor="middle" dominant-baseline="middle" transform="rotate(-90 ${f(X(rowX))} ${f(Y(rowMidB))})">${esc(data.rowNotLabel || '')}</text>`);

  // Placed shapes: rounded chips with the shape name, stacked vertically and
  // centred in each cell when several share it.
  if (shapes.length) {
    const byCell = {};
    CELLS.forEach(function (c) { byCell[c] = []; });
    shapes.forEach(function (s) { byCell[s.cell].push(s); });

    CELLS.forEach(function (cell) {
      const list = byCell[cell];
      if (!list.length) return;
      const o = cellOrigin(cell);
      const cx = o.x + CELL_W / 2;
      const cyMid = o.y + CELL_H / 2;
      const totalH = list.length * CHIP_H + (list.length - 1) * CHIP_VGAP;
      let chipTop = cyMid - totalH / 2;
      list.forEach(function (s) {
        const top = chipTop;
        parts.push(`<rect x="${f(X(cx - CHIP_W / 2))}" y="${f(Y(top))}" width="${CHIP_W}" height="${CHIP_H}" rx="${CHIP_RX}" fill="${CHIP_FILL}" stroke="${CHIP_STROKE_C}" stroke-width="${CHIP_STROKE}"/>`);
        parts.push(`<text x="${f(X(cx))}" y="${f(Y(top + CHIP_H / 2))}" font-family="Comic Sans MS, sans-serif" font-size="${CHIP_FONT}" font-weight="bold" fill="${CHIP_TEXT_C}" text-anchor="middle" dominant-baseline="middle">${esc(s.label)}</text>`);
        chipTop += CHIP_H + CHIP_VGAP;
      });
    });
  }

  // Pointing at a cell, last of all so the veil covers that cell's chips and the
  // ring is drawn over the grid lines rather than under them.
  if (marked.size) {
    CELLS.forEach(function (cell) {
      const o = cellOrigin(cell);
      const box = { x: X(o.x), y: Y(o.y), w: CELL_W, h: CELL_H };
      const fade = highlight.opacityFor(marked, cell);
      if (fade < 1) {
        parts.push(`<rect x="${f(box.x)}" y="${f(box.y)}" width="${CELL_W}" height="${CELL_H}" fill="#FFFFFF" fill-opacity="${(1 - fade).toFixed(2)}"/>`);
      }
      parts.push(highlight.ringSvg(marked, cell, box, Math.max(w, h)));
    });
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}">${parts.join('')}</svg>`;
  return { svg, aspect: w / h, w, h };
}

// Compact action cue: one token belongs in exactly one cell. Criterion labels
// are intentionally absent because they are task-specific and unreadable here.
function oneCellCueSvg() {
  const w = 208, h = 148, x = 4, y = 4, gridW = 200, gridH = 140;
  const parts = [
    `<rect x="${x}" y="${y}" width="${gridW}" height="${gridH}" fill="#FFFFFF" stroke="${GRID_COLOUR}" stroke-width="7"/>`,
    `<line x1="104" y1="4" x2="104" y2="144" stroke="${GRID_COLOUR}" stroke-width="7"/>`,
    `<line x1="4" y1="74" x2="204" y2="74" stroke="${GRID_COLOUR}" stroke-width="7"/>`,
    '<circle cx="54" cy="39" r="15" fill="#00B050" stroke="#006B32" stroke-width="4"/>'
  ];
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join('')}</svg>`;
  return { svg, aspect: w / h, w, h };
}

module.exports = { tightSvg, oneCellCueSvg, cacheKey };
