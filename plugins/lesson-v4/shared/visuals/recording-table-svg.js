'use strict';

// Shared geometry for a write-on RECORDING TABLE - the structured grid a child
// records decisions into (device / electrical or not / power source / what makes
// it work), glued in because the table's furniture is exactly what a child
// cannot rule quickly in a squared book: by the time thirty children have drawn
// four columns with headers, the thinking time the table exists to hold is gone.
//
// The spec is copied field for field from the slide's `table`, so the glued grid
// matches the board. It is always rendered in its QUESTION form: any cell whose
// value carries the `||` reveal marker is an answer the board reveals, so it is
// stripped to a blank write-on cell here - copying either the task slide's table
// or the check slide's table therefore yields the same blank piece.

// ─── CONSTANTS (SVG user units) ─────────────────────────────────────────────
const W = 1200;
const OUTER_PAD = 8;
const GRID_STROKE = 3;
const CELL_PAD_X = 16;
const CELL_PAD_Y = 10;
const HEADER_FS = 30;
const CELL_FS_MAX = 26;
const CELL_FS_MIN = 18;
const LINE_HEIGHT = 1.22;
const CHAR_W = 0.54;
// A response cell holds a Year 4 phrase in the child's own hand, so its height
// is set by handwriting, not by the printed text beside it.
const RESPONSE_ROW_H = 120;
const HEADER_FILL = '#2D3748';
const HEADER_TEXT = '#FFFFFF';
const GRID_COLOUR = '#2D3748';
const GIVEN_TEXT = '#1A1A1A';
const CELL_FILL = '#FFFFFF';
const FONT = 'Arial';
// ─── END CONSTANTS ─────────────────────────────────────────────────────────

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// A `||` anywhere in a cell marks revealed-answer content; the write-on piece
// blanks it so no child glues in a finished answer.
function writeOnValue(value) {
  const text = String(value == null ? '' : value);
  return text.includes('||') ? '' : text.trim();
}

function wrapText(text, maxWidth, maxFs, minFs) {
  for (let fs = maxFs; fs >= minFs; fs -= 1) {
    const perLine = Math.max(1, Math.floor(maxWidth / (fs * CHAR_W)));
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length <= perLine) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    const widest = lines.reduce((max, l) => Math.max(max, l.length), 0);
    if (widest * fs * CHAR_W <= maxWidth || fs === minFs) {
      return { lines, fs };
    }
  }
  return { lines: [String(text)], fs: minFs };
}

function normalise(data = {}) {
  const headers = (Array.isArray(data.headers) ? data.headers : [])
    .map((h) => String(h == null ? '' : h).trim());
  const rows = (Array.isArray(data.rows) ? data.rows : []).map((row) =>
    (Array.isArray(row) ? row : []).map(writeOnValue)
  );
  return { headers, rows };
}

function columnWidths(headers, rows, innerW) {
  // The first column usually carries the given item names, so it hugs the
  // longest of them (within bounds); the response columns share the rest
  // equally, because a child's answer needs the width more than a heading does.
  const cols = headers.length;
  const firstTexts = [headers[0]].concat(rows.map((r) => r[0] || ''));
  const longest = firstTexts.reduce((max, t) => Math.max(max, String(t).length), 0);
  let firstW = longest * CELL_FS_MAX * CHAR_W + 2 * CELL_PAD_X;
  firstW = Math.max(innerW * 0.16, Math.min(innerW * 0.3, firstW));
  const restW = (innerW - firstW) / (cols - 1);
  const widths = [firstW];
  for (let i = 1; i < cols; i += 1) widths.push(restW);
  return widths;
}

function textLines(x, yTop, cellH, wrap, colour, weight, anchorMiddle, cellW) {
  const blockH = wrap.lines.length * wrap.fs * LINE_HEIGHT;
  const startY = yTop + (cellH - blockH) / 2;
  return wrap.lines
    .map((line, i) => {
      const y = startY + (i + 0.82) * wrap.fs * LINE_HEIGHT;
      const anchor = anchorMiddle ? ` text-anchor="middle"` : '';
      const xPos = anchorMiddle ? x + cellW / 2 : x + CELL_PAD_X;
      return `<text x="${xPos.toFixed(2)}" y="${y.toFixed(2)}"${anchor} font-family="${FONT}" font-size="${wrap.fs}" font-weight="${weight}" fill="${colour}">${esc(line)}</text>`;
    })
    .join('');
}

function tightSvg(data = {}) {
  const { headers, rows } = normalise(data);
  if (headers.length < 2) {
    throw new Error('recording-table needs at least two column headers.');
  }
  const innerW = W - 2 * OUTER_PAD;
  const widths = columnWidths(headers, rows, innerW);

  // Header height from the tallest wrapped header.
  const headerWraps = headers.map((h, i) =>
    wrapText(h, widths[i] - 2 * CELL_PAD_X, HEADER_FS, CELL_FS_MIN)
  );
  const headerLines = headerWraps.reduce((max, w) => Math.max(max, w.lines.length), 1);
  const headerH = headerLines * HEADER_FS * LINE_HEIGHT + 2 * CELL_PAD_Y;

  // Every body row gets handwriting height: even a row with a printed first
  // cell is there to be written into.
  const rowWraps = rows.map((row) =>
    row.map((cell, i) =>
      cell
        ? wrapText(cell, widths[i] - 2 * CELL_PAD_X, CELL_FS_MAX, CELL_FS_MIN)
        : null
    )
  );
  const rowHeights = rows.map((row, r) => {
    const printed = rowWraps[r].reduce(
      (max, w) => Math.max(max, w ? w.lines.length * w.fs * LINE_HEIGHT + 2 * CELL_PAD_Y : 0),
      0
    );
    return Math.max(RESPONSE_ROW_H, printed);
  });

  const H = OUTER_PAD * 2 + headerH + rowHeights.reduce((a, b) => a + b, 0);
  const parts = [];

  // Header band.
  let x = OUTER_PAD;
  parts.push(
    `<rect x="${OUTER_PAD}" y="${OUTER_PAD}" width="${innerW}" height="${headerH.toFixed(2)}" fill="${HEADER_FILL}"/>`
  );
  headers.forEach((h, i) => {
    parts.push(textLines(x, OUTER_PAD, headerH, headerWraps[i], HEADER_TEXT, 'bold', true, widths[i]));
    x += widths[i];
  });

  // Body cells.
  let y = OUTER_PAD + headerH;
  rows.forEach((row, r) => {
    let cx = OUTER_PAD;
    for (let c = 0; c < headers.length; c += 1) {
      parts.push(
        `<rect x="${cx.toFixed(2)}" y="${y.toFixed(2)}" width="${widths[c].toFixed(2)}" height="${rowHeights[r].toFixed(2)}" fill="${CELL_FILL}" stroke="${GRID_COLOUR}" stroke-width="${GRID_STROKE}"/>`
      );
      const wrap = rowWraps[r][c];
      if (wrap) {
        parts.push(textLines(cx, y, rowHeights[r], wrap, GIVEN_TEXT, c === 0 ? 'bold' : 'normal', true, widths[c]));
      }
      cx += widths[c];
    }
    y += rowHeights[r];
  });

  // Outer frame over the top so the boundary reads as one crisp line.
  parts.push(
    `<rect x="${OUTER_PAD}" y="${OUTER_PAD}" width="${innerW}" height="${(headerH + rowHeights.reduce((a, b) => a + b, 0)).toFixed(2)}" fill="none" stroke="${GRID_COLOUR}" stroke-width="${GRID_STROKE}"/>`
  );

  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H.toFixed(2)}" viewBox="0 0 ${W} ${H.toFixed(2)}">${parts.join('')}</svg>`;
  return { svg, w: W, h: H };
}

module.exports = { tightSvg, normalise };
