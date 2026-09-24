"""Success criteria (4.2.288), the first check's 1a, review-page half: with no
criteria on a worksheet, the class view names the board criteria a child has in
view while doing the sheet, so the reviewer can check they fit the sheet's own
task (the check restored to the components file). The old test built a worksheet
carrying criteria, a state the validator now refuses; it is retargeted.

Applied as written, then corrected by hand: the heading named the criteria by
their ids, which the class view never prints, so it now names only the beat
("Worksheet (done beside the success criteria shown above at <label>)"), and the
test expects that."""
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


patch("scripts/design-review-packet.py", [
    ("    worksheet = design.get(\"worksheet\") or {}\n"
     "    if worksheet.get(\"status\") == \"generated\":\n"
     "        strings = class_view_worksheet(worksheet, criteria=criteria, sticky=sticky)\n"
     "        if strings:\n"
     "            blocks.append((\"Worksheet\", strings))\n",
     "    worksheet = design.get(\"worksheet\") or {}\n"
     "    if worksheet.get(\"status\") == \"generated\":\n"
     "        strings = class_view_worksheet(worksheet, criteria=criteria, sticky=sticky)\n"
     "        if strings:\n"
     "            blocks.append((worksheet_heading(design), strings))\n"),
    ("def build_class_view(design: dict) -> tuple[list[str], int]:\n",
     "def worksheet_heading(design: dict) -> str:\n"
     "    \"\"\"The worksheet's heading in the class view. Criteria are never printed\n"
     "    on a sheet (the teacher, 23 September 2026), so a child doing it uses the\n"
     "    board's; the heading names the last ones shown before it, so the reviewer\n"
     "    checks they fit the sheet's own task, not only the board task they served.\"\"\"\n"
     "    shown: tuple[str, list[str]] | None = None\n"
     "    for unit in design.get(\"teachingSequence\") or []:\n"
     "        refs = [ref for ref in unit.get(\"successCriteriaRefs\") or [] if isinstance(ref, str)]\n"
     "        if refs:\n"
     "            shown = (unit.get(\"label\") or \"\", refs)\n"
     "    if shown is None:\n"
     "        return \"Worksheet\"\n"
     "    label, refs = shown\n"
     "    return f\"Worksheet (done beside the board's criteria {', '.join(refs)}, shown above at {label})\"\n"
     "\n"
     "\n"
     "def build_class_view(design: dict) -> tuple[list[str], int]:\n"),
])

patch("scripts/tests/test_design_review_packet.py", [
    ("def test_reused_worksheet_criteria_are_resolved_beside_the_new_task():\n"
     "    \"\"\"Expose a semantic mismatch to the reviewer, without pretending the\n"
     "    packet builder can decide whether the support is pedagogically suitable.\n"
     "    \"\"\"\n",
     "def test_the_boards_criteria_are_named_beside_the_sheet_they_are_used_for():\n"
     "    \"\"\"Expose a semantic mismatch to the reviewer, without pretending the\n"
     "    packet builder can decide whether the support is pedagogically suitable.\n"
     "    Criteria are never printed on a sheet (23 September 2026), so the sheet\n"
     "    is headed with the board's criteria a child has in view while doing it.\n"
     "    \"\"\"\n"),
    ("    design[\"worksheet\"][\"successCriteriaRefs\"] = [\"sc-001\"]\n"
     "    design[\"worksheet\"][\"contentBlocks\"] = [{\n"
     "        \"id\": \"ws-stimulus-001\", \"kind\": \"stimulus-set\",\n",
     "    for unit in design[\"teachingSequence\"]:\n"
     "        unit[\"successCriteriaRefs\"] = []\n"
     "    practise = next(u for u in design[\"teachingSequence\"] if u[\"kind\"] == \"practise\")\n"
     "    practise[\"successCriteriaRefs\"] = [\"sc-001\"]\n"
     "    design[\"worksheet\"][\"successCriteriaRefs\"] = []\n"
     "    design[\"worksheet\"][\"contentBlocks\"] = [{\n"
     "        \"id\": \"ws-stimulus-001\", \"kind\": \"stimulus-set\",\n"),
    ("    section = class_view_section(packet_module.build_review_view(design, photos))\n"
     "    worksheet_view = section.split(\"### Worksheet\", 1)[1]\n"
     "    assert \"A detail from the toys and the account\" in worksheet_view\n"
     "    assert \"Account A describes school. Account B describes songs.\" in worksheet_view\n",
     "    section = class_view_section(packet_module.build_review_view(design, photos))\n"
     "    assert \"A detail from the toys and the account\" in section.split(\"### Worksheet\", 1)[0]\n"
     "    worksheet_view = section.split(\"### Worksheet\", 1)[1]\n"
     "    assert worksheet_view.startswith(\n"
     "        f\" (done beside the board's criteria sc-001, shown above at {practise['label']})\"\n"
     "    )\n"
     "    assert \"A detail from the toys and the account\" not in worksheet_view\n"
     "    assert \"Account A describes school. Account B describes songs.\" in worksheet_view\n"),
])
