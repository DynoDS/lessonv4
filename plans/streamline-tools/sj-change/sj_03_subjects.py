"""The subject-files release (topic 8, release 1), step 3: the six subject
files, the lesson designer's reading line and the picture rules every lesson
reads. Each change is one of his answers or a settled item, named beside it.
Moves before rewording; his calibrating examples keep every word bar a date.

Not here, on purpose: the history file's sensitive-decoration lines (SJ-F28),
which topic 7's 7B carries; the maths file's other dated story (SJ-D15, the
class that could not find the tens either side of 346, 17 September 2026),
which no decision or settled item names; and the maths file's three positions
(settled item 9: they stay as written)."""
from _patch import (GEOGRAPHY, HISTORY, LD, MATHS, PREF, PSHE, RE, SCIENCE, append, assert_absent,
                    assert_present, read, replace_once)

# --- Settled item 12: one copy of the start note (SJ-E01, G01, A04). History's
# and geography's notes are word for word the same bar the subject; the
# designer's own reading line gains what they carry (read before the structure
# is chosen because the routing is part of that choice; come back beside the
# teaching-sequence file; what each of the two files is for). Maths, science,
# RE and PSHE keep their own notes, which carry their own extras.
START_NOTE = (
    "Read this at the start of the run when the lesson is {subject}, before the structure is chosen, "
    "because the routing below is part of that choice. Come back to it alongside the teaching-sequence "
    "file once the structure is set. The structure file tells you what shape the lesson takes; this one "
    "tells you what the thinking inside it should be.\n\n"
)
replace_once(HISTORY, "# Subject Discipline: History\n\n" + START_NOTE.format(subject="History"),
             "# Subject Discipline: History\n\n")
replace_once(GEOGRAPHY, "# Subject Discipline: Geography\n\n" + START_NOTE.format(subject="Geography"),
             "# Subject Discipline: Geography\n\n")
replace_once(
    LD,
    "- Read the one matching `subject-*.md` file when it exists, whole, with `--file` and every page. "
    "List the directory and match the subject. Do not guess a filename.\n",
    "- Read the one matching `subject-*.md` file when it exists, whole, with `--file` and every page, "
    "before the structure is chosen: in history and geography its routing is part of that choice. "
    "List the directory and match the subject. Do not guess a filename. Come back to it alongside the "
    "teaching-sequence file once the structure is set: the structure file tells you what shape the lesson "
    "takes, and the subject file what the thinking inside it should be.\n",
)

# --- Settled item 12, second half: PSHE's "the label does not determine the
# route" (SJ-J03) goes; the designer's Structure Decision says it for every
# subject (SJ-A09: "The subject file does not select a route by label alone").
assert_present(LD, "The subject file does not select a route by label alone")
replace_once(
    PSHE,
    "- Use **Task-Centred** when one sustained real-life task is the main learning experience and evidence.\n"
    "\n"
    "The PSHE label does not determine the route.\n"
    "\n",
    "- Use **Task-Centred** when one sustained real-life task is the main learning experience and evidence.\n"
    "\n",
)

# --- Decision 4 (his 3): "History doesnt always need sources right? It often
# leads to it anyway, but does it have to be a strict rule?" The top line
# gains "When the lesson uses sources"; its second sentence, the sketch and the
# sketch's lead-in are unchanged, and "a history lesson does not need a source
# in it" (SJ-E66) now stands without a pull.
replace_once(
    HISTORY,
    "Teach historical knowledge through the evidence: a concrete aspect of life,",
    "When the lesson uses sources, teach historical knowledge through the evidence: a concrete aspect of life,",
)

# --- Settled item 10: the dates beside his examples go and every word of the
# examples stays. The sketch loses only "(4 September 2026)" from the sentence
# that introduces it; the Tudor boards lose "on 14 September 2026"; the
# rounding ruling and the Classroom Secrets standard lose theirs. Every date is
# in the log already (checked by sj_01).
replace_once(
    HISTORY,
    "is the user's own sketch of a Victorian schooling lesson (4 September 2026), kept here as the calibration:",
    "is the user's own sketch of a Victorian schooling lesson, kept here as the calibration:",
)
replace_once(
    HISTORY,
    "The Teach boards of the Tudor lesson the user chose on 14 September 2026 (",
    "The Teach boards of the Tudor lesson the user chose (",
)
replace_once(
    MATHS,
    "(the teacher, 19 September 2026, after the nearest-100 lesson modelled 34 first).",
    "(the teacher, after the nearest-100 lesson modelled 34 first).",
)
replace_once(
    MATHS,
    "the way a maths question should read (16 September 2026). Their questions",
    "the way a maths question should read. Their questions",
)

# --- SJ-E27, the standing story rule: the dated identity of the Tudor deck
# goes (the log holds it, with his words); the telling stays word for word as a
# plain, undated example with his words, "in eighteen slides" included, because
# it is what makes the rule clear (the first check's finding 6).
replace_once(
    HISTORY,
    "A Year 4 deck on why Tudor children worked (14 September 2026) told its invented cases in the present "
    "tense, named \"Tudor\" once or twice in eighteen slides,",
    "A deck that told its invented cases in the present tense, named \"Tudor\" once or twice in eighteen slides,",
)

# --- Settled item 7: out-of-date text.
replace_once(HISTORY, "The geographical-sounding part is the second half:", "The historical part is the second half:")
replace_once(
    HISTORY,
    "(both engines draw a `timeline` from the positions you set, and their own guidance is that a school "
    "timeline is almost never honestly to scale)",
    "(both engines draw a `timeline` from the positions you set, and their own guidance places each mark in "
    "proportion to its real date, and a line is never labelled not to scale)",
)
# The reviewer reads the finished design against the whole file, before any
# book exists (SJ-G45, the reviewer ledger's RV-T05).
replace_once(
    GEOGRAPHY,
    "The design-reviewer reads the book at the end of the lesson and asks whether it reads as the subject.",
    "The design reviewer reads the finished design against this file and asks whether it reads as the subject.",
)

# --- Decision 6 (his 4): "those balanced diet things sound like things I
# wouldnt want in the pshe subject files", "extra rul4es yes, maybe the subject
# file could say to look for guidance from eatwell guide thing" and "yes and
# yes": PSHE's four food rules become one line pointing to the NHS Eatwell
# Guide, and science gets the same heading and line at its end.
EATWELL = ("A lesson about food, diet or healthy eating follows the NHS Eatwell Guide for what a balanced diet "
           "is and how it is shown.")
pshe = read(PSHE).replace("\r\n", "\n")
head = "## Food and diet\n\n"
# The section is the file's last, and the file ends without a newline.
assert pshe.count(head) == 1 and not pshe.endswith("\n")
tail = pshe[pshe.index(head) + len(head):]
assert tail.startswith("Diet lessons recur in every primary year") and tail.endswith("not run as a theme.")
assert tail.count("\n\n") == 4 and "\n#" not in tail, tail.count("\n\n")
replace_once(PSHE, head + tail, head + EATWELL)
assert "## Food and diet" not in read(SCIENCE)
append(SCIENCE, "\n## Food and diet\n\n" + EATWELL + "\n")

# --- The prophet line (his answer to the change plan's question 1, "Okay,
# so yeah, let's not have any pictures of him."), and his answer of 25
# September to the first check's question (the ledger, "The prophet line's
# reach"): every lesson gets "no pictures of the Prophet Muhammad", in the
# picture rules every lesson's designer reads (`preferences.md` -> Lesson
# Designer visual-need boundary, beside the limits that win over the referent
# test), and RE keeps its fuller rule, "or of any prophet", beside its own
# exception that a nativity or a Bible illustration is ordinary; his words, "yes
# to prohet muhammad not being pictured". RE's copy stays in its own words with
# a pointer, because its reviewer and adaptation designer read the RE file and
# not that section (the first check's finding 1).
replace_once(
    RE,
    "Islam does not depict Muhammad, and no lesson may request a picture of him or of any prophet; teach "
    "through the mosque, the Qur'an, calligraphy, the practice or the community instead.",
    "Islam does not depict Muhammad, and no lesson may request a picture of him or of any prophet (every lesson's "
    "rule, no picture of the Prophet Muhammad, is in `preferences.md` → Lesson Designer visual-need boundary); "
    "teach through the mosque, the Qur'an, calligraphy, the practice or the community instead.",
)
LIMITS = ("and text is the right teaching object when the text is what children are studying.\n"
          "\n"
          "**Foundation subject Teach and task-framing slides earn meaningful visual support.**")
replace_once(
    PREF,
    LIMITS,
    "and text is the right teaching object when the text is what children are studying.\n"
    "\n"
    "**Islam does not depict the Prophet Muhammad, and no lesson may request a picture of him.**\n"
    "\n"
    "**Foundation subject Teach and task-framing slides earn meaningful visual support.**",
)

for rel, phrase in (
    (HISTORY, "Read this at the start of the run when the lesson is History"),
    (GEOGRAPHY, "Read this at the start of the run when the lesson is Geography"),
    (PSHE, "The PSHE label does not determine the route."),
    (HISTORY, "(4 September 2026)"),
    (HISTORY, "14 September 2026"),
    (MATHS, "19 September 2026"),
    (MATHS, "(16 September 2026)"),
    (HISTORY, "geographical-sounding"),
    (HISTORY, "almost never honestly to scale"),
    (GEOGRAPHY, "reads the book"),
    (PSHE, "Diet lessons recur"),
    (HISTORY, "A Year 4 deck on why Tudor children worked"),
):
    assert_absent(rel, phrase)
# The adaptation designer writes its own photograph requests and does not read
# that preferences section (the second check's finding 1), so the every-lesson
# sentence goes where it decides them, pointing at its home.
ADAPT = "agents/adaptation-designer.md"
replace_once(
    ADAPT,
    "There is no fixed picture maximum, but visual-heavy content creates serious fitting risk.\n",
    "There is no fixed picture maximum, but visual-heavy content creates serious fitting risk. Islam does not "
    "depict the Prophet Muhammad, and no lesson may request a picture of him (`preferences.md` → Lesson Designer "
    "visual-need boundary).\n",
)
assert_present(RE, "Islam does not depict Muhammad, and no lesson may request a picture of him or of any prophet")
assert_present(PREF, "**Islam does not depict the Prophet Muhammad, and no lesson may request a picture of him.**")
assert_absent(PREF, "or of any prophet")
print("the subject files, the designer's reading line and the picture rules are changed")
