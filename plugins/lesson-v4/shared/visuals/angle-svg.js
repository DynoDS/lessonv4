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
//   tightSvg(spec, profile?) -> { svg, aspect }   cropped tight to the angle's bounding box
//   cacheKey(spec, profile?) -> string            stable pre-render cache key
//
// A surface that passes a profile (shared/visuals/surface-profiles.js) gets the
// angle drawn in points, sized so a printed degree value is the profile's type
// size, in the profile's palette and font. The wall's `angleFan` card draws
// through this: until 13 September 2026 it was the wall's own filled-wedge
// drawing in Arial, the same angle as this one with its opening coloured and
// its size printed, and no other surface could show it. Its
// `{ type: "angleFan", degrees, colour }` spelling is read here, so every card
// written for it still draws.
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
//   sector      true fills the opening as a coloured wedge (the "angle fan"),
//               the anchor-poster form a wall card shows, and allows a reflex
//               angle, 1 to 359 degrees, wrapping the long way round
//   colour      the wedge's hex fill (default house amber)
//   showDegrees true prints the degree value inside the opening ("50°"). Off
//               everywhere else, because on a "classify this" angle the number
//               would answer the question.
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
const FAN_ARC_R   = R * 0.32;    // the filled wedge's radius
const FAN_COLOUR  = '#FBBF24';   // house amber wedge
const FAN_INK     = '#BFBFBF';   // the wedge on the photocopied stick-in pack
const DEGREE_SHARE = 0.15;       // the printed degree value, as a share of the arm
const DEGREE_AT    = 0.55;       // how far along the bisector it sits, as a share of the arm
const FONT        = "'Comic Sans MS', 'Comic Sans', 'Comic Neue', sans-serif";

function toRad(deg) { return (deg * Math.PI) / 180; }

// The wall's older angleFan spelling: a filled wedge with its size printed,
// the first arm pointing right and the second turned anticlockwise from it.
function fromWall(data) {
  if (!data || data.type !== 'angleFan') return data || {};
  const d = Number(data.degrees);
  const degrees = Math.max(1, Math.min(359, Number.isFinite(d) ? d : 90));
  return {
    ...data,
    degrees,
    sector: true,
    showDegrees: data.showDegrees !== false,
    rotation: data.rotation != null ? data.rotation : 90 - degrees / 2,
  };
}

function resolveDegrees(data) {
  let d = Number(data.degrees);
  if (!Number.isFinite(d)) d = 45;
  if (d < 1) d = 1;
  const most = data.sector === true ? 359 : 179;
  if (d > most) d = most;
  return d;
}

function isProfile(p) {
  return Boolean(p && typeof p === 'object' && p.widthPt > 0 && p.colours);
}

function fanColour(data, P) {
  if (P && P.palette === 'ink') return FAN_INK;
  return typeof data.colour === 'string' && /^#?[0-9a-f]{6}$/i.test(data.colour) ? '#' + data.colour.replace('#', '') : FAN_COLOUR;
}

function showRightAngle(data, degrees) {
  if (data.rightAngle === true) return true;
  if (data.rightAngle === false) return false;
  return Math.abs(degrees - 90) < 0.5;
}

function cacheKey(raw, profile) {
  const data = fromWall(raw);
  const degrees  = resolveDegrees(data);
  const rotation = Number.isFinite(Number(data.rotation)) ? Number(data.rotation) : 0;
  const arc      = data.arc === false ? '0' : '1';
  const sq       = showRightAngle(data, degrees) ? '1' : '0';
  const fan = data.sector === true ? ':fan:' + fanColour(data, null) + ':' + (data.showDegrees === true ? 'deg' : '') : '';
  const where = isProfile(profile) ? ':' + profile.surface + ':' + Math.round(profile.widthPt) + 'x' + (profile.heightPt ? Math.round(profile.heightPt) : '-') : '';
  return 'angle:' + degrees + ':' + rotation + ':' + arc + ':' + sq + fan + where;
}

// Build the SVG cropped tight to the angle's bounding box. Returns the SVG plus
// its width:height aspect so the placing engine sizes it without deadspace.
function tightSvg(raw, profile) {
  const data = fromWall(raw);
  const degrees  = resolveDegrees(data);
  const rotation = Number.isFinite(Number(data.rotation)) ? Number(data.rotation) : 0;
  const sector   = data.sector === true;
  const showDeg  = data.showDegrees === true;
  const showArc  = data.arc !== false && !sector;
  const showSq   = !sector && showRightAngle(data, degrees);
  const inline   = data.successCriteriaInline === true;
  // In points when a surface says where it prints: the arm long enough that a
  // printed degree value is the surface's type size, never past its box.
  const P = isProfile(profile) ? profile : null;
  let unit = 1;
  if (P) {
    unit = Math.min(Math.max(P.fontPt, P.minFontPt) / DEGREE_SHARE / R, (P.widthPt * 0.9) / R, P.heightPt ? (P.heightPt * 0.9) / R : Infinity);
    if (showDeg && unit * R * DEGREE_SHARE < P.minFontPt * 0.999) {
      throw new Error(`ANGLE_TOO_SMALL: the degree value cannot print at the ${P.minFontPt}pt readable minimum in a space this small. Give the angle more room.`);
    }
  }
  const ink      = P ? P.colours.ink : ARM_COLOUR;
  const markInk  = P ? P.colours.label : MARK_COLOUR;
  const armR     = (inline ? R * 0.72 : R) * unit;
  const arcR     = inline ? armR * 0.42 : ARC_R * unit;
  const squareS  = inline ? armR * 0.28 : SQ_S * unit;
  const armW     = (inline ? ARM_W * 1.45 : ARM_W) * unit;
  const markW    = (inline ? MARK_W * 1.55 : MARK_W) * unit;
  const dotR     = (inline ? DOT_R * 1.35 : DOT_R) * unit;
  const fanR     = FAN_ARC_R * unit;

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
  if (sector) {
    // A wedge sweeps past every compass point inside its opening.
    for (let a = 0; a <= degrees; a += 5) { const p = pt(a1 + a, fanR); xs.push(p.x); ys.push(p.y); }
  }
  const degPt = armR * DEGREE_SHARE;
  const degAt = pt(bis, armR * DEGREE_AT);
  if (showDeg) {
    const half = (String(Math.round(degrees)).length * 0.62 + 0.4) * degPt / 2;
    xs.push(degAt.x - half, degAt.x + half); ys.push(degAt.y - degPt * 0.6, degAt.y + degPt * 0.6);
  }
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
  if (sector) {
    const s1 = { x: vx + Math.cos(toRad(a1)) * fanR, y: vy + Math.sin(toRad(a1)) * fanR };
    const s2 = { x: vx + Math.cos(toRad(a2)) * fanR, y: vy + Math.sin(toRad(a2)) * fanR };
    parts.push(`<path d="M ${f(vx)} ${f(vy)} L ${f(s1.x)} ${f(s1.y)} A ${f(fanR)} ${f(fanR)} 0 ${degrees > 180 ? 1 : 0} 1 ${f(s2.x)} ${f(s2.y)} Z" fill="${fanColour(data, P)}"/>`);
  }
  parts.push(`<line x1="${f(vx)}" y1="${f(vy)}" x2="${f(tip1.x)}" y2="${f(tip1.y)}" stroke="${ink}" stroke-width="${f(armW)}" stroke-linecap="round"/>`);
  parts.push(`<line x1="${f(vx)}" y1="${f(vy)}" x2="${f(tip2.x)}" y2="${f(tip2.y)}" stroke="${ink}" stroke-width="${f(armW)}" stroke-linecap="round"/>`);

  if (showSq) {
    const u1  = pt(a1, squareS);
    const u2  = pt(a2, squareS);
    const c1  = { x: vx + u1.x, y: vy + u1.y };
    const c2  = { x: vx + u2.x, y: vy + u2.y };
    const far = { x: vx + u1.x + u2.x, y: vy + u1.y + u2.y };
    parts.push(`<polyline points="${f(c1.x)},${f(c1.y)} ${f(far.x)},${f(far.y)} ${f(c2.x)},${f(c2.y)}" fill="none" stroke="${markInk}" stroke-width="${f(markW)}" stroke-linecap="round" stroke-linejoin="round"/>`);
  } else if (showArc) {
    const as = { x: vx + Math.cos(toRad(a1)) * arcR, y: vy + Math.sin(toRad(a1)) * arcR };
    const ae = { x: vx + Math.cos(toRad(a2)) * arcR, y: vy + Math.sin(toRad(a2)) * arcR };
    parts.push(`<path d="M ${f(as.x)} ${f(as.y)} A ${f(arcR)} ${f(arcR)} 0 0 1 ${f(ae.x)} ${f(ae.y)}" fill="none" stroke="${markInk}" stroke-width="${f(markW)}" stroke-linecap="round"/>`);
  }

  parts.push(`<circle cx="${f(vx)}" cy="${f(vy)}" r="${f(dotR)}" fill="${ink}"/>`);
  if (showDeg) {
    parts.push(`<text x="${f(ox + degAt.x)}" y="${f(oy + degAt.y + degPt * 0.35)}" text-anchor="middle" font-family="${P ? P.font : FONT}" font-size="${f(degPt)}" font-weight="bold" fill="${ink}">${Math.round(degrees)}°</text>`);
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}">${parts.join('')}</svg>`;
  // aspect drives placement in pptx/docx engines; w/h are the tight box for
  // engines that size by pixel dimensions (the worksheet rasteriser).
  return { svg, aspect: w / h, w, h };
}

module.exports = { tightSvg, cacheKey };
