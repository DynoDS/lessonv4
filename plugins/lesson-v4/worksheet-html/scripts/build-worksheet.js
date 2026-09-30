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
const { sixSevenNumbers, sixSevenMessage } = require("../../shared/text/no-six-seven");

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
  sheetCriteriaPanels,
  WorksheetError,
  SHEET_LABELS,
} = require("../src/worksheet");
const { resolveImages } = require("../src/images");
const { prepareWorksheetDecorations } = require("../src/decorations");
const { recordingProblems, recordingAdvisories, buildSlips } = require("../src/slips");
const {
  STAND_IN_TIERS,
  describeReturn,
  returnedProblems,
  withExpectedIn,
  withExpectedStandingIn,
} = require("../src/returned");

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

// A sheet leaves with its answers. The key is validated against the pupil
// sheets present, so a tier taken out for page fit whose answers stayed behind
// refuses the build on the next line with a spec fault that is not true.
function withoutSheet(worksheet, key) {
  const sheets = { ...worksheet.sheets };
  delete sheets[key];
  const answerKey = { ...(worksheet.answerKey || {}) };
  delete answerKey[key];
  return worksheet.answerKey
    ? { ...worksheet, sheets, answerKey }
    : { ...worksheet, sheets };
}

function readSpec(file) {
  let raw;
  let spec;
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
    spec = sanitizeHouseStyle(JSON.parse(raw));
  } catch (e) {
    throw new WorksheetError("SPEC_INVALID", `${file} is not valid JSON: ${e.message}`);
  }
  const sixSeven = sixSevenNumbers(spec);
  if (sixSeven.length) {
    throw new WorksheetError("NUMBER_CONTAINS_SIX_SEVEN", sixSevenMessage(sixSeven, "worksheet").replace(/^NUMBER_CONTAINS_SIX_SEVEN: /, ""));
  }
  return spec;
}

async function main() {
  // The flag is filtered out before the positional arguments are read, so a
  // hand build that passes only a spec, an output folder and a basename works
  // exactly as it always has.
  const args = process.argv.slice(2);
  const omitUnfittable = args.includes("--omit-unfittable");
  const [specPath, outArg, baseArg] = args.filter((a) => a !== "--omit-unfittable");

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

  // A sheet sent back to its author (the worksheets topic, 4.2.290). A Below or
  // Greater Depth sheet goes back to the adaptation designer to be redesigned,
  // and it never costs the other sheets or the answer key: if it still cannot
  // be made, those children get the Expected sheet in its place, flagged so
  // the teacher knows (his "yes", 25 September 2026). A returned sheet is out
  // of `sheets` (the designer never wrote it, or the focused repair took it out
  // whole), and while the spec records the return that tier holds the Expected
  // sheet and its key section the Expected answers. A sheet in `sheets` is
  // always built: one beside its own record is its redesign, and the record
  // is said to be left on. The class's own sheet is never built around
  // (`returned` naming a present Expected sheet is refused, and so is a return
  // with no Expected sheet to print in its place).
  const spec = readSpec(specPath);
  const returnedFaults = returnedProblems(spec);
  const back = withExpectedStandingIn(spec);
  for (const entry of back.noExpected) {
    returnedFaults.push(
      `returned sends the ${sheetLabel(entry.sheet)} sheet back, and there is no ` +
        `Expected sheet to print in its place: the Expected sheet goes back to the ` +
        `lesson designer and is rebuilt before the worksheets build.`
    );
  }
  if (returnedFaults.length) {
    for (const message of returnedFaults) fail("RETURNED_INVALID", message, "content", {});
    return;
  }
  for (const entry of back.leftOver) {
    const label = sheetLabel(entry.sheet);
    console.log(
      `RETURN_RECORD_LEFT: ${label} - the spec holds a ${label} sheet and a "returned" ` +
        `entry for it: the sheet is built, as its redesign. Take the entry and its ` +
        `WORKSHEET_CONTENT_GAP note off.`
    );
  }
  // Each tier the Expected sheet stands in for, with the line its key section
  // carries and why, named once the pack is built (below).
  const standIns = new Map(
    back.stoodIn.map((entry) => [
      entry.sheet,
      {
        keyLine:
          entry.problem === "picture"
            ? "whose picture never arrived"
            : "which could not be used as printed",
        why: `the ${sheetLabel(entry.sheet)} sheet could not be used as printed (${describeReturn(entry)})`,
      },
    ])
  );
  const keyLines = () => Object.fromEntries([...standIns].map(([key, s]) => [key, s.keyLine]));
  // A tier the Expected sheet stood in for, omitted because the page cannot
  // hold the Expected sheet either, is named for its own reason, never with
  // the Expected sheet's measurement as if it were the tier's own.
  const omission = (key, problem) => {
    const standIn = standIns.get(key);
    if (!standIn) return problem;
    const label = sheetLabel(key);
    const text = String(problem);
    const detail = text.startsWith(`${label} - `) ? text.slice(label.length + 3) : text;
    return (
      `${label} - ${standIn.why}, and the Expected sheet cannot stand in for it: ` +
      `the page cannot hold the Expected sheet either (${detail})`
    );
  };

  // The last resort (`--omit-unfittable`, passed only once a sheet's own repair
  // round is over). His answer (25 September 2026) was for a Below or Greater
  // Depth sheet sent back that still cannot be fixed: the Expected sheet in its
  // place, flagged. The lead passed it on for any such sheet the build cannot
  // make, for any reason: a page too small,
  // a picture it cannot have, a panel, an answer key that does not match it, or
  // any other fault the checks below refuse. So each such sheet is first put
  // through every check the build makes before drawing, on its own, and when
  // it would be refused while the Expected sheet passes them all, the Expected
  // sheet stands in for that tier. Nothing stands in for the Expected sheet: one
  // the page cannot hold is omitted below, as before, and then nothing stands
  // in for another tier, since a copy of it would not fit either; one with any
  // other fault still refuses the pack.
  let packSpec = back.worksheet;
  if (omitUnfittable && packSpec.sheets && packSpec.sheets.expected && !sheetFaults(packSpec, "expected", specDir).length) {
    for (const key of STAND_IN_TIERS) {
      if (!packSpec.sheets[key] || standIns.has(key)) continue;
      const faults = sheetFaults(packSpec, key, specDir);
      if (!faults.length) continue;
      const label = sheetLabel(key);
      const pageOnly = faults.every((fault) => fault.fit);
      const first = faults[0].text + (faults.length > 1 ? ` (and ${faults.length - 1} more)` : "");
      packSpec = withExpectedIn(packSpec, key);
      standIns.set(key, {
        keyLine: pageOnly ? "which the page could not hold" : "which could not be built",
        why: pageOnly
          ? `the page cannot hold the ${label} sheet (${first})`
          : `the ${label} sheet cannot be built (${first})`,
      });
    }
  }
  const optionalVisuals = prepareWorksheetDecorations(packSpec, specDir);
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
  //
  // One sheet that will not fit must not lose the pack. Maths 15 (22 September
  // 2026) delivered no worksheets at all: the Expected sheet was repaired until
  // it fit, the untouched Greater Depth sheet then failed here on its own, and
  // all three sheets and the answer key went with it. The teacher's standing
  // rule for the deck is the rule this needed (16 September 2026, "flag the
  // slides and deliver it"): one bad slide never withholds a deck, and one bad
  // sheet should never withhold a pack.
  //
  // Only the orchestrator's last-resort delivery path passes the flag, and only
  // a sheet the page cannot hold comes out. Every other refusal still stops the
  // build: a malformed zone, or a sheet that would quietly drop a line the
  // child needed, is the "looks finished" failure this engine exists to refuse,
  // and omitting such a sheet would hide the fault instead of saying it. The
  // last sheet standing is never omitted, because a pack with nothing in it is
  // not a partial delivery. A Below or Greater Depth sheet the build cannot make
  // already has the Expected sheet in its place (above) whenever the Expected
  // sheet passes every check, so what still comes out here is an Expected sheet
  // the page cannot hold, and then any copy of it.
  //
  // One sheet comes out per pass, because the shapes are chosen per sheet and
  // the next sheet's refusal is only visible once this one is gone.
  //
  // A criteria panel on any sheet is refused before any shape is chosen, so a
  // sheet is never omitted for the room a refused panel took, and the pack is
  // never refused over a panel only after a sheet has been dropped (success
  // criteria stay on the board; the teacher, 23 September 2026). A panel still
  // on a sheet at the last resort refuses the pack: the flag rescues a page too
  // small and nothing else.
  const panels = sheetCriteriaPanels(worksheet);
  if (panels.length) {
    for (const found of panels) {
      fail(
        "ZONE_SPEC_INVALID",
        `${found.label} - ${found.where}: CRITERIA_NOT_ON_SHEETS, a success-criteria (steps) panel. Success criteria stay on the board and are never printed on a worksheet; take the panel off the sheet.`,
        "composition",
        { sheet: found.sheet, zone: zoneNameIn(found.where) }
      );
    }
    return;
  }
  const omitted = [];
  for (;;) {
    try {
      const resolvedAuto = resolveAutoLayouts(worksheet);
      worksheet = resolvedAuto.worksheet;
      for (const choice of resolvedAuto.choices) {
        console.log(
          `AUTO_LAYOUT: ${choice.label} drawn in "${choice.layout}" ` +
            `(${choice.orientation}), ${choice.fillPct}% full.`
        );
      }
      break;
    } catch (e) {
      if (!(e instanceof WorksheetError)) throw e;
      const key = e.location && e.location.sheet;
      const others = Object.keys(worksheet.sheets || {}).filter((k) => k !== key);
      if (omitUnfittable && e.signal === "SHEET_DOES_NOT_FIT" && key && others.length) {
        const message = omission(key, e.message);
        worksheet = withoutSheet(worksheet, key);
        omitted.push(key);
        console.log(`SHEET_OMITTED: ${message}`);
        diagnostic("SHEET_OMITTED", "composition", e.location, message);
        continue;
      }
      fail(e.signal, e.message, "composition", e.location || {});
      return;
    }
  }

  // Books or sheet. The designer's preflight refuses a missing or unusable
  // choice; here, where refusing would cost the class its worksheets, an
  // unusable one is printed unmarked and said out loud instead. A sheet marked
  // books whose words look as if they need the printed page ("Circle...", "on
  // the line") was asked at preflight to look again; one that says it was
  // (`"recordingLookedAgain": true`) keeps "books", and one nobody answered is
  // printed as a sheet, because its slips might ask children to circle
  // something they do not have. Words about a box in the question's own
  // sentence are never flagged (one digit box does not make a write-on sheet,
  // the teacher's 19 September ruling).
  for (const problem of recordingProblems(worksheet)) {
    const label = sheetLabel(problem.sheet);
    worksheet = withRecording(worksheet, problem.sheet, undefined);
    console.log(
      `RECORDING_CHANGED: ${label} - ${problem.message} ` +
        "Printed with no mark and no question slips."
    );
    diagnostic("RECORDING_CHANGED", "content", { sheet: problem.sheet }, problem.message);
  }
  for (const advisory of recordingAdvisories(worksheet)) {
    const label = sheetLabel(advisory.sheet);
    const message =
      `sheets.${advisory.sheet} is marked "books", and ${advisory.found} look as if ` +
      `they need the printed page, and the sheet does not say it was looked at ` +
      `again ("recordingLookedAgain": true).`;
    worksheet = withRecording(worksheet, advisory.sheet, "sheet");
    console.log(
      `RECORDING_CHANGED: ${label} - ${message} ` +
        'Printed with the "sheet" mark and no question slips.'
    );
    diagnostic("RECORDING_CHANGED", "content", { sheet: advisory.sheet }, message);
  }

  // What each level costs in paper, said out loud. A worksheet where every
  // level is "sheet" is a class set of copies per level, and it used to build
  // in silence, so nobody reading the run could tell the choice from a default.
  for (const [key, sheet] of Object.entries(worksheet.sheets || {})) {
    if (!sheet || typeof sheet !== "object" || !sheet.recording) continue;
    const reason =
      typeof sheet.recordingReason === "string" ? sheet.recordingReason.trim() : "";
    const cost =
      sheet.recording === "books"
        ? "books, printed as question slips in place of the sheet."
        : "sheet, a copy per child.";
    console.log(`RECORDING: ${sheetLabel(key)} - ${cost} ${reason || "No reason given."}`);
  }

  // A sheet with an explicit layout does not fail above, because nothing chose
  // its shape; it fails the fit check below instead. Same rule, same flag: only
  // a sheet whose ONLY fault is that the page cannot hold it comes out, and
  // never the last one standing.
  if (omitUnfittable) {
    const onlyTooTight = checkWorksheet(worksheet).filter(
      (sheet) =>
        sheet.tooTight.length &&
        !sheet.badZones.length &&
        !sheet.wordBanks.length &&
        !sheet.unprinted.length &&
        !sheet.emptySets.length &&
        !sheet.pupilWording.length &&
        !sheet.labelIntent.length
    );
    for (const sheet of onlyTooTight) {
      const others = Object.keys(worksheet.sheets || {}).filter((k) => k !== sheet.key);
      if (!others.length) break;
      worksheet = withoutSheet(worksheet, sheet.key);
      omitted.push(sheet.key);
      for (const problem of sheet.tooTight) {
        const message = omission(sheet.key, `${sheet.label} - ${problem}`);
        console.log(`SHEET_OMITTED: ${message}`);
        diagnostic("SHEET_OMITTED", "composition", { sheet: sheet.key, page: sheet.page }, message);
      }
    }
  }

  // Said once, in the form the run report needs: what the teacher is getting,
  // what they are not, and that the key covers only what they are getting.
  if (omitted.length) {
    console.log(
      `SHEET_OMITTED_SUMMARY: delivered ${Object.keys(worksheet.sheets || {}).join(", ")}; ` +
        `omitted ${omitted.join(", ")} because the page cannot hold it` +
        (omitted.some((key) => standIns.has(key))
          ? " (for a tier the Expected sheet stood in for, the Expected sheet)"
          : "") +
        `. The answer key covers the delivered sheets only.`
    );
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
        ...sheet.labelIntent,
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

  let sheets = sheetsOf(worksheet);
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
  fs.writeFileSync(answersPath, renderAnswerKey(worksheet, answerKey, { stoodIn: keyLines() }), "utf8");
  console.log(`Built answers: ${answersPath}`);

  // Every sheet's HTML is written before any PDF is attempted, so a machine
  // that cannot print still ends this run holding the whole worksheet.
  const draw = (list) =>
    list.map((sheet) => {
      const html = renderSheet(sheet.spec);
      // A level is one page and one file, except for the approved two-page
      // exception, where page 2 must not overwrite page 1.
      const suffix = sheet.pageCount > 1 ? `-${sheet.key}-p${sheet.page}` : `-${sheet.key}`;
      const htmlPath = path.join(outDir, `${base}${suffix}.html`);
      fs.writeFileSync(htmlPath, html);
      return { sheet, html, htmlPath };
    });
  let rendered = draw(sheets);

  // The levels marked books print as a page of question slips each, in the
  // sheet's own place, so the file still reads Below, Expected, Greater Depth,
  // and the write-on sheet is left out: printing both spent the paper the mark
  // was there to save (Daniel, 29 September 2026). A level whose slips cannot
  // be made prints its sheet instead, so no level is ever left with nothing.
  // One level on the approved two-page exception has a write-on visual at its
  // heart and is never a books sheet, so it gets none.
  let slipSheets = sheets.filter((s) => s.spec.recording === "books" && s.pageCount === 1);
  const slipsPathFor = (sheet) => path.join(outDir, `${base}-slips-${sheet.key}.html`);
  const reportSlips = (sheet, result) => {
    if (result.skipped) {
      console.log(`SLIPS_SKIPPED: ${sheet.label} - no question slips, because ${result.skipped}. The sheet prints instead, unchanged.`);
      diagnostic("SLIPS_SKIPPED", "composition", { sheet: sheet.key }, result.skipped);
      return;
    }
    const across = result.cols === 2 ? "2 across" : "1 across";
    console.log(
      `SLIPS: ${sheet.label} - ${result.cols * result.rows} slips a page ` +
        `(${across}, ${result.rows} down), printed in place of the sheet.`
    );
  };

  const blocker = pdfBlocker();
  let fitVerified = false;
  if (blocker) {
    console.log(`PDF_SKIPPED: ${blocker}`);
    // The same swap as the PDF below: a level with slips hands over its slips'
    // HTML in the sheet's place, and its sheet's file is taken away so that
    // the teacher is not given both.
    const slipped = new Set();
    for (const sheet of slipSheets) {
      const result = await buildSlips({ sheetSpec: sheet.spec, title: base });
      if (!result.skipped) {
        fs.writeFileSync(slipsPathFor(sheet), result.html);
        slipped.add(sheet.key);
      }
      reportSlips(sheet, result);
    }
    for (const r of rendered) {
      if (slipped.has(r.sheet.key)) {
        fs.rmSync(r.htmlPath, { force: true });
        console.log(`Built HTML: ${slipsPathFor(r.sheet)}`);
      } else {
        console.log(`Built HTML: ${r.htmlPath}`);
      }
    }
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
    // Each page printed, with the level it belongs to, so a level's slips can
    // take its sheet's place when the file is put together.
    const pdfs = [];
    const slipPdfs = new Map();
    const clipped = [];
    const reshaped = [];
    const corrected = [];

    // One Chrome for the whole build. Every sheet, and every reshape retry,
    // prints through this one process: launching Chrome per page was the
    // slowest line in the build multiplied by up to a dozen, for identical
    // output.
    const browser = await launchBrowser();
    try {

    const settleAll = async () => {
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
      pdfs.push({ key: r.sheet.key, pdf: settled.pdf });
      for (const problem of settled.fitProblems) {
        clipped.push({ sheet: r.sheet, problem });
      }
    }
    };
    await settleAll();

    // The last resort in the browser: a Below or Greater Depth sheet it finds
    // clipped, when the Expected sheet printed clean, cannot be made either, so
    // the Expected sheet stands in for it. Those pages are drawn again, the
    // key is written again, and every sheet is measured again.
    const clippedKeys = [...new Set(clipped.map((c) => c.sheet.key))];
    if (
      omitUnfittable &&
      clippedKeys.length &&
      worksheet.sheets.expected &&
      clippedKeys.every((key) => STAND_IN_TIERS.includes(key) && !standIns.has(key))
    ) {
      for (const key of clippedKeys) {
        const details = clipped.filter((c) => c.sheet.key === key).map((c) => clipDetail(c.problem));
        worksheet = withExpectedIn(worksheet, key);
        standIns.set(key, {
          keyLine: "which the page could not hold",
          why: `the page cannot hold the ${sheetLabel(key)} sheet (${details.join(" ")})`,
        });
      }
      fs.writeFileSync(answersPath, renderAnswerKey(worksheet, answerKeyOf(worksheet), { stoodIn: keyLines() }), "utf8");
      sheets = sheetsOf(worksheet);
      rendered = draw(sheets);
      slipSheets = sheets.filter((s) => s.spec.recording === "books" && s.pageCount === 1);
      for (const list of [pdfs, clipped, reshaped, corrected]) list.length = 0;
      await settleAll();
    }

    // Slips only once every sheet has printed clean: a refused sheet refuses
    // the build below, and slips for it would be slips for nothing.
    if (!clipped.length) {
      for (const sheet of slipSheets) {
        const result = await buildSlips({ sheetSpec: sheet.spec, title: base, browser, htmlToPdf });
        if (!result.skipped) {
          fs.writeFileSync(slipsPathFor(sheet), result.html);
          slipPdfs.set(sheet.key, result.pdf);
        }
        reportSlips(sheet, result);
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
        const detail = clipDetail(problem);
        // A tier the Expected sheet stood in for is named as that: the page
        // clipped is the Expected sheet's, and the tier's own reason is said.
        const standIn = standIns.get(sheet.key);
        const whose = standIn ? ` (the Expected sheet, standing in because ${standIn.why})` : "";
        fail(
          "SHEET_DOES_NOT_FIT",
          `${sheet.label} page ${sheet.page} zone "${problem.zone}"${whose} - ${detail}.`,
          "composition",
          { sheet: sheet.key, page: sheet.page, zone: problem.zone }
        );
      }
      // A refused pack leaves no answer key behind. It was written before the
      // pages were drawn, and on its own it would be delivered as if the pack
      // were, naming a stand-in the class never got.
      fs.rmSync(answersPath, { force: true });
      return;
    }

    const combined = path.join(outDir, `${base}.pdf`);
    const printed = [];
    for (const { key, pdf } of pdfs) {
      if (!slipPdfs.has(key)) printed.push(pdf);
      else if (!printed.includes(slipPdfs.get(key))) printed.push(slipPdfs.get(key));
    }
    fs.writeFileSync(combined, await mergePdfs(printed));
    console.log(`Built: ${combined}`);
    fitVerified = true;
  }

  // Each tier the Expected sheet stands in for, named once the pack is built:
  // a flag for the teacher's report, never a fault for a repair round, so it
  // carries no BUILD_DIAGNOSTIC.
  for (const [key, standIn] of standIns) {
    if (!worksheet.sheets[key]) continue;
    const label = sheetLabel(key);
    console.log(
      `SHEET_STANDS_IN: ${label} - the Expected sheet stands in for ${label}, and the ` +
        `${label} section of the answer key is the Expected answers: ${standIn.why}.`
    );
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

// Every fault the build would refuse one sheet for, checked on its own and in
// the order the build checks them: its pictures, a criteria panel, its shape,
// its answer-key section, and what the page prints. `fit` marks a page too
// small; the browser's own measure comes later, when the pages are drawn.
function sheetFaults(worksheet, key, specDir) {
  const label = sheetLabel(key);
  const plain = (message) => {
    const text = String(message);
    return text.startsWith(`${label} - `) ? text.slice(label.length + 3) : text;
  };
  const one = { ...worksheet, sheets: { [key]: worksheet.sheets[key] } };
  if (worksheet.answerKey) {
    one.answerKey = worksheet.answerKey[key] === undefined ? {} : { [key]: worksheet.answerKey[key] };
  }
  try {
    const problems = [];
    let single = resolveImages(prepareWorksheetDecorations(one, specDir).worksheet, specDir, problems);
    const pictures = unresolvedImages(single, problems);
    if (pictures.length) return pictures.map((item) => ({ fit: false, text: `${item.signal}: ${item.message}` }));
    const panels = sheetCriteriaPanels(single);
    if (panels.length) return panels.map((found) => ({ fit: false, text: `CRITERIA_NOT_ON_SHEETS: ${found.where}` }));
    single = resolveAutoLayouts(single).worksheet;
    answerKeyOf(single);
    const faults = [];
    for (const sheet of checkWorksheet(single)) {
      for (const problem of sheet.tooTight) faults.push({ fit: true, text: plain(problem) });
      for (const problem of [
        ...sheet.badZones,
        ...sheet.wordBanks,
        ...sheet.unprinted,
        ...sheet.emptySets,
        ...sheet.pupilWording,
        ...sheet.labelIntent,
      ]) {
        faults.push({ fit: false, text: plain(problem) });
      }
    }
    return faults;
  } catch (e) {
    if (!(e instanceof WorksheetError)) throw e;
    return [{ fit: e.signal === "SHEET_DOES_NOT_FIT", text: `${e.signal}: ${plain(e.message)}` }];
  }
}

// What the browser found wrong with a drawn page, in words.
function clipDetail(problem) {
  return problem.kind === "zone-overflow"
    ? `rendered content overflows the zone (content ${problem.scrollHeight}px ` +
        `tall in ${problem.clientHeight}px, ${problem.scrollWidth}px wide in ` +
        `${problem.clientWidth}px)`
    : problem.kind === "child-outside-zone"
      ? "rendered content reaches outside the zone and is cut by its edge"
      : problem.kind === "child-spills-over-neighbour"
        ? `the box "${problem.box}" is drawing over what comes after it ` +
          `(content ${problem.scrollHeight}px tall in a ${problem.clientHeight}px box, ` +
          `${problem.scrollWidth}px wide in ${problem.clientWidth}px), so two ` +
          `blocks print on top of each other`
        : "a box inside the zone is cutting off its own content";
}

function sheetLabel(key) {
  return SHEET_LABELS[key] || key;
}

// The worksheet with one level's recording choice replaced, or removed when
// `recording` is undefined. The spec on disk is left as the designer wrote it.
function withRecording(worksheet, key, recording) {
  const { recording: _old, ...sheet } = worksheet.sheets[key];
  return {
    ...worksheet,
    sheets: {
      ...worksheet.sheets,
      [key]: recording === undefined ? sheet : { ...sheet, recording },
    },
  };
}

// The zone a problem line names, for the machine-readable location. The human
// message keeps the whole sentence either way.
function zoneNameIn(problem) {
  const m = /zone "([^"]+)"/.exec(String(problem)) || /\bzones\.([a-z])\b/.exec(String(problem));
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
