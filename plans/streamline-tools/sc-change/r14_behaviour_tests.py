"""Success criteria (4.2.288), the second check's finding 6: two code repairs
were held only by a comment. These tests hold the behaviour."""
from pathlib import Path

ROOT = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4")


def patch(rel: str, pairs) -> None:
    path = ROOT / rel
    raw = path.read_bytes().decode("utf-8")
    crlf = "\r\n" in raw
    t = raw.replace("\r\n", "\n")
    for old, new in pairs:
        assert t.count(old) == 1, (rel, t.count(old), old[:100])
        t = t.replace(old, new)
    if crlf:
        t = t.replace("\n", "\r\n")
    path.write_bytes(t.encode("utf-8"))
    print("patched", rel)


patch("scripts/tests/test_lesson_design_scaffold.py", [
    ("def test_content_scaffold_assigns_mechanical_ids_and_envelopes():\n",
     "def test_a_generated_worksheet_is_scaffolded_without_success_criteria():\n"
     "    # The teacher, 23 September 2026: \"I don't want any success criteria on\n"
     "    # worksheets.\" The template never asks for them, so there is nothing to\n"
     "    # fill in that the validator would then refuse.\n"
     "    for request in (base_request(), skill_request()):\n"
     "        design, _ = scaffold.build_scaffold(request)\n"
     "        assert design[\"worksheet\"][\"status\"] == \"generated\"\n"
     "        assert design[\"worksheet\"][\"successCriteriaRefs\"] == []\n"
     "\n"
     "\n"
     "def test_content_scaffold_assigns_mechanical_ids_and_envelopes():\n"),
])

patch("scripts/tests/test_success_criteria_fit_a_glance.py", [
    ("def test_guidance_names_both_misses_so_clear_steps_are_not_lengthened():\n",
     "def test_a_panel_that_fits_is_not_flagged_to_check_before_teaching():\n"
     "    # The capacity numbers are a cue to look, not a fault (the teacher, 10 and\n"
     "    # 23 September 2026), so they never join the slides listed as needing a\n"
     "    # check before teaching. Read from the list itself, not its comment.\n"
     "    import re\n"
     "    build = (ROOT / 'builder/build.js').read_text(encoding='utf-8')\n"
     "    listed = re.search(r'const FLAGGING_SIGNALS = new Set\\(\\[(.*?)\\]\\);', build, re.S)\n"
     "    assert listed, 'the list of flagging signals has moved'\n"
     "    entries = re.findall(r\"^\\s*'([A-Z_]+)',\", listed.group(1), re.M)\n"
     "    assert 'FIXED_CAPTION_CAPACITY' in entries\n"
     "    assert 'SUCCESS_CRITERIA_CAPACITY' not in entries\n"
     "\n"
     "def test_guidance_names_both_misses_so_clear_steps_are_not_lengthened():\n"),
])
