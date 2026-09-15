"use strict";

// A card kit: the pupil half of a handling activity, printed to cut and sort.
//
// A `card-set` item is the third kind of stick-in moment. A write-on piece is
// a figure the child marks; a source copy is a source the child reads; a card
// set is a set of items the child MOVES, under heading cards, at a table. It
// is not glued in and it is not one piece per child: it is one set per child,
// pair or group, and the set is what stays together after cutting.
//
// Three things this file protects, because each has cost a class a lesson:
//
// - The pupil pages never carry the answer. The key lives in a separate
//   teacher text file, and the cards are printed in an order that is not the
//   key's order, all the same size and shape, with no number or colour that
//   follows a heading.
// - Every card keeps its identity after cutting: the set's short tag is
//   stamped small on every card and heading, so a card found on the floor
//   still says which activity it belongs to, without saying which heading it
//   belongs under.
// - A kit that cannot be printed faithfully (a card missing from the key, a
//   heading the key names that the set does not have, more cards than the
//   contract allows) is refused by name, never tiled short.

const { esc } = require("./render-piece-html");
const { formatStickInHandle, CLASS_SIZE } = require("./layout-rules");

const GREY = "#999999";
const INK = "#111111";

// Card geometry in millimetres. A Year 4 hand sorts a 62mm card comfortably,
// and 62mm holds a short statement at 12pt on two lines.
const CARD_W_MM = 56;
const CARD_PAD_MM = 3;
const CARD_GAP_MM = 4;
const LINE_MM = 6;         // 12pt line height, in the pack's Comic Sans
const HEADING_LINE_MM = 6.5;
const TAG_BAND_MM = 4;
const CHARS_PER_LINE = 19; // at 12pt over the card's usable width

const MIN_CARDS = 2;
const MAX_CARDS = 12;
const MIN_HEADINGS = 2;
const MAX_HEADINGS = 6;

const PER_SET = new Set(["child", "pair", "group"]);

function wrapLines(text, charsPerLine) {
  const words = String(text).trim().split(/\s+/);
  const lines = [];
  let cur = "";
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word;
    if (next.length > charsPerLine && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

// A small deterministic generator so the printed order is stable between
// builds (the teacher's answer file describes the kit that was printed) and
// never the key's order.
function seedFrom(text) {
  let h = 2166136261;
  for (const ch of String(text)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(cards, seed) {
  const out = cards.slice();
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// True when the cards, read in this order, sit in blocks that follow the key
// (all of one heading, then all of the next): the order would give the sort
// away to a child who noticed it.
function followsTheKey(order, keyByCard) {
  const seen = [];
  for (const card of order) {
    const heading = keyByCard.get(card.id);
    if (seen.length === 0 || seen[seen.length - 1] !== heading) {
      if (seen.includes(heading)) return false;
      seen.push(heading);
    }
  }
  return true;
}

function orderForPrint(cards, keyByCard, seed) {
  let order = shuffled(cards, seed);
  let attempts = 0;
  while (followsTheKey(order, keyByCard) && attempts < 20) {
    order = shuffled(order, seed + 1 + attempts);
    attempts += 1;
  }
  if (followsTheKey(order, keyByCard) && order.length > 2) {
    // Two cards under two headings can only ever be in key order or its
    // reverse; anything longer we can break by hand.
    const first = order.shift();
    order.splice(1, 0, first);
  }
  return order;
}

// Validate a card-set spec and return the normalised kit, or a string naming
// the fault.
function normaliseCardSet(item, classSize) {
  const spec = item && item.spec;
  if (!spec || typeof spec !== "object") return "no spec";
  const fault = (msg) => msg;

  if (typeof spec.sourceUnitId !== "string" || !spec.sourceUnitId.trim()) {
    return fault("no sourceUnitId: a kit has to say which unit's task it prints");
  }
  const headings = Array.isArray(spec.headings) ? spec.headings : null;
  const cards = Array.isArray(spec.cards) ? spec.cards : null;
  if (!headings || headings.length < MIN_HEADINGS || headings.length > MAX_HEADINGS) {
    return fault(`headings must be a list of ${MIN_HEADINGS} to ${MAX_HEADINGS}`);
  }
  if (!cards || cards.length < MIN_CARDS || cards.length > MAX_CARDS) {
    return fault(`cards must be a list of ${MIN_CARDS} to ${MAX_CARDS}`);
  }
  const ids = new Set();
  const labels = new Set();
  for (const row of [...headings, ...cards]) {
    if (!row || typeof row.id !== "string" || typeof row.label !== "string" || !row.label.trim()) {
      return fault("every heading and card needs an id and a non-empty label");
    }
    if (ids.has(row.id)) return fault(`duplicate id ${row.id}`);
    ids.add(row.id);
    const key = row.label.trim().toLowerCase();
    if (labels.has(key)) return fault(`duplicate label "${row.label}"`);
    labels.add(key);
  }

  const sets = spec.sets && typeof spec.sets === "object" ? spec.sets : null;
  if (!sets || !PER_SET.has(sets.per)) {
    return fault("sets.per must be child, pair or group");
  }
  let setCount;
  if (sets.per === "child") setCount = classSize;
  else if (sets.per === "pair") setCount = Math.ceil(classSize / 2);
  else {
    if (!Number.isInteger(sets.groupCount) || sets.groupCount < 1) {
      return fault("sets.per group needs a positive groupCount");
    }
    setCount = sets.groupCount;
  }

  const teacher = spec.teacher && typeof spec.teacher === "object" ? spec.teacher : null;
  if (!teacher || typeof teacher.where !== "string" || !teacher.where.trim()) {
    return fault("teacher.where must say where the activity happens and which sets are needed");
  }
  const answer = Array.isArray(teacher.answer) ? teacher.answer : null;
  if (!answer) return fault("teacher.answer must list a heading for every card");
  const headingIds = new Set(headings.map((h) => h.id));
  const cardIds = new Set(cards.map((c) => c.id));
  const keyByCard = new Map();
  for (const row of answer) {
    if (!row || !cardIds.has(row.cardId)) return fault(`answer names an unknown card ${row && row.cardId}`);
    if (!headingIds.has(row.headingId)) return fault(`answer names an unknown heading ${row.headingId}`);
    if (keyByCard.has(row.cardId)) return fault(`answer places card ${row.cardId} twice`);
    keyByCard.set(row.cardId, row.headingId);
  }
  const unplaced = cards.filter((c) => !keyByCard.has(c.id));
  if (unplaced.length) {
    return fault(`answer leaves ${unplaced.map((c) => `"${c.label}"`).join(", ")} unplaced`);
  }
  const alsoAccept = teacher.alsoAccept == null ? null : String(teacher.alsoAccept).trim() || null;

  const seed = seedFrom(`${spec.sourceUnitId}|${cards.map((c) => c.label).join("|")}`);
  return {
    sourceUnitId: spec.sourceUnitId,
    instruction: typeof spec.instruction === "string" ? spec.instruction.trim() : "",
    label: item.label || "Card sort",
    tag: item.tag != null ? formatStickInHandle(item.tag) : null,
    headings,
    cards,
    printOrder: orderForPrint(cards, keyByCard, seed),
    keyByCard,
    per: sets.per,
    setCount,
    where: teacher.where.trim(),
    alsoAccept,
  };
}

// One set as an HTML block of cards: the heading cards first, then the item
// cards in print order, every card the same size, dashed guides between them.
function renderSetHtml(kit, geometry) {
  const { cardWMm, cardHMm, headingHMm, cols } = geometry;
  const tagHtml = kit.tag
    ? `<div style="font-size:8pt;color:${GREY};height:${TAG_BAND_MM}mm;line-height:${TAG_BAND_MM}mm">${esc(kit.tag)}</div>`
    : "";
  const cell = (label, isHeading) => {
    const h = Math.max(headingHMm, cardHMm);
    const border = isHeading ? `0.6mm solid ${INK}` : `0.3mm solid ${INK}`;
    const font = isHeading ? "font-weight:bold;font-size:13pt" : "font-size:12pt";
    return (
      `<div style="width:${cardWMm}mm;height:${h}mm;box-sizing:border-box;padding:${CARD_PAD_MM}mm;` +
      `display:flex;flex-direction:column;justify-content:center;">` +
      `<div style="border:${border};border-radius:2mm;height:100%;box-sizing:border-box;padding:2mm;` +
      `display:flex;flex-direction:column;justify-content:center;text-align:center;${font};color:${INK}">` +
      `${tagHtml}<div>${esc(label)}</div></div></div>`
    );
  };
  // Headings first, then the cards, flowing through one grid so a set uses
  // the page rather than leaving the heading row half empty. Every cell in the
  // set is the same size, so a row's height is the taller of the two kinds.
  const rows = [];
  const cells = [
    ...kit.headings.map((h) => cell(h.label, true)),
    ...kit.printOrder.map((c) => cell(c.label, false)),
  ];
  const rowHMm = Math.max(headingHMm, cardHMm);
  for (let i = 0; i < cells.length; i += cols) rows.push({ cells: cells.slice(i, i + cols), hMm: rowHMm });
  const html = rows
    .map((row, r) => {
      const cells = row.cells
        .map((c, i) => `<div style="${i + 1 < row.cells.length ? `border-right:0.3mm dashed ${GREY};` : ""}">${c}</div>`)
        .join("");
      const below = r + 1 < rows.length ? `border-bottom:0.3mm dashed ${GREY};` : "";
      return `<div style="display:flex;align-items:stretch;height:${row.hMm}mm;${below}">${cells}</div>`;
    })
    .join("");
  const heightMm = rows.reduce((s, r) => s + r.hMm, 0);
  return { html, heightMm };
}

function geometryFor(kit, printableWMm) {
  const cardLines = Math.max(...kit.cards.map((c) => wrapLines(c.label, CHARS_PER_LINE).length));
  const headingLines = Math.max(...kit.headings.map((h) => wrapLines(h.label, CHARS_PER_LINE - 2).length));
  const tagMm = kit.tag ? TAG_BAND_MM : 0;
  const cardHMm = cardLines * LINE_MM + 2 * CARD_PAD_MM + 4 + tagMm;
  const headingHMm = headingLines * HEADING_LINE_MM + 2 * CARD_PAD_MM + 4 + tagMm;
  const cardWMm = CARD_W_MM + 2 * CARD_PAD_MM;
  const cols = Math.max(1, Math.floor((printableWMm + CARD_GAP_MM) / (cardWMm + CARD_GAP_MM)));
  return { cardWMm, cardHMm, headingHMm, cols };
}

// Lay the kit's sets onto landscape pages: as many whole sets per page as fit,
// a thicker dashed guide between sets, the page caption naming the kit.
function renderKitPages(kit, { printableWMm, printableHMm, pageHtml }) {
  const geometry = geometryFor(kit, printableWMm);
  const set = renderSetHtml(kit, geometry);
  const SET_GAP_MM = 4;
  const setsPerPage = Math.max(1, Math.floor((printableHMm + SET_GAP_MM) / (set.heightMm + SET_GAP_MM)));
  const pages = [];
  for (let s = 0; s < kit.setCount; s += setsPerPage) {
    const count = Math.min(setsPerPage, kit.setCount - s);
    const blocks = [];
    for (let i = 0; i < count; i++) {
      const last = i + 1 === count;
      blocks.push(
        `<div style="${last ? "" : `border-bottom:0.5mm dashed ${GREY};margin-bottom:${SET_GAP_MM}mm;padding-bottom:0;`}">${set.html}</div>`
      );
    }
    const per = kit.per === "child" ? "one set per child" : kit.per === "pair" ? "one set between two" : "one set per group";
    const caption = `✂ ${kit.tag ? `${kit.tag}: ` : ""}cut along the dashed lines. ${per[0].toUpperCase()}${per.slice(1)}; ${kit.setCount} set${kit.setCount === 1 ? "" : "s"}. Thick border = heading.`;
    pages.push(pageHtml(caption, blocks.join("")));
  }
  return { pages, setsPerPage, setHeightMm: set.heightMm, cardsPerSet: kit.cards.length + kit.headings.length };
}

// The teacher's half: the key and the preparation note, in plain text, never
// on a pupil page.
function answersText(kits, lesson) {
  const lines = [];
  lines.push(`Card kits for ${lesson}: teacher notes. Keep this away from the pupil pages.`);
  lines.push("");
  for (const kit of kits) {
    lines.push(`Kit${kit.tag ? ` ${kit.tag}` : ""}: ${kit.label}`);
    lines.push(`Unit: ${kit.sourceUnitId}`);
    lines.push(`Prepare: ${kit.where} (${kit.setCount} set${kit.setCount === 1 ? "" : "s"} printed, ${kit.per === "child" ? "one per child" : kit.per === "pair" ? "one between two" : "one per group"}).`);
    if (kit.instruction) lines.push(`Children are told: ${kit.instruction}`);
    lines.push(`Headings: ${kit.headings.map((h) => h.label).join(" | ")}`);
    lines.push("Answer:");
    const headingLabel = new Map(kit.headings.map((h) => [h.id, h.label]));
    for (const card of kit.cards) {
      lines.push(`  ${card.label} -> ${headingLabel.get(kit.keyByCard.get(card.id))}`);
    }
    if (kit.alsoAccept) lines.push(`Also accept: ${kit.alsoAccept}`);
    lines.push("");
  }
  return lines.join("\n");
}

module.exports = {
  normaliseCardSet,
  renderKitPages,
  answersText,
  orderForPrint,
  followsTheKey,
  CLASS_SIZE,
};
