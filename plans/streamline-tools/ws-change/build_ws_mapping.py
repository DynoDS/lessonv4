"""The worksheets mapping and pins (4.2.290).

Every changed row names the decision that changed it (`WHY`) and the words that
now carry it (`NEW`, taken from the change scripts); rows whose words left
their file are mapped by hand (`HAND`); rows whose quotes still stand but which
a decision reached are pinned with the new words beside them (`GAINED`); words
a decision added that no row quoted are their own rows (`ADDED`).
`ledger_mapping.build` checks every phrase against the files, pins each changed
row's whole paragraph, pins the homes paragraph by paragraph, and bars each
retired wording (everywhere, programs included, unless marked "local" or
still ordinary English elsewhere).

This topic has 13 rows in the sheet engine (`worksheet-html/`), which the
shared tool's path pattern does not read, so this builder widens that pattern
for its own run only (the shared tool is left as it is, so no earlier topic's
mapping changes), and the topic's test passes the same folder to
`ledger_pin_checks.make_ledger_tests`.

    python -X utf8 plans/streamline-tools/ws-change/build_ws_mapping.py
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import ledger_mapping  # noqa: E402
from ledger_mapping import REPO, build, norm, text_of  # noqa: E402

ledger_mapping.P = re.compile(r"`((?:agents|references|skills|commands|scripts|builder|worksheet-html)/[^`]+)`")

LEDGER = "2026-09-23-worksheets-ledger.md"
PREF = "references/preferences.md"
LD = "agents/lesson-designer.md"
LDC = "references/lesson-designer-components.md"
OT = "references/output-template.md"
WSD = "agents/worksheet-designer.md"
REPAIR = "agents/worksheet-designer-focused-repair.md"
BUILDER = "agents/worksheet-builder.md"
WSH = "references/worksheet-helpers.md"
SHARED = "references/worksheet-helpers/shared.md"
MATHSH = "references/worksheet-helpers/maths.md"
CATALOGUE = "references/worksheet-helpers/catalogue.md"
COMPOSITIONS = "references/worksheet-compositions.md"
BOS = "references/books-or-sheet.md"
GAP = "references/brief-gap-protocol.md"
REV = "agents/design-reviewer.md"
ADAPT = "agents/adaptation-designer.md"
MATHS = "references/subject-maths.md"
PB = "skills/make-lesson/playbook-lite.md"
LOG = "references/build-review-log.md"
CHECK = "worksheet-html/scripts/check-worksheet.js"
SLIPS = "worksheet-html/src/slips.js"
BUILD = "worksheet-html/scripts/build-worksheet.js"
TEXT = "worksheet-html/src/helpers/text.js"
CAT_JS = "worksheet-html/scripts/build-catalogue.js"
CATALOGUE_JS_FILE = CAT_JS
LAYOUTS_JS = "worksheet-html/scripts/build-layouts-doc.js"

D2 = "decision 2, his words \"I wouldn't want the same exact questions on both ... It's just different context, different numbers etc in maths ... the sheet is the proof of that\""
D5 = "decision 5, his words \"agree, should probably go back to be redesigned\": a sheet a child could not use as printed goes back while the others are made; a page merely plainer than hoped is a note"
D9 = "decision 9, his \"yes\": producing is chosen when it moves the objective on; making up their own values is one option, not the default; maths keeps its lean towards the child producing the maths"
D10 = "decision 10, his \"yes\": no list of a method's steps printed for the child to consult; a fill-in frame the child writes into, and steps a task needs worked through, print with their question"
D13 = "decision 13, his \"yes\": each question takes the form its thinking needs, and the cases vary, not the forms for their own sake"
SA = "settled item a, his 23 September ruling \"worksheets are not homework, worksheets are delivered in class all the time\": a sheet leans on what the board or the working wall shows while children work"
SB = "settled item b, his words \"it won't fit the 45 min\" and his 23 September ruling: the sheet's time sits inside the lesson, in the beat it replaces or the independent work the slides leave room for, never set for another time or added on top"
SD = "settled item d: the summaries say what rule 9 says (compose first, never write a replacement question, return a question no helper can carry faithfully)"
SE = "settled item e: a card kit's sort is not repeated on the lesson's worksheet; every lesson still has one"
SF = "settled item f, his 2 September review \"may re-point a dead reference at a published picture, never replace it with a sentence saying what it showed\""
SG = "settled item g: out-of-date text corrected, no rule changed"
SH = "settled item h: one home for each rule; a copy read by the same reader becomes a pointer that keeps its conditions"
SI = "settled item i: a reference several questions use sits where the printed page's test puts any support"
SJ = "settled item j: the adaptation records what is given, blank and built on each sheet, and the sheet designer realises it"
SK = "settled item k, his answer of 24 September (evening), \"yes\": the sheet may carry the same kind of write-on figure with its own questions, never the practice's own"
SL = "settled item l: parts share a question only when they are one job; a shared stimulus is not enough"
SM = "settled item m: the reviewer runs before the Below and Greater Depth sheets exist, so the adaptation's read-back is the check"
SN = "settled item n: how many questions is the maths file's (three to six is often enough, not a cap); other subjects have no number"
SO = "settled item o, his 19 September ruling that one digit box does not make a write-on sheet: the page-only word list is a prompt to look again, not a verdict"
ST = "stories leave for the build log (copied there first, w1), reasons stay"
R1 = "; then the first check's repair round (4.2.290): "
LR = "the lead's reading of his earlier answer, which he called \"fine\" (the ledger, \"Settled by the lead from his earlier answers\"): "
R2 = "; then the second check (4.2.290): "
R3 = "; then the third check (4.2.290): "
HS = "his answer of 25 September to the question the repair round held for him, \"yes\": a Below or Greater Depth sheet sent back to be redesigned that still cannot be fixed gets the Expected sheet in its place, flagged so he knows"

B01_NEW = [
    (PREF, "**Choose the worksheet's relationship to slide practice before asking for freshness.** The slide lesson remains teachable without printing. The practice slide keeps its own questions, and the sheet never carries them: in maths the sheet has different numbers and contexts; in a lesson like PSHE that works towards one question, the sheet can be that question, answered once, on the sheet, as the proof. The teacher may use the worksheet as additional practice or in place of the slide practice."),
    (PREF, "In its place, keeping the slide's diagram, labels and response structure is legitimate, with the sheet's own questions: the child does the work once, using the chosen medium. Record this intended use in the existing worksheet planning fields."),
    (PREF, "When the sheet asks for essentially the same performance as the slide Practise, choose one and say it in `worksheet.demand`: it replaces that Practise (children do the sheet in its place), or it is additional practice after it. `It can replace the slide Practise or follow it` hands the design's decision to the teacher."),
    (PREF, "The schema value `separate-fresh-worksheet` identifies the optional resource branch; it does not prohibit keeping the slide's representation. A worked answer must still be withheld when independent retrieval is intended."),
]

WHY = {
    "WS-R21": "the omission route stays for a sheet the page cannot hold; then " + HS + ", which the lead passed on for any Below or Greater Depth sheet the build cannot make" + R3 + "a tier the Expected sheet stood in for, omitted because the page cannot hold the Expected sheet either, is named for its own reason, never with the Expected sheet's measurement",
    "WS-A05": D2 + ": a sheet in place of the slide practice, as B01 now says",
    "WS-A06": SG + ": the pointer names where a generated sheet's design lives (the components file) and what the lesson designer's own section records, and this is the judgement's home",
    "WS-A08": D2 + ": the sheet may keep the slide task's representation, never its questions" + R1 + "the pointer carries his one-question case (the first check's finding 4)",
    "WS-A12": SG + ": there is no `not-needed` value, and the validator refuses anything but the two",
    "WS-A17": SE,
    "WS-A18": SB,
    "WS-B01": D2 + ": the practice slide keeps its own questions and the sheet never carries them; in maths different numbers and contexts; in a lesson like PSHE the sheet can be the one question the lesson worked towards, answered once, as the proof. \"Same performance\" (the skill) stays",
    "WS-B02": D2 + ": reuse for consolidation keeps the task's shape, with the sheet's own questions",
    "WS-B05": D2 + ": a sheet in place of the slide practice keeps its representation, never its questions; the photographs example stays" + R1 + "the pointer carries his one-question case",
    "WS-C06": SG + ": the contract and the validator require `per-child` for a child's own sheet",
    "WS-C07": SJ + ": the frame is on every pupil sheet unless the adaptation records a different surface for a variant",
    "WS-D09": D9 + "; and " + SG + " (the pointer names the components file)",
    "WS-E02": ST + ": the dated count is in the log (4.2.162); the reason stays, and the teeth sheet stays as a plain example",
    "WS-E08": D5 + ": a form believed wrong goes back through `WORKSHEET_CONTENT_GAP`",
    "WS-E09": D5 + ": the nearest honest thing only where it is the same action, otherwise it goes back; the teeth-sheet sentence stays as a plain example",
    "WS-H07": ST + ": the sheet numbered 1, 2, 6 is in the log; its two reasons stay",
    "WS-H12": SL,
    "WS-I01": SA,
    "WS-I04": SA + "; the \"never yours to drop\" list and the `notes` line stay word for word",
    "WS-I05": SA,
    "WS-J03": D10 + R1 + LR + "\"never a list of steps printed just as a reminder\" (the lead's wording of the suggestion he answered \"yes\" to, not his own words); a one-line reminder is support",
    "WS-J05": D10 + R1 + LR + "\"never a list of steps printed just as a reminder\" (the lead's wording, not his own)",
    "WS-K02": ST + ": only the date of his reason left (16 September 2026, in the log's 4.2.218 entry)",
    "WS-K12": SH + ": step 5 points at books-or-sheet.md, keeping the trigger, the year-group reason, \"never a target\" and `onSlip`; its copies of the test, the reason line and the blank-is-not-a-page paragraph go",
    "WS-K15": SO + "; the preflight prints `RECORDING_LOOK_AGAIN`" + R1 + LR + "words about a box are judged by what the sheet holds, and the prompt is answered by a field (`recordingLookedAgain`), never by the reason repeating the engine's words (finding 7)" + R2 + "the words say what the engine checks, a sheet whose only helpers are sentences and number sentences (finding 8)",
    "WS-L06": SJ + ": the four support bullets become one sentence; the rules themselves stay in the adaptation designer (L36, L37, D11)",
    "WS-L39": SM,
    "WS-L50": SJ,
    "WS-N03": SH + ": the contract's copy brought into line with O04's condition (an empty list only on a set that already fits)",
    "WS-O02": SG + ": nothing is titled on a sheet since 12 September",
    "WS-O08": ST + ": the superseded arrangement's history is in the log; its live rule stays",
    "WS-O09": D10 + "; and " + SH + " (the worksheet designer's sentence-start case moved here as a plain example); his 1 September PSHE ruling stays as it was" + R1 + LR + "\"never a list of steps printed just as a reminder\" (the lead's wording, not his own), and the reminder that comes after is one line (finding 5)",
    "WS-O11": D13 + "; \"A title\" was stale (" + SG + ") and \"never chosen\" is E05's own limit",
    "WS-O12": SG,
    "WS-O18": SH + ": one page and the two-page exception are the printed page's; the pointer keeps both halves and its one extra (state the eligibility, protect the visual)",
    "WS-O20": SH + " and " + SI + ": the columns and reading-order copy became one pointer paragraph keeping each rule's both halves and O20's four extras; the 31 August ruling stays in preferences.md exactly and its incident is in the log",
    "WS-O21": ST + " and " + SH + ": the two cases went to the log, the first into preferences.md as a plain example; the rule itself stays word for word",
    "WS-O33": SG + ": only the level code prints, in the printer margin",
    "WS-O34": SG,
    "WS-O35": SG + ": corrected in the generator (`build-layouts-doc.js`), which says what the engine does: no band is taken off, the code sits in the printer margin; regenerating also corrected every zone height the reference quotes, six millimetres short since the band went",
    "WS-O36": SG,
    "WS-O37": SG,
    "WS-P10": SF + ": under `unavailable`, re-point each affected question at a published picture or an engine drawing, never at words, and only then omit and return the sheet; scoped to a picture that will never arrive",
    "WS-P16": D5 + ": a question believed wrong goes under rule 11; the two exceptions and the boundary stay word for word",
    "WS-P17": SN,
    "WS-P20": D5 + R1 + LR + "a sheet that contradicts the objective goes back, and the example of a shipping doubt the plan never had is gone (finding 6)" + R2 + "its two pointers say the same, and `\"teaching\"` covers it (finding 6)",
    "WS-P23": SF + ": the quick repair re-points at a published picture only; the \"in words\" route and its boundary go" + R1 + "a Below or Greater Depth sheet goes back to its author, the adaptation designer, through its `returned` entry and never costs the other sheets or the key; the Expected sheet goes to the lesson designer (finding 3)" + R2 + "the returned sheet is taken out whole, not left in place, and a dead Expected picture returns `WORKSHEET_CONTENT_GAP` so the content-gap picture wave reaches the lesson designer (findings 1 and 4)",
    "WS-P24": D5 + R2 + "a sheet that contradicts the objective goes back too (finding 6)",
    "WS-P25": SD + "; the \"seven published worksheets\" story went to the log",
    "WS-P26": SD + "; the story went to the log",
    "WS-P28": SD + " and " + D5 + ": the returned sheet is omitted while the others continue",
    "WS-P31": D5 + ": corrected in the generator (`build-catalogue.js`) and regenerated",
    "WS-P32": SF + ": \"re-pointing\", as P48 already says (the playbook topic must re-read this line when it lands)",
    "WS-P33": SF + R1 + "the builder's row names both owners",
    "WS-Q02": D2 + ": the reviewer checks that the sheet never repeats the practice slide's questions",
    "WS-Q08": SB,
    "WS-S01": SK,
    "WS-S02": SK + ": the lesson still does not depend on the worksheet for the figure",
}

NEW = {
    "WS-R21": [(BUILD, "        console.log(`SHEET_OMITTED: ${message}`);"),
               (BUILD, "      `${label} - ${standIn.why}, and the Expected sheet cannot stand in for it: ` +")],
    "WS-A05": [(PREF, "Every lesson still has its optional worksheet resource, and the teacher decides whether and how to use it, including in place of the slide practice, as described above.")],
    "WS-A06": [
        (PREF, "The judgement above governs what an optional worksheet is for and why it is normally not load-bearing, including the required central-task-resource exception, and this is its home."),
        (PREF, "How a generated sheet is designed lives in `lesson-designer-components.md` → Generated worksheet, which the lesson designer loads for a generated sheet: the activity, how question quantity is judged, the page-and-picture sizing rules, the generative moves and the response form."),
        (PREF, "The lesson designer's own Worksheet section records the sheet: the two cases (teacher-provided or generated), the frame-as-worksheet case, the question-labelling rule and the check that the deck does not reuse a supplied sheet's numbers or contexts."),
    ],
    "WS-A08": [(LD, "That owner lets the sheet keep the slide task's representation, never its questions (in a lesson like PSHE that works towards one question, the sheet can be that question, answered as the proof); the lesson still does not depend on printing it.")],
    "WS-A12": [(PB, "- A generated worksheet is expected unless the teacher supplied one.")],
    "WS-A17": [(LD, "A kit the beat depends on is part of the lesson, not a bonus sheet: the run cannot close complete without it, and the sort is not repeated on the lesson's worksheet.")],
    "WS-A18": [(LD, "Say where the worksheet's time sits inside the lesson: the beat it replaces, or the independent work the slides leave room for. It is never set for another time and never added on top of a full lesson; do not leave the teacher to infer the substitution.")],
    "WS-B01": B01_NEW,
    "WS-B02": [(PREF, "For additional practice or claimed fresh application, use unseen instances that require the intended work. New values can suffice for procedural fluency; new evidence or decisions may be needed for reasoning. Reusing a task's shape for consolidation, with the sheet's own questions, is legitimate when that is its stated purpose, rather than claiming it demonstrates unseen transfer. Novelty must not narrow the objective or replace the clearest activity.")],
    "WS-B05": [(LDC, "**For fresh additional practice, change instances rather than the teaching medium.** A sheet in place of the slide practice may keep its representation, never its questions (in a lesson like PSHE that works towards one question, the sheet can be that question, answered as the proof; `preferences.md` → Worksheets).")],
    "WS-C06": [(LD, "When the frame is a shared working tool the class or a group fills together (`preferences.md` → Worksheets draws that line), set `worksheet.resourceMode` to `shared-frame` with its reason, so the sheet is built once and adaptation is skipped; the validator owns the fields that must accompany it. Set `resourceMode` to `per-child` for a child's own sheet, which differentiates into Expected, Below and Greater Depth.")],
    "WS-C07": [(WSD, "10. **When the lesson modelled a fill-in frame, render the frame.** If the artefact is a structured page the teacher modelled filling, the worksheet IS that frame on every pupil sheet, unless the adaptation records a different surface for a variant. Re-asking its contents as a list of questions is structurally different from what was modelled, which reads to a child as a different task and is worse than no worksheet.")],
    "WS-D09": [
        (PREF, "These generative and constructive shapes land naturally in independent practice. Choose one when producing moves the objective on; making up their own values is one option, not the default. In maths the lean is towards the child producing the maths (`subject-maths.md` → Making practice generative)."),
        (PREF, "The operational moves for briefing them live in `lesson-designer-components.md` → Generated worksheet, and the maths-specific set in `subject-maths.md`."),
    ],
    "WS-E02": [
        (LDC, "**This exists because the choice was being made by default and nobody could see it.** While `response` was free text, a line reading `two handwriting lines` was a settled decision, the worksheet designer may not change a settled response, and so the form was fixed by whoever wrote the question fastest"),
        (LOG, "Eleven worksheet specs built between 5 and 12 September were read by what they actually draw."),
    ],
    "WS-E08": [(SHARED, "Your job is to realise the named form, not to re-pick it; a form you believe is wrong goes back through `WORKSHEET_CONTENT_GAP`, like a question a child could not answer as printed (the worksheet designer's rules 1 and 11).")],
    "WS-E09": [(SHARED, "**A form with no helper behind it is a gap, not a licence to substitute.** Build the nearest honest thing only where it is genuinely the same action; otherwise return it through `WORKSHEET_CONTENT_GAP`, naming the form and the sheet.")],
    "WS-H07": [
        (WSH, "Numbers kept by hand leave a gap wherever a question could not be built, and to a child the gap is not information: it is a sheet that looks like a mistake. Numbers written by hand also come out in whatever weight the thing around them happens to be."),
        (LOG, "A sheet came out numbered 1, 2, 6: the designer had kept the adaptation's own numbers after three questions could not be built"),
    ],
    "WS-H12": [(LDC, "**Multipart only for one connected pupil job.** Several parts share one main question only when they are one job: one decision rule or one dependent answer route. A shared picture, stimulus, topic or context is not enough when each part is a separate assessment job; start a new question.")],
    "WS-I01": [(PREF, "For support the task needs, make its location clear in the existing design: on the sheet, in a retained shared reference, or in another explicitly available resource. A worksheet need not duplicate a reference the board or the working wall shows while children work: every sheet is done in class.")],
    "WS-I04": [
        (WSD, "3. **Drop a printed reference the child already has in front of them.** A reference is a thing to consult - a filled example chart, a classification diagram, an anchor image - and it is the one printed element whose removal costs a child nothing when the same thing is on the board or the working wall while they work on the sheet."),
        (WSD, "You may take one off on your own judgement, including one marked required, when all three hold: no question's wording depends on reading it *from the sheet* (\"use the chart above\" is such a dependency, and so is a question that names a value only the reference carries); the board or the working wall shows it while they work on the sheet, which you establish from the lesson design's own slides, representations or working-wall entries rather than assuming it; and the page genuinely does not fit with it."),
    ],
    "WS-I05": [(REV, "For needed support omitted from a sheet, check whether the board or the working wall shows it while children work before making a finding (every sheet is done in class);")],
    "WS-J03": [(WSD, "13. **Never print success criteria on a worksheet.** They stay on the board, where children consult them while they work, and the teacher does not want them on any sheet or slip. `worksheet.successCriteriaRefs` is always empty, and nothing on the page reprints them, as a panel or as a list. Nor is a list of a method's steps printed just as a reminder for the child to consult (`preferences.md` → The printed page; a one-line reminder of a method is support); a fill-in frame the child writes into, and steps a task needs worked through, print with their question. A one-line job statement for a reference under rule 12 is not a criteria panel.")],
    "WS-J05": [(WSD, "- Confirm no success criteria are printed, as a panel or as an instruction carrying a list, or a list of a method's steps printed just as a reminder.")],
    "WS-K02": [(BOS, "The teacher's school asked staff to use less paper. A sheet the class can do in books needs a copy between two, or none, instead of one per child."),
               (LOG, "Daniel's school asked staff to use less paper.")],
    "WS-K12": [(WSD, "Once a sheet's content is settled, set its `recording` (`\"books\"` or `\"sheet\"`) and its `recordingReason`. Read `[PLUGIN_ROOT]/references/books-or-sheet.md` at this step, the first time in a run, and follow it: the call turns on the year group, and the same number line is `\"books\"` in Year 4 and `\"sheet\"` in Year 2.")],
    "WS-K15": [
        (BOS, "Wording on a `\"books\"` sheet that looks as if it needs the printed page (\"Circle...\", \"Mark it on the line\", \"Fill in the table\") is a prompt to look again, not a verdict: the preflight prints `RECORDING_LOOK_AGAIN`, naming the words and the question."),
        (BOS, "Words about a box or a gap are judged by what the sheet holds: a box in the question's own sentence (`4,_50`), or on a sheet whose only helpers are sentences and number sentences (questions, written answers, instructions, number sentences, section labels), is the blank above and is never flagged; a box on a sheet that also holds a figure (a part-whole model, a grid, a table, a number line) is a prompt to look again."),
        (BOS, "A printed thing the child cannot reproduce makes the sheet `\"sheet\"`; when a book still does, set `\"recordingLookedAgain\": true` on the sheet, which quiets the prompt, and say why in `recordingReason`. Never reword the question, which is verbatim."),
        (BOS, "The build prints a flagged `\"books\"` sheet that does not say it was looked at again as `\"sheet\"`, with `RECORDING_CHANGED`, so a books sheet nobody looked at never prints slips asking a child to circle something they do not have."),
        (SLIPS, "const BLANK_WORDING = [/\\bin (?:the|this|each) (?:box|boxes|gaps?|spaces?)\\b/i, /\\bfill in\\b/i];"),
        (SLIPS, "    const answered = sheet.recordingLookedAgain === true;"),
        (SLIPS, "function recordingAdvisories(worksheet, { includeAnswered = false } = {}) {"),
        (SLIPS, "      signal: \"RECORDING_LOOK_AGAIN\","),
    ],
    "WS-L06": [(WSD, "Render the upstream pedagogical decision faithfully: realise the support and representation each sheet's adaptation records (what is given, blank or built; what support is kept, changed or removed), and add, keep or remove none on your own judgement.")],
    "WS-L39": [(ADAPT, "Record, for every part of the resource, which parts are given, which stay blank and which the child constructs, and which support is kept, changed or removed with the reason. That is what the worksheet designer realises;")],
    "WS-L50": [(MATHSH, "and the Below sheet keeps the chart when its adaptation keeps it, because removing it there would remove access rather than fade a scaffold.")],
    "WS-N03": [(OT, "`fitPriority.preAuthorisedRemoval` lists only lower-priority items the lesson-designer explicitly authorises the worksheet-designer to remove first. Use `[]` only when nothing may be removed and the priced set already fits.")],
    "WS-O02": [(PREF, "The finished page must still have readable type and usable writing or plotting space. Do not add name/date boxes unless the teacher asks.")],
    "WS-O08": [(LOG, "Those rulings superseded an earlier \"shared evidence panel\" arrangement in `preferences.md`")],
    "WS-O09": [
        (PREF, "A step list a child must work *through* in order before they can answer anything is not support at all: it is part of the task, and goes above the questions in their own column like anything else they read from. A list of a method's steps is never printed just as a reminder for the child to consult; a fill-in frame the child writes into (`method-frame` in maths) is a question, and steps a task needs worked through belong to their question. And a step list is only the clearest case: what sends something to the back is what a child could do without it, not what kind of thing it is."),
        (PREF, "A one-line reminder of a method they have already used and a prompt to check their work pass that test, because they improve or check an answer that already exists, and those are what \"after\" was written for."),
        (PREF, "Filed as a reminder instead, one prints where a child cannot use it: `Optional sentence start: \"You can...\"` under the line the sentence was to be written on."),
    ],
    "WS-O11": [
        (PREF, "**A worksheet should look like a purposeful children's activity, not a test paper.** Use one coherent visual or working surface, clear section blocks, and small banks/cards/tables where they reduce reading load. Each question takes the form its thinking needs, and what varies is the cases, not the forms for their own sake."),
        (PREF, "A long numbered list with answer lines that was never chosen is a warning sign, even when the prose is colour-coded. The page should be inviting and calm, but never quick to complete without close reading."),
    ],
    "WS-O12": [(PREF, "Keep one quiet accent and restrained square rules; repeated pastel cards, thick colour strips and decorative containers make the sheet look templated and spend room that should carry learning.")],
    "WS-O18": [
        (LDC, "**Normally one page per resource version; the two-page exception and its limits are `preferences.md` → The printed page's.** When a central write-on visual earns it, state the eligibility and protect the visual. A second page is never for overflow, prose or extra questions; the fit priority above handles those."),
        (PREF, "A per-child sheet may use exactly two printable pages only when the central learning task requires a substantial write-on visual that pupils must directly plot on, measure, draw on, label or annotate and that visual cannot remain usable on one page."),
    ],
    "WS-O20": [
        (WSD, "**The rest of the page's reading order is the teacher's, and `preferences.md` → The printed page carries the decision; you read it before you start, and these are the parts of it to hold while you compose.**"),
        (WSD, "A stimulus and the questions that read it share a column, stimulus first, and a lettered set is one block; the other column is for what the run does not need: a drawing task, an independent extension, a question that starts fresh."),
        (WSD, "**That holds across columns too, and it is the commonest way a two-column sheet goes wrong:** a shared panel every question works from (a map with its photographs, a source set, a data table) is a stimulus like any other, above its questions in their column, carrying its one job line (`Look at these photographs.`)."),
        (WSD, "The pointer line of rule 12 is for a reference several questions use, and it sits where the printed page's test puts any support: before the first question that reads from it, after the work when a child only glances at it."),
        (PREF, "On 31 August 2026 he rejected the reverse on his own science sheet"),
        (LOG, "on 31 August 2026 he rejected the reverse on his own science sheet"),
    ],
    "WS-O21": [
        (PREF, "Filed as a reminder instead, one prints where a child cannot use it: `Optional sentence start: \"You can...\"` under the line the sentence was to be written on."),
        (LOG, "a history sheet printed `continuity = stayed similar` at the foot of a page whose first question asked the child to tick continuity or change"),
    ],
    "WS-O33": [(WSD, "The sheet code uses the top printer margin and takes no space from the zones.")],
    "WS-O34": [(WSH, "| `lesson` | required. Names the lesson in the file and heads the answer key; never printed on a pupil page. |")],
    "WS-O35": [
        (COMPOSITIONS, "The gutter between zones (6mm) is already taken off, and the sheet code sits in the top margin, taking no room from the zones."),
        (LAYOUTS_JS, "`zones (${GUTTER_MM}mm) is already taken off, and the sheet code sits in the top`,"),
    ],
    "WS-O36": [(PREF, "The full LO is still used internally in the lesson design and spoken teacher orientation; only the on-slide display is cut short.")],
    "WS-O37": [(LD, "`lo` is the teacher's objective verbatim, used in internal planning and orientation.")],
    "WS-P10": [(WSD, "Under `unavailable` the picture stage stopped before it ran and no approved filename will ever be published, so first re-point each affected question at a picture this run has published or a drawing the engine makes, never at words. Only when neither can carry it is the ref a required visual with no usable picture: apply the rule immediately below, and name the affected refs in your completion report. This is for a picture that will never arrive; any other picture stays exactly as it is. Never invent, substitute or quietly rewrite the task as text because of it.")],
    "WS-P16": [(WSD, "1. **Question text is verbatim.** You do not paraphrase, renumber, re-pitch or rewrite. A question you believe is wrong goes under rule 11.")],
    "WS-P17": [(WSD, "7. **Preserve the upstream practice architecture and amount.** The lesson design owns how many meaningful performances the child needs and which results must stay together. How many standalone questions a maths sheet holds is `subject-maths.md`'s (three to six is often enough, not a cap); other subjects have no number. Neither is permission to trim a table, sort, matched set or other grouped activity.")],
    "WS-P20": [(WSD, "11. **A sheet a child could not use goes back; a doubt the teacher should hear is a note.** A problem a child could not get past as printed (a question they cannot act on, missing support, a wrong answer, a form or visual no helper can carry faithfully), or a sheet that contradicts the objective, stops that sheet: omit it and return it to its owner (its `WORKSHEET_CONTENT_GAP` note and `returned` entry, above), and make the other sheets as normal. A page merely plainer than hoped, or a doubt the teacher should know about, is a `notes` entry and the sheet ships (`worksheet-visual-profile.md` draws the same line).")],
    "WS-P23": [(REPAIR, "Re-point that single reference at a picture this run has already published. Keep the learning that reference was serving, keep the sheet's own demand, and change nothing else. Any other picture stays exactly as it is. If no published picture can carry it, never write the evidence out in words. On a Below or Greater Depth sheet, take that sheet and its answer-key section out whole, and add its `returned` entry (`\"problem\": \"picture\"`, that ref) and a `WORKSHEET_CONTENT_GAP` note for the adaptation designer, who redesigns the question without that picture; until the redesign goes in, the build prints the Expected sheet in its place and flags it. On the Expected sheet, leave it unrepaired and return `WORKSHEET_CONTENT_GAP` for it, naming the picture and any engine drawing that could carry it, so the content-gap picture wave reaches the lesson designer.")],
    "WS-P24": [(SHARED, "Something a child could not act on, or a sheet that contradicts the objective, goes back through `WORKSHEET_CONTENT_GAP`, and a doubt the teacher should hear goes in `notes` (the worksheet designer's rule 11). Do not fix it silently: the sheet then disagrees with the board, and nobody finds out until a child does.")],
    "WS-P25": [
        (SHARED, "The worksheet-designer's rule 9 owns this decision: compose from existing helpers first (the catalogue is bigger than its names suggest), never write a replacement question, and return a question no helper can carry faithfully through `WORKSHEET_CONTENT_GAP`. Never bend the nearest helper into a shape it does not draw: a page that looks finished and is wrong is the failure this engine exists to refuse."),
        (SHARED, "A returned gap is how the next helper gets built."),
        (LOG, "seven published worksheets went in front of the engine, none could be built"),
    ],
    "WS-P26": [
        (WSH, "The worksheet-designer's rule 9 owns this decision: compose from existing helpers first, never write a replacement question, and return a question no helper can carry faithfully through `WORKSHEET_CONTENT_GAP`. Never bend the nearest helper into a shape it does not draw."),
        (WSH, "A returned gap is how the next helper gets built."),
    ],
    "WS-P28": [(GAP, "*Worksheet-designer:* the brief specifies a question shape no helper supports. Your own rule 9 carries the ladder: compose from existing helpers, never write a replacement question, and return a question no helper can carry faithfully through `WORKSHEET_CONTENT_GAP`, omitting that sheet while the others continue.")],
    "WS-P31": [
        (CATALOGUE, "If a lesson needs something no helper here can express, return it as a gap (the worksheet designer's rule 11) rather than bending the nearest one to fit. That is how the next helper gets built."),
        (CAT_JS, "\"If a lesson needs something no helper here can express, return it as a gap (the\","),
    ],
    "WS-P32": [(PB, "**Terminal includes `unsatisfied` and `omitted`, and those never arrive.** Reconcile before building: for each such filename `worksheet.json` names, run one focused Worksheet Designer repair, telling it the filename is terminally unavailable and that re-pointing that one reference at what exists is the repair, not a scope breach.")],
    "WS-P33": [(BUILDER, "A terminal receipt reading `unsatisfied` or `omitted`: sourcing for it is closed and no repair can produce it, so the picture route is a dead end and the worksheet-designer re-points that one reference at a published picture, or returns that sheet to its author (a Below or Greater Depth sheet to the adaptation designer, and the build makes the others; the Expected sheet to the lesson designer).")],
    "WS-Q02": [(REV, "- the work serves its stated practice purpose: the sheet never repeats the practice slide's questions (in maths, different numbers and contexts; in a lesson working towards one question, the sheet may be that question, answered once); a sheet in place of the slide practice may keep its representation; additional practice or claimed fresh application follows `preferences.md` → Worksheets. Do not reject deliberate consolidation for lacking novelty;")],
    "WS-Q08": [(REV, "- required-task-resource and separate-fresh-worksheet roles are honest, with a clear use or substitution for optional practice. The sheet's time sits inside the lesson's minutes, in the beat it replaces or the independent work the slides leave room for, never set for another time or added on top; a replacement must preserve the intended learning and evidence;")],
    "WS-S01": [(PREF, "The same kind of figure may also appear on that worksheet, under the worksheet-use judgement above, with the sheet's own questions and never the practice's own: in maths, different numbers (the practice marks 3,250 and 4,750 on a number line in steps of 250; the sheet's line asks for 6,250 and 8,500). Availability in both resources does not mean the child completes it twice; keep answers separate where independent retrieval is intended.")],
    "WS-S02": [(LD, "A write-on figure the child could not rule by hand is a stick-in moment, so the lesson does not depend on the worksheet for it: design the Your Turn normally with its own questions on the representation and record it under Printed extras below. The worksheet may carry the same kind of figure too, with its own questions and never the Your Turn's (`preferences.md` → Worksheets).")],
}

# Retired wordings, barred where they were ("local"), or everywhere, programs
# included, when the phrase is gone from every instruction file and program.
ABSENT = {
    "WS-A05": [(PREF, "including as the printed alternative described above")],
    "WS-A06": [(PREF, "and it is the only place that judgement lives"), (PREF, "How one is generated lives in the Worksheet section of the lesson-designer agent")],
    "WS-A08": [(LD, "permits a printed alternative using the same task")],
    "WS-A12": [(PB, "an unexplained `not-needed` decision")],
    "WS-A17": [(LD, "does not automatically get a worksheet as well")],
    "WS-A18": [(LD, "do not budget it as compulsory extra work")],
    "WS-B01": [(PREF, "keeping the same useful task, diagram, labels and response structure is legitimate"), (PREF, "it does not prohibit this deliberate reuse"), (PREF, "(children do the work once, on paper)", "local")],
    "WS-B02": [(PREF, "Reusing a task for consolidation is legitimate")],
    "WS-B05": [(LDC, "A printed alternative may retain the same task")],
    "WS-C06": [(LD, "Leave `resourceMode` unset")],
    "WS-C07": [(WSD, "that frame across all pupil sheets")],
    "WS-D09": [(PREF, "Reach for them by default on repeatable practice"), (PREF, "The operational moves for briefing them live in the lesson-designer Worksheet section")],
    "WS-E02": [(LDC, "Eleven sheets built between 5 and 12 September 2026")],
    "WS-E08": [(SHARED, "is a `notes` entry, exactly like a question you believe is wrong")],
    "WS-E09": [(SHARED, "Say so in `notes` with the form and the sheet")],
    "WS-H07": [(WSH, "This exists because a real sheet came out numbered 1, 2, 6", "local")],
    "WS-H12": [(LDC, "one central stimulus")],
    "WS-I01": [(PREF, "cannot assume an unseen board")],
    "WS-I04": [(WSD, "wall throughout the lesson", "local"), (WSD, "the child demonstrably meets it elsewhere in this lesson")],
    "WS-I05": [(REV, "check the planned shared access")],
    "WS-K02": [(BOS, "(16 September 2026)", "local")],
    "WS-K12": [(WSD, "Go and look for a question that needs the page rather than summarising the sheet", "local")],
    "WS-K15": [(BOS, "marks a sheet `\"sheet\"` whatever it was set to"), (BOS, "The preflight refuses the contradiction as"), (BOS, "RECORDING_NEEDS_SHEET"), (BOS, "naming the words, quiets the prompt")],
    "WS-L06": [(WSD, "Greater Depth may retain or add a support", "local"), (WSD, "Below receives a pre-drawn representation when", "local"), (WSD, "a light preference towards retaining", "local")],
    "WS-L39": [(ADAPT, "and what the reviewer checks")],
    "WS-L50": [(MATHSH, "keep the chart on the Below sheet when removing it would remove access")],
    "WS-O02": [(PREF, "compact child-facing title")],
    "WS-O08": [(PREF, "This supersedes the earlier \"shared evidence panel\" arrangement recorded here")],
    "WS-O11": [(PREF, "enough variation in response type to make the thinking visible"), (PREF, "A title followed by a long numbered list")],
    "WS-O12": [(PREF, "Keep a compact title")],
    "WS-O18": [(LDC, "Two pages only when the central task needs a substantial write-on visual", "local")],
    "WS-O20": [(WSD, "The teacher settled this on 31 August 2026", "local"), (WSD, "sits earlier in reading order than the first question using it"), (WSD, "superseded panel-on-the-right arrangement")],
    "WS-O21": [(WSD, "continuity = stayed similar", "local"), (WSD, "Optional sentence start", "local")],
    "WS-O33": [(WSD, "The compact title and sheet code")],
    "WS-O34": [(WSH, "Prints on every sheet")],
    "WS-O35": [(COMPOSITIONS, "the band the learning objective and sheet code sit in"), (LAYOUTS_JS, "the band the learning objective and sheet code sit in")],
    "WS-O36": [(PREF, "worksheet headers")],
    "WS-O37": [(LD, "worksheet headers")],
    "WS-P16": [(WSD, "Flag it in `notes` instead")],
    "WS-P17": [(WSD, "commonly has up to six standalone questions")],
    "WS-P20": [(WSD, "**Flag, do not fix.**"), (WSD, "add a `notes` entry and carry on"), (WSD, "an upstream ambiguity, or a contradiction with the LO", "local")],
    "WS-P23": [(REPAIR, "or a task that carries its own demand in words and the child's own drawing"), (REPAIR, "One boundary on \"in words\"")],
    "WS-P24": [(SHARED, "If something upstream looks wrong, say so in `notes`")],
    "WS-P25": [(SHARED, "keep the question's words and ask it plainer"), (SHARED, "change how a question is asked, never whether"), (SHARED, "only a question that cannot be asked honestly at all goes in `notes`"), (SHARED, "seven published worksheets")],
    "WS-P26": [(WSH, "then change how the question is asked and never whether"), (WSH, "seven published worksheets")],
    "WS-P28": [(GAP, "flag in `notes` only a question that cannot be asked honestly at all"), (GAP, "keep the question's words and change how it is asked rather than whether")],
    "WS-P31": [(CATALOGUE, "say so in `notes` rather than bending the nearest one to fit"), (CAT_JS, "say so in `notes` rather")],
    "WS-P32": [(PB, "re-authoring that one question against what exists")],
    "WS-P33": [(BUILDER, "the worksheet-designer re-authors that one reference")],
    "WS-Q02": [(REV, "a printed alternative may preserve the same slide task"), (REV, "or printed reuse for lacking novelty")],
    "WS-Q08": [(REV, "an optional sheet does not automatically need extra minutes")],
    "WS-S01": [(PREF, "The same useful figure and task may also appear on that worksheet as a printed alternative")],
    "WS-S02": [(LD, "is a stick-in moment, not a worksheet")],
}

# Rows whose words left their file, mapped by hand: (outcome, present, absent).
HAND = {
    "WS-K20": ("retired from the worksheet designer by " + SH + ": step 5 points at books-or-sheet.md, whose own sentence (K19) carries the copying-cost limb this copy lacked",
               [(BOS, "What makes a sheet `\"sheet\"` is a printed thing the child cannot reproduce - a photograph, a map, a grid, a scale where exact placement is the point - or a copying cost that would swallow the lesson.")],
               [(WSD, "What makes a `\"sheet\"` is a printed thing a child cannot reproduce", "local")]),
    "WS-O24": ("retired from How the resource variants relate by " + SH + ": the opening (E14) and step 4 (P36) say both in the same file",
               [(WSD, "**Every printed response action receives one obvious usable target, sized for what the prompt demands.**"),
                (WSD, "A sheet normally remains one page with readable type and usable response space."),
                (WSD, "5. **Return the gap upstream.** If no authorised reduction exists, or the authorised reduction is insufficient, return `PAGE_PLAN_GAP` to the pedagogical owner.")],
               [(WSD, "Every generated sheet keeps usable response space.", "local")]),
}

# Rows whose quotes still stand but which a decision reached: pinned with the
# words that now carry the decision beside them: (outcome, present, absent).
GAINED = {
    "WS-P08": (D5 + ": a sheet a child could not use is not a note",
               [(WSD, "A sheet a child could not use is not a note: it goes back (rule 11).")], []),
    "WS-P42": (D5 + ": the brief-gap protocol gains a Worksheet Designer route beside the Slide Designer's, so its continue-and-note route no longer governs a sheet a child could not use" + R2 + "nor one that contradicts the objective (finding 6)",
               [(GAP, "The continue-and-note route this protocol describes (The principle above, and How to apply below) does not govern a worksheet a child could not use as printed, or one that contradicts the objective. The worksheet designer omits that sheet and returns it to its owner (a `WORKSHEET_CONTENT_GAP` note and its `returned` entry; its rules 9 and 11), and the other sheets continue. A doubt that leaves the sheet usable and true to the objective is still a `notes` entry, as below.")], []),
    "WS-C12": (SJ + ": the Below sheet's hint and word bank go on the fields its adaptation names",
               [(SHARED, "hangs a `hint` and a `wordBank` on the fields its adaptation names")],
               [(SHARED, "on the fields that need one", "local")]),
    "WS-I12": (ST + ": the dated drop and its two clipped packs are in the log",
               [(LOG, "Two packs went out with the learning objective clipped to \"To ex\" and \"To id\" by the combined-PDF merge (8 September 2026)")],
               [(WSH, "(Dropped 8 September 2026", "local")]),
    "WS-R13": (D10 + ": the list refusal leaves off a list of a method's steps printed just as a reminder too, without saying where they are shown",
               [(TEXT, "'board and are never printed on a worksheet. A list of a method\\'s steps printed ' +"),
                (TEXT, "'just as a reminder is left off too. Otherwise, if they are steps a child ' +"),
                ("worksheet-html/test/list-refusal-message.test.js", "the list refusal leaves off criteria and a list of a method's steps printed just as a reminder")], []),
    "WS-R15": (SO + ": the word list feeds `recordingAdvisories`, never a refusal",
               [(SLIPS, "// the sheet holds: a box in the question's own sentence (`4,_50`), or on a"),
                ("worksheet-html/test/slips.test.js", "words about a box are judged by what the sheet holds, never by the reason's words"),
                ("worksheet-html/test/slips.test.js", "the sheet saying it was looked at again quiets the prompt; the reason's words do not")],
               [(SLIPS, "RECORDING_NEEDS_SHEET"), (SLIPS, "reason.includes(", "local")]),
    "WS-R16": (D5 + " and " + SF + R1 + "the gate reads each return's `returned` record, never the note's words (findings 1 and 2): a teaching problem stands; a picture problem stands when its refs will never arrive (absent, or terminal) or the picture stage was `unavailable`, and is refused only while a named picture is still coming or no ref is named; the refusal never says to ship a sheet a child could not use",
               [(CHECK, "    const entry = returnedEntry(worksheet, directive.sheetKey);"),
                (CHECK, "`this sheet can be built: design it to the promised filenames. Anything ` +"),
                (CHECK, "const NEVER_ARRIVES = new Set([\"unsatisfied\", \"omitted\"]);"),
                (CHECK, "if (argv[i] === \"--picture-stage\") { pictureStageArg = argv[++i]; continue; }"),
                ("worksheet-html/test/directed-sheets.test.js", "a Below sheet returned for its teaching stands, whatever its note mentions"),
                ("worksheet-html/test/directed-sheets.test.js", "a picture still coming is refused, and the refusal never says to ship a sheet a child could not use"),
                ("worksheet-html/test/directed-sheets.test.js", "a picture return naming no ref is refused while pictures may still come"),
                ("worksheet-html/test/directed-sheets.test.js", "the designer's own return line stands under an unavailable picture stage"),
                ("worksheet-html/test/directed-sheets.test.js", "terminal receipts that say never let a picture return stand; a published or missing receipt refuses"),
                ("worksheet-html/test/directed-sheets.test.js", "a return needs its record and its note"),
                (CHECK, "`the picture stage was unavailable, so it will never be published. ` +"),
                ("worksheet-html/test/pending-pictures.test.js", "under an unavailable picture stage the pending advisory says the picture will never come")],
               [(CHECK, "PICTURE_CLAIM", "local"), (CHECK, "Name the missing ref, or design the sheet."), (CHECK, "that is not about a picture", "local")]),
}

ADDED = [
    ("WS-DEC-05-GATE", D5 + " and " + SF + ": the worksheet designer's gate passes its picture stage, and says what stands",
     [(WSD, "  --picture-stage \"[your PICTURE_STAGE: line, verbatim]\""),
      (WSD, "Omit `--adaptation` (and `--photo-requirements`) only when no adaptation was supplied, and `--picture-stage` only when your prompt carries no `PICTURE_STAGE:` line."),
      (WSD, "approves and the run can still publish. It reads each returned sheet's `returned` entry, never the note's words: a teaching problem stands and goes back to its owner, and so does a picture problem whose named refs will never arrive (absent from the contract, or terminal, or under an `unavailable` picture stage); a picture problem over a picture still coming is refused, because that sheet can still be built, and so is a teaching problem while that sheet's own pictures (its Photo refs in the adaptation) are approved and not yet published."),
      (WSD, "An entry beside a sheet still in `sheets`, or for a tier the adaptation does not direct, is refused too.")]),
    ("WS-DEC-20-ENGINE", SO + ": the preflight prints the prompt, the build keeps an answered books sheet, and the contract's signal table says so",
     [(CHECK, "  for (const advisory of recordingAdvisories(worksheet)) {"),
      (CHECK, "    console.warn(`[recording] ${advisory.signal}: ${advisory.message}`);"),
      (BUILD, "  for (const advisory of recordingAdvisories(worksheet)) {"),
      (BUILD, "      `they need the printed page, and the sheet does not say it was looked at ` +"),
      (WSH, "| `RECORDING_LOOK_AGAIN` | Preflight only, and a prompt to look again rather than a refusal."),
      (WSH, "| `recordingLookedAgain` | optional, `true` or `false`."),
      ("worksheet-html/test/slips.test.js", "his digit-box sheet keeps books by what it holds"),
      ("worksheet-html/test/slips.test.js", "a books sheet looked at again keeps books through the build"),
      ("worksheet-html/test/directed-sheets.test.js", "a books sheet whose words look as if they need the page passes with a prompt to look again")]),
    ("WS-DEC-05-RETURNED", D5 + " and " + SF + R1 + "a return is a field, `returned`, beside its note; the Expected sheet is never built around; the repair's scope check treats the record as not child content" + R2 + "a returned sheet is out of `sheets`, taken out whole by the repair, which the scope check allows and nothing else (and never a record taken away); a sheet in `sheets` is always checked and built, and an entry beside one is refused at the preflight and said to be left on at the build (`RETURN_RECORD_LEFT`); an entry for a tier the adaptation does not direct is refused; a teaching return is refused while that sheet's own pictures (the adaptation's Photo refs for it) are approved and not yet published, the 30 August loss (findings 1 and 2); the build refuses a malformed record (finding 10)",
     [("worksheet-html/src/returned.js", "const PROBLEMS = [\"teaching\", \"picture\"];"),
      ("worksheet-html/src/returned.js", "  const leftOver = returned.filter((entry) => sheets[entry.sheet]);"),
      (WSD, "Beside the note, record the return in `worksheet.json`'s top-level `returned`, which is what the gate reads (it never reads the note's words):"),
      (WSD, "A sheet sent back is out of `sheets`: a sheet in `sheets` is always checked and built, and the gate refuses an entry beside one, so when a redesigned sheet goes in, take its entry and its note off."),
      (WSD, "The Expected sheet is never built around: returning it ends your run without `WORKSHEET_PREFLIGHT_OK`, on purpose, so report the return and stop."),
      (WSD, "A required visual the brief never requested at all has no ref to name: it is the brief's own gap, so `\"problem\": \"teaching\"`."),
      (WSH, "| `returned` | optional, top level only."),
      (WSH, "A sheet in `sheets` is always checked and built: the preflight refuses an entry beside one, or for a tier the adaptation does not direct."),
      (WSH, "`\"teaching\"` covers a sheet that contradicts the objective too (rule 11), and is refused while that sheet's own pictures are approved and not yet published."),
      (BUILDER, "| `RETURN_RECORD_LEFT` | The spec holds a Below or Greater Depth sheet and a `returned` entry for it"),
      (BUILDER, "| `RETURNED_INVALID` | The spec's `returned` record is malformed, names the Expected sheet while it is still in the spec, or sends a sheet back when there is no Expected sheet to print in its place"),
      (BUILD, "`Expected sheet to print in its place: the Expected sheet goes back to the ` +"),
      (BUILD, "      `RETURN_RECORD_LEFT: ${label} - the spec holds a ${label} sheet and a \"returned\" ` +"),
      (CHECK, "`the Expected sheet is returned to the lesson designer (${describeReturn(back)}). ` +"),
      (CHECK, "function tierPhotoRefs(adaptation, label) {"),
      (CHECK, "`the ${label} sheet is returned while its own pictures (${pending.join(\", \")}, ` +"),
      (CHECK, "`\"returned\" sends the ${directive.label} sheet back, but the adaptation does not ` +"),
      (CHECK, "`the spec holds the ${LABELS[tier]} sheet and a \"returned\" entry for it ` +"),
      ("scripts/check-repair-scope.py", "    \"returned\",\n"),
      ("scripts/check-repair-scope.py", "def without_sheets_sent_back(before: object, after: object) -> object:"),
      ("scripts/check-repair-scope.py", "def returns_taken_away(before: object, after: object) -> list[str]:"),
      ("worksheet-html/test/directed-sheets.test.js", "a Below sheet a repair returns over a dead picture costs neither the other sheets nor the key"),
      ("worksheet-html/test/directed-sheets.test.js", "the Expected sheet sent back stops the worksheets with a message that fits the gap"),
      ("worksheet-html/test/directed-sheets.test.js", "a sheet in the spec beside its own record is measured, and the preflight says the record must come off"),
      ("worksheet-html/test/directed-sheets.test.js", "the build prints a redesigned sheet left beside its record, and says the record is left on"),
      ("worksheet-html/test/directed-sheets.test.js", "a record for a tier the adaptation does not direct is refused"),
      ("worksheet-html/test/directed-sheets.test.js", "a teaching return is refused while the sheet's own pictures are still coming"),
      ("worksheet-html/test/directed-sheets.test.js", "the build refuses a malformed record"),
      ("scripts/tests/test_repair_scope.py", "def test_sending_a_sheet_back_whole_and_recording_it_is_a_repair(self):"),
      ("scripts/tests/test_repair_scope.py", "def test_a_record_already_there_cannot_be_taken_away(self):")]),
    ("WS-DEC-05-STANDS-IN", D5 + "; then " + HS + R2 + "the lead passing it on for every Below or Greater Depth sheet the build cannot make: while the spec records a Below or Greater Depth return, the build prints the Expected sheet in that tier's place, its key section the Expected answers and saying so; at the last resort (`--omit-unfittable`) the same for a Below or Greater Depth sheet the build cannot make for any fault (its page, a picture, a panel, its key, what the page prints, or clipped in the browser) while the Expected sheet passes every check, the Expected sheet measured the same way first so no stand-in is announced and then dropped (finding 5); the one exception, an Expected sheet the page cannot hold, is still omitted and then nothing stands in, and an Expected sheet with any other fault still refuses the pack; each stand-in is named on a `SHEET_STANDS_IN:` line once the pack is built, a flag for his report with no `BUILD_DIAGNOSTIC` (finding 9); with no Expected sheet to print, the build refuses; the run's summary flags every tier stood in for",
     [("worksheet-html/src/returned.js", "function withExpectedStandingIn(worksheet) {"),
      ("worksheet-html/src/returned.js", "function withExpectedIn(worksheet, tier) {"),
      (BUILD, "  const back = withExpectedStandingIn(spec);"),
      (BUILD, "  if (omitUnfittable && packSpec.sheets && packSpec.sheets.expected && !sheetFaults(packSpec, \"expected\", specDir).length) {"),
      (BUILD, "function sheetFaults(worksheet, key, specDir) {"),
      (BUILD, "      clippedKeys.every((key) => STAND_IN_TIERS.includes(key) && !standIns.has(key))"),
      (BUILD, "      `SHEET_STANDS_IN: ${label} - the Expected sheet stands in for ${label}, and the ` +"),
      ("worksheet-html/src/worksheet.js", "`The Expected sheet stands in here for the ${SHEET_LABELS[name]} sheet, ${stoodIn[name]}. ` +"),
      ("scripts/run-fixed-resource.py", "        summary[\"standInSheets\"] = sheets_stood_in(completed.stdout)"),
      (REPAIR, "until the redesign goes in, the build prints the Expected sheet in its place and flags it."),
      (BUILDER, "| `SHEET_STANDS_IN` | A Below or Greater Depth tier printed with the Expected sheet in its place"),
      (WSH, "| `SHEET_STANDS_IN` | A Below or Greater Depth tier its `returned` entry sends back holds the Expected sheet"),
      (WSH, "A returned Below or Greater Depth sheet is out of `sheets` and goes back to the adaptation designer"),
      ("worksheet-html/test/stand-in.test.js", "the Expected sheet stands in for a returned Below sheet, with its answers and a flag"),
      ("worksheet-html/test/stand-in.test.js", "with no Expected sheet to print in its place, the build refuses rather than leave a tier with nothing"),
      ("worksheet-html/test/omit-unfittable.test.js", "the Expected sheet stands in for a Greater Depth sheet the page cannot hold"),
      ("worksheet-html/test/omit-unfittable.test.js", "an Expected sheet the page cannot hold is still omitted, and nothing stands in for it"),
      ("worksheet-html/test/omit-unfittable.test.js", "a Below sheet with a word bank typed into its question gets the Expected sheet at the last resort"),
      ("worksheet-html/test/omit-unfittable.test.js", "a Below sheet the browser finds clipped gets the Expected sheet at the last resort"),
      ("worksheet-html/test/omit-unfittable.test.js", "an Expected sheet with a fault other than page fit still refuses the pack at the last resort"),
      ("scripts/tests/test_run_fixed_resource.py", "def test_a_tier_the_expected_sheet_stands_in_for_is_flagged(self) -> None:")]),
    ("WS-DEC-11-GENERATED", SG + R1 + "each generated reference can be checked against its generator, and a test does (finding 10)",
     [(CATALOGUE_JS_FILE, "  if (process.argv.includes(\"--check\")) {"),
      (LAYOUTS_JS, "  if (process.argv.includes(\"--check\")) {"),
      ("worksheet-html/test/generated-references.test.js", "is what ${script} writes today")]),
]

HOMES = [
    (PREF, "### What the sheet is for", "HOME-WS-PREF-FOR"),
    # The lesson designer's own Worksheet section (the first check's attack 5:
    # a paragraph saying the opposite beside a pinned one passed everything).
    (LD, "### Worksheet", "HOME-WS-LD"),
    (PREF, "### The printed page", "HOME-WS-PREF-PAGE"),
    (LDC, "## Generated worksheet", "HOME-WS-LDC"),
    (MATHS, "## The worksheet's sections in maths", "HOME-WS-MATHS-SECTIONS"),
    (MATHS, "## How a maths sheet's questions are worded", "HOME-WS-MATHS-WORDING"),
    (BOS, "## Why the choice exists", "HOME-WS-BOS-WHY"),
    (BOS, "## The test", "HOME-WS-BOS-TEST"),
    (WSD, "## Rules that never change", "HOME-WS-WSD-RULES"),
    (REV, "### 5. Worksheet evidence", "HOME-WS-REV"),
    (GAP, "## Worksheet Designer route", "HOME-WS-GAP"),
]

Q = re.compile(r"«(.+?)»")
P = ledger_mapping.P

CHANGED = {}
for raw in (REPO / "plans" / LEDGER).read_text(encoding="utf-8").splitlines():
    m = re.match(r"^\| (WS-[A-Z]\d{2}) \|", raw)
    if not m:
        continue
    rid = m.group(1)
    path = P.search(Q.sub("", raw))
    if not path:
        continue
    rel, quotes = path.group(1), Q.findall(raw)
    if rid in HAND:
        CHANGED[rid] = HAND[rid]
        continue
    missing = [q for q in quotes if norm(q) not in text_of(rel)]
    if not missing:
        if rid in GAINED:
            outcome, extra, absent = GAINED[rid]
            CHANGED[rid] = (outcome, [(rel, q) for q in quotes] + extra, absent)
        continue
    assert rid in WHY and rid in NEW, f"{rid} changed but has no decision or new words named"
    present = [(rel, q) for q in quotes if q not in missing] + NEW[rid]
    CHANGED[rid] = (WHY[rid], present, ABSENT.get(rid, []))

unused = (set(WHY) | set(NEW)) - set(CHANGED)
assert not unused, f"decisions named for rows that did not change: {sorted(unused)}"
unused_gained = set(GAINED) - set(CHANGED)
assert not unused_gained, f"gains named for rows that changed: {sorted(unused_gained)}"

PINS_FILE = ledger_mapping.ROOT / "scripts" / "tests" / "worksheets_ledger_pins.json"

build(
    ledger=LEDGER,
    prefix="WS",
    changed=CHANGED,
    added=ADDED,
    homes=HOMES,
    pins="scripts/tests/worksheets_ledger_pins.json",
    mapping="2026-09-24-worksheets-mapping.md",
    title="Worksheets mapping: where every ledger row went",
    snapshot="4.2.289 2db3ceba, changed to 4.2.290 (uncommitted)",
    intro=[
        "Every row of `2026-09-23-worksheets-ledger.md` (built on the 4.2.288 working",
        "tree and rechecked word for word against 4.2.289 before the change), with what",
        "happened to it in 4.2.290. \"Unchanged in place\" rows are word for word where",
        "the ledger found them. Every other row names the decision that changed it (his",
        "words are in the ledger's \"Decisions taken\" and the change plan",
        "`2026-09-24-worksheets-change-plan.md`) and the paragraph that now carries its",
        "words; a retired phrase is listed as gone. Built and checked by",
        "`streamline-tools/ws-change/build_ws_mapping.py`. The same list is pinned by",
        "`scripts/tests/worksheets_ledger_pins.json`.",
    ],
)

# The first check brought a retired sentence back with a capital first letter
# and every test passed. Every barred phrase that is gone in any case is marked
# `anyCase`, and `ledger_pin_checks.py` then matches it ignoring case; a phrase
# still found in another case somewhere (ordinary English) keeps exact matching.
import json  # noqa: E402

data = json.loads(PINS_FILE.read_text(encoding="utf-8"))
everywhere_files = sorted(set(ledger_mapping.RUNTIME) | set(ledger_mapping.PROGRAMS))
marked = 0
for row in data["rows"]:
    for pin in row["absent"]:
        own = ledger_mapping.ROOT / pin["file"]
        files = sorted(set(everywhere_files) | {own}) if pin.get("everywhere") else [own]
        needle = pin["text"].lower()
        if all(needle not in norm(path.read_text(encoding="utf-8")).lower() for path in files):
            pin["anyCase"] = True
            marked += 1
PINS_FILE.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"ANY_CASE {marked} retired phrases barred in any case")
