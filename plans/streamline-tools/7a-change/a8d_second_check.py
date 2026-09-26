"""Release 7A (4.2.293), step 8d (added after the second check,
`7a-release-second-check.md`): the repairs it asked for, each small.

1. An untitled grid's own fix was refused by the same check. The slide check
   sends an untitled grid back and says to title it "usually Your Turn"; the
   turn check then refused "Your Turn" because a grid's calculations did not
   count as the class's turn. Twelve sums to work out are the task, so they now
   count. A grid under the starter header, which never prints a title, is no
   longer sent back for one: the only way through was a title nobody sees.
2. (Tests only, in a8dt.)
3. The wall refused a card at the picture's full share, so its message named
   the 62-character budget although the build had already tried 72 beside a
   picture a little smaller; a designer shortening would aim ten letters lower
   than it needs to. A card that fits at no share is now measured, and refused,
   at the widest share tried, so the message names the budget it really has.
4. The wall preferences' principle 4 said the card draws each item in two lines
   at most; the engine wraps an item over up to five lines at larger type, and
   two lines is the budget at the smallest. It now says that.
5. The playbook's orchestrator re-runs the slide check after the decorator; it
   now says to run it with `--settled`, as the decorator's own check does, so a
   title slip the designer's round left is a note there too."""
from _patch import CHECK, PB, WALLP, replace_once

VISUALS = "working-wall-html/src/visuals.js"

# --- 1. the grid ------------------------------------------------------------------------

replace_once(CHECK, """function carriesItsTurn(slideData) {
  let found = hasTaskSteps(slideData, false);
""", """function carriesItsTurn(slideData) {
  // A grid's calculations are the class's turn: twelve sums to work out are the
  // task, though no verb opens them. Without this the title the untitled grid's
  // own message asks for, "Your Turn", was refused as a turn with no task.
  if (
    slideData.template === 'grid-calc' &&
    Array.isArray(slideData.calculations) &&
    slideData.calculations.some((calculation) => String(calculation || '').trim())
  ) {
    return true;
  }
  let found = hasTaskSteps(slideData, false);
""")
replace_once(CHECK, """    // An untitled arithmetic grid printed "Independent Tasks", a structural
    // label the teacher keeps off the board. The final build now draws it with
    // no title line rather than refuse the deck; this sends the designer back
    // to title it, beside the stage-label rule below.
    if (slideData.template === 'grid-calc' && !title) {""", """    // An untitled arithmetic grid printed "Independent Tasks", a structural
    // label the teacher keeps off the board. The final build now draws it with
    // no title line rather than refuse the deck; this sends the designer back
    // to title it, beside the stage-label rule below. A grid under the starter
    // header is left alone: that header never prints a title, so asking for one
    // would ask for a word nobody sees.
    if (slideData.template === 'grid-calc' && !title && slideData.headerStyle !== 'starter') {""")

# --- 3. the wall's refusal names the budget the card really has --------------------------

replace_once(VISUALS, """// no side picture, or a picture made dominant, is left alone. Only after this
// does the build refuse and name the next moves (a list over a second card, the
// picture off only when nothing else fits; a sentence never cut).
const PICTURE_GIVES_WAY = [0.65, 0.7];""", """// no side picture, or a picture made dominant, is left alone. A card that fits
// at no share is measured, and refused, at the widest share tried, so the
// refusal names the budget the card really has (about 72 characters beside a
// photo, not the 62 of the full share) and then the next moves (a list over a
// second card, the picture off only when nothing else fits; a sentence never
// cut).
const PICTURE_GIVES_WAY = [0.65, 0.7];""")
replace_once(VISUALS, "  return roomier || base;",
             "  return roomier || PICTURE_GIVES_WAY[PICTURE_GIVES_WAY.length - 1];")

# --- 4. principle 4 says what the engine does -------------------------------------------

replace_once(WALLP,
             "**4. Two lines is what fits an item on a card.** Nothing (title, step, worked example, sentence stem, reference cell) wraps beyond two lines, because the card draws each item in two lines at most.",
             "**4. Two lines is what fits an item on a card.** Nothing (title, step, worked example, sentence stem, reference cell) needs more than two lines at the card's smallest type, which is what each item's character budget measures; a roomy card prints the same words larger.")

# --- 5. the orchestrator's re-check after the decorator -----------------------------------

replace_once(PB, "check yourself. Run the optional-picture check yourself too, with no",
             "check yourself with `--settled`. Run the optional-picture check yourself too, with no")
print("the second check's repairs written")
