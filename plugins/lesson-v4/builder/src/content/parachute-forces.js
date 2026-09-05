'use strict';

const requireGlobal = require('../require-global');
const { tightSvg, cacheKey } = require('../../../shared/visuals/parachute-forces-svg');
const { measureContainedAspect } = require('./contained-extent');

const PAD = 0.08;
const RENDER_PX = 1800;

async function preRenderParachuteForces(lesson) {
  let sharp;
  try { sharp = requireGlobal('sharp'); } catch (e) { return {}; }

  const specs = {};
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    if (obj.type === 'parachute-forces') {
      const key = cacheKey(obj);
      if (!specs[key]) specs[key] = obj;
    }
    Object.keys(obj).forEach((key) => walk(obj[key]));
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
      throw new Error(`PARACHUTE_FORCES_RENDER_FAILED: ${(e && e.message) || e}`);
    }
  }
  return images;
}

function drawParachuteForces(pptx, slide, zone, data, ctx) {
  const key = cacheKey(data);
  const entry = ctx.parachuteForcesImages && ctx.parachuteForcesImages[key];
  if (!entry || !entry.png) {
    throw new Error(`PARACHUTE_FORCES_RENDER_FAILED: no prepared image exists for ${key}.`);
  }
  const innerW = Math.max(0, zone.w - 2 * PAD);
  const innerH = Math.max(0, zone.h - 2 * PAD);
  if (innerW <= 0.05 || innerH <= 0.05) return;
  const aspect = entry.aspect || 1;
  let w = innerW;
  let h = w / aspect;
  if (h > innerH) { h = innerH; w = h * aspect; }
  slide.addImage({
    data: 'image/png;base64,' + entry.png.toString('base64'),
    x: zone.x + (zone.w - w) / 2,
    y: zone.y + (zone.h - h) / 2,
    w, h,
  });
}

function measureParachuteForces(zone, data, ctx) {
  const entry = ctx && ctx.parachuteForcesImages && ctx.parachuteForcesImages[cacheKey(data)];
  if (!entry) return null;
  return measureContainedAspect(zone, entry.aspect || 1, PAD);
}

module.exports = {
  drawParachuteForces,
  preRenderParachuteForces,
  measureParachuteForces,
  parachuteForcesKey: cacheKey,
};
