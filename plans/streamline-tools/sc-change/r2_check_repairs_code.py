"""Success criteria (4.2.288): code repairs from the first check.

4a: the worksheet designer's own preflight reports a criteria panel (the build
refused it only after the preflight had passed the sheet), and the scaffold
writes an empty worksheet criteria list instead of asking for one. 4b: the
review page's second-sentence cue asks again about explanation and a second
step, beside the teacher's two answers. 2e: the wall build's overflow message
says a success-criteria step is never shortened."""
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


patch("worksheet-html/src/render.js", [
    ("module.exports = {\n  NOT_ON_SHEETS,\n", "module.exports = {\n  NOT_ON_SHEETS,\n  criteriaPanelsOn,\n"),
])
patch("worksheet-html/src/worksheet.js", [
    ('const { checkFit } = require("./render");\n',
     'const { checkFit, criteriaPanelsOn } = require("./render");\n'),
    ("  const badZones = [];\n  for (const [id, content] of Object.entries(sheet.spec.zones)) {\n",
     "  const badZones = [];\n"
     "  // Refused here as well as at the build, so the preflight never calls a\n"
     "  // sheet clean that the build will turn back: success criteria stay on the\n"
     "  // board (the teacher, 23 September 2026).\n"
     "  for (const where of criteriaPanelsOn(sheet.spec)) {\n"
     "    badZones.push(\n"
     "      `${where.replace(/^sheet\\./, \"\")}: CRITERIA_NOT_ON_SHEETS, a success-criteria ` +\n"
     "        \"(steps) panel. Success criteria stay on the board and are never printed on \" +\n"
     "        \"a worksheet; take the panel off the sheet.\"\n"
     "    );\n"
     "  }\n"
     "  for (const [id, content] of Object.entries(sheet.spec.zones)) {\n"),
])

patch("scripts/lesson-design-scaffold.py", [
    ('            "demand": PLACEHOLDER,\n            "successCriteriaRefs": [PLACEHOLDER],\n',
     '            "demand": PLACEHOLDER,\n'
     '            # Success criteria stay on the board and never go on a worksheet\n'
     '            # (the teacher, 23 September 2026), so there is nothing to decide.\n'
     '            "successCriteriaRefs": [],\n'),
])

patch("scripts/design-review-packet.py", [
    ('                f"step {index}: more than one sentence; does the second only "\n'
     '                "restate the step or name what it produced (then it goes), or "\n'
     '                "give a condition the step always meets (then it stays)?"\n',
     '                f"step {index}: more than one sentence; does the second only "\n'
     '                "name what the step produced, restate it or explain it (then it "\n'
     '                "goes), is it a second step, or is it a condition the step always "\n'
     '                "meets or a stem the child writes into (then it stays)?"\n'),
])
patch("scripts/tests/test_success_criteria_fit_a_glance.py", [
    ("    assert any('step 1: more than one sentence' in cue and 'then it stays' in cue for cue in cues)\n",
     "    # The equator example explains a word, so the cue asks about explanation.\n"
     "    assert any('step 1: more than one sentence' in cue and 'explain it (then it goes)' in cue for cue in cues)\n"
     "    assert any('is it a second step' in cue for cue in cues)\n"),
])
