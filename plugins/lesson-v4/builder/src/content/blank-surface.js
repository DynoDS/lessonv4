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
const RENDER_PX = 2000;   // longest side of the pre-rendered PNG

// The start number on a board number line is never under 20pt, and the line is
// drawn thick enough to see from the back (the teacher, 3 October 2026, of a
// Your Turn slide whose line was faint and whose start number was too small to
// read: "maybe thicker line and bigger number. 20 font size is min").
//
// The drawing scales with the zone it lands in, and the zone is only known
// while the slide is being drawn, after the pictures are made. So a number line
// that carries an end label is made at each of these label sizes (in the
// drawing's own units), and the slide takes the smallest that prints at 20pt or
// more at the width it really has: about 20 to 27pt on any slide, never a
// number that grows with the column. The line's thickness follows the label,
// so it comes out near 4pt everywhere.
const BOARD_MIN_PT     = 20;
const LABEL_UNITS      = [26, 34, 46, 60, 80, 110, 150];
const STROKE_PER_LABEL = 0.18;
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

  const render = async (svg, aspect) => {
    // Render so the LONGER side is RENDER_PX — keeps the surface crisp whatever
    // its proportions, without a fixed square forcing a wide surface to render small.
    const resize = aspect >= 1 ? { width: RENDER_PX } : { height: RENDER_PX };
    return sharp(Buffer.from(svg), { density: 144 }).resize(resize).png().toBuffer();
  };

  const map = {};
  for (const [key, spec] of Object.entries(specs)) {
    try {
      const plain = buildSvg(spec);
      map[key] = { png: await render(plain.svg, plain.aspect), aspect: plain.aspect };
      if (!labelledNumberLine(spec)) continue;
      map[key].sizes = [];
      for (const units of LABEL_UNITS) {
        const built = buildSvg(spec, undefined, { endFontSize: units, stroke: units * STROKE_PER_LABEL });
        map[key].sizes.push({ units, widthUnits: built.w, aspect: built.aspect, png: await render(built.svg, built.aspect) });
      }
    } catch (e) {
      // skip — placeholder shown at draw time
    }
  }
  return map;
}

function labelledNumberLine(spec) {
  if (!spec || spec.surface === 'bar') return false;
  const shown = (value) => value != null && String(value) !== '';
  return shown(spec.start) || shown(spec.end);
}

// The box a drawing of this shape takes in the zone: as wide as the zone, or as
// tall, whichever keeps it inside.
function placedSize(aspect, innerW, innerH) {
  let w = innerW;
  let h = w / aspect;
  if (h > innerH) { h = innerH; w = h * aspect; }
  return { w, h };
}

// The smallest label size that prints at the board's floor in this zone, or the
// largest there is when even that falls short (a zone only a few inches wide).
function sizeForZone(entry, innerW, innerH) {
  if (!entry.sizes || !entry.sizes.length) return entry;
  for (const size of entry.sizes) {
    const { w } = placedSize(size.aspect, innerW, innerH);
    if (size.units * (w * 72 / size.widthUnits) >= BOARD_MIN_PT) return size;
  }
  return entry.sizes[entry.sizes.length - 1];
}

function drawBlankSurface(pptx, slide, zone, data, ctx) {
  const key = blankSurfaceKey(data);

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const innerH = zone.h - 2 * PAD;

  if (innerW <= 0.05 || innerH <= 0.05) return;

  const stored = ctx.blankSurfaceImages && ctx.blankSurfaceImages[key];
  const entry = stored && stored.png ? sizeForZone(stored, innerW, innerH) : stored;
  if (entry && entry.png) {
    // Place by the image's true aspect ratio so it fills the slot with no
    // deadspace — width-bound or height-bound, whichever keeps it inside.
    const { w, h } = placedSize(entry.aspect || 1, innerW, innerH);
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

module.exports = { drawBlankSurface, preRenderBlankSurfaces, blankSurfaceKey, sizeForZone, placedSize, BOARD_MIN_PT };
