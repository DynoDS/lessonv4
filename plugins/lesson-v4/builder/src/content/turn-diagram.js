'use strict';

// Renders an "angle as a turn" diagram: two straight rays from a vertex (the
// start ray points up; the end ray is the start rotated by the turn) with a red
// curved arrow showing the rotation from start to end. This is the White Rose
// "match the turns to the labels" / "identify the turn" picture. Built the same
// way as the clock: the SVG is pre-rendered to a PNG before the slide loop (in
// preRenderTurns), then drawTurnDiagram reads from ctx.turnImages, so the draw
// step stays fast and synchronous.
//
// Spec:
//   quarters    1 = quarter, 2 = half, 3 = three-quarter, 4 = full turn.
//               Accepts any positive number of quarter-turns. (default 1)
//   amount      alternative to quarters as a word: "quarter" | "half" |
//               "three-quarter" | "full". Used if `quarters` is absent.
//   direction   "clockwise" (default) | "anticlockwise".
//   label       optional caption below the diagram. Supports the "||" answer
//               reveal, exactly like the clock helper, so a Your Turn answer can
//               show "(a) ||quarter turn clockwise" with the answer in green.
//   countMarks  when true, numbers 1, 2, 3… are drawn at each quarter-turn
//               boundary along the arc, making "a three-quarter turn is 3 quarter
//               turns" visible. Use it where the lesson is *teaching* that a turn
//               is built from quarter turns (a Teach slide, a size reference) —
//               not on a plain "name this turn" question, where the numbers would
//               turn identifying the turn into counting the labels.

const requireGlobal = require('../require-global');
const { FONT, COLOURS, FIT } = require('../styles');
const { splitAnswerRuns } = require('../answer-text');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD            = 0.10;   // zone inner padding (inches)
// Labels under a turn diagram are read from the board, so they are sized to the
// same standard as other slide text — a caption that only needs to be legible on
// a worksheet is too small projected. These are ceilings: the build's shrink-to-fit
// pass scales them down where a crowded row leaves less room, so a roomy teach row
// shows a large label and a tight answer row shrinks gracefully rather than the
// label being small everywhere.
//
// The band reserves room for *two* lines because the turn names vary in length —
// "half turn" is short but "three-quarter turn clockwise" is long, and in a narrow
// cell a one-line band forces the long one to shrink by width until it is too small
// to read across the room (the recurring complaint: one label at ~13pt beside its
// 24pt neighbours). With room to wrap, the long name takes a second line and keeps
// a board-readable size instead, so a row of labels stays legible and roughly even.
const LABEL_H        = 0.86;   // height when label is just a name/identifier (e.g. "quarter turn", "(a)")
const LABEL_H_ANSWER = 1.16;   // height when label carries an answer reveal (contains "||")
const LABEL_GAP      = 0.06;
const LABEL_FONT        = 28;  // tested as readable from the back of the room on a teach row
const LABEL_FONT_ANSWER = 26;  // bold green answer reveal — kept large for the same reason
const RENDER_PX      = 600;    // pre-render resolution — high enough for crisp slides

const RAY_COLOUR     = '#000000';
const ARC_COLOUR     = '#C00000';   // the red turn arrow, matching the dial needle red
const START_ANGLE    = -90;         // the start ray always points straight up
const FULL_CAP_DEG   = 350;         // a full turn is drawn just short of 360 so its arrow shows
// ─── END CONSTANTS ────────────────────────────────────────────

function toRad(deg) { return (deg * Math.PI) / 180; }

const AMOUNT_QUARTERS = {
  quarter: 1, half: 2,
  'three-quarter': 3, 'three-quarters': 3, 'threequarter': 3,
  full: 4, whole: 4
};

// Resolve the turn into a number of quarter-turns and a direction. Tolerant of
// either the numeric `quarters` field or the word `amount`, so the designer can
// write whichever reads more naturally for the slide.
function resolveTurn(data) {
  let quarters = Number(data.quarters);
  if (!Number.isFinite(quarters) || quarters <= 0) {
    const word = String(data.amount || '').trim().toLowerCase().replace(/\s+/g, '-');
    quarters = AMOUNT_QUARTERS[word] || 1;
  }
  const direction = data.direction === 'anticlockwise' ? 'anticlockwise' : 'clockwise';
  return { quarters, direction };
}

function turnKey(data) {
  const { quarters, direction } = resolveTurn(data);
  return quarters + ':' + direction + (data.countMarks ? ':n' : '');
}

function buildSvg(data, sizePx) {
  const { quarters, direction } = resolveTurn(data);
  const cx = sizePx / 2;
  const cy = sizePx / 2;
  // Keep the margin just wide enough that an arrowhead never clips the canvas edge.
  // A larger margin only adds empty space around the rays, which makes the picture
  // float small inside its slot — the diagram reads bigger and fuller when the rays
  // run closer to the edge, so the margin stays tight rather than generous.
  const pad = sizePx * 0.06;          // room for the arrowheads to sit inside the canvas
  const R   = sizePx / 2 - pad;       // ray length
  const arcR = R * 0.52;              // the red arc sits inside the rays
  const ah   = sizePx * 0.075;        // arrowhead size
  const rayW = sizePx * 0.013;
  const arcW = sizePx * 0.016;
  const dotR = sizePx * 0.020;

  // In SVG (y grows downward) a positive angle sweep runs clockwise on screen, so
  // clockwise = +1 and anticlockwise = -1. The end ray uses the true sweep (a full
  // turn lands back on the start ray); the arc uses a capped sweep so a full turn
  // still shows an arrowhead rather than collapsing to nothing.
  const dir = direction === 'clockwise' ? 1 : -1;
  const sweepDeg       = quarters * 90;
  const arcSweepDeg    = Math.min(sweepDeg, FULL_CAP_DEG);
  const endRayAngle    = START_ANGLE + dir * sweepDeg;
  const arcEndAngle    = START_ANGLE + dir * arcSweepDeg;

  const pt = function (angle, radius) {
    return {
      x: cx + radius * Math.cos(toRad(angle)),
      y: cy + radius * Math.sin(toRad(angle))
    };
  };

  const startTip = pt(START_ANGLE, R);
  const endTip   = pt(endRayAngle, R);
  const arcStart = pt(START_ANGLE, arcR);
  const arcEnd   = pt(arcEndAngle, arcR);
  const sweepFlag    = dir > 0 ? 1 : 0;                 // SVG arc sweep: 1 = clockwise
  const largeArcFlag = arcSweepDeg > 180 ? 1 : 0;

  const f = function (n) { return n.toFixed(2); };

  // Arrowhead marker: a filled triangle whose tip sits exactly on the line/arc end
  // (refX/refY at the tip), rotated to follow the line via orient="auto".
  const marker = function (id, colour) {
    return `<marker id="${id}" markerUnits="userSpaceOnUse" markerWidth="${f(ah)}" markerHeight="${f(ah)}" refX="${f(ah)}" refY="${f(ah / 2)}" orient="auto">` +
           `<path d="M0,0 L${f(ah)},${f(ah / 2)} L0,${f(ah)} Z" fill="${colour}"/></marker>`;
  };

  const parts = [];
  parts.push(`<defs>${marker('thBk', RAY_COLOUR)}${marker('thRd', ARC_COLOUR)}</defs>`);

  // The two rays, each with an arrowhead at its tip.
  parts.push(`<line x1="${f(cx)}" y1="${f(cy)}" x2="${f(startTip.x)}" y2="${f(startTip.y)}" stroke="${RAY_COLOUR}" stroke-width="${f(rayW)}" stroke-linecap="round" marker-end="url(#thBk)"/>`);
  parts.push(`<line x1="${f(cx)}" y1="${f(cy)}" x2="${f(endTip.x)}" y2="${f(endTip.y)}" stroke="${RAY_COLOUR}" stroke-width="${f(rayW)}" stroke-linecap="round" marker-end="url(#thBk)"/>`);

  // The red curved turn arrow.
  parts.push(`<path d="M ${f(arcStart.x)} ${f(arcStart.y)} A ${f(arcR)} ${f(arcR)} 0 ${largeArcFlag} ${sweepFlag} ${f(arcEnd.x)} ${f(arcEnd.y)}" fill="none" stroke="${ARC_COLOUR}" stroke-width="${f(arcW)}" stroke-linecap="round" marker-end="url(#thRd)"/>`);

  // Optional quarter-count marks: a small numbered disc at each quarter-turn
  // boundary, so the picture shows how many quarter turns make up this turn.
  if (data.countMarks) {
    const markR    = (arcR + R) / 2;
    const markFont = sizePx * 0.085;
    const discR    = markFont * 0.85;
    const nMarks   = Math.floor(quarters);
    for (let k = 1; k <= nMarks; k++) {
      const a = START_ANGLE + dir * (k * 90);
      const m = pt(a, markR);
      parts.push(`<circle cx="${f(m.x)}" cy="${f(m.y)}" r="${f(discR)}" fill="#FFFFFF" stroke="${ARC_COLOUR}" stroke-width="${f(sizePx * 0.006)}"/>`);
      parts.push(`<text x="${f(m.x)}" y="${f(m.y)}" text-anchor="middle" dominant-baseline="central" font-family="Arial" font-size="${f(markFont)}" font-weight="bold" fill="${ARC_COLOUR}">${k}</text>`);
    }
  }

  // Vertex dot.
  parts.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(dotR)}" fill="${RAY_COLOUR}"/>`);

  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 ${sizePx} ${sizePx}">${parts.join('')}</svg>`;
}

async function preRenderTurns(lesson) {
  let sharp;
  try { sharp = requireGlobal('sharp'); } catch (e) { return {}; }

  const specs = {};
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    if (obj.type === 'turn-diagram') {
      const key = turnKey(obj);
      if (!specs[key]) specs[key] = obj;
    }
    for (const k of Object.keys(obj)) walk(obj[k]);
  }
  walk(lesson);

  const map = {};
  for (const [key, spec] of Object.entries(specs)) {
    const svg = buildSvg(spec, RENDER_PX);
    try {
      map[key] = await sharp(Buffer.from(svg), { density: 72 })
        .resize({ width: RENDER_PX })
        .png()
        .toBuffer();
    } catch (e) {
      // skip — placeholder shown at draw time
    }
  }
  return map;
}

// The vertical band a turn diagram reserves under its picture for its label, by
// label kind. A row equaliser uses this to give every diagram in a row the same
// band (the largest any sibling needs) so they all draw at one size.
function turnLabelBandHeight(data) {
  const label = (data && data.label) || '';
  if (!label) return 0;
  return label.includes('||') ? LABEL_H_ANSWER : LABEL_H;
}

function drawTurnDiagram(pptx, slide, zone, data, ctx) {
  const key       = turnKey(data);
  const label     = data.label || '';
  const hasLabel  = label.length > 0;
  const hasAnswer = hasLabel && label.includes('||');
  // A row of turn diagrams may pass a shared band height (zone.turnLabelBandH) so
  // every option renders at the same size — the same equalising the clock row does,
  // so an answer-reveal caption doesn't shrink its diagram below its neighbours'.
  const naturalLabelH = hasAnswer ? LABEL_H_ANSWER : LABEL_H;
  const labelH    = (hasLabel && typeof zone.turnLabelBandH === 'number')
    ? zone.turnLabelBandH : naturalLabelH;
  const labelFont = hasAnswer ? LABEL_FONT_ANSWER : LABEL_FONT;

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const avail  = zone.h - 2 * PAD;   // vertical room shared by the diagram and its label

  // Reserve a band for the label, but never let it swallow the slot. In a tight
  // zone (a crowded row, a small reference strip) a fixed band drives the diagram
  // height negative — and a negative width/height emits an invalid image extent
  // that corrupts the .pptx (PowerPoint then offers to "repair" it). Capping the
  // band to a share of the slot keeps the diagram height positive whatever the
  // zone, and the label's own shrink-to-fit handles the reduced height.
  const wantBand = hasLabel ? labelH + LABEL_GAP : 0;
  const bandH    = Math.min(wantBand, Math.max(0, avail * 0.6));
  const innerH   = Math.max(0, avail - bandH);

  const side   = Math.max(0, Math.min(innerW, innerH));
  const diagX  = innerX + (innerW - side) / 2;
  const diagY  = innerY + (innerH - side) / 2;

  // Only draw a shape when it has a real, positive size — never a zero/negative
  // extent. A slot too small to show the diagram simply shows its label.
  if (side > 0.05) {
    const png = ctx.turnImages && ctx.turnImages[key];
    if (png) {
      slide.addImage({
        data: 'image/png;base64,' + png.toString('base64'),
        x: diagX, y: diagY, w: side, h: side
      });
    } else {
      require('./figure-fallback').drawFigureFallback(pptx, slide, { x: diagX, y: diagY, w: side, h: side }, ctx, 'turn diagram');
    }
  }

  if (hasLabel && bandH > 0.05) {
    const labelRuns = splitAnswerRuns(label, hasAnswer);
    slide.addText(labelRuns, {
      x: innerX, y: innerY + innerH + LABEL_GAP,
      w: innerW, h: Math.max(0.1, bandH - LABEL_GAP),
      fontFace: FONT, fontSize: labelFont, color: COLOURS.body,
      bold: hasAnswer,
      align: 'center', valign: 'middle', margin: 0, fit: FIT
    });
  }
}

module.exports = { drawTurnDiagram, preRenderTurns, turnKey, turnLabelBandHeight };
