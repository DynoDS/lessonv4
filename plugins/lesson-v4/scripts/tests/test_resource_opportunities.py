"""The lesson's own record of whether a stick-in piece or a wall is worth a worker.

The stick-in designer found nothing to print on two of three lessons in one
day, each time after a full read of its role, its pedagogy and the lesson. The
lesson designer already holds every fact that walk uses, so the approved
contract now records the decision and a deterministic command reads it. These
tests hold the two halves honest: a `none` the lesson's own moments contradict
never validates, and the command launches the worker for everything except a
validated `none`.
"""
from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
VALIDATOR = ROOT / "scripts" / "validate-lesson-design.py"
SCAFFOLD = ROOT / "scripts" / "lesson-design-scaffold.py"
PACKET = ROOT / "scripts" / "design-review-packet.py"
COMMAND = ROOT / "scripts" / "resource-opportunities.py"
CONTRACT_TESTS = Path(__file__).with_name("test_lesson_design_contract.py")
SCAFFOLD_TESTS = Path(__file__).with_name("test_lesson_design_scaffold.py")


def load(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


validator = load(VALIDATOR, "ro_validate_lesson_design")
scaffold = load(SCAFFOLD, "ro_lesson_design_scaffold")
packet = load(PACKET, "ro_design_review_packet")
contract = load(CONTRACT_TESTS, "ro_contract_fixtures")
scaffold_tests = load(SCAFFOLD_TESTS, "ro_scaffold_fixtures")

UNIT_1 = "lesson-section/teaching-sequence/unit-001"


def decided(stick_in: dict, wall: dict | None = None) -> dict:
    return {
        "stickIn": stick_in,
        "workingWall": wall or {
            "decision": "uncertain",
            "sourceUnitIds": [],
            "reason": "A reference table may earn a card; the wall designer decides.",
        },
    }


NONE = {
    "decision": "none",
    "sourceUnitIds": [],
    "reason": "Every moment leaves children writing answers in their own hand.",
}
CANDIDATE = {
    "decision": "candidate",
    "sourceUnitIds": [UNIT_1],
    "reason": "Children plot onto a grid they cannot rule by hand.",
}


def design_with(stick_in: dict, wall: dict | None = None):
    design, photos = contract.valid_contract()
    design["resourceOpportunities"] = decided(stick_in, wall)
    return design, photos


def failure(design, photos) -> str:
    with pytest.raises(validator.ContractError) as caught:
        validator.validate_design(design, photos)
    return str(caught.value)


def test_a_design_without_the_block_still_validates():
    design, photos = contract.valid_contract()
    assert "resourceOpportunities" not in design
    validator.validate_design(design, photos)


def test_candidate_and_none_and_uncertain_validate_when_well_formed():
    for entry in (CANDIDATE, NONE, {"decision": "uncertain", "sourceUnitIds": [], "reason": "Not clear-cut."}):
        design, photos = design_with(entry)
        validator.validate_design(design, photos)


def test_shape_rules_are_enforced():
    cases = {
        "candidate must name a unit": ({**CANDIDATE, "sourceUnitIds": []}, "at least one sourceUnitId"),
        "none must name no unit": ({**NONE, "sourceUnitIds": [UNIT_1]}, "empty sourceUnitIds"),
        "none must say why": ({**NONE, "reason": "No."}, "why the book alone"),
        "uncertain must give a reason": ({"decision": "uncertain", "sourceUnitIds": [], "reason": ""}, "reason"),
        "decision is one of three": ({**CANDIDATE, "decision": "maybe"}, "decision invalid"),
        "units must exist": ({**CANDIDATE, "sourceUnitIds": ["lesson-section/teaching-sequence/unit-099"]}, "unknown id"),
    }
    for label, (entry, fragment) in cases.items():
        design, photos = design_with(entry)
        message = failure(design, photos)
        assert fragment in message, f"{label}: {message}"

    design, photos = design_with(CANDIDATE)
    design["resourceOpportunities"].pop("workingWall")
    assert "missing fields: workingWall" in failure(design, photos)


def write_on_unit(design: dict) -> dict:
    """The last teaching unit (independent work), with children writing on the representation."""
    unit = design["teachingSequence"][-1]
    assert unit["modellingState"] is None
    rep = design["representations"][0]
    unit["representationRefs"] = [
        {
            "ref": rep["id"],
            "configuration": rep["configurations"][0]["id"],
            "interaction": "pupil-writes-on",
        }
    ]
    return unit


def test_none_is_refused_while_children_write_on_a_representation():
    design, photos = design_with(NONE)
    unit = write_on_unit(design)
    message = failure(design, photos)
    assert "stickIn.decision none is contradicted by" in message
    assert unit["sourceUnitId"] in message
    assert "pupil-writes-on" in message

    # The same lesson, honestly recorded, validates.
    design["resourceOpportunities"]["stickIn"] = {
        **CANDIDATE,
        "sourceUnitIds": [unit["sourceUnitId"]],
    }
    validator.validate_design(design, photos)


def test_a_board_sort_does_not_contradict_none_but_a_card_sort_does():
    design, photos = design_with(NONE)
    unit = design["teachingSequence"][-1]
    unit["pupilInstruction"] = "Sort each shape into the right group."
    unit["taskStructure"] = {
        "kind": "sort",
        "groups": [
            {"id": "group-001", "label": "Has a right angle"},
            {"id": "group-002", "label": "No right angle"},
        ],
        "items": [
            {"id": "item-001", "label": "square", "detail": None, "photoRef": None},
            {"id": "item-002", "label": "equilateral triangle", "detail": None, "photoRef": None},
        ],
    }
    # Done from the board: nothing to print, so the honest none stands.
    validator.validate_design(design, photos)
    assert run_command(design).stdout.strip() == f"STICK_IN_SKIP: {NONE['reason']}"

    # The same sort done with printed cards is a card kit, so none is refused.
    unit["taskStructure"]["handling"] = {
        "kind": "cards", "per": "pair", "groupCount": None, "where": "At tables, one set between two."
    }
    message = failure(design, photos)
    assert "contradicted by" in message and "printed cards" in message, message
    assert unit["sourceUnitId"] in message


def test_wall_entry_never_contradicts_on_write_on_evidence():
    design, photos = design_with(CANDIDATE, {**NONE})
    write_on_unit(design)
    design["resourceOpportunities"]["stickIn"]["sourceUnitIds"] = [UNIT_1]
    validator.validate_design(design, photos)


def test_scaffold_emits_the_envelope_to_fill():
    design, _ = scaffold.build_scaffold(scaffold_tests.base_request())
    block = design["resourceOpportunities"]
    assert set(block) == {"stickIn", "workingWall"}
    for entry in block.values():
        assert entry == {
            "decision": scaffold.PLACEHOLDER,
            "sourceUnitIds": scaffold.PLACEHOLDER,
            "reason": scaffold.PLACEHOLDER,
        }


def test_review_view_surfaces_the_decision():
    design, photos = design_with(NONE)
    view = packet.build_review_view(design, photos)
    assert "## Resource opportunities" in view
    assert "Stick-in sheets: **none**" in view
    assert NONE["reason"] in view
    assert "Working wall: **uncertain**" in view

    design.pop("resourceOpportunities")
    assert "## Resource opportunities" not in packet.build_review_view(design, photos)


def run_command(design: dict | str) -> subprocess.CompletedProcess:
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "lesson-design.json"
        path.write_text(
            design if isinstance(design, str) else json.dumps(design),
            encoding="utf-8",
        )
        return subprocess.run(
            [sys.executable, str(COMMAND), "stick-in", "--lesson-design", str(path)],
            capture_output=True,
            text=True,
        )


def test_command_skips_only_on_a_validated_none():
    design, _ = design_with(NONE)
    result = run_command(design)
    assert result.returncode == 0, result.stderr
    assert result.stdout.strip() == f"STICK_IN_SKIP: {NONE['reason']}"

    for entry in (CANDIDATE, {"decision": "uncertain", "sourceUnitIds": [], "reason": "Not sure."}):
        design, _ = design_with(entry)
        assert run_command(design).stdout.strip() == "STICK_IN_LAUNCH"

    design, _ = contract.valid_contract()
    assert run_command(design).stdout.strip() == "STICK_IN_LAUNCH"


def test_command_launches_when_the_lesson_contradicts_its_own_none():
    design, _ = design_with(NONE)
    write_on_unit(design)
    assert run_command(design).stdout.strip() == "STICK_IN_LAUNCH"

    design, _ = design_with({**NONE, "reason": "   "})
    assert run_command(design).stdout.strip() == "STICK_IN_LAUNCH"


def test_command_refuses_an_unreadable_design():
    result = run_command("{not json")
    assert result.returncode == 1
    assert "RESOURCE_OPPORTUNITIES_ERROR" in result.stderr


def test_playbook_reads_the_decision_and_never_judges_it():
    playbook = (ROOT / "skills" / "make-lesson" / "playbook-lite.md").read_text(encoding="utf-8")
    text = " ".join(playbook.split())
    assert "resource-opportunities.py" in text
    assert "On `STICK_IN_LAUNCH`, launch the stick-in designer" in text
    assert "NOT DELIVERED - not needed:" in text
    assert "Launch the stick-in designer on every run" not in text


def test_designer_and_reviewer_own_the_decision():
    designer = (ROOT / "agents" / "lesson-designer.md").read_text(encoding="utf-8")
    assert "resourceOpportunities" in designer
    assert "The write-on moments" in designer
    reviewer = (ROOT / "agents" / "design-reviewer.md").read_text(encoding="utf-8")
    assert "recorded resource opportunities" in reviewer
    template = (ROOT / "references" / "output-template.md").read_text(encoding="utf-8")
    assert "### Resource opportunities" in template
    guide = (ROOT / "references" / "lesson-design-scaffold.md").read_text(encoding="utf-8")
    assert "resourceOpportunities" in guide


# --- the main activity's source has to reach the child's hands -------------

opportunities = load(COMMAND, "ro_resource_opportunities")


def _beat(**overrides):
    beat = {
        "sourceUnitId": "lesson-section/teaching-sequence/unit-004",
        "kind": "do",
        "content": {"task": "Fill in all three parts. Use her own words to show how you know."},
        "pupilInstruction": "Fill in the table with your partner.",
        "representationRefs": [{"ref": "rep-001", "configuration": "record", "interaction": "pupil-uses"}],
        "taskStructure": None,
    }
    beat.update(overrides)
    return beat


def test_a_main_activity_working_from_a_source_needs_that_source_printed():
    design = {"teachingSequence": [_beat()]}
    faults = opportunities.source_faults(design, {"items": []})
    assert len(faults) == 1
    assert "prints no source" in faults[0]


def test_the_printed_source_settles_it():
    design = {"teachingSequence": [_beat()]}
    stick_in = {"items": [{"visual": "source-text", "spec": {"title": "Patience Kershaw, 1842", "text": "..."}}]}
    assert opportunities.source_faults(design, stick_in) == []


def test_a_quick_marking_beat_is_whiteboard_work_and_is_left_alone():
    """The teacher's own line (18 September 2026): a quick underline-the-line is
    whiteboard work, and printing a class set for thirty seconds of thinking is
    paper nobody needed. What must arrive resourced is the beat needing two
    things at once, something to work from and something to work into."""
    quick = _beat(
        content={"task": "Underline the line in the extract that shows she was frightened."},
        representationRefs=[],
        pupilInstruction=None,
    )
    assert opportunities.source_faults({"teachingSequence": [quick]}, {"items": []}) == []


def test_a_main_activity_that_does_not_work_from_a_source_is_left_alone():
    sort_beat = _beat(
        content={"task": "Sort the cards."},
        representationRefs=[],
        taskStructure={"kind": "sort", "items": [], "groups": []},
        pupilInstruction="Put each card under its heading.",
    )
    assert opportunities.source_faults({"teachingSequence": [sort_beat]}, {"items": []}) == []
