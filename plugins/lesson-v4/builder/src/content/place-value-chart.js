'use strict';

// A place value chart: column headings across the top, one row per number.
//
// Exact JSON schema (all added fields are optional):
//
//   {
//     columns: ["Th", "H", "T", "O"],
//     rows: [{
//       label: "890",
//       cells: ["0", "8", "9", "0"],
//       highlight: ["T"],
//       counters: { Th: 0, H: 8, T: 9, O: 0 }
//     }],
//     pair: {
//       from: ["0", "8", "9", "0"],
//       to:   ["0", "9", "0", "0"],
//       operation: "+ 10",
//       title: "optional title override",
//       counters: {
//         from: { Th: 0, H: 8, T: 9, O: 0 },
//         to:   { Th: 0, H: 9, T: 0, O: 0 }
//       },
//       exchanges: [
//         { from: "T", to: "H", count: 10,
//           label: "10 tens = 1 hundred" }
//       ]
//     }
//   }
//
// `counters` maps column names to whole-number counter populations. Omitting it
// gives the original compact digit-only chart; this is the intended fade from
// concrete counters to written digits. A zero in `cells` is still written even
// when its counter population is 0, so placeholders never disappear.
//
// `exchanges` is an array because a boundary can cascade (1,990 -> 2,000 needs
// T -> H and H -> Th). Each cue draws the stated equal counters changing into
// the equivalent counter(s) in the neighbouring column. `count` defaults to 10
// and `label` is derived when omitted. The singular alias `exchange` is also
// accepted for a single cue.
//
// A worksheet-style unknown result needs no new mode: give `to` an array of
// empty strings, omit `counters`, and use `title: ""` when no title bar is
// wanted. Blank result cells are not highlighted.
//
// Two fields carry the teaching, and both are optional so a plain chart is
// unchanged:
//
//   label      a short caption at the left of a row, naming what that row IS
//              ("3,462", "10 more", "100 more"). Without it a stack of charts
//              is three grids of digits with nothing saying how they relate.
//   highlight  which cell(s) in that row to pick out. This is the whole point
//              of a 10-more/100-more lesson: WHICH column changed and which
//              stayed the same. A chart that cannot mark one digit cannot show
//              the one thing the lesson is about.
//
// A highlighted cell KEEPS its column colour, because the column coding is the
// other half of the picture and swapping the fill would say "this cell is not
// a tens column any more". It is picked out by a thick green ring and a green
// digit instead - green being the deck's "this is the answer" colour, which is
// exactly what a changed digit is.
//
// A third field draws something the rows above cannot:
//
//   pair       ONE before-and-after comparison, as a pair of charts joined by a
//              labelled arrow. Rows stacked in a single chart show two end
//              states; what they never show is the change itself, so on a
//              modelling slide all the movement ends up in the teacher's voice
//              and finger. The pair draws the movement: start chart, bold arrow
//              carrying the operation, result chart with the changed digit in
//              green, the unchanged columns each saying "same" beneath, and a
//              title bar stating the operation and its result so the picture
//              proves what the title claims.
//
// ONE pair is ONE comparison, always. Two comparisons that share a starting
// number (10 more AND 100 more of 3,462) are two pairs, never a chain of three
// charts: a chain of arrows says the third state grew out of the second, which
// did not happen and which a class will faithfully learn. This helper draws a
// pair; composing pairs on a slide is the slide-designer's job.

const { FONT, COLOURS, FIT } = require('../styles');
const { arrow } = require('./_geom');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD              = 0.08;
const DOT_FRACTION     = 0.40;
const LABEL_FRACTION   = 1.55;  // a row label's column, as a multiple of a digit
                                // column. Fixed rather than measured from the
                                // text, so three charts side by side in a row
                                // line up instead of each sizing its own label
                                // column and stepping out of register.
const LABEL_MAX_SHARE  = 0.30;  // ...but never more than this share of the
                                // chart, or a two-column chart becomes a
                                // caption with two digits stapled to it
const HEADER_H         = 0.38;
const NATURAL_ROW_H    = 0.55;
const DEFAULT_HEADER   = 'D0D0D0';
const DEFAULT_CELL     = 'FFFFFF';
const LABEL_FILL       = 'FFFFFF';
const BORDER_COLOUR    = '666666';
const BORDER_PT        = 1.0;
const HIGHLIGHT_PT     = 3.0;   // the ring round a changed digit. Three times
                                // the ordinary rule, because from the back of
                                // the room a slightly thicker line is no line
const HEADER_FONT_SIZE = 13;
const CELL_FONT_SIZE   = 18;
const LABEL_FONT_SIZE  = 14;
const COUNTER_ROW_H    = 1.20; // inches at scale 1
const COUNTER_PAD      = 0.08; // inches at scale 1
const COUNTER_LINE     = '4A4A4A';
const COUNTER_MAX      = 20;   // guards malformed specs from flooding a slide
const COUNTER_MIN_D    = 0.09; // inches
const COUNTER_MAX_D    = 0.25; // inches

// ── The before-and-after pair ────────────────────────────────
const REF_COL_W        = 0.45;  // one digit column at scale 1, inches - the
                                // reference the pair's charts are scaled from
const PAIR_MIN_SCALE   = 0.70;
const PAIR_MAX_SCALE   = 2.60;  // higher than a stacked chart's ceiling: a pair
                                // carries one row per chart, so there is height
                                // to spend on making the digits big
const TITLE_SHARE      = 0.20;  // the title bar, as a share of the zone height
const TITLE_H_MIN      = 0.42;
const TITLE_H_MAX      = 0.85;
const TITLE_GAP        = 0.10;
const TITLE_FONT       = 24;    // ceiling; scaled down to the bar's height
const TITLE_RADIUS     = 0.07;
const ARROW_GAP_SHARE  = 0.18;  // the space between the two charts, as a share
const ARROW_GAP_MIN    = 0.75;  // of the zone width - the arrow lives in it
const ARROW_GAP_MAX    = 2.10;
const ARROW_INSET      = 0.08;  // keeps the arrow off both charts' edges
const ARROW_W          = 6.0;   // points. Bold on purpose: the arrow IS the
                                // change, so it must not read as a hairline
const ARROW_LABEL_FONT = 18;
const ARROW_LABEL_H    = 0.34;
const CHART_TOP_BIAS   = 0.35;  // where the pair sits in the space below the
                                // title: 0 hard under it, 0.5 dead centre
const SAME_SHARE       = 0.20;  // the "same" band under the result chart, as a
const SAME_H_MIN       = 0.22;  // share of the height below the title
const SAME_H_MAX       = 0.45;
const SAME_FONT        = 14;    // at scale 1; scaled with the chart
const SAME_TEXT        = 'same';
const EXCHANGE_H       = 0.64; // inches per cue band at scale 1
const EXCHANGE_GAP     = 0.08;
const EXCHANGE_LABEL_H = 0.20;
const EXCHANGE_FONT    = 12;
const EXCHANGE_BOX     = 'FFFFFF';

// "same" is printed in its column's own colour, so a child reads it as belonging
// to that column - but the CELL colours are pale tints chosen to sit behind black
// digits, and pale yellow text on the slide's pale background is no text at all.
// So each column family gets a darkened version of its own hue: the same colour
// to the eye, actually readable from the back of the room.
const SAME_COLOURS = {
  'M':   '2E75B6', 'HTh': '2E75B6', 'TTh': '2E75B6', 'Th': '2E75B6', 'th': '2E75B6',
  'H':   '3E8E41', 'h':   '3E8E41',
  'T':   '9C7A00', 't':   '9C7A00',
  'O':   'C0504D',
  '.':   '808080'
};

const COLUMN_COLOURS = {
  'M':   ['8AB8E8', 'C5DCFF'],
  'HTh': ['8AB8E8', 'C5DCFF'],
  'TTh': ['8AB8E8', 'C5DCFF'],
  'Th':  ['8AB8E8', 'C5DCFF'],
  'H':   ['8AC88A', 'C5EBC5'],
  'T':   ['E8D84A', 'FFF5A0'],
  'O':   ['E89090', 'FFD6D6'],
  '.':   ['D0D0D0', 'EBEBEB'],
  't':   ['E8D84A', 'FFF5A0'],
  'h':   ['8AC88A', 'C5EBC5'],
  'th':  ['8AB8E8', 'C5DCFF']
};
// ─── END CONSTANTS ────────────────────────────────────────────

// A row is either the original bare array of cell values, or an object that can
// also carry a label and a highlight. Both forms normalise to the same shape, so
// every spec written before this helper grew a label still draws as it did.
function normaliseRow(row) {
  if (Array.isArray(row)) return { label: '', cells: row, highlight: [], counters: null };
  if (!row || typeof row !== 'object') {
    return { label: '', cells: [], highlight: [], counters: null };
  }
  return {
    label: row.label != null ? String(row.label) : '',
    cells: Array.isArray(row.cells) ? row.cells : [],
    highlight: row.highlight == null
      ? []
      : (Array.isArray(row.highlight) ? row.highlight : [row.highlight]),
    counters: row.counters && typeof row.counters === 'object' && !Array.isArray(row.counters)
      ? row.counters
      : null
  };
}

// A highlight names cells by their COLUMN, the way a designer thinks about the
// chart ("the tens changed"), so `["T"]` is the natural form. A place value
// chart never repeats a column, so a name is unambiguous. A bare index is
// accepted too, for a caller holding positions rather than names.
function highlightedIndices(highlight, columns) {
  const picked = new Set();
  highlight.forEach(function (h) {
    if (typeof h === 'number' && Number.isInteger(h)) {
      if (h >= 0 && h < columns.length) picked.add(h);
      return;
    }
    const name = String(h);
    const at = columns.indexOf(name);
    if (at !== -1) picked.add(at);
  });
  return picked;
}

// Ring every highlighted cell on all four sides.
//
// PowerPoint tables share an edge between two neighbouring cells, and only one
// of the two cells' settings survives on it - so a ring set on the highlighted
// cell alone comes out as an L or a U, which reads as a rendering fault rather
// than as "look at this digit". The fix is to state the ring from BOTH sides of
// every shared edge: the cell itself, and the facing side of each neighbour.
// pptxgenjs takes per-side borders as [top, right, bottom, left].
function ringHighlightedCells(grid) {
  const ring   = { pt: HIGHLIGHT_PT, color: COLOURS.green };
  const plain  = { pt: BORDER_PT, color: BORDER_COLOUR };
  const TOP = 0, RIGHT = 1, BOTTOM = 2, LEFT = 3;

  const sides = grid.map(function (row) {
    return row.map(function () { return [plain, plain, plain, plain]; });
  });

  function set(r, c, side) {
    if (r < 0 || r >= grid.length) return;
    if (c < 0 || c >= grid[r].length) return;
    sides[r][c][side] = ring;
  }

  grid.forEach(function (row, r) {
    row.forEach(function (cell, c) {
      if (!cell.picked) return;
      set(r, c, TOP); set(r, c, RIGHT); set(r, c, BOTTOM); set(r, c, LEFT);
      set(r - 1, c, BOTTOM);   // the cell above shares this cell's top edge
      set(r + 1, c, TOP);
      set(r, c - 1, RIGHT);
      set(r, c + 1, LEFT);
    });
  });

  grid.forEach(function (row, r) {
    row.forEach(function (cell, c) {
      cell.options.border = sides[r][c];
      delete cell.picked;   // ours, not pptxgenjs's
    });
  });
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function plainBorder() {
  return { pt: BORDER_PT, color: BORDER_COLOUR };
}

function counterCount(populations, column) {
  if (!populations || typeof populations !== 'object') return 0;
  const raw = Number(populations[column]);
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return Math.min(COUNTER_MAX, Math.floor(raw));
}

function counterFill(column) {
  const colours = COLUMN_COLOURS[column];
  return colours ? colours[0] : DEFAULT_HEADER;
}

// Draw counters in a strict local grid. Their centres are calculated from this
// cell alone, so a counter can never drift across a place-value rule into the
// neighbouring column. Ten uses two rows of five, which makes the complete
// exchange group immediately countable.
function drawCounterPopulation(pptx, slide, x, y, w, h, column, count) {
  if (count <= 0 || w <= 0 || h <= 0) return;

  let cols;
  if (count === 10) cols = 5;
  else if (count <= 4) cols = 2;
  else if (count <= 9) cols = 3;
  else cols = 5;
  const rows = Math.ceil(count / cols);

  const pad = Math.min(COUNTER_PAD, w * 0.08, h * 0.08);
  const availW = Math.max(0.05, w - 2 * pad);
  const availH = Math.max(0.05, h - 2 * pad);
  const stepW = availW / cols;
  const stepH = availH / rows;
  const d = clamp(Math.min(stepW, stepH) * 0.68, COUNTER_MIN_D, COUNTER_MAX_D);
  const gridW = stepW * cols;
  const gridH = stepH * rows;
  const gx = x + (w - gridW) / 2;
  const gy = y + (h - gridH) / 2;
  const fill = counterFill(column);

  for (let i = 0; i < count; i += 1) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const cx = gx + c * stepW + stepW / 2;
    const cy = gy + r * stepH + stepH / 2;
    slide.addShape(pptx.shapes.OVAL, {
      x: cx - d / 2, y: cy - d / 2, w: d, h: d,
      fill: { color: fill },
      line: { color: COUNTER_LINE, width: 1.0 }
    });
  }
}

function counterCells(columns) {
  return columns.map(function (label) {
    const colColours = COLUMN_COLOURS[label];
    return {
      text: '',
      options: {
        margin: 0,
        fill: { color: colColours ? colColours[1] : DEFAULT_CELL },
        border: plainBorder()
      }
    };
  });
}

function drawCounterBand(pptx, slide, x, y, colWs, h, columns, populations) {
  slide.addTable([counterCells(columns)], {
    x, y, colW: colWs, rowH: [h], autoPage: false
  });
  let cx = x;
  columns.forEach(function (column, i) {
    const w = colWs[i];
    drawCounterPopulation(
      pptx, slide,
      cx + 0.02, y + 0.02, Math.max(0.01, w - 0.04), Math.max(0.01, h - 0.04),
      column, counterCount(populations, column)
    );
    cx += w;
  });
}

const PLACE_VALUE = {
  M: 1000000, HTh: 100000, TTh: 10000, Th: 1000,
  H: 100, T: 10, O: 1, t: 0.1, h: 0.01, th: 0.001
};
const COLUMN_WORD = {
  M: 'million', HTh: 'hundred thousand', TTh: 'ten thousand',
  Th: 'thousand', H: 'hundred', T: 'ten', O: 'one',
  t: 'tenth', h: 'hundredth', th: 'thousandth'
};

function plural(word, qty) {
  return qty === 1 ? word : word + 's';
}

function normaliseExchanges(pair, columns) {
  let raw = pair.exchanges != null ? pair.exchanges : pair.exchange;
  if (raw == null) return [];
  if (!Array.isArray(raw)) raw = [raw];
  return raw.filter(function (cue) {
    return cue && typeof cue === 'object'
      && columns.indexOf(String(cue.from)) !== -1
      && columns.indexOf(String(cue.to)) !== -1;
  }).map(function (cue) {
    const from = String(cue.from);
    const to = String(cue.to);
    const count = Number.isFinite(Number(cue.count)) && Number(cue.count) > 1
      ? Math.min(COUNTER_MAX, Math.floor(Number(cue.count)))
      : 10;
    const up = (PLACE_VALUE[from] || 0) < (PLACE_VALUE[to] || 0);
    const fromQty = up ? count : 1;
    const toQty = up ? 1 : count;
    const fromWord = COLUMN_WORD[from] || from;
    const toWord = COLUMN_WORD[to] || to;
    const label = cue.label != null
      ? String(cue.label)
      : fromQty + ' ' + plural(fromWord, fromQty)
          + ' = ' + toQty + ' ' + plural(toWord, toQty);
    return { from, to, count, fromQty, toQty, label };
  });
}

// The pair's small labels ("same", the operation on the arrow) are placed by hand
// in boxes the layout has already fixed, and they carry NOFIT_ names so the
// autofit pass leaves them alone — which means nothing downstream will rescue a
// label that outgrew its box. So they are capped here against both the box's
// width and its height, and a label big enough to overlap a chart never gets
// written in the first place.
function fitLabelFont(text, boxW, boxH, want) {
  const CHAR_W_EM = 0.62;   // Comic Sans bold character width estimate, ems.
                            // Deliberately on the generous side: "same" is all
                            // wide lowercase letters, and under-estimating it
                            // has four of them meeting edge to edge under a
                            // narrow chart and reading as "samesame".
  const LINE_H    = 1.30;   // line height as a multiple of font size
  const SAFETY    = 0.86;   // leave a visible gap either side of a label rather
                            // than filling its box exactly
  const byWidth   = (boxW * SAFETY * 72) / Math.max(1, String(text).length * CHAR_W_EM);
  const byHeight  = (boxH * 72) / LINE_H;
  return Math.max(9, Math.round(Math.min(want, byWidth, byHeight)));
}

// The number a row of cells spells, as a reader would write it: digits in column
// order, the decimal point where the "." column sits, and thousands separators
// through the whole-number part. This is what lets the title bar say "10 more:
// 3,472" without the designer restating a number the cells already carry - and
// so without the title and the chart ever being able to disagree.
function numberFromCells(columns, cells) {
  let whole = '';
  let frac = '';
  let seenPoint = false;
  columns.forEach(function (c, i) {
    if (c === '.') { seenPoint = true; return; }
    const d = cells[i] == null ? '' : String(cells[i]);
    if (seenPoint) frac += d; else whole += d;
  });
  // A thousands placeholder may be shown deliberately in the chart ("0 | 9 |
  // 0 | 0"), but readers write that number as 900, not 0,900. Keep the visible
  // placeholder in the cells while normalising only the derived title.
  const normalisedWhole = whole.replace(/^0+(?=\d)/, '');
  const grouped = normalisedWhole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return frac === '' ? grouped : grouped + '.' + frac;
}

// Which columns actually changed between the two numbers. Derived rather than
// declared, so the green digit can never mark a column that did not move - the
// picture cannot contradict itself.
function changedIndices(columns, from, to) {
  const changed = new Set();
  columns.forEach(function (c, i) {
    if (c === '.') return;
    const a = from[i] == null ? '' : String(from[i]);
    const b = to[i]   == null ? '' : String(to[i]);
    // An empty result cell is an unknown for a pupil to complete, not a digit
    // that "changed to blank". Leaving it unringed makes the compact pair a
    // clean worksheet/question frame.
    if (b === '') return;
    if (a !== b) changed.add(i);
  });
  return changed;
}

// One chart of a pair: header row plus a single row of digits.
function pairGrid(columns, cells, picked, headerFont, cellFont) {
  const headerRow = columns.map(function (label) {
    const colColors = COLUMN_COLOURS[label];
    return {
      text: label === '.' ? '' : label,
      options: {
        fontFace: FONT, fontSize: headerFont, bold: true, color: COLOURS.body,
        align: 'center', valign: 'middle', margin: 2,
        fill: { color: colColors ? colColors[0] : DEFAULT_HEADER },
        border: { pt: BORDER_PT, color: BORDER_COLOUR }
      }
    };
  });
  const digitRow = columns.map(function (label, i) {
    const isDot     = label === '.';
    const colColors = COLUMN_COLOURS[label];
    const isPicked  = !isDot && picked.has(i);
    return {
      text: isDot ? '.' : (cells[i] != null ? String(cells[i]) : ''),
      picked: isPicked,
      options: {
        fontFace: FONT, fontSize: cellFont, bold: true,
        color: isPicked ? COLOURS.green : COLOURS.body,
        align: 'center', valign: 'middle', margin: 2,
        fill: { color: colColors ? colColors[1] : DEFAULT_CELL },
        border: { pt: BORDER_PT, color: BORDER_COLOUR }
      }
    };
  });
  const grid = [headerRow, digitRow];
  ringHighlightedCells(grid);
  return grid;
}

function drawPairChartWithCounters(
  pptx, slide, x, y, colWs, columns, cells, populations, picked,
  headerH, counterH, digitH, headerFont, cellFont
) {
  const grid = pairGrid(columns, cells, picked, headerFont, cellFont);
  const header = grid[0];
  const digits = grid[1];

  // pairGrid rings the shared edge on both neighbours for a two-row PowerPoint
  // table. Here the counter band sits between them, so the header is no longer
  // that neighbour and must keep an ordinary border.
  header.forEach(function (cell) { cell.options.border = plainBorder(); });

  slide.addTable([header], {
    x, y, colW: colWs, rowH: [headerH], autoPage: false
  });
  drawCounterBand(pptx, slide, x, y + headerH, colWs, counterH, columns, populations);
  slide.addTable([digits], {
    x, y: y + headerH + counterH, colW: colWs, rowH: [digitH], autoPage: false
  });
}

function drawMiniCounterGroup(pptx, slide, x, y, w, h, column, qty) {
  drawCounterPopulation(pptx, slide, x, y, w, h, column, qty);
}

function drawExchangeCues(pptx, slide, x, y, w, h, cues) {
  if (cues.length === 0 || h <= 0) return;
  const gap = Math.min(EXCHANGE_GAP, w * 0.02);
  const cueW = Math.max(0.5, (w - gap * (cues.length - 1)) / cues.length);

  cues.forEach(function (cue, i) {
    const cueX = x + i * (cueW + gap);
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: cueX, y, w: cueW, h,
      fill: { color: EXCHANGE_BOX, transparency: 8 },
      line: { color: BORDER_COLOUR, width: 1.0 },
      rectRadius: 0.04
    });

    const labelH = Math.min(EXCHANGE_LABEL_H, h * 0.32);
    const pictureY = y + 0.03;
    const pictureH = Math.max(0.12, h - labelH - 0.07);
    const groupW = cueW * 0.34;
    const arrowW = cueW * 0.20;
    const leftX = cueX + cueW * 0.04;
    const rightX = cueX + cueW - cueW * 0.04 - groupW;

    drawMiniCounterGroup(
      pptx, slide, leftX, pictureY, groupW, pictureH,
      cue.from, cue.fromQty
    );
    arrow(
      pptx, slide,
      leftX + groupW + 0.02, pictureY + pictureH / 2,
      rightX - 0.02, pictureY + pictureH / 2,
      { color: COLOURS.title, width: 3.0 }
    );
    drawMiniCounterGroup(
      pptx, slide, rightX, pictureY, groupW, pictureH,
      cue.to, cue.toQty
    );

    slide.addText(cue.label, {
      x: cueX + 0.04, y: y + h - labelH - 0.02,
      w: cueW - 0.08, h: labelH,
      fontFace: FONT,
      fontSize: fitLabelFont(cue.label, cueW - 0.08, labelH, EXCHANGE_FONT),
      bold: true, color: COLOURS.body,
      align: 'center', valign: 'middle', margin: 0, wrap: false,
      objectName: 'NOFIT_pv-exchange-label'
    });
  });
}

// A before-and-after pair: start chart, labelled arrow, result chart, under a
// title bar stating the operation and its result.
function drawPair(pptx, slide, zone, columns, pair) {
  const from = Array.isArray(pair.from) ? pair.from : null;
  const to   = Array.isArray(pair.to)   ? pair.to   : null;
  if (!from || !to) return;

  const operation = pair.operation != null ? String(pair.operation) : '';
  const resultNumber = numberFromCells(columns, to);
  // An explicit "" is a deliberate "no title bar"; anything else falls back to
  // the operation and the result the cells spell.
  const title = pair.title != null
    ? String(pair.title)
    : (operation === '' ? resultNumber
                        : (resultNumber === '' ? operation
                                               : operation + ': ' + resultNumber));

  const changed = changedIndices(columns, from, to);
  const hasUnknownResult = columns.some(function (column, i) {
    return column !== '.' && (to[i] == null || String(to[i]) === '');
  });
  const counterSpec = pair.counters && typeof pair.counters === 'object'
    ? pair.counters
    : null;
  const fromCounters = counterSpec && counterSpec.from
    && typeof counterSpec.from === 'object' ? counterSpec.from : null;
  const toCounters = counterSpec && counterSpec.to
    && typeof counterSpec.to === 'object' ? counterSpec.to : null;
  const hasCounters = Boolean(fromCounters || toCounters);
  const exchanges = normaliseExchanges(pair, columns);

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const innerH = zone.h - 2 * PAD;

  const hasTitle = title !== '';
  const titleH   = hasTitle ? clamp(innerH * TITLE_SHARE, TITLE_H_MIN, TITLE_H_MAX) : 0;
  const exchangeH = exchanges.length > 0
    ? Math.min(EXCHANGE_H, Math.max(0.40, innerH * 0.16))
    : 0;
  const afterTitleY = innerY + (hasTitle ? titleH + TITLE_GAP : 0);
  const bandY = afterTitleY + (exchangeH > 0 ? exchangeH + EXCHANGE_GAP : 0);
  const bandH = innerH
    - (hasTitle ? titleH + TITLE_GAP : 0)
    - (exchangeH > 0 ? exchangeH + EXCHANGE_GAP : 0);

  const sameH      = clamp(bandH * SAME_SHARE, SAME_H_MIN, SAME_H_MAX);
  const chartAreaH = Math.max(0.4, bandH - sameH);
  const arrowGap   = clamp(innerW * ARROW_GAP_SHARE, ARROW_GAP_MIN, ARROW_GAP_MAX);

  const nDot      = columns.filter(function (c) { return c === '.'; }).length;
  const gridUnits = (columns.length - nDot) + nDot * DOT_FRACTION;
  const naturalW  = gridUnits * REF_COL_W;
  const naturalH  = HEADER_H + NATURAL_ROW_H + (hasCounters ? COUNTER_ROW_H : 0);

  const availChartW = Math.max(0.4, (innerW - arrowGap) / 2);
  const scale  = clamp(Math.min(availChartW / naturalW, chartAreaH / naturalH),
                       hasCounters ? 0.42 : PAIR_MIN_SCALE, PAIR_MAX_SCALE);
  const chartW = naturalW * scale;
  const chartH = naturalH * scale;

  const regColW = chartW / gridUnits;
  const colWs   = columns.map(function (c) {
    return c === '.' ? regColW * DOT_FRACTION : regColW;
  });

  const totalW = 2 * chartW + arrowGap;
  const leftX  = innerX + Math.max(0, (innerW - totalW) / 2);
  const rightX = leftX + chartW + arrowGap;
  // Sit the pair a little above centre in its band rather than dead centre: when
  // the charts are width-limited (a half column, a chart with few columns) dead
  // centre leaves a gulf under the title bar and the title stops reading as this
  // picture's title.
  const chartY = bandY + Math.max(0, (chartAreaH - chartH) * CHART_TOP_BIAS);

  const headerFont = Math.round(HEADER_FONT_SIZE * scale);
  const cellFont   = Math.round(CELL_FONT_SIZE * scale);
  const headerH    = HEADER_H * scale;
  const digitH     = NATURAL_ROW_H * scale;
  const counterH   = hasCounters ? COUNTER_ROW_H * scale : 0;
  const rowHs      = [headerH, digitH];

  if (hasTitle) {
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: innerX, y: innerY, w: innerW, h: titleH,
      fill: { color: COLOURS.title },
      line: { type: 'none' },
      rectRadius: TITLE_RADIUS
    });
    slide.addText(title, {
      x: innerX + 0.10, y: innerY, w: innerW - 0.20, h: titleH,
      fontFace: FONT, fontSize: TITLE_FONT, bold: true,
      color: COLOURS.pureWhite, align: 'center', valign: 'middle',
      margin: 0, fit: FIT
    });
  }

  if (exchangeH > 0) {
    drawExchangeCues(pptx, slide, innerX, afterTitleY, innerW, exchangeH, exchanges);
  }

  if (hasCounters) {
    drawPairChartWithCounters(
      pptx, slide, leftX, chartY, colWs, columns, from, fromCounters,
      new Set(), headerH, counterH, digitH, headerFont, cellFont
    );
    drawPairChartWithCounters(
      pptx, slide, rightX, chartY, colWs, columns, to, toCounters,
      changed, headerH, counterH, digitH, headerFont, cellFont
    );
  } else {
    slide.addTable(pairGrid(columns, from, new Set(), headerFont, cellFont), {
      x: leftX, y: chartY, colW: colWs, rowH: rowHs, autoPage: false
    });
    slide.addTable(pairGrid(columns, to, changed, headerFont, cellFont), {
      x: rightX, y: chartY, colW: colWs, rowH: rowHs, autoPage: false
    });
  }

  // The arrow, across the gap at the charts' middle, carrying the operation
  // above it. This is the only part of the picture that says something HAPPENED.
  const arrowY = chartY + chartH / 2;
  arrow(pptx, slide,
    leftX + chartW + ARROW_INSET, arrowY,
    rightX - ARROW_INSET, arrowY,
    { color: COLOURS.title, width: ARROW_W });

  if (operation !== '') {
    const labelH = ARROW_LABEL_H * scale;
    slide.addText(operation, {
      x: leftX + chartW, y: arrowY - labelH - 0.06 * scale,
      w: arrowGap, h: labelH,
      fontFace: FONT,
      fontSize: fitLabelFont(operation, arrowGap - 2 * ARROW_INSET, labelH,
                             ARROW_LABEL_FONT * scale),
      bold: true,
      color: COLOURS.title, align: 'center', valign: 'bottom',
      margin: 0, wrap: false, objectName: 'NOFIT_pv-pair-op'
    });
  }

  // "same" under every column of the RESULT chart that did not move, in that
  // column's own colour. Without it the chart says only what changed, and a child
  // is left to infer that everything else held still - which is exactly the half
  // of the idea a 10-more lesson is trying to teach.
  let sx = rightX;
  columns.forEach(function (label, i) {
    const w = colWs[i];
    if (!hasUnknownResult && label !== '.' && !changed.has(i) && w >= 0.38) {
      slide.addText(SAME_TEXT, {
        x: sx, y: chartY + chartH + 0.04, w: w, h: sameH,
        fontFace: FONT,
        fontSize: fitLabelFont(SAME_TEXT, w, sameH, SAME_FONT * scale),
        bold: true,
        color: SAME_COLOURS[label] || BORDER_COLOUR,
        align: 'center', valign: 'top',
        margin: 0, wrap: false, objectName: 'NOFIT_pv-pair-same'
      });
    }
    sx += w;
  });
}

function drawPlaceValueChart(pptx, slide, zone, data) {
  const columns = Array.isArray(data.columns) ? data.columns : [];
  const rows    = Array.isArray(data.rows)    ? data.rows    : [];
  if (columns.length === 0) return;

  // A chart written without `pair` draws exactly as it always has.
  if (data.pair && typeof data.pair === 'object') {
    return drawPair(pptx, slide, zone, columns, data.pair);
  }

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const innerH = zone.h - 2 * PAD;

  // An explicitly EMPTY rows array asks for the headings on their own — the bare
  // "Th | H | T | O" strip a quick check puts in its side rail so children have
  // the column names to answer WITH. Omitting `rows` altogether still means the
  // old thing, a chart with one blank row for the teacher to fill in live: the
  // difference matters because a blank row under the headings reads as answer
  // space, and a reference strip is not asking for anything to be written on it.
  const headerOnly = Array.isArray(data.rows) && data.rows.length === 0;

  const dataRows = headerOnly
    ? []
    : (rows.length > 0
        ? rows
        : [columns.map(function () { return ''; })]).map(normaliseRow);

  const hasLabels = dataRows.some(function (r) { return r.label !== ''; });
  const hasCounters = dataRows.some(function (r) { return r.counters !== null; });

  const nDot     = columns.filter(function (c) { return c === '.'; }).length;
  const nReg     = columns.length - nDot;
  // The label column is priced in the same units as the digit columns, then
  // capped, so it can never eat the chart it is captioning.
  const rawLabelW = hasLabels ? LABEL_FRACTION : 0;
  const gridUnits = nReg + nDot * DOT_FRACTION;
  const labelUnits = hasLabels
    ? Math.min(rawLabelW, (LABEL_MAX_SHARE / (1 - LABEL_MAX_SHARE)) * gridUnits)
    : 0;
  const regColW  = innerW / (gridUnits + labelUnits);
  const colWs    = columns.map(function (c) {
    return c === '.' ? regColW * DOT_FRACTION : regColW;
  });
  if (hasLabels) colWs.unshift(regColW * labelUnits);

  const naturalH = HEADER_H
    + (NATURAL_ROW_H + (hasCounters ? COUNTER_ROW_H : 0)) * dataRows.length;
  // The old chart stopped growing at a fixed 0.38in header + 0.55in per row,
  // whatever room the template deliberately gave it. Three charts on a
  // modelling slide therefore occupied a thin strip and were unreadable from
  // the carpet. Scale type and rows together, bounded both by the zone's height
  // and by the width of an ordinary digit column so a many-column chart does
  // not acquire type wider than its cells.
  const scale = Math.max(
    0.65,
    Math.min(1.7, innerH / naturalH, regColW / 0.45)
  );
  const headerH  = HEADER_H * scale;
  const usedH    = naturalH * scale;

  // Refuse a zone the chart cannot fit even at its smallest readable size.
  //
  // The scale stops shrinking at 0.65 so the digits stay readable from the
  // carpet, which means a zone shorter than the chart's floor height cannot be
  // satisfied - and the centring below would then push the chart's top above
  // the zone. On one real lesson that sent a five-row chart's tables to a
  // negative y, which the PPTX writer serialised as an invalid coordinate, and
  // PowerPoint offered to "repair" the deck. Refusing by name here means the
  // slide-design check reports the fault with its slide number while the spec
  // can still be repaired, instead of a finished file nobody can open.
  //
  // The whole zone (pads included) is the boundary, not the inner box: an
  // overflow small enough to live in the pads harms nothing and is kept.
  if (!headerOnly && usedH > zone.h) {
    throw new Error(
      `PLACE_VALUE_CHART_DOES_NOT_FIT: this chart needs at least ` +
      `${usedH.toFixed(2)}in of height at its smallest readable size ` +
      `(${dataRows.length} row(s)${hasCounters ? ' with counters' : ''}), but ` +
      `its zone offers ${zone.h.toFixed(2)}in. Give it a taller zone, fewer ` +
      `rows, or drop the counters.`
    );
  }

  // A full chart centres in its zone. A bare header strip sits at the TOP of it:
  // the strip is a reference in a side rail, and a reference belongs where the eye
  // lands first, not floating halfway down a tall thin column.
  const startY   = headerOnly ? innerY : Math.max(zone.y, innerY + (innerH - usedH) / 2);
  const rowH     = NATURAL_ROW_H * scale;
  const counterH = hasCounters ? COUNTER_ROW_H * scale : 0;
  const headerFont = Math.round(HEADER_FONT_SIZE * scale);
  const cellFont = Math.round(CELL_FONT_SIZE * scale);
  const labelFont = Math.round(LABEL_FONT_SIZE * scale);

  const headerRow = columns.map(function (label) {
    const colColors = COLUMN_COLOURS[label];
    const fill = colColors ? colColors[0] : DEFAULT_HEADER;
    return {
      text: label === '.' ? '' : label,
      options: {
        fontFace: FONT, fontSize: headerFont, bold: true, color: COLOURS.body,
        align: 'center', valign: 'middle', margin: 2,
        fill: { color: fill },
        border: { pt: BORDER_PT, color: BORDER_COLOUR }
      }
    };
  });
  // The cell above the labels stays blank: the labels name rows, not a column,
  // and a heading over them would invite a heading that isn't there.
  if (hasLabels) {
    headerRow.unshift({
      text: '',
      options: {
        fontFace: FONT, fontSize: headerFont, bold: true, color: COLOURS.body,
        align: 'center', valign: 'middle', margin: 2,
        fill: { color: LABEL_FILL },
        border: { pt: BORDER_PT, color: BORDER_COLOUR }
      }
    });
  }

  const digitRows = dataRows.map(function (row) {
    const picked = highlightedIndices(row.highlight, columns);
    const cells = columns.map(function (label, i) {
      const isDot     = label === '.';
      const colColors = COLUMN_COLOURS[label];
      const fill      = colColors ? colColors[1] : DEFAULT_CELL;
      const isPicked  = !isDot && picked.has(i);
      return {
        text: isDot ? '.' : (row.cells[i] != null ? String(row.cells[i]) : ''),
        picked: isPicked,
        options: {
          fontFace: FONT, fontSize: cellFont, bold: true,
          color: isPicked ? COLOURS.green : COLOURS.body,
          align: 'center', valign: 'middle', margin: 2,
          fill: { color: fill },
          border: { pt: BORDER_PT, color: BORDER_COLOUR }
        }
      };
    });
    if (hasLabels) {
      cells.unshift({
        text: row.label,
        picked: false,
        options: {
          fontFace: FONT, fontSize: labelFont, bold: true, color: COLOURS.body,
          align: 'center', valign: 'middle', margin: 2,
          fill: { color: LABEL_FILL },
          border: { pt: BORDER_PT, color: BORDER_COLOUR }
        }
      });
    }
    return cells;
  });

  if (!hasCounters) {
    const grid = [headerRow].concat(digitRows);
    ringHighlightedCells(grid);

    slide.addTable(grid, {
      x: innerX, y: startY,
      colW: colWs,
      rowH: [headerH].concat(dataRows.map(function () { return rowH; })),
      autoPage: false
    });
    return;
  }

  // Counter rows need actual circle shapes rather than repeated glyphs, so the
  // counter population and written digit remain two visibly distinct layers.
  // The label cell spans both layers; all digit and counter columns still share
  // exactly the same x coordinates.
  slide.addTable([headerRow], {
    x: innerX, y: startY, colW: colWs, rowH: [headerH], autoPage: false
  });

  const labelW = hasLabels ? colWs[0] : 0;
  const digitColWs = hasLabels ? colWs.slice(1) : colWs;
  const digitX = innerX + labelW;
  let rowY = startY + headerH;

  dataRows.forEach(function (row, rowIndex) {
    if (hasLabels) {
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: innerX, y: rowY, w: labelW, h: counterH + rowH,
        fill: { color: LABEL_FILL },
        line: { color: BORDER_COLOUR, width: BORDER_PT }
      });
      slide.addText(row.label, {
        x: innerX + 0.03, y: rowY,
        w: Math.max(0.01, labelW - 0.06), h: counterH + rowH,
        fontFace: FONT, fontSize: labelFont, bold: true, color: COLOURS.body,
        align: 'center', valign: 'middle', margin: 0, fit: FIT
      });
    }

    drawCounterBand(
      pptx, slide, digitX, rowY, digitColWs, counterH, columns, row.counters
    );

    const cells = hasLabels ? digitRows[rowIndex].slice(1) : digitRows[rowIndex];
    ringHighlightedCells([cells]);
    slide.addTable([cells], {
      x: digitX, y: rowY + counterH,
      colW: digitColWs, rowH: [rowH], autoPage: false
    });
    rowY += counterH + rowH;
  });
}

// Card-look measure: the rect a card behind this chart should cover, in slide
// inches, or null when the chart fills its zone in ways this cannot predict
// (the pair form lays out two charts with its own maths). This MIRRORS the
// layout lines at the top of drawPlaceValueChart - the same normalisation,
// column pricing, natural height, scale clamp and centring - so a change to
// either must be made in both, or the card will hug a chart that isn't there.
function measurePlaceValueChart(zone, data) {
  const columns = Array.isArray(data.columns) ? data.columns : [];
  const rows    = Array.isArray(data.rows)    ? data.rows    : [];
  if (columns.length === 0) return null;
  if (data.pair && typeof data.pair === 'object') return null;

  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const innerH = zone.h - 2 * PAD;

  const headerOnly = Array.isArray(data.rows) && data.rows.length === 0;
  const dataRows = headerOnly
    ? []
    : (rows.length > 0
        ? rows
        : [columns.map(function () { return ''; })]).map(normaliseRow);

  const hasLabels   = dataRows.some(function (r) { return r.label !== ''; });
  const hasCounters = dataRows.some(function (r) { return r.counters !== null; });

  const nDot     = columns.filter(function (c) { return c === '.'; }).length;
  const nReg     = columns.length - nDot;
  const rawLabelW = hasLabels ? LABEL_FRACTION : 0;
  const gridUnits = nReg + nDot * DOT_FRACTION;
  const labelUnits = hasLabels
    ? Math.min(rawLabelW, (LABEL_MAX_SHARE / (1 - LABEL_MAX_SHARE)) * gridUnits)
    : 0;
  const regColW  = innerW / (gridUnits + labelUnits);

  const naturalH = HEADER_H
    + (NATURAL_ROW_H + (hasCounters ? COUNTER_ROW_H : 0)) * dataRows.length;
  const scale = Math.max(
    0.65,
    Math.min(1.7, innerH / naturalH, regColW / 0.45)
  );
  const usedH  = naturalH * scale;
  const startY = headerOnly ? innerY : innerY + (innerH - usedH) / 2;

  return { x: zone.x, y: startY - PAD, w: zone.w, h: usedH + 2 * PAD };
}

module.exports = { drawPlaceValueChart, measurePlaceValueChart };
