'use strict';

// Slide adapter for the shared numbered coordinate-grid SVG. Full-size slide
// grids and the number-free Success Criteria treatment now come from the same
// geometry module, including the across-then-up route; only rasterisation and
// placement remain slide-specific here.

const requireGlobal = require('../require-global');
const { tightSvg, cacheKey } = require('../../../shared/visuals/coordinate-grid-svg');

const PAD = 0.10;
const RENDER_PX = 700;

async function preRenderCoordinateGrids(lesson) {
  let sharp;
  try { sharp = requireGlobal('sharp'); } catch (err) { return {}; }

  const specs = {};
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (node.type === 'coordinate-grid') {
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

function drawCoordinateGrid(pptx, slide, zone, data, ctx) {
  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const innerH = zone.h - 2 * PAD;
  const entry = ctx.coordinateGridImages && ctx.coordinateGridImages[cacheKey(data)];

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
    return;
  }

  const side = Math.min(innerW, innerH);
  require('./figure-fallback').drawFigureFallback(pptx, slide, {
    x: innerX + (innerW - side) / 2,
    y: innerY + (innerH - side) / 2,
    w: side,
    h: side
  }, ctx, 'coordinate grid');
}

module.exports = { drawCoordinateGrid, preRenderCoordinateGrids, coordinateGridKey: cacheKey };
