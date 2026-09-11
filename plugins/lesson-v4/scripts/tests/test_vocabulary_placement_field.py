"""One vocabulary slide, placed where the design says, and every word on it.

The card is the reference children glance back at, and a reference is one
place (the teacher's settled position, 30 August 2026). A definition met before
it means anything is still held as a slogan, so each word is also taught inside
the beat that needs it, in that beat's own landed sentence; the slide is not
where the teaching happens. A deck built with a vocabulary slide at each point
of need broke its own story twice (11 September 2026), which is why a second
entry is refused.

`vocabularyIntroductions` says that: one entry naming every retained word and
the unit the slide follows. `vocabularyPlacement`, the older field, is
superseded and still read so saved designs keep their original meaning.
"""
from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

CONTRACT_TESTS = Path(__file__).with_name("test_lesson_design_contract.py")
SPEC = importlib.util.spec_from_file_location("contract_tests_vp", CONTRACT_TESTS)
assert SPEC is not None and SPEC.loader is not None
contract = importlib.util.module_from_spec(SPEC)
sys.modules["contract_tests_vp"] = contract
SPEC.loader.exec_module(contract)

module = contract.module
valid_content_contract = contract.valid_content_contract
assert_invalid_contract = contract.assert_invalid_contract

ROOT = Path(__file__).resolve().parents[1]
SCAFFOLD = ROOT / "lesson-design-scaffold.py"


def scheduled(design, *groups):
    """Introduce this design's words in the named groups.

    `groups` are (anchor, [vocabulary ids]) pairs. Nothing is inferred, so a
    test that leaves a word out is testing what it looks like it is testing.
    """
    design.pop("vocabularyPlacement", None)
    design["vocabularyIntroductions"] = [
        {"vocabularyRefs": list(refs), "after": anchor} for anchor, refs in groups
    ]
    return design


def word_ids(design):
    return [row["id"] for row in design["vocabulary"]]


def starter_id(design):
    return design["starter"]["sourceUnitId"]


def unit_id(design, index=0):
    return design["teachingSequence"][index]["sourceUnitId"]


# ── the timings a lesson has to be able to express ────────────────────────


def test_every_word_after_the_starter_is_still_a_legal_plan():
    # The old default is not banned, it is simply no longer automatic. A set of
    # terms a lesson genuinely needs before it begins belongs here.
    design, photos = valid_content_contract()
    scheduled(design, (starter_id(design), word_ids(design)))
    module.validate_design(design, photos)


def test_a_word_may_be_introduced_before_the_teaching_that_needs_it():
    design, photos = valid_content_contract()
    words = word_ids(design)
    scheduled(design, (starter_id(design), words))
    module.validate_design(design, photos)


def test_a_second_vocabulary_slide_is_refused():
    # One word early because an instruction needs it, the rest after the beat
    # that gives them meaning, used to be two slides. It is now one slide and
    # two beats: the early word is taught in the instruction's own beat, and
    # the card sits where the design puts it. Two entries is two glossary
    # stops, and the deck that did that lost its story.
    design, photos = valid_content_contract()
    words = word_ids(design)
    if len(words) < 2:
        return
    scheduled(
        design,
        (starter_id(design), words[:1]),
        (unit_id(design, 0), words[1:]),
    )
    assert_invalid_contract(design, photos, "one vocabulary slide")


def test_the_one_slide_holds_every_word_wherever_it_sits():
    design, photos = valid_content_contract()
    scheduled(design, (unit_id(design, 0), word_ids(design)))
    module.validate_design(design, photos)


def test_two_entries_on_one_anchor_are_still_two_slides_and_refused():
    design, photos = valid_content_contract()
    words = word_ids(design)
    if len(words) < 2:
        return
    anchor = unit_id(design, 0)
    scheduled(design, (anchor, words[:1]), (anchor, words[1:]))
    assert_invalid_contract(design, photos, "one vocabulary slide")


# ── what is refused, and why ──────────────────────────────────────────────


def test_a_word_with_no_introduction_is_refused():
    # The failure this replaces the old default with: a word retained in the
    # design that no moment of the lesson ever teaches.
    design, photos = valid_content_contract()
    words = word_ids(design)
    if len(words) < 2:
        return
    scheduled(design, (starter_id(design), words[:-1]))
    assert_invalid_contract(design, photos, "every retained word needs a planned introduction")


def test_a_word_introduced_twice_is_refused():
    design, photos = valid_content_contract()
    words = word_ids(design)
    scheduled(design, (starter_id(design), words), (unit_id(design, 0), words[:1]))
    assert_invalid_contract(design, photos, "introduced")


def test_an_introduction_with_no_words_is_refused():
    design, photos = valid_content_contract()
    scheduled(design, (starter_id(design), word_ids(design)), (unit_id(design, 0), []))
    assert_invalid_contract(design, photos, "must name at least one word")


def test_an_unknown_word_is_refused():
    design, photos = valid_content_contract()
    scheduled(design, (starter_id(design), word_ids(design) + ["vocab-099"]))
    assert_invalid_contract(design, photos, "must name a vocabulary id")


def test_an_unknown_anchor_is_refused():
    design, photos = valid_content_contract()
    scheduled(design, ("lesson-section/teaching-sequence/unit-099", word_ids(design)))
    assert_invalid_contract(design, photos, "must name the starter's or a teachingSequence")


def test_any_other_shape_is_refused():
    design, photos = valid_content_contract()
    design.pop("vocabularyPlacement", None)
    design["vocabularyIntroductions"] = [
        {"before": unit_id(design, 0), "vocabularyRefs": word_ids(design)}
    ]
    assert_invalid_contract(design, photos, "vocabularyIntroductions")


def test_two_schedules_at_once_are_refused_rather_than_guessed_at():
    design, photos = valid_content_contract()
    scheduled(design, (starter_id(design), word_ids(design)))
    design["vocabularyPlacement"] = {"after": unit_id(design, 0)}
    assert_invalid_contract(design, photos, "not both")


# ── saved designs keep their original meaning ─────────────────────────────


def test_a_saved_design_with_neither_field_still_validates():
    design, photos = valid_content_contract()
    design.pop("vocabularyPlacement", None)
    module.validate_design(design, photos)


def test_a_saved_design_may_still_carry_the_superseded_field():
    design, photos = valid_content_contract()
    design["vocabularyPlacement"] = {"after": unit_id(design, 0)}
    module.validate_design(design, photos)

    design["vocabularyPlacement"] = None
    module.validate_design(design, photos)


def test_the_superseded_field_keeps_its_own_old_limits():
    # Not loosened on the way out: the starter was never a target for it, and
    # a design that tries one is a design written against the new field with
    # the old name.
    design, photos = valid_content_contract()
    design["vocabularyPlacement"] = {"after": starter_id(design)}
    assert_invalid_contract(
        design, photos, "vocabularyPlacement.after must name a teachingSequence sourceUnitId"
    )

    design["vocabularyPlacement"] = {"after": "lesson-section/teaching-sequence/unit-099"}
    assert_invalid_contract(
        design, photos, "vocabularyPlacement.after must name a teachingSequence sourceUnitId"
    )


# ── what a new design starts from ─────────────────────────────────────────


def test_the_scaffold_asks_for_the_introductions_rather_than_defaulting_them():
    # A default here is a decision made by nobody. The scaffold hands the
    # designer a placeholder entry so the timing is chosen for this lesson.
    scaffold_tests = Path(__file__).with_name("test_lesson_design_scaffold.py")
    spec = importlib.util.spec_from_file_location("scaffold_tests_vp", scaffold_tests)
    assert spec is not None and spec.loader is not None
    tests = importlib.util.module_from_spec(spec)
    sys.modules["scaffold_tests_vp"] = tests
    spec.loader.exec_module(tests)
    design, _photos = tests.scaffold.build_scaffold(tests.base_request())

    assert "vocabularyPlacement" not in design
    entries = design["vocabularyIntroductions"]
    assert entries and set(entries[0]) == {"vocabularyRefs", "after"}
