"""The routes release, step 6: the tests that held words this release changed
follow them, each with the decision that changed it, and the release's new
tests are placed (from `rt-change/new/`).

- `test_do_beats_look_like_the_subject.py`: the movement line gains decision 1's
  exception.
- `test_the_leisure_lesson_repairs.py`: "a skill lesson is left alone" turns
  round (decision 2 and question 2): a skill lesson's Practise is checked, and a
  turn that only modelled the method is not the good one.
- `test_the_board_carries_the_route.py`: the bold sentence became his read-back
  (decisions 3 and 4).
- `test_the_board_teaches_and_the_criteria_are_runnable.py`: the tooth slide's
  story left for the log, its reason kept as a clause.
- New: the explanation check in every route, the class view's two fields, and
  the routes ledger's own pin test."""
import shutil
from pathlib import Path

from _patch import ROOT, replace_once

HERE = Path(__file__).resolve().parent
T = "scripts/tests/"

replace_once(
    T + "test_do_beats_look_like_the_subject.py",
    '        self.assertIn("Choose a whole-class movement beat only when the teacher asks for it.", text)\n',
    '        # Routes decision 1 (24 September 2026, "y"): movement without his asking\n'
    '        # only when the movement is itself what is being learned.\n'
    '        self.assertIn("Choose a whole-class movement beat only when the teacher asks for it, or when the movement '
    'is itself what is being learned (standing and making a quarter turn to learn what a quarter turn is).", text)\n',
)

replace_once(
    T + "test_the_leisure_lesson_repairs.py",
    '''    def test_a_skill_lesson_is_left_alone(self) -> None:
        # My Turn and Our Turn model the move in every skill lesson.
        sequence = [
            {"kind": "practise", "content": {"format": "written-explanation", "reasoningWords": ["because"], "launch": None}},
        ]
        validator.validate_explanation_task_is_modelled("Skill-based", sequence)
''',
    '''    def test_a_skill_lesson_is_checked_too(self) -> None:
        # Routes decision 2 (24 September 2026, "y"): one rule everywhere. A My
        # Turn that models the method has not shown what a good explanation of
        # it looks like, so it is not the good one (the plan's question 2, "Yes").
        sequence = [
            {"kind": "my-turn", "content": {"example": "Round 3,462 to the nearest 1,000.", "modelledExemplar": None},
             "answer": {"kind": "exact", "delivery": "answer-slide"}},
            {"kind": "practise", "content": {"format": "written-explanation", "reasoningWords": ["because"], "launch": None}},
        ]
        with self.assertRaises(validator.ContractError):
            validator.validate_explanation_task_is_modelled("Skill-based", sequence)
''',
)

replace_once(
    T + "test_the_board_carries_the_route.py",
    '        self.assertIn("The shape this teacher teaches in, more often than not, is four parts in this order", text)\n',
    '        # Routes decisions 3 and 4 (his 3, widened): how he usually explains\n'
    '        # anything, not a template, written once for every route.\n'
    '        self.assertIn("This is how this teacher usually explains anything, on a Teach board in any kind of lesson or '
    'wherever else something is explained: the takeaway, then a because or so that explains that one key point, then an '
    'example or what it does not mean.", text)\n'
    '        self.assertIn("It is how he usually explains, not a template, and the board reads that way unless the beat '
    'has a reason not to.", text)\n',
)

replace_once(
    T + "test_the_board_teaches_and_the_criteria_are_runnable.py",
    '        self.assertIn("The children learn a label rather than a layer", route)\n',
    '        # The tooth slide left for the build log (the routes release); its\n'
    '        # reason stays as a clause.\n'
    '        self.assertIn("so the children learn a label rather than what it names", route)\n',
)
replace_once(
    T + "test_the_lesson_is_written_as_a_lesson.py",
    '        self.assertIn("Saying the same thing three ways is the fault above", flat(CONTENT_ROUTE))\n',
    '        # The section other routes read on its own names the fault inside\n'
    '        # itself (the routes release, repair round 1).\n'
    '        self.assertIn("Saying the same thing three ways is a fault (this section\'s last paragraph: the landed '
    'sentence again in other words)", flat(CONTENT_ROUTE))\n',
)
replace_once(
    T + "test_the_board_teaches_and_the_criteria_are_runnable.py",
    '        self.assertIn("Saying the same thing three ways is the fault above", route)\n',
    '        # The section other routes read on its own names the fault inside\n'
    '        # itself (the routes release, repair round 1).\n'
    '        self.assertIn("Saying the same thing three ways is a fault (this section\'s last paragraph: the landed '
    'sentence again in other words)", route)\n',
)

for name in ("test_a_good_explanation_is_seen_first_in_every_route.py",
             "test_the_class_view_reads_every_explanation_the_board_shows.py",
             "test_routes_ledger_is_kept.py"):
    target = ROOT / T / name
    assert not target.exists(), target
    print(f"writing {target}")
    shutil.copyfile(HERE / "new" / name, target)
print("TESTS_OK")
