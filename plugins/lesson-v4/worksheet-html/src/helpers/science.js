"use strict";

// The three thinking diagrams: a circuit, an identification key, and a chain of
// boxes joined by arrows.
//
// They are the last three helpers from the Word builder, and they share one
// property that decides how they are drawn. In each of them the ARRANGEMENT is
// the content: a circuit teaches whether the loop is complete, a key teaches
// which branch you followed, a chain teaches that this leads to that. Print any
// of the three as a list and the thing being taught disappears.
//
// Drawn as inline SVG, because all three are line drawings and none of them
// wants a browser's text flow. Every label is sized against the viewBox so the
// engine's legibility floor can hold them to the design system's smallest size:
// a drawing that fits its zone and prints its labels at three point is a
// drawing that passes every check and cannot be read.

const { esc, linesFor, LINE_MM, heightFromAspect } = require("./shared");
const circuitShared = require("../../../shared/visuals/circuit-diagram-svg");

const WIDEST_ZONE_MM = 261;

function stemHtml(spec) {
  return spec.text ? `<p class="h-sci-stem">${esc(spec.text)}</p>` : "";
}

function stemMm(spec, widthMm) {
  return spec.text ? linesFor(spec.text, widthMm) * LINE_MM + 2 : 0;
}

// Instruction on top, drawing beneath, in one box that owns the zone's height.
//
// Without the wrapper this clipped by exactly the height of the instruction.
// `.h-figure` claims `height: 100%`, which is the zone's FULL height, so a
// stem printed above it pushed the pair past the bottom by however tall the
// stem was. Both the circuit row and the chain lost 7.9mm off the foot, and
// nothing about either page looked wrong.
function withStem(spec, svg) {
  return `<div class="h-sci">${stemHtml(spec)}<div class="h-figure">${svg}</div></div>`;
}

// ─── circuit-diagram ─────────────────────────────────────────────────────
// One series circuit or a row of them, in the standard schematic symbols. Each
// circuit carries a `state`, so one helper covers the whole electricity unit:
// naming the parts, building a circuit, and the "will the lamp light?"
// reasoning that turns on whether the loop is complete AND has a cell in it.
//
// States: complete | gap | no-cell | switch-open.
//
// Mix the states across a row. A row that is all gaps teaches a child to spot a
// pattern rather than to check the circuit, which is the opposite of the point.

// The circuit itself is drawn by the SHARED module, so the diagram on the board
// and the diagram on the sheet are the same drawing rather than two hand-made
// ones that disagree about what an open switch looks like. This file keeps only
// what is worksheet-specific: the stem above it, and how it is measured and
// fitted into a zone.

function circuitGeometry(spec) {
  const circuits = Array.isArray(spec.circuits) ? spec.circuits : [];
  const count = Math.max(1, circuits.length);
  const { aspect } = circuitShared.tightSvg(spec);
  return { count, aspect };
}

function renderCircuitDiagram(spec) {
  const { svg } = circuitShared.tightSvg(spec);
  return withStem(spec, svg);
}

function measureCircuitDiagram(spec, widthMm) {
  const { aspect } = circuitGeometry(spec);
  return stemMm(spec, widthMm) + heightFromAspect(aspect, widthMm, 150);
}

function needsCircuitDiagram(spec) {
  const { count } = circuitGeometry(spec);
  return {
    // A circuit stops being readable somewhere around 40mm across: below that
    // the cell's two plates merge and the switch blade is a smudge. So the
    // width follows how MANY circuits are asked to share the row, which is the
    // rule the rest of the engine works to.
    minWidthMm: Math.min(267, count * 42),
    minHeightMm: 40,
  };
}

// ─── classification-key ──────────────────────────────────────────────────
// A branching yes/no identification key down to named living things.
//
// The caller gives a nested structure and never a coordinate: the helper walks
// the tree, spreads the leaves evenly and puts every parent at the midpoint of
// its two children. That is what keeps the branches from crossing, and it is
// also why a key cannot be authored as a list of boxes and lines.

// These numbers are not the Word builder's, and the reason is worth keeping.
//
// Its key drew 180-unit boxes in an 860-unit canvas with 13-unit branch labels,
// then rasterised the lot to a PNG at a fixed size, so nothing ever asked how
// big those labels printed. Here the drawing is scaled to its zone, and the
// engine's legibility floor did ask: at those proportions a Yes/No only reaches
// the design system's smallest size once the key is 210mm wide, which is wider
// than a portrait page. The helper was refused everywhere and correctly so.
//
// What matters is the RATIO of type to canvas, so the canvas came down rather
// than the type going up: narrower boxes with their questions wrapped onto two
// lines. A four-answer key now reads at 140mm and fits a portrait sheet.
const KEY_SLOT_W = 140; // one leaf's share of the width, in viewBox units
const KEY_LEVEL_H = 96;
const KEY_BOX_W = 122;
const KEY_LINE_H = 17;
const KEY_PAD_X = 20;
const KEY_PAD_Y = 12;
const KEY_TEXT_PT = 14;
const KEY_BRANCH_PT = 13;
const KEY_MAX_LINES = 2;

// Roughly how many characters of bold text fit one line inside a box.
const KEY_CHAR_UNITS = KEY_TEXT_PT * 0.58;

function wrapKeyText(text) {
  const words = String(text == null ? "" : text).split(/\s+/).filter(Boolean);
  const perLine = Math.max(4, Math.floor((KEY_BOX_W - 10) / KEY_CHAR_UNITS));
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= perLine || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, KEY_MAX_LINES);
}

// A box is as tall as the lines it holds, and every box on the sheet is drawn
// the same height so the rows read as rows.
function keyBoxH(all) {
  const most = all.reduce(
    (n, node) => Math.max(n, wrapKeyText(isLeaf(node) ? node.leaf : node.q).length),
    1
  );
  return Math.max(2, most) * KEY_LINE_H + 12;
}

function isLeaf(node) {
  return Boolean(node) && node.leaf !== undefined;
}

// Laying the tree out is three walks, in this order, and the order matters: a
// node's horizontal place depends on its children's, so the leaves have to be
// numbered before anything can be positioned.
function layoutKey(root) {
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
    node.slot = (place(node.no) + place(node.yes)) / 2;
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

function keyGeometry(spec) {
  const tree = spec.tree ? JSON.parse(JSON.stringify(spec.tree)) : { leaf: "" };
  const { leaves, all, depth } = layoutKey(tree);
  const boxH = keyBoxH(all);
  const levelH = Math.max(KEY_LEVEL_H, boxH + 44); // the box, plus a branch run
  const w = Math.max(1, leaves.length) * KEY_SLOT_W + KEY_PAD_X * 2;
  const h = depth * levelH + boxH + KEY_PAD_Y * 2;
  return { tree, leaves, all, depth, boxH, levelH, w, h, aspect: w / h };
}

function renderClassificationKey(spec) {
  const { tree, all, boxH, levelH, w, h } = keyGeometry(spec);
  const cx = (n) => KEY_PAD_X + KEY_SLOT_W / 2 + n.slot * KEY_SLOT_W;
  const cy = (n) => KEY_PAD_Y + boxH / 2 + n.depth * levelH;

  const edges = [];
  (function walk(n) {
    if (isLeaf(n)) return;
    for (const [child, answer] of [
      [n.no, "No"],
      [n.yes, "Yes"],
    ]) {
      if (!child) continue;
      const x1 = cx(n);
      const y1 = cy(n) + boxH / 2;
      const x2 = cx(child);
      const y2 = cy(child) - boxH / 2;
      edges.push(
        `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="currentColor" stroke-width="1.6"/>`
      );
      // The Yes/No sits on a white patch, because a word printed straight over
      // the branch line it labels is unreadable on paper even though it looks
      // fine on a screen at full zoom.
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      edges.push(
        `<rect x="${mx - 13}" y="${my - 11}" width="26" height="20" rx="4" fill="#FFFFFF"/>`,
        `<text x="${mx}" y="${my + 4}" font-size="${KEY_BRANCH_PT}" font-weight="bold" text-anchor="middle" fill="currentColor">${answer}</text>`
      );
      walk(child);
    }
  })(tree);

  const boxes = all.map((n) => {
    const leaf = isLeaf(n);
    const x = cx(n) - KEY_BOX_W / 2;
    const y = cy(n) - boxH / 2;
    // A named answer is where the key ARRIVES, so it is set apart from the
    // questions on the way to it. By weight and a filled box, not by a colour
    // of its own: on a worksheet green means vocabulary and nothing else.
    const fill = leaf ? "var(--colour-tint)" : "#FFFFFF";
    const lines = wrapKeyText(leaf ? n.leaf : n.q);
    const top = cy(n) - ((lines.length - 1) * KEY_LINE_H) / 2 + 5;
    const tspans = lines
      .map(
        (line, i) =>
          `<tspan x="${cx(n)}" y="${top + i * KEY_LINE_H}">${esc(line)}</tspan>`
      )
      .join("");
    return (
      `<rect x="${x}" y="${y}" width="${KEY_BOX_W}" height="${boxH}" rx="8" fill="${fill}" stroke="currentColor" stroke-width="2"/>` +
      `<text font-size="${KEY_TEXT_PT}" font-weight="bold" text-anchor="middle" fill="currentColor">${tspans}</text>`
    );
  });

  return withStem(spec, `<svg viewBox="0 0 ${w} ${h}" class="h-key" role="img"><g>${edges.join("")}${boxes.join("")}</g></svg>`);
}

function measureClassificationKey(spec, widthMm) {
  const { aspect } = keyGeometry(spec);
  return stemMm(spec, widthMm) + heightFromAspect(aspect, widthMm, 180);
}

function needsClassificationKey(spec) {
  const { leaves, depth } = keyGeometry(spec);
  return {
    // Both directions follow the tree: every extra answer the key can reach
    // costs width, and every extra question costs a level of height.
    minWidthMm: Math.min(267, Math.max(90, leaves.length * 34)),
    minHeightMm: (depth + 1) * 20,
  };
}

// ─── process-chain ───────────────────────────────────────────────────────
// Boxes joined by arrows: a food chain, a life cycle, the order of events.
//
// The arrows are the helper. They carry the "this leads to that" the task is
// testing, which is exactly what a list of the same words in the same order
// does not say.

const PC_BOX_W = 150;
const PC_BOX_H = 70;
const PC_GAP = 46;
const PC_PAD = 12;
const PC_TEXT_PT = 18;

function chainGeometry(spec) {
  const boxes = spec.boxes || [];
  const n = Math.max(1, boxes.length);
  const w = n * PC_BOX_W + (n - 1) * PC_GAP + PC_PAD * 2;
  const h = PC_BOX_H + PC_PAD * 2;
  return { boxes, n, w, h, aspect: w / h };
}

function renderProcessChain(spec) {
  const { boxes, n, w, h } = chainGeometry(spec);
  const parts = [
    `<defs><marker id="h-pc-arrow" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto">` +
      `<path d="M0,0 L7,3 L0,6 Z" fill="currentColor"/></marker></defs>`,
  ];

  for (let i = 0; i < n; i += 1) {
    const x = PC_PAD + i * (PC_BOX_W + PC_GAP);
    parts.push(
      `<rect x="${x}" y="${PC_PAD}" width="${PC_BOX_W}" height="${PC_BOX_H}" rx="8" fill="none" stroke="currentColor" stroke-width="2"/>`
    );
    // A box with nothing in it is one the child fills in, and that is the
    // whole "complete the sequence" task: give them the ones they need and
    // leave the rest empty.
    if (boxes[i] !== null && boxes[i] !== undefined && boxes[i] !== "") {
      parts.push(
        `<text x="${x + PC_BOX_W / 2}" y="${PC_PAD + PC_BOX_H / 2 + 6}" font-size="${PC_TEXT_PT}" font-weight="bold" text-anchor="middle" fill="currentColor">${esc(boxes[i])}</text>`
      );
    }
    if (i < n - 1) {
      const ay = PC_PAD + PC_BOX_H / 2;
      parts.push(
        `<line x1="${x + PC_BOX_W + 6}" y1="${ay}" x2="${x + PC_BOX_W + PC_GAP - 8}" y2="${ay}" stroke="currentColor" stroke-width="3.5" marker-end="url(#h-pc-arrow)"/>`
      );
    }
  }

  return withStem(spec, `<svg viewBox="0 0 ${w} ${h}" class="h-chain" role="img"><g>${parts.join("")}</g></svg>`);
}

function measureProcessChain(spec, widthMm) {
  const { aspect } = chainGeometry(spec);
  return stemMm(spec, widthMm) + heightFromAspect(aspect, widthMm, 90);
}

function needsProcessChain(spec) {
  const { n } = chainGeometry(spec);
  return {
    // A box a child writes a word into, plus room for the arrow after it.
    // Five boxes in a chain need more than three, and a constant cannot know.
    minWidthMm: Math.min(267, n * 34),
    minHeightMm: 24,
  };
}

const css = `
  /* The instruction takes its own height and the drawing takes what is left.
     Without this the drawing's own "height: 100%" meant the FULL zone, and the
     stem above it pushed the pair off the bottom by exactly its own height. */
  .h-sci { height: 100%; display: flex; flex-direction: column; }
  .h-sci .h-figure { flex: 1 1 auto; height: auto; min-height: 0; }
  .h-sci-stem {
    margin: 0 0 var(--space-tight);
    font-size: var(--type-body); line-height: 1.35;
    flex: none;
  }
  /* All three inherit the ink colour and draw with currentColor, so a single
     rule keeps them inside the token system rather than each carrying its own
     palette. The Word originals hard-coded four hex values between them. */
  .h-circuit, .h-key, .h-chain { color: var(--colour-ink); }
`;

const helpers = {
  "circuit-diagram": {
    render: renderCircuitDiagram,
    measure: measureCircuitDiagram,
    needs: needsCircuitDiagram,
    // A bigger circuit is an easier one to read the symbols on, up to the cap
    // in its measurement.
    // Nought: this is an SVG scaled by its width, so extra height cannot make
    // it bigger. It would only grow the box and leave the drawing at the top.
    greed: 0,
  },
  "classification-key": {
    render: renderClassificationKey,
    measure: measureClassificationKey,
    needs: needsClassificationKey,
    // Nought: this is an SVG scaled by its width, so extra height cannot make
    // it bigger. It would only grow the box and leave the drawing at the top.
    greed: 0,
  },
  "process-chain": {
    render: renderProcessChain,
    measure: measureProcessChain,
    needs: needsProcessChain,
    // A chain is a strip. Extra height only stretches the boxes away from the
    // arrows that join them.
    greed: 0,
  },
};

module.exports = { helpers, css };
