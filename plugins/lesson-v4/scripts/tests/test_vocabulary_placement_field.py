"""Each word is introduced where it is needed, not all of them at the top.

Reading the whole glossary after the starter had not been helping: a definition
met before it means anything is held as a slogan. What a lesson has to be able
to say is finer than "all the words, here" - a prerequisite term goes in before
the instruction that uses it, and a pair of contrast words goes in after the
noticing that gives them meaning, in the same lesson.

`vocabularyIntroductions` says that: an ordered list of introductions, each
naming the words it introduces and the unit it follows. `vocabularyPlacement`,
which could only move one slide holding every word, is superseded and still
read so saved designs keep their original meaning.
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
        {
            "vocabularyRefs": list(refs),
            "after": anchor,
            "script": "Say to children: Two words before we start.",
        }
        for anchor, refs in groups
    ]
    return design


def word_ids(design):
    return [row["id"] for row in design["vocabulary"]]


def starter_id(design):
    return design["starter"]["sourceUnitId"]


def unit_id(design, index=0):
    return design["teachingSequence"][index]["sourceUnitId"]


# ── the timings a lesson has to be able to express ────────────────────────


def test_a_card_sits_in_front_of_the_beat_that_needs_the_word():
    # The old default (everything after the starter) is not banned, it is just
    # no longer free: it holds when the next beat is the one that needs those
    # words, and here that beat is the Teach, so the card sits after the observe.
    design, photos = valid_content_contract()
    teach_anchor = unit_id(design, 0)
    scheduled(design, (teach_anchor, word_ids(design)))
    module.validate_design(design, photos)


def test_a_card_shown_beats_before_the_word_is_needed_is_refused():
    """The teacher, on a Year 4 science deck (18 September 2026): "the vocab
    slide is used when they are about to meet, use or need that word for the
    next slide." That deck introduced decay, plaque and acid together after the
    starter; plaque and acid were needed next and decay was not needed for
    another three beats, so the class met a definition and then did other work.
    """
    design, photos = valid_content_contract()
    scheduled(design, (starter_id(design), word_ids(design)))
    try:
        module.validate_design(design, photos)
    except module.ContractError as exc:
        assert "first needed" in str(exc), str(exc)
    else:
        raise AssertionError("a card shown beats early unexpectedly validated")


def test_two_groups_may_land_at_two_different_teaching_points():
    # The case the superseded field could not hold: one word early because an
    # instruction needs it, the rest after the beat that gives them meaning.
    design, photos = valid_content_contract()
    words = word_ids(design)
    if len(words) < 2:
        return
    scheduled(
        design,
        (starter_id(design), words[:1]),
        (unit_id(design, 0), words[1:]),
    )
    module.validate_design(design, photos)


def test_a_group_may_hold_several_words_when_they_belong_together():
    design, photos = valid_content_contract()
    scheduled(design, (unit_id(design, 0), word_ids(design)))
    module.validate_design(design, photos)


def test_two_groups_may_share_one_anchor_and_keep_their_listed_order():
    design, photos = valid_content_contract()
    words = word_ids(design)
    if len(words) < 2:
        return
    anchor = unit_id(design, 0)
    scheduled(design, (anchor, words[:1]), (anchor, words[1:]))
    module.validate_design(design, photos)


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
    assert entries and set(entries[0]) == {"vocabularyRefs", "after", "script"}


# ── every vocabulary slide is a teaching moment, so it has words ──────────


def test_each_vocabulary_slide_needs_its_script():
    # A Year 4 RE deck put two vocabulary slides in front of a class with
    # empty speaker notes on both. The schema had nowhere for the words.
    design, photos = valid_content_contract()
    scheduled(design, (starter_id(design), word_ids(design)))
    design["vocabularyIntroductions"][0]["script"] = "Three words before we start."
    assert_invalid_contract(design, photos, "must begin with 'Say to children:'")


def test_an_empty_vocabulary_script_is_refused():
    design, photos = valid_content_contract()
    scheduled(design, (starter_id(design), word_ids(design)))
    design["vocabularyIntroductions"][0]["script"] = "Say to children:"
    assert_invalid_contract(design, photos, "must contain words after")


def test_a_vocabulary_entry_without_the_field_is_refused():
    design, photos = valid_content_contract()
    scheduled(design, (starter_id(design), word_ids(design)))
    del design["vocabularyIntroductions"][0]["script"]
    assert_invalid_contract(design, photos, "vocabularyIntroductions")


def test_a_second_introduction_needs_its_own_script():
    # Each entry is its own slide, so each one is a slide a teacher stands in
    # front of.
    design, photos = valid_content_contract()
    words = word_ids(design)
    if len(words) < 2:
        return
    scheduled(design, (starter_id(design), words[:1]), (unit_id(design, 0), words[1:]))
    design["vocabularyIntroductions"][1]["script"] = "Say to children:"
    assert_invalid_contract(design, photos, "must contain words after")
