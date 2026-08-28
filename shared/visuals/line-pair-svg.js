'use strict';

// SHARED line-pair geometry — the single source of truth for the parallel /
// perpendicular / neither diagram, imported by every engine that draws it
// (slides, worksheets, working wall). It produces ONLY the SVG and its true
// aspect ratio; it knows nothing about PowerPoint, Word, sharp, or any engine.
// Each engine renders the returned SVG to a PNG and PLACES it by the returned
// aspect, so the same diagram fills its slot tight — no deadspace — wherever it
// appears. The placement step is the only thing that differs per engine; the
// geometry below is shared so a fix or a new form is written once.
//
// Two pure exports:
//   tightSvg(spec)  → { svg, aspect }   — SVG cropped tight to the two lines'
//                     own bounding box; aspect = width / height for placement.
//   cacheKey(spec)  → string            — stable key for an engine's pre-render
//                     cache, so identical specs render their PNG once.
//
// Spec (see each engine's authoring docs for the child-facing meaning):
//   relationship  "parallel" | "perpendicular" | "neither"   (default "parallel")
//   form          parallel:      "horizontal" | "vertical" | "diagonal"
//                 perpendicular: "cross" | "L" | "T" | "detached"
//                 neither:       "converging" | "slant"
//   unequal       parallel only — true draws clearly different-length lines at a
//                 constant gap (the "must be equal length" misconception)
//   notation      "none" (default) | "arrows" (chevron › on each parallel line)
//                 | "right-angle" (blue square at the actual/implied corner)
//   arrows        1 | 2 — chevrons per line when notation is "arrows" (default 1)
//   rotation      degrees — rotates the whole pair (orientation never changes
//                 the answer); use it so a set of items isn't all the same way up

// ─── CONSTANTS (abstract units; the SVG is scaled when placed) ─────────────
const L        = 100;          // nominal line length
const GAP      = L * 0.40;     // perpendicular gap of a parallel pair
const LINE_W   = L * 0.033;    // line stroke
const MARK_W   = L * 0.040;    // chevron / square stroke
const DOT_R    = L * 0.050;    // dot where two lines actually meet
const SQ_S     = L * 0.16;     // right-angle square side
const CHEV     = L * 0.085;    // chevron half-width (the › opening size)
const CHEV_GAP = L * 0.085;    // spacing between the two chevrons when arrows:2
const EXT_DASH = L * 0.18;     // faint extension hint length, "detached" case

const LINE_COLOUR = '#000000';
const MARK_COLOUR = '#0070C0';   // house blue — the notation marks
// ─── END CONSTANTS ─────────────────────────────────────────────────────────

function toRad(deg) { return (deg * Math.PI) / 180; }
function rot(p, deg) {
  const r = toRad(deg), c = Math.cos(r), s = Math.sin(r);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
}

function resolveRelationship(data) {
  const r = String(data.relationship || 'parallel');
  if (r === 'parallel' || r === 'perpendicular' || r === 'neither') return r;
  return 'parallel';
}

function resolveForm(data, relationship) {
  const f = data.form ? String(data.form) : null;
  if (relationship === 'parallel') {
    return (f === 'vertical' || f === 'diagonal') ? f : (f === 'horizontal' ? f : 'horizontal');
  }
  if (relationship === 'perpendicular') {
    return (f === 'L' || f === 'T' || f === 'detached') ? f : 'cross';
  }
  return (f === 'slant') ? f : 'converging';
}

function resolveArrows(data) {
  const n = Number(data.arrows);
  return n === 2 ? 2 : 1;
}

// A "segment" is {a, b} where a and b are endpoints in abstract units.
// Returns { segs, meet, parallelDir, exts, cornerInfo }.
function buildGeometry(relationship, form, data) {
  const segs = [];
  let meet = null;
  let parallelDir = null;
  const exts = [];
  let cornerInfo = null;

  if (relationship === 'parallel') {
    parallelDir = 0;                       // lines run horizontally before rotation
    const half = L / 2;
    const long  = half;
    const short = data.unequal ? half * 0.55 : half;
    segs.push({ a: { x: -long,  y: -GAP / 2 }, b: { x: long,  y: -GAP / 2 } });
    segs.push({ a: { x: -short, y:  GAP / 2 }, b: { x: short, y:  GAP / 2 } });
    let extraRot = 0;
    if (form === 'vertical') extraRot = 90;
    else if (form === 'diagonal') extraRot = 32;
    if (extraRot) {
      for (const s of segs) { s.a = rot(s.a, extraRot); s.b = rot(s.b, extraRot); }
      parallelDir += extraRot;
    }
  } else if (relationship === 'perpendicular') {
    const half = L / 2;
    if (form === 'cross') {
      segs.push({ a: { x: -half, y: 0 }, b: { x: half, y: 0 } });
      segs.push({ a: { x: 0, y: -half }, b: { x: 0, y: half } });
      meet = { x: 0, y: 0 };
      cornerInfo = { at: { x: 0, y: 0 }, d1: { x: 1, y: 0 }, d2: { x: 0, y: -1 } };
    } else if (form === 'L') {
      segs.push({ a: { x: 0, y: 0 }, b: { x: L, y: 0 } });
      segs.push({ a: { x: 0, y: 0 }, b: { x: 0, y: -L } });
      meet = { x: 0, y: 0 };
      cornerInfo = { at: { x: 0, y: 0 }, d1: { x: 1, y: 0 }, d2: { x: 0, y: -1 } };
    } else if (form === 'T') {
      segs.push({ a: { x: -half, y: 0 }, b: { x: half, y: 0 } });   // bar
      segs.push({ a: { x: 0, y: 0 }, b: { x: 0, y: L } });          // stem downwards
      meet = { x: 0, y: 0 };
      cornerInfo = { at: { x: 0, y: 0 }, d1: { x: 1, y: 0 }, d2: { x: 0, y: 1 } };
    } else { // detached
      const corner = { x: half * 0.6, y: 0 };
      segs.push({ a: { x: -half, y: 0 }, b: { x: half * 0.2, y: 0 } });
      segs.push({ a: { x: half * 0.6, y: L * 0.28 }, b: { x: half * 0.6, y: L } });
      exts.push({ a: { x: half * 0.2, y: 0 }, b: corner });
      exts.push({ a: { x: half * 0.6, y: L * 0.28 }, b: corner });
      cornerInfo = { at: corner, d1: { x: -1, y: 0 }, d2: { x: 0, y: 1 } };
    }
  } else { // neither
    const half = L / 2;
    if (form === 'converging') {
      segs.push({ a: { x: -half, y: -GAP * 0.14 }, b: { x: half, y: -GAP * 0.62 } });
      segs.push({ a: { x: -half, y:  GAP * 0.14 }, b: { x: half, y:  GAP * 0.62 } });
    } else { // slant
      segs.push({ a: { x: -half, y: 0 }, b: { x: half, y: 0 } });
      const ang = 48;
      const dx = Math.cos(toRad(ang)) * half;
      const dy = Math.sin(toRad(ang)) * half;
      segs.push({ a: { x: -dx, y: dy }, b: { x: dx, y: -dy } });
      meet = { x: 0, y: 0 };
    }
  }

  return { segs, meet, parallelDir, exts, cornerInfo };
}

function cacheKey(data) {
  const relationship = resolveRelationship(data);
  const form = resolveForm(data, relationship);
  const unequal = (relationship === 'parallel' && data.unequal === true) ? '1' : '0';
  const notation = String(data.notation || 'none');
  const arrows = resolveArrows(data);
  const rotation = Number.isFinite(Number(data.rotation)) ? Number(data.rotation) : 0;
  return ['line-pair', relationship, form, unequal, notation, arrows, rotation].join(':');
}

// Build the SVG cropped tight to the two lines' bounding box. Returns the SVG
// string plus its width:height aspect so the placing engine sizes it with no
// deadspace.
function tightSvg(data) {
  const relationship = resolveRelationship(data);
  const form = resolveForm(data, relationship);
  const notation = String(data.notation || 'none');
  const arrowsN = resolveArrows(data);
  const rotation = Number.isFinite(Number(data.rotation)) ? Number(data.rotation) : 0;

  const geo = buildGeometry(relationship, form, data);

  const R = function (p) { return rotation ? rot(p, rotation) : p; };
  const segs = geo.segs.map(function (s) { return { a: R(s.a), b: R(s.b) }; });
  const exts = geo.exts.map(function (s) { return { a: R(s.a), b: R(s.b) }; });
  const meet = geo.meet ? R(geo.meet) : null;

  const xs = [], ys = [];
  const note = function (p) { xs.push(p.x); ys.push(p.y); };
  segs.forEach(function (s) { note(s.a); note(s.b); });
  exts.forEach(function (s) { note(s.a); note(s.b); });

  const chevrons = [];
  if (notation === 'arrows' && relationship === 'parallel') {
    const dir = (geo.parallelDir || 0) + rotation;
    const u = { x: Math.cos(toRad(dir)), y: Math.sin(toRad(dir)) };
    segs.forEach(function (s) {
      const mid = { x: (s.a.x + s.b.x) / 2, y: (s.a.y + s.b.y) / 2 };
      const offsets = arrowsN === 2 ? [-CHEV_GAP / 2, CHEV_GAP / 2] : [0];
      offsets.forEach(function (off) {
        const c = { x: mid.x + u.x * off, y: mid.y + u.y * off };
        const n = { x: -u.y, y: u.x };
        const tip  = { x: c.x + u.x * (CHEV * 0.55), y: c.y + u.y * (CHEV * 0.55) };
        const back = { x: c.x - u.x * (CHEV * 0.55), y: c.y - u.y * (CHEV * 0.55) };
        const w1 = { x: back.x + n.x * CHEV, y: back.y + n.y * CHEV };
        const w2 = { x: back.x - n.x * CHEV, y: back.y - n.y * CHEV };
        chevrons.push([w1, tip, w2]);
        note(w1); note(tip); note(w2);
      });
    });
  }

  let square = null;
  if (notation === 'right-angle' && geo.cornerInfo) {
    const ci = geo.cornerInfo;
    const at = R(ci.at);
    const d1 = R(ci.d1), d2 = R(ci.d2);
    const c1  = { x: at.x + d1.x * SQ_S, y: at.y + d1.y * SQ_S };
    const c2  = { x: at.x + d2.x * SQ_S, y: at.y + d2.y * SQ_S };
    const far = { x: at.x + (d1.x + d2.x) * SQ_S, y: at.y + (d1.y + d2.y) * SQ_S };
    square = [c1, far, c2];
    note(c1); note(c2); note(far);
  }

  let minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
  let minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);

  const m = Math.max(LINE_W, MARK_W, DOT_R) + L * 0.02;
  minX -= m; minY -= m; maxX += m; maxY += m;

  const w = maxX - minX;
  const h = maxY - minY;
  const ox = -minX, oy = -minY;
  const f = function (n) { return n.toFixed(2); };
  const X = function (p) { return f(p.x + ox); };
  const Y = function (p) { return f(p.y + oy); };

  const parts = [];

  exts.forEach(function (s) {
    parts.push(`<line x1="${X(s.a)}" y1="${Y(s.a)}" x2="${X(s.b)}" y2="${Y(s.b)}" stroke="#BBBBBB" stroke-width="${f(LINE_W * 0.8)}" stroke-linecap="round" stroke-dasharray="${f(EXT_DASH * 0.45)},${f(EXT_DASH * 0.45)}"/>`);
  });

  segs.forEach(function (s) {
    parts.push(`<line x1="${X(s.a)}" y1="${Y(s.a)}" x2="${X(s.b)}" y2="${Y(s.b)}" stroke="${LINE_COLOUR}" stroke-width="${f(LINE_W)}" stroke-linecap="round"/>`);
  });

  if (square) {
    parts.push(`<polyline points="${X(square[0])},${Y(square[0])} ${X(square[1])},${Y(square[1])} ${X(square[2])},${Y(square[2])}" fill="none" stroke="${MARK_COLOUR}" stroke-width="${f(MARK_W)}" stroke-linecap="round" stroke-linejoin="round"/>`);
  }

  chevrons.forEach(function (ch) {
    parts.push(`<polyline points="${X(ch[0])},${Y(ch[0])} ${X(ch[1])},${Y(ch[1])} ${X(ch[2])},${Y(ch[2])}" fill="none" stroke="${MARK_COLOUR}" stroke-width="${f(MARK_W)}" stroke-linecap="round" stroke-linejoin="round"/>`);
  });

  if (meet) {
    parts.push(`<circle cx="${X(meet)}" cy="${Y(meet)}" r="${f(DOT_R)}" fill="${LINE_COLOUR}"/>`);
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}">${parts.join('')}</svg>`;
  // aspect drives placement in pptx/docx engines; w/h are the tight box for
  // engines that size by pixel dimensions (the worksheet rasteriser).
  return { svg, aspect: w / h, w, h };
}

module.exports = { tightSvg, cacheKey };
