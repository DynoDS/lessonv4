"""The voice guide release, step 3: the voice rules written outside the guide.

- Settled item 1: the lesson designer's read line points at the guide's own
  route instead of keeping a shorter copy of it. Its §6 pointer, with assumed
  knowledge's reason, and its §4 line stay word for word; its line sending the
  first script to §16H (Speaker Notes Voice) is untouched.
- Decision 2 (his 2, "yes"): Slide Philosophy's case-context paragraph says what
  "before the case" means when the thing is on the board. His own order in the
  guide's §6 is unchanged.
- Decision 4 (his 3, "yes"): the slide designer's three triggers for the speech
  guidance take that guidance's own list, word for word; the first keeps its
  pinned opening.
- Decision 11 (his 6): the lesson designer's invented group gets a name, not
  always a class code, with the examples his read-back used.
- Decision 12 (his 7, "yes"): the discussion notes say what is and is not
  scripted.
- Settled item 5: the two copies that said "never the reverse" and "not the
  other way round" come into line with the guide's "normally".
- Settled item 6: the plain repeat of "keep precise subject vocabulary" in the
  adaptation reference is cut, and the adaptation designer's copy points at
  Written Voice's Below paragraph, keeping both halves.
- Settled item 8, out of date: the notes hand-off names §16H; the lesson
  designer's "That section" names the section it means; the long dashes in
  examples a child could be given, in topic 8's files and in preferences, are
  replaced (7B has not been built, so preferences' three are this release's).
- His speaker-notes answer in the lesson designer's own notes line and the
  notes hand-off, and the voice list's decision 13 (the three other lines that
  fixed a nine-year-old reader): both were 7B's (its B1), brought here by the
  lead after the first check, in 7B's planned words and his."""
from _patch import (ADAPT, ADAPTIVE, DB, DIAL, ES, LD, PLAYBOOK, PREF, SD, SD_REPAIR, TASK, assert_absent,
                    assert_present, replace_once)

# Settled item 1.
replace_once(
    LD,
    "- Read `teacher-voice.md` at the same point: its core sections, then the numbered section for the kind of thing "
    "being written - §6 a question or an instruction a child acts on (including `Say what you mean, and give a second "
    "question that leads to the first`, because a question naming nothing concrete is answered only by the most "
    "confident children), §5 a vocabulary definition or explanation, §§1 and 3 a spoken script, §8 a model answer, "
    "§9 a worked example, §10 success criteria, §11 a misconception warning, §12 a comparison or critique prompt. "
    "Definitions and scripts are the two most often missed, because a definition feels like a structured field being "
    "filled and a script feels like notes rather than writing; both are words a child reads or hears, and both are "
    "where the register slips first. Read its calibrated examples (§16) only when wording remains uncertain. §4 is "
    "routed by moment",
    "- Read `teacher-voice.md` at the same point, by the route its `How to read this file` sets out: its core "
    "sections, then the numbered section for the kind of thing being written, at the moment you write it, among them "
    "§6 a question or an instruction a child acts on (including `Say what you mean, and give a second question that "
    "leads to the first`, because a question naming nothing concrete is answered only by the most confident "
    "children). §4 is routed by moment",
)

# Settled item 5.
replace_once(LD, "the slide keeps the tighter version, never the reverse)",
             "the slide keeps the tighter version, not normally the reverse)")
replace_once(PREF, "the speaker script carries the fuller conversational version - not the other way round.",
             "the speaker script carries the fuller conversational version - not normally the other way round.")

# Decision 11.
replace_once(
    LD,
    "Give it a plain ordinary name the first time it appears (`Class 4B`, `the Hill Road team`) and use that name "
    "every time the lesson speaks about it,",
    "Give it a name the first time it appears, and not always a class code like `Class 4B` (`Oak Class`, `the class "
    "at Hilltop School`, `the Hill Road team`), and use that name every time the lesson speaks about it,",
)

# Settled item 8: "That section" named.
replace_once(LD, "Open `teacher-voice.md` §5 with it. That section is the one place every vocabulary decision is "
                 "written:",
             "Open `teacher-voice.md` §5 with it. `preferences.md` → Vocabulary is the one place every vocabulary "
             "decision is written:")

# Decision 2.
replace_once(
    PREF,
    "teeth chip when we bite something too hard, and when that happens the covering comes off in one spot. The same "
    "applies to a scenario,",
    "teeth chip when we bite something too hard, and when that happens the covering comes off in one spot. Before "
    "the case means before the question about it: when the thing is on the board, the sentence about the thing in "
    "view comes first and the general one straight after. The same applies to a scenario,",
)

# Settled item 8: the hand-off names §16H.
replace_once(
    PREF,
    "The full voice and worked examples live in the Speaker Notes Voice section of the lesson-designer agent.",
    "The full voice and its short examples live in the Speaker Notes Voice section of the lesson-designer agent, "
    "and two full-length scripts in `teacher-voice.md` §16H.",
)

# Settled item 8: the long dashes in preferences' examples.
replace_once(PREF, "(\"true or false \u2014 felt blocks more sound than foil\")",
             "(\"true or false: felt blocks more sound than foil\")")
replace_once(PREF, "\"Look down your conductor column \u2014 what is the same about all of them?\"",
             "\"Look down your conductor column. What is the same about all of them?\"")
replace_once(PREF, "(\"Watch me \u2014 taking a reading\",", "(\"Watch me: taking a reading\",")

# Decision 4: the speech guidance's own list, word for word.
SPEECH_LIST = ("a speaking character, a voiced claim, a misconception, a disagreement, a prediction to judge, an "
               "advice-to-a-character move, or anyone who simply says what they think, gives their reason or asks a "
               "question")
replace_once(
    SD,
    "- `slide-speech-and-characters.md` when a unit contains a speaking character, voiced claim, misconception, "
    "disagreement or advice-to-a-character move.",
    "- `slide-speech-and-characters.md` when a unit contains " + SPEECH_LIST + ".",
)
replace_once(
    SD_REPAIR,
    "- a speaking character, voiced claim, misconception, disagreement or advice-to-a-character treatment: "
    "`slide-speech-and-characters.md`;",
    "- " + SPEECH_LIST + ": `slide-speech-and-characters.md`;",
)
replace_once(
    PLAYBOOK,
    "Whenever a source unit contains a speaking character, voiced claim, misconception, disagreement or "
    "advice-to-a-character move, read `slide-speech-and-characters.md` before composing it.",
    "Whenever a source unit contains " + SPEECH_LIST + ", read `slide-speech-and-characters.md` before composing it.",
)
assert_present(SD, "when a unit contains a speaking character")
assert_present("references/slide-speech-and-characters.md", SPEECH_LIST)

# Decision 12, and the dialogic route's dashed example.
replace_once(
    DIAL,
    "Do not turn the notes into a compulsory script or prescribe who to call on, how to bounce answers or another "
    "discussion-management routine.",
    "Do not turn the notes into a compulsory script or prescribe who to call on, how to bounce answers or another "
    "discussion-management routine. The discussion itself is not scripted; the words that open and frame it are.",
)
replace_once(DIAL, "(\"you're [character] \u2014 what would you say?\")", "(\"you're [character], what would you say?\")")

# Settled item 8: the other dashed examples in topic 8's files.
replace_once(DB, "Convince them \u2014 60 seconds each.", "Convince them - 60 seconds each.")
replace_once(DB, "*\"Which is the odd one out \u2014 and why?\"*", "*\"Which is the odd one out, and why?\"*")
replace_once(DB, "(*\"erosion \u2014 fingers wearing down a fist\"*)", "(*\"erosion: fingers wearing down a fist\"*)")
replace_once(DB, "*\"Give me an example \u2014 not from my slide \u2014 of an invertebrate.\"*",
             "*\"Give me an example (not from my slide) of an invertebrate.\"*")
replace_once(TASK, "\"your research \u2014 most of the lesson\"", "\"your research: most of the lesson\"")
# The quoted teacher's line is a teaching move to avoid; its dash is not part of
# what it rejects, so it goes too.
replace_once(ES, "(\"here are the seven kinds of influence \u2014 copy them down\")",
             "(\"here are the seven kinds of influence - copy them down\")")

# Settled item 6.
replace_once(
    ADAPT,
    "Keep essential subject vocabulary and proper nouns, supporting them with examples, visuals or plain-language "
    "bridges rather than automatically replacing them.",
    "On a separate Below resource, keep essential subject vocabulary and proper nouns as Written Voice's Below "
    "paragraph says: supported, not automatically replaced.",
)
replace_once(
    ADAPTIVE,
    " it is not the target in itself. One short sentence may be right, while two or more connected sentences may be "
    "clearer when they carry one manageable idea naturally. Keep necessary subject vocabulary and use accessible "
    "support around it. Do not turn",
    " it is not the target in itself. One short sentence may be right, while two or more connected sentences may be "
    "clearer when they carry one manageable idea naturally. Do not turn",
)
# His speaker-notes answer in the lesson designer's own line, and the voice
# list's decision 13 (a nine-year-old in four places), both planned for 7B
# (its B1) and brought here by the lead (26 September) so the guide and the
# designer no longer pull against each other; in 7B's planned words and his
# ("for the speaker notes it doesn't have to be short sentences"; the plugin is
# for years one to six). The adaptation line's named child (PF-N82) is fixed in
# the same edit, as 7B's plan has it.
replace_once(
    LD,
    "The voice: clear simple language a nine-year-old follows easily, short straightforward sentences, concrete "
    "explanations of anything unfamiliar, and a warm direct tone that speaks to the child in front of you.",
    "The voice: as long as the idea needs and conversational, in words the children in this class follow (the "
    "teacher: \"it doesn't have to be short sentences\"), with concrete explanations of anything unfamiliar and a warm "
    "direct tone that speaks to the child in front of you. Ask how you would say this so these children understand "
    "it.",
)
replace_once(
    PREF,
    "with sentence length and vocabulary chosen for the idea rather than a mechanical simplicity rule. Necessary",
    "with sentence length and vocabulary chosen for the idea rather than a mechanical simplicity rule (in the "
    "teacher's words, \"speaker notes are as long as the idea needs, of course, and they're also conversational\"). "
    "Necessary",
)
replace_once(PREF, "in one plain sentence a nine-year-old would follow.", "in one plain sentence a child in this class would "
                                                                        "follow.")
replace_once(PREF, "Test it by answering your own question as a nine-year-old who has not met the topic.",
             "Test it by answering your own question as a child in this class who has not met the topic.")
replace_once(ADAPT, "the deeper task is still met by a nine-year-old reading it alone.",
             "the deeper task is still met by a child in this class reading it alone.")
replace_once(ADAPT, "(`Is she right about all of it?`)", "(`Is Asha right about all of it?`)")
# Preferences' two other "nine-year-old" lines (How Much Fits, the vocabulary
# line) are not among the four his answer covers, and stay.
for rel in (LD, ADAPT):
    assert_absent(rel, "nine-year-old")
for gone in ("a nine-year-old would follow", "as a nine-year-old who has not met"):
    assert_absent(PREF, gone)
assert_absent(LD, "short straightforward sentences")

assert_present(ADAPTIVE, "Keep essential subject vocabulary and proper nouns when the learning requires them")
assert_present("references/preferences.md", "Keep central subject vocabulary and proper nouns, supporting them with "
                                            "examples, visuals or plain-language bridges rather than automatically "
                                            "replacing them.")

for rel, gone in ((LD, "never the reverse"), (PREF, "- not the other way round."), (LD, "That section is the one place"),
                  (LD, "Definitions and scripts are the two most often missed"), (LD, "`Class 4B`, `the Hill Road"),
                  (PREF, "The full voice and worked examples live")):
    assert_absent(rel, gone)
for rel in (PREF, DB, DIAL, TASK, ES):
    for dash in ("true or false \u2014", "conductor column \u2014", "Watch me \u2014", "Convince them \u2014", "odd one out \u2014",
                 "erosion \u2014", "example \u2014", "character] \u2014", "research \u2014", "influence \u2014"):
        assert_absent(rel, dash)
print("REACHES_OK")
