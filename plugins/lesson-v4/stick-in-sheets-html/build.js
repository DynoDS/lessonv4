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
const { sixSevenNumbers, sixSevenMessage } = require("../shared/text/no-six-seven");
const { safeFilenameComponent } = require("../shared/text/filename");
const { pieceHandle, A4, CLASS_SIZE, HANDLE_BAND_MM } = require("./src/layout-rules");
const { selectContextPictureSet } = require("../shared/context-picture-set");
const { renderPieceHtml, esc } = require("./src/render-piece-html");
const { withoutTaughtMarks } = require("../shared/text/criteria-marks");
const { normaliseCardSet, renderKitPages, renderSheetPages } = require("./src/render-card-set");
const { normaliseSourceText, renderSourceTextPages } = require("./src/render-source-text");
const { figurePages, normaliseTaskSheet, taskSheetPages } = require("./src/render-activity-page");

const GREY = "#999999";

// Landscape A4 printable area, including 5mm reserved for the page caption.
const PRINTABLE_W_MM = A4.heightMm - 2 * A4.marginMm;      // 297 − 20 = 277
const PRINTABLE_H_MM = A4.widthMm - 2 * A4.marginMm - 5;   // 210 − 20 − 5 = 185

// Every printed piece is its own file, named for the activity it serves and
// numbered in the order the lesson meets them (`Activity 2 - Story cards to
// order.pdf`), so a teacher prints only what they want (Daniel, 1 October
// 2026: "I'd want them seperate ... just the activity"). The files sit in the
// lesson's own folder while the run builds, so two lessons built side by side
// never share an `Activity 1`; delivery copies them out by their plain names.
function activitiesFolder(outDir, lesson) {
  return path.join(outDir, `${safeFilenameComponent(lesson)} - Activities`);
}

function pieceFilename(number, label, ext, taken) {
  const stem = `Activity ${number} - ${safeFilenameComponent(label || "Printed piece")}`;
  let name = `${stem}.${ext}`;
  for (let n = 2; taken.has(name.toLowerCase()); n += 1) name = `${stem} (${n}).${ext}`;
  taken.add(name.toLowerCase());
  return name;
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
  // A piece's label or handle may carry a taught word's mark; the caption and
  // the handle print the word plain, never its braces (the fourth check).
  // The dashed lines say cut; the page carries no instruction to the teacher.
  const captionText = "";

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
          ? `<div style="display:flex;align-items:center;justify-content:center;gap:1mm;font-weight:bold;font-size:12pt;height:${HANDLE_BAND_MM}mm;line-height:1">${pictureHtml}<span>${esc(withoutTaughtMarks(m.handle))}</span></div>`
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

  const html = wrapDocument(pageDivs);

  return { html, pageDivs, pages: pages.length, totalSlips: classSize * moments.length };
}

// One landscape page: the grey caption the teacher reads while cutting, then
// the body the caller laid out.
function pageDiv(caption, body) {
  return `<div class="page"><div class="caption">${esc(withoutTaughtMarks(caption))}</div>${body}</div>`;
}

function wrapDocument(pageDivs) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
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
}

// The card kits: each `card-set` item becomes its own run of pages (sets of
// heading and item cards with cut guides). No answers file goes with them: the
// key is in the slide notes for the same sort, where the teacher already reads
// it (Daniel, 1 October 2026). A kit whose spec cannot be printed faithfully is
// refused by name, like a moment that cannot draw.
function buildKits(cardSetItems, classSize, baseDir) {
  const kits = [];
  const dropped = [];
  for (const item of cardSetItems) {
    const kit = normaliseCardSet(item, classSize, baseDir);
    if (typeof kit === "string") {
      console.warn(`[stick-in] card kit "${item.label || "card-set"}": ${kit} - this kit is NOT in the pack.`);
      dropped.push(item.label || "card-set");
      continue;
    }
    kits.push(Object.assign(kit, { sourceItem: item }));
  }
  const pageDivs = [];
  const summaries = [];
  const laidOut = [];
  const perItem = [];
  for (const kit of kits) {
    const laid = (kit.form === "sheet" ? renderSheetPages : renderKitPages)(kit, {
      printableWMm: PRINTABLE_W_MM,
      printableHMm: PRINTABLE_H_MM,
      pageHtml: pageDiv,
    });
    if (laid.error) {
      console.warn(`[stick-in] card kit "${kit.label}": ${laid.error} - this kit is NOT in the pack.`);
      dropped.push(kit.label);
      continue;
    }
    laidOut.push(kit);
    pageDivs.push(...laid.pages);
    perItem.push({ item: kit.sourceItem, label: kit.label, pages: laid.pages, sheet: kit.form === "sheet" });
    const fit = kit.form === "sheet"
      ? `printed as a whole sheet, no cutting${laid.pictureMm ? `, pictures about ${laid.pictureMm} mm wide` : ""}`
      : laid.splitSet
      ? `each set runs over ${laid.pagesPerSet} pages`
      : `${laid.setsPerPage} set${laid.setsPerPage === 1 ? "" : "s"} a page`;
    summaries.push(
      `${kit.tag} ${kit.label}: ${kit.setCount} set${kit.setCount === 1 ? "" : "s"} of ` +
      `${kit.cards.length} cards under ${kit.headings.length} headings, ${fit}`
    );
  }
  return { kits: laidOut, pageDivs, summaries, dropped, perItem };
}

// The text sources: each `source-text` item becomes its own run of pages, the
// same copy repeated with cut guides, one each or one between two. It sits
// beside the kits rather than in the per-child tiling above because nobody
// writes on it: it is the thing a pair reads while they both write in their own
// books, so it is not part of any child's glued-in set.
function buildSourceTexts(sourceTextItems, classSize) {
  const pageDivs = [];
  const summaries = [];
  const dropped = [];
  const perItem = [];
  for (const item of sourceTextItems) {
    const source = normaliseSourceText(item, classSize);
    if (typeof source === "string") {
      console.warn(`[stick-in] text source "${item.label || "source-text"}": ${source} - this source is NOT in the pack.`);
      dropped.push(item.label || "source-text");
      continue;
    }
    const laid = renderSourceTextPages(source, {
      printableWMm: PRINTABLE_W_MM,
      printableHMm: PRINTABLE_H_MM,
      pageHtml: pageDiv,
    });
    if (laid.error) {
      console.warn(`[stick-in] text source "${source.label}": ${laid.error} - this source is NOT in the pack.`);
      dropped.push(source.label);
      continue;
    }
    pageDivs.push(...laid.pages);
    perItem.push({ item, label: source.label, pages: laid.pages });
    summaries.push(
      `${source.tag} ${source.label}: ${source.copies} cop${source.copies === 1 ? "y" : "ies"} ` +
      `(${source.per === "child" ? "one each" : "one between two"}), ${laid.perPage} a page`
    );
  }
  return { pageDivs, summaries, dropped, perItem };
}

async function build(specPath, outDir) {
  const spec = sanitizeHouseStyle(JSON.parse(fs.readFileSync(specPath, "utf8")));
  const sixSeven = sixSevenNumbers(spec);
  if (sixSeven.length) throw new Error(sixSevenMessage(sixSeven, "stick-in sheets"));
  const items = Array.isArray(spec.items) ? spec.items : [];
  const baseDir = path.dirname(specPath);

  if (items.length === 0) {
    console.log(`No write-on moments - Stick-in Sheets not written${spec.rationaleNote ? ` (${spec.rationaleNote})` : ""}.`);
    return null;
  }

  const classSize = Number.isFinite(spec.classSize) && spec.classSize > 0 ? spec.classSize : CLASS_SIZE;
  const cardSetItems = items.filter((item) => item && item.visual === "card-set");
  const sourceTextItems = items.filter((item) => item && item.visual === "source-text");
  const taskSheetItems = items.filter((item) => item && item.visual === "task-sheet");
  const pieceItems = items.filter((item) => item && !["card-set", "source-text", "task-sheet"].includes(item.visual));
  const { moments, dropped } = await renderMoments(pieceItems, baseDir);
  const kitsBuilt = buildKits(cardSetItems, classSize, baseDir);
  const sourcesBuilt = buildSourceTexts(sourceTextItems, classSize);
  const taskSheets = [];
  const sheetDropped = [];
  for (const item of taskSheetItems) {
    const sheet = normaliseTaskSheet(item);
    const laid = typeof sheet === "string" ? { error: sheet } : taskSheetPages(sheet, {
      printableWMm: PRINTABLE_W_MM, printableHMm: PRINTABLE_H_MM, classSize, pageHtml: pageDiv, baseDir,
    });
    if (laid.error) {
      console.warn(`[stick-in] task sheet "${item.label || "task-sheet"}": ${laid.error} - this sheet is NOT in the pack.`);
      sheetDropped.push(item.label || "task-sheet");
      continue;
    }
    taskSheets.push({ item, label: item.label || sheet.label, pages: laid.pages });
  }
  const allDropped = [...dropped, ...kitsBuilt.dropped, ...sourcesBuilt.dropped, ...sheetDropped];

  if (moments.length === 0 && kitsBuilt.kits.length === 0 && sourcesBuilt.pageDivs.length === 0 && taskSheets.length === 0) {
    console.error(
      `None of the ${items.length} moment${items.length === 1 ? "" : "s"} could be drawn, ` +
      `so no Stick-in Sheets file was written.`
    );
    console.error(`Missing: ${allDropped.join(", ")}. The [stick-in] lines above say why for each.`);
    process.exitCode = 1;
    return null;
  }

  // One print per piece, in the order the lesson meets them: each write-on
  // moment laid out for the whole class on its own pages, each text source,
  // each card kit or picture sheet.
  let pages = 0;
  let totalSlips = 0;
  const prints = [];
  for (const item of items) {
    const moment = moments.find((m) => m.item === item);
    if (moment && item.layout === "slips") {
      // Cut out and stuck in, when gluing it into the book is the task.
      const laid = buildHtml([moment], classSize);
      pages += laid.pages;
      totalSlips += laid.totalSlips;
      prints.push({ label: item.label || item.visual, pageDivs: laid.pageDivs });
      continue;
    }
    if (moment) {
      // A whole page under its task, one between two, two to a page when the
      // figure is small enough to keep its size.
      const plain = Object.assign({}, item);
      delete plain.tag;
      const laid = await figurePages(item, moment.piece,
        (widthMm) => renderPieceHtml(Object.assign({}, plain, { widthMm }), { baseDir }), {
          printableWMm: PRINTABLE_W_MM, printableHMm: PRINTABLE_H_MM, classSize, pageHtml: pageDiv,
        });
      pages += laid.pages.length;
      prints.push({ label: item.label || item.visual, pageDivs: laid.pages });
      continue;
    }
    const built = [...sourcesBuilt.perItem, ...kitsBuilt.perItem, ...taskSheets].find((p) => p.item === item);
    if (built) prints.push({ label: built.label, pageDivs: built.pages });
  }
  const lesson = spec.meta && spec.meta.lesson;

  // PDF through the worksheets' Chrome step; the HTML itself when that step
  // cannot run, flagged with the same PDF_SKIPPED signal the worksheets use so
  // the orchestrator treats both builders' fallbacks the same way.
  const outPaths = [];
  const taken = new Set();
  const folder = activitiesFolder(outDir, lesson);
  fs.mkdirSync(folder, { recursive: true });
  let htmlToPdf = null;
  let skipped = null;
  try {
    ({ htmlToPdf } = require("../worksheet-html/src/chrome"));
  } catch (err) {
    skipped = err;
  }
  for (const [index, print] of prints.entries()) {
    const html = wrapDocument(print.pageDivs);
    let outPath = null;
    if (!skipped) {
      try {
        const pdf = await htmlToPdf(html, { landscape: true });
        outPath = path.join(folder, pieceFilename(index + 1, print.label, "pdf", taken));
        fs.writeFileSync(outPath, pdf);
      } catch (err) {
        skipped = err;
      }
    }
    if (!outPath) {
      outPath = path.join(folder, pieceFilename(index + 1, print.label, "html", taken));
      fs.writeFileSync(outPath, html);
    }
    outPaths.push(outPath);
    console.log(`Built: ${outPath}`);
  }
  if (skipped) {
    console.log(`PDF_SKIPPED: ${skipped && skipped.message ? skipped.message.split("\n")[0] : skipped}`);
  }

  if (kitsBuilt.kits.length > 0) {
    console.log(`Kits: ${kitsBuilt.kits.length} (${kitsBuilt.summaries.join("; ")})`);
  }

  if (moments.length > 0) {
    console.log(`Moments: ${moments.length} (${moments.map((m) => m.item.label || m.item.visual).join(", ")})`);
  }

  if (sourcesBuilt.summaries.length > 0) {
    console.log(`Text sources: ${sourcesBuilt.summaries.length} (${sourcesBuilt.summaries.join("; ")})`);
  }

  const classSetLine = moments.length > 0
    ? `Class set: ${moments.length} moment${moments.length === 1 ? "" : "s"} × ${classSize} children = ` +
      `${totalSlips} slips, each moment in its own file, across ${pages} page${pages === 1 ? "" : "s"}`
    : `Class set: no write-on pieces; the pack is ${kitsBuilt.kits.length} card kit${kitsBuilt.kits.length === 1 ? "" : "s"} across ${kitsBuilt.pageDivs.length} page${kitsBuilt.pageDivs.length === 1 ? "" : "s"}`;

  if (allDropped.length) {
    console.log(`${classSetLine}.`);
    console.error(
      `\n${allDropped.length} of ${items.length} moments could not be drawn and ` +
      `${allDropped.length === 1 ? "is" : "are"} NOT in this pack: ${allDropped.join(", ")}.`
    );
    console.error(
      'The [stick-in] lines above say why for each. A missing moment leaves no gap on the ' +
      'page, so this pack looks complete and is not: it needs rebuilding once that is fixed.'
    );
    process.exitCode = 1;
  } else {
    const allSheets = moments.length === 0 && kitsBuilt.kits.length > 0 && kitsBuilt.kits.every((k) => k.form === "sheet");
    console.log(allSheets
      ? `${classSetLine} - print once and hand out; the sheets are not cut.`
      : `${classSetLine} - print each file you want, cut along the dashed lines.`);
  }
  console.log(`Files: ${outPaths.length}, one per printed piece, so each can be printed on its own.`);
  return outPaths;
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

module.exports = { build, buildHtml, renderMoments, buildKits, wrapDocument };
