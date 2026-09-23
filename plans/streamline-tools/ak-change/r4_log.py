"""Assumed knowledge (4.2.287): the log entry follows the repairs and the
change check's honesty findings (its section 7)."""
from pathlib import Path

LOG = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\references\build-review-log.md")
t = LOG.read_text(encoding="utf-8")


def swap(old: str, new: str) -> None:
    global t
    assert t.count(old) == 1, old[:100]
    t = t.replace(old, new)


swap("was written in full once and in shorter forms seven more times,",
     "was written in full once and in shorter forms ten more times,")
swap("A plan's earlier lessons are rough context, taken as taught, and anything today leans on from one of them gets a short reminder where it first appears (`Lord Shaftesbury, who we met last week, ...`), never a reteach;",
     "A plan's earlier lessons are rough context, taken as taught, and anything today leans on from an earlier lesson (the plan's, the previous lesson, or prior teaching the brief names) gets a short reminder where it first appears (`Lord Shaftesbury, who we met last week, ...`), never a reteach;")
swap("A name, or a thing the class has never met, arrives with its context in the sentence that brings it in, in every subject, and the repair is in the wording, not a vocabulary card (his words:",
     "A name, or a thing the lesson meets on the way that the class has never met, arrives with its context in the sentence that brings it in, in every subject, and for these the repair is in the wording, not a vocabulary card, while an ordinary word the teaching leans on keeps the vocabulary rule's three repairs, a card among them (his words:")
swap("`preferences.md` → What a Lesson Is For holds `Work from what children can use at that point` with every extra its copies carried (a freshness repair, each case seen worked, a new reasoning demand and maths's fuller form, an invented wage, trick wording and avoidable reading, what the task and its answer may claim, the same conclusion earned case by case, a Practise brought forward) and the beat-by-beat check for every subject,",
     "`preferences.md` → What a Lesson Is For holds `Work from what children can use at that point` with the extras its copies carried (a freshness repair, each case that changes a method's procedure seen worked, a new reasoning demand and maths's fuller form, an invented wage, trick wording and avoidable reading), a paragraph beside it with the rest (`The work claims no more than the evidence, and keeps its support`: what the task and its answer may claim, the same conclusion earned case by case, no support stripped, a Practise brought forward), and the beat-by-beat check for every subject,")
swap("Across every saved design it found twenty more real names (`Tudor` at a sentence start, `Parliament` on a card, children's names in titles) and lost none; `Source` and `Factory` on their own are the noise it adds.",
     "Across all 90 saved designs it adds 37 entries and loses only four the old list got wrong (`I'm`, `I'll`, `I've`, `Someone I`). Most of the new ones are real (children's names in titles, `Earth` and the tropics on cards, `Romans`, `Tudor England`, `London`); the noise is `Source` (four times), `Sources`, `Factory` (twice), `Ragged`, and a card's `Personal, Social, Health and Economic` split into three. A title with every word capitalised lists only a word the board capitalises too, so `Tudor Children At Work` shows nothing the board does not. \"Said earlier\" changed for 33 names, 30 of them to \"not said\", because the script or a part-word had counted.")
swap("The reviewer reads `preferences.md` → Vocabulary on every review, for the rule on an ordinary word a sentence leans on (`government`, `order`), which no list can see.",
     "The reviewer reads `preferences.md` → Vocabulary on every review, on the packet route and the compatibility route alike, for the rule on an ordinary word a sentence leans on (`government`, `order`), which no list can see.")

anchor = "- **Stories kept here.** A Year 4 lesson on Victorian working conditions (16 September 2026)"
assert t.count(anchor) == 1
check = (
    "- **The second reader, on the change.** A fresh agent compared every changed row with its old words, checked the 255 unchanged rows still stand, ran the names list over all 90 saved designs and made 76 attempts to break the pins; every deletion, softening or move of the changed text, and every exact retired wording, was caught, and nothing was lost outright. It found: the reviewer and the name paragraph said \"not a card\" for every word, where the teacher's words were about names and things met on the way and the vocabulary rule gives an ordinary word a card as its third repair (now scoped); the reminder reached only a plan's lessons (now any earlier lesson); the reviewer's compatibility route did not read Vocabulary (now it does); the reviewer's pointer did not name the two limits, and three extras sit in a paragraph beside the home that it did not name (now both); the home's \"seen worked\" had lost the skill route's condition (a case that changes the procedure, now carried); the designer's \"because\" said more than decision 1 (now \"the script says the board and never teaches what the board lacks\"); and the test for part-words could not fail, the names note's reminder clause and the reviewer's widened trigger were held by nothing, and \"spoken preparation\" and \"unless an earlier lesson the brief names\" were barred only at full length. All are now repaired, tested or pinned. What no pin catches is left to review: a new paragraph saying the opposite in new words.\n"
)
swap(anchor, check + "\n**Not done yet, and named.** Behaviour is untried on a real run. Decision 2's correction (without the school calendar, the previous lesson handed to the designer is the last one built, not the slot before) is to be noted in the before-and-after reruns. Four lines that read against decision 1 belong to later topics and are noted, not changed: the voice guide's list of what notes may hold (\"additional explanation\"), the content boundaries' \"a slide can carry more when the teacher's voice does the heavy lifting\" and \"the longer description belongs in speaker notes\", the script voice's \"concrete explanations of anything unfamiliar\", and a caption's \"technical name\".\n\n" + anchor)
LOG.write_text(t, encoding="utf-8")
print("log ok")
