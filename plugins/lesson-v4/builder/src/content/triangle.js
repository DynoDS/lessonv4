'use strict';

// Renders a TRIANGLE the child classifies by its sides — scalene, isosceles,
// equilateral or right-angled — as a filled blue polygon with tick marks (dashes)
// on the sides: sides with the same number of dashes are equal. Optionally a small
// right-angle square at the right-angle corner, small arcs at the corners when the
// lesson marks "the three angles", a rotation so a set isn't all one way up, and a
// caption below. Its companion `triangle-nonexample` draws a "not a triangle" shape
// (an open three-line shape, a curved-side shape, or a four-sided shape) for the
// concept-attainment sort.
//
// The DIAGRAM GEOMETRY lives in the shared module ../../../shared/visuals/triangle-svg.js,
// imported below, so the slides, worksheets and working wall all draw an identical
// triangle from one source. This file keeps only the slide-specific work: pre-
// rendering each unique SVG to a PNG before the slide loop, then placing it by its
// true aspect (NO DEADSPACE) with an optional `||` answer-reveal caption.
//
// Spec: see shared/visuals/triangle-svg.js for the geometry fields (kind, sides,
//   ticks, rightAngle, angleArcs, rotation), plus:
//   label   optional caption below the picture, supporting the "||" reveal.
// For a non-example: { type: "triangle-nonexample", shape: "open"|"curved"|"quad" }.

const requireGlobal = require('../require-global');
const { FONT, COLOURS, FIT } = require('../styles');
const { splitAnswerRuns } = require('../answer-text');

const {
  tightSvg, cacheKey, nonExampleSvg, nonExampleKey
} = require('../../../shared/visuals/triangle-svg');

// ─── SLIDE-SPECIFIC CONSTANTS ─────────────────────────────────
const PAD            = 0.10;   // zone inner padding (inches)
const LABEL_H        = 0.86;   // band when label is a name/identifier ("Scalene", "(a)")
const LABEL_H_ANSWER = 1.16;   // band when label carries an answer reveal (contains "||")
const LABEL_GAP      = 0.06;
const LABEL_FONT        = 28;  // readable from the back of the room on a teach row
const LABEL_FONT_ANSWER = 26;  // bold green answer reveal — kept large for the same reason
const RENDER_PX      = 600;    // longest side of the pre-rendered PNG
// ─── END CONSTANTS ────────────────────────────────────────────

// Pre-render every unique triangle (and triangle-nonexample) SVG to a PNG once,
// before the slide loop — identical figures are built only once and the draw step
// stays synchronous. Follows preRenderAngles exactly.
async function preRenderTriangles(lesson) {
  let sharp;
  try { sharp = requireGlobal('sharp'); } catch (e) { return {}; }

  const specs = {};   // key → { spec, nonExample }
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    if (obj.type === 'triangle') {
      const key = cacheKey(obj);
      if (!specs[key]) specs[key] = { spec: obj, nonExample: false };
    } else if (obj.type === 'triangle-nonexample') {
      const key = nonExampleKey(obj);
      if (!specs[key]) specs[key] = { spec: obj, nonExample: true };
    }
    for (const k of Object.keys(obj)) walk(obj[k]);
  }
  walk(lesson);

  const map = {};
  for (const [key, entry] of Object.entries(specs)) {
    const built = entry.nonExample ? nonExampleSvg(entry.spec) : tightSvg(entry.spec);
    // Render so the LONGER side is RENDER_PX — crisp whatever the proportions,
    // without a fixed square forcing a tall isosceles to render small.
    const resize = built.aspect >= 1 ? { width: RENDER_PX } : { height: RENDER_PX };
    try {
      const png = await sharp(Buffer.from(built.svg), { density: 144 }).resize(resize).png().toBuffer();
      map[key] = { png, aspect: built.aspect };
    } catch (e) {
      // skip — placeholder shown at draw time
    }
  }
  return map;
}

// The vertical band a triangle reserves under its picture for its label, by label
// kind. A row equaliser uses this to give every triangle in a row the same band
// (the largest any sibling needs) so they all draw at one size.
function triangleLabelBandHeight(data) {
  const label = (data && data.label) || '';
  if (!label) return 0;
  return label.includes('||') ? LABEL_H_ANSWER : LABEL_H;
}

// Shared placing logic for both the example and non-example types.
function drawTriangleEntry(pptx, slide, zone, data, ctx, key) {
  const label     = data.label || '';
  const hasLabel  = label.length > 0;
  const hasAnswer = hasLabel && label.includes('||');
  const naturalLabelH = hasAnswer ? LABEL_H_ANSWER : LABEL_H;
  const labelH    = (hasLabel && typeof zone.triangleLabelBandH === 'number')
    ? zone.triangleLabelBandH : naturalLabelH;
  const labelFont = hasAnswer ? LABEL_FONT_ANSWER : LABEL_FONT;

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const avail  = zone.h - 2 * PAD;

  const wantBand = hasLabel ? labelH + LABEL_GAP : 0;
  const bandH    = Math.min(wantBand, Math.max(0, avail * 0.6));
  const innerH   = Math.max(0, avail - bandH);

  const entry = ctx.triangleImages && ctx.triangleImages[key];
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
      require('./figure-fallback').drawFigureFallback(pptx, slide, { x: innerX + (innerW - side) / 2, y: innerY + (innerH - side) / 2, w: side, h: side }, ctx, 'triangle');
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

function drawTriangle(pptx, slide, zone, data, ctx) {
  drawTriangleEntry(pptx, slide, zone, data, ctx, cacheKey(data));
}

function drawTriangleNonExample(pptx, slide, zone, data, ctx) {
  drawTriangleEntry(pptx, slide, zone, data, ctx, nonExampleKey(data));
}

module.exports = {
  drawTriangle, drawTriangleNonExample, preRenderTriangles, triangleLabelBandHeight
};
