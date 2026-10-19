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
//   steady         the band is kept for a `label` that is there but empty, and
//                  the caption sits directly under the picture, so a question
//                  slide (`"label": ""`) and its answers slide (`"label":
//                  "||6 and 4"`) place the picture identically
const CAPTION = Object.freeze({ h: 0.86, hAnswer: 1.16, gap: 0.06, font: 28, fontAnswer: 26, maxShare: 0.6, bandKey: null, steady: false });

// type -> the shared module that draws it, and a plain name for the marker a
// slide shows if a picture could not be made. `caption` (an object, possibly
// empty) says the board prints `data.label` under the picture as typed text.
const FIGURES = {
  numberline: { module: require('../../../shared/visuals/number-line-svg'), name: 'number line' },
  'bar-chart': { module: require('../../../shared/visuals/bar-chart-svg'), name: 'bar chart' },
  'line-graph': { module: require('../../../shared/visuals/line-graph-svg'), name: 'line graph' },
  'shaded-fraction': { module: require('../../../shared/visuals/shaded-fraction-svg'), name: 'shaded fraction', caption: {} },
  'fraction-wall': { module: require('../../../shared/visuals/fraction-wall-svg'), name: 'fraction wall' },
  money: { module: require('../../../shared/visuals/money-svg'), name: 'coins' },
  // A map keeps its true shape, so a slot shaped unlike it leaves the rest
  // empty; `zoneFill` names it for the check that says so (see _zone-fill.js).
  map: {
    module: require('../../../shared/visuals/map-svg'),
    name: 'map',
    zoneFill: (data) => `the ${String((data && data.map) || '').trim().toLowerCase().replace(/[ _]+/g, '-')} map`,
  },
  // A scale's `label` ("The scales show 200g", "Mark 250ml") is the board's
  // typed caption, as the board's own dial and jug always printed it.
  'dial-scale': { module: require('../../../shared/visuals/dial-scale-svg'), name: 'dial scale', caption: { h: 0.5, hAnswer: 0.8, font: 24, fontAnswer: 24 } },
  'measuring-jug': { module: require('../../../shared/visuals/measuring-jug-svg'), name: 'measuring jug', caption: { h: 0.5, hAnswer: 0.8, font: 24, fontAnswer: 24 } },
  ruler: { module: require('../../../shared/visuals/ruler-svg'), name: 'ruler' },
  timeline: { module: require('../../../shared/visuals/timeline-svg'), name: 'timeline' },
  'process-chain': { module: require('../../../shared/visuals/process-chain-svg'), name: 'process chain' },
  cycle: { module: require('../../../shared/visuals/cycle-svg'), name: 'cycle' },
  'classification-key': { module: require('../../../shared/visuals/classification-key-svg'), name: 'classification key' },
  'concept-map': { module: require('../../../shared/visuals/concept-map-svg'), name: 'concept map' },
  'annotated-text': { module: require('../../../shared/visuals/annotated-text-svg'), name: 'annotated text' },
  fishbone: { module: require('../../../shared/visuals/fishbone-svg'), name: 'fishbone' },
  'continuum-line': { module: require('../../../shared/visuals/continuum-line-svg'), name: 'continuum line' },
  'source-pathway': { module: require('../../../shared/visuals/source-pathway-svg'), name: 'source pathway' },
  'number-network': { module: require('../../../shared/visuals/number-network-svg'), name: 'number network', caption: { h: 0.5, hAnswer: 0.8, font: 24, fontAnswer: 24 } },
  // A clock's caption was tuned to sit small under the face ("(a)"), with the
  // answer reveal larger and bold so the green time reads from the back row.
  clock: { module: require('../../../shared/visuals/clock-svg'), name: 'clock', caption: { bandKey: 'clockLabelBandH', h: 0.35, hAnswer: 0.7, font: 13, fontAnswer: 20 } },
  // Turn names vary in length ("half turn" against "three-quarter turn
  // clockwise"), so the band holds two lines and a long name wraps at a
  // board-readable size instead of shrinking to 13pt beside its 24pt neighbours.
  'turn-diagram': { module: require('../../../shared/visuals/turn-diagram-svg'), name: 'turn diagram', caption: { bandKey: 'turnLabelBandH' } },
  'triangle-square': { module: require('../../../shared/visuals/triangle-square-svg'), name: 'triangle-square puzzle' },
  // The row's lettered index ("(a)") or an answer ("(c) ||5 lines"), sized to
  // match the triangle and angle captions so a mixed row shares a baseline.
  polygon: { module: require('../../../shared/visuals/polygon-svg'), name: 'shape', caption: { bandKey: 'polygonLabelBandH' } },
  'translation-grid': { module: require('../../../shared/visuals/translation-grid-svg'), name: 'translation grid' },
  // The coordinate grid is told its zone, so its axis numbers and letters are
  // sized for the board and the picture is made at the size it is shown. It
  // used to be drawn once at 700 pixels before any zone was known and
  // stretched, which left a ten-square grid's numbers at 8 to 9pt and its
  // diagonals soft (stress test, 7 October 2026).
  'coordinate-grid': { module: require('../../../shared/visuals/coordinate-grid-svg'), name: 'coordinate grid' },
  'area-grid': { module: require('../../../shared/visuals/area-grid-svg'), name: 'area grid' },
  'comparison-slot': { module: require('../../../shared/visuals/comparison-svg'), name: 'comparison slot' },
  // A column sum's `label` is its typed caption, for an answer that is words
  // rather than marks ("||no exchange" under a sum where no column needs one).
  // Steady, so a question slide's empty caption keeps the same room and the
  // chart does not move (charts-stand-still.js).
  'place-value-chart': { module: require('../../../shared/visuals/place-value-chart-svg'), name: 'place value chart', caption: { bandKey: 'placeValueLabelBandH', h: 0.5, hAnswer: 0.5, font: 24, fontAnswer: 24, steady: true } },
  'place-value-mini': { module: require('../../../shared/visuals/place-value-mini-svg'), name: 'place value picture' },
  'base-ten-blocks': { module: require('../../../shared/visuals/base-ten-blocks-svg'), name: 'base-ten blocks' },
  'counter-group': { module: require('../../../shared/visuals/counter-group-svg'), name: 'counters' },
  // A ten frame's `label` ("(a)", "||6 and 4 make 10") is the board's typed
  // caption, as it was when a ten frame was drawn as a fraction grid. One band
  // for a plain caption and an answer (two lines of "(a) 8 and 2 make 10" in a
  // third of a row), so an answers slide that adds counters and a green
  // caption leaves the frame where the question had it.
  'ten-frame': { module: require('../../../shared/visuals/ten-frame-svg'), name: 'ten frame', caption: { h: 0.9, hAnswer: 0.9, font: 26, fontAnswer: 26, steady: true } },
  'part-whole-model': { module: require('../../../shared/visuals/part-whole-model-svg'), name: 'part-whole model' },
  pyramid: { module: require('../../../shared/visuals/pyramid-svg'), name: 'pyramid' },
  'mult-grid': { module: require('../../../shared/visuals/mult-grid-svg'), name: 'multiplication grid' },
  'digit-cards': { module: require('../../../shared/visuals/digit-cards-svg'), name: 'digit cards' },
  // A sum's exchange shown happening: placed as parts, not one picture, so each
  // piece is a shape of its own that PowerPoint's Morph moves between the
  // clicks of its run (src/happening-runs.js, src/morph-transitions.js).
  'exchange-happening': { module: require('../../../shared/visuals/exchange-happening-svg'), name: 'sum shown happening', layered: true },
};

function captionFor(type, data) {
  const row = FIGURES[type];
  if (!row || !row.caption) return null;
  const label = data && data.label != null ? String(data.label) : '';
  const c = { ...CAPTION, ...row.caption };
  if (!label && !(c.steady && data && data.label != null)) return null;
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
  // A before-and-after pair of counters has its exchange marked on the board
  // as it is on the wall (the teacher, 6 October 2026: "I'd want it on slides
  // for sure"): the counters that go ringed as a group, the counter they
  // become ringed, the arrow in the rings' green. It adds marks and moves
  // nothing; a chart with no clean exchange in it draws as it always did.
  const overrides = type === 'place-value-chart' ? { pairExchangeMarks: true } : undefined;
  const profile = profileFor('slides', { widthPt: box.w * 72, heightPt: box.h * 72, overrides });
  // A clock in a row leaves the room its neighbours' readout or minute ring
  // takes, so the row's faces are one size (row.js).
  const spec = type === 'clock' && zone.clockRowReserve ? { ...data, reserve: zone.clockRowReserve } : data;
  const built = module.tightSvg(spec, profile);
  // A steady caption belongs to its picture: the two are centred as one block,
  // so the words sit under the frame and not at the foot of a tall card.
  if (cap && cap.c.steady && band > 0) {
    const h = Math.min(box.h, built.h / 72);
    box.y += (box.h - h) / 2;
    box.h = h;
  }
  return { box, inner, band, cap, built, key: module.cacheKey(spec, profile), spec, profile };
}

function drawCaption(slide, laid) {
  const { cap, band, inner, box } = laid;
  if (!cap || band <= 0.05 || !cap.label) return;
  slide.addText(splitAnswerRuns(cap.label, cap.answer), {
    x: inner.x, y: box.y + box.h + cap.c.gap,
    w: inner.w, h: Math.max(0.1, band - cap.c.gap),
    fontFace: FONT, fontSize: cap.answer ? cap.c.fontAnswer : cap.c.font, color: COLOURS.body,
    bold: cap.answer,
    align: 'center', valign: cap.c.steady ? 'top' : 'middle', margin: 0, fit: FIT
  });
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
    const laid = build(type, zone, data);
    const { box, built, key } = laid;
    drawCaption(slide, laid);
    if (!built) return;
    const w = built.w / 72;
    const h = built.h / 72;
    const { x, y } = placeIn(box, built);
    if (FIGURES[type].zoneFill) {
      require('./_zone-fill').checkZoneFill(ctx, zone, { w, h }, FIGURES[type].zoneFill(data));
    }
    if (type === 'process-chain' && built.layout && built.layout.rows > 1) {
      // Would it have kept one row across the slide's full width? Then it bent
      // for want of room, not because it is long.
      try {
        const { CONTENT_W } = require('../layout');
        const wide = profileFor('slides', { widthPt: CONTENT_W * 72, heightPt: box.h * 72 });
        if (FIGURES[type].module.describeLayout(data, wide).rows === 1) {
          require('./_zone-fill').checkChainTurn(ctx,
            `this chain turns onto two rows because its space is ${box.w.toFixed(1)}in wide, though it would sit on one row ` +
            `across the full width of the slide. When the class has met this chain on one row, a two-row version reads to a ` +
            `child as a different thing: give it the full width (the case and the criteria above it, below it or on the slide before) ` +
            `so it keeps the shape they know (templates.md -> process-chain, "One look for one chain").`);
        }
      } catch (err) { /* a measurement that cannot be made adds no note */ }
    }
    const store = ctx && ctx.sharedFigures;
    if (FIGURES[type].layered) {
      drawLayered(pptx, slide, { x, y, w, h }, laid, store, ctx, type);
      return;
    }
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

// A layered drawing: its pictures (the frame, the written sum, an arrow) and its
// shapes (every piece and outline), each named so the same piece on the next
// slide of a run is the same object to PowerPoint. Positions are the drawing's
// own points, placed at the box the whole drawing was given.
function drawLayered(pptx, slide, at, laid, store, ctx, type) {
  const { module } = FIGURES[type];
  const L = module.slideLayers(laid.spec, laid.profile);
  const k = at.w / (L.w / 72);
  const inch = (pt) => (pt / 72) * k;
  const hex = (c) => String(c || '').replace(/^#/, '').toUpperCase();
  const fade = (opacity) => Math.round((1 - (opacity == null ? 1 : opacity)) * 100);
  let missing = false;
  const picture = (pic) => {
    const key = `${laid.key}|${pic.name}`;
    const entry = store && store.get(key);
    if (entry) {
      slide.addImage({ data: 'image/png;base64,' + entry.png.toString('base64'), x: at.x, y: at.y, w: at.w, h: at.h, objectName: pic.name });
      return;
    }
    if (store && !store.rasterised) {
      store.request(key, pic.svg, L.aspect);
      return;
    }
    missing = true;
  };
  L.pictures.filter((p) => !p.front).forEach(picture);
  L.shapes.forEach((d) => {
    const box = { x: at.x + inch(d.x), y: at.y + inch(d.y), w: inch(d.w), h: inch(d.h) };
    const line = d.line
      ? { color: hex(d.line), width: Math.max(0.5, d.lineW * k), ...(d.dash ? { dashType: 'dash' } : {}), transparency: fade(d.opacity) }
      : { type: 'none' };
    const fill = d.fill ? { color: hex(d.fill), transparency: fade(d.opacity) } : { type: 'none' };
    const shape = d.kind === 'ellipse' ? pptx.shapes.OVAL : pptx.shapes.RECTANGLE;
    if (d.text) {
      slide.addText(d.text, {
        shape, ...box, fill, line, objectName: d.name,
        fontFace: FONT, fontSize: Math.max(6, d.textPt * k), bold: true, color: '1A1A1A', transparency: fade(d.opacity),
        // One line always: a counter's 100 must never break into 10 over 0.
        align: 'center', valign: 'middle', margin: 0, wrap: false,
      });
    } else {
      slide.addShape(shape, { ...box, fill, line, objectName: d.name });
    }
  });
  L.pictures.filter((p) => p.front).forEach(picture);
  if (store && !store.rasterised) {
    // Hold the drawing's place for anything measuring the drawn extent.
    slide.addShape(pptx.shapes.RECTANGLE, { ...at, fill: { color: 'FFFFFF', transparency: 100 }, line: { type: 'none' } });
  } else if (missing) {
    require('./figure-fallback').drawFigureFallback(pptx, slide, at, ctx, FIGURES[type].name);
  }
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

// The widest a picture can ever usefully be on a slide, for a picture that stops
// growing (a comparison ring), so a row gives the rest of its width to the
// items beside it. null when the picture uses whatever it is given.
function maxUsefulWidthFor(type) {
  return function maxUsefulWidth(data) {
    const { module } = FIGURES[type];
    if (typeof module.maxWidthPt !== 'function') return null;
    return module.maxWidthPt(data || {}, profileFor('slides', { widthPt: 1000 })) / 72 + 2 * PAD;
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

module.exports = { FIGURES, CAPTION, createSharedFigureStore, drawerFor, measurerFor, maxUsefulWidthFor, placedRectFor, captionBandHeight, build };
