"use strict";

// A long written answer goes in the child's book, even on a sheet that is
// printed for every child.
//
// A sheet is "books" or "sheet" as a whole (src/slips.js), and a sheet that
// holds a table to fill in is printed. Everything on it then got its writing
// room printed too, so an extended answer the class would write in their books
// took ten ruled lines of the page - and the same question took ten lines in a
// box on one level and six with no box on the next, because two helpers rule
// lines and the designer chose afresh for each level (a Year 5 history sheet,
// the stress test of 7 October 2026). The teacher's ruling from those pages
// (9 October 2026): a task like that needs no lines, because they write in
// their books; the sheet keeps what is written ON it, and each part says
// plainly which it is, with the book mark or the pencil mark beside it.
//
// So on a "sheet" sheet a long answer prints as its question and a line saying
// where to write it, and the engine decides which answers are long, the same
// way on every level. A designer cannot choose it and cannot get round it:
//
//   written-answers   an item asking for BOOK_FROM_LINES lines or more
//   writing-frame     a frame with no heading of its own whose starters take
//                     that many lines between them: its starters stay, as they
//                     do on a slip, and the lines go
//   named-claim       explanation lines, the same count
//
// A writing frame WITH a heading is a named part of a planner ("Conclusion:
// what I think") and keeps its box and its lines: the box is what makes it a
// part of the plan.
//
// A short answer keeps its lines on the sheet. A "books" sheet is untouched:
// it prints as slips, which already carry no lines.

const { LINE_MM, PT_MM } = require("./shared");

const { TYPE } = require("../tokens");

// The mark under a question number, and the least height a marked question
// takes: its number's line, the mark, and a hair under it.
const MARK_MM = 4.2;
const NUMBER_LINE_MM = TYPE.questionNumber * PT_MM * 1.35;
const MARKED_QUESTION_MM = NUMBER_LINE_MM + MARK_MM + 0.4;

const BOOK_FROM_LINES = 4;
// `sentences` states the demand and the engine sizes the lines from the width,
// so the same question would be long in a narrow column and short across the
// page. Whether an answer is long is a fact about the answer, so it is read
// from the demand: four written things or more.
const BOOK_FROM_SENTENCES = 4;

const BOOK_PATH =
  "M12 6.5C9 4.6 5.6 4.3 2.5 5.2v13.6c3.1-.9 6.5-.6 9.5 1.3 3-1.9 6.4-2.2 9.5-1.3V5.2C18.4 4.3 15 4.6 12 6.5zM12 6.5v13.6";
const PENCIL_PATH =
  "M4 20l1.2-4.8L15.8 4.6a1.8 1.8 0 012.6 0l1 1a1.8 1.8 0 010 2.6L8.8 18.8zM14 6.4l3.6 3.6M5.2 15.2l3.6 3.6";

// Drawn, not an emoji: a school photocopier turns a colour emoji into a grey
// smudge, and a line drawing survives it.
function markIcon(kind, className) {
  const path = kind === "books" ? BOOK_PATH : PENCIL_PATH;
  return (
    `<svg class="${className}" viewBox="0 0 24 24" aria-label="${kind}">` +
    `<path d="${path}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`
  );
}

// The same drawing as a CSS background, for the mark beside a question number.
function markUrl(kind, colour) {
  const path = kind === "books" ? BOOK_PATH : PENCIL_PATH;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>` +
    `<path d='${path}' fill='none' stroke='${colour}' stroke-width='1.8' stroke-linejoin='round'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const applies = (spec) => Boolean(spec) && spec.longInBook === true && spec.slip !== true;

function itemAsksForLong(item) {
  if (!item || typeof item !== "object") return false;
  if (item.sentences !== undefined) return Number(item.sentences) >= BOOK_FROM_SENTENCES;
  return Number(item.lines) >= BOOK_FROM_LINES;
}

function answerInBook(spec, item) {
  return applies(spec) && itemAsksForLong(item);
}

function claimInBook(spec) {
  return applies(spec) && Number(spec.lines) >= BOOK_FROM_LINES;
}

function frameInBook(spec, linesOf) {
  if (!applies(spec) || spec.text) return false;
  const lines = (spec.starters || []).reduce((n, starter) => n + linesOf(starter), 0);
  return lines >= BOOK_FROM_LINES;
}

// The line that stands where the ruled lines would have been.
const BOOK_NOTE = "Write your answer in your book.";
const BOOK_NOTE_MM = LINE_MM;

function bookNoteHtml() {
  return `<p class="h-in-book">${markIcon("books", "h-in-book-icon")}<span>${BOOK_NOTE}</span></p>`;
}

const WRITING_HELPERS = new Set(["written-answers", "writing-frame", "named-claim"]);

// Tell every writing helper on a "sheet" sheet that its long answers go in the
// book. Set here, from the sheet's own recording, so no designer writes it.
function withLongAnswersInBooks(sheet) {
  if (!sheet || typeof sheet !== "object" || sheet.recording !== "sheet") return sheet;
  const flag = (node) => {
    if (Array.isArray(node)) return node.map(flag);
    if (!node || typeof node !== "object") return node;
    const out = {};
    for (const [key, value] of Object.entries(node)) out[key] = flag(value);
    if (WRITING_HELPERS.has(out.helper) && out.longInBook === undefined) out.longInBook = true;
    return out;
  };
  const out = { ...sheet };
  if (sheet.zones !== undefined) out.zones = flag(sheet.zones);
  if (Array.isArray(sheet.pages)) {
    out.pages = sheet.pages.map((page) =>
      page && typeof page === "object" && page.zones !== undefined
        ? { ...page, zones: flag(page.zones) }
        : page
    );
  }
  return out;
}

const css = `
  /* Where a long answer goes. Ink, at body size, with the book mark in front:
     it is an instruction to the child, the same as any other on the page. */
  .h-in-book {
    margin: 0; line-height: 1.35;
    display: flex; align-items: center; gap: var(--space-tight);
    color: var(--colour-ink);
  }
  .h-in-book-icon { flex: none; width: 1.2em; height: 1.2em; }

  /* On a sheet that holds both, every numbered question says which it is: a
     pencil under the number of a question answered on the sheet, a book under
     the number of one answered in the book. Painted as the question's own
     background, so it is inside the question's box and nothing overflows; the
     question is at least as tall as its number and the mark, and
     compose.js counts that same height (MARKED_QUESTION_MM). */
  .h-numbered--pencil, .h-numbered--book {
    min-height: ${MARKED_QUESTION_MM.toFixed(2)}mm;
    background-repeat: no-repeat;
    /* --mark-down is set in the page when the number is moved down to the
       line that asks (PLACE_QUESTION_NUMBERS in chrome.js). */
    background-position: 0.4mm calc(${NUMBER_LINE_MM.toFixed(2)}mm + var(--mark-down, 0px));
    background-size: ${MARK_MM}mm ${MARK_MM}mm;
  }
  .h-numbered--pencil { background-image: ${markUrl("sheet", "#666666")}; }
  .h-numbered--book { background-image: ${markUrl("books", "#666666")}; }
`;

module.exports = {
  BOOK_FROM_LINES,
  BOOK_FROM_SENTENCES,
  BOOK_NOTE,
  BOOK_NOTE_MM,
  MARKED_QUESTION_MM,
  markIcon,
  answerInBook,
  claimInBook,
  frameInBook,
  bookNoteHtml,
  withLongAnswersInBooks,
  css,
};
