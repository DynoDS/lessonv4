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
// - The pupil pages never carry the answer. The key lives in the slide notes
//   for the same sort, and the cards are printed in an order that is not the
//   key's order, all the same size and shape, with no number or colour that
//   follows a heading.
// - Every card keeps its identity after cutting: the set's short tag is
//   stamped small on every card and heading, so a card found on the floor
//   still says which activity it belongs to, without saying which heading it
//   belongs under.
// - A kit that cannot be printed faithfully (a card missing from the key, a
//   heading the key names that the set does not have, more cards than the
//   contract allows) is refused by name, never tiled short.

const fs = require("fs");
const path = require("path");
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
// A card's detail prints at 11pt under its label: the account or evidence a
// card carries is read at a table, closer than a board, and stays above the
// pack's readable floor.
const DETAIL_PT = 11;
const DETAIL_LINE_MM = 5.5;
const DETAIL_CHARS_PER_LINE = 21;

// A picture card: the same published picture the board shows for that item,
// fitted whole into a fixed box above the words, so every card in the set is
// still the same size and shape. 30mm is large enough to recognise a scene or
// an object at a table and leaves room for a two-line label under it.
const PICTURE_H_MM = 30;
const PICTURE_GAP_MM = 1.5;
const PICTURE_MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml" };

const { printSizedDataUriSync: printSizedDataUri } = require("./print-size");

const MIN_CARDS = 2;
const MAX_CARDS = 12;
const MIN_HEADINGS = 2;
const MAX_HEADINGS = 6;

const PER_SET = new Set(["child", "pair", "group"]);
// `cards` are cut out and moved under heading cards; a `sheet` keeps every
// item on one page, as large as the page allows, with a box on each for the
// child to write the place or the group in. A sheet is for a task where a mark
// on each item is the whole decision (put the story in order); cards are for a
// task where moving things round helps children decide.
const FORMS = new Set(["cards", "sheet"]);

// A card's own line breaks are part of what it says: a stanza card is three
// lines or two, and the renga lesson of 2 October 2026 asked children to check
// "3 lines, 2 lines" on cards that had printed every stanza as one run of prose.
// Each written line wraps on its own and never joins the next.
function wrapLines(text, charsPerLine) {
  const lines = [];
  for (const written of String(text).trim().split(/\r?\n/)) {
    const words = written.trim().split(/\s+/).filter(Boolean);
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
    lines.push(cur);
  }
  return lines.length ? lines : [""];
}

// Escaped words with their written line breaks kept.
function wordsHtml(text) {
  return String(text).trim().split(/\r?\n/).map((line) => esc(line.trim())).join("<br>");
}

// A small deterministic generator so the printed order is stable between
// builds (the slide notes describe the kit that was printed) and
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

// An order set as a sort (one card under each numbered heading: 1st, 2nd,
// 3rd) cannot "follow the key" in blocks, because every card is its own block.
// What would give it away is printing the cards in the answer's own order, so
// that is broken instead.
function inHeadingOrder(order, keyByCard, headingOrder) {
  return order.every((card, i) => keyByCard.get(card.id) === headingOrder[i]);
}

function orderForPrint(cards, keyByCard, seed, headingOrder) {
  const oneEach = headingOrder && headingOrder.length === cards.length &&
    new Set(cards.map((c) => keyByCard.get(c.id))).size === cards.length;
  if (oneEach) {
    let order = shuffled(cards, seed);
    for (let attempt = 0; inHeadingOrder(order, keyByCard, headingOrder) && attempt < 20; attempt++) {
      order = shuffled(order, seed + 1 + attempt);
    }
    if (inHeadingOrder(order, keyByCard, headingOrder)) order.push(order.shift());
    return order;
  }
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
function normaliseCardSet(item, classSize, baseDir) {
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
  const pictures = new Map();
  for (const card of cards) {
    // A card prints everything a child reads or looks at on it. A card whose
    // item carries a picture prints that picture, the one the board shows; a
    // picture that cannot be found refuses the kit by name, because a card
    // printed without the thing children were meant to look at is a different
    // task that still looks complete.
    if (card.picture) {
      return fault(`card "${card.label}" names its picture as "picture"; give imagePath, the published picture the board shows`);
    }
    if (card.photoRef && !card.imagePath) {
      return fault(`card "${card.label}" has a photoRef but no imagePath, so its picture cannot be printed`);
    }
    if (card.imagePath != null) {
      if (typeof card.imagePath !== "string" || !card.imagePath.trim()) {
        return fault(`card "${card.label}" has an imagePath that is not a file path`);
      }
      const imgPath = path.isAbsolute(card.imagePath) ? card.imagePath : path.join(baseDir || ".", card.imagePath);
      const mime = PICTURE_MIME[path.extname(imgPath).toLowerCase()];
      if (!mime) return fault(`card "${card.label}": ${card.imagePath} is not a picture the pack can print`);
      if (!fs.existsSync(imgPath)) {
        return fault(`card "${card.label}": its picture ${card.imagePath} was not found, and the card is not printed without it`);
      }
      pictures.set(card.id, printSizedDataUri(imgPath, mime));
    }
    if (card.detail != null && typeof card.detail !== "string") {
      return fault(`card "${card.label}" has a detail that is not text`);
    }
    if (card.letter != null && !/^[A-Z]$/.test(String(card.letter))) {
      return fault(`card "${card.label}" has a letter that is not one capital letter`);
    }
  }
  if (typeof item.tag !== "string" || !item.tag.trim()) {
    return fault("no tag: every card is stamped with the kit's tag so a card found after cutting still says which activity it belongs to");
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
  const form = spec.form == null ? "cards" : spec.form;
  if (!FORMS.has(form)) return fault(`form must be cards or sheet, not ${form}`);

  const seed = seedFrom(`${spec.sourceUnitId}|${cards.map((c) => c.label).join("|")}`);
  return {
    sourceUnitId: spec.sourceUnitId,
    form,
    instruction: typeof spec.instruction === "string" ? spec.instruction.trim() : "",
    // What children decide against, printed under the task as the board shows
    // it (the 1842 law above three real children to sort by it).
    reference: typeof spec.reference === "string" ? spec.reference.trim() : "",
    label: item.label || "Card sort",
    tag: item.tag != null ? formatStickInHandle(item.tag) : null,
    headings,
    cards,
    pictures,
    printOrder: orderForPrint(cards, keyByCard, seed, headings.map((h) => h.id)),
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
  // A set laid out to fill its page (`fillLayout`) carries its own sizes:
  // the cards' and headings' widths, columns and type. Otherwise every size is
  // the standard one.
  const fill = geometry.fill || null;
  const tagHtml = kit.tag
    ? `<div data-part="tag" style="flex:none;font-size:8pt;color:${GREY};height:${TAG_BAND_MM}mm;line-height:${TAG_BAND_MM}mm">${esc(kit.tag)}</div>`
    : "";
  // A words-only set keeps one size for every cell and lets headings and cards
  // share rows. A set with pictures gives the heading cards their own short
  // rows: a heading only needs its words, and a heading as tall as a picture
  // card doubled the paper a set took (a five-picture story ran to two pages a
  // set, thirty pages for a class). A set printed large to fill its page does
  // the same, so the room goes to the cards children read. The item cards are
  // still all one size.
  const pictured = kit.pictures && kit.pictures.size > 0;
  const split = pictured || Boolean(fill);
  const h = split ? cardHMm : Math.max(headingHMm, cardHMm);
  const cardPt = fill ? fill.cardPt : 12;
  const headingPt = fill ? fill.headingPt : 13;
  const letterPt = fill ? fill.letterPt : 16;
  // Every card is laid out from its top edge: the tag, then the picture, then
  // the letter, then the words. The whole stack used to be centred in the
  // card, so a card with a one-line caption carried its tag, picture and
  // letter half a line lower than a two-line neighbour and a row did not line
  // up (a Year 2 Great Fire sort, 7 October 2026; the teacher, 11 October:
  // "lined up from the top"). Words with no picture above them are centred in
  // the room under the tag, which stays at the top of every card. The lines
  // are given the heights the card was sized by, and a picture gives up room
  // before any words are pushed out of the card.
  const cell = (label, detail, isHeading, picture, cellH, letter, widthMm) => {
    const border = isHeading ? `0.6mm solid ${INK}` : `0.3mm solid ${INK}`;
    const font = isHeading
      ? `font-weight:bold;font-size:${headingPt}pt;line-height:${(HEADING_LINE_MM * headingPt / 13).toFixed(2)}mm`
      : `font-size:${cardPt}pt;line-height:${(LINE_MM * cardPt / 12).toFixed(2)}mm`;
    const detailHtml = detail
      ? `<div style="font-size:${DETAIL_PT}pt;line-height:${DETAIL_LINE_MM}mm;margin-top:1mm">${esc(detail)}</div>`
      : "";
    const pictureW = widthMm - 2 * CARD_PAD_MM - 4;
    const pictureHtml = picture
      ? `<img data-part="picture" src="${picture}" alt="" style="display:block;flex:0 1 ${PICTURE_H_MM}mm;min-height:0;margin:0 auto ${PICTURE_GAP_MM}mm;width:${pictureW}mm;height:${PICTURE_H_MM}mm;object-fit:contain">`
      : "";
    return (
      `<div style="width:${widthMm}mm;height:${cellH}mm;box-sizing:border-box;padding:${CARD_PAD_MM}mm;">` +
      `<div data-card="${isHeading ? "heading" : "item"}" style="border:${border};border-radius:2mm;height:100%;box-sizing:border-box;padding:2mm;` +
      `display:flex;flex-direction:column;justify-content:flex-start;text-align:center;${font};color:${INK}">` +
      `${tagHtml}${pictureHtml}` +
      `<div data-part="words" style="flex:1 0 auto;display:flex;flex-direction:column;justify-content:${picture ? "flex-start" : "center"}">` +
      `<div>${isHeading ? esc(label) : cardWordsHtml(label, letterPt, letter)}</div>${detailHtml}</div></div></div>`
    );
  };
  // Headings first, then the cards, flowing through one grid so a set uses
  // the page rather than leaving the heading row half empty. Every cell in the
  // set is the same size, so a row's height is the taller of the two kinds.
  const cardCells = kit.printOrder.map((c) =>
    cell(c.label, c.detail, false, kit.pictures.get(c.id) || null, h, c.letter || null, cardWMm));
  const headingW = fill ? fill.headingWMm : cardWMm;
  const groups = split
    ? [
        { cells: kit.headings.map((hd) => cell(hd.label, null, true, null, headingHMm, null, headingW)), hMm: headingHMm, cols: fill ? fill.headingCols : cols },
        { cells: cardCells, hMm: h, cols },
      ]
    : [{ cells: [...kit.headings.map((hd) => cell(hd.label, null, true, null, h, null, cardWMm)), ...cardCells], hMm: h, cols }];
  const rows = [];
  for (const group of groups) {
    for (let i = 0; i < group.cells.length; i += group.cols) {
      const rowCells = group.cells.slice(i, i + group.cols)
        .map((c, j, all) => `<div style="${j + 1 < all.length ? `border-right:0.3mm dashed ${GREY};` : ""}">${c}</div>`)
        .join("");
      rows.push({ cells: rowCells, hMm: group.hMm });
    }
  }
  return { rows, heightMm: rows.reduce((sum, r) => sum + r.hMm, 0) };
}

function rowsHtml(rows) {
  return rows
    .map((row, r) => {
      const below = r + 1 < rows.length ? `border-bottom:0.3mm dashed ${GREY};` : "";
      return `<div style="display:flex;align-items:stretch;height:${row.hMm}mm;${below}">${row.cells}</div>`;
    })
    .join("");
}

// The letter's own line above a card's words, at 16pt with its gap.
const LETTER_LINE_MM = 8;
const LETTER_INK_MM = 6.5;

function geometryFor(kit, printableWMm) {
  const cardLines = Math.max(...kit.cards.map((c) =>
    wrapLines(c.label, CHARS_PER_LINE).length * LINE_MM +
    (c.letter || CARD_LETTER.test(String(c.label)) ? LETTER_LINE_MM : 0) +
    (c.detail ? wrapLines(c.detail, DETAIL_CHARS_PER_LINE).length * DETAIL_LINE_MM + 1 : 0)
  ));
  const headingLines = Math.max(...kit.headings.map((h) => wrapLines(h.label, CHARS_PER_LINE - 2).length));
  const tagMm = kit.tag ? TAG_BAND_MM : 0;
  // Every card in a set is one size, so one picture card makes every card
  // tall enough for a picture: a child cannot sort by which cards are bigger.
  const pictureMm = kit.pictures && kit.pictures.size ? PICTURE_H_MM + PICTURE_GAP_MM : 0;
  const cardHMm = cardLines + 2 * CARD_PAD_MM + 5 + tagMm + pictureMm;
  const headingHMm = headingLines * HEADING_LINE_MM + 2 * CARD_PAD_MM + 5 + tagMm;
  const cardWMm = CARD_W_MM + 2 * CARD_PAD_MM;
  const cols = Math.max(1, Math.floor((printableWMm + CARD_GAP_MM) / (cardWMm + CARD_GAP_MM)));
  return { cardWMm, cardHMm, headingHMm, cols };
}

// Width one character takes at 1pt, from the standard card: 19 characters at
// 12pt across its 52mm of text room.
const CHAR_MM_PER_PT = 52 / 19 / 12;
const FILL_MAX_PT = 24;
const HEADING_MIN_W_MM = 40;

// A set that gets a page to itself fills it. Cards are sized so several sets
// share a page; when even two do not fit, the one set prints as large as the
// page allows (the teacher, 30 September and 1 October 2026: "as big as
// possible to fill the paper", no dead space). The headings take short rows of
// their own, and the cards take the type size and number of columns that print
// them largest, with this proviso: a card whose words have their own line
// breaks (a stanza, three lines or two) keeps every line on one printed line,
// because a child counting a stanza's lines counts what is printed. Words-only
// sets only: a picture card's picture already takes the room it was given.
// Returns null when the standard layout stands.
function fillLayout(kit, printableWMm, printableHMm) {
  if (kit.pictures && kit.pictures.size) return null;
  const standard = renderSetHtml(kit, geometryFor(kit, printableWMm)).heightMm;
  if (standard * 2 + 4 <= printableHMm || standard > printableHMm) return null;
  const tagMm = kit.tag ? TAG_BAND_MM : 0;
  const keepLines = kit.cards.some((c) => /\n/.test(String(c.label)));
  const headingCols = Math.max(1, Math.min(kit.headings.length,
    Math.floor(printableWMm / HEADING_MIN_W_MM)));
  const headingWMm = +(printableWMm / headingCols).toFixed(1);
  let best = null;
  for (let cols = 1; cols <= 4; cols++) {
    const cardWMm = +(printableWMm / cols).toFixed(1);
    const textMm = cardWMm - 2 * CARD_PAD_MM - 5;
    for (let pt = FILL_MAX_PT; pt >= 12; pt -= 0.5) {
      const chars = Math.floor(textMm / (pt * CHAR_MM_PER_PT));
      const fits = kit.cards.every((c) => !keepLines ||
        String(c.label).split(/\r?\n/).every((line) => line.trim().length <= chars));
      if (!fits) continue;
      const lineMm = LINE_MM * pt / 12;
      const letterMm = LETTER_LINE_MM * pt / 12;
      const cardHMm = Math.max(...kit.cards.map((c) =>
        wrapLines(c.label, chars).length * lineMm +
        (c.letter || CARD_LETTER.test(String(c.label)) ? letterMm : 0) +
        (c.detail ? wrapLines(c.detail, DETAIL_CHARS_PER_LINE).length * DETAIL_LINE_MM + 1 : 0)
      )) + 2 * CARD_PAD_MM + 5 + tagMm;
      const headingPt = Math.min(22, Math.round(13 * pt / 12));
      const headingChars = Math.floor((headingWMm - 2 * CARD_PAD_MM - 5) / (headingPt * CHAR_MM_PER_PT));
      const headingHMm = Math.max(...kit.headings.map((hd) => wrapLines(hd.label, headingChars).length)) *
        HEADING_LINE_MM * headingPt / 13 + 2 * CARD_PAD_MM + 5 + tagMm;
      const height = Math.ceil(kit.headings.length / headingCols) * headingHMm +
        Math.ceil(kit.cards.length / cols) * cardHMm;
      if (height > printableHMm) continue;
      if (!best || pt > best.fill.cardPt) {
        best = {
          cardWMm, cardHMm: +cardHMm.toFixed(1), headingHMm: +headingHMm.toFixed(1), cols,
          fill: { cardPt: pt, headingPt, letterPt: Math.round(16 * pt / 12), headingCols, headingWMm },
        };
      }
      break;
    }
  }
  return best && best.fill.cardPt > 12 ? best : null;
}

// Lay the kit's sets onto landscape pages. Whole sets share a page while they
// fit, with a thicker dashed guide between sets. A set taller than one page
// continues onto the next page at a row boundary, with its caption saying so,
// and every card still carries the kit's tag. Nothing is shrunk, dropped or
// allowed to run off the page: a single row taller than the page is refused
// with the heights named. Returns { error } instead of pages when refused.
function renderKitPages(kit, { printableWMm, printableHMm, pageHtml }) {
  const geometry = fillLayout(kit, printableWMm, printableHMm) || geometryFor(kit, printableWMm);
  const set = renderSetHtml(kit, geometry);
  const SET_GAP_MM = 4;
  const tallestRow = Math.max(...set.rows.map((r) => r.hMm));
  if (tallestRow > printableHMm) {
    return {
      error:
        `one row of cards needs ${Math.ceil(tallestRow)} mm and the page holds ${printableHMm} mm; ` +
        "shorten the card with the most words or split its detail, because the kit will not shrink text or cut a card",
    };
  }
  const per = kit.per === "child" ? "one set per child" : kit.per === "pair" ? "one set between two" : "one set per group";
  // No printed instructions to the teacher: the dashed lines say cut, and the
  // teacher's notes say how many and who shares (1 October 2026).
  const baseCaption = "";
  const pages = [];
  const pageHeights = [];
  const splitSet = set.heightMm > printableHMm;
  let setsPerPage;
  if (!splitSet) {
    setsPerPage = Math.floor((printableHMm + SET_GAP_MM) / (set.heightMm + SET_GAP_MM));
    for (let s = 0; s < kit.setCount; s += setsPerPage) {
      const count = Math.min(setsPerPage, kit.setCount - s);
      const blocks = [];
      for (let i = 0; i < count; i++) {
        const last = i + 1 === count;
        blocks.push(
          `<div style="${last ? "" : `border-bottom:0.5mm dashed ${GREY};margin-bottom:${SET_GAP_MM}mm;`}">${rowsHtml(set.rows)}</div>`
        );
      }
      pages.push(pageHtml(baseCaption, blocks.join("")));
      pageHeights.push(count * set.heightMm + (count - 1) * SET_GAP_MM);
    }
  } else {
    setsPerPage = 0;
    // Group the set's rows into page-sized runs, the same split for every set.
    const runs = [];
    let run = [];
    let used = 0;
    for (const row of set.rows) {
      if (run.length && used + row.hMm > printableHMm) {
        runs.push(run);
        run = [];
        used = 0;
      }
      run.push(row);
      used += row.hMm;
    }
    if (run.length) runs.push(run);
    for (let s = 0; s < kit.setCount; s++) {
      runs.forEach((r, i) => {
        const caption = `Set ${s + 1}, page ${i + 1} of ${runs.length}: keep these pages together.`;
        pages.push(pageHtml(caption, rowsHtml(r)));
        pageHeights.push(r.reduce((sum, row) => sum + row.hMm, 0));
      });
    }
  }
  const over = pageHeights.find((ph) => ph > printableHMm);
  if (over !== undefined) {
    return { error: `a page would need ${Math.ceil(over)} mm and holds ${printableHMm} mm` };
  }
  return {
    pages,
    setsPerPage,
    splitSet,
    pagesPerSet: splitSet ? Math.ceil(pages.length / kit.setCount) : 0,
    setHeightMm: set.heightMm,
    pageHeightsMm: pageHeights,
    cardsPerSet: kit.cards.length + kit.headings.length,
  };
}

// What a child writes in an item's box for each heading: the number for an
// order set as numbered places (1st, 2nd, 3rd), otherwise a letter, with the
// letters' meanings printed as a key at the top of the sheet.
const ORDINAL = /^(\d+)(st|nd|rd|th)?$/i;
// A card the board letters (`A  Most of Parliament voted...`) prints its
// letter on its own, bold, above the words: run into the sentence, `C Young
// children` reads as part of it (the teacher, 1 October 2026). Only a letter
// set off by two spaces, a full stop, a bracket or a colon counts, so `A girl`
// stays a sentence.
const CARD_LETTER = /^([A-Z])(?:\s{2,}|[.):]\s*)(\S[\s\S]*)$/;

// `letter` is the card's letter on the board, when the board letters its cards
// (the build reads it from the lesson's slides): the printed card has to say
// what the board and the answer slide say, or "write the letters in order"
// matches nothing on the table.
function cardWordsHtml(label, letterPt, letter) {
  const match = letter ? [null, letter, label] : String(label).match(CARD_LETTER);
  if (!match) return wordsHtml(label);
  return `<div data-part="letter" style="font-weight:bold;font-size:${letterPt}pt;line-height:${(LETTER_INK_MM * letterPt / 16).toFixed(2)}mm;margin-bottom:${(LETTER_LINE_MM - LETTER_INK_MM).toFixed(1)}mm">${esc(match[1])}</div><div>${wordsHtml(match[2])}</div>`;
}

function headingCodes(headings) {
  const ordinal = headings.every((h) => ORDINAL.test(h.label.trim()));
  // An order with a place for what does not belong (1st to 4th, then `Never
  // happened`) keeps its numbers, and each extra place takes a letter.
  const places = headings.filter((h) => ORDINAL.test(h.label.trim()));
  const mixed = !ordinal && places.length >= 2;
  let extra = 0;
  return {
    ordinal,
    mixed,
    codes: new Map(headings.map((h, i) => {
      if (ordinal || (mixed && ORDINAL.test(h.label.trim()))) return [h.id, h.label.trim().match(ORDINAL)[1]];
      if (mixed) return [h.id, ["X", "Y", "Z"][extra++] || String.fromCharCode(65 + i)];
      return [h.id, String.fromCharCode(65 + i)];
    })),
  };
}

const SHEET_GAP_MM = 5;
const SHEET_BOX_MM = 14;
const SHEET_LABEL_LINE_MM = 6.5;
const SHEET_TOP_LINE_MM = 7;

// The grid that gives each item the biggest picture: every column count is
// tried, and the one whose cells hold the largest 4:3 picture wins.
function sheetGrid(n, widthMm, heightMm, labelMm) {
  let best = null;
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const cellW = (widthMm - (cols - 1) * SHEET_GAP_MM) / cols;
    const cellH = (heightMm - (rows - 1) * SHEET_GAP_MM) / rows;
    const picH = cellH - labelMm - 6;
    if (picH <= 10) continue;
    const size = Math.min(cellW - 6, (picH * 4) / 3);
    if (!best || size > best.size) best = { cols, rows, cellW, cellH, picH, size };
  }
  return best;
}

// Cards of words alone are a different shape of problem from pictured ones. The
// picture grid above asks which cells hold the biggest 4:3 picture, and for
// seven sentences it chose four narrow cards; the words were then indented by
// the box's width on BOTH sides, leaving a 25mm column, so every sentence ran a
// word or two to a line and out of the bottom of its card (a Year 6 science
// sort, 7 October 2026). For words, the grid is the one whose cards hold the
// longest sentence at the largest size, and the box sits in its own row at the
// top with the card's letter beside it, so the words have the card's width.
const TEXT_SHEET_SIZES_PT = [18, 16, 14, 13, 12];
const PT_MM = 0.3528;
const TEXT_SHEET_PAD_MM = 3;
const TEXT_SHEET_HEAD_MM = SHEET_BOX_MM + 3;

function textSheetGrid(cards, widthMm, heightMm) {
  const longest = Math.max(...cards.map((c) => String(c.label).length));
  for (const pt of TEXT_SHEET_SIZES_PT) {
    let best = null;
    for (let cols = 1; cols <= Math.min(cards.length, 5); cols++) {
      const rows = Math.ceil(cards.length / cols);
      const cellW = (widthMm - (cols - 1) * SHEET_GAP_MM) / cols;
      const cellH = (heightMm - (rows - 1) * SHEET_GAP_MM) / rows;
      const textW = cellW - TEXT_SHEET_PAD_MM * 2 - 1;
      // An average character is a little over half its size wide; one spare
      // line covers a long word carried over.
      const perLine = Math.max(1, Math.floor(textW / (pt * PT_MM * 0.56)));
      const lines = Math.ceil(longest / perLine) + 1;
      const needMm = TEXT_SHEET_HEAD_MM + lines * pt * PT_MM * 1.3 + TEXT_SHEET_PAD_MM * 2;
      if (needMm > cellH) continue;
      // Of the grids that hold the words, the one nearest a card's shape.
      const shape = Math.abs(cellW / cellH - 1.4);
      if (!best || shape < best.shape) best = { cols, rows, cellW, cellH, pt, shape, picH: 0, size: 0 };
    }
    if (best) return best;
  }
  return null;
}

// How many characters a line holds at a type size across a width, and how many
// lines some words take there. An average character is a little over half its
// size wide; bold runs wider.
function charsAcross(widthMm, pt, wide = 0.56) {
  return Math.max(1, Math.floor(widthMm / (pt * PT_MM * wide)));
}

function linesAcross(text, widthMm, pt, wide) {
  const per = charsAcross(widthMm, pt, wide);
  return String(text).trim().split(/\r?\n/)
    .reduce((n, line) => n + Math.max(1, Math.ceil(line.trim().length / per)), 0);
}

// A card's letter and its words apart: the board's letter when the build found
// one, else a letter typed at the front of the label.
function letterAndWords(card) {
  if (card.letter) return { letter: String(card.letter), words: card.label };
  const match = String(card.label).match(CARD_LETTER);
  return match ? { letter: match[1], words: match[2] } : { letter: null, words: card.label };
}

// Every sheet's page: the body in one block, so a browser can say how tall the
// sheet drew, and each card of a fixed size marked `data-card`, so it can say
// whether any words ran out of one.
function sheetPagesOf(kit, body, pageHtml, perPage = 1) {
  return Array.from({ length: Math.ceil(kit.setCount / perPage) }, () => pageHtml("", `<div data-sheet="1">${body}</div>`));
}

// A sheet: every item on one page with nothing to cut, printed per child, pair
// or group. Which sheet depends on what children decide:
// - words sorted into a few groups: a table they tick;
// - an order (1st, 2nd, 3rd, with or without a place for what never happened):
//   every item large, with a box on it for its number;
// - anything else put under named headings (pictures under the days of a
//   week): the headings across the top with a box under each, the items
//   lettered below, and children write each item's letter under its heading.
//
// Each sheet can be laid out more than one way (smaller words, an upright
// page). `sheetChoices` lists them best first; the first that fits is printed.
function sheetChoices(kit, page) {
  const { ordinal, mixed } = headingCodes(kit.headings);
  const pictured = kit.pictures && kit.pictures.size > 0;
  const upright = page.upright ? Object.assign({}, page, page.upright, { portrait: true, upright: null }) : null;
  if (!ordinal && !mixed && !pictured && kit.headings.length <= 4) return tickTableChoices(kit, page, upright);
  const draw = ordinal || mixed ? renderBoxSheet : renderPlacesSheet;
  return [() => draw(kit, page), ...(upright ? [() => draw(kit, upright)] : [])];
}

// By sums alone: the first layout whose own arithmetic says it fits. This is
// what a machine without a browser prints.
function renderSheetPages(kit, page) {
  let refused = null;
  for (const choose of sheetChoices(kit, page)) {
    const laid = choose();
    if (laid && !laid.error) return laid;
    refused = (laid && laid.error) || refused;
  }
  return { error: refused || `${kit.cards.length} items do not fit one page; split the set` };
}

// Against the page a browser draws. The sums count characters, and a sheet
// chosen by them alone ran off the bottom of its page and out of its cards
// (eight Year 6 scenarios as a tick table lost the last two; a Year 2 caption
// was cut by its card's edge, 11 October 2026). `measure` draws one page and
// answers { heightMm, spilled }; a layout that draws too tall, or with words
// outside a card, gives way to the next, and a sheet no layout holds is
// refused by name.
async function renderSheetPagesMeasured(kit, page, measure) {
  if (!measure) return renderSheetPages(kit, page);
  let refused = null;
  for (const choose of sheetChoices(kit, page)) {
    const laid = choose();
    if (!laid || laid.error) {
      refused = (laid && laid.error) || refused;
      continue;
    }
    const drawn = await measure(laid.pages[0], Boolean(laid.portrait));
    if (drawn.heightMm <= laid.setHeightMm + 0.5 && !drawn.spilled) return laid;
    refused = drawn.spilled
      ? `the words run out of ${drawn.spilled} of its cards`
      : `the sheet draws ${Math.ceil(drawn.heightMm)} mm tall on a page that holds ${laid.setHeightMm} mm`;
  }
  return { error: `${refused || `${kit.cards.length} items do not fit one page`}; split the set or shorten the labels, because a sheet is never cut short` };
}

// The order sheet: the instruction at the top, then every item filling the
// rest of the page with a box on it to write its number in.
function renderBoxSheet(kit, { printableWMm, printableHMm, pageHtml, portrait }) {
  const { ordinal, mixed, codes } = headingCodes(kit.headings);
  const top = [];
  if (kit.instruction) top.push(`<div style="font-size:16pt;font-weight:bold">${esc(kit.instruction)}</div>`);
  if (kit.reference) top.push(`<div style="font-size:13pt;margin:1mm 0">${esc(kit.reference)}</div>`);
  if (ordinal) {
    top.push(`<div style="font-size:13pt">Write 1 to ${kit.headings.length} in the boxes.</div>`);
  } else if (mixed) {
    const numbers = kit.headings.filter((h) => ORDINAL.test(h.label.trim())).map((h) => codes.get(h.id));
    const others = kit.headings.filter((h) => !ORDINAL.test(h.label.trim()));
    top.push(
      `<div style="font-size:13pt">Write ${numbers[0]} to ${numbers[numbers.length - 1]} in the boxes` +
      others.map((h) => `, or <b>${codes.get(h.id)}</b> for ${esc(h.label.toLowerCase())}`).join("") + `.</div>`
    );
  }
  const across = printableWMm / 277;
  const topLines = (kit.instruction ? Math.ceil(kit.instruction.length / (70 * across)) : 0) +
    (kit.reference ? Math.ceil(kit.reference.length / (80 * across)) : 0) +
    (ordinal ? 1 : Math.ceil(kit.headings.reduce((n, h) => n + h.label.length + 6, 0) / (90 * across)));
  const topMm = topLines * SHEET_TOP_LINE_MM + 4;
  const pictured = kit.pictures && kit.pictures.size > 0;
  const longest = Math.max(...kit.cards.map((c) => c.label.length));
  const lettered = kit.cards.some((c) => letterAndWords(c).letter);
  const gridHMm = printableHMm - topMm;
  let grid = null;
  if (pictured) {
    for (const lines of [1, 2, 3]) {
      grid = sheetGrid(kit.cards.length, printableWMm, gridHMm, lines * SHEET_LABEL_LINE_MM + (lettered ? SHEET_LETTER_MM : 0));
      if (grid && longest <= lines * Math.floor(grid.cellW / 2.6)) break;
    }
  } else {
    grid = textSheetGrid(kit.cards, printableWMm, gridHMm);
  }
  if (!grid) {
    return { error: `${kit.cards.length} items do not fit one page with their words; split the set or shorten the labels` };
  }
  const labelMm = grid.cellH - grid.picH - 6;
  const wordsOnlyCell = (card) => {
    const { letter, words } = letterAndWords(card);
    const head = `<div style="display:flex;align-items:center;height:${SHEET_BOX_MM}mm;margin-bottom:3mm">` +
      `<div style="flex:none;width:${SHEET_BOX_MM}mm;height:${SHEET_BOX_MM}mm;box-sizing:border-box;` +
      `border:0.8mm solid ${INK};background:#ffffff;border-radius:1.5mm"></div>` +
      `<div style="flex:1;text-align:center;font-weight:bold;font-size:24pt;padding-right:${SHEET_BOX_MM}mm">${esc(letter || "")}</div></div>`;
    const bodyH = grid.cellH - TEXT_SHEET_HEAD_MM - TEXT_SHEET_PAD_MM * 2;
    return `<div data-card="item" style="width:${grid.cellW.toFixed(1)}mm;height:${grid.cellH.toFixed(1)}mm;box-sizing:border-box;` +
      `border:0.4mm solid ${INK};border-radius:2mm;padding:${TEXT_SHEET_PAD_MM}mm">${head}` +
      `<div style="height:${bodyH.toFixed(1)}mm;display:flex;align-items:center;justify-content:center;text-align:center;` +
      `font-size:${grid.pt}pt;line-height:1.3"><div>${wordsHtml(words)}</div></div></div>`;
  };
  const cellHtml = (card) => {
    if (!pictured) return wordsOnlyCell(card);
    const picture = kit.pictures.get(card.id);
    const box = `<div style="position:absolute;top:2mm;left:2mm;width:${SHEET_BOX_MM}mm;height:${SHEET_BOX_MM}mm;` +
      `border:0.8mm solid ${INK};background:#ffffff;border-radius:1.5mm"></div>`;
    // The picture takes the room the words leave, never the other way round:
    // the words were given a height worked out from a count of characters, and
    // a caption a line longer than the count was cut by the card's edge.
    const inner = picture
      ? `<img data-part="picture" src="${picture}" alt="" style="display:block;flex:1 1 0;min-height:0;width:100%;object-fit:contain">` +
        `<div data-part="words" style="flex:none;min-height:${labelMm.toFixed(1)}mm;display:flex;align-items:center;justify-content:center;text-align:center;font-size:13pt;line-height:${SHEET_LABEL_LINE_MM}mm"><div>${cardWordsHtml(card.label, 18, card.letter || null)}</div></div>`
      : `<div data-part="words" style="flex:1;display:flex;align-items:center;flex-direction:column;justify-content:center;text-align:center;font-size:18pt;padding:0 ${SHEET_BOX_MM + 3}mm"><div>${cardWordsHtml(card.label, 24, card.letter || null)}</div></div>`;
    return `<div data-card="item" style="position:relative;display:flex;flex-direction:column;width:${grid.cellW.toFixed(1)}mm;height:${grid.cellH.toFixed(1)}mm;box-sizing:border-box;` +
      `border:0.4mm solid ${INK};border-radius:2mm;padding:3mm">${inner}${box}</div>`;
  };
  const cells = kit.printOrder.map(cellHtml);
  const rows = [];
  for (let i = 0; i < cells.length; i += grid.cols) {
    const below = i + grid.cols < cells.length ? `margin-bottom:${SHEET_GAP_MM}mm;` : "";
    rows.push(`<div style="display:flex;gap:${SHEET_GAP_MM}mm;justify-content:center;${below}">${cells.slice(i, i + grid.cols).join("")}</div>`);
  }
  const body = `<div style="height:${topMm}mm;color:${INK}">${top.join("")}</div>${rows.join("")}`;
  const pages = sheetPagesOf(kit, body, pageHtml);
  return {
    pages,
    setsPerPage: 1,
    splitSet: false,
    pagesPerSet: 0,
    setHeightMm: printableHMm,
    pageHeightsMm: pages.map(() => printableHMm),
    cardsPerSet: kit.cards.length,
    pictureMm: pictured ? Math.round(grid.size) : 0,
    grid: { cols: grid.cols, rows: grid.rows },
    portrait: Boolean(portrait),
  };
}

const SHEET_LETTER_MM = 9;
const PLACE_BOX_MM = 16;
const PLACE_GAP_MM = 4;
const PLACE_HEADING_PT = 15;
const PLACE_HEADING_LINE_MM = 7.5;

// Items put under named headings, with nothing to cut: the headings run across
// the top with an empty box under each, the items sit below with a letter
// each, and children write each item's letter in the box under its heading.
// It is the board's own version of the task on paper (the slide letters the
// same items and asks for the letters under each heading), so the sheet and
// the board agree, and it took the place of a sheet that printed a second set
// of letters for the headings beside the items' own (A to F for the days, A to
// G for the cards: the teacher, 11 October 2026, of a Year 2 Great Fire
// timeline). The boxes are all one size, so their sizes say nothing about how
// many items go under a heading.
function renderPlacesSheet(kit, { printableWMm, printableHMm, pageHtml, portrait }) {
  const pictured = kit.pictures && kit.pictures.size > 0;
  // The board's letters when every item has its own; otherwise A, B, C down
  // the printed order. Board letters print in their own order, as the board
  // shows them, unless that order would follow the answer.
  const own = kit.printOrder.map((c) => letterAndWords(c).letter);
  const boardLettered = own.every(Boolean) && new Set(own).size === own.length;
  let order = kit.printOrder;
  if (boardLettered) {
    const byLetter = order.slice().sort((a, b) => (letterAndWords(a).letter < letterAndWords(b).letter ? -1 : 1));
    const headingIds = kit.headings.map((h) => h.id);
    const givesAway = followsTheKey(byLetter, kit.keyByCard) ||
      (byLetter.length === headingIds.length && inHeadingOrder(byLetter, kit.keyByCard, headingIds));
    if (!givesAway) order = byLetter;
  }
  const items = order.map((card, i) => {
    const parts = letterAndWords(card);
    return boardLettered
      ? { card, letter: parts.letter, words: parts.words }
      : { card, letter: String.fromCharCode(65 + i), words: card.label };
  });

  const n = kit.headings.length;
  const colMm = (printableWMm - (n - 1) * PLACE_GAP_MM) / n;
  const headingLines = Math.max(...kit.headings.map((h) => linesAcross(h.label, colMm, PLACE_HEADING_PT, 0.7)));
  const headingLabelMm = headingLines * PLACE_HEADING_LINE_MM;
  const instructionMm = kit.instruction ? linesAcross(kit.instruction, printableWMm, 16, 0.7) * 8 : 0;
  const referenceMm = kit.reference ? linesAcross(kit.reference, printableWMm, 13, 0.62) * 6.5 + 2 : 0;
  const topMm = instructionMm + referenceMm + 7 + 2 + headingLabelMm + PLACE_BOX_MM + 5;
  const gridHMm = printableHMm - topMm;
  const longest = Math.max(...items.map((it) => String(it.words).length));
  let grid = null;
  // Every caption is given the room of the longest, so the letters above them
  // sit at one height across a row.
  let captionLines = 1;
  if (pictured) {
    for (const lines of [1, 2, 3]) {
      captionLines = lines;
      grid = sheetGrid(items.length, printableWMm, gridHMm, lines * SHEET_LABEL_LINE_MM + SHEET_LETTER_MM);
      if (grid && longest <= lines * Math.floor(grid.cellW / 2.6)) break;
    }
    if (grid && grid.picH < 20) grid = null;
  } else {
    grid = textSheetGrid(items.map((it) => ({ label: it.words })), printableWMm, gridHMm);
  }
  if (!grid) {
    return { error: `${items.length} items do not fit one page under ${n} headings with their words; split the set or shorten the labels` };
  }

  const top =
    (kit.instruction ? `<div style="font-size:16pt;font-weight:bold;line-height:8mm">${esc(kit.instruction)}</div>` : "") +
    (kit.reference ? `<div style="font-size:13pt;line-height:6.5mm;margin-bottom:2mm">${esc(kit.reference)}</div>` : "") +
    `<div style="font-size:13pt;line-height:7mm">Write each letter in the box under its heading.</div>` +
    `<div style="display:flex;gap:${PLACE_GAP_MM}mm;margin:2mm 0 5mm">` +
    kit.headings.map((h) =>
      `<div data-heading="1" style="width:${colMm.toFixed(1)}mm;text-align:center">` +
      `<div style="height:${headingLabelMm}mm;display:flex;align-items:flex-end;justify-content:center;font-size:${PLACE_HEADING_PT}pt;font-weight:bold;line-height:${PLACE_HEADING_LINE_MM}mm"><div>${esc(h.label)}</div></div>` +
      `<div data-part="answer-box" style="height:${PLACE_BOX_MM}mm;box-sizing:border-box;border:0.8mm solid ${INK};border-radius:1.5mm"></div></div>`
    ).join("") + `</div>`;

  const shell = `width:${grid.cellW.toFixed(1)}mm;height:${grid.cellH.toFixed(1)}mm;box-sizing:border-box;` +
    `border:0.4mm solid ${INK};border-radius:2mm;padding:2.5mm;display:flex;flex-direction:column;text-align:center`;
  const letterHtml = (letter, pt) =>
    `<div data-part="letter" style="flex:none;font-weight:bold;font-size:${pt}pt;line-height:${SHEET_LETTER_MM - 1}mm;margin-top:1mm">${esc(letter)}</div>`;
  const cellHtml = ({ card, letter, words }) => {
    if (!pictured) {
      return `<div data-card="item" style="${shell}">${letterHtml(letter, 22)}` +
        `<div data-part="words" style="flex:1 0 auto;display:flex;align-items:center;justify-content:center;font-size:${grid.pt}pt;line-height:1.3"><div>${wordsHtml(words)}</div></div></div>`;
    }
    const picture = kit.pictures.get(card.id);
    // The picture takes the room the letter and the words leave.
    return picture
      ? `<div data-card="item" style="${shell}">` +
        `<img data-part="picture" src="${picture}" alt="" style="display:block;flex:1 1 0;min-height:0;width:100%;object-fit:contain">` +
        `${letterHtml(letter, 18)}<div data-part="words" style="flex:none;min-height:${captionLines * SHEET_LABEL_LINE_MM}mm;font-size:13pt;line-height:${SHEET_LABEL_LINE_MM}mm">${wordsHtml(words)}</div></div>`
      : `<div data-card="item" style="${shell}">` +
        `<div data-part="words" style="flex:1 0 auto;display:flex;align-items:center;justify-content:center;font-size:18pt;line-height:1.3"><div>${wordsHtml(words)}</div></div>` +
        `${letterHtml(letter, 18)}</div>`;
  };
  const cells = items.map(cellHtml);
  const rows = [];
  for (let i = 0; i < cells.length; i += grid.cols) {
    const below = i + grid.cols < cells.length ? `margin-bottom:${SHEET_GAP_MM}mm;` : "";
    rows.push(`<div style="display:flex;gap:${SHEET_GAP_MM}mm;justify-content:center;${below}">${cells.slice(i, i + grid.cols).join("")}</div>`);
  }
  const pages = sheetPagesOf(kit, `<div style="color:${INK}">${top}${rows.join("")}</div>`, pageHtml);
  return {
    pages,
    setsPerPage: 1,
    splitSet: false,
    pagesPerSet: 0,
    setHeightMm: printableHMm,
    pageHeightsMm: pages.map(() => printableHMm),
    cardsPerSet: kit.cards.length,
    pictureMm: pictured ? Math.round(grid.size) : 0,
    grid: { cols: grid.cols, rows: grid.rows },
    places: true,
    letters: items.map((it) => it.letter),
    portrait: Boolean(portrait),
  };
}

// The tick table: the task and what children decide against at the top, then
// one row per item and one tick column per group, the rows sharing the rest
// of the page so the sheet is full rather than a table at the top of a blank
// page.
//
// Its layouts, best first. Short words that leave half the page empty print
// two sheets side by side, to be cut once down the middle: half the paper for
// the same sheet (the teacher, 11 October 2026, of nine Year 4 adverbials; his
// ten frame ruling of 10 October, "two to a page, trim once"). Otherwise the
// whole page, at the largest words that fit: the wide tick columns first, then
// tick columns only as wide as their headings so the sentences get the room,
// then an upright page, before the words go down a size.
const TICK_SIZES_PT = [18, 16, 14, 13, 12];
const TWO_UP_GUTTER_MM = 13;

function tickTableChoices(kit, page, upright) {
  const out = [];
  if (kit.setCount >= 2) out.push(() => tickTable(kit, page, { pt: 16, twoUp: true }));
  for (const pt of TICK_SIZES_PT) {
    out.push(() => tickTable(kit, page, { pt }));
    out.push(() => tickTable(kit, page, { pt, narrow: true }));
    if (upright) out.push(() => tickTable(kit, upright, { pt, narrow: true }));
  }
  return out;
}

function tickTable(kit, { printableWMm, printableHMm, pageHtml, portrait }, { pt, narrow = false, twoUp = false }) {
  const widthMm = twoUp ? (printableWMm - TWO_UP_GUTTER_MM) / 2 : printableWMm;
  const instructionPt = twoUp ? 15 : 18;
  const referencePt = twoUp ? 11.5 : 14;
  const headingPt = 14;
  const boxMm = twoUp ? 8 : 12;
  const rowFloorMm = twoUp ? 12 : 14;
  const count = kit.headings.length;
  const headingFitMm = Math.max(...kit.headings.map((h) => h.label.length)) * headingPt * PT_MM * 0.62 + 6;
  if (twoUp && headingFitMm > 34) return null;
  const tickColMm = twoUp
    ? Math.max(22, headingFitMm)
    : narrow
    ? Math.max(26, Math.min(45, headingFitMm))
    : Math.min(70, Math.max(45, (widthMm * 0.55) / count));
  const itemColMm = widthMm - tickColMm * count;
  if (itemColMm < 40) return null;
  const textMm = itemColMm - 8;
  const lineMm = pt * PT_MM * 1.3;
  const needs = kit.printOrder.map((card) => {
    const { letter, words } = letterAndWords(card);
    const lines = linesAcross(words, textMm, pt);
    return { lines, mm: lines * lineMm + (letter ? LETTER_LINE_MM * 20 / 16 : 0) + 4 };
  });
  if (twoUp && needs.some((need) => need.lines > 1)) return null;
  const topMm =
    (kit.instruction ? linesAcross(kit.instruction, widthMm, instructionPt, 0.7) * instructionPt * PT_MM * 1.4 + 2 : 0) +
    (kit.reference ? linesAcross(kit.reference, widthMm - 8, referencePt, 0.62) * referencePt * PT_MM * 1.4 + 8 : 0) + 9;
  const headerLines = Math.max(...kit.headings.map((h) => linesAcross(h.label, tickColMm - 4, headingPt, 0.62)));
  const headerMm = Math.max(twoUp ? 12 : 18, headerLines * 7 + 6);
  const roomMm = printableHMm - topMm - headerMm - 4;
  const shareMm = Math.min(40, roomMm / kit.cards.length);
  // Rows share the page evenly when every item fits its share; when one does
  // not, each row is as tall as its own words need and no taller.
  const baseMm = needs.every((need) => need.mm <= shareMm) ? Math.max(rowFloorMm, shareMm) : rowFloorMm;
  const rowsMm = needs.map((need) => Math.max(need.mm, baseMm));
  if (rowsMm.reduce((sum, mm) => sum + mm, 0) > roomMm + 0.01) {
    return { error: `${kit.cards.length} items do not fit one page as a tick table; split the set` };
  }

  const top = [];
  if (kit.instruction) top.push(`<div style="font-size:${instructionPt}pt;font-weight:bold;margin-bottom:2mm">${esc(kit.instruction)}</div>`);
  if (kit.reference) {
    top.push(`<div style="font-size:${referencePt}pt;border:0.4mm solid ${INK};border-radius:2mm;padding:2mm 3mm;margin-bottom:2mm">${esc(kit.reference)}</div>`);
  }
  top.push(`<div style="font-size:13pt;margin-bottom:3mm">Tick one box for each.</div>`);
  const cellStyle = `border:0.4mm solid ${INK};box-sizing:border-box;`;
  const header =
    `<tr><th style="${cellStyle}width:${itemColMm.toFixed(1)}mm;height:${headerMm}mm"></th>` +
    kit.headings.map((h) => `<th style="${cellStyle}width:${tickColMm.toFixed(1)}mm;font-size:${headingPt}pt;padding:2mm">${esc(h.label)}</th>`).join("") +
    `</tr>`;
  const tick = `<div style="width:${boxMm}mm;height:${boxMm}mm;${twoUp ? "box-sizing:border-box;" : ""}border:0.8mm solid ${INK};border-radius:1.5mm;margin:0 auto"></div>`;
  const rows = kit.printOrder.map((card, i) =>
    `<tr><td style="${cellStyle}height:${rowsMm[i].toFixed(1)}mm;font-size:${pt}pt;line-height:1.3;padding:0 4mm">${cardWordsHtml(card.label, 20, card.letter || null)}</td>` +
    kit.headings.map(() => `<td style="${cellStyle}text-align:center">${tick}</td>`).join("") + `</tr>`
  ).join("");
  const sheet =
    `<div style="width:${widthMm.toFixed(1)}mm;color:${INK}">${top.join("")}` +
    `<table data-tick-table="1" style="border-collapse:collapse;table-layout:fixed;width:${widthMm.toFixed(1)}mm;color:${INK}">${header}${rows}</table></div>`;
  const half = TWO_UP_GUTTER_MM / 2 - 0.2;
  const body = twoUp
    ? `<div style="display:flex"><div style="padding-right:${half}mm;border-right:0.4mm dashed ${GREY}">${sheet}</div>` +
      `<div style="padding-left:${half}mm">${sheet}</div></div>`
    : sheet;
  const pages = sheetPagesOf(kit, body, pageHtml, twoUp ? 2 : 1);
  return {
    pages,
    setsPerPage: twoUp ? 2 : 1,
    splitSet: false,
    pagesPerSet: 0,
    setHeightMm: printableHMm,
    pageHeightsMm: pages.map(() => printableHMm),
    cardsPerSet: kit.cards.length,
    pictureMm: 0,
    grid: { cols: kit.headings.length, rows: kit.cards.length },
    table: true,
    twoUp,
    pt,
    portrait: Boolean(portrait),
  };
}

module.exports = {
  normaliseCardSet,
  renderKitPages,
  renderSheetPages,
  renderSheetPagesMeasured,
  sheetGrid,
  orderForPrint,
  followsTheKey,
  CLASS_SIZE,
};
