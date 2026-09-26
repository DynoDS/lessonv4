"""Release 7A (4.2.293), step 8h (the updated third check): an arrow as heavy
as the digits beside it, still within the line.

Round 8 drew arrows from Arial Bold to keep them inside the line, and the third
check found Arial's arrow a hairline: a 4px shaft at 60pt against Comic Sans
MS Bold's digits' 11px, fainter than the numbers from across a room. Measured
in the Chrome the wall prints with, every heavier face with arrows stays thin
(Segoe UI Black 5px, Segoe UI Symbol 7px, Segoe Print Bold 8px) and synthetic
bold does not thicken a face declared bold. So the arrow is Segoe Print's own,
the one his walls had, drawn 40% larger (`size-adjust: 140%`): an 11px shaft,
the digits' weight. The face's own ascent and descent are held under Comic
Sans's (`ascent-override: 78%`, `descent-override: 20%`), so at every size from
20 to 100pt a line holding an arrow is the height of one without, and the plan
still needs no second font. The arrows' advances follow (1.397em across, 0.697em
up or down, 1.540em both ways, Segoe Print Bold at 140%).

The test `every-arrow-is-drawn-from-the-wall-arrows.test.js` (from
`7a-change/new/`, copied by a8ht) builds an arrow into every place the face was
written (a panel card and its title bar, a stacked figure's caption, a table, a
section heading, an overview's callouts, a diagram section's notes, and the
page's own default), and fails if any is drawn another way; it also fails if a
line holding an arrow is taller than one without, or if the shaft is under 10px
at 60pt."""
from _patch import replace_once

SHARED = "working-wall-html/src/shared.js"
LAYOUT = "working-wall-html/src/layout.js"

# --- working-wall-html/src/shared.js (2 replacements) ---
replace_once(SHARED,
             r"""const PAGE_CSS = `
@font-face { font-family: "Wall Arrows"; src: local("Arial"), local("ArialMT"); font-weight: 400; unicode-range: U+2190-21FF; }
@font-face { font-family: "Wall Arrows"; src: local("Arial Bold"), local("Arial-BoldMT"); font-weight: 700; unicode-range: U+2190-21FF; }
@page a3portrait { size: A3 portrait; margin: 0; }
""",
             r"""const PAGE_CSS = `
@font-face { font-family: "Wall Arrows"; src: local("Segoe Print"), local("SegoePrint"); font-weight: 400; size-adjust: 140%; ascent-override: 78%; descent-override: 20%; line-gap-override: 0%; unicode-range: U+2190-21FF; }
@font-face { font-family: "Wall Arrows"; src: local("Segoe Print Bold"), local("SegoePrint-Bold"); font-weight: 700; size-adjust: 140%; ascent-override: 78%; descent-override: 20%; line-gap-override: 0%; unicode-range: U+2190-21FF; }
@page a3portrait { size: A3 portrait; margin: 0; }
""")
replace_once(SHARED,
             r"""// arrow sweep 45 of 178 cards past their panel (release 7A, 26 September
// 2026). Arrows now come from "Wall Arrows", Arial's arrows alone (PAGE_CSS),
// whose line sits inside Comic Sans's own, so a line holding one is the height
// every other line is and the plan needs no second font. Every other character
// Comic Sans lacks still falls to Segoe Print, as before.
const FONT_STACK_FALLBACK = "'Wall Arrows', 'Segoe Print', cursive";
""",
             r"""// arrow sweep 45 of 178 cards past their panel (release 7A, 26 September
// 2026). Arrows now come from "Wall Arrows" (PAGE_CSS): Segoe Print's own
// arrows alone, drawn 40% larger so the shaft is as heavy as the digits beside
// it (11px at 60pt, against the digits' 11 to 13; Arial Bold's was a 4px
// hairline, Segoe UI Black's 5px, Segoe Print's own 8px), and held inside
// Comic Sans's line by the face's own ascent and descent, so a line holding an
// arrow is the height every other line is and the plan needs no second font.
// Every other character Comic Sans lacks still falls to Segoe Print, as before.
const FONT_STACK_FALLBACK = "'Wall Arrows', 'Segoe Print', cursive";
""")

# --- working-wall-html/src/layout.js (1 replacements) ---
replace_once(LAYOUT,
             r"""// curly quotes and the no-break space from Comic Sans MS Bold, the arrows from
// Arial Bold, which draws them on the wall (shared.js, "Wall Arrows").
const EXTRA_BOLD_EM = {
  "\u2019": 0.2261, "\u2018": 0.2261, "\u00a0": 0.4761,
  "\u2190": 1, "\u2192": 1, "\u2194": 1, "\u2191": 0.5, "\u2193": 0.5,
};
""",
             r"""// curly quotes and the no-break space from Comic Sans MS Bold, the arrows from
// Segoe Print Bold at 140%, which draws them on the wall (shared.js, "Wall
// Arrows").
const EXTRA_BOLD_EM = {
  "\u2019": 0.2261, "\u2018": 0.2261, "\u00a0": 0.4761,
  "\u2190": 1.3973, "\u2192": 1.3973, "\u2194": 1.5395, "\u2191": 0.6973, "\u2193": 0.6973,
};
""")
print("the arrow is as heavy as the digits, within the line")
