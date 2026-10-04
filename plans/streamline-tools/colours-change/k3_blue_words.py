"""The colours release, step 3: blue reaches the child's short task, in the words.

The visual profile's Semantic colour is the one home (the change plan's homes
table: "Colour (7C) | teacher-slide-visual-profile.md > Semantic colour |
preferences.md presentation rules keep his words and point"). Preferences' three
blue paragraphs (PF-R02 to R04) fold into it: R02 was already there sentence for
sentence, R03's peer limits join the profile's peer line with the one condition
it lacked ("answer status"), and R04's stale "may use house blue" goes, its
second sentence joining the action-verb line. Preferences keeps his words and a
pointer that names every part the profile owns. The profile says how a short
task is marked (`task-blue`, the designer's judgement: the job, or advice on how
to go about it?), that the header's small cue stays black, and its two copies of
the old reason ("blue belongs to questions", in the profile and the playbook)
follow. The playbook and the template catalogue's colour lines follow. Two
out-of-date profile lines the plan gives this release (J13, and the final
pass's colour check) are corrected.

His later answer (25 September 2026, "y"): a job that names what to use is still
the job, and blue (`Explain your answer using the photograph.`); a line that only
says how to go about it stays black. The examples both ways are real saved
lines, and the line he answered no longer stands as a black example anywhere.
"""
from _patch import PLAYBOOK, PREF, PROFILE, TMPL, assert_absent, assert_present, replace_once

# ── the profile, Semantic colour ─────────────────────────────────────────────
replace_once(PROFILE,
    "- **House blue is the colour of a question to children, and of nothing else on the slide.** "
    "When the board asks the class something they answer - `Which fan needed electricity?`, "
    "`How did children use these two classrooms?` - those words are blue, and a child scanning a "
    "busy board finds their question at once. Blue also organises",
    "- **House blue is the colour of the child's job: a question they answer, or a short task.** "
    "When the board asks the class something they answer - `Which fan needed electricity?`, "
    "`How did children use these two classrooms?` - those words are blue, and a child scanning a "
    "busy board finds their question at once. A short task is the same job said as an instruction, "
    "the thing the child does - `Explain your answer.`, `Write one reason.`, `Explain why.`, `Round 346 "
    "to the nearest 10.` - and it is blue too, as a whole line, marked `colorRole: \"task-blue\"`. "
    "A job that also names what to use is still the job, and blue: `Explain your answer using the "
    "photograph.` and `Describe each tooth using the pictures.` (the teacher's answer, 25 September "
    "2026). Blue also organises")

replace_once(PROFILE,
    "reminder body text, and the instructions children act on. `Explain your answer using the "
    "photograph.`, `Point to the details that support your comparison.` and `Choose the same part of "
    "classroom life in both photographs.` are all black. An instruction that follows a blue question "
    "is already read as part of that question's job, and painting it blue too spends the very "
    "contrast that was lifting the question - a whole board arriving blue tells a child nothing "
    "(flagged by the user, 3 September 2026). Whether a child could act on it now makes no difference "
    "here: a task is black either way, because it is a task and not a question.",
    "reminder body text, and a longer instruction about how to go about the task. `Use the shaded "
    "map.`, `Use the number line to help you.` and `Look at the shaded areas and the Equator.` are all "
    "black: each only tells a child how to go about the job, and sets no job of its own. "
    "The limit is what keeps blue meaning something: advice follows the job the blue has already "
    "named, and painting it blue too spends the very contrast that was lifting the question and the "
    "task - a whole board arriving blue tells a child nothing. Which a line is, the job or advice on "
    "how to do it, is your judgement, and no count of words decides it: the test is the line's main "
    "ask. `Round 346 to the nearest 10.` is the job; `Explain your answer using the photograph.` asks "
    "for the job and names what to use, so it is the job too; `Use the two photographs.` only says "
    "what to use, so it is advice. The check reads the role, not the words: it refuses any other "
    "blue line that asks nothing (`BLUE_WITHOUT_A_QUESTION`), and a `task-blue` line the spec shows "
    "is not a short task, one carrying the reveal mark `||`, a sticky fact, the lesson's answer, a "
    "statement or task before its question, or two sentences that are not questions "
    "(`TASK_BLUE_NOT_A_SHORT_TASK`). The role never makes a slide's turn by itself.")

replace_once(PROFILE,
    "- The treatment is deck-wide: every child-facing question outside the starter carries it, not a "
    "favoured few. The carrying fields are `color` or `focus-blue` for a whole line and `[[ ]]` for a "
    "span inside a line.",
    "- The treatment is deck-wide: every child-facing question and short task outside the starter "
    "carries it, not a favoured few. The carrying fields are `color` or `focus-blue` for a whole line "
    "and `[[ ]]` for a span inside a line; a short task carries `task-blue`, the only way a line that "
    "asks nothing may be blue.")

replace_once(PROFILE,
    "**The order does not matter.** A block that ASKS and then instructs splits at the same boundary "
    "the other way round: the question goes blue, the instruction that follows it stays black. `Is "
    "Isla correct?` is blue and `Explain your answer.` is black beneath it. Only the "
    "telling-then-asking order was written down, so an Apply slide holding `Is she correct? Explain "
    "your answer.` as one line printed the whole thing black, and the teacher coloured the question "
    "by hand (19 September 2026): \"even if I put paragraph breaks between them, they're still all "
    "black text. So I thought, why not make the question blue?\"",
    "**The order does not matter.** A block that ASKS and then instructs splits at the same boundary "
    "the other way round: the question goes blue, and what follows it takes its own colour, blue for "
    "the child's short task and black for advice on how to go about it. `Is Isla correct?` is blue "
    "and `Explain your answer.` beneath it is blue too, because it is the job (one `task-blue` line "
    "may hold both); `Use the two photographs.` beneath a question stays black. The teacher coloured "
    "such a question by hand when an Apply slide "
    "printed it black: \"even if I put paragraph breaks between them, they're still all black text. "
    "So I thought, why not make the question blue?\"")

replace_once(PROFILE,
    "The pattern separates equal-status prompts; it must never imply correctness, sequence, "
    "difficulty or category meaning.",
    "The pattern separates equal-status prompts; it must never imply correctness, answer status, "
    "sequence, difficulty or category meaning, so a sequence whose order matters and categories "
    "whose colours already carry meaning never take it.")

replace_once(PROFILE,
    "It and `core-action` render bold in the line's own colour, so an instruction stays black however "
    "many verbs it exposes; a Year 4 PSHE deck once had `Choose`, `Draw`, `Label` and `add arrows` "
    "all in question blue, one task sentence in four alternating chunks, and the question on the same "
    "slide had nothing left to lift it (8 September 2026). Several `task-action` spans may appear in "
    "one instruction. Do not mark every verb in ordinary prose.",
    "It and `core-action` render bold in the line's own colour, so a verb is never blue on its own: a "
    "short task is blue as a whole line, and an instruction about how to go about it stays black "
    "however many verbs it exposes. A task sentence with `Choose`, `Draw`, `Label` and `add arrows` "
    "each in question blue reads as four alternating chunks, and leaves the question on the same "
    "slide nothing to lift it. Several `task-action` spans may appear in one instruction. Do not mark "
    "every verb in ordinary prose. Use size, position and spacing before colour when prominence alone "
    "is the job.")

replace_once(PROFILE,
    "The profile calibrates how numbering is *seen*, not which lessons get numbered work. Numbering "
    "follows the Question Labelling rules in `preferences.md`. A lone (1) on the circuit calibration "
    "was not identified as an intentional teacher correction. This calibration does not establish "
    "that a single main-independent question should lose its normal numbering. Continue to follow "
    "Question Labelling in `preferences.md` unless later calibration explicitly changes that rule. "
    "This profile adds no numbering rule of its own: where a template",
    "The profile calibrates how numbering is *seen*, not which lessons get numbered work: numbering "
    "follows the Question Labelling rules in `preferences.md`, and this profile adds no numbering "
    "rule of its own. Where a template")

replace_once(PROFILE,
    "- check focal-question colour, task-action emphasis, peer colour and safety/problem colour "
    "against their semantic roles;",
    "- check the colour of questions and short tasks, task-action emphasis, peer colour and "
    "safety/problem colour against their semantic roles;")

# ── the profile's other two places that give blue's reason, and the header cue ─
replace_once(PROFILE,
    "it renders bold in the line's own colour, never blue, because blue belongs to questions "
    "(Semantic colour below).",
    "it renders bold in the line's own colour, never blue on its own, because blue belongs to the "
    "child's job as a whole line, a question or a short task (Semantic colour below).")

replace_once(PROFILE,
    "The body must still state the task once. Do not duplicate the same source-authored task in both "
    "the header and the body.",
    "The body must still state the task once. Do not duplicate the same source-authored task in both "
    "the header and the body.\n"
    "\n"
    "The cue is drawn black. It tells a child how to go about the task, and advice stays black; the "
    "job it helps with is in the body, in blue.")

for gone in ("and of nothing else on the slide", "a task is black either way",
             "the instructions children act on", "(flagged by the user, 3 September 2026)",
             "A lone (1) on the circuit calibration", "because blue belongs to questions"):
    assert_absent(PROFILE, gone)

# ── preferences: his words, and a pointer that names every part ─────────────
replace_once(PREF,
    "**Blue asks; everything else tells.** House blue is for a question children answer, and for "
    "slide titles, short category names, option labels and other small navigational labels. "
    "Everything else on the slide is black - ordinary teacher explanation, statements, takeaways, "
    "success-criteria body text, reminder body text, and the instructions children act on. A block "
    "that first tells and then asks splits at that boundary: the telling stays black, the question "
    "goes blue on its own line, and a block that asks and then instructs splits the same way round "
    "the other way, question blue, instruction black. Starter questions are the exception and stay "
    "black, alternating black, blue, black, blue when there are several of them. The full grammar "
    "lives in `teacher-slide-visual-profile.md` → Semantic colour, which owns this rule.\n"
    "\n"
    "A compact set of two or more equal-status peer prompts may alternate house blue and house "
    "purple when the colour only helps children keep the prompts visually separate. Start with blue "
    "and alternate blue, purple, blue, purple. Do not use this peer pattern for a sequence whose "
    "order matters, categories whose colours already carry meaning, or any set where colour could "
    "imply correctness, difficulty or answer status.\n"
    "\n"
    "Existing task-action verbs may use house blue when that treatment reveals the phases of a "
    "multi-step pupil task. Use size, position and spacing before colour when prominence alone is "
    "the job.\n",
    "**Blue asks or sets a short task, and a worked example is purple.** In the teacher's words: \"I "
    "want blue means question or like a short task as in like explain why or something like that. "
    "And yeah, green is vocabulary or an answer.\" So a question or a short task, the child's job, is "
    "blue (`Explain your answer.`, `Write one reason.`), and a longer instruction about how to go "
    "about it stays black (`Use the shaded map.`). A job that names what to use is still the job, and "
    "blue: asked whether `Explain your answer using the photograph.` is blue, he said \"y\" (25 "
    "September 2026). "
    "A worked example is purple, the same colour as a sticky fact: \"worked example purple too\". "
    "`teacher-slide-visual-profile.md` → Semantic colour owns the whole grammar, and the slide "
    "designer reads it in full: blue's other jobs (titles and short labels), how a short task is "
    "marked, the starter's questions, which stay black or alternate, the split at the boundary "
    "between telling and asking, the peer colours and their limits, action verbs, how a worked "
    "example is marked, supplied orange, the one orange line, red, and what the check refuses.\n")

for gone in ("Blue asks; everything else tells", "may use house blue",
             "the instructions children act on"):
    assert_absent(PREF, gone)
assert_present(PREF, "**Green has a fixed teaching role.**")

# ── the playbook's colour lines ──────────────────────────────────────────────
replace_once(PLAYBOOK,
    "The core grammar is asking versus telling: a question children answer carries house blue; "
    "everything else the board says stays black, including the instructions children act on;",
    "The core grammar is asking versus telling: a question children answer, or a short task (the "
    "child's job, `task-blue`), carries house blue; everything else the board says stays black, "
    "including an instruction about how to go about the task;")

replace_once(PLAYBOOK,
    "Every child-facing question outside the starter carries the blue;",
    "Every child-facing question and short task outside the starter carries the blue;")

replace_once(PLAYBOOK,
    "Both action roles render bold in the line's own colour, so exposing a verb never turns an "
    "instruction blue; blue stays the question's.",
    "Both action roles render bold in the line's own colour, so exposing a verb never turns an "
    "instruction blue; blue stays with the child's job as a whole line, the question or the short "
    "task.")

# ── the template catalogue's colour lines ────────────────────────────────────
replace_once(TMPL,
    "- `focus-blue` - a question children answer, in house blue; an instruction they act on stays "
    "black (the asking-versus-telling grammar in `teacher-slide-visual-profile.md` → Semantic colour);\n",
    "- `focus-blue` - a question children answer, in house blue; an instruction stays black unless it "
    "is the child's short task, which takes `task-blue` (the asking-versus-telling grammar in "
    "`teacher-slide-visual-profile.md` → Semantic colour);\n"
    "- `task-blue` - a short task, the child's job itself (`Explain your answer.`, `Write one "
    "reason.`, `Round 346 to the nearest 10.`), in house blue, alone or after its question on the "
    "same line, and a job that also names what to use (`Explain your answer using the "
    "photograph.`); advice that only says how to go about the task (`Use the shaded map.`, `Use the "
    "two photographs.`) never takes it, nor does a statement, an answer or a sticky fact, and one "
    "line holds one task;\n")

replace_once(TMPL,
    "- `core-action` - bold, in the line's own colour, for the survival phrase (house blue stays the "
    "colour of a question and of nothing else);",
    "- `core-action` - bold, in the line's own colour, for the survival phrase (a verb is never blue "
    "on its own: the whole line is blue only when it is a question or a short task);")

replace_once(TMPL,
    "to tint the text when the text has a deck role such as the blue question/instruction or orange "
    "supplied material.",
    "to tint the text when the text has a deck role such as the blue question or orange supplied "
    "material.")

replace_once(TMPL,
    "The blue is asking-versus-telling (the playbook's Colour section): every child-facing question "
    "and instruction carries it, explanation and statements stay black,",
    "The blue is asking-versus-telling (the playbook's Colour section): every child-facing question "
    "carries it, and a short task carries it through `colorRole: \"task-blue\"`, never a hex, so the "
    "check can see it is one; an instruction about how to go about the task, explanation and "
    "statements stay black,")

assert_absent(TMPL, "house blue stays the colour of a question and of nothing else")

# ── two lines outside Semantic colour that name the blue (the second check) ──
# The speech-bubble rule's leftover task line is a short task, so it names the
# role that makes it blue: without it, the check refuses the line as blue that
# asks nothing. The profile's paragraph rhythm gives the short task its blue
# beside the question's.
SPEECH = "references/slide-speech-and-characters.md"
replace_once(SPEECH,
    "a separate task line in question blue outside the bubble.",
    "a separate task line outside the bubble, in question blue as the child's short task "
    "(`colorRole: \"task-blue\"`).")

replace_once(PROFILE,
    "A statement followed by the question or instruction it sets up splits there, and a question takes "
    "its blue per Semantic colour",
    "A statement followed by the question or instruction it sets up splits there, and a question or a "
    "short task takes its blue per Semantic colour")

print("blue words done")
