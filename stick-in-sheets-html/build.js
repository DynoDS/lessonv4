#!/usr/bin/env node
"use strict";

// Stick-in Sheets HTML/PDF builder entry point.
// Usage: node build.js <stick-in-sheets.json> [output-dir]
//
// Same job, same JSON contract, same layout rules: a whole-class set of every
// write-on moment, each child's set kept together, tiled with dashed cut
// guides. The difference is the output route: the pack is assembled as HTML
// (figures as true vectors, sizes in CSS millimetres) and printed to PDF
// through the same Chrome step the worksheets use, so the printed sizes are
// exact. When no Chrome is available the HTML itself is written and the build
// says `PDF_SKIPPED:` - the same signal the worksheet builder uses.
//
// Piece sizes and handle stamping come from the shared Stick-in layout rules.
//
// PAGE PACKING uses shelves. Shelves lay each child's set in rows - pieces
// share a row when their widths fit, each row is as tall as its tallest piece -
// which fills the page while keeping the cuts teacher-friendly: every
// horizontal guide still runs straight across the full page (cut the strips
// first), and only the short vertical snips within a strip vary.

const fs = require("fs");
const path = require("path");
const { sanitizeHouseStyle } = require("../shared/text/house-style");
const { safeFilenameComponent } = require("../shared/text/filename");
const { pieceHandle, A4, CLASS_SIZE, HANDLE_BAND_MM } = require("./src/layout-rules");
const { selectContextPictureSet } = require("../shared/context-picture-set");
const { renderPieceHtml, esc } = require("./src/render-piece-html");

const GREY = "#999999";

// Landscape A4 printable area, including 5mm reserved for the page caption.
const PRINTABLE_W_MM = A4.heightMm - 2 * A4.marginMm;      // 297 − 20 = 277
const PRINTABLE_H_MM = A4.widthMm - 2 * A4.marginMm - 5;   // 210 − 20 − 5 = 185

function naturalFilename(lesson, ext) {
  return `${safeFilenameComponent(lesson)} - Stick-in Sheets.${ext}`;
}

// Render every moment once for its footprint, dropping (and naming) the ones
// that cannot draw, so a pack short a moment is reported, never silently
// complete-looking.
async function renderMoments(items, baseDir) {
  const moments = [];
  const dropped = [];
  const pictures = selectContextPictureSet(items, baseDir);
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const handle = pieceHandle(item, i, items.length);
    const renderOpts = handle ? { reserveTopMm: HANDLE_BAND_MM, baseDir } : { baseDir };
    const piece = await renderPieceHtml(item, renderOpts);
    if (piece === null) {
      console.warn(`[stick-in] "${item.label || item.visual}": no figures/boxes - skipping this item.`);
      dropped.push(item.label || item.visual || `item ${i + 1}`);
      continue;
    }
    moments.push({ item, handle, picture: pictures[i], piece });
  }
  return { moments, dropped };
}

// Horizontal breathing room between pieces sharing a shelf (3mm each side →
// 6mm between neighbours), and vertical padding so shelf heights stay
// book-realistic.
const PAD_X_MM = 3;
const PAD_Y_MM = 1.4;

// Lay ONE child's set into shelves: walk the pieces in lesson order, adding
// each to the current shelf while its width fits, else starting a new shelf.
// A shelf is as tall as its tallest piece - the horizontal cut above/below it
// still runs straight across the whole page.
function shelvesForSet(moments) {
  const shelves = [];
  let cur = null;
  for (let i = 0; i < moments.length; i++) {
    const w = moments[i].piece.widthMm + 2 * PAD_X_MM;
    const h = moments[i].piece.heightMm + 2 * PAD_Y_MM;
    if (!cur || cur.wMm + w > PRINTABLE_W_MM) {
      cur = { items: [], wMm: 0, hMm: 0 };
      shelves.push(cur);
    }
    cur.items.push(i);
    cur.wMm += w;
    cur.hMm = Math.max(cur.hMm, h);
  }
  return shelves;
}

function buildHtml(moments, classSize) {
  for (const m of moments) {
    if (m.piece.widthMm > PRINTABLE_W_MM || m.piece.heightMm > PRINTABLE_H_MM) {
      console.warn(
        `[stick-in] "${m.item.label || m.item.visual}": piece larger than the book page - ` +
        `the surrounding handwriting will carry to the next page ` +
        `(piece ${m.piece.widthMm.toFixed(0)}×${m.piece.heightMm.toFixed(0)}mm, ` +
        `printable ${PRINTABLE_W_MM}×${PRINTABLE_H_MM}mm).`
      );
    }
  }

  const shelves = shelvesForSet(moments);
  const setHMm = shelves.reduce((s, sh) => s + sh.hMm, 0);

  // Plan pages as a list of rows, each row a list of cells `{ m, wMm }`; every
  // child's set stays whole, exactly as before:
  //   - a one-shelf set: whole sets sit side by side along a row while they
  //     fit, rows stack down the page (the old a/b/c strip case);
  //   - a multi-shelf set that fits a page: stack as many whole children per
  //     page as fit;
  //   - a set taller than a page: its shelves span whole pages by themselves,
  //     and the next child starts fresh rather than sharing the leftover.
  //
  // UNIFORM COLUMNS: the vertical guides line up down the whole page wherever
  // possible, so the teacher's first cuts are "down the middle, then across" -
  // never a different snip position per strip. Cells therefore take a shared
  // per-column width (the widest piece that column carries anywhere on the
  // page) with the leftover page width spread evenly across the columns, and
  // each piece sits centred in its column. Only when the aligned columns
  // genuinely cannot fit the page does a shelf fall back to its own natural
  // widths - pieces never shrink to buy alignment, because the glued-in size
  // is the one thing this pack must protect.
  const pages = [];
  if (shelves.length === 1) {
    const setW = shelves[0].wMm;
    const setsPerRow = Math.max(1, Math.floor(PRINTABLE_W_MM / setW));
    const rowsPerPage = Math.max(1, Math.floor(PRINTABLE_H_MM / shelves[0].hMm));
    const cellCount = Math.min(setsPerRow * moments.length, classSize * moments.length);
    const spare = Math.max(0, PRINTABLE_W_MM - setsPerRow * setW) / (setsPerRow * moments.length);
    let page = null;
    for (let child = 0; child < classSize; ) {
      if (!page || page.length >= rowsPerPage) { page = []; pages.push(page); }
      const cells = [];
      for (let s = 0; s < setsPerRow && child < classSize; s++, child++) {
        moments.forEach((m, mi) => cells.push({ m: mi, wMm: m.piece.widthMm + 2 * PAD_X_MM + spare }));
      }
      page.push({ cells, hMm: shelves[0].hMm });
    }
  } else {
    // Shared column widths across the set's shelves: column j is as wide as
    // the widest j-th piece on any shelf. Aligned when that still fits.
    const maxCells = Math.max(...shelves.map((sh) => sh.items.length));
    const colW = [];
    for (let j = 0; j < maxCells; j++) {
      colW.push(Math.max(...shelves
        .filter((sh) => sh.items.length > j)
        .map((sh) => moments[sh.items[j]].piece.widthMm + 2 * PAD_X_MM)));
    }
    const alignedTotal = colW.reduce((a, b) => a + b, 0);
    const aligned = alignedTotal <= PRINTABLE_W_MM;
    const spare = aligned ? (PRINTABLE_W_MM - alignedTotal) / maxCells : 0;

    const childRows = shelves.map((sh) => ({
      cells: sh.items.map((mi, j) => ({
        m: mi,
        wMm: aligned ? colW[j] + spare : moments[mi].piece.widthMm + 2 * PAD_X_MM,
      })),
      hMm: sh.hMm,
    }));
    if (setHMm <= PRINTABLE_H_MM) {
      const childrenPerPage = Math.max(1, Math.floor(PRINTABLE_H_MM / setHMm));
      let page = null;
      for (let child = 0; child < classSize; child++) {
        if (!page || (page.length / childRows.length) >= childrenPerPage) { page = []; pages.push(page); }
        for (const row of childRows) page.push({ cells: row.cells.map((c) => ({ ...c })), hMm: row.hMm });
      }
    } else {
      // Set taller than a page: greedy shelf groups per page, one child at a time.
      for (let child = 0; child < classSize; child++) {
        let page = null;
        let used = Infinity;
        for (const row of childRows) {
          if (used + row.hMm > PRINTABLE_H_MM) { page = []; pages.push(page); used = 0; }
          page.push({ cells: row.cells.map((c) => ({ ...c })), hMm: row.hMm });
          used += row.hMm;
        }
      }
    }
  }

  const handles = moments.map((m) => m.handle).filter(Boolean);
  const captionText = moments.length === 1
    ? `✂ ${moments[0].handle ? `${moments[0].handle} ` : ""}${moments[0].item.label || moments[0].item.visual} (cut along the dashed lines and stick in).`
    : `✂ Cut along the dashed lines and stick in. Every child gets one of each labelled piece${handles.length ? `: ${handles.join(", ")}` : ""}.`;

  const pageDivs = pages.map((rows) => {
    const shelfDivs = rows.map((row, r) => {
      const cells = row.cells.map((cell, c) => {
        const m = moments[cell.m];
        // A vertical guide after every piece another piece follows - between
        // two pieces of one set, and between two sets sharing the shelf.
        const rightReal = c + 1 < row.cells.length;
        let pictureHtml = "";
        if (m.picture && m.picture.type === "image") {
          pictureHtml = `<img src="data:image/png;base64,${m.picture.buffer.toString("base64")}" alt="" style="max-width:6mm;max-height:5mm;width:auto;height:auto">`;
        } else if (m.picture && m.picture.type === "emoji") {
          pictureHtml = `<span style="font-family:'Segoe UI Emoji','Apple Color Emoji',sans-serif">${esc(m.picture.value)}</span>`;
        }
        const handleHtml = m.handle
          ? `<div style="display:flex;align-items:center;justify-content:center;gap:1mm;font-weight:bold;font-size:12pt;height:${HANDLE_BAND_MM}mm;line-height:1">${pictureHtml}<span>${esc(m.handle)}</span></div>`
          : "";
        return `<div style="width:${cell.wMm}mm;padding:${PAD_Y_MM}mm ${PAD_X_MM}mm;box-sizing:border-box;` +
          `display:flex;flex-direction:column;justify-content:center;` +
          (rightReal ? `border-right:0.3mm dashed ${GREY};` : "") +
          `"><div>${handleHtml}${m.piece.html}</div></div>`;
      });
      // The horizontal guide under a shelf runs straight across the whole
      // printable width - the teacher cuts the strips first, then snips each
      // strip. No guide under the last shelf on the page.
      const belowReal = r + 1 < rows.length;
      return `<div style="display:flex;align-items:stretch;height:${row.hMm}mm;` +
        (belowReal ? `border-bottom:0.3mm dashed ${GREY};` : "") + `">${cells.join("")}</div>`;
    });
    return `<div class="page"><div class="caption">${esc(captionText)}</div>${shelfDivs.join("")}</div>`;
  });

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@page { size: A4 landscape; margin: 0; }
html, body { margin: 0; padding: 0; }
body { font-family: "Comic Sans MS", "Segoe Print", cursive; }
.page {
  width: ${A4.heightMm}mm; height: ${A4.widthMm}mm;
  box-sizing: border-box; padding: ${A4.marginMm}mm;
  overflow: hidden; page-break-after: always;
}
.caption { color: ${GREY}; font-size: 9pt; height: 5mm; }
</style></head><body>${pageDivs.join("")}</body></html>`;

  return { html, pages: pages.length, totalSlips: classSize * moments.length };
}

async function build(specPath, outDir) {
  const spec = sanitizeHouseStyle(JSON.parse(fs.readFileSync(specPath, "utf8")));
  const items = Array.isArray(spec.items) ? spec.items : [];
  const baseDir = path.dirname(specPath);

  if (items.length === 0) {
    console.log(`No write-on moments - Stick-in Sheets not written${spec.rationaleNote ? ` (${spec.rationaleNote})` : ""}.`);
    return null;
  }

  const classSize = Number.isFinite(spec.classSize) && spec.classSize > 0 ? spec.classSize : CLASS_SIZE;
  const { moments, dropped } = await renderMoments(items, baseDir);

  if (moments.length === 0) {
    console.error(
      `None of the ${items.length} write-on moment${items.length === 1 ? "" : "s"} could be drawn, ` +
      `so no Stick-in Sheets file was written.`
    );
    console.error(`Missing: ${dropped.join(", ")}. The [stick-in] lines above say why for each.`);
    process.exitCode = 1;
    return null;
  }

  const { html, pages, totalSlips } = buildHtml(moments, classSize);
  const lesson = spec.meta && spec.meta.lesson;

  // PDF through the worksheets' Chrome step; the HTML itself when that step
  // cannot run, flagged with the same PDF_SKIPPED signal the worksheets use so
  // the orchestrator treats both builders' fallbacks the same way.
  let outPath;
  try {
    const { htmlToPdf } = require("../worksheet-html/src/chrome");
    const pdf = await htmlToPdf(html, { landscape: true });
    outPath = path.join(outDir, naturalFilename(lesson, "pdf"));
    fs.writeFileSync(outPath, pdf);
  } catch (err) {
    outPath = path.join(outDir, naturalFilename(lesson, "html"));
    fs.writeFileSync(outPath, html);
    console.log(`PDF_SKIPPED: ${err && err.message ? err.message.split("\n")[0] : err}`);
  }

  console.log(`Built: ${outPath}`);
  console.log(`Moments: ${moments.length} (${moments.map((m) => m.item.label || m.item.visual).join(", ")})`);

  const classSetLine =
    `Class set: ${moments.length} moment${moments.length === 1 ? "" : "s"} × ${classSize} children = ` +
    `${totalSlips} slips, laid out so each child's set stays together, across ${pages} page${pages === 1 ? "" : "s"}`;

  if (dropped.length) {
    console.log(`${classSetLine}.`);
    console.error(
      `\n${dropped.length} of ${items.length} write-on moments could not be drawn and ` +
      `${dropped.length === 1 ? "is" : "are"} NOT in this pack: ${dropped.join(", ")}.`
    );
    console.error(
      'The [stick-in] lines above say why for each. A missing moment leaves no gap on the ' +
      'page, so this pack looks complete and is not: it needs rebuilding once that is fixed.'
    );
    process.exitCode = 1;
  } else {
    console.log(`${classSetLine} - print once, cut along the dashed lines, each child's set comes off together.`);
  }
  return outPath;
}

if (require.main === module) {
  const [, , specPath, outDirArg] = process.argv;
  if (!specPath) {
    console.error("Usage: node build.js <stick-in-sheets.json> [output-dir]");
    process.exit(1);
  }
  const outDir = outDirArg ? path.resolve(outDirArg) : path.dirname(path.resolve(specPath));
  build(path.resolve(specPath), outDir).catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}

module.exports = { build, buildHtml, renderMoments };
