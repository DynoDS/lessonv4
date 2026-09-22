# -*- coding: utf-8 -*-
"""Prove a fixture built by `class_view_fixture` is the production class view.

A Teacher Voice fixture is only worth scoring if the model reads what the
production Design Reviewer reads. These tests fail if the builder drifts from
`build_class_view` in the packet, if it invents surface labels production never
supplies, if it turns a beat heading into a judged string, or if it splits a
string on a line break that production keeps whole.

The lesson used here is a small synthetic design defined below rather than a
real lesson, because lesson working folders are not tracked in this repository.
It exercises the packet's real builder, so a change to the packet's print format
or string selection still fails these tests.
"""
from __future__ import annotations

import copy
import json

import pytest

import class_view_fixture as cvf

# A design small enough to read, wide enough to cover the shapes the class view
# prints: a starter whose activity is the task, scheduled vocabulary, an
# explanation that runs over several lines as one string, success criteria,
# sticky knowledge, a visible answer, and a spoken script.
DESIGN = {
    "schemaVersion": 1,
    "lesson": {
        "structure": "Content-based",
        "yearGroup": 4,
        "subject": "Science",
        "lo": "Sort materials by whether they conduct electricity",
        "displayedLo": "To sort materials by whether they conduct electricity",
    },
    "vocabulary": [
        {
            "id": "vocab-001",
            "term": "conductor",
            "definition": "A conductor lets electricity pass through it.",
            "sourceUnitId": "lesson-section/teaching-sequence/unit-001",
        }
    ],
    "successCriteria": [
        {
            "id": "sc-001",
            "type": "steps",
            "content": {"steps": ["Build the circuit with a gap.", "Put the material in the gap."]},
        }
    ],
    "stickyKnowledge": [{"id": "sticky-001", "text": "Metals let electricity pass through."}],
    "starter": {
        "sourceUnitId": "lesson-section/starter/unit-001",
        "label": "What makes the bulb light?",
        "kind": "starter",
        "content": {"activity": "Which parts of the torch carry the electricity?"},
        "speakerNotes": {
            "script": "Say to children: Look at the torch. Which parts do you think carry the electricity?",
            "teacherInfo": "Planning note that must never reach the class view.",
            "lookFor": "Another planning note.",
        },
        "answer": {
            "kind": "model",
            "content": "The metal strip and the spring.",
            "acceptanceCondition": "Planning note.",
            "delivery": "answer-slide",
        },
    },
    "teachingSequence": [
        {
            "sourceUnitId": "lesson-section/teaching-sequence/unit-001",
            "label": "Conductors and insulators",
            "kind": "teach",
            "content": {
                "headline": "Some materials let electricity through.",
                "explanation": (
                    "A metal spoon lets the electricity pass, so the bulb lights.\n"
                    "A plastic ruler stops it, so the bulb stays dark."
                ),
                "keyQuestions": ["What happens to the bulb with the spoon in the gap?"],
            },
            "successCriteriaRefs": ["sc-001"],
            "stickyKnowledgeRefs": ["sticky-001"],
            "speakerNotes": {"script": "Say to children: Watch the bulb as I swap the material."},
        }
    ],
}

PLANNING_TEXT = (
    "Planning note that must never reach the class view.",
    "Another planning note.",
    "Planning note.",
)


@pytest.fixture(scope="module")
def packet():
    return cvf.load_packet()


@pytest.fixture(scope="module")
def built(packet):
    design = copy.deepcopy(DESIGN)
    lines, count = packet.build_class_view(design)
    return {
        "design": design,
        "fixture": cvf.build(design, "cv-test"),
        "lines": lines,
        "count": count,
    }


def test_the_builder_produces_cases(built):
    assert built["fixture"]["cases"], "builder returned no cases"


def test_strings_and_order_match_the_packet(built):
    expected = [t for _, strings in cvf.class_view_blocks(built["design"]) for t in strings]
    actual = [case["wording"] for case in built["fixture"]["cases"]]
    assert actual == expected


def test_case_count_matches_the_view_count_line(built):
    """The count the reviewer is told to read is the number of cases it gets."""
    stated = int(built["lines"][2].split()[0])
    assert stated == built["count"] == len(built["fixture"]["cases"])


def test_beat_labels_are_headings_not_cases(built):
    """A beat label is a section heading. It may reach a slide as a title
    downstream, but the class view never offers it for voice judgement."""
    labels = {line[4:] for line in built["lines"] if line.startswith("### ")}
    assert labels, "no beat headings found; the view format moved"
    wordings = {case["wording"] for case in built["fixture"]["cases"]}
    assert not (labels & wordings)
    assert {case["beat"] for case in built["fixture"]["cases"]} <= labels


def test_no_surface_metadata_is_handed_to_the_model(built):
    """Production supplies no surface labels, so neither may a fixture."""
    for case in built["fixture"]["cases"]:
        for field in ("surface_type", "surface", "expected", "rationale", "decision", "prediction"):
            assert field not in case, "%s leaked into %s" % (field, case["id"])


def test_planning_metadata_never_reaches_a_case(built):
    wordings = " ".join(case["wording"] for case in built["fixture"]["cases"])
    for text in PLANNING_TEXT:
        assert text not in wordings


def test_multiline_strings_keep_the_packet_boundary(built):
    """The packet prints one authored string over several `> ` lines and closes it
    with a blank line. Splitting on the line break would invent cases the
    reviewer never judges separately."""
    multi = [c for c in built["fixture"]["cases"] if "\n" in c["wording"]]
    assert multi, "the sample design should carry a multi-line explanation"
    rendered = "\n".join(built["lines"])
    for case in multi:
        block = "\n".join("> " + line for line in case["wording"].split("\n"))
        assert block in rendered, "%s is not one block in the view" % case["id"]


def test_every_case_is_a_verbatim_block_in_the_rendered_view(built):
    rendered = "\n".join(built["lines"])
    for case in built["fixture"]["cases"]:
        block = "\n".join("> " + line for line in case["wording"].split("\n"))
        assert block in rendered, "%s missing from the view" % case["id"]


def test_scripts_carry_only_the_production_marker(built):
    """`Teacher says:` is the only thing marking a script. The authoring prefix
    `Say to children:` is stripped by the packet and must not reappear."""
    cases = built["fixture"]["cases"]
    for case in cases:
        assert "Say to children:" not in case["wording"], case["id"]
    assert [c for c in cases if c["wording"].startswith("Teacher says:")]


def test_ids_are_unique(built):
    ids = [case["id"] for case in built["fixture"]["cases"]]
    assert len(set(ids)) == len(ids)


def test_a_fixture_is_serialisable(built):
    """The builder's output is written as JSON, so it must survive a round trip."""
    again = json.loads(json.dumps(built["fixture"], ensure_ascii=False))
    assert again == built["fixture"]


def test_parser_rejects_a_changed_print_format(packet, monkeypatch):
    """If the packet stops marking strings with `> `, a fixture build must fail
    loudly rather than silently merging every string in a beat into one case."""
    real = packet.build_class_view

    def unmarked(design):
        lines, count = real(design)
        return [line[2:] if line.startswith("> ") else line for line in lines], count

    monkeypatch.setattr(packet, "build_class_view", unmarked)
    monkeypatch.setattr(cvf, "load_packet", lambda: packet)
    with pytest.raises(AssertionError):
        cvf.class_view_blocks(copy.deepcopy(DESIGN))
