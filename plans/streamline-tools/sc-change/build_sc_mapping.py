"""The success-criteria mapping and pins (4.2.288).

Every changed row names the decision that changed it (`WHY`) and the words
that now carry it (`NEW`, taken from the change scripts); rows whose words left
their file are mapped by hand (`HAND`). `ledger_mapping.build` checks every
phrase against the files and pins each changed row's whole paragraph."""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from ledger_mapping import REPO, ROOT, build, norm, text_of  # noqa: E402

LEDGER = "2026-09-23-success-criteria-ledger.md"
PREF = "references/preferences.md"
TV = "references/teacher-voice.md"
SKILL = "references/teaching-sequence-skill-based.md"
LD = "agents/lesson-designer.md"
REV = "agents/design-reviewer.md"
OT = "references/output-template.md"
TPL = "references/templates.md"
SSC = "references/slide-success-criteria.md"
WSD = "agents/worksheet-designer.md"
WALL = "agents/working-wall-designer.md"
WP = "references/working-wall-preferences.md"
WCC = "references/working-wall-card-contracts.md"
PACKET = "scripts/design-review-packet.py"
VALIDATOR = "scripts/validate-lesson-design.py"
LOG = "references/build-review-log.md"

# What each changed row's decision was (the ledger's "Decisions taken" and
# "Read back"); every row found changed must be named here.
WHY = {
    "SC-A02": "the contents line names what the section now holds (decisions 3, 5 and 8)",
    "SC-C01": "decision 6: sentence stems join the forms",
    "SC-C02": "decision 6: criteria are what a child who gets stuck looks at and uses; a table of facts is still a representation",
    "SC-C07": "decision 10: the designer's copy becomes a pointer to the home, keeping its self-check (decision 6's definition in it)",
    "SC-C10": "decision 10: \"short verb-first imperatives\" became \"clear verb-first steps\", clear first",
    "SC-C11": "decision 6: the pointer names every form, sentence stems and a worked example among them",
    "SC-C18": "decision 7: the contract's example is steps a child can use (his comparing rewrite)",
    "SC-C23": "decision 7: the slide catalogue's example is steps a child can use (his rounding rewrite)",
    "SC-D04": "decision 9: a second sentence is not a fault in itself; one that only names what the step produced goes",
    "SC-D06": "decisions 2 and 15: a condition that is part of a step stays, as an If sentence or a short question; extra knowledge goes to sticky knowledge or the teaching",
    "SC-D10": "decisions 9 and 15: a step is normally one sentence, or a short question that tells the child what to do next",
    "SC-D11": "decision 9: his approved steps are almost all one sentence; a second that only names the result goes",
    "SC-D14": "decision 9, in his words: his rounding rewrite without \"That's the ten below.\" and \"That's the ten above.\"; the other rewrites stay exactly",
    "SC-D16": "decision 15: a short question that tells the child what to do next is a good step (`Same? Move right.`), and so is an If sentence",
    "SC-D21": "his words kept, without the date (the standing ruling)",
    "SC-D26": "decision 9 and the standing ruling: the example without the result sentences, and without the date (346 is now in the log)",
    "SC-D27": "decision 2, in his words: an occasional case is extra knowledge, the kind sticky knowledge or the teaching carries",
    "SC-D31": "decision 10: the designer's copy of the home's rules became the pointer; the words live in the home",
    "SC-D33": "decision 14: the mechanics pointer names carrying Concept 1's steps in their own words",
    "SC-D37": "decision 15: `Same? Move right.` left the too-short list, which now says a short question that tells the child what to do is not that fault",
    "SC-D38": "decision 9: a second sentence is a common sign, not the sign; one giving a condition stays, one naming the result goes",
    "SC-D40": "decision 2: the occasional case is extra knowledge, taught where it comes up, not a note under the steps",
    "SC-E12": "decision 16: \"just-taught\" left; only an action secure from earlier lessons is named without saying how",
    "SC-F13": "decision 14: the wrap-around carries Concept 1's needed steps in their own words, not compressed cues",
    "SC-H04": "decision 4: the full criteria slide is for criteria being taught, compared or built, never overflow",
    "SC-J01": "decision 8 reaching the colour marks: the board and the wall colour them; a worksheet no longer carries criteria",
    "SC-J03": "decision 1: every taught word green, every time; the one-or-two limit is for the other marks",
    "SC-J06": "decision 8: the wall copies the marks; a worksheet no longer carries criteria",
    "SC-K05": "decisions 3, 4 and 11: no step default; past half, a different composition, never fewer criteria, and the criteria slide only for criteria taught or built",
    "SC-K06": "decision 13: the slide designer makes the whole list fit and does not report it back as unfittable",
    "SC-K13": "decision 11: the final check blocks on the caption band only; the criteria count reports",
    "SC-K43": "decision 13: a criteria table stays a table, never turned into lines",
    "SC-L01": "decision 5: criteria marked to build live are offered to the wall, which decides; if they go up, the exact same steps",
    "SC-L04": "decision 5, in the designer's words",
    "SC-L05": "decision 5, in the contract",
    "SC-L12": "decision 5: the mark offers a reference to the wall; the wall-worthy test still decides",
    "SC-N01": "decision 8, in his words: never on a worksheet; `worksheet.successCriteriaRefs` always empty",
    "SC-N02": "decision 8: the engine refuses the steps panel on a sheet; the grey-paragraph story stays as the reason a list is not an instruction",
    "SC-N03": "decision 8: the story stays as a plain example beside rule 14",
    "SC-N04": "decision 8: the preflight confirms no criteria are printed",
    "SC-N05": "decision 8: criteria no longer an example of support on a sheet",
    "SC-N06": "decision 8: criteria and steps no longer among a sheet's support",
    "SC-N07": "decision 8: criteria no longer among a sheet's support",
    "SC-N08": "decision 8: a worksheet never carries SC, and the validator refuses any; the check that the board's criteria fit the sheet's own evidence and response stays (the change check's 1a), and the review page heads the sheet with where they were shown",
    "SC-N10": "decision 8: always empty, and refused otherwise",
    "SC-N12": "decision 8: a slip drops the answer room and the marked figures; criteria are on neither sheet nor slip",
    "SC-N13": "decision 8, in the helper guide",
    "SC-O04": "decisions 11 and 12: the orphaned \"exception above\" is gone; a criteria step is never shortened, split or reworded, and the card makes room",
    "SC-O14": "decision 11: the old visual gate's exception is gone; a text-led card passes the wall-worthy test or stays on the slides",
    "SC-O15": "decision 11, as O14",
    "SC-O19": "decision 12: a criteria step is copied word for word and the card makes room",
    "SC-O23": "decisions 7 and 5: the example is his rounding steps, and steps that are the lesson's criteria are copied word for word",
    "SC-Q01": "decisions 2, 6, 9, 10 and 15 in the reviewer's criteria check",
    "SC-S12": "code, decisions 9 and 15: the two cues ask his questions rather than pointing at a fault",
    "SC-S17": "code, decision 5: the check's note says the wall is offered the reference",
    "SC-D09": "decision 10 (the second check's finding 5): Slide Philosophy's copy points home, as Written Voice's does",
    "SC-F18": "decision 6 in the task-centred output line (the second check's finding 7): the success criteria are attached, not a standard",
    "SC-H47": "decision 6 (the second check's finding 7): Set the Task puts the question and the success criteria on the board",
    "SC-A06": "decision 6 in the task-centred route (the change check's 2a): the criteria are what a child who gets stuck uses, not the standard aimed at",
    "SC-A07": "decision 6 in the task-centred route, as A06",
    "SC-C14": "decision 6: steps or sentence stems for a product or a piece of writing, not a feature checklist",
    "SC-F17": "decision 6 in the task-centred contract line: what a stuck child uses, written once as the criteria",
    "SC-B01": "decision 6 in the content route (the change check's 2a): what a stuck child can use, not the features of a successful performance",
    "SC-K12": "the long-list investigation's measurement: five one-line steps need about 3.25 inches inside a panel",
    "SC-K38": "the long-list investigation's measurement: the bottom strip holds no criteria list at 18pt",
    "SC-N22": "decision 8: the kept story no longer shows the steps on the sheet as the answer",
    "SC-P04": "decision 8 reaching Greater Depth, as P01",
}

# Rows whose words left their file, mapped by hand: (outcome, present, absent).
HAND = {
    "SC-D44": ("retired by decision 15: a short question step is not a thing to avoid",
               [(TV, "- **Write a condition so the child knows what to do next.**")],
               [(TV, "Same digits? Move right.")]),
    "SC-N14": ("retired from the designer's catalogue by decision 8: the engine keeps the panel but never lets it onto a sheet",
               [("worksheet-html/src/render.js", "const NOT_ON_SHEETS = new Set([\"steps\"]);"),
                ("worksheet-html/scripts/build-catalogue.js", "const notOnSheets = NOT_ON_SHEETS;")],
               [("references/worksheet-helpers/catalogue.md", "#### `steps`", "local"),
                ("worksheet-html/src/helpers/text.js", "or the steps of its method, leave them"),
                ("worksheet-html/src/render.js", "Success criteria, and a method's steps, stay on the board")]),
    "SC-N15": ("retired from the designer's catalogue by decision 8 (as N14)",
               [("worksheet-html/src/render.js", "CRITERIA_NOT_ON_SHEETS")],
               [("references/worksheet-helpers/catalogue.md", "Success criteria or the steps of the taught method, in the same green panel", "local")]),
    "SC-N20": ("retired with the catalogue entry by decision 8; its fragment steps were decision 7's example",
               [("worksheet-html/src/render.js", "Success criteria stay on the board and are never printed on a")],
               [("references/worksheet-helpers/catalogue.md", "\"title\": \"Use these steps to help you.\"", "local")]),
}

# Retired wordings, barred where they were (a phrase that is ordinary English
# elsewhere is barred in its own file only).
ABSENT = {
    "SC-J03": [(PREF, "the picture wins")],
    "SC-K05": [(SSC, "Five short steps"), (SSC, "fewer criteria on this slide"), (SSC, "show fewer criteria on the slide or give them that slide of their own")],
    "SC-K43": [(TPL, "same criteria as lines")],
    "SC-H04": [(TPL, "Use when the criteria needs space")],
    "SC-K13": [(TPL, "treats them as blocking composition diagnostics")],
    "SC-E12": [(SKILL, "just-taught")],
    "SC-D40": [(SKILL, "under the steps as a note")],
    "SC-F13": [(SKILL, "fold the key decision cues"), (SKILL, "Not the full SC verbatim, but enough to trigger the right procedure")],
    "SC-D16": [(TV, "Write a condition as a sentence, not a slogan")],
    "SC-D14": [(TV, "That's the ten below.", "local"), (TV, "That's the ten above.", "local")],
    "SC-L01": [(PREF, "and the working wall reproduces the same reference")],
    "SC-N01": [(WSD, "Include the exact concise criteria when the sheet must stand independently"), (WSD, "Include success criteria only when the upstream worksheet decision")],
    "SC-N02": [(WSD, "Fewer criteria on the paper is a real answer")],
    "SC-N10": [(OT, "names the exact success-criteria objects printed on the generated Expected sheet")],
    "SC-O14": [("references/working-wall-visual-language.md", "success-criteria exception")],
    "SC-S12": [(PACKET, "question-fragment condition")],
    "SC-A06": [("references/teaching-sequence-task-centred.md", "the standard for the task itself")],
    "SC-A07": [("references/teaching-sequence-task-centred.md", "is the standard for the task, kept visible throughout")],
    "SC-D44": [(TV, "Same digits? Move right.")],
    "SC-D11": [(TV, "gives a condition the step always meets")],
    "SC-D38": [(SKILL, "one that gives a condition the step always meets")],
    "SC-F18": [("references/teaching-sequence-task-centred.md", "attach the exact standard")],
    "SC-H47": [("references/teaching-sequence-task-centred.md", "the question and the standard on the board")],
    "SC-K12": [(TPL, "cannot hold 5 steps at full size"), (TPL, "5 steps needs ~2.0–2.5″ of zone height")],
    "SC-K38": [(TPL, "and success-criteria steps. The bottom strip"), (TPL, "The bottom strip is sized for ~5 step rows")],
    "SC-O04": [(WALL, "The 2-line cap exception above"), (WALL, "unless the steps refer to it")],
}

# Rows whose quotes still stand but which a decision reached: pinned with the
# words that now carry the decision beside them.
GAINED = {
    "SC-S07": ("code, decision 1: the refusal no longer offers taking the word out of the criteria",
               [(VALIDATOR, "\"child meeting the criteria would write it, using the word; a taught \""),
                (VALIDATOR, "\"word stays in the criteria, and a class shown a model that would fail \""),
                (VALIDATOR, "\"the standard is being marked against something it was never shown\",")],
               [(VALIDATOR, "or take the word out of the ")]),
    "SC-S06": ("code, decision 8: every sheet's `successCriteriaRefs` must be empty now, not only a shared frame's",
               [(VALIDATOR, "\"worksheet.successCriteriaRefs must be []: success criteria stay on the \"")], []),
    "SC-S18": ("code, decisions 3 and 4: the panel's refusal names a roomier shape, never fewer criteria or a criteria slide for overflow",
               [("builder/src/success-criteria-panel.js", "`side) and arrange the work beside it. Never show fewer criteria, and a ` +")],
               [("builder/src/success-criteria-panel.js", "a composition that shows fewer criteria on this slide", "local")]),
    "SC-S20": ("code, decision 11: the warning calls its numbers a cue to look, not what the panel holds",
               [("builder/src/content/capacity.js", "`limit). Nothing was removed.`,")],
               [("builder/src/content/capacity.js", "the panel holds ` +", "local"),
                ("builder/src/content/steps.js", "such as the half-width split with the criteria down one whole side")]),
    "SC-O20": ("decision 12: a criteria step is never written short; the card makes room",
               [(WALL, "A success-criteria step is never written short: it is copied, and the card makes")], []),
    "SC-O22": ("decision 12: the repair never rewords a criteria step and says its card needs room",
               [("agents/working-wall-designer-focused-repair.md", "A success-criteria step is never reworded by anyone, so for one of those say instead that its card needs room (its picture off unless its steps need it, or its list over two cards).")], []),
    "SC-P01": ("decision 8 reaching Greater Depth: a criterion is written into the task, never printed as a panel",
               [("agents/adaptation-designer.md", "A criterion in this section, sharper or kept as support, is written into the task or the standard it asks for, never printed on the sheet as a success-criteria panel")], []),
    "SC-H01": ("decision 4: the criteria-only slide sentence sits beside it",
               [(PREF, "A slide that is only the criteria is for criteria being taught, compared or built with the class, and then it may fill the slide")], []),
    "SC-K07": ("decision 3: the whole list or none sits beside it",
               [(PREF, "A method's steps appear all together, in order, or not at all: never only some of them, on a slide, on the wall or anywhere else, and when they do not fit, the layout changes, never the list.")], []),
}

ADDED = [
    ("SC-DEC-12-WALL", "decision 12, with decisions 3 and 5, on the wall (the second check's findings 4, 6 and 9): a criteria step or table is copied whole and word for word, its card makes room (the picture off unless the steps need it, or two cards), and two cards is the one exception to a second teaching card",
     [(WP, "shorten faithful display text (never a success-criteria step, which is copied word for word)"),
      (WALL, "a success-criteria step is the exception (Rules That Never Change)."),
      (WALL, "A success-criteria table is never cut, only split over two cards."),
      (WP, "A success-criteria table only splits: every row and word goes up, as the class used it."),
      (WCC, "The wall is finite. The normal output is one coherent overview of the lesson's main learning; a second teaching card is exceptional and must do a genuinely different, repeatedly consulted job that the first cannot absorb; the exception is a list or table too long for one card, carried in order over two cards of the same title, which is one job split for room (the wall build already offers it, and for success criteria it is how the card makes room, since their words never change). Never more than two teaching cards. Wall furniture (a banner, section headings) is produced only on an explicit request from the teacher or the spawn prompt and counts as physical output."),
      ("working-wall-html/src/layout.js", "unless the table is the lesson's success criteria, which are copied word for word (the card makes room instead)"),
      ("working-wall-html/src/layout.js", "a success-criteria table keeps every row and word, so its card makes room instead, or the table goes over two cards.")]),
    ("SC-DEC-11-MSG", "decisions 3, 11 and 13 in the builder's messages (the second check's findings 3 and 6): the fit summary keeps criteria words, the capacity numbers are a cue, a fitting panel is not flagged, and the panel refusal names the criteria slide's three uses",
     [("builder/build.js", "`except in a criteria panel, whose words stay and whose lever is a roomier composition.`"),
      ("builder/src/content/capacity.js", "`back of the room beside the work (${SC_MANY_ITEMS} is a cue to look, not a ` +"),
      ("builder/src/content/capacity.js", "`the back of the room beside the work (${SC_LONG_TOTAL_CHARS} is a cue to ` +"),
      ("builder/src/content/capacity.js", "`look, not a limit). Nothing was shortened.`,"),
      ("builder/src/success-criteria-panel.js", "slide is only for criteria being taught, compared or built. ` +"),
      ("scripts/tests/test_success_criteria_fit_a_glance.py", "def test_a_panel_that_fits_is_not_flagged_to_check_before_teaching():")]),
    ("SC-DEC-08-ENGINE", "decision 8 in his words, in the worksheet engine (the second check's findings 1 and 2): the list refusal leaves success criteria off and sends a method's steps a child works through to their question; a panel on an auto sheet is refused before a shape is chosen, never priced as content or a reason to omit a sheet; the template never asks for sheet criteria",
     [("worksheet-html/src/helpers/text.js", "'are the lesson\\'s success criteria, leave them off: they stay on the ' +"),
      ("worksheet-html/src/helpers/text.js", "'board and are never printed on a worksheet. Otherwise, if they are steps a child ' +"),
      ("worksheet-html/src/helpers/text.js", "'works through to reach the answer, they are part of its question: put ' +"),
      ("worksheet-html/src/helpers/text.js", "'them with it, one to a line, or in maths use \"method-frame\". ' +"),
      ("worksheet-html/src/render.js", "// Success criteria stay on the board. The teacher does not want them on any"),
      ("worksheet-html/src/worksheet.js", "function sheetCriteriaPanels(worksheet) {"),
      ("worksheet-html/src/worksheet.js", "if (isEmptyGroup(cleaned) && !isEmptyGroup(item)) continue;"),
      ("worksheet-html/scripts/check-worksheet.js", "const panelsFound = sheetCriteriaPanels(worksheet);"),
      ("worksheet-html/scripts/check-worksheet.js", "worksheet = withoutTheirPanels;"),
      ("worksheet-html/scripts/build-worksheet.js", "const panels = sheetCriteriaPanels(worksheet);"),
      ("worksheet-html/test/omit-unfittable.test.js", "the preflight measures a sheet without its panels, and leaves no empty row behind"),
      ("worksheet-html/test/omit-unfittable.test.js", "a named sheet's panel is named even when another sheet cannot be laid out"),
      ("worksheet-html/test/omit-unfittable.test.js", "a panel held in a slot of its own is named once and said to be still measured"),
      ("worksheet-html/src/worksheet.js", "out[key] = isEmptyGroup(cleaned) && !isEmptyGroup(value) ? value : cleaned;"),
      ("scripts/tests/test_success_criteria_fit_a_glance.py", "def test_the_sheet_list_refusal_is_held_whole():"),
      ("scripts/tests/test_success_criteria_fit_a_glance.py", "def test_the_18_to_19pt_warning_asks_for_nothing_and_is_held_whole():"),
      ("worksheet-html/test/omit-unfittable.test.js", "a criteria panel is refused before the fit, and never costs the pack a sheet"),
      ("worksheet-html/test/omit-unfittable.test.js", "the preflight names a panel on an auto sheet and measures the page without it"),
      ("scripts/tests/test_lesson_design_scaffold.py", "def test_a_generated_worksheet_is_scaffolded_without_success_criteria():"),
      ("scripts/design-review-packet.py", "def worksheet_heading(design: dict) -> str:")]),
    ("SC-DEC-12", "decision 12 in the wall's program: the overflow messages the wall designer follows never offer to shorten a success-criteria step",
     [("working-wall-html/src/layout.js", "otherwise remove an item or shorten the longest, never a success-criteria step, which is copied word for word"),
      ("working-wall-html/src/layout.js", "a success-criteria step is never reworded, so its card makes room instead (the picture off unless the steps need it, or the list over two cards)")]),
    ("SC-DEC-11-FIT", "decisions 3, 11 and 13 with the long-list investigation: the capacity cue is not a fault to flag before teaching, and the 18 to 19pt warning names a roomier composition, not shorter words",
     [("builder/src/content/capacity.js", "`limit). Nothing was removed.`,"),
      ("builder/build.js", "// SUCCESS_CRITERIA_CAPACITY is a cue to look, not a fault (the teacher's"),
      ("builder/src/content/steps.js", "`success criteria set at ${sharedFont}pt: within the 18pt floor, below the ` +"),
      ("builder/src/content/steps.js", "`\"${textOf(longest)}\". Nothing need change: the words are the lesson ` +"),
      ("builder/src/content/steps.js", "`designer's and stay as they are, and a list that does not fit is refused ` +"),
      ("builder/src/content/steps.js", "`with a roomier shape named.`"),
      (SSC, "What holds a list today: the practice templates' panel takes about 14 lines at 18pt, about 26 characters a line;")]),
    ("SC-DEC-08", "decision 8, in his words: success criteria stay on the board and never go on a worksheet; the home says so, the validator refuses a sheet's criteria, the worksheet engine refuses the panel, and a test holds it",
     [(PREF, "**They stay on the board, and never go on a worksheet.**"),
      ("worksheet-html/src/render.js", "`CRITERIA_NOT_ON_SHEETS: ${panels.join(\", \")} is a success-criteria (steps) ` +"),
      ("worksheet-html/src/worksheet.js", "for (const where of criteriaPanelsOn(sheet.spec)) {"),
      ("scripts/tests/test_lesson_design_contract.py", "def test_a_worksheet_never_carries_success_criteria():"),
      ("scripts/lesson-design-scaffold.py", "# (the teacher, 23 September 2026), so there is nothing to decide."),
      ("worksheet-html/test/page-furniture.test.js", "a sheet carrying a success-criteria panel is refused")]),
    ("SC-DEC-06", "decision 6: sentence stems are criteria in a lesson where children explain, discuss or write",
     [(PREF, "In a lesson where children explain, discuss or write, sentence stems are criteria too, inside a step or beside the steps")]),
    ("SC-DEC-09-15", "decisions 9 and 15 in the review page's cues, and their tests",
     [(PACKET, "\"name what the step produced, restate it or explain it (then it \""),
      (PACKET, "\"do next or what to look for? If so it stands, as `Same? Move \""),
      ("scripts/tests/test_success_criteria_fit_a_glance.py", "def test_a_question_step_is_asked_about_not_faulted():")]),
    ("SC-DEC-13", "decision 13: the investigation into fitting a very large list is separate and waits for his word; the slide designer makes it fit meanwhile",
     [(SSC, "the criteria are not reported back as unfittable, and never reshaped or cut to fit")]),
]

HOMES = [
    (PREF, "## Success Criteria", "HOME-SC-PREF"),
    (TV, "# 10. Success criteria", "HOME-SC-TV10"),
    (SKILL, "## Writing the Success Criteria", "HOME-SC-SKILL"),
]

Q = re.compile(r"«(.+?)»")
P = re.compile(r"`((?:agents|references|skills|commands|scripts|builder)/[^`]+)`")


LDC = "references/lesson-designer-components.md"
WVL = "references/working-wall-visual-language.md"
WP = "references/working-wall-preferences.md"
WCC = "references/working-wall-card-contracts.md"

# The words that now carry each changed row, taken from the change scripts.
NEW = {
    "SC-A02": [(PREF, "- **Success Criteria** — what a stuck child uses while working, form follows the task, the whole list on the board and never on a worksheet, the colour marks, and the draw-live marking that offers a reference to the wall.")],
    "SC-C01": [(PREF, "So success criteria can be how-to steps, a lookup table, a worked example, a labelled reference/diagram, or sentence stems; pick the form by what a child must glance at to succeed, and use more than one form when both genuinely help.")],
    "SC-C02": [(PREF, "**Criteria are what a child who gets stuck looks at and uses to do the task. A table of facts the child reads is a representation, not the criteria, even when the task uses it.**")],
    "SC-C07": [(LD, "**Criteria are what a child who gets stuck looks at and uses; `preferences.md` → Success Criteria owns what they are, their form (a table of facts is a representation; recognition is the one case where a labelled set is the criteria; sentence stems count), and how many words a step takes.**")],
    "SC-C10": [(SKILL, "its SC is the procedure as a numbered list — clear verb-first steps, one action per step;")],
    "SC-C11": [(SKILL, "Choosing the *form* of the success criteria (how-to steps, a reference table, a labelled set the child matches an instance against, a worked example or sentence stems) is governed by")],
    "SC-C18": [(OT, '"Compare the thousands digits first.", "If they are the same, compare the hundreds.", "Put < or > between the numbers, with the open side facing the greater number."')],
    "SC-C23": [(TPL, '{ "type": "steps", "steps": ["Change the ones digit to 0.", "Add 10.", "Mark halfway and your number.", "Round to the nearer ten. If it is halfway, round up."] }')],
    "SC-D04": [(PREF, "each normally one sentence with only the words it needs, and leave a step that is already clear alone. A second sentence is not a fault in itself, but one that only names what the step has just produced goes, because the panel has little enough room: `Change the ones digit to 0.` needs no `That's the ten below.`")],
    "SC-D06": [(PREF, "A condition that is part of a step stays in it, as a plain `If...` sentence or as a short question that tells the child what to do next (`Same? Move right.`); a fact to use, or a case that only sometimes comes up, is extra knowledge and goes to sticky knowledge or the teaching, not the steps. Use a lookup table when several cases are easier to scan there.")],
    "SC-D10": [(TV, "A step is normally one imperative sentence, or a short question that tells the child what to do next, written for a child using it alone once the teaching has moved on,")],
    "SC-D11": [(TV, "The user's own approved steps are almost all a single sentence, most of them four to ten words and none longer than about fourteen; that is a calibration of what clear-and-short looks like, not a target to reach. A second sentence is not a fault in itself (`If it is halfway, round up.` is part of the step: the rule that decides the choice), but a step that needs one is usually two steps, or is carrying an explanation the teaching already gave, and a second sentence that only names what the step has just produced goes, because the panel has little enough room.")],
    "SC-D14": [(TV, "> Change the ones digit to 0. / Add 10. / Mark halfway and your number. / Round to the nearer ten. If it is halfway, round up.")],
    "SC-D16": [(TV, "- **Write a condition so the child knows what to do next.** A short question that does is a good step (`Same? Move right.`), and so is an `If...` sentence (`If they are the same, compare the hundreds.`); what fails is a fragment that leaves the child to work out what it means.")],
    "SC-D21": [(TV, "- **Clear is not long.** The rounding list above got shorter as it got clearer:"), (TV, "and the teacher had found the longer version too wordy for what the class actually did.")],
    "SC-D26": [(TV, "and a Year 4 class stuck on 346 had nothing to act on. `Change the ones digit to 0.` then `Add 10.` says how, in words they own.")],
    "SC-D27": [(TV, "a case that comes up occasionally is extra knowledge, the kind sticky knowledge or the teaching carries, so it is taught where it comes up, in the model and the script, and left out of the steps.")],
    "SC-D31": [(PREF, "each normally one sentence with only the words it needs, and leave a step that is already clear alone."), (LD, "`teacher-voice.md` → Success criteria carries the user's own rewrites of short-but-vague steps, and `teaching-sequence-skill-based.md` → Writing the Success Criteria the mechanics.")],
    "SC-D33": [(LD, "carrying Concept 1's steps in their own words into a wrap-around Concept 2)")],
    "SC-D37": [(SKILL, "A short question that tells the child what to do next is not this fault (`Same? Move right.`).")],
    "SC-D38": [(SKILL, "The step carries teaching the child has already had, and a common sign is a second sentence inside one step that explains or restates it. A second sentence is not a fault in itself: one that is part of the step can stay (`If it is halfway, round up.` is the rule that decides the choice), and one that only names what the step produced goes.")],
    "SC-D40": [(SKILL, "an occasional case is extra knowledge, taught where it comes up through sticky knowledge or the teaching, not written under the steps. A condition that is part of a step stays in it, as a sentence or a short question: `If you have ten ones, exchange them for one ten.`")],
    "SC-E12": [(SKILL, "**Name a familiar action only when children genuinely know how to carry it out from earlier lessons.**")],
    "SC-F13": [(SKILL, "**When Concept 2 wraps around Concept 1's procedure, carry the steps it needs into Concept 2's SC in Concept 1's own words.**"), (SKILL, "Fix: carry the Concept 1 steps the Concept 2 problem needs into Concept 2's SC, at the point they are used, word for word as the class used them. A shortened or reworded version reads to a child as a new rule.")],
    "SC-H04": [(TPL, "Use it only for criteria being taught, compared or built with the class (a classification chart built live, the vertebrates table), never for criteria that did not fit beside the work.")],
    "SC-J01": [(PREF, "and the engine colours it the same way on the board and the working wall:")],
    "SC-J03": [(PREF, "Every taught word is green, every time, even when it also names a coloured part of the picture (`tens` beside a coloured tens column is green).")],
    "SC-J06": [(SSC, "because the wall copies the same marks and a mark added or dropped on the board shows the child a different colour in each place.")],
    "SC-K05": [(SSC, "There is no default or capacity in steps. Try the complete approved method"), (SSC, "past half, the repair is a different composition for the work beside them, never fewer criteria, and a `success-criteria` slide is only for criteria being taught, compared or built with the class, never for criteria that did not fit.")],
    "SC-K06": [(SSC, "When a composition does not hold the whole list, try a roomier one (the full height of one side, the question and the working space arranged around the panel); the criteria are not reported back as unfittable, and never reshaped or cut to fit.")],
    "SC-K13": [(TPL, "The Slide Designer's final `check-slide-design.js` gate treats `FIXED_CAPTION_CAPACITY` as a blocking composition diagnostic,"), (TPL, "`SUCCESS_CRITERIA_CAPACITY` only reports")],
    "SC-K43": [(TPL, "Check the nested type's own row before nesting it, and put a criteria table in a wide zone; a table stays a table and is never turned into lines.")],
    "SC-L01": [(PREF, "and the criteria are offered to the working wall. The wall designer decides whether there is a wall at all and what earns a place on it; criteria that go up are the exact same steps or reference the class used, never a different version.")],
    "SC-L04": [(LD, "the slide then carries the flipchart cue and the criteria are offered to the working wall, which puts up the exact same steps or reference if it takes them.")],
    "SC-L05": [(OT, "The slide carries the flipchart cue for it and it is offered to the working wall, which puts up the exact same steps or reference if it takes them.")],
    "SC-L12": [(WALL, "Success Criteria (whose draw-live marking offers a reference to your wall; the wall-worthy test still decides)")],
    "SC-N01": [(WSD, "13. **Never print success criteria on a worksheet.** They stay on the board, where children consult them while they work, and the teacher does not want them on any sheet or slip. `worksheet.successCriteriaRefs` is always empty,")],
    "SC-N02": [(WSD, "14. **Nor as a list in an `instruction`.** The engine refuses the `steps` panel on a sheet, and an instruction of three lines or more too,")],
    "SC-N03": [(WSD, "because a list written as an instruction prints as a grey paragraph, which is what a Year 4 rounding sheet shipped: seven lines at the foot of the page, indistinguishable from `Use the place value chart to help you.`")],
    "SC-N04": [(WSD, "- Confirm no success criteria are printed, as a panel or as an instruction carrying a list."), (WSD, "- Confirm every required visual and support from upstream is present.")],
    "SC-N05": [(WSD, "an answer. A reminder of a method they have already used, a prompt to check their work: yes,")],
    "SC-N06": [(PREF, "**Support comes after the work in the reading order, not before it.** A word bank, a reminder or a worked reference are things a child glances across at while working")],
    "SC-N07": [(PREF, "A reminder of a method they have already used and a prompt to check their work pass that test,")],
    "SC-N08": [(LDC, "**A worksheet never carries SC.** The criteria stay on the board (`preferences.md` → Success Criteria), so `worksheet.successCriteriaRefs` is empty on every sheet; the validator refuses any."),
               (LDC, "Check the board's criteria against the worksheet's own evidence and response, not only the board task they were written for, because a child working the sheet looks up at them."),
               ("scripts/design-review-packet.py", "return f\"Worksheet (done beside the success criteria shown above at {' and at '.join(places)})\"")],
    "SC-N10": [(OT, "`successCriteriaRefs` is always `[]`: success criteria are never printed on a worksheet, and the validator refuses any.")],
    "SC-N12": [("references/books-or-sheet.md", "apart from two things it takes out for itself: the room for answers, and anything marked `\"onSlip\": false`. Success criteria are on neither: they stay on the board.")],
    "SC-N13": [("references/worksheet-helpers.md", "the room for answers on its own, so that needs no marking. Success criteria are never on a sheet or a slip: the engine refuses the `steps` panel on a sheet.")],
    "SC-O04": [(WALL, "SC steps are never shortened, split or reworded to fit. If the full SC won't fit at the wall's fixed A3 size, make room: take the card's picture off unless the steps need it (about 106 characters a step instead of 62), drop non-SC extras, or carry the list in order over two cards of the same type and title when the wall has room for both; if it still will not fit, omit the card, but never reword the steps.")],
    "SC-O14": [(WVL, "When none of these gives an honest visual and the card does not pass the wall-worthy test as a text-led reference (`working-wall-card-contracts.md`), it stays on the slides rather than going up as text.")],
    "SC-O15": [(WVL, "Carry a visual (diagram, photo, or emoji cue), or leave the content on the slides, unless it passes the wall-worthy test as a text-led reference (`working-wall-card-contracts.md`), as the lesson's step-by-step success criteria often do.")],
    "SC-O19": [(WP, "≤ 60 characters beside a picture — \"Read the conjunction — what job does it do?\" fits; a longer step you write needs splitting, but a success-criteria step is copied word for word and the card makes room instead (no picture unless the steps need it, or the list over two cards).")],
    "SC-O23": [(WCC, "When the steps are the lesson's success criteria they are copied word for word, the same number of steps and the same colour marks, as on a worked-example card.")],
    "SC-Q01": [(REV, "- success criteria are what a child who gets stuck can use (actions, decisions, recognition categories, or sentence stems in a lesson where children explain or write) and match the taught performance, rather than a list of facts or a lesson outline."), (REV, "The opposite miss is real too: a step that explains a word or suggests content is carrying teaching, and so is a second sentence that restates the step or only names what it produced (a second sentence is not a fault in itself), and a step a stuck child can already act on is left as it is."), (REV, "A condition that is part of a step stays in it, as an `If...` sentence or a short question that tells the child what to do next (`Same? Move right.`), and extra knowledge belongs to sticky knowledge or the teaching;")],
    "SC-S12": [(PACKET, '"name what the step produced, restate it or explain it (then it "'), (PACKET, '"goes), is it a second step, or is it a condition that is part of the "'), (PACKET, '"step or a stem the child writes into (then it stays)?"'), (PACKET, '"do next or what to look for? If so it stands, as `Same? Move "')],
    "SC-S17": [("scripts/check-drawlive-handoff.py", "`flipchart: true`, and the working wall is offered a flagged reference.")],
    "SC-D09": [(PREF, "**Simple must still be intelligible.** Success criteria are short runnable actions (Success Criteria above).")],
    "SC-F18": [("references/teaching-sequence-task-centred.md", "attach the success criteria through `successCriteriaRefs`.")],
    "SC-H47": [("references/teaching-sequence-task-centred.md", "Set the Task put the question and the success criteria on the board at the start")],
    "SC-A06": [("references/teaching-sequence-task-centred.md", "The success criteria here are what a child who gets stuck looks at and uses to do the task itself (the steps of a fair-test plan, what a strong bridge needs, the stems for a clear opening paragraph), and they stay visible while children work, because they are what the child uses, not a recap of what was taught.")],
    "SC-A07": [("references/teaching-sequence-task-centred.md", "**Success criteria** are what a child who gets stuck uses to do the task, kept visible throughout.")],
    "SC-C14": [("references/teaching-sequence-task-centred.md", "the steps or sentence stems a child can use when it's a product or a piece of writing.")],
    "SC-F17": [("references/teaching-sequence-task-centred.md", "Write what a stuck child uses once, as success criteria, and attach it through `successCriteriaRefs`.")],
    "SC-B01": [("references/teaching-sequence-content-based.md", "When children need one, show what a child who gets stuck can use (the decisions to make, the steps, or sentence stems) and keep it visible during Practise.")],
    "SC-K12": [(TPL, "Five one-line steps need about 3.25″ inside a criteria panel.")],
    "SC-K38": [(TPL, "and a short fourth piece in the bottom strip, which holds no criteria list at 18pt: put steps in a practice template's panel or the half-width side (`slide-success-criteria.md`).")],
    "SC-N22": [(PREF, "the same page with the columns the other way round gives the task its full run.")],
    "SC-P04": [("references/adaptive-adaptation.md", "sharper success criteria (written into the task, never printed on the sheet as a criteria panel)")],
}

CHANGED = {}
for raw in (REPO / "plans" / LEDGER).read_text(encoding="utf-8").splitlines():
    m = re.match(r"^\| (SC-[A-Z]\d{2}) \|", raw)
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

unused = set(WHY) - set(CHANGED)
assert not unused, f"decisions named for rows that did not change: {sorted(unused)}"

if True:
    build(
        ledger=LEDGER,
        prefix="SC",
        changed=CHANGED,
        added=ADDED,
        homes=HOMES,
        pins="scripts/tests/success_criteria_ledger_pins.json",
        mapping="2026-09-23-success-criteria-mapping.md",
        title="Success criteria mapping: where every ledger row went",
        snapshot="4.2.287 79426973, changed to 4.2.288 (uncommitted)",
        intro=[
            "Every row of `2026-09-23-success-criteria-ledger.md` (built on the 4.2.287",
            "working tree), with what happened to it in 4.2.288. \"Unchanged in place\" rows",
            "are word for word where the ledger found them. Every other row names the",
            "decision that changed it and the paragraph that now carries its words; a",
            "retired phrase is listed as gone. Built and checked by",
            "`streamline-tools/sc-change/build_sc_mapping.py`. The same list is pinned by",
            "`scripts/tests/success_criteria_ledger_pins.json`.",
        ],
    )
