'use strict';

// THE turn diagram: "angle as a turn". One drawing, placed by the board, the
// worksheet, the working wall and the stick-in pack.
//
// Two straight rays from a vertex, the start ray pointing up and the end ray
// where the turn left it, with a red curved arrow sweeping from one to the
// other. The red rotation arrow is what fights the "an angle is a distance"
// misconception, which is why a lesson teaching angle-as-turn uses this and not
// the static angle.
//
// It was three. The board pre-rendered a square PNG with a tight margin, the
// sheet drew a row with an orange sweep and a wider margin, and the wall copied
// the board's picture onto a square canvas that floated small in its cell; only
// the board could number the quarter turns (13 September 2026). Each surface
// now passes only the box it has and its profile
// (shared/visuals/surface-profiles.js). The success-criteria cue beside a step
// stays its own tiny drawing (turn-diagram-cue-svg.js).
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//   minWidthPt(spec, profile)
//
// ─── the spec ────────────────────────────────────────────────────────────
//
//   quarters    1 quarter, 2 half, 3 three-quarter, 4 full; any positive
//               number of quarter turns (default 1)
//   amount      the same as a word: "quarter" | "half" | "three-quarter" |
//               "full", used when `quarters` is absent
//   direction   "clockwise" (default) | "anticlockwise"
//   countMarks  numbers 1, 2, 3 at each quarter-turn boundary along the arc, so
//               "a three-quarter turn is three quarter turns" is visible. For a
//               slide TEACHING that; on a plain "name this turn" question the
//               numbers would turn naming into counting the labels.
//   turns       a row: [{ quarters, amount, direction, countMarks }, ...], every
//               diagram drawn to the same ray length (the sheet's form)
//   letters     true prints (a) (b) (c) above the diagrams of a row
//
// A board caption (`label`, with its "||" answer reveal) is typed text the board
// sets under the placed picture, not part of this drawing.

const { profileFor } = require('./surface-profiles');
const { textWidthEm } = require('../text/comic-glyph-width');

// ─── CONSTANTS (shares of S, one diagram's square, unless marked pt) ────────
const RAY = 0.44; // ray length: the square less just enough margin for an arrowhead
const ARC = 0.52; // the red arc's radius as a share of the ray
const HEAD = 0.075; // arrowhead size
const RAY_W = 0.013; const RAY_W_MIN = 1.5; // pt
const ARC_W = 0.016; const ARC_W_MIN = 1.8; // pt
const DOT_R = 0.02; const DOT_R_MIN = 2; // pt
const MARK_SHARE = 0.085; // count-mark numeral size
const MARK_MAX_SHARE = 0.12;
const DISC = 0.85; // count-mark disc radius, in numeral sizes
const GAP = 0.14; // between diagrams in a row
const START_ANGLE = -90; // the start ray always points straight up
const FULL_CAP_DEG = 350; // a full turn is drawn just short of 360 so its arrow shows
const LETTER_BAND = 1.5; // ems of the profile font
const MAX_SQUARE_EM = 24; // widest one diagram grows on paper, in ems of the profile font
// ────────────────────────────────────────────────────────────────────────────

const AMOUNT_QUARTERS = { quarter: 1, half: 2, 'three-quarter': 3, 'three-quarters': 3, threequarter: 3, full: 4, whole: 4 };

function f2(n) {
  return Math.round(n * 100) / 100;
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function asProfile(profileOrSurface, box) {
  return typeof profileOrSurface === 'string' ? profileFor(profileOrSurface, box || { widthPt: 500 }) : profileOrSurface;
}

// Tolerant of the numeric `quarters` or the word `amount`, so a designer writes
// whichever reads more naturally for the slide.
function resolveTurn(t = {}) {
  let quarters = Number(t.quarters);
  if (!Number.isFinite(quarters) || quarters <= 0) {
    const word = String(t.amount || '').trim().toLowerCase().replace(/\s+/g, '-');
    quarters = AMOUNT_QUARTERS[word] || 1;
  }
  const direction = t.direction === 'anticlockwise' ? 'anticlockwise' : 'clockwise';
  return { quarters, direction, countMarks: t.countMarks === true };
}

function normalise(spec = {}) {
  const list = Array.isArray(spec.turns) && spec.turns.length ? spec.turns : [spec];
  return {
    turns: list.map((t) => resolveTurn({ ...t, countMarks: t.countMarks != null ? t.countMarks : spec.countMarks })),
    letters: spec.letters === true,
  };
}

// Where one turn's ink falls inside its S square, centred on the vertex, so a
// row can be cropped to the ink while every diagram keeps one ray length.
function geometry(turn, S) {
  const R = RAY * S;
  const arcR = ARC * R;
  const dir = turn.direction === 'clockwise' ? 1 : -1;
  const sweep = turn.quarters * 90;
  const arcSweep = Math.min(sweep, FULL_CAP_DEG);
  const pt = (angle, radius) => ({ x: radius * Math.cos(toRad(angle)), y: radius * Math.sin(toRad(angle)) });
  const endRay = START_ANGLE + dir * sweep;
  const g = {
    R,
    arcR,
    dir,
    startTip: pt(START_ANGLE, R),
    endTip: pt(endRay, R),
    arcStart: pt(START_ANGLE, arcR),
    arcEnd: pt(START_ANGLE + dir * arcSweep, arcR),
    sweepFlag: dir > 0 ? 1 : 0,
    largeArc: arcSweep > 180 ? 1 : 0,
    marks: [],
  };
  const xs = [0, g.startTip.x, g.endTip.x];
  const ys = [0, g.startTip.y, g.endTip.y];
  // The arc passes every compass point it sweeps over.
  for (let a = 0; a <= arcSweep; a += 5) {
    const p = pt(START_ANGLE + dir * a, arcR);
    xs.push(p.x);
    ys.push(p.y);
  }
  g.box = { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
  return g;
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = asProfile(profileOrSurface, box);
  const { turns, letters } = normalise(spec);
  const n = turns.length;
  const T = Math.max(profile.fontPt, profile.minFontPt);
  const floor = profile.minFontPt;
  const letterBand = letters ? LETTER_BAND * T : 0;
  const counted = turns.some((t) => t.countMarks);

  // One square per diagram, sized from the whole row, so a quarter turn and a
  // half turn beside it draw with the same ray length rather than each being
  // blown up to fill its own crop.
  let S = (profile.widthPt - 0) / (n + (n - 1) * GAP);
  if (profile.heightPt) S = Math.min(S, profile.heightPt - letterBand);
  S = Math.min(S, MAX_SQUARE_EM * profile.fontPt * (profile.grow || 1));
  if (!(S > 0)) throw new Error('TURN_DIAGRAM_TOO_SMALL: there is no room to draw this turn. Give the visual more space.');
  const markPt = counted ? Math.min(Math.max(S * MARK_SHARE, floor), S * MARK_MAX_SHARE) : 0;
  if (counted && S * MARK_MAX_SHARE < floor) {
    throw new Error(
      `TURN_DIAGRAM_TOO_SMALL: the quarter-turn numbers cannot print at the ${floor}pt readable minimum in a space this small. ` +
        'Give the diagram more room, or leave countMarks off.'
    );
  }

  const geos = turns.map((t) => {
    const g = geometry(t, S);
    if (t.countMarks) {
      const markR = (g.arcR + g.R) / 2;
      for (let k = 1; k <= Math.floor(t.quarters); k++) {
        const a = START_ANGLE + g.dir * (k * 90);
        const p = { x: markR * Math.cos(toRad(a)), y: markR * Math.sin(toRad(a)), k };
        g.marks.push(p);
        const d = markPt * DISC;
        g.box.minX = Math.min(g.box.minX, p.x - d);
        g.box.maxX = Math.max(g.box.maxX, p.x + d);
        g.box.minY = Math.min(g.box.minY, p.y - d);
        g.box.maxY = Math.max(g.box.maxY, p.y + d);
      }
    }
    return g;
  });
  // Strokes and the vertex dot reach a little past the geometry.
  const bleed = Math.max(RAY_W * S, RAY_W_MIN, ARC_W * S, ARC_W_MIN, DOT_R * S, DOT_R_MIN) + HEAD * S * 0.5;
  // Vertex x of each diagram: the slot centres, then crop left and right to ink.
  const slot = S * (1 + GAP);
  const vx = turns.map((_, i) => S / 2 + i * slot);
  // A letter is centred over its vertex and may be wider than the ink under it.
  const letterHalf = letters ? (textWidthEm('(m)', true) * T) / 2 : 0;
  const left = Math.min(...geos.map((g, i) => vx[i] + Math.min(g.box.minX - bleed, -letterHalf)));
  const right = Math.max(...geos.map((g, i) => vx[i] + Math.max(g.box.maxX + bleed, letterHalf)));
  const top = Math.min(...geos.map((g) => g.box.minY)) - bleed;
  const bottom = Math.max(...geos.map((g) => g.box.maxY)) + bleed;
  const w = right - left;
  const h = letterBand + bottom - top;
  const vertices = turns.map((_, i) => ({ x: vx[i] - left, y: letterBand - top }));
  return { w, h, S, T, markPt, letterBand, turns, letters, geos, vertices, profile };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const { S, profile } = L;
  const c = profile.colours;
  const ah = HEAD * S;
  // Arrowheads are drawn as triangles rather than SVG markers: a sheet inlines
  // every drawing into one page, where two diagrams of different sizes sharing a
  // marker id would take the first one's arrowhead size.
  const head = (tip, ux, uy, colour) => {
    const bx = tip.x - ux * ah;
    const by = tip.y - uy * ah;
    const px = -uy * (ah / 2);
    const py = ux * (ah / 2);
    return `<polygon points="${f2(tip.x)},${f2(tip.y)} ${f2(bx + px)},${f2(by + py)} ${f2(bx - px)},${f2(by - py)}" fill="${colour}"/>`;
  };
  const parts = [];
  const rayW = f2(Math.max(RAY_W * S, RAY_W_MIN));
  const arcW = f2(Math.max(ARC_W * S, ARC_W_MIN));

  L.turns.forEach((turn, i) => {
    const g = L.geos[i];
    const { x: cx, y: cy } = L.vertices[i];
    if (L.letters) {
      parts.push(
        `<text x="${f2(cx)}" y="${f2(L.letterBand * 0.7)}" text-anchor="middle" font-family="${profile.font}" font-size="${f2(L.T)}" font-weight="bold" fill="${c.ink}">(${String.fromCharCode(97 + i)})</text>`
      );
    }
    const at = (p) => `${f2(cx + p.x)} ${f2(cy + p.y)}`;
    [g.startTip, g.endTip].forEach((tip) => {
      // The line stops at the arrowhead's base so its round cap does not poke
      // through the point.
      const len = Math.hypot(tip.x, tip.y);
      const ux = tip.x / len;
      const uy = tip.y / len;
      parts.push(`<line x1="${f2(cx)}" y1="${f2(cy)}" x2="${f2(cx + tip.x - ux * ah * 0.6)}" y2="${f2(cy + tip.y - uy * ah * 0.6)}" stroke="${c.ink}" stroke-width="${rayW}" stroke-linecap="round"/>`);
      parts.push(head({ x: cx + tip.x, y: cy + tip.y }, ux, uy, c.ink));
    });
    parts.push(
      `<path d="M ${at(g.arcStart)} A ${f2(g.arcR)} ${f2(g.arcR)} 0 ${g.largeArc} ${g.sweepFlag} ${at(g.arcEnd)}" fill="none" stroke="${c.arrow}" stroke-width="${arcW}" stroke-linecap="round"/>`
    );
    {
      // The arc's direction of travel where it ends: its tangent, turned the
      // way the turn goes.
      const theta = Math.atan2(g.arcEnd.y, g.arcEnd.x);
      parts.push(head({ x: cx + g.arcEnd.x, y: cy + g.arcEnd.y }, -Math.sin(theta) * g.dir, Math.cos(theta) * g.dir, c.arrow));
    }
    g.marks.forEach((m) => {
      parts.push(`<circle cx="${f2(cx + m.x)}" cy="${f2(cy + m.y)}" r="${f2(L.markPt * DISC)}" fill="${c.paper}" stroke="${c.arrow}" stroke-width="${f2(Math.max(S * 0.006, 1))}"/>`);
      parts.push(
        `<text x="${f2(cx + m.x)}" y="${f2(cy + m.y + L.markPt * 0.35)}" text-anchor="middle" font-family="${profile.font}" font-size="${f2(L.markPt)}" font-weight="bold" fill="${c.arrow}">${m.k}</text>`
      );
    });
    parts.push(`<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(Math.max(DOT_R * S, DOT_R_MIN))}" fill="${c.ink}"/>`);
  });

  const w = f2(L.w);
  const h = f2(L.h);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join('')}</svg>`;
  return { svg, w: L.w, h: L.h, aspect: L.w / L.h, layout: L };
}

// Four turns to match against four labels is four diagrams' worth of width, not
// one: a floor that ignored the count approved a row of six into a zone where
// each diagram came out the size of a stamp. 24mm a diagram is where the
// arrowhead stops closing up on its arc, and count marks need their numerals.
function minWidthPt(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = asProfile(profileOrSurface, box);
  const { turns } = normalise(spec);
  const n = turns.length;
  let S = 24 * (72 / 25.4) * 0.9;
  if (turns.some((t) => t.countMarks)) S = Math.max(S, profile.minFontPt / MARK_MAX_SHARE);
  return Math.ceil(n * S + (n - 1) * GAP * S);
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = asProfile(profileOrSurface, box);
  return `turn-diagram:${p.surface}:${f2(p.widthPt)}x${p.heightPt ? f2(p.heightPt) : '-'}:${JSON.stringify(normalise(spec))}`;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, resolveTurn, minWidthPt };
