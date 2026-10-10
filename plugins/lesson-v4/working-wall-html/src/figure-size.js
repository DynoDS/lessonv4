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

function markDrawn(buf, visual, words) {
  if (!buf || typeof buf !== "object") return;
  const counterPair = Boolean(visual && visual.type === "place-value-chart" && visual.pair && visual.pair.counters);
  drawn.set(buf, { counterPair, words: words || null, type: visual && visual.type });
}

// The room a card offered a drawing, told just before it is placed: the box
// the picture was fitted into, which is usually bigger one way than the
// picture came out. A drawing laid out again is fitted to this room, not to
// the size it happened to print at. A card that does not say is taken to have
// offered exactly what was used.
const rooms = new WeakMap();
function offerRoom(buf, wMm, hMm) {
  if (!buf || typeof buf !== "object") return;
  const w = Number(wMm);
  const h = Number(hMm);
  if (w > 0 && h > 0) rooms.set(buf, { wMm: w, hMm: h });
}

function notePlacement(buf, wMm, hMm) {
  if (!buf || typeof buf !== "object" || !drawn.has(buf)) return;
  const w = Number(wMm);
  const h = Number(hMm);
  if (!Number.isFinite(w) || !Number.isFinite(h)) return;
  const room = rooms.get(buf);
  rooms.delete(buf);
  placements.push({ wMm: w, hMm: h, room: room || { wMm: w, hMm: h }, ...drawn.get(buf) });
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

// ─── The drawing's own words ────────────────────────────────────────────
// A drawing's numbers and labels are part of the drawing, so when a card
// prints it smaller than it was laid out for, they shrink with it: an L-shape
// laid out for 180mm and printed at 116mm carried its side lengths at 18pt
// beside 44pt sums, and a bar chart's axis numbers printed at 17pt under an
// 80pt title (stress test, 7 October 2026; 8 of 20 lessons). The teacher's
// answer from pictures of his own posters (10 October 2026): the numbers and
// labels on a picture print at wall size, never shrunk with the picture.
//
// So the build draws the cards, reads here how far each drawing was shrunk,
// and has any drawing shrunk by more than a tenth laid out again to fit the
// room its card offered (build.js; svg-renderer.js `fitWidth` finds the
// width). Its shape then takes the room and its words keep the wall's size.
// A drawing printed LARGER than it was laid out for is left alone: its words
// are already bigger than the wall asks.
const REDRAW_BELOW = 0.9;

// How far a placed drawing's words were scaled: 1 when it printed at the
// width it was laid out for. Null for a drawing whose word size is not known
// (a photograph, or an older drawing sized in its own units).
//
// A labelled photograph's names are set in the photograph's own pixels, so
// their printed size is read from the share of the picture one pixel got.
const PT_PER_MM = 72 / 25.4;
function wordScale(p) {
  const w = p.words;
  if (!w) return null;
  if (w.kind === "label") return w.compositeW > 0 ? (w.labelPx * (p.wMm / w.compositeW) * PT_PER_MM) / w.fontPt : null;
  if (!(w.naturalWidthMm > 0)) return null;
  return (p.wMm * (w.share || 1)) / w.naturalWidthMm;
}

// The drawings shrunk past the tolerance, each with the room its own shape was
// offered (a drawing under labels has a share of the picture placed, so a
// share of the room). A drawing placed twice is listed for its smaller room,
// so its words are at size there and larger on the other.
//
// The names on a labelled photograph beside a step are the close-up, like the
// step's own note, so they are held to that note's size and no larger: at
// wall size their bands took half of each small photograph on a sheet of
// river features (10 October 2026).
const CLOSE_UP_LABEL_PT = 18;
function shrunkDrawings(placed, card) {
  const byId = {};
  for (const p of placed) {
    const scale = wordScale(p);
    if (scale === null) continue;
    const w = p.words;
    const labelPt = w.kind === "label" && isCloseUp(card) ? CLOSE_UP_LABEL_PT : null;
    if (scale >= REDRAW_BELOW * (labelPt ? labelPt / w.fontPt : 1)) continue;
    const room = { wMm: p.room.wMm * (w.share || 1), hMm: p.room.hMm * (w.shareH || w.share || 1) };
    const held = byId[w.identity];
    if (!held || room.wMm * room.hMm < held.room.wMm * held.room.hMm) byId[w.identity] = { identity: w.identity, kind: w.kind || "drawing", layoutWidthMm: w.layoutWidthMm, labelPx: w.labelPx, labelPt, room };
  }
  return Object.values(byId);
}

// Refuses a card whose drawing still prints its own words under the floor
// after the build has tried to lay it out for its room: the picture has been
// given too little of the sheet for what is written on it.
//
// The floor is the wall profile's own (the size below which a drawing's words
// stop being readable there), except on the sheets whose pictures are the
// close-up reminder beside a step and not the thing read from the carpet: a
// step-by-step sheet, a one-big-picture method, a section part that lists
// steps. The teacher approved those with five pictures down a page, each a
// column sum about 84mm wide (5 October 2026), and they keep that size.
const CLOSE_UP_WORDS_FLOOR_PT = 12;
function isCloseUp(card) {
  return Boolean(
    card &&
    (card.type === "stepByStep" ||
      (card.type === "workedExample" && card.layout === "pictureFirst") ||
      (card.type === "diagramSection" && (card.parts || []).some((part) => part && Array.isArray(part.steps) && part.steps.length)))
  );
}
function wordsFloorPt(card, p) {
  return isCloseUp(card) ? Math.min(CLOSE_UP_WORDS_FLOOR_PT, p.words.minFontPt) : p.words.minFontPt;
}

function assertFigureWordsReadable(card, placed, label) {
  if (card && ROW_PICTURE_CARDS.has(card.type)) return;
  const small = placed
    .map((p) => ({ p, scale: wordScale(p) }))
    .filter(({ p, scale }) => scale !== null && p.words.fontPt * scale < wordsFloorPt(card, p) - 0.5);
  if (!small.length) return;
  const sizes = small.map(({ p, scale }) => `${p.type || "a drawing"} at about ${Math.round(p.words.fontPt * scale)}pt`).join(", ");
  throw new Error(
    `WALL_FIGURE_WORDS_TOO_SMALL: ${label} prints the numbers and labels on ${small.length === 1 ? "its drawing" : "its drawings"} too small to read from across the room (${sizes}; ` +
      `they need at least ${wordsFloorPt(card, small[0].p)}pt here). The drawing has too little of the sheet for what is written on it. ` +
      "Give it more: one idea to a sheet, so a second picture or a second idea goes on a sheet of its own (each a different colour); " +
      "fewer or shorter words beside it; or fewer labels on the drawing itself."
  );
}

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

module.exports = { MIN_FIGURE_SHORT_SIDE_MM, MIN_COUNTER_PAIR_WIDTH_MM, REDRAW_BELOW, markDrawn, offerRoom, notePlacement, takePlacements, assertFiguresReadable, shrunkDrawings, wordScale, assertFigureWordsReadable };
