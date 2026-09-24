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


patch("references/slide-success-criteria.md", [
    # Decision 11: no step default.
    ("Five short steps is a useful default, not the capacity of every composition. Try the complete approved method",
     "There is no default or capacity in steps. Try the complete approved method"),
    # Decisions 3 and 4.
    ("past half, show fewer criteria on the slide or give them that slide of their own.",
     "past half, the repair is a different composition for the work beside them, never fewer criteria, and a `success-criteria` slide is only for criteria being taught, compared or built with the class, never for criteria that did not fit."),
    # Decision 13: the slide designer makes it fit; it does not report the criteria back.
    ("If no supported composition can present the necessary work, report the specific representation or layout capability needed through the existing repair route rather than pretending the lesson only needs five steps.",
     "When a composition does not hold the whole list, try a roomier one (the full height of one side, the question and the working space arranged around the panel); the criteria are not reported back as unfittable, and never reshaped or cut to fit."),
])

patch("references/templates.md", [
    # Decision 4.
    ("Use when the criteria needs space — a large table, a detailed step list, a classification chart.",
     "Use it only for criteria being taught, compared or built with the class (a classification chart built live, the vertebrates table), never for criteria that did not fit beside the work."),
    # Decision 13.
    ("Check the nested type's own row before nesting it, and put a criteria table in a wide zone or give the same criteria as lines.",
     "Check the nested type's own row before nesting it, and put a criteria table in a wide zone; a table stays a table and is never turned into lines."),
    # Decision 7: an example a child can use.
    ('{ "type": "steps", "steps": ["Read the question.", "Underline the key information.", "Solve."] }',
     '{ "type": "steps", "steps": ["Change the ones digit to 0.", "Add 10.", "Mark halfway and your number.", "Round to the nearer ten. If it is halfway, round up."] }'),
    # Decision 11: the final check blocks on the caption band only.
    ("The Slide Designer's final `check-slide-design.js` gate treats them as blocking composition diagnostics because a candidate may not be promoted while either fixed surface is below its readable capacity.",
     "The Slide Designer's final `check-slide-design.js` gate treats `FIXED_CAPTION_CAPACITY` as a blocking composition diagnostic, because a candidate may not be promoted while a fixed caption band is below its readable capacity; `SUCCESS_CRITERIA_CAPACITY` only reports, because a method with six real steps is a method with six real steps and \"too much\" is a judgement, not a number."),
])

# The rest ran as s4b_rest.py (the contract's example is laid out one step per line).
