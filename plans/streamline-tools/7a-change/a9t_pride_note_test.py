"""Release 7A (4.2.293), step 9's test: the routing card's Pride Lessons note
(PF-X46, settled item 14) no longer says the section calibrates how often a
lesson returns to the same evidence, which Pride Lessons does not hold; the
test that asserted the old words asserts the corrected ones and bars the old
clause."""
from _patch import replace_once

replace_once("scripts/tests/test_fit_is_judged_against_the_pride_lessons.py", """        self.assertIn(
            '"Read every review, before the User-fit judgement: it is the " '
            '"calibration for how much one beat puts in front of the class and how " '
            '"often a lesson returns to the same evidence.',
            text,
        )""", """        self.assertIn(
            '"Read every review, before the User-fit judgement: it is the " '
            '"calibration for how much one beat puts in front of the class, and it " '
            '"holds the Teach slides the teacher chose, written out.',
            text,
        )
        # Release 7A (PF-X46): how often a lesson returns to the same evidence
        # is What a Lesson Is For's rule and the reviewer's own, not a thing
        # Pride Lessons holds, so the note no longer claims it.
        self.assertNotIn('"often a lesson returns to the same evidence.', text)""")
print("Pride note test follows")
