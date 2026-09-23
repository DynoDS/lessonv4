"""Assumed knowledge (4.2.287): repairs from the independent change check
(`assumed-knowledge-change-check.md`). The caption question (its 1c) is the
teacher's and is not touched here."""
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


# 1a: "not a card" is for names and things met in passing, which is what the
# teacher's words were about; an ordinary word the teaching leans on keeps the
# vocabulary rule's three repairs, the third of which is a card.
patch("references/preferences.md", [
    ("A named person, place, organisation or event, in any subject, is explained where it first appears on the board, in a clause a child can hold (`Queen Elizabeth I, who ruled England in Tudor times`); so is a thing the class has never met (an order, a steam engine). The repair is in how the teaching is worded, not a vocabulary card.",
     "A named person, place, organisation or event, in any subject, is explained where it first appears on the board, in a clause a child can hold (`Queen Elizabeth I, who ruled England in Tudor times`); so is a thing the lesson meets on the way that the class has never met (an order, a steam engine). For these, the repair is in how the teaching is worded, not a vocabulary card. What the lesson exists to teach is taught, and a word the teaching leans on takes the three repairs in `Vocabulary` → `A word the teaching leans on is taught`."),
    # 1e: the home carries A31's condition.
    ("Each distinct case a child meets alone is one they have seen worked, because a case modelled nowhere but met in independent practice is met cold (`teaching-sequence-skill-based.md` says where the extra case goes).",
     "Where a method has distinct cases, each case a child meets alone that changes the procedure is one they have seen worked, because a case modelled nowhere but met in independent practice is met cold (`teaching-sequence-skill-based.md` says where the extra case goes)."),
])

REV = "agents/design-reviewer.md"
patch(REV, [
    # 1a in the reviewer.
    ("read the teaching for those by `preferences.md` → Vocabulary, `A word the teaching leans on is taught`, which you read every review. For both, the repair is in how the teaching is worded, not a card: the name or the thing arrives with its context in the sentence that brings it in (`preferences.md` → Slide Philosophy).",
     "read the teaching for those by `preferences.md` → Vocabulary, `A word the teaching leans on is taught`, which you read every review, and use its three repairs. For a name, or a thing the lesson meets on the way, the repair is in how the teaching is worded, not a card: it arrives with its context in the sentence that brings it in (`preferences.md` → Slide Philosophy)."),
    # 1d: the pointer names both limits and the paragraph beside the home.
    ("the relationship the adult would have to supply is the finding, judged by `preferences.md` → What a Lesson Is For, `Work from what children can use at that point`, and its limits.",
     "the relationship the adult would have to supply is the finding, judged by `preferences.md` → What a Lesson Is For, `Work from what children can use at that point` (new evidence is allowed; a new explanation the lesson never taught is not) and `The work claims no more than the evidence, and keeps its support` beside it."),
    # 2a: the compatibility route reads the vocabulary rule every review too.
    ("always read `preferences.md` → Pride Lessons (Quality Anchor), What a Lesson Is For and The Teach → Do → Teach → Do Rhythm, `teacher-voice.md` → Final pre-flight check, and `task-contrasts.md` → The contrasts;",
     "always read `preferences.md` → Pride Lessons (Quality Anchor), What a Lesson Is For, The Teach → Do → Teach → Do Rhythm and Vocabulary (for `A word the teaching leans on is taught`), `teacher-voice.md` → Final pre-flight check, and `task-contrasts.md` → The contrasts;"),
])

# 1b: the reminder reaches anything from an earlier lesson, not only a plan's.
# 1f: the "because" says what decision 1 says, no more.
patch("agents/lesson-designer.md", [
    ("A plan's lessons before this one are rough context: take them as taught by the time this one is, and give anything today's teaching leans on from one of them a short reminder where it first appears today (`Lord Shaftesbury, who we met last week, ...`), never a reteach.",
     "A plan's lessons before this one are rough context: take them as taught by the time this one is. Anything today's teaching leans on from an earlier lesson, whether one of the plan's, the previous lesson or prior teaching the brief names, gets a short reminder where it first appears today (`Lord Shaftesbury, who we met last week, ...`), never a reteach."),
    ("because the script only says the board (`preferences.md` → `Write the slides as if the teacher never opens the notes`).",
     "because the script says the board and never teaches what the board lacks (`preferences.md` → `Write the slides as if the teacher never opens the notes`)."),
])

# Section 4: the list's remaining noise, and a name only in a title.
PACKET = "scripts/design-review-packet.py"
patch(PACKET, [
    ('''    "September", "October", "November", "December", "English", "Year", "Turn",
}''',
     '''    "September", "October", "November", "December", "English", "Year", "Turn",
    "Someone", "I'd", "I'm", "I've", "I'll",
}'''),
    ('''    "Looking", "Exploring", "Meeting", "Helping",
}''',
     '''    "Looking", "Exploring", "Meeting", "Helping", "Prove",
}'''),
    ('''    known: set[str] = set()
    for _where, _title, board in reading:
        for text in board:
            for name in board_names_in(text):
                known.update(re.sub(r"['’]s$", "", word) for word in name.split() if word not in CONNECTORS)
''',
     '''    # A title written with every word capitalised says nothing, so only a
    # sentence-case title adds to what is known.
    def capitalised_throughout(piece: str) -> bool:
        words = [word for word in piece.split() if word[:1].isalpha()]
        return len(words) > 1 and all(word[:1].isupper() for word in words)

    known: set[str] = set()
    for _where, title, board in reading:
        for text in [piece for piece in title if not capitalised_throughout(piece)] + board:
            for name in board_names_in(text):
                known.update(re.sub(r"['’]s$", "", word) for word in name.split() if word not in CONNECTORS)
'''),
    ('''        names = board_names_in(piece, known)
        words = [word for word in piece.split() if word[:1].isalpha()]
        if len(words) > 1 and all(word[:1].isupper() for word in words):''',
     '''        names = board_names_in(piece, known)
        if capitalised_throughout(piece):'''),
])
