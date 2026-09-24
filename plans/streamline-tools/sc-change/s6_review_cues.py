"""Success criteria (4.2.288), decisions 9 and 15: the review page's two cues
on a criteria step ask the teacher's questions rather than pointing at a
fault. A second sentence goes only when it restates the step or names what it
produced; a short question step stands when it tells the child what to do next
("Same? Move right." is "short and snappy and it makes sense")."""
from pathlib import Path

ROOT = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4")


def patch(rel: str, pairs) -> None:
    path = ROOT / rel
    t = path.read_text(encoding="utf-8")
    for old, new in pairs:
        assert t.count(old) == 1, (rel, t.count(old), old[:100])
        t = t.replace(old, new)
    path.write_text(t, encoding="utf-8")
    print("patched", rel)


patch("scripts/design-review-packet.py", [
    ("    # steps still get a reread for explanation the teaching already gave; a\n"
     "    # question-fragment condition gets one for shorthand the child must unpack.\n",
     "    # steps still get a reread for explanation the teaching already gave. A\n"
     "    # second sentence and a question step are asked about, not faulted: the\n"
     "    # teacher's decisions of 23 September 2026 keep a condition the step always\n"
     "    # meets and a question that tells the child what to do next.\n"),
    ('                f"step {index}: more than one sentence; is it two steps, or "\n'
     '                "carrying explanation the teaching already gave?"\n',
     '                f"step {index}: more than one sentence; does the second only "\n'
     '                "restate the step or name what it produced (then it goes), or "\n'
     '                "give a condition the step always meets (then it stays)?"\n'),
    ('                f"step {index}: question-fragment condition; would an If... "\n'
     '                "sentence save the child unpacking it?"\n',
     '                f"step {index}: a question step; does it tell the child what to "\n'
     '                "do next or what to look for? If so it stands, as `Same? Move "\n'
     '                "right.` does"\n'),
])

patch("scripts/tests/test_success_criteria_fit_a_glance.py", [
    ("def test_question_fragment_conditions_are_brought_to_review():\n",
     "def test_a_question_step_is_asked_about_not_faulted():\n"
     "    # The teacher, 23 September 2026: \"Same? Move right\" is a fine step,\n"
     "    # \"short and snappy and it makes sense\".\n"),
    ("    assert any('step 2: question-fragment' in cue for cue in cues)\n"
     "    assert any('step 3: question-fragment' in cue for cue in cues)\n",
     "    assert any('step 2: a question step' in cue and 'If so it stands' in cue for cue in cues)\n"
     "    assert any('step 3: a question step' in cue for cue in cues)\n"
     "    assert not any('If... sentence' in cue for cue in cues)\n"),
    ("    assert any('step 1: more than one sentence' in cue for cue in cues)\n",
     "    assert any('step 1: more than one sentence' in cue and 'then it stays' in cue for cue in cues)\n"),
])
