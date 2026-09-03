'use strict';

// SHARED place-value-chart geometry: the drawing the working wall uses, kept
// deliberately identical in look to the board's chart (builder/src/content/
// place-value-chart.js): the same column colours, the same row labels down the
// left, the same green ring round a digit that changed. A child who meets a
// place value chart on the board and looks up at the wall should see one
// picture, not two.
//
//   tightSvg(spec) → { svg, aspect, w, h }   cropped tight to the chart
//   cacheKey(spec) → string                  stable pre-render cache key
//
// Spec:
//   columns    the place-value column headings, in order, e.g.
//              ["Th", "H", "T", "O"] or ["O", ".", "t", "h"]. "." is the
//              decimal point and gets its own narrow column.
//   rows       one entry per row. A bare array is its cell values; an object
//              can also carry a label and a highlight:
//                { label, cells, highlight }
//              label      a short caption at the left of the row saying what it
//                         IS - "3,462", "10 more", "100 more". Without it a
//                         stack of rows is digits with nothing relating them.
//              highlight  which cells to pick out, named by their COLUMN
//                         ("T", or ["H","T"]); an index works too. This is what
//                         makes the chart a teaching picture rather than a
//                         grid: in a 10-more or 100-more lesson, WHICH column
//                         changed is the whole content of the lesson.
//   title      optional heading above the chart.
//
//   pair       ONE before-and-after comparison, drawn as two charts joined by a
//              bold labelled arrow: { from, to, operation, title }. Stacked rows
//              show two end states; what they never show is the change itself.
//              The pair draws the movement, which is what a wall card has to do
//              when nobody is standing beside it pointing.
//
// A highlighted cell KEEPS its column colour and gains a green ring with a
// green digit. Recolouring the cell would say "this is not a tens column any
// more", and the column coding is the other half of what the chart teaches.
//
// The pair form matches the board's semantics exactly (builder/src/content/
// place-value-chart.js), because a child glancing from the board to the wall has
// to meet one picture rather than two dialects of one. Three of those semantics
// are worth naming, since they are decisions rather than details:
//
//   - The changed column is DERIVED by comparing `from` with `to`, never
//     declared. A designer cannot mark a column that did not move, so the
//     picture can never assert something false, and the two-cell exchange case
//     (3,497 to 3,507) marks both columns without anyone remembering to.
//   - The title is read off the `to` cells unless overridden, so the words above
//     the picture and the digits inside it cannot drift apart.
//   - "same" is printed under every column that held still, in that column's own
//     colour. Without it the picture says only what changed and leaves the child
//     to infer the rest, which is exactly the half of "10 more" they get wrong.
//
// Drawn bolder here than on the board: a wall card is read from across a room
// rather than from a metre away, so the arrow, the rings and the type all run
// heavier than the slide's equivalents.

// ─── CONSTANTS (SVG user units; rescaled per engine by aspect) ──────────────
const FONT         = 'Arial';
const HEADER_FS    = 30;   // the column heading (Th, H, T, O)
const DIGIT_FS     = 46;   // a digit in a cell, the thing read from across the
                           // room, so clearly the largest type on the chart
const LABEL_FS     = 30;   // a row label
const TITLE_FS     = 36;

const DIGIT_COL_W  = 96;   // one digit column
const POINT_COL_W  = 44;   // the decimal point's own narrow column
const HEADER_H     = 52;
const ROW_H        = 86;
const LABEL_PAD_X  = 22;   // inside the row-label column
const LABEL_MIN_W  = 120;
const TITLE_GAP    = 16;

const GRID_W       = 2.5;  // ordinary cell border
const RING_W       = 8;    // the ring round a changed digit. Three times the
                           // grid line, because on a wall card read from across
                           // a classroom a slightly heavier line is no line.
const RING_INSET   = 6;    // keep adjacent highlights as two deliberate rings,
                           // not one joined outline with a dark corner knot
const GRID_COLOUR  = '#666666';
const TEXT_COLOUR  = '#000000';
const RING_COLOUR  = '#00B050';   // house answer-green: a changed digit is the
                                  // answer to "what happened?"
const TITLE_COLOUR = '#1F4E79';
const LABEL_FILL   = '#FFFFFF';
const DEFAULT_HEADER_FILL = '#D0D0D0';
const DEFAULT_CELL_FILL   = '#FFFFFF';

// The same palette the board draws, so the columns mean the same colour in both
// places. Each entry is [header fill, cell fill].
const COLUMN_COLOURS = {
  M:    ['#8AB8E8', '#C5DCFF'],
  HTh:  ['#8AB8E8', '#C5DCFF'],
  TTh:  ['#8AB8E8', '#C5DCFF'],
  Th:   ['#8AB8E8', '#C5DCFF'],
  H:    ['#8AC88A', '#C5EBC5'],
  T:    ['#E8D84A', '#FFF5A0'],
  O:    ['#E89090', '#FFD6D6'],
  '.':  ['#D0D0D0', '#EBEBEB'],
  t:    ['#E8D84A', '#FFF5A0'],
  h:    ['#8AC88A', '#C5EBC5'],
  th:   ['#8AB8E8', '#C5DCFF'],
};

// ── The before-and-after pair ───────────────────────────────────────────────
const PAIR_ARROW_GAP  = 190;  // between the two charts. Wide enough to hold the
                              // operation ("100 more") over the arrow without
                              // the words reaching either chart's border.
const PAIR_ARROW_W    = 14;   // the arrow shaft. Deliberately heavier than the
                              // board's: the arrow is the only mark that says
                              // something HAPPENED, and it is the first thing
                              // lost when a card is read from the back.
const PAIR_ARROW_HEAD = 34;   // head length; the width follows at 0.75 of it
const PAIR_ARROW_INSET = 12;  // clear of each chart's border
const PAIR_OP_FS      = 34;   // the operation, above the arrow
const PAIR_OP_GAP     = 14;   // between that label and the shaft

const PAIR_TITLE_H    = 74;   // the title bar across the top of the pair
const PAIR_TITLE_FS   = 40;
const PAIR_TITLE_GAP  = 22;
const PAIR_TITLE_PAD  = 18;   // inside the bar, left and right
const PAIR_TITLE_R    = 12;   // corner radius
const PAIR_TITLE_FILL = '#0070C0';  // house focus blue, the board's title bar
const PAIR_TITLE_INK  = '#FFFFFF';

const SAME_BAND_H     = 52;   // under the result chart
const SAME_FS         = 30;
const SAME_TEXT       = 'same';

// "same" in its column's own colour, so it reads as belonging to that column.
// The CELL colours are pale tints meant to sit behind black digits, and pale
// yellow text on white is no text at all, so each family gets a darkened version
// of its own hue: the same colour to the eye, actually readable across a room.
// These are the board's values, unchanged, so the two cards match.
const SAME_COLOURS = {
  M: '#2E75B6', HTh: '#2E75B6', TTh: '#2E75B6', Th: '#2E75B6', th: '#2E75B6',
  H: '#3E8E41', h: '#3E8E41',
  T: '#9C7A00', t: '#9C7A00',
  O: '#C0504D',
  '.': '#808080',
};

// A place-value column has a canonical short name - Th, H, T, O - and that
// short name is what the palette above is keyed on. A designer naturally writes
// the full word, and until this map existed a chart headed "Thousands,
// Hundreds, Tens, Ones" lost two things at once, both silently.
//
// It lost the colour coding: every lookup missed, so every column drew in the
// default grey, and the column coding is the half of this picture that says a
// counter's value comes from where it sits.
//
// And it lost the heading. "Thousands" is one word with no break opportunity,
// so a column narrower than the word is split mid-word and the one-line header
// band clips the bottom half. A Year 4 place-value deck (3 September 2026)
// shipped "Thousan/ds  Hundred/s" in grey across three slides, and the same
// lesson's working-wall build failed outright on the overlap and was repaired
// by hand to Th/H/T/O - the repair this map now makes unnecessary.
//
// So the spelling a designer uses stops being load-bearing. The canonical key
// resolves the colour whichever spelling arrives, and a heading falls back to
// the short name only where the full word cannot be printed at a size a child
// reads from the carpet.
//
// Case is significant among the canonical keys themselves - T is tens and t is
// tenths, H is hundreds and h is hundredths, Th is thousands and th is
// thousandths - so an already-canonical label is returned untouched and only a
// spelled-out name is folded to lower case.
const CANONICAL_COLUMN = {
  million: 'M',
  millions: 'M',
  'hundred thousand': 'HTh',
  'hundred thousands': 'HTh',
  'ten thousand': 'TTh',
  'ten thousands': 'TTh',
  thousand: 'Th',
  thousands: 'Th',
  hundred: 'H',
  hundreds: 'H',
  ten: 'T',
  tens: 'T',
  one: 'O',
  ones: 'O',
  unit: 'O',
  units: 'O',
  tenth: 't',
  tenths: 't',
  hundredth: 'h',
  hundredths: 'h',
  thousandth: 'th',
  thousandths: 'th',
  point: '.',
};

// The canonical short name for a column label, or the label unchanged when it
// is not a place-value name at all (a chart is free to head a column anything).
function canonicalColumn(label) {
  const raw = label == null ? '' : String(label);
  if (Object.prototype.hasOwnProperty.call(COLUMN_COLOURS, raw)) return raw;
  const words = raw.toLowerCase().replace(/\s+/g, ' ').trim().replace(/ (?:column|place)$/, '');
  const found = CANONICAL_COLUMN[words];
  return found === undefined ? raw : found;
}

const CHAR_W = 0.58;  // Arial-bold character-width estimate (× font size)
// ─── END CONSTANTS ──────────────────────────────────────────────────────────

function f(n) { return Number(n).toFixed(2); }

function escapeXml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function textWidth(s, fs) {
  return String(s == null ? '' : s).length * fs * CHAR_W;
}

// Every column is held by its canonical short name from here down, so the
// palette, the "same" band and a highlight all resolve whichever spelling the
// designer wrote. A wall card has one fixed header band at one fixed size and
// no room for "Thousands" at any width, so the short name is also what it
// prints - the repair a hand-edited card had to make for itself.
function columnsOf(data) {
  const raw = Array.isArray(data && data.columns) ? data.columns : [];
  return raw.map(canonicalColumn);
}

// A row is either a bare array of cell values or an object that can also carry
// a label and a highlight. Both normalise here, so no caller has to care.
function rowsOf(data) {
  const raw = Array.isArray(data && data.rows) ? data.rows : [];
  const rows = raw.map((row) => {
    if (Array.isArray(row)) return { label: '', cells: row, highlight: [] };
    if (!row || typeof row !== 'object') return { label: '', cells: [], highlight: [] };
    return {
      label: row.label == null ? '' : String(row.label),
      cells: Array.isArray(row.cells) ? row.cells : [],
      highlight:
        row.highlight == null ? [] : (Array.isArray(row.highlight) ? row.highlight : [row.highlight]),
    };
  });
  if (rows.length > 0) return rows;
  return [{ label: '', cells: [], highlight: [] }];
}

// A highlight names cells by their COLUMN, the way the lesson talks about them.
// A chart never repeats a column, so the name is unambiguous; an index works
// too. A name the chart does not have marks nothing, rather than guessing and
// ringing the wrong digit.
function pickedIn(row, columns) {
  const picked = new Set();
  row.highlight.forEach((hRaw) => {
    if (typeof hRaw === 'number' && Number.isInteger(hRaw)) {
      if (hRaw >= 0 && hRaw < columns.length) picked.add(hRaw);
      return;
    }
    const at = columns.indexOf(canonicalColumn(hRaw));
    if (at !== -1) picked.add(at);
  });
  return picked;
}

// ── The pair ────────────────────────────────────────────────────────────────

// A pair needs both ends. Anything less is not a comparison, and drawing half of
// one would show a chart that looks like a normal chart but means something else.
function pairOf(data) {
  const p = data && data.pair;
  if (!p || typeof p !== 'object') return null;
  const from = Array.isArray(p.from) ? p.from : null;
  const to = Array.isArray(p.to) ? p.to : null;
  if (!from || !to) return null;
  return {
    from,
    to,
    operation: p.operation != null ? String(p.operation) : '',
    title: p.title,
  };
}

// The number a row of cells spells, as a reader would write it: digits in column
// order, the point where the "." column sits, thousands separators through the
// whole-number part. This is what lets the title say "10 more: 3,472" without the
// designer restating a number the cells already carry, and so without the title
// and the chart ever being able to disagree.
function numberFromCells(columns, cells) {
  let whole = '';
  let frac = '';
  let seenPoint = false;
  columns.forEach((c, i) => {
    if (c === '.') { seenPoint = true; return; }
    const d = cells[i] == null ? '' : String(cells[i]);
    if (seenPoint) frac += d; else whole += d;
  });
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return frac === '' ? grouped : grouped + '.' + frac;
}

// Which columns actually moved. Derived, never declared, so the green digit can
// never mark a column that held still.
function changedIndices(columns, from, to) {
  const changed = new Set();
  columns.forEach((c, i) => {
    if (c === '.') return;
    const a = from[i] == null ? '' : String(from[i]);
    const b = to[i] == null ? '' : String(to[i]);
    if (a !== b) changed.add(i);
  });
  return changed;
}

// An explicit "" is a deliberate "no title bar"; anything else falls back to the
// operation and the result the cells spell.
function pairTitle(columns, pair) {
  if (pair.title != null) return String(pair.title);
  const result = numberFromCells(columns, pair.to);
  return pair.operation === '' ? result : pair.operation + ': ' + result;
}

// Shrink a label until it fits the room it has. A title or an operation that
// overruns is worse here than on a slide, because there is no autofit pass
// downstream to catch it.
function fitFont(text, availW, maxFs) {
  const len = String(text == null ? '' : text).length;
  if (len === 0) return maxFs;
  return Math.max(10, Math.min(maxFs, availW / (len * CHAR_W)));
}

function labelColWidth(rows) {
  const widest = rows.reduce((most, r) => Math.max(most, textWidth(r.label, LABEL_FS)), 0);
  if (widest === 0) return 0;
  return Math.max(widest + 2 * LABEL_PAD_X, LABEL_MIN_W);
}

// One chart of a pair: header row, then a single row of digits, with the changed
// ones green and ringed. Returns its SVG parts placed at (ox, oy).
function pairChartParts(columns, colWs, cells, picked, ox, oy) {
  const parts = [];
  const rings = [];
  let x = ox;

  columns.forEach((label, i) => {
    const pair = COLUMN_COLOURS[label];
    const w = colWs[i];

    parts.push(
      `<rect x="${f(x)}" y="${f(oy)}" width="${f(w)}" height="${f(HEADER_H)}" fill="${pair ? pair[0] : DEFAULT_HEADER_FILL}" stroke="${GRID_COLOUR}" stroke-width="${GRID_W}"/>`
    );
    if (label !== '.') {
      parts.push(
        `<text x="${f(x + w / 2)}" y="${f(oy + HEADER_H / 2)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${HEADER_FS}" font-weight="bold" fill="${TEXT_COLOUR}">${escapeXml(label)}</text>`
      );
    }

    const isDot = label === '.';
    const isPicked = !isDot && picked.has(i);
    const value = cells[i] == null ? '' : String(cells[i]);
    const text = isDot ? '.' : value;
    const y = oy + HEADER_H;

    parts.push(
      `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(ROW_H)}" fill="${pair ? pair[1] : DEFAULT_CELL_FILL}" stroke="${GRID_COLOUR}" stroke-width="${GRID_W}"/>`
    );
    if (text !== '') {
      parts.push(
        `<text x="${f(x + w / 2)}" y="${f(y + ROW_H / 2)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${DIGIT_FS}" font-weight="bold" fill="${isPicked ? RING_COLOUR : TEXT_COLOUR}">${escapeXml(text)}</text>`
      );
    }
    if (isPicked) {
      // Inset by the same amount the stacked form uses. It matters most here:
      // an exchange (3,497 to 3,507) rings two ADJACENT columns, and flush rings
      // fuse into one outline round the pair, which says "these two moved as one
      // thing" instead of "each of these two moved".
      rings.push(
        `<rect x="${f(x + RING_INSET)}" y="${f(y + RING_INSET)}" ` +
        `width="${f(w - 2 * RING_INSET)}" height="${f(ROW_H - 2 * RING_INSET)}" ` +
        `fill="none" stroke="${RING_COLOUR}" stroke-width="${RING_W}"/>`
      );
    }
    x += w;
  });

  // Rings last, so a neighbouring cell's fill drawn afterwards can never paint
  // over half of one.
  return parts.concat(rings);
}

function tightSvgPair(data, pair) {
  const columns = columnsOf(data);
  const colWs = columns.map((c) => (c === '.' ? POINT_COL_W : DIGIT_COL_W));
  const chartW = colWs.reduce((a, b) => a + b, 0);
  const chartH = HEADER_H + ROW_H;

  const changed = changedIndices(columns, pair.from, pair.to);
  const title = pairTitle(columns, pair);
  const hasTitle = title !== '';

  // The band is only reserved when something will stand in it.
  const anySame = columns.some((c, i) => c !== '.' && !changed.has(i));
  const sameH = anySame ? SAME_BAND_H : 0;

  const totalW = 2 * chartW + PAIR_ARROW_GAP;
  const titleBlock = hasTitle ? PAIR_TITLE_H + PAIR_TITLE_GAP : 0;
  const chartsY = titleBlock;
  const totalH = titleBlock + chartH + sameH;

  const leftX = 0;
  const rightX = chartW + PAIR_ARROW_GAP;

  const parts = [];

  if (hasTitle) {
    parts.push(
      `<rect x="0" y="0" width="${f(totalW)}" height="${f(PAIR_TITLE_H)}" rx="${PAIR_TITLE_R}" ry="${PAIR_TITLE_R}" fill="${PAIR_TITLE_FILL}"/>`
    );
    parts.push(
      `<text x="${f(totalW / 2)}" y="${f(PAIR_TITLE_H / 2)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${f(fitFont(title, totalW - 2 * PAIR_TITLE_PAD, PAIR_TITLE_FS))}" font-weight="bold" fill="${PAIR_TITLE_INK}">${escapeXml(title)}</text>`
    );
  }

  // The start chart carries no rings: nothing has happened to it yet.
  parts.push(...pairChartParts(columns, colWs, pair.from, new Set(), leftX, chartsY));
  parts.push(...pairChartParts(columns, colWs, pair.to, changed, rightX, chartsY));

  // The arrow, across the gap at the charts' middle. The only mark in the picture
  // that says something happened.
  const ay = chartsY + chartH / 2;
  const ax0 = leftX + chartW + PAIR_ARROW_INSET;
  const ax1 = rightX - PAIR_ARROW_INSET;
  const headW = PAIR_ARROW_HEAD * 0.75;
  parts.push(
    `<line x1="${f(ax0)}" y1="${f(ay)}" x2="${f(ax1 - PAIR_ARROW_HEAD)}" y2="${f(ay)}" stroke="${PAIR_TITLE_FILL}" stroke-width="${PAIR_ARROW_W}" stroke-linecap="butt"/>`
  );
  parts.push(
    `<polygon points="${f(ax1)},${f(ay)} ${f(ax1 - PAIR_ARROW_HEAD)},${f(ay - headW / 2)} ${f(ax1 - PAIR_ARROW_HEAD)},${f(ay + headW / 2)}" fill="${PAIR_TITLE_FILL}"/>`
  );

  if (pair.operation !== '') {
    const opFs = fitFont(pair.operation, PAIR_ARROW_GAP - 2 * PAIR_ARROW_INSET, PAIR_OP_FS);
    parts.push(
      `<text x="${f(leftX + chartW + PAIR_ARROW_GAP / 2)}" y="${f(ay - PAIR_ARROW_W / 2 - PAIR_OP_GAP)}" text-anchor="middle" font-family="${FONT}" font-size="${f(opFs)}" font-weight="bold" fill="${PAIR_TITLE_FILL}">${escapeXml(pair.operation)}</text>`
    );
  }

  // "same" under every column of the RESULT chart that held still.
  if (anySame) {
    let sx = rightX;
    columns.forEach((label, i) => {
      const w = colWs[i];
      if (label !== '.' && !changed.has(i)) {
        parts.push(
          `<text x="${f(sx + w / 2)}" y="${f(chartsY + chartH + SAME_BAND_H / 2)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${SAME_FS}" font-weight="bold" fill="${SAME_COLOURS[label] || TEXT_COLOUR}">${SAME_TEXT}</text>`
        );
      }
      sx += w;
    });
  }

  const bleed = RING_W / 2;
  const w = totalW + 2 * bleed;
  const h = totalH + 2 * bleed;
  const svg =
    `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" ` +
    `width="${f(w)}" height="${f(h)}" viewBox="${f(-bleed)} ${f(-bleed)} ${f(w)} ${f(h)}">` +
    `${parts.join('')}</svg>`;
  return { svg, aspect: w / h, w, h };
}

function tightSvg(data) {
  const pair = pairOf(data);
  if (pair) return tightSvgPair(data, pair);

  const columns = columnsOf(data);
  const rows = rowsOf(data);
  const title = data && data.title ? String(data.title) : '';

  const labelW = labelColWidth(rows);
  const colWs = columns.map((c) => (c === '.' ? POINT_COL_W : DIGIT_COL_W));
  const allWs = labelW > 0 ? [labelW].concat(colWs) : colWs.slice();

  const xs = [];
  let running = 0;
  for (const w of allWs) { xs.push(running); running += w; }
  const tableW = running;

  const titleH = title ? TITLE_FS + TITLE_GAP : 0;
  const gridTop = titleH;
  const totalH = gridTop + HEADER_H + rows.length * ROW_H;

  const parts = [];

  if (title) {
    parts.push(
      `<text x="${f(tableW / 2)}" y="${f(TITLE_FS * 0.82)}" text-anchor="middle" font-family="${FONT}" font-size="${TITLE_FS}" font-weight="bold" fill="${TITLE_COLOUR}">${escapeXml(title)}</text>`
    );
  }

  function cellRect(x, y, w, h, fill) {
    parts.push(
      `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}" stroke="${GRID_COLOUR}" stroke-width="${GRID_W}"/>`
    );
  }

  function centredText(x, y, w, h, text, fs, colour) {
    if (text === '' || text == null) return;
    parts.push(
      `<text x="${f(x + w / 2)}" y="${f(y + h / 2)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${fs}" font-weight="bold" fill="${colour}">${escapeXml(text)}</text>`
    );
  }

  // ── Header row. The cell above the labels stays blank: the labels name rows,
  //    not a column, and a heading over them would promise one that is not there.
  if (labelW > 0) cellRect(xs[0], gridTop, labelW, HEADER_H, LABEL_FILL);
  columns.forEach((label, i) => {
    const at = labelW > 0 ? i + 1 : i;
    const pair = COLUMN_COLOURS[label];
    cellRect(xs[at], gridTop, colWs[i], HEADER_H, pair ? pair[0] : DEFAULT_HEADER_FILL);
    centredText(xs[at], gridTop, colWs[i], HEADER_H, label === '.' ? '' : label, HEADER_FS, TEXT_COLOUR);
  });

  // ── Body rows. Cells first, then every ring on top, so a ring is never half
  //    painted over by the neighbouring cell's fill drawn after it.
  const rings = [];
  rows.forEach((row, r) => {
    const y = gridTop + HEADER_H + r * ROW_H;
    const picked = pickedIn(row, columns);
    const rowHasDigits = columns.some(
      (c, i) => c !== '.' && row.cells[i] != null && String(row.cells[i]) !== ''
    );

    if (labelW > 0) {
      cellRect(xs[0], y, labelW, ROW_H, LABEL_FILL);
      centredText(xs[0], y, labelW, ROW_H, row.label, LABEL_FS, TEXT_COLOUR);
    }

    columns.forEach((column, i) => {
      const at = labelW > 0 ? i + 1 : i;
      const pair = COLUMN_COLOURS[column];
      const isDot = column === '.';
      const isPicked = !isDot && picked.has(i);
      // The decimal point belongs to a number, so it prints in a row that has
      // one and stays blank in a row the child is meant to fill.
      const value = row.cells[i] == null ? '' : String(row.cells[i]);
      const text = isDot ? (rowHasDigits ? '.' : '') : value;

      cellRect(xs[at], y, colWs[i], ROW_H, pair ? pair[1] : DEFAULT_CELL_FILL);
      centredText(xs[at], y, colWs[i], ROW_H, text, DIGIT_FS, isPicked ? RING_COLOUR : TEXT_COLOUR);
      if (isPicked) {
        rings.push(
          `<rect x="${f(xs[at] + RING_INSET)}" y="${f(y + RING_INSET)}" ` +
          `width="${f(colWs[i] - 2 * RING_INSET)}" height="${f(ROW_H - 2 * RING_INSET)}" ` +
          `fill="none" stroke="${RING_COLOUR}" stroke-width="${RING_W}"/>`
        );
      }
    });
  });
  parts.push(rings.join(''));

  // Tight to the drawing, plus half the heaviest stroke each side so a ring on
  // an outer cell is not shaved in half by the crop.
  const bleed = RING_W / 2;
  const w = tableW + 2 * bleed;
  const h = totalH + 2 * bleed;
  const svg =
    `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" ` +
    `width="${f(w)}" height="${f(h)}" viewBox="${f(-bleed)} ${f(-bleed)} ${f(w)} ${f(h)}">` +
    `${parts.join('')}</svg>`;
  return { svg, aspect: w / h, w, h };
}

function cacheKey(data) {
  const columns = columnsOf(data);
  // A pair keys on its own fields and nothing else. Two pairs of the same chart
  // (10 more and 100 more of 3,462) differ ONLY in their `to` cells, so a key
  // that ignored them would render the first pair and hand the same picture to
  // the second - a card asserting 100 more with the tens digit ringed.
  const pair = pairOf(data);
  if (pair) {
    const t = pair.title == null ? '~' : String(pair.title);
    return `pvchart:pair:${columns.join(',')}:${pair.from.join(',')}>${pair.to.join(',')}:${pair.operation}:${t}`;
  }
  const rowKey = rowsOf(data)
    .map((r) => `${r.label}=${r.cells.join(',')}#${r.highlight.join(',')}`)
    .join('|');
  return `pvchart:${(data && data.title) || ''}:${columns.join(',')}:${rowKey}`;
}

// Generic inline action cue: one mark in each column. It deliberately omits
// place headings so it remains honest for whole-number and decimal charts.
function onePerColumnCueSvg() {
  const w = 240, h = 92, cellW = 76;
  const cols = [COLUMN_COLOURS.H, COLUMN_COLOURS.T, COLUMN_COLOURS.O];
  const parts = [];
  cols.forEach(function (col, i) {
    const x = 6 + i * cellW;
    parts.push(`<rect x="${x}" y="6" width="${cellW}" height="80" fill="${col[1]}" stroke="${GRID_COLOUR}" stroke-width="5"/>`);
    parts.push(`<circle cx="${x + cellW / 2}" cy="46" r="13" fill="${TEXT_COLOUR}"/>`);
  });
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join('')}</svg>`;
  return { svg, aspect: w / h, w, h };
}

module.exports = { tightSvg, onePerColumnCueSvg, cacheKey, COLUMN_COLOURS, canonicalColumn };
