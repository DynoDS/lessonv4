'use strict';

// SHARED angle geometry — the single source of truth for a STATIC classified
// angle (two arms meeting at a vertex, a blue arc marking the opening, or a
// blue right-angle square when it's 90°). This is the picture a child reads to
// CLASSIFY an angle as acute, right or obtuse — the companion to `turn-diagram`
// (an angle being made by a turn) and `line-pair` (a pair of lines to classify).
// Imported by every engine that draws it (slides, worksheets, working wall);
// it produces ONLY the SVG and its true aspect, so each engine places it tight
// (no deadspace) however it embeds images. The geometry is written once here.
//
//   tightSvg(spec) → { svg, aspect }   cropped tight to the angle's bounding box
//   cacheKey(spec) → string            stable pre-render cache key
//
// Spec:
//   degrees     the opening between the arms, 1–179 (default 45). The number is
//               never shown — it only sets how open the picture is drawn. Pitch
//               the example: a clear acute ~35, a near-right acute ~85, an
//               obtuse ~130.
//   rotation    rotates the whole angle (degrees), so a set isn't all one way up.
//   rightAngle  force the right-angle square on (true) / off (false). Unset, the
//               square shows automatically when degrees is 90.
//   arc         set false to hide the opening arc (a bare pair of arms).
//   successCriteriaInline  true keeps the same angle construction but shortens
//               the arms and enlarges the arc/strokes relative to them, so the
//               notation remains visible in the 0.68in Success Criteria slot.

const R       = 100;          // arm length
const ARC_R   = R * 0.26;     // marking arc radius, close to the vertex
const SQ_S    = R * 0.18;     // right-angle square side
const ARM_W   = R * 0.033;    // arm stroke
const MARK_W  = R * 0.038;    // arc / square stroke
const DOT_R   = R * 0.050;    // vertex dot radius

const ARM_COLOUR  = '#000000';
const MARK_COLOUR = '#0070C0';   // house blue — distinct from the red turn arrow
const BASE_BISECT = -90;         // at rotation 0 the opening points straight up

function toRad(deg) { return (deg * Math.PI) / 180; }

function resolveDegrees(data) {
  let d = Number(data.degrees);
  if (!Number.isFinite(d)) d = 45;
  if (d < 1) d = 1;
  if (d > 179) d = 179;
  return d;
}

function showRightAngle(data, degrees) {
  if (data.rightAngle === true) return true;
  if (data.rightAngle === false) return false;
  return Math.abs(degrees - 90) < 0.5;
}

function cacheKey(data) {
  const degrees  = resolveDegrees(data);
  const rotation = Number.isFinite(Number(data.rotation)) ? Number(data.rotation) : 0;
  const arc      = data.arc === false ? '0' : '1';
  const sq       = showRightAngle(data, degrees) ? '1' : '0';
  return 'angle:' + degrees + ':' + rotation + ':' + arc + ':' + sq;
}

// Build the SVG cropped tight to the angle's bounding box. Returns the SVG plus
// its width:height aspect so the placing engine sizes it without deadspace.
function tightSvg(data) {
  const degrees  = resolveDegrees(data);
  const rotation = Number.isFinite(Number(data.rotation)) ? Number(data.rotation) : 0;
  const showArc  = data.arc !== false;
  const showSq   = showRightAngle(data, degrees);
  const inline   = data.successCriteriaInline === true;
  const armR     = inline ? R * 0.72 : R;
  const arcR     = inline ? armR * 0.42 : ARC_R;
  const squareS  = inline ? armR * 0.28 : SQ_S;
  const armW     = inline ? ARM_W * 1.45 : ARM_W;
  const markW    = inline ? MARK_W * 1.55 : MARK_W;
  const dotR     = inline ? DOT_R * 1.35 : DOT_R;

  const bis = BASE_BISECT + rotation;
  const a1  = bis - degrees / 2;
  const a2  = bis + degrees / 2;
  const pt  = function (angle, radius) {
    return { x: radius * Math.cos(toRad(angle)), y: radius * Math.sin(toRad(angle)) };
  };

  const t1 = pt(a1, armR);
  const t2 = pt(a2, armR);

  const arcMid = pt(bis, arcR);
  const xs = [0, t1.x, t2.x];
  const ys = [0, t1.y, t2.y];
  if (showArc && !showSq) { xs.push(arcMid.x); ys.push(arcMid.y); }
  let minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
  let minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);

  const m = Math.max(armW, markW, dotR) + armR * 0.02;
  minX -= m; minY -= m; maxX += m; maxY += m;

  const w = maxX - minX;
  const h = maxY - minY;
  const ox = -minX, oy = -minY;
  const f = function (n) { return n.toFixed(2); };

  const vx = ox, vy = oy;
  const tip1 = { x: ox + t1.x, y: oy + t1.y };
  const tip2 = { x: ox + t2.x, y: oy + t2.y };

  const parts = [];
  parts.push(`<line x1="${f(vx)}" y1="${f(vy)}" x2="${f(tip1.x)}" y2="${f(tip1.y)}" stroke="${ARM_COLOUR}" stroke-width="${f(armW)}" stroke-linecap="round"/>`);
  parts.push(`<line x1="${f(vx)}" y1="${f(vy)}" x2="${f(tip2.x)}" y2="${f(tip2.y)}" stroke="${ARM_COLOUR}" stroke-width="${f(armW)}" stroke-linecap="round"/>`);

  if (showSq) {
    const u1  = pt(a1, squareS);
    const u2  = pt(a2, squareS);
    const c1  = { x: vx + u1.x, y: vy + u1.y };
    const c2  = { x: vx + u2.x, y: vy + u2.y };
    const far = { x: vx + u1.x + u2.x, y: vy + u1.y + u2.y };
    parts.push(`<polyline points="${f(c1.x)},${f(c1.y)} ${f(far.x)},${f(far.y)} ${f(c2.x)},${f(c2.y)}" fill="none" stroke="${MARK_COLOUR}" stroke-width="${f(markW)}" stroke-linecap="round" stroke-linejoin="round"/>`);
  } else if (showArc) {
    const as = { x: vx + Math.cos(toRad(a1)) * arcR, y: vy + Math.sin(toRad(a1)) * arcR };
    const ae = { x: vx + Math.cos(toRad(a2)) * arcR, y: vy + Math.sin(toRad(a2)) * arcR };
    parts.push(`<path d="M ${f(as.x)} ${f(as.y)} A ${f(arcR)} ${f(arcR)} 0 0 1 ${f(ae.x)} ${f(ae.y)}" fill="none" stroke="${MARK_COLOUR}" stroke-width="${f(markW)}" stroke-linecap="round"/>`);
  }

  parts.push(`<circle cx="${f(vx)}" cy="${f(vy)}" r="${f(dotR)}" fill="${ARM_COLOUR}"/>`);

  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}">${parts.join('')}</svg>`;
  // aspect drives placement in pptx/docx engines; w/h are the tight box for
  // engines that size by pixel dimensions (the worksheet rasteriser).
  return { svg, aspect: w / h, w, h };
}

module.exports = { tightSvg, cacheKey };
