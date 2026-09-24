"""The success-criteria mapping follows the second check's repairs (r11 to r14),
and pins what that check found held by nothing (its finding 6).

After it ran, one pin was pointed by hand at r13's new heading line: SC-N08's
"return f\"Worksheet (... shown above at {' and at '.join(places)})\""."""
from pathlib import Path

M = Path(__file__).resolve().with_name("build_sc_mapping.py")
t = M.read_text(encoding="utf-8")


def swap(old: str, new: str) -> None:
    global t
    assert t.count(old) == 1, (t.count(old), old[:100])
    t = t.replace(old, new)


TC = "references/teaching-sequence-task-centred.md"

# The wall files' names are defined further down; ADDED, above them, now needs them.
swap('WALL = "agents/working-wall-designer.md"\n',
     'WALL = "agents/working-wall-designer.md"\n'
     'WP = "references/working-wall-preferences.md"\n'
     'WCC = "references/working-wall-card-contracts.md"\n')
swap('               [("builder/src/content/capacity.js", "the panel holds ` +", "local")]),\n',
     '               [("builder/src/content/capacity.js", "the panel holds ` +", "local"),\n'
     '                ("builder/src/content/steps.js", "such as the half-width split with the criteria down one whole side")]),\n')

# Three ledger rows the repairs reached.
swap('    "SC-S17": "code, decision 5: the check\'s note says the wall is offered the reference",\n',
     '    "SC-S17": "code, decision 5: the check\'s note says the wall is offered the reference",\n'
     '    "SC-D09": "decision 10 (the second check\'s finding 5): Slide Philosophy\'s copy points home, as Written Voice\'s does",\n'
     '    "SC-F18": "decision 6 in the task-centred output line (the second check\'s finding 7): the success criteria are attached, not a standard",\n'
     '    "SC-H47": "decision 6 (the second check\'s finding 7): Set the Task puts the question and the success criteria on the board",\n')
swap('    "SC-S17": [("scripts/check-drawlive-handoff.py", "`flipchart: true`, and the working wall is offered a flagged reference.")],\n',
     '    "SC-S17": [("scripts/check-drawlive-handoff.py", "`flipchart: true`, and the working wall is offered a flagged reference.")],\n'
     '    "SC-D09": [(PREF, "**Simple must still be intelligible.** Success criteria are short runnable actions (Success Criteria above).")],\n'
     f'    "SC-F18": [("{TC}", "attach the success criteria through `successCriteriaRefs`.")],\n'
     f'    "SC-H47": [("{TC}", "Set the Task put the question and the success criteria on the board at the start")],\n')

# Words the repairs changed inside rows already mapped.
swap("(`If it is halfway, round up.` gives a condition the step always meets), but",
     "(`If it is halfway, round up.` is part of the step: the rule that decides the choice), but")
swap("one that gives a condition the step always meets can stay (`If it is halfway, round up.`), and",
     "one that is part of the step can stay (`If it is halfway, round up.` is the rule that decides the choice), and")
swap("""(PACKET, '"meets or a stem the child writes into (then it stays)?"')""",
     """(PACKET, '"goes), is it a second step, or is it a condition that is part of the "'), (PACKET, '"step or a stem the child writes into (then it stays)?"')""")
swap("take the card's picture off unless the steps refer to it", "take the card's picture off unless the steps need it")
swap("card makes room instead (no picture, or the list over two cards).\")]",
     "card makes room instead (no picture unless the steps need it, or the list over two cards).\")]")
swap("say instead that its card needs room (its picture off, or its list over two cards).\")], []),",
     "say instead that its card needs room (its picture off unless its steps need it, or its list over two cards).\")], []),")
swap('"SC-K38": [(TPL, "The bottom strip holds no criteria list at 18pt: put steps in',
     '"SC-K38": [(TPL, "and a short fourth piece in the bottom strip, which holds no criteria list at 18pt: put steps in')
swap('"a success-criteria step is never reworded, so its card makes room instead (the picture off, or the list over two cards)")',
     '"a success-criteria step is never reworded, so its card makes room instead (the picture off unless the steps need it, or the list over two cards)")')
swap('      ("builder/src/content/steps.js", "`are the lesson designer\'s and stay as they are; for more room use a roomier ` +"),\n',
     '      ("builder/src/content/steps.js", "`success criteria set at ${sharedFont}pt: within the 18pt floor, below the ` +"),\n'
     '      ("builder/src/content/steps.js", "`\\"${textOf(longest)}\\". Nothing need change: the words are the lesson ` +"),\n'
     '      ("builder/src/content/steps.js", "`designer\'s and stay as they are, and a list that does not fit is refused ` +"),\n')

# Retired this round, barred.
swap('    "SC-D44": [(TV, "Same digits? Move right.")],\n}',
     '    "SC-D44": [(TV, "Same digits? Move right.")],\n'
     '    "SC-D11": [(TV, "gives a condition the step always meets")],\n'
     '    "SC-D38": [(SKILL, "one that gives a condition the step always meets")],\n'
     f'    "SC-F18": [("{TC}", "attach the exact standard")],\n'
     f'    "SC-H47": [("{TC}", "the question and the standard on the board")],\n'
     '    "SC-K12": [(TPL, "cannot hold 5 steps at full size")],\n'
     '    "SC-K38": [(TPL, "and success-criteria steps. The bottom strip")],\n'
     '    "SC-O04": [(WALL, "The 2-line cap exception above"), (WALL, "unless the steps refer to it")],\n'
     '}')
swap('    "SC-O04": [(WALL, "The 2-line cap exception above")],\n', '')
swap('               [("references/worksheet-helpers/catalogue.md", "#### `steps`", "local")]),\n',
     '               [("references/worksheet-helpers/catalogue.md", "#### `steps`", "local"),\n'
     '                ("worksheet-html/src/helpers/text.js", "or the steps of its method, leave them"),\n'
     '                ("worksheet-html/src/render.js", "Success criteria, and a method\'s steps, stay on the board")]),\n')

# The second check's finding 6: what was held by nothing, and the new code.
swap('               [(VALIDATOR, "\\"child meeting the criteria would write it, using the word; a taught \\"")],\n',
     '               [(VALIDATOR, "\\"child meeting the criteria would write it, using the word; a taught \\""),\n'
     '                (VALIDATOR, "\\"word stays in the criteria, and a class shown a model that would fail \\""),\n'
     '                (VALIDATOR, "\\"the standard is being marked against something it was never shown\\",")],\n')
swap('ADDED = [\n',
     'ADDED = [\n'
     '    ("SC-DEC-12-WALL", "decision 12, with decisions 3 and 5, on the wall (the second check\'s findings 4, 6 and 9): a criteria step or table is copied whole and word for word, its card makes room (the picture off unless the steps need it, or two cards), and two cards is the one exception to a second teaching card",\n'
     '     [(WP, "shorten faithful display text (never a success-criteria step, which is copied word for word)"),\n'
     '      (WALL, "a success-criteria step is the exception (Rules That Never Change)."),\n'
     '      (WALL, "A success-criteria table is never cut, only split over two cards."),\n'
     '      (WP, "A success-criteria table only splits: every row and word goes up, as the class used it."),\n'
     '      (WCC, "the one exception is a success-criteria list or table too long for one card, carried in order over two cards of the same title, which is one job split for room."),\n'
     '      ("working-wall-html/src/layout.js", "unless the table is the lesson\'s success criteria, which are copied word for word (the card makes room instead, or the table goes over two cards)"),\n'
     '      ("working-wall-html/src/layout.js", "a success-criteria table keeps every row and word, so its card makes room instead, or the table goes over two cards.")]),\n'
     '    ("SC-DEC-11-MSG", "decisions 3, 11 and 13 in the builder\'s messages (the second check\'s findings 3 and 6): the fit summary keeps criteria words, the capacity numbers are a cue, a fitting panel is not flagged, and the panel refusal names the criteria slide\'s three uses",\n'
     '     [("builder/build.js", "`except in a criteria panel, whose words stay and whose lever is a roomier composition.`"),\n'
     '      ("builder/src/content/capacity.js", "`back of the room beside the work (${SC_MANY_ITEMS} is a cue to look, not a ` +"),\n'
     '      ("builder/src/content/capacity.js", "`the back of the room beside the work (${SC_LONG_TOTAL_CHARS} is a cue to ` +"),\n'
     '      ("builder/src/content/capacity.js", "`look, not a limit). Nothing was shortened.`,"),\n'
     '      ("builder/src/success-criteria-panel.js", "slide is only for criteria being taught, compared or built. ` +"),\n'
     '      ("scripts/tests/test_success_criteria_fit_a_glance.py", "def test_a_panel_that_fits_is_not_flagged_to_check_before_teaching():")]),\n'
     '    ("SC-DEC-08-ENGINE", "decision 8 in his words, in the worksheet engine (the second check\'s findings 1 and 2): the list refusal leaves success criteria off and sends a method\'s steps a child works through to their question; a panel on an auto sheet is refused before a shape is chosen, never priced as content or a reason to omit a sheet; the template never asks for sheet criteria",\n'
     '     [("worksheet-html/src/helpers/text.js", "\'are the lesson\\\\\'s success criteria, leave them off: they stay on the \' +"),\n'
     '      ("worksheet-html/src/helpers/text.js", "\'works through to reach the answer, they are part of its question: put \' +"),\n'
     '      ("worksheet-html/src/render.js", "// Success criteria stay on the board. The teacher does not want them on any"),\n'
     '      ("worksheet-html/src/worksheet.js", "function autoSheetCriteriaPanels(worksheet) {"),\n'
     '      ("worksheet-html/scripts/check-worksheet.js", "for (const found of autoSheetCriteriaPanels(worksheet)) {"),\n'
     '      ("worksheet-html/scripts/build-worksheet.js", "const panels = autoSheetCriteriaPanels(worksheet);"),\n'
     '      ("worksheet-html/test/omit-unfittable.test.js", "a criteria panel is refused before the fit, and never costs the pack a sheet"),\n'
     '      ("worksheet-html/test/omit-unfittable.test.js", "the preflight names a panel on an auto sheet and measures the page without it"),\n'
     '      ("scripts/tests/test_lesson_design_scaffold.py", "def test_a_generated_worksheet_is_scaffolded_without_success_criteria():"),\n'
     '      ("scripts/design-review-packet.py", "def worksheet_heading(design: dict) -> str:")]),\n')
M.write_text(t, encoding="utf-8")
print("mapping follows the second check's repairs")
