"""The assumed-knowledge mapping and pins (4.2.287). Every changed ledger row
names its new home and the words that carry it now; a retired phrase is pinned
as gone; the rows the Teach then Do topic changed first (4.2.285) say so.
`ledger_mapping.build` checks every phrase against the files."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from ledger_mapping import build, paragraph_of  # noqa: E402

PREF = "references/preferences.md"
LD = "agents/lesson-designer.md"
REV = "agents/design-reviewer.md"
HIST = "references/subject-history.md"
TV = "references/teacher-voice.md"
BEATS = "references/do-beats.md"
PLAYBOOK = "references/slide-composition-playbook.md"
CONTENT = "references/teaching-sequence-content-based.md"
CHECKS = "references/design-review-route-checks.md"
PACKET = "scripts/design-review-packet.py"
LOG = "references/build-review-log.md"
NAMES_TEST = "scripts/tests/test_names_on_the_board_are_read_as_the_class_reads_them.py"

WFU_HEAD = "**Work from what children can use at that point.** A task can only draw on what children have to work with when they meet it: the prior learning the brief establishes (checked where it matters, because earlier exposure is not mastery); the facts, meanings, methods and relationships this lesson has actually made understandable so far; the vocabulary, representations and response forms they know how to use; and whatever the task itself deliberately puts in front of them."
TD = "changed by the Teach then Do topic (4.2.285) before this one, and pinned by its pins as well"

CHANGED = {
    # Decision 1: the board and the notes are never one thing.
    "AK-A13": ("kept as the home of decision 1, in the teacher's words: the board holds the teaching, the notes are the script for saying that slide, most of the time a teacher does not read them, and nothing is taught by the two together; the Sophie story is in the log and its case stays as a plain example",
               [(PREF, "**Write the slides as if the teacher never opens the notes.** The board and the notes are never one thing. The board holds the teaching, the activities, the helpers and the pictures to point to; the notes are the script for teaching that slide, a guide for a cover, tired or new teacher on how to say and present what is on the board in a conversational way. The teacher chooses whether to use them, and most of the time does not read them, so the board shows the teaching and nothing is taught by the board and the notes together: anything a later check, Do beat or task expects a child to produce must have been visible on a slide before it, not only spoken."),
                (PREF, "Children must see the source, representation, working or explanation that the planned learning depends on."),
                (PREF, "It may be revealed or produced live; the starting slide need not be a finished explanation. Notes support delivery and subject knowledge, and they may say the same thing more fully. If children genuinely need more visible material than fits, reform or split the teaching moment rather than hiding it in notes.")],
               [(PREF, "The teacher chooses whether to use the speaker script, and the two are not read together")]),
    "AK-A14": ("story retired from the runtime, in the log since 4.2.286; the case stays in `preferences.md` as a plain example without its date",
               [(PREF, "A quick check that asks what a body uses energy for when it is sitting still is unprepared when the answer, breathing, was only ever said in the script of the slide before."),
                (LOG, "A Year 4 PSHE quick check asked what Sophie's body uses energy for when she is sitting still")],
               [(PREF, "A Year 4 PSHE quick check asked what Sophie's body uses energy for when she is sitting still")]),
    "AK-A05": ("decision 1: the completion pass works an answer from what children have seen on the board or the page, not from spoken preparation",
               [(LD, "For a substantial explanation or judgement, work an answer using only the knowledge, sources and references children have seen on the board or the page, because the script says the board and never teaches what the board lacks (`preferences.md` → `Write the slides as if the teacher never opens the notes`).")],
               [(LD, "spoken preparation")]),
    "AK-A49": ("decision 1: the panel line gives the script's fuller telling its place and a reason it adds C04's two directions",
               [(REV, "every taught idea is intelligible through the visible content and planned teacher action."),
                (REV, "On a content Teach, use `explanation` for necessary visible meaning. The script may say the board's teaching more fully; a reason it adds that a later beat uses goes on the board, and one nothing later uses is a detour to take out (the two directions under `Material-defect boundary`; `preferences.md` → Slide Philosophy);")],
               [(REV, "without forcing every spoken reason into a panel")]),
    "AK-G30": ("decision 1: the sentence that says what is being judged is on the board",
               [(HIST, "**Where the lesson judges a person, the class is told what is being judged.** Designing the character question out is not the same as ruling it out in the room, and children will reach for it anyway: asked how significant somebody was, a nine-year-old answers whether they were kind."),
                (HIST, "One sentence, on the board.")],
               [(HIST, "on the board or in the script")]),
    # Decisions 2 and 3: a plan's earlier lessons, and the short reminder.
    "AK-F01": ("decisions 2 and 3: a plan's earlier lessons are rough context, taken as taught, and anything today leans on from any earlier lesson (the plan's, the previous lesson, prior teaching the brief names) gets a short reminder where it first appears today, never a reteach; a method step already done at this size stays named and left",
               [(LD, "**Prior knowledge:** Use supplied prior teaching and neighbouring lessons. A plan's lessons before this one are rough context: take them as taught by the time this one is. Anything today's teaching leans on from an earlier lesson, whether one of the plan's, the previous lesson or prior teaching the brief names, gets a short reminder where it first appears today (`Lord Shaftesbury, who we met last week, ...`), never a reteach. A method step the class has already done at this size stays named and left alone (the step trace in `Write the lesson, then the contract`). When prior teaching of the target is unspecified, assume it is new; do not infer familiarity from year group or stop to ask this routine question. Use curriculum reasoning to identify essential prerequisites, not to declare the target already learned. Prior exposure is not proof of mastery. Make the foundation children need for this lesson visible without reteaching every remote prerequisite.")],
               []),
    "AK-C01": ("decision 3: a name an earlier lesson taught gets a short reminder where it first appears today, never a reteach (its vocabulary pin moved with it)",
               [(HIST, "Named people, places and events are content the lesson teaches and children need, but they belong in the teaching rather than on cards"),
                (HIST, "In the teaching means explained where each first appears on the board, in a clause a child can hold (`Queen Elizabeth I, who ruled England in Tudor times`, `the River Thames, which runs through London`), and a name an earlier lesson taught gets a short reminder there instead (`Lord Shaftesbury, who we met last week, ...`), never a reteach. A name nothing explains is a word the class cannot use, and the limit on vocabulary cards is no reason to leave it unexplained.")],
               [(HIST, "unless an earlier lesson the brief names")]),
    "AK-F34": ("decision 3: familiar once it has been brought back, not secure",
               [(BEATS, "**SEND access:** the older idea is the familiar half once it has been brought back, so the child is reasoning from something they have just met again.")],
               [(BEATS, "reasoning from something secure")]),
    # Decisions 1, 3, 7 and 8: the reviewer's names check.
    "AK-K01": ("decisions 1, 3, 7 and 8: the list reads titles and cards and counts only the board; a name an earlier lesson taught still gets its reminder; ordinary words are read by the vocabulary rule every review, with its three repairs; for a name or a thing met on the way the repair is in the wording, not a card alone; and source words stay off the board unless taught, while a picture is just shown with no words about how it was made (the teacher's third-round ruling (\"Just show the picture. The teacher can say it if they need to.\"))",
               [(REV, "Then read the view's `Names on the board`: every person, place, organisation or thing the class reads, in the slide titles and vocabulary cards as well as the board, with where it first appears and whether the board said it earlier. You know who Elizabeth I is and what the Thames is, so reading as a child cannot find them; the list can."),
                (REV, "For each name, find the words on the board that tell this class who or what it is, where it first appears; a name an earlier lesson taught still gets a short reminder there (`Lord Shaftesbury, who we met last week, ...`). A name nothing explains is a finding on User-fit, and you may repair it yourself as wording (a clause where it first appears: `Queen Elizabeth I, who ruled England in Tudor times`) or return it when the name is on the board because a source or detour put it there."),
                (REV, "The list cannot see an ordinary word a sentence leans on (`government`, `order`, `steam engine`): read the teaching for those by `preferences.md` → Vocabulary, `A word the teaching leans on is taught`, which you read every review, and use its three repairs. For a name, or a thing the lesson meets on the way, the repair is in how the teaching is worded, not a card alone: it arrives with its context in the sentence that brings it in (`preferences.md` → Slide Philosophy)."),
                (REV, "The same list shows the words about where a source came from (`modern summary`, `reconstruction`, an organisation's name), which a child reads as one more thing to ask about; each stays off the board unless the lesson teaches it, and a picture is just shown, with no words about how it was made; a caption naming it (`The Starry Night by Van Gogh`) may help and is never required.")],
               [(REV, "or in an earlier lesson the brief names")]),
    "AK-K02": ("code, decision 8: the page reads titles and vocabulary cards, finds a one-word name the lesson capitalises elsewhere, and says earlier only when the board showed the whole word; its note names the reminder and the ordinary words",
               [(PACKET, "\"## Names on the board\","),
                (PACKET, "\"of this year group knows none of them unless this lesson taught it, \""),
                (PACKET, "\"finding, repaired by a clause in the sentence that brings it in or by \""),
                (PACKET, "\"and a name an earlier lesson taught still gets a short reminder where \"")],
               [(PACKET, "\"year group knows none of them unless this lesson, or an earlier lesson \""),
                (PACKET, "said earlier in the lesson", "local")]),
    # Decision 5: the source test, where every subject reads it.
    "AK-D01": ("decision 5: the test moved to `preferences.md` → Source and Scenario Integrity word for word except that \"new to the period\" reads \"new to the topic\" and the opening's \"the people or experience being studied\" reads \"what the lesson studies\"; history keeps its opening, points to the test and keeps the 1590 order as its example",
               [(HIST, "**A real source needs an accessible route before a child can think with it.** Select the smallest coherent source set the historical thinking requires. Select for a clear contribution to this enquiry, not authenticity or variety alone: a genuine record may still be a poor teaching choice if its link to the people or experience being studied needs substantial extra explanation. Weigh what it costs against what it teaches, by the test in `preferences.md` → Source and Scenario Integrity, `A real source needs an accessible route`."),
                (PREF, "So list what a teacher who is new to the topic would have to explain before the source makes sense to this class (who wrote it, what kind of document it is, the words and customs in it, why it was written) beside what the source then teaches that the next step of the lesson uses. When the first list is the longer, choose a clearer source or tell the knowledge plainly.")],
               [(HIST, "new to the period"), (HIST, "When the first list is the longer", "local")]),
    "AK-D04": ("decision 5: the pointer names the new home, which every subject reads",
               [(LD, "A source, story or clip the plan names is part of its activity, not its coverage: coverage is what the objective asks children to learn, so replace a named source with a clearer one, or leave it out, whenever it would cost the class more explaining than it teaches (`preferences.md` → Source and Scenario Integrity, `A real source needs an accessible route`).")],
               [(LD, "(`subject-history.md` → `A real source needs an accessible route`)")]),
    # Decision 6: knowledge before judgement, beat by beat, in every subject.
    "AK-E01": ("decision 6: the beat-by-beat check moved to `preferences.md` → What a Lesson Is For for every subject, with the moves that ask first on purpose; history keeps its reason, its Egyptian example and its enquiry, and points there",
               [(HIST, "What they cannot do is make a real historical judgement before they have been taught the context that makes the judgement possible."),
                (HIST, "**So this is a check on the design rather than advice**, and it holds in every subject (`preferences.md` → What a Lesson Is For, `Knowledge before judgement, beat by beat`); in history, the earlier lesson a beat names is one of the enquiry."),
                (PREF, "So this is a check on the design rather than advice, in every subject: every beat that asks children to infer, judge, evaluate or explain names where the knowledge it runs on was taught, earlier in this lesson or in a named earlier lesson (with its short reminder today, `lesson-designer.md` → Prior knowledge). A beat that cannot point at either is a guessing beat and needs the teaching putting in front of it.")],
               [(HIST, "Every beat that asks children to infer, judge, evaluate or explain names where the knowledge it runs on was taught: earlier in this lesson, or in a named earlier lesson of the enquiry.")]),
    # Decision 7: where a source came from.
    "AK-D05": ("decision 7: a source is labelled honestly in children's words, a historian's label stays off the board unless the lesson teaches it, and where a source came from is said only when it matters; the picture example left with the teacher's third-round ruling (\"Just show the picture. The teacher can say it if they need to.\")",
               [(HIST, "Identify sources honestly, in words the class already has: `This is what the Queen's order said, in simpler words`. A label in a historian's words (`modern summary`, `modern reconstruction`, an organisation's name as the heading of a card) stays off the board unless the lesson teaches it: it is honest to an adult and means nothing to a Year 4 child, who now has one more thing on the board to ask about; the exact provenance goes in `teacherInfo`. Where a source came from is said only when it matters to the lesson, and not every source needs a line about it.")],
               [(HIST, "`An artist drew this recently, to show what it might have looked like`")]),
    "AK-D06": ("decision 7 with the teacher's third-round ruling (\"Just show the picture. The teacher can say it if they need to.\"): a picture an artist drew, or a photograph of a place today, has no caption about how it was made, and the notes need not say it; a caption that names the picture may help and is printed once; never named as reconstructions",
               [(HIST, "**A picture is just shown.** An artist's drawing of how something might have looked, or a photograph of a place today, has no caption about how it was made (`This is a reconstructed picture of a historical setting`), and the notes need not say it either; the teacher can say it if they need to. That holds when the lesson asks what the picture tells us (`What does this picture tell us about Tudor farm work?`): the class may need to know it was made later, and the teacher says so; the board does not. A caption that names the picture may help and is never required: a famous painting can carry its title and painter (`The Starry Night by Van Gogh`), and two pictures side by side can say which is which. A caption takes height from the picture (`slide-composition-playbook.md` → Sets, banks, categories and captions), so it is printed once, at the picture's first appearance, and a Teach script's `Caption the picture ...` note is for that first appearance."),
                (HIST, "Put production provenance and links in teacher-facing fields unless children need them to evaluate the source. Never dress invented classroom material as a historical source.")],
               [(HIST, "named as reconstructions"), (HIST, "a set of reconstruction pictures"), (HIST, "Say it once: a set of pictures")]),
    "AK-D12": ("decision 7 with the teacher's third-round ruling (\"Just show the picture. The teacher can say it if they need to.\"): a picture an artist drew, or a photograph of a place today, has no caption saying how it was made; `reconstructed` and the rest never go under a picture, even when the lesson asks what it tells us (his fifth round); the limit on a caption a child needs is kept",
               [(PLAYBOOK, "and a picture an artist drew to show how something might have looked, or a photograph of a place today, has no caption saying how it was made (`This is a reconstructed picture of a historical setting`): the picture is just shown, and the teacher can say it if they need to. `reconstructed`, `modern summary` and an organisation's name never go under a picture, even when the lesson asks what the picture tells us; the teacher says it if the class needs to know. A caption that names the picture may help and is never required (`The Starry Night by Van Gogh`). Now and then, when a slide is short of room, the question about a picture can be its caption (`What does this picture tell us about Tudor farm work?`); that is an option for the odd slide, and questions otherwise keep their own place and look. The limit is a caption that carries something a child needs and nothing else on the slide says: a source's date and maker, a place's name, which of two pictures is which.")],
               [(PLAYBOOK, "at the picture's first appearance or in the script"), (PLAYBOOK, "a caption that must be honest about what a picture is")]),
    "AK-D08": ("story retired from the runtime; copied to the log first (4.2.287); the case stays in history as a plain example without its date",
               [(HIST, "Sarah Gooder's own 1842 words set beside George, an invented servant boy, and Sam, an invented bird scarer, told in the same plain voice with nothing saying which was evidence and which was an example, is the confusion this prevents."),
                (LOG, "A Year 4 lesson on Victorian working conditions (16 September 2026) set Sarah Gooder's own 1842 words beside George")],
               [(HIST, "(16 September 2026) set Sarah Gooder's own 1842 words")]),
    # Decision 9: one home for work from what children can use.
    "AK-A01": ("kept as the one home (decision 9), taking every extra its copies carried: after a freshness repair and the same conclusion earned case by case (A11), each case seen worked (A31), a new reasoning demand with maths's fuller form (A11, A35), an invented wage and often unverified (A09), trick wording and avoidable reading (A08), what the task, model answer and acceptance may claim (A32), and a Practise brought forward (A15, A16); the last three sit in the paragraph beside it, `The work claims no more than the evidence, and keeps its support`",
               [(PREF, WFU_HEAD),
                (PREF, "Before committing a substantial task, attempt it from that material alone, and again after any repair that makes a case fresher, and find any connection you supplied without noticing. Repair a real gap by teaching the connection, modelling the move, choosing a clearer example, supplying the evidence or narrowing the task within the objective, never by writing the missing idea into the answer key.")],
               []),
    "AK-A03": ("the home's limit, carrying history's invented wage and \"often unverified\", and the reviewer's \"trick wording or avoidable reading\" (decision 9)",
               [(PREF, "**A new explanatory mechanism is not:** a task relying on a law, a guild rule, an economic arrangement (an invented wage) or a scientific process the lesson never taught has smuggled it in as assumed knowledge, however much more like real history or science the task then looks, and often unverified as well. Either it earns a place in the teaching, accurate, inside the objective and teachable in the time, or the task makes better use of what was taught."),
                (PREF, "Deeper work usually comes from a comparison, a missing relationship, a changed condition, a fresh application or a closer use of evidence, not from more facts, longer answers or harder words, and stronger reasoning never means untaught knowledge, trick wording or avoidable reading.")],
               []),
    "AK-A11": ("decision 9: the reviewer keeps its procedure and points to the home and the paragraph beside it, naming both limits; the home and its neighbour now carry its limits, and it reads the section every review",
               [(REV, "Across all routes, trace preparation and independent performance in both directions, including after a freshness repair, using the representative answer you worked for the Pedagogy judgement: the relationship the adult would have to supply is the finding, judged by `preferences.md` → What a Lesson Is For, `Work from what children can use at that point` (new evidence is allowed; a new explanation the lesson never taught is not) and `The work claims no more than the evidence, and keeps its support` beside it."),
                (PREF, "New evidence read with the same taught reasoning is fair; a new reasoning demand needs preparation of its own"),
                (PREF, "Reaching the same conclusion in two cases is legitimate when children examine each case to earn it; do not make every answer different, or strip useful support to manufacture independence.")],
               [(REV, "Reaching the same conclusion is also legitimate when children examine each case to earn it.", "local")]),
    # Decision 10: one section on a question written by someone who knows the answer.
    "AK-G06": ("decision 10: moved whole to `teacher-voice.md` §6, `Say what you mean`, beside the two repairs it lacked (its em dashes became brackets); the slide rules keep a one-line pointer naming the four shapes",
               [(PREF, "**The harder half of that same test: a prompt written by someone who already knows the answer.** It reads perfectly to whoever wrote it and breaks for the child meeting it cold, in four shapes: a question that names the property the answer turns on, a second question that leans on the first being solved, a heading where a question is needed, and a stem built from the task instead of the learning. `teacher-voice.md` §6, `Say what you mean`, owns them with their examples and repairs."),
                (TV, "**The harder half: a prompt written by someone who already knows the answer.** Missing context is the visible failure; this one is invisible, because the prompt reads perfectly to whoever wrote it and only breaks for the child meeting it cold. It wears four shapes. A question can name the property the answer turns on before the child has found it: \"what shape is the land where the forest has gone?\" is a clue to an adult who knows about the fishbone pattern, while a child looking at the same photograph sees size and damage and no shape at all. A second question can lean on the first already being solved, so \"the line down the middle of each shape\" cannot be read until \"each shape\" means something."),
                (TV, "So read every prompt back with the answer covered up and ask whether a child could tell what *kind* of thing is being asked for; phrase as a question anything a child responds to; and build a stem out of the words of the question it answers."),
                (TV, "Even there the child has to know what they are being asked *for*; they just should not find it easy.")],
               [(PREF, "It wears four shapes. A question can name the property", "local")]),
    "AK-G02": ("the teacher's words kept, without their date (in the log, L1233)",
               [(TV, "The user, on a Year 4 history deck: \"They seem like they'd be great for college kids to discuss, but for primary school children they feel a little too abstract... only my smarter children will answer, because SEND, EAL, low children still need to get it.\"")],
               [(TV, "on a Year 4 history deck (14 September 2026)", "local")]),
    # Decision 11: children's own experience, one rule.
    "AK-I01": ("decision 11: the one home says experience may be invited and never required, keeps the flat \"do not assume\" (I03's form) beside \"avoid unnecessarily forcing personal disclosure\", and says where the alternatives are heard",
               [(PREF, "**Children's own experience may be invited, never required.** A lesson may invite it (a starter, a comparison, a set the class builds from being a person), but no beat needs it to be completed. Do not assume children share the same family circumstances, experiences or emotional safety, and avoid unnecessarily forcing personal disclosure. The alternatives (school, friends, a made-up case, a private answer) are said in the words the class hears, not left in a note to the teacher."),
                (PREF, "Personal reflection remains available when it is genuinely suitable.")],
               [(PREF, "Avoid unnecessarily forcing personal disclosure or assuming children share")]),
    # Rows the Teach then Do topic (4.2.285) changed after this ledger's snapshot.
    "AK-A28": (TD + ": the same sentence, with \"with enough explanation and guided use for the later task\" added",
               [(PREF, "Teach a thinking move where the material makes children need it: a brief cue can suffice for a familiar comparison; an unfamiliar inference may need an explicit model and guided attempt, with enough explanation and guided use for the later task.")],
               []),
    "AK-A29": (TD + ": the route points to the home for when a brief cue is enough",
               [(CONTENT, "(`preferences.md` → The Teach → Do → Teach → Do Rhythm owns when a brief cue is enough and when an unfamiliar move needs focused teaching)")],
               []),
    "AK-B16": (TD + ": the route points to the orientation rule and keeps its prerequisite line; the scene is the first Teach's opening, never a beat with a made-up Do",
               [(CONTENT, "**Orient children enough to enter the first example.**"),
                (CONTENT, "New prerequisite learning that children must use still earns teaching and processing."),
                (CONTENT, "on a slide of its own when the first board would otherwise be too full, and never a beat of its own with a made-up Do after it")],
               []),
    "AK-B17": (TD + ": moved from the designer's clipped copy into the rhythm section as whole sentences",
               [(PREF, "When the honest answer is that the beat supplies groundwork children will use (a prerequisite fact the first idea rests on), keep it and make the link part of the teaching: say why it matters for today's real question, and have the beat land back on the objective. Orientation children will not use is governed by the paragraph above.")],
               []),
    "AK-E19": (TD + ": the same check, with each finding used before the next is taught",
               [(CHECKS, "For Discovery lessons, check that exploration is safe, bounded and dependable, pupils have the needed prerequisites, the result becomes visible, and explicit explanation follows each finding, with children using one finding before the next is taught.")],
               []),
}

NAME_PARA = paragraph_of(PREF, "**A name, or a thing the class has never met, arrives with its context in the sentence that brings it in.**")
ADDED = [
    ("AK-DEC-04", "decision 4, with the teacher's second-round words on decision 8: a name, or a thing the lesson meets on the way that the class has never met, arrives with its context in the sentence that brings it in, in every subject, and for these the repair is the wording, not a card alone (an ordinary word the teaching leans on keeps the vocabulary rule's three repairs), beside `A case arrives with the context that makes it make sense` (B04, B40 and C02 stay as they are; C01 keeps history's paragraph)",
     [(PREF, NAME_PARA)]),
    ("AK-DEC-06", "decision 6: the moves that ask before teaching on purpose (E02's hook, E40's legible pattern, E41's estimate, E42's bounded attempt, a discovery exploration, fresh evidence) are written into the general check; each subject keeps its own wording",
     [(PREF, "The exception is a beat that asks before teaching on purpose: a hook, a pattern children read, an exploration, a first attempt, an estimate, fresh evidence. It says so, stays short, and the teaching that gives it meaning follows straight after.")]),
    ("AK-DEC-08", "decision 8: the review page's names list and the every-review read of the vocabulary rule, in code, with their tests",
     [(PACKET, "def board_reading(design: dict) -> list[tuple[str, list[str], list[str]]]:"),
      (PACKET, "def _said_on_the_board(name: str, board_text: str) -> bool:"),
      (PACKET, "\"Read every review, for `A word the teaching leans on is taught`: the \""),
      (NAMES_TEST, "The review page's list of names reads what the class reads (4.2.287).")]),
    ("AK-DEC-09", "decision 9: the extras the copies carried, now in the one home; A08, A09, A15, A16, A31, A32 and A35 keep their own words where they are",
     [(PREF, "Where a method has distinct cases, each case a child meets alone that changes the procedure is one they have seen worked, because a case modelled nowhere but met in independent practice is met cold (`teaching-sequence-skill-based.md` says where the extra case goes)."),
      (PREF, "so a genuinely new decision, representation, reading demand or way of thinking gets its own enabling teaching, while a task merely labelled \"problem solving\" does not earn a second whole-class teaching act for the label."),
      (PREF, "**The work claims no more than the evidence, and keeps its support.** The final task, its model answer and its acceptance claim no more than the evidence children studied"),
      (PREF, "a Practise brought forward because the lesson looks long, before the knowledge it runs on is taught, is a guessing task, and an early Practise followed by beats kept only because they were already written is a design fault too")]),
    ("AK-DEC-05", "decisions 5 and 11: the source test's general home opens with the rule it serves, for every subject, and names history's example; the reviewer's trigger for the section names both rules that moved there",
     [(PACKET, "\"a named source, story or clip that may cost more explaining than it \""),
      (PACKET, "\"teaches, and any beat that invites children's own experience.\""),
      (PREF, "**A real source needs an accessible route before a child can think with it.** This holds for a source, story or clip in any subject: a genuine record may still be a poor teaching choice if its link to what the lesson studies needs substantial extra explanation.")]),
]

HOMES = [
    (PREF, "## What a Lesson Is For", "HOME-AK-WLF"),
    (PREF, "## Source and Scenario Integrity", "HOME-AK-SSI"),
    (TV, "## Say what you mean, and give a second question that leads to the first", "HOME-AK-TV6"),
]

build(
    ledger="2026-09-22-assumed-knowledge-ledger.md",
    prefix="AK",
    changed=CHANGED,
    added=ADDED,
    homes=HOMES,
    pins="scripts/tests/assumed_knowledge_ledger_pins.json",
    mapping="2026-09-23-assumed-knowledge-mapping.md",
    title="Assumed knowledge mapping: where every ledger row went",
    snapshot="4.2.286 bf658468, changed to 4.2.287 (uncommitted)",
    intro=[
        "Every row of `2026-09-22-assumed-knowledge-ledger.md` (snapshot 4.2.284), with",
        "what happened to it by 4.2.287. \"Unchanged in place\" rows are word for word",
        "where the ledger found them. Every other row names its new home and the words",
        "that now carry it; a retired phrase is listed as gone. Five rows were changed",
        "by the Teach then Do topic (4.2.285) before this one and say so. Built and",
        "checked by `streamline-tools/ak-change/build_ak_mapping.py`. The same list is",
        "pinned by `scripts/tests/assumed_knowledge_ledger_pins.json`.",
    ],
)
