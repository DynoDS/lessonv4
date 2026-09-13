'use strict';

// THE classification key: a branching yes/no identification key down to named
// living things. One drawing, placed by the board, the worksheet, the working
// wall and the stick-in pack.
//
// The caller gives a nested structure and never a coordinate: the drawing walks
// the tree, spreads the answers evenly and puts every question at the midpoint
// of its two branches. That is what keeps the branches from crossing (a key
// whose lines cross sends a child following a branch to the wrong creature),
// and it is also why a key cannot be authored as a list of boxes and lines.
//
// It was the worksheet's alone (worksheet-html/src/helpers/science.js), drawn in
// a fixed 860-unit canvas scaled to its zone. That canvas was narrowed once
// already, because at the Word builder's proportions a Yes/No only reached the
// sheet's smallest readable size on a key 210mm wide, wider than a portrait page;
// and it counted characters to wrap a question and quietly dropped any third
// line. It moved here on 13 September 2026, when every picture became one
// shared drawing reachable from every surface: every word is now measured at the
// size it prints, and a question too long for its box is refused by name.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//
// Spec:
//   tree   { q, no, yes } for a question, { leaf } for a named answer; `no`
//          branches left and `yes` right
//   text   the question above the key (the worksheet prints it as its own line
//          of sheet text; the other surfaces draw it above the key)

const T = require('./figure-text');

// ─── CONSTANTS (ems of the settled font size) ───────────────────────────────
const SLOT_MAX = 11; // one answer's share of the width, at most
const BOX_SHARE = 0.87; // of a slot, the box inside it
const BOX_PAD_X = 0.45;
const BOX_PAD_Y = 0.4;
const BOX_RADIUS = 0.55;
const BOX_STROKE = 0.14;
const BRANCH_RUN = 3.2; // the vertical run of a branch between two rows of boxes
const BRANCH_STROKE = 0.11;
const PATCH_PAD = 0.2; // white around a Yes or No so the branch line does not cross it
const MAX_LINES = 3;
const STEM_GAP = 0.6;
const PAD = 0.15;
const LEAF_FILL = '#F1F4F5';
const LEAF_FILL_INK = '#EDEDED';
// ────────────────────────────────────────────────────────────────────────────

function isLeaf(node) {
  return Boolean(node) && node.leaf !== undefined;
}

// Laying the tree out is three walks, in this order, and the order matters: a
// node's horizontal place depends on its children's, so the leaves have to be
// numbered before anything can be positioned.
function layoutTree(root) {
  const leaves = [];
  (function collect(node, depth) {
    if (!node) return;
    node.depth = depth;
    if (isLeaf(node)) {
      node.slot = leaves.length;
      leaves.push(node);
      return;
    }
    collect(node.no, depth + 1);
    collect(node.yes, depth + 1);
  })(root, 0);
  (function place(node) {
    if (!node) return 0;
    if (isLeaf(node)) return node.slot;
    const kids = [node.no, node.yes].filter(Boolean);
    node.slot = kids.length ? kids.map(place).reduce((a, b) => a + b, 0) / kids.length : 0;
    return node.slot;
  })(root);
  const all = [];
  (function gather(node) {
    if (!node) return;
    all.push(node);
    if (!isLeaf(node)) {
      gather(node.no);
      gather(node.yes);
    }
  })(root);
  return { leaves, all, depth: all.reduce((d, n) => Math.max(d, n.depth), 0) };
}

function normalise(spec = {}) {
  const tree = spec.tree ? JSON.parse(JSON.stringify(spec.tree)) : { leaf: '' };
  return { tree, text: spec.text == null ? '' : String(spec.text).trim() };
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = T.resolveProfile(profileOrSurface, box);
  const n = normalise(spec);
  const { leaves, all, depth } = layoutTree(n.tree);
  const slots = Math.max(1, leaves.length);

  const attempt = (pt) => {
    const avail = profile.widthPt - 2 * PAD * pt;
    const slotW = Math.min(avail / slots, SLOT_MAX * pt);
    const boxW = slotW * BOX_SHARE;
    const inner = boxW - 2 * BOX_PAD_X * pt;
    const lines = new Map();
    for (const node of all) {
      const words = isLeaf(node) ? String(node.leaf == null ? '' : node.leaf) : String(node.q == null ? '' : node.q);
      const wrapped = T.wrap(words, pt, inner, true);
      if (!wrapped) {
        return new Error(
          `CLASSIFICATION_KEY_WORD_TOO_WIDE: the word "${T.longestWord(words, pt, true)}" in "${words}" is wider than its box at the ${profile.minFontPt}pt readable size. ` +
            'Give the key more width, use a shorter word, or split the key; a word is never split.'
        );
      }
      if (wrapped.length > MAX_LINES) {
        return new Error(
          `CLASSIFICATION_KEY_TEXT_TOO_LONG: "${words}" takes ${wrapped.length} lines in its box at the ${profile.minFontPt}pt readable size, and a box holds ${MAX_LINES}. ` +
            'Shorten the question (a key asks one short thing at each step), or give the key more width.'
        );
      }
      lines.set(node, wrapped);
    }
    const most = Math.max(1, ...[...lines.values()].map((l) => l.length));
    const boxH = T.blockHeight(Math.max(2, most), pt) + 2 * BOX_PAD_Y * pt;
    const levelH = boxH + BRANCH_RUN * pt;
    const stem = n.text ? T.wrap(n.text, pt, avail, true) : [];
    if (stem === null) return new Error(`CLASSIFICATION_KEY_TOO_NARROW: a word in the question "${n.text}" is wider than the key.`);
    const stemH = stem.length ? T.blockHeight(stem.length, pt) + STEM_GAP * pt : 0;
    const h = 2 * PAD * pt + stemH + depth * levelH + boxH;
    if (profile.heightPt && h > profile.heightPt + 0.5) {
      return new Error(
        `CLASSIFICATION_KEY_ZONE_TOO_SHALLOW: a key ${depth + 1} rows deep needs ${(h / 72).toFixed(2)}in of height at the ${profile.minFontPt}pt readable size and the space is ${(profile.heightPt / 72).toFixed(2)}in. ` +
          'Give it more height, or split the key.'
      );
    }
    return { pt, slotW, boxW, boxH, levelH, lines, stem, stemH, h };
  };
  const L = T.settle(profile, attempt);
  const contentW = slots * L.slotW + 2 * PAD * L.pt;
  const { W, dx } = T.frameWidth(profile, contentW);
  const x0 = dx + PAD * L.pt;
  const top = PAD * L.pt + L.stemH;
  const cx = (node) => x0 + L.slotW / 2 + node.slot * L.slotW;
  const cy = (node) => top + L.boxH / 2 + node.depth * L.levelH;
  const boxes = all.map((node) => ({
    leaf: isLeaf(node),
    lines: L.lines.get(node),
    x: cx(node) - L.boxW / 2,
    y: cy(node) - L.boxH / 2,
    w: L.boxW,
    h: L.boxH,
    depth: node.depth,
  }));
  return { ...L, n, profile, W, dx, all, leaves, depth, cx, cy, boxes, stemX: dx + PAD * L.pt };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const { pt, profile, cx, cy } = L;
  const c = profile.colours;
  const font = profile.font;
  const f = T.f2;
  const parts = [];
  const branches = [];

  if (L.stem.length) parts.push(T.textLines(L.stem, L.stemX, PAD * pt, pt, { fill: c.ink, font, bold: profile.bold, anchor: 'start' }));

  (function walk(node) {
    if (!node || isLeaf(node)) return;
    for (const [child, answer] of [[node.no, 'No'], [node.yes, 'Yes']]) {
      if (!child) continue;
      const x1 = cx(node);
      const y1 = cy(node) + L.boxH / 2;
      const x2 = cx(child);
      const y2 = cy(child) - L.boxH / 2;
      parts.push(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c.ink}" stroke-width="${f(Math.max(1, BRANCH_STROKE * pt))}"/>`);
      // The Yes/No sits on a white patch, because a word printed straight over
      // the branch line it labels is unreadable on paper even though it looks
      // fine on a screen at full zoom.
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const w = T.widthPt(answer, pt, true) + 2 * PATCH_PAD * pt;
      const h = T.blockHeight(1, pt);
      branches.push(`<rect x="${f(mx - w / 2)}" y="${f(my - h / 2)}" width="${f(w)}" height="${f(h)}" rx="${f(0.25 * pt)}" fill="${c.paper}"/>`);
      branches.push(`<text class="key-branch" x="${f(mx)}" y="${f(my - h / 2 + pt * T.BASELINE + 0.12 * pt)}" text-anchor="middle" font-family="${font}" font-size="${f(pt)}" font-weight="bold" fill="${c.ink}">${answer}</text>`);
      walk(child);
    }
  })(L.n.tree);
  parts.push(...branches);

  const leafFill = profile.palette === 'ink' ? LEAF_FILL_INK : LEAF_FILL;
  L.boxes.forEach((b) => {
    // A named answer is where the key ARRIVES, so it is set apart from the
    // questions on the way to it. By a filled box, not by a colour of its own:
    // on a worksheet green means vocabulary and nothing else.
    parts.push(`<rect class="${b.leaf ? 'key-leaf' : 'key-question'}" x="${f(b.x)}" y="${f(b.y)}" width="${f(b.w)}" height="${f(b.h)}" rx="${f(BOX_RADIUS * pt)}" fill="${b.leaf ? leafFill : c.paper}" stroke="${c.ink}" stroke-width="${f(Math.max(1, BOX_STROKE * pt))}"/>`);
    if (b.lines.length) {
      parts.push(T.textLines(b.lines, b.x + b.w / 2, b.y + (b.h - T.blockHeight(b.lines.length, pt)) / 2, pt, { fill: c.ink, font, bold: true }));
    }
  });

  return { svg: T.svgDoc(L.W, L.h, parts), w: L.W, h: L.h, aspect: L.W / L.h, layout: L };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = T.resolveProfile(profileOrSurface, box);
  return `classification-key:${T.profileKey(p)}:${JSON.stringify(normalise(spec))}`;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, layoutTree };
