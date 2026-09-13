'use strict';

// SHARED tally-chart geometry — the single source of truth for a UK primary
// tally chart: a table with a group-label column, a tally column whose counts
// are drawn as bundles of five (four vertical strokes with a fifth diagonal
// struck ACROSS all four), and an optional Total column. This is the core
// statistics visual children meet on the board, on a worksheet, and on the
// working wall, so the geometry lives here once and every engine imports it.
//
// The fifth mark is the diagonal, NOT a fifth vertical — that is the central
// teaching point (and the misconception this helper guards against): a bundle
// of five always reads as IIII with one line crossing them.
//   5  → IIII/                (one full bundle)
//   7  → IIII/ II             (one bundle + two verticals)
//   11 → IIII/ IIII/ I        (two bundles + one vertical)
//
//   tightSvg(spec) → { svg, aspect, w, h }   cropped tight to the table
//   cacheKey(spec) → string                  stable pre-render cache key
//
// Spec:
//   title       optional heading above the chart (e.g. "Pets in Class 4").
//   headers     column headers, e.g. ["Pet", "Tally", "Total"]. The third
//               header is only used when a Total column is shown.
//   rows        [ { label, tally, total } ] — `tally` is a NUMBER; it is
//               converted to bundle-and-remainder marks automatically (a child
//               never writes the raw number). `total` is optional and defaults
//               to the tally count when totals are shown.
//   showTotals  whether to draw the Total column. Defaults to true when a third
//               header is present, false otherwise.
//   blank       when true, each tally cell (and total cell) is drawn EMPTY at
//               the width the expected marks would need, so children gather
//               data and tally it in themselves.
//
// A `total` value may carry the house "||" answer-reveal marker (e.g.
// total: "||12"): the value renders in answer-green instead of pencil black, so
// a completed frequency reads as the worked answer rather than a given. This is
// the same reveal the mult-grid and clock/angle labels use, and it serves two
// moments — the modelled frequencies on a My Turn (the read-off answer the class
// watches the teacher produce) and the full column on an answer slide. A plain
// total (no marker) stays black, so questions and given values are unchanged.

const highlight = require('./figure-highlight');

// ─── CONSTANTS (SVG user units; the chart is rescaled per engine by aspect) ──
const FS          = 30;    // body / cell font size
const HEADER_FS   = 30;    // header-row font size
const TITLE_FS    = 36;    // chart title font size
const FONT        = 'Arial';

const CELL_PAD_X  = 18;    // left/right padding inside every cell
const CELL_PAD_Y  = 14;    // top/bottom padding inside header/label cells
const TITLE_GAP   = 14;    // gap below the title before the grid

const MARK_H      = 46;    // height of a vertical tally stroke
const MARK_GAP    = 14;    // horizontal gap between the 4 verticals in a bundle
const STROKE_W    = 4.5;   // tally stroke width
const DIAG_OVER   = 8;     // how far the diagonal overhangs the bundle each side
const BUNDLE_GAP  = 20;    // gap between one bundle and the next group
const MARK_PAD_Y  = 16;    // vertical padding above/below the marks in a cell

const GRID_W      = 2.5;   // table grid line width
const GRID_COLOUR  = '#000000';
const MARK_COLOUR  = '#000000';   // tally marks are plain pencil black
const TEXT_COLOUR  = '#000000';
const ANSWER_COLOUR = '#00B050';  // house answer-green — a revealed frequency
const TITLE_COLOUR = '#1F4E79';   // house deep blue for the heading
const HEADER_FILL  = '#DEEAF6';   // light house blue for the header row
const CELL_FILL    = '#FFFFFF';

const { INK_TONES, printsInInk } = require('./surface-profiles');

// The colours above, and what each becomes on the photocopied stick-in pack.
const COLOURS = { GRID_COLOUR: GRID_COLOUR, MARK_COLOUR: MARK_COLOUR, TEXT_COLOUR: TEXT_COLOUR, ANSWER_COLOUR: ANSWER_COLOUR, TITLE_COLOUR: TITLE_COLOUR, HEADER_FILL: HEADER_FILL };
const INK = { GRID_COLOUR: INK_TONES.ink, MARK_COLOUR: INK_TONES.ink, TEXT_COLOUR: INK_TONES.ink, ANSWER_COLOUR: INK_TONES.ink, TITLE_COLOUR: INK_TONES.ink, HEADER_FILL: INK_TONES.pale };

const CHAR_W      = 0.58;  // Arial-bold character-width estimate (× font size)
// ─── END CONSTANTS ──────────────────────────────────────────────────────────

function f(n) { return Number(n).toFixed(2); }

function textWidth(s, fs) {
  return String(s == null ? '' : s).length * fs * CHAR_W;
}

function tallyCount(row) {
  const n = Number(row && row.tally);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

// Resolve a row's Total cell to the text drawn and whether it is a revealed
// answer. A string carrying the "||" marker reveals everything after the first
// "||" in answer-green; anything else (a plain value, or the tally count used as
// the default) is a black given. The marker is stripped here so column-width
// measurement and rendering both work on the visible text, not the marker.
function resolveTotal(row) {
  const raw = (row && row.total != null) ? row.total : tallyCount(row);
  if (typeof raw === 'string') {
    const i = raw.indexOf('||');
    if (i !== -1) return { text: raw.slice(i + 2).trim(), isAnswer: true };
  }
  return { text: raw, isAnswer: false };
}

function showTotalsResolved(data) {
  const headers = Array.isArray(data.headers) ? data.headers : [];
  if (data.showTotals != null) return !!data.showTotals;
  return headers.length >= 3;
}

// Lay out the strokes for one tally count in local coords (y: 0..MARK_H, x from
// 0). Returns the stroke list plus the width the marks consume — used both to
// size the column and to draw the marks. A blank cell still calls this (with the
// expected count) so the empty box is the right width.
function layoutMarks(count) {
  const strokes = [];
  const bundles = Math.floor(count / 5);
  const rem = count % 5;
  let x = 0;
  let maxX = 0;

  for (let b = 0; b < bundles; b++) {
    const v0 = x + DIAG_OVER;                 // x of the first vertical
    for (let i = 0; i < 4; i++) {
      const vx = v0 + i * MARK_GAP;
      strokes.push({ x1: vx, y1: 0, x2: vx, y2: MARK_H });
      if (vx > maxX) maxX = vx;
    }
    const right = v0 + 3 * MARK_GAP;
    // Fifth mark: a diagonal from bottom-left to top-right, crossing all four.
    strokes.push({ x1: v0 - DIAG_OVER, y1: MARK_H * 0.82, x2: right + DIAG_OVER, y2: MARK_H * 0.18, diag: true });
    if (right + DIAG_OVER > maxX) maxX = right + DIAG_OVER;
    x = right + DIAG_OVER + BUNDLE_GAP;
  }

  for (let i = 0; i < rem; i++) {
    const vx = x + i * MARK_GAP;
    strokes.push({ x1: vx, y1: 0, x2: vx, y2: MARK_H });
    if (vx > maxX) maxX = vx;
  }

  const width = (count <= 0) ? MARK_GAP * 2 : (maxX + STROKE_W);
  return { strokes, width };
}

// A tally chart's parts are its categories, named by their own row labels, so a
// lesson points at "Dogs" rather than at row 2. Naming the row means the mark
// follows if the rows are ever reordered.
function highlightParts(data) {
  return (Array.isArray(data && data.rows) ? data.rows : [])
    .map(function (row) { return String((row && row.label) != null ? row.label : ''); })
    .filter(Boolean);
}

// `profile` is optional: the stick-in pack passes its own so this prints in
// ink. A revealed total was green; a child's copy
// carries no answers, so it prints like any other number.
function tightSvg(data, profile) {
  const C = printsInInk(profile) ? INK : COLOURS;
  const headers = Array.isArray(data.headers) ? data.headers : [];
  const rows = Array.isArray(data.rows) ? data.rows : [];
  const marked = highlight.resolveHighlight(data, highlightParts(data), 'tally chart');
  const title = data.title || '';
  const showTotals = showTotalsResolved(data);
  const blank = data.blank === true;

  // ── Column widths ──────────────────────────────────────────────────────
  const labelHeader = headers[0] != null ? headers[0] : '';
  const tallyHeader = headers[1] != null ? headers[1] : 'Tally';
  const totalHeader = headers[2] != null ? headers[2] : 'Total';

  let labelTextW = textWidth(labelHeader, HEADER_FS);
  for (const row of rows) labelTextW = Math.max(labelTextW, textWidth(row && row.label, FS));
  const labelColW = Math.max(labelTextW + 2 * CELL_PAD_X, 90);

  // The tally column is sized to the widest row's marks (so every empty box in
  // blank mode is the width its expected marks would need) AND the header word.
  let maxMarksW = 0;
  const rowMarks = rows.map((row) => {
    const count = tallyCount(row);
    const ml = layoutMarks(count);
    if (ml.width > maxMarksW) maxMarksW = ml.width;
    return ml;
  });
  const tallyColW = Math.max(maxMarksW + 2 * CELL_PAD_X, textWidth(tallyHeader, HEADER_FS) + 2 * CELL_PAD_X, 120);

  let totalColW = 0;
  if (showTotals) {
    let totalTextW = textWidth(totalHeader, HEADER_FS);
    for (const row of rows) {
      totalTextW = Math.max(totalTextW, textWidth(resolveTotal(row).text, FS));
    }
    totalColW = Math.max(totalTextW + 2 * CELL_PAD_X, 90);
  }

  const colXs = [0, labelColW, labelColW + tallyColW];
  const colWs = showTotals ? [labelColW, tallyColW, totalColW] : [labelColW, tallyColW];
  const tableW = colWs.reduce((a, b) => a + b, 0);

  // ── Row heights ────────────────────────────────────────────────────────
  const headerH = HEADER_FS + 2 * CELL_PAD_Y;
  const bodyRowH = Math.max(MARK_H + 2 * MARK_PAD_Y, FS + 2 * CELL_PAD_Y);
  const titleH = title ? TITLE_FS + TITLE_GAP : 0;

  const gridTop = titleH;
  const tableH = headerH + rows.length * bodyRowH;
  const totalH = gridTop + tableH;

  const parts = [];

  // ── Title ──
  if (title) {
    parts.push(`<text x="${f(tableW / 2)}" y="${f(TITLE_FS * 0.82)}" text-anchor="middle" font-family="${FONT}" font-size="${TITLE_FS}" font-weight="bold" fill="${C.TITLE_COLOUR}">${escapeXml(title)}</text>`);
  }

  // ── Header row cells ──
  const headerTexts = showTotals ? [labelHeader, tallyHeader, totalHeader] : [labelHeader, tallyHeader];
  for (let c = 0; c < colWs.length; c++) {
    const x = colXs[c];
    parts.push(`<rect x="${f(x)}" y="${f(gridTop)}" width="${f(colWs[c])}" height="${f(headerH)}" fill="${C.HEADER_FILL}" stroke="${C.GRID_COLOUR}" stroke-width="${GRID_W}"/>`);
    parts.push(`<text x="${f(x + colWs[c] / 2)}" y="${f(gridTop + headerH / 2)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${HEADER_FS}" font-weight="bold" fill="${C.TEXT_COLOUR}">${escapeXml(headerTexts[c])}</text>`);
  }

  // ── Body rows ──
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const rowTop = gridTop + headerH + r * bodyRowH;

    // Cell backgrounds + borders.
    for (let c = 0; c < colWs.length; c++) {
      parts.push(`<rect x="${f(colXs[c])}" y="${f(rowTop)}" width="${f(colWs[c])}" height="${f(bodyRowH)}" fill="${CELL_FILL}" stroke="${C.GRID_COLOUR}" stroke-width="${GRID_W}"/>`);
    }

    // Label cell — left-aligned text.
    parts.push(`<text x="${f(CELL_PAD_X)}" y="${f(rowTop + bodyRowH / 2)}" text-anchor="start" dominant-baseline="central" font-family="${FONT}" font-size="${FS}" font-weight="bold" fill="${C.TEXT_COLOUR}">${escapeXml(row && row.label != null ? row.label : '')}</text>`);

    // Tally cell — bundles of five (skipped when blank: the box stays empty).
    if (!blank) {
      const ml = rowMarks[r];
      const markOX = colXs[1] + CELL_PAD_X;
      const markOY = rowTop + (bodyRowH - MARK_H) / 2;
      for (const s of ml.strokes) {
        parts.push(`<line x1="${f(markOX + s.x1)}" y1="${f(markOY + s.y1)}" x2="${f(markOX + s.x2)}" y2="${f(markOY + s.y2)}" stroke="${C.MARK_COLOUR}" stroke-width="${STROKE_W}" stroke-linecap="round"/>`);
      }
    }

    // Total cell — a revealed answer shows green, a given stays black.
    if (showTotals && !blank) {
      const { text, isAnswer } = resolveTotal(row);
      const fill = isAnswer ? C.ANSWER_COLOUR : C.TEXT_COLOUR;
      parts.push(`<text x="${f(colXs[2] + colWs[2] / 2)}" y="${f(rowTop + bodyRowH / 2)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${FS}" font-weight="bold" fill="${fill}">${escapeXml(text)}</text>`);
    }
  }

  const w = tableW + GRID_W;     // include the outer stroke
  const h = totalH + GRID_W;

  // Pointing at one category, drawn last so the veil covers that row's marks and
  // total and the ring sits over the grid lines.
  if (marked.size) {
    for (let r = 0; r < rows.length; r++) {
      const key = String((rows[r] && rows[r].label) != null ? rows[r].label : '');
      const box = { x: colXs[0], y: gridTop + headerH + r * bodyRowH, w: tableW, h: bodyRowH };
      const fade = highlight.opacityFor(marked, key);
      if (fade < 1) {
        parts.push(`<rect x="${f(box.x)}" y="${f(box.y)}" width="${f(box.w)}" height="${f(box.h)}" fill="#FFFFFF" fill-opacity="${(1 - fade).toFixed(2)}"/>`);
      }
      parts.push(highlight.ringSvg(marked, key, box, Math.max(w, h), C === INK));
    }
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="${f(-GRID_W / 2)} 0 ${f(w)} ${f(h)}">${parts.join('')}</svg>`;
  return { svg, aspect: w / h, w, h };
}

// Deliberately small Success Criteria treatment: one bundle of tally marks,
// without the chart frame, headings or category text that become unreadable in
// the narrow inline slot. The strokes come from layoutMarks(), the same function
// that draws every full-size tally-chart row, so the fifth diagonal cannot drift
// into a different convention.
function tallyMarksSvg(data) {
  const count = Math.max(1, tallyCount({ tally: data && data.count }));
  const marks = layoutMarks(count);
  const pad = 10;
  const inlineStrokeW = STROKE_W * 1.35;
  const parts = marks.strokes.map(function (s) {
    return `<line x1="${f(pad + s.x1)}" y1="${f(pad + s.y1)}" x2="${f(pad + s.x2)}" y2="${f(pad + s.y2)}" stroke="${MARK_COLOUR}" stroke-width="${f(inlineStrokeW)}" stroke-linecap="round"/>`;
  });
  const w = marks.width + 2 * pad;
  const h = MARK_H + 2 * pad;
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}">${parts.join('')}</svg>`;
  return { svg, aspect: w / h, w, h };
}

function escapeXml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function cacheKey(data) {
  const headers = Array.isArray(data.headers) ? data.headers : [];
  const rows = Array.isArray(data.rows) ? data.rows : [];
  const rowKey = rows.map((r) => `${r && r.label != null ? r.label : ''}=${tallyCount(r)}/${r && r.total != null ? r.total : ''}`).join('|');
  const hi = [...highlight.resolveHighlight(data, highlightParts(data), 'tally chart')].sort().join(',');
  return `tally:${data.title || ''}:${headers.join(',')}:${showTotalsResolved(data) ? '1' : '0'}:${data.blank === true ? 'b' : 'f'}:${rowKey}:${hi}`;
}

module.exports = { tightSvg, tallyMarksSvg, cacheKey };
