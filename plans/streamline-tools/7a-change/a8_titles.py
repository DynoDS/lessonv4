"""Release 7A (4.2.293), step 8: slide titles (A11).

PF settled item 1 (his "yes and yes"), on his 19 September ruling that in maths
the plain words `My Turn`, `Our Turn`, `Your Turn`, `Answers`, `Apply` are the
titles: the four lines that call `Apply` a slot name to replace gain the maths
exception (preferences Slide Headings, the lesson designer, the reviewer, whose
own list's settled item 8 says this is fixed once, here, and the slide
designer). The contract's ending example label `Apply` is a maths example and
stays. An untitled arithmetic grid stops printing `Independent Tasks`: the
default goes, the slide check sends an untitled `grid-calc` back to be titled
(a presentation fault beside INTERNAL_STAGE_TITLE, naming the fix), and the
final build draws one with no title line rather than lose the deck (the first
check's repair 5: a cosmetic title never withholds a deck).

PF decision 21 (his "yes"): `Practise` stays a slot name to replace, and the
slide check flags a bare `Practise` title in every subject, beside `Apply`
outside maths.

SA neighbour note N2, PF settled item 14 (out of date, his "yes"): the numbered
helpers and the numbering rows say the main independent work is numbered in
maths only, and their labels are purple, as the code draws them
(`COLOURS.questionLabel`, 7030A0). The sentences `builder/test/doc-claims.test.js`
holds stay word for word; the maths limit is added beside them."""
from _patch import CHECK, GRID, LD, PREF, REV, SD, TMPL, replace_once

PLAIN = "`My Turn`, `Our Turn`, `Your Turn`, `Answers` and `Apply`"

replace_once(PREF,
             "Replace a label only when it is an internal one that names a slot rather than a move (`Do 1: Cold-call recap`, `Teach 3`, `Apply`, `Practise`), and then",
             "Replace a label only when it is an internal one that names a slot rather than a move (`Do 1: Cold-call recap`, `Teach 3`, `Practise`, and `Apply` outside maths, where it is one of the plain words above), and then")
replace_once(LD,
             "never the slot it fills (`Still part of the lesson`, `Apply`). `preferences.md` → Slide Headings owns the form.",
             "never the slot it fills (`Still part of the lesson`, or `Apply` outside maths, where the teacher wants the plain words " + PLAIN + "). `preferences.md` → Slide Headings owns the form.")
replace_once(REV,
             "A label naming a slot rather than a move (`Still part of the lesson`, `Apply`) is a bounded correction under `preferences.md` → Slide Headings; write the move a child is making.",
             "A label naming a slot rather than a move (`Still part of the lesson`, or `Apply` outside maths, where the teacher wants the plain words " + PLAIN + ") is a bounded correction under `preferences.md` → Slide Headings; write the move a child is making.")
replace_once(SD,
             "The source unit's label is the title unless it is an internal slot name (`Do 1`, `Teach 3`, `Apply`, `Practise`); the section says what to do then.",
             "The source unit's label is the title unless it is an internal slot name (`Do 1`, `Teach 3`, `Practise`, and `Apply` outside maths); the section says what to do then.")

# --- the slide check: a bare Practise is flagged, Apply outside maths -----------------

replace_once(CHECK, '''// Internal lesson-stage labels ("Teach 1", "Do 2", bare "Apply") belong to the
// lesson-design document, never to a child-facing slide title. A title that is
// only a stage label tells a child nothing about the slide, so it blocks the
// check before any deck is built. Child-facing classroom labels — My Turn,
// Your Turn, Quick check, Practise — do not match and stay valid.
const INTERNAL_STAGE_TITLE =
  /^(?:(?:Teach|Do)\\s+\\d+(?:\\s*:.*)?|Apply)$/i;''', '''// Internal lesson-stage labels ("Teach 1", "Do 2", a bare "Practise" or
// "Apply") belong to the lesson-design document, never to a child-facing slide
// title. A title that is only a stage label tells a child nothing about the
// slide, so it blocks the check before any deck is built. Child-facing
// classroom labels (My Turn, Our Turn, Your Turn, Quick check) do not match and
// stay valid. "Practise" names the slot, not the move, in every subject (the
// teacher's "yes", 24 September 2026, `preferences.md` -> Slide Headings).
const INTERNAL_STAGE_TITLE =
  /^(?:(?:Teach|Do)\\s+\\d+(?:\\s*:.*)?|Apply|Practise)$/i;''')
replace_once(CHECK, '''      message:
        `"${title}" is an internal lesson-stage label, not a child-facing title.`''', '''      message:
        `"${title}" is an internal lesson-stage label, not a child-facing title. ` +
        'Title the slide with the move the unit makes, in a child\\'s words, from its own content. ' +
        'In maths the plain words My Turn, Our Turn, Your Turn, Answers and Apply are the titles; ' +
        'Practise is not one of them (preferences.md -> Slide Headings).\'''')

# --- the grid's default title -----------------------------------------------------------

# An untitled grid draws no title line (the header draws none for an empty
# title) and never "Independent Tasks"; the slide check, not the final build,
# sends it back to be titled, so a cosmetic title can never cost the deck.
replace_once(GRID, "    title: data.title || 'Independent Tasks',", "    title: data.title,")
replace_once(CHECK, '''    if (maths && /^apply$/i.test(title)) return;
    if (!INTERNAL_STAGE_TITLE.test(title)) return;''', '''    // An untitled arithmetic grid printed "Independent Tasks", a structural
    // label the teacher keeps off the board. The final build now draws it with
    // no title line rather than refuse the deck; this sends the designer back
    // to title it, beside the stage-label rule below.
    if (slideData.template === 'grid-calc' && !title) {
      warnings.push({
        signal: 'GRID_WITHOUT_TITLE',
        slide: index + 1,
        field: 'title',
        message:
          'a grid-calc slide has no "title", and the builder no longer prints ' +
          '"Independent Tasks" for one. Give it the design\\'s label as its title: ' +
          'in maths the plain words, usually "Your Turn".'
      });
      return;
    }
    if (maths && /^apply$/i.test(title)) return;
    if (!INTERNAL_STAGE_TITLE.test(title)) return;''')
replace_once(TMPL,
             "**Slots:** `title` (defaults to \"Independent Tasks\"), `instruction`, `calculations`",
             "**Slots:** `title` (the design's label: in maths the plain words, usually `Your Turn`; an untitled grid prints no title line, and the slide check sends it back to be titled), `instruction`, `calculations`")

# --- numbering scope and label colour -------------------------------------------------

replace_once(TMPL,
             "| `numbered-questions` | Stacked question cards with auto blue `(1) (2) (3)` labels, for Apply / independent work |",
             "| `numbered-questions` | Stacked question cards with auto purple `(1) (2) (3)` labels, for a starter, or for Apply / independent work in maths |")
replace_once(TMPL,
             "one card per question, a blue number badge on each card's corner,",
             "one card per question, a purple number badge on each card's corner,")
replace_once(TMPL,
             "A vertical stack of question cards, each with a blue `(1) (2) (3)` label down the left. Use only on starter and main independent work slides — typically dropped into a `body-full` zone.",
             "A vertical stack of question cards, each with a purple `(1) (2) (3)` label down the left. Use only on starter and main independent work slides (the main independent work is numbered in maths only: `preferences.md` → Question Labelling), typically dropped into a `body-full` zone.")
replace_once(TMPL,
             "Use `numbered-questions` in this rail only when it belongs to a starter or main independent task.",
             "Use `numbered-questions` in this rail only when it belongs to a starter or, in maths, a main independent task.")
replace_once(TMPL,
             "Each carries a blue number badge on its corner and sits",
             "Each carries a purple number badge on its corner and sits")
replace_once(TMPL,
             "Use `question-cards` only for a starter or main independent question set.",
             "Use `question-cards` only for a starter or, in maths, a main independent question set.")
replace_once(TMPL,
             "Both helpers are restricted to a starter or the lesson's main independent work.",
             "Both helpers are restricted to a starter or the lesson's main independent work in maths.")
replace_once(TMPL,
             "Add `questionNumbering` only when the row belongs to a numbered starter, a numbered main independent task or a multi-question Maths Our Turn.",
             "Add `questionNumbering` only when the row belongs to a numbered starter, a numbered main independent task in maths, or a multi-question Maths Our Turn.")
print("titles and numbering written")
