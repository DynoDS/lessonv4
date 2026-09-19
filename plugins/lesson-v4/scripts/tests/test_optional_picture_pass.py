"""The optional-picture pass has to answer for every slide, in writing.

A deck of seventeen slides came back with no drawing on any of them. Guidance had
already been rewritten twice - judge slide by slide, expect several across a
deck, a deck-level reason never zeroes the layer - and the deck still came back
empty, explained afterwards as "I treated the deck as sufficiently visual" and
"most slides already had strong P1 visuals".

Guidance kept losing because the pass had no output. A run that weighed every
slide and a run that had one thought about the whole deck produced the identical
artefact, so nothing could tell them apart. The pass now writes one line per
slide and this check reads it, which is where the two answers the teacher named
stop being available: there is no reason code for a photograph already being on
the slide, and none for a picture already used on another slide.

Nothing here forces a picture onto any slide. A full slide stays bare and says
so. What is gone is answering for the whole deck at once, silently.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "check-optional-pictures.py"


def deck(*slides: dict) -> dict:
    return {"lessonName": "test", "slides": list(slides)}


def slide_with(kind: str) -> dict:
    return {"title": "t", "content": [{"text": "a", "picture": {"kind": kind}}]}


def bare_slide() -> dict:
    return {"title": "t", "content": [{"text": "a"}]}


class CheckRunner(unittest.TestCase):
    def run_check(
        self,
        record: dict,
        lesson: dict,
        *,
        library: bool = False,
        resolver: str = "unavailable",
        room: list[dict] | None = None,
    ):
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            record_path = root / "optional-picture-pass.json"
            lesson_path = root / "lesson.json"
            record_path.write_text(json.dumps(record), encoding="utf-8")
            lesson_path.write_text(json.dumps(lesson), encoding="utf-8")
            argv = [
                sys.executable, "-S", str(SCRIPT),
                "--pass-record", str(record_path),
                "--lesson", str(lesson_path),
            ]
            if room is not None:
                room_path = root / "slide-room.json"
                room_path.write_text(
                    json.dumps({"schemaVersion": 1, "slides": room}),
                    encoding="utf-8",
                )
                argv += ["--room", str(room_path)]
            if library:
                # A library root is a place drawings are kept, and it is empty
                # here on purpose. What the evidence check reads is the index
                # this package ships, so these tests run the same way on every
                # machine with no drawings and no network. They used to be
                # skipped unless one particular checkout happened to be present,
                # which meant the guarantee held on one computer and nowhere
                # else - the same shape of fault as the resolver's.
                library_root = root / "library-root"
                library_root.mkdir()
                argv += ["--library-root", str(library_root)]
            # With no --library-root the check now asks the resolver, so the
            # tests pin the resolver's answer through its own environment
            # switches rather than inheriting whatever this machine has. A
            # supplied --library-root skips the resolver entirely, and those
            # tests still need the shipped index for the evidence search.
            env = dict(os.environ)
            if not library:
                env.pop("LESSON_EDUCATIONAL_SVG_ROOT", None)
                env["LESSON_EDUCATIONAL_SVG_OFFLINE"] = "1"
                if resolver == "unavailable":
                    env["LESSON_EDUCATIONAL_SVG_INDEX"] = str(root / "no-index.gz")
                    env["LESSON_EDUCATIONAL_SVG_CACHE"] = str(root / "no-cache")
                elif resolver == "available":
                    cache = root / "warm-cache"
                    (cache / "library" / "standard").mkdir(parents=True)
                    env["LESSON_EDUCATIONAL_SVG_CACHE"] = str(cache)
                else:
                    raise AssertionError(f"unknown resolver state: {resolver}")
            return subprocess.run(argv, capture_output=True, text=True, env=env)


class EverySlideAnswersTests(CheckRunner):
    def test_a_slide_left_out_of_the_record_fails(self):
        # One thought about the whole deck leaves most slides unanswered. This is
        # the check that makes the slide-by-slide rule a thing you do.
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "none", "reason": "full"},
        ]}
        result = self.run_check(record, deck(bare_slide(), bare_slide(), bare_slide()))
        self.assertEqual(result.returncode, 1)
        self.assertIn("every slide answers for itself", result.stderr)
        self.assertIn("2, 3", result.stderr)

    def test_a_complete_record_passes_and_prints_the_deck_shape(self):
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "used", "pictures": ["educational-svg"]},
            {"slide": 2, "decision": "none", "reason": "full"},
            {"slide": 3, "decision": "none", "reason": "competes"},
        ]}
        result = self.run_check(
            record, deck(slide_with("educational-svg"), bare_slide(), bare_slide())
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("OPTIONAL_PICTURE_PASS_OK 3 slides", result.stdout)
        self.assertIn("OPTIONAL_PICTURE_SHAPE: 1,0,0", result.stdout)
        self.assertIn("1 drawing(s)", result.stdout)

    def test_a_slide_recorded_twice_fails(self):
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "none", "reason": "full"},
            {"slide": 1, "decision": "none", "reason": "competes"},
        ]}
        result = self.run_check(record, deck(bare_slide()))
        self.assertEqual(result.returncode, 1)
        self.assertIn("recorded twice", result.stderr)


class TheTwoBannedAnswersTests(CheckRunner):
    def test_a_photograph_already_on_the_slide_is_not_a_reason(self):
        # "I already have a P1 picture here" was one of the two answers that
        # emptied the layer. A photograph settles whether a duplicating P2 is
        # wanted; it says nothing about whether the slide has room to spare.
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "none", "reason": "p1-already-here"},
        ]}
        result = self.run_check(record, deck(bare_slide()))
        self.assertEqual(result.returncode, 1)
        self.assertIn("no code for a deck-level answer", result.stderr)
        self.assertIn("a photograph already on this slide", result.stderr)

    def test_a_picture_used_on_another_slide_is_not_a_reason(self):
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "none", "reason": "already-used-one"},
        ]}
        result = self.run_check(record, deck(bare_slide()))
        self.assertEqual(result.returncode, 1)
        self.assertIn("already used on", result.stderr)

    def test_the_deck_reading_as_visual_enough_is_not_a_reason(self):
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "none", "reason": "deck-is-visual-enough"},
        ]}
        result = self.run_check(record, deck(bare_slide()))
        self.assertEqual(result.returncode, 1)
        self.assertIn("reading as visual enough", result.stderr)

    def test_each_of_the_five_slide_level_reasons_is_accepted(self):
        # `would-mislead` carries the sentence it now owes; the point of this
        # test is that each reason is legal, not that any of them is free.
        extra = {
            "would-mislead": {
                "evidence": "This slide asks the class which shape is the odd "
                            "one out, so any shape drawing shows them an answer."
            }
        }
        for reason in ("full", "competes", "would-mislead", "library-unavailable"):
            with self.subTest(reason=reason):
                record = {"schemaVersion": 1, "slides": [
                    {"slide": 1, "decision": "none", "reason": reason,
                     **extra.get(reason, {})},
                ]}
                result = self.run_check(record, deck(bare_slide()))
                self.assertEqual(result.returncode, 0, result.stderr)


class TheRecordMatchesTheDeckTests(CheckRunner):
    def test_a_used_entry_with_no_picture_on_the_slide_fails(self):
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "used", "pictures": ["educational-svg"]},
        ]}
        result = self.run_check(record, deck(bare_slide()))
        self.assertEqual(result.returncode, 1)
        self.assertIn("carries no optional picture", result.stderr)

    def test_a_none_entry_on_a_slide_that_has_one_fails(self):
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "none", "reason": "full"},
        ]}
        result = self.run_check(record, deck(slide_with("educational-svg")))
        self.assertEqual(result.returncode, 1)
        self.assertIn("recorded as `none` but carries", result.stderr)


class EvidenceTests(CheckRunner):
    def test_nothing_fits_without_named_searches_fails(self):
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "none", "reason": "nothing-fits"},
        ]}
        result = self.run_check(record, deck(bare_slide()))
        self.assertEqual(result.returncode, 1)
        self.assertIn("names the searches it ran", result.stderr)
        self.assertIn("a library nobody opened", result.stderr)

    def test_an_emoji_only_slide_owes_the_same_evidence(self):
        # The reported failure exactly: an emoji weather strip typed onto the one
        # slide that wanted a picture, on a deck whose library was never opened.
        # An emoji is the fallback route, so choosing one asserts the library had
        # nothing better - the same claim as nothing-fits.
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "used", "pictures": ["emoji"]},
        ]}
        result = self.run_check(record, deck(slide_with("emoji")))
        self.assertEqual(result.returncode, 1)
        self.assertIn("names the searches it ran", result.stderr)

    def test_a_drawing_slide_owes_no_search_evidence(self):
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "used", "pictures": ["educational-svg"]},
        ]}
        result = self.run_check(record, deck(slide_with("educational-svg")))
        self.assertEqual(result.returncode, 0, result.stderr)


class EvidenceAgainstTheRealLibraryTests(CheckRunner):
    def test_a_rejection_that_is_not_in_the_library_fails(self):
        # A drawing you never saw cannot be one you rejected. The identifier has
        # to come out of a search that actually ran.
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "none", "reason": "nothing-fits",
             "searched": ["sun"], "rejected": ["standard/zz/invented-drawing.svg"]},
        ]}
        result = self.run_check(record, deck(bare_slide()), library=True)
        self.assertEqual(result.returncode, 1)
        self.assertIn("is not in the library", result.stderr)

    def test_nothing_fits_on_a_search_that_returned_drawings_needs_a_rejection(self):
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "none", "reason": "nothing-fits",
             "searched": ["sun"]},
        ]}
        result = self.run_check(record, deck(bare_slide()), library=True)
        self.assertEqual(result.returncode, 1)
        self.assertIn("turned down", result.stderr)

    def test_a_real_rejection_is_accepted(self):
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "none", "reason": "nothing-fits",
             "searched": ["sun"], "rejected": ["cartoon/su/sun.svg"]},
        ]}
        result = self.run_check(record, deck(bare_slide()), library=True)
        self.assertEqual(result.returncode, 0, result.stderr)


class LibraryStateIsOnTheRecordTests(CheckRunner):
    """Whether there was a library to search is a fact the run has to keep.

    A deck with no drawings in it is a good deck when the library was searched
    and had nothing for these slides, and a broken one when there was no library
    to ask. Both printed the same `OPTIONAL_PICTURE_PASS_OK` and reached the
    teacher identically, so "why did it not use the drawings?" could not be
    answered from anything the run left behind - which is what kept sending the
    answer back to the guidance, where the fault was not.
    """

    def test_the_library_state_is_printed_when_there_is_no_library(self):
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "none", "reason": "library-unavailable"},
        ]}
        result = self.run_check(record, deck(bare_slide()))
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("OPTIONAL_PICTURE_LIBRARY: UNAVAILABLE", result.stdout)

    def test_the_library_state_names_the_library_that_was_searched(self):
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "none", "reason": "full"},
        ]}
        result = self.run_check(record, deck(bare_slide()), library=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("OPTIONAL_PICTURE_LIBRARY: verified against", result.stdout)

    def test_nothing_fits_cannot_be_claimed_with_no_library(self):
        """The exact shape of a deck that reads as considered and was not.

        `nothing-fits` asserts a search. With no library on the machine no search
        can have happened, so the claim is unpayable however plausible its search
        terms look - and it used to pass, because the evidence check simply
        returned when it had no library to check against.
        """
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "none", "reason": "nothing-fits",
             "searched": ["desk fan", "electric fan"]},
        ]}
        result = self.run_check(record, deck(bare_slide()))
        self.assertEqual(result.returncode, 1, result.stdout)
        self.assertIn("no drawing library was available", result.stderr)
        self.assertIn("library-unavailable", result.stderr)

    def test_library_unavailable_is_the_honest_answer_with_no_library(self):
        """The discrimination case: the same empty deck, answered truthfully."""
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "none", "reason": "library-unavailable"},
        ]}
        result = self.run_check(record, deck(bare_slide()))
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_library_unavailable_cannot_be_claimed_when_the_library_is_there(self):
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "none", "reason": "library-unavailable"},
        ]}
        result = self.run_check(record, deck(bare_slide()), library=True)
        self.assertEqual(result.returncode, 1, result.stdout)
        self.assertIn("a drawing library was available", result.stderr)


class TheCheckResolvesForItselfTests(CheckRunner):
    """A forgotten --library-root must not silently mean "no library".

    On 30 August 2026 a whole run's optional layer was written off exactly this
    way: nobody ran the resolver, the check was invoked bare, and it reported
    the library UNAVAILABLE on a machine where the resolver would have found
    one. The location of the library is the resolver's question, so a bare
    invocation now asks it directly.
    """

    def test_a_bare_invocation_finds_the_library_the_resolver_finds(self):
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "none", "reason": "full"},
        ]}
        result = self.run_check(record, deck(bare_slide()), resolver="available")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("OPTIONAL_PICTURE_LIBRARY: verified against", result.stdout)

    def test_a_library_unavailable_claim_fails_when_the_resolver_finds_one(self):
        # The failed run's exact shape, one step deeper: with a library
        # genuinely findable, a record claiming it was unavailable is the
        # designer having skipped the resolver, and it must not pass.
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "none", "reason": "library-unavailable"},
        ]}
        result = self.run_check(record, deck(bare_slide()), resolver="available")
        self.assertEqual(result.returncode, 1, result.stdout)
        self.assertIn("a drawing library was available", result.stderr)

    def test_a_genuinely_unavailable_library_still_reads_unavailable(self):
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "none", "reason": "library-unavailable"},
        ]}
        result = self.run_check(record, deck(bare_slide()), resolver="unavailable")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("OPTIONAL_PICTURE_LIBRARY: UNAVAILABLE", result.stdout)


def measured(slide: int, areas: int, *, width: float = 3.0, height: float = 2.4) -> dict:
    if areas < 1:
        return {"slide": slide, "clearFraction": 0.04, "largestClear": None,
                "readableAreas": 0}
    return {
        "slide": slide,
        "clearFraction": 0.4,
        "largestClear": {
            "widthInches": width, "heightInches": height,
            "xInches": 0.0, "yInches": 0.0, "areaFraction": 0.2,
        },
        "readableAreas": areas,
    }


class TheDrawnPageSettlesFullAndCompetesTests(CheckRunner):
    """The two answers that cost nothing to write.

    `nothing-fits` had to name real searches and real rejections, so a pass
    under pressure reached for the other two instead. A twelve-slide deck came
    back declining seven slides on `full` and `competes` alone, four of them
    with half the board free. Both are claims about the drawn page, so the drawn
    page now settles them.
    """

    def test_full_fails_when_the_render_shows_clear_space(self):
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "none", "reason": "full"},
        ]}
        result = self.run_check(
            record, deck(bare_slide()), room=[measured(1, 2)]
        )
        self.assertEqual(result.returncode, 1, result.stdout)
        self.assertIn("recorded as full", result.stderr)
        self.assertIn("2 separate areas", result.stderr)
        self.assertIn('3.0" by 2.4"', result.stderr)

    def test_competes_fails_when_the_render_shows_clear_space(self):
        # The reported shape: a slide with a strong central visual and a clear
        # column beside it, declined because the visual was strong.
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "none", "reason": "competes"},
        ]}
        result = self.run_check(
            record, deck(bare_slide()), room=[measured(1, 1)]
        )
        self.assertEqual(result.returncode, 1, result.stdout)
        self.assertIn("recorded as competes", result.stderr)
        self.assertIn("covers nothing", result.stderr)

    def test_a_genuinely_full_slide_still_passes(self):
        """The discrimination case. Nothing here puts a picture on a slide."""
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "none", "reason": "full"},
        ]}
        result = self.run_check(
            record, deck(bare_slide()), room=[measured(1, 0)]
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("OPTIONAL_PICTURE_ROOM: verified against", result.stdout)

    def test_would_mislead_is_not_a_claim_about_room(self):
        """A drawing that answers the task is wrong however much space there is."""
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "none", "reason": "would-mislead",
             "evidence": "The task asks which biome this is, and any rainforest "
                         "drawing in the corner answers it before a child looks."},
        ]}
        result = self.run_check(
            record, deck(bare_slide()), room=[measured(1, 3)]
        )
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_a_slide_that_took_one_of_four_places_says_why(self):
        """Where the layer was really being emptied. Everything else here polices
        a refusal; a slide that accepted was never questioned, and across twenty
        lessons 41 of the 44 slides measured with three or more clear places took
        exactly one drawing."""
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "used", "pictures": ["educational-svg"]},
        ]}
        result = self.run_check(
            record, deck(slide_with("educational-svg")), room=[measured(1, 4)]
        )
        self.assertEqual(result.returncode, 1)
        self.assertIn("separate clear places", result.stdout + result.stderr)

    def test_running_out_of_subjects_is_a_complete_answer(self):
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "used", "pictures": ["educational-svg"],
             "placesLeft": "The other three places are beside the number line, "
                           "where any drawing would read as part of the maths."},
        ]}
        result = self.run_check(
            record, deck(slide_with("educational-svg")), room=[measured(1, 4)]
        )
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_a_slide_that_filled_its_places_owes_nothing(self):
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "used", "pictures": ["educational-svg"]},
        ]}
        result = self.run_check(
            record, deck(slide_with("educational-svg")), room=[measured(1, 1)]
        )
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_would_mislead_says_what_would_be_given_away(self):
        """The last free answer. It was half of every refusal across 20 lessons,
        59 of those on slides the render had measured a clear inch-square space
        on, and not one of them said what would be misled."""
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "none", "reason": "would-mislead"},
        ]}
        result = self.run_check(
            record, deck(bare_slide()), room=[measured(1, 3)]
        )
        self.assertEqual(result.returncode, 1)
        self.assertIn("would-mislead with no evidence", result.stdout + result.stderr)

    def test_a_bias_claim_of_a_few_words_is_not_evidence(self):
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "none", "reason": "would-mislead",
             "evidence": "it would mislead"},
        ]}
        result = self.run_check(
            record, deck(bare_slide()), room=[measured(1, 3)]
        )
        self.assertEqual(result.returncode, 1)

    def test_without_a_measurement_the_two_reasons_stand_on_the_record(self):
        """A machine with no render route must not fail every declined slide."""
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "none", "reason": "full"},
        ]}
        result = self.run_check(record, deck(bare_slide()))
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("OPTIONAL_PICTURE_ROOM: UNMEASURED", result.stdout)

    def test_a_slide_the_measurement_missed_stands_on_the_record(self):
        record = {"schemaVersion": 1, "slides": [
            {"slide": 1, "decision": "none", "reason": "full"},
            {"slide": 2, "decision": "none", "reason": "full"},
        ]}
        result = self.run_check(
            record, deck(bare_slide(), bare_slide()), room=[measured(1, 0)]
        )
        self.assertEqual(result.returncode, 0, result.stderr)


class ContractTests(unittest.TestCase):
    def test_the_decorator_and_the_orchestrator_both_run_it(self):
        # The pass moved from the Slide Designer into the Slide Decorator, its
        # own worker, so the wall and stick-in designers could start on the
        # settled deck. The check moved with it; the designer no longer owns
        # the record.
        decorator = (ROOT / "agents" / "slide-decorator.md").read_text(encoding="utf-8")
        designer = (ROOT / "agents" / "slide-designer.md").read_text(encoding="utf-8")
        playbook = (
            ROOT / "skills" / "make-lesson" / "playbook-lite.md"
        ).read_text(encoding="utf-8")
        for text in (decorator, playbook):
            self.assertIn("check-optional-pictures.py", text)
            self.assertIn("OPTIONAL_PICTURE_PASS_OK", text)
        self.assertNotIn("check-optional-pictures.py", designer)
        # The decorator cannot close on its own word for the one thing that
        # separates a real pass from a claimed one.
        self.assertIn("Run the optional-picture check yourself", playbook)
        self.assertIn("SLIDE_DECORATION_OK", playbook)

    def test_the_pass_runs_against_the_rendered_pages(self):
        """The whole failure was asking a question in a place with no answer.

        `full` means no part of this slide is clear, which is a fact about a
        drawn page. The pass used to run over the specification, where a
        three-zone template reads the same whether its cards are packed to the
        margins or holding four words each, and decks came back declining
        slides that were half white when anyone looked.
        """
        designer = (ROOT / "agents" / "slide-designer.md").read_text(encoding="utf-8")
        decorator = (ROOT / "agents" / "slide-decorator.md").read_text(encoding="utf-8")
        self.assertIn(
            "Run the whole-deck pass against the rendered pages", decorator
        )
        # The designer measures the room on its settled pages; the decorator
        # reads that measurement and renders the promoted deck before it asks
        # whether any page has room.
        self.assertIn("measure-slide-room.py", designer)
        self.assertIn("slide-room.json", decorator)
        # The composition repairs move the content, so room measured before
        # them is room on a layout that no longer exists.
        order = designer.split("### The order, once", 1)[1].split("###", 1)[0]
        self.assertLess(
            order.index("render the preview pages"),
            order.index("measure the room"),
        )
        self.assertLess(
            decorator.index("Render the settled deck first"),
            decorator.index("Now run one explicit whole-deck pass"),
        )

    def test_the_retired_deck_look_stays_retired(self):
        """Neither the built-deck look nor the final resource review comes back."""
        designer = (ROOT / "agents" / "slide-designer.md").read_text(encoding="utf-8")
        playbook = (
            ROOT / "skills" / "make-lesson" / "playbook-lite.md"
        ).read_text(encoding="utf-8")
        self.assertNotIn("## The built-deck look", designer)
        self.assertNotIn("BUILT_DECK_LOOK", designer)
        self.assertNotIn("ASSIGNMENT: BUILT_DECK_LOOK", playbook)
        self.assertNotIn("slide_designer_built_deck_look", playbook)
        self.assertNotIn("FINAL RESOURCE REVIEW", playbook)
        # The judgement the removed section carried has to survive somewhere
        # the role that sees the drawings rendered still reads: the Slide
        # Decorator, which is that pass in its own worker and not a review of
        # the built deck.
        decorator = (ROOT / "agents" / "slide-decorator.md").read_text(encoding="utf-8")
        self.assertIn("Overlap by itself is never the fault", decorator)
        self.assertIn("Judge legibility rather than taste", decorator)
        self.assertIn("earlier optional-picture stage", playbook)


if __name__ == "__main__":
    unittest.main()
