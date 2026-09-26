"""Release 7A (4.2.293): the mapping and the pins for the starters, sticky
knowledge and Apply ledger (`SA-`, 390 rows), and the rows of the other topic 7
list (`PF-`) that 7A changed.

Every changed `SA-` row names the decision that changed it (his words are in the
ledgers' "Decisions taken" sections) and the words that now carry it, and each
retired wording is barred (everywhere, programs included, unless marked
"local"). Rows whose quotes still stand are pinned where they are. The homes
are pinned paragraph by paragraph. The `PF-` rows 7A changed are in `PF_ROWS`,
which release 7B's builder imports for its own pin file (as 7A imports the four
`SA-` rows from the colours release's `COLOURS_ROWS`), and they are pinned here
too. Rows of the later topics' ledgers (routes, reviewer, playbook, voice) that
7A changed are listed in `OTHER_LEDGER_ROWS` for their releases; they carry the
same lines as rows pinned here.

    python -X utf8 plans/streamline-tools/7a-change/build_7a_mapping.py

Writes `plugins/lesson-v4/scripts/tests/starters_sticky_apply_ledger_pins.json`
and `plans/2026-09-26-starters-sticky-apply-mapping.md` in the copy this file
sits in (both printed before writing)."""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
sys.path.insert(0, str(HERE.parent / "colours-change"))
sys.path.insert(0, str(HERE))
import _root  # noqa: E402  (a replay on a scratch copy sets LESSONV4_PLUGIN_ROOT)
import ledger_mapping  # noqa: E402
from ledger_mapping import P, Q, REPO, absent_everywhere, build, norm, pin_of, text_of  # noqa: E402
from build_colours_mapping import COLOURS_ROWS  # noqa: E402

LEDGER = "2026-09-23-starters-sticky-apply-ledger.md"
PF_LEDGER = "2026-09-23-preferences-rest-ledger.md"
PINS = "scripts/tests/starters_sticky_apply_ledger_pins.json"
MAPPING = "2026-09-26-starters-sticky-apply-mapping.md"

PREF = "references/preferences.md"
LD = "agents/lesson-designer.md"
OT = "references/output-template.md"
REV = "agents/design-reviewer.md"
SD = "agents/slide-designer.md"
TMPL = "references/templates.md"
DOBEATS = "references/do-beats.md"
CONTENT = "references/teaching-sequence-content-based.md"
SKILL = "references/teaching-sequence-skill-based.md"
SSC = "references/slide-success-criteria.md"
WALLD = "agents/working-wall-designer.md"
WALLR = "agents/working-wall-designer-focused-repair.md"
WALLP = "references/working-wall-preferences.md"
PB = "skills/make-lesson/playbook-lite.md"
LOG = "references/build-review-log.md"
VALIDATOR = "scripts/validate-lesson-design.py"
SCAFFOLD = "scripts/lesson-design-scaffold.py"
PACKET = "scripts/design-review-packet.py"
TALL = "builder/src/templates/starter-question-tall.js"
GRID = "builder/src/templates/grid-calc.js"
BVALIDATE = "builder/src/validate.js"
CHECK = "builder/scripts/check-slide-design.js"
WALL_LAYOUT = "working-wall-html/src/layout.js"
CONTRACT_TEST = "scripts/tests/test_lesson_design_contract.py"

# --- the decisions, in his words (the ledgers' "Decisions taken") ---------------------

S1 = ("SA settled item 1, his words \"get rid of the 'will return' stuff, it needs to be like it didnt even exist\": "
      "every trace an agent reads goes, and the always-empty slot with the checks and tests that name it")
S2 = "SA settled item 2, his words \"keep with small fix\": the rule stays, and its short copies carry both exceptions"
D3 = ("SA decision 3, his \"Yes\": a question about today opens instead of recall only when the recall would be empty "
      "or the brief says the surface is already easy, and it stays a question children think and talk about, never a "
      "prediction or the task explained")
S4 = ("SA settled item 4, his \"yes\", on his 19 September ruling \"Just the starter heading that's underlined is "
      "enough\": nothing prints under \"Starter\" except a question or instruction the starter deliberately carries")
S5 = ("SA settled item 5, his \"yes\": a sticky fact the teacher's plan lists is judged like anything else it offers, "
      "and kept when he marks it as required")
S6 = ("SA settled item 6, turned round: \"I dont think this needs to be a clear rule like 'sticky klnowledge statement "
      "always at top' ... That doesn't mean every slide I wanted was this structure\", with the corrected read-back "
      "(the because or so explains the one key point) and the routes list's 7h and 7k (\"usually at the top, as you "
      "usually explain, not a fixed rule\")")
D7 = ("SA decision 7, his \"Yes\": the lesson's own words on the wall, shortened only when they genuinely cannot fit, "
      "and then still a whole sentence a teacher would say")
D9 = ("SA decision 9, his \"yes\": the ready-made reason stays for a lesson whose learning is a fact or a method; a lesson "
      "that named an idea says where the idea met a case it was not taught on, or earns an Apply that takes it there; "
      "the reviewer reads the Apply rules when such a lesson has no Apply and its reason does not say where")
S11 = ("SA settled item 11, his \"yes\": in maths, reasoning and problem solving are practise beats placed as the "
       "maths file says, and the last is the Apply only when it closes the lesson and asks more than the Your Turns did")
S12 = "SA settled item 12, his \"yes\": out-of-date text corrected, no rule changed"
FOLD = "the fold (move before reword): one home, the copy becomes a pointer that keeps its conditions"
A07 = ("folded under SA-A07: the two mixed-retrieval formats carry A07's conditions in its own words and point at "
       "Starters")
N2 = ("SA neighbour note N2 with PF settled item 14 (his \"yes\"): the main independent work is numbered in maths only, "
      "and the labels are purple, as the code draws them")
PF1 = ("PF settled item 1, his \"yes and yes\", on his 19 September ruling that in maths the plain words `My Turn`, "
       "`Our Turn`, `Your Turn`, `Answers`, `Apply` are the titles")
PF20 = ("PF decision 20, his words \"Is there a thing that says that if I've provided a lot of things that it suggests "
        "what the second lesson should contain? If so, I think that should come out because it already knows how much "
        "it can fit in one lesson\", then \"yes and yes\": the Lesson 2 plan goes; a lesson that left something out "
        "says what in one line of the walk-through's closing decisions")
Q2 = ("the change plan's question 2, his \"yes\": today's lesson still ends on its main idea while it is fresh, and "
      "what the next lesson opens with comes out")
PF21 = "PF decision 21, his \"yes\": `Practise` stays a slot name to replace, and the slide check flags it"
PF22 = ("PF decision 22, its wording half, his \"yes\": the wall keeps children's sentences whole, a bigger (no-picture) "
        "or second card rather than a clipped one")
PF14 = "PF settled item 14, his \"yes\": out-of-date text corrected to match his rulings or the program"
WALL_ORDER = ("his answer of 26 September 2026 on a wall card whose sentence does not fit, asked whether the order "
              "should be the picture a little smaller first, then a bigger or second card, the picture off only when "
              "nothing else fits, and a sentence never cut: \"answer to your wall question, I guess, but I rarely also "
              "use cards with no picture or helper, so?\"; the build shrinks the picture a little, a list goes over a "
              "second card, and the picture comes off only when nothing else fits")
STICKY_THIRD = ("his answer of 26 September 2026 on a sticky fact too long to sit beside its photo, asked whether "
                "the photo should shrink further, to about a third of the card, so the whole sentence fits beside it; "
                "only then the sentence rewritten as a shorter whole sentence; the photo off only as the very last move: "
                "\"yys\" (yes); the photo narrows to about a third and the fact runs to three lines at the floor size")
ONE_LONG = ("his answer of 26 September 2026 on how many long facts one wall card holds, asked whether a long fact "
            "may run to three lines but a card holds only one of them, any other going on a second card: \"yes\"")
ST = "stories leave for the build log (copied there first by a1), reasons stay"
COLOURS = "changed by the colours release (7C, 4.2.292, committed before 7A); its pins are the colours release's own"

# --- the words that now carry each changed SA row ------------------------------------

NEW_STARTERS_LINE = ("History, Geography and Science usually retrieve prior content (a fact, a definition, a labelled "
                     "diagram); a question the lesson will answer opens instead only in the two cases above, when the "
                     "retrieval would be empty or the brief says children already find the surface easy.")
NEW_SUBJECT_BULLET = ("- **History / Geography / Science** — retrieval of a prior fact, definition, or diagram; or, only "
                      "when that retrieval would be empty or the brief says children already find the surface easy, a "
                      "hook question the lesson will answer, which stays a question children think and talk about, "
                      "never a prediction or the task explained.")
A07_WORDS = ("when the teacher requests mixed retrieval or the wider sequence gives it a clear purpose and children "
             "have enough security to choose productively between methods or knowledge (`preferences.md` → Starters).")
STICKY_POINTER = ("`preferences.md` → Sticky Knowledge is the home: read it before naming a sticky fact. This section "
                  "adds the test's two examples, how you record the facts, and three rules for the slides that carry them.")
TRACE = ("In a knowledge subject it is too narrow, because the facts are the learning and a task-shaped objective can "
         "be met without them, so trace each one forward to the stage that needs it:")
IDEA_HOME = ("A sticky fact is not where an idea goes: `tiny pewter plates were made for play` was a lesson on "
             "continuity and change filed as a fact, and the idea then had nowhere to live; `concepts` is where it "
             "lives, in every route.")
RECORD = ("Record when each fact appears through the reference on each unit (`stickyKnowledgeRefs`): which part of "
          "the lesson it belongs to, not where on the slide, which is the slide designer's decision.")
LEFT_OFF = ("A fact that would reveal the thinking a later task requires is left off that task, unless the task "
            "genuinely needs it as a reference.")
PHRASING = ("**Phrasing consistency.** When a sticky fact corresponds to a Teach slide's key sentence, use the same "
            "wording in both places: children encode the phrase during teaching, and meeting the same phrase again as "
            "a reference strengthens the trace. If it is the same idea, write it identically. The repetition is across "
            "slides: the phrase on the Teach matches the later Practise reference, the worksheet, the Apply and the "
            "working wall, where it is shortened only when it genuinely cannot fit, and then is still a whole sentence "
            "a teacher would say. It does not mean the sentence appears twice on one slide.")
SETTLED5 = ("When the teacher's plan lists sticky facts, judge them like anything else it offers, and keep one the "
            "teacher marks as required. Else decide core rule/definition/fact everything hangs on. Short, "
            "child-readable. Reference/retention anchor.")
H09_NEW = ("When Teach carries sticky and key sentence same idea, that's one entry on that slide, not two: write it "
           "once, as the headline or as the star line, never both (`teaching-sequence-content-based.md` → `The landed "
           "sentence usually leads the board`). Don't restate as separate key sentence.")
LEADS = ("**The landed sentence usually leads the board.** It usually goes in the `headline`, because that is the "
         "first line a child reads and the largest line the builder draws, and a class that reads the destination "
         "first has something to hang the next four minutes on; that is how this teacher usually explains, not a rule "
         "for every slide.")
MECHANISM = ("When that sentence is one of the lesson's sticky facts, the headline still carries it and `takeaway` "
             "stays `null`, and this unit leaves the fact out of its own `stickyKnowledgeRefs`: the slide prints a "
             "referenced fact again as its star line, and the class reads one sentence twice, so the validator refuses "
             "the pair. The later beats that use the fact reference it, which is where it is still available.")
CAPTION = ("Whatever leads, the top line is never a caption of the picture: a child can already see what the picture "
           "shows. What they cannot see is why, and that is what the top line is for.")
WITHHOLDS = ("A `takeaway` referencing a sticky fact lands it last, as the star line. It is the shape for a beat that "
             "deliberately withholds its fact until children have reached it (a discovery route, or a comparison whose "
             "point is that they see it themselves), and a choice wherever the fact reads better last. The headline is "
             "then the move the class is making (`Two children, one pit, two different days`), never a description of "
             "the picture, and the fact lands at the end where it was earned.")
ONCE_CONTENT = ("Once means once: the landed sentence is usually the `headline`, and it is there rather than at the "
                "foot of the slide because it is the first thing a child reads; never twice, and never again in the "
                "`explanation`. A beat that lands its sentence last is written with a `takeaway` instead, under `The "
                "landed sentence usually leads the board` below.")
OT_ONCE = "A Teach slide lands its sentence once, usually at the top."
OT_TAKEAWAY = ("A `takeaway` referencing a sticky fact lands it last, as the star line: the shape for a beat that "
               "withholds its fact until children have reached it, and a choice where the fact reads better last, and "
               "the headline then names the move the class is making rather than the picture "
               "(`teaching-sequence-content-based.md`, Teach):")
SSC_ONCE = ("When a slide's sticky-knowledge fact is the same sentence as the slide's Teach key sentence, render the "
            "sentence once, never twice: as the headline when the unit's headline carries it, and with its "
            "sticky-knowledge treatment (the ✨ marker, or whatever the template provides) as the star line when the "
            "unit references it.")
SSC_BETWEEN = ("The cross-slide repetition the \"phrasing consistency\" rule in `preferences.md` → Sticky Knowledge "
               "asks for happens *between* slides; on one slide, one render.")
SKILL_LANDS = ("It is the knowledge route's Teach beat with the same fields, so it lands its sentence, usually as the "
               "`headline`, and can ask a question that makes the class look while it runs.")
SKILL_SURVIVES = "A Teach beat leaves something the child should still know at the end, which is why it lands a sentence."
WALL_LEAD = ("**Prose a child reads stays a whole sentence; a contract a child checks against stays word for word.**")
WALL_FREE = ("Free-standing prose that no child is matching word for word (a worked-example modelled sentence, a "
             "sentence stem's framing) may be tightened to come inside the card's budget, keeping the same meaning, "
             "the same characters, the same operation or setting, and every protection the sentence carries, never "
             "to a clipped phrase.")
WALL_DEFINITION = ("A vocabulary definition is the lesson's own sentence and keeps the lesson's wording; only when it "
                   "genuinely cannot fit may it be shortened, and then it stays a whole sentence a teacher would say, "
                   "never a clipped phrase. So does a sticky-knowledge statement.")
WALL_ROOM = ("Making room is the *first* move when an item overruns, not the last: the build narrows the picture (a "
             "sticky fact's photo to a third; one such fact a card), then a list goes over a second card, then a shorter "
             "whole sentence; the "
             "picture comes off last (his walls rarely have a card without one).")
WALL_BUDGET = ("A worked-example step you write that runs past its budget is not a formatting problem to fix later: it "
               "is a sentence that was never going to read from the back of the room.")
WALL_LESSON_SENTENCE = "A sentence the lesson wrote makes room first (rule 8)."
WALLP_FREE = ("A card makes room before any sentence is shortened, in the teacher's order: the build narrows its "
              "picture (a sticky fact's photo down to about a third of the card, so the whole sentence fits beside it), "
              "a list carries over to a second card, only then is a sentence shortened, to a whole sentence, and the "
              "picture comes off last of all, because a card with no picture or helper is rare on his walls. Free-standing prose nobody is matching word for word (a modelled "
              "sentence, a stem's framing) may then be tightened to fit the card, keeping the meaning and every "
              "protection it carries, and it stays a whole sentence, never a clipped phrase.")
WALLP_STICKY = ("A sticky-knowledge fact is the same: the lesson's own words, shortened only when they genuinely cannot "
                "fit, and then still a whole sentence a teacher would say.")
WALLP_LEAD = ("**5. Prose a child reads stays a whole sentence; a contract a child checks against stays word for word.** "
              "What has to stay word for word is what a child compares board against wall: success criteria steps, "
              "reference-table columns, a misconception's \"Don't\"/\"Do\" pair.")
WALLP_ROW = ("≤ 62 characters on a card carrying a picture, and about 72 characters once the build has shrunk the "
             "picture a little; beside a photo, about 106 characters once the photo has narrowed to about a third of "
             "the card and the fact runs to three lines. A card with no picture has the full width, about 106 characters, and a text-led card may "
             "use it.")
APPLY_WHY = ("One whose learning is a fact or a method may say its Your Turn and answers were enough; one that named an "
             "idea says where the idea met a case it was not taught on (usually its Practise, on evidence children had "
             "not seen), or earns an Apply that takes it there.")
APPLY_JUDGE = ("Judge the synthesis against the learning the lesson named, not only the performance the objective "
               "names; the lesson names it in the read-back sentence that closes the walk-through and in its sticky "
               "knowledge. Keep useful rehearsal within practice, and omit the ending when practice already draws on "
               "the intended learning. A Your Turn that shows the performance while a sticky fact or a taught "
               "understanding sits outside it has not synthesised the lesson. The repairs, in order: reshape the "
               "final task so it draws on that learning, because the ending exists to draw together what was built; "
               "earn an ending as the check for learning a personal or product task honestly cannot carry; drop the "
               "learning from the lesson's claims only when it was never today's (`What a Lesson Is For`).")
APPLY_REST = ("The rest of it, what an Apply has to be to earn its place, the shapes it can take and how it is "
              "recorded, lives in the Apply Slide section of the lesson-designer agent.")
APPLY_POINTER = ("`preferences.md` → The Apply Slide owns when practice already draws on the intended learning, what "
                 "that learning is, and the repairs in order.")
MATHS_APPLY = ("- Maths: reasoning and problem solving are `practise` beats placed as `subject-maths.md` says; the last "
               "is the Apply only when it closes the lesson and asks more than the Your Turns did. Then Apply mixes "
               "day's skill with problem-solving - one extended question or small set mixed-context where children "
               "decide which method applies. Or reasoning prompt from `reasoning-prompts.md` - convince me, "
               "always/sometimes/never, prove it.")
NOT_INCLUDED = ("When not included, say explicitly why. For a lesson whose learning is a fact or a method, \"Your Turn "
                "and answers is sufficient AFL here - no distinct synthesis task is needed\" is complete "
                "justification. A lesson that named an idea in `concepts` says where the idea met a case it was not "
                "taught on (usually its Practise, on evidence children had not seen), or earns an Apply that takes it "
                "there (`preferences.md` → The Apply Slide).")
PLAIN = "`My Turn`, `Our Turn`, `Your Turn`, `Answers` and `Apply`"
K02_NEW = ("Populate top-level `ending` object (`ending.kind` = \"Reflect\" for Reflect, `ending.beat` carrying source "
           "unit) - structured ending contract authoritative.")
SPLIT_HOME = ("When it is two lessons, split at the natural seam: teach and consolidate the knowledge today, ending on "
              "the lesson's core idea while it is still fresh. The reason is how working memory leaves a lesson: the "
              "last thing children hold should be the idea the lesson was built to land, not the hardest task "
              "attempted when their attention and stamina are already spent.")
SPLIT_RECORD = ("When a split is chosen, today's lesson teaches what fits properly and says in one line of the "
                "walk-through's closing decisions what it left for another lesson; it does not plan that lesson.")
SPLIT_LD = ("If not fit, today teaches/consolidates knowledge and ends on its core idea. See `preferences.md` → How "
            "Much Fits. If it left something out, say what in one line of the walk-through's closing decisions; never "
            "plan the next lesson.")
TEST_QUESTION_REV = ("- a named test question is practised at the same structure, scale, response form and demand, "
                     "with fresh content while the real item is held for a later test, unless the teacher explicitly "
                     "asks for that exact item; a suitable real question that is not being held may be used itself.")
APPLY_TRIGGER = ["\"Read when Apply may be unearned or repeat Your Turn, and when a lesson \"",
                 "\"that named an idea has no Apply and its reason does not say where the \"",
                 "\"idea met a case it was not taught on.\","]

# (outcome, [(file, words now)], [(file, retired words[, "local"])])
SA_ROWS = {
    "SA-C01": (D3, [(PREF, NEW_STARTERS_LINE)],
               [(PREF, "usually retrieve prior content (a fact, a definition, a labelled diagram) or set up a question the lesson will answer")]),
    "SA-C04": (D3, [(PREF, NEW_SUBJECT_BULLET)],
               [(PREF, "retrieval of a prior fact, definition, or diagram; or a hook question the lesson will answer.")]),
    "SA-D13": (A07, [(DOBEATS, "**Best for:** the starter of lesson 2+ in a sequence, " + A07_WORDS)],
               [(DOBEATS, "**Best for:** the starter of lesson 2+ in a sequence.", "local")]),
    "SA-D18": (N2, [(PREF, "- **Question Labelling** — bracketed labels for the starter in every subject and for the main independent work in maths only, plus lettered multi-question Maths Our Turn work;")],
               [(PREF, "bracketed labels only for starter and main independent work")]),
    "SA-D19": (N2 + "; the sentences a builder test holds stay word for word, the maths limit beside them",
               [(TMPL, "Use only on starter and main independent work slides (the main independent work is numbered in maths only: `preferences.md` → Question Labelling)"),
                (TMPL, "Use `question-cards` only for a starter or, in maths, a main independent question set."),
                (TMPL, "Both helpers are restricted to a starter or the lesson's main independent work in maths.")],
               [(TMPL, "Use `question-cards` only for a starter or main independent question set.")]),
    "SA-D20": (N2, [(TMPL, "Add `questionNumbering` only when the row belongs to a numbered starter, a numbered main independent task in maths, or a multi-question Maths Our Turn.")],
               [(TMPL, "a numbered main independent task or a multi-question Maths Our Turn", "local")]),
    "SA-D28": (A07, [(DOBEATS, "**Best for:** mid-unit lessons where prior topics matter, " + A07_WORDS)],
               [(DOBEATS, "**Best for:** mid-unit lessons where prior topics matter.", "local")]),
    "SA-E08": (S4 + "; the PSHE deck's story is in the log (2 September 2026) and leaves the catalogue",
               [(TMPL, "Only a `heading` the starter deliberately carries, a question or instruction of its own, prints under it: the builder puts it on a full-width line underneath the label, at slide-title size, where a question is actually readable - so `heading: \"What do you remember about PSHE?\"` renders as **Starter** with the question below it and the starter's questions below that."),
                (TMPL, "A `title` never prints there, because the teacher wants the underlined heading alone: \"Just the starter heading that's underlined is enough.\""),
                (TMPL, "A `heading` of exactly \"Starter\" adds no second line.")],
               [(TMPL, "Give the slide a `title` (or a `heading`) as normal"),
                (TMPL, "Before this, a title in that slot replaced the word \"Starter\""),
                (TMPL, "A `title` of exactly \"Starter\" adds no second line.")]),
    "SA-E13": (S12 + " (maintainer text: its must-not stays)",
               [(TMPL, "(A `lesson-cover` template exists in the builder and is exercised only by build-test fixtures. Leave it out of real lessons, and don't reintroduce it to this catalogue as a recommended choice.)")],
               [(TMPL, "still exists in the builder for historical reasons")]),
    "SA-E25": (S4, [(TMPL, "- `heading` - the starter's own prompt, when it deliberately carries one, drawn under the fixed \"Starter\" heading in the left column; a `title` never prints there.")],
               [(TMPL, "- `title` — the starter's own prompt", "local")]),
    "SA-F01": (S2, [(PREF, "- **Practising a Test Question** — fresh questions at the test's exact demand and form; the real item stays out of the lesson while it is held for a later test, unless the teacher explicitly asks for that exact item.")],
               [(PREF, "the real item stays out of the lesson.", "local")]),
    "SA-F09": ("retired by " + S1, [], [(OT, "testQuestionPath")]),
    "SA-F10": ("retired by " + S1, [],
               [(OT, "testQuestionPath"), (OT, "will return to it"),
                (OT, "is parked while its question source is rebuilt")]),
    "SA-F11": (S1, [(TMPL, "**Purpose:** A starter built around one tall portrait image the children read from.")],
               [(TMPL, "scanned question")]),
    "SA-F13": (S1 + "; then the first check's question on the tall-picture starter, answered by the lead: its two examples read like the removed test-question slide, so they become an ordinary starter from a saved deck (the Year 4 science starter Teeth and their jobs, `output/working/name-the-layers-of-teeth`, and its check slide); the `question` slot's name is code and stays",
               [(TMPL, "Right side is one full-height zone for the image."),
                (TMPL, "(for example, \"Which teeth cut food?\") or nothing; on the answer slide the answer in green via the `||` marker (e.g. `{ \"type\": \"text\", \"text\": \"||Incisors cut food.\" }`).")],
               [(TMPL, "full-height zone for the question image"),
                (TMPL, "(for example, \"Answer the question.\")", "local"),
                (TMPL, "||350 millilitres", "local")]),
    "SA-G04": (FOLD + ": G09's \"trace each one forward to the stage that needs it\" joins the home's knowledge-subject sentence",
               [(PREF, TRACE)], []),
    "SA-G08": (FOLD + ": the designer's copy of G02 and G03 goes and the home keeps G03's wording (all three, the ending only in place of the final task); the designer's section points at the home",
               [(LD, STICKY_POINTER),
                (PREF, "Naming one is a claim that it is part of today's learning, and the lesson has to make good on the claim: the fact is taught, a later stage needs it, and the final task draws on it, or an earned ending checks it where the final task honestly cannot.")],
               [(LD, "drawn on by the final task, or checked by an earned ending where the final task honestly cannot carry it"),
                (LD, "Sticky Knowledge owns the why and the RE case")]),
    "SA-G09": (FOLD + ": its first sentence is G04 in the home, and its clause joins the home",
               [(PREF, "\"For children to succeed at this LO, they need to know this\" is still the right test in a skill lesson, where the facts are the method's foundations."),
                (PREF, TRACE)],
               [(LD, "In a skill lesson the test is still: for children to succeed at LO, they need this.")]),
    "SA-G12": (FOLD + ": moved to the home in its own words, the pewter plates kept as its plain example (the case is in the log)",
               [(PREF, IDEA_HOME)],
               [(LD, "And a sticky fact is not where an idea goes")]),
    "SA-G13": (S5 + "; and " + S6 + ": \"Not teaching tool\" goes, since a sticky fact may be the sentence a Teach lands",
               [(LD, SETTLED5)],
               [(LD, "Teacher may provide - use it."), (LD, "Not teaching tool")]),
    "SA-G20": (S6 + " (the routes list's 7k)", [(SKILL, SKILL_SURVIVES)],
               [(SKILL, "which is why it has a takeaway")]),
    "SA-H02": (S12 + " (\"the PPT designer\" is the slide designer, and \"document\" is the reference on each unit) and " + FOLD,
               [(PREF, RECORD)],
               [(PREF, "that's the PPT designer's decision"), (PREF, "Document when each fact appears")]),
    "SA-H05": (FOLD + ": its rule moves to the home in full prose; its last sentence (availability is the design's) stays with the designer's recording",
               [(PREF, LEFT_OFF),
                (LD, "Availability pedagogical belongs here; downstream decides only physical treatment.")],
               [(LD, "If fact would reveal thinking later task requires, leave ID off that task.")]),
    "SA-H08": (FOLD + " and " + D7 + ": phrasing consistency moves to the home in full prose, and names the working wall",
               [(PREF, PHRASING)],
               [(LD, "Cross-slide repetition - phrase on Teach matches Practise reference later, worksheet, Apply."),
                (LD, "**Phrasing consistency:**")]),
    "SA-H09": (S6 + ": written once, as the headline or as the star line, never both", [(LD, H09_NEW)],
               [(LD, "Write once (typically sticky fact).")]),
    "SA-H10": (S6 + " (the routes list's 7h); the mechanism sentences stay word for word", [(CONTENT, LEADS), (CONTENT, MECHANISM)],
               [(CONTENT, "**The landed sentence leads the board.** It goes in the `headline`")]),
    "SA-H11": (S6, [(OT, OT_ONCE)], [(OT, "A Teach slide lands its sentence once, at the top.")]),
    "SA-H12": (S6 + ": the takeaway sentence says what the content route says", [(OT, OT_TAKEAWAY)],
               [(OT, "is for the beat that withholds its fact until children have reached it, where the headline names")]),
    "SA-H13": ("story retired: " + ST + "; its reason stays in the route as a clause, and " + S6,
               [(CONTENT, CAPTION),
                (LOG, "A Year 4 history beat took it on 17 September 2026 and opened `A photograph of Victorian children who worked.`")],
               [(CONTENT, "This file used to offer a second shape"),
                (CONTENT, "A Year 4 history beat took it on 17 September 2026")]),
    "SA-H14": (S6 + " (the routes list's 7h): the star line is the shape for a beat that withholds its fact, and a choice where the fact reads better last; the headline is then never a caption",
               [(CONTENT, WITHHOLDS)],
               [(CONTENT, "Keep a `takeaway` referencing a sticky fact for the beat that deliberately withholds")]),
    "SA-H27": (S6 + "; and " + FOLD + " (the pointer names the rule's home)", [(SSC, SSC_ONCE), (SSC, SSC_BETWEEN)],
               [(SSC, "render the sentence once, with its sticky-knowledge visual treatment"),
                (SSC, "the lesson-designer's \"phrasing consistency\" rule")]),
    "SA-I04": (D7 + " and " + PF22 + ": the sticky-knowledge statement joins the definition sentence; then " + WALL_ORDER + "; then " + STICKY_THIRD, [(WALLD, WALL_FREE), (WALLD, WALL_DEFINITION)],
               [(WALLD, "a worked-example modelled sentence, a sticky-knowledge statement, a sentence stem's framing")]),
    "SA-I05": (D7 + " and " + PF22 + "; then " + WALL_ORDER + "; then " + STICKY_THIRD, [(WALLP, WALLP_FREE), (WALLP, WALLP_STICKY)],
               [(WALLP, "a modelled sentence, a sticky-knowledge fact — may be tightened")]),
    "SA-I06": (S12 + " (the wall test and the designer say 106); then " + WALL_ORDER + " (about 72 once it has); then " + STICKY_THIRD + " (about 106 beside a photo)", [(WALLP, WALLP_ROW)],
               [(WALLP, "up to about 100 characters")]),
    "SA-I07": (D7 + " and " + PF22 + ": a sentence the lesson wrote makes room first", [(WALLD, WALL_BUDGET), (WALLD, WALL_LESSON_SENTENCE)],
               [(WALLD, "A worked-example step or sticky-knowledge statement that runs past its budget")]),
    "SA-I29": (D7 + " and " + PF22, [(WALLP, WALLP_LEAD)],
               [(WALLP, "Prose a child reads may be condensed for the wall"),
                (WALLP, "Condense first, before dropping anything.")]),
    "SA-J01": (FOLD + " (J07: the designer's section holds what an Apply has to be, its shapes and its recording)",
               [(PREF, "- **The Apply Slide** — earned through the lesson, never automatic, and judged against the learning the lesson named; what an Apply has to be, its shapes and its recording live with the lesson-designer.")],
               [(PREF, "the full decision lives with the lesson-designer")]),
    "SA-J06": (FOLD + ": the home takes J11 (keep rehearsal within practice, omit the ending when practice already draws on the intended learning, the three repairs in order) and names the intended learning",
               [(PREF, APPLY_JUDGE)],
               [(PREF, "The first repair is to reshape the final task so it draws on that learning", "local"),
                (PREF, "a separate check is the fallback for learning a personal or product task honestly cannot carry", "local")]),
    "SA-J07": (FOLD, [(PREF, APPLY_REST)], [(PREF, "which is the only place that decides it")]),
    "SA-J11": (FOLD + " and " + S12 + " (\"the quality-lock sentence\" is the read-back sentence that closes the walk-through)",
               [(PREF, APPLY_JUDGE), (LD, APPLY_POINTER)],
               [(LD, "quality-lock sentence"),
                (LD, "Keep useful rehearsal within practice; omit the ending when practice already draws on the intended learning.", "local")]),
    "SA-J15": (S11, [(LD, MATHS_APPLY)], []),
    "SA-J19": (D9, [(LD, NOT_INCLUDED)],
               [(LD, "When not included, say explicitly why. \"Your Turn and answers is sufficient AFL here", "local")]),
    "SA-J41": (PF1 + "; and " + PF21,
               [(PREF, "Replace a label only when it is an internal one that names a slot rather than a move (`Do 1: Cold-call recap`, `Teach 3`, `Practise`, and `Apply` outside maths, where it is one of the plain words above), and then title the slide with the move the unit makes, in a child's words, taken from its own content.")],
               [(PREF, "(`Do 1: Cold-call recap`, `Teach 3`, `Apply`, `Practise`)")]),
    "SA-J42": (PF1, [(LD, "never the slot it fills (`Still part of the lesson`, or `Apply` outside maths, where the teacher wants the plain words " + PLAIN + ").")],
               [(LD, "never the slot it fills (`Still part of the lesson`, `Apply`).")]),
    "SA-J43": (PF1 + "; and " + PF21, [(SD, "The source unit's label is the title unless it is an internal slot name (`Do 1`, `Teach 3`, `Practise`, and `Apply` outside maths); the section says what to do then.")],
               [(SD, "(`Do 1`, `Teach 3`, `Apply`, `Practise`)")]),
    "SA-J45": (N2, [(TMPL, "| `numbered-questions` | Stacked question cards with auto purple `(1) (2) (3)` labels, for a starter, or for Apply / independent work in maths |")],
               [(TMPL, "Stacked question cards with auto blue")]),
    "SA-J47": (PF1 + " (the reviewer list's settled item 8: fixed once, here)",
               [(REV, "A label naming a slot rather than a move (`Still part of the lesson`, or `Apply` outside maths, where the teacher wants the plain words " + PLAIN + ") is a bounded correction under `preferences.md` → Slide Headings; write the move a child is making.")],
               [(REV, "(`Still part of the lesson`, `Apply`) is a bounded correction")]),
    "SA-K02": (S12 + ": the program wants the ending's kind as \"Reflect\", and no design has an \"APPLY SLIDE\" prose field",
               [(LD, K02_NEW)],
               [(LD, "don't fill retired \"APPLY SLIDE\" prose"), (LD, "(`ending.kind` = \"reflect\" for Reflect")]),
    "SA-L19": (Q2 + "; the pointer to the research file's sections 7 and 8 goes (neither carries that mechanism, PF-I09)",
               [(PREF, SPLIT_HOME)],
               [(PREF, "make the production the opening of the next lesson"),
                (PREF, "warmed by a quick retrieval of today's learning"),
                (PREF, "the cognitive-load and closure mechanisms are in `evidence-synthesis.md`")]),
    "SA-L20": (PF20, [(PREF, SPLIT_RECORD)],
               [(PREF, "the package covers Lesson 1 only"), (PREF, "state what Lesson 2 should cover"),
                (PREF, "surface the same orientation in the starter-slide teacher orientation paragraph")]),
    "SA-L21": (PF20 + "; and " + Q2 + " (\"production opens next\" was the same plan in the designer's words)",
               [(LD, SPLIT_LD)],
               [(LD, "production opens next"), (LD, "Signal split in")]),
    "SA-L22": ("retired by " + PF20, [],
               [(OT, "Lesson 1 of 2"), (OT, "lesson2Direction"), (OT, "deferredLearning")]),
    "SA-M08": (S2, [(REV, TEST_QUESTION_REV)],
               [(REV, "demand, with fresh content.", "local")]),
    "SA-M13": (D9, [(PACKET, x) for x in APPLY_TRIGGER],
               [(PACKET, "\"Read when Apply may be unearned or repeat Your Turn.\",", "local")]),
    "SA-M16": (PF20 + ": the reviewer reads the split against the walk-through line, strength kept",
               [(REV, "- what the walk-through says was left for another lesson is not taught early;"),
                (REV, "- a lesson that left learning for another lesson says so, honestly and visibly, in the walk-through;")],
               [(REV, "deferred learning is not taught early"), (REV, "any lesson split is honest and visible")]),
    "SA-N01": (S1 + ": a design carrying the slot is refused as an unknown field", [(VALIDATOR, "keys = {\"activity\", \"connection\", \"format\"}")], []),
    "SA-N02": ("retired by " + S1, [],
               [(VALIDATOR, "must be an exact answer-slide answer when starter.testQuestionPath is present"),
                (VALIDATOR, "unit[\"content\"][\"testQuestionPath\"]")]),
    "SA-N03": (S1, [(SCAFFOLD, "\"starter\": (\"activity\", \"connection\", \"format\"),")], []),
    "SA-N25": (S1 + ": the test of the old answer rule becomes a test that the slot is refused, empty or filled",
               [(CONTRACT_TEST, "def test_the_test_question_starter_slot_is_gone():"),
                (CONTRACT_TEST, "assert_invalid_contract(design, photos, \"has unknown fields: testQuestionPath\")")],
               [(CONTRACT_TEST, "must be an exact answer-slide answer when starter.testQuestionPath is present", "local")]),
    "SA-N26": (S1, [(TALL, "// A starter built around one tall portrait image the children read from.")],
               [(TALL, "as a scanned question")]),
    "SA-D23": (COLOURS + " (PF-R18: the treatment covers the short task too)",
               [("references/teacher-slide-visual-profile.md", "- The treatment is deck-wide: every child-facing question and short task outside the starter carries it, not a favoured few.")],
               [("references/teacher-slide-visual-profile.md", "every child-facing question outside the starter carries it", "local")]),
}
for rid in ("SA-D21", "SA-I14", "SA-I15", "SA-I16"):
    outcome, present, absent = COLOURS_ROWS[rid]
    SA_ROWS[rid] = (f"{COLOURS}: {outcome}", present, absent)

# --- words a decision added that no SA row quoted: the mechanisms ---------------------

ADDED = [
    ("SA-ADD-01-RETIRED-KEYS", S1 + " and " + PF20 + ": the lesson file's contract names neither the starter's old slot nor the three Lesson 2 keys, so the validator refuses each as an unknown field and the scaffold neither asks for `scope` nor writes any of them; the review view and the wall packet no longer print them",
     [(VALIDATOR, "\"durationMinutes\", \"stickingPoint\","),
      (SCAFFOLD, "\"durationMinutes\": PLACEHOLDER,"),
      (CONTRACT_TEST, "def test_the_lesson_2_plan_is_gone_from_the_lesson_file():"),
      (CONTRACT_TEST, "assert_invalid_contract(design, photos, f\"lesson has unknown fields: {key}\")"),
      ("scripts/tests/test_lesson_design_scaffold.py", "def test_a_request_carrying_a_lesson_2_plan_is_refused():"),
      ("scripts/tests/test_lesson_design_scaffold.py", "assert \"scaffold request has unknown fields: scope\" in str(exc)"),
      (OT, "\"durationMinutes\": 45, \"stickingPoint\": \"...\"")]),
    ("SA-ADD-02-PRACTISE", PF21 + " and " + PF1 + ": the slide check flags a bare `Practise` in every subject and a bare `Apply` outside maths, and its message carries the maths note",
     [(CHECK, "/^(?:(?:Teach|Do)\\s+\\d+(?:\\s*:.*)?|Apply|Practise)$/i;"),
      (CHECK, "'In maths the plain words My Turn, Our Turn, Your Turn, Answers and Apply are the titles; ' +"),
      (CHECK, "'Practise is not one of them (preferences.md -> Slide Headings).'"),
      (CHECK, "if (maths && /^apply$/i.test(title)) return;"),
      ("builder/test/slide-design-check.test.js", "test('a bare Practise is a slot name in every subject, and a bare Apply only outside maths', () => {")]),
    ("SA-ADD-03-GRID", PF1 + ": an untitled `grid-calc` no longer prints `Independent Tasks`; the slide check sends it back to be titled, naming the fix, and the final build draws it with no title line rather than lose the deck (the first check's repair 5); a grid's calculations are its turn, so the title the message asks for passes, and a grid under the starter header is not sent back for a title it never prints (the second check's repair 1)",
     [(GRID, "title: data.title,"),
      (CHECK, "if (slideData.template === 'grid-calc' && !title && slideData.headerStyle !== 'starter') {"),
      (CHECK, "slideData.calculations.some((calculation) => String(calculation || '').trim())"),
      ("builder/test/grid-calc-title.test.js", "test('a grid titled \"Your Turn\" carries its turn in its sums, and a starter grid needs no title', () => {"),
      (CHECK, "signal: 'GRID_WITHOUT_TITLE',"),
      (CHECK, "'a grid-calc slide has no \"title\", and the builder no longer prints ' +"),
      (TMPL, "**Slots:** `title` (the design's label: in maths the plain words, usually `Your Turn`; an untitled grid prints no title line, and the slide check sends it back to be titled)"),
      ("builder/test/grid-calc-title.test.js", "test('the slide check sends an untitled grid back, naming the fix', () => {"),
      ("builder/test/grid-calc-title.test.js", "test('the final build writes the deck for an untitled grid, flagged delivery or not', () => {")]),
    ("SA-ADD-04-WALL-MESSAGE", D7 + " and " + PF22 + ": the wall's refusal of an over-long item names the budget (at the widest share the picture gave way to, the second check) and leads with making room, and a shortened item stays a whole sentence",
     [(WALL_LAYOUT, "and ${budget} is the most that fits in ${cap} lines at ${pt}pt (${charsPerLine} per line): \""),
      (WALL_LAYOUT, "an item over its own budget needs room before its words change: any picture beside it has already narrowed (a sticky fact's photo to about a third of the card), so next carry a list over a second card; only if it still will not fit is it shortened, to a whole sentence with the same meaning and never a clipped phrase, and that is the wall designer's decision, not a focused repair's; the picture comes off last of all, since the teacher's walls rarely have a card without one;"),
      (WALL_LAYOUT, "otherwise remove an item or shorten the longest to a whole sentence, never a success-criteria step, which is copied word for word"),
      ("working-wall-html/test/doc-claims.test.js", "assert.match(message, /72 is the most that fits/, \"the refusal must name the budget\");")]),
    ("SA-ADD-05-WALL-COPIES", D7 + " and " + PF22 + ": the wall designer's and the wall preferences' other copies say room first, then a whole sentence",
     [(WALLD, "so what you place on it is short by necessity, never clipped."),
      (WALLD, WALL_ROOM),
      (WALLD, "1. **Make room** (rule 8). 2. **Shorten the wording** to a whole sentence, keeping the meaning and every protection intact (rule 8)."),
      (WALLD, "Choose a supported larger layout, shorten faithful display text to a whole sentence, simplify the representation, or drop the card before delivery."),
      (WALLP, "**4. Two lines is what fits an item on a card.**"),
      (WALLP, "It is what the card holds, not a quota on writing: an item that needs more room gets its card's room first (principle 5), and is never clipped to fit."),
      (WALLP, "make room first (the picture narrowed, a list over two cards), then shorten faithful display text to a whole sentence (never a success-criteria step, which is copied word for word), take the picture off,"),
      (WALLP, "- \"the part that makes sense on its own (the independent clause)\" not \"the independent clause\" alone"),
      (WALLR, "it needs its card's room first (a list over a second card), then a shorter whole sentence, the picture off last; all are the wall designer's, not this round's")]),
    ("SA-ADD-06-A3-QUESTION", D3 + ": the question stays a question children think and talk about (the pitch paragraph's two cases are unchanged)",
     [(PREF, "When the teacher's brief itself says children already find the surface content easy, that surface is disqualified as starter material at gift level"),
      (PREF, "An open explore-and-discuss opening is a legitimate starter when the retrieval would be empty")]),
    ("SA-ADD-08-UNTESTED-PROMISES", S4 + " and " + PF20 + ": the first check found two promises no test held, now tested: the tall-picture starter never prints a slide's title, and the scaffold guide's example request is exactly the fields the scaffold takes (no `scope`)",
     [("builder/test/starter-question-tall-title.test.js", "test(\"a tall-picture starter never prints the slide's title\", () => {"),
      ("scripts/tests/test_lesson_design_scaffold.py", "def test_the_guide_example_request_is_one_the_scaffold_accepts():")]),
    ("SA-ADD-09-WALL-ORDER", WALL_ORDER + ": the fitter's own first move, the picture giving up a little width (the words' share from 60% to at most 70%) before the build refuses; a card whose words fit keeps the full share",
     [("working-wall-html/src/visuals.js", "const PICTURE_GIVES_WAY = [0.65, 0.7];"),
      ("working-wall-html/src/visuals.js", "if (base !== 0.6 || fitsAt(base)) return base;"),
      ("working-wall-html/src/visuals.js", "return roomier || PICTURE_GIVES_WAY[PICTURE_GIVES_WAY.length - 1];"),
      ("working-wall-html/test/doc-claims.test.js", "test(\"a definition or a sentence stem beside a drawing keeps it by letting it give way a little\", async () => {"),
      ("working-wall-html/src/render-panels.js", "const panelFraction = panelFractionThatFits(panelFractionFor(card, ctx, hasVisual && !card.visual), (fraction) =>"),
      ("working-wall-html/src/render-panels.js", "const panelFraction = panelFractionThatFits(panelFractionFor(card, ctx, hasSideVisual), (fraction) =>"),
      ("working-wall-html/test/doc-claims.test.js", "assert.equal(await itemOfLengthBuilds(dir, 72, true), true, \"a 72-character item should build with the picture a little smaller\");"),
      ("working-wall-html/test/doc-claims.test.js", "test(\"a card keeps its picture's full share when its words fit, and the picture gives way only a little\", () => {"),
      (WALLD, "If the full SC won't fit at the wall's fixed A3 size, make room: drop non-SC extras, carry the list in order over two cards of the same type and title when the wall has room for both, and only when nothing else fits take the card's picture off, unless the steps need it (about 106 characters a step instead of 62);"),
      (WALLP, "the card makes room instead (the list over two cards, and the picture off only when nothing else fits)."),
      (WALLR, "say instead that its card needs room (its list over two cards, its picture off only when nothing else fits)."),
      (WALL_LAYOUT, "a success-criteria step is never reworded, so its card makes room instead (the list over two cards, and the picture off only when nothing else fits)")]),
    ("SA-ADD-10-SETTLED-CHECK", "the first check's section 7, carried by the lead: a title slip never costs the deck its drawings; the slide check's `--settled` prints a wording, title or layout fault the designer's round left as a note on a settled deck, the decorator, the playbook's decorator check and the orchestrator's re-check after it pass it, the designer's own check never does (a test, the second check), and a fault the decorator's own layer causes still fails",
     [(CHECK, "const settled = argv.includes('--settled');"),
      (CHECK, "? presentationAll.filter((warning) => pictures.includes(warning))"),
      ("agents/slide-decorator.md", "--preview --settled \\"),
      ("agents/slide-decorator.md", "`--settled` prints a wording, title or layout fault the designer's round left as a note, never a failure: it is not yours to mend, and it never costs the deck its drawings."),
      (PB, "\"[WORKING_DIR]/lesson.json\" --settled"),
      (PB, "check yourself with `--settled`."),
      ("builder/test/slide-design-check.test.js", "test(\"the slide designer's own check never runs with --settled; only the decorator's does\", () => {"),
      ("builder/test/slide-design-check.test.js", "test('on a settled deck a title slip is a note, and never costs the drawings', () => {")]),
    ("SA-ADD-11-TRUE-FIT", "the second check's item 3, carried by the lead: nothing prints past a panel's edge; the sticky, definition, worked-example, sentence-stem and misconception cards plan their bodies the way Chrome draws them (whole words measured with the board's width table, the font's own line height, each item's padding, badge, bullet or label, the panel's real width and edge, a stacked figure as drawn with its caption; the misconception as its two cells side by side, the picture beneath taken from their height), the flat badge reserve goes, and a dominant figure reserves no room beneath the panel; a Chrome test per type holds each item's planned lines to its printed lines",
     [("working-wall-html/src/layout.js", "return Math.round((px * 2257) / 2048) + Math.round((px * 597) / 2048);"),
      ("working-wall-html/src/layout.js", "function wrappedLines(text, pt, widthPx, opts = {}) {"),
      ("working-wall-html/src/layout.js", "function itemBlock(item, pt, widthPx, page) {"),
      ("working-wall-html/src/layout.js", "function stackedCaptionInches(label, orientation, style) {"),
      ("working-wall-html/src/layout.js", "if (drawnAt(pt).fits) return pt;"),
      ("working-wall-html/src/visuals.js", "const PAGED_CARDS = new Set([\"stickyKnowledge\", \"vocabDefinition\", \"workedExample\", \"sentenceStem\"]);"),
      ("working-wall-html/src/visuals.js", "if (card.visualScale === \"dominant\") return 0;"),
      ("working-wall-html/src/render-panels.js", "kind: isStepLabel(item.label) ? \"step\" : \"trailing\","),
      ("working-wall-html/test/nothing-prints-past-a-panel-edge.test.js", "test(\"the line the fitter plans is the line Chrome draws\", () => {"),
      ("working-wall-html/src/layout.js", "? (page.headPx || 0) + Math.max(0, ...blocks.map((block) => block.px))"),
      ("working-wall-html/src/render-panels.js", "const beneath = pictureBeneathPair(card, style, specDir, ctx, dims);"),
      ("working-wall-html/src/visuals.js", "function stackedFigureInches(card, ctx, style, reserve) {"),
      ("working-wall-html/test/each-panel-card-prints-the-lines-it-planned.test.js", "test(\"each panel card prints the lines it planned, and nothing strays into a panel's padding\", async () => {"),
      (WALLD, "names every overrun on the card at once and the budget each has to come inside: follow Write to the card's character budget, then run it again.")]),
    ("SA-ADD-13-NO-CARD-OUTSIDE", "the lead's answer on the other card types (26 September 2026): only the diagram section, the one card the audit found printing outside its box, is changed, its heading strip padded past the words' overhang and its heading measured as drawn; a standing Chrome guard over every fixture, a diagram section and every saved wall fails if any card prints outside its box",
     [("working-wall-html/src/render-section.js", "const padIn = Math.max(HEADING_PAD_IN, (overhangPx + 0.5) / 96);"),
      ("working-wall-html/src/render-section.js", "const heading = headingFor(part.heading, stripWidthPx);"),
      ("working-wall-html/test/no-card-prints-outside-its-box.test.js", "test(\"no wall card prints outside its box, on every fixture, a diagram section and every saved wall\", async () => {")]),
    ("SA-ADD-14-ARROWS", "the third check's item 1, carried by the lead: a line holding an arrow is drawn the height the wall plans it; arrows come from a \"Wall Arrows\" face after Comic Sans MS in every stack: Segoe Print's own arrows drawn 40% larger, as heavy as the digits (the updated third check found Arial's a hairline), held inside Comic Sans's line by the face's own ascent and descent, with their widths in the plan; a test holds every place the face was written, the line and the shaft; the arrow cards are in the per-type test and the standing guard, with the third check's undo misses (the definition's page plan, a dominant figure's reserve, a drawing's four lines)",
     [("working-wall-html/src/shared.js", "@font-face { font-family: \"Wall Arrows\"; src: local(\"Segoe Print Bold\"), local(\"SegoePrint-Bold\"); font-weight: 700; size-adjust: 140%; ascent-override: 78%; descent-override: 20%; line-gap-override: 0%; unicode-range: U+2190-21FF; }"),
      ("working-wall-html/test/every-arrow-is-drawn-from-the-wall-arrows.test.js", "test(\"an arrow sits within its line and reads as heavy as the digits beside it\", async () => {"),
      ("working-wall-html/test/every-arrow-is-drawn-from-the-wall-arrows.test.js", "test(\"every place the wall writes words draws its arrows from the wall's arrow face\", async () => {"),
      ("working-wall-html/src/shared.js", "const FONT_STACK_FALLBACK = \"'Wall Arrows', 'Segoe Print', cursive\";"),
      ("working-wall-html/src/layout.js", "\"\\u2190\": 1.3973, \"\\u2192\": 1.3973, \"\\u2194\": 1.5395, \"\\u2191\": 0.6973, \"\\u2193\": 0.6973,"),
      ("working-wall-html/test/each-panel-card-prints-the-lines-it-planned.test.js", "[\"a worked example with arrows beside a photo\","),
      ("working-wall-html/test/each-panel-card-prints-the-lines-it-planned.test.js", "test(\"a fact too long beside a drawing is refused against its four lines, never the photo's three\", async () => {"),
      ("working-wall-html/test/no-card-prints-outside-its-box.test.js", "assert.ok(arrowSheets >= 40, `only ${arrowSheets} arrow cards were drawn`);")]),
    ("SA-ADD-15-ONE-LONG-FACT", ONE_LONG + ": a card beside a photo narrowed to a third holds one fact on three lines; the wall designer puts the next, in order, on a second card of the same type and title where the wall has room, and a card that still holds more is built with its photo off, never refused for the count (the fourth check)",
     [("working-wall-html/src/visuals.js", "const PHOTO_AT_A_THIRD = { share: 0.7, floorLines: 3, factsOnThreeLines: 1 };"),
      ("working-wall-html/src/layout.js", "const tooManyLong = longAtFloor().length > longItemsAtFloor;"),
      ("working-wall-html/src/layout.js", "a card holds one fact that long beside its photo (the teacher's rule): the next long fact goes, in order, on a second card of the same type and title where the wall has room, which keeps every word and is a layout change a focused repair may make; a fact that still cannot fit gets a shorter whole sentence from the wall designer"),
      ("working-wall-html/src/render-panels.js", "...(factLines ? { floorLinesPerItem: factLines, longItemsAtFloor: PHOTO_AT_A_THIRD.factsOnThreeLines } : {}),"),
      (WALLD, "the build narrows the picture (a sticky fact's photo to a third; one such fact a card), then"),
      (WALLP, "becomes a poster, so a card holds at most one sticky fact on three lines: a second goes, in order, on a second card of the same type and title where the wall has room. Where it has none, the build takes that card's photo off and keeps every sentence whole, and says so."),
      (WALLR, "A panel too tall for its page, or a second three-line sticky fact, is a layout fault you can repair without touching a word:"),
      ("working-wall-html/test/nothing-prints-past-a-panel-edge.test.js", "test(\"a card beside a photo holds one three-line fact, and a card with more is built without losing the wall\", async () => {")]),
    ("SA-ADD-16-NEVER-LOSE-THE-WALL", "the fourth check, carried by the lead (his standing rule: repair first, and a finished piece every time): a card that still holds more than one long fact beside its photo at build time is built with that card's photo off and every sentence whole, with a note naming the move that keeps the photo; the scope check lets a focused repair's split leave a card a single item",
     [("working-wall-html/src/render-panels.js", "const onlyTheCount = !fitsBeside(panelFraction) && fitsAt(panelFraction, { floorLinesPerItem: factLines });"),
      ("working-wall-html/src/render-panels.js", "if (imagePath && !photoOff) {"),
      ("working-wall-html/src/render-panels.js", "\"one fact that long, so this card is built with its photo off and every sentence whole. To keep the photo, \" +"),
      ("scripts/check-repair-scope.py", "elif len(child) == 1 and is_flat(child[0]) and printed_part(child[0]) != BLANK:"),
      ("scripts/check-repair-scope.py", "for seq, t, single in pieces[start:]:"),
      ("scripts/tests/test_repair_scope.py", "def test_a_split_that_leaves_a_card_one_item_is_a_repair(self):"),
      ("scripts/tests/test_repair_scope.py", "def test_a_single_item_out_of_order_is_still_caught(self):"),
      ("scripts/tests/test_a_split_wall_arrives.py", "def test_the_split_passes_its_scope_check_and_the_wall_arrives(self) -> None:")]),
    ("SA-ADD-12-STICKY-THIRD", STICKY_THIRD + ": after the photo gives way a little, a sticky fact that still does not fit keeps its photo, narrowed to about a third, and its whole sentence, on up to three lines at the floor size; then the wall designer's shorter whole sentence, and the picture off last of all",
     [("working-wall-html/src/visuals.js", "const PHOTO_AT_A_THIRD = { share: 0.7, floorLines: 3, factsOnThreeLines: 1 };"),
      ("working-wall-html/src/render-panels.js", "if (pictureBeside && !fitsBeside(panelFraction)) {"),
      ("working-wall-html/test/nothing-prints-past-a-panel-edge.test.js", "test(\"a long sticky fact keeps its photo and its whole sentence, and nothing prints past a panel's edge\", async () => {"),
      ("working-wall-html/test/doc-claims.test.js", "assert.equal(await itemOfLengthBuilds(dir, 106, true), true, \"a 106-character fact should build beside its photo narrowed to a third\");"),
      ("working-wall-html/test/doc-claims.test.js", "assert.match(message, /the picture comes off last of all/, \"the picture comes off only as the last move\");"),
      (WALLD, "the picture takes 40% of the sheet (a sticky fact about 106, its photo at a third);"),
      (WALLD, "4. **Take the picture off** (rule 8). 5. **Drop the card**, and only here."),
      (WALLP, "The one exception is a sticky fact whose photo has narrowed to about a third of the card (principle 5): it runs to three lines rather than lose its photo or its words.")]),
    ("SA-ADD-07-HOW-MUCH-FITS", PF20 + " and " + Q2 + ": the example list keeps its other two examples, and a split still is the design",
     [(PREF, "\"understand the water cycle, then draw and explain it\"; \"understand the structure of a volcano, then label it and explain an eruption\"."),
      (PREF, "A lesson that builds to a clear conceptual high point — the moment the separate parts snap into a whole — can stop there, on the high point, with the production saved for tomorrow."),
      (PB, "When the walk-through says the lesson left something for another lesson, say what in one line."),
      ("scripts/tests/test_lesson_design_scaffold.py", "assert scaffold.CONTENT_ENVELOPE_FIELDS[\"starter\"] == (\"activity\", \"connection\", \"format\")")]),
]

# Retired from the programs and the words as well as the rows: barred in every
# program and instruction file.
RETIRED = [
    (PREF, "know how a Roman lived"),
    (OT, "Lesson 1 of 2"),
    (VALIDATOR, "lesson2Direction"),
    (VALIDATOR, "deferredLearning"),
    (VALIDATOR, "testQuestionPath"),
    (SCAFFOLD, "testQuestionPath"),
    (PACKET, "Lesson 2 direction"),
    (PACKET, "Deferred learning:"),
    (GRID, "data.title || 'Independent Tasks'"),
    (CHECK, "Your Turn, Quick check, Practise — do not match"),
    (WALL_LAYOUT, "fits only reworded"),
    (WALL_LAYOUT, "Cut it to ${budget} characters or fewer:"),
    (WALLR, "it fits only reworded"),
    (WALLD, "Condense the wording"),
    (WALLD, "rather than adding or removing a picture to gain a character allowance"),
    (WALLD, "Condensing is the *first* move"),
    (WALLP, "Two-line maximum on every item"),
    (TMPL, "defaults to \"Independent Tasks\""),
    (PACKET, "often a lesson returns to the same evidence"),
    (PB, "a two-lesson scope covers Lesson 1 only"),
    (WALLD, "ordinary prose has that much slack"),
    (WALLD, "the picture off unless the words need it, then a list over a second card"),
    (WALLR, "its picture off unless its steps need it, or its list over two cards"),
    (WALLP, "no picture unless the steps need it, or the list over two cards"),
    (WALL_LAYOUT, "(the picture off unless the steps need it, or the list over two cards)"),
    (WALLD, "the build shrinks the picture a little, then a list goes over a second card, and the picture comes off only when nothing else fits"),
    (WALLD, "shorten the text, split a too-tall card's items in order over a second card"),
    (WALLP, "the build shrinks its picture a little, a list carries over to a second card, and the picture comes off only when nothing else fits"),
    (WALLR, "(a list over a second card, the picture off only when nothing else fits) or, after that, a shorter whole sentence"),
    (WALL_LAYOUT, "any picture beside it has already given up a little width"),
    ("working-wall-html/src/render-panels.js", "BADGE_COLUMN_INCHES"),
]

HOMES = [
    (PREF, "## How Much Fits in One Lesson", "HOME-SA-PREF-FIT"),
    (PREF, "## Starters", "HOME-SA-PREF-STARTERS"),
    (PREF, "## Sticky Knowledge", "HOME-SA-PREF-STICKY"),
    (PREF, "## The Apply Slide", "HOME-SA-PREF-APPLY"),
    (PREF, "## Practising a Test Question", "HOME-SA-PREF-TEST"),
    (PREF, "## Purposeful Endings and Linked Lessons", "HOME-SA-PREF-ENDINGS"),
    (LD, "### Starter", "HOME-SA-LD-STARTER"),
    (LD, "### Sticky Knowledge", "HOME-SA-LD-STICKY"),
    (LD, "### Apply Slide", "HOME-SA-LD-APPLY"),
]

# --- the rows of the other topic 7 list (PF) that 7A changed ---------------------------
# Release 7B takes these rows from here, as 7A takes its four colour rows from
# COLOURS_ROWS. Each names the decision that changed it.

PF_ROWS = {
    "PF-A04": ("reworded: the reviewer list's settled item 5 and this list's PF-A29 (his \"yes\"): the reviewer reads the routing card's always-read sections every review, and the others on their triggers",
               [(PREF, "The Design Reviewer receives a compact runtime routing card: it reads the sections the card marks as always read in every review, and any other named section only when its trigger applies.")],
               [(PREF, "reads only the named section when its trigger applies")]),
    "PF-A10": (N2, [(PREF, "- **Question Labelling** — bracketed labels for the starter in every subject and for the main independent work in maths only, plus lettered multi-question Maths Our Turn work; letters marking unknowns on figures run on through a deck and restart on each sheet.")],
               [(PREF, "bracketed labels only for starter and main independent work")]),
    "PF-A54": (PF22 + ": the Written Voice trigger names a shortened lesson sentence, and the cards are copied verbatim on most runs",
               [(WALLD, "Read the rest of Written Voice only when you author a permitted new child-facing line, shorten a lesson sentence, or must report that settled wording is unsuitable; your cards are copied verbatim on most runs.")],
               [(WALLD, "your cards are copied verbatim, so on most runs it never applies")]),
    "PF-B75": (PF22 + "; then " + WALL_ORDER + "; then " + STICKY_THIRD + "; then " + ONE_LONG, [(WALLD, WALL_LEAD), (WALLD, WALL_DEFINITION), (WALLD, WALL_ROOM)],
               [(WALLD, "**Prose a child reads may be condensed to fit; a contract a child checks against may not.**"),
                (WALLD, "Condensing is the *first* move when an item overruns, not the last.")]),
    "PF-B76": (PF22 + "; then " + WALL_ORDER + "; then " + STICKY_THIRD, [(WALLR, "An item over its own character budget is different: it needs its card's room first (a list over a second card), then a shorter whole sentence, the picture off last; all are the wall designer's, not this round's, so leave that finding unrepaired and say it needs the wall designer.")],
               [(WALLR, "it fits only reworded, and rewording is not this round's to do")]),
    "PF-B77": (PF22 + ": two lines is what a card holds at its smallest type, which the budget measures, not a quota on writing (the reason the engine gives, corrected by the second check); its reason, the poster, is kept word for word (the first check: the clash the ledger notes with the wall's own visual language is a question for him, carried to topic 9, not a fix)",
               [(WALLP, "**4. Two lines is what fits an item on a card.** Nothing (title, step, worked example, sentence stem, reference cell) needs more than two lines at the card's smallest type, which is what each item's character budget measures; a roomy card prints the same words larger."),
                (WALLP, "It is what the card holds, not a quota on writing: an item that needs more room gets its card's room first (principle 5), and is never clipped to fit.")],
               [(WALLP, "**4. Two-line maximum on every item.**")]),
    "PF-B78": (PF22, [(WALLP, WALLP_LEAD)],
               [(WALLP, "**5. Prose a child reads may be condensed for the wall; a contract a child checks against may not.**")]),
    "PF-C75": (PF22, [(WALLD, "**Write for the wall, not for the page.** A card is signage read from across a classroom, so what you place on it is short by necessity, never clipped.")], []),
    "PF-C80": (PF22 + ": the example keeps the taught term beside its plain words", [(WALLP, "- \"the part that makes sense on its own (the independent clause)\" not \"the independent clause\" alone")],
               [(WALLP, "- \"the part that makes sense on its own\" not \"the independent clause\"", "local")]),
    "PF-D21": (FOLD + " (SA-H08) and " + D7, [(PREF, PHRASING)],
               [(LD, "Cross-slide repetition - phrase on Teach matches Practise reference later, worksheet, Apply.")]),
    "PF-G33": (FOLD + " (SA-J11) and " + S12, [(PREF, APPLY_JUDGE), (LD, APPLY_POINTER)], [(LD, "quality-lock sentence")]),
    "PF-G50": (FOLD + " (SA-G08, G09)", [(LD, STICKY_POINTER), (PREF, TRACE)],
               [(LD, "Sticky Knowledge owns the why and the RE case")]),
    "PF-I01": (PF20 + ": the Roman diary example goes with the second-lesson product it illustrated",
               [(PREF, "\"understand the water cycle, then draw and explain it\"; \"understand the structure of a volcano, then label it and explain an eruption\".")],
               [(PREF, "know how a Roman lived")]),
    "PF-I02": (Q2, [(PREF, SPLIT_HOME)], [(PREF, "make the production the opening of the next lesson")]),
    "PF-I03": (PF20, [(PREF, SPLIT_RECORD)], [(PREF, "state what Lesson 2 should cover")]),
    "PF-I06": (PF20 + " and " + Q2, [(LD, SPLIT_LD)], [(LD, "production opens next")]),
    "PF-I10": (PF20, [(REV, "- what the walk-through says was left for another lesson is not taught early;")],
               [(REV, "deferred learning is not taught early")]),
    "PF-I11": (PF20 + " (\"honest\" and \"visible\" kept, the first check's low note)", [(REV, "- a lesson that left learning for another lesson says so, honestly and visibly, in the walk-through;")],
               [(REV, "any lesson split is honest and visible")]),
    "PF-I12": ("retired by " + PF20, [], [(OT, "Lesson 1 of 2")]),
    "PF-I20": (PF20 + "; the report list's \"lesson scope\", whose only source was `lesson.scope`, goes too (the first check's low note)",
               [(PB, "send a short teacher-facing report naming the topic, year, subject, objective, exact files, pedagogical highlights, design-review result and every teacher flag."),
                (PB, "When the walk-through says the lesson left something for another lesson, say what in one line.")],
               [(PB, "a two-lesson scope covers Lesson 1 only"),
                (PB, "objective, lesson scope, exact files", "local")]),
    "PF-I27": ("the first check's question on the tall-picture starter, answered by the lead: its two examples read like the removed test-question slide, so they become an ordinary starter from a saved deck (the Year 4 science starter Teeth and their jobs, `output/working/name-the-layers-of-teeth`, and its check slide); the `question` slot's name is code and stays",
               [(TMPL, "(for example, \"Which teeth cut food?\") or nothing; on the answer slide the answer in green via the `||` marker (e.g. `{ \"type\": \"text\", \"text\": \"||Incisors cut food.\" }`).")],
               [(TMPL, "(for example, \"Answer the question.\")", "local")]),
    "PF-J38": (N2, [(TMPL, "Use `numbered-questions` in this rail only when it belongs to a starter or, in maths, a main independent task.")], []),
    "PF-J39": (N2, [(TMPL, "Both helpers are restricted to a starter or the lesson's main independent work in maths.")], []),
    "PF-J41": (N2, [(TMPL, "Add `questionNumbering` only when the row belongs to a numbered starter, a numbered main independent task in maths, or a multi-question Maths Our Turn.")], []),
    "PF-L13": ("SA settled item 11 (his \"yes\")", [(LD, MATHS_APPLY)], []),
    "PF-Q10": (S6 + " (SA-H09); phrasing consistency moved to its home (SA-H08)", [(LD, H09_NEW)],
               [(LD, "Write once (typically sticky fact).")]),
    "PF-Q12": (S6 + " (SA-H11, H12)", [(OT, OT_ONCE), (OT, OT_TAKEAWAY)], [(OT, "A Teach slide lands its sentence once, at the top.")]),
    "PF-Q14": (S6 + " (the routes list's 7h)", [(CONTENT, ONCE_CONTENT)],
               [(CONTENT, "The one beat that keeps its sentence for the end, because children reach it themselves")]),
    "PF-Q15": (S6 + " (SA-H10)", [(CONTENT, LEADS), (CONTENT, MECHANISM)],
               [(CONTENT, "**The landed sentence leads the board.**")]),
    "PF-Q16": ("story retired (SA-H13): " + ST, [(CONTENT, CAPTION)], [(CONTENT, "This file used to offer a second shape")]),
    "PF-Q18": (S6 + " (the routes list's 7k): the skill route's Teach lands its sentence, usually as the headline", [(SKILL, SKILL_LANDS)],
               [(SKILL, "so it lands a `takeaway`")]),
    "PF-Q19": (S6 + " (the routes list's 7k)", [(SKILL, SKILL_SURVIVES)], [(SKILL, "which is why it has a takeaway")]),
    "PF-Q32": (S6 + " (SA-H27)", [(SSC, SSC_ONCE)], [(SSC, "render the sentence once, with its sticky-knowledge visual treatment")]),
    "PF-R98": (N2, [(TMPL, "| `numbered-questions` | Stacked question cards with auto purple `(1) (2) (3)` labels, for a starter, or for Apply / independent work in maths |")],
               [(TMPL, "Stacked question cards with auto blue")]),
    "PF-R99": (PF14 + " (the badge is drawn purple)", [(TMPL, "a purple number badge on each card's corner")], [(TMPL, "a blue number badge on each card's corner")]),
    "PF-V04": (PF1 + "; and " + PF21, [(PREF, "(`Do 1: Cold-call recap`, `Teach 3`, `Practise`, and `Apply` outside maths, where it is one of the plain words above)")],
               [(PREF, "(`Do 1: Cold-call recap`, `Teach 3`, `Apply`, `Practise`)")]),
    "PF-V10": (PF1 + " (the reviewer list's settled item 8)", [(REV, "(`Still part of the lesson`, or `Apply` outside maths, where the teacher wants the plain words " + PLAIN + ") is a bounded correction")],
               [(REV, "(`Still part of the lesson`, `Apply`) is a bounded correction")]),
    "PF-V11": (PF1, [(LD, "never the slot it fills (`Still part of the lesson`, or `Apply` outside maths, where the teacher wants the plain words " + PLAIN + ").")], []),
    "PF-V16": (PF1 + "; and " + PF21, [(SD, "(`Do 1`, `Teach 3`, `Practise`, and `Apply` outside maths)")], [(SD, "(`Do 1`, `Teach 3`, `Apply`, `Practise`)")]),
    "PF-V31": (PF1 + " and " + PF14 + "; an untitled grid is sent back by the slide check and drawn untitled by the build, never refused (the first check's repair 5)", [(TMPL, "**Slots:** `title` (the design's label: in maths the plain words, usually `Your Turn`; an untitled grid prints no title line, and the slide check sends it back to be titled)")],
               [(TMPL, "defaults to \"Independent Tasks\"")]),
    "PF-W31": (S6 + " (SA-H14)", [(CONTENT, WITHHOLDS)],
               [(CONTENT, "Keep a `takeaway` referencing a sticky fact for the beat that deliberately withholds")]),
    "PF-X41": (FOLD + " (SA-G12)", [(PREF, IDEA_HOME)], [(LD, "And a sticky fact is not where an idea goes")]),
    "PF-X46": (PF14 + ": Pride Lessons calibrates how much one beat puts in front of the class and holds the Teach slides he chose; how often a lesson returns to the same evidence is What a Lesson Is For's rule and the reviewer's own; the test that asserts the note moves with it",
               [(PACKET, "\"calibration for how much one beat puts in front of the class, and it \""),
                (PACKET, "\"holds the Teach slides the teacher chose, written out. A fit judgement \""),
                ("scripts/tests/test_fit_is_judged_against_the_pride_lessons.py", "self.assertNotIn('\"often a lesson returns to the same evidence.', text)")],
               [(PACKET, "often a lesson returns to the same evidence")]),
    "PF-Y71": (N2, [(TMPL, "A vertical stack of question cards, each with a purple `(1) (2) (3)` label down the left. Use only on starter and main independent work slides (the main independent work is numbered in maths only: `preferences.md` → Question Labelling), typically dropped into a `body-full` zone.")],
               [(TMPL, "each with a blue `(1) (2) (3)` label")]),
    "PF-Y73": (N2, [(TMPL, "Each carries a purple number badge on its corner"),
                    (TMPL, "Use `question-cards` only for a starter or, in maths, a main independent question set.")],
               [(TMPL, "Each carries a blue number badge on its corner")]),
}

# Rows of the later topics' ledgers that 7A changed (the same lines as rows
# pinned here); their releases read their own ledgers against these.
OTHER_LEDGER_ROWS = {
    "RT-C27": "SA-G20's line (PF-Q18): the skill route's Teach lands its sentence, usually as the headline",
    "RT-E12": "PF-Q14: the landed sentence is usually the headline",
    "RT-E13": "PF-Q14: the beat that lands its sentence last uses `takeaway`",
    "RT-E40": "SA-H10: the lead says usually",
    "RT-E41": "SA-H13: the story left for the build log; the reason stays as a clause",
    "RT-E42": "SA-H13: the story, now in the build log",
    "RT-E44": "SA-H14: the star line's shape and choice",
    "RT-J06": "SA-D13, D28: the two mixed-retrieval formats carry A07's conditions",
    "RT-P12": "SA-K02: `ending.kind` is \"Reflect\", and the retired prose line went",
    "RT-P13": "SA-J15: the maths Apply line (settled item 11)",
    "RT-P19": "SA-J42: `Apply` is a slot name outside maths only",
    "RV-H12": "SA-M16: the reviewer's split lines read against the walk-through",
    "RV-H14": "SA-M16",
    "RV-J48": "SA-M08: the test-question line carries both exceptions",
    "RV-K02": "SA-J47: `Apply` outside maths",
    "RV-S05": "PF-X46: the Pride Lessons note",
    "RV-S25": "SA-M13: the Apply trigger",
    "RV-T11": "PF-A04: the reading paragraph names the always-read sections",
    "PB-S14": "PF-I20: the report line about a split",
    "VG-M33": "PF-A54: the wall designer's Written Voice trigger",
    "QC-S46": "SA-M08 (moved in place by a10)",
    "SC-O03": "SA-I04 (moved in place by a10)",
    "SC-O18": "PF-B77 (moved in place by a10)",
    "SC-O20": "SA-I07 (moved in place by a10)",
    "SC-O22": "PF-B76 (moved in place by a10)",
    "WS-B07": "SA-H08 (moved in place by a10)",
}


def ledger_rows(name, prefix):
    rows = {}
    for raw in (REPO / "plans" / name).read_text(encoding="utf-8").splitlines():
        m = re.match(rf"^\| ({prefix}-[A-Z]\d{{2}}) \|", raw)
        if not m:
            continue
        p = P.search(Q.sub("", raw))
        if p:
            rows[m.group(1)] = (p.group(1), Q.findall(raw))
    return rows


def main():
    sa = ledger_rows(LEDGER, "SA")
    changed = {}
    problems = []
    for rid, (outcome, present, absent) in SA_ROWS.items():
        if rid not in sa:
            problems.append(f"{rid}: not a row of the ledger")
            continue
        rel, quotes = sa[rid]
        standing = [(rel, q) for q in quotes if norm(q) in text_of(rel)]
        changed[rid] = (outcome, standing + [p for p in present if p not in standing], absent)
    # A row whose quotes no longer stand must be mapped; a mapped row must have
    # changed (or be one the colours release changed).
    for rid, (rel, quotes) in sa.items():
        gone = [q for q in quotes if norm(q) not in text_of(rel)]
        if gone and rid not in SA_ROWS:
            problems.append(f"{rid}: changed but not mapped")
        if not gone and rid in SA_ROWS:
            problems.append(f"{rid}: mapped but every quote still stands")
    pf = ledger_rows(PF_LEDGER, "PF")
    for rid, (outcome, present, absent) in PF_ROWS.items():
        if rid not in pf:
            problems.append(f"{rid}: not a row of the PF ledger")
        for f, phrase in present:
            if norm(phrase) not in text_of(f):
                problems.append(f"{rid}: not found in {f}: {phrase[:90]}")
        for f, phrase, *scope in absent:
            if norm(phrase) in text_of(f):
                problems.append(f"{rid}: still present in {f}: {phrase[:90]}")
    for f, phrase in RETIRED:
        if norm(phrase) in text_of(f):
            problems.append(f"retired phrase still in {f}: {phrase}")
    if problems:
        print("\n".join(problems))
        raise SystemExit(f"MAPPING_FAILED {len(problems)}")

    pins_path = ledger_mapping.ROOT / PINS
    mapping_path = Path(_root.MAPPING_OUT) if _root.MAPPING_OUT else REPO / "plans" / MAPPING
    print(f"writing {pins_path}")
    print(f"writing {mapping_path}")
    build(ledger=LEDGER, prefix="SA", changed=changed, added=ADDED, homes=HOMES, pins=PINS, mapping=str(mapping_path),
          title="Starters, sticky knowledge and the Apply (release 7A): where every ledger row went",
          snapshot="4.2.292 b1c2d427, changed to 4.2.293 (uncommitted)",
          intro=[
              "Every row of `2026-09-23-starters-sticky-apply-ledger.md` with what happened to it in",
              "release 7A (4.2.293). \"Unchanged in place\" rows are word for word where the ledger found",
              "them. Every other row names the decision that changed it (his words are in the ledger's",
              "\"Decisions taken\" and the change plan `2026-09-24-topic-7-change-plan.md`, section",
              "\"Release 7A\") and the words that now carry it; a retired phrase is listed as gone.",
              "Five rows were changed by the colours release (7C, 4.2.292) before this one and are",
              "mapped with its words. The rows of the rest-of-preferences list that 7A changed follow",
              "at the end (`PF_ROWS`, which 7B imports). Built and checked by",
              "`streamline-tools/7a-change/build_7a_mapping.py`; pinned by",
              "`scripts/tests/starters_sticky_apply_ledger_pins.json`.",
          ])

    data = json.loads(pins_path.read_text(encoding="utf-8"))
    rows = data["rows"]
    home_held = {(h["file"], p) for h in data["homes"] for p in h["paragraphs"]}
    for rid, (outcome, present, absent) in PF_ROWS.items():
        pins = [pin_of(f, x) for f, x in present]
        for f, x in present:
            para = ledger_mapping.paragraph_of(f, x) if f.endswith(".md") and f != LOG else None
            if para and para != norm(x) and all(para != p["text"] for p in pins) and (f, para) not in home_held:
                pins.append(pin_of(f, para, paragraph=True))
        rows.append({"id": rid, "outcome": outcome, "ledgerFile": pf[rid][0], "present": pins,
                     "absent": [{"file": a[0], "text": norm(a[1]),
                                 "everywhere": (len(a) < 3 or a[2] != "local") and absent_everywhere(a[1])}
                                for a in absent]})
    retired = [{"file": f, "text": norm(x), "everywhere": absent_everywhere(x)} for f, x in RETIRED]
    rows.append({"id": "SA-RETIRED", "outcome": "retired by SA settled item 1, PF decision 20, PF decision 21, PF decision 22, PF settled item 14, his answer on a wall card's order and his answer on a long sticky fact (both 26 September 2026), from the programs and the words", "present": [], "absent": retired})

    # A wording meant to be gone everywhere that another file still holds is a
    # copy the release missed, never a pin to quietly narrow.
    specs = {rid: spec[2] for rid, spec in {**SA_ROWS, **PF_ROWS}.items()}
    for row in rows:
        for pin, spec in zip(row["absent"], specs.get(row["id"], [])):
            if (len(spec) < 3 or spec[2] != "local") and not pin["everywhere"]:
                problems.append(f"{row['id']}: meant to be gone everywhere, still somewhere: {pin['text'][:90]}")
    for pin in retired:
        if not pin["everywhere"]:
            problems.append(f"retired phrase still somewhere: {pin['text'][:90]}")

    # The first worksheets check brought a retired sentence back with a capital
    # first letter and every test passed: every barred phrase that is gone in
    # any case is matched ignoring case.
    everywhere_files = sorted(set(ledger_mapping.RUNTIME) | set(ledger_mapping.PROGRAMS))
    for row in rows:
        for pin in row["absent"]:
            own = ledger_mapping.ROOT / pin["file"]
            files = sorted(set(everywhere_files) | {own}) if pin.get("everywhere") else [own]
            needle = pin["text"].lower()
            if all(needle not in norm(path.read_text(encoding="utf-8")).lower() for path in files if path.exists()):
                pin["anyCase"] = True
    if problems:
        print("\n".join(problems))
        raise SystemExit(f"MAPPING_FAILED {len(problems)}")
    data["ledgers"] = {"SA": f"plans/{LEDGER}", "PF": f"plans/{PF_LEDGER}"}
    data["pfRows"] = sorted(PF_ROWS)
    data["colourRows"] = ["SA-D21", "SA-I14", "SA-I15", "SA-I16"]
    pins_path.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")

    lines = mapping_path.read_text(encoding="utf-8").splitlines()
    lines += ["", "## The rows of the rest-of-preferences list that 7A changed (`PF_ROWS`)", "",
              f"{len(PF_ROWS)} rows. Release 7B's builder takes these from `build_7a_mapping.py`.", ""]
    for row in rows:
        if not row["id"].startswith("PF-"):
            continue
        lines += [f"### {row['id']}", "", f"**What happened:** {row['outcome']}."]
        lines += [f"- Now in `{i['file']}`: «{i['text']}»" for i in row["present"]]
        lines += [f"- Gone from `{i['file']}`{' (everywhere)' if i.get('everywhere') else ''}: «{i['text']}»" for i in row["absent"]]
        lines.append("")
    lines += ["## Retired from the programs and the words", ""]
    lines += [f"- `{p['file']}`{' (everywhere)' if p['everywhere'] else ''}: «{p['text']}»" for p in retired]
    lines += ["", "## Rows of the later topics' ledgers that 7A changed", "",
              "The same lines as rows pinned above; each later release reads its own ledger against them.", ""]
    lines += [f"- {rid}: {why}." for rid, why in OTHER_LEDGER_ROWS.items()]
    mapping_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"MAPPING_OK {len(rows)} pins; {len(SA_ROWS)} SA rows and {len(PF_ROWS)} PF rows mapped")


if __name__ == "__main__":
    main()
