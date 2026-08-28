'use strict';

// Renders a DRAW-YOUR-OWN working surface: a single faint number-line baseline,
// or one (or two stacked) empty bar outlines, for the CHILD to construct the
// representation on. The teacher models drawing the jumps / partitions live on
// the board, then the child draws their own on the worksheet — the deciding of
// WHERE the jump goes or HOW to partition is the skill, so the surface stays
// bare. The companion to `numberline` and `bar-model` (which draw a finished
// picture with blanks): this one draws almost nothing on purpose.
//
// The DIAGRAM GEOMETRY lives in the shared module
// ../../../shared/visuals/blank-surface-svg.js, imported below, so the slide
// deck and the worksheets draw an identical surface from one source. This file
// keeps only the slide-specific work: pre-rendering each unique SVG to a PNG
// before the slide loop, then placing it by its true aspect (NO DEADSPACE).
//
// Spec: see shared/visuals/blank-surface-svg.js (surface, start, end, bars).

const requireGlobal = require('../require-global');

// Shared geometry — one source of truth for the blank-surface drawing.
const { tightSvg, cacheKey } = require('../../../shared/visuals/blank-surface-svg');
const buildSvg = tightSvg;          // (spec) → { svg, aspect }, cropped tight
const blankSurfaceKey = cacheKey;   // (spec) → stable pre-render cache key

// ─── SLIDE-SPECIFIC CONSTANTS ─────────────────────────────────
const PAD       = 0.10;   // zone inner padding (inches)
const RENDER_PX = 1000;   // longest side of the pre-rendered PNG
// ─── END CONSTANTS ────────────────────────────────────────────

async function preRenderBlankSurfaces(lesson) {
  let sharp;
  try { sharp = requireGlobal('sharp'); } catch (e) { return {}; }

  const specs = {};
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    if (obj.type === 'blank-surface') {
      const key = blankSurfaceKey(obj);
      if (!specs[key]) specs[key] = obj;
    }
    for (const k of Object.keys(obj)) walk(obj[k]);
  }
  walk(lesson);

  const map = {};
  for (const [key, spec] of Object.entries(specs)) {
    const { svg, aspect } = buildSvg(spec);
    // Render so the LONGER side is RENDER_PX — keeps the surface crisp whatever
    // its proportions, without a fixed square forcing a wide surface to render small.
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

function drawBlankSurface(pptx, slide, zone, data, ctx) {
  const key = blankSurfaceKey(data);

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const innerH = zone.h - 2 * PAD;

  if (innerW <= 0.05 || innerH <= 0.05) return;

  const entry = ctx.blankSurfaceImages && ctx.blankSurfaceImages[key];
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
    require('./figure-fallback').drawFigureFallback(pptx, slide, { x: innerX, y: innerY, w: innerW, h: innerH }, ctx, 'drawing surface');
  }
}

module.exports = { drawBlankSurface, preRenderBlankSurfaces, blankSurfaceKey };
