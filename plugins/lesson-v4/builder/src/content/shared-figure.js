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
const { FONT, COLOURS, FIT } = require('../styles');
const { splitAnswerRuns } = require('../answer-text');
const { profileFor } = require('../../../shared/visuals/surface-profiles');

const PAD = 0.1; // inches inside the zone
// Pixels per point in the picture placed on the slide. 4 is about 290 dpi at
// the size it prints, crisp from the front row and on a board-sized screen.
const PX_PER_PT = 4;

// A caption under a board picture ("(a)", "quarter turn", "(b) ||half past
// twelve") is typed text, not part of the drawing: the teacher edits it in
// PowerPoint and its "||" answer reveal prints green, so the board sets it
// itself under the placed picture. These are the sizes the board's clock, turn,
// angle and polygon captions were tuned to, read from the back of the room;
// a FIGURES row's `caption` may override any of them.
//   h, hAnswer     the band in inches under the picture, for a plain caption
//                  and for one carrying an answer reveal
//   gap            inches between the picture and the band
//   font, fontAnswer  point-size ceilings; FIT shrinks a long caption
//   maxShare       the most of the zone's height a band may take, so a tight
//                  zone never drives the picture to nothing
//   bandKey        the zone field a row sets so every sibling reserves the
//                  largest band any of them needs and all draw at one size
const CAPTION = Object.freeze({ h: 0.86, hAnswer: 1.16, gap: 0.06, font: 28, fontAnswer: 26, maxShare: 0.6, bandKey: null });

// type -> the shared module that draws it, and a plain name for the marker a
// slide shows if a picture could not be made. `caption` (an object, possibly
// empty) says the board prints `data.label` under the picture as typed text.
const FIGURES = {
  numberline: { module: require('../../../shared/visuals/number-line-svg'), name: 'number line' },
  'shaded-fraction': { module: require('../../../shared/visuals/shaded-fraction-svg'), name: 'shaded fraction', caption: {} },
  'fraction-wall': { module: require('../../../shared/visuals/fraction-wall-svg'), name: 'fraction wall' },
  money: { module: require('../../../shared/visuals/money-svg'), name: 'coins' },
};

function captionFor(type, data) {
  const row = FIGURES[type];
  if (!row || !row.caption) return null;
  const label = data && data.label != null ? String(data.label) : '';
  if (!label) return null;
  const c = { ...CAPTION, ...row.caption };
  const answer = label.includes('||');
  return { label, answer, c, natural: answer ? c.hAnswer : c.h };
}

// The band a picture's caption needs, for a row equalising its siblings. 0 when
// the picture carries no caption.
function captionBandHeight(type, data) {
  const cap = captionFor(type, data);
  return cap ? cap.natural : 0;
}

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
  const inner = innerBox(zone);
  // Reserve the caption band first, capped so it never swallows the picture:
  // in a crowded row a fixed band once drove a turn diagram's height negative
  // and the invalid picture size corrupted the .pptx.
  const cap = captionFor(type, data);
  let band = 0;
  if (cap) {
    const shared = cap.c.bandKey && typeof zone[cap.c.bandKey] === 'number' ? zone[cap.c.bandKey] : null;
    band = Math.min((shared != null ? shared : cap.natural) + cap.c.gap, Math.max(0, inner.h * cap.c.maxShare));
  }
  const box = { ...inner, h: Math.max(0, inner.h - band) };
  // A space too small to hold any picture shows only its caption, as the
  // board's clock and turn diagram always did.
  if (box.w < 0.05 || box.h < 0.05) return { box, inner, band, cap, built: null, key: null };
  const profile = profileFor('slides', { widthPt: box.w * 72, heightPt: box.h * 72 });
  const built = module.tightSvg(data, profile);
  return { box, inner, band, cap, built, key: module.cacheKey(data, profile) };
}

function drawCaption(slide, laid) {
  const { cap, band, inner, box } = laid;
  if (!cap || band <= 0.05) return;
  slide.addText(splitAnswerRuns(cap.label, cap.answer), {
    x: inner.x, y: box.y + box.h + cap.c.gap,
    w: inner.w, h: Math.max(0.1, band - cap.c.gap),
    fontFace: FONT, fontSize: cap.answer ? cap.c.fontAnswer : cap.c.font, color: COLOURS.body,
    bold: cap.answer,
    align: 'center', valign: 'middle', margin: 0, fit: FIT
  });
}

function drawerFor(type) {
  function draw(pptx, slide, zone, data, ctx) {
    const laid = build(type, zone, data);
    const { box, built, key } = laid;
    drawCaption(slide, laid);
    if (!built) return;
    const w = built.w / 72;
    const h = built.h / 72;
    const x = box.x + (box.w - w) / 2;
    const y = box.y + (box.h - h) / 2;
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
// A caption spans the zone's width, so a captioned picture hugs only its depth.
function measurerFor(type) {
  return function measure(zone, data) {
    const { built, band, inner } = build(type, zone, data);
    const w = built ? built.w / 72 : 0;
    const h = built ? built.h / 72 : 0;
    return { w: (band > 0 ? Math.max(w, inner.w) : w) + 2 * PAD, h: h + band + 2 * PAD };
  };
}

module.exports = { FIGURES, CAPTION, createSharedFigureStore, drawerFor, measurerFor, captionBandHeight };
