"use strict";


const fsHelpers = require("fs");
const pathHelpers = require("path");
const { textWidthEm, RENDER_SAFETY } = require("../../shared/text/comic-glyph-width");


const A4_SHORT_IN = 8.27;
const A4_LONG_IN = 11.69;
const A3_SHORT_IN = 11.69;
const A3_LONG_IN = 16.54;


const CHAR_WIDTH_RATIO = 0.55;
const TITLE_FIT_SAFETY = 0.93;
const TITLE_BAR_PADDING_DXA = 240;
const TITLE_BAR_LINE_HEIGHT = 1.25;
const REFERENCE_TABLE_LINE_HEIGHT = 1.25;


const WIDE_ASPECT = 1.15;

// ─── Page geometry ──────────────────────────────────────────────────────

function pageInches(size, orientation) {
  const isA3 = size === "A3";
  const short = isA3 ? A3_SHORT_IN : A4_SHORT_IN;
  const long = isA3 ? A3_LONG_IN : A4_LONG_IN;
  if (orientation === "landscape") return { width: long, height: short };
  return { width: short, height: long };
}

function marginInches(size, style) {
  const cm = size === "A3" ? style.marginsCm.a3 : style.marginsCm.a4;
  return cm / 2.54;
}

function printableInches(size, orientation, style) {
  const dims = pageInches(size, orientation);
  const m = marginInches(size, style);
  return { width: dims.width - 2 * m, height: dims.height - 2 * m };
}

function printableDxa(size, orientation, style) {
  const dims = printableInches(size, orientation, style);
  return { width: Math.round(dims.width * 1440), height: Math.round(dims.height * 1440) };
}

// ─── Autofit ────────────────────────────────────────────────────────────

function fitTitleSize(text, basePt, size, orientation, style) {
  const usableWidth = pageInches(size, orientation).width - 2 * marginInches(size, style);
  const safe = usableWidth * TITLE_FIT_SAFETY;
  let pt = basePt;
  while (pt > 36) {
    const widthInches = (text.length * pt * CHAR_WIDTH_RATIO) / 72;
    if (widthInches <= safe) return pt;
    pt -= 8;
  }
  return Math.max(36, pt);
}

// Keep the height reserved by the layout pass identical to the title bar's
// CSS. A fixed 1.4in allowance was smaller than a 96pt A3 title plus its two
// 240dxa paddings, so a table could validate and then lose its final row below
// the physical page edge.
function titleBarHeightInches(fittedPt) {
  return (fittedPt * TITLE_BAR_LINE_HEIGHT / 72) + (2 * TITLE_BAR_PADDING_DXA / 1440);
}

// ─── What the page draws ────────────────────────────────────────────────
//
// A card body used to be planned with a letter counted as 0.55 of the type
// size, a line 1.3 times it, 0.4in for the panel's padding and border and
// 0.22in between items. Chrome, which prints the wall, draws Comic Sans MS
// Bold by the font's own advance widths and wraps whole words; `line-height:
// normal` gives a line the font's ascender plus descender, about 1.4 times the
// type; and the panel's padding and border take 0.58in. So a body could be
// planned into its panel and print past the panel's edge: a Christmas wall's
// sticky card did, and so did a 72-letter fact beside a photo (release 7A's
// second check, 26 September 2026). A panel card's body is now planned the way
// the page draws it: each word measured with the font's own widths (the
// board's table, which matches Chrome to the pixel), wrapped whole, each line
// the font's own height, and each kind of item with the padding, badge, bullet
// or label its HTML gives it. The character budgets a designer writes to (62,
// 72, 106) are unchanged: they decide which card is refused, and stay a count
// of letters.
const PX_PER_IN = 96;
const PX_PER_PT = 96 / 72;
const A3_MM = { short: 297, long: 420 };
// Advances the board's table does not carry, measured in the same Chrome: the
// curly quotes and the no-break space from Comic Sans MS Bold, the arrows from
// Segoe Print Bold at 140%, which draws them on the wall (shared.js, "Wall
// Arrows").
const EXTRA_BOLD_EM = {
  "\u2019": 0.2261, "\u2018": 0.2261, "\u00a0": 0.4761,
  "\u2190": 1.3973, "\u2192": 1.3973, "\u2194": 1.5395, "\u2191": 0.6973, "\u2193": 0.6973,
};

// The HTML writes every length in millimetres rounded to a hundredth.
function mmOf(inches) {
  return Math.round(inches * 25.4 * 100) / 100;
}

function pxOfMm(millimetres) {
  return (millimetres * PX_PER_IN) / 25.4;
}

// Comic Sans MS Bold's ascender and descender are 2257 and 597 of 2048 units;
// Chrome rounds each to a whole pixel, and the line box is their sum.
function lineBoxPx(pt) {
  const px = pt * PX_PER_PT;
  return Math.round((px * 2257) / 2048) + Math.round((px * 597) / 2048);
}

function boldWidthPx(text, pt) {
  let em = 0;
  for (const ch of String(text == null ? "" : text)) {
    em += EXTRA_BOLD_EM[ch] !== undefined ? EXTRA_BOLD_EM[ch] : textWidthEm(ch, true) / RENDER_SAFETY;
  }
  return em * pt * PX_PER_PT;
}

// The same words in Comic Sans MS Regular, which a diagramSection's notes and
// steps print in. A character only the bold list above carries keeps its bold
// advance, which is the wider of the two.
function regularWidthPx(text, pt) {
  let em = 0;
  for (const ch of String(text == null ? "" : text)) {
    em += EXTRA_BOLD_EM[ch] !== undefined ? EXTRA_BOLD_EM[ch] : textWidthEm(ch, false) / RENDER_SAFETY;
  }
  return em * pt * PX_PER_PT;
}

// Where Chrome may end a line: at a space, and after a hyphen inside a word.
// It has others (after a slash, around a dash); leaving them out only ever
// plans a line more, never one fewer.
function breakUnits(text) {
  const units = [];
  for (const word of String(text || "").split(/[ \t\r\n]+/).filter(Boolean)) {
    word.split(/(?<=[A-Za-z]-)(?=[A-Za-z])/).forEach((part, index) => units.push({ text: part, spaceBefore: index === 0 }));
  }
  return units;
}

// The lines `text` takes in a box `widthPx` wide at `pt`, or Infinity when one
// word is wider than a line (Chrome would print it past the edge). `leadPx` is
// glued to the first word (a bullet and its spaces); `prefixPx` is a label the
// line may break after, followed by a space `prefixSpacePx` wide. `regular`
// measures the words in the regular weight.
function wrappedLines(text, pt, widthPx, opts = {}) {
  const widthOf = opts.regular ? regularWidthPx : boldWidthPx;
  const room = widthPx - 0.25;
  const space = widthOf(" ", pt);
  let lines = 1;
  let used = opts.prefixPx || 0;
  if (used > room) return Infinity;
  breakUnits(text).forEach((unit, index) => {
    if (lines === Infinity) return;
    const width = widthOf(unit.text, pt) + (index === 0 ? opts.leadPx || 0 : 0);
    if (width > room) {
      lines = Infinity;
      return;
    }
    if (used === 0) {
      used = width;
      return;
    }
    const gap = unit.spaceBefore ? (index === 0 && opts.prefixPx ? opts.prefixSpacePx || 0 : space) : 0;
    if (used + gap + width <= room) {
      used += gap + width;
    } else {
      lines += 1;
      used = width;
    }
  });
  return lines;
}

// One item as its HTML draws it (render-panels.js): its lines and its height
// in pixels, padding included. `kind` names the HTML: `line` a centred body
// line, `step` a badge row, `trailing` a labelled worked-example paragraph,
// `stem` a bulleted sentence stem and `filled` its modelled completion.
function itemBlock(item, pt, widthPx, page) {
  const text = item.text || "";
  const line = lineBoxPx(pt);
  const kind = item.kind || "line";
  if (kind === "step") {
    const badgePx = pxOfMm(mmOf(page.badgeInches(pt)));
    const lines = wrappedLines(text, pt, widthPx - badgePx - pxOfMm(mmOf(200 / 1440)));
    return { lines, px: 2 * pxOfMm(mmOf(60 / 1440)) + Math.max(badgePx, lines * line) };
  }
  if (kind === "trailing") {
    const labelPt = page.labelPt(pt);
    const label = item.label ? `${item.label}:` : "";
    const lines = wrappedLines(text, pt, widthPx, label
      ? { prefixPx: boldWidthPx(label, labelPt), prefixSpacePx: boldWidthPx(" ", labelPt) }
      : {});
    return { lines, px: pxOfMm(mmOf(240 / 1440)) + pxOfMm(mmOf(120 / 1440)) + lines * line };
  }
  if (kind === "stem") {
    const lines = wrappedLines(text, pt, widthPx - pxOfMm(mmOf(360 / 1440)), { leadPx: boldWidthPx("\u2022\u00a0\u00a0\u00a0", pt) });
    return { lines, px: 2 * pxOfMm(mmOf(200 / 1440)) + lines * line };
  }
  if (kind === "filled") {
    const lines = wrappedLines(text, pt, widthPx - pxOfMm(mmOf(1080 / 1440)));
    return { lines, px: pxOfMm(mmOf(240 / 1440)) + lines * line };
  }
  const lines = wrappedLines(text, pt, widthPx);
  return { lines, px: 2 * pxOfMm(mmOf(200 / 1440)) + lines * line };
}

// The panel a body is drawn in (shared.js `panelHtml`): its outer width as the
// HTML writes it, and the padding and border it keeps on every side. The wall
// is A3 only (build.js refuses anything else). `extra.outerIn` and
// `extra.paddingDxa` describe a panel of another shape (the misconception's two
// cells); `extra.pair` says its items stand side by side under a heading line
// at `extra.headPt` with `extra.headPadDxa` below it, rather than one under
// another.
function panelPage(orientation, style, panelFraction, extra = {}) {
  const landscape = orientation === "landscape";
  const marginMm = style.marginsCm.a3 * 10;
  const coreWidthMm = (landscape ? A3_MM.long : A3_MM.short) - 2 * marginMm;
  const coreHeightMm = (landscape ? A3_MM.short : A3_MM.long) - 2 * marginMm;
  const dims = printableInches("A3", orientation, style);
  const outerMm = Math.min(mmOf(extra.outerIn != null ? extra.outerIn : dims.width * panelFraction), coreWidthMm);
  const edgeMm = mmOf((extra.paddingDxa != null ? extra.paddingDxa : 360) / 1440) + mmOf((style.sizes.panelBorderEighths || 24) / 8 / 72);
  return {
    headPx: extra.headPt ? pxOfMm(mmOf((extra.headPadDxa || 0) / 1440)) + lineBoxPx(extra.headPt) : 0,
    coreWidthPx: pxOfMm(coreWidthMm),
    textWidthPx: pxOfMm(outerMm - 2 * edgeMm),
    innerHeightPx: (titleAreaInches) => pxOfMm(coreHeightMm - 2 * edgeMm) - titleAreaInches * PX_PER_IN,
    ...extra,
  };
}

// The caption under a figure stacked beneath the panel (shared.js
// `panelWithVisualHtml`): its gap and its bold 28pt lines across the card. The
// figure's own reserve never counted it, so a stacked card with a caption was
// planned 0.6in taller than the page gave it.
function stackedCaptionInches(label, orientation, style) {
  if (!label) return 0;
  const lines = wrappedLines(label, 28, panelPage(orientation, style, 1).coreWidthPx);
  return (pxOfMm(mmOf(90 / 1440)) + (Number.isFinite(lines) ? lines : 1) * lineBoxPx(28)) / PX_PER_IN;
}

function longestWordLen(text) {
  if (!text) return 0;
  let max = 0;
  for (const word of String(text).split(/\s+/)) if (word.length > max) max = word.length;
  return max;
}

function fitLinearBodySize(items, defaultPt, minPt, size, orientation, style, opts = {}) {
  const isA3 = size === "A3";
  const dims = printableInches(size, orientation, style);
  const titleAreaInches = opts.titleAreaInches != null ? opts.titleAreaInches : (isA3 ? 1.4 : 1.0);
  const safety = opts.safety != null ? opts.safety : 0.4;
  const availHeight = dims.height - titleAreaInches - safety;
  const availWidth = opts.widthOverride != null ? opts.widthOverride : dims.width;
  const lineHeight = opts.lineHeight || 1.3;
  const interItem = opts.interItem != null ? opts.interItem : 0.22;
  const charWidthRatio = opts.charWidthRatio || 0.55;
  // Two different questions, and the same number used to answer both.
  //
  // `floorLinesPerItem` is the content budget: how many lines an item may take
  // at the floor size before the card is refused by name. It is what the
  // character budget in the designer's brief is derived from, so it stays at 2.
  //
  // `maxLinesPerItem` is the layout cap: how far an item may wrap while the
  // fitter searches for a size. Wrapping one short sentence over four lines of
  // large type is how a card fills an A3 sheet, so this is deliberately looser.
  // Holding both at 2 meant the cap, not the page, chose the type size, and a
  // one-sentence card beside a photo came out at the floor in a panel running
  // the full height of the sheet.
  const maxLinesPerItem = opts.maxLinesPerItem || 2;
  const floorLinesPerItem = opts.floorLinesPerItem || 2;
  // How many items may take the floor's last line, when a card allows more than
  // two: a sticky fact beside a photo narrowed to a third runs to three lines,
  // one such fact a card (his answer of 26 September 2026, "yes"); a second
  // goes on a second card.
  const longItemsAtFloor = opts.longItemsAtFloor;
  const longAtFloor = () => {
    if (longItemsAtFloor == null || floorLinesPerItem <= 2) return [];
    const charsPerLine = Math.max(1, Math.floor((availWidth * 72) / (minPt * charWidthRatio)));
    return items.map((item, index) => {
      const obj = (typeof item === "string") ? { text: item } : (item || {});
      const adjLen = (obj.text || "").length + (obj.label ? obj.label.length + 2 : 0);
      return Math.ceil(adjLen / charsPerLine) >= floorLinesPerItem ? index : -1;
    }).filter((index) => index >= 0);
  };
  // A panel card passes the page it is drawn on (`panelPage`); then the size
  // search and the panel check read the drawn page, and letters count only for
  // the budget.
  const page = opts.page || null;
  // A card with no `page` may still say how many lines an item really takes at
  // a size (`opts.linesOf(item, pt)`, the words measured and wrapped whole as
  // the page draws them). Then the lines decide what is refused, not a count of
  // letters at a guessed width: under a half-sheet picture the guess was 26
  // letters a line where about 30 print, and it refused sentences of 53 and 58
  // letters that fit their two lines (the stress test of 7 October 2026).
  const linesOf = !page && typeof opts.linesOf === "function" ? opts.linesOf : null;

  const fitAt = (pt, cap = maxLinesPerItem, withHeight = true) => {
    const charsPerLine = Math.max(1, Math.floor((availWidth * 72) / (pt * charWidthRatio)));
    let totalLines = 0;
    for (const item of items) {
      const obj = (typeof item === "string") ? { text: item } : (item || {});
      const text = obj.text || "";
      if (linesOf) {
        const measured = linesOf(obj, pt);
        if (!(measured <= cap)) return { fits: false, lines: measured };
        totalLines += measured;
        continue;
      }
      const labelLen = obj.label ? obj.label.length + 2 : 0;
      const adjLen = text.length + labelLen;
      const longestWord = Math.max(longestWordLen(text), labelLen);
      if (longestWord > charsPerLine) return { fits: false, lines: Infinity };
      const lines = Math.max(1, Math.ceil(adjLen / charsPerLine));
      if (lines > cap) return { fits: false, lines };
      totalLines += lines;
    }
    if (!withHeight) return { fits: true, lines: totalLines };
    const heightInches = totalLines * (pt * lineHeight / 72) + items.length * interItem;
    return { fits: heightInches <= availHeight, height: heightInches, lines: totalLines };
  };

  const drawn = (pt) => items.map((item) => itemBlock((typeof item === "string") ? { text: item } : (item || {}), pt, page.textWidthPx, page));
  // One under another, or a pair side by side under their heading.
  const bodyPx = (blocks) => (page.pair
    ? (page.headPx || 0) + Math.max(0, ...blocks.map((block) => block.px))
    : blocks.reduce((sum, block) => sum + block.px, 0));
  const drawnAt = (pt, cap = maxLinesPerItem) => {
    if (!page) return fitAt(pt, cap);
    const blocks = drawn(pt);
    if (blocks.some((block) => block.lines > cap)) return { fits: false };
    const px = bodyPx(blocks);
    return { fits: px <= page.innerHeightPx(titleAreaInches), height: px / PX_PER_IN };
  };

  // A refusal that says only "something is too long" costs the whole wall: the
  // route allows one focused repair, and a repair aimed at nothing is a guess.
  // Name the card, the item, and the budget it has to come under.
  //
  // Every problem is named at once. Stopping at the first over-long item hid a
  // panel three inches too tall behind a two-character overrun: the one repair
  // shortened the item, the rebuild found the panel, and the wall was lost
  // (14 September 2026). The remedy is named by who may apply it, because a
  // focused repair may move and split content but not reword it, and it leads
  // with room, because a child's sentence is kept whole before it is shortened.
  const diagnose = (pt, cap = maxLinesPerItem, onPage = false) => {
    const charsPerLine = Math.max(1, Math.floor((availWidth * 72) / (pt * charWidthRatio)));
    const budget = charsPerLine * cap;
    const where = opts.label ? `${opts.label}` : "this card";
    const problems = [];
    let reword = false;
    let totalLines = 0;
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const obj = (typeof item === "string") ? { text: item } : (item || {});
      const text = obj.text || "";
      const labelLen = obj.label ? obj.label.length + 2 : 0;
      const adjLen = text.length + labelLen;
      const longestWord = Math.max(longestWordLen(text), labelLen);
      if (linesOf) {
        const measured = linesOf(obj, pt);
        const quoted = `"${String(text).slice(0, 60)}${text.length > 60 ? "…" : ""}"`;
        totalLines += Number.isFinite(measured) ? measured : 1;
        if (measured === Infinity) {
          problems.push(`item ${index + 1} has a word too wide for a line at ${pt}pt: ${quoted}. Split that word or shorten the item's label.`);
          reword = true;
        } else if (measured > cap) {
          problems.push(`item ${index + 1} takes ${measured} lines at ${pt}pt, and ${cap} is the most one item may take: ${quoted}.`);
          reword = true;
        }
        continue;
      }
      totalLines += Math.max(1, Math.ceil(adjLen / charsPerLine));
      if (onPage) continue;
      if (longestWord > charsPerLine) {
        problems.push(`item ${index + 1} contains a ${longestWord}-character run that cannot break, and only ${charsPerLine} characters fit on a line at ${pt}pt. Split that word or shorten the item's label.`);
        reword = true;
      } else if (Math.ceil(adjLen / charsPerLine) > cap) {
        problems.push(`item ${index + 1} is ${adjLen} characters including its label, and ${budget} is the most that fits in ${cap} lines at ${pt}pt (${charsPerLine} per line): "${String(text).slice(0, 60)}${text.length > 60 ? "…" : ""}".`);
        reword = true;
      }
    }
    let height = totalLines * (pt * lineHeight / 72) + items.length * interItem;
    let available = availHeight;
    if (onPage) {
      // As the page draws it: a word too wide for a line, an item past the
      // lines one item may take, and the panel's height.
      const blocks = drawn(pt);
      blocks.forEach((block, index) => {
        const text = String(((typeof items[index] === "string") ? items[index] : (items[index] || {}).text) || "");
        const quoted = `"${text.slice(0, 60)}${text.length > 60 ? "…" : ""}"`;
        if (block.lines === Infinity) {
          problems.push(`item ${index + 1} has a word too wide for a line at ${pt}pt: ${quoted}. Split that word or shorten the item's label.`);
          reword = true;
        } else if (block.lines > cap) {
          problems.push(`item ${index + 1} takes ${block.lines} lines at ${pt}pt, and ${cap} is the most one item may take: ${quoted}.`);
          reword = true;
        }
      });
      height = bodyPx(blocks.filter((block) => block.lines !== Infinity)) / PX_PER_IN;
      available = page.innerHeightPx(titleAreaInches) / PX_PER_IN;
    }
    const panelOver = height > available;
    if (panelOver) {
      problems.push(`${items.length} items need ${height.toFixed(1)}in of panel at ${pt}pt and ${available.toFixed(1)}in is available (${(height - available).toFixed(1)}in over).${linesOf ? "" : ` Each item may hold ${budget} characters.`}`);
    }
    const long = onPage ? [] : longAtFloor();
    const tooManyLong = long.length > longItemsAtFloor;
    if (tooManyLong) {
      problems.push(`items ${long.map((index) => index + 1).join(" and ")} each need ${floorLinesPerItem} lines at ${pt}pt beside the photo, and a card holds only ${longItemsAtFloor === 1 ? "one fact" : `${longItemsAtFloor} facts`} that long.`);
    }
    const remedies = [];
    if (tooManyLong) {
      remedies.push("a card holds one fact that long beside its photo (the teacher's rule): the next long fact goes, in order, on a second card of the same type and title where the wall has room, which keeps every word and is a layout change a focused repair may make; a fact that still cannot fit gets a shorter whole sentence from the wall designer");
    }
    if (panelOver) {
      remedies.push("Splitting the items in order over a second card keeps every word and is a layout change (a wall takes two teaching cards); otherwise remove an item or shorten the longest to a whole sentence, never a success-criteria step, which is copied word for word");
    }
    if (reword) {
      remedies.push("an item over its own budget needs room before its words change: any picture beside it has already narrowed (a sticky fact's photo to about a third of the card), so next carry a list over a second card; only if it still will not fit is it shortened, to a whole sentence with the same meaning and never a clipped phrase, and that is the wall designer's decision, not a focused repair's; the picture comes off last of all, since the teacher's walls rarely have a card without one; a success-criteria step is never reworded, so its card makes room instead (the list over two cards, and the picture off only when nothing else fits)");
    }
    return `${where}: ${problems.join(" ")}${remedies.length ? ` ${remedies.join("; ")}.` : ""}`;
  };

  // The content budget is checked first and whatever the search then finds, so
  // an item written past its budget is still named even when some smaller size
  // would have squeezed it in. That refusal is the only thing that reaches the
  // designer, and it is what the one permitted repair aims at.
  // On a panel card the budget is the letters alone; the page decides the panel.
  const content = fitAt(minPt, floorLinesPerItem, !page);
  const tooManyLong = longAtFloor().length > longItemsAtFloor;
  if (!content.fits || tooManyLong) {
    console.warn(`[autofit] linear body at floor ${minPt}pt does not fit ${size} ${orientation}: ${diagnose(minPt, floorLinesPerItem)}`);
  }

  for (let pt = defaultPt; pt >= minPt; pt -= 4) {
    if (drawnAt(pt).fits) return pt;
  }
  if (content.fits && !tooManyLong && !drawnAt(minPt).fits) {
    console.warn(`[autofit] linear body at floor ${minPt}pt does not fit ${size} ${orientation}: ${diagnose(minPt, maxLinesPerItem, !!page)}`);
  }
  return minPt;
}

// Would this body still fit at its floor size if the card gave it this much
// title-and-visual area? Answers the question `fitLinearBodySize` cannot: its
// return value is `minPt` both when the floor fits exactly and when it does
// not, so a caller deciding how much height to hand a figure cannot tell a
// panel that is full from one that has been overrun. Same arithmetic, one
// boolean.
function linearBodyFitsAtFloor(items, minPt, size, orientation, style, opts = {}) {
  const probe = [];
  const original = console.warn;
  console.warn = (...args) => probe.push(args);
  try {
    fitLinearBodySize(items, minPt, minPt, size, orientation, style, opts);
  } finally {
    console.warn = original;
  }
  return probe.length === 0;
}

function fitReferenceTableSize(columns, rows, columnWidthsDxa, defaultPt, minPt, size, orientation, style, opts = {}) {
  const isA3 = size === "A3";
  const dims = printableInches(size, orientation, style);
  const titleAreaInches = opts.titleAreaInches != null ? opts.titleAreaInches : (isA3 ? 1.4 : 1.0);
  const safety = opts.safety != null ? opts.safety : 0.3;
  const availHeight = dims.height - titleAreaInches - safety;
  const lineHeight = opts.lineHeight || REFERENCE_TABLE_LINE_HEIGHT;
  const charWidthRatio = opts.charWidthRatio || 0.55;
  const headerRatio = opts.headerRatio || 0.75;
  const cellPaddingH = 400 / 1440;
  const cellPaddingW = 400 / 1440;
  const maxLinesPerCell = opts.maxLinesPerCell || 2;
  const rowMinHeights = Array.isArray(opts.rowMinHeights) ? opts.rowMinHeights : [];

  // A cell's lines as the page draws them: its bold words measured and wrapped
  // whole across the column less its padding. Counted as letters at a guessed
  // width, "Role of women" was a letter too long for a line it prints on, and
  // took a second line the page never used (stress test of 7 October 2026).
  const linesInCell = (text, colWidthInches, pt) => {
    const usable = Math.max(0.1, colWidthInches - cellPaddingW);
    const lines = wrappedLines(String(text || "").trim(), pt, usable * PX_PER_IN);
    if (lines > maxLinesPerCell) return Infinity;
    return lines;
  };

  const fitAt = (pt) => {
    const headerPt = Math.max(1, Math.round(pt * headerRatio));
    const colInches = columnWidthsDxa.map((d) => d / 1440);

    const headerCellLines = columns.map((c, i) => linesInCell(c, colInches[i], headerPt));
    if (headerCellLines.some((n) => !isFinite(n))) return { fits: false };
    const headerRowLines = Math.max(...headerCellLines);
    let total = headerRowLines * (headerPt * lineHeight / 72) + cellPaddingH;

    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx];
      const cellLines = row.map((c, i) => linesInCell(c, colInches[i], pt));
      if (cellLines.some((n) => !isFinite(n))) return { fits: false };
      const rowMaxLines = Math.max(...cellLines);
      const textHeight = rowMaxLines * (pt * lineHeight / 72) + cellPaddingH;
      total += Math.max(textHeight, rowMinHeights[rowIdx] || 0);
    }
    return { fits: total <= availHeight, height: total };
  };

  // Same reason as the linear body: one repair, so it has to know which cell
  // and by how much. Column widths differ, so the budget is per column.
  // The refusal says what the page measured: which box, and the lines it took.
  // It used to quote a count of letters a column "holds" (38 for a box that
  // stays on one line only up to about 20), and a worker shortening to that
  // count was refused again, twice (a wall trial, 10 October 2026).
  const diagnose = (pt) => {
    const headerPt = Math.max(1, Math.round(pt * headerRatio));
    const colInches = columnWidthsDxa.map((d) => d / 1440);
    const rawLines = (text, colIdx, atPt) => wrappedLines(String(text || "").trim(), atPt, Math.max(0.1, colInches[colIdx] - cellPaddingW) * PX_PER_IN);
    const quoted = (text) => `"${String(text || "").slice(0, 60)}${String(text || "").length > 60 ? "…" : ""}"`;
    const where = opts.label ? `${opts.label}` : "this table";
    const cells = [
      ...columns.map((text, colIdx) => ({ text, colIdx, atPt: headerPt, at: "the header row" })),
      ...rows.flatMap((row, rowIdx) =>
        row.map((text, colIdx) => ({ text, colIdx, atPt: pt, at: `row ${rowIdx + 1}` }))
      ),
    ];
    for (const cell of cells) {
      const lines = rawLines(cell.text, cell.colIdx, cell.atPt);
      if (lines <= maxLinesPerCell) continue;
      const name = columns[cell.colIdx] ? `"${columns[cell.colIdx]}"` : `${cell.colIdx + 1}`;
      if (lines === Infinity) {
        return `${where}: the cell in ${cell.at}, column ${name}, has a word too wide for that column at ${cell.atPt}pt: ${quoted(cell.text)}. A row name the board gave cannot change, so give the table the other orientation or fewer columns; any other cell takes a shorter word.`;
      }
      return `${where}: the cell in ${cell.at}, column ${name}, takes ${lines} lines at ${cell.atPt}pt and a cell may take ${maxLinesPerCell}: ${quoted(cell.text)}. Make it shorter, unless the table is the lesson's success criteria, which are copied word for word (the card makes room instead).`;
    }
    const measured = fitAt(pt);
    const long = rows.flatMap((row, rowIdx) => row
      .map((text, colIdx) => ({ text, lines: rawLines(text, colIdx, pt), rowIdx }))
      .filter((cell) => cell.lines > 1 && Number.isFinite(cell.lines))
      .map((cell) => `${quoted(cell.text)} (row ${cell.rowIdx + 1}, ${cell.lines} lines)`));
    const lever = long.length
      ? ` These boxes run past one line, and each cut to one line gives its row a line back: ${long.join(", ")}.`
      : "";
    return `${where}: ${rows.length} rows need ${measured.height != null ? measured.height.toFixed(1) : "more"}in and ${availHeight.toFixed(1)}in is available at ${pt}pt.${lever} Or remove a row; a success-criteria table keeps every row and word, so its card makes room instead, or the table goes over two cards.`;
  };

  // `opts.report` is told the height the rows take at the size chosen and the
  // height there was, so a caller can hand what is left to the table's pictures.
  const tell = (pt) => {
    if (opts.report) Object.assign(opts.report, { height: fitAt(pt).height, available: availHeight });
    return pt;
  };
  for (let pt = defaultPt; pt >= minPt; pt -= 4) {
    if (fitAt(pt).fits) return tell(pt);
  }
  const floor = fitAt(minPt);
  if (!floor.fits) {
    console.warn(`[autofit] reference table at floor ${minPt}pt does not fit ${size} ${orientation}: ${diagnose(minPt)}`);
  }
  return minPt;
}

// ─── Reference table ────────────────────────────────────────────────────

// The share of the sheet the two value columns of a three-column table take
// when they hold the same kind of thing.
const COMPARED_COLUMNS = [0.26, 0.37, 0.37];
const COMPARED_RATIO = 0.6;

function longestInColumn(rows, index) {
  return (rows || []).reduce((max, row) => Math.max(max, String((row && row[index]) || "").length), 0);
}

// Whether a three-column table sets two things side by side: its two value
// columns write about as much as each other.
function comparesTwoColumns(columnCount, rows) {
  if (columnCount !== 3) return false;
  const second = longestInColumn(rows, 1);
  const third = longestInColumn(rows, 2);
  return second > 0 && third > 0 && Math.min(second, third) / Math.max(second, third) >= COMPARED_RATIO;
}

function referenceColumnWidths(columnCount, pageSize, orientation, style, rows) {
  const dims = printableInches(pageSize, orientation, style);
  const totalDxa = Math.round(dims.width * 1440);

  if (columnCount === 2) {
    // Portrait tables need enough physical width for ordinary row labels at
    // the 36pt readability floor. The landscape split remains the established
    // 30/70; portrait uses 35/65 and may wrap descriptive cells to three lines.
    const left = Math.round(totalDxa * (orientation === "portrait" ? 0.35 : 0.30));
    return [left, totalDxa - left];
  }
  if (columnCount === 3) {
    // Name, short value, long description is the established split below. A
    // table that sets two things side by side (Athens beside Sparta) writes as
    // much in one column as the other, and at 28% against 45% its first held
    // 28 letters where its second held 48: the comparison the lesson named for
    // the wall was left off (stress test of 7 October 2026). Columns whose
    // longest cells are near each other in length share the room equally.
    if (comparesTwoColumns(columnCount, rows)) {
      const left = Math.round(totalDxa * COMPARED_COLUMNS[0]);
      const middle = Math.round(totalDxa * COMPARED_COLUMNS[1]);
      return [left, middle, totalDxa - left - middle];
    }
    const left = Math.round(totalDxa * 0.27);
    const middle = Math.round(totalDxa * 0.28);
    return [left, middle, totalDxa - left - middle];
  }
  const each = Math.floor(totalDxa / columnCount);
  return Array(columnCount).fill(each);
}

// ─── Photo helpers ──────────────────────────────────────────────────────

function tryReadPhoto(specDir, photoRelPath) {
  if (!photoRelPath) return null;
  const abs = pathHelpers.resolve(specDir, photoRelPath);
  if (!fsHelpers.existsSync(abs)) return null;
  return fsHelpers.readFileSync(abs);
}

function photoAspect(buf) {
  if (!buf || buf.length < 24) return null;
  // PNG: width and height are the two big-endian ints after the IHDR marker.
  if (buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") {
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    return w && h ? w / h : null;
  }
  // JPEG: walk the segment markers to the start-of-frame, which carries the size.
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      // SOF0-SOF15, skipping the four markers in that range that are not frames.
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        const h = buf.readUInt16BE(i + 5);
        const w = buf.readUInt16BE(i + 7);
        return w && h ? w / h : null;
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return null;
}

module.exports = {
  linearBodyFitsAtFloor,
  lineBoxPx,
  boldWidthPx,
  wrappedLines,
  itemBlock,
  panelPage,
  stackedCaptionInches,
  printableInches,
  printableDxa,
  fitTitleSize,
  titleBarHeightInches,
  fitLinearBodySize,
  fitReferenceTableSize,
  referenceColumnWidths,
  comparesTwoColumns,
  tryReadPhoto,
  photoAspect,
  TITLE_BAR_PADDING_DXA,
  TITLE_BAR_LINE_HEIGHT,
  REFERENCE_TABLE_LINE_HEIGHT,
  WIDE_ASPECT,
};
