"""A knowledge lesson can name the idea it teaches, and an idea is met on more than one instance.

Daniel taught a Year 4 history lesson built on 4.2.125 (10 September 2026) and
abandoned it partway. Continuity and change was the objective. The lesson held
one pair of toy plates for nine of eighteen slides, then invented a 17-year-old
and two minimum ages so the final task could not be "copied", and the plugin's
reviewer approved it. Every rule from 4.2.122 to 4.2.125 was obeyed.

The cause was upstream of all of them. The lesson file had slots for facts
(sticky knowledge), words (vocabulary) and methods (concepts, locked to the
skill route). Continuity and change is none of those. It is an idea, a way of
seeing that transfers to sources the lesson never showed, and the designer had
nowhere to put it, so it filed the objective as `tiny pewter plates were made
for play` and then obeyed four rules that all said "make the facts needed".

His lesson would have held the idea still and changed the evidence: two
pictures, same or different, then a new pair, then another. This release lets
a lesson in any route name its idea in `concepts`, mark the beats that are
instances of it, and requires at least two instances, because an idea shown on
one case is a fact about that case. The reviewer reads the instances for
whether the evidence really changes. Skill-route rules are untouched.

These tests guard the schema opening, its floor, and the rule's reach.
"""

from __future__ import annotations

import copy
import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"
REF = ROOT / "references"
LESSON_DESIGNER = ROOT / "agents" / "lesson-designer.md"
DESIGN_REVIEWER = ROOT / "agents" / "design-reviewer.md"

sys.path.insert(0, str(SCRIPTS / "tests"))


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


contract = load("lesson_design_contract_fixture_idea", "tests/test_lesson_design_contract.py")
validator = contract.module
scaffold = load("lesson_design_scaffold_idea", "lesson-design-scaffold.py")
packet = load("design_review_packet_idea", "design-review-packet.py")

IDEA = {
    "id": "concept-001",
    "name": "Cause and effect: one change leads to another",
    "successCriteriaRefs": [],
}


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


def section(path: Path, heading: str) -> str:
    text = path.read_text(encoding="utf-8")
    start = text.index("## " + heading)
    end = text.find("\n## ", start + 1)
    body = text[start:] if end == -1 else text[start:end]
    return " ".join(body.split())


def content_design_with_idea():
    design, photos = contract.valid_content_contract()
    design["concepts"] = [copy.deepcopy(IDEA)]
    seq = design["teachingSequence"]
    kinds = [u["kind"] for u in seq]
    # The Do and the Practise are both instances of the idea.
    seq[kinds.index("do")]["conceptRef"] = "concept-001"
    seq[kinds.index("practise")]["conceptRef"] = "concept-001"
    return design, photos


class TheSlotOpensToKnowledgeLessonsTests(unittest.TestCase):
    def test_a_content_lesson_may_name_an_idea_with_two_instances(self) -> None:
        design, photos = content_design_with_idea()
        validator.validate_design(design, photos)

    def test_an_idea_with_one_instance_is_refused(self) -> None:
        design, photos = content_design_with_idea()
        seq = design["teachingSequence"]
        seq[[u["kind"] for u in seq].index("practise")]["conceptRef"] = None
        with self.assertRaises(validator.ContractError) as caught:
            validator.validate_design(design, photos)
        self.assertIn("met on more than one instance", str(caught.exception))

    def test_an_idea_met_only_where_the_teacher_acts_is_refused(self) -> None:
        # Two Teach beats carry the idea and nothing every child does. The
        # content route refuses two Teaches in a row before this rule would
        # see them, so the rule is exercised directly.
        sequence = [
            {"kind": "teach", "conceptRef": "concept-001"},
            {"kind": "teach", "conceptRef": "concept-001"},
        ]
        with self.assertRaises(validator.ContractError) as caught:
            validator.validate_idea_instances({"ending": {"included": False}}, sequence, [copy.deepcopy(IDEA)])
        self.assertIn("met only where the teacher acts", str(caught.exception))

    def test_an_observe_beat_counts_as_every_child_acting(self) -> None:
        sequence = [
            {"kind": "teach", "conceptRef": "concept-001"},
            {"kind": "observe", "conceptRef": "concept-001"},
        ]
        validator.validate_idea_instances({"ending": {"included": False}}, sequence, [copy.deepcopy(IDEA)])

    def test_a_named_idea_with_no_instances_is_refused(self) -> None:
        design, photos = contract.valid_content_contract()
        design["concepts"] = [copy.deepcopy(IDEA)]
        with self.assertRaises(validator.ContractError) as caught:
            validator.validate_design(design, photos)
        self.assertIn("0 unit(s) carry its conceptRef", str(caught.exception))

    def test_a_fact_lesson_still_writes_no_concepts(self) -> None:
        design, photos = contract.valid_content_contract()
        self.assertEqual(design["concepts"], [])
        validator.validate_design(design, photos)

    def test_the_starter_never_carries_an_idea(self) -> None:
        design, photos = content_design_with_idea()
        design["starter"]["conceptRef"] = "concept-001"
        with self.assertRaises(validator.ContractError) as caught:
            validator.validate_design(design, photos)
        self.assertIn("starter.conceptRef must be null", str(caught.exception))

    def test_an_unknown_idea_is_refused(self) -> None:
        design, photos = content_design_with_idea()
        design["teachingSequence"][-1]["conceptRef"] = "concept-009"
        with self.assertRaises(validator.ContractError) as caught:
            validator.validate_design(design, photos)
        self.assertIn("unknown concept", str(caught.exception))


class TheSkillRouteIsUntouchedTests(unittest.TestCase):
    def test_the_skill_fixture_still_validates(self) -> None:
        design, photos = contract.valid_contract()
        validator.validate_design(design, photos)

    def test_prepare_still_refuses_a_concept(self) -> None:
        # The contract suite already refuses `conceptRef must be null for
        # prepare` on a real skill design; this pins the message survives.
        source = (SCRIPTS / "validate-lesson-design.py").read_text(encoding="utf-8")
        self.assertIn('must be null for prepare', source)


class TheScaffoldCarriesTheIdeaTests(unittest.TestCase):
    def test_a_content_request_may_name_an_idea_and_mark_instances(self) -> None:
        scaffold_tests = load("lesson_design_scaffold_tests_idea", "tests/test_lesson_design_scaffold.py")
        request = scaffold_tests.base_request()
        request["concepts"] = [{"successCriteriaIndexes": []}]
        seq = request["teachingSequence"]
        marked = 0
        for item in seq:
            if item["kind"] in ("do", "practise") and marked < 2:
                item["conceptIndex"] = 1
                marked += 1
        self.assertEqual(marked, 2, "base request has no do and practise to mark")
        design, _ = scaffold.build_scaffold(request)
        self.assertEqual(design["concepts"][0]["id"], "concept-001")
        self.assertEqual(design["concepts"][0]["successCriteriaRefs"], [])
        refs = [u["conceptRef"] for u in design["teachingSequence"]]
        self.assertEqual(refs.count("concept-001"), 2)


class ThePacketShowsTheInstancesTests(unittest.TestCase):
    def test_the_review_view_lists_each_instance_with_its_pictures(self) -> None:
        design, photos = content_design_with_idea()
        view = packet.build_review_view(design, photos)
        self.assertIn("## Concepts", view)
        self.assertIn("- Instance:", view)
        self.assertEqual(view.count("- Instance:"), 2)

    def test_the_review_view_warns_when_every_instance_shares_the_same_pictures(self) -> None:
        design, photos = content_design_with_idea()
        for u in design["teachingSequence"]:
            if u["conceptRef"] == "concept-001":
                u["photoRefs"] = ["photo-001"]
        view = packet.build_review_view(design, photos)
        self.assertIn("every instance uses the same pictures", view)


class TheRuleReachesEveryRouteAndSubjectTests(unittest.TestCase):
    def test_preferences_name_the_kind_of_learning_and_its_limit(self) -> None:
        body = section(REF / "preferences.md", "What a Lesson Is For")
        self.assertIn("When the learning is an idea, name it, and the evidence changes while the idea holds still", body)
        self.assertIn("The limit is the kind of learning, not a quota", body)
        self.assertIn("an idea shown on one case is a fact about that case", body)

    def test_the_designer_says_which_kind_of_learning_it_is(self) -> None:
        text = flat(LESSON_DESIGNER)
        self.assertIn("Say which kind of thing that learning is: a fact, a method, or an idea", text)
        self.assertIn("which kind of learning it is, a fact, a method or an idea", text)
        self.assertIn("a sticky fact is not where an idea goes", text)

    def test_the_reviewer_checks_for_an_unnamed_idea_and_for_unchanging_evidence(self) -> None:
        text = flat(DESIGN_REVIEWER)
        self.assertIn("the idea has been filed as facts about its examples", text)
        self.assertIn("has held the evidence still and varied nothing", text)

    def test_every_route_says_what_an_instance_is(self) -> None:
        self.assertIn("the pairs are its instances", flat(REF / "teaching-sequence-content-based.md"))
        self.assertIn("meets it on evidence the exploration did not use", flat(REF / "teaching-sequence-discovery.md"))
        self.assertIn("a second Stimulus is a new case of it", flat(REF / "teaching-sequence-dialogic.md"))
        self.assertIn("the task is its second instance", flat(REF / "teaching-sequence-task-centred.md"))

    def test_every_knowledge_subject_names_its_ideas(self) -> None:
        self.assertIn("It is an idea, not a fact about one object", flat(REF / "subject-history.md"))
        self.assertIn("a pattern shown on one map is a fact about that map", flat(REF / "subject-geography.md"))
        self.assertIn("shown on one set of equipment it is a fact about that set", flat(REF / "subject-science.md"))
        self.assertIn("meet it on more than one practice or person", flat(REF / "subject-re.md"))
        self.assertIn("a rule shown on one story is a fact about that story", flat(REF / "subject-pshe.md"))

    def test_the_contract_and_scaffold_docs_describe_the_slot(self) -> None:
        self.assertIn("a named concept needs at least two beats that carry its `conceptRef`", flat(REF / "output-template.md"))
        self.assertIn("the design validator requires at least two instances of a named idea", flat(REF / "lesson-design-scaffold.md"))


if __name__ == "__main__":
    unittest.main()
