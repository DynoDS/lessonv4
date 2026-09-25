"""The success-criteria pins that the fit release (4.2.289) moves or adds.

1. One pinned phrase changed its words: the "What holds a list today" sentence
   of `slide-success-criteria.md`, pinned by the added row SC-DEC-11-FIT. Its
   entry in the mapping builder now names the new words, with the reason beside
   it. Row SC-K06's whole-paragraph pin is that paragraph, so the rebuild pins
   the new paragraph; its own sentence ("When a composition does not hold the
   whole list, try a roomier one ...") is unchanged.
2. SC-K38's words in `templates.md` ("the bottom strip, which holds no criteria
   list at 18pt") are no longer true: the settling short-list rule lets one step
   draw there. Its entry names the corrected words and its reason says why
   (the second check's finding 3). Row SC-K12's whole-paragraph pin follows its
   paragraph, whose `centre-big-v` sentence was corrected the same way.
3. The new `templates.md` paragraph ("The panel widens itself for a long
   list.") is added as its own row, SC-FIT-289-TPL, pinned whole and in the
   `maths-turn-sc` section, so no word of it (never past half the slide,
   nothing to set) can change or the paragraph move unseen (the second check's
   finding 1).

Then rebuild until it prints MAPPING_OK:

    python -X utf8 plans/streamline-tools/fit-change/c6_move_the_pins.py
    python -X utf8 plans/streamline-tools/sc-change/build_sc_mapping.py
"""
from pathlib import Path

BUILDER = Path(__file__).resolve().parents[1] / "sc-change" / "build_sc_mapping.py"

EDITS = [
    ("""      (SSC, "What holds a list today: the practice templates' panel takes about 14 lines at 18pt, about 26 characters a line;")]),""",
     """      # 4.2.289, the fit release: the practice panel now widens itself, so the sentence says so and the pin follows its new words.
      (SSC, "What holds a list today: the practice templates' panel widens itself, only as far as the whole list needs to read at 18pt and never past half the slide:")]),"""),
    ("""    "SC-K38": "the long-list investigation's measurement: the bottom strip holds no criteria list at 18pt",""",
     """    # 4.2.289: the settling short-list rule lets one step draw in the strip, so the sentence says what it holds.
    "SC-K38": "the long-list investigation's measurement, corrected by the fit release (4.2.289): the bottom strip holds one criteria step of at most two lines at 18pt and never two steps",""",),
    ("""    "SC-K38": [(TPL, "and a short fourth piece in the bottom strip, which holds no criteria list at 18pt: put steps in a practice template's panel or the half-width side (`slide-success-criteria.md`).")],""",
     """    "SC-K38": [(TPL, "and a short fourth piece in the bottom strip, which holds one criteria step of at most two lines at 18pt and never two steps: put steps in a practice template's panel or the half-width side (`slide-success-criteria.md`).")],"""),
    ("""    ("SC-DEC-13", "decision 13: the investigation into fitting a very large list is separate and waits for his word; the slide designer makes it fit meanwhile",
     [(SSC, "the criteria are not reported back as unfittable, and never reshaped or cut to fit")]),
]""",
     """    ("SC-DEC-13", "decision 13: the investigation into fitting a very large list is separate and waits for his word; the slide designer makes it fit meanwhile",
     [(SSC, "the criteria are not reported back as unfittable, and never reshaped or cut to fit")]),
    # 4.2.289: the template guide's new paragraph, held whole and in its section (the second fit check's finding 1).
    ("SC-FIT-289-TPL", "the fit release (4.2.289), as he agreed on 23 September 2026: the practice panel widens itself only as far as 18pt needs, never past half the slide, with nothing to set; pinned whole in the maths-turn-sc section",
     [(TPL, "**The panel widens itself for a long list.** Across the `*-sc` family the success-criteria panel is 4.60″ wide, and it widens to 5.50″ or 6.35″ only when the whole list needs the room to read at 18pt, never past half the slide; the question, reference, cards and working space beside it give up what it takes. There is nothing to set, and a list that fits 4.60″ keeps it (`slide-success-criteria.md` says how much each width holds). On `maths-turn-sc`, when the panel has widened and the `questionVisual` cannot be drawn in its half of the side beside the working space, the builder puts it above the working space instead.")]),
]"""),
]

with open(BUILDER, encoding="utf-8", newline="") as handle:
    text = handle.read()
crlf = "\r\n" in text
for old, new in EDITS:
    if crlf:
        old, new = old.replace("\n", "\r\n"), new.replace("\n", "\r\n")
    assert text.count(old) == 1, (text.count(old), old[:80])
    text = text.replace(old, new)
with open(BUILDER, "w", encoding="utf-8", newline="") as handle:
    handle.write(text)
print("c6: SC-DEC-11-FIT and SC-K38 name the new words, SC-FIT-289-TPL added; now rebuild the mapping")
