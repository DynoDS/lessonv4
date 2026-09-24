"""The success-criteria mapping follows the first check's repairs (r1 to r5)."""
from pathlib import Path

M = Path(__file__).resolve().with_name("build_sc_mapping.py")
t = M.read_text(encoding="utf-8")


def swap(old: str, new: str) -> None:
    global t
    assert t.count(old) == 1, (t.count(old), old[:100])
    t = t.replace(old, new)


# New rows the repairs reached.
swap('    "SC-S17": "code, decision 5: the check\'s note says the wall is offered the reference",\n}',
     '    "SC-S17": "code, decision 5: the check\'s note says the wall is offered the reference",\n'
     '    "SC-A06": "decision 6 in the task-centred route (the change check\'s 2a): the criteria are what a child who gets stuck uses, not the standard aimed at",\n'
     '    "SC-A07": "decision 6 in the task-centred route, as A06",\n'
     '    "SC-C14": "decision 6: steps or sentence stems for a product or a piece of writing, not a feature checklist",\n'
     '    "SC-F17": "decision 6 in the task-centred contract line: what a stuck child uses, written once as the criteria",\n'
     '    "SC-B01": "decision 6 in the content route (the change check\'s 2a): what a stuck child can use, not the features of a successful performance",\n'
     '    "SC-K12": "the long-list investigation\'s measurement: five one-line steps need about 3.25 inches inside a panel",\n'
     '    "SC-K38": "the long-list investigation\'s measurement: the bottom strip holds no criteria list at 18pt",\n'
     '    "SC-N22": "decision 8: the kept story no longer shows the steps on the sheet as the answer",\n'
     '    "SC-P04": "decision 8 reaching Greater Depth, as P01",\n'
     '}')

swap('    "SC-S17": [("scripts/check-drawlive-handoff.py", "`flipchart: true`, and the working wall is offered a flagged reference.")],\n}',
     '    "SC-S17": [("scripts/check-drawlive-handoff.py", "`flipchart: true`, and the working wall is offered a flagged reference.")],\n'
     '    "SC-A06": [("references/teaching-sequence-task-centred.md", "The success criteria here are what a child who gets stuck looks at and uses to do the task itself (the steps of a fair-test plan, what a strong bridge needs, the stems for a clear opening paragraph), and they stay visible while children work, because they are what the child uses, not a recap of what was taught.")],\n'
     '    "SC-A07": [("references/teaching-sequence-task-centred.md", "**Success criteria** are what a child who gets stuck uses to do the task, kept visible throughout.")],\n'
     '    "SC-C14": [("references/teaching-sequence-task-centred.md", "the steps or sentence stems a child can use when it\'s a product or a piece of writing.")],\n'
     '    "SC-F17": [("references/teaching-sequence-task-centred.md", "Write what a stuck child uses once, as success criteria, and attach it through `successCriteriaRefs`.")],\n'
     '    "SC-B01": [("references/teaching-sequence-content-based.md", "When children need one, show what a child who gets stuck can use (the decisions to make, the steps, or sentence stems) and keep it visible during Practise.")],\n'
     '    "SC-K12": [(TPL, "Five one-line steps need about 3.25″ inside a criteria panel.")],\n'
     '    "SC-K38": [(TPL, "The bottom strip holds no criteria list at 18pt: put steps in a practice template\'s panel or the half-width side (`slide-success-criteria.md`).")],\n'
     '    "SC-N22": [(PREF, "the same page with the columns the other way round gives the task its full run.")],\n'
     '    "SC-P04": [("references/adaptive-adaptation.md", "sharper success criteria (written into the task, never printed on the sheet as a criteria panel)")],\n'
     '}')

# Rows whose new words moved again.
swap('(WSD, "- Confirm no success criteria or method steps are printed, as a panel or as an instruction carrying a list.")',
     '(WSD, "- Confirm no success criteria are printed, as a panel or as an instruction carrying a list.")')
swap("criteria that go up are the exact same steps the class used, never a different version.\")]",
     "criteria that go up are the exact same steps or reference the class used, never a different version.\")]")
swap('"SC-L04": [(LD, "the slide then carries the flipchart cue and the criteria are offered to the working wall, which puts up the exact same steps if it takes them.")]',
     '"SC-L04": [(LD, "the slide then carries the flipchart cue and the criteria are offered to the working wall, which puts up the exact same steps or reference if it takes them.")]')
swap('"SC-L05": [(OT, "The slide carries the flipchart cue for it and it is offered to the working wall, which puts up the exact same steps if it takes them.")]',
     '"SC-L05": [(OT, "The slide carries the flipchart cue for it and it is offered to the working wall, which puts up the exact same steps or reference if it takes them.")]')
swap("A step that needs a second sentence is usually two steps, or is carrying an explanation the teaching already gave; a second sentence that only names what the step has just produced goes, because the panel has little enough room.\")]",
     "A second sentence is not a fault in itself (`If it is halfway, round up.` gives a condition the step always meets), but a step that needs one is usually two steps, or is carrying an explanation the teaching already gave, and a second sentence that only names what the step has just produced goes, because the panel has little enough room.\")]")
swap("take the card's picture off (about 106 characters a step instead of 62), drop non-SC extras, or carry the list in order over two cards of the same type and title; if it still will not fit, omit the card, but never reword the steps.\")]",
     "take the card's picture off unless the steps refer to it (about 106 characters a step instead of 62), drop non-SC extras, or carry the list in order over two cards of the same type and title when the wall has room for both; if it still will not fit, omit the card, but never reword the steps.\")]")
swap("""    "SC-S12": [(PACKET, '"restate the step or name what it produced (then it goes), or "'), (PACKET, '"do next or what to look for? If so it stands, as `Same? Move "')],""",
     """    "SC-S12": [(PACKET, '"name what the step produced, restate it or explain it (then it "'), (PACKET, '"meets or a stem the child writes into (then it stays)?"'), (PACKET, '"do next or what to look for? If so it stands, as `Same? Move "')],""")
swap("""     [(PACKET, "\\"restate the step or name what it produced (then it goes), or \\""),""",
     """     [(PACKET, "\\"name what the step produced, restate it or explain it (then it \\""),""")

# Gap 1: the short forms barred everywhere, programs included; gap 2: the
# code the check found held by nothing.
swap('    "SC-S12": [(PACKET, "question-fragment condition; would an If...", "local")],\n}',
     '    "SC-S12": [(PACKET, "question-fragment condition")],\n'
     '    "SC-A06": [("references/teaching-sequence-task-centred.md", "the standard for the task itself")],\n'
     '    "SC-A07": [("references/teaching-sequence-task-centred.md", "is the standard for the task, kept visible throughout")],\n'
     '    "SC-D44": [(TV, "Same digits? Move right.")],\n'
     '}')
swap('    "SC-K05": [(SSC, "Five short steps is a useful default"), (SSC, "show fewer criteria on the slide or give them that slide of their own")],',
     '    "SC-K05": [(SSC, "Five short steps"), (SSC, "fewer criteria on this slide"), (SSC, "show fewer criteria on the slide or give them that slide of their own")],')
swap('    "SC-E12": [(SKILL, "Name a familiar or just-taught action")],',
     '    "SC-E12": [(SKILL, "just-taught")],')
swap('    "SC-D40": [(SKILL, "an occasional case goes under the steps as a note")],',
     '    "SC-D40": [(SKILL, "under the steps as a note")],')
swap('    "SC-N01": [(WSD, "Include the exact concise criteria when the sheet must stand independently")],',
     '    "SC-N01": [(WSD, "Include the exact concise criteria when the sheet must stand independently"), (WSD, "Include success criteria only when the upstream worksheet decision")],')
swap('    "SC-J03": [(PREF, "the picture wins, then the taught word")],',
     '    "SC-J03": [(PREF, "the picture wins")],')
swap('    "SC-K43": [(TPL, "give the same criteria as lines")],',
     '    "SC-K43": [(TPL, "same criteria as lines")],')

# The code pins, with phrases that are only in the code they hold.
swap('      ("worksheet-html/src/render.js", "throw new Error("),',
     '      ("worksheet-html/src/render.js", "`CRITERIA_NOT_ON_SHEETS: ${panels.join(\\", \\")} is a success-criteria (steps) ` +"),\n'
     '      ("worksheet-html/src/worksheet.js", "for (const where of criteriaPanelsOn(sheet.spec)) {"),\n'
     '      ("scripts/tests/test_lesson_design_contract.py", "def test_a_worksheet_never_carries_success_criteria():"),\n'
     '      ("scripts/lesson-design-scaffold.py", "# (the teacher, 23 September 2026), so there is nothing to decide."),')
swap('ADDED = [\n',
     'ADDED = [\n'
     '    ("SC-DEC-12", "decision 12 in the wall\'s program: the overflow messages the wall designer follows never offer to shorten a success-criteria step",\n'
     '     [("working-wall-html/src/layout.js", "otherwise remove an item or shorten the longest, never a success-criteria step, which is copied word for word"),\n'
     '      ("working-wall-html/src/layout.js", "a success-criteria step is never reworded, so its card makes room instead (the picture off, or the list over two cards)")]),\n'
     '    ("SC-DEC-11-FIT", "decisions 3, 11 and 13 with the long-list investigation: the capacity cue is not a fault to flag before teaching, and the 18 to 19pt warning names a roomier composition, not shorter words",\n'
     '     [("builder/src/content/capacity.js", "`limit). Nothing was removed.`,"),\n'
     '      ("builder/build.js", "// SUCCESS_CRITERIA_CAPACITY is a cue to look, not a fault (the teacher\'s"),\n'
     '      ("builder/src/content/steps.js", "`are the lesson designer\'s and stay as they are; for more room use a roomier ` +"),\n'
     '      (SSC, "What holds a list today: the practice templates\' panel takes about 14 lines at 18pt, about 26 characters a line;")]),\n')
M.write_text(t, encoding="utf-8")
print("mapping follows the repairs")
