"""Assumed knowledge (4.2.287): the wording, decision by decision.

Every replacement asserts its old text appears exactly once. Moves come
first and keep their words; rewording is only where a decision asked for it.
"""
from pathlib import Path

ROOT = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4")


def patch(rel: str, pairs) -> None:
    path = ROOT / rel
    t = path.read_text(encoding="utf-8")
    for old, new in pairs:
        assert t.count(old) == 1, (rel, t.count(old), old[:100])
        t = t.replace(old, new)
    path.write_text(t, encoding="utf-8")
    print("patched", rel)


# ---------------------------------------------------------------- preferences
PREF = "references/preferences.md"

# Decision 1: the board and the notes are never one thing. The dated Sophie
# story is in the log (4.2.286); its case stays here as a plain example.
A13_OLD = (
    "**Write the slides as if the teacher never opens the notes.** The teacher chooses whether to use the speaker script, and the two are not read together, so anything a later check, Do beat or task expects a child to produce must have been visible on a slide before it, not only spoken. "
    "A Year 4 PSHE quick check asked what Sophie's body uses energy for when she is sitting still; the answer, breathing, lived only in the script of the slide before, whose visible lines said no more than the vocabulary card (8 September 2026). "
)
A13_NEW = (
    "**Write the slides as if the teacher never opens the notes.** The board and the notes are never one thing. The board holds the teaching, the activities, the helpers and the pictures to point to; the notes are the script for teaching that slide, a guide for a cover, tired or new teacher on how to say and present what is on the board in a conversational way. The teacher chooses whether to use them, and most of the time does not read them, so the board shows the teaching and nothing is taught by the board and the notes together: anything a later check, Do beat or task expects a child to produce must have been visible on a slide before it, not only spoken. "
    "A quick check that asks what a body uses energy for when it is sitting still is unprepared when the answer, breathing, was only ever said in the script of the slide before. "
)

# Decision 9: the one home takes every extra its copies carried.
WFU_OLD_1 = (
    "and whatever the task itself deliberately puts in front of them. Before committing a substantial task, attempt it from that material alone and find any connection you supplied without noticing."
)
WFU_NEW_1 = (
    "and whatever the task itself deliberately puts in front of them. Each distinct case a child meets alone is one they have seen worked, because a case modelled nowhere but met in independent practice is met cold (`teaching-sequence-skill-based.md` says where the extra case goes). Before committing a substantial task, attempt it from that material alone, and again after any repair that makes a case fresher, and find any connection you supplied without noticing."
)
WFU_OLD_2 = (
    "provided the lesson has prepared children to read it; this is not an instruction to tell them the answer before every investigation. **A new explanatory mechanism is not:** a task relying on a law, a guild rule, an economic arrangement or a scientific process the lesson never taught has smuggled it in as assumed knowledge, however much more like real history or science the task then looks."
)
WFU_NEW_2 = (
    "provided the lesson has prepared children to read it; this is not an instruction to tell them the answer before every investigation. New evidence read with the same taught reasoning is fair; a new reasoning demand needs preparation of its own, so a genuinely new decision, representation, reading demand or way of thinking gets its own enabling teaching, while a task merely labelled \"problem solving\" does not earn a second whole-class teaching act for the label. **A new explanatory mechanism is not:** a task relying on a law, a guild rule, an economic arrangement (an invented wage) or a scientific process the lesson never taught has smuggled it in as assumed knowledge, however much more like real history or science the task then looks, and often unverified as well."
)
WFU_OLD_3 = (
    "Deeper work usually comes from a comparison, a missing relationship, a changed condition, a fresh application or a closer use of evidence, not from more facts, longer answers or harder words.\n"
)
WFU_NEW_3 = (
    "Deeper work usually comes from a comparison, a missing relationship, a changed condition, a fresh application or a closer use of evidence, not from more facts, longer answers or harder words, and stronger reasoning never means untaught knowledge, trick wording or avoidable reading.\n"
    "\n"
    "**The work claims no more than the evidence, and keeps its support.** The final task, its model answer and its acceptance claim no more than the evidence children studied (`subject-history.md` has the case: a verdict about all children needs evidence about all children). Reaching the same conclusion in two cases is legitimate when children examine each case to earn it; do not make every answer different, or strip useful support to manufacture independence. And the order follows readiness, not the clock: a Practise brought forward because the lesson looks long, before the knowledge it runs on is taught, is a guessing task, and an early Practise followed by beats kept only because they were already written is a design fault too (`teaching-sequence-content-based.md`).\n"
    "\n"
    # Decision 6: history's beat-by-beat check, for every subject, with the
    # moves that ask first on purpose written into it.
    "**Knowledge before judgement, beat by beat.** Children cannot make a real judgement before they have been taught the context that makes it possible; asked anyway, they guess, and the lesson teaches them that guessing is what the thinking is. So this is a check on the design rather than advice, in every subject: every beat that asks children to infer, judge, evaluate or explain names where the knowledge it runs on was taught, earlier in this lesson or in a named earlier lesson (with its short reminder today, `lesson-designer.md` → Prior knowledge). A beat that cannot point at either is a guessing beat and needs the teaching putting in front of it. The exception is a beat that asks before teaching on purpose: a hook, a pattern children read, an exploration, a first attempt, an estimate, fresh evidence. It says so, stays short, and the teaching that gives it meaning follows straight after. The subject files keep their own examples (`subject-history.md` → Knowledge before judgement, inside the lesson).\n"
)

# Decisions 5 and 11: Source and Scenario Integrity takes the source test and
# the one rule on children's own experience.
SSI_OLD = (
    "For invented scenarios and real-world claims, keep quantities, actions, chronology and context coherent. Avoid unnecessarily forcing personal disclosure or assuming children share the same family circumstances, experiences or emotional safety. Personal reflection remains available when it is genuinely suitable. The lesson designer screens and frames the material; the design reviewer independently verifies the finished result.\n"
)
SSI_NEW = (
    "**A real source needs an accessible route before a child can think with it.** This holds for a source, story or clip in any subject: a genuine record may still be a poor teaching choice if its link to what the lesson studies needs substantial extra explanation. So list what a teacher who is new to the topic would have to explain before the source makes sense to this class (who wrote it, what kind of document it is, the words and customs in it, why it was written) beside what the source then teaches that the next step of the lesson uses. When the first list is the longer, choose a clearer source or tell the knowledge plainly. A source a supplied plan names is no exception (`lesson-designer.md` → Your Role as Decision-Maker), and `subject-history.md` → What the board and the page hold keeps history's example.\n"
    "\n"
    "For invented scenarios and real-world claims, keep quantities, actions, chronology and context coherent. **Children's own experience may be invited, never required.** A lesson may invite it (a starter, a comparison, a set the class builds from being a person), but no beat needs it to be completed. Do not assume children share the same family circumstances, experiences or emotional safety, and avoid unnecessarily forcing personal disclosure. The alternatives (school, friends, a made-up case, a private answer) are said in the words the class hears, not left in a note to the teacher. Personal reflection remains available when it is genuinely suitable. The lesson designer screens and frames the material; the design reviewer independently verifies the finished result.\n"
)

# Decision 10: the four shapes move to the voice guide whole; this keeps a
# one-line pointer that names them.
G06_OLD = (
    "**The harder half of that same test: a prompt written by someone who already knows the answer.** Missing context is the visible failure; this one is invisible, because the prompt reads perfectly to whoever wrote it and only breaks for the child meeting it cold. It wears four shapes. A question can name the property the answer turns on before the child has found it: \"what shape is the land where the forest has gone?\" is a clue to an adult who knows about the fishbone pattern, while a child looking at the same photograph sees size and damage and no shape at all. A second question can lean on the first already being solved, so \"the line down the middle of each shape\" cannot be read until \"each shape\" means something. A heading can name a bucket where a question would tell the child what to do: \"What this photo shows us\" labels a column, \"What does this photo show us?\" asks for the sentence, and a child who lost the thread of the explanation can still act on the second. And a sentence stem can be built from the mechanics of the task instead of the thing being learned, so \"I put ___ first because ___\" yields a sentence about ranking where \"I think ___ clears the most rainforest because ___\" yields a sentence about geography, which is the one worth having in a book. So read every prompt back with the answer covered up and ask whether a child could tell what *kind* of thing is being asked for; phrase as a question anything a child responds to; and build a stem out of the words of the question it answers. The limit is the prompt whose difficulty is the point — a \"what do you notice?\", an odd one out, a deliberate puzzle — where being briefly stuck is the work. Even there the child has to know what they are being asked *for*; they just should not find it easy.\n"
)
G06_NEW = (
    "**The harder half of that same test: a prompt written by someone who already knows the answer.** It reads perfectly to whoever wrote it and breaks for the child meeting it cold, in four shapes: a question that names the property the answer turns on, a second question that leans on the first being solved, a heading where a question is needed, and a stem built from the task instead of the learning. `teacher-voice.md` §6, `Say what you mean`, owns them with their examples and repairs.\n"
)

# Decision 4, with the teacher's second-round words on decision 8: a name or
# a thing arrives with its context, in the sentence that brings it in.
B04_ANCHOR = (
    "The same applies to a scenario, an invented person or a number problem's situation. The test: could a child say why they are being shown this, before they are asked the question about it?\n"
)
B04_NEW = B04_ANCHOR + (
    "\n"
    "**A name, or a thing the class has never met, arrives with its context in the sentence that brings it in.** A named person, place, organisation or event, in any subject, is explained where it first appears on the board, in a clause a child can hold (`Queen Elizabeth I, who ruled England in Tudor times`); so is a thing the class has never met (an order, a steam engine). The repair is in how the teaching is worded, not a vocabulary card. Rather than `Elizabeth I said this`, set the scene: `Elizabeth I was the Queen of England at that time. She was worried about ..., so she wrote something called an order. This is it.`, and then show the order. Rather than `one was powered by a steam engine`, `one was powered by a steam engine, which is a ...`. A name or a thing thrown on the board with nothing around it is one more thing a child cannot use, and a board with several is too much to take in. A name an earlier lesson taught gets a short reminder where it first appears today (`Lord Shaftesbury, who we met last week, ...`), never a reteach. The test is the one in `Orientation is not automatically a Teach chunk`: read any slide on its own and see what it is doing and why, or go back one or two slides and see why.\n"
)

patch(PREF, [
    (A13_OLD, A13_NEW),
    (WFU_OLD_1, WFU_NEW_1),
    (WFU_OLD_2, WFU_NEW_2),
    (WFU_OLD_3, WFU_NEW_3),
    (SSI_OLD, SSI_NEW),
    (G06_OLD, G06_NEW),
    (B04_ANCHOR, B04_NEW),
])

# ---------------------------------------------------------------- voice guide
TV = "references/teacher-voice.md"
G02_OLD = "The user, on a Year 4 history deck (14 September 2026): \"They seem like"
G02_NEW = "The user, on a Year 4 history deck: \"They seem like"
TV6_END = (
    "The limit: a quick recall question (`What is a source?`), a question already concrete enough to answer cold, and a prompt whose difficulty is the point (a `what do you notice?`, an odd one out) do not get a second question; adding one to every question is a habit children stop reading.\n"
)
TV6_NEW = TV6_END + (
    "\n"
    "**The harder half: a prompt written by someone who already knows the answer.** Missing context is the visible failure; this one is invisible, because the prompt reads perfectly to whoever wrote it and only breaks for the child meeting it cold. It wears four shapes. A question can name the property the answer turns on before the child has found it: \"what shape is the land where the forest has gone?\" is a clue to an adult who knows about the fishbone pattern, while a child looking at the same photograph sees size and damage and no shape at all. A second question can lean on the first already being solved, so \"the line down the middle of each shape\" cannot be read until \"each shape\" means something. A heading can name a bucket where a question would tell the child what to do: \"What this photo shows us\" labels a column, \"What does this photo show us?\" asks for the sentence, and a child who lost the thread of the explanation can still act on the second. And a sentence stem can be built from the mechanics of the task instead of the thing being learned, so \"I put ___ first because ___\" yields a sentence about ranking where \"I think ___ clears the most rainforest because ___\" yields a sentence about geography, which is the one worth having in a book. So read every prompt back with the answer covered up and ask whether a child could tell what *kind* of thing is being asked for; phrase as a question anything a child responds to; and build a stem out of the words of the question it answers. The limit is the prompt whose difficulty is the point (a \"what do you notice?\", an odd one out, a deliberate puzzle), where being briefly stuck is the work. Even there the child has to know what they are being asked *for*; they just should not find it easy.\n"
)
patch(TV, [(G02_OLD, G02_NEW), (TV6_END, TV6_NEW)])

# ---------------------------------------------------------------- the designer
LD = "agents/lesson-designer.md"
A05_OLD = "For a substantial explanation or judgement, work an answer using only the knowledge, sources, references and spoken preparation children receive."
A05_NEW = "For a substantial explanation or judgement, work an answer using only the knowledge, sources and references children have seen on the board or the page, because the script only says the board (`preferences.md` → `Write the slides as if the teacher never opens the notes`)."
F01_OLD = "- **Prior knowledge:** Use supplied prior teaching and neighbouring lessons. When prior teaching"
F01_NEW = (
    "- **Prior knowledge:** Use supplied prior teaching and neighbouring lessons. A plan's lessons before this one are rough context: take them as taught by the time this one is, and give anything today's teaching leans on from one of them a short reminder where it first appears today (`Lord Shaftesbury, who we met last week, ...`), never a reteach. A method step the class has already done at this size stays named and left alone (the step trace in `Write the lesson, then the contract`). When prior teaching"
)
D04_OLD = "whenever it would cost the class more explaining than it teaches (`subject-history.md` → `A real source needs an accessible route`)."
D04_NEW = "whenever it would cost the class more explaining than it teaches (`preferences.md` → Source and Scenario Integrity, `A real source needs an accessible route`)."
patch(LD, [(A05_OLD, A05_NEW), (F01_OLD, F01_NEW), (D04_OLD, D04_NEW)])

# ---------------------------------------------------------------- the reviewer
REV = "agents/design-reviewer.md"
A49_OLD = "On a content Teach, use `explanation` for necessary visible meaning, without forcing every spoken reason into a panel (`preferences.md` → Slide Philosophy);"
A49_NEW = "On a content Teach, use `explanation` for necessary visible meaning. The script may say the board's teaching more fully; a reason it adds that a later beat uses goes on the board, and one nothing later uses is a detour to take out (the two directions under `Material-defect boundary`; `preferences.md` → Slide Philosophy);"
A11_OLD = (
    "the relationship the adult would have to supply is the finding. New evidence with the same taught reasoning is legitimate; a new reasoning demand needs preparation. Reaching the same conclusion is also legitimate when children examine each case to earn it. Do not make every answer different or strip useful support to manufacture independence. Each essential"
)
A11_NEW = (
    "the relationship the adult would have to supply is the finding, judged by `preferences.md` → What a Lesson Is For, `Work from what children can use at that point`, and its limits. Each essential"
)
K01_OLD = (
    "Then read the view's `Names on the board`: every person, place, organisation or thing the class reads, with where it first appears. You know who Elizabeth I is and what the Thames is, so reading as a child cannot find them; the list can. For each name, find the words that tell this class who or what it is, on the board where it first appears or in an earlier lesson the brief names. A name nothing explains is a finding on User-fit, and you may repair it yourself as wording (a clause where it first appears: `Queen Elizabeth I, who ruled England in Tudor times`) or return it when the name is on the board because a source or detour put it there. The same list shows the words about where a source came from (`modern summary`, `reconstruction`, an organisation's name), which a child reads as one more thing to ask about."
)
K01_NEW = (
    "Then read the view's `Names on the board`: every person, place, organisation or thing the class reads, in the slide titles and vocabulary cards as well as the board, with where it first appears and whether the board said it earlier. You know who Elizabeth I is and what the Thames is, so reading as a child cannot find them; the list can. For each name, find the words on the board that tell this class who or what it is, where it first appears; a name an earlier lesson taught still gets a short reminder there (`Lord Shaftesbury, who we met last week, ...`). A name nothing explains is a finding on User-fit, and you may repair it yourself as wording (a clause where it first appears: `Queen Elizabeth I, who ruled England in Tudor times`) or return it when the name is on the board because a source or detour put it there. The list cannot see an ordinary word a sentence leans on (`government`, `order`, `steam engine`): read the teaching for those by `preferences.md` → Vocabulary, `A word the teaching leans on is taught`, which you read every review. For both, the repair is in how the teaching is worded, not a card: the name or the thing arrives with its context in the sentence that brings it in (`preferences.md` → Slide Philosophy). The same list shows the words about where a source came from (`modern summary`, `reconstruction`, an organisation's name), which a child reads as one more thing to ask about; each stays off the board unless the lesson teaches it, and the exact provenance goes in `teacherInfo`."
)
patch(REV, [(A49_OLD, A49_NEW), (A11_OLD, A11_NEW), (K01_OLD, K01_NEW)])

# ---------------------------------------------------------------- history
HIST = "references/subject-history.md"
G30_OLD = "One sentence, on the board or in the script."
G30_NEW = "One sentence, on the board."
C01_OLD = "`the River Thames, which runs through London`), unless an earlier lesson the brief names taught it."
C01_NEW = "`the River Thames, which runs through London`), and a name an earlier lesson taught gets a short reminder there instead (`Lord Shaftesbury, who we met last week, ...`), never a reteach."
D05_OLD = (
    "A label in a historian's words (`modern summary`, `modern reconstruction`, an organisation's name as the heading of a card) is honest to an adult and means nothing to a Year 4 child, who now has one more thing on the board to ask about; the exact provenance goes in `teacherInfo`. Say it once: a set of reconstruction pictures is named as reconstructions at the first one, or in the script, and not captioned again under every return,"
)
D05_NEW = (
    "A label in a historian's words (`modern summary`, `modern reconstruction`, an organisation's name as the heading of a card) stays off the board unless the lesson teaches it: it is honest to an adult and means nothing to a Year 4 child, who now has one more thing on the board to ask about; the exact provenance goes in `teacherInfo`. Where a source came from is said only when it matters to the lesson, and not every source needs a line about it. Say it once: a set of pictures an artist drew recently is introduced as that at the first one, in the class's words (`An artist drew these recently, to show what it might have looked like`), and not captioned again under every return,"
)
D01_OLD = (
    "a genuine record may still be a poor teaching choice if its link to the people or experience being studied needs substantial extra explanation. So list what a teacher who is new to the period would have to explain before the source makes sense to this class (who wrote it, what kind of document it is, the words and customs in it, why it was written) beside what the source then teaches that the next step of the lesson uses. When the first list is the longer, choose a clearer source or tell the knowledge plainly. A 1590"
)
D01_NEW = (
    "a genuine record may still be a poor teaching choice if its link to the people or experience being studied needs substantial extra explanation. Weigh what it costs against what it teaches, by the test in `preferences.md` → Source and Scenario Integrity, `A real source needs an accessible route`. A 1590"
)
E01_OLD = (
    "**So this is a check on the design rather than advice.** Every beat that asks children to infer, judge, evaluate or explain names where the knowledge it runs on was taught: earlier in this lesson, or in a named earlier lesson of the enquiry. A beat that cannot point at either is a guessing beat and needs the teaching putting in front of it. The speculation"
)
E01_NEW = (
    "**So this is a check on the design rather than advice**, and it holds in every subject (`preferences.md` → What a Lesson Is For, `Knowledge before judgement, beat by beat`); in history, the earlier lesson a beat names is one of the enquiry. The speculation"
)
patch(HIST, [(G30_OLD, G30_NEW), (C01_OLD, C01_NEW), (D05_OLD, D05_NEW), (D01_OLD, D01_NEW), (E01_OLD, E01_NEW)])

# ---------------------------------------------------------------- the others
patch("references/do-beats.md", [(
    "**SEND access:** the older idea is the familiar half, so the child is reasoning from something secure.",
    "**SEND access:** the older idea is the familiar half once it has been brought back, so the child is reasoning from something they have just met again.",
)])
patch("references/slide-composition-playbook.md", [(
    "and a caption that must be honest about what a picture is (a reconstruction, a modern photograph of an old place) is said once, at the picture's first appearance or in the script, not reprinted beneath each return.",
    "and a caption that must be honest about what a picture is (drawn recently to show what it might have looked like, a photograph of the place today) is said once, in the class's words, at the picture's first appearance (`as it might have looked`, not `reconstructed`), not reprinted beneath each return; `reconstruction`, `modern summary` and an organisation's name stay off the board unless the lesson teaches them, and the exact provenance goes in the teacher's note.",
)])
