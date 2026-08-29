'use strict';

const requireGlobal = require('../require-global');
const { FONT, COLOURS, FIT } = require('../styles');
const shared = require('../../../shared/visuals/world-geography-map-svg');

const PAD = 0.10;          // zone padding (inches)
const LABEL_H = 0.42;      // optional caption band (inches)
const LABEL_GAP = 0.06;    // map-to-caption gap (inches)
const LABEL_FONT = 18;     // caption ceiling (points)
const RENDER_PX = 1800;    // longest raster side (pixels)

const worldGeographyMapKey = shared.cacheKey;

async function preRenderWorldGeographyMaps(lesson) {
  let sharp;
  try { sharp = requireGlobal('sharp'); } catch (e) { return {}; }
  const specs = {};
  function walk(value) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach(walk); return; }
    if (value.type === 'world-geography-map') {
      const key = worldGeographyMapKey(value);
      if (!specs[key]) specs[key] = value;
    }
    Object.keys(value).forEach(function (key) { walk(value[key]); });
  }
  walk(lesson);

  const images = {};
  for (const [key, spec] of Object.entries(specs)) {
    const built = shared.tightSvg(spec);
    const resize = built.aspect >= 1 ? { width: RENDER_PX } : { height: RENDER_PX };
    try {
      const png = await sharp(Buffer.from(built.svg), { density: 144 }).resize(resize).png().toBuffer();
      images[key] = { png, aspect: built.aspect };
    } catch (e) {
      // draw-time fallback makes a failed raster visible on the slide
    }
  }
  return images;
}

function drawWorldGeographyMap(pptx, slide, zone, data, ctx) {
  const label = String((data && data.label) || '');
  const hasLabel = label.length > 0;
  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const availH = zone.h - 2 * PAD;
  const bandH = hasLabel ? Math.min(LABEL_H + LABEL_GAP, availH * 0.35) : 0;
  const innerH = Math.max(0, availH - bandH);
  const entry = ctx.worldGeographyMapImages && ctx.worldGeographyMapImages[worldGeographyMapKey(data)];

  if (entry && entry.png && innerW > 0.05 && innerH > 0.05) {
    let w = innerW;
    let h = w / entry.aspect;
    if (h > innerH) { h = innerH; w = h * entry.aspect; }
    slide.addImage({
      data: 'image/png;base64,' + entry.png.toString('base64'),
      x: innerX + (innerW - w) / 2,
      y: innerY + (innerH - h) / 2,
      w, h
    });
  } else if (innerW > 0.05 && innerH > 0.05) {
    require('./figure-fallback').drawFigureFallback(pptx, slide, { x: innerX, y: innerY, w: innerW, h: innerH }, ctx, 'world geography map');
  }

  if (hasLabel && bandH > 0.05) {
    slide.addText(label, {
      x: innerX, y: innerY + innerH + LABEL_GAP,
      w: innerW, h: Math.max(0.1, bandH - LABEL_GAP),
      fontFace: FONT, fontSize: LABEL_FONT, color: COLOURS.body,
      bold: true, align: 'center', valign: 'middle', margin: 0, fit: FIT
    });
  }
}

module.exports = { drawWorldGeographyMap, preRenderWorldGeographyMaps, worldGeographyMapKey };
