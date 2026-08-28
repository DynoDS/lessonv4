"use strict";

// The layout gallery: every layout in the library, drawn as an empty labelled
// skeleton, both orientations, on one scrollable page.
//
// Deliberately no content. Content is what made the first studio hard to read:
// you cannot judge an arrangement while you are reading questions sitting in
// it. Each zone shows only its letter and its real size in millimetres, so what
// you are looking at is the shape and nothing else.

const { pageSize, printableArea, DEFAULT_MARGIN_MM } = require("../src/page");
const { cssVariables } = require("../src/tokens");
const { LAYOUTS, VARIANTS, zonesOf, flatten } = require("../src/layouts");
const { REAL_SHEETS } = require("./real-sheets");
const { REGISTRY, helperNames } = require("../src/helpers");
const { zoneContentMm } = require("../src/render");
const EXAMPLES = require("../test/helper-examples");

const TOTAL_HELPERS = helperNames().length;

// Each tile is drawn at a fraction of true size so a whole library fits on
// screen. The millimetre labels always report the REAL size, not the drawn one.
const TILE_SCALE = 0.42;

function mm(n) {
  return Math.round(n * 10) / 10;
}

// How many of the helpers a zone that size can actually hold.
//
// Adding a layout changes nothing about the helpers: a helper states what IT
// needs, and knows nothing about layouts. What a new layout changes is where
// content can GO. So the useful thing to see while drawing one is whether each
// zone can hold anything at all.
//
// It is not hypothetical. Two layouts already in the library, side-20-80 and
// side-80-20, have a 30mm column in portrait that holds NONE of the twenty
// eight. Half of each of those layouts cannot be used, and nothing said so.
function helpersFitting(wMm, hMm) {
  return helperNames().filter((name) => {
    const need = REGISTRY[name].needs({ helper: name, ...EXAMPLES[name] });
    return wMm >= need.minWidthMm && hMm >= need.minHeightMm;
  }).length;
}

function tile(layout, orientation) {
  const page = pageSize(orientation);
  const area = printableArea(orientation, DEFAULT_MARGIN_MM);

  let tightest = Infinity;

  const zones = zonesOf(layout)
    .map((z) => {
      const wMm = mm(z.w * area.widthMm);
      const hMm = mm(z.h * area.heightMm);
      const { wMm: cw, hMm: ch } = zoneContentMm(z, area);
      const holds = helpersFitting(cw, ch);
      tightest = Math.min(tightest, holds);

      return `
        <div class="zone${holds === 0 ? " zone--empty" : ""}" style="
          left:${z.x * 100}%; top:${z.y * 100}%;
          width:${z.w * 100}%; height:${z.h * 100}%;">
          <span class="zid">${z.id}</span>
          <span class="zdim">${wMm} x ${hMm}</span>
          <span class="zfit">${holds === 0 ? "holds nothing" : `${holds}/${TOTAL_HELPERS}`}</span>
        </div>`;
    })
    .join("");

  return `
    <figure class="tile">
      <div class="page" style="
        width:${page.widthMm * TILE_SCALE}mm;
        height:${page.heightMm * TILE_SCALE}mm;
        padding:${DEFAULT_MARGIN_MM * TILE_SCALE}mm;">
        <div class="area">${zones}</div>
      </div>
      <figcaption>
        <b>${layout.name}</b>
        <span class="meta">${layout.id} &middot; ${orientation} &middot; ${zonesOf(layout).length} zones</span>
        <span class="fit${tightest === 0 ? " fit--dead" : ""}">tightest zone holds ${tightest} of ${TOTAL_HELPERS} helpers</span>
      </figcaption>
    </figure>`;
}

// A real sheet drawn bigger, with its zones named for what goes in them.
function realTile(sheet) {
  const SCALE = 0.55;
  const page = pageSize(sheet.orientation);
  const area = printableArea(sheet.orientation, DEFAULT_MARGIN_MM);

  const zones = flatten(sheet.tree)
    .map((z) => {
      const wMm = mm(z.w * area.widthMm);
      const hMm = mm(z.h * area.heightMm);
      const pct = Math.round(z.h * 100);
      return `
        <div class="zone real" style="
          left:${z.x * 100}%; top:${z.y * 100}%;
          width:${z.w * 100}%; height:${z.h * 100}%;">
          <span class="zname">${sheet.labels[z.id] || z.id}</span>
          <span class="zdim">${wMm} x ${hMm}mm &middot; ${pct}% of height</span>
        </div>`;
    })
    .join("");

  return `
    <figure class="realcard">
      <div class="page" style="
        width:${page.widthMm * SCALE}mm;
        height:${page.heightMm * SCALE}mm;
        padding:${DEFAULT_MARGIN_MM * SCALE}mm;">
        <div class="area">${zones}</div>
      </div>
      <figcaption class="realcap">
        <b>${sheet.name}</b>
        <span class="meta">${sheet.orientation} &middot; nearest layout: ${sheet.layout}</span>
        <p>${sheet.blurb}</p>
        <p class="share"><b>Your rule:</b> ${sheet.share}</p>
        <p class="eg">${sheet.example}</p>
      </figcaption>
    </figure>`;
}

function buildGalleryHtml() {
  const portrait = LAYOUTS.map((l) => tile(l, "portrait")).join("");
  const landscape = LAYOUTS.map((l) => tile(l, "landscape")).join("");
  const varP = VARIANTS.map((l) => tile(l, "portrait")).join("");
  const varL = VARIANTS.map((l) => tile(l, "landscape")).join("");
  const area = printableArea("portrait", DEFAULT_MARGIN_MM);
  const areaL = printableArea("landscape", DEFAULT_MARGIN_MM);

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Worksheet layout library</title>
<style>
${cssVariables()}

  body {
    font-family: var(--font);
    margin: 0; padding: 10mm 12mm 20mm;
    background: #E9ECEE;
    color: var(--colour-ink);
  }
  h1 { font-size: 17pt; margin: 0 0 1mm; }
  .lede { font-size: 10pt; color: var(--colour-quiet); margin: 0 0 6mm; max-width: 190mm; }
  h2 {
    font-size: 13pt; margin: 8mm 0 4mm;
    border-bottom: 0.4mm solid #C5CCD0; padding-bottom: 2mm;
  }
  h2 span { font-weight: normal; font-size: 10pt; color: var(--colour-quiet); }

  .grid { display: flex; flex-wrap: wrap; gap: 8mm; align-items: flex-start; }

  .tile { margin: 0; }
  .page {
    background: #fff;
    box-sizing: border-box;
    box-shadow: 0 1mm 3mm rgba(0,0,0,0.16);
    position: relative;
  }
  .area { position: relative; width: 100%; height: 100%; }

  .zone {
    position: absolute;
    box-sizing: border-box;
    border: 0.4mm solid var(--colour-question);
    background: rgba(0,112,192,0.06);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    overflow: hidden;
  }
  .zid {
    font-size: 11pt; font-weight: bold;
    color: var(--colour-question); line-height: 1;
  }
  .zdim {
    font-size: 6.5pt; color: var(--colour-quiet);
    margin-top: 0.6mm; white-space: nowrap;
  }
  .zfit {
    font-size: 6pt; color: var(--colour-quiet);
    margin-top: 0.3mm; white-space: nowrap;
  }

  /* A zone nothing fits in. Drawn as a fault rather than a colour choice: half
     a layout that can never hold anything is a layout half built. */
  .zone--empty {
    border-color: var(--colour-given);
    background: repeating-linear-gradient(
      45deg, rgba(228,108,10,0.10), rgba(228,108,10,0.10) 2mm,
      transparent 2mm, transparent 4mm);
  }
  .zone--empty .zid, .zone--empty .zfit { color: var(--colour-given); }

  figcaption { margin-top: 2mm; font-size: 9pt; max-width: 92mm; }
  figcaption .meta { display: block; color: var(--colour-quiet); font-size: 7.5pt; }
  figcaption .fit { display: block; color: var(--colour-quiet); font-size: 7.5pt; }
  figcaption .fit--dead { color: var(--colour-given); font-weight: bold; }

  /* Real sheets: bigger, with the zones named for what goes in them. */
  .reals { gap: 10mm; }
  .realcard { display: flex; gap: 6mm; margin: 0 0 4mm; align-items: flex-start; }
  .realcap { max-width: 78mm; margin-top: 0; }
  .realcap p { margin: 2mm 0 0; font-size: 8.5pt; line-height: 1.35; }
  .realcap .share { color: var(--colour-given); }
  .realcap .eg { color: var(--colour-quiet); }
  .zone.real {
    border-color: var(--colour-given);
    background: rgba(228,108,10,0.07);
    padding: 1.5mm;
  }
  .zone.real .zname {
    font-size: 8.5pt; font-weight: bold; color: var(--colour-ink);
    text-align: center; line-height: 1.15;
  }
</style></head>
<body>
  <h1>Worksheet layout library</h1>
  <p class="lede">
    Every layout is geometry only: how the page divides, not what goes in it.
    Each zone shows its letter and its real printed size. Anything that fits a
    zone can go in it, so one layout serves a maths sheet and a geography sheet
    without being rebuilt.
  </p>

  <h2>Your real sheets <span>the six sheet types from your own worksheet-compositions file, on the layout that fits each</span></h2>
  <p class="lede">
    Easier to judge than empty boxes. If one of these has no good layout, that
    is a gap to fill. If a layout below never turns up here, it is a candidate
    for cutting.
  </p>
  <div class="grid reals">${REAL_SHEETS.map(realTile).join("")}</div>

  <h2>Portrait <span>printable area ${mm(area.widthMm)} x ${mm(area.heightMm)}mm, inside a ${DEFAULT_MARGIN_MM}mm margin</span></h2>
  <div class="grid">${portrait}</div>

  <h2>Landscape <span>printable area ${mm(areaL.widthMm)} x ${mm(areaL.heightMm)}mm, inside a ${DEFAULT_MARGIN_MM}mm margin</span></h2>
  <div class="grid">${landscape}</div>

  <h2>Ratio variants, portrait <span>the same two-zone split at every useful proportion. A variant is a number, not a new layout.</span></h2>
  <div class="grid">${varP}</div>

  <h2>Ratio variants, landscape</h2>
  <div class="grid">${varL}</div>
</body></html>`;
}

module.exports = { buildGalleryHtml };
