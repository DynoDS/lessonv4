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
const {
  answerKeyOf,
  checkWorksheet,
  WorksheetError,
} = require("../src/worksheet");

function fail(signal, message) {
  console.log(`${signal}: ${message}`);
  process.exitCode = 1;
}

function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    fail("SPEC_MISSING", "Usage: check-worksheet.js <worksheet.json>");
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

  try {
    // Inside the try, so a photograph the spec names but the disk lacks exits
    // as a named IMAGE_MISSING like the build's, not a raw stack trace.
    const specDir = path.dirname(file);
    const optionalVisuals = prepareWorksheetDecorations(worksheet, specDir);
    for (const warning of optionalVisuals.warnings) {
      console.warn(`[decoration] ${warning}`);
    }
    worksheet = resolveImages(optionalVisuals.worksheet, specDir);
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
