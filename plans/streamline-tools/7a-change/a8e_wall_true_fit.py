"""Release 7A (4.2.293), step 8e (his answer of 26 September 2026 on a sticky
fact too long to sit beside its photo, and the second check's item 3): the wall
plans a card's body the way the page draws it, and a long sticky fact keeps its
photo and its whole sentence.

His words: asked whether the photo should shrink further, to about a third of
the card, so the whole sentence fits beside it; only then the sentence
rewritten as a shorter whole sentence; the photo off only as the very last
move, he answered "yys" (yes).

The true fit (layout.js, What the page draws). The body fitter planned a card
with a letter at 0.55 of the type size, a line 1.3 times it, 0.4in of panel
edge and 0.22in between items; Chrome draws Comic Sans MS Bold by its own
advance widths, wraps whole words, gives a line the font's ascender plus
descender (about 1.4 times the type) and keeps 0.58in of padding and border, so
a card could print past its panel (the Christmas wall's sticky card did). The
sticky, definition, worked-example, sentence-stem and misconception cards, the
wall's cards whose words wrap in a panel, now plan against the page: each word
measured with the board's width table (it matches Chrome to a hundredth of a
pixel), wrapped whole, each line the font's own height, each item with its own
padding, badge, bullet or label, the panel's real width and edge, and a stacked
figure as it is drawn (its caption counted, and its real height rather than the
reserve it is offered, which a wide figure often does not fill). The misconception pair is planned as the two cells it draws,
side by side under their labels, with the picture beneath it taken from their
height (it used to be planned as one panel with both sentences stacked, and the
picture forgotten). The worked example's flat 0.2in badge reserve goes (each
row is measured at its badge's height), and a dominant figure, which sits beside
the panel, no longer reserves room beneath it. The character budgets (62, 72,
106) still decide which card is refused. The wall's other card types (titles,
banners, headings, chips, grids, tables, posters, overviews, sections) keep
their own fitters: a Chrome audit of all sixteen types on the fixtures and saved
walls found text outside its box on one other card only (a diagram section, by
2.3px), reported to the lead.

His order. A sticky fact that does not fit beside its photo even when the photo
gives way a little (72 letters) keeps both: the photo narrows to about a third
of the card (the widest share, 0.7) and the fact may run to three lines at the
floor size (about 106 letters). Then the wall designer's shorter whole sentence,
and the picture off last of all, in rule 8, the budget section and the layout
check's pointer; the wall preferences' principle 4 (the one exception to two
lines), principle 5, the floor line and the sticky row; the focused repair;
and the build's refusal. The wall designer stays under its 51 KiB cap (the
layout check's pointer now names the order rather than repeating an older one
that put shortening first)."""
from _patch import WALLD, WALLP, WALLR, replace_once

LAYOUT = "working-wall-html/src/layout.js"
VISUALS = "working-wall-html/src/visuals.js"
PANELS = "working-wall-html/src/render-panels.js"

# --- working-wall-html/src/layout.js (11 replacements) ---
replace_once(LAYOUT,
             r"""  linearBodyFitsAtFloor,
  printableInches,
""",
             r"""  linearBodyFitsAtFloor,
  lineBoxPx,
  boldWidthPx,
  wrappedLines,
  itemBlock,
  panelPage,
  stackedCaptionInches,
  printableInches,
""")
replace_once(LAYOUT,
             r"""  for (let pt = defaultPt; pt >= minPt; pt -= 4) {
    if (fitAt(pt).fits) return pt;
  }
  if (content.fits && !fitAt(minPt).fits) {
    console.warn(`[autofit] linear body at floor ${minPt}pt does not fit ${size} ${orientation}: ${diagnose(minPt)}`);
  }
""",
             r"""  for (let pt = defaultPt; pt >= minPt; pt -= 4) {
    if (drawnAt(pt).fits) return pt;
  }
  if (content.fits && !drawnAt(minPt).fits) {
    console.warn(`[autofit] linear body at floor ${minPt}pt does not fit ${size} ${orientation}: ${diagnose(minPt, maxLinesPerItem, !!page)}`);
  }
""")
replace_once(LAYOUT,
             r"""  // designer, and it is what the one permitted repair aims at.
  const content = fitAt(minPt, floorLinesPerItem);
  if (!content.fits) {
""",
             r"""  // designer, and it is what the one permitted repair aims at.
  // On a panel card the budget is the letters alone; the page decides the panel.
  const content = fitAt(minPt, floorLinesPerItem, !page);
  if (!content.fits) {
""")
replace_once(LAYOUT,
             r"""    if (reword) {
      remedies.push("an item over its own budget needs room before its words change: any picture beside it has already given up a little width, so next carry a list over a second card, and take the picture off only when nothing else fits, since a card with no picture has the full width; only if it still will not fit is it shortened, to a whole sentence with the same meaning and never a clipped phrase, and that is the wall designer's decision, not a focused repair's; a success-criteria step is never reworded, so its card makes room instead (the list over two cards, and the picture off only when nothing else fits)");
    }
""",
             r"""    if (reword) {
      remedies.push("an item over its own budget needs room before its words change: any picture beside it has already narrowed (a sticky fact's photo to about a third of the card), so next carry a list over a second card; only if it still will not fit is it shortened, to a whole sentence with the same meaning and never a clipped phrase, and that is the wall designer's decision, not a focused repair's; the picture comes off last of all, since the teacher's walls rarely have a card without one; a success-criteria step is never reworded, so its card makes room instead (the list over two cards, and the picture off only when nothing else fits)");
    }
""")
replace_once(LAYOUT,
             r"""    }
    const height = totalLines * (pt * lineHeight / 72) + items.length * interItem;
    const panelOver = height > availHeight;
    if (panelOver) {
      problems.push(`${items.length} items need ${height.toFixed(1)}in of panel at ${pt}pt and ${availHeight.toFixed(1)}in is available (${(height - availHeight).toFixed(1)}in over). Each item may hold ${budget} characters.`);
    }
""",
             r"""    }
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
      problems.push(`${items.length} items need ${height.toFixed(1)}in of panel at ${pt}pt and ${available.toFixed(1)}in is available (${(height - available).toFixed(1)}in over). Each item may hold ${budget} characters.`);
    }
""")
replace_once(LAYOUT,
             r"""      totalLines += Math.max(1, Math.ceil(adjLen / charsPerLine));
      if (longestWord > charsPerLine) {
""",
             r"""      totalLines += Math.max(1, Math.ceil(adjLen / charsPerLine));
      if (onPage) continue;
      if (longestWord > charsPerLine) {
""")
replace_once(LAYOUT,
             r"""  // with room, because a child's sentence is kept whole before it is shortened.
  const diagnose = (pt, cap = maxLinesPerItem) => {
    const charsPerLine = Math.max(1, Math.floor((availWidth * 72) / (pt * charWidthRatio)));
""",
             r"""  // with room, because a child's sentence is kept whole before it is shortened.
  const diagnose = (pt, cap = maxLinesPerItem, onPage = false) => {
    const charsPerLine = Math.max(1, Math.floor((availWidth * 72) / (pt * charWidthRatio)));
""")
replace_once(LAYOUT,
             r"""    }
    const heightInches = totalLines * (pt * lineHeight / 72) + items.length * interItem;
    return { fits: heightInches <= availHeight, height: heightInches, lines: totalLines };
  };
""",
             r"""    }
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
""")
replace_once(LAYOUT,
             r"""  const floorLinesPerItem = opts.floorLinesPerItem || 2;

  const fitAt = (pt, cap = maxLinesPerItem) => {
    const charsPerLine = Math.max(1, Math.floor((availWidth * 72) / (pt * charWidthRatio)));
""",
             r"""  const floorLinesPerItem = opts.floorLinesPerItem || 2;
  // A panel card passes the page it is drawn on (`panelPage`); then the size
  // search and the panel check read the drawn page, and letters count only for
  // the budget.
  const page = opts.page || null;

  const fitAt = (pt, cap = maxLinesPerItem, withHeight = true) => {
    const charsPerLine = Math.max(1, Math.floor((availWidth * 72) / (pt * charWidthRatio)));
""")
replace_once(LAYOUT,
             r"""
function longestWordLen(text) {
""",
             r"""
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
// Advances the board's table does not carry, measured in the same Chrome.
const EXTRA_BOLD_EM = { "\u2019": 0.2261, "\u2018": 0.2261, "\u00a0": 0.4761 };

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
// line may break after, followed by a space `prefixSpacePx` wide.
function wrappedLines(text, pt, widthPx, opts = {}) {
  const room = widthPx - 0.25;
  const space = boldWidthPx(" ", pt);
  let lines = 1;
  let used = opts.prefixPx || 0;
  if (used > room) return Infinity;
  breakUnits(text).forEach((unit, index) => {
    if (lines === Infinity) return;
    const width = boldWidthPx(unit.text, pt) + (index === 0 ? opts.leadPx || 0 : 0);
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
""")
replace_once(LAYOUT,
             r"""const pathHelpers = require("path");

""",
             r"""const pathHelpers = require("path");
const { textWidthEm, RENDER_SAFETY } = require("../../shared/text/comic-glyph-width");

""")

# --- working-wall-html/src/visuals.js (9 replacements) ---
replace_once(VISUALS,
             r"""  badgeInches,
  pickRainbowColour,
""",
             r"""  badgeInches,
  accentLabelPtFor,
  isStepLabel,
  pickRainbowColour,
""")
replace_once(VISUALS,
             r"""  PICTURE_GIVES_WAY,
  wideVisualReserveInches,
  pickVisual,
""",
             r"""  PICTURE_GIVES_WAY,
  PHOTO_AT_A_THIRD,
  wideVisualReserveInches,
  stackedFigureInches,
  pickVisual,
""")
replace_once(VISUALS,
             r"""  return guaranteed;
}
""",
             r"""  return guaranteed;
}

// The figure stacked under a panel as shared.js `panelWithVisualHtml` draws
// it: the sheet's width less the panel's padding, no taller than its reserve
// allows, below a 160dxa gap. The body is planned against this block, not the
// reserve, which is an allowance a wide figure often does not fill: a number
// line drawn across the sheet left the words a size smaller than their panel.
function stackedFigureInches(card, ctx, style, reserve) {
  const v = reserve > 0 && card && card.visual ? pickVisual(card.visual, ctx) : null;
  if (!v) return 0;
  const dims = printableInches(card.page.size, card.page.orientation, style);
  const widthIn = Math.max(1, dims.width - (2 * 360) / 1440) * 0.96;
  const heightIn = Math.min(widthIn / (v.aspect || 1), reserve - 0.25);
  const mmOf = (inches) => Math.round(inches * 25.4 * 100) / 100;
  return (mmOf(160 / 1440) + mmOf(heightIn)) / 25.4;
}
""")
replace_once(VISUALS,
             r"""  if (!card || !card.visual) return 0;
  const v = pickVisual(card.visual, ctx);
""",
             r"""  if (!card || !card.visual) return 0;
  // A dominant figure sits beside the panel, never beneath it, so the panel
  // keeps its full height. Reserving room under it anyway took height the page
  // never used, and the loose plan hid it until the body was planned as drawn.
  if (card.visualScale === "dominant") return 0;
  const v = pickVisual(card.visual, ctx);
""")
replace_once(VISUALS,
             r"""const PICTURE_GIVES_WAY = [0.65, 0.7];

""",
             r"""const PICTURE_GIVES_WAY = [0.65, 0.7];

// A sticky fact too long to sit beside its photo even then keeps both (his
// answer of 26 September 2026, "yys"): the photo narrows to about a third of
// the card, the widest share, and the whole sentence runs over the lines it
// needs there, three at the floor size, where two hold about 72 letters and
// three about 106. Only after that is the sentence shortened, to a whole
// sentence, by the wall designer, and the photo comes off last of all.
const PHOTO_AT_A_THIRD = { share: 0.7, floorLines: 3 };

""")
replace_once(VISUALS,
             r"""    floorLinesPerItem: floorLinesPerItem(card, panelFraction),
  };
""",
             r"""    floorLinesPerItem: floorLinesPerItem(card, panelFraction),
    page: style && card && PAGED_CARDS.has(card.type) && card.page && card.page.size === "A3"
      ? panelPage(card.page.orientation, style, panelFraction, {
        badgeInches,
        labelPt: accentLabelPtFor,
      })
      : undefined,
  };
""")
replace_once(VISUALS,
             r"""
function stackedBodyOpts(card, panelFraction) {
  return {
""",
             r"""
// The panel cards whose bodies are planned against the page they are drawn on
// (layout.js, What the page draws). The misconception pair draws two panels
// side by side and keeps its own arithmetic.
const PAGED_CARDS = new Set(["stickyKnowledge", "vocabDefinition", "workedExample", "sentenceStem"]);

function stackedBodyOpts(card, panelFraction, style) {
  return {
""")
replace_once(VISUALS,
             r"""
// ─── Visual buffer lookup ───────────────────────────────────────────────
""",
             r"""
// A worked example's label ("Worked example") beside its text.
function accentLabelPtFor(bodyPt) {
  return Math.max(28, Math.round(bodyPt * 0.7));
}

// A numbered step draws as a badge row; any other label as a labelled paragraph.
function isStepLabel(label) {
  const text = String(label || "").toLowerCase();
  return text.startsWith("step") || /^\d+\b/.test(text);
}

// ─── Visual buffer lookup ───────────────────────────────────────────────
""")
replace_once(VISUALS,
             r"""  printableInches,
  WIDE_ASPECT,
""",
             r"""  printableInches,
  panelPage,
  WIDE_ASPECT,
""")

# --- working-wall-html/src/render-panels.js (26 replacements) ---
replace_once(PANELS,
             r"""    const topMm = mm(200 / 1440);
    html += `<div style="text-align:center;padding:${topMm}mm 0 0 0;">${visualTag(v, mm(widthIn), mm(heightIn), "margin:0 auto;")}</div>`;
  }

  return html;
}
""",
             r"""    const topMm = mm(200 / 1440);
    return {
      html: `<div style="text-align:center;padding:${topMm}mm 0 0 0;">${visualTag(v, mm(widthIn), mm(heightIn), "margin:0 auto;")}</div>`,
      heightIn: (topMm + mm(heightIn)) / 25.4,
      notice: null,
    };
  }
  return none;
}
""")
replace_once(PANELS,
             r"""      if (wIn < MIN_READABLE_IN) {
        console.log(
          `[working-wall] "${card.title || card.type}": photo omitted - only ${wIn.toFixed(1)}in of room is left under the Don't/Do pair, ` +
          `below the ${MIN_READABLE_IN}in a card needs to be read from across a room. Shorten the Don't/Do text to make room for it.`
        );
        return html;
      }
""",
             r"""      if (wIn < MIN_READABLE_IN) {
        return {
          ...none,
          notice:
            `[working-wall] "${card.title || card.type}": photo omitted - only ${wIn.toFixed(1)}in of room is left under the Don't/Do pair, ` +
            `below the ${MIN_READABLE_IN}in a card needs to be read from across a room. Shorten the Don't/Do text to make room for it.`,
        };
      }
""")
replace_once(PANELS,
             r"""
  let html = titleBarEl + pairHtml;

  // A misconception card may carry a `visual` (a diagram the Don't/Do advice
  // refers to), a straight `photo`, or a card-level P2 `picture`. Any of them
  // sits centred beneath the pair, never displacing a panel - the pair is the
  // card's spine. P1 photo/diagram still wins over a P2 emoji.
  const imagePath = optionalCardImagePath(card);
""",
             r"""
  if (beneath.notice) console.log(beneath.notice);
  return titleBarEl + pairHtml + beneath.html;
}

// A misconception card may carry a `visual` (a diagram the Don't/Do advice
// refers to), a straight `photo`, or a card-level P2 `picture`. Any of them
// sits centred beneath the pair, never displacing a panel - the pair is the
// card's spine. P1 photo/diagram still wins over a P2 emoji. Returns the HTML,
// the height it takes under the pair, and the notice when a photo is omitted.
function pictureBeneathPair(card, style, specDir, ctx, dims) {
  const none = { html: "", heightIn: 0, notice: null };
  const imagePath = optionalCardImagePath(card);
""")
replace_once(PANELS,
             r"""    style,
    { widthOverride, titleAreaInches, ...stackedBodyOpts(card, panelFraction) }
  );

  const dontDoLabelPt = labelPt * 0.85;
  const wrongPanelHtml =
""",
             r"""    style,
    {
      widthOverride,
      titleAreaInches,
      ...stackedBodyOpts(card, panelFraction, style),
      page: panelPage(card.page.orientation, style, panelFraction, {
        outerIn: (dims.width - 360 / 1440) / 2,
        paddingDxa: 320,
        pair: true,
        headPt: dontDoLabelPt,
        headPadDxa: 240,
      }),
    }
  );

  const wrongPanelHtml =
""")
replace_once(PANELS,
             r"""  const widthOverride = dims.width * panelFraction - 0.6;
  // A3-only builder: use the fixed A3 value below.
  const titleAreaInches = titleBarHeightInches(titlePt);

  const fitItems = items.length > 0 ? items.map((item) => ({ ...item, text: plainCriteria(item.text) })) : [{ text: "" }];
  const bodyPt = fitLinearBodySize(
    fitItems,
    defaultBodyPt(card, style),
""",
             r"""  const widthOverride = dims.width * panelFraction - 0.6;
  // The picture under the pair is settled first, because it takes the pair's
  // height: the pair used to be planned as if it had the whole body.
  const beneath = pictureBeneathPair(card, style, specDir, ctx, dims);
  const titleAreaInches = titleBarHeightInches(titlePt) + beneath.heightIn;
  const dontDoLabelPt = labelPt * 0.85;

  // Planned as drawn (layout.js, What the page draws): each of the two cells
  // (shared.js `twoUpPanelsHtml`) holds its label line and its one sentence,
  // side by side, so the pair is as tall as the taller cell.
  const pairItems = [dontItem, doItem].map((item) => ({
    label: item ? item.label : undefined,
    text: item ? plainCriteria(item.text) : "",
  }));
  const bodyPt = fitLinearBodySize(
    pairItems,
    defaultBodyPt(card, style),
""")
replace_once(PANELS,
             r"""  // child reads, never the colour marks.
  const fitItems = [];
  for (const item of items) {
    fitItems.push({ text: plainCriteria(item.text) });
    if (item.filled) fitItems.push({ text: plainCriteria(item.filled) });
  }
  const bodyPt = fitLinearBodySize(
    fitItems.length > 0 ? fitItems : [{ text: "" }],
    defaultBodyPt(card, style),
    minBodyPt(card, style),
    card.page.size,
    card.page.orientation,
    style,
    { widthOverride, titleAreaInches, ...stackedBodyOpts(card, panelFraction) }
  );
""",
             r"""  // child reads, never the colour marks.
  const bodyPt = fitLinearBodySize(
    stemLines.length > 0 ? stemLines : [{ text: "" }],
    defaultBodyPt(card, style),
    minBodyPt(card, style),
    card.page.size,
    card.page.orientation,
    style,
    { widthOverride, titleAreaInches, ...stackedBodyOpts(card, panelFraction, style) }
  );
""")
replace_once(PANELS,
             r"""  // size its steps need in order to print a bigger diagram.
  const bodyFitsAtFloor = (reserve) =>
    linearBodyFitsAtFloor(
      items.length > 0 ? items.map((item) => ({ ...item, text: plainCriteria(item.text) })) : [{ text: "" }],
      minBodyPt(card, style),
      card.page.size,
      card.page.orientation,
      style,
      { widthOverride, titleAreaInches: titleBarHeightInches(titlePt) + reserve, ...stackedBodyOpts(card, panelFraction) }
    );
  const wideVisualReserve = wideVisualReserveInches(card, ctx, style, bodyFitsAtFloor);
  const titleAreaInches = titleBarHeightInches(titlePt) + wideVisualReserve;
  // The draw uses the number the reserve was made with; the 0.25in is the
""",
             r"""  // size its steps need in order to print a bigger diagram.
  // A figure stacked under the panel carries its caption beneath it too.
  const caption = stackedCaptionInches(card.visual ? card.visual.label || null : null, card.page.orientation, style);
  const bodyFitsAtFloor = (reserve) =>
    linearBodyFitsAtFloor(
      stemLines.length > 0 ? stemLines : [{ text: "" }],
      minBodyPt(card, style),
      card.page.size,
      card.page.orientation,
      style,
      { widthOverride, titleAreaInches: titleBarHeightInches(titlePt) + (reserve > 0 ? stackedFigureInches(card, ctx, style, reserve) + caption : 0), ...stackedBodyOpts(card, panelFraction, style) }
    );
  const wideVisualReserve = wideVisualReserveInches(card, ctx, style, bodyFitsAtFloor);
  const titleAreaInches = titleBarHeightInches(titlePt) + (wideVisualReserve > 0 ? stackedFigureInches(card, ctx, style, wideVisualReserve) + caption : 0);
  // The draw uses the number the reserve was made with; the 0.25in is the
""")
replace_once(PANELS,
             r"""      stemLines.length > 0 ? stemLines : [{ text: "" }],
      minBodyPt(card, style),
      card.page.size,
      card.page.orientation,
      style,
      { widthOverride: dims.width * fraction - 0.6, titleAreaInches: titleBarHeightInches(titlePt), ...stackedBodyOpts(card, fraction) }
    ));
""",
             r"""      stemLines.length > 0 ? stemLines : [{ text: "" }],
      minBodyPt(card, style),
      card.page.size,
      card.page.orientation,
      style,
      { widthOverride: dims.width * fraction - 0.6, titleAreaInches: titleBarHeightInches(titlePt), ...stackedBodyOpts(card, fraction, style) }
    ));
""")
replace_once(PANELS,
             r"""  const stemLines = items.flatMap((item) => (item.filled
    ? [{ text: plainCriteria(item.text) }, { text: plainCriteria(item.filled) }]
    : [{ text: plainCriteria(item.text) }]));
  const panelFraction = panelFractionThatFits(panelFractionFor(card, ctx, false), (fraction) =>
""",
             r"""  const stemLines = items.flatMap((item) => (item.filled
    ? [{ text: plainCriteria(item.text), kind: "stem" }, { text: plainCriteria(item.filled), kind: "filled" }]
    : [{ text: plainCriteria(item.text), kind: "stem" }]));
  const panelFraction = panelFractionThatFits(panelFractionFor(card, ctx, false), (fraction) =>
""")
replace_once(PANELS,
             r"""  for (const item of items) {
    const label = (item.label || "").toLowerCase();
    const isStep = label.startsWith("step") || /^\d+\b/.test(label);
    if (isStep) {
      stepIdx += 1;
""",
             r"""  for (const item of items) {
    if (isStepLabel(item.label)) {
      stepIdx += 1;
""")
replace_once(PANELS,
             r"""    style,
    { widthOverride, titleAreaInches, ...stackedBodyOpts(card, panelFraction) }
  );
  const accentLabelPt = Math.max(28, Math.round(bodyPt * 0.7));
  const fittedBadgeInches = badgeInches(bodyPt);
""",
             r"""    style,
    { widthOverride, titleAreaInches, ...stackedBodyOpts(card, panelFraction, style) }
  );
  const accentLabelPt = accentLabelPtFor(bodyPt);
  const fittedBadgeInches = badgeInches(bodyPt);
""")
replace_once(PANELS,
             r"""      style,
      { widthOverride, titleAreaInches: titleBarHeightInches(titlePt) + BADGE_COLUMN_INCHES + reserve, ...stackedBodyOpts(card, panelFraction) }
    );
  const wideVisualReserve = wideVisualReserveInches(card, ctx, style, bodyFitsAtFloor);
  const titleAreaInches = titleBarHeightInches(titlePt) + BADGE_COLUMN_INCHES + wideVisualReserve;
  // The draw uses the number the reserve was made with; the 0.25in is the
""",
             r"""      style,
      { widthOverride, titleAreaInches: titleBarHeightInches(titlePt) + (reserve > 0 ? stackedFigureInches(card, ctx, style, reserve) + caption : 0), ...stackedBodyOpts(card, panelFraction, style) }
    );
  const wideVisualReserve = wideVisualReserveInches(card, ctx, style, bodyFitsAtFloor);
  const titleAreaInches = titleBarHeightInches(titlePt) + (wideVisualReserve > 0 ? stackedFigureInches(card, ctx, style, wideVisualReserve) + caption : 0);
  // The draw uses the number the reserve was made with; the 0.25in is the
""")
replace_once(PANELS,
             r"""      style,
      { widthOverride: dims.width * fraction - 0.6, titleAreaInches: titleBarHeightInches(titlePt) + BADGE_COLUMN_INCHES, ...stackedBodyOpts(card, fraction) }
    ));
  const widthOverride = dims.width * panelFraction - 0.6;
  // A3-only builder: use the fixed A3 value below.
  // The figure is offered the generous share and handed back whatever the
  // panel cannot give up: this probe re-runs the body's own fit at its floor
  // size for a candidate reserve, so no card can be pushed under the text
  // size its steps need in order to print a bigger diagram.
  const bodyFitsAtFloor = (reserve) =>
""",
             r"""      style,
      { widthOverride: dims.width * fraction - 0.6, titleAreaInches: titleBarHeightInches(titlePt), ...stackedBodyOpts(card, fraction, style) }
    ));
  const widthOverride = dims.width * panelFraction - 0.6;
  // A3-only builder: use the fixed A3 value below.
  // The figure is offered the generous share and handed back whatever the
  // panel cannot give up: this probe re-runs the body's own fit at its floor
  // size for a candidate reserve, so no card can be pushed under the text
  // size its steps need in order to print a bigger diagram.
  // A figure stacked under the panel carries its caption beneath it too.
  const caption = stackedCaptionInches(card.visual ? defaultVisualLabel(card.visual) : null, card.page.orientation, style);
  const bodyFitsAtFloor = (reserve) =>
""")
replace_once(PANELS,
             r"""  // the words a child sees.
  const fitItems = items.map((item) => (typeof item.text === "string" ? { ...item, text: plainCriteria(item.text) } : item));
  const fillColour = style.colours.workedExamplePanelFill;
""",
             r"""  // the words a child sees.
  const fitItems = items.map((item) => ({
    ...item,
    text: typeof item.text === "string" ? plainCriteria(item.text) : item.text,
    kind: isStepLabel(item.label) ? "step" : "trailing",
  }));
  const fillColour = style.colours.workedExamplePanelFill;
""")
replace_once(PANELS,
             r"""    items,
    defaultBodyPt(card, style),
    minBodyPt(card, style),
    card.page.size,
    card.page.orientation,
    style,
    { widthOverride, titleAreaInches, ...stackedBodyOpts(card, panelFraction) }
  );
""",
             r"""    items,
    defaultBodyPt(card, style),
    minBodyPt(card, style),
    card.page.size,
    card.page.orientation,
    style,
    { widthOverride, titleAreaInches, ...stackedBodyOpts(card, panelFraction, style) }
  );
""")
replace_once(PANELS,
             r"""  const items = definition ? [{ text: plainCriteria(definition) }] : [{ text: "" }];

  const bodyFitsAtFloor = (reserve) =>
    linearBodyFitsAtFloor(
      items.length > 0 ? items : [{ text: "" }],
      minBodyPt(card, style),
      card.page.size,
      card.page.orientation,
      style,
      { widthOverride, titleAreaInches: titleBarHeightInches(titlePt) + reserve, ...stackedBodyOpts(card, panelFraction) }
    );
  const wideVisualReserve = wideVisualReserveInches(card, ctx, style, bodyFitsAtFloor);
  const titleAreaInches = titleBarHeightInches(titlePt) + wideVisualReserve;
  // The draw uses the number the reserve was made with; the 0.25in is the
""",
             r"""  const items = definition ? [{ text: plainCriteria(definition) }] : [{ text: "" }];

  // A figure stacked under the panel carries its caption beneath it too.
  const caption = stackedCaptionInches(card.visual ? defaultVisualLabel(card.visual) : null, card.page.orientation, style);
  const bodyFitsAtFloor = (reserve) =>
    linearBodyFitsAtFloor(
      items.length > 0 ? items : [{ text: "" }],
      minBodyPt(card, style),
      card.page.size,
      card.page.orientation,
      style,
      { widthOverride, titleAreaInches: titleBarHeightInches(titlePt) + (reserve > 0 ? stackedFigureInches(card, ctx, style, reserve) + caption : 0), ...stackedBodyOpts(card, panelFraction, style) }
    );
  const wideVisualReserve = wideVisualReserveInches(card, ctx, style, bodyFitsAtFloor);
  const titleAreaInches = titleBarHeightInches(titlePt) + (wideVisualReserve > 0 ? stackedFigureInches(card, ctx, style, wideVisualReserve) + caption : 0);
  // The draw uses the number the reserve was made with; the 0.25in is the
""")
replace_once(PANELS,
             r"""      [{ text: definition ? plainCriteria(definition) : "" }],
      minBodyPt(card, style),
      card.page.size,
      card.page.orientation,
      style,
      { widthOverride: dims.width * fraction - 0.6, titleAreaInches: titleBarHeightInches(titlePt), ...stackedBodyOpts(card, fraction) }
    ));
""",
             r"""      [{ text: definition ? plainCriteria(definition) : "" }],
      minBodyPt(card, style),
      card.page.size,
      card.page.orientation,
      style,
      { widthOverride: dims.width * fraction - 0.6, titleAreaInches: titleBarHeightInches(titlePt), ...stackedBodyOpts(card, fraction, style) }
    ));
""")
replace_once(PANELS,
             r"""    style,
    { widthOverride, titleAreaInches, ...stackedBodyOpts(card, panelFraction) }
  );
""",
             r"""    style,
    { widthOverride, titleAreaInches, ...bodyOpts(panelFraction) }
  );
""")
replace_once(PANELS,
             r"""      style,
      { widthOverride, titleAreaInches: titleBarHeightInches(titlePt) + reserve, ...stackedBodyOpts(card, panelFraction) }
    );
  const wideVisualReserve = wideVisualReserveInches(card, ctx, style, bodyFitsAtFloor);
  const titleAreaInches = titleBarHeightInches(titlePt) + wideVisualReserve;
  // The draw uses the number the reserve was made with; the 0.25in is the
""",
             r"""      style,
      { widthOverride, titleAreaInches: titleBarHeightInches(titlePt) + (reserve > 0 ? stackedFigureInches(card, ctx, style, reserve) + caption : 0), ...bodyOpts(panelFraction) }
    );
  const wideVisualReserve = wideVisualReserveInches(card, ctx, style, bodyFitsAtFloor);
  const titleAreaInches = titleBarHeightInches(titlePt) + (wideVisualReserve > 0 ? stackedFigureInches(card, ctx, style, wideVisualReserve) + caption : 0);
  // The draw uses the number the reserve was made with; the 0.25in is the
""")
replace_once(PANELS,
             r"""  // size its steps need in order to print a bigger diagram.
  const bodyFitsAtFloor = (reserve) =>
""",
             r"""  // size its steps need in order to print a bigger diagram.
  // A figure stacked under the panel carries its caption beneath it too.
  const caption = stackedCaptionInches(card.visual ? defaultVisualLabel(card.visual) : null, card.page.orientation, style);
  const bodyFitsAtFloor = (reserve) =>
""")
replace_once(PANELS,
             r"""      style,
      { widthOverride: dims.width * fraction - 0.6, titleAreaInches: titleBarHeightInches(titlePt), ...stackedBodyOpts(card, fraction) }
    ));
  const widthOverride = dims.width * panelFraction - 0.6;
""",
             r"""      style,
      { widthOverride: dims.width * fraction - 0.6, titleAreaInches: titleBarHeightInches(titlePt), ...bodyOpts(fraction) }
    );
  let panelFraction = panelFractionThatFits(panelFractionFor(card, ctx, pictureBeside), fitsBeside);
  if (pictureBeside && !fitsBeside(panelFraction)) {
    panelFraction = PHOTO_AT_A_THIRD.share;
    factLines = PHOTO_AT_A_THIRD.floorLines;
  }
  const widthOverride = dims.width * panelFraction - 0.6;
""")
replace_once(PANELS,
             r"""  const hasVisual = !!(card.visual || imagePath || emojiVisual);
  const panelFraction = panelFractionThatFits(panelFractionFor(card, ctx, hasVisual && !card.visual), (fraction) =>
    linearBodyFitsAtFloor(
""",
             r"""  const hasVisual = !!(card.visual || imagePath || emojiVisual);
  const pictureBeside = hasVisual && !card.visual;
  // How many lines a fact may take at the floor size: the card's usual two,
  // unless its photo has narrowed to about a third (visuals.js).
  let factLines = null;
  const bodyOpts = (fraction) => ({
    ...stackedBodyOpts(card, fraction, style),
    ...(factLines ? { floorLinesPerItem: factLines } : {}),
  });
  const fitsBeside = (fraction) =>
    linearBodyFitsAtFloor(
""")
replace_once(PANELS,
             r"""// two moves: pin the line-height in the CSS so the bar's height is decided here
// rather than by the font, then reserve exactly that.
const BADGE_COLUMN_INCHES = 0.2;

""",
             r"""// two moves: pin the line-height in the CSS so the bar's height is decided here
// rather than by the font, then reserve exactly that. A worked example's badge
// rows used to reserve a flat 0.2in more; the page model now measures each row
// at its badge's own height (layout.js, What the page draws).

""")
replace_once(PANELS,
             r"""  badgeInches,
} = require("./visuals");
""",
             r"""  badgeInches,
  accentLabelPtFor,
  isStepLabel,
  PHOTO_AT_A_THIRD,
} = require("./visuals");
""")
replace_once(PANELS,
             r"""  wideVisualReserveInches,
  pickVisual,
""",
             r"""  wideVisualReserveInches,
  stackedFigureInches,
  pickVisual,
""")
replace_once(PANELS,
             r"""  photoAspect,
} = require("./layout");
""",
             r"""  photoAspect,
  stackedCaptionInches,
  panelPage,
} = require("./layout");
""")

# --- agents/working-wall-designer.md (4 replacements) ---
replace_once(WALLD,
             r"""3. **Split it across two items** where the sentence holds two separable parts.
4. **Drop the card**, and only here. Note in `rationaleNote` what was lost and
   why the wording could not carry the meaning any shorter.
""",
             r"""3. **Split it across two items** where the sentence holds two separable parts.
4. **Take the picture off** (rule 8).
5. **Drop the card**, and only here. Note in `rationaleNote` what was lost and
   why the wording could not carry the meaning any shorter.
""")
replace_once(WALLD,
             r"""- about **62 characters** on a card carrying a photograph or a picture, because
  the picture takes 40% of the sheet;
- about **106 characters** on a card with no picture, which keeps the full width.
""",
             r"""- about **62 characters** on a card carrying a photograph or a picture, because
  the picture takes 40% of the sheet (a sticky fact about 106, its photo
  narrowed to a third);
- about **106 characters** on a card with no picture, which keeps the full width.
""")
replace_once(WALLD,
             r"""
It draws the pages and reports without writing a PDF. `WORKING_WALL_LAYOUT_OK` means the wall will build. A `Layout validation failed:` line names every overrun on the card at once and the budget each has to come inside: shorten the text, split a too-tall card's items in order over a second card when the wall has room for one, simplify the card, choose a supported larger layout or drop it, then run it again. Skipping this does not save the work, it moves it: the builder runs the same check and fails, and a wall that overruns by one character or a tenth of an inch then costs a full designer-and-builder repair round instead of one command here. Cards `[]` needs no check.

""",
             r"""
It draws the pages and reports without writing a PDF. `WORKING_WALL_LAYOUT_OK` means the wall will build. A `Layout validation failed:` line names every overrun on the card at once and the budget each has to come inside: follow the order in Write to the card's character budget, then run it again. Skipping this does not save the work, it moves it: the builder runs the same check and fails, and a wall that overruns by one character or a tenth of an inch then costs a full designer-and-builder repair round instead of one command here. Cards `[]` needs no check.

""")
replace_once(WALLD,
             r"""
   Making room is the *first* move when an item overruns, not the last: the build shrinks the picture a little, then a list goes over a second card, and the picture comes off only when nothing else fits (his walls rarely have a card without one). A one-sentence fact that goes eight characters over is not a card that failed to earn its place: it is a sentence whose card needs room. Drop the card only when the meaning genuinely cannot survive the budget; a safety line lost off the wall is a real cost to a real class, and "it was three characters too long" is not a reason a teacher would accept. When you do shorten, say so in `rationaleNote` with the lesson's original wording, so the teacher can see what changed.

""",
             r"""
   Making room is the *first* move when an item overruns, not the last: the build narrows the picture (a sticky fact's photo to a third), then a list goes over a second card, then a shorter whole sentence; the picture comes off last (his walls rarely have a card without one). A one-sentence fact that goes eight characters over is not a card that failed to earn its place: it is a sentence whose card needs room. Drop the card only when the meaning genuinely cannot survive the budget; a safety line lost off the wall is a real cost to a real class, and "it was three characters too long" is not a reason a teacher would accept. When you do shorten, say so in `rationaleNote` with the lesson's original wording, so the teacher can see what changed.

""")

# --- agents/working-wall-designer-focused-repair.md (1 replacements) ---
replace_once(WALLR,
             r"""
A panel too tall for its page is a layout fault you can repair without touching a word: put the card's items, in their order, on two cards of the same type and title, when the wall holds only one teaching card (it takes two). `check-repair-scope.py` accepts a list split that way. An item over its own character budget is different: it needs its card's room first (a list over a second card, the picture off only when nothing else fits) or, after that, a shorter whole sentence; both are the wall designer's, not this round's, so leave that finding unrepaired and say it needs the wall designer. A success-criteria step is never reworded by anyone, so for one of those say instead that its card needs room (its list over two cards, its picture off only when nothing else fits).

""",
             r"""
A panel too tall for its page is a layout fault you can repair without touching a word: put the card's items, in their order, on two cards of the same type and title, when the wall holds only one teaching card (it takes two). `check-repair-scope.py` accepts a list split that way. An item over its own character budget is different: it needs its card's room first (a list over a second card), then a shorter whole sentence, the picture off last; all are the wall designer's, not this round's, so leave that finding unrepaired and say it needs the wall designer. A success-criteria step is never reworded by anyone, so for one of those say instead that its card needs room (its list over two cards, its picture off only when nothing else fits).

""")

# --- references/working-wall-preferences.md (3 replacements) ---
replace_once(WALLP,
             r"""
The builder's autofit may shrink the body, but the readable floor is a hard release gate. If autofit reaches the floor and a warning fires, the build has failed: make room first (a list over two cards, and the picture off only when nothing else fits), then shorten faithful display text to a whole sentence (never a success-criteria step, which is copied word for word), simplify the layout, or remove the card, then rebuild and verify before delivery. Never ship an overflow warning for correction on a later run.

**5. Prose a child reads stays a whole sentence; a contract a child checks against stays word for word.** What has to stay word for word is what a child compares board against wall: success criteria steps, reference-table columns, a misconception's "Don't"/"Do" pair. A card makes room before any sentence is shortened, in the teacher's order: the build shrinks its picture a little, a list carries over to a second card, and the picture comes off only when nothing else fits, because a card with no picture or helper is rare on his walls. Free-standing prose nobody is matching word for word (a modelled sentence, a stem's framing) may then be tightened to fit the card, keeping the meaning and every protection it carries, and it stays a whole sentence, never a clipped phrase. A vocabulary definition keeps the lesson's own wording; only when it genuinely cannot fit may it be shortened, and then it stays a whole sentence a teacher would say, never a clipped phrase. A sticky-knowledge fact is the same: the lesson's own words, shortened only when they genuinely cannot fit, and then still a whole sentence a teacher would say. A safety line is prose, not a contract: "Tell a trusted adult if you're worried about yourself or someone else." (70 characters, over budget) says the same thing as "Tell a trusted adult if you're worried about anyone." (51, fits), and the shorter one is on the wall where a child can use it. Make room first, then shorten to a whole sentence, before dropping anything.

""",
             r"""
The builder's autofit may shrink the body, but the readable floor is a hard release gate. If autofit reaches the floor and a warning fires, the build has failed: make room first (the picture narrowed, a list over two cards), then shorten faithful display text to a whole sentence (never a success-criteria step, which is copied word for word), take the picture off, simplify the layout, or remove the card, then rebuild and verify before delivery. Never ship an overflow warning for correction on a later run.

**5. Prose a child reads stays a whole sentence; a contract a child checks against stays word for word.** What has to stay word for word is what a child compares board against wall: success criteria steps, reference-table columns, a misconception's "Don't"/"Do" pair. A card makes room before any sentence is shortened, in the teacher's order: the build narrows its picture (a sticky fact's photo down to about a third of the card, so the whole sentence fits beside it), a list carries over to a second card, only then is a sentence shortened, to a whole sentence, and the picture comes off last of all, because a card with no picture or helper is rare on his walls. Free-standing prose nobody is matching word for word (a modelled sentence, a stem's framing) may then be tightened to fit the card, keeping the meaning and every protection it carries, and it stays a whole sentence, never a clipped phrase. A vocabulary definition keeps the lesson's own wording; only when it genuinely cannot fit may it be shortened, and then it stays a whole sentence a teacher would say, never a clipped phrase. A sticky-knowledge fact is the same: the lesson's own words, shortened only when they genuinely cannot fit, and then still a whole sentence a teacher would say. A safety line is prose, not a contract: "Tell a trusted adult if you're worried about yourself or someone else." (70 characters, over budget) says the same thing as "Tell a trusted adult if you're worried about anyone." (51, fits), and the shorter one is on the wall where a child can use it. Make room first, then shorten to a whole sentence, before dropping anything.

""")
replace_once(WALLP,
             r"""| Worked-example modelled answer | ≤ 70 characters — full sentences with one main clause, one subordinate clause, and a strong noun. Drop adjectives the lesson used for flavour. |
| Sticky-knowledge item | ≤ 62 characters on a card carrying a picture, and about 72 characters once the build has shrunk the picture a little. A card with no picture has the full width, about 106 characters, and a text-led card may use it. |
| Sentence-stem item | ≤ 80 characters including the blank. |
""",
             r"""| Worked-example modelled answer | ≤ 70 characters — full sentences with one main clause, one subordinate clause, and a strong noun. Drop adjectives the lesson used for flavour. |
| Sticky-knowledge item | ≤ 62 characters on a card carrying a picture, and about 72 characters once the build has shrunk the picture a little; beside a photo, about 106 characters once the photo has narrowed to about a third of the card and the fact runs to three lines. A card with no picture has the full width, about 106 characters, and a text-led card may use it. |
| Sentence-stem item | ≤ 80 characters including the blank. |
""")
replace_once(WALLP,
             r"""
**4. Two lines is what fits an item on a card.** Nothing (title, step, worked example, sentence stem, reference cell) needs more than two lines at the card's smallest type, which is what each item's character budget measures; a roomy card prints the same words larger. Why: from across a classroom a child glances at the card and parses it in one read. Three lines turns the item into a paragraph and the wall stops being a wall and becomes a poster. It is what the card holds, not a quota on writing: an item that needs more room gets its card's room first (principle 5), and is never clipped to fit.

""",
             r"""
**4. Two lines is what fits an item on a card.** Nothing (title, step, worked example, sentence stem, reference cell) needs more than two lines at the card's smallest type, which is what each item's character budget measures; a roomy card prints the same words larger. The one exception is a sticky fact whose photo has narrowed to about a third of the card (principle 5): it runs to three lines rather than lose its photo or its words. Why: from across a classroom a child glances at the card and parses it in one read. Three lines turns the item into a paragraph and the wall stops being a wall and becomes a poster. It is what the card holds, not a quota on writing: an item that needs more room gets its card's room first (principle 5), and is never clipped to fit.

""")
print("the wall plans the page it draws, and a long sticky fact keeps its photo")
