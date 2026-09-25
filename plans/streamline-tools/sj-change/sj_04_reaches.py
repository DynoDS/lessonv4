"""The subject-files release (topic 8, release 1), step 4: decision 8 (his 5,
"yes"). The science file says recognised circuit symbols belong to Year 6 and a
Year 4 build-and-draw lesson uses a labelled picture of the loop (SJ-H07), while
the guidance for drawing a circuit offered only the standard-symbol drawing,
said it covers the whole electricity unit, and named no year. The science file
stays as it is; the circuit drawing's guidance says, one sentence in each place
a designer reads it, that it is for Year 6 symbol work and that a Year 4 lesson
shows a labelled photograph of a real circuit instead.

The places, and why each: the slide catalogue's row and the drawing's own
section in `templates.md` (the slide designer's); the science helper guide
(the worksheet designer's, which holds the "whole electricity unit" line); and
the wall's card contract, which offers the drawing as "Wall material for an
electricity unit". Each surface can draw what the sentence names: `label-diagram`
on a photograph is a slide helper, a worksheet helper and a wall visual.

Left alone, and why: the generated worksheet catalogue's line ("One series
circuit or a row of them in the standard symbols, each carrying its own state")
makes no claim about the unit or a year, and changing it means changing the
sheet engine's purpose list; the stick-in pedagogy only says to copy the
slide's drawing; the wall's visual-language list only names what it can draw;
the engine's code comment ("one helper covers the whole electricity unit")
describes the drawing's states, not a year. The symbol key (`circuit-symbol-bank`)
is not the circuit drawing his answer named, and is left as it is.

Nothing refuses `circuit-diagram` in a Year 4 lesson, and nothing new does:
this is guidance, and the reviewer's curriculum check is the net."""
from _patch import SCIENCE_HELPERS, TEMPLATES, WALL, assert_present, replace_once

YEAR_6 = ("Standard circuit symbols are Year 6 work (`subject-science.md`); a Year 4 lesson shows a labelled "
          "photograph of a real circuit instead (`label-diagram` on the photograph).")

replace_once(
    TEMPLATES,
    "Use for reading, comparing and reasoning about primary circuit diagrams, not as a realistic equipment picture |",
    "Use for reading, comparing and reasoning about primary circuit diagrams, not as a realistic equipment picture. "
    + YEAR_6 + " |",
)
replace_once(
    TEMPLATES,
    "switches have clear open and closed positions. This is a schematic, not a realistic equipment picture.\n",
    "switches have clear open and closed positions. This is a schematic, not a realistic equipment picture. "
    + YEAR_6 + "\n",
)
replace_once(
    SCIENCE_HELPERS,
    "`circuit-diagram` draws one series circuit or a row of them in the standard\n"
    "schematic symbols. Each circuit carries its own state, so one helper covers the\n"
    "whole electricity unit: a working circuit, a broken one, a switch open.\n",
    "`circuit-diagram` draws one series circuit or a row of them in the standard\n"
    "schematic symbols. Each circuit carries its own state, so one helper covers the\n"
    "whole electricity unit: a working circuit, a broken one, a switch open.\n"
    "Standard circuit symbols are Year 6 work (`subject-science.md`); a Year 4 lesson\n"
    "shows a labelled photograph of a real circuit instead (`label-diagram` on the\n"
    "photograph).\n",
)
replace_once(
    WALL,
    "Wall material for an electricity unit: the anchor a child checks their own circuit against all term. ",
    "Wall material for an electricity unit: the anchor a child checks their own circuit against all term. "
    + YEAR_6 + " ",
)

for rel in (TEMPLATES, SCIENCE_HELPERS, WALL):
    assert_present(rel, YEAR_6)
# The mechanism the sentence names exists on every surface it is written for.
assert_present(TEMPLATES, "### `label-diagram`")
assert_present(WALL, "### label-diagram")
assert_present("references/worksheet-helpers/catalogue.md", "#### `label-diagram`")
print("the circuit drawing's guidance says it is Year 6 symbol work")
