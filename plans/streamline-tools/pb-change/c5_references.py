"""The playbook release (10A), step 5: the references the run is sent to
(change plan section 1, decision 6 with his answers to the plan's questions 2
and 3; section 2, settled items a, d and e).

The edit-in-place guide (decision 6, "y"): the edit is found in the lesson's
own working folder and made in each file that shows it; a change lands on every
resource that shows it and nothing else changes; a change to words children see
is made in the lesson's design file too, with its check re-run (question 3,
"yes"); and the fixed files are saved again, replacing the ones this lesson
saved, except a file changed on the drive since, which the teacher is asked
about first (question 2, "yes"). The "decide who is right" slide stays as a
plain example (copied to the log by `c1_stories_first.py`).

The gap protocol's list of specialists (U16), the helper route's history and
its stale inspection (J26, J30, J32), the cloud guide's stories (T09) and the
setup guide's dates (V12, V17)."""
from _patch import CD, CS, GAP, HR, RIP, replace_once

# Decision 6, item 4: the mechanism the promise needs. The lesson's folder is
# found by its title; each file that shows the change is edited; each resource
# rebuilds through the same command the run used.
replace_once(RIP, """Open the existing `lesson.json` in the lesson's working folder and change exactly the slides the teacher named. Then re-run only the builders whose input changed: the slide-builder for `lesson.json`, the worksheet-builder for `worksheet.json`, and the same for any other sidecar file the change touched. You are not starting a new run, so you do not set up a fresh working folder or archive the old one; you edit the files already there.""",
             """Open the lesson's working folder (`[OUTPUT_DIR]/working/[lesson-slug]`, found by the lesson's title; ask which when more than one could be meant) and change exactly what the teacher named, in each file that shows it (`lesson.json`, `worksheet.json`, `working-wall.json`, `stick-in-sheets.json`). Then rebuild only the resources whose file changed, each with `run-fixed-resource.py` and the kind, folders and lesson name its build used (`slides`, `worksheets`, `wall`, `stick-in`; its summary in `build-results/` holds them). You are not starting a new run, so you do not set up a fresh working folder or archive the old one; you edit the files already there.""")

# Decision 6, item 3, and his answers to the plan's questions 2 and 3.
replace_once(RIP, """A targeted edit to the JSON keeps every slide the teacher didn't mention exactly as it was, which is the whole reason to edit rather than rebuild.

""", """A targeted edit to the JSON keeps every slide the teacher didn't mention exactly as it was, which is the whole reason to edit rather than rebuild.

## A change lands on every resource that shows it

A change the teacher asks for lands on every resource that shows it, and nothing else changes. Renaming the character to Maya changes the slides, the speaker notes, the worksheet and its answer key, and any wall card or stick-in piece that carries the name; every other slide stays exactly as it was.

A change to words children see is made in `lesson-design.json` too, because the next lesson reads it for the exact words children saw; nothing is redesigned. Re-run its check, `"[PYTHON]" "[PLUGIN_ROOT]/scripts/validate-lesson-design.py" "[WORKING_DIR]/lesson-design.json" "[WORKING_DIR]/photo-requirements.json"`, and require `LESSON_DESIGN_OK`.

When `filing.txt` in the working folder says `DELIVERY=folder` or `DELIVERY=sorted`, save the rebuilt files again with the `run-fixed-resource.py deliver` step the lesson's save used (`build-results/delivery.json` holds the command it ran), adding `--revision`. Each fixed file replaces the one this lesson saved there, except a file on the drive that is no longer the one it saved: that one is held back on a `DELIVERY_HELD_BACK:` line. Ask the teacher before saving over it, and on their yes save it again without `--revision`.

""")

# Settled item a (U16): the run no longer launches the slide builder, and the
# slide decorator is a downstream specialist too.
replace_once(GAP, "For every downstream specialist in the pipeline - slide-designer, slide-builder, worksheet-designer,",
             "For every downstream specialist in the pipeline - slide-designer, slide-decorator, worksheet-designer,")

# Settled item e (J26): the history leaves.
replace_once(HR, """There is no writable checkout to resolve, nothing to version, and nothing to
commit or push. If a lesson is holding a helper open for any of those reasons,
that is the old route and it no longer applies.""", """There is no writable checkout to resolve, nothing to version, and nothing to
commit or push.""")

# Settled item e (J30): the rule stays and its history becomes the reason.
replace_once(HR, """Do not run a second copy from here: this route is read
only on a `build`, and a check written where only some runs can see it is how
the substitutes on an ordinary run went unchecked in the first place.""",
             """Do not run a second copy from here: this route is read
only on a `build`, and a check written where only some runs can see it goes
unrun on the rest.""")

# Settled item a (J32): the resource inspection was retired. Who reads the line
# now is named as still open, not written in.
replace_once(HR, """  Do not invent an ignored property to satisfy an assertion. Delivery prints
  these as `HELPER_VISUAL_REVIEW` for the existing resource inspection; they
  are not mechanically certified.""", """  Do not invent an ignored property to satisfy an assertion. Delivery prints
  these as `HELPER_VISUAL_REVIEW`; they are not mechanically certified.""")

# Settled item d (T09): the dates and the deck leave; the reason stays, with a
# plain present-tense example.
replace_once(CD, """   check the joined length before creating the blob. Reading it whole first
   truncated silently and cost a wasted blob (14 September 2026). A cut-off
   read can also look complete: on 13 September the middle of the RE deck came
   back as the words "474280 bytes omitted", was decoded and posted, and the
   teacher got a PowerPoint that would not open. `lesson.json` records each""",
             """   check the joined length before creating the blob. Reading it whole
   truncates silently, and a cut-off read can look complete: a middle that
   comes back as the words "bytes omitted" is decoded and posted, and the
   teacher gets a PowerPoint that will not open. `lesson.json` records each""")

# Settled item d (V12): the date goes; the three hosts and what each can do stay.
replace_once(CS, """because a lesson needs separate AI workers and only those two can start them
(each proved on 13 September 2026):""", """because a lesson needs separate AI workers and only those two can start them:""")

# Settled item d (V17): the dated check goes; what happens without a token stays.
replace_once(CS, """each lesson with no drawings and a note saying so. Checked against the real
private library on 20 September 2026: 404 without, 200 with.""",
             """each lesson with no drawings and a note saying so.""")
print("REFERENCES_OK")
