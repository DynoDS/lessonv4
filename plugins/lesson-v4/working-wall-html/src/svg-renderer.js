// SVG primitives the working wall renders to PNG via sharp before HTML/PDF
// rendering. Every primitive follows the same shape: an *Svg(spec, sizePx)
// generator returning an SVG string and an *Key(spec) function returning a
// unique cache key. The pre-render walker collects every primitive instance
// the cards need, renders each unique key once, and stores PNG buffers in a map.
//
// All visual primitives render on a square canvas (RENDER_PX × RENDER_PX) so
// panelWithVisual's square image-transform stays correct without any aspect
// plumbing. Wide visuals (number line) sit at vertical centre with whitespace
// above and below — slightly less efficient but ships now.

// The design canvas. Geometry inside the primitives is worked out from this
// number, and their stroke widths are absolute against it (`stroke-width="3"`
// and friends), so changing it would thin every line in every drawing. It stays
// where it is.
const RENDER_PX = 600;          // fraction circle / fraction bar design canvas

// How many raster pixels each canvas unit becomes. The two are separate because
// a drawing is placed at whatever width its card has room for, and the widest
// placement on the wall is a full-bleed A3 landscape figure at about 14.7in. A
// 600px render across that is roughly 41 dots per inch, and a review of every
// wall the engine had built found exactly that: a place-value chart blown up to
// 31.6cm with visible staircase edges on its digits. The SVG is vector, so
// rendering the same 600-unit drawing at 4x costs nothing in proportion and
// takes the widest placement to about 163 dots per inch.
const RENDER_SCALE  = 4;
const RENDER_OUT_PX = RENDER_PX * RENDER_SCALE;
const BADGE_PX  = 240;          // step badge resolution

// Shared diagram geometry — the SAME source the slide and worksheet engines
// draw from, so a wall line-pair / angle is identical to the one on the board.
// These produce a TIGHT SVG plus its true aspect; the wall stores that aspect
// and places the image by it (no square padding), matching the other engines.
const linePairShared = require('../../shared/visuals/line-pair-svg');
const numberLineShared = require('../../shared/visuals/number-line-svg');
const { profileFor } = require('../../shared/visuals/surface-profiles');
const angleShared    = require('../../shared/visuals/angle-svg');
const triangleShared = require('../../shared/visuals/triangle-svg');
const vennShared     = require('../../shared/visuals/venn-svg');
const carrollShared  = require('../../shared/visuals/carroll-svg');
const geoboardShared = require('../../shared/visuals/geoboard-svg');
const reflectionGridShared = require('../../shared/visuals/reflection-grid-svg');
const coordinateGridShared = require('../../shared/visuals/coordinate-grid-svg');
const translationShapeShared = require('../../shared/visuals/translation-shape-svg');
const tallyChartShared = require('../../shared/visuals/tally-chart-svg');
const pictogramShared = require('../../shared/visuals/pictogram-svg');
const barChartShared = require('../../shared/visuals/bar-chart-svg');
const lineGraphShared = require('../../shared/visuals/line-graph-svg');
const barModelShared = require('../../shared/visuals/bar-model-svg');
const gridMapShared = require('../../shared/visuals/grid-map-svg');
const rainforestLayersShared = require('../../shared/visuals/rainforest-layers-svg');
const balancedPatternPlateShared = require('../../shared/visuals/balanced-pattern-plate-svg');
const placeValueChartShared = require('../../shared/visuals/place-value-chart-svg');
// The same strict circuit the slides and the sheets draw, so a wall card and
// the board show one circuit rather than two drawings of it.
const circuitShared = require('../../shared/visuals/circuit-diagram-svg');
const parachuteForcesShared = require('../../shared/visuals/parachute-forces-svg');
// One drawing each, the same the board, the sheet and the stick-in pack place.
// Until 13 September 2026 the wall drew its own clock (copied from the board's
// and grown colour-coded hands, a readout and a minute ring nobody else had),
// its own turn diagram, triangle-square puzzle, filled angle fan and comparison
// symbol, each on a square canvas that floated small in a table cell. The
// cards' older spellings (angleFan, comparisonSymbol) are read by the shared
// modules, so every card written for them still draws.
const clockShared = require('../../shared/visuals/clock-svg');
const turnDiagramShared = require('../../shared/visuals/turn-diagram-svg');
const triangleSquareShared = require('../../shared/visuals/triangle-square-svg');
const polygonShared = require('../../shared/visuals/polygon-svg');
const translationGridShared = require('../../shared/visuals/translation-grid-svg');
const areaGridShared = require('../../shared/visuals/area-grid-svg');
const comparisonShared = require('../../shared/visuals/comparison-svg');
// The annotation overlay (anchor → leader line → label) shared with the slides,
// worksheets and stick-in pack. The wall uses it to turn any drawn primitive
// into an "anatomy poster" reference card: the diagram children met on the board,
// with its parts called out and labelled in answer-green.
const { buildLabelDiagramSvg } = require('../../shared/visuals/label-diagram-svg');

// The base is embedded as a bitmap inside the composite, so it caps how sharp
// the diagram itself can be however large the composite is rendered. The side
// margins take 20% each, leaving the diagram 60% of the composite width, so the
// base wants to be at least that share of ANNOTATED_PX.
const ANNOTATED_BASE_PX = 1800;  // base primitive resolution before callouts overlay
const ANNOTATED_PX      = 2400;  // composite (diagram + callouts) resolution; bigger so labels stay crisp
const WALL_LABEL_GREEN  = '#00B050';  // house answer-green for finished callout labels

function toRad(deg) { return (deg * Math.PI) / 180; }

function fmt(n) {
  if (Math.abs(n - Math.round(n)) < 1e-6) return String(Math.round(n));
  return String(Math.round(n * 100) / 100);
}

function hashColour(c) {
  if (!c) return '#EF4444';
  return c.startsWith('#') ? c : `#${c}`;
}

// ─── Fraction circle ───────────────────────────────────────────────────
// A pie-style circle divided into `denominator` equal slices, the first
// `numerator` of them filled in `colour`. Slices start at 12 o'clock so the
// shape reads naturally (the same orientation as the Twinkl FDP poster).
// `denominator` of 1 renders as a single fully-filled circle (whole). Slices
// always carry a black outline so empty wedges read as wedges, not as gaps.
function fractionCircleSvg(spec, sizePx = RENDER_PX) {
  const numerator = Number(spec.numerator) || 0;
  const denominator = Math.max(1, Number(spec.denominator) || 1);
  const colour = hashColour(spec.colour || 'EF4444');
  const cx = sizePx / 2;
  const cy = sizePx / 2;
  const pad = 26;
  const r = sizePx / 2 - pad;

  const parts = [];

  if (denominator === 1) {
    const fill = numerator >= 1 ? colour : '#FFFFFF';
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="#000000" stroke-width="3"/>`);
  } else {
    const sliceAngle = 360 / denominator;
    for (let i = 0; i < denominator; i++) {
      const startDeg = i * sliceAngle - 90;
      const endDeg = (i + 1) * sliceAngle - 90;
      const sRad = toRad(startDeg);
      const eRad = toRad(endDeg);
      const x1 = fmt(cx + r * Math.cos(sRad));
      const y1 = fmt(cy + r * Math.sin(sRad));
      const x2 = fmt(cx + r * Math.cos(eRad));
      const y2 = fmt(cy + r * Math.sin(eRad));
      const largeArc = sliceAngle > 180 ? 1 : 0;
      const fill = i < numerator ? colour : '#FFFFFF';
      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      parts.push(`<path d="${path}" fill="${fill}" stroke="#000000" stroke-width="3"/>`);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 ${sizePx} ${sizePx}">${parts.join('')}</svg>`;
}

function fractionCircleKey(spec) {
  const numerator = Number(spec.numerator) || 0;
  const denominator = Math.max(1, Number(spec.denominator) || 1);
  const colour = (spec.colour || 'EF4444').replace(/^#/, '');
  return `fractionCircle:${numerator}/${denominator}:${colour}`;
}

// ─── Number line ────────────────────────────────────────────────────────
// The one shared number line (shared/visuals/number-line-svg.js), the same
// drawing the board, the sheet and the stick-in pack place. The wall drew its
// own in bold Arial with a red dot until 13 September 2026, and a Year 4 card
// looked nothing like the slides beside it. The card's `from / to / step /
// marks` spelling is read by the shared module, so cards written for the old
// drawing still draw.
// The one way the wall places a shared drawing laid out at its printed size:
// a key and a drawing function in the wall's profile, at the width a wide wall
// visual prints across a card. Any picture moved into shared/visuals/ reaches
// the wall through this.
const WALL_VISUAL_WIDTH_MM = 180;
function sharedAtWidth(module, widthMm = WALL_VISUAL_WIDTH_MM) {
  const profile = () => profileFor('wall', { widthMm });
  return {
    keyFn: (spec) => module.cacheKey(spec, profile()),
    tightFn: (spec) => {
      const { svg, aspect } = module.tightSvg(spec, profile());
      return { svg, aspect };
    },
  };
}

const numberLineWall = sharedAtWidth(numberLineShared);
const clockWall = sharedAtWidth(clockShared);
const turnDiagramWall = sharedAtWidth(turnDiagramShared);
const triangleSquareWall = sharedAtWidth(triangleSquareShared);
const polygonWall = sharedAtWidth(polygonShared);
const translationGridWall = sharedAtWidth(translationGridShared);
const areaGridWall = sharedAtWidth(areaGridShared);
const comparisonWall = sharedAtWidth(comparisonShared);
// The angle a wall card fills and labels with its size: the shared angle.
const angleFanWall = sharedAtWidth(angleShared);
const numberLineTight = numberLineWall.tightFn;
const numberLineKey = numberLineWall.keyFn;
const numberLineSvg = (spec) => numberLineTight(spec).svg;

// ─── Fraction bar ──────────────────────────────────────────────────────
// A horizontal rectangle divided into `denominator` equal vertical strips,
// the first `numerator` of them filled. Singapore-style bar model. Sits at
// vertical centre on a square canvas (whitespace above/below) so the
// image transform stays square — same approach as the number line.
function fractionBarSvg(spec, sizePx = RENDER_PX) {
  const numerator = Number(spec.numerator) || 0;
  const denominator = Math.max(1, Number(spec.denominator) || 1);
  const colour = hashColour(spec.colour || 'EF4444');
  const w = sizePx;
  const h = sizePx;
  const barW = w * 0.84;
  const barH = h * 0.30;
  const x0 = (w - barW) / 2;
  const y0 = (h - barH) / 2;
  const sliceW = barW / denominator;

  const parts = [];
  for (let i = 0; i < denominator; i++) {
    const sx = x0 + i * sliceW;
    const fill = i < numerator ? colour : '#FFFFFF';
    parts.push(`<rect x="${fmt(sx)}" y="${fmt(y0)}" width="${fmt(sliceW)}" height="${fmt(barH)}" fill="${fill}" stroke="#000000" stroke-width="3"/>`);
  }
  // Heavier outer outline so the bar reads as one shape, not as separate cells.
  parts.push(`<rect x="${fmt(x0)}" y="${fmt(y0)}" width="${fmt(barW)}" height="${fmt(barH)}" fill="none" stroke="#000000" stroke-width="4"/>`);

  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 ${sizePx} ${sizePx}">${parts.join('')}</svg>`;
}

function fractionBarKey(spec) {
  const numerator = Number(spec.numerator) || 0;
  const denominator = Math.max(1, Number(spec.denominator) || 1);
  const colour = (spec.colour || 'EF4444').replace(/^#/, '');
  return `fractionBar:${numerator}/${denominator}:${colour}`;
}

// ─── Step badge (green numbered oval, white digit) ──────────────────────
// Mirrors slide builder's drawSteps badge — green oval, white centred digit
// in a heavy bold sans face. Rendered crisp at any wall card size.
function badgeSvg(number, sizePx = BADGE_PX, fillColour = '00B050') {
  const cx = sizePx / 2;
  const cy = sizePx / 2;
  const r  = sizePx / 2 - 4;
  const fontSize = Math.round(sizePx * 0.55);
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 ${sizePx} ${sizePx}">`
    + `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#${fillColour}"/>`
    + `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-family="Arial Black, Arial, sans-serif" font-size="${fontSize}" font-weight="900" fill="#FFFFFF">${number}</text>`
    + `</svg>`;
}

function badgeKey(number, fillColour) {
  return `badge:${number}:${fillColour || '00B050'}`;
}

// ─── Annotated diagram (anatomy poster) ─────────────────────────────────
// A wall visual may carry a `callouts` array. When it does, the diagram is
// drawn first, then each callout points a leader line + arrowhead at a part of
// it and prints the part's name — the "parts of a pictogram" anatomy poster the
// teacher pins up so children read a diagram by recognising its parts. The
// overlay is the same shared geometry the slides and worksheets use, so the
// labelled wall version matches the board.
//
// A callout names where it points in one of two ways:
//   part   a named anchor the primitive exposes (a pictogram offers "title",
//          "key", "half", and each category label) — robust, because the
//          geometry resolves the exact pixel, so the arrow never drifts.
//   anchor a raw [x%, y%] of the diagram, for any primitive without named
//          anchors yet, or for a spot a named part doesn't cover.
// `label` is the printed name; `label_at` optionally places it; `given` defaults
// true because a wall reference card shows the finished labels, not blank lines.

// The suffix that distinguishes an annotated buffer from its plain base, so the
// pre-render and the card renderer agree on one storage key. Exported for
// render-card.js's pickVisual.
function calloutKeySuffix(visual) {
  return (visual && Array.isArray(visual.callouts) && visual.callouts.length)
    ? '|callouts:' + JSON.stringify(visual.callouts)
    : '';
}

// Resolve a named part to its [x%, y%] anchor. Top-level names (title, key,
// half) are checked first, then a category-row name, so "Monday" points at
// Monday's row. Returns null when the primitive exposes no anchor for that name.
function resolveAnchorPart(part, anchors) {
  if (!anchors || !part) return null;
  if (part === 'half-symbol') part = 'half';
  if (anchors[part] && Array.isArray(anchors[part])) return anchors[part];
  if (anchors.rows && anchors.rows[part]) return anchors.rows[part];
  return null;
}

// Turn the card's callouts into the overlay's callout shape, resolving named
// parts against the primitive's anchor map. Callouts whose anchor can't be
// resolved are dropped (rather than rendered in the wrong place), and the count
// is reported so a misnamed part surfaces in the build log instead of silently
// vanishing.
function resolveCallouts(callouts, anchors) {
  const out = [];
  let dropped = 0;
  for (const c of (callouts || [])) {
    let anchor = Array.isArray(c.anchor) ? c.anchor : resolveAnchorPart(c.part, anchors);
    if (!anchor) { dropped += 1; continue; }
    out.push({ anchor, label: c.label || '', label_at: c.label_at, given: c.given !== false });
  }
  return { callouts: out, dropped };
}

// Render a primitive, then overlay its callouts, returning { png, aspect } in the
// same shape the shared aspect-true primitives use so the card places it tight.
async function renderAnnotated(visual, prim, sharp) {
  let baseSvg, aspect, anchors = null;
  if (prim.tightFn) {
    const r = prim.tightFn(visual);
    baseSvg = r.svg; aspect = r.aspect; anchors = r.anchors || null;
  } else {
    baseSvg = prim.svgFn(visual, ANNOTATED_BASE_PX); aspect = 1;
  }

  const baseResize = aspect >= 1 ? { width: ANNOTATED_BASE_PX } : { height: ANNOTATED_BASE_PX };
  const basePng = await sharp(Buffer.from(baseSvg), { density: 144 }).resize(baseResize).png().toBuffer();
  const meta = await sharp(basePng).metadata();

  const { callouts, dropped } = resolveCallouts(visual.callouts, anchors);
  if (dropped > 0) {
    console.warn(
      `[working-wall] ${dropped} callout(s) on a "${visual.type}" anatomy poster could not be placed — ` +
      `name a part the primitive exposes (e.g. pictogram: title / key / half / a category label) or give a raw anchor [x%, y%].`
    );
  }

  const composed = buildLabelDiagramSvg({
    href: 'data:image/png;base64,' + basePng.toString('base64'),
    width: meta.width,
    height: meta.height,
    callouts,
    font: 'Comic Sans MS',
    // Side margins hold the stacked labels; keep them only as wide as the wrapped
    // labels need, so the chart itself stays large (the picture is the whole point
    // of a wall card, read from across the room). Slim top/bottom. Arrowheads green.
    marginXRatio: 0.20,
    marginYRatio: 0.02,
    layout: 'sides',
    labelMaxChars: 13,
    arrow: true,
    labelColour: WALL_LABEL_GREEN,
  });
  const resize = composed.aspect >= 1 ? { width: ANNOTATED_PX } : { height: ANNOTATED_PX };
  const png = await sharp(Buffer.from(composed.svg), { density: 144 }).resize(resize).png().toBuffer();
  return { png, aspect: composed.aspect };
}

// ─── Pre-render walker ──────────────────────────────────────────────────
// Walks the working-wall.json spec, collects every visual it finds and
// every numeric step badge it would need, renders the SVGs to PNG buffers via
// sharp, returns a map keyed by content.
//
// Failure policy: if any declared `visual` cannot render (sharp unavailable,
// SVG rendering errored), the build fails loudly. A wall card that promises
// a clock face but ships text-only is worse than no card at all — children
// glance from desk to wall expecting the picture and find a caption. Step
// badges are stylistic only (numbered green badges decorating worked-example
// steps) — they fall back silently to plain step labels if sharp is missing.
async function preRenderSvgs(spec) {
  const cards = Array.isArray(spec.cards) ? spec.cards : [];

  // Each visual type has its own (key → spec) collector and (key → buffer)
  // renderer. Adding a primitive = add an entry to PRIMITIVES below + an
  // entry to pickVisualBuffer in render-card.js.
  const PRIMITIVES = {
    clock:            { ...sharedAtWidth(clockShared), collected: {} },
    fractionCircle:   { keyFn: fractionCircleKey,   svgFn: fractionCircleSvg,   collected: {} },
    fractionBar:      { keyFn: fractionBarKey,      svgFn: fractionBarSvg,      collected: {} },
    numberLine:       { ...numberLineWall, collected: {} },
    angleFan:         { ...sharedAtWidth(angleShared), collected: {} },
    'turn-diagram':   { ...sharedAtWidth(turnDiagramShared), collected: {} },
    comparisonSymbol: { ...sharedAtWidth(comparisonShared), collected: {} },
    'comparison-slot': { ...sharedAtWidth(comparisonShared), collected: {} },
    'triangle-square': { ...sharedAtWidth(triangleSquareShared), collected: {} },
    polygon:          { ...sharedAtWidth(polygonShared), collected: {} },
    'translation-grid': { ...sharedAtWidth(translationGridShared), collected: {} },
    'area-grid':      { ...sharedAtWidth(areaGridShared), collected: {} },
    // Shared, aspect-true primitives: `tightFn` returns { svg, aspect } and the
    // pre-render stores both so the card can place the image at its real shape.
    'line-pair':      { keyFn: linePairShared.cacheKey, tightFn: linePairShared.tightSvg, collected: {} },
    angle:            { keyFn: angleShared.cacheKey,    tightFn: angleShared.tightSvg,    collected: {} },
    triangle:         { keyFn: triangleShared.cacheKey, tightFn: triangleShared.tightSvg, collected: {} },
    venn:             { keyFn: vennShared.cacheKey,     tightFn: vennShared.tightSvg,     collected: {} },
    carroll:          { keyFn: carrollShared.cacheKey,  tightFn: carrollShared.tightSvg,  collected: {} },
    geoboard:         { keyFn: geoboardShared.cacheKey, tightFn: geoboardShared.tightSvg, collected: {} },
    'reflection-grid': { keyFn: reflectionGridShared.cacheKey, tightFn: reflectionGridShared.tightSvg, collected: {} },
    'coordinate-grid': { keyFn: coordinateGridShared.cacheKey, tightFn: coordinateGridShared.tightSvg, collected: {} },
    'translation-shape': { keyFn: translationShapeShared.cacheKey, tightFn: translationShapeShared.tightSvg, collected: {} },
    'tally-chart':    { keyFn: tallyChartShared.cacheKey, tightFn: tallyChartShared.tightSvg, collected: {} },
    pictogram:        { keyFn: pictogramShared.cacheKey, tightFn: pictogramShared.tightSvg, collected: {} },
    'bar-chart':      { keyFn: barChartShared.cacheKey, tightFn: barChartShared.tightSvg, collected: {} },
    'line-graph':     { keyFn: lineGraphShared.cacheKey, tightFn: lineGraphShared.tightSvg, collected: {} },
    'bar-model':      { keyFn: barModelShared.cacheKey, tightFn: barModelShared.tightSvg, collected: {} },
    'grid-map':       { keyFn: gridMapShared.cacheKey, tightFn: gridMapShared.tightSvg, collected: {} },
    'rainforest-layers': { keyFn: rainforestLayersShared.cacheKey, tightFn: rainforestLayersShared.tightSvg, collected: {} },
    'balanced-pattern-plate': { keyFn: balancedPatternPlateShared.cacheKey, tightFn: balancedPatternPlateShared.tightSvg, collected: {} },
    'place-value-chart': { keyFn: placeValueChartShared.cacheKey, tightFn: placeValueChartShared.tightSvg, collected: {} },
    'circuit-diagram': { keyFn: circuitShared.cacheKey, tightFn: circuitShared.tightSvg, collected: {} },
    'parachute-forces': { keyFn: parachuteForcesShared.cacheKey, tightFn: parachuteForcesShared.tightSvg, collected: {} },
  };

  const badges = new Set();
  let visualsDeclared = 0;
  // Visuals carrying callouts get a second, annotated render (diagram + labels)
  // stored under the base key plus the callout suffix.
  const annotated = {};

  const collectVisual = (visual) => {
    if (!visual) return;
    if (visual._educationalSvgBuffer) return;
    visualsDeclared += 1;
    if (!PRIMITIVES[visual.type]) {
      throw new Error(`[working-wall] visual type "${visual.type}" is not a supported primitive. Supported: ${Object.keys(PRIMITIVES).join(', ')}.`);
    }
    const prim = PRIMITIVES[visual.type];
    const key = prim.keyFn(visual);
    if (!prim.collected[key]) prim.collected[key] = visual;
    const suffix = calloutKeySuffix(visual);
    if (suffix && !annotated[key + suffix]) annotated[key + suffix] = visual;
  };

  for (const card of cards) {
    if (card && card.visual) collectVisual(card.visual);
    if (card && card.type === 'equivalenceGrid' && Array.isArray(card.rows)) {
      for (const row of card.rows) {
        if (row && row.visual) collectVisual(row.visual);
      }
    }
    if (card && card.type === 'referenceTable' && Array.isArray(card.rows)) {
      // A reference-table cell may be a diagram instead of text — collect those
      // so each category row can carry its defining picture (the Twinkl
      // "Types of …" poster shape).
      for (const row of card.rows) {
        if (!Array.isArray(row)) continue;
        for (const cell of row) {
          if (cell && typeof cell === 'object' && cell.visual) collectVisual(cell.visual);
        }
      }
    }
    if (card && card.type === 'workedExample' && Array.isArray(card.items)) {
      // Only items with a numeric step number get a green badge — the
      // worked-example item itself stays as a labelled paragraph with no
      // badge (it's the model, not a step).
      let stepIdx = 0;
      for (const item of card.items) {
        const label = (item.label || '').toLowerCase();
        if (label.startsWith('step') || /^\d+\b/.test(label)) {
          stepIdx += 1;
          badges.add(stepIdx);
        }
      }
    }
  }

  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    if (visualsDeclared > 0) {
      throw new Error(
        `[working-wall] sharp is not installed but ${visualsDeclared} card visual(s) were declared. ` +
        `Run \`npm install\` inside the working-wall-html folder so sharp is available, then rebuild. ` +
        `A wall card that promised a picture but shipped text-only fails the desk-glance test.`
      );
    }
    console.warn('[working-wall] sharp unavailable — step badges will render as plain labels (no card visuals were declared).');
    return {};
  }

  const map = {};

  for (const prim of Object.values(PRIMITIVES)) {
    for (const [key, primSpec] of Object.entries(prim.collected)) {
      try {
        if (prim.tightFn) {
          // Shared aspect-true primitive: render at its real proportions and
          // store { png, aspect } so the card places it tight (no square pad).
          const { svg, aspect } = prim.tightFn(primSpec);
          const resize = aspect >= 1 ? { width: RENDER_OUT_PX } : { height: RENDER_OUT_PX };
          // Density has to rise with the target: sharp rasterises the SVG at its
          // intrinsic size scaled by density and only then resizes, so leaving it
          // behind would upscale a small bitmap and cost the sharpness the bigger
          // target was for.
          const png = await sharp(Buffer.from(svg), { density: 144 * RENDER_SCALE })
            .resize(resize)
            .png()
            .toBuffer();
          map[key] = { png, aspect };
        } else {
          // The drawing is still authored on the 600-unit canvas; only the raster
          // it is baked into is larger.
          const svg = prim.svgFn(primSpec, RENDER_PX);
          map[key] = await sharp(Buffer.from(svg), { density: 72 * RENDER_SCALE })
            .resize({ width: RENDER_OUT_PX })
            .png()
            .toBuffer();
        }
      } catch (e) {
        throw new Error(`[working-wall] failed to render visual "${primSpec.type}" (${key}): ${e.message}`);
      }
    }
  }

  // Annotated composites (diagram + callouts). Rendered after the bases so the
  // same failure policy applies: a promised anatomy poster that can't render
  // fails the build loudly rather than shipping a card with no labels.
  for (const [akey, visual] of Object.entries(annotated)) {
    try {
      map[akey] = await renderAnnotated(visual, PRIMITIVES[visual.type], sharp);
    } catch (e) {
      throw new Error(`[working-wall] failed to render annotated visual "${visual.type}" (${akey}): ${e.message}`);
    }
  }

  for (const number of badges) {
    try {
      const svg = badgeSvg(number, BADGE_PX);
      map[badgeKey(number)] = await sharp(Buffer.from(svg), { density: 72 })
        .resize({ width: BADGE_PX })
        .png()
        .toBuffer();
    } catch (e) {
      // Step badges are stylistic — fall back silently to plain step labels.
    }
  }

  return map;
}

module.exports = {
  clockKey: clockWall.keyFn,
  fractionCircleSvg,
  fractionCircleKey,
  fractionBarSvg,
  fractionBarKey,
  numberLineSvg,
  numberLineTight,
  numberLineKey,
  angleFanKey: angleFanWall.keyFn,
  turnDiagramKey: turnDiagramWall.keyFn,
  comparisonKey: comparisonWall.keyFn,
  triangleSquareKey: triangleSquareWall.keyFn,
  polygonKey: polygonWall.keyFn,
  translationGridKey: translationGridWall.keyFn,
  areaGridKey: areaGridWall.keyFn,
  linePairKey: linePairShared.cacheKey,
  angleKey: angleShared.cacheKey,
  triangleKey: triangleShared.cacheKey,
  vennKey: vennShared.cacheKey,
  carrollKey: carrollShared.cacheKey,
  geoboardKey: geoboardShared.cacheKey,
  reflectionGridKey: reflectionGridShared.cacheKey,
  coordinateGridKey: coordinateGridShared.cacheKey,
  translationShapeKey: translationShapeShared.cacheKey,
  tallyChartKey: tallyChartShared.cacheKey,
  pictogramKey: pictogramShared.cacheKey,
  barChartKey: barChartShared.cacheKey,
  lineGraphKey: lineGraphShared.cacheKey,
  barModelKey: barModelShared.cacheKey,
  gridMapKey: gridMapShared.cacheKey,
  rainforestLayersKey: rainforestLayersShared.cacheKey,
  balancedPatternPlateKey: balancedPatternPlateShared.cacheKey,
  balancedPatternPlateTightSvg: balancedPatternPlateShared.tightSvg,
  placeValueChartKey: placeValueChartShared.cacheKey,
  circuitDiagramKey: circuitShared.cacheKey,
  parachuteForcesKey: parachuteForcesShared.cacheKey,
  badgeSvg,
  badgeKey,
  calloutKeySuffix,
  preRenderSvgs,
};
