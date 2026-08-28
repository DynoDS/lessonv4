'use strict';

// Slide-specific work for the shared circuit-symbol bank drawing. The geometry
// (the symbol cells, the child-facing names, the refusals for an unknown
// symbol or an unfittable label) lives in
// shared/visuals/circuit-diagram-svg.js next to the circuit it references;
// this module owns image preparation, the card-ready measure and the
// PowerPoint fallback refusal.

const requireGlobal = require('../require-global');
const {
  symbolBankSvg,
  symbolBankCacheKey
} = require('../../../shared/visuals/circuit-diagram-svg');

// ─── SLIDE-SPECIFIC CONSTANTS ─────────────────────────────────────────────
const PAD = 0.10;
const RENDER_PX = 1100;
// ─── END CONSTANTS ─────────────────────────────────────────────────────────

async function preRenderCircuitSymbolBanks(lesson) {
  let sharp;
  try { sharp = requireGlobal('sharp'); } catch (e) { return {}; }

  const specs = {};
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    if (obj.type === 'circuit-symbol-bank') {
      const key = symbolBankCacheKey(obj);
      if (!specs[key]) specs[key] = obj;
    }
    Object.keys(obj).forEach((key) => walk(obj[key]));
  }
  walk(lesson);

  const map = {};
  for (const [key, spec] of Object.entries(specs)) {
    const { svg, aspect } = symbolBankSvg(spec);
    const resize = aspect >= 1 ? { width: RENDER_PX } : { height: RENDER_PX };
    try {
      const png = await sharp(Buffer.from(svg), { density: 144 })
        .resize(resize)
        .png()
        .toBuffer();
      map[key] = { png, aspect };
    } catch (e) {
      // The symbol bank IS the reference the lesson names symbols from: a grey
      // box where "cell" and "lamp" should be is the lesson missing its key, so
      // a bank that will not render refuses the build by name.
      throw new Error(
        `CIRCUIT_BANK_RENDER_FAILED: could not turn the symbol bank into an ` +
          `image: ${(e && e.message) || e}`
      );
    }
  }
  return map;
}

// Card-ready extent: the bank's natural aspect, contained in the zone, plus the
// breathing margin the card needs. The card hugs the bank instead of spanning
// the whole zone, the way the other self-measured figures do.
function measureCircuitSymbolBank(zone, data) {
  let aspect;
  try {
    aspect = symbolBankSvg(data).aspect;
  } catch (e) {
    // The draw pass reports the refusal with its full message; the measure
    // only needs to stay out of the way.
    throw e;
  }
  const innerW = Math.max(0, zone.w - 2 * PAD);
  const innerH = Math.max(0, zone.h - 2 * PAD);
  let w = innerW;
  let h = w / aspect;
  if (h > innerH) {
    h = innerH;
    w = h * aspect;
  }
  return {
    x: zone.x + PAD + (innerW - w) / 2,
    y: zone.y + PAD + (innerH - h) / 2,
    w: w + 2 * PAD,
    h: h + 2 * PAD,
    clamp: true
  };
}

function drawCircuitSymbolBank(pptx, slide, zone, data, ctx) {
  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = Math.max(0, zone.w - 2 * PAD);
  const innerH = Math.max(0, zone.h - 2 * PAD);
  const key = symbolBankCacheKey(data);
  const entry = ctx.circuitSymbolBankImages && ctx.circuitSymbolBankImages[key];

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

  // No prepared image for a bank that was asked for: the same refusal the
  // circuit makes, because a placeholder where the component key should be
  // says nothing to the class.
  throw new Error(
    `CIRCUIT_BANK_RENDER_FAILED: no prepared symbol bank image exists for ${key}.`
  );
}

module.exports = {
  drawCircuitSymbolBank,
  preRenderCircuitSymbolBanks,
  measureCircuitSymbolBank,
  circuitSymbolBankKey: symbolBankCacheKey
};
