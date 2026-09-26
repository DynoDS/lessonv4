"""Release 7A (4.2.293), step 8g (the third check's item 1): a line holding an
arrow is drawn the height the wall plans it.

Comic Sans MS has no arrows, so Chrome drew each one from the next font in the
wall's own stack, Segoe Print, whose line is 1.78 times its type where Comic
Sans draws 1.4: a line holding an arrow printed about 28% taller than planned.
The saved rounding wall's worked example printed 38px taller than planned, and
in the third check's arrow sweep 45 of 178 cards printed past their panel (up
to 63px); 121 of his saved designs use an arrow.

Of the two repairs (plan the taller line, or draw the arrow within the line),
this draws the arrow within the line: a "Wall Arrows" face takes Arial's arrows
alone (unicode-range U+2190 to U+21FF, `local()`, bold and regular), placed
after Comic Sans MS in every stack the wall writes, so an arrow comes from
Arial, whose line sits inside Comic Sans's own, and every other character Comic
Sans lacks still falls to Segoe Print as before. A line holding an arrow is then
the height every other line is, on every card type, and the plan needs no second
font's measurements; the arrow's advance (Arial Bold: 1em across, half that up or
down) joins the width table. The arrows look a little plainer (Arial's, not Segoe
Print's hand-drawn ones). Measured: the arrow sweep rebuilt here, 178 cards, none
past its panel or into its padding; the rounding wall's plan equals its print.

The Chrome tests (in `7a-change/new/`, copied by a8et and a8ft) carry the arrow
cases: the per-type test a sticky card and a worked example full of arrows, and
the standing guard the arrow sweep, landscape and portrait, with a photo and
without. The per-type test also gains the third check's undo misses: two
definitions the letter count sized wrongly (one too large, one too small), a card
beside a dominant figure, and a drawing card's refusal counted at its four
lines."""
from _patch import replace_once

SHARED = "working-wall-html/src/shared.js"
DISPLAY = "working-wall-html/src/render-display.js"
GRIDS = "working-wall-html/src/render-grids.js"
OVERVIEW = "working-wall-html/src/render-overview.js"
PANELS = "working-wall-html/src/render-panels.js"
SECTION = "working-wall-html/src/render-section.js"
LAYOUT = "working-wall-html/src/layout.js"

# --- working-wall-html/src/shared.js (3 replacements) ---
replace_once(SHARED,
             r"""html, body { margin: 0; padding: 0; }
body { font-family: "Comic Sans MS", "Segoe Print", cursive; }
.page {
""",
             r"""html, body { margin: 0; padding: 0; }
body { font-family: "Comic Sans MS", "Wall Arrows", "Segoe Print", cursive; }
.page {
""")
replace_once(SHARED,
             r"""const PAGE_CSS = `
@page a3portrait { size: A3 portrait; margin: 0; }
""",
             r"""const PAGE_CSS = `
@font-face { font-family: "Wall Arrows"; src: local("Arial"), local("ArialMT"); font-weight: 400; unicode-range: U+2190-21FF; }
@font-face { font-family: "Wall Arrows"; src: local("Arial Bold"), local("Arial-BoldMT"); font-weight: 700; unicode-range: U+2190-21FF; }
@page a3portrait { size: A3 portrait; margin: 0; }
""")
replace_once(SHARED,
             r"""
const FONT_STACK_FALLBACK = "'Segoe Print', cursive";

""",
             r"""
// Comic Sans MS has no arrows, and the next font in the stack, Segoe Print,
// draws a line 1.78 times its type where Comic Sans draws 1.4, so a line
// holding an arrow printed about 28% taller than the wall planned it: the
// saved rounding wall's worked example 38px taller, and in the third check's
// arrow sweep 45 of 178 cards past their panel (release 7A, 26 September
// 2026). Arrows now come from "Wall Arrows", Arial's arrows alone (PAGE_CSS),
// whose line sits inside Comic Sans's own, so a line holding one is the height
// every other line is and the plan needs no second font. Every other character
// Comic Sans lacks still falls to Segoe Print, as before.
const FONT_STACK_FALLBACK = "'Wall Arrows', 'Segoe Print', cursive";

""")

# --- working-wall-html/src/render-display.js (1 replacements) ---
replace_once(DISPLAY,
             r"""
const FONT_STACK_FALLBACK = "'Segoe Print', cursive";

""",
             r"""
// Arrows come from "Wall Arrows" (shared.js says why).
const FONT_STACK_FALLBACK = "'Wall Arrows', 'Segoe Print', cursive";

""")

# --- working-wall-html/src/render-grids.js (1 replacements) ---
replace_once(GRIDS,
             r"""
const FONT_STACK_FALLBACK = "'Segoe Print', cursive";
const WALL_TABLE_IMAGE_HEIGHT_CAP_IN = 1.6;
""",
             r"""
// Arrows come from "Wall Arrows" (shared.js says why).
const FONT_STACK_FALLBACK = "'Wall Arrows', 'Segoe Print', cursive";
const WALL_TABLE_IMAGE_HEIGHT_CAP_IN = 1.6;
""")

# --- working-wall-html/src/render-overview.js (1 replacements) ---
replace_once(OVERVIEW,
             r"""
const FONT_STACK_FALLBACK = "'Segoe Print', cursive";

""",
             r"""
// Arrows come from "Wall Arrows" (shared.js says why).
const FONT_STACK_FALLBACK = "'Wall Arrows', 'Segoe Print', cursive";

""")

# --- working-wall-html/src/render-panels.js (1 replacements) ---
replace_once(PANELS,
             r"""
const FONT_STACK_FALLBACK = "'Segoe Print', cursive";

""",
             r"""
// Arrows come from "Wall Arrows" (shared.js says why).
const FONT_STACK_FALLBACK = "'Wall Arrows', 'Segoe Print', cursive";

""")

# --- working-wall-html/src/render-section.js (1 replacements) ---
replace_once(SECTION,
             r"""
const FONT_STACK_FALLBACK = "'Segoe Print', cursive";

""",
             r"""
// Arrows come from "Wall Arrows" (shared.js says why).
const FONT_STACK_FALLBACK = "'Wall Arrows', 'Segoe Print', cursive";

""")

# --- working-wall-html/src/layout.js (1 replacements) ---
replace_once(LAYOUT,
             r"""const A3_MM = { short: 297, long: 420 };
// Advances the board's table does not carry, measured in the same Chrome.
const EXTRA_BOLD_EM = { "\u2019": 0.2261, "\u2018": 0.2261, "\u00a0": 0.4761 };

""",
             r"""const A3_MM = { short: 297, long: 420 };
// Advances the board's table does not carry, measured in the same Chrome: the
// curly quotes and the no-break space from Comic Sans MS Bold, the arrows from
// Arial Bold, which draws them on the wall (shared.js, "Wall Arrows").
const EXTRA_BOLD_EM = {
  "\u2019": 0.2261, "\u2018": 0.2261, "\u00a0": 0.4761,
  "\u2190": 1, "\u2192": 1, "\u2194": 1, "\u2191": 0.5, "\u2193": 0.5,
};

""")
print("arrows are drawn within the line")
