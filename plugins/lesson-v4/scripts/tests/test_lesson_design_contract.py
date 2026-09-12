"""Deterministic tests for the authoritative lesson-design.json hand-off.

Run:
  python3 test_lesson_design_contract.py
or:
  pytest test_lesson_design_contract.py
"""
from __future__ import annotations

import copy
import importlib.util
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VALIDATOR = ROOT / "scripts" / "validate-lesson-design.py"
PHOTO_CAP = ROOT / "scripts" / "check-photo-cap.py"
SKILL = ROOT / "skills" / "make-lesson" / "SKILL.md"
PLAYBOOK = ROOT / "skills" / "make-lesson" / "playbook-lite.md"
ADAPTATION_DESIGNER = ROOT / "agents" / "adaptation-designer.md"
OUTPUT_TEMPLATE = ROOT / "references" / "output-template.md"
CONTEXT_PICTURES = ROOT / "references" / "context-pictures.md"

spec = importlib.util.spec_from_file_location("validate_lesson_design", VALIDATOR)
assert spec and spec.loader
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def read(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    if path == SKILL:
        text += "\n" + PLAYBOOK.read_text(encoding="utf-8")
    return text


def no_answer():
    return {
        "kind": "none",
        "content": None,
        "acceptanceCondition": None,
        "delivery": "none",
    }


def exact_answer(content: str, delivery: str = "teacher-only"):
    return {
        "kind": "exact",
        "content": content,
        "acceptanceCondition": None,
        "delivery": delivery,
    }


def photo_requirement(
    photo_id: str,
    subject: str,
    filename: str,
    *,
    pedagogical_constraint: str = "",
    teaching_requirement: str | None = None,
    essential: bool = True,
    fallback_action: str = "ai",
):
    return {
        "id": photo_id,
        "subject": subject,
        "pedagogical_constraint": pedagogical_constraint,
        "teaching_requirement": teaching_requirement or f"Show {subject} clearly.",
        "load_bearing_evidence": [subject],
        "use": "slide",
        "essential": essential,
        "filename": filename,
        "acquisition_mode": "ordinary-real",
        "source_profile": "unsplash-only",
        "fallback_action": fallback_action,
        "fallback_note": None,
        "generation_prompt": {
            "physical_state": "the subject shown whole and unobstructed",
            "must_avoid": ["a second subject"],
            "text_rule": "no readable text, labels, logos or branding",
            "composition": "the whole subject in one clear frame",
        } if fallback_action == "ai" else None,
        "coherent_group": None,
        "coherent_mode": "none",
        "coherent_visual_invariants": [],
    }


def source_unit(
    ordinal: int,
    kind: str,
    content: dict,
    *,
    label: str | None = None,
    concept_ref: str | None = None,
    modelling_state: str | None = None,
    representation_refs: list | None = None,
    success_criteria_refs: list | None = None,
    sticky_refs: list | None = None,
    misconception_refs: list | None = None,
    photo_refs: list | None = None,
    pupil_instruction: str | None = None,
    script: str | None = "Say to children: Have a look at this. What do you notice?",
    teacher_info: str | None = None,
    look_for: str | None = None,
    answer: dict | None = None,
):
    return {
        "sourceUnitId": f"lesson-section/teaching-sequence/unit-{ordinal:03d}",
        "label": label or kind.replace("-", " ").title(),
        "kind": kind,
        "conceptRef": concept_ref,
        "unlocks": 'They can do the step this beat taught, which the next beat uses.',
        "thinking": "Which tens go together, and which ones?",
        "content": content,
        "pupilInstruction": pupil_instruction,
        "modellingState": modelling_state,
        "representationRefs": representation_refs or [],
        "successCriteriaRefs": success_criteria_refs or [],
        "stickyKnowledgeRefs": sticky_refs or [],
        "misconceptionRefs": misconception_refs or [],
        "photoRefs": photo_refs or [],
        "speakerNotes": {
            "script": script,
            "teacherInfo": teacher_info,
            "lookFor": look_for,
        },
        "answer": copy.deepcopy(answer if answer is not None else no_answer()),
    }


def valid_contract():
    design = {
        "schemaVersion": 1,
        "lesson": {
            "structure": "Skill-based",
            "yearGroup": 4,
            "subject": "Maths",
            "lo": "To add two-digit numbers using partitioning",
            "displayedLo": "To add two-digit numbers",
            "durationMinutes": 45,
            "scope": "Complete lesson",
            "deferredLearning": None,
            "lesson2Direction": None,
            "stickingPoint": "Keep tens with tens and ones with ones.",
        },
        "teacherOrientation": (
            "Teacher orientation: Children add two-digit numbers by partitioning. "
            "The tricky bit is keeping each place value together."
        ),
        "starter": {
            "sourceUnitId": "lesson-section/starter/unit-001",
            "label": "Starter",
            "kind": "starter",
            "conceptRef": None,
            "unlocks": None,
            "thinking": "What goes with this number to make 10?",
            "content": {
                "activity": "Recall number bonds to 10.",
                "connection": "Retrieves addition facts used inside today's method.",
                "format": "Four short calculations.",
                "testQuestionPath": None,
            },
            "pupilInstruction": "Find each total.",
            "modellingState": None,
            "representationRefs": [],
            "successCriteriaRefs": [],
            "stickyKnowledgeRefs": [],
            "misconceptionRefs": [],
            "photoRefs": [],
            "speakerNotes": {
                "script": "Say to children: Find each total. These facts will help us later.",
                "teacherInfo": None,
                "lookFor": None,
            },
            "answer": exact_answer("10, 10, 10, 10", "answer-slide"),
        },
        "vocabulary": [
            {
                "id": "vocab-001",
                "sourceUnitId": "lesson-section/vocabulary/unit-001",
                "term": "exchange",
                "definition": "Swap ten ones for one ten.",
                "visual": {"kind": "emoji", "value": "\U0001f51f"},
            }
        ],
        "trimmedVocabulary": [],
        "representations": [
            {
                "id": "rep-001",
                "name": "Part-whole model",
                "purpose": "Show how each two-digit number is partitioned.",
                "configurations": [
                    {
                        "id": "model",
                        "description": "Whole filled; two parts blank for live completion.",
                        "loadBearing": True,
                        "requiredFeatures": [
                            "one whole linked to two parts",
                            "whole value visible",
                            "part values blank while they are being found",
                        ],
                    },
                    {
                        "id": "prepared",
                        "description": "Complete worked model visible from the start.",
                        "loadBearing": True,
                        "requiredFeatures": [
                            "one whole linked to two completed parts",
                            "completed values visible from the start",
                        ],
                    },
                    {
                        "id": "practice",
                        "description": "Whole filled; two parts blank for pupil use.",
                        "loadBearing": True,
                        "requiredFeatures": [
                            "one whole linked to two parts",
                            "whole value visible",
                            "part values blank for pupil use",
                        ],
                    },
                    {
                        "id": "vocabulary",
                        "description": "Small labelled reminder for a vocabulary card.",
                        "loadBearing": False,
                        "requiredFeatures": [],
                    },
                ],
            }
        ],
        "successCriteria": [
            {
                "id": "sc-001",
                "type": "steps",
                "drawLive": False,
                "content": {
                    "steps": [
                        "Partition each number.",
                        "Add the tens.",
                        "Add the ones.",
                        "Recombine.",
                    ]
                },
            }
        ],
        "stickyKnowledge": [
            {
                "id": "sk-001",
                "text": "Ten ones can be exchanged for one ten.",
            }
        ],
        "misconceptions": [
            {
                "id": "mc-001",
                "belief": "Add a tens digit to an ones digit because they are beside each other.",
                "correctiveFact": "Keep place values together.",
                "strategy": "guided question",
                "reason": "It is a common place-value error.",
            }
        ],
        "concepts": [
            {
                "id": "concept-001",
                "name": "Add by partitioning",
                "successCriteriaRefs": ["sc-001"],
            }
        ],
        "teachingSequence": [
            source_unit(
                1,
                "my-turn",
                {"example": "23 + 14 =", "modelledExemplar": None},
                label="My Turn",
                concept_ref="concept-001",
                modelling_state="Live-complete helper",
                representation_refs=[
                    {"ref": "rep-001", "configuration": "model", "interaction": "teacher-completes"}
                ],
                success_criteria_refs=["sc-001"],
                script="Say to children: Watch how I partition each number first.",
                answer=exact_answer("37", "teacher-only"),
            ),
            source_unit(
                2,
                "our-turn",
                {
                    "example": "32 + 25 =",
                },
                label="Our Turn",
                concept_ref="concept-001",
                modelling_state="Live-complete helper",
                representation_refs=[
                    {"ref": "rep-001", "configuration": "model", "interaction": "teacher-completes"}
                ],
                success_criteria_refs=["sc-001"],
                sticky_refs=["sk-001"],
                misconception_refs=["mc-001"],
                script="Say to children: What should we partition first?",
                answer=exact_answer("57", "teacher-only"),
            ),
            source_unit(
                3,
                "your-turn",
                {
                    "activityArchitecture": "Three fresh calculations using the same method.",
                    "task": "41 + 26 =\n52 + 17 =\n63 + 25 =",
                },
                label="Your Turn",
                concept_ref="concept-001",
                representation_refs=[
                    {"ref": "rep-001", "configuration": "practice", "interaction": "pupil-uses"}
                ],
                success_criteria_refs=["sc-001"],
                pupil_instruction="Solve each calculation.",
                script=None,
                look_for="Look for: tens added to tens and ones added to ones.",
                answer=exact_answer("67\n69\n88", "answer-slide"),
            ),
        ],
        "ending": {
            "included": False,
            "kind": "Apply",
            "reason": "The final Your Turn already provides sufficient synthesis.",
            "beat": None,
        },
        "worksheet": {
            "status": "generated",
            "resourceMode": "per-child",
            "use": "separate-fresh-worksheet",
            "activityArchitecture": {
                "coreActionAndEvidence": "Add two-digit numbers by partitioning.",
                "amount": "Six calculations.",
                "variationAndBoundaryPlan": "Fresh values; keep the same method.",
                "organisation": "Each calculation stands independently.",
            },
            "sheetShape": {"kind": "question-set", "reason": "Repeated calculations are the target practice."},
            "demand": "Accurate use of the taught partition method.",
            "successCriteriaRefs": ["sc-001"],
            "stickyKnowledgeRefs": [],
            "fitPriority": {"protected": ["all six calculations"], "preAuthorisedRemoval": []},
            "centralWriteOnVisualException": None,
            "contentBlocks": [
                {
                    "id": "ws-q-001",
                    "kind": "question",
                    "pupilPrompt": "Add 34 + 25.",
                    "responseForm": "complete-the-model",
                    "responseFormReason": None,
                    "response": "Write the answer and show the partition.",
                    "support": "",
                    "visualRequirements": "",
                    "representationRefs": [
                        {"ref": "rep-001", "configuration": "practice", "interaction": "pupil-uses"}
                    ],
                    "stickyKnowledgeRefs": [],
                    "photoRefs": [],
                    "answer": exact_answer("59", "teacher-only"),
                }
            ],
            "answerKeyMode": "required",
            "providedWorksheet": None,
        },
        "slideDesignNotes": [],
        "flagsForTeacher": [],
    }
    photos = {
        "schema_version": 2,
        "lesson_name": "Adding two-digit numbers",
        "photos": [],
    }
    return design, photos


def set_route(design: dict, structure: str, sequence: list[dict]):
    design["lesson"]["structure"] = structure
    design["teachingSequence"] = sequence
    if structure != "Skill-based":
        design["concepts"] = []
    design["ending"] = {
        "included": False,
        "kind": "Reflect" if structure == "Dialogic" else "Apply",
        "reason": "The route already closes the learning purposefully.",
        "beat": None,
    }


def valid_content_contract():
    design, photos = valid_contract()
    set_route(
        design,
        "Content-based",
        [
            source_unit(1, "observe", {"activity": "Compare the two photos.", "focus": "What changed?", "evidenceProduced": "One noticed difference."}),
            source_unit(2, "teach", {"headline": "Roads open up the forest", "explanation": None, "takeaway": {"kind": "text", "text": "A road can let more people reach the forest."}, "teachingText": None, "keyQuestions": ["What might happen once a road is there?"]}),
            source_unit(3, "do", {"activity": "Use the idea", "format": None, "task": "Explain one possible effect of the road."}, answer={"kind": "model", "content": "More people can reach the forest and more trees may be cut down.", "acceptanceCondition": "Accept another accurate consequence.", "delivery": "teacher-only"}),
            source_unit(4, "practise", {"launch": None, "activity": "Explain the chain", "format": "short written explanation", "task": "Explain how a new road could lead to more forest being cleared."}, answer={"kind": "model", "content": "The road makes the area easier to reach, so more people may enter and clear land.", "acceptanceCondition": "Accept an accurate causal explanation.", "delivery": "answer-slide"}),
        ],
    )
    return design, photos


def valid_discovery_contract():
    design, photos = valid_contract()
    set_route(
        design,
        "Discovery",
        [
            source_unit(1, "question", {"focus": "Which surface creates most friction?", "prerequisites": "Children know a force can change movement.", "discoveryFocus": "Compare how far the same object travels."}),
            source_unit(2, "explore", {"activity": "Release the same block across three surfaces.", "conditionsAndSafety": "Keep the ramp height the same.", "evidenceProduced": "Distances travelled."}),
            source_unit(3, "make-sense", {"resultOrPattern": "The block travels different distances.", "prompt": "Which surface slowed it most?"}),
            source_unit(4, "teach-why", {"takeaway": {"kind": "text", "text": "Rougher surfaces grip more."}, "accurateExplanation": "Rougher surfaces usually create more friction.", "unsupportedExplanationToCorrect": None}),
            source_unit(5, "use-learning", {"activity": "Predict which new surface would slow the block most and explain why."}),
            source_unit(6, "finish", {"purposefulEnding": "State what the investigation showed about friction."}),
        ],
    )
    return design, photos


def valid_dialogic_contract():
    design, photos = valid_contract()
    set_route(
        design,
        "Dialogic",
        [
            source_unit(1, "grounding-input", {"input": "A councillor is chosen by local people to represent their area."}),
            source_unit(2, "stimulus-talk", {"prompt": "A park has room for one new facility.", "question": "What should the council choose?", "materialOnSlide": "play area / garden / sports court", "format": "ranking", "sentenceStems": ["I would choose ___ because ___."], "durationMinutes": 5, "teacherListensFor": ["different community needs", "reasons linked to who would benefit"]}),
            source_unit(3, "synthesise", {"framesToName": ["who benefits", "how many people benefit", "what the area already has"]}),
        ],
    )
    return design, photos


def valid_task_contract():
    design, photos = valid_contract()
    set_route(
        design,
        "Task-Centred",
        [
            source_unit(1, "set-task", {"question": "Which material is best at blocking sound?", "investigationBrief": "Test the same sound through several materials."}, pupil_instruction="Write your prediction: I think ___ because ___."),
            source_unit(2, "teach-needed", {"explanation": None, "enablingInput": "Model how to keep one variable the same.", "modelledOn": "A quick demonstration using two materials."}, modelling_state="Physical-demonstration support"),
            source_unit(3, "do-task", {"launch": None, "activity": "Plan the comparison, get the fairness check, then run the investigation.", "planWithinTask": "Choose what will stay the same while the material changes.", "checkpointQuestion": "What would make this unfair?", "runsBeyondToday": False, "todayEndsAt": None}),
            source_unit(4, "share-conclude", {"activity": "Conclude which material blocked sound best and use the results as evidence."}),
        ],
    )
    return design, photos


def valid_shared_frame_contract():
    design, photos = valid_contract()
    worksheet = design["worksheet"]
    worksheet["resourceMode"] = "shared-frame"
    worksheet["use"] = "required-task-resource"
    worksheet["sheetShape"] = {"kind": "frame", "reason": "The printed resource is the same frame the teacher models."}
    worksheet["successCriteriaRefs"] = []
    worksheet["stickyKnowledgeRefs"] = []
    worksheet["contentBlocks"] = [
        {
            "id": "ws-frame-001",
            "kind": "frame",
            "representationRefs": [],
            "stickyKnowledgeRefs": [],
            "photoRefs": [],
            "sections": [
                {"heading": "What I changed", "whatGoesHere": "The one thing changed in the test.", "noteSpace": "one short line"},
                {"heading": "What I measured", "whatGoesHere": "The result measured each time.", "noteSpace": "one short line"},
            ],
            "answer": no_answer(),
        }
    ]
    worksheet["answerKeyMode"] = "not-applicable"
    return design, photos


def assert_invalid(mutator, expected):
    design, photos = valid_contract()
    mutator(design, photos)
    try:
        module.validate_design(design, photos)
    except module.ContractError as exc:
        assert expected in str(exc), str(exc)
    else:
        raise AssertionError("contract unexpectedly validated")


def assert_invalid_contract(design, photos, expected):
    try:
        module.validate_design(design, photos)
    except module.ContractError as exc:
        assert expected in str(exc), str(exc)
    else:
        raise AssertionError("contract unexpectedly validated")


def test_image_team_cap_is_authoritative_and_current_aware():
    skill = read(SKILL)
    flat = " ".join(skill.split())
    adaptation = read(ADAPTATION_DESIGNER)
    output_template = read(OUTPUT_TEMPLATE)
    context_pictures = read(CONTEXT_PICTURES)
    photo_contract = read(ROOT / "scripts" / "photo-contract.py")
    validator = read(VALIDATOR)

    assert PHOTO_CAP.is_file()
    assert "Keep count at or below 16." in output_template
    # 16 is the lesson designer's budget. The validator also runs after an
    # adaptation merge, so it enforces the run ceiling instead; capping it at
    # the design budget made that ceiling unreachable and sent a genuine late
    # picture back to be cut (Y4 appliances lesson, 31 Aug 2026).
    assert "photo-requirements.json may contain at most 24 photos" in validator
    assert "MAX_PHOTOS = 16" in read(PHOTO_CAP)
    assert "RUN_MAX_PHOTOS = 24" in read(PHOTO_CAP)
    assert "check-photo-cap.py" in skill
    assert (
        "If the picture cap exceeds 16, run one focused Lesson Designer "
        "revision" in flat
    )
    assert "photo-contract.py promote-used" in flat
    assert 'candidate = canonical_path.with_name(f".{canonical_path.name}.candidate")' in photo_contract
    assert "run_photo_cap(candidate)" in photo_contract
    assert "PHOTO_CAP_GAP" in adaptation
    assert "Once a filename appears in an immutable compiled assignment manifest" in output_template
    assert (
        "Keep its immutable schema-2 assignments, staged worker results, "
        "per-filename terminal receipts and final provenance" in flat
    )
    assert "may promote at most 16 required Image Team picture requests" in adaptation
    assert "Do not impose a fixed picture ceiling." not in adaptation
    assert "P2 and P3 are outside the lesson's 16" in context_pictures


def test_valid_skill_contract_passes():
    design, photos = valid_contract()
    module.validate_design(design, photos)


def test_valid_skill_contract_allows_optional_our_turn():
    concept_items = [{"id": "concept-001"}]
    module.validate_route_sequence(
        "Skill-based",
        [
            {
                "kind": "my-turn",
                "conceptRef": "concept-001",
                "unlocks": None,
            },
            {
                "kind": "your-turn",
                "conceptRef": "concept-001",
                "unlocks": None,
            },
        ],
        concept_items,
    )
    module.validate_route_sequence(
        "Skill-based",
        [
            {
                "kind": "my-turn",
                "conceptRef": "concept-001",
                "unlocks": None,
            },
            {
                "kind": "our-turn",
                "conceptRef": "concept-001",
                "unlocks": None,
            },
            {
                "kind": "your-turn",
                "conceptRef": "concept-001",
                "unlocks": None,
            },
        ],
        concept_items,
    )


def test_unresolved_lesson_design_scaffold_placeholder_is_rejected():
    design, photos = valid_contract()
    design["vocabulary"][0]["term"] = module.SCAFFOLD_PLACEHOLDER

    assert_invalid_contract(
        design,
        photos,
        (
            "unresolved scaffold placeholder at "
            "lesson-design.json.vocabulary[0].term"
        ),
    )


def test_unresolved_photo_requirement_scaffold_placeholder_is_rejected():
    design, photos = valid_contract()
    design["lesson"]["subject"] = "Science"
    design["starter"]["photoRefs"] = ["photo-001"]
    photos["photos"] = [photo_requirement(
        "photo-001",
        module.SCAFFOLD_PLACEHOLDER,
        "unsplash/test.jpg",
        fallback_action="omit",
    )]

    assert_invalid_contract(
        design,
        photos,
        (
            "unresolved scaffold placeholder at "
            "photo-requirements.json.photos[0].subject"
        ),
    )


def test_valid_skill_contract_gives_a_second_distinct_move_its_own_cycle():
    # A second modelled move takes a My Turn plus Our Turn cycle of its own, and
    # that cycle ends with its own Your Turn, so children use the first move
    # before the second is taught and each move is checked on its own. A second
    # My Turn placed beside the first is refused; see
    # test_a_my_turn_is_used_before_the_next_is_taught.py.
    design, photos = valid_contract()
    second_model = source_unit(
        3,
        "my-turn",
        {"example": "46 + 38 =", "modelledExemplar": None},
        label="My Turn",
        concept_ref="concept-001",
        modelling_state="Prepared example",
        representation_refs=[{"ref": "rep-001", "configuration": "prepared", "interaction": "view"}],
        success_criteria_refs=["sc-001"],
        answer=exact_answer("84", "visible-in-unit"),
    )
    second_guided = source_unit(
        4,
        "our-turn",
        {
            "example": "57 + 29 =",
        },
        label="Our Turn",
        concept_ref="concept-001",
        modelling_state="Live-complete helper",
        representation_refs=[
            {"ref": "rep-001", "configuration": "model", "interaction": "teacher-completes"}
        ],
        success_criteria_refs=["sc-001"],
        script="Say to children: which tens cross into a new hundred?",
        answer=exact_answer("86", "teacher-only"),
    )
    second_check = source_unit(
        5,
        "your-turn",
        {
            "activityArchitecture": "Two fresh calculations that cross a hundred.",
            "task": "64 + 48 =\n75 + 36 =",
        },
        label="Your Turn",
        concept_ref="concept-001",
        representation_refs=[
            {"ref": "rep-001", "configuration": "practice", "interaction": "pupil-uses"}
        ],
        success_criteria_refs=["sc-001"],
        pupil_instruction="Solve each calculation.",
        script=None,
        look_for="Look for: the new hundred written in the hundreds column.",
        answer=exact_answer("112\n111", "answer-slide"),
    )
    design["teachingSequence"].extend([second_model, second_guided, second_check])
    for index, unit in enumerate(design["teachingSequence"], 1):
        unit["sourceUnitId"] = f"lesson-section/teaching-sequence/unit-{index:03d}"
    module.validate_design(design, photos)


def test_valid_content_contract_passes():
    module.validate_design(*valid_content_contract())


def test_valid_discovery_contract_passes():
    module.validate_design(*valid_discovery_contract())


def test_valid_dialogic_contract_passes():
    module.validate_design(*valid_dialogic_contract())


def test_valid_dialogic_separate_stimulus_talk_pair_passes():
    design, photos = valid_dialogic_contract()
    design["teachingSequence"] = [
        design["teachingSequence"][0],
        source_unit(
            2,
            "stimulus",
            {
                "prompt": "A park has room for one new facility.",
                "question": "What should the council choose?",
                "materialOnSlide": "play area / garden / sports court",
            },
        ),
        source_unit(
            3,
            "talk",
            {
                "format": "ranking",
                "discussionQuestion": "What should the council choose?",
                "sentenceStems": ["I would choose ___ because ___."],
                "durationMinutes": 5,
                "teacherListensFor": ["different community needs"],
            },
        ),
        source_unit(4, "synthesise", {"framesToName": ["who benefits"]}),
    ]
    module.validate_design(design, photos)


def test_valid_task_centred_contract_passes():
    module.validate_design(*valid_task_contract())


def test_valid_task_centred_separate_plan_checkpoint_passes():
    design, photos = valid_task_contract()
    do_task = design["teachingSequence"][2]
    do_task["content"]["planWithinTask"] = None
    do_task["content"]["checkpointQuestion"] = None
    design["teachingSequence"].insert(
        2,
        source_unit(
            3,
            "plan-checkpoint",
            {
                "whatChildrenPlan": "Choose what will stay the same while the material changes.",
                "checkpointQuestion": "What would make this unfair?",
            },
        ),
    )
    for index, unit in enumerate(design["teachingSequence"], 1):
        unit["sourceUnitId"] = f"lesson-section/teaching-sequence/unit-{index:03d}"
    module.validate_design(design, photos)


def test_source_unit_ids_are_stable_section_plus_ordinal_only():
    assert_invalid(
        lambda design, photos: design["teachingSequence"][0].__setitem__(
            "sourceUnitId", "lesson-section/teaching-sequence/unit-001-my-turn"
        ),
        "invalid sourceUnitId",
    )


def test_skill_route_order_is_enforced():
    design, photos = valid_contract()
    design["teachingSequence"][0], design["teachingSequence"][1] = design["teachingSequence"][1], design["teachingSequence"][0]
    for index, unit in enumerate(design["teachingSequence"], 1):
        unit["sourceUnitId"] = f"lesson-section/teaching-sequence/unit-{index:03d}"
    # The swap leaves an Our Turn with no My Turn in front of it, which is the
    # fault the message should name rather than a missing-concept count.
    assert_invalid_contract(
        design, photos, "out-of-place our-turn unit that no My Turn opens"
    )


def test_content_route_requires_teach_do_pairing_and_practise_last():
    design, photos = valid_content_contract()
    design["teachingSequence"][1], design["teachingSequence"][2] = design["teachingSequence"][2], design["teachingSequence"][1]
    for index, unit in enumerate(design["teachingSequence"], 1):
        unit["sourceUnitId"] = f"lesson-section/teaching-sequence/unit-{index:03d}"
    assert_invalid_contract(design, photos, "observe must be followed immediately by Teach")


def test_discovery_route_requires_canonical_progression():
    design, photos = valid_discovery_contract()
    design["teachingSequence"][2], design["teachingSequence"][3] = design["teachingSequence"][3], design["teachingSequence"][2]
    for index, unit in enumerate(design["teachingSequence"], 1):
        unit["sourceUnitId"] = f"lesson-section/teaching-sequence/unit-{index:03d}"
    assert_invalid_contract(design, photos, "Discovery sequence must be exactly")


def test_dialogic_route_requires_discussion_cycle_before_synthesis():
    design, photos = valid_dialogic_contract()
    design["teachingSequence"] = [design["teachingSequence"][0], design["teachingSequence"][2]]
    for index, unit in enumerate(design["teachingSequence"], 1):
        unit["sourceUnitId"] = f"lesson-section/teaching-sequence/unit-{index:03d}"
    assert_invalid_contract(design, photos, "requires at least one discussion cycle")


def test_task_centred_route_requires_set_task_first():
    design, photos = valid_task_contract()
    design["teachingSequence"][0], design["teachingSequence"][1] = design["teachingSequence"][1], design["teachingSequence"][0]
    for index, unit in enumerate(design["teachingSequence"], 1):
        unit["sourceUnitId"] = f"lesson-section/teaching-sequence/unit-{index:03d}"
    assert_invalid_contract(design, photos, "must begin with Set the Task")


def test_dialogic_separate_talk_question_must_match_stimulus_exactly():
    design, photos = valid_dialogic_contract()
    design["teachingSequence"] = [
        design["teachingSequence"][0],
        source_unit(
            2,
            "stimulus",
            {
                "prompt": "A park has room for one new facility.",
                "question": "What should the council choose?",
                "materialOnSlide": "play area / garden / sports court",
            },
        ),
        source_unit(
            3,
            "talk",
            {
                "format": "ranking",
                "discussionQuestion": "Which choice is best?",
                "sentenceStems": ["I would choose ___ because ___."],
                "durationMinutes": 5,
                "teacherListensFor": ["different community needs"],
            },
        ),
        source_unit(4, "synthesise", {"framesToName": ["who benefits"]}),
    ]
    assert_invalid_contract(design, photos, "must exactly match the preceding Stimulus question")


def test_task_centred_separate_plan_cannot_coexist_with_folded_plan():
    design, photos = valid_task_contract()
    plan = source_unit(
        3,
        "plan-checkpoint",
        {
            "whatChildrenPlan": "Choose what will stay the same.",
            "checkpointQuestion": "What would make this unfair?",
        },
    )
    design["teachingSequence"].insert(2, plan)
    for index, unit in enumerate(design["teachingSequence"], 1):
        unit["sourceUnitId"] = f"lesson-section/teaching-sequence/unit-{index:03d}"
    assert_invalid_contract(design, photos, "cannot coexist with folded planWithinTask")


def test_visible_in_unit_is_for_teacher_presented_model_units_only():
    design, photos = valid_contract()
    your_turn = design["teachingSequence"][-1]
    your_turn["modellingState"] = "Prepared example"
    your_turn["answer"] = exact_answer("67\n69\n88", "visible-in-unit")
    assert_invalid_contract(design, photos, "visible-in-unit is allowed only on teacher-presented model units")


def test_teacher_orientation_requires_actual_text_after_prefix():
    assert_invalid(
        lambda design, photos: design.__setitem__("teacherOrientation", "Teacher orientation:"),
        "must contain orientation text",
    )


def test_set_task_does_not_accept_duplicate_child_task_field():
    design, photos = valid_task_contract()
    design["teachingSequence"][0]["content"]["childTask"] = "Duplicate pupil instruction."
    assert_invalid_contract(design, photos, "unknown fields: childTask")


def test_modelling_state_wrong_json_type_is_contract_error():
    assert_invalid(
        lambda design, photos: design["teachingSequence"][0].__setitem__("modellingState", {}),
        "modellingState must be a string",
    )


def test_unknown_representation_ref_fails():
    assert_invalid(
        lambda design, photos: design["teachingSequence"][0]["representationRefs"][0].__setitem__("ref", "rep-999"),
        "unknown representation",
    )


def test_vocabulary_representation_configuration_must_exist():
    def mutate(design, photos):
        design["vocabulary"][0]["visual"] = {
            "kind": "representation",
            "representationRef": "rep-001",
            "configuration": "does-not-exist",
        }
    assert_invalid(mutate, "configuration unknown")


def test_load_bearing_configuration_requires_features():
    def mutate(design, photos):
        design["representations"][0]["configurations"][0]["requiredFeatures"] = []
    assert_invalid(mutate, "requiredFeatures must not be empty when loadBearing is true")


def test_a_supporting_visual_may_name_the_features_its_meaning_depends_on():
    """A vocabulary line's highlighted space is not load-bearing and still has to be drawn.

    With features forced to [] it lived only in the description, the helper
    check marked it covered with nothing to test, and a deck reached final
    review before anyone found no helper could draw it (12 September 2026).
    """
    design, photos = valid_contract()
    configs = [c for rep in design["representations"] for c in rep["configurations"]]
    supporting = next(c for c in configs if c["loadBearing"] is False)
    supporting["requiredFeatures"] = ["the space between two marks highlighted, not a tick"]
    module.validate_design(design, photos)


def test_initial_lesson_contract_cannot_reference_adaptation_photo_id():
    def mutate(design, photos):
        design["lesson"]["subject"] = "Science"
        photos["photos"].append(photo_requirement(
            "adaptation-photo-001",
            "A separate adaptation image",
            "ai/adaptation.png",
            pedagogical_constraint="Used only by adaptation.md",
        ))
        design["starter"]["photoRefs"] = ["adaptation-photo-001"]
    assert_invalid(mutate, "unknown id")


def test_unknown_sticky_ref_fails():
    assert_invalid(
        lambda design, photos: design["teachingSequence"][1].__setitem__("stickyKnowledgeRefs", ["sk-999"]),
        "unknown id",
    )


def test_sticky_teach_takeaway_must_be_available_on_that_unit():
    design, photos = valid_content_contract()
    teach = design["teachingSequence"][1]
    teach["content"]["takeaway"] = {"kind": "sticky", "ref": "sk-001"}
    teach["stickyKnowledgeRefs"] = []
    assert_invalid_contract(design, photos, "must also appear in stickyKnowledgeRefs")


def test_skill_prepare_cannot_carry_concept_ref():
    design, photos = valid_contract()
    prepare = source_unit(1, "prepare", {"mode": "explanation", "activity": "Recall the place-value names."}, concept_ref="concept-001")
    design["teachingSequence"].insert(0, prepare)
    for index, unit in enumerate(design["teachingSequence"], 1):
        unit["sourceUnitId"] = f"lesson-section/teaching-sequence/unit-{index:03d}"
    assert_invalid_contract(design, photos, "conceptRef must be null for prepare")


def test_skill_turn_must_use_concept_success_criteria_exactly():
    assert_invalid(
        lambda design, photos: design["teachingSequence"][0].__setitem__("successCriteriaRefs", []),
        "must exactly match concept-001.successCriteriaRefs",
    )


def test_load_bearing_representation_configuration_requires_features():
    assert_invalid(
        lambda design, photos: design["representations"][0]["configurations"][0].__setitem__("requiredFeatures", []),
        "requiredFeatures must not be empty",
    )


def test_script_prefix_must_have_actual_script_after_it():
    assert_invalid(
        lambda design, photos: design["teachingSequence"][0]["speakerNotes"].__setitem__("script", "Say to children:"),
        "must contain words after",
    )


def test_canonical_answer_marker_is_not_duplicated_in_speaker_notes():
    assert_invalid(
        lambda design, photos: design["teachingSequence"][0]["speakerNotes"].__setitem__(
            "teacherInfo", "Answer to question(s) on this slide: 23 + 14 = 37"
        ),
        "must not duplicate the structured answer marker",
    )


def test_my_turn_cannot_request_following_answer_slide():
    assert_invalid(
        lambda design, photos: design["teachingSequence"][0]["answer"].__setitem__("delivery", "answer-slide"),
        "is not allowed here",
    )


def test_exact_do_answer_cannot_request_answer_slide():
    design, photos = valid_content_contract()
    do = next(unit for unit in design["teachingSequence"] if unit["kind"] == "do")
    do["answer"] = exact_answer("More people can reach the forest.", "answer-slide")
    assert_invalid_contract(
        design,
        photos,
        "answer-slide is allowed only for a starter, main independent work, or a model/standard reveal",
    )


def test_model_do_may_request_answer_slide():
    design, photos = valid_content_contract()
    do = next(unit for unit in design["teachingSequence"] if unit["kind"] == "do")
    do["answer"] = {
        "kind": "model",
        "content": "More people can reach the forest, so more trees may be cut down.",
        "acceptanceCondition": "Accept another accurate consequence.",
        "delivery": "answer-slide",
    }
    module.validate_design(design, photos)


def test_exact_practise_answer_may_request_answer_slide():
    design, photos = valid_content_contract()
    practise = next(
        unit for unit in design["teachingSequence"] if unit["kind"] == "practise"
    )
    practise["answer"] = exact_answer(
        "The road makes the area easier to reach.",
        "answer-slide",
    )
    module.validate_design(design, photos)


def test_my_turn_requires_structured_answer():
    design, photos = valid_contract()
    design["teachingSequence"][0]["answer"] = no_answer()
    assert_invalid_contract(
        design,
        photos,
        "answer must contain the My Turn answer/model/standard",
    )


def test_prepared_my_turn_requires_visible_in_unit_answer():
    design, photos = valid_contract()
    my_turn = design["teachingSequence"][0]
    my_turn["modellingState"] = "Prepared example"
    my_turn["representationRefs"] = [
        {"ref": "rep-001", "configuration": "prepared", "interaction": "view"}
    ]
    my_turn["answer"] = exact_answer("37", "teacher-only")
    assert_invalid_contract(
        design,
        photos,
        "answer.delivery must be visible-in-unit for Prepared example My Turn",
    )


def test_visible_in_unit_answer_requires_prepared_example():
    design, photos = valid_content_contract()
    teach = next(unit for unit in design["teachingSequence"] if unit["kind"] == "teach")
    teach["answer"] = exact_answer("A completed model.", "visible-in-unit")
    assert_invalid_contract(
        design,
        photos,
        "requires modellingState Prepared example",
    )


def test_my_turn_requires_modelling_state():
    design, photos = valid_contract()
    design["teachingSequence"][0]["modellingState"] = None
    assert_invalid_contract(design, photos, "modellingState is required for My Turn")


def test_live_complete_requires_teacher_completes_representation():
    design, photos = valid_contract()
    design["teachingSequence"][0]["representationRefs"] = []
    assert_invalid_contract(
        design,
        photos,
        "Live-complete helper requires a teacher-completes representation use",
    )


def test_live_complete_teacher_completes_representation_must_be_load_bearing():
    design, photos = valid_contract()
    design["teachingSequence"][0]["representationRefs"] = [
        {"ref": "rep-001", "configuration": "vocabulary", "interaction": "teacher-completes"}
    ]
    assert_invalid_contract(
        design,
        photos,
        "requires a load-bearing teacher-completes representation configuration",
    )


def test_modelled_exemplar_is_only_for_question_and_reference_my_turn():
    design, photos = valid_contract()
    design["teachingSequence"][0]["content"]["modelledExemplar"] = "A finished sentence."
    assert_invalid_contract(
        design,
        photos,
        "modelledExemplar is valid only for Question and reference My Turn writing",
    )


def test_required_script_my_turn_cannot_be_null():
    design, photos = valid_contract()
    design["teachingSequence"][0]["speakerNotes"]["script"] = None
    assert_invalid_contract(design, photos, "speakerNotes.script is required for my-turn")


def test_required_script_our_turn_cannot_be_null():
    design, photos = valid_contract()
    design["teachingSequence"][1]["speakerNotes"]["script"] = None
    assert_invalid_contract(design, photos, "speakerNotes.script is required for our-turn")


def test_required_script_content_teach_cannot_be_null():
    design, photos = valid_content_contract()
    teach = next(unit for unit in design["teachingSequence"] if unit["kind"] == "teach")
    teach["speakerNotes"]["script"] = None
    assert_invalid_contract(design, photos, "speakerNotes.script is required for teach")


def test_required_script_set_task_cannot_be_null():
    design, photos = valid_task_contract()
    set_task = next(unit for unit in design["teachingSequence"] if unit["kind"] == "set-task")
    set_task["speakerNotes"]["script"] = None
    assert_invalid_contract(design, photos, "speakerNotes.script is required for set-task")


def test_required_script_apply_cannot_be_null_when_included():
    design, photos = valid_content_contract()
    design["ending"] = {
        "included": True,
        "kind": "Apply",
        "reason": "A final application is useful.",
        "beat": source_unit(
            1,
            "apply",
            {"activity": "Apply the idea to a fresh example."},
            script=None,
            answer={"kind": "model", "content": "A suitable model response.", "acceptanceCondition": "Accept equivalent reasoning.", "delivery": "answer-slide"},
        ),
    }
    design["ending"]["beat"]["sourceUnitId"] = "lesson-section/apply/unit-001"
    assert_invalid_contract(design, photos, "speakerNotes.script is required for apply")


def test_required_script_reflect_cannot_be_null_when_included():
    design, photos = valid_dialogic_contract()
    design["ending"] = {
        "included": True,
        "kind": "Reflect",
        "reason": "Individual synthesis is useful.",
        "beat": source_unit(
            1,
            "reflect",
            {"activity": "Write the view you now find most convincing and why."},
            script=None,
            answer={"kind": "model", "content": "A reasoned personal position.", "acceptanceCondition": "Accept a defensible position with a relevant reason.", "delivery": "answer-slide"},
        ),
    }
    design["ending"]["beat"]["sourceUnitId"] = "lesson-section/reflect/unit-001"
    assert_invalid_contract(design, photos, "speakerNotes.script is required for reflect")


def test_none_answer_carries_no_content():
    assert_invalid(
        lambda design, photos: design["teachingSequence"][0].__setitem__(
            "answer", {"kind": "none", "content": "37", "acceptanceCondition": None, "delivery": "none"}
        ),
        "content must be null",
    )


def add_structured_sort(design):
    starter = design["starter"]
    starter["pupilInstruction"] = "Sort each object into one group."
    starter["taskStructure"] = {
        "kind": "sort",
        "groups": [
            {"id": "group-001", "label": "Uses electricity"},
            {"id": "group-002", "label": "Does not use electricity"},
        ],
        "items": [
            {"id": "item-001", "label": "Kettle", "detail": None, "photoRef": None},
            {"id": "item-002", "label": "Television", "detail": None, "photoRef": None},
            {"id": "item-003", "label": "Bicycle", "detail": None, "photoRef": None},
            {"id": "item-004", "label": "Football", "detail": None, "photoRef": None},
            {"id": "item-005", "label": "Lamp", "detail": None, "photoRef": None},
            {"id": "item-006", "label": "Book", "detail": None, "photoRef": None},
        ],
    }
    starter["answer"] = {
        "kind": "exact",
        "content": None,
        "structure": {
            "kind": "sort",
            "placements": [
                {"itemRef": "item-001", "groupRef": "group-001"},
                {"itemRef": "item-002", "groupRef": "group-001"},
                {"itemRef": "item-003", "groupRef": "group-002"},
                {"itemRef": "item-004", "groupRef": "group-002"},
                {"itemRef": "item-005", "groupRef": "group-001"},
                {"itemRef": "item-006", "groupRef": "group-002"},
            ],
        },
        "acceptanceCondition": None,
        "delivery": "answer-slide",
    }
    return starter


def test_valid_structured_sort_contract_passes():
    design, photos = valid_contract()
    add_structured_sort(design)
    module.validate_design(design, photos)


def test_task_structure_requires_non_null_instruction():
    design, photos = valid_contract()
    starter = add_structured_sort(design)
    starter["pupilInstruction"] = None
    assert_invalid_contract(
        design,
        photos,
        "pupilInstruction must be non-null when taskStructure is present",
    )


def test_task_structure_photo_ref_must_be_in_unit_photo_refs():
    design, photos = valid_contract()
    starter = add_structured_sort(design)
    starter["taskStructure"]["items"][0]["photoRef"] = "photo-001"
    assert_invalid_contract(
        design,
        photos,
        "photoRef must also appear in the source unit photoRefs",
    )


def test_answer_structure_must_place_every_item_once():
    design, photos = valid_contract()
    starter = add_structured_sort(design)
    starter["answer"]["structure"]["placements"].pop()
    assert_invalid_contract(
        design,
        photos,
        "answer.structure.placements missing items: item-006",
    )


def test_structured_answer_delivery_rule_is_stated_where_the_designer_decides():
    template = read(ROOT / "references" / "output-template.md")
    designer = read(ROOT / "agents" / "lesson-designer.md")
    assert "A structured answer does not change how `delivery` is chosen." in template
    assert (
        "the same structured sort on a Do beat, an Our Turn or another smaller "
        "check uses `teacher-only`" in template
    )
    assert "Never weaken a sort into prose, an option bank or a looser task shape" in template
    assert "Choose answer.delivery by ordinary delivery rule, not by structure" in designer


def structured_sort_on(unit):
    unit["pupilInstruction"] = "Sort each appliance into one group."
    unit["taskStructure"] = {
        "kind": "sort",
        "groups": [
            {"id": "group-001", "label": "Mains electricity"},
            {"id": "group-002", "label": "Battery"},
        ],
        "items": [
            {"id": "item-001", "label": "Lamp", "detail": "plug on a lead", "photoRef": None},
            {"id": "item-002", "label": "Kettle", "detail": "plug on a lead", "photoRef": None},
            {"id": "item-003", "label": "Torch", "detail": "battery compartment", "photoRef": None},
            {"id": "item-004", "label": "Remote", "detail": "battery compartment", "photoRef": None},
        ],
    }
    unit["answer"] = {
        "kind": "exact",
        "content": None,
        "structure": {
            "kind": "sort",
            "placements": [
                {"itemRef": "item-001", "groupRef": "group-001"},
                {"itemRef": "item-002", "groupRef": "group-001"},
                {"itemRef": "item-003", "groupRef": "group-002"},
                {"itemRef": "item-004", "groupRef": "group-002"},
            ],
        },
        "acceptanceCondition": None,
        "delivery": "teacher-only",
    }
    return unit


def test_structured_sort_is_available_on_a_smaller_check_beat():
    """A Do beat, an Our Turn and their neighbours may carry a structured sort.

    A structured sort is pinned to `exact`, and a smaller check keeps an exact
    answer in the speaker notes rather than on a separate answer slide. Tying
    structure to answer-slide delivery therefore made the sort unencodable on
    every beat except the starter and the main independent work, and a designer
    reaching that wall silently downgrades the task to looser prose shapes.
    """
    for contract, index in (
        (valid_content_contract, 2),
        (valid_content_contract, 0),
        (valid_dialogic_contract, 1),
        (valid_task_contract, 2),
    ):
        design, photos = contract()
        structured_sort_on(design["teachingSequence"][index])
        module.validate_design(design, photos)


def test_structured_sort_still_reveals_on_main_independent_work():
    design, photos = valid_content_contract()
    unit = structured_sort_on(design["teachingSequence"][3])
    unit["answer"]["delivery"] = "answer-slide"
    module.validate_design(design, photos)


def test_smaller_check_still_cannot_reveal_an_exact_answer_on_a_slide():
    design, photos = valid_content_contract()
    unit = structured_sort_on(design["teachingSequence"][2])
    unit["answer"]["delivery"] = "answer-slide"
    assert_invalid_contract(
        design,
        photos,
        "answer-slide is allowed only for a starter, main independent work, "
        "or a model/standard reveal",
    )


def test_structured_answer_still_refuses_a_none_delivery():
    design, photos = valid_content_contract()
    unit = structured_sort_on(design["teachingSequence"][2])
    unit["answer"]["delivery"] = "none"
    assert_invalid_contract(design, photos, "delivery must not be none when kind is exact")


def test_structured_sort_answer_cannot_duplicate_content():
    design, photos = valid_contract()
    starter = add_structured_sort(design)
    starter["answer"]["content"] = "Uses electricity: kettle, television, lamp."
    assert_invalid_contract(
        design,
        photos,
        "answer.content must be null when structure is present",
    )


def add_evidence_classification(design, photos):
    design["lesson"]["subject"] = "Science"
    photos["photos"].extend([
        photo_requirement(
            "photo-001",
            "A hairdryer with its plug and lead visible",
            "unsplash/hairdryer.jpg",
            pedagogical_constraint="The plug and lead must be visible.",
        ),
        photo_requirement(
            "photo-002",
            "A manual can opener",
            "unsplash/manual-can-opener.jpg",
            pedagogical_constraint="The hand-operated mechanism must be visible.",
        ),
    ])
    starter = design["starter"]
    starter["photoRefs"] = ["photo-001", "photo-002"]
    starter["pupilInstruction"] = "Classify each photograph from visible evidence."
    starter["taskStructure"] = {
        "kind": "evidence-classification",
        "fields": [
            {"id": "field-001", "label": "Object name"},
            {"id": "field-002", "label": "Electrical appliance?"},
            {"id": "field-003", "label": "Power source"},
            {"id": "field-004", "label": "Evidence"},
        ],
        "items": [
            {"id": "item-001", "photoRef": "photo-001"},
            {"id": "item-002", "photoRef": "photo-002"},
        ],
    }
    starter["answer"] = {
        "kind": "model",
        "content": None,
        "structure": {
            "kind": "evidence-classification",
            "results": [
                {
                    "itemRef": "item-001",
                    "values": [
                        {"fieldRef": "field-001", "value": "Hairdryer"},
                        {"fieldRef": "field-002", "value": "Electrical appliance"},
                        {"fieldRef": "field-003", "value": "Mains electricity"},
                        {"fieldRef": "field-004", "value": "Plug and lead"},
                    ],
                },
                {
                    "itemRef": "item-002",
                    "values": [
                        {"fieldRef": "field-001", "value": "Manual can opener"},
                        {"fieldRef": "field-002", "value": "Not an electrical appliance"},
                        {"fieldRef": "field-003", "value": "No electrical power source"},
                        {"fieldRef": "field-004", "value": "Designed to work by hand"},
                    ],
                },
            ],
        },
        "acceptanceCondition": "Accept equivalent evidence that is visible in the photograph.",
        "delivery": "answer-slide",
    }
    return starter


def test_valid_evidence_classification_contract_passes():
    design, photos = valid_contract()
    add_evidence_classification(design, photos)
    module.validate_design(design, photos)


def test_evidence_classification_requires_every_field_for_every_photo():
    design, photos = valid_contract()
    starter = add_evidence_classification(design, photos)
    starter["answer"]["structure"]["results"][0]["values"].pop()
    assert_invalid_contract(
        design,
        photos,
        "values missing fields: field-004",
    )


def test_evidence_classification_rejects_duplicate_photo_result():
    design, photos = valid_contract()
    starter = add_evidence_classification(design, photos)
    starter["answer"]["structure"]["results"][1]["itemRef"] = "item-001"
    assert_invalid_contract(
        design,
        photos,
        "results contains duplicate itemRef: item-001",
    )


def test_nullable_pupil_instruction_rejects_empty_string():
    assert_invalid(
        lambda design, photos: design["teachingSequence"][0].__setitem__("pupilInstruction", ""),
        "must be null or a non-empty string",
    )


def test_nullable_teacher_info_rejects_empty_string():
    assert_invalid(
        lambda design, photos: design["teachingSequence"][0]["speakerNotes"].__setitem__("teacherInfo", ""),
        "must be null or a non-empty string",
    )


def test_nullable_acceptance_condition_rejects_empty_string():
    assert_invalid(
        lambda design, photos: design["teachingSequence"][0]["answer"].__setitem__("acceptanceCondition", ""),
        "must be null or a non-empty string",
    )


def test_bank_starter_requires_exact_answer_slide_answer():
    design, photos = valid_contract()
    starter = design["starter"]
    starter["content"]["testQuestionPath"] = "/bank/question.png"
    starter["answer"] = no_answer()
    assert_invalid_contract(
        design,
        photos,
        "must be an exact answer-slide answer when starter.testQuestionPath is present",
    )


def test_json_booleans_do_not_pass_as_integer_fields():
    assert_invalid(lambda design, photos: design.__setitem__("schemaVersion", True), "schemaVersion must be integer 1")
    assert_invalid(lambda design, photos: design["lesson"].__setitem__("durationMinutes", True), "positive integer")


def test_every_initial_photo_requirement_is_referenced_in_phase_one():
    design, photos = valid_contract()
    design["lesson"]["subject"] = "Science"
    photos["photos"].append(photo_requirement(
        "photo-001",
        "A classroom number line",
        "unsplash/number-line.jpg",
        essential=False,
        fallback_action="omit",
    ))
    try:
        module.validate_design(design, photos, initial_photo_namespace=True)
    except module.ContractError as exc:
        assert "initial photo requirement is not referenced" in str(exc)
    else:
        raise AssertionError("unreferenced Phase-1 photo requirement unexpectedly validated")


def test_valid_shared_frame_is_one_actual_frame():
    module.validate_design(*valid_shared_frame_contract())


def test_shared_frame_rejects_ordinary_question_content():
    design, photos = valid_shared_frame_contract()
    design["worksheet"]["contentBlocks"] = copy.deepcopy(valid_contract()[0]["worksheet"]["contentBlocks"])
    design["worksheet"]["answerKeyMode"] = "required"
    assert_invalid_contract(design, photos, "content block must be kind frame")


def test_non_mixed_sheet_shape_must_match_content_family():
    design, photos = valid_contract()
    design["worksheet"]["sheetShape"] = {"kind": "frame", "reason": "Incorrect metadata."}
    assert_invalid_contract(design, photos, "does not match contentBlocks families")


def test_stimulus_prompt_can_carry_its_own_visual_semantics():
    design, photos = valid_contract()
    worksheet = design["worksheet"]
    worksheet["sheetShape"] = {"kind": "stimulus-set", "reason": "The prompts work from one coherent stimulus."}
    worksheet["contentBlocks"] = [
        {
            "id": "ws-stimulus-001",
            "kind": "stimulus-set",
            "stimulus": "A simple chart showing three results.",
            "relationship": "Children compare the three values.",
            "pupilAction": "Use the chart to answer the prompts.",
            "representationRefs": [],
            "stickyKnowledgeRefs": [],
            "photoRefs": [],
            "prompts": [
                {
                    "id": "ws-stimulus-001-prompt-01",
                    "pupilPrompt": "Which result is greatest?",
                    "responseForm": "short-answer",
                    "responseFormReason": None,
                    "response": "Write one result.",
                    "support": "",
                    "visualRequirements": "Keep the chart visible beside this prompt.",
                    "representationRefs": [],
                    "stickyKnowledgeRefs": [],
                    "photoRefs": [],
                    "answer": exact_answer("Result B", "teacher-only"),
                }
            ],
        }
    ]
    module.validate_design(design, photos)


def test_provided_worksheet_has_no_generated_expected_content():
    design, photos = valid_contract()
    worksheet = design["worksheet"]
    worksheet.update({
        "status": "provided-by-teacher",
        "resourceMode": "per-child",
        "activityArchitecture": None,
        "sheetShape": None,
        "demand": None,
        "successCriteriaRefs": [],
        "stickyKnowledgeRefs": [],
        "fitPriority": None,
        "centralWriteOnVisualException": None,
        "contentBlocks": [],
        "answerKeyMode": "not-applicable",
        "providedWorksheet": {
            "source": "teacher-supplied.pdf",
            "skillMatch": "Aligned with LO",
            "duplicateCheck": "No slide example duplicates its values.",
            "notes": "",
        },
    })
    module.validate_design(design, photos)


def test_cli_success_marker():
    design, photos = valid_contract()
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        design_path = tmp_path / "lesson-design.json"
        photo_path = tmp_path / "photo-requirements.json"
        design_path.write_text(json.dumps(design, ensure_ascii=False, indent=2), encoding="utf-8")
        photo_path.write_text(json.dumps(photos, ensure_ascii=False, indent=2), encoding="utf-8")
        result = subprocess.run(
            [sys.executable, "-S", str(VALIDATOR), str(design_path), str(photo_path)],
            capture_output=True,
            text=True,
        )
    assert result.returncode == 0, result.stdout + result.stderr
    assert result.stdout.strip() == "LESSON_DESIGN_OK"


def test_photo_requirements_root_requires_lesson_name():
    def mutate(design, photos):
        del photos["lesson_name"]

    assert_invalid(mutate, "photo-requirements.json missing fields")


def test_photo_requirements_root_rejects_unknown_field():
    def mutate(design, photos):
        photos["unexpected"] = True

    assert_invalid(mutate, "photo-requirements.json has unknown fields")


def test_initial_photo_ids_are_sequential_in_array_order():
    design, photos = valid_contract()
    design["lesson"]["subject"] = "Science"
    design["starter"]["photoRefs"] = ["photo-999"]
    photos["photos"] = [photo_requirement(
        "photo-999",
        "Circuit apparatus",
        "unsplash/circuit-apparatus.jpg",
        pedagogical_constraint="Clear classroom setup.",
    )]
    try:
        module.validate_design(design, photos, initial_photo_namespace=True)
    except module.ContractError as exc:
        assert "must be exactly photo-001" in str(exc)
    else:
        raise AssertionError("non-sequential initial photo ID unexpectedly validated")


def test_maths_lesson_may_define_a_photo_requirement():
    # The validator used to refuse every photo-### requirement on a maths
    # lesson. The intent was right - the engine draws number lines and bar
    # models, it does not photograph them - but the rule banned the mechanism
    # rather than the mistake, and it closed the only exit the run has when the
    # engine cannot draw something: the helper check's picture route ends in a
    # photo requirement, so on 1 September 2026 a Year 4 maths lesson could
    # neither add the picture that route produced nor pass the design gate.
    # "LESSON_DESIGN_INVALID ... maths visual tools are rendered, not
    # photographed" pointed at a substitute route that does not exist.
    #
    # The teacher settled it: maths can have photographs. Photographing a tool
    # the engine draws is still wrong, but that is not a subject rule and no
    # validator can see it - it is the helper check's job, held for every
    # subject by the delivery check, and a judgement the designer and reviewer
    # carry.
    design, photos = valid_contract()
    design["starter"]["photoRefs"] = ["photo-001"]
    photos["photos"] = [photo_requirement(
        "photo-001",
        "A real measuring jug at eye level, filled to a marked scale line",
        "unsplash/measuring-jug.jpg",
        pedagogical_constraint="A real-world referent the engine cannot draw.",
    )]
    module.validate_design(design, photos, initial_photo_namespace=True)


def test_the_maths_subject_name_is_still_held_to_one_spelling():
    # 30 August 2026, "Add and subtract a 4-digit number by a 3-digit number":
    # the lesson-designer relabelled the subject "Mathematics" specifically so
    # the then no-initial-photos gate would not fire. That gate is gone, but the
    # naming rule it exposed is worth keeping on its own account: filing folders
    # and subject-file routing both expect the teacher's own "Maths".
    for alias in ("Mathematics", "mathematics", "MATHS", "Math"):
        design, photos = valid_contract()
        design["lesson"]["subject"] = alias
        assert_invalid_contract(
            design,
            photos,
            "lesson.subject must be exactly 'Maths'",
        )


def test_reusable_validator_accepts_adaptation_photo_for_maths():
    design, photos = valid_contract()
    photos["photos"] = [photo_requirement(
        "adaptation-photo-001",
        "Accessible real-world objects for an adaptation task",
        "unsplash/adaptation-maths-objects.jpg",
        pedagogical_constraint="Owned only by adaptation.md after Phase 1.",
    )]
    module.validate_design(design, photos)


def test_reusable_merged_mode_allows_historical_unreferenced_initial_photo():
    design, photos = valid_contract()
    design["lesson"]["subject"] = "Science"
    photos["photos"] = [photo_requirement(
        "photo-001",
        "Previously planned source image",
        "unsplash/historical-source.jpg",
        pedagogical_constraint=(
            "Historical planned requirement after a later replacement."
        ),
    )]
    module.validate_design(design, photos)


def test_adaptation_photo_ids_cannot_skip_ordinals():
    design, photos = valid_contract()
    photos["photos"] = [photo_requirement(
        "adaptation-photo-002",
        "Skipped first adaptation ID",
        "unsplash/skipped-id.jpg",
        pedagogical_constraint="Invalid ID allocation.",
    )]
    assert_invalid_contract(
        design,
        photos,
        "adaptation-photo- IDs must be contiguous from 001",
    )


def test_skill_concept_requires_nonempty_success_criteria_refs():
    design, photos = valid_contract()
    design["concepts"][0]["successCriteriaRefs"] = []
    for unit in design["teachingSequence"]:
        if unit["kind"] in {"my-turn", "our-turn", "your-turn"}:
            unit["successCriteriaRefs"] = []
    assert_invalid_contract(
        design,
        photos,
        "successCriteriaRefs must not be empty for a Skill-based concept",
    )


def test_cli_initial_namespace_accepts_normal_phase_one_photo_file():
    design, photos = valid_contract()
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        design_path = tmp_path / "lesson-design.json"
        photo_path = tmp_path / "photo-requirements.json"
        design_path.write_text(json.dumps(design, ensure_ascii=False, indent=2), encoding="utf-8")
        photo_path.write_text(json.dumps(photos, ensure_ascii=False, indent=2), encoding="utf-8")
        result = subprocess.run(
            [
                sys.executable,
                "-S",
                str(VALIDATOR),
                "--initial-photo-namespace",
                str(design_path),
                str(photo_path),
            ],
            capture_output=True,
            text=True,
        )
    assert result.returncode == 0, result.stdout + result.stderr
    assert result.stdout.strip() == "LESSON_DESIGN_OK"


def test_reusable_validator_accepts_merged_adaptation_photo_namespace():
    design, photos = valid_contract()
    design["lesson"]["subject"] = "Science"
    photos["photos"].append(photo_requirement(
        "adaptation-photo-001",
        "A later adaptation image",
        "ai/adaptation.png",
        pedagogical_constraint="Owned by adaptation.md, not lesson-design.json.",
    ))
    module.validate_design(design, photos)


def test_cli_initial_photo_namespace_rejects_adaptation_object_before_merge():
    design, photos = valid_contract()
    design["lesson"]["subject"] = "Science"
    photos["photos"].append(photo_requirement(
        "adaptation-photo-001",
        "A later adaptation image",
        "ai/adaptation.png",
        pedagogical_constraint="Must not exist in Phase 1.",
    ))
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        design_path = tmp_path / "lesson-design.json"
        photo_path = tmp_path / "photo-requirements.json"
        design_path.write_text(json.dumps(design, ensure_ascii=False, indent=2), encoding="utf-8")
        photo_path.write_text(json.dumps(photos, ensure_ascii=False, indent=2), encoding="utf-8")
        result = subprocess.run(
            [
                sys.executable,
                "-S",
                str(VALIDATOR),
                "--initial-photo-namespace",
                str(design_path),
                str(photo_path),
            ],
            capture_output=True,
            text=True,
        )
    assert result.returncode == 1
    assert result.stderr.startswith("LESSON_DESIGN_INVALID:")
    # Adaptation ids under this flag are ambiguous from the file alone, so the
    # message names both readings rather than asserting the contract is corrupt.
    assert "adaptation-photo-001" in result.stderr
    assert "those entries do not belong in it" in result.stderr
    assert "the ids are right" in result.stderr


def test_cli_wrong_json_type_uses_contract_error_interface_without_traceback():
    design, photos = valid_contract()
    design["lesson"]["scope"] = []
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        design_path = tmp_path / "lesson-design.json"
        photo_path = tmp_path / "photo-requirements.json"
        design_path.write_text(json.dumps(design, ensure_ascii=False, indent=2), encoding="utf-8")
        photo_path.write_text(json.dumps(photos, ensure_ascii=False, indent=2), encoding="utf-8")
        result = subprocess.run(
            [sys.executable, "-S", str(VALIDATOR), str(design_path), str(photo_path)],
            capture_output=True,
            text=True,
        )
    assert result.returncode == 1
    assert result.stderr.startswith("LESSON_DESIGN_INVALID:")
    assert "Traceback" not in result.stderr


def test_runtime_contract_no_longer_names_lesson_design_md_or_lesson_analysis():
    runtime_roots = (
        ROOT / "agents",
        ROOT / "skills" / "make-lesson",
        ROOT / "references",
        ROOT / "scripts",
    )
    tests_root = ROOT / "scripts" / "tests"
    failures = []
    for base in runtime_roots:
        for path in base.rglob("*"):
            if not path.is_file() or tests_root in path.parents:
                continue
            if path.suffix.lower() not in {".md", ".py", ".js", ".json"}:
                continue
            text = path.read_text(encoding="utf-8")
            if "lesson-design.md" in text:
                failures.append(f"{path.relative_to(ROOT)} still contains lesson-design.md")
    lesson_designer_text = (ROOT / "agents" / "lesson-designer.md").read_text(encoding="utf-8")
    output_template_text = (ROOT / "references" / "output-template.md").read_text(encoding="utf-8")
    if "Section 1: Lesson Analysis" in lesson_designer_text:
        failures.append("agents/lesson-designer.md still defines Section 1: Lesson Analysis")
    if "Section 1: Lesson Analysis" in output_template_text:
        failures.append("references/output-template.md still defines Section 1: Lesson Analysis")

    adaptation_text = (ROOT / "agents" / "adaptation-designer.md").read_text(encoding="utf-8")
    worksheet_text = (ROOT / "agents" / "worksheet-designer.md").read_text(encoding="utf-8")
    preferences_text = (ROOT / "references" / "preferences.md").read_text(encoding="utf-8")
    for retired in (
        "Status: Generated (shared frame, one sheet, no adaptation)",
        "Status: Provided by teacher",
    ):
        if retired in lesson_designer_text:
            failures.append(f"agents/lesson-designer.md still contains retired lesson-design semantic: {retired}")
    # The output template owns the no-representation output rule: the empty
    # array is the required shape, and the retired prose sentinel is
    # explicitly prohibited there rather than in the agent file.
    if 'Use `"representations": []` when no pedagogical representation is required.' not in output_template_text:
        failures.append("references/output-template.md missing empty-array rule for no-representation output")
    if 'Never emit a prose sentinel such as `"Plain text only."`' not in output_template_text:
        failures.append("references/output-template.md missing explicit prohibition of the retired 'Plain text only.' sentinel")
    # Reject an actual old positive instruction to write the sentinel
    # (a standalone instruction line, not inside a prohibition).
    import re as _re_check
    for owner_name, owner_text in (
        ("agents/lesson-designer.md", lesson_designer_text),
        ("references/output-template.md", output_template_text),
    ):
        for line in owner_text.splitlines():
            stripped = _re_check.sub(r"\*{1,2}", "", line).strip()
            if stripped == '"Plain text only."' or stripped == "Plain text only.":
                failures.append(f"{owner_name} still positively instructs writing 'Plain text only.' sentinel")
    if "Status: Generated (shared frame, one sheet, no adaptation)" in adaptation_text:
        failures.append("agents/adaptation-designer.md still branches on shared-frame magic status")
    if "Status: Provided by teacher" in adaptation_text:
        failures.append("agents/adaptation-designer.md still branches on old Status field")
    if "Status: Provided by teacher" in worksheet_text:
        failures.append("agents/worksheet-designer.md still branches on old Status field")
    if "the teacher-facing analysis and the starter-slide teacher orientation" in preferences_text:
        failures.append("references/preferences.md still requires split visibility in retired teacher-facing analysis")
    assert not failures, "\n".join(failures)


def test_written_voice_contract_is_canonical_and_old_sentence_quota_is_gone():
    preferences = (ROOT / "references" / "preferences.md").read_text(encoding="utf-8")
    lesson_designer = (ROOT / "agents" / "lesson-designer.md").read_text(encoding="utf-8")
    reviewer = (ROOT / "agents" / "design-reviewer.md").read_text(encoding="utf-8")
    for marker in (
        "Write for understanding, not merely decodability.",
        "Glanceable means low mental clutter, not a sentence-length quota.",
        "Put challenge in the thinking, not in avoidably difficult wording.",
        "Humour, personality, emojis, callbacks and small asides are optional tools, never quotas.",
        "Does this wording help children understand or act, or is it merely narrating the lesson back to them?",
    ):
        assert marker in preferences
    adaptive = (ROOT / "references" / "adaptive-adaptation.md").read_text(encoding="utf-8")
    assert "Short, straightforward sentences with basic vocabulary." not in lesson_designer
    assert "short sentences with basic vocabulary" not in preferences
    assert "a Teach explanation that runs past a short line" not in lesson_designer
    assert "Use the shortest wording that preserves the task." not in adaptive
    assert "Apply Written Voice as a comprehension test, not a shortening test." in reviewer


def test_worksheet_question_group_maps_directly_to_question_group_id():
    text = (ROOT / "agents" / "worksheet-designer.md").read_text(encoding="utf-8")
    assert "`questionGroupId` equal byte-for-byte to the enclosing content block `id`" in text
    assert "Ordinary `question` blocks carry no `questionGroupId`" in text


def test_photo_id_is_not_added_to_compiled_filename_identity():
    compiler = (ROOT / "scripts" / "compile-picture-assignments.py").read_text(encoding="utf-8")
    validator = (ROOT / "scripts" / "validate-image-scout.py").read_text(encoding="utf-8")
    assert "image-scout-designer" not in compiler
    assert "real_handoff" not in compiler
    assert '"entry_key"' in validator
    assert '"id"' not in validator.split('required =', 1)[1].split('}', 1)[0]


def test_slide_designer_protects_child_facing_content_beyond_pupil_instruction():
    text = (ROOT / "agents" / "slide-designer.md").read_text(encoding="utf-8")
    assert "Any string already authored in source-unit `content` that is rendered as pupil-facing" in text
    assert "Physical navigation and presentation headings remain Slide Designer-owned" in text


def test_adaptation_photo_merge_happens_before_worksheet_snapshot_and_spawn():
    text = read(SKILL)
    flat = " ".join(text.split())

    adaptation = flat.index("**Adaptation Designer**")
    provisional = flat.index("photo-contract.py build-provisional", adaptation)
    select = flat.index("photo-contract.py select-worksheet", provisional)
    promote = flat.index("photo-contract.py promote-used", select)
    assert adaptation < provisional < select < promote

    assert (
        "Adaptation may add only `adaptation-photo-###` entries; it may not "
        "mutate the frozen initial entries." in flat
    )
    assert (
        "Before every attempt, obtain the exact worksheet photo-contract path "
        "through `photo-contract.py select-worksheet`." in flat
    )
    assert (
        "promote only adaptation photos actually referenced by the accepted "
        "worksheet" in flat
    )
    assert "same id has different photo object" in read(ROOT / "scripts" / "photo-contract.py")
    assert "same filename has different id" in read(ROOT / "scripts" / "photo-contract.py")
    assert "Picture planning and sourcing then run in parallel with Worksheet Designer." not in text
    assert "Start any genuinely new adaptation-picture planning and sourcing after that merge" not in text
    assert "Merge adaptation photo IDs before Worksheet Designer snapshot/spawn." not in text
    assert "adaptation-designer completes -> queue worksheet-designer (Track B) right away" not in flat


def test_helper_preflight_includes_transitive_representation_uses():
    skill = read(SKILL)
    helper = read(ROOT / "scripts" / "collect-helper-uses.py")
    coverage = read(ROOT / "scripts" / "check-helper-coverage.py")
    # The runtime reaches the collector through the coverage check, so one
    # definition of "a required use" serves both the decision and its audit.
    assert "check-helper-coverage.py" in skill
    assert "collect-helper-uses.py" in coverage
    assert 'visual.get("kind") == "representation"' in helper
    assert "walk(design, (), rep_ids, raw)" in helper
    assert 'config.get("loadBearing") is True' in helper
    assert '"requiredFeatures": list(config.get("requiredFeatures") or [])' in helper
    assert "resolved.get((rep_id, config_id))" in helper
    assert "surface_for(path)" in helper
    assert 'interaction == "pupil-writes-on"' in helper
    assert '"requiredSurface": "stick-in"' in helper


def test_design_reviewer_durable_contract_includes_all_mutable_inputs():
    text = read(SKILL)
    flat = " ".join(text.split())
    start = flat.index("You are the design reviewer.")
    owned = flat.index("OWNED_OUTPUTS:", start)
    end = flat.index("ORCHESTRATOR_CHECK_AFTER_RETURN:", owned)
    block = flat[owned:end]
    for name in (
        "[WORKING_DIR]/lesson-design.json",
        "[WORKING_DIR]/design-decisions.md",
        "[WORKING_DIR]/photo-requirements.json",
        "[WORKING_DIR]/design-review.md",
    ):
        assert name in block, name


def test_stick_in_pedagogy_walks_json_not_markdown_headings():
    text = (ROOT / "references" / "stick-in-sheets-pedagogy.md").read_text(encoding="utf-8")
    assert "inspect each `teachingSequence` source unit in array order" in text
    assert "`lesson-design.json` determines which pedagogical moment is write-on" in text
    assert "Read lesson-design.md top to bottom" not in text


def test_slide_designer_has_no_second_answer_or_missing_script_authority():
    text = (ROOT / "agents" / "slide-designer.md").read_text(encoding="utf-8")
    assert "Answer treatment comes only from the source unit's structured `answer`." in text
    assert "Do not infer a reveal from stage, task type, whether an answer is definite" in text
    assert "A null script is an intentional absence, not a prompt for downstream script writing." in text
    assert "A definite-answer starter gets an answer slide next." not in text
    assert "derive a minimal lesson-specific note" not in text


def test_task_centred_reference_has_one_pupil_action_source():
    text = (ROOT / "references" / "teaching-sequence-task-centred.md").read_text(encoding="utf-8")
    assert "Use the common source-unit `pupilInstruction` for any pupil action performed at Set the Task" in text
    assert "`childTask`" not in text


def test_success_criteria_stay_exact_at_the_role_that_copies_them():
    """A shorter-but-compatible rewording is drift, and drift is now uncaught.

    A separate consistency reviewer used to compare the wall's steps against
    the board's. Nothing does now, so the rule has to hold at the only role
    that retypes the criteria onto another surface.
    """
    text = (ROOT / "agents" / "working-wall-designer.md").read_text(encoding="utf-8")
    assert "Success criteria steps in particular must be verbatim" in text
    assert "same number of steps, same wording, same punctuation" in text
    assert "Do not summarise the SC into shorter steps for the wall" in text
    assert "never reword the steps" in text


def test_worksheet_designer_protects_all_printed_upstream_text():
    text = (ROOT / "agents" / "worksheet-designer.md").read_text(encoding="utf-8")
    assert "Verbatim Expected pupil-visible text is broader than `pupilPrompt`." in text
    assert "frame headings and `whatGoesHere`" in text
    assert "Do not shorten or paraphrase visible support to make the page fit." in text


def test_phase_one_worker_and_orchestrator_both_validate_initial_contract():
    text = read(SKILL)
    flat = " ".join(text.split())
    worker_check = text.split("SUCCESS_CHECK:", 1)[1].split(
        "TERMINAL_STATE: COMPLETE", 1
    )[0]
    assert "validate-lesson-design.py" in worker_check
    assert "--initial-photo-namespace" in worker_check
    assert "LESSON_DESIGN_OK" in worker_check

    assert (
        "After return, require the four outputs and run the success check "
        "yourself." in flat
    )
    assert "check-photo-cap.py" in text
    assert "Do not re-run the scaffold builder" in flat


def test_phase_two_freezes_initial_photo_contract_for_initial_workers():
    text = read(SKILL)
    flat = " ".join(text.split())
    assert "phase2-initial-photo-requirements.json" in text
    assert 'photo-contract.py" freeze-initial' in text
    assert (
        "PHOTO_REQUIREMENTS_PATH: "
        "[WORKING_DIR]/phase2-initial-photo-requirements.json" in text
    )
    assert '--requirements "[WORKING_DIR]/phase2-initial-photo-requirements.json"' in text
    assert (
        "validate the emitted `manifest.json` with `validate-image-scout.py "
        "manifest`" in flat
    )
    assert "photo-contract.py promote-used" in flat
    assert '--canonical "[WORKING_DIR]/photo-requirements.json"' in text


def test_adaptation_merge_integrity_lives_in_photo_contract_helper():
    text = read(SKILL)
    helper = read(ROOT / "scripts" / "photo-contract.py")
    flat = " ".join(text.split())
    assert (
        "Adaptation may add only `adaptation-photo-###` entries; it may not "
        "mutate the frozen initial entries." in flat
    )
    for field in (
        "baseInitialPhotoSha256",
        "adaptationSha256",
        "mergedPhotoSha256",
        "newPhotoIds",
        "newFilenames",
    ):
        assert field in helper
    assert 'reason = "adaptation-merge"' in helper


def test_post_freeze_new_photos_use_immutable_supplemental_waves():
    text = read(SKILL)
    flat = " ".join(text.split())
    compiler = read(ROOT / "scripts" / "compile-picture-assignments.py")
    assert "**The supplemental picture wave**" in text
    assert "compile-picture-assignments.py" in text
    assert "expected-prefix" in compiler
    assert "Never reopen a passing sibling." in flat
    assert (
        "Keep its immutable schema-2 assignments, staged worker results, "
        "per-filename terminal receipts and final provenance" in flat
    )


def test_supplemental_picture_compilation_receives_immutable_contract():
    """The wave reads the snapshot the promotion wrote, not canonical.

    Canonical `photo-requirements.json` is rewritten by the next wave, so a
    compile pointed at it can source a contract that has already moved.
    """
    text = read(SKILL)
    flat = " ".join(text.split())
    compiler = read(ROOT / "scripts" / "compile-picture-assignments.py")
    wave = text.split("**The supplemental picture wave**", 1)[1].split(
        "Build worksheets directly", 1
    )[0]
    assert '--requirements "[WORKING_DIR]/photo-requirements-w-[N].json"' in wave
    assert '--requirements "[WORKING_DIR]/photo-requirements.json"' not in wave
    assert "--expected-prefix w" in wave
    assert "requirements" in compiler
    assert "schema_version" in compiler


def test_photo_promotion_semantically_validates_after_merge():
    text = read(SKILL)
    helper = read(ROOT / "scripts" / "photo-contract.py")
    flat = " ".join(text.split())
    assert helper.count("run_lesson_design_validator(Path(args.lesson_design),") == 2
    # build-provisional runs the validator itself when --lesson-design is
    # supplied, so the playbook must not ask for a second run by hand: the
    # hand-built invocation is where --initial-photo-namespace got carried onto a
    # merged contract and stalled the worksheet behind a needless diagnosis.
    assert "Run `photo-contract.py build-provisional`. Use exactly:" in flat
    assert "Do not run the validator again by hand." in flat

    provisional = helper[helper.index("def cmd_build_provisional"):helper.index("def cmd_promote_used")]
    assert provisional.index("run_photo_cap(output)") < provisional.index("run_lesson_design_validator") < provisional.index("receipt = {")

    promote = helper[helper.index("def cmd_promote_used"):helper.index("def valid_receipt")]
    assert promote.index("run_photo_cap(candidate)") < promote.index("run_lesson_design_validator") < promote.index("atomic_write_bytes(canonical_path")


def promoted_adaptation_ids(provisional, worksheet_refs):
    """Mirror deterministic promote-used identity selection.

    A photo is promoted when the accepted worksheet names it - by its
    adaptation-photo ID, or by the approved filename its renderer actually
    reads. Matching the ID alone promoted nothing from a real worksheet, whose
    `imagePath` can only carry the filename.
    """
    strings = set(worksheet_refs)
    return [
        photo["id"]
        for photo in provisional
        if photo["id"] in strings or photo["filename"] in strings
    ]


def test_supplemental_plan_owns_only_filenames_the_final_worksheet_uses():
    provisional = [
        {"id": "adaptation-photo-001", "filename": "generated/desk-fan.png"},
        {"id": "adaptation-photo-002", "filename": "generated/torch.png"},
        {"id": "adaptation-photo-003", "filename": "generated/vacuum.png"},
    ]
    assert promoted_adaptation_ids(provisional, ["adaptation-photo-002"]) == [
        "adaptation-photo-002"
    ]
    assert promoted_adaptation_ids(provisional, ["generated/torch.png"]) == [
        "adaptation-photo-002"
    ]

    skill = read(SKILL)
    flat = " ".join(skill.split())
    helper = read(ROOT / "scripts" / "photo-contract.py")
    assert (
        "promote only adaptation photos actually referenced by the accepted "
        "worksheet" in flat
    )
    assert 'if photo["id"] in strings or reference_forms(photo["filename"]) & strings' in helper


def test_design_reviewer_leaves_the_packet_check_to_the_orchestrator():
    """The reviewer does not run the packet check. It does run the validator
    over the file it edited.

    This used to assert a blanket "The orchestrator owns post-review
    validation", which the reviewer read as covering its own corrections too:
    on the Y4 series-circuit run (31 Aug 2026) it returned `APPROVED` with a
    `lookFor` it had widened to 31 words against a 25-word limit, and the
    package was lost to the repair round that followed. The boundary is now
    split rather than blanket - see
    test_reviewer_hands_back_a_valid_design.py.
    """
    text = (ROOT / "agents" / "design-reviewer.md").read_text(encoding="utf-8")
    flat = " ".join(text.split())
    assert "Do not run `design-review-packet.py verify` yourself." not in text
    assert (
        "`design-review-packet.py verify` is the separate check of the review "
        "packet itself; the orchestrator owns that one, and you do not run it."
        in flat
    )
    assert (
        "This is the validator over the file you edited, and it is yours."
        in flat
    )


def test_representation_capability_metadata_is_configuration_level_everywhere():
    text = OUTPUT_TEMPLATE.read_text(encoding="utf-8")
    validator = VALIDATOR.read_text(encoding="utf-8")
    assert "Put `loadBearing` and `requiredFeatures` on each configuration, never on the representation root." in text
    assert 'config_fields = {"id", "description", "loadBearing", "requiredFeatures"}' in validator
    assert "whether it is load-bearing, the visible features that must survive rendering" not in text


def test_lesson_designer_uses_current_contract_field_names():
    output_template = OUTPUT_TEMPLATE.read_text(encoding="utf-8")
    lesson_designer = (
        ROOT / "agents" / "lesson-designer.md"
    ).read_text(encoding="utf-8")

    validator = VALIDATOR.read_text(encoding="utf-8")

    assert (
        "a stable `rep-###` ID, a `name`, a `purpose`"
        in output_template
    )
    assert "`instructionalPurpose`" not in output_template

    # Vocabulary visual kinds come from the output template, and the
    # Lesson Designer defers to it rather than re-listing the kinds.
    assert "`visual.kind` is one of:" in output_template
    assert "use kinds defined in `output-template.md`" in lesson_designer

    assert "`photo-ref`" not in output_template
    assert "`photo-ref`" not in lesson_designer
    assert "`instructionalPurpose`" not in lesson_designer
    assert 'allowed = {"none", "emoji", "photo", "representation", "built-in", "description"}' in validator


def test_initial_scaffold_keeps_output_template_as_canonical_fallback():
    designer = (
        ROOT / "agents" / "lesson-designer.md"
    ).read_text(encoding="utf-8")

    output_template = (
        ROOT / "references" / "output-template.md"
    ).read_text(encoding="utf-8")

    guide = (
        ROOT
        / "references"
        / "lesson-design-scaffold.md"
    ).read_text(encoding="utf-8")

    assert (
        "lesson-design-scaffold-request.initial.json"
        in designer
    )
    assert (
        "lesson-design-scaffold.py"
        in output_template
    )
    assert (
        "Use `output-template.md` selectively"
        in guide
    )
    assert (
        "When no scaffold command is supplied"
        in guide
    )
    assert (
        "__LESSON_DESIGN_FILL__"
        in designer
    )


def test_working_wall_and_final_report_use_canonical_structure_names():
    wall = (ROOT / "agents" / "working-wall-designer.md").read_text(encoding="utf-8")
    skill = read(SKILL)
    assert "whose values are `Skill-based`, `Content-based`, `Discovery`, `Dialogic` or `Task-Centred`" in wall
    assert "Procedural / Explicit-skill / Explicit-content / Discovery / Dialogic" not in wall
    for retired in (
        "Explicit skill-based",
        "Explicit content-based",
        "Procedural /",
    ):
        assert retired not in skill, retired


def test_empty_photo_list_keeps_non_photo_visual_support_available():
    text = (ROOT / "references" / "output-template.md").read_text(encoding="utf-8")
    designer = (ROOT / "agents" / "lesson-designer.md").read_text(encoding="utf-8")
    assert "Maths usually has an empty `photos` list because its visual tools are rendered directly" in text
    assert "always has an empty `photos` list" not in text
    assert "When word names idea no picture can honestly carry" in designer
    assert '"kind": "none"' in designer
    assert '"kind": "built-in"' in designer
    assert "write `visual: \U0001f51f emoji`" not in text
    assert "visual: diagram \u2014 number line showing position of 0.3" not in text


if __name__ == "__main__":
    failed = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            try:
                fn()
                print("PASS", name)
            except AssertionError as exc:
                failed += 1
                print("FAIL", name, str(exc)[:500])
    raise SystemExit(1 if failed else 0)


def test_a_web_address_in_a_picture_object_is_refused():
    """A URL in the picture contract is a route the run does not have.

    On 3 September 2026 a Year 4 history Lesson Designer searched the web while
    planning, found five ideal archive photographs, could not express "fetch
    this exact file", and wrote the official source pages into
    `pedagogical_constraint` beside the sentence "the schema only permits
    Wikimedia/Unsplash routes". It shipped that contract anyway. The compiled
    searches found nothing, all five came back terminally unsatisfied, and the
    teacher received a working wall with no slides, no worksheet and no answer
    key. The designer had already written down that the design was unbuildable;
    nothing read it, because nothing was looking.
    """
    for field, value in (
        (
            "pedagogical_constraint",
            "Use the exact interior. Official source page: "
            "https://www.essexrecordofficeblog.co.uk/school-then-and-now/",
        ),
        ("subject", "Ford End School classroom, www.essexrecordoffice.co.uk"),
        (
            "teaching_requirement",
            "Compare the classrooms; see http://example.org/pair for the pair.",
        ),
    ):
        design, photos = valid_contract()
        photo = photo_requirement(
            "photo-001",
            "A classroom around 1900",
            "unsplash/classroom-c1900.jpg",
        )
        photo[field] = value
        photos["photos"] = [photo]
        assert_invalid_contract(
            design,
            photos,
            f"photo-requirements.json.photos[0].{field} contains a web address",
        )


def test_a_web_address_inside_evidence_or_a_prompt_is_refused():
    """The same link moved one field down is the same missing route."""
    design, photos = valid_contract()
    photo = photo_requirement(
        "photo-001",
        "A classroom around 1900",
        "unsplash/classroom-c1900.jpg",
    )
    photo["load_bearing_evidence"] = [
        "the original interior at https://example.org/i-mb-383-1-52.jpg"
    ]
    photos["photos"] = [photo]
    assert_invalid_contract(
        design,
        photos,
        "photos[0].load_bearing_evidence[0] contains a web address",
    )

    design, photos = valid_contract()
    photo = photo_requirement(
        "photo-001",
        "A classroom around 1900",
        "unsplash/classroom-c1900.jpg",
    )
    photo["generation_prompt"]["composition"] = "match https://example.org/ref.jpg"
    photos["photos"] = [photo]
    assert_invalid_contract(
        design,
        photos,
        "photos[0].generation_prompt.composition contains a web address",
    )


def test_a_picture_contract_that_asks_for_a_crop_is_refused():
    """Nothing downstream crops a delivered picture, so a contract that plans on
    one is planning on a stage that has never existed.

    A Year 4 place-value lesson (3 September 2026) asked for "three isolated
    landscape panels with generous crop-safe gutters" holding the My Turn's two
    numerals, the Our Turn's two and the Your Turn's four. The file arrived whole
    and landed whole on all four slides: a My Turn carrying eight questions
    including ones the class had not reached, its answers on the board before
    anyone had worked, four consecutive slides rendering as one picture, and
    every chart a quarter of the size it would have had alone.
    """
    for field, value in (
        (
            "subject",
            "A crop-ready flat vector asset holding the charts for three slide stages",
        ),
        (
            "pedagogical_constraint",
            "Wide blank margins so the slide designer can crop one panel without its neighbour.",
        ),
    ):
        design, photos = valid_contract()
        photo = photo_requirement(
            "photo-001",
            "Four-column place-value charts",
            "generated/place-value-charts.png",
        )
        photo[field] = value
        photos["photos"] = [photo]
        assert_invalid_contract(
            design,
            photos,
            f"photo-requirements.json.photos[0].{field} asks for the picture to be",
        )

    design, photos = valid_contract()
    photo = photo_requirement(
        "photo-001",
        "Four-column place-value charts",
        "generated/place-value-charts.png",
    )
    photo["generation_prompt"]["composition"] = (
        "Two chart bodies stacked with a wide blank crop gutter between them."
    )
    photos["photos"] = [photo]
    assert_invalid_contract(
        design,
        photos,
        "photos[0].generation_prompt.composition asks for the picture to be",
    )


def test_the_framing_of_a_photograph_is_still_allowed_to_be_called_a_crop():
    """The discrimination, and the reason this is not a ban on a word.

    A matched pair of maps has to agree on how each is framed, and "identical in
    projection, crop, scale and palette" is the right way to say so. That names
    the picture that arrives; it does not ask anyone to cut it up afterwards.
    """
    design, photos = valid_contract()
    photo = photo_requirement(
        "photo-001",
        "A political map of South America",
        "generated/south-america.png",
    )
    photo["pedagogical_constraint"] = (
        "Match the companion map exactly in projection, crop, scale and palette."
    )
    photos["photos"] = [photo]
    module.validate_design(design, photos)


def test_the_refusal_names_the_route_that_does_reach_the_source():
    """A designer that found the perfect source is not told to forget it.

    The scout's ladder ends at the holding institution's own page, so the exact
    photograph is reachable. What has to change is who fetches it: the designer
    names the subject and the institution, and the scout goes and gets it.
    """
    design, photos = valid_contract()
    photo = photo_requirement(
        "photo-001",
        "A classroom around 1900",
        "unsplash/classroom-c1900.jpg",
        pedagogical_constraint="Source: https://example.org/photo",
    )
    photos["photos"] = [photo]
    try:
        module.validate_design(design, photos)
    except module.ContractError as exc:
        message = str(exc)
    else:
        raise AssertionError("contract unexpectedly validated")
    assert "the Image Scout's job" in message, message
    assert "Openverse" in message, message
    assert "Essex Record Office" in message, message


def test_an_ordinary_picture_contract_still_validates():
    """The gate must not fire on prose that merely mentions a place or a dot."""
    design, photos = valid_contract()
    photos["photos"] = [
        photo_requirement(
            "photo-001",
            "A classroom around 1900",
            "unsplash/classroom-c1900.jpg",
            pedagogical_constraint=(
                "Children at rows of desks. Keep the room and the adults "
                "visible. Do not crop to one child."
            ),
        )
    ]
    module.validate_design(design, photos)


# An Our Turn's guiding questions used to sit in `content.guidedQuestions`, which
# the design-review packet counted as child-facing, so the slide-designer printed
# every one of them on the board beside the example they were meant to draw out
# of the class. A Year 4 rounding deck reached the teacher with three spoken
# prompts on one Our Turn slide (Daniel, 12 September 2026). They live in the
# spoken script now, and these two checks are what keeps them there: the field
# cannot come back, and a script that asks the class nothing is not an Our Turn.
def test_an_our_turn_cannot_carry_printed_guiding_questions():
    def mutate(design, photos):
        for unit in design["teachingSequence"]:
            if unit["kind"] == "our-turn":
                unit["content"]["guidedQuestions"] = ["Which tens can we add?"]
                return
        raise AssertionError("no our-turn unit in the valid contract")

    assert_invalid(mutate, "guidedQuestions")


def test_an_our_turn_script_must_ask_the_class_something():
    def mutate(design, photos):
        for unit in design["teachingSequence"]:
            if unit["kind"] == "our-turn":
                unit["speakerNotes"]["script"] = "Say to children: watch me add the tens."
                return
        raise AssertionError("no our-turn unit in the valid contract")

    assert_invalid(mutate, "must ask the class at least one question")
