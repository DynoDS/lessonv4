"""Make the example's lesson design from the saved Tudor run.

The source is the real saved run for "Why did Tudor children work?"
(`source/lesson-design.json`, copied unchanged from
lesson-resources-output/working/year-4-history-lesson-2). This keeps its
starter and first Teach -> Do pair exactly, puts the teacher-approved board
wording (`plugins/lesson-v4/references/examples/tudor-teach-slides.lesson.json`)
into the apprentice Teach, and makes the baker beat that followed it the main
Practise in the same place: a card sort at tables with a printed kit. The
later beats of the saved lesson are left out, so this is a short lesson, not
the whole one.

It writes `lesson-design.json` and `photo-requirements.json` beside it.
"""
from __future__ import annotations

import copy
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
SOURCE = HERE / "source"
BOARDS = HERE.parents[2] / "plugins" / "lesson-v4" / "references" / "examples" / "tudor-teach-slides.lesson.json"


def text(value):
    return value["value"] if isinstance(value, dict) else value


def main() -> None:
    saved = json.loads((SOURCE / "lesson-design.json").read_text(encoding="utf-8"))
    photos = json.loads((SOURCE / "photo-requirements.json").read_text(encoding="utf-8"))
    boards = json.loads(BOARDS.read_text(encoding="utf-8"))["slides"]
    first, deal = boards[2], boards[3]

    design = copy.deepcopy(saved)
    design["lesson"]["durationMinutes"] = 25
    design["lesson"]["stickingPoint"] = (
        "Children may list what an apprentice got without saying when each part helped him: "
        "while he was learning, or once he was grown up."
    )
    design["teacherOrientation"] = (
        "Teacher orientation: This short lesson teaches children what a Tudor apprenticeship gave a child. "
        "After a farm household and one consequence question, the class meets the apprentice's deal, then "
        "sorts a baker's apprentice's cards at tables under two headings: helped him straight away, or helped "
        "him when he grew up. Prepare one card set between two. The tricky card is knowing when bread is baked "
        "just right, which helped him both then and later; either heading is right with a reason."
    )

    starter, unit1, unit2, unit3, unit4 = (
        design["starter"], *design["teachingSequence"][:4]
    )

    # The saved run predates the rule that a Teach names the thought the class
    # works out while it is taught; these are the key questions' own thoughts.
    unit1["thinking"] = "How does fetching fuel help a household with no shop and no electricity?"
    unit3["thinking"] = "The apprentice was not paid, so what did he get for his work?"

    # The apprentice Teach carries the approved boards' own words, in order.
    unit3["label"] = first["title"]
    unit3["content"]["headline"] = first["title"]
    unit3["content"]["explanation"] = "\n".join(
        [text(first["lead"])] + [text(line) for line in first["lines"]] + [text(line) for line in deal["lines"]]
    )
    unit3["content"]["keyQuestions"] = [deal["question"]]
    unit3["unlocks"] = (
        "They know the deal gave help now (food, clothes, a bed) and help later (a trade to earn a living), "
        "which the card sort straight after it uses."
    )
    unit3["misconceptionRefs"] = []
    unit3["speakerNotes"] = {
        "script": first["speakerNotes"].split("\n\nTeacher information:")[0]
        + " " + deal["speakerNotes"].split("\n\nTeacher information:")[0].removeprefix("Say to children: "),
        "teacherInfo": "Modern summary: Shakespeare Birthplace Trust, The Tudor Apprentice, pages 1 to 2. "
        "The craft is illustrative, not a record of a named apprentice.",
        "lookFor": None,
    }

    # The baker beat that followed it becomes the main Practise, in the same place.
    instruction = (
        "Put each card under a heading. Then pick the card that was hardest to place, "
        "and write why you put it there."
    )
    unit4.update({
        "label": "Help now or help later?",
        "kind": "practise",
        "thinking": "When did this part of Tom's deal help him: while he was still learning, once he was grown up, or both?",
        "unlocks": None,
        "content": {
            "activity": "Pairs sort the cards for Tom, a baker's apprentice, under two headings at tables; then each child writes one reason for the card they found hardest to place.",
            "format": "card sort at tables, then one written reason",
            "task": "Imagined Tudor case: a baker takes on an apprentice called Tom.\n" + instruction,
            "launch": {
                "established": "An apprenticeship gave two kinds of help: food and a home now, and a way to earn a living later.",
                "goodLooksLike": "A weak reason says: \"I put it there because it goes there.\" A strong reason says: \"I put a pair of shoes his master made him under Helped him straight away, because he could wear them now.\" The strong one says when it helped him.",
                "steps": [
                    "Read each card with your partner.",
                    "Put each card under a heading.",
                    "Pick the card that was hardest to place.",
                    "Write why you put it there.",
                ],
            },
        },
        "pupilInstruction": instruction,
        "taskStructure": {
            "kind": "sort",
            "groups": [
                {"id": "group-001", "label": "Helped him straight away"},
                {"id": "group-002", "label": "Helped him when he grew up"},
            ],
            "items": [
                {"id": "item-001", "label": "a hot dinner every day", "detail": "Tom eats at the baker's table.", "photoRef": None},
                {"id": "item-002", "label": "knowing when bread is baked just right", "detail": "The baker shows Tom how to tell.", "photoRef": None},
                {"id": "item-003", "label": "a straw mattress by the oven", "detail": "Tom sleeps in the warm bakehouse.", "photoRef": None},
                {"id": "item-004", "label": "his own bakery one day", "detail": "A trained baker can sell his own bread.", "photoRef": None},
                {"id": "item-005", "label": "a warm coat for winter", "detail": "The baker buys Tom a coat.", "photoRef": None},
            ],
            "handling": {
                "kind": "cards",
                "per": "pair",
                "groupCount": None,
                "where": "At tables, one set between two, straight after the deal slide.",
            },
        },
        "modellingState": None,
        "successCriteriaRefs": [],
        "stickyKnowledgeRefs": ["sk-002"],
        "misconceptionRefs": [],
        "photoRefs": ["photo-003"],
        "speakerNotes": {
            "script": "Say to children: This is Tom. He's a baker's apprentice, and these cards are his deal. With your partner, read each card and put it under a heading: did it help Tom straight away, or when he grew up? Then, on your own, pick the card that was hardest to place, and write why you put it there.",
            "teacherInfo": "Tom is an imagined case built from the taught deal. Show photo-003 with the case, captioned 'Reconstruction of Tudor bread-making'.",
            "lookFor": "Look for: knowing when bread is baked just right placed with a reason about when it helped.",
        },
        "answer": {
            "kind": "exact",
            "content": None,
            "structure": {
                "kind": "sort",
                "placements": [
                    {"itemRef": "item-001", "groupRef": "group-001"},
                    {"itemRef": "item-002", "groupRef": "group-002"},
                    {"itemRef": "item-003", "groupRef": "group-001"},
                    {"itemRef": "item-004", "groupRef": "group-002"},
                    {"itemRef": "item-005", "groupRef": "group-001"},
                ],
            },
            "acceptanceCondition": "Accept knowing when bread is baked just right under either heading when the reason says Tom was learning it now or would use it to earn a living later.",
            "delivery": "answer-slide",
        },
    })

    design["teachingSequence"] = [unit1, unit2, unit3, unit4]
    design["misconceptions"] = []
    design["vocabulary"] = [v for v in design["vocabulary"] if v["id"] in {"vocab-001", "vocab-002"}]
    design["vocabularyIntroductions"] = [
        row for row in design["vocabularyIntroductions"] if row["after"] == "lesson-section/teaching-sequence/unit-002"
    ]
    design["slideDesignNotes"] = [
        "Caption farm and workshop visuals as reconstructions, not photographs from Tudor times, once each.",
        "The card sort's headings, cards and instruction are the printed kit's; copy them exactly.",
    ]
    design["resourceOpportunities"] = {
        "stickIn": {
            "decision": "candidate",
            "sourceUnitIds": [unit4["sourceUnitId"]],
            "reason": "A card kit for Tom's help now or help later sort, done in pairs at tables.",
        },
        "workingWall": {"decision": "none", "sourceUnitIds": [], "reason": "A short lesson; the sticky sentence stays on the deal slide."},
    }
    design["worksheet"] = {
        "status": "generated",
        "resourceMode": "per-child",
        "use": "separate-fresh-worksheet",
        "activityArchitecture": {
            "coreActionAndEvidence": "A printed alternative for a child who cannot join the table sort: one part of Tom's deal and a written reason for when it helped him.",
            "amount": "One question on a short sheet.",
            "variationAndBoundaryPlan": "The same headings as the sort, on one card the child chooses.",
            "organisation": "The two headings, the five cards listed, the question and two handwriting lines.",
        },
        "sheetShape": {"kind": "question-set", "reason": "One reason for one card is the evidence the sort's written step gives."},
        "demand": "Say when one part of the deal helped Tom and why.",
        "successCriteriaRefs": [],
        "stickyKnowledgeRefs": ["sk-002"],
        "fitPriority": {"protected": ["The question and its writing lines"], "preAuthorisedRemoval": []},
        "centralWriteOnVisualException": None,
        "contentBlocks": [{
            "id": "ws-q-001",
            "kind": "question",
            "pupilPrompt": "Tom is a baker's apprentice. Pick one card from his deal: a hot dinner every day, knowing when bread is baked just right, a straw mattress by the oven, his own bakery one day, a warm coat for winter.\n\nDid it help him straight away, or when he grew up? Write why.",
            "responseForm": "written-explanation",
            "responseFormReason": "The reason shows whether the child knows when that part of the deal helped.",
            "response": "Two full-width handwriting lines.",
            "support": "",
            "visualRequirements": "",
            "representationRefs": [],
            "stickyKnowledgeRefs": [],
            "photoRefs": [],
            "answer": {
                "kind": "model",
                "content": "A warm coat for winter helped him straight away, because he needed it while he was living with the baker.",
                "acceptanceCondition": "Accept any card with a reason that says when it helped Tom; knowing when bread is baked just right fits either heading.",
                "delivery": "teacher-only",
            },
        }],
        "answerKeyMode": "required",
        "providedWorksheet": None,
    }

    keep = {"photo-001", "photo-002", "photo-003"}
    photos["photos"] = [p for p in photos["photos"] if p["id"] in keep]

    (HERE / "lesson-design.json").write_text(json.dumps(design, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (HERE / "photo-requirements.json").write_text(json.dumps(photos, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("wrote lesson-design.json and photo-requirements.json")


if __name__ == "__main__":
    main()
