"""Success criteria (4.2.288): the slide side and the build's messages, for
decisions 3, 4, 7, 11 and 13."""
from pathlib import Path

ROOT = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4")


def patch(rel: str, pairs) -> None:
    path = ROOT / rel
    t = path.read_text(encoding="utf-8")
    for old, new in pairs:
        assert t.count(old) == 1, (rel, t.count(old), old[:100])
        t = t.replace(old, new)
    path.write_text(t, encoding="utf-8")
    print("patched", rel)


patch("references/output-template.md", [
    # Decision 7.
    ('      "Read the question.",\n      "Choose the correct operation.",\n      "Work it out.",\n      "Check the answer."',
     '      "Compare the thousands digits first.",\n      "If they are the same, compare the hundreds.",\n      "Put < or > between the numbers, with the open side facing the greater number."'),
])

patch("builder/src/success-criteria-panel.js", [
    ("`smaller side of a wider one). If the criteria then do not fit at 18pt, use ` +\n"
     "      `a composition that shows fewer criteria on this slide, or put them on their ` +\n"
     "      `own \\`success-criteria\\` slide. Nothing was drawn smaller or cut.`",
     "`smaller side of a wider one). If the criteria then do not fit at 18pt, give ` +\n"
     "      `the panel the roomiest shape half the slide allows (the full height of one ` +\n"
     "      `side) and arrange the work beside it. Never show fewer criteria, and a ` +\n"
     "      `\\`success-criteria\\` slide is only for criteria being taught or built. ` +\n"
     "      `Nothing was drawn smaller or cut.`"),
    ("      // designer actually has - a roomier panel, or fewer criteria on the slide\n",
     "      // designer actually has - a roomier panel, never fewer criteria\n"),
])

patch("builder/src/content/steps.js", [
    ("`composition up to half the slide, or fewer criteria on this slide. See ` +",
     "`composition up to half the slide, never fewer criteria. See ` +"),
])

patch("builder/src/content/capacity.js", [
    ("// is being asked to hold, and the answer to \"too much\" is a teaching decision:\n"
     "// cut a criterion, split the beat, shorten the wording. None of those is the\n"
     "// builder's to make,",
     "// is being asked to hold, and the answer to \"too much\" is a design decision: a\n"
     "// roomier layout, or the lesson designer's own wording, and never a criterion\n"
     "// cut (the teacher's decision of 23 September 2026). None of those is the\n"
     "// builder's to make,"),
    ("        `${criteria.length} criteria, past the ${SC_MANY_ITEMS} the panel holds ` +\n"
     "        `at a readable size. Nothing was removed.`,",
     "        `${criteria.length} criteria on one panel: check the panel reads at the ` +\n"
     "        `back of the room beside the work (${SC_MANY_ITEMS} is a cue to look, not a ` +\n"
     "        `limit). Nothing was removed.`,"),
    ("        `success criteria total ${total} characters, past the ` +\n"
     "        `${SC_LONG_TOTAL_CHARS} the panel holds at a readable size. Nothing ` +\n"
     "        `was shortened.`,",
     "        `success criteria total ${total} characters: check the panel reads at ` +\n"
     "        `the back of the room beside the work (${SC_LONG_TOTAL_CHARS} is a cue to ` +\n"
     "        `look, not a limit). Nothing was shortened.`,"),
])

patch("scripts/tests/test_slide_designer_brain_contract.py", [
    ('            "final `check-slide-design.js` gate treats them as blocking composition diagnostics",\n',
     '            "final `check-slide-design.js` gate treats `FIXED_CAPTION_CAPACITY` as a blocking composition diagnostic",\n'
     '            # The gate does not block on the criteria count (the teacher\'s\n'
     '            # 10 September ruling); the guide said it did until 4.2.288.\n'
     '            "`SUCCESS_CRITERIA_CAPACITY` only reports",\n'),
])
