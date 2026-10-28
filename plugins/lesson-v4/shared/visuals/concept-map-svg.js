'use strict';

// THE concept map: one central idea with two to six ideas around it, each joined
// to the centre by a line that may carry the relationship ("used as", "buried
// with"). One drawing, placed by the board, the worksheet, the working wall and
// the stick-in pack.
//
// It was the board's alone (builder/src/content/concept-map.js). Its fonts were
// 18/14/13pt in boxes sized as fixed shares of the zone, under the 18pt floor
// every helper has taken since 4.2.128 (10 September 2026), so "controlled by
// rulers" could not be drawn and its own catalogue example had not built; every
// box was then measured from its words and the spokes set on an ellipse using
// the zone's full width. Both are kept. It also dropped a seventh spoke without
// saying so, which is now refused by name, and a relationship label that would
// print across a box is refused rather than drawn. It moved here on
// 13 September 2026, when every picture became one shared drawing reachable
// from every surface.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//
// Spec:
//   centre   the central idea (filled blue box)
//   spokes   [{ label, relationship? }] two to six ideas, placed round the
//            centre from the top, clockwise
//   highlight the centre or a spoke, named by its own words ("centre" also
//            finds the middle), or a list of them: "look at this one" while
//            the rest steps back (figure-highlight.js). A spoke's line and its
//            relationship are the spoke's, and step back with it.

const T = require('./figure-text');
const highlight = require('./figure-highlight');

// ─── CONSTANTS (ems of the settled font size) ───────────────────────────────
const NODE_PAD = 0.4; // words to border, each side
const NODE_MAX_W = 11;
const NODE_MIN_W = 5;
const NODE_MIN_H = 2.2;
const NODE_RADIUS = 0.45;
const NODE_STROKE = 0.1;
const LINE_STROKE = 0.1;
const REL_MAX_W = 9.6; // a relationship label wraps inside this width
const REL_MAX_LINES = 2;
const REL_PAD = 0.2;
const CLEAR = 0.3; // air kept between any two boxes
const RADIUS_X_MAX = 14; // on paper and on the wall, how far the spokes reach sideways
const PAD = 0.15;
const MAX_SPOKES = 6;
const CENTRE_FILL = '#0070C0';
const SPOKE_LINE = '#E46C0A';
const LINE_COLOUR = '#888888';
// ────────────────────────────────────────────────────────────────────────────

function normalise(spec = {}) {
  const spokes = (Array.isArray(spec.spokes) ? spec.spokes : []).map((s) => ({
    label: s && s.label != null ? String(s.label) : '',
    relationship: s && s.relationship != null && String(s.relationship).trim() ? String(s.relationship) : '',
  }));
  if (spokes.length > MAX_SPOKES) {
    throw new Error(
      `CONCEPT_MAP_TOO_MANY_SPOKES: ${spokes.length} spokes were given and a concept map carries ${MAX_SPOKES}; more crowd round the centre below a readable size. ` +
        'Keep the connections this lesson turns on, or use two maps.'
    );
  }
  return { centre: spec.centre != null ? String(spec.centre) : '', spokes };
}

// A concept map's parts are its centre and its spokes, each named by its own
// words, so the mark follows the idea wherever the spokes are placed round it.
const CENTRE_KEY = 'centre';
function highlightParts(n) {
  const out = [{ key: CENTRE_KEY, aliases: ['center', 'middle', 'central idea', ...(n.centre.trim() ? [n.centre.trim()] : [])] }];
  const seen = new Set();
  n.spokes.forEach((s) => {
    const key = s.label.trim();
    if (key && !seen.has(key) && key.toLowerCase() !== CENTRE_KEY) {
      seen.add(key);
      out.push(key);
    }
  });
  return out;
}

// ─── Pointing at a part (figure-highlight.js) ───────────────────────────────
// The rings round the highlighted parts, and the drawing grown by exactly as
// much as the outermost ring reaches past its edge. A part laid out against
// the edge would otherwise lose half its ring, and a ring pulled inward to fit
// would sit on the words it is pointing at. With nothing highlighted the
// drawing is exactly what it was.
function ringsFor(marked, list, W, H, ink) {
  const long = Math.max(W, H);
  const reach = require('./figure-highlight').ringReach(long); // the ring's pad plus half its stroke
  const out = { svg: '', l: 0, t: 0, r: 0, b: 0 };
  list.forEach(({ key, box: tight, air = 0 }) => {
    if (!marked.has(key)) return;
    // Words have no border of their own, so the ring stands clear of them.
    const box = { x: tight.x - air, y: tight.y - air, w: tight.w + 2 * air, h: tight.h + 2 * air };
    out.svg += highlight.ringSvg(marked, key, box, long, ink);
    out.l = Math.max(out.l, reach - box.x);
    out.t = Math.max(out.t, reach - box.y);
    out.r = Math.max(out.r, box.x + box.w + reach - W);
    out.b = Math.max(out.b, box.y + box.h + reach - H);
  });
  return out;
}

function ringedDoc(W, H, parts, rings) {
  const w = W + rings.l + rings.r;
  const h = H + rings.t + rings.b;
  if (w === W && h === H) return { svg: T.svgDoc(W, H, [...parts, rings.svg]), w, h };
  const f = T.f2;
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="${f(-rings.l)} ${f(-rings.t)} ${f(w)} ${f(h)}">${parts.join('')}${rings.svg}</svg>`,
    w,
    h,
  };
}

function faded(opacity, svg) {
  return opacity < 1 ? `<g opacity="${opacity}">${svg}</g>` : svg;
}

// A faded part that is a filled box keeps a solid paper box under it, so the
// lines it used to cover do not show through it once it steps back.
function backed(opacity, svg, box, paper, rx = 0) {
  if (opacity >= 1) return svg;
  const f = T.f2;
  return `<rect x="${f(box.x)}" y="${f(box.y)}" width="${f(box.w)}" height="${f(box.h)}" rx="${f(rx)}" fill="${paper}"/>` + faded(opacity, svg);
}
// ────────────────────────────────────────────────────────────────────────────

function overlaps(a, b, gap) {
  return a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap;
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = T.resolveProfile(profileOrSurface, box);
  const n = normalise(spec);
  const W = profile.widthPt;
  const count = n.spokes.length;

  const tooSmall = (why) =>
    new Error(
      `CONCEPT_MAP_ZONE_TOO_SMALL: ${why} at the ${profile.minFontPt}pt readable size, in a space ${(W / 72).toFixed(2)}in by ${profile.heightPt ? (profile.heightPt / 72).toFixed(2) : 'open'}in. ` +
        'Give it a larger space, fewer spokes or shorter labels; nothing was shrunk further.'
    );

  // A box as wide as its words need (between the floor and the ceiling), and as
  // tall as its lines. Every spoke shares one box size, so the spokes read as peers.
  const boxFor = (texts, pt) => {
    const widest = Math.max(0, ...texts.map((t) => T.widthPt(T.longestWord(t, pt, true), pt, true)));
    if (widest + 2 * NODE_PAD * pt > NODE_MAX_W * pt) return null;
    const natural = Math.max(0, ...texts.map((t) => T.widthPt(t, pt, true)));
    const w = Math.max(NODE_MIN_W * pt, Math.min(NODE_MAX_W * pt, Math.max(widest, natural) + 2 * NODE_PAD * pt));
    const lines = texts.map((t) => T.wrap(t, pt, w - 2 * NODE_PAD * pt, true) || []);
    const most = Math.max(1, ...lines.map((l) => l.length));
    return { w, h: Math.max(NODE_MIN_H * pt, T.blockHeight(most, pt) + 2 * NODE_PAD * pt), lines };
  };

  const attempt = (pt) => {
    const centre = boxFor([n.centre], pt);
    const spoke = boxFor(count ? n.spokes.map((s) => s.label) : [''], pt);
    if (!centre || !spoke) {
      const all = [n.centre, ...n.spokes.map((s) => s.label)];
      const bad = all.find((t) => T.widthPt(T.longestWord(t, pt, true), pt, true) + 2 * NODE_PAD * pt > NODE_MAX_W * pt);
      return new Error(
        `CONCEPT_MAP_WORD_TOO_WIDE: a word in "${bad}" is wider than ${(NODE_MAX_W * profile.minFontPt / 72).toFixed(2)}in at the ${profile.minFontPt}pt readable size. Use a shorter word; nothing was shrunk further.`
      );
    }
    const rels = n.spokes.map((s) => {
      if (!s.relationship) return null;
      const lines = T.wrap(s.relationship, pt, REL_MAX_W * pt, true);
      if (!lines || lines.length > REL_MAX_LINES) return false;
      return { lines, w: T.linesWidth(lines, pt, true) + 2 * REL_PAD * pt, h: T.blockHeight(lines.length, pt) + REL_PAD * pt };
    });
    if (rels.some((r) => r === false)) return tooSmall('a relationship label takes more than two lines');

    const maxRX = W / 2 - PAD * pt - spoke.w / 2;
    const radiusX = profile.heightPt ? maxRX : Math.min(maxRX, RADIUS_X_MAX * pt);
    if (count && radiusX < centre.w / 2 + spoke.w / 2 + CLEAR * pt) return tooSmall('the centre and the spokes beside it do not fit across');
    const contentW = count ? 2 * radiusX + spoke.w + 2 * PAD * pt : centre.w + 2 * PAD * pt;
    const FW = T.frameWidth(profile, contentW).W;

    // Where everything lands for a given vertical reach, and whether any two
    // boxes (or a relationship label and a box) meet.
    const place = (radiusY) => {
      const cx = FW / 2;
      const cy = PAD * pt + spoke.h / 2 + radiusY;
      const cBox = { x: cx - centre.w / 2, y: cy - centre.h / 2, w: centre.w, h: centre.h };
      const spokes = n.spokes.map((s, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / count;
        const sx = cx + radiusX * Math.cos(a);
        const sy = cy + radiusY * Math.sin(a);
        const rel = rels[i];
        return {
          ...s,
          lines: spoke.lines[i],
          box: { x: sx - spoke.w / 2, y: sy - spoke.h / 2, w: spoke.w, h: spoke.h },
          rel: rel ? { ...rel, x: (cx + sx) / 2 - rel.w / 2, y: (cy + sy) / 2 - rel.h / 2 } : null,
        };
      });
      const gap = CLEAR * pt;
      let clash = false;
      spokes.forEach((s, i) => {
        if (overlaps(s.box, cBox, gap)) clash = true;
        spokes.forEach((o, j) => {
          if (j > i && overlaps(s.box, o.box, gap)) clash = true;
          if (o.rel && overlaps(s.box, o.rel, gap / 2)) clash = true;
          if (o.rel && j > i && s.rel && overlaps(s.rel, o.rel, 0)) clash = true;
        });
        if (s.rel && overlaps(s.rel, cBox, gap / 2)) clash = true;
      });
      return { cx, cy, cBox, spokes, clash, h: cy + radiusY + spoke.h / 2 + PAD * pt };
    };

    if (!count) {
      const cy = PAD * pt + centre.h / 2;
      return { pt, centre, spoke, FW, laid: { cx: FW / 2, cy, cBox: { x: FW / 2 - centre.w / 2, y: PAD * pt, w: centre.w, h: centre.h }, spokes: [], h: centre.h + 2 * PAD * pt } };
    }
    let laid;
    if (profile.heightPt) {
      const radiusY = profile.heightPt / 2 - PAD * pt - spoke.h / 2;
      laid = place(radiusY);
      if (!(radiusY > 0) || laid.clash) return tooSmall(`${count} spokes round "${n.centre}" meet each other or the centre`);
    } else {
      // Paper and the wall grow downwards, so the reach grows until nothing meets.
      for (let radiusY = centre.h / 2 + spoke.h / 2 + CLEAR * pt; radiusY <= 30 * pt; radiusY += 0.25 * pt) {
        laid = place(radiusY);
        if (!laid.clash) break;
      }
      if (laid.clash) return tooSmall(`${count} spokes round "${n.centre}" meet each other or the centre`);
    }
    return { pt, centre, spoke, FW, laid };
  };
  const L = T.settle(profile, attempt);
  return { ...L, ...L.laid, n, profile, W: L.FW, h: L.laid.h };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const { pt, profile } = L;
  const c = profile.colours;
  const font = profile.font;
  const f = T.f2;
  const ink = profile.palette === 'ink';
  const marked = highlight.resolveHighlight(spec, highlightParts(L.n), 'concept map');
  const spokeOp = (s) => highlight.opacityFor(marked, s.label.trim());
  const centreOp = highlight.opacityFor(marked, CENTRE_KEY);
  const parts = [];
  const ringList = [{ key: CENTRE_KEY, box: L.cBox }];
  const node = (b, fill, stroke, cls) =>
    `<rect class="${cls}" x="${f(b.x)}" y="${f(b.y)}" width="${f(b.w)}" height="${f(b.h)}" rx="${f(NODE_RADIUS * pt)}" fill="${fill}" stroke="${stroke}" stroke-width="${f(Math.max(1.25, NODE_STROKE * pt))}"/>`;

  // Lines first, so the boxes sit on top of them.
  L.spokes.forEach((s) => {
    parts.push(faded(spokeOp(s), `<line class="concept-link" x1="${f(L.cx)}" y1="${f(L.cy)}" x2="${f(s.box.x + s.box.w / 2)}" y2="${f(s.box.y + s.box.h / 2)}" stroke="${ink ? c.ink : LINE_COLOUR}" stroke-width="${f(Math.max(1, LINE_STROKE * pt))}"/>`));
  });
  const centreLines = L.centre.lines[0];
  parts.push(backed(centreOp,
    node(L.cBox, ink ? c.paper : CENTRE_FILL, ink ? c.ink : CENTRE_FILL, 'concept-centre') +
    T.textLines(centreLines, L.cx, L.cy - T.blockHeight(centreLines.length, pt) / 2, pt, { fill: ink ? c.ink : '#FFFFFF', font, bold: true }),
    L.cBox, c.paper, NODE_RADIUS * pt));
  L.spokes.forEach((s) => {
    let svg = node(s.box, c.paper, ink ? c.ink : SPOKE_LINE, 'concept-spoke');
    svg += T.textLines(s.lines, s.box.x + s.box.w / 2, s.box.y + (s.box.h - T.blockHeight(s.lines.length, pt)) / 2, pt, { fill: c.ink, font, bold: true });
    if (s.rel) {
      // A white patch behind the relationship, so the line does not run through
      // its words.
      svg += `<rect x="${f(s.rel.x)}" y="${f(s.rel.y)}" width="${f(s.rel.w)}" height="${f(s.rel.h)}" fill="${c.paper}"/>`;
      svg += T.textLines(s.rel.lines, s.rel.x + s.rel.w / 2, s.rel.y + (REL_PAD * pt) / 2, pt, { fill: ink ? c.ink : c.label, font, bold: true, italic: true });
    }
    // The box steps back over a paper box; the relationship's own patch
    // already hides the line behind its words.
    parts.push(backed(spokeOp(s), svg, s.box, c.paper, NODE_RADIUS * pt));
    ringList.push({ key: s.label.trim(), box: s.box });
  });
  const doc = ringedDoc(L.W, L.h, parts, ringsFor(marked, ringList, L.W, L.h, ink));
  return { svg: doc.svg, w: doc.w, h: doc.h, aspect: doc.w / doc.h, layout: L };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = T.resolveProfile(profileOrSurface, box);
  const n = normalise(spec);
  const hi = [...highlight.resolveHighlight(spec, highlightParts(n), 'concept map')].sort().join(',');
  return `concept-map:${T.profileKey(p)}:${JSON.stringify(n)}${hi ? `:hi:${hi}` : ''}`;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, highlightParts, MAX_SPOKES };
