"""Release 7A (4.2.293), step 5b: the wall card's order of moves, in the
engine (his answer of 26 September 2026, after the first check).

Asked whether the order for a wall card whose sentence does not fit should be
the picture a little smaller first, then a bigger or second card, the picture
off only when nothing else fits, and a sentence never cut, he answered: "answer
to your wall question, I guess, but I rarely also use cards with no picture or
helper, so?". A card keeps its picture or helper almost always.

The fitter's own first move: when a card's words do not fit beside its side
picture at the floor size, the picture gives up a little width before the build
refuses. The words' share of the card grows from 60% to 65%, then 70% (the
picture keeps at least three quarters of its width), and the first that fits is
drawn. A card whose words already fit keeps the picture's full share. A card
with no side picture (100%), and a picture the designer made dominant (32%),
are left as they are. Only then does the build refuse, and its message names
the next moves in his order (a list over a second card, the picture off only
when nothing else fits; a sentence never cut)."""
from _patch import replace_once

VISUALS = "working-wall-html/src/visuals.js"
PANELS = "working-wall-html/src/render-panels.js"

replace_once(VISUALS, '''function panelFractionFor(card, ctx, hasPhoto) {''', '''// A card keeps its picture or helper almost always (the teacher, 26 September
// 2026: "I rarely also use cards with no picture or helper"). When its words do
// not fit beside the side picture at the floor size, the picture gives up a
// little width first: the words' share grows from 60% to at most 70%, and the
// first share that fits is drawn. A card whose words fit keeps the full share;
// no side picture, or a picture made dominant, is left alone. Only after this
// does the build refuse and name the next moves (a list over a second card, the
// picture off only when nothing else fits; a sentence never cut).
const PICTURE_GIVES_WAY = [0.65, 0.7];

function panelFractionThatFits(base, fitsAt) {
  if (base !== 0.6 || fitsAt(base)) return base;
  const roomier = PICTURE_GIVES_WAY.find((fraction) => fitsAt(fraction));
  return roomier || base;
}

function panelFractionFor(card, ctx, hasPhoto) {''')
replace_once(VISUALS, '''  panelFractionFor,
  wideVisualReserveInches,
  pickVisual,
  defaultVisualLabel,
  cardLabel,''', '''  panelFractionFor,
  panelFractionThatFits,
  PICTURE_GIVES_WAY,
  wideVisualReserveInches,
  pickVisual,
  defaultVisualLabel,
  cardLabel,''')

replace_once(PANELS, '''const {
  panelFractionFor,
  wideVisualReserveInches,''', '''const {
  panelFractionFor,
  panelFractionThatFits,
  wideVisualReserveInches,''')


def fits_at(items: str, title_area: str) -> str:
    return (
        "(fraction) =>\n"
        "    linearBodyFitsAtFloor(\n"
        f"      {items},\n"
        "      minBodyPt(card, style),\n"
        "      card.page.size,\n"
        "      card.page.orientation,\n"
        "      style,\n"
        f"      {{ widthOverride: dims.width * fraction - 0.6, titleAreaInches: {title_area}, ...stackedBodyOpts(card, fraction) }}\n"
        "    )"
    )


# Sticky knowledge.
replace_once(PANELS, '''  const hasVisual = !!(card.visual || imagePath || emojiVisual);
  const panelFraction = panelFractionFor(card, ctx, hasVisual && !card.visual);''', '''  const hasVisual = !!(card.visual || imagePath || emojiVisual);
  const panelFraction = panelFractionThatFits(panelFractionFor(card, ctx, hasVisual && !card.visual), '''
             + fits_at('items.length > 0 ? items : [{ text: "" }]', "titleBarHeightInches(titlePt)") + ");")
# Vocabulary definition (its side picture is a drawn one).
replace_once(PANELS, '''  const hasVisual = !!card.visual;
  const panelFraction = panelFractionFor(card, ctx, hasVisual && !card.visual);''', '''  const hasVisual = !!card.visual;
  const panelFraction = panelFractionThatFits(panelFractionFor(card, ctx, hasVisual && !card.visual), '''
             + fits_at('[{ text: definition ? plainCriteria(definition) : "" }]', "titleBarHeightInches(titlePt)") + ");")
# Worked example.
replace_once(PANELS, '''  const hasSideVisual = Boolean(imagePath || emojiVisual);
  const panelFraction = panelFractionFor(card, ctx, hasSideVisual);''', '''  const hasSideVisual = Boolean(imagePath || emojiVisual);
  const panelFraction = panelFractionThatFits(panelFractionFor(card, ctx, hasSideVisual), '''
             + fits_at('fitItems.length > 0 ? fitItems : [{ text: "" }]', "titleBarHeightInches(titlePt) + BADGE_COLUMN_INCHES") + ");")
# Sentence stem (its side picture is a drawn one; a filled line is measured as a line of its own).
replace_once(PANELS, '''  const dims = printableInches(card.page.size, card.page.orientation, style);
  const panelFraction = panelFractionFor(card, ctx, false);''', '''  const dims = printableInches(card.page.size, card.page.orientation, style);
  const stemLines = items.flatMap((item) => (item.filled
    ? [{ text: plainCriteria(item.text) }, { text: plainCriteria(item.filled) }]
    : [{ text: plainCriteria(item.text) }]));
  const panelFraction = panelFractionThatFits(panelFractionFor(card, ctx, false), '''
             + fits_at('stemLines.length > 0 ? stemLines : [{ text: "" }]', "titleBarHeightInches(titlePt)") + ");")
print("the picture gives way a little before the build refuses")
