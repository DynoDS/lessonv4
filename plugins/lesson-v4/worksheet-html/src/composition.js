"use strict";

// Does this sheet read as one composed page, or as a hand-off transcribed
// field by field?
//
// The fit checks cannot see this: a stack of three near-identical instruction
// lines measures, fits and renders without a single refusal, and still hands a
// child a page where the one instruction that matters is buried among its own
// restatements. That page came from transcription - the design's pupilAction,
// pupilPrompt and support each arriving as its own printed line - and it is
// the commonest way a legal page reads as machine output.
//
// Like tightness.js, this REPORTS and never refuses. Whether a run of
// instructions is sprawl or three genuinely different directions is a
// designer's judgement about a printed page; the advisory exists so the
// judgement is made looking at the page, not skipped.

// Two consecutive instructions can be legitimate (a reference's job line next
// to a task direction). Three in a row almost never are.
const SPRAWL_RUN = 3;

function isInstruction(item) {
  return Boolean(item) && typeof item === "object" && item.helper === "instruction";
}

function firstWords(item) {
  const text = String((item && item.text) || "").trim();
  const words = text.split(/\s+/).slice(0, 5).join(" ");
  return text.length > words.length ? `${words}...` : words;
}

function scanStack(stack, where, advisories) {
  let run = [];
  const flush = () => {
    if (run.length >= SPRAWL_RUN) {
      const quoted = run.map((item) => `"${firstWords(item)}"`).join(", ");
      advisories.push(
        `${where}: ${run.length} instruction helpers in a row (${quoted}). ` +
          `A child acts on one instruction per task; fold restatements into ` +
          `the strongest line and keep only directions that change what the ` +
          `child does.`
      );
    }
    run = [];
  };
  for (const item of stack) {
    if (isInstruction(item)) run.push(item);
    else flush();
  }
  flush();
}

function walk(node, where, advisories) {
  if (Array.isArray(node)) {
    for (const child of node) walk(child, where, advisories);
    return;
  }
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node.stack)) scanStack(node.stack, where, advisories);
  for (const value of Object.values(node)) walk(value, where, advisories);
}

// Returns human-readable advisory strings, one per finding; [] when the spec
// raises none. Never throws on a malformed spec - the real validators own
// shape errors, and an advisory pass that crashed would block the check that
// matters.
function compositionAdvisories(worksheet) {
  const advisories = [];
  const sheets = (worksheet && worksheet.sheets) || {};
  for (const [name, sheet] of Object.entries(sheets)) {
    if (!sheet || typeof sheet !== "object") continue;
    const pages = Array.isArray(sheet.pages) ? sheet.pages : [sheet];
    pages.forEach((page, index) => {
      const zones = (page && page.zones) || {};
      for (const [zoneName, zone] of Object.entries(zones)) {
        const pageBit = pages.length > 1 ? ` page ${index + 1}` : "";
        walk(zone, `${name}${pageBit} zone "${zoneName}"`, advisories);
      }
    });
  }
  return advisories;
}

module.exports = { compositionAdvisories, SPRAWL_RUN };
