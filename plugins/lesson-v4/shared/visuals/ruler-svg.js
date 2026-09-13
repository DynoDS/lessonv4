'use strict';

// THE ruler. One drawing, placed by the board, the worksheet, the working wall
// and the stick-in pack.
//
// A RULER ON PAPER IS A MEASURING INSTRUMENT, NOT A PICTURE OF ONE.
//
// Every other drawing is laid out to the width it is given. If a ruler were
// treated the same way on paper, its centimetres would stop being centimetres
// the moment the space was any width but one, and every answer a child read off
// it would be wrong - wrong in the worst way available, because the sheet would
// look completely normal and the child would be marked down for measuring
// correctly. So on the worksheet and the stick-in pack (both printed and held in
// the hand) it prints at TRUE SIZE, one centimetre to ten real millimetres, and
// REFUSES a space too narrow to hold it rather than shrinking to fit
// (RULER_TOO_WIDE_FOR_SPACE). The worksheet asks for the ruler's true width
// before anything is drawn, so a zone narrower than the ruler fails the fit
// check first.
//
// On the board and the wall there is no true size to keep (a projector and a
// display card print at whatever size the room needs), so the same ruler, with
// the same marks and proportions, grows to fill its space and is read as a
// picture of a scale.
//
// It was the worksheet's alone (worksheet-html/src/helpers/geometry.js) until
// 13 September 2026, when every picture became one shared drawing reachable
// from every surface.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//   trueWidthMm(spec)       -> the paper the ruler occupies at true size
//
// Spec:
//   start           left-hand value. Default 0.
//   end             right-hand value. Required.
//   unit            "cm" (default) | "mm" | "m". Sets the true size of one unit
//                   on paper, so it is arithmetic, not a caption. null or ""
//                   prints no unit and sizes it as centimetres.
//   majorInterval   labelled tick spacing. Default 1.
//   minorInterval   small tick spacing. Default majorInterval / 2.
//   arrow           { at, label?, answerBox? } an arrow above the scale
//   object          { from, to, label? } a bar to measure ("how long is the
//                   pencil?")

const T = require('./figure-text');
const { MM_TO_PT } = require('./surface-profiles');

const MM_PER_UNIT = { cm: 10, mm: 1, m: 1000 };
// The surfaces a child holds a ruler against.
const TRUE_SIZE_SURFACES = new Set(['worksheets', 'stickin']);

// ─── CONSTANTS (millimetres at true size; scaled with the ruler elsewhere) ──
const MARGIN_X = 5; // paper either side of the scale itself
const TOP_PAD = 1.5;
const BOTTOM_PAD = 1.5;
const TICK_MINOR = 2.6;
const TICK_MAJOR = 4.4;
const AXIS_STROKE = 0.5;
const TICK_STROKE = 0.4;
const LABEL_GAP = 1.6;
const ARROW_H = 9;
const ARROW_GAP = 1.5;
const ARROW_STROKE = 0.7;
const ARROW_HEAD_W = 2.8;
const ARROW_HEAD_H = 2;
const BOX = 9;
const BOX_GAP = 2;
const OBJECT_BAR_H = 2.2;
const OBJECT_GAP = 2;
const OBJECT_STROKE = 0.5;
const UNIT_GAP = 2; // between the last number and the unit
// Paper kept on the right for the unit, whatever it is, so a ruler's width is
// its length plus fixed margins: ten more centimetres is exactly a hundred more
// millimetres of paper, and a 100mm ruler and a 10cm ruler take the same room.
const UNIT_ROOM = 9;
const LABEL_GUTTER = 0.3; // ems kept clear between neighbouring numbers
// ────────────────────────────────────────────────────────────────────────────

function tidy(value) {
  return Math.round(value * 1e9) / 1e9;
}

function normalise(spec = {}) {
  const start = spec.start ?? 0;
  const end = spec.end;
  if (!Number.isFinite(end) || end <= start) {
    throw new Error(`RULER_LENGTH: a ruler runs from ${start} to ${end}, which is not a length.`);
  }
  const unit = spec.unit === undefined ? 'cm' : spec.unit;
  const showUnit = unit !== null && unit !== '';
  const mmPerUnit = MM_PER_UNIT[showUnit ? unit : 'cm'];
  if (!mmPerUnit) {
    throw new Error(`RULER_UNIT: "${unit}" has no true size on paper. Known: ${Object.keys(MM_PER_UNIT).join(', ')}.`);
  }
  const majorInterval = spec.majorInterval ?? 1;
  const minorInterval = spec.minorInterval ?? majorInterval / 2;
  if (!(majorInterval > 0) || !(minorInterval > 0)) {
    throw new Error(`RULER_INTERVAL: intervals must be positive, got major ${majorInterval} and minor ${minorInterval}.`);
  }
  const onScale = (v, what) => {
    if (!Number.isFinite(Number(v)) || v < start - 1e-9 || v > end + 1e-9) {
      throw new Error(`RULER_POINT_OFF_SCALE: ${what} ${JSON.stringify(v)} is not on the ruler (${start} to ${end}).`);
    }
  };
  const arrow = spec.arrow ? { at: Number(spec.arrow.at), label: spec.arrow.label == null ? '' : String(spec.arrow.label), answerBox: spec.arrow.answerBox === true } : null;
  if (arrow) onScale(arrow.at, 'the arrow at');
  const object = spec.object ? { from: Number(spec.object.from), to: Number(spec.object.to), label: spec.object.label == null ? '' : String(spec.object.label) } : null;
  if (object) {
    onScale(object.from, 'the object starting at');
    onScale(object.to, 'the object ending at');
  }
  return { start, end, unit: showUnit ? String(unit) : '', mmPerUnit, majorInterval, minorInterval, arrow, object };
}

// The paper a ruler occupies at true size.
function trueWidthMm(spec) {
  const n = normalise(spec);
  return 2 * MARGIN_X + (n.end - n.start) * n.mmPerUnit + (n.unit ? UNIT_ROOM : 0);
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = T.resolveProfile(profileOrSurface, box);
  const n = normalise(spec);
  const bold = profile.bold;
  const trueSize = TRUE_SIZE_SURFACES.has(profile.surface);
  const spanMm = (n.end - n.start) * n.mmPerUnit;

  let pt = profile.fontPt;
  const majorSteps = Math.round((n.end - n.start) / n.majorInterval);
  const labels = [];
  for (let i = 0; i <= majorSteps; i++) labels.push(tidy(n.start + i * n.majorInterval));

  // The textual parts, in points; everything else is millimetres times k.
  const textAbove = (p) => (n.arrow ? (n.arrow.answerBox ? 0 : n.arrow.label ? T.LINE * p : 0) : 0) + (n.object && n.object.label ? T.LINE * p : 0);
  const geomAbove = TOP_PAD + (n.arrow ? ARROW_H + ARROW_GAP + (n.arrow.answerBox ? BOX + BOX_GAP : 0) : 0) + (n.object ? OBJECT_BAR_H + OBJECT_GAP : 0) + TICK_MAJOR / 2;
  const geomBelow = TICK_MAJOR / 2 + LABEL_GAP + BOTTOM_PAD;
  const fixedW = 2 * MARGIN_X + (n.unit ? UNIT_ROOM : 0); // mm, scaled with the ruler
  const unitText = n.unit ? T.widthPt(n.unit, pt, bold) : 0;

  let k; // points per millimetre of the ruler
  if (trueSize) {
    k = MM_TO_PT;
    const need = (fixedW + spanMm) * k;
    if (need > profile.widthPt + 0.5) {
      throw new Error(
        `RULER_TOO_WIDE_FOR_SPACE: a ruler from ${n.start} to ${n.end}${n.unit || 'cm'} prints ${(need / MM_TO_PT).toFixed(0)}mm wide at true size, ` +
          `and this space is ${(profile.widthPt / MM_TO_PT).toFixed(0)}mm. Give it a wider space or a shorter ruler; a ruler is never shrunk, because a scaled ruler makes every answer wrong.`
      );
    }
  } else {
    // Scaled, the unit's room follows its words rather than the paper margin.
    k = (profile.widthPt - unitText) / (2 * MARGIN_X + spanMm + (n.unit ? UNIT_GAP : 0));
    if (profile.heightPt) {
      const byHeight = (profile.heightPt - textAbove(pt) - T.LINE * pt) / (geomAbove + geomBelow);
      k = Math.min(k, byHeight);
      if (!(k > 0) || k * (n.minorInterval * n.mmPerUnit) < 2) {
        throw new Error(
          `RULER_ZONE_TOO_SHALLOW: the ruler cannot show its marks and its ${profile.minFontPt}pt numbers in a space ${(profile.heightPt / 72).toFixed(2)}in tall. Give it more height.`
        );
      }
    }
  }

  // One size serves every number on the scale. A crowded scale shrinks whole
  // to the readable floor, then refuses rather than print numbers into each
  // other.
  const spacing = n.majorInterval * n.mmPerUnit * k;
  const widest = (p) => Math.max(...labels.map((v) => T.widthPt(String(v), p, bold)));
  while (widest(pt) > spacing - LABEL_GUTTER * pt && pt > profile.minFontPt) pt = Math.max(profile.minFontPt, pt - 0.5);
  if (widest(pt) > spacing - LABEL_GUTTER * pt) {
    throw new Error(
      `RULER_LABELS_CROWDED: the numbers every ${n.majorInterval}${n.unit} do not fit apart at the ${profile.minFontPt}pt readable size. ` +
        'Label a wider majorInterval, or give the ruler more room.'
    );
  }

  const x = (v) => MARGIN_X * k + (v - n.start) * n.mmPerUnit * k;
  const aboveText = textAbove(pt);
  const axisY = aboveText + geomAbove * k;
  const labelTop = axisY + (TICK_MAJOR / 2 + LABEL_GAP) * k;
  const h = labelTop + T.LINE * pt + BOTTOM_PAD * k;
  const contentW = trueSize ? (fixedW + spanMm) * k : (2 * MARGIN_X + spanMm + (n.unit ? UNIT_GAP : 0)) * k + unitText;
  // A ruler on paper starts at the margin, as a real one is laid down, so two
  // rulers on one sheet line up at their zeros; elsewhere it is centred.
  const framed = T.frameWidth(profile, contentW);
  const W = framed.W;
  const dx = trueSize ? 0 : framed.dx;
  return { profile, n, k, pt, labels, x: (v) => dx + x(v), axisY, labelTop, h, W, dx, trueSize };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const { n, k, pt, profile, x } = L;
  const c = profile.colours;
  const font = profile.font;
  const bold = profile.bold;
  const f = T.f2;
  const parts = [];

  parts.push(`<line x1="${f(x(n.start))}" y1="${f(L.axisY)}" x2="${f(x(n.end))}" y2="${f(L.axisY)}" stroke="${c.ink}" stroke-width="${f(AXIS_STROKE * k)}" stroke-linecap="square"/>`);
  const steps = Math.round((n.end - n.start) / n.minorInterval);
  for (let i = 0; i <= steps; i++) {
    const value = tidy(n.start + i * n.minorInterval);
    const ofMajor = (value - n.start) / n.majorInterval;
    const major = Math.abs(ofMajor - Math.round(ofMajor)) < 1e-6;
    const half = ((major ? TICK_MAJOR : TICK_MINOR) / 2) * k;
    parts.push(`<line x1="${f(x(value))}" y1="${f(L.axisY - half)}" x2="${f(x(value))}" y2="${f(L.axisY + half)}" stroke="${c.ink}" stroke-width="${f(TICK_STROKE * k)}"/>`);
  }
  L.labels.forEach((v) => parts.push(T.textLines([String(v)], x(v), L.labelTop, pt, { fill: c.ink, font, bold })));
  if (n.unit) {
    parts.push(T.textLines([n.unit], x(n.end) + Math.max(UNIT_GAP * k, T.widthPt(String(L.labels[L.labels.length - 1]), pt, bold) / 2 + 0.3 * pt), L.labelTop, pt, { fill: c.ink, font, bold, anchor: 'start' }));
  }

  if (n.object) {
    const ox1 = x(n.object.from);
    const ox2 = x(n.object.to);
    const base = L.axisY - (TICK_MAJOR / 2 + OBJECT_GAP) * k;
    const top = base - OBJECT_BAR_H * k;
    const mid = (base + top) / 2;
    const sw = f(OBJECT_STROKE * k);
    parts.push(`<path d="M${f(ox1)} ${f(top)} V${f(base)} M${f(ox2)} ${f(top)} V${f(base)} M${f(ox1)} ${f(mid)} H${f(ox2)}" fill="none" stroke="${c.jump}" stroke-width="${sw}"/>`);
    if (n.object.label) parts.push(T.textLines([n.object.label], (ox1 + ox2) / 2, top - T.LINE * pt, pt, { fill: c.jump, font, bold }));
  }

  if (n.arrow) {
    const ax = x(n.arrow.at);
    const objectSpace = n.object ? (OBJECT_BAR_H + OBJECT_GAP) * k + (n.object.label ? T.LINE * pt : 0) : 0;
    const tip = L.axisY - (TICK_MAJOR / 2) * k - objectSpace - 0.5 * k;
    const shaftTop = tip - ARROW_H * k;
    parts.push(`<line x1="${f(ax)}" y1="${f(shaftTop)}" x2="${f(ax)}" y2="${f(tip - ARROW_HEAD_H * k * 0.8)}" stroke="${c.arrow}" stroke-width="${f(ARROW_STROKE * k)}"/>`);
    parts.push(`<polygon points="${f(ax - (ARROW_HEAD_W / 2) * k)},${f(tip - ARROW_HEAD_H * k)} ${f(ax + (ARROW_HEAD_W / 2) * k)},${f(tip - ARROW_HEAD_H * k)} ${f(ax)},${f(tip)}" fill="${c.arrow}"/>`);
    if (n.arrow.answerBox) {
      parts.push(`<rect x="${f(ax - (BOX / 2) * k)}" y="${f(shaftTop - (BOX_GAP + BOX) * k)}" width="${f(BOX * k)}" height="${f(BOX * k)}" fill="${c.paper}" stroke="${c.ink}" stroke-width="${f(TICK_STROKE * k)}"/>`);
    } else if (n.arrow.label) {
      parts.push(T.textLines([n.arrow.label], ax, shaftTop - T.LINE * pt, pt, { fill: c.arrow, font, bold: true }));
    }
  }

  return { svg: T.svgDoc(L.W, L.h, parts), w: L.W, h: L.h, aspect: L.W / L.h, layout: L };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = T.resolveProfile(profileOrSurface, box);
  return `ruler:${T.profileKey(p)}:${JSON.stringify(normalise(spec))}`;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, trueWidthMm, MM_PER_UNIT };
