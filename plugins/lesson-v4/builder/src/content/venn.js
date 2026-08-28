'use strict';

// Renders a VENN diagram: a rectangular box ("the universe") containing two
// overlapping labelled circles, with shapes placed in four regions — the left
// circle only, the right circle only, the overlap where they cross, or outside
// both circles (but inside the box). The blank version (no `shapes`) is the
// labelled frame the teacher/children place into live; the placed version shows
// named shape tokens already sorted.
//
// The DIAGRAM GEOMETRY lives in the shared module
// ../../../shared/visuals/venn-svg.js, imported below, so any engine that draws
// a Venn draws the identical frame from one source. This file keeps only the
// slide-specific work: pre-rendering each unique SVG to a PNG before the slide
// loop, then placing it by its true aspect (NO DEADSPACE) with an optional
// `||` answer-reveal caption.
//
// Spec: see shared/visuals/venn-svg.js for the geometry fields, plus
//   label   optional caption below the diagram, supporting the "||" reveal.

const requireGlobal = require('../require-global');
const { FONT, COLOURS, FIT } = require('../styles');
const { splitAnswerRuns } = require('../answer-text');

// Shared geometry — one source of truth for the Venn drawing.
const { tightSvg, cacheKey } = require('../../../shared/visuals/venn-svg');
const buildSvg = tightSvg;     // (spec) → { svg, aspect }, cropped tight
const vennKey  = cacheKey;     // (spec) → stable pre-render cache key

// ─── SLIDE-SPECIFIC CONSTANTS ─────────────────────────────────
const PAD            = 0.10;   // zone inner padding (inches)
const LABEL_H        = 0.50;   // band height for a plain caption
const LABEL_H_ANSWER = 0.80;   // band height when the caption carries a "||" reveal
const LABEL_GAP      = 0.06;
const LABEL_FONT        = 18;
const LABEL_FONT_ANSWER = 18;
const RENDER_PX      = 1100;   // longest side of the pre-rendered PNG (wide figure → keep crisp)
// ─── END CONSTANTS ────────────────────────────────────────────

async function preRenderVenns(lesson) {
  let sharp;
  try { sharp = requireGlobal('sharp'); } catch (e) { return {}; }

  const specs = {};
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    if (obj.type === 'venn') {
      const key = vennKey(obj);
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

function vennLabelBandHeight(data) {
  const label = (data && data.label) || '';
  if (!label) return 0;
  return label.includes('||') ? LABEL_H_ANSWER : LABEL_H;
}

function drawVenn(pptx, slide, zone, data, ctx) {
  const key       = vennKey(data);
  const label     = data.label || '';
  const hasLabel  = label.length > 0;
  const hasAnswer = hasLabel && label.includes('||');
  const naturalLabelH = hasAnswer ? LABEL_H_ANSWER : LABEL_H;
  const labelH    = (hasLabel && typeof zone.vennLabelBandH === 'number')
    ? zone.vennLabelBandH : naturalLabelH;
  const labelFont = hasAnswer ? LABEL_FONT_ANSWER : LABEL_FONT;

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const avail  = zone.h - 2 * PAD;

  const wantBand = hasLabel ? labelH + LABEL_GAP : 0;
  const bandH    = Math.min(wantBand, Math.max(0, avail * 0.5));
  const innerH   = Math.max(0, avail - bandH);

  const entry = ctx.vennImages && ctx.vennImages[key];
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
      require('./figure-fallback').drawFigureFallback(pptx, slide, { x: innerX, y: innerY, w: innerW, h: innerH }, ctx, 'Venn diagram');
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

module.exports = { drawVenn, preRenderVenns, vennKey, vennLabelBandHeight };
