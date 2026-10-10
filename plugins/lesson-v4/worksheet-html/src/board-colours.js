"use strict";

// A drawing on the sheet takes the colour the board gave the same drawing.
//
// A few shared drawings let a lesson choose a colour (a ten frame's full
// boxes, an angle's arc, a comparison's bar). The slide designer chooses it;
// the worksheet designer works at the same time and cannot see that choice, so
// a sheet that left `colour` off fell back to the drawing's own default. A
// Year 1 number bonds lesson shipped ten frames that were blue on every slide
// and on the wall and soft green on all three sheets (stress test, 7 October
// 2026), and the teacher's ruling was the plain one: "just copy the slide"
// (9 October 2026).
//
// So the copy is made here, at build, from the built deck's own spec rather
// than by asking a designer to remember. A sheet drawing is matched to the
// board's by the two things that already say "this is the same picture": the
// parity manifest's primitive (a sheet `fraction-bar` is the board's
// `shaded-fraction`) and the lesson design's representation id. The board's
// colour is taken only when every board drawing of that representation agrees
// on it, and never over a colour the sheet states for itself. With no deck
// beside the sheet (a worksheets-only job) nothing is copied and the drawing
// keeps its default.

const { PRIMITIVES } = require("../../shared/visual-parity");

// Sheet helper name -> the board type that is the same drawing.
const BOARD_TYPE = new Map();
for (const p of PRIMITIVES) {
  if (!p.slides || !p.worksheets) continue;
  for (const name of [].concat(p.worksheets)) if (name) BOARD_TYPE.set(name, p.slides);
}

const hex = (value) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(value == null ? "" : value).trim());
  return m ? m[1].toUpperCase() : null;
};

const repOf = (node) =>
  node && node.helperUse && typeof node.helperUse === "object" ? node.helperUse.representationId || null : null;

function walk(node, visit) {
  if (Array.isArray(node)) {
    node.forEach((n) => walk(n, visit));
    return;
  }
  if (!node || typeof node !== "object") return;
  visit(node);
  for (const value of Object.values(node)) walk(value, visit);
}

// "type|representation" -> the one colour the board uses for it, or null when
// the board's drawings of it disagree or state none.
function boardColours(lesson) {
  const seen = new Map();
  walk(lesson, (node) => {
    const rep = repOf(node);
    if (!rep || typeof node.type !== "string") return;
    const key = `${node.type}|${rep}`;
    if (!seen.has(key)) seen.set(key, new Set());
    seen.get(key).add(hex(node.colour));
  });
  const out = new Map();
  for (const [key, colours] of seen) {
    const only = colours.size === 1 ? [...colours][0] : null;
    if (only) out.set(key, only);
  }
  return out;
}

// Returns the worksheet spec with the board's colours copied in, and how many
// drawings took one. The spec passed in is not changed.
function withBoardColours(worksheet, lesson) {
  if (!lesson || typeof lesson !== "object") return { spec: worksheet, adopted: 0 };
  const board = boardColours(lesson);
  if (!board.size) return { spec: worksheet, adopted: 0 };
  let adopted = 0;
  const copy = (node) => {
    if (Array.isArray(node)) return node.map(copy);
    if (!node || typeof node !== "object") return node;
    const out = {};
    for (const [key, value] of Object.entries(node)) out[key] = copy(value);
    const rep = repOf(node);
    const type = typeof node.helper === "string" ? BOARD_TYPE.get(node.helper) : null;
    if (rep && type && node.colour == null && board.has(`${type}|${rep}`)) {
      out.colour = board.get(`${type}|${rep}`);
      adopted++;
    }
    return out;
  };
  const spec = copy(worksheet);
  return adopted ? { spec, adopted } : { spec: worksheet, adopted: 0 };
}

module.exports = { withBoardColours, boardColours };
