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
const { withoutTaughtMarks } = require('../../shared/text/criteria-marks');
const linePairShared = require('../../shared/visuals/line-pair-svg');
const numberLineShared = require('../../shared/visuals/number-line-svg');
const shadedFractionShared = require('../../shared/visuals/shaded-fraction-svg');
const fractionWallShared = require('../../shared/visuals/fraction-wall-svg');
const moneyShared = require('../../shared/visuals/money-svg');
// The one shared map. The wall could not draw a map at all until 13 September
// 2026, so a Year 4 wall designer left where the Amazon is off the wall.
const mapShared = require('../../shared/visuals/map-svg');
const dialScaleShared = require('../../shared/visuals/dial-scale-svg');
const measuringJugShared = require('../../shared/visuals/measuring-jug-svg');
const rulerShared = require('../../shared/visuals/ruler-svg');
const timelineShared = require('../../shared/visuals/timeline-svg');
const processChainShared = require('../../shared/visuals/process-chain-svg');
const classificationKeyShared = require('../../shared/visuals/classification-key-svg');
const conceptMapShared = require('../../shared/visuals/concept-map-svg');
const annotatedTextShared = require('../../shared/visuals/annotated-text-svg');
const fishboneShared = require('../../shared/visuals/fishbone-svg');
const continuumLineShared = require('../../shared/visuals/continuum-line-svg');
const sourcePathwayShared = require('../../shared/visuals/source-pathway-svg');
const numberNetworkShared = require('../../shared/visuals/number-network-svg');
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
const placeValueMiniShared = require('../../shared/visuals/place-value-mini-svg');
const baseTenBlocksShared = require('../../shared/visuals/base-ten-blocks-svg');
const counterGroupShared = require('../../shared/visuals/counter-group-svg');
const partWholeModelShared = require('../../shared/visuals/part-whole-model-svg');
const pyramidShared = require('../../shared/visuals/pyramid-svg');
const multGridShared = require('../../shared/visuals/mult-grid-svg');
const digitCardsShared = require('../../shared/visuals/digit-cards-svg');
// The same strict circuit the slides and the sheets draw, so a wall card and
// the board show one circuit rather than two drawings of it.
const circuitShared = require('../../shared/visuals/circuit-diagram-svg');
const parachuteForcesShared = require('../../shared/visuals/parachute-forces-svg');
const blankSurfaceShared = require('../../shared/visuals/blank-surface-svg');
const circuitSymbolBankShared = require('../../shared/visuals/circuit-symbol-bank-svg');
// A labelled photograph: the same picture, and the same poster rules, the slide
// uses. Its picture is read from the card's imagePath before it is drawn.
const labelDiagramShared = require('../../shared/visuals/label-diagram-svg');
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
const { stepVisual } = require('./step-colours');
const { isNoteCallout, noteCalloutsSvg } = require('./note-callouts');

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
//
// A drawing that names its parts (`anchors`, as the charts and the pictogram
// do) hands them on, because a labelledDiagram card points its callouts at
// those parts. Without them every named callout on an anatomy poster would be
// dropped.
const WALL_VISUAL_WIDTH_MM = 180;
// `widthMm` may instead be a whole box ({ widthMm, heightMm, overrides }) for a
// drawing that fills a known height as well as a width, or a function of the
// spec returning one, for a drawing whose box depends on its card.
function sharedAtWidth(module, widthMm = WALL_VISUAL_WIDTH_MM) {
  const boxFor = typeof widthMm === 'function' ? widthMm : () => (typeof widthMm === 'object' ? widthMm : { widthMm });
  const profile = (spec) => profileFor('wall', boxFor(spec));
  return {
    keyFn: (spec) => module.cacheKey(spec, profile(spec)),
    tightFn: (spec) => {
      const { svg, aspect, anchors } = module.tightSvg(spec, profile(spec));
      return anchors ? { svg, aspect, anchors } : { svg, aspect };
    },
  };
}

const numberLineWall = sharedAtWidth(numberLineShared);

// ─── Fractions and money ───────────────────────────────────────────────
// The shared shaded fraction, fraction wall and coins, the same drawings the
// board, the sheet and the stick-in pack place. The wall drew its own red
// circle and red bar on a square canvas until 13 September 2026, so a quarter
// shaded soft green on the board was red on the card beside it. A card's
// `fractionCircle` and `fractionBar` ({ numerator, denominator, colour })
// are read by the shared drawing, so cards written for the old ones still draw.
const shadedFractionWall = sharedAtWidth(shadedFractionShared);
const fractionWallWall = sharedAtWidth(fractionWallShared);
const moneyWall = sharedAtWidth(moneyShared);
const fractionCircleKey = shadedFractionWall.keyFn;
const fractionBarKey = shadedFractionWall.keyFn;
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
const mapWall = sharedAtWidth(mapShared);

// The measuring scales and the thinking diagrams, each the one shared drawing
// the board places (13 September 2026). A diagram full of words is laid out
// wider than the default so its words keep the wall's size; the card then
// places the picture by its shape.
const dialScaleWall = sharedAtWidth(dialScaleShared, 150);
const measuringJugWall = sharedAtWidth(measuringJugShared, 120);
const rulerWall = sharedAtWidth(rulerShared, 180);
const timelineWall = sharedAtWidth(timelineShared, 260);
const processChainWall = sharedAtWidth(processChainShared, 360);
const classificationKeyWall = sharedAtWidth(classificationKeyShared, 260);
const conceptMapWall = sharedAtWidth(conceptMapShared, 260);
// A model text is read from across the room, so it is laid out in the box its
// card actually gives it, and its words grow until the passage fills that box.
// Laid out by width alone, a short wide passage printed small with most of its
// space empty (2 October 2026). The box depends on the card (portrait or
// landscape, the picture `full` or `dominant`), so the pre-render stamps it on
// the spec as `_wallBox` before the drawing is keyed or drawn.
const ANNOTATED_TEXT_BOXES = {
  'full:landscape': { widthMm: 360, heightMm: 170 },
  'full:portrait': { widthMm: 255, heightMm: 300 },
  'dominant:landscape': { widthMm: 247, heightMm: 190 },
  'dominant:portrait': { widthMm: 185, heightMm: 320 },
};
function annotatedTextBoxFor(card) {
  const orientation = (card && card.page && card.page.orientation) === 'portrait' ? 'portrait' : 'landscape';
  const box = ANNOTATED_TEXT_BOXES[`${(card && card.visualScale) || 'panel'}:${orientation}`];
  return box ? { ...box, overrides: { grow: 2 } } : { widthMm: WALL_VISUAL_WIDTH_MM };
}
const annotatedTextWall = sharedAtWidth(annotatedTextShared, (spec) => spec._wallBox || annotatedTextBoxFor(null));
const fishboneWall = sharedAtWidth(fishboneShared, 260);
const continuumLineWall = sharedAtWidth(continuumLineShared, 260);
const sourcePathwayWall = sharedAtWidth(sourcePathwayShared, 260);
const numberNetworkWall = sharedAtWidth(numberNetworkShared, 150);
// The place value family, each the one drawing the board and the sheet place
// too (13 September 2026), laid out at the width a wide wall visual prints.
// A before-and-after pair with counters is the exception: two charts of
// counters and the arrow between them cannot be read at the width one chart
// is, so it is laid out as the picture of a whole landscape sheet (the 360mm a
// `full` picture prints across, no deeper than the sheet has under its title),
// with the arrow narrow and the columns wide (the shared drawing says why).
// Laid out at the default width it was refused on every card it was tried on
// (6 October 2026). figure-size.js refuses it on any card that prints it much
// smaller than it was laid out.
const COUNTER_PAIR_BOX = {
  widthMm: 360,
  overrides: { pairArrow: 'narrow', pairExchangeMarks: true, pairMaxHeightPt: (165 * 72) / 25.4 },
};
const isCounterPair = (spec) => Boolean(spec && spec.type === 'place-value-chart' && spec.pair && spec.pair.counters);
const placeValueChartWall = sharedAtWidth(placeValueChartShared, (spec) => (isCounterPair(spec) ? COUNTER_PAIR_BOX : { widthMm: WALL_VISUAL_WIDTH_MM }));
const placeValueMiniWall = sharedAtWidth(placeValueMiniShared);
const baseTenBlocksWall = sharedAtWidth(baseTenBlocksShared);
const counterGroupWall = sharedAtWidth(counterGroupShared);
const partWholeModelWall = sharedAtWidth(partWholeModelShared);
const pyramidWall = sharedAtWidth(pyramidShared);
const multGridWall = sharedAtWidth(multGridShared);
// A number as digit cards with its working beneath, laid out at the width a
// dominant card figure gets, so four cards with + between them and two checks
// side by side keep the wall's text size; the card places it by its shape.
const digitCardsWall = sharedAtWidth(digitCardsShared, 240);
// The bar chart and the line graph, laid out at their printed size as the
// board, the sheet and the stick-in pack place them. The wall's words print
// far larger than paper's, so at the default width a chart came out nearly
// square where the sheet's is wide. Laid out wider, the words take the same
// share of the chart as they do on paper and the chart keeps its proportions;
// the card still places the picture by its shape.
const WALL_CHART_WIDTH_MM = 300;
const barChartWall = sharedAtWidth(barChartShared, WALL_CHART_WIDTH_MM);
const lineGraphWall = sharedAtWidth(lineGraphShared, WALL_CHART_WIDTH_MM);



// ─── A size refusal, in the wall's terms ────────────────────────────────
// A shared drawing that will not fit says what to do about it on the board:
// "give it a full-width zone", "its own slide". Neither exists here. The wall
// lays a place value chart out at a width fixed by the kind of chart (see
// COUNTER_PAIR_BOX) and scales the picture into its card afterwards, so no
// card type, orientation or visualScale changes what the drawing was given. A
// Year 4 wall designer met the board's advice for a before-and-after pair with
// counters, tried a section in landscape, the same in portrait and a
// full-picture card of its own, got the same words three times, and left the
// counters off the wall (6 October 2026). The pair with counters now has a
// sheet's width to be drawn in, so it is refused here only when it cannot be
// read even at that size; the refusal keeps its code and says what works on a
// wall.
const PAIR_SIZE_REFUSAL = /^(PLACE_VALUE_CHART_DOES_NOT_FIT|PLACE_VALUE_COUNTERS_TOO_SMALL)/;
function wallAdviceFor(spec, message) {
  const text = String(message);
  const code = PAIR_SIZE_REFUSAL.exec(text);
  if (!code || !spec || spec.type !== 'place-value-chart' || !spec.pair) return text;
  if (spec.pair.counters) {
    return `${code[1]}: the wall already draws this before-and-after pair as the picture of a whole landscape sheet, and its counters still cannot be counted at that size ` +
      '(too many counters in one column, or too many columns). The card type, the orientation and `visualScale` do not change the size it is drawn at, so the same pair will be refused on any card. ' +
      'Draw the model as one chart per step instead: a `stepByStep` sheet whose steps each carry an ordinary chart with a `counters` row ' +
      '(the chart before the change, then the chart after it), with the written `calculation` as the last step and the words from the arrow as the `key` of each step. ' +
      'Each chart then has a picture to itself, so its counters print large enough to count.';
  }
  const fixed =
    `${code[1]}: the wall draws a place value chart at one fixed size, and this before-and-after pair is too wide for it. ` +
    'The card type, the orientation and `visualScale` do not change that size, so the same pair will be refused on any card. ';
  return fixed +
    'Shorten the `operation` words on the arrow, or use the `rows` form: the starting number above the result, with `highlight` ringing the digit that changed.';
}

// ─── Step badge (green circle, white digit) ─────────────────────────────
// Mirrors slide builder's drawSteps badge: a green circle with a white centred
// digit, in the wall's own title font so the number matches the words beside it.
//
// The digit is placed by its baseline, not by dominant-baseline="central". The
// badge is rasterised through sharp, and the SVG library in the pinned sharp
// (0.33.5) ignores that attribute (0.34 honours it),
// so the baseline landed on the centre line and every digit sat in the top half
// of its circle (a teacher's report, 29 September 2026). A digit inks from its
// baseline to about three-quarters of the font size above it (0.73-0.76 em in
// Comic Sans and Arial Black alike), so dropping the baseline by DIGIT_HALF_EM
// of the font size centres the ink whichever of the two fonts is found.
const WALL_TITLE_FONT = require('../style.json').fonts.title;
const DIGIT_HALF_EM = 0.375;
function badgeSvg(number, sizePx = BADGE_PX, fillColour = '00B050') {
  const cx = sizePx / 2;
  const cy = sizePx / 2;
  const r  = sizePx / 2 - 4;
  const fontSize = Math.round(sizePx * 0.55);
  const baseline = Math.round(cy + fontSize * DIGIT_HALF_EM);
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 ${sizePx} ${sizePx}">`
    + `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#${fillColour}"/>`
    + `<text x="${cx}" y="${baseline}" text-anchor="middle" font-family="${WALL_TITLE_FONT}, Arial Black, Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="#FFFFFF">${number}</text>`
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
  // A labelled diagram's callouts are its own picture, drawn by its own
  // drawing, not an overlay laid on top of it.
  if (visual && visual.type === 'label-diagram') return '';
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
    if (isStepCallout(c)) continue;
    let anchor = Array.isArray(c.anchor) ? c.anchor : resolveAnchorPart(c.part, anchors);
    if (!anchor) { dropped += 1; continue; }
    out.push({ anchor, label: c.label || '', label_at: c.label_at, given: c.given !== false });
  }
  return { callouts: out, dropped };
}

// ─── Step numbers pinned on a picture ───────────────────────────────────
// A callout carrying `step` (a whole number) is not a word label. It prints a
// worked example's step number in a green circle ON the picture, at the place
// that step happens: step 4's circle on the +2 jump, so the teacher can point
// at the jump and a child can match it to step 4 in the list below. It sits on
// the drawing itself, with no leader line, because the point is that the step
// and the place are one thing.
//
// It names its place the way a label callout does: `part`, a spot the drawing
// names (a number line names "jump 1", "jump 2"... beside each jump's label),
// or `anchor: [x%, y%]`. A named spot may carry its own circle size as a third
// number; a raw anchor gets STEP_MARKER_SHARE of the drawing's shorter side.
// A step that cannot be placed stops the build, because a number the list
// promises and the picture never shows is exactly the mismatch this is for.
const STEP_MARKER_SHARE = 0.11;
const OUTSIDE_MARKER_SHARE = 0.078;
function isStepCallout(c) {
  return Boolean(c) && Number.isInteger(c.step) && c.step > 0;
}

// A drawing whose places are already full of writing (a column sum: every cell
// holds a digit) names them as things to POINT AT (`anchors.pointAt`, each the
// box of what is written there). A step circle dropped on such a grid covers a
// digit or lands on the line between two and points at nothing, which is what
// the teacher took down on 5 October 2026. So here the circle stands outside
// the drawing, on the side nearest its place, and an arrow runs from it to stop
// just short of the ink.
function pointAtFor(part, anchors) {
  const places = anchors && anchors.pointAt;
  return places && part && Array.isArray(places[part]) ? places[part] : null;
}

function stepMarkersSvg(callouts, anchors, width, height, baseHref) {
  const gap = Math.min(width, height) * 0.01;
  // A circle outside the grid is a label, not part of the picture, so it is
  // well under a row of digits tall and its arrow is a thin line: at the size
  // of a circle drawn on a picture, five of them outweighed the sum itself
  // ("the circles are too big, some feel close together", 5 October 2026).
  const standOff = Math.min(width, height) * OUTSIDE_MARKER_SHARE;
  const named = anchors && anchors.pointAt ? Object.keys(anchors.pointAt) : [];
  const markers = callouts.map((c) => {
    if (named.length) {
      const box = pointAtFor(c.part, anchors);
      if (!box) {
        throw new Error(
          `step ${c.step} is pinned to ${c.part ? `"${c.part}"` : 'a spot given by numbers'}, but this drawing's places are named, ` +
          `so the circle can stand outside it and point. Give \`part\` one of: ${named.join(', ')}.`
        );
      }
      return {
        step: c.step, r: standOff, outside: true, part: c.part,
        tx: (box[0] / 100) * width, ty: (box[1] / 100) * height,
        halfW: (box[2] / 100) * width, halfH: (box[3] / 100) * height,
      };
    }
    const anchor = Array.isArray(c.anchor) ? c.anchor : resolveAnchorPart(c.part, anchors);
    if (!anchor) {
      throw new Error(
        `step ${c.step} is pinned to ${c.part ? `"${c.part}"` : 'no place'}, which this drawing does not name. ` +
        'Name a part the drawing exposes (a number line names "jump 1", "jump 2"...) or give anchor: [x%, y%].'
      );
    }
    const r = Number.isFinite(anchor[2]) ? (anchor[2] / 100) * height : Math.min(width, height) * STEP_MARKER_SHARE;
    const cx = Math.min(Math.max((anchor[0] / 100) * width, r), width - r);
    return { step: c.step, r, cx, cy: (anchor[1] / 100) * height };
  });
  // Two circles that would touch: the later one (left to right) rises clear of
  // the earlier, so neither number is hidden.
  markers.filter((m) => !m.outside).sort((a, b) => a.cx - b.cx).forEach((m, i, sorted) => {
    for (let k = 0; k < i; k += 1) {
      const o = sorted[k];
      const need = m.r + o.r + gap;
      if (Math.abs(m.cx - o.cx) < need && Math.abs(m.cy - o.cy) < need) m.cy = o.cy - need;
    }
  });
  // A circle standing outside sits an arrow's length from the drawing's edge,
  // on the nearest side that gives its arrow a clear run: level with its place
  // if it can be, slid along the edge when a straight arrow would cross what is
  // written in another place (the carried 1 under the tens answer) or the
  // circle would touch one already standing there.
  const reach = standOff * 1.7;
  const apart = (o, m) => o.r + m.r + Math.max(o.r, m.r) * 1.6;
  const written = named
    .map((name) => ({ name, box: anchors.pointAt[name] }))
    .filter((p) => p.box[4] !== 0)
    .map((p) => ({ name: p.name, cx: (p.box[0] / 100) * width, cy: (p.box[1] / 100) * height, halfW: (p.box[2] / 100) * width, halfH: (p.box[3] / 100) * height }));
  const crosses = (x1, y1, x2, y2, o, pad) => {
    // Does the line from (x1, y1) to (x2, y2) pass through the padded box?
    let t0 = 0;
    let t1 = 1;
    const clip = (d, lo, hi, from) => {
      if (Math.abs(d) < 1e-9) return from >= lo && from <= hi;
      const a = (lo - from) / d;
      const b = (hi - from) / d;
      t0 = Math.max(t0, Math.min(a, b));
      t1 = Math.min(t1, Math.max(a, b));
      return t0 <= t1;
    };
    return clip(x2 - x1, o.cx - o.halfW - pad, o.cx + o.halfW + pad, x1) && clip(y2 - y1, o.cy - o.halfH - pad, o.cy + o.halfH + pad, y1);
  };
  const placed = [];
  const spotsFor = (m) => {
    const sides = [['left', m.tx], ['right', width - m.tx], ['top', m.ty], ['bottom', height - m.ty]].sort((p, q) => p[1] - q[1]);
    const spots = [];
    sides.forEach(([side]) => {
      [0, 1, -1, 2, -2, 3, -3].forEach((k) => {
        const slide = k * m.r * 1.8;
        spots.push({
          level: k === 0,
          cx: side === 'left' ? -reach - m.r : side === 'right' ? width + reach + m.r : m.tx + slide,
          cy: side === 'top' ? -reach - m.r : side === 'bottom' ? height + reach + m.r : m.ty + slide,
        });
      });
    });
    return spots;
  };
  const roomy = (m, s) => placed.every((o) => Math.hypot(o.cx - s.cx, o.cy - s.cy) >= apart(o, m));
  const offInk = (m, s) => written.every((o) => o.name === m.part || !crosses(s.cx, s.cy, m.tx, m.ty, o, m.r * 0.35));
  const stand = (m, spot) => { m.cx = spot.cx; m.cy = spot.cy; placed.push(m); };
  // Those with a straight, clear run from their nearest side stand first, so a
  // circle that has to slide moves round them and not the other way about.
  const waiting = [];
  markers.filter((m) => m.outside).forEach((m) => {
    const straight = spotsFor(m)[0];
    if (offInk(m, straight) && roomy(m, straight)) stand(m, straight);
    else waiting.push(m);
  });
  waiting.forEach((m) => {
    const spots = spotsFor(m);
    stand(m, spots.find((s) => roomy(m, s) && offInk(m, s)) || spots.find((s) => roomy(m, s)) || spots[0]);
  });
  // A spot beyond the drawing's edge grows the canvas that way rather than
  // being pushed back onto what it sits beside. The two sides grow together,
  // so a drawing with circles down one side still sits in the middle of its card.
  const top = Math.max(0, ...markers.map((m) => m.r + gap - m.cy));
  const bottom = Math.max(0, ...markers.map((m) => m.cy + m.r + gap - height));
  const side = Math.max(0, ...markers.map((m) => Math.max(m.r + gap - m.cx, m.cx + m.r + gap - width)));
  const fullW = width + 2 * side;
  const fullH = height + top + bottom;
  const n = (v) => v.toFixed(1);
  const arrows = markers.filter((m) => m.outside).map((m) => {
    // From the circle's edge towards the middle of what is written, stopping
    // where the line meets the writing's box, a little short of it.
    const dx = m.tx - m.cx;
    const dy = m.ty - m.cy;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const clear = m.r * 0.25;
    const inside = Math.min(
      Math.abs(ux) > 1e-6 ? (m.halfW + clear) / Math.abs(ux) : Infinity,
      Math.abs(uy) > 1e-6 ? (m.halfH + clear) / Math.abs(uy) : Infinity
    );
    const head = m.r * 0.7;
    const x1 = m.cx + ux * m.r + side;
    const y1 = m.cy + uy * m.r + top;
    const x2 = m.tx - ux * inside + side;
    const y2 = m.ty - uy * inside + top;
    const bx = x2 - ux * head;
    const by = y2 - uy * head;
    const wing = head * 0.42;
    return `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(bx)}" y2="${n(by)}" stroke="${WALL_LABEL_GREEN}" stroke-width="${n(m.r * 0.17)}" stroke-linecap="round"/>` +
      `<polygon points="${n(x2)},${n(y2)} ${n(bx - uy * wing)},${n(by + ux * wing)} ${n(bx + uy * wing)},${n(by - ux * wing)}" fill="${WALL_LABEL_GREEN}"/>`;
  });
  const circles = markers.map((m) => {
    const cx = m.cx + side;
    const cy = m.cy + top;
    const pt = m.r * 1.1;
    return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(m.r)}" fill="${WALL_LABEL_GREEN}"/>` +
      `<text x="${n(cx)}" y="${n(cy + pt * DIGIT_HALF_EM)}" text-anchor="middle" ` +
      `font-family="${WALL_TITLE_FONT}, Arial Black, Arial, sans-serif" font-size="${n(pt)}" font-weight="bold" fill="#FFFFFF">${m.step}</text>`;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${Math.ceil(fullW)}" height="${Math.ceil(fullH)}" viewBox="0 0 ${Math.ceil(fullW)} ${Math.ceil(fullH)}">` +
    `<image href="${baseHref}" xlink:href="${baseHref}" x="${n(side)}" y="${n(top)}" width="${width}" height="${height}"/>` +
    arrows.join('') + circles.join('') + `</svg>`;
  return { svg, width: Math.ceil(fullW), height: Math.ceil(fullH) };
}

// Render a primitive, then overlay its callouts, returning { png, aspect } in the
// same shape the shared aspect-true primitives use so the card places it tight.
// Step numbers go on first, onto the drawing itself, so any word labels are
// then laid around a picture that already carries them.
async function renderAnnotated(visual, prim, sharp) {
  let baseSvg, aspect, anchors = null;
  if (prim.tightFn) {
    const r = prim.tightFn(visual);
    baseSvg = r.svg; aspect = r.aspect; anchors = r.anchors || null;
  } else {
    baseSvg = prim.svgFn(visual, ANNOTATED_BASE_PX); aspect = 1;
  }

  const baseResize = aspect >= 1 ? { width: ANNOTATED_BASE_PX } : { height: ANNOTATED_BASE_PX };
  let basePng = await sharp(Buffer.from(baseSvg), { density: 144 }).resize(baseResize).png().toBuffer();
  const meta = await sharp(basePng).metadata();

  // A note ringing one place and pointing at it (note-callouts.js). It is the
  // drawing's only kind of pointer when it has one: step circles or word labels
  // laid out afterwards would be placed against a canvas the notes had moved.
  const notes = (visual.callouts || []).filter(isNoteCallout);
  if (notes.length) {
    if (notes.length !== visual.callouts.length) {
      throw new Error('a drawing carries notes or step circles or word labels, one kind only; this one mixes a note with another.');
    }
    const noted = noteCalloutsSvg(notes, anchors, meta.width, meta.height, 'data:image/png;base64,' + basePng.toString('base64'), WALL_TITLE_FONT);
    const png = await sharp(Buffer.from(noted.svg)).resize(noted.width >= noted.height ? { width: ANNOTATED_PX } : { height: ANNOTATED_PX }).png().toBuffer();
    return { png, aspect: noted.width / noted.height };
  }

  const steps = (visual.callouts || []).filter(isStepCallout);
  if (steps.length) {
    const marked = stepMarkersSvg(steps, anchors, meta.width, meta.height, 'data:image/png;base64,' + basePng.toString('base64'));
    basePng = await sharp(Buffer.from(marked.svg)).png().toBuffer();
    meta.width = marked.width;
    meta.height = marked.height;
    if (steps.length === visual.callouts.length) {
      const png = await sharp(basePng).resize(meta.width >= meta.height ? { width: ANNOTATED_PX } : { height: ANNOTATED_PX }).png().toBuffer();
      return { png, aspect: meta.width / meta.height };
    }
  }

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
async function preRenderSvgs(spec, specDir) {
  const cards = Array.isArray(spec.cards) ? spec.cards : [];

  // Each visual type has its own (key → spec) collector and (key → buffer)
  // renderer. Adding a primitive = add an entry to PRIMITIVES below + an
  // entry to pickVisualBuffer in render-card.js.
  const PRIMITIVES = {
    clock:            { ...sharedAtWidth(clockShared), collected: {} },
    fractionCircle:   { ...sharedAtWidth(shadedFractionShared), collected: {} },
    fractionBar:      { ...sharedAtWidth(shadedFractionShared), collected: {} },
    'shaded-fraction': { ...shadedFractionWall, collected: {} },
    'fraction-wall':  { ...fractionWallWall, collected: {} },
    money:            { ...moneyWall, collected: {} },
    numberLine:       { ...numberLineWall, collected: {} },
    map:              { ...mapWall, collected: {} },
    'dial-scale': { ...dialScaleWall, collected: {} },
    'measuring-jug': { ...measuringJugWall, collected: {} },
    'ruler': { ...rulerWall, collected: {} },
    'timeline': { ...timelineWall, collected: {} },
    'process-chain': { ...processChainWall, collected: {} },
    'classification-key': { ...classificationKeyWall, collected: {} },
    'concept-map': { ...conceptMapWall, collected: {} },
    'annotated-text': { ...annotatedTextWall, collected: {} },
    'fishbone': { ...fishboneWall, collected: {} },
    'continuum-line': { ...continuumLineWall, collected: {} },
    'source-pathway': { ...sourcePathwayWall, collected: {} },
    'number-network': { ...numberNetworkWall, collected: {} },
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
    'bar-chart':      { ...barChartWall, collected: {} },
    'line-graph':     { ...lineGraphWall, collected: {} },
    'bar-model':      { keyFn: barModelShared.cacheKey, tightFn: barModelShared.tightSvg, collected: {} },
    'grid-map':       { keyFn: gridMapShared.cacheKey, tightFn: gridMapShared.tightSvg, collected: {} },
    'rainforest-layers': { keyFn: rainforestLayersShared.cacheKey, tightFn: rainforestLayersShared.tightSvg, collected: {} },
    'balanced-pattern-plate': { keyFn: balancedPatternPlateShared.cacheKey, tightFn: balancedPatternPlateShared.tightSvg, collected: {} },
    'place-value-chart': { ...placeValueChartWall, collected: {} },
    'place-value-mini': { ...placeValueMiniWall, collected: {} },
    'base-ten-blocks': { ...baseTenBlocksWall, collected: {} },
    'counter-group': { ...counterGroupWall, collected: {} },
    'part-whole-model': { ...partWholeModelWall, collected: {} },
    'pyramid': { ...pyramidWall, collected: {} },
    'mult-grid': { ...multGridWall, collected: {} },
    'digit-cards': { ...digitCardsWall, collected: {} },
    'circuit-diagram': { keyFn: circuitShared.cacheKey, tightFn: circuitShared.tightSvg, collected: {} },
    'parachute-forces': { keyFn: parachuteForcesShared.cacheKey, tightFn: parachuteForcesShared.tightSvg, collected: {} },
    'blank-surface': { keyFn: blankSurfaceShared.cacheKey, tightFn: blankSurfaceShared.tightSvg, collected: {} },
    'circuit-symbol-bank': { keyFn: circuitSymbolBankShared.cacheKey, tightFn: circuitSymbolBankShared.tightSvg, collected: {} },
    'label-diagram': { keyFn: labelDiagramShared.cacheKey, tightFn: labelDiagramShared.tightSvg, collected: {} },
  };

  const badges = new Set();
  let visualsDeclared = 0;
  // Visuals carrying callouts get a second, annotated render (diagram + labels)
  // stored under the base key plus the callout suffix.
  const annotated = {};

  const collectVisual = (marked) => {
    if (!marked) return;
    if (marked._educationalSvgBuffer) return;
    // A figure's words print plain, never a taught word's braces; the card
    // lookup (visuals.js pickVisual) keys the same plain spec.
    const visual = withoutTaughtMarks(marked);
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
    // A marked passage is laid out for the box its own card gives it; the card
    // later looks the picture up by the same stamped spec.
    if (card && card.visual && card.visual.type === 'annotated-text' && !card.visual._wallBox) {
      Object.defineProperty(card.visual, '_wallBox', { value: annotatedTextBoxFor(card), enumerable: true, writable: true, configurable: true });
    }
    if (card && card.visual) collectVisual(card.visual);
    if (card && card.type === 'diagramSection' && Array.isArray(card.parts)) {
      // Every part draws its own figure; a section exists to put two or
      // three of them on one sheet.
      for (const part of card.parts) {
        if (part && part.visual) collectVisual(part.visual);
      }
    }
    if (card && card.type === 'stepByStep' && Array.isArray(card.steps)) {
      // Every step sits beside its own picture.
      card.steps.forEach((step, index) => {
        if (step && step.visual) collectVisual(stepVisual(card, index));
      });
    }
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
    if (card && card.type === 'diagramSection' && Array.isArray(card.parts)) {
      // A part's steps print the same green circle as the pins on its
      // figure, so step 2 in the list and step 2 on the drawing are one mark.
      for (const part of card.parts) {
        const count = Array.isArray(part && part.steps) ? part.steps.length : 0;
        for (let n = 1; n <= count; n += 1) badges.add(n);
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

  // A labelled diagram is drawn over a photograph the card names by file, so
  // the file is read here, relative to the wall spec, before its drawing is
  // asked for. A named picture that cannot be read fails the build like any
  // other promised visual: a poster of parts with no picture labels nothing.
  for (const [key, visual] of Object.entries(PRIMITIVES['label-diagram'].collected)) {
    const file = visual.imagePath || visual.image;
    const abs = file ? require('path').resolve(specDir || '.', file) : null;
    if (!abs || !require('fs').existsSync(abs)) {
      throw new Error(`[working-wall] label-diagram names the picture "${file || ''}", which could not be read${specDir ? ` from ${specDir}` : ''}.`);
    }
    const meta = await sharp(abs).metadata();
    const mime = meta.format === 'png' ? 'image/png' : meta.format === 'svg' ? 'image/svg+xml' : 'image/jpeg';
    PRIMITIVES['label-diagram'].collected[key] = {
      ...visual,
      imageHref: `data:${mime};base64,${require('fs').readFileSync(abs).toString('base64')}`,
      imageWidth: meta.width,
      imageHeight: meta.height,
    };
  }

  for (const prim of Object.values(PRIMITIVES)) {
    for (const [key, primSpec] of Object.entries(prim.collected)) {
      try {
        if (prim.tightFn) {
          // Shared aspect-true primitive: render at its real proportions and
          // store { png, aspect } so the card places it tight (no square pad).
          const { svg, aspect, anchors } = prim.tightFn(primSpec);
          const resize = aspect >= 1 ? { width: RENDER_OUT_PX } : { height: RENDER_OUT_PX };
          // Density has to rise with the target: sharp rasterises the SVG at its
          // intrinsic size scaled by density and only then resizes, so leaving it
          // behind would upscale a small bitmap and cost the sharpness the bigger
          // target was for.
          // A drawing sized in a big photograph's own pixels (a labelled
          // 1280 x 2994 diagram lays out at about 3350 x 3294) would rasterise
          // at over 700 million pixels at that density, past the image
          // library's limit, and the whole wall failed (29 September 2026).
          // Nothing above the printed size is kept after the resize, so such a
          // drawing is rasterised at the printed size instead. Every drawing
          // that fits under the limit is drawn exactly as before.
          let density = 144 * RENDER_SCALE;
          const intrinsic = await sharp(Buffer.from(svg)).metadata();
          const pixelsAt = (d) => (intrinsic.width * d / 72) * (intrinsic.height * d / 72);
          if (intrinsic.width && intrinsic.height && pixelsAt(density) > 250e6) {
            density = 72 * RENDER_OUT_PX / Math.max(intrinsic.width, intrinsic.height);
          }
          const png = await sharp(Buffer.from(svg), { density })
            .resize(resize)
            .png()
            .toBuffer();
          // The places a drawing names go with its picture, so a sheet that
          // points a note at one (a stepByStep step) can find it.
          map[key] = anchors ? { png, aspect, anchors } : { png, aspect };
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
        throw new Error(`[working-wall] failed to render visual "${primSpec.type}" (${key}): ${wallAdviceFor(primSpec, e.message)}`);
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
  stepMarkersSvg,
  clockKey: clockWall.keyFn,
  fractionCircleKey,
  fractionBarKey,
  shadedFractionKey: shadedFractionWall.keyFn,
  fractionWallKey: fractionWallWall.keyFn,
  moneyKey: moneyWall.keyFn,
  numberLineSvg,
  numberLineTight,
  numberLineKey,
  mapKey: mapWall.keyFn,
  dialScaleKey: dialScaleWall.keyFn,
  measuringJugKey: measuringJugWall.keyFn,
  rulerKey: rulerWall.keyFn,
  timelineKey: timelineWall.keyFn,
  processChainKey: processChainWall.keyFn,
  classificationKeyKey: classificationKeyWall.keyFn,
  conceptMapKey: conceptMapWall.keyFn,
  annotatedTextKey: annotatedTextWall.keyFn,
  fishboneKey: fishboneWall.keyFn,
  continuumLineKey: continuumLineWall.keyFn,
  sourcePathwayKey: sourcePathwayWall.keyFn,
  numberNetworkKey: numberNetworkWall.keyFn,
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
  barChartKey: barChartWall.keyFn,
  lineGraphKey: lineGraphWall.keyFn,
  barModelKey: barModelShared.cacheKey,
  gridMapKey: gridMapShared.cacheKey,
  rainforestLayersKey: rainforestLayersShared.cacheKey,
  balancedPatternPlateKey: balancedPatternPlateShared.cacheKey,
  balancedPatternPlateTightSvg: balancedPatternPlateShared.tightSvg,
  placeValueChartKey: placeValueChartWall.keyFn,
  placeValueMiniKey: placeValueMiniWall.keyFn,
  baseTenBlocksKey: baseTenBlocksWall.keyFn,
  counterGroupKey: counterGroupWall.keyFn,
  partWholeModelKey: partWholeModelWall.keyFn,
  pyramidKey: pyramidWall.keyFn,
  multGridKey: multGridWall.keyFn,
  digitCardsKey: digitCardsWall.keyFn,
  circuitDiagramKey: circuitShared.cacheKey,
  parachuteForcesKey: parachuteForcesShared.cacheKey,
  blankSurfaceKey: blankSurfaceShared.cacheKey,
  circuitSymbolBankKey: circuitSymbolBankShared.cacheKey,
  labelDiagramKey: labelDiagramShared.cacheKey,
  badgeSvg,
  badgeKey,
  calloutKeySuffix,
  preRenderSvgs,
};
