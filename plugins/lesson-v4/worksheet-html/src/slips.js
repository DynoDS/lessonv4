"use strict";

// Books or sheet, and the question slips that go with "books".
//
// Daniel's school asked staff to use less paper (16 September 2026). A
// worksheet a class can do in their exercise books does not need thirty
// copies, but a book page that says only "No, because it's nearer 4,500" means
// nothing to someone monitoring books without the question beside it. So:
//
//   - every sheet carries `recording`: "books" when every question on it can be
//     answered in a book from its slip or the board, "sheet" when at least
//     one needs the page itself. A mixed sheet is "sheet": a sheet that is half
//     books still needs a print per child and only adds trimming.
//   - the sheet's corner shows a small book or pencil beside its level code,
//     and every slip shows the book beside its code.
//   - a "books" sheet prints as a page of question slips in the sheet's own
//     place in the PDF, and the write-on sheet is not printed: the same
//     questions and pictures with the answer space taken out, half a page wide
//     so a slip fits an exercise book, repeated so several fit on a page. A
//     child sticks one in and answers underneath. Daniel, 29 September 2026:
//     printing the sheet as well only spent the paper the mark was there to
//     save. When the slips cannot be made, the sheet prints in their place, so
//     a level is never left with nothing.
//
// Whether a sheet is books or sheet is the worksheet designer's call, made
// against `references/books-or-sheet.md`. This file owns only what can be
// checked or computed: wording that may need the page (a prompt to look
// again), and how many slips fit on a page.

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
// A slip carries the sheet's words verbatim, and some words look as if they
// only make sense with the printed page in front of the child: "Circle the...",
// "Mark it on the line", "Fill in the table". They are a prompt to look again,
// not a verdict. The teacher ruled on 19 September 2026 that one digit box does
// not make a write-on sheet, so words about a box or a gap are judged by what
// the sheet holds: a box in the question's own sentence (`4,_50`), or on a
// sheet whose only helpers are sentences and number sentences, is
// copied into a book in seconds and never flagged. The rest are a prompt at
// preflight, answered by a field on the sheet (`"recordingLookedAgain": true`,
// the designer saying a book still does), never by matching the reason's
// words; the build treats the sheet as "sheet" only when nobody answered,
// rather than print slips that ask a child to circle what they do not have.
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

// Every piece of wording on a sheet that looks as if it needs the printed page,
// as `{ phrase, text }`, one per string (its first match), in reading order.
function sheetOnlyWordings(sheet) {
  const content = sheet && (sheet.pages || sheet.zones);
  const found = [];
  for (const text of pupilStrings(content)) {
    for (const pattern of SHEET_ONLY_WORDING) {
      const m = pattern.exec(text);
      if (m) {
        found.push({ phrase: m[0], text: text.replace(/\s+/g, " ").trim() });
        break;
      }
    }
  }
  return found;
}

// The first of them, or null.
function sheetOnlyWording(sheet) {
  return sheetOnlyWordings(sheet)[0] || null;
}

// Words about a box or a gap, and the helpers whose boxes are only the blanks
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

// Every sheet's recording choice, checked. `required` is the designer's gate:
// a sheet with no choice is refused there, while the build leaves an unmarked
// sheet unmarked so a spec written before this field still builds.
//
// Both marks also say why, in one line, at the gate. Either can be reached by
// running the test on the whole sheet or by not thinking about it at all, and
// the two look identical on the page; the line is what tells them apart, and
// it is all that is asked for. Never the mark, which reports the sheet the
// designer built.
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
    if (sheet.recordingLookedAgain !== undefined && typeof sheet.recordingLookedAgain !== "boolean") {
      problems.push({
        signal: "RECORDING_INVALID",
        sheet: key,
        message: `sheets.${key}.recordingLookedAgain must be true or false (got ${JSON.stringify(sheet.recordingLookedAgain)}).`,
      });
    }
    if (required) {
      const reason =
        typeof sheet.recordingReason === "string" ? sheet.recordingReason.trim() : "";
      if (!reason) {
        problems.push({
          signal: "RECORDING_REASON_MISSING",
          sheet: key,
          message:
            `sheets.${key} is marked "${value}" with no "recordingReason". Add ` +
            `one line saying why this whole sheet is better that way: for ` +
            `"sheet", the question that needs the printed page and what the ` +
            `child does to it ("Q4: the child labels the printed photograph"); ` +
            `for "books", what makes every question answerable in a book. ` +
            `Going to look for a question that needs the page is the ` +
            `test. Never change a question to reach either mark. See ` +
            `references/books-or-sheet.md.`,
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

  // The success criteria panel goes on the sheet and not on the slip. Nothing
  // in it is written on, it repeats what is on the board and the working wall,
  // and on a Year 4 rounding slip it was 45mm of a 100mm slip: every child
  // sticking the method into their book instead of the questions. Daniel, 19
  // September 2026, having cut it off printed worksheets himself: "on a slip, I
  // really don't think it's needed at all". Since 23 September 2026 the sheet
  // refuses it too (render.js, CRITERIA_NOT_ON_SHEETS); this stays for older specs.
  if (node.helper === "steps") return null;

  if (node.helper === "drawing-space") {
    if (!node.text) return null;
    const { helper, heightMm, frame, areas, text, ...rest } = node;
    return { ...rest, helper: "instruction", text };
  }

  const out = {};
  for (const [key, value] of Object.entries(node)) {
    out[key] = key === "stack" || key === "row" ? forSlip(value) : value;
  }
  // Helpers that draw themselves differently on a slip. Questions and written
  // answers drop their answer blanks and ruled lines. A method frame keeps its
  // boxes but puts each label above them rather than in a column beside them,
  // which asked for about 130mm and made every slip a full-width strip
  // (Daniel, 29 September 2026); same labels, same boxes, same order.
  if (node.helper === "questions" || node.helper === "written-answers" || node.helper === "method-frame") {
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
// (2), and a group's own task line ("Write each number as Roman numerals.")
// always keeps a line of its own above its parts.
//
// A cell is sized from the words' real width at body size, measured in the
// browser (28 September 2026): a capital or a digit is about 2.65mm, other
// letters and punctuation about 2mm. The estimate used to be 2.1mm for
// everything, and the row then took its gaps out of the cells a second time, so
// on a Year 4 slip "LXXVIII" and even "85" broke onto two lines.
const CAPITAL_OR_DIGIT_MM = 2.75;
const OTHER_CHAR_MM = 2.1;
const NUMBER_ROOM_MM = 10; // the "(1a)" label (6.8mm at 10pt bold) in its 8mm column, and the gap after it
const MAX_ACROSS = 4;

function textWidthMm(text) {
  let mm = 0;
  for (const ch of String(text)) mm += /[A-Z0-9]/.test(ch) ? CAPITAL_OR_DIGIT_MM : OTHER_CHAR_MM;
  return mm;
}

// How long a question's words may be and still share a row: what fits a cell at
// two across. Beyond that the row maths below would refuse it anyway, so this
// is the same judgement made once rather than a separate number to keep in
// step. It replaced a flat 16 characters, which kept "Round 4,280 to the
// nearest 1,000." on a line of its own beside half a slip of blank paper.
function packableWidthMm(widthMm) {
  return widthMm / 2 - NUMBER_ROOM_MM - GAP_MM;
}

// A numbered question whose whole content is one short line of words, whether
// the sheet wrote that line as a question item, as a one-line written answer
// ("8 + 4 + 2 =", whose ruled line the slip has dropped), or as the instruction
// above a figure the slip has dropped. Anything with a picture, a stem, a blank
// in its words or a figure still keeps its own line.
function shortQuestionText(node, maxWidthMm) {
  if (!node || typeof node !== "object" || node.number === undefined) return null;
  if (node.groupPrompt) return null;
  let inner = node;
  if (isStack(node)) {
    if (!Array.isArray(node.stack) || node.stack.length !== 1) return null;
    inner = node.stack[0];
  }
  if (!inner || inner.stem) return null;
  let text = null;
  if (inner.helper === "questions" && !inner.text) {
    if (!Array.isArray(inner.items) || inner.items.length !== 1) return null;
    const item = inner.items[0];
    text = typeof item === "string" ? item : null;
  } else if (inner.helper === "written-answers" && !inner.text) {
    if (!Array.isArray(inner.items) || inner.items.length !== 1) return null;
    const item = inner.items[0];
    const plain = item && typeof item === "object" &&
      Object.keys(item).every((key) => ["text", "lines", "sentences"].includes(key));
    text = plain && typeof item.text === "string" ? item.text : null;
  } else if (inner.helper === "instruction") {
    text = typeof inner.text === "string" ? inner.text : null;
  }
  if (text === null || /_{2,}/.test(text) || textWidthMm(text) > maxWidthMm) return null;
  return text;
}

// An invisible cell that keeps the last row's columns under the ones above.
const COLUMN_FILLER = () => ({ helper: "instruction", text: " " });

// Which question a packed item belongs to. The numberer has already turned a
// grouped Part's questionGroupId into its label, so "2c" is part of question 2;
// a plain numbered question shares a run with its plain neighbours, as before.
function mainQuestionOf(node) {
  const label = node && node.number !== undefined ? String(node.number) : "";
  const grouped = /^(\d+)[a-z]$/.exec(label);
  return grouped ? grouped[1] : "plain";
}

function packShortQuestions(content, widthMm) {
  if (!isStack(content) || !Array.isArray(content.stack)) return content;

  const maxWidthMm = packableWidthMm(widthMm);
  const out = [];
  let run = [];
  const flush = () => {
    const longest = Math.max(0, ...run.map((r) => textWidthMm(r.text)));
    const cellMm = NUMBER_ROOM_MM + longest;
    const across = Math.min(MAX_ACROSS, Math.floor((widthMm + GAP_MM) / (cellMm + GAP_MM)));
    if (run.length < 2 || across < 2) {
      out.push(...run.map((r) => r.node));
    } else {
      // Each column is as wide as the run's longest question needs, and what is
      // left over goes in one empty column at the right, rather than being
      // shared out so that six four-digit numbers sit a finger apart across the
      // page. Stated parts are exact, so the columns still line up row to row -
      // (3a) above (3e) - which is what makes a run readable at a glance.
      // The row puts a gap between every pair of cells, the empty column
      // included, and takes those gaps out of the width before sharing it, so
      // the spare column is what is left after them. Left in, the gaps came out
      // of every question's own cell instead.
      const spareMm = widthMm - across * cellMm - across * GAP_MM;
      const trailing = spareMm > GAP_MM;
      for (let i = 0; i < run.length; i += across) {
        const cells = run.slice(i, i + across).map((r) => r.node);
        while (cells.length < across) cells.push(COLUMN_FILLER());
        const parts = cells.map(() => cellMm);
        if (trailing) {
          cells.push(COLUMN_FILLER());
          parts.push(spareMm);
        }
        out.push({ row: cells, parts });
      }
    }
    run = [];
  };

  for (const raw of content.stack) {
    // A question group the sheet holds inside a stack of its own (a Greater
    // Depth zone that opens with one) is packed where it sits: left as it was,
    // (1a) to (1c) ran down the slip one to a line.
    const node = isStack(raw) && raw.number === undefined ? packShortQuestions(raw, widthMm) : raw;
    const text = shortQuestionText(node, maxWidthMm);
    const group = mainQuestionOf(node);
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
// Two kinds of edge, two kinds of room. Beside a cut line the words sit close,
// because the teacher trims close to the question: 9mm there meant trimming the
// line and then trimming again nearer the words (Daniel, 28 September 2026:
// "I often trim close to the question ... closer, not too close obviously
// because of human error of cutting"). 4mm leaves a wobbly cut clear of the
// words. At the paper's own edge the room stays wide, so the words keep clear
// of a classroom printer's unprintable strip; nobody trims there.
const CUT_PAD_MM = 4;
const EDGE_PAD_MM = 9;
// The page's top edge is the first row's top: the grid starts this far down so
// that row's words still sit EDGE_PAD_MM from the paper. The foot keeps the old
// 6mm from the last words to the paper.
const PAGE_TOP_INSET_MM = EDGE_PAD_MM - CUT_PAD_MM;
const PAGE_FOOT_INSET_MM = 6 - CUT_PAD_MM;
// The level code ("E", "GD") sits on the first line, at the right, when that
// line is a section heading, which leaves the right of the line empty. Over
// anything else it needs a line of its own above the words.
const CODE_LINE_MM = 3.5;
const GAP_MM = SPACE.item;
// Four rows at most: past that every page is more cutting than it saves.
const MAX_ROWS = 4;

// One strip has the paper's edge on both sides; two across share a cut line
// down the middle.
function sidePadsMm(cols) {
  return cols === 1 ? EDGE_PAD_MM * 2 : EDGE_PAD_MM + CUT_PAD_MM;
}

function contentWidthMm(cols) {
  return PAGE_W_MM / cols - sidePadsMm(cols);
}

function opensWithHeading(nodes) {
  const first = nodes[0];
  const inner = first && Array.isArray(first.stack) ? first.stack[0] : first;
  return Boolean(inner && inner.helper === "section-label");
}

function slipPadTopMm(codeBeside) {
  return CUT_PAD_MM + (codeBeside ? 0 : CODE_LINE_MM);
}

// Slips are always half a page wide, two across. A slip is stuck into an
// exercise book, and a full-width strip is as wide as the page it goes on:
// Daniel, 29 September 2026, "otherwise there's no point in it being a strip".
// A slip holding something wider than half a page cannot be made. The worksheet
// designer hears so at the preflight (SLIP_TOO_WIDE) and decides what the sheet
// is; left as it was, the build prints the sheet in place of the slips, never a
// full-width strip.
const SLIP_COLS = 2;

function minWidthOf(node, widthMm) {
  try {
    return needsContent(node, widthMm).minWidthMm;
  } catch {
    return Infinity;
  }
}

// The parts of a slip too wide for it, as { number, helper, needMm }: the
// smallest parts that are too wide on their own, so the designer is told which
// picture it is rather than which zone. Judged on the questions before packing:
// a packed row asks for its cells' sheet-sized minimum widths, which a
// one-number question never needs, and the rendered-fit check catches a row
// that genuinely does not fit.
function tooWideForSlip(nodes) {
  const halfMm = contentWidthMm(SLIP_COLS);
  const found = [];
  const drill = (node, number, roomMm) => {
    const numbered = node && node.number !== undefined;
    const own = numbered ? node.number : number;
    const room = numbered ? roomMm - NUMBER_ROOM_MM : roomMm;
    // Into a row's parts as well as a stack's: a picture too wide on its own
    // is named, and a row is named only when its parts fit alone but not side
    // by side.
    const parts = isStack(node) ? node.stack : isRow(node) ? node.row : null;
    const before = found.length;
    if (Array.isArray(parts)) for (const part of parts) drill(part, own, room);
    if (found.length > before) return;
    const needMm = minWidthOf(node, roomMm);
    if (needMm > roomMm) {
      const helper = (node && node.helper) || (isRow(node) ? "items side by side" : "stack");
      found.push({ number: own, helper, needMm });
    }
  };
  for (const node of nodes) {
    if (minWidthOf(node, halfMm) > halfMm) drill(node, undefined, halfMm);
  }
  return found;
}

function describeTooWide(found) {
  return found
    .map((f) => `${f.helper} (${Math.round(f.needMm)}mm${f.number !== undefined ? `, question ${f.number}` : ""})`)
    .join(", ");
}

// For the designer's preflight: each books sheet whose slips cannot be made at
// half a page, from the engine's own sheets (`sheetsOf`), so the widths are the
// ones the build will meet.
function slipWidthProblems(sheets) {
  const halfMm = Math.round(contentWidthMm(SLIP_COLS));
  const problems = [];
  for (const sheet of sheets) {
    if (!sheet.spec || sheet.spec.recording !== "books" || sheet.pageCount !== 1) continue;
    const found = tooWideForSlip(slipContentOf(sheet.spec));
    if (!found.length) continue;
    problems.push({
      signal: "SLIP_TOO_WIDE",
      sheet: sheet.key,
      found,
      message:
        `${sheet.label} is marked "books", so it prints as slips half a page wide ` +
        `(${halfMm}mm of words) to fit an exercise book, and ${describeTooWide(found)} ` +
        `will not fit that. Decide, against references/books-or-sheet.md: a figure ` +
        `the children draw or copy for themselves in their books is marked ` +
        `"onSlip": false; one the child has to work on, or cannot read any smaller, ` +
        `makes the sheet "sheet". Holding such a picture is not by itself a reason ` +
        `for "sheet". Never reword or cut a question to make it fit. Left as it is, ` +
        `the build prints this sheet instead of its slips.`,
    });
  }
  return problems;
}

// An estimate of the slip's content height, from the engine's own arithmetic.
// It still counts some answer room the slip leaves out, so it errs tall, which
// is the safe side: a roomier slip, never a clipped one.
function estimatedContentMm(nodes, cols) {
  const widthMm = contentWidthMm(cols);
  const total = nodes.reduce((sum, node) => sum + measureContent(node, widthMm), 0);
  return total + Math.max(0, nodes.length - 1) * GAP_MM;
}

function rowsFor(slipMm) {
  const usableMm = PAGE_H_MM - PAGE_TOP_INSET_MM - PAGE_FOOT_INSET_MM;
  return Math.min(MAX_ROWS, Math.floor(usableMm / slipMm));
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
  .slips { position: absolute; left: 0; right: 0; top: ${PAGE_TOP_INSET_MM}mm; bottom: 0; display: grid; }
  .slip {
    position: relative;
    box-sizing: border-box;
    padding: ${CUT_PAD_MM}mm ${EDGE_PAD_MM}mm ${CUT_PAD_MM}mm;
    overflow: hidden;
  }
  .slip--code-above { padding-top: ${CUT_PAD_MM + CODE_LINE_MM}mm; }
  .slip--left { padding-right: ${CUT_PAD_MM}mm; }
  .slip--right { padding-left: ${CUT_PAD_MM}mm; }
  .slip-body {
    display: flex;
    flex-direction: column;
    gap: ${GAP_MM}mm;
    height: 100%;
    overflow: hidden;
  }
  .slip-item { flex: 0 0 auto; position: relative; }
  /* The hairline between questions, drawn where one of the sheet's zones meets
     the next as well as inside a zone: the stack only rules between its own
     items, so (2) and (3) ran together with nothing between them. Not above a
     heading, which marks itself, as on the sheet. */
  .slip-item--ruled::before {
    content: ""; position: absolute; left: 0; right: 0; top: -${GAP_MM / 2}mm;
    border-top: var(--rule-hair) solid var(--colour-rule);
  }
  /* A short question on the sheet keeps room under it for its answer blank.
     On a slip the blank has gone, so the last question in a list gives that
     room back. */
  .slip-item .h-questions > .h-q:last-child { margin-bottom: 0; }
  /* The gaps between questions come down too. On a sheet that space is partly
     where the child writes; on a slip the writing room has already gone with
     the answer blanks and the child answers underneath in their book, so what
     is left is separation only, and the rule line still draws it. Kept in
     proportion - a new question stays a step wider than a new part - because
     the slip has to read as the same questions in the same order. The stack
     writes each gap as an inline style, which is why these carry weight.
     A Year 4 Greater Depth slip missed fitting twice on the page by 0.9mm and
     threw away the bottom half of every sheet printed. */
  .slip-item .h-stack-item { margin-top: ${SPACE.tight}mm !important; }
  .slip-item .h-stack-item--new-question { margin-top: ${SPACE.item}mm !important; }
  .slip-item .h-stack > .h-stack-item:first-child { margin-top: 0 !important; }
  .slip-item .h-stack-item--new-question::before { top: -${SPACE.item / 2}mm; }
  .slip-item .h-questions--inline { display: flex; flex-wrap: wrap; column-gap: 12mm; }
  .slip-item .h-questions--inline > .h-q { margin-bottom: 0; }
  /* A row of packed short questions: each cell holds one line, so it does not
     stretch to the tallest neighbour's full height. */
  .slip-item .h-row { height: auto; }
  .slip--left .slip-code { right: ${CUT_PAD_MM}mm; }
  .slip--code-above .slip-code { top: ${CUT_PAD_MM - 1}mm; }
  .sheet-recording {
    width: 1.35em;
    height: 1.35em;
    margin-left: 0.35em;
    vertical-align: -0.3em;
  }
  .slip-code {
    position: absolute;
    right: ${EDGE_PAD_MM}mm;
    top: ${CUT_PAD_MM}mm;
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
    .map((node, i) => {
      const ruled = i > 0 && !opensWithHeading([node]);
      return `<div class="slip-item${ruled ? " slip-item--ruled" : ""}">${renderContent(node, widthMm)}</div>`;
    })
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
// `slipMm` is one slip's own height. Given it, the slips sit at that height from
// the top of the page and the cut lines sit tight under them, so what is left
// over is one strip at the foot instead of a dead band inside every slip. The
// band cost a second cut at each boundary - Daniel, 19 September 2026: "I trim
// under the explain, and then have to make another trim to the top of the next
// slip. So all that is just wasted trimming motions and wasted dead space." It
// does not change how many slips fit; that is settled before this is called.
function renderSlipsPage({ nodes, cols, rows, code, title, slipMm, codeBeside = true }) {
  const inner = bodyHtml(nodes, cols);
  const cells = [];
  for (let i = 0; i < cols * rows; i += 1) {
    const classes = ["slip"];
    if (cols === 2) classes.push(i % 2 === 0 ? "slip--left" : "slip--right");
    if (!codeBeside) classes.push("slip--code-above");
    cells.push(
      `<div class="${classes.join(" ")}"><div class="slip-code">${esc(code || "")}${recordingIcon("books")}</div>` +
        `<div class="slip-body" data-worksheet-zone="slip-${i + 1}">${inner}</div></div>`
    );
  }
  const rowMm = slipMm || (PAGE_H_MM - PAGE_TOP_INSET_MM) / rows;
  const cuts = [];
  for (let r = 1; r < rows; r += 1) {
    cuts.push(`<div class="cut cut--across" style="top:${(PAGE_TOP_INSET_MM + rowMm * r).toFixed(2)}mm"></div>`);
  }
  for (let c = 1; c < cols; c += 1) {
    cuts.push(`<div class="cut cut--down" style="left:${((PAGE_W_MM / cols) * c).toFixed(2)}mm"></div>`);
  }
  return documentHtml(
    `${title || "Worksheet"} - slips`,
    `<div class="slips" style="grid-template-columns:repeat(${cols},1fr);` +
      `grid-template-rows:repeat(${rows},${slipMm ? `${slipMm.toFixed(2)}mm` : "1fr"});align-content:start">` +
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
  // The book mark always prints, so the code line is only shared with a
  // heading that leaves its right-hand end empty.
  const codeBeside = opensWithHeading(nodes);

  const wide = tooWideForSlip(nodes);
  if (wide.length) {
    return {
      skipped: `${describeTooWide(wide)} will not fit a slip half a page wide, which is what fits an exercise book`,
    };
  }

  const cols = SLIP_COLS;
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
  const askedMm = contentMm + (browser ? 1 : 0);
  const slipMm = askedMm + slipPadTopMm(codeBeside) + CUT_PAD_MM;
  let rows = rowsFor(slipMm);
  if (rows < 1) return { skipped: "its questions are too long to fit a slip shorter than a page" };

  while (rows >= 1) {
    const html = renderSlipsPage({ nodes: laid, cols, rows, code, title, slipMm, codeBeside });
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
  recordingAdvisories,
  sheetOnlyWording,
  sheetOnlyWordings,
  forSlip,
  slipContentOf,
  slipNodesFor,
  packShortQuestions,
  tooWideForSlip,
  slipWidthProblems,
  SLIP_COLS,
  estimatedContentMm,
  rowsFor,
  renderSlipsPage,
  buildSlips,
  MAX_ROWS,
};
