'use strict';

// Renders a WHOLE shape and its TRANSLATED IMAGE on ONE numbered coordinate grid
// — the signature picture of a translation lesson. The original is drawn solid
// house-blue; with `showImage: true` the image (the same shape slid by the
// translation) is added in a lighter dashed blue with a dashed arrow between a
// vertex and its match, so the slide (and that every corner moves the same way)
// is visible. This is the picture the engine could not draw before: two full
// polygons — not the single start/end markers of `translation-grid`, and not the
// single shape of `coordinate-grid`.
//
// Two modes: `showImage: false` draws the ORIGINAL only on the numbered grid (the
// task the child works on, and the stick-in — the grid stays clear for the child
// to plot and join the image themselves); `showImage: true` draws original +
// image + arrow (the worked example / answer / working-wall card).
//
// The DIAGRAM GEOMETRY lives in the shared module
// ../../../shared/visuals/translation-shape-svg.js, the same source the
// worksheets, working wall and stick-in pack draw from — so a slide translation
// is identical to the one on paper, the wall and the glued piece. This file keeps
// only the slide-specific work: pre-rendering each unique SVG to a PNG before the
// slide loop, then placing it by its true aspect (NO DEADSPACE) with an optional
// `||` answer-reveal caption.
//
// Spec: see shared/visuals/translation-shape-svg.js for the geometry fields
//   (cols, rows, points, translate, showImage, arrowFrom), plus
//   label   optional caption below the picture, supporting the "||" reveal.

const requireGlobal = require('../require-global');
const { FONT, COLOURS, FIT } = require('../styles');
const { splitAnswerRuns } = require('../answer-text');

// Shared geometry — one source of truth for the drawing.
const { tightSvg, cacheKey } = require('../../../shared/visuals/translation-shape-svg');
const buildSvg = tightSvg;               // (spec) → { svg, aspect }, cropped tight
const translationShapeKey = cacheKey;    // (spec) → stable pre-render cache key

// ─── SLIDE-SPECIFIC CONSTANTS ─────────────────────────────────
const PAD            = 0.10;   // zone inner padding (inches)
const LABEL_H        = 0.60;
const LABEL_H_ANSWER = 0.92;
const LABEL_GAP      = 0.06;
const LABEL_FONT        = 20;
const LABEL_FONT_ANSWER = 20;
const RENDER_PX      = 900;    // longest side of the pre-rendered PNG (grids carry small axis numbers)
// ─── END CONSTANTS ────────────────────────────────────────────

async function preRenderTranslationShapes(lesson) {
  let sharp;
  try { sharp = requireGlobal('sharp'); } catch (e) { return {}; }

  const specs = {};
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    if (obj.type === 'translation-shape') {
      const key = translationShapeKey(obj);
      if (!specs[key]) specs[key] = obj;
    }
    for (const k of Object.keys(obj)) walk(obj[k]);
  }
  walk(lesson);

  const map = {};
  for (const [key, spec] of Object.entries(specs)) {
    const { svg, aspect } = buildSvg(spec);
    // Render so the LONGER side is RENDER_PX — keeps the grid crisp whatever its
    // proportions, without a fixed square forcing a wide grid to render small.
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

function translationShapeLabelBandHeight(data) {
  const label = (data && data.label) || '';
  if (!label) return 0;
  return label.includes('||') ? LABEL_H_ANSWER : LABEL_H;
}

function drawTranslationShape(pptx, slide, zone, data, ctx) {
  const key       = translationShapeKey(data);
  const label     = data.label || '';
  const hasLabel  = label.length > 0;
  const hasAnswer = hasLabel && label.includes('||');
  const naturalLabelH = hasAnswer ? LABEL_H_ANSWER : LABEL_H;
  const labelH    = (hasLabel && typeof zone.translationShapeLabelBandH === 'number')
    ? zone.translationShapeLabelBandH : naturalLabelH;
  const labelFont = hasAnswer ? LABEL_FONT_ANSWER : LABEL_FONT;

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const avail  = zone.h - 2 * PAD;

  const wantBand = hasLabel ? labelH + LABEL_GAP : 0;
  const bandH    = Math.min(wantBand, Math.max(0, avail * 0.5));
  const innerH   = Math.max(0, avail - bandH);

  const entry = ctx.translationShapeImages && ctx.translationShapeImages[key];
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
      require('./figure-fallback').drawFigureFallback(pptx, slide, { x: innerX + (innerW - side) / 2, y: innerY + (innerH - side) / 2, w: side, h: side }, ctx, 'translation grid');
    }
  }

  if (hasLabel && bandH > 0.05) {
    const labelRuns = splitAnswerRuns(label, hasAnswer);
    slide.addText(labelRuns, {
      x: innerX, y: innerY + innerH + LABEL_GAP,
      w: innerW, h: Math.max(0.1, bandH - LABEL_GAP),
      fontFace: FONT, fontSize: labelFont, color: COLOURS.body,
      bold: hasAnswer,
      align: 'center', valign: 'middle', margin: 0, fit: FIT
    });
  }
}

module.exports = { drawTranslationShape, preRenderTranslationShapes, translationShapeKey, translationShapeLabelBandHeight };
