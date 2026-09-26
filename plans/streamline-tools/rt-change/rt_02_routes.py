"""The routes release, step 2: his decisions 1, 5 and 8, the settled items 6, 7a,
7c, 7d, 7f (the two unwritten rules), 7g and 7i, and the stories copied to the
log by `rt_01` (change plan section 4). Words only; the explaining heading,
the launch and the code are the next scripts' own.

Every replacement asserts its old text once. His words are in the routes
ledger's "Decisions taken"."""
from _patch import CONTENT, DB, DIAL, ES, ET, LD, LDC, MF, SKILL, TASK, assert_absent, assert_present, replace_once

# --- Decision 1 (his "y"): moving about. Four corners comes out of the
# discussion route; moving is allowed without his asking only when the
# movement is itself what is being learned.
replace_once(DIAL, "a ranking, a sort, a four-corners vote", "a ranking, a sort, a vote with a written reason")
replace_once(
    DIAL,
    "- Four corners (children physically position themselves on agree / strongly agree / disagree / strongly disagree and defend)\n",
    "- A line on paper from agree to disagree, or a vote with a written reason (`do-beats.md` 6.2 and 6.4)\n",
)
replace_once(
    DB,
    "Choose a whole-class movement beat only when the teacher asks for it.",
    "Choose a whole-class movement beat only when the teacher asks for it, or when the movement is itself what is "
    "being learned (standing and making a quarter turn to learn what a quarter turn is).",
)

# --- Decision 5 (his "y"): the plan gets its own beat only when it produces
# something children need before they start.
replace_once(
    TASK,
    "Planning and doing may continue as one flowing task unless separating the plan materially improves the work or "
    "protects one of those important conditions.",
    "Planning and doing continue as one flowing task, with any check for safety or wasted materials inside it as the "
    "teacher's check; the plan gets its own beat only when it produces something children need before they start (a "
    "fair-test plan, a labelled design).",
)

# --- Decision 8 (his "y"): the Look for note names the one link most children
# skip, inside the 25 words; the other gaps go in the teacher's note.
replace_once(
    ET,
    "Put those questions in `speakerNotes.lookFor` on the task beat, naming the links most likely to be skipped and "
    "the question to ask at each: `Look for: the acid named as something the germs make - if a child jumps from sugar "
    "to the hole, ask what the germs did with the sugar.` That is diagnostic in a way that asking for length is not.",
    "Put the one link most children skip, and the question to ask at it, in `speakerNotes.lookFor` on the task beat, "
    "inside its 25 words: `Look for: the acid named as something the germs make: if a child jumps from sugar to the "
    "hole, ask what the germs did with the sugar.` The other likely gaps and their questions go in the same beat's "
    "`speakerNotes.teacherInfo`, beside the likely mistakes. That is diagnostic in a way that asking for length is "
    "not.",
)

# --- Settled item 6: a big-task lesson's enabling input, one idea at a time.
replace_once(LDC, "after one short enabling input", "after a short enabling input, one idea at a time")

# --- Settled item 7a: a live-completed My Turn's finished helper follows on
# the next slide.
replace_once(
    SKILL,
    "When a Live-complete helper is selected, leave its active part for live completion; for My Turn, do not create a "
    "following answer slide.",
    "When a Live-complete helper is selected, leave its active part for live completion; the finished helper follows "
    "on the next slide as the unit's answer (`modelling-formats.md` → Live-complete helper).",
)

# --- Settled item 7c: the activity list's opening and contents say what is
# there, and three entries name the entries that replaced the old ones.
replace_once(
    DB,
    "Each entry follows the same shape — what it is, register, best for, why it works, SEND access notes, source — so "
    "the agent can compare on like-for-like fields.",
    "Each entry says what it is and what it is best for, and gives its access notes (`SEND access`, or `Demands and "
    "supports`); some also carry `The limit`, a `Register` and `Mechanism`, or the `Teacher-owned response routine` "
    "they need, and two are marked `Not used`, so the agent can compare on like-for-like fields.",
)
replace_once(
    DB,
    "- **§1 Recall** — eight retrieval formats (brain dump, choral response, retrieval roulette).",
    "- **§1 Recall** — seven retrieval formats (free recall, choral response, retrieval roulette).",
)
replace_once(
    DB,
    "- **§2 Talk** — eight oral-rehearsal formats (turn and talk, think-pair-share, convince your partner).",
    "- **§2 Talk** — seven oral-rehearsal formats (partner discussion, think-pair-share, convince your partner).",
)
replace_once(
    DB,
    "- **§3 Write** — eight committed-record formats, including the hinge and diagnostic questions.",
    "- **§3 Write** — seven committed-record formats, including the hinge and diagnostic questions.",
)
replace_once(DB, "Lower stakes than Brain Dump.", "Lower stakes than Free Recall (1.1).")
replace_once(DB, "embedded into Turn-and-Talk over a term.", "embedded into partner discussion (2.1) over a term.")
replace_once(DB, "bridge from Turn-and-Talk to extended writing.", "bridge from partner discussion (2.1) to extended writing.")
replace_once(
    DB,
    "scaffold with a partner first (Turn and Talk) if pupils freeze on application.",
    "scaffold with a partner first (partner discussion, 2.1) if pupils freeze on application.",
)

# --- Settled item 7d: the one Synthesise is the discussion route's own beat;
# the stems and push-back questions are the conditional tools.
replace_once(
    ES,
    "but sentence stems, push-back questions and synthesis are conditional teaching tools, not compulsory scripts or "
    "classroom-management routines.",
    "but sentence stems and push-back questions are conditional teaching tools, not compulsory scripts or "
    "classroom-management routines, and the one Synthesise after the last discussion is the route's own beat.",
)

# --- Settled item 7f: the two rules the check holds and nothing stated,
# written where the designer reads them, unchanged.
replace_once(
    SKILL,
    "it is not a My Turn, because nothing is being modelled.\n\n**Every cycle ends with its own Your Turn",
    "it is not a My Turn, because nothing is being modelled.\n\nRun each concept's cycles together, in the order "
    "`concepts` lists them.\n\n**Every cycle ends with its own Your Turn",
)
replace_once(
    DIAL,
    "Use `sentenceStems: []` when the format does not need stems.\n",
    "Use `sentenceStems: []` when the format does not need stems.\n\nA Talk's `discussionQuestion` is its Stimulus's "
    "`question`, word for word.\n",
)

# --- Settled item 7g: slips.
for rel in (LD, "references/subject-maths.md"):
    # The maths file carries the same pointer (SJ-D81), found by grepping for it.
    replace_once(
        rel,
        "(`teaching-sequence-skill-based.md` → Teaching Sequence Specification, `A step the method needs`)",
        "(`teaching-sequence-skill-based.md` → Cycles, and the beats around them, `A step the method needs`)",
    )
SOURCES = ("**Sources.** Robin Alexander, *A Dialogic Teaching Companion* (2020); Neil Mercer, *Words and Minds* (2000) "
           "and the *exploratory talk* tradition; EEF, *Dialogic Teaching* evaluation report (2017); Ofsted PSHE / "
           "Citizenship subject reviews.")
replace_once(
    ES,
    "Use Discovery when the phenomenon must be investigated before its explanation is secured.\n\n" + SOURCES + "\n",
    "Use Discovery when the phenomenon must be investigated before its explanation is secured.\n",
)
replace_once(
    ES,
    "not what they can recite.\n\n### Task-Centred",
    "not what they can recite.\n\n" + SOURCES + "\n\n### Task-Centred",
)
replace_once(ES, "(testing effect, Roediger & Karpyne)", "(testing effect, Roediger & Karpicke)")
replace_once(
    ES,
    "Purpose: a decision-support document for an AI agent designing lesson PowerPoints.",
    "Purpose: a decision-support document for an AI agent designing lessons.",
)
replace_once(SKILL, "This preserves the existing route's optional explanation", "This preserves the route's optional explanation")
replace_once(DB, "- McGill, R. M. (2011). *Pose Pause Pounce Bounce* — teachertoolkit.co.uk, attributed to Pam Fearnley.\n", "")
replace_once(DB, "Rally Robin, Round Robin, Think-Pair-Share, Quiz-Quiz-Trade.", "Rally Robin, Think-Pair-Share, Quiz-Quiz-Trade.")
replace_once(DB, "freeze frame, thought tracking, conscience alley, role on the wall.", "freeze frame, thought tracking, conscience alley.")

# --- Settled item 7i: the board carries the route; the script says it more
# fully.
replace_once(
    LD,
    "keep one takeaway as key line, full spoken in script.",
    "keep one takeaway as key line, with the route on the board in whole sentences and said more fully in the script.",
)

# --- The stories (copied to the log by rt_01). Reasons stay; his rulings keep
# his words without their dates; a case that makes a rule clear stays only as
# a plain example.
replace_once(
    SKILL,
    " A Year 4 nearest-1,000 design put `3,462` and `3,500` in one My Turn with a representation configuration saying "
    "two questions on the same interval use one line, and the teacher who met that shape in class said the rubbing "
    "out was the slowest part of the lesson (19 September 2026).",
    "",
)
replace_once(
    SKILL,
    " A Year 4 rounding deck bundled two roundings into one sentence on all three of its My Turn beats, while the Our "
    "Turn beats in the same lesson listed theirs on their own lines (the user, 12 September 2026).",
    "",
)
replace_once(
    SKILL,
    "the criteria and the number line and nothing else (the user, 12 September 2026).",
    "the criteria and the number line and nothing else.",
)
replace_once(
    CONTENT,
    " A teeth slide that printed the same fact as its headline, in a card and as its star line gave a child one "
    "sentence three times and nothing to look at, and the validator refuses it.",
    "",
)
replace_once(
    CONTENT,
    "Both Week 4 lessons (22 September 2026) did exactly this on every Teach beat: `He wasn't a king who could order "
    "everybody to obey him`, `It wasn't the ten-hour law`, `People sometimes call the whole front of their body their "
    "tummy, but the stomach is this one organ` and `'Small' is doing a rather misleading job in that name` were each "
    "said and never shown.",
    "Script lines such as `He wasn't a king who could order everybody to obey him`, `It wasn't the ten-hour law`, "
    "`People sometimes call the whole front of their body their tummy, but the stomach is this one organ` and "
    "`'Small' is doing a rather misleading job in that name`, said and never shown, are that tell.",
)
replace_once(
    CONTENT,
    "; the teacher met it on four of five boards of one lesson on 22 September 2026, and ruled: \"we want variety, "
    "and sometimes it's not relevant just stating the misconception\".",
    "; the teacher's ruling: \"we want variety, and sometimes it's not relevant just stating the misconception\".",
)
replace_once(
    CONTENT,
    "A Year 4 science slide showed a tooth cross-section, labelled `Enamel`, headed `Inside a tooth`, and landed "
    "`Enamel forms a hard protective covering over the top of a tooth.` A teacher reading that aloud can tell the "
    "class where the enamel is and nothing else: not that it is the hardest substance in the body, not that it takes "
    "the force every time they bite, not that it cannot grow back. The children learn a label rather than a layer. "
    "All three Teach beats in that lesson wrote `null`, as did every Teach in the science deck built beside it, "
    "because this field's default had been written the wrong way round. Then a Year 4 history slide (14 September "
    "2026) carried a photograph,",
    "A picture with a label and one fact lets a teacher reading the board aloud say where the thing is and nothing "
    "else, so the children learn a label rather than what it names. A Year 4 history slide carried a photograph,",
)
replace_once(
    CONTENT,
    "What the field is not is the landed sentence again in other words: a teeth slide carried `Incisors cut; canines "
    "help tear.` as its headline, a card saying `Their thin biting edges meet to cut through food` and a star line "
    "`Incisors cut food and canines help tear food.`, one sentence three ways. The validator refuses the near-copy it "
    "can measure (the headline and the star line); the card that restates the headline with one detail added is "
    "yours to refuse.",
    "What the field is not is the landed sentence again in other words. The validator refuses the near-copy it can "
    "measure (the headline and the star line); a card that restates the headline with one detail added is yours to "
    "refuse.",
)
replace_once(
    CONTENT,
    " A paragraph here is the board explaining what it is showing, which is how a Year 4 science launch came to spend "
    "four tenths of its slide on prose about two cards.",
    "",
)
replace_once(
    DB,
    "A Year 4 history beat on 17 September 2026 gave every child a printed record to complete, a source to quote from "
    "and a partner to share it with, and wrote no words to the children at all. The card sort beside it was fully "
    "prepared: what the cards were, one set between two, at tables, once both accounts had been read. The difference "
    "was not the teaching. A sort has a field for its handling and a written task does not, so preparation was being "
    "decided by which beat happened to have a schema slot.",
    "A sort has a field for its handling and a written task does not, so preparation can end up decided by which beat "
    "happens to have a schema slot.",
)
replace_once(
    MF,
    " The blank alone used to count as enough wherever the teacher could draw live, and a cover teacher given a Year 4 "
    "rounding deck of blank number lines had nothing finished to show the class (17 September 2026).",
    "",
)
replace_once(
    MF,
    "Left completely bare, the helper is a surface waiting for someone who already knows the lesson: a Year 4 "
    "nearest-1,000 model put `Find the two multiples of 1,000 either side of 3,462` above a line with nothing on it, "
    "and a teacher meeting it cold has to invent the demonstration (19 September 2026).",
    "Left completely bare, the helper is a surface waiting for someone who already knows the lesson, and a teacher "
    "meeting it cold has to invent the demonstration.",
)

# What must not be lost: his calibration examples and his rulings' words.
for rel, phrase in [
    (CONTENT, "`Look at her. She isn't being paid to do this.`"),
    (CONTENT, "`Lord Shaftesbury campaigned with others to protect children through laws.`"),
    (CONTENT, "\"the scene hasn't been set; there's nothing on the slide to guide me to know what to say.\""),
    (CONTENT, "\"we want variety, and sometimes it's not relevant just stating the misconception\""),
    (SKILL, "the teacher wanted the label, the question, the criteria and the number line and nothing else."),
    (DB, "(\"Hate stand if things. Never those!\", 14 September 2026)"),
]:
    assert_present(rel, phrase)
for rel, phrase in [(DIAL, "four-corners"), (DIAL, "Four corners"), (DB, "Brain Dump"), (DB, "Turn-and-Talk"),
                    (DB, "(Turn and Talk)"), (ES, "Karpyne"), (SKILL, "do not create a following answer slide")]:
    assert_absent(rel, phrase)
print("ROUTES_OK")
