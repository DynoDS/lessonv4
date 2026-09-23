"""Assumed knowledge (4.2.287): the log entry follows the second check's
figures (its finding 7) and the teacher's fifth round on pictures."""
from pathlib import Path

LOG = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\references\build-review-log.md")
t = LOG.read_text(encoding="utf-8")


def swap(old: str, new: str) -> None:
    global t
    assert t.count(old) == 1, old[:100]
    t = t.replace(old, new)


swap(
    "Where a source came from is said once, in the class's words, only when it matters, and `reconstruction`, `modern summary` and an organisation's name stay off the board unless taught. A picture is just shown: an artist's drawing of how something might have looked, or a photograph of a place today, carries no words about where it came from, on the board or in the notes (asked again when the caption rule and a Teach slide's script disagreed, he said: \"We're over complicating it. I don't think there should be any words. Just show the picture. The teacher can say it if they need to.\"), and a caption that names the picture may help and is never required (\"maybe it's a painting from Van Gogh and it says Starry Night by Van Gogh. That could be helpful... But it doesn't always have to be.\").",
    "Where a source came from is said only when it matters, in the class's words, and `reconstruction`, `modern summary` and an organisation's name stay off the board unless taught. A picture is just shown: an artist's drawing of how something might have looked, or a photograph of a place today, has no caption about how it was made, and the notes need not say it (asked again when the caption rule and a Teach slide's script disagreed, he said: \"We're over complicating it. I don't think there should be any words. Just show the picture. The teacher can say it if they need to.\"); that holds even when the lesson asks what the picture tells us (\"Well, they do, but the board doesn't need to say it. And the teacher can say it.\"); and a caption that names the picture may help and is never required (\"maybe it's a painting from Van Gogh and it says Starry Night by Van Gogh. That could be helpful... But it doesn't always have to be.\"). His Tudor example slides, which the slide designer opens first, lost `, reconstructed` from their captions and the second caption on a returning picture, and a test now holds them to both.",
)
swap(
    "Across all 90 saved designs it adds 37 entries and loses only four the old list got wrong (`I'm`, `I'll`, `I've`, `Someone I`).",
    "Across all 90 saved designs it adds 34 entries and loses six, all of them wrong entries the old list printed (`I'm` three times, `I'll`, `I've`, `Someone I`).",
)
swap(
    "Eight rows of the earlier topics' pins whose words this change altered (and two whose whole-paragraph pin on the contents list moved) record the decision that changed them.",
    "Nine rows of the earlier topics' pins whose words this change altered (the ninth is the reviewer's compatibility-route reading list), and two whose whole-paragraph pin on the contents list moved, record the decision that changed them.",
)
swap(
    "The instruction files are about 7.9 KB larger and the review page's code about 4.7 KB.",
    "The instruction files are about 8.7 KB larger and the review page's code about 4.8 KB.",
)
swap(
    "It also found the caption rule giving a Teach slide two answers once \"or in the script\" had gone; that went to the teacher, whose answer is above.",
    "It also found the caption rule giving a Teach slide two answers once \"or in the script\" had gone; that went to the teacher, whose answer is above.\n"
    "- **The third reader, on the repairs.** A second fresh agent confirmed all nine of the first check's fixes, found every one of the seven attempts the first check could not catch now caught, and ran 44 more. It found the picture ruling reaching too far in the notes (now \"the notes need not say it\", his words), too far for a real picture that is a source (an 1897 photograph keeps the honesty rule), and differently in three files; his Tudor example slides still captioned `reconstructed`; `order` and `steam engine` sitting on both sides of the names line (now \"a vocabulary card alone does not do it\", which also lets a word worth having keep its card); the retired picture wordings barred only in their own file (now everywhere); a test that could not fail; and four stale figures here. Its question about his last sentence went to him, and his answer is above.",
)
LOG.write_text(t, encoding="utf-8")
print("log ok")
