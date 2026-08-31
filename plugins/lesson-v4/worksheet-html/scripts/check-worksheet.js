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
  WorksheetError,
} = require("../src/worksheet");

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
// point at a photograph request that genuinely is not in the photo contract.
// Without this, a designer that omitted the Below sheet because its adaptation
// pictures "had not arrived" passed preflight, promotion then found no sheet
// referencing those pictures and sourced none, and the sheet became
// unrecoverable - the check said OK at the exact moment the loss was still
// repairable.
function checkDirectedSheets(worksheet, adaptationPath, photoReqPath) {
  let adaptation;
  try {
    adaptation = fs.readFileSync(path.resolve(adaptationPath), "utf8");
  } catch (error) {
    fail("ADAPTATION_UNREADABLE", `--adaptation ${adaptationPath}: ${error.message}`);
    return;
  }

  let contractIds = null;
  if (photoReqPath) {
    try {
      const contract = JSON.parse(fs.readFileSync(path.resolve(photoReqPath), "utf8"));
      contractIds = new Set(
        (Array.isArray(contract.photos) ? contract.photos : [])
          .map((p) => p && p.id)
          .filter((id) => typeof id === "string")
      );
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
    if (!adaptation.includes(directive.phrase)) continue;
    if (sheets[directive.sheetKey]) continue;

    const gapNote = notes.find((note) =>
      /WORKSHEET_CONTENT_GAP/i.test(note) &&
      note.toLowerCase().includes(directive.label.toLowerCase())
    );
    if (!gapNote) {
      fail(
        "SHEET_DIRECTED_MISSING",
        `adaptation.md says "${directive.phrase}" but the spec has no ` +
          `sheets.${directive.sheetKey} and no WORKSHEET_CONTENT_GAP note naming it.`
      );
      continue;
    }

    if (contractIds) {
      const namedIds = gapNote.match(/(?:adaptation-photo|photo)-\d+/g) || [];
      const allPresent =
        namedIds.length > 0 && namedIds.every((id) => contractIds.has(id));
      if (allPresent) {
        fail(
          "CONTENT_GAP_UNFOUNDED",
          `the ${directive.label} sheet was omitted over ${namedIds.join(", ")}, ` +
            `but every one of those refs IS in the photo contract. An approved ` +
            `request whose picture has not been published yet is the normal state ` +
            `at design time - adaptation pictures are sourced only after ` +
            `worksheet.json names them - so design the sheet to the promised ` +
            `filenames instead of omitting it.`
        );
      } else if (namedIds.length === 0) {
        fail(
          "CONTENT_GAP_UNFOUNDED",
          `the ${directive.label} sheet was omitted with a content-gap note that ` +
            `names no photo ref, so the claim cannot be checked against the ` +
            `contract. Name the missing ref, or design the sheet.`
        );
      } else {
        console.warn(
          `[directed-sheets] ${directive.label} sheet omitted over a ref genuinely ` +
            `absent from the photo contract - the gap stands and goes back to its owner.`
        );
      }
    } else {
      console.warn(
        `[directed-sheets] ${directive.label} sheet omitted with a content-gap note; ` +
          `no --photo-requirements supplied, so the claim was not verified.`
      );
    }
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
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--adaptation") { adaptationArg = argv[++i]; continue; }
    if (argv[i] === "--photo-requirements") { photoReqArg = argv[++i]; continue; }
    if (!fileArg) fileArg = argv[i];
  }
  if (!fileArg) {
    fail("SPEC_MISSING", "Usage: check-worksheet.js <worksheet.json> [--adaptation adaptation.md] [--photo-requirements contract.json]");
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

  checkExpectedSheet(worksheet);
  if (process.exitCode === 1) return;

  if (adaptationArg) {
    checkDirectedSheets(worksheet, adaptationArg, photoReqArg);
    if (process.exitCode === 1) return;
  }

  // Advisory only, never an exit code: composition is a judgement about a
  // printed page, and this makes sure the judgement happens while the spec is
  // still the designer's to change.
  for (const advisory of compositionAdvisories(worksheet)) {
    console.warn(`[composition] ${advisory}`);
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
    if (pendingPaths.size) {
      for (const entry of pending) {
        console.warn(
          `[pending-picture] "${entry.imagePath}" is an approved request that has ` +
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
    answerKeyOf(worksheet);
    const refused = checkWorksheet(worksheet);
    if (refused.length) {
      for (const sheet of refused) {
        for (const problem of sheet.badZones) {
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

  console.log("WORKSHEET_PREFLIGHT_OK");
}

main();
