"""Release 7A (4.2.293), step 5: the working wall's words.

SA decision 7 (his "Yes"): a sticky fact goes on the wall in the lesson's own
words, shortened only when it genuinely cannot fit, and then still a whole
sentence a teacher would say. PF decision 22, its wording half (his "yes"): the
wall keeps children's sentences whole, a bigger or second card rather than a
clipped one. They agree: room first, a whole sentence always.

The mechanism, as the change plan checked it: a wall card is a fixed A3 sheet
and the engine caps a body item at two lines, which is where the 62 and 106
character budgets come from (a wall test holds both). "A bigger card" is the
card with no picture (about 106 characters an item); "a second card" is a
list's items carried in order over a second card of the same type. Lifting the
two-line cap would be an engine change he did not ask for, so it is not made.

The wall designer's rule 8 is the home. The sticky-knowledge statement leaves
the prose that may be tightened and joins the definition sentence, which stays
word for word (VOC-O07). "Condensing is the first move" is turned round: making
room is the first move, and a modelled sentence or a stem's framing may then be
shortened only to a whole sentence with the same meaning, never a clipped
phrase, with the original in `rationaleNote`. The copies follow in the same
words: the designer's "short by necessity" (never clipped), its Written Voice
trigger (a shortened sentence), its character-budget section and repair order
(which had put condensing first and told it not to take a picture off for
room), its floor line, the wall preferences' principles 2 (the taught term kept
beside its plain words), 4 (two lines is what a card holds, not a quota on
writing; its reason, the poster, kept word for word) and 5, the budget table's sticky row (106, not "about 100") and its
floor line, the focused repair's one sentence, and the build's refusal message.
The two glance-time tests and the wall's example sticky card are topic 9's."""
from _patch import WALL_LAYOUT, WALLD, WALLP, WALLR, replace_once

# --- the wall designer: rule 8 (the home) ------------------------------------------------
# The role file is held under 51 KiB by `test_working_wall_packet.py` and had 20
# bytes to spare, so the copies in this file point at rule 8 rather than repeat
# it, and the reversed "rather than adding or removing a picture to gain a
# character allowance" goes with the order it served.

replace_once(WALLD,
             "   **Prose a child reads may be condensed to fit; a contract a child checks against may not.** The verbatim rule protects the things a child compares board against wall and would stop trusting if the two diverged: success criteria steps, reference-table columns, a misconception's \"Don't\" and \"Do\" pair. Free-standing prose that no child is matching word for word — a worked-example modelled sentence, a sticky-knowledge statement, a sentence stem's framing — may be tightened to come inside the card's budget, keeping the same meaning, the same characters, the same operation or setting, and every protection the sentence carries.",
             "   **Prose a child reads stays a whole sentence; a contract a child checks against stays word for word.** The verbatim rule protects the things a child compares board against wall and would stop trusting if the two diverged: success criteria steps, reference-table columns, a misconception's \"Don't\" and \"Do\" pair. Free-standing prose that no child is matching word for word (a worked-example modelled sentence, a sentence stem's framing) may be tightened to come inside the card's budget, keeping the same meaning, the same characters, the same operation or setting, and every protection the sentence carries, never to a clipped phrase.")
replace_once(WALLD,
             "A vocabulary definition is the lesson's own sentence and keeps the lesson's wording; only when it genuinely cannot fit may it be shortened, and then it stays a whole sentence a teacher would say, never a clipped phrase.\n",
             "A vocabulary definition is the lesson's own sentence and keeps the lesson's wording; only when it genuinely cannot fit may it be shortened, and then it stays a whole sentence a teacher would say, never a clipped phrase. So does a sticky-knowledge statement.\n")
replace_once(WALLD,
             "   Condensing is the *first* move when an item overruns, not the last. A one-sentence fact that goes eight characters over is not a card that failed to earn its place: it is a sentence with eight characters of slack in it. Reach for the shorter wording before you drop the picture, and drop the card only when the meaning genuinely cannot survive the budget — a safety line lost off the wall is a real cost to a real class, and \"it was three characters too long\" is not a reason a teacher would accept. When you do condense, say so in `rationaleNote` with the lesson's original wording, so the teacher can see what changed.",
             "   Making room is the *first* move when an item overruns, not the last: the picture off unless the words need it, then a list over a second card. A one-sentence fact that goes eight characters over is not a card that failed to earn its place: it is a sentence whose card needs room. Drop the card only when the meaning genuinely cannot survive the budget; a safety line lost off the wall is a real cost to a real class, and \"it was three characters too long\" is not a reason a teacher would accept. When you do shorten, say so in `rationaleNote` with the lesson's original wording, so the teacher can see what changed.")

# --- the wall designer: the copies ------------------------------------------------------

replace_once(WALLD,
             "**Write for the wall, not for the page.** A card is signage read from across a classroom, so what you place on it is short by necessity.",
             "**Write for the wall, not for the page.** A card is signage read from across a classroom, so what you place on it is short by necessity, never clipped.")
replace_once(WALLD,
             "Read the rest of Written Voice only when you author a permitted new child-facing line or must report that settled wording is unsuitable; your cards are copied verbatim, so on most runs it never applies.",
             "Read the rest of Written Voice only when you author a permitted new child-facing line, shorten a lesson sentence, or must report that settled wording is unsuitable; your cards are copied verbatim on most runs.")
replace_once(WALLD, """A worked-example step or sticky-knowledge statement that runs past its budget is
not a formatting problem to fix later: it is a sentence that was never going to
read from the back of the room. Write it short first, and let the build's refusal
message, which names the card, the item and the exact overage, aim the repair.
A success-criteria step is never written short: it is copied, and the card makes
room (Rules That Never Change).

When an item does overrun, work down this order and stop at the first move that
succeeds:

1. **Condense the wording** to the 62-character budget, keeping the meaning and
   every protection intact (rule 8). This is nearly always enough: the overage is
   usually a handful of characters, and ordinary prose has that much slack.
2. **Split it across two items** where the sentence holds two separable parts.
3. **Drop the card** — and only here. Note in `rationaleNote` what was lost and
   why the wording could not carry the meaning any shorter.

Choose the supported text budget for the actual card configuration. Preserve readable learning and response examples rather than adding or removing a picture to gain a character allowance; a success-criteria step is the exception (Rules That Never Change).""", """A worked-example step you write that runs past its budget is not a formatting
problem to fix later: it is a sentence that was never going to read from the back
of the room. Write it short first, and let the build's refusal message, which
names the card, the item and the exact overage, aim the repair. A sentence the
lesson wrote makes room first (rule 8). A success-criteria step is never written
short: it is copied, and the card makes room (Rules That Never Change).

When an item does overrun, work down this order and stop at the first move that
succeeds:

1. **Make room** (rule 8).
2. **Shorten the wording** to a whole sentence, keeping the meaning and every
   protection intact (rule 8). The overage is usually a handful of characters,
   and ordinary prose has that much slack.
3. **Split it across two items** where the sentence holds two separable parts.
4. **Drop the card**, and only here. Note in `rationaleNote` what was lost and
   why the wording could not carry the meaning any shorter.

Choose the supported text budget for the actual card configuration, and preserve readable learning and response examples.""")
replace_once(WALLD,
             "Shorten faithful display text, simplify the representation, choose a supported larger layout, or drop the card before delivery.",
             "Choose a supported larger layout, shorten faithful display text to a whole sentence, simplify the representation, or drop the card before delivery.")

# --- the wall preferences ---------------------------------------------------------------

replace_once(WALLP,
             "- \"the part that makes sense on its own\" not \"the independent clause\"",
             "- \"the part that makes sense on its own (the independent clause)\" not \"the independent clause\" alone")
replace_once(WALLP,
             "**4. Two-line maximum on every item.** Nothing — title, step, worked example, sentence stem, reference cell — wraps beyond two lines. Why: from across a classroom a child glances at the card and parses it in one read. Three lines turns the item into a paragraph and the wall stops being a wall and becomes a poster.",
             "**4. Two lines is what fits an item on a card.** Nothing (title, step, worked example, sentence stem, reference cell) wraps beyond two lines, because the card draws each item in two lines at most. Why: from across a classroom a child glances at the card and parses it in one read. Three lines turns the item into a paragraph and the wall stops being a wall and becomes a poster. It is what the card holds, not a quota on writing: an item that needs more room gets its card's room first (principle 5), and is never clipped to fit.")
replace_once(WALLP,
             "| Sticky-knowledge item | ≤ 62 characters on a card carrying a picture. A card with no picture has the full width, up to about 100 characters, and a text-led card may use it. |",
             "| Sticky-knowledge item | ≤ 62 characters on a card carrying a picture. A card with no picture has the full width, about 106 characters, and a text-led card may use it. |")
replace_once(WALLP,
             "If autofit reaches the floor and a warning fires, the build has failed: shorten faithful display text (never a success-criteria step, which is copied word for word), simplify the layout, or remove the card, then rebuild and verify before delivery.",
             "If autofit reaches the floor and a warning fires, the build has failed: make room first (the card's picture off unless the words need it, or a list over two cards), then shorten faithful display text to a whole sentence (never a success-criteria step, which is copied word for word), simplify the layout, or remove the card, then rebuild and verify before delivery.")
replace_once(WALLP,
             "**5. Prose a child reads may be condensed for the wall; a contract a child checks against may not.** What has to stay word for word is what a child compares board against wall: success criteria steps, reference-table columns, a misconception's \"Don't\"/\"Do\" pair. Free-standing prose nobody is matching word for word — a modelled sentence, a sticky-knowledge fact — may be tightened to fit the card, keeping the meaning and every protection it carries. A vocabulary definition keeps the lesson's own wording; only when it genuinely cannot fit may it be shortened, and then it stays a whole sentence a teacher would say, never a clipped phrase.",
             "**5. Prose a child reads stays a whole sentence; a contract a child checks against stays word for word.** What has to stay word for word is what a child compares board against wall: success criteria steps, reference-table columns, a misconception's \"Don't\"/\"Do\" pair. A card makes room before any sentence is shortened: its picture comes off unless the words need it, and a list carries over to a second card. Free-standing prose nobody is matching word for word (a modelled sentence, a stem's framing) may then be tightened to fit the card, keeping the meaning and every protection it carries, and it stays a whole sentence, never a clipped phrase. A vocabulary definition keeps the lesson's own wording; only when it genuinely cannot fit may it be shortened, and then it stays a whole sentence a teacher would say, never a clipped phrase. A sticky-knowledge fact is the same: the lesson's own words, shortened only when they genuinely cannot fit, and then still a whole sentence a teacher would say.")
replace_once(WALLP,
             "and the shorter one is on the wall where a child can use it. Condense first, before dropping anything.",
             "and the shorter one is on the wall where a child can use it. Make room first, then shorten to a whole sentence, before dropping anything.")

# --- the focused repair's one sentence ----------------------------------------------------

replace_once(WALLR,
             "An item over its own character budget is different: it fits only reworded, and rewording is not this round's to do, so leave that finding unrepaired and say it needs the wall designer's wording.",
             "An item over its own character budget is different: it needs its card's room first (the picture off unless the words need it) or, after that, a shorter whole sentence, and both are the wall designer's to decide, not this round's, so leave that finding unrepaired and say it needs the wall designer.")

# --- the build's refusal message --------------------------------------------------------

replace_once(WALL_LAYOUT,
             '''problems.push(`item ${index + 1} is ${adjLen} characters including its label, and ${budget} is the most that fits in ${cap} lines at ${pt}pt (${charsPerLine} per line). Cut it to ${budget} characters or fewer: "${String(text).slice(0, 60)}${text.length > 60 ? "…" : ""}".`);''',
             '''problems.push(`item ${index + 1} is ${adjLen} characters including its label, and ${budget} is the most that fits in ${cap} lines at ${pt}pt (${charsPerLine} per line): "${String(text).slice(0, 60)}${text.length > 60 ? "…" : ""}".`);''')
replace_once(WALL_LAYOUT,
             '"Splitting the items in order over a second card keeps every word and is a layout change (a wall takes two teaching cards); otherwise remove an item or shorten the longest, never a success-criteria step, which is copied word for word"',
             '"Splitting the items in order over a second card keeps every word and is a layout change (a wall takes two teaching cards); otherwise remove an item or shorten the longest to a whole sentence, never a success-criteria step, which is copied word for word"')
replace_once(WALL_LAYOUT,
             '''"an item over its own budget fits only reworded, which is the wall designer's decision, not a focused repair's; a success-criteria step is never reworded, so its card makes room instead (the picture off unless the steps need it, or the list over two cards)"''',
             '''"an item over its own budget needs room before its words change: if the card carries a picture, take it off unless the words need it, since a card with no picture has the full width; only if it still will not fit is it shortened, to a whole sentence with the same meaning and never a clipped phrase, and that is the wall designer's decision, not a focused repair's; a success-criteria step is never reworded, so its card makes room instead (the picture off unless the steps need it, or the list over two cards)"''')
replace_once(WALL_LAYOUT,
             "  // (14 September 2026). The remedy is named by who may apply it, because a\n  // focused repair may move and split content but not reword it.",
             "  // (14 September 2026). The remedy is named by who may apply it, because a\n  // focused repair may move and split content but not reword it, and it leads\n  // with room, because a child's sentence is kept whole before it is shortened.")
print("wall words written")
