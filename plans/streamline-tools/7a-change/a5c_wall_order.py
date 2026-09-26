"""Release 7A (4.2.293), step 5c: the wall card's order of moves, in the words
(his answer of 26 September 2026, after the first check).

His words: "answer to your wall question, I guess, but I rarely also use cards with no
picture or helper, so?", answering whether the order should be the picture a
little smaller first, then a bigger or second card, the picture off only when
nothing else fits, and a sentence never cut. A card keeps its picture or helper
almost always: the picture shrinks a little (the build does it, a5b), then a
list goes over a second card, and taking the picture off is the very last move,
so a card with none stays as rare as on his own walls. "Never cut" is read
with his decision 7 and decision 22 as never clipped: the lesson's sentence
stays whole, and its whole-sentence shortening stays the wall designer's very
last resort, after the picture is off (the lead's reading, named in the report).

This step reorders the moves 7A's first version wrote (picture off first) in
the wall designer's rule 8, its success-criteria paragraph and its budget
section, the wall preferences' principle 5, floor line and budget table, the
focused repair, and the build's refusal. The wall designer stays under its
51 KiB cap: the budget section's "ordinary prose has that much slack", which
argued for shortening before room, goes."""
from _patch import WALL_LAYOUT, WALLD, WALLP, WALLR, replace_once

replace_once(WALLD,
             "   Making room is the *first* move when an item overruns, not the last: the picture off unless the words need it, then a list over a second card.",
             "   Making room is the *first* move when an item overruns, not the last: the build shrinks the picture a little, then a list goes over a second card, and the picture comes off only when nothing else fits (his walls rarely have a card without one).")
replace_once(WALLD,
             "If the full SC won't fit at the wall's fixed A3 size, make room: take the card's picture off unless the steps need it (about 106 characters a step instead of 62), drop non-SC extras, or carry the list in order over two cards of the same type and title when the wall has room for both; if it still will not fit, omit the card, but never reword the steps.",
             "If the full SC won't fit at the wall's fixed A3 size, make room: drop non-SC extras, carry the list in order over two cards of the same type and title when the wall has room for both, and only when nothing else fits take the card's picture off, unless the steps need it (about 106 characters a step instead of 62); if it still will not fit, omit the card, but never reword the steps.")
replace_once(WALLD, """2. **Shorten the wording** to a whole sentence, keeping the meaning and every
   protection intact (rule 8). The overage is usually a handful of characters,
   and ordinary prose has that much slack.""", """2. **Shorten the wording** to a whole sentence, keeping the meaning and every
   protection intact (rule 8).""")

replace_once(WALLP,
             "A card makes room before any sentence is shortened: its picture comes off unless the words need it, and a list carries over to a second card.",
             "A card makes room before any sentence is shortened, in the teacher's order: the build shrinks its picture a little, a list carries over to a second card, and the picture comes off only when nothing else fits, because a card with no picture or helper is rare on his walls.")
replace_once(WALLP,
             "make room first (the card's picture off unless the words need it, or a list over two cards), then shorten faithful display text to a whole sentence",
             "make room first (a list over two cards, and the picture off only when nothing else fits), then shorten faithful display text to a whole sentence")
replace_once(WALLP,
             "| Sticky-knowledge item | ≤ 62 characters on a card carrying a picture. A card with no picture",
             "| Sticky-knowledge item | ≤ 62 characters on a card carrying a picture, and about 72 characters once the build has shrunk the picture a little. A card with no picture")
replace_once(WALLP,
             "the card makes room instead (no picture unless the steps need it, or the list over two cards). |",
             "the card makes room instead (the list over two cards, and the picture off only when nothing else fits). |")

# The focused repair is held under 8,000 bytes by a test, so its two sentences
# take the order in as few words as they can.
replace_once(WALLR,
             "it needs its card's room first (the picture off unless the words need it) or, after that, a shorter whole sentence, and both are the wall designer's to decide, not this round's,",
             "it needs its card's room first (a list over a second card, the picture off only when nothing else fits) or, after that, a shorter whole sentence; both are the wall designer's, not this round's,")
replace_once(WALLR,
             "say instead that its card needs room (its picture off unless its steps need it, or its list over two cards)",
             "say instead that its card needs room (its list over two cards, its picture off only when nothing else fits)")

replace_once(WALL_LAYOUT,
             "an item over its own budget needs room before its words change: if the card carries a picture, take it off unless the words need it, since a card with no picture has the full width; only if",
             "an item over its own budget needs room before its words change: any picture beside it has already given up a little width, so next carry a list over a second card, and take the picture off only when nothing else fits, since a card with no picture has the full width; only if")
replace_once(WALL_LAYOUT,
             "a success-criteria step is never reworded, so its card makes room instead (the picture off unless the steps need it, or the list over two cards)",
             "a success-criteria step is never reworded, so its card makes room instead (the list over two cards, and the picture off only when nothing else fits)")
print("the wall's order of moves written")
