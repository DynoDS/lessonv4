'use strict';

// Renders the RAINFOREST-LAYERS cross section: four stacked bands, top to bottom,
// emergent / canopy / understorey / forest floor, with the band tint carrying the
// light gradient (brightest at the top, near dark at the floor). Options add the
// layer names, the heights, the sun with light arrows thinning band by band, and a
// highlight pair that dims the other two layers; `blank` gives the write-on form
// with empty label lines.
//
// The DIAGRAM GEOMETRY lives in the shared module ../../../shared/visuals/
// rainforest-layers-svg.js, imported below, so the slide deck, worksheets, working
// wall and stick-in pack all draw an identical diagram from one source. This file
// keeps only the slide-specific work: pre-rendering each unique SVG to a PNG once
// before the slide loop, then placing it by its true aspect (NO DEADSPACE) with an
// optional caption beneath.
//
// Spec: see shared/visuals/rainforest-layers-svg.js for the diagram fields
// (labels, heights, light, highlight, blank), plus
//   label   optional caption below the diagram, supporting the "||" reveal.

const requireGlobal = require('../require-global');
const { FONT, COLOURS, FIT } = require('../styles');
const { splitAnswerRuns } = require('../answer-text');

const { tightSvg, cacheKey } = require('../../../shared/visuals/rainforest-layers-svg');
const rainforestLayersKey = cacheKey;

// ─── SLIDE-SPECIFIC CONSTANTS ─────────────────────────────────
const PAD            = 0.10;   // zone inner padding (inches)
const LABEL_H        = 0.52;   // caption band for a plain caption
const LABEL_H_ANSWER = 0.86;   // caption band when the caption carries a "||" reveal
const LABEL_GAP      = 0.06;
const LABEL_FONT        = 20;
const LABEL_FONT_ANSWER = 22;  // bold green answer reveal, kept large to read from the back
// The diagram carries small print (layer names, heights, "about 2 rays in every
// 100"), so it rasterises larger than a plain figure: at 1600 the height text is
// still crisp when the picture fills a whole teaching zone.
const RENDER_PX      = 1600;
// ─── END CONSTANTS ────────────────────────────────────────────

async function preRenderRainforestLayers(lesson) {
  let sharp;
  try { sharp = requireGlobal('sharp'); } catch (e) { return {}; }

  const specs = {};
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    if (obj.type === 'rainforest-layers') {
      const key = rainforestLayersKey(obj);
      if (!specs[key]) specs[key] = obj;
    }
    for (const k of Object.keys(obj)) walk(obj[k]);
  }
  walk(lesson);

  const map = {};
  for (const [key, spec] of Object.entries(specs)) {
    const { svg, aspect } = tightSvg(spec);
    // Render so the LONGER side is RENDER_PX — crisp whatever the proportions,
    // without a fixed square shrinking the tall unlabelled form.
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

// The vertical band this diagram reserves under itself for its caption. The row
// equaliser uses it to give every sibling in a row the same band, so several
// copies (e.g. the same forest with different layers highlighted) draw at one size.
function rainforestLayersLabelBandHeight(data) {
  const label = (data && data.label) || '';
  if (!label) return 0;
  return label.includes('||') ? LABEL_H_ANSWER : LABEL_H;
}

function drawRainforestLayers(pptx, slide, zone, data, ctx) {
  const key       = rainforestLayersKey(data);
  const label     = data.label || '';
  const hasLabel  = label.length > 0;
  const hasAnswer = hasLabel && label.includes('||');
  const naturalLabelH = hasAnswer ? LABEL_H_ANSWER : LABEL_H;
  const labelH    = (hasLabel && typeof zone.rainforestLayersLabelBandH === 'number')
    ? zone.rainforestLayersLabelBandH : naturalLabelH;
  const labelFont = hasAnswer ? LABEL_FONT_ANSWER : LABEL_FONT;

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const avail  = zone.h - 2 * PAD;

  const wantBand = hasLabel ? labelH + LABEL_GAP : 0;
  const bandH    = Math.min(wantBand, Math.max(0, avail * 0.4));
  const innerH   = Math.max(0, avail - bandH);

  const entry = ctx.rainforestLayersImages && ctx.rainforestLayersImages[key];
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
      require('./figure-fallback').drawFigureFallback(pptx, slide, { x: innerX + (innerW - side) / 2, y: innerY + (innerH - side) / 2, w: side, h: side }, ctx, 'rainforest layers');
    }
  }

  if (hasLabel && bandH > 0.05) {
    slide.addText(splitAnswerRuns(label, hasAnswer), {
      x: innerX, y: innerY + innerH + LABEL_GAP,
      w: innerW, h: Math.max(0.1, bandH - LABEL_GAP),
      fontFace: FONT, fontSize: labelFont, color: COLOURS.body,
      bold: true, align: 'center', valign: 'middle', margin: 0, fit: FIT
    });
  }
}

module.exports = {
  drawRainforestLayers, preRenderRainforestLayers,
  rainforestLayersLabelBandHeight, rainforestLayersKey
};
