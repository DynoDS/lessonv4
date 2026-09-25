"""The worksheets release (4.2.290), step 8d: the first check's repairs to the
engine, run after w7, w7b and w7c.

1. A return is read from a field, never from a note's words (the first check's
   findings 1 and 2; the plan's rule "Match nothing by free text when a field
   will do"). w7 decided by picture words in the note, so a teaching problem
   that mentioned a photograph ("photocopy" too) was refused, and the
   designer's own return line for a picture that will never come ("... has no
   approved request") was refused even under an unavailable picture stage.
   Now the spec's top-level `returned` records each return
   (`src/returned.js`), and the preflight refuses only the one shape it was
   built for: a picture problem over a picture still coming (or naming no ref
   while pictures may come). A returned Expected sheet gets a message that fits
   a content gap.
2. A Below or Greater Depth picture that never arrives after design (finding 3,
   the lead passing on his answer: "a Below or Greater Depth sheet's problem
   goes back to its author, the adaptation designer ... never let it cost the
   other sheets or the answer key"). The focused repair takes that sheet out
   whole, with its key section, and records the return; the build never
   prints it: while the spec records the return, the Expected sheet
   stands in for that tier, with the Expected answers as its key section, and
   the build names the tier and why (`SHEET_STANDS_IN`, w7e). His answer of 25
   September ("yes": if the sheet still cannot be made, those children get the
   Expected sheet in its place, flagged so he knows). After the second check: a
   returned sheet is out of `sheets` (the repair takes it out whole, and the
   scope check allows exactly that); a sheet in `sheets` is always checked and
   built, and an entry beside one is refused at the preflight and said to be
   left on at the build; an entry for a tier the adaptation does not direct is
   refused; and a teaching return is refused while the sheet's own pictures
   (the adaptation's Photo refs for that tier) are approved and not yet
   published, the 30 August loss. `returned` is a record, not child content.
3. His digit-box ruling wins by what the sheet holds, not by the reason
   repeating the engine's words (finding 7): words about a box or a gap are not
   flagged when the box is in the question's own sentence (`4,_50`) or when the
   sheet's only helpers are sentences and number sentences. The other
   page-only words are answered by a field, `"recordingLookedAgain": true`,
   never by matching the reason's words.
4. The two generated references can be checked against their generators
   (`--check`), so stale numbers cannot come back unseen (finding 10).
"""
from pathlib import Path

from _patch import ROOT, read, replace_once, write

HERE = Path(__file__).resolve().parent
CHECK = "worksheet-html/scripts/check-worksheet.js"
SLIPS = "worksheet-html/src/slips.js"
BUILD = "worksheet-html/scripts/build-worksheet.js"
CATALOGUE_JS = "worksheet-html/scripts/build-catalogue.js"
LAYOUTS_JS = "worksheet-html/scripts/build-layouts-doc.js"
SCOPE = "scripts/check-repair-scope.py"


def replace_between(rel: str, start: str, end: str, must_hold: str, new: str) -> None:
    """Replace the text from `start` up to (not including) `end`, each asserted
    once, after asserting the region is the version w7 wrote."""
    text = read(rel)
    crlf = "\r\n" in text
    if crlf:
        start, end, must_hold, new = (s.replace("\n", "\r\n") for s in (start, end, must_hold, new))
    assert text.count(start) == 1 and text.count(end) == 1, (rel, text.count(start), text.count(end))
    a, b = text.index(start), text.index(end)
    assert a < b and must_hold in text[a:b], (rel, "region is not w7's")
    write(rel, text[:a] + new + text[b:])


# ─── 1. the shared record ────────────────────────────────────────────────
(ROOT / "worksheet-html" / "src" / "returned.js").write_bytes((HERE / "new" / "returned.js").read_bytes())

# ─── 1. the preflight reads the record ───────────────────────────────────
replace_once(
    CHECK,
    'const { recordingProblems, recordingAdvisories } = require("../src/slips");\n',
    'const { recordingProblems, recordingAdvisories } = require("../src/slips");\n'
    "const {\n"
    "  LABELS,\n"
    "  describeReturn,\n"
    "  returnedEntry,\n"
    "  returnedProblems,\n"
    '} = require("../src/returned");\n',
)

GATE = r'''// A return is read from the spec's `returned` record (`src/returned.js`),
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

'''
replace_between(
    CHECK,
    "// Three omissions stand, each going back to its owner through the note:\n",
    "// A 1x1 transparent PNG, inline.",
    "const PICTURE_CLAIM",
    GATE,
)
# The header comment above the gate says the omission must be a gap that can
# stand; it stays. The earlier sentence about pictures that "had not arrived"
# is the reason the gate exists and stays with it.

replace_once(
    CHECK,
    "function checkExpectedSheet(worksheet) {\n"
    "  const designPath = worksheet && worksheet.meta && worksheet.meta.lessonDesignPath;\n"
    "  if (!designPath) return;\n",
    "function checkExpectedSheet(worksheet) {\n"
    "  // Sent back on purpose (decision 5 of the worksheets topic, 4.2.290): the\n"
    "  // advice below about a page that does not fit is not what this sheet needs.\n"
    "  const back = returnedEntry(worksheet, \"expected\");\n"
    "  if (back && !(worksheet.sheets && worksheet.sheets.expected)) {\n"
    "    fail(\n"
    "      \"EXPECTED_SHEET_MISSING\",\n"
    "      `the Expected sheet is returned to the lesson designer (${describeReturn(back)}). ` +\n"
    "        `The class's own sheet is never built around, so this fails on purpose: that ` +\n"
    "        `is what sends it back. Report the return and stop; the sheet is rebuilt ` +\n"
    "        `once the lesson designer has repaired it.`\n"
    "    );\n"
    "    return;\n"
    "  }\n"
    "  const designPath = worksheet && worksheet.meta && worksheet.meta.lessonDesignPath;\n"
    "  if (!designPath) return;\n",
)

replace_once(
    CHECK,
    "  checkExpectedSheet(worksheet);\n"
    "  if (process.exitCode === 1) return;\n",
    "  // The record of sheets sent back is checked before anything reads it.\n"
    "  const returnedFaults = returnedProblems(worksheet);\n"
    "  for (const message of returnedFaults) fail(\"RETURNED_INVALID\", message);\n"
    "  if (returnedFaults.length) return;\n"
    "\n"
    "  checkExpectedSheet(worksheet);\n"
    "  if (process.exitCode === 1) return;\n",
)

replace_once(
    CHECK,
    "  // Books or sheet, on every sheet. Reported alongside everything below rather\n",
    "  // A sheet sent back is out of `sheets`, and a sheet in `sheets` is always\n"
    "  // checked and built. One beside its own \"returned\" entry is a redesign with\n"
    "  // the record left on (the second check of the worksheets release, 4.2.290,\n"
    "  // found a redesigned sheet hidden that way), so it is measured like any\n"
    "  // other and the record must come off.\n"
    "  for (const tier of [\"below\", \"greaterDepth\"]) {\n"
    "    const entry = returnedEntry(worksheet, tier);\n"
    "    if (!entry || !(worksheet.sheets && worksheet.sheets[tier])) continue;\n"
    "    fail(\n"
    "      \"RETURNED_INVALID\",\n"
    "      `the spec holds the ${LABELS[tier]} sheet and a \"returned\" entry for it ` +\n"
    "        `(${describeReturn(entry)}). A sheet sent back is taken out of \"sheets\"; ` +\n"
    "        `if this is its redesign, take the entry and its WORKSHEET_CONTENT_GAP note ` +\n"
    "        `off. The sheet is checked below either way.`\n"
    "    );\n"
    "  }\n"
    "\n"
    "  // Books or sheet, on every sheet. Reported alongside everything below rather\n",
)

replace_once(
    CHECK,
    "  // Words that look as if they need the printed page are a prompt to look\n"
    "  // again, never a refusal: the teacher ruled on 19 September 2026 that one\n"
    "  // digit box does not make a write-on sheet, and \"in the box\" is on the list.\n",
    "  // Words that look as if they need the printed page are a prompt to look\n"
    "  // again, never a refusal; words about a box in the question's own sentence\n"
    "  // are not flagged at all (the teacher's 19 September 2026 ruling: one digit\n"
    "  // box does not make a write-on sheet).\n",
)

# ─── 3. books or sheet: by what the sheet holds, and a field ─────────────
replace_once(
    SLIPS,
    "// \"Mark it on the line\", \"Fill in the table\". They are a prompt to look again,\n"
    "// not a verdict: `Write the missing digit in the box.` asks for a blank a child\n"
    "// copies into a book in seconds, and the teacher ruled on 19 September 2026\n"
    "// that one digit box does not make a write-on sheet. So the designer is asked\n"
    "// to look again at preflight, and a `recordingReason` that names the words\n"
    "// answers it; the build treats the sheet as \"sheet\" only when nobody answered,\n"
    "// rather than print slips that ask a child to circle what they do not have.\n",
    "// \"Mark it on the line\", \"Fill in the table\". They are a prompt to look again,\n"
    "// not a verdict. The teacher ruled on 19 September 2026 that one digit box does\n"
    "// not make a write-on sheet, so words about a box or a gap are judged by what\n"
    "// the sheet holds: a box in the question's own sentence (`4,_50`), or on a\n"
    "// sheet whose only helpers are sentences and number sentences, is\n"
    "// copied into a book in seconds and never flagged. The rest are a prompt at\n"
    "// preflight, answered by a field on the sheet (`\"recordingLookedAgain\": true`,\n"
    "// the designer saying a book still does), never by matching the reason's\n"
    "// words; the build treats the sheet as \"sheet\" only when nobody answered,\n"
    "// rather than print slips that ask a child to circle what they do not have.\n",
)

ADVISORIES = r'''// Words about a box or a gap, and the helpers whose boxes are only the blanks
// of a sentence or a number sentence. A phrase from the first list is not
// flagged when its own sentence carries the blank (`_`), or when every helper
// on the sheet is one of the second: then the box is one a child copies into a
// book in seconds (the teacher's 19 September 2026 ruling). A box in a printed
// figure - a part-whole model, a grid, a table - is still flagged, and so is a
// sentence that names the figure it means ("Fill in the table").
const BLANK_WORDING = [/\bin (?:the|this|each) (?:box|boxes|gaps?|spaces?)\b/i, /\bfill in\b/i];
const FIGURE_WORDS = /\b(?:table|grid|chart|diagram|model|number line|map|picture|photo\w*|graph|clock|ruler|scale)\b/i;
const SENTENCE_HELPERS = new Set(["questions", "written-answers", "instruction", "number-sentence", "section-label"]);

function helpersOn(node, found = new Set()) {
  if (Array.isArray(node)) {
    for (const item of node) helpersOn(item, found);
    return found;
  }
  if (!node || typeof node !== "object") return found;
  if (typeof node.helper === "string") found.add(node.helper);
  for (const value of Object.values(node)) helpersOn(value, found);
  return found;
}

function isSentenceBlank(found, onlySentences) {
  if (!BLANK_WORDING.some((pattern) => pattern.test(found.phrase))) return false;
  if (FIGURE_WORDS.test(found.text)) return false;
  return /_/.test(found.text) || onlySentences;
}

// A books sheet whose words look as if they need the printed page, as a prompt
// to look again (`RECORDING_LOOK_AGAIN`), never a refusal. It is quiet when the
// sheet says it was looked at again (`"recordingLookedAgain": true`).
// `includeAnswered` also returns the answered ones, marked `answered: true`,
// for a census of saved sheets.
function recordingAdvisories(worksheet, { includeAnswered = false } = {}) {
  const advisories = [];
  for (const [key, sheet] of Object.entries((worksheet && worksheet.sheets) || {})) {
    if (!sheet || typeof sheet !== "object" || sheet.recording !== "books") continue;
    const content = sheet.pages || sheet.zones;
    const onlySentences = [...helpersOn(content)].every((helper) => SENTENCE_HELPERS.has(helper));
    const found = sheetOnlyWordings(sheet).filter((f) => !isSentenceBlank(f, onlySentences));
    if (!found.length) continue;
    const answered = sheet.recordingLookedAgain === true;
    if (answered && !includeAnswered) continue;
    const phrases = [...new Set(found.map((f) => f.phrase.toLowerCase()))];
    const quoted = found.map((f) => `"${f.phrase}" in "${f.text}"`).join("; ");
    advisories.push({
      signal: "RECORDING_LOOK_AGAIN",
      sheet: key,
      answered,
      phrases,
      found: quoted,
      message:
        `sheets.${key} is marked "books", and ${quoted} look as if they need ` +
        `the printed page. Look at that question against ` +
        `references/books-or-sheet.md: a printed thing the child cannot reproduce ` +
        `makes the sheet "sheet"; if a book still does, set ` +
        `"recordingLookedAgain": true on the sheet, which quiets this. Never ` +
        `reword the question.`,
    });
  }
  return advisories;
}

'''
replace_between(
    SLIPS,
    "const flatLower = ",
    "// Every sheet's recording choice, checked.",
    "reason.includes(flatLower(f.phrase))",
    ADVISORIES,
)

replace_once(
    SLIPS,
    "        message: `sheets.${key}.recording must be \"books\" or \"sheet\" (got ${JSON.stringify(value)}).`,\n"
    "      });\n"
    "      continue;\n"
    "    }\n",
    "        message: `sheets.${key}.recording must be \"books\" or \"sheet\" (got ${JSON.stringify(value)}).`,\n"
    "      });\n"
    "      continue;\n"
    "    }\n"
    "    if (sheet.recordingLookedAgain !== undefined && typeof sheet.recordingLookedAgain !== \"boolean\") {\n"
    "      problems.push({\n"
    "        signal: \"RECORDING_INVALID\",\n"
    "        sheet: key,\n"
    "        message: `sheets.${key}.recordingLookedAgain must be true or false (got ${JSON.stringify(sheet.recordingLookedAgain)}).`,\n"
    "      });\n"
    "    }\n",
)

replace_once(
    BUILD,
    "  // books whose words look as if they need the printed page (\"Circle...\", \"on\n"
    "  // the line\") was asked at preflight to look again; one whose\n"
    "  // `recordingReason` names those words was looked at and keeps \"books\" (one\n"
    "  // digit box does not make a write-on sheet, the teacher's 19 September\n"
    "  // ruling), and one nobody answered is printed as a sheet, because its slips\n"
    "  // might ask children to circle something they do not have.\n",
    "  // books whose words look as if they need the printed page (\"Circle...\", \"on\n"
    "  // the line\") was asked at preflight to look again; one that says it was\n"
    "  // (`\"recordingLookedAgain\": true`) keeps \"books\", and one nobody answered is\n"
    "  // printed as a sheet, because its slips might ask children to circle\n"
    "  // something they do not have. Words about a box in the question's own\n"
    "  // sentence are never flagged (one digit box does not make a write-on sheet,\n"
    "  // the teacher's 19 September ruling).\n",
)
replace_once(
    BUILD,
    "      `they need the printed page, and its recordingReason does not say why a book ` +\n"
    "      `will do.`;\n",
    "      `they need the printed page, and the sheet does not say it was looked at ` +\n"
    "      `again (\"recordingLookedAgain\": true).`;\n",
)

# ─── 2. the Expected sheet stands in for a returned Below or Greater Depth sheet
replace_once(
    BUILD,
    'const { recordingProblems, recordingAdvisories, buildSlips } = require("../src/slips");\n',
    'const { recordingProblems, recordingAdvisories, buildSlips } = require("../src/slips");\n'
    'const { describeReturn, returnedProblems, withExpectedStandingIn } = require("../src/returned");\n',
)
replace_once(
    BUILD,
    "  const specDir = path.dirname(path.resolve(specPath));\n"
    "  const optionalVisuals = prepareWorksheetDecorations(readSpec(specPath), specDir);\n",
    "  const specDir = path.dirname(path.resolve(specPath));\n"
    "\n"
    "  // A sheet sent back to its author (the worksheets topic, 4.2.290). A Below or\n"
    "  // Greater Depth sheet goes back to the adaptation designer to be redesigned,\n"
    "  // and it never costs the other sheets or the answer key: if it still cannot\n"
    "  // be made, those children get the Expected sheet in its place, flagged so\n"
    "  // the teacher knows (his \"yes\", 25 September 2026). A returned sheet is out\n"
    "  // of `sheets` (the designer never wrote it, or the focused repair took it out\n"
    "  // whole), and while the spec records the return that tier holds the Expected\n"
    "  // sheet and its key section the Expected answers. A sheet in `sheets` is\n"
    "  // always built: one beside its own record is its redesign, and the record\n"
    "  // is said to be left on. The class's own sheet is never built around\n"
    "  // (`returned` naming a present Expected sheet is refused, and so is a return\n"
    "  // with no Expected sheet to print in its place).\n"
    "  const spec = readSpec(specPath);\n"
    "  const returnedFaults = returnedProblems(spec);\n"
    "  const back = withExpectedStandingIn(spec);\n"
    "  for (const entry of back.noExpected) {\n"
    "    returnedFaults.push(\n"
    "      `returned sends the ${sheetLabel(entry.sheet)} sheet back, and there is no ` +\n"
    "        `Expected sheet to print in its place: the Expected sheet goes back to the ` +\n"
    "        `lesson designer and is rebuilt before the worksheets build.`\n"
    "    );\n"
    "  }\n"
    "  if (returnedFaults.length) {\n"
    "    for (const message of returnedFaults) fail(\"RETURNED_INVALID\", message, \"content\", {});\n"
    "    return;\n"
    "  }\n"
    "  for (const entry of back.leftOver) {\n"
    "    const label = sheetLabel(entry.sheet);\n"
    "    console.log(\n"
    "      `RETURN_RECORD_LEFT: ${label} - the spec holds a ${label} sheet and a \"returned\" ` +\n"
    "        `entry for it: the sheet is built, as its redesign. Take the entry and its ` +\n"
    "        `WORKSHEET_CONTENT_GAP note off.`\n"
    "    );\n"
    "  }\n"
    "  // Each tier the Expected sheet stands in for, with the line its key section\n"
    "  // carries and why, named once the pack is built (below).\n"
    "  const standIns = new Map(\n"
    "    back.stoodIn.map((entry) => [\n"
    "      entry.sheet,\n"
    "      {\n"
    "        keyLine:\n"
    "          entry.problem === \"picture\"\n"
    "            ? \"whose picture never arrived\"\n"
    "            : \"which could not be used as printed\",\n"
    "        why: `the ${sheetLabel(entry.sheet)} sheet could not be used as printed (${describeReturn(entry)})`,\n"
    "      },\n"
    "    ])\n"
    "  );\n"
    "  const optionalVisuals = prepareWorksheetDecorations(back.worksheet, specDir);\n",
)

# ─── 4. a generated reference can be checked against its generator ──────
CHECK_MODE = (
    "  // `--check` writes nothing: it says whether the file on disk is what this\n"
    "  // script writes today, so a stale reference cannot come back unseen (the\n"
    "  // compositions reference quoted zone heights six millimetres short for two\n"
    "  // weeks before 4.2.290 regenerated it).\n"
    "  if (process.argv.includes(\"--check\")) {\n"
    "    const current = fs.existsSync(file) ? fs.readFileSync(file, \"utf8\").replace(/\\r\\n/g, \"\\n\") : \"\";\n"
    "    if (current === out.join(\"\\n\")) {\n"
    "      console.log(`GENERATED_MATCHES: ${path.basename(file)}`);\n"
    "    } else {\n"
    "      console.log(`GENERATED_STALE: ${path.basename(file)} is not what this script writes today. Regenerate it.`);\n"
    "      process.exitCode = 1;\n"
    "    }\n"
    "    return;\n"
    "  }\n"
)
replace_once(
    CATALOGUE_JS,
    "  fs.mkdirSync(path.dirname(file), { recursive: true });\n"
    "  fs.writeFileSync(file, out.join(\"\\n\"));\n"
    "  console.log(`Wrote ${file}`);\n"
    "  console.log(`${names.length - notOnSheets.size} helpers in ${FAMILIES.length} families.`);\n",
    CHECK_MODE +
    "  fs.mkdirSync(path.dirname(file), { recursive: true });\n"
    "  fs.writeFileSync(file, out.join(\"\\n\"));\n"
    "  console.log(`Wrote ${file}`);\n"
    "  console.log(`${names.length - notOnSheets.size} helpers in ${FAMILIES.length} families.`);\n",
)
replace_once(
    LAYOUTS_JS,
    "  fs.mkdirSync(path.dirname(file), { recursive: true });\n"
    "  fs.writeFileSync(file, out.join(\"\\n\"));\n"
    "  console.log(`Wrote ${file}`);\n"
    "  console.log(`${LAYOUTS.length} shapes and ${VARIANTS.length} variants.`);\n",
    CHECK_MODE +
    "  fs.mkdirSync(path.dirname(file), { recursive: true });\n"
    "  fs.writeFileSync(file, out.join(\"\\n\"));\n"
    "  console.log(`Wrote ${file}`);\n"
    "  console.log(`${LAYOUTS.length} shapes and ${VARIANTS.length} variants.`);\n",
)

# ─── 2. the repair's scope check: the record is not child content ────────
replace_once(
    SCOPE,
    '    "imagePath",\n',
    "    # The record of a sheet sent back to its author (the worksheets topic,\n"
    "    # 4.2.290). It is never printed, so it is not something a child reads.\n"
    "    # The sheet it records is taken out whole, which `without_sheets_sent_back`\n"
    "    # below releases and nothing else does, and a record already there may\n"
    "    # not be taken away.\n"
    '    "returned",\n'
    '    "imagePath",\n',
)
replace_once(
    SCOPE,
    "    before = Census(read_spec(Path(args.before), \"--before\"))\n"
    "    after = Census(read_spec(Path(args.after), \"--after\"))\n",
    "    before_spec = read_spec(Path(args.before), \"--before\")\n"
    "    after_spec = read_spec(Path(args.after), \"--after\")\n"
    "    taken_away = returns_taken_away(before_spec, after_spec)\n"
    "    if taken_away:\n"
    "        report(\n"
    "            f\"REPAIR_SCOPE_FAILED: {len(taken_away)} record(s) of a sheet sent back \"\n"
    "            \"did not survive the repair:\",\n"
    "            taken_away,\n"
    "            \"A sheet sent back stays sent back until its redesign goes in. Taking \"\n"
    "            \"its record away leaves that tier with no sheet and nothing to say so.\",\n"
    "        )\n"
    "        return 1\n"
    "    before = Census(without_sheets_sent_back(before_spec, after_spec))\n"
    "    after = Census(after_spec)\n",
)
replace_once(
    SCOPE,
    "\n\ndef main(argv: list[str] | None = None) -> int:\n",
    "\n\n"
    "# A Below or Greater Depth sheet sent back to its author (the worksheets topic,\n"
    "# 4.2.290) leaves the spec whole, with its answer-key section, and is recorded\n"
    "# in `returned`: that is a return, not a lost question. Only a tier the \"after\"\n"
    "# spec both records and no longer holds is released, so taking a sheet out\n"
    "# without recording it is caught as it always was.\n"
    "SENT_BACK_TIERS = (\"below\", \"greaterDepth\")\n"
    "\n"
    "\n"
    "def returned_tiers(spec: object) -> set:\n"
    "    entries = spec.get(\"returned\") if isinstance(spec, dict) else None\n"
    "    if not isinstance(entries, list):\n"
    "        return set()\n"
    "    return {e.get(\"sheet\") for e in entries if isinstance(e, dict) and isinstance(e.get(\"sheet\"), str)}\n"
    "\n"
    "\n"
    "def returns_taken_away(before: object, after: object) -> list[str]:\n"
    "    gone = sorted(returned_tiers(before) - returned_tiers(after))\n"
    "    return [f\"the record of the {tier} sheet sent back\" for tier in gone]\n"
    "\n"
    "\n"
    "def without_sheets_sent_back(before: object, after: object) -> object:\n"
    "    if not isinstance(before, dict) or not isinstance(after, dict):\n"
    "        return before\n"
    "    before_sheets = before.get(\"sheets\") if isinstance(before.get(\"sheets\"), dict) else {}\n"
    "    after_sheets = after.get(\"sheets\") if isinstance(after.get(\"sheets\"), dict) else {}\n"
    "    recorded = returned_tiers(after)\n"
    "    gone = [t for t in SENT_BACK_TIERS if t in recorded and t in before_sheets and t not in after_sheets]\n"
    "    if not gone:\n"
    "        return before\n"
    "    trimmed = dict(before)\n"
    "    trimmed[\"sheets\"] = {k: v for k, v in before_sheets.items() if k not in gone}\n"
    "    if isinstance(before.get(\"answerKey\"), dict):\n"
    "        trimmed[\"answerKey\"] = {k: v for k, v in before[\"answerKey\"].items() if k not in gone}\n"
    "    return trimmed\n"
    "\n"
    "\n"
    "def main(argv: list[str] | None = None) -> int:\n",
)
print("returned record, books by what the sheet holds, generator checks")
