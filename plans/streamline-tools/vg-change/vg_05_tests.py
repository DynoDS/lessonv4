"""The voice guide release, step 5: two tests follow the changed words, and the
new pin test is placed.

- `test_voice_reaches_every_string.py` held the lesson designer's shorter copy
  of the guide's route (settled item 1): it now holds the guide's route naming
  definitions and scripts with their reason, and the designer reading the guide
  by that route.
- `test_invented_people_and_the_spoken_question.py` held the reading route's
  story (the three prompts that reached children): the reason stays in the
  guide, and the story is held in the build log, where `vg_01` copied it.
- `test_do_beats_look_like_the_subject.py` and
  `test_the_class_builds_the_set_and_one_case_is_not_the_group.py` held two of
  the lines that fixed a nine-year-old reader (the voice list's decision 13).
- `test_teacher_voice_ledger_is_kept.py` is new (`new/`): the shared checks over
  `teacher_voice_ledger_pins.json` and a test per decision."""
from _patch import place_new, replace_once

replace_once(
    "scripts/tests/test_voice_reaches_every_string.py",
    "    def test_definitions_and_scripts_are_named_in_the_loading_route(self) -> None:\n"
    "        \"\"\"The routing named model answers, worked examples and success\n"
    "        criteria and stopped there, so §5 had no trigger anywhere.\"\"\"\n"
    "        designer = flat(LESSON_DESIGNER)\n"
    "        self.assertIn(\"§5 a vocabulary definition or explanation\", designer)\n"
    "        self.assertIn(\"§§1 and 3 a spoken script\", designer)\n"
    "        self.assertIn(\n"
    "            \"Definitions and scripts are the two most often missed\", designer\n"
    "        )\n",
    "    def test_definitions_and_scripts_are_named_in_the_loading_route(self) -> None:\n"
    "        \"\"\"The routing named model answers, worked examples and success\n"
    "        criteria and stopped there, so §5 had no trigger anywhere. The\n"
    "        guide's own route now names definitions and scripts with their\n"
    "        reason, and the designer reads the guide by that route rather than\n"
    "        by a shorter copy of it (the voice guide release, settled item 1).\"\"\"\n"
    "        voice = flat(VOICE)\n"
    "        self.assertIn(\"a definition or explanation §5\", voice)\n"
    "        self.assertIn(\"A speaker-note script opens §16H before the first one you write\", voice)\n"
    "        self.assertIn(\"**Definitions and scripts are the other two**\", voice)\n"
    "        self.assertIn(\n"
    "            \"by the route its `How to read this file` sets out\", flat(LESSON_DESIGNER)\n"
    "        )\n",
)

replace_once(
    "scripts/tests/test_invented_people_and_the_spoken_question.py",
    "    def test_the_routing_card_carries_what_happens_when_it_is_skipped(self) -> None:\n"
    "        voice = flat(VOICE)\n"
    "        self.assertIn(\"Choose a job.\", voice)\n"
    "        self.assertIn(\"Fireman\", voice)\n"
    "        self.assertIn(\"What do their reasons share?\", voice)\n"
    "        self.assertIn(\"Routing by the kind of string only works\", voice)\n",
    "    def test_the_routing_card_carries_what_happens_when_it_is_skipped(self) -> None:\n"
    "        # The reason stays in the guide; the three prompts that reached\n"
    "        # children are kept in the build log (the voice guide release).\n"
    "        voice = flat(VOICE)\n"
    "        self.assertIn(\"have reached real children\", voice)\n"
    "        self.assertIn(\"What do their reasons share?\", voice)\n"
    "        self.assertIn(\"Routing by the kind of string only works\", voice)\n"
    "        self.assertNotIn(\"Fireman\", voice)\n"
    "        log = flat(ROOT / \"references\" / \"build-review-log.md\")\n"
    "        self.assertIn(\"`Choose a job.` on an appliances sheet, which a class answered `Fireman`\", log)\n",
)

# Decision 13: two of the lines that fixed a nine-year-old reader were held by
# tests; they hold the child in this class now.
replace_once(
    "scripts/tests/test_do_beats_look_like_the_subject.py",
    "        self.assertIn(\"Say the difference between the two groups in one plain sentence a nine-year-old would "
    "follow.\", text)\n",
    "        self.assertIn(\"Say the difference between the two groups in one plain sentence a child in this class would "
    "follow.\", text)\n",
)
replace_once(
    "scripts/tests/test_the_class_builds_the_set_and_one_case_is_not_the_group.py",
    "        self.assertIn(\"answering your own question as a nine-year-old\", preferences)\n",
    "        self.assertIn(\"answering your own question as a child in this class\", preferences)\n",
)

place_new("scripts/tests/test_teacher_voice_ledger_is_kept.py", "test_teacher_voice_ledger_is_kept.py")
print("TESTS_OK")
