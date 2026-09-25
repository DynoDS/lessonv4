"""The colours release: the mapping and the pins for every ledger row it changed.

The rest-of-preferences ledger (`PF-`, 1,779 rows) has no pin file yet: release
7B makes it, and 7C was built beside it on a side branch. So this release pins
only the rows it changed, from both topic 7 ledgers (36 `PF-` rows and 4 `SA-`
rows), the rows it kept on purpose because his answer bears on them, the new
mechanisms it added, the retired wordings (barred everywhere unless marked
local), and its one home, the visual profile's Semantic colour, paragraph by
paragraph. When 7B builds the whole `PF-` pin file it takes these rows' pins
from `COLOURS_ROWS` below rather than from the ledger's old quotes.

    python -X utf8 build_colours_mapping.py

Writes `plugins/lesson-v4/scripts/tests/colours_ledger_pins.json` and
`plans/2026-09-25-colours-mapping.md` in the copy this file sits in (printed
before writing)."""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from ledger_mapping import (REPO, ROOT, Q, P, absent_everywhere, home_paragraphs,  # noqa: E402
                            norm, paragraph_of, pin_of, text_of)

PREF = "references/preferences.md"
PROFILE = "references/teacher-slide-visual-profile.md"
PLAYBOOK = "references/slide-composition-playbook.md"
TMPL = "references/templates.md"
SPEECH = "references/slide-speech-and-characters.md"
CONTRACT = "references/output-template.md"
SLIDE_DESIGNER = "agents/slide-designer.md"
MATHSH = "references/worksheet-helpers/maths.md"
WALL_VL = "references/working-wall-visual-language.md"
WALL_PREF = "references/working-wall-preferences.md"
WALL_CC = "references/working-wall-card-contracts.md"
CHECK = "builder/scripts/check-slide-design.js"
LOG = "references/build-review-log.md"
PT = "builder/src/presentation-text.js"
CALLOUT = "builder/src/content/callout.js"
CHIPS = "builder/src/content/chip-bank.js"
FRAME = "builder/src/content/method-frame.js"
STYLES = "builder/src/styles.js"
METHODS = "worksheet-html/src/helpers/methods.js"
TOKENS = "worksheet-html/src/tokens.js"
WALL_STYLE = "working-wall-html/style.json"
WALL_SHARED = "working-wall-html/src/shared.js"
WALL_SECTION = "working-wall-html/src/render-section.js"
WALL_OVERVIEW = "working-wall-html/src/render-overview.js"
WALL_DISPLAY = "working-wall-html/src/render-display.js"
TEACH = "builder/src/teach-layouts.js"
STEPS = "builder/src/content/steps.js"
VALIDATE = "builder/src/validate.js"
FRAMES = "worksheet-html/src/helpers/frames.js"

D11 = ("decision 11 (his words: \"I want blue means question or like a short task as in like explain "
       "why or something like that. And yeah, green is vocabulary or an answer. So we'd have to fix "
       "those.\"), with the change plan's question 1 (\"yes\": a longer instruction about how to go about "
       "it stays black)")
D11_PURPLE = "decision 11, worked examples (\"Worked examples can be something different. Maybe purple.\"; then \"worked example purple too\")"
ANSWER_25 = ("his answer of 25 September 2026 (\"y\": `Explain your answer using the photograph.` is blue, so a job "
             "that names what to use is still the job, and only a line that says how to go about it stays black)")
D22 = "decision 22, its colour half (\"yes\": the wall uses the board's colour meanings; the mapping derived from it, rendered for him)"
D14 = "decision 14 (settled item 14, \"yes\": out-of-date text corrected to match his rulings or the program)"
FOLD = ("folded into the visual profile's Semantic colour, which owns the grammar (the change plan's "
        "homes table); preferences keeps his words and a pointer that names every part")

BLUE_HOME = ("**Blue asks or sets a short task, and a worked example is purple.** In the teacher's words: \"I "
             "want blue means question or like a short task as in like explain why or something like that.")
PROFILE_BLUE = "- **House blue is the colour of the child's job: a question they answer, or a short task.**"
PROFILE_BLACK = ("- Black carries everything else the board says: teacher explanation, supporting prose, "
                 "statements, takeaways, success-criteria body text, reminder body text, and a longer "
                 "instruction about how to go about the task.")
PROFILE_ORDER = ("the question goes blue, and what follows it takes its own colour, blue for the child's short "
                 "task and black for advice on how to go about it.")
PROFILE_PEER = ("it must never imply correctness, answer status, sequence, difficulty or category meaning, so a "
                "sequence whose order matters and categories whose colours already carry meaning never take it.")
PROFILE_VERBS = ("so a verb is never blue on its own: a short task is blue as a whole line, and an instruction "
                 "about how to go about it stays black however many verbs it exposes.")
PROFILE_STARTER = "- **The starter is the one place a question is normally black.**"

# (row, outcome, present [(file, phrase)], absent [(file, phrase[, "local"])])
COLOURS_ROWS = {
    "PF-R02": (f"{FOLD}; {D11}",
               [(PREF, BLUE_HOME), (PREF, "a longer instruction about how to go about it stays black"),
                (PREF, "the starter's questions, which stay black or alternate"),
                (PROFILE, PROFILE_BLUE), (PROFILE, PROFILE_BLACK), (PROFILE, PROFILE_ORDER),
                (PROFILE, PROFILE_STARTER)],
               [(PREF, "**Blue asks; everything else tells.**"),
                (PREF, "and the instructions children act on"),
                (PREF, "question blue, instruction black")]),
    "PF-R03": (f"{FOLD}; the peer line gains the one condition it lacked (\"answer status\")",
               [(PROFILE, PROFILE_PEER), (PREF, "the peer colours and their limits")],
               [(PREF, "A compact set of two or more equal-status peer prompts may alternate house blue and house purple", "local")]),
    "PF-R04": (f"out of date since 4.2.109 ({D14}) and against {D11}: its first sentence retired, its second moved "
               "into the profile's action-verb line",
               [(PROFILE, PROFILE_VERBS),
                (PROFILE, "Use size, position and spacing before colour when prominence alone is the job.")],
               [(PREF, "Existing task-action verbs may use house blue")]),
    "PF-R15": (f"reworded: {D11}, with {ANSWER_25}",
               [(PROFILE, PROFILE_BLUE),
                (PROFILE, "A job that also names what to use is still the job, and blue: `Explain your answer using the photograph.` and `Describe each tooth using the pictures.` (the teacher's answer, 25 September 2026)."),
                (PROFILE, "`Explain your answer.`, `Write one reason.`, `Explain why.`, `Round 346 to the nearest 10.` - and it is blue too, as a whole line, marked `colorRole: \"task-blue\"`.")],
               [(PROFILE, "House blue is the colour of a question to children, and of nothing else on the slide.")]),
    "PF-R16": (f"reworded: {D11}; the date and \"a task is black either way\" went, the reason stayed; the story is in the build log; its black examples are saved lines that only say how to go about the job, by {ANSWER_25}",
               [(PROFILE, PROFILE_BLACK),
                (PROFILE, "The limit is what keeps blue meaning something:"),
                (PROFILE, "Which a line is, the job or advice on how to do it, is your judgement, and no count of words decides it:"),
                (PROFILE, "`Use the shaded map.`, `Use the number line to help you.` and `Look at the shaded areas and the Equator.` are all black: each only tells a child how to go about the job, and sets no job of its own."),
                (PROFILE, "the test is the line's main ask."),
                (PROFILE, "The check reads the role, not the words:")],
               [(PROFILE, "a task is black either way"),
                (PROFILE, "Point to the details in the photograph that support your comparison"),
                (PROFILE, "runs to five words or fewer"),
                (PROFILE, "(flagged by the user, 3 September 2026)", "local")]),
    "PF-R19": (f"reworded: {D11}; his words kept without the date",
               [(PROFILE, PROFILE_ORDER),
                (PROFILE, "`Is Isla correct?` is blue and `Explain your answer.` beneath it is blue too, because it is the job (one `task-blue` line may hold both);"),
                (PROFILE, "\"even if I put paragraph breaks between them, they're still all black text. So I thought, why not make the question blue?\"")],
               [(PROFILE, "`Is Isla correct?` is blue and `Explain your answer.` is black beneath it."),
                (PROFILE, "the question goes blue, the instruction that follows it stays black")]),
    "PF-R18": (f"reworded: {D11} (the deck-wide treatment covers the short task too, as the playbook's line does)",
               [(PROFILE, "- The treatment is deck-wide: every child-facing question and short task outside the starter carries it, not a favoured few.")],
               [(PROFILE, "every child-facing question outside the starter carries it", "local")]),
    "PF-R05": (f"changed by {D11_PURPLE}: a prepared, finished example is a worked example, so purple; the rest of the paragraph kept",
               [(PREF, "**Green has a fixed teaching role.** Green pupil-facing text is reserved for answers being revealed or marked, vocabulary emphasis, vocabulary slides and success-criteria treatment."),
                (PREF, "Prepared examples and `visible-in-unit` models are worked examples, finished before the class sees them, so they are purple, the same colour as a sticky fact, never answer green."),
                (PREF, "Do not colour ordinary teaching explanations green for emphasis.")],
               [(PREF, "are teaching content and stay black")]),
    "PF-R34": (f"changed by {D11_PURPLE}",
               [(CONTRACT, "- `visible-in-unit` stores a completed prepared model that is visible in its source unit as a worked example, in the worked-example purple. It is not an answer reveal.")],
               [(CONTRACT, "ordinary black teaching content")]),
    "PF-R35": (f"changed by {D11_PURPLE}; its limits (not an answer reveal, no answer treatment) kept",
               [(CONTRACT, "The resource designer renders the structured completed outcome as a worked example, in the worked-example purple, inside that source unit's prepared model."),
                (CONTRACT, "answer-green text, an answer-green outline or another answer-reveal treatment on `visible-in-unit` content.")],
               []),
    "PF-R36": (f"changed by {D11_PURPLE}",
               [(SLIDE_DESIGNER, "render the prepared model as a worked example, in purple (`colorRole: \"worked-purple\"` on its text lines). Do not use answer-green styling.")],
               [(SLIDE_DESIGNER, "ordinary black teaching content")]),
    "PF-R40": (f"changed by {D11_PURPLE}; the green limits kept",
               [(TMPL, "Prepared examples and `visible-in-unit` models are worked examples: give their lines `colorRole: \"worked-purple\"`."),
                (TMPL, "Use answer green only on an answer/reveal slide.")],
               [(TMPL, "remain body black")]),
    "PF-R53": (f"changed by {D11_PURPLE}",
               [(TMPL, "Prepared teaching models are worked examples: give the card `colorRole: \"worked-purple\"`.")],
               [(TMPL, "Prepared teaching models stay black.")]),
    "PF-B41": (f"its reason corrected to {D11}: a verb is never blue on its own, because blue is the child's job as a whole line",
               [(PROFILE, "it renders bold in the line's own colour, never blue on its own, because blue belongs to the child's job as a whole line, a question or a short task (Semantic colour below).")],
               [(PROFILE, "because blue belongs to questions")]),
    "PF-B61": (f"its reason corrected to {D11}",
               [(PLAYBOOK, "so exposing a verb never turns an instruction blue; blue stays with the child's job as a whole line, the question or the short task.")],
               [(PLAYBOOK, "blue stays the question's")]),
    "PF-R24": (f"reworded: {D11} (the final pass checks short tasks too)",
               [(PROFILE, "- check the colour of questions and short tasks, task-action emphasis, peer colour and safety/problem colour against their semantic roles;")],
               [(PROFILE, "check focal-question colour", "local")]),
    "PF-R25": (f"reworded: {D11}, blue and the worked example's purple",
               [(PLAYBOOK, "a question children answer, or a short task (the child's job, `task-blue`), carries house blue; everything else the board says stays black, including an instruction about how to go about the task;"),
                (PLAYBOOK, "Prepared examples and visible-in-unit models are worked examples, in purple (`worked-purple`).")],
               [(PLAYBOOK, "everything else the board says stays black, including the instructions children act on"),
                (PLAYBOOK, "Prepared examples and visible-in-unit models stay black")]),
    "PF-R26": (f"reworded: {D11}",
               [(PLAYBOOK, "Every child-facing question and short task outside the starter carries the blue;")],
               [(PLAYBOOK, "Every child-facing question outside the starter carries the blue")]),
    "PF-R27": (f"reworded: {D11}",
               [(TMPL, "- `focus-blue` - a question children answer, in house blue; an instruction stays black unless it is the child's short task, which takes `task-blue`"),
                (TMPL, "- `task-blue` - a short task, the child's job itself (`Explain your answer.`, `Write one reason.`, `Round 346 to the nearest 10.`), in house blue,")],
               [(TMPL, "an instruction they act on stays black")]),
    "PF-R28": (f"out of date since 4.2.109 ({D14}), corrected to {D11}",
               [(TMPL, "every child-facing question carries it, and a short task carries it through `colorRole: \"task-blue\"`, never a hex, so the check can see it is one;"),
                (TMPL, "such as the blue question or orange supplied material.")],
               [(TMPL, "every child-facing question and instruction carries it"),
                (TMPL, "such as the blue question/instruction", "local")]),
    "PF-R30": (f"the fold of PF-R03 ({FOLD})",
               [(PROFILE, PROFILE_PEER)],
               [(PROFILE, "it must never imply correctness, sequence, difficulty or category meaning.", "local")]),
    "PF-R32": (f"reworded: {D11} (a short task is blue as a whole line); PF-R04's second sentence joins it; "
               "the PSHE case stays as a plain undated example (the build log holds it)",
               [(PROFILE, PROFILE_VERBS),
                (PROFILE, "A task sentence with `Choose`, `Draw`, `Label` and `add arrows` each in question blue reads as four alternating chunks, and leaves the question on the same slide nothing to lift it.")],
               [(PROFILE, "so an instruction stays black however many verbs it exposes"),
                (PROFILE, "a Year 4 PSHE deck once had", "local")]),
    "PF-R89": (f"reworded: {D22} (sticky fact and worked example purple, taught words green, titles blue)",
               [(WALL_VL, "each colour means what it means on the board, so a child reads one colour language across the room:"),
                (WALL_VL, "Card type drives colour, in the board's meanings: worked example and sticky knowledge purple, vocabulary green, misconception red beside green, sentence stem neutral with its modelled line purple, and a blue title bar or header on every other card."),
                (WALL_VL, "The sticky card says \"fact\": one sentence to keep, where a method has numbered steps.")],
               [(WALL_VL, "Card type drives colour: worked example green, sticky blue"),
                (WALL_VL, "The blue panel says \"fact\"."),
                (WALL_VL, "the green cards are how-to-do-it cards")]),
    "PF-R90": (f"reworded: {D22} with {D11_PURPLE} (the modelled line is a worked example of the stem)",
               [(WALL_VL, "modelled version directly beneath in purple, a worked example of the stem."),
                (WALL_VL, "a supported child copies the purple; an independent child uses the black."),
                (WALL_VL, "Wrong on the left in red, right on the right in green. The colour split is the teaching.")],
               [(WALL_VL, "a supported child copies the green"),
                (WALL_VL, "modelled version directly beneath in the green panel accent")]),
    "PF-R91": (f"reworded: {D22} (the vocabulary cards leave teal for the board's green)",
               [(WALL_VL, "Children learn \"green cards = vocabulary\" through repetition across the unit.")],
               [(WALL_VL, "Children learn \"teal cards = vocabulary\""),
                (WALL_VL, "identifiable by its teal title bar", "local")]),
    "PF-R95": (f"out of date ({D14}): the ring has been green since 13 September 2026",
               [(MATHSH, "highlighted (the one digit that changed, ringed in green, the same ring the board draws).")],
               [(MATHSH, "ringed in the question blue")]),
    "PF-R97": (f"out of date ({D14}): the summary now matches the catalogue's own `tally-chart` entry",
               [(TMPL, "reveals that frequency as an answer, on an answer slide; a My Turn models its frequencies in plain black (see `tally-chart`).")],
               [(TMPL, "for the modelled rows on a My Turn and the whole column on an answer slide")]),
    "PF-Y64": (f"reworded: {D11} (and {D14}: \"and of nothing else\" overstated the rule)",
               [(TMPL, "(a verb is never blue on its own: the whole line is blue only when it is a question or a short task);")],
               [(TMPL, "house blue stays the colour of a question and of nothing else")]),
    "PF-Y68": (f"corrected: {D11} (a table's deciding word in bold, not blue, and bold names where it shows nothing); its second quote follows {D11_PURPLE}",
               [(TMPL, "The common use is `**bold**` on the deciding word of a branch/lookup table"),
                (TMPL, "The first column is bold throughout, so a deciding word there takes no mark: bold shows nothing in it. `[[ ]]` is question blue, and a deciding word is not a question."),
                (TMPL, "A completed prepared example or `visible-in-unit` model is a worked example, but a cell takes no colour role, so in a table it stays the table's black.")],
               [(TMPL, "The common use is `[[ ]]` on the deciding word"),
                (TMPL, "model uses ordinary black text", "local")]),
    "PF-Y70": (f"corrected: {D11} (a worked example the lesson shows is wrong is not printed as an answer) and his later answer on it, \"purple is fine\": a worked row is `worked: true`, purple",
               [(TMPL, "A worked chain is a worked example, not an answer, and a worked example is purple, a mistaken one included: mark its rows `worked: true` (below) and never `answer`, because green tells a child the number is right."),
                (TMPL, "- `worked`: `true` marks the row as part of a worked example the class watches, finished or about to be shown wrong, and prints its digits in the worked-example purple, the sticky fact's colour.")],
               [(TMPL, "Correctness is not the test."),
                (TMPL, "still prints green, because green marks what the number IS"),
                (TMPL, "green marks what the number IS")]),
    "PF-Y74": (f"kept, and {D11} corrected beside it: a taught word in a bank is written `{{{{word}}}}` and prints green (the chip-bank code)",
               [(TMPL, "`yellow` — the warm word-bank look (pale yellow fill, orange outline, black text), matching the White Rose word banks. Use for a vocabulary / word bank."),
                (TMPL, "**A taught word in a bank is green, in any variant.**"),
                (TMPL, "\"chips\": [\"{{square}}\", \"{{rectangle}}\", \"{{rhombus}}\", \"{{parallelogram}}\", \"{{trapezium}}\"] }")],
               []),
    "PF-Y76": (f"corrected: {D11} (a callout's colours are the board's; green is not a callout colour)",
               [(TMPL, "`\"black\"` (default) an observation about what happened or what is true, black like every statement on the board;"),
                (TMPL, "Green is not a callout colour: a green edge round black words is a frame, not an answer,")],
               [(TMPL, "`\"green\"` (default) an observation"),
                (TMPL, "`\"blue\"` the thing being decided on")]),
    "PF-Y77": (f"corrected: {D11} (a word inside a statement stays black; the ledger's own example; a callout's line is bold throughout, so bold picks out nothing there)",
               [(TMPL, "So \"The tens column changes.\" stays black, because a statement is black on every slide and `[[ ]]` is kept for a question; and a callout's line is bold throughout, so no word in it is picked out by `**bold**`."),
                (TMPL, "\"text\": \"The tens column changes.\",")],
               [(TMPL, "The [[tens]] column changes."),
                (TMPL, "`[[tens]]` is focus blue")]),
    "PF-J13": (f"out of date ({D14}): a one-line pointer to Question Labelling; the lone-(1) history is in the build log",
               [(PROFILE, "The profile calibrates how numbering is *seen*, not which lessons get numbered work: numbering follows the Question Labelling rules in `preferences.md`, and this profile adds no numbering rule of its own.")],
               [(PROFILE, "A lone (1) on the circuit calibration was not identified as an intentional teacher correction."),
                (PROFILE, "does not establish that a single main-independent question should lose its normal numbering")]),
    "PF-R72": (f"reworded: {D11} makes its blue task line right (a leftover `Explain.` is a short task), and it now names the role that makes it blue, without which the check refuses it",
               [(SPEECH, "a separate task line outside the bubble, in question blue as the child's short task (`colorRole: \"task-blue\"`).")],
               [(SPEECH, "a separate task line in question blue outside the bubble.")]),
    "PF-B56": (f"reworded: {D11} (a short task takes its blue beside the question's); pinned whole, since the second check added \"while every instruction stays black\" to it and nothing failed",
               [(PROFILE, "A statement followed by the question or instruction it sets up splits there, and a question or a short task takes its blue per Semantic colour")],
               [(PROFILE, "and a question takes its blue per Semantic colour", "local")]),
    "SA-D21": (f"{FOLD}; the profile's starter line carries it (the starters list's copy of PF-R02's exception); {D11}",
               [(PROFILE, PROFILE_STARTER),
                (PROFILE, "Where a starter carries several, alternate them black, blue, black, blue:"),
                (PREF, "the starter's questions, which stay black or alternate")],
               [(PREF, "Starter questions are the exception and stay black, alternating black, blue, black, blue when there are several of them.", "local")]),
    "SA-I14": (f"reworded: {D22} with {D11_PURPLE}: the worked-example card is purple and shares it with the sticky fact, so the card's shape says method or fact",
               [(WALL_VL, "If the lesson teaches a procedure, that is a `workedExample` card; it goes on a purple panel with its steps numbered down the left."),
                (WALL_VL, "numbered steps ending in a worked example say method, one sentence says fact, and a procedure on a sticky card reads as a fact, not a method.")],
               [(WALL_VL, "it goes on a green panel, with the green identity"),
                (WALL_VL, "a procedure on a blue panel reads as a fact")]),
    "SA-I15": (f"reworded: {D22}: the sticky card says \"fact\" by its shape",
               [(WALL_VL, "| A procedure on a sticky-knowledge panel | The sticky card says \"fact\": one sentence to keep, where a method has numbered steps. A procedure on it reads as a fact, not a method, and children stop trusting what the card types mean across the unit. |")],
               [(WALL_VL, "Children stop trusting the colour grammar across the unit.")]),
    "SA-I16": (f"reworded: {D22}",
               [(WALL_VL, "purple for a fact to keep and for a worked example (the board's sticky and worked-example purple), green for taught words and for the right answer beside a red wrong one, blue for titles and headers,")],
               [(WALL_VL, "green for worked examples, blue for sticky knowledge, red/green pair for misconceptions")]),
}

ADDED = [
    ("COL-ADD-01", f"added by {D11}: a short task is marked by the designer with `colorRole: \"task-blue\"`, drawn in house blue; the check refuses every other blue line that asks nothing, and a task-blue line the spec shows is not a short task (the reveal mark, a sticky fact by its sparkle or the design's words, the design's answer, a statement or task before a question, two sentences that are not questions); the role never makes a slide's turn, and the turn's verb list gains the saved decks' openers",
     [(PT, "  'task-blue',"),
      (PT, "if (role === 'task-blue') return COLOURS.title;"),
      (CHECK, "if (nodeIsBlue(node) && node.colorRole !== 'task-blue' && typeof whole === 'string') {"),
      (CHECK, "signal: 'TASK_BLUE_NOT_A_SHORT_TASK',"),
      (CHECK, "if (TASK_BLUE_REVEAL.test(whole)) {"),
      (CHECK, "if (whole.trim().startsWith('\u2728') || facts.sticky.has(plainLine(whole))) {"),
      (CHECK, "if (facts.answers.has(plainLine(whole))) {"),
      (CHECK, "return `it holds ${tasks.length} sentences that are not questions, and a short task is one`;"),
      (CHECK, "if (tasks.length === 1 && sentences[sentences.length - 1].endsWith('?')) {"),
      (CHECK, ".concat(taskBlueWarnings(lesson, jsonPath))"),
      (CHECK, "const ownColour = [node.color, node.colour].find((c) => typeof c === 'string' && c.trim());"),
      (CHECK, "else if (node.colorRole === 'task-blue' && taskBlueAsks(node)) found = true;"),
      (CHECK, "'pick', 'place(?! value)', 'plan', 'plot', 'point', 'prove', 'put', 'read',"),
      (CHECK, "'nothing. Blue is for a question children answer, and for the ' +"),
      (CHECK, "'label. Colour does not make a line a task: a statement or an instruction ' +"),
      (TMPL, "one line holds one task;")]),
    ("COL-ADD-02", f"added by {D11}: the header's small cue stays black, because it is advice on how to go about the task",
     [(PROFILE, "The cue is drawn black. It tells a child how to go about the task, and advice stays black; the job it helps with is in the body, in blue.")]),
    ("COL-ADD-03", f"added by {D11}: the callout's default is black and green is not one of its colours",
     [(CALLOUT, "black:  { fill: 'F2F2F2', line: COLOURS.body   },"),
      (CALLOUT, "const DEFAULT_VARIANT = 'black';")]),
    ("COL-ADD-04", f"added by {D11}: a chip written `{{{{word}}}}` prints in vocabulary green without its braces",
     [(CHIPS, "const TAUGHT_CHIP = /^\\{\\{([\\s\\S]+)\\}\\}$/;"),
      (CHIPS, "color: c.taught ? COLOURS.green : variant.text,")]),
    ("COL-ADD-05", f"added by {D11_PURPLE}: a worked line takes `worked-purple`; the method frame is purple on the board and on the sheet; the profile and the catalogue say so",
     [(STYLES, "worked:      '7030A0',"),
      (PT, "  'worked-purple'"),
      (PT, "if (role === 'worked-purple') return COLOURS.worked;"),
      (FRAME, "const PANEL_LINE      = COLOURS.worked;"),
      (FRAME, "const TITLE_COLOUR    = COLOURS.worked;"),
      (TOKENS, "worked: \"#7030A0\","),
      (METHODS, ".h-mframe-framed.h-mframe-worked { border-color: var(--colour-worked); }"),
      (METHODS, ".h-mframe-worked .h-mframe-title { color: var(--colour-worked); }"),
      (METHODS, "return !segs.some((s) => s.box) && segs.some((s) => /\\d/.test(s.text));"),
      ("builder/src/content/steps.js", "splitAnswerRuns(step.text, true, step.worked ? COLOURS.worked : undefined)"),
      (CHECK, "hex: take the `color` off and keep `colorRole: \"task-blue\"`."),
      ("stick-in-sheets-html/build.js", "const captionText = withoutTaughtMarks(moments.length === 1"),
      (PROFILE, "and the sheet's method frame matches it when it shows worked numbers; an empty one, the child's to fill in every box, keeps its ink edge and blue heading."),
      (MATHSH, "A frame that shows worked numbers, one line or more worked right through, is a worked example and takes the worked-example purple on its edge and heading, as on the board; a frame the child fills in every line keeps its ink edge and blue heading."),
      (TMPL, "An ordered list of labelled lines inside a purple \"method\" panel, the worked-example colour (the same purple as a sticky fact):"),
      (TMPL, "- `title` — optional purple heading above the lines"),
      (TMPL, "- `frame` — draw the purple panel behind the lines."),
      (TMPL, "- `worked-purple` - a worked example the class sees finished (a prepared example, a `visible-in-unit` model), in the sticky fact's purple, never answer green; a place-value chart row takes `worked: true` instead, and any other drawn figure keeps its own colours."),
      (PROFILE, "- A worked example is purple, the same colour as a sticky fact."),
      (PROFILE, "Purple does not reach a figure with no purple of its own (a number line, a bar model, a tally, a table's cells), a worksheet's first worked row, or the good card of a strong-and-weak pair: those keep their own colours."),
      (TEACH, ".filter((k) => !(k === 'colorRole' && value.colorRole === 'worked-purple'));"),
      (TEACH, "else if (slot.worked) out.colorRole = 'worked-purple';"),
      (TEACH, "return { text: words, colorRole: 'worked-purple' };"),
      (TEACH, "if (item.worked && role === 'extract') {"),
      (TMPL, "The lines of a worked example, a prepared model the class sees finished, take `\"colorRole\": \"worked-purple\"` and print purple;"),
      (STEPS, "worked: step.colorRole === 'worked-purple'"),
      (STEPS, "color: step.worked ? COLOURS.worked : COLOURS.body,"),
      (STEPS, "const badgeColour = step.worked ? COLOURS.worked : COLOURS.green;"),
      (VALIDATE, "if (step.colorRole === 'worked-purple') return;"),
      (TMPL, "A step of a worked example set out as steps is `{ \"text\": \"...\", \"colorRole\": \"worked-purple\" }`: its words and its number print purple, the worked example's colour, and the build refuses any other role on a step.")]),
    ("COL-ADD-06", f"added by {D22}: the wall's palette in the board's meanings (every value the mapping decided), its parts in the board's category colours, a part's answer green, and the board's colour marks drawn on the wall",
     [(WALL_STYLE, "\"stickyTitleBarFill\": \"7030A0\","),
      (WALL_STYLE, "\"stickyPanelFill\": \"EDE3F5\","),
      (WALL_STYLE, "\"stickyPanelLine\": \"7030A0\","),
      (WALL_STYLE, "\"stickyLabel\": \"7030A0\","),
      (WALL_STYLE, "\"workedExampleTitleBarFill\": \"7030A0\","),
      (WALL_STYLE, "\"workedExamplePanelFill\": \"EDE3F5\","),
      (WALL_STYLE, "\"workedExamplePanelLine\": \"7030A0\","),
      (WALL_STYLE, "\"workedExampleLabel\": \"7030A0\","),
      (WALL_STYLE, "\"sentenceStemTitleBarFill\": \"0070C0\","),
      (WALL_STYLE, "\"sentenceStemPanelFill\": \"F4F6FA\","),
      (WALL_STYLE, "\"sentenceStemPanelLine\": \"7F7F7F\","),
      (WALL_STYLE, "\"sentenceStemLabel\": \"7030A0\","),
      (WALL_STYLE, "\"sentenceStemBullet\": \"000000\","),
      (WALL_STYLE, "\"misconceptionTitleBarFill\": \"0070C0\","),
      (WALL_STYLE, "\"referenceTableHeaderFill\": \"0070C0\","),
      (WALL_STYLE, "\"vocabDefinitionTitleBarFill\": \"00B050\","),
      (WALL_STYLE, "\"vocabDefinitionPanelFill\": \"D5F5E3\","),
      (WALL_STYLE, "\"vocabDefinitionPanelLine\": \"00B050\","),
      (WALL_STYLE, "\"equivalenceGridTitleBarFill\": \"0070C0\","),
      (WALL_STYLE, "\"mnemonicTitleBarFill\": \"0070C0\","),
      (WALL_STYLE, "\"labelledDiagramTitleBarFill\": \"0070C0\","),
      (WALL_SECTION, "{ strip: \"0070C0\", fill: \"EEF5FB\", accent: \"0070C0\" },"),
      (WALL_SECTION, "{ strip: \"E46C0A\", fill: \"FEF4EB\", accent: \"E46C0A\" },"),
      (WALL_SECTION, "{ strip: \"7030A0\", fill: \"F4EEF9\", accent: \"7030A0\" },"),
      (WALL_SECTION, "const RESULT_GREEN = \"00B050\";"),
      (WALL_SECTION, "const RESULT_WORKED = \"7030A0\";"),
      (WALL_SECTION, "background:${hash(item.worked ? RESULT_WORKED : RESULT_GREEN)};"),
      (WALL_SHARED, ".replace(TAUGHT_MARK, \"$1\")"),
      (WALL_CC, "| `cards[].parts[].worked` | `true` when the part shows a worked example rather than the answer, a mistaken one always (`Sam wrote 340.`): its result strip is the worked-example purple, as on the board. Without it the strip is answer green, which tells a child the result is right. |"),
      (WALL_SHARED, "function markedHtml(text) {"),
      (WALL_OVERVIEW, "overviewTextHtml(group.title, 34, style, { color: idx === 0 ? \"0070C0\" : \"E46C0A\" }) +"),
      (WALL_DISPLAY, "style.colours.labelledDiagramTitleBarFill"),
      (WALL_CC, "**Colour marks carry over.** Words copied from the board keep its colour marks, and the renderer draws them in the board's colours: a taught word written `{{word}}` is green in a worked example's steps and lines, a sticky fact, a vocabulary definition, a misconception's two sides, a sentence stem, a reference-table cell and a section's notes and steps, as it is on the board, and `((part))` and `<<decide>>` keep theirs. On a title, a heading, a coloured strip or inside a figure (a labelled diagram's labels, a Venn's items) the word prints plain, and a taught word's braces never print on any card or in any figure. Every other colour on the wall is the renderer's, in the board's meanings."),
      (WALL_PREF, "the fully-modelled version directly beneath in purple, the worked-example colour, so the contrast is doing the teaching."),
      (WALL_PREF, "Each chip is the word in bold green in a green-outlined box, the green every taught word is on the board,")]),
    ("COL-ADD-07", f"the old rule cleared from two code comments by {D11}: `[[x]]` is a question, not a table's deciding word; a wrong chain is not marked an answer, with his 19 September hand edit kept on record",
     [("builder/src/answer-text.js", "//   [[x]]   bold + focus blue: the part of a line that asks, a question"),
      ("shared/visuals/place-value-chart-svg.js", "// ring keeps its own meaning. In the same edit he greened a worked chain"),
      ("shared/visuals/place-value-chart-svg.js", "// that was wrong; his later answer changed that: green is a taught word")]),
    ("COL-ADD-08", f"added by {D11_PURPLE} and his answer on a mistaken worked example (\"purple is fine\"): a place-value chart row takes `worked: true`, its digits purple on every surface the shared chart draws",
     [("shared/visuals/place-value-chart-svg.js", "worked: '#7030A0',   // the worked-example purple, the sticky fact's colour"),
      ("shared/visuals/place-value-chart-svg.js", "worked: row.worked === true,"),
      ("shared/visuals/place-value-chart-svg.js", "const worked = !isDot && row.worked && !row.answer && text !== '';"),
      ("shared/visuals/place-value-chart-svg.js", "fill: worked ? pal.worked : (picked || revealed) ? pal.ring : pal.text, picked });"),
      (TMPL, "Every digit on a worked row is purple, the ringed one included, and so is its ring: nothing on a worked row is green, so a wrong digit is never printed as right."),
      ("shared/visuals/place-value-chart-svg.js", "const ringStroke = row.worked && !row.answer ? pal.worked : pal.ring;"),
      ("shared/visuals/place-value-chart-svg.js", "stroke=\"${r.stroke || L.pal.ring}\""),
      (PROFILE, "A worked example is purple even when the lesson is about to show it is wrong, the teacher's word: \"purple is fine\".")]),
    ("COL-ADD-09", "the build log's own claims about what the check refuses and where braces print, pinned because the third check put one back without a test failing (its D14)",
     [(LOG, "It refuses every other blue line that asks nothing, as 4.2.289 did (`BLUE_WITHOUT_A_QUESTION`, its message rewritten), and refuses a `task-blue` line the spec shows is not a short task (`TASK_BLUE_NOT_A_SHORT_TASK`):"),
      (LOG, "A taught word's braces never print on any card or from any figure: a title, a coloured strip and a figure's own words (a labelled diagram's labels, a Venn's items) print the word plain."),
      (LOG, "a caption the board sets as text under a figure keeps its mark and its green.")]),
    ("COL-ADD-10", "added by the third check (item 2, built the lead's chosen way): a taught word's braces never print from a figure; one shared helper takes them off wherever each surface hands a figure to a shared drawing, and a caption the board sets as text keeps its green",
     [("shared/text/criteria-marks.js", "function withoutTaughtMarks(value) {"),
      ("builder/src/figure-marks.js", "const plain = withoutTaughtMarks(node);"),
      ("builder/src/figure-marks.js", "return Object.assign({}, plain, { label: node.label });"),
      ("builder/build.js", "const coreLesson = withoutFigureMarks(withoutDecorations(lesson));"),
      ("worksheet-html/src/helpers/index.js", "REGISTRY[name] = withLegibilityFloor(FIGURE_HELPERS.has(name) ? withPlainFigureWords(helper) : helper);"),
      ("working-wall-html/src/svg-renderer.js", "const visual = withoutTaughtMarks(marked);"),
      ("working-wall-html/src/visuals.js", "const visual = withoutTaughtMarks(marked);"),
      ("stick-in-sheets-html/src/render-piece-html.js", "const item = withoutTaughtMarks(marked);"),
      (WALL_CC, "On a title, a heading, a coloured strip or inside a figure (a labelled diagram's labels, a Venn's items) the word prints plain, and a taught word's braces never print on any card or in any figure.")]),
]

RETIRED_CODE = [
    # Retired from the programs as well as the words: barred in every program.
    (CHECK, "The task stays BLACK: do not reach for house blue"),
    (CHECK, "instruction they act on is black, so drop the blue here"),
    (TOKENS, "four meanings instead of five"),
    (METHODS, "a fifth colour the system does not have"),
    (FRAMES, "four colour meanings"),
    (CHECK, "node.colorRole === 'focus-blue' || node.colorRole === 'task-blue') found = true"),
    ("shared/visuals/place-value-chart-svg.js", "fill: (picked || revealed) ? pal.ring : worked ? pal.worked : pal.text"),
    ("builder/src/answer-text.js", "a branch/reference table's deciding word"),
    (CALLOUT, "const DEFAULT_VARIANT = 'green';"),
    (FRAME, "const PANEL_LINE      = '00B050';"),
    (WALL_PREF, "Each chip is the word in bold teal in a teal-outlined box"),
]

HOMES = [(PROFILE, "## Semantic colour", "HOME-COL-PROFILE")]

LEDGERS = {"PF": "2026-09-23-preferences-rest-ledger.md", "SA": "2026-09-23-starters-sticky-apply-ledger.md"}


def ledger_dir() -> Path:
    """The ledgers live in the development checkout's plans folder. On a side
    branch's worktree they are not in its own plans folder, so they are read
    (never written) from the main worktree git names for this repository."""
    if (REPO / "plans" / LEDGERS["PF"]).exists():
        return REPO / "plans"
    import subprocess
    common = subprocess.run(["git", "rev-parse", "--path-format=absolute", "--git-common-dir"],
                            cwd=REPO, capture_output=True, text=True, check=True).stdout.strip()
    return Path(common).parent / "plans"


def ledger_rows(prefix):
    path = ledger_dir() / LEDGERS[prefix]
    print(f"reading {path}")
    rows = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        m = re.match(rf"^\| ({prefix}-[A-Z]\d{{2}}) \|", raw)
        if not m:
            continue
        p = P.search(Q.sub("", raw))
        if p:
            rows[m.group(1)] = (p.group(1), Q.findall(raw))
    return rows


def main():
    known = {**ledger_rows("PF"), **ledger_rows("SA")}
    problems = []
    out = []
    # A paragraph the home already pins, in its exact place, is not pinned
    # again row by row (the home's check is the stronger of the two).
    home_held = {(rel, para) for rel, heading, _tag in HOMES for para in home_paragraphs(rel, heading)}
    for rid, (outcome, present, absent) in COLOURS_ROWS.items():
        if rid not in known:
            problems.append(f"{rid}: not a row of its ledger")
            continue
        rel, quotes = known[rid]
        kept = [q for q in quotes if norm(q) in text_of(rel)]
        for f, phrase in present:
            if norm(phrase) not in text_of(f):
                problems.append(f"{rid}: not found in {f}: {phrase[:90]}")
        for f, phrase, *scope in absent:
            if norm(phrase) in text_of(f):
                problems.append(f"{rid}: still present in {f}: {phrase[:90]}")
        pins = [pin_of(f, x) for f, x in present]
        for f, x in present:
            para = paragraph_of(f, x) if f.endswith(".md") else None
            if para and para != norm(x) and all(para != q["text"] for q in pins) and (f, para) not in home_held:
                pins.append(pin_of(f, para, paragraph=True))
        out.append({"id": rid, "outcome": outcome, "ledgerFile": rel,
                    "quotesStillWordForWord": len(kept), "quotes": len(quotes),
                    "present": pins,
                    "absent": [{"file": a[0], "text": norm(a[1]),
                                "everywhere": (len(a) < 3 or a[2] != "local") and absent_everywhere(a[1])}
                               for a in absent]})
    for rid, outcome, present in ADDED:
        for f, phrase in present:
            if norm(phrase) not in text_of(f):
                problems.append(f"{rid}: not found in {f}: {phrase[:90]}")
        out.append({"id": rid, "outcome": outcome, "present": [pin_of(f, x) for f, x in present], "absent": []})
    retired = []
    for f, phrase in RETIRED_CODE:
        if norm(phrase) in text_of(f):
            problems.append(f"retired code phrase still in {f}: {phrase}")
        retired.append({"file": f, "text": norm(phrase), "everywhere": absent_everywhere(phrase)})
    out.append({"id": "COL-RETIRED-CODE", "outcome": "retired by decisions 11 and 22 from the programs, and one wall line no ledger row held",
                "present": [], "absent": retired})

    home_records = []
    for rel, heading, tag in HOMES:
        paragraphs = home_paragraphs(rel, heading)
        for n, para in enumerate(paragraphs, 1):
            out.append({"id": f"{tag}-{n:02d}", "outcome": f"a paragraph of {rel} {heading}, pinned whole",
                        "present": [{"file": rel, "text": para,
                                     "section": {"heading": heading, "occurrence": 0, "intro": False}}],
                        "absent": []})
        home_records.append({"file": rel, "heading": heading, "paragraphs": paragraphs})

    # A wording meant to be gone everywhere that another file still holds is a
    # copy the release missed, never a pin to quietly narrow.
    for row in out:
        for pin, spec in zip(row["absent"], COLOURS_ROWS.get(row["id"], (None, None, []))[2]):
            if (len(spec) < 3 or spec[2] != "local") and not pin["everywhere"]:
                problems.append(f"{row['id']}: meant to be gone everywhere, still somewhere: {pin['text'][:90]}")
    for pin in retired:
        if not pin["everywhere"]:
            problems.append(f"retired code phrase still somewhere: {pin['text'][:90]}")

    if problems:
        print("\n".join(problems))
        raise SystemExit(f"MAPPING_FAILED {len(problems)}")

    pins_path = ROOT / "scripts" / "tests" / "colours_ledger_pins.json"
    mapping_path = REPO / "plans" / "2026-09-25-colours-mapping.md"
    print(f"writing {pins_path}")
    print(f"writing {mapping_path}")
    pins_path.write_text(json.dumps({
        "ledgers": {k: f"plans/{v}" for k, v in LEDGERS.items()},
        "snapshot": "4.2.289 2db3ceba, with the colours release (topic 7's 7C) on the side branch streamline/7c-colours",
        "changedRows": sorted(COLOURS_ROWS),
        "homes": home_records,
        "rows": out,
    }, indent=1, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")

    lines = ["# The colours release (topic 7's 7C): the mapping", "",
             "Every ledger row the release changed, where its rule now lives and the decision that changed it; "
             "the rows kept on purpose; the new mechanisms; the retired wordings. Built by "
             "`streamline-tools/colours-change/build_colours_mapping.py`; the pins are "
             "`plugins/lesson-v4/scripts/tests/colours_ledger_pins.json`.", "",
             f"{len(COLOURS_ROWS)} ledger rows ({sum(1 for r in COLOURS_ROWS if r.startswith('PF-'))} from the rest of "
             f"preferences, {sum(1 for r in COLOURS_ROWS if r.startswith('SA-'))} from starters, sticky knowledge and "
             f"the Apply); {len(ADDED)} added mechanisms; one home, pinned paragraph by paragraph.", ""]
    for p in out:
        if p["id"].startswith("HOME-"):
            continue
        lines += [f"## {p['id']}", "", f"**What happened:** {p['outcome']}."]
        lines += [f"- Now in `{i['file']}`: «{i['text']}»" for i in p["present"]]
        lines += [f"- Gone from `{i['file']}`{' (everywhere)' if i.get('everywhere') else ''}: «{i['text']}»"
                  for i in p["absent"]]
        lines.append("")
    lines += ["## The home, pinned paragraph by paragraph", ""]
    for rec in home_records:
        lines.append(f"- `{rec['file']}` {rec['heading']}: {len(rec['paragraphs'])} paragraphs, each inside its own section, in this order.")
    mapping_path.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    print(f"MAPPING_OK {len(out)} pins; {len(COLOURS_ROWS)} ledger rows mapped")


if __name__ == "__main__":
    main()
