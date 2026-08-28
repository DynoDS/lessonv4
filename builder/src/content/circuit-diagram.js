'use strict';

// Slide-specific work for the shared series-circuit drawing. The geometry is
// kept in shared/visuals/circuit-diagram-svg.js so the slide renderer only owns
// image preparation, sizing and the PowerPoint fallback.

const requireGlobal = require('../require-global');
const { tightSvg, cacheKey } = require('../../../shared/visuals/circuit-diagram-svg');
const { measureContainedAspect } = require('./contained-extent');

// ─── SLIDE-SPECIFIC CONSTANTS ─────────────────────────────────────────────
const PAD = 0.10;
const RENDER_PX = 700;
// ─── END CONSTANTS ─────────────────────────────────────────────────────────

async function preRenderCircuitDiagrams(lesson) {
  let sharp;
  try { sharp = requireGlobal('sharp'); } catch (e) { return {}; }

  const specs = {};
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    if (obj.type === 'circuit-diagram') {
      const key = cacheKey(obj);
      if (!specs[key]) specs[key] = obj;
    }
    Object.keys(obj).forEach((key) => walk(obj[key]));
  }
  walk(lesson);

  const map = {};
  for (const [key, spec] of Object.entries(specs)) {
    const { svg, aspect } = tightSvg(spec);
    const resize = aspect >= 1 ? { width: RENDER_PX } : { height: RENDER_PX };
    try {
      const png = await sharp(Buffer.from(svg), { density: 144 })
        .resize(resize)
        .png()
        .toBuffer();
      map[key] = { png, aspect };
    } catch (e) {
      // This circuit IS the teaching on the slide that asked for it: the state
      // of the switch, the number of cells, whether the path is broken. A grey
      // box captioned "circuit diagram" in its place is not a smaller version of
      // that, it is the lesson missing.
      throw new Error(
        `CIRCUIT_RENDER_FAILED: could not turn the circuit drawing into an image: ` +
          `${(e && e.message) || e}`
      );
    }
  }
  return map;
}

function drawCircuitDiagram(pptx, slide, zone, data, ctx) {
  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = Math.max(0, zone.w - 2 * PAD);
  const innerH = Math.max(0, zone.h - 2 * PAD);
  const key = cacheKey(data);
  const entry = ctx.circuitDiagramImages && ctx.circuitDiagramImages[key];

  if (innerW <= 0.05 || innerH <= 0.05) return;
  if (entry && entry.png) {
    const aspect = entry.aspect || 1;
    let w = innerW;
    let h = w / aspect;
    if (h > innerH) {
      h = innerH;
      w = h * aspect;
    }
    slide.addImage({
      data: 'image/png;base64,' + entry.png.toString('base64'),
      x: innerX + (innerW - w) / 2,
      y: innerY + (innerH - h) / 2,
      w,
      h,
    });
    return;
  }

  // No prepared image for a circuit that was asked for. The generic figure
  // fallback used to stand in here, which meant a slide about an open switch
  // shipped showing a placeholder box and nothing said so.
  throw new Error(
    `CIRCUIT_RENDER_FAILED: no prepared circuit image exists for ${key}.`
  );
}

// Card-ready extent: the circuit's natural aspect contained in the zone, so
// the card hugs the drawing instead of spanning the whole zone around a
// centred loop. No prepared image means the draw pass refuses by name, and a
// refused figure has no aspect to hug - the card spans the zone as before.
function measureCircuitDiagram(zone, data, ctx) {
  const entry = ctx && ctx.circuitDiagramImages
    && ctx.circuitDiagramImages[cacheKey(data)];
  if (!entry) return null;
  return measureContainedAspect(zone, entry.aspect || 1, PAD);
}

module.exports = {
  drawCircuitDiagram,
  preRenderCircuitDiagrams,
  circuitDiagramKey: cacheKey,
  measureCircuitDiagram
};
