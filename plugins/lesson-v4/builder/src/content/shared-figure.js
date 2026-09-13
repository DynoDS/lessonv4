'use strict';

// Place a shared drawing on a slide.
//
// Every picture is drawn once, in shared/visuals/, and the board, the worksheet,
// the working wall and the stick-in pack all place that one drawing (13 September
// 2026: the number line was drawn four ways and a wall card looked nothing like
// the slides). This is the board's one way of placing any of them, so a picture
// moved into shared/visuals/ reaches the board by being listed in FIGURES and
// nothing else: no per-picture slide file.
//
// A shared drawing lays itself out at the size it will really print, so its
// numerals meet the board's readable floor as real sizes. That means it has to
// know the zone before it can be drawn, and the zone is only known while the
// slide is being drawn, which is synchronous while turning SVG into a picture is
// not. The build already draws every slide twice (a preflight into a throwaway
// deck, then the real one), so the preflight asks for each drawing at its exact
// zone, the pictures are made between the two passes, and the real pass places
// them. A drawing that refuses its zone (NUMBERLINE_ZONE_TOO_SHALLOW) refuses in
// the preflight, by name, before a file exists.

const requireGlobal = require('../require-global');
const { profileFor } = require('../../../shared/visuals/surface-profiles');

const PAD = 0.1; // inches inside the zone
// Pixels per point in the picture placed on the slide. 4 is about 290 dpi at
// the size it prints, crisp from the front row and on a board-sized screen.
const PX_PER_PT = 4;

// type -> the shared module that draws it, and a plain name for the marker a
// slide shows if a picture could not be made.
const FIGURES = {
  numberline: { module: require('../../../shared/visuals/number-line-svg'), name: 'number line' },
  'place-value-chart': { module: require('../../../shared/visuals/place-value-chart-svg'), name: 'place value chart' },
  'place-value-mini': { module: require('../../../shared/visuals/place-value-mini-svg'), name: 'place value picture' },
  'base-ten-blocks': { module: require('../../../shared/visuals/base-ten-blocks-svg'), name: 'base-ten blocks' },
  'counter-group': { module: require('../../../shared/visuals/counter-group-svg'), name: 'counters' },
  'part-whole-model': { module: require('../../../shared/visuals/part-whole-model-svg'), name: 'part-whole model' },
  pyramid: { module: require('../../../shared/visuals/pyramid-svg'), name: 'pyramid' },
  'mult-grid': { module: require('../../../shared/visuals/mult-grid-svg'), name: 'multiplication grid' },
};

// One per build. `request` records a drawing the preflight needs; `rasterise`
// turns every recorded drawing into a picture; `get` hands it to the real pass.
function createSharedFigureStore() {
  const requested = new Map();
  const made = new Map();
  let rasterised = false;
  return {
    request(key, svg, aspect) {
      if (!made.has(key) && !requested.has(key)) requested.set(key, { svg, aspect });
    },
    get(key) {
      return made.get(key) || null;
    },
    get rasterised() {
      return rasterised;
    },
    async rasterise() {
      rasterised = true;
      if (!requested.size) return;
      const sharp = requireGlobal('sharp');
      for (const [key, { svg, aspect }] of requested) {
        const widthPt = Number(/width="([\d.]+)"/.exec(svg)[1]);
        const png = await sharp(Buffer.from(svg), { density: 72 * PX_PER_PT })
          .resize({ width: Math.round(widthPt * PX_PER_PT) })
          .png()
          .toBuffer();
        made.set(key, { png, aspect });
      }
      requested.clear();
    },
    get pending() {
      return requested.size;
    },
  };
}

function innerBox(zone) {
  return { x: zone.x + PAD, y: zone.y + PAD, w: Math.max(0, zone.w - 2 * PAD), h: Math.max(0, zone.h - 2 * PAD) };
}

function build(type, zone, data) {
  const { module } = FIGURES[type];
  const box = innerBox(zone);
  const profile = profileFor('slides', { widthPt: box.w * 72, heightPt: box.h * 72 });
  const built = module.tightSvg(data, profile);
  return { box, built, key: module.cacheKey(data, profile) };
}

// Centred in its box, unless the drawing says it belongs at the top: a bare
// place-value heading strip is a reference in a side rail, and a reference sits
// where the eye lands first, not halfway down a tall thin column.
function placeIn(box, built) {
  const w = built.w / 72;
  const h = built.h / 72;
  return { x: box.x + (box.w - w) / 2, y: built.anchor === 'top' ? box.y : box.y + (box.h - h) / 2, w, h };
}

function drawerFor(type) {
  function draw(pptx, slide, zone, data, ctx) {
    const { box, built, key } = build(type, zone, data);
    const w = built.w / 72;
    const h = built.h / 72;
    const { x, y } = placeIn(box, built);
    const store = ctx && ctx.sharedFigures;
    const entry = store && store.get(key);
    if (entry) {
      slide.addImage({ data: 'image/png;base64,' + entry.png.toString('base64'), x, y, w, h });
      return;
    }
    // The preflight's job is only to ask: the picture is made before the real
    // pass. A miss after that is a real failure and shows the marker.
    if (store && !store.rasterised) {
      store.request(key, built.svg, built.aspect);
      // Hold the picture's place, so anything measuring the drawn extent (a
      // vocabulary card sizing its panel) sees the real box.
      slide.addShape(pptx.shapes.RECTANGLE, { x, y, w, h, fill: { color: 'FFFFFF', transparency: 100 }, line: { type: 'none' } });
      return;
    }
    require('./figure-fallback').drawFigureFallback(pptx, slide, { x, y, w, h }, ctx, FIGURES[type].name);
  }
  draw.geometry = FIGURES[type].module;
  return draw;
}

// The box the drawing really occupies in a zone, so a card hugs the picture.
function measurerFor(type) {
  return function measure(zone, data) {
    const { built } = build(type, zone, data);
    return { w: built.w / 72 + 2 * PAD, h: built.h / 72 + 2 * PAD };
  };
}

// The rect a card behind the drawing should cover, in the shape index.js's
// MEASURE table wants: where the picture is really placed, plus the placer's
// own breathing margin, so a card hugs the picture rather than its zone.
function placedRectFor(type) {
  return function measure(zone, data) {
    const { box, built } = build(type, zone, data);
    const at = placeIn(box, built);
    return { x: at.x - PAD, y: at.y - PAD, w: at.w + 2 * PAD, h: at.h + 2 * PAD };
  };
}

module.exports = { FIGURES, createSharedFigureStore, drawerFor, measurerFor, placedRectFor };
