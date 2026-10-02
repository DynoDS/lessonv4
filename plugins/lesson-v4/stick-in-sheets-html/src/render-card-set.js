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
      pictures.set(card.id, `data:${mime};base64,${fs.readFileSync(imgPath).toString("base64")}`);
    }
    if (card.detail != null && typeof card.detail !== "string") {
      return fault(`card "${card.label}" has a detail that is not text`);
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
  const tagHtml = kit.tag
    ? `<div style="font-size:8pt;color:${GREY};height:${TAG_BAND_MM}mm;line-height:${TAG_BAND_MM}mm">${esc(kit.tag)}</div>`
    : "";
  // A words-only set keeps one size for every cell and lets headings and cards
  // share rows. A set with pictures gives the heading cards their own short
  // rows: a heading only needs its words, and a heading as tall as a picture
  // card doubled the paper a set took (a five-picture story ran to two pages a
  // set, thirty pages for a class). The item cards are still all one size.
  const pictured = kit.pictures && kit.pictures.size > 0;
  const h = pictured ? cardHMm : Math.max(headingHMm, cardHMm);
  const pictureW = cardWMm - 2 * CARD_PAD_MM - 4;
  const cell = (label, detail, isHeading, picture, cellH = h) => {
    const border = isHeading ? `0.6mm solid ${INK}` : `0.3mm solid ${INK}`;
    const font = isHeading ? "font-weight:bold;font-size:13pt" : "font-size:12pt";
    const detailHtml = detail
      ? `<div style="font-size:${DETAIL_PT}pt;margin-top:1mm">${esc(detail)}</div>`
      : "";
    const pictureHtml = picture
      ? `<img src="${picture}" alt="" style="display:block;margin:0 auto ${PICTURE_GAP_MM}mm;width:${pictureW}mm;height:${PICTURE_H_MM}mm;object-fit:contain">`
      : "";
    return (
      `<div style="width:${cardWMm}mm;height:${cellH}mm;box-sizing:border-box;padding:${CARD_PAD_MM}mm;` +
      `display:flex;flex-direction:column;justify-content:center;">` +
      `<div style="border:${border};border-radius:2mm;height:100%;box-sizing:border-box;padding:2mm;` +
      `display:flex;flex-direction:column;justify-content:center;text-align:center;${font};color:${INK}">` +
      `${tagHtml}${pictureHtml}<div>${isHeading ? esc(label) : cardWordsHtml(label, 16)}</div>${detailHtml}</div></div>`
    );
  };
  // Headings first, then the cards, flowing through one grid so a set uses
  // the page rather than leaving the heading row half empty. Every cell in the
  // set is the same size, so a row's height is the taller of the two kinds.
  const cardCells = kit.printOrder.map((c) => cell(c.label, c.detail, false, kit.pictures.get(c.id) || null));
  const groups = pictured
    ? [
        { cells: kit.headings.map((hd) => cell(hd.label, null, true, null, headingHMm)), hMm: headingHMm },
        { cells: cardCells, hMm: h },
      ]
    : [{ cells: [...kit.headings.map((hd) => cell(hd.label, null, true, null)), ...cardCells], hMm: h }];
  const rows = [];
  for (const group of groups) {
    for (let i = 0; i < group.cells.length; i += cols) {
      const rowCells = group.cells.slice(i, i + cols)
        .map((c, j, all) => `<div style="${j + 1 < all.length ? `border-right:0.3mm dashed ${GREY};` : ""}">${c}</div>`)
        .join("");
      rows.push({ cells: rowCells, hMm: group.hMm });
    }
  }
  return { rows, heightMm: rows.reduce((s, r) => s + r.hMm, 0) };
}

function rowsHtml(rows) {
  return rows
    .map((row, r) => {
      const below = r + 1 < rows.length ? `border-bottom:0.3mm dashed ${GREY};` : "";
      return `<div style="display:flex;align-items:stretch;height:${row.hMm}mm;${below}">${row.cells}</div>`;
    })
    .join("");
}

function geometryFor(kit, printableWMm) {
  const cardLines = Math.max(...kit.cards.map((c) =>
    wrapLines(c.label, CHARS_PER_LINE).length * LINE_MM +
    (c.detail ? wrapLines(c.detail, DETAIL_CHARS_PER_LINE).length * DETAIL_LINE_MM + 1 : 0)
  ));
  const headingLines = Math.max(...kit.headings.map((h) => wrapLines(h.label, CHARS_PER_LINE - 2).length));
  const tagMm = kit.tag ? TAG_BAND_MM : 0;
  // Every card in a set is one size, so one picture card makes every card
  // tall enough for a picture: a child cannot sort by which cards are bigger.
  const pictureMm = kit.pictures && kit.pictures.size ? PICTURE_H_MM + PICTURE_GAP_MM : 0;
  const cardHMm = cardLines + 2 * CARD_PAD_MM + 4 + tagMm + pictureMm;
  const headingHMm = headingLines * HEADING_LINE_MM + 2 * CARD_PAD_MM + 4 + tagMm;
  const cardWMm = CARD_W_MM + 2 * CARD_PAD_MM;
  const cols = Math.max(1, Math.floor((printableWMm + CARD_GAP_MM) / (cardWMm + CARD_GAP_MM)));
  return { cardWMm, cardHMm, headingHMm, cols };
}

// Lay the kit's sets onto landscape pages. Whole sets share a page while they
// fit, with a thicker dashed guide between sets. A set taller than one page
// continues onto the next page at a row boundary, with its caption saying so,
// and every card still carries the kit's tag. Nothing is shrunk, dropped or
// allowed to run off the page: a single row taller than the page is refused
// with the heights named. Returns { error } instead of pages when refused.
function renderKitPages(kit, { printableWMm, printableHMm, pageHtml }) {
  const geometry = geometryFor(kit, printableWMm);
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

function cardWordsHtml(label, letterPt) {
  const match = String(label).match(CARD_LETTER);
  if (!match) return esc(label);
  return `<div style="font-weight:bold;font-size:${letterPt}pt;margin-bottom:1.5mm">${esc(match[1])}</div><div>${esc(match[2])}</div>`;
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

// A sheet: one page per set, the instruction and (for letters) the key at the
// top, then every item filling the rest of the page with a box to write in.
// Nothing is cut: the set is one page, printed per child, pair or group.
function renderSheetPages(kit, { printableWMm, printableHMm, pageHtml }) {
  const { ordinal, mixed, codes } = headingCodes(kit.headings);
  // A sort of words into a few groups reads best as a table children tick:
  // each item on its own row, the groups across the top (the teacher, 1
  // October 2026, of three real children sorted by the 1842 law). Pictures and
  // orders keep the box on each item.
  if (!ordinal && !mixed && !(kit.pictures && kit.pictures.size > 0) && kit.headings.length <= 4) {
    return renderTickTable(kit, { printableWMm, printableHMm, pageHtml });
  }
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
  } else {
    top.push(
      `<div style="font-size:12pt">Write the letter in each box: ` +
      kit.headings.map((h) => `<b>${codes.get(h.id)}</b> = ${esc(h.label)}`).join("&nbsp;&nbsp; ") + `</div>`
    );
  }
  const topLines = (kit.instruction ? Math.ceil(kit.instruction.length / 70) : 0) +
    (kit.reference ? Math.ceil(kit.reference.length / 80) : 0) +
    (ordinal ? 1 : Math.ceil(kit.headings.reduce((n, h) => n + h.label.length + 6, 0) / 90));
  const topMm = topLines * SHEET_TOP_LINE_MM + 4;
  const pictured = kit.pictures && kit.pictures.size > 0;
  const longest = Math.max(...kit.cards.map((c) => c.label.length));
  const gridHMm = printableHMm - topMm;
  let grid = null;
  for (const lines of [1, 2, 3]) {
    grid = sheetGrid(kit.cards.length, printableWMm, gridHMm, lines * SHEET_LABEL_LINE_MM);
    if (grid && longest <= lines * Math.floor(grid.cellW / 2.6)) break;
  }
  if (!grid) {
    return { error: `${kit.cards.length} items do not fit one page with their words; split the set or shorten the labels` };
  }
  const labelMm = grid.cellH - grid.picH - 6;
  const cellHtml = (card) => {
    const picture = kit.pictures.get(card.id);
    const box = `<div style="position:absolute;top:2mm;left:2mm;width:${SHEET_BOX_MM}mm;height:${SHEET_BOX_MM}mm;` +
      `border:0.8mm solid ${INK};background:#ffffff;border-radius:1.5mm"></div>`;
    const inner = picture
      ? `<img src="${picture}" alt="" style="display:block;width:100%;height:${grid.picH.toFixed(1)}mm;object-fit:contain">` +
        `<div style="height:${labelMm.toFixed(1)}mm;display:flex;align-items:center;justify-content:center;text-align:center;font-size:13pt"><div>${cardWordsHtml(card.label, 18)}</div></div>`
      : `<div style="height:${(grid.cellH - 6).toFixed(1)}mm;display:flex;align-items:center;flex-direction:column;justify-content:center;text-align:center;font-size:18pt;padding:0 ${SHEET_BOX_MM + 3}mm"><div>${cardWordsHtml(card.label, 24)}</div></div>`;
    return `<div style="position:relative;width:${grid.cellW.toFixed(1)}mm;height:${grid.cellH.toFixed(1)}mm;box-sizing:border-box;` +
      `border:0.4mm solid ${INK};border-radius:2mm;padding:3mm">${inner}${box}</div>`;
  };
  const cells = kit.printOrder.map(cellHtml);
  const rows = [];
  for (let i = 0; i < cells.length; i += grid.cols) {
    const below = i + grid.cols < cells.length ? `margin-bottom:${SHEET_GAP_MM}mm;` : "";
    rows.push(`<div style="display:flex;gap:${SHEET_GAP_MM}mm;justify-content:center;${below}">${cells.slice(i, i + grid.cols).join("")}</div>`);
  }
  const body = `<div style="height:${topMm}mm;color:${INK}">${top.join("")}</div>${rows.join("")}`;
  const per = kit.per === "child" ? "one each" : kit.per === "pair" ? "one between two" : "one per group";
  const caption = "";
  const pages = Array.from({ length: kit.setCount }, () => pageHtml(caption, body));
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
  };
}

// The tick table: the task and what children decide against at the top, then
// one row per item and one tick column per group, the rows sharing the rest
// of the page so the sheet is full rather than a table at the top of a blank
// page.
function renderTickTable(kit, { printableWMm, printableHMm, pageHtml }) {
  const top = [];
  if (kit.instruction) top.push(`<div style="font-size:18pt;font-weight:bold;margin-bottom:2mm">${esc(kit.instruction)}</div>`);
  if (kit.reference) {
    top.push(`<div style="font-size:14pt;border:0.4mm solid ${INK};border-radius:2mm;padding:2mm 3mm;margin-bottom:2mm">${esc(kit.reference)}</div>`);
  }
  top.push(`<div style="font-size:13pt;margin-bottom:3mm">Tick one box for each.</div>`);
  const topMm = (kit.instruction ? Math.ceil(kit.instruction.length / 60) * 9 + 2 : 0) +
    (kit.reference ? Math.ceil(kit.reference.length / 80) * 7 + 8 : 0) + 9;
  const headerMm = Math.max(18, Math.ceil(Math.max(...kit.headings.map((h) => h.label.length)) / 18) * 7 + 6);
  const rowMm = Math.max(14, Math.min(40, (printableHMm - topMm - headerMm - 4) / kit.cards.length));
  if (rowMm < 14) {
    return { error: `${kit.cards.length} items do not fit one page as a tick table; split the set` };
  }
  const tickColMm = Math.min(70, Math.max(45, (printableWMm * 0.55) / kit.headings.length));
  const itemColMm = printableWMm - tickColMm * kit.headings.length;
  const cellStyle = `border:0.4mm solid ${INK};box-sizing:border-box;`;
  const header =
    `<tr><th style="${cellStyle}width:${itemColMm}mm;height:${headerMm}mm"></th>` +
    kit.headings.map((h) => `<th style="${cellStyle}width:${tickColMm}mm;font-size:14pt;padding:2mm">${esc(h.label)}</th>`).join("") +
    `</tr>`;
  const tick = `<div style="width:12mm;height:12mm;border:0.8mm solid ${INK};border-radius:1.5mm;margin:0 auto"></div>`;
  const rows = kit.printOrder.map((card) =>
    `<tr><td style="${cellStyle}height:${rowMm.toFixed(1)}mm;font-size:18pt;padding:0 4mm">${cardWordsHtml(card.label, 20)}</td>` +
    kit.headings.map(() => `<td style="${cellStyle}text-align:center">${tick}</td>`).join("") + `</tr>`
  ).join("");
  const body =
    `<div style="color:${INK}">${top.join("")}</div>` +
    `<table style="border-collapse:collapse;width:${printableWMm}mm;color:${INK}">${header}${rows}</table>`;
  const pages = Array.from({ length: kit.setCount }, () => pageHtml("", body));
  return {
    pages,
    setsPerPage: 1,
    splitSet: false,
    pagesPerSet: 0,
    setHeightMm: printableHMm,
    pageHeightsMm: pages.map(() => printableHMm),
    cardsPerSet: kit.cards.length,
    pictureMm: 0,
    grid: { cols: kit.headings.length, rows: kit.cards.length },
    table: true,
  };
}

module.exports = {
  normaliseCardSet,
  renderKitPages,
  renderSheetPages,
  sheetGrid,
  orderForPrint,
  followsTheKey,
  CLASS_SIZE,
};
