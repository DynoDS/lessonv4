"""Success criteria (4.2.288): tests the first check asked for (its gap 2).
A design that puts criteria on its worksheet is refused by the validator; a
criteria panel inside a row is refused by the sheet engine, and the
designer's own preflight reports it before the build."""
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


patch("scripts/tests/test_lesson_design_contract.py", [
    ("def test_success_criteria_colour_marks_are_checked():\n",
     "def test_a_worksheet_never_carries_success_criteria():\n"
     "    # The teacher, 23 September 2026: \"I don't want any success criteria on\n"
     "    # worksheets.\" They stay on the board, where children consult them.\n"
     "    design, photos = valid_contract()\n"
     "    module.validate_design(design, photos)\n"
     "    design[\"worksheet\"][\"successCriteriaRefs\"] = [design[\"successCriteria\"][0][\"id\"]]\n"
     "    assert_invalid_contract(design, photos, \"worksheet.successCriteriaRefs must be []\")\n"
     "\n"
     "\n"
     "def test_success_criteria_colour_marks_are_checked():\n"),
])

patch("worksheet-html/test/page-furniture.test.js", [
    ("  assert.throws(() => renderSheet(sheet), /CRITERIA_NOT_ON_SHEETS/);\n});\n",
     "  assert.throws(() => renderSheet(sheet), /CRITERIA_NOT_ON_SHEETS/);\n"
     "\n"
     "  // Inside a row it is still found, at the build and in the designer's own\n"
     "  // preflight, which must never call a sheet clean that the build refuses.\n"
     "  const inRow = {\n"
     "    layout: \"stack\",\n"
     "    zones: { a: { stack: [\n"
     "      { helper: \"questions\", question: true, items: [\"Round 2,748 to the nearest 100.\"] },\n"
     "      { row: [{ helper: \"instruction\", text: \"Use the chart.\" }, STEPS] },\n"
     "    ] } },\n"
     "  };\n"
     "  assert.throws(() => renderSheet(inRow), /CRITERIA_NOT_ON_SHEETS/);\n"
     "  const { checkWorksheet } = require(\"../src/worksheet\");\n"
     "  const report = checkWorksheet({\n"
     "    meta: { lesson: \"T\", lo: \"L\", yearGroup: 4 },\n"
     "    sheets: { expected: inRow },\n"
     "  });\n"
     "  assert.equal(report.length, 1);\n"
     "  assert.match(report[0].badZones.join(\" \"), /CRITERIA_NOT_ON_SHEETS/);\n"
     "});\n"),
])
