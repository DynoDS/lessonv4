#!/usr/bin/env node
"use strict";

//   node scripts/build-worksheet.js <worksheet.json> [OUTPUT_DIR] [BASENAME]
//
// The command shape and the signals it prints are stable on purpose. The
// worksheet-builder agent reads stdout for `Built:`, `Sheets:`, `Page fit:`
// and a named failure.
//
// This engine asks whether the content fits BEFORE drawing anything, so a
// sheet that does not fit is refused with a reason rather than printed short.
// Nothing is ever silently dropped to make a page work.
//
// A machine that cannot make a PDF still builds the worksheet. The overnight
// runs happen in a cloud box with no browser, and the decision on record is
// that the HTML file IS the worksheet there: this script writes every sheet's
// HTML first, then adds the PDF only where a browser and the PDF packages
// exist. When they do not, it says so with `PDF_SKIPPED:` and lists the HTML
// files as the build - loudly, because on a machine that COULD make a PDF the
// same line means something needs installing, not shipping.

const fs = require("node:fs");
const path = require("node:path");
const { safeFilenameComponent } = require("../../shared/text/filename");
const { sanitizeHouseStyle } = require("../../shared/text/house-style");

const { renderSheet } = require("../src/render");

// Whether a printed page actually fits is settled in src/settle-fit.js: the
// browser's own measurements are fed back into the zones that ran short, then a
// roomier shape is tried, and only then is a sheet refused.
const { settleSheetFit } = require("../src/settle-fit");
const { tightnessOf, describeTightness } = require("../src/tightness");
const {
  sheetsOf,
  checkWorksheet,
  answerKeyOf,
  renderAnswerKey,
  resolveAutoLayouts,
  WorksheetError,
} = require("../src/worksheet");
const { resolveImages } = require("../src/images");
const { prepareWorksheetDecorations } = require("../src/decorations");

// The same fault, twice: once for a person and once for a machine.
//
// The human line is what it always was and stays first, because it is what the
// builder agent quotes and what a designer reads. The BUILD_DIAGNOSTIC line
// beside it carries the SAME diagnosis with the location broken out, so the
// orchestration can route a fault to its owner without parsing English.
//
// It adds facts. It does not decide anything: who owns a fault, and what should
// change because of it, stays with the existing repair ownership.
function diagnostic(signal, faultClass, location, message) {
  const payload = {
    signal,
    artifact: "worksheet",
    faultClass,
    location: Object.fromEntries(
      Object.entries(location || {}).filter(([, v]) => v !== undefined && v !== null)
    ),
    message: String(message).replace(/\s+/g, " ").trim(),
  };
  console.log(`BUILD_DIAGNOSTIC: ${JSON.stringify(payload)}`);
}

function fail(signal, message, faultClass, location) {
  console.log(`${signal}: ${message}`);
  if (faultClass) diagnostic(signal, faultClass, location, message);
  process.exitCode = 1;
}

function readSpec(file) {
  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch (e) {
    throw new WorksheetError("SPEC_UNREADABLE", `Cannot read ${file}: ${e.message}`);
  }
  try {
    // The same house-style pass every other builder runs on parse: the deck,
    // wall and stick-in builds each sanitize their spec here, and this engine
    // was the one gap — em dashes authored into a worksheet reached print
    // while the same words on a slide were caught.
    return sanitizeHouseStyle(JSON.parse(raw));
  } catch (e) {
    throw new WorksheetError("SPEC_INVALID", `${file} is not valid JSON: ${e.message}`);
  }
}

async function main() {
  const [, , specPath, outArg, baseArg] = process.argv;

  if (!specPath) {
    fail("SPEC_MISSING", "Usage: build-worksheet.js <worksheet.json> [OUTPUT_DIR] [BASENAME]");
    return;
  }

  // Photographs are read off disk and carried INSIDE each sheet before the
  // engine ever sees the spec, which is what makes the finished file
  // self-contained: it survives being moved, copied or emailed.
  //
  // This step was missing, and it failed in the worst possible way. The sheet
  // still built, still reported "Nothing is cramped", and still said "Built" -
  // and printed empty frames where the photographs should have been. A page
  // that looks finished and is wrong is the exact failure this engine exists to
  // refuse, so it is now checked below rather than merely done.
  //
  // Paths are resolved against the SPEC's folder, because that is where the
  // pipeline saves what image-scout fetched.
  const specDir = path.dirname(path.resolve(specPath));
  const optionalVisuals = prepareWorksheetDecorations(readSpec(specPath), specDir);
  for (const warning of optionalVisuals.warnings) {
    console.warn(`[decoration] ${warning}`);
  }
  // Collected rather than thrown, so one failure names every picture the spec
  // asks for and cannot have. A repair round can then clear them together.
  const imageProblems = [];
  let worksheet = resolveImages(optionalVisuals.worksheet, specDir, imageProblems);
  const outDir = outArg || path.dirname(path.resolve(specPath));
  fs.mkdirSync(outDir, { recursive: true });

  const unresolved = unresolvedImages(worksheet, imageProblems);
  if (unresolved.length) {
    for (const item of unresolved) {
      fail(item.signal, item.message, "technical", item.location);
    }
    return;
  }

  // A sheet that said `"layout": "auto"` gets its shape here, after pictures
  // are real (a photograph has no height until its file is read) and before
  // anything measures or numbers the sheet. Said out loud per sheet: the
  // shape was the engine's choice, and the designer reading the log is
  // entitled to know which one it made.
  try {
    const resolvedAuto = resolveAutoLayouts(worksheet);
    worksheet = resolvedAuto.worksheet;
    for (const choice of resolvedAuto.choices) {
      console.log(
        `AUTO_LAYOUT: ${choice.label} drawn in "${choice.layout}" ` +
          `(${choice.orientation}), ${choice.fillPct}% full.`
      );
    }
  } catch (e) {
    if (e instanceof WorksheetError) {
      fail(e.signal, e.message, "composition", e.location || {});
      return;
    }
    throw e;
  }

  // Answers are a different audience. Validate complete coverage before pupil
  // pages are written, and keep the resulting teacher text out of `sheets`
  // entirely so it cannot be appended to a pupil print job.
  const answerKey = answerKeyOf(worksheet);

  // Fit first, every sheet, before a single page is drawn. A part-built
  // worksheet is worse than none: it looks finished.
  const refused = checkWorksheet(worksheet);
  if (refused.length) {
    for (const sheet of refused) {
      const where = { sheet: sheet.key, page: sheet.page };
      for (const problem of sheet.badZones) {
        fail(
          "ZONE_SPEC_INVALID",
          `${sheet.label} - ${problem}`,
          "composition",
          { ...where, zone: zoneNameIn(problem) }
        );
      }
      for (const problem of sheet.tooTight) {
        fail(
          "SHEET_DOES_NOT_FIT",
          `${sheet.label} - ${problem}`,
          "composition",
          { ...where, zone: zoneNameIn(problem) }
        );
      }
      // A word bank that is not a word bank: typed into a prompt, or referred
      // to and absent. Content rather than composition - the words themselves
      // are the fault, and the page would print perfectly well.
      for (const problem of sheet.wordBanks) {
        const named = /^([A-Z_]+):\s*([\s\S]*)$/.exec(problem);
        fail(
          named ? named[1] : "WORD_BANK_INLINE",
          `${sheet.label} - ${named ? named[2] : problem}`,
          "content",
          { ...where, zone: zoneNameIn(problem) }
        );
      }
      // Words the designer wrote that the page does not print. Content, not
      // composition: the page fits and looks finished, and a line the child
      // needed is simply absent.
      for (const problem of [
        ...sheet.unprinted,
        ...sheet.emptySets,
        ...sheet.pupilWording,
      ]) {
        const named = /^([A-Z_]+):\s*([\s\S]*)$/.exec(problem);
        fail(
          named ? named[1] : "TEXT_NOT_PRINTED",
          `${sheet.label} - ${named ? named[2] : problem}`,
          "content",
          { ...where, zone: zoneNameIn(problem) }
        );
      }
    }
    return;
  }

  const sheets = sheetsOf(worksheet);
  // The pipeline names the file a teacher opens ("Fractions - Worksheets"),
  // because that convention belongs to the pipeline and not to the engine. Left
  // unnamed, the spec's own name is used, so running this by hand still works.
  const base = safeFilenameComponent(
    baseArg || (worksheet.meta && worksheet.meta.name) || "worksheet",
    "worksheet"
  );

  // The pipeline normally passes "Topic - Worksheets" as the pupil filename.
  // Strip that audience suffix before adding the teacher one, so the pair reads
  // "Topic - Worksheets.pdf" and "Topic - Answers.txt".
  const answerBase = base.replace(/\s*-\s*Worksheets$/i, "") || base;
  const answersPath = path.join(outDir, `${answerBase} - Answers.txt`);
  fs.writeFileSync(answersPath, renderAnswerKey(worksheet, answerKey), "utf8");
  console.log(`Built answers: ${answersPath}`);

  // Every sheet's HTML is written before any PDF is attempted, so a machine
  // that cannot print still ends this run holding the whole worksheet.
  const rendered = [];
  for (const sheet of sheets) {
    const html = renderSheet(sheet.spec);
    // A level is one page and one file, except for the approved two-page
    // exception, where page 2 must not overwrite page 1.
    const suffix = sheet.pageCount > 1 ? `-${sheet.key}-p${sheet.page}` : `-${sheet.key}`;
    const htmlPath = path.join(outDir, `${base}${suffix}.html`);
    fs.writeFileSync(htmlPath, html);
    rendered.push({ sheet, html, htmlPath });
  }

  const blocker = pdfBlocker();
  let fitVerified = false;
  if (blocker) {
    console.log(`PDF_SKIPPED: ${blocker}`);
    for (const r of rendered) console.log(`Built HTML: ${r.htmlPath}`);
    // The HTML is still the worksheet on a browserless box, and it is still
    // unverified. Those are two different facts and both get said: claiming a
    // verified fit here would be claiming a measurement nobody took.
    console.log(
      "PAGE_FIT_UNVERIFIED: browser rendering was unavailable, so no page was " +
        "measured as it will actually print. The HTML above is partial, " +
        "unverified output."
    );
    diagnostic(
      "PAGE_FIT_UNVERIFIED",
      "technical",
      {},
      "Browser rendering unavailable; rendered page fit was not measured."
    );
  } else {
    const { htmlToPdf, launchBrowser } = require("../src/chrome");
    const pdfs = [];
    const clipped = [];
    const reshaped = [];
    const corrected = [];

    // One Chrome for the whole build. Every sheet, and every reshape retry,
    // prints through this one process: launching Chrome per page was the
    // slowest line in the build multiplied by up to a dozen, for identical
    // output.
    const browser = await launchBrowser();
    try {

    for (const r of rendered) {
      // The browser's verdict, and what was done about it, come back from one
      // place: the zones that ran a hair short are grown by exactly what the
      // browser measured, then a roomier arrangement of the same page is
      // tried, then the sheet is refused. The content and its words are the
      // same in every case; only the record of which route it took differs.
      const settled = await settleSheetFit({
        spec: r.sheet.spec,
        html: r.html,
        htmlToPdf,
        browser,
      });
      if (settled.html !== r.html) fs.writeFileSync(r.htmlPath, settled.html);
      if (settled.correction) corrected.push({ sheet: r.sheet, zones: settled.correction });
      if (settled.reshape) reshaped.push({ sheet: r.sheet, ...settled.reshape });
      pdfs.push(settled.pdf);
      for (const problem of settled.fitProblems) {
        clipped.push({ sheet: r.sheet, problem });
      }
    }

    } finally {
      await browser.close();
    }

    // Said out loud, every time, like the reshapes below: the page kept its
    // shape and its content, but a zone was drawn taller than the arithmetic
    // asked, and the record should say so.
    for (const fix of corrected) {
      const grown = Object.entries(fix.zones)
        .map(([zone, mm]) => `"${zone}" +${mm.toFixed(1)}mm`)
        .join(", ");
      console.log(
        `ZONE_CORRECTED: ${fix.sheet.label} page ${fix.sheet.page} - the browser ` +
          `measured content a hair taller than the estimate, so its zone was ` +
          `given the difference from the page's spare room (${grown}). Same ` +
          `content, same shape, verified clean.`
      );
      diagnostic(
        "ZONE_CORRECTED",
        "composition",
        { sheet: fix.sheet.key, page: fix.sheet.page },
        `Zones grown to the browser's own measurement: ${grown}.`
      );
    }

    // Said out loud, every time. A page that was rearranged to print is still a
    // different page from the one the designer composed, and the teacher who
    // opens it is entitled to know which sheet moved and why.
    for (const move of reshaped) {
      console.log(
        `PAGE_RESHAPED: ${move.sheet.label} page ${move.sheet.page} was drawn in ` +
          `"${move.to}" instead of "${move.from}" (${move.fillPct}% full) because the ` +
          "browser found the composed arrangement clipped by a hair. Same content, " +
          "same order, roomier shape."
      );
      diagnostic(
        "PAGE_RESHAPED",
        "composition",
        { sheet: move.sheet.key, page: move.sheet.page },
        `Reshaped from ${move.from} to ${move.to} after rendered clipping.`
      );
    }

    // Real clipping, found in the real page. Nothing is trimmed, shrunk, moved
    // to a second page or dropped to make it go away: the sheet is refused and
    // the designer decides what changes.
    if (clipped.length) {
      for (const { sheet, problem } of clipped) {
        const detail =
          problem.kind === "zone-overflow"
            ? `rendered content overflows the zone (content ${problem.scrollHeight}px ` +
              `tall in ${problem.clientHeight}px, ${problem.scrollWidth}px wide in ` +
              `${problem.clientWidth}px)`
            : problem.kind === "child-outside-zone"
              ? "rendered content reaches outside the zone and is cut by its edge"
              : "a box inside the zone is cutting off its own content";
        fail(
          "SHEET_DOES_NOT_FIT",
          `${sheet.label} page ${sheet.page} zone "${problem.zone}" - ${detail}.`,
          "composition",
          { sheet: sheet.key, page: sheet.page, zone: problem.zone }
        );
      }
      return;
    }

    const combined = path.join(outDir, `${base}.pdf`);
    fs.writeFileSync(combined, await mergePdfs(pdfs));
    console.log(`Built: ${combined}`);
    fitVerified = true;
  }

  console.log(
    `Sheets: ${[...new Set(sheets.map((s) => s.label))].join(", ")}`
  );

  // Anything the designer set aside, could not render, or wants the teacher to
  // know. Printed because the builder agent reads stdout and nothing else: a
  // flag written into the spec and never printed reaches nobody, which is what
  // was happening. Every reference file tells the designer to flag things here,
  // so this is the other end of that instruction.
  for (const note of worksheet.notes || []) {
    console.log(`Note: ${String(note).replace(/\s+/g, " ").trim()}`);
  }

  // Only sayable once a browser has drawn every page and nothing clipped.
  // This line used to print off the arithmetic alone, which meant a tick beside
  // a page that had never been rendered - and the one thing it must never do is
  // claim a fit that was not measured.
  if (fitVerified) {
    console.log(`Page fit: ✓ ${pageFitSummary(sheets)}`);
  }

  for (const sheet of sheets) {
    const page = sheet.pageCount > 1 ? ` page ${sheet.page}` : "";
    console.log(`\n${sheet.label}${page}${sheet.code ? ` (${sheet.code})` : ""}`);
    console.log(
      describeTightness(tightnessOf(sheet.spec))
        .split("\n")
        .map((l) => `  ${l}`)
        .join("\n")
    );
  }
}

// The zone a problem line names, for the machine-readable location. The human
// message keeps the whole sentence either way.
function zoneNameIn(problem) {
  const m = /zone "([^"]+)"/.exec(String(problem));
  return m ? m[1] : undefined;
}

// "Below: 1 page, Expected: 2 pages". A level occupying two pages did so
// through the approved write-on-visual exception, so the count is reported
// rather than assumed.
function pageFitSummary(sheets) {
  const byKey = new Map();
  for (const sheet of sheets) {
    byKey.set(sheet.key, { label: sheet.label, count: sheet.pageCount });
  }
  return [...byKey.values()]
    .map(({ label, count }) => `${label}: ${count} page${count === 1 ? "" : "s"}`)
    .join(", ");
}

// Why this machine cannot make a PDF, or null when it can. The two causes get
// different words because they need different hands: missing packages are fixed
// here with one install, while a missing browser is the machine itself (the
// cloud box has none, by design) and the HTML files are the deliverable.
function pdfBlocker() {
  // Chrome first: on the browserless cloud box the HTML files simply ARE the
  // worksheet, and nobody should be told to install packages that would then
  // sit unused.
  try {
    require("../src/chrome").findChrome();
  } catch {
    return (
      'no Chrome or Chromium on this machine. Run "node scripts/ensure-chrome.js" ' +
      "in worksheet-html to fetch a headless one (about 100MB, needs the " +
      "network), then build again. The HTML files below are the worksheet " +
      "meanwhile: open each in Chrome and print at 100% scale, margins None."
    );
  }
  try {
    require.resolve("puppeteer-core");
    require.resolve("pdf-lib");
  } catch {
    return (
      'the PDF packages are not installed here. Run "node scripts/ensure-chrome.js" ' +
      "in worksheet-html to set this machine up, then build again. The HTML " +
      "files below are the whole worksheet meanwhile."
    );
  }
  return null;
}

// Every picture a spec asks for, that is still not a picture.
//
// A helper handed an unresolved path draws an empty frame and says nothing, so
// this is the difference between a build that refuses and a teacher handing out
// a sheet with a hole in it. Named by sheet and zone, like every other fault,
// and ALL of them: a spec missing three pictures is three faults in one report,
// not one fault three builds running.
//
// `problems` carries what the resolver already learned about each path - the
// file was absent, the format is unknown, the size unreadable - so the signal
// stays exact instead of collapsing to IMAGE_MISSING for all three.
function unresolvedImages(worksheet, problems) {
  const reason = new Map((problems || []).map((p) => [p.imagePath, p]));
  const found = [];
  const seen = new Set();

  const walk = (node, sheet, zone) => {
    if (Array.isArray(node)) return node.forEach((n) => walk(n, sheet, zone));
    if (!node || typeof node !== "object") return;
    if (typeof node.imagePath === "string" && !node.imageHref) {
      const key = [sheet, zone, node.imagePath].join(" | ");
      if (!seen.has(key)) {
        seen.add(key);
        const detail = reason.get(node.imagePath);
        found.push({
          signal: detail ? detail.signal : "IMAGE_MISSING",
          message:
            `${sheet} zone "${zone}": ` +
            (detail
              ? detail.message
              : `"${node.imagePath}" could not be read.`),
          location: { sheet, zone, imagePath: node.imagePath },
        });
      }
    }
    for (const value of Object.values(node)) walk(value, sheet, zone);
  };

  const located = new Set();
  for (const [key, sheet] of Object.entries(worksheet.sheets || {})) {
    for (const [id, content] of Object.entries((sheet && sheet.zones) || {})) {
      walk(content, key, id);
    }
  }
  for (const item of found) located.add(item.location.imagePath);

  // A picture the resolver refused that sits outside any sheet zone - a cover,
  // a header, a spec shape this walk does not know - is still a picture that
  // cannot be drawn. Reported without a location rather than not reported: the
  // throwing path never let one of these through, and neither does this one.
  for (const problem of problems || []) {
    if (located.has(problem.imagePath)) continue;
    located.add(problem.imagePath);
    found.push({
      signal: problem.signal,
      message: problem.message,
      location: { imagePath: problem.imagePath },
    });
  }
  return found;
}

// Three sheets, one file, and the sheets may not share an orientation: a
// landscape sort beside a portrait set of questions is a normal lesson. Pages
// are merged rather than the HTML stitched together for exactly that reason -
// a single print job cannot hold two page sizes, but a single PDF can.
async function mergePdfs(pdfs) {
  if (pdfs.length === 1) return pdfs[0];

  const { PDFDocument } = require("pdf-lib");
  const out = await PDFDocument.create();
  for (const bytes of pdfs) {
    const doc = await PDFDocument.load(bytes);
    const pages = await out.copyPages(doc, doc.getPageIndices());
    for (const page of pages) out.addPage(page);
  }
  return Buffer.from(await out.save());
}

main().catch((e) => {
  if (e instanceof WorksheetError) {
    fail(e.signal, e.message);
    return;
  }
  // The engine's own named refusals are spec problems rather than crashes, and
  // they already read as English. Passed through as the signal they are, so the
  // builder agent can report them and the designer knows what to fix.
  const named = /^([A-Z_]{3,}):\s*([\s\S]*)$/.exec(e.message || "");
  if (named) {
    fail(named[1], named[2]);
    return;
  }
  console.error(e);
  process.exitCode = 1;
});
