'use strict';

// THE place value chart. One drawing, placed by the board, the worksheet, the
// working wall and the stick-in pack.
//
// It was three. The board drew PowerPoint tables in a 1,266-line file, the wall
// drew this module's older SVG in Arial on a fixed canvas, and the sheet drew a
// CSS grid with no column colours, orange digits and a blue ring, plus a second
// CSS chart of counters in the manipulatives' purple, blue and red. The board and
// the wall had been matched feature by feature (the pair, the counters, "same"),
// and still every repair had to be made twice, while a child moving from the
// board to the sheet met a different picture of the same columns (13 September
// 2026). This file is now the one place a place value chart is drawn; each
// surface passes the box it has and its profile (shared/visuals/
// surface-profiles.js).
//
// Laid out in points at the size it prints, so a digit's size is a real size
// on every surface and a chart squeezed into a small slide zone refuses by name
// rather than printing digits nobody can read.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout, anchor }
//   cacheKey(spec, profile) -> string
//   normalise(spec)         -> the chart, in one vocabulary
//   minWidthPt(spec, profile) -> the narrowest box the chart can be drawn in
//
// ─── the spec (the board's spelling) ─────────────────────────────────────
//
//   columns    headings in order: ["Th","H","T","O"], [".","t","h"] for
//              decimals, or the words ("Thousands"). Supported: M, HTh, TTh,
//              Th, H, T, O, ".", t, h, th.
//   rows       one entry per row. A bare array is its cells; an object may
//              carry { label, cells, highlight, counters, counterLabels }.
//              `rows: []` is the bare heading strip; leaving `rows` out is one
//              blank row for live completion.
//     label      what the row IS ("3,462", "10 more"), in a column at the left
//     highlight  which cell(s) changed, by column name or index
//     answer     true prints this row's digits in answer green with no ring:
//                the row is a result, not the number the question started from
//     counters   { Th: 3, H: 4, ... } place-value counters above the digits
//     counterLabels  true prints each counter's value on it
//   title      a heading above a stacked chart (the wall's)
//   instances  several copies side by side (the sheet's "write each number")
//   pair       ONE before-and-after comparison:
//              { from, to, operation, title, counters: { from, to },
//                exchanges: [{ from, to, count, label }] }
//
// Older spellings still draw: the sheet's counter chart
// ({ columns: ["thousands", ...], counts: { thousands: 2 } }) is a chart whose
// one row is counters with their values on them and no digit row, because that
// sheet asks "what number is shown?" and the answer is written elsewhere.
//
// ─── what the picture holds to, and why ──────────────────────────────────
//
// A highlighted cell KEEPS its column colour and gains a green ring with a green
// digit. Recolouring the cell would say "this is not a tens column any more",
// and the column coding is the other half of what the chart teaches. Green is the
// answer colour, which is what a changed digit is. (The sheet used question blue
// until 13 September 2026; one picture has one ring.)
//
// The pair's changed column is DERIVED by comparing `from` with `to`, never
// declared, so the picture can never ring a column that did not move, and the
// exchange case (3,497 to 3,507) rings both. An empty result cell is an unknown
// for the child, not a digit that "changed to blank", so it is not ringed and no
// "same" is printed under a pair still being worked out. The title is read off
// the `to` cells unless overridden, so the words and the digits cannot disagree.
// "same" prints under every column that held still, in that column's own
// darkened colour, because without it the picture says only what changed and a
// child infers the rest - exactly the half of "10 more" they get wrong. ONE pair
// is ONE comparison: 10 more and 100 more of 3,462 are two pairs, never a chain
// of three charts, because a chain says the third number grew out of the second.

const { textWidthEm } = require('../text/comic-glyph-width');
const { profileFor } = require('./surface-profiles');
const { insetProfile } = require('./fit-unit');

// ─── CONSTANTS ──────────────────────────────────────────────────────────────
// Sizes are in D, the digit's font size, so the whole chart grows and shrinks
// together; the proportions are the board's, which had been tuned for a room
// (0.45in columns, 0.38in heading band and 0.55in rows at 18pt digits).
const DIGIT_OF_FONT = 0.75;   // D at its natural size, as a share of the profile's
                              // font: the board's 18pt digit beside its 24pt numerals
const MAX_SCALE = 1.7;        // how far D may grow past natural; the board's ceiling,
                              // which puts a sheet's digit at about the 14pt it was
const BOARD_MIN_SCALE = 0.65; // the smallest the board's digits may go, the scale the
                              // board chart always held as readable from the carpet
const COL_W = 1.8;            // one digit column
const POINT_W = 0.4;          // the decimal point's narrow column, in digit columns
const LABEL_COLS = 1.55;      // a row label's column, in digit columns. Fixed rather
                              // than measured, so charts side by side stay in register
const LABEL_MAX_SHARE = 0.3;  // ...and never more than this share of the chart, or a
                              // two-column chart is a caption with digits stapled on
const HEADER_H = 1.52;
const ROW_H = 2.2;
const COUNTER_H = 4.8;        // the counter band above a row of digits
const HEAD_FONT = 0.72;       // a heading, as a share of D
const LABEL_FONT = 0.78;      // a row label
const TITLE_FONT = 0.87;
const TITLE_GAP = 0.3;
const COL_MAX = 5;            // paper's widest digit column, in D at its ceiling: a
                              // column wider than 24mm is not easier to write in,
                              // just emptier (the sheet's PVCHART_COL_MAX_MM)
const INSTANCE_GAP = 1.2;     // between charts side by side, so borders never touch
const CELL_INSET_OF_N = 0.32; // the margin either side of a cell's words (0.08in at 18pt)
const GRID_W = 0.05;          // a cell rule, at least 1pt
const RING_W = 0.12;          // the ring round a changed digit, at least 3pt: three
                              // times the rule, because from the back of the room a
                              // slightly thicker line is no line
const RING_INSET = 0.13;      // keeps two adjacent rings as two rings, not one outline
                              // with a knot in the corner
const COUNTER_MAX = 20;       // guards a malformed spec from flooding a chart
const COUNTER_MAX_D = 1.0;    // an unlabelled counter at most as wide as a digit is tall
const LABELLED_COUNTER_MAX_D = 2.0; // a counter carrying "0.01" needs about a 9mm disc on
                              // paper: the sheet's counter, which it was sized for
const COUNTER_FILL_SHARE = 0.68;
const LABELLED_FILL_SHARE = 0.82;
const COUNTER_FACE_WIDTH = 0.9; // the share of a disc its value may use across
// The smallest a counter can be and still be counted.
//
// The chart had a height floor and never a width one, and the two are not
// interchangeable: the counter band grows with the scale while a column keeps
// the width the layout gave it, so a tall thin cell spends its height on gaps.
// Two four-column charts sharing the 60% side of a split gave six counters
// 0.10in each, every check passed and the deck shipped (Daniel, 3 September
// 2026: "2 in one slide is still too small to do anything with. The columns are
// too narrow"). Half the intended board counter, which is also the smallest
// mark a heading's own 9pt minimum allows.
const COUNTER_READABLE_PT = 9;
const COUNTER_FACE_MIN_PT = 9; // a counter's value below this is a smudge, not a number
// The narrowest a column can be and still be written in.
//
// The counter floor measures counters, so a chart drawing none passed it by
// having nothing to measure, and the chart a teacher writes into is exactly the
// chart with none. Two charts with a blank "Value" row shared a slide at 0.72in
// and 0.64in a column (Daniel, 4 September 2026: "there's no way the teacher if
// they wanted to could write neatly in the columns because they're not wide
// enough"). Paper answered how much room one handwritten digit needs: 14mm,
// with a 16mm row. The board holds the same standard converted by its type,
// 14mm at 12pt being 0.83in at 18pt, and a teacher's pen on the board needs no
// taller row than the chart already draws.
const WRITE_IN = {
  slides: { colPt: 0.83 * 72, rowPt: 0 },
  worksheets: { colPt: (14 * 72) / 25.4, rowPt: (16 * 72) / 25.4 },
  stickin: { colPt: (14 * 72) / 25.4, rowPt: (16 * 72) / 25.4 },
  wall: { colPt: 0, rowPt: 0 }, // a wall chart is read, never written on
};

// ── the pair ────────────────────────────────────────────────────────────────
const PAIR_MAX_SCALE = 2.6;        // a pair carries one row per chart, so there is
                                   // height to spend on big digits
const PAIR_BOARD_MIN_SCALE = 0.7;
const PAIR_COUNTER_MIN_SCALE = 0.42;
const PAIR_COUNTER_COL_W = 2.6;    // a pair column holding counters, at least
const PAIR_COUNTER_COL_MAX = 3.5;  // ...and at most, in D
const PAIR_GAP = 4.1;              // between the charts; the arrow lives in it
const PAIR_ARROW_W = 0.33;         // bold on purpose: the arrow IS the change
const PAIR_ARROW_HEAD = 0.74;
const PAIR_ARROW_INSET = 0.25;
const PAIR_OP_FONT = 1.0;
const PAIR_TITLE_H = 1.6;
const PAIR_TITLE_GAP = 0.45;
const PAIR_TITLE_R = 0.25;
const SAME_H = 1.13;
const SAME_FONT = 0.78;
const SAME_TEXT = 'same';
const EXCHANGE_H = 3.4;        // the exchange cue band: tall enough that ten counters
                              // read as ten counters and not a row of dots
const EXCHANGE_GAP = 0.25;
const EXCHANGE_FONT = 0.67;

const COLOURS = {
  grid: '#666666',
  text: '#000000',
  ring: '#00B050',     // house answer-green
  title: '#0070C0',    // house focus blue, the board's title bar
  titleInk: '#FFFFFF',
  counterLine: '#4A4A4A',
  labelFill: '#FFFFFF',
  headerFill: '#D0D0D0',
  cellFill: '#FFFFFF',
};
// The stick-in pack is photocopied, so its chart keeps the rules, the ring and
// the counters and gives up the tints, which print as muddy grey.
const INK = {
  grid: '#1A1A1A',
  text: '#1A1A1A',
  ring: '#1A1A1A',
  title: '#1A1A1A',
  titleInk: '#FFFFFF',
  counterLine: '#1A1A1A',
  labelFill: '#FFFFFF',
  headerFill: '#E6E6E6',
  cellFill: '#FFFFFF',
};

// The palette every surface draws, so a column means the same colour on the
// board, the sheet and the wall. Each entry is [header fill, cell fill].
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

// "same" in its column's own colour, so it reads as belonging to that column.
// The cell colours are pale tints meant to sit behind black digits, and pale
// yellow text on white is no text at all, so each family gets a darkened version
// of its own hue: the same colour to the eye, readable across a room.
const SAME_COLOURS = {
  M: '#2E75B6', HTh: '#2E75B6', TTh: '#2E75B6', Th: '#2E75B6', th: '#2E75B6',
  H: '#3E8E41', h: '#3E8E41',
  T: '#9C7A00', t: '#9C7A00',
  O: '#C0504D',
  '.': '#808080',
};
// ─── END CONSTANTS ──────────────────────────────────────────────────────────

// A place-value column has a canonical short name - Th, H, T, O - and that is
// what the palette is keyed on. A designer naturally writes the full word, and
// until this map existed a chart headed "Thousands, Hundreds, Tens, Ones" lost
// two things at once, both silently: every colour lookup missed, so every column
// drew grey, and "Thousands", one word with no break, split mid-word in a column
// narrower than itself. A Year 4 deck (3 September 2026) shipped
// "Thousan/ds Hundred/s" in grey across three slides, and the same lesson's wall
// failed its build on the overlap and was repaired by hand to Th/H/T/O.
//
// Case is significant among the canonical keys - T is tens and t is tenths, H is
// hundreds and h hundredths, Th thousands and th thousandths - so an
// already-canonical label is returned untouched and only a spelled-out name is
// folded to lower case.
const CANONICAL_COLUMN = {
  million: 'M', millions: 'M',
  'hundred thousand': 'HTh', 'hundred thousands': 'HTh',
  'ten thousand': 'TTh', 'ten thousands': 'TTh',
  thousand: 'Th', thousands: 'Th',
  hundred: 'H', hundreds: 'H',
  ten: 'T', tens: 'T',
  one: 'O', ones: 'O', unit: 'O', units: 'O',
  tenth: 't', tenths: 't',
  hundredth: 'h', hundredths: 'h',
  thousandth: 'th', thousandths: 'th',
  point: '.',
};

function canonicalColumn(label) {
  const raw = label == null ? '' : String(label);
  if (Object.prototype.hasOwnProperty.call(COLUMN_COLOURS, raw)) return raw;
  const words = raw.toLowerCase().replace(/\s+/g, ' ').trim().replace(/ (?:column|place)$/, '');
  const found = CANONICAL_COLUMN[words];
  return found === undefined ? raw : found;
}

// Values are derived from the column, never separately authored answer text.
const COUNTER_VALUES = { M: '1000000', HTh: '100000', TTh: '10000', Th: '1000', H: '100', T: '10', O: '1', t: '0.1', h: '0.01', th: '0.001' };
function counterValue(column) {
  const value = COUNTER_VALUES[canonicalColumn(column)];
  if (!value) throw new Error('PLACE_VALUE_COUNTER_LABEL_UNKNOWN_COLUMN: ' + column);
  return value;
}

const PLACE_VALUE = { M: 1e6, HTh: 1e5, TTh: 1e4, Th: 1000, H: 100, T: 10, O: 1, t: 0.1, h: 0.01, th: 0.001 };
const COLUMN_WORD = {
  M: 'million', HTh: 'hundred thousand', TTh: 'ten thousand', Th: 'thousand',
  H: 'hundred', T: 'ten', O: 'one', t: 'tenth', h: 'hundredth', th: 'thousandth',
};

// Kept for callers that lay out labelled counters in their own units: the grid
// that leaves the most diameter for the whole label, refused rather than shrunk
// below the font a child can read.
function labelledCounterGrid(w, h, count, label, minFont, unitsPerPoint, maxDiameter = Infinity) {
  let best = null;
  for (let cols = 1; cols <= count; cols += 1) {
    const rows = Math.ceil(count / cols);
    const stepW = w / cols;
    const stepH = h / rows;
    const d = Math.min(Math.min(stepW, stepH) * 0.82, maxDiameter);
    const font = Math.min(14, (d * 0.72) / (label.length * 0.62 * unitsPerPoint));
    if (!best || d > best.d) best = { cols, rows, stepW, stepH, d, font };
  }
  if (!best || best.font < minFont) throw new Error('PLACE_VALUE_COUNTER_LABELS_DO_NOT_FIT: enlarge the chart or use fewer simultaneous examples');
  return best;
}

function isObj(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

function asList(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function str(v) {
  return v == null ? '' : String(v);
}

function esc(s) {
  return str(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function f2(n) {
  return Math.round(n * 100) / 100;
}

// A counter population is written the way the lesson talks about the column,
// so `{ Thousands: 6 }` has to find a chart headed "Th" and the other way round.
function populations(raw) {
  if (!isObj(raw)) return null;
  const out = {};
  Object.keys(raw).forEach((key) => {
    const n = Number(raw[key]);
    out[canonicalColumn(key)] = Number.isFinite(n) && n > 0 ? Math.min(COUNTER_MAX, Math.floor(n)) : 0;
  });
  return out;
}

function countIn(pops, column) {
  return pops ? pops[column] || 0 : 0;
}

// A highlight names cells by their COLUMN, the way the lesson talks ("the tens
// changed"); a chart never repeats a column, so the name is unambiguous. An index
// works too. A name the chart does not have marks nothing, rather than guessing.
function pickedIndices(highlight, columns) {
  const picked = new Set();
  asList(highlight).forEach((h) => {
    if (typeof h === 'number' && Number.isInteger(h)) {
      if (h >= 0 && h < columns.length) picked.add(h);
      return;
    }
    const at = columns.indexOf(canonicalColumn(h));
    if (at !== -1) picked.add(at);
  });
  return picked;
}

function normaliseRow(row, columns) {
  if (Array.isArray(row)) row = { cells: row };
  if (!isObj(row)) row = {};
  const cells = Array.isArray(row.cells) ? row.cells.map(str) : [];
  return {
    label: str(row.label),
    cells,
    picked: pickedIndices(row.highlight, columns),
    highlight: asList(row.highlight).map(str),
    counters: populations(row.counters),
    counterLabels: row.counterLabels === true,
    digits: row.digits !== false,
    answer: row.answer === true,
  };
}

// The number a row of cells spells, as a reader writes it: digits in column
// order, the point where the "." sits, thousands separators through the whole
// part. A thousands placeholder shown in the chart ("0 | 9 | 0 | 0") is written
// 900, not 0,900, so leading zeros go from the title and stay in the cells.
function numberFromCells(columns, cells) {
  let whole = '';
  let frac = '';
  let seenPoint = false;
  columns.forEach((c, i) => {
    if (c === '.') { seenPoint = true; return; }
    const d = str(cells[i]);
    if (seenPoint) frac += d; else whole += d;
  });
  const grouped = whole.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return frac === '' ? grouped : grouped + '.' + frac;
}

function plural(word, qty) {
  return qty === 1 ? word : word + 's';
}

// An array because a boundary can cascade (1,990 to 2,000 needs T to H and H to
// Th). A cue naming a column the chart does not have is dropped rather than
// drawn against the wrong column.
function normaliseExchanges(pair, columns) {
  const raw = asList(pair.exchanges != null ? pair.exchanges : pair.exchange);
  return raw
    .filter((cue) => isObj(cue) && columns.includes(canonicalColumn(cue.from)) && columns.includes(canonicalColumn(cue.to)))
    .map((cue) => {
      const from = canonicalColumn(cue.from);
      const to = canonicalColumn(cue.to);
      const count = Number.isFinite(Number(cue.count)) && Number(cue.count) > 1 ? Math.min(COUNTER_MAX, Math.floor(Number(cue.count))) : 10;
      const up = (PLACE_VALUE[from] || 0) < (PLACE_VALUE[to] || 0);
      const fromQty = up ? count : 1;
      const toQty = up ? 1 : count;
      const label = cue.label != null
        ? String(cue.label)
        : `${fromQty} ${plural(COLUMN_WORD[from] || from, fromQty)} = ${toQty} ${plural(COLUMN_WORD[to] || to, toQty)}`;
      return { from, to, fromQty, toQty, label };
    });
}

function normalise(spec = {}) {
  const given = Array.isArray(spec.columns) ? spec.columns.map(str) : [];
  const columns = given.map(canonicalColumn);
  // The sheet's counter chart names its columns in lower case ("thousands"),
  // and a heading is printed the way a child reads it: "Thousands".
  const written = given.map((w, i) => (columns[i] !== w && /^[a-z]/.test(w) ? w[0].toUpperCase() + w.slice(1) : w));
  if (columns.length === 0) {
    throw new Error('PLACE_VALUE_CHART_INVALID: a place value chart needs its `columns`, for example ["Th", "H", "T", "O"].');
  }
  const base = {
    columns,
    written,
    title: str(spec.title),
    instances: Math.max(1, Math.min(6, Math.floor(Number(spec.instances) || 1))),
  };

  const p = spec.pair;
  if (isObj(p) && Array.isArray(p.from) && Array.isArray(p.to)) {
    const from = p.from.map(str);
    const to = p.to.map(str);
    const operation = str(p.operation);
    const result = numberFromCells(columns, to);
    // An explicit "" is a deliberate "no title bar".
    const title = p.title != null ? String(p.title) : operation === '' ? result : result === '' ? operation : `${operation}: ${result}`;
    const changed = new Set();
    columns.forEach((c, i) => {
      if (c === '.') return;
      if (to[i] === '') return;
      if (str(from[i]) !== to[i]) changed.add(i);
    });
    const unknown = columns.some((c, i) => c !== '.' && str(to[i]) === '');
    const counters = isObj(p.counters) ? p.counters : {};
    return {
      ...base,
      form: 'pair',
      pair: {
        from,
        to,
        operation,
        title,
        changed,
        unknown,
        fromCounters: populations(counters.from),
        toCounters: populations(counters.to),
        exchanges: normaliseExchanges(p, columns),
      },
    };
  }

  // The sheet's counter chart: `counts` and no rows.
  if (spec.rows == null && isObj(spec.counts)) {
    return {
      ...base,
      form: 'rows',
      headerOnly: false,
      rows: [normaliseRow({ counters: spec.counts, counterLabels: true, digits: false }, columns)],
    };
  }

  const headerOnly = Array.isArray(spec.rows) && spec.rows.length === 0;
  const rawRows = headerOnly ? [] : Array.isArray(spec.rows) && spec.rows.length ? spec.rows : [{ cells: columns.map(() => '') }];
  return { ...base, form: 'rows', headerOnly, rows: rawRows.map((r) => normaliseRow(r, columns)) };
}

// ─── measuring ──────────────────────────────────────────────────────────────

function widthPt(text, pt) {
  return textWidthEm(str(text), true) * pt;
}

function writeInFor(profile) {
  return WRITE_IN[profile.surface] || WRITE_IN.worksheets;
}

// The smallest a word may print on this surface. Paper and the wall never
// shrink a chart, so a word there is never below the surface's own floor; the
// board fits a fixed zone and has always let a chart's parts shrink to shares
// of its projection floor (a digit to 0.65 of it, a heading to half).
function floorPt(profile, boardShare) {
  return profile.heightPt ? profile.minFontPt * boardShare : profile.minFontPt;
}

function paletteFor(profile) {
  return profile.palette === 'ink' ? INK : COLOURS;
}

function columnFills(profile, column) {
  const c = paletteFor(profile);
  if (profile.palette === 'ink') return [c.headerFill, c.cellFill];
  return COLUMN_COLOURS[column] || [c.headerFill, c.cellFill];
}

// Which spelling of the column names this chart can print, and at what size.
// The full word is preferred wherever a column is wide enough to hold it, and
// the short name (the form the schema leads with and a teacher writes on a
// whiteboard) is the fallback rather than a smaller full word. All the headings
// change together or none does: "Th | Hundreds | T | O" is a chart that cannot
// decide what it is.
function headingsFor(chart, colW, startPt, floor, inset) {
  const fit = (labels) => {
    const widest = labels.reduce((m, l, i) => (chart.columns[i] === '.' ? m : Math.max(m, textWidthEm(l, true))), 0);
    if (widest <= 0) return { font: startPt, fits: true };
    const byWidth = Math.max(0.1, colW - inset) / widest;
    const font = Math.max(floor, Math.min(startPt, byWidth));
    return { font, fits: widest * font <= colW - inset + 0.01 };
  };
  const written = fit(chart.written);
  if (written.fits) return { labels: chart.written, font: written.font };
  const short = fit(chart.columns);
  return { labels: chart.columns, font: short.font };
}

// A label fits its own column, shrinking to the floor and then wrapping onto
// further lines, so the longest label never decides how big the digits are.
function fitLabel(text, colW, startPt, floor, inset) {
  const avail = Math.max(1, colW - inset);
  const one = textWidthEm(text, true);
  if (one <= 0) return { font: startPt, lines: [] };
  const font = Math.max(floor, Math.min(startPt, avail / one));
  if (one * font <= avail + 0.01) return { font, lines: [text] };
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (line && widthPt(next, font) > avail) { lines.push(line); line = word; } else line = next;
  });
  if (line) lines.push(line);
  return { font, lines };
}

// Counters in a strict grid inside their own cell, so one can never drift over a
// place-value rule into the column next door. Ten goes two rows of five, which
// makes the whole exchange group countable at a glance; every surface uses the
// same arrangement because a child glancing from one to the other must count the
// same shapes in the same places.
function counterGridCols(count) {
  if (count === 10) return 5;
  if (count <= 4) return 2;
  if (count <= 9) return 3;
  return 5;
}

function counterLayout(w, h, count, column, labelled, D) {
  const pad = Math.min(0.08 * 72, w * 0.08, h * 0.08);
  const innerW = Math.max(1, w - 2 * pad);
  const innerH = Math.max(1, h - 2 * pad);
  const face = labelled ? counterValue(column) : '';
  const tryCols = (cols) => {
    const rows = Math.ceil(count / cols);
    const stepW = innerW / cols;
    const stepH = innerH / rows;
    const maxD = (labelled ? LABELLED_COUNTER_MAX_D : COUNTER_MAX_D) * D;
    const raw = Math.min(stepW, stepH) * (labelled ? LABELLED_FILL_SHARE : COUNTER_FILL_SHARE);
    const d = Math.min(raw, maxD);
    const fontPt = labelled ? Math.min(d * 0.6, (d * COUNTER_FACE_WIDTH) / textWidthEm(face, true)) : 0;
    return { cols, rows, stepW, stepH, d, raw, fontPt, face };
  };
  let best = tryCols(counterGridCols(count));
  // A labelled counter keeps the house arrangement when its value fits, and
  // otherwise takes whichever grid leaves the most room for the value.
  if (labelled && best.fontPt < COUNTER_FACE_MIN_PT) {
    for (let cols = 1; cols <= count; cols += 1) {
      const t = tryCols(cols);
      if (t.fontPt > best.fontPt) best = t;
    }
  }
  best.x0 = (w - best.stepW * best.cols) / 2;
  best.y0 = (h - best.stepH * best.rows) / 2;
  return best;
}

// How tall a counter band has to be for its values to print at a readable size:
// a counter with "0.01" on it cannot be shrunk to fit a band, so the band grows
// to hold the rows it needs. An empty counter chart is where the child draws
// counters, and keeps room for the nine a column can ever need.
function bandHeight(rows, columns, D) {
  let h = COUNTER_H * D;
  rows.forEach((row) => {
    if (!row.counters || !row.counterLabels) return;
    const counts = columns.map((c) => countIn(row.counters, c));
    const most = Math.max(0, ...counts);
    const needRows = most === 0 ? 3 : Math.ceil(most / counterGridCols(most));
    h = Math.max(h, (needRows * LABELLED_COUNTER_MAX_D * D) / LABELLED_FILL_SHARE + 2 * 0.08 * 72 * 0.5);
  });
  return h;
}

// ─── layout: stacked rows ───────────────────────────────────────────────────

function unitsOf(chart) {
  const dots = chart.columns.filter((c) => c === '.').length;
  const grid = chart.columns.length - dots + dots * POINT_W;
  const hasLabels = chart.form === 'rows' && chart.rows.some((r) => r.label !== '');
  const label = hasLabels ? Math.min(LABEL_COLS, (LABEL_MAX_SHARE / (1 - LABEL_MAX_SHARE)) * grid) : 0;
  return { grid, label, total: grid + label, hasLabels };
}

function isWriteRow(row, columns) {
  if (!row.digits || row.counters) return false;
  return columns.some((c, i) => c !== '.' && str(row.cells[i]) === '');
}

function stackedLayout(chart, profile) {
  const N = profile.fontPt * DIGIT_OF_FONT;
  const hi = N * MAX_SCALE;
  const lo = profile.heightPt ? Math.max(N * BOARD_MIN_SCALE, 0) : Math.max(profile.minFontPt, 0);
  const inset = CELL_INSET_OF_N * N;
  const units = unitsOf(chart);
  const n = chart.instances;
  const gap = INSTANCE_GAP * hi;
  const perChart = (profile.widthPt - (n - 1) * gap) / n;
  const writeIn = writeInFor(profile);
  const rows = chart.rows;
  const hasCounters = rows.some((r) => r.counters);

  // A board chart fills its zone's width, as its table always did; paper and the
  // wall stop widening a column past the point where it is only emptier.
  let colW = perChart / units.total;
  // A column carrying counters with their values on them is as wide as three of
  // those counters, which is what the sheet's counter chart always was.
  const labelledCounters = rows.some((r) => r.counters && r.counterLabels);
  const colCap = labelledCounters ? Math.max(COL_MAX, (3 * LABELLED_COUNTER_MAX_D) / LABELLED_FILL_SHARE + 0.6) : COL_MAX;
  if (!profile.heightPt) colW = Math.min(colW, colCap * hi);

  const widestDigit = rows.reduce((m, r) => r.cells.reduce((k, c) => Math.max(k, textWidthEm(c, true)), m), 0);
  const byWidth = widestDigit > 0 ? Math.max(1, colW - inset) / widestDigit : Infinity;

  const heightIn = (D) => {
    const title = chart.title ? D * TITLE_FONT * 1.3 + TITLE_GAP * D : 0;
    let h = title + HEADER_H * D;
    const band = hasCounters ? bandHeight(rows, chart.columns, D) : 0;
    rows.forEach((row) => {
      h += band;
      if (row.digits) h += Math.max(ROW_H * D, isWriteRow(row, chart.columns) ? writeIn.rowPt : 0);
    });
    return h;
  };

  let D = Math.min(hi, byWidth);
  if (profile.heightPt) {
    // Height is priced at D, and the write rows on paper are a fixed size, so
    // walk down until it fits rather than dividing once.
    for (let k = 0; k < 40 && heightIn(D) > profile.heightPt && D > lo; k += 1) {
      D = Math.max(lo, D * Math.min(0.98, profile.heightPt / heightIn(D)));
    }
  }
  if (D < lo) D = lo;

  if (profile.heightPt && !chart.headerOnly && heightIn(D) > profile.heightPt + 0.5) {
    throw new Error(
      `PLACE_VALUE_CHART_DOES_NOT_FIT: this chart needs at least ${(heightIn(lo) / 72).toFixed(2)}in of height at its smallest readable size ` +
        `(${rows.length} row(s)${hasCounters ? ' with counters' : ''}), but its zone offers ${(profile.heightPt / 72).toFixed(2)}in. ` +
        'Give it a taller zone, fewer rows, or drop the counters.'
    );
  }
  if (!profile.heightPt && colW < Math.min(lo, 0.6 * hi) * 1.2) {
    throw new Error(
      `PLACE_VALUE_CHART_TOO_NARROW: at ${(profile.widthPt / 72 * 25.4).toFixed(0)}mm each column of this chart is ${(colW / 72 * 25.4).toFixed(1)}mm, ` +
        'too narrow to print a digit readably. Give the chart more width, or fewer charts side by side.'
    );
  }
  return { N, D, hi, lo, inset, units, colW, gap, perChart, writeIn, hasCounters, band: hasCounters ? bandHeight(rows, chart.columns, D) : 0 };
}

function describeStacked(chart, profile) {
  const L = stackedLayout(chart, profile);
  const { D, N, colW, units, inset } = L;
  const pal = paletteFor(profile);
  const cols = chart.columns;
  const headFloor = floorPt(profile, 0.5);
  const labelFloor = floorPt(profile, 10 / 18);
  const heading = headingsFor(chart, colW, HEAD_FONT * D, headFloor, inset);
  const labelW = units.label * colW;
  const colWs = cols.map((c) => (c === '.' ? colW * POINT_W : colW));
  const gridW = colWs.reduce((a, b) => a + b, 0);
  const chartW = labelW + gridW;

  // Refuse a column too narrow for its counters to be counted. Width is the
  // lever here: the counter band already has the height it needs.
  const pieces = [];
  let smallest = null;
  let facesTooSmall = null;
  const counterLayouts = chart.rows.map((row) =>
    cols.map((c, i) => {
      if (!row.counters || c === '.') return null;
      const count = countIn(row.counters, c);
      if (count <= 0) return null;
      const lay = counterLayout(colWs[i], L.band, count, c, row.counterLabels, D);
      if (!row.counterLabels && (smallest === null || lay.raw < smallest)) smallest = lay.raw;
      if (row.counterLabels && lay.fontPt < COUNTER_FACE_MIN_PT) facesTooSmall = lay;
      return lay;
    })
  );
  if (smallest !== null && smallest < COUNTER_READABLE_PT) {
    throw new Error(
      `PLACE_VALUE_COUNTERS_TOO_SMALL: this chart's counters come out ${(smallest / 72).toFixed(2)}in across, below the ` +
        `${(COUNTER_READABLE_PT / 72).toFixed(3)}in a child can count from the carpet, because each column is only ${(colW / 72).toFixed(2)}in wide. ` +
        'The counter band already has the height it needs, so a taller zone will not move it: give the chart more WIDTH - a wider zone, ' +
        'one chart on this slide instead of two, or a template that does not spend 40% of the board on a side panel. ' +
        "Fewer counters in a column works too, where the lesson's numbers allow it."
    );
  }
  if (facesTooSmall) {
    throw new Error(
      `PLACE_VALUE_COUNTER_LABELS_DO_NOT_FIT: a counter's value ("${facesTooSmall.face}") would print at ${facesTooSmall.fontPt.toFixed(1)}pt, below the ` +
        `${COUNTER_FACE_MIN_PT}pt a child reads. Enlarge the chart, or use fewer simultaneous examples.`
    );
  }
  // Refuse a column too narrow to write in. If nobody writes in the chart, the
  // honest repair is to say so: print the digits, or ask for the heading strip.
  const writeRows = chart.rows.some((r) => isWriteRow(r, cols));
  if (writeRows && L.writeIn.colPt && colW < L.writeIn.colPt - 0.01) {
    throw new Error(
      `PLACE_VALUE_WRITE_IN_TOO_NARROW: this chart has a row left blank for somebody to write in, but each column is only ` +
        `${(colW / 72).toFixed(3)}in wide, below the ${(L.writeIn.colPt / 72).toFixed(2)}in one handwritten digit needs at the size this chart prints its own digits. ` +
        'Height is not the lever, so a taller zone will not move it: give the chart more WIDTH - a wider zone, one chart on this slide instead of two, ' +
        'or a template that does not spend 40% of the board on a side panel. If nobody writes in this chart, say so instead: print the digits in ' +
        'the blank cells, or ask for the headings alone with "rows": [] for a reference strip.'
    );
  }

  const rule = Math.max(1, GRID_W * D);
  const ringW = Math.max(3, RING_W * D);
  const ringInset = Math.max(ringW / 2 + 1, RING_INSET * D);
  const cells = [];
  const texts = [];
  const circles = [];
  const rings = [];
  const labels = [];
  const labelFonts = [];

  const drawOne = (ox) => {
    let y = 0;
    if (chart.title) {
      const tf = Math.max(floorPt(profile, 0.5), TITLE_FONT * D);
      texts.push({ role: 'title', text: chart.title, x: ox + chartW / 2, y, h: tf * 1.3, pt: tf, fill: pal.title });
      y += tf * 1.3 + TITLE_GAP * D;
    }
    const headerH = HEADER_H * D;
    // The cell above the labels stays blank: the labels name rows, not a column.
    if (labelW > 0) cells.push({ role: 'label-head', x: ox, y, w: labelW, h: headerH, fill: pal.labelFill });
    let x = ox + labelW;
    cols.forEach((c, i) => {
      cells.push({ role: 'header', column: c, x, y, w: colWs[i], h: headerH, fill: columnFills(profile, c)[0] });
      if (c !== '.') texts.push({ role: 'heading', text: heading.labels[i], x: x + colWs[i] / 2, y, h: headerH, pt: heading.font, fill: pal.text });
      x += colWs[i];
    });
    y += headerH;

    chart.rows.forEach((row, r) => {
      const digitH = row.digits ? Math.max(ROW_H * D, isWriteRow(row, cols) ? L.writeIn.rowPt : 0) : 0;
      const rowH = L.band + digitH;
      if (labelW > 0) {
        cells.push({ role: 'label', x: ox, y, w: labelW, h: rowH, fill: pal.labelFill });
        if (row.label) {
          // Twice the cell margin: a caption touching its rule reads as cramped from across a room.
          const fitted = fitLabel(row.label, labelW, LABEL_FONT * D, labelFloor, 2 * inset);
          labelFonts.push(fitted.font);
          const lineH = fitted.font * 1.25;
          const top = y + (rowH - lineH * fitted.lines.length) / 2;
          fitted.lines.forEach((line, k) =>
            texts.push({ role: 'label', text: line, x: ox + labelW / 2, y: top + k * lineH, h: lineH, pt: fitted.font, fill: pal.text })
          );
          labels.push({ text: row.label, x: ox, y, w: labelW, h: rowH, pt: fitted.font, lines: fitted.lines.length });
        }
      }
      let cx = ox + labelW;
      if (L.hasCounters) {
        cols.forEach((c, i) => {
          cells.push({ role: 'band', column: c, x: cx, y, w: colWs[i], h: L.band, fill: columnFills(profile, c)[1] });
          const lay = counterLayouts[r][i];
          if (lay) {
            const fill = profile.palette === 'ink' ? pal.cellFill : columnFills(profile, c)[0];
            const count = countIn(row.counters, c);
            for (let k = 0; k < count; k += 1) {
              const px = cx + lay.x0 + (k % lay.cols) * lay.stepW + lay.stepW / 2;
              const py = y + lay.y0 + Math.floor(k / lay.cols) * lay.stepH + lay.stepH / 2;
              circles.push({ role: 'counter', column: c, cx: px, cy: py, r: lay.d / 2, fill, stroke: pal.counterLine, sw: Math.max(0.75, 0.04 * D), face: row.counterLabels ? lay.face : '', pt: lay.fontPt });
            }
          }
          cx += colWs[i];
        });
      }
      if (row.digits) {
        const dy = y + L.band;
        const hasDigits = cols.some((c, i) => c !== '.' && str(row.cells[i]) !== '');
        cx = ox + labelW;
        cols.forEach((c, i) => {
          const isDot = c === '.';
          const picked = !isDot && row.picked.has(i);
          const text = isDot ? (hasDigits ? '.' : '') : str(row.cells[i]);
          cells.push({ role: text === '' ? 'write' : 'digit', column: c, x: cx, y: dy, w: colWs[i], h: digitH, fill: columnFills(profile, c)[1] });
          // Green says "this number is the result of working something out".
          // A RINGED cell says something narrower - "this is the digit that
          // changed" - and rings one cell in one picture, so it could never
          // say "all twelve of these are the answer". An answer slide showing a
          // completed chart printed its digits in plain black beside the
          // original number, which is the one thing on the slide that is NOT an
          // answer (the teacher, 19 September 2026: "I wish the answers on slide
          // 5 and 7, in the table were green"). `answer: true` on a row colours
          // its digits and adds no ring, so a reveal reads as a reveal and the
          // ring keeps its own meaning. Correctness is not the test: in the same
          // edit he greened a worked chain that was wrong, because green marks
          // what the number IS, not whether it is right.
          const revealed = !isDot && row.answer && text !== '';
          if (text !== '') texts.push({ role: 'digit', text, x: cx + colWs[i] / 2, y: dy, h: digitH, pt: D, fill: (picked || revealed) ? pal.ring : pal.text, picked });
          if (picked) rings.push({ x: cx + ringInset, y: dy + ringInset, w: colWs[i] - 2 * ringInset, h: digitH - 2 * ringInset, sw: ringW, column: c });
          cx += colWs[i];
        });
      }
      y += rowH;
    });
    return y;
  };

  let h = 0;
  for (let k = 0; k < chart.instances; k += 1) h = drawOne(k * (chartW + L.gap));
  const w = chart.instances * chartW + (chart.instances - 1) * L.gap;
  return {
    form: 'rows', D, N, colW, colWs, labelW, chartW, w, h, rule, pal,
    headings: heading, labelFonts, labels, cells, texts, circles, rings, lines: [], polys: [], bars: [],
    anchor: chart.headerOnly ? 'top' : 'middle',
  };
}

// ─── layout: the pair ───────────────────────────────────────────────────────

function describePair(chart, profile) {
  const pair = chart.pair;
  const cols = chart.columns;
  const pal = paletteFor(profile);
  const N = profile.fontPt * DIGIT_OF_FONT;
  const hasCounters = Boolean(pair.fromCounters || pair.toCounters);
  const hi = N * PAIR_MAX_SCALE;
  const lo = profile.heightPt ? N * (hasCounters ? PAIR_COUNTER_MIN_SCALE : PAIR_BOARD_MIN_SCALE) : profile.minFontPt;
  const inset = CELL_INSET_OF_N * N;
  const smallFloor = floorPt(profile, 0.5);
  const units = unitsOf({ ...chart, form: 'pair' }).grid;
  const hasTitle = pair.title !== '';
  const exchanges = pair.exchanges;
  const anySame = !pair.unknown && cols.some((c, i) => c !== '.' && !pair.changed.has(i));

  const titleFontAt = (D) => Math.max(smallFloor, Math.max(TITLE_FONT * D, Math.min(profile.fontPt, 1.2 * D)));
  const opFontAt = (D) => Math.max(smallFloor, PAIR_OP_FONT * D);
  const gapAt = (D) => Math.max(PAIR_GAP * D, pair.operation ? widthPt(pair.operation, opFontAt(D)) + 2 * PAIR_ARROW_INSET * D + 4 : 0);
  // Counters need wider columns than digits do: a column one digit wide gave a
  // Year 4 exchange slide counters a tenth of an inch across.
  const colFactor = hasCounters ? PAIR_COUNTER_COL_W : COL_W;
  const widthAt = (D) => 2 * units * colFactor * D + gapAt(D);
  const heightAt = (D) => {
    let h = 0;
    if (hasTitle) h += Math.max(PAIR_TITLE_H * D, titleFontAt(D) * 1.45) + PAIR_TITLE_GAP * D;
    if (exchanges.length) h += EXCHANGE_H * D + EXCHANGE_GAP * D;
    h += HEADER_H * D + (hasCounters ? COUNTER_H * D : 0) + ROW_H * D;
    if (anySame) h += SAME_H * D;
    return h;
  };

  let D = hi;
  for (let k = 0; k < 60; k += 1) {
    const over = Math.max(widthAt(D) / profile.widthPt, profile.heightPt ? heightAt(D) / profile.heightPt : 0);
    if (over <= 1.0005 || D <= lo) break;
    D = Math.max(lo, D / Math.max(1.002, over));
  }
  if (widthAt(D) > profile.widthPt + 0.5 || (profile.heightPt && heightAt(D) > profile.heightPt + 0.5)) {
    throw new Error(
      `PLACE_VALUE_CHART_DOES_NOT_FIT: this before-and-after pair needs at least ${(widthAt(lo) / 72).toFixed(2)}in x ${(heightAt(lo) / 72).toFixed(2)}in ` +
        `to print its digits readably${hasCounters ? ' with counters' : ''}${exchanges.length ? ' and an exchange cue' : ''}, and was given ` +
        `${(profile.widthPt / 72).toFixed(2)}in${profile.heightPt ? ` x ${(profile.heightPt / 72).toFixed(2)}in` : ''}. ` +
        'Give it a full-width zone, or show the two charts on their own slide.'
    );
  }

  const gap = gapAt(D);
  // On the board a counter pair takes the width its zone has spare, up to the
  // widest a counter column is useful, so its counters are as big as they can be.
  const colW = hasCounters && profile.heightPt
    ? Math.max(colFactor * D, Math.min(PAIR_COUNTER_COL_MAX * D, (profile.widthPt - gap) / (2 * units)))
    : colFactor * D;
  const colWs = cols.map((c) => (c === '.' ? colW * POINT_W : colW));
  const chartW = colWs.reduce((a, b) => a + b, 0);
  const totalW = 2 * chartW + gap;
  const headFloor = floorPt(profile, 0.5);
  const heading = headingsFor(chart, colW, HEAD_FONT * D, headFloor, inset);
  const rule = Math.max(1, GRID_W * D);
  const ringW = Math.max(3, RING_W * D);
  const ringInset = Math.max(ringW / 2 + 1, RING_INSET * D);
  const cells = [];
  const texts = [];
  const circles = [];
  const rings = [];
  const lines = [];
  const polys = [];
  const bars = [];

  let y = 0;
  if (hasTitle) {
    const th = Math.max(PAIR_TITLE_H * D, titleFontAt(D) * 1.45);
    const pad = 0.4 * D;
    const tf = Math.max(smallFloor, Math.min(titleFontAt(D), (totalW - 2 * pad) / Math.max(0.1, textWidthEm(pair.title, true))));
    bars.push({ role: 'title-bar', x: 0, y, w: totalW, h: th, r: PAIR_TITLE_R * D, fill: pal.title });
    texts.push({ role: 'title', text: pair.title, x: totalW / 2, y, h: th, pt: tf, fill: pal.titleInk });
    y += th + PAIR_TITLE_GAP * D;
  }

  if (exchanges.length) {
    const eh = EXCHANGE_H * D;
    const cueGap = Math.min(EXCHANGE_GAP * D, totalW * 0.02);
    const cueW = (totalW - cueGap * (exchanges.length - 1)) / exchanges.length;
    exchanges.forEach((cue, i) => {
      const cx = i * (cueW + cueGap);
      bars.push({ role: 'exchange-box', x: cx, y, w: cueW, h: eh, r: 0.12 * D, fill: pal.cellFill, stroke: pal.grid, sw: rule });
      const labelPt = Math.max(smallFloor, Math.min(EXCHANGE_FONT * D, (cueW - 0.4 * D) / Math.max(0.1, textWidthEm(cue.label, true))));
      const labelH = labelPt * 1.3;
      const picH = Math.max(0.3 * D, eh - labelH - 0.2 * D);
      const groupW = cueW * 0.34;
      const leftX = cx + cueW * 0.04;
      const rightX = cx + cueW - cueW * 0.04 - groupW;
      [[cue.from, cue.fromQty, leftX], [cue.to, cue.toQty, rightX]].forEach(([column, qty, gx]) => {
        const lay = counterLayout(groupW, picH, qty, column, false, D);
        const fill = profile.palette === 'ink' ? pal.cellFill : columnFills(profile, column)[0];
        for (let k = 0; k < qty; k += 1) {
          circles.push({
            role: 'exchange-counter', column,
            cx: gx + lay.x0 + (k % lay.cols) * lay.stepW + lay.stepW / 2,
            cy: y + 0.1 * D + lay.y0 + Math.floor(k / lay.cols) * lay.stepH + lay.stepH / 2,
            r: Math.max(1.5, Math.min(lay.raw * 1.2, COUNTER_MAX_D * D) / 2), fill, stroke: pal.counterLine, sw: Math.max(0.75, 0.04 * D), face: '', pt: 0,
          });
        }
      });
      const ay = y + 0.1 * D + picH / 2;
      arrowParts(lines, polys, leftX + groupW + 0.1 * D, rightX - 0.1 * D, ay, Math.max(1.5, 0.14 * D), 0.35 * D, pal.title);
      texts.push({ role: 'exchange-label', text: cue.label, x: cx + cueW / 2, y: y + eh - labelH - 0.05 * D, h: labelH, pt: labelPt, fill: pal.text });
    });
    y += eh + EXCHANGE_GAP * D;
  }

  const chartY = y;
  const drawChart = (ox, cells_, pops, picked) => {
    const headerH = HEADER_H * D;
    let x = ox;
    cols.forEach((c, i) => {
      cells.push({ role: 'header', column: c, x, y: chartY, w: colWs[i], h: headerH, fill: columnFills(profile, c)[0] });
      if (c !== '.') texts.push({ role: 'heading', text: heading.labels[i], x: x + colWs[i] / 2, y: chartY, h: headerH, pt: heading.font, fill: pal.text });
      x += colWs[i];
    });
    let yy = chartY + headerH;
    if (hasCounters) {
      const band = COUNTER_H * D;
      x = ox;
      cols.forEach((c, i) => {
        cells.push({ role: 'band', column: c, x, y: yy, w: colWs[i], h: band, fill: columnFills(profile, c)[1] });
        const count = countIn(pops, c);
        if (count > 0 && c !== '.') {
          const lay = counterLayout(colWs[i], band, count, c, false, D);
          if (lay.raw < COUNTER_READABLE_PT) {
            throw new Error(
              `PLACE_VALUE_COUNTERS_TOO_SMALL: this pair's counters come out ${(lay.raw / 72).toFixed(2)}in across, below the ` +
                `${(COUNTER_READABLE_PT / 72).toFixed(3)}in a child can count from the carpet. Give the pair more WIDTH, or its own slide.`
            );
          }
          const fill = profile.palette === 'ink' ? pal.cellFill : columnFills(profile, c)[0];
          for (let k = 0; k < count; k += 1) {
            circles.push({
              role: 'counter', column: c,
              cx: x + lay.x0 + (k % lay.cols) * lay.stepW + lay.stepW / 2,
              cy: yy + lay.y0 + Math.floor(k / lay.cols) * lay.stepH + lay.stepH / 2,
              r: lay.d / 2, fill, stroke: pal.counterLine, sw: Math.max(0.75, 0.04 * D), face: '', pt: 0,
            });
          }
        }
        x += colWs[i];
      });
      yy += band;
    }
    const rowH = ROW_H * D;
    x = ox;
    cols.forEach((c, i) => {
      const isDot = c === '.';
      const on = !isDot && picked.has(i);
      const text = isDot ? '.' : str(cells_[i]);
      cells.push({ role: text === '' ? 'write' : 'digit', column: c, x, y: yy, w: colWs[i], h: rowH, fill: columnFills(profile, c)[1] });
      if (text !== '') texts.push({ role: 'digit', text, x: x + colWs[i] / 2, y: yy, h: rowH, pt: D, fill: on ? pal.ring : pal.text, picked: on });
      if (on) rings.push({ x: x + ringInset, y: yy + ringInset, w: colWs[i] - 2 * ringInset, h: rowH - 2 * ringInset, sw: ringW, column: c });
      x += colWs[i];
    });
    return yy + rowH;
  };

  // The start chart carries no rings: nothing has happened to it yet.
  const bottom = drawChart(0, pair.from, pair.fromCounters, new Set());
  const rightX = chartW + gap;
  drawChart(rightX, pair.to, pair.toCounters, pair.changed);

  // The arrow across the gap at the charts' middle, with the operation above it:
  // the only mark in the picture that says something HAPPENED.
  const ay = (chartY + bottom) / 2;
  arrowParts(lines, polys, chartW + PAIR_ARROW_INSET * D, rightX - PAIR_ARROW_INSET * D, ay, Math.max(3, PAIR_ARROW_W * D), PAIR_ARROW_HEAD * D, pal.title);
  if (pair.operation) {
    const opPt = Math.max(smallFloor, Math.min(opFontAt(D), (gap - 2 * PAIR_ARROW_INSET * D) / Math.max(0.1, textWidthEm(pair.operation, true))));
    texts.push({ role: 'operation', text: pair.operation, x: chartW + gap / 2, y: ay - Math.max(3, PAIR_ARROW_W * D) / 2 - 0.2 * D - opPt * 1.2, h: opPt * 1.2, pt: opPt, fill: pal.title });
  }

  let h = bottom;
  if (anySame) {
    const sh = SAME_H * D;
    let sx = rightX;
    cols.forEach((c, i) => {
      if (c !== '.' && !pair.changed.has(i)) {
        const pt = Math.max(smallFloor, Math.min(SAME_FONT * D, (colWs[i] * 0.9) / textWidthEm(SAME_TEXT, true)));
        texts.push({ role: 'same', text: SAME_TEXT, x: sx + colWs[i] / 2, y: bottom + 0.1 * D, h: pt * 1.3, pt, fill: profile.palette === 'ink' ? pal.text : SAME_COLOURS[c] || pal.grid, column: c });
      }
      sx += colWs[i];
    });
    h += sh;
  }

  return {
    form: 'pair', D, N, colW, colWs, chartW, w: totalW, h, rule, pal, headings: heading,
    cells, texts, circles, rings, lines, polys, bars, labels: [], labelFonts: [], anchor: 'middle',
  };
}

function arrowParts(lines, polys, x1, x2, y, shaft, head, colour) {
  const headLen = Math.min(head, Math.max(2, (x2 - x1) * 0.45));
  lines.push({ x1, y1: y, x2: x2 - headLen, y2: y, sw: shaft, stroke: colour });
  polys.push({ points: [[x2, y], [x2 - headLen, y - headLen * 0.4], [x2 - headLen, y + headLen * 0.4]], fill: colour });
}

// ─── drawing ────────────────────────────────────────────────────────────────

function resolveProfile(profileOrSurface, box) {
  return typeof profileOrSurface === 'string' ? profileFor(profileOrSurface, box || { widthPt: 500 }) : profileOrSurface;
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  // Laid out inside the box less the stroke that bleeds past the drawing's edge.
  const profile = insetProfile(resolveProfile(profileOrSurface, box), 1.5);
  const chart = normalise(spec);
  return chart.form === 'pair' ? describePair(chart, profile) : describeStacked(chart, profile);
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = resolveProfile(profileOrSurface, box);
  const L = describeLayout(spec, profile);
  const font = profile.font;
  // Rings sit inside their cells, so only the outer rule bleeds past the edge.
  const bleed = 1.5;
  const parts = [];
  const text = (t) => {
    const baseline = t.y + t.h / 2 + t.pt * 0.35;
    return `<text x="${f2(t.x)}" y="${f2(baseline)}" text-anchor="middle" font-family="${font}" font-size="${f2(t.pt)}" font-weight="bold" fill="${t.fill}">${esc(t.text)}</text>`;
  };
  L.bars.forEach((b) => parts.push(`<rect x="${f2(b.x)}" y="${f2(b.y)}" width="${f2(b.w)}" height="${f2(b.h)}" rx="${f2(b.r)}" ry="${f2(b.r)}" fill="${b.fill}"${b.stroke ? ` stroke="${b.stroke}" stroke-width="${f2(b.sw)}"` : ''}/>`));
  L.cells.forEach((c) => parts.push(`<rect x="${f2(c.x)}" y="${f2(c.y)}" width="${f2(c.w)}" height="${f2(c.h)}" fill="${c.fill}" stroke="${L.pal.grid}" stroke-width="${f2(L.rule)}"/>`));
  L.circles.forEach((c) => {
    parts.push(`<circle cx="${f2(c.cx)}" cy="${f2(c.cy)}" r="${f2(c.r)}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${f2(c.sw)}"/>`);
    if (c.face) parts.push(`<text x="${f2(c.cx)}" y="${f2(c.cy + c.pt * 0.35)}" text-anchor="middle" font-family="${font}" font-size="${f2(c.pt)}" font-weight="bold" fill="${L.pal.text}">${esc(c.face)}</text>`);
  });
  L.lines.forEach((l) => parts.push(`<line x1="${f2(l.x1)}" y1="${f2(l.y1)}" x2="${f2(l.x2)}" y2="${f2(l.y2)}" stroke="${l.stroke}" stroke-width="${f2(l.sw)}"/>`));
  L.polys.forEach((p) => parts.push(`<polygon points="${p.points.map((q) => `${f2(q[0])},${f2(q[1])}`).join(' ')}" fill="${p.fill}"/>`));
  L.texts.forEach((t) => parts.push(text(t)));
  // Rings last, so a neighbouring cell drawn afterwards never paints over half.
  L.rings.forEach((r) => parts.push(`<rect x="${f2(r.x)}" y="${f2(r.y)}" width="${f2(r.w)}" height="${f2(r.h)}" fill="none" stroke="${L.pal.ring}" stroke-width="${f2(r.sw)}"/>`));
  const w = L.w + 2 * bleed;
  const h = L.h + 2 * bleed;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${f2(w)}" height="${f2(h)}" viewBox="${f2(-bleed)} ${f2(-bleed)} ${f2(w)} ${f2(h)}">${parts.join('')}</svg>`;
  return { svg, w, h, aspect: w / h, layout: L, anchor: L.anchor };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = resolveProfile(profileOrSurface, box);
  const chart = normalise(spec);
  // Every field that changes the picture is in the key: two pairs of one chart
  // differ only in their `to` cells, and two counter charts only in their
  // populations, and a key blind to either hands the second picture the first.
  const plain = JSON.stringify(chart, (k, v) => (v instanceof Set ? [...v] : v));
  return `pvchart:${p.surface}:${f2(p.widthPt)}x${p.heightPt ? f2(p.heightPt) : '-'}:${plain}`;
}

// The narrowest box the chart can be drawn in on a surface that does not shrink
// it: every digit column at the write-in floor when anyone writes in it, and at
// a readable digit's width otherwise.
function minWidthPt(spec = {}, profileOrSurface = 'worksheets') {
  const profile = resolveProfile(profileOrSurface, { widthPt: 500 });
  const chart = normalise(spec);
  const N = profile.fontPt * DIGIT_OF_FONT;
  const hi = N * MAX_SCALE;
  if (chart.form === 'pair') {
    const units = unitsOf({ ...chart, form: 'pair' }).grid;
    return 2 * units * COL_W * profile.minFontPt + PAIR_GAP * profile.minFontPt + 20;
  }
  const units = unitsOf(chart);
  const writeIn = writeInFor(profile);
  const writes = chart.rows.some((r) => isWriteRow(r, chart.columns));
  const labelled = chart.rows.some((r) => r.counters && r.counterLabels);
  let col = Math.max(COL_W * profile.minFontPt, writes ? writeIn.colPt : 0);
  // three counters with their values on them, side by side, and the cell padding
  if (labelled) col = Math.max(col, (3 * LABELLED_COUNTER_MAX_D * hi) / LABELLED_FILL_SHARE + 12);
  const n = chart.instances;
  return n * units.total * col + (n - 1) * INSTANCE_GAP * hi + 2 * 1.5 + 1; // and the bleed the layout keeps clear
}

// Generic inline action cue: one mark in each column. It deliberately omits
// place headings so it remains honest for whole-number and decimal charts.
function onePerColumnCueSvg() {
  const w = 240;
  const h = 92;
  const cellW = 76;
  const cols = [COLUMN_COLOURS.H, COLUMN_COLOURS.T, COLUMN_COLOURS.O];
  const parts = [];
  cols.forEach((col, i) => {
    const x = 6 + i * cellW;
    parts.push(`<rect x="${x}" y="6" width="${cellW}" height="80" fill="${col[1]}" stroke="${COLOURS.grid}" stroke-width="5"/>`);
    parts.push(`<circle cx="${x + cellW / 2}" cy="46" r="13" fill="${COLOURS.text}"/>`);
  });
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join('')}</svg>`;
  return { svg, aspect: w / h, w, h };
}

module.exports = {
  tightSvg,
  cacheKey,
  normalise,
  describeLayout,
  minWidthPt,
  onePerColumnCueSvg,
  COLUMN_COLOURS,
  SAME_COLOURS,
  canonicalColumn,
  counterValue,
  labelledCounterGrid,
  counterGridCols,
};
