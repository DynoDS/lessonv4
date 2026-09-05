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
// ─── the three sheets are one lesson, so they print as one stack ─────────
//
// A teacher prints the file once and cuts it into piles. A portrait Below on
// top of a landscape Expected makes that an awkward stack, and children
// comparing sheets across a table read the difference before they read a word:
// these are not the same lesson. Three real sets went out mixed in one week.
//
// Advisory, not a refusal. A sheet whose own content genuinely wants the other
// way round - a wide sort, a timeline, a six-column table - is a real case, and
// which sheet that is cannot be decided from here.
//
// Read AFTER auto layouts resolve, because a set can disagree without ever
// saying so: two sheets written `"layout": "auto"` are handed their shapes
// separately, and one came out landscape and the other portrait.
function orientationOf(sheet) {
  if (!sheet || typeof sheet !== "object") return null;
  const pages = Array.isArray(sheet.pages) ? sheet.pages : [sheet];
  const stated = pages
    .map((page) => (page && page.orientation) || (page && page.layout ? "portrait" : null))
    .filter(Boolean);
  return stated.length ? stated[0] : null;
}

function settledSheets(worksheet) {
  try {
    // Lazy, and only here: worksheet.js requires this file's sibling checks,
    // and a top-level require either way round loads half a module.
    const { resolveAutoLayouts } = require("./worksheet");
    return resolveAutoLayouts(worksheet).worksheet.sheets || {};
  } catch (e) {
    // A worksheet too broken to resolve has a real fault waiting for it, and
    // an advisory is not the place to report it.
    return (worksheet && worksheet.sheets) || {};
  }
}

// The words a note has to contain to count as explaining a mixed set. Kept as
// a named constant so the check reads as one idea rather than a regex buried
// mid-function.
const ORIENTATION_WORDS = /(landscape|portrait|orientation)/i

function setShapeAdvisories(worksheet, advisories) {
  const sheets = settledSheets(worksheet);
  const byOrientation = new Map();
  for (const [name, sheet] of Object.entries(sheets)) {
    const orientation = orientationOf(sheet);
    if (!orientation) continue;
    if (!byOrientation.has(orientation)) byOrientation.set(orientation, []);
    byOrientation.get(orientation).push(name);
  }
  if (byOrientation.size < 2) return;

  const split = [...byOrientation.entries()]
    .map(([orientation, names]) => `${names.join(", ")} ${orientation}`)
    .join("; ");

  // A mixed set can be the right answer - a seven-row place-value chart beside
  // a speech scene genuinely needs the landscape page - and when it is, the one
  // person who has to live with it is told. So the advisory turns on whether
  // that has been done. Saying the same sentence to a designer who already
  // explained it trains the sentence to be ignored, and saying nothing to one
  // who has not lets a pack print mixed with nobody told: a focused repair
  // reshaped a Below sheet from portrait to landscape to buy four pixels and
  // left `notes` null, so the teacher met the split at the photocopier.
  const notes = Array.isArray(worksheet && worksheet.notes) ? worksheet.notes : [];
  const explained = notes.some(
    (note) => typeof note === "string" && ORIENTATION_WORDS.test(note)
  );
  if (explained) return;

  advisories.push(
    `this lesson's sheets do not share an orientation (${split}), and no ` +
      `top-level note says why. They print as one file and get cut into piles, ` +
      `so a mixed set stacks awkwardly and reads to a child as a different ` +
      `lesson. Carry Expected's shape across unless a sheet's own content needs ` +
      `the other way round - and when it does, add a note saying which sheet ` +
      `and why, because the teacher is the one who meets the split.`
  );
}

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
  setShapeAdvisories(worksheet, advisories);
  return advisories;
}

module.exports = { compositionAdvisories, SPRAWL_RUN };
