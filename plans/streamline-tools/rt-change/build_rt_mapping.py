"""The routes release (topic 8, release 3): the mapping and the pins for the
teaching routes and pedagogy references ledger (`RT-`, 592 rows).

Every changed `RT-` row names the decision that changed it (his words are in the
routes ledger's "Decisions taken") and the words that now carry it, and each
retired wording is barred (everywhere, programs included, unless marked
"local"). A row whose words stand but moved under one of the two new headings is
mapped as moved, so its outcome says so and its pin names the new section. Rows
an earlier release changed after the ledger's snapshot (release 7A, the subject
files) are mapped to the words those releases left. Rows whose quotes still
stand are pinned where they are. The two new headings are pinned paragraph by
paragraph. Release 4 (one copy of each rule) extends this file.

    python -X utf8 plans/streamline-tools/rt-change/build_rt_mapping.py

Writes `plugins/lesson-v4/scripts/tests/routes_ledger_pins.json` and
`plans/2026-09-26-routes-mapping.md` in the copy this file sits in (both printed
before writing)."""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
sys.path.insert(0, str(HERE))
import _root  # noqa: E402  (a replay on a scratch copy sets LESSONV4_PLUGIN_ROOT)
import ledger_mapping  # noqa: E402
from ledger_mapping import P, Q, REPO, absent_everywhere, build, norm, text_of  # noqa: E402

LEDGER = "2026-09-23-routes-ledger.md"
PINS = "scripts/tests/routes_ledger_pins.json"
MAPPING = "2026-09-26-routes-mapping.md"

LD = "agents/lesson-designer.md"
REV = "agents/design-reviewer.md"
PREF = "references/preferences.md"
TV = "references/teacher-voice.md"
OT = "references/output-template.md"
CONTENT = "references/teaching-sequence-content-based.md"
SKILL = "references/teaching-sequence-skill-based.md"
TASK = "references/teaching-sequence-task-centred.md"
DIAL = "references/teaching-sequence-dialogic.md"
DISC = "references/teaching-sequence-discovery.md"
DB = "references/do-beats.md"
ES = "references/evidence-synthesis.md"
ET = "references/explanation-tasks.md"
MF = "references/modelling-formats.md"
LDC = "references/lesson-designer-components.md"
RP = "references/reasoning-prompts.md"
VALIDATOR = "scripts/validate-lesson-design.py"
PACKET = "scripts/design-review-packet.py"

D1 = "routes decision 1 (his \"y\"): four corners comes out of the discussion route; moving is allowed without his asking only when the movement is itself what is being learned"
D2 = ("routes decision 2 (his \"y\": \"One rule everywhere: the example is skipped only when the class has seen a good "
      "one earlier in this lesson, and the check covers big-task lessons and a skills lesson's bigger practice task too\")")
Q2 = ("the change plan's question 2 (his \"Yes\"): a My Turn or Our Turn counts only when it shows the kind of thing "
      "children then write")
B13 = ("his preferences decision 13b, moved from 7B to the routes release so the words land with the code (\"a writing "
       "task whose criteria already show a good paragraph skips a second model\"), repaired after the first check: "
       "criteria stand in for the good instance only when they show an actual good one, never a list of what a good "
       "one includes, so the launch keeps its case and steps and needs no second model; the program keeps asking a "
       "written explanation for its good instance, since no criteria shape holds a written model")
R1 = "repair round 1 (the lead's item 5): the section other routes read on its own says only what is true there"
D34 = ("routes decisions 3 and 4 (his 3, widened: \"thats how i explain anything, so might not neccearily be teach "
       "slides i guess\"): the teacher's way of explaining is written once, under `How this teacher explains` in the "
       "content route, and read wherever something is explained; the launch fields under `The launch`")
MOVED = D34 + "; moved there word for word"
D5 = "routes decision 5 (his \"y\"): the plan gets its own beat only when it produces something children need before they start"
D8 = "routes decision 8 (his \"y\"): the Look for note names the one link most children skip, inside its 25 words"
S6 = "routes settled item 6 (his \"y\"): a short enabling input, one idea at a time"
S7A = "routes settled item 7a: a live-completed My Turn's finished helper follows on the next slide"
S7C = "routes settled item 7c: the activity list says what its entries carry and names the entries that replaced the gone ones"
S7D = "routes settled item 7d: the one Synthesise is the discussion route's own beat; stems and push-back questions are the conditional tools"
S7E = "routes settled item 7e: a skill `prepare` unit's `activity` in `explanation` mode and a task lesson's `modelledOn` are words the class reads"
S7F = "routes settled item 7f: the two rules the check holds and nothing stated are written where the designer reads them, and the turn-label message carries his maths ruling"
S7G = "routes settled item 7g: slips"
S7I = "routes settled item 7i: the board carries the route, the script says it more fully"
S7J = "routes settled item 7j: the Teach explanation message describes the teaching in his order, opening on the landed sentence"
ST = "stories leave for the build log (copied there first by rt_01), reasons stay, his rulings keep his words without their dates"
A7 = "changed by release 7A (4.2.293, committed before this release), mapped with its words"
SJ = "changed by the subject-files release (4.2.291, committed before this release), mapped with its words"

EARLIER = "an earlier beat of this lesson has already shown the class a good one of this product"
ACTUAL = "(an actual good one, such as a model answer or a good paragraph, never a list of what a good one includes)"
T13B = ("success criteria on the board that already show what a good one looks like " + ACTUAL + " stand in for the "
        "good instance, so the launch keeps its case and steps and needs no second model")
HOW = "`teaching-sequence-content-based.md` → `How this teacher explains`"

ROWS = {
    # rid: (outcome, the new words that now carry it (standing quotes are added), the words gone)
    # --- Decision 1
    "RT-G05": (D1, [(DIAL, "A Stimulus can also be an *activity* — a ranking, a sort, a vote with a written reason — when the activity itself surfaces children's positions.")],
               [(DIAL, "a four-corners vote")]),
    "RT-G08": (D1, [(DIAL, "- A line on paper from agree to disagree, or a vote with a written reason (`do-beats.md` 6.2 and 6.4)")],
               [(DIAL, "- Four corners (children physically position themselves on agree / strongly agree / disagree / strongly disagree and defend)")]),
    "RT-J35": (D1, [(DB, "**The user keeps a calm classroom.** He does not use stand-up routines, and a beat that gets the class out of seats, moving round the room or performing at the front works against the room he runs. So a seated form comes first: order cards at the table (5.8) rather than Human Sequencing, a partner discussion rather than Conscience Alley. Gesture-as-Memory and Mime It can be done sitting down and stay available. Choose a whole-class movement beat only when the teacher asks for it, or when the movement is itself what is being learned (standing and making a quarter turn to learn what a quarter turn is).")],
               [(DB, "Choose a whole-class movement beat only when the teacher asks for it.")]),
    # --- Decision 2, question 2 and 13b
    "RT-E70": (D2 + "; and " + B13, [(CONTENT, "`launch` is `null` when children can begin from the question alone, or when " + EARLIER + ", and `goodLooksLike` is `null` when the success criteria already show what a good one looks like " + ACTUAL + ".")],
               [(CONTENT, "`launch` is `null` when children can begin from the question alone, and `goodLooksLike` is `null` when the success criteria already show what a good one looks like.")]),
    "RT-F34": (D2 + "; and " + B13, [(TASK, "`launch` is `null` only when children can begin from the question alone, or when " + EARLIER + ", and `goodLooksLike` is `null` when the success criteria already show what a good one looks like " + ACTUAL + ".")],
               [(TASK, "`launch` is `null` only when children can begin from the question alone, and `goodLooksLike` is `null` when the success criteria already show what a good one looks like.")]),
    "RT-F19": (D2, [(TASK, "`launch` is null only when children can begin from the task's question alone, or when " + EARLIER + " (a model answer revealed on the board, or an earlier launch).")],
               [(TASK, "the product form is familiar")]),
    "RT-F18": (D2 + "; the plan kept this row's words, but his decision names it (its trigger asked whether children had made the form in this lesson, the question decision 2 replaced), so his words win",
               [(TASK, "or the class has not yet seen a good one of this product in this lesson (a rule, a plan, a paragraph),")],
               [(TASK, "or the product has a form children have not yet made in this lesson")]),
    "RT-Q16": (D2 + "; and " + Q2 + "; and " + B13,
               [(VALIDATOR, '_SUBSTANTIAL_TASKS = {"practise": "Practise", "do-task": "Do the task"}'),
                (VALIDATOR, 'f"teachingSequence[{index}].content.launch: this {beat} asks each child to write an "'),
                (VALIDATOR, "if kind in {\"my-turn\", \"our-turn\"}:"),
                (VALIDATOR, "if not _EXPLAINS.search(content.get(\"example\") or \"\"):"),
                (VALIDATOR, "\"explanation and its good one is on the board; success criteria that list what a good one \""),
                (VALIDATOR, "\"includes are not a good one shown). A child meeting the form for the first \"")],
               [(VALIDATOR, "A skill lesson is left alone: its My Turn and Our Turn model the move every time."),
                (VALIDATOR, "if structure == \"Skill-based\":\n        return\n    for index, unit in enumerate(sequence):\n        if unit.get(\"kind\") != \"practise\":", "local")]),
    # --- Decisions 3 and 4: the heading, and every pointer to it
    "RT-E45": (D34 + "; the bold sentence became his read-back, and the field and the two exceptions are named above it",
               [(CONTENT, "**This is how this teacher usually explains anything, on a Teach board in any kind of lesson or wherever else something is explained: the takeaway, then a because or so that explains that one key point, then an example or what it does not mean.** It is how he usually explains, not a template, and the board reads that way unless the beat has a reason not to."),
                (CONTENT, "Two exceptions keep their own shape: a skills lesson's teaching board stays brief (`teaching-sequence-skill-based.md` → Cycles, and the beats around them), and a discovery lesson lands its takeaway at the end, because children reach it themselves (`teaching-sequence-discovery.md` → Teach why).")],
               [(CONTENT, "The shape this teacher teaches in, more often than not, is four parts in this order")]),
    "RT-D21": (D34 + "; and " + S7E, [(SKILL, "two or three short lines on the board, the way this teacher explains (" + HOW + "), not a description of an activity and not a slogan the script explains")],
               [(SKILL, "(what the idea means, why it matters, what it looks like)")]),
    "RT-D29": (D34 + "; the skill route's output block now says which fields its `teach` and `practise` beats take and where their rules live",
               [(SKILL, "A `teach` beat takes the knowledge route's Teach fields, and its `explanation` explains as " + HOW + " says, kept brief on the board as `Cycles, and the beats around them` says. A `practise` beat takes the knowledge route's Practise fields, and its `launch` is written as that file's `The launch` says.")],
               []),
    "RT-C30": (D34, [(SKILL, "It takes the full launch its size deserves (`teaching-sequence-content-based.md` → `The launch`).")], []),
    "RT-F05": (D34, [(TASK, "`explanation` supplies necessary visible meaning beside the `modelledOn` instance, the way this teacher explains (" + HOW + "), with completion or annotation produced live where that is the chosen teaching action.")], []),
    "RT-F29": (D34, [(TASK, "\"explanation\": \"the teaching of that idea as the child reads it, in two or three short lines, the way this teacher explains (`teaching-sequence-content-based.md` → How this teacher explains); null only when the idea and its instance already carry the meaning, never because the script explains it\",")],
               [(TASK, "in two or three short lines: what it means, why it matters, what it looks like")]),
    "RT-H07": (D34 + ", discovery keeping its takeaway to the end", [(DISC, "`accurateExplanation` is the explanation as the child reads it, two or three short lines on the evidence they just saw, the way this teacher explains (" + HOW + "), with the takeaway landing at the end, because children reach it themselves.")],
               [(DISC, "on the evidence they just saw: what happened, why, what it looks like")]),
    "RT-H14": (D34 + ", discovery keeping its takeaway to the end", [(DISC, "\"accurateExplanation\": \"the explicit explanation as the child reads it: two or three short lines on the evidence, the way this teacher explains (`teaching-sequence-content-based.md` → How this teacher explains), the takeaway landing at the end\",")],
               [(DISC, "two or three short lines on the evidence, what happened, why, what it looks like")]),
    "RT-G19": (D34, [(DIAL, "When the input explains something rather than naming it, it explains the way this teacher explains (" + HOW + ").")], []),
    "RT-P06": (D34 + "; and " + B13, [(LD, "in the order and with the exceptions " + HOW + " gives)"),
                                      (LD, "or why its question alone is enough (" + T13B + ").")],
               [(LD, "`teaching-sequence-content-based.md` → `explanation` gives)")]),
    # --- Repair round 1 (the lead's item 5): the section other routes read alone
    "RT-E49": (MOVED + "; and " + R1 + ": \"the fault above\" pointed outside the section",
               [(CONTENT, "Saying the same thing three ways is a fault (this section's last paragraph: the landed sentence again in other words); walking the route is three or four different things and is the teaching itself.")],
               [(CONTENT, "Saying the same thing three ways is the fault above")]),
    "RT-E53": (MOVED + "; and " + R1 + ": \"the same-shape fault above\" pointed outside the section",
               [(CONTENT, "A deck whose every correction opens `That doesn't mean` has found one sentence and reused it, which is saying the same thing three ways, at the level of slides")],
               [(CONTENT, "which is the same-shape fault above at the level of slides")]),
    "RT-E59": (MOVED + "; and " + R1 + ": the validator refuses `null` on a `teach` beat, not on a task lesson's `teach-needed`",
               [(CONTENT, "So the default is to write it, and the validator refuses `null` on a `teach` beat (a task lesson's `teach-needed` keeps its own rule: `null` only when the idea and its instance already carry the meaning).")],
               [(CONTENT, "So the default is to write it, and the validator refuses `null`. The PSHE", "local")]),
    # --- Decisions 5 and 8, settled item 6
    "RT-F12": (D5, [(TASK, "Planning and doing continue as one flowing task, with any check for safety or wasted materials inside it as the teacher's check; the plan gets its own beat only when it produces something children need before they start (a fair-test plan, a labelled design).")],
               [(TASK, "Planning and doing may continue as one flowing task unless separating the plan materially improves the work or protects one of those important conditions.")]),
    "RT-K18": (D8, [(ET, "Put the one link most children skip, and the question to ask at it, in `speakerNotes.lookFor` on the task beat, inside its 25 words: `Look for: the acid named as something the germs make: if a child jumps from sugar to the hole, ask what the germs did with the sugar.` The other likely gaps and their questions go in the same beat's `speakerNotes.teacherInfo`, beside the likely mistakes.")],
               [(ET, "naming the links most likely to be skipped and the question to ask at each")]),
    "RT-A24": (S6, [(LDC, "Three conditions: one substantial task centre (not set of short items, not body of facts), child can attempt with what they have or after a short enabling input, one idea at a time (applying, not discovering unknown, not being taught method to rehearse), doing sustained and artefact assessed.")],
               [(LDC, "after one short enabling input")]),
    # --- Settled item 7a
    "RT-B29": (S7A, [(SKILL, "When a Live-complete helper is selected, leave its active part for live completion; the finished helper follows on the next slide as the unit's answer (`modelling-formats.md` → Live-complete helper).")],
               [(SKILL, "for My Turn, do not create a following answer slide")]),
    # --- Settled item 7c
    "RT-I10": (S7C + " (checked entry by entry: every entry has Best for and one of SEND access or Demands and supports)",
               [(DB, "Each entry says what it is and what it is best for, and gives its access notes (`SEND access`, or `Demands and supports`); some also carry `The limit`, a `Register` and `Mechanism`, or the `Teacher-owned response routine` they need, and two are marked `Not used`, so the agent can compare on like-for-like fields.")],
               [(DB, "what it is, register, best for, why it works, SEND access notes, source")]),
    "RT-I25": (S7C, [(DB, "- **§1 Recall** — seven retrieval formats (free recall, choral response, retrieval roulette)."),
                     (DB, "- **§2 Talk** — seven oral-rehearsal formats (partner discussion, think-pair-share, convince your partner)."),
                     (DB, "- **§3 Write** — seven committed-record formats, including the hinge and diagnostic questions.")],
               [(DB, "eight retrieval formats (brain dump"), (DB, "eight oral-rehearsal formats (turn and talk"),
                (DB, "eight committed-record formats")]),
    "RT-J04": (S7C, [(DB, "Lower stakes than Free Recall (1.1).")], [(DB, "Lower stakes than Brain Dump.")]),
    "RT-J11": (S7C, [(DB, "**Best for:** ongoing — embedded into partner discussion (2.1) over a term.")], [(DB, "embedded into Turn-and-Talk")]),
    "RT-J15": (S7C, [(DB, "**Best for:** a quick written committal mid-lesson; bridge from partner discussion (2.1) to extended writing.")],
               [(DB, "bridge from Turn-and-Talk")]),
    "RT-J39": (S7C, [(DB, "**SEND access:** scaffold with a partner first (partner discussion, 2.1) if pupils freeze on application.")],
               [(DB, "scaffold with a partner first (Turn and Talk)")]),
    # --- Settled item 7d
    "RT-A42": (S7D, [(ES, "but sentence stems and push-back questions are conditional teaching tools, not compulsory scripts or classroom-management routines, and the one Synthesise after the last discussion is the route's own beat.")],
               [(ES, "sentence stems, push-back questions and synthesis are conditional teaching tools")]),
    # --- Settled item 7e
    "RT-P10": (S7E, [(LD, "For starter, observe, apply and reflect units, `activity` is the actual pupil-facing prompt and must be written and reviewed as such; so is a skill `prepare` unit's `activity` in `explanation` mode, which is the explanation children read on the board, and a task lesson's `modelledOn`, the instance its teaching is shown on.")],
               []),
    "RT-Q27": (S7E, [(PACKET, 'ACTIVITY_IS_READ_PREPARE_MODES = {"explanation"}'),
                     (PACKET, "def activity_is_child_facing(unit: dict) -> bool:"),
                     (PACKET, "if activity_is_child_facing(unit): class_view_strings(content.get(\"activity\"), out)"),
                     (PACKET, '"enablingInput", "modelledOn", "checkpointQuestion",')],
               [(PACKET, "if unit.get(\"kind\") in ACTIVITY_IS_THE_TASK_KINDS:", "local")]),
    # --- Settled item 7f
    "RT-Q03": (S7F, [(VALIDATOR, "In maths \"\n                f\"the plain words are what the teacher wants ('{word}'); in other subjects name \"\n                f\"the move after them ('{word} - Where does the comma go?')")],
               [(VALIDATOR, "must begin with '{word}' and then \"\n                f\"name the move")]),
    "RT-Q05": (S7F, [(SKILL, "Run each concept's cycles together, in the order `concepts` lists them.")], []),
    "RT-Q09": (S7F, [(DIAL, "A Talk's `discussionQuestion` is its Stimulus's `question`, word for word.")], []),
    # --- Settled item 7g
    "RT-P07": (S7G + ": the pointer names its real section", [(LD, "(`teaching-sequence-skill-based.md` → Cycles, and the beats around them, `A step the method needs`)")],
               [(LD, "(`teaching-sequence-skill-based.md` → Teaching Sequence Specification, `A step the method needs`)")]),
    "RT-A48": (S7G + ": the discussion route's sources move to its own subsection", [], []),
    "RT-O07": (S7G + ": the researcher's name spelt right", [(ES, "(testing effect, Roediger & Karpicke)")], [(ES, "Karpyne")]),
    "RT-O01": (S7G, [(ES, "Purpose: a decision-support document for an AI agent designing lessons.")], [(ES, "designing lesson PowerPoints")]),
    "RT-D19": (S7G, [(SKILL, "This preserves the route's optional explanation, bounded pattern/method work, recognition-set establishment and the rare case where the criteria themselves genuinely need teaching.")],
               [(SKILL, "the existing route's optional explanation")]),
    "RT-J52": (S7G + ": three sources for entries that are gone come out", [(DB, "- Kagan, S. *Cooperative Learning Structures*. kaganonline.com — Rally Robin, Think-Pair-Share, Quiz-Quiz-Trade.")],
               [(DB, "*Pose Pause Pounce Bounce*"), (DB, "Rally Robin, Round Robin"), (DB, "conscience alley, role on the wall")]),
    # --- Settled items 7i and 7j
    "RT-P37": (S7I, [(LD, "keep one takeaway as key line, with the route on the board in whole sentences and said more fully in the script.")],
               [(LD, "keep one takeaway as key line, full spoken in script.")]),
    "RT-Q33": (S7J, [(VALIDATOR, "must carry the teaching as the child reads it: the route this teacher usually walks after the sentence the slide lands, the because or so that explains it, then an example on the board or what it does not mean")],
               [(VALIDATOR, "the route from what the class already has, through the thing on the board, to the sentence the slide lands")]),
    # --- The stories
    "RT-C34": ("story retired: " + ST, [], [(SKILL, "A Year 4 nearest-1,000 design put `3,462` and `3,500` in one My Turn")]),
    "RT-C36": ("story retired: " + ST, [], [(SKILL, "A Year 4 rounding deck bundled two roundings into one sentence")]),
    "RT-C05": (ST + "; his ruling stays without its date", [(SKILL, "A Year 4 rounding deck printed three spoken prompts on one Our Turn slide, and the teacher wanted the label, the question, the criteria and the number line and nothing else.")],
               [(SKILL, "nothing else (the user, 12 September 2026).")]),
    "RT-E14": ("story retired: " + ST, [], [(CONTENT, "A teeth slide that printed the same fact as its headline, in a card and as its star line gave a child one sentence three times")]),
    "RT-E51": (ST + "; the four script lines stay as plain examples; " + MOVED,
               [(CONTENT, "Script lines such as `He wasn't a king who could order everybody to obey him`, `It wasn't the ten-hour law`, `People sometimes call the whole front of their body their tummy, but the stomach is this one organ` and `'Small' is doing a rather misleading job in that name`, said and never shown, are that tell.")],
               [(CONTENT, "Both Week 4 lessons (22 September 2026) did exactly this on every Teach beat")]),
    "RT-E54": (ST + "; " + MOVED, [(CONTENT, "; the teacher's ruling: \"we want variety, and sometimes it's not relevant just stating the misconception\".")],
               [(CONTENT, "the teacher met it on four of five boards of one lesson on 22 September 2026")]),
    "RT-E58": (ST + ": the tooth slide leaves and its reason stays as a clause; his Tudor words stay without their date; " + MOVED,
               [(CONTENT, "A picture with a label and one fact lets a teacher reading the board aloud say where the thing is and nothing else, so the children learn a label rather than what it names."),
                (CONTENT, "A Year 4 history slide carried a photograph, `A Tudor farm household`, `England, 1485 to 1603` and one fact, with the route in the notes, and the user met it cold: \"the scene hasn't been set; there's nothing on the slide to guide me to know what to say.\"")],
               [(CONTENT, "A Year 4 science slide showed a tooth cross-section"), (CONTENT, "Then a Year 4 history slide (14 September 2026)")]),
    "RT-E62": (ST + ": the teeth slide's second telling; " + MOVED,
               [(CONTENT, "What the field is not is the landed sentence again in other words. The validator refuses the near-copy it can measure (the headline and the star line); a card that restates the headline with one detail added is yours to refuse.")],
               [(CONTENT, "a teeth slide carried `Incisors cut; canines help tear.` as its headline")]),
    "RT-E77": ("story retired: " + ST, [], [(CONTENT, "which is how a Year 4 science launch came to spend four tenths of its slide on prose about two cards")]),
    "RT-I12": (ST + "; its reason stays", [(DB, "A sort has a field for its handling and a written task does not, so preparation can end up decided by which beat happens to have a schema slot.")],
               [(DB, "A Year 4 history beat on 17 September 2026 gave every child a printed record to complete")]),
    "RT-N05": ("story retired: " + ST, [], [(MF, "The blank alone used to count as enough wherever the teacher could draw live")]),
    "RT-N08": (ST + "; its reason stays", [(MF, "Left completely bare, the helper is a surface waiting for someone who already knows the lesson, and a teacher meeting it cold has to invent the demonstration.")],
               [(MF, "a Year 4 nearest-1,000 model put `Find the two multiples of 1,000 either side of 3,462` above a line with nothing on it")]),
    # --- Rows an earlier release changed after the ledger's snapshot
    "RT-C27": (A7 + " (SA-G20, routes 7k)", [(SKILL, "It is the knowledge route's Teach beat with the same fields, so it lands its sentence, usually as the `headline`, and can ask a question that makes the class look while it runs.")], []),
    "RT-E12": (A7 + " (PF-Q14, routes 7h)", [(CONTENT, "Once means once: the landed sentence is usually the `headline`, and it is there rather than at the foot of the slide because it is the first thing a child reads; never twice, and never again in the `explanation`.")], []),
    "RT-E13": (A7 + " (PF-Q14)", [(CONTENT, "A beat that lands its sentence last is written with a `takeaway` instead, under `The landed sentence usually leads the board` below.")], []),
    "RT-E40": (A7 + " (SA-H10)", [(CONTENT, "**The landed sentence usually leads the board.** It usually goes in the `headline`, because that is the first line a child reads and the largest line the builder draws, and a class that reads the destination first has something to hang the next four minutes on; that is how this teacher usually explains, not a rule for every slide.")], []),
    "RT-E41": (A7 + " (SA-H13: the file's history left, its reason stays as a clause)", [(CONTENT, "Whatever leads, the top line is never a caption of the picture: a child can already see what the picture shows. What they cannot see is why, and that is what the top line is for.")], []),
    "RT-E42": ("story retired: " + A7 + " (SA-H13, copied to the build log first)", [], [(CONTENT, "A Year 4 history beat took it on 17 September 2026")]),
    "RT-E44": (A7 + " (SA-H14)", [(CONTENT, "A `takeaway` referencing a sticky fact lands it last, as the star line. It is the shape for a beat that deliberately withholds its fact until children have reached it (a discovery route, or a comparison whose point is that they see it themselves), and a choice wherever the fact reads better last.")], []),
    "RT-J06": (A7 + " (SA-D13, D28)", [(DB, "**Best for:** the starter of lesson 2+ in a sequence, when the teacher requests mixed retrieval or the wider sequence gives it a clear purpose and children have enough security to choose productively between methods or knowledge (`preferences.md` → Starters)."),
                                     (DB, "**Best for:** mid-unit lessons where prior topics matter, when the teacher requests mixed retrieval or the wider sequence gives it a clear purpose and children have enough security to choose productively between methods or knowledge (`preferences.md` → Starters).")], []),
    "RT-P12": (A7 + " (SA-K02, routes 7b)", [(LD, "Populate top-level `ending` object (`ending.kind` = \"Reflect\" for Reflect, `ending.beat` carrying source unit) - structured ending contract authoritative.")], []),
    "RT-P13": (A7 + " (SA-J15, the maths Apply line)", [(LD, "- Maths: reasoning and problem solving are `practise` beats placed as `subject-maths.md` says; the last is the Apply only when it closes the lesson and asks more than the Your Turns did.")], []),
    "RT-P19": (A7 + " (SA-J42 and PF-V11, routes 7f's designer half)", [(LD, "`Still part of the lesson`, or `Apply` outside maths, where the teacher wants the plain words `My Turn`, `Our Turn`, `Your Turn`, `Answers` and `Apply`)")], []),
    "RT-L20": (SJ + " (its decisions 1 and 3: the subject-English hedge went)", [(RP, "- English may compare effects, justify structural choices or reason from textual evidence.")],
               [(RP, "Until a subject-English file exists, keep the detailed reading, writing and grammar guidance below active.")]),
}

# Rows whose words stand, moved under one of the two new headings (decisions 3
# and 4). Their pins name the new section.
MOVED_ROWS = ["RT-E46", "RT-E47", "RT-E48", "RT-E50", "RT-E52", "RT-E55", "RT-E56", "RT-E57",
              "RT-E60", "RT-E61", "RT-E63", "RT-E71", "RT-E72", "RT-E73", "RT-E74", "RT-E75", "RT-E76"]

ADDED = [
    ("RT-ADD-13B", B13 + "; written in the home and its three pointers in the same words; the reviewer's line also says the program cannot see whether the criteria show one",
     [(PREF, "A short beat children can start from its question alone, and a task whose product this lesson has already shown them a good one of, need none of this. " + T13B[0].upper() + T13B[1:] + "."),
      (LD, "the steps, on the board; " + T13B + " (`preferences.md` → Slide Philosophy, `Giving a task its instructions is not launching it`)."),
      (LD, "or why its question alone is enough (" + T13B + ")."),
      (REV, "; " + T13B + ", and the program cannot see whether they do, so judge that from the criteria beside the task"),
      (VALIDATOR, "His preferences decision 13b lets criteria that already show a good one stand in for the good instance")]),
    ("RT-ADD-REVIEWER-LAUNCH", D2 + "; carried into the reviewer's launch line in this release (the lead's item 6 after the first check), where 7B's B10 was to write it: its trigger no longer asks whether the product's form is new to the lesson",
     [(REV, "- a substantial task is launched before it is instructed: when the class has not yet seen a good one of this product earlier in this lesson or the enabling input ran to several units, the unit's `launch` carries what the lesson has established, a good instance beside a weak one, and the steps, and a null `launch` is right only when children can begin from the question alone or the class has already seen a good one of this product earlier in this lesson;")]),
    ("RT-ADD-READ", D34 + "; the designer reads the two sections with the bundled reader when its route is not the content route, beside its success-criteria read line",
     [(LD, "**How this teacher explains, and the launch, in every route.** The content route's file writes both once, and a lesson on another route reads only those two sections, not the file. When your route is not content-based and the lesson has a beat that explains (a skill `teach` or a `prepare` in `explanation` mode, a task `teach-needed`, a discovery `teach-why`, a dialogic `grounding-input` that explains), read `teaching-sequence-content-based.md::How this teacher explains` with `read-reference.py --select`. When it launches a substantial task (a task `do-task`, a skill `practise`), read `teaching-sequence-content-based.md::The launch` the same way.")]),
    ("RT-ADD-POINTERS", D34 + "; the reviewer's four-parts line, the preferences' pointer and the voice guide's §5 name the heading",
     [(REV, "Read each Teach board for the four parts the teacher teaches in (" + HOW + "): the takeaway, the because or so, the example the class looks at, and what it does not mean."),
      (PREF, "(" + HOW + " owns the four parts and their exceptions)"),
      (TV, "An explanation usually goes the way this teacher explains (" + HOW + "); that is how he usually explains, not a template.")]),
    ("RT-ADD-POINTER-LINES", D34 + "; the content route's Teach and Practise point to the two sections, which sit last so each is read whole on its own",
     [(CONTENT, "`explanation` is written the way this teacher explains: `How this teacher explains`, below."),
      (CONTENT, "`launch` is written as `The launch`, below, says.")]),
]

HOMES = [
    (CONTENT, "### How this teacher explains", "HOME-RT-HOW"),
    (CONTENT, "### The launch", "HOME-RT-LAUNCH"),
]


def ledger_rows():
    out = {}
    for raw in (REPO / "plans" / LEDGER).read_text(encoding="utf-8").splitlines():
        m = re.match(r"^\| (RT-[A-Z]\d{2}) \|", raw)
        if not m:
            continue
        p = P.search(Q.sub("", raw))
        if p:
            out[m.group(1)] = (p.group(1), Q.findall(raw))
    return out


def main():
    rows = ledger_rows()
    changed = {}
    problems = []
    for rid, (outcome, present, absent) in ROWS.items():
        if rid not in rows:
            problems.append(f"{rid}: not a row of the ledger")
            continue
        rel, quotes = rows[rid]
        standing = [(rel, q) for q in quotes if norm(q) in text_of(rel)]
        changed[rid] = (outcome, standing + [p for p in present if p not in standing], absent)
    for rid in MOVED_ROWS:
        rel, quotes = rows[rid]
        standing = [(rel, q) for q in quotes if norm(q) in text_of(rel)]
        if len(standing) != len(quotes):
            problems.append(f"{rid}: mapped as moved but a quote no longer stands")
        outcome = MOVED
        if rid == "RT-E48":
            outcome += ("; its dated story (three science boards, 22 September 2026) stays with it, because no "
                        "decision named it; it is already in the build log, and a later tidy-up takes it out")
        changed[rid] = (outcome, standing, [])
    # A row whose quotes no longer stand must be mapped.
    for rid, (rel, quotes) in rows.items():
        if any(norm(q) not in text_of(rel) for q in quotes) and rid not in changed:
            problems.append(f"{rid}: changed but not mapped")
    # A moved row's pin must be under its new heading.
    for rid in MOVED_ROWS:
        rel, quotes = rows[rid]
        for q in quotes:
            home = ledger_mapping.home_of(rel, q)
            if not home or home["heading"] not in ("### How this teacher explains", "### The launch"):
                problems.append(f"{rid}: not under a new heading: {q[:60]}")
    if problems:
        print("\n".join(problems))
        raise SystemExit(f"MAPPING_FAILED {len(problems)}")

    pins_path = ledger_mapping.ROOT / PINS
    mapping_path = Path(_root.MAPPING_OUT) if _root.MAPPING_OUT else REPO / "plans" / MAPPING
    print(f"writing {pins_path}")
    print(f"writing {mapping_path}")
    build(ledger=LEDGER, prefix="RT", changed=changed, added=ADDED, homes=HOMES, pins=PINS, mapping=str(mapping_path),
          title="The teaching routes and pedagogy references: mapping for the routes release (topic 8, release 3)",
          snapshot="59f85708 (4.2.293) plus the routes release, built on the side branch streamline/8-routes",
          intro=["Every row of `2026-09-23-routes-ledger.md` and where it lives after the routes release. Built by "
                 "`streamline-tools/rt-change/build_rt_mapping.py`; the pins are "
                 "`plugins/lesson-v4/scripts/tests/routes_ledger_pins.json`, checked by `test_routes_ledger_is_kept.py`. "
                 "His words are in the ledger's \"Decisions taken\". Release 4 (one copy of each rule) extends both."])

    data = json.loads(pins_path.read_text(encoding="utf-8"))
    # A wording meant to be gone everywhere that another file still holds is a
    # copy the release missed, never a pin to quietly narrow; a phrase gone in
    # any case is barred in any case.
    everywhere_files = sorted(set(ledger_mapping.RUNTIME) | set(ledger_mapping.PROGRAMS))
    for row in data["rows"]:
        spec = ROWS.get(row["id"], (None, [], []))[2]
        for pin, meant in zip(row["absent"], spec):
            if (len(meant) < 3 or meant[2] != "local") and not pin["everywhere"]:
                problems.append(f"{row['id']}: meant to be gone everywhere, still somewhere: {pin['text'][:90]}")
            own = ledger_mapping.ROOT / pin["file"]
            files = sorted(set(everywhere_files) | {own}) if pin.get("everywhere") else [own]
            needle = pin["text"].lower()
            if all(needle not in norm(path.read_text(encoding="utf-8")).lower() for path in files if path.exists()):
                pin["anyCase"] = True
    if problems:
        print("\n".join(problems))
        raise SystemExit(f"MAPPING_FAILED {len(problems)}")
    data["movedRows"] = MOVED_ROWS
    # The pin file takes the line endings its siblings have in this checkout.
    sibling = ledger_mapping.ROOT / "scripts" / "tests" / "teach_then_do_ledger_pins.json"
    body = json.dumps(data, indent=1, ensure_ascii=False) + "\n"
    with open(pins_path, "w", encoding="utf-8", newline="") as handle:
        handle.write(body.replace("\n", "\r\n") if b"\r\n" in sibling.read_bytes() else body)
    mapping = mapping_path.read_text(encoding="utf-8")
    with open(mapping_path, "w", encoding="utf-8", newline="") as handle:
        handle.write(mapping.replace("\r\n", "\n"))
    print(f"MAPPING_OK {len(data['rows'])} pins; {len(ROWS)} rows changed and {len(MOVED_ROWS)} moved")


if __name__ == "__main__":
    main()
