"""Assumed knowledge (4.2.287), decision 8: the review page's list of names,
and the reviewer's every-review read of the rule for ordinary words."""
from pathlib import Path

PACKET = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\scripts\design-review-packet.py")
t = PACKET.read_text(encoding="utf-8")


def swap(old: str, new: str) -> None:
    global t
    assert t.count(old) == 1, (t.count(old), old[:100])
    t = t.replace(old, new)


# The reviewer reads the vocabulary rule for ordinary words on every review.
swap(
    '''    (
        "Vocabulary",
        "Read when vocabulary selection, definition, quantity or placement "
        "is in doubt.",
    ),
''',
    "",
)
swap(
    '''    (
        "teacher-voice.md",
        "17. Final pre-flight check",''',
    '''    # Its trigger was "when vocabulary selection, definition, quantity or
    # placement is in doubt", which the rule that catches an ordinary word a
    # sentence leans on (`government`, `order`) could never trip: the names
    # list does not show those words, and a reviewer who knows them does not
    # see the gap. The teacher's decision of 23 September 2026 made it an
    # every-review read.
    (
        "preferences.md",
        "Vocabulary",
        "Read every review, for `A word the teaching leans on is taught`: the "
        "names list cannot see an ordinary word a sentence leans on, and this "
        "is the rule that catches it. The rest of the section is for when "
        "vocabulary selection, definition, quantity or placement is in doubt.",
    ),
    (
        "teacher-voice.md",
        "17. Final pre-flight check",''',
)

# `My Turn`, `Our Turn` and `Your Turn` are slide titles children already know.
swap(
    '''    "September", "October", "November", "December", "English", "Year",
}''',
    '''    "September", "October", "November", "December", "English", "Year", "Turn",
}''',
)

swap(
    '''def board_names_in(text: str) -> list[str]:
    """Capitalised runs that are names, not sentence openings.

    A sentence's first word is capitalised for being first, so it is dropped
    and the rest of its run is kept (`Every Tudor child` gives `Tudor`).
    """''',
    '''def board_names_in(text: str, known: frozenset[str] | set[str] = frozenset()) -> list[str]:
    """Capitalised runs that are names, not sentence openings.

    A sentence's first word is capitalised for being first, so it is dropped
    and the rest of its run is kept (`Every Tudor child` gives `Tudor`). A
    one-word opening is kept when `known` holds it, meaning the lesson has the
    same word capitalised somewhere nothing else made it so: `Answer:
    Shaftesbury` beside `Lord Shaftesbury`.
    """''',
)
swap(
    '''                if first in SENTENCE_OPENERS or (len(words) == 1 and not acronym):
                    words = words[1:]''',
    '''                if first in SENTENCE_OPENERS or (len(words) == 1 and not acronym and first not in known):
                    words = words[1:]''',
)

swap(
    '''def build_board_names(design: dict) -> list[str]:
    """Every name the class reads on the board, where it first appears, and
    whether anything earlier in the lesson said it.

    Written for the curse the reviewer cannot see from inside: an adult reads
    `Order from Elizabeth I's government` and knows who and what, and a Year 4
    class on 22 September 2026 knew neither, nor the Thames, nor English
    Heritage, and nothing on the board said. A list of the names turns "read
    it as a child" into something a reader who is not a child can do.
    """
    criteria = {row["id"]: row for row in design.get("successCriteria") or []}
    sticky = {row["id"]: row["text"] for row in design.get("stickyKnowledge") or []}
    said_before = ""
    first_seen: dict[str, tuple[str, bool]] = {}
    labels: list[tuple[str, str]] = []
    for unit in lesson_units(design):
        strings = class_view_unit(unit, criteria=criteria, sticky=sticky)
        board = [text for text in strings if not text.startswith("Teacher says:")]
        for text in board:
            for name in board_names_in(text):
                if name not in first_seen:
                    first_seen[name] = (unit["label"], name in said_before)
            for label in SOURCE_LABEL.findall(text):
                labels.append((unit["label"], label))
        said_before += " " + " ".join(strings)
    lines = [
        "## Names on the board",
        "",
        (
            "Every name of a person, place, organisation or thing the class reads "
            "on the board, with the beat where it first appears. A child of this "
            "year group knows none of them unless this lesson, or an earlier lesson "
            "the brief names, taught it. For each, find where the class is told who "
            "or what it is in words they can hold; a name nothing explains is a "
            "finding, repaired by a clause where it first appears or by taking it "
            "off the board."
        ),
        "",
    ]
    if not first_seen:
        lines.append("- None.")
    for name, (label, earlier) in first_seen.items():
        note = "said earlier in the lesson" if earlier else "not said earlier in the lesson"
        lines.append(f"- {name}: first on the board in `{label}`; {note}.")''',
    '''def _said_on_the_board(name: str, board_text: str) -> bool:
    """Whether the board has already shown the name as a whole word, so that
    `Victoria` is not counted as said because `Victorian` was."""
    return re.search(rf"(?<![A-Za-z]){re.escape(name)}(?![A-Za-z])", board_text) is not None


def board_reading(design: dict) -> list[tuple[str, list[str], list[str]]]:
    """What the class reads, in the order they meet it, as (where, title,
    board strings): each unit's title (its `label` is the slide title) and
    board, then the vocabulary cards introduced after it. The teacher's script
    is left out: it is how the teacher says the board, and the class cannot
    read it."""
    criteria = {row["id"]: row for row in design.get("successCriteria") or []}
    sticky = {row["id"]: row["text"] for row in design.get("stickyKnowledge") or []}
    cards: dict[str, list[str]] = {}
    for anchor, group, _script in vocabulary_introductions(design):
        cards.setdefault(anchor, []).extend(f"{row['term']}: {row['definition']}" for row in group)
    reading: list[tuple[str, list[str], list[str]]] = []
    for unit in lesson_units(design):
        strings = class_view_unit(unit, criteria=criteria, sticky=sticky)
        title = [piece for piece in re.split(r"\\s+[-–]\\s+", unit.get("label") or "") if piece.strip()]
        reading.append((unit["label"], title, [text for text in strings if not text.startswith("Teacher says:")]))
        placed = cards.pop(unit.get("sourceUnitId") or "", [])
        if placed:
            reading.append((f"vocabulary cards after {unit['label']}", [], placed))
    for leftover in cards.values():
        reading.append(("vocabulary cards (unplaced)", [], leftover))
    return reading


def build_board_names(design: dict) -> list[str]:
    """Every name the class reads on the board, where it first appears, and
    whether the board said it earlier.

    Written for the curse the reviewer cannot see from inside: an adult reads
    `Order from Elizabeth I's government` and knows who and what, and a Year 4
    class on 22 September 2026 knew neither, nor the Thames, nor English
    Heritage, and nothing on the board said. A list of the names turns "read
    it as a child" into something a reader who is not a child can do. It reads
    the slide titles and vocabulary cards as well as the board, because a name
    there is read too, and it counts only the board as having said a name
    earlier, because the teacher decided on 23 September 2026 that the notes
    are how to say the board and never teach what the board lacks.
    """
    reading = board_reading(design)
    # A word capitalised where nothing made it so, anywhere in the lesson, is a
    # name wherever it appears, including at the start of a sentence.
    known: set[str] = set()
    for _where, title, board in reading:
        for text in title + board:
            for name in board_names_in(text):
                known.update(re.sub(r"['’]s$", "", word) for word in name.split() if word not in CONNECTORS)
    said_before = ""
    first_seen: dict[str, tuple[str, bool]] = {}
    labels: list[tuple[str, str]] = []
    for where, title, board in reading:
        for text in title + board:
            for name in board_names_in(text, known):
                if name not in first_seen:
                    first_seen[name] = (where, _said_on_the_board(name, said_before))
        for text in board:
            for label in SOURCE_LABEL.findall(text):
                labels.append((where, label))
        said_before += " " + " ".join(title + board)
    lines = [
        "## Names on the board",
        "",
        (
            "Every name of a person, place, organisation or thing the class reads "
            "on the board, in a slide title or on a vocabulary card, with the beat "
            "where it first appears and whether the board said it earlier. A child "
            "of this year group knows none of them unless this lesson taught it, "
            "and a name an earlier lesson taught still gets a short reminder where "
            "it first appears today. For each, find where the board tells the class "
            "who or what it is in words they can hold; a name nothing explains is a "
            "finding, repaired by a clause in the sentence that brings it in or by "
            "taking it off the board. Ordinary words a sentence leans on "
            "(`government`, `order`, `steam engine`) are not listed: read for them "
            "by `preferences.md` → Vocabulary, `A word the teaching leans on is "
            "taught`."
        ),
        "",
    ]
    if not first_seen:
        lines.append("- None.")
    for name, (label, earlier) in first_seen.items():
        note = "said earlier on the board" if earlier else "not said earlier on the board"
        lines.append(f"- {name}: first on the board in `{label}`; {note}.")''',
)
PACKET.write_text(t, encoding="utf-8")
print("packet ok")
