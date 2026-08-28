#!/usr/bin/env node
"use strict";

// The same drawing at descending sizes, so a teacher can point at the one that
// stops working.
//
//   npm run size-ladder
//
// Every helper states a minimum size, and those numbers decide whether a
// layout is refused. They were arrived at by reasoning about millimetres, which
// is the wrong way to settle "can a nine-year-old use this": that question is
// answered by looking at it on paper, not by arithmetic.
//
// So this prints each helper at a ladder of true widths with the millimetres
// written beside each rung. Daniel marks the smallest rung that still works,
// and its width becomes the helper's stated minimum. This is how the slide
// helpers were sized, and it is the only part of this engine that a person has
// to supply rather than the code work out.
//
// Nothing here goes through the layout engine. The point is to see the drawing
// at a chosen width, not to see how a zone would treat it.

const fs = require("node:fs");
const path = require("node:path");

const { REGISTRY, helperNames, helperCss } = require("../src/helpers");
const { cssVariables } = require("../src/tokens");
const { htmlToPdf } = require("../src/chrome");
const { printableArea, DEFAULT_MARGIN_MM } = require("../src/page");
const EXAMPLES = require("../test/helper-examples");
const { isJudged, judgedNames } = require("../src/sized-by-eye");

const AREA = printableArea("portrait", DEFAULT_MARGIN_MM);

// The rungs sit AROUND each helper's current minimum rather than spanning the
// whole page. Showing every size from 180mm down produced ninety-odd pages,
// most of them answering a question nobody is asking: a bar chart at 180mm is
// obviously fine. The decision is only ever about the small end, so the ladder
// starts a little above where the helper currently claims it can work and goes
// down from there until it is plainly too small.
const RUNGS_OF_MINIMUM = [1.3, 1.0, 0.85, 0.7, 0.55];

const GAP_MM = 4;
const LABEL_MM = 14;

function heightAt(name, widthMm) {
  return REGISTRY[name].measure({ helper: name, ...EXAMPLES[name] }, widthMm);
}

// A drawing's box is set to its measured height, so packing knows exactly how
// tall it is. Anything made of HTML is left to be as tall as it turns out, and
// at these deliberately narrow widths that runs a little over the estimate:
// text wraps to more lines than the arithmetic expects. Allowed for here
// rather than left to spill off the bottom of a page.
const HTML_SLACK = 1.3;

function rungsFor(name, statedMinMm) {
  const spec = { helper: name, ...EXAMPLES[name] };
  const isDrawing = REGISTRY[name].render(spec).includes('class="h-figure"');

  const seen = new Set();
  const rungs = [];
  for (const factor of RUNGS_OF_MINIMUM) {
    const widthMm = Math.round(statedMinMm * factor);
    if (widthMm < 20 || widthMm > AREA.widthMm || seen.has(widthMm)) continue;
    seen.add(widthMm);
    const heightMm = heightAt(name, widthMm);
    if (!Number.isFinite(heightMm) || heightMm <= 0) continue;
    rungs.push({
      widthMm,
      heightMm,
      packHeightMm: isDrawing ? heightMm : heightMm * HTML_SLACK,
      isStated: factor === 1,
    });
  }
  return rungs;
}

// Rungs flow left to right and wrap, so several sit side by side rather than
// one under another down a column. Worked out here rather than left to the
// browser, because the pages have to be packed before they are written.
function rowsOf(rungs) {
  const rows = [];
  let row = [];
  let rowW = 0;

  for (const rung of rungs) {
    const w = rung.widthMm + LABEL_MM + GAP_MM;
    if (rowW + w > AREA.widthMm && row.length) {
      rows.push(row);
      row = [];
      rowW = 0;
    }
    row.push(rung);
    rowW += w;
  }
  if (row.length) rows.push(row);

  return rows.map((r) => ({
    rungs: r,
    heightMm: Math.max(...r.map((x) => x.packHeightMm)) + GAP_MM,
  }));
}

function rungHtml(name, rung) {
  const spec = { helper: name, ...EXAMPLES[name] };
  const html = REGISTRY[name].render(spec);

  // A DRAWING is given a definite height, because it fills its box and needs
  // one to keep its proportions. Anything made of HTML is given its width and
  // left to be as tall as it turns out: pinning its height to the estimate is
  // how a recording table came to be shown with its bottom row sliced off
  // instead of resized, which is exactly the fault being judged.
  const isDrawing = html.includes('class="h-figure"');
  const box = isDrawing
    ? `width:${rung.widthMm}mm; height:${rung.heightMm.toFixed(1)}mm;`
    : `width:${rung.widthMm}mm;`;

  return `
    <div class="rung${rung.isStated ? " rung--stated" : ""}">
      <div class="rung-label">${rung.widthMm}mm${rung.isStated ? " &#9664;" : ""}</div>
      <div class="rung-box" style="${box}">${html}</div>
    </div>`;
}

function headHtml(name, statedMinMm, continued) {
  return `
      <div class="block-head">
        <strong>${name}</strong>
        &nbsp; currently claims ${Math.round(statedMinMm)}mm &#9664;
        ${continued ? "&nbsp; (continued)" : ""}
      </div>`;
}

async function main() {
  const out = path.join(__dirname, "..", "out");
  fs.mkdirSync(out, { recursive: true });

  const skipped = [];
  let shown = 0;

  // Rows are packed onto pages, not whole helpers. Keeping a helper's rungs
  // together reads better and it CANNOT always be done: a coordinate grid's
  // five rungs are 424mm of rows, well over a page, so insisting on it pushed
  // 183mm of the grid off the bottom of the sheet where it simply could not be
  // seen. Four of the helpers Daniel could not find were this. A helper that
  // does not fit is carried onto the next page under the same heading.
  const HEAD_MM = 10;
  const sheets = [];
  let page = [];
  let used = 0;

  const endPage = () => {
    if (page.length) sheets.push(`<section class="sheet">${page.join("")}</section>`);
    page = [];
    used = 0;
  };

  // Only what has NOT been settled. Being asked again about something you have
  // already given a verdict on is worse than not being asked: it wastes the
  // one thing here that cannot be automated, which is a teacher's eye on a
  // printed page.
  const settled = judgedNames().filter((n) => helperNames().includes(n));

  for (const name of helperNames()) {
    if (isJudged(name)) continue;
    if (!EXAMPLES[name]) {
      skipped.push(name);
      continue;
    }

    const statedMinMm = REGISTRY[name].needs({ helper: name, ...EXAMPLES[name] })
      .minWidthMm;
    const rows = rowsOf(rungsFor(name, statedMinMm));
    if (!rows.length) continue;
    shown += 1;

    let continued = false;
    let open = false;

    for (const row of rows) {
      if (!open || used + row.heightMm > AREA.heightMm) {
        if (open) page.push("</div>"); // close the block we were filling
        if (used + row.heightMm + HEAD_MM > AREA.heightMm) endPage();
        page.push(`<div class="block">${headHtml(name, statedMinMm, continued)}<div class="rungs">`);
        used += HEAD_MM;
        continued = true;
        open = true;
      }
      page.push(row.rungs.map((r) => rungHtml(name, r)).join(""));
      used += row.heightMm;
    }

    if (open) page.push("</div></div>");
  }
  endPage();

  if (!shown) {
    console.log(
      `Nothing left to judge: all ${settled.length} helpers have had their ` +
        `smallest usable size settled by eye.\n\n` +
        `The verdicts are in src/sized-by-eye.js. A helper added later, or one\n` +
        `whose drawing changes, drops off that list and appears here again.`
    );
    return;
  }

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>How small can each helper go?</title>
<style>
${cssVariables()}
${helperCss}

  html, body { margin: 0; padding: 0; background: #6b7280; font-family: var(--font); }

  .sheet {
    position: relative;
    width: 210mm; height: 297mm;
    padding: ${DEFAULT_MARGIN_MM}mm;
    box-sizing: border-box;
    background: white;
    margin: 8mm auto;
    box-shadow: 0 2mm 6mm rgba(0,0,0,0.35);
    overflow: hidden;
    display: flex; flex-direction: column;
  }

  .block {
    padding-bottom: 4mm; margin-bottom: 4mm;
    border-bottom: 0.3mm solid var(--colour-rule);
  }
  .block:last-child { border-bottom: none; }
  .block-head {
    font-size: var(--type-note); color: var(--colour-quiet);
    margin-bottom: 2mm;
  }
  .block-head strong { color: var(--colour-question); font-size: var(--type-body); }

  /* Rungs run left to right, biggest first, and wrap. Side by side is what
     makes "this one is fine, that one is not" a glance rather than a memory
     test. */
  .rungs { display: flex; flex-wrap: wrap; align-items: flex-start; gap: ${GAP_MM}mm; }
  .rung { display: flex; align-items: flex-start; }
  .rung-label {
    width: ${LABEL_MM}mm; flex: none;
    font-size: var(--type-note); color: var(--colour-quiet);
    padding-top: 1mm;
  }
  /* The rung at the helper's CURRENT stated minimum, so the question is "is
     this one already too small", not "count the rungs". */
  .rung--stated .rung-label { color: var(--colour-given); font-weight: bold; }
  .rung--stated .rung-box { outline: 0.3mm dashed var(--colour-given); }

  .rung-box { flex: none; }

  @media print {
    html, body { background: white; }
    .sheet { margin: 0; box-shadow: none; break-after: page; page-break-after: always; }
    .sheet:last-child { break-after: auto; page-break-after: auto; }
  }
</style></head>
<body>${sheets.join("")}</body></html>`;

  const htmlPath = path.join(out, "size-ladder.html");
  fs.writeFileSync(htmlPath, html);
  fs.writeFileSync(path.join(out, "size-ladder.pdf"), await htmlToPdf(html));

  console.log(
    `${sheets.length} pages, ${shown} helpers still to judge, each at ` +
      `${RUNGS_OF_MINIMUM.map((f) => `${Math.round(f * 100)}%`).join(", ")} ` +
      `of the width it currently claims it needs.`
  );
  if (skipped.length) console.log(`No example content for: ${skipped.join(", ")}`);
  console.log(`
Already settled, so left out: ${settled.join(", ")}`);
  console.log(`\n  ${htmlPath}`);
  console.log(`  ${path.join(out, "size-ladder.pdf")}`);
  console.log(
    `\nThe dashed rung is where each helper's minimum currently sits.\n` +
      `Mark the smallest rung a child could still use and I will set it there.`
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
