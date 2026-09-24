"""Success criteria (4.2.288), the third check's findings 4 and 7.

4. "The one exception" to a second wall card was narrower than the wall's own
   build message, focused repair and scope checker, which since 14 September let
   any list too tall for its card go in order over two cards of one title. The
   card contracts now say what those three already do; for success criteria it
   is the way to make room, since their words never change. No new permission:
   the split already existed in three places.
7. The wall's cell message offered two cards for a cell too long for its
   column, which splitting rows cannot cure; and the slide build's comment said
   "the repair is always the words", which is not so for a criteria panel.
"""
from pathlib import Path

ROOT = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4")


def patch(rel: str, pairs) -> None:
    path = ROOT / rel
    raw = path.read_bytes().decode("utf-8")
    crlf = "\r\n" in raw
    t = raw.replace("\r\n", "\n")
    for old, new in pairs:
        assert t.count(old) == 1, (rel, t.count(old), old[:100])
        t = t.replace(old, new)
    if crlf:
        t = t.replace("\n", "\r\n")
    path.write_bytes(t.encode("utf-8"))
    print("patched", rel)


patch("references/working-wall-card-contracts.md", [
    ("; the one exception is a success-criteria list or table too long for one card, carried in order over two cards of the same title, which is one job split for room.",
     "; the exception is a list or table too long for one card, carried in order over two cards of the same title, which is one job split for room (the build and the focused repair already offer it, and for success criteria it is how the card makes room, since their words never change)."),
])

patch("working-wall-html/src/layout.js", [
    ("Cut it to ${budget} characters or fewer, unless the table is the lesson's success criteria, which are copied word for word (the card makes room instead, or the table goes over two cards): \"",
     "Cut it to ${budget} characters or fewer, unless the table is the lesson's success criteria, which are copied word for word (the card makes room instead): \""),
])

patch("builder/build.js", [
    ("  // because the repair is always the words, and a Teach slide whose cards all\n",
     "  // because the repair is the words (except in a criteria panel, whose words\n"
     "  // stay and which 18pt already suits), and a Teach slide whose cards all\n"),
])
