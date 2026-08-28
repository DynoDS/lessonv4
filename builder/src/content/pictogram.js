'use strict';

// Renders a pictogram: rows of category labels each followed by a series of
// house-blue symbols (filled circles), with a KEY below stating how many units
// one symbol represents. A LEFT half-circle stands for HALF the key value — the
// central Year 4 teaching point. The core "read a pictogram with a key" visual
// children meet on the board, practise on a sheet, and look up on the wall.
//
// The DIAGRAM GEOMETRY lives in the shared module
// ../../../shared/visuals/pictogram-svg.js, imported below, so the slide deck,
// worksheets and the working wall all draw an identical chart from one source.
// This file keeps only the slide-specific work: pre-rendering each unique SVG
// to a PNG before the slide loop, then placing it by its true aspect (NO
// DEADSPACE).
//
// Spec: see shared/visuals/pictogram-svg.js (title, categories, values, key).

const requireGlobal = require('../require-global');

// Shared geometry — one source of truth for the pictogram drawing.
const { tightSvg, cacheKey } = require('../../../shared/visuals/pictogram-svg');
const buildSvg = tightSvg;        // (spec) → { svg, aspect }, cropped tight
const pictogramKey = cacheKey;    // (spec) → stable pre-render cache key

// ─── SLIDE-SPECIFIC CONSTANTS ─────────────────────────────────
const PAD       = 0.10;   // zone inner padding (inches)
const RENDER_PX = 1100;   // longest side of the pre-rendered PNG (charts carry text)
// ─── END CONSTANTS ────────────────────────────────────────────

async function preRenderPictograms(lesson) {
  let sharp;
  try { sharp = requireGlobal('sharp'); } catch (e) { return {}; }

  const specs = {};
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    if (obj.type === 'pictogram') {
      const key = pictogramKey(obj);
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

function drawPictogram(pptx, slide, zone, data, ctx) {
  const key = pictogramKey(data);

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const innerH = zone.h - 2 * PAD;

  const entry = ctx.pictogramImages && ctx.pictogramImages[key];
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
    require('./figure-fallback').drawFigureFallback(pptx, slide, { x: innerX, y: innerY, w: innerW, h: innerH }, ctx, 'pictogram');
  }
}

module.exports = { drawPictogram, preRenderPictograms, pictogramKey };
