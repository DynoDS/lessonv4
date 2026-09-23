"""The reviewer sees every pupil beat beside the teaching it follows.

The review view's `Each Do beside the teaching before it` was built for the
steam option bank (4.2.283): a content lesson's Do straight after a Teach,
its expected answer beside what the class had just been told. It read only
that one case. A sort's answer is stored as placements, so it printed
`(none written)`; the Teach's takeaway, the line a Do is most likely to say
back, was not counted; and a skill lesson's Your Turn, a discovery lesson's
Use the learning and a task lesson's enabling instruction never appeared.
The same restatement as a sort, or as a Your Turn re-sorting the shapes just
placed, passed unseen. The teacher agreed to widen it (quick-checks decision
9, 23 September 2026).
"""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


packet = load("design_review_packet_every_pupil_beat", "design-review-packet.py")


def view(sequence, sticky=None):
    return "\n".join(packet.build_do_beside_teach({"teachingSequence": sequence, "stickyKnowledge": sticky or []}))


TEETH_TEACH = {
    "label": "Enamel",
    "kind": "teach",
    "content": {
        "headline": "Enamel is the hard outer layer of a tooth.",
        "explanation": "It covers the crown and takes the force when you bite.",
        "takeaway": {"kind": "sticky", "ref": "sk-001"},
        "keyQuestions": [],
    },
}
STICKY = [{"id": "sk-001", "text": "Enamel cannot grow back once it is lost."}]


class TheViewReachesEveryShapeTests(unittest.TestCase):
    def test_a_sort_prints_its_placements_not_none_written(self) -> None:
        sort = {
            "label": "Sort the teeth",
            "kind": "do",
            "pupilInstruction": "Sort each tooth.",
            "content": {"task": "Sort each tooth."},
            "taskStructure": {
                "kind": "sort",
                "groups": [{"id": "group-001", "label": "Enamel lost"}, {"id": "group-002", "label": "Enamel whole"}],
                "items": [{"id": "item-001", "label": "Tooth A"}, {"id": "item-002", "label": "Tooth B"}],
            },
            "answer": {"kind": "exact", "content": None, "structure": {"kind": "sort", "placements": [
                {"itemRef": "item-001", "groupRef": "group-001"},
                {"itemRef": "item-002", "groupRef": "group-002"},
            ]}},
        }
        text = view([TEETH_TEACH, sort], STICKY)
        self.assertIn("- Expected answer: Tooth A under Enamel lost; Tooth B under Enamel whole", text)
        self.assertIn("- Cards: Tooth A | Tooth B; groups: Enamel lost | Enamel whole", text)
        self.assertNotIn("(none written)", text)

    def test_the_takeaway_is_counted_as_something_the_class_was_told(self) -> None:
        recap = {
            "label": "What did we learn?",
            "kind": "do",
            "pupilInstruction": "Finish the sentence.",
            "content": {"task": "Finish the sentence."},
            "answer": {"kind": "exact", "content": "Enamel cannot grow back once it is lost."},
        }
        text = view([TEETH_TEACH, recap], STICKY)
        self.assertIn("already said: 6 of 6", text)

    def test_a_skill_lessons_turns_are_shown_beside_the_my_turn(self) -> None:
        my_turn = {"label": "My Turn", "kind": "my-turn", "content": {"example": "Sort the shapes into the Venn diagram: square, triangle."}}
        our_turn = {"label": "Our Turn", "kind": "our-turn", "content": {"example": "Sort the rectangle."}}
        your_turn = {"label": "Your Turn", "kind": "your-turn", "pupilInstruction": "Sort the shapes.",
                     "content": {"task": "Sort the shapes."}, "answer": {"kind": "exact", "content": "square, triangle"}}
        text = view([my_turn, our_turn, your_turn])
        self.assertIn("### Our Turn (after `My Turn`)", text)
        # The Our Turn's question is shown, and the Your Turn is read against
        # the Our Turn too, whose revealed answer it could copy.
        self.assertIn("- Asked: Sort the rectangle.", text)
        self.assertIn("### Your Turn (after `My Turn`, `Our Turn`)", text)
        self.assertIn("already said: 2 of 2", text)

    def test_discovery_and_task_lessons_are_shown_too(self) -> None:
        teach_why = {"label": "Why", "kind": "teach-why", "content": {"accurateExplanation": "Light travels in straight lines."}}
        use = {"label": "Use it", "kind": "use-learning", "content": {"activity": "Predict the shadow."},
               "answer": {"kind": "model", "content": "It falls behind the box."}}
        enabling = {"label": "The right to pass", "kind": "teach-needed", "pupilInstruction": "Choose Mia's reply.",
                    "content": {"enablingInput": "You can choose to pass."}, "answer": {"kind": "exact", "content": "I'd like to pass."}}
        text = view([teach_why, use, enabling])
        self.assertIn("### Use it (after `Why`)", text)
        self.assertIn("### The right to pass (its own pupil instruction)", text)

    def test_an_enabling_input_is_not_counted_against_its_own_answer(self) -> None:
        enabling = {"label": "The right to pass", "kind": "teach-needed", "pupilInstruction": "Choose Mia's reply.",
                    "content": {"enablingInput": "You can choose to pass."},
                    "answer": {"kind": "exact", "content": "Mia says she would like to pass today."}}
        text = view([enabling])
        self.assertIn("### The right to pass (its own pupil instruction)", text)
        self.assertIn("already said: 1 of 7", text)

    def test_the_task_after_an_instructed_input_is_shown_beside_it(self) -> None:
        enabling = {"label": "Fair test", "kind": "teach-needed", "pupilInstruction": "Choose the fair one.",
                    "content": {"enablingInput": "Change only one thing."}, "answer": {"kind": "exact", "content": "B"}}
        task = {"label": "Our test", "kind": "do-task", "content": {"activity": "Plan and run the test."},
                "answer": {"kind": "model", "content": "We changed only the surface."}}
        text = view([enabling, task])
        self.assertIn("### Our test (after `Fair test`)", text)

    def test_a_practise_and_an_evidence_classification_are_shown(self) -> None:
        practise = {"label": "Sort the photos", "kind": "practise", "pupilInstruction": "Fill in the table.",
                    "content": {"task": "Fill in the table."},
                    "taskStructure": {"kind": "evidence-classification", "fields": [{"id": "field-001", "label": "Name"}],
                                      "items": [{"id": "item-001", "photoRef": "photo-001"}]},
                    "answer": {"kind": "model", "content": None, "structure": {"kind": "evidence-classification", "results": [
                        {"itemRef": "item-001", "values": [{"fieldRef": "field-001", "value": "Hairdryer"}]}]}}}
        text = view([TEETH_TEACH, practise], STICKY)
        self.assertIn("### Sort the photos (after `Enamel`)", text)
        self.assertIn("- Expected answer: Hairdryer", text)

    def test_every_talk_in_a_dialogic_lesson_is_shown_beside_its_own_stimulus(self) -> None:
        ground = {"label": "What a promise is", "kind": "grounding-input", "content": {"input": "A promise is saying you will do something."}}
        stim1 = {"label": "Stimulus 1", "kind": "stimulus", "content": {"prompt": "Sam promised to help.", "question": "Should Sam keep it?"}}
        talk1 = {"label": "Talk 1", "kind": "talk", "content": {"discussionQuestion": "Should Sam keep it?",
                 "teacherListensFor": ["a promise matters because people rely on it"]}}
        stim2 = {"label": "Stimulus 2", "kind": "stimulus", "content": {"prompt": "Sam's friend is hurt.", "question": "Now?"}}
        talk2 = {"label": "Talk 2", "kind": "talk", "content": {"discussionQuestion": "Now?", "teacherListensFor": ["helping the friend"]}}
        text = view([ground, stim1, talk1, stim2, talk2])
        self.assertIn("### Talk 1 (after `What a promise is`, `Stimulus 1`)", text)
        self.assertIn("### Talk 2 (after `Stimulus 2`)", text)
        self.assertIn("- Expected answer: a promise matters because people rely on it", text)

    def test_a_discovery_use_is_read_against_the_result_made_visible(self) -> None:
        make_sense = {"label": "What we saw", "kind": "make-sense", "content": {"resultOrPattern": "The shadow grows bigger when the torch is closer."}}
        teach_why = {"label": "Why", "kind": "teach-why", "content": {"accurateExplanation": "Light travels in straight lines."}}
        use = {"label": "Use it", "kind": "use-learning", "content": {"activity": "Predict."},
               "answer": {"kind": "model", "content": "The shadow grows bigger when the torch is closer."}}
        text = view([make_sense, teach_why, use])
        self.assertIn("### Use it (after `What we saw`, `Why`)", text)
        self.assertIn("already said: 6 of 6", text)

    def test_a_combined_stimulus_and_talk_is_read_against_the_grounding_before_it(self) -> None:
        ground = {"label": "What a councillor is", "kind": "grounding-input",
                  "content": {"input": "A councillor is chosen by local people to speak for their area."}}
        rank = {"label": "Rank the ideas", "kind": "stimulus-talk",
                "content": {"prompt": "A park has room for one new thing.", "question": "What should the council choose?",
                            "teacherListensFor": ["A councillor is chosen by local people"]}}
        text = view([ground, rank])
        self.assertIn("### Rank the ideas (after `What a councillor is`)", text)
        self.assertIn("already said: 4 of 4", text)
        alone = view([rank])
        self.assertIn("### Rank the ideas (its own pupil instruction)", alone)

    def test_a_second_finding_from_one_exploration_is_read_against_the_result(self) -> None:
        make_sense = {"label": "What we saw", "kind": "make-sense", "content": {"resultOrPattern": "Shadows are dark and change size."}}
        why1 = {"label": "Why 1", "kind": "teach-why", "content": {"accurateExplanation": "Light travels in straight lines."}}
        use1 = {"label": "Use 1", "kind": "use-learning", "content": {"activity": "Predict."}, "answer": {"kind": "model", "content": "straight"}}
        why2 = {"label": "Why 2", "kind": "teach-why", "content": {"accurateExplanation": "Opaque things block light."}}
        use2 = {"label": "Use 2", "kind": "use-learning", "content": {"activity": "Choose."},
                "answer": {"kind": "model", "content": "Shadows change size."}}
        text = view([make_sense, why1, use1, why2, use2])
        self.assertIn("### Use 2 (after `What we saw`, `Why 1`, `Why 2`)", text)
        self.assertIn("already said: 3 of 3", text)

    def test_a_plan_checkpoint_is_a_pupil_beat(self) -> None:
        enabling = {"label": "Learning safely", "kind": "teach-needed", "pupilInstruction": None,
                    "content": {"enablingInput": "We keep each other safe."}}
        plan = {"label": "Your suggestion", "kind": "plan-checkpoint", "content": {"whatChildrenPlan": "One rule."},
                "answer": {"kind": "model", "content": "We keep each other safe."}}
        task = {"label": "Build our agreement", "kind": "do-task", "content": {"activity": "Agree the rules."}}
        text = view([enabling, plan, task])
        self.assertIn("### Your suggestion (after `Learning safely`)", text)
        self.assertNotIn("### Build our agreement (after `Learning safely`)", text)

    def test_a_your_turn_looks_back_to_its_own_cycle_only(self) -> None:
        cycle1 = [{"label": "My Turn 1", "kind": "my-turn", "content": {"example": "43"}},
                  {"label": "Our Turn 1", "kind": "our-turn", "content": {"example": "48"}}]
        cycle2 = [{"label": "My Turn 2", "kind": "my-turn", "content": {"example": "3,998"}},
                  {"label": "Our Turn 2", "kind": "our-turn", "content": {"example": "5,996"}}]
        your = {"label": "Your Turn", "kind": "your-turn", "content": {"task": "Round."}, "answer": {"kind": "exact", "content": "4,000"}}
        text = view(cycle1 + cycle2 + [your])
        self.assertIn("### Your Turn (after `My Turn 2`, `Our Turn 2`)", text)

    def test_the_section_heading_and_count_line_are_kept(self) -> None:
        text = view([TEETH_TEACH, {"label": "Check", "kind": "do", "pupilInstruction": "Which tooth?",
                                   "content": {"task": "Which tooth?"}, "answer": {"kind": "exact", "content": "Tooth C"}}], STICKY)
        self.assertIn("## Each Do beside the teaching before it", text)
        self.assertIn("Words of the expected answer the Teach's board or script already said", text)
        self.assertIn("A quick check is a fresh case", text)


if __name__ == "__main__":
    unittest.main()
