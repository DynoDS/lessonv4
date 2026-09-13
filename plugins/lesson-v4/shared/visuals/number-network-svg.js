'use strict';

// THE number network: circles joined by lines where every directly connected
// pair must add up to a fixed target. The child reads the given circles and
// works out the blank ones ("each line adds to 100, find the missing numbers").
// One drawing, placed by the board, the worksheet, the working wall and the
// stick-in pack.
//
// It was the board's alone (builder/src/content/number-network.js), in
// PowerPoint shapes. Its circles had a radius of half a grid step, so two
// circles one step apart touched and the line joining them - the one thing
// that says "these two add to the target" - disappeared between them on the
// catalogue's own example. The circles here leave a visible run of line between
// neighbours. It moved on 13 September 2026, when every picture became one
// shared drawing reachable from every surface.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//
// Spec:
//   target   the sum every connected pair must reach, printed under the network
//            as "Each connected pair adds up to <target>"
//   label    words for the caption instead. A `label` is the surface's own
//            typed caption (the board's caption band, the wall card's caption),
//            so when one is given the drawing leaves its target sentence out
//            rather than print the rule twice.
//   nodes    [{ x, y, value, color }]
//              x, y    layout position in grid units (x across, y DOWN, so y:0
//                      is the top row, matching "top / middle / bottom")
//              value   the number in the circle; null or omitted is a blank
//                      circle the child fills (a faint "?" is shown)
//              color   optional hex to tint the number (green on an answer
//                      slide); defaults to ink
//   edges    [[i, j], ...] index pairs into nodes, each drawn as a joining line

const T = require('./figure-text');

// ─── CONSTANTS ──────────────────────────────────────────────────────────────
const R_LAYOUT = 0.36; // circle radius in grid units: neighbours one step apart keep a run of line between them
const CIRCLE_STROKE = 0.05; // of the radius
const EDGE_STROKE = 0.04; // of the radius
const NUMBER_FILL = 0.72; // the widest number may take this share of the diameter
const NATURAL_STEP = 5; // ems between neighbouring circles on paper and on the wall
const CAPTION_GAP = 0.5; // ems
const PAD = 0.2; // ems
const EDGE_COLOUR = '#8497B0';
const BLANK_COLOUR = '#AAAAAA';
// ────────────────────────────────────────────────────────────────────────────

function normalise(spec = {}) {
  const nodes = (Array.isArray(spec.nodes) ? spec.nodes : []).map((node, i) => {
    const x = Number(node && node.x);
    const y = Number(node && node.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error(`NUMBER_NETWORK_INVALID: circle ${i} needs a numeric x and y on the layout grid.`);
    }
    const blank = node.value == null || node.value === '';
    return { x, y, value: blank ? null : String(node.value), color: node.color || null };
  });
  if (!nodes.length) throw new Error('NUMBER_NETWORK_INVALID: a number network needs at least one circle in `nodes`.');
  const edges = (Array.isArray(spec.edges) ? spec.edges : []).map((e) => {
    const [a, b] = Array.isArray(e) ? e.map(Number) : [];
    if (!nodes[a] || !nodes[b] || a === b) {
      throw new Error(`NUMBER_NETWORK_INVALID: the line ${JSON.stringify(e)} does not join two of the ${nodes.length} circles.`);
    }
    return [a, b];
  });
  const label = spec.label != null && String(spec.label).trim() ? String(spec.label) : '';
  const caption = !label && spec.target != null ? `Each connected pair adds up to ${spec.target}` : '';
  return { nodes, edges, caption, label };
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = T.resolveProfile(profileOrSurface, box);
  const n = normalise(spec);
  const minX = Math.min(...n.nodes.map((p) => p.x));
  const maxX = Math.max(...n.nodes.map((p) => p.x));
  const minY = Math.min(...n.nodes.map((p) => p.y));
  const maxY = Math.max(...n.nodes.map((p) => p.y));
  const gridW = maxX - minX + 2 * R_LAYOUT;
  const gridH = maxY - minY + 2 * R_LAYOUT;
  const texts = n.nodes.map((p) => p.value || '?');

  const attempt = (pt) => {
    const avail = profile.widthPt - 2 * PAD * pt;
    const caption = n.caption ? T.wrap(n.caption, pt, avail, true) : [];
    if (caption === null) return new Error(`NUMBER_NETWORK_TOO_NARROW: the caption "${n.caption}" does not fit this width at the ${profile.minFontPt}pt readable size.`);
    const captionH = caption.length ? CAPTION_GAP * pt + T.blockHeight(caption.length, pt) : 0;
    let s = avail / gridW; // points per grid unit
    if (profile.heightPt) s = Math.min(s, (profile.heightPt - 2 * PAD * pt - captionH) / gridH);
    else s = Math.min(s, NATURAL_STEP * pt);
    const R = R_LAYOUT * s;
    const widest = Math.max(...texts.map((t) => T.widthPt(t, pt, true)));
    if (!(R > 0) || widest > 2 * R * NUMBER_FILL || pt * 1.1 > 2 * R * NUMBER_FILL) {
      return new Error(
        `NUMBER_NETWORK_TOO_SMALL: the circles come out ${((2 * Math.max(R, 0)) / 72).toFixed(2)}in across, too small to hold their numbers at the ${profile.minFontPt}pt readable size. ` +
          'Give the network more room, or use fewer rows or columns of circles.'
      );
    }
    return { pt, s, R, caption, captionH };
  };
  const L = T.settle(profile, attempt);
  const contentW = gridW * L.s + 2 * PAD * L.pt;
  const { W, dx } = T.frameWidth(profile, Math.max(contentW, L.caption.length ? T.linesWidth(L.caption, L.pt, true) + 2 * PAD * L.pt : 0));
  const gridLeft = dx + (W - 2 * dx - gridW * L.s) / 2;
  const px = (x) => gridLeft + (x - minX + R_LAYOUT) * L.s;
  const py = (y) => PAD * L.pt + (y - minY + R_LAYOUT) * L.s;
  const h = PAD * L.pt + gridH * L.s + L.captionH + PAD * L.pt;
  return { ...L, n, profile, W, h, px, py, gridBottom: PAD * L.pt + gridH * L.s };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const { n, R, pt, profile, px, py } = L;
  const c = profile.colours;
  const font = profile.font;
  const f = T.f2;
  const ink = profile.palette === 'ink';
  const parts = [];
  n.edges.forEach(([a, b]) => {
    parts.push(`<line class="network-edge" x1="${f(px(n.nodes[a].x))}" y1="${f(py(n.nodes[a].y))}" x2="${f(px(n.nodes[b].x))}" y2="${f(py(n.nodes[b].y))}" stroke="${ink ? c.ink : EDGE_COLOUR}" stroke-width="${f(Math.max(1.5, EDGE_STROKE * R))}"/>`);
  });
  n.nodes.forEach((node) => {
    const cx = px(node.x);
    const cy = py(node.y);
    parts.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R)}" fill="${c.paper}" stroke="${c.ink}" stroke-width="${f(Math.max(1.25, CIRCLE_STROKE * R))}"/>`);
    const blank = node.value == null;
    const fill = blank ? (ink ? '#8C8C8C' : BLANK_COLOUR) : ink ? c.ink : T.hexOr(node.color, c.ink);
    parts.push(T.textLines([blank ? '?' : node.value], cx, cy - (pt * T.LINE) / 2 + 0.08 * pt, pt, { fill, font, bold: true }));
  });
  if (L.caption.length) {
    parts.push(T.textLines(L.caption, L.W / 2, L.gridBottom + CAPTION_GAP * pt, pt, { fill: ink ? c.ink : c.label, font, bold: true }));
  }
  return { svg: T.svgDoc(L.W, L.h, parts), w: L.W, h: L.h, aspect: L.W / L.h, layout: L };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = T.resolveProfile(profileOrSurface, box);
  return `number-network:${T.profileKey(p)}:${JSON.stringify(normalise(spec))}`;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout };
