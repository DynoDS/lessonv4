"""Check that the example's teaching, instructions, materials and answers agree.

Reads the lesson design, the built slide spec, the card kit spec, the built
kit pages and the teacher's answers file, and compares them string for
string. Prints one line per check and exits 1 if any disagree. Run after
make_design.py, make_kit.py, make_slides.py and both builds.
"""
from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "output"
BOARDS = HERE.parents[2] / "plugins" / "lesson-v4" / "references" / "examples" / "tudor-teach-slides.lesson.json"

results: list[tuple[bool, str]] = []


def check(ok: bool, what: str) -> None:
    results.append((bool(ok), what))


def texts(node) -> list[str]:
    """Every string a slide shows, in order."""
    found: list[str] = []
    if isinstance(node, dict):
        if isinstance(node.get("value"), str):
            found.append(node["value"])
        for key, value in node.items():
            if key in {"speakerNotes", "value", "imagePath", "template", "layout", "type", "designUnitId", "colorRole", "sizeGroup", "align", "fit", "headerStyle", "primarySide"}:
                continue
            if isinstance(value, str) and key in {"title", "lead", "question", "sticky", "caption"}:
                found.append(value)
            elif isinstance(value, list) and all(isinstance(v, str) for v in value):
                found.extend(value)
            else:
                found.extend(texts(value))
    elif isinstance(node, list):
        for item in node:
            found.extend([item] if isinstance(item, str) else texts(item))
    return found


def main() -> int:
    design = json.loads((HERE / "lesson-design.json").read_text(encoding="utf-8"))
    lesson = json.loads((HERE / "lesson.json").read_text(encoding="utf-8"))
    kit = json.loads((HERE / "stick-in-sheets.json").read_text(encoding="utf-8"))["items"][0]
    boards = json.loads(BOARDS.read_text(encoding="utf-8"))["slides"]
    pages = (OUT / "Why did Tudor children work - Stick-in Sheets.html").read_text(encoding="utf-8")
    answers = (OUT / "Why did Tudor children work - Stick-in Sheets - Answers.txt").read_text(encoding="utf-8")
    pupil_pages = html.unescape(pages)

    seq = design["teachingSequence"]
    teach = next(u for u in seq if u["sourceUnitId"].endswith("unit-003"))
    practise = next(u for u in seq if u["kind"] == "practise")
    task, answer, launch = practise["taskStructure"], practise["answer"], practise["content"]["launch"]
    groups = [g["label"] for g in task["groups"]]
    heading_by_id = {g["id"]: g["label"] for g in task["groups"]}
    label_by_id = {i["id"]: i["label"] for i in task["items"]}
    slides = lesson["slides"]
    task_slide, check_slide = slides[3], slides[4]
    sets = kit["spec"]["sets"]
    set_count = 15  # one set between two for a class of 30

    # Lesson order: the Teach leads straight into the Practise that uses it.
    kinds = [u["kind"] for u in seq]
    check(kinds == ["teach", "do", "teach", "practise"], f"route is {kinds}: a Teach -> Do pair, then a Teach used by the Practise straight after it")

    # Teaching: the approved boards are used unchanged, and they teach both headings' ideas.
    check(slides[0] == boards[2] and slides[1] == boards[3], "the two apprentice Teach slides are the teacher-approved boards, unchanged")
    board_text = " ".join(texts(slides[0]) + texts(slides[1]))
    for line in teach["content"]["explanation"].split("\n"):
        check(line in board_text, f"Teach explanation line is on the board: {line!r}")
    sticky = next(s["text"] for s in design["stickyKnowledge"] if s["id"] == "sk-002")
    check(sticky == slides[1]["sticky"], "the sticky sentence the sort rests on (help now, help later) is on the deal slide")
    for word in ("food", "clothes", "bed"):
        check(word in board_text, f"the deal slide teaches {word!r}, which a straight-away card uses")
    check("earn a living later" in board_text, "the deal slide teaches earning a living later, which a grew-up card uses")

    # Instructions: design, board, kit and teacher file.
    instruction = practise["pupilInstruction"]
    check(kit["spec"]["instruction"] == instruction, "kit instruction equals the design's pupilInstruction")
    check(instruction in texts(task_slide), "the task slide shows the same instruction")
    check(f"Children are told: {instruction}" in answers, "the teacher's file carries the same instruction")
    check(kit["spec"]["teacher"]["where"] == task["handling"]["where"] and f"Prepare: {task['handling']['where']}" in answers, "preparation line agrees across design, kit and teacher file")

    # Materials: headings and cards, including each card's detail.
    check([h["label"] for h in kit["spec"]["headings"]] == groups, "kit headings equal the design's groups")
    check(all(g in texts(task_slide) for g in groups), "the task slide shows both headings")
    check(f"Headings: {' | '.join(groups)}" in answers, "the teacher's file names the same headings")
    for item in task["items"]:
        kit_card = next(c for c in kit["spec"]["cards"] if c["id"] == item["id"])
        check(kit_card["label"] == item["label"] and kit_card.get("detail") == item["detail"], f"kit card {item['id']} equals the design item, label and detail")
        check(pupil_pages.count(f">{item['label']}<") == set_count, f"card label printed once per set ({set_count}): {item['label']!r}")
        check(pupil_pages.count(f">{item['detail']}<") == set_count, f"card detail printed once per set ({set_count}): {item['detail']!r}")
    for g in groups:
        check(pupil_pages.count(f">{g}<") == set_count, f"heading card printed once per set: {g!r}")
    check(pupil_pages.count(">Tom&#39;s deal<") + pupil_pages.count(">Tom's deal<") >= set_count * (len(groups) + len(task["items"])), "every printed card and heading carries the kit's tag")

    # Answers: key and acceptance, and nothing of the key on pupil pages.
    placements = {p["itemRef"]: p["groupRef"] for p in answer["structure"]["placements"]}
    kit_key = {r["cardId"]: r["headingId"] for r in kit["spec"]["teacher"]["answer"]}
    check(kit_key == placements, "kit key equals the design's structured answer")
    for item_id, group_id in placements.items():
        check(f"{label_by_id[item_id]} -> {heading_by_id[group_id]}" in answers, f"teacher file places {label_by_id[item_id]!r}")
    for column, group_id in ((check_slide["primary"], "group-001"), (check_slide["secondary"], "group-002")):
        shown = [t for t in texts(column)]
        want = [heading_by_id[group_id]] + ["||" + label_by_id[i] for i, g in placements.items() if g == group_id]
        check(shown == want, f"check slide column {heading_by_id[group_id]!r} matches the key")
    accept = answer["acceptanceCondition"]
    check(kit["spec"]["teacher"]["alsoAccept"] == accept and f"Also accept: {accept}" in answers, "acceptance condition agrees across design, kit and teacher file")
    check(f"Acceptance condition: {accept}" in check_slide["speakerNotes"], "the check slide's notes carry the same acceptance condition")
    check("->" not in pupil_pages and "Also accept" not in pupil_pages, "no key or acceptance note on the pupil pages")

    # The launch shows a good reason on a case the task does not ask about.
    card_text = " ".join(label_by_id.values()).lower()
    strong = launch["goodLooksLike"].split("A strong reason says:", 1)[1]
    check("shoes" in strong and "shoes" not in card_text and "Tom" not in strong, "the launch's strong reason is about a pair of shoes, not one of Tom's cards")
    check(all(step in texts(slides[2]) for step in launch["steps"]), "the launch slide shows the design's steps")

    # No em or en dashes in anything the example wrote.
    for path in (HERE / "lesson-design.json", HERE / "lesson.json", HERE / "stick-in-sheets.json", OUT / "Why did Tudor children work - Stick-in Sheets - Answers.txt"):
        dashes = "[" + chr(0x2013) + chr(0x2014) + "]"
        check(not re.search(dashes, path.read_text(encoding="utf-8")), f"no em or en dash in {path.name}")

    failed = [what for ok, what in results if not ok]
    for ok, what in results:
        print(("AGREE    " if ok else "DISAGREE ") + what)
    print(f"\n{len(results) - len(failed)} of {len(results)} checks agree")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
