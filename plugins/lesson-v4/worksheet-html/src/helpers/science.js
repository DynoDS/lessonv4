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

// ─── classification-key and process-chain ────────────────────────────────
// Both are drawn by their shared drawings (shared/visuals/classification-key-svg.js
// and process-chain-svg.js), the same ones the board, the wall and the stick-in
// pack place (13 September 2026). What stays here is the sheet's own: the
// instruction printed above as a line of sheet text, and the drawing laid out at
// the width it prints.

const { atPrintedWidth } = require("./at-printed-width");
const classificationKeyShared = require("../../../shared/visuals/classification-key-svg");
const processChainShared = require("../../../shared/visuals/process-chain-svg");

// The instruction goes above the drawing as sheet text rather than inside it,
// like every other science helper here, so it wraps and prints at the sheet's
// body size.
function withSheetStem(helper) {
  return {
    ...helper,
    render: (spec, width) => {
      const figure = helper.render(spec, width);
      return `<div class="h-sci">${stemHtml(spec)}${figure}</div>`;
    },
    measure: (spec, width) => {
      const mm = typeof width === "number" ? width : width && width.widthMm;
      return stemMm(spec, mm || WIDEST_ZONE_MM) + helper.measure(spec, width);
    },
    needs: (spec, width) => {
      const inner = helper.needs(spec, width);
      // Words wrap onto more lines in a narrower zone, so the shortest this can
      // come out is whichever of the narrowest and widest zones is shorter.
      const atNarrowest = inner.minHeightMm + stemMm(spec, inner.minWidthMm);
      const atWidest = helper.measure(spec, WIDEST_ZONE_MM) + stemMm(spec, WIDEST_ZONE_MM);
      return { ...inner, minHeightMm: Math.min(atNarrowest, atWidest) };
    },
  };
}

const withoutStem = (spec) => ({ ...spec, text: undefined });

// Both directions follow the tree: every extra answer the key can reach costs
// width, and a box a child reads needs about 30mm.
function keyMinWidthMm(spec) {
  const { leaves } = classificationKeyShared.layoutTree(JSON.parse(JSON.stringify(spec.tree || { leaf: "" })));
  return Math.min(267, Math.max(90, leaves.length * 34));
}

// A box a child writes a word into, plus room for the arrow after it. Five
// boxes in a chain need more than three, and a constant cannot know.
function chainMinWidthMm(spec) {
  const n = Array.isArray(spec.boxes) ? spec.boxes.length : 1;
  return Math.min(267, Math.max(60, n * 34));
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
  // Laid out at the width it prints, so spare height is never taken: it would
  // only grow the box and leave the drawing at the top.
  "classification-key": withSheetStem(atPrintedWidth(classificationKeyShared, { toSpec: withoutStem, minWidthMm: keyMinWidthMm })),
  // A chain is a strip. Extra height only stretches the boxes away from the
  // arrows that join them.
  "process-chain": withSheetStem(atPrintedWidth(processChainShared, { toSpec: withoutStem, minWidthMm: chainMinWidthMm })),
};

module.exports = { helpers, css };
