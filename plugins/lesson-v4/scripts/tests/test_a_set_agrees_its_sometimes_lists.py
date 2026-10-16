"""A set can agree a method only some questions need as a list of its own.

A method only some questions need is its own criteria list (teacher-voice.md ->
Success criteria, 16 October 2026): "How to exchange" beside "How to
subtract", never packed under step 3. A set of lessons agrees its lists before
the days split (set-thread.md), and each day is held to them word for word, so
the thread can now hold those lists too: without that, a day following the
rule failed the check against a thread that only knew one list. A thread with
no such lists works exactly as before.
"""
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))
_spec = importlib.util.spec_from_file_location("validate_lesson_design_lists", SCRIPTS / "validate-lesson-design.py")
validator = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(validator)
_batch_spec = importlib.util.spec_from_file_location("lesson_batch_lists", SCRIPTS / "lesson-batch.py")
batch = importlib.util.module_from_spec(_batch_spec)
_batch_spec.loader.exec_module(batch)

SUBTRACT = [
    "Line up the digits.",
    "Write the symbol.",
    "Start with the ((ones)). Then tens, then hundreds, then thousands.\nNot enough to take away? {{Exchange}}.",
]
EXCHANGE = [
    "Cross out the digit in <<the next column to the left>>.",
    "Write 1 less above it.",
    "Write a 1 in front of the digit that wasn't enough.",
]
ENTRY = {"key": "lesson-30", "methodHeading": "How to subtract", "methodSteps": SUBTRACT,
         "sometimesLists": [{"heading": "How to exchange", "steps": EXCHANGE}],
         "newToday": "", "representation": "", "wordCards": []}


def folder_with(tmp: str, entry: dict) -> Path:
    folder = Path(tmp) / "lesson"
    folder.mkdir()
    thread = Path(tmp) / "thread.json"
    thread.write_text(json.dumps({"lessons": [entry]}), encoding="utf-8")
    (folder / "filing.txt").write_text(
        f"DELIVERY=none\nPREVIOUS_LESSON=\nSET_THREAD={thread}\nSET_LESSON={entry['key']}\n", encoding="utf-8")
    return folder


def design(*lists):
    return {"vocabulary": [], "successCriteria": [
        {"id": f"sc-00{n}", "type": "steps", "content": dict({"steps": steps}, **({"heading": h} if h else {}))}
        for n, (h, steps) in enumerate(lists, 1)]}


def refused(value, folder) -> str:
    try:
        validator.check_set_thread(value, folder)
    except validator.ContractError as exc:
        return str(exc)
    return ""


def test_a_day_with_both_lists_under_their_headings_passes():
    with tempfile.TemporaryDirectory() as tmp:
        assert refused(design(("How to subtract", SUBTRACT), ("How to exchange", EXCHANGE)), folder_with(tmp, ENTRY)) == ""


def test_a_day_without_the_exchange_list_is_sent_back_naming_it():
    with tempfile.TemporaryDirectory() as tmp:
        message = refused(design(("How to subtract", SUBTRACT)), folder_with(tmp, ENTRY))
        assert "'How to exchange'" in message and "Write 1 less above it." in message, message


def test_the_exchange_list_under_another_heading_is_sent_back():
    with tempfile.TemporaryDirectory() as tmp:
        assert refused(design(("How to subtract", SUBTRACT), ("To exchange", EXCHANGE)), folder_with(tmp, ENTRY))


def test_the_main_list_without_its_heading_is_sent_back():
    with tempfile.TemporaryDirectory() as tmp:
        message = refused(design((None, SUBTRACT), ("How to exchange", EXCHANGE)), folder_with(tmp, ENTRY))
        assert "'How to subtract'" in message, message


def test_a_thread_with_one_list_holds_a_day_exactly_as_before():
    with tempfile.TemporaryDirectory() as tmp:
        old = {k: v for k, v in ENTRY.items() if k not in ("methodHeading", "sometimesLists")}
        assert refused(design((None, SUBTRACT)), folder_with(tmp, old)) == ""


def thread_faults_for(entry: dict) -> list[str]:
    with tempfile.TemporaryDirectory() as tmp:
        output = Path(tmp)
        path = batch.thread_file(output, "year-4-maths")
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({"lessons": [entry]}), encoding="utf-8")
        return batch.thread_faults(output, {"lessons": [{"key": entry["key"], "thread": "year-4-maths"}]}, "year-4-maths")


def test_the_thread_check_accepts_the_lists_and_refuses_a_bad_one():
    assert thread_faults_for(ENTRY) == []
    no_heading = dict(ENTRY, methodHeading="")
    assert any("methodHeading" in f for f in thread_faults_for(no_heading))
    empty = dict(ENTRY, sometimesLists=[{"heading": "How to exchange", "steps": []}])
    assert any("sometimesLists" in f for f in thread_faults_for(empty))


def test_the_guide_shows_the_two_list_shape():
    guide = (SCRIPTS.parent / "references" / "set-thread.md").read_text(encoding="utf-8")
    assert '"sometimesLists": [{"heading": "How to exchange"' in guide
    assert '"methodHeading": "How to subtract"' in guide
