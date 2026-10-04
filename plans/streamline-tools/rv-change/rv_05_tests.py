"""The design reviewer release, step 5: the tests.

- Two tests held words this release changed, each for a reason that still holds:
  the voice authority test held "the teacher edits it out by hand" (settled item
  11: a moment written as a reason; the reason stays as "the teacher would have
  to edit it out by hand"), and the maths sheet test held "read the forms rather
  than confirming the objective matches", which now opens its own sentence
  because the story in front of it left (the worksheets plan's Q10).
- The packet's tests gain the card's three cases (decision 7), the fixture's
  three cases (decision 2) and the report shape's closest calls (settled item
  5), from `new/packet_tests_addition.py`.
- The new pin test is placed from `new/`.
"""
from _patch import NEW, append, place_new, read, replace_once

TESTS = "scripts/tests"

replace_once(
    f"{TESTS}/test_reviewer_voice_authority.py",
    "        # The reason: strings ship verbatim, so today the teacher fixes them.\n"
    "        self.assertIn(\"no downstream agent is permitted to reword it\", reviewer)\n"
    "        self.assertIn(\"the teacher edits it out by hand\", reviewer)\n",
    "        # The reason: strings ship verbatim, so otherwise the teacher fixes them.\n"
    "        self.assertIn(\"no downstream agent is permitted to reword it\", reviewer)\n"
    "        self.assertIn(\"the teacher would have to edit it out by hand\", reviewer)\n",
)

replace_once(
    f"{TESTS}/test_a_maths_sheet_continues_the_lesson.py",
    "        self.assertIn(\n"
    "            \"read the forms rather than confirming the objective matches\", reviewer\n"
    "        )\n",
    "        self.assertIn(\n"
    "            \"Read the forms rather than confirming the objective matches\", reviewer\n"
    "        )\n",
)

packet_tests = f"{TESTS}/test_design_review_packet.py"
assert "CARD_CASES" not in read(packet_tests)
append(packet_tests, (NEW / "packet_tests_addition.py").read_text(encoding="utf-8"))

place_new(f"{TESTS}/test_design_reviewer_ledger_is_kept.py", "test_design_reviewer_ledger_is_kept.py")
print("tests done")
