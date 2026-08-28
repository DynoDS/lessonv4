'use strict';

// Renders a GEOBOARD / dotty-paper grid: evenly spaced muted pegs with zero, one,
// or many straight-line shapes drawn on them. A general-purpose maths workspace —
// blank dotty paper to draw on, a single quadrilateral to name, a square rotated
// 45° sitting on diagonal pegs ("it's not a diamond"), several shapes side by side
// to sort, or an open line path. Not limited to four sides: triangles, pentagons
// and irregular polygons all work.
//
// The GRID + SHAPE GEOMETRY lives in the shared module
// ../../../shared/visuals/geoboard-svg.js, imported below, so the slide deck and
// worksheets draw an identical board from one source. This file keeps only the
// slide-specific work: pre-rendering each unique SVG to a PNG before the slide
// loop, then placing it by its true aspect (NO DEADSPACE) with an optional caption.
//
// Spec: see shared/visuals/geoboard-svg.js for the geometry fields, plus
//   label   optional caption below the grid (supports the "||" answer reveal).

const requireGlobal = require('../require-global');
const { FONT, COLOURS, FIT } = require('../styles');
const { splitAnswerRuns } = require('../answer-text');

// Shared geometry — one source of truth for the geoboard drawing.
const { tightSvg, cacheKey } = require('../../../shared/visuals/geoboard-svg');
const buildSvg = tightSvg;        // (spec) → { svg, aspect }, cropped tight
const geoboardKey = cacheKey;     // (spec) → stable pre-render cache key

// ─── SLIDE-SPECIFIC CONSTANTS ─────────────────────────────────
const PAD            = 0.10;   // zone inner padding (inches)
const LABEL_H        = 0.50;   // band height for a plain caption
const LABEL_H_ANSWER = 0.80;   // band height when the caption carries a "||" reveal
const LABEL_GAP      = 0.06;
const LABEL_FONT        = 18;
const LABEL_FONT_ANSWER = 18;
const RENDER_PX      = 700;    // longest side of the pre-rendered PNG
// ─── END CONSTANTS ────────────────────────────────────────────

async function preRenderGeoboards(lesson) {
  let sharp;
  try { sharp = requireGlobal('sharp'); } catch (e) { return {}; }

  const specs = {};
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    if (obj.type === 'geoboard') {
      const key = geoboardKey(obj);
      if (!specs[key]) specs[key] = obj;
    }
    for (const k of Object.keys(obj)) walk(obj[k]);
  }
  walk(lesson);

  const map = {};
  for (const [key, spec] of Object.entries(specs)) {
    const { svg, aspect } = buildSvg(spec);
    // Render so the LONGER side is RENDER_PX — keeps every board crisp whatever its
    // proportions, without a fixed square forcing a wide/short board to render small.
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

function geoboardLabelBandHeight(data) {
  const label = (data && data.label) || '';
  if (!label) return 0;
  return label.includes('||') ? LABEL_H_ANSWER : LABEL_H;
}

function drawGeoboard(pptx, slide, zone, data, ctx) {
  const key       = geoboardKey(data);
  const label     = data.label || '';
  const hasLabel  = label.length > 0;
  const hasAnswer = hasLabel && label.includes('||');
  const naturalLabelH = hasAnswer ? LABEL_H_ANSWER : LABEL_H;
  const labelH    = (hasLabel && typeof zone.geoboardLabelBandH === 'number')
    ? zone.geoboardLabelBandH : naturalLabelH;
  const labelFont = hasAnswer ? LABEL_FONT_ANSWER : LABEL_FONT;

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const avail  = zone.h - 2 * PAD;

  const wantBand = hasLabel ? labelH + LABEL_GAP : 0;
  const bandH    = Math.min(wantBand, Math.max(0, avail * 0.5));
  const innerH   = Math.max(0, avail - bandH);

  const entry = ctx.geoboardImages && ctx.geoboardImages[key];
  if (innerW > 0.05 && innerH > 0.05) {
    if (entry && entry.png) {
      // Place by the image's true aspect ratio so it fills the slot with no
      // deadspace — width-bound or height-bound, whichever keeps it inside.
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
      require('./figure-fallback').drawFigureFallback(pptx, slide, { x: innerX + (innerW - side) / 2, y: innerY + (innerH - side) / 2, w: side, h: side }, ctx, 'geoboard');
    }
  }

  if (hasLabel && bandH > 0.05) {
    const labelRuns = splitAnswerRuns(label, hasAnswer);
    slide.addText(labelRuns, {
      x: innerX, y: innerY + innerH + LABEL_GAP,
      w: innerW, h: Math.max(0.1, bandH - LABEL_GAP),
      fontFace: FONT, fontSize: labelFont, color: COLOURS.body,
      bold: true,
      align: 'center', valign: 'middle', margin: 0, fit: FIT
    });
  }
}

module.exports = { drawGeoboard, preRenderGeoboards, geoboardKey, geoboardLabelBandHeight };
