"""Assumed knowledge (4.2.287): the tests and the mapping follow the repairs,
and close the gaps the change check's experiments found (its section 6)."""
from pathlib import Path

REPO = Path(r"C:\Users\Daniel\Projects\lessonv4")
ROOT = REPO / "plugins" / "lesson-v4"
HERE = Path(__file__).resolve().parent


def patch(path: Path, pairs) -> None:
    t = path.read_text(encoding="utf-8")
    for old, new in pairs:
        assert t.count(old) == 1, (path.name, t.count(old), old[:100])
        t = t.replace(old, new)
    path.write_text(t, encoding="utf-8")
    print("patched", path.name)


patch(ROOT / "scripts" / "tests" / "test_names_on_the_board_are_read_as_the_class_reads_them.py", [
    # 4a: a one-word name, so a part-word match would fail the test.
    ('''    def test_a_longer_word_does_not_count(self) -> None:
        design, _photos = contract.valid_content_contract()
        unit(design, "teach")["content"]["explanation"] += " Victorian children worked long hours."
        unit(design, "do")["content"]["task"] = "What did Queen Victoria change?"
        self.assertIn("not said earlier on the board", listed(design)["Queen Victoria"])
''',
     '''    def test_a_longer_word_does_not_count(self) -> None:
        design, _photos = contract.valid_content_contract()
        unit(design, "teach")["content"]["explanation"] += " Victorian children worked long hours."
        unit(design, "do")["content"]["task"] = "What did the new laws of Victoria change?"
        self.assertIn("not said earlier on the board", listed(design)["Victoria"])
'''),
    # The script is not read as board text either: a name only the script
    # said is first listed where the board shows it.
    ('''        unit(design, "do")["content"]["task"] = "Why did people skate on the frozen Thames?"
        self.assertIn("not said earlier on the board", listed(design)["Thames"])
''',
     '''        unit(design, "do")["content"]["task"] = "Why did people skate on the frozen Thames?"
        self.assertIn("first on the board in `Do`; not said earlier on the board", listed(design)["Thames"])
'''),
    ('''        for word in ("Closely", "Turn", "Order"):
            self.assertNotIn(word, names)
''',
     '''        for word in ("Closely", "Turn", "Order"):
            self.assertNotIn(word, names)

    def test_an_opening_verb_or_pronoun_is_not_part_of_a_name(self) -> None:
        self.assertEqual(packet.board_names_in("Prove Oliver wrong. Someone said so. I'd like to know."), ["Oliver"])

    def test_a_sentence_case_title_supplies_the_signal(self) -> None:
        design, _photos = contract.valid_content_contract()
        unit(design, "observe")["label"] = "What did Queen Victoria change?"
        unit(design, "do")["content"]["task"] = "Victoria changed the law. Explain one effect."
        self.assertIn("Victoria", listed(design))
'''),
])

M = HERE / "build_ak_mapping.py"
patch(M, [
    # F01 (1b).
    ('A plan\'s lessons before this one are rough context: take them as taught by the time this one is, and give anything today\'s teaching leans on from one of them a short reminder where it first appears today (`Lord Shaftesbury, who we met last week, ...`), never a reteach.',
     'A plan\'s lessons before this one are rough context: take them as taught by the time this one is. Anything today\'s teaching leans on from an earlier lesson, whether one of the plan\'s, the previous lesson or prior teaching the brief names, gets a short reminder where it first appears today (`Lord Shaftesbury, who we met last week, ...`), never a reteach.'),
    ('"decisions 2 and 3: a plan\'s earlier lessons are rough context, taken as taught, and anything today leans on from them gets a short reminder where it first appears today, never a reteach;',
     '"decisions 2 and 3: a plan\'s earlier lessons are rough context, taken as taught, and anything today leans on from any earlier lesson (the plan\'s, the previous lesson, prior teaching the brief names) gets a short reminder where it first appears today, never a reteach;'),
    # A05 (1f), and "spoken preparation" barred in any length (gap 2).
    ("because the script only says the board (`preferences.md` → `Write the slides as if the teacher never opens the notes`).\")],\n               [(LD, \"spoken preparation children receive\")]),",
     "because the script says the board and never teaches what the board lacks (`preferences.md` → `Write the slides as if the teacher never opens the notes`).\")],\n               [(LD, \"spoken preparation\")]),"),
    ('[(HIST, "unless an earlier lesson the brief names taught it")]),',
     '[(HIST, "unless an earlier lesson the brief names")]),'),
    # K01 (1a).
    ('which you read every review. For both, the repair is in how the teaching is worded, not a card: the name or the thing arrives with its context in the sentence that brings it in (`preferences.md` → Slide Philosophy).")',
     'which you read every review, and use its three repairs. For a name, or a thing the lesson meets on the way, the repair is in how the teaching is worded, not a card: it arrives with its context in the sentence that brings it in (`preferences.md` → Slide Philosophy).")'),
    ('ordinary words are read by the vocabulary rule every review; the repair is in the wording;',
     'ordinary words are read by the vocabulary rule every review, with its three repairs; for a name or a thing met on the way the repair is in the wording, not a card;'),
    # K02: the note's own reminder clause is pinned (gap 1, D30).
    ('                (PACKET, "\\"finding, repaired by a clause in the sentence that brings it in or by \\"")],',
     '                (PACKET, "\\"finding, repaired by a clause in the sentence that brings it in or by \\""),\n                (PACKET, "\\"and a name an earlier lesson taught still gets a short reminder where \\"")],'),
    # A11 (1d).
    ('the relationship the adult would have to supply is the finding, judged by `preferences.md` → What a Lesson Is For, `Work from what children can use at that point`, and its limits."),',
     'the relationship the adult would have to supply is the finding, judged by `preferences.md` → What a Lesson Is For, `Work from what children can use at that point` (new evidence is allowed; a new explanation the lesson never taught is not) and `The work claims no more than the evidence, and keeps its support` beside it."),'),
    ('"decision 9: the reviewer keeps its procedure and points to the home, which now carries its limits and which it reads every review",',
     '"decision 9: the reviewer keeps its procedure and points to the home and the paragraph beside it, naming both limits; the home and its neighbour now carry its limits, and it reads the section every review",'),
    # D01 (1g): not quite word for word.
    ('"decision 5: the test moved word for word to `preferences.md` → Source and Scenario Integrity, \\"new to the period\\" read as \\"new to the topic\\";',
     '"decision 5: the test moved to `preferences.md` → Source and Scenario Integrity word for word except that \\"new to the period\\" reads \\"new to the topic\\" and the opening\'s \\"the people or experience being studied\\" reads \\"what the lesson studies\\";'),
    # A01's outcome says where the three extras went (1d).
    ('and a Practise brought forward (A15, A16)",',
     'and a Practise brought forward (A15, A16); the last three sit in the paragraph beside it, `The work claims no more than the evidence, and keeps its support`",'),
    # DEC-09 (1e).
    ('(PREF, "Each distinct case a child meets alone is one they have seen worked, because a case modelled nowhere but met in independent practice is met cold (`teaching-sequence-skill-based.md` says where the extra case goes)."),',
     '(PREF, "Where a method has distinct cases, each case a child meets alone that changes the procedure is one they have seen worked, because a case modelled nowhere but met in independent practice is met cold (`teaching-sequence-skill-based.md` says where the extra case goes)."),'),
    # DEC-04 (1a) is pinned whole by its paragraph; its outcome says so.
    ('"decision 4, with the teacher\'s second-round words on decision 8: a name or a thing the class has never met arrives with its context in the sentence that brings it in, in every subject,',
     '"decision 4, with the teacher\'s second-round words on decision 8: a name, or a thing the lesson meets on the way that the class has never met, arrives with its context in the sentence that brings it in, in every subject, and for these the repair is the wording, not a card (an ordinary word the teaching leans on keeps the vocabulary rule\'s three repairs),'),
    # The trigger that lets the reviewer reach decisions 5 and 11 (gap 1, D27).
    ('    ("AK-DEC-05", "decision 5: the source test\'s general home opens with the rule it serves, for every subject, and names history\'s example",\n     [(PREF, ',
     '    ("AK-DEC-05", "decisions 5 and 11: the source test\'s general home opens with the rule it serves, for every subject, and names history\'s example; the reviewer\'s trigger for the section names both rules that moved there",\n     [(PACKET, "\\"a named source, story or clip that may cost more explaining than it \\""),\n      (PACKET, "\\"teaches, and any beat that invites children\'s own experience.\\""),\n      (PREF, '),
])

# QC-A22's outcome named the wrong paragraph (1d).
P = ROOT / "scripts" / "tests" / "quick_checks_ledger_pins.json"
patch(P, [(
    "moved in 4.2.287 to the one home of `Work from what children can use at that point` (assumed knowledge decision 9); the reviewer points there, and reads that section every review",
    "moved in 4.2.287 to `The work claims no more than the evidence, and keeps its support`, beside the one home of `Work from what children can use at that point` (assumed knowledge decision 9); the reviewer points to both, and reads that section every review",
)])
A4 = HERE / "a4_repin_other_topics.py"
patch(A4, [(
    '"moved in 4.2.287 to the one home of `Work from what children can use at that point` (assumed knowledge decision 9); the reviewer points there, and reads that section every review"),',
    '"moved in 4.2.287 to `The work claims no more than the evidence, and keeps its support`, beside the one home of `Work from what children can use at that point` (assumed knowledge decision 9); the reviewer points to both, and reads that section every review"),',
)])
