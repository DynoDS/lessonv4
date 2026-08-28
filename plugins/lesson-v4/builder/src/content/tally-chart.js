'use strict';

// Renders a tally chart: a table with a group-label column, a tally column whose
// counts are drawn as bundles of five (four verticals crossed by a fifth
// diagonal), and an optional Total column. The core statistics visual for UK
// primary data-handling lessons — read on the board, practised on a sheet, and
// pinned to the working wall.
//
// The DIAGRAM GEOMETRY lives in the shared module
// ../../../shared/visuals/tally-chart-svg.js, imported below, so the slide deck,
// worksheets and the working wall all draw an identical chart from one source.
// This file keeps only the slide-specific work: pre-rendering each unique SVG to
// a PNG before the slide loop, then placing it by its true aspect (NO DEADSPACE).
//
// Spec: see shared/visuals/tally-chart-svg.js (title, headers, rows, showTotals,
// blank).

const requireGlobal = require('../require-global');

// Shared geometry — one source of truth for the tally-chart drawing.
const { tightSvg, cacheKey } = require('../../../shared/visuals/tally-chart-svg');
const buildSvg = tightSvg;        // (spec) → { svg, aspect }, cropped tight
const tallyChartKey = cacheKey;   // (spec) → stable pre-render cache key

// ─── SLIDE-SPECIFIC CONSTANTS ─────────────────────────────────
const PAD       = 0.10;   // zone inner padding (inches)
const RENDER_PX = 1100;   // longest side of the pre-rendered PNG (charts carry text)
// ─── END CONSTANTS ────────────────────────────────────────────

async function preRenderTallyCharts(lesson) {
  let sharp;
  try { sharp = requireGlobal('sharp'); } catch (e) { return {}; }

  const specs = {};
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    if (obj.type === 'tally-chart') {
      const key = tallyChartKey(obj);
      if (!specs[key]) specs[key] = obj;
    }
    for (const k of Object.keys(obj)) walk(obj[k]);
  }
  walk(lesson);

  const map = {};
  for (const [key, spec] of Object.entries(specs)) {
    const { svg, aspect } = buildSvg(spec);
    // Render so the LONGER side is RENDER_PX — keeps the chart crisp whatever
    // its proportions, without a fixed square forcing it to render small.
    const resize = aspect >= 1 ? { width: RENDER_PX } : { height: RENDER_PX };
    try {
      const png = await sharp(Buffer.from(svg), { density: 144 }).resize(resize).png().toBuffer();
      map[key] = { png, aspect };
    } catch (e) {
      // skip — placeholder shown at draw time
    }
  }
  return map;
}

function drawTallyChart(pptx, slide, zone, data, ctx) {
  const key = tallyChartKey(data);

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const innerH = zone.h - 2 * PAD;

  const entry = ctx.tallyChartImages && ctx.tallyChartImages[key];
  if (innerW <= 0.05 || innerH <= 0.05) return;

  if (entry && entry.png) {
    // Place by the image's true aspect ratio so it fills the slot with no
    // deadspace — width-bound or height-bound, whichever keeps it inside.
    const aspect = entry.aspect || 1;
    let w = innerW;
    let h = w / aspect;
    if (h > innerH) { h = innerH; w = h * aspect; }
    const x = innerX + (innerW - w) / 2;
    const y = innerY + (innerH - h) / 2;
    slide.addImage({
      data: 'image/png;base64,' + entry.png.toString('base64'),
      x: x, y: y, w: w, h: h
    });
  } else {
    require('./figure-fallback').drawFigureFallback(pptx, slide, { x: innerX, y: innerY, w: innerW, h: innerH }, ctx, 'tally chart');
  }
}

module.exports = { drawTallyChart, preRenderTallyCharts, tallyChartKey };
