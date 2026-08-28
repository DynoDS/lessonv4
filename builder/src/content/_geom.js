'use strict';

// Shared low-level vector drawing for the maths visual helpers (grids, graphs,
// dials, polygons). Everything here takes ABSOLUTE slide inches; callers never
// think in custGeom box-relative units. A custGeom path is emitted with a
// bounding box exactly covering its points, and each point is rebased onto that
// box — which is how PowerPoint's path coordinate space (origin at the shape's
// top-left, spanning the box) actually works.

function bbox(points) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  points.forEach(function (p) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });
  return { minX: minX, minY: minY, maxX: maxX, maxY: maxY, w: maxX - minX, h: maxY - minY };
}

function rebase(points, b) {
  return points.map(function (p, i) {
    const pt = { x: +(p.x - b.minX).toFixed(4), y: +(p.y - b.minY).toFixed(4) };
    if (i === 0) pt.moveTo = true;
    return pt;
  });
}

// A closed polygon through absolute-inch points. opts: { fill, lineColor, width }.
// Omit fill for an outline only; pass lineColor:null for a fill with no border.
function polygon(pptx, slide, points, opts) {
  opts = opts || {};
  if (!points || points.length < 2) return;
  const b = bbox(points);
  const w = Math.max(b.w, 0.001);
  const h = Math.max(b.h, 0.001);
  const pts = rebase(points, b);
  pts.push({ close: true });
  slide.addShape(pptx.ShapeType.custGeom, {
    x: b.minX, y: b.minY, w: w, h: h,
    points: pts,
    fill: opts.fill ? { color: opts.fill } : { type: 'none' },
    line: opts.lineColor === null
      ? { type: 'none' }
      : { color: opts.lineColor || '000000', width: opts.width == null ? 1.5 : opts.width }
  });
}

// An open polyline through absolute-inch points. opts: { lineColor, width, dash }.
function polyline(pptx, slide, points, opts) {
  opts = opts || {};
  if (!points || points.length < 2) return;
  const b = bbox(points);
  const w = Math.max(b.w, 0.001);
  const h = Math.max(b.h, 0.001);
  const line = { color: opts.lineColor || '000000', width: opts.width == null ? 2 : opts.width };
  if (opts.dash) line.dashType = opts.dash;
  slide.addShape(pptx.ShapeType.custGeom, {
    x: b.minX, y: b.minY, w: w, h: h,
    points: rebase(points, b),
    fill: { type: 'none' },
    line: line
  });
}

// A thin axis-aligned rule, drawn as a filled rectangle (crisper than a 0-height
// line and never picks up a stray border). thickness is in inches.
function rule(pptx, slide, x1, y1, x2, y2, colour, thickness) {
  const t = thickness == null ? 0.012 : thickness;
  if (Math.abs(y1 - y2) < 0.0005) {
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: Math.min(x1, x2), y: y1 - t / 2, w: Math.abs(x2 - x1), h: t,
      fill: { color: colour }, line: { type: 'none' }
    });
  } else if (Math.abs(x1 - x2) < 0.0005) {
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: x1 - t / 2, y: Math.min(y1, y2), w: t, h: Math.abs(y2 - y1),
      fill: { color: colour }, line: { type: 'none' }
    });
  } else {
    // Non-axis-aligned: fall back to a thin polyline.
    polyline(pptx, slide, [{ x: x1, y: y1 }, { x: x2, y: y2 }], { lineColor: colour, width: 1.5 });
  }
}

// A straight segment from (x1,y1) to (x2,y2) with an optional arrowhead at the
// far end. Uses pptxgenjs LINE with flips so the geometry is correct in every
// direction (the same approach as the triangle-square connector).
function arrow(pptx, slide, x1, y1, x2, y2, opts) {
  opts = opts || {};
  const dx = x2 - x1;
  const dy = y2 - y1;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  if (absDx < 0.001 && absDy < 0.001) return;

  const line = { color: opts.color || '000000', width: opts.width == null ? 2 : opts.width };
  if (opts.arrow !== false) line.endArrowType = 'triangle';
  if (opts.dash) line.dashType = opts.dash;

  if (absDx < 0.001) {
    slide.addShape(pptx.shapes.LINE, { x: x1, y: Math.min(y1, y2), w: 0.001, h: absDy, flipV: dy < 0, line: line });
  } else if (absDy < 0.001) {
    slide.addShape(pptx.shapes.LINE, { x: Math.min(x1, x2), y: y1, w: absDx, h: 0.001, flipH: dx < 0, line: line });
  } else if (dx > 0 && dy > 0) {
    slide.addShape(pptx.shapes.LINE, { x: x1, y: y1, w: dx, h: dy, line: line });
  } else if (dx > 0 && dy < 0) {
    slide.addShape(pptx.shapes.LINE, { x: x1, y: y2, w: dx, h: absDy, flipV: true, line: line });
  } else if (dx < 0 && dy > 0) {
    slide.addShape(pptx.shapes.LINE, { x: x2, y: y1, w: absDx, h: dy, flipH: true, line: line });
  } else {
    slide.addShape(pptx.shapes.LINE, { x: x2, y: y2, w: absDx, h: absDy, line: line });
  }
}

// A small filled dot centred on an absolute point.
function dot(pptx, slide, cx, cy, r, colour) {
  slide.addShape(pptx.ShapeType.ellipse, {
    x: cx - r, y: cy - r, w: 2 * r, h: 2 * r,
    fill: { color: colour }, line: { type: 'none' }
  });
}

module.exports = { bbox, polygon, polyline, rule, arrow, dot };
