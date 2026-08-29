'use strict';

// Slide renderer for the shared three-part geographical description frame.
// The SVG is prepared once before the slide loop, then placed by its true aspect
// so the headings, prompts and response spaces use the whole available zone.

const requireGlobal = require('../require-global');
const { tightSvg, cacheKey } = require('../../../shared/visuals/geographical-description-frame-svg');

// ─── SLIDE-SPECIFIC CONSTANTS ───────────────────────────────────────────────
const PAD = 0.08;       // zone inner padding (inches)
const RENDER_PX = 1800; // long edge; prompt text remains crisp on a full slide
// ─── END CONSTANTS ─────────────────────────────────────────────────────────

async function preRenderGeographicalDescriptionFrames(lesson) {
  let sharp;
  try { sharp = requireGlobal('sharp'); } catch (e) { return {}; }

  const specs = {};
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    if (obj.type === 'geographical-description-frame') {
      const key = cacheKey(obj);
      if (!specs[key]) specs[key] = obj;
    }
    for (const value of Object.values(obj)) walk(value);
  }
  walk(lesson);

  const images = {};
  for (const [key, spec] of Object.entries(specs)) {
    const { svg, aspect } = tightSvg(spec);
    const resize = aspect >= 1 ? { width: RENDER_PX } : { height: RENDER_PX };
    try {
      const png = await sharp(Buffer.from(svg), { density: 144 }).resize(resize).png().toBuffer();
      images[key] = { png, aspect };
    } catch (e) {
      // The draw path shows the normal figure fallback if rasterisation fails.
    }
  }
  return images;
}

function drawGeographicalDescriptionFrame(pptx, slide, zone, data, ctx) {
  const inner = {
    x: zone.x + PAD,
    y: zone.y + PAD,
    w: Math.max(0, zone.w - 2 * PAD),
    h: Math.max(0, zone.h - 2 * PAD),
  };
  if (inner.w <= 0.05 || inner.h <= 0.05) return;

  const entry = ctx.geographicalDescriptionFrameImages
    && ctx.geographicalDescriptionFrameImages[cacheKey(data)];
  if (!entry || !entry.png) {
    require('./figure-fallback').drawFigureFallback(pptx, slide, inner, ctx, 'geographical description frame');
    return;
  }

  const aspect = entry.aspect || 1;
  let w = inner.w;
  let h = w / aspect;
  if (h > inner.h) { h = inner.h; w = h * aspect; }
  slide.addImage({
    data: 'image/png;base64,' + entry.png.toString('base64'),
    x: inner.x + (inner.w - w) / 2,
    y: inner.y + (inner.h - h) / 2,
    w,
    h,
  });
}

module.exports = {
  drawGeographicalDescriptionFrame,
  preRenderGeographicalDescriptionFrames,
  geographicalDescriptionFrameKey: cacheKey,
};
