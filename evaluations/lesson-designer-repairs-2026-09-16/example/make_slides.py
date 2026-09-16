"""Lay out the example's slides from its lesson design.

This is not a Slide Designer run. The two apprentice Teach boards are the
teacher-approved boards, copied unchanged. The launch, task and check slides
take every child-facing string from `lesson-design.json` by reference, never
retyped, so `check_agreement.py` can prove the board, the kit and the teacher
file say the same thing. The only presentation changes are where a design
string is split at a sentence boundary onto separate lines.
"""
from __future__ import annotations

import copy
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
BOARDS = HERE.parents[2] / "plugins" / "lesson-v4" / "references" / "examples" / "tudor-teach-slides.lesson.json"


def main() -> None:
    design = json.loads((HERE / "lesson-design.json").read_text(encoding="utf-8"))
    boards = json.loads(BOARDS.read_text(encoding="utf-8"))["slides"]
    practise = next(u for u in design["teachingSequence"] if u["kind"] == "practise")
    launch = practise["content"]["launch"]
    task = practise["taskStructure"]
    answer = practise["answer"]
    heading = {g["id"]: g["label"] for g in task["groups"]}
    label = {i["id"]: i["label"] for i in task["items"]}
    notes = practise["speakerNotes"]
    unit_id = practise["sourceUnitId"]

    weak, strong = launch["goodLooksLike"].split(" A strong reason says: ", 1)
    strong = "A strong reason says: " + strong
    case_line, instruction = practise["content"]["task"].split("\n", 1)
    assert instruction == practise["pupilInstruction"]

    slides = [copy.deepcopy(boards[2]), copy.deepcopy(boards[3])]
    slides.append({
        "template": "split-h-50-50",
        "headerStyle": "title",
        "title": practise["label"],
        "designUnitId": unit_id,
        "primarySide": "left",
        "primary": {
            "type": "stack",
            "items": [
                {"type": "text", "value": launch["established"], "weight": 0.8},
                {"type": "text", "value": weak, "weight": 0.7, "sizeGroup": "pair"},
                {"type": "text", "value": strong, "weight": 1.1, "sizeGroup": "pair"},
            ],
        },
        "secondary": {"type": "steps", "steps": launch["steps"]},
        "speakerNotes": "Say to children: Before you start, here's what we know, and here's what a good reason looks like. "
        "The strong one is about shoes, not about Tom, so the thinking about Tom's cards is still yours.",
    })
    slides.append({
        "template": "split-h-50-50",
        "headerStyle": "title",
        "title": practise["label"],
        "designUnitId": unit_id,
        "photoRefs": practise["photoRefs"],
        "primarySide": "left",
        "primary": {
            "type": "image",
            "imagePath": "unsplash/tudor-bread-making.jpg",
            "caption": "Reconstruction of Tudor bread-making",
            "fit": "contain",
            "essential": True,
        },
        "secondary": {
            "type": "stack",
            "items": [
                {"type": "text", "value": case_line, "weight": 0.8},
                {"type": "text", "value": heading["group-001"], "sizeGroup": "headings", "align": "center", "weight": 0.6},
                {"type": "text", "value": heading["group-002"], "sizeGroup": "headings", "align": "center", "weight": 0.6},
                {"type": "text", "value": instruction, "colorRole": "focus-blue", "weight": 1.0},
            ],
        },
        "speakerNotes": f"{notes['script']}\n\nTeacher information: {notes['teacherInfo']}\n\n{notes['lookFor']}",
    })
    by_group = {gid: [] for gid in heading}
    for placement in answer["structure"]["placements"]:
        by_group[placement["groupRef"]].append(label[placement["itemRef"]])
    column = lambda gid: {
        "type": "stack",
        "items": [{"type": "text", "value": heading[gid], "align": "center", "weight": 0.8}]
        + [{"type": "text", "value": "||" + card, "sizeGroup": "key"} for card in by_group[gid]],
    }
    slides.append({
        "template": "split-h-50-50",
        "headerStyle": "title",
        "title": practise["label"] + " - check",
        "designUnitId": unit_id,
        "primarySide": "left",
        "primary": column("group-001"),
        "secondary": column("group-002"),
        "speakerNotes": "Say to children: Check your cards against these. Then read your reason for the hardest card to your partner.\n\n"
        f"Acceptance condition: {answer['acceptanceCondition']}",
    })

    lesson = {
        "lessonName": "Why did Tudor children work - repair example",
        "yearGroup": "Year 4",
        "subject": "History",
        "lo": design["lesson"]["displayedLo"],
        "notes": [],
        "slides": slides,
    }
    (HERE / "lesson.json").write_text(json.dumps(lesson, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote lesson.json with {len(slides)} slides")


if __name__ == "__main__":
    main()
