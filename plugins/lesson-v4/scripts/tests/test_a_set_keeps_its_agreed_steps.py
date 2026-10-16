"""A lesson built as one of a set keeps the set's agreed method steps and word cards.

Lessons built side by side cannot read each other. Lessons 28 to 32 (Year 4
column subtraction, 15 October 2026) were, and the exchange step came out
worded four ways in four days: Thursday's and Friday's lists dropped the lines
Tuesday and Wednesday taught for crossing out and writing the 1, and Monday's
`Nothing to take away? Write the top digit.` vanished after Monday. A set now
agrees its thread before the lessons split (lesson-batch.py), each lesson's
filing.txt names it, and the design check holds the lesson to it. Colour marks
may differ day to day; the words, the order and the smaller points may not.
"""
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))
_spec = importlib.util.spec_from_file_location("validate_lesson_design_set", SCRIPTS / "validate-lesson-design.py")
validator = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(validator)

# The week's list as the teacher approved it on 15 October 2026.
WEEK = [
    "Line up the digits.",
    "Write the symbol.",
    "Start with the ((ones)). Then ((tens)), then ((hundreds)), then ((thousands)).\n"
    "Not enough to take away? {{Exchange}} 1 from the next column to the left. "
    "Cross out that digit and write 1 less above it. Write a 1 in front of this digit.\n"
    "Crossed out? Use the <<new digit>>.\n"
    "Nothing to take away? Write the top digit.",
]
EXCHANGE = "When you exchange, you swap something for something else that's worth the same, like 1 ten for 10 ones."


def folder_with_thread(tmp: str, filing: bool = True) -> Path:
    folder = Path(tmp) / "lesson"
    folder.mkdir()
    thread = Path(tmp) / "thread.json"
    thread.write_text(json.dumps({"lessons": [
        {"key": "lesson-31", "methodSteps": WEEK, "newToday": "", "representation": "",
         "wordCards": [{"term": "exchange", "definition": EXCHANGE}]},
    ]}), encoding="utf-8")
    lines = ["DELIVERY=none", "PREVIOUS_LESSON="]
    if filing:
        lines += [f"SET_THREAD={thread}", "SET_LESSON=lesson-31"]
    (folder / "filing.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    return folder


def design(steps, definition=EXCHANGE):
    return {
        "successCriteria": [{"id": "sc-001", "type": "steps", "content": {"steps": steps}}],
        "vocabulary": [{"id": "vocab-001", "term": "exchange", "definition": definition}],
    }


def refused(value, folder) -> str:
    try:
        validator.check_set_thread(value, folder)
    except validator.ContractError as exc:
        return str(exc)
    return ""


# Thursday's list as it was built, from its own lesson-design.json.
THURSDAY = [
    "Line up the digits.",
    "Write the symbol.",
    "Start with the ((ones)). Then ((tens)), then ((hundreds)), then ((thousands)).",
    "In each column, take the bottom digit away from the top digit.\nCrossed out? Use the <<new digit>> above it.\n"
    "Top digit smaller? {{Exchange}}: take 1 from the column on the left to make 10 more in this column.",
]


def test_thursdays_own_list_is_sent_back_naming_the_weeks_list():
    with tempfile.TemporaryDirectory() as tmp:
        message = refused(design(THURSDAY), folder_with_thread(tmp))
        assert "Not enough to take away? Exchange 1 from the next column to the left." in message, message
        assert "[smaller point] Nothing to take away? Write the top digit." in message, message


def test_the_weeks_list_passes_with_its_colour_marks_moved():
    with tempfile.TemporaryDirectory() as tmp:
        recoloured = [step.replace("<<new digit>>", "new digit").replace("((ones))", "<<ones>>") for step in WEEK]
        assert refused(design(recoloured), folder_with_thread(tmp)) == ""


def test_a_smaller_point_run_into_its_step_is_not_the_same_list():
    with tempfile.TemporaryDirectory() as tmp:
        one_line = [step.replace("\n", " ") for step in WEEK]
        assert refused(design(one_line), folder_with_thread(tmp))


def test_a_shorter_list_beside_the_full_one_is_allowed():
    # A first concept may show only today's step, as long as the full list is there too.
    with tempfile.TemporaryDirectory() as tmp:
        value = design(WEEK)
        value["successCriteria"].insert(0, {"id": "sc-000", "type": "steps", "content": {"steps": [WEEK[2]]}})
        assert refused(value, folder_with_thread(tmp)) == ""


def test_a_reworded_word_card_is_sent_back():
    # Friday wrote its own definition of exchange.
    with tempfile.TemporaryDirectory() as tmp:
        message = refused(design(WEEK, "swap 1 from one column for 10 in the next column to the right"),
                          folder_with_thread(tmp))
        assert "vocabulary vocab-001" in message and EXCHANGE in message, message


def test_a_lesson_made_on_its_own_is_not_held_to_any_thread():
    with tempfile.TemporaryDirectory() as tmp:
        assert refused(design(THURSDAY), folder_with_thread(tmp, filing=False)) == ""


def test_the_thread_still_holds_when_filing_was_rewritten_without_it():
    # A named day or folder rewrites filing.txt; the session was started with
    # the thread, so the check still finds it.
    import os
    with tempfile.TemporaryDirectory() as tmp:
        folder = folder_with_thread(tmp, filing=False)
        saved = {k: os.environ.get(k) for k in ("LESSON_SET_THREAD", "LESSON_SET_LESSON")}
        os.environ.update(LESSON_SET_THREAD=str(Path(tmp) / "thread.json"), LESSON_SET_LESSON="lesson-31")
        try:
            assert refused(design(THURSDAY), folder)
            assert refused(design(WEEK), folder) == ""
        finally:
            for k, v in saved.items():
                if v is None:
                    os.environ.pop(k, None)
                else:
                    os.environ[k] = v
