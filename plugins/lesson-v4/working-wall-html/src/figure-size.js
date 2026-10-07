"use strict";

// How big a lesson drawing actually prints on its sheet, and the floor under it.
//
// Why this exists. Every other size check on the wall measures words. A
// drawing is laid out once at a fixed width and then scaled into whatever room
// its card has left, and nothing looked at the size it came out. A three-part
// landscape section whose figures were each at least twice as wide as tall
// stacked its parts as full-width rows, gave each row's heading and note their
// 44pt and 36pt, and printed three place value charts 29mm by 13mm on an A3
// sheet. The build said WORKING_WALL_LAYOUT_OK (6 October 2026).
//
// The wall is read from across a room, so a drawing that small is not a small
// picture, it is a missing one. Every placed drawing is recorded here as it is
// drawn (shared.js `imgTag`), and the build refuses a card whose drawing came
// out under the floor, naming the size and what to change.
//
// Only a lesson drawing is measured: a figure a card asked for through
// `visual` (visuals.js `pickVisual` marks it). A photograph, a step's number
// circle and an optional decoration are sized by their own rules. So is the
// small picture in a row of a reference table or an equivalence grid: it is a
// row's marker beside its words, sized from the row, and never the thing the
// sheet is for.

// The floor is on the drawing's shorter printed side. Set from every saved
// wall spec that still builds (854 of them, 181 drawings, 6 October 2026),
// measured before the check was switched on: the smallest drawing on any of
// them printed 28mm on its shorter side (a wide chain across a section), and
// the stamps this check exists for printed 13mm. The floor sits between the
// two, nearer the saved sheets, so none of them is refused.
const MIN_FIGURE_SHORT_SIDE_MM = 25;
const ROW_PICTURE_CARDS = new Set(["referenceTable", "equivalenceGrid"]);

// A before-and-after pair with counters is laid out as the picture of a whole
// landscape sheet (svg-renderer.js COUNTER_PAIR_BOX), because that is the only
// size at which thirteen counters in one column can be counted: about 7mm each
// at the full 360mm. A card that prints it narrower shrinks every counter with
// it (in half of a section they came out under 2mm), and the general floor
// above does not see that, since the picture as a whole is still a decent
// size. So the pair carries its own floor on its printed width: a landscape
// sheet of its own passes, and nothing narrower does.
const MIN_COUNTER_PAIR_WIDTH_MM = 300;

const drawn = new WeakMap();
let placements = [];

function markDrawn(buf, visual) {
  if (!buf || typeof buf !== "object") return;
  const counterPair = Boolean(visual && visual.type === "place-value-chart" && visual.pair && visual.pair.counters);
  drawn.set(buf, { counterPair });
}

function notePlacement(buf, wMm, hMm) {
  if (!buf || typeof buf !== "object" || !drawn.has(buf)) return;
  const w = Number(wMm);
  const h = Number(hMm);
  if (Number.isFinite(w) && Number.isFinite(h)) placements.push({ wMm: w, hMm: h, ...drawn.get(buf) });
}

// The drawings placed since the last call, and an empty ledger for the next card.
function takePlacements() {
  const taken = placements;
  placements = [];
  return taken;
}

const WHAT_TO_DO = {
  diagramSection:
    "A section stacks its parts as full-width rows when a figure is at least twice as wide as tall, and each row's heading and notes are taken out first. " +
    "Use fewer parts, drop a part's notes, turn the sheet to portrait, or tell an ordered method on a stepByStep sheet, where every step's picture has its own row.",
  stepByStep:
    "Each step's picture shares the sheet's height with the others. Tell the method in fewer steps, or split it over two sheets.",
};
const WHAT_TO_DO_OTHERWISE =
  "Give the drawing more of the card: `visualScale: \"dominant\"` or `\"full\"`, fewer or shorter items beside it, or a card of its own.";

// Refuses a card whose lesson drawing printed under the floor.
function assertFiguresReadable(card, placed, label) {
  if (card && ROW_PICTURE_CARDS.has(card.type)) return;
  const squeezed = placed.find((p) => p.counterPair && p.wMm < MIN_COUNTER_PAIR_WIDTH_MM);
  if (squeezed) {
    throw new Error(
      `WALL_COUNTERS_PAIR_TOO_SMALL: ${label} prints its before-and-after counters pair ${Math.round(squeezed.wMm)}mm wide. ` +
        `The pair is two charts of counters and an arrow, and its counters can only be counted when it has a landscape sheet to itself (at least ${MIN_COUNTER_PAIR_WIDTH_MM}mm). ` +
        "There are two ways to keep the counters. To show the exchange as one picture, give the pair a card of its own: " +
        '`stickyKnowledge` with `page.orientation: "landscape"` and `visualScale: "full"`, with the written method on a second sheet if it is wanted. ' +
        "To show the counters beside the written method on one sheet, use a `stepByStep` sheet with one ordinary chart per step: " +
        "a chart with a `counters` row before the change, the same after it, then the `calculation`."
    );
  }
  const small = placed.filter((p) => Math.min(p.wMm, p.hMm) < MIN_FIGURE_SHORT_SIDE_MM);
  if (!small.length) return;
  const sizes = small.map((p) => `${Math.round(p.wMm)}mm x ${Math.round(p.hMm)}mm`).join(", ");
  throw new Error(
    `WALL_FIGURE_TOO_SMALL: ${label} prints ${small.length === 1 ? "a drawing" : `${small.length} drawings`} at ${sizes} on an A3 sheet. ` +
      `A wall drawing is read from across the room and needs at least ${MIN_FIGURE_SHORT_SIDE_MM}mm on its shorter side. ` +
      (WHAT_TO_DO[card && card.type] || WHAT_TO_DO_OTHERWISE)
  );
}

module.exports = { MIN_FIGURE_SHORT_SIDE_MM, MIN_COUNTER_PAIR_WIDTH_MM, markDrawn, notePlacement, takePlacements, assertFiguresReadable };
