'use strict';

// Renders a PAIR of straight lines for children to judge as PARALLEL,
// PERPENDICULAR or NEITHER — the core picture of a Year 4 "identify parallel
// and perpendicular lines" lesson. Each object draws exactly two black line
// segments arranged to show one relationship, optionally marked with the
// British schoolbook notation a child draws live: chevron (›) arrows on a
// parallel pair, or a blue right-angle square at a perpendicular corner.
//
// This is the classify-the-lines companion to `angle` (classify the opening)
// and `turn-diagram` (read the turn). The DIAGRAM GEOMETRY now lives in the
// shared module ../../../shared/visuals/line-pair-svg.js, imported below, so the
// slide deck, worksheets and the working wall all draw an identical line-pair
// from one source — write the geometry once, every engine gets it. This file
// keeps only the slide-specific work: pre-rendering each unique SVG to a PNG
// before the slide loop, and placing it (by its true aspect, NO DEADSPACE) plus
// its optional `||` answer-reveal caption.
//
// Spec: see shared/visuals/line-pair-svg.js for the full field list, plus
//   label   optional caption below the picture, supporting the "||" answer
//           reveal exactly like `angle` / clock / turn helpers.

const requireGlobal = require('../require-global');
const { FONT, COLOURS, FIT } = require('../styles');
const { splitAnswerRuns } = require('../answer-text');

// Shared geometry — one source of truth for the line-pair drawing.
const { tightSvg, cacheKey } = require('../../../shared/visuals/line-pair-svg');
const buildSvg    = tightSvg;    // (spec) → { svg, aspect }, cropped tight
const linePairKey = cacheKey;    // (spec) → stable pre-render cache key

// ─── SLIDE-SPECIFIC CONSTANTS ─────────────────────────────────
const PAD            = 0.10;   // zone inner padding (inches)
const LABEL_H        = 0.86;
const LABEL_H_ANSWER = 1.16;
const LABEL_GAP      = 0.06;
const LABEL_FONT        = 28;
const LABEL_FONT_ANSWER = 26;
const RENDER_PX      = 600;    // longest side of the pre-rendered PNG
// ─── END CONSTANTS ────────────────────────────────────────────

async function preRenderLinePairs(lesson) {
  let sharp;
  try { sharp = requireGlobal('sharp'); } catch (e) { return {}; }

  const specs = {};
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    if (obj.type === 'line-pair') {
      const key = linePairKey(obj);
      if (!specs[key]) specs[key] = obj;
    }
    for (const k of Object.keys(obj)) walk(obj[k]);
  }
  walk(lesson);

  const map = {};
  for (const [key, spec] of Object.entries(specs)) {
    const { svg, aspect } = buildSvg(spec);
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

function linePairLabelBandHeight(data) {
  const label = (data && data.label) || '';
  if (!label) return 0;
  return label.includes('||') ? LABEL_H_ANSWER : LABEL_H;
}

function drawLinePair(pptx, slide, zone, data, ctx) {
  const key       = linePairKey(data);
  const label     = data.label || '';
  const hasLabel  = label.length > 0;
  const hasAnswer = hasLabel && label.includes('||');
  const naturalLabelH = hasAnswer ? LABEL_H_ANSWER : LABEL_H;
  const labelH    = (hasLabel && typeof zone.linePairLabelBandH === 'number')
    ? zone.linePairLabelBandH : naturalLabelH;
  const labelFont = hasAnswer ? LABEL_FONT_ANSWER : LABEL_FONT;

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const avail  = zone.h - 2 * PAD;

  const wantBand = hasLabel ? labelH + LABEL_GAP : 0;
  const bandH    = Math.min(wantBand, Math.max(0, avail * 0.6));
  const innerH   = Math.max(0, avail - bandH);

  const entry = ctx.linePairImages && ctx.linePairImages[key];
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
      require('./figure-fallback').drawFigureFallback(pptx, slide, { x: innerX + (innerW - side) / 2, y: innerY + (innerH - side) / 2, w: side, h: side }, ctx, 'line diagram');
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

module.exports = { drawLinePair, preRenderLinePairs, linePairKey, linePairLabelBandHeight };
