'use strict';

// One or more named 2D shapes, drawn side by side, for "name the shape" and
// "count the right angles / pairs of parallel sides" work. The shapes are drawn
// from PowerPoint preset geometry so right angles are truly square and regular
// shapes are truly regular — which is the whole point when a child is being asked
// to judge those properties by eye.
//
// Two kinds of caption, which serve different jobs and can both appear:
//   - data.label   the ITEM-LEVEL caption for the whole object — the lettered
//                  index a row gives each item ("(a) (b) (c)"), a shape name
//                  ("Square"), or an answer reveal ("(c) ||5 lines"). This is the
//                  caption every other row primitive (triangle, geoboard, angle…)
//                  renders from `data.label`, so polygon honours it the same way and
//                  sits as a first-class citizen in a mixed row — without it, a
//                  pentagon dropped into a lettered row came out with no letter.
//   - shapes[].label  a per-SHAPE caption under each individual shape, for the
//                  multi-shape case where one polygon object draws several named
//                  shapes each needing its own label ("3 sides — 3 lines").
//
// Spec:
//   shapes  [{ name, label, candidate, verdict, fold }]
//             name  one of: square, rectangle, triangle (equilateral),
//                   isosceles-triangle, scalene-triangle, right-triangle,
//                   pentagon, hexagon, rhombus, parallelogram, trapezium, kite
//             label optional per-shape caption shown below that shape
//             candidate  (teaching slides) one position to draw a SINGLE dashed
//                   candidate line of symmetry to TEST — not the full correct set.
//                   One of: "vertical", "horizontal", "diagonal-tlbr",
//                   "diagonal-trbl". The line may be WRONG (the whole point is the
//                   teacher tests a line that fails, e.g. a vertical on a
//                   parallelogram). Drawn over this shape only.
//             verdict  optional "pass" | "fail" — a large mark beside the shape:
//                   pass → green tick, fail → red cross. Use to show whether the
//                   candidate line worked. Independent of `candidate`, but normally
//                   paired with it.
//             fold  optional true — the FOLD / MIRROR TEST preview: reflect the
//                   shape across the `candidate` line and draw the result as a
//                   translucent ghost. When the candidate IS a line of symmetry the
//                   ghost lands exactly on the shape (a clean overlap that reads as
//                   "the halves match"); when it is NOT, the ghost sticks out / leaves
//                   a gap (the mismatch a child can see). Requires `candidate`.
//   label   optional item-level caption shown below the whole object, supporting
//           the "||" answer reveal
//   symmetryLines        true to overlay each shape's FULL correct set of lines of
//             symmetry as DASHED lines on top of the shape (the shape is unchanged).
//             This is the ANSWER-slide overlay — use `candidate` for teaching one
//             line at a time. The correct lines are auto-drawn: square 4, rectangle
//             2, rhombus/diamond 2, equilateral triangle 3, isosceles triangle 1,
//             kite 1, pentagon 5, hexagon 6; parallelogram, trapezium,
//             scalene/right triangle 0 (nothing drawn, which is correct). Applies to
//             every shape in `shapes`.
//   symmetryLinesAnswer  when symmetryLines is on, true draws the lines in the
//             answer-reveal green (the same green the "||" reveal uses) for an
//             answer slide; false (default) draws them neutral dark for a question.

const { FONT, COLOURS, FIT } = require('../styles');
const { splitAnswerRuns } = require('../answer-text');
const { polygon: drawGeomPolygon } = require('./_geom');
const {
  symmetryLinesFor, polygonVerticesFor, candidateLineFor, reflectOutlineAcrossLine
} = require('../../../shared/visuals/polygon-symmetry');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD          = 0.10;   // zone inner padding (inches)
const COL_GAP      = 0.18;   // gap between shape columns (inches)
const SHAPE_FRAC_W = 0.86;   // shape may use this fraction of its column width
const SHAPE_FILL   = 'CCE2F5';   // pale blue body
const SHAPE_LINE   = '0070C0';   // blue outline
const SHAPE_PT     = 3;      // outline thickness (pt)
// Lines of symmetry overlay (dashed). Neutral dark on a question, answer green on
// a reveal — the same green the "||" answer marker uses.
const SYM_COLOUR        = '333333';   // neutral dark (question)
const SYM_COLOUR_ANSWER = '00B050';   // house answer green (reveal)
const SYM_PT            = 2;          // symmetry-line thickness (pt)
// Single CANDIDATE line of symmetry being TESTED (teaching slides). Drawn dashed
// in a strong neutral so it reads as "the line we are trying", not an answer.
const CAND_COLOUR  = '1F1F1F';   // strong dark for the line under test
const CAND_PT      = 3;          // candidate-line thickness (pt)
// FOLD / MIRROR preview — the reflected ghost of the shape across the candidate.
const FOLD_FILL    = 'F4B6C2';   // translucent pink ghost (the mirrored half)
const FOLD_LINE    = 'C0392B';   // ghost outline so the overhang/gap reads clearly
const FOLD_PT      = 2;          // ghost outline thickness (pt)
const FOLD_TRANSP  = 55;         // ghost fill transparency (%) so the real shape shows through
// PASS / FAIL verdict mark, drawn big beside the shape so it reads from the back.
const TICK_COLOUR  = '00B050';   // house answer green — a pass
const CROSS_COLOUR = 'C00000';   // clear red — a fail
const VERDICT_FRAC = 0.42;       // mark size as a fraction of the shape box's smaller side
const VERDICT_PT   = 6;          // mark stroke thickness (pt)
// Per-shape caption (one under each shape, for the multi-shape case)
const SHAPE_LABEL_H    = 0.42;
const SHAPE_LABEL_GAP  = 0.06;
const SHAPE_LABEL_FONT = 16;
// Item-level caption (the lettered index / name / answer for the whole object).
// Sized to match the sibling row primitives (triangle) so labels in a mixed row
// share a baseline and read from the back of the room.
const ITEM_LABEL_H        = 0.86;   // band for a name/identifier ("Square", "(c)")
const ITEM_LABEL_H_ANSWER = 1.16;   // band when the caption carries a "||" reveal
const ITEM_LABEL_GAP      = 0.06;
const ITEM_LABEL_FONT        = 28;
const ITEM_LABEL_FONT_ANSWER = 26;
// ─── END CONSTANTS ────────────────────────────────────────────

// prst = PowerPoint preset name; ar = drawn height ÷ width that makes the shape
// read true (e.g. an equilateral triangle is ~0.87 as tall as it is wide).
// prst       = PowerPoint preset name (drawn with addShape).
// custom:true = no faithful preset exists, so the shape is drawn from its unit
//               vertices (shared/visuals/polygon-symmetry.js) as a custGeom
//               freeform — this keeps isosceles/scalene/kite honest rather than
//               forcing them onto a symmetric preset.
const SHAPES = {
  square:          { prst: 'rect',          ar: 1.00 },
  rectangle:       { prst: 'rect',          ar: 0.64 },
  triangle:        { prst: 'triangle',      ar: 0.87 },
  'equilateral-triangle': { prst: 'triangle', ar: 0.87 },
  'isosceles-triangle': { custom: true,     ar: 0.95 },
  'scalene-triangle':   { custom: true,     ar: 0.80 },
  'right-triangle':{ prst: 'rtTriangle',    ar: 0.85 },
  pentagon:        { prst: 'pentagon',      ar: 0.95 },
  hexagon:         { prst: 'hexagon',       ar: 0.88 },
  rhombus:         { prst: 'diamond',       ar: 1.10 },
  diamond:         { prst: 'diamond',       ar: 1.10 },
  kite:            { custom: true,          ar: 1.20 },
  parallelogram:   { prst: 'parallelogram', ar: 0.62, vertsName: 'parallelogram' },
  trapezium:       { prst: 'trapezoid',     ar: 0.62 },
  trapezoid:       { prst: 'trapezoid',     ar: 0.62 }
};

// The vertical band a polygon reserves under its shapes for its item-level label,
// by label kind. A row equaliser uses this to give every polygon in a row the same
// band (the largest any sibling needs) so they all draw at one size.
function polygonLabelBandHeight(data) {
  const label = (data && data.label) || '';
  if (!label) return 0;
  return label.includes('||') ? ITEM_LABEL_H_ANSWER : ITEM_LABEL_H;
}

// A dashed straight line from (x1,y1) to (x2,y2), in slide inches. pptxgenjs LINE
// runs top-left→bottom-right by default; flipV/flipH mirror it so the geometry is
// correct for up-right and down-left directions (mirrors triangle-square.js).
function drawSymLine(pptx, slide, x1, y1, x2, y2, colour) {
  const dx = x2 - x1, dy = y2 - y1;
  const absDx = Math.abs(dx), absDy = Math.abs(dy);
  if (absDx < 0.001 && absDy < 0.001) return;
  const line = { color: colour, width: SYM_PT, dashType: 'dash' };

  if (absDx < 0.001) {
    slide.addShape(pptx.shapes.LINE, { x: x1, y: Math.min(y1, y2), w: 0.001, h: absDy, flipV: dy < 0, line });
  } else if (absDy < 0.001) {
    slide.addShape(pptx.shapes.LINE, { x: Math.min(x1, x2), y: y1, w: absDx, h: 0.001, flipH: dx < 0, line });
  } else if (dx > 0 && dy > 0) {
    slide.addShape(pptx.shapes.LINE, { x: x1, y: y1, w: dx, h: dy, line });
  } else if (dx > 0 && dy < 0) {
    slide.addShape(pptx.shapes.LINE, { x: x1, y: y2, w: dx, h: absDy, flipV: true, line });
  } else if (dx < 0 && dy > 0) {
    slide.addShape(pptx.shapes.LINE, { x: x2, y: y1, w: absDx, h: dy, flipH: true, line });
  } else {
    slide.addShape(pptx.shapes.LINE, { x: x2, y: y2, w: absDx, h: absDy, line });
  }
}

// A big green tick, drawn as a two-segment polyline centred on (cx, cy) and sized
// to `size` (its bounding side). Reads clearly from the back of the room.
function drawTick(pptx, slide, cx, cy, size) {
  const s = size;
  const p1 = { x: cx - 0.42 * s, y: cy + 0.02 * s };
  const p2 = { x: cx - 0.12 * s, y: cy + 0.34 * s };
  const p3 = { x: cx + 0.46 * s, y: cy - 0.36 * s };
  slide.addShape(pptx.shapes.LINE, lineSeg(p1, p2, TICK_COLOUR, VERDICT_PT));
  slide.addShape(pptx.shapes.LINE, lineSeg(p2, p3, TICK_COLOUR, VERDICT_PT));
}

// A big red cross (two strokes) centred on (cx, cy), sized to `size`.
function drawCross(pptx, slide, cx, cy, size) {
  const h = size / 2;
  slide.addShape(pptx.shapes.LINE, lineSeg({ x: cx - h, y: cy - h }, { x: cx + h, y: cy + h }, CROSS_COLOUR, VERDICT_PT));
  slide.addShape(pptx.shapes.LINE, lineSeg({ x: cx + h, y: cy - h }, { x: cx - h, y: cy + h }, CROSS_COLOUR, VERDICT_PT));
}

// Build a pptxgenjs LINE shape spec from a→b, with flips so the segment runs in
// the right direction whatever the quadrant (same approach as drawSymLine).
function lineSeg(a, b, colour, pt) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const absDx = Math.abs(dx), absDy = Math.abs(dy);
  const line = { color: colour, width: pt };
  if (absDx < 0.001) return { x: a.x, y: Math.min(a.y, b.y), w: 0.001, h: absDy, flipV: dy < 0, line };
  if (absDy < 0.001) return { x: Math.min(a.x, b.x), y: a.y, w: absDx, h: 0.001, flipH: dx < 0, line };
  if (dx > 0 && dy > 0) return { x: a.x, y: a.y, w: dx, h: dy, line };
  if (dx > 0 && dy < 0) return { x: a.x, y: b.y, w: dx, h: absDy, flipV: true, line };
  if (dx < 0 && dy > 0) return { x: b.x, y: a.y, w: absDx, h: dy, flipH: true, line };
  return { x: b.x, y: b.y, w: absDx, h: absDy, line };
}

function drawPolygon(pptx, slide, zone, data) {
  const shapes = Array.isArray(data.shapes) ? data.shapes : [];
  if (shapes.length === 0) return;

  const itemLabel     = data.label || '';
  const hasItemLabel  = itemLabel.length > 0;
  const hasItemAnswer = hasItemLabel && itemLabel.includes('||');

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const totalInnerH = zone.h - 2 * PAD;

  // Reserve the item-label band first (capped so it never starves the shapes),
  // honouring a row equaliser's shared band height when one is supplied.
  const naturalItemBand = hasItemAnswer ? ITEM_LABEL_H_ANSWER : ITEM_LABEL_H;
  const itemBandTarget = (typeof zone.polygonLabelBandH === 'number')
    ? zone.polygonLabelBandH : naturalItemBand;
  const itemBandH = hasItemLabel
    ? Math.min(itemBandTarget + ITEM_LABEL_GAP, Math.max(0, totalInnerH * 0.6))
    : 0;
  const shapeAreaH = Math.max(0, totalInnerH - itemBandH);

  // Within the shape area, reserve a per-shape caption band only when some shape
  // actually carries its own label (the multi-named-shape case).
  const hasShapeLabels = shapes.some(function (e) { return e && e.label; });
  const perShapeBand = hasShapeLabels ? (SHAPE_LABEL_H + SHAPE_LABEL_GAP) : 0;
  const shapeBoxH = Math.max(0, shapeAreaH - perShapeBand);

  const colW = (innerW - COL_GAP * (shapes.length - 1)) / shapes.length;
  const shapeBoxW = colW * SHAPE_FRAC_W;

  const showSym   = data.symmetryLines === true;
  const symColour = data.symmetryLinesAnswer ? SYM_COLOUR_ANSWER : SYM_COLOUR;

  shapes.forEach(function (entry, i) {
    const name = String(entry.name || '').toLowerCase();
    const def = SHAPES[name] || { prst: 'rect', ar: 1 };
    const colX = innerX + i * (colW + COL_GAP);

    // Size the shape to the box, honouring its aspect ratio.
    let w = shapeBoxW;
    let h = w * def.ar;
    if (h > shapeBoxH) { h = shapeBoxH; w = h / def.ar; }

    // Resolve the optional teaching extras up front (positions depend on the box,
    // so re-resolve after any fold/verdict shrink below).
    const candPos  = entry.candidate ? String(entry.candidate).toLowerCase() : '';
    const wantFold = entry.fold === true && candPos;
    const verdict  = entry.verdict ? String(entry.verdict).toLowerCase() : '';

    // When a fold ghost or a verdict mark is present it reaches OUTSIDE the shape
    // (the reflected half overhangs; the mark sits to the right), so the shape
    // must shrink to keep the whole composite inside its column — otherwise a
    // single big shape pushes the ghost off the slide. Compute the composite's
    // bounding box in the shape's own unit space, then scale AND offset the shape
    // so the whole composite (not just the shape) is centred and fills the column.
    let sx, sy;
    const hasComposite = (wantFold || verdict === 'pass' || verdict === 'fail');
    if (hasComposite && shapeBoxH > 0.05) {
      const unit = { x: 0, y: 0, w: 1, h: def.ar };   // shape box in its own units
      let minX = 0, minY = 0, maxX = 1, maxY = def.ar;
      if (wantFold) {
        const uv = polygonVerticesFor(name, unit);
        const cl = candidateLineFor(candPos, unit);
        if (uv && cl) {
          const g = reflectOutlineAcrossLine(uv, { x: cl.x1, y: cl.y1 }, { x: cl.x2, y: cl.y2 });
          g.forEach(function (p) {
            if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
          });
        }
      }
      // Verdict mark allowance to the right and top, in unit-box terms.
      if (verdict === 'pass' || verdict === 'fail') {
        const m = VERDICT_FRAC * Math.min(1, def.ar);
        maxX = Math.max(maxX, 1 + m * 1.15);
        minY = Math.min(minY, -m * 0.15);
      }
      const compW = maxX - minX, compH = maxY - minY;
      // Scale so the composite fills the column's shape area (no deadspace).
      const scale = Math.min(shapeBoxW / compW, shapeBoxH / compH);
      w = scale;            // 1 unit of shape width → scale inches
      h = scale * def.ar;
      // Offset so the COMPOSITE is centred in the column and the shape area.
      const compLeft = colX + (colW - compW * scale) / 2;
      const compTop  = innerY + (shapeBoxH - compH * scale) / 2;
      sx = compLeft + (0 - minX) * scale;
      sy = compTop  + (0 - minY) * scale;
    } else {
      sx = colX + (colW - w) / 2;
      sy = innerY + (shapeBoxH - h) / 2;
    }
    const box = { x: sx, y: sy, w: w, h: h };
    const candLine = candPos ? candidateLineFor(candPos, box) : null;

    // 1) FOLD / MIRROR ghost FIRST so it sits UNDER the real shape — the reflected
    // outline coincides with the shape when the candidate is a true axis (clean
    // overlap), and sticks out / leaves a gap when it is not (the visible mismatch).
    if (wantFold) {
      const verts = polygonVerticesFor(name, box);
      if (verts) {
        const a = { x: candLine.x1, y: candLine.y1 };
        const b = { x: candLine.x2, y: candLine.y2 };
        const ghost = reflectOutlineAcrossLine(verts, a, b);
        drawGeomPolygon(pptx, slide, ghost, { fill: FOLD_FILL, lineColor: FOLD_LINE, width: FOLD_PT });
      }
    }

    // 2) The shape itself. A preset (square, rectangle, equilateral triangle,
    // pentagon, hexagon, rhombus, right-triangle, trapezium) draws via addShape;
    // a shape with no faithful preset (isosceles/scalene triangle, kite) draws
    // from its honest vertices as a custGeom freeform. A shape carrying a
    // candidate line or fold ALSO draws from vertices (when it has them) so the
    // candidate line and the reflected ghost come from the identical geometry as
    // the drawn outline — the parallelogram preset's skew, for instance, need not
    // exactly match the unit verts, so drawing both from verts keeps them aligned.
    const verts = polygonVerticesFor(name, box);
    const drawFromVerts = verts && (def.custom || candLine || wantFold);
    if (drawFromVerts) {
      drawGeomPolygon(pptx, slide, verts, { fill: SHAPE_FILL, lineColor: SHAPE_LINE, width: SHAPE_PT });
    } else {
      slide.addShape(def.prst, {
        x: sx, y: sy, w: w, h: h,
        fill: { color: SHAPE_FILL }, line: { color: SHAPE_LINE, width: SHAPE_PT }
      });
    }

    // 3a) FULL correct set of symmetry lines (answer-slide overlay). The shape is
    // unchanged; a shape with no axis (parallelogram, trapezium, scalene/right
    // triangle) draws nothing, which is correct.
    if (showSym) {
      symmetryLinesFor(name, box).forEach(function (ln) {
        drawSymLine(pptx, slide, ln.x1, ln.y1, ln.x2, ln.y2, symColour);
      });
    }

    // 3b) The SINGLE candidate line being tested (teaching slide). Drawn dashed in
    // a strong neutral so it reads as "the line we are trying", not an answer.
    if (candLine) {
      const line = { color: CAND_COLOUR, width: CAND_PT, dashType: 'dash' };
      slide.addShape(pptx.shapes.LINE, Object.assign(
        lineSeg({ x: candLine.x1, y: candLine.y1 }, { x: candLine.x2, y: candLine.y2 }, CAND_COLOUR, CAND_PT),
        { line }
      ));
    }

    // 4) PASS / FAIL verdict mark, big, in the shape's top-right corner.
    if (verdict === 'pass' || verdict === 'fail') {
      const mark = VERDICT_FRAC * Math.min(w, h);
      const mcx = Math.min(sx + w + mark * 0.1, innerX + innerW - mark * 0.55);
      const mcy = Math.max(sy + mark * 0.55, innerY + mark * 0.55);
      if (verdict === 'pass') drawTick(pptx, slide, mcx, mcy, mark);
      else drawCross(pptx, slide, mcx, mcy, mark);
    }

    if (entry.label) {
      slide.addText(String(entry.label), {
        x: colX, y: innerY + shapeBoxH + SHAPE_LABEL_GAP, w: colW, h: SHAPE_LABEL_H,
        fontFace: FONT, fontSize: SHAPE_LABEL_FONT, bold: true, color: COLOURS.body,
        align: 'center', valign: 'middle', margin: 0, fit: FIT
      });
    }
  });

  if (hasItemLabel && itemBandH > 0.05) {
    slide.addText(splitAnswerRuns(itemLabel, hasItemAnswer), {
      x: innerX, y: innerY + shapeAreaH + ITEM_LABEL_GAP,
      w: innerW, h: Math.max(0.1, itemBandH - ITEM_LABEL_GAP),
      fontFace: FONT, fontSize: hasItemAnswer ? ITEM_LABEL_FONT_ANSWER : ITEM_LABEL_FONT,
      bold: hasItemAnswer, color: COLOURS.body,
      align: 'center', valign: 'middle', margin: 0, fit: FIT
    });
  }
}

module.exports = { drawPolygon, polygonLabelBandHeight };
