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

function taskHeightMm(task, widthMm) {
  if (!task) return 0;
  const charsPerLine = Math.max(20, Math.floor(widthMm / 3.4));
  return Math.ceil(task.length / charsPerLine) * TASK_LINE_MM + TASK_GAP_MM;
}

function taskHtml(task) {
  return task
    ? `<div style="font-weight:bold;font-size:18pt;line-height:${TASK_LINE_MM}mm;margin-bottom:${TASK_GAP_MM}mm;color:${INK}">${esc(task)}</div>`
    : "";
}

function copiesFor(per, classSize) {
  if (per === "child") return classSize;
  if (per === "group") return Math.ceil(classSize / 4);
  return Math.ceil(classSize / 2);
}

// Lay a write-on figure out as pages. `render(widthMm)` draws the figure at a
// width and returns { html, widthMm, heightMm }; it is called again at the
// size the page allows, because a figure drawn larger is redrawn, never
// stretched.
async function figurePages(item, natural, render, { printableWMm, printableHMm, classSize, pageHtml }) {
  const task = taskOf(item);
  const aspect = natural.widthMm / natural.heightMm;
  const oneUpTask = taskHeightMm(task, printableWMm);
  const oneUpScale = Math.min(printableWMm / natural.widthMm, (printableHMm - oneUpTask) / natural.heightMm);
  const halfH = (printableHMm - TWO_UP_GAP_MM) / 2;
  const twoUpScale = Math.min(printableWMm / natural.widthMm, (halfH - oneUpTask) / natural.heightMm);
  const twoUp = twoUpScale > 0 && twoUpScale >= TWO_UP_SHARE * oneUpScale;
  const scale = twoUp ? twoUpScale : oneUpScale;
  let piece = await render(natural.widthMm * scale);
  // A figure laid out at its width can come back a little taller than its
  // aspect promised; draw it again at the width that fits.
  const roomH = (twoUp ? halfH : printableHMm) - oneUpTask;
  if (piece.heightMm > roomH) piece = await render(piece.widthMm * (roomH / piece.heightMm) * 0.98);
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
    aspect,
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

module.exports = { figurePages, normaliseTaskSheet, taskSheetPages, taskOf };
