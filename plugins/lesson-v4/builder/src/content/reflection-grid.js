'use strict';

// Slide adapter for the shared reflection-grid SVG. The former native slide
// drawing duplicated the dots, mirror line and polygons; full-size slides and
// the compact Success Criteria treatment now use one geometry owner.

const requireGlobal = require('../require-global');
const { FONT, COLOURS, FIT } = require('../styles');
const { splitAnswerRuns } = require('../answer-text');
const { tightSvg, cacheKey } = require('../../../shared/visuals/reflection-grid-svg');

const PAD = 0.10;
const LABEL_H = 0.50;
const LABEL_H_ANSWER = 0.80;
const LABEL_GAP = 0.06;
const LABEL_FONT = 18;
const RENDER_PX = 800;

async function preRenderReflectionGrids(lesson) {
  let sharp;
  try { sharp = requireGlobal('sharp'); } catch (err) { return {}; }

  const specs = {};
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (node.type === 'reflection-grid') {
      const key = cacheKey(node);
      if (!specs[key]) specs[key] = node;
    }
    Object.keys(node).forEach(function (key) { walk(node[key]); });
  }
  walk(lesson);

  const images = {};
  for (const [key, spec] of Object.entries(specs)) {
    const built = tightSvg(spec);
    const resize = built.aspect >= 1 ? { width: RENDER_PX } : { height: RENDER_PX };
    try {
      const png = await sharp(Buffer.from(built.svg), { density: 144 }).resize(resize).png().toBuffer();
      images[key] = { png, aspect: built.aspect };
    } catch (err) {
      // The ordinary figure fallback is drawn at placement time.
    }
  }
  return images;
}

function drawReflectionGrid(pptx, slide, zone, data, ctx) {
  const label = data.label || '';
  const hasAnswer = label.includes('||');
  const labelH = label ? (hasAnswer ? LABEL_H_ANSWER : LABEL_H) : 0;
  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const availH = zone.h - 2 * PAD;
  const bandH = Math.min(labelH ? labelH + LABEL_GAP : 0, Math.max(0, availH * 0.5));
  const innerH = Math.max(0, availH - bandH);
  const entry = ctx.reflectionGridImages && ctx.reflectionGridImages[cacheKey(data)];

  if (entry && entry.png && innerW > 0.05 && innerH > 0.05) {
    let w = innerW;
    let h = w / entry.aspect;
    if (h > innerH) { h = innerH; w = h * entry.aspect; }
    slide.addImage({
      data: 'image/png;base64,' + entry.png.toString('base64'),
      x: innerX + (innerW - w) / 2,
      y: innerY + (innerH - h) / 2,
      w,
      h
    });
  } else if (innerW > 0.05 && innerH > 0.05) {
    const side = Math.min(innerW, innerH);
    require('./figure-fallback').drawFigureFallback(pptx, slide, {
      x: innerX + (innerW - side) / 2,
      y: innerY + (innerH - side) / 2,
      w: side,
      h: side
    }, ctx, 'reflection grid');
  }

  if (label && bandH > 0.05) {
    slide.addText(splitAnswerRuns(label, hasAnswer), {
      x: innerX,
      y: innerY + innerH + LABEL_GAP,
      w: innerW,
      h: Math.max(0.1, bandH - LABEL_GAP),
      fontFace: FONT,
      fontSize: LABEL_FONT,
      color: COLOURS.body,
      bold: hasAnswer,
      align: 'center',
      valign: 'middle',
      margin: 0,
      fit: FIT
    });
  }
}

module.exports = { drawReflectionGrid, preRenderReflectionGrids, reflectionGridKey: cacheKey };
