"use strict";

// The teacher's answer sheet.
//
// Until 4.2.305 the key was a plain-text file listed by question number, and it
// did not get used: "This hasn't worked in my practise" (Daniel, 30 September
// 2026). A first mock-up mirrored every sheet with its answers filled in, and he
// called it too complicated. What he approved is a page a tired teacher reads at
// a glance with a pile of books beside them: one side of A4 turned sideways,
// each level in its own column, each question's label with a short answer in
// the deck's answer green, a few grey words only where they stop a marking
// mistake, and a small picture only when words cannot give the answer.
//
// It is a separate file from the pupil sheets, never a page of them, for the
// reason `sheets.answers` is refused: answers merged into a pupil print job get
// printed for children by accident.
//
// Old keys (before 4.2.305) wrote a whole model paragraph and an "Acceptance:"
// line into `answer`. They still build: the first line prints as the answer and
// each later line as a note, so a saved lesson can be rebuilt without a rerun.

const { cssVariables } = require("./tokens");
const { renderContent, helperCss } = require("./helpers");
const { esc } = require("./helpers/shared");
const { formatQuestionLabel } = require("./labels");
const { PALETTES } = require("../../shared/visuals/surface-profiles");

const {
  PUPIL_SHEET_ORDER: LEVEL_ORDER,
  SHEET_LABELS: LEVEL_LABELS,
  SHEET_CODES: LEVEL_CODES,
} = require("./worksheet");

// The deck's green, which means "answer" on the board. A pupil sheet never
// shows it as an answer (tokens.js); this page is the teacher's, where it does.
const ANSWER_GREEN = PALETTES.colour.answer;

const PAGE = { widthMm: 297, heightMm: 210, marginVMm: 10, marginHMm: 12 };
const COLUMNS = 3;
const COLUMN_GAP_MM = 8;
const LABEL_COLUMN_MM = 11;
const COLUMN_MM = (PAGE.widthMm - PAGE.marginHMm * 2 - COLUMN_GAP_MM * (COLUMNS - 1)) / COLUMNS;
const ANSWER_TEXT_MM = COLUMN_MM - LABEL_COLUMN_MM;

// Two sizes. The page prints at `normal`; a pack that runs past two sides
// steps down to `small` before it is allowed a third (Daniel's ruling, 30
// September 2026: shrink the text before a third side, never cut an answer).
const SIZES = {
  normal: { answerPt: 12.5, labelPt: 11, notePt: 9.5, headPt: 12, titlePt: 14 },
  small: { answerPt: 10, labelPt: 9, notePt: 8, headPt: 10.5, titlePt: 12 },
};
const MAX_SIDES = 2;

// An answer's printed lines, estimated from the words alone, so the preflight
// can see a paragraph without a browser. Comic Sans at the answer size sets
// about 2.55mm a character in the answer column (measured off the approved
// mock-up: "Yes. 0 can't go first, so 2" filled one line). An estimate, used
// for an advisory and for choosing the weight, never to refuse anything.
const CHAR_MM_AT_NORMAL = 2.55;

function estimatedLines(text, size = "normal") {
  const charMm = CHAR_MM_AT_NORMAL * (SIZES[size].answerPt / SIZES.normal.answerPt);
  const perLine = Math.max(8, Math.floor(ANSWER_TEXT_MM / charMm));
  let lines = 1;
  let used = 0;
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    const need = used ? used + 1 + word.length : word.length;
    if (need <= perLine) {
      used = need;
    } else {
      lines += 1;
      used = word.length;
    }
  }
  return lines;
}

// An entry as the page prints it: the answer, and its notes. An old key's
// extra lines become notes, with the "Acceptance:" or "Accept:" lead dropped
// because a note already reads as the acceptance.
function printedEntry(entry) {
  const lines = String(entry.answer).split("\n").map((line) => line.trim()).filter(Boolean);
  const answer = lines.shift() || "";
  const notes = lines
    .map((line) => line.replace(/^(acceptance|accept)\s*:\s*/i, ""))
    .map((line) => line.charAt(0).toUpperCase() + line.slice(1));
  if (entry.note) notes.push(entry.note);
  return { question: entry.question, answer, notes, picture: entry.picture || null };
}

// Every answer that would print past two lines, for the designer to hear.
// Advisory: the layout still prints it; this is how a model paragraph slipping
// back into the key gets seen.
function longAnswers(answerKey) {
  const found = [];
  for (const level of LEVEL_ORDER) {
    for (const entry of (answerKey && answerKey[level]) || []) {
      const { answer } = printedEntry(entry);
      const lines = estimatedLines(answer);
      if (lines > 2) found.push({ level, question: entry.question, lines });
    }
  }
  return found;
}

function longAnswerAdvisories(answerKey) {
  return longAnswers(answerKey).map(
    (f) =>
      `ANSWER_LONG: ${LEVEL_LABELS[f.level]} ${formatQuestionLabel(f.question)} prints about ` +
      `${f.lines} lines on the teacher's answer sheet. Give the answer and the one idea that ` +
      `decides the mark, in a line or two; the full model stays upstream.`
  );
}

function pictureHtml(picture, where, problems) {
  try {
    return `<div class="a-picture">${renderContent(picture, ANSWER_TEXT_MM)}</div>`;
  } catch (error) {
    // The answer still prints, as words: a drawing that cannot be made at
    // column width never costs the teacher the key.
    const reason = String((error && error.message) || error).split("\n")[0];
    problems.push(`ANSWER_PICTURE_SKIPPED: ${where} prints its answer as words; its picture could not be drawn at the answer sheet's column width (${reason}).`);
    return "";
  }
}

// `stoodIn` maps a level the Expected sheet stands in for to why, in words
// the teacher reads under the heading.
function answerSheetHtml(worksheet, answerKey, { stoodIn = {}, size = "normal" } = {}) {
  const meta = (worksheet && worksheet.meta) || {};
  const present = LEVEL_ORDER.filter((name) => worksheet.sheets && worksheet.sheets[name]);
  const coded = present.length > 1;
  const title = meta.lesson || meta.name || "Worksheet";
  const s = SIZES[size];
  const problems = [];

  const sections = present.map((name) => {
    const heading = coded ? `${LEVEL_LABELS[name]} (${LEVEL_CODES[name]})` : LEVEL_LABELS[name];
    const standIn = stoodIn[name]
      ? `<p class="a-standin">The Expected sheet stands in here for the ${esc(LEVEL_LABELS[name])} sheet, ${esc(stoodIn[name])}. These are the Expected answers.</p>`
      : "";
    const rows = (answerKey[name] || []).map((raw) => {
      const entry = printedEntry(raw);
      const long = estimatedLines(entry.answer, size) > 1;
      const where = `${LEVEL_LABELS[name]} ${formatQuestionLabel(entry.question)}`;
      return (
        `<div class="a-row">` +
        `<span class="a-label">${esc(formatQuestionLabel(entry.question))}</span>` +
        `<div class="a-body">` +
        `<span class="a-answer${long ? " a-answer--long" : ""}">${esc(entry.answer)}</span>` +
        entry.notes.map((note) => `<span class="a-note">${esc(note)}</span>`).join("") +
        (entry.picture ? pictureHtml(entry.picture, where, problems) : "") +
        `</div></div>`
      );
    });
    return `<section class="a-level"><h2>${esc(heading)}</h2>${standIn}${rows.join("")}</section>`;
  });

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${esc(title)} - Answers</title>
<style>
${cssVariables()}
${helperCss}
@page { size: ${PAGE.widthMm}mm ${PAGE.heightMm}mm; margin: ${PAGE.marginVMm}mm ${PAGE.marginHMm}mm; }
html, body { margin: 0; padding: 0; }
body { font-family: var(--font); color: var(--colour-ink); background: var(--colour-paper); }
.a-head { display: flex; justify-content: space-between; align-items: baseline;
  border-bottom: 0.4mm solid var(--colour-navy); margin-bottom: 5mm; }
.a-head h1 { font-size: ${s.titlePt}pt; color: var(--colour-navy); margin: 0 0 1mm; }
.a-head span { font-size: ${s.labelPt - 1}pt; color: var(--colour-quiet); }
.a-columns { column-count: ${COLUMNS}; column-gap: ${COLUMN_GAP_MM}mm;
  column-rule: 0.3mm dashed #bbbbbb; column-fill: auto; }
.a-level + .a-level { break-before: column; }
.a-level h2 { font-size: ${s.headPt}pt; color: var(--colour-paper); background: var(--colour-navy);
  padding: 1mm 2.5mm; margin: 0 0 3mm; break-after: avoid; }
.a-standin { font-size: ${s.notePt}pt; color: var(--colour-quiet); margin: 0 0 3mm; }
.a-row { display: grid; grid-template-columns: ${LABEL_COLUMN_MM}mm 1fr; margin-bottom: 3.2mm;
  break-inside: avoid; }
.a-label { color: var(--colour-question); font-weight: bold; font-size: ${s.labelPt}pt; padding-top: 0.5mm; }
.a-body { min-width: 0; }
.a-answer { display: block; color: ${ANSWER_GREEN}; font-weight: bold; font-size: ${s.answerPt}pt; line-height: 1.3; }
.a-answer--long { font-weight: normal; }
.a-note { display: block; color: var(--colour-quiet); font-size: ${s.notePt}pt; line-height: 1.3; margin-top: 0.4mm; }
.a-picture { margin-top: 1.5mm; }
</style></head>
<body>
<header class="a-head"><h1>${esc(title)} - Answers</h1><span>Teacher only</span></header>
<main class="a-columns">${sections.join("")}</main>
</body></html>`;
  return { html, problems };
}

async function pageCountOf(pdf) {
  const { PDFDocument } = require("pdf-lib");
  const doc = await PDFDocument.load(pdf);
  return doc.getPageCount();
}

// Print the answer sheet, stepping the text down before a third side.
// Returns { html, pdf, sides, size, problems }. `problems` are lines for the
// build to print: a picture that fell back to words, and a third side.
async function buildAnswerSheet({ worksheet, answerKey, stoodIn = {}, browser, htmlToPdf }) {
  let last = null;
  for (const size of ["normal", "small"]) {
    const { html, problems } = answerSheetHtml(worksheet, answerKey, { stoodIn, size });
    const pdf = await htmlToPdf(html, { browser });
    const sides = await pageCountOf(pdf);
    last = { html, pdf, sides, size, problems };
    if (sides <= MAX_SIDES) return last;
  }
  last.problems = [
    ...last.problems,
    `ANSWERS_THIRD_SIDE: the answer sheet runs to ${last.sides} sides even at its smallest text. ` +
      `Nothing was cut; long answers are what fill it (see any ANSWER_LONG above).`,
  ];
  return last;
}

module.exports = {
  answerSheetHtml,
  buildAnswerSheet,
  longAnswers,
  longAnswerAdvisories,
  estimatedLines,
  printedEntry,
  SIZES,
  MAX_SIDES,
  COLUMN_MM,
};
