'use strict';

// THE fishbone: an Ishikawa cause-and-effect diagram. One drawing, placed by the
// board, the worksheet, the working wall and the stick-in pack.
//
// A horizontal spine points right at the effect in a filled box; ribs angle off
// the spine alternately above and below, each ending in a box holding a cause.
// Used for "why did X happen?" (history), the causes of flooding (geography) and
// the factors affecting plant growth (science).
//
// It was the board's alone (builder/src/content/fishbone.js). Its boxes were a
// fixed 1.80in by 0.70in (effect) and 1.75in by 0.60in (cause), sized for small
// type; once every helper took the 18pt readable floor (4.2.128, 10 September
// 2026) they held about twelve characters, so a real cause ("Caesar wanted
// military glory") could not be drawn and the catalogue's own example had not
// built. Each box was then measured from its words, and that is kept here. It
// also quietly dropped a seventh cause; that is now refused by name. It moved on
// 13 September 2026, when every picture became one shared drawing reachable from
// every surface.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//
// Spec:
//   effect   the outcome, in the box at the arrow head
//   causes   up to six causes, placed on ribs alternately above and below the
//            spine, starting above

const T = require('./figure-text');

// ─── CONSTANTS (ems of the settled font size) ───────────────────────────────
const RIB_ANGLE_DEG = 35;
const SPINE_THICK = 0.24;
const RIB_THICK = 0.16;
const ARROW_HEAD_W = 1.6;
const ARROW_HEAD_H = 2;
const EFFECT_MAX_W = 9.6;
const EFFECT_SHARE = 0.3; // of the width, the most the effect box takes
const EFFECT_MIN_H = 2.8;
const CAUSE_MIN_W = 5;
const CAUSE_MAX_W = 12;
const CAUSE_MIN_H = 2.4;
const BOX_PAD = 0.35; // words to box edge, each side
const BOX_STROKE = 0.1;
const RIB_GAP = 0.6; // clear air between neighbouring boxes on one side
const RIB_CLEAR = 1.2; // a box's edge stays at least this far off the spine
const RIB_REACH_MAX = 3; // the most a rib runs beyond its box, so a tall space does not sprawl
const ARROW_CLEAR = 0.8; // the last rib meets the spine this far before the arrow head
const PAD = 0.15;
const MAX_CAUSES = 6;
const EFFECT_FILL = '#0070C0';
const CAUSE_LINE = '#E46C0A';
// ────────────────────────────────────────────────────────────────────────────

function normalise(spec = {}) {
  const causes = (Array.isArray(spec.causes) ? spec.causes : []).map((c) => String(c == null ? '' : c));
  if (causes.length > MAX_CAUSES) {
    throw new Error(
      `FISHBONE_TOO_MANY_CAUSES: ${causes.length} causes were given and a fishbone carries ${MAX_CAUSES}; beyond that the ribs crowd each other below a readable size. ` +
        'Keep the causes this lesson weighs (three to five is the sweet spot), or group them.'
    );
  }
  return { effect: spec.effect != null ? String(spec.effect) : '', causes };
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = T.resolveProfile(profileOrSurface, box);
  const n = normalise(spec);
  const W = profile.widthPt;
  const sin = Math.sin((RIB_ANGLE_DEG * Math.PI) / 180);
  const cos = Math.cos((RIB_ANGLE_DEG * Math.PI) / 180);
  const count = n.causes.length;

  const tooSmall = (pt, why) =>
    new Error(
      `FISHBONE_ZONE_TOO_SMALL: ${why} at the ${profile.minFontPt}pt readable minimum, in a space ${(W / 72).toFixed(2)}in by ${profile.heightPt ? (profile.heightPt / 72).toFixed(2) : 'open'}in. ` +
        'Give it a larger space, fewer causes, or shorter cause wording; nothing was shrunk further.'
    );

  const attempt = (pt) => {
    const left = PAD * pt;
    const effectW = Math.min(EFFECT_MAX_W * pt, W * EFFECT_SHARE);
    const effectLines = T.wrap(n.effect, pt, effectW - 2 * BOX_PAD * pt, true);
    if (!effectLines) return tooSmall(pt, `a word in the effect "${n.effect}" is wider than its box`);
    const effectH = Math.max(EFFECT_MIN_H * pt, T.blockHeight(effectLines.length, pt) + 2 * BOX_PAD * pt);
    const effectX = W - PAD * pt - effectW;

    const wrapAll = (w) => {
      const out = [];
      for (const cause of n.causes) {
        const lines = T.wrap(cause, pt, w - 2 * BOX_PAD * pt, true);
        if (!lines) return null;
        out.push(lines);
      }
      return out;
    };
    // The boxes share the spine's length between them, so how wide a box may be
    // depends on how far its rib reaches, which depends on how tall the box is.
    // Settle it in a few passes.
    let causeW = CAUSE_MAX_W * pt;
    let lines = [];
    let causeH = CAUSE_MIN_H * pt;
    let reach = 0;
    for (let pass = 0; pass < 4; pass++) {
      lines = wrapAll(causeW);
      if (!lines) return tooSmall(pt, `a word in "${n.causes.find((c) => !T.wrap(c, pt, causeW - 2 * BOX_PAD * pt, true))}" is wider than its ${(causeW / 72).toFixed(2)}in box`);
      causeH = Math.max(CAUSE_MIN_H * pt, ...lines.map((l) => T.blockHeight(l.length, pt) + 2 * BOX_PAD * pt));
      const least = causeH / 2 + RIB_CLEAR * pt;
      reach = profile.heightPt
        ? Math.min(profile.heightPt / 2 - PAD * pt - causeH / 2, causeH / 2 + RIB_REACH_MAX * pt)
        : causeH / 2 + 2.2 * pt;
      if (reach < least) return tooSmall(pt, `the cause boxes need ${((2 * (least + causeH / 2) + 2 * PAD * pt) / 72).toFixed(2)}in of height`);
      const across = reach / sin * cos;
      const span = effectX - ARROW_HEAD_W * pt - ARROW_CLEAR * pt - across - left; // from the first box's left edge to the last box's centre
      if (count <= 1) {
        causeW = Math.min(CAUSE_MAX_W * pt, span);
      } else {
        // Boxes on one side are two steps apart; they must clear each other.
        causeW = Math.min(CAUSE_MAX_W * pt, (2 * span / (count - 1) - RIB_GAP * pt) / (1 + 1 / (count - 1)));
      }
      if (causeW < CAUSE_MIN_W * pt) return tooSmall(pt, `${count} causes leave each box ${(Math.max(0, causeW) / 72).toFixed(2)}in of spine`);
    }
    lines = wrapAll(causeW);
    if (!lines) return tooSmall(pt, 'a cause has a word wider than its box');
    causeH = Math.max(CAUSE_MIN_H * pt, ...lines.map((l) => T.blockHeight(l.length, pt) + 2 * BOX_PAD * pt));
    const h = Math.max(2 * (reach + causeH / 2), effectH) + 2 * PAD * pt;
    if (profile.heightPt && h > profile.heightPt + 0.5) return tooSmall(pt, `the fishbone needs ${(h / 72).toFixed(2)}in of height`);
    return { pt, effectW, effectH, effectX, effectLines, causeW, causeH, lines, reach, across: (reach / sin) * cos, left, h };
  };
  const L = T.settle(profile, attempt);
  const spineY = L.h / 2;
  const firstCx = L.left + L.causeW / 2;
  const lastAttach = L.effectX - ARROW_HEAD_W * L.pt - ARROW_CLEAR * L.pt;
  const lastCx = lastAttach - L.across;
  const step = count > 1 ? (lastCx - firstCx) / (count - 1) : 0;
  const causes = n.causes.map((text, i) => {
    const cxBox = count > 1 ? firstCx + i * step : (firstCx + lastCx) / 2;
    const above = i % 2 === 0;
    const cyBox = above ? spineY - L.reach : spineY + L.reach;
    return {
      text,
      above,
      lines: L.lines[i],
      attachX: cxBox + L.across,
      box: { x: cxBox - L.causeW / 2, y: cyBox - L.causeH / 2, w: L.causeW, h: L.causeH },
    };
  });
  const spineStart = count ? Math.min(L.left + L.causeW / 2, causes[0].attachX - 0.5 * L.pt) : L.left;
  return { ...L, n, profile, W, spineY, causes, spineStart };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const { pt, profile, spineY } = L;
  const c = profile.colours;
  const font = profile.font;
  const f = T.f2;
  const ink = profile.palette === 'ink';
  const parts = [];

  const headX = L.effectX - 0.2 * pt - ARROW_HEAD_W * pt;
  parts.push(`<rect x="${f(L.spineStart)}" y="${f(spineY - (SPINE_THICK * pt) / 2)}" width="${f(headX - L.spineStart + 0.5)}" height="${f(SPINE_THICK * pt)}" fill="${c.ink}"/>`);
  parts.push(`<polygon points="${f(headX)},${f(spineY - (ARROW_HEAD_H * pt) / 2)} ${f(headX + ARROW_HEAD_W * pt)},${f(spineY)} ${f(headX)},${f(spineY + (ARROW_HEAD_H * pt) / 2)}" fill="${c.ink}"/>`);

  L.causes.forEach((cause) => {
    const b = cause.box;
    const endX = b.x + b.w / 2;
    const endY = b.y + b.h / 2;
    parts.push(`<line class="fishbone-rib" x1="${f(cause.attachX)}" y1="${f(spineY)}" x2="${f(endX)}" y2="${f(endY)}" stroke="${c.ink}" stroke-width="${f(Math.max(1, RIB_THICK * pt))}"/>`);
  });
  L.causes.forEach((cause) => {
    const b = cause.box;
    parts.push(`<rect class="fishbone-cause" x="${f(b.x)}" y="${f(b.y)}" width="${f(b.w)}" height="${f(b.h)}" fill="${c.paper}" stroke="${ink ? c.ink : CAUSE_LINE}" stroke-width="${f(Math.max(1.25, BOX_STROKE * pt))}"/>`);
    parts.push(T.textLines(cause.lines, b.x + b.w / 2, b.y + (b.h - T.blockHeight(cause.lines.length, pt)) / 2, pt, { fill: c.ink, font, bold: true }));
  });

  const ey = spineY - L.effectH / 2;
  parts.push(`<rect class="fishbone-effect" x="${f(L.effectX)}" y="${f(ey)}" width="${f(L.effectW)}" height="${f(L.effectH)}" fill="${ink ? c.paper : EFFECT_FILL}"${ink ? ` stroke="${c.ink}" stroke-width="${f(Math.max(1.5, 0.16 * pt))}"` : ''}/>`);
  parts.push(T.textLines(L.effectLines, L.effectX + L.effectW / 2, spineY - T.blockHeight(L.effectLines.length, pt) / 2, pt, { fill: ink ? c.ink : '#FFFFFF', font, bold: true }));

  return { svg: T.svgDoc(L.W, L.h, parts), w: L.W, h: L.h, aspect: L.W / L.h, layout: L };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = T.resolveProfile(profileOrSurface, box);
  return `fishbone:${T.profileKey(p)}:${JSON.stringify(normalise(spec))}`;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, MAX_CAUSES };
