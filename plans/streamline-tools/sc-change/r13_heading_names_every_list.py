"""Success criteria (4.2.288), the second check's finding 8: the review page's
worksheet heading named only the last beat with criteria, by a label that can
repeat. It now names, for each criteria list the lesson shows, the last beat
that showed it, and says which of a repeated label it is."""
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


patch("scripts/design-review-packet.py", [
    ("    board's; the heading names the last ones shown before it, so the reviewer\n"
     "    checks they fit the sheet's own task, not only the board task they served.\"\"\"\n"
     "    shown = \"\"\n"
     "    for unit in design.get(\"teachingSequence\") or []:\n"
     "        if unit.get(\"successCriteriaRefs\"):\n"
     "            shown = unit.get(\"label\") or \"\"\n"
     "    if not shown:\n"
     "        return \"Worksheet\"\n"
     "    return f\"Worksheet (done beside the success criteria shown above at {shown})\"\n",
     "    board's; the heading names, for each list the lesson shows, the last beat\n"
     "    that showed it, so the reviewer checks they fit the sheet's own task, not\n"
     "    only the board task they served. A label the lesson uses more than once is\n"
     "    told apart by its place (\"the second Your Turn\").\"\"\"\n"
     "    units = design.get(\"teachingSequence\") or []\n"
     "    labels = [unit.get(\"label\") or \"\" for unit in units]\n"
     "    last_shown: dict[str, int] = {}\n"
     "    for index, unit in enumerate(units):\n"
     "        for ref in unit.get(\"successCriteriaRefs\") or []:\n"
     "            if isinstance(ref, str):\n"
     "                last_shown[ref] = index\n"
     "    if not last_shown:\n"
     "        return \"Worksheet\"\n"
     "    places = []\n"
     "    for index in sorted(set(last_shown.values())):\n"
     "        label = labels[index]\n"
     "        if labels.count(label) > 1:\n"
     "            nth = labels[: index + 1].count(label)\n"
     "            words = [\"first\", \"second\", \"third\", \"fourth\", \"fifth\"]\n"
     "            place = words[nth - 1] if nth <= len(words) else f\"number {nth}\"\n"
     "            label = f\"the {place} {label}\"\n"
     "        places.append(label)\n"
     "    return f\"Worksheet (done beside the success criteria shown above at {' and at '.join(places)})\"\n"),
])

patch("scripts/tests/test_design_review_packet.py", [
    ("def test_the_view_opens_with_the_lesson_as_the_class_meets_it():\n",
     "def test_the_sheet_heading_names_each_list_and_tells_repeated_labels_apart():\n"
     "    design, photos = content_based_design()\n"
     "    units = design[\"teachingSequence\"]\n"
     "    for unit in units:\n"
     "        unit[\"successCriteriaRefs\"] = []\n"
     "    first, second = units[0], units[-1]\n"
     "    first[\"label\"] = second[\"label\"] = \"Your Turn\"\n"
     "    first[\"successCriteriaRefs\"] = [design[\"successCriteria\"][0][\"id\"]]\n"
     "    design[\"successCriteria\"].append(dict(design[\"successCriteria\"][0], id=\"sc-extra\"))\n"
     "    second[\"successCriteriaRefs\"] = [\"sc-extra\"]\n"
     "    heading = packet_module.worksheet_heading(design)\n"
     "    assert heading == (\n"
     "        \"Worksheet (done beside the success criteria shown above at the first Your Turn \"\n"
     "        \"and at the second Your Turn)\"\n"
     "    )\n"
     "    for unit in units:\n"
     "        unit[\"successCriteriaRefs\"] = []\n"
     "    assert packet_module.worksheet_heading(design) == \"Worksheet\"\n"
     "\n"
     "\n"
     "def test_the_view_opens_with_the_lesson_as_the_class_meets_it():\n"),
])
