'use strict';

const { FONT, COLOURS, FIT } = require('../styles');
const { splitAnswerRuns } = require('../answer-text');
const { fitGroupId, growFitObjectName } = require('../text-fit');
const { textWidthEm } = require('../../../shared/text/comic-glyph-width');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD              = 0.12;
const HEADER_H         = 0.50;
const HEADER_FONT      = 16;
const HEADER_FONT_MAX  = 40;
const CELL_FONT        = 20;
const CELL_FONT_MAX    = 54;
const HEADER_FILL      = '3A3A3A';
const HEADER_TEXT      = 'FFFFFF';
const ROW_FILLS        = ['FFE0C2', 'FFF8C2', 'D6EEFF', 'D5F5E3', 'E8D5F5'];
const CELL_BORDER      = 'CCCCCC';
const FIRST_COL_BOLD   = true;
const CELL_ALIGN       = 'center';
// Projected table content needs its own reading floor. Physical fitting at
// 10pt is not adequate evidence that children can read the table.
const TABLE_MIN_PT     = 20;
const ROW_MIN_H        = 0.38;
// Breathing room either side of a cell's words, in inches, when a column is
// sized to them.
const CELL_SIDE_ROOM   = 0.2;
// The width a picture cell asks for, as a multiple of the row height: a small
// picture a child recognises beside the words in its row.
const PICTURE_CELL_ASPECT = 1.3;
const PICTURE_CELL_PAD = 0.05;
// A column whose longest entry needs no more than this share of the table's
// width is a column of short entries, and keeps each one on a single line.
const SHORT_COLUMN_SHARE = 0.35;
// ─── END CONSTANTS ────────────────────────────────────────────

// A table divides whatever height it is handed. Handed too little, it used to
// divide it anyway and hand every cell a slot no line of text could sit in;
// the fault then surfaced at the very end of the build as TEXT_OVERLOAD on a
// generated box name, reading as "the words are too heavy" when the words were
// "(1)" and the room was the whole problem. Cutting text cannot repair that, so
// the refusal happens here, in the units the zone is written in.
function requiredZoneHeight(rowCount) {
  return 2 * PAD + HEADER_H + rowCount * ROW_MIN_H;
}


// Whether every cell's words stand in a row this tall at the table's reading
// floor, for a stack asking how tall the table has to be (content/stack.js).
// The measure keeps a little in hand, as the sort board's does, so a height it
// accepts passes the fit. A table with a picture in a cell is not measured: how
// small a picture may go is not a question of lines.
function cellsHold(rows, widths, rowH) {
  const need = wordsRowHeight(rows, widths);
  return need != null && need <= rowH;
}

// The row height the fullest cell needs for its words at the reading floor,
// or null when a cell cannot be measured (a picture, a word too wide to
// break). Every row is drawn at one height, so the fullest cell sets it.
function wordsRowHeight(rows, widths) {
  const { wrappedLineCount } = require('../glyph-width');
  let most = 0;
  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    for (let c = 0; c < row.length; c += 1) {
      const cell = row[c];
      if (isPictureCell(cell)) return null;
      const words = plainWords(cell).replace(/\*\*|\[\[|\]\]/g, '');
      if (!words.trim()) continue;
      let ems = 0;
      for (const para of words.split('\n')) {
        const n = para.trim() ? wrappedLineCount(para, TABLE_MIN_PT, widths[c] - 0.06, c === 0) : 1;
        if (!Number.isFinite(n)) return null;
        ems += (1.2 + 1.26 * (n - 1)) * 1.02;
      }
      most = Math.max(most, ems * TABLE_MIN_PT / 72 + 0.03);
    }
  }
  return most;
}

// A cell is words (a string) or a picture: any content object with a `type`,
// usually `{ "type": "image", "imagePath": "..." }`, so one column can hold words
// in some rows and a picture in others (the teacher, 29 September 2026: a
// "what it looks like" table for the digestive system wanted a small picture of
// each part where the words were hard going).
function isPictureCell(cell) {
  return !!cell && typeof cell === 'object' && typeof cell.type === 'string';
}

function plainWords(cell) {
  return String(cell == null ? '' : cell).replace(/\|\||\{\{|\}\}|<<|>>/g, '');
}

function lineInches(text, bold) {
  return textWidthEm(text, bold) * CELL_FONT / 72;
}

// Columns take the width their words need rather than an equal share. Equal
// shares gave a column of one-word part names as much room as a column of
// descriptions, which then wrapped to two lines and would not fit (29
// September 2026). `columnWidths` sets the shares by hand, and
// `columnWidths: "equal"` keeps the old equal split.
function columnWidths(headers, rows, innerW, rowH, fixed) {
  const cols = headers.length;
  if (fixed === 'equal') return headers.map(() => innerW / cols);
  if (Array.isArray(fixed) && fixed.length === cols && fixed.every((n) => Number(n) > 0)) {
    const total = fixed.reduce((sum, n) => sum + Number(n), 0);
    return fixed.map((n) => innerW * Number(n) / total);
  }
  const need = [];
  const floor = [];
  for (let c = 0; c < cols; c += 1) {
    let lineNeed = lineInches(plainWords(headers[c]), true) + CELL_SIDE_ROOM;
    let wordNeed = 0;
    rows.forEach((row) => {
      const cell = Array.isArray(row) ? row[c] : undefined;
      if (isPictureCell(cell)) {
        const pictureNeed = rowH * PICTURE_CELL_ASPECT;
        lineNeed = Math.max(lineNeed, pictureNeed);
        wordNeed = Math.max(wordNeed, pictureNeed);
        return;
      }
      const words = plainWords(cell);
      const bold = c === 0;
      lineNeed = Math.max(lineNeed, lineInches(words, bold) + CELL_SIDE_ROOM);
      words.split(/\s+/).forEach((word) => {
        wordNeed = Math.max(wordNeed, lineInches(word, bold) + CELL_SIDE_ROOM);
      });
    });
    need.push(lineNeed);
    // A column of short entries (part names, labels) keeps each entry on one
    // line: "small intestine" broken over two lines reads as two words.
    floor.push(lineNeed <= innerW * SHORT_COLUMN_SHARE ? lineNeed : Math.min(wordNeed, lineNeed));
  }
  const totalNeed = need.reduce((a, b) => a + b, 0);
  if (totalNeed <= innerW) {
    // Everything fits on one line: share the spare room in proportion, so the
    // table still fills its zone and keeps its shape.
    return need.map((n) => innerW * n / totalNeed);
  }
  const totalFloor = floor.reduce((a, b) => a + b, 0);
  if (totalFloor >= innerW) return floor.map((n) => innerW * n / totalFloor);
  // Every column keeps its longest word; the rest of the width goes where the
  // lines are longest.
  const spare = innerW - totalFloor;
  const want = need.map((n, c) => n - floor[c]);
  const totalWant = want.reduce((a, b) => a + b, 0) || 1;
  return floor.map((n, c) => n + spare * want[c] / totalWant);
}

function drawTable(pptx, slide, zone, data, ctx) {
  const headers = Array.isArray(data.headers) ? data.headers : [];
  const rows    = Array.isArray(data.rows)    ? data.rows    : [];
  if (headers.length === 0 || rows.length === 0) return;

  const cols   = headers.length;
  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const innerH = zone.h - 2 * PAD;
  const bodyH  = innerH - HEADER_H;
  const rowH   = bodyH / rows.length;
  const widths = columnWidths(headers, rows, innerW, rowH, data.columnWidths);
  const colX   = widths.map((_, c) => innerX + widths.slice(0, c).reduce((a, w) => a + w, 0));

  if (rowH < ROW_MIN_H) {
    // The height asked for holds the words, not only one line a row. A Year 4
    // geography table of three definitions took the one-line height exactly
    // and was refused again, once for every cell, because the definitions ran
    // to two lines; the designer then dropped the table (7 October 2026).
    const wordsH = wordsRowHeight(rows, widths);
    const wraps = wordsH != null && wordsH > ROW_MIN_H;
    const needed = wraps
      ? 2 * PAD + HEADER_H + rows.length * (wordsH + 0.01)
      : requiredZoneHeight(rows.length);
    const refusal = new Error(
      `TABLE_ZONE_TOO_SHORT: ${rows.length} row(s) plus the header leave ` +
        `${rowH.toFixed(2)}in per row in a ${zone.h.toFixed(2)}in zone, below the ` +
        `${ROW_MIN_H.toFixed(2)}in one line of cell text needs at the readable ` +
        `floor. Give the table a zone at least ${needed.toFixed(2)}in tall` +
        (wraps ? ' (its fullest cell runs to more than one line at this width)' : '') +
        `, or carry fewer rows; nothing was shrunk further or cut.`
    );
    // The height this zone would have to be, carried as a number so a stack
    // above can work out the weight that reaches it. Saying "at least 1.50in"
    // to an owner who sets weights and not inches leaves the arithmetic to be
    // guessed one repair pass at a time: Year 4 Maths Lesson 16 (22 September
    // 2026) spent all three on six such tables and never found that raising
    // the table's weight from 1 to 1.5 cleared every one of them.
    refusal.neededZoneHeight = needed;
    // The box this helper actually got, which is not the share its parent
    // handed out: a card's chrome sits between the two. A parent working out
    // how much more to allot has to add the shortfall to its own share, not
    // substitute the helper's number for it.
    refusal.zoneHeight = zone.h;
    throw refusal;
  }
  if (zone.measureFloorPt && !cellsHold(rows, widths, rowH)) {
    throw new Error('TABLE_MEASURE: the cells do not hold their words at this height.');
  }
  // One hierarchy across the table: short headings must not grow independently
  // while the longer evidence they describe shrinks to the floor.
  const tableGroup = fitGroupId(zone, 'table-text');

  headers.forEach(function (h, c) {
    const cx = colX[c];
    const colW = widths[c];
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: cx, y: innerY, w: colW, h: HEADER_H,
      fill: { color: HEADER_FILL },
      line: { color: HEADER_FILL, width: 1 }
    });
    slide.addText(h || '', {
      x: cx, y: innerY, w: colW, h: HEADER_H,
      fontFace: FONT, fontSize: HEADER_FONT, bold: true, color: HEADER_TEXT,
      align: 'center', valign: 'middle', margin: 0, fit: FIT,
      objectName: growFitObjectName(tableGroup, HEADER_FONT_MAX, 'table-header-' + c, TABLE_MIN_PT)
    });
  });

  rows.forEach(function (row, r) {
    const rowFill = ROW_FILLS[r % ROW_FILLS.length];
    row.forEach(function (cell, c) {
      const cx = colX[c];
      const colW = widths[c];
      const cy = innerY + HEADER_H + r * rowH;
      const isFirstCol = c === 0;
      const cellBold   = isFirstCol ? true : !FIRST_COL_BOLD;
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: cx, y: cy, w: colW, h: rowH,
        fill: { color: rowFill },
        line: { color: CELL_BORDER, width: 1 }
      });
      if (isPictureCell(cell)) {
        // A picture cell draws through the ordinary helpers, bare: the row's
        // colour is its background, so it takes no card of its own, and it is
        // a cue read with its row's words, so the slide-size picture floor does
        // not apply to it.
        const { drawContent } = require('./index');
        drawContent(pptx, slide, {
          x: cx + PICTURE_CELL_PAD, y: cy + PICTURE_CELL_PAD,
          w: colW - 2 * PICTURE_CELL_PAD, h: rowH - 2 * PICTURE_CELL_PAD,
          noCard: true,
        }, cell, Object.assign({}, ctx || {}, { _tableCell: true }));
        return;
      }
      slide.addText(splitAnswerRuns(cell || '', cellBold), {
        x: cx, y: cy, w: colW, h: rowH,
        fontFace: FONT, fontSize: CELL_FONT, bold: cellBold, color: COLOURS.body,
        align: CELL_ALIGN, valign: 'middle', margin: 0, fit: FIT,
        objectName: growFitObjectName(tableGroup, CELL_FONT_MAX, 'table-cell-' + r + '-' + c, TABLE_MIN_PT)
      });
    });
  });
}

module.exports = { drawTable, requiredZoneHeight, columnWidths, ROW_MIN_H };
