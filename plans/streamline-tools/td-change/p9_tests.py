"""4.2.285: tests that pinned the designer's folded copies, the old reviewer
triggers and the old discovery shape now pin the rules where they live.
Every replacement asserts its old text appears exactly once."""
from pathlib import Path

TESTS = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\scripts\tests")


def patch(name: str, pairs: list[tuple[str, str]]) -> None:
    path = TESTS / name
    text = path.read_text(encoding="utf-8")
    for old, new in pairs:
        assert text.count(old) == 1, (name, old[:70])
        text = text.replace(old, new)
    path.write_text(text, encoding="utf-8")
    print("patched", name)


patch("test_a_my_turn_is_used_before_the_next_is_taught.py", [(
    '"`validate-lesson-design.py` refuses two My Turn units in a row",',
    '"`validate-lesson-design.py` refuses any two My Turn units in a row",',
)])

patch("test_an_explanation_gets_used_not_restated.py", [(
    '''    def test_the_routing_card_opens_the_rhythm_for_a_restating_do(self) -> None:
        routes = dict(packet.PREFERENCE_REVIEW_ROUTES)
        trigger = routes[RHYTHM]
        self.assertIn(
            "when a Do beat's expected answer is a summary, headline, recap or "
            "restatement of the explanation its own Teach just gave",
            trigger,
        )

    def test_the_trigger_is_visible_before_the_judgement_is_made(self) -> None:
        """The file's own warning: a trigger the reviewer can only apply after
        finding the fault never fires. The expected answer is on the face of
        the view, so this one does."""
        routes = dict(packet.PREFERENCE_REVIEW_ROUTES)
        trigger = routes[RHYTHM]
        self.assertIn("expected answer", trigger)
''',
    '''    def test_the_reviewer_reads_the_rhythm_for_a_restating_do_every_review(self) -> None:
        """Since 4.2.285 the rhythm is read every review, so no trigger has to
        fire first; its always-read note still names the restating Do."""
        always = {heading: note for _name, heading, note in packet.ALWAYS_READ_REVIEW_SECTIONS}
        self.assertNotIn(RHYTHM, dict(packet.PREFERENCE_REVIEW_ROUTES))
        note = " ".join(always[RHYTHM].split())
        self.assertIn(
            "a Do whose expected answer is a summary, headline, recap or "
            "restatement of the explanation its own Teach just gave",
            note,
        )
''',
)])

patch("test_design_review_packet.py", [(
    '''def test_the_rhythm_section_opens_on_a_countable_condition():
    """A trigger the reviewer can only meet by already having the judgement
    never fires.

    The rhythm section was routed "when a Do beat practises a different idea
    from the one its own Teach just taught". To follow that, the reviewer has to
    have found the fault in order to be sent to the section that would help it
    find the fault. A Year 4 History lesson went through review twice and came
    back both times with punctuation corrections and `Redesign required: None`.
    Counting Teach beats is something the review view answers on its face.
    """
    trigger = _routing()[RHYTHM]
    assert "three or more Teach beats" in trigger
    # And it says what to do once open, so the count is not merely a nudge.
    assert "say in your own words the move each Teach taught" in trigger


def test_the_self_diagnosed_route_is_kept_beside_the_countable_one():
    """Both ways in, because they catch different reviewers.

    The self-diagnosed clause still catches a reviewer that notices the
    mismatch on its own, and removing it would undo an earlier repair. What it
    cannot do is guarantee the section ever opens, which is the count's job.
    """
    trigger = _routing()[RHYTHM]
    assert (
        "when a Do beat practises a different idea from the one its own Teach "
        "just taught" in trigger
    )
    assert "three or more Teach beats" in trigger
''',
    '''def test_the_rhythm_section_is_read_every_review():
    """A trigger the reviewer can only meet by already having the judgement
    never fires.

    The rhythm section was routed "when a Do beat practises a different idea
    from the one its own Teach just taught". To follow that, the reviewer has to
    have found the fault in order to be sent to the section that would help it
    find the fault. A Year 4 History lesson went through review twice and came
    back both times with punctuation corrections and `Redesign required: None`.
    A countable trigger (three or more Teach beats) was added beside it; since
    4.2.285 the teacher's decision reads the section every review, so no
    trigger has to fire, and the count survives as what to do once it is open.
    """
    assert RHYTHM not in _routing()
    spec = importlib.util.spec_from_file_location("design_review_packet_always", PACKET)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    always = {heading: " ".join(note.split())
              for _name, heading, note in module.ALWAYS_READ_REVIEW_SECTIONS}
    note = always[RHYTHM]
    assert "three or more Teach beats" in note
    assert "say in your own words the move each Teach taught" in note
    assert "a question to the room" in note
''',
)])

patch("test_lesson_design_contract.py", [(
    'assert_invalid_contract(design, photos, "Discovery sequence must be exactly")',
    'assert_invalid_contract(design, photos, "Discovery sequence must be:")',
)])

patch("test_rhythm_holds_in_every_route.py", [
    (
        '''    def test_lesson_designer_says_how_the_rhythm_lands_in_a_task_centred_lesson(self) -> None:
        text = flat(LESSON_DESIGNER)
        self.assertIn("one enabling idea per `teach-needed` unit", text)
        self.assertIn("only the last may be used by the plan or the task itself", text)
''',
        '''    def test_the_rhythm_home_says_how_it_lands_in_a_task_centred_lesson(self) -> None:
        # The designer's own copy folded into the one home in 4.2.285, and the
        # designer is sent there to read it whole.
        text = flat(PREFERENCES)
        self.assertIn(
            "each enabling idea is its own `teach-needed` unit, used through its "
            "`pupilInstruction` before the next is taught",
            text,
        )
        self.assertIn("only the last may be used by the planning or the task itself", text)
        self.assertIn(
            "`preferences.md` → The Teach → Do → Teach → Do Rhythm is the rhythm: read it whole",
            flat(LESSON_DESIGNER),
        )
''',
    ),
    (
        '''    def test_reviewer_trigger_for_the_rhythm_is_route_neutral(self) -> None:
        routes = dict(packet.PREFERENCE_REVIEW_ROUTES)
        trigger = routes["The Teach → Do → Teach → Do Rhythm"]
        self.assertNotIn("Content-based", trigger)
        self.assertIn("in any route", trigger)
''',
        '''    def test_the_reviewer_reads_the_rhythm_in_every_route(self) -> None:
        always = {heading: note for _name, heading, note in packet.ALWAYS_READ_REVIEW_SECTIONS}
        self.assertIn("The Teach → Do → Teach → Do Rhythm", always)
        self.assertNotIn("The Teach → Do → Teach → Do Rhythm", dict(packet.PREFERENCE_REVIEW_ROUTES))
        self.assertNotIn("Content-based", always["The Teach → Do → Teach → Do Rhythm"])
''',
    ),
    (
        '''        self.assertIn("a run of slides that are all the teacher talking", text)
''',
        '''        # The teacher's decision of 23 September 2026: the run is counted in
        # ideas, not slides.
        self.assertNotIn("a run of slides that are all the teacher talking", text)
        self.assertIn(
            "a run of teacher beats that teaches a second new idea before children "
            "have done anything with the first",
            text,
        )
        self.assertIn("(two teacher slides carrying one idea are not that run)", text)
''',
    ),
])

patch("test_teaching_reaches_the_board.py", [
    (
        '''        self.assertIn("Questioning is not doing: the Do half", flat(LESSON_DESIGNER))
''',
        '''        # The designer's clipped copy folded into the one home in 4.2.285; the
        # designer names the rule where it points there.
        designer = flat(LESSON_DESIGNER)
        self.assertIn("questioning is not doing", designer)
        self.assertIn("The Do half is a `do` unit or a `pupilInstruction`.", designer)
''',
    ),
    (
        '''        self.assertIn("a question to the room is a key question, not this beat", flat(CONTENT_BASED))
''',
        '''        self.assertIn(
            "a question to the room is a key question, not this beat, unless it is chosen "
            "so the answer needs the idea and every child commits, with how they commit "
            "written into the task",
            flat(CONTENT_BASED),
        )
''',
    ),
    (
        '''        designer = flat(LESSON_DESIGNER)
        self.assertIn("Every Do beat: every child uses the chunk and leaves something the teacher can see", designer)
        self.assertIn("Demand climbs across lesson", designer)
''',
        '''        # The designer's copies folded into the one home in 4.2.285.
        designer = flat(LESSON_DESIGNER)
        self.assertIn("variety and demand across the lesson", designer)
        rhythm = section(PREFERENCES, "The Teach → Do → Teach → Do Rhythm")
        self.assertIn("It gives every child something concrete to do with the chunk and leaves something the teacher can see", rhythm)
        self.assertIn("Climb the demand across the lesson, without forcing a staircase", rhythm)
''',
    ),
    (
        '''        self.assertIn("lives only in its script", trigger)
        self.assertIn("question to the room", trigger)
        self.assertIn("instructions only", trigger)
''',
        '''        self.assertIn("lives only in its script", trigger)
        self.assertIn("instructions only", trigger)
        # A question to the room is the rhythm's rule, read every review since
        # 4.2.285, rather than one clause in this section.
        always = {heading: note for _name, heading, note in packet.ALWAYS_READ_REVIEW_SECTIONS}
        self.assertIn("a question to the room", " ".join(always["The Teach → Do → Teach → Do Rhythm"].split()))
''',
    ),
])

patch("test_the_do_uses_what_its_teach_taught.py", [
    (
        '''    def test_the_designer_carries_the_pairing_test_beside_questioning_is_not_doing(self) -> None:
        text = flat(LESSON_DESIGNER)
        self.assertIn("A use of the wrong idea is not the beat either", text)
        self.assertIn("`" + RULE + "`", text)
        self.assertIn(
            "Heading, explanation and following Do name one move between them",
            text,
        )
''',
        '''    def test_the_designer_carries_the_pairing_test_beside_questioning_is_not_doing(self) -> None:
        # The designer's worked copy folded into the one home in 4.2.285; its
        # pointer names both rules together and keeps the read-back.
        text = flat(LESSON_DESIGNER)
        self.assertIn(
            "questioning is not doing, and the Do uses the idea its own Teach just taught",
            text,
        )
        self.assertIn(
            "heading, explanation and following Do name one move between them",
            text,
        )
''',
    ),
    (
        '''    def test_the_reviewers_routing_card_opens_the_rhythm_for_a_mismatched_pair(self) -> None:
        routes = dict(packet.PREFERENCE_REVIEW_ROUTES)
        trigger = routes["The Teach → Do → Teach → Do Rhythm"]
        self.assertIn("in any route", trigger)
        self.assertIn(
            "when a Do beat practises a different idea from the one its own Teach just taught",
            trigger,
        )
''',
        '''    def test_the_reviewer_reads_the_rhythm_for_a_mismatched_pair_every_review(self) -> None:
        # Since 4.2.285 the section is read every review rather than on a
        # trigger the reviewer could only meet after finding the fault.
        always = {heading: note for _name, heading, note in packet.ALWAYS_READ_REVIEW_SECTIONS}
        note = " ".join(always["The Teach → Do → Teach → Do Rhythm"].split())
        self.assertIn("the pairing test", note)
        self.assertNotIn("The Teach → Do → Teach → Do Rhythm", dict(packet.PREFERENCE_REVIEW_ROUTES))
''',
    ),
])
