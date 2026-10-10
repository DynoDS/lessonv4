"use strict";

// A printed activity as a page, the way the teacher asked for it (1 October
// 2026): "on the sheet should be clear what they're doing, like a mini
// worksheet, it should be full page, it's 1 between 2. Obviously if it can
// save paper and do 2 per page, great, I can trim."
//
// Two kinds of page live here:
//
// - a FIGURE page: any write-on figure the pack can draw (a map, a timeline,
//   a Venn, a results table, a number line...) printed as large as the page
//   allows under the task, instead of as small slips to cut out and stick in.
//   When the figure is small enough that two copies sit one above the other
//   at nearly the same size, the page carries two, with a dashed line between
//   them to trim.
// - a TASK sheet: the task at the top, what children work on (a new case, a
//   worked answer with a mistake in it, a picture, a short text), then lines
//   to answer on, filling the rest of the page.
//
// Cutting and sticking stays available (`layout: "slips"` on a figure) for the
// rare piece that is glued into a book because gluing it in is the task.

const fs = require("fs");
const { printSizedDataUriSync } = require("./print-size");
const path = require("path");
const { PALETTES } = require("../../shared/visuals/surface-profiles");
const { withoutTaughtMarks } = require("../../shared/text/criteria-marks");
const { stackFractionsInText } = require("../../shared/text/stacked-fractions");

const INK = PALETTES.ink.ink;
const GREY = "#999999";
const TASK_LINE_MM = 9;      // one line of the task at 18pt
const TASK_GAP_MM = 4;
const TWO_UP_GAP_MM = 8;     // the trim line between two copies
const TWO_UP_SHARE = 0.8;    // two to a page only when each keeps this much of the one-up size
const RULE_MM = 11;          // writing line spacing for Year 4 handwriting

const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function taskOf(item) {
  const spec = item.spec || {};
  // A taught word prints plain on paper; its braces are the board's mark.
  return withoutTaughtMarks(String(item.task || spec.task || item.instruction || spec.instruction || item.label || "")).trim();
}

// A task written in numbered parts, "(1) ... (2) ...", as { lead, parts }.
// Null for any other task.
function taskParts(task) {
  const marks = [...String(task || "").matchAll(/(^|\s)\((\d{1,2})\)\s+/g)];
  if (marks.length < 2 || !marks.every((m, i) => Number(m[2]) === i + 1)) return null;
  const starts = marks.map((m) => m.index + m[1].length);
  return {
    lead: task.slice(0, starts[0]).trim(),
    parts: marks.map((m, i) => ({
      n: i + 1,
      text: task.slice(m.index + m[0].length, i + 1 < marks.length ? starts[i + 1] : task.length).trim(),
    })),
  };
}

// Parts that are each a job of their own start a line of their own. Run on as
// one paragraph, part (2) of a Year 6 task began in the middle of the third
// line and the whole task read as a block (7 October 2026). Parts that are
// only a few words ("(1) 1/4 (2) 5/6") stay on the line they were written on.
const LONG_PART_CHARS = 30;
function partsToBreak(task) {
  const split = taskParts(task);
  return split && split.parts.some((part) => part.text.length > LONG_PART_CHARS) ? split : null;
}
const hasPartsToBreak = (task) => Boolean(partsToBreak(task));

function taskLines(task) {
  const split = partsToBreak(task);
  if (!split) return [task];
  return [...(split.lead ? [split.lead] : []), ...split.parts.map((part) => `(${part.n}) ${part.text}`)];
}

function taskHeightMm(task, widthMm) {
  if (!task) return 0;
  const charsPerLine = Math.max(20, Math.floor(widthMm / 3.4));
  return taskLines(task).reduce((n, line) => n + Math.ceil(line.length / charsPerLine), 0) * TASK_LINE_MM + TASK_GAP_MM;
}

function taskHtml(task) {
  if (!task) return "";
  const lines = taskLines(task);
  const inner = lines.length === 1
    ? esc(task)
    : lines.map((line) => `<div${/^\(\d/.test(line) ? ' style="padding-left:10mm;text-indent:-10mm"' : ""}>${esc(line)}</div>`).join("");
  return `<div style="font-weight:bold;font-size:18pt;line-height:${TASK_LINE_MM}mm;margin-bottom:${TASK_GAP_MM}mm;color:${INK}">${inner}</div>`;
}

function copiesFor(per, classSize) {
  if (per === "child") return classSize;
  if (per === "group") return Math.ceil(classSize / 4);
  return Math.ceil(classSize / 2);
}

// The size a figure prints at in a space. `render(widthMm, zoom)` draws it and
// returns { html, widthMm, heightMm, flex }.
//
// A figure that keeps its shape is drawn again at the width that fits, because
// a figure drawn larger is redrawn, never stretched.
//
// A figure sized from its own words (`flex`) does not keep its shape: offered
// more width, a fraction wall grows wider and no taller, and a ten frame does
// not grow at all. The page was laid out as if they did, so the wall printed
// 79mm tall above 103mm of blank page and the ten frame 78mm wide on a page of
// its own (7 October 2026). Such a figure is tried at several widths, and
// enlarged as it stands where redrawing it wider leaves the space unfilled.
// Redrawing is preferred when it fills nearly as well, so words stay near the
// size they were designed at.
const FIT_STEPS = 6;
const NEARLY_AS_FULL = 0.9;

async function sizesOf(natural, render, widestMm) {
  if (!natural.flex) return null;
  const from = Math.min(natural.widthMm, widestMm);
  const asks = [];
  for (let k = 0; k <= FIT_STEPS; k += 1) asks.push(from * Math.pow(widestMm / from, k / FIT_STEPS));
  const sizes = [];
  for (const ask of asks) {
    const piece = await render(ask, 1);
    if (piece && !sizes.some((s) => Math.abs(s.widthMm - piece.widthMm) < 0.5 && Math.abs(s.heightMm - piece.heightMm) < 0.5)) {
      sizes.push({ ask, widthMm: piece.widthMm, heightMm: piece.heightMm });
    }
  }
  return sizes.length ? sizes : null;
}

// Where a figure of known sizes lands in a space: { ask, zoom, widthMm, heightMm }.
function fitIn(natural, sizes, roomW, roomH) {
  if (!sizes) {
    const scale = Math.max(0.01, Math.min(roomW / natural.widthMm, roomH / natural.heightMm));
    return { ask: natural.widthMm * scale, zoom: null, widthMm: natural.widthMm * scale, heightMm: natural.heightMm * scale };
  }
  const tries = sizes.map((s) => {
    const zoom = Math.max(0.01, Math.min(roomW / s.widthMm, roomH / s.heightMm));
    return { ask: s.ask, zoom, widthMm: s.widthMm * zoom, heightMm: s.heightMm * zoom };
  });
  // A drawing made smaller than it was laid out has words under their
  // readable size, so it is the last resort.
  const grown = tries.filter((t) => t.zoom >= 0.999);
  const pool = grown.length ? grown : [tries.reduce((best, t) => (t.zoom > best.zoom ? t : best))];
  const fullest = Math.max(...pool.map((t) => t.widthMm * t.heightMm));
  return pool
    .filter((t) => t.widthMm * t.heightMm >= NEARLY_AS_FULL * fullest)
    .reduce((best, t) => (t.zoom < best.zoom ? t : best));
}

async function drawFit(natural, render, fit, roomH) {
  if (fit.zoom != null) return render(fit.ask, fit.zoom);
  let piece = await render(fit.ask);
  // A figure laid out at its width can come back a little taller than its
  // shape promised; draw it again at the width that fits.
  if (piece.heightMm > roomH) piece = await render(piece.widthMm * (roomH / piece.heightMm) * 0.98);
  return piece;
}

// How large a fitted figure prints, as one length: what "keeps its size" is
// measured in. A redrawn figure changes shape, so neither its width nor its
// enlargement says it alone.
const lengthOf = (fit) => Math.sqrt(fit.widthMm * fit.heightMm);

// Lay a write-on figure out as pages: one to a page under its task, or two
// with a line to trim between them. Two when the half-page copy keeps most of
// the whole-page size, and also when it is still well over the size the figure
// has in a book: a ten frame two to a page has 37mm boxes, room for a counter,
// and a whole page each buys nothing but paper (the teacher, 10 October 2026).
const TWO_UP_BIG_ENOUGH = 1.5;

async function figurePages(item, natural, render, { printableWMm, printableHMm, classSize, pageHtml }) {
  const task = taskOf(item);
  const aspect = natural.widthMm / natural.heightMm;
  const taskH = taskHeightMm(task, printableWMm);
  const sizes = await sizesOf(natural, render, printableWMm);
  const oneRoomH = printableHMm - taskH;
  const halfRoomH = (printableHMm - TWO_UP_GAP_MM) / 2 - taskH;
  const one = fitIn(natural, sizes, printableWMm, oneRoomH);
  const two = halfRoomH > 0 ? fitIn(natural, sizes, printableWMm, halfRoomH) : null;
  // Never two when the half-page copy would be drawn under the size it was
  // laid out at: its words would be under their readable size.
  const twoUp = Boolean(two) && !(two.zoom != null && two.zoom < 0.999) && (
    lengthOf(two) >= TWO_UP_SHARE * lengthOf(one) ||
    (two.zoom != null && two.zoom >= TWO_UP_BIG_ENOUGH)
  );
  const piece = await drawFit(natural, render, twoUp ? two : one, twoUp ? halfRoomH : oneRoomH);
  const block = `<div style="width:${printableWMm}mm">${taskHtml(task)}` +
    `<div style="display:flex;justify-content:center">${piece.html}</div></div>`;
  const body = twoUp
    ? `${block}<div style="border-top:0.3mm dashed ${GREY};margin:${TWO_UP_GAP_MM / 2}mm 0"></div>${block}`
    : block;
  const copies = copiesFor(item.per || (item.spec && item.spec.per), classSize);
  const pageCount = twoUp ? Math.ceil(copies / 2) : copies;
  return {
    pages: Array.from({ length: pageCount }, () => pageHtml("", body)),
    perPage: twoUp ? 2 : 1,
    widthMm: piece.widthMm,
    heightMm: piece.heightMm,
    aspect,
  };
}

// One sheet, several figures, somewhere to write.
//
// The pack drew one figure to a piece and nothing else, so one task became
// several files (four river photographs: four files and 64 pages; a tally chart
// and the bar chart drawn from it: two pages a child), and a task that ends in
// writing had nowhere to write (three sums with no box, two fraction families
// with no line, 7 October 2026). A sheet holds every figure of one task, and
// under or beside each figure the places its answers go.
//
// `write` on a figure is a list of what the child writes there. A line with a
// part to find ("1/2 = ?/10", or a box typed as [ ]) prints beside its figure
// with a box at the part; any other ("(1) 1/4 =", "A") prints under it with a
// ruled line running on from the words.

const FIGURE_GAP_MM = 7;
const HEADING_LINE_MM = 7;      // a later figure's own task, at 14pt
const WRITE_LINE_MM = 14;       // one ruled line and the words that start it
const WRITE_LINE_TALL_MM = 18;  // the same, when the words hold a fraction
const WRITE_BOX_MM = 10;
const SUM_ROW_MM = 26;
const SHORT_LINE_MM = 45;       // the least a line to write one word on may be

const PART_TO_FIND = /(^|[\s=(/])(?:\?|\[\s*\]|☐|_{2,})(?=$|[\s/),.=])/;
const hasPartToFind = (text) => PART_TO_FIND.test(text);

function promptsOf(item, marks) {
  const typed = Array.isArray(item.write) ? item.write : [];
  return [...(marks || []), ...typed]
    .map((text) => withoutTaughtMarks(String(text == null ? "" : text)).trim())
    .filter(Boolean)
    .map((text) => ({ text, sum: hasPartToFind(text) }));
}

// The places to write inside a line of words: a box where it has `?` or
// `[ ]`, a short rule where it has underscores (`J' ( __ , __ )`: a number
// each, with the brackets and comma given).
function withWritingPlaces(text, boxMm, ruleMm) {
  const marked = text.replace(/\[\s*\]|\?(?=$|[\s/),.=])/g, "☐").replace(/_{2,}/g, "␣");
  const box = `<span style="display:inline-block;width:${boxMm}mm;height:${boxMm}mm;border:0.5mm solid ${INK};border-radius:1mm;vertical-align:middle;background:#fff"></span>`;
  const rule = `<span style="display:inline-block;width:${ruleMm}mm;border-bottom:0.4mm solid ${INK}"></span>`;
  return stackFractionsInText(esc(marked)).replace(/☐/g, box).replace(/␣/g, rule);
}

function sumHtml(text) {
  return `<div style="font-weight:bold;font-size:20pt;line-height:1.2;color:${INK};white-space:nowrap">` +
    withWritingPlaces(text, WRITE_BOX_MM, 12) + `</div>`;
}

function lineHtml(text, heightMm, sharingARow) {
  return `<div style="display:flex;align-items:flex-end;gap:2.5mm;height:${heightMm}mm;flex:${sharingARow ? "1 1 0" : "none"};min-width:0">` +
    `<span style="font-weight:bold;font-size:16pt;line-height:1.1;color:${INK};white-space:nowrap;padding-bottom:1mm">${stackFractionsInText(esc(text))}</span>` +
    `<span style="flex:1;border-bottom:0.4mm solid ${INK};margin-bottom:2.5mm"></span></div>`;
}

// What a figure's writing places cost in a cell of a given width.
function writingRoom(prompts, cellW) {
  const sums = prompts.filter((p) => p.sum);
  const lines = prompts.filter((p) => !p.sum);
  const besideW = sums.length ? Math.min(95, Math.max(50, Math.max(...sums.map((p) => p.text.length)) * 4.4 + 12)) : 0;
  const lineH = lines.some((p) => p.text.includes("/")) ? WRITE_LINE_TALL_MM : WRITE_LINE_MM;
  // Short starts (a letter each) share one row when every line stays long
  // enough to write a word on; longer ones take a row each.
  const short = lines.length > 1 && lines.every((p) => p.text.length <= 3) &&
    (cellW - (lines.length - 1) * 8) / lines.length >= SHORT_LINE_MM + 8;
  const belowH = lines.length ? (short ? lineH : lines.length * lineH) + 2 : 0;
  return { sums, lines, besideW, belowH, lineH, inOneRow: short, sumsH: sums.length * SUM_ROW_MM };
}

function planSheet(parts, task, pageW, pageH, cols) {
  const taskH = taskHeightMm(task, pageW);
  const rowsOf = [];
  for (let i = 0; i < parts.length; i += cols) rowsOf.push(parts.slice(i, i + cols));
  const cellW = (pageW - (cols - 1) * FIGURE_GAP_MM) / cols;
  const roomForRows = pageH - taskH - (rowsOf.length - 1) * FIGURE_GAP_MM;
  if (roomForRows <= 0) return null;
  const fitRow = (row, rowH) => row.map((part) => {
    const room = writingRoom(part.prompts, cellW);
    const headH = part.heading ? Math.ceil(part.heading.length / Math.max(12, Math.floor(cellW / 2.7))) * HEADING_LINE_MM + 1 : 0;
    const figW = cellW - (room.besideW ? room.besideW + 6 : 0);
    const figH = rowH - headH - room.belowH;
    if (figW <= 10 || figH <= 10) return null;
    const fit = fitIn(part.natural, part.sizes, figW, figH);
    return {
      part, room, headH, fit, figH,
      need: headH + Math.max(fit.heightMm, room.sumsH) + room.belowH,
      heightBound: fit.heightMm > figH - 1 && fit.widthMm < figW - 1,
    };
  });
  let heights = rowsOf.map(() => roomForRows / rowsOf.length);
  let rows = rowsOf.map((row, j) => fitRow(row, heights[j]));
  if (rows.some((row) => row.some((cell) => !cell))) return null;
  // Height a row cannot use goes to the rows that are short of it.
  const needs = rows.map((row) => Math.min(Math.max(...row.map((c) => c.need)), roomForRows));
  const spare = roomForRows - needs.reduce((sum, n) => sum + n, 0);
  const wanting = rows.map((row) => row.some((c) => c.heightBound));
  if (spare > 1 && wanting.some(Boolean)) {
    const share = spare / wanting.filter(Boolean).length;
    heights = needs.map((need, j) => need + (wanting[j] ? share : 0));
    rows = rowsOf.map((row, j) => fitRow(row, heights[j]));
    if (rows.some((row) => row.some((cell) => !cell))) return null;
  }
  const cells = rows.flat();
  // Figures of one kind on a sheet print one width when they came out nearly
  // alike: three pairs of fraction bars a few millimetres apart in length read
  // as three different wholes.
  for (const cell of cells) {
    const alike = cells.filter((c) => c.part.item.visual === cell.part.item.visual);
    const narrowest = Math.min(...alike.map((c) => c.fit.widthMm));
    if (cell.fit.widthMm > narrowest + 0.5 && cell.fit.widthMm < narrowest * 1.12) {
      cell.fit = fitIn(cell.part.natural, cell.part.sizes, narrowest, cell.figH);
    }
  }
  // Every figure counts: the mean of logs falls fast when one is starved, so a
  // sheet with one huge picture and three stamps never wins.
  const score = cells.reduce((sum, c) => sum + Math.log(c.fit.widthMm * c.fit.heightMm), 0) / cells.length;
  return { rows, cellW, score };
}

// One figure with its task beside it.
//
// A task in numbered parts over a figure about as tall as it is wide (a
// coordinate grid) printed as a paragraph across the top and, once its answers
// had lines, as seven full-width rules under a grid shrunk to pay for them.
// Beside the figure, each part is a block of its own: a sentence to a line,
// what follows a colon (the points to plot) on the next, and the part's own
// answers under it. The figure keeps the height of the page (the teacher,
// 10 October 2026: "way better").
//
// An entry of `write` that starts with a part's number, "(2) P' ( __ , __ )",
// prints under that part without the number; any other prints after the parts.
const SIDE_GAP_MM = 9;
const SIDE_LINE_MM = 7.6;        // one line at 16pt
const SIDE_CHAR_MM = 3.1;        // a bold 16pt character, on the safe side
const SIDE_INDENT_MM = 10;
const SIDE_BLOCK_GAP_MM = 9;
const SIDE_ENTRY_ROW_MM = 13;
const SIDE_ENTRY_GAP_MM = 7;      // between two answers on one row
const SIDE_RULE_MM = 11;
const SIDE_BOX_MM = 9;
const SIDE_PANELS_MM = [95, 100, 105, 110, 115, 120, 125, 130, 135, 140];
const SIDE_KEEPS = 0.85;         // beside wins when the figure keeps this much of its size
const MANY_SUMS = 4;             // more sums than stack beside a figure at their full size

const sentencesOf = (text) => String(text || "").split(/(?<=[.?!])\s+(?=[A-Z(])/).map((t) => t.trim()).filter(Boolean);

function sideBlocks(task, prompts) {
  const split = partsToBreak(task);
  const linesOf = (text) => sentencesOf(text).flatMap((sentence) => {
    const colon = sentence.search(/:\s+\S/);
    return colon < 0
      ? [{ text: sentence, bold: true }]
      : [{ text: sentence.slice(0, colon + 1), bold: true }, { text: sentence.slice(colon + 1).trim(), bold: false }];
  });
  const blocks = split
    ? [
        ...(split.lead ? [{ n: null, lines: linesOf(split.lead), entries: [] }] : []),
        ...split.parts.map((part) => ({ n: part.n, lines: linesOf(part.text), entries: [] })),
      ]
    : [{ n: null, lines: linesOf(task), entries: [] }];
  const loose = [];
  for (const prompt of prompts) {
    const own = /^\((\d{1,2})\)\s*(.+)$/.exec(prompt.text);
    const home = own && split ? blocks.find((b) => b.n === Number(own[1])) : null;
    if (home) home.entries.push({ ...prompt, text: own[2] });
    else loose.push(prompt);
  }
  if (loose.length) blocks.push({ n: null, lines: [], entries: loose });
  return { blocks, indented: Boolean(split) };
}

function entryWidthMm(text) {
  const places = (text.match(/\[\s*\]|\?(?=$|[\s/),.=])|☐|_{2,}/g) || []).length;
  const words = text.replace(/\[\s*\]|☐|_{2,}/g, "").length;
  return words * 2.5 + places * (SIDE_RULE_MM + 1);
}

function sideHeightMm({ blocks, indented }, panelW) {
  const textW = panelW - (indented ? SIDE_INDENT_MM : 0);
  const chars = Math.max(10, Math.floor(textW / SIDE_CHAR_MM));
  return blocks.reduce((total, block, i) => {
    const words = block.lines.reduce((n, line) => n + Math.ceil(line.text.length / chars), 0) * SIDE_LINE_MM;
    const short = block.entries.filter((e) => e.sum);
    const long = block.entries.filter((e) => !e.sum);
    let rows = short.length ? 1 : 0;
    let used = 0;
    for (const entry of short) {
      const w = Math.min(textW, entryWidthMm(entry.text));
      if (used > 0 && used + w > textW) { rows += 1; used = 0; }
      used += w + SIDE_ENTRY_GAP_MM;
    }
    const lineH = long.some((e) => e.text.includes("/")) ? WRITE_LINE_TALL_MM : WRITE_LINE_MM;
    const answers = rows * SIDE_ENTRY_ROW_MM + long.length * lineH + (block.entries.length && block.lines.length ? 3 : 0);
    return total + words + answers + (i > 0 ? SIDE_BLOCK_GAP_MM : 0);
  }, 0);
}

function sideHtml({ blocks, indented }, panelW) {
  const blockHtml = blocks.map((block, i) => {
    const lines = block.lines.map((line) =>
      `<div style="font-weight:${line.bold ? "bold" : "normal"}">${stackFractionsInText(esc(line.text))}</div>`).join("");
    const short = block.entries.filter((e) => e.sum);
    const long = block.entries.filter((e) => !e.sum);
    const lineH = long.some((e) => e.text.includes("/")) ? WRITE_LINE_TALL_MM : WRITE_LINE_MM;
    const shortHtml = short.length
      ? `<div style="line-height:${SIDE_ENTRY_ROW_MM}mm${block.lines.length ? ";margin-top:3mm" : ""}">` +
        short.map((e) => `<span style="white-space:nowrap;margin-right:${SIDE_ENTRY_GAP_MM}mm">${withWritingPlaces(e.text, SIDE_BOX_MM, SIDE_RULE_MM)}</span>`).join(" ") + `</div>`
      : "";
    const longHtml = long.map((e) => lineHtml(e.text, lineH, false)).join("");
    const number = block.n != null
      ? `<div style="font-weight:bold;width:${SIDE_INDENT_MM}mm;flex:none">(${block.n})</div>`
      : (indented && !block.lines.length ? `<div style="width:${SIDE_INDENT_MM}mm;flex:none"></div>` : "");
    return `<div style="display:flex;margin-top:${i > 0 ? SIDE_BLOCK_GAP_MM : 0}mm">${number}` +
      `<div style="flex:1;min-width:0">${lines}${shortHtml}${longHtml}</div></div>`;
  }).join("");
  return `<div style="width:${panelW}mm;flex:none;font-size:16pt;line-height:${SIDE_LINE_MM}mm;color:${INK}">${blockHtml}</div>`;
}

// The best beside-the-figure layout for one figure on a page, or null when
// the task and its answers do not fit beside it.
function planBeside(part, task, page) {
  const model = sideBlocks(task, part.prompts);
  let best = null;
  for (const panelW of SIDE_PANELS_MM) {
    const roomW = page.printableWMm - panelW - SIDE_GAP_MM;
    if (roomW <= 10 || sideHeightMm(model, panelW) > page.printableHMm) continue;
    const fit = fitIn(part.natural, part.sizes, roomW, page.printableHMm);
    // The widest panel that costs the figure nothing: words wrap less.
    if (!best || lengthOf(fit) >= lengthOf(best.fit) - 0.5) best = { fit, panelW, model };
  }
  return best;
}

// Lay the figures of one task out as a sheet. `parts` is
// [{ item, natural, render(widthMm, zoom), marks }] in lesson order; `pages`
// gives each way round the page can go. The sheet takes the way round and the
// number of columns that print its figures largest, landscape when it is a tie.
async function sheetPages(parts, { pages, classSize, pageHtml }) {
  const first = parts[0].item;
  const task = taskOf(first);
  const widest = Math.max(...pages.map((p) => p.printableWMm));
  const ready = [];
  for (const [i, part] of parts.entries()) {
    // Only a task the piece was given: `taskOf` falls back to the piece's
    // name, which is the teacher's label for the file and not a heading.
    const own = withoutTaughtMarks(String(part.item.task || (part.item.spec && part.item.spec.task) || "")).trim();
    ready.push({
      ...part,
      sizes: await sizesOf(part.natural, part.render, widest),
      prompts: promptsOf(part.item, part.marks),
      heading: i > 0 && own && own !== task ? own : "",
    });
  }
  let best = null;
  for (const page of pages) {
    for (let cols = 1; cols <= Math.min(ready.length, 4); cols += 1) {
      const plan = planSheet(ready, task, page.printableWMm, page.printableHMm, cols);
      if (!plan) continue;
      const score = plan.score + (page.portrait ? 0 : 0.02);
      if (!best || score > best.score) best = { ...plan, score, page };
    }
  }
  // One figure, a task in parts or more sums than stack beside it: the task
  // goes beside the figure when the figure keeps its size there.
  const landscape = pages.find((p) => !p.portrait);
  if (ready.length === 1 && landscape && (hasPartsToBreak(task) || ready[0].prompts.filter((p) => p.sum).length > MANY_SUMS)) {
    const beside = planBeside(ready[0], task, landscape);
    const above = best ? best.rows[0][0].fit : null;
    if (beside && (!above || lengthOf(beside.fit) >= SIDE_KEEPS * lengthOf(above))) {
      const piece = await drawFit(ready[0].natural, ready[0].render, beside.fit, landscape.printableHMm);
      const body = `<div style="width:${landscape.printableWMm}mm;height:${landscape.printableHMm}mm;display:flex;align-items:center;gap:${SIDE_GAP_MM}mm">` +
        `<div style="flex:1;min-width:0;display:flex;justify-content:center">${piece.html}</div>${sideHtml(beside.model, beside.panelW)}</div>`;
      const copies = copiesFor(first.per || (first.spec && first.spec.per), classSize);
      return {
        pages: Array.from({ length: copies }, () => pageHtml("", body)),
        perPage: 1, portrait: false, columns: 1, beside: true,
        figures: [{ widthMm: beside.fit.widthMm, heightMm: beside.fit.heightMm }],
      };
    }
  }
  if (!best) return { error: "its figures and writing lines do not fit one page" };
  const rowsHtml = [];
  for (const row of best.rows) {
    const cellsHtml = [];
    for (const cell of row) {
      const { part, room, fit, figH } = cell;
      const piece = await drawFit(part.natural, part.render, fit, figH);
      const heading = part.heading
        ? `<div style="font-weight:bold;font-size:14pt;line-height:${HEADING_LINE_MM}mm;margin-bottom:1mm;color:${INK}">${esc(part.heading)}</div>`
        : "";
      const beside = room.sums.length
        ? `<div style="display:flex;flex-direction:column;justify-content:space-around;gap:4mm;margin-left:6mm">${room.sums.map((p) => sumHtml(p.text)).join("")}</div>`
        : "";
      const linesW = room.inOneRow
        ? Math.max(piece.widthMm, Math.min(best.cellW, room.lines.length * (SHORT_LINE_MM + 16)))
        : Math.max(piece.widthMm, Math.min(best.cellW, 120));
      const below = room.lines.length
        ? `<div style="display:flex;flex-direction:${room.inOneRow ? "row" : "column"};gap:${room.inOneRow ? 8 : 0}mm;margin-top:2mm;width:${linesW.toFixed(1)}mm;max-width:${best.cellW.toFixed(1)}mm">` +
          room.lines.map((p) => lineHtml(p.text, room.lineH, room.inOneRow)).join("") + `</div>`
        : "";
      cellsHtml.push(
        `<div style="width:${best.cellW.toFixed(1)}mm;display:flex;flex-direction:column;align-items:center">` +
        `<div style="align-self:stretch">${heading}</div>` +
        `<div style="display:flex;align-items:center;justify-content:center">${piece.html}${beside}</div>${below}</div>`
      );
    }
    rowsHtml.push(`<div style="display:flex;gap:${FIGURE_GAP_MM}mm;align-items:flex-start">${cellsHtml.join("")}</div>`);
  }
  const body = `<div style="width:${best.page.printableWMm}mm;height:${best.page.printableHMm}mm;display:flex;flex-direction:column">` +
    `${taskHtml(task)}<div style="flex:1 1 0;min-height:0;display:flex;flex-direction:column;justify-content:space-between;gap:${FIGURE_GAP_MM}mm">${rowsHtml.join("")}` +
    `${best.rows.length === 1 ? "<div></div>" : ""}</div></div>`;
  const copies = copiesFor(first.per || (first.spec && first.spec.per), classSize);
  return {
    pages: Array.from({ length: copies }, () => pageHtml("", body)),
    perPage: 1,
    portrait: Boolean(best.page.portrait),
    columns: best.rows[0].length,
    figures: best.rows.flat().map((c) => ({ widthMm: c.fit.widthMm, heightMm: c.fit.heightMm })),
  };
}

function normaliseTaskSheet(item) {
  const spec = item.spec || {};
  const task = taskOf(item);
  if (!task) return "a task sheet needs `task`, what children are asked to do, printed at the top";
  const material = spec.material && typeof spec.material === "object" ? spec.material : {};
  const lines = Number.isInteger(spec.answerLines) && spec.answerLines >= 0 ? spec.answerLines : null;
  return {
    label: item.label || "Task",
    task,
    text: typeof material.text === "string" && material.text.trim() ? withoutTaughtMarks(material.text).trim() : null,
    speaker: typeof material.speaker === "string" && material.speaker.trim() ? material.speaker.trim() : null,
    imagePath: typeof material.imagePath === "string" && material.imagePath.trim() ? material.imagePath.trim() : null,
    caption: typeof material.caption === "string" && material.caption.trim() ? material.caption.trim() : null,
    prompts: Array.isArray(spec.prompts) ? spec.prompts.map((p) => withoutTaughtMarks(String(p)).trim()).filter(Boolean) : [],
    lines,
    per: spec.per || item.per || "pair",
  };
}

// A box to write in, where the text marks one: `[ ]` (any spaces inside) or
// the board's `☐`. A designer types it at the end of each line of a poem to
// count; printed as typed it was a pair of brackets, not a box (2 October 2026).
const BOX_MARK = /\s*(?:\[\s*\]|☐)\s*/g;
// A mark at the end of a line is that line's box (a count written beside it);
// a mark inside a line is a gap in the sentence and stays where it is.
const END_BOX = /\s*(?:\[\s*\]|☐)\s*$/;
const MIN_TEXT_PT = 16;
const MAX_TEXT_PT = 26;
const MIN_ANSWER_LINES = 3;

const lineMmAt = (pt) => pt * 0.5;            // 16pt sets 8mm lines
const charsAt = (pt, widthMm) => Math.max(20, Math.floor(widthMm / (pt * 0.24)));

// How many printed lines the text takes at a size: each written line wraps on
// its own, and an empty one (the gap between stanzas) is still a line. The old
// count added the whole text's wrap to its line breaks, counted a ten-line poem
// as seventeen, left no room for answer lines and printed half a page.
function textLines(text, pt, widthMm) {
  const chars = charsAt(pt, widthMm);
  return text.split("\n").reduce((n, line) => n + Math.max(1, Math.ceil(line.replace(BOX_MARK, "").length / chars)), 0);
}

function textHtml(text, pt) {
  const boxMm = (pt * 0.42).toFixed(1);
  const box = `<span style="display:inline-block;width:${boxMm}mm;height:${boxMm}mm;border:0.5mm solid ${INK};border-radius:1mm;vertical-align:middle;background:#fff"></span>`;
  // Every mark left inside a line is a gap drawn where it stands.
  const inPlace = (words) => esc(words).replace(/\[\s*\]|\u2610/g, box);
  const lines = text.split("\n");
  if (!lines.some((line) => END_BOX.test(line))) {
    return lines.map((line) => inPlace(line)).join("<br>");
  }
  // Lines that end in a box print as two columns, words then box, so the
  // boxes line up down the page where the counts are written. The words'
  // column may wrap, so a long line never pushes its box off the page.
  const cells = lines.map((line) => {
    if (!line.trim()) return `<div style="grid-column:1 / span 2;height:${(lineMmAt(pt) * 0.6).toFixed(1)}mm"></div>`;
    const endBox = END_BOX.test(line);
    const words = inPlace(line.replace(END_BOX, "").trim());
    return `<div>${words}</div><div style="padding-left:6mm">${endBox ? box : ""}</div>`;
  });
  return `<div style="display:grid;grid-template-columns:minmax(0, max-content) auto;row-gap:1mm;align-items:center">${cells.join("")}</div>`;
}

// The task sheet: the task, the material in a frame (a named child's words in
// a speech box, a short text, a picture), any smaller prompts, then ruled lines
// down to the bottom of the page so nothing is left blank. The material prints
// as large as the page allows while leaving room to answer.
function taskSheetPages(sheet, { printableWMm, printableHMm, classSize, pageHtml, baseDir }) {
  const parts = [taskHtml(sheet.task)];
  let used = taskHeightMm(sheet.task, printableWMm);
  if (sheet.imagePath) {
    const file = path.isAbsolute(sheet.imagePath) ? sheet.imagePath : path.join(baseDir || ".", sheet.imagePath);
    if (!fs.existsSync(file)) return { error: `its picture ${sheet.imagePath} was not found, and the sheet is not printed without it` };
    const ext = path.extname(file).toLowerCase();
    const mime = ext === ".png" ? "image/png" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : ext === ".svg" ? "image/svg+xml" : null;
    if (!mime) return { error: `${sheet.imagePath} is not a picture the pack can print` };
    const picH = Math.min(85, (printableHMm - used) * 0.5);
    parts.push(
      `<div style="text-align:center;margin-bottom:3mm"><img src="${printSizedDataUriSync(file, mime)}" alt="" ` +
      `style="max-width:${printableWMm}mm;height:${picH.toFixed(1)}mm;object-fit:contain">` +
      (sheet.caption ? `<div style="font-size:12pt;color:${INK}">${esc(sheet.caption)}</div>` : "") + `</div>`
    );
    used += picH + (sheet.caption ? 6 : 0) + 3;
  }
  const promptPt = (pt) => Math.max(14, Math.round(pt * 0.85));
  const promptsMm = (pt) => sheet.prompts.reduce((mm, p) =>
    mm + Math.ceil(p.length / charsAt(promptPt(pt), printableWMm)) * lineMmAt(promptPt(pt)) + 2, 0);
  // The frame's padding, border and margin (11mm), then its lines as
  // textHtml draws them: a boxed poem's stanza gaps are shorter than a line
  // and its rows are 1mm apart.
  const textMm = (pt) => {
    if (!sheet.text) return 0;
    const speakerMm = sheet.speaker ? 7 : 0;
    const lines = sheet.text.split("\n");
    if (!lines.some((line) => END_BOX.test(line))) {
      return textLines(sheet.text, pt, printableWMm - 10) * lineMmAt(pt) + 11 + speakerMm;
    }
    const empty = lines.filter((line) => !line.trim()).length;
    const full = textLines(lines.filter((line) => line.trim()).join("\n"), pt, printableWMm - 30);
    return full * lineMmAt(pt) + empty * lineMmAt(pt) * 0.6 + (lines.length - 1) + 11 + speakerMm;
  };
  const wantLines = sheet.lines == null ? MIN_ANSWER_LINES : sheet.lines;
  let pt = MIN_TEXT_PT;
  for (let size = MAX_TEXT_PT; size > MIN_TEXT_PT; size -= 1) {
    if (used + textMm(size) + promptsMm(size) + wantLines * RULE_MM + 2 <= printableHMm) {
      pt = size;
      break;
    }
  }
  if (sheet.text) {
    const label = sheet.speaker ? `<div style="font-weight:bold;font-size:${promptPt(pt)}pt;margin-bottom:1mm">${esc(sheet.speaker)} says:</div>` : "";
    parts.push(
      `<div style="border:0.5mm solid ${INK};border-radius:${sheet.speaker ? 5 : 2}mm;padding:3mm 4mm;margin-bottom:4mm;` +
      `font-size:${pt}pt;line-height:${lineMmAt(pt)}mm;color:${INK}">${label}${textHtml(sheet.text, pt)}</div>`
    );
    used += textMm(pt);
  }
  for (const prompt of sheet.prompts) {
    parts.push(`<div style="font-size:${promptPt(pt)}pt;margin-bottom:2mm;color:${INK}">${esc(prompt)}</div>`);
  }
  used += promptsMm(pt);
  const room = Math.max(0, printableHMm - used - 2);
  const rule = `<div style="height:${RULE_MM}mm;flex:none;border-bottom:0.3mm solid ${GREY}"></div>`;
  if (sheet.lines == null) {
    // Lines down to the foot of the page, however tall the words above came
    // out: the heights above are estimates, and an estimate that runs high
    // left a quarter of a page blank (2 October 2026). The block takes the
    // height that is left and shows the lines that fit in it.
    const most = Math.ceil(printableHMm / RULE_MM);
    parts.push(`<div style="flex:1 1 0;min-height:0;overflow:hidden;display:flex;flex-direction:column">${rule.repeat(most)}</div>`);
  } else {
    const lines = Math.min(sheet.lines, Math.floor(room / RULE_MM));
    if (lines > 0) parts.push(`<div>${rule.repeat(lines)}</div>`);
  }
  const body = `<div style="width:${printableWMm}mm;height:${printableHMm}mm;display:flex;flex-direction:column">${parts.join("")}</div>`;
  const copies = copiesFor(sheet.per, classSize);
  return { pages: Array.from({ length: copies }, () => pageHtml("", body)), perPage: 1 };
}

module.exports = { figurePages, sheetPages, promptsOf, normaliseTaskSheet, taskSheetPages, taskOf, taskParts, hasPartsToBreak };
