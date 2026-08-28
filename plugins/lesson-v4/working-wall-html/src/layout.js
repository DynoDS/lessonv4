"use strict";


const fsHelpers = require("fs");
const pathHelpers = require("path");


const A4_SHORT_IN = 8.27;
const A4_LONG_IN = 11.69;
const A3_SHORT_IN = 11.69;
const A3_LONG_IN = 16.54;


const CHAR_WIDTH_RATIO = 0.55;
const TITLE_FIT_SAFETY = 0.93;


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

  for (let pt = defaultPt; pt >= minPt; pt -= 4) {
    if (fitAt(pt).fits) return pt;
  }
  const floor = fitAt(minPt);
  if (!floor.fits) {
    console.warn(`[autofit] linear body at floor ${minPt}pt overflows ${size} ${orientation} or breaks the ${maxLinesPerItem}-line cap — split into fewer items or shorten the longest item.`);
  }
  return minPt;
}

function fitReferenceTableSize(columns, rows, columnWidthsDxa, defaultPt, minPt, size, orientation, style, opts = {}) {
  const isA3 = size === "A3";
  const dims = printableInches(size, orientation, style);
  const titleAreaInches = opts.titleAreaInches != null ? opts.titleAreaInches : (isA3 ? 1.4 : 1.0);
  const safety = opts.safety != null ? opts.safety : 0.3;
  const availHeight = dims.height - titleAreaInches - safety;
  const lineHeight = opts.lineHeight || 1.25;
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

  for (let pt = defaultPt; pt >= minPt; pt -= 4) {
    if (fitAt(pt).fits) return pt;
  }
  const floor = fitAt(minPt);
  if (!floor.fits) {
    const label = opts.label ? ` "${opts.label}"` : "";
    console.warn(`[autofit] reference table${label} at floor ${minPt}pt overflows ${size} ${orientation} or a single word/cell exceeds the ${maxLinesPerCell}-line cap — shorten cell text, split rows, or upgrade page size.`);
  }
  return minPt;
}

// ─── Reference table ────────────────────────────────────────────────────

function referenceColumnWidths(columnCount, pageSize, orientation, style) {
  const dims = printableInches(pageSize, orientation, style);
  const totalDxa = Math.round(dims.width * 1440);

  if (columnCount === 2) {
    const left = Math.round(totalDxa * 0.30);
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
  printableInches,
  printableDxa,
  fitTitleSize,
  fitLinearBodySize,
  fitReferenceTableSize,
  referenceColumnWidths,
  tryReadPhoto,
  photoAspect,
  WIDE_ASPECT,
};