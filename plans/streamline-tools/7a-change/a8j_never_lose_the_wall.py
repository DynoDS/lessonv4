"""Release 7A (4.2.293), step 8j (the fourth check): his one-long-fact rule
never loses a wall.

His rule stays the wall designer's instruction: a card beside a photo holds one
fact on three lines, and the next goes, in order, on a second card of the same
type and title where the wall has room. But its refusal could lose a wall: with
three long facts the named move left two on the second card, refused again, and
a wall takes at most two teaching cards; with one repair round, a wall that
reached the build that way was excluded (his standing rule: repair first, and a
finished piece every time).

So the build never refuses a card for the count. A sticky card that still holds
more than one long fact beside its photo at build time, and fits once its photo
is off, is built by the last move of his order for that card alone: the photo
off, every sentence kept whole on the full width, and a note naming the move
that would keep the photo. Of his last moves, this is the one the build can
take: a shorter whole sentence is the wall designer's to write, and the build
never writes words. The refusal stays only where even that cannot hold the words
(a fact over the full width's 106 letters), and its message now says the next
fact goes to a second card where the wall has room and a fact that still cannot
fit gets the designer's shorter sentence. The wall preferences say so beside the
poster sentence.

The focused repair's split failed its own scope check whenever it left a card a
single item (a list of one is no order, so the split order could not rejoin):
`check-repair-scope.py` now keeps each single-value list as a piece that may end
a split, in walk order, so a split in order rejoins and a reordered or dropped
item is still caught. Tested in `test_repair_scope.py` (a split leaving a card
one step, two long facts one to a card, a single item out of order still caught)
and through the route itself in `test_a_split_wall_arrives.py` (from
`7a-change/new/`, copied by a8jt): run-fixed-resource.py refuses a card too tall
for its page, the split leaving the second card one fact passes the scope check,
and the rebuild delivers the wall. The edge test (copied by a8et) builds two and
three long facts on one photo card: built, the photo off, every sentence whole,
the note naming the move, and never two three-line facts beside one photo."""
from _patch import WALLP, replace_once

PANELS = "working-wall-html/src/render-panels.js"
LAYOUT = "working-wall-html/src/layout.js"
SCOPE = "scripts/check-repair-scope.py"
SCOPE_TEST = "scripts/tests/test_repair_scope.py"

# --- working-wall-html/src/render-panels.js (5 replacements) ---
replace_once(PANELS,
             r"""  const panelChildrenHtml = shown.map((item) => bodyLineHtml(item.text, bodyPt, style)).join("");

  if (card.visual) {
    const v = pickVisual(card.visual, ctx);
    const visualLabel = defaultVisualLabel(card.visual);
    return (
      titleBarEl +
      panelWithVisualHtml(panelChildrenHtml, v, visualLabel, fillColour, borderColour, style, card.page.size, card.page.orientation, { panelFraction, aspect: v ? v.aspect : 1, maxVisualHeightIn, bodyHeightIn: printableInches(card.page.size, card.page.orientation, style).height - titleBarHeightInches(titlePt) })
    );
  }

  if (emojiVisual) {
    return (
      titleBarEl +
      panelWithVisualHtml(
        panelChildrenHtml,
        emojiVisual,
        null,
        fillColour,
        borderColour,
        style,
        card.page.size,
        card.page.orientation,
        { panelFraction, aspect: emojiVisual.aspect }
      )
    );
  }

  if (imagePath) {
    const photoBuf = tryReadPhoto(specDir, imagePath);
""",
             r"""  const panelChildrenHtml = shown.map((item) => bodyLineHtml(item.text, bodyPt, style)).join("");

  if (card.visual) {
    const v = pickVisual(card.visual, ctx);
    const visualLabel = defaultVisualLabel(card.visual);
    return (
      titleBarEl +
      panelWithVisualHtml(panelChildrenHtml, v, visualLabel, fillColour, borderColour, style, card.page.size, card.page.orientation, { panelFraction, aspect: v ? v.aspect : 1, maxVisualHeightIn, bodyHeightIn: printableInches(card.page.size, card.page.orientation, style).height - titleBarHeightInches(titlePt) })
    );
  }

  if (emojiVisual && !photoOff) {
    return (
      titleBarEl +
      panelWithVisualHtml(
        panelChildrenHtml,
        emojiVisual,
        null,
        fillColour,
        borderColour,
        style,
        card.page.size,
        card.page.orientation,
        { panelFraction, aspect: emojiVisual.aspect }
      )
    );
  }

  if (imagePath && !photoOff) {
    const photoBuf = tryReadPhoto(specDir, imagePath);
""")
replace_once(PANELS,
             r"""    factLines = PHOTO_AT_A_THIRD.floorLines;
  }
""",
             r"""    factLines = PHOTO_AT_A_THIRD.floorLines;
    // His rule allows one fact on three lines beside the photo, and the next
    // goes on a second card: the wall designer's move, where the wall has room.
    // A card that still holds more than one here is never lost for it. The
    // build cannot write a shorter sentence, so it takes his order's last move
    // for this card alone, the photo off, every sentence kept whole on the full
    // width, and says so (the fourth check, 26 September 2026).
    const onlyTheCount = !fitsBeside(panelFraction) && fitsAt(panelFraction, { floorLinesPerItem: factLines });
    if (onlyTheCount && fitsAt(1, {})) {
      photoOff = true;
      panelFraction = 1;
      factLines = null;
      console.log(
        `[working-wall] ${cardLabel(card)}: more than one fact needs three lines beside the photo, and a card holds ` +
          "one fact that long, so this card is built with its photo off and every sentence whole. To keep the photo, " +
          "the wall designer moves the next long fact to a second card where the wall has room, or gives it a shorter " +
          "whole sentence."
      );
    }
  }
""")
replace_once(PANELS,
             r"""      style,
      { widthOverride: dims.width * fraction - 0.6, titleAreaInches: titleBarHeightInches(titlePt), ...bodyOpts(fraction) }
    );
  let panelFraction = panelFractionThatFits(panelFractionFor(card, ctx, pictureBeside), fitsBeside);
  if (pictureBeside && !fitsBeside(panelFraction)) {
""",
             r"""      style,
      { widthOverride: dims.width * fraction - 0.6, titleAreaInches: titleBarHeightInches(titlePt), ...stackedBodyOpts(card, fraction, style), ...extra }
    );
  const fitsBeside = (fraction) => fitsAt(fraction, bodyOpts(fraction));
  let panelFraction = panelFractionThatFits(panelFractionFor(card, ctx, pictureBeside), fitsBeside);
  let photoOff = false;
  if (pictureBeside && !fitsBeside(panelFraction)) {
""")
replace_once(PANELS,
             r"""  });
  const fitsBeside = (fraction) =>
    linearBodyFitsAtFloor(
""",
             r"""  });
  const fitsAt = (fraction, extra) =>
    linearBodyFitsAtFloor(
""")
replace_once(PANELS,
             r"""  defaultVisualLabel,
  stackedBodyOpts,
""",
             r"""  defaultVisualLabel,
  cardLabel,
  stackedBodyOpts,
""")

# --- working-wall-html/src/layout.js (1 replacements) ---
replace_once(LAYOUT,
             r"""    if (tooManyLong) {
      remedies.push("Put the second long fact, and any after it, in order on a second card of the same type and title: that keeps every word and is a layout change a focused repair may make (the teacher's rule, one three-line fact a card)");
    }
""",
             r"""    if (tooManyLong) {
      remedies.push("a card holds one fact that long beside its photo (the teacher's rule): the next long fact goes, in order, on a second card of the same type and title where the wall has room, which keeps every word and is a layout change a focused repair may make; a fact that still cannot fit gets a shorter whole sentence from the wall designer");
    }
""")

# --- references/working-wall-preferences.md (1 replacements) ---
replace_once(WALLP,
             r"""
**4. Two lines is what fits an item on a card.** Nothing (title, step, worked example, sentence stem, reference cell) needs more than two lines at the card's smallest type, which is what each item's character budget measures; a roomy card prints the same words larger. The one exception is a sticky fact whose photo has narrowed to about a third of the card (principle 5): it runs to three lines rather than lose its photo or its words. Why: from across a classroom a child glances at the card and parses it in one read. Three lines turns the item into a paragraph and the wall stops being a wall and becomes a poster, so a card holds at most one sticky fact on three lines: a second goes, in order, on a second card of the same type and title. It is what the card holds, not a quota on writing: an item that needs more room gets its card's room first (principle 5), and is never clipped to fit.

""",
             r"""
**4. Two lines is what fits an item on a card.** Nothing (title, step, worked example, sentence stem, reference cell) needs more than two lines at the card's smallest type, which is what each item's character budget measures; a roomy card prints the same words larger. The one exception is a sticky fact whose photo has narrowed to about a third of the card (principle 5): it runs to three lines rather than lose its photo or its words. Why: from across a classroom a child glances at the card and parses it in one read. Three lines turns the item into a paragraph and the wall stops being a wall and becomes a poster, so a card holds at most one sticky fact on three lines: a second goes, in order, on a second card of the same type and title where the wall has room. Where it has none, the build takes that card's photo off and keeps every sentence whole, and says so. It is what the card holds, not a quota on writing: an item that needs more room gets its card's room first (principle 5), and is never clipped to fit.

""")

# --- scripts/check-repair-scope.py (7 replacements) ---
replace_once(SCOPE,
             r"""                after.content[entry] += times
                for seq in used:
                    piece = f"{key}: {', '.join(seq)}"
""",
             r"""                after.content[entry] += times
                for seq, single in used:
                    if single:
                        continue
                    piece = f"{key}: {', '.join(seq)}"
""")
replace_once(SCOPE,
             r"""                joined += seq
                used.append(seq)
                if joined == whole:
""",
             r"""                joined += seq
                used.append((seq, single))
                if joined == whole:
""")
replace_once(SCOPE,
             r"""            used = []
            for index, seq, t in pieces[start:]:
                if t != times or tuple(whole[len(joined):len(joined) + len(seq)]) != seq:
""",
             r"""            used = []
            for seq, t, single in pieces[start:]:
                if t != times or tuple(whole[len(joined):len(joined) + len(seq)]) != seq:
""")
replace_once(SCOPE,
             r"""            continue
        pieces = [(i, seq, t) for i, (c, k, seq, t) in enumerate(after.sequences) if c == channel and k == key]
        for start in range(len(pieces)):
""",
             r"""            continue
        pieces = [(seq, t, single) for (c, k, seq, t, single) in after.pieces if c == channel and k == key]
        for start in range(len(pieces)):
""")
replace_once(SCOPE,
             '    or added values do not join back, so they are still reported.\n    """\n',
             '    or added values do not join back, so they are still reported.\n\n    A piece may be a single value: the teacher\'s rule of one three-line fact a\n    wall card sends the next fact to a second card of its own, and a list split\n    so that one card keeps one item was refused as the lost chain it had\n    rejoined (release 7A\'s fourth check, 26 September 2026). A single value has\n    no chain of its own to count, so only the pieces that are chains are taken\n    back off.\n    """\n')
replace_once(SCOPE,
             r"""                        self.sequences.append((child_channel, key, sequence, times))
                sub, sub_room, sub_case = self._visit(
""",
             r"""                        self.sequences.append((child_channel, key, sequence, times))
                        self.pieces.append((child_channel, key, sequence, times, False))
                    elif len(child) == 1 and is_flat(child[0]) and printed_part(child[0]) != BLANK:
                        self.pieces.append((child_channel, key, (printed_part(child[0]),), times, True))
                sub, sub_room, sub_case = self._visit(
""")
replace_once(SCOPE,
             r"""        self.sequences: list[tuple[str, str, tuple, int]] = []
        self._visit(node, 1, False, "pupil")
""",
             r"""        self.sequences: list[tuple[str, str, tuple, int]] = []
        # The pieces such a split can leave, in walk order: each sequence, and
        # each list of a single value, which is no order on its own but may be
        # the last piece of one (a wall card keeping one fact after a split).
        self.pieces: list[tuple[str, str, tuple, int, bool]] = []
        self._visit(node, 1, False, "pupil")
""")

# --- scripts/tests/test_repair_scope.py (1 replacements) ---
replace_once(SCOPE_TEST,
             r"""
    def test_a_summand_order_is_still_protected(self):
""",
             r"""
    # The teacher's rule of one three-line fact a wall card (26 September 2026)
    # sends the next long fact to a second card of its own, so a split may leave
    # a card one item. The fourth check found every such split refused.
    def test_a_split_that_leaves_a_card_one_item_is_a_repair(self):
        before = {"cards": [wall_card(WALL_STEPS)]}
        after = {"cards": [wall_card(WALL_STEPS[:3]), wall_card(WALL_STEPS[3:])]}
        result = self.run_check(before, after)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("REPAIR_SCOPE_OK", result.stdout)

    def test_two_long_facts_one_to_a_card_is_a_repair(self):
        facts = [{"text": "Monasteries like Lindisfarne kept silver and gold and had nobody guarding them."},
                 {"text": "The Amazon rainforest spreads across several countries; most of it is in Brazil."}]
        sticky = lambda items: {"type": "stickyKnowledge", "page": {"size": "A3", "orientation": "landscape"},
                                "title": "Remember", "photo": "photos/fact.jpg", "items": items}
        result = self.run_check({"cards": [sticky(facts)]}, {"cards": [sticky(facts[:1]), sticky(facts[1:])]})
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("REPAIR_SCOPE_OK", result.stdout)

    def test_a_single_item_out_of_order_is_still_caught(self):
        before = {"cards": [wall_card(WALL_STEPS)]}
        after = {"cards": [wall_card(WALL_STEPS[3:]), wall_card(WALL_STEPS[:3])]}
        result = self.run_check(before, after)
        self.assertEqual(result.returncode, 1, result.stdout)

    def test_a_summand_order_is_still_protected(self):
""")
print("his rule never loses a wall")
