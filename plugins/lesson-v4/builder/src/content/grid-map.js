'use strict';

// Renders a GRID-MAP: a schematic river-town map drawn on a numbered four-figure
// grid, the kind a Year 4 child reads human/physical features and four-figure
// grid references off. Eastings run along the bottom, northings up the side, the
// numbers sitting ON the grid lines at the corners; a blue river winds through
// with a meander, features sit in their squares, and an optional ring marks the
// bottom-left corner of one square for the Teach slide that models reading a
// reference ("along the corridor, then up the stairs").
//
// The MAP GEOMETRY lives in the shared module ../../../shared/visuals/
// grid-map-svg.js, imported below, so the slide deck, worksheets, working wall
// and stick-in pack all draw an identical map from one source. This file keeps
// only the slide-specific work: pre-rendering each unique SVG to a PNG before the
// slide loop, then placing it by its true aspect (NO DEADSPACE) with an optional
// caption beneath.
//
// Spec: see shared/visuals/grid-map-svg.js for the map fields (eastings,
// northings, river, roads, features, highlightSquare), plus
//   label   optional caption below the map.

const requireGlobal = require('../require-global');
const { FONT, COLOURS, FIT } = require('../styles');

// Shared geometry — one source of truth for the map drawing.
const { tightSvg, cacheKey } = require('../../../shared/visuals/grid-map-svg');
const gridMapKey = cacheKey;

// ─── SLIDE-SPECIFIC CONSTANTS ─────────────────────────────────
const PAD        = 0.10;   // zone inner padding (inches)
const LABEL_H    = 0.46;
const LABEL_GAP  = 0.06;
const LABEL_FONT = 18;
const RENDER_PX  = 1400;   // longest side of the pre-rendered PNG (text stays crisp)
// ─── END CONSTANTS ────────────────────────────────────────────

async function preRenderGridMaps(lesson) {
  let sharp;
  try { sharp = requireGlobal('sharp'); } catch (e) { return {}; }

  const specs = {};
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    if (obj.type === 'grid-map') {
      const key = gridMapKey(obj);
      if (!specs[key]) specs[key] = obj;
    }
    for (const k of Object.keys(obj)) walk(obj[k]);
  }
  walk(lesson);

  const map = {};
  for (const [key, spec] of Object.entries(specs)) {
    const { svg, aspect } = tightSvg(spec);
    // Render so the LONGER side is RENDER_PX — keeps the numbers and labels crisp
    // whatever the map's proportions, without a fixed square squashing it.
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

function drawGridMap(pptx, slide, zone, data, ctx) {
  const key      = gridMapKey(data);
  const label    = data.label || '';
  const hasLabel = label.length > 0;

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const avail  = zone.h - 2 * PAD;

  const wantBand = hasLabel ? LABEL_H + LABEL_GAP : 0;
  const bandH    = Math.min(wantBand, Math.max(0, avail * 0.4));
  const innerH   = Math.max(0, avail - bandH);

  const entry = ctx.gridMapImages && ctx.gridMapImages[key];
  if (innerW > 0.05 && innerH > 0.05) {
    if (entry && entry.png) {
      // Place by the image's true aspect so it fills the slot with no deadspace —
      // width-bound or height-bound, whichever keeps it inside.
      const aspect = entry.aspect || 1;
      let w = innerW;
      let h = w / aspect;
      if (h > innerH) { h = innerH; w = h * aspect; }
      const diagX = innerX + (innerW - w) / 2;
      const diagY = innerY + (innerH - h) / 2;
      slide.addImage({
        data: 'image/png;base64,' + entry.png.toString('base64'),
        x: diagX, y: diagY, w: w, h: h
      });
    } else {
      const side = Math.min(innerW, innerH);
      require('./figure-fallback').drawFigureFallback(pptx, slide, { x: innerX + (innerW - side) / 2, y: innerY + (innerH - side) / 2, w: side, h: side }, ctx, 'grid map');
    }
  }

  if (hasLabel && bandH > 0.05) {
    slide.addText(String(label), {
      x: innerX, y: innerY + innerH + LABEL_GAP,
      w: innerW, h: Math.max(0.1, bandH - LABEL_GAP),
      fontFace: FONT, fontSize: LABEL_FONT, color: COLOURS.body,
      bold: true, align: 'center', valign: 'middle', margin: 0, fit: FIT
    });
  }
}

module.exports = { drawGridMap, preRenderGridMaps, gridMapKey };
