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

// The task sheet: the task, the material in a frame (a named child's words in
// a speech box, a short text, a picture), any smaller prompts, then ruled lines
// down to the bottom of the page so nothing is left blank.
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
      `<div style="text-align:center;margin-bottom:3mm"><img src="data:${mime};base64,${fs.readFileSync(file).toString("base64")}" alt="" ` +
      `style="max-width:${printableWMm}mm;height:${picH.toFixed(1)}mm;object-fit:contain">` +
      (sheet.caption ? `<div style="font-size:12pt;color:${INK}">${esc(sheet.caption)}</div>` : "") + `</div>`
    );
    used += picH + (sheet.caption ? 6 : 0) + 3;
  }
  if (sheet.text) {
    const label = sheet.speaker ? `<div style="font-weight:bold;font-size:14pt;margin-bottom:1mm">${esc(sheet.speaker)} says:</div>` : "";
    const lineCount = Math.ceil(sheet.text.length / 70) + sheet.text.split("\n").length - 1;
    parts.push(
      `<div style="border:0.5mm solid ${INK};border-radius:${sheet.speaker ? 5 : 2}mm;padding:3mm 4mm;margin-bottom:4mm;` +
      `font-size:16pt;line-height:8mm;color:${INK}">${label}${esc(sheet.text).replace(/\n/g, "<br>")}</div>`
    );
    used += lineCount * 8 + (sheet.speaker ? 7 : 0) + 10;
  }
  for (const prompt of sheet.prompts) {
    parts.push(`<div style="font-size:14pt;margin-bottom:2mm;color:${INK}">${esc(prompt)}</div>`);
    used += 8;
  }
  const room = Math.max(0, printableHMm - used - 2);
  const lines = sheet.lines == null ? Math.floor(room / RULE_MM) : Math.min(sheet.lines, Math.floor(room / RULE_MM));
  if (lines > 0) {
    parts.push(
      `<div>${Array.from({ length: lines }, () =>
        `<div style="height:${RULE_MM}mm;border-bottom:0.3mm solid ${GREY}"></div>`).join("")}</div>`
    );
  }
  const body = `<div style="width:${printableWMm}mm">${parts.join("")}</div>`;
  const copies = copiesFor(sheet.per, classSize);
  return { pages: Array.from({ length: copies }, () => pageHtml("", body)), perPage: 1 };
}

module.exports = { figurePages, normaliseTaskSheet, taskSheetPages, taskOf };
