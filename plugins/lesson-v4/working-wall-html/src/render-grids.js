"use strict";

// Grid family renderers: referenceTable, equivalenceGrid and vocabChips.

const {
  printableDxa,
  printableInches,
  fitTitleSize,
  titleBarHeightInches,
  fitReferenceTableSize,
  referenceColumnWidths,
  tryReadPhoto,
  photoAspect,
  TITLE_BAR_LINE_HEIGHT,
  REFERENCE_TABLE_LINE_HEIGHT,
} = require("./layout");
const {
  pickVisual,
  pickRainbowColour,
  cardLabel,
  defaultBodyPt,
  minBodyPt,
} = require("./visuals");
const { esc, mm, hash, imgTag, titleBarHtml, panelHtml } = require("./shared");

const FONT_STACK_FALLBACK = "'Segoe Print', cursive";
const WALL_TABLE_IMAGE_HEIGHT_CAP_IN = 1.6;

// Local title-fit wrapper used by this renderer family.
function titlePtFor(card, style) {
  const base = card.page.size === "A3" ? style.sizes.a3TitlePt : style.sizes.a4TitlePt;
  return fitTitleSize(card.title || "", base, card.page.size, card.page.orientation, style);
}

// ─── Reference table: title bar + bordered grid ──────────────────────────
// Reference table with fixed columns, current validation, cell visuals/photos
// and autofit arithmetic.

function renderReferenceTable(card, style, specDir, ctx = {}) {
  if (!Array.isArray(card.columns) || card.columns.length === 0) {
    throw new Error(`Card "${card.type}" missing required "columns" array.`);
  }
  if (!Array.isArray(card.rows) || card.rows.length === 0) {
    throw new Error(`Card "${card.type}" missing required "rows" array (must be a non-empty array of row arrays).`);
  }
  const colCount = card.columns.length;
  card.rows.forEach((row, idx) => {
    if (!Array.isArray(row) || row.length !== colCount) {
      throw new Error(`Card "${card.type}" row ${idx + 1} has ${Array.isArray(row) ? row.length : "non-array"} cells; expected ${colCount} (matching the columns array).`);
    }
  });

  // A cell may be a diagram ({ "visual": {...} }) or a photo ({ "photo": "..." })
  // instead of a string. Resolve those to a PNG + true aspect for the table,
  // and keep a text-only shadow of the rows for the autofit pass (which
  // measures characters and would choke on an object cell).
  const resolvedRows = card.rows.map((row) =>
    row.map((cell) => {
      if (cell && typeof cell === "object" && cell.visual) {
        const v = pickVisual(cell.visual, ctx);
        if (!v) throw new Error(`Card "${card.title || card.type}" could not render a required table-cell visual.`);
        return { image: v.buf, aspect: v.aspect };
      }
      if (cell && typeof cell === "object" && cell.photo) {
        const photoBuf = tryReadPhoto(specDir, cell.photo);
        if (!photoBuf) throw new Error(`Card "${card.title || card.type}" could not read required table-cell photo "${cell.photo}".`);
        return { image: photoBuf, aspect: photoAspect(photoBuf) || 1.5 };
      }
      return cell;
    })
  );
  const textRows = card.rows.map((row) =>
    row.map((cell) => (cell && typeof cell === "object") ? "" : cell)
  );

  const titlePt = fitTitleSize(card.title || "", card.page.size === "A3" ? style.sizes.a3TitlePt : style.sizes.a4TitlePt, card.page.size, card.page.orientation, style);
  const colWidths = referenceColumnWidths(card.columns.length, card.page.size, card.page.orientation, style);
  const rowImageMaxHeight = card.rows.length <= 2
    ? 1.8
    : WALL_TABLE_IMAGE_HEIGHT_CAP_IN;
  const tablePhoto = card.photo ? tryReadPhoto(specDir, card.photo) : null;
  if (card.photo && !tablePhoto) {
    throw new Error(`Card "${card.title || card.type}" could not read required photo "${card.photo}".`);
  }
  // A3-only builder: use the fixed A3 value below.
  const tablePhotoHeight = tablePhoto ? 1.35 : 0;

  const rowMinHeights = resolvedRows.map((row) => {
    let maxHeight = 0;
    row.forEach((cell, idx) => {
      if (cell && typeof cell === "object" && cell.image) {
        const colIn = colWidths[idx] / 1440;
        let wIn = Math.max(0.6, colIn - 0.35);
        const aspect = cell.aspect || 1;
        let hIn = wIn / aspect;
        if (hIn > rowImageMaxHeight) hIn = rowImageMaxHeight;
        maxHeight = Math.max(maxHeight, hIn + 0.3);
      }
    });
    return maxHeight;
  });

  const bodyPt = fitReferenceTableSize(
    card.columns,
    textRows,
    colWidths,
    defaultBodyPt(card, style),
    minBodyPt(card, style),
    card.page.size,
    card.page.orientation,
    style,
    {
      rowMinHeights,
      titleAreaInches: titleBarHeightInches(titlePt) + tablePhotoHeight + (tablePhoto ? 0.2 : 0),
      label: cardLabel(card),
      // A portrait table trades width for height, so three measured lines are
      // legitimate there while dense landscape tables retain the two-line cap.
      maxLinesPerCell: card.page.orientation === "portrait" || card.rows.length <= 2 ? 3 : 2,
      lineHeight: REFERENCE_TABLE_LINE_HEIGHT,
    }
  );
  const headerPt = Math.max(20, Math.round(bodyPt * 0.75));

  // Title bar text colour matches titleBarText (both FFFFFF), so
  // titleBarHtml's own text colour is used as-is.
  let html = titleBarHtml(
    card.title || "Reference",
    style.colours.referenceTableHeaderFill,
    style,
    titlePt,
    card.page.size,
    card.page.orientation,
    { lineHeight: TITLE_BAR_LINE_HEIGHT }
  );

  if (tablePhoto) {
    const aspect = photoAspect(tablePhoto) || 1.5;
    let hIn = tablePhotoHeight;
    let wIn = hIn * aspect;
    const maxWIn = printableInches(card.page.size, card.page.orientation, style).width;
    if (wIn > maxWIn) { wIn = maxWIn; hIn = wIn / aspect; }
    html += `<div style="text-align:center;padding:${mm(90 / 1440)}mm 0;">${imgTag(tablePhoto, mm(wIn), mm(hIn), "margin:0 auto;")}</div>`;
  }

  html += referenceTableHtml(card.columns, resolvedRows, headerPt, bodyPt, colWidths, style, { imageMaxHeight: rowImageMaxHeight });
  return html;
}

// Header row uses the header fill with white bold text; body rows alternate
// shading; the grid border is 1pt and cell padding is 200 dxa.
function referenceTableHtml(columns, rows, headerPt, bodyPt, columnWidths, style, opts = {}) {
  const borderCss = `${mm(8 / 8 / 72)}mm solid ${hash(style.colours.referenceTableGrid)}`;
  const cellPadMm = mm(200 / 1440);
  const totalDxa = columnWidths.reduce((a, b) => a + b, 0);
  const colsHtml = columnWidths.map((w) => `<col style="width:${mm(w / 1440)}mm;">`).join("");

  const headerHtml =
    `<tr>` +
    columns.map((header) =>
      `<th style="box-sizing:border-box;border:${borderCss};padding:${cellPadMm}mm;background:${hash(style.colours.referenceTableHeaderFill)};` +
      `text-align:center;vertical-align:middle;font-family:'${style.fonts.title}', ${FONT_STACK_FALLBACK};font-weight:bold;` +
      `font-size:${headerPt}pt;line-height:${REFERENCE_TABLE_LINE_HEIGHT};color:${hash(style.colours.referenceTableHeaderText)};">${esc(header)}</th>`
    ).join("") +
    `</tr>`;

  const bodyHtml = rows.map((row, idx) => {
    const isAlt = idx % 2 === 1;
    const fillColour = isAlt ? style.colours.referenceTableAltRow : "FFFFFF";
    const cellsHtml = row.map((cell, cellIdx) => {
      let innerHtml;
      if (cell && typeof cell === "object" && cell.image) {
        // A diagram or photo cell - placed at its true aspect, bounded by
        // the column width and the row's max image height.
        const colIn = columnWidths[cellIdx] / 1440;
        let wIn = Math.max(0.6, colIn - 0.35);
        const aspect = cell.aspect || 1;
        let hIn = wIn / aspect;
        const maxHIn = opts.imageMaxHeight || 1.8;
        if (hIn > maxHIn) { hIn = maxHIn; wIn = hIn * aspect; }
        innerHtml = imgTag(cell.image, mm(wIn), mm(hIn), "margin:0 auto;");
      } else {
        const textColour = cellIdx === 0 ? style.colours.referenceTableHeaderFill : style.colours.body;
        innerHtml = `<div style="font-family:'${style.fonts.body}', ${FONT_STACK_FALLBACK};font-weight:bold;font-size:${bodyPt}pt;line-height:${REFERENCE_TABLE_LINE_HEIGHT};color:${hash(textColour)};">${esc(cell)}</div>`;
      }
      return `<td style="box-sizing:border-box;border:${borderCss};padding:${cellPadMm}mm;background:${hash(fillColour)};text-align:center;vertical-align:middle;">${innerHtml}</td>`;
    }).join("");
    return `<tr>${cellsHtml}</tr>`;
  }).join("");

  return (
    `<table style="border-collapse:collapse;table-layout:fixed;width:${mm(totalDxa / 1440)}mm;">` +
    `<colgroup>${colsHtml}</colgroup><thead>${headerHtml}</thead><tbody>${bodyHtml}</tbody></table>`
  );
}

// ─── Equivalence grid: coloured rows, each with a visual + equivalence text ─
// Full-width two-column rows (22% visual cell, rest values), per-row colour
// or rainbow cycling, its own character-count autofit copied verbatim -
// including the source's own mismatch between the autofit's measuring text
// ("= " joined by three spaces) and the render text ("=  " joined by four
// spaces). Preserve the existing autofit discrepancy: measurement joins
// with three spaces while rendered text joins with four.

function renderEquivalenceGrid(card, style, specDir, ctx = {}) {
  const titleText = card.title || "Equivalences";
  const rows = Array.isArray(card.rows) ? card.rows : [];
  const pdxa = printableDxa(card.page.size, card.page.orientation, style);

  const titlePt = titlePtFor({ ...card, title: titleText }, style);
  const titleBarEl = titleBarHtml(titleText, style.colours.equivalenceGridTitleBarFill, style, titlePt, card.page.size, card.page.orientation);

  if (rows.length === 0) {
    return titleBarEl;
  }

  const totalDxa = pdxa.width;
  const visualWidthDxa = Math.round(totalDxa * 0.22);
  const valuesWidthDxa = totalDxa - visualWidthDxa;

  // A3-only builder: use the fixed A3 values below.
  const rowFontPt = (() => {
    const baseFont = 64;
    const minFont = 32;
    const valuesWidthIn = valuesWidthDxa / 1440;
    let longest = 0;
    for (const r of rows) {
      const text = (r.values || []).map((v) => "= " + v).join("   ");
      if (text.length > longest) longest = text.length;
    }
    for (let pt = baseFont; pt >= minFont; pt -= 4) {
      const widthIn = (longest * pt * 0.65) / 72;
      if (widthIn <= valuesWidthIn - 0.6) return pt;
    }
    return minFont;
  })();

  // Image sizing at 96 units per inch: the true rendered image side is
  // this value / 96 inches, not the / 72 the arithmetic implies.
  const rowImageSizePx = Math.round((visualWidthDxa / 1440) * 72 * 0.7);

  const rowsHtml = rows.map((row, idx) => {
    const colour = hash((row.colour || pickRainbowColour(idx, style)).replace(/^#/, ""));

    let visualInner = "";
    const rv = row.visual ? pickVisual(row.visual, ctx) : null;
    if (rv && rv.buf) {
      const aspect = rv.aspect || 1;
      let wPx = rowImageSizePx;
      let hPx = Math.round(wPx / aspect);
      if (hPx > rowImageSizePx) { hPx = rowImageSizePx; wPx = Math.round(hPx * aspect); }
      visualInner = imgTag(rv.buf, mm(wPx / 96), mm(hPx / 96), "margin:0 auto;");
    }

    const valuesText = (row.values || []).map((v) => "=  " + String(v)).join("    ");

    return (
      `<div style="display:flex;align-items:stretch;width:100%;">` +
      `<div style="box-sizing:border-box;width:${mm(visualWidthDxa / 1440)}mm;background:${colour};padding:${mm(200 / 1440)}mm;display:flex;align-items:center;justify-content:center;">${visualInner}</div>` +
      `<div style="box-sizing:border-box;width:${mm(valuesWidthDxa / 1440)}mm;background:${colour};padding:${mm(200 / 1440)}mm;display:flex;align-items:center;justify-content:center;">` +
      `<div style="text-align:center;white-space:pre;font-family:'${style.fonts.title}', ${FONT_STACK_FALLBACK};font-weight:bold;font-size:${rowFontPt}pt;color:${hash(style.colours.titleBarText || "FFFFFF")};">${esc(valuesText)}</div>` +
      `</div>` +
      `</div>`
    );
  }).join("");

  return titleBarEl + `<div style="width:100%;">${rowsHtml}</div>`;
}

// ─── Vocab chips: 2-column grid of white pills, teal 3pt outline ────────
// Chip autofit loop (40pt down to 24pt floor, 0.6 ratio), word bold teal
// centred, photo chips put the word left and a square image right.

function renderVocabChips(card, style, specDir, ctx = {}) {
  const titleText = card.title || "Vocabulary";
  const chips = Array.isArray(card.chips) ? card.chips.filter((c) => c && c.word) : [];
  const pdxa = printableDxa(card.page.size, card.page.orientation, style);

  const titlePt = titlePtFor({ ...card, title: titleText }, style);
  const titleBarEl = titleBarHtml(titleText, style.colours.vocabDefinitionTitleBarFill, style, titlePt, card.page.size, card.page.orientation);

  if (chips.length === 0) {
    return titleBarEl;
  }

  const accent = style.colours.vocabDefinitionTitleBarFill;
  const pillFill = "FFFFFF";

  // 2-column grid. Row count flexes with chip count: 4 chips -> 2 rows,
  // 6 chips -> 3 rows, 12 chips -> 6 rows.
  const cols = 2;
  const colWidthDxa = Math.floor(pdxa.width / cols);
  const cellPadding = 120;
  const pillInnerWidthDxa = colWidthDxa - cellPadding * 2;

  // Chip text autofit - pick a size that keeps the longest word on one line
  // inside the pill, with a floor of 24pt.
  const longestChipChars = chips.reduce((m, c) => Math.max(m, String(c.word).length), 1);
  const hasPhotoChip = chips.some((c) => c.photo);
  const usableInches = (pillInnerWidthDxa / 1440) - 0.4 - (hasPhotoChip ? 0.8 : 0);
  let chipPt = 40;
  for (let pt = 40; pt >= 24; pt -= 2) {
    const widthIn = (longestChipChars * pt * 0.6) / 72;
    if (widthIn <= usableInches) { chipPt = pt; break; }
    chipPt = pt;
  }

  // Image sizing at 96 units per inch: the true rendered side is imagePt / 96
  // inches. Preserve the existing 96-unit scale.
  const imagePt = Math.round(chipPt * 1.1);
  const imageCellWidthDxa = Math.round(imagePt / 72 * 1440) + 200;
  const wordCellWidthDxa = pillInnerWidthDxa - imageCellWidthDxa;
  const imageTrueSideIn = imagePt / 96;

  const buildPillHtml = (chip) => {
    const photoBuf = chip.photo ? tryReadPhoto(specDir, chip.photo) : null;

    const wordHtml =
      `<div style="text-align:${photoBuf ? "left" : "center"};padding:${mm(60 / 1440)}mm 0;` +
      `font-family:'${style.fonts.body}', ${FONT_STACK_FALLBACK};font-weight:bold;` +
      `font-size:${chipPt}pt;color:${hash(accent)};">${esc(String(chip.word))}</div>`;

    if (photoBuf) {
      // Word on the left, image on the right, both vertically centred
      // inside the pill via a borderless inner two-column flex row.
      const inner =
        `<div style="display:flex;align-items:center;width:100%;">` +
        `<div style="box-sizing:border-box;width:${mm(wordCellWidthDxa / 1440)}mm;padding:${mm(80 / 1440)}mm ${mm(80 / 1440)}mm ${mm(80 / 1440)}mm ${mm(160 / 1440)}mm;">${wordHtml}</div>` +
        `<div style="box-sizing:border-box;width:${mm(imageCellWidthDxa / 1440)}mm;padding:${mm(80 / 1440)}mm ${mm(160 / 1440)}mm ${mm(80 / 1440)}mm ${mm(80 / 1440)}mm;text-align:right;">${imgTag(photoBuf, mm(imageTrueSideIn), mm(imageTrueSideIn), "display:inline-block;")}</div>` +
        `</div>`;
      return panelHtml(inner, pillFill, accent, style, card.page.size, card.page.orientation, { borderEighths: 24, paddingDxa: 80 });
    }

    return panelHtml(wordHtml, pillFill, accent, style, card.page.size, card.page.orientation, { borderEighths: 24, paddingDxa: 180 });
  };

  // Lay chips into row-major 2-column rows. An odd-count grid pads its last
  // row with an empty cell so the layout stays balanced.
  const rowsHtml = [];
  for (let i = 0; i < chips.length; i += cols) {
    const rowChips = [chips[i], chips[i + 1] || null];
    const cellsHtml = rowChips.map((chip) =>
      `<div style="box-sizing:border-box;width:${mm(colWidthDxa / 1440)}mm;padding:${mm(120 / 1440)}mm ${mm(cellPadding / 1440)}mm;display:flex;align-items:center;">` +
      (chip ? buildPillHtml(chip) : "") +
      `</div>`
    );
    rowsHtml.push(`<div style="display:flex;align-items:stretch;width:100%;">${cellsHtml.join("")}</div>`);
  }

  return titleBarEl + `<div style="width:100%;">${rowsHtml.join("")}</div>`;
}

module.exports = { renderReferenceTable, renderEquivalenceGrid, renderVocabChips };
