"use strict";

// HTML piece renderer for the stick-in pack.
//
// Size and validation rules come from the Stick-in visual registry. This file
// translates them into HTML: pieces carry their figures as inline SVG sized in
// CSS millimetres, so Chrome's print pipeline preserves their physical size.
//
// Each render function returns { html, widthMm, heightMm } for the tiling layer.

const fs = require("fs");
const path = require("path");

const {
  VISUALS, ROW_VISUALS, ROW_PER_ROW, BOXES_PER_ROW,
  missingQuestionContent, ROW_BOX_H_MM, ROW_LINE_GAP_MM, LABEL_DIAGRAM_WIDTH_MM,
  SOURCE_COPY_WIDTH_MM, SOURCE_COPY_CAPTION_LINE_MM, SOURCE_COPY_CAPTION_PAD_MM, SOURCE_COPY_CHAR_MM,
} = require("./visual-registry");
const { A4 } = require("./layout-rules");

// The tallest a piece can print: the landscape page's printable height, the
// same figure build.js packs shelves against (portrait width, both margins,
// the 5mm page caption). A source copy is refused above it rather than cropped,
// because a source with its bottom cut off is a different source.
const PIECE_MAX_H_MM = A4.widthMm - 2 * A4.marginMm - 5;
const { buildLabelDiagramSvg } = require("../../shared/visuals/label-diagram-svg");

const GREY = "#999999";

// Row cell padding and caption-band sizing. The figure-to-line gap is imported
// above, where its reason lives.
const ROW_CELL_PAD_MM = 4;   // (cellWMm = boxWMm + 8) → 4mm each side
const ROW_LABEL_BAND_MM = 8; // extra height per sub-row when writeOnLabels is on

const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Inline a tightSvg result at an exact printed size. The shared modules emit a
// root <svg> with width/height in px and a matching viewBox; strip the XML
// prolog and replace the px dimensions with the mm ones so the figure prints at
// the size the registry decided, scaling by its viewBox.
function inlineSvg(svgStr, widthMm, heightMm) {
  return svgStr
    .replace(/^<\?xml[^?]*\?>/, "")
    .replace(/^<svg /, `<svg style="display:block" `)
    .replace(/ width="[^"]*"/, ` width="${widthMm}mm"`)
    .replace(/ height="[^"]*"/, ` height="${heightMm}mm"`);
}

function centreWrap(inner, widthMm) {
  return `<div style="width:${widthMm}mm;margin:0 auto">${inner}</div>`;
}

// One single-figure write-on item - sizing walk:
// per-item widthMm override, else fitHeightMm (width follows aspect), else
// defaultWidthMm; then shrink just enough to fit the reserved handle band so a
// labelled piece keeps the same tile footprint as an unlabelled one.
function renderSingle(item, opts = {}) {
  const def = VISUALS[item.visual];
  const missing = missingQuestionContent(item);
  if (missing) {
    console.warn(`[stick-in] "${item.label || item.visual}": ${missing}, so this item is skipped rather than tiled as blank copies.`);
    return null;
  }
  const rawSpec = item.spec || {};
  // A drawing laid out at its printed size (the number line) is told the width
  // the piece will print at.
  // A ruler states its own width instead, because it prints at true size.
  const ownWidthMm = def.widthMmFor ? def.widthMmFor(def.specFn ? def.specFn(rawSpec) : rawSpec) : null;
  const printedWidthMm = item.widthMm ?? ownWidthMm ?? def.defaultWidthMm;
  let drawn;
  try {
    drawn = def.tightSvg(def.specFn ? def.specFn(rawSpec) : rawSpec, def.laidOutAtWidth ? { widthMm: printedWidthMm } : undefined);
  } catch (error) {
    // A shared drawing refuses a box it cannot be read in (numerals under the
    // pack's readable floor) by name. One piece that cannot draw is skipped and
    // named, like a piece missing its question, rather than stopping the pack.
    console.warn(`[stick-in] "${item.label || item.visual}": ${error.message} This item is skipped.`);
    return null;
  }
  const { svg, w, h, aspect } = drawn;
  const a = aspect ?? w / h;
  // A drawing laid out at its printed size prints at the size it chose, which
  // may be narrower than the box it was offered (a clock face does not stretch
  // to the width of the piece); scaling it up would enlarge its numerals past
  // the size it laid them out at.
  const laidOutMm = def.laidOutAtWidth ? Math.min(printedWidthMm, w * (25.4 / 72)) : null;
  const naturalWidthMm = laidOutMm ?? item.widthMm ?? (def.fitHeightMm ? a * def.fitHeightMm : def.defaultWidthMm);
  const reserveTopMm = opts.reserveTopMm || 0;
  const naturalHeightMm = naturalWidthMm / a;
  // A drawing laid out at its printed size keeps that size and the handle band
  // goes on top of it: shrinking it to pay for the band shrinks its words under
  // the readable size they were laid out at, and a flat drawing pays most (a
  // 110mm shaded bar came out 60mm wide to find 5mm of height, 13 September 2026).
  const widthMm = reserveTopMm > 0 && !def.laidOutAtWidth
    ? Math.max(1, naturalHeightMm - reserveTopMm) * a
    : naturalWidthMm;
  const heightMm = widthMm / a;
  return {
    html: centreWrap(inlineSvg(svg, widthMm, heightMm), widthMm),
    widthMm,
    heightMm: heightMm + reserveTopMm,
  };
}

// A strip of N figures, each contain-fitted into one common box with a solid
// write-on line beneath - same box, same wrap count, same footprint arithmetic,
// so all the lines sit on one baseline and the strip plans into the same tile.
function renderRow(item) {
  const def = ROW_VISUALS[item.visual];
  const figs = (item.spec && item.spec.figures) || [];
  if (figs.length === 0) return null;
  // The same guard the single figures get. It was only ever wired to
  // `renderSingle`, which cost nothing while every row figure had a valid
  // default (an angle with no degrees is a perfectly good 45 degrees to name).
  // A dotty board is the first row figure that can be asked for a shape and
  // handed none, and the strip would print as bare grids with write-on lines
  // under them - looking exactly right, for all thirty children.
  const missingInRow = missingQuestionContent(item);
  if (missingInRow) {
    console.warn(`[stick-in] "${item.label || item.visual}": ${missingInRow}, so this item is skipped rather than tiled as blank copies.`);
    return null;
  }
  const boxWMm = item.spec?.figureWidthMm ?? def.defaultFigureWidthMm;
  // Most row figures share one box height so every write-on line sits level and
  // no figure looks bigger than its neighbours. A figure whose usability depends
  // on printed detail rather than overall shape - dotty-paper pegs a child counts
  // one at a time - declares its own, and every cell in ITS strip uses that, so
  // the strip is still internally level.
  const boxHMm = def.boxHeightMm ?? ROW_BOX_H_MM;
  const cellWMm = boxWMm + 2 * ROW_CELL_PAD_MM;
  const withLabels = Boolean(item.spec?.writeOnLabels);

  const cells = figs.map((fspec) => {
    const { svg, w, h } = def.tightSvg(fspec);
    const scale = Math.min(boxWMm / w, boxHMm / h);
    const displayW = w * scale;
    const displayH = h * scale;
    const line = withLabels
      ? `<div style="border-bottom:0.4mm solid ${GREY};height:0;margin-top:${ROW_LINE_GAP_MM}mm"></div>`
      : "";
    // Bottom-aligned figure so every write-on line sits level however tall the
    // figure inside the common box is.
    return `<td style="width:${cellWMm}mm;height:${boxHMm + ROW_LINE_GAP_MM}mm;vertical-align:bottom;padding:1mm 2mm;border:none">` +
      `<div style="display:flex;align-items:flex-end;justify-content:center;height:${boxHMm}mm">` +
      inlineSvg(svg, displayW, displayH) +
      `</div>${line}</td>`;
  });

  const colCount = Math.min(figs.length, ROW_PER_ROW);
  const rows = [];
  for (let i = 0; i < cells.length; i += ROW_PER_ROW) {
    const rowCells = cells.slice(i, i + ROW_PER_ROW);
    while (rowCells.length < colCount) rowCells.push(`<td style="width:${cellWMm}mm;border:none"></td>`);
    rows.push(`<tr>${rowCells.join("")}</tr>`);
  }

  const rowCount = Math.ceil(figs.length / ROW_PER_ROW);
  return {
    html: `<table style="border-collapse:collapse;margin:0 auto"><tbody>${rows.join("")}</tbody></table>`,
    widthMm: colCount * cellWMm,
    heightMm: rowCount * (boxHMm + ROW_LINE_GAP_MM + (withLabels ? ROW_LABEL_BAND_MM : 0)),
  };
}

// A row of empty solid-bordered boxes the child draws in, caption above each -
// same box size and footprint arithmetic.
function renderBoxRow(item) {
  const boxes = (item.spec && item.spec.boxes) || [];
  if (boxes.length === 0) return null;
  const boxMm = item.spec?.boxWidthMm ?? 40;
  const cellWMm = boxMm + 6;

  const cells = boxes.map((b) => {
    const caption = b.caption
      ? `<div style="text-align:center;font-weight:bold;margin-bottom:1mm">${esc(b.caption)}</div>`
      : "";
    return `<td style="width:${cellWMm}mm;vertical-align:top;padding:1mm 2mm;border:none">${caption}` +
      `<div style="width:${boxMm}mm;height:${boxMm}mm;border:0.35mm solid #000;margin:0 auto"></div></td>`;
  });

  const colCount = Math.min(boxes.length, BOXES_PER_ROW);
  const rows = [];
  for (let i = 0; i < cells.length; i += BOXES_PER_ROW) {
    const rowCells = cells.slice(i, i + BOXES_PER_ROW);
    while (rowCells.length < colCount) rowCells.push(`<td style="width:${cellWMm}mm;border:none"></td>`);
    rows.push(`<tr>${rowCells.join("")}</tr>`);
  }

  const rowCount = Math.ceil(boxes.length / BOXES_PER_ROW);
  return {
    html: `<table style="border-collapse:collapse;margin:0 auto"><tbody>${rows.join("")}</tbody></table>`,
    widthMm: colCount * cellWMm + 8,
    heightMm: rowCount * (boxMm + 12),
  };
}

// The photo-based labelled diagram - the picture is embedded as a data URI
// inside the shared SVG overlay, so the printed piece shows the same photo the
// board shows with the same leader lines.
async function renderLabelDiagram(item, baseDir, opts = {}) {
  const spec = item.spec || {};
  if (!spec.image) return null;
  const imgPath = path.isAbsolute(spec.image) ? spec.image : path.join(baseDir || ".", spec.image);
  if (!fs.existsSync(imgPath)) {
    console.warn(`[stick-in] "${item.label || item.visual}": image not found at ${imgPath}, skipping this item.`);
    return null;
  }
  const sharp = require("sharp");
  const meta = await sharp(imgPath).metadata();
  const mime = meta.format === "png" ? "image/png" : meta.format === "svg" ? "image/svg+xml" : "image/jpeg";
  const b64 = fs.readFileSync(imgPath).toString("base64");
  const { svg, aspect } = buildLabelDiagramSvg({
    href: `data:${mime};base64,${b64}`,
    width: meta.width,
    height: meta.height,
    callouts: spec.callouts || [],
    blue: "#0070C0",
  });

  const a = aspect;
  const naturalWidthMm = item.widthMm ?? LABEL_DIAGRAM_WIDTH_MM;
  const reserveTopMm = opts.reserveTopMm || 0;
  const naturalHeightMm = naturalWidthMm / a;
  const widthMm = reserveTopMm > 0
    ? Math.max(1, naturalHeightMm - reserveTopMm) * a
    : naturalWidthMm;
  const heightMm = widthMm / a;
  return {
    html: centreWrap(inlineSvg(svg, widthMm, heightMm), widthMm),
    widthMm,
    heightMm: heightMm + reserveTopMm,
  };
}

// A printed copy of one source the child READS from - the same published
// picture the board shows, at a width the detail can actually be read at, with
// a caption naming it beneath. No write-on line: this is the read-from piece,
// for a document, a timetable, a photograph or a map whose fine detail cannot be
// seen from the back of the room. The picture keeps its own proportions and the
// cut guide follows it; a copy taller than the page is refused with the height
// named, never cropped, because a source with its bottom missing is a different
// source.
async function renderSourceCopy(item, baseDir, opts = {}) {
  const missing = missingQuestionContent(item);
  if (missing) {
    console.warn(`[stick-in] "${item.label || item.visual}": ${missing}, so this item is skipped rather than tiled as blank copies.`);
    return null;
  }
  const spec = item.spec || {};
  const imgPath = path.isAbsolute(spec.imagePath) ? spec.imagePath : path.join(baseDir || ".", spec.imagePath);
  if (!fs.existsSync(imgPath)) {
    console.warn(`[stick-in] "${item.label || item.visual}": image not found at ${imgPath}, skipping this item.`);
    return null;
  }
  const sharp = require("sharp");
  const meta = await sharp(imgPath).metadata();
  if (!(meta.width > 0 && meta.height > 0)) {
    console.warn(`[stick-in] "${item.label || item.visual}": could not read the picture's size from ${imgPath}, skipping this item.`);
    return null;
  }
  const mime = meta.format === "png" ? "image/png" : meta.format === "svg" ? "image/svg+xml" : "image/jpeg";
  const b64 = fs.readFileSync(imgPath).toString("base64");
  const aspect = meta.width / meta.height;

  const caption = String(spec.caption).trim();
  const widthMm = item.widthMm ?? spec.widthMm ?? SOURCE_COPY_WIDTH_MM;
  const captionLines = Math.max(1, Math.ceil((caption.length * SOURCE_COPY_CHAR_MM) / widthMm));
  const captionMm = captionLines * SOURCE_COPY_CAPTION_LINE_MM + SOURCE_COPY_CAPTION_PAD_MM;
  const reserveTopMm = opts.reserveTopMm || 0;
  const imageHMm = widthMm / aspect;
  const heightMm = imageHMm + captionMm + reserveTopMm;

  if (heightMm > PIECE_MAX_H_MM) {
    // The widest this picture can print and still fit the page, so the fix is
    // one number away rather than a guess.
    const fitWidthMm = Math.floor((PIECE_MAX_H_MM - captionMm - reserveTopMm) * aspect);
    console.warn(
      `[stick-in] "${item.label || item.visual}": at ${widthMm}mm wide this source copy is ` +
      `${heightMm.toFixed(0)}mm tall, and the page can print at most ${PIECE_MAX_H_MM}mm. ` +
      `It is not cropped, because a source with its bottom missing is a different source: ` +
      `set widthMm to ${fitWidthMm} or less, or choose a crop of the source on the slide and copy that.`
    );
    return null;
  }

  const html =
    `<div style="width:${widthMm}mm;margin:0 auto">` +
    `<img src="data:${mime};base64,${b64}" alt="" style="display:block;width:${widthMm}mm;height:${imageHMm.toFixed(2)}mm">` +
    `<div style="text-align:center;font-size:11pt;line-height:${SOURCE_COPY_CAPTION_LINE_MM}mm;padding-top:${SOURCE_COPY_CAPTION_PAD_MM}mm">${esc(caption)}</div>` +
    `</div>`;
  return { html, widthMm, heightMm };
}

// One write-on item → { html, widthMm, heightMm }, or null (with a warning)
// when there is nothing to render.
async function renderPieceHtml(item, opts = {}) {
  if (ROW_VISUALS[item.visual]) return renderRow(item);
  if (item.visual === "draw-box-row") return renderBoxRow(item);
  if (item.visual === "label-diagram") return renderLabelDiagram(item, opts.baseDir, opts);
  if (item.visual === "source-copy") return renderSourceCopy(item, opts.baseDir, opts);
  if (!VISUALS[item.visual]) {
    throw new Error(`Unknown stick-in visual: "${item.visual}". Add it to VISUALS or ROW_VISUALS in stick-in-sheets-html/src/visual-registry.js.`);
  }
  return renderSingle(item, opts);
}

module.exports = { renderPieceHtml, esc };
