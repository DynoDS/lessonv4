"use strict";


const fsHelpers = require("fs");
const pathHelpers = require("path");


const A4_SHORT_IN = 8.27;
const A4_LONG_IN = 11.69;
const A3_SHORT_IN = 11.69;
const A3_LONG_IN = 16.54;


const CHAR_WIDTH_RATIO = 0.55;
const TITLE_FIT_SAFETY = 0.93;
const TITLE_BAR_PADDING_DXA = 240;
const TITLE_BAR_LINE_HEIGHT = 1.25;
const REFERENCE_TABLE_LINE_HEIGHT = 1.25;


const WIDE_ASPECT = 1.15;

// ─── Page geometry ──────────────────────────────────────────────────────

function pageInches(size, orientation) {
  const isA3 = size === "A3";
  const short = isA3 ? A3_SHORT_IN : A4_SHORT_IN;
  const long = isA3 ? A3_LONG_IN : A4_LONG_IN;
  if (orientation === "landscape") return { width: long, height: short };
  return { width: short, height: long };
}

function marginInches(size, style) {
  const cm = size === "A3" ? style.marginsCm.a3 : style.marginsCm.a4;
  return cm / 2.54;
}

function printableInches(size, orientation, style) {
  const dims = pageInches(size, orientation);
  const m = marginInches(size, style);
  return { width: dims.width - 2 * m, height: dims.height - 2 * m };
}

function printableDxa(size, orientation, style) {
  const dims = printableInches(size, orientation, style);
  return { width: Math.round(dims.width * 1440), height: Math.round(dims.height * 1440) };
}

// ─── Autofit ────────────────────────────────────────────────────────────

function fitTitleSize(text, basePt, size, orientation, style) {
  const usableWidth = pageInches(size, orientation).width - 2 * marginInches(size, style);
  const safe = usableWidth * TITLE_FIT_SAFETY;
  let pt = basePt;
  while (pt > 36) {
    const widthInches = (text.length * pt * CHAR_WIDTH_RATIO) / 72;
    if (widthInches <= safe) return pt;
    pt -= 8;
  }
  return Math.max(36, pt);
}

// Keep the height reserved by the layout pass identical to the title bar's
// CSS. A fixed 1.4in allowance was smaller than a 96pt A3 title plus its two
// 240dxa paddings, so a table could validate and then lose its final row below
// the physical page edge.
function titleBarHeightInches(fittedPt) {
  return (fittedPt * TITLE_BAR_LINE_HEIGHT / 72) + (2 * TITLE_BAR_PADDING_DXA / 1440);
}

function longestWordLen(text) {
  if (!text) return 0;
  let max = 0;
  for (const word of String(text).split(/\s+/)) if (word.length > max) max = word.length;
  return max;
}

function fitLinearBodySize(items, defaultPt, minPt, size, orientation, style, opts = {}) {
  const isA3 = size === "A3";
  const dims = printableInches(size, orientation, style);
  const titleAreaInches = opts.titleAreaInches != null ? opts.titleAreaInches : (isA3 ? 1.4 : 1.0);
  const safety = opts.safety != null ? opts.safety : 0.4;
  const availHeight = dims.height - titleAreaInches - safety;
  const availWidth = opts.widthOverride != null ? opts.widthOverride : dims.width;
  const lineHeight = opts.lineHeight || 1.3;
  const interItem = opts.interItem != null ? opts.interItem : 0.22;
  const charWidthRatio = opts.charWidthRatio || 0.55;
  const maxLinesPerItem = opts.maxLinesPerItem || 2;

  const fitAt = (pt) => {
    const charsPerLine = Math.max(1, Math.floor((availWidth * 72) / (pt * charWidthRatio)));
    let totalLines = 0;
    for (const item of items) {
      const obj = (typeof item === "string") ? { text: item } : (item || {});
      const text = obj.text || "";
      const labelLen = obj.label ? obj.label.length + 2 : 0;
      const adjLen = text.length + labelLen;
      const longestWord = Math.max(longestWordLen(text), labelLen);
      if (longestWord > charsPerLine) return { fits: false, lines: Infinity };
      const lines = Math.max(1, Math.ceil(adjLen / charsPerLine));
      if (lines > maxLinesPerItem) return { fits: false, lines };
      totalLines += lines;
    }
    const heightInches = totalLines * (pt * lineHeight / 72) + items.length * interItem;
    return { fits: heightInches <= availHeight, height: heightInches, lines: totalLines };
  };

  // A refusal that says only "something is too long" costs the whole wall: the
  // route allows one focused repair, and a repair aimed at nothing is a guess.
  // Name the card, the item, and the budget it has to come under.
  const diagnose = (pt) => {
    const charsPerLine = Math.max(1, Math.floor((availWidth * 72) / (pt * charWidthRatio)));
    const budget = charsPerLine * maxLinesPerItem;
    const where = opts.label ? `${opts.label}` : "this card";
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const obj = (typeof item === "string") ? { text: item } : (item || {});
      const text = obj.text || "";
      const labelLen = obj.label ? obj.label.length + 2 : 0;
      const adjLen = text.length + labelLen;
      const longestWord = Math.max(longestWordLen(text), labelLen);
      if (longestWord > charsPerLine) {
        return `${where}: item ${index + 1} contains a ${longestWord}-character run that cannot break, and only ${charsPerLine} characters fit on a line at ${pt}pt. Split that word or shorten the item's label.`;
      }
      if (Math.ceil(adjLen / charsPerLine) > maxLinesPerItem) {
        return `${where}: item ${index + 1} is ${adjLen} characters including its label, and ${budget} is the most that fits in ${maxLinesPerItem} lines at ${pt}pt (${charsPerLine} per line). Cut it to ${budget} characters or fewer: "${String(text).slice(0, 60)}${text.length > 60 ? "…" : ""}".`;
      }
    }
    const measured = fitAt(pt);
    const over = measured.height != null ? (measured.height - availHeight) : null;
    return `${where}: ${items.length} items need ${measured.height != null ? measured.height.toFixed(1) : "more"}in of panel at ${pt}pt and ${availHeight.toFixed(1)}in is available${over != null ? ` (${over.toFixed(1)}in over)` : ""}. Each item may hold ${budget} characters; remove an item or shorten the longest.`;
  };

  for (let pt = defaultPt; pt >= minPt; pt -= 4) {
    if (fitAt(pt).fits) return pt;
  }
  const floor = fitAt(minPt);
  if (!floor.fits) {
    console.warn(`[autofit] linear body at floor ${minPt}pt does not fit ${size} ${orientation}: ${diagnose(minPt)}`);
  }
  return minPt;
}

// Would this body still fit at its floor size if the card gave it this much
// title-and-visual area? Answers the question `fitLinearBodySize` cannot: its
// return value is `minPt` both when the floor fits exactly and when it does
// not, so a caller deciding how much height to hand a figure cannot tell a
// panel that is full from one that has been overrun. Same arithmetic, one
// boolean.
function linearBodyFitsAtFloor(items, minPt, size, orientation, style, opts = {}) {
  const probe = [];
  const original = console.warn;
  console.warn = (...args) => probe.push(args);
  try {
    fitLinearBodySize(items, minPt, minPt, size, orientation, style, opts);
  } finally {
    console.warn = original;
  }
  return probe.length === 0;
}

function fitReferenceTableSize(columns, rows, columnWidthsDxa, defaultPt, minPt, size, orientation, style, opts = {}) {
  const isA3 = size === "A3";
  const dims = printableInches(size, orientation, style);
  const titleAreaInches = opts.titleAreaInches != null ? opts.titleAreaInches : (isA3 ? 1.4 : 1.0);
  const safety = opts.safety != null ? opts.safety : 0.3;
  const availHeight = dims.height - titleAreaInches - safety;
  const lineHeight = opts.lineHeight || REFERENCE_TABLE_LINE_HEIGHT;
  const charWidthRatio = opts.charWidthRatio || 0.55;
  const headerRatio = opts.headerRatio || 0.75;
  const cellPaddingH = 400 / 1440;
  const cellPaddingW = 400 / 1440;
  const maxLinesPerCell = opts.maxLinesPerCell || 2;
  const rowMinHeights = Array.isArray(opts.rowMinHeights) ? opts.rowMinHeights : [];

  const linesInCell = (text, colWidthInches, pt) => {
    const usable = Math.max(0.1, colWidthInches - cellPaddingW);
    const charsPerLine = Math.max(1, Math.floor((usable * 72) / (pt * charWidthRatio)));
    if (longestWordLen(text) > charsPerLine) return Infinity;
    const words = String(text || "").trim().split(/\s+/).filter(Boolean);
    let lines = 1;
    let used = 0;
    for (const word of words) {
      const needed = used === 0 ? word.length : word.length + 1;
      if (used > 0 && used + needed > charsPerLine) {
        lines += 1;
        used = word.length;
      } else {
        used += needed;
      }
    }
    if (lines > maxLinesPerCell) return Infinity;
    return lines;
  };

  const fitAt = (pt) => {
    const headerPt = Math.max(1, Math.round(pt * headerRatio));
    const colInches = columnWidthsDxa.map((d) => d / 1440);

    const headerCellLines = columns.map((c, i) => linesInCell(c, colInches[i], headerPt));
    if (headerCellLines.some((n) => !isFinite(n))) return { fits: false };
    const headerRowLines = Math.max(...headerCellLines);
    let total = headerRowLines * (headerPt * lineHeight / 72) + cellPaddingH;

    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx];
      const cellLines = row.map((c, i) => linesInCell(c, colInches[i], pt));
      if (cellLines.some((n) => !isFinite(n))) return { fits: false };
      const rowMaxLines = Math.max(...cellLines);
      const textHeight = rowMaxLines * (pt * lineHeight / 72) + cellPaddingH;
      total += Math.max(textHeight, rowMinHeights[rowIdx] || 0);
    }
    return { fits: total <= availHeight, height: total };
  };

  // Same reason as the linear body: one repair, so it has to know which cell
  // and by how much. Column widths differ, so the budget is per column.
  const diagnose = (pt) => {
    const headerPt = Math.max(1, Math.round(pt * headerRatio));
    const colInches = columnWidthsDxa.map((d) => d / 1440);
    const budgetFor = (colIdx, atPt) => {
      const usable = Math.max(0.1, colInches[colIdx] - cellPaddingW);
      return Math.max(1, Math.floor((usable * 72) / (atPt * charWidthRatio))) * maxLinesPerCell;
    };
    const where = opts.label ? `${opts.label}` : "this table";
    const cells = [
      ...columns.map((text, colIdx) => ({ text, colIdx, atPt: headerPt, at: "the header row" })),
      ...rows.flatMap((row, rowIdx) =>
        row.map((text, colIdx) => ({ text, colIdx, atPt: pt, at: `row ${rowIdx + 1}` }))
      ),
    ];
    for (const cell of cells) {
      if (!isFinite(linesInCell(cell.text, colInches[cell.colIdx], cell.atPt))) {
        const budget = budgetFor(cell.colIdx, cell.atPt);
        const name = columns[cell.colIdx] ? `"${columns[cell.colIdx]}"` : `${cell.colIdx + 1}`;
        return `${where}: the cell in ${cell.at}, column ${name}, is ${String(cell.text || "").length} characters and that column holds ${budget} in ${maxLinesPerCell} lines at ${cell.atPt}pt. Cut it to ${budget} characters or fewer: "${String(cell.text || "").slice(0, 60)}${String(cell.text || "").length > 60 ? "…" : ""}".`;
      }
    }
    const measured = fitAt(pt);
    const budgets = columns.map((c, i) => `${c || i + 1}: ${budgetFor(i, pt)}`).join(", ");
    return `${where}: ${rows.length} rows need ${measured.height != null ? measured.height.toFixed(1) : "more"}in and ${availHeight.toFixed(1)}in is available at ${pt}pt. Remove a row, or shorten cells to their column budgets (${budgets}).`;
  };

  for (let pt = defaultPt; pt >= minPt; pt -= 4) {
    if (fitAt(pt).fits) return pt;
  }
  const floor = fitAt(minPt);
  if (!floor.fits) {
    console.warn(`[autofit] reference table at floor ${minPt}pt does not fit ${size} ${orientation}: ${diagnose(minPt)}`);
  }
  return minPt;
}

// ─── Reference table ────────────────────────────────────────────────────

function referenceColumnWidths(columnCount, pageSize, orientation, style) {
  const dims = printableInches(pageSize, orientation, style);
  const totalDxa = Math.round(dims.width * 1440);

  if (columnCount === 2) {
    // Portrait tables need enough physical width for ordinary row labels at
    // the 36pt readability floor. The landscape split remains the established
    // 30/70; portrait uses 35/65 and may wrap descriptive cells to three lines.
    const left = Math.round(totalDxa * (orientation === "portrait" ? 0.35 : 0.30));
    return [left, totalDxa - left];
  }
  if (columnCount === 3) {
    const left = Math.round(totalDxa * 0.27);
    const middle = Math.round(totalDxa * 0.28);
    return [left, middle, totalDxa - left - middle];
  }
  const each = Math.floor(totalDxa / columnCount);
  return Array(columnCount).fill(each);
}

// ─── Photo helpers ──────────────────────────────────────────────────────

function tryReadPhoto(specDir, photoRelPath) {
  if (!photoRelPath) return null;
  const abs = pathHelpers.resolve(specDir, photoRelPath);
  if (!fsHelpers.existsSync(abs)) return null;
  return fsHelpers.readFileSync(abs);
}

function photoAspect(buf) {
  if (!buf || buf.length < 24) return null;
  // PNG: width and height are the two big-endian ints after the IHDR marker.
  if (buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") {
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    return w && h ? w / h : null;
  }
  // JPEG: walk the segment markers to the start-of-frame, which carries the size.
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      // SOF0-SOF15, skipping the four markers in that range that are not frames.
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        const h = buf.readUInt16BE(i + 5);
        const w = buf.readUInt16BE(i + 7);
        return w && h ? w / h : null;
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return null;
}

module.exports = {
  linearBodyFitsAtFloor,
  printableInches,
  printableDxa,
  fitTitleSize,
  titleBarHeightInches,
  fitLinearBodySize,
  fitReferenceTableSize,
  referenceColumnWidths,
  tryReadPhoto,
  photoAspect,
  TITLE_BAR_PADDING_DXA,
  TITLE_BAR_LINE_HEIGHT,
  REFERENCE_TABLE_LINE_HEIGHT,
  WIDE_ASPECT,
};
