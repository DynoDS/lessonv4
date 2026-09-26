"""The routes release, step 1: the stories that leave the route files, the
activity list and the modelling file are copied to the build log first, before
any runtime text moves (change plan section 4, "Stories leaving in this
release", and section 10). Some incidents are already in the log in other
words; every sentence that leaves is kept here word for word, in one "Stories
kept here" block. The entry starts with only its heading and its stories;
`rt_10_log_entry.py` writes the rest above them. The heading carries no version
number: the lead numbers the release at merge."""
from _patch import CONTENT, DB, LOG, MF, SKILL, append, assert_present, read

assert "(4.2.293)" in read(LOG)
HEADING = ("## 2026-09-26 - The teacher's way of explaining is written once for every kind of lesson, a class sees "
           "a good explanation before it writes one in every route, four corners is gone, and the routes' "
           "out-of-date lines are put right")
assert HEADING not in read(LOG)

# Copied, not moved: each sentence is still in its file until the scripts after
# this one take it out. One more dated story sits in a paragraph this release
# moves (three science boards, 22 September 2026, RT-E48). No decision names it,
# it is already in this log, and it stays in the route; the entry says so.
LEFT = [
    (SKILL, "A Year 4 nearest-1,000 design put `3,462` and `3,500` in one My Turn with a representation "
            "configuration saying two questions on the same interval use one line, and the teacher who met that "
            "shape in class said the rubbing out was the slowest part of the lesson (19 September 2026)."),
    (SKILL, "A Year 4 rounding deck bundled two roundings into one sentence on all three of its My Turn beats, while "
            "the Our Turn beats in the same lesson listed theirs on their own lines (the user, 12 September 2026)."),
    (SKILL, "A Year 4 rounding deck printed three spoken prompts on one Our Turn slide, and the teacher wanted the "
            "label, the question, the criteria and the number line and nothing else (the user, 12 September 2026)."),
    (CONTENT, "A teeth slide that printed the same fact as its headline, in a card and as its star line gave a child "
              "one sentence three times and nothing to look at, and the validator refuses it."),
    (CONTENT, "What the field is not is the landed sentence again in other words: a teeth slide carried `Incisors "
              "cut; canines help tear.` as its headline, a card saying `Their thin biting edges meet to cut through "
              "food` and a star line `Incisors cut food and canines help tear food.`, one sentence three ways."),
    (CONTENT, "Both Week 4 lessons (22 September 2026) did exactly this on every Teach beat: `He wasn't a king who "
              "could order everybody to obey him`, `It wasn't the ten-hour law`, `People sometimes call the whole "
              "front of their body their tummy, but the stomach is this one organ` and `'Small' is doing a rather "
              "misleading job in that name` were each said and never shown."),
    (CONTENT, "A deck whose every correction opens `That doesn't mean` has found one sentence and reused it, which "
              "is the same-shape fault above at the level of slides; the teacher met it on four of five boards of "
              "one lesson on 22 September 2026, and ruled: \"we want variety, and sometimes it's not relevant just "
              "stating the misconception\"."),
    (CONTENT, "A Year 4 science slide showed a tooth cross-section, labelled `Enamel`, headed `Inside a tooth`, and "
              "landed `Enamel forms a hard protective covering over the top of a tooth.` A teacher reading that aloud "
              "can tell the class where the enamel is and nothing else: not that it is the hardest substance in the "
              "body, not that it takes the force every time they bite, not that it cannot grow back. The children "
              "learn a label rather than a layer. All three Teach beats in that lesson wrote `null`, as did every "
              "Teach in the science deck built beside it, because this field's default had been written the wrong "
              "way round. Then a Year 4 history slide (14 September 2026) carried a photograph, `A Tudor farm "
              "household`, `England, 1485 to 1603` and one fact, with the route in the notes, and the user met it "
              "cold: \"the scene hasn't been set; there's nothing on the slide to guide me to know what to say.\""),
    (CONTENT, "A paragraph here is the board explaining what it is showing, which is how a Year 4 science launch came "
              "to spend four tenths of its slide on prose about two cards."),
    (DB, "A Year 4 history beat on 17 September 2026 gave every child a printed record to complete, a source to "
         "quote from and a partner to share it with, and wrote no words to the children at all. The card sort "
         "beside it was fully prepared: what the cards were, one set between two, at tables, once both accounts had "
         "been read. The difference was not the teaching. A sort has a field for its handling and a written task "
         "does not, so preparation was being decided by which beat happened to have a schema slot."),
    (MF, "The blank alone used to count as enough wherever the teacher could draw live, and a cover teacher given a "
         "Year 4 rounding deck of blank number lines had nothing finished to show the class (17 September 2026)."),
    (MF, "Left completely bare, the helper is a surface waiting for someone who already knows the lesson: a Year 4 "
         "nearest-1,000 model put `Find the two multiples of 1,000 either side of 3,462` above a line with nothing "
         "on it, and a teacher meeting it cold has to invent the demonstration (19 September 2026)."),
]
for rel, sentence in LEFT:
    assert_present(rel, sentence)
S = [sentence for _rel, sentence in LEFT]

STORIES = (
    "- **Stories kept here as they leave the runtime.** The route files, the activity list and the modelling file "
    "told these incidents; some are already in this log in other words, and each sentence is kept here as it "
    "stood. The skill route, on planning a figure for each example completed live: \"" + S[0] + "\" His words there, "
    "\"the rubbing out was the slowest part\", were not in this log before. On writing each case as its own question: "
    "\"" + S[1] + "\" On an Our Turn slide, whose ruling stays in the route without its date: \"" + S[2] + "\" The "
    "content route, on landing a sentence once: \"" + S[3] + "\" and, on what the `explanation` field is not: \""
    + S[4] + "\" On the route staying in the script: \"" + S[5] + "\" The four script lines stay in the route as "
    "plain examples of that tell. On a refusal that reuses one sentence, whose ruling stays in the route without its "
    "date: \"" + S[6] + "\" On the first-day teacher test, whose Tudor words stay in the route without their date and "
    "whose reason (a label rather than a layer) stays as a clause: \"" + S[7] + "\" On the launch's difference line, "
    "told under the explanation-tasks pointer: \"" + S[8] + "\" The activity list, on setting a task, whose reason "
    "stays: \"" + S[9] + "\" The modelling file, on a live helper's finished slide: \"" + S[10] + "\" and on a helper "
    "that shows its unknowns, whose reason stays: \"" + S[11] + "\"\n"
)

append(LOG, "\n" + HEADING + "\n\n" + STORIES)
print("STORIES_FIRST_OK")
