"use strict";

// A WORKSHEET is the three sheets one lesson hands out, as one thing.
//
// Everything else in this engine works on a single SHEET: a layout, some zones,
// one page. That is the right unit for the library and the wrong unit for a
// teacher, who prints one file, cuts it into three piles and hands them round.
// So this sits above the renderer and holds the part that is about the lesson
// rather than the paper.
//
// The shape is deliberately the Word builder's shape, near enough:
//
//   {
//     meta:   { lesson, lo, yearGroup, subject },
//     sheets: { below?, expected?, greaterDepth? -> { layout, orientation, zones } },
//     answerKey: {
//       below?: [{ question: 1, answer: "..." }],
//       expected?: [{ question: 1, answer: "..." }],
//       greaterDepth?: [{ question: 1, answer: "..." }]
//     }
//   }
//
// Keeping it means the worksheet-designer's rewrite is about LAYOUTS AND ZONES
// and nothing else. Its knowledge of what a worksheet is - three levels, one
// file, expected always present - carries over untouched.

const { plainCriteria } = require("../../shared/text/criteria-marks");
const { checkFit } = require("./render");
const { renderContent, requiredSets } = require("./helpers");
const { canonicalQuestionLabel, formatQuestionLabel } = require("./labels");

// Any width will do: the question is whether the words are ON the page, and a
// helper prints the same words however wide its zone is.
const REFERENCE_WIDTH_MM = 120;

// Least to most challenging, so the printed file reads top-down and splitting
// it into piles is one cut after another rather than a sort.
const PUPIL_SHEET_ORDER = ["below", "expected", "greaterDepth"];
const SHEET_ORDER = [...PUPIL_SHEET_ORDER];

const SHEET_LABELS = {
  below: "Below",
  expected: "Expected",
  greaterDepth: "Greater Depth",
};

// What is PRINTED on the sheet, as against what the teacher's report calls it.
//
// A child reads the top of their own page, so it must not say "Below". That
// part has never changed. What changed on 12 September 2026 is the other half:
// "Sheet A" told the TEACHER nothing either. A, B and C are an alphabet laid
// over three levels, so which pile is which has to be remembered or worked out
// from the order, and the code shared no vocabulary with the document that
// decides the levels - the adaptation-designer writes Below, Expected and
// Greater Depth, and the paper said A, B and C.
//
// So the code is now the first letters of the level's real name. The teacher
// reads it as the thing they already call it; the child reads one or two
// letters that say nothing about them.
const SHEET_CODES = {
  below: "B",
  expected: "E",
  greaterDepth: "GD",
};

// The numbers a CHILD sees, counted here so nobody has to remember them.
//
// A real sheet came out numbered 1, 2, 6. The designer had kept the adaptation's
// own numbers after three of its questions could not be built, which is faithful
// to the brief and wrong on the paper: a child reading their sheet has no idea
// questions 3 to 5 existed, so the gap is not information, it is just a sheet
// that looks like a mistake. Two of the three were also bold and one was not,
// because two happened to sit inside a container that was bold.
//
// So a designer marks a question with `question: true` and never writes a
// number. The engine counts them in reading order - zone a, then b, then c, and
// within a zone top to bottom, left to right - and one format is used for all of
// them. A question that gets cut costs no more than its place in the sequence.
//
// A helper holding a SET of questions takes the next run of numbers rather than
// one, so a block of six followed by a single reasoning question runs 1 to 6 and
// then 7.
// Parts of ONE job count 1a, 1b; separate questions count 1, 2.
//
// The designer owns which questions genuinely form one closely connected pupil
// job - that is the upstream `Question group:` / `Part:` decision and it is a
// teaching judgement. What arrives here is only its mechanical trace: every
// Part of one group carries the same opaque `questionGroupId` on its outer
// `question: true` object. The engine never infers a group from a shared
// picture, zone, helper or topic, because two questions about the same map are
// not thereby one job.
//
// A numberer holds its count across however many physical pages one pupil
// level occupies, so the approved two-page exception runs 1, 2, 3, 4 across the
// pair rather than restarting. A fresh one is made for the next level.
// Does anything inside this node take a number of its own?
function takesANumber(node) {
  if (Array.isArray(node)) return node.some(takesANumber);
  if (!node || typeof node !== "object") return false;
  if (node.question) return true;
  if (
    (node.helper === "questions" || node.helper === "written-answers") &&
    Array.isArray(node.items) &&
    node.items.length > 0 &&
    node.showNumbers !== false
  ) {
    return true;
  }
  return Object.values(node).some(takesANumber);
}

// A picture and the one question about it are one question, so the number goes
// beside the picture.
//
// A Year 4 Reasoning block was a number line and then "Would 9,000 be correct
// in the blank?", with the flag on the prompt. The number printed halfway down
// the block and the line above it belonged to nothing: on a sheet of numbered
// lines it read as the tail of the question before (13 September 2026). The
// designer had grouped the two in one stack, which already says they are one
// job, so the number follows the grouping rather than the flag's position.
//
// Only a stack whose ONE numbered child is a single question coming after
// unnumbered material, with no section title in front: a stack holding two
// questions, or a source and a set of questions about it, is not one question,
// and a heading has to stay outside the number it heads.
function questionBehindItsMaterial(node) {
  if (!node || typeof node !== "object" || node.question || !Array.isArray(node.stack)) {
    return node;
  }
  const items = node.stack;
  const numbered = items.filter(takesANumber);
  if (numbered.length !== 1) return node;
  const at = items.indexOf(numbered[0]);
  const flagged = items[at];
  if (at === 0 || !flagged || !flagged.question) return node;
  // A flagged set of several questions takes a run of numbers, not one.
  if (Array.isArray(flagged.items) && flagged.items.length > 1) return node;
  if (items.slice(0, at).some((item) => item && item.helper === "section-label")) return node;

  const { question, questionGroupId, ...inner } = flagged;
  const hoisted = { ...node, question };
  if (questionGroupId !== undefined) hoisted.questionGroupId = questionGroupId;
  hoisted.stack = items.map((item, i) => (i === at ? inner : item));
  return hoisted;
}

function makeNumberer() {
  let nextMain = 1;
  let activeGroupId = null;
  let activeGroupMain = null;
  let activeGroupParts = 0;
  const seenGroups = new Set();
  const labels = [];

  const partLetter = (index) => String.fromCharCode(97 + index);

  // A group with one Part is a designer fault, not a silent single question:
  // it means a relationship was declared that the content does not have.
  function closeGroup() {
    if (activeGroupId !== null && activeGroupParts < 2) {
      throw new WorksheetError(
        "QUESTION_GROUP_INVALID",
        `questionGroupId ${JSON.stringify(activeGroupId)} holds only one ` +
          `Part. A Question group needs at least two Parts, or the Part is an ` +
          `ordinary question and carries no questionGroupId.`
      );
    }
    activeGroupId = null;
    activeGroupMain = null;
    activeGroupParts = 0;
  }

  function groupIdOf(node) {
    const raw = node.questionGroupId;
    if (raw === undefined || raw === null) return null;
    const id = String(raw).trim();
    return id === "" ? null : id;
  }

  function labelForQuestion(node, zoneId) {
    const groupId = groupIdOf(node);

    if (groupId === null) {
      closeGroup();
      // An ungrouped question keeps the plain integer it has always had, so
      // nothing downstream that reads `number` changes shape for the ordinary
      // case. Only a grouped Part needs "1a".
      const label = nextMain;
      nextMain += 1;
      return label;
    }

    if (node.number !== undefined || node.startAt !== undefined) {
      throw new WorksheetError(
        "NUMBERING_CONFLICT",
        `zone "${zoneId}": a question in group ${JSON.stringify(groupId)} also ` +
          `sets its own number/startAt. The engine numbers grouped Parts.`
      );
    }

    if (groupId === activeGroupId) {
      activeGroupParts += 1;
      return `${activeGroupMain}${partLetter(activeGroupParts - 1)}`;
    }

    if (seenGroups.has(groupId)) {
      throw new WorksheetError(
        "QUESTION_GROUP_NONCONTIGUOUS",
        `zone "${zoneId}": questionGroupId ${JSON.stringify(groupId)} appears ` +
          `again after other questions came between its Parts. The Parts of one ` +
          `Question group must be consecutive in reading order.`
      );
    }

    closeGroup();
    seenGroups.add(groupId);
    activeGroupId = groupId;
    activeGroupMain = nextMain;
    activeGroupParts = 1;
    nextMain += 1;
    return `${activeGroupMain}a`;
  }

  // A helper that draws its own list of numbered items. `showNumbers: false`
  // is how a spec says the list is not questions - a run of named slots, a set
  // of labels - and such a list takes no numbers and needs no answers.
  function isNumberPrintingSet(node) {
    return (
      (node.helper === "questions" || node.helper === "written-answers") &&
      Array.isArray(node.items) &&
      node.items.length > 0 &&
      node.showNumbers !== false
    );
  }

  function numberZones(zones) {
    const walk = (node, zoneId, insideNumberedQuestion = false) => {
      if (Array.isArray(node)) {
        return node.map((n) => walk(n, zoneId, insideNumberedQuestion));
      }
      if (!node || typeof node !== "object") return node;
      if (!insideNumberedQuestion) node = questionBehindItsMaterial(node);

      if (
        insideNumberedQuestion &&
        (node.helper === "questions" || node.helper === "written-answers") &&
        Array.isArray(node.items) &&
        node.items.length === 1
      ) {
        node = { ...node, showNumbers: false };
      }

      // A set numbers its own items, so it takes as many numbers as it has.
      //
      // What decides this is whether the set will PRINT numbers, not whether
      // anyone remembered to mark it `question: true`. An unmarked set still
      // printed - `startAt` was never set, the helper fell back to 1, and a
      // history sheet came out numbered (1) (1) (2) (1) (2) (3) with two
      // different questions both called (1). The numbers were on the page
      // either way; the only thing the missing flag changed was whether they
      // were right. Those items were also invisible to the answer-key check,
      // so a question a child answered had no answer beside it and nothing
      // said so. Numbering every printing set from the one running count makes
      // both true by construction.
      if (isNumberPrintingSet(node)) {
        if (groupIdOf(node) !== null) {
          throw new WorksheetError(
            "NUMBERING_CONFLICT",
            `zone "${zoneId}": questionGroupId is on a helper holding a SET of ` +
              `questions, which takes a run of numbers rather than one. Wrap the ` +
              `Part in a stack so question: true covers the Part as a whole.`
          );
        }
        closeGroup();
        const { question, questionGroupId, ...rest } = node;
        const out = { ...rest, startAt: nextMain };
        for (let i = 0; i < node.items.length; i += 1) {
          labels.push(String(nextMain + i));
        }
        nextMain += node.items.length;
        return out;
      }

      if (node.question) {
        // This question's own number is taken BEFORE its children are walked, so
        // a set nested inside it numbers after it rather than in front of it.
        const label = labelForQuestion(node, zoneId);
        labels.push(String(label));

        const { question, questionGroupId, ...rest } = node;
        const out = { number: label };
        for (const [key, value] of Object.entries(rest)) {
          out[key] = walk(value, zoneId, true);
        }
        return out;
      }

      // A container - a `row`, a nested `stack` - is not a question boundary,
      // so it must carry the flag through. Dropping it here reset the state at
      // every level of nesting: a single-item helper sitting directly under a
      // numbered question was correctly suppressed, while the same helper one
      // level deeper started its own run again, and a question holding a
      // two-column recording surface printed "(1)" four times over.
      const out = {};
      for (const [key, value] of Object.entries(node)) {
        out[key] = walk(value, zoneId, insideNumberedQuestion);
      }
      return out;
    };

    // Zone order is the reading order: a, then b, then c - or, for an auto
    // sheet not yet resolved to a layout, the array's own order, which is the
    // same reading order by definition. Array keys must not go through the
    // string sort ("10" sorts before "2").
    if (Array.isArray(zones)) {
      return zones.map((zone, i) => walk(zone, String(i)));
    }
    const out = {};
    for (const id of Object.keys(zones).sort()) out[id] = walk(zones[id], id);
    return out;
  }

  return {
    numberZones,
    // Called once the level's last page has been numbered, so a group left open
    // at the very end is still checked.
    finish() {
      closeGroup();
      return labels.slice();
    },
  };
}

function numbered(zones) {
  const numberer = makeNumberer();
  const out = numberer.numberZones(zones);
  numberer.finish();
  return out;
}

// Count the question numbers the engine will print, using the same traversal
// rule as `numbered`. The answer-key validator uses this rather than trusting
// an agent's separate count: a set of four questions consumes four numbers,
// while a diagram + prompt wrapped as one question consumes one.
function questionCount(zones) {
  let count = 0;

  const walk = (node) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (!node || typeof node !== "object") return;

    if (node.question && Array.isArray(node.items)) {
      count += node.items.length;
      return;
    }

    if (node.question) count += 1;
    for (const value of Object.values(node)) walk(value);
  };

  if (Array.isArray(zones)) zones.forEach(walk);
  else for (const id of Object.keys(zones || {}).sort()) walk(zones[id]);
  return count;
}

// The labels the engine will actually PRINT, in printing order.
//
// Counting was enough while every question was an integer. Once Parts of one
// job print (1a) and (1b), a count of three says nothing about whether a key
// holding 1, 2, 3 covers a sheet showing 1a, 1b, 2 - so the key is matched
// against these exact labels instead.
// A pupil level's labels across every physical page it occupies, so the two-page
// exception is checked as one sequence rather than two.
function questionLabelsForSheet(sheet) {
  const numberer = makeNumberer();
  for (const page of pagesOf(sheet)) numberer.numberZones(page.zones || {});
  return numberer.finish();
}

// Every writing helper takes a `phase` that sets how tall a ruled line is, and
// it defaulted to the youngest. The catalogue documented neither the field nor
// the need, so a Year 6 sheet printed with Year 1 line spacing unless the
// designer had read the engine's source to find out the field existed.
//
// The worksheet knows the year group, so it answers this rather than asking. A
// zone that states its own phase is left alone: a designer with a reason beats
// a default.
function withPhase(node, phase) {
  if (Array.isArray(node)) return node.map((n) => withPhase(n, phase));
  if (!node || typeof node !== "object") return node;

  const out = {};
  for (const [key, value] of Object.entries(node)) {
    out[key] = withPhase(value, phase);
  }
  if (out.helper && out.phase === undefined) out.phase = phase;
  return out;
}

// Years 1 to 3 write on 8mm lines, Years 4 to 6 on 6mm. A missing year group
// takes the taller line: too much room to write is a smaller fault than not
// enough, and it is the one a teacher can see at a glance. A PROVIDED year
// group is parsed strictly - 4, "4" and "Year 4" all mean Year 4, and anything
// else is refused. It used to fall through silently: Number("Year 4") is NaN,
// NaN >= 4 is false, so a Year 4 sheet was measured on Year 1 lines and
// nothing said so.
function parseYearGroup(value) {
  if (value == null || value === "") return null;
  const m = String(value).trim().match(/^(?:year|y)?\s*([1-6])$/i);
  if (!m) {
    throw new WorksheetError(
      "SPEC_INVALID",
      `yearGroup must be a year group from 1 to 6 (got ${JSON.stringify(value)}).`
    );
  }
  return Number(m[1]);
}

function phaseFor(yearGroup) {
  const year = parseYearGroup(yearGroup);
  return year !== null && year >= 4 ? "upper" : "lower";
}

class WorksheetError extends Error {
  constructor(signal, message) {
    super(message);
    this.signal = signal;
  }
}

// ─── automatic layout choice ─────────────────────────────────────────────
//
// The machine already ranks every layout by comfort (suggestLayouts), and the
// designer was already told to take the top answer unless the teaching says
// otherwise. So for the normal case the round trip - write the content out,
// run the tool, copy its first line back in - taught the designer nothing and
// cost a step that could go wrong. `"layout": "auto"` hands the whole
// question to the engine.
//
// An auto sheet writes its zones as an ARRAY in reading order, not an object,
// because zone names belong to a layout and the sheet does not know its
// layout yet. Content order is still not negotiable: the first entry lands in
// the first zone of whatever shape is chosen, exactly as the fit checker has
// always filled zones.
//
// A named layout stays exactly what it was: the designer's deliberate choice,
// used whenever the teaching wants a particular arrangement. Auto is the
// default case, not the only case.
//
// Resolution needs pictures already resolved (a photograph has no height
// until its file is read), so the scripts resolve images first - the same
// order the fit check has always required.
function resolveAutoSheet(sheet, meta) {
  if (!sheet || typeof sheet !== "object") return { sheet, choice: null };

  if (Array.isArray(sheet.pages)) {
    if (sheet.pages.some((page) => page && page.layout === "auto")) {
      throw new WorksheetError(
        "AUTO_LAYOUT_INVALID",
        'layout "auto" cannot be used inside the two-page exception. Its ' +
          "pages split one piece of content across two sheets of paper, and " +
          "where that split falls is the designer's decision: name each " +
          "page's layout."
      );
    }
    return { sheet, choice: null };
  }

  if (sheet.layout !== "auto") {
    if (Array.isArray(sheet.zones)) {
      throw new WorksheetError(
        "AUTO_LAYOUT_INVALID",
        `layout ${JSON.stringify(sheet.layout)} names its zones (a, b, c...), ` +
          "so zones must be an object keyed by those names. A zones ARRAY " +
          'goes with "layout": "auto", where the engine chooses the shape ' +
          "and assigns the names itself."
      );
    }
    return { sheet, choice: null };
  }

  const items = sheet.zones;
  if (!Array.isArray(items) || items.length === 0) {
    throw new WorksheetError(
      "AUTO_LAYOUT_INVALID",
      'with "layout": "auto", zones is an array of zone contents in reading ' +
        "order - one entry per zone, so an entry is usually a stack of " +
        "several helpers. " +
        (Array.isArray(items)
          ? "This one is empty."
          : "This one is an object keyed by zone names, which only a named layout has.")
    );
  }

  // Required lazily: suggest.js requires this file the same way, and both
  // requires sit inside functions so neither module loads half of the other.
  const { suggestLayouts } = require("./suggest");
  const orientation =
    sheet.orientation === "landscape" || sheet.orientation === "portrait"
      ? sheet.orientation
      : undefined;

  const result = suggestLayouts(items, {
    yearGroup: meta && meta.yearGroup,
    orientation,
    extra: { title: sheet.title },
  });

  if (!result.fits.length) {
    // The refusal carries the same millimetre verdict the suggest tool
    // prints, because the person reading it has the same decision to make:
    // is this a shape problem or a brief bigger than a page?
    const lines = result.verdict && result.verdict.lines ? result.verdict.lines : [];
    const examples = result.refused
      .slice(0, 2)
      .map((r) => `${r.layout} (${r.orientation}): ${r.why[0]}`);
    throw new WorksheetError(
      "SHEET_DOES_NOT_FIT",
      `layout "auto": no layout in the library holds these ${items.length} ` +
        `zones. ${[...lines, ...examples].join(" ")}`
    );
  }

  const best = result.fits[0];
  const zones = {};
  best.zones.forEach((id, i) => {
    zones[id] = items[i];
  });

  const { layout, orientation: _requested, zones: _items, ...rest } = sheet;
  return {
    sheet: { ...rest, layout: best.layout, orientation: best.orientation, zones },
    choice: {
      layout: best.layout,
      name: best.name,
      orientation: best.orientation,
      fillPct: best.fillPct,
      verdict: best.verdict,
    },
  };
}

// Every auto sheet in a worksheet resolved at once, with the choices reported
// back so a build can say out loud which shape each sheet was given. The
// scripts call this once, right after images are resolved; sheetsOf also
// resolves lazily, so a caller that skips this still gets a drawable sheet.
function resolveAutoLayouts(worksheet) {
  if (!worksheet || typeof worksheet !== "object") return { worksheet, choices: [] };
  const sheets = worksheet.sheets || {};
  const meta = worksheet.meta || {};
  const choices = [];
  const out = {};
  let changed = false;

  for (const [key, sheet] of Object.entries(sheets)) {
    let resolved;
    try {
      resolved = resolveAutoSheet(sheet, meta);
    } catch (error) {
      if (error instanceof WorksheetError) {
        error.message = `${SHEET_LABELS[key] || key} - ${error.message}`;
        error.location = { sheet: key };
      }
      throw error;
    }
    out[key] = resolved.sheet;
    if (resolved.choice) {
      choices.push({ sheet: key, label: SHEET_LABELS[key] || key, ...resolved.choice });
      changed = true;
    }
  }

  return {
    worksheet: changed ? { ...worksheet, sheets: out } : worksheet,
    choices,
  };
}

// The physical pages one pupil level occupies. Almost always one.
//
// A worksheet is one page per level, and overflow is never a reason for a
// second: a sheet that will not fit is a design fault the designer fixes, not
// something the builder solves by printing more paper. The single exception is
// the upstream one - a substantial visual the children directly plot on,
// measure, draw on, label or annotate, which cannot stay usable at one-page
// size. That decision is made upstream and marked Eligible there; what arrives
// here is only its mechanical trace, and this refuses everything else.
function pagesOf(sheet) {
  const exception = sheet.centralWriteOnVisualException;
  const hasPages = sheet.pages !== undefined;

  if (!hasPages) {
    if (exception !== undefined) {
      throw new WorksheetError(
        "TWO_PAGE_EXCEPTION_INVALID",
        "centralWriteOnVisualException is set but the sheet has no pages array. " +
          "The exception describes exactly two pages."
      );
    }
    return [
      {
        layout: sheet.layout,
        orientation: sheet.orientation,
        zones: sheet.zones || {},
        decorations: sheet.decorations || [],
      },
    ];
  }

  if (exception === undefined) {
    throw new WorksheetError(
      "TWO_PAGE_EXCEPTION_REQUIRED",
      "A sheet with pages must carry centralWriteOnVisualException naming the " +
        "write-on visual and the reason, copied from the upstream decision. " +
        "Ordinary overflow never earns a second page."
    );
  }

  if (sheet.layout !== undefined || sheet.orientation !== undefined || sheet.zones !== undefined) {
    throw new WorksheetError(
      "TWO_PAGE_SPEC_CONFLICT",
      "A sheet uses pages AND top-level layout/orientation/zones. Put every " +
        "page inside pages."
    );
  }

  if (!Array.isArray(sheet.pages) || sheet.pages.length !== 2) {
    throw new WorksheetError(
      "TWO_PAGE_EXCEPTION_INVALID",
      `The central write-on visual exception is exactly two pages; received ` +
        `${Array.isArray(sheet.pages) ? sheet.pages.length : "a non-array"}.`
    );
  }

  if (!exception || typeof exception !== "object" || Array.isArray(exception)) {
    throw new WorksheetError(
      "TWO_PAGE_EXCEPTION_INVALID",
      "centralWriteOnVisualException must be an object naming the visual and " +
        "the reason."
    );
  }
  for (const field of ["visual", "reason"]) {
    if (String(exception[field] == null ? "" : exception[field]).trim() === "") {
      throw new WorksheetError(
        "TWO_PAGE_EXCEPTION_INVALID",
        `centralWriteOnVisualException.${field} is missing. Copy the named ` +
          `visual and reason from the upstream decision rather than writing a ` +
          `new justification.`
      );
    }
  }

  return sheet.pages.map((page) => ({
    layout: page.layout,
    orientation: page.orientation,
    zones: page.zones || {},
    decorations: page.decorations || [],
  }));
}

// The sheets a worksheet actually holds, in printing order, each already turned
// into the single-sheet spec the renderer takes.
//
// A worksheet with only `expected` is normal, not a degraded case: it is what
// every shared working frame produces, and what any lesson produces when the
// adaptation step was skipped.
function sheetsOf(worksheet) {
  if (!worksheet || typeof worksheet !== "object") {
    throw new WorksheetError("SPEC_INVALID", "The worksheet spec is not an object.");
  }

  const meta = worksheet.meta || {};
  const sheets = worksheet.sheets || {};

  const unknown = Object.keys(sheets).filter((k) => !SHEET_ORDER.includes(k));
  if (unknown.length) {
    throw new WorksheetError(
      "SPEC_INVALID",
      `Unknown sheet name(s): ${unknown.join(", ")}. ` +
        `A worksheet holds ${SHEET_ORDER.join(", ")}.`
    );
  }

  const present = SHEET_ORDER.filter((key) => sheets[key]);
  if (!present.length) {
    throw new WorksheetError("NO_SHEETS", "No sheets present in spec.");
  }

  // Only one sheet means only one pile, so a code would be labelling a
  // distinction that is not being made.
  const coded = present.length > 1;

  const out = [];
  for (const key of present) {
    // An auto sheet that reached here unresolved (a caller going straight to
    // the library) still resolves; the scripts have normally done it already,
    // in which case this is a straight pass-through.
    const { sheet } = resolveAutoSheet(sheets[key], meta);
    const pages = pagesOf(sheet);
    // One numberer for the whole level: the approved two-page pair carries on
    // 1, 2, 3, 4 rather than starting again on page 2, and the next level gets
    // a numberer of its own so it starts at 1.
    const numberer = makeNumberer();

    pages.forEach((page, index) => {
      out.push({
        key,
        label: SHEET_LABELS[key],
        code: coded ? SHEET_CODES[key] : null,
        page: index + 1,
        pageCount: pages.length,
        spec: {
          // The lesson names the sheet; the level does not. The title is used
          // for naming and reporting, not printed on the page, and no sheet
          // carries the learning objective: the class has it on the board and
          // in their books (see the header band in `render.js`).
          title: sheet.title || meta.lesson || "Worksheet",
          code: coded ? SHEET_CODES[key] : "",
          layout: page.layout,
          orientation: page.orientation === "landscape" ? "landscape" : "portrait",
          zones: numberer.numberZones(
            withPhase(page.zones || {}, phaseFor(meta.yearGroup))
          ),
          decorations: page.decorations || [],
        },
      });
    });

    numberer.finish();
  }
  return out;
}

// Teacher answers are a separate audience and therefore a separate artefact.
// They never live in `sheets`, where the pupil-PDF loop could append them to a
// print job. This validates both audience separation and coverage before any
// pupil file is written.
function answerKeyOf(worksheet) {
  const sheets = worksheet && worksheet.sheets;
  if (sheets && sheets.answers) {
    throw new WorksheetError(
      "SPEC_INVALID",
      "Answers must not be stored as sheets.answers. Put them in top-level " +
        "answerKey so the builder writes a separate teacher file."
    );
  }

  const present = PUPIL_SHEET_ORDER.filter((key) => sheets && sheets[key]);
  const key = worksheet && worksheet.answerKey;
  if (!key || typeof key !== "object" || Array.isArray(key)) {
    throw new WorksheetError(
      "ANSWER_KEY_MISSING",
      `A complete top-level answerKey is required for: ${present.join(", ")}.`
    );
  }

  const unknown = Object.keys(key).filter((name) => !PUPIL_SHEET_ORDER.includes(name));
  if (unknown.length) {
    throw new WorksheetError(
      "SPEC_INVALID",
      `Unknown answer-key section(s): ${unknown.join(", ")}.`
    );
  }

  for (const name of Object.keys(key)) {
    if (!present.includes(name)) {
      throw new WorksheetError(
        "SPEC_INVALID",
        `answerKey.${name} has no matching pupil sheet.`
      );
    }
  }

  const normalised = {};
  for (const name of present) {
    const entries = key[name];
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new WorksheetError(
        "ANSWER_KEY_MISSING",
        `answerKey.${name} must contain at least one teacher answer.`
      );
    }

    // Matched against the labels the sheet actually prints, canonically: a key
    // may write 1a, (1a) or " 1a " and mean the same question. Counting was
    // enough while questions were integers; it is not once Parts print (1a).
    const printed = questionLabelsForSheet(sheets[name]);
    const seenLabels = new Set();
    normalised[name] = entries.map((entry, index) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        throw new WorksheetError(
          "ANSWER_KEY_INCOMPLETE",
          `answerKey.${name}[${index}] must be { question, answer }.`
        );
      }
      const question = entry.question;
      const answer = String(entry.answer == null ? "" : entry.answer).trim();
      if (question === undefined || question === null || String(question).trim() === "") {
        throw new WorksheetError(
          "ANSWER_KEY_INCOMPLETE",
          `answerKey.${name}[${index}] has no question label.`
        );
      }
      if (!answer) {
        throw new WorksheetError(
          "ANSWER_KEY_INCOMPLETE",
          `answerKey.${name}[${index}] has no answer.`
        );
      }

      let label;
      try {
        label = canonicalQuestionLabel(question);
      } catch (e) {
        throw new WorksheetError(
          "QUESTION_LABEL_INVALID",
          `answerKey.${name}[${index}]: ${e.message}`
        );
      }

      if (seenLabels.has(label)) {
        throw new WorksheetError(
          "ANSWER_KEY_DUPLICATE",
          `answerKey.${name} answers question (${label}) more than once.`
        );
      }
      seenLabels.add(label);

      // A sheet that marks no questions gives the engine nothing to match
      // against - a helper may hold its own unnumbered items - so the key is
      // left alone rather than judged against an empty list. Exactly as before:
      // the old count-based check also did nothing when the count was zero.
      if (printed.length && !printed.includes(label)) {
        throw new WorksheetError(
          "ANSWER_KEY_EXTRA",
          `answerKey.${name} answers question (${label}), which the pupil sheet ` +
            `does not print. It prints: ${printed.map((l) => `(${l})`).join(", ")}.`
        );
      }

      return { question: label, answer };
    });

    for (const label of printed) {
      if (!seenLabels.has(label)) {
        throw new WorksheetError(
          "ANSWER_KEY_INCOMPLETE",
          `answerKey.${name} is missing question (${label}) ` +
            `(the pupil sheet prints: ${printed.map((l) => `(${l})`).join(", ")}).`
        );
      }
    }
  }

  return normalised;
}

function renderAnswerKey(worksheet, answerKey = answerKeyOf(worksheet)) {
  const meta = worksheet.meta || {};
  const present = PUPIL_SHEET_ORDER.filter(
    (name) => worksheet.sheets && worksheet.sheets[name]
  );
  const coded = present.length > 1;
  const title = meta.lesson || meta.name || "Worksheet";
  const lines = [
    `${title} - Answer Key`,
    "Teacher copy - keep separate from pupil worksheets.",
    "",
  ];

  for (const name of present) {
    const heading = coded
      ? `${SHEET_LABELS[name]} (${SHEET_CODES[name]})`
      : SHEET_LABELS[name];
    lines.push(heading.toUpperCase());
    for (const entry of answerKey[name]) {
      lines.push(`${formatQuestionLabel(entry.question)} ${entry.answer}`);
    }
    lines.push("");
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

// Every sheet checked before any of them is drawn.
//
// All of them, not the first failure: a designer who has to be told about one
// sheet at a time does three rounds of the same conversation, and the three
// sheets usually go wrong for the same reason.
// Two faults, reported separately, because they are fixed by different edits.
//
//   badZones  a helper could not read its own spec: a field misspelled or left
//             out. The designer edits that zone.
//   tooTight  every zone draws, but the page will not hold them. The designer
//             chooses a different layout, or moves something off the sheet.
//
// Rolling both into one message sends a designer looking for a layout problem
// when what they have is a typo.
// A word bank is a structure, not a sentence.
//
// Upstream a bank arrives as `Support: Word bank: [...]`, and the designer's
// job is to render it as a separate labelled support block a child can find at
// a glance. Two ways of losing that survive the ordinary checks, because both
// produce a sheet that renders perfectly well and is wrong on the paper:
//
//   the words get typed into a prompt as "Word bank: river, source, mouth", so
//   they read as part of the question rather than as material to use;
//
//   the prompt says "use the word bank" and no bank was built, so a child is
//   told to use something that is not on their sheet.
//
// The engine never parses the inline words into a bank. Inventing the structure
// would be deciding what the bank holds, which is the designer's call.

// Only structures that genuinely ARE banks count. An arbitrary array of strings
// is not a bank just because it is words: guessing would let a sheet claim
// support it does not offer.
function bankEntriesIn(node) {
  const helper = node.helper;
  if (helper === "sort-grid" || helper === "fact-file" || helper === "cause-path-grid") {
    if (Array.isArray(node.wordBank)) return node.wordBank;
  }
  if (helper === "chip-bank" && Array.isArray(node.chips)) return node.chips;
  // A fact-file carries a bank per field rather than one for the helper.
  if (helper === "fact-file" && Array.isArray(node.fields)) {
    const collected = [];
    for (const field of node.fields) {
      if (field && Array.isArray(field.wordBank)) collected.push(...field.wordBank);
    }
    if (collected.length) return collected;
  }
  return null;
}

const INLINE_BANK = /\bword\s*bank\s*:/i;
// "use the word bank", "from the word bank" - an instruction TO the child.
const REFERS_TO_BANK = /\b(?:the|your)\s+word\s*bank\b/i;

// Fields a child reads. A helper's own internal keys are not pupil wording.
const PUPIL_TEXT_FIELDS = new Set([
  "text",
  "instruction",
  "prompt",
  "stem",
  "question",
  "caption",
  "title",
  "note",
  "hint",
]);

// ─── words the designer wrote that never reach the paper ─────────────────
//
// A helper reads the fields it knows and ignores the rest, in silence. So a
// field written onto a helper that has no such field simply evaporates: the
// sheet renders perfectly, the fit check passes, the PDF looks finished, and
// the words are gone. Nothing anywhere says so.
//
// It is not hypothetical and it is not rare. One science lesson shipped with
// `note` on two recording tables - "For power source, write mains, battery,
// both or not electrical", and "Choose an appliance that isn't already in
// photographs A to D". A recording table had no note. Children were asked for
// a power source with no clue what one should look like, and a teacher marking
// the sheet had no idea a line was missing. The engine's own reference had
// long warned designers that "a text written onto a helper that has none is
// silently dropped", which is the right fact in the wrong place: a rule a
// designer must remember, guarding something the build can simply check.
//
// This is the check. It asks the only question that matters - did these words
// reach the page? - and it asks it of the rendered HTML, so it holds for every
// helper, including ones not written yet, and for any cause: a wrong field
// name, a typo, a helper that quietly stopped printing something.
//
// Deliberately blunt about HOW text is printed. Whitespace, tags, entities and
// the engine's own inline markup are all normalised away, because a false
// refusal costs a class its worksheets and a missed mangling costs a proofread.
const WRITE_IN_BLANK = /_{2,}/g; // printed as a write-in box, not as underscores
const INLINE_EMPHASIS = /\*\*/g; // methods.js turns **this** into <strong>

function comparableText(value) {
  // A criterion's colour marks print as colour, not as characters.
  return plainCriteria(String(value))
    .replace(INLINE_EMPHASIS, "")
    .replace(WRITE_IN_BLANK, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function comparableHtml(html) {
  return String(html)
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(WRITE_IN_BLANK, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

// A question with nothing in it to act on.
//
// The words reach the page and the frame is drawn; the set inside it is empty.
// "Circle the complete circuit" with no options printed, "draw a line from each
// word to the right part" over a photograph carrying no dots. See
// `requiredSets` in helpers/index.js for why this is declared per helper rather
// than inferred: a blank Venn is a frame the child fills, and an empty set of
// options is a question nobody can answer.
function emptySetProblems(sheet) {
  const problems = [];

  const walk = (node, zoneId) => {
    if (Array.isArray(node)) {
      node.forEach((n) => walk(n, zoneId));
      return;
    }
    if (!node || typeof node !== "object") return;

    if (typeof node.helper === "string") {
      for (const field of requiredSets(node.helper)) {
        const value = node[field];
        if (Array.isArray(value) && value.length === 0) {
          problems.push(
            `EMPTY_SET: zone "${zoneId}" (${node.helper}) has an empty ${field}, ` +
              `so the page prints the frame and nothing to act on. Fill ${field} ` +
              `in, or use a helper whose job the content actually is. If an ` +
              `upstream step emptied it, that step is the repair.`
          );
        }
      }
    }

    for (const value of Object.values(node)) walk(value, zoneId);
  };

  for (const id of Object.keys(sheet.spec.zones || {}).sort()) {
    walk(sheet.spec.zones[id], id);
  }

  return problems;
}

function unprintedTextProblems(sheet) {
  const problems = [];

  for (const id of Object.keys(sheet.spec.zones || {}).sort()) {
    const content = sheet.spec.zones[id];
    let printed;
    try {
      printed = comparableHtml(renderContent(content, REFERENCE_WIDTH_MM));
    } catch (e) {
      // A zone that cannot draw itself is already reported as a bad zone, and
      // that is the fault worth fixing first.
      continue;
    }

    const walk = (node) => {
      if (Array.isArray(node)) {
        node.forEach(walk);
        return;
      }
      if (!node || typeof node !== "object") return;
      for (const [key, value] of Object.entries(node)) {
        if (
          typeof value === "string" &&
          PUPIL_TEXT_FIELDS.has(key) &&
          value.trim() &&
          comparableText(value) &&
          !printed.includes(comparableText(value))
        ) {
          problems.push(
            `TEXT_NOT_PRINTED: zone "${id}" (${helperName(node)}) sets ${key} to ` +
              `${JSON.stringify(value)}, and those words are not on the printed ` +
              `page. Check ${key} against this helper's entry in the catalogue: ` +
              `a field a helper does not read is ignored in silence. Where the ` +
              `helper cannot carry the line, put an instruction above it in the ` +
              `stack.`
          );
        }
        walk(value);
      }
    };

    walk(content);
  }

  return problems;
}

function wordBankProblems(sheet) {
  const problems = [];
  let hasRealBank = false;
  const refersToBank = [];

  const walk = (node, zoneId) => {
    if (Array.isArray(node)) {
      node.forEach((n) => walk(n, zoneId));
      return;
    }
    if (!node || typeof node !== "object") return;

    const entries = bankEntriesIn(node);
    if (entries && entries.length) hasRealBank = true;

    for (const [key, value] of Object.entries(node)) {
      if (typeof value === "string" && PUPIL_TEXT_FIELDS.has(key)) {
        if (INLINE_BANK.test(value)) {
          problems.push(
            `WORD_BANK_INLINE: zone "${zoneId}" ${key} declares a word bank in ` +
              `its own words (${JSON.stringify(value)}). A word bank is a ` +
              `separate labelled support block, not part of the wording.`
          );
        } else if (REFERS_TO_BANK.test(value)) {
          refersToBank.push(`zone "${zoneId}" ${key}`);
        }
      }
      // A plain string inside items is pupil wording too.
      if (key === "items" && Array.isArray(value)) {
        value.forEach((item) => {
          if (typeof item === "string" && INLINE_BANK.test(item)) {
            problems.push(
              `WORD_BANK_INLINE: zone "${zoneId}" items declares a word bank in ` +
                `its own words (${JSON.stringify(item)}).`
            );
          } else if (typeof item === "string" && REFERS_TO_BANK.test(item)) {
            refersToBank.push(`zone "${zoneId}" items`);
          }
        });
      }
      walk(value, zoneId);
    }
  };

  for (const id of Object.keys(sheet.spec.zones || {}).sort()) {
    walk(sheet.spec.zones[id], id);
  }

  if (refersToBank.length && !hasRealBank) {
    problems.push(
      `WORD_BANK_MISSING: ${refersToBank.join(", ")} tells the child to use the ` +
        `word bank, and this sheet has no word bank on it.`
    );
  }

  return problems;
}

// ─── wording that was never meant for the child ──────────────────────────
//
// Everything in PUPIL_TEXT_FIELDS is printed on paper a child reads. Two kinds
// of writing keep arriving in those fields, and both print without complaint.
//
// The first is the apparatus talking about itself. Real sheets carried "Show
// the counters in a prefilled place-value chart and provide one numeral answer
// line" and "Add the sentence stem: ...". Those are directions to whoever
// builds the page, and a child reading them has been handed the wrong document.
// The words below name the page's own machinery; a question about the LESSON
// never needs them, which is what makes them safe to refuse on sight.
//
// The second is a mode-of-work label growing into the question it heads.
// Upstream writes "Fluency\n\nComplete each row." as one block, verbatim
// copying carries it through, and the sheet prints "Fluency Complete each
// row." as a single instruction. The engine has `section-label` for exactly
// this - a heading above the block it names - so the repair is to lift the
// word out, not to delete it. Only a label ALONE on the first line counts: a
// question that happens to open with the word "Reasoning about..." is a
// question, not a heading.
const BUILDER_WORDING = [
  /\banswer\s+lines?\b/i,
  /\bwriting\s+lines?\b/i,
  /\bsentence\s+stems?\b/i,
  /\bpre-?filled\b/i,
  /\bplace-?holder\b/i,
];

// The mode-of-work words this engine prints as headings, from shared.md.
const MODE_OF_WORK = new Set([
  "fluency",
  "practise",
  "practice",
  "apply",
  "stretch",
  "reasoning",
  "problem solving",
  "going deeper",
]);

function modeOfWorkLead(value) {
  const [first, ...rest] = String(value).split("\n");
  if (!rest.some((line) => line.trim())) return null;
  const lead = first.trim().replace(/[:.]$/, "");
  return MODE_OF_WORK.has(lead.toLowerCase()) ? lead : null;
}

function pupilWordingProblems(sheet) {
  const problems = [];

  const walk = (node, zoneId) => {
    if (Array.isArray(node)) {
      node.forEach((n) => walk(n, zoneId));
      return;
    }
    if (!node || typeof node !== "object") return;

    for (const [key, value] of Object.entries(node)) {
      if (typeof value === "string" && PUPIL_TEXT_FIELDS.has(key)) {
        for (const pattern of BUILDER_WORDING) {
          const hit = pattern.exec(value);
          if (!hit) continue;
          problems.push(
            `NOT_FOR_THE_CHILD: zone "${zoneId}" prints ${JSON.stringify(hit[0])} ` +
              `in its ${key}, which describes the page rather than the work. ` +
              `Say what the child does; let the helper supply the room to do it.`
          );
        }
        const lead = modeOfWorkLead(value);
        if (lead) {
          problems.push(
            `SECTION_LABEL_IN_TEXT: zone "${zoneId}" opens its ${key} with ` +
              `${JSON.stringify(lead)}, so the heading prints as part of the ` +
              `question. Lift it into a "section-label" helper above the block ` +
              `and leave the question its own words.`
          );
        }
      }
      walk(value, zoneId);
    }
  };

  for (const id of Object.keys(sheet.spec.zones || {}).sort()) {
    walk(sheet.spec.zones[id], id);
  }

  return problems;
}

// A `label-diagram` callout that does not say whether its word is PRINTED for
// the child or LEFT BLANK for the child to write.
//
// The helper's default is blank, and that default is right: on a worksheet,
// labelling is usually the child's job. What it cannot do is tell the
// difference between a designer who chose blank and a designer who never
// thought about it, and the two produce opposite pages from identical JSON.
//
// A Below sheet on balanced diets is the case. The adaptation asked for the
// words `bread roll` and `egg` printed beside the photograph, because the
// task underneath was to tick which body job each food does and a child who
// cannot name the food cannot start. The specification put both words in
// `labels` with no `given`, so the sheet printed two blank leader lines
// pointing at a lunch, the reading support the plan required arrived as an
// unasked question, and the build reported a clean fit (5 September 2026).
//
// So the intent is required here rather than defaulted here. Flipping the
// shared renderer's default instead would print the answers on every genuine
// labelling task in the plugin, on the board as well as on paper, which is the
// same fault pointing the other way. Requiring the author to state it costs one
// field and makes the two cases distinguishable at the point where the decision
// is actually made.
//
// This asks the author to DECIDE, not to decide a particular way: `given: true`
// and `given: false` are both correct answers, and a diagram can carry some of
// each. What it cannot be is unstated.
function labelIntentProblems(sheet) {
  const problems = [];

  const walk = (node, zoneId) => {
    if (Array.isArray(node)) {
      node.forEach((n) => walk(n, zoneId));
      return;
    }
    if (!node || typeof node !== "object") return;

    if (node.helper === "label-diagram" && Array.isArray(node.labels)) {
      const unstated = node.labels
        .filter((l) => l && typeof l === "object" && typeof l.given !== "boolean")
        .map((l) => l.label)
        .filter((word) => typeof word === "string" && word.length);
      if (unstated.length) {
        const words = unstated.map((w) => JSON.stringify(w)).join(", ");
        problems.push(
          `LABEL_INTENT_UNSTATED: zone "${zoneId}" has a label-diagram whose ` +
            `callout${unstated.length > 1 ? "s" : ""} for ${words} ` +
            `do${unstated.length > 1 ? "" : "es"} not say whether the word is ` +
            `printed on the sheet or left blank for the child. A callout with no ` +
            `"given" prints as a blank line, so a word the lesson meant as reading ` +
            `support becomes an unanswered question and the page still fits. ` +
            `Set "given": true on a word the sheet hands the child, "given": false ` +
            `on a part the child names. Read the lesson design or adaptation for ` +
            `which this one is; if it asked for the word to be printed, it is true.`
        );
      }
    }

    for (const value of Object.values(node)) walk(value, zoneId);
  };

  for (const id of Object.keys(sheet.spec.zones || {}).sort()) {
    walk(sheet.spec.zones[id], id);
  }

  return problems;
}

function checkWorksheet(worksheet) {
  return sheetsOf(worksheet)
    .map((sheet) => ({ ...sheet, ...problemsWith(sheet) }))
    .filter(
      (sheet) =>
        sheet.badZones.length ||
        sheet.tooTight.length ||
        sheet.wordBanks.length ||
        sheet.unprinted.length ||
        sheet.emptySets.length ||
        sheet.pupilWording.length ||
        sheet.labelIntent.length
    );
}

// A zone whose helper cannot read its own spec - a field misspelled, a field
// left out - throws from deep inside that helper's measurement. Left alone it
// reaches the teacher as a stack trace naming a line of geometry.js, which
// tells the one person who has to fix it (the designer) nothing at all.
//
// So each zone is measured on its own first, and anything it throws is turned
// back into the two facts that locate it: which sheet, and which zone.
function problemsWith(sheet) {
  const badZones = [];
  for (const [id, content] of Object.entries(sheet.spec.zones)) {
    try {
      checkFit({ ...sheet.spec, zones: { [id]: content } });
    } catch (e) {
      badZones.push(`zone "${id}" (${helperName(content)}): ${explain(e)}`);
    }
  }

  // Only worth asking whether the page holds them once every zone can draw
  // itself. Otherwise the real fault arrives underneath a fit report about a
  // zone that was never going to render.
  return {
    badZones,
    tooTight: badZones.length ? [] : checkFit(sheet.spec),
    wordBanks: badZones.length ? [] : wordBankProblems(sheet),
    unprinted: badZones.length ? [] : unprintedTextProblems(sheet),
    emptySets: badZones.length ? [] : emptySetProblems(sheet),
    pupilWording: badZones.length ? [] : pupilWordingProblems(sheet),
    labelIntent: badZones.length ? [] : labelIntentProblems(sheet),
  };
}

function helperName(content) {
  return (content && content.helper) || "no helper named";
}

// The engine's own refusals already read as English and say what to do: a
// ruler that will not shrink, a unit with no true size on paper. Those are
// passed through as they are.
//
// What is not worth passing through is JavaScript's account of a missing
// field, which is where a helper reaches for a list the spec never gave it:
// "Cannot read properties of undefined (reading 'reduce')". True and useless.
//
// Note what is NOT done here. That message looks like it names the missing
// field and does not: "reduce" is the thing the helper tried to DO to the
// field, not the field. Printing it would send the designer looking through
// the catalogue for a field that does not exist in any helper. Better to say
// plainly that a field is missing and let them compare the zone against the
// catalogue than to be confidently wrong about which one.
function explain(error) {
  const message = String((error && error.message) || error);
  if (/^[A-Z_]{3,}:/.test(message)) return message;

  if (/Cannot read propert|is not a function|is not iterable/.test(message)) {
    return "a field this helper needs is missing or is the wrong kind of thing. " +
      "Check the zone against the helper's entry in the catalogue.";
  }
  return `this helper could not read its spec: ${message}`;
}

module.exports = {
  PUPIL_SHEET_ORDER,
  SHEET_ORDER,
  SHEET_LABELS,
  SHEET_CODES,
  WorksheetError,
  sheetsOf,
  checkWorksheet,
  answerKeyOf,
  renderAnswerKey,
  questionCount,
  numbered,
  resolveAutoSheet,
  resolveAutoLayouts,
  // Exported so `suggest` can prepare content exactly as a build does. It used
  // to measure raw zones, which quietly made it a DIFFERENT question from the
  // one the build answers: writing lines were measured at the youngest year's
  // height, so a Year 4 sheet came back 15mm shorter than the build then found
  // it. A tool that recommends a layout the build refuses is worse than no
  // tool, because the designer trusts it and keeps guessing.
  withPhase,
  phaseFor,
  parseYearGroup,
};
