"""Release 7A (4.2.293), step 8f (the lead's answer on the other card types, 26
September 2026: only the diagram section, the one that overflows, plus a
standing guard).

A Chrome audit of all sixteen wall card types, on the engine's fixtures and
every saved wall, found text outside its box on one card once the panel cards
were planned as drawn: a diagram section's heading, "Count backwards in ones.",
2.3px past its strip. A heading line is 1.15 times its type, tighter than the
font's own line box (about 1.4 times), so the words of its first and last lines
reach past their line; the strip's flat 0.06in padding did not cover that at
44pt. The strip's padding now takes at least the overhang, and the heading is
measured as the page draws it (whole words of Comic Sans MS Bold across the
strip's own width), so the part plans the strip's real height: its lines, its
padding and the gap under it (it had planned one line and 0.14in). The other
ten card types keep their own fitters, as audited, so no title size moves.

The figure test that compares a part's drawing with and without words allows
the exact 40% to a hundredth of a millimetre, which is what the HTML writes."""
from _patch import replace_once

SECTION = "working-wall-html/src/render-section.js"
SECTION_TEST = "working-wall-html/test/section-gives-the-figure-the-room.test.js"

# --- working-wall-html/src/render-section.js (9 replacements) ---
replace_once(SECTION,
             r"""    const inner =
      headingHtml(part, theme, innerWidth) +
      `<div style="flex:1;display:flex;flex-direction:column;justify-content:center;">` +
""",
             r"""    const inner =
      headingHtml(part, theme, heading) +
      `<div style="flex:1;display:flex;flex-direction:column;justify-content:center;">` +
""")
replace_once(SECTION,
             r"""
  const partHtmls = measured.map(({ part, figure, items, available, textCeiling, resultExtra }, index) => {
    const theme = PART_THEMES[index % PART_THEMES.length];
""",
             r"""
  const partHtmls = measured.map(({ part, figure, items, heading, available, textCeiling, resultExtra }, index) => {
    const theme = PART_THEMES[index % PART_THEMES.length];
""")
replace_once(SECTION,
             r"""      : 0;
    return { part, figure, items, available, textCeiling, notePt, resultExtra };
  });
""",
             r"""      : 0;
    return { part, figure, items, heading, available, textCeiling, notePt, resultExtra };
  });
""")
replace_once(SECTION,
             r"""    const items = textItemsFor(part);
    const headingIn = fitHeadingPt(part.heading, innerWidth) * 1.15 / 72 + 0.14;
    const available = rowHeight - 2 * PART_PAD_IN - headingIn;
    // The figure is the part. Words get a capped share and the drawing keeps
""",
             r"""    const items = textItemsFor(part);
    const heading = headingFor(part.heading, stripWidthPx);
    const available = rowHeight - 2 * PART_PAD_IN - heading.heightIn;
    // The figure is the part. Words get a capped share and the drawing keeps
""")
replace_once(SECTION,
             r"""  const innerWidth = colWidth - 2 * PART_PAD_IN;

""",
             r"""  const innerWidth = colWidth - 2 * PART_PAD_IN;
  // The heading strip's own width for its words: the part less its padding and
  // border, less the strip's side padding, as the HTML writes them.
  const stripWidthPx = ((mm(colWidth) - 2 * mm(PART_PAD_IN) - 2 * mm(0.02) - 2 * mm(HEADING_SIDE_IN)) * 96) / 25.4;

""")
replace_once(SECTION,
             r"""// column rather than wrapping into three lines and eating the figure's room.
function fitHeadingPt(text, widthIn) {
  let pt = HEADING_PT;
  while (pt > HEADING_MIN_PT) {
    const lines = Math.ceil((text.length * pt * 0.55) / 72 / Math.max(0.5, widthIn - 0.2));
    if (lines <= 2) return pt;
    pt -= 2;
  }
  return HEADING_MIN_PT;
}
""",
             r"""// column rather than wrapping into three lines and eating the figure's room.
// It is measured as the page draws it: whole words of Comic Sans MS Bold across
// the strip's own width (layout.js, What the page draws).
//
// A heading line is 1.15 times its type, tighter than the font's own line box
// (its ascender and descender, about 1.4 times), so the words of the first and
// last lines reach past their line by the difference. The strip's padding takes
// at least that much: at a flat 0.06in a saved heading, "Count backwards in
// ones.", printed 2.3px past its strip (release 7A's audit, 26 September 2026).
// Returns the size, the lines, the padding and the height the strip and the gap
// under it take from the part.
function headingFor(text, stripWidthPx) {
  let pt = HEADING_PT;
  let lines = wrappedLines(text, pt, stripWidthPx);
  while (pt > HEADING_MIN_PT && lines > 2) {
    pt -= 2;
    lines = wrappedLines(text, pt, stripWidthPx);
  }
  const drawnLines = Number.isFinite(lines) ? lines : 2;
  const px = pt * (96 / 72);
  const overhangPx = Math.max(0, (lineBoxPx(pt) - px * HEADING_LINE) / 2);
  const padIn = Math.max(HEADING_PAD_IN, (overhangPx + 0.5) / 96);
  const heightIn = (2 * mm(padIn) + mm(HEADING_GAP_IN)) / 25.4 + (drawnLines * px * HEADING_LINE) / 96;
  return { pt, lines: drawnLines, padIn, heightIn };
}
""")
replace_once(SECTION,
             r"""
function headingHtml(part, theme, widthIn) {
  const pt = fitHeadingPt(part.heading || "", widthIn);
  return (
    `<div data-part="heading" style="box-sizing:border-box;width:100%;background:${hash(theme.strip)};` +
    `padding:${mm(0.06)}mm ${mm(0.08)}mm;margin-bottom:${mm(0.08)}mm;">` +
    `<div style="text-align:center;font-family:'${"Comic Sans MS"}', ${FONT_STACK_FALLBACK};` +
    `font-weight:bold;font-size:${pt}pt;line-height:1.15;color:#FFFFFF;">${esc(part.heading || "")}</div></div>`
  );
""",
             r"""
function headingHtml(part, theme, heading) {
  return (
    `<div data-part="heading" style="box-sizing:border-box;width:100%;background:${hash(theme.strip)};` +
    `padding:${mm(heading.padIn)}mm ${mm(HEADING_SIDE_IN)}mm;margin-bottom:${mm(HEADING_GAP_IN)}mm;">` +
    `<div style="text-align:center;font-family:'${"Comic Sans MS"}', ${FONT_STACK_FALLBACK};` +
    `font-weight:bold;font-size:${heading.pt}pt;line-height:${HEADING_LINE};color:#FFFFFF;">${esc(part.heading || "")}</div></div>`
  );
""")
replace_once(SECTION,
             r"""const HEADING_MIN_PT = 36;
// The ceiling the note fitter starts from, not the size notes come out at. It
""",
             r"""const HEADING_MIN_PT = 36;
// The heading strip as headingHtml draws it: its padding above and below the
// words, at its sides, the gap under it, and its line height.
const HEADING_PAD_IN = 0.06;
const HEADING_SIDE_IN = 0.08;
const HEADING_GAP_IN = 0.08;
const HEADING_LINE = 1.15;
// The ceiling the note fitter starts from, not the size notes come out at. It
""")
replace_once(SECTION,
             r"""  fitLinearBodySize,
} = require("./layout");
""",
             r"""  fitLinearBodySize,
  lineBoxPx,
  wrappedLines,
} = require("./layout");
""")

# --- working-wall-html/test/section-gives-the-figure-the-room.test.js (1 replacements) ---
replace_once(SECTION_TEST,
             r"""  const [wordyFigure] = figureHeightsMm(wordy);
  assert.ok(
    wordyFigure >= bareFigure * 0.4,
    `a note and a result cut the drawing from ${bareFigure.toFixed(0)}mm to ${wordyFigure.toFixed(0)}mm, ` +
""",
             r"""  const [wordyFigure] = figureHeightsMm(wordy);
  // Exactly 40% is allowed; the HTML writes millimetres to a hundredth, so the
  // two heights are compared to that.
  assert.ok(
    wordyFigure >= bareFigure * 0.4 - 0.01,
    `a note and a result cut the drawing from ${bareFigure.toFixed(0)}mm to ${wordyFigure.toFixed(0)}mm, ` +
""")
print("the diagram section's heading stays inside its strip")
