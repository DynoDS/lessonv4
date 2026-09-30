#!/usr/bin/env node
"use strict";

// Final, write-nothing preflight for a designer's worksheet.json.
//
// Unlike suggest.js, this checks the exact chosen layouts after automatic
// numbering, year-group line sizing and answer-key coverage. It is the last
// gate before a builder is spawned and deliberately creates no HTML or PDF.

const fs = require("node:fs");
const path = require("node:path");
const { resolveImages } = require("../src/images");
const { prepareWorksheetDecorations } = require("../src/decorations");
const { compositionAdvisories } = require("../src/composition");
const {
  answerKeyOf,
  checkWorksheet,
  resolveAutoLayouts,
  sheetCriteriaPanels,
  withoutSheetCriteriaPanels,
  sheetsOf,
  WorksheetError,
} = require("../src/worksheet");
const { tightnessOf, describeTightness } = require("../src/tightness");
const { recordingProblems, recordingAdvisories, slipWidthProblems } = require("../src/slips");
const {
  LABELS,
  describeReturn,
  returnedEntry,
  returnedProblems,
} = require("../src/returned");

function fail(signal, message) {
  console.log(`${signal}: ${message}`);
  process.exitCode = 1;
}

// Every imagePath the spec names, with the file it resolves to.
function imagePathsIn(node, baseDir, found = []) {
  if (Array.isArray(node)) {
    for (const item of node) imagePathsIn(item, baseDir, found);
    return found;
  }
  if (!node || typeof node !== "object") return found;
  if (typeof node.imagePath === "string") {
    const resolved = path.isAbsolute(node.imagePath)
      ? node.imagePath
      : path.join(baseDir, node.imagePath);
    found.push({ imagePath: node.imagePath, resolved });
  }
  for (const value of Object.values(node)) imagePathsIn(value, baseDir, found);
  return found;
}

// An adaptation photograph is sourced only AFTER this spec names it - promotion
// reads the spec to decide which provisional entries are worth sourcing. So at
// preflight the correct state for such a picture is "approved, not yet on
// disk", and failing it here made a correctly-built Below sheet unable to pass
// its own gate: the sheet was omitted, promotion then found nothing to source,
// and the pictures never arrived. That is the sequencing trap that lost a Below
// sheet on 30 August 2026.
//
// So a missing file is only a fault when the spec invented the path. A path the
// photo contract lists is a promise the build will wait on, and the build still
// refuses to draw a picture that never arrives.
function pendingApprovedPictures(worksheet, specDir, photoReqPath) {
  const named = imagePathsIn(worksheet, specDir);
  const missing = named.filter((entry) => !fs.existsSync(entry.resolved));
  if (!missing.length) return { pending: [], unapproved: [] };

  let approved = new Set();
  if (photoReqPath) {
    try {
      const contract = JSON.parse(fs.readFileSync(path.resolve(photoReqPath), "utf8"));
      approved = new Set(
        (Array.isArray(contract.photos) ? contract.photos : [])
          .map((photo) => photo && photo.filename)
          .filter((name) => typeof name === "string")
          .map((name) => name.replace(/\\/g, "/"))
      );
    } catch {
      // An unreadable contract is reported by the caller's own check; here it
      // simply means nothing can be treated as approved.
    }
  }

  const isApproved = (entry) => {
    const asked = entry.imagePath.replace(/\\/g, "/");
    return [...approved].some(
      (name) => name === asked || name.endsWith(`/${asked}`) || asked.endsWith(`/${name}`)
    );
  };

  return {
    pending: missing.filter(isApproved),
    unapproved: missing.filter((entry) => !isApproved(entry)),
  };
}

// The sheets adaptation.md directs must be in the spec, or their omission must
// be a gap that can stand. Without this, a designer that omitted the Below sheet
// because its adaptation pictures "had not arrived" passed preflight, promotion
// then found no sheet referencing those pictures and sourced none, and the sheet
// became unrecoverable - the check said OK at the exact moment the loss was still
// repairable.
//
// A return is read from the spec's `returned` record (`src/returned.js`),
// never from the words of its note: which kind of problem sent a sheet back
// decides what this gate may check, and a note describing a teaching problem on
// a picture-led sheet mentions the photograph. (A word list here refused exactly
// those, and the designer's own return line for a picture that would never
// come; the first check of the worksheets release, 4.2.290, found both.)
//
// What stands, each going back to its owner through its note:
//   - a teaching problem: anything a child could not get past as printed (the
//     teacher's ruling on the worksheets list, 24 September 2026: such a sheet
//     goes back to be redesigned while the others are made), or a sheet that
//     contradicts the objective (rule 11; the lead's reading of that ruling,
//     which the teacher called fine);
//   - a picture problem whose named refs will never arrive: absent from the
//     photo contract, or every one's terminal receipt beside the spec reads
//     `unsatisfied` or `omitted`; and any picture problem under a picture stage
//     that was `unavailable`, when no approved picture will ever be published.
// What is refused is the shape this gate was built for, the 30 August loss: a
// sheet sent back while pictures it needs are approved and still coming. A
// picture problem over such a picture, or naming no ref while pictures may
// still come; and, whatever kind the entry names, a sheet whose own pictures
// (the adaptation's Photo refs for that tier, a field of exact ids) are
// approved and not yet published, since a sheet returned now is never promoted
// and its pictures are never sourced. That sheet can be built, so the refusal
// says how. An entry for a tier the adaptation does not direct is refused too:
// there is no sheet to send back, and the build would print a pile nobody
// asked for.
const NEVER_ARRIVES = new Set(["unsatisfied", "omitted"]);
// The picture stage's terminal states (`photo-contract.py`): a picture with one
// has arrived or never will.
const TERMINAL = new Set(["published", "unsatisfied", "omitted"]);

// The photo ids one tier's items name in the adaptation's `- Photo refs:` field
// (the adaptation designer's own format), under that tier's `## Below` or
// `## Greater Depth` heading.
function tierPhotoRefs(adaptation, label) {
  const refs = new Set();
  let inTier = false;
  for (const line of adaptation.split(/\r?\n/)) {
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading) {
      inTier = heading[1] === label;
      continue;
    }
    const field = inTier && /^\s*-\s*Photo refs:\s*(.*)$/i.exec(line);
    if (field) {
      for (const id of field[1].match(/\b(?:adaptation-)?photo-\d+\b/g) || []) refs.add(id);
    }
  }
  return [...refs];
}

// filename -> terminalState, from the receipts the picture stage writes beside
// the working folder's specs (the same reading working-wall-packet.py does).
function terminalStates(specDir) {
  const states = new Map();
  const folder = path.join(specDir, "orchestration-receipts", "picture-terminal");
  let names = [];
  try {
    names = fs.readdirSync(folder).filter((name) => name.endsWith(".json")).sort();
  } catch {
    return states;
  }
  for (const name of names) {
    try {
      const receipt = JSON.parse(fs.readFileSync(path.join(folder, name), "utf8"));
      if (typeof receipt.filename === "string" && typeof receipt.terminalState === "string") {
        states.set(receipt.filename.replace(/\\/g, "/"), receipt.terminalState);
      }
    } catch {
      // An unreadable receipt proves nothing, so it lets nothing stand.
    }
  }
  return states;
}

function stateOf(states, filename) {
  if (typeof filename !== "string") return null;
  const asked = filename.replace(/\\/g, "/");
  if (states.has(asked)) return states.get(asked);
  const base = path.posix.basename(asked);
  for (const [name, state] of states) {
    if (path.posix.basename(name) === base) return state;
  }
  return null;
}

function checkDirectedSheets(worksheet, adaptationPath, photoReqPath, options = {}) {
  const pictureStage = typeof options.pictureStage === "string" ? options.pictureStage : "";
  const stageUnavailable = /\bunavailable\b/i.test(pictureStage);
  const states = options.specDir ? terminalStates(options.specDir) : new Map();
  let adaptation;
  try {
    adaptation = fs.readFileSync(path.resolve(adaptationPath), "utf8");
  } catch (error) {
    fail("ADAPTATION_UNREADABLE", `--adaptation ${adaptationPath}: ${error.message}`);
    return;
  }

  let contractIds = null;
  const filenameOf = new Map();
  if (photoReqPath) {
    try {
      const contract = JSON.parse(fs.readFileSync(path.resolve(photoReqPath), "utf8"));
      const photos = Array.isArray(contract.photos) ? contract.photos : [];
      contractIds = new Set(
        photos
          .map((p) => p && p.id)
          .filter((id) => typeof id === "string")
      );
      for (const photo of photos) {
        if (photo && typeof photo.id === "string") filenameOf.set(photo.id, photo.filename);
      }
    } catch (error) {
      fail("PHOTO_REQUIREMENTS_UNREADABLE", `--photo-requirements ${photoReqPath}: ${error.message}`);
      return;
    }
  }

  const directives = [
    { phrase: "Generate separate Below adaptation", sheetKey: "below", label: "Below" },
    { phrase: "Generate separate Greater Depth adaptation", sheetKey: "greaterDepth", label: "Greater Depth" },
  ];
  const sheets = worksheet.sheets || {};
  const notes = (Array.isArray(worksheet.notes) ? worksheet.notes : []).map(String);

  for (const directive of directives) {
    if (adaptation.includes(directive.phrase) || !returnedEntry(worksheet, directive.sheetKey)) continue;
    fail(
      "RETURNED_INVALID",
      `"returned" sends the ${directive.label} sheet back, but the adaptation does not ` +
        `direct a separate ${directive.label} sheet (it uses the Expected sheet ` +
        `unchanged), so there is no sheet to send back. Take the entry and its ` +
        `WORKSHEET_CONTENT_GAP note off.`
    );
  }

  for (const directive of directives) {
    if (!adaptation.includes(directive.phrase)) continue;
    const entry = returnedEntry(worksheet, directive.sheetKey);
    if (sheets[directive.sheetKey] && !entry) continue;
    const label = directive.label;

    if (!entry) {
      fail(
        "SHEET_DIRECTED_MISSING",
        `adaptation.md says "${directive.phrase}" but the spec has no ` +
          `sheets.${directive.sheetKey}, and no "returned" entry says why. A sheet ` +
          `sent back to its owner carries a WORKSHEET_CONTENT_GAP note and a ` +
          `"returned" entry: { "sheet": "${directive.sheetKey}", "problem": ` +
          `"teaching" } for a problem a child could not get past as printed, or ` +
          `"problem": "picture" with its "refs" for a picture that will never arrive.`
      );
      continue;
    }
    // The note is what the run and the teacher read to know why it went back.
    const gapNote = notes.find((note) =>
      /WORKSHEET_CONTENT_GAP/i.test(note) &&
      note.toLowerCase().includes(label.toLowerCase())
    );
    if (!gapNote) {
      fail(
        "SHEET_DIRECTED_MISSING",
        `the ${label} sheet is returned, but no WORKSHEET_CONTENT_GAP note names ` +
          `it, so nobody downstream can read why it went back. Add the note beside ` +
          `its "returned" entry.`
      );
      continue;
    }

    if (entry.problem === "teaching") {
      const own = tierPhotoRefs(adaptation, label);
      const pending =
        stageUnavailable || !contractIds
          ? []
          : own.filter((id) => contractIds.has(id) && !TERMINAL.has(stateOf(states, filenameOf.get(id))));
      if (pending.length) {
        fail(
          "CONTENT_GAP_UNFOUNDED",
          `the ${label} sheet is returned while its own pictures (${pending.join(", ")}, ` +
            `its Photo refs in the adaptation) are approved and not yet published. ` +
            `That is the 30 August loss, whatever kind the entry names: a sheet ` +
            `returned now is never promoted, so its pictures are never sourced. Design ` +
            `it to their promised filenames. Anything on it a child could not get past ` +
            `once they arrive goes in its WORKSHEET_CONTENT_GAP note on the built ` +
            `sheet, which the run treats as a content gap.`
        );
        continue;
      }
      if (own.length && !contractIds && !stageUnavailable) {
        console.warn(
          `[directed-sheets] ${label} sheet returned for its teaching; its own ` +
            `pictures (${own.join(", ")}) were not checked, because no ` +
            `--photo-requirements was supplied.`
        );
      }
      console.warn(
        `[directed-sheets] ${label} sheet returned for ${describeReturn(entry)} - ` +
          `the gap stands and goes back to its owner.`
      );
      continue;
    }

    const refs = Array.isArray(entry.refs) ? entry.refs : [];
    if (stageUnavailable) {
      console.warn(
        `[directed-sheets] ${label} sheet returned over a picture the picture ` +
          `stage will never publish (it was unavailable) - the gap stands and goes ` +
          `back to its owner.`
      );
      continue;
    }
    if (!contractIds) {
      console.warn(
        `[directed-sheets] ${label} sheet returned over a picture; no ` +
          `--photo-requirements supplied, so whether it is still coming was not checked.`
      );
      continue;
    }
    if (!refs.length) {
      fail(
        "CONTENT_GAP_UNFOUNDED",
        `the ${label} sheet is returned over a picture, but its "returned" entry ` +
          `names no refs, so whether the picture is still coming cannot be checked. ` +
          `Put the refs the sheet names in "refs". A required visual the brief never ` +
          `requested at all has no ref: that is the brief's own gap, so return it as ` +
          `"problem": "teaching".`
      );
      continue;
    }
    const coming = refs.filter(
      (id) => contractIds.has(id) && !NEVER_ARRIVES.has(stateOf(states, filenameOf.get(id)))
    );
    if (coming.length) {
      fail(
        "CONTENT_GAP_UNFOUNDED",
        `the ${label} sheet is returned over ${coming.join(", ")}, which the photo ` +
          `contract approves and no terminal receipt says will never arrive. A ` +
          `picture not published yet is the normal state at design time - ` +
          `adaptation pictures are sourced only after worksheet.json names them - so ` +
          `this sheet can be built: design it to the promised filenames. Anything ` +
          `else a child could not get past goes in its WORKSHEET_CONTENT_GAP note on ` +
          `the built sheet, which the run treats as a content gap.`
      );
      continue;
    }
    console.warn(
      `[directed-sheets] ${label} sheet returned over ${refs.join(", ")}, which will ` +
        `never arrive (absent from the photo contract, or terminal) - the gap stands ` +
        `and goes back to its owner.`
    );
  }
}

// A 1x1 transparent PNG, inline. It stands in ONLY inside this preflight, so a
// pending picture does not stop the page being measured; nothing is written and
// the build still reads the real file.
const STAND_IN_HREF =
  "data:image/png;base64," +
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function standInForPending(node, pendingPaths) {
  if (!pendingPaths.size) return node;
  if (Array.isArray(node)) return node.map((item) => standInForPending(item, pendingPaths));
  if (!node || typeof node !== "object") return node;
  const out = {};
  for (const [key, value] of Object.entries(node)) {
    out[key] = standInForPending(value, pendingPaths);
  }
  if (typeof out.imagePath === "string" && pendingPaths.has(out.imagePath) && !out.imageHref) {
    delete out.imagePath;
    out.imageHref = STAND_IN_HREF;
    // A square is the shape a worksheet crop is requested at, and it is the
    // shape least likely to flatter a layout that a real picture would break.
    out.naturalWidth = 1000;
    out.naturalHeight = 1000;
  }
  return out;
}

// The class's own sheet cannot go missing quietly.
//
// `SHEET_DIRECTED_MISSING` covers Below and Greater Depth, because adaptation.md
// names them. Nothing covered Expected, and Expected is the sheet most of the
// class uses: a spec carrying only a Below sheet passed preflight, built, and
// produced a lesson pack whose main worksheet simply was not there, with the
// reason sitting in a `notes` entry that no later step reads.
//
// A page-plan gap is a real and correct thing for the designer to return - the
// content genuinely may not fit an A4 side - but it is a decision for the
// lesson designer, and returning it has to STOP the run rather than thin the
// pack. So the gap note is required (it carries the reasoning) and it is still
// a failure, which is what routes it back to the owner who can settle it.
function checkExpectedSheet(worksheet) {
  // Sent back on purpose (decision 5 of the worksheets topic, 4.2.290): the
  // advice below about a page that does not fit is not what this sheet needs.
  const back = returnedEntry(worksheet, "expected");
  if (back && !(worksheet.sheets && worksheet.sheets.expected)) {
    fail(
      "EXPECTED_SHEET_MISSING",
      `the Expected sheet is returned to the lesson designer (${describeReturn(back)}). ` +
        `The class's own sheet is never built around, so this fails on purpose: that ` +
        `is what sends it back. Report the return and stop; the sheet is rebuilt ` +
        `once the lesson designer has repaired it.`
    );
    return;
  }
  const designPath = worksheet && worksheet.meta && worksheet.meta.lessonDesignPath;
  if (!designPath) return;

  let design;
  try {
    design = JSON.parse(fs.readFileSync(path.resolve(designPath), "utf8"));
  } catch {
    console.warn(
      "[expected-sheet] lesson-design.json could not be read from " +
        `meta.lessonDesignPath, so the Expected sheet requirement was not checked.`
    );
    return;
  }

  const block = design && design.worksheet;
  if (!block || block.status !== "generated") return;
  if (block.resourceMode === "shared-frame" && worksheet.sheets && worksheet.sheets.expected) {
    return;
  }
  if (worksheet.sheets && worksheet.sheets.expected) return;

  const notes = (Array.isArray(worksheet.notes) ? worksheet.notes : []).map(String);
  const gapNote = notes.find(
    (note) => /PAGE_PLAN_GAP|WORKSHEET_CONTENT_GAP/i.test(note) && /expected/i.test(note)
  );

  fail(
    "EXPECTED_SHEET_MISSING",
    `lesson-design.json generates an Expected worksheet, but the spec has no ` +
      `sheets.expected. ` +
      (gapNote
        ? `The gap is stated - "${gapNote.slice(0, 160)}" - and it is the lesson ` +
          `designer's to settle: name a removal order in the worksheet block's ` +
          `fitPriority, or reduce the amount, then rebuild this sheet. The class ` +
          `sheet cannot be dropped on a note alone.`
        : `No PAGE_PLAN_GAP or WORKSHEET_CONTENT_GAP note names Expected either, ` +
          `so nothing records why the class's own sheet is absent.`)
  );
}

function main() {
  const argv = process.argv.slice(2);
  let fileArg = null;
  let adaptationArg = null;
  let photoReqArg = null;
  let pictureStageArg = null;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--adaptation") { adaptationArg = argv[++i]; continue; }
    if (argv[i] === "--photo-requirements") { photoReqArg = argv[++i]; continue; }
    if (argv[i] === "--picture-stage") { pictureStageArg = argv[++i]; continue; }
    if (!fileArg) fileArg = argv[i];
  }
  if (!fileArg) {
    fail("SPEC_MISSING", "Usage: check-worksheet.js <worksheet.json> [--adaptation adaptation.md] [--photo-requirements contract.json] [--picture-stage \"PICTURE_STAGE: ...\"]");
    return;
  }

  const file = path.resolve(fileArg);
  let worksheet;
  try {
    worksheet = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail("SPEC_INVALID", `${file} is not valid worksheet JSON: ${error.message}`);
    return;
  }

  // The record of sheets sent back is checked before anything reads it.
  const returnedFaults = returnedProblems(worksheet);
  for (const message of returnedFaults) fail("RETURNED_INVALID", message);
  if (returnedFaults.length) return;

  checkExpectedSheet(worksheet);
  if (process.exitCode === 1) return;

  if (adaptationArg) {
    checkDirectedSheets(worksheet, adaptationArg, photoReqArg, {
      pictureStage: pictureStageArg,
      specDir: path.dirname(file),
    });
    if (process.exitCode === 1) return;
  }

  // A sheet sent back is out of `sheets`, and a sheet in `sheets` is always
  // checked and built. One beside its own "returned" entry is a redesign with
  // the record left on (the second check of the worksheets release, 4.2.290,
  // found a redesigned sheet hidden that way), so it is measured like any
  // other and the record must come off.
  for (const tier of ["below", "greaterDepth"]) {
    const entry = returnedEntry(worksheet, tier);
    if (!entry || !(worksheet.sheets && worksheet.sheets[tier])) continue;
    fail(
      "RETURNED_INVALID",
      `the spec holds the ${LABELS[tier]} sheet and a "returned" entry for it ` +
        `(${describeReturn(entry)}). A sheet sent back is taken out of "sheets"; ` +
        `if this is its redesign, take the entry and its WORKSHEET_CONTENT_GAP note ` +
        `off. The sheet is checked below either way.`
    );
  }

  // Books or sheet, on every sheet. Reported alongside everything below rather
  // than stopping the check, because it is one field to set and the designer
  // should hear about the page's other faults in the same run.
  for (const problem of recordingProblems(worksheet, { required: true })) {
    fail(problem.signal, problem.message);
  }
  // Words that look as if they need the printed page are a prompt to look
  // again, never a refusal; words about a box in the question's own sentence
  // are not flagged at all (the teacher's 19 September 2026 ruling: one digit
  // box does not make a write-on sheet).
  for (const advisory of recordingAdvisories(worksheet)) {
    console.warn(`[recording] ${advisory.signal}: ${advisory.message}`);
  }

  try {
    // Inside the try, so a photograph the spec names but the disk lacks exits
    // as a named IMAGE_MISSING like the build's, not a raw stack trace.
    const specDir = path.dirname(file);
    const optionalVisuals = prepareWorksheetDecorations(worksheet, specDir);
    for (const warning of optionalVisuals.warnings) {
      console.warn(`[decoration] ${warning}`);
    }

    // A picture the contract approved but the pipeline has not published yet
    // stands in at its promised shape, so the rest of the spec can still be
    // measured. An invented path is left to fail through resolveImages below.
    const { pending } = pendingApprovedPictures(
      optionalVisuals.worksheet,
      specDir,
      photoReqArg
    );
    const pendingPaths = new Set(pending.map((entry) => entry.imagePath));
    const stageUnavailable = /\bunavailable\b/i.test(pictureStageArg || "");
    if (pendingPaths.size) {
      for (const entry of pending) {
        console.warn(
          stageUnavailable
            ? `[pending-picture] "${entry.imagePath}" is an approved request, but ` +
                `the picture stage was unavailable, so it will never be published. ` +
                `Re-point the question at a picture this run has published or a ` +
                `drawing the engine makes, never at words; if neither can carry it, ` +
                `return the sheet to its owner with its WORKSHEET_CONTENT_GAP note and ` +
                `its "returned" entry (the worksheet designer's step 1).`
            : `[pending-picture] "${entry.imagePath}" is an approved request that has ` +
                `not been published yet. That is the normal state at design time, ` +
                `because promotion reads this spec to decide which pictures to source. ` +
                `The build waits for the real file.`
        );
      }
    }

    // Collected, not thrown, so a spec naming several pictures it cannot have
    // hears about all of them at once. Reporting the first alone cost a run its
    // worksheets: each repair round removed one and uncovered the next.
    const imageProblems = [];
    worksheet = resolveImages(
      standInForPending(optionalVisuals.worksheet, pendingPaths),
      specDir,
      imageProblems
    );
    if (imageProblems.length) {
      for (const problem of imageProblems) {
        console.log(`${problem.signal}: ${problem.message}`);
      }
      process.exitCode = 1;
      return;
    }

    // Every criteria panel, on every sheet, is named before any shape is
    // chosen, and each page is then measured without the panels that can come
    // off: priced as content, a panel would ask for a real question to be cut
    // to make room for it, and a sheet laid out by the engine that fails would
    // stop this check before a named sheet's panel was ever mentioned.
    const panelsFound = sheetCriteriaPanels(worksheet);
    const withoutTheirPanels = withoutSheetCriteriaPanels(worksheet);
    const stillOn = new Set(sheetCriteriaPanels(withoutTheirPanels).map((found) => found.sheet));
    for (const found of panelsFound) {
      fail(
        "ZONE_SPEC_INVALID",
        `${found.label} - ${found.where}: CRITERIA_NOT_ON_SHEETS, a success-criteria (steps) panel. Success criteria stay on the board and are never printed on a worksheet; take the panel off the sheet. ` +
          (stillOn.has(found.sheet)
            ? "Any page measured below is measured without the panels that can come off; one held on its own in a slot is still measured."
            : "Any page measured below is measured without it.")
      );
    }
    worksheet = withoutTheirPanels;

    // A sheet that said `"layout": "auto"` gets its shape here, the same way
    // and at the same point the build gives it one, so this gate checks the
    // exact page the build will draw.
    const resolvedAuto = resolveAutoLayouts(worksheet);
    worksheet = resolvedAuto.worksheet;
    for (const choice of resolvedAuto.choices) {
      console.log(
        `AUTO_LAYOUT: ${choice.label} -> "${choice.layout}" ` +
          `(${choice.orientation}), ${choice.fillPct}% full.`
      );
    }

    // Advisory only, never an exit code: composition is a judgement about a
    // printed page, and this makes sure the judgement happens while the spec
    // is still the designer's to change. After auto resolution, so an
    // advisory names the zone a designer can actually find on the page.
    for (const advisory of compositionAdvisories(worksheet)) {
      console.warn(`[composition] ${advisory}`);
    }

    // How the height was actually spent, sheet by sheet, for the same reason
    // the content faults above are repeated here: it was printed only by the
    // BUILD, which runs after the designer has finished. A Below sheet ended
    // "It helps the body..." with a three-centimetre dotted stub and 36mm of
    // empty paper under it; the build said so in exactly these words, and by
    // then nobody was left to move the room to the child (5 September 2026).
    // Advisory, never an exit code, because whether a blank is waste or the
    // design is a judgement about a printed page and this report cannot tell
    // those apart - which is why it has to reach the person who can.
    for (const sheet of sheetsOf(worksheet)) {
      const description = describeTightness(tightnessOf(sheet.spec));
      if (!description.trim()) continue;
      console.warn(`[room] ${sheet.label}`);
      for (const line of description.split("\n")) console.warn(`[room]   ${line}`);
    }

    // A books sheet prints as slips half a page wide, and something wider
    // cannot go on one. Refused here, while the sheet is still the designer's,
    // because what the sheet should be is the designer's call and never the
    // engine's: holding a wide picture does not make a sheet "sheet" (Daniel,
    // 29 September 2026). Left unanswered, the build prints the sheet instead.
    for (const problem of slipWidthProblems(sheetsOf(worksheet))) {
      fail(problem.signal, problem.message);
    }

    answerKeyOf(worksheet);
    const refused = checkWorksheet(worksheet);
    if (refused.length) {
      for (const sheet of refused) {
        for (const problem of sheet.badZones) {
          // Every panel was named above, before any shape was chosen.
          if (panelsFound.length && /CRITERIA_NOT_ON_SHEETS/.test(problem)) continue;
          fail("ZONE_SPEC_INVALID", `${sheet.label} - ${problem}`);
        }
        for (const problem of sheet.tooTight) {
          fail("SHEET_DOES_NOT_FIT", `${sheet.label} - ${problem}`);
        }
        // Content faults, which this preflight used to pass over in silence.
        // A designer whose sheet is called clean here and refused by the build
        // does the whole round trip again to learn something that was already
        // known, so every fault the build refuses is reported here too. Both
        // carry their own signal at the front of the message.
        for (const problem of [
          ...sheet.wordBanks,
          ...sheet.unprinted,
          ...sheet.emptySets,
          ...sheet.pupilWording,
          ...sheet.labelIntent,
        ]) {
          const named = /^([A-Z_]+):\s*([\s\S]*)$/.exec(problem);
          fail(
            named ? named[1] : "CONTENT_INVALID",
            `${sheet.label} - ${named ? named[2] : problem}`
          );
        }
      }
      return;
    }
  } catch (error) {
    if (error instanceof WorksheetError) {
      fail(error.signal, error.message);
      return;
    }
    // The image resolver names its own signal in the message (IMAGE_MISSING:,
    // IMAGE_UNREADABLE:), so pass that through as the build would.
    if (error && /^[A-Z_]+:/.test(String(error.message))) {
      console.log(String(error.message));
      process.exitCode = 1;
      return;
    }
    throw error;
  }

  if (process.exitCode === 1) return;
  console.log("WORKSHEET_PREFLIGHT_OK");
}

main();
