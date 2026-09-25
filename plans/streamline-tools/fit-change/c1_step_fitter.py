"""Point 1 of the fit release (4.2.289): the three measuring faults in the step
fitter (`builder/src/content/steps.js`), as the long-list investigation found
them and the teacher agreed on 23 September 2026.

1. A card given exactly its lines' height at the 18pt floor is no longer
   refused by a rounding error. Only the refusal gives way; a card that fits
   above the floor keeps its size, so no list that draws today changes.
2. The sticky-line pre-check measures each step at the 18pt floor and adds
   them up, instead of every step at the 20pt target and as tall as the
   tallest.
3. The short-list rule (a list of one to three steps uses its share of four
   rows) gives way when the list needs the height: it then takes the height
   its lines need at 18pt, up to the whole panel, and no more. Because the card
   gap and badge grow with the row, it measures again at the height it is given
   until the need settles (the first check's finding 1: in a shallow band one
   pass left a one-step list about 0.01in short). The card
   geometry moves, word for word, into `cardRows` so the list can be sized
   twice; the floor-need arithmetic moves into `floorNeed` and is used by both
   the new rule and the existing taller-card rule.

    python -X utf8 plans/streamline-tools/fit-change/c1_step_fitter.py
"""
from _patch import replace_once

STEPS = "builder/src/content/steps.js"

# 1. The rounding allowance, beside the fitter's other measuring constants.
replace_once(STEPS, """const usableWidth = (widthIn) => Math.max(0.1, widthIn - FIT_PAD_W);
const usableHeight = (heightIn) => Math.max(0.1, heightIn - FIT_PAD_H);
""", """const usableWidth = (widthIn) => Math.max(0.1, widthIn - FIT_PAD_W);
const usableHeight = (heightIn) => Math.max(0.1, heightIn - FIT_PAD_H);

// How far a card given exactly the height its lines need may miss it by in the
// arithmetic and still hold them at the floor: a millionth of an inch, far
// below anything the board can show.
const FLOOR_ROUNDING = 1e-6;
""")

replace_once(STEPS, """    if (neededHeight <= usableHeight(heightIn)) return pt;
  }

  return null;
}
""", """    if (neededHeight <= usableHeight(heightIn)) return pt;
  }

  // A card given exactly the height its lines need at the floor holds them.
  // The taller card below is sized to exactly that, and taking the sum that
  // sized it apart again can come back a millionth of an inch short, which
  // refused a list with room to spare and then described a 26-character step
  // as over its 25-character line. Only a refusal gives way here: a card that
  // fits above the floor keeps the size it has always had.
  const floorLines = wrappedLineCount(text, usableWidth(widthIn), TEXT_FONT_MIN);
  if (floorLines * (TEXT_FONT_MIN / 72) * 1.28 <= usableHeight(heightIn) + FLOOR_ROUNDING) {
    return TEXT_FONT_MIN;
  }

  return null;
}
""")

# 3. The card geometry moves, word for word, into a function of the height, so
# the short-list rule can size a list twice. `floorNeed` is the arithmetic the
# taller-card rule already used, now shared.
replace_once(STEPS, """function drawSteps(pptx, slide, zone, data, ctx) {
""", """// The card geometry a list gets from its height: each row's share, the number
// badge, one card width for the related set, and the width left for the words.
// A function of the height because the short-list rule in drawSteps sizes a
// list twice when it gives way.
function cardRows(steps, zone, innerX, innerW, height) {
  const rowH   = height / steps.length;

  const badgeMargin = Math.min(BADGE_MARGIN_MAX, rowH * 0.1);
  const badgeW      = Math.min(BADGE_W, rowH - badgeMargin * 2);
  const badgeFont   = Math.max(
    BADGE_FONT_MIN,
    Math.min(BADGE_FONT_MAX, Math.floor(badgeW * 72 * 0.55))
  );

  // ONE card width for the whole related set, from the longest step.
  //
  // Every card used to take the full zone width, so three short steps sat in
  // three boxes far wider than their words and read as a mostly-empty panel.
  // The set is sized to what its longest member actually needs, capped at the
  // room available, and centred in the zone when it needs less: cards that
  // belong together stay the same width as each other, which is what makes them
  // read as one list.
  const longest = steps.reduce(
    (m, s) => Math.max(m, normaliseStep(s).text.length),
    0
  );
  const gutterW = badgeW + BADGE_GAP;
  // At the largest size we would ever use, the width the longest step wants on
  // a single line, plus the badge column and padding.
  const wantedW = longest * (TEXT_FONT_MAX * 0.52 / 72) + gutterW;
  const cardW = Math.min(innerW, Math.max(innerW * 0.5, wantedW));
  const cardX = innerX + (innerW - cardW) / 2;

  // Each step at the largest size that genuinely fits ITS card.
  //
  // Related cards should still read as one set. Start from the largest size
  // every sibling can hold, but do not force exact equality when a step's own
  // larger fit changes its wrapping and still fits cleanly. That keeps siblings
  // consistent where a larger size would add no useful layout difference while
  // still allowing the wrapping-aware larger fit the content genuinely earns.
  const stepTextW = cardW - gutterW - 2 * (zone.itemCards ? (zone.compactCards ? CARD_COMPACT : CARD).pad : 0);
  const rowGapForFit = zone.itemCards
    ? Math.min((zone.compactCards ? CARD_COMPACT : CARD).itemGap, rowH * 0.18)
    : 0;

  return { rowH, badgeW, badgeFont, cardW, cardX, stepTextW, rowGapForFit };
}

// The height a step or a sticky line needs at the readable floor, its card's
// gap included: the least room it can be given without being refused.
function floorNeed(text, rows) {
  return wrappedLineCount(text, usableWidth(Math.max(0.3, rows.stepTextW)), TEXT_FONT_MIN)
    * (TEXT_FONT_MIN / 72) * 1.28 + FIT_PAD_H + rows.rowGapForFit;
}

function drawSteps(pptx, slide, zone, data, ctx) {
""")

replace_once(STEPS, """  // spare room stays empty below. Only criteria panels do this; a steps list
  // that is the slide's main content still fills its zone.
  const CRITERIA_PANEL_ROWS = 4;
  if (zone.criteriaPanel && steps.length < CRITERIA_PANEL_ROWS) {
    innerH = innerH * steps.length / CRITERIA_PANEL_ROWS;
  }

  const rowH   = innerH / steps.length;

  const badgeMargin = Math.min(BADGE_MARGIN_MAX, rowH * 0.1);
  const badgeW      = Math.min(BADGE_W, rowH - badgeMargin * 2);
  const badgeFont   = Math.max(
    BADGE_FONT_MIN,
    Math.min(BADGE_FONT_MAX, Math.floor(badgeW * 72 * 0.55))
  );

  // ONE card width for the whole related set, from the longest step.
  //
  // Every card used to take the full zone width, so three short steps sat in
  // three boxes far wider than their words and read as a mostly-empty panel.
  // The set is sized to what its longest member actually needs, capped at the
  // room available, and centred in the zone when it needs less: cards that
  // belong together stay the same width as each other, which is what makes them
  // read as one list.
  const textOf = (s) => normaliseStep(s).text;
  const longest = steps.reduce(
    (m, s) => Math.max(m, textOf(s).length),
    0
  );
  const gutterW = badgeW + BADGE_GAP;
  // At the largest size we would ever use, the width the longest step wants on
  // a single line, plus the badge column and padding.
  const wantedW = longest * (TEXT_FONT_MAX * 0.52 / 72) + gutterW;
  const cardW = Math.min(innerW, Math.max(innerW * 0.5, wantedW));
  const cardX = innerX + (innerW - cardW) / 2;

  // Each step at the largest size that genuinely fits ITS card.
  //
  // Related cards should still read as one set. Start from the largest size
  // every sibling can hold, but do not force exact equality when a step's own
  // larger fit changes its wrapping and still fits cleanly. That keeps siblings
  // consistent where a larger size would add no useful layout difference while
  // still allowing the wrapping-aware larger fit the content genuinely earns.
  const stepTextW = cardW - gutterW - 2 * (zone.itemCards ? (zone.compactCards ? CARD_COMPACT : CARD).pad : 0);
  const rowGapForFit = zone.itemCards
    ? Math.min((zone.compactCards ? CARD_COMPACT : CARD).itemGap, rowH * 0.18)
    : 0;
""", """  // spare room stays empty below. Only criteria panels do this; a steps list
  // that is the slide's main content still fills its zone.
  //
  // The rule gives way when the list needs the height. A short list that its
  // share of four rows cannot hold at the 18pt floor takes the height its lines
  // need there, and no more, up to the whole panel: a single long criterion
  // (the saved RE step, 76 characters) was refused with three quarters of the
  // panel empty below it. The gap between cards and the number badge grow with
  // the row, so in a shallow band a list given what it needed at its small share
  // needs a little more at the new height: it is measured again at the height it
  // is given until the need settles, which takes a few passes because both stop
  // growing (a one-step `Round to the nearer ten.` in the bottom 40% band was
  // refused about 0.01in short after one). The rounding allowance on top keeps
  // the checks below, which add the same heights up in a different order, from
  // refusing it by a hair.
  const CRITERIA_PANEL_ROWS = 4;
  const textOf = (s) => normaliseStep(s).text;
  const panelH = innerH;
  if (zone.criteriaPanel && steps.length < CRITERIA_PANEL_ROWS) {
    innerH = innerH * steps.length / CRITERIA_PANEL_ROWS;
    for (let pass = 0; pass < 8 && innerH < panelH; pass += 1) {
      const shortRows = cardRows(steps, zone, innerX, innerW, innerH);
      const floorTotal = steps.reduce((total, s) => total + floorNeed(textOf(s), shortRows), 0);
      if (floorTotal <= innerH + 1e-9) break;
      innerH = Math.min(panelH, floorTotal + FLOOR_ROUNDING);
    }
  }

  const rows = cardRows(steps, zone, innerX, innerW, innerH);
  const { rowH, badgeW, badgeFont, cardW, cardX, stepTextW, rowGapForFit } = rows;
""")

# The floor need each criterion has, defined once beside the reference's, so
# the sticky-line pre-check and the taller-card rule read the same numbers.
replace_once(STEPS, """          * (TEXT_FONT_MIN / 72) * 1.28 + FIT_PAD_H
      : 0
  );

  // Equal rows stay exactly equal whenever equal rows work, so every panel that
""", """          * (TEXT_FONT_MIN / 72) * 1.28 + FIT_PAD_H
      : 0
  );

  // What each criterion needs at the readable floor, its gap included. A
  // criterion that wraps takes a taller card below when the panel has the
  // room, so these, added up, are what the criteria need together.
  const stepFloorNeed = steps.map((s) => (isReferenceStep(s) ? 0 : floorNeed(textOf(s), rows)));

  // Equal rows stay exactly equal whenever equal rows work, so every panel that
""")

# 2. The sticky-line pre-check, measured at the floor, step by step.
replace_once(STEPS, """    // The criteria hold matching heights, so what they need together is the
    // tallest one's need times their count, not the sum of their separate
    // needs. Summing understates it: five criteria of which three wrap to two
    // lines want five two-line rows, and handing them the sum divides it back
    // into an average that leaves every wrapping one short by exactly the room
    // the one-line ones were not using.
    const stepCountForNeed = steps.filter((s) => !isReferenceStep(s)).length;
    const tallestStepNeed = steps.reduce(
      (tallest, s, i) => (isReferenceStep(s) ? tallest : Math.max(tallest, textNeed[i])),
      0
    );
    const stepNeedTotal = stepCountForNeed * (tallestStepNeed + rowGapForFit);
""", """    // What the criteria need together, at the least, is each one's own height
    // at the readable floor, added up, because a criterion that wraps takes a
    // taller card below when the panel has the room. Measuring every one at
    // the 20pt target, and as tall as the tallest, overstated it and refused
    // panels with a sticky line that had room for everything at 18 or 19pt
    // (the saved rounding and partition lists).
    const stepCountForNeed = steps.filter((s) => !isReferenceStep(s)).length;
    const stepNeedTotal = stepFloorNeed.reduce((total, need) => total + need, 0);
""")

replace_once(STEPS, """  // steps genuinely need more height together than it has.
  const stepFloorNeed = steps.map((s) =>
    isReferenceStep(s)
      ? 0
      : wrappedLineCount(textOf(s), usableWidth(Math.max(0.3, stepTextW)), TEXT_FONT_MIN)
          * (TEXT_FONT_MIN / 72) * 1.28 + FIT_PAD_H + rowGapForFit
  );
  const stepIndexes""", """  // steps genuinely need more height together than it has.
  const stepIndexes""")

print("c1: step fitter mended")
