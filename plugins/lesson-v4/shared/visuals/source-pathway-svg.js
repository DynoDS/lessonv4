'use strict';

// THE source pathway: a fan-in figure where two to six distinct sources visibly
// join one named intermediate state and continue to one outcome (mains socket,
// battery, solar cell, dynamo -> electricity -> appliance). One drawing, placed
// by the board, the worksheet, the working wall and the stick-in pack.
//
// Use it when the shared intermediate state is part of the learning and must not
// disappear inside a text chain: each source stays its own node, the joining is
// drawn, and the arrows carry the direction. Nothing is typed as an arrow
// character or flattened into one sentence.
//
// It was the board's alone (builder/src/content/source-pathway.js), in
// PowerPoint shapes, until 13 September 2026, when every picture became one
// shared drawing reachable from every surface. Its rules are kept: two to six
// sources, a middle and an outcome, all sources at one shared size, and a line
// break the author typed inside a source ("Turn handle\nDynamo") kept.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//
// Spec:
//   sources   two to six short labels, each drawn as its own top node
//   middle    the state every source leads into
//   outcome   the final object or state reached from `middle`

const T = require('./figure-text');

// ─── CONSTANTS (ems of the settled font size) ───────────────────────────────
const SOURCE_GAP = 0.6;
const SOURCE_MAX_W = 10; // on paper and on the wall, the widest a source node grows
const NODE_PAD_X = 0.4;
const NODE_PAD_Y = 0.35;
const NODE_RADIUS = 0.4;
const NODE_STROKE = 0.1;
const EMPHASIS = 1.15; // the middle and the outcome print a little larger than the sources
const NODE_MIN_W = 7;
const NODE_MAX_W = 14;
const DROP = 1.0; // from a source down to the joining bar
const ARROW_MIN = 2.2; // each arrow's run at its shortest ...
const ARROW_MAX = 5; // ... and at its longest, in a deep board zone
const CONNECTOR_STROKE = 0.1;
const ARROW_STROKE = 0.16;
const ARROW_HEAD_W = 0.9;
const ARROW_HEAD_H = 0.8;
const PAD = 0.15;
const SOURCE_LINE = '#E46C0A';
const MIDDLE_FILL = '#DEEAF1';
const NODE_LINE = '#0070C0';
const CONNECTOR = '#6F6F6F';
// ────────────────────────────────────────────────────────────────────────────

function text(value) {
  return String(value == null ? '' : value);
}

function normalise(spec = {}) {
  const sources = (Array.isArray(spec.sources) ? spec.sources : []).map(text).filter((v) => v.trim() !== '');
  const middle = text(spec.middle);
  const outcome = text(spec.outcome);
  if (sources.length < 2 || sources.length > 6 || !middle.trim() || !outcome.trim()) {
    throw new Error('SOURCE_PATHWAY_CAPACITY: source-pathway requires 2 to 6 sources, one middle node and one outcome.');
  }
  return { sources, middle, outcome };
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = T.resolveProfile(profileOrSurface, box);
  const n = normalise(spec);
  const W = profile.widthPt;
  const count = n.sources.length;

  const attempt = (pt) => {
    const inner = W - 2 * PAD * pt;
    const across = (inner - (count - 1) * SOURCE_GAP * pt) / count;
    const sourceW = profile.heightPt ? across : Math.min(across, SOURCE_MAX_W * pt);
    const sourceLines = [];
    for (const s of n.sources) {
      const lines = T.wrap(s, pt, sourceW - 2 * NODE_PAD_X * pt, true);
      if (!lines || lines.length > 3) {
        return new Error(
          `SOURCE_PATHWAY_TOO_NARROW: the source "${s.replace(/\n/g, ' ')}" does not fit a node ${(sourceW / 72).toFixed(2)}in wide in three lines at the ${profile.minFontPt}pt readable size. ` +
            'Give the pathway a wider space, fewer sources, or shorter source words.'
        );
      }
      sourceLines.push(lines);
    }
    const sourceH = T.blockHeight(Math.max(...sourceLines.map((l) => l.length)), pt) + 2 * NODE_PAD_Y * pt;
    const big = pt * EMPHASIS;
    const nodeFor = (words) => {
      const widest = T.widthPt(T.longestWord(words, big, true), big, true);
      const natural = Math.max(...words.split(/\n/).map((l) => T.widthPt(l, big, true)));
      const w = Math.min(Math.min(NODE_MAX_W * pt, inner), Math.max(NODE_MIN_W * pt, natural + 2 * NODE_PAD_X * pt));
      if (widest + 2 * NODE_PAD_X * pt > w) return null;
      const lines = T.wrap(words, big, w - 2 * NODE_PAD_X * pt, true);
      return { w, lines, h: T.blockHeight(lines.length, big) + 2 * NODE_PAD_Y * pt };
    };
    const middle = nodeFor(n.middle);
    const outcome = nodeFor(n.outcome);
    if (!middle || !outcome) {
      return new Error(`SOURCE_PATHWAY_TOO_NARROW: a word in "${!middle ? n.middle : n.outcome}" is wider than its node at the ${profile.minFontPt}pt readable size.`);
    }
    const fixed = 2 * PAD * pt + sourceH + DROP * pt + middle.h + outcome.h;
    let arrow = ARROW_MIN * pt;
    if (profile.heightPt) {
      arrow = Math.min(ARROW_MAX * pt, (profile.heightPt - fixed) / 2);
      if (arrow < ARROW_MIN * pt) {
        return new Error(
          `SOURCE_PATHWAY_ZONE_TOO_SHALLOW: the sources, the middle and the outcome need ${((fixed + 2 * ARROW_MIN * pt) / 72).toFixed(2)}in of height at the ${profile.minFontPt}pt readable size and the space is ${(profile.heightPt / 72).toFixed(2)}in. ` +
            'Give the pathway more height.'
        );
      }
    }
    return { pt, big, sourceW, sourceH, sourceLines, middle, outcome, arrow, h: fixed + 2 * arrow };
  };
  const L = T.settle(profile, attempt);
  const rowW = count * L.sourceW + (count - 1) * SOURCE_GAP * L.pt;
  const contentW = Math.max(rowW, L.middle.w, L.outcome.w) + 2 * PAD * L.pt;
  const { W: FW } = T.frameWidth(profile, contentW);
  const cx = FW / 2;
  const top = PAD * L.pt;
  const rowLeft = cx - rowW / 2;
  const sources = n.sources.map((s, i) => ({
    text: s,
    lines: L.sourceLines[i],
    box: { x: rowLeft + i * (L.sourceW + SOURCE_GAP * L.pt), y: top, w: L.sourceW, h: L.sourceH },
  }));
  const joinY = top + L.sourceH + DROP * L.pt;
  const middleBox = { x: cx - L.middle.w / 2, y: joinY + L.arrow, w: L.middle.w, h: L.middle.h };
  const outcomeBox = { x: cx - L.outcome.w / 2, y: middleBox.y + middleBox.h + L.arrow, w: L.outcome.w, h: L.outcome.h };
  return { ...L, n, profile, W: FW, cx, sources, joinY, middleBox, outcomeBox };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const { pt, profile, cx } = L;
  const c = profile.colours;
  const font = profile.font;
  const f = T.f2;
  const ink = profile.palette === 'ink';
  const parts = [];
  const node = (b, fill, stroke, cls) =>
    `<rect class="${cls}" x="${f(b.x)}" y="${f(b.y)}" width="${f(b.w)}" height="${f(b.h)}" rx="${f(NODE_RADIUS * pt)}" fill="${fill}" stroke="${stroke}" stroke-width="${f(Math.max(1.25, NODE_STROKE * pt))}"/>`;
  const connector = ink ? c.ink : CONNECTOR;
  const cw = f(Math.max(1, CONNECTOR_STROKE * pt));
  const arrow = (y1, y2, colour) => {
    const head = y2 - ARROW_HEAD_H * pt;
    return (
      `<g class="pathway-arrow"><line x1="${f(cx)}" y1="${f(y1)}" x2="${f(cx)}" y2="${f(head + 0.5)}" stroke="${colour}" stroke-width="${f(Math.max(1.5, ARROW_STROKE * pt))}"/>` +
      `<polygon points="${f(cx - (ARROW_HEAD_W * pt) / 2)},${f(head)} ${f(cx + (ARROW_HEAD_W * pt) / 2)},${f(head)} ${f(cx)},${f(y2)}" fill="${colour}"/></g>`
    );
  };

  const centres = L.sources.map((s) => s.box.x + s.box.w / 2);
  centres.forEach((x) => parts.push(`<line x1="${f(x)}" y1="${f(L.sources[0].box.y + L.sourceH)}" x2="${f(x)}" y2="${f(L.joinY)}" stroke="${connector}" stroke-width="${cw}"/>`));
  parts.push(`<line x1="${f(centres[0])}" y1="${f(L.joinY)}" x2="${f(centres[centres.length - 1])}" y2="${f(L.joinY)}" stroke="${connector}" stroke-width="${cw}" stroke-linecap="square"/>`);
  const blue = ink ? c.ink : NODE_LINE;
  parts.push(arrow(L.joinY, L.middleBox.y, blue));
  parts.push(arrow(L.middleBox.y + L.middleBox.h, L.outcomeBox.y, blue));

  L.sources.forEach((s) => {
    parts.push(node(s.box, c.paper, ink ? c.ink : SOURCE_LINE, 'pathway-source'));
    parts.push(T.textLines(s.lines, s.box.x + s.box.w / 2, s.box.y + (s.box.h - T.blockHeight(s.lines.length, pt)) / 2, pt, { fill: c.ink, font, bold: true }));
  });
  [[L.middleBox, L.middle, ink ? '#EDEDED' : MIDDLE_FILL, 'pathway-middle'], [L.outcomeBox, L.outcome, c.paper, 'pathway-outcome']].forEach(([b, nodeText, fill, cls]) => {
    parts.push(node(b, fill, blue, cls));
    parts.push(T.textLines(nodeText.lines, b.x + b.w / 2, b.y + (b.h - T.blockHeight(nodeText.lines.length, L.big)) / 2, L.big, { fill: c.ink, font, bold: true }));
  });
  return { svg: T.svgDoc(L.W, L.h, parts), w: L.W, h: L.h, aspect: L.W / L.h, layout: L };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = T.resolveProfile(profileOrSurface, box);
  return `source-pathway:${T.profileKey(p)}:${JSON.stringify(normalise(spec))}`;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout };
