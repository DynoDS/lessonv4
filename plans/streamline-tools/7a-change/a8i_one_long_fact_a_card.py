"""Release 7A (4.2.293), step 8i (his answer on how many long facts one wall
card holds, the last item for 7A): one three-line fact a card.

His words: told that keeping a long sticky fact whole beside its photo makes it
run to three lines, where the wall's rule said two lines per item ("or the wall
stops being a wall and becomes a poster"), and that as built one card could hold
three long facts at three lines each, and asked whether a long fact may run to
three lines but a card holds only one of them, any other going on a second card,
he answered "yes".

The fitter counts, at the floor size, the items that take the third line on a
card beside a photo narrowed to a third; more than one, and the card is refused,
naming each and the move: the second long fact, and any after it, in order on a
second card of the same type and title, which keeps every word and is a layout
change a focused repair may make. Written in rule 8, the wall preferences'
principle 4 beside the poster sentence, the focused repair, and the build's
message; the wall designer stays under its cap (its budget line and layout-check
pointer say the same in fewer words). No saved wall is newly refused. Tested in
`nothing-prints-past-a-panel-edge.test.js` (from `7a-change/new/`, copied by
a8et): a card of three 106-letter facts is sent to a second card, each of them
alone builds, and a card of one long fact and two short ones builds, its photo
and every sentence kept and nothing past its panel."""
from _patch import WALLD, WALLP, WALLR, replace_once

LAYOUT = "working-wall-html/src/layout.js"
VISUALS = "working-wall-html/src/visuals.js"
PANELS = "working-wall-html/src/render-panels.js"

# --- working-wall-html/src/layout.js (4 replacements) ---
replace_once(LAYOUT,
             r"""  }
  if (content.fits && !drawnAt(minPt).fits) {
    console.warn(`[autofit] linear body at floor ${minPt}pt does not fit ${size} ${orientation}: ${diagnose(minPt, maxLinesPerItem, !!page)}`);
""",
             r"""  }
  if (content.fits && !tooManyLong && !drawnAt(minPt).fits) {
    console.warn(`[autofit] linear body at floor ${minPt}pt does not fit ${size} ${orientation}: ${diagnose(minPt, maxLinesPerItem, !!page)}`);
""")
replace_once(LAYOUT,
             r"""  const content = fitAt(minPt, floorLinesPerItem, !page);
  if (!content.fits) {
    console.warn(`[autofit] linear body at floor ${minPt}pt does not fit ${size} ${orientation}: ${diagnose(minPt, floorLinesPerItem)}`);
""",
             r"""  const content = fitAt(minPt, floorLinesPerItem, !page);
  const tooManyLong = longAtFloor().length > longItemsAtFloor;
  if (!content.fits || tooManyLong) {
    console.warn(`[autofit] linear body at floor ${minPt}pt does not fit ${size} ${orientation}: ${diagnose(minPt, floorLinesPerItem)}`);
""")
replace_once(LAYOUT,
             r"""    }
    const remedies = [];
    if (panelOver) {
""",
             r"""    }
    const long = onPage ? [] : longAtFloor();
    const tooManyLong = long.length > longItemsAtFloor;
    if (tooManyLong) {
      problems.push(`items ${long.map((index) => index + 1).join(" and ")} each need ${floorLinesPerItem} lines at ${pt}pt beside the photo, and a card holds only ${longItemsAtFloor === 1 ? "one fact" : `${longItemsAtFloor} facts`} that long.`);
    }
    const remedies = [];
    if (tooManyLong) {
      remedies.push("Put the second long fact, and any after it, in order on a second card of the same type and title: that keeps every word and is a layout change a focused repair may make (the teacher's rule, one three-line fact a card)");
    }
    if (panelOver) {
""")
replace_once(LAYOUT,
             r"""  const floorLinesPerItem = opts.floorLinesPerItem || 2;
  // A panel card passes the page it is drawn on (`panelPage`); then the size
""",
             r"""  const floorLinesPerItem = opts.floorLinesPerItem || 2;
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
""")

# --- working-wall-html/src/visuals.js (1 replacements) ---
replace_once(VISUALS,
             r"""// three about 106. Only after that is the sentence shortened, to a whole
// sentence, by the wall designer, and the photo comes off last of all.
const PHOTO_AT_A_THIRD = { share: 0.7, floorLines: 3 };

""",
             r"""// three about 106. Only after that is the sentence shortened, to a whole
// sentence, by the wall designer, and the photo comes off last of all. A card
// holds one fact on three lines (his answer to the third check, "yes"); a
// second goes on a second card.
const PHOTO_AT_A_THIRD = { share: 0.7, floorLines: 3, factsOnThreeLines: 1 };

""")

# --- working-wall-html/src/render-panels.js (1 replacements) ---
replace_once(PANELS,
             r"""    ...stackedBodyOpts(card, fraction, style),
    ...(factLines ? { floorLinesPerItem: factLines } : {}),
  });
""",
             r"""    ...stackedBodyOpts(card, fraction, style),
    ...(factLines ? { floorLinesPerItem: factLines, longItemsAtFloor: PHOTO_AT_A_THIRD.factsOnThreeLines } : {}),
  });
""")

# --- agents/working-wall-designer.md (3 replacements) ---
replace_once(WALLD,
             r"""- about **62 characters** on a card carrying a photograph or a picture, because
  the picture takes 40% of the sheet (a sticky fact about 106, its photo
  narrowed to a third);
- about **106 characters** on a card with no picture, which keeps the full width.
""",
             r"""- about **62 characters** on a card carrying a photograph or a picture, because
  the picture takes 40% of the sheet (a sticky fact about 106, its photo at a
  third);
- about **106 characters** on a card with no picture, which keeps the full width.
""")
replace_once(WALLD,
             r"""
It draws the pages and reports without writing a PDF. `WORKING_WALL_LAYOUT_OK` means the wall will build. A `Layout validation failed:` line names every overrun on the card at once and the budget each has to come inside: follow the order in Write to the card's character budget, then run it again. Skipping this does not save the work, it moves it: the builder runs the same check and fails, and a wall that overruns by one character or a tenth of an inch then costs a full designer-and-builder repair round instead of one command here. Cards `[]` needs no check.

""",
             r"""
It draws the pages and reports without writing a PDF. `WORKING_WALL_LAYOUT_OK` means the wall will build. A `Layout validation failed:` line names every overrun on the card at once and the budget each has to come inside: follow Write to the card's character budget, then run it again. Skipping this does not save the work, it moves it: the builder runs the same check and fails, and a wall that overruns by one character or a tenth of an inch then costs a full designer-and-builder repair round instead of one command here. Cards `[]` needs no check.

""")
replace_once(WALLD,
             r"""
   Making room is the *first* move when an item overruns, not the last: the build narrows the picture (a sticky fact's photo to a third), then a list goes over a second card, then a shorter whole sentence; the picture comes off last (his walls rarely have a card without one). A one-sentence fact that goes eight characters over is not a card that failed to earn its place: it is a sentence whose card needs room. Drop the card only when the meaning genuinely cannot survive the budget; a safety line lost off the wall is a real cost to a real class, and "it was three characters too long" is not a reason a teacher would accept. When you do shorten, say so in `rationaleNote` with the lesson's original wording, so the teacher can see what changed.

""",
             r"""
   Making room is the *first* move when an item overruns, not the last: the build narrows the picture (a sticky fact's photo to a third; one such fact a card), then a list goes over a second card, then a shorter whole sentence; the picture comes off last (his walls rarely have a card without one). A one-sentence fact that goes eight characters over is not a card that failed to earn its place: it is a sentence whose card needs room. Drop the card only when the meaning genuinely cannot survive the budget; a safety line lost off the wall is a real cost to a real class, and "it was three characters too long" is not a reason a teacher would accept. When you do shorten, say so in `rationaleNote` with the lesson's original wording, so the teacher can see what changed.

""")

# --- agents/working-wall-designer-focused-repair.md (1 replacements) ---
replace_once(WALLR,
             r"""
A panel too tall for its page is a layout fault you can repair without touching a word: put the card's items, in their order, on two cards of the same type and title, when the wall holds only one teaching card (it takes two). `check-repair-scope.py` accepts a list split that way. An item over its own character budget is different: it needs its card's room first (a list over a second card), then a shorter whole sentence, the picture off last; all are the wall designer's, not this round's, so leave that finding unrepaired and say it needs the wall designer. A success-criteria step is never reworded by anyone, so for one of those say instead that its card needs room (its list over two cards, its picture off only when nothing else fits).

""",
             r"""
A panel too tall for its page, or a second three-line sticky fact, is a layout fault you can repair without touching a word: put the card's items, in their order, on two cards of the same type and title, when the wall holds only one teaching card (it takes two). `check-repair-scope.py` accepts a list split that way. An item over its own character budget is different: it needs its card's room first (a list over a second card), then a shorter whole sentence, the picture off last; all are the wall designer's, not this round's, so leave that finding unrepaired and say it needs the wall designer. A success-criteria step is never reworded by anyone, so for one of those say instead that its card needs room (its list over two cards, its picture off only when nothing else fits).

""")

# --- references/working-wall-preferences.md (1 replacements) ---
replace_once(WALLP,
             r"""
**4. Two lines is what fits an item on a card.** Nothing (title, step, worked example, sentence stem, reference cell) needs more than two lines at the card's smallest type, which is what each item's character budget measures; a roomy card prints the same words larger. The one exception is a sticky fact whose photo has narrowed to about a third of the card (principle 5): it runs to three lines rather than lose its photo or its words. Why: from across a classroom a child glances at the card and parses it in one read. Three lines turns the item into a paragraph and the wall stops being a wall and becomes a poster. It is what the card holds, not a quota on writing: an item that needs more room gets its card's room first (principle 5), and is never clipped to fit.

""",
             r"""
**4. Two lines is what fits an item on a card.** Nothing (title, step, worked example, sentence stem, reference cell) needs more than two lines at the card's smallest type, which is what each item's character budget measures; a roomy card prints the same words larger. The one exception is a sticky fact whose photo has narrowed to about a third of the card (principle 5): it runs to three lines rather than lose its photo or its words. Why: from across a classroom a child glances at the card and parses it in one read. Three lines turns the item into a paragraph and the wall stops being a wall and becomes a poster, so a card holds at most one sticky fact on three lines: a second goes, in order, on a second card of the same type and title. It is what the card holds, not a quota on writing: an item that needs more room gets its card's room first (principle 5), and is never clipped to fit.

""")
print("one three-line fact a card")
