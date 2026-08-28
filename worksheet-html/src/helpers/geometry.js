"use strict";

// Shapes, turns, and the one helper on the whole sheet that is an INSTRUMENT.
//
// All four are drawn inline here as SVG: proportions, stroke weights, label
// offsets and Comic Sans sizing are established, so a sheet built here prints
// the picture a teacher recognises. Everything to do with `sharp`, PNG buffers
// and DPI multipliers is dropped: inline SVG stays sharp at any size and needs
// no image library.
//
// The helper names end in `-question` or `-row`. Here a question is its own
// helper stacked beside the visual, so the suffixes go and the drawing spec is
// what is left: `{ helper: "shape", type: "rectangle", ... }`.
//
// Each builder returns { svg, aspect, ...whatever `needs` reuses } so `measure`
// and `needs` work from the SAME geometry the render used and cannot drift.

const { esc, heightFromAspect } = require("./shared");

const INK = "var(--colour-ink)";
const FONT = "var(--font)";

// The angle label inside a shape is the deck's blue, which is the colour that
// marks the thing being asked about everywhere else on the page.
const ANGLE = "var(--colour-question)";

// Orange for anything HANDED to the child on a drawing: the rotation arrow that
// shows which turn was made, the arrow that marks a value already placed on the
// ruler. This is drawn.js's own reading of the number line's arrow, kept
// because the two drawings sit side by side in the same lesson.
const GIVEN = "var(--colour-given)";
const OBJECT = "var(--colour-question)";

// A drawing bounded by its own width gains nothing from spare page height: the
// aspect is already filled, so extra room would sit under it as blank padding.
const NEVER_STRETCH = 0;

function polyStr(pts) {
  return pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

// ─── shape ───────────────────────────────────────────────────────────────
// A 2D shape with its measurements written on the sides: the picture a child
// reads to find a perimeter, an area, or a missing length.
//
// This is NOT the `triangle` helper in visuals.js. That one is a classified
// triangle (tick marks on equal sides, no measurements) for "what kind of
// triangle is this?"; this one carries numbers on its sides.
//
// Spec (camelCase):
//   type        "rectangle" | "right-triangle" | "triangle" | "regular-polygon"
//   aspect      rectangle only, width:height. Default 2.5.
//   labels      rectangle { top, right, bottom, left } | right-triangle
//               { base, height, hypotenuse }. Any subset; only labelled sides
//               are written on.
//   style       triangle: "equilateral" | "isosceles" | "scalene" | "right"
//   sideLabels  triangle [side0, side1, side2]
//   angleLabels triangle [angle0, angle1, angle2], written inside in blue
//   sides       regular-polygon, 3 to 10
//   sideLabel   regular-polygon, written on the bottom side

const BODY_W = 250; // every shape body is drawn inside this box, so a hexagon
const BODY_H = 160; // and a rectangle print at comparable size on one sheet
const LABEL_FONT = 26;
const ANGLE_FONT = 22;
const LABEL_OFFSET = 40; // from a side's midpoint out to its label's centre
const ANGLE_OFFSET = 36; // from a vertex in towards the centroid
const CHAR_W = 0.65; // Comic Sans advance, for estimating a label's extent
const SHAPE_MARGIN = 12;

const SHAPE_CAP_MM = 90; // one shape should not swallow a page
const SHAPE_MIN_BODY_MM = 34; // narrower than this and a labelled side is a smudge
const POLY_SIDE_MIN_MM = 6; // each side of a regular polygon needs this much
                            // perimeter to read as its own straight edge

function makeBounds() {
  return { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
}
function expandPt(b, x, y) {
  b.minX = Math.min(b.minX, x);
  b.maxX = Math.max(b.maxX, x);
  b.minY = Math.min(b.minY, y);
  b.maxY = Math.max(b.maxY, y);
}
function expandText(b, x, y, text, fontSize, anchor) {
  const w = String(text).length * fontSize * CHAR_W;
  const left = anchor === "end" ? x - w : anchor === "middle" ? x - w / 2 : x;
  const right = anchor === "end" ? x : anchor === "middle" ? x + w / 2 : x + w;
  expandPt(b, left, y - fontSize / 2);
  expandPt(b, right, y + fontSize / 2);
}

function centroid(pts) {
  return [
    pts.reduce((s, p) => s + p[0], 0) / pts.length,
    pts.reduce((s, p) => s + p[1], 0) / pts.length,
  ];
}
function norm(v) {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
  return len === 0 ? [0, 0] : [v[0] / len, v[1] / len];
}
function outwardNormal(p1, p2, c) {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const len = Math.sqrt(dx * dx + dy * dy);
  let nx = -dy / len;
  let ny = dx / len;
  const mx = (p1[0] + p2[0]) / 2;
  const my = (p1[1] + p2[1]) / 2;
  if (nx * (c[0] - mx) + ny * (c[1] - my) > 0) {
    nx = -nx;
    ny = -ny;
  }
  return [nx, ny];
}

// Scale vertices to fit inside targetW × targetH, centred.
function fitInBox(verts, targetW, targetH) {
  const xs = verts.map((v) => v[0]);
  const ys = verts.map((v) => v[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const srcW = maxX - minX || 1;
  const srcH = maxY - minY || 1;
  const scale = Math.min(targetW / srcW, targetH / srcH);
  const shiftX = (targetW - srcW * scale) / 2;
  const shiftY = (targetH - srcH * scale) / 2;
  return verts.map((v) => [shiftX + (v[0] - minX) * scale, shiftY + (v[1] - minY) * scale]);
}

// SVG coords: y grows downward, so an apex at the top is a small y.
function triangleVerts(style) {
  switch (style) {
    case "equilateral":
      return [[50, 0], [100, 86.6], [0, 86.6]];
    case "isosceles":
      return [[50, 0], [90, 100], [10, 100]];
    case "right": // right angle at pts[0], the bottom-left
      return [[0, 100], [100, 100], [0, 0]];
    default:
      return [[30, 0], [100, 90], [0, 100]]; // scalene
  }
}

function rightAngleSvg(v, p1, p2, size = 12) {
  const d1 = norm([p1[0] - v[0], p1[1] - v[1]]);
  const d2 = norm([p2[0] - v[0], p2[1] - v[1]]);
  const a = [v[0] + d1[0] * size, v[1] + d1[1] * size];
  const bm = [v[0] + d1[0] * size + d2[0] * size, v[1] + d1[1] * size + d2[1] * size];
  const c2 = [v[0] + d2[0] * size, v[1] + d2[1] * size];
  return `<polyline points="${polyStr([a, bm, c2])}" fill="none" stroke="${INK}" stroke-width="1.5"/>`;
}

function sideLabelSvg(p1, p2, c, text, b) {
  const mx = (p1[0] + p2[0]) / 2;
  const my = (p1[1] + p2[1]) / 2;
  const [nx, ny] = outwardNormal(p1, p2, c);
  const tx = mx + nx * LABEL_OFFSET;
  const ty = my + ny * LABEL_OFFSET;
  expandText(b, tx, ty, text, LABEL_FONT, "middle");
  return `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${LABEL_FONT}" fill="${INK}">${esc(text)}</text>`;
}

function angleLabelSvg(v, c, text, b) {
  const d = norm([c[0] - v[0], c[1] - v[1]]);
  const tx = v[0] + d[0] * ANGLE_OFFSET;
  const ty = v[1] + d[1] * ANGLE_OFFSET;
  expandText(b, tx, ty, text, ANGLE_FONT, "middle");
  return `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${ANGLE_FONT}" fill="${ANGLE}">${esc(text)}</text>`;
}

function rectLabelSvg(x, y, text, anchor, b) {
  expandText(b, x, y, text, LABEL_FONT, anchor);
  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" dominant-baseline="central" font-family="${FONT}" font-size="${LABEL_FONT}" fill="${INK}">${esc(text)}</text>`;
}

function buildShapeSvg(spec) {
  const type = spec.type;
  const parts = [];
  const b = makeBounds(); // everything, labels included: this is the crop
  const body = makeBounds(); // the drawn shape alone: this is what must stay big
  let polygonSides = 0;

  if (type === "rectangle") {
    const aspect = spec.aspect ?? 2.5;
    let w = BODY_W;
    let h = Math.round(BODY_W / aspect);
    if (h > BODY_H) {
      h = BODY_H;
      w = Math.round(BODY_H * aspect);
    }
    const x1 = (BODY_W - w) / 2;
    const y1 = (BODY_H - h) / 2;
    const x2 = x1 + w;
    const y2 = y1 + h;

    parts.push(
      `<rect x="${x1}" y="${y1}" width="${w}" height="${h}" fill="none" stroke="${INK}" stroke-width="2.5"/>`
    );
    expandPt(b, x1, y1);
    expandPt(b, x2, y2);
    expandPt(body, x1, y1);
    expandPt(body, x2, y2);

    const lbl = spec.labels ?? {};
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    if (lbl.top) parts.push(rectLabelSvg(cx, y1 - 20, lbl.top, "middle", b));
    if (lbl.bottom) parts.push(rectLabelSvg(cx, y2 + 20, lbl.bottom, "middle", b));
    if (lbl.left) parts.push(rectLabelSvg(x1 - 16, cy, lbl.left, "end", b));
    if (lbl.right) parts.push(rectLabelSvg(x2 + 16, cy, lbl.right, "start", b));
  } else if (type === "right-triangle") {
    const ratio = 0.65;
    let tw = BODY_W;
    let th = Math.round(BODY_W * ratio);
    if (th > BODY_H) {
      th = BODY_H;
      tw = Math.round(BODY_H / ratio);
    }
    const offX = (BODY_W - tw) / 2;
    const offY = (BODY_H - th) / 2;
    const bl = [offX, offY + th]; // the right angle
    const br = [offX + tw, offY + th];
    const tl = [offX, offY];
    const pts = [bl, br, tl];
    const c = centroid(pts);

    parts.push(`<polygon points="${polyStr(pts)}" fill="none" stroke="${INK}" stroke-width="2.5"/>`);
    parts.push(rightAngleSvg(bl, br, tl));
    pts.forEach((p) => {
      expandPt(b, p[0], p[1]);
      expandPt(body, p[0], p[1]);
    });

    const lbl = spec.labels ?? {};
    if (lbl.base) parts.push(sideLabelSvg(bl, br, c, lbl.base, b));
    if (lbl.height) parts.push(sideLabelSvg(bl, tl, c, lbl.height, b));
    if (lbl.hypotenuse) parts.push(sideLabelSvg(br, tl, c, lbl.hypotenuse, b));
  } else if (type === "triangle") {
    const raw = spec.vertices ?? triangleVerts(spec.style ?? "scalene");
    const pts = fitInBox(raw, BODY_W, BODY_H);
    const c = centroid(pts);

    parts.push(`<polygon points="${polyStr(pts)}" fill="none" stroke="${INK}" stroke-width="2.5"/>`);
    if (spec.style === "right") parts.push(rightAngleSvg(pts[0], pts[1], pts[2]));
    pts.forEach((p) => {
      expandPt(b, p[0], p[1]);
      expandPt(body, p[0], p[1]);
    });

    const sl = spec.sideLabels ?? [];
    const al = spec.angleLabels ?? [];
    if (sl[0]) parts.push(sideLabelSvg(pts[0], pts[1], c, sl[0], b));
    if (sl[1]) parts.push(sideLabelSvg(pts[1], pts[2], c, sl[1], b));
    if (sl[2]) parts.push(sideLabelSvg(pts[2], pts[0], c, sl[2], b));
    if (al[0]) parts.push(angleLabelSvg(pts[0], c, al[0], b));
    if (al[1]) parts.push(angleLabelSvg(pts[1], c, al[1], b));
    if (al[2]) parts.push(angleLabelSvg(pts[2], c, al[2], b));
  } else if (type === "regular-polygon") {
    const n = spec.sides ?? 6;
    polygonSides = n;
    const raw = [];
    for (let i = 0; i < n; i++) {
      const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
      raw.push([Math.cos(angle), Math.sin(angle)]);
    }
    const pts = fitInBox(raw, BODY_W, BODY_H);
    const c = centroid(pts);

    parts.push(`<polygon points="${polyStr(pts)}" fill="none" stroke="${INK}" stroke-width="2.5"/>`);
    pts.forEach((p) => {
      expandPt(b, p[0], p[1]);
      expandPt(body, p[0], p[1]);
    });

    if (spec.sideLabel) {
      let bestIdx = 0;
      let bestY = -Infinity;
      for (let i = 0; i < n; i++) {
        const avgY = (pts[i][1] + pts[(i + 1) % n][1]) / 2;
        if (avgY > bestY) {
          bestY = avgY;
          bestIdx = i;
        }
      }
      parts.push(sideLabelSvg(pts[bestIdx], pts[(bestIdx + 1) % n], c, spec.sideLabel, b));
    }
  } else {
    throw new Error(
      `UNKNOWN_SHAPE: "${type}". Known: rectangle, right-triangle, triangle, regular-polygon`
    );
  }

  const vx = b.minX - SHAPE_MARGIN;
  const vy = b.minY - SHAPE_MARGIN;
  const vw = b.maxX - b.minX + SHAPE_MARGIN * 2;
  const vh = b.maxY - b.minY + SHAPE_MARGIN * 2;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx.toFixed(1)} ${vy.toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}">${parts.join("")}</svg>`;

  return {
    svg,
    aspect: vw / vh,
    unitsWide: vw,
    bodyWidthUnits: body.maxX - body.minX,
    polygonSides,
  };
}

function renderShape(spec) {
  return `<div class="h-figure">${buildShapeSvg(spec).svg}</div>`;
}

function measureShape(spec, widthMm) {
  return heightFromAspect(buildShapeSvg(spec).aspect, widthMm, SHAPE_CAP_MM);
}

function needsShape(spec) {
  const { aspect, unitsWide, bodyWidthUnits, polygonSides } = buildShapeSvg(spec);

  // The zone's width is spent on the shape AND on whatever is written around
  // it, so a rectangle with a measurement on all four sides needs a wider zone
  // than the same rectangle with none: the labels push the body down to a
  // smaller share of the same crop. Working it out from the crop the render
  // actually produced means it cannot be forgotten when a label is added.
  const labelOverhead = unitsWide / bodyWidthUnits;
  const minWidthMm = Math.max(
    SHAPE_MIN_BODY_MM * labelOverhead,
    polygonSides * POLY_SIDE_MIN_MM
  );

  return { minWidthMm, minHeightMm: heightFromAspect(aspect, minWidthMm, SHAPE_CAP_MM) };
}

// ─── triangle-square ─────────────────────────────────────────────────────
// The SATs part-whole puzzle: two triangles stacked on the left, joined by
// lines to a square on the right, the arrow pointing INTO the square. The two
// triangles add up to the square. Exactly one of the three is blank, and that
// blank is the question: blank square means add, blank triangle means subtract.
//
// Spec:
//   triangles  [upper, lower] strings; "" for the unknown
//   square     string; "" for the unknown

const TS_TRI_H = 96;
const TS_TRI_GAP = 28;
const TS_H_GAP = 70;
const TS_NUM_FONT = 34;
const TS_STROKE_W = 2.5;
const TS_PAD = 10;
const TS_NUM_Y_FRAC = 0.78; // the number sits low, where the body is widest
const TS_CHAR_W = 0.66;

const TS_CAP_MM = 100;
// A child WRITES in the blank shape, so the floor is handwriting room, and how
// much of that is needed depends on the numbers in the question: an answer of
// "130" and an answer of "9203" do not need the same box. The triangle asks for
// more per digit than the square because its sloped sides eat into the space a
// child actually has to write across.
const TS_SQUARE_MIN_MM = 14;
const TS_TRIANGLE_MIN_MM = 16;
const TS_SQUARE_PER_DIGIT_MM = 5;
const TS_TRIANGLE_PER_DIGIT_MM = 5.5;

function triangleSquareValues(spec) {
  const triangles = spec.triangles || ["", ""];
  const upper = String(triangles[0] ?? "");
  const lower = String(triangles[1] ?? "");
  const square = String(spec.square ?? "");

  // A puzzle with two blanks has no answer, and one with none is not a
  // question at all. Both print perfectly happily, which is exactly why this
  // is checked here rather than left to be noticed on the printed sheet.
  const blanks = [upper, lower, square].filter((v) => v.trim() === "").length;
  if (blanks !== 1) {
    throw new Error(
      `TRIANGLE_SQUARE_BLANKS: exactly one of the two triangles and the square ` +
        `must be "" (the unknown the child fills in), but ${blanks} were blank ` +
        `in [${upper}, ${lower}] → [${square}].`
    );
  }
  return { upper, lower, square };
}

function buildTriangleSquareSvg(spec) {
  const { upper, lower, square } = triangleSquareValues(spec);

  // The shapes widen with the longest number so a four-digit SATs value sits
  // inside the body instead of spilling over the sloped sides. The binding
  // edge is the TOP of the digits, where the triangle is narrowest.
  const maxDigits = Math.max(1, upper.length, lower.length, square.length);
  const numW = maxDigits * TS_NUM_FONT * TS_CHAR_W;
  const yTopFrac = TS_NUM_Y_FRAC - TS_NUM_FONT / 2 / TS_TRI_H;
  const triW = Math.max(110, Math.ceil(numW / 0.88 / yTopFrac));
  const sq = Math.max(84, Math.ceil(numW / 0.8) + 24);

  const triLeftX = TS_PAD;
  const upperTop = TS_PAD;
  const lowerTop = upperTop + TS_TRI_H + TS_TRI_GAP;
  const midY = (upperTop + lowerTop + TS_TRI_H) / 2;
  const sqX = triLeftX + triW + TS_H_GAP;
  const sqY = midY - sq / 2;

  const totalW = sqX + sq + TS_PAD;
  const totalH = lowerTop + TS_TRI_H + TS_PAD;

  const els = [];

  function triangle(topY, text) {
    const apex = [triLeftX + triW / 2, topY];
    const bl = [triLeftX, topY + TS_TRI_H];
    const br = [triLeftX + triW, topY + TS_TRI_H];
    els.push(
      `<polygon points="${polyStr([apex, br, bl])}" fill="none" stroke="${INK}" stroke-width="${TS_STROKE_W}" stroke-linejoin="round"/>`
    );
    if (text !== "") {
      const ty = topY + TS_TRI_H * TS_NUM_Y_FRAC;
      els.push(
        `<text x="${(triLeftX + triW / 2).toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${TS_NUM_FONT}" fill="${INK}">${esc(text)}</text>`
      );
    }
    return [triLeftX + triW * 0.78, topY + TS_TRI_H * 0.6];
  }

  const upperConnect = triangle(upperTop, upper);
  const lowerConnect = triangle(lowerTop, lower);
  const sqLeftMid = [sqX, midY];

  els.push(
    `<line x1="${upperConnect[0].toFixed(1)}" y1="${upperConnect[1].toFixed(1)}" x2="${sqLeftMid[0].toFixed(1)}" y2="${sqLeftMid[1].toFixed(1)}" stroke="${INK}" stroke-width="${TS_STROKE_W}"/>`
  );
  els.push(
    `<line x1="${lowerConnect[0].toFixed(1)}" y1="${lowerConnect[1].toFixed(1)}" x2="${sqLeftMid[0].toFixed(1)}" y2="${sqLeftMid[1].toFixed(1)}" stroke="${INK}" stroke-width="${TS_STROKE_W}"/>`
  );

  const ah = 9;
  els.push(
    `<polygon points="${polyStr([
      [sqLeftMid[0], sqLeftMid[1]],
      [sqLeftMid[0] - ah, sqLeftMid[1] - ah * 0.7],
      [sqLeftMid[0] - ah, sqLeftMid[1] + ah * 0.7],
    ])}" fill="${INK}" stroke="none"/>`
  );

  els.push(
    `<rect x="${sqX}" y="${sqY.toFixed(1)}" width="${sq}" height="${sq}" fill="none" stroke="${INK}" stroke-width="${TS_STROKE_W}"/>`
  );
  if (square !== "") {
    els.push(
      `<text x="${(sqX + sq / 2).toFixed(1)}" y="${midY.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${TS_NUM_FONT}" fill="${INK}">${esc(square)}</text>`
    );
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}">${els.join("")}</svg>`;
  return { svg, aspect: totalW / totalH, totalW, triW, sq, maxDigits };
}

function renderTriangleSquare(spec) {
  return `<div class="h-figure">${buildTriangleSquareSvg(spec).svg}</div>`;
}

function measureTriangleSquare(spec, widthMm) {
  return heightFromAspect(buildTriangleSquareSvg(spec).aspect, widthMm, TS_CAP_MM);
}

function needsTriangleSquare(spec) {
  const { aspect, totalW, triW, sq, maxDigits } = buildTriangleSquareSvg(spec);

  // The blank shape is where a child writes, so the floor is set by the SHAPE
  // that has to be big enough to write in, not by the drawing overall: each
  // shape's own minimum, scaled back up by its share of the picture.
  const squareMm = Math.max(TS_SQUARE_MIN_MM, maxDigits * TS_SQUARE_PER_DIGIT_MM);
  const triangleMm = Math.max(TS_TRIANGLE_MIN_MM, maxDigits * TS_TRIANGLE_PER_DIGIT_MM);
  const minWidthMm = Math.max((squareMm * totalW) / sq, (triangleMm * totalW) / triW);

  return { minWidthMm, minHeightMm: heightFromAspect(aspect, minWidthMm, TS_CAP_MM) };
}

// ─── turn-diagram ────────────────────────────────────────────────────────
// "Angle as a turn": two black rays from a vertex, the start ray pointing up,
// with a curved arrow sweeping from one to the other. The child names the turn
// (quarter / half / three-quarter / full, clockwise or anticlockwise).
//
// This serves both a single diagram and a row: `turns` is a row, and a single
// diagram is the row with one in it.
// A single turn can also be written straight onto the spec, which is what the
// one-diagram questions in the reference doc look like.
//
// Spec:
//   turns      [{ quarters?, amount?, direction? }, ...]
//   quarters   1 quarter, 2 half, 3 three-quarter, 4 full (single-turn form)
//   amount     the same as a word: "quarter" | "half" | "three-quarter" | "full"
//   direction  "clockwise" (default) | "anticlockwise"
//   letters    true prints (a) (b) (c) above the diagrams so a child can refer
//              to them in an answer

const TURN_UNIT = 280; // fixed canvas size that preserves the established
                       // proportions inside a diagram
const TURN_GAP = 40;
const TURN_LABEL_H = 60;
const TURN_LABEL_FONT = 42;
const TURN_START_ANGLE = -90; // the start ray points straight up
const TURN_FULL_CAP_DEG = 350; // a full turn stops just short so its arrow shows

const TURN_CAP_MM = 80;
const TURN_MIN_MM = 24; // matches the clock face's floor in drawn.js: the same
                        // size of circle, with about as much fine detail on it,
                        // and below this the arrowhead closes up on its arc
const TURN_GAP_MIN_MM = 5;

const AMOUNT_QUARTERS = {
  quarter: 1,
  half: 2,
  "three-quarter": 3,
  "three-quarters": 3,
  threequarter: 3,
  full: 4,
  whole: 4,
};

function resolveTurn(spec) {
  let quarters = Number(spec.quarters);
  if (!Number.isFinite(quarters) || quarters <= 0) {
    const word = String(spec.amount || "").trim().toLowerCase().replace(/\s+/g, "-");
    quarters = AMOUNT_QUARTERS[word] || 1;
  }
  const direction = spec.direction === "anticlockwise" ? "anticlockwise" : "clockwise";
  return { quarters, direction };
}

function turnList(spec) {
  if (Array.isArray(spec.turns) && spec.turns.length) return spec.turns;
  return [{ quarters: spec.quarters, amount: spec.amount, direction: spec.direction }];
}

function turnParts(spec, offsetX, offsetY) {
  const size = TURN_UNIT;
  const { quarters, direction } = resolveTurn(spec);

  const cx = offsetX + size / 2;
  const cy = offsetY + size / 2;
  const pad = size * 0.14;
  const R = size / 2 - pad;
  const arcR = R * 0.52;
  const rayW = size * 0.013;
  const arcW = size * 0.016;
  const dotR = size * 0.02;

  // SVG y grows downward, so a positive sweep runs clockwise on the page.
  const dir = direction === "clockwise" ? 1 : -1;
  const sweepDeg = quarters * 90;
  const arcSweepDeg = Math.min(sweepDeg, TURN_FULL_CAP_DEG);
  const endRayAngle = TURN_START_ANGLE + dir * sweepDeg;
  const arcEndAngle = TURN_START_ANGLE + dir * arcSweepDeg;

  const pt = (angle, radius) => ({
    x: cx + radius * Math.cos(toRad(angle)),
    y: cy + radius * Math.sin(toRad(angle)),
  });
  const f = (n) => n.toFixed(2);

  const startTip = pt(TURN_START_ANGLE, R);
  const endTip = pt(endRayAngle, R);
  const arcStart = pt(TURN_START_ANGLE, arcR);
  const arcEnd = pt(arcEndAngle, arcR);
  const sweepFlag = dir > 0 ? 1 : 0;
  const largeArcFlag = arcSweepDeg > 180 ? 1 : 0;

  const parts = [];
  parts.push(
    `<line x1="${f(cx)}" y1="${f(cy)}" x2="${f(startTip.x)}" y2="${f(startTip.y)}" stroke="${INK}" stroke-width="${f(rayW)}" stroke-linecap="round" marker-end="url(#turnRay)"/>`
  );
  parts.push(
    `<line x1="${f(cx)}" y1="${f(cy)}" x2="${f(endTip.x)}" y2="${f(endTip.y)}" stroke="${INK}" stroke-width="${f(rayW)}" stroke-linecap="round" marker-end="url(#turnRay)"/>`
  );
  parts.push(
    `<path d="M ${f(arcStart.x)} ${f(arcStart.y)} A ${f(arcR)} ${f(arcR)} 0 ${largeArcFlag} ${sweepFlag} ${f(arcEnd.x)} ${f(arcEnd.y)}" fill="none" stroke="${GIVEN}" stroke-width="${f(arcW)}" stroke-linecap="round" marker-end="url(#turnSweep)"/>`
  );
  parts.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(dotR)}" fill="${INK}"/>`);
  return parts;
}

function buildTurnRowSvg(spec) {
  const turns = turnList(spec);
  const n = turns.length;
  const letters = !!spec.letters;
  const labelH = letters ? TURN_LABEL_H : 0;

  const totalW = n * TURN_UNIT + (n - 1) * TURN_GAP;
  const totalH = labelH + TURN_UNIT;

  // Both markers are the same size and colour in every turn diagram ever
  // drawn, so two of these on one page share ids harmlessly.
  const ah = TURN_UNIT * 0.075;
  const f = (v) => v.toFixed(2);
  const marker = (id, colour) =>
    `<marker id="${id}" markerUnits="userSpaceOnUse" markerWidth="${f(ah)}" markerHeight="${f(ah)}" refX="${f(ah)}" refY="${f(ah / 2)}" orient="auto">` +
    `<path d="M0,0 L${f(ah)},${f(ah / 2)} L0,${f(ah)} Z" fill="${colour}"/></marker>`;

  const parts = [`<defs>${marker("turnRay", INK)}${marker("turnSweep", GIVEN)}</defs>`];

  turns.forEach((turn, i) => {
    const x = i * (TURN_UNIT + TURN_GAP);
    if (letters) {
      parts.push(
        `<text x="${x + TURN_UNIT / 2}" y="${labelH / 2}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${TURN_LABEL_FONT}" font-weight="bold" fill="${INK}">(${String.fromCharCode(97 + i)})</text>`
      );
    }
    parts.push(...turnParts(turn, x, labelH));
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}">${parts.join("")}</svg>`;
  return { svg, aspect: totalW / totalH, count: n };
}

function renderTurnDiagram(spec) {
  return `<div class="h-figure">${buildTurnRowSvg(spec).svg}</div>`;
}

function measureTurnDiagram(spec, widthMm) {
  return heightFromAspect(buildTurnRowSvg(spec).aspect, widthMm, TURN_CAP_MM);
}

function needsTurnDiagram(spec) {
  const { aspect, count } = buildTurnRowSvg(spec);
  // Four turns to match against four labels is four drawings' worth of width,
  // not one: a floor that ignored the count would approve a row of six into a
  // zone where each diagram came out the size of a stamp.
  const minWidthMm = count * TURN_MIN_MM + (count - 1) * TURN_GAP_MIN_MM;
  return { minWidthMm, minHeightMm: heightFromAspect(aspect, minWidthMm, TURN_CAP_MM) };
}

// ─── ruler ───────────────────────────────────────────────────────────────
//
// A RULER IS A MEASURING INSTRUMENT, NOT A PICTURE OF ONE.
//
// Every other drawing on this sheet is an SVG scaled to fill whatever width its
// zone gives it. If a ruler were treated the same way, its centimetres would
// stop being centimetres the moment the zone was any width but one, and every
// answer a child read off it would be wrong - wrong in the worst way available,
// because the sheet would look completely normal and the child would be marked
// down for measuring correctly.
//
// So this helper prints at TRUE SIZE, in real millimetres, and REFUSES a zone
// too narrow to hold it rather than shrinking to fit. Three things enforce that
// together, and none of them works alone:
//
//   1. the SVG carries an explicit width and height in mm, and its viewBox is
//      1 unit = 1 mm, so the drawing is laid out in the unit it prints in;
//   2. `.h-ruler` is its own class, NOT `.h-figure`, precisely so the
//      `width: 100%` rule that scales every other drawing cannot reach it;
//   3. `needs` reports the ruler's true width, so a zone narrower than the
//      ruler fails the fit check before anything is drawn.
//
// If you change any of those, change all three. Scaling this drawing is not a
// layout compromise; it is a wrong answer printed on a child's sheet.
//
// Spec:
//   start           left-hand value. Default 0.
//   end             right-hand value. Required.
//   unit            "cm" (default) | "mm" | "m". Sets the true size of one
//                   unit on paper, so it is arithmetic, not a caption.
//   majorInterval   labelled tick spacing. Default 1.
//   minorInterval   small tick spacing. Default majorInterval / 2.
//   arrow           { at, label?, answerBox? } an arrow above the scale
//   object          { from, to, label? } a bar to measure ("how long is the
//                   pencil?")

const RULER_MM_PER_UNIT = { cm: 10, mm: 1, m: 1000 };

const R_MARGIN_X = 5; // paper either side of the scale itself
const R_UNIT_ROOM = 9; // extra on the right when the unit is printed
const R_TOP_PAD = 1.5;
const R_BOTTOM_PAD = 1.5;
const R_TICK_MINOR = 2.6;
const R_TICK_MAJOR = 4.4;
const R_FONT = 3.6; // ≈10pt at true size, comfortably over the 9pt floor
const R_LABEL_GAP = 1.6;
const R_LABEL_ROW = 4.4;
const R_ARROW_H = 9;
const R_ARROW_GAP = 1.5;
const R_BOX = 9;
const R_BOX_GAP = 2;
const R_OBJECT_BAR_H = 2.2;
const R_OBJECT_GAP = 2;

function rulerGeometry(spec) {
  const start = spec.start ?? 0;
  const end = spec.end;
  if (!Number.isFinite(end) || end <= start) {
    throw new Error(`RULER_LENGTH: a ruler runs from ${start} to ${end}, which is not a length.`);
  }

  const unit = spec.unit === undefined ? "cm" : spec.unit;
  const showUnit = unit !== null && unit !== "";
  const mmPerUnit = RULER_MM_PER_UNIT[showUnit ? unit : "cm"];
  if (!mmPerUnit) {
    throw new Error(
      `RULER_UNIT: "${unit}" has no true size on paper. Known: ${Object.keys(RULER_MM_PER_UNIT).join(", ")}.`
    );
  }

  const majorInterval = spec.majorInterval ?? 1;
  const minorInterval = spec.minorInterval ?? majorInterval / 2;
  if (!(majorInterval > 0) || !(minorInterval > 0)) {
    throw new Error(`RULER_INTERVAL: intervals must be positive, got major ${majorInterval} and minor ${minorInterval}.`);
  }

  const arrow = spec.arrow;
  const object = spec.object;
  const arrowSpace = arrow ? R_ARROW_H + R_ARROW_GAP + (arrow.answerBox ? R_BOX + R_BOX_GAP : 0) : 0;
  const objectSpace = object ? R_OBJECT_BAR_H + R_OBJECT_GAP + (object.label ? R_FONT + 1 : 0) : 0;

  const axisY = R_TOP_PAD + arrowSpace + objectSpace + R_TICK_MAJOR / 2;
  const heightMm = axisY + R_TICK_MAJOR / 2 + R_LABEL_GAP + R_LABEL_ROW + R_BOTTOM_PAD;

  const spanMm = (end - start) * mmPerUnit;
  const widthMm = R_MARGIN_X * 2 + spanMm + (showUnit ? R_UNIT_ROOM : 0);

  return {
    start,
    end,
    unit,
    showUnit,
    mmPerUnit,
    majorInterval,
    minorInterval,
    arrow,
    object,
    arrowSpace,
    objectSpace,
    axisY,
    widthMm,
    heightMm,
    spanMm,
  };
}

function tidy(value) {
  return Math.round(value * 1e9) / 1e9;
}

function buildRulerSvg(spec) {
  const g = rulerGeometry(spec);
  const x = (value) => R_MARGIN_X + (value - g.start) * g.mmPerUnit;
  const f = (n) => n.toFixed(2);
  const parts = [];

  parts.push(
    `<line x1="${f(x(g.start))}" y1="${f(g.axisY)}" x2="${f(x(g.end))}" y2="${f(g.axisY)}" stroke="${INK}" stroke-width="0.5" stroke-linecap="square"/>`
  );

  const steps = Math.round((g.end - g.start) / g.minorInterval);
  for (let i = 0; i <= steps; i++) {
    const value = tidy(g.start + i * g.minorInterval);
    const stepsOfMajor = (value - g.start) / g.majorInterval;
    const isMajor = Math.abs(stepsOfMajor - Math.round(stepsOfMajor)) < 1e-6;
    const h = isMajor ? R_TICK_MAJOR : R_TICK_MINOR;
    parts.push(
      `<line x1="${f(x(value))}" y1="${f(g.axisY - h / 2)}" x2="${f(x(value))}" y2="${f(g.axisY + h / 2)}" stroke="${INK}" stroke-width="0.4"/>`
    );
  }

  const labelY = g.axisY + R_TICK_MAJOR / 2 + R_LABEL_GAP;
  const majorSteps = Math.round((g.end - g.start) / g.majorInterval);
  for (let i = 0; i <= majorSteps; i++) {
    const value = tidy(g.start + i * g.majorInterval);
    parts.push(
      `<text x="${f(x(value))}" y="${f(labelY)}" text-anchor="middle" dominant-baseline="hanging" font-family="${FONT}" font-size="${R_FONT}" fill="${INK}">${esc(String(value))}</text>`
    );
  }

  if (g.showUnit) {
    parts.push(
      `<text x="${f(x(g.end) + 2)}" y="${f(labelY)}" text-anchor="start" dominant-baseline="hanging" font-family="${FONT}" font-size="${R_FONT}" fill="${INK}">${esc(g.unit)}</text>`
    );
  }

  if (g.object) {
    const ox1 = x(g.object.from);
    const ox2 = x(g.object.to);
    const barBaseY = g.axisY - R_TICK_MAJOR / 2 - R_OBJECT_GAP;
    const barTopY = barBaseY - R_OBJECT_BAR_H;
    const midY = barTopY + R_OBJECT_BAR_H / 2;

    parts.push(`<line x1="${f(ox1)}" y1="${f(barTopY)}" x2="${f(ox1)}" y2="${f(barBaseY)}" stroke="${OBJECT}" stroke-width="0.5"/>`);
    parts.push(`<line x1="${f(ox2)}" y1="${f(barTopY)}" x2="${f(ox2)}" y2="${f(barBaseY)}" stroke="${OBJECT}" stroke-width="0.5"/>`);
    parts.push(`<line x1="${f(ox1)}" y1="${f(midY)}" x2="${f(ox2)}" y2="${f(midY)}" stroke="${OBJECT}" stroke-width="0.5"/>`);

    if (g.object.label) {
      parts.push(
        `<text x="${f((ox1 + ox2) / 2)}" y="${f(barTopY - 0.8)}" text-anchor="middle" dominant-baseline="alphabetic" font-family="${FONT}" font-size="${R_FONT}" fill="${OBJECT}">${esc(g.object.label)}</text>`
      );
    }
  }

  if (g.arrow) {
    const ax = x(g.arrow.at);
    const tipY = g.axisY - R_TICK_MAJOR / 2 - g.objectSpace - 0.5;
    const shaftTopY = tipY - R_ARROW_H;

    parts.push(`<line x1="${f(ax)}" y1="${f(shaftTopY)}" x2="${f(ax)}" y2="${f(tipY - 1.6)}" stroke="${GIVEN}" stroke-width="0.7"/>`);
    parts.push(
      `<polygon points="${f(ax - 1.4)},${f(tipY - 2)} ${f(ax + 1.4)},${f(tipY - 2)} ${f(ax)},${f(tipY)}" fill="${GIVEN}"/>`
    );

    if (g.arrow.answerBox) {
      parts.push(
        `<rect x="${f(ax - R_BOX / 2)}" y="${f(shaftTopY - R_BOX_GAP - R_BOX)}" width="${R_BOX}" height="${R_BOX}" fill="white" stroke="${INK}" stroke-width="0.4"/>`
      );
    } else if (g.arrow.label) {
      parts.push(
        `<text x="${f(ax)}" y="${f(shaftTopY - 0.8)}" text-anchor="middle" dominant-baseline="alphabetic" font-family="${FONT}" font-size="${R_FONT}" font-weight="bold" fill="${GIVEN}">${esc(g.arrow.label)}</text>`
      );
    }
  }

  // width and height in REAL MILLIMETRES on the tag, and a viewBox of the same
  // numbers, so one unit inside the drawing is one millimetre on the paper.
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${g.widthMm.toFixed(2)}mm" height="${g.heightMm.toFixed(2)}mm" ` +
    `viewBox="0 0 ${g.widthMm.toFixed(2)} ${g.heightMm.toFixed(2)}" ` +
    `style="width:${g.widthMm.toFixed(2)}mm;height:${g.heightMm.toFixed(2)}mm">${parts.join("")}</svg>`;

  return { svg, widthMm: g.widthMm, heightMm: g.heightMm };
}

function renderRuler(spec) {
  return `<div class="h-ruler">${buildRulerSvg(spec).svg}</div>`;
}

// The width is not an argument here, and that is the whole point: a ruler is
// the same height at every width because it is the same size at every width.
function measureRuler(spec) {
  return buildRulerSvg(spec).heightMm;
}

function needsRuler(spec) {
  const { widthMm, heightMm } = buildRulerSvg(spec);
  // Its true size, exactly. A 10cm scale needs 100mm of paper plus its
  // margins, and no zone narrower than that can hold a ruler at all.
  return { minWidthMm: widthMm, minHeightMm: heightMm };
}

// ─── styling ─────────────────────────────────────────────────────────────
// `.h-figure` is styled once for every scaled SVG helper (in visuals.js), so
// shape, triangle-square and turn-diagram need nothing here.
//
// The ruler needs its own class and one rule: hands off. No padding, border or
// margin appears below, which is what lets `measure` return the SVG's own
// height and be exactly right. `display: block` matters as much as the size: an
// inline SVG sits on a text baseline and collects a descender's worth of space
// underneath it, which is height nobody measured.
const css = `
  .h-ruler { display: block; }

  /* No width rule. The SVG carries its true size in millimetres and must keep
     it: scaled to fit a zone, its centimetres would no longer be centimetres
     and every measurement a child read off it would be wrong. */
  .h-ruler svg { display: block; }
`;

const helpers = {
  shape: {
    render: renderShape,
    measure: measureShape,
    needs: needsShape,
    greed: NEVER_STRETCH,
  },
  "triangle-square": {
    render: renderTriangleSquare,
    measure: measureTriangleSquare,
    needs: needsTriangleSquare,
    greed: NEVER_STRETCH,
  },
  "turn-diagram": {
    render: renderTurnDiagram,
    measure: measureTurnDiagram,
    needs: needsTurnDiagram,
    greed: NEVER_STRETCH,
  },
  ruler: {
    render: renderRuler,
    measure: measureRuler,
    needs: needsRuler,
    // Zero, and not for the usual reason. The others refuse spare height
    // because they would gain nothing by it; this one refuses because taking
    // it would make the ruler lie.
    greed: NEVER_STRETCH,
  },
};

module.exports = { helpers, css };
