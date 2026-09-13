'use strict';

// THE process chain: boxes joined by arrows. A food chain, a life cycle, the
// order of events. One drawing, placed by the board, the worksheet, the working
// wall and the stick-in pack.
//
// The arrows are the picture. They carry the "this leads to that" the task is
// testing, which a list of the same words in the same order does not say.
//
// It was the worksheet's alone (worksheet-html/src/helpers/science.js), drawn in
// a fixed 150-unit box scaled to its zone with one unwrapped line of 18-unit
// type, so a stage named "caterpillar makes a chrysalis" ran out of its box and
// no other surface could draw the chain at all (13 September 2026: every picture
// became one shared drawing reachable from every surface).
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//
// Spec:
//   boxes   the stages in order. A box that is null, missing or "" is left
//           empty for the child to write in, which is the whole "complete the
//           sequence" task: give them the ones they need and leave the rest.
//   text    the question above the chain (the worksheet prints it as its own
//           line of sheet text; the other surfaces draw it above the boxes)

const T = require('./figure-text');

// ─── CONSTANTS (in ems of the settled font size) ─────────────────────────────
const BOX_PAD_X = 0.5; // words to the box edge, each side
const BOX_PAD_Y = 0.45;
// An empty box is somewhere a child writes a word, so it is never shallower
// than a written word needs, whatever its filled neighbours hold.
const BOX_MIN_H = 3.2;
const BOX_MIN_W = 4.5;
// The widest a box grows. On paper and on the wall a chain of three short
// words does not need to span the page to be read.
const BOX_MAX_W = 11;
const BOX_RADIUS = 0.6;
const BOX_STROKE = 0.14;
const ARROW_W = 2.6; // the arrow between two boxes, tail to tip
const ARROW_GAP = 0.35; // air between a box edge and the arrow
const ARROW_STROKE = 0.3;
const ARROW_HEAD_W = 0.9;
const ARROW_HEAD_H = 0.95;
const STEM_GAP = 0.6;
const PAD = 0.15;
const MAX_BOXES = 8;
// ────────────────────────────────────────────────────────────────────────────

function filled(v) {
  return v !== null && v !== undefined && String(v).trim() !== '';
}

function normalise(spec = {}) {
  const boxes = Array.isArray(spec.boxes) ? spec.boxes.map((b) => (filled(b) ? String(b) : null)) : [];
  if (boxes.length < 1) {
    throw new Error('PROCESS_CHAIN_INVALID: a process chain needs `boxes`, one entry per stage (null for a box the child fills).');
  }
  if (boxes.length > MAX_BOXES) {
    throw new Error(
      `PROCESS_CHAIN_TOO_MANY_BOXES: ${boxes.length} stages were asked for and ${MAX_BOXES} is the most one chain carries at a readable size. ` +
        'Split the sequence into two chains, or drop the stages this question does not ask about.'
    );
  }
  return { boxes, text: spec.text == null ? '' : String(spec.text).trim() };
}

function layoutAt(n, profile, pt) {
  const bold = profile.bold;
  const W = profile.widthPt;
  const arrowRun = ARROW_W + 2 * ARROW_GAP;
  const across = (W - 2 * PAD * pt - (n.boxes.length - 1) * arrowRun * pt) / n.boxes.length;
  const boxW = Math.min(BOX_MAX_W * pt, across);
  if (boxW < BOX_MIN_W * pt) {
    return new Error(
      `PROCESS_CHAIN_TOO_NARROW: ${n.boxes.length} boxes and their arrows need ${(((BOX_MIN_W + arrowRun) * n.boxes.length - arrowRun + 2 * PAD) * profile.minFontPt / 72 * 25.4).toFixed(0)}mm ` +
        `across at the ${profile.minFontPt}pt readable size and this space is ${(W / 72 * 25.4).toFixed(0)}mm. Give the chain more width, or split it into two chains.`
    );
  }
  const inner = boxW - 2 * BOX_PAD_X * pt;
  const lines = [];
  for (const b of n.boxes) {
    if (!b) {
      lines.push([]);
      continue;
    }
    const wrapped = T.wrap(b, pt, inner, true);
    if (!wrapped) {
      return new Error(
        `PROCESS_CHAIN_WORD_TOO_WIDE: the word "${T.longestWord(b, pt, true)}" in "${b}" is wider than its box at the ${profile.minFontPt}pt readable size. ` +
          'Use a shorter word, or give the chain more width; a word is never split.'
      );
    }
    if (wrapped.length > 3) {
      return new Error(
        `PROCESS_CHAIN_STAGE_TOO_LONG: "${b}" takes ${wrapped.length} lines in its box at the ${profile.minFontPt}pt readable size, and a stage holds three. ` +
          'A stage is a few words; put the explanation in the question.'
      );
    }
    lines.push(wrapped);
  }
  const most = Math.max(0, ...lines.map((l) => l.length));
  const boxH = Math.max(BOX_MIN_H * pt, T.blockHeight(most, pt) + 2 * BOX_PAD_Y * pt);
  const stemLines = n.text ? T.wrap(n.text, pt, W - 2 * PAD * pt, bold) : [];
  if (stemLines === null) return new Error(`PROCESS_CHAIN_TOO_NARROW: a word in the question "${n.text}" is wider than this space.`);
  const stemH = stemLines.length ? T.blockHeight(stemLines.length, pt) + STEM_GAP * pt : 0;
  const contentW = n.boxes.length * boxW + (n.boxes.length - 1) * arrowRun * pt + 2 * PAD * pt;
  const h = stemH + boxH + 2 * PAD * pt;
  if (profile.heightPt && h > profile.heightPt + 0.5) {
    return new Error(
      `PROCESS_CHAIN_ZONE_TOO_SHALLOW: the chain needs ${(h / 72).toFixed(2)}in of height at the ${profile.minFontPt}pt readable size and the space is ${(profile.heightPt / 72).toFixed(2)}in. ` +
        'Give it more height, or shorten the stages.'
    );
  }
  return { pt, boxW, boxH, lines, stemLines, stemH, contentW, h };
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = T.resolveProfile(profileOrSurface, box);
  const n = normalise(spec);
  const L = T.settle(profile, (pt) => layoutAt(n, profile, pt));
  const { W, dx } = T.frameWidth(profile, L.contentW);
  const x0 = dx + PAD * L.pt;
  const top = PAD * L.pt + L.stemH;
  const arrowRun = (ARROW_W + 2 * ARROW_GAP) * L.pt;
  const boxes = n.boxes.map((text, i) => ({
    text,
    x: x0 + i * (L.boxW + arrowRun),
    y: top,
    w: L.boxW,
    h: L.boxH,
    lines: L.lines[i],
  }));
  return { ...L, n, profile, W, dx, boxes, stemX: dx + PAD * L.pt };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const { pt, profile } = L;
  const c = profile.colours;
  const font = profile.font;
  const parts = [];
  if (L.stemLines.length) {
    parts.push(T.textLines(L.stemLines, L.stemX, PAD * pt, pt, { fill: c.ink, font, bold: profile.bold, anchor: 'start' }));
  }
  L.boxes.forEach((b, i) => {
    parts.push(
      `<rect x="${T.f2(b.x)}" y="${T.f2(b.y)}" width="${T.f2(b.w)}" height="${T.f2(b.h)}" rx="${T.f2(BOX_RADIUS * pt)}" fill="${c.paper}" stroke="${c.ink}" stroke-width="${T.f2(Math.max(1, BOX_STROKE * pt))}"/>`
    );
    if (b.lines.length) {
      const top = b.y + (b.h - T.blockHeight(b.lines.length, pt)) / 2;
      parts.push(T.textLines(b.lines, b.x + b.w / 2, top, pt, { fill: c.ink, font, bold: true }));
    }
    if (i < L.boxes.length - 1) {
      const y = b.y + b.h / 2;
      const x1 = b.x + b.w + ARROW_GAP * pt;
      const tip = x1 + ARROW_W * pt;
      const headL = tip - ARROW_HEAD_W * pt;
      parts.push(
        `<g class="chain-arrow"><rect x="${T.f2(x1)}" y="${T.f2(y - (ARROW_STROKE * pt) / 2)}" width="${T.f2(headL - x1 + 0.5)}" height="${T.f2(ARROW_STROKE * pt)}" fill="${c.ink}"/>` +
          `<polygon points="${T.f2(tip)},${T.f2(y)} ${T.f2(headL)},${T.f2(y - (ARROW_HEAD_H * pt) / 2)} ${T.f2(headL)},${T.f2(y + (ARROW_HEAD_H * pt) / 2)}" fill="${c.ink}"/></g>`
      );
    }
  });
  const h = L.h;
  return { svg: T.svgDoc(L.W, h, parts), w: L.W, h, aspect: L.W / h, layout: L };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = T.resolveProfile(profileOrSurface, box);
  return `process-chain:${T.profileKey(p)}:${JSON.stringify(normalise(spec))}`;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, MAX_BOXES };
