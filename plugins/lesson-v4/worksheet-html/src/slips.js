"use strict";

// Books or sheet, and the question slips that go with "books".
//
// Daniel's school asked staff to use less paper (16 September 2026). A
// worksheet a class can do in their exercise books does not need thirty
// copies, but a book page that says only "No, because it's nearer 4,500" means
// nothing to someone monitoring books without the question beside it. So:
//
//   - every sheet carries `recording`: "books" when every question on it can be
//     answered in a book from a shared copy or the board, "sheet" when at least
//     one needs the page itself. A mixed sheet is "sheet": a sheet that is half
//     books still needs a print per child and only adds trimming.
//   - the sheet's corner shows a small book or pencil beside its level code.
//     The teacher can ignore it; the sheet itself is unchanged.
//   - each "books" sheet also gets one page of question slips at the back of
//     the same PDF: the same questions and pictures with the answer space
//     taken out, repeated so several fit on a page. A child sticks one in and
//     answers underneath.
//
// Whether a sheet is books or sheet is the worksheet designer's call, made
// against `references/books-or-sheet.md`. This file owns only what can be
// checked or computed: wording that plainly needs the page, and how many slips
// fit on a page.

const { cssVariables, SPACE } = require("./tokens");
const { PX_PER_MM } = require("./page");
const { isRow, isStack } = require("./helpers/compose");
const { renderContent, measureContent, needsContent, helperCss } = require("./helpers");
const { esc } = require("./helpers/shared");

const RECORDING_CHOICES = ["books", "sheet"];

// ─── the corner mark ─────────────────────────────────────────────────────
//
// Drawn, not an emoji: a school photocopier turns a colour emoji into a grey
// smudge, and a line drawing in the code's own grey survives it.
const BOOK_ICON =
  '<svg class="sheet-recording" viewBox="0 0 24 24" aria-label="books">' +
  '<path d="M12 6.5C9 4.6 5.6 4.3 2.5 5.2v13.6c3.1-.9 6.5-.6 9.5 1.3 3-1.9 6.4-2.2 9.5-1.3V5.2C18.4 4.3 15 4.6 12 6.5zM12 6.5v13.6" ' +
  'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
const PENCIL_ICON =
  '<svg class="sheet-recording" viewBox="0 0 24 24" aria-label="sheet">' +
  '<path d="M4 20l1.2-4.8L15.8 4.6a1.8 1.8 0 012.6 0l1 1a1.8 1.8 0 010 2.6L8.8 18.8zM14 6.4l3.6 3.6M5.2 15.2l3.6 3.6" ' +
  'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';

function recordingIcon(recording) {
  if (recording === "books") return BOOK_ICON;
  if (recording === "sheet") return PENCIL_ICON;
  return "";
}

// ─── wording that needs the page ─────────────────────────────────────────
//
// A slip carries the sheet's words verbatim, and some words only make sense
// with the printed page in front of the child: "Circle the...", "Mark it on the
// line", "Fill in the table". A sheet whose questions say those things is not a
// books sheet whatever it was marked, because a child with a slip and a book
// has nothing to circle. The designer is told at preflight; the build treats
// the sheet as "sheet" rather than print slips that ask the impossible.
//
// Deliberately narrow. "Use the number lines to help you" stays allowed: in a
// book the child draws their own. What is caught is an action on something
// only the printed page has.
const SHEET_ONLY_WORDING = [
  /\bcircle\b/i,
  /\btick\b/i,
  /\bshade\b/i,
  /\bhighlight\b/i,
  /\bunderline\b/i,
  /\bcross out\b/i,
  /\bcut out\b/i,
  /\bring (?:the|each|all|one|two|three|any|every)\b/i,
  /\bjoin (?:each|the dots|them|with a line)\b/i,
  /\bdraw (?:a )?lines? (?:from|to|between|joining)\b/i,
  /\blabel (?:the|each|it|them|your)\b/i,
  /\bfill in\b/i,
  /\bon (?:the|this|your) (?:line|number line|grid|map|diagram|picture|photo|photograph|chart|graph|sheet|page|table|model|clock|scale|ruler|shape|drawing)s?\b/i,
  /\bin (?:the|this|each) (?:box|boxes|table|grid|gaps?|spaces?|circles?|shapes?)\b/i,
  /\bcomplete the (?:table|grid|diagram|model|number line|bar model|part-whole)\b/i,
];

const PUPIL_TEXT_KEYS = new Set([
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
const PUPIL_LIST_KEYS = new Set(["items", "options"]);

function pupilStrings(node, out = []) {
  if (Array.isArray(node)) {
    for (const item of node) pupilStrings(item, out);
    return out;
  }
  if (!node || typeof node !== "object") return out;
  for (const [key, value] of Object.entries(node)) {
    if (typeof value === "string") {
      if (PUPIL_TEXT_KEYS.has(key)) out.push(value);
    } else if (PUPIL_LIST_KEYS.has(key) && Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") out.push(item);
        else pupilStrings(item, out);
      }
    } else {
      pupilStrings(value, out);
    }
  }
  return out;
}

// The first piece of wording on a sheet that needs the printed page, as
// `{ phrase, text }`, or null.
function sheetOnlyWording(sheet) {
  const content = sheet && (sheet.pages || sheet.zones);
  for (const text of pupilStrings(content)) {
    for (const pattern of SHEET_ONLY_WORDING) {
      const m = pattern.exec(text);
      if (m) return { phrase: m[0], text: text.replace(/\s+/g, " ").trim() };
    }
  }
  return null;
}

// Every sheet's recording choice, checked. `required` is the designer's gate:
// a sheet with no choice is refused there, while the build leaves an unmarked
// sheet unmarked so a spec written before this field still builds.
//
// The two marks are not checked the same way, on purpose. `"books"` pays for
// itself - it saves the copies, and its wording is tested below - while
// `"sheet"` costs a copy per child and used to pass in silence, so at the gate
// it states which question needs the page. That sentence is the only thing
// asked for: never the mark, which reports the sheet the designer built.
function recordingProblems(worksheet, { required = false } = {}) {
  const problems = [];
  for (const [key, sheet] of Object.entries((worksheet && worksheet.sheets) || {})) {
    if (!sheet || typeof sheet !== "object") continue;
    const value = sheet.recording;
    if (value === undefined) {
      if (required) {
        problems.push({
          signal: "RECORDING_MISSING",
          sheet: key,
          message:
            `sheets.${key} has no "recording". Every sheet says "books" (every ` +
            `question can be answered in an exercise book) or "sheet" (at least ` +
            `one question needs the printed page). See references/books-or-sheet.md.`,
        });
      }
      continue;
    }
    if (!RECORDING_CHOICES.includes(value)) {
      problems.push({
        signal: "RECORDING_INVALID",
        sheet: key,
        message: `sheets.${key}.recording must be "books" or "sheet" (got ${JSON.stringify(value)}).`,
      });
      continue;
    }
    if (value === "sheet" && required) {
      const reason =
        typeof sheet.recordingReason === "string" ? sheet.recordingReason.trim() : "";
      if (!reason) {
        problems.push({
          signal: "RECORDING_REASON_MISSING",
          sheet: key,
          message:
            `sheets.${key} is marked "sheet", which is a copy per child. Add ` +
            `"recordingReason": one line naming the question that needs the ` +
            `printed page and what the child does to it, as in "Q4: the child ` +
            `labels the printed photograph". If no question needs the page, ` +
            `every question can be answered in a book and the sheet is ` +
            `"books". Never change a question to reach either mark. See ` +
            `references/books-or-sheet.md.`,
        });
      }
    }
    if (value === "books") {
      const found = sheetOnlyWording(sheet);
      if (found) {
        problems.push({
          signal: "RECORDING_NEEDS_SHEET",
          sheet: key,
          phrase: found.phrase,
          message:
            `sheets.${key} is marked "books", but "${found.text}" asks for ` +
            `"${found.phrase}", which a child can only do on the printed page. ` +
            `Mark the sheet "sheet".`,
        });
      }
    }
  }
  return problems;
}

// ─── slip content ────────────────────────────────────────────────────────
//
// A slip is the sheet with the room for answers taken out, and nothing else
// changed: the words, numbers, pictures, models and number lines a child reads
// or copies all stay, because they are the question. What goes is pure answer
// room - the blank after a short question, the ruled lines under a written
// one, a drawing box - since the book is where that work now happens.
//
// Anything not listed here is kept whole. A helper whose answer room is woven
// into its figure (an empty part-whole slot, a table's blank cells) prints as
// the sheet does, which costs slip height but never changes the question.
//
// The one thing only the designer knows is which figures the children make
// for themselves in their books. A Year 4 class draws its own simple number
// line; printed on the slip it doubles the slip's height and halves the paper
// saved. So a figure marked `"onSlip": false` is left off the slip, while one
// a child reads from (a photograph, a source, a line whose value is read off)
// stays unmarked and prints.
function forSlip(node) {
  if (Array.isArray(node)) {
    return node.map(forSlip).filter((item) => item != null);
  }
  if (!node || typeof node !== "object") return node;
  if (node.onSlip === false) return null;

  if (node.helper === "drawing-space") {
    if (!node.text) return null;
    const { helper, heightMm, frame, areas, text, ...rest } = node;
    return { ...rest, helper: "instruction", text };
  }

  const out = {};
  for (const [key, value] of Object.entries(node)) {
    out[key] = key === "stack" || key === "row" ? forSlip(value) : value;
  }
  if (node.helper === "questions" || node.helper === "written-answers") {
    out.slip = true;
  }
  if (isStack(node) || isRow(node)) {
    const listed = isStack(node) ? out.stack : out.row;
    if (listed == null || (Array.isArray(listed) && listed.length === 0)) return null;
  }
  return out;
}

// The sheet's numbered zones in reading order (a, b, c), ready for a slip.
function slipContentOf(sheetSpec) {
  const zones = (sheetSpec && sheetSpec.zones) || {};
  return Object.keys(zones)
    .sort()
    .map((id) => forSlip(zones[id]))
    .filter((content) => content != null);
}

// ─── short questions side by side ────────────────────────────────────────
//
// On the sheet, "(1a) 38" sits on its own line because the line is where the
// answer goes. On a slip the answer is in the book, so a run of six one-number
// questions stacked down a slip is mostly empty paper, and it is the difference
// between two slips a page and four. Daniel, looking at the first built slips
// (16 September 2026): "there was space to put them together ... horizontally
// to fill the space which might get more on page". So a run of short questions
// is laid out in even columns, reading across then down, numbers unchanged.
//
// Only a question whose whole content is one short item is packed: anything
// with a picture, a stem, a blank in its words or a figure keeps its own line.
// A run stops where a question group changes, so (1f) never shares a row with
// (2).
const SHORT_QUESTION_CHARS = 16;
const BODY_CHAR_MM = 12 * 0.3528 * 0.5; // body type, the width the engine's line estimate assumes
const NUMBER_ROOM_MM = 10; // the "(1a)" label and the gap after it, with a little to spare
const MAX_ACROSS = 4;

function shortQuestionText(node) {
  if (!node || typeof node !== "object" || node.number === undefined) return null;
  let inner = node;
  if (isStack(node)) {
    if (!Array.isArray(node.stack) || node.stack.length !== 1) return null;
    inner = node.stack[0];
  }
  if (!inner || inner.helper !== "questions" || inner.text || inner.stem) return null;
  if (!Array.isArray(inner.items) || inner.items.length !== 1) return null;
  const item = inner.items[0];
  const text = typeof item === "string" ? item : null;
  if (text === null || /_{2,}/.test(text) || text.length > SHORT_QUESTION_CHARS) return null;
  return text;
}

// An invisible cell that keeps the last row's columns under the ones above.
const COLUMN_FILLER = () => ({ helper: "instruction", text: " " });

function packShortQuestions(content, widthMm) {
  if (!isStack(content) || !Array.isArray(content.stack)) return content;

  const out = [];
  let run = [];
  const flush = () => {
    const longest = Math.max(0, ...run.map((r) => r.text.length));
    const cellMm = NUMBER_ROOM_MM + longest * BODY_CHAR_MM + GAP_MM;
    const across = Math.min(MAX_ACROSS, Math.floor((widthMm + GAP_MM) / (cellMm + GAP_MM)));
    if (run.length < 2 || across < 2) {
      out.push(...run.map((r) => r.node));
    } else {
      for (let i = 0; i < run.length; i += across) {
        const cells = run.slice(i, i + across).map((r) => r.node);
        while (cells.length < across) cells.push(COLUMN_FILLER());
        out.push({ row: cells, parts: cells.map(() => 1) });
      }
    }
    run = [];
  };

  for (const node of content.stack) {
    const text = shortQuestionText(node);
    const group = node && node.questionGroupId;
    if (text !== null && (!run.length || run[0].group === group)) {
      run.push({ node, text, group });
      continue;
    }
    flush();
    if (text !== null) run.push({ node, text, group });
    else out.push(node);
  }
  flush();
  return { ...content, stack: out };
}

// The slip's content laid out for its printed width.
function slipNodesFor(nodes, cols) {
  return nodes.map((node) => packShortQuestions(node, contentWidthMm(cols)));
}

// ─── page plan ───────────────────────────────────────────────────────────

const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
// Content sits well inside every slip, so a slip on the page edge keeps its
// words clear of a classroom printer's unprintable strip.
const PAD_TOP_MM = 9;
const PAD_SIDE_MM = 9;
const PAD_BOTTOM_MM = 6;
const GAP_MM = SPACE.item;
// Four rows at most: past that every page is more cutting than it saves.
const MAX_ROWS = 4;

function contentWidthMm(cols) {
  return PAGE_W_MM / cols - PAD_SIDE_MM * 2;
}

// Two slips across when every item can be read at half the page's width,
// otherwise one full-width strip.
function columnsFor(nodes) {
  const halfMm = contentWidthMm(2);
  for (const node of nodes) {
    try {
      if (needsContent(node, halfMm).minWidthMm > halfMm) return 1;
    } catch {
      return 1;
    }
  }
  return 2;
}

// An estimate of the slip's content height, from the engine's own arithmetic.
// It still counts some answer room the slip leaves out, so it errs tall, which
// is the safe side: a roomier slip, never a clipped one.
function estimatedContentMm(nodes, cols) {
  const widthMm = contentWidthMm(cols);
  const total = nodes.reduce((sum, node) => sum + measureContent(node, widthMm), 0);
  return total + Math.max(0, nodes.length - 1) * GAP_MM;
}

function rowsFor(contentMm) {
  const slipMm = contentMm + PAD_TOP_MM + PAD_BOTTOM_MM;
  return Math.min(MAX_ROWS, Math.floor(PAGE_H_MM / slipMm));
}

// ─── HTML ────────────────────────────────────────────────────────────────

const SLIP_CSS = `
  @page { size: ${PAGE_W_MM}mm ${PAGE_H_MM}mm; margin: 0; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: var(--font);
    color: var(--colour-ink);
    width: ${PAGE_W_MM}mm;
    height: ${PAGE_H_MM}mm;
    position: relative;
    overflow: hidden;
  }
  .slips { position: absolute; inset: 0; display: grid; }
  .slip {
    position: relative;
    box-sizing: border-box;
    padding: ${PAD_TOP_MM}mm ${PAD_SIDE_MM}mm ${PAD_BOTTOM_MM}mm;
    overflow: hidden;
  }
  .slip-body {
    display: flex;
    flex-direction: column;
    gap: ${GAP_MM}mm;
    height: 100%;
    overflow: hidden;
  }
  .slip-item { flex: 0 0 auto; }
  /* A short question on the sheet keeps room under it for its answer blank.
     On a slip the blank has gone, so the last question in a list gives that
     room back; the gaps between questions stay as the sheet has them. */
  .slip-item .h-questions > .h-q:last-child { margin-bottom: 0; }
  .slip-item .h-questions--inline { display: flex; flex-wrap: wrap; column-gap: 12mm; }
  .slip-item .h-questions--inline > .h-q { margin-bottom: 0; }
  /* A row of packed short questions: each cell holds one line, so it does not
     stretch to the tallest neighbour's full height. */
  .slip-item .h-row { height: auto; }
  .slip-code {
    position: absolute;
    right: ${PAD_SIDE_MM}mm;
    top: ${PAD_TOP_MM - 5}mm;
    font-size: var(--type-note);
    line-height: 1.35;
    color: var(--colour-quiet);
    font-weight: bold;
  }
  .cut { position: absolute; border: 0 dashed #9a9a9a; }
  .cut--across { left: 0; right: 0; border-top-width: 0.3mm; }
  .cut--down { top: 0; bottom: 0; border-left-width: 0.3mm; }
  .slip-measure {
    box-sizing: border-box;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: ${GAP_MM}mm;
  }
`;

function bodyHtml(nodes, cols) {
  const widthMm = contentWidthMm(cols);
  return nodes
    .map((node) => `<div class="slip-item">${renderContent(node, widthMm)}</div>`)
    .join("");
}

function documentHtml(title, body) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
${cssVariables()}
${SLIP_CSS}
${helperCss}
</style></head>
<body data-worksheet-page>
${body}
</body></html>`;
}

// One slip's content alone, at its printed width, for the browser to measure.
function measureHtml(nodes, cols) {
  return documentHtml(
    "Slip measure",
    `<div class="slip-measure" style="width:${contentWidthMm(cols)}mm">${bodyHtml(nodes, cols)}</div>`
  );
}

// A whole page of identical slips with dashed cut lines between them. Each
// slip body is a checked zone, so the build's rendered-fit probe refuses a
// slip whose words run past its bottom edge.
function renderSlipsPage({ nodes, cols, rows, code, title }) {
  const inner = bodyHtml(nodes, cols);
  const cells = [];
  for (let i = 0; i < cols * rows; i += 1) {
    cells.push(
      `<div class="slip">${code ? `<div class="slip-code">${esc(code)}</div>` : ""}` +
        `<div class="slip-body" data-worksheet-zone="slip-${i + 1}">${inner}</div></div>`
    );
  }
  const cuts = [];
  for (let r = 1; r < rows; r += 1) {
    cuts.push(`<div class="cut cut--across" style="top:${((PAGE_H_MM / rows) * r).toFixed(2)}mm"></div>`);
  }
  for (let c = 1; c < cols; c += 1) {
    cuts.push(`<div class="cut cut--down" style="left:${((PAGE_W_MM / cols) * c).toFixed(2)}mm"></div>`);
  }
  return documentHtml(
    `${title || "Worksheet"} - slips`,
    `<div class="slips" style="grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},1fr)">` +
      `${cells.join("")}</div>${cuts.join("")}`
  );
}

// The browser's own height for one slip's content, in millimetres.
async function measuredContentMm(browser, nodes, cols) {
  const page = await browser.newPage();
  try {
    await page.setContent(measureHtml(nodes, cols), { waitUntil: "load" });
    return await page.evaluate(async (pxPerMm) => {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const box = document.querySelector(".slip-measure");
      return box.getBoundingClientRect().height / pxPerMm;
    }, PX_PER_MM);
  } finally {
    await page.close();
  }
}

// Plan and print one sheet's slip page.
//
// With a browser, the slip is sized from the browser's own measurement and the
// printed page is checked for clipping; a clipped page loses a row and is tried
// again. Without one (a cloud box), the engine's estimate sizes it and the HTML
// is the deliverable, as it is for the sheets themselves.
//
// Returns { html, pdf?, cols, rows } or { skipped: reason }.
async function buildSlips({ sheetSpec, title, browser, htmlToPdf }) {
  const nodes = slipContentOf(sheetSpec);
  if (!nodes.length) return { skipped: "the sheet has nothing left to print once its answer spaces are taken out" };
  const code = sheetSpec.code || "";

  // Two across when the content can be read at half width, and one full-width
  // strip as well: long questions wrap less on a strip, so a strip can fit
  // more to the page. Whichever puts more slips on the page wins, and on a tie
  // the one with fewer cuts.
  const plans = [];
  // Judged on the questions before packing: a packed row asks for its cells'
  // sheet-sized minimum widths, which a one-number question never needs, and
  // the rendered-fit check below catches a row that genuinely does not fit.
  const across = columnsFor(nodes) === 2 ? [2, 1] : [1];
  for (const cols of across) {
    const laid = slipNodesFor(nodes, cols);
    let contentMm;
    try {
      contentMm = browser
        ? await measuredContentMm(browser, laid, cols)
        : estimatedContentMm(laid, cols);
    } catch (error) {
      return { skipped: `its slip could not be measured (${String(error.message || error).split("\n")[0]})` };
    }
    // A hair of margin over the browser's measurement, as the sheets keep.
    const rows = rowsFor(contentMm + (browser ? 1 : 0));
    if (rows >= 1) plans.push({ cols, rows, laid });
  }
  plans.sort((a, b) => b.cols * b.rows - a.cols * a.rows || a.cols + a.rows - (b.cols + b.rows));
  if (!plans.length) return { skipped: "its questions are too long to fit a slip shorter than a page" };

  const { cols, laid } = plans[0];
  let { rows } = plans[0];
  while (rows >= 1) {
    const html = renderSlipsPage({ nodes: laid, cols, rows, code, title });
    if (!browser) return { html, cols, rows };
    const { pdf, fitProblems } = await htmlToPdf(html, { browser, inspectFit: true });
    if (!fitProblems.length) return { html, pdf, cols, rows };
    rows -= 1;
  }
  return { skipped: "its questions are too long to fit a slip shorter than a page" };
}

module.exports = {
  RECORDING_CHOICES,
  recordingIcon,
  recordingProblems,
  sheetOnlyWording,
  forSlip,
  slipContentOf,
  slipNodesFor,
  packShortQuestions,
  columnsFor,
  estimatedContentMm,
  rowsFor,
  renderSlipsPage,
  buildSlips,
  MAX_ROWS,
};
