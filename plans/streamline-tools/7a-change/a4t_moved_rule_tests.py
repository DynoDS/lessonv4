"""Release 7A (4.2.293), steps 4 and 6: three tests held words the fold moved
from the lesson designer to their home in `preferences.md`, and move with them
(the rounds' rule: folding a copy means moving its test in the same release).

- "a sticky fact is not where an idea goes" (G12) now opens a paragraph of
  preferences -> Sticky Knowledge, which the designer's section points at;
- "trace each one forward to the stage that needs it" (G09) is in the same
  home's first paragraph;
- "omit the ending when practice already draws on the intended learning" (J11)
  is in preferences -> The Apply Slide, which names the intended learning as the
  read-back sentence that closes the walk-through and the sticky knowledge; the
  stale "quality-lock sentence" (settled item 12) is barred in the designer, and
  the designer's pointer to the home is held."""
from _patch import replace_once

IDEA = "scripts/tests/test_an_idea_is_met_on_changing_evidence.py"
NAMED = "scripts/tests/test_learning_is_named_before_the_task.py"

replace_once(IDEA, '''        self.assertIn("which kind of learning it is, a fact, a method or an idea", text)
        self.assertIn("a sticky fact is not where an idea goes", text)''', '''        self.assertIn("which kind of learning it is, a fact, a method or an idea", text)
        # Release 7A folded the sticky rule into its home, which the designer's
        # Sticky Knowledge section tells it to read before naming a fact.
        self.assertIn("`preferences.md` → Sticky Knowledge is the home: read it before naming a sticky fact.", text)
        sticky = section(REF / "preferences.md", "Sticky Knowledge")
        self.assertIn("A sticky fact is not where an idea goes", sticky)
        self.assertIn("`concepts` is where it lives, in every route.", sticky)''')

replace_once(NAMED, '''    def test_the_ending_decision_uses_the_named_learning(self) -> None:
        self.assertIn("omit the ending when practice already draws on the intended learning", self.designer)
        self.assertIn("Intended learning means what the quality-lock sentence and the sticky knowledge name", self.designer)

    def test_sticky_knowledge_is_traced_forward(self) -> None:
        self.assertIn("trace each one forward to the stage that needs it", self.designer)''', '''    def test_the_ending_decision_uses_the_named_learning(self) -> None:
        # Release 7A: the rule lives in its home, and the designer points at it.
        apply = section(PREFERENCES, "The Apply Slide")
        self.assertIn("omit the ending when practice already draws on the intended learning", apply)
        self.assertIn("the lesson names it in the read-back sentence that closes the walk-through and in its sticky knowledge", apply)
        self.assertIn("`preferences.md` → The Apply Slide owns when practice already draws on the intended learning", self.designer)
        self.assertNotIn("quality-lock sentence", self.designer)

    def test_sticky_knowledge_is_traced_forward(self) -> None:
        self.assertIn("trace each one forward to the stage that needs it", section(PREFERENCES, "Sticky Knowledge"))''')
print("moved-rule tests follow their words")
