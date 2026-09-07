"use strict";

// Comparing and ordering: the six things a maths sheet reaches for when the
// question is "which is bigger" or "put these in order".
//
// They share one shape. Something is HANDED to the child (two values, a set of
// numbers, a table of results, a choice of answers), and somewhere beside it is
// a place the child puts their answer (a box, a row of blanks, an empty table
// row, a circle drawn round one option). The colour system says the same thing:
// given material is orange, what the child writes is ink, and the question
// number is blue. No answer is ever shown, on any of them.
//
// Ported from the Word builder rather than redesigned, so a sheet that printed
// one way in Word prints the same way here. Where the two differed the Word
// builder's real geometry won, because that is what these already look like on
// paper.

const { BODY_PT, PT_MM, LINE_MM, WRITING_LINE_MM, esc, linesFor } = require("./shared");
const { TYPE, SPACE, RULE, INSET } = require("../tokens");

// Heights are measured at the WIDEST a zone could ever be, because text gets
// shorter as it gets wider: the widest case is the shortest the content can
// come out, which is what a minimum height has to be.
const WIDEST_ZONE_MM = 261; // the printable width of A4 landscape

// ─── sizes at a font other than body ─────────────────────────────────────
// LINE_MM and linesFor are both pinned to body size. Rather than restate the
// character metric that lives in shared.js, the width handed to linesFor is
// scaled: a line at 14pt holds 12/14 of what a line at 12pt holds, so passing
// widthMm × (12/14) gives the right answer without a second copy of the number.

function lineMmAt(pt) {
  return pt * PT_MM * 1.35;
}

function linesAt(text, widthMm, pt) {
  return linesFor(text, widthMm * (BODY_PT / pt));
}

// Roughly how wide a short string prints, plus one character of slack so that
// rounding never leaves a value a hair too wide for the space claimed for it.
// This is what the minimum widths below are built from: the smallest box in
// which a row of values still sits on ONE line. The test file checks the claim
// by measuring at the stated minimum, so this cannot drift from linesFor
// without something failing.
const CHAR_WIDTH_FACTOR = 0.5; // tracks CHAR_WIDTH_FACTOR in shared.js

function textWidthMm(text, pt) {
  return (String(text ?? "").length + 1) * pt * PT_MM * CHAR_WIDTH_FACTOR;
}

// ─── parts every question here shares ────────────────────────────────────

const NUM_MIN_MM = 5; // the blue number's own column
const NUM_GUTTER_MM = NUM_MIN_MM + SPACE.tight; // and the gap after it

function hasNumber(spec) {
  return spec.id != null && spec.id !== "";
}

function numGutterMm(spec) {
  return hasNumber(spec) ? NUM_GUTTER_MM : 0;
}

function questionNumber(spec) {
  return hasNumber(spec) ? `<span class="h-cq-num">(${esc(String(spec.id))})</span>` : "";
}

// A follow-up prompt with ruled lines under it: "Explain how you worked it
// out." Two lines a mark, which is the Word builder's own rule, and `marks: 0`
// means a prompt with no lines rather than the default one mark.
const LINES_PER_MARK = 2;

function followUpLineCount(followUp) {
  if (!followUp) return 0;
  if (followUp.marks === 0) return 0;
  return Math.max(1, (followUp.marks ?? 1) * LINES_PER_MARK);
}

function writingLineMm(spec) {
  return WRITING_LINE_MM[spec.phase === "upper" ? "upper" : "lower"];
}

function renderFollowUp(spec) {
  const followUp = spec.followUp;
  if (!followUp) return "";
  const lineMm = writingLineMm(spec);
  const lines = Array.from(
    { length: followUpLineCount(followUp) },
    () => `<span class="h-cq-line" style="height:${lineMm}mm"></span>`
  ).join("");
  return `
      <div class="h-cq-followup">
        <p class="h-cq-followup-text">${esc(followUp.text)}</p>
        ${lines}
      </div>`;
}

function followUpMm(spec, widthMm) {
  const followUp = spec.followUp;
  if (!followUp) return 0;
  return (
    SPACE.item + // margin-top on .h-cq-followup
    linesFor(followUp.text, widthMm) * LINE_MM +
    SPACE.hair + // margin-bottom on the prompt
    followUpLineCount(followUp) * writingLineMm(spec)
  );
}

// A row of blanks with a separator between them: "____ < ____ < ____". Used by
// order-numbers and by data-table-with-ordering, which is why the geometry
// lives in one place.
const ORDER_BLANK_MM = 9; // tall enough for a nine-year-old's figures
const ORDER_BLANK_MIN_MM = 16; // and wide enough for "0.34" or "3.7m"
const ORDER_SEP_MM = 5; // the "<" or "," between two blanks
const ORDER_GAP_MM = SPACE.tight; // the flex gap between every child of the row

function orderingSlots(count, separator) {
  return Array.from(
    { length: count },
    (unused, i) =>
      `${i ? `<span class="h-order-sep">${esc(separator)}</span>` : ""}<span class="h-order-blank"></span>`
  ).join("");
}

// The narrowest this row fits on ONE line. Every child of the flex row is
// counted, including the labels a data table's ordering row carries, because
// the gaps between them are real millimetres.
function orderingRowMm(blanks, labelWidthsMm = []) {
  const children = blanks + Math.max(0, blanks - 1) + labelWidthsMm.length;
  return (
    blanks * ORDER_BLANK_MIN_MM +
    Math.max(0, blanks - 1) * ORDER_SEP_MM +
    labelWidthsMm.reduce((a, b) => a + b, 0) +
    Math.max(0, children - 1) * ORDER_GAP_MM
  );
}

function orderingHeightMm(blanks, widthMm, labelWidthsMm = []) {
  const rows = Math.max(
    1,
    Math.ceil(orderingRowMm(blanks, labelWidthsMm) / Math.max(10, widthMm))
  );
  return SPACE.tight + rows * ORDER_BLANK_MM + (rows - 1) * ORDER_GAP_MM;
}

// A table cell's own padding and its share of the collapsed hairline border.
// Both come straight from .h-table in tables.js, which these two tables reuse
// so that one look and one set of numbers serve every table on a sheet.
// A table cell, and it already sat exactly on the cell inset before the scale
// existed: 1mm above and below, 2mm each side. It is one of the values the
// scale was drawn from rather than one the scale had to move.
const TABLE_PAD_MM = INSET.cell.v * 2; // above plus below
const TABLE_PAD_H_MM = INSET.cell.h; // each side, which a cell's text does not get
// Comes from the design system's line weights rather than a number
// chosen here, so every box on a sheet is drawn with the same pen.
const TABLE_BORDER_MM = RULE.line;

function stemMm(spec, widthMm) {
  if (!spec.text) return 0;
  return linesFor(spec.text, widthMm - numGutterMm(spec)) * LINE_MM + SPACE.tight;
}

// ─── compare-row ─────────────────────────────────────────────────────────
// Two values with an empty box between them, for < > = work. The box is the
// whole question, so it is sized for a child's pencil rather than for the
// symbol it will hold.

const COMPARE_BOX_MM = 12;
const COMPARE_GAP_MM = SPACE.item; // either side of the box
const COMPARE_VALUE_MIN_MM = 16; // a short value still gets room to sit in

function compareLeadMm(spec) {
  return numGutterMm(spec);
}

function compareSideMm(spec, widthMm) {
  return Math.max(
    8,
    (widthMm - compareLeadMm(spec) - 2 * COMPARE_GAP_MM - COMPARE_BOX_MM) / 2
  );
}

function renderCompareRow(spec) {
  return `
    <div class="h-cmp">
      ${questionNumber(spec)}
      <span class="h-cmp-value">${esc(spec.left)}</span>
      <span class="h-cmp-box"></span>
      <span class="h-cmp-value">${esc(spec.right)}</span>
    </div>`;
}

function measureCompareRow(spec, widthMm) {
  const sideMm = compareSideMm(spec, widthMm);
  const lines = Math.max(linesFor(spec.left, sideMm), linesFor(spec.right, sideMm));
  return Math.max(COMPARE_BOX_MM, lines * LINE_MM) + SPACE.tight;
}

function needsCompareRow(spec) {
  const valueMm = Math.max(
    COMPARE_VALUE_MIN_MM,
    textWidthMm(spec.left, TYPE.body),
    textWidthMm(spec.right, TYPE.body)
  );
  return {
    // "£3.40 versus 340p" is a wider question than "2.3 versus 7.1", and a
    // constant per helper cannot know that: it would wrap the longer pair onto
    // two lines inside a box drawn for one.
    minWidthMm: Math.min(
      WIDEST_ZONE_MM,
      compareLeadMm(spec) + 2 * COMPARE_GAP_MM + COMPARE_BOX_MM + 2 * valueMm
    ),
    minHeightMm: measureCompareRow(spec, WIDEST_ZONE_MM),
  };
}

// ─── inequality-with-boxes ───────────────────────────────────────────────
// A displayed statement in which some tokens are boxes to fill: "5 . □ 2 < 5 .
// □ 8". Every token is space separated, a □ (or a run of two or more
// underscores) becomes a real empty box, and everything else prints as a bold
// character. The one thing this helper must never do is print a box that
// already has something in it.

const INEQ_BOX_MM = 11; // a written digit, at the size the tokens print
const INEQ_TOKEN_MIN_MM = 6;
const INEQ_TOKEN_PAD_MM = INSET.cell.h;
const INEQ_PT = TYPE.sectionLabel; // the statement is displayed, not body text
const INEQ_GAP_MM = SPACE.hair;
const INEQ_PAD_MM = INSET.card.v; // above and below the row

function inequalityTokens(spec) {
  return String(spec.expression ?? "").trim().split(/\s+/).filter(Boolean);
}

function isBoxToken(token) {
  return token === "□" || /^_{2,}$/.test(token);
}

function tokenWidthMm(token) {
  if (isBoxToken(token)) return INEQ_BOX_MM;
  return Math.max(INEQ_TOKEN_MIN_MM, textWidthMm(token, INEQ_PT) + INEQ_TOKEN_PAD_MM);
}

function inequalityRowMm(tokens) {
  return (
    tokens.reduce((w, t) => w + tokenWidthMm(t), 0) +
    Math.max(0, tokens.length - 1) * INEQ_GAP_MM
  );
}

function renderInequalityWithBoxes(spec) {
  const cells = inequalityTokens(spec)
    .map((token) =>
      isBoxToken(token)
        ? `<span class="h-ineq-box"></span>`
        : `<span class="h-ineq-token">${esc(token)}</span>`
    )
    .join("");
  return `
    <div class="h-ineq">
      ${spec.text ? `<p class="h-cq-stem">${questionNumber(spec)}${esc(spec.text)}</p>` : ""}
      <div class="h-ineq-row">${cells}</div>
    </div>`;
}

function inequalityBodyMm(spec, widthMm) {
  const tokens = inequalityTokens(spec);
  const rows = Math.max(
    1,
    Math.ceil(inequalityRowMm(tokens) / Math.max(10, widthMm))
  );
  const rowMm = Math.max(INEQ_BOX_MM, lineMmAt(INEQ_PT)) + 2 * INEQ_PAD_MM;
  return rows * rowMm;
}

function measureInequalityWithBoxes(spec, widthMm) {
  return stemMm(spec, widthMm) + inequalityBodyMm(spec, widthMm);
}

function needsInequalityWithBoxes(spec) {
  return {
    // A statement broken across two lines stops being a statement: a child
    // reading "5 . □ 2 <" on one line and "5 . □ 8" on the next has to
    // reassemble it before they can compare anything. So the whole expression
    // is the minimum, and a longer one needs more room than a shorter one.
    minWidthMm: Math.min(WIDEST_ZONE_MM, inequalityRowMm(inequalityTokens(spec))),
    minHeightMm: measureInequalityWithBoxes(spec, WIDEST_ZONE_MM),
  };
}

// ─── number-sentence ─────────────────────────────────────────────────────
// A number sentence written out as the thing it is: values HANDED to the child
// as separate tiles, operators between them, and a real target wherever the
// answer goes.
//
// This exists because the alternative was typing the sentence into a question
// stem and putting a blank after it. "9 + 4,000 + 50 + 200 =" set as running
// text is four values a child has to pick out of a line of prose before they
// can start, and the space they answer in is whatever the prompt's blank
// happens to be. Separating the terms is not decoration: mixed-order addition
// IS the recombining, and the page should show the pieces being recombined.
//
// Three kinds of term, and each says exactly one thing:
//
//   { value: 4000 }        material handed over. Given colour, on its own tile.
//   { blank: true }        somewhere to write one thing. Sized by `chars`.
//   { cells: 4 }           a segmented frame, one cell per digit, for an answer
//                          whose DIGITS are the point.
//
// Operators are plain strings between the terms, so the spec reads in the order
// the sentence does. `value: 0` prints "0": a given zero is a real term, and
// reading a term for truthiness is how a zero silently becomes a blank.
//
// The helper never evaluates anything. A blank stays blank however obvious its
// answer is, and there is no field that would let one be filled in.

const NS_PT = TYPE.sectionLabel; // displayed, like an inequality
const NS_CELL_MM = 8; // one digit in a nine-year-old's hand
const NS_BOX_MIN_MM = 12;
const NS_BOX_H_MM = WRITING_LINE_MM.lower; // a box written in, not a box read
const NS_TILE_MIN_MM = 10;
const NS_GAP_MM = SPACE.tight;
const NS_PAD_MM = INSET.card.v;
const NS_CAPTION_MM = TYPE.note * PT_MM * 1.35 + SPACE.hair;
// BLANK_MM over BLANK_CHARS: the engine's own answer for how wide a write-in
// blank is per character, rather than a second number chosen here.
const NS_CHAR_MM = 25 / 12;

function numberSentenceTerms(spec) {
  const terms = spec.terms;
  if (!Array.isArray(terms) || terms.length === 0) {
    throw new Error("number-sentence: `terms` must list the terms and operators");
  }
  return terms;
}

function isOperator(term) {
  return typeof term === "string" || typeof term === "number";
}

function termChars(term) {
  const stated = term.chars;
  if (stated == null) return 4;
  if (typeof stated !== "number" || !Number.isFinite(stated) || stated < 1 || stated > 40) {
    throw new Error("number-sentence: `chars` must be a number from 1 to 40");
  }
  return Math.ceil(stated);
}

function termCells(term) {
  const cells = term.cells;
  if (typeof cells !== "number" || !Number.isFinite(cells) || cells < 1 || cells > 12) {
    throw new Error("number-sentence: `cells` must be a whole number from 1 to 12");
  }
  return Math.floor(cells);
}

// What each term IS, checked once, so a term that says two things at once is
// refused rather than silently ranked. A tile carrying a value and also marked
// blank is the one mistake that would put an answer on a pupil sheet.
function termKind(term) {
  if (isOperator(term)) return "operator";
  if (term && typeof term === "object" && term.heading != null && term.blank === undefined
      && term.value === undefined && term.text === undefined && term.cells === undefined) {
    throw new Error(
      "number-sentence: a term with a `heading` still has to say what it IS."
    );
  }
  if (!term || typeof term !== "object") {
    throw new Error("number-sentence: a term is an operator string or an object");
  }
  const hasValue = term.value != null && term.value !== "";
  const hasText = term.text != null && term.text !== "";
  const blank = term.blank === true;
  const cells = term.cells != null;
  const stated = [hasValue, hasText, blank, cells].filter(Boolean).length;
  if (stated !== 1) {
    throw new Error(
      "number-sentence: every term states exactly one of `value` (handed to " +
        "the child), `text` (a word they read), `blank` (somewhere to write) " +
        "or `cells` (a digit frame). This one states " +
        stated +
        "."
    );
  }
  if (hasValue) return "value";
  if (hasText) return "text";
  if (blank) return "blank";
  return "cells";
}

function termWidthMm(term) {
  const kind = termKind(term);
  if (kind === "operator") {
    return Math.max(4, textWidthMm(String(term), NS_PT));
  }
  if (kind === "cells") return termCells(term) * NS_CELL_MM;
  if (kind === "blank") {
    return Math.max(NS_BOX_MIN_MM, termChars(term) * NS_CHAR_MM + 2 * INSET.card.h);
  }
  const text = kind === "value" ? String(term.value) : String(term.text);
  return Math.max(NS_TILE_MIN_MM, textWidthMm(text, NS_PT) + 2 * INSET.card.h);
}

function numberSentenceRowMm(spec) {
  const terms = numberSentenceTerms(spec);
  return (
    terms.reduce((w, t) => w + termWidthMm(t), 0) +
    Math.max(0, terms.length - 1) * NS_GAP_MM
  );
}

function numberSentenceHasCaption(spec) {
  return numberSentenceTerms(spec).some(
    (t) => !isOperator(t) && t.caption != null && t.caption !== ""
  );
}

// A heading names the COLUMN a term stands in, which is what a record needs
// and a single sentence does not: six blank rows with nothing over them leave
// a child to work out which half is the number and which is its expansion.
// It sits above the row, left-aligned to the term it heads, and is allowed to
// run on over the terms that follow - "Expanded form" heads four blanks and
// there is no sensible way to centre it over one of them.
function numberSentenceHasHeading(spec) {
  return numberSentenceTerms(spec).some(
    (t) => !isOperator(t) && t.heading != null && t.heading !== ""
  );
}

function renderTerm(term) {
  const kind = termKind(term);
  if (kind === "operator") {
    return `<span class="h-ns-op">${esc(String(term))}</span>`;
  }

  // Under the term, not in it. A caption names what the term is for; a child
  // must never read it as something already written in the space they are
  // about to write in.
  const caption =
    term.caption != null && term.caption !== ""
      ? `<span class="h-ns-caption">${esc(term.caption)}</span>`
      : "";

  let body;
  if (kind === "cells") {
    const cells = Array.from(
      { length: termCells(term) },
      () => `<span class="h-ns-cell"></span>`
    ).join("");
    body = `<span class="h-ns-cells">${cells}</span>`;
  } else if (kind === "blank") {
    body = `<span class="h-ns-box" style="width:${termWidthMm(term)}mm"></span>`;
  } else if (kind === "value") {
    body = `<span class="h-ns-tile">${esc(String(term.value))}</span>`;
  } else {
    body = `<span class="h-ns-text">${esc(String(term.text))}</span>`;
  }
  return `<span class="h-ns-term">${body}${caption}</span>`;
}

// A heading spans from its own term to just before the next one that carries a
// heading, so "Expanded form" is one cell as wide as the four blanks and three
// operators it names rather than a word overflowing the first blank.
function headingCells(spec) {
  const terms = numberSentenceTerms(spec);
  const cells = [];
  terms.forEach((term, i) => {
    const heading =
      !isOperator(term) && term.heading != null && term.heading !== ""
        ? String(term.heading)
        : null;
    const width = termWidthMm(term);
    if (heading || cells.length === 0) {
      cells.push({ text: heading || "", widthMm: width });
    } else {
      const last = cells[cells.length - 1];
      last.widthMm += NS_GAP_MM + width;
    }
  });
  return cells;
}

function renderHeadings(spec) {
  if (!numberSentenceHasHeading(spec)) return "";
  const cells = headingCells(spec)
    .map(
      (cell) =>
        `<span class="h-ns-head" style="width:${cell.widthMm}mm">${esc(cell.text)}</span>`
    )
    .join("");
  return `<div class="h-ns-heads">${cells}</div>`;
}

function renderNumberSentence(spec) {
  const terms = numberSentenceTerms(spec).map(renderTerm).join("");
  return `
    <div class="h-ns">
      ${spec.text ? `<p class="h-cq-stem">${questionNumber(spec)}${esc(spec.text)}</p>` : ""}
      ${renderHeadings(spec)}
      <div class="h-ns-row">${spec.text ? "" : questionNumber(spec)}${terms}</div>
    </div>`;
}

function numberSentenceBodyMm(spec) {
  const rowMm = Math.max(NS_BOX_H_MM, NS_CELL_MM, lineMmAt(NS_PT)) + 2 * NS_PAD_MM;
  return (
    rowMm +
    (numberSentenceHasCaption(spec) ? NS_CAPTION_MM : 0) +
    (numberSentenceHasHeading(spec) ? NS_CAPTION_MM : 0)
  );
}

function measureNumberSentence(spec, widthMm) {
  return stemMm(spec, widthMm) + numberSentenceBodyMm(spec);
}

function needsNumberSentence(spec) {
  // A number sentence broken across two lines stops being a sentence: the
  // child has to reassemble it before they can work on it, and the answer
  // target ends up on a different line from the values it belongs to. So the
  // whole row is the minimum, exactly as an inequality's is.
  const rowMm = numberSentenceRowMm(spec) + numGutterMm(spec);
  return {
    minWidthMm: Math.min(WIDEST_ZONE_MM, rowMm),
    minHeightMm: measureNumberSentence(spec, WIDEST_ZONE_MM),
  };
}

// ─── order-numbers ───────────────────────────────────────────────────────
// The numbers to order on a tinted card, and under it one blank per number
// with the separator between them. The count of blanks is not a choice: four
// numbers ordered into three blanks is a question nobody can answer.

// The card the scale's card step was drawn from: tighter top to bottom than
// side to side, which is the rule the other two cards were not following.
const CARD_PAD_V_MM = INSET.card.v;
const CARD_PAD_H_MM = INSET.card.h;
const CARD_BORDER_MM = RULE.line;
const CARD_ITEM_GAP_MM = 5; // the numbers sit well apart, not as one string

function cardContentMm(numbers) {
  return (
    numbers.reduce((w, n) => w + textWidthMm(n, TYPE.body), 0) +
    Math.max(0, numbers.length - 1) * CARD_ITEM_GAP_MM
  );
}

function cardHeightMm(numbers, widthMm, leadMm) {
  const inner = Math.max(
    10,
    widthMm - leadMm - 2 * CARD_PAD_H_MM - 2 * CARD_BORDER_MM
  );
  const lines = Math.max(1, Math.ceil(cardContentMm(numbers) / inner));
  return lines * LINE_MM + 2 * CARD_PAD_V_MM + 2 * CARD_BORDER_MM;
}

function renderOrderNumbers(spec) {
  const numbers = spec.numbers || [];
  const separator = spec.separator || "<";
  const number = questionNumber(spec);
  const card = `<div class="h-order-card">${numbers
    .map((n) => `<span class="h-order-given">${esc(n)}</span>`)
    .join("")}</div>`;

  return `
    <div class="h-order">
      ${spec.prompt ? `<p class="h-cq-stem">${number}${esc(spec.prompt)}</p>` : ""}
      <div class="h-order-line">${spec.prompt ? "" : number}${card}</div>
      <div class="h-order-blanks">${orderingSlots(numbers.length, separator)}</div>
    </div>`;
}

function measureOrderNumbers(spec, widthMm) {
  const numbers = spec.numbers || [];
  const leadMm = spec.prompt ? 0 : numGutterMm(spec);
  const promptMm = spec.prompt
    ? linesFor(spec.prompt, widthMm - numGutterMm(spec)) * LINE_MM + SPACE.tight
    : 0;
  return (
    promptMm +
    cardHeightMm(numbers, widthMm, leadMm) +
    orderingHeightMm(numbers.length, widthMm)
  );
}

function needsOrderNumbers(spec) {
  const numbers = spec.numbers || [];
  const leadMm = spec.prompt ? 0 : numGutterMm(spec);
  return {
    // Six numbers to order need more width than three, in the card AND in the
    // row of blanks beneath it. Whichever of the two is hungrier decides.
    minWidthMm: Math.min(
      WIDEST_ZONE_MM,
      Math.max(
        leadMm + cardContentMm(numbers) + 2 * CARD_PAD_H_MM + 2 * CARD_BORDER_MM,
        orderingRowMm(numbers.length)
      )
    ),
    minHeightMm: measureOrderNumbers(spec, WIDEST_ZONE_MM),
  };
}

// ─── order-table ─────────────────────────────────────────────────────────
// The same task as order-numbers, laid out as a two-row table: the values on
// top, an empty cell under each one. The bottom row is the answer, so it is
// sized for writing rather than for reading.

const ORDER_WRITE_ROW_MM = 14;
const ORDER_CELL_MIN_MM = 18;
const ORDER_LABEL_MIN_MM = 26; // "Smallest → Largest" on no more than two lines
const ORDER_LABEL_MAX_MM = 40;

function orderLabelMm(widthMm) {
  return Math.max(ORDER_LABEL_MIN_MM, Math.min(ORDER_LABEL_MAX_MM, widthMm * 0.28));
}

function orderTableLabels(spec) {
  return {
    topLabel: spec.topLabel ?? "Numbers",
    bottomLabel: spec.bottomLabel ?? "Smallest → Largest",
  };
}

function renderOrderTable(spec) {
  const numbers = spec.numbers || [];
  const { topLabel, bottomLabel } = orderTableLabels(spec);
  const given = numbers.map((n) => `<td class="h-cq-given">${esc(n)}</td>`).join("");
  const blanks = numbers
    .map(() => `<td class="h-cq-write" style="height:${ORDER_WRITE_ROW_MM}mm"></td>`)
    .join("");

  return `
    <div class="h-ordertable">
      ${spec.text ? `<p class="h-cq-stem">${questionNumber(spec)}${esc(spec.text)}</p>` : ""}
      <table class="h-table h-cq-grid h-ordertable-grid">
        <tbody>
          <tr><th scope="row">${esc(topLabel)}</th>${given}</tr>
          <tr class="h-ordertable-answer"><th scope="row">${esc(bottomLabel)}</th>${blanks}</tr>
        </tbody>
      </table>
      ${renderFollowUp(spec)}
    </div>`;
}

function measureOrderTable(spec, widthMm) {
  const numbers = spec.numbers || [];
  const { topLabel, bottomLabel } = orderTableLabels(spec);
  const labelMm = Math.max(6, orderLabelMm(widthMm) - 2 * TABLE_PAD_H_MM);
  const cellMm = Math.max(
    6,
    (widthMm - orderLabelMm(widthMm)) / Math.max(1, numbers.length) - 2 * TABLE_PAD_H_MM
  );

  const topLines = Math.max(
    1,
    linesFor(topLabel, labelMm),
    ...numbers.map((n) => linesFor(n, cellMm))
  );
  const topRowMm = topLines * LINE_MM + TABLE_PAD_MM + TABLE_BORDER_MM;
  const bottomRowMm =
    Math.max(ORDER_WRITE_ROW_MM, linesFor(bottomLabel, labelMm) * LINE_MM) +
    TABLE_PAD_MM +
    TABLE_BORDER_MM;

  return (
    stemMm(spec, widthMm) +
    topRowMm +
    bottomRowMm +
    TABLE_BORDER_MM + // the table's own outer edge
    followUpMm(spec, widthMm)
  );
}

function needsOrderTable(spec) {
  const numbers = spec.numbers || [];
  return {
    // A cell a child writes a decimal into cannot be narrow, and six of them
    // need more room than three. This is the mistake a constant makes: it
    // reports no problem while the table is sliced down its right-hand edge.
    minWidthMm: Math.min(
      WIDEST_ZONE_MM,
      ORDER_LABEL_MIN_MM + numbers.length * ORDER_CELL_MIN_MM
    ),
    minHeightMm: measureOrderTable(spec, WIDEST_ZONE_MM),
  };
}

// ─── data-table-with-ordering ────────────────────────────────────────────
// A stem, a table of results handed to the child, a row of blanks to order
// them into, and room to explain. "Four children jumped in PE. Order the
// distances shortest to longest."

const DATA_CELL_MIN_MM = 20;
const DATA_LABEL_MIN_MM = 24;

function dataRows(spec) {
  return spec.rows || [];
}

function dataColumnCount(spec) {
  return dataRows(spec).reduce((n, r) => Math.max(n, (r.values || []).length), 0);
}

function orderingOf(spec) {
  const ordering = spec.ordering || {};
  return {
    leftLabel: ordering.leftLabel,
    rightLabel: ordering.rightLabel,
    blanks: ordering.blanks ?? dataColumnCount(spec),
    separator: ordering.separator || "<",
  };
}

function orderingLabelWidths(ordering) {
  return [ordering.leftLabel, ordering.rightLabel]
    .filter((l) => l != null && l !== "")
    .map((l) => textWidthMm(l, TYPE.body));
}

function renderDataTableWithOrdering(spec) {
  const ordering = orderingOf(spec);
  const body = dataRows(spec)
    .map(
      (row) =>
        `<tr><th scope="row">${esc(row.label)}</th>${(row.values || [])
          .map((v) => `<td class="h-cq-given">${esc(v)}</td>`)
          .join("")}</tr>`
    )
    .join("");

  const label = (text) =>
    text == null || text === "" ? "" : `<span class="h-dto-label">${esc(text)}</span>`;

  return `
    <div class="h-dto">
      ${spec.text ? `<p class="h-cq-stem">${questionNumber(spec)}${esc(spec.text)}</p>` : ""}
      <table class="h-table h-cq-grid h-dto-grid"><tbody>${body}</tbody></table>
      <div class="h-order-blanks">
        ${label(ordering.leftLabel)}${orderingSlots(ordering.blanks, ordering.separator)}${label(ordering.rightLabel)}
      </div>
      ${renderFollowUp(spec)}
    </div>`;
}

function dataTableHeightMm(spec, widthMm) {
  const rows = dataRows(spec);
  const columns = Math.max(1, dataColumnCount(spec));
  const labelMm = Math.max(6, orderLabelMm(widthMm) - 2 * TABLE_PAD_H_MM);
  const cellMm = Math.max(
    6,
    (widthMm - orderLabelMm(widthMm)) / columns - 2 * TABLE_PAD_H_MM
  );

  return (
    rows.reduce((h, row) => {
      const lines = Math.max(
        1,
        linesFor(row.label, labelMm),
        ...(row.values || []).map((v) => linesFor(v, cellMm))
      );
      return h + lines * LINE_MM + TABLE_PAD_MM + TABLE_BORDER_MM;
    }, 0) + TABLE_BORDER_MM
  );
}

function measureDataTableWithOrdering(spec, widthMm) {
  const ordering = orderingOf(spec);
  return (
    stemMm(spec, widthMm) +
    dataTableHeightMm(spec, widthMm) +
    orderingHeightMm(ordering.blanks, widthMm, orderingLabelWidths(ordering)) +
    followUpMm(spec, widthMm)
  );
}

function needsDataTableWithOrdering(spec) {
  const ordering = orderingOf(spec);
  return {
    // Two things here grow independently: how many values the table carries
    // across, and how many blanks the ordering row asks for. Either can be the
    // wider of the two, so both are asked.
    minWidthMm: Math.min(
      WIDEST_ZONE_MM,
      Math.max(
        DATA_LABEL_MIN_MM + Math.max(1, dataColumnCount(spec)) * DATA_CELL_MIN_MM,
        orderingRowMm(ordering.blanks, orderingLabelWidths(ordering))
      )
    ),
    // And a table of five rows is taller than one of two, which a constant
    // would flatten into the same number.
    minHeightMm: measureDataTableWithOrdering(spec, WIDEST_ZONE_MM),
  };
}

// ─── circle-the-answer ───────────────────────────────────────────────────
// A prompt, the options, and room to explain. Options only stay side by side
// while they are short enough to read as separate targets on one line: a
// sentence-length option joined inline wraps mid-option, the alternatives stop
// being visually separable, and the child cannot see where one choice ends and
// the next begins. Past that width each option takes its own line. Both limits
// are the Word builder's own.

const CIRCLE_OPTION_INLINE_MAX_CHARS = 24;
const CIRCLE_OPTIONS_INLINE_TOTAL_MAX_CHARS = 56;
const CIRCLE_PT = TYPE.question;
const CIRCLE_ROOM_MM = 3; // above and below, so a drawn circle does not collide
const CIRCLE_INLINE_GAP_MM = 10; // and enough between them to circle just one
const CIRCLE_INDENT_MM = 6;
const CIRCLE_MIN_MM = 60;

function circleOptions(spec) {
  return (spec.options || []).map((o) => String(o ?? ""));
}

function circleOptionsFitInline(options) {
  if (options.some((t) => t.length > CIRCLE_OPTION_INLINE_MAX_CHARS)) return false;
  const total = options.reduce((sum, t) => sum + t.length, 0);
  return total <= CIRCLE_OPTIONS_INLINE_TOTAL_MAX_CHARS;
}

function circleInlineRowMm(options) {
  return (
    options.reduce((w, o) => w + textWidthMm(o, CIRCLE_PT), 0) +
    Math.max(0, options.length - 1) * CIRCLE_INLINE_GAP_MM
  );
}

function renderCircleTheAnswer(spec) {
  const options = circleOptions(spec);
  const body = circleOptionsFitInline(options)
    ? `<p class="h-circle-row">${options
        .map((o) => `<span class="h-circle-option">${esc(o)}</span>`)
        .join("")}</p>`
    : `<ul class="h-circle-list">${options
        .map((o) => `<li class="h-circle-option">${esc(o)}</li>`)
        .join("")}</ul>`;

  return `
    <div class="h-circle">
      ${spec.prompt ? `<p class="h-cq-stem">${questionNumber(spec)}${esc(spec.prompt)}</p>` : ""}
      ${body}
      ${renderFollowUp(spec)}
    </div>`;
}

function circleOptionsMm(spec, widthMm) {
  const options = circleOptions(spec);
  const optionLineMm = lineMmAt(CIRCLE_PT);

  if (circleOptionsFitInline(options)) {
    const rows = Math.max(
      1,
      Math.ceil(circleInlineRowMm(options) / Math.max(10, widthMm))
    );
    return rows * (optionLineMm + 2 * CIRCLE_ROOM_MM);
  }

  return options.reduce(
    (h, o) =>
      h +
      linesAt(o, Math.max(10, widthMm - CIRCLE_INDENT_MM), CIRCLE_PT) * optionLineMm +
      2 * CIRCLE_ROOM_MM,
    0
  );
}

function measureCircleTheAnswer(spec, widthMm) {
  const promptMm = spec.prompt
    ? linesFor(spec.prompt, widthMm - numGutterMm(spec)) * LINE_MM + SPACE.tight
    : 0;
  return promptMm + circleOptionsMm(spec, widthMm) + followUpMm(spec, widthMm);
}

function needsCircleTheAnswer(spec) {
  const options = circleOptions(spec);
  const inline = circleOptionsFitInline(options);
  const widest = options.reduce(
    (w, o) => Math.max(w, textWidthMm(o, CIRCLE_PT)),
    0
  );
  return {
    // Inline, four options need more width than two, because they share one
    // line and each has to stay its own circleable target. Stacked, the width
    // is set by the longest option instead.
    minWidthMm: Math.min(
      WIDEST_ZONE_MM,
      Math.max(CIRCLE_MIN_MM, inline ? circleInlineRowMm(options) : CIRCLE_INDENT_MM + widest)
    ),
    minHeightMm: measureCircleTheAnswer(spec, WIDEST_ZONE_MM),
  };
}

// ─── the look ────────────────────────────────────────────────────────────
// Every line-height here is pinned to 1.35, and they must stay in step with
// LINE_MM in shared.js. Any one left unset falls back to Comic Sans's own
// default of about 1.5, runs taller than the estimate, and clips the bottom of
// the zone without anything looking wrong.

const css = `
  /* ─── shared parts ─── */
  /* Bold, black and bracketed, the same as every other number on the sheet.
     It was question blue and unbracketed, so a sheet carrying one of these
     beside a numbered question printed the two numbers two different ways. */
  .h-cq-num {
    display: inline-block; min-width: ${NUM_MIN_MM}mm;
    margin-right: var(--space-tight);
    color: var(--colour-ink); font-weight: bold; font-size: var(--type-body);
    line-height: 1.35;
  }
  .h-cq-stem {
    margin: 0 0 var(--space-tight);
    font-size: var(--type-body); color: var(--colour-ink);
    line-height: 1.35;
  }
  .h-cq-followup { margin-top: var(--space-item); }
  .h-cq-followup-text {
    margin: 0 0 var(--space-hair);
    font-size: var(--type-body); color: var(--colour-ink);
    line-height: 1.35;
  }
  .h-cq-line { display: block; border-bottom: var(--rule-hair) dotted var(--colour-rule); }

  /* Values handed to the child, in both tables: the same orange a data table
     already uses, because that is what they are. The row labels take the one
     neutral fill rather than a colour, so nothing competes with the values. */
  /* Written as .h-cq-given alone this lost to .h-table td in tables.js, which
     is one class plus one element and therefore the more specific of the two:
     every value came out left-aligned under a centred heading. */
  .h-cq-grid .h-cq-given { color: var(--colour-given); font-weight: bold; text-align: center; }
  .h-cq-grid th[scope="row"] {
    background: var(--colour-tint); font-weight: normal;
    color: var(--colour-ink); text-align: left; line-height: 1.35;
  }
  .h-cq-grid td { line-height: 1.35; }

  /* ─── compare-row ─── */
  .h-cmp {
    display: flex; align-items: center;
    margin-bottom: var(--space-tight);
    font-size: var(--type-body); line-height: 1.35;
  }
  .h-cmp-value {
    flex: 1 1 auto; text-align: center;
    font-weight: bold; color: var(--colour-given);
  }
  /* The box the child writes < > or = in. Border INSIDE the square, or the row
     runs taller than the estimate says. */
  .h-cmp-box {
    flex: none; box-sizing: border-box;
    width: ${COMPARE_BOX_MM}mm; height: ${COMPARE_BOX_MM}mm;
    margin: 0 ${COMPARE_GAP_MM}mm;
    border: var(--rule-line) solid var(--colour-ink);
  }

  /* ─── inequality-with-boxes ─── */
  /* Left-anchored, under the instruction that asks for it.
     Centred, this row sat in the middle of whatever width the zone offered
     while its instruction stayed at the left margin, so "Count on in tens:"
     was printed at the left of a full-width zone and "26, 36, □ □ □" landed
     eighty millimetres away with empty page between the two. A child then has
     to cross that gap to find what they are counting. Spare width belongs at
     the right-hand edge of the zone, where it reads as margin, and never
     between a question and the thing it is asking about. */
  .h-ineq-row {
    display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-start;
    gap: ${INEQ_GAP_MM}mm;
    padding: ${INEQ_PAD_MM}mm 0;
  }
  .h-ineq-token {
    min-width: ${INEQ_TOKEN_MIN_MM}mm; text-align: center;
    font-size: var(--type-sectionLabel); font-weight: bold;
    color: var(--colour-ink); line-height: 1.35;
  }
  .h-ineq-box {
    flex: none; box-sizing: border-box;
    width: ${INEQ_BOX_MM}mm; height: ${INEQ_BOX_MM}mm;
    border: var(--rule-line) solid var(--colour-ink);
  }

  /* ─── number-sentence ─── */
  /* One row, and it does not wrap: the stated minimum has already claimed the
     width of the whole sentence, so wrapping here would mean the estimate and
     the page disagreed about how tall the block is. */
  .h-ns-row {
    display: flex; flex-wrap: nowrap; align-items: flex-start;
    gap: ${NS_GAP_MM}mm;
    padding: ${NS_PAD_MM}mm 0;
  }
  .h-ns-term { display: flex; flex-direction: column; align-items: center; }
  .h-ns-op {
    align-self: center;
    font-size: var(--type-sectionLabel); font-weight: bold;
    color: var(--colour-ink); line-height: 1.35;
  }
  /* A supplied value, on its own tile. The given orange and a light boundary,
     the same treatment a word bank gives a word handed over. */
  .h-ns-tile {
    box-sizing: border-box;
    min-width: ${NS_TILE_MIN_MM}mm; text-align: center;
    padding: var(--inset-card);
    border: var(--rule-line) solid var(--colour-given);
    border-radius: 1.5mm;
    font-size: var(--type-sectionLabel); font-weight: bold;
    color: var(--colour-given); line-height: 1.35;
  }
  .h-ns-text {
    align-self: center; padding: var(--inset-card);
    font-size: var(--type-sectionLabel); color: var(--colour-ink); line-height: 1.35;
  }
  /* Somewhere to write, and empty. No fill and no colour of its own: on this
     sheet an empty box is the one thing that always means "yours". */
  .h-ns-box {
    box-sizing: border-box; flex: none;
    height: ${NS_BOX_H_MM}mm;
    border: var(--rule-line) solid var(--colour-ink);
    border-radius: 1mm;
  }
  /* A digit frame: one cell per digit, sharing their internal rules so the
     frame reads as one answer rather than as four separate boxes. */
  .h-ns-cells { display: flex; }
  .h-ns-cell {
    box-sizing: border-box; flex: none;
    width: ${NS_CELL_MM}mm; height: ${NS_BOX_H_MM}mm;
    border: var(--rule-line) solid var(--colour-ink);
    margin-left: -${RULE.line}mm;
  }
  .h-ns-cell:first-child { margin-left: 0; }
  /* Headings line up with the terms by taking the same widths, so the word
     over a column starts exactly where the column does. */
  .h-ns-heads { display: flex; flex-wrap: nowrap; gap: ${NS_GAP_MM}mm; }
  .h-ns-head {
    flex: none; overflow: hidden; text-overflow: clip;
    font-size: var(--type-note); color: var(--colour-quiet); line-height: 1.35;
  }
  .h-ns-caption {
    margin-top: var(--space-hair);
    font-size: var(--type-note); color: var(--colour-quiet);
    line-height: 1.35; text-align: center;
  }

  /* ─── order-numbers ─── */
  .h-order-line { display: flex; align-items: center; font-size: var(--type-body); line-height: 1.35; }
  .h-order-card {
    flex: 1 1 auto;
    display: flex; flex-wrap: wrap; justify-content: center;
    gap: ${CARD_ITEM_GAP_MM}mm;
    box-sizing: border-box;
    padding: ${CARD_PAD_V_MM}mm ${CARD_PAD_H_MM}mm;
    border: ${CARD_BORDER_MM}mm solid var(--colour-ink);
    background: var(--colour-tint);
  }
  .h-order-given {
    font-weight: bold; color: var(--colour-given);
    font-size: var(--type-body); line-height: 1.35;
  }
  .h-order-blanks {
    display: flex; flex-wrap: wrap; align-items: flex-end;
    gap: ${ORDER_GAP_MM}mm;
    margin-top: var(--space-tight);
    font-size: var(--type-body); line-height: 1.35;
  }
  /* One blank per number, and each one wide enough to write "0.34" on. */
  .h-order-blank {
    flex: 1 1 ${ORDER_BLANK_MIN_MM}mm;
    min-width: ${ORDER_BLANK_MIN_MM}mm;
    box-sizing: border-box;
    height: ${ORDER_BLANK_MM}mm;
    border-bottom: var(--rule-hair) dotted var(--colour-rule);
  }
  .h-order-sep { flex: none; color: var(--colour-ink); line-height: 1.35; }

  /* ─── order-table ─── */
  /* This helper claims spare height (greed 3), so it has to take it, or the
     extra shows as a hole under the table. The room goes into the TABLE, and
     inside it into the empty bottom row, because that is the only part of an
     ordering table that gains from being taller: the values on top are read,
     not written. */
  .h-ordertable { height: 100%; display: flex; flex-direction: column; }
  .h-ordertable-grid { flex: 1; }
  .h-ordertable-answer td { height: ${ORDER_WRITE_ROW_MM}mm; }

  /* ─── data-table-with-ordering ─── */
  .h-dto-label { flex: none; color: var(--colour-ink); line-height: 1.35; }

  /* ─── circle-the-answer ─── */
  /* Left-anchored for the reason the inequality row above is: the options are
     what the instruction is about, so they start where the instruction starts.
     This one had not been reported yet and would have drifted the same way the
     moment it was given a wide zone. */
  .h-circle-row {
    display: flex; flex-wrap: wrap; justify-content: flex-start;
    column-gap: ${CIRCLE_INLINE_GAP_MM}mm; row-gap: 0;
    margin: 0;
  }
  .h-circle-list { list-style: none; margin: 0; padding: 0; }
  .h-circle-list .h-circle-option { margin-left: ${CIRCLE_INDENT_MM}mm; }
  /* The padding is not decoration: it is the room a child's drawn circle needs
     so that circling one option does not run through the one above it. */
  .h-circle-option {
    padding: ${CIRCLE_ROOM_MM}mm 0;
    font-size: var(--type-question); font-weight: bold;
    color: var(--colour-given); line-height: 1.35;
  }
`;

const helpers = {
  "compare-row": {
    render: renderCompareRow,
    measure: measureCompareRow,
    needs: needsCompareRow,
    // One box holding one symbol. A taller box is not more room to think in,
    // and stretching the row only pushes the next question down the page.
    greed: 0,
  },
  "inequality-with-boxes": {
    render: renderInequalityWithBoxes,
    measure: measureInequalityWithBoxes,
    needs: needsInequalityWithBoxes,
    greed: 0, // a displayed statement is the size it is
  },
  "number-sentence": {
    requires: ["terms"],
    render: renderNumberSentence,
    measure: measureNumberSentence,
    needs: needsNumberSentence,
    greed: 0, // the boxes are the size the answer is; taller ones hold no more
  },
  "order-numbers": {
    requires: ["numbers"],
    render: renderOrderNumbers,
    measure: measureOrderNumbers,
    needs: needsOrderNumbers,
    // What a child needs here is blanks wide enough to write a number on,
    // which is width. Extra height would only lift the blanks away from the
    // card they belong to.
    greed: 0,
  },
  "order-table": {
    render: renderOrderTable,
    measure: measureOrderTable,
    needs: needsOrderTable,
    greed: 3, // the empty bottom row is where a child writes, so height is real
  },
  "data-table-with-ordering": {
    render: renderDataTableWithOrdering,
    measure: measureDataTableWithOrdering,
    needs: needsDataTableWithOrdering,
    // Deliberately 0, though the follow-up lines would use the room. Greed is
    // one number per helper and cannot see the spec, and the follow-up is
    // optional: claiming height that only sometimes has somewhere to go is how
    // a block ends up sitting in a zone half again its size with the
    // difference showing as a hole. Unclaimed height collects at the foot of
    // the page instead, where a teacher trims it.
    greed: 0,
  },
  "circle-the-answer": {
    requires: ["options"],
    render: renderCircleTheAnswer,
    measure: measureCircleTheAnswer,
    needs: needsCircleTheAnswer,
    // Options are read and circled, not written in. Spreading them further
    // apart makes the choice harder to take in as one set, not easier.
    greed: 0,
  },
};

module.exports = { helpers, css };
