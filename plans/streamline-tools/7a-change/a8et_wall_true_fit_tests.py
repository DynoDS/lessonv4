"""Release 7A (4.2.293), step 8e's tests: nothing prints past a panel's edge,
and a long sticky fact keeps its photo and its whole sentence.

`working-wall-html/test/nothing-prints-past-a-panel-edge.test.js` (from
`7a-change/new/`) builds every saved sticky fact of 73 to 106 letters (48, from
his lessons on 26 September 2026) beside a photo, with the Christmas wall's card,
two worked examples the second check found printing past their panels and a
saved worked example over a captioned number line, and measures each in the
Chrome the wall prints with: the picture is there, every sentence is printed
whole, no line of text strays into its panel's padding or past its edge, and
the fitter's own measure of the items, at the size and width drawn, is what
Chrome drew to a pixel. A fact a few letters over its budget narrows its photo
only a little (65% of the sheet for its words), and the line box the fitter
plans is the one Chrome draws (67px at 36pt, 149px at 80pt). The
doc-claims test follows the budgets (a sticky fact of 73 and of 106 letters
builds beside its photo, 109 is refused), the preferences' new sticky row, and
the refusal's order (the picture narrowed, a list over a second card, a shorter
whole sentence, the picture off last of all).

`working-wall-html/test/each-panel-card-prints-the-lines-it-planned.test.js`
(from `7a-change/new/`) builds cards of each of the five panel types, beside a
photo or a drawing, stacked over a figure and on their own, prints each in
Chrome, and holds every item to its plan: the lines it planned are the lines it
printed, its height is within a pixel and a half of the plan, and no text
strays into a panel's padding."""
import shutil
from pathlib import Path

from _patch import ROOT, replace_once

DOC_CLAIMS = "working-wall-html/test/doc-claims.test.js"

# --- working-wall-html/test/doc-claims.test.js (4 replacements) ---
replace_once(DOC_CLAIMS,
             r"""      assert.match(message, /to a whole sentence with the same meaning and never a clipped phrase/, "a shortened item stays a whole sentence");
      assert.doesNotMatch(message, /Cut it to/, "the refusal no longer tells the designer to cut first");
""",
             r"""      assert.match(message, /to a whole sentence with the same meaning and never a clipped phrase/, "a shortened item stays a whole sentence");
      assert.match(message, /the picture comes off last of all/, "the picture comes off only as the last move");
      assert.doesNotMatch(message, /Cut it to/, "the refusal no longer tells the designer to cut first");
""")
replace_once(DOC_CLAIMS,
             r"""        message,
        /needs room before its words change: any picture beside it has already given up a little width, so next carry a list over a second card, and take the picture off only when nothing else fits/,
        "the refusal must lead with making room"
""",
             r"""        message,
        /needs room before its words change: any picture beside it has already narrowed \(a sticky fact's photo to about a third of the card\), so next carry a list over a second card; only if it still will not fit is it shortened/,
        "the refusal must lead with making room"
""")
replace_once(DOC_CLAIMS,
             r"""    "working-wall-preferences.md no longer quotes the budget once the picture gives way"
  );
""",
             r"""    "working-wall-preferences.md no longer quotes the budget once the picture gives way"
  );
  assert.ok(
    read(path.join(refDir, "working-wall-preferences.md")).includes("about 106 characters once the photo has narrowed to about a third of the card"),
    "working-wall-preferences.md no longer quotes a sticky fact's budget beside a photo narrowed to a third"
  );
""")
replace_once(DOC_CLAIMS,
             r"""  assert.equal(await itemOfLengthBuilds(dir, 72, true), true, "a 72-character item should build with the picture a little smaller");
  assert.equal(await itemOfLengthBuilds(dir, 73, true), false, "73 characters should be over even with the picture a little smaller");
  assert.equal(await itemOfLengthBuilds(dir, 106, false), true, "a 106-character item on a full-width card should build");
""",
             r"""  assert.equal(await itemOfLengthBuilds(dir, 72, true), true, "a 72-character item should build with the picture a little smaller");
  // His second answer (26 September 2026, "yys"): a sticky fact too long for
  // that keeps its photo too, narrowed to about a third of the card, and runs
  // to three lines at the floor size.
  assert.equal(await itemOfLengthBuilds(dir, 73, true), true, "a 73-character fact should build beside its photo narrowed to a third");
  assert.equal(await itemOfLengthBuilds(dir, 106, true), true, "a 106-character fact should build beside its photo narrowed to a third");
  assert.equal(await itemOfLengthBuilds(dir, 109, true), false, "109 characters should be over even beside a photo narrowed to a third");
  assert.equal(await itemOfLengthBuilds(dir, 106, false), true, "a 106-character item on a full-width card should build");
""")

NEW = Path(__file__).resolve().parent / "new"
for name in ("nothing-prints-past-a-panel-edge.test.js", "each-panel-card-prints-the-lines-it-planned.test.js"):
    shutil.copyfile(NEW / name, ROOT / "working-wall-html" / "test" / name)
print("the true-fit tests written")
