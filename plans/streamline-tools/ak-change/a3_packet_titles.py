"""Assumed knowledge (4.2.287), decision 8: titles read without noise.

Read across every saved design's titles, the new list found real names and
five false ones: `Help Zara`, `Remembering Roman`, `Closely` (`Look Closely`),
`It` (`Use It`) and the fill placeholder. An opening verb joins the openers,
and a title written with every word capitalised counts only a word the board
itself capitalises, because in such a title a capital carries no signal.
"""
from pathlib import Path

PACKET = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\scripts\design-review-packet.py")
t = PACKET.read_text(encoding="utf-8")


def swap(old: str, new: str) -> None:
    global t
    assert t.count(old) == 1, (t.count(old), old[:100])
    t = t.replace(old, new)


swap(
    '''    "Only", "Sometimes", "Order", "Locate", "Everyone", "Something", "Pass",
}''',
    '''    "Only", "Sometimes", "Order", "Locate", "Everyone", "Something", "Pass",
    "Help", "Ask", "Meet", "Visit", "Remembering", "Comparing", "Using", "Finding",
    "Looking", "Exploring", "Meeting", "Helping",
}''',
)
swap(
    '''    reading = board_reading(design)
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
                    first_seen[name] = (where, _said_on_the_board(name, said_before))''',
    '''    reading = board_reading(design)
    # A word the board capitalises where nothing made it so is a name wherever
    # it appears, including at the start of a sentence or a title.
    known: set[str] = set()
    for _where, _title, board in reading:
        for text in board:
            for name in board_names_in(text):
                known.update(re.sub(r"['’]s$", "", word) for word in name.split() if word not in CONNECTORS)

    def title_names(piece: str) -> list[str]:
        names = board_names_in(piece, known)
        words = [word for word in piece.split() if word[:1].isalpha()]
        if len(words) > 1 and all(word[:1].isupper() for word in words):
            # `Look Closely`: every word has a capital, so none of them says name.
            names = [name for name in names
                     if all(re.sub(r"['’]s$", "", word) in known or word in CONNECTORS for word in name.split())]
        return names

    said_before = ""
    first_seen: dict[str, tuple[str, bool]] = {}
    labels: list[tuple[str, str]] = []
    for where, title, board in reading:
        found = [name for piece in title for name in title_names(piece)]
        found += [name for text in board for name in board_names_in(text, known)]
        for name in found:
            if name not in first_seen:
                first_seen[name] = (where, _said_on_the_board(name, said_before))''',
)
PACKET.write_text(t, encoding="utf-8")
print("titles ok")
