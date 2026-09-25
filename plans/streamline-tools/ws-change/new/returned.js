"use strict";

// Sheets sent back to their author, recorded as a field.
//
// The worksheets topic's decision 5 (4.2.290), in the teacher's words: a sheet a
// child could not use "should probably go back to be redesigned", while the
// other sheets are made. Which kind of problem sent a sheet back decides what
// the preflight may check about it, and the words of a note are no way to tell:
// a teaching problem on a picture-led sheet mentions the photograph, "photocopy"
// holds "photo", and the designer's own return line for a missing picture says
// "approved request". So each return is recorded in the spec's top-level
// `returned`, beside the `WORKSHEET_CONTENT_GAP` note the run and the teacher
// read:
//
//   { "sheet": "below", "problem": "teaching" }
//   { "sheet": "greaterDepth", "problem": "picture", "refs": ["adaptation-photo-002"] }
//
// "teaching": a problem a child could not get past as printed, or a sheet that
// contradicts the objective (rule 11).
// "picture": a picture the sheet needs will never arrive, named by its refs.
//
// A returned sheet is out of `sheets`: the designer never wrote it, or the
// focused repair took it out whole. It goes back to the adaptation designer to
// be redesigned, and if it still cannot be made, those children get the
// Expected sheet in its place, flagged so the teacher knows (his "yes", 25
// September 2026, in the worksheets ledger). So while the spec records the
// return, the build prints the Expected sheet in that tier's place, with the
// Expected answers as its key section; the redesign replaces it when it goes in
// and the record comes off. A sheet in `sheets` is always built: one beside its
// own record is its redesign with the record left on. The Expected sheet is
// never built around: it goes back to the lesson designer and is rebuilt before
// the worksheets build.

const RETURNABLE_SHEETS = ["below", "expected", "greaterDepth"];
const PROBLEMS = ["teaching", "picture"];
const STAND_IN_TIERS = ["below", "greaterDepth"];
const LABELS = { below: "Below", expected: "Expected", greaterDepth: "Greater Depth" };

// Every fault in the field, as sentences. An absent field is no fault.
function returnedProblems(worksheet) {
  const list = worksheet && worksheet.returned;
  if (list === undefined) return [];
  if (!Array.isArray(list)) {
    return ['"returned" must be a list of { "sheet", "problem", "refs" } entries.'];
  }
  const problems = [];
  const seen = new Set();
  list.forEach((entry, i) => {
    const at = `returned[${i}]`;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      problems.push(`${at} must be an object with "sheet" and "problem".`);
      return;
    }
    if (!RETURNABLE_SHEETS.includes(entry.sheet)) {
      problems.push(`${at}.sheet must be "below", "expected" or "greaterDepth" (got ${JSON.stringify(entry.sheet)}).`);
    } else if (seen.has(entry.sheet)) {
      problems.push(`${at}: the ${LABELS[entry.sheet]} sheet is returned twice.`);
    } else {
      seen.add(entry.sheet);
    }
    if (!PROBLEMS.includes(entry.problem)) {
      problems.push(
        `${at}.problem must be "teaching" (a problem a child could not get past as printed, ` +
          `or a sheet that contradicts the objective) or "picture" (a picture the sheet ` +
          `needs will never arrive) (got ${JSON.stringify(entry.problem)}).`
      );
    }
    if (
      entry.refs !== undefined &&
      !(Array.isArray(entry.refs) && entry.refs.every((ref) => typeof ref === "string" && ref.trim()))
    ) {
      problems.push(`${at}.refs must be a list of photo refs.`);
    }
  });
  if (
    list.some((entry) => entry && entry.sheet === "expected") &&
    worksheet.sheets &&
    worksheet.sheets.expected
  ) {
    problems.push(
      "returned names the Expected sheet, which is still in the spec. The class's " +
        "own sheet is never built around: it goes back to the lesson designer and is " +
        "rebuilt before the worksheets build."
    );
  }
  return problems;
}

function returnedEntry(worksheet, sheet) {
  const list = worksheet && Array.isArray(worksheet.returned) ? worksheet.returned : [];
  return list.find((entry) => entry && entry.sheet === sheet) || null;
}

// What the problem is, in words for a log line.
function describeReturn(entry) {
  if (entry.problem === "picture") {
    const refs = Array.isArray(entry.refs) && entry.refs.length ? `: ${entry.refs.join(", ")}` : "";
    return `a picture it needs will never arrive${refs}`;
  }
  return "a problem a child could not get past as printed, or a sheet that contradicts the objective";
}

// The worksheet the build prints. Every returned Below or Greater Depth tier
// whose sheet is out of `sheets` holds the Expected sheet, and its key section
// is the Expected answers (`stoodIn`). With no Expected sheet to print in its
// place, `noExpected` names those entries and the build refuses: the class's own
// sheet goes back to the lesson designer and is rebuilt first. An entry beside a
// sheet still in `sheets` changes nothing (`leftOver`): that sheet is built.
function withExpectedStandingIn(worksheet) {
  const sheets = (worksheet && worksheet.sheets) || {};
  const returned = STAND_IN_TIERS.map((sheet) => returnedEntry(worksheet, sheet)).filter(Boolean);
  const leftOver = returned.filter((entry) => sheets[entry.sheet]);
  const absent = returned.filter((entry) => !sheets[entry.sheet]);
  if (!absent.length) return { worksheet, stoodIn: [], noExpected: [], leftOver };
  if (!sheets.expected) return { worksheet, stoodIn: [], noExpected: absent, leftOver };
  let out = worksheet;
  for (const entry of absent) out = withExpectedIn(out, entry.sheet);
  return { worksheet: out, stoodIn: absent, noExpected: [], leftOver };
}

// The worksheet with the Expected sheet in one Below or Greater Depth tier's
// place, and the Expected answers as that tier's key section. The build also
// uses it at its last resort, for a Below or Greater Depth sheet it cannot make
// for any other reason: that sheet cannot be made either, so the same answer
// holds (the lead, passing on his answer, 25 September 2026).
function withExpectedIn(worksheet, tier) {
  const sheets = { ...worksheet.sheets, [tier]: worksheet.sheets.expected };
  const out = { ...worksheet, sheets };
  if (worksheet.answerKey) {
    const answerKey = { ...worksheet.answerKey };
    if (answerKey.expected) answerKey[tier] = answerKey.expected;
    else delete answerKey[tier];
    out.answerKey = answerKey;
  }
  return out;
}

module.exports = {
  RETURNABLE_SHEETS,
  PROBLEMS,
  STAND_IN_TIERS,
  LABELS,
  returnedProblems,
  returnedEntry,
  describeReturn,
  withExpectedStandingIn,
  withExpectedIn,
};
