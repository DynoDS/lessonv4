"""A Do's board carries what lets its slide make sense on its own.

The teacher judged the Do beats of five finished lessons on 5 November 2026.
The weak ones were good task ideas whose slide never said who or what the
task was about, what the class was doing and why, or exactly what to do,
because the design had nowhere to write those parts: they ended up in the
notes, which the child never sees and the reviewer judged instead. And a
comparison table or a draw-lines match could not be written at all, so the
Geography 3 Yanomami Do reached the stick-in designer with no material and
came back with a sheet that did not match the board.

So a unit the class works on carries `board` (context, goal, actions, stems)
and `taskStructure` may be a `table` or a `match`. These checks pin the data
side: a healthy design with all three validates; each broken part is refused
with a message that says what to write; a saved design without `board` still
validates; the review surface and the voice editor's lane carry every board
string, table cell and match label; and a quick check planned past five
minutes gets a look again, never a refusal.
"""
from __future__ import annotations

import copy
import importlib.util
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest

TESTS = Path(__file__).resolve().parent
ROOT = TESTS.parents[1]
sys.path.insert(0, str(TESTS))

from test_lesson_design_contract import module as validator, valid_content_contract  # noqa: E402
from test_lesson_design_scaffold import base_request, scaffold  # noqa: E402


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / filename)
    loaded = importlib.util.module_from_spec(spec)
    sys.modules[name] = loaded
    spec.loader.exec_module(loaded)
    return loaded


packet = load("board_test_design_review_packet", "design-review-packet.py")
voice = load("board_test_check_voice_edit", "check-voice-edit.py")

HANDLING = {"kind": "sheet", "per": "pair", "groupCount": None, "where": "One sheet between two."}

BOARD = {
    "context": [
        "The Tikuna live by a big river.",
        "The Yanomami live in the forest, by a small stream.",
    ],
    "goal": "We are going to work out how the Yanomami get what they need.",
    "actions": ["Read what the Tikuna do.", "Use the clue to fill in the Yanomami."],
    "stems": ["The Yanomami get it from..."],
}

TABLE = {
    "kind": "table",
    "columns": [
        {"id": "col-001", "label": "What they need", "choices": None},
        {"id": "col-002", "label": "The Tikuna", "choices": None},
        {"id": "col-003", "label": "How do the Yanomami get it?", "choices": None},
        {"id": "col-004", "label": "Same or different?", "choices": ["same", "different"]},
    ],
    "rows": [
        {"id": "row-001", "cells": ["water", "From the river.", "From the stream.", "different"]},
        {"id": "row-002", "cells": ["food", "Lots of fish from the river.", None, None]},
    ],
    "togetherRowRef": "row-001",
    "handling": dict(HANDLING),
}

MATCH = {
    "kind": "match",
    "left": [
        {"id": "left-001", "label": "Swept the rubbish out of the yard."},
        {"id": "left-002", "label": "Boiled the water before drinking it."},
    ],
    "right": [
        {"id": "right-001", "label": "Would try it"},
        {"id": "right-002", "label": "Would not try it"},
    ],
    "togetherPair": {"leftRef": "left-001", "rightRef": "right-001"},
    "handling": dict(HANDLING),
}

MATCH_ANSWER = {
    "kind": "exact",
    "content": None,
    "structure": {
        "kind": "match",
        "pairs": [
            {"leftRef": "left-001", "rightRef": "right-001"},
            {"leftRef": "left-002", "rightRef": "right-001"},
        ],
    },
    "acceptanceCondition": None,
    "delivery": "teacher-only",
}


def board_design():
    """The content route's design with a table Do and a match practice, each
    set by its board."""
    design, photos = valid_content_contract()
    sequence = design["teachingSequence"]
    do, practise = sequence[2], sequence[3]
    assert do["kind"] == "do" and practise["kind"] == "practise"
    do["board"] = copy.deepcopy(BOARD)
    do["pupilInstruction"] = None
    do["taskStructure"] = copy.deepcopy(TABLE)
    do["content"]["task"] = "How do the Yanomami get food?"
    do["answer"] = {
        "kind": "model",
        "content": "They catch a few small fish and hunt in the forest, which is different.",
        "acceptanceCondition": "Accept any way of getting food that the clue supports.",
        "delivery": "teacher-only",
    }
    practise["board"] = {
        "context": [],
        "goal": "We are going to decide what people in 1850 would try.",
        "actions": ["Join each idea to what people would do."],
        "stems": [],
    }
    practise["pupilInstruction"] = None
    practise["taskStructure"] = copy.deepcopy(MATCH)
    practise["answer"] = copy.deepcopy(MATCH_ANSWER)
    for unit in sequence:
        unit.setdefault("board", None)
    return design, photos


def refused(design, photos) -> str:
    with pytest.raises(validator.ContractError) as caught:
        validator.validate_design(design, photos)
    return str(caught.value)


def test_a_healthy_design_with_a_board_a_table_and_a_match_validates():
    validator.validate_design(*board_design())


def test_a_saved_design_without_a_board_still_validates():
    design, photos = valid_content_contract()
    assert all("board" not in unit for unit in design["teachingSequence"])
    validator.validate_design(design, photos)


@pytest.mark.parametrize(
    "break_it, message",
    [
        (lambda s: s[2].update(pupilInstruction="Fill in the table."),
         "pupilInstruction must be null when board is present"),
        (lambda s: s[2].update(board=None),
         "board is null, but this do is a task the class works on"),
        (lambda s: s[1].update(board=copy.deepcopy(BOARD)),
         "board must be null on a teach"),
        (lambda s: s[2]["board"].pop("goal"),
         "board missing"),
        (lambda s: s[2]["board"].update(actions=[]),
         "board.actions must hold 1 to 4 short cards"),
        (lambda s: s[2]["board"].update(context=["One.", "Two.", "Three.", "Four."]),
         "board.context must hold at most 3 short sentences"),
        (lambda s: s[2]["board"].update(stems=["a", "b", "c", "d"]),
         "board.stems must hold at most 3 stems"),
        (lambda s: s[2]["board"].update(actions=["How do the Yanomami get food?"]),
         "repeats content.task"),
        (lambda s: s[2]["taskStructure"]["rows"][1].update(cells=["food", None]),
         "cells must hold one cell per column"),
        (lambda s: s[2]["taskStructure"]["rows"][1].update(cells=["food", "Fish.", None, "maybe"]),
         "answered by circling one of same, different"),
        (lambda s: s[2]["taskStructure"].update(togetherRowRef="row-002"),
         "which has an empty cell"),
        (lambda s: s[2]["taskStructure"]["rows"][1].update(cells=["food", "Fish.", "Fish.", "same"]),
         "leaves nothing for children to fill"),
        (lambda s: s[2]["taskStructure"].update(handling=None),
         "a table is printed as well as shown on the board"),
        (lambda s: s[2].update(answer={
            "kind": "model", "content": None, "acceptanceCondition": None, "delivery": "teacher-only",
            "structure": {"kind": "table"}}),
         "structure is not allowed when taskStructure.kind is table"),
        (lambda s: s[3]["answer"]["structure"].update(pairs=[{"leftRef": "left-001", "rightRef": "right-001"}]),
         "pairs missing left items: left-002"),
        (lambda s: s[3]["answer"]["structure"]["pairs"].append({"leftRef": "left-002", "rightRef": "right-002"}),
         "joins left-002 twice"),
        (lambda s: s[3]["taskStructure"].update(togetherPair={"leftRef": "left-002", "rightRef": "right-002"}),
         "but taskStructure.togetherPair shows the class that line as right"),
        (lambda s: s[3]["taskStructure"]["left"][0].update(id="item-001"),
         "must match left-###"),
    ],
)
def test_each_broken_part_is_refused_with_what_to_write(break_it, message):
    design, photos = board_design()
    break_it(design["teachingSequence"])
    assert message in refused(design, photos)


def test_a_sort_may_name_the_card_placed_together_and_only_its_own():
    sort = {
        "kind": "sort",
        "groups": [{"id": "group-001", "label": "Solid"}, {"id": "group-002", "label": "Liquid"}],
        "items": [
            {"id": "item-001", "label": "ice", "detail": None, "photoRef": None},
            {"id": "item-002", "label": "milk", "detail": None, "photoRef": None},
        ],
        "handling": dict(HANDLING),
        "togetherItemRef": "item-001",
    }
    validator.validate_task_structure(copy.deepcopy(sort), "taskStructure", unit_photo_refs=set())
    sort["togetherItemRef"] = "item-009"
    with pytest.raises(validator.ContractError, match="togetherItemRef must be null or the id"):
        validator.validate_task_structure(sort, "taskStructure", unit_photo_refs=set())


def test_the_surface_shows_the_whole_do_as_the_child_sees_it():
    design, photos = board_design()
    surface = packet.build_surface_view(design, photos)
    for text in BOARD["context"] + [BOARD["goal"]] + BOARD["actions"] + BOARD["stems"]:
        assert text in surface
    assert "How do the Yanomami get food?" in surface
    assert "What they need | The Tikuna | How do the Yanomami get it? | Same or different?" in surface
    assert "food | Lots of fish from the river. | ______ | ______" in surface
    assert "Same or different? (circle one): same | different" in surface
    for side in ("left", "right"):
        for entry in MATCH[side]:
            assert entry["label"] in surface
    # The board reads in the slide's order: the case, the goal, the question,
    # then the cards.
    order = [surface.index(BOARD["context"][0]), surface.index(BOARD["goal"]),
             surface.index("How do the Yanomami get food?"), surface.index(BOARD["actions"][0])]
    assert order == sorted(order)


def test_the_review_view_and_the_do_beside_its_teaching_name_the_board():
    design, photos = board_design()
    review = packet.build_review_view(design, photos)
    assert "**Board:**" in review
    beside = "\n".join(packet.build_do_beside_teach(design))
    assert "- What the class is going to do: " + BOARD["goal"] in beside
    assert "- Table: What they need | The Tikuna" in beside


def test_the_voice_editor_reads_every_board_string_table_cell_and_match_label():
    design, _photos = board_design()
    forms = voice.class_forms(design, voice.load_packet())
    wanted = BOARD["context"] + [BOARD["goal"]] + BOARD["actions"] + BOARD["stems"]
    wanted += [column["label"] for column in TABLE["columns"]]
    wanted += [cell for row in TABLE["rows"] for cell in row["cells"] if cell is not None]
    wanted += ["same", "different"]
    wanted += [entry["label"] for side in ("left", "right") for entry in MATCH[side]]
    missing = [text for text in wanted if text not in forms]
    assert not missing, missing


def run_do_beats(design: dict) -> str:
    with tempfile.TemporaryDirectory() as folder:
        path = Path(folder) / "lesson-design.json"
        path.write_text(json.dumps(design), encoding="utf-8")
        done = subprocess.run(
            [sys.executable, "-X", "utf8", str(ROOT / "scripts" / "do-beats-in-a-row.py"), str(path)],
            capture_output=True, text=True, encoding="utf-8", check=True,
        )
    return done.stdout


def test_the_row_prints_the_board_and_the_material():
    design, _photos = board_design()
    out = run_do_beats(design)
    assert "board, what we are going to do: " + BOARD["goal"] in out
    assert "board, action cards: Read what the Tikuna do. | Use the clue to fill in the Yanomami." in out
    assert "told: \"Read what the Tikuna do." in out
    # A match's key reaches the response contract the way a sort's placements do.
    assert "model/exact answer: Swept the rubbish out of the yard. with Would try it" in out


def test_a_quick_check_planned_past_five_minutes_is_looked_at_again_not_refused():
    design, photos = board_design()
    do = design["teachingSequence"][2]
    do["doMode"] = "quick"
    do["minutes"] = 6
    out = run_do_beats(design)
    assert "is a quick check (doMode quick) planned at 6 minutes" in out
    assert "LOOK AGAIN" in out
    do["minutes"] = 5
    assert "is a quick check (doMode quick)" not in run_do_beats(design)


def test_the_scaffold_writes_the_board_and_the_new_task_envelopes():
    request = base_request()
    kinds = [item["kind"] for item in request["teachingSequence"]]
    do_at = kinds.index("do")
    practise_at = kinds.index("practise")
    request["teachingSequence"][do_at]["taskStructure"] = "table"
    request["teachingSequence"][practise_at]["taskStructure"] = "match"
    design, _ = scaffold.build_scaffold(request)
    sequence = design["teachingSequence"]
    PH = scaffold.PLACEHOLDER
    board = {"context": [PH], "goal": PH, "actions": [PH], "stems": [PH]}

    assert sequence[do_at]["board"] == board
    assert sequence[do_at]["pupilInstruction"] is None
    assert sequence[do_at]["taskStructure"] == {
        "kind": "table", "columns": [PH], "rows": [PH], "togetherRowRef": PH, "handling": PH,
    }
    assert "structure" not in sequence[do_at]["answer"]
    assert sequence[practise_at]["board"] == board
    assert sequence[practise_at]["pupilInstruction"] == PH
    assert sequence[practise_at]["taskStructure"]["kind"] == "match"
    assert sequence[practise_at]["answer"]["structure"] == {"kind": "match", "pairs": [PH]}
    for unit in sequence:
        if unit["kind"] not in validator.BOARD_KINDS:
            assert unit["board"] is None
    assert design["starter"]["board"] is None
