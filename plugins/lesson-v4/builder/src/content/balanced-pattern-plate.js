'use strict';

// Slide adapter for the shared proportional food-group plate. The SVG owns all
// content and geometry; this file pre-renders once and places by true aspect.

const requireGlobal = require('../require-global');
const { tightSvg, cacheKey } = require('../../../shared/visuals/balanced-pattern-plate-svg');

const PAD = 0.08;       // inches
const RENDER_PX = 1800; // long side, for crisp small food labels

async function preRenderBalancedPatternPlates(lesson) {
  let sharp;
  try { sharp = requireGlobal('sharp'); } catch (_) { return {}; }
  const specs = {};
  function walk(value) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach(walk); return; }
    if (value.type === 'balanced-pattern-plate') specs[cacheKey(value)] = value;
    Object.keys(value).forEach(key => walk(value[key]));
  }
  walk(lesson);
  const map = {};
  for (const [key, spec] of Object.entries(specs)) {
    const built = tightSvg(spec);
    try {
      const png = await sharp(Buffer.from(built.svg), { density: 144 })
        .resize({ width: RENDER_PX }).png().toBuffer();
      map[key] = { png, aspect: built.aspect };
    } catch (_) {
      // The ordinary figure fallback is drawn at placement time.
    }
  }
  return map;
}

function drawBalancedPatternPlate(pptx, slide, zone, data, ctx) {
  const inner = {
    x: zone.x + PAD, y: zone.y + PAD,
    w: zone.w - PAD * 2, h: zone.h - PAD * 2
  };
  const entry = ctx.balancedPatternPlateImages && ctx.balancedPatternPlateImages[cacheKey(data)];
  if (!entry || !entry.png) {
    require('./figure-fallback').drawFigureFallback(pptx, slide, inner, ctx, 'balanced food pattern plate');
    return;
  }
  let w = inner.w;
  let h = w / entry.aspect;
  if (h > inner.h) { h = inner.h; w = h * entry.aspect; }
  slide.addImage({
    data: 'image/png;base64,' + entry.png.toString('base64'),
    x: inner.x + (inner.w - w) / 2,
    y: inner.y + (inner.h - h) / 2,
    w, h
  });
}

module.exports = { drawBalancedPatternPlate, preRenderBalancedPatternPlates, balancedPatternPlateKey: cacheKey };
