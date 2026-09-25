"""The worksheets release (4.2.290), step 5: the worksheet designer, its focused
repair and the builder (change plan section 1, decisions 5 and 10; section 2,
settled items a, f, g, h's two folds and O24, i, j and n)."""
from _patch import WSD, REPAIR, BUILDER, replace_once, assert_absent, assert_present

# ─── decision 5: a sheet a child could not use goes back ─────────────────
# His words, asked again plainly: "agree, should probably go back to be
# redesigned". Rule 11 (P20) is the one line. A sheet that contradicts the
# objective is a teaching problem that goes back (the first check's repair
# round, from his answer); the plan's draft had no example of a doubt, so
# none is written in.
replace_once(
    WSD,
    "11. **Flag, do not fix.** Upstream ambiguity, a contradiction with the LO,\n"
    "    something the helpers cannot render: add a `notes` entry and carry on.\n",
    "11. **A sheet a child could not use goes back; a doubt the teacher should hear\n"
    "    is a note.** A problem a child could not get past as printed (a question\n"
    "    they cannot act on, missing support, a wrong answer, a form or visual no\n"
    "    helper can carry faithfully), or a sheet that contradicts the objective,\n"
    "    stops that sheet: omit it and return it to its owner (its\n"
    "    `WORKSHEET_CONTENT_GAP` note and `returned` entry, above), and make the\n"
    "    other sheets as normal. A page merely plainer than hoped, or a doubt the\n"
    "    teacher should know about, is a `notes` entry and the sheet ships\n"
    "    (`worksheet-visual-profile.md` draws the same line).\n",
)

# Decision 5, and the first check's finding 1: the gate decides by a field,
# never by the note's words. The return is recorded beside the note; the
# orchestrator's routing (P05, above it) is unchanged.
replace_once(
    WSD,
    "The orchestrator returns an Expected gap to the lesson designer and a Below or\n"
    "Greater Depth gap to the adaptation designer. Rebuild only the affected sheet\n"
    "after the source is repaired.\n",
    "The orchestrator returns an Expected gap to the lesson designer and a Below or\n"
    "Greater Depth gap to the adaptation designer. Rebuild only the affected sheet\n"
    "after the source is repaired.\n"
    "\n"
    "Beside the note, record the return in `worksheet.json`'s top-level `returned`,\n"
    "which is what the gate reads (it never reads the note's words):\n"
    "`{ \"sheet\": \"below\", \"problem\": \"teaching\" }` for a problem a child could not\n"
    "get past as printed, or a sheet that contradicts the objective (rule 11), or\n"
    "`{ \"sheet\": \"below\", \"problem\": \"picture\", \"refs\": [\"adaptation-photo-002\"] }`\n"
    "when a picture the sheet needs will never arrive. A sheet sent back is out of\n"
    "`sheets`: a sheet in `sheets` is always checked and built, and the gate refuses\n"
    "an entry beside one, so when a redesigned sheet goes in, take its entry and its\n"
    "note off. The Expected sheet is never built around: returning it ends your run\n"
    "without `WORKSHEET_PREFLIGHT_OK`, on purpose, so report the return and stop.\n",
)

# Decision 5 (P16): the two exceptions and the boundary stay word for word.
replace_once(
    WSD,
    "1. **Question text is verbatim.** You do not paraphrase, renumber, re-pitch or\n"
    "   rewrite. Flag it in `notes` instead.\n",
    "1. **Question text is verbatim.** You do not paraphrase, renumber, re-pitch or\n"
    "   rewrite. A question you believe is wrong goes under rule 11.\n",
)

# Decision 5 (P08): a sheet a child could not use is not a note.
replace_once(
    WSD,
    "Problems go in `notes`,\n"
    "where the orchestrator surfaces them to the teacher; a flag written into your\n"
    "reply instead reaches nobody.\n",
    "Problems go in `notes`,\n"
    "where the orchestrator surfaces them to the teacher; a flag written into your\n"
    "reply instead reaches nobody. A sheet a child could not use is not a note: it\n"
    "goes back (rule 11).\n",
)

# ─── decision 10: a method's steps on a sheet ────────────────────────────
replace_once(
    WSD,
    "    always empty, and nothing on the page reprints them, as a panel or as a\n"
    "    list. A one-line job statement for a reference\n",
    "    always empty, and nothing on the page reprints them, as a panel or as a\n"
    "    list. Nor is a list of a method's steps printed just as a reminder for the\n"
    "    child to consult (`preferences.md` → The printed page; a one-line\n"
    "    reminder of a method is support); a fill-in frame the child writes into,\n"
    "    and steps a task needs worked through, print with their question.\n"
    "    A one-line job statement for a reference\n",
)
replace_once(
    WSD,
    "- Confirm no success criteria are printed, as a panel or as an instruction\n"
    "  carrying a list.\n",
    "- Confirm no success criteria are printed, as a panel or as an instruction\n"
    "  carrying a list, or a list of a method's steps printed just as a reminder.\n",
)

# ─── settled item a: a sheet leans on the board while children work ──────
# His 23 September ruling: "worksheets are not homework, worksheets are
# delivered in class all the time". The "never yours to drop" list and the
# `notes` line stay word for word.
replace_once(
    WSD,
    "   costs a child nothing when the same thing is on the board or the working\n"
    "   wall throughout the lesson. Reprinting it there",
    "   costs a child nothing when the same thing is on the board or the working\n"
    "   wall while they work on the sheet. Reprinting it there",
)
replace_once(
    WSD,
    "   that names a value only the reference carries); the child demonstrably meets\n"
    "   it elsewhere in this lesson, which you establish from the lesson design's\n"
    "   own slides, representations or working-wall entries rather than assuming it;\n",
    "   that names a value only the reference carries); the board or the working\n"
    "   wall shows it while they work on the sheet, which you establish from the\n"
    "   lesson design's own slides, representations or working-wall entries rather\n"
    "   than assuming it;\n",
)

# ─── settled item f: a picture that will never arrive ────────────────────
# His 2 September review: "may re-point a dead reference at a published
# picture, never replace it with a sentence saying what it showed". Scoped to
# a picture that will never arrive; the opening's "Do not ... replace a
# required photo" stands for every other picture.
replace_once(
    WSD,
    "`unavailable` the picture stage stopped before it ran and no approved\n"
    "filename will ever be published, so treat every affected ref as a required\n"
    "visual with no usable picture, apply the rule immediately below, and name the\n"
    "affected refs in your completion report. Never invent, substitute or quietly\n"
    "rewrite the task as text because of it.\n",
    "`unavailable` the picture stage stopped before it ran and no approved\n"
    "filename will ever be published, so first re-point each affected question at\n"
    "a picture this run has published or a drawing the engine makes, never at\n"
    "words. Only when neither can carry it is the ref a required visual with no\n"
    "usable picture: apply the rule immediately below, and name the affected refs\n"
    "in your completion report. This is for a picture that will never arrive; any\n"
    "other picture stays exactly as it is. Never invent, substitute or quietly\n"
    "rewrite the task as text because of it.\n",
)

replace_once(
    WSD,
    "`WORKSHEET_CONTENT_GAP: [sheet] — required visual [role] has no approved request; return to [lesson designer / adaptation designer]`\n",
    "`WORKSHEET_CONTENT_GAP: [sheet] — required visual [role] has no approved request; return to [lesson designer / adaptation designer]`\n"
    "\n"
    "with its `returned` entry: `\"problem\": \"picture\"` and the refs the sheet names\n"
    "(under `unavailable`, those refs, or none when the brief gave none). A\n"
    "required visual the brief never requested at all has no ref to name: it is\n"
    "the brief's own gap, so `\"problem\": \"teaching\"`.\n",
)

# The gate can now see that the picture stage will publish nothing
# (`--picture-stage`), so a sheet omitted over such a picture is not refused.
replace_once(
    WSD,
    "node \"[PLUGIN_ROOT]/worksheet-html/scripts/check-worksheet.js\" \"[WORKING_DIR]/worksheet.json\" \\\n"
    "  --adaptation \"[ADAPTATION_DESIGN when supplied]\" \\\n"
    "  --photo-requirements \"[PHOTO_REQUIREMENTS_PATH]\"\n",
    "node \"[PLUGIN_ROOT]/worksheet-html/scripts/check-worksheet.js\" \"[WORKING_DIR]/worksheet.json\" \\\n"
    "  --adaptation \"[ADAPTATION_DESIGN when supplied]\" \\\n"
    "  --photo-requirements \"[PHOTO_REQUIREMENTS_PATH]\" \\\n"
    "  --picture-stage \"[your PICTURE_STAGE: line, verbatim]\"\n",
)
replace_once(
    WSD,
    "Omit `--adaptation` (and `--photo-requirements`) only when no adaptation was\n"
    "supplied.",
    "Omit `--adaptation` (and `--photo-requirements`) only when no adaptation was\n"
    "supplied, and `--picture-stage` only when your prompt carries no\n"
    "`PICTURE_STAGE:` line.",
)
replace_once(
    WSD,
    "answer-key section, and with `--adaptation` it refuses a spec that dropped a\n"
    "directed Below or Greater Depth sheet over photographs the contract actually\n"
    "approves.\n",
    "answer-key section, and with `--adaptation` it refuses a spec that dropped a\n"
    "directed Below or Greater Depth sheet over photographs the contract actually\n"
    "approves and the run can still publish. It reads each returned sheet's\n"
    "`returned` entry, never the note's words: a teaching problem stands and goes\n"
    "back to its owner, and so does a picture problem whose named refs will never\n"
    "arrive (absent from the contract, or terminal, or under an `unavailable`\n"
    "picture stage); a picture problem over a picture still coming is refused,\n"
    "because that sheet can still be built, and so is a teaching problem while that\n"
    "sheet's own pictures (its Photo refs in the adaptation) are approved and not\n"
    "yet published. An entry beside a sheet still in `sheets`, or for a tier the\n"
    "adaptation does not direct, is refused too.\n",
)

# ─── settled item g (O33): only the level code prints ────────────────────
replace_once(
    WSD,
    "500mm is not a layout problem. The compact title and sheet code use the existing\n"
    "top printer margin and do not take space from the zones.\n",
    "500mm is not a layout problem. The sheet code uses the top printer margin and\n"
    "takes no space from the zones.\n",
)

# ─── settled item i (O20): a reference several questions use ─────────────
replace_once(
    WSD,
    "fit-priority route), not a licence to exile the support. The pointer line of\n"
    "rule 12 is for a reference that genuinely serves several questions, and that\n"
    "reference sits earlier in reading order than the first question using it. The\n"
    "same order holds",
    "fit-priority route), not a licence to exile the support. The pointer line of\n"
    "rule 12 is for a reference several questions use, and it sits where the\n"
    "printed page's test puts any support: before the first question that reads\n"
    "from it, after the work when a child only glances at it. The same order holds",
)

# ─── settled item h: the printed page's copy becomes a pointer ───────────
# The designer reads preferences.md -> Worksheets in full before it starts
# and composes at step 3, so the copy keeps each rule's both halves, and O20's
# four extras whole (support never exiled for a fit stays in the paragraph
# above; the shared panel's job line, the cross-the-page test and sequential
# material ahead are here). Move before you reword: the two paragraphs on
# support and on what sends something to the back are already one sentence
# per rule with both halves, so they stay word for word (a test and the
# vocabulary and success-criteria pins hold them). The two paragraphs on
# columns and reading order become the one pointer paragraph. The 31 August
# ruling stays in preferences.md exactly; the two cases go to the log, the
# first into preferences.md as a plain example.
replace_once(
    WSD,
    "**That holds across columns too, and it is the commonest way a two-column\n"
    "sheet goes wrong.** A stimulus and the questions that read it share a column,\n"
    "stimulus first. A shared panel every question works from - a map with its\n"
    "photographs, a source set, a data table - is a stimulus like any other: it goes\n"
    "above its questions, in their column, carrying its one job line (`Look at these\n"
    "photographs.`). What belongs in the OTHER column is what the run does not need:\n"
    "a drawing task, an independent extension, a question that starts fresh. The\n"
    "test is whether a child answering question 2 has to cross the page to see what\n"
    "question 2 is about. A lettered set is one block while you are at it - split A,\n"
    "B and C from D and the table headed `A to D` has its fourth row somewhere else\n"
    "on the page.\n"
    "\n"
    "Reading order still protects genuinely sequential material: a claim a question\n"
    "judges or a stem it completes stays ahead of its question. And the page begins\n"
    "top left with whatever the questions read from, with the run flowing so a child\n"
    "who has just finished one question can see the next without hunting - usually\n"
    "down a column, though a long question filling one side with the next beside it\n"
    "reads fine. What fails that test is a run ping-ponging left, right, left, right\n"
    "between short zones; the turned and mirrored layout variants always offer a\n"
    "followable arrangement instead.\n"
    "\n"
    "The teacher settled this on 31 August 2026, rejecting a science sheet whose\n"
    "question 1 sat top left with the photographs it asked about top right, and\n"
    "rebuilding it as photographs, then questions, with the drawing task alone on\n"
    "the other side. `preferences.md` (Worksheets) carries the decision and the\n"
    "superseded panel-on-the-right arrangement it replaced.\n"
    "\n"
    "Support a child glances at while working comes after the work in the reading\n"
    "order, normally the right-hand column and sometimes a band below. Which of those\n"
    "you use is latitude. What is not is the top-left corner: it belongs to whatever\n"
    "the questions read from, and a narrow support panel that takes it pushes the\n"
    "whole task into the width that is left and strands an empty band under it.\n"
    "\n"
    "**What sends something to the back is what a child could do without it, not what\n"
    "kind of thing it is.** Ask whether a child who never read it could still produce\n"
    "an answer. A reminder of a method they have already used, a\n"
    "prompt to check their work: yes, and those improve or check an answer that\n"
    "already exists, so they come after. A definition of the word the question turns\n"
    "on, a sentence starter the answer is written into, a word bank the answer is\n"
    "chosen from, a step list worked *through*: no, and without it there is no\n"
    "answer, so it is part of the question and sits with it, above the writing space\n"
    "rather than under it.\n"
    "\n"
    "Sorted by kind instead, it prints as something a child cannot use. A real PSHE\n"
    "sheet put `Optional sentence start: \"You can...\"` underneath the line the\n"
    "sentence was to be written on, and a real history sheet put `continuity = stayed\n"
    "similar` at the foot of a page whose first question asked the child to tick\n"
    "continuity or change. Both were filed as reminders. Neither child could start.\n",
    "**The rest of the page's reading order is the teacher's, and `preferences.md` →\n"
    "The printed page carries the decision; you read it before you start, and these\n"
    "are the parts of it to hold while you compose.** The page begins top left with\n"
    "whatever the questions read from, and the run flows so a child who has just\n"
    "finished one question can see the next without hunting: usually down a column,\n"
    "though a long question filling one side with the next beside it reads fine,\n"
    "and never a run ping-ponging left, right, left, right between short zones (the\n"
    "turned and mirrored layout variants always offer a followable arrangement). A\n"
    "stimulus and the questions that read it share a column, stimulus first, and a\n"
    "lettered set is one block; the other column is for what the run does not need:\n"
    "a drawing task, an independent extension, a question that starts fresh. **That\n"
    "holds across columns too, and it is the commonest way a two-column sheet goes\n"
    "wrong:** a shared panel every question works from (a map with its photographs,\n"
    "a source set, a data table) is a stimulus like any other, above its questions\n"
    "in their column, carrying its one job line (`Look at these photographs.`). The\n"
    "test is whether a child answering question 2 has to cross the page to see what\n"
    "question 2 is about. Reading order still protects genuinely sequential\n"
    "material: a claim a question judges or a stem it completes stays ahead of its\n"
    "question.\n"
    "\n"
    "Support a child glances at while working comes after the work in the reading\n"
    "order, normally the right-hand column and sometimes a band below. Which of those\n"
    "you use is latitude. What is not is the top-left corner: it belongs to whatever\n"
    "the questions read from, and a narrow support panel that takes it pushes the\n"
    "whole task into the width that is left and strands an empty band under it.\n"
    "\n"
    "**What sends something to the back is what a child could do without it, not what\n"
    "kind of thing it is.** Ask whether a child who never read it could still produce\n"
    "an answer. A reminder of a method they have already used, a\n"
    "prompt to check their work: yes, and those improve or check an answer that\n"
    "already exists, so they come after. A definition of the word the question turns\n"
    "on, a sentence starter the answer is written into, a word bank the answer is\n"
    "chosen from, a step list worked *through*: no, and without it there is no\n"
    "answer, so it is part of the question and sits with it, above the writing space\n"
    "rather than under it.\n",
)
# Decision 10's bound, as the first check's repair round passed on his
# answer: the reminder that comes after is one line.
replace_once(
    WSD,
    "an answer. A reminder of a method they have already used, a\n",
    "an answer. A one-line reminder of a method they have already used, a\n",
)

# ─── settled item h: step 5 points at books-or-sheet.md ──────────────────
# The copies of the test, the reason line and the blank-is-not-a-page
# paragraph go (K20's version lacked the copying-cost limb); the reason the
# reference gives for reading it stays, as do "never a target" and the
# trigger.
replace_once(
    WSD,
    "Once a sheet's content is settled, set its `recording`: `\"books\"` when every\n"
    "question on it could be answered in an exercise book from a shared copy, or\n"
    "`\"sheet\"` when any question needs the printed page. The teacher's school is\n"
    "cutting paper, and a books sheet prints a small book mark and a page of question\n"
    "slips children stick in, so an honest `\"books\"` saves a class set of copies. Read\n"
    "`[PLUGIN_ROOT]/references/books-or-sheet.md` at this step, the first time in a run:\n"
    "the call turns on the year group, and the same number line is `\"books\"` in Year 4\n"
    "and `\"sheet\"` in Year 2.\n"
    "\n"
    "Every sheet also carries `\"recordingReason\"`: one line saying why this whole sheet\n"
    "is better that way. For `\"sheet\"`, name the question that needs the printed page\n"
    "and what the child does to it, as in `\"Q4: the child labels the printed\n"
    "photograph\"`. For `\"books\"`, say what makes every question answerable from a\n"
    "shared copy, as in `\"Every answer is a number, an explanation, or a line the\n"
    "children rule for themselves\"`. Go and look for a question that needs the page\n"
    "rather than summarising the sheet; finding none is what makes a sheet `\"books\"`,\n"
    "and either mark can be reached without thinking at all, which is why both say why.\n"
    "\n"
    "A blank does not make a page. A digit box in `2,_80`, or a gap in a short\n"
    "sentence, is copied into a book in seconds. What makes a `\"sheet\"` is a printed\n"
    "thing a child cannot reproduce - a photograph, a map, a grid, a scale where exact\n"
    "placement is the point - so a number line a Year 4 child could rule for\n"
    "themselves is read from, not worked on. The preflight refuses a missing line as\n"
    "`RECORDING_REASON_MISSING`.\n"
    "\n",
    "Once a sheet's content is settled, set its `recording` (`\"books\"` or `\"sheet\"`)\n"
    "and its `recordingReason`. Read `[PLUGIN_ROOT]/references/books-or-sheet.md` at\n"
    "this step, the first time in a run, and follow it: the call turns on the year\n"
    "group, and the same number line is `\"books\"` in Year 4 and `\"sheet\"` in Year 2.\n"
    "\n",
)

# ─── settled item h (O24): said twice in this file already ───────────────
replace_once(
    WSD,
    "reasoning or decision remains unchanged.\n"
    "\n"
    "Every generated sheet keeps usable response space. If the complete authorised\n"
    "content does not fit, follow the fit-priority route rather than independently\n"
    "removing learning.\n",
    "reasoning or decision remains unchanged.\n",
)

# ─── settled item j: the adaptation records the support, the sheet realises it
replace_once(
    WSD,
    "Render the upstream pedagogical decision faithfully.\n"
    "\n"
    "- Greater Depth may retain or add a support when it enables deeper reasoning\n"
    "  without supplying the answer. Remove it only when it performs the assessed\n"
    "  thinking.\n"
    "- Greater Depth may use a different representation when that choice genuinely\n"
    "  serves the subject demand.\n"
    "- Below receives a pre-drawn representation when interpreting it is the target\n"
    "  or when the adaptation specifically says it is needed for access.\n"
    "- There is a light preference towards retaining useful visual or structural\n"
    "  support on Below, but do not repeat it on every item or fade it away by\n"
    "  reflex. Follow the stated task-specific decision.\n",
    "Render the upstream pedagogical decision faithfully: realise the support and\n"
    "representation each sheet's adaptation records (what is given, blank or built;\n"
    "what support is kept, changed or removed), and add, keep or remove none on your\n"
    "own judgement.\n",
)
replace_once(
    WSD,
    "artefact is a structured page the teacher modelled filling, the worksheet IS\n"
    "   that frame across all pupil sheets.",
    "artefact is a structured page the teacher modelled filling, the worksheet IS\n"
    "   that frame on every pupil sheet, unless the adaptation records a different\n"
    "   surface for a variant.",
)

# ─── settled item n (P17): how many questions ────────────────────────────
replace_once(
    WSD,
    "   results must stay together. A flat list commonly has up to six standalone\n"
    "   questions; that is not permission to trim a table, sort, matched set or\n"
    "   other grouped activity to six cells.",
    "   results must stay together. How many standalone questions a maths sheet\n"
    "   holds is `subject-maths.md`'s (three to six is often enough, not a cap);\n"
    "   other subjects have no number. Neither is permission to trim a table, sort,\n"
    "   matched set or other grouped activity.",
)

# ─── settled item f: the focused repair and the builder ──────────────────
replace_once(
    REPAIR,
    "Re-author that single reference against what actually exists: a picture this run has already published, a supported helper, or a task that carries its own demand in words and the child's own drawing. Keep the learning that reference was serving, keep the sheet's own demand, and change nothing else. Any other picture stays exactly as it is. One boundary on \"in words\": when the child's job was to read something off that photograph, a sentence describing what it showed answers the question for them. A published photograph of the same kind of thing keeps the task; a description replaces it with reading, so if no picture can carry it, say which decision the lesson designer needs rather than writing the evidence out.",
    "Re-point that single reference at a picture this run has already published. Keep the learning that reference was serving, keep the sheet's own demand, and change nothing else. Any other picture stays exactly as it is. If no published picture can carry it, never write the evidence out in words. On a Below or Greater Depth sheet, take that sheet and its answer-key section out whole, and add its `returned` entry (`\"problem\": \"picture\"`, that ref) and a `WORKSHEET_CONTENT_GAP` note for the adaptation designer, who redesigns the question without that picture; until the redesign goes in, the build prints the Expected sheet in its place and flags it. On the Expected sheet, leave it unrepaired and return `WORKSHEET_CONTENT_GAP` for it, naming the picture and any engine drawing that could carry it, so the content-gap picture wave reaches the lesson designer.",
)
replace_once(
    BUILDER,
    "so the picture route is a dead end and the worksheet-designer re-authors that one reference instead.",
    "so the picture route is a dead end and the worksheet-designer re-points that one reference at a published picture, or returns that sheet to its author (a Below or Greater Depth sheet to the adaptation designer, and the build makes the others; the Expected sheet to the lesson designer).",
)
replace_once(
    BUILDER,
    "   | `NO_SHEETS` | The JSON holds none of the three. The designer's file is empty. |\n",
    "   | `NO_SHEETS` | The JSON holds none of the three. The designer's file is empty. |\n"
    "   | `SHEET_STANDS_IN` | A Below or Greater Depth tier printed with the Expected sheet in its place, with the Expected answers as its answer-key section: its sheet went back to the adaptation designer (its `returned` entry) and no redesigned sheet has replaced it, or, on the last-resort build (`--omit-unfittable`), the build could not make it (a page too small, a picture it cannot have, any fault the build refuses) while the Expected sheet passed every check. An Expected sheet the page cannot hold is still omitted, one the browser finds clipped refuses the whole pack (as before), and then nothing stands in. A flag for the teacher's report naming the tier and why, never a fault for a repair round. |\n"
    "   | `RETURN_RECORD_LEFT` | The spec holds a Below or Greater Depth sheet and a `returned` entry for it: the sheet was built, as its redesign. Report it; the worksheet-designer takes the entry and its note off. |\n"
    "   | `RETURNED_INVALID` | The spec's `returned` record is malformed, names the Expected sheet while it is still in the spec, or sends a sheet back when there is no Expected sheet to print in its place (the class's own sheet is never built around). The worksheet-designer fixes the record; a missing Expected sheet goes back to the lesson designer. |\n",
)

for rel, gone in (
    (WSD, "**Flag, do not fix.**"),
    (WSD, "add a `notes` entry and carry on"),
    (WSD, "Flag it in `notes` instead"),
    (WSD, "throughout the lesson"),
    (WSD, "the child demonstrably meets it elsewhere in this lesson"),
    (WSD, "The compact title and sheet code"),
    (WSD, "sits earlier in reading order than the first question using it"),
    (WSD, "The teacher settled this on 31 August 2026"),
    (WSD, "superseded panel-on-the-right arrangement"),
    (WSD, "continuity = stayed similar"),
    (WSD, "Optional sentence start"),
    (WSD, "Greater Depth may retain or add a support"),
    (WSD, "Below receives a pre-drawn representation when"),
    (WSD, "a light preference towards retaining"),
    (WSD, "across all pupil sheets"),
    (WSD, "commonly has up to six standalone questions"),
    (WSD, "What makes a `\"sheet\"` is a printed thing a child cannot reproduce"),
    (WSD, "Every generated sheet keeps usable response space."),
    (REPAIR, "or a task that carries its own demand in words and the child's own drawing"),
    (REPAIR, "One boundary on \"in words\""),
    (BUILDER, "the worksheet-designer re-authors that one reference"),
):
    assert_absent(rel, gone)
for phrase in (
    "Support a child glances at while working", "sometimes a band below", "latitude", "top-left corner",
    "a step list worked *through*", "could do without it, not what kind of thing it is",
    "a child who never read it could still produce an answer", "reminder of a method they have already used",
    "sentence starter the answer is written into", "word bank the answer is chosen from",
    "Read `[PLUGIN_ROOT]/references/books-or-sheet.md` at this step, the first time in a run",
    "treat the mark as a report on the sheet you built, never a target",
):
    assert_present(WSD, phrase)
assert (__import__("_patch").ROOT / REPAIR).stat().st_size < 8000
print("worksheet designer, focused repair and builder changed")
