"""The learning is named before the task, and the task draws on it.

Daniel (9 September 2026), after a headteacher of forty years reviewed a Year 4
RE deck: "I want every part of a lesson to be designed to produce durable
learning ... Each activity should exist because pupils need that learning for
the next step ... The final task then is there to draw together what they've
built, not to check if they were listening."

The lesson in question named `Christmas celebrates the birth of Jesus` as sticky
knowledge, opened its decision record with `because the lesson gives them the
Christian meaning of Christmas`, and ended on a personal reflection a child could
write without either. The reviewer approved it, because every check in the chain
was performance-shaped: sticky knowledge was "what children need to succeed at
the LO", the ending was dropped when "practice demonstrates the intended
learning", and the reviewer asked what a child who does the final task well now
knows. For a task-shaped objective all three pass while the knowledge goes
untaught.

The repair names the learning first (`preferences.md` -> What a Lesson Is For)
and carries one test into each of those decisions: which later stage would fail
without this, and does the final task draw on it. The review packet now prints,
under each sticky fact, which units reference it and whether any final work
does, so the reviewer starts from the design's own claim.

These tests guard the reach of the rule and the packet's new lines, not the
prose.
"""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"
LESSON_DESIGNER = ROOT / "agents" / "lesson-designer.md"
DESIGN_REVIEWER = ROOT / "agents" / "design-reviewer.md"
PREFERENCES = ROOT / "references" / "preferences.md"
DO_BEATS = ROOT / "references" / "do-beats.md"
SUBJECT_RE = ROOT / "references" / "subject-re.md"
SUBJECT_PSHE = ROOT / "references" / "subject-pshe.md"

sys.path.insert(0, str(SCRIPTS / "tests"))


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


packet = load("design_review_packet_learning", "design-review-packet.py")
fixtures = load("lesson_design_contract_fixtures_learning", "tests/test_lesson_design_contract.py")

SECTION = "What a Lesson Is For"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


def section(path: Path, heading: str) -> str:
    text = path.read_text(encoding="utf-8")
    start = text.index("## " + heading)
    end = text.find("\n## ", start + 1)
    body = text[start:] if end == -1 else text[start:end]
    return " ".join(body.split())


class PreferencesOwnThePrincipleTests(unittest.TestCase):
    def test_the_principle_has_its_own_section_and_contents_entry(self) -> None:
        body = section(PREFERENCES, SECTION)
        self.assertIn("still have it next week", body)
        self.assertIn("could still do it well from what they brought with them", body)
        self.assertIn("The limit:", body)
        contents = section(PREFERENCES, "Contents — each agent reads its own sections")
        self.assertIn(f"**{SECTION}**", contents)

    def test_the_rhythm_is_the_shape_and_the_principle_is_what_it_serves(self) -> None:
        rhythm = section(PREFERENCES, "The Teach → Do → Teach → Do Rhythm")
        self.assertIn("load-bearing shape", rhythm)
        self.assertIn(SECTION, rhythm)

    def test_sticky_knowledge_is_the_learning_not_a_prop_for_the_task(self) -> None:
        sticky = section(PREFERENCES, "Sticky Knowledge")
        self.assertIn("still hold next week", sticky)
        self.assertIn("a later stage needs it, and the final task draws on it", sticky)
        self.assertIn("Christmas celebrates the birth of Jesus", sticky)
        # The skill-lesson test is kept, with its limit named, rather than deleted.
        self.assertIn("still the right test in a skill lesson", sticky)

    def test_the_ending_is_judged_against_the_named_learning(self) -> None:
        apply = section(PREFERENCES, "The Apply Slide")
        self.assertIn("not only the performance the objective names", apply)
        self.assertIn("reshape the final task", apply)
        endings = section(PREFERENCES, "Purposeful Endings and Linked Lessons")
        self.assertIn("evidence of a product, not of learning", endings)


class TheDesignerNamesTheLearningFirstTests(unittest.TestCase):
    def setUp(self) -> None:
        self.designer = flat(LESSON_DESIGNER)

    def test_before_designing_names_the_learning_before_the_performance(self) -> None:
        self.assertIn("Name first, in your own words, what children will know", self.designer)
        self.assertIn("names only the performance", self.designer)
        self.assertIn(SECTION, self.designer)

    def test_the_quality_lock_is_read_from_both_ends(self) -> None:
        self.assertIn("would the check named after `evidenced by` catch a child who lacked", self.designer)
        self.assertIn("the learning itself: what children will know, understand and be able to think", self.designer)

    def test_the_ending_decision_uses_the_named_learning(self) -> None:
        self.assertIn("omit the ending when practice already draws on the intended learning", self.designer)
        self.assertIn("Intended learning means what the quality-lock sentence and the sticky knowledge name", self.designer)

    def test_sticky_knowledge_is_traced_forward(self) -> None:
        self.assertIn("trace each one forward to the stage that needs it", self.designer)


class TheReviewerChecksItTests(unittest.TestCase):
    def test_learning_contract_asks_which_stage_would_fail_without_it(self) -> None:
        reviewer = flat(DESIGN_REVIEWER)
        self.assertIn("the learning the design names is learned, not told", reviewer)
        self.assertIn("which later stage would fail without it", reviewer)
        self.assertIn("a reference is availability, not use", reviewer)
        self.assertIn("sticky knowledge against teaching, and against the final task or ending", reviewer)

    def test_the_routing_card_reaches_the_section(self) -> None:
        names = [name for name, _ in packet.PREFERENCE_ROUTES] if hasattr(packet, "PREFERENCE_ROUTES") else None
        if names is None:
            source = (SCRIPTS / "design-review-packet.py").read_text(encoding="utf-8")
            self.assertIn(f'"{SECTION}"', source)
        else:
            self.assertIn(SECTION, names)


class SubjectFilesCarryTheReflectiveObjectiveTests(unittest.TestCase):
    def test_re_says_what_a_reflection_draws_on(self) -> None:
        re_file = flat(SUBJECT_RE)
        self.assertIn("names the product", re_file)
        self.assertIn("places their own meaning beside the taught ones", re_file)
        self.assertIn(SECTION, re_file)

    def test_pshe_says_what_a_reflection_draws_on(self) -> None:
        pshe = flat(SUBJECT_PSHE)
        self.assertIn("names the product", pshe)
        self.assertIn("describing their day from memory is not", pshe)
        self.assertIn(SECTION, pshe)


class BecauseSentenceHasItsBoundaryTests(unittest.TestCase):
    def test_a_because_already_on_the_board_is_not_a_use(self) -> None:
        beats = flat(DO_BEATS)
        self.assertIn("whether the because is already on the board", beats)
        self.assertIn("applied to a case the Teach did not cover", beats)


class ThePacketShowsWhereEachStickyFactIsUsedTests(unittest.TestCase):
    def test_usage_lists_references_and_final_work(self) -> None:
        design, _ = fixtures.valid_contract()
        design["stickyKnowledge"] = [
            {"id": "sk-001", "text": "Keep tens with tens."},
            {"id": "sk-002", "text": "Christmas celebrates the birth of Jesus."},
        ]
        for unit in design["teachingSequence"]:
            unit["stickyKnowledgeRefs"] = []
        teach_like = design["teachingSequence"][0]
        teach_like["stickyKnowledgeRefs"] = ["sk-001", "sk-002"]
        final = [u for u in design["teachingSequence"] if u["kind"] in packet.FINAL_WORK_KINDS]
        self.assertTrue(final, "fixture has no final-work unit to test against")
        final[-1]["stickyKnowledgeRefs"] = ["sk-001"]
        design["worksheet"]["stickyKnowledgeRefs"] = []
        design["ending"]["included"] = False
        design["ending"]["beat"] = None

        usage = packet.sticky_usage(design)
        referenced, drawn = usage["sk-001"]
        self.assertEqual(len(referenced), 2)
        self.assertEqual(len(drawn), 1)
        self.assertIn(final[-1]["label"], drawn[0])

        referenced, drawn = usage["sk-002"]
        self.assertEqual(len(referenced), 1)
        self.assertEqual(drawn, [])

    def test_the_review_view_prints_the_lines_under_each_fact(self) -> None:
        design, photos = fixtures.valid_contract()
        design["stickyKnowledge"] = [
            {"id": "sk-001", "text": "Christmas celebrates the birth of Jesus."},
        ]
        for unit in design["teachingSequence"]:
            unit["stickyKnowledgeRefs"] = []
        design["worksheet"]["stickyKnowledgeRefs"] = []
        view = packet.build_review_view(design, photos)
        self.assertIn("- Referenced by: no unit", view)
        self.assertIn("- Drawn on by final work (by reference): none - a reference is availability, not use", view)

    def test_a_takeaway_reference_counts_as_a_reference(self) -> None:
        design = {
            "stickyKnowledge": [{"id": "sk-001", "text": "A fact."}],
            "teachingSequence": [
                {
                    "label": "Why it matters",
                    "kind": "teach",
                    "stickyKnowledgeRefs": [],
                    "content": {"takeaway": {"kind": "sticky", "ref": "sk-001"}},
                },
                {
                    "label": "Put it to use",
                    "kind": "practise",
                    "stickyKnowledgeRefs": [],
                    "content": {"task": "..."},
                },
            ],
            "ending": {"included": True, "beat": {"label": "Judge the claim", "kind": "apply", "stickyKnowledgeRefs": ["sk-001"], "content": {}}},
            "worksheet": {"stickyKnowledgeRefs": []},
        }
        referenced, drawn = packet.sticky_usage(design)["sk-001"]
        self.assertEqual([r.split(" (")[0] for r in referenced], ["Why it matters", "Judge the claim"])
        self.assertEqual([r.split(" (")[0] for r in drawn], ["Judge the claim"])


if __name__ == "__main__":
    unittest.main()
